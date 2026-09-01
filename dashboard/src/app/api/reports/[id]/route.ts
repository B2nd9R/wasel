import { NextResponse } from "next/server";
import { fetchAllIncidents } from "@/lib/citypulse-server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await fetchAllIncidents();
  const report = data.reports.find((r) => r.id === id);
  if (!report) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(report);
}
