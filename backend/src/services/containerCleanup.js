// No-op in production: code execution uses child_process, not local Docker.
export async function cleanupOrphanContainers() {
  console.log("[cleanup] child_process mode — no containers to clean up.");
}
