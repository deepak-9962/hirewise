/**
 * POST /api/ai/resume-score
 *
 * Score one or many candidate resumes against a job using AI.
 * Body: { application_id: string } or { application_ids: string[] }
 *
 * Flow per application:
 *   1. Fetch application + job + profile from Supabase
 *   2. Download resume PDF from Supabase Storage
 *   3. Extract text with pdf-parse
 *   4. Call scoreResume() (Ollama / Mistral)
 *   5. Upsert result into resume_scores table
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { scoreResume } from "@/lib/gemini";

// pdf-parse v1 — simple CJS function(buffer) → Promise<{text}>
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text ?? "";
}

// ── helpers ────────────────────────────────────────────────

async function scoreOneApplication(admin: ReturnType<typeof getSupabaseAdmin>, applicationId: string) {
  // 1. Fetch application
  const { data: app, error: appErr } = await admin
    .from("applications")
    .select("id, job_id, candidate_id, status")
    .eq("id", applicationId)
    .single();

  if (appErr || !app) throw new Error(`Application not found: ${applicationId}`);

  // 2. Fetch job details
  const { data: job } = await admin
    .from("jobs")
    .select("id, title, description, target_skills")
    .eq("id", (app as any).job_id)
    .single();

  if (!job) throw new Error(`Job not found for application: ${applicationId}`);

  // 3. Fetch candidate profile
  const { data: profile } = await admin
    .from("profiles")
    .select("id, name, skills, resume_url")
    .eq("id", (app as any).candidate_id)
    .single();

  if (!profile) throw new Error(`Profile not found for application: ${applicationId}`);

  // 4. Determine resume path and strip "resumes/" prefix since bucket name is "resumes"
  const rawPath = (profile as any).resume_url;
  if (!rawPath) throw new Error(`No resume found for application: ${applicationId}`);
  const resumePath = rawPath.replace(/^resumes\//, "");

  // 5. Download resume from Supabase Storage
  const { data: fileData, error: dlErr } = await admin.storage
    .from("resumes")
    .download(resumePath);

  if (dlErr || !fileData) throw new Error(`Failed to download resume: ${dlErr?.message ?? "no data"}`);

  const buffer = Buffer.from(await fileData.arrayBuffer());

  // 6. Extract text
  const resumeText = await extractPdfText(buffer);
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error(`Resume text too short or empty for application: ${applicationId}`);
  }

  // 7. Call AI scoring
  const jobSkills: string[] = Array.isArray((job as any).target_skills) ? (job as any).target_skills : [];
  const candidateSkills: string[] = Array.isArray((profile as any).skills) ? (profile as any).skills : [];

  const scores = await scoreResume(
    resumeText,
    (job as any).title ?? "",
    (job as any).description ?? "",
    jobSkills,
    candidateSkills,
  );

  // 8. Upsert into resume_scores
  const row = {
    application_id: applicationId,
    job_id: (app as any).job_id,
    candidate_id: (app as any).candidate_id,
    overall_score: scores.overall_score,
    skill_match_score: scores.skill_match_score,
    experience_score: scores.experience_score,
    education_score: scores.education_score,
    keyword_matches: scores.keyword_matches,
    missing_skills: scores.missing_skills,
    recommendation: scores.recommendation,
    ai_summary: scores.summary,
    parsed_resume_text: resumeText.slice(0, 50000), // cap storage
    scored_at: new Date().toISOString(),
  };

  const { data: upserted, error: upsertErr } = await admin
    .from("resume_scores")
    .upsert(row, { onConflict: "application_id" })
    .select()
    .single();

  if (upsertErr) throw new Error(`Failed to save score: ${upsertErr.message}`);

  return upserted;
}

// ── POST handler ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = getSupabaseAdmin();

    // Single application
    if (body.application_id && typeof body.application_id === "string") {
      const result = await scoreOneApplication(admin, body.application_id);
      return NextResponse.json({ ok: true, scores: [result] });
    }

    // Bulk scoring
    if (Array.isArray(body.application_ids) && body.application_ids.length > 0) {
      const ids: string[] = body.application_ids.slice(0, 25); // cap at 25
      const results: { id: string; score: any; error?: string }[] = [];

      // Score sequentially to avoid overwhelming Ollama
      for (const id of ids) {
        try {
          const score = await scoreOneApplication(admin, id);
          results.push({ id, score });
        } catch (err: any) {
          results.push({ id, score: null, error: err.message });
        }
      }

      return NextResponse.json({ ok: true, scores: results });
    }

    return NextResponse.json(
      { error: "Provide application_id (string) or application_ids (string[])" },
      { status: 400 },
    );
  } catch (err: any) {
    console.error("[resume-score] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
