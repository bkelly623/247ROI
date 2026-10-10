-- Payment ledger for Stripe confirmation, webhook dedupe, and paid onboarding.
-- Not applied to a remote database in this change. Run in the Supabase SQL editor as postgres.
-- Service role only. security definer functions stay in the unexposed payments schema.

create schema if not exists payments;
revoke all on schema payments from public, anon, authenticated;
grant usage on schema payments to service_role;

create or replace function payments.status_rank(s text) returns integer
language sql immutable as $$
  select case s
    when 'pending' then 10
    when 'unrecognized' then 15
    when 'processing' then 20
    when 'expired' then 30
    when 'failed' then 30
    when 'paid' then 40
    when 'partially_refunded' then 50
    when 'refunded' then 60
    else 0
  end
$$;

create or replace function payments.merge_status(current_status text, incoming_status text) returns text
language sql immutable as $$
  select case
    when current_status is null then incoming_status
    when payments.status_rank(incoming_status) < payments.status_rank(current_status) then current_status
    when payments.status_rank(incoming_status) = payments.status_rank(current_status)
      and incoming_status is distinct from current_status then current_status
    else incoming_status
  end
$$;

create table if not exists payments.fulfillments (
  id uuid primary key default gen_random_uuid(),
  stripe_account_id text not null,
  mode text not null check (mode in ('test', 'live')),
  checkout_session_id text,
  payment_intent_id text,
  charge_id text,
  customer_id text,
  browser_binding text,
  status text not null,
  recognized boolean not null default false,
  amount_total integer,
  currency text,
  refund_seen boolean not null default false,
  full_refund boolean not null default false,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (checkout_session_id is not null or payment_intent_id is not null),
  check (status in ('pending', 'processing', 'expired', 'failed', 'unrecognized', 'paid', 'partially_refunded', 'refunded'))
);

create unique index if not exists fulfillments_session_uidx
  on payments.fulfillments (stripe_account_id, mode, checkout_session_id)
  where checkout_session_id is not null;
create unique index if not exists fulfillments_intent_uidx
  on payments.fulfillments (stripe_account_id, mode, payment_intent_id)
  where payment_intent_id is not null;

create table if not exists payments.stripe_events (
  stripe_account_id text not null,
  mode text not null check (mode in ('test', 'live')),
  event_id text not null,
  event_type text not null,
  result jsonb not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  primary key (stripe_account_id, mode, event_id)
);

