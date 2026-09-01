"""
config.py — Wasel resource configuration.
All AWS resource IDs are read from SSM at startup. No hardcoded ARNs.
"""

import boto3

REGION = "us-west-2"

_ssm = boto3.client("ssm", region_name=REGION)


def _get(name: str) -> str:
    """Fetch a single SSM parameter by name."""
    return _ssm.get_parameter(Name=name)["Parameter"]["Value"]


# DynamoDB tables (reusing CityPulse workshop tables)
REPORTS_TABLE: str = _get("/app/workshop/citypulse/reports-table")
RESIDENTS_TABLE: str = _get("/app/workshop/citypulse/residents-table")

# S3 — pothole photos
PHOTOS_BUCKET: str = _get("/app/workshop/citypulse/photos-bucket")

# Bedrock Knowledge Base
KNOWLEDGE_BASE_ID: str = _get("/app/workshop/citypulse/knowledge-base-id")

# SNS — alerts to construction companies
ALERTS_TOPIC_ARN: str = _get("/app/workshop/citypulse/alerts-topic-arn")

# Bedrock guardrail (shared workshop resource)
GUARDRAIL_ID: str = _get("/app/workshop/guardrails/guardrail-id")

# Claude model — supports vision for pothole image confirmation
MODEL_ID: str = "us.anthropic.claude-sonnet-4-6"

# App identity
APP_NAME = "واصل | Wasel"
APP_TAGLINE_EN = "Smart Road Reporting for Saudi Arabia"
APP_TAGLINE_AR = "تقارير الطرق الذكية للمملكة العربية السعودية"
