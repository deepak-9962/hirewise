"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export default function LoadingSpinner({
  size = "md",
  text,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <span
        className={`animate-spin material-symbols-outlined text-primary ${sizeMap[size]}`}
      >
        progress_activity
      </span>
      {text && (
        <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
      )}
    </div>
  );
}
