-- 247ROI public site event tracking
-- Run in Supabase SQL Editor after 002_hire_audits.sql

create table if not exists site_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_name text not null,
  path text,
  url text,
  referrer text,
  source text,
  session_id text,
  visitor_id text,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_site_events_created on site_events (created_at desc);
create index if not exists idx_site_events_event_name on site_events (event_name);
create index if not exists idx_site_events_path on site_events (path);
create index if not exists idx_site_events_session_id on site_events (session_id);
create index if not exists idx_site_events_visitor_id on site_events (visitor_id);

alter table site_events enable row level security;

-- Service role bypasses RLS. No public policies - writes happen through /api/events.
