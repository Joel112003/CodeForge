import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";

process.env.EXECUTION_TIMEOUT_MS = "250";
process.env.EXECUTION_MAX_OUTPUT_BYTES = "1024";

const { default: executeCode } = await import("../src/services/executionEngine.js");

async function run(language, code) {
  const chunks = [];
  const result = await executeCode(language, code, "", (chunk) => chunks.push(chunk));
  return { result, output: chunks.join("") };
}

test("runs JavaScript and Python happy paths", async () => {
  const javascript = await run("javascript", "console.log('js-ok')");
  const python = await run("python", "print('python-ok')");
  expect(javascript.result.status).toBe("COMPLETED");
  expect(javascript.output).toMatch(/js-ok/);
  expect(python.result.status).toBe("COMPLETED");
  expect(python.output).toMatch(/python-ok/);
});

test("reports runtime errors", async () => {
  const { result } = await run("javascript", "throw new Error('boom')");
  expect(result.status).toBe("RUNTIME_ERROR");
  expect(result.error).toMatch(/boom/);
});

test("reports TIMEOUT for an infinite loop", async () => {
  const { result } = await run("javascript", "while (true) {}");
  expect(result.status).toBe("TIMEOUT");
});

test("reports OUTPUT_LIMIT when output exceeds the configured limit", async () => {
  const { result } = await run("javascript", "console.log('x'.repeat(100000))");
  expect(result.status).toBe("OUTPUT_LIMIT");
});

test("removes its temporary workspace after execution", async () => {
  const before = new Set((await readdir(tmpdir())).filter((name) => name.startsWith("codeforge-")));
  const { result } = await run("javascript", "console.log('cleanup')");
  const after = new Set((await readdir(tmpdir())).filter((name) => name.startsWith("codeforge-")));
  expect(result.status).toBe("COMPLETED");
  expect([...after].filter((name) => !before.has(name))).toEqual([]);
});
