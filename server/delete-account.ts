// Supabase Edge Function: delete-account
// Deploy: supabase functions deploy delete-account
//
// Apple requires in-app account deletion for apps that create accounts (Guideline 5.1.1(v)),
// and apps that use Sign in with Apple must also revoke the walker's Apple tokens (TN3194).
// Google Play requires the account and its data to be deleted, not just deactivated.
//
// Flow:
//   1. The app sends the walker's Supabase session (Authorization header).
//   2. For Apple accounts, the app also sends a fresh, single-use Apple authorization code,
//      obtained by asking the walker to confirm with Apple just before deleting.
//      We exchange it at /auth/token for a refresh token, then revoke it at /auth/revoke.
//      We never store Apple tokens.
//   3. We delete the auth user. profiles, walk_progress and favorites are removed by
//      "on delete cascade" (server/schema.sql), so no table-by-table deletes are needed.
//
// Secrets (set with `supabase secrets set`, never in the app):
//   APPLE_TEAM_ID      10-character Team ID from the Apple Developer account
//   APPLE_KEY_ID       Key ID of a "Sign in with Apple" key (.p8)
//   APPLE_PRIVATE_KEY  contents of that .p8 file
//   APPLE_CLIENT_ID    the app's bundle ID: com.streicherneurology.waikikiwalks
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { importPKCS8, SignJWT } from 'npm:jose@5';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Apple's client secret is a short-lived ES256 JWT signed with the Sign in with Apple key. */
async function appleClientSecret(clientId: string) {
  const teamId = Deno.env.get('APPLE_TEAM_ID');
  const keyId = Deno.env.get('APPLE_KEY_ID');
  const pem = Deno.env.get('APPLE_PRIVATE_KEY');
  if (!teamId || !keyId || !pem) throw new Error('Apple secrets are not set');
  const key = await importPKCS8(pem.replace(/\\n/g, '\n'), 'ES256');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime('5m')
    .setAudience('https://appleid.apple.com')
    .setSubject(clientId)
    .sign(key);
}

/** Exchange the authorization code for a refresh token, then revoke it. Returns true on success. */
async function revokeApple(code: string): Promise<boolean> {
  const clientId = Deno.env.get('APPLE_CLIENT_ID') ?? 'com.streicherneurology.waikikiwalks';
  const secret = await appleClientSecret(clientId);
  const form = (fields: Record<string, string>) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
  });
  const tokenRes = await fetch(
    'https://appleid.apple.com/auth/token',
    form({ client_id: clientId, client_secret: secret, code, grant_type: 'authorization_code' }),
  );
  if (!tokenRes.ok) return false;
  const tokens = (await tokenRes.json()) as { refresh_token?: string; access_token?: string };
  const token = tokens.refresh_token ?? tokens.access_token;
  if (!token) return false;
  const revokeRes = await fetch(
    'https://appleid.apple.com/auth/revoke',
    form({
      client_id: clientId,
      client_secret: secret,
      token,
      token_type_hint: tokens.refresh_token ? 'refresh_token' : 'access_token',
    }),
  );
  return revokeRes.ok;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);
  const auth = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return json({ error: 'Unauthorized' }, 401);

  const body = (await req.json().catch(() => ({}))) as { appleAuthorizationCode?: string };
  const isApple = data.user.app_metadata?.provider === 'apple' ||
    (data.user.identities ?? []).some((i) => i.provider === 'apple');

  // Revoke Apple tokens first. If it fails we still delete the account (Apple: "you must still
  // fulfill the user's account deletion request"), and tell the app so it can show the manual step.
  let appleRevoked: boolean | null = null;
  if (isApple) {
    appleRevoked = false;
    if (body.appleAuthorizationCode) {
      try {
        appleRevoked = await revokeApple(body.appleAuthorizationCode);
      } catch (e) {
        console.error('Apple revoke failed', e instanceof Error ? e.message : e);
      }
    }
  }

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const del = await admin.auth.admin.deleteUser(data.user.id);
  if (del.error) return json({ error: del.error.message }, 500);
  return json({ ok: true, appleRevoked });
});
