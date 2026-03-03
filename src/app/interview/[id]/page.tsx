"use client";

import { useState, useEffect, useCallback, use } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Question {
  id: number;
  type: "descriptive" | "coding";
  difficulty: "Easy" | "Medium" | "Hard";
  skill: string;
  text: string;
  timeLimit: number; // seconds
  language?: string;
  starterCode?: string;
}

interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  // Descriptive-specific
  technical?: number;
  communication?: number;
  reasoning?: number;
  // Coding-specific
  correctness?: number;
  efficiency?: number;
  codeQuality?: number;
  executionResult?: string;
}

const mockQuestions: Question[] = [
  {
    id: 1,
    type: "descriptive",
    difficulty: "Easy",
    skill: "React",
    text: "Explain the difference between useEffect and useLayoutEffect in React. When would you choose one over the other? Provide specific use cases.",
    timeLimit: 300,
  },
  {
    id: 2,
    type: "coding",
    difficulty: "Medium",
    skill: "Algorithms",
    text: "Write a function that takes an array of integers and returns the length of the longest increasing subsequence.",
    timeLimit: 600,
    language: "javascript",
    starterCode: `function longestIncreasingSubsequence(nums) {\n  // Your code here\n}\n\n// Test\nconsole.log(longestIncreasingSubsequence([10, 9, 2, 5, 3, 7, 101, 18])); // Expected: 4`,
  },
  {
    id: 3,
    type: "descriptive",
    difficulty: "Medium",
    skill: "System Design",
    text: "Describe how you would design a real-time notification system for a web application that needs to handle millions of concurrent users. Cover the architecture, technology choices, and trade-offs.",
    timeLimit: 480,
  },
  {
    id: 4,
    type: "coding",
    difficulty: "Hard",
    skill: "Data Structures",
    text: "Implement a Least Recently Used (LRU) Cache with O(1) time complexity for both get and put operations.",
    timeLimit: 900,
    language: "javascript",
    starterCode: `class LRUCache {\n  constructor(capacity) {\n    // Your code here\n  }\n\n  get(key) {\n    // Your code here\n  }\n\n  put(key, value) {\n    // Your code here\n  }\n}\n\n// Test\nconst cache = new LRUCache(2);\ncache.put(1, 1);\ncache.put(2, 2);\nconsole.log(cache.get(1)); // Expected: 1`,
  },
  {
    id: 5,
    type: "descriptive",
    difficulty: "Hard",
    skill: "Behavioral",
    text: "Describe a situation where you had to make a critical technical decision under pressure with incomplete information. What was the outcome and what would you do differently?",
    timeLimit: 360,
  },
];

