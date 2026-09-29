import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.REFRESH_TOKEN_TTL_DAYS = "7";

const users = new Map();
const refreshTokens = new Map();
const resetTokens = new Map();
const rooms = new Map();
const members = new Map();
const pool = { query: jest.fn() };
const redis = {
  async hset(key, data) {
    rooms.set(key, { ...(rooms.get(key) || {}), ...Object.fromEntries(Object.entries(data).map(([name, value]) => [name, String(value)])) });
  },
  async hgetall(key) { return rooms.get(key) || {}; },
  async expire(key, seconds) { rooms.set(`${key}:ttl`, seconds); },
  async sadd(key, value) { members.set(key, new Set([...(members.get(key) || []), value])); },
  async smembers(key) { return [...(members.get(key) || [])]; },
  async srem(key, value) { members.get(key)?.delete(value); },
};
const sendPasswordResetEmail = jest.fn();
const executeCode = jest.fn(async () => ({
  status: "COMPLETED",
  output: "ok",
  error: null,
  duration: 2,
  executionTimeMs: 2,
  resourceUsage: { memoryBytes: 0, cpuTotalNanoseconds: 0 },
}));
const recordMetric = jest.fn();

jest.unstable_mockModule("../src/config/db.js", () => ({ default: pool }));
jest.unstable_mockModule("../src/config/redis.js", () => ({ default: redis }));
jest.unstable_mockModule("../src/services/email.js", () => ({ sendPasswordResetEmail }));
jest.unstable_mockModule("../src/services/socketHandlers.js", () => ({ default: jest.fn() }));
jest.unstable_mockModule("../src/services/queue.js", () => ({ setIo: jest.fn(), enqueueExecution: jest.fn() }));
jest.unstable_mockModule("../src/services/metricsCollector.js", () => ({
  recordMetric,
  MetricNames: new Proxy({}, { get: (_, name) => name }),
}));
jest.unstable_mockModule("../src/services/executionEngine.js", () => ({
  default: executeCode,
  normalizeLanguage: (language) => typeof language === "string" ? language.toLowerCase() : language,
  SUPPORTED_LANGUAGES: ["javascript", "python"],
}));

const { default: app } = await import("../app.js");

function resetState() {
  users.clear();
  refreshTokens.clear();
  resetTokens.clear();
  rooms.clear();
  members.clear();
  sendPasswordResetEmail.mockClear();
  executeCode.mockClear();
  recordMetric.mockClear();
  pool.query.mockImplementation(async (sql, params = []) => {
    if (sql.includes("SELECT * FROM users WHERE email")) {
      const user = users.get(params[0]);
      return { rows: user ? [user] : [] };
    }
    if (sql.includes("INSERT INTO users")) {
      const user = { id: `user-${users.size + 1}`, email: params[0], password_hash: params[1] };
      users.set(user.email, user);
      return { rows: [user] };
    }
    if (sql.includes("SELECT id, email FROM users WHERE id")) {
      return { rows: [...users.values()].filter((user) => user.id === params[0]).map(({ id, email }) => ({ id, email })) };
    }
    if (sql.includes("SELECT id FROM users WHERE email")) {
      const user = users.get(params[0]);
      return { rows: user ? [{ id: user.id }] : [] };
    }
    if (sql.includes("INSERT INTO refresh_tokens")) {
      refreshTokens.set(params[1], { id: `refresh-${refreshTokens.size + 1}`, user_id: params[0], expires_at: params[2], revoked_at: null });
      return { rows: [] };
    }
    if (sql.includes("SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens")) {
      const token = refreshTokens.get(params[0]);
      return { rows: token ? [{ ...token }] : [] };
    }
    if (sql.includes("UPDATE refresh_tokens SET revoked_at") && sql.includes("token_hash")) {
      const token = refreshTokens.get(params[0]);
      if (token) token.revoked_at = new Date();
      return { rows: [] };
    }
    if (sql.includes("UPDATE refresh_tokens SET revoked_at") && sql.includes("user_id")) {
      for (const token of refreshTokens.values()) if (token.user_id === params[0]) token.revoked_at = new Date();
      return { rows: [] };
    }
    if (sql.includes("INSERT INTO password_reset_tokens")) {
      resetTokens.set(params[1], { id: `reset-${resetTokens.size + 1}`, user_id: params[0], expires_at: params[2], used_at: null });
      return { rows: [] };
    }
    if (sql.includes("UPDATE password_reset_tokens SET used_at") && sql.includes("user_id")) {
      for (const token of resetTokens.values()) if (token.user_id === params[0] && !token.used_at) token.used_at = new Date();
      return { rows: [] };
    }
    if (sql.includes("SELECT id, user_id, expires_at, used_at FROM password_reset_tokens")) {
      const token = resetTokens.get(params[0]);
      return { rows: token ? [{ ...token }] : [] };
    }
    if (sql.includes("UPDATE password_reset_tokens SET used_at") && sql.includes("WHERE id")) {
      for (const token of resetTokens.values()) if (token.id === params[0]) token.used_at = new Date();
      return { rows: [] };
    }
    if (sql.includes("INSERT INTO executions")) return { rows: [{ id: `execution-${Date.now()}` }] };
    return { rows: [] };
  });
}

beforeEach(() => resetState());

function cookieValue(response, name) {
  const cookie = response.headers["set-cookie"].find((value) => value.startsWith(`${name}=`));
  return cookie.split(";", 1)[0];
}

