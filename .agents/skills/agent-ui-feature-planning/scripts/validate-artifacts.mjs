#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import process from "node:process";

const dirArg = process.argv[2];
if (!dirArg) {
  process.stderr.write("Usage: validate-artifacts.mjs <feature-artifact-directory>\n");
  process.exit(2);
}

const artifactDir = resolve(process.cwd(), dirArg);
const errors = [];
const requiredFiles = ["research.md", "plan.md", "todo.md", "goal-prompt.md"];

for (const file of requiredFiles) {
  if (!existsSync(join(artifactDir, file))) errors.push(`Missing required file: ${file}`);
}

const files = Object.fromEntries(
  requiredFiles
    .filter((file) => existsSync(join(artifactDir, file)))
    .map((file) => [file, readFileSync(join(artifactDir, file), "utf8")]),
);

checkSections("research.md", [
  "Scope",
  "Freshness Check",
  "Investigation Method",
  "Subagent Rounds",
  "Sources Inspected",
  "Findings",
  "Repo Guidance Findings",
  "Architecture / Boundary Findings",
  "Validation / CI Findings",
  "Existing Skill / Command Findings",
  "Web / Current-State Findings",
  "Freshness / Staleness Findings",
  "Generated / Vendored / Protected File Findings",
  "Risks",
  "Decisions",
  "Rejected Approaches",
  "Remaining Unknowns",
]);

checkSections("plan.md", [
  "Summary",
  "Background",
  "Current State",
  "Goals",
  "Non-Goals",
  "Repo-Specific Constraints",
  "Design Decisions",
  "Impacted Areas",
  "Validation Plan",
  "Commit, PR, And CI Plan",
  "Risks",
  "Completion Criteria",
  "Open Questions",
]);

checkSections("todo.md", [
  "Status Summary",
  "Branch And Planning Commit",
  "Phase Checklist",
  "Task Checklist By Phase",
  "Implementation Notes",
  "Validation Evidence",
  "Review Evidence",
  "Commit Log",
  "Final Checklist",
]);

checkSections("goal-prompt.md", [
  "/goal command",
  "source artifact paths",
  "repo guidance paths",
  "branch and planning commit",
  "freshness policy and freshness result",
  "execution rules",
  "validation rules",
  "review rules",
  "commit rules",
  "push rules",
  "PR rules",
  "CI follow-through rules",
  "evidence rules",
  "repo-specific forbidden edits",
  "repo-specific checks",
  "stop conditions",
  "escalation conditions",
]);

let branchName = null;
if (files["todo.md"]) branchName = checkTodo(files["todo.md"]);
if (files["goal-prompt.md"]) checkGoalPrompt(files["goal-prompt.md"], branchName);

if (errors.length > 0) {
  process.stderr.write(`Artifact validation failed for ${artifactDir}\n`);
  for (const error of errors) process.stderr.write(`- ${error}\n`);
  process.stderr.write(`Summary: ${errors.length} failure(s)\n`);
  process.exit(1);
}

process.stdout.write(`Artifact validation passed for ${artifactDir}\n`);
process.stdout.write("- required files exist\n");
process.stdout.write("- required top-level sections exist\n");
process.stdout.write("- goal-prompt.md is 4000 characters or fewer\n");
process.stdout.write("- todo.md records branch, planning commit, remote, push result, and blockers\n");
process.stdout.write("- todo.md is phase-first with required phase/task fields\n");
process.stdout.write("- goal-prompt.md references absolute research/plan/todo paths and same-branch implementation\n");

function checkSections(file, sections) {
  const text = files[file];
  if (!text) return;
  for (const section of sections) {
    if (!new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "im").test(text)) {
      errors.push(`${file}: missing section "## ${section}"`);
    }
  }
}

