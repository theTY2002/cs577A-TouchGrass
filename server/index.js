const express = require("express");
const app = express();
const PORT = process.env.PORT || 3001;

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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
