// ─── CityPulse / Wasel Municipal Operations Domain Types ──────────────────────

export type SeverityLevel = "critical" | "high" | "medium" | "low";

export type ReportStatus = "new" | "under_review" | "in_progress" | "escalated" | "resolved";

export type ActionType =
  | "image_analyzed"
  | "report_created"
  | "sla_retrieved"
  | "nearby_reports_checked"
  | "report_escalated"
  | "community_alert_sent"
  | "contractor_notified";

export interface AgentAction {
  id: string;
  timestamp: string; // ISO-8601
  action: ActionType;
  title: string;       // display label
  description: string; // observable result only — never chain-of-thought
  success: boolean;
}

export interface RecommendedSolution {
  title: string;
  description: string;
  priority: "immediate" | "high" | "normal";
}

/** Normalized frontend incident consumed by the UI */
export interface MunicipalIncident {
  id: string;
  createdAt: string; // ISO-8601
  status: ReportStatus;

  citizenInput: {
    description: string;
    photoUrl?: string;
    locationText: string;
    latitude?: number;
    longitude?: number;
    source?: "manual" | "motion";
  };

  aiAnalysis: {
    category: string;  // e.g. "Road Damage — Pothole"
    problemDescription: string;
    /**
     * 1–100 integer score.
     * Low: 1–25, Medium: 26–50, High: 51–75, Critical: 76–100
     */
    severityScore: number;
    severityLevel: SeverityLevel;
    severityReason: string;
    detectedRisks: string[];
    recommendedSolutions: RecommendedSolution[];
    confidence?: number;
  };

  sla: {
    expectedResolutionDate: string;
    remainingHours: number;   // negative = overdue
    isOverdue: boolean;
    policySource: string;
    slaDays: number;
  };

  relatedReports: {
    count: number;
    reportIds: string[];
  };

  agentActions: AgentAction[];
}

export interface OperationalStats {
  totalOpen: number;
  highOrCritical: number;
  overdue: number;
  escalated: number;
}

export interface IncidentsApiResponse {
  reports: MunicipalIncident[];
  stats: OperationalStats;
  total: number;
  synced: string;
  source: "dynamodb" | "fallback";
}
