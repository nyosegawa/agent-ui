import { stringValue } from "./shared";

export function joinSummaryDetails(
  summary: unknown,
  details: unknown,
  fallback: string,
): string {
  const summaryText = stringValue(summary) ?? fallback;
  const detailsText = stringValue(details);
  return detailsText ? `${summaryText} ${detailsText}` : summaryText;
}

export { numberValue } from "./shared";
