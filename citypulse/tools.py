"""
tools.py — Wasel @tool definitions.
Five focused tools covering the full pothole detection → report → alert pipeline.
"""

import uuid
import json
import base64
from datetime import datetime, timezone
from math import radians, cos, sin, asin, sqrt
from typing import Optional

import io
import boto3
from boto3.dynamodb.conditions import Attr
from botocore.config import Config
from strands import tool
from PIL import Image

import config

# Longer timeout for vision calls — large images can be slow
_bedrock_config = Config(read_timeout=120, connect_timeout=10)

# AWS clients
_dynamodb = boto3.resource("dynamodb", region_name=config.REGION)
_s3       = boto3.client("s3",                   region_name=config.REGION)
_sns      = boto3.client("sns",                   region_name=config.REGION)
_bedrock  = boto3.client("bedrock-runtime",       region_name=config.REGION,
                          config=_bedrock_config)


def _resize_image_b64(image_b64: str, max_px: int = 1024) -> str:
    """Resize an image so its longest side is at most max_px, return base64."""
    raw = base64.b64decode(image_b64)
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    img.thumbnail((max_px, max_px), Image.LANCZOS)  # in-place resize
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# ── Tool 1: Confirm pothole with Claude vision ────────────────────────────────

@tool
def confirm_pothole(image_base64: str, media_type: str = "image/jpeg") -> str:
    """Use Claude vision to confirm whether an image shows a real pothole or road damage.

    Args:
        image_base64: Base64-encoded image data (JPEG or PNG).
        media_type: MIME type of the image, e.g. 'image/jpeg' or 'image/png'.

    Returns:
        JSON with keys: confirmed (bool), confidence (high/medium/low),
        severity (critical/high/medium/low), description (str), description_ar (str).
    """
    prompt = """You are a road safety inspector analyzing a photo.
Determine if this image shows a pothole or significant road damage.

Respond ONLY with valid JSON in this exact format:
{
  "confirmed": true or false,
  "confidence": "high" or "medium" or "low",
  "severity": "critical" or "high" or "medium" or "low",
  "description": "one sentence in English describing what you see",
  "description_ar": "نفس الجملة باللغة العربية"
}

Severity guide:
- critical: large pothole >30cm, structural collapse, immediate danger
- high: pothole 15-30cm, multiple cracks, safety risk
- medium: pothole <15cm, surface cracking
- low: minor surface wear, cosmetic damage"""

    # Resize before sending — keeps the request small and avoids timeouts
    resized_b64 = _resize_image_b64(image_base64)

    response = _bedrock.invoke_model(
        modelId=config.MODEL_ID,
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 300,
            "messages": [{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": resized_b64,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }],
        }),
    )
    body = json.loads(response["body"].read())
    # Extract JSON from the model's text response
    text: str = body["content"][0]["text"].strip()
    # Strip markdown code fences if Claude wrapped the JSON in ```json ... ```
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    # Parse and re-serialize to validate it's clean JSON
    result = json.loads(text)
    return json.dumps(result)


# ── Tool 2: File a confirmed pothole report ───────────────────────────────────

@tool
def file_pothole_report(
    latitude: float,
    longitude: float,
    severity: str,
    description: str,
    description_ar: str,
    image_base64: Optional[str] = None,
    resident_id: str = "anonymous",
    source: str = "manual",
) -> str:
    """Save a confirmed pothole report to DynamoDB and optionally upload the photo to S3.

    Args:
        latitude: GPS latitude of the pothole.
        longitude: GPS longitude of the pothole.
        severity: Severity level — critical / high / medium / low.
        description: English description of the damage.
        description_ar: Arabic description of the damage.
        image_base64: Optional base64-encoded photo to store in S3.
        resident_id: ID of the reporting user (default 'anonymous').
        source: How it was detected — 'motion' (auto) or 'manual' (photo upload).

    Returns:
        JSON with report_id and s3_url (if photo was uploaded).
    """
    report_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Upload photo to S3 if provided (resize first to keep S3 objects small)
    s3_url: Optional[str] = None
    if image_base64:
        key = f"potholes/{report_id}/photo.jpg"
        resized = _resize_image_b64(image_base64)
        _s3.put_object(
            Bucket=config.PHOTOS_BUCKET,
            Key=key,
            Body=base64.b64decode(resized),
            ContentType="image/jpeg",
        )
        s3_url = f"s3://{config.PHOTOS_BUCKET}/{key}"

    # Write report to DynamoDB
    table = _dynamodb.Table(config.REPORTS_TABLE)
    table.put_item(Item={
        "report_id":      report_id,
        "resident_id":    resident_id,
        "category":       "pothole",
        "source":         source,          # 'motion' or 'manual'
        "latitude":       str(latitude),
        "longitude":      str(longitude),
        "severity":       severity,
        "description":    description,
        "description_ar": description_ar,
        "status":         "open",
        "photo_url":      s3_url or "",
        "created_at":     now,
        "updated_at":     now,
    })

    return json.dumps({"report_id": report_id, "s3_url": s3_url})


