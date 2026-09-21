-- Disabled application flags; apply to isolated QA only until parent release approval.
-- One explicit operator-authorized branded organic sample. Permanent cumulative
-- ceiling is $0.10 across this authorization table, not a per-process allowance.
create table public.audit_live_authorizations_v2 (
 job_id uuid primary key references public.audit_jobs_v2(id),
 authorized_micros bigint not null check(authorized_micros=2000),
 authorized_at timestamptz not null default now()
);
alter table public.audit_live_authorizations_v2 enable row level security;
revoke all on public.audit_live_authorizations_v2 from public,anon,authenticated;
grant select,insert on public.audit_live_authorizations_v2 to service_role;
grant select on public.scan_sessions to service_role;
create function public.audit_authorize_live_v2(p_job uuid)
returns setof public.audit_jobs_v2 language plpgsql security invoker set search_path=public as $$
declare j public.audit_jobs_v2; s public.scan_sessions;
begin
 perform pg_advisory_xact_lock(247008);
 select * into j from public.audit_jobs_v2 where id=p_job for update;
 if not found then raise exception 'Job not found'; end if;
 if exists(select 1 from public.audit_live_authorizations_v2 where job_id=p_job) then return next j; return; end if;
 select * into s from public.scan_sessions where id=j.session_id;
 if j.status <> 'queued' or j.version <> 0 or j.cost_reserved_micros <> 0 or j.max_cost_micros <> 0
 or j.idempotency_key <> 'http:'||p_job::text or s.zip_code !~ '^274[0-9]{2}$'
 or jsonb_array_length(j.plan) <> 1 or j.plan->0->>'lane' <> 'google_organic'
 or j.plan->0->>'query' <> s.business_name then raise exception 'Unsupported live intake'; end if;
 if (select coalesce(sum(authorized_micros),0) from public.audit_live_authorizations_v2)+2000 > 100000 then raise exception 'Global authorization ceiling'; end if;
 insert into public.audit_live_authorizations_v2(job_id,authorized_micros) values(p_job,2000);
 update public.audit_jobs_v2 set plan=jsonb_set(plan,'{0,location}','"Greensboro,North Carolina,United States"'),max_requests=1,max_cost_micros=2000 where id=p_job returning * into j;
 return next j;
end; $$;
revoke all on function public.audit_authorize_live_v2(uuid) from public,anon,authenticated;
grant execute on function public.audit_authorize_live_v2(uuid) to service_role;
