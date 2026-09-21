-- Dependencies, in order: 004, 005, 006, 008, 010. 007/009/011 are NOT required.
-- No public v2 endpoints, worker, scheduler or report delivery are enabled.
-- Remaining authorization only: historical $0.012 receipt stays untouched.
insert into public.audit_collection_budgets_v2(id,purpose,ceiling_micros)
values ('public-chatgpt-remaining-088000','website',88000) on conflict(id) do nothing;

-- Operational evidence only: the actual prospect report remains in scan_sessions.
-- A reserved call is immediately partial/uncertain, NEVER left running on crash.
alter table public.audit_jobs_v2 add column public_chatgpt_outcome jsonb;

create function public.audit_reserve_public_chatgpt(p_session uuid,p_query text,p_request jsonb,p_upper_cost bigint)
returns boolean language plpgsql security invoker set search_path=public as $$
declare j public.audit_jobs_v2; plan jsonb; digest text; approval jsonb;
begin
 if p_session is null or p_query is null or length(trim(p_query))=0 or length(p_query)>4000
 or p_upper_cost is distinct from 4000::bigint
 or jsonb_typeof(p_request) is distinct from 'array' then return false; end if;
 if jsonb_array_length(p_request) <> 1 or jsonb_typeof(p_request->0) is distinct from 'object' then return false; end if;
 if p_request->0->>'keyword' is distinct from replace(replace(p_query,'%','%25'),'+','%2B')
 or p_request->0->>'language_code' is distinct from 'en'
 or p_request->0->'force_web_search' is distinct from 'true'::jsonb
 or p_request->0->>'location_name' is distinct from 'United States'
 or ((p_request->0) - array['keyword','language_code','force_web_search','location_name']) <> '{}'::jsonb
 then return false; end if;
 -- Fixed lock order across sessions, followed by underlying authorization/reserve locks.
 perform pg_advisory_xact_lock(247012);
 if not exists(select 1 from public.scan_sessions where id=p_session) then return false; end if;
 if exists(select 1 from public.audit_jobs_v2 where idempotency_key='public-chatgpt:'||p_session::text) then return false; end if;
 if not exists(select 1 from public.audit_collection_budgets_v2
   where id='public-chatgpt-remaining-088000' and purpose='website' and ceiling_micros=88000
   and authorized_micros+4000<=88000) then return false; end if;
 digest := encode(pg_catalog.sha256(pg_catalog.convert_to(p_request::text,'UTF8')),'hex');
 j.id := gen_random_uuid();
 plan := jsonb_build_array(jsonb_build_object('jobId',j.id,'lane','chatgpt','query',p_query,'requestBody',p_request));
 select * into j from public.audit_enqueue_v2(j.id,p_session,'public-chatgpt:'||p_session::text,
   digest,plan,1,0,encode(pg_catalog.sha256(pg_catalog.convert_to(gen_random_uuid()::text,'UTF8')),'hex'));
 approval := jsonb_build_object('budgetId','public-chatgpt-remaining-088000','purpose','website',
   'samples',plan,'quotes',jsonb_build_array(jsonb_build_object('upperCostMicros',4000)));
 perform public.audit_authorize_plan_v2(j.id,approval,1,4000);
 select * into j from public.audit_claim_v2(j.id,0);
 if not public.audit_reserve_v2(j.id,j.lease_token,'public-chatgpt-once',4000) then
   -- Roll back the WHOLE authorization, job and claim if no send is permitted.
   raise exception 'Public ChatGPT reservation refused';
 end if;
 update public.audit_jobs_v2 set status='partial',version=version+1,updated_at=now(),
 public_chatgpt_outcome=jsonb_build_object('status','uncertain','reservedAt',now(),
   'note','Send authorized; outcome not recorded. Never retry or refund.') where id=j.id;
 return true;
end; $$;

-- Caller records the sanitized probe result in finally. This does not reconcile
-- billing, change reservations, enable retries, or fabricate a v2 report snapshot.
-- First terminal receipt wins; exact repeated receipt is idempotent.
create function public.audit_record_public_chatgpt(p_session uuid,p_outcome jsonb)
returns boolean language plpgsql security invoker set search_path=public as $$
declare j public.audit_jobs_v2;
begin
 if jsonb_typeof(p_outcome) is distinct from 'object'
 or coalesce(p_outcome->>'status','') not in ('observed','unmeasured','error','blocked')
 or octet_length(p_outcome::text)>262144 then return false; end if;
 select * into j from public.audit_jobs_v2 where idempotency_key='public-chatgpt:'||p_session::text for update;
 if not found or j.requests_reserved<>1 or j.cost_reserved_micros<>4000 then return false; end if;
 if j.public_chatgpt_outcome->>'status' <> 'uncertain' then return j.public_chatgpt_outcome=p_outcome; end if;
 update public.audit_jobs_v2 set public_chatgpt_outcome=p_outcome,updated_at=now()
 where id=j.id;
 return true;
end; $$;
revoke all on function public.audit_reserve_public_chatgpt(uuid,text,jsonb,bigint),
 public.audit_record_public_chatgpt(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.audit_reserve_public_chatgpt(uuid,text,jsonb,bigint),
 public.audit_record_public_chatgpt(uuid,jsonb) to service_role;
