# Multi-agent collaboration — rules for AI assistants

This document is for **LLM agents and human reviewers** working on TouchGrass in parallel. The goal is to **reduce hallucinated APIs**, **duplicate implementations**, and **merge conflicts** by sharing the same constraints and sources of truth.

---

## 1. Ground truth (verify before you claim)

| Topic | Authoritative location | Rule |
|--------|-------------------------|------|
| **Database tables & columns** | [`SUPABASE_DATABASE_SCHEMA.md`](./SUPABASE_DATABASE_SCHEMA.md) | Do not invent table or column names. If the doc disagrees with live SQL, **the database / migrations win**—update the markdown after you confirm. |
| **HTTP API surface** | `server/index.js` (mounts), `server/routes/*.js` | List routes from code; do not assume REST paths that are not registered. |
| **Client → API calls** | [`client/src/tools/api.js`](../client/src/tools/api.js) | All browser `fetch` helpers for `/api/*` should live here unless there is a strong, documented exception. |
| **Session & auth flow** | [`FRONTEND_SESSION_AND_AUTH.md`](./FRONTEND_SESSION_AND_AUTH.md), `client/src/tools/cache/SessionContext.jsx` | One session model: Bearer token + `/api/auth/me`. Do not reintroduce a second “fake only” auth path without an explicit product decision. |
| **Ports & dev URLs** | Root [`README.md`](../README.md), [`client/vite.config.js`](../client/vite.config.js) | Client dev: **5174**. API: **5001**. Vite proxies **`/api`** to the server. |
| **Git & PR workflow** | [`Gitflow.md`](./Gitflow.md), [`GITHUB_WORKFLOW.md`](./GITHUB_WORKFLOW.md) | Feature branches, review before merge to `main`. |

**Anti-hallucination habit:** Before editing, **search the repo** (`grep`, file search, or read files) for existing names (components, routes, env vars). Prefer extending what exists over adding a parallel file with a slightly different name.

---

## 2. Minimize overlapping / duplicate code

### Single ownership

- **API client:** `client/src/tools/api.js` — add new endpoints here; avoid new `api-*.js` copies at the root of `src/`.
- **Auth:** `server/middleware/auth.js`, `server/routes/auth.js`, `server/auth/*` — do not add a second JWT/session scheme in another folder without a migration plan.
- **Feed logic:** `server/feed/*`, `server/routes/feed.js` — extend `feedService` / query spec rather than duplicating SQL in random route files.
- **DB access:** `server/db/pool.js` — use the shared pool; avoid opening ad-hoc connections per feature.

### Before adding a new file

1. **Grep** for the feature (e.g. `joinEvent`, `fetchFeed`, `password`).
2. If something exists, **change or wrap it** instead of cloning.
3. If you must split a module, **move shared bits** to a small util used by both callers—do not copy-paste 50 lines.

### Naming and layers

- Match **existing** naming (`camelCase` in JS, file names aligned with exports).
- **Server:** routes stay thin; heavy logic in `server/feed/`, `server/auth/`, etc.
- **Client:** pages in `pages/`; reusable UI in `components/`; cross-cutting helpers in `tools/`.

---

## 3. Database rules

1. **Schema doc is the narrative; SQL is the contract.** [`SUPABASE_DATABASE_SCHEMA.md`](./SUPABASE_DATABASE_SCHEMA.md) explains entities (`users`, `posts`, `groups`, `group_members`, chat tables, etc.). Queries in `server/` must use **real** column names from your DB (see `server/routes/events.js`, `server/feed/*` for current patterns).
2. **No silent renames** in application code without a migration and doc update.
3. **IDs:** Respect UUID vs integer conventions already in use; do not mix string `"1"` and numeric `1` for the same entity without an explicit conversion layer.
4. **New tables or columns:** Add to Supabase (or migration path), then **update** `SUPABASE_DATABASE_SCHEMA.md` in the same PR when the change is stable.

---

## 4. Workflow for parallel agents

### Branching

- Work on **`feature/<short-topic>`** (or team convention from [Gitflow](./Gitflow.md)).
- **Pull / merge `main` often** if others merge—reduces drift and duplicate work on the same files.

### Scope

- **One PR ≈ one coherent concern** (e.g. “feed filters”, “event join edge case”). Giant “misc fixes” PRs increase overlap and review load.
- If two agents must touch the same area, **sequence** via PR comments or split by file (e.g. one owns `Feed.jsx`, the other owns `feedService.js`).

### Conflict-prone files (coordinate or serialize)

- `client/src/tools/api.js`
- `client/src/App.jsx`, `client/src/main.jsx`
- `server/index.js`
- `server/routes/events.js`

When in doubt, **comment on the PR** or issue: “I will touch X; please avoid Y until merged.”

### Documentation

- **User-facing behavior** or **env vars:** update README or `client/README.md` in the same change.
- **Schema:** update `SUPABASE_DATABASE_SCHEMA.md` when the DB model changes.

---

## 5. Pre-submit checklist (agents)

Use this before opening or updating a PR:

- [ ] Searched for an existing implementation of the same behavior.
- [ ] API paths match `server/routes/*` and `server/index.js`.
- [ ] Client calls go through `tools/api.js` (or justified exception in PR description).
- [ ] DB fields match actual schema / existing queries; no invented columns.
- [ ] Ports and proxy behavior unchanged unless `vite.config.js` / README updated together.
- [ ] No stray `localhost:5000` for the Vite app (dev client is **5174** per README).
- [ ] Linter runs clean on touched files (`npm run lint` in `client/` when relevant).

---

## 6. When documentation and code disagree

**Code wins for runtime behavior.** Then:

1. Fix the code if it is wrong, **or**
2. Fix the docs in the **same** PR.

Do not leave [`SUPABASE_DATABASE_SCHEMA.md`](./SUPABASE_DATABASE_SCHEMA.md) or agent-facing docs permanently out of sync with production schema.

---

## 7. Related documents

| Document | Use |
|----------|-----|
| [SUPABASE_DATABASE_SCHEMA.md](./SUPABASE_DATABASE_SCHEMA.md) | Tables, relationships, field purposes |
| [FRONTEND_SESSION_AND_AUTH.md](./FRONTEND_SESSION_AND_AUTH.md) | Client auth, guards, API headers |
| [UI_UX.md](./UI_UX.md) | Screens, components map |
| [Gitflow.md](./Gitflow.md) / [GITHUB_WORKFLOW.md](./GITHUB_WORKFLOW.md) | Branches, push, PRs |

---

*Keep this file short and operational. If a rule becomes outdated after a refactor, update this document in the same change set.*
