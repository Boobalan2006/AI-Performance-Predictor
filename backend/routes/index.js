/**
 * routes/index.js
 * ---------------
 * Central router — registers all API endpoints.
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/predictionController");

// Health check
router.get("/health", controller.health);

// Prediction
router.post("/predict", controller.predict);

// History
router.get("/history", controller.getHistory);
router.delete("/history", controller.clearHistory);

module.exports = router;
