import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">deployed_code</span>
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">HIREWISE</span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              The intelligent hiring platform powering skill-first screening, live proctored coding assessments, and demographic bias monitoring for modern recruitment teams.
            </p>
          </div>

          {/* Core Portals */}
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-3 uppercase tracking-wider">Portals</h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/candidate/dashboard">
                  <span className="material-symbols-outlined text-sm">person</span> Candidate Portal
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/recruiter/dashboard">
                  <span className="material-symbols-outlined text-sm">badge</span> Recruiter Suite
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors flex items-center gap-1.5" href="/admin/dashboard">
                  <span className="material-symbols-outlined text-sm">admin_panel_settings</span> Admin Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Platform Navigation */}
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-3 uppercase tracking-wider">Platform</h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li><a className="hover:text-primary transition-colors" href="#features">Features</a></li>
              <li><a className="hover:text-primary transition-colors" href="#openings">Open Jobs</a></li>
              <li><a className="hover:text-primary transition-colors" href="#how-it-works">How it Works</a></li>
              <li><a className="hover:text-primary transition-colors" href="#about">About Us</a></li>
              <li><a className="hover:text-primary transition-colors" href="#faq">FAQ</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 HIREWISE AI Platform. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Systems Operational
            </span>
            <Link href="/login" className="hover:text-primary font-semibold">Sign In</Link>
            <Link href="/signup" className="hover:text-primary font-semibold">Get Started</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
