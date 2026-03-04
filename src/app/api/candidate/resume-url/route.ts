/**
 * GET /api/candidate/resume-url?path=resumes/{userId}/resume.pdf
 *
 * Returns a signed URL for a private resume in Supabase Storage.
 * Used by recruiters to view candidate resumes from the ATS panel.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const storedPath = req.nextUrl.searchParams.get("path");

  if (!storedPath) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  // The stored path is like "resumes/{userId}/resume.pdf"
  // The bucket name is "resumes", so strip the leading "resumes/" prefix
  const filePath = storedPath.replace(/^resumes\//, "");

  const admin = getSupabaseAdmin();

  const { data, error } = await admin.storage
    .from("resumes")
    .createSignedUrl(filePath, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "Failed to generate URL" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
