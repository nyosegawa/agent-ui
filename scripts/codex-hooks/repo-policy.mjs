#!/usr/bin/env node
import { Buffer } from "node:buffer";
import { error, log } from "node:console";
import process from "node:process";

import { evaluateHook } from "./repo-policy-lib.mjs";

const input = await readHookInput();
const eventName = process.argv[2] || input.hook_event_name;
const result = evaluateHook(input, { eventName });

if (result.stdout !== undefined) {
  log(typeof result.stdout === "string" ? result.stdout : JSON.stringify(result.stdout));
}
if (result.stderr) error(result.stderr);
if (result.exitCode !== undefined) process.exit(result.exitCode);

async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
