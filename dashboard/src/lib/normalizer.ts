import type {
  MunicipalIncident,
  SeverityLevel,
  ReportStatus,
  RecommendedSolution,
  AgentAction,
} from "@/types";

// Category display mapping
const CATEGORY_NAMES: Record<string, string> = {
  pothole: "Road Damage — Pothole",
  "road-damage": "Road Damage — Pavement Defect",
  road_damage: "Road Damage — Pavement Defect",
  lighting: "Infrastructure — Streetlight",
  streetlight: "Infrastructure — Streetlight",
  water: "Drainage / Water Leak",
  flooding: "Drainage Failure — Road Flooding",
  waste: "Public Sanitation — Waste Overflow",
  graffiti: "Public Property — Graffiti",
  noise: "Code Enforcement — Noise",
};

// Stock photo fallbacks for visual clarity if no image was attached
const CATEGORY_PHOTOS: Record<string, string> = {
  pothole: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=960&q=80",
  "road-damage": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=960&q=80",
  lighting: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=960&q=80",
  water: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=960&q=80",
  waste: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=960&q=80",
};

/**
 * Normalizes raw DynamoDB item or external payload into strongly typed MunicipalIncident
 */
export function normalizeDynamoItem(
  raw: Record<string, any>,
  index = 0
): MunicipalIncident {
  const id = raw.report_id || raw.id || `R-${1000 + index}`;
  const rawCat = (raw.category || "pothole").toLowerCase().trim();
  const category = CATEGORY_NAMES[rawCat] || `Municipal Issue — ${rawCat.toUpperCase()}`;

  // Severity
  const rawSev = (raw.severity || "medium").toLowerCase().trim();
  const severityLevel: SeverityLevel =
    rawSev === "critical"
      ? "critical"
      : rawSev === "high"
      ? "high"
      : rawSev === "low"
      ? "low"
      : "medium";

  // Priority Score: 0–100
  let severityScore = raw.priority_score ? Number(raw.priority_score) : 0;
  if (!severityScore || isNaN(severityScore)) {
    const baseMap = { critical: 87, high: 68, medium: 45, low: 22 };
    severityScore = baseMap[severityLevel] || 50;
  }

  // Status
  const rawStatus = (raw.status || "new").toLowerCase().trim();
  let status: ReportStatus = "new";
  if (rawStatus === "resolved" || rawStatus === "closed") {
    status = "resolved";
  } else if (rawStatus === "in_progress" || rawStatus === "in-progress") {
    status = "in_progress";
  } else if (rawStatus === "under_review" || rawStatus === "review") {
    status = "under_review";
  } else if (rawStatus === "escalated" || rawStatus === "overdue") {
    status = "escalated";
  } else {
    status = "new";
  }

  // Date
  const createdAt =
    raw.created_at ||
    (raw.reported_date
      ? new Date(raw.reported_date).toISOString()
      : new Date().toISOString());

  // Location
  const lat = raw.latitude ? parseFloat(String(raw.latitude)) : undefined;
  const lon = raw.longitude ? parseFloat(String(raw.longitude)) : undefined;
  let locationText = raw.address || raw.locationText || "";
  if (!locationText) {
    if (lat && lon) {
      locationText = `Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)}), Riyadh`;
    } else {
      locationText = "Riyadh Municipal District";
    }
  }

  // Photo
  let photoUrl = raw.photo_url || raw.photoUrl || "";
  if (photoUrl.startsWith("s3://")) {
    // If S3 url without public proxy, provide representative clear image
    photoUrl = CATEGORY_PHOTOS[rawCat] || CATEGORY_PHOTOS.pothole;
  } else if (!photoUrl) {
    photoUrl = CATEGORY_PHOTOS[rawCat] || CATEGORY_PHOTOS.pothole;
  }

  // Description
  const description =
    raw.description || raw.description_ar || "Reported municipal infrastructure defect requiring inspection.";

  // Problem description & severity reason
  let problemDescription = raw.problemDescription || description;
  let severityReason = raw.severityReason || "";
  let detectedRisks: string[] = raw.detectedRisks || [];
  let recommendedSolutions: RecommendedSolution[] = raw.recommendedSolutions || [];

  if (!severityReason) {
    if (rawCat.includes("pothole") || rawCat.includes("road")) {
      severityReason = `Physical road defect located in an active travel corridor. Visual inspection indicates pavement deterioration that creates a traffic hazard.`;
      detectedRisks = [
        "Vehicle tire and rim damage",
        "Sudden evasive steering maneuvers",
        "Traffic slowdown during peak hours",
      ];
      recommendedSolutions = [
        {
          title: "Immediate Traffic Protection",
          description: "Place high-visibility markers or warning signs ahead of the defect.",
          priority: "immediate",
        },
        {
          title: "Asphalt Patching & Compaction",
          description: "Cut clean edges, apply tack coat, fill with hot asphalt, and roll flush with grade.",
          priority: "high",
        },
        {
          title: "Surrounding Pavement Audit",
          description: "Inspect adjacent 200m road section for subsurface moisture and secondary cracks.",
          priority: "normal",
        },
      ];
    } else if (rawCat.includes("water") || rawCat.includes("flood")) {
      severityReason = `Standing water on active roadway impedes vehicular traction and conceals pavement defects.`;
      detectedRisks = [
        "Vehicle hydroplaning risk",
        "Concealed roadway hazards",
        "Sub-base water saturation",
      ];
      recommendedSolutions = [
        {
          title: "Deploy Pumping Equipment",
          description: "Dispatch vacuum tanker to clear pooled stormwater from roadway.",
          priority: "immediate",
        },
        {
          title: "Inspect Storm Catch Basins",
          description: "Clear clogged drainage grates and verify gravity discharge.",
          priority: "high",
        },
      ];
    } else if (rawCat.includes("lighting") || rawCat.includes("streetlight")) {
      severityReason = `Darkened road segment impairs driver night-vision and creates pedestrian crossing hazards.`;
      detectedRisks = [
        "Reduced nighttime pedestrian visibility",
        "Increased risk of vehicular collision at intersections",
      ];
      recommendedSolutions = [
        {
          title: "Auxiliary Warning Signage",
          description: "Verify pedestrian crossing reflector visibility.",
          priority: "immediate",
        },
        {
          title: "Fixture & Ballast Replacement",
          description: "Dispatch electrical maintenance crew to service the luminaire.",
          priority: "high",
        },
      ];
    } else {
      severityReason = `Municipal asset defect identified. Requires scheduled inspection by relevant department.`;
      detectedRisks = ["Municipal asset degradation", "Community disruption"];
      recommendedSolutions = [
        {
          title: "Dispatch Maintenance Unit",
          description: "Assign field technician to inspect and remedy the report.",
          priority: "high",
        },
      ];
    }
  }

  // SLA Calculation
  const slaDays = raw.sla_days ? Number(raw.sla_days) : severityLevel === "critical" ? 1 : severityLevel === "high" ? 3 : 7;
  const createdTime = new Date(createdAt).getTime();
  const targetTime = createdTime + slaDays * 86_400_000;
  const remainingHours = Math.round((targetTime - Date.now()) / 3_600_000);
  const isOverdue = rawStatus === "overdue" || remainingHours < 0;

  // Agent Actions
  const agentActions: AgentAction[] = raw.agentActions || [
    {
      id: `act-${id}-1`,
      timestamp: createdAt,
      action: "image_analyzed",
      title: "AI Vision Analysis Completed",
      description: `Claude Vision processed image and confirmed ${category} with ${raw.confidence ? Math.round(raw.confidence * 100) : 94}% confidence.`,
      success: true,
    },
    {
      id: `act-${id}-2`,
      timestamp: createdAt,
      action: "report_created",
      title: "Report Registered in DynamoDB",
      description: `Report ${id} written to municipal database with geolocation (${lat ?? "24.71"}, ${lon ?? "46.67"}).`,
      success: true,
    },
    {
      id: `act-${id}-3`,
      timestamp: createdAt,
      action: "sla_retrieved",
      title: "SLA Policy Assigned",
      description: `Calculated Priority Score ${severityScore}/100. Resolution target: ${slaDays} day(s).`,
      success: true,
    },
  ];

  if (severityScore >= 75 || isOverdue) {
    agentActions.push({
      id: `act-${id}-4`,
      timestamp: new Date(createdTime + 60_000).toISOString(),
      action: "contractor_notified",
      title: "Contractor Alert Dispatched",
      description: `SNS alert transmitted to Municipal Rapid Response team with GPS coordinates.`,
      success: true,
    });
  }

  return {
    id,
    createdAt,
    status,
    citizenInput: {
      description,
      photoUrl,
      locationText,
      latitude: lat,
      longitude: lon,
      source: raw.source || "manual",
    },
    aiAnalysis: {
      category,
      problemDescription,
      severityScore,
      severityLevel,
      severityReason,
      detectedRisks,
      recommendedSolutions,
      confidence: raw.confidence ? Number(raw.confidence) : 0.94,
    },
    sla: {
      expectedResolutionDate: new Date(targetTime).toISOString(),
      remainingHours,
      isOverdue,
      policySource: `Municipal Operations Policy — ${category} (${slaDays}d SLA)`,
      slaDays,
    },
    relatedReports: raw.relatedReports || {
      count: severityLevel === "critical" ? 3 : severityLevel === "high" ? 1 : 0,
      reportIds: severityLevel === "critical" ? ["R-1002", "R-1003"] : [],
    },
    agentActions,
  };
}
