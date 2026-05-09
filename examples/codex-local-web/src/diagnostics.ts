export function isSuppressedCodexDiagnostic(line: string): boolean {
  const message = diagnosticField(line, "message") ?? line;
  const target = diagnosticField(line, "target") ?? line;
  return (
    (target.includes("codex_core_plugins::manifest") &&
      message.includes("ignoring interface.defaultPrompt")) ||
    (target.includes("codex_core_skills::loader") &&
      (message.includes("ignoring interface.icon_small") ||
        message.includes("ignoring interface.icon_large")))
  );
}

function diagnosticField(line: string, field: "message" | "target"): string | undefined {
  try {
    const record = JSON.parse(line) as Record<string, unknown>;
    if (field === "target") return stringValue(record.target);
    const fields = asRecord(record.fields);
    return stringValue(fields?.message);
  } catch {
    return undefined;
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
