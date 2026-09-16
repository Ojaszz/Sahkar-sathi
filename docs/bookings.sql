-- Sahkar Sathi — bookings board (run this in Supabase → SQL Editor, then press Run)
-- The central shared table: customers publish jobs, workers accept them.

create table if not exists bookings (
  id            text primary key,            -- client-generated 'bk<rand>'
  service       text not null,               -- service category key (plumbing, electrical, ...)
  customer_id   text not null,               -- customer device id (or auth user id)
  customer_name text default 'Customer',
  worker_id     text,                        -- set when a worker accepts
  worker_name   text default '',
  status        text not null default 'requested',  -- requested | confirmed | inProgress | completed | cancelled
  address       text default '',
  issue         text default '',
  amount        integer default 500,
  coop_fee      integer default 50,
  lat           double precision,
  lng           double precision,
  payment       text default 'unpaid',       -- unpaid | paid
  payment_method text,                       -- cash | upi | ...
  rating        integer,                     -- 1-5 stars, set after completion
  reviewed      boolean default false,
  created_at    timestamptz not null default now()
);

-- date / time are the customer's chosen slot (added for the live demo). They are
-- optional so older rows keep working; the app fills them on every new booking.
alter table bookings add column if not exists date text;
alter table bookings add column if not exists time text;

-- hours = how long the job is expected to take; the amount is hourly rate × hours.
alter table bookings add column if not exists hours integer default 1;

-- Row Level Security: wide open to anon (same pattern as messages / tag_alongs).
-- Demo-grade — 4 phones + anon key must work without auth complexity.
alter table bookings enable row level security;

drop policy if exists "anon select bookings" on bookings;
create policy "anon select bookings" on bookings for select to anon using (true);

drop policy if exists "anon insert bookings" on bookings;
create policy "anon insert bookings" on bookings for insert to anon with check (true);

drop policy if exists "anon update bookings" on bookings;
create policy "anon update bookings" on bookings for update to anon using (true);

drop policy if exists "anon delete bookings" on bookings;
create policy "anon delete bookings" on bookings for delete to anon using (true);
