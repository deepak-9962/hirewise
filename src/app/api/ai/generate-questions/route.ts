import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function buildFallbackQuestions(jobTitle: string, skills: string[], count: number) {
  const skillList = skills.length ? skills : ["General Software Engineering"];
  const questions: any[] = [];

  const descriptiveTemplates = [
    (s: string) => ({ text: `Explain your experience with ${s} and describe a challenging problem you solved using it.`, type: "descriptive", skill: s, difficulty: "Medium", time_limit: 300 }),
    (s: string) => ({ text: `What are the best practices for ${s} in a production environment?`, type: "descriptive", skill: s, difficulty: "Easy", time_limit: 240 }),
    (s: string) => ({ text: `Describe a time you optimised performance using ${s}. What metrics improved?`, type: "descriptive", skill: s, difficulty: "Hard", time_limit: 360 }),
  ];
  const codingTemplates = [
    (s: string) => ({ text: `Write a function using ${s} that reverses a linked list without extra space.`, type: "coding", skill: s, difficulty: "Medium", time_limit: 600, language: "javascript", starter_code: `// Reverse a linked list\nfunction reverseList(head) {\n  // Your code here\n}\n` }),
    (s: string) => ({ text: `Implement a debounce utility function relevant to ${s} development.`, type: "coding", skill: s, difficulty: "Easy", time_limit: 450, language: "javascript", starter_code: `function debounce(fn, delay) {\n  // Your code here\n}\n` }),
  ];

  for (let i = 0; i < count; i++) {
    const skill = skillList[i % skillList.length];
    if (i % 3 === 2) {
      questions.push(codingTemplates[i % codingTemplates.length](skill));
    } else {
      questions.push(descriptiveTemplates[i % descriptiveTemplates.length](skill));
    }
  }
  return questions.slice(0, count);
}

// POST /api/ai/generate-questions
// Body: { job_id, job_title, skills, count }
export async function POST(req: NextRequest) {
  try {
  const { job_id, job_title, skills, count = 5 } = await req.json();

  if (!job_id || !job_title) {
    return NextResponse.json({ error: "job_id and job_title required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Get current recruiter user from Supabase (first recruiter found)
  const { data: recruiter } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "recruiter")
    .limit(1)
    .single();

  // Generate questions via Gemini, fallback to templates on quota/error
  let generated: any[];
  try {
    const { generateQuestions } = await import("@/lib/gemini");
    generated = await generateQuestions(job_title, skills ?? [], count);
  } catch (aiErr: any) {
    console.warn("[generate-questions] Gemini unavailable, using fallback templates:", aiErr?.message);
    generated = buildFallbackQuestions(job_title, skills ?? [], count);
  }

  // Insert into questions table and link to job
  const createdQuestions = [];
  let orderIndex = 0;

  // Get current max order_index for this job
  const { data: existingLinks } = await admin
    .from("job_questions")
    .select("order_index")
    .eq("job_id", job_id)
    .order("order_index", { ascending: false })
    .limit(1);

  orderIndex = (existingLinks?.[0]?.order_index ?? -1) + 1;

  for (const q of generated) {
    const { data: question, error } = await admin
      .from("questions")
      .insert({
        text: q.text,
        type: q.type,
        skill: q.skill,
        difficulty: q.difficulty,
        time_limit: q.time_limit,
        starter_code: q.starter_code ?? null,
        language: q.language ?? null,
        job_id,
        created_by: recruiter?.id ?? null,
      })
      .select()
      .single();

    if (error || !question) continue;

    // Link to job
    await admin.from("job_questions").insert({
      job_id,
      question_id: question.id,
      order_index: orderIndex++,
      time_limit_seconds: q.time_limit,
    });

    createdQuestions.push(question);
  }

  return NextResponse.json({ success: true, questions: createdQuestions });
  } catch (err: any) {
    console.error("[generate-questions] error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to generate questions" }, { status: 500 });
  }
}
