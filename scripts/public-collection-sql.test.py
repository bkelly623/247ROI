"""Real PostgreSQL tests, unique disposable DB, no provider calls."""
import concurrent.futures,json,hashlib,subprocess,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DB='public_collection_'+uuid.uuid4().hex
BASE=['docker','exec','-i','audit-1776-test-db','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres']
def sql(s,db=DB,fail=False):
 p=subprocess.run(BASE+['-d',db],input=s,text=True,capture_output=True)
 if fail: assert p.returncode!=0;return ''
 assert p.returncode==0,p.stderr
 return p.stdout.strip()
def q(s):return "'"+str(s).replace("'","''")+"'"
def session():
 s=str(uuid.uuid4());sql(f"insert into scan_sessions(id,business_name,website_url,zip_code) values('{s}','OFFLINE test','https://example.invalid','00000')");return s
costs={'chatgpt':4000,'ranked_keywords':14400,'competitors_domain':12360}
def reserve(s,kind='chatgpt',query='offline',cost=None,limit=None):
 body=[{'keyword':query,'language_code':'en','force_web_search':True,'location_name':'United States'}] if kind=='chatgpt' else [{'target':'example.invalid','include_clickstream_data':False,'language_code':'en','location_code':2840,'limit':limit or (20 if kind=='ranked_keywords' else 3)}]
 key=hashlib.sha256((query if kind=='chatgpt' else kind).encode()).hexdigest()
 return sql(f"set role service_role; select audit_reserve_public_collection('{s}',{q(kind)},{q(key)},{q(query)},{q(json.dumps(body))},{cost if cost is not None else costs[kind]})")
sql('create database '+DB,db='postgres')
try:
 for prefix in ['001_','004_','005_','006_','008_','010_','012_','013_','014_']:
  files=list((ROOT/'supabase/migrations').glob(prefix+'*.sql'));assert len(files)==1;sql(files[0].read_text())
 s=session()
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  claims=list(pool.map(lambda _:sql(f"set role service_role; select audit_claim_public_scan('{s}')"),range(6)))
 assert claims.count('t')==1,claims
 assert reserve(s,cost=4001)=='f';assert reserve(s,'ranked_keywords',limit=21)=='f'
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
  results=list(pool.map(lambda _:reserve(s),range(8)))
 assert results.count('t')==1
 assert reserve(s,query='second')=='t';assert reserve(s,query='third')=='t';assert reserve(s,query='fourth')=='f'
 assert reserve(s,'ranked_keywords')=='t';assert reserve(s,'ranked_keywords',query='different')=='f'
 assert reserve(s,'competitors_domain')=='t'
 sql(f"set role anon; select audit_claim_public_scan('{s}')",fail=True)
 sql(f"set role anon; select audit_reserve_public_collection('{s}','chatgpt','{'a'*64}','x','[]',4000)",fail=True)
 sessions=[session() for _ in range(20)]
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(lambda x:reserve(x,'ranked_keywords'),sessions))
 totals=json.loads(sql("select json_build_object('reserved',(select sum(upper_cost_micros) from audit_provider_reservations_v2),'authorized',(select authorized_micros from audit_collection_budgets_v2),'ceiling',(select ceiling_micros from audit_collection_budgets_v2),'running',(select count(*) from audit_jobs_v2 where status='running'))"))
 assert totals['reserved']==totals['authorized']<=totals['ceiling']==88000;assert totals['running']==0
 print('PASS: atomic scan claim, anonymous denial, immutable per-sample sends, 3-prompt ceiling, single Labs captures, shared cumulative budget races.',totals)
finally:sql('drop database '+DB,db='postgres')
