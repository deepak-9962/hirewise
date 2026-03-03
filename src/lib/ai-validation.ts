/**
 * AI Response Validation — Zod schemas + retry logic for LLM JSON output.
 */

import { z, type ZodSchema } from "zod";

// ─── Zod Schemas ──────────────────────────────────────────────────────

/** Evaluation result for descriptive answers */
export const DescriptiveEvaluationSchema = z.object({
    score: z.number().min(0).max(100),
    technical: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    reasoning: z.number().min(0).max(100),
    feedback: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
});
export type DescriptiveEvaluation = z.infer<typeof DescriptiveEvaluationSchema>;

/** Evaluation result for coding answers */
export const CodingEvaluationSchema = z.object({
    score: z.number().min(0).max(100),
    correctness: z.number().min(0).max(100),
    efficiency: z.number().min(0).max(100),
    codeQuality: z.number().min(0).max(100),
    feedback: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    executionResult: z.string(),
});
export type CodingEvaluation = z.infer<typeof CodingEvaluationSchema>;

/** Report result */
export const ReportSchema = z.object({
    overallScore: z.number().min(0).max(100),
    technicalScore: z.number().min(0).max(100),
    communicationScore: z.number().min(0).max(100),
    reasoningScore: z.number().min(0).max(100),
    summary: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    recommendation: z.string(),
});
export type ReportResult = z.infer<typeof ReportSchema>;

/** Generated questions */
export const QuestionSchema = z.object({
    text: z.string(),
    type: z.enum(["descriptive", "coding"]),
    skill: z.string(),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    time_limit: z.number(),
    starter_code: z.string().optional(),
    language: z.string().optional(),
});
export const QuestionsArraySchema = z.array(QuestionSchema);
export type QuestionResult = z.infer<typeof QuestionSchema>;

/** Code execution simulation */
export const CodeRunSchema = z.object({
    output: z.string(),
    hasError: z.boolean(),
    errorMessage: z.string(),
    executionTime: z.string(),
});
export type CodeRunResult = z.infer<typeof CodeRunSchema>;

// ─── JSON Parser ──────────────────────────────────────────────────────

/**
 * Parse + validate a raw LLM response string into typed output.
 * Strips markdown code fences, leading/trailing junk.
 */
export function parseAIResponse<T>(raw: string, schema: ZodSchema<T>): T {
    // Strip markdown code fences
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```json?\s*\n?/i, "").replace(/\n?\s*```$/i, "");
    cleaned = cleaned.trim();

    // Sometimes models prefix with text before JSON — find the first { or [
    const jsonStart = cleaned.search(/[\[{]/);
    if (jsonStart > 0) {
        cleaned = cleaned.slice(jsonStart);
    }

    // Find the last } or ] to strip trailing text
    const lastBrace = cleaned.lastIndexOf("}");
    const lastBracket = cleaned.lastIndexOf("]");
    const jsonEnd = Math.max(lastBrace, lastBracket);
    if (jsonEnd > 0 && jsonEnd < cleaned.length - 1) {
        cleaned = cleaned.slice(0, jsonEnd + 1);
    }

    const parsed = JSON.parse(cleaned);
    return schema.parse(parsed);
}

// ─── Retry Wrapper ────────────────────────────────────────────────────

/**
 * Call an AI function, parse its output, and retry on parse/validation failure.
 *
 * @param fn - Async function that returns raw string from AI
 * @param schema - Zod schema to validate against
 * @param maxRetries - Number of retries on parse failure (default: 2)
 * @returns Validated, typed result
 * @throws Error with fallback if all retries fail
 */
export async function callWithRetry<T>(
    fn: () => Promise<string>,
    schema: ZodSchema<T>,
    maxRetries = 2
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const raw = await fn();
            return parseAIResponse(raw, schema);
        } catch (err: any) {
            lastError = err;
            console.warn(
                `[AI Validation] Parse/validation failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
                err.message?.slice(0, 200)
            );
        }
    }

    throw new Error(
        `AI response validation failed after ${maxRetries + 1} attempts: ${lastError?.message}`
    );
}

// ─── Fallback Generators ──────────────────────────────────────────────

export function fallbackEvaluation(type: "descriptive" | "coding"): DescriptiveEvaluation | CodingEvaluation {
    if (type === "coding") {
        return {
            score: 0,
            correctness: 0,
            efficiency: 0,
            codeQuality: 0,
            feedback: "Evaluation temporarily unavailable. Your response has been recorded for manual review.",
            strengths: [],
            improvements: ["Unable to evaluate at this time"],
            executionResult: "Evaluation unavailable",
        };
    }
    return {
        score: 0,
        technical: 0,
        communication: 0,
        reasoning: 0,
        feedback: "Evaluation temporarily unavailable. Your response has been recorded for manual review.",
        strengths: [],
        improvements: ["Unable to evaluate at this time"],
    };
}

export function fallbackReport(avgScore: number): ReportResult {
    return {
        overallScore: avgScore,
        technicalScore: avgScore,
        communicationScore: avgScore,
        reasoningScore: avgScore,
        summary: "AI report generation is temporarily unavailable. Scores are based on individual question evaluations.",
        strengths: ["Responses submitted successfully"],
        weaknesses: ["Detailed AI analysis unavailable at this time"],
        recommendation: "Manual review recommended — AI evaluation was unavailable.",
    };
}

export function fallbackCodeRun(): CodeRunResult {
    return {
        output: "Code analysis temporarily unavailable",
        hasError: false,
        errorMessage: "",
        executionTime: "N/A",
    };
}
