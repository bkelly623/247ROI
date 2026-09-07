const siteUrl = process.env.SITE_URL || "https://www.get247roi.com";
const sitemapUrl = `${siteUrl.replace(/\/$/, "")}/sitemap.xml`;

const sitemapResponse = await fetch(sitemapUrl);

if (!sitemapResponse.ok) {
  throw new Error(`Could not fetch sitemap: ${sitemapResponse.status} ${sitemapResponse.statusText}`);
}

const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (urls.length === 0) {
  throw new Error(`No URLs found in ${sitemapUrl}`);
}

const problems = [];

for (const url of urls) {
  const response = await fetch(url, { method: "HEAD", redirect: "manual" });

  if (response.status >= 300 && response.status < 400) {
    problems.push(`${response.status} redirect: ${url} -> ${response.headers.get("location") || "(no location)"}`);
    continue;
  }

  if (!response.ok) {
    problems.push(`${response.status} ${response.statusText}: ${url}`);
  }
}

if (problems.length > 0) {
  console.error(`Sitemap contains ${problems.length} non-indexable URL(s):`);
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log(`Checked ${urls.length} sitemap URLs. All returned indexable 2xx responses.`);
