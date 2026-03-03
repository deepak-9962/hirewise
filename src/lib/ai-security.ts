/**
 * AI Security — Prompt injection prevention and input sanitization.
 */

// ─── Dangerous Patterns ───────────────────────────────────────────────

const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+(instructions|prompts|context)/gi,
    /ignore\s+above/gi,
    /disregard\s+(all\s+)?(previous|above|prior)/gi,
    /you\s+are\s+now\s+a/gi,
    /pretend\s+(to\s+be|you\s+are)/gi,
    /act\s+as\s+(if\s+you\s+are|a)/gi,
    /new\s+instructions?:/gi,
    /system\s*:/gi,
    /\[system\]/gi,
    /\[inst\]/gi,
    /<<\s*sys\s*>>/gi,
    /\{\{system\}\}/gi,
    /override\s+(instructions|prompt|system)/gi,
    /jailbreak/gi,
    /DAN\s+mode/gi,
    /developer\s+mode/gi,
    /bypass\s+(safety|content|filter|restriction)/gi,
    /reveal\s+(your|the)\s+(system|initial|original)\s+(prompt|instructions)/gi,
];

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Sanitize user-supplied text before injecting into AI prompts.
 *
 * - Strips known prompt injection patterns
 * - Truncates to max character limit
 * - Removes control characters
 */
export function sanitizeUserInput(text: string, maxChars = 5000): string {
    if (!text || typeof text !== "string") return "";

    let sanitized = text;

    // Remove null bytes and control characters (keep newlines / tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // Strip injection attempts
    for (const pattern of INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, "[filtered]");
    }

    // Truncate to budget
    if (sanitized.length > maxChars) {
        sanitized = sanitized.slice(0, maxChars) + "\n[truncated]";
    }

    return sanitized.trim();
}

/**
 * Truncate a full prompt to max character length.
 * Preserves the start (system instructions) and trims from the middle.
 */
export function truncatePrompt(prompt: string, maxChars = 12000): string {
    if (prompt.length <= maxChars) return prompt;

    // Keep the first 80% and last 10% of the budget
    const headBudget = Math.floor(maxChars * 0.8);
    const tailBudget = Math.floor(maxChars * 0.1);

    const head = prompt.slice(0, headBudget);
    const tail = prompt.slice(-tailBudget);

    return `${head}\n\n[... content truncated for length ...]\n\n${tail}`;
}
