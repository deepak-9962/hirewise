import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 py-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">deployed_code</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">HIREWISE</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              The end-to-end AI hiring platform powering resume screening, interactive coding/behavioral interviews, real-time proctoring, and bias-free candidate analytics.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="GitHub"
              >
                <span className="material-symbols-outlined text-lg">code</span>
              </a>
              <a
                href="#how-it-works"
                className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="Documentation"
              >
                <span className="material-symbols-outlined text-lg">description</span>
              </a>
              <a
                href="#faq"
                className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="Support"
              >
                <span className="material-symbols-outlined text-lg">help</span>
              </a>
            </div>
          </div>

          {/* Candidate Portal Links */}
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-4 uppercase tracking-wider">Candidate Portal</h5>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/candidate/dashboard">
                  <span className="material-symbols-outlined text-base">dashboard</span> Dashboard
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/candidate/jobs">
                  <span className="material-symbols-outlined text-base">work</span> Browse Jobs
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/candidate/interviews">
                  <span className="material-symbols-outlined text-base">videocam</span> Interviews
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/candidate/reports">
                  <span className="material-symbols-outlined text-base">assessment</span> Assessment Reports
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/candidate/profile">
                  <span className="material-symbols-outlined text-base">person</span> My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Recruiter Suite Links */}
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-4 uppercase tracking-wider">Recruiter Suite</h5>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/recruiter/dashboard">
                  <span className="material-symbols-outlined text-base">dashboard</span> Dashboard
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/recruiter/jobs">
                  <span className="material-symbols-outlined text-base">post_add</span> Job Postings
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/recruiter/ats">
                  <span className="material-symbols-outlined text-base">view_kanban</span> ATS Candidate Board
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/recruiter/monitoring">
                  <span className="material-symbols-outlined text-base">visibility</span> Live Proctoring
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/recruiter/questions">
                  <span className="material-symbols-outlined text-base">quiz</span> Question Bank
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/recruiter/analytics">
                  <span className="material-symbols-outlined text-base">insights</span> Hiring Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & Security Links */}
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-4 uppercase tracking-wider">Admin & Compliance</h5>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/admin/dashboard">
                  <span className="material-symbols-outlined text-base">admin_panel_settings</span> Overview
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/admin/users">
                  <span className="material-symbols-outlined text-base">group</span> User Management
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/admin/bias-alerts">
                  <span className="material-symbols-outlined text-base">policy</span> AI Bias Monitoring
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/admin/ai-usage">
                  <span className="material-symbols-outlined text-base">memory</span> AI Cost & Usage
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Navigation */}
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-4 uppercase tracking-wider">Navigation</h5>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <a className="hover:text-primary transition-colors" href="#portals">Role Portals</a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#features">Platform Features</a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#openings">Active Jobs</a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#how-it-works">How It Works</a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#pricing">Pricing Plans</a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#faq">Frequently Asked</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & status */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 HIREWISE AI Suite. All platform rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </span>
            <Link href="/login" className="hover:text-primary font-semibold">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-primary font-semibold">
              Register
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
