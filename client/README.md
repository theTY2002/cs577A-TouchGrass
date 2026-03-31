# Client — TouchGrass UI

Campus events discovery UI. Photo-forward, social, Instagram-like. React + Vite + Tailwind.

---

## Quick Start

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5000**.

For a **route-by-route UI/UX walkthrough** (screens, header behavior, design tokens), see [**docs/UI_UX.md**](../docs/UI_UX.md).

For **signed-in state, protected routes, and wiring a real backend** (session context vs Express middleware, `/api/me` bootstrap, login/logout), see [**docs/FRONTEND_SESSION_AND_AUTH.md**](../docs/FRONTEND_SESSION_AND_AUTH.md).

---

## Session and route guards

The app uses a **frontend session layer** (not server middleware):

- **`SessionProvider`** and **`useSession()`** — in-memory sign-in flag, a small user snapshot, and UI state such as which events the user has joined (`client/src/SessionContext.jsx`).
- **`RequireAuth`** — wraps routes that should only appear for signed-in users; anonymous visitors are redirected to `/login` with a return path.

Auth secrets are **not** stored in `localStorage`. Refresh clears the simulated session.

When you add a backend, keep **`useSession` / `RequireAuth`** as the UI boundary and hydrate session from **`GET /api/me`** (or equivalent) after cookie-based login; protect JSON routes with **Express middleware** on the server. Full steps are in [**docs/FRONTEND_SESSION_AND_AUTH.md**](../docs/FRONTEND_SESSION_AND_AUTH.md).

---

## Commands

| Command         | Description                      |
|-----------------|----------------------------------|
| `npm run dev`   | Dev server (port 5000)           |
| `npm run build` | Production build                 |
| `npm run preview` | Preview production build       |
| `npm run lint`  | ESLint                           |

---

## Customizing Palette

**`tailwind.config.js`** — theme colors:
- `brand-forest`: #748873
- `brand-terracotta`: #D1A980
- `bg-paper`: #E5E0D8
- `bg-white`: #F8F8F8

**`src/index.css`** — `:root` CSS variables and `--hero-overlay`:
```css
:root {
  --brand-forest: #748873;
  --brand-terracotta: #D1A980;
  --bg-paper: #E5E0D8;
  --bg-white: #F8F8F8;
  --hero-overlay: linear-gradient(90deg, rgba(116,136,115,0.42), rgba(209,169,128,0.22));
}
```

---

## Swapping Images

**Hero** — Edit `src/components/Hero.jsx`:
```js
const HERO_IMAGE = 'https://your-image-url.jpg';
```

**Card images** — Edit `src/data/events.js`. Each event has `imageUrl`. Use Unsplash, e.g.:
```js
imageUrl: `https://images.unsplash.com/photo-ID?w=600&q=80`
```

---

## Project Structure

| File/Folder           | Purpose                               |
|-----------------------|---------------------------------------|
| `src/App.jsx`         | Routes and `RequireAuth`-wrapped pages |
| `src/SessionContext.jsx` | In-memory session, `useSession`, `RequireAuth` |
| `src/components/Header.jsx` | Sticky header                     |
| `src/components/Hero.jsx`   | Full-bleed photo hero            |
| `src/components/Filters.jsx` | Story-like pills, date, My Event |
| `src/components/EventCard.jsx` | Image-first cards, likes, avatars |
| `src/components/FAB.jsx` | Floating create button             |
| `src/data/events.js`  | Mock events (imageUrl, likes, etc.)   |
| `tailwind.config.js`  | Tailwind theme, colors, shadows       |
| `src/index.css`       | Base styles, animations, font import  |

---

## Features

- **Filtering**: Category pills (toggle on/off), date picker, clear
- **Like**: Toggle like on cards, increments/decrements count
- **Join**: Join events, shows "✓ Joined"
- **Animations**: Staggered card entrance, heart pop on like, hover lift
- **Accessibility**: aria-labels, keyboard focus, lazy images

---

## Backend

Server runs at http://localhost:5001. Run client and server in separate terminals for full-stack dev.
