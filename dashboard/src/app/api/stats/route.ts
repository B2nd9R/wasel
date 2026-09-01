import { NextResponse } from "next/server";
import { fetchAllIncidents } from "@/lib/citypulse-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const data = await fetchAllIncidents();
  return NextResponse.json(data.stats, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
