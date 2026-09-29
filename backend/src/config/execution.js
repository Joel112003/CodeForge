const positiveInt = (name, fallback) => {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const memoryMb = positiveInt("EXECUTION_MEMORY_MB", 128);
const cpuMillicores = positiveInt("EXECUTION_CPU_MILLICORES", 500);

export const executionConfig = Object.freeze({
  timeoutMs: positiveInt("EXECUTION_TIMEOUT_MS", 10_000),
  maxOutputBytes: positiveInt("EXECUTION_MAX_OUTPUT_BYTES", 64 * 1024),
  maxProcesses: positiveInt("EXECUTION_MAX_PROCESSES", 64),
  tmpfsMb: positiveInt("EXECUTION_TMPFS_MB", 16),
  memoryBytes: memoryMb * 1024 * 1024,
  cpuNanoCpus: cpuMillicores * 1_000_000,
  images: {
    javascript: process.env.EXECUTION_NODE_IMAGE || "codeforge-node:20",
    python: process.env.EXECUTION_PYTHON_IMAGE || "codeforge-python:3.12",
  },
});

export default executionConfig;