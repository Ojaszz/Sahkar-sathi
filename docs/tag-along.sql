-- Sahkar Sathi — tag-along (mentor) board (run this in Supabase → SQL Editor, then press Run)
-- Run AFTER docs/live-chat.sql (bookings + messages tables). Adds the `tag_alongs`
-- table the app polls so a NEW worker's "take me along" request, the mentor's Accept,
-- and the shared rating all sync across phones — no server code.
--
-- Flow: new worker inserts a row (status 'pending') → mentor PATCHes to 'accepted'
-- → when the mentor completes a job, the app PATCHes to 'completed' (+ booking_id)
-- → when the customer rates that job, the app PATCHes `rating` onto the row.

create table if not exists tag_alongs (
  id            text primary key,            -- client-generated 'ta<rand>'
  junior_id     text not null,               -- uuid of the NEW (email-registered) worker
  junior_name   text,                        -- their display name
  mentor_id     text not null,               -- catalogue worker id (w1/w2/...)
  mentor_name   text,                        -- e.g. 'Vardhan'
  service       text,                        -- the mentor's service (informational)
  status        text not null default 'pending',  -- pending | accepted | completed | rejected
  booking_id    text,                        -- set when the mentor's shared job completes
  rating        integer,                     -- copied from the booking once the customer rates
  created_at    timestamptz not null default now()
);

-- Row Level Security: wide open to anon, same as bookings + messages (the app only
-- ever uses the anon key). Demo-grade so 4 phones + anon must work.
alter table tag_alongs enable row level security;

drop policy if exists "anon select tag_alongs" on tag_alongs;
create policy "anon select tag_alongs" on tag_alongs for select to anon using (true);

drop policy if exists "anon insert tag_alongs" on tag_alongs;
create policy "anon insert tag_alongs" on tag_alongs for insert to anon with check (true);

drop policy if exists "anon update tag_alongs" on tag_alongs;
create policy "anon update tag_alongs" on tag_alongs for update to anon using (true) with check (true);

drop policy if exists "anon delete tag_alongs" on tag_alongs;
create policy "anon delete tag_alongs" on tag_alongs for delete to anon using (true);