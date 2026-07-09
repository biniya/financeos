-- ONLY run this if public.transactions already exists (from an older install
-- before is_one_time was added). If you get "relation does not exist", run
-- supabase/transactions.sql instead — it creates the table with is_one_time included.

alter table public.transactions
  add column if not exists is_one_time boolean not null default false;
