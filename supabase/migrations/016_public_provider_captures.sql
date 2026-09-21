-- Private append-only response archive. Raw bytes never enter public report JSON.
create table public.audit_public_provider_captures (
 session_id uuid not null references public.scan_sessions(id),
 request_key text not null check(length(request_key)<=256),
 raw_sha256 text not null,
 raw_text text not null check(octet_length(raw_text)<=1048576),
 captured_at timestamptz not null default now(),
 primary key(session_id,request_key),
 check(raw_sha256=encode(pg_catalog.sha256(pg_catalog.convert_to(raw_text,'UTF8')),'hex'))
);
alter table public.audit_public_provider_captures enable row level security;
revoke all on public.audit_public_provider_captures from public,anon,authenticated,service_role;
grant select,insert on public.audit_public_provider_captures to service_role;
