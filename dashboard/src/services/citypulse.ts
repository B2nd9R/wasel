/**
 * CityPulse client service — all fetch calls go through here.
 * Server components call these directly; client components use them via hooks.
 * No AWS credentials ever reach the browser.
 */

import type {
  MunicipalIncident,
  IncidentsApiResponse,
  OperationalStats,
  AgentAction,
} from "@/types";

const BASE = "/api";

export async function fetchIncidents(): Promise<IncidentsApiResponse> {
  const res = await fetch(`${BASE}/reports`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

export async function fetchStats(): Promise<OperationalStats> {
  const res = await fetch(`${BASE}/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchReport(id: string): Promise<MunicipalIncident | null> {
  const res = await fetch(`${BASE}/reports/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch report");
  return res.json();
}

export async function fetchActivity(limit = 50): Promise<{ actions: AgentAction[] }> {
  const res = await fetch(`${BASE}/activity?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json();
}
