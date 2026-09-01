import { NextResponse } from "next/server";
import { fetchAllIncidents } from "@/lib/citypulse-server";
import type { IncidentsApiResponse } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const data = await fetchAllIncidents();

  const response: IncidentsApiResponse = {
    reports: data.reports,
    stats: data.stats,
    total: data.reports.length,
    synced: new Date().toISOString(),
    source: data.source,
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