let registerCount = 0;

async function register(email = `joel-${++registerCount}@example.com`) {
  return request(app).post("/api/auth/register").send({ email, password: "password123" });
}

test("registers, rejects duplicates, and rejects invalid input", async () => {
  const response = await register("joel@example.com");
  expect(response.status).toBe(200);
  expect(response.body.user.email).toBe("joel@example.com");
  expect((await register("joel@example.com")).status).toBe(400);
  expect((await request(app).post("/api/auth/register").send({ email: "", password: "short" })).status).toBe(400);
});

test("logs in with the right password and rejects the wrong one", async () => {
  const email = "login@example.com";
  await register(email);
  expect((await request(app).post("/api/auth/login").send({ email, password: "password123" })).status).toBe(200);
  expect((await request(app).post("/api/auth/login").send({ email, password: "wrongpass" })).status).toBe(400);
});

test("rotates refresh tokens and rejects the old token", async () => {
  const registered = await register();
  const oldCookie = cookieValue(registered, "refresh_token");
  const rotated = await request(app).post("/api/auth/refresh").set("Cookie", oldCookie);
  expect(rotated.status).toBe(200);
  expect((await request(app).post("/api/auth/refresh").set("Cookie", oldCookie)).status).toBe(401);
});

test("logs out and revokes the refresh token", async () => {
  const registered = await register();
  const refreshCookie = cookieValue(registered, "refresh_token");
  expect((await request(app).post("/api/auth/logout").set("Cookie", refreshCookie)).status).toBe(200);
  expect((await request(app).post("/api/auth/refresh").set("Cookie", refreshCookie)).status).toBe(401);
});

test("forgot-password does not reveal whether an email exists", async () => {
  const email = "forgot@example.com";
  await register(email);
  const existing = await request(app).post("/api/auth/forgot-password").send({ email });
  const unknown = await request(app).post("/api/auth/forgot-password").send({ email: "unknown@example.com" });
  expect(existing.status).toBe(200);
  expect(existing.body.message).toBe(unknown.body.message);
  expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
});

test("resets a valid token, rejects reuse, and rejects expiry", async () => {
  const email = "reset@example.com";
  await register(email);
  await request(app).post("/api/auth/forgot-password").send({ email });
  const link = sendPasswordResetEmail.mock.calls[0][1];
  const token = new URL(link).searchParams.get("token");
  expect((await request(app).post("/api/auth/reset-password").send({ token, password: "newpass123" })).status).toBe(200);
  expect((await request(app).post("/api/auth/reset-password").send({ token, password: "newpass456" })).status).toBe(400);

  await request(app).post("/api/auth/forgot-password").send({ email });
  const expiredToken = new URL(sendPasswordResetEmail.mock.calls[1][1]).searchParams.get("token");
  const expiredHash = [...resetTokens.keys()].find((hash) => hash !== [...resetTokens.keys()][0]);
  resetTokens.get(expiredHash).expires_at = new Date(Date.now() - 1);
  expect((await request(app).post("/api/auth/reset-password").send({ token: expiredToken, password: "newpass789" })).status).toBe(400);
});

test("rejects cookie-authenticated writes without CSRF and accepts a valid token", async () => {
  const registered = await register();
  const accessCookie = cookieValue(registered, "access_token");
  const csrfCookie = cookieValue(registered, "csrf_token");
  expect((await request(app).post("/api/rooms").set("Cookie", accessCookie).send({})).status).toBe(403);
  const accepted = await request(app).post("/api/rooms")
    .set("Cookie", `${accessCookie}; ${csrfCookie}`)
    .set("X-CSRF-Token", csrfCookie.split("=")[1])
    .send({});
  expect(accepted.status).toBe(200);
});

test("validates execution language, code length, and required fields", async () => {
  const registered = await register();
  const auth = `Bearer ${registered.body.token}`;
  expect((await request(app).post("/api/execute/run").set("Authorization", auth).send({ language: "ruby", code: "puts 1" })).status).toBe(400);
  expect((await request(app).post("/api/execute/run").set("Authorization", auth).send({ language: "javascript", code: "x".repeat(10001) })).status).toBe(400);
  expect((await request(app).post("/api/execute/run").set("Authorization", auth).send({ language: "javascript" })).status).toBe(400);
});

test("execution limiter returns 429 after its configured limit", async () => {
  const registered = await register("limit@example.com");
  const auth = `Bearer ${registered.body.token}`;
  const responses = await Promise.all(Array.from({ length: 21 }, () => request(app)
    .post("/api/execute/run")
    .set("Authorization", auth)
    .send({ language: "javascript", code: "console.log(1)" })));
  expect(responses.at(-1).status).toBe(429);
});

test("creates rooms and applies the 24-hour expiry", async () => {
  const registered = await register("room@example.com");
  const response = await request(app).post("/api/rooms").set("Authorization", `Bearer ${registered.body.token}`).send({});
  expect(response.status).toBe(200);
  expect(response.body.roomId).toBeDefined();
  expect(rooms.get(`room:${response.body.roomId}:ttl`)).toBe(86400);
  expect((await request(app).get(`/api/rooms/${response.body.roomId}`).set("Authorization", `Bearer ${registered.body.token}`)).status).toBe(200);
  expect((await request(app).get("/api/rooms/missing").set("Authorization", `Bearer ${registered.body.token}`)).status).toBe(404);
});
