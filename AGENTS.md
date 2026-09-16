# Ask Me agent guidance

- Keep this repository a single Next.js App Router application using TypeScript.
- Keep public UI and public APIs separate from admin UI and private ingestion code.
- The public runtime must never query Outlook or another private source directly.
- Only published knowledge may enter public retrieval or model context.
- Private-source ingestion belongs exclusively on the admin/private side of the architecture.
- Keep secrets in server-only environment variables; never use `NEXT_PUBLIC_` for credentials.
- Prefer small, typed modules and the lowest practical dependency count.
- Preserve the structural `getPublishedKnowledge()` boundary before public retrieval and context building.
- Protect every admin page, route handler, server action, and data access—not only the visible UI.
- Keep automated tests in explicit mock LLM mode; never require an external API call in CI.
- Never silently fall back from a configured real provider to mock behavior; mock mode must remain visible.
- Treat seed entries as sample content and keep the unpublished sentinel private.
- The current store is intentionally process-local and the admin UI must say so; replace it deliberately with shared durable storage before production mutation.
- Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` after relevant changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
