import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">deployed_code</span>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">HIREWISE</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              The intelligent hiring platform designed for high-growth teams. Automate the boring parts, focus on the people.
            </p>
            <div className="flex gap-4">
              <a className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined">alternate_email</span>
              </a>
              <a className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined">public</span>
              </a>
              <a className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined">language</span>
              </a>
            </div>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-6">Product</h5>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><Link className="hover:text-primary transition-colors" href="#">Platform</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Features</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Integrations</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-6">Solutions</h5>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><Link className="hover:text-primary transition-colors" href="#">Enterprise</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Startups</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Technical</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Graduate</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-6">Company</h5>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><Link className="hover:text-primary transition-colors" href="#">About Us</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Careers</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Blog</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-6">Legal</h5>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><Link className="hover:text-primary transition-colors" href="#">Privacy Policy</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Terms of Service</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Cookie Policy</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">© 2026 HIREWISE Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-sm text-slate-500 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">support_agent</span> 24/7 Support
            </span>
            <span className="text-sm text-slate-500 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">language</span> English (US)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
