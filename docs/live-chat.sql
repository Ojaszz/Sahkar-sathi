-- Sahkar Sathi — live chat board (run this in Supabase → SQL Editor, then press Run)
-- Adds the `messages` table the app polls so the customer (Ojas) and your team's
-- demo workers can chat across phones in near-real-time, no server code.

create table if not exists messages (
  id            text primary key,            -- client-generated 'm<rand>'
  booking_id    text,                        -- (optional) job the chat belongs to
  customer_id   text not null,               -- customer phone identity (device id)
  worker_id     text not null,               -- worker identity (w1/w2/...)
  sender_id     text not null,               -- WHO wrote it (customer_id or worker_id)
  sender_name   text,
  sender_role   text,                        -- 'customer' | 'worker'
  "text"        text not null,
  created_at    timestamptz not null default now()
);

-- Row Level Security: wide open to anon, same as the bookings board (the app only
-- ever uses the anon key). Everything is demo-grade so 4 phones + anon must work.
alter table messages enable row level security;

drop policy if exists "anon select messages" on messages;
create policy "anon select messages" on messages for select to anon using (true);

drop policy if exists "anon insert messages" on messages;
create policy "anon insert messages" on messages for insert to anon with check (true);

drop policy if exists "anon delete messages" on messages;
create policy "anon delete messages" on messages for delete to anon using (true);