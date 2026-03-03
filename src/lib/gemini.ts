import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

let _model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (!_model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
    const genAI = new GoogleGenerativeAI(apiKey);
    _model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  return _model;
}

export const geminiModel = new Proxy({} as GenerativeModel, {
  get(_target, prop) {
    return (getModel() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export async function evaluateAnswer(question: string, answer: string, type: "descriptive" | "coding", skill: string, difficulty: string) {
  const prompt = type === "coding"
    ? `You are an expert technical interviewer evaluating a coding interview response.

Question: ${question}
Skill Area: ${skill}
Difficulty: ${difficulty}
Candidate's Code:
\`\`\`
${answer}
\`\`\`

Evaluate this code and respond in STRICT JSON format only (no markdown, no code fences):
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

Question: ${question}
Skill Area: ${skill}
Difficulty: ${difficulty}
Candidate's Answer: ${answer}

Evaluate this response and respond in STRICT JSON format only (no markdown, no code fences):
{
  "score": <number 0-100>,
  "technical": <number 0-100>,
  "communication": <number 0-100>,
  "reasoning": <number 0-100>,
  "feedback": "<2-3 sentence evaluation>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text().trim();
  
  // Parse JSON — strip code fences if model adds them
  const cleaned = text.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function generateReport(questions: { question: string; answer: string; type: string; skill: string; difficulty: string; score: number }[]) {
  const summaryData = questions.map((q, i) => `Q${i + 1} [${q.skill} - ${q.difficulty} - ${q.type}]: Score ${q.score}/100`).join("\n");
  const avgScore = Math.round(questions.reduce((s, q) => s + q.score, 0) / questions.length);

  const prompt = `You are an AI interviewing platform generating a comprehensive candidate evaluation report.

Interview Summary:
${summaryData}
Average Score: ${avgScore}/100

Full Q&A:
${questions.map((q, i) => `
Q${i + 1}: ${q.question}
A${i + 1}: ${q.answer}
Score: ${q.score}/100
`).join("\n")}

Generate a report in STRICT JSON format only (no markdown, no code fences):
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

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function generateQuestions(jobTitle: string, skills: string[], count: number = 5) {
  const skillList = skills.join(", ") || "general software engineering";
  const prompt = `You are an expert technical interviewer creating an interview assessment.

Job Title: ${jobTitle}
Required Skills: ${skillList}
Number of Questions: ${count}

Generate ${count} interview questions covering the listed skills. Mix descriptive and coding questions.
Respond in STRICT JSON format only (no markdown, no code fences):
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

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
  return JSON.parse(cleaned) as {
    text: string;
    type: string;
    skill: string;
    difficulty: string;
    time_limit: number;
    starter_code?: string;
    language?: string;
  }[];
}

