-- Use the stored approved ceiling, not a historical hard-coded pilot value.
-- This migration DOES NOT provision, reset, or increase any allowance.
-- Extend the EXISTING remaining budget; never provision or replenish another allowance.
create or replace function public.audit_reserve_public_collection(p_session uuid,p_kind text,p_sample_key text,p_query text,p_request jsonb,p_upper_cost bigint)
returns boolean language plpgsql security invoker set search_path=public as $$
declare j public.audit_jobs_v2; plan jsonb; digest text; approval jsonb; ceiling bigint; expected_limit integer; k text;
begin
 if p_session is null or p_query is null or length(p_query) not between 1 and 4000
 or p_kind not in ('chatgpt','ranked_keywords','competitors_domain') or p_kind is null
 or p_sample_key is null or p_sample_key !~ '^[a-f0-9]{64}$'
 or jsonb_typeof(p_request) is distinct from 'array' then return false; end if;
 if jsonb_array_length(p_request)<>1 or jsonb_typeof(p_request->0) is distinct from 'object' then return false; end if;
 ceiling := case p_kind when 'chatgpt' then 4000 when 'ranked_keywords' then 14400 else 12360 end;
 if p_upper_cost is null or p_upper_cost<=0 or p_upper_cost>ceiling then return false; end if;
 if p_kind='chatgpt' then
   if p_request->0->>'keyword' is distinct from replace(replace(p_query,'%','%25'),'+','%2B')
   or p_request->0->>'language_code' is distinct from 'en'
   or p_request->0->'force_web_search' is distinct from 'true'::jsonb
   or p_request->0->>'location_name' is distinct from 'United States'
   or ((p_request->0)-array['keyword','language_code','force_web_search','location_name'])<>'{}'::jsonb then return false; end if;
 else
   expected_limit := case p_kind when 'ranked_keywords' then 20 else 3 end;
   if p_request->0->>'location_code' is distinct from '2840'
   or p_request->0->>'language_code' is distinct from 'en'
   or p_request->0->'include_clickstream_data' is distinct from 'false'::jsonb
   or p_request->0->>'limit' is distinct from expected_limit::text
   or coalesce(p_request->0->>'target','') !~ '^[a-zA-Z0-9.-]+$'
   or ((p_request->0)-array['target','location_code','language_code','limit','order_by','filters','ignore_synonyms','exclude_top_domains','item_types','historical_serp_mode','include_clickstream_data','offset','load_rank_absolute','max_rank_group','exclude_domains'])<>'{}'::jsonb then return false; end if;
 end if;
 perform pg_advisory_xact_lock(247012);
 if not exists(select 1 from public.scan_sessions where id=p_session) then return false; end if;
 k := 'public-collection:'||p_session::text||':'||p_kind||':'||p_sample_key;
 if exists(select 1 from public.audit_jobs_v2 where idempotency_key=k) then return false; end if;
 if (select count(*) from public.audit_jobs_v2 aj where aj.session_id=p_session and aj.plan->0->>'lane'=p_kind) >= (case when p_kind='chatgpt' then 3 else 1 end) then return false; end if;
 if not exists(select 1 from public.audit_collection_budgets_v2 where id='public-chatgpt-remaining-088000' and purpose='website' and authorized_micros+p_upper_cost<=ceiling_micros) then return false; end if;
 digest := encode(pg_catalog.sha256(pg_catalog.convert_to(p_request::text,'UTF8')),'hex');
 j.id := gen_random_uuid();
 plan := jsonb_build_array(jsonb_build_object('jobId',j.id,'lane',p_kind,'query',p_query,'requestBody',p_request));
 select * into j from public.audit_enqueue_v2(j.id,p_session,k,digest,plan,1,0,encode(pg_catalog.sha256(pg_catalog.convert_to(gen_random_uuid()::text,'UTF8')),'hex'));
 approval := jsonb_build_object('budgetId','public-chatgpt-remaining-088000','purpose','website','samples',plan,'quotes',jsonb_build_array(jsonb_build_object('upperCostMicros',p_upper_cost)));
 perform public.audit_authorize_plan_v2(j.id,approval,1,p_upper_cost);
 select * into j from public.audit_claim_v2(j.id,0);
 if not public.audit_reserve_v2(j.id,j.lease_token,'public-paid-once',p_upper_cost) then raise exception 'Collection reservation refused'; end if;
 update public.audit_jobs_v2 set status='partial',version=version+1,updated_at=now(),public_chatgpt_outcome=jsonb_build_object('status','uncertain','reservedAt',now(),'note','No automatic retry or refund') where id=j.id;
 return true;
end; $$;

revoke all on function public.audit_reserve_public_collection(uuid,text,text,text,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.audit_reserve_public_collection(uuid,text,text,text,jsonb,bigint) to service_role;
