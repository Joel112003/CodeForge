import assert from "node:assert/strict";
import { test } from "node:test";

let executeCode;
let normalizeLanguage;

test.before(async () => {
  ({ default: executeCode, normalizeLanguage } = await import("../src/services/executionEngine.js"));
});

async function run(language, code, stdin = "") {
  const chunks = [];
  const result = await executeCode(language, code, stdin, (chunk, type) => {
    chunks.push({ chunk, type });
  });
  return { result, output: chunks.map(({ chunk }) => chunk).join("") };
}

test("normalizes supported language aliases", () => {
  assert.equal(normalizeLanguage("js"), "javascript");
  assert.equal(normalizeLanguage("PY"), "python");
});

test("rejects an invalid language", async () => {
  await assert.rejects(
    () => executeCode("ruby", "puts 1"),
    (error) => error.code === "INVALID_LANGUAGE",
  );
});

test("runs valid JavaScript", async () => {
  const { result, output } = await run("javascript", "console.log('hello')");
  assert.equal(result.status, "COMPLETED");
  assert.match(output, /hello/);
});

test("runs valid Python", async () => {
  const { result, output } = await run("python", "print('hello')");
  assert.equal(result.status, "COMPLETED");
  assert.match(output, /hello/);
});

test("passes standard input to the program", async () => {
  const { result, output } = await run("python", "name = input()\nage = int(input())\nprint(name, age)", "Joel\n21\n");
  assert.equal(result.status, "COMPLETED");
  assert.match(output, /Joel 21/);
});

test("reports syntax errors", async () => {
  const { result } = await run("javascript", "console.log(");
  assert.equal(result.status, "COMPILE_ERROR");
});

test("reports runtime errors", async () => {
  const { result } = await run("javascript", "throw new Error('boom')");
  assert.equal(result.status, "RUNTIME_ERROR");
});

test("reports infinite loops as timeouts", async () => {
  const { result } = await run("javascript", "while (true) {} ");
  assert.equal(result.status, "TIMEOUT");
});

test("reports excessive output as a resource limit", async () => {
  const { result } = await run("javascript", "console.log('x'.repeat(1000000))");
  assert.equal(result.status, "OUTPUT_LIMIT");
});

