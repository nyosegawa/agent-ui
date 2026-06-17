export const AGENT_RETENTION_POLICY = {
  appScopesMax: 200,
  commandOutputMaxChars: 128_000,
  diagnosticsErrorsMax: 50,
  filePatchesPerTurnMax: 40,
  hooksCwdEntriesMax: 50,
  protocolNotificationsMax: 100,
  skillsCwdEntriesMax: 50,
  statusBannersMax: 20,
  threadCollectionEntriesMax: 200,
  warningsMax: 50,
} as const;

export function boundedAppend<T>(items: readonly T[], item: T, max: number): T[] {
  return [...items, item].slice(-max);
}

export function boundedStringAppend(current: string | undefined, delta: string, maxChars: number): string {
  const next = `${current ?? ""}${delta}`;
  return next.length > maxChars ? next.slice(-maxChars) : next;
}

export function boundedRecordEntry<T>(
  record: Record<string, T>,
  key: string,
  value: T,
  maxEntries: number,
): Record<string, T> {
  const next = { ...record };
  delete next[key];
  next[key] = value;
  const keys = Object.keys(next);
  for (const staleKey of keys.slice(0, Math.max(0, keys.length - maxEntries))) {
    delete next[staleKey];
  }
  return next;
}

export function boundedUniqueAppend<T>(items: readonly T[], item: T, max: number): T[] {
  return [...items.filter((candidate) => candidate !== item), item].slice(-max);
}

export function boundedUniquePrepend<T>(items: readonly T[], item: T, max: number): T[] {
  return [item, ...items.filter((candidate) => candidate !== item)].slice(0, max);
}
