-- Local-only milestone; never apply to production without release approval.
-- SECURITY INVOKER: worker role only. No expired lease reclaim / automatic retry.
create table public.audit_raw_v2 (
  id text primary key,
  job_id uuid not null references public.audit_jobs_v2(id),
  request_key text not null,
  raw text not null,
  sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
  unique(job_id, request_key),
  -- Core PostgreSQL SHA256 avoids assuming pgcrypto lives in public.
  check(encode(pg_catalog.sha256(pg_catalog.convert_to(raw, 'UTF8')), 'hex') = sha256)
);
alter table public.audit_raw_v2 enable row level security;
revoke all on public.audit_raw_v2 from public, anon, authenticated;
create trigger immutable_audit_raw_v2 before update or delete on public.audit_raw_v2
for each row execute function public.reject_audit_report_mutation_v2();
create trigger immutable_audit_evidence_v2 before update or delete on public.audit_evidence_v2
for each row execute function public.reject_audit_report_mutation_v2();
alter table public.audit_jobs_v2 add column share_token_hash text check(share_token_hash ~ '^[a-f0-9]{64}$');
grant select, insert, update on public.audit_jobs_v2 to service_role;
grant select, insert on public.audit_raw_v2, public.audit_evidence_v2, public.audit_provider_reservations_v2 to service_role;

create function public.audit_enqueue_v2(p_job uuid, p_session uuid, p_key text, p_digest text,
  p_plan jsonb, p_requests integer, p_cost bigint, p_token_hash text)
returns setof public.audit_jobs_v2 language plpgsql security invoker set search_path=public as $$
declare j public.audit_jobs_v2;
begin
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'Token required'; end if;
  if exists(select 1 from jsonb_array_elements(p_plan) s where s->>'jobId' is distinct from p_job::text) then
    raise exception 'Plan job mismatch'; end if;
  insert into public.audit_jobs_v2(id,session_id,idempotency_key,input_digest,plan,max_requests,max_cost_micros,share_token_hash)
    values(p_job,p_session,p_key,p_digest,p_plan,p_requests,p_cost,p_token_hash) on conflict(idempotency_key) do nothing;
  select * into j from public.audit_jobs_v2 where idempotency_key=p_key;
  if j.session_id is distinct from p_session or j.input_digest is distinct from p_digest
    or j.plan is distinct from p_plan or j.max_requests is distinct from p_requests
    or j.max_cost_micros is distinct from p_cost or j.share_token_hash is distinct from p_token_hash then
    raise exception 'Idempotency conflict' using errcode='23505'; end if;
  return next j;
end; $$;

create function public.audit_raw_save_v2(p_job uuid, p_lease uuid, p_key text, p_raw text, p_sha text)
returns text language plpgsql security invoker set search_path=public as $$
declare j public.audit_jobs_v2; artifact text;
begin
  select * into j from public.audit_jobs_v2 where id=p_job for update;
  if not found or j.status <> 'running' or j.lease_token is distinct from p_lease then raise exception 'Stale lease'; end if;
  if not exists(select 1 from public.audit_provider_reservations_v2 where job_id=p_job and sample_key=p_key) then raise exception 'Reservation required'; end if;
  artifact := 'postgres:' || p_job::text || ':' || p_key;
  insert into public.audit_raw_v2 values(artifact,p_job,p_key,p_raw,p_sha) on conflict(id) do nothing;
  if not exists(select 1 from public.audit_raw_v2 where id=artifact and raw=p_raw and sha256=p_sha) then raise exception 'Raw conflict'; end if;
  return artifact;
end; $$;

