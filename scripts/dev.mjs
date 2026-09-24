import { spawn } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

const isProduction = process.argv.includes("--production");
const root = process.cwd();

console.log(
  `\x1b[36m[utlio]\x1b[0m Starting Utlio in ${isProduction ? "production" : "development"} mode...`
);

const children = [];

function startProcess(name, cmd, args, cwd, color) {
  const isWindows = process.platform === "win32";
  const shellCmd = isWindows ? "cmd.exe" : cmd;
  const shellArgs = isWindows ? ["/d", "/s", "/c", `${cmd} ${args.join(" ")}`] : args;

  const child = spawn(shellCmd, shellArgs, {
    cwd,
    stdio: ["inherit", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  child.stdout?.on("data", (data) => {
    const lines = data.toString().split(/\r?\n/);
    for (const line of lines) {
      if (line.trim()) {
        process.stdout.write(`${color}[${name}]\x1b[0m ${line}\n`);
      }
    }
  });

  child.stderr?.on("data", (data) => {
    const lines = data.toString().split(/\r?\n/);
    for (const line of lines) {
      if (line.trim()) {
        process.stderr.write(`${color}[${name}]\x1b[0m ${line}\n`);
      }
    }
  });

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(
        `${color}[${name}]\x1b[0m Process exited with error code ${code}`
      );
    }
  });

  children.push(child);
  return child;
}

// 1. Start Backend on port 4000
const backendArgs = isProduction ? ["src/server.js"] : ["--watch", "src/server.js"];
startProcess(
  "backend",
  "node",
  backendArgs,
  resolve(root, "backend"),
  "\x1b[32m" // Green
);

// 2. Start Frontend on port 3000
const frontendArgs = isProduction ? ["run", "start"] : ["run", "dev"];
startProcess(
  "frontend",
  "npm",
  frontendArgs,
  resolve(root, "frontend"),
  "\x1b[35m" // Magenta
);

function cleanup() {
  console.log("\n\x1b[33m[utlio] Shutting down services...\x1b[0m");
  for (const child of children) {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"]);
      } else {
        child.kill("SIGTERM");
      }
    } catch {}
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
