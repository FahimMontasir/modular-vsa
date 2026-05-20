const isServer = typeof Bun !== "undefined";

let isProduction = false;
// let logServerToken = "";
let LOG_DIR = "";

// Completely isolate all server-only modules and paths
if (isServer) {
  const { resolve } = await import("path");
  const { env } = await import("@modular-vsa/env/server");

  isProduction = env.NODE_ENV === "production";
  // logServerToken = env.LOG_SERVER_TOKEN;
  LOG_DIR = resolve(import.meta.dir, "../../../../logs");
}

class Logger {
  constructor() {
    if (isServer && isProduction) {
      void this._ensureLogDir();
    }
  }

  private _getDhakaDateTime(): { dateString: string; fullTimestamp: string } {
    const now = new Date();
    const dateString = now.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
    const fullTimestamp = now
      .toLocaleString("en-ZA", { timeZone: "Asia/Dhaka", hour12: true })
      .replace(",", "");
    return { dateString, fullTimestamp };
  }

  log(level: "info" | "warn" | "error", message: string, meta?: Record<string, any>) {
    const { dateString, fullTimestamp } = this._getDhakaDateTime();

    const payload = {
      level: level.toUpperCase(),
      timestamp: fullTimestamp,
      message,
      ...meta,
    };

    if (!isServer) {
      this._toConsole(level, message, meta, fullTimestamp);
      return;
    }

    if (!isProduction) {
      this._toConsole(level, message, meta, fullTimestamp);
    } else {
      this._toFile(payload, dateString);
      this._toRemoteServer(payload);
    }
  }

  private _toConsole(level: string, message: string, meta: any, timestamp: string) {
    const lvlUpper = level.toUpperCase();

    if (!isServer) {
      const browserColors = {
        info: "color: #22c55e",
        warn: "color: #eab308",
        error: "color: #ef4444",
      };
      console.log(
        `%c[${lvlUpper}]%c [${timestamp}] ${message}`,
        browserColors[level as keyof typeof browserColors] || "",
        "",
        meta || ""
      );
      return;
    }

    const colors = { info: "\x1b[32m", warn: "\x1b[33m", error: "\x1b[31m", reset: "\x1b[0m" };
    const color = colors[level as keyof typeof colors] || colors.reset;

    console.log(`[${color}${lvlUpper}${colors.reset}] [${timestamp}] ${message}`);

    if (meta) {
      console.log(Bun.inspect(meta, { colors: true, depth: 5 }));
    }
  }

  private async _toFile(payload: any, dateString: string) {
    try {
      const { mkdir, appendFile } = await import("fs/promises");
      const { join } = await import("path");

      await mkdir(LOG_DIR, { recursive: true });
      const filePath = join(LOG_DIR, `app-${dateString}.log`);

      await appendFile(
        filePath,
        JSON.stringify(payload, (_, v) =>
          v instanceof Error ? { message: v.message, stack: v.stack } : v
        ) + "\n"
      );
    } catch (err) {
      console.error("Local file logging failed:", err);
    }
  }

  private async _ensureLogDir() {
    try {
      const { mkdir } = await import("fs/promises");

      await mkdir(LOG_DIR, { recursive: true });
    } catch (err) {
      console.error("Preparing log directory failed:", err);
    }
  }

  private _toRemoteServer(_payload: any) {
    // fetch("https://your-remote-server.com", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${logServerToken}`,
    //   },
    //   body: JSON.stringify(_payload, (_, v) =>
    //     v instanceof Error ? { message: v.message, stack: v.stack } : v
    //   ),
    // }).catch((err) => {
    //   console.error("Remote logging failed:", err.message);
    // });
  }

  info(msg: string, meta?: Record<string, any>) {
    this.log("info", msg, meta);
  }
  warn(msg: string, meta?: Record<string, any>) {
    this.log("warn", msg, meta);
  }
  error(msg: string, meta?: Record<string, any>) {
    this.log("error", msg, meta);
  }
}

export const logger = new Logger();
