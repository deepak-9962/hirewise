"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase-browser";

type UserRole = "candidate" | "recruiter" | "admin";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "";
  const initialRoleParam = searchParams.get("role") as UserRole | null;
  const supabase = createClient();

  const [activeRole, setActiveRole] = useState<UserRole>(
    initialRoleParam === "recruiter" || initialRoleParam === "admin" ? initialRoleParam : "candidate"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getDashboardPath = (role: string, emailStr?: string) => {
    if (redirectTo) return redirectTo;
    let finalRole = role;
    if (!finalRole && emailStr) {
      if (emailStr.startsWith("recruiter")) finalRole = "recruiter";
      else if (emailStr.startsWith("admin")) finalRole = "admin";
      else finalRole = "candidate";
    }
    const map: Record<string, string> = {
      candidate: "/candidate/dashboard",
      recruiter: "/recruiter/dashboard",
      admin: "/admin/dashboard",
    };
    return map[finalRole] || "/candidate/dashboard";
  };

  const redirectUser = (targetPath: string) => {
    router.push(targetPath);
    // Instant fallback redirect if router push is slow
    setTimeout(() => {
      if (window.location.pathname !== targetPath && !window.location.pathname.startsWith(targetPath.split("?")[0])) {
        window.location.href = targetPath;
      }
    }, 100);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. First attempt direct sign in
      let { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // 2. If sign in fails on a demo credential (@hirewise.demo), provision account automatically then sign in
      if (authError && cleanEmail.endsWith("@hirewise.demo")) {
        const demoRole = cleanEmail.startsWith("recruiter")
          ? "recruiter"
          : cleanEmail.startsWith("admin")
          ? "admin"
          : "candidate";

        await fetch("/api/auth/demo-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: demoRole }),
        }).catch(() => {});

        const retry = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        data = retry.data;
        authError = retry.error;
      }

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please double check your credentials and try again.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        const userRole = (data.user.user_metadata?.role as string) || activeRole;
        const target = getDashboardPath(userRole, cleanEmail);
        redirectUser(target);
        return;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to the authentication service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col lg:flex-row">
      {/* Left side - Portal Branding */}
      <div className="lg:w-5/12 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 relative flex flex-col justify-between p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-10 group">
            <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">deployed_code</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">HIREWISE</span>
          </Link>

          {/* Dynamic Content based on Active Section */}
          <div className="animate-fade-in">
            {activeRole === "candidate" ? (
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
                  <span className="material-symbols-outlined text-sm">person</span> Candidate Portal
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight text-white">
                  Ace Your Next Career Move with AI
                </h2>
                <p className="text-slate-300 text-base leading-relaxed mb-8">
                  Practice interactive technical assessments, receive real-time feedback, and showcase your skills to top companies.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: "analytics", text: "Instant AI score reports & skill breakdown" },
                    { icon: "code", text: "Live interactive coding & system design environments" },
                    { icon: "shield", text: "Fair, bias-aware proctored evaluations" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3 text-slate-300 text-sm">
                      <span className="material-symbols-outlined text-blue-400 text-lg">{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeRole === "recruiter" ? (
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-4">
                  <span className="material-symbols-outlined text-sm">work</span> Recruiter & HR Portal
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight text-white">
                  Hire 5x Faster with Intelligent AI Assessments
                </h2>
                <p className="text-slate-300 text-base leading-relaxed mb-8">
                  Automate candidate screening, review detailed anti-cheat proctoring logs, and discover top-tier talent effortlessly.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: "speed", text: "70% reduction in average hiring cycle time" },
                    { icon: "gavel", text: "Proctoring & integrity monitoring (WebRTC & anti-cheat)" },
                    { icon: "dashboard", text: "Full ATS pipeline & automated scorecard generation" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3 text-slate-300 text-sm">
                      <span className="material-symbols-outlined text-purple-400 text-lg">{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
                  <span className="material-symbols-outlined text-sm">admin_panel_settings</span> Admin Portal
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight text-white">
                  System Administration & Analytics
                </h2>
                <p className="text-slate-300 text-base leading-relaxed mb-8">
                  Monitor platform health, track bias alerts, review system logs, and manage user roles across the organization.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 text-xs text-slate-500">
          Protected by HireWise Security & Encrypted Authentication.
        </div>
      </div>

      {/* Right side - Clean Sign In Form & Portal Section Tabs */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-900">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-slate-400 text-sm">Select your portal section below to continue</p>
          </div>

          {/* Role Section Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 mb-6">
            <button
              type="button"
              onClick={() => setActiveRole("candidate")}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === "candidate"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <span className="material-symbols-outlined text-base">person</span>
              Candidate
            </button>

            <button
              type="button"
              onClick={() => setActiveRole("recruiter")}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === "recruiter"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <span className="material-symbols-outlined text-base">work</span>
              Recruiter
            </button>

            <button
              type="button"
              onClick={() => setActiveRole("admin")}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === "admin"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              Admin
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-red-400 text-base mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {activeRole === "candidate" ? "Candidate Email" : activeRole === "recruiter" ? "Company / Recruiter Email" : "Admin Email"}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-all"
                  placeholder={
                    activeRole === "candidate"
                      ? "you@example.com"
                      : activeRole === "recruiter"
                      ? "recruiter@company.com"
                      : "admin@company.com"
                  }
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs text-primary font-medium hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-700 bg-slate-800/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-primary focus:ring-0 size-4"
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                activeRole === "candidate"
                  ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/25"
                  : activeRole === "recruiter"
                  ? "bg-purple-600 hover:bg-purple-500 shadow-purple-600/25"
                  : "bg-amber-600 hover:bg-amber-500 shadow-amber-600/25"
              }`}
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-800 pt-6">
            <p className="text-sm text-slate-400">
              Don&apos;t have an account yet?{" "}
              <Link href="/signup" className="text-primary font-semibold hover:underline">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