create table if not exists payments.onboarding_profiles (
  fulfillment_id uuid primary key references payments.fulfillments (id),
  stripe_account_id text not null,
  mode text not null check (mode in ('test', 'live')),
  business_name text not null check (char_length(business_name) between 2 and 160),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null check (char_length(phone) between 7 and 30),
  website text not null default '' check (char_length(website) <= 200),
  service_notes text not null check (char_length(service_notes) between 10 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique check (char_length(dedupe_key) between 8 and 200),
  mode text not null check (mode in ('test', 'live')),
  kind text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  attempt_count integer not null default 0,
  last_error text,
  claimed_by text,
  claim_token text,
  lease_until timestamptz,
  next_attempt_at timestamptz,
  abandoned_at timestamptz
);

alter table payments.notification_outbox add column if not exists claim_token text;

alter table payments.fulfillments enable row level security;
alter table payments.stripe_events enable row level security;
alter table payments.onboarding_profiles enable row level security;
alter table payments.notification_outbox enable row level security;
revoke all on payments.fulfillments, payments.stripe_events, payments.onboarding_profiles, payments.notification_outbox from public, anon, authenticated;
grant select, insert, update on payments.fulfillments, payments.stripe_events, payments.onboarding_profiles, payments.notification_outbox to service_role;

create or replace function payments.apply_payment_transition(
  p_account text,
  p_mode text,
  p_event_id text,
  p_event_type text,
  p_kind text,
  p_session_id text,
  p_payment_intent_id text,
  p_charge_id text,
  p_customer_id text,
  p_amount integer,
  p_currency text,
  p_recognized boolean,
  p_outcome text,
  p_full_refund boolean,
  p_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = payments, pg_catalog
as $$
declare
  v_event payments.stripe_events%rowtype;
  v_row payments.fulfillments%rowtype;
  v_found boolean := false;
  v_incoming text;
  v_status text;
  v_recognized boolean;
  v_refund_seen boolean;
  v_full boolean;
  v_fulfilled_now boolean := false;
  v_session text;
  v_intent text;
  v_result jsonb;
  v_session_row payments.fulfillments%rowtype;
  v_intent_row payments.fulfillments%rowtype;
  v_has_session boolean := false;
  v_has_intent boolean := false;
  v_keep uuid;
  v_drop uuid;
  v_binding text;
begin
  if p_account is distinct from 'acct_1UOPq6QZRAfgWEE0' then
    raise exception 'stripe_account_not_allowed';
  end if;
  if p_mode not in ('test', 'live') or p_kind not in ('checkout', 'refund', 'ignore') then
    raise exception 'payment_transition_invalid';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('payments-account|' || p_account || '|' || p_mode, 0));

  select * into v_event from payments.stripe_events
   where stripe_account_id = p_account and mode = p_mode and event_id = p_event_id;
  if found then
    return v_event.result || jsonb_build_object('duplicate', true, 'fulfilled_now', false, 'fulfilledNow', false);
  end if;

  if p_session_id is not null then
    select * into v_session_row from payments.fulfillments
     where stripe_account_id = p_account and mode = p_mode and checkout_session_id = p_session_id
     for update;
    v_has_session := found;
  end if;
  if p_payment_intent_id is not null then
    select * into v_intent_row from payments.fulfillments
     where stripe_account_id = p_account and mode = p_mode and payment_intent_id = p_payment_intent_id
     for update;
    v_has_intent := found;
  end if;
  if v_has_session and v_has_intent and v_session_row.id is distinct from v_intent_row.id then
    if (v_session_row.checkout_session_id is not null and v_intent_row.checkout_session_id is not null and v_session_row.checkout_session_id is distinct from v_intent_row.checkout_session_id)
      or (v_session_row.payment_intent_id is not null and v_intent_row.payment_intent_id is not null and v_session_row.payment_intent_id is distinct from v_intent_row.payment_intent_id)
      or (v_session_row.customer_id is not null and v_intent_row.customer_id is not null and v_session_row.customer_id is distinct from v_intent_row.customer_id)
      or (v_session_row.browser_binding is not null and v_intent_row.browser_binding is not null and v_session_row.browser_binding is distinct from v_intent_row.browser_binding)
      or (
        exists (select 1 from payments.onboarding_profiles where fulfillment_id = v_session_row.id)
        and exists (select 1 from payments.onboarding_profiles where fulfillment_id = v_intent_row.id)
      ) then
      raise exception 'payment_identity_conflict';
    end if;
    if exists (select 1 from payments.onboarding_profiles where fulfillment_id = v_intent_row.id)
      and not exists (select 1 from payments.onboarding_profiles where fulfillment_id = v_session_row.id) then
      v_keep := v_intent_row.id; v_drop := v_session_row.id;
    else
      v_keep := v_session_row.id; v_drop := v_intent_row.id;
    end if;
    update payments.onboarding_profiles set fulfillment_id = v_keep where fulfillment_id = v_drop;
    delete from payments.fulfillments where id = v_drop;
    update payments.fulfillments set
      checkout_session_id = coalesce(v_session_row.checkout_session_id, v_intent_row.checkout_session_id),
      payment_intent_id = coalesce(v_session_row.payment_intent_id, v_intent_row.payment_intent_id),
      charge_id = coalesce(v_session_row.charge_id, v_intent_row.charge_id),
      customer_id = coalesce(v_session_row.customer_id, v_intent_row.customer_id),
      browser_binding = coalesce(v_session_row.browser_binding, v_intent_row.browser_binding),
      recognized = v_session_row.recognized or v_intent_row.recognized,
      refund_seen = v_session_row.refund_seen or v_intent_row.refund_seen,
      full_refund = v_session_row.full_refund or v_intent_row.full_refund,
      amount_total = coalesce(v_session_row.amount_total, v_intent_row.amount_total),
      currency = coalesce(v_session_row.currency, v_intent_row.currency),
      status = payments.merge_status(v_session_row.status, v_intent_row.status),
      fulfilled_at = case
        when v_session_row.fulfilled_at is null then v_intent_row.fulfilled_at
        when v_intent_row.fulfilled_at is null then v_session_row.fulfilled_at
        else least(v_session_row.fulfilled_at, v_intent_row.fulfilled_at)
      end
    where id = v_keep;
    select * into v_row from payments.fulfillments where id = v_keep;
    v_found := true;
  elsif v_has_session then
    v_row := v_session_row;
    v_found := true;
  elsif v_has_intent then
    v_row := v_intent_row;
    v_found := true;
  else
    v_row := null;
  end if;

  v_binding := nullif(p_payload->>'browserBinding', '');
  if v_has_session and (
       (v_session_row.checkout_session_id is not null and p_session_id is not null and v_session_row.checkout_session_id is distinct from p_session_id)
    or (v_session_row.payment_intent_id is not null and p_payment_intent_id is not null and v_session_row.payment_intent_id is distinct from p_payment_intent_id)
    or (v_session_row.customer_id is not null and p_customer_id is not null and v_session_row.customer_id is distinct from p_customer_id)
    or (v_session_row.browser_binding is not null and v_binding is not null and v_session_row.browser_binding is distinct from v_binding)
  ) then
    raise exception 'payment_identity_conflict';
  end if;
  if v_has_intent and (not v_has_session or v_intent_row.id is distinct from v_session_row.id) and (
       (v_intent_row.checkout_session_id is not null and p_session_id is not null and v_intent_row.checkout_session_id is distinct from p_session_id)
    or (v_intent_row.payment_intent_id is not null and p_payment_intent_id is not null and v_intent_row.payment_intent_id is distinct from p_payment_intent_id)
    or (v_intent_row.customer_id is not null and p_customer_id is not null and v_intent_row.customer_id is distinct from p_customer_id)
    or (v_intent_row.browser_binding is not null and v_binding is not null and v_intent_row.browser_binding is distinct from v_binding)
  ) then
    raise exception 'payment_identity_conflict';
  end if;

  if p_kind = 'ignore' then
    v_result := jsonb_build_object(
      'duplicate', false, 'ignored', true, 'status', 'ignored',
      'fulfilled_now', false, 'fulfilledNow', false,
      'session_id', null, 'payment_intent_id', null, 'recognized', false
    );
    insert into payments.stripe_events (stripe_account_id, mode, event_id, event_type, result, payload)
    values (p_account, p_mode, p_event_id, p_event_type, v_result, coalesce(p_payload, '{}'::jsonb));
    return v_result;
  end if;

  v_refund_seen := coalesce(v_row.refund_seen, false);
  v_full := coalesce(v_row.full_refund, false);
  v_recognized := coalesce(v_row.recognized, false);

  if p_kind = 'refund' then
    v_full := coalesce(p_full_refund, false) or v_full;
    v_refund_seen := true;
    v_status := coalesce(v_row.status, 'pending');
    if v_row.fulfilled_at is not null or v_status in ('paid', 'partially_refunded', 'refunded') then
      v_incoming := case when v_full then 'refunded' else 'partially_refunded' end;
      v_status := payments.merge_status(v_status, v_incoming);
    end if;
    v_session := coalesce(p_session_id, v_row.checkout_session_id);
    v_intent := coalesce(p_payment_intent_id, v_row.payment_intent_id);
  else
    if not coalesce(p_recognized, false) and p_outcome in ('paid', 'unrecognized') then
      v_incoming := 'unrecognized';
    elsif p_outcome = 'paid' and v_refund_seen then
      v_incoming := case when v_full then 'refunded' else 'partially_refunded' end;
    elsif p_outcome = 'paid' then
      v_incoming := 'paid';
    elsif p_outcome = 'processing' then
      v_incoming := 'processing';
    elsif p_outcome = 'failed' then
      v_incoming := 'failed';
    elsif p_outcome = 'expired' then
      v_incoming := 'expired';
    elsif p_outcome = 'unrecognized' then
      v_incoming := 'unrecognized';
    else
      v_incoming := 'pending';
    end if;
    v_status := payments.merge_status(v_row.status, v_incoming);
    v_recognized := coalesce(p_recognized, false) or v_recognized;
    v_fulfilled_now := v_status in ('paid', 'partially_refunded') and v_recognized and not v_full and v_row.fulfilled_at is null;
    v_session := coalesce(p_session_id, v_row.checkout_session_id);
    v_intent := coalesce(p_payment_intent_id, v_row.payment_intent_id);
  end if;

  if v_found then
    update payments.fulfillments set
      checkout_session_id = v_session,
      payment_intent_id = v_intent,
      charge_id = coalesce(p_charge_id, charge_id),
      customer_id = coalesce(p_customer_id, customer_id),
      browser_binding = coalesce(v_binding, browser_binding),
      status = v_status,
      recognized = v_recognized,
      amount_total = coalesce(p_amount, amount_total),
      currency = coalesce(p_currency, currency),
      refund_seen = v_refund_seen,
      full_refund = v_full,
      fulfilled_at = case when v_fulfilled_now then now() else fulfilled_at end,
      updated_at = now()
    where id = v_row.id;
  else
    insert into payments.fulfillments (
      stripe_account_id, mode, checkout_session_id, payment_intent_id, charge_id, customer_id, browser_binding,
      status, recognized, amount_total, currency, refund_seen, full_refund, fulfilled_at
    ) values (
      p_account, p_mode, v_session, v_intent, p_charge_id, p_customer_id, v_binding,
      v_status, v_recognized, p_amount, p_currency, v_refund_seen, v_full,
      case when v_fulfilled_now then now() else null end
    );
  end if;

  if v_fulfilled_now and v_session is not null then
    insert into payments.notification_outbox (dedupe_key, mode, kind, payload)
    values (
      'fulfillment:' || p_account || ':' || p_mode || ':' || v_session,
      p_mode,
      'fulfillment_recorded',
      jsonb_build_object('sessionId', v_session, 'mode', p_mode, 'amountTotal', p_amount, 'currency', p_currency)
    ) on conflict (dedupe_key) do nothing;
  end if;

  v_result := jsonb_build_object(
    'duplicate', false,
    'ignored', false,
    'status', v_status,
    'fulfilled_now', v_fulfilled_now,
    'fulfilledNow', v_fulfilled_now,
    'session_id', v_session,
    'payment_intent_id', v_intent,
    'recognized', v_recognized
  );
  insert into payments.stripe_events (stripe_account_id, mode, event_id, event_type, result, payload)
  values (p_account, p_mode, p_event_id, p_event_type, v_result, coalesce(p_payload, '{}'::jsonb));
  return v_result;
end;
$$;

create or replace function payments.get_payment_fulfillment(p_account text, p_mode text, p_session_id text)
returns jsonb
language plpgsql
security definer
set search_path = payments, pg_catalog
as $$
declare
  v jsonb;
begin
  select jsonb_build_object(
    'session_id', checkout_session_id,
    'payment_intent_id', payment_intent_id,
    'charge_id', charge_id,
    'customer_id', customer_id,
    'status', status,
    'recognized', recognized,
    'amount_total', amount_total,
    'currency', currency,
    'refund_seen', refund_seen,
    'full_refund', full_refund,
    'fulfilled_at', fulfilled_at,
    'browser_binding', browser_binding
  ) into v
  from payments.fulfillments
  where stripe_account_id = p_account and mode = p_mode and checkout_session_id = p_session_id;
  return v;
end;
$$;

create or replace function payments.save_payment_onboarding(
  p_account text,
  p_mode text,
  p_session_id text,
  p_business_name text,
  p_contact_name text,
  p_email text,
  p_phone text,
  p_website text,
  p_service_notes text,
  p_dedupe_key text
) returns jsonb
language plpgsql
security definer
set search_path = payments, pg_catalog
as $$
declare
  v_row payments.fulfillments%rowtype;
  v_updated timestamptz := now();
begin
  if p_account is distinct from 'acct_1UOPq6QZRAfgWEE0' or p_mode not in ('test', 'live') then
    raise exception 'onboarding_not_available';
  end if;
  select * into v_row from payments.fulfillments
   where stripe_account_id = p_account and mode = p_mode and checkout_session_id = p_session_id
   for update;
  if not found or not v_row.recognized or v_row.full_refund or v_row.fulfilled_at is null or v_row.status not in ('paid', 'partially_refunded') then
    raise exception 'onboarding_not_available';
  end if;
  insert into payments.onboarding_profiles (
    fulfillment_id, stripe_account_id, mode, business_name, contact_name, email, phone, website, service_notes, updated_at
  ) values (
    v_row.id, p_account, p_mode, p_business_name, p_contact_name, p_email, p_phone, coalesce(p_website, ''), p_service_notes, v_updated
  )
  on conflict (fulfillment_id) do update set
    business_name = excluded.business_name,
    contact_name = excluded.contact_name,
    email = excluded.email,
    phone = excluded.phone,
    website = excluded.website,
    service_notes = excluded.service_notes,
    updated_at = excluded.updated_at;
  insert into payments.notification_outbox (dedupe_key, mode, kind, payload)
  values (
    p_dedupe_key, p_mode, 'onboarding_saved',
    jsonb_build_object('sessionId', p_session_id, 'mode', p_mode, 'businessName', p_business_name, 'email', p_email)
  ) on conflict (dedupe_key) do nothing;
  return jsonb_build_object('updated_at', v_updated);
end;
$$;

create or replace function payments.get_payment_onboarding(p_account text, p_mode text, p_session_id text)
returns jsonb
language plpgsql
security definer
set search_path = payments, pg_catalog
as $$
declare
  v jsonb;
begin
  select jsonb_build_object(
    'business_name', profile.business_name,
    'contact_name', profile.contact_name,
    'email', profile.email,
    'phone', profile.phone,
    'website', profile.website,
    'service_notes', profile.service_notes,
    'updated_at', profile.updated_at
  ) into v
  from payments.onboarding_profiles profile
  join payments.fulfillments fulfillment on fulfillment.id = profile.fulfillment_id
  where fulfillment.stripe_account_id = p_account
    and fulfillment.mode = p_mode
    and fulfillment.checkout_session_id = p_session_id;
  return v;
end;
$$;

create or replace function payments.enqueue_payment_notification(p_dedupe_key text, p_mode text, p_kind text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = payments, pg_catalog
as $$
begin
  insert into payments.notification_outbox (dedupe_key, mode, kind, payload)
  values (p_dedupe_key, p_mode, p_kind, coalesce(p_payload, '{}'::jsonb))
  on conflict (dedupe_key) do nothing;
  return jsonb_build_object('dedupe_key', p_dedupe_key);
end;
$$;

create or replace function payments.list_payment_notifications()
returns jsonb
language sql
security definer
set search_path = payments, pg_catalog
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'dedupe_key', dedupe_key,
    'mode', mode,
    'kind', kind,
    'payload', payload,
    'sent_at', sent_at,
    'attempt_count', attempt_count,
    'last_error', last_error
  ) order by created_at), '[]'::jsonb)
  from payments.notification_outbox
