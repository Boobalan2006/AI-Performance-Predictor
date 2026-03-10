/**
 * server.js  —  Express.js Backend API (port 3001)
 * --------------------------------------------------
 * Responsibilities:
 *   - Validate user inputs
 *   - Forward validated requests to the Python ML service
 *   - Store prediction history in memory
 *   - Expose: POST /predict, GET /history, GET /health
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());                         // Allow browser / frontend requests
app.use(express.json());                 // Parse JSON bodies
app.use(morgan("dev"));                  // Request logging (method, url, status, time)

// ── Serve Frontend Static Files ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/", routes);

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global Error Handler ────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[Server Error]", err.message || err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error."
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Backend running on http://localhost:${PORT}`);
  console.log(`[Server] ML Service expected at http://localhost:5001`);
});
