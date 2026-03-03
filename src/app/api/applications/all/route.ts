import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/applications/all?limit=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const admin = getSupabaseAdmin();

  const { data: apps, error } = await admin
    .from("applications")
    .select("*, jobs(id, title, department)")
    .order("applied_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!apps || apps.length === 0) return NextResponse.json([]);

  // Manually join profiles (FK is to auth.users, not profiles)
  const candidateIds = [...new Set(apps.map((a) => a.candidate_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, name, email")
    .in("id", candidateIds);
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const merged = apps.map((a) => ({ ...a, profiles: profileMap[a.candidate_id] ?? null }));
  return NextResponse.json(merged);
}
