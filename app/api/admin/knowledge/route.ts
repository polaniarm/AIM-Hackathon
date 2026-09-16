import { NextRequest } from "next/server";
import { parseKnowledgeInput } from "@/lib/knowledge/validation";
import { isAuthorizedAdminRequest } from "@/lib/server/admin-auth";
import { createKnowledge, getAllKnowledgeForAdmin } from "@/lib/server/knowledge-store";
import { readJsonBody } from "@/lib/server/request-json";

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

function unauthorized() {
  return Response.json(
    { error: { code: "unauthorized", message: "Admin authentication is required." } },
    { status: 401, headers: PRIVATE_HEADERS },
  );
}

export function GET(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  return Response.json(
    { entries: getAllKnowledgeForAdmin() },
    { headers: PRIVATE_HEADERS },
  );
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  const parsedBody = await readJsonBody(request, 8_192);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = parseKnowledgeInput(parsedBody.value);
  if (!parsed.ok) {
    return Response.json(
      { error: { code: "invalid_entry", message: parsed.message } },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  return Response.json(
    { entry: createKnowledge(parsed.value) },
    { status: 201, headers: PRIVATE_HEADERS },
  );
}
