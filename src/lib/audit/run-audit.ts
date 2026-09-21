import { runAuditPipeline } from "./audit-engine";
import { enrichReportWithLlm } from "./llm-enrich";
import type { AuditReport } from "./types";
import { probeGoogleAIMode } from "./probes/google-ai-mode";
import { probeChatGPT, type ChatGPTEvidence } from "./probes/chatgpt-search";
import type { GoogleAIModeEvidence } from "./probes/google-ai-mode";
import { reservePublicCollection, recordPublicCollection, type CollectionReservation } from "./probes/collection-budget";
import { getProviderPricing } from "./probes/provider-pricing";
import { probeDomainResearch } from "./probes/domain-research";
import { probeSiteReview } from "./probes/site-review";
import { collectAISamples } from "./probes/ai-sampling";
import { inferServiceContext } from "./service-context";
import { probeSiteCrawl } from "./probes/site-crawl";
import { researchDeficits } from "./research-deficits";

export async function executeFullAudit(input: {
  sessionId:string;businessName:string;websiteUrl:string;zipCode:string;mode:"organic"|"rep";
  callbackUrl:string;previousReport?:AuditReport|null;
  lead?:{firstName:string;lastName:string;phone:string;email:string};
}):Promise<AuditReport> {
  const url=input.websiteUrl.startsWith("http")?input.websiteUrl:`https://${input.websiteUrl}`;
  const target=new URL(url).hostname.toLowerCase().replace(/^www\./,"");
  const [site,pricing]=await Promise.all([probeSiteCrawl(url),getProviderPricing()]);
  const serviceContext=inferServiceContext(input.businessName,site);
  const sampleInput={...input,websiteUrl:url,servicePhrase:serviceContext.servicePhrase};
  const labsReservations:CollectionReservation[]=[];
  const domainPromise=(async()=>{
    if(input.previousReport?.domainResearch) return input.previousReport.domainResearch;
    const evidence=await probeDomainResearch({target},{quote:pricing??undefined,authorize:async r=>{
      const reservation={sessionId:input.sessionId,kind:r.kind,query:target,requestBody:r.requestBody,upperCostMicros:r.upperCostMicros};
      const allowed=await reservePublicCollection(reservation);if(allowed)labsReservations.push(reservation);return allowed;
    }});
    for(const r of labsReservations){const lane=r.kind==="ranked_keywords"?evidence.rankedKeywords:evidence.relatedCompetitors;await recordPublicCollection(r,{status:lane.state==="observed"?"observed":lane.state==="no_data"?"unmeasured":"error",...lane});}
    return evidence;
  })();
  const aiPromise=serviceContext.source==="unconfirmed"?Promise.resolve(undefined):collectAISamples(sampleInput,{
    existingReport:input.previousReport?.aiSampling,
    perSampleTimeoutMs:95000,totalTimeoutMs:150000,
    collectors:{googleAIMode:probeGoogleAIMode,chatgpt:async (sample,options)=>{
      let reservation:CollectionReservation|undefined;
      const evidence=await probeChatGPT(sample,{...options,authorize:async r=>{
        const allowed=await options.authorize?.(r);if(allowed)reservation={...r,sessionId:input.sessionId,kind:"chatgpt"};return allowed===true;
      }});
      if(reservation)await recordPublicCollection(reservation,{status:evidence.state==="observed"?"observed":"error",...evidence});
      return evidence;
    }},
    budgetChatGPTQuote:async()=>pricing?{quote:pricing.chatGPT,authorize:r=>reservePublicCollection({...r,sessionId:input.sessionId,kind:"chatgpt"})}:null,
  });
  const [baseReport,domainResearch,siteReview,aiSampling]=await Promise.all([
    runAuditPipeline({businessName:input.businessName,websiteUrl:url,zipCode:input.zipCode,site,servicePhrase:serviceContext.servicePhrase}),
    domainPromise,probeSiteReview({websiteUrl:url,homepage:site}),aiPromise,
  ]);
  const chatGPT=aiSampling?.samples.find(s=>s.engine==="chatgpt")?.evidence as ChatGPTEvidence|undefined;
  const googleAIMode=aiSampling?.samples.find(s=>s.engine==="google_ai_mode")?.evidence as GoogleAIModeEvidence|undefined;
  const missing=["Email report delivery"];
  if(domainResearch.rankedKeywords.state!=="observed")missing.push(domainResearch.rankedKeywords.state==="no_data"?"Keyword database coverage unavailable":"Existing keyword research");
  if(domainResearch.relatedCompetitors.state!=="observed")missing.push("Search-competitor database coverage");
  if(!aiSampling||aiSampling.summary.available<aiSampling.summary.total)missing.push("Some AI answer samples");
  if(!siteReview.coverage.inspected)missing.push("Multi-page website inspection");
  else if(siteReview.status==="partial")missing.push("Some sampled website pages");
  if(baseReport.googleLocal?.rawError)missing.push("Some live Google search captures");
  const overviews=baseReport.googleLocal?.aiOverviews??[];
  if(!overviews.length||overviews.some(s=>s.state==="unavailable"))missing.push("Google AI Overview collection");
  if(serviceContext.source==="unconfirmed")missing.push("Confirmed service context");
  const deficits=researchDeficits(input.businessName,baseReport,domainResearch,siteReview,aiSampling);
  const summary=aiSampling?`ChatGPT: ${aiSampling.byEngine.chatgpt.available}/${aiSampling.byEngine.chatgpt.total} usable answers, ${aiSampling.byEngine.chatgpt.mentions.count} measured brand mentions. Google AI Mode: ${aiSampling.byEngine.google_ai_mode.available}/${aiSampling.byEngine.google_ai_mode.total} usable answers, ${aiSampling.byEngine.google_ai_mode.mentions.count} measured brand mentions. Counts apply only to these buyer questions.`:"AI sampling requires a confirmed service category; not proof of brand absence.";
  return enrichReportWithLlm({businessName:input.businessName,websiteUrl:url,zipCode:input.zipCode,baseReport:{
    ...baseReport,serviceContext,domainResearch,siteReview,aiSampling,chatGPT,googleAIMode,deficits,
    opportunityHeadline:`${input.businessName}: ${domainResearch.rankedKeywords.keywords.length} keyword records, ${siteReview.coverage.inspected} inspected pages and ${aiSampling?.summary.available??0} captured AI answers. Scope and unavailable checks are shown below.`,
    coverage:{status:missing.length?"partial":"complete",missing},
    sections:baseReport.sections.map(s=>s.key==="ai"?{...s,measured:Boolean(aiSampling?.summary.available),plainQuestion:"Did AI answers mention or cite your business?",summary,dataSource:"Consumer ChatGPT via DataForSEO; Google AI Mode via SerpAPI; three shared buyer questions",topFix:"Compare retained answers and cited sources, improve demonstrated content/entity gaps, then repeat comparable measurements."}:s),
    packages:{...baseReport.packages,primary:{...baseReport.packages.primary,priceFrame:"custom",description:deficits[0]?`Start with: ${deficits[0].finding} ${deficits[0].fix} 247ROI can scope the specific work; this audit does not require a rebuild.`: "Review your ranking pages, sampled AI sources and collection coverage before selecting an improvement project."}},
    progressEvents:[...baseReport.progressEvents,`Public domain research: ${domainResearch.rankedKeywords.state}; competitors: ${domainResearch.relatedCompetitors.state}.`,`Multi-page review: ${siteReview.coverage.inspected} inspected pages.`,`AI sampling: ${aiSampling?.summary.available??0} usable answers. Report saved with explicit coverage.`],
  }});
}
