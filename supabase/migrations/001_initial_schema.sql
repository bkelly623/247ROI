-- 247ROI Audit App — Supabase Schema
-- Run in Supabase SQL Editor or via CLI

create extension if not exists "pgcrypto";

create type session_mode as enum ('organic', 'rep');
create type session_status as enum (
  'started',
  'gate_pending',
  'scanning',
  'gate_complete',
  'complete',
  'failed'
);
create type warm_tier as enum ('cold', 'warm_b', 'warm_a', 'hot', 'client');

create table if not exists scan_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  business_name text not null,
  website_url text not null,
  zip_code text not null,
  mode session_mode not null default 'organic',
  status session_status not null default 'started',
  first_name text,
  last_name text,
  phone text,
  email text,
  rep_token text,
  warm_tier warm_tier not null default 'cold',
  report jsonb,
  progress_events jsonb default '[]'::jsonb,
  athena_job_id text,
  ip_hash text,
  gate_shown_at timestamptz,
  gate_submitted_at timestamptz,
  report_viewed_at timestamptz,
  cta_clicked_at timestamptz
);

create table if not exists audit_rate_limits (
  id uuid primary key default gen_random_uuid(),
  phone_normalized text not null,
  audit_count int not null default 1,
  last_audit_at timestamptz not null default now(),
  unique (phone_normalized)
);

create table if not exists rep_sessions (
  token text primary key,
  label text not null,
  business_name text,
  website_url text,
  zip_code text,
  competitor_urls text[] default '{}',
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Demo rep token for sales calls
insert into rep_sessions (token, label, business_name, website_url, zip_code)
values (
  'demo-rep-247roi',
  'Demo Sales Session',
  null,
  null,
  null
) on conflict (token) do nothing;

create index if not exists idx_scan_sessions_phone on scan_sessions (phone);
create index if not exists idx_scan_sessions_status on scan_sessions (status);
create index if not exists idx_scan_sessions_created on scan_sessions (created_at desc);

alter table scan_sessions enable row level security;
alter table audit_rate_limits enable row level security;
alter table rep_sessions enable row level security;

-- Service role bypasses RLS. No public policies — all access via API routes.

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scan_sessions_updated_at
  before update on scan_sessions
  for each row execute function update_updated_at();
