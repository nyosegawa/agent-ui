import { describe, expect, it } from "vitest";
import { normalizeUsageWindows } from "../src/usage";

describe("normalizeUsageWindows", () => {
  it("handles current Codex rate-limit snapshots", () => {
    expect(
      normalizeUsageWindows({
        rateLimits: {
          limitId: "codex",
          limitName: null,
          primary: { resetsAt: 1778275493, usedPercent: 26, windowDurationMins: 300 },
          secondary: { resetsAt: 1778563862, usedPercent: 56, windowDurationMins: 10080 },
        },
      }).map(({ label, percent, valueLabel }) => ({ label, percent, valueLabel })),
    ).toEqual([
      { label: "codex 5h", percent: 26, valueLabel: "26%" },
      { label: "codex weekly", percent: 56, valueLabel: "56%" },
    ]);
  });

  it("handles legacy used/limit fixture windows", () => {
    expect(
      normalizeUsageWindows({
        rateLimits: {
          limitName: "fixture-demo-model",
          primary: { limit: 100, resetAt: "2026-05-09T12:00:00.000Z", used: 12 },
        },
      }).map(({ label, percent, valueLabel }) => ({ label, percent, valueLabel })),
    ).toEqual([{ label: "fixture-demo-model primary", percent: 12, valueLabel: "12/100" }]);
  });
});
