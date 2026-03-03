"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
          <h2 className="text-4xl font-black mb-6 leading-tight">AI-Powered Hiring Intelligence</h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-10">
            Join 500+ companies using adaptive AI interviews to find the best talent faster than ever.
          </p>
          <div className="space-y-4">
            {[
              { icon: "check_circle", text: "Reduce time-to-hire by 70%" },
              { icon: "check_circle", text: "AI-driven candidate assessments" },
              { icon: "check_circle", text: "Bias-aware scoring system" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-blue-100">
                <span className="material-symbols-outlined text-green-300">{item.icon}</span>
                <span>{item.text}</span>
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

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Sign in to your account to continue</p>

          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); router.push("/candidate/dashboard"); }}>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <a href="#" className="text-sm text-primary font-medium hover:underline">Forgot password?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-primary/25"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary font-semibold hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