$$;

drop function if exists payments.mark_payment_notification(text, timestamptz, text);
drop function if exists public.mark_payment_notification(text, timestamptz, text);
drop function if exists payments.mark_payment_notification(text, text, timestamptz, text);
drop function if exists public.mark_payment_notification(text, text, timestamptz, text);

create or replace function payments.mark_payment_notification(p_dedupe_key text, p_claim_token text, p_sent_at timestamptz, p_error text)
returns jsonb
language plpgsql
security definer
set search_path = payments, pg_catalog
as $$
declare
  v_updated integer;
begin
  if p_claim_token is null or char_length(p_claim_token) < 32 then
    return jsonb_build_object('dedupe_key', p_dedupe_key, 'applied', false);
  end if;
  update payments.notification_outbox set
    sent_at = coalesce(p_sent_at, sent_at),
    last_error = case when p_sent_at is null then left(p_error, 300) else null end,
    claimed_by = null,
    lease_until = null,
    claim_token = null,
    next_attempt_at = case
      when p_sent_at is not null then next_attempt_at
      when attempt_count >= 8 then now() + interval '100 years'
      else now() + make_interval(secs => least(3600, power(2, attempt_count)::integer))
    end
  where dedupe_key = p_dedupe_key and claim_token = p_claim_token;
  get diagnostics v_updated = row_count;
  return jsonb_build_object('dedupe_key', p_dedupe_key, 'applied', v_updated = 1);
