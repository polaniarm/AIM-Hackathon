import { NextRequest } from "next/server";
import { searchStagedOutlookCandidates } from "@/lib/private/outlook-staged-candidates";
import { isAuthorizedAdminRequest } from "@/lib/server/admin-auth";
import { createKnowledge, getAllKnowledgeForAdmin } from "@/lib/server/knowledge-store";
import { readJsonBody } from "@/lib/server/request-json";

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };
const MAX_QUERY_LENGTH = 120;

function unauthorized() {
  return Response.json(
    { error: { code: "unauthorized", message: "Admin authentication is required." } },
    { status: 401, headers: PRIVATE_HEADERS },
  );
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  const parsedBody = await readJsonBody(request, 2_048);
  if (!parsedBody.ok) return parsedBody.response;

  const rawQuery =
    typeof parsedBody.value === "object" && parsedBody.value !== null && "query" in parsedBody.value
      ? (parsedBody.value as { query?: unknown }).query
      : undefined;

  if (typeof rawQuery !== "string" || rawQuery.trim().length < 2) {
    return Response.json(
      { error: { code: "invalid_query", message: "Enter an Outlook topic to import." } },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  const query = rawQuery.trim();
  if (query.length > MAX_QUERY_LENGTH) {
    return Response.json(
      {
        error: {
          code: "query_too_long",
          message: `Outlook topic must be ${MAX_QUERY_LENGTH} characters or fewer.`,
        },
      },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  const matches = searchStagedOutlookCandidates(query);
  const existing = getAllKnowledgeForAdmin();
  const created = matches
    .filter(
      (candidate) =>
        !existing.some(
          (entry) =>
            entry.sourceType === "outlook" &&
            entry.sourceLabel === candidate.sourceLabel &&
            entry.title === candidate.title,
        ),
    )
    .map((candidate) =>
      createKnowledge({
        title: candidate.title,
        content: candidate.content,
        sourceType: "outlook",
        sourceLabel: candidate.sourceLabel,
        sourceDate: candidate.sourceDate,
        published: false,
      }),
    );

  return Response.json(
    {
      entries: created,
      matched: matches.length,
      duplicatesSkipped: matches.length - created.length,
    },
    { headers: PRIVATE_HEADERS },
  );
}
