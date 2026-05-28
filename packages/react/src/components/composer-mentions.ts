import { useCallback } from "react";
import type {
  AgentComposerMentionAttachment,
  AgentComposerMentionResolver,
  ComposerAttachment,
} from "./composer-attachments";

export function useComposerMentionActions({
  addAttachment,
  onRequestAppMention,
  onRequestPluginMention,
}: {
  addAttachment(attachment: ComposerAttachment): void;
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
}) {
  return useCallback(
    async (kind: "app" | "plugin") => {
      const resolver = kind === "app" ? onRequestAppMention : onRequestPluginMention;
      if (!resolver) return;
      let result: AgentComposerMentionAttachment | null | undefined;
      try {
        result = await Promise.resolve(resolver());
      } catch (error) {
        console.warn(`AgentComposer ${kind} mention resolver failed`, error);
        return;
      }
      if (!result) return;
      const label = result.label?.trim();
      const value = result.value?.trim();
      if (!label && !value) return;
      const finalLabel = label || value || kind;
      const finalValue = value || label || kind;
      addAttachment({
        id: result.id ?? `${kind}:${finalValue}:${Date.now()}`,
        input: result.input,
        kind,
        label: finalLabel,
        value: finalValue,
      });
    },
    [addAttachment, onRequestAppMention, onRequestPluginMention],
  );
}
