import Docker from "dockerode";
import { Images, runCommand } from "./executionEngine.js";

const docker = new Docker();

export async function cleanupOrphanContainers() {
  try {
    const containers = await docker.listContainers({
      filters: {
        Image: Images[language],
        Cmd: runCommand[language](`/code/${filename}`),
        label: ["created-by=code-forge"],
      },
    });
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
