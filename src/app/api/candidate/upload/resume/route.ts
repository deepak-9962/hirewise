import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["application/pdf"];

// POST /api/candidate/upload/resume — upload or replace resume
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are accepted" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 10 MB" },
        { status: 400 }
      );
    }

    const filePath = `${user.id}/resume.pdf`;

    // Upload to Supabase Storage (upsert to replace existing)
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Generate a signed URL (valid for 1 hour) since resumes bucket is private
    const { data: signedUrlData, error: signError } = await supabase.storage
      .from("resumes")
      .createSignedUrl(filePath, 3600);

    const resumeUrl = signedUrlData?.signedUrl || "";

    if (signError) {
      return NextResponse.json({ error: signError.message }, { status: 500 });
    }

    // Store a reference path (not the signed URL) in the profile
    const storedPath = `resumes/${filePath}`;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ resume_url: storedPath })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { resume_url: storedPath, signed_url: resumeUrl } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
