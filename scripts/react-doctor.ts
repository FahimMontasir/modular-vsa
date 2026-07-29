import { resolve } from "node:path";

const workspaceRoot = resolve(import.meta.dir, "..");
const outputDirectory = resolve(workspaceRoot, "react-doctor");
const args = Bun.argv.slice(2);

const doctor = Bun.spawn(
  ["bunx", "--bun", "react-doctor@latest", "--output-dir", outputDirectory, ...args],
  {
    cwd: workspaceRoot,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }
);

const doctorExitCode = await doctor.exited;
if (doctorExitCode !== 0) process.exit(doctorExitCode);

const format = Bun.spawn(["vp", "fmt", resolve(outputDirectory, "diagnostics.json"), "--write"], {
  cwd: workspaceRoot,
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

process.exit(await format.exited);
