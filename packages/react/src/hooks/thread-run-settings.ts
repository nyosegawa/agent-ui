import type { AgentEvent } from "@nyosegawa/agent-ui-core";
import { threadProjectPath } from "../thread-history";
import type { AgentThreadResumeRunSettings } from "./thread-lifecycle-types";

export function syncRunSettingsFromRawThread(
  dispatch: (event: AgentEvent) => void,
  rawThread: Record<string, unknown>,
) {
  const runSettings = runSettingsFromRawThread(rawThread);
  if (!runSettings) return;
  dispatch({
    ...runSettings,
    type: "runSettings/updated",
  });
}

export function runSettingsFromRawThread(
  rawThread: Record<string, unknown>,
): AgentThreadResumeRunSettings | undefined {
  const cwd = threadProjectPath(rawThread);
  const modelId = stringValue(rawThread.modelId) ?? stringValue(rawThread.model);
  const effort = stringValue(rawThread.effort) ?? stringValue(rawThread.reasoningEffort);
  if (cwd || modelId || effort) return { cwd, effort, modelId };
  return undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
