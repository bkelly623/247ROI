# Website Preview Pipeline: Spec for Hermes

**Owner:** B (24/7 ROI)
**Purpose:** At the end of a calling day, turn every prospect B promised a website preview into a finished, reviewed, premium-quality preview site, without B iterating by hand.
**How it works:** research the business's real facts → build → screenshot → independent visual review → fix → repeat (max 3 rounds) → hand to B for approval → email the prospect.

The quality bar is the final Keystone Towing and Heaton's Towing previews. Both took 3–4 manual rounds to get there; this spec turns those lessons into rules so the loop gets there on its own.

---

## 0. Trigger and inputs

**Trigger:** B says something like "build previews for everyone I promised a website today."

**Input:** that day's call notes and recordings. Select every call where B said he would build or send a website or preview.

For each selected prospect, create a record (`prospects/<slug>/prospect.json`):

```json
{
  "slug": "heatons-towing",
  "business_name": "",
  "contact_name": "",
  "email": "",
  "phone": "",
  "call_notes": "verbatim notes / transcript excerpt about the website",
  "promised": "what B said he'd send, e.g. 'website preview by Friday'",
  "special_requests": "anything the owner asked for or mentioned (services, colors, logo, truck photos)"
}
```

Skip anyone without an email address. List them in the end-of-run report under "Can't send: no email."

---

## 1. Research: real facts only

Pull the business's **Google Business Profile** (Google Places API, or search for the name + town). Save it to `prospects/<slug>/facts.json`:

```json
{
  "legal_name": "", "display_name": "",
  "address": "", "town": "", "state": "",
  "phone_display": "(XXX) XXX-XXXX", "phone_tel": "+1XXXXXXXXXX",
  "hours": "e.g. Open 24/7 or Mon–Sat 7 AM–6 PM",
  "rating": 5.0, "review_count": 113,
  "google_maps_url": "",
  "top_review_quotes": ["exact quote 1", "exact quote 2", "exact quote 3"],
  "review_themes": ["fast arrival", "friendly drivers", "fair prices"],
  "services": ["only services stated on the listing, website, or by the owner on the call"],
  "service_area_towns": ["the business's town plus 4–6 nearby towns"],
  "existing_logo_or_colors": "if found",
  "source_urls": []
}
```

Rules:
- **Every fact on the site must come from facts.json or the call notes.** Never invent years in business, licenses, insurance, response times, prices, emails, owner names or certifications.
- **Review quotes are copied exactly.** No edits, no merging, no inventing. Choose short ones (under 25 words) that show the business's strengths.
- **Lead with the strongest facts.** If the business is open 24/7, has a rating of 4.7 or higher with 20+ reviews, or has a standout review theme (like "arrived in 20 minutes"), the hero must show it.
- Use the business's email address on the site only if it was confirmed on the call or appears on the listing.
- If there's no Google listing, build from the call notes alone and flag it in the report.

---

## 2. Build

### Stack
- Plain static HTML/CSS/JS: one `index.html`, `assets/css/site.css`, `assets/js/site.js`, and `assets/img/`. No framework.
- Self-host fonts as woff2. Use a strict CSP (`default-src 'self'`).
- Deploy as a new Vercel project named `<slug>-preview` (URL: `https://<slug>-preview.vercel.app`).
- Set `noindex, nofollow` (meta + `X-Robots-Tag` header) on the preview. Remove it only when the site goes live on the client's domain.

### Page structure (in order)
1. **Header.** Logo mark + business name, nav, and a desktop call button showing the formatted number. On mobile: logo + hamburger icon only (with an aria-label), header about 60px tall.
2. **Hero.** Eyebrow with town + hours (e.g. "York, PA · Open 24/7"). A concrete headline naming the service and town, with a two-tone second line (e.g. "Towing in York. / Day or night."). One short subline. One primary **Call** button with a phone icon. A trust line under it: "★★★★★ 5.0 · 113 Google reviews", linked to the Google listing. Branded vehicle image (section 3).
3. **Facts strip.** 3–4 short real facts: hours, rating, "Local to <town>", main services.
4. **Services.** Compact cards (icon left, title + one line right). Only real services.
5. **Reviews.** Big rating number, stars, 3 exact quotes attributed "— Google review", and a "Read all N reviews on Google" link.
6. **How it works.** 3 short steps (e.g. Tell us where → Tell us what → Get a price and an ETA).
7. **Service area.** Town chips, with the home town highlighted.
8. **FAQ.** 3–4 questions, answered only with real facts.
9. **Closing CTA.** Short headline, formatted phone number, Call + Text buttons.
10. **Footer.** Name, town, phone, and one small "Design preview" line. Nothing else about it being a concept.
11. **Mobile sticky bar.** Call (with the number under the label) + Text. Hidden on desktop.

