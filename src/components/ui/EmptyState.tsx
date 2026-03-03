"use client";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl mb-3 block">
        {icon}
      </span>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>
      {description && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
