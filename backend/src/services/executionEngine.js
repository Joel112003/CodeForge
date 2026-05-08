import { spawn } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const TIMEOUT_MS = 10000;

const RUNNERS = {
  javascript: { cmd: "node", ext: "js" },
  python: { cmd: "python3", ext: "py" },
};

export const Images = {
  javascript: "node:18-alpine",
  python: "python:3.11-alpine",
};

export const SUPPORTED_LANGUAGES = Object.keys(RUNNERS);

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

async function executeCode(language, code, onChunk) {
  const runner = RUNNERS[language];
  if (!runner) throw new Error(`Unsupported language: ${language}`);

  const fileName = `${randomUUID()}.${runner.ext}`;
  const filePath = join(tmpdir(), fileName);
  writeFileSync(filePath, code, "utf8");

  return new Promise((resolve, reject) => {
    const proc = spawn(runner.cmd, [filePath], {
      env: { PATH: process.env.PATH },
    });

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      onChunk("\n[Execution timed out after 10 seconds]", "stderr");
    }, TIMEOUT_MS);

    proc.stdout.on("data", (chunk) => onChunk(chunk.toString(), "stdout"));
    proc.stderr.on("data", (chunk) => onChunk(chunk.toString(), "stderr"));

    proc.on("close", () => {
      clearTimeout(timer);
      try { unlinkSync(filePath); } catch {}
      resolve();
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      try { unlinkSync(filePath); } catch {}
      reject(new Error(`Failed to run ${runner.cmd}: ${err.message}`));
    });
  });
}

export default executeCode;