### Copy rules
- Write for someone stressed and in a hurry. Plain, concrete and confident.
- **No vague or poetic lines.** Never "A tough day. A solid way forward.", "Less uncertainty. More direction." or "A little clarity." Name the service, town, speed, hours and price honesty.
- No hedging or disclaimers in the body ("suitability confirmed by phone," "a text does not confirm a booking").
- Use the owner's first name ("Call Mike") if it came up on the call and the business is owner-operated.
- The SMS link pre-fills a helpful message: `sms:+1XXXXXXXXXX?&body=Hi, I need help. Location:  Vehicle:  Going to: `

### Design rules (mobile first)
- Design at **390×844 first**, then 1440×900.
- Body text: **17px mobile, 18px desktop, regular weight.** Use a bold display font for headlines (700–800 weight, e.g. Archivo, Barlow or Manrope) and a clean sans for body.
- No H2 longer than 3 lines on a phone. Use `text-wrap: balance` on headlines so no word sits alone on a line.
- Pick a palette that suits the trade, with one bold accent. Navy/yellow and charcoal/amber both worked for towing.
- Add depth with soft shadows, subtle borders and gradients. Avoid flat blocks of color everywhere.
- Phone number format: **(XXX) XXX-XXXX** everywhere. Show it as a large headline at most twice on the page.
- Use ↗ arrows only on genuinely external links (Google). Call buttons get a phone icon.
- Keep the reveal-on-scroll animations subtle and respect `prefers-reduced-motion`.

---

## 3. Hero image: branded vehicle

Generate a photorealistic hero showing **the business's own branded vehicle** (tow truck, van, pickup, etc., whatever fits the trade). This is the "that's my company" moment for the owner.

**Step A: generate the base image.**
Prompt template:
> Photorealistic photo of a clean, modern [white/black/navy] [flatbed tow truck / service van / pickup] [carrying an undamaged sedan, if towing], parked on a [tree-lined suburban road / quiet highway shoulder] in [region, e.g. southeastern Pennsylvania], [golden hour / dusk with amber lights on], low 3/4 front angle, shallow depth of field. No people, no license plates, no text or logos anywhere; blank door panel and blank bed/side panel. Leave the left 40% of the frame calmer (sky, road, trees) for text overlay.

**Step B: add the branding yourself.**
Composite the business name (and logo or monogram) onto the door and side panel in the brand colors, perspective-matched to the panel. **Never rely on the image model to render text.** It misspells it.

**Step C: export** webp + jpg at 960 (mobile, 4:5 crop with the vehicle fully visible), 1100 and 1920 wide (16:9, vehicle filling about half the frame).

