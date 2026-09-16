-- Emergency jobs table — drives the ringing call-style overlay on worker phones.
-- Run in Supabase SQL editor AFTER bookings.sql and live-chat.sql.

create table if not exists emergencies (
  id              text primary key,
  customer_id     text not null,
  customer_name   text default 'Customer',
  problem         text not null,
  location        text default '',
  lat             double precision,
  lng             double precision,
  amount          integer default 500,
  pay_multiplier  numeric default 1.2,
  status          text default 'active',          -- active | accepted | closed
  worker_id       text,                           -- who accepted
  worker_name     text default '',
  rejected_by     text[] default '{}',            -- worker IDs that passed
  created_at      timestamptz default now()
);

alter table emergencies enable row level security;

create policy "anon all emergencies" on emergencies
  for all using (true) with check (true);
