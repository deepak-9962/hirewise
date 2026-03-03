"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

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

export default function InterviewSessionPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [codeOutputs, setCodeOutputs] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(mockQuestions[0].timeLimit);
  const [isSubmitted, setIsSubmitted] = useState<Record<number, boolean>>({});
  const [showComplete, setShowComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");

  const currentQ = mockQuestions[currentIndex];
  const totalQuestions = mockQuestions.length;

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
    setTimeLeft(mockQuestions[currentIndex].timeLimit);
  }, [currentIndex]);

  const handleSubmit = useCallback(() => {
    setIsSubmitted((prev) => ({ ...prev, [currentQ.id]: true }));
  }, [currentQ.id]);

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowComplete(true);
    }
  };

  const handleRunCode = () => {
    setCodeOutputs((prev) => ({
      ...prev,
      [currentQ.id]: "▶ Running code...\n\n// Output will appear here after execution\n// (Sandboxed execution via Docker in production)",
    }));
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

  if (showComplete) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center max-w-lg shadow-xl">
          <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Interview Complete!</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Your responses have been submitted for AI evaluation. You&apos;ll receive a detailed report shortly.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalQuestions}</p>
              <p className="text-xs text-slate-500">Questions</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{Object.keys(isSubmitted).length}</p>
              <p className="text-xs text-slate-500">Answered</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-primary">AI</p>
              <p className="text-xs text-slate-500">Evaluating</p>
            </div>
          </div>
          <a href="/candidate/dashboard" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all inline-block">
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
            <span className="text-sm text-slate-500">Senior Frontend Engineer - TechCorp</span>
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
                    disabled={isSubmitted[currentQ.id]}
                    className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-green-700 transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span> Run Code
                  </button>
                </div>
                <div className="flex-1 h-80 bg-slate-900 p-4 font-mono text-sm text-green-400 overflow-auto">
                  {codeOutputs[currentQ.id] || "// Click 'Run Code' to execute..."}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              {/* Question pills */}
              <div className="hidden sm:flex items-center gap-1">
                {mockQuestions.map((q, i) => (
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
