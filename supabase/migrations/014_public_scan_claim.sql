-- One background execution per public scan. A stale crashed execution may be
-- reclaimed only after the full route deadline; paid-request gates remain permanent.
grant update(status,updated_at,progress_events) on public.scan_sessions to service_role;
create function public.audit_claim_public_scan(p_session uuid)
returns boolean language plpgsql security invoker set search_path=public as $$
begin
 update public.scan_sessions set status='scanning',updated_at=now(),
 progress_events='["Inspecting public pages, researching keywords and sampling AI answers."]'::jsonb
 where id=p_session and (status is distinct from 'scanning'::public.session_status or updated_at<now()-interval '10 minutes');
 return found;
end; $$;
revoke all on function public.audit_claim_public_scan(uuid) from public,anon,authenticated;
grant execute on function public.audit_claim_public_scan(uuid) to service_role;
