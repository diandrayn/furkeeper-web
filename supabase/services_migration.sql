-- Run this in the SQL Editor. The original schema.sql didn't include a
-- "duration" (estimasi durasi) or a booking counter for services — the
-- seller/service dashboard UI needs both.
alter table public.services
  add column if not exists duration text,
  add column if not exists booked_count integer not null default 0;
