export function turnStartResultId(response: unknown): string | undefined {
  const responseRecord = asRecord(response);
  const rawTurn = asRecord(responseRecord?.turn) ?? responseRecord;
  return stringValue(rawTurn?.id);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