function checkTodo(text) {
  const branchFields = [
    ["Branch", true],
    ["Planning commit", false],
    ["Remote", false],
    ["Push result", false],
    ["Blockers", false],
  ];
  let branchName = null;

  for (const [field, requireValue] of branchFields) {
    const match = text.match(new RegExp(`^- ${escapeRegExp(field)}:\\s*(.*)$`, "im"));
    if (!match) {
      errors.push(`todo.md: Branch And Planning Commit missing field "${field}:"`);
      continue;
    }
    if (requireValue && match[1].trim().length === 0) {
      errors.push(`todo.md: Branch And Planning Commit field "${field}:" must include a value`);
    }
    if (field === "Branch") branchName = match[1].trim();
  }

  const phaseMatches = [...text.matchAll(/^- \[[ xX]\] (P\d{3})\s+(.+)$/gm)];
  if (phaseMatches.length === 0) {
    errors.push("todo.md: expected at least one phase checkbox like '- [ ] P001 <title>'");
    return branchName;
  }

  for (const [phaseId, block] of splitPhaseBlocks(text)) {
    const fields = [
      "Goal",
      "Scope",
      "Expected files/areas",
      "Validation",
      "Review",
      "Commit",
      "Push",
      "PR/CI",
      "Evidence",
      "Tasks",
    ];
    for (const field of fields) {
      if (!new RegExp(`^\\s+- ${escapeRegExp(field)}:`, "m").test(block)) {
        errors.push(`todo.md: ${phaseId} missing field "${field}"`);
      }
    }

    for (const evidenceField of ["Implementation", "Validation", "Review", "Commit", "Push"]) {
      if (!new RegExp(`^\\s+- ${escapeRegExp(evidenceField)}:`, "m").test(block)) {
        errors.push(`todo.md: ${phaseId} Evidence missing "${evidenceField}"`);
      }
    }

    const planningOnly = /planning-only|validation-only/i.test(block);
    const tasks = [...block.matchAll(/^\s+- \[[ xX]\] (T\d{3})\s+(.+)$/gm)];
    if (!planningOnly && tasks.length === 0) {
      errors.push(`todo.md: ${phaseId} needs at least one T### task`);
    }
    for (const task of tasks) {
      const start = task.index ?? 0;
      const currentLineEnd = block.indexOf("\n", start);
      const searchStart = currentLineEnd === -1 ? start : currentLineEnd + 1;
      const nextTask = block.slice(searchStart).search(/^\s+- \[[ xX]\] T\d{3}\s+/m);
      const end = nextTask === -1 ? block.length : searchStart + nextTask;
      const taskBlock = block.slice(start, end);
      if (!/^\s+- Expected files\/areas:/m.test(taskBlock)) {
        errors.push(`todo.md: ${phaseId} ${task[1]} missing "Expected files/areas"`);
      }
      if (!/^\s+- Validation note:/m.test(taskBlock)) {
        errors.push(`todo.md: ${phaseId} ${task[1]} missing "Validation note"`);
      }
    }
  }

  return branchName;
}

function splitPhaseBlocks(text) {
  const matches = [...text.matchAll(/^- \[[ xX]\] (P\d{3})\s+.+$/gm)];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? text.length;
    return [match[1], text.slice(start, end)];
  });
}

function checkGoalPrompt(text, branchName) {
  const charCount = [...text].length;
  if (charCount > 4000) {
    errors.push(`goal-prompt.md: expected 4000 characters or fewer, found ${charCount}`);
  }

  const absoluteRefs = [
    ...text.matchAll(/(?:^|\s)(\/[^\s`]+(?:research|plan|todo)\.md)/gm),
  ].map((match) => match[1]);
  for (const file of ["research.md", "plan.md", "todo.md"]) {
    if (!new RegExp(`(?:^|\\s)/[^\\s\`]*${escapeRegExp(file)}(?:\\s|$)`).test(text)) {
      errors.push(`goal-prompt.md: missing absolute path to ${file}`);
    }
  }
  if (!absoluteRefs.some((path) => isAbsolute(path) && path.endsWith("research.md"))) {
    errors.push("goal-prompt.md: missing absolute path to research.md");
  }
  if (!absoluteRefs.some((path) => isAbsolute(path) && path.endsWith("plan.md"))) {
    errors.push("goal-prompt.md: missing absolute path to plan.md");
  }
  if (!absoluteRefs.some((path) => isAbsolute(path) && path.endsWith("todo.md"))) {
    errors.push("goal-prompt.md: missing absolute path to todo.md");
  }

  if (branchName && !text.includes(branchName)) {
    errors.push(`goal-prompt.md: missing branch name "${branchName}"`);
  }
  if (!/same branch|same-branch/i.test(text)) {
    errors.push("goal-prompt.md: missing same-branch implementation rule");
  }
  if (!/continue (implementation )?on|continue on/i.test(text)) {
    errors.push("goal-prompt.md: must instruct implementation to continue on the planning branch");
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