end;
$$;

create or replace function payments.claim_payment_notifications(p_worker text, p_limit integer, p_lease_seconds integer)
returns jsonb
language plpgsql
security definer
set search_path = payments, pg_catalog
as $$
declare
  v jsonb;
begin
  if p_worker is null or char_length(p_worker) < 8 or char_length(p_worker) > 80
    or p_limit is null or p_limit < 1 or p_limit > 25
    or p_lease_seconds is null or p_lease_seconds < 5 or p_lease_seconds > 300 then
    raise exception 'notification_claim_invalid';
  end if;
  with picked as (
    select id from payments.notification_outbox
    where sent_at is null
      and abandoned_at is null
      and (lease_until is null or lease_until < now())
      and (next_attempt_at is null or next_attempt_at <= now())
    order by created_at
    limit p_limit
    for update skip locked
  ),
  updated as (
    update payments.notification_outbox outbox
    set claimed_by = p_worker,
        claim_token = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
        attempt_count = outbox.attempt_count + 1,
        lease_until = now() + make_interval(secs => p_lease_seconds),
        abandoned_at = case when outbox.attempt_count + 1 >= 8 then now() else outbox.abandoned_at end
    from picked
    where outbox.id = picked.id
    returning jsonb_build_object(
      'dedupe_key', outbox.dedupe_key,
      'mode', outbox.mode,
      'kind', outbox.kind,
      'payload', outbox.payload,
      'attempt_count', outbox.attempt_count,
      'claim_token', outbox.claim_token
    ) as item
  )
  select coalesce(jsonb_agg(item), '[]'::jsonb) into v from updated;
  return v;
