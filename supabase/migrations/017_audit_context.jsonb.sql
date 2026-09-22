-- Additive: optional validated audit context (JSONB). Not applied to production by this task.
-- Absent/null means legacy local ZIP behavior. Never stores private GSC credentials.

alter table public.scan_sessions
  add column if not exists audit_context jsonb;

comment on column public.scan_sessions.audit_context is
  'Optional Stage-3 AuditContext JSON (geography, service area, priority service, owner assertions). Null = legacy local sampling.';
