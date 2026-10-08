# AI Agent Directives & Universal Project Brain

All AI agents working on this project must inspect and adhere to the project governance files before performing work:

- **AI Directives & Rules:** [`ai/instructions.md`](./ai/instructions.md)
- **Architectural Decision Record:** [`ai/decisions.md`](./ai/decisions.md)
- **Known Issues & Technical Debt:** [`ai/known-issues.md`](./ai/known-issues.md)
- **Current System State:** [`ai/current-state.md`](./ai/current-state.md)
- **API Reference & Contracts:** [`api/endpoints.md`](./api/endpoints.md), [`api/contracts.md`](./api/contracts.md), [`api/errors.md`](./api/errors.md)

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
