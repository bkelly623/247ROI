-- 247ROI AI Employee Hire Audit sessions
-- Run in Supabase SQL Editor after 001_initial_schema.sql

create table if not exists hire_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'chatting',
  phase text not null default 'warming',
  messages jsonb not null default '[]'::jsonb,
  discovery jsonb not null default '{}'::jsonb,
  proposal jsonb,
  first_name text,
  last_name text,
  phone text,
  email text,
  source text,
  rep_token text,
  gate_shown_at timestamptz,
  gate_submitted_at timestamptz,
  unlocked_at timestamptz
);

create index if not exists idx_hire_sessions_phone on hire_sessions (phone);
create index if not exists idx_hire_sessions_status on hire_sessions (status);
create index if not exists idx_hire_sessions_created on hire_sessions (created_at desc);

alter table hire_sessions enable row level security;

drop trigger if exists hire_sessions_updated_at on hire_sessions;
create trigger hire_sessions_updated_at
  before update on hire_sessions
  for each row execute function update_updated_at();
