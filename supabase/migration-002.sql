-- Run once in the Supabase SQL editor if you already created the tables earlier.
alter table medicines add column if not exists times text;
alter table medicines add column if not exists start_date date;
alter table medicines add column if not exists end_date date;
