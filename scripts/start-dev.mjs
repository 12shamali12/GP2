import { spawn } from "node:child_process";
import { resolve } from "node:path";

const rootDir = process.cwd();
const services = [
  { name: "backend", cwd: resolve(rootDir, "backend") },
  { name: "frontend", cwd: resolve(rootDir, "frontend") },
];

const children = [];
let shuttingDown = false;

function startService(service) {
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", "pnpm.cmd start:dev"], {
          cwd: service.cwd,
          stdio: "inherit",
        })
      : spawn("pnpm", ["start:dev"], {
          cwd: service.cwd,
          stdio: "inherit",
        });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.error(`[${service.name}] exited with ${reason}`);
    shutdown(code ?? 0);
  });

  child.on("error", (error) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.error(`[${service.name}] failed to start: ${error.message}`);
    shutdown(1);
  });

  children.push(child);
}

function shutdown(exitCode = 0) {
  for (const child of children) {
    if (child.killed) {
      continue;
    }

    child.kill("SIGINT");
  }

  process.exit(exitCode);
}

process.on("SIGINT", () => {
  shuttingDown = true;
  shutdown(0);
});

process.on("SIGTERM", () => {
  shuttingDown = true;
  shutdown(0);
});

for (const service of services) {
  startService(service);
}
