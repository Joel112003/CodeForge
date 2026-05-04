import executeCode from "./executionEngine.js";
import executionQueue from "./queue.js";
import pool from "../config/db.js";
import {
  addMember,
  removeMember,
  getMembers,
  getRoom,
  updateRoomCode,
} from "./roomManager.js";

const socketMap = new Map();

// Export so queue worker can access sockets
export function getSocket(socketId) {
  return socketMap.get(socketId);
}

export default function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);
    socketMap.set(socket.id, socket);

    // rooms
    socket.on("join_room", async ({ roomId, userId }, callback) => {
      console.log("[join_room] request", {
        socketId: socket.id,
        roomId,
        userId,
      });

      const room = await getRoom(roomId);
      if (!room) {
        console.log("[join_room] room not found", { socketId: socket.id, roomId });
        socket.emit("error", "Room not found");
        if (callback) callback("ROOM_NOT_FOUND");
        return;
      }

      const normalizedRoomId = room.id || roomId;

      // join socket room and persist membership state
      socket.join(normalizedRoomId);
      socket.data.roomId = normalizedRoomId;
      socket.data.userId = userId;

      await addMember(normalizedRoomId, userId);
      const members = await getMembers(normalizedRoomId);

      console.log("[join_room] success", {
        socketId: socket.id,
        requestedRoomId: roomId,
        normalizedRoomId,
        membersCount: members.length,
      });

      // match test client event name
      socket.emit("room_joined", { room, roomId: normalizedRoomId, members });

      // tell everyone else someone joined
      socket.to(normalizedRoomId).emit("member_joined", { userId, members });
      if (callback) callback("JOINED");
    });

    // execution handler
    socket.on("run_code", async ({ language, code, roomId }, callback) => {
      //receipt immediately to prevent client timeout
      if (callback) callback("QUEUED");
      socket.emit("status", "QUEUED");

      //add to queue instead of running directly
      await executionQueue.add("run", {
        language,
        code,
        socketId: socket.id,
        roomId,
      });
    });

    // live code sync, when user types the broadcast to everyone else in the room
    socket.on("code_change", async ({ roomId, code, language }, callback) => {
      const targetRoomId = roomId || socket.data.roomId;
      console.log("[code_change] request", {
        socketId: socket.id,
        roomIdFromPayload: roomId,
        roomIdFromSocket: socket.data.roomId,
        targetRoomId,
        language,
        codeLength: typeof code === "string" ? code.length : 0,
      });

      if (!targetRoomId) {
        console.log("[code_change] missing room", { socketId: socket.id });
        socket.emit("error", "Join a room before sending code changes");
        if (callback) callback("NO_ROOM");
        return;
      }

      //save to redis so new joiners get latest code
      await updateRoomCode(targetRoomId, code, language);

      // broadcast to everyone else in the room (and emit legacy alias for compatibility)
      socket.to(targetRoomId).emit("code_updated", { code, language, roomId: targetRoomId });
      console.log("[code_change] broadcasted", {
        socketId: socket.id,
        targetRoomId,
        eventNames: ["code_updated", "code_update"],
      });
      if (callback) callback("SYNCED");
    });

    //disconnect handler
    socket.on("disconnect", async () => {
      socketMap.delete(socket.id);
      const { roomId, userId } = socket.data;
      if (roomId && userId) {
        await removeMember(roomId, userId);
        const members = await getMembers(roomId);

        // tell room members some one has left
        io.to(roomId).emit("member_left", { userId, members });
      }

      console.log("Client disconnected: " + socket.id);
    });
  });
}
