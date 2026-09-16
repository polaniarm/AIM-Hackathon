import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  isAdminSecretConfigured,
  setAdminSessionCookie,
  validateAdminSecret,
} from "@/lib/server/admin-auth";
import { readJsonBody } from "@/lib/server/request-json";

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  if (!isAdminSecretConfigured()) {
    return NextResponse.json(
      { error: { code: "admin_not_configured", message: "Admin access is not configured." } },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }

  const parsedBody = await readJsonBody(request, 1_024);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.value;

  const secret =
    typeof body === "object" && body !== null && "secret" in body
      ? (body as { secret?: unknown }).secret
      : undefined;

  if (!validateAdminSecret(secret)) {
    return NextResponse.json(
      { error: { code: "invalid_credentials", message: "Invalid admin secret." } },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }

  const response = NextResponse.json({ status: "ok" }, { headers: PRIVATE_HEADERS });
  setAdminSessionCookie(response);
  return response;
}

export function DELETE() {
  const response = NextResponse.json({ status: "ok" }, { headers: PRIVATE_HEADERS });
  clearAdminSessionCookie(response);
  return response;
}
