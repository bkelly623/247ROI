"""OFFLINE real PostgreSQL acceptance in a unique disposable database; no paid calls.
Uses existing cluster roles, never resets any existing DB or historical receipt.
"""
import concurrent.futures
import json
from pathlib import Path
import subprocess
import uuid

ROOT = Path(__file__).resolve().parents[1]
DB = 'chatgpt_bridge_' + uuid.uuid4().hex
BASE = ['docker', 'exec', '-i', 'audit-1776-test-db', 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres']
def sql(text, db=DB, fail=False):
    p = subprocess.run(BASE + ['-d', db], input=text, text=True, capture_output=True)
    if fail:
        assert p.returncode != 0, 'Expected refusal'
        return ''
    assert p.returncode == 0, p.stderr
    return p.stdout.strip()
def quote(s):
    return "'" + str(s).replace("'", "''") + "'"
def session():
    s = str(uuid.uuid4())
    sql(f"insert into scan_sessions(id,business_name,website_url,zip_code) values('{s}','OFFLINE fixture','https://example.invalid','00000')")
    return s
def reserve(s, query='offline', cost=4000, role='service_role'):
    body = json.dumps([{'keyword': query.replace('%', '%25').replace('+', '%2B'), 'language_code': 'en', 'force_web_search': True, 'location_name': 'United States'}])
    return sql(f"set role {role}; select audit_reserve_public_chatgpt('{s}',{quote(query)},{quote(body)},{cost})")

sql(f'create database {DB}', db='postgres')
try:
    for prefix in ['001_', '004_', '005_', '006_', '008_', '010_', '012_']:
        files = list((ROOT / 'supabase/migrations').glob(prefix + '*.sql'))
        assert len(files) == 1
        sql(files[0].read_text())
    s = session()
    assert reserve(s, cost=3999) == 'f'
    assert reserve(str(uuid.uuid4())) == 'f'
    sql(f"set role anon; select audit_reserve_public_chatgpt('{s}','x','[{{\"keyword\":\"x\"}}]',4000)", fail=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        outcomes = list(pool.map(lambda n: reserve(s, query=f'offline-{n}'), range(8)))
    assert outcomes.count('t') == 1, outcomes
    assert reserve(s, query='changed query') == 'f'
    assert sql("select count(*) from audit_jobs_v2 where status='running'") == '0'
    assert sql("select public_chatgpt_outcome->>'status' from audit_jobs_v2") == 'uncertain'
    receipt = '{"status":"error","reason":"offline synthetic uncertain send"}'
    for _ in range(2):
        assert sql(f"set role service_role; select audit_record_public_chatgpt('{s}',{quote(receipt)})") == 't'
    assert sql(f"set role service_role; select audit_record_public_chatgpt('{s}','{{\"status\":\"observed\"}}')") == 'f'
    assert reserve(s) == 'f'
    sessions = [session() for _ in range(27)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        outcomes = list(pool.map(reserve, sessions))
    assert outcomes.count('t') == 21, outcomes
    assert sql("select authorized_micros from audit_collection_budgets_v2 where id='public-chatgpt-remaining-088000'") == '88000'
    assert sql('select count(*)||\':\'||sum(upper_cost_micros) from audit_provider_reservations_v2') == '22:88000'
    assert sql('select count(*) from audit_jobs_v2') == '22'
    assert sql('select count(*) from audit_live_authorizations_v2') == '0'
    assert reserve(session()) == 'f'
    print('PASS: exact quote; missing session; anonymous denial; 8-way same-session/different-query race; immutable outcome; retained uncertain reservations; 28-session global race capped at 22 requests/88000 micros; no running jobs; historical authorization untouched.')
finally:
    sql(f'drop database {DB}', db='postgres')
    print('Unique disposable database removed; existing databases untouched.')
