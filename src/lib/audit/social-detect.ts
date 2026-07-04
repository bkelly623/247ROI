export interface SocialSignals {
  hasFacebook: boolean;
  hasInstagram: boolean;
  hasLinkedIn: boolean;
  hasYouTube: boolean;
  hasGoogleBusiness: boolean;
  profileUrls: string[];
}

export function detectSocialLinks(html: string): SocialSignals {
  const lower = html.toLowerCase();
  const profileUrls: string[] = [];

  const patterns = [
    /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/gi,
    /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9._-]+/gi,
    /https?:\/\/(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)[a-zA-Z0-9._-]+/gi,
    /https?:\/\/(?:www\.)?google\.com\/maps\/place\/[^"'\s]+/gi,
  ];

  for (const pattern of patterns) {
    const matches = html.match(pattern) ?? [];
    profileUrls.push(...matches.slice(0, 2));
  }

  return {
    hasFacebook: /facebook\.com\//i.test(lower) && !/twitter-image/i.test(lower),
    hasInstagram: /instagram\.com\//i.test(lower),
    hasLinkedIn: /linkedin\.com\//i.test(lower),
    hasYouTube: /youtube\.com\//i.test(lower),
    hasGoogleBusiness: /google\.com\/maps|g\.page|business\.site/i.test(lower),
    profileUrls: [...new Set(profileUrls)].slice(0, 6),
  };
}

export function socialScoreFromSignals(signals: SocialSignals): number {
  let score = 12;
  if (signals.hasFacebook) score += 15;
  if (signals.hasInstagram) score += 18;
  if (signals.hasLinkedIn) score += 10;
  if (signals.hasYouTube) score += 8;
  if (signals.hasGoogleBusiness) score += 20;
  return Math.min(85, score);
}

export function socialSummary(signals: SocialSignals): { summary: string; topFix: string } {
  const found = [
    signals.hasFacebook && "Facebook",
    signals.hasInstagram && "Instagram",
    signals.hasLinkedIn && "LinkedIn",
    signals.hasYouTube && "YouTube",
    signals.hasGoogleBusiness && "Google Business",
  ].filter(Boolean) as string[];

  if (found.length === 0) {
    return {
      summary:
        "No social profiles were linked on your website. Customers and AI tools often check your site first — unlinked profiles look like a dead brand.",
      topFix:
        "Link your active social profiles on your site, then run an automated posting pipeline.",
    };
  }

  if (found.length < 3) {
    return {
      summary: `We found ${found.join(", ")} on your site, but your social footprint is still thin for local trust signals.`,
      topFix: "Expand linked profiles and publish consistent project content weekly.",
    };
  }

  return {
    summary: `Strong social links detected (${found.join(", ")}). Focus on posting frequency and video content.`,
    topFix: "Automate project spotlights and short-form video to stay visible in feeds.",
  };
}
