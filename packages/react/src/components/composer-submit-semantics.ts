export type ComposerSubmitMode = "normal" | "steer";

export function composerSubmitModeForEnter({
  ctrlKey,
  isRunning,
  metaKey,
}: {
  ctrlKey: boolean;
  isRunning: boolean;
  metaKey: boolean;
}): ComposerSubmitMode {
  return isRunning && (metaKey || ctrlKey) ? "steer" : "normal";
}

export function shouldSubmitOnComposerEnter({
  isComposing,
  key,
  shiftKey,
}: {
  isComposing: boolean;
  key: string;
  shiftKey: boolean;
}): boolean {
  return key === "Enter" && !shiftKey && !isComposing;
}
