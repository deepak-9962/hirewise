import { NextRequest, NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, answer, type, skill, difficulty } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
    }

    const evaluation = await evaluateAnswer(
      question,
      answer,
      type || "descriptive",
      skill || "General",
      difficulty || "Medium"
    );

    return NextResponse.json({ success: true, evaluation });
  } catch (error) {
    console.error("AI Evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer. Please try again." },
      { status: 500 }
    );
  }
}
