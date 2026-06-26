import { useCallback } from "react";
import type { AgentUserInput } from "../agent-input";
import type {
  AgentComposerIntegration,
  AgentComposerIntegrationAttachment,
  ComposerAttachment,
} from "./composer-attachments";

export function useComposerIntegrationActions({
  addAttachment,
  integrations,
}: {
  addAttachment(attachment: ComposerAttachment): void;
  integrations?: readonly AgentComposerIntegration[];
}) {
  return useCallback(
    async (integrationId: string) => {
      const integration = integrations?.find((candidate) => candidate.id === integrationId);
      if (!integration) return;
      let result: AgentComposerIntegrationAttachment | null | undefined;
      try {
        result = await Promise.resolve(integration.resolve());
      } catch (error) {
        console.warn(
          `AgentComposer integration resolver failed for ${integration.id}`,
          error,
        );
        return;
      }
      if (!result) return;
      const label = result.label?.trim();
      if (!label) return;
      if (!hasIntegrationInput(result.input)) {
        console.warn(
          `AgentComposer integration resolver returned no input for ${integration.id}`,
        );
        return;
      }
      addAttachment({
        id: result.id ?? `integration:${integration.id}:${Date.now()}`,
        input: result.input,
        kind: "integration",
        label,
        value: result.value,
      });
    },
    [addAttachment, integrations],
  );
}

function hasIntegrationInput(input: AgentUserInput | AgentUserInput[]): boolean {
  if (Array.isArray(input)) return input.length > 0 && input.every(isAgentUserInput);
  return isAgentUserInput(input);
}

function isAgentUserInput(input: AgentUserInput | undefined): input is AgentUserInput {
  return Boolean(
    input &&
      typeof input === "object" &&
      "type" in input &&
      typeof input.type === "string" &&
      input.type.trim(),
  );
}
