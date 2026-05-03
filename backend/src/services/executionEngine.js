import Docker from "dockerode";
import fs, { unlinkSync } from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const docker = new Docker();

const Images = {
  javascript: 'node:18-alpine',
  python: 'python:3.11-alpine'
};
const runCommand = {
  javascript: (file) => ["node", `/code/${file}`],
  python: (file) => ["python", `/code/${file}`],
};

const extensions = {
  python: "py",
  javascript: "js",
};

async function executeCode(language, code) {
  const fileName = `${uuidv4()}.${extensions[language]}`;
  const hostTmpDir = os.tmpdir();
  const filePath = path.join(hostTmpDir, fileName);
  fs.writeFileSync(filePath, code);

  const startTime = Date.now();

  //create a container
  const container = await docker.createContainer({
    Image: Images[language],
    Cmd: runCommand[language](fileName),
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

  //kill it after 10sec
  const timeout = setTimeout(async () => {
    try {
      await container.kill();
    } catch (err) {
      console.error("Error killing container", err);
    }
  }, 10000);

  //wait for it to finish it's job
  const output = await container.wait();

  clearTimeout(timeout);

  //now get logs(stdout + stderr)
  const logs = await container
    .logs({
      stdout: true,
      stderr: true,
    })
    .catch(() => Buffer.from(""));

  //now cleanup the temp file
  fs.unlinkSync(filePath);
  return {
    output: logs.toString("utf-8").replace(/[\x00-\x08\x0e-\x1f]/g, ""), // remove ANSI color codes
    exitCode: output.StatusCode,
    duration: Date.now() - startTime,
  };
}


export default executeCode;