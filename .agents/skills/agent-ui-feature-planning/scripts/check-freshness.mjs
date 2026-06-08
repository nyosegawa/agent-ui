#!/usr/bin/env node
import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";

const root = process.cwd();
const manifestPath = join(
  root,
  ".agents/skills/agent-ui-feature-planning/references/freshness-manifest.json",
);

if (!existsSync(manifestPath)) {
  process.stderr.write(`Missing freshness manifest: ${manifestPath}\n`);
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const currentCommit = runGit(["rev-parse", "HEAD"]);
const changedFiles = [];
const changedGlobs = [];
const missingFiles = [];
const watchedGlobs = [];

for (const [file, meta] of Object.entries(manifest.watched_files ?? {})) {
  const path = join(root, file);
  if (!existsSync(path)) {
    missingFiles.push(file);
    continue;
  }
  const actual = sha256(readFileSync(path));
  if (actual !== meta.sha256) {
    changedFiles.push({ file, expected: meta.sha256, actual, reason: meta.reason });
  }
}

for (const entry of manifest.watched_globs ?? []) {
  const files = expandSimpleGlob(entry.glob);
  const fingerprint = hashLines(
    files.map((file) => `${file}\0${sha256(readFileSync(join(root, file)))}`),
  );
  watchedGlobs.push({
    glob: entry.glob,
    reason: entry.reason,
    file_count: files.length,
    fingerprint,
    files,
  });
  if (entry.fingerprint && entry.fingerprint !== fingerprint) {
    changedGlobs.push({
      glob: entry.glob,
      expected: entry.fingerprint,
      actual: fingerprint,
      reason: entry.reason,
    });
  }
}

const needsRefresh =
  changedFiles.length > 0 || changedGlobs.length > 0 || missingFiles.length > 0;
process.stdout.write(
  JSON.stringify(
    {
      status: needsRefresh ? "refresh-needed" : "fresh",
      current_commit: currentCommit,
      last_full_research_commit: manifest.last_full_research_commit ?? null,
      changed_files: changedFiles,
      changed_globs: changedGlobs,
      missing_files: missingFiles,
      watched_globs: watchedGlobs,
      recommendation: needsRefresh
        ? "Run targeted refresh for changed watched inputs; use full refresh only for structural changes."
        : "No watched file hash changes detected; continue with existing repo guidance.",
    },
    null,
    2,
  ) + "\n",
);
process.exit(needsRefresh ? 1 : 0);

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function hashLines(lines) {
  return sha256(Buffer.from(lines.sort().join("\n")));
}

function runGit(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function expandSimpleGlob(glob) {
  if (!glob.includes("*")) {
    return existsSync(join(root, glob)) && glob !== manifestRelativePath() ? [glob] : [];
  }
  const regex = globToRegExp(glob);
  const tracked = runGit(["ls-files"]);
  const candidates = tracked
    ? tracked.split(/\r?\n/).filter(Boolean)
    : walk(root).map((path) => relative(root, path));
  return candidates
    .filter((path) => path !== manifestRelativePath())
    .filter((path) => regex.test(path))
    .sort();
}

function manifestRelativePath() {
  return relative(root, manifestPath);
}

function globToRegExp(glob) {
  let pattern = "";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];
    if (char === "*" && next === "*") {
      pattern += ".*";
      index += 1;
    } else if (char === "*") {
      pattern += "[^/]*";
    } else {
      pattern += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${pattern}$`);
}

function walk(dir) {
  const entries = [];
  for (const dirent of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, dirent.name);
    if (dirent.isDirectory()) {
      entries.push(...walk(path));
    } else if (dirent.isFile() && statSync(path).size < 2_000_000) {
      entries.push(path);
    }
  }
  return entries;
}
