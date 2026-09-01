# CityPulse — AI-Powered Municipal Road Safety & Operations Platform

> Built for the AWS Agentic AI Hackathon with Amazon Bedrock, Strands Agents SDK, and Next.js.

---

## Overview
CityPulse is an autonomous incident management platform connecting citizen reports with municipal emergency dispatch teams. When a road hazard (pothole, water accumulation, streetlight outage, waste spill) is submitted:
1. **Vision AI Analysis**: Amazon Bedrock (Claude Sonnet) validates physical damage severity.
2. **Spatial Clustering**: Evaluates nearby hazard density within a 1.0 km radius.
3. **Priority & SLA Calculation**: Assigns a 0–100 Priority Score and target resolution deadline.
4. **Persistence & Alerting**: Saves incident to Amazon DynamoDB and dispatches contractor alerts via Amazon SNS.
5. **Command Center Operations**: Municipal operators monitor live incidents on an interactive geospatial dashboard with automated 3-second polling.

---

## Core Product Interfaces

### 1. Resident Portal (`/`)
- Sample evidence selector covering core municipal defect types.
- GPS location detection.
- Fast citizen submission flow with confirmation feedback.

### 2. Municipal Operations Dashboard (`/dashboard`)
- **Interactive Geospatial Map**: Visualizes live incident coordinates in Riyadh.
- **Operational Status Strip**: Tracks Open Reports, High Priority, Overdue, and Escalated counts.
- **Needs Attention Centerpiece**: Highlights the top-priority active incident with AI risk rationale.
- **Recent Reports Feed**: 3-second live polling with automatic new-incident alerts.
- **Inspector Drawer**: Deep inspection of evidence photos, AI analysis, recommended solutions (`Immediate`, `High`, `Routine`), SLA countdown, and observable agent action timelines.

---

## Getting Started

### Prerequisites
- Node.js 20+ / Node.js 22
- AWS Credentials with Bedrock, DynamoDB, SSM, and S3 permissions

### Environment Variables
Create `dashboard/.env.local` (excluded from git):
```ini
AWS_REGION="us-west-2"
AWS_ACCESS_KEY_ID="<your-key-id>"
AWS_SECRET_ACCESS_KEY="<your-secret-key>"
AWS_SESSION_TOKEN="<optional-session-token>"
```

### Local Development
```bash
cd dashboard
npm install
npm run dev
```
Open:
- Resident Portal: `http://localhost:3000/`
- Operations Dashboard: `http://localhost:3000/dashboard`

---

## Production Docker Build

```bash
cd dashboard

# Build container
docker build -t citypulse-web .

# Run container with external environment variables
docker run --rm -p 3000:3000 \
  -e AWS_REGION=us-west-2 \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -e AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN \
  citypulse-web
```

---

## Technical Documentation
- [Architecture & Flow Specification](ARCHITECTURE.md)
- [Technology Stack Breakdown](TECH_STACK.md)
