"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
  label: string;
  accept: string;
  maxSizeMB: number;
  hint?: string;
  currentFile?: string;
  onUpload: (file: File) => Promise<void>;
  uploading?: boolean;
  icon?: string;
}

export default function FileUpload({
  label,
  accept,
  maxSizeMB,
  hint,
  currentFile,
  onUpload,
  uploading = false,
  icon = "upload_file",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum: ${maxSizeMB} MB`);
      return;
    }

    try {
      await onUpload(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-slate-300 dark:border-slate-600 hover:border-primary/50"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <span className="animate-spin material-symbols-outlined text-primary text-3xl">
              progress_activity
            </span>
            <p className="text-sm text-slate-500">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-3xl">
              {icon}
            </span>
            {currentFile ? (
              <>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  File uploaded
                </p>
                <p className="text-xs text-primary font-medium">
                  Click or drag to replace
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500">
                  <span className="text-primary font-medium">Click to upload</span>{" "}
                  or drag and drop
                </p>
                {hint && (
                  <p className="text-xs text-slate-400">{hint}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
