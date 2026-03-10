"""
dataset_generator.py
--------------------
Generates a synthetic employee performance dataset and saves it as dataset.csv.
Used to train the ML model from scratch without needing real data.
"""

import pandas as pd
import numpy as np
import os

def generate_dataset(n_samples=100, output_path="dataset.csv"):
    """
    Generate a synthetic dataset for employee performance prediction.
    
    Features:
        - Age: 22 to 60
        - Experience: 0 to 35 years
        - SkillScore: 0 to 100
        - EducationLevel: High School, Bachelor, Master, PhD
    
    Label logic (rule-based to make it learnable):
        High   -> SkillScore >= 70 AND Experience >= 5
        Low    -> SkillScore < 40 OR Experience < 2
        Medium -> everything else
    """
    np.random.seed(42)

    ages        = np.random.randint(22, 61, size=n_samples)
    experiences = np.random.randint(0, 36, size=n_samples)
    skill_scores = np.random.randint(10, 101, size=n_samples)
    education_levels = np.random.choice(
        ["High School", "Bachelor", "Master", "PhD"],
        size=n_samples,
        p=[0.15, 0.45, 0.30, 0.10]
    )

    # Education bonus: PhD=10, Master=6, Bachelor=3, High School=0
    edu_bonus = {"PhD": 10, "Master": 6, "Bachelor": 3, "High School": 0}

    labels = []
    for i in range(n_samples):
        effective_skill = skill_scores[i] + edu_bonus[education_levels[i]]
        exp = experiences[i]

        if effective_skill >= 75 and exp >= 5:
            labels.append("High")
        elif effective_skill < 45 or exp < 2:
            labels.append("Low")
        else:
            labels.append("Medium")

    df = pd.DataFrame({
        "Age": ages,
        "Experience": experiences,
        "SkillScore": skill_scores,
        "EducationLevel": education_levels,
        "Performance": labels
    })

    # Save CSV next to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    save_path = os.path.join(script_dir, output_path)
    df.to_csv(save_path, index=False)

    print(f"[Dataset] Generated {n_samples} rows -> {save_path}")
    print(f"[Dataset] Label distribution:\n{df['Performance'].value_counts().to_string()}")
    return df


if __name__ == "__main__":
    generate_dataset()
