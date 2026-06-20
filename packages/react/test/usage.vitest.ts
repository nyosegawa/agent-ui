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

  it("deduplicates the same current snapshot surfaced in both response fields", () => {
    const snapshot = {
      limitId: "codex",
      limitName: null,
      primary: { resetsAt: 1778275493, usedPercent: 26, windowDurationMins: 300 },
      secondary: { resetsAt: 1778563862, usedPercent: 56, windowDurationMins: 10080 },
    };
    expect(
      normalizeUsageWindows({
        rateLimits: snapshot,
        rateLimitsByLimitId: { codex: snapshot },
      }).map(({ label }) => label),
    ).toEqual(["codex 5h", "codex weekly"]);
  });

  it("prefers current rate-limit fields over deprecated fallback fields", () => {
    expect(
      normalizeUsageWindows({
        rateLimits: {
          limitId: "current",
          limitName: null,
          primary: { resetsAt: 1778275493, usedPercent: 12, windowDurationMins: 300 },
        },
        rate_limits: {
          limit_id: "deprecated",
          primary: { reset_at: 1778275493, used_percent: 95, window_duration_mins: 300 },
        },
        rateLimitsByLimitId: {
          currentById: {
            limitId: "current-by-id",
            limitName: null,
            primary: { resetsAt: 1778275493, usedPercent: 34, windowDurationMins: 300 },
          },
        },
        rate_limits_by_limit_id: {
          deprecatedById: {
            limit_id: "deprecated-by-id",
            primary: { reset_at: 1778275493, used_percent: 99, window_duration_mins: 300 },
          },
        },
      }).map(({ label, percent, valueLabel }) => ({ label, percent, valueLabel })),
    ).toEqual([
      { label: "current 5h", percent: 12, valueLabel: "12%" },
      { label: "current-by-id 5h", percent: 34, valueLabel: "34%" },
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
