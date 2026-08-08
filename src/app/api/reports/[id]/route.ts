import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/reports/[id] — fetch report by report ID OR interview ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing report id" }, { status: 400 });

    const admin = getSupabaseAdmin();

    // Query by report ID or interview ID
    let { data: report } = await admin
      .from("reports")
      .select("*")
      .or(`id.eq.${id},interview_id.eq.${id}`)
      .maybeSingle();

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Enrich profile and job info
    const [{ data: profile }, { data: interview }] = await Promise.all([
      report.candidate_id ? admin.from("profiles").select("id, name, email").eq("id", report.candidate_id).maybeSingle() : Promise.resolve({ data: null }),
      report.interview_id ? admin.from("interviews").select("id, job_id, status, score").eq("id", report.interview_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    let job = null;
    if (interview?.job_id) {
      const { data: j } = await admin.from("jobs").select("id, title, department").eq("id", interview.job_id).maybeSingle();
      job = j;
    }

    const enriched = {
      ...report,
      profiles: profile,
      interviews: interview ? { ...interview, jobs: job } : null,
    };

    return NextResponse.json({ data: enriched });
  } catch (err: any) {
    console.error("GET /api/reports/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch report" }, { status: 500 });
  }
}
