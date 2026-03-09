const express = require("express");
const app = express();
const PORT = process.env.PORT || 5001;

// CORS: allow frontend (localhost:5000) to call API
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Middleware: allows the API to parse JSON in request bodies
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.send("TouchGrass API is running");
});

// Example API endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is healthy" });
});

// Auth: login (placeholder - always succeeds for now)
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  // Placeholder: accept any email/password
  res.json({
    ok: true,
    user: { id: 1, email },
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
