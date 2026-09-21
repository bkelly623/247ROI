const TRADE_PATTERNS: { pattern: RegExp; label: string; service: string }[] = [
  { pattern: /\b(?:dentist|dentistry|dental)\b/i, label: "Dentistry", service: "dentist" },
  { pattern: /\bmold\b/i, label: "Mold Remediation", service: "mold remediation company" },
  { pattern: /\b247\s*roi\b|\bdiscovizlabs\b/i, label: "AI & Business Automation", service: "AI business automation consultant" },
  { pattern: /roof/i, label: "Roofing", service: "roofer" },
  { pattern: /plumb/i, label: "Plumbing", service: "plumber" },
  { pattern: /hvac|heating|cooling|air condition/i, label: "HVAC", service: "HVAC contractor" },
  { pattern: /electric/i, label: "Electrical", service: "electrician" },
  { pattern: /paint/i, label: "Painting", service: "painter" },
  { pattern: /landscap|lawn/i, label: "Landscaping", service: "landscaper" },
  { pattern: /remodel|renovat|construct|build/i, label: "Construction", service: "general contractor" },
  { pattern: /clean/i, label: "Cleaning", service: "cleaning service" },
  { pattern: /pest/i, label: "Pest Control", service: "pest control company" },
  { pattern: /garage|door/i, label: "Garage Doors", service: "garage door company" },
];

export function inferServiceFromName(businessName: string): {
  tradeLabel: string;
  servicePhrase: string;
} {
  for (const { pattern, label, service } of TRADE_PATTERNS) {
    if (pattern.test(businessName)) {
      return { tradeLabel: label, servicePhrase: service };
    }
  }
  // An unknown name is not evidence of a home-service business.
  return { tradeLabel: "Business Services (unconfirmed)", servicePhrase: businessName.trim() || "business services" };
}

export function businessNameMentioned(
  text: string,
  businessName: string
): boolean {
  const normalized = text.toLowerCase();
  const tokens = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "llc", "inc"].includes(w));

  if (tokens.length === 0) return false;
  const hits = tokens.filter((t) => normalized.includes(t)).length;
  return hits >= Math.min(2, tokens.length) || (tokens.length === 1 && hits === 1);
}
