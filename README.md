# Ask Me

Ask Me is a local hackathon application for asking grounded questions about professional work, projects, demos, and technical interests. It provides a public question-and-answer experience at `/` and a protected single-administrator knowledge workspace at `/admin`.

All included professional knowledge is labeled sample portfolio content. Replace it with reviewed material before presenting it as factual biography.

## Stack

- Next.js 16 App Router, React, and TypeScript
- Official TypeScript Codex SDK for local, server-side inference
- Seed-backed process-local knowledge store
- HMAC-signed, HttpOnly single-admin session cookie
- Deterministic token-overlap retrieval

## Runtime architecture

```text
Local browser
  → POST /api/ask
  → getPublishedKnowledge()
  → deterministic retrieval (maximum 3 entries)
  → bounded context (maximum 6,000 characters)
  → local Codex SDK thread
  → grounded answer + published source titles

Authenticated admin
  → /admin and /api/admin/*
  → getAllKnowledgeForAdmin()
  → create / edit / publish / unpublish / delete
```

The public path starts with `getPublishedKnowledge()`. Retrieval checks publication state again, and the context builder performs a third publication check. Codex receives only that bounded context and the visitor's question. There is no public knowledge-list endpoint.

Codex runs from an isolated temporary working directory with a read-only sandbox, no approval prompts, disabled web/network access for tools, and no configured MCP servers. The prompt prohibits tools and external sources; the application rejects any turn that reports command, file, MCP, or web-search activity.

Outlook is intentionally absent. Future Outlook ingestion belongs behind authenticated private/admin services, and imported material must remain unpublished until deliberately reviewed and published.

## Local prerequisites

- Node.js 18 or later
- npm
- A working local Codex login on the demo machine

Verify authentication before the demo:

```bash
codex --version
codex login status
```

If needed, run `codex login` and complete the ChatGPT/Codex browser login. The application reuses local Codex authentication; do not copy authentication tokens into `.env.local`.

## Canonical demo startup

```bash
git clone https://github.com/polaniarm/AIM-Hackathon.git
cd AIM-Hackathon
npm install
cp .env.example .env.local
# Replace ASK_ME_ADMIN_SECRET with a random value of at least 16 characters.
npm run build
npm start
```

Open:

- Public Ask Me: `http://localhost:3000`
- Private admin: `http://localhost:3000/admin`

Keep the Node process running for the whole demo. Restarting it restores the seeded knowledge and discards admin mutations.

## Environment

The only required application environment variable is:

```text
ASK_ME_ADMIN_SECRET   Random single-admin secret, minimum 16 characters
```

Codex is the default inference mode and uses the machine's local Codex authentication. Automated tests explicitly set `ASK_ME_INFERENCE_MODE=mock`; mock answers are visibly labeled and the application never silently falls back to them.

## Knowledge, retrieval, and persistence

Each entry has an ID, title, content, source type, publication state, and creation/update timestamps. Five sample entries are published and one sentinel entry is unpublished.

Retrieval lowercases and tokenizes text, removes common words, performs small plural/verb stemming, weights title overlap above content overlap, and returns at most three published entries. An unrelated question returns the insufficient-information response before inference.

Admin mutations remain in the single Node process for its lifetime. They reset on restart. This behavior is intentional for the local Phase 0 demo and is prominently disclosed in `/admin`.

## Admin authentication

`/admin` redirects anonymous visitors to `/admin/login`. A correct server-side secret creates an eight-hour HMAC-SHA256-signed, HttpOnly, SameSite=Strict cookie. Every admin API verifies its signature and expiry independently. Logout clears the effective browser cookie.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Tests use explicit deterministic mock inference and do not consume a live Codex turn. The local demo uses Codex by default.

## Troubleshooting

- `502 answer_failed`: run `codex login status`, confirm local authentication, and confirm the demo machine can reach Codex.
- Codex timeout: retry once and confirm no other long-running Codex task is consuming the local session.
- Admin access disabled: set `ASK_ME_ADMIN_SECRET` to at least 16 characters and restart the app.
- Admin changes disappeared: the process restarted; this is expected process-local behavior.
- Mock badge visible during a demo: remove `ASK_ME_INFERENCE_MODE=mock` and restart so the default Codex mode is used.

## Known Phase 0 limitations

- Admin mutations are process-local and non-durable.
- Knowledge is sample content, not verified biography.
- Authentication is intentionally single-admin and secret-based.
- No rate limiting, conversation history, analytics, document ingestion, Outlook integration, embeddings, or vector search exists.
- Codex is used as a bounded local inference step, not as an autonomous tool-using agent.