end;
$$;

create or replace function public.apply_payment_transition(p_account text, p_mode text, p_event_id text, p_event_type text, p_kind text, p_session_id text, p_payment_intent_id text, p_charge_id text, p_customer_id text, p_amount integer, p_currency text, p_recognized boolean, p_outcome text, p_full_refund boolean, p_payload jsonb)
returns jsonb language sql security invoker set search_path = payments, pg_catalog as $$
  select payments.apply_payment_transition(p_account, p_mode, p_event_id, p_event_type, p_kind, p_session_id, p_payment_intent_id, p_charge_id, p_customer_id, p_amount, p_currency, p_recognized, p_outcome, p_full_refund, p_payload)
$$;

create or replace function public.get_payment_fulfillment(p_account text, p_mode text, p_session_id text)
returns jsonb language sql security invoker set search_path = payments, pg_catalog as $$
  select payments.get_payment_fulfillment(p_account, p_mode, p_session_id)
$$;

create or replace function public.save_payment_onboarding(p_account text, p_mode text, p_session_id text, p_business_name text, p_contact_name text, p_email text, p_phone text, p_website text, p_service_notes text, p_dedupe_key text)
returns jsonb language sql security invoker set search_path = payments, pg_catalog as $$
  select payments.save_payment_onboarding(p_account, p_mode, p_session_id, p_business_name, p_contact_name, p_email, p_phone, p_website, p_service_notes, p_dedupe_key)
