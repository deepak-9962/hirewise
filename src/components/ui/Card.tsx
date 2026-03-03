"use client";

interface CardProps {
  title?: string;
  icon?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  title,
  icon,
  action,
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="material-symbols-outlined text-slate-400 text-xl">
                {icon}
              </span>
            )}
            {title && (
              <h3 className="font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
