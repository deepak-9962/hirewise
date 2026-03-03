/**
 * HIREWISE — AI Functions (evaluate, report, questions)
 *
 * Uses the modular ai-engine for provider abstraction (Ollama / Gemini),
 * ai-validation for Zod schema parsing, and ai-sanitize for security.
 */

import { aiGenerate } from "@/lib/ai-engine";
import {
  CodingEvaluationSchema,
  DescriptiveEvaluationSchema,
  ReportSchema,
  GeneratedQuestionSchema,
  FALLBACK_CODING_EVALUATION,
  FALLBACK_DESCRIPTIVE_EVALUATION,
  FALLBACK_REPORT,
  parseAIResponse,
} from "@/lib/ai-validation";
import { sanitizeInput } from "@/lib/ai-sanitize";

// ── Backward-compat: deprecated geminiModel proxy ──────────
// Some routes (run-code) may still import this. Provides a
// .generateContent()-like shim that routes through ai-engine.
export const geminiModel = {
  async generateContent(prompt: string) {
    const text = await aiGenerate(typeof prompt === "string" ? prompt : String(prompt));
    return {
      response: {
        text: () => text,
      },
    };
  },
};

// ── Scoring rubric (shared across prompts) ─────────────────
const SCORING_RUBRIC = `
Scoring rubric:
  90-100 — Expert: Exceptional answer demonstrating deep mastery
  70-89  — Proficient: Strong answer with minor gaps
  50-69  — Developing: Partially correct, notable gaps
  0-49   — Insufficient: Incorrect or largely incomplete

IMPORTANT: Score based ONLY on the provided answer. Do not infer or assume knowledge not demonstrated. Be fair but strict.`;

// ── evaluateAnswer ─────────────────────────────────────────

export async function evaluateAnswer(
  question: string,
  answer: string,
  type: "descriptive" | "coding",
  skill: string,
  difficulty: string,
) {
  const safeQuestion = sanitizeInput(question, 2000);
  const safeAnswer = sanitizeInput(answer, 6000);
  const safeSkill = sanitizeInput(skill, 200);

  const prompt =
    type === "coding"
      ? `You are an expert technical interviewer evaluating a coding interview response.

Question: ${safeQuestion}
Skill Area: ${safeSkill}
Difficulty: ${difficulty}
Candidate's Code:
\`\`\`
${safeAnswer}
\`\`\`

${SCORING_RUBRIC}

Evaluate this code and respond in STRICT JSON format only (no markdown, no explanation, no code fences):
{
  "score": <number 0-100>,
  "correctness": <number 0-100>,
  "efficiency": <number 0-100>,
  "codeQuality": <number 0-100>,
  "feedback": "<2-3 sentence evaluation>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "executionResult": "<expected output or explanation of what the code would produce>"
}`
      : `You are an expert technical interviewer evaluating a descriptive interview response.

Question: ${safeQuestion}
Skill Area: ${safeSkill}
Difficulty: ${difficulty}
Candidate's Answer: ${safeAnswer}

${SCORING_RUBRIC}

Evaluate this response and respond in STRICT JSON format only (no markdown, no explanation, no code fences):
{
  "score": <number 0-100>,
  "technical": <number 0-100>,
  "communication": <number 0-100>,
  "reasoning": <number 0-100>,
  "feedback": "<2-3 sentence evaluation>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;

  const raw = await aiGenerate(prompt, { skipCache: true });
  const retryFn = async () => aiGenerate(prompt, { skipCache: true });

  if (type === "coding") {
    const result = await parseAIResponse(raw, CodingEvaluationSchema, retryFn);
    if (result.valid) return result.data;
    console.warn("[evaluateAnswer] Validation failed (coding), using fallback:", result.errors);
    return FALLBACK_CODING_EVALUATION;
  } else {
    const result = await parseAIResponse(raw, DescriptiveEvaluationSchema, retryFn);
    if (result.valid) return result.data;
    console.warn("[evaluateAnswer] Validation failed (descriptive), using fallback:", result.errors);
    return FALLBACK_DESCRIPTIVE_EVALUATION;
  }
}

// ── generateReport ─────────────────────────────────────────

export async function generateReport(
  questions: { question: string; answer: string; type: string; skill: string; difficulty: string; score: number }[],
) {
  const summaryData = questions
    .map((q, i) => `Q${i + 1} [${q.skill} - ${q.difficulty} - ${q.type}]: Score ${q.score}/100`)
    .join("\n");
  const avgScore = Math.round(questions.reduce((s, q) => s + q.score, 0) / questions.length);

  const prompt = `You are an AI interviewing platform generating a comprehensive candidate evaluation report.

Interview Summary:
${summaryData}
Average Score: ${avgScore}/100

Full Q&A:
${questions.map((q, i) => `
Q${i + 1}: ${sanitizeInput(q.question, 1000)}
A${i + 1}: ${sanitizeInput(q.answer, 3000)}
Score: ${q.score}/100
`).join("\n")}

${SCORING_RUBRIC}

Generate a report in STRICT JSON format only (no markdown, no explanation, no code fences):
{
  "overallScore": ${avgScore},
  "technicalScore": <number 0-100>,
  "communicationScore": <number 0-100>,
  "reasoningScore": <number 0-100>,
  "summary": "<3-4 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<area for improvement 1>", "<area for improvement 2>"],
  "recommendation": "<hire/consider/reject with brief justification>"
}`;

  const raw = await aiGenerate(prompt, { skipCache: true });

  const retryFn = async () => aiGenerate(prompt, { skipCache: true });
  const result = await parseAIResponse(raw, ReportSchema, retryFn);

  if (result.valid) return result.data;

  console.warn("[generateReport] Validation failed, using fallback:", result.errors);
  return FALLBACK_REPORT;
}

// ── generateQuestions ──────────────────────────────────────

export async function generateQuestions(jobTitle: string, skills: string[], count: number = 5) {
  const safeTitle = sanitizeInput(jobTitle, 200);
  const skillList = skills.map((s) => sanitizeInput(s, 100)).join(", ") || "general software engineering";

  const prompt = `You are an expert technical interviewer creating an interview assessment.

Job Title: ${safeTitle}
Required Skills: ${skillList}
Number of Questions: ${count}

Generate exactly ${count} interview questions covering the listed skills. Mix descriptive and coding questions.
Respond in STRICT JSON format only (no markdown, no explanation, no code fences) — a JSON array:
[
  {
    "text": "<question text>",
    "type": "descriptive",
    "skill": "<skill from the list>",
    "difficulty": "Easy|Medium|Hard",
    "time_limit": <seconds: 180-600 for descriptive>
  },
  {
    "text": "<question text>",
    "type": "coding",
    "skill": "<skill from the list>",
    "difficulty": "Easy|Medium|Hard",
    "time_limit": <seconds: 300-900 for coding>,
    "starter_code": "<optional boilerplate>",
    "language": "javascript"
  }
]
Make at least ${Math.ceil(count / 3)} coding questions. Cover different difficulties.`;

  const raw = await aiGenerate(prompt);

  const retryFn = async () => aiGenerate(prompt, { skipCache: true });
  const result = await parseAIResponse(raw, GeneratedQuestionSchema, retryFn);

  if (result.valid) {
    return result.data as {
      text: string;
      type: string;
      skill: string;
      difficulty: string;
      time_limit: number;
      starter_code?: string;
      language?: string;
    }[];
  }

  console.warn("[generateQuestions] Validation failed, returning empty:", result.errors);
  return [];
}

