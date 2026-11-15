// Supabase Edge Function: delete-account
// Deploy: supabase functions deploy delete-account
// Apple requires that apps offering account creation also offer in-app account deletion.
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return new Response('Unauthorized', { status: 401 });
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  await admin.from('progress').delete().eq('user_id', data.user.id);
  const del = await admin.auth.admin.deleteUser(data.user.id);
  if (del.error) return new Response(del.error.message, { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
});
