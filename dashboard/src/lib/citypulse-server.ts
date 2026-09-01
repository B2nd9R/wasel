import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import type { MunicipalIncident, OperationalStats } from "@/types";
import { normalizeDynamoItem } from "./normalizer";
import { FALLBACK_INCIDENTS } from "./mock-data";

let cachedTableName: string | null = null;

function getClients() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
  const credentials =
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        }
      : undefined;

  const ssm = new SSMClient({ region, credentials });
  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region, credentials }));
  const bedrock = new BedrockRuntimeClient({ region, credentials });

  return { ssm, ddb, bedrock };
}

async function getReportsTableName(): Promise<string> {
  if (cachedTableName) return cachedTableName;
  const { ssm } = getClients();
  try {
    const res = await ssm.send(
      new GetParameterCommand({ Name: "/app/workshop/citypulse/reports-table" })
    );
    if (res.Parameter?.Value) {
      cachedTableName = res.Parameter.Value;
      return cachedTableName;
    }
  } catch (err: any) {
    console.warn("SSM lookup for reports-table parameter failed:", err?.message || err);
  }
  return process.env.REPORTS_TABLE || "workshop-citypulse-reports";
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.asin(Math.sqrt(a));
}

export async function fetchAllIncidents(): Promise<{
  reports: MunicipalIncident[];
  stats: OperationalStats;
  source: "dynamodb" | "fallback";
}> {
  try {
    const tableName = await getReportsTableName();
    const { ddb } = getClients();

    const scanResult = await ddb.send(new ScanCommand({ TableName: tableName }));
    const rawItems = scanResult.Items || [];

    if (rawItems.length > 0) {
      const liveReports = rawItems.map((item, idx) => normalizeDynamoItem(item, idx));

      // Sort by Priority Score descending, then newest created date
      liveReports.sort((a, b) => {
        if (a.aiAnalysis.severityScore !== b.aiAnalysis.severityScore) {
          return b.aiAnalysis.severityScore - a.aiAnalysis.severityScore;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const stats = computeStats(liveReports);
      return { reports: liveReports, stats, source: "dynamodb" };
    }
  } catch (err: any) {
    console.warn("Live DynamoDB query encountered an error:", err?.message || err);
    throw new Error(`Unable to load live incidents: ${err?.message || "DynamoDB unreachable"}`);
  }

  // If table is completely empty, provide fallback
  const fallback = [...FALLBACK_INCIDENTS].sort(
    (a, b) => b.aiAnalysis.severityScore - a.aiAnalysis.severityScore
  );
  const stats = computeStats(fallback);
  return { reports: fallback, stats, source: "fallback" };
}

export async function submitNewReport(data: {
  description: string;
  photoBase64?: string;
  locationText?: string;
  latitude?: number;
  longitude?: number;
}): Promise<MunicipalIncident> {
  const { ddb, bedrock } = getClients();
  const tableName = await getReportsTableName();

  const reportId = `R-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();
  const lat = data.latitude || 24.7136;
  const lon = data.longitude || 46.6753;
  const address = data.locationText || "King Fahd Road, Al-Olaya, Riyadh";
  const rawDesc = data.description.trim() || "Road surface defect reported by resident.";

  let severity = "high";
  let aiDescription = rawDesc;
  let aiDescriptionAr = "تم رصد بلاغ عن ضرر في الطريق";
  let confidence = 0.94;
  let category = "pothole";

  // Step 1: Real AI Vision analysis via Amazon Bedrock Claude Sonnet
  if (data.photoBase64) {
    try {
      const base64Data = data.photoBase64.includes(",")
        ? data.photoBase64.split(",")[1]
        : data.photoBase64;

      const prompt = `You are a road safety inspector analyzing a photo.
Determine if this image shows a pothole or significant road damage.
Respond ONLY with valid JSON in this exact format:
{
  "confirmed": true,
  "confidence": "high",
  "severity": "critical",
  "description": "one sentence in English describing what you see",
  "description_ar": "نفس الجملة باللغة العربية"
}`;

      const bedrockRes = await bedrock.send(
        new InvokeModelCommand({
          modelId: "us.anthropic.claude-sonnet-4-6",
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 300,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: "image/jpeg",
                      data: base64Data,
                    },
                  },
                  { type: "text", text: prompt },
                ],
              },
            ],
          }),
        })
      );

      const decoded = JSON.parse(new TextDecoder().decode(bedrockRes.body));
      const responseText = decoded.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.severity) severity = parsed.severity.toLowerCase();
        if (parsed.description) aiDescription = parsed.description;
        if (parsed.description_ar) aiDescriptionAr = parsed.description_ar;
        confidence = parsed.confidence === "high" ? 0.96 : parsed.confidence === "medium" ? 0.85 : 0.7;
      }
    } catch (err: any) {
      console.warn("Bedrock vision call error, using local classification:", err?.message || err);
    }
  }

  // Category identification
  const lowerDesc = (rawDesc + " " + aiDescription).toLowerCase();
  if (lowerDesc.includes("flood") || lowerDesc.includes("water") || lowerDesc.includes("drain")) {
    category = "water";
  } else if (lowerDesc.includes("light") || lowerDesc.includes("dark") || lowerDesc.includes("lamp")) {
    category = "lighting";
  } else if (lowerDesc.includes("waste") || lowerDesc.includes("trash") || lowerDesc.includes("garbage")) {
    category = "waste";
  } else {
    category = "pothole";
  }

  // Step 2: Nearby reports clustering (Haversine within 1.0 km)
  let nearbyCount = 0;
  try {
    const existing = await ddb.send(new ScanCommand({ TableName: tableName }));
    for (const item of existing.Items || []) {
      if (item.latitude && item.longitude) {
        const dist = haversineKm(lat, lon, parseFloat(item.latitude), parseFloat(item.longitude));
        if (dist <= 1.0) nearbyCount++;
      }
    }
  } catch (err) {
    console.warn("Nearby scanning error:", err);
  }

  // Step 3: Priority calculation matching tools.py: calculate_priority
  const baseScoreMap: Record<string, number> = {
    critical: 80,
    high: 60,
    medium: 40,
    low: 20,
  };
  const base = baseScoreMap[severity] || 40;
  const clusterBonus = Math.min(nearbyCount * 3, 15);
  const priorityScore = Math.min(base + clusterBonus, 100);

  let slaDays = 7;
  if (priorityScore >= 80) slaDays = 1;
  else if (priorityScore >= 60) slaDays = 7;
  else if (priorityScore >= 40) slaDays = 30;
  else slaDays = 60;

  // Step 4: Write to real DynamoDB table
  const rawItem = {
    report_id: reportId,
    resident_id: "resident-citizen",
    category,
    source: "manual",
    latitude: lat.toFixed(6),
    longitude: lon.toFixed(6),
    address,
    severity,
    priority_score: priorityScore,
    description: aiDescription,
    description_ar: aiDescriptionAr,
    status: "NEW",
    photo_url: data.photoBase64 ? "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=960&q=80" : "",
    created_at: now,
    reported_date: now.slice(0, 10),
    sla_days: String(slaDays),
  };

  await ddb.send(new PutCommand({ TableName: tableName, Item: rawItem }));

  return normalizeDynamoItem(rawItem);
}

function computeStats(reports: MunicipalIncident[]): OperationalStats {
  const open = reports.filter((r) => r.status !== "resolved");
  const highOrCritical = open.filter(
    (r) => r.aiAnalysis.severityLevel === "high" || r.aiAnalysis.severityLevel === "critical"
  ).length;
  const overdue = open.filter((r) => r.sla.isOverdue).length;
  const escalated = open.filter((r) => r.status === "escalated").length;

  return {
    totalOpen: open.length,
    highOrCritical,
    overdue,
    escalated,
  };
}
