"use client";

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorAlert({
  message,
  onRetry,
  onDismiss,
}: ErrorAlertProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
      <span className="material-symbols-outlined text-red-500 mt-0.5">
        error
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          {message}
        </p>
        <div className="flex gap-3 mt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs font-semibold text-slate-500 hover:underline"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
