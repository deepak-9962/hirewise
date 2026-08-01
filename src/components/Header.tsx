"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!profile) return "/candidate/dashboard";
    const map: Record<string, string> = {
      candidate: "/candidate/dashboard",
      recruiter: "/recruiter/dashboard",
      admin: "/admin/dashboard",
    };
    return map[profile.role] || "/candidate/dashboard";
  };

  const getRoleLabel = () => {
    if (!profile?.role) return "Candidate";
    return profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-10 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">deployed_code</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">HIREWISE</span>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider hidden sm:block">AI Hiring Platform</span>
            </div>
          </Link>

          {/* Desktop Nav (Pricing removed, About added) */}
          <nav className="hidden lg:flex items-center gap-7">
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#portals">
              Portals
            </a>
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#features">
              Features
            </a>
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#openings">
              Jobs
            </a>
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#how-it-works">
              How it Works
            </a>
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#about">
              About
            </a>
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#faq">
              FAQ
            </a>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
              title="Toggle Dark/Light Mode"
            >
              <span className="material-symbols-outlined text-xl">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {loading ? (
              <div className="w-24 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1 max-w-[120px]">
                    {profile?.name || user.email}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary self-end uppercase">
                    {getRoleLabel()}
                  </span>
                </div>

                <Link
                  href={getDashboardLink()}
                  className="bg-primary text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">dashboard</span>
                  Dashboard
                </Link>

                <button
                  onClick={async () => {
                    await signOut();
                    window.location.replace("/");
                  }}
                  className="hidden sm:flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-red-200 dark:border-red-900/50"
                  title="Log out"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-1"
                >
                  Get Started
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 dark:border-slate-800 animate-fade-in space-y-3">
            <div className="flex flex-col gap-2">
              <a
                onClick={() => setMobileMenuOpen(false)}
                href="#portals"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Role Portals
              </a>
              <a
                onClick={() => setMobileMenuOpen(false)}
                href="#features"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Features
              </a>
              <a
                onClick={() => setMobileMenuOpen(false)}
                href="#openings"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Open Positions
              </a>
              <a
                onClick={() => setMobileMenuOpen(false)}
                href="#how-it-works"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                How it Works
              </a>
              <a
                onClick={() => setMobileMenuOpen(false)}
                href="#about"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                About Us
              </a>
              <a
                onClick={() => setMobileMenuOpen(false)}
                href="#faq"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                FAQ
              </a>
            </div>

            {user && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center px-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {profile?.name || user.email}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">{getRoleLabel()}</span>
                </div>
                <button
                  onClick={async () => {
                    await signOut();
                    window.location.replace("/");
                  }}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">logout</span> Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
