"""
train_model.py
--------------
Trains a Logistic Regression model on the synthetic dataset
and saves the trained pipeline (preprocessing + model) as model.pkl.

Run standalone:
    python train_model.py

Or call train_and_save() from app.py on server startup.
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

from dataset_generator import generate_dataset

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(SCRIPT_DIR, "dataset.csv")
MODEL_PATH   = os.path.join(SCRIPT_DIR, "model.pkl")

# ── Feature definitions ────────────────────────────────────────────────────────
NUMERIC_FEATURES     = ["Age", "Experience", "SkillScore"]
CATEGORICAL_FEATURES = ["EducationLevel"]
EDUCATION_CATEGORIES = ["High School", "Bachelor", "Master", "PhD"]


def build_pipeline():
    """Build a sklearn Pipeline with preprocessing and Logistic Regression."""

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(
                    categories=[EDUCATION_CATEGORIES],
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                LogisticRegression(
                    multi_class="multinomial",
                    solver="lbfgs",
                    max_iter=500,
                    random_state=42,
                ),
            ),
        ]
    )
    return pipeline


def train_and_save(n_samples=100):
    """
    Generate dataset (if not present), train model, evaluate, and save model.pkl.
    Returns (pipeline, accuracy, classes).
    """

    # 1. Generate / load dataset
    if not os.path.exists(DATASET_PATH):
        df = generate_dataset(n_samples=n_samples, output_path="dataset.csv")
    else:
        df = pd.read_csv(DATASET_PATH)
        print(f"[Train] Loaded existing dataset ({len(df)} rows) from {DATASET_PATH}")

    # 2. Prepare features / labels
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df["Performance"]

    # 3. Train / test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 4. Build & fit pipeline
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    # 5. Evaluate
    y_pred   = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n[Train] Model Accuracy: {accuracy * 100:.2f}%")
    print("\n[Train] Classification Report:")
    print(classification_report(y_test, y_pred))

    # 6. Save model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(
            {
                "pipeline": pipeline,
                "accuracy": accuracy,
                "classes": list(pipeline.classes_),
            },
            f,
        )
    print(f"[Train] Model saved -> {MODEL_PATH}")

    return pipeline, accuracy, list(pipeline.classes_)


if __name__ == "__main__":
    train_and_save()
