import { NextRequest, NextResponse } from "next/server";
import { generateReport } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Questions array is required" }, { status: 400 });
    }

    const report = await generateReport(questions);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report. Please try again." },
      { status: 500 }
    );
  }
}
