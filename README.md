# TouchGrass

A social media platform built around **crowdsourced data** on local events and activities at USC. Discover what's happening on campus, join groups, and meet new people.

---

## About the Project

TouchGrass connects USC students and community members through shared interests and real-world activities. Users can:

- **Browse events & activities** — Find local happenings (hikes, study groups, sports, socials) shared by the community
- **Join groups** — Sign up for activities that match your interests
- **Meet new people** — Build connections through in-person events instead of endless scrolling

The platform is powered by user-contributed content: anyone can post events, and anyone can discover and join them.

---

## Project Structure

| Directory              | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| [`client/`](./client/) | Frontend UI (React + Vite) — runs at `http://localhost:5174` (see `client/vite.config.js`) |
| [`server/`](./server/) | Backend API (Node.js + Express) — runs at `http://localhost:5001` |

---

## Documentation

| Guide | Description |
| ----- | ----------- |
| [**Multi-agent collaboration**](./docs/AGENT_COLLABORATION.md) | Rules for AI/human contributors: ground truth, avoiding duplicate code, DB workflow, parallel git hygiene |
| [**UI / UX overview**](./docs/UI_UX.md) | Screen map, layout, design patterns, and where features live in the frontend |
| [**Frontend session & auth**](./docs/FRONTEND_SESSION_AND_AUTH.md) | Session context, route guards (`RequireAuth`), and how to connect real backend auth and API middleware |
| [**Gitflow**](./docs/Gitflow.md) | Branching model; links to the full workflow doc |
| [**GitHub workflow**](./docs/GITHUB_WORKFLOW.md) | Pushes, PRs, and collaboration on GitHub |
| [**Docker**](./docs/Docker-readme.md) | Running the stack with Docker |
| [**Client (frontend)**](./client/README.md) | Dev commands, Tailwind palette, client file structure |

---

## Getting Started

1. **Backend:** `cd server && npm install && npm start`
2. **Frontend:** `cd client && npm install && npm run dev`
3. Open [http://localhost:5174](http://localhost:5174) in your browser

The Vite dev server proxies `/api` to the Express API on **port 5001**, so the client can call `/api/...` without hardcoding the backend URL. Optional: set `VITE_API_BASE` if you need an absolute API origin.

See each directory's README for more details.

---

## Git Workflow

For contribution guidelines, branching, and how to push code to GitHub, see:

**[Gitflow](./docs/Gitflow.md)** — links to the full [GitHub Workflow Guide](./docs/GITHUB_WORKFLOW.md)
