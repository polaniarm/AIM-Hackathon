import type { KnowledgeEntry } from "./types";

const stopWords = new Set([
  "about",
  "and",
  "are",
  "built",
  "done",
  "for",
  "have",
  "how",
  "into",
  "the",
  "their",
  "this",
  "what",
  "with",
  "work",
  "worked",
  "you",
  "your",
]);

function stem(token: string) {
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

export function tokenize(value: string): string[] {
  return (value.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .map(stem)
    .filter((token) => (token.length >= 3 || token === "ai") && !stopWords.has(token));
}

export function retrieveRelevantKnowledge(
  question: string,
  entries: readonly KnowledgeEntry[],
  limit = 3,
): KnowledgeEntry[] {
  const questionTokens = new Set(tokenize(question));
  if (questionTokens.size === 0) return [];

  return entries
    .filter((entry) => entry.published)
    .map((entry) => {
      const titleTokens = new Set(tokenize(entry.title));
      const contentTokens = new Set(tokenize(entry.content));
      let score = 0;

      for (const token of questionTokens) {
        if (titleTokens.has(token)) score += 3;
        if (contentTokens.has(token)) score += 1;
      }

      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.entry.title.localeCompare(right.entry.title))
    .slice(0, limit)
    .map(({ entry }) => ({ ...entry }));
}

export function buildBoundedContext(entries: readonly KnowledgeEntry[], maxCharacters = 6_000) {
  return entries
    // Defense in depth: unsafe callers still cannot place private text in model context.
    .filter((entry) => entry.published)
    .map((entry, index) => `[${index + 1}] ${entry.title}\n${entry.content}`)
    .join("\n\n")
    .slice(0, maxCharacters);
}
