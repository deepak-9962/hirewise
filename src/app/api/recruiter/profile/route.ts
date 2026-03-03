import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/recruiter/profile?id=<uid>
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("id, name, email, phone, location, experience, skills, avatar_url, created_at, role")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/recruiter/profile
// body: { id, name, phone, location, experience, skills, avatar_url }
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Allow only safe fields
  const allowed = ["name", "phone", "location", "experience", "skills", "avatar_url"];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .update(filtered)
    .eq("id", id)
    .select("id, name, email, phone, location, experience, skills, avatar_url, created_at, role")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
