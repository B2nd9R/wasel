# واصل | Wasel
### Smart Road Reporting for Saudi Arabia | تقارير الطرق الذكية للمملكة العربية السعودية

Built with **Amazon Bedrock**, **Strands Agents SDK**, and **AgentCore**.

---

## Impact

**Beneficiary:**
Ahmed, a daily commuter in Riyadh who drives the same road every morning.
There is a large pothole near his neighborhood that has been there for months.
He does not know who to call, the municipality form takes 20 minutes to fill out,
and he never hears back. The pothole gets bigger. A neighbor blows a tire.

**Measurable claim:**
Wasel cuts the time to detect, confirm, and escalate a pothole report
from weeks of silence to **under 60 seconds** — with a tracked repair priority,
an SLA deadline, and an instant alert to the construction company,
all triggered by a single photo or a bump in the road.

**Key demo moment:**
The driver hits a bump → taps "Yes" on the Wasel popup → uploads a quick photo →
Claude vision confirms it is a real pothole, scores it as **High priority**,
finds 3 nearby reports in the same cluster, sends an SNS alert to the repair team
with GPS coordinates and a 7-day SLA — all in under 10 seconds, live on screen.

---

## How It Works

```
Phone detects bump (DeviceMotion API)
        ↓
User confirms: "Was that a pothole?"
        ↓
Claude vision analyzes photo → confirms damage + severity
        ↓
GPS coordinates captured automatically
        ↓
Nearby reports scanned → cluster size calculated
        ↓
Priority score computed (0-100) + SLA assigned
        ↓
Report saved to DynamoDB
        ↓
SNS alert → construction company with location + priority
        ↓
User gets report ID + expected fix date
```

---

## Two Reporting Modes

| Mode | Trigger | How |
|---|---|---|
| **Automatic** | Phone detects heavy vibration while driving | DeviceMotion API → popup confirmation |
| **Manual** | User opens app and uploads a photo | File uploader → Claude vision confirmation |

Both modes run the same AI pipeline: confirm → file → prioritize → alert.

---

## AWS Architecture

| Component | Service |
|---|---|
| Vision AI (pothole confirmation) | Amazon Bedrock (Claude Sonnet) |
| Agent orchestration | Strands Agents SDK |
| Cross-session memory | AgentCore Memory |
| Report storage | Amazon DynamoDB |
| Photo storage | Amazon S3 |
| Construction company alerts | Amazon SNS |
| Resource config (no hardcoded ARNs) | AWS SSM Parameter Store |
| Web interface | Streamlit (bilingual EN/AR, RTL) |

---

## Project Structure

```
citypulse/
├── agent.py                        # Wasel Strands Agent + memory
├── tools.py                        # 5 @tool functions
│   ├── confirm_pothole             # Claude vision — is it real?
│   ├── file_pothole_report         # DynamoDB + S3
│   ├── get_nearby_reports          # Haversine cluster detection
│   ├── calculate_priority          # Score 0-100 + SLA
│   └── notify_construction         # SNS bilingual alert
├── config.py                       # SSM param loading
├── requirements.txt
├── lambda_functions/
│   └── lookup/handler.py           # AgentCore Gateway Lambda tool
├── tool_specs/lookup.json          # Gateway tool spec
├── agentcore/.env.local            # Runtime env vars (gitignored)
├── .gitignore
└── web-ui/
    └── app.py                      # Streamlit UI (EN/AR, motion + upload)
```

---

## Setup & Run

**1. Install dependencies**
```bash
pip install -r requirements.txt
```

**2. Confirm AWS credentials**
```bash
aws sts get-caller-identity --no-cli-pager --region us-west-2
```

**3. Run the web UI locally**
```bash
cd web-ui
pip install streamlit
streamlit run app.py --server.port 8501
```
Open http://localhost:8501 — works in mobile browser for motion detection demo.

**4. Deploy with AgentCore CLI**
```bash
agentcore add    # Memory → AssistantMemory → User preference
agentcore add    # Gateway → workshop-gateway → Custom JWT
agentcore deploy
```

---

## Demo Script (3 minutes)

1. Open Wasel on phone browser
2. Click "Simulate Pothole Detection" → popup appears
3. Tap Yes → agent runs pipeline
4. Upload a pothole photo → Claude confirms + files it
5. Show DynamoDB report + SNS alert in AWS console
6. Show priority score and SLA

---

*واصل — يربطك بالحل | Wasel — Connecting you to the fix* 🇸🇦
