import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/ats/notes — Add a note to an application
export async function POST(req: NextRequest) {
  const { application_id, author_id, content } = await req.json();

  if (!application_id || !author_id || !content?.trim()) {
    return NextResponse.json({ error: "application_id, author_id, and content required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Try to insert into pipeline_notes table
  const { data, error } = await admin
    .from("pipeline_notes")
    .insert({ application_id, author_id, content: content.trim() })
    .select()
    .single();

  if (error) {
    // If table doesn't exist, return a helpful message
    if (error.message?.includes("relation") || error.code === "42P01") {
      return NextResponse.json(
        { error: "pipeline_notes table not created yet. Run the ATS migration SQL." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with author name
  const { data: profile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", author_id)
    .single();

  return NextResponse.json({ ...data, author_name: profile?.name ?? "Unknown" }, { status: 201 });
}

// GET /api/ats/notes?application_id=xxx — Get notes for an application
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get("application_id");

  if (!applicationId) {
    return NextResponse.json({ error: "application_id required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: notes, error } = await admin
    .from("pipeline_notes")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json([]);
  }

  // Enrich with author names
  const authorIds = [...new Set((notes ?? []).map((n: any) => n.author_id).filter(Boolean))];
  let authorMap = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await admin.from("profiles").select("id, name").in("id", authorIds);
    authorMap = new Map((profiles ?? []).map((p: any) => [p.id, p.name]));
  }

  const enriched = (notes ?? []).map((n: any) => ({
    ...n,
    author_name: authorMap.get(n.author_id) ?? "Unknown",
  }));

  return NextResponse.json(enriched);
}
