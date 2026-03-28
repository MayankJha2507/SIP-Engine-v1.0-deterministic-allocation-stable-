# 🚀 SIPSense – Intelligent SIP Allocation Engine

SIPSense is a full-stack application that helps optimize your monthly SIP (Systematic Investment Plan) using risk-aware allocation, diversification rules, and AI-driven insights.

URL: https://sipsuggeston.netlify.app/
---

## 🧠 What It Does

* Allocates SIP across selected stocks
* Applies **risk controls** (no over-concentration)
* Provides **human-readable explanations**
* Uses **AI signals** for smarter decisions
* Holds **cash when markets are unfavorable**

---

## 🏗️ Architecture

### Frontend (Netlify)

* Vite + React
* Handles UI, inputs, and visualization
* Supports mock mode for demo

### Backend (Render)

* Node.js + Express
* Handles allocation logic & AI processing
* Securely manages API keys (Gemini)

---

## 🔌 API Endpoints

### `POST /api/analyze`

Generates SIP allocation

### `GET /api/health`

Health check endpoint

---

## ⚙️ Core Allocation Logic

### ✅ Risk Controls

* **Max 40% per stock**
* **Max 60% per sector**
* Prevents over-concentration

### 💰 Cash Reserve

* If limited opportunities → partial allocation
* Remaining SIP is held as cash

### 🚫 No Investment Scenario

* If no stocks qualify → 100% cash
* User gets clear recommendation

---

## 💡 Explainability (Key Feature)

Instead of confusing scores, SIPSense explains decisions like:

### ✔ Selected Stocks

* Strong momentum
* Low volatility
* Large-cap stability

### ❌ Excluded Stocks

* Weak momentum
* High risk
* Overvalued

---

## 🖥️ Frontend Features

* Allocation breakdown
* Exclusion reasoning
* Cash reserve visibility
* “No Investment” state
* Market insights (AI-powered)

---

## 🛠️ Environment Variables

### Frontend (Netlify)

```id="kqv9d2"
VITE_API_URL=https://your-backend-url
VITE_USE_MOCK=false
```

### Backend (Render)

```id="2k6v8z"
GEMINI_API_KEY=your_api_key
```

---

## 🚀 Deployment

### Backend (Render)

* Build: `npm run build`
* Start: `npm run start`

### Frontend (Netlify)

* Connect GitHub repo
* Add environment variables
* Deploy

---

## 🔄 Modes

| Mode | Description            |
| ---- | ---------------------- |
| Mock | Demo mode (no backend) |
| Real | Uses deployed backend  |

---

## ✅ Key Improvements (V1)

* Fixed rounding inconsistencies
* Removed unsafe allocation fallback
* Added stock & sector caps
* Introduced cash reserve
* Improved UX with clear explanations
* Secured AI API usage (backend only)

---

## 🔮 Future Scope (V2)

* Advanced scoring model
* Portfolio tracking
* Rebalancing engine
* User authentication
* Historical insights

---

## 📌 Summary

SIPSense is designed to behave like a **real portfolio manager**, not just a calculator:

* Safer allocations
* Clear reasoning
* Intelligent fallback (cash)
* Production-ready architecture

---

## ⚠️ Disclaimer

This is for educational purposes only and not financial advice.
