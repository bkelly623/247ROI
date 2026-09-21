-- Additive only: historical pilot authorizations/reservations remain immutable.
-- No budget is provisioned here. Operator separately approves campaign/QA ceiling.
create table public.audit_collection_budgets_v2 (
 id text primary key, purpose text not null check(purpose in ('website','internal_tracking')),
 ceiling_micros bigint not null check(ceiling_micros > 0),
 authorized_micros bigint not null default 0 check(authorized_micros >= 0 and authorized_micros <= ceiling_micros)
);
create table public.audit_plan_authorizations_v2 (
 job_id uuid primary key references public.audit_jobs_v2(id),
 budget_id text not null references public.audit_collection_budgets_v2(id),
 approval jsonb not null, authorized_micros bigint not null check(authorized_micros > 0)
);
alter table public.audit_collection_budgets_v2 enable row level security;
alter table public.audit_plan_authorizations_v2 enable row level security;
revoke all on public.audit_collection_budgets_v2, public.audit_plan_authorizations_v2 from public,anon,authenticated;
grant select,insert,update on public.audit_collection_budgets_v2 to service_role;
-- Supabase may inherit broader default grants: normalize this immutable table.
revoke all on public.audit_plan_authorizations_v2 from service_role;
grant select,insert on public.audit_plan_authorizations_v2 to service_role;
create trigger immutable_audit_plan_authorization_v2 before update or delete on public.audit_plan_authorizations_v2
for each row execute function public.reject_audit_report_mutation_v2();
create function public.audit_authorize_plan_v2(p_job uuid,p_approval jsonb,p_requests integer,p_cost bigint)
returns setof public.audit_jobs_v2 language plpgsql security invoker set search_path=public as $$
declare j public.audit_jobs_v2; a public.audit_plan_authorizations_v2; b public.audit_collection_budgets_v2;
begin
 -- Reject SQL NULL/missing JSON fields explicitly (three-valued SQL logic).
 if jsonb_typeof(p_approval) is distinct from 'object'
 or jsonb_typeof(p_approval->'quotes') is distinct from 'array'
 or jsonb_typeof(p_approval->'samples') is distinct from 'array'
 or p_requests is null or p_requests not between 1 and 250
 or p_cost is null or p_cost <= 0 then raise exception 'Invalid approval shape'; end if;
 if jsonb_array_length(p_approval->'quotes') <> p_requests
 or jsonb_array_length(p_approval->'samples') < p_requests
 or exists(select 1 from jsonb_array_elements(p_approval->'quotes') q
   where jsonb_typeof(q->'upperCostMicros') is distinct from 'number'
   or (q->>'upperCostMicros') !~ '^[0-9]+$'
   or (q->>'upperCostMicros')::numeric <= 0)
 or (select sum((q->>'upperCostMicros')::numeric) from jsonb_array_elements(p_approval->'quotes') q) is distinct from p_cost::numeric
 or exists(select 1 from jsonb_array_elements(p_approval->'samples') s where s->>'jobId' is distinct from p_job::text)
 then raise exception 'Invalid approval values'; end if;
 select * into b from public.audit_collection_budgets_v2 where id=p_approval->>'budgetId' for update;
 if not found or b.purpose is distinct from p_approval->>'purpose' then raise exception 'Budget not approved'; end if;
 select * into j from public.audit_jobs_v2 where id=p_job for update;
 if not found then raise exception 'Job missing'; end if;
 select * into a from public.audit_plan_authorizations_v2 where job_id=p_job;
 if found then
   if a.approval <> p_approval then raise exception 'Immutable approval conflict'; end if;
   return next j; return;
 end if;
 if j.status <> 'queued' or j.version <> 0 or j.cost_reserved_micros <> 0 or j.max_cost_micros <> 0
 or exists(select 1 from public.audit_live_authorizations_v2 where job_id=p_job)
 or p_cost <= 0 or p_requests <= 0 or jsonb_array_length(p_approval->'quotes') <> p_requests
 or (select sum((q->>'upperCostMicros')::bigint) from jsonb_array_elements(p_approval->'quotes') q) <> p_cost
 or jsonb_array_length(p_approval->'samples') < p_requests
 or exists(select 1 from jsonb_array_elements(p_approval->'samples') s where s->>'jobId' <> p_job::text)
 then raise exception 'Plan authorization refused'; end if;
 update public.audit_collection_budgets_v2 set authorized_micros=authorized_micros+p_cost where id=b.id;
 insert into public.audit_plan_authorizations_v2 values(p_job,b.id,p_approval,p_cost);
 update public.audit_jobs_v2 set plan=p_approval->'samples',max_requests=p_requests,max_cost_micros=p_cost where id=p_job returning * into j;
 return next j;
end; $$;
revoke all on function public.audit_authorize_plan_v2(uuid,jsonb,integer,bigint) from public,anon,authenticated;
grant execute on function public.audit_authorize_plan_v2(uuid,jsonb,integer,bigint) to service_role;
create or replace function public.audit_inspect_live_v2(p_job uuid)
returns jsonb language sql security invoker set search_path=public as $$
 select jsonb_build_object('job',to_jsonb(j),'evidence',
 (select coalesce(jsonb_agg(e.evidence),'[]') from public.audit_evidence_v2 e where e.job_id=j.id),
 'reservations',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from public.audit_provider_reservations_v2 r where r.job_id=j.id))
 from public.audit_jobs_v2 j where j.id=p_job and
 (exists(select 1 from public.audit_live_authorizations_v2 a where a.job_id=j.id)
 or exists(select 1 from public.audit_plan_authorizations_v2 a where a.job_id=j.id));
$$;
