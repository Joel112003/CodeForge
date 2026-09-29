import { execFile, spawn } from "child_process";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import executionConfig, { LANGUAGE_CONFIG } from "../config/execution.js";

const execFileAsync = promisify(execFile);
export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIG);
const LANGUAGE_ALIASES = { js: "javascript", node: "javascript", py: "python" };

export function normalizeLanguage(input) {
  if (!input || typeof input !== "string") return input;
  return LANGUAGE_ALIASES[input.toLowerCase()] ?? input.toLowerCase();
}

function killProcessTree(child) {
  if (!child.pid) return Promise.resolve();
  if (process.platform === "win32") {
    return execFileAsync("taskkill", ["/pid", String(child.pid), "/T", "/F"]).catch(() => {});
  }
  try { process.kill(-child.pid, "SIGKILL"); } catch {}
  return Promise.resolve();
}

function classify(stderr, exitCode) {
  if (exitCode === 0) return "COMPLETED";
  if (/SyntaxError|IndentationError|TabError|invalid syntax/i.test(stderr)) return "COMPILE_ERROR";
  return "RUNTIME_ERROR";
}

async function executeCode(language, code, stdin = "", onChunk = () => {}) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) throw Object.assign(new Error("Invalid language"), { code: "INVALID_LANGUAGE" });
  if (Buffer.byteLength(stdin, "utf8") > executionConfig.maxStdinBytes) {
    throw Object.assign(new Error("Input size limit exceeded"), { code: "INPUT_LIMIT_EXCEEDED" });
  }

  const workspace = await mkdtemp(join(tmpdir(), "codeforge-"));
  const sourcePath = join(workspace, config.sourceFile);
  await writeFile(sourcePath, code, "utf8");

  const state = { stdout: "", stderr: "", outputBytes: 0, outputLimitExceeded: false, timedOut: false };
  const startedAt = Date.now();
  const child = spawn(config.executable, config.args(sourcePath), {
    cwd: workspace,
    env: { PATH: process.env.PATH },
    shell: false,
    detached: process.platform !== "win32",
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let terminatePromise = null;
  const terminate = () => {
    if (!terminatePromise) terminatePromise = killProcessTree(child);
    return terminatePromise;
  };
  const append = (chunk, type) => {
    const text = chunk.toString();
    const remaining = executionConfig.maxOutputBytes - state.outputBytes;
    const visible = Buffer.from(text).subarray(0, Math.max(0, remaining)).toString();
    state[type] += visible;
    state.outputBytes += Buffer.byteLength(visible);
    onChunk(visible, type);
    if (Buffer.byteLength(text) > remaining) {
      state.outputLimitExceeded = true;
      onChunk("\n[Execution stopped: output limit exceeded]", "stderr");
      terminate();
    }
  };

  try {
    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        state.timedOut = true;
        onChunk(`\n[Execution timed out after ${executionConfig.timeoutMs / 1000} seconds]`, "stderr");
        terminate();
      }, executionConfig.timeoutMs);
      child.stdout.on("data", (chunk) => append(chunk, "stdout"));
      child.stderr.on("data", (chunk) => append(chunk, "stderr"));
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(Object.assign(new Error("Execution infrastructure failure"), { code: "EXECUTION_ERROR", cause: error }));
      });
      child.once("close", (exitCode, signal) => {
        clearTimeout(timer);
        resolve({ exitCode, signal });
      });
      if (stdin) child.stdin.write(stdin, "utf8");
      child.stdin.end();
    });

    if (terminatePromise) await terminatePromise;
    let status = classify(state.stderr, result.exitCode);
    let error = status === "COMPLETED" ? null : state.stderr.trim() || `Execution failed with exit code ${result.exitCode}`;
    if (state.timedOut) {
      status = "TIMEOUT";
      error = "Execution timed out";
    } else if (state.outputLimitExceeded) {
      status = "OUTPUT_LIMIT";
      error = "Execution output limit exceeded";
    }

    const duration = Date.now() - startedAt;
    return {
      status,
      stdout: state.stdout,
      stderr: state.stderr,
      output: `${state.stdout}${state.stderr}`,
      error,
      exitCode: result.exitCode,
      signal: result.signal,
      duration,
      executionTimeMs: duration,
      resourceUsage: { memoryBytes: 0, cpuTotalNanoseconds: 0 },
    };
  } finally {
    if (terminatePromise) await terminatePromise;
    await rm(workspace, { recursive: true, force: true });
  }
}

export default executeCode;
