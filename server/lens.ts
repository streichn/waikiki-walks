// Supabase Edge Function: lens ("What am I looking at?")
// Receives a photo plus the stops the phone thinks are in view (from GPS and compass),
// and asks a vision model to choose among ONLY those stops, or say none match.
// Constraining the choice to the book's stops keeps answers tied to Veneeta's text.
// Deploy: supabase functions deploy lens --no-verify-jwt   (set ANTHROPIC_API_KEY as a secret)

type Candidate = { id: string; title: string; distance: number; summary?: string };

// Limits: the app sends one small JPEG (quality 0.4) and at most 5 candidates. Anything
// bigger is refused before it reaches the paid vision API. The photo is never stored here.
const MAX_IMAGE_CHARS = 2_000_000; // about 1.5 MB of JPEG as base64
const MAX_CANDIDATES = 5;
const notChecked = { stopId: null, reason: 'Could not check the photo just now.' };

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
