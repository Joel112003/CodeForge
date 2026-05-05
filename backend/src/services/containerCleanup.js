import Docker from "dockerode";
import { Images } from "./executionEngine.js";

const docker = new Docker();

export async function cleanupOrphanContainers(language) {
  try {
    const filters = {
      label: ["created-by=code-engine"],
    };

    if (language) {
      if (!Images[language]) {
        console.warn(
          `Skipping container cleanup for unknown language: ${language}`,
        );
        return;
      }
      filters.ancestor = Images[language];
    }

    const containers = await docker.listContainers({ filters });
    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      await container.kill();
      console.log(`Cleaned up orphan container: ${containerInfo.Id}`);
    }
    console.log(
      `Cleanup complete. Removed ${containers.length} orphan containers.`,
    );
  } catch (err) {
    console.error("Error during container cleanup:", err);
  }
}
