/**
 * script.js  —  AI Performance Predictor Frontend
 * -------------------------------------------------
 * Handles:
 *   - Form validation & submission
 *   - Fetch API calls to backend
 *   - Result card rendering with animated confidence ring
 *   - Chart.js confidence bar chart
 *   - Prediction history table
 *   - CSV download
 *   - Dark/light mode toggle
 *   - Toast notifications
 *   - Tooltip system
 */

"use strict";

// ── Config ──────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:3001";

// ── DOM References ───────────────────────────────────────────────────────────
const form = document.getElementById("prediction-form");
const predictBtn = document.getElementById("predict-btn");
const btnText = predictBtn.querySelector(".btn-text");
const btnSpinner = document.getElementById("btn-spinner");
const resetBtn = document.getElementById("reset-btn");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

const resultCard = document.getElementById("result-card");
const emptyState = document.getElementById("empty-state");
const chartCard = document.getElementById("chart-card");

const resultIcon = document.getElementById("result-icon");
const resultValue = document.getElementById("result-value");
const confidenceTxt = document.getElementById("confidence-text");
const ringFill = document.getElementById("ring-fill");
const resultExpl = document.getElementById("result-explanation");
const resultModel = document.getElementById("result-model");
const resultAcc = document.getElementById("result-accuracy");
const modelBadge = document.getElementById("model-accuracy-badge");

const historyBody = document.getElementById("history-body");
const downloadCsvBtn = document.getElementById("download-csv-btn");
const clearHistoryBtn = document.getElementById("clear-history-btn");

const skillInput = document.getElementById("skillScore");
const skillFill = document.getElementById("skill-fill");

const toastContainer = document.getElementById("toast-container");
const tooltipPopup = document.getElementById("tooltip-popup");

// ── State ────────────────────────────────────────────────────────────────────
let chartInstance = null;       // Chart.js instance
let historyData = [];         // local mirror of prediction history
let isDark = true;       // current theme

// ── Skill score progress bar ──────────────────────────────────────────────
skillInput.addEventListener("input", () => {
    const val = Math.min(100, Math.max(0, Number(skillInput.value) || 0));
    skillFill.style.width = `${val}%`;
});

// ── Dark/Light mode toggle ────────────────────────────────────────────────
themeToggle.addEventListener("click", () => {
    isDark = !isDark;
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    themeToggle.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}" id="theme-icon"></i>`;
    lucide.createIcons({ root: themeToggle });
    if (chartInstance) updateChartTheme();
});

// ── Tooltip system ────────────────────────────────────────────────────────
document.querySelectorAll(".tooltip-btn").forEach(btn => {
    btn.addEventListener("mouseenter", e => {
        tooltipPopup.textContent = btn.dataset.tip;
        tooltipPopup.style.opacity = "1";
        positionTooltip(e);
    });
    btn.addEventListener("mousemove", positionTooltip);
    btn.addEventListener("mouseleave", () => {
        tooltipPopup.style.opacity = "0";
    });
});

function positionTooltip(e) {
    const x = e.clientX + 12;
    const y = e.clientY + 12;
    tooltipPopup.style.left = `${x}px`;
    tooltipPopup.style.top = `${y}px`;
}

// ── Form Validation ───────────────────────────────────────────────────────
const VALIDATORS = {
    age: {
        check: v => v !== "" && !isNaN(v) && Number(v) >= 1 && Number(v) <= 100,
        msg: "Age must be between 1 and 100."
    },
    experience: {
        check: v => v !== "" && !isNaN(v) && Number(v) >= 0 && Number(v) <= 60,
        msg: "Experience must be between 0 and 60 years."
    },
    skillScore: {
        check: v => v !== "" && !isNaN(v) && Number(v) >= 0 && Number(v) <= 100,
        msg: "Skill Score must be between 0 and 100."
    },
    educationLevel: {
        check: v => v !== "",
        msg: "Please select an education level."
    }
};

function validateField(name, value) {
    const input = document.getElementById(name);
    const errorEl = document.getElementById(`${name}-error`);
    const rule = VALIDATORS[name];

    if (rule && !rule.check(value)) {
        input.classList.add("is-invalid");
        errorEl.textContent = rule.msg;
        return false;
    } else {
        input.classList.remove("is-invalid");
        errorEl.textContent = "";
        return true;
    }
}

function validateAll() {
    const names = Object.keys(VALIDATORS);
    return names.every(name => {
        const el = document.getElementById(name);
        return validateField(name, el.value);
    });
}

