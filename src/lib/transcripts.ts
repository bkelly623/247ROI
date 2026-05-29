import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

export type TranscriptFaq = { q: string; a: string };
export type TranscriptCta = { label: string; href: string };

export type TranscriptIndexEntry = {
  slug: string;
  title: string;
  publishedAt: string; // YYYY-MM-DD
  summary: string;
  youtubeId?: string;
  keyTakeaways?: string[];
  faqs?: TranscriptFaq[];
  primaryCta?: TranscriptCta;
};

const TRANSCRIPTS_DIR = path.join(process.cwd(), "content", "transcripts");
const INDEX_PATH = path.join(TRANSCRIPTS_DIR, "index.json");

export async function getTranscriptsIndex(): Promise<TranscriptIndexEntry[]> {
  const raw = await readFile(INDEX_PATH, "utf8");
  const parsed = JSON.parse(raw) as TranscriptIndexEntry[];
  return parsed
    .filter((t) => typeof t?.slug === "string" && typeof t?.title === "string")
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getTranscriptBySlug(slug: string) {
  const index = await getTranscriptsIndex();
  const entry = index.find((t) => t.slug === slug);
  if (!entry) return null;

  const markdownPath = path.join(TRANSCRIPTS_DIR, `${slug}.md`);
  const body = await readFile(markdownPath, "utf8");
  return { entry, body };
}
