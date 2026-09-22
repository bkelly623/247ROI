import type { AuditContext } from "./audit-context";

export interface KeywordCandidate {
  query: string;
  intent: "service_provider" | "workflow_problem" | "industry_use_case" | "local_service";
  validatedRecommendation: false;
  source: "priority_service" | "buyer_type" | "service_context" | "confirmed_need";
}
export interface KeywordOpportunityPlan {
  version: 1;
  candidates: KeywordCandidate[];
  selected: KeywordCandidate[];
  reducedScope: boolean;
  rationale: string;
}
const normalize = (s:string) => s.toLowerCase().replace(/\s+/g," ").trim();
const cluster = (s:string) => normalize(s).replace(/\b(best|top|provider|company|companies|services?)\b/g, "").replace(/\s+/g," ").trim();

/** Candidate queries are measurement targets, never validated opportunities or demand claims. */
export function planKeywordOpportunities(input: {
  businessName: string;
  servicePhrase: string;
  auditContext?: AuditContext | null;
  confirmedNeeds?: readonly string[];
  geography?: "local" | "regional" | "national" | "mixed" | "legacy_local";
  zipCode?: string | null;
  serviceArea?: string | null;
}): KeywordOpportunityPlan {
  const candidates: KeywordCandidate[] = [];
  const brand = normalize(input.businessName);
  const geo = input.geography ?? input.auditContext?.geography ?? "legacy_local";
  const area = input.serviceArea?.trim() || input.auditContext?.serviceArea?.trim() || ((geo === "local" || geo === "legacy_local") ? input.zipCode?.trim() : "");
  const priority = input.auditContext?.priorityService?.trim();
  const service = input.servicePhrase.trim();
  const buyer = input.auditContext?.buyerType?.trim();
  const add = (value:string, intent:KeywordCandidate["intent"], source:KeywordCandidate["source"]) => {
    const query = value.replace(/\s+/g," ").trim();
    if (!query || query.length > 200 || (brand && normalize(query).includes(brand))) return;
    if (/[<>\n\r]|https?:\/\//i.test(value) || /\b(ignore .*instructions|system prompt|jobs?|salary|news|what is|how to)\b/i.test(query)) return;
    if (/^(business )?services?$/i.test(query)) return;
    if (geo === "national" && /\b(?:ZIP|\d{5}(?:-\d{4})?)\b/i.test(query)) return;
    if (candidates.some(c => cluster(c.query) === cluster(query))) return;
    candidates.push({query,intent,source,validatedRecommendation:false});
  };
  const scoped = (q:string) => area && geo !== "national" ? `${q} ${area}` : q;
  const serviceIntent = geo === "national" ? "service_provider" : "local_service";
  if (priority) add(scoped(priority), serviceIntent, "priority_service");
  if (service) add(scoped(service), serviceIntent, "service_context");
  if (buyer && (priority || service)) add(scoped(`${priority || service} for ${buyer}`), "industry_use_case", "buyer_type");
  for (const need of input.confirmedNeeds ?? []) add(scoped(need), "workflow_problem", "confirmed_need");
  const selected = candidates.slice(0,8);
  return {
    version:1,candidates,selected,reducedScope:selected.length < 8,
    rationale:`Selected ${selected.length} distinct candidate buyer searches from explicit services, buyer context and confirmed needs. Excluded brand diagnostics, informational/noisy terms and synonym padding. A candidate is not a validated recommendation; demand and realistic competitiveness remain unmeasured until researched.`,
  };
}
