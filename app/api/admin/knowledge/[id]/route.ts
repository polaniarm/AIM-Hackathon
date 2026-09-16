import { NextRequest } from "next/server";
import { parseKnowledgePatch } from "@/lib/knowledge/validation";
import { isAuthorizedAdminRequest } from "@/lib/server/admin-auth";
import { deleteKnowledge, updateKnowledge } from "@/lib/server/knowledge-store";
import { readJsonBody } from "@/lib/server/request-json";

type Context = { params: Promise<{ id: string }> };
const PRIVATE_HEADERS = { "Cache-Control": "no-store" };
const VALID_KNOWLEDGE_ID = /^[A-Za-z0-9-]{1,80}$/;

function unauthorized() {
  return Response.json(
    { error: { code: "unauthorized", message: "Admin authentication is required." } },
    { status: 401, headers: PRIVATE_HEADERS },
  );
}

function invalidId(id: string) {
  if (VALID_KNOWLEDGE_ID.test(id)) return null;
  return Response.json(
    { error: { code: "invalid_id", message: "Knowledge entry ID is invalid." } },
    { status: 400, headers: PRIVATE_HEADERS },
  );
}

export async function PATCH(request: NextRequest, context: Context) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  const { id } = await context.params;
  const idError = invalidId(id);
  if (idError) return idError;

  const parsedBody = await readJsonBody(request, 8_192);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = parseKnowledgePatch(parsedBody.value);
  if (!parsed.ok) {
    return Response.json(
      { error: { code: "invalid_entry", message: parsed.message } },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  const entry = updateKnowledge(id, parsed.value);
  if (!entry) {
    return Response.json(
      { error: { code: "not_found", message: "Knowledge entry not found." } },
      { status: 404, headers: PRIVATE_HEADERS },
    );
  }

  return Response.json({ entry }, { headers: PRIVATE_HEADERS });
}

export async function DELETE(request: NextRequest, context: Context) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  const { id } = await context.params;
  const idError = invalidId(id);
  if (idError) return idError;
  if (!deleteKnowledge(id)) {
    return Response.json(
      { error: { code: "not_found", message: "Knowledge entry not found." } },
      { status: 404, headers: PRIVATE_HEADERS },
    );
  }

  return new Response(null, { status: 204, headers: PRIVATE_HEADERS });
}
