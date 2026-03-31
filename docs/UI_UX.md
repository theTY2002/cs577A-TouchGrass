# TouchGrass — UI / UX overview

This document describes how the **frontend** is structured, where major features appear, and the ideas behind the experience. Implementation lives under [`client/`](../client/).

---

## Product direction

TouchGrass is a **campus-oriented event discovery** experience: large imagery, quick scanning, and light social cues (likes, joins, chat). The UI favors **clarity and warmth**—forest green and terracotta accents on soft paper/cream backgrounds—so content (photos, titles) stays primary.

---

## Global layout

| Layer | Role |
|--------|------|
| **`<Header />`** | Sticky top bar on most routes: logo (home → feed), feed filters (when applicable), account menu. Frosted backdrop and subtle border/shadow. |
| **`<main />`** | Flexible column; each route renders its page here. |
| **Full-bleed auth** | Login and signup **hide** the header for a focused, marketing-style split layout. |

Shell code: [`client/src/App.jsx`](../client/src/App.jsx).

---

## Routes (where each screen lives)

| Path | Page | Who sees it |
|------|------|-------------|
| `/` | Redirect | → `/feed` if logged in, else `/login`. |
| `/feed` | Discover feed | **Auth required** (`RequireAuth`); otherwise redirect to login. |
| `/event/new` | Create event | Open form for a new plan. |
| `/event/:id` | Event details | Hero image, info, about/members, chat (rules below). |
| `/event/:id/edit` | Edit event | Same form as create, prefilled for events the user owns locally. |
| `/login` | Login | Split layout; placeholder client-side auth. |
| `/signup` | Sign up | Registration flow; can pass state back to login. |
| `/settings` | Account settings | Profile fields, avatar, local persistence. |
| `/help` | Help & support | Structured FAQ-style sections. |

---

## Screen-by-screen

### Feed (`/feed`)

- **Hero** — Full-width image and headline; sets the tone for “discover plans.”
- **Filters** — Tag pills, date, “my plans,” clear. On **desktop (md+)**, when the user scrolls past the hero, filters **dock into the header** (IntersectionObserver + [`FeedFiltersContext`](../client/src/tools/context/FeedFiltersContext.jsx)) so filtering stays available without scrolling back up.
- **Mobile filters** — Same controls in a **sheet/menu** from the header (not docked in the bar).
- **Event grid** — `EventCard` tiles: image-first, like/join actions, navigation to details.
- **FAB** — Floating **create** control (bottom-right, safe-area aware) → create event flow.

State and ideas: feed data comes from the **API** (paginated via [`client/src/tools/api.js`](../client/src/tools/api.js)); **join** state for the current user is tracked in **session** (`useSession`) and stays in sync between feed and event details.

### Event details (`/event/:id`)

- **Cinematic hero** — Tall image band with title and primary actions (back, share-style affordances, edit for hosts).
- **Info column** — `EventInfoCard`: time, place, capacity-style metadata.
- **About / members** — `AboutCard`, `MembersCard` support context and social proof.
- **Chat** — `ChatPanel`: on **large screens** chat is **inline** beside content; on **small screens** it opens as a **popup** with a floating action to toggle. **Joining** (or being the organizer) **unlocks** chat.

Missing ids show a calm **not found** state with return to feed.

### Create / edit event (`/event/new`, `/event/:id/edit`)

- Long-form, sectioned layout: title, tags, schedule, location (`LocationAutocomplete`), description, image, etc.
- **Close** control returns without forcing a specific server round-trip (local save flow).
- Submit uses the shared **forest CTA** styling (`shadow-fab` family) for consistency with other primary actions.

### Login & signup (`/login`, `/signup`)

- **Split screen**: brand/hero side + form side; distinct from the main app chrome (no global header).
- Auth uses **API-backed session** ([`client/src/tools/cache/SessionContext.jsx`](../client/src/tools/cache/SessionContext.jsx), `RequireAuth`); see [**Frontend session & auth**](./FRONTEND_SESSION_AND_AUTH.md).

### Settings (`/settings`)

- Single scrollable **account** surface: name, bio-style fields, **avatar** upload (resized client-side), preferences.
- Data persists **locally** (`client/src/tools/context/profileSettingsStorage.js` + `ProfileSettingsContext.jsx`) until a profile API exists.

### Help (`/help`)

- Centered, card-based **support** content: sections with icons, short copy, links where relevant. Matches brand greens and soft shadows.

---

## Header & navigation

- **Logo** → `/feed` (when authenticated, feed is home).
- **User menu** (avatar or initials): **Settings**, **Help & support**, **Sign out** when logged in; **Log in** / **Sign up** / **Help** when not.
- **Feed-only**: filter integration as described above; menu closes on route change or outside click / Escape.

[`client/src/components/Header.jsx`](../client/src/components/Header.jsx)

---

## Design system (high level)

| Token / pattern | Typical use |
|-----------------|-------------|
| **`brand-forest`** | Primary actions, key text, focus rings. |
| **`brand-terracotta`** | Accents, secondary highlights. |
| **`bg-page` / paper / white** | Surfaces and cards. |
| **`shadow-card` / `shadow-fab`** | Elevation for cards and primary circular actions. |
| **`rounded-2xl` / pills** | Modern, friendly corners; filter chips as **story-like pills**. |

Source of truth: [`client/tailwind.config.js`](../client/tailwind.config.js), [`client/src/index.css`](../client/src/index.css).

---

## Key React modules (map to UI)

| Area | Files (indicative) |
|------|---------------------|
| Routing & shell | `App.jsx` |
| Feed composition | `pages/Feed.jsx`, `components/Hero.jsx`, `components/Filters.jsx`, `components/EventCard.jsx`, `components/FAB.jsx` |
| Filter state | `tools/context/FeedFiltersContext.jsx` |
| Event detail layout | `pages/EventDetails.jsx`, `EventInfoCard.jsx`, `ChatPanel.jsx`, `AboutCard.jsx`, `MembersCard.jsx` |
| Forms | `pages/CreateEvent.jsx`, `components/LocationAutocomplete.jsx` |
| Profile | `pages/Settings.jsx`, `tools/context/ProfileSettingsContext.jsx`, `tools/context/profileSettingsStorage.js` |
| Auth session & route guards | `tools/cache/SessionContext.jsx` (`SessionProvider`, `RequireAuth`, `useSession`), `pages/Login.jsx`, `pages/Signup.jsx` — see [FRONTEND_SESSION_AND_AUTH.md](./FRONTEND_SESSION_AND_AUTH.md) |
| API client | `tools/api.js` |

---

## Accessibility & feedback (intentional UX)

- Buttons and icon-only controls use **`aria-label`** / **`title`** where text is not visible.
- **Focus-visible** rings align with **brand-forest** for keyboard users.
- **Motion**: card entrance animations and filter dock transitions respect reduced-motion where configured in CSS.

---

## Related documentation

| Document | Topic |
|----------|--------|
| [Gitflow.md](./Gitflow.md) | Branching and contribution flow |
| [GITHUB_WORKFLOW.md](./GITHUB_WORKFLOW.md) | GitHub workflow details |
| [Docker-readme.md](./Docker-readme.md) | Container usage |
| [Client README](../client/README.md) | Dev commands, palette, client file map |

For backend API and ports, see the repository root [README](../README.md) and [`server/README.md`](../server/README.md).
