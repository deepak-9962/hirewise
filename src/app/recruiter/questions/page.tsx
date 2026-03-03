"use client";

import { useState } from "react";
import { useQuestions, createQuestion, deleteQuestion } from "@/hooks/useSupabase";
import { useAuth } from "@/context/AuthContext";

const difficultyColor: Record<string, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

export default function QuestionBankPage() {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const { data: questionsData, loading, refetch } = useQuestions(filter);
  const [submitting, setSubmitting] = useState(false);
  const [qForm, setQForm] = useState({ text: "", type: "descriptive", skill: "", difficulty: "Easy", test_cases: "" });

  const questions = (questionsData ?? []) as any[];

  const handleAdd = async () => {
    if (!qForm.text.trim() || !user) return;
    setSubmitting(true);
    let parsedTestCases: unknown = undefined;
    if (qForm.test_cases.trim()) {
      try { parsedTestCases = JSON.parse(qForm.test_cases); } catch { /* ignore */ }
    }
    await createQuestion({
      text: qForm.text,
      type: qForm.type,
      skill: qForm.skill,
      difficulty: qForm.difficulty,
      test_cases: parsedTestCases,
      created_by: user.id,
    });
    setQForm({ text: "", type: "descriptive", skill: "", difficulty: "Easy", test_cases: "" });
    setSubmitting(false);
    setShowAdd(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    await deleteQuestion(id);
    refetch();
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Question Bank</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your interview questions and assessments</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span> {showAdd ? "Cancel" : "Add Question"}
        </button>
      </div>

      {/* Add Question Form */}
      {showAdd && (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 animate-fade-in">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Add New Question</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Question Text</label>
              <textarea value={qForm.text} onChange={(e) => setQForm({ ...qForm, text: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none" placeholder="Enter the question text..."></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
                <select value={qForm.type} onChange={(e) => setQForm({ ...qForm, type: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="descriptive">Descriptive</option>
                  <option value="coding">Coding</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Skill Tag</label>
                <input type="text" value={qForm.skill} onChange={(e) => setQForm({ ...qForm, skill: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. React, Algorithms" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Difficulty</label>
                <select value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Test Cases (JSON) — for coding questions</label>
              <textarea value={qForm.test_cases} onChange={(e) => setQForm({ ...qForm, test_cases: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 h-20 resize-none font-mono" placeholder='[{"input": [1,2,3], "expected": 6}]'></textarea>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Cancel</button>
              <button onClick={handleAdd} disabled={submitting} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50">{submitting ? "Adding..." : "Add Question"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "descriptive", "coding"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === f ? "bg-primary text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}{filter === f ? ` (${questions.length})` : ""}
          </button>
        ))}
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">quiz</span>
          <p className="text-sm text-slate-500">No questions yet. Add your first question.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q: any) => (
            <div key={q.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between hover:border-primary/50 transition-all">
              <div className="flex items-start gap-4 flex-1">
                <div className={`size-10 rounded-lg flex items-center justify-center ${q.type === "coding" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                  <span className="material-symbols-outlined text-sm">{q.type === "coding" ? "code" : "description"}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{q.text}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${difficultyColor[q.difficulty] ?? ""}`}>{q.difficulty}</span>
                    <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">{q.skill}</span>
                    <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full capitalize">{q.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button onClick={() => handleDelete(q.id)} className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
