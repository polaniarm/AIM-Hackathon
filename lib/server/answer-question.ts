import "server-only";

import { buildBoundedContext, retrieveRelevantKnowledge } from "@/lib/knowledge/retrieval";
import { getPublishedKnowledge } from "@/lib/server/knowledge-store";
import { generateGroundedAnswer, type GroundedAnswer } from "@/lib/server/llm";

export const INSUFFICIENT_ANSWER = "I don't have enough published information to answer that yet.";

export type AskResult = {
  answer: string;
  sources: Array<{ id: string; title: string }>;
  mode: GroundedAnswer["mode"] | "insufficient";
  model: string | null;
};

export async function answerQuestion(question: string): Promise<AskResult> {
  const publishedKnowledge = getPublishedKnowledge();
  const matches = retrieveRelevantKnowledge(question, publishedKnowledge, 3);

  if (matches.length === 0) {
    return { answer: INSUFFICIENT_ANSWER, sources: [], mode: "insufficient", model: null };
  }

  const context = buildBoundedContext(matches);
  const generated = await generateGroundedAnswer(question, context);
  return {
    answer: generated.text,
    sources: matches.map(({ id, title }) => ({ id, title })),
    mode: generated.mode,
    model: generated.model,
  };
}
