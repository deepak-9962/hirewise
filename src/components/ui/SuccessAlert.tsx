"use client";

interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
}

export default function SuccessAlert({ message, onDismiss }: SuccessAlertProps) {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
      <span className="material-symbols-outlined text-green-500">
        check_circle
      </span>
      <p className="flex-1 text-sm font-medium text-green-700 dark:text-green-300">
        {message}
      </p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      )}
    </div>
  );
}
