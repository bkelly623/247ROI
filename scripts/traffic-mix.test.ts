import assert from 'node:assert/strict';
import {trafficMix,pieSlice,TRAFFIC_BENCHMARK} from '../src/lib/audit/traffic-mix';
const m=trafficMix();assert(Math.abs(m.rows.reduce((n,r)=>n+r.percent,0)-100)<1e-8);
assert.deepEqual(m.rows.map(r=>r.percent.toFixed(1)),['87.7','10.8','1.5']);
assert.equal(m.leadingProng,'seo');assert.equal(TRAFFIC_BENCHMARK.sources.length,11);
assert(pieSlice(-90,m.rows[0].percent).includes('A120,120'));assert(!pieSlice(0,1.5).includes('NaN'));
console.log(JSON.stringify({passed:true,rows:m.rows,scope:TRAFFIC_BENCHMARK.region,period:TRAFFIC_BENCHMARK.period}));
