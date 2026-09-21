import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createGunzip, createInflate, createBrotliDecompress } from "node:zlib";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { SiteCrawlResult } from "./site-crawl";

const LIMIT = 8;
const MAX_BYTES = 512 * 1024;
const USER_AGENT = "247ROI-AuditBot/3.0";
export interface SiteReviewPage {
  url: string; finalUrl?: string; httpStatus?: number;
  status: "observed" | "unavailable"; error?: string;
  title: string | null; metaDescription: string | null;
  headings: { level: number; text: string }[]; canonical: string | null;
  noindex: boolean | null; internalLinks: string[];
}
export interface SiteReviewFinding {
  category: "seo" | "technical" | "suggestion";
  severity: "warning" | "info";
  finding: string; evidenceUrl: string; evidenceUrls?: string[]; fix: string;
}
export interface SiteReviewResult {
  status: "observed" | "partial" | "unavailable";
  websiteUrl: string; observedAt: string;
  pages: SiteReviewPage[];
  discoveries: { url: string; sourceUrl: string; text: string }[];
  duplicateTitles: { value: string; urls: string[] }[];
  duplicateDescriptions: { value: string; urls: string[] }[];
  brokenLinks: { url: string; sourceUrls: string[]; httpStatus: number }[];
  findings: SiteReviewFinding[];
  coverage: { inspected: number; attempted: number; limit: number; discovered: number };
  samplingLimits: string[]; errors: { url: string; reason: string }[];
}
interface ResponseData { status: number; text: string; headers: Record<string, string | string[] | undefined> }
/** Dependency seam for OFFLINE tests only; production callers should omit this argument. */
export interface SiteReviewDependencies {
  resolve?: (host: string) => Promise<{ address: string; family: number }[]>;
  request?: (url: URL, address: { address: string; family: number }, signal: AbortSignal) => Promise<ResponseData>;
  timeoutMs?: number;
}

