-- ================================================
-- SIGNL OS — Full Database Schema
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  role         text not null default 'client' check (role in ('admin', 'client')),
  full_name    text,
  company      text,
  linkedin_url text,
  created_at   timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'client', new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CLIENTS
create table if not exists public.clients (
  id               uuid default gen_random_uuid() primary key,
  profile_id       uuid references public.profiles(id) on delete cascade,
  offer_type       text not null check (offer_type in ('audit', 'build', 'dwy', 'dfy')),
  status           text not null default 'active' check (status in ('active', 'paused', 'completed', 'churned')),
  start_date       date,
  end_date         date,
  monthly_value    numeric not null default 0,
  referral_source  text check (referral_source in ('linkedin_dm', 'cold_email', 'referral', 'inbound')),
  next_call_at     timestamptz,
  upsell_flag      boolean default false,
  company          text,
  notes            text,
  created_at       timestamptz default now()
);

-- 3. DELIVERABLES
create table if not exists public.deliverables (
  id                 uuid default gen_random_uuid() primary key,
  client_id          uuid references public.clients(id) on delete cascade,
  title              text not null,
  status             text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  due_date           date,
  asset_url          text,
  visible_to_client  boolean default true,
  created_at         timestamptz default now()
);

-- 4. SESSION NOTES
create table if not exists public.session_notes (
  id                uuid default gen_random_uuid() primary key,
  client_id         uuid references public.clients(id) on delete cascade,
  session_date      date not null default current_date,
  notes             text,
  visible_to_client boolean default false,
  action_items      text[],
  created_at        timestamptz default now()
);

-- 5. INVOICES
create table if not exists public.invoices (
  id            uuid default gen_random_uuid() primary key,
  client_id     uuid references public.clients(id) on delete cascade,
  amount_usd    numeric not null,
  status        text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  issued_date   date not null default current_date,
  paid_date     date,
  description   text,
  elevate_ref   text,
  created_at    timestamptz default now()
);

-- 6. LINKEDIN METRICS
create table if not exists public.linkedin_metrics (
  id               uuid default gen_random_uuid() primary key,
  profile_id       uuid references public.profiles(id) on delete cascade,
  week_of          date not null,
  followers        integer,
  impressions      integer,
  engagement_rate  numeric,
  inbound_dms      integer default 0,
  posts_published  integer default 0,
  created_at       timestamptz default now(),
  unique(profile_id, week_of)
);

-- 7. OUTREACH PROSPECTS
create table if not exists public.outreach_prospects (
  id               uuid default gen_random_uuid() primary key,
  name             text not null,
  company          text,
  linkedin_url     text,
  email            text,
  followers        integer,
  stage            text not null default 'warmup' check (stage in ('warmup', 'dm_sent', 'replied', 'called', 'closed', 'dead')),
  channel          text not null default 'linkedin_dm' check (channel in ('linkedin_dm', 'cold_email', 'referral', 'inbound')),
  last_contact     date,
  follow_up_date   date,
  notes            text,
  created_at       timestamptz default now()
);

-- 8. CONTENT POSTS
create table if not exists public.content_posts (
  id               uuid default gen_random_uuid() primary key,
  scheduled_date   date not null,
  post_type        text check (post_type in ('contrarian', 'tactical', 'story', 'case_study', 'cta')),
  hook             text,
  body             text,
  status           text not null default 'draft' check (status in ('draft', 'ready', 'published')),
  impressions      integer,
  engagement       integer,
  cta_type         text check (cta_type in ('audit', 'freebie', 'none')),
  created_at       timestamptz default now()
);

-- 9. DAILY NON-NEGOTIABLES
create table if not exists public.daily_nonneg (
  id              uuid default gen_random_uuid() primary key,
  date            date not null unique default current_date,
  dms_sent        integer default 0,
  comments_left   integer default 0,
  post_published  boolean default false,
  fajr_kept       boolean default false,
  exercise_done   boolean default false,
  mental_state    integer check (mental_state between 1 and 10),
  created_at      timestamptz default now()
);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

alter table public.profiles          enable row level security;
alter table public.clients           enable row level security;
alter table public.deliverables      enable row level security;
alter table public.session_notes     enable row level security;
alter table public.invoices          enable row level security;
alter table public.linkedin_metrics  enable row level security;
alter table public.outreach_prospects enable row level security;
alter table public.content_posts     enable row level security;
alter table public.daily_nonneg      enable row level security;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: users see own, admin sees all
create policy "profiles_own" on public.profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());
create policy "profiles_admin_insert" on public.profiles for insert with check (is_admin() or id = auth.uid());

-- clients: admin full access; client sees their own
create policy "clients_admin" on public.clients for all using (is_admin());
create policy "clients_own" on public.clients for select using (profile_id = auth.uid());

-- deliverables: admin full; client sees visible ones for their client record
create policy "deliverables_admin" on public.deliverables for all using (is_admin());
create policy "deliverables_client" on public.deliverables for select using (
  visible_to_client = true and
  exists (select 1 from public.clients where id = client_id and profile_id = auth.uid())
);

-- session_notes: admin full; client sees visible ones
create policy "session_notes_admin" on public.session_notes for all using (is_admin());
create policy "session_notes_client" on public.session_notes for select using (
  visible_to_client = true and
  exists (select 1 from public.clients where id = client_id and profile_id = auth.uid())
);

-- invoices: admin full; client sees own
create policy "invoices_admin" on public.invoices for all using (is_admin());
create policy "invoices_client" on public.invoices for select using (
  exists (select 1 from public.clients where id = client_id and profile_id = auth.uid())
);

-- linkedin_metrics: admin full; client sees own
create policy "metrics_admin" on public.linkedin_metrics for all using (is_admin());
create policy "metrics_client" on public.linkedin_metrics for select using (profile_id = auth.uid());

-- outreach: admin only
create policy "outreach_admin" on public.outreach_prospects for all using (is_admin());

-- content: admin only
create policy "content_admin" on public.content_posts for all using (is_admin());

-- non-neg: admin only
create policy "nonneg_admin" on public.daily_nonneg for all using (is_admin());

-- ================================================
-- SEED: Set your account as admin
-- Replace with your actual user ID from Supabase Auth
-- ================================================
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID_HERE';
-- (Run this after you sign up the first time)
