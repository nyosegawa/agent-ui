import type { ReasoningEffort } from "@nyosegawa/agent-ui-core";
import type {
  ReasoningEffort as CodexReasoningEffort,
  UserInput as CodexUserInput,
} from "@nyosegawa/agent-ui-codex/stable-types";
import type { AgentUserInput } from "../agent-input";
import type { AgentI18nKey } from "../i18n";

export function normalizeTurnInput(input: string | AgentUserInput[]): string | CodexUserInput[] {
  return typeof input === "string" ? input : input.map(toCodexUserInput);
}

export function codexReasoningEffort(
  effort: ReasoningEffort | undefined,
): CodexReasoningEffort | undefined {
  switch (effort) {
    case "none":
    case "minimal":
    case "low":
    case "medium":
    case "high":
    case "xhigh":
      return effort;
    default:
      return undefined;
  }
}

export function textAgentInput(text: string): AgentUserInput {
  return { text, text_elements: [], type: "text" };
}

export function summarizeUserInput(
  input: AgentUserInput[],
  t: (key: AgentI18nKey) => string,
): string {
  const text = input
    .map((item) => (typeof item === "object" && "text" in item ? item.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
  return text || t("composer.attachedFollowUp");
}

function toCodexUserInput(input: AgentUserInput): CodexUserInput {
  const record = input as Record<string, unknown>;
  switch (input.type) {
    case "text": {
      const text = stringValue(record.text);
      if (!text) throw new Error("Codex text input requires text");
      return { text, text_elements: [], type: "text" };
    }
    case "image": {
      const url = stringValue(record.image_url);
      if (!url) throw new Error("Codex image input requires image_url");
      return { type: "image", url };
    }
    case "localImage": {
      const path = stringValue(record.path);
      if (!path) throw new Error("Codex local image input requires path");
      return { path, type: "localImage" };
    }
    case "skill": {
      const name = stringValue(record.name);
      const path = stringValue(record.path);
      if (!name || !path) throw new Error("Codex skill input requires name and path");
      return { name, path, type: "skill" };
    }
    case "mention": {
      const name = stringValue(record.name);
      const path = stringValue(record.path);
      if (!name || !path) throw new Error("Codex mention input requires name and path");
      return { name, path, type: "mention" };
    }
    default:
      throw new Error(`Unsupported Codex user input type: ${input.type}`);
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
