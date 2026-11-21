-- Migration 003: tighter database rules, and a daily limit for photo checks.
-- Nick runs this in the Supabase SQL editor after approving the pull request.
-- Safe to run more than once.
--
-- 1. Policies name the role they are for ("to authenticated"), as Supabase advises.
--    Guests (the anon role) are ruled out before any row is checked.
-- 2. The sign-up trigger function uses an empty search_path with schema-qualified names
--    (Supabase advisor 0011), and nobody can call it through the API (advisors 0028, 0029).
-- 3. Size and value checks on every column a phone can write. The publishable key is
--    public, so any signed-in account could otherwise store very large rows.
--    Added as NOT VALID: they apply to new writes and never block on existing rows.
-- 4. A private counter that the lens Edge Function uses to cap photo checks per walker
--    per day, and in total per day, so the paid vision service cannot be run up.

-- 1. Policies for signed-in walkers only
drop policy if exists "own profile" on public.profiles;
drop policy if exists "own progress" on public.walk_progress;
drop policy if exists "own favorites" on public.favorites;
create policy "own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "own progress" on public.walk_progress for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own favorites" on public.favorites for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.profiles, public.walk_progress, public.favorites from anon;

-- 2. Sign-up trigger: fixed search_path, not callable through the API
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, provider)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 80),
    new.raw_app_meta_data->>'provider'
  )
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3. Size and value checks
alter table public.profiles drop constraint if exists profiles_display_name_len;
alter table public.profiles add constraint profiles_display_name_len
  check (display_name is null or char_length(display_name) <= 80) not valid;
alter table public.profiles drop constraint if exists profiles_provider_len;
alter table public.profiles add constraint profiles_provider_len
  check (provider is null or char_length(provider) <= 20) not valid;
alter table public.profiles drop constraint if exists profiles_settings_size;
alter table public.profiles add constraint profiles_settings_size
  check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) <= 4096) not valid;

alter table public.walk_progress drop constraint if exists walk_progress_walk_id;
alter table public.walk_progress add constraint walk_progress_walk_id
  check (walk_id in ('I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII')) not valid;
alter table public.walk_progress drop constraint if exists walk_progress_current_stop;
alter table public.walk_progress add constraint walk_progress_current_stop
  check (current_stop between 0 and 200) not valid;
alter table public.walk_progress drop constraint if exists walk_progress_visited_len;
alter table public.walk_progress add constraint walk_progress_visited_len
  check (cardinality(visited) <= 200) not valid;

alter table public.favorites drop constraint if exists favorites_stop_id_format;
alter table public.favorites add constraint favorites_stop_id_format
  check (char_length(stop_id) <= 20 and stop_id ~ '^[IVX]{1,4}-[0-9A-Za-z]{1,6}$') not valid;

-- 4. Daily photo-check counter (no photos, no places, no times: only a count per day)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.lens_usage (
  bucket text not null,          -- 'all', 'u:<user id>', or 'g:<hash>' for a guest phone
  day date not null default (now() at time zone 'Pacific/Honolulu')::date,
  uses int not null default 0,
  primary key (bucket, day)
);

-- Counts one photo check and says whether it is still within the cap.
-- Callable only with the service-role key, which lives only inside the Edge Function.
create or replace function public.lens_take(p_bucket text, p_cap int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  n int;
  today date := (now() at time zone 'Pacific/Honolulu')::date;
begin
  insert into private.lens_usage as u (bucket, day, uses) values (left(p_bucket, 80), today, 1)
  on conflict (bucket, day) do update set uses = u.uses + 1
  returning uses into n;
  -- Keep only a week of counts.
  delete from private.lens_usage where day < today - 7;
  return n <= p_cap;
end $$;
revoke execute on function public.lens_take(text, int) from public, anon, authenticated;
grant execute on function public.lens_take(text, int) to service_role;
