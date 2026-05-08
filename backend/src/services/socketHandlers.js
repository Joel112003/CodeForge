import { normalizeLanguage, SUPPORTED_LANGUAGES } from "./executionEngine.js";
import executionQueue from "./queue.js";
import pool from "../config/db.js";
import {
  addMember,
  removeMember,
  getMembers,
  getRoom,
  updateRoomCode,
} from "./roomManager.js";

export default function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);

    async function resolveDisplayName({ displayName, userId }) {
      const trimmed = typeof displayName === "string" ? displayName.trim() : "";
      if (trimmed) return trimmed;
      if (userId) {
        try {
          const result = await pool.query(
            "SELECT email FROM users WHERE id = $1",
            [userId],
          );
          if (result.rows.length > 0 && result.rows[0].email) {
            return result.rows[0].email;
          }
        } catch (err) {
          console.warn("[join_room] failed to resolve displayName", { userId, err: err.message });
        }
      }
      return userId || "Anonymous";
    }

    socket.on("join_room", async ({ roomId, userId, displayName }, callback) => {
      console.log("[join_room] request", { socketId: socket.id, roomId, userId });

      const room = await getRoom(roomId);
      if (!room) {
        console.log("[join_room] room not found", { socketId: socket.id, roomId });
        socket.emit("error", "Room not found");
        if (callback) callback("ROOM_NOT_FOUND");
        return;
      }

      const normalizedRoomId = room.id || roomId;

      // Store UUID for DB writes, email for display
      socket.join(normalizedRoomId);
      const resolvedDisplayName = await resolveDisplayName({ displayName, userId });
      socket.data.roomId       = normalizedRoomId;
      socket.data.userId       = userId;        // UUID — used for executions table
      socket.data.displayName  = resolvedDisplayName;  // email/name — shown in member list

      // Store the displayName (email) in the member set so the UI shows readable names
      await addMember(normalizedRoomId, socket.data.displayName);
      const members = (await getMembers(normalizedRoomId)).filter(Boolean);

      console.log("[join_room] success", {
        socketId: socket.id,
        normalizedRoomId,
        membersCount: members.length,
      });

      socket.emit("room_joined", { room, roomId: normalizedRoomId, members });
      socket.to(normalizedRoomId).emit("member_joined", { userId: socket.data.displayName, members });
      if (callback) callback("JOINED");
    });

    socket.on("run_code", async ({ language, code, roomId, sessionId }, callback) => {
      const normalizedLanguage = normalizeLanguage(language);

      if (!SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
        socket.emit("error", "Unsupported language");
        if (callback) callback("UNSUPPORTED_LANGUAGE");
        return;
      }

      if (callback) callback("QUEUED");
      // Echo sessionId back so the client can filter its own run
      socket.emit("status", { status: "QUEUED", sessionId });

      // Only use socket.data.roomId for collaborative rooms (never for guest runs)
      const resolvedRoomId = roomId || (socket.data.userId ? socket.data.roomId : null);

      // Always use socket.data.userId (set at join_room) — never trust client-supplied userId
      await executionQueue.add("run", {
        language: normalizedLanguage,
        code,
        socketId: socket.id,
        roomId: resolvedRoomId,
        userId: socket.data.userId,   // UUID from auth, safe for DB
        sessionId,                    // passed through so worker can tag all events
      });
    });

    socket.on("code_change", async ({ roomId, code, language }, callback) => {
      const normalizedLanguage = normalizeLanguage(language);
      const targetRoomId = roomId || socket.data.roomId;
      if (!SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
        socket.emit("error", "Unsupported language");
        if (callback) callback("UNSUPPORTED_LANGUAGE");
        return;
      }
      console.log("[code_change] request", {
        socketId: socket.id,
        roomIdFromPayload: roomId,
        roomIdFromSocket: socket.data.roomId,
        targetRoomId,
        language: normalizedLanguage,
        codeLength: typeof code === "string" ? code.length : 0,
      });

      if (!targetRoomId) {
        console.log("[code_change] missing room", { socketId: socket.id });
        socket.emit("error", "Join a room before sending code changes");
        if (callback) callback("NO_ROOM");
        return;
      }

      //save to redis so new joiners get latest code
      await updateRoomCode(targetRoomId, code, normalizedLanguage);

      // broadcast to everyone else in the room (and emit legacy alias for compatibility)
      socket
        .to(targetRoomId)
        .emit("code_updated", { code, language: normalizedLanguage, roomId: targetRoomId });
      console.log("[code_change] broadcasted", {
        socketId: socket.id,
        targetRoomId,
        eventNames: ["code_updated", "code_update"],
      });
      if (callback) callback("SYNCED");
    });

    socket.on("disconnect", async () => {
      const { roomId, userId, displayName } = socket.data;
      if (roomId && userId) {
        // displayName (email) was stored in the Redis member set — must remove that key
        await removeMember(roomId, displayName || userId);
        const members = (await getMembers(roomId)).filter(Boolean);

        // Broadcast updated list so all clients re-render MemberList
        io.to(roomId).emit("member_left", { userId: displayName || userId, members });
      }

      console.log("Client disconnected: " + socket.id);
    });
  });
}
