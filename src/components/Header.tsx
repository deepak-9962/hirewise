"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const { user, profile, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getDashboardLink = () => {
    if (!profile) return "/candidate/dashboard";
    const map: Record<string, string> = {
      candidate: "/candidate/dashboard",
      recruiter: "/recruiter/dashboard",
      admin: "/admin/dashboard",
    };
    return map[profile.role] || "/candidate/dashboard";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">deployed_code</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">HIREWISE</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#features">Product</a>
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#how-it-works">Solutions</a>
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#pricing">Pricing</a>
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#about">About</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined text-xl">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            {loading ? (
              <div className="w-20 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
            ) : user ? (
              <>
                <span className="hidden sm:block text-sm text-slate-600 dark:text-slate-300">
                  {profile?.name || user.email}
                </span>
                <Link href={getDashboardLink()} className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-primary/20">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:flex text-sm font-semibold text-slate-700 dark:text-slate-200 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                  Login
                </Link>
                <Link href="/signup" className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-primary/20">
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
