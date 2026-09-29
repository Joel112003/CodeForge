const positiveInt = (name, fallback) => {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

export const LANGUAGE_CONFIG = Object.freeze({
  javascript: {
    executable: "node",
    extension: ".js",
    sourceFile: "main.js",
    args: (file) => [file],
  },
  python: {
    executable: process.platform === "win32" ? "py" : "python3",
    extension: ".py",
    sourceFile: "main.py",
    args: (file) => [file],
  },
});

export const executionConfig = Object.freeze({
  timeoutMs: positiveInt("EXECUTION_TIMEOUT_MS", 10_000),
  maxOutputBytes: positiveInt("EXECUTION_MAX_OUTPUT_BYTES", 64 * 1024),
  maxStdinBytes: positiveInt("EXECUTION_MAX_STDIN_BYTES", 64 * 1024),
});

export default executionConfig;
