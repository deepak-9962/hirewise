import { NextRequest, NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language } = body;

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const prompt = `You are a code execution simulator. Analyze the following ${language || "javascript"} code and determine what the output would be if executed. Be precise and exact.

Code:
\`\`\`${language || "javascript"}
${code}
\`\`\`

Respond in STRICT JSON format only (no markdown, no code fences):
{
  "output": "<exact console output the code would produce>",
  "hasError": <boolean>,
  "errorMessage": "<error message if any, empty string otherwise>",
  "executionTime": "<estimated execution time like '12ms'>"
}`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ success: true, ...parsed });
  } catch (error) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { error: "Failed to analyze code." },
      { status: 500 }
    );
  }
}
