/**
 * services/predictionService.js
 * ------------------------------
 * Business logic layer:
 *   - Calls the Python ML service via HTTP
 *   - Manages in-memory prediction history
 */

const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

// ── In-memory history store ────────────────────────────────────────────────────
let history = [];

/**
 * Send validated data to the Python ML service and get a prediction.
 * @param {{ age, experience, skillScore, educationLevel }} inputData
 * @returns {Promise<Object>} ML response enriched with a timestamp
 */
async function predict(inputData) {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/ml/predict`, inputData, {
            timeout: 10000  // 10-second timeout
        });

        const mlResult = response.data;

        // Build the history entry
        const entry = {
            id: history.length + 1,
            timestamp: new Date().toISOString(),
            input: inputData,
            prediction: mlResult.prediction,
            confidence: mlResult.confidence,
            probabilities: mlResult.probabilities,
            model_used: mlResult.model || "Logistic Regression",
            accuracy: mlResult.accuracy
        };

        history.push(entry);

        return entry;

    } catch (err) {
        if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
            throw {
                status: 503,
                message: "ML service is unavailable. Please start the Python ML service on port 5001."
            };
        }
        if (err.response) {
            // ML service returned an error response
            throw {
                status: err.response.status,
                message: err.response.data?.error || "ML service returned an error."
            };
        }
        throw {
            status: 500,
            message: `Unexpected error communicating with ML service: ${err.message}`
        };
    }
}

/**
 * Return full prediction history.
 * @returns {Array}
 */
function getHistory() {
    return [...history].reverse(); // newest first
}

/**
 * Clear all prediction history.
 */
function clearHistory() {
    history = [];
}

module.exports = { predict, getHistory, clearHistory };
