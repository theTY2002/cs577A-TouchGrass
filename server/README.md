# Server Directory — Backend Code

The `server` directory is where **all backend code** for the TouchGrass application lives. This includes the API, business logic, database access, and anything that runs on the server (as opposed to the browser or mobile app).

---

## Running the Node.js Server Locally

### Prerequisites

- [Node.js](https://nodejs.org/) installed (v18+ recommended)

### Steps

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   Or directly:
   ```bash
   node index.js
   ```

4. **Confirm it's running** — you should see:
   ```
   Server running at http://localhost:3001
   ```

5. **Test it** — open a browser or use `curl`:
   ```bash
   curl http://localhost:3001
   ```

---

## How the Node.js Server Works

### 1. **Entry point: `index.js`**

`index.js` is the main file that starts the server. It:

- Imports Express (the web framework)
- Creates an app
- Defines routes (URLs and what they do)
- Starts listening on a port (default 3000)

### 2. **Express framework**

Express handles HTTP requests and responses. When a client (browser, mobile app, etc.) sends a request to a URL, Express matches it to a route and runs the matching handler.

### 3. **Request flow**

```
Client request  →  Express  →  Route handler  →  Response sent back
     GET /            →        app.get('/', ...)   →   "TouchGrass API is running"
```

### 4. **Port and localhost**

- **Port 3000** — The server listens on port 3000 by default. You can change it with the `PORT` environment variable.
- **localhost** — On your machine, `localhost` (or `127.0.0.1`) points to your own computer, so `http://localhost:3000` means “the app running on this machine, port 3000.”

### 5. **Project layout (typical for this directory)**

| File/Folder    | Purpose                                      |
|----------------|----------------------------------------------|
| `index.js`     | Main entry point, starts the server          |
| `package.json` | Dependencies and npm scripts                 |
| `routes/`      | Route definitions (as the app grows)         |
| `controllers/` | Request handling logic                       |
| `models/`      | Data structures and database logic           |
| `middleware/`  | Shared logic (auth, logging, etc.)           |

You can add these folders as the backend grows.

---

## Adding More Backend Code

As you add features, put them here:

- **New API endpoints** — Define routes in `index.js` or in separate route files
- **Database code** — Models, queries, migrations
- **Business logic** — Validation, calculations, orchestration
- **External services** — Email, storage, third‑party APIs

Keeping all of this in `server` keeps the backend organized and separated from frontend code.
