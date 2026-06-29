import type { AgentI18nKey } from "../i18n";
import { interpolate } from "../i18n/interpolate";
import { en } from "../i18n/locales/en";
import type { AgentTranscriptBlock } from "../hooks/transcript";

export function commandPreview(text: string): string {
  const preview = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!preview) return "";
  return preview.length > 180 ? `${preview.slice(0, 177)}...` : preview;
}

export function toolPreview(
  block: AgentTranscriptBlock,
  t: (key: AgentI18nKey, vars?: Record<string, string | number>) => string = fallbackTimelineT,
): string | undefined {
  if (block.status === "failed") return undefined;
  const compactResult = block.resultText
    ? compactTextPreview(block.resultText)
    : undefined;
  const resultPreview =
    compactResult && looksLikeMachinePreview(compactResult)
      ? t("timeline.resultCaptured")
      : compactResult;
  if (resultPreview) return resultPreview;
  const argsPreview =
    block.status === "inProgress" && block.argumentsText
      ? compactTextPreview(block.argumentsText)
      : undefined;
  if (argsPreview) return t("timeline.argumentsPreview", { preview: argsPreview });
  return undefined;
}

function fallbackTimelineT(key: AgentI18nKey, vars?: Record<string, string | number>) {
  return interpolate(en[key], vars);
}

function compactTextPreview(value: string): string | undefined {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function looksLikeMachinePreview(value: string): boolean {
  const text = value.trim();
  return (
    text.startsWith("{") ||
    text.startsWith("[") ||
    text.includes("\\n") ||
    text === "true" ||
    text === "false" ||
    text === "null" ||
    text === "undefined" ||
    /^-?\d+(\.\d+)?$/.test(text) ||
    /^[A-Z][A-Za-z]*Error:/.test(text)
  );
}