$$;

create or replace function public.get_payment_onboarding(p_account text, p_mode text, p_session_id text)
returns jsonb language sql security invoker set search_path = payments, pg_catalog as $$
  select payments.get_payment_onboarding(p_account, p_mode, p_session_id)
$$;

create or replace function public.enqueue_payment_notification(p_dedupe_key text, p_mode text, p_kind text, p_payload jsonb)
returns jsonb language sql security invoker set search_path = payments, pg_catalog as $$
  select payments.enqueue_payment_notification(p_dedupe_key, p_mode, p_kind, p_payload)
$$;

create or replace function public.list_payment_notifications()
returns jsonb language sql security invoker set search_path = payments, pg_catalog as $$
  select payments.list_payment_notifications()
$$;

create or replace function public.mark_payment_notification(p_dedupe_key text, p_claim_token text, p_sent_at timestamptz, p_error text)
returns jsonb language sql security invoker set search_path = payments, pg_catalog as $$
  select payments.mark_payment_notification(p_dedupe_key, p_claim_token, p_sent_at, p_error)
$$;

create or replace function public.claim_payment_notifications(p_worker text, p_limit integer, p_lease_seconds integer)
returns jsonb language sql security invoker set search_path = payments, pg_catalog as $$
  select payments.claim_payment_notifications(p_worker, p_limit, p_lease_seconds)
