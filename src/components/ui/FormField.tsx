"use client";

import { forwardRef } from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          ref={ref}
          className={`w-full px-3 py-2 rounded-lg border text-sm transition-all
            ${
              error
                ? "border-red-400 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
                : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/30"
            }
            bg-white dark:bg-slate-800 text-slate-900 dark:text-white
            placeholder-slate-400 focus:outline-none
            ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {hint && !error && (
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
export default FormField;
