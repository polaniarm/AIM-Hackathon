import { answerQuestion } from "@/lib/server/answer-question";
import { readJsonBody } from "@/lib/server/request-json";

const MAX_QUESTION_LENGTH = 400;

export async function POST(request: Request) {
  const parsedBody = await readJsonBody(request, 2_048);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.value;

  const question =
    typeof body === "object" && body !== null && "question" in body
      ? (body as { question?: unknown }).question
      : undefined;

  if (typeof question !== "string" || question.trim().length === 0) {
    return Response.json(
      { error: { code: "invalid_question", message: "Question is required." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const cleanedQuestion = question.trim();
  if (cleanedQuestion.length > MAX_QUESTION_LENGTH) {
    return Response.json(
      {
        error: {
          code: "question_too_long",
          message: `Question must be ${MAX_QUESTION_LENGTH} characters or fewer.`,
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    return Response.json(await answerQuestion(cleanedQuestion), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    console.error("Ask Me answer generation failed.");
    return Response.json(
      { error: { code: "answer_failed", message: "The answer service is temporarily unavailable." } },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
