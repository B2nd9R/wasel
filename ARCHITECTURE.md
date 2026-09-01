# CityPulse Architecture

## 1. Product Overview
CityPulse is an autonomous municipal road safety and incident response platform designed for Saudi Arabia. The system connects citizens and city operations in real time:
- **Resident Flow**: A resident identifies a road issue (such as a deep pothole, road flooding, broken streetlight, or waste overflow), selects evidence, and submits with geolocation.
- **AI Agent Processing**: An autonomous agent orchestrated with Amazon Bedrock and Strands Agent SDK analyzes physical damage via Claude Vision, evaluates spatial clustering and priority score (0–100), retrieves municipal SLA policies, files the incident in Amazon DynamoDB, and alerts rapid response dispatchers via Amazon SNS.
- **Municipal Command Center**: Municipal operators monitor live incidents on a single-page operations dashboard with real-time geospatial mapping, automated priority triage, SLA tracking, and detailed observable agent audit logs.

---

## 2. Clients
1. **Resident Web Portal (`/`)**: High-efficiency public portal where citizens submit verified incident evidence, confirm GPS location, and receive immediate tracking confirmation.
2. **Municipal Operations Dashboard (`/dashboard`)**: Single-page operations interface featuring a geospatial command map, operational summary metrics, high-urgency triage cards, and an interactive incident inspector drawer.
3. **Native iOS Client**: Mobile application built for on-the-go citizen reporting and vehicular bump/motion vibration detection.

---

## 3. AWS Architecture & Implemented Services

```mermaid
flowchart TD
    subgraph Clients["Clients"]
        ResidentWeb["Resident Web Portal (/)"]
        ResidentIOS["Native iOS Client (Wasel)"]
        Dashboard["Municipal Dashboard (/dashboard)"]
    end

    subgraph AgentCore["AWS AgentCore & AI Runtime"]
        Agent["Strands AI Agent (Bedrock Runtime)"]
        BedrockModel["Claude 3.5 / 3.7 Sonnet (Vision AI)"]
        Gateway["AgentCore Gateway & Tools"]
    end

    subgraph StorageServices["AWS Persistence & Messaging"]
        DynamoDB[("Amazon DynamoDB\n(workshop-citypulse-reports)")]
        SSM["AWS Systems Manager\nParameter Store"]
        S3[("Amazon S3\n(Photo Storage)")]
        SNS["Amazon SNS\n(Contractor Alert Topic)"]
    end

    ResidentWeb -->|POST /api/submit| Agent
    ResidentIOS -->|Vision & GPS Submission| Agent
    Agent -->|Invoke Vision Analysis| BedrockModel
    Agent -->|Route Tool Execution| Gateway
    Gateway -->|confirm_pothole| BedrockModel
    Gateway -->|file_pothole_report| DynamoDB
    Gateway -->|file_pothole_report| S3
    Gateway -->|get_nearby_reports| DynamoDB
    Gateway -->|notify_construction| SNS
    
    SSM -.->|Resource ARNs & Names| Agent
    SSM -.->|Table Name Lookup| Dashboard
    
    Dashboard -->|GET /api/reports (3s Live Polling)| DynamoDB
```

### Implemented AWS Services:
- **Amazon Bedrock**: Powers multimodal Claude Sonnet vision models for damage classification and bilingual description generation.
- **Strands Agents SDK & AgentCore Runtime**: Autonomous orchestration of multi-step tool reasoning with session memory.
- **AgentCore Gateway & Lambda**: Exposes modular tools and category lookup tools.
- **Amazon DynamoDB**: Core persistence engine storing live reports with spatial coordinates, visual severity, priority score, and status.
- **Amazon S3**: Secure object store for incident photographic evidence.
- **Amazon SNS**: Broadcasts instant bilingual emergency dispatches to road contractors.
- **AWS Systems Manager (SSM) Parameter Store**: Dynamic configuration of resource identifiers (zero hardcoded ARNs).

---

## 4. End-to-End Flow
1. **Selection & Submission**: Citizen selects evidence, confirms GPS location, and provides context.
2. **Server-Side Ingestion**: Next.js server routes the request securely without exposing AWS credentials to the client.
3. **Claude Vision Verification (`confirm_pothole`)**: Determines physical defect presence, confidence level, and base visual severity (`critical`, `high`, `medium`, `low`).
4. **Spatial Clustering (`get_nearby_reports`)**: Scans DynamoDB records within a 1.0 km radius to identify hazard clusters.
5. **Priority Scoring & SLA Assignment (`calculate_priority`)**: Computes a 0–100 Priority Score combining base severity, cluster bonus, and age bonus; determines SLA target (e.g., 24h, 7d).
6. **Persistence (`file_pothole_report`)**: Writes item to DynamoDB and uploads photo to S3.
7. **Contractor Alerting (`notify_construction`)**: SNS dispatches bilingual SMS/email alert to repair teams.
8. **Dashboard Ingestion**: Municipal dashboard receives the report within 3 seconds via live polling and updates the operational map.

---

## 5. Agent Tool Flow
- `confirm_pothole(image_base64)`: Claude Vision classification of physical road damage.
- `get_nearby_reports(lat, lon, radius_km)`: Haversine distance clustering of nearby incidents.
- `calculate_priority(severity, cluster_count, days_open)`: 0–100 priority score calculation.
- `file_pothole_report(...)`: DynamoDB item creation + S3 image archiving.
- `notify_construction(...)`: SNS notification with Google Maps link and SLA target.

---

## 6. Data Flow & Normalization
- **Raw DynamoDB Item**: Contains `report_id`, `category`, `severity`, `priority_score`, `latitude`, `longitude`, `status`, `created_at`, `photo_url`.
- **Server Normalizer (`normalizer.ts`)**: Transforms raw database items into `MunicipalIncident` contracts with risk assessments, SLA countdowns, and observable action logs.
- **Client Presentation**: Single-page operations interface consuming normalized models.

---

## 7. Security Architecture
- **Zero Client Credentials**: AWS credentials exist strictly on the server layer in `.env.local` (gitignored).
- **SSM Resource Parameterization**: Table names and topic ARNs are resolved dynamically via SSM Parameter Store.
- **Container Isolation**: Docker images run as an unprivileged `nextjs` non-root user.

---

## 8. Deployment & Containerization
- **Multi-Stage Dockerfile**: Builds on Node.js 22 Alpine, leveraging Next.js standalone output to minimize image footprint.
- **Port**: Exposes port `3000`.

---

## 9. Demo Flow for Judges
1. **Public Citizen Submission**: Open `/`, select an incident evidence photo, confirm GPS location, and click **Submit Report**.
2. **Instant Agent Execution**: Watch the live progress steps as Claude Vision and DynamoDB process the report.
3. **Live Command Center Update**: Switch to `/dashboard`; within 3 seconds, a toast notification announces the new incident, the geospatial map pin updates, and the "Needs Attention" card spotlights the highest urgency issue.
4. **Deep Incident Inspection**: Click the incident row to slide open the inspector drawer showcasing evidence photo, AI risk rationale, recommended solutions (`Immediate`, `High`, `Routine`), SLA countdown, and chronological agent activity.
