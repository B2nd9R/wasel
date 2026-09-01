# واصل | Wasel
### AI-powered pothole detection and road repair dispatch for Saudi Arabia

---

## Impact

**Beneficiary:**
Ahmed, a daily commuter in Riyadh who drives over the same dangerous pothole every morning.
He does not know who to call, the municipality form takes 20 minutes to fill out, and he never hears back.
The pothole grows. A neighbor blows a tire.

**Measurable claim:**
Wasel cuts the time to detect, confirm, and escalate a pothole report from weeks of silence to
**under 60 seconds** — with a tracked repair priority, an SLA deadline, and an instant alert
to the construction company, all triggered by a single photo or a bump in the road.

**Key demo moment:**
Driver hits a bump → taps "Yes" on the Wasel popup → uploads a photo → Claude vision confirms
High severity damage → agent finds 3 nearby reports → priority score 75/100 → SNS alert fires
to construction crew with GPS + Google Maps link. All in under 10 seconds, live on screen.

---

## How It Works

```
Phone detects bump (DeviceMotion API)  ──OR──  User uploads photo
                    ↓
     Claude vision confirms pothole + severity
                    ↓
         GPS coordinates captured
                    ↓
   Nearby reports scanned → cluster size calculated
                    ↓
     Priority score (0–100) + SLA assigned
                    ↓
        Report saved to DynamoDB + photo to S3
                    ↓
   SNS alert → construction company (location + priority)
                    ↓
     User receives report ID + expected fix date
```

---

## Two Reporting Modes

| Mode | Trigger |
|---|---|
| **Automatic** | Phone motion sensor detects heavy vibration → popup asks "Was that a pothole?" |
| **Manual** | User opens app, takes/uploads a photo → AI confirms and files it |

Both modes run the same pipeline: confirm → file → prioritize → alert.

---

## AWS Architecture

| Component | Service |
|---|---|
| Agent orchestration | Strands Agents SDK on AgentCore Runtime |
| Vision AI (pothole confirmation) | Amazon Bedrock — Claude Sonnet (vision) |
| Cross-session memory | AgentCore Memory |
| Report storage | Amazon DynamoDB |
| Photo storage | Amazon S3 |
| Construction alerts | Amazon SNS |
| Resource config | AWS SSM Parameter Store |
| Web interface | Streamlit (bilingual EN/AR, RTL) |

---

## Project Structure

```
citypulse/
├── app/
│   └── WaselAgent/
│       ├── main.py             # AgentCore Runtime entrypoint
│       └── pyproject.toml      # Python dependencies
├── agentcore/
│   ├── agentcore.json          # AgentCore project config
│   └── aws-targets.json        # Deployment target (account + region)
├── tools.py                    # 5 Strands @tool functions
├── config.py                   # SSM param loading
├── agent.py                    # Local dev agent
├── web-ui/app.py               # Streamlit web interface
├── lambda_functions/lookup/    # AgentCore Gateway Lambda
├── tool_specs/lookup.json      # Gateway tool spec
├── assets/                     # Deck, diagram, demo script
└── README.md
```

---

## Tools

| Tool | What it does |
|---|---|
| `confirm_pothole` | Claude vision — confirms damage + severity (critical/high/medium/low) |
| `file_pothole_report` | Saves to DynamoDB + uploads photo to S3 |
| `get_nearby_reports` | Haversine scan for cluster detection within 1 km |
| `calculate_priority` | Score 0–100 + SLA based on severity, cluster, age |
| `notify_construction` | Bilingual SNS alert with GPS + Google Maps link |

---

## Setup & Run

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Run locally (Streamlit):**
```bash
streamlit run web-ui/app.py --server.port 8501
```

**Deploy with AgentCore CLI:**
```bash
npm install -g @aws/agentcore
agentcore deploy
agentcore invoke --prompt "There is a large pothole at my location"
```

---

## What We Would Build Next

1. **Real mobile app** — native iOS/Android with live DeviceMotion detection, no manual button
2. **Satellite cross-validation** — use Amazon Location Service aerial imagery to auto-confirm reports
3. **Municipality dashboard** — repair queue ranked by priority score, heat map of problem zones
4. **Resident push notifications** — alert Ahmed when his reported pothole is scheduled for repair
5. **Predictive road health** — ML model trained on repair history to flag roads before potholes form
6. **Multi-city expansion** — extend beyond Riyadh to all GCC cities with localized construction routing

---

*واصل — يربطك بالحل | Wasel — Connecting you to the fix* 🇸🇦

Built with Amazon Bedrock, Strands Agents SDK, and AgentCore.
