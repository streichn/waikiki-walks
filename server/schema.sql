-- Waikīkī Walks database (Supabase / Postgres). Run once in the Supabase SQL editor.
-- Accounts themselves live in Supabase Auth (auth.users): Apple, Google, and email sign-in.
-- Purchases are NOT stored here: Apple/Google hold them and RevenueCat reports the entitlement.
-- Row Level Security means each person can only ever read or change their own rows.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.walk_progress (
  user_id uuid not null references auth.users on delete cascade,
  walk_id text not null,                 -- 'I' .. 'XII'
  current_stop int not null default 0,
  visited int[] not null default '{}',
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, walk_id)
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users on delete cascade,
  stop_id text not null,                 -- e.g. 'IV-07'
  created_at timestamptz not null default now(),
  primary key (user_id, stop_id)
);

alter table public.profiles enable row level security;
alter table public.walk_progress enable row level security;
alter table public.favorites enable row level security;

create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own progress" on public.walk_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own favorites" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Let signed-in users reach these tables through the Data API (needed when
-- "Automatically expose new tables" is off). RLS above still limits them to their own rows.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.walk_progress, public.favorites to authenticated;

-- Create a profile row automatically when someone signs up.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, provider)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.raw_app_meta_data->>'provider')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
