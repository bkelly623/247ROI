-- LOCAL DRAFT ONLY: not applied. Independent immutable delivery snapshot.
-- Job finalization + snapshot insertion still need a shared transaction before cutover.
create table public.audit_reports_v2 (
  id uuid primary key,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  report_digest text not null check (report_digest ~ '^[a-f0-9]{64}$'),
  report jsonb not null check (report->>'schemaVersion' = '2.0'),
  created_at timestamptz not null default now()
);
alter table public.audit_reports_v2 enable row level security;
revoke all on public.audit_reports_v2 from public, anon, authenticated;
grant select, insert on public.audit_reports_v2 to service_role;
create function public.reject_audit_report_mutation_v2() returns trigger
language plpgsql set search_path = public as $$
begin
  raise exception 'Audit report snapshots are immutable';
end;
$$;
create trigger immutable_audit_report_v2 before update or delete on public.audit_reports_v2
for each row execute function public.reject_audit_report_mutation_v2();
