-- ═══════════════════════════════════════════════════════════════════════════
-- Prince Haul Intelligence (PHII) — Production Database Schema
-- Target: PostgreSQL 15+ / Supabase
--
-- Run this in the Supabase SQL Editor (or `psql $DATABASE_URL -f schema.sql`).
-- It is idempotent — safe to re-run against an existing database.
--
-- Mirrors the SQLAlchemy models in backend/app/database.py 1:1. If you change
-- one, change the other — SQLAlchemy is used for local sqlite dev, this file
-- is the source of truth for the hosted Postgres/Supabase instance.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── users ────────────────────────────────────────────────────────────────
-- One row per independent driver. id matches auth.users.id when Supabase Auth
-- is used, so RLS can key directly off auth.uid().

create table if not exists users (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null unique,
  full_name           text,
  role                text not null default 'driver'
                        check (role in ('driver', 'admin', 'ceo')),
  dot_number          text,
  mc_number           text,
  home_city           text,
  home_state          char(2),
  truck_make          text,
  truck_model         text,
  truck_year          smallint,
  truck_vin           text,
  equipment_type      text default 'Dry Van',
  subscription_tier   text not null default 'Solo'
                        check (subscription_tier in ('Solo', 'Fleet', 'Enterprise')),
  min_rpm             numeric(6,2) default 2.50,
  auto_book_enabled   boolean default false,
  fcm_device_token    text,                        -- Firebase Cloud Messaging token for push alerts
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Idempotent column add for databases created before fcm_device_token was introduced.
alter table users add column if not exists fcm_device_token text;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

-- ─── active_loads ─────────────────────────────────────────────────────────
-- Freight currently booked or in transit for a driver. rpm is derived so the
-- UI never has to recompute it client-side.

create table if not exists active_loads (
  id                  uuid primary key default gen_random_uuid(),
  driver_id           uuid references users(id) on delete set null,
  broker_name         text,
  broker_mc_number    text,
  origin_city         text not null,
  origin_state        char(2) not null,
  origin_lat          numeric(9,6),
  origin_lng          numeric(9,6),
  destination_city    text not null,
  destination_state   char(2) not null,
  destination_lat     numeric(9,6),
  destination_lng     numeric(9,6),
  payout_amount       numeric(10,2) not null check (payout_amount > 0),
  miles               integer not null check (miles > 0),
  rpm                 numeric(6,2) generated always as
                         (round(payout_amount / nullif(miles, 0), 2)) stored,
  equipment_type      text default 'Dry Van',
  status              text not null default 'available'
                        check (status in ('available', 'booked', 'in_transit', 'delivered', 'cancelled')),
  pickup_date         date,
  delivery_date       date,
  risk_score          smallint check (risk_score between 0 and 10),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists trg_active_loads_updated_at on active_loads;
create trigger trg_active_loads_updated_at
  before update on active_loads
  for each row execute function set_updated_at();

create index if not exists idx_active_loads_driver_id on active_loads(driver_id);
create index if not exists idx_active_loads_status on active_loads(status);

-- ─── ai_action_logs ───────────────────────────────────────────────────────
-- Append-only ledger of what the 15 agents are doing, e.g. "Negotiator bid
-- $3.00/mi at 2:00 PM". Powers the live AI activity feed on the dashboard.

create table if not exists ai_action_logs (
  id                  bigint generated always as identity primary key,
  driver_id           uuid references users(id) on delete cascade,
  load_id             uuid references active_loads(id) on delete set null,
  agent_name          text not null,
  action_type         text not null
                        check (action_type in (
                          'scan', 'negotiate', 'dispatch', 'route', 'fuel',
                          'invoice', 'compliance', 'maintenance', 'alert', 'briefing'
                        )),
  summary             text not null,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now()
);

create index if not exists idx_ai_action_logs_driver_id on ai_action_logs(driver_id, created_at desc);
create index if not exists idx_ai_action_logs_load_id on ai_action_logs(load_id);

-- ─── financial_vault ──────────────────────────────────────────────────────
-- Cleared invoices, factoring status, and tax deductions per load.

create table if not exists financial_vault (
  id                  uuid primary key default gen_random_uuid(),
  driver_id           uuid references users(id) on delete cascade,
  load_id             uuid references active_loads(id) on delete set null,
  invoice_number      text unique,
  gross_amount        numeric(10,2) not null,
  factoring_fee       numeric(10,2) not null default 0,
  net_amount          numeric(10,2) not null,
  factoring_company   text,
  factoring_status    text not null default 'pending'
                        check (factoring_status in ('pending', 'submitted', 'advanced', 'paid', 'rejected')),
  tax_deductions       jsonb not null default '{}', -- { fuel, tolls, per_diem, maintenance_reserve }
  total_deductions     numeric(10,2) not null default 0,
  cleared_at           timestamptz,
  created_at           timestamptz not null default now()
);

create index if not exists idx_financial_vault_driver_id on financial_vault(driver_id, created_at desc);
create index if not exists idx_financial_vault_status on financial_vault(factoring_status);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Drivers can only ever see their own rows. Service-role keys (used by the
-- FastAPI backend) bypass RLS entirely, so the 15 agents can write freely.
-- ═══════════════════════════════════════════════════════════════════════════

alter table users enable row level security;
alter table active_loads enable row level security;
alter table ai_action_logs enable row level security;
alter table financial_vault enable row level security;

drop policy if exists users_select_own on users;
create policy users_select_own on users
  for select using (auth.uid() = id);

drop policy if exists users_update_own on users;
create policy users_update_own on users
  for update using (auth.uid() = id);

drop policy if exists active_loads_select_own_or_available on active_loads;
create policy active_loads_select_own_or_available on active_loads
  for select using (driver_id = auth.uid() or status = 'available');

drop policy if exists ai_action_logs_select_own on ai_action_logs;
create policy ai_action_logs_select_own on ai_action_logs
  for select using (driver_id = auth.uid());

drop policy if exists financial_vault_select_own on financial_vault;
create policy financial_vault_select_own on financial_vault
  for select using (driver_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- REALTIME
-- Lets the mobile app subscribe directly to Supabase Realtime (logical
-- replication) as a fallback/complement to the FastAPI WebSocket channel —
-- e.g. for clients that only have the Supabase anon key, no backend session.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'active_loads'
  ) then
    alter publication supabase_realtime add table active_loads;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'ai_action_logs'
  ) then
    alter publication supabase_realtime add table ai_action_logs;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'financial_vault'
  ) then
    alter publication supabase_realtime add table financial_vault;
  end if;
exception when undefined_object then
  -- supabase_realtime publication doesn't exist (non-Supabase Postgres) — skip.
  null;
end $$;