$$;

revoke all on function public.apply_payment_transition(text, text, text, text, text, text, text, text, text, integer, text, boolean, text, boolean, jsonb) from public, anon, authenticated;
revoke all on function public.get_payment_fulfillment(text, text, text) from public, anon, authenticated;
revoke all on function public.save_payment_onboarding(text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.get_payment_onboarding(text, text, text) from public, anon, authenticated;
revoke all on function public.enqueue_payment_notification(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.list_payment_notifications() from public, anon, authenticated;
revoke all on function public.mark_payment_notification(text, text, timestamptz, text) from public, anon, authenticated;
revoke all on function public.claim_payment_notifications(text, integer, integer) from public, anon, authenticated;
grant execute on function public.apply_payment_transition(text, text, text, text, text, text, text, text, text, integer, text, boolean, text, boolean, jsonb) to service_role;
grant execute on function public.get_payment_fulfillment(text, text, text) to service_role;
grant execute on function public.save_payment_onboarding(text, text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.get_payment_onboarding(text, text, text) to service_role;
grant execute on function public.enqueue_payment_notification(text, text, text, jsonb) to service_role;
grant execute on function public.list_payment_notifications() to service_role;
grant execute on function public.mark_payment_notification(text, text, timestamptz, text) to service_role;
grant execute on function public.claim_payment_notifications(text, integer, integer) to service_role;
revoke all on function payments.apply_payment_transition(text, text, text, text, text, text, text, text, text, integer, text, boolean, text, boolean, jsonb) from public, anon, authenticated;
revoke all on function payments.get_payment_fulfillment(text, text, text) from public, anon, authenticated;
revoke all on function payments.save_payment_onboarding(text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function payments.get_payment_onboarding(text, text, text) from public, anon, authenticated;
revoke all on function payments.enqueue_payment_notification(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function payments.list_payment_notifications() from public, anon, authenticated;
revoke all on function payments.mark_payment_notification(text, text, timestamptz, text) from public, anon, authenticated;
revoke all on function payments.claim_payment_notifications(text, integer, integer) from public, anon, authenticated;
grant execute on function payments.apply_payment_transition(text, text, text, text, text, text, text, text, text, integer, text, boolean, text, boolean, jsonb) to service_role;
grant execute on function payments.get_payment_fulfillment(text, text, text) to service_role;
grant execute on function payments.save_payment_onboarding(text, text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function payments.get_payment_onboarding(text, text, text) to service_role;
grant execute on function payments.enqueue_payment_notification(text, text, text, jsonb) to service_role;
grant execute on function payments.list_payment_notifications() to service_role;
grant execute on function payments.mark_payment_notification(text, text, timestamptz, text) to service_role;
grant execute on function payments.claim_payment_notifications(text, integer, integer) to service_role;
