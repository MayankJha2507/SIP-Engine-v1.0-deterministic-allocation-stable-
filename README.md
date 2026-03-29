# 🚀 SIPSense – Smart SIP Allocation Engine

🔗 **Live Demo:** https://sipsuggeston.netlify.app/

---

## 📌 Overview

SIPSense is an AI-assisted SIP (Systematic Investment Plan) allocation engine that helps investors intelligently distribute their monthly investments across stocks based on:

- 📊 Market trends & momentum
- 🧠 AI-driven macro insights
- ⚖️ Risk profile & investment horizon
- 🧩 Portfolio diversification principles

The goal is to move beyond static SIPs and provide a **dynamic, explainable, and risk-aware allocation strategy**.

---

## ✨ Key Features

### 🧠 AI + Deterministic Hybrid Engine
- Combines rule-based scoring with AI-generated macro signals
- Ensures stability while adapting to market conditions

### 📊 Smart Allocation Logic
- Score-based weighted allocation
- Sector cap (60%) to avoid over-concentration
- Per-stock cap (40%) to reduce risk
- Minimum allocation thresholds for meaningful investments

### 💰 Cash Reserve Strategy
- Allocates capital only when good opportunities exist
- Keeps a portion in **cash reserve** during uncertain conditions
- Prevents forced investments in weak markets

### 🛡️ Risk Management
- Detects concentration risk
- Adjusts allocation based on:
  - Risk profile (Low / Medium / High)
  - Investment horizon (1Y / 5Y)

### 📈 Macro-Aware Adjustments
- AI identifies:
  - Bullish sectors
  - Bearish sectors
  - Market sentiment
- Applies **bounded influence (±0.5)** to maintain stability

### 🧾 Explainable Decisions
- Every allocation includes:
  - Trend analysis
  - Volatility insight
  - Market cap context
- Excluded stocks include clear reasoning (e.g., weak momentum, high risk)

---

## 🏗️ Architecture

### Frontend (Netlify)
- Built with Vite + React
- Environment-based API switching (Mock vs Real backend)

### Backend (Render)
- Node.js + Express
- AI integration via Gemini API
- Handles:
  - Signal generation
  - Macro analysis
  - Allocation engine

---

## ⚙️ Core Engine Design

### 1. Signal Layer
Each stock is evaluated on:
- Trend (momentum)
- Volatility
- Market Cap
- Sector

👉 Includes fallback logic to prevent missing data issues

---

### 2. Scoring Engine
- Weighted scoring system
- Penalizes:
  - Over-concentration
  - Weak momentum
- Ensures:
  - Minimum 2 stocks selected
  - No over-filtering

---

### 3. Macro Overlay (AI)
- AI generates:
  - Bullish sectors
  - Bearish sectors
- Applied as:
  - **Soft score adjustment (±0.5 max)**

---

### 4. Allocation Engine
- Normalized scoring → weighted allocation
- Smoothed distribution to avoid extremes
- Constraints:
  - Max 40% per stock
  - Max 60% per sector

---

### 5. Cash Reserve Logic
- Used when:
  - Opportunities are weak
  - Risk is high
- Strict rules:
  - Never exceeds SIP amount
  - Limited to 20–30% in normal scenarios

---

## 🧪 Mock Mode (Frontend Demo)

To run without backend:

```env
VITE_USE_MOCK=true
