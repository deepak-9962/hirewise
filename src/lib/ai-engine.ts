/**
 * AI Engine — Modular provider abstraction for LLM calls.
 *
 * Supports:
 *  - Ollama (local, default: Mistral)
 *  - Gemini (cloud fallback)
 *
 * Controlled via environment variables:
 *  - AI_PROVIDER = "ollama" | "gemini" | "auto"
 *  - OLLAMA_BASE_URL = "http://localhost:11434"
 *  - OLLAMA_MODEL = "mistral"
 */

// ─── Provider Interface ───────────────────────────────────────────────

export interface AIProvider {
    name: string;
    generateContent(prompt: string): Promise<string>;
}

export interface AICallMetrics {
    provider: string;
    model: string;
    latencyMs: number;
    promptLength: number;
    responseLength: number;
}

let _lastMetrics: AICallMetrics | null = null;
export function getLastCallMetrics(): AICallMetrics | null {
    return _lastMetrics;
}

// ─── Ollama Provider ──────────────────────────────────────────────────

const OLLAMA_TIMEOUT_MS = 120_000; // 2 min for local inference
const OLLAMA_MAX_RETRIES = 2;

class OllamaProvider implements AIProvider {
    name = "ollama";
    private baseUrl: string;
    private model: string;

    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
        this.model = process.env.OLLAMA_MODEL || "mistral";
    }

    async generateContent(prompt: string): Promise<string> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= OLLAMA_MAX_RETRIES; attempt++) {
            try {
                const start = Date.now();

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

                const res = await fetch(`${this.baseUrl}/api/generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: this.model,
                        prompt,
                        stream: false,
                        options: {
                            temperature: 0.3,     // Low temp for deterministic scoring
                            num_predict: 2048,    // Max tokens
                        },
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeout);

                if (!res.ok) {
                    const errBody = await res.text().catch(() => "");
                    throw new Error(`Ollama returned ${res.status}: ${errBody}`);
                }

                const data = await res.json();
                const response = data.response || "";
                const latencyMs = Date.now() - start;

                _lastMetrics = {
                    provider: "ollama",
                    model: this.model,
                    latencyMs,
                    promptLength: prompt.length,
                    responseLength: response.length,
                };

                console.log(`[AI] Ollama inference: ${latencyMs}ms | model=${this.model} | attempt=${attempt + 1}`);
                return response;
            } catch (err: any) {
                lastError = err;
                if (err.name === "AbortError") {
                    console.warn(`[AI] Ollama timeout after ${OLLAMA_TIMEOUT_MS}ms (attempt ${attempt + 1})`);
                } else {
                    console.warn(`[AI] Ollama error (attempt ${attempt + 1}):`, err.message);
                }
                // Small backoff before retry
                if (attempt < OLLAMA_MAX_RETRIES) {
                    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                }
            }
        }

        throw new Error(`Ollama failed after ${OLLAMA_MAX_RETRIES + 1} attempts: ${lastError?.message}`);
    }
}

// ─── Gemini Provider ──────────────────────────────────────────────────

class GeminiProvider implements AIProvider {
    name = "gemini";
    private model: any = null;

    private getModel() {
        if (!this.model) {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
            // Dynamic import to avoid requiring the package when using Ollama
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(apiKey);
            this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        }
        return this.model;
    }

    async generateContent(prompt: string): Promise<string> {
        const start = Date.now();
        const model = this.getModel();
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const latencyMs = Date.now() - start;

        _lastMetrics = {
            provider: "gemini",
            model: "gemini-1.5-flash",
            latencyMs,
            promptLength: prompt.length,
            responseLength: text.length,
        };

        console.log(`[AI] Gemini inference: ${latencyMs}ms`);
        return text;
    }
}

// ─── Provider Factory ─────────────────────────────────────────────────

let _ollamaProvider: OllamaProvider | null = null;
let _geminiProvider: GeminiProvider | null = null;

function getOllama(): OllamaProvider {
    if (!_ollamaProvider) _ollamaProvider = new OllamaProvider();
    return _ollamaProvider;
}

function getGemini(): GeminiProvider {
    if (!_geminiProvider) _geminiProvider = new GeminiProvider();
    return _geminiProvider;
}

/**
 * Returns the configured AI provider.
 *
 * AI_PROVIDER env var controls selection:
 *  - "ollama" → Local Ollama only
 *  - "gemini" → Gemini API only
 *  - "auto"   → Try Ollama first, fall back to Gemini
 */
export function getAIProvider(): AIProvider {
    const provider = (process.env.AI_PROVIDER || "ollama").toLowerCase();

    switch (provider) {
        case "gemini":
            return getGemini();
        case "ollama":
            return getOllama();
        case "auto":
        default:
            return getAutoProvider();
    }
}

/** Returns the name of the active model for logging/storage */
export function getActiveModelName(): string {
    const provider = (process.env.AI_PROVIDER || "ollama").toLowerCase();
    if (provider === "gemini") return "gemini-1.5-flash";
    return process.env.OLLAMA_MODEL || "mistral";
}

/**
 * Auto provider: tries Ollama first, then Gemini, then throws.
 */
function getAutoProvider(): AIProvider {
    return {
        name: "auto",
        async generateContent(prompt: string): Promise<string> {
            // Try Ollama first
            try {
                return await getOllama().generateContent(prompt);
            } catch (ollamaErr: any) {
                console.warn("[AI] Ollama unavailable, trying Gemini fallback:", ollamaErr.message);
            }

            // Try Gemini
            if (process.env.GEMINI_API_KEY) {
                try {
                    return await getGemini().generateContent(prompt);
                } catch (geminiErr: any) {
                    console.warn("[AI] Gemini also failed:", geminiErr.message);
                }
            }

            throw new Error("All AI providers unavailable");
        },
    };
}
