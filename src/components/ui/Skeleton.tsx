"use client";

import React from "react";

export function Skeleton({
  className = "",
  width,
  height,
  rounded = "rounded-lg",
}: {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`bg-slate-200 dark:bg-slate-800 animate-pulse ${rounded} ${className}`}
      style={{
        width: width,
        height: height,
      }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          className={i === lines - 1 ? "w-3/4" : "w-full"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm animate-pulse ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton height="20px" className="w-1/2" />
          <Skeleton height="12px" className="w-1/3" />
        </div>
        <Skeleton height="28px" width="70px" rounded="rounded-full" />
      </div>
      <SkeletonText lines={2} />
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <Skeleton height="14px" width="100px" />
        <Skeleton height="14px" width="80px" />
      </div>
    </div>
  );
}

export function SkeletonGrid({
  count = 4,
  columns = "grid-cols-1 md:grid-cols-2",
  className = "",
}: {
  count?: number;
  columns?: string;
  className?: string;
}) {
  return (
    <div className={`grid ${columns} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
  className = "",
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-hidden animate-pulse ${className}`}
    >
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="16px" className="flex-1" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} height="14px" className="flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-8 animate-pulse ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton height="28px" width="220px" />
          <Skeleton height="14px" width="300px" />
        </div>
        <Skeleton height="40px" width="140px" rounded="rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="flex justify-between items-center">
              <Skeleton height="14px" width="90px" />
              <Skeleton height="32px" width="32px" rounded="rounded-xl" />
            </div>
            <Skeleton height="32px" width="80px" />
          </div>
        ))}
      </div>

      <SkeletonGrid count={4} />
    </div>
  );
}

export default Skeleton;
