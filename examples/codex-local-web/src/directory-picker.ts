export function isDirectoryPickerCancelError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("user canceled") ||
    message.includes("user cancelled") ||
    message.includes("(-128)") ||
    message.includes("number -128") ||
    (message.includes("キャンセル") && message.includes("ユーザ"))
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    const stderr = stringProperty(error, "stderr");
    const stdout = stringProperty(error, "stdout");
    return [error.message, stderr, stdout].filter(Boolean).join("\n");
  }
  return String(error);
}

function stringProperty(value: object, key: string): string | undefined {
  const property = (value as Record<string, unknown>)[key];
  return typeof property === "string" ? property : undefined;
}
