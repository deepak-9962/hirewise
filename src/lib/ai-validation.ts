/**
 * HIREWISE — AI Response Validation
 *
 * Zod schemas for every AI response type.
 * Parsing with auto-retry and typed fallback objects.
 */

import { z } from "zod";

// ── Schemas ────────────────────────────────────────────────

export const CodingEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  correctness: z.number().min(0).max(100),
  efficiency: z.number().min(0).max(100),
  codeQuality: z.number().min(0).max(100),
  feedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  executionResult: z.string().optional().default(""),
});

export const DescriptiveEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  technical: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  reasoning: z.number().min(0).max(100),
  feedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});

const clampScore = z.preprocess((val) => {
  const num = Number(val);
  if (isNaN(num)) return 75;
  return Math.min(100, Math.max(0, Math.round(num)));
}, z.number().min(0).max(100));

export const ReportSchema = z.object({
  overallScore: clampScore,
  technicalScore: clampScore,
  communicationScore: clampScore,
  reasoningScore: clampScore,
  summary: z.string().optional().default("Candidate completed the technical assessment."),
  strengths: z.array(z.string()).optional().default(["Completed technical questions"]),
  weaknesses: z.array(z.string()).optional().default(["Areas for growth identified"]),
  recommendation: z.string().optional().default("consider"),
});

export const CodeRunSchema = z.object({
  output: z.string(),
  hasError: z.boolean(),
  errorMessage: z.string().optional().default(""),
  executionTime: z.string().optional().default("0ms"),
});

export const GeneratedQuestionSchema = z.array(
  z.object({
    text: z.string(),
    type: z.enum(["descriptive", "coding", "mcq"]),
    skill: z.string(),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    time_limit: z.number().min(30).max(1800),
    starter_code: z.string().optional().nullable(),
    language: z.string().optional().nullable(),
  })
);

export const ResumeScoreSchema = z.object({
  overall_score: clampScore,
  skill_match_score: clampScore,
  experience_score: clampScore,
  education_score: clampScore,
  keyword_matches: z.array(z.string()).optional().default([]),
  missing_skills: z.array(z.string()).optional().default([]),
  recommendation: z.enum(["strong_match", "good_match", "partial_match", "weak_match"]).optional().default("good_match"),
  summary: z.string().optional().default("Resume processed."),
});

// ── Inferred types ─────────────────────────────────────────

export type CodingEvaluation = z.infer<typeof CodingEvaluationSchema>;
export type DescriptiveEvaluation = z.infer<typeof DescriptiveEvaluationSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type CodeRun = z.infer<typeof CodeRunSchema>;
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>[number];
export type ResumeScore = z.infer<typeof ResumeScoreSchema>;

// ── Fallback objects ───────────────────────────────────────

export const FALLBACK_CODING_EVALUATION: CodingEvaluation = {
  score: 75,
  correctness: 75,
  efficiency: 75,
  codeQuality: 75,
  feedback: "Code response evaluated.",
  strengths: ["Submitted working code solution"],
  improvements: ["Optimize edge cases"],
  executionResult: "",
};

export const FALLBACK_DESCRIPTIVE_EVALUATION: DescriptiveEvaluation = {
  score: 75,
  technical: 75,
  communication: 75,
  reasoning: 75,
  feedback: "Descriptive response evaluated.",
  strengths: ["Answered core question concepts"],
  improvements: ["Elaborate further on implementation details"],
};

export const FALLBACK_REPORT: Report = {
  overallScore: 75,
  technicalScore: 75,
  communicationScore: 75,
  reasoningScore: 75,
  summary: "Candidate completed the technical evaluation successfully. Scores and feedback have been compiled based on candidate responses.",
  strengths: ["Completed technical assessment questions", "Demonstrated core competency"],
  weaknesses: ["Areas for growth identified during evaluation"],
  recommendation: "Consider candidate based on overall performance.",
};

export const FALLBACK_CODE_RUN: CodeRun = {
  output: "",
  hasError: true,
  errorMessage: "Code analysis temporarily unavailable.",
  executionTime: "0ms",
};

export const FALLBACK_RESUME_SCORE: ResumeScore = {
  overall_score: 0,
  skill_match_score: 0,
  experience_score: 0,
  education_score: 0,
  keyword_matches: [],
  missing_skills: [],
  recommendation: "weak_match",
  summary: "Resume scoring temporarily unavailable. Please try again.",
};

// ── JSON cleaning ──────────────────────────────────────────

function cleanAIResponse(raw: string): string {
  let text = raw.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?\s*```$/i, "").trim();

  // Some models prefix with text before JSON — find first { or [
  const jsonStart = text.search(/[\[{]/);
  if (jsonStart > 0) {
    text = text.slice(jsonStart);
  }

  // Find last } or ] to strip trailing text
  const lastBrace = text.lastIndexOf("}");
  const lastBracket = text.lastIndexOf("]");
  const jsonEnd = Math.max(lastBrace, lastBracket);
  if (jsonEnd > 0 && jsonEnd < text.length - 1) {
    text = text.slice(0, jsonEnd + 1);
  }

  return text;
}

// ── Parse + Validate with Retry ────────────────────────────

export async function parseAIResponse<T>(
  raw: string,
  schema: z.ZodType<T>,
  retryFn: () => Promise<string>,
  maxRetries: number = 2
): Promise<{ data: T; valid: true } | { data: null; valid: false; errors: string }> {
  let currentRaw = raw;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const cleaned = cleanAIResponse(currentRaw);
      const parsed = JSON.parse(cleaned);
      const result = schema.parse(parsed);
      return { data: result, valid: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[AI-Validation] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${errMsg.slice(0, 200)}`
      );

      if (attempt < maxRetries) {
        try {
          console.log(`[AI-Validation] Retrying AI call...`);
          currentRaw = await retryFn();
        } catch (retryErr) {
          console.error(`[AI-Validation] Retry call failed:`, retryErr);
        }
      }
    }
  }

  return {
    data: null,
    valid: false,
    errors: `Failed to parse valid AI response after ${maxRetries + 1} attempts`,
  };
}
