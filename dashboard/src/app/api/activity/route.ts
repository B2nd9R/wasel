import { NextResponse } from "next/server";
import { fetchAllIncidents } from "@/lib/citypulse-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const data = await fetchAllIncidents();
  const allActions = data.reports.flatMap((r) => r.agentActions);
  allActions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return NextResponse.json({ actions: allActions.slice(0, limit) });
}
