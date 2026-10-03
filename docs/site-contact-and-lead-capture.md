# Contact update and lead-capture integration decision

## Authorized scope
Audit work is on hold. Change the public business number to 6103003001 everywhere. Inspect the footer and recommend integration of missed-call text back and AI receptionist without displacing custom software, automation or dashboards. New offer pages, pricing and broader homepage/navigation edits are not implemented in this phone-only release.

## Phone implementation
- Single source: src/app/components/cta.ts, display (610) 300-3001, tel:+16103003001.
- Legal pages, website chatbot prompt/fallback, report guide and SMS handoff now consume the shared source rather than old duplicated numbers. Navbar/footer/home/services/contact/structured data already inherit that source.
- Updated active business/contact documentation. No telephony-provider settings, environment secrets, SMS transport or outbound calls/messages changed. Unused legacy demo constants are separate from the primary business number; no active caller of those components was found.
- No audit-engine, audit-discovery, offer, layout or footer-routing changes.

## Local acceptance
- npm run build passed; existing unrelated warnings remain.
- Scoped ESLint and git diff --check passed.
- Actual preview on port 3617: homepage 200; all 13 referenced JS chunk files match this worktree build.
- scripts/site-contact.test.ts passed: all 51 sitemap routes return 200 with zero old-number matches. The new contact appears on 49; two text resources contain no phone.
- Browser acceptance at 390px and 1280px: home/contact/legal call links target the new number, homepage structured data matches, no horizontal overflow or JS page errors, footer Services link opens the correct page. SMS URI helper verified without running an audit or sending SMS.
- Build log /tmp/247roi-site-contact-build.log. Captures/results /tmp/247roi-site-contact-qa/.
- Production release and final live readback are pending at the time of this record. Final verified release details belong in the profile website-ops release record.

## Footer findings (before any navigation edits)
Browser-extracted footer contains 27 anchors, including logo/phone and a repeated audit destination: 25 distinct internal destinations. All return 200 at their intended URLs, with distinct appropriate headings, not homepage redirects. Actual mobile clicks on Services, Custom dashboards and Contact opened the correct routes. Apex domain redirects preserve the checked paths. No blanket redirect or placeholder hash-link defect was reproduced. The footer is overlong and distributes overlapping systems/AI/SEO categories without a clear lead-capture path; recommend reducing visible navigation while retaining useful page URLs and contextual links.
Evidence: profile browser workspace files 247roi-footer-before.json, 247roi-footer-http-before.json, 247roi-footer-clicks-before.json.

## Recommended next stage — requires owner go-ahead
1. Create /missed-call-text-back as the focused acquisition/offer page. Explain missed call -> prompt branded text -> reply captured -> owner follow-up, what is included, number compatibility, setup requirements, human handoff, opt-outs and applicable consent requirements. Show a clearly illustrative conversation, not fake results. Use a dedicated offer CTA/contact path, not a compulsory audit. Place the special on this evergreen page (#offer); do not make another duplicate special page initially.
2. Improve the existing /ai-employees/ai-receptionist page rather than create a competing duplicate. Explain live call answering, intake, routing, after-hours/overflow coverage and booking only where configured. Distinguish voice answering from missed-call SMS. Cross-link the two with a compact comparison; text back is a useful standalone purchase, not a forced upsell.
3. Keep the homepage as the broader 247ROI business. Add a prominent lead-capture section and CTA for the wedge, an AI receptionist path and a clear custom systems path. Suggested umbrella direction: Capture more leads. Run a smoother business. Keep custom-software proof/sections, existing URLs and audit availability; do not funnel every service through the paused audit workstream.
4. Surface Lead Capture in navigation with both offers; retain Custom Systems/Services, About and Contact. Simplify footer into purposeful service/company/resources groups, legal links below. Do not delete existing landing pages or create root redirects merely to shrink the footer.
5. Adapt services/contact/chatbot context to route prospects by intent. Reuse current event infrastructure with distinct offer CTA and actual submission success events; phone clicks are intent, not proven leads. Establish a working callback/demo request route without sending test leads into sales automatically. No fabricated performance statistics, absolute never-miss guarantees, fake reviews or unapproved urgency.
6. Deliver a mobile/desktop preview and test every changed CTA/link/form. Get owner approval of the special and preview before public offer release; verify live pages, metadata/canonicals/sitemap and submitted-form delivery within authorized test scope.

## Commercial decisions needed
The owner has not supplied price, setup fee, included usage, overages, commitment/cancellation terms or a real deadline for the missed-call special. Existing receptionist copy advertises a 30-day trial for qualified businesses; confirm whether to retain that offer rather than silently extending it to text back. Confirm demo/callback flow and supported business-number setup before making functional promises. No commercial terms were changed.
