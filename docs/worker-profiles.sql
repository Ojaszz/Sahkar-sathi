-- Sahkar Sathi — worker profiles board (run this in Supabase → SQL Editor, then press Run)
-- Run AFTER docs/live-chat.sql and docs/tag-along.sql. Adds the `worker_profiles`
-- table so a brand-new worker who registers with an email + completes onboarding
-- shows up in the CUSTOMER's search/home within ~1.5 s (the app polls this board
-- on every phone) — no servers, no rebuild of the static catalogue.
--
-- Upsert key: `id` = the worker's Supabase auth uuid. `created_at` is client-set so
-- a later upsert (profile edit) touches the same row instead of adding a duplicate.

create table if not exists worker_profiles (
  id               text primary key,           -- the worker's Supabase auth uuid
  name             text not null,
  service          text not null,              -- e.g. 'electrician'
  avatar           text,                       -- emoji face
  skills           jsonb not null default '[]',
  certifications   jsonb not null default '[]',
  service_areas    jsonb not null default '[]',  -- area names (PUNE_AREAS)
  languages        jsonb not null default '[]',
  experience_years text,                       -- '< 1 year' | '1–3 years' | ...
  rate             integer not null default 250,  -- ₹/hr, set on onboarding
  location_lat     double precision not null default 18.5204,
  location_lng     double precision not null default 73.8567,
  available        boolean not null default true,
  is_fair_wage     boolean not null default true,
  rating           integer not null default 0,     -- grown by tag-along shared ratings
  reviews_count    integer not null default 0,
  jobs_completed   integer not null default 0,
  created_at       timestamptz not null default now()
);

-- Row Level Security: wide open to anon, same as bookings + messages + tag_alongs
-- (the app only ever uses the anon key). Demo-grade so 4 phones + anon must work:
-- any phone can read any profile and any worker can upsert their own.
alter table worker_profiles enable row level security;

drop policy if exists "anon select worker_profiles" on worker_profiles;
create policy "anon select worker_profiles" on worker_profiles for select to anon using (true);

drop policy if exists "anon insert worker_profiles" on worker_profiles;
create policy "anon insert worker_profiles" on worker_profiles for insert to anon with check (true);

drop policy if exists "anon update worker_profiles" on worker_profiles;
create policy "anon update worker_profiles" on worker_profiles for update to anon using (true) with check (true);

drop policy if exists "anon delete worker_profiles" on worker_profiles;
create policy "anon delete worker_profiles" on worker_profiles for delete to anon using (true);