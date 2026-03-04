"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  role: "candidate" | "recruiter" | "admin";
}

const navItems: Record<string, NavItem[]> = {
  candidate: [
    { label: "Dashboard", href: "/candidate/dashboard", icon: "dashboard" },
    { label: "Browse Jobs", href: "/candidate/jobs", icon: "work" },
    { label: "My Interviews", href: "/candidate/interviews", icon: "videocam" },
    { label: "Reports", href: "/candidate/reports", icon: "description" },
    { label: "Profile", href: "/candidate/profile", icon: "person" },
  ],
  recruiter: [
    { label: "Dashboard", href: "/recruiter/dashboard", icon: "dashboard" },
    { label: "ATS Pipeline", href: "/recruiter/ats", icon: "view_kanban" },
    { label: "Jobs", href: "/recruiter/jobs", icon: "work" },
    { label: "Question Bank", href: "/recruiter/questions", icon: "quiz" },
    { label: "Monitoring", href: "/recruiter/monitoring", icon: "monitor_heart" },
    { label: "Reports", href: "/recruiter/reports", icon: "assessment" },
    { label: "Analytics", href: "/recruiter/analytics", icon: "bar_chart" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: "admin_panel_settings" },
    { label: "Users", href: "/admin/users", icon: "group" },
    { label: "System Metrics", href: "/admin/metrics", icon: "monitoring" },
    { label: "AI Usage", href: "/admin/ai-usage", icon: "smart_toy" },
    { label: "Bias Alerts", href: "/admin/bias-alerts", icon: "warning" },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const items = navItems[role] || [];

  const handleSignOut = async () => {
    await signOut();
    window.location.replace("/");
  };

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">deployed_code</span>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">HIREWISE</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 pb-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <span className="material-symbols-outlined text-xl">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Bottom section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {profile?.name || user?.email?.split("@")[0] || (role === "candidate" ? "Candidate" : role === "recruiter" ? "Recruiter" : "Admin")}
            </p>
            <p className="text-xs text-slate-500 capitalize">{role}</p>
          </div>
          <button onClick={handleSignOut} className="text-slate-400 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
