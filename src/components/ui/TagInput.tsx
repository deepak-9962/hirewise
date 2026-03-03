"use client";

import { useState } from "react";

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  error?: string;
}

export default function TagInput({
  label,
  tags,
  onChange,
  placeholder = "Add item…",
  maxTags = 50,
  error,
}: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onChange([...tags, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div
        className={`flex flex-wrap gap-2 p-2 rounded-lg border transition-all
          ${
            error
              ? "border-red-400"
              : "border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/30"
          }
          bg-white dark:bg-slate-800`}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-primary/10 text-primary text-sm font-medium pl-3 pr-1.5 py-1 rounded-full flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 text-primary/50 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length < maxTags ? placeholder : ""}
          disabled={tags.length >= maxTags}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none py-1 px-1"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {tags.length >= maxTags && (
        <p className="mt-1 text-xs text-amber-500">Maximum {maxTags} items reached</p>
      )}
    </div>
  );
}
