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

-- ─── customer leads and lifecycle events ───────────────────────────────────
-- A consented prospect enters as a lead, moves through qualification and
-- onboarding, then links to a PHI driver account when activated.

create table if not exists customer_leads (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null unique,
  full_name             text not null,
  phone                 text,
  company_name          text,
  journey               text not null default 'launch'
                          check (journey in ('launch', 'dispatch', 'fleet')),
  stage                 text not null default 'new'
                          check (stage in ('new', 'qualified', 'opportunity', 'won', 'lost', 'nurture')),
  lead_source           text not null default 'organic',
  source_detail         text,
  equipment_type        text,
  truck_count           integer not null default 0 check (truck_count >= 0),
  home_state            char(2),
  top_challenge         text,
  preferred_contact     text not null default 'email'
                          check (preferred_contact in ('email', 'phone', 'text')),
  consent_marketing     boolean not null default false,
  consent_captured_at   timestamptz,
  qualification_score   smallint not null default 0 check (qualification_score between 0 and 100),
  recommended_offer     text,
  owner                 text not null default 'PHI Acquisition Pod',
  next_action_at        timestamptz,
  external_crm_id       text,
  onboarding_status     text not null default 'not_started'
                          check (onboarding_status in ('not_started', 'in_progress', 'complete', 'blocked')),
  activated_user_id     uuid references users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_customer_leads_stage on customer_leads(stage, created_at desc);
create index if not exists idx_customer_leads_journey on customer_leads(journey);

create table if not exists customer_journey_events (
  id                    bigint generated always as identity primary key,
  lead_id               uuid not null references customer_leads(id) on delete cascade,
  event_type            text not null,
  actor                 text not null default 'system',
  metadata              jsonb not null default '{}',
  created_at            timestamptz not null default now()
);

create index if not exists idx_customer_journey_events_lead on customer_journey_events(lead_id, created_at desc);

-- Prepared and delivered follow-up actions. A message is never represented as sent
-- until the configured delivery channel reports a successful outcome.
create table if not exists customer_followups (
  id                    uuid primary key default gen_random_uuid(),
  lead_id               uuid not null references customer_leads(id) on delete cascade,
  sequence_step         text not null check (sequence_step in ('assessment_response', 'practical_follow_up', 'close_the_loop', 'appointment_reminder')),
  channel               text not null default 'email' check (channel in ('email', 'calendar')),
  status                text not null default 'ready' check (status in ('ready', 'held', 'sent', 'cancelled', 'failed', 'suppressed')),
  subject               text,
  body                  text not null,
  scheduled_at          timestamptz,
  sent_at               timestamptz,
  external_message_id   text,
  suppression_reason    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_customer_followups_queue on customer_followups(status, scheduled_at, created_at);
create index if not exists idx_customer_followups_lead on customer_followups(lead_id, created_at desc);

drop trigger if exists trg_customer_followups_updated_at on customer_followups;
create trigger trg_customer_followups_updated_at
  before update on customer_followups
  for each row execute function set_updated_at();

-- Consultation requests keep a booking handoff inside PHI even before an external
-- calendar account is authorized.
create table if not exists customer_appointments (
  id                    uuid primary key default gen_random_uuid(),
  lead_id               uuid not null references customer_leads(id) on delete cascade,
  status                text not null default 'requested' check (status in ('requested', 'scheduled', 'completed', 'cancelled', 'no_show')),
  booking_url           text,
  provider_booking_id   text,
  host_name             text,
  scheduled_for         timestamptz,
  completed_at          timestamptz,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_customer_appointments_queue on customer_appointments(status, scheduled_for, created_at);
create index if not exists idx_customer_appointments_lead on customer_appointments(lead_id, created_at desc);

drop trigger if exists trg_customer_appointments_updated_at on customer_appointments;
create trigger trg_customer_appointments_updated_at
  before update on customer_appointments
  for each row execute function set_updated_at();

-- Revenue entries are restricted to verified subscription MRR, not pipeline forecasts.
create table if not exists customer_revenue_entries (
  id                    uuid primary key default gen_random_uuid(),
  lead_id               uuid references customer_leads(id) on delete set null,
  amount_mrr            numeric(10,2) not null default 0 check (amount_mrr >= 0),
  status                text not null default 'active' check (status in ('active', 'cancelled', 'paused')),
  source                text not null default 'manual_verified',
  verified_at           timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_customer_revenue_entries_status on customer_revenue_entries(status, verified_at desc);

drop trigger if exists trg_customer_revenue_entries_updated_at on customer_revenue_entries;
create trigger trg_customer_revenue_entries_updated_at
  before update on customer_revenue_entries
  for each row execute function set_updated_at();

drop trigger if exists trg_customer_leads_updated_at on customer_leads;
create trigger trg_customer_leads_updated_at
  before update on customer_leads
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
alter table customer_leads enable row level security;
alter table customer_journey_events enable row level security;
alter table customer_followups enable row level security;
alter table customer_appointments enable row level security;
alter table customer_revenue_entries enable row level security;
alter table active_loads enable row level security;
alter table ai_action_logs enable row level security;
alter table financial_vault enable row level security;

drop policy if exists users_select_own on users;
create policy users_select_own on users
  for select using (auth.uid() = id);

drop policy if exists users_update_own on users;
create policy users_update_own on users
  for update using (auth.uid() = id);

drop policy if exists customer_leads_select_own on customer_leads;
create policy customer_leads_select_own on customer_leads
  for select using (activated_user_id = auth.uid());

drop policy if exists customer_journey_events_select_own on customer_journey_events;
create policy customer_journey_events_select_own on customer_journey_events
  for select using (
    exists (
      select 1 from customer_leads
      where customer_leads.id = customer_journey_events.lead_id
        and customer_leads.activated_user_id = auth.uid()
    )
  );

drop policy if exists customer_followups_select_own on customer_followups;
create policy customer_followups_select_own on customer_followups
  for select using (
    exists (
      select 1 from customer_leads
      where customer_leads.id = customer_followups.lead_id
        and customer_leads.activated_user_id = auth.uid()
    )
  );

drop policy if exists customer_appointments_select_own on customer_appointments;
create policy customer_appointments_select_own on customer_appointments
  for select using (
    exists (
      select 1 from customer_leads
      where customer_leads.id = customer_appointments.lead_id
        and customer_leads.activated_user_id = auth.uid()
    )
  );

drop policy if exists customer_revenue_entries_select_own on customer_revenue_entries;
create policy customer_revenue_entries_select_own on customer_revenue_entries
  for select using (
    exists (
      select 1 from customer_leads
      where customer_leads.id = customer_revenue_entries.lead_id
        and customer_leads.activated_user_id = auth.uid()
    )
  );

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
