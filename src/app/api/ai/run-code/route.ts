import { NextRequest, NextResponse } from "next/server";
import { simulateCode } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language } = body;

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const result = await simulateCode(code, language || "javascript");

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Code execution error:", error);
    return NextResponse.json({
      success: true,
      output: "Code analysis temporarily unavailable",
      hasError: false,
      errorMessage: "",
      executionTime: "N/A",
    });
  }
}
