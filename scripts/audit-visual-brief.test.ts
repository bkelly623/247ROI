import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildVisualBrief,rankLabel,safePagePath} from '../src/lib/audit/visual-brief';
const session=JSON.parse(readFileSync('/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/audit-sales-stage3/stage3-final-session.json','utf8')).session;
const report=session.report;
const before=JSON.stringify(report);
const brief=buildVisualBrief(report);
assert.equal(brief.seoStanding,'0 / 8 searches');
assert.equal(brief.aiStanding,'0 / 6 answers');
assert.equal(brief.opportunities.length,3);
assert(brief.broader && !brief.opportunities.some(o => o.query === brief.broader!.query));
assert.equal(JSON.stringify(report),before);
assert.equal(safePagePath('bad legacy url'),'');
const check={...report.directRank.checks[0],outcome:'ranked',position:4,hits:[]};
assert.equal(rankLabel(check),'#4');
assert.equal(buildVisualBrief({...report,directRank:{...report.directRank,checks:[check]}}).seoStanding,'1 / 1 searches');
for(const outcome of ['unknown_corrected','unknown_failed','not_authorized']){
 assert.equal(rankLabel({...check,outcome}),'Not measured');
 assert.equal(buildVisualBrief({...report,directRank:{...report.directRank,checks:[{...check,outcome}]}}).seoStanding,'Not measured');
}
assert.equal(rankLabel({...check,position:-1}),'Not measured');
assert.equal(buildVisualBrief({...report,directRank:undefined,aiSampling:undefined}).seoStanding,'Not measured');
assert.equal(buildVisualBrief({...report,directRank:undefined,aiSampling:undefined}).aiStanding,'Not measured');
console.log('PASS visual brief: retained standings, three supported targets, separate expansion, ranked-without-hits, unusable scopes, malformed URL, unknowns and immutable report');
