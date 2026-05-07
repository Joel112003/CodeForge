// Container cleanup is a no-op in cloud deployments.
// Code execution now uses the Piston API — there are no local Docker containers to clean up.

export async function cleanupOrphanContainers() {
  console.log("[cleanup] API execution mode — no local containers to clean up.");
}