export default function InterviewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: interviewId } = use(params);
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [jobTitle, setJobTitle] = useState("Technical Interview");
  const [jobId, setJobId] = useState<string | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [codeOutputs, setCodeOutputs] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(mockQuestions[0].timeLimit);
  const [isSubmitted, setIsSubmitted] = useState<Record<number, boolean>>({});
  const [showComplete, setShowComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [evaluations, setEvaluations] = useState<Record<number, Evaluation>>({});
  const [evaluating, setEvaluating] = useState<Record<number, boolean>>({});
  const [runningCode, setRunningCode] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [finalReport, setFinalReport] = useState<Record<string, unknown> | null>(null);

  // Load real questions from DB (fall back to mock if not available)
  useEffect(() => {
    if (interviewId === "demo") return;
    setQuestionsLoading(true);
    fetch(`/api/interview/questions?interview_id=${interviewId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.questions?.length) {
          const mapped: Question[] = data.questions.map((q: any, i: number) => ({
            id: i + 1,
            type: (q.type as "descriptive" | "coding") ?? "descriptive",
            difficulty: (q.difficulty as "Easy" | "Medium" | "Hard") ?? "Medium",
            skill: q.skill ?? "",
            text: q.text,
            timeLimit: q.time_limit ?? 300,
            language: q.language,
            starterCode: q.starter_code,
          }));
          setQuestions(mapped);
          setTimeLeft(mapped[0]?.timeLimit ?? 300);
        }
        if (data.jobTitle) setJobTitle(data.jobTitle);
        if (data.jobId) setJobId(data.jobId);
      })
      .catch(() => {})
      .finally(() => setQuestionsLoading(false));
  }, [interviewId]);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;

  // Timer
  useEffect(() => {
    if (isPaused || showComplete) return;
    if (timeLeft <= 0) {
      // Auto-submit
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isPaused, showComplete]);

  // Reset timer on question change
  useEffect(() => {
    if (questions[currentIndex]) setTimeLeft(questions[currentIndex].timeLimit);
  }, [currentIndex, questions]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitted((prev) => ({ ...prev, [currentQ.id]: true }));
    setEvaluating((prev) => ({ ...prev, [currentQ.id]: true }));

    try {
      const res = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ.text,
          answer: answers[currentQ.id] || "",
          type: currentQ.type,
          skill: currentQ.skill,
          difficulty: currentQ.difficulty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEvaluations((prev) => ({ ...prev, [currentQ.id]: data.evaluation }));
      }
    } catch (err) {
      console.error("Evaluation failed:", err);
    } finally {
      setEvaluating((prev) => ({ ...prev, [currentQ.id]: false }));
    }
  }, [currentQ, answers]);

  const handleNext = async () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Generate final report
      setShowComplete(true);
      setGeneratingReport(true);
      try {
        const questionsData = questions.map((q) => ({
          question: q.text,
          answer: answers[q.id] || "(No answer provided)",
          type: q.type,
          skill: q.skill,
          difficulty: q.difficulty,
          score: evaluations[q.id]?.score ?? 0,
        }));
        const res = await fetch("/api/ai/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: questionsData }),
        });
        const data = await res.json();
        if (data.success) {
          setFinalReport(data.report);

          // Save everything to Supabase
          setSaving(true);
          try {
            await fetch("/api/interview/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                interviewId: interviewId,
                candidateId: user?.id,
                jobId: jobId,
                jobTitle: jobTitle,
                questions,
                answers,
                evaluations,
                finalReport: data.report,
              }),
            });
          } catch (saveErr) {
            console.error("Failed to save interview results:", saveErr);
          } finally {
            setSaving(false);
          }
        }
      } catch (err) {
        console.error("Report generation failed:", err);
      } finally {
        setGeneratingReport(false);
      }
    }
  };

  const handleRunCode = async () => {
    setRunningCode(true);
    setCodeOutputs((prev) => ({ ...prev, [currentQ.id]: "▶ Running code..." }));

    try {
      const res = await fetch("/api/ai/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: answers[currentQ.id] || currentQ.starterCode || "",
          language: selectedLanguage,
        }),
      });
      const data = await res.json();
      if (data.success !== undefined) {
        const output = data.hasError
          ? `❌ Error: ${data.errorMessage}\n\nExecution time: ${data.executionTime}`
          : `✅ Output:\n${data.output}\n\nExecution time: ${data.executionTime}`;
        setCodeOutputs((prev) => ({ ...prev, [currentQ.id]: output }));
      } else {
        setCodeOutputs((prev) => ({ ...prev, [currentQ.id]: `❌ ${data.error || "Execution failed"}` }));
      }
    } catch {
      setCodeOutputs((prev) => ({ ...prev, [currentQ.id]: "❌ Failed to execute code. Check your connection." }));
    } finally {
      setRunningCode(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const difficultyColor = {
    Easy: "bg-green-100 text-green-700",
    Medium: "bg-amber-100 text-amber-700",
    Hard: "bg-red-100 text-red-700",
  };

  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">No questions found for this interview.</p>
      </div>
    );
  }

  if (showComplete) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 sm:p-12 text-center max-w-2xl shadow-xl w-full">
          <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Interview Complete!</h1>

          {generatingReport ? (
            <div className="py-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="animate-spin material-symbols-outlined text-primary">progress_activity</span>
                <span className="text-slate-500 font-medium">AI is generating your detailed report...</span>
              </div>
              <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-progress" style={{ width: "80%" }}></div>
              </div>
            </div>
          ) : finalReport ? (
            <div className="text-left mt-6 space-y-6">
              {/* Score Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-primary">{String(finalReport.overallScore ?? 0)}</p>
                  <p className="text-xs text-slate-500 mt-1">Overall</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-blue-600">{String(finalReport.technicalScore ?? 0)}</p>
                  <p className="text-xs text-slate-500 mt-1">Technical</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-emerald-600">{String(finalReport.communicationScore ?? 0)}</p>
                  <p className="text-xs text-slate-500 mt-1">Communication</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-amber-600">{String(finalReport.reasoningScore ?? 0)}</p>
                  <p className="text-xs text-slate-500 mt-1">Reasoning</p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">smart_toy</span> AI Assessment
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{String(finalReport.summary ?? "")}</p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <h3 className="font-bold text-green-700 dark:text-green-400 mb-2 text-sm">Strengths</h3>
                  <ul className="space-y-1.5">
                    {(finalReport.strengths as string[] || []).map((s: string, i: number) => (
                      <li key={i} className="text-sm text-green-600 dark:text-green-300 flex items-start gap-2">
                        <span className="material-symbols-outlined text-xs mt-0.5">check</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <h3 className="font-bold text-amber-700 dark:text-amber-400 mb-2 text-sm">Areas to Improve</h3>
                  <ul className="space-y-1.5">
                    {(finalReport.weaknesses as string[] || []).map((w: string, i: number) => (
                      <li key={i} className="text-sm text-amber-600 dark:text-amber-300 flex items-start gap-2">
                        <span className="material-symbols-outlined text-xs mt-0.5">arrow_forward</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <h3 className="font-bold text-primary mb-1 text-sm">Recommendation</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">{String(finalReport.recommendation ?? "")}</p>
              </div>

              {/* Per-question scores */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Question-by-Question Scores</h3>
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <div key={q.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-6">Q{i + 1}</span>
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${(evaluations[q.id]?.score ?? 0) >= 80 ? "bg-green-500" : (evaluations[q.id]?.score ?? 0) >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${evaluations[q.id]?.score ?? 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-10 text-right">{evaluations[q.id]?.score ?? "-"}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Your responses have been submitted for AI evaluation. You&apos;ll receive a detailed report shortly.
            </p>
          )}

          {saving && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mt-4">
              <span className="animate-spin material-symbols-outlined text-primary text-sm">progress_activity</span>
              Saving results to your dashboard...
            </div>
          )}

          <a href="/candidate/dashboard" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all inline-block mt-8">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">deployed_code</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">HIREWISE</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-sm text-slate-500">{jobTitle}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Question</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{currentIndex + 1}/{totalQuestions}</span>
              <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}></div>
              </div>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${timeLeft <= 60 ? "bg-red-50 text-red-600" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
              <span className="material-symbols-outlined text-sm">timer</span>
              <span className="text-sm font-bold font-mono">{formatTime(timeLeft)}</span>
            </div>

            {/* Pause */}
            {isPaused && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">PAUSED</span>
            )}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Question Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${difficultyColor[currentQ.difficulty]}`}>
                  {currentQ.difficulty}
                </span>
                <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                  {currentQ.skill}
                </span>
                <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full capitalize">
                  {currentQ.type}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">{currentQ.text}</h2>
            </div>
          </div>

          {/* Answer Area */}
          {currentQ.type === "descriptive" ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Your Answer</span>
                <span className="text-xs text-slate-400">
                  {(answers[currentQ.id] || "").split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={answers[currentQ.id] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                placeholder="Type your answer here..."
                disabled={isSubmitted[currentQ.id]}
                className="w-full h-64 p-4 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none disabled:opacity-50"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Code Editor */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Code Editor</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="text-xs bg-slate-100 dark:bg-slate-700 border-0 rounded-md px-2 py-1 text-slate-600 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                <div className="h-80">
                  <MonacoEditor
                    height="100%"
                    language={selectedLanguage}
                    value={answers[currentQ.id] || currentQ.starterCode || ""}
                    onChange={(value) => setAnswers((prev) => ({ ...prev, [currentQ.id]: value || "" }))}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      readOnly: isSubmitted[currentQ.id],
                      padding: { top: 12 },
                    }}
                  />
                </div>
              </div>

              {/* Output Console */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Output Console</span>
                  <button
                    onClick={handleRunCode}
                    disabled={isSubmitted[currentQ.id] || runningCode}
                    className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-green-700 transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    {runningCode ? (
                      <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Running...</>
                    ) : (
                      <><span className="material-symbols-outlined text-sm">play_arrow</span> Run Code</>
                    )}
                  </button>
                </div>
                <div className="flex-1 h-80 bg-slate-900 p-4 font-mono text-sm text-green-400 overflow-auto">
                  {codeOutputs[currentQ.id] || "// Click 'Run Code' to execute..."}
                </div>
              </div>
            </div>
          )}

          {/* AI Evaluation Feedback */}
          {(evaluating[currentQ.id] || evaluations[currentQ.id]) && (
            <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">smart_toy</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">AI Evaluation</span>
                {evaluating[currentQ.id] && (
                  <span className="animate-spin material-symbols-outlined text-primary text-sm ml-auto">progress_activity</span>
                )}
              </div>
              {evaluating[currentQ.id] ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-500">Gemini is analyzing your response...</p>
                  <div className="flex gap-1 justify-center mt-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              ) : evaluations[currentQ.id] ? (
                <div className="p-4 space-y-4">
                  {/* Score */}
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-black ${evaluations[currentQ.id].score >= 80 ? "text-green-600" : evaluations[currentQ.id].score >= 60 ? "text-amber-600" : "text-red-500"}`}>
                      {evaluations[currentQ.id].score}/100
                    </div>
                    <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full animate-progress ${evaluations[currentQ.id].score >= 80 ? "bg-green-500" : evaluations[currentQ.id].score >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${evaluations[currentQ.id].score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Sub-scores */}
                  {currentQ.type === "coding" ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{evaluations[currentQ.id].correctness ?? "-"}</p>
                        <p className="text-xs text-slate-500">Correctness</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{evaluations[currentQ.id].efficiency ?? "-"}</p>
                        <p className="text-xs text-slate-500">Efficiency</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{evaluations[currentQ.id].codeQuality ?? "-"}</p>
                        <p className="text-xs text-slate-500">Code Quality</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{evaluations[currentQ.id].technical ?? "-"}</p>
                        <p className="text-xs text-slate-500">Technical</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{evaluations[currentQ.id].communication ?? "-"}</p>
                        <p className="text-xs text-slate-500">Communication</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{evaluations[currentQ.id].reasoning ?? "-"}</p>
                        <p className="text-xs text-slate-500">Reasoning</p>
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{evaluations[currentQ.id].feedback}</p>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-bold text-green-600 mb-1">Strengths</p>
                      {evaluations[currentQ.id].strengths?.map((s, i) => (
                        <p key={i} className="text-xs text-slate-500 flex items-start gap-1 mb-0.5">
                          <span className="text-green-500 text-xs">✓</span> {s}
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-600 mb-1">Improvements</p>
                      {evaluations[currentQ.id].improvements?.map((s, i) => (
                        <p key={i} className="text-xs text-slate-500 flex items-start gap-1 mb-0.5">
                          <span className="text-amber-500 text-xs">→</span> {s}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              {/* Question pills */}
              <div className="hidden sm:flex items-center gap-1">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`size-8 rounded-lg text-xs font-bold transition-all ${
                      i === currentIndex
                        ? "bg-primary text-white"
                        : isSubmitted[q.id]
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isSubmitted[currentQ.id] ? (
                <button
                  onClick={handleSubmit}
                  className="bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-primary/20"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-primary/20 flex items-center gap-1"
                >
                  {currentIndex < totalQuestions - 1 ? "Next Question" : "Finish Interview"} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
