# Frontend session, route guards, and backend integration

This document describes how TouchGrass handles **signed-in state and protected routes** in the React client. It also explains how that relates to **backend middleware** when you add a real API.

---

## What this is (and what it is not)

### In the React app: session context and route guards

The client does **not** use Express-style “middleware” in the Node sense. Instead it uses two cooperating patterns:

| Piece | Role |
|--------|------|
| **`SessionProvider`** | React Context: **`signedIn`**, **`sessionReady`**, a **user** snapshot from the API (`id`, `email`, display fields), **joined event ids** for UI, optional **UI preferences**, and auth actions. |
| **`RequireAuth`** | A **route guard**: a wrapper component that checks `signedIn` from the session. If the user is not signed in, it renders a redirect to `/login` and passes `state.from` so login can return them to the page they tried to open. |
| **`useSession()`** | Hook for session data and **`signIn`**, **`signOut`**, **`joinEvent`**, **`leaveEvent`**, **`toggleEventMembership`**, **`isJoinedToEvent`**, **`updateSessionUser`**, **`setUiPreference`**. |

Implementation: [`client/src/tools/cache/SessionContext.jsx`](../client/src/tools/cache/SessionContext.jsx). The provider is mounted in [`client/src/main.jsx`](../client/src/main.jsx) **inside** `BrowserRouter` so guards can use routing hooks.

**Auth today:** login/signup call the Express API (`loginWithApi` / `signup` in [`client/src/tools/api.js`](../client/src/tools/api.js)). A **Bearer token** is stored in `localStorage` (`touchgrass_session_token`). On load, the provider calls **`GET /api/auth/me`** with that token to restore the user. Passwords are not stored client-side. For product-facing UX notes, see [UI / UX overview](./UI_UX.md).

**Dev URLs:** the Vite app runs at **`http://localhost:5174`**; `/api` is proxied to **`http://localhost:5001`** (see [`client/vite.config.js`](../client/vite.config.js)).

### On the server: middleware

The Express app uses **middleware** (for example `Authorization: Bearer` validation) on protected JSON routes. The React **`RequireAuth`** guard only affects what the **browser** shows; **every sensitive API route must still be protected on the server**.

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
- **`user`** — `null` or `{ id?, email, displayName?, username? }` (from API / `signIn`).
- **`joinedEventIds`** — string ids the current user has “joined” for UI (unlocks chat where required).
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

On app startup, `SessionProvider` reads the stored token and calls **`GET /api/auth/me`** with an **`Authorization: Bearer`** header. If the user is returned, session state is set; if not, `signedIn` stays false. Cookie-only sessions would use **`fetch(..., { credentials: 'include' })`** instead; this repo uses the Bearer header from [`client/src/tools/api.js`](../client/src/tools/api.js).

### 4. Wire the login form to the API

In [`client/src/pages/Login.jsx`](../client/src/pages/Login.jsx), replace the simulated delay with:

- `POST /api/auth/login` with `{ email, password }`.
- On success: the API returns a token; the client stores it and **`signIn`** hydrates from the login response (see `SessionContext.jsx`).

Keep **`Navigate`** / `state.from` behavior so deep links keep working.

### 5. Wire sign-out

In [`client/src/components/Header.jsx`](../client/src/components/Header.jsx), **`signOut`** should:

- Call **`POST /api/auth/logout`** with credentials.
- Clear client state and token (see `signOut` / `logoutWithApi` in `SessionContext.jsx` and `api.js`).

### 6. Join / leave events

**Join** calls **`POST /api/events/:id/join`** with the current user id; the client also updates **`joinEvent(id)`** in session state for immediate UI. Chat remains locked until joined (or organizer), per `useSession`.

### 7. `fetch` / API client

Centralize API calls in [`client/src/tools/api.js`](../client/src/tools/api.js). In development, **`API_BASE`** is empty so requests go to **`/api/...`** on the Vite origin (**5174**); Vite proxies **`/api`** to the Express server (**5001**). Set **`VITE_API_BASE`** for an absolute API URL in other environments. Auth uses the **`Authorization: Bearer`** header when a token is present.

---

## Files to know

| File | Purpose |
|------|---------|
| [`client/src/tools/cache/SessionContext.jsx`](../client/src/tools/cache/SessionContext.jsx) | `SessionProvider`, `useSession`, `RequireAuth` |
| [`client/src/tools/api.js`](../client/src/tools/api.js) | Auth, feed, events, `fetch` helpers |
| [`client/src/main.jsx`](../client/src/main.jsx) | Provider order: `SessionProvider` → … |
| [`client/src/App.jsx`](../client/src/App.jsx) | Which routes use `RequireAuth` |
| [`client/src/pages/Login.jsx`](../client/src/pages/Login.jsx) | Login → API |
| [`client/src/components/Header.jsx`](../client/src/components/Header.jsx) | Sign out |

---

## Summary

- **Client “middleware”** here means **session context + `RequireAuth` route guards**, not Express middleware.
- **Server middleware** is where **real authentication** must be enforced for APIs.
- **`SessionProvider` / `useSession`** integrate with **`/api/auth/me`**, login/logout endpoints, and event APIs without rewriting the whole UI.