create function public.audit_evidence_save_v2(p_job uuid,p_lease uuid,p_key text,p_evidence jsonb)
returns void language plpgsql security invoker set search_path=public as $$
declare j public.audit_jobs_v2;
begin
  select * into j from public.audit_jobs_v2 where id=p_job for update;
  if not found or j.status <> 'running' or j.lease_token is distinct from p_lease then raise exception 'Stale lease'; end if;
  if not exists(select 1 from jsonb_array_elements(j.plan) s where s=p_evidence->'sample') then raise exception 'Evidence outside plan'; end if;
  if not exists(select 1 from public.audit_raw_v2 where job_id=p_job and id=p_evidence->>'rawArtifactId' and sha256=p_evidence->>'rawSha256') then raise exception 'Raw capture missing'; end if;
  insert into public.audit_evidence_v2 values(p_job,p_key,p_evidence->>'rawSha256',p_evidence->>'rawArtifactId',p_evidence) on conflict(job_id,sample_key) do nothing;
  if not exists(select 1 from public.audit_evidence_v2 where job_id=p_job and sample_key=p_key and evidence=p_evidence) then raise exception 'Evidence conflict'; end if;
end; $$;

create function public.audit_finish_v2(p_job uuid,p_lease uuid,p_version integer,p_report_id uuid,p_report jsonb)
returns text language plpgsql security invoker set search_path=public as $$
declare j public.audit_jobs_v2; e jsonb;
begin
  select * into j from public.audit_jobs_v2 where id=p_job for update;
  if not found or j.report_id is distinct from p_report_id or j.lease_token is distinct from p_lease then return 'conflict'; end if;
  if j.status in ('complete','partial','failed') then
    if j.report=p_report and j.version=p_version+1 then return 'duplicate'; end if;
    return 'conflict';
  end if;
  if j.status <> 'running' or j.version <> p_version then return 'conflict'; end if;
  if p_report->>'schemaVersion' is distinct from '2.0' or p_report->>'status' not in ('complete','partial','failed')
    or p_report->>'status' is null or p_report->>'digest' is null or p_report->'expected' is distinct from j.plan
    or jsonb_typeof(p_report->'evidence') is distinct from 'array' then raise exception 'Invalid report'; end if;
  for e in select value from jsonb_array_elements(p_report->'evidence') loop
    if not exists(select 1 from public.audit_evidence_v2 where job_id=p_job and evidence=e) then raise exception 'Unpersisted evidence'; end if;
  end loop;
  if exists(select 1 from public.audit_evidence_v2 a where a.job_id=p_job and not (p_report->'evidence' @> jsonb_build_array(a.evidence))) then raise exception 'Omitted evidence'; end if;
  insert into public.audit_reports_v2(id,token_hash,report_digest,report)
    values(j.report_id,j.share_token_hash,p_report->>'digest',p_report);
  update public.audit_jobs_v2 set status=p_report->>'status',report=p_report,report_digest=p_report->>'digest',version=version+1,updated_at=now() where id=p_job;
  return 'saved';
end; $$;
create function public.audit_read_v2(p_job uuid, p_token_hash text)
returns table(status text, report_id uuid, report jsonb) language sql security invoker set search_path=public as $$
  select j.status,j.report_id,r.report from public.audit_jobs_v2 j
  left join public.audit_reports_v2 r on r.id=j.report_id and r.token_hash=p_token_hash
  where j.id=p_job and j.share_token_hash=p_token_hash;
$$;
revoke all on function public.audit_read_v2(uuid,text) from public,anon,authenticated;
grant execute on function public.audit_read_v2(uuid,text) to service_role;
revoke all on function public.audit_enqueue_v2(uuid,uuid,text,text,jsonb,integer,bigint,text),
 public.audit_raw_save_v2(uuid,uuid,text,text,text), public.audit_evidence_save_v2(uuid,uuid,text,jsonb),
 public.audit_finish_v2(uuid,uuid,integer,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.audit_enqueue_v2(uuid,uuid,text,text,jsonb,integer,bigint,text),
 public.audit_raw_save_v2(uuid,uuid,text,text,text), public.audit_evidence_save_v2(uuid,uuid,text,jsonb),
 public.audit_finish_v2(uuid,uuid,integer,uuid,jsonb) to service_role;
