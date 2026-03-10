"""
app.py  —  Flask ML Service (port 5001)
----------------------------------------
Starts the ML model automatically on server startup.
Exposes:
    POST /ml/predict  — run prediction on new input
    GET  /ml/health   — health check
"""

import os
import sys
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Make sure sibling modules are importable ──────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from train_model import train_and_save, MODEL_PATH, NUMERIC_FEATURES, CATEGORICAL_FEATURES

# ── Flask App Setup ────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)   # Allow cross-origin requests from Node.js backend

# ── Global model state ─────────────────────────────────────────────────────────
PIPELINE  = None
ACCURACY  = 0.0
CLASSES   = []


def load_or_train():
    """Load model from disk, or train if not found."""
    global PIPELINE, ACCURACY, CLASSES

    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            data = pickle.load(f)
        PIPELINE = data["pipeline"]
        ACCURACY = data["accuracy"]
        CLASSES  = data["classes"]
        print(f"[ML Service] Loaded existing model. Accuracy: {ACCURACY * 100:.2f}%")
    else:
        print("[ML Service] No saved model found. Training now...")
        PIPELINE, ACCURACY, CLASSES = train_and_save()


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/ml/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status":   "healthy",
        "model":    "Logistic Regression",
        "accuracy": round(ACCURACY * 100, 2),
        "classes":  CLASSES
    }), 200


@app.route("/ml/predict", methods=["POST"])
def predict():
    """
    Predict employee performance.

    Expected JSON body:
    {
        "age": 30,
        "experience": 5,
        "skillScore": 80,
        "educationLevel": "Bachelor"
    }

    Returns:
    {
        "prediction": "High",
        "confidence": 0.87,
        "probabilities": { "High": 0.87, "Medium": 0.10, "Low": 0.03 },
        "model": "Logistic Regression",
        "accuracy": 92.5
    }
    """
    if PIPELINE is None:
        return jsonify({"error": "Model not loaded. Please restart the ML service."}), 503

    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No JSON body provided."}), 400

    # ── Input extraction & basic validation ───────────────────────────────────
    try:
        age        = float(data["age"])
        experience = float(data["experience"])
        skill      = float(data["skillScore"])
        education  = str(data["educationLevel"]).strip()
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"error": f"Missing or invalid field: {e}"}), 422

    VALID_EDUCATION = ["High School", "Bachelor", "Master", "PhD"]
    if education not in VALID_EDUCATION:
        return jsonify({
            "error": f"Invalid educationLevel '{education}'. Must be one of: {VALID_EDUCATION}"
        }), 422

    if not (0 <= age <= 120):
        return jsonify({"error": "Age must be between 0 and 120."}), 422
    if not (0 <= experience <= 60):
        return jsonify({"error": "Experience must be between 0 and 60."}), 422
    if not (0 <= skill <= 100):
        return jsonify({"error": "SkillScore must be between 0 and 100."}), 422

    # ── Build input DataFrame ─────────────────────────────────────────────────
    input_df = pd.DataFrame([{
        "Age":            age,
        "Experience":     experience,
        "SkillScore":     skill,
        "EducationLevel": education
    }])

    # ── Predict ───────────────────────────────────────────────────────────────
    proba     = PIPELINE.predict_proba(input_df)[0]
    label_idx = int(np.argmax(proba))
    label     = CLASSES[label_idx]
    confidence = float(proba[label_idx])

    # Map class names to probabilities
    probabilities = {cls: round(float(p), 4) for cls, p in zip(CLASSES, proba)}

    return jsonify({
        "prediction":    label,
        "confidence":    round(confidence, 4),
        "probabilities": probabilities,
        "model":         "Logistic Regression",
        "accuracy":      round(ACCURACY * 100, 2)
    }), 200


# ── Startup ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("[ML Service] Starting... training/loading model.")
    load_or_train()
    print("[ML Service] Running on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
