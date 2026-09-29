import { jest } from "@jest/globals";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as connect } from "socket.io-client";

const rooms = new Map([["room-1", { id: "room-1", language: "javascript", code: "" }]]);
const roomMembers = new Set();
const enqueueExecution = jest.fn();
const pool = { query: jest.fn(async () => ({ rows: [{ email: "member@example.com" }] })) };

jest.unstable_mockModule("../src/config/db.js", () => ({ default: pool }));
jest.unstable_mockModule("../src/services/queue.js", () => ({ enqueueExecution, setIo: jest.fn() }));
jest.unstable_mockModule("../src/services/roomManager.js", () => ({
  getRoom: jest.fn(async (roomId) => rooms.get(roomId) || null),
  addMember: jest.fn(async (_, member) => roomMembers.add(member)),
  getMembers: jest.fn(async () => [...roomMembers]),
  removeMember: jest.fn(async (_, member) => roomMembers.delete(member)),
  updateRoomCode: jest.fn(async () => {}),
}));

const { default: setupSocket } = await import("../src/services/socketHandlers.js");

function nextEvent(socket, event) {
  return new Promise((resolve) => socket.once(event, resolve));
}

function nextEventWithTimeout(socket, event, timeout = 1000) {
  return Promise.race([
    nextEvent(socket, event),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeout)),
  ]);
}

let httpServer;
let ioServer;
let url;
let clients;

beforeEach(async () => {
  roomMembers.clear();
  enqueueExecution.mockClear();
  httpServer = createServer();
  ioServer = new Server(httpServer, { cors: { origin: "*" } });
  setupSocket(ioServer);
  await new Promise((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${httpServer.address().port}`;
  clients = [connect(url, { transports: ["websocket"] }), connect(url, { transports: ["websocket"] })];
  await Promise.all(clients.map((client) => nextEvent(client, "connect")));
});

afterEach(async () => {
  clients.forEach((client) => client.close());
  await new Promise((resolve) => ioServer.close(resolve));
  await new Promise((resolve) => httpServer.close(resolve));
});

test("joins members, broadcasts code changes, and preserves session IDs", async () => {
  const [first, second] = clients;
  const firstJoined = nextEvent(first, "room_joined");
  first.emit("join_room", { roomId: "room-1", userId: "user-1", displayName: "one" });
  await firstJoined;

  const memberJoined = nextEvent(first, "member_joined");
  const secondJoined = nextEvent(second, "room_joined");
  second.emit("join_room", { roomId: "room-1", userId: "user-2", displayName: "two" });
  await Promise.all([memberJoined, secondJoined]);

  const memberLeft = nextEvent(first, "member_left");
  second.disconnect();
  await memberLeft;

  const secondReconnected = connect(url, { transports: ["websocket"] });
  clients[1] = secondReconnected;
  await nextEvent(secondReconnected, "connect");
  await nextEventWithTimeout(secondReconnected, "room_joined").catch(() => {});
  secondReconnected.emit("join_room", { roomId: "room-1", userId: "user-2", displayName: "two" });
  await nextEventWithTimeout(secondReconnected, "room_joined");

  const codeUpdated = nextEvent(secondReconnected, "code_updated");
  let firstReceived = false;
  first.once("code_updated", () => { firstReceived = true; });
  first.emit("code_change", { roomId: "room-1", language: "javascript", code: "console.log(1)" });
  await expect(codeUpdated).resolves.toMatchObject({ code: "console.log(1)", roomId: "room-1" });
  expect(firstReceived).toBe(false);

  const queued = nextEvent(first, "status");
  first.emit("run_code", { language: "javascript", code: "console.log(1)", sessionId: "session-123" });
  await expect(queued).resolves.toEqual({ status: "QUEUED", sessionId: "session-123" });
  expect(enqueueExecution).toHaveBeenCalledWith(expect.objectContaining({ sessionId: "session-123" }));
});
