-- Run this in Supabase Dashboard → SQL Editor

create table if not exists public.plans (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default 'Untitled plan',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_user_id_idx on public.plans (user_id);

alter table public.plans enable row level security;

create policy "plans_select_own"
  on public.plans for select
  using (auth.uid() = user_id);

create policy "plans_insert_own"
  on public.plans for insert
  with check (auth.uid() = user_id);

create policy "plans_update_own"
  on public.plans for update
  using (auth.uid() = user_id);

create policy "plans_delete_own"
  on public.plans for delete
  using (auth.uid() = user_id);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active_plan_id uuid references public.plans (id) on delete set null,
  usd_rate numeric not null default 57.5,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists plans_updated_at on public.plans;
create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();
