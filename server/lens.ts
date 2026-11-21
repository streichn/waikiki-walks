// Supabase Edge Function: lens ("What am I looking at?")
// Receives a photo plus the stops the phone thinks are in view (from GPS and compass),
// and asks a vision model to choose among ONLY those stops, or say none match.
// Constraining the choice to the book's stops keeps answers tied to Veneeta's text.
// Deploy: supabase functions deploy lens --no-verify-jwt
// Secrets: ANTHROPIC_API_KEY, and optionally LENS_SALT (any long random text) and the caps below.
// --no-verify-jwt is needed because guests call with the publishable key, which is not a JWT.
// The function checks a signed-in walker's token itself, and caps photo checks per day
// (migration 003_security_and_limits.sql) so nobody can run up the paid vision service.
import { createClient } from 'npm:@supabase/supabase-js@2';

type Candidate = { id: string; title: string; distance: number; summary?: string };

// Limits: the app sends one small JPEG (quality 0.4) and at most 5 candidates. Anything
// bigger is refused before it reaches the paid vision API. The photo is never stored here.
const MAX_IMAGE_CHARS = 2_000_000; // about 1.5 MB of JPEG as base64
const MAX_CANDIDATES = 5;
const notChecked = { stopId: null, reason: 'Could not check the photo just now.' };
const resting = { stopId: null, reason: 'Photo checks are resting for today. Location and compass still work.' };

// Daily caps (Hawaii time). A walker on a whole walk takes a few photos, so these are generous
// for people and small for a script. Guests share a cap per network, so a hotel's wifi
// gets a bigger allowance than one signed-in account.
const CAP_USER = Number(Deno.env.get('LENS_CAP_USER') ?? 60);
const CAP_GUEST = Number(Deno.env.get('LENS_CAP_GUEST') ?? 40);
const CAP_ALL = Number(Deno.env.get('LENS_CAP_ALL') ?? 1500);

const url = Deno.env.get('SUPABASE_URL')!;
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/** Who is asking, as a counter key. A guest's network address is hashed with a secret and
 *  the date, so the count can't be traced back to an address and changes every day. */
async function bucketFor(req: Request): Promise<string> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token.split('.').length === 3) {
    const { data } = await admin.auth.getUser(token);
    if (data?.user?.id) return `u:${data.user.id}`;
  }
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const salt = Deno.env.get('LENS_SALT') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return `g:${await sha256(`${ip}|${day}|${salt}`)}`;
}

/** Counts this check against the walker's cap and the overall cap. If the counter can't be
 *  reached, refuse rather than spend: the app falls back to location and compass. */
async function allowed(bucket: string): Promise<boolean> {
  const cap = bucket.startsWith('u:') ? CAP_USER : CAP_GUEST;
  const mine = await admin.rpc('lens_take', { p_bucket: bucket, p_cap: cap });
  if (mine.error || mine.data !== true) return false;
  const all = await admin.rpc('lens_take', { p_bucket: 'all', p_cap: CAP_ALL });
  return !all.error && all.data === true;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  let body: { image?: unknown; candidates?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json(notChecked, { status: 400 });
  }
  const image = typeof body.image === 'string' ? body.image : '';
  const candidates = (Array.isArray(body.candidates) ? body.candidates : [])
    .filter((c: any): c is Candidate => typeof c?.id === 'string' && typeof c?.title === 'string')
    .slice(0, MAX_CANDIDATES)
    .map((c) => ({ id: c.id.slice(0, 40), title: c.title.slice(0, 120), distance: Math.round(Number(c.distance) || 0), summary: typeof c.summary === 'string' ? c.summary.slice(0, 400) : '' }));
  if (!image || !candidates.length) return Response.json({ stopId: null, reason: 'Nothing nearby to compare.' });
  if (image.length > MAX_IMAGE_CHARS) return Response.json(notChecked, { status: 413 });
  // Base64 JPEGs start with "/9j/". Anything else is not a photo from the app.
  if (!image.startsWith('/9j/')) return Response.json(notChecked, { status: 400 });
  if (!(await allowed(await bucketFor(req)))) return Response.json(resting, { status: 429 });

  const list = candidates.map((c, i) => `${i + 1}. [${c.id}] ${c.title} (${c.distance} m away). ${c.summary ?? ''}`).join('\n');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-5-5',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            {
              type: 'text',
              text: `A walker in Waikīkī took this photo. Which of these places from a walking-tour book is it most likely showing?\n${list}\n\nReply as JSON: {"stopId": "<id or null>", "reason": "<one short sentence>"}. Use null if none fits.`,
            },
          ],
        },
      ],
    }),
  });
  // On any failure say so plainly (stopId null). The app then shows its location-and-compass
  // guess labelled "Probably in view", never as a photo match.
  if (!res.ok) return Response.json(notChecked);
  const out = await res.json();
  try {
    const text = out.content?.[0]?.text ?? '{}';
    const parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    const ok = candidates.some((c) => c.id === parsed.stopId);
    return Response.json({ stopId: ok ? parsed.stopId : null, reason: typeof parsed.reason === 'string' ? parsed.reason.slice(0, 200) : '' });
  } catch {
    return Response.json(notChecked);
  }
});
