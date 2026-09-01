import type { SeverityLevel, ReportStatus, ActionType } from "@/types";

// ─── Severity Colors & Badges ────────────────────────────────────────────────
export const SEV_INFO: Record<
  SeverityLevel,
  { label: string; text: string; bg: string; border: string; badgeBg: string }
> = {
  critical: {
    label: "Critical",
    text: "#991b1b",
    bg: "#fef2f2",
    border: "#fecaca",
    badgeBg: "#ef4444",
  },
  high: {
    label: "High",
    text: "#c2410c",
    bg: "#fff7ed",
    border: "#ffedd5",
    badgeBg: "#f97316",
  },
  medium: {
    label: "Medium",
    text: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    badgeBg: "#f59e0b",
  },
  low: {
    label: "Low",
    text: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    badgeBg: "#22c55e",
  },
};

export function getScoreColor(score: number): { text: string; bg: string; ring: string } {
  if (score >= 76) {
    return { text: "#dc2626", bg: "#fef2f2", ring: "#f87171" };
  }
  if (score >= 51) {
    return { text: "#ea580c", bg: "#fff7ed", ring: "#fb923c" };
  }
  if (score >= 26) {
    return { text: "#d97706", bg: "#fffbeb", ring: "#fcd34d" };
  }
  return { text: "#16a34a", bg: "#f0fdf4", ring: "#86efac" };
}

// ─── Status Badges ───────────────────────────────────────────────────────────
export const STATUS_INFO: Record<
  ReportStatus,
  { label: string; text: string; bg: string; border: string }
> = {
  new: {
    label: "New",
    text: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  under_review: {
    label: "In Review",
    text: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  in_progress: {
    label: "In Progress",
    text: "#0d9488",
    bg: "#f0fdfa",
    border: "#99f6e4",
  },
  escalated: {
    label: "Escalated",
    text: "#be123c",
    bg: "#fff1f2",
    border: "#fecdd3",
  },
  resolved: {
    label: "Resolved",
    text: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
};

// ─── Priority Colors ─────────────────────────────────────────────────────────
export const PRIORITY_INFO = {
  immediate: { label: "Immediate", text: "#991b1b", bg: "#fef2f2", border: "#fca5a5" },
  high: { label: "High Priority", text: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  normal: { label: "Routine", text: "#374151", bg: "#f3f4f6", border: "#e5e7eb" },
};

// ─── Date Formats ─────────────────────────────────────────────────────────────
export function formatRelativeTime(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMinutes = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes === 1) return "1 min ago";
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  } catch {
    return "Recent";
  }
}

export function formatDateTime(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return isoDate;
  }
}

export function formatClockTime(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "--:--:--";
  }
}
