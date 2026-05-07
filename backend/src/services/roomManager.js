import redis from "../config/redis.js";
import { v4 as uuidv4 } from "uuid";

const ROOM_EXPIRY = 60 * 60 * 24;

export async function createRoom(userId) {
  const roomId = uuidv4().slice(0, 8);

  const roomData = {
    id: roomId,
    createdBy: userId,
    language: "javascript",
    code: '// Start coding here\nconsole.log("Hello!")',
    createdAt: new Date().toISOString(),
  };

  // store the room data in redis as a hash
  await redis.hset(`room:${roomId}`, roomData);
  await redis.expire(`room:${roomId}`, ROOM_EXPIRY);

  return roomData;
}

export async function getRoom(roomId) {
  const room = await redis.hgetall(`room:${roomId}`);
  if (!room || !room.id) return null;
  return room;
}

export async function updateRoomCode(roomId, code, language) {
  await redis.hset(`room:${roomId}`, { language, code });
  await redis.expire(`room:${roomId}`, ROOM_EXPIRY); //reset expiry on activity
}

export async function addMember(roomId, userId) {
  await redis.sadd(`room:${roomId}:members`, userId);
  await redis.expire(`room:${roomId}:members`, ROOM_EXPIRY); //reset expiry on activity
}

export async function getMembers(roomId) {
  return await redis.smembers(`room:${roomId}:members`);
}

export async function removeMember(roomId, userId) {
  await redis.srem(`room:${roomId}:members`, userId);
}

export default {
  createRoom,
  getRoom,
  updateRoomCode,
  addMember,
  getMembers,
  removeMember,
};
