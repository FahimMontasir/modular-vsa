const host = Bun.env.DRIZZLE_STUDIO_HOST;
const port = Bun.env.DRIZZLE_STUDIO_PORT;

if (!host || !port || !/^\d+$/.test(port)) {
  throw new Error("DRIZZLE_STUDIO_HOST and a numeric DRIZZLE_STUDIO_PORT are required");
}

const studio = Bun.spawn(
  [
    "bun",
    "--bun",
    "drizzle-kit",
    "studio",
    "--config=drizzle.config.ts",
    "--host",
    host,
    "--port",
    port,
  ],
  {
    cwd: import.meta.dir + "/..",
    env: Bun.env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => studio.kill(signal));
}

process.exit(await studio.exited);
