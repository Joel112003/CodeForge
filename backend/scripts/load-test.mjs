import { mkdirSync, writeFileSync } from "node:fs";
import { io } from "socket.io-client";

const baseUrl = process.env.LOAD_TEST_URL || "http://localhost:8080";
const levels = [2, 5, 10, 25, 50, 100];
const timeoutMs = Number.parseInt(process.env.LOAD_TEST_TIMEOUT_MS || "30000", 10);

function runExecution(level, userNumber) {
  return new Promise((resolve) => {
    const socket = io(baseUrl, { transports: ["websocket"], forceNew: true });
    const submittedAt = Date.now();
    let queuedAt = submittedAt;
    let runningAt = null;
    let settled = false;

    const finish = (status, error = null) => {
      if (settled) return;
      settled = true;
      socket.close();
      const finishedAt = Date.now();
      resolve({
        status,
        error,
        responseMs: finishedAt - submittedAt,
        queueMs: runningAt ? runningAt - queuedAt : null,
        executionMs: runningAt ? finishedAt - runningAt : null,
      });
    };

    const timeout = setTimeout(() => finish("TIMEOUT", "Load-test client timeout"), timeoutMs);

    socket.on("connect", () => {
      socket.emit("run_code", {
        language: "javascript",
        code: `console.log("load-${level}-${userNumber}-${Date.now()}")`,
        sessionId: `load-${level}-${userNumber}-${Date.now()}`,
      }, () => {});
    });

    socket.on("status", ({ status }) => {
      if (status === "QUEUED") queuedAt = Date.now();
      if (status === "RUNNING") runningAt = Date.now();
      if (["COMPLETED", "CACHED", "ERROR", "TIMEOUT", "RESOURCE_LIMIT"].includes(status)) {
        clearTimeout(timeout);
        finish(status);
      }
    });

    socket.on("connect_error", (error) => {
      clearTimeout(timeout);
      finish("ERROR", error.message);
    });
  });
}

function summarize(level, results) {
  const successful = results.filter(({ status }) => ["COMPLETED", "CACHED"].includes(status));
  const average = (values) => values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;

  return {
    concurrentUsers: level,
    successfulExecutions: successful.length,
    failedExecutions: results.length - successful.length,
    timeoutCount: results.filter(({ status }) => status === "TIMEOUT").length,
    errorRate: Number(((results.length - successful.length) / results.length).toFixed(4)),
    averageResponseMs: average(results.map(({ responseMs }) => responseMs)),
    averageExecutionMs: average(results.map(({ executionMs }) => executionMs).filter(Number.isFinite)),
    averageQueueMs: average(results.map(({ queueMs }) => queueMs).filter(Number.isFinite)),
    cpuUsage: null,
    memoryUsage: null,
  };
}

const report = [];
for (const level of levels) {
  const results = await Promise.all(Array.from({ length: level }, (_, index) => runExecution(level, index + 1)));
  const summary = summarize(level, results);
  report.push(summary);
  console.log(JSON.stringify(summary));
}

mkdirSync("load-test/results", { recursive: true });
writeFileSync("load-test/results/latest.json", `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
  "load-test/results/latest.csv",
  [
    "concurrentUsers,successfulExecutions,failedExecutions,timeoutCount,errorRate,averageResponseMs,averageExecutionMs,averageQueueMs,cpuUsage,memoryUsage",
    ...report.map((row) => Object.values(row).join(",")),
  ].join("\n") + "\n",
);