Rules:
- No other company's name, logo or lettering anywhere in the image.
- No faces, no plates, no accident damage or wrecks (unless accident recovery is the business's main service).
- The scenery must match the region (no Pacific Northwest pines for Pennsylvania).
- Add an HTML comment next to the image: `<!-- Concept image: replace with a photo of the owner's real vehicle before launch -->`

---

## 4. Screenshot

Use the screenshot pipeline on the `site-shots` branch of `bkelly623/247ROI`:

1. Write the preview URL (with a cache-busting query, e.g. `?v=<short-hash>`) as the only line of `requests/<slug>.txt`.
2. Commit and push to `site-shots`.
3. GitHub Actions renders the page at phone (Pixel 7) and desktop (1440×900) sizes, scrolling screen by screen, and commits the results to `out/<slug>/` (`phone-01.jpg`…, `desktop-01.jpg`…, `meta.txt`). This takes about 2 minutes. Poll with `git fetch` until `out/<slug>/meta.txt` shows your URL and a fresh timestamp.
4. If `out/<slug>.failed` appears, the page didn't load. Check the deployment.

Runs are queued one at a time, so multiple prospects can be submitted back to back.

---

## 5. Review: independent, from the screenshots

Run the review as a **separate model call with a fresh context**. The reviewer sees only:
- every screenshot in `out/<slug>/`
- `facts.json`
- the checklist below

It must **not** see the build conversation or the code. Use a strong vision model.

### Reviewer prompt

> You are a senior web designer reviewing a website preview for a local trades business. The goal: the owner sees it and immediately thinks "that looks like a premium version of my company," and a stressed customer on a phone can call within 3 seconds. You are given phone and desktop screenshots (in scroll order) and the verified facts. Judge only what you can see. Go through every checklist item. Zoom in on any vehicle lettering. Be strict: a PASS means you would send this to the owner today without changes.
>
> Return JSON only:
> ```json
> {"verdict": "PASS" | "FAIL",
>  "fixes": [{"id": 1, "severity": "must|should", "where": "phone-01 hero", "problem": "...", "fix": "specific instruction"}],
>  "strengths": ["..."]}
> ```
> FAIL if any "must" fix exists.

### Checklist ("must" unless marked "should")

**First phone screen (phone-01, above the sticky bar)**
- [ ] The strongest real facts are visible: hours (especially 24/7) and star rating + review count, when they exist
- [ ] The headline is concrete (service + town), not vague or poetic
- [ ] The primary Call button is fully visible, with nothing half-hidden behind the sticky bar
- [ ] The vehicle image is visible, not a solid color block

**Facts and honesty**
- [ ] Every fact matches facts.json. Nothing invented (emails, years, licenses, response times, prices)
- [ ] Review quotes match facts.json exactly
- [ ] No other company's name or branding in any image; no faces; no plates
- [ ] Vehicle lettering is spelled correctly, sharp and believable (not warped or garbled)
- [ ] No accident or damage scenes (unless that's the core service); scenery fits the region
- [ ] At most one small "design preview" line, in the footer only. No top banner, no "concept imagery" labels

**Visual quality**
- [ ] Body text looks about 17–18px and regular weight, not oversized or heavy
- [ ] No H2 over 3 lines on a phone; no single word alone on a headline line; no awkward mid-phrase breaks (e.g. "6 AM–" / "10 PM")
- [ ] No broken underlines, cut-off ticker or marquee text, empty grid cells, stray empty bands or large unexplained gaps
- [ ] Phone number formatted as (XXX) XXX-XXXX; shown as a giant headline at most twice
- [ ] ↗ arrows only on external links
- [ ] Desktop: the vehicle fills a meaningful part of the hero; the layout is balanced (should)
- [ ] Consistent quality: no section looks clearly cheaper than the rest, e.g. amateur line drawings next to a photo-quality hero (should)
- [ ] Overall impression is premium: depth, hierarchy, confident type, not a generic template (should)

---

## 6. Fix loop

1. If FAIL: give the builder the reviewer's `fixes` list verbatim, plus facts.json. The builder applies **every must fix and as many should fixes as practical**, without redesigning the parts that work.
2. Redeploy with a new `?v=` value, screenshot again (section 4) and review again (section 5) **with a brand-new reviewer context.**
3. **Cap: 3 review rounds.** If round 3 still fails, stop and flag it for B with the remaining fixes. Don't loop forever.
4. Save each round's verdict to `prospects/<slug>/review-round-N.json`.

---

## 7. Hand-off to B (approval required before emailing)

When a site passes or hits the cap, send B one summary for the whole batch:

```
PREVIEWS READY: <date>

✅ Heaton's Towing (York, PA): PASS round 2
   https://heatons-towing-preview.vercel.app/?v=xxxx
   Reviewer strengths: 24/7 + 5.0★ above the fold; branded truck; real reviews
   Owner: Taylor · taylor@... · (717) 900-7872
   Draft email: [below]

⚠️ <Business>: FAILED after 3 rounds
   Remaining issues: ...

⛔ Can't send (no email): <Business>, <Business>
```

Include `phone-01.jpg` for each site so B can judge at a glance.

**Do not email any prospect until B replies with approval** (e.g. "send all" or "send Heaton's"). B may lift this rule later.

---

## 8. Prospect email (send only after approval)

Keep it short, honest and personal. Refer to the call. No fake stories, no "design student," no invented referrals.

```
Subject: Your website preview, <Business Name>

Hi <First name>,

Thanks for talking with me <today / on Monday>. As promised, I built a preview of a
website for <Business Name>:

<preview URL>

It's built around what your customers already say about you on Google<, like your
<5.0 rating / 24/7 availability>>. The truck in the photo is a stand-in; once we go
live, we'll swap in a photo of your actual <truck/van>.

If you like it, it goes live on your own domain for <PRICE>/month: hosting, updates
and changes included, cancel anytime. If you want anything changed, just reply and
tell me.

<B's name>
24/7 ROI · <phone>
```

Fill `<PRICE>` from B's current offer. Never quote a price B hasn't set.

---

## 9. Hard rules (never break)

1. Nothing invented. Facts come only from the Google listing, the business's own pages or the call.
2. No other company's branding in any image. No faces, no plates.
3. Never let an image model render business names. Composite them.
4. Never email a prospect without B's approval (until B lifts this).
5. Never skip the screenshot review. No site goes to B unreviewed.
6. Maximum 3 review rounds per site per run.
7. Preview sites stay `noindex` until they launch on the client's domain.