# ── Tool 3: Find nearby reports ───────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance in km between two GPS coordinates."""
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * asin(sqrt(a))


@tool
def get_nearby_reports(latitude: float, longitude: float, radius_km: float = 1.0) -> str:
    """Find existing pothole reports within a radius of a GPS location.

    Args:
        latitude: GPS latitude of the centre point.
        longitude: GPS longitude of the centre point.
        radius_km: Search radius in kilometres (default 1 km).

    Returns:
        JSON array of nearby reports sorted by distance, each with report_id,
        severity, distance_km, status, and created_at.
    """
    table = _dynamodb.Table(config.REPORTS_TABLE)
    # Scan for pothole reports — acceptable at hackathon scale
    result = table.scan(FilterExpression=Attr("category").eq("pothole"))
    items = result.get("Items", [])

    nearby = []
    for item in items:
        try:
            dist = _haversine_km(
                latitude, longitude,
                float(item["latitude"]), float(item["longitude"])
            )
        except (KeyError, ValueError):
            continue
        if dist <= radius_km:
            nearby.append({
                "report_id":  item["report_id"],
                "severity":   item.get("severity", "unknown"),
                "status":     item.get("status", "open"),
                "distance_km": round(dist, 3),
                "created_at": item.get("created_at", ""),
            })

    nearby.sort(key=lambda x: x["distance_km"])
    return json.dumps(nearby)


# ── Tool 4: Calculate priority score ─────────────────────────────────────────

@tool
def calculate_priority(
    severity: str,
    nearby_report_count: int,
    days_open: int = 0,
) -> str:
    """Calculate a priority score for road repair scheduling.

    Higher score = fix sooner. Used to rank the construction company's work queue.

    Args:
        severity: Damage severity — critical / high / medium / low.
        nearby_report_count: Number of other reports within 1 km (cluster signal).
        days_open: How many days the oldest nearby report has been open.

    Returns:
        JSON with score (0-100), priority_label (EN), priority_label_ar (AR),
        and recommended_sla_days.
    """
    # Base score by severity
    base = {"critical": 80, "high": 60, "medium": 40, "low": 20}.get(severity, 30)

    # Cluster bonus — multiple reports in same area = higher priority
    cluster_bonus = min(nearby_report_count * 3, 15)

    # Age bonus — the longer it's been ignored, the more urgent
    age_bonus = min(days_open * 1, 5)

    score = min(base + cluster_bonus + age_bonus, 100)

    if score >= 80:
        label, label_ar, sla = "Critical — Fix Today", "حرج — الإصلاح اليوم", 1
    elif score >= 60:
        label, label_ar, sla = "High — Fix This Week", "عالٍ — الإصلاح هذا الأسبوع", 7
    elif score >= 40:
        label, label_ar, sla = "Medium — Fix This Month", "متوسط — الإصلاح هذا الشهر", 30
    else:
        label, label_ar, sla = "Low — Schedule Soon", "منخفض — الجدولة قريباً", 60

    return json.dumps({
        "score":               score,
        "priority_label":      label,
        "priority_label_ar":   label_ar,
        "recommended_sla_days": sla,
    })


# ── Tool 5: Notify construction company ──────────────────────────────────────

@tool
def notify_construction(
    report_id: str,
    latitude: float,
    longitude: float,
    severity: str,
    priority_label: str,
    description: str,
    nearby_count: int,
    sla_days: int,
) -> str:
    """Send an alert to the nearest construction company via SNS.

    Args:
        report_id: The Wasel report ID.
        latitude: GPS latitude of the pothole.
        longitude: GPS longitude of the pothole.
        severity: Damage severity label.
        priority_label: Human-readable priority (e.g. 'Critical — Fix Today').
        description: English description of the damage.
        nearby_count: Number of other reports within 1 km.
        sla_days: Target days to resolution.

    Returns:
        The SNS MessageId confirming delivery.
    """
    maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"

    message = f"""🚧 WASEL ROAD ALERT | واصل — تنبيه طريق

Report ID: {report_id}
Severity:  {severity.upper()}
Priority:  {priority_label}
SLA:       Fix within {sla_days} day(s)

Location:  {latitude}, {longitude}
Maps:      {maps_link}

Damage:    {description}
Cluster:   {nearby_count} nearby report(s) within 1 km

Action required: Dispatch repair crew to above location.
الإجراء المطلوب: إرسال طاقم إصلاح إلى الموقع أعلاه.
"""
    subject = f"[Wasel] {severity.upper()} pothole — {priority_label[:40]}"

    response = _sns.publish(
        TopicArn=config.ALERTS_TOPIC_ARN,
        Subject=subject[:100],
        Message=message,
    )
    return response["MessageId"]
