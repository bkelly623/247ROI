-- ISOLATED CONTRACT MIGRATION. NOT APPLIED. Worker-only: no anonymous policies.
-- Reservation is atomic across workers; expired in-flight calls are NOT automatically retried.
create table public.audit_jobs_v2 (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.scan_sessions(id),
  report_id uuid not null unique default gen_random_uuid(),
  idempotency_key text not null unique,
  input_digest text not null check (input_digest ~ '^[a-f0-9]{64}$'),
  status text not null default 'queued' check(status in ('queued','running','complete','partial','failed')),
  version integer not null default 0,
  lease_token uuid,
  plan jsonb not null check(jsonb_typeof(plan) = 'array' and jsonb_array_length(plan) > 0),
  max_requests integer not null check(max_requests between 1 and 250),
  requests_reserved integer not null default 0,
  max_cost_micros bigint not null check(max_cost_micros >= 0),
  cost_reserved_micros bigint not null default 0,
  report_digest text,
  report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.audit_evidence_v2 (
  job_id uuid not null references public.audit_jobs_v2(id),
  sample_key text not null,
  raw_sha256 text not null check(raw_sha256 ~ '^[a-f0-9]{64}$'),
  raw_artifact_id text not null,
  evidence jsonb not null,
  primary key(job_id, sample_key),
  check(evidence->>'status' in ('observed','blocked','error','not_configured','unmeasured')),
  check(evidence->>'status' = 'observed' or
    (evidence->'brandPresent' = 'null'::jsonb and evidence->'featurePresent' = 'null'::jsonb and
     evidence->'citations' = '[]'::jsonb and evidence->'results' = '[]'::jsonb))
);
create table public.audit_provider_reservations_v2 (
  job_id uuid not null references public.audit_jobs_v2(id), sample_key text not null,
  upper_cost_micros bigint not null check(upper_cost_micros >= 0),
  created_at timestamptz not null default now(), primary key(job_id, sample_key)
);
alter table public.audit_jobs_v2 enable row level security;
alter table public.audit_evidence_v2 enable row level security;
alter table public.audit_provider_reservations_v2 enable row level security;
revoke all on public.audit_jobs_v2, public.audit_evidence_v2, public.audit_provider_reservations_v2 from anon, authenticated;

create function public.audit_claim_v2(p_job uuid, p_version integer)
returns setof public.audit_jobs_v2 language sql security invoker set search_path = public as $$
  update public.audit_jobs_v2 set status='running', lease_token=gen_random_uuid(),
    version=version+1, updated_at=now()
  where id=p_job and version=p_version and status='queued' returning *;
$$;
create function public.audit_reserve_v2(p_job uuid, p_lease uuid, p_sample text, p_upper_cost bigint)
returns boolean language plpgsql security invoker set search_path = public as $$
declare j public.audit_jobs_v2;
begin
  -- Fixed conservative global cap: 30 requests/minute across this provider substrate.
  perform pg_advisory_xact_lock(247003);
  select * into j from public.audit_jobs_v2 where id=p_job for update;
  if not found or j.status <> 'running' or j.lease_token is distinct from p_lease or
     p_upper_cost < 0 or j.requests_reserved >= j.max_requests or
     j.cost_reserved_micros + p_upper_cost > j.max_cost_micros then return false; end if;
  if exists(select 1 from public.audit_provider_reservations_v2 where job_id=p_job and sample_key=p_sample)
    or (select count(*) from public.audit_provider_reservations_v2 where created_at > now()-interval '1 minute') >= 30
    then return false; end if;
  insert into public.audit_provider_reservations_v2 values(p_job,p_sample,p_upper_cost,now());
  update public.audit_jobs_v2 set requests_reserved=requests_reserved+1,
    cost_reserved_micros=cost_reserved_micros+p_upper_cost, updated_at=now() where id=p_job;
  return true;
end;
$$;
revoke all on function public.audit_claim_v2(uuid,integer), public.audit_reserve_v2(uuid,uuid,text,bigint) from public, anon, authenticated;
grant execute on function public.audit_claim_v2(uuid,integer), public.audit_reserve_v2(uuid,uuid,text,bigint) to service_role;
-- Terminal CAS and immutable raw-object persistence must be wired and DB-race tested before activation.
-- Do not treat this migration alone as a working durable executor.
