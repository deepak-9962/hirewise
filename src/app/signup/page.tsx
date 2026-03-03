"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Auto-redirect after short delay
      setTimeout(() => {
        const dashboardMap: Record<string, string> = {
          candidate: "/candidate/dashboard",
          recruiter: "/recruiter/dashboard",
        };
        router.push(dashboardMap[role] || "/candidate/dashboard");
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Signup error:", err);
      setError("Unable to connect to the server. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,#ffffff_1px,transparent_1px)] [background-size:30px_30px]"></div>
        <div className="relative z-10 text-white p-16 max-w-lg">
          <div className="flex items-center gap-2 mb-12">
            <span className="material-symbols-outlined text-4xl">deployed_code</span>
            <span className="text-3xl font-bold tracking-tight">HIREWISE</span>
          </div>
          <h2 className="text-4xl font-black mb-6 leading-tight">Start Hiring Smarter Today</h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-10">
            Create your free account and experience the future of AI-powered recruitment.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "70%", label: "Faster Hiring" },
              { value: "500+", label: "Companies" },
              { value: "98%", label: "Accuracy" },
              { value: "24/7", label: "AI Support" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-3xl font-black">{stat.value}</p>
                <p className="text-blue-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-primary text-3xl">deployed_code</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">HIREWISE</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create your account</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Get started for free — no credit card required</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm">
              Account created! Redirecting to dashboard...
            </div>
          )}

          {/* Role selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setRole("candidate")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                role === "candidate"
                  ? "bg-primary text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <span className="material-symbols-outlined text-sm align-middle mr-1">person</span> Candidate
            </button>
            <button
              onClick={() => setRole("recruiter")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                role === "recruiter"
                  ? "bg-primary text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <span className="material-symbols-outlined text-sm align-middle mr-1">work</span> Recruiter
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSignup}>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Minimum 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-400 text-center">
            By signing up, you agree to our <a href="#" className="text-primary hover:underline">Terms</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
