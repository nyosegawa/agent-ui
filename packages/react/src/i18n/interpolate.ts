export function interpolate(
  template: string,
  vars: Record<string, string | number> | undefined,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

export function interpolationVariables(template: string): string[] {
  return Array.from(template.matchAll(/\{(\w+)\}/g), (match) => match[1] ?? "").sort();
}
