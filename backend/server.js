import validateEnv from "./src/config/env.js";
import dotenv from "dotenv";

// CRITICAL: Load env vars BEFORE validation
dotenv.config();
validateEnv();

import { cleanupOrphanContainers } from "./src/services/containerCleanup.js";
import { httpServer } from "./app.js";

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Cleanup orphan containers on startup
await cleanupOrphanContainers().catch((err) =>
  console.error("Cleanup error:", err),
);