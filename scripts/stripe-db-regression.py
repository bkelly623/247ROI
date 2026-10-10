#!/usr/bin/env python3
"""Real isolated PostgreSQL 17 migration/RPC tests. No network or production access."""
import concurrent.futures, hashlib, json, os, pathlib, secrets, subprocess, time, traceback
ROOT = pathlib.Path('/tmp/247roi-stripe-payment/scripts')
SOURCE = pathlib.Path('/tmp/247roi-stripe-payment/supabase/migrations/018_payments_ledger.sql')
NAME = 'george-stripe-db-' + secrets.token_hex(6)
ACCOUNT = 'acct_1UOPq6QZRAfgWEE0'
report = {'container': NAME, 'fixture': 'Synthetic test-mode records only; local roles anon/authenticated NOLOGIN and service_role NOLOGIN BYPASSRLS. PostgreSQL 17 built-in gen_random_uuid; no extensions required.', 'operations': [], 'tests': []}
def command(args, **kw):
    return subprocess.run(args, text=True, capture_output=True, **kw)
def sql(text, role=None, expected_error=None):
    statement = ('SET ROLE '+role+';\n' if role else '') + text
    r = command(['docker','exec','-i',NAME,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'], input=statement)
    report['operations'].append({'sql':statement,'exit_code':r.returncode,'stdout':r.stdout.strip(),'stderr':r.stderr.strip()})
    if expected_error:
        assert r.returncode != 0 and expected_error in r.stderr, (r.stdout, r.stderr)
        return r.stderr
    if r.returncode: raise RuntimeError(r.stderr)
    return r.stdout.strip()
def lit(v):
    if v is None: return 'NULL'
    if isinstance(v,bool): return str(v).lower()
    if isinstance(v,int): return str(v)
    return "'"+str(v).replace("'","''")+"'"
def transition(event, session='cs_fixture_paid', intent='pi_fixture_paid', kind='checkout', outcome='paid', full=False, recognized=True, customer='cus_fixture', payload='{}'):
    args=[ACCOUNT,'test',event,'fixture.'+kind,kind,session,intent,'ch_fixture',customer,9900,'usd',recognized,outcome,full,payload]
    return 'SELECT public.apply_payment_transition('+','.join(map(lit,args))+');'
def mark(key, token, sent=None, error=None):
    return "SELECT public.mark_payment_notification("+",".join(map(lit,[key, token, sent, error]))+");"
def rpc(text): return json.loads(sql(text,'service_role'))
def read(session): return rpc('SELECT public.get_payment_fulfillment('+','.join(map(lit,[ACCOUNT,'test',session]))+');')
def save(session='cs_fixture_paid', business='Fixture Business'):
    return 'SELECT public.save_payment_onboarding('+','.join(map(lit,[ACCOUNT,'test',session,business,'Fixture Person','fixture@example.invalid','5550101234','https://example.invalid','Synthetic onboarding test only','onboarding:'+session]))+');'
def test(name, fn):
    try:
        detail=fn()
        report['tests'].append({'name':name,'status':'PASS','detail':detail})
    except Exception as e:
        report['tests'].append({'name':name,'status':'FAIL','error':str(e),'traceback':traceback.format_exc()})
def check(value, expected):
    assert value == expected, {'actual':value,'expected':expected}
def paid():
    r=rpc(transition('evt_paid')); check(r,{'duplicate':False,'ignored':False,'status':'paid','fulfilled_now':True,'fulfilledNow':True,'session_id':'cs_fixture_paid','payment_intent_id':'pi_fixture_paid','recognized':True})
    row=read('cs_fixture_paid'); assert row.pop('fulfilled_at') is not None
    check(row,dict(session_id='cs_fixture_paid',payment_intent_id='pi_fixture_paid',charge_id='ch_fixture',customer_id='cus_fixture',status='paid',recognized=True,amount_total=9900,currency='usd',refund_seen=False,full_refund=False,browser_binding=None))
    duplicate=rpc(transition('evt_paid')); r.update(duplicate=True,fulfilled_now=False,fulfilledNow=False); check(duplicate,r)
    check(sql("SELECT count(*) FROM payments.fulfillments WHERE checkout_session_id='cs_fixture_paid';"),'1')
    check(sql("SELECT count(*) FROM payments.stripe_events WHERE event_id='evt_paid';"),'1')
    check(sql("SELECT count(*) FROM payments.notification_outbox WHERE payload->>'sessionId'='cs_fixture_paid';"),'1')
    return {'readback':row,'duplicate':duplicate}
def onboarding():
    r=rpc(save()); got=rpc("SELECT public.get_payment_onboarding('"+ACCOUNT+"','test','cs_fixture_paid');")
    check(got,dict(business_name='Fixture Business',contact_name='Fixture Person',email='fixture@example.invalid',phone='5550101234',website='https://example.invalid',service_notes='Synthetic onboarding test only',updated_at=r['updated_at']))
    rpc(save(business='Fixture Updated')); got2=rpc("SELECT public.get_payment_onboarding('"+ACCOUNT+"','test','cs_fixture_paid');")
    check(got2['business_name'],'Fixture Updated'); check(sql('SELECT count(*) FROM payments.onboarding_profiles;'),'1')
    check(sql("SELECT count(*) FROM payments.notification_outbox WHERE dedupe_key='onboarding:cs_fixture_paid';"),'1')
    return got2
def refunds():
    results=[]
    for full in (False, True):
        suffix='full' if full else 'partial'; session='cs_before_'+suffix; intent='pi_before_'+suffix
        first=rpc(transition('evt_refund_'+suffix,None,intent,'refund',full=full)); check(first['status'],'pending')
        r=rpc(transition('evt_after_'+suffix,session,intent)); check(r['status'],'refunded' if full else 'partially_refunded')
        row=read(session); check(row['refund_seen'],True); check(row['full_refund'],full)
        if full:
            check(r['fulfilledNow'],False); check(row['fulfilled_at'],None)
            check(sql("SELECT count(*) FROM payments.notification_outbox WHERE kind='fulfillment_recorded' AND payload->>'sessionId'="+lit(session)+';'),'0')
            sql(save(session),'service_role','onboarding_not_available')
        else:
            check(r['fulfilledNow'],True); assert row['fulfilled_at'] is not None
            check(sql("SELECT count(*) FROM payments.notification_outbox WHERE kind='fulfillment_recorded' AND payload->>'sessionId'="+lit(session)+';'),'1')
            rpc(save(session))
        results.append(row)
    rpc(transition('evt_partial_after_paid',kind='refund')); check(read('cs_fixture_paid')['status'],'partially_refunded')
    rpc(transition('evt_full_after_paid',kind='refund',full=True)); check(read('cs_fixture_paid')['status'],'refunded')
    rpc(transition('evt_stale_paid')); check(read('cs_fixture_paid')['status'],'refunded')
    sql(save(),'service_role','onboarding_not_available')
    return results
def permissions():
    names=['apply_payment_transition','get_payment_fulfillment','save_payment_onboarding','get_payment_onboarding','enqueue_payment_notification','list_payment_notifications','mark_payment_notification','claim_payment_notifications']
    acl=json.loads(sql("SELECT json_agg(json_build_object('schema',n.nspname,'name',p.proname,'anon',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticated',has_function_privilege('authenticated',p.oid,'EXECUTE'),'service_role',has_function_privilege('service_role',p.oid,'EXECUTE'))) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','payments') AND p.proname IN ("+','.join(map(lit,names))+');'))
    check(len(acl),16)
    for x in acl: check((x['anon'],x['authenticated'],x['service_role']),(False,False,True))
    for role in ('anon','authenticated'):
        sql(transition('evt_forbidden_'+role),role,'permission denied')
        sql('SELECT * FROM payments.fulfillments;',role,'permission denied')
    check(sql("SELECT count(*) FROM payments.stripe_events WHERE event_id LIKE 'evt_forbidden_%';"),'0')
    check(sql("SELECT count(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname='payments' AND c.relkind='r' AND c.relrowsecurity;"),'4')
    sql(transition('evt_wrong_account').replace(ACCOUNT,'acct_fixture_not_allowed'),'service_role','stripe_account_not_allowed')
    check(sql("SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','payments') AND p.proname='mark_payment_notification' AND pg_get_function_identity_arguments(p.oid)='text, timestamp with time zone, text';"),'0')
    return acl
def concurrency_test():
    results=[]
    for duplicate in (True,False):
        suffix='same' if duplicate else 'distinct'; session='cs_concurrent_'+suffix; intent='pi_concurrent_'+suffix
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            rows=list(pool.map(lambda i:rpc(transition('evt_concurrent_'+suffix+('' if duplicate else str(i)),session,intent)),range(8)))
        check(sum(x['fulfilledNow'] for x in rows),1); check(sum(x['duplicate'] for x in rows),7 if duplicate else 0)
        check(sql('SELECT count(*) FROM payments.fulfillments WHERE checkout_session_id='+lit(session)+';'),'1')
        check(sql("SELECT count(*) FROM payments.notification_outbox WHERE payload->>'sessionId'="+lit(session)+';'),'1')
        check(read(session)['status'],'paid'); results.append(rows)
    return results
def different_lock_concurrency():
    first=transition('evt_lock_session','cs_lock',None,outcome='processing')
    script="SET application_name='stripe_fixture_hold'; SET ROLE service_role; BEGIN; "+first+" SELECT pg_sleep(2); COMMIT;"
    proc=subprocess.Popen(['docker','exec','-i',NAME,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    proc.stdin.write(script); proc.stdin.close()
    for _ in range(50):
        if sql("SELECT count(*) FROM pg_stat_activity WHERE application_name='stripe_fixture_hold' AND wait_event='PgSleep';")=='1': break
        time.sleep(.05)
    else: raise AssertionError('Holding transaction did not reach pg_sleep')
    second=transition('evt_lock_intent','cs_lock','pi_lock')
    box={'done':False,'result':None,'error':None}
    def run_second():
        try: box['result']=rpc(second)
        except Exception as e: box['error']=str(e)
        finally: box['done']=True
    import threading
    thread=threading.Thread(target=run_second); thread.start()
    time.sleep(.3)
    waiting=sql("SELECT count(*) FROM pg_stat_activity WHERE query LIKE '%evt_lock_intent%' AND state='active';")
    thread.join(timeout=15); proc.wait(timeout=15)
    stdout=proc.stdout.read(); stderr=proc.stderr.read()
    report['operations'].append({'sql':script,'exit_code':proc.returncode,'stdout':stdout,'stderr':stderr,'saw_second_active':waiting})
    check(proc.returncode,0); assert box['error'] is None, box['error']
    check(box['result']['status'],'paid'); check(box['result']['duplicate'],False)
    row=read('cs_lock'); check(row['payment_intent_id'],'pi_lock'); check(row['status'],'paid')
    check(sql("SELECT count(*) FROM payments.fulfillments WHERE checkout_session_id='cs_lock';"),'1')
    return {'waiting':waiting,'row':row}
def order_equivalence():
    rpc(transition('evt_order_paid','cs_order_paid','pi_order_paid'))
    before=read('cs_order_paid'); assert before['fulfilled_at'] is not None
    rpc(transition('evt_order_refund',None,'pi_order_paid',kind='refund'))
    paid_first=read('cs_order_paid'); refund_first=read('cs_before_partial')
    check(paid_first['status'],'partially_refunded'); check(refund_first['status'],'partially_refunded')
    assert paid_first['fulfilled_at'] is not None and refund_first['fulfilled_at'] is not None
    check(paid_first['fulfilled_at'],before['fulfilled_at'])
    check(sql("SELECT count(*) FROM payments.notification_outbox WHERE kind='fulfillment_recorded' AND payload->>'sessionId'='cs_order_paid';"),'1')
    check(sql("SELECT count(*) FROM payments.notification_outbox WHERE kind='fulfillment_recorded' AND payload->>'sessionId'='cs_before_partial';"),'1')
    return {'paid_then_partial':paid_first['status'],'partial_then_paid':refund_first['status']}
def split_identity():
    rpc(transition('evt_split_session','cs_split',None,outcome='processing'))
    rpc(transition('evt_split_refund',None,'pi_split',kind='refund'))
    linked=rpc(transition('evt_split_link','cs_split','pi_split'))
    check(linked['status'],'partially_refunded'); check(linked['fulfilledNow'],True)
    rows=json.loads(sql("SELECT json_agg(t) FROM (SELECT checkout_session_id,payment_intent_id,status,refund_seen,full_refund,fulfilled_at IS NOT NULL AS fulfilled FROM payments.fulfillments WHERE checkout_session_id='cs_split' OR payment_intent_id='pi_split') t;"))
    check(len(rows),1); check(rows[0]['payment_intent_id'],'pi_split'); check(rows[0]['refund_seen'],True); check(rows[0]['fulfilled'],True)
    check(sql("SELECT count(*) FROM payments.stripe_events WHERE event_id='evt_split_link';"),'1')
    again=rpc(transition('evt_split_link','cs_split','pi_split')); check(again['duplicate'],True); check(again['fulfilledNow'],False)
    conflict="SELECT public.apply_payment_transition('acct_1UOPq6QZRAfgWEE0','test','evt_conflict_a','fixture.checkout','checkout','cs_conflict',NULL,'ch_a','cus_a',9900,'usd',false,'processing',false,'{}');"
    rpc(conflict)
    rpc("SELECT public.apply_payment_transition('acct_1UOPq6QZRAfgWEE0','test','evt_conflict_b','fixture.refund','refund',NULL,'pi_conflict','ch_b','cus_b',9900,'usd',false,NULL,false,'{}');")
    sql("SELECT public.apply_payment_transition('acct_1UOPq6QZRAfgWEE0','test','evt_conflict_link','fixture.checkout','checkout','cs_conflict','pi_conflict','ch_a','cus_a',9900,'usd',true,'paid',false,'{}');",'service_role','payment_identity_conflict')
    check(sql("SELECT count(*) FROM payments.fulfillments WHERE checkout_session_id='cs_conflict' OR payment_intent_id='pi_conflict';"),'2')
    return rows
def notification_claim():
    key='fixture-claim-one'
    sql("UPDATE payments.notification_outbox SET sent_at=now() WHERE sent_at IS NULL;")
    rpc("SELECT public.enqueue_payment_notification('"+key+"','test','fixture','{\"fixture\":true}');")
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        claimed=list(pool.map(lambda i: rpc("SELECT public.claim_payment_notifications('worker-"+str(i)+"-abcdefgh',1,30);"), range(2)))
    flat=[item for batch in claimed for item in batch]
    check(len(flat),1); check(flat[0]['dedupe_key'],key)
    check(len(rpc("SELECT public.claim_payment_notifications('worker-later-abcdefgh',1,30);")),0)
    sql("UPDATE payments.notification_outbox SET lease_until=now()-interval '1 second' WHERE dedupe_key='"+key+"';")
    recovered=rpc("SELECT public.claim_payment_notifications('worker-recover-abcdef',1,30);")
    check(len(recovered),1)
    token=recovered[0]['claim_token']; assert len(token)>=32
    check(rpc(mark(key, token, error='fixture failure'))['applied'], True)
    check(len(rpc("SELECT public.claim_payment_notifications('worker-backoff-abcdef',1,30);")),0)
    sql("UPDATE payments.notification_outbox SET next_attempt_at=now()-interval '1 second', lease_until=NULL WHERE dedupe_key='"+key+"';")
    retry=rpc("SELECT public.claim_payment_notifications('worker-retry-abcdefgh',1,30);")
    check(len(retry),1)
    check(rpc(mark(key, retry[0]['claim_token'], '2026-01-01T00:00:00Z'))['applied'], True)
    check(len(rpc("SELECT public.claim_payment_notifications('worker-sent-abcdefghij',1,30);")),0)
    return recovered
def notification_fence():
    key='fixture-fence-one'
    rpc("SELECT public.enqueue_payment_notification('"+key+"','test','fixture','{\"fixture\":true}');")
    sql("UPDATE payments.notification_outbox SET sent_at=now() WHERE sent_at IS NULL AND dedupe_key<>'"+key+"';")
    first=rpc("SELECT public.claim_payment_notifications('worker-fence-a-abcdef',1,30);")[0]
    sql("UPDATE payments.notification_outbox SET lease_until=now()-interval '1 second' WHERE dedupe_key='"+key+"';")
    second=rpc("SELECT public.claim_payment_notifications('worker-fence-b-abcdef',1,30);")[0]
    assert first['claim_token']!=second['claim_token']
    check(rpc(mark(key, first['claim_token'], '2026-01-01T00:00:00Z'))['applied'], False)
    check(rpc(mark(key, first['claim_token'], error='stale worker'))['applied'], False)
    row=next(x for x in rpc('SELECT public.list_payment_notifications();') if x['dedupe_key']==key)
    check(row['sent_at'], None); check(row['last_error'], None); check(row['attempt_count'], 2)
    check(sql("SELECT claim_token='"+second['claim_token']+"' AND lease_until>now() FROM payments.notification_outbox WHERE dedupe_key='"+key+"';"),'t')
    check(rpc(mark(key, second['claim_token'], '2026-01-01T00:00:00Z'))['applied'], True)
    done=next(x for x in rpc('SELECT public.list_payment_notifications();') if x['dedupe_key']==key)
    check(done['attempt_count'], 2); assert done['sent_at'] is not None
    fail='fixture-fence-fail'
    rpc("SELECT public.enqueue_payment_notification('"+fail+"','test','fixture','{\"fixture\":true}');")
    a=rpc("SELECT public.claim_payment_notifications('worker-fail-a-abcdefgh',1,30);")[0]
    sql("UPDATE payments.notification_outbox SET lease_until=now()-interval '1 second' WHERE dedupe_key='"+fail+"';")
    b=rpc("SELECT public.claim_payment_notifications('worker-fail-b-abcdefgh',1,30);")[0]
    check(rpc(mark(fail, a['claim_token'], error='stale'))['applied'], False)
    check(rpc(mark(fail, b['claim_token'], error='current'))['applied'], True)
    failed=next(x for x in rpc('SELECT public.list_payment_notifications();') if x['dedupe_key']==fail)
    check(failed['attempt_count'], 2); check(failed['last_error'], 'current'); check(failed['sent_at'], None)
    cap='fixture-fence-capx'
    rpc("SELECT public.enqueue_payment_notification('"+cap+"','test','fixture','{\"fixture\":true}');")
    sql("UPDATE payments.notification_outbox SET sent_at=now() WHERE sent_at IS NULL AND dedupe_key<>'"+cap+"';")
    for i in range(8):
        got=rpc("SELECT public.claim_payment_notifications('worker-cap-"+str(i)+"-abcdef',1,30);")
        check(len(got),1)
        sql("UPDATE payments.notification_outbox SET lease_until=now()-interval '1 second' WHERE dedupe_key='"+cap+"';")
    check(len(rpc("SELECT public.claim_payment_notifications('worker-cap-final-abcde',1,30);")),0)
    check(sql("SELECT attempt_count::text FROM payments.notification_outbox WHERE dedupe_key='"+cap+"';"),'8')
    check(sql("SELECT abandoned_at IS NOT NULL FROM payments.notification_outbox WHERE dedupe_key='"+cap+"';"),'t')
    return {'fence':done['attempt_count'],'cap':8}
def incoming_identity():
    binding='aa'*32; other='bb'*32
    rpc(transition('evt_ident_known','cs_ident','pi_ident',customer='cus_a',payload=json.dumps({'browserBinding':binding})))
    before=read('cs_ident')
    for event, kwargs in (
        ('evt_ident_all', dict(session='cs_ident', intent='pi_other', customer='cus_b', payload=json.dumps({'browserBinding':other}))),
        ('evt_ident_intent', dict(session='cs_ident', intent='pi_other', customer='cus_a', payload=json.dumps({'browserBinding':binding}))),
        ('evt_ident_customer', dict(session='cs_ident', intent='pi_ident', customer='cus_b', payload=json.dumps({'browserBinding':binding}))),
        ('evt_ident_binding', dict(session='cs_ident', intent='pi_ident', customer='cus_a', payload=json.dumps({'browserBinding':other}))),
        ('evt_ident_session', dict(session='cs_other', intent='pi_ident', customer='cus_a', payload=json.dumps({'browserBinding':binding}))),
    ):
        sql(transition(event, **kwargs),'service_role','payment_identity_conflict')
        check(sql("SELECT count(*) FROM payments.stripe_events WHERE event_id="+lit(event)+";"),'0')
    after=read('cs_ident')
    check(after['payment_intent_id'], before['payment_intent_id']); check(after['customer_id'], 'cus_a'); check(after['browser_binding'], binding)
    rpc(transition('evt_fill_open','cs_fill',None,outcome='processing',recognized=False,customer=None))
    rpc(transition('evt_fill_link','cs_fill','pi_fill',customer='cus_fill',payload=json.dumps({'browserBinding':binding})))
    filled=read('cs_fill'); check(filled['payment_intent_id'],'pi_fill'); check(filled['customer_id'],'cus_fill'); check(filled['browser_binding'],binding)
    return {'kept':after['payment_intent_id'],'filled':filled['payment_intent_id']}
def notifications():
    key='fixture-notification'; q="SELECT public.enqueue_payment_notification('"+key+"','test','fixture','{\"fixture\":true}');"
    rpc(q); rpc(q); check(sql("SELECT count(*) FROM payments.notification_outbox WHERE dedupe_key='"+key+"';"),'1')
    sql("UPDATE payments.notification_outbox SET sent_at=now() WHERE sent_at IS NULL AND dedupe_key<>'"+key+"';")
    claimed=rpc("SELECT public.claim_payment_notifications('worker-life-abcdefghij',1,30);")
    check(rpc(mark(key, claimed[0]['claim_token'], error='fixture failure'))['applied'], True)
    row=next(x for x in rpc('SELECT public.list_payment_notifications();') if x['dedupe_key']==key)
    check((row['attempt_count'],row['last_error'],row['sent_at']),(1,'fixture failure',None))
    check(rpc(mark(key, claimed[0]['claim_token'], '2026-01-01T00:00:00Z'))['applied'], False)
    sql("UPDATE payments.notification_outbox SET next_attempt_at=now()-interval '1 second', lease_until=NULL WHERE dedupe_key='"+key+"';")
    again=rpc("SELECT public.claim_payment_notifications('worker-life-bcdefghijk',1,30);")
    check(rpc(mark(key, again[0]['claim_token'], '2026-01-01T00:00:00Z'))['applied'], True)
    row=next(x for x in rpc('SELECT public.list_payment_notifications();') if x['dedupe_key']==key)
    check((row['attempt_count'],row['last_error']),(2,None)); assert row['sent_at'] is not None
    return row
try:
    env=dict(os.environ,POSTGRES_PASSWORD=secrets.token_urlsafe(32))
    r=command(['docker','run','--detach','--name',NAME,'--network','none','--tmpfs','/var/lib/postgresql/data:rw','--env','POSTGRES_PASSWORD','postgres:17-alpine'],env=env)
    if r.returncode: raise RuntimeError(r.stderr)
    report['container_id']=r.stdout.strip()
    info=json.loads(command(['docker','inspect',NAME]).stdout)[0]
    report['isolation']={'network':info['HostConfig']['NetworkMode'],'port_bindings':info['HostConfig']['PortBindings'],'binds':info['HostConfig']['Binds'],'tmpfs':info['HostConfig']['Tmpfs'],'mounts':info['Mounts']}
    assert report['isolation']['network']=='none' and not report['isolation']['port_bindings'] and not report['isolation']['binds']
    assert not any(m['Type']=='volume' for m in info['Mounts'])
    for _ in range(120):
        if command(['docker','exec',NAME,'pg_isready','-h','127.0.0.1','-U','postgres']).returncode==0: break
        time.sleep(0.5)
    else: raise RuntimeError('Postgres readiness timeout')
    report['version']=sql('SELECT version();')
    sql('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;')
    migration=SOURCE.read_text(); report['migration']={'path':str(SOURCE),'sha256':hashlib.sha256(migration.encode()).hexdigest()}
    sql(migration); report['migration']['applied']=True
    for name,fn in [('paid_duplicate_readback',paid),('onboarding_upsert_readback',onboarding),('refund_out_of_order_and_no_downgrade',refunds),('permissions_rls_account_guard',permissions),('concurrent_same_and_distinct_events',concurrency_test),('different_identity_lock_concurrency',different_lock_concurrency),('partial_refund_order_equivalence',order_equivalence),('split_identity_reconciliation',split_identity),('notification_lifecycle',notifications),('notification_claim_concurrency',notification_claim),('notification_lease_fence',notification_fence),('incoming_identity_conflict',incoming_identity)]: test(name,fn)
    test('migration_idempotent',lambda:sql(migration))
except Exception as e:
    report['fatal_error']=str(e); report['traceback']=traceback.format_exc()
finally:
    r=command(['docker','rm','--force','--volumes',NAME]); report['cleanup']={'exit_code':r.returncode,'stdout':r.stdout.strip(),'stderr':r.stderr.strip()}
    r=command(['docker','inspect',NAME]); report['cleanup']['inspect_exit_code']=r.returncode; report['cleanup']['inspect_stderr']=r.stderr.strip()
    (ROOT/'stripe-db-results.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k not in ('operations','traceback')},indent=2))
    failures=[x for x in report['tests'] if x['status']=='FAIL']
    raise SystemExit(1 if failures or report.get('fatal_error') or report['cleanup']['exit_code'] else 0)
