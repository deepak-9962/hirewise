"use client";

import { SkeletonCard } from "./Skeleton";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export default function LoadingSpinner({
  size = "md",
  text,
}: LoadingSpinnerProps) {
  return (
    <div className="w-full space-y-4 py-6 animate-pulse">
      {text && (
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">{text}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard className="hidden md:block" />
      </div>
    </div>
  );
}
