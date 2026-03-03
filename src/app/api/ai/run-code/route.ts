import { NextRequest, NextResponse } from "next/server";
import { aiGenerate } from "@/lib/ai-engine";
import { CodeRunSchema, FALLBACK_CODE_RUN, parseAIResponse } from "@/lib/ai-validation";
import { sanitizeInput } from "@/lib/ai-sanitize";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language } = body;

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const safeCode = sanitizeInput(code, 6000);
    const safeLang = sanitizeInput(language || "javascript", 50);

    const prompt = `You are a code execution simulator. Analyze the following ${safeLang} code and determine what the output would be if executed. Be precise and exact.

Code:
\`\`\`${safeLang}
${safeCode}
\`\`\`

Respond in STRICT JSON format only (no markdown, no explanation, no code fences):
{
  "output": "<exact console output the code would produce>",
  "hasError": <boolean>,
  "errorMessage": "<error message if any, empty string otherwise>",
  "executionTime": "<estimated execution time like '12ms'>"
}`;

    const raw = await aiGenerate(prompt, { skipCache: true });

    const retryFn = async () => aiGenerate(prompt, { skipCache: true });
    const result = await parseAIResponse(raw, CodeRunSchema, retryFn);

    if (result.valid) {
      return NextResponse.json({ success: true, ...result.data });
    }

    console.warn("[run-code] Validation failed, using fallback:", result.errors);
    return NextResponse.json({ success: true, ...FALLBACK_CODE_RUN });
  } catch (error) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { error: "Failed to analyze code." },
      { status: 500 }
    );
  }
}
