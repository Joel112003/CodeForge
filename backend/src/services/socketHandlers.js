import executeCode from "./executionEngine.js";
import executionQueue from "./queue.js";

export default function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);

    socket.on("run_code", async ({ language, code }) => {
      socket.emit("status", "Running");
      await executionQueue.add("run", { language, code, socketId: socket.id });

      try {
        await executeCode(language, code, (chunk, type) => {
          socket.emit("output", { data: chunk, type });
        });
        socket.emit("status", "Completed");
      } catch (err) {
        socket.emit("status", "Error");
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected: " + socket.id);
    });
  });
}