/** Conservative globally routable IP policy, including mapped IPv6 rejection. */
export function isPublicSiteAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 2))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  // Only global unicast, excluding documentation, transition/tunnel ranges.
  if (isIP(address) !== 6 || !/^[23]/i.test(address)) return false;
  const [first, second] = address.split(":").map(part => parseInt(part || "0", 16));
  return !(first === 0x2001 && (second < 0x200 || second === 0xdb8)) && first !== 0x2002 && first !== 0x3fff;
}
function safeUrl(raw: string, base?: string): URL {
  const u = new URL(raw, base);
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!/^https?:$/.test(u.protocol) || u.username || u.password ||
    (u.port && u.port !== "80" && u.port !== "443") || !host.includes(".") && !isIP(host) ||
    /(?:^|\.)(localhost|local|internal|test|invalid|onion)$/.test(host) ||
    (isIP(host) && !isPublicSiteAddress(host))) throw new Error("unsafe_target");
  u.hash = "";
  return u;
}
function bounded<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error("deadline"));
    if (signal.aborted) return abort();
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}
function nativeRequest(url: URL, address: { address: string; family: number }, signal: AbortSignal): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    // Pin the validated DNS answer to the socket, preserving Host and TLS SNI.
    const req = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
      method: "GET", signal, agent: false, family: address.family,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,text/plain;q=0.9", "Accept-Encoding": "identity" },
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
    }, res => {
      const chunks: Buffer[] = []; let bytes = 0, wireBytes = 0;
      const encoding = res.headers["content-encoding"]?.toLowerCase();
      const decoder = encoding === "gzip" ? createGunzip() : encoding === "br" ? createBrotliDecompress() : encoding === "deflate" ? createInflate() : null;
      if (encoding && encoding !== "identity" && !decoder) {
        res.destroy(); reject(new Error("unsupported_encoding")); return;
      }
      const body = decoder ? res.pipe(decoder) : res;
      const fail = (error: Error) => { body.destroy(); res.destroy(); req.destroy(); reject(error); };
      res.on("data", (chunk: Buffer) => {
        wireBytes += chunk.length;
        if (wireBytes > MAX_BYTES) fail(new Error("body_limit"));
      });
      body.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_BYTES) fail(new Error("body_limit"));
        else chunks.push(chunk);
      });
      body.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, text: Buffer.concat(chunks).toString("utf8") }));
      body.on("error", fail);
      res.on("error", fail);
    });
    req.setTimeout(6000, () => req.destroy(new Error("request_timeout")));
    req.on("error", reject); req.end();
  });
}
function header(r: ResponseData, name: string): string {
  const v = r.headers[name]; return Array.isArray(v) ? v.join(", ") : v ?? "";
}
function decode(s: string): string {
  return s.replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi, m => {
    const named: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " };
    if (named[m.toLowerCase()]) return named[m.toLowerCase()];
    const n = m[2].toLowerCase() === "x" ? parseInt(m.slice(3), 16) : parseInt(m.slice(2), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
  });
}
function text(s: string): string { return decode(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim().slice(0, 1000); }
function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4]);
  return out;
}
/** RFC-style agent groups, longest path match and Allow tie precedence. */
export function siteReviewRobotsAllows(robots: string, url: URL): boolean {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let group: typeof groups[number] | undefined;
  let rulesStarted = false;
  for (const line of robots.split(/\r?\n/)) {
    const m = line.replace(/#.*/, "").match(/^\s*([\w-]+)\s*:\s*(.*?)\s*$/); if (!m) continue;
    const key = m[1].toLowerCase(), value = m[2];
    if (key === "user-agent") {
      if (!group || rulesStarted) { group = { agents: [], rules: [] }; groups.push(group); rulesStarted = false; }
      group.agents.push(value.toLowerCase());
    } else if (group && (key === "allow" || key === "disallow")) {
      rulesStarted = true;
      if (value) group.rules.push({ allow: key === "allow", path: value });
    }
  }
  const specific = groups.filter(g => g.agents.some(a => a !== "*" && USER_AGENT.toLowerCase().startsWith(a)));
  const selected = specific.length ? specific : groups.filter(g => g.agents.includes("*"));
  let best = -1, allow = true;
  for (const rule of selected.flatMap(g => g.rules)) {
    const end = rule.path.endsWith("$");
    const path = end ? rule.path.slice(0, -1) : rule.path;
    const normalize = (s: string) => s.replace(/%([0-9a-f]{2})/gi, (m, hex) => {
      const ch = String.fromCharCode(parseInt(hex, 16));
      return /[a-z0-9\-._~]/i.test(ch) ? ch : m.toUpperCase();
    });
    const pattern = normalize(path), target = normalize(url.pathname + url.search);
    // Greedy glob matching avoids regex backtracking from untrusted robots files.
    let i = 0, j = 0, star = -1, mark = 0;
    while (i < target.length) {
      if (j === pattern.length && !end) break;
      if (pattern[j] === "*") { star = j++; mark = i; }
      else if (pattern[j] === target[i]) { i++; j++; }
      else if (star >= 0) { j = star + 1; i = ++mark; }
      else break;
    }
    while (pattern[j] === "*") j++;
    if (j === pattern.length && (!end || i === target.length)) {
      const length = path.replace(/\*/g, "").length;
      if (length > best || length === best && rule.allow) { best = length; allow = rule.allow; }
    }
  }
  return allow;
}
function emptyPage(url: string): SiteReviewPage {
  return { url, status: "unavailable", title: null, metaDescription: null, headings: [], canonical: null, noindex: null, internalLinks: [] };
}

export async function probeSiteReview(
  { websiteUrl, homepage }: { websiteUrl: string; homepage?: SiteCrawlResult },
  deps: SiteReviewDependencies = {},
): Promise<SiteReviewResult> {
  const result: SiteReviewResult = {
    websiteUrl, observedAt: new Date().toISOString(), status: "unavailable", pages: [], discoveries: [],
    duplicateTitles: [], duplicateDescriptions: [], brokenLinks: [], findings: [],
    coverage: { inspected: 0, attempted: 0, limit: LIMIT, discovered: 0 }, errors: [],
    samplingLimits: ["At most 8 same-origin pages, prioritized by service/product/solution/about/contact links; maximum 3 concurrent requests and 30 seconds overall.",
      "Public GET-only HTML sample, not a rendered browser, exhaustive crawl, indexation, ranking or AI-citation measurement.",
      "512 KiB per response; up to 3 redirects per resource, same-origin or exact apex/www canonical pair only; no retries of denied URLs. Discovery capped at 500 URLs and 200 links per page.",
      "Missing elements refer only to fetched HTML. Intentional noindex or shared metadata may be appropriate; verify page purpose before changes."],
  };
  if (homepage?.httpStatus && [401, 403, 429].includes(homepage.httpStatus)) {
    result.errors.push({url: websiteUrl, reason: `Homepage previously denied access (HTTP ${homepage.httpStatus}); no alternate crawler attempted.`});
    return result;
  }
  // Legacy homepage bytes lack a validated DNS/redirect/robots provenance. Never trust them as safe transport evidence.
  if (homepage) result.samplingLimits.push("Supplied legacy homepage capture was not reused; homepage was independently safety-checked.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(30_000, Math.max(1, deps.timeoutMs ?? 30_000)));
  const signal = controller.signal;
  const error = (url: string, reason: string) => { if (result.errors.length < 24) result.errors.push({ url, reason }); };
  const resolve = deps.resolve ?? (host => lookup(host, { all: true, verbatim: true }));
  const request = deps.request ?? nativeRequest;
  const policies = new Map<string, string>();
  const visited = new Set<string>();
  try {
    const start = safeUrl(/^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`);
    const inScope = (u: URL) => u.origin === start.origin || (u.protocol === start.protocol && u.port === start.port && !isIP(u.hostname) && u.hostname.replace(/^www\./, "") === start.hostname.replace(/^www\./, ""));
    const fetchSafe = async (target: URL, isRobots = false): Promise<ResponseData & { url: string }> => {
      let u = target;
      for (let hop = 0; hop <= 3; hop++) {
        safeUrl(u.href);
        const addresses = await bounded(resolve(u.hostname.replace(/^\[|\]$/g, "")), signal);
        if (!addresses.length || addresses.some(a => !isPublicSiteAddress(a.address))) throw new Error("unsafe_dns");
        if (!inScope(u)) throw new Error("cross_origin_redirect_not_followed");
        if (!isRobots) {
          if (!policies.has(u.origin)) {
            const policy = await fetchSafe(new URL("/robots.txt", u), true);
            let robots = "";
            if (policy.status === 404 || policy.status === 410) robots = "";
            else if (policy.status >= 200 && policy.status < 300 && !/<(?:html|script)\b/i.test(policy.text)) robots = policy.text;
            else throw new Error("robots_unavailable_or_denied");
            policies.set(u.origin, robots);
          }
          if (!siteReviewRobotsAllows(policies.get(u.origin)!, u)) throw new Error("robots_excluded");
        }
        if (!isRobots && visited.has(u.href)) throw new Error("already_attempted");
        if (!isRobots) visited.add(u.href);
        const r = await bounded(request(u, addresses[0], signal), signal);
        if (Buffer.byteLength(r.text) > MAX_BYTES) throw new Error("body_limit");
        if ([301, 302, 303, 307, 308].includes(r.status)) {
          if (!header(r, "location")) throw new Error("redirect_without_location");
          u = safeUrl(header(r, "location"), u.href); continue;
        }
        return { ...r, url: u.href };
      }
      throw new Error("redirect_limit");
    };
    // Each content origin gets its own robots check, including canonical redirects.
    const discovered = new Map<string, { url: string; sourceUrl: string; text: string }>();
    const attempted = new Set<string>();
    const inspect = async (url: string): Promise<SiteReviewPage> => {
      const page = emptyPage(url);
      try {
        const r = await fetchSafe(new URL(url)); page.httpStatus = r.status; page.finalUrl = r.url;
        if (r.status < 200 || r.status >= 300) throw new Error([401, 403, 429].includes(r.status) ? "access_denied_not_site_defect" : "http_response_not_inspected");
        if (!/text\/html|application\/xhtml\+xml/i.test(header(r, "content-type"))) throw new Error("non_html_not_inspected");
        if (/cf-chl-|cf-browser-verification|<title[^>]*>\s*(?:just a moment|access denied|attention required)|verify you are human/i.test(r.text)) throw new Error("challenge_not_inspected");
        const html = r.text.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "");
        page.status = "observed";
        page.title = text(html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? "") || null;
        page.noindex = /\b(?:noindex|none)\b/i.test(header(r, "x-robots-tag"));
        for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
          const a = attrs(m[0]);
          if (a.name?.toLowerCase() === "description") page.metaDescription = text(a.content ?? "") || null;
          if (/^(robots|googlebot|bingbot)$/i.test(a.name ?? "") && /\b(noindex|none)\b/i.test(a.content ?? "")) page.noindex = true;
        }
        for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
          const a = attrs(m[0]); if (a.rel?.toLowerCase().split(/\s+/).includes("canonical") && a.href) {
            try { page.canonical = new URL(a.href, r.url).href; } catch { /* invalid is unmeasured */ }
          }
        }
        for (const m of html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi)) {
          if (page.headings.length < 50) page.headings.push({ level: Number(m[1]), text: text(m[2]) });
        }
        // Honor document base when resolving links, but never leave the original origin.
        let base = r.url;
        const baseTag = html.match(/<base\b[^>]*>/i)?.[0];
        if (baseTag) { try { base = new URL(attrs(baseTag).href ?? "", r.url).href; } catch { /* keep response URL */ } }
        for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
          if (page.internalLinks.length >= 200) break;
          const a = attrs(m[1]); if (!a.href || a.href.startsWith("#")) continue;
          try {
            const link = safeUrl(a.href, base);
            if (!inScope(link)) continue;
            if (!page.internalLinks.includes(link.href)) page.internalLinks.push(link.href);
            if (!discovered.has(link.href) && discovered.size < 500) discovered.set(link.href, { url: link.href, sourceUrl: url, text: text(m[2]) });
          } catch { /* unsafe/non-web links are never fetched */ }
        }
      } catch (e) {
        const reason = e instanceof Error && /^(unsafe_|robots_|access_|http_|non_html|challenge_|already_|cross_origin_|redirect_|body_limit|deadline|request_timeout|unsupported_encoding)/.test(e.message) ? e.message : "network_or_dns_error";
        page.error = reason; error(url, reason);
      }
      return page;
    };
    attempted.add(start.href); result.pages.push(await inspect(start.href));
    // A homepage denial ends this sample, rather than trying alternate routes.
    if (result.pages[0].status === "observed") {
      const score = (d: { url: string; text: string }) => /service|product|solution|offering/i.test(d.url + " " + d.text) ? 3 : /about|company|team|contact/i.test(d.url + " " + d.text) ? 2 : 0;
      while (attempted.size < LIMIT && !signal.aborted) {
        const candidates = [...discovered.values()].filter(d => !attempted.has(d.url) && score(d) > 0 && !new URL(d.url).search && !/\.(?:pdf|png|jpg|zip|svg|webp|mp4)$/i.test(new URL(d.url).pathname)).sort((a, b) => score(b) - score(a)).slice(0, Math.min(3, LIMIT - attempted.size));
        if (!candidates.length) break;
        candidates.forEach(d => attempted.add(d.url));
        result.pages.push(...await Promise.all(candidates.map(d => inspect(d.url))));
      }
    }
    result.discoveries = [...discovered.values()];
  } catch (e) {
    error(websiteUrl, e instanceof Error && /^(unsafe_|robots_|cross_origin_|redirect_|deadline|body_limit)/.test(e.message) ? e.message : "network_or_policy_unavailable");
  } finally { clearTimeout(timer); controller.abort(); }

  const inspected = result.pages.filter(p => p.status === "observed");
  const duplicates = (field: "title" | "metaDescription") => {
    const groups = new Map<string, { value: string; urls: string[] }>();
    for (const p of inspected) {
      const value = p[field]; if (!value) continue;
      const key = value.toLowerCase().replace(/\s+/g, " ");
      const g = groups.get(key) ?? { value, urls: [] }; g.urls.push(p.finalUrl ?? p.url); groups.set(key, g);
    }
    return [...groups.values()].filter(g => g.urls.length > 1);
  };
  result.duplicateTitles = duplicates("title"); result.duplicateDescriptions = duplicates("metaDescription");
  for (const p of result.pages) {
    const sources = inspected.filter(source => source.internalLinks.includes(p.url)).map(source => source.url);
    if (sources.length && [404, 410].includes(p.httpStatus ?? 0)) {
      result.brokenLinks.push({ url: p.url, sourceUrls: sources, httpStatus: p.httpStatus! });
      result.findings.push({ category: "technical", severity: "warning", evidenceUrl: p.url, evidenceUrls: sources, finding: `Discovered internal link returned HTTP ${p.httpStatus}.`, fix: "Verify the intended destination; update the source links or restore the intended page." });
    }
  }
  for (const p of inspected) {
    for (const [missing, label, fix] of [
      [!p.title, "title", "Check the rendered document and provide a descriptive, page-specific title if also absent."],
      [!p.metaDescription, "meta description", "Consider a page-specific summary for search snippets after checking rendered metadata."],
      [!p.headings.some(h => h.level === 1), "H1", "Check the rendered page; add a clear primary heading if it lacks one."],
    ] as const) if (missing) result.findings.push({ category: label === "meta description" ? "suggestion" : "seo", severity: "info", evidenceUrl: p.url, finding: `No ${label} detected in fetched HTML; rendered presence was not tested.`, fix });
    if (p.noindex) result.findings.push({ category: "technical", severity: "warning", evidenceUrl: p.url, finding: "A noindex directive was observed in the response headers or HTML.", fix: "Confirm whether this page should be searchable; remove the directive only if indexing is intended." });
  }
  for (const [groups, label] of [[result.duplicateTitles, "title"], [result.duplicateDescriptions, "meta description"]] as const) {
    for (const g of groups) result.findings.push({ category: "seo", severity: "info", evidenceUrl: g.urls[0], evidenceUrls: g.urls, finding: `Shared ${label} across ${g.urls.length} inspected pages: ${g.value}`, fix: "Review whether the pages serve distinct purposes; differentiate metadata where appropriate. Shared metadata alone is not a ranking penalty." });
  }
  result.coverage = { inspected: inspected.length, attempted: result.pages.length, limit: LIMIT, discovered: result.discoveries.length };
  result.status = !inspected.length ? "unavailable" : result.errors.length || result.discoveries.some(d => !result.pages.some(p => p.url === d.url && p.status === "observed")) ? "partial" : "observed";
  return result;
}
