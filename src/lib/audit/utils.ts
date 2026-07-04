export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function scoreColor(score: number): string {
  if (score >= 70) return "hsl(142 71% 45%)";
  if (score >= 45) return "hsl(38 92% 50%)";
  return "hsl(0 84% 60%)";
}

export function scoreLabel(score: number): string {
  if (score >= 70) return "Strong";
  if (score >= 45) return "Needs Work";
  return "Critical Gap";
}
