-- Migration 002: settings sync, and faster policies.
-- Settings follow the walker to a new phone. Policies use (select auth.uid()) so Postgres
-- evaluates it once per query instead of once per row (Supabase performance guidance).
alter table public.profiles add column if not exists settings jsonb not null default '{}'::jsonb;

drop policy if exists "own profile" on public.profiles;
drop policy if exists "own progress" on public.walk_progress;
drop policy if exists "own favorites" on public.favorites;
create policy "own profile" on public.profiles for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "own progress" on public.walk_progress for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own favorites" on public.favorites for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
