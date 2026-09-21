// Explicit operator-run live acceptance: existing SerpAPI only, no retries/top-ups.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { probeGoogleSearch } from "../src/lib/audit/probes/google-search";
async function main() {
  const text = readFileSync("/home/precision_focused_solutions/.config/hermes/247-ops-dashboard.env", "utf8");
  const token = text.split("\n").find(l => l.startsWith("VERCEL_TOKEN="))?.slice(13).trim().replace(/^['"]|['"]$/g, "");
  const headers = { Authorization: `Bearer ${token}` };
  const res = await fetch("https://api.vercel.com/v1/projects/prj_jE413jvq73UCZ8XQhLS38pgvoUTN/env/cbZik3BpjZWhaoaI?teamId=team_NB981ddsKAGTAJtm4O1A14X1", { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) { console.log(`BLOCKED Vercel env decrypt HTTP ${res.status}`); return; }
  const env = await res.json();
  if (!env.value || env.value.includes("encrypted")) { console.log("BLOCKED: no decrypted SerpAPI value"); return; }
  process.env.SERPAPI_KEY = env.value;
  const account = await fetch(`https://serpapi.com/account.json?api_key=${encodeURIComponent(env.value)}`, { signal: AbortSignal.timeout(15000) });
  const a = await account.json();
  console.log(JSON.stringify({ accountHttp: account.status, searchesLeft: a.total_searches_left, plan: a.plan_name }));
  if (!account.ok || a.total_searches_left === 0) { console.log("BLOCKED: SerpAPI authorization/quota"); return; }
  const result = await probeGoogleSearch({ businessName: "247ROI", zipCode: "19008", servicePhrase: "AI automation consulting", websiteUrl: "https://www.get247roi.com" });
  const dir = "/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/google-evidence-fix";
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/live-result.json`, JSON.stringify(result, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ blocks: result.blocks.map(b => ({ type: b.type, query: b.query, count: b.results.length, location: b.location })), overview: result.aiOverviews?.map(a => ({ state: a.state, answerChars: a.answer?.length, citations: a.citations.length })), captures: result.captures?.map(({ raw, ...c }) => c), error: result.rawError }, null, 2));
}
main().catch(() => { console.error("Live runner failed (details withheld to avoid credential leakage)"); process.exitCode = 1; });
