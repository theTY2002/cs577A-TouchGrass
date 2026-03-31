# Frontend session, route guards, and backend integration

This document describes how TouchGrass handles **signed-in state and protected routes** in the React client. It also explains how that relates to **backend middleware** when you add a real API.

---

## What this is (and what it is not)

### In the React app: session context and route guards

The client does **not** use Express-style “middleware” in the Node sense. Instead it uses two cooperating patterns:

| Piece | Role |
|--------|------|
| **`SessionProvider`** | React Context that holds **in-memory** session state: whether the user is signed in, a small **user** snapshot (`email`, optional `displayName` / `username`), **joined event ids** for UI, and optional **UI preferences**. |
| **`RequireAuth`** | A **route guard**: a wrapper component that checks `signedIn` from the session. If the user is not signed in, it renders a redirect to `/login` and passes `state.from` so login can return them to the page they tried to open. |
| **`useSession()`** | Hook used by pages and components to read session data and call **`signIn`**, **`signOut`**, **`joinEvent`**, **`leaveEvent`**, **`toggleEventMembership`**, **`isJoinedToEvent`**, **`updateSessionUser`**, **`setUiPreference`**. |

Implementation: [`client/src/SessionContext.jsx`](../client/src/SessionContext.jsx). The provider is mounted in [`client/src/main.jsx`](../client/src/main.jsx) **inside** `BrowserRouter` so guards can use routing hooks.

This layer is intentionally **frontend-only** today: it simulates a session for UX (gated routes, join/chat behavior) **without** storing passwords or tokens in `localStorage`. Refresh clears in-memory session. For background on product-facing behavior, see [UI / UX overview](./UI_UX.md).

### On the server: real middleware (future)

When you add a backend, **middleware** usually means **Express (or similar) functions** that run on each request **before** your route handlers—for example to parse cookies, verify a JWT, attach `req.user`, or reject unauthenticated requests.

The React **`RequireAuth`** guard only affects what the **browser** shows. It does **not** secure your API. **Every sensitive API route must still be protected on the server** (middleware + session/JWT validation).

---

## How routing is gated today

Protected routes are wrapped in **`RequireAuth`** in [`client/src/App.jsx`](../client/src/App.jsx):

- `/feed`
- `/event/new`
- `/event/:id/edit`
- `/settings`

Public routes include `/login`, `/signup`, `/help`, and **`/event/:id`** (event details are viewable without signing in; **join** and **chat** still follow session rules in the UI).

The root path `/` redirects to `/feed` or `/login` based on `signedIn` (see `RootRedirect` in `App.jsx`).

---

## Session state shape (conceptual)

Roughly what `useSession()` exposes:

- **`signedIn`** — boolean.
- **`user`** — `null` or `{ email, displayName?, username? }` (minimal profile for UI; not a full server user model).
- **`joinedEventIds`** — string ids the current simulated user has “joined” (unlocks chat where the UI requires membership).
- **`uiPreferences`** — small key/value bag for frontend-only preferences (`setUiPreference`).
- **Actions** — `signIn`, `signOut`, `updateSessionUser`, `joinEvent`, `leaveEvent`, `toggleEventMembership`, `isJoinedToEvent`.

This shape is a **stable seam**: you can keep the same hook API and swap the **inside** of `SessionProvider` to load from an API or cookie-backed bootstrap without rewriting every screen.

---

## How to implement real backend auth (recommended direction)

Below is a practical sequence. Exact code depends on whether you use **cookies + server session**, **JWT in memory**, or a **BaaS**; the important part is **separating concerns**.

### 1. Secure the API with server middleware

Add Express middleware (or equivalent) that:

- Reads the **session cookie** or **Authorization** header.
- Validates the token or session store.
- Returns **401** for protected routes when invalid or missing.
- Optionally attaches **`req.user`** for handlers.

Example **conceptual** middleware (not copy-pasted from this repo’s server):

```js
// Pseudocode: protect JSON API routes
function requireApiAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/me', requireApiAuth, (req, res) => {
  res.json({ user: req.session.user });
});
```

Frontend **`RequireAuth`** and this **`requireApiAuth`** are **complementary**: the first improves UX; the second enforces security.

### 2. Login and logout endpoints

- **`POST /api/auth/login`** — validate credentials, create server session (or issue a short-lived token). Prefer **httpOnly, Secure, SameSite** cookies for session IDs over storing access tokens in `localStorage`.
- **`POST /api/auth/logout`** — destroy session / clear cookie.

On successful login, return a **safe** user payload (id, email, display name—no password hash, no refresh token in JSON if the cookie already carries the session).

### 3. Bootstrap the client session on load

On app startup (inside `SessionProvider` or a small child effect):

1. Call **`GET /api/me`** (or `/api/session`) **with credentials** (`fetch(..., { credentials: 'include' })`).
2. If **200**, call your existing **`signIn`-equivalent** (or set internal state) with the user fields from the response.
3. If **401**, leave `signedIn` false.

That replaces the purely local `signIn` used after the placeholder login form, while **`useSession()`** can stay the same for the rest of the app.

### 4. Wire the login form to the API

In [`client/src/pages/Login.jsx`](../client/src/pages/Login.jsx), replace the simulated delay with:

- `POST /api/auth/login` with `{ email, password }`.
- On success: either rely on **bootstrap** (`GET /api/me`) to populate session state, or pass the returned user into **`signIn({ ... })`** if the API returns a public profile (still no secrets in `localStorage`).

Keep **`Navigate`** / `state.from` behavior so deep links keep working.

### 5. Wire sign-out

In [`client/src/components/Header.jsx`](../client/src/components/Header.jsx), **`signOut`** should:

- Call **`POST /api/auth/logout`** with credentials.
- Clear client state (already done in `signOut` in `SessionContext.jsx`).

### 6. Join / leave events

Today, **membership** is simulated in memory. With a backend:

- **`POST /api/events/:id/join`** / **`DELETE`** (or similar) — server records membership; middleware ensures the user is authenticated.
- On success, update client state with **`joinEvent(id)`** / **`leaveEvent(id)`** or refetch **`GET /api/me`** / **`GET /api/events/:id/me`** so UI stays in sync.

Until then, the UI still demonstrates **locked chat until joined** using frontend state only.

### 7. `fetch` / API client

Centralize API calls (e.g. [`client/src/api.js`](../client/src/api.js)) with **`credentials: 'include'`** for cookie sessions. Handle **401** globally if you want to redirect to login from API failures (optional “API middleware” on the client—usually an interceptor).

---

## Files to know

| File | Purpose |
|------|---------|
| [`client/src/SessionContext.jsx`](../client/src/SessionContext.jsx) | `SessionProvider`, `useSession`, `RequireAuth` |
| [`client/src/main.jsx`](../client/src/main.jsx) | Provider order: `SessionProvider` → `ProfileSettingsProvider` → … |
| [`client/src/App.jsx`](../client/src/App.jsx) | Which routes use `RequireAuth` |
| [`client/src/pages/Login.jsx`](../client/src/pages/Login.jsx) | Entry point for replacing placeholder login with API |
| [`client/src/components/Header.jsx`](../client/src/components/Header.jsx) | Sign out |

---

## Summary

- **Client “middleware”** here means **session context + `RequireAuth` route guards**, not Express middleware.
- **Server middleware** is where **real authentication** must be enforced for APIs.
- **`SessionProvider` / `useSession`** are the stable integration surface: hydrate from **`/api/me`**, drive login/logout from auth endpoints, and later sync **join** state from event APIs—without rewriting the whole UI.
