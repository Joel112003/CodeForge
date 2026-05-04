import { getRoom, createRoom } from "../services/roomManager.js";

//create a room
export const createRoomHandler = async (req, res, next) => {
  try {
    const room = await createRoom(req.user.userId);
    res.json({ roomId: room.id , room });
  } catch (err) {
    next(err);
  }
};

//get room details
export const getRoomHandler = async (req, res, next) => {
  try {
    const room = await getRoom(req.params.roomID);
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
  } catch (err) {
    next(err);
  }
};