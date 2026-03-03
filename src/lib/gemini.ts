/**
 * AI Functions — Evaluation, Report Generation, Question Generation, Code Simulation.
 *
 * Uses the modular AI engine (Ollama / Gemini / auto) instead of direct Gemini SDK calls.
 * All user inputs are sanitized. All outputs are validated with Zod schemas + retry.
 */

import { getAIProvider } from "./ai-engine";
import { sanitizeUserInput, truncatePrompt } from "./ai-security";
import {
  callWithRetry,
  DescriptiveEvaluationSchema,
  CodingEvaluationSchema,
  ReportSchema,
  QuestionsArraySchema,
  CodeRunSchema,
  fallbackEvaluation,
  fallbackReport,
  fallbackCodeRun,
  type DescriptiveEvaluation,
  type CodingEvaluation,
  type ReportResult,
  type QuestionResult,
  type CodeRunResult,
} from "./ai-validation";

// ─── Evaluate Answer ──────────────────────────────────────────────────

export async function evaluateAnswer(
  question: string,
  answer: string,
  type: "descriptive" | "coding",
  skill: string,
  difficulty: string
): Promise<DescriptiveEvaluation | CodingEvaluation> {
  const safeAnswer = sanitizeUserInput(answer, 5000);
  const safeQuestion = sanitizeUserInput(question, 2000);

  const prompt = type === "coding"
    ? `You are an expert technical interviewer evaluating a coding interview response.

Question: ${safeQuestion}
Skill Area: ${skill}
Difficulty: ${difficulty}
Candidate's Code:
\`\`\`
${safeAnswer}
\`\`\`

IMPORTANT SCORING RULES:
- Score ONLY based on the code provided. Do NOT assume missing functionality works.
- If the code is empty or irrelevant, all scores must be 0.
- If the code has syntax errors, correctness must be below 30.
- Do NOT hallucinate features or capabilities not present in the code.

Respond in STRICT JSON format only. No markdown, no code fences, no commentary.
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
Skill Area: ${skill}
Difficulty: ${difficulty}
Candidate's Answer: ${safeAnswer}

IMPORTANT SCORING RULES:
- Score ONLY based on what the candidate actually wrote. Do NOT infer knowledge they did not demonstrate.
- If the answer is empty, off-topic, or irrelevant, all scores must be 0.
- If the answer is vague with no specifics, technical score must be below 30.
- Do NOT give credit for information not present in the answer.

Respond in STRICT JSON format only. No markdown, no code fences, no commentary.
{
  "score": <number 0-100>,
  "technical": <number 0-100>,
  "communication": <number 0-100>,
  "reasoning": <number 0-100>,
  "feedback": "<2-3 sentence evaluation>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;

  const truncated = truncatePrompt(prompt);
  const provider = getAIProvider();

  try {
    if (type === "coding") {
      return await callWithRetry(() => provider.generateContent(truncated), CodingEvaluationSchema);
    }
    return await callWithRetry(() => provider.generateContent(truncated), DescriptiveEvaluationSchema);
  } catch {
    console.error("[AI] Evaluation failed — returning fallback");
    return fallbackEvaluation(type);
  }
}

// ─── Generate Report ──────────────────────────────────────────────────

export async function generateReport(
  questions: { question: string; answer: string; type: string; skill: string; difficulty: string; score: number }[]
): Promise<ReportResult> {
  const summaryData = questions
    .map((q, i) => `Q${i + 1} [${q.skill} - ${q.difficulty} - ${q.type}]: Score ${q.score}/100`)
    .join("\n");
  const avgScore = Math.round(questions.reduce((s, q) => s + q.score, 0) / questions.length);

  const qaParts = questions
    .map((q, i) => `Q${i + 1}: ${sanitizeUserInput(q.question, 500)}\nA${i + 1}: ${sanitizeUserInput(q.answer, 1000)}\nScore: ${q.score}/100`)
    .join("\n\n");

  const prompt = `You are an AI interviewing platform generating a comprehensive candidate evaluation report.

Interview Summary:
${summaryData}
Average Score: ${avgScore}/100

Full Q&A:
${qaParts}

IMPORTANT RULES:
- Base your report ONLY on the actual Q&A data above.
- Do NOT invent strengths or skills not demonstrated in the answers.
- If most scores are low, the recommendation must reflect that honestly.
- recommendation must be one of: "hire", "consider", or "reject" followed by brief justification.

Respond in STRICT JSON format only. No markdown, no code fences, no commentary.
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

  const truncated = truncatePrompt(prompt);
  const provider = getAIProvider();

  try {
    return await callWithRetry(() => provider.generateContent(truncated), ReportSchema);
  } catch {
    console.error("[AI] Report generation failed — returning fallback");
    return fallbackReport(avgScore);
  }
}

// ─── Generate Questions ───────────────────────────────────────────────

export async function generateQuestions(
  jobTitle: string,
  skills: string[],
  count: number = 5
): Promise<QuestionResult[]> {
  const skillList = skills.join(", ") || "general software engineering";

  const prompt = `You are an expert technical interviewer creating an interview assessment.

Job Title: ${sanitizeUserInput(jobTitle, 200)}
Required Skills: ${sanitizeUserInput(skillList, 500)}
Number of Questions: ${count}

Generate ${count} interview questions covering the listed skills. Mix descriptive and coding questions.

RULES:
- Each question must be relevant to the listed skills.
- Coding questions must have practical, testable problems.
- Vary difficulty across Easy, Medium, and Hard.
- Make at least ${Math.ceil(count / 3)} coding questions.

Respond in STRICT JSON format only. No markdown, no code fences, no commentary.
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
]`;

  const provider = getAIProvider();
  return await callWithRetry(() => provider.generateContent(prompt), QuestionsArraySchema);
}

// ─── Simulate Code Execution ──────────────────────────────────────────

export async function simulateCode(
  code: string,
  language: string = "javascript"
): Promise<CodeRunResult> {
  const safeCode = sanitizeUserInput(code, 5000);

  const prompt = `You are a code execution simulator. Analyze the following ${language} code and determine what the output would be if executed. Be precise and exact.

Code:
\`\`\`${language}
${safeCode}
\`\`\`

Respond in STRICT JSON format only. No markdown, no code fences, no commentary.
{
  "output": "<exact console output the code would produce>",
  "hasError": <boolean>,
  "errorMessage": "<error message if any, empty string otherwise>",
  "executionTime": "<estimated execution time like '12ms'>"
}`;

  const truncated = truncatePrompt(prompt);
  const provider = getAIProvider();

  try {
    return await callWithRetry(() => provider.generateContent(truncated), CodeRunSchema);
  } catch {
    console.error("[AI] Code simulation failed — returning fallback");
    return fallbackCodeRun();
  }
}
