import Docker from "dockerode";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const docker = new Docker();

export const Images = {
  javascript: "node:18-alpine",
  python: "python:3.11-alpine",
};
export const runCommand = {
  javascript: (file) => ["node", `/code/${file}`],
  python: (file) => ["python", `/code/${file}`],
};

const extensions = {
  python: "py",
  javascript: "js",
};

async function executeCode(language, code, onChunk) {
  const fileName = `${uuidv4()}.${extensions[language]}`;
  const hostTmpDir = os.tmpdir();
  const filePath = path.join(hostTmpDir, fileName);
  fs.writeFileSync(filePath, code);

  //create a container
  const container = await docker.createContainer({
    Image: Images[language],
    Cmd: runCommand[language](fileName),
    Labels: { "created-by": "code-engine" },
    HostConfig: {
      Memory: 50 * 1024 * 1024, // 50MB
      CpuQuota: 50000,
      CpuPeriod: 100000,
      PidsLimit: 50, // prevents fork bomb
      ReadonlyRootfs: true,
      AutoRemove: true,
      // Mount the host temp directory into the container at /code
      Binds: [
        // Normalize Windows backslashes to forward slashes so Docker accepts the path
        `${hostTmpDir.replace(/\\/g, "/")}:/code:ro`,
      ], // mount temp dir as read-only
    },
  });

  await container.start();

  const stream = await container.logs({
    stdout: true,
    stderr: true,
    follow: true,
  });

  //kill it after 10sec
  const timeout = setTimeout(async () => {
    try {
      await container.kill();
    } catch {}
    onChunk("[Execution timed out]", "stderr");
  }, 10000);

  container.modem.demuxStream(
    stream,
    {
      write: (chunk) => onChunk(chunk.toString(), "stdout"),
    },
    {
      write: (chunk) => onChunk(chunk.toString(), "stderr"),
    },
  );

  await new Promise((resolve) => stream.on("end", resolve));
  clearTimeout(timeout);
  fs.unlinkSync(filePath);
}

export default executeCode;
