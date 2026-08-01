"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useJobs } from "@/hooks/useSupabase";

export default function Home() {
  const { user, profile, loading: authLoading } = useAuth();
  const { data: jobsData, loading: jobsLoading } = useJobs("active");
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoTab, setDemoTab] = useState<"resume" | "interview" | "report">("resume");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const jobs = (jobsData ?? []) as any[];

  // Fallback demo jobs if DB hasn't loaded yet or has 0 items
  const featuredJobs = jobs.length > 0 ? jobs.slice(0, 4) : [
    {
      id: "demo-1",
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      type: "Full-time",
      openings: 3,
      target_skills: ["React", "TypeScript", "Node.js", "Supabase"],
      description: "Build high-throughput web applications with cutting-edge frontend architecture and robust APIs."
    },
    {
      id: "demo-2",
      title: "AI / Machine Learning Engineer",
      department: "AI Research",
      type: "Full-time",
      openings: 2,
      target_skills: ["Python", "PyTorch", "LLMs", "RAG"],
      description: "Design automated candidate evaluation pipelines, LLM prompt chaining, and real-time proctoring metrics."
    },
    {
      id: "demo-3",
      title: "Lead Technical Recruiter",
      department: "Talent Acquisition",
      type: "Full-time",
      openings: 1,
      target_skills: ["Sourcing", "ATS Management", "Technical Screening"],
      description: "Streamline talent acquisition workflows, oversee AI screening pipelines, and scale engineering teams."
    },
    {
      id: "demo-4",
      title: "DevOps & Cloud Architect",
      department: "Infrastructure",
      type: "Contract",
      openings: 2,
      target_skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
      description: "Maintain 99.99% uptime for AI interview room streaming infrastructure and scalable worker pools."
    }
  ];

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

  const faqItems = [
    {
      q: "How does HireWise AI evaluate candidates during interviews?",
      a: "HireWise analyzes responses using multimodal models (code correctness, speech-to-text clarity, problem-solving structure, and sentiment). It compares answers against standard rubrics without human subjectivity."
    },
    {
      q: "Is the live candidate proctoring system secure and privacy-focused?",
      a: "Yes. Proctoring features monitor webcam face detection, tab switching, and copy-paste events during test sessions. All data is encrypted end-to-end and stored securely with strict retention policies."
    },
    {
      q: "How does HireWise prevent AI bias in recruitment?",
      a: "HireWise includes a built-in AI Bias Monitoring module (`/admin/bias-alerts`) that audits evaluation scores across demographic parameters, flagging discrepancies and maintaining fair scoring criteria."
    },
    {
      q: "Can candidates practice before taking official company assessments?",
      a: "Candidates can log into their Candidate Dashboard (`/candidate/dashboard`), review target skills, take practice coding assessments, and inspect past feedback reports."
    },
    {
      q: "How fast can recruiters set up a new job and question bank?",
      a: "With our AI Question Generator (`/recruiter/questions`), recruiters can generate tailored coding and behavioral questions in under 30 seconds for any skill set."
    }
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors">
      <Header />

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-20 lg:py-28">
          {/* Animated Background Gradients */}
          <div className="absolute top-10 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-orb-1 pointer-events-none" />
          <div className="absolute bottom-10 -right-32 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-orb-2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/5 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column Text & CTAs */}
              <div className="lg:col-span-7 flex flex-col gap-8">
                {/* Platform Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 text-primary text-xs sm:text-sm font-bold w-fit animate-hero-fade-up">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
                  <span>Next-Gen Hiring Platform</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">98.4% Match Accuracy</span>
                </div>

                {/* Main Headline */}
                <h1 className="animate-hero-fade-up animate-hero-delay-2 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                  Hire 10x Faster with <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-indigo-600">
                    AI-Powered Precision
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="animate-hero-fade-up animate-hero-delay-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                  Automate candidate screening, conduct proctored coding and behavioral AI interviews, and eliminate hiring bias with comprehensive analytics—all in one unified platform.
                </p>

                {/* Action Buttons */}
                <div className="animate-hero-fade-up animate-hero-delay-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                  {!authLoading && user ? (
                    <Link
                      href={getDashboardLink()}
                      className="bg-primary text-white px-8 py-4 rounded-2xl text-base font-bold hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl shadow-primary/25 flex items-center justify-center gap-2 group"
                    >
                      <span className="material-symbols-outlined">dashboard</span>
                      Go to {getRoleLabel()} Dashboard
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>
                  ) : (
                    <Link
                      href="/signup"
                      className="bg-primary text-white px-8 py-4 rounded-2xl text-base font-bold hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl shadow-primary/25 flex items-center justify-center gap-2 group"
                    >
                      Get Started Free
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>
                  )}

                  <button
                    onClick={() => setDemoModalOpen(true)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-8 py-4 rounded-2xl text-base font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-primary">play_circle</span>
                    Interactive Demo
                  </button>
                </div>

                {/* Key Metrics Ticker */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">70%</p>
                    <p className="text-xs text-slate-500 font-medium">Faster Time-to-Hire</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">99.2%</p>
                    <p className="text-xs text-slate-500 font-medium">Proctoring Accuracy</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">0%</p>
                    <p className="text-xs text-slate-500 font-medium">AI Demographic Bias</p>
                  </div>
                </div>
              </div>

              {/* Right Column Interactive Hero Graphic */}
              <div className="lg:col-span-5 relative animate-hero-scale-in">
                <div className="rounded-3xl bg-gradient-to-tr from-primary/20 via-blue-500/10 to-indigo-500/20 p-2 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
                  <div className="w-full bg-slate-900 text-white rounded-2xl p-5 shadow-2xl space-y-4 overflow-hidden relative">
                    {/* Header bar */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-red-500" />
                        <div className="size-3 rounded-full bg-yellow-500" />
                        <div className="size-3 rounded-full bg-green-500" />
                      </div>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live Interview Room #8492
                      </span>
                    </div>

                    {/* Candidate Info Pill */}
                    <div className="bg-slate-800/80 p-3 rounded-xl flex items-center justify-between border border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center border border-primary/30">
                          JD
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Jane Doe</p>
                          <p className="text-xs text-slate-400">Senior Full Stack Applicant</p>
                        </div>
                      </div>
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                        Proctored & Active
                      </span>
                    </div>

                    {/* Simulated Code Editor Preview */}
                    <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-emerald-400 border border-slate-800 space-y-1">
                      <p className="text-slate-500">// AI Assessment Problem: Algorithmic Efficiency</p>
                      <p className="text-blue-400">function <span className="text-yellow-300">findOptimizedPath</span>(nodes) &#123;</p>
                      <p className="pl-4 text-purple-300">const <span className="text-white">score</span> = calculateSimilarity(nodes);</p>
                      <p className="pl-4 text-emerald-300">return score &gt; 0.95 ? <span className="text-amber-300 font-bold">"Strong Fit"</span> : <span className="text-slate-400">"Re-evaluate"</span>;</p>
                      <p className="text-blue-400">&#125;</p>
                    </div>

                    {/* AI Feedback Realtime Pill */}
                    <div className="bg-primary/10 border border-primary/30 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-primary text-base">smart_toy</span>
                        <span className="text-slate-200">AI Score: <strong className="text-emerald-400 font-bold">98/100</strong> (Top 2%)</span>
                      </div>
                      <button
                        onClick={() => setDemoModalOpen(true)}
                        className="text-[11px] bg-primary text-white px-3 py-1 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                      >
                        Inspect Demo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 animate-hero-slide-left">
                  <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Proctoring Status</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">100% Integrity Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROLE PORTALS DIRECTORY SECTION (#portals) */}
        <section id="portals" className="py-20 bg-white dark:bg-background-dark/80 border-y border-slate-200 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Integrated Workspace
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">
                Tailored Portals for Candidates, Recruiters & Admins
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mt-3">
                HireWise connects candidates, recruitment teams, and system administrators into one seamless workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* CANDIDATE PORTAL CARD */}
              <div className="bg-background-light dark:bg-slate-900/60 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl">
                <div>
                  <div className="size-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">person</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Candidate Portal</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    Browse open roles, complete AI-driven coding & behavioral assessments, and view detailed performance feedback reports.
                  </p>

                  <div className="space-y-2 mb-8">
                    <Link href="/candidate/jobs" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-primary transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">work</span> Browse Open Jobs</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link href="/candidate/interviews" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-primary transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">videocam</span> Active & Past Tests</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link href="/candidate/reports" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-primary transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">assessment</span> Assessment Reports</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link href="/candidate/profile" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-primary transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">account_circle</span> Manage Profile</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                <Link
                  href="/candidate/dashboard"
                  className="w-full bg-blue-600 text-white font-bold text-sm py-3 rounded-xl text-center hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  Enter Candidate Portal
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>

              {/* RECRUITER SUITE CARD */}
              <div className="bg-background-light dark:bg-slate-900/60 rounded-3xl p-8 border border-primary/30 dark:border-primary/30 hover:border-primary transition-all flex flex-col justify-between group shadow-md hover:shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase">
                  Most Popular
                </div>
                <div>
                  <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">badge</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Recruiter Suite</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    Post jobs, manage candidate ATS pipelines, build AI question banks, and conduct live proctored candidate evaluations.
                  </p>

                  <div className="space-y-2 mb-8">
                    <Link href="/recruiter/jobs" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-primary transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">post_add</span> Manage Job Postings</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link href="/recruiter/ats" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-primary transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">view_kanban</span> ATS Candidate Board</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link href="/recruiter/monitoring" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-primary transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">visibility</span> Live Proctoring Feed</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link href="/recruiter/questions" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-primary transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">quiz</span> AI Question Generator</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link href="/recruiter/analytics" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-primary transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">insights</span> Hiring Analytics</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                <Link
                  href="/recruiter/dashboard"
                  className="w-full bg-primary text-white font-bold text-sm py-3 rounded-xl text-center hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  Enter Recruiter Suite
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>

              {/* ADMIN & COMPLIANCE HUB CARD */}
              <div className="bg-background-light dark:bg-slate-900/60 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl">
                <div>
                  <div className="size-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Admin & Security</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    System governance, user permissions, real-time AI bias monitoring, and token/API cost tracking.
                  </p>

                  <div className="space-y-2 mb-8">
                    <Link href="/admin/dashboard" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-indigo-500 transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">admin_panel_settings</span> Admin Overview</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link href="/admin/users" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-indigo-500 transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">group</span> User Role Management</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link href="/admin/bias-alerts" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-indigo-500 transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">policy</span> AI Bias Alerts & Fairness</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link href="/admin/ai-usage" className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:text-indigo-500 transition-colors border border-slate-200/80 dark:border-slate-700/80">
                      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">memory</span> Token & Cost Analytics</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                <Link
                  href="/admin/dashboard"
                  className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold text-sm py-3 rounded-xl text-center hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  Enter Admin Hub
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE FEATURED OPENINGS SECTION (#openings) */}
        <section id="openings" className="py-20 bg-background-light dark:bg-background-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Explore Careers
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
                  Featured Open Positions
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-base mt-1">
                  Apply directly to take an automated AI assessment and fast-track your application.
                </p>
              </div>

              <Link
                href="/candidate/jobs"
                className="bg-white dark:bg-slate-800 text-primary border border-primary/30 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2 w-fit"
              >
                View All Open Jobs
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>

            {jobsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-44 bg-slate-200 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={job.id.startsWith("demo-") ? "/candidate/jobs" : `/candidate/jobs/${job.id}`}
                    className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-primary dark:hover:border-primary transition-all group hover:shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            {job.department || "General"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                            {job.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                        {job.description || "Exciting opportunity to work with high-impact teams leveraging modern tools and collaborative environments."}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(job.target_skills ?? []).map((skill: string) => (
                          <span key={skill} className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-2.5 py-0.5 rounded-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-primary">
                      <span>Instant AI Evaluation Enabled</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Apply & Assessment <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* PLATFORM FEATURES GRID (#features) */}
        <section id="features" className="py-24 bg-white dark:bg-background-dark/90 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-primary font-extrabold text-xs tracking-widest uppercase mb-3">Platform Capability</h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
                Built for Precision, Scalability, and Speed
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
                Everything required to evaluate talent objectively with automated intelligence and real-time oversight.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "psychology",
                  title: "AI Resume & Candidate Ranking",
                  desc: "Automatically parse resumes against target job requirements, match skill sets, and rank top applicants instantly.",
                  link: "/recruiter/ats"
                },
                {
                  icon: "terminal",
                  title: "Interactive Coding Environment",
                  desc: "Multi-language code execution window with real-time starter code, test case verification, and syntax checks.",
                  link: "/candidate/interviews"
                },
                {
                  icon: "visibility",
                  title: "Live Proctoring & Security",
                  desc: "Facial detection, tab switch monitoring, copy-paste prevention, and automated fraud score flags.",
                  link: "/recruiter/monitoring"
                },
                {
                  icon: "quiz",
                  title: "AI Question Bank Generator",
                  desc: "Instantly create tailored technical problems, algorithm challenges, and behavioral prompts with custom difficulty.",
                  link: "/recruiter/questions"
                },
                {
                  icon: "balance",
                  title: "AI Bias Auditing & Fairness",
                  desc: "Continuous fairness monitoring to ensure evaluations adhere strictly to job skills and performance metrics.",
                  link: "/admin/bias-alerts"
                },
                {
                  icon: "analytics",
                  title: "Deep Recruitment Analytics",
                  desc: "Track hiring funnel conversion, average assessment completion time, and candidate score distribution.",
                  link: "/recruiter/analytics"
                }
              ].map((feat) => (
                <Link
                  key={feat.title}
                  href={feat.link}
                  className="p-8 rounded-3xl bg-background-light dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-all group flex flex-col justify-between hover:shadow-lg"
                >
                  <div>
                    <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                      <span className="material-symbols-outlined text-3xl">{feat.icon}</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary transition-colors">
                      {feat.title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">{feat.desc}</p>
                  </div>

                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    Explore Feature <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION (#how-it-works) */}
        <section id="how-it-works" className="py-24 bg-background-light dark:bg-background-dark/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Simple 4-Step Workflow
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-4 mb-6">
                From Job Creation to Offer Letter
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
                Automating every tedious phase of technical screening while maintaining candidate engagement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {[
                {
                  step: 1,
                  title: "Post Job & Criteria",
                  desc: "Recruiters upload job descriptions and target skills. AI generates tailored assessment questions instantly.",
                  link: "/recruiter/jobs"
                },
                {
                  step: 2,
                  title: "Candidates Apply",
                  desc: "Candidates submit applications and instantly launch their proctored assessment session.",
                  link: "/candidate/jobs"
                },
                {
                  step: 3,
                  title: "Proctored AI Assessment",
                  desc: "Candidates write code and answer prompts in real-time under webcam and anti-cheating supervision.",
                  link: "/recruiter/monitoring"
                },
                {
                  step: 4,
                  title: "Detailed Report & Hire",
                  desc: "Receive comprehensive AI evaluation cards, skill radar scores, and make confident data-backed decisions.",
                  link: "/recruiter/reports"
                }
              ].map((item) => (
                <Link
                  key={item.step}
                  href={item.link}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-primary transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-black mb-6 shadow-lg shadow-primary/20">
                      0{item.step}
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{item.desc}</p>
                  </div>
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    Open Workflow <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION (#pricing) */}
        <section id="pricing" className="py-24 bg-white dark:bg-background-dark/90 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Simple Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 mb-6 tracking-tight">
                Plans Built for Growing Engineering Teams
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
                No hidden fees. Start free and scale up as your candidate volume expands.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Starter */}
              <div className="bg-background-light dark:bg-slate-900/60 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Candidate Free</h3>
                  <p className="text-xs text-slate-500 mb-6">For candidates and individual practice</p>
                  <div className="text-4xl font-black text-slate-900 dark:text-white mb-6">
                    $0 <span className="text-sm font-normal text-slate-400">/ forever</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 mb-8">
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> Unlimited Job Applications</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> Interactive AI Interview Access</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> Assessment Result Feedback Reports</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> Candidate Profile Builder</li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="w-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm py-3 rounded-xl text-center hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Create Candidate Account
                </Link>
              </div>

              {/* Recruiter Pro */}
              <div className="bg-background-light dark:bg-slate-900/90 rounded-3xl p-8 border-2 border-primary shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase">
                  Recommended
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Recruiter Pro</h3>
                  <p className="text-xs text-slate-500 mb-6">For growing teams & tech startups</p>
                  <div className="text-4xl font-black text-slate-900 dark:text-white mb-6">
                    $149 <span className="text-sm font-normal text-slate-400">/ month</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 mb-8">
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> Unlimited Job Postings</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> Full ATS Candidate Kanban Pipeline</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> Live Anti-Cheating Proctoring Feed</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> AI Question Bank & Test Generator</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> hiring Analytics & Candidate Reports</li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="w-full bg-primary text-white font-bold text-sm py-3 rounded-xl text-center hover:bg-blue-700 transition-colors shadow-lg shadow-primary/25"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>

              {/* Enterprise */}
              <div className="bg-background-light dark:bg-slate-900/60 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Enterprise</h3>
                  <p className="text-xs text-slate-500 mb-6">For large enterprises & high-volume hiring</p>
                  <div className="text-4xl font-black text-slate-900 dark:text-white mb-6">
                    Custom <span className="text-sm font-normal text-slate-400">/ tailored</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 mb-8">
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> Everything in Recruiter Pro</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> Dedicated Admin & Security Governance</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> Custom AI Bias Auditing Engine</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> SSO, SAML, & Custom API Integrations</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span> 24/7 Priority SLA Support</li>
                  </ul>
                </div>
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="w-full bg-slate-900 dark:bg-slate-800 text-white font-bold text-sm py-3 rounded-xl text-center hover:bg-slate-800 transition-colors"
                >
                  Request Enterprise Demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS (#faq) */}
        <section id="faq" className="py-24 bg-background-light dark:bg-background-dark/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Help & Answers
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full p-6 text-left font-bold text-base text-slate-900 dark:text-white flex items-center justify-between gap-4"
                  >
                    <span>{item.q}</span>
                    <span className="material-symbols-outlined text-primary text-xl transition-transform">
                      {activeFaq === idx ? "remove" : "add"}
                    </span>
                  </button>
                  {activeFaq === idx && (
                    <div className="px-6 pb-6 pt-0 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 mt-2 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="py-20 bg-white dark:bg-background-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-primary via-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,#ffffff_1px,transparent_1px)] [background-size:30px_30px]" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                  Transform Your Hiring Strategy Today
                </h2>
                <p className="text-blue-100 text-base sm:text-lg leading-relaxed">
                  Experience seamless AI screening, live proctored coding assessments, and unbiased candidate insights.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Link
                    href="/signup"
                    className="bg-white text-primary px-8 py-4 rounded-xl font-extrabold text-base hover:bg-slate-100 transition-all shadow-lg"
                  >
                    Get Started For Free
                  </Link>
                  <Link
                    href="/candidate/jobs"
                    className="bg-blue-600 text-white border border-white/20 px-8 py-4 rounded-xl font-extrabold text-base hover:bg-blue-500 transition-all"
                  >
                    Browse Open Jobs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* INTERACTIVE DEMO MODAL */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">smart_toy</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Interactive AI Assessment Demo
                  </h3>
                  <p className="text-xs text-slate-500">Live simulated walkthrough of HireWise AI features</p>
                </div>
              </div>
              <button
                onClick={() => setDemoModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
              <button
                onClick={() => setDemoTab("resume")}
                className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  demoTab === "resume"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-base">description</span>
                1. AI Resume Screening
              </button>
              <button
                onClick={() => setDemoTab("interview")}
                className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  demoTab === "interview"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-base">code</span>
                2. Live Interview & Proctoring
              </button>
              <button
                onClick={() => setDemoTab("report")}
                className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  demoTab === "report"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-base">analytics</span>
                3. Recruiter Feedback Report
              </button>
            </div>

            {/* Demo Tab Content */}
            {demoTab === "resume" && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Uploaded Resume: Jane_Doe_Senior_Dev.pdf</h4>
                    <p className="text-xs text-slate-500">Target Role: Senior Full Stack Engineer (React + Node.js)</p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
                    95% Match
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center">
                    <p className="text-2xl font-black text-primary">95/100</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Skill Alignment</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                    <p className="text-2xl font-black text-emerald-600">6+ Yrs</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Verified Experience</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-center">
                    <p className="text-2xl font-black text-indigo-600">Passed</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Initial Screening</p>
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs space-y-2">
                  <p className="text-slate-400">// AI Extraction Summary:</p>
                  <p><span className="text-blue-400">Core Technologies:</span> TypeScript, Next.js, GraphQL, PostgreSQL, TailwindCSS, AWS</p>
                  <p><span className="text-emerald-400">Highlight:</span> Built real-time streaming dashboard handling 50k concurrent users.</p>
                  <p><span className="text-amber-400">Next Step:</span> Enable Proctored Technical Coding Test.</p>
                </div>
              </div>
            )}

            {demoTab === "interview" && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-950 text-white p-5 rounded-2xl font-mono text-xs space-y-3 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                    <span>Problem #1: Realtime Rate Limiter</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> Webcam Proctoring Active
                    </span>
                  </div>
                  <p className="text-slate-300">// Implement a token bucket algorithm for API requests:</p>
                  <p className="text-blue-400">class <span className="text-yellow-300">RateLimiter</span> &#123;</p>
                  <p className="pl-4 text-purple-300">constructor(tokensPerSec) &#123; ... &#125;</p>
                  <p className="pl-4 text-emerald-300">allowRequest(clientId) &#123; return true; &#125;</p>
                  <p className="text-blue-400">&#125;</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500 text-2xl">security</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Proctoring Monitor</p>
                      <p className="text-[11px] text-slate-500">0 Tab Switches | 0 Copy Paste Events | Single Face Verified</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-emerald-500 text-white px-3 py-1 rounded-full">
                    Clean Session
                  </span>
                </div>
              </div>
            )}

            {demoTab === "report" && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">Candidate Final Recommendation</h4>
                    <p className="text-xs text-slate-500">Overall Score: 96/100 (Strong Hire)</p>
                  </div>
                  <Link
                    href="/recruiter/reports"
                    onClick={() => setDemoModalOpen(false)}
                    className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    View All Reports
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400 font-semibold">Code Quality</p>
                    <p className="text-lg font-black text-primary">98%</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400 font-semibold">Speed / Time</p>
                    <p className="text-lg font-black text-emerald-500">92%</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400 font-semibold">Integrity</p>
                    <p className="text-lg font-black text-blue-500">100%</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400 font-semibold">Bias Check</p>
                    <p className="text-lg font-black text-indigo-500">Passed</p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-500">
                Want to test real candidates or take a live test?
              </p>
              <div className="flex gap-3">
                <Link
                  href="/candidate/jobs"
                  onClick={() => setDemoModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Browse Open Positions
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setDemoModalOpen(false)}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  Sign Up Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
