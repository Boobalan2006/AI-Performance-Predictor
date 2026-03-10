/**
 * controllers/predictionController.js
 * -------------------------------------
 * Handles HTTP request/response for all API endpoints.
 * Validates inputs, delegates to service layer, returns structured JSON.
 */

const service = require("../services/predictionService");

// Allowed education level values
const VALID_EDUCATION = ["High School", "Bachelor", "Master", "PhD"];

// ── GET /health ────────────────────────────────────────────────────────────────

exports.health = (req, res) => {
    res.json({
        status: "ok",
        service: "AI Prediction Backend",
        time: new Date().toISOString()
    });
};

// ── POST /predict ──────────────────────────────────────────────────────────────

exports.predict = async (req, res, next) => {
    try {
        const { age, experience, skillScore, educationLevel } = req.body;

        // ── Field presence check ─────────────────────────────────────────────────
        const missing = [];
        if (age === undefined || age === "") missing.push("age");
        if (experience === undefined || experience === "") missing.push("experience");
        if (skillScore === undefined || skillScore === "") missing.push("skillScore");
        if (educationLevel === undefined || educationLevel === "") missing.push("educationLevel");

        if (missing.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missing.join(", ")}.`
            });
        }

        // ── Type coercion ────────────────────────────────────────────────────────
        const ageNum = Number(age);
        const expNum = Number(experience);
        const skillNum = Number(skillScore);
        const eduStr = String(educationLevel).trim();

        // ── Range validation ─────────────────────────────────────────────────────
        const errors = [];

        if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
            errors.push("Age must be a number between 1 and 100.");
        }
        if (isNaN(expNum) || expNum < 0 || expNum > 60) {
            errors.push("Experience must be a number between 0 and 60.");
        }
        if (isNaN(skillNum) || skillNum < 0 || skillNum > 100) {
            errors.push("Skill Score must be a number between 0 and 100.");
        }
        if (!VALID_EDUCATION.includes(eduStr)) {
            errors.push(`Education Level must be one of: ${VALID_EDUCATION.join(", ")}.`);
        }

        if (errors.length > 0) {
            return res.status(422).json({ error: errors.join(" ") });
        }

        // ── Call ML service ──────────────────────────────────────────────────────
        const result = await service.predict({
            age: ageNum,
            experience: expNum,
            skillScore: skillNum,
            educationLevel: eduStr
        });

        // ── Structured response (matches the spec) ───────────────────────────────
        return res.json({
            prediction: `${result.prediction} Performance`,
            confidence: parseFloat((result.confidence * 100).toFixed(1)),
            model_used: result.model_used,
            probabilities: {
                High: parseFloat(((result.probabilities?.High || 0) * 100).toFixed(1)),
                Medium: parseFloat(((result.probabilities?.Medium || 0) * 100).toFixed(1)),
                Low: parseFloat(((result.probabilities?.Low || 0) * 100).toFixed(1))
            },
            model_accuracy: result.accuracy,
            timestamp: result.timestamp,
            id: result.id
        });

    } catch (err) {
        // Structured errors from service layer
        if (err.status && err.message) {
            return res.status(err.status).json({ error: err.message });
        }
        next(err);
    }
};

// ── GET /history ───────────────────────────────────────────────────────────────

exports.getHistory = (req, res) => {
    const history = service.getHistory();
    // Shape history for API consumers
    const formatted = history.map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        age: entry.input.age,
        experience: entry.input.experience,
        skillScore: entry.input.skillScore,
        educationLevel: entry.input.educationLevel,
        prediction: `${entry.prediction} Performance`,
        confidence: parseFloat((entry.confidence * 100).toFixed(1)),
        model_used: entry.model_used
    }));
    res.json({ count: formatted.length, history: formatted });
};

// ── DELETE /history ─────────────────────────────────────────────────────────────

exports.clearHistory = (req, res) => {
    service.clearHistory();
    res.json({ message: "Prediction history cleared." });
};
