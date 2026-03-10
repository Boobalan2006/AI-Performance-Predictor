# AI Performance Predictor 🤖

> An end-to-end AI-powered web application that predicts employee performance using Machine Learning. Built as a full-stack system with a Python/Flask ML service, Node.js/Express REST API, and a modern vanilla-JS frontend.

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│   index.html + style.css + script.js                   │
│   (Served via any static file server or browser)       │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP  (port 3001)
┌──────────────────────▼──────────────────────────────────┐
│                  BACKEND API                            │
│   Node.js + Express.js  (port 3001)                    │
│   POST /predict  │  GET /history  │  GET /health       │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP  (port 5001)
┌──────────────────────▼──────────────────────────────────┐
│                ML SERVICE                               │
│   Python + Flask + scikit-learn  (port 5001)           │
│   POST /ml/predict  │  GET /ml/health                  │
│   Auto-trains Logistic Regression on startup           │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Technologies Used

| Layer    | Technology                                |
|----------|-------------------------------------------|
| Frontend | HTML5, CSS3 (Glassmorphism), Vanilla JS   |
| Charts   | Chart.js 4                                |
| Backend  | Node.js 18+, Express 4, axios, morgan     |
| ML       | Python 3.8+, Flask, scikit-learn, pandas  |
| Model    | Logistic Regression (multi-class, `predict_proba`) |

---

## 📂 Project Structure

```
ai-prediction-app/
├── frontend/
│   ├── index.html        # Main UI with form, result card, history table
│   ├── style.css         # Dark/light theme, glassmorphism, animations
│   └── script.js         # Form logic, Chart.js, fetch, CSV download
│
├── backend/
│   ├── server.js         # Express entry point (port 3001)
│   ├── package.json      # Node dependencies
│   ├── routes/
│   │   └── index.js      # Route definitions
│   ├── controllers/
│   │   └── predictionController.js   # Input validation + response
│   └── services/
│       └── predictionService.js      # ML service communication + history
│
├── ml_model/
│   ├── app.py            # Flask ML service (port 5001)
│   ├── train_model.py    # Training pipeline (sklearn)
│   ├── dataset_generator.py  # Synthetic dataset creation
│   ├── requirements.txt  # Python dependencies
│   └── model.pkl         # Saved model (auto-generated on first run)
│
└── README.md
```

---

## ⚡ Setup Instructions

### Prerequisites

| Tool          | Version  |
|---------------|----------|
| Python        | 3.8+     |
| Node.js       | 18+      |
| npm           | 9+       |

---

### 1️⃣  Start the ML Service (Python / Flask)

```bash
# Navigate to the ml_model folder
cd ai-prediction-app/ml_model

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the ML service (auto-trains on first run)
python app.py
```

✅ ML service runs at: **http://localhost:5001**

---

### 2️⃣  Start the Backend API (Node.js / Express)

```bash
# Open a new terminal, navigate to backend
cd ai-prediction-app/backend

# Install Node.js dependencies
npm install

# Start the server
npm start

# Or for development with auto-reload:
npm run dev
```

✅ Backend API runs at: **http://localhost:3001**

---

### 3️⃣  Open the Frontend

```bash
# Option A — just open in browser (no server needed)
# Double-click: ai-prediction-app/frontend/index.html

# Option B — serve with VS Code Live Server
# Right-click index.html → Open with Live Server
```

✅ Frontend opens in your browser.

---

## 🔌 API Reference

### POST `/predict`

**Request:**
```json
{
  "age": 30,
  "experience": 5,
  "skillScore": 80,
  "educationLevel": "Bachelor"
}
```

**Response:**
```json
{
  "prediction": "High Performance",
  "confidence": 91.2,
  "model_used": "Logistic Regression",
  "probabilities": {
    "High": 91.2,
    "Medium": 7.1,
    "Low": 1.7
  },
  "model_accuracy": 95.0,
  "timestamp": "2026-03-04T06:00:00.000Z"
}
```

---

### GET `/history`

Returns all prediction history (newest first).

```json
{
  "count": 3,
  "history": [...]
}
```

---

### GET `/health`

```json
{ "status": "ok", "service": "AI Prediction Backend", "time": "..." }
```

---

### POST `/ml/predict`  *(ML service direct)*

```json
{
  "prediction": "High",
  "confidence": 0.912,
  "probabilities": { "High": 0.912, "Medium": 0.071, "Low": 0.017 },
  "model": "Logistic Regression",
  "accuracy": 95.0
}
```

---

## ✨ Features

- 🤖 **ML Model** auto-trains on startup using synthetic data
- 📊 **Chart.js** confidence distribution bar chart
- 🌑 **Dark / Light mode** toggle
- 📋 **Prediction history** table with animated rows
- ⬇️  **CSV download** of full prediction history
- 💬 **Toast notifications** for success / error events
- 🔄 **Loading spinner** during API calls
- ✅ **Full form validation** (client + server side)
- ❓ **Input tooltips** explaining each field
- 📱 **Mobile responsive** layout

---

## 🗂 Education Levels Supported

| Value        | Description             |
|--------------|-------------------------|
| High School  | Secondary education     |
| Bachelor     | Undergraduate degree    |
| Master       | Postgraduate degree     |
| PhD          | Doctoral degree         |

---

## 📝 Notes

- The `model.pkl` file is auto-generated on first run. You can delete it to force retraining.
- All prediction history is stored **in memory** on the backend — it resets when the server restarts.
- The ML model achieves ~90–95% accuracy on the synthetic dataset.

---

*Built for academic / internship submission. Code is clean, modular, and well-commented.*
#
