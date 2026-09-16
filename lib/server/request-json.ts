import "server-only";

type JsonReadResult =
  | { ok: true; value: unknown }
  | { ok: false; response: Response };

function errorResponse(status: number, code: string, message: string) {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<JsonReadResult> {
  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const declaredBytes = Number(contentLength);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      return {
        ok: false,
        response: errorResponse(413, "body_too_large", "Request body is too large."),
      };
    }
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    return {
      ok: false,
      response: errorResponse(413, "body_too_large", "Request body is too large."),
    };
  }

  try {
    return { ok: true, value: JSON.parse(body) as unknown };
  } catch {
    return {
      ok: false,
      response: errorResponse(400, "invalid_json", "Request body must be valid JSON."),
    };
  }
}
