# Ask Me

Ask Me is a Phase 0 web application for asking grounded questions about professional work, projects, demos, and technical interests. It includes a public question-and-answer experience and a protected single-administrator knowledge workspace.

All included professional knowledge is clearly labeled sample portfolio content. Replace it with reviewed material before presenting it as factual biography.

## Stack

- Next.js 16 App Router, React, and TypeScript
- Next.js Route Handlers for public and protected server APIs
- Direct OpenAI Responses API integration—no AI framework
- Seed-backed process-local knowledge store—no database
- HMAC-signed, HttpOnly single-admin session cookie
- Deterministic token-overlap retrieval

## Architecture and privacy boundary

```text
Public question
  → POST /api/ask
  → getPublishedKnowledge()
  → deterministic retrieval (maximum 3 entries)
  → bounded context (maximum 6,000 characters)
  → server-side OpenAI or explicit development mock
  → grounded answer + published source titles

Authenticated admin
  → /admin and /api/admin/*
  → getAllKnowledgeForAdmin()
  → create / edit / publish / unpublish / delete
```

The public answer path begins with `getPublishedKnowledge()` and there is no public endpoint for listing knowledge. Retrieval filters publication state again, and the bounded-context builder performs a third publication check. The seed includes one unpublished sentinel entry that tests this invariant end to end.

Outlook is intentionally absent. A future flow may ingest Outlook through a private admin process, curate that material, and explicitly publish selected knowledge. Public questions must never access Outlook or other private source systems directly.

## Knowledge model and storage

Each entry has an ID, title, content, source type, publication state, and creation/update timestamps. Five distinct sample entries are published; one private sample remains unpublished.

The knowledge store intentionally initializes from source-controlled seed data and holds admin mutations in process memory. This keeps the demo dependency-free and local CRUD reliable within one running server. Mutations reset when the server restarts and are not shared between serverless instances; the admin UI displays this limitation. Before production deployment, replace the repository implementation with a durable shared store without changing the public `getPublishedKnowledge()` boundary.

## Retrieval and answering

Retrieval lowercases, tokenizes, removes common words, applies very small plural/verb stemming, weights title overlap above content overlap, and returns at most three published entries. No embeddings or vector database are used. If nothing matches, the API returns an insufficient-knowledge response before any model call.

With `ASK_ME_LLM_MODE=openai`, the server calls the OpenAI Responses API using only the question and bounded published context and requests `store: false`. With `ASK_ME_LLM_MODE=mock`, it returns an explicitly labeled deterministic development answer. If mode is omitted, the server selects OpenAI only when a key exists; provider failures never silently fall back to mock and public errors omit provider details. Invalid mode values fail closed. Automated tests explicitly use mock mode and never call an external model.

## Admin authentication

`/admin` redirects anonymous visitors to `/admin/login`. A correct `ASK_ME_ADMIN_SECRET` of at least 16 characters creates an eight-hour HMAC-SHA256-signed, HttpOnly, SameSite=Strict cookie. The cookie is `Secure` in production and cleared on logout. Every admin knowledge API independently verifies its signature and expiration; hiding the UI is not treated as authorization. Use HTTPS in deployment and choose a long random secret.

## Environment

```bash
cp .env.example .env.local
```

```text
OPENAI_API_KEY        Server-side OpenAI credential; never NEXT_PUBLIC_
OPENAI_MODEL          Model ID; defaults to gpt-5-mini
ASK_ME_LLM_MODE       openai or mock
ASK_ME_ADMIN_SECRET   Long random single-admin secret
```

Do not commit `.env.local` or real credentials.

## Run and verify

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for Ask Me and `http://localhost:3000/admin` for administration.

For a production-mode local run:

```bash
npm run build
npm run start
```

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Deployment

The application is ready for a standard Next.js deployment. Vercel requires no repository-specific adapter:

```bash
npx vercel
npx vercel --prod
```

Configure `ASK_ME_ADMIN_SECRET`, `ASK_ME_LLM_MODE=openai`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL` as server-side environment variables in the deployment project. Do not expose them with `NEXT_PUBLIC_` names.

Vercel is suitable for the seeded public experience, but process-local admin mutations can reset or differ between serverless instances. For a mutation-focused live demo, use one long-lived Node instance, run `npm run build` followed by `npm run start`, and keep that instance alive for the session. This preserves the intentionally database-free Phase 0 architecture.

Phase 1 should add Outlook ingestion only behind authenticated private/admin services. Ingested records must be curated into the existing knowledge model and explicitly published before the public answering path can retrieve them.

## Phase 0 limitations

- Admin mutations are process-local and non-durable.
- Sample knowledge is placeholder content, not verified biography.
- Authentication is intentionally single-admin and secret-based.
- No rate limiting, conversation history, analytics, document ingestion, Outlook integration, embeddings, or vector search exists.
- The UI supports one question and answer at a time.
