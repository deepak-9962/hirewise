/**
 * HIREWISE — AI Input Sanitization & Prompt Security
 *
 * Defenses:
 *   - Prompt injection detection & stripping
 *   - System override attempt blocking
 *   - Control character removal
 *   - Input length truncation
 *   - Encoding normalization
 */

// ── Prompt injection patterns ──────────────────────────────

const INJECTION_PATTERNS = [
  // Direct system override attempts
  /ignore\s+(all\s+)?previous\s+(instructions|prompts|rules)/gi,
  /ignore\s+(the\s+)?(above|everything)/gi,
  /disregard\s+(all\s+)?previous/gi,
  /forget\s+(all\s+)?previous/gi,
  /override\s+(system|instructions|prompt)/gi,
  /bypass\s+(the\s+)?(filter|security|restriction|rules)/gi,

  // Role swapping
  /you\s+are\s+now\s+a?\s*(new|different)?\s*(assistant|ai|bot|system)?/gi,
  /act\s+as\s+(if\s+you\s+are|a)\s*/gi,
  /pretend\s+(you\s+are|to\s+be)/gi,
  /role\s*play\s+as/gi,

  // System prompt extraction
  /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions|rules)/gi,
  /show\s+(me\s+)?your\s+(system\s+)?(prompt|instructions)/gi,
  /reveal\s+(your\s+)?(system|prompt|instructions)/gi,
  /print\s+(your\s+)?(system|prompt|instructions)/gi,

  // Delimiter injection
  /\[system\]/gi,
  /\[INST\]/gi,
  /<<SYS>>/gi,
  /<\|im_start\|>/gi,
  /###\s*(system|instruction|human|assistant)/gi,
  /```system/gi,

  // Score manipulation
  /give\s+(me\s+)?(a\s+)?(perfect|100|full)\s+score/gi,
  /score\s+(should|must)\s+be\s+100/gi,
  /always\s+(give|return|output)\s+(high|perfect|100)/gi,
  /set\s+(all\s+)?scores?\s+to\s+\d+/gi,
];

// ── Control character stripper ─────────────────────────────

function stripControlChars(text: string): string {
  // Remove zero-width characters, null bytes, and other control chars
  // Keep normal whitespace (\n, \r, \t, space)
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u2028-\u202F\uFEFF]/g, "");
}

// ── Main sanitizer ─────────────────────────────────────────

/**
 * Sanitize user-provided text before including in AI prompts.
 *
 * @param text - Raw user input (answer, code, cover note, etc.)
 * @param maxLength - Maximum character length (default: 8000 ≈ 2000 tokens)
 * @returns Cleaned text safe for prompt inclusion
 */
export function sanitizeInput(text: string, maxLength: number = 8000): string {
  if (!text || typeof text !== "string") return "";

  let cleaned = text;

  // 1. Normalize unicode
  cleaned = cleaned.normalize("NFC");

  // 2. Strip control characters
  cleaned = stripControlChars(cleaned);

  // 3. Remove prompt injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[FILTERED]");
  }

  // 4. Truncate
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength) + "\n[TRUNCATED]";
  }

  return cleaned.trim();
}

/**
 * Truncate a full prompt to fit within model's context window.
 * Rough estimation: 1 token ≈ 4 characters for English text.
 *
 * @param prompt - The complete prompt string
 * @param maxTokens - Token limit (default: 2048 for Mistral's effective use)
 * @returns Truncated prompt
 */
export function truncatePrompt(prompt: string, maxTokens: number = 2048): string {
  const maxChars = maxTokens * 4;
  if (prompt.length <= maxChars) return prompt;

  // Truncate from the middle of the user content (keep system instructions at start/end)
  const keepStart = Math.floor(maxChars * 0.7);
  const keepEnd = Math.floor(maxChars * 0.25);
  const truncated =
    prompt.slice(0, keepStart) +
    "\n\n[... content truncated for length ...]\n\n" +
    prompt.slice(prompt.length - keepEnd);

  return truncated;
}

/**
 * Detect if an input contains likely prompt injection attempts.
 * Returns true if injection detected (for logging/alerting).
 */
export function detectInjection(text: string): boolean {
  if (!text) return false;
  return INJECTION_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0; // Reset regex state
    return pattern.test(text);
  });
}
