import { execFileSync } from "node:child_process";
import { log } from "node:console";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const ports = process.argv.slice(2);

if (ports.length === 0) {
  ports.push("4173", "4174");
}

for (const port of ports) {
  const pids = listeningPids(port);

  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGTERM");
      log(`Stopped listener ${pid} on port ${port}`);
    } catch {
      // The listener may have already exited between lsof and kill.
    }
  }

  await waitForPortToClose(port);
}

function listeningPids(port) {
  let output;
  try {
    output = execFileSync("lsof", ["-tiTCP:" + port, "-sTCP:LISTEN"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return [];
  }

  return output
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

async function waitForPortToClose(port) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (listeningPids(port).length === 0) return;
    await delay(100);
  }

  for (const pid of listeningPids(port)) {
    try {
      process.kill(Number(pid), "SIGKILL");
      log(`Force-stopped listener ${pid} on port ${port}`);
    } catch {
      // The listener may have already exited between lsof and kill.
    }
  }
}
