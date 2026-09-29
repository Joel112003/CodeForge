import { randomUUID } from "crypto";
import Docker from "dockerode";
import { Writable } from "stream";
import executionConfig from "../config/execution.js";

const RUNNERS = {
  javascript: { cmd: "node", flag: "-e", image: executionConfig.images.javascript },
  python: { cmd: "python", flag: "-c", image: executionConfig.images.python },
};

export const Images = {
  ...executionConfig.images,
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

const docker = new Docker();

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function stopContainer(container) {
  try {
    await container.kill({ signal: "SIGKILL" });
  } catch (error) {
    if (!/not running|no such container/i.test(error.message)) throw error;
  }
}

function makeOutputWriter(onChunk, state, type, terminate) {
  return new Writable({
    write(chunk, encoding, callback) {
      const text = Buffer.isBuffer(chunk) ? chunk.toString() : Buffer.from(chunk, encoding).toString();
      const bytes = Buffer.byteLength(text);
      const remaining = executionConfig.maxOutputBytes - state.outputBytes;

      if (remaining <= 0) {
        state.outputLimitExceeded = true;
        terminate();
        callback();
        return;
      }

      const visible = bytes > remaining ? Buffer.from(text).subarray(0, remaining).toString() : text;
      state.outputBytes += Buffer.byteLength(visible);
      state.output += visible;
      onChunk(visible, type);

      if (bytes > remaining) {
        state.outputLimitExceeded = true;
        onChunk("\n[Execution stopped: output limit exceeded]", "stderr");
        terminate();
      }

      callback();
    },
  });
}

async function readContainerStats(container) {
  try {
    const stats = await container.stats({ stream: false });
    return {
      memoryBytes: stats.memory_stats?.max_usage || stats.memory_stats?.usage || 0,
      cpuTotalNanoseconds: stats.cpu_stats?.cpu_usage?.total_usage || 0,
    };
  } catch {
    return { memoryBytes: 0, cpuTotalNanoseconds: 0 };
  }
}

async function executeCode(language, code, onChunk = () => {}) {
  const runner = RUNNERS[language];
  if (!runner) throw new Error(`Unsupported language: ${language}`);

  const startedAt = Date.now();
  const state = {
    output: "",
    outputBytes: 0,
    outputLimitExceeded: false,
    timedOut: false,
    stopPromise: null,
  };
  const container = await docker.createContainer({
    name: `codeforge-execution-${randomUUID()}`,
    Image: runner.image,
    Cmd: [runner.cmd, runner.flag, code],
    User: "10001:10001",
    WorkingDir: "/sandbox",
    Env: [],
    Labels: { "com.codeforge.execution": "true" },
    HostConfig: {
      NetworkMode: "none",
      ReadonlyRootfs: true,
      Memory: executionConfig.memoryBytes,
      MemorySwap: executionConfig.memoryBytes,
      NanoCpus: executionConfig.cpuNanoCpus,
      PidsLimit: executionConfig.maxProcesses,
      CapDrop: ["ALL"],
      SecurityOpt: ["no-new-privileges:true"],
      Tmpfs: {
        "/tmp": `rw,noexec,nosuid,size=${executionConfig.tmpfsMb}m`,
      },
    },
  });

  const terminate = () => {
    if (!state.stopPromise) state.stopPromise = stopContainer(container).catch(() => {});
  };

  try {
    const stream = await container.attach({ stream: true, stdout: true, stderr: true });
    const stdout = makeOutputWriter(onChunk, state, "stdout", terminate);
    const stderr = makeOutputWriter(onChunk, state, "stderr", terminate);
    docker.modem.demuxStream(stream, stdout, stderr);

    await container.start();
    const waitPromise = container.wait();
    const outcome = await Promise.race([
      waitPromise,
      wait(executionConfig.timeoutMs).then(() => ({ StatusCode: null, timedOut: true })),
    ]);

    if (outcome.timedOut) {
      state.timedOut = true;
      onChunk(`\n[Execution timed out after ${executionConfig.timeoutMs / 1000} seconds]`, "stderr");
      terminate();
      await Promise.race([waitPromise, wait(1000)]);
    } else if (state.outputLimitExceeded) {
      await Promise.race([waitPromise, wait(1000)]);
    }

    const resourceUsage = await readContainerStats(container);
    const duration = Date.now() - startedAt;
    const statusCode = outcome.StatusCode;

    let status = "COMPLETED";
    let error = null;
    if (state.timedOut) {
      status = "TIMEOUT";
      error = "Execution timed out";
    } else if (state.outputLimitExceeded) {
      status = "RESOURCE_LIMIT";
      error = "Execution output limit exceeded";
    } else if (statusCode === 137) {
      status = "RESOURCE_LIMIT";
      error = "Execution stopped by a container resource limit";
    } else if (statusCode !== 0) {
      status = "ERROR";
      error = `Execution failed with exit code ${statusCode}`;
    }

    return {
      status,
      output: state.output,
      error,
      duration,
      executionTimeMs: duration,
      resourceUsage,
    };
  } finally {
    if (state.stopPromise) await state.stopPromise;
    try {
      await container.remove({ force: true });
    } catch (error) {
      if (!/no such container/i.test(error.message)) throw error;
    }
  }
}

export default executeCode;
