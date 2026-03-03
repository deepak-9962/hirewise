/**
 * HIREWISE — AI Engine: Ollama + Mistral (Local LLM)
 *
 * Configured via environment variables:
 *   OLLAMA_BASE_URL    = "http://localhost:11434"
 *   OLLAMA_MODEL       = "mistral"
 *   AI_TIMEOUT_MS      = 30000
 *   AI_MAX_RETRIES     = 2
 */

import { createHash } from "crypto";

// ── Types ──────────────────────────────────────────────────

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generate(prompt: string): Promise<string>;
}

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

// ── Configuration ──────────────────────────────────────────

function getConfig() {
  return {
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    ollamaModel: process.env.OLLAMA_MODEL ?? "mistral",
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS ?? "30000", 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES ?? "2", 10),
  };
}

// ── LRU Cache ──────────────────────────────────────────────

const CACHE_MAX = 100;
const cache = new Map<string, { value: string; ts: number }>();

function cacheKey(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex").slice(0, 16);
}

function getCached(prompt: string): string | null {
  const key = cacheKey(prompt);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > 600_000) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(prompt: string, value: string): void {
  const key = cacheKey(prompt);
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { value, ts: Date.now() });
}

// ── Ollama Provider ────────────────────────────────────────

class OllamaProvider implements AIProvider {
  readonly name = "ollama";
  readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl: string, model: string, timeoutMs: number) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async generate(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            num_predict: 2048,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Ollama returned ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as OllamaResponse;

      if (!data.response) {
        throw new Error("Ollama returned empty response");
      }

      return data.response.trim();
    } finally {
      clearTimeout(timer);
    }
  }
}

// ── Provider Factory ───────────────────────────────────────

let _cachedProvider: AIProvider | null = null;

function buildProvider(): AIProvider {
  const cfg = getConfig();
  return new OllamaProvider(cfg.ollamaBaseUrl, cfg.ollamaModel, cfg.timeoutMs);
}

export function getAIProvider(): AIProvider {
  if (!_cachedProvider) {
    _cachedProvider = buildProvider();
  }
  return _cachedProvider;
}

// ── Core Generate with Retry + Cache + Logging ─────────────

export async function aiGenerate(prompt: string, options?: { skipCache?: boolean }): Promise<string> {
  if (!options?.skipCache) {
    const cached = getCached(prompt);
    if (cached) {
      console.log(`[AI] Cache hit (${cacheKey(prompt)})`);
      return cached;
    }
  }

  const cfg = getConfig();
  const provider = getAIProvider();
  const maxRetries = cfg.maxRetries;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const start = Date.now();
      const result = await provider.generate(prompt);
      const elapsed = Date.now() - start;

      console.log(
        `[AI] Provider: ${provider.name}, Model: ${provider.model}, ` +
        `Time: ${elapsed}ms, Attempt: ${attempt + 1}/${maxRetries + 1}`
      );

      setCache(prompt, result);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[AI] ${provider.name} attempt ${attempt + 1} failed: ${lastError.message}`
      );

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw new Error(
    `AI generation failed after ${maxRetries + 1} attempts on ${provider.name}. ` +
    `Last error: ${lastError?.message}`
  );
}

// ── Current model name (for DB logging) ────────────────────

export function getCurrentModelName(): string {
  const provider = getAIProvider();
  return provider.model;
}

export function resetProviders(): void {
  _cachedProvider = null;
  cache.clear();
}
