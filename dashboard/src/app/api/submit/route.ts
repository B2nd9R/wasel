import { NextResponse } from "next/server";
import { submitNewReport } from "@/lib/citypulse-server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await submitNewReport(body);
    return NextResponse.json({ success: true, report: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to submit report" },
      { status: 500 }
    );
  }
}
