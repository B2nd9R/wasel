# CityPulse Tech Stack

## Frontend Layer
- **Next.js 15 (App Router)**: Fast, server-rendered React framework providing secure server-side API boundaries.
- **React 19 & TypeScript 5**: Component architecture with strict compile-time type safety.
- **Tailwind CSS v3**: Utility styling customized around the `#f7f6ff`, `#7c7aac`, `#4d4b66` visual design system.
- **Geist Sans (via next/font)**: Modern technical typography delivering clean legibility.
- **Lucide React**: Vector iconography for operations, priority badges, and tools.
- **MapLibre GL JS**: Geospatial incident mapping without external API key dependencies.

## Autonomous Agent & AI Layer
- **Amazon Bedrock (Claude Sonnet)**: Multimodal vision model performing image damage verification and severity classification.
- **Strands Agents SDK**: Python framework managing autonomous multi-tool agent execution and memory management.
- **Amazon Bedrock AgentCore Runtime**: Agent lifecycle and cross-session memory management.
- **AgentCore Gateway**: Secure tool routing and category resolution.

## AWS Cloud Infrastructure
- **Amazon DynamoDB**: Key-value and document database for live incident persistence and clustering scans.
- **Amazon S3**: High-durability object storage for incident evidence imagery.
- **Amazon SNS**: Notification service dispatching emergency work orders to contractor teams.
- **AWS Systems Manager (SSM) Parameter Store**: Secure, centralized runtime parameter configuration.

## Deployment & Containerization
- **Docker (Node 22 Alpine)**: Lightweight multi-stage container leveraging Next.js standalone server mode.
- **Environment Management**: Dynamic credential injection supporting local `.env.local` and cloud container task roles.