// Live validation on blur
Object.keys(VALIDATORS).forEach(name => {
    const el = document.getElementById(name);
    el.addEventListener("blur", () => validateField(name, el.value));
    el.addEventListener("input", () => {
        if (el.classList.contains("is-invalid")) validateField(name, el.value);
    });
});

// ── Form Submission ───────────────────────────────────────────────────────
form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validateAll()) {
        showToast("Please fix the errors before submitting.", "error");
        return;
    }
    await runPrediction();
});

async function runPrediction() {
    const payload = {
        age: Number(document.getElementById("age").value),
        experience: Number(document.getElementById("experience").value),
        skillScore: Number(document.getElementById("skillScore").value),
        educationLevel: document.getElementById("educationLevel").value
    };

    setLoading(true);

    try {
        const res = await fetch(`${API_BASE}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || `Server error ${res.status}`);
        }

        displayResult(data);
        addToHistory(data, payload);
        showToast("Prediction complete!", "success");

    } catch (err) {
        if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
            showToast("Cannot reach backend. Is the Node.js server running on port 3001?", "error");
        } else {
            showToast(err.message, "error");
        }
    } finally {
        setLoading(false);
    }
}

// ── Loading State ─────────────────────────────────────────────────────────
function setLoading(active) {
    predictBtn.disabled = active;
    btnText.textContent = active ? "Predicting…" : "Predict Performance";
    btnSpinner.classList.toggle("active", active);
}

// ── Result Display ────────────────────────────────────────────────────────
function displayResult(data) {
    const label = data.prediction.replace(" Performance", "").toLowerCase(); // high/medium/low
    const labelDisplay = data.prediction;
    const confidence = data.confidence;      // percentage 0–100
    const confidence01 = confidence / 100;

    // Show/hide cards
    emptyState.hidden = true;
    resultCard.hidden = false;
    chartCard.hidden = false;

    // Force re-animation
    resultCard.style.animation = "none";
    chartCard.style.animation = "none";
    void resultCard.offsetWidth;
    void chartCard.offsetWidth;
    resultCard.style.animation = "";
    chartCard.style.animation = "";

    // Icon
    const icons = { high: "award", medium: "trending-up", low: "trending-down" };
    resultIcon.innerHTML = `<i data-lucide="${icons[label] || 'medal'}"></i>`;
    lucide.createIcons({ root: resultIcon });

    // Label
    resultValue.textContent = labelDisplay;
    resultValue.className = `result-value ${label}`;

    // Confidence ring
    const circumference = 213.63;
    const offset = circumference - confidence01 * circumference;
    ringFill.style.strokeDashoffset = circumference; // reset
    const ringColours = { high: "#22c55e", medium: "#f59e0b", low: "#ef4444" };
    ringFill.style.stroke = ringColours[label] || "#6366f1";
    setTimeout(() => {
        ringFill.style.strokeDashoffset = offset;
        confidenceTxt.textContent = `${confidence.toFixed(1)}%`;
    }, 50);

    // Explanation
    const explanations = {
        high: `Strong candidate! High Skill Score, relevant experience, and solid educational background suggest excellent performance potential.`,
        medium: `Moderate performer. Some strengths are present, but there's room for growth in skills or experience to reach the next level.`,
        low: `Below-average indicators detected. Consider investing in upskilling or gaining more hands-on experience.`
    };
    resultExpl.textContent = explanations[label] || "";

    // Meta
    resultModel.textContent = data.model_used;
    resultAcc.textContent = data.model_accuracy ? `${data.model_accuracy}%` : "–";
    modelBadge.textContent = data.model_accuracy ? `Accuracy: ${data.model_accuracy}%` : "Model active";

    // Chart
    const probs = data.probabilities || {};
    renderChart(probs);
}

// ── Chart.js ──────────────────────────────────────────────────────────────
function renderChart(probabilities) {
    const ctx = document.getElementById("confidence-chart").getContext("2d");

    const labels = ["High", "Medium", "Low"];
    const values = labels.map(l => probabilities[l] ?? 0);
    const colors = ["rgba(34,197,94,0.8)", "rgba(245,158,11,0.8)", "rgba(239,68,68,0.8)"];
    const borders = ["#22c55e", "#f59e0b", "#ef4444"];

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Confidence (%)",
                data: values,
                backgroundColor: colors,
                borderColor: borders,
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.parsed.y.toFixed(1)}%`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--text-muted").trim() || "#8b8fa8", callback: v => `${v}%` },
                    grid: { color: "rgba(255,255,255,0.06)" }
                },
                x: {
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--text-muted").trim() || "#8b8fa8" },
                    grid: { display: false }
                }
            }
        }
    });
}

function updateChartTheme() {
    if (!chartInstance) return;
    const mutedColor = isDark ? "#8b8fa8" : "#6b7280";
    chartInstance.options.scales.y.ticks.color = mutedColor;
    chartInstance.options.scales.x.ticks.color = mutedColor;
    chartInstance.options.scales.y.grid.color = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    chartInstance.update();
}

// ── History ───────────────────────────────────────────────────────────────
function addToHistory(result, payload) {
    const entry = {
        ts: new Date().toLocaleTimeString(),
        age: payload.age,
        exp: payload.experience,
        skill: payload.skillScore,
        edu: payload.educationLevel,
        prediction: result.prediction,
        confidence: result.confidence
    };
    historyData.unshift(entry);
    renderHistoryTable();
    downloadCsvBtn.disabled = false;
    clearHistoryBtn.disabled = false;
}

function renderHistoryTable() {
    if (historyData.length === 0) {
        historyBody.innerHTML = `<tr class="empty-row"><td colspan="8">No predictions yet. Make your first prediction above!</td></tr>`;
        return;
    }

    historyBody.innerHTML = historyData.map((entry, i) => {
        const label = entry.prediction.replace(" Performance", "").toLowerCase();
        return `
      <tr>
        <td>${historyData.length - i}</td>
        <td>${entry.ts}</td>
        <td>${entry.age}</td>
        <td>${entry.exp}</td>
        <td>${entry.skill}</td>
        <td>${entry.edu}</td>
        <td><span class="pill pill-${label}">${entry.prediction}</span></td>
        <td>${entry.confidence.toFixed(1)}%</td>
      </tr>
    `;
    }).join("");
}

// ── CSV Download ──────────────────────────────────────────────────────────
downloadCsvBtn.addEventListener("click", () => {
    if (historyData.length === 0) return;

    const header = ["#", "Time", "Age", "Experience", "SkillScore", "Education", "Prediction", "Confidence(%)"];
    const rows = historyData.map((e, i) => [
        historyData.length - i,
        e.ts,
        e.age,
        e.exp,
        e.skill,
        `"${e.edu}"`,
        `"${e.prediction}"`,
        e.confidence.toFixed(1)
    ]);

    const csvContent = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prediction_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast("History downloaded as CSV!", "success");
});

// ── Clear History ─────────────────────────────────────────────────────────
clearHistoryBtn.addEventListener("click", async () => {
    historyData = [];
    renderHistoryTable();
    downloadCsvBtn.disabled = true;
    clearHistoryBtn.disabled = true;

    // Also clear on backend
    try {
        await fetch(`${API_BASE}/history`, { method: "DELETE" });
    } catch (_) { /* ignore if offline */ }

    showToast("History cleared.", "info");
});

// ── Reset Button ──────────────────────────────────────────────────────────
resetBtn.addEventListener("click", () => {
    form.reset();
    skillFill.style.width = "0%";
    Object.keys(VALIDATORS).forEach(name => {
        document.getElementById(name).classList.remove("is-invalid");
        document.getElementById(`${name}-error`).textContent = "";
    });
    resultCard.hidden = true;
    chartCard.hidden = true;
    emptyState.hidden = false;
});

// ── Load existing history from backend on page load ────────────────────────
async function loadHistory() {
    try {
        const res = await fetch(`${API_BASE}/history`);
        const data = await res.json();
        if (data.history && data.history.length > 0) {
            historyData = data.history.map(e => ({
                ts: new Date(e.timestamp).toLocaleTimeString(),
                age: e.age,
                exp: e.experience,
                skill: e.skillScore,
                edu: e.educationLevel,
                prediction: e.prediction,
                confidence: e.confidence
            }));
            renderHistoryTable();
            downloadCsvBtn.disabled = false;
            clearHistoryBtn.disabled = false;
        }
    } catch (_) {
        // Backend not running — silently ignore on page load
    }
}

// ── Fetch model accuracy for the badge ───────────────────────────────────
async function fetchHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
            showToast("Backend connection established ✓", "info");
        }
    } catch (_) {
        showToast("Backend offline. Start the Node.js server on port 3001.", "error");
    }
}

// ── Toast helper ──────────────────────────────────────────────────────────
function showToast(message, type = "info") {
    const icons = { error: "x-circle", success: "check-circle", info: "info" };
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon"><i data-lucide="${icons[type]}"></i></span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    lucide.createIcons({ root: toast });
    setTimeout(() => toast.remove(), 3800);
}

// ── Init ──────────────────────────────────────────────────────────────────
loadHistory();
fetchHealth();
lucide.createIcons();
