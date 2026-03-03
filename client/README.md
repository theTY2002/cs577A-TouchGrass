# Client — UI & Frontend

The `client` directory is where all **UI and frontend code** for the TouchGrass application lives. This is where you build the interface users see and interact with in the browser.

---

## Running the Client Locally

### Prerequisites

- [Node.js](https://nodejs.org/) installed (v18+ recommended)

### Steps

1. **Navigate to the client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in your browser:**
   ```
   http://localhost:3000
   ```

The dev server supports hot module replacement (HMR)—changes to your code will appear in the browser without a full refresh.

---

## Project Structure

| File/Folder     | Purpose                                           |
|-----------------|---------------------------------------------------|
| `src/`          | Source code (components, styles, assets)          |
| `src/App.jsx`   | Main app component                                |
| `src/main.jsx`  | Entry point that mounts the app to the DOM        |
| `src/index.css` | Global styles                                     |
| `public/`       | Static assets (favicon, etc.)                     |
| `index.html`    | HTML template—root of the single-page app         |
| `vite.config.js`| Vite configuration (port 3000, plugins, etc.)     |

---

## Available Scripts

| Command       | Description                                |
|---------------|--------------------------------------------|
| `npm run dev` | Start dev server at http://localhost:3000  |
| `npm run build` | Build for production                    |
| `npm run preview` | Preview the production build locally  |
| `npm run lint` | Run ESLint                               |

---

## Working with the Backend

- **Client** runs at `http://localhost:3000` (this UI)
- **Server** runs at `http://localhost:3001` (API)

To call the API from your React components, use `http://localhost:3001` as the base URL, for example:

```javascript
fetch('http://localhost:3001/api/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

Run both the client and server in separate terminals when developing full-stack features.
