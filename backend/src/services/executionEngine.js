// Piston API replaces Docker-based execution.
// Piston is a free, public sandboxed code execution service — no API key needed.
// Public instance: https://emkc.org/api/v2/piston

const PISTON_API = "https://emkc.org/api/v2/piston/execute";

// Maps language names to Piston runtime identifiers
const PISTON_RUNTIMES = {
  javascript: { language: "javascript", version: "*" },
  python: { language: "python", version: "*" },
};

// Kept for backwards compatibility with containerCleanup.js and validateExecution.js
export const Images = {
  javascript: "node:18-alpine",
  python: "python:3.11-alpine",
};

export const SUPPORTED_LANGUAGES = Object.keys(PISTON_RUNTIMES);

const LANGUAGE_ALIASES = {
  js: "javascript",
  node: "javascript",
  py: "python",
};

export function normalizeLanguage(input) {
  if (!input || typeof input !== "string") return input;
  const lower = input.toLowerCase();
  return LANGUAGE_ALIASES[lower] ?? lower;
}

/**
 * Executes code via the Piston API and streams output via the onChunk callback.
 * Interface is identical to the old Docker-based executeCode so queue.js is unchanged.
 *
 * @param {string} language  - Normalized language name ('javascript' | 'python')
 * @param {string} code      - Source code to execute
 * @param {Function} onChunk - Callback(chunk: string, type: 'stdout' | 'stderr')
 */
async function executeCode(language, code, onChunk) {
  const runtime = PISTON_RUNTIMES[language];
  if (!runtime) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const response = await fetch(PISTON_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: runtime.language,
      version: runtime.version,
      files: [{ name: "main", content: code }],
    }),
    signal: AbortSignal.timeout(15000), // 15-second hard timeout
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Piston API error ${response.status}: ${body}`);
  }

  const result = await response.json();
  const { stdout, stderr } = result.run ?? {};

  if (stdout) onChunk(stdout, "stdout");
  if (stderr) onChunk(stderr, "stderr");
}

export default executeCode;
