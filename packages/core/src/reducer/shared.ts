export function recordOrUndefined(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

export function isPreviewThreadStatus(status?: string): boolean {
  return status === "notLoaded" || status === "loaded";
}

export function preservesAgainstPreviewSnapshot(status?: string): boolean {
  return Boolean(status) && !isPreviewThreadStatus(status);
}

export function isCompletedTurnStatus(status?: string): boolean {
  return status === "complete" || status === "completed";
}

export function upsertById<T extends { id: string }>(values: T[], value: T): T[] {
  const index = values.findIndex((current) => current.id === value.id);
  if (index === -1) return [...values, value];
  const next = [...values];
  next[index] = value;
  return next;
}
