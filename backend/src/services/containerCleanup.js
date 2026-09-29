import Docker from "dockerode";

const docker = new Docker();

export async function cleanupOrphanContainers() {
  const containers = await docker.listContainers({
    all: true,
    filters: { label: ["com.codeforge.execution=true"] },
  });

  await Promise.all(
    containers.map(async ({ Id }) => {
      try {
        const container = docker.getContainer(Id);
        await container.remove({ force: true });
      } catch (error) {
        if (!/no such container/i.test(error.message)) throw error;
      }
    }),
  );

  console.log(`[cleanup] removed ${containers.length} orphan execution container(s).`);
}
