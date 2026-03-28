## SIPSense

SIPSense is a web application that helps investors decide how to allocate their monthly SIP (Systematic Investment Plan) across their existing stock portfolio.

Unlike typical "AI stock pickers", SIPSense uses a deterministic, rule-based engine to analyze:

- Portfolio concentration (stock & sector level)
- Risk exposure
- Market signals (trend, volatility, market cap)

Based on this, it suggests a focused SIP allocation (3–5 stocks) for the current cycle, along with clear reasoning behind each decision.

### Key Principles

- Logic-first, not hype
- Deterministic and explainable decisions
- Avoid over-diversification and tiny allocations
- Actively correct portfolio imbalances

### What it does

- Detects concentration risks
- Filters weak or high-risk stocks
- Prioritizes strong opportunities
- Enforces diversification during allocation
- Ensures meaningful SIP distribution (no tiny allocations)

### Tech Stack

- Frontend: React + TypeScript + Tailwind
- Backend: Node / TypeScript
- Architecture: Deterministic engine + optional AI explanation layer

---

This is currently **v1.0**, focused on building a reliable core allocation engine. Future versions will introduce AI-powered explanations and deeper personalization.
