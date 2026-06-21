import { describe, expect, it } from "vitest";
import {
  diagnosticsTitle,
  normalizedStatusNotices,
  statusSummary,
} from "../src/components/status-formatting";

describe("status formatting", () => {
  it("normalizes status notice titles and severity", () => {
    expect(
      normalizedStatusNotices([
        { id: "config", kind: "configWarning", message: "Check config" },
        {
          id: "blocked",
          kind: "rateLimit",
          message: "Usage reached 95%",
        },
        {
          id: "healthy",
          kind: "rateLimit",
          message: "Usage below warning threshold",
        },
      ]).map((notice) => ({
        severity: notice.severity,
        title: notice.title,
      })),
    ).toEqual([
      { severity: "warning", title: "Config warning" },
      { severity: "critical", title: "Rate limit" },
      { severity: "info", title: "Rate limit" },
    ]);
  });

  it("uses structured rate-limit severity before message heuristics", () => {
    expect(
      normalizedStatusNotices([
        {
          id: "structured",
          kind: "rateLimit",
          message: "looks okay",
          raw: { primary: { limit: 100, used: 85 } },
        },
      ])[0]?.severity,
    ).toBe("warning");
  });

  it("prefers current rate-limit fields over deprecated fallback fields", () => {
    expect(
      normalizedStatusNotices([
        {
          id: "mixed",
          kind: "rateLimit",
          message: "structured fields win",
          raw: {
            rateLimits: {
              primary: { usedPercent: 10 },
            },
            rate_limits: {
              primary: { used_percent: 99 },
            },
            rateLimitsByLimitId: {
              current: { primary: { usedPercent: 12 } },
            },
            rate_limits_by_limit_id: {
              deprecated: { primary: { used_percent: 100 } },
            },
          },
        },
      ])[0]?.severity,
    ).toBe("info");
  });

  it("formats fallback summaries without leaking i18n keys", () => {
    expect(statusSummary(2, 0, 0)).toBe("2 background notices");
    expect(statusSummary(3, 1, 0)).toBe("1 warning · 3 total");
    expect(statusSummary(4, 1, 2)).toBe("2 critical · 1 warning · 4 total");
  });

  it("summarizes diagnostics plugin warnings", () => {
    expect(diagnosticsTitle(["codex_core_plugins::manifest warning"])).toBe(
      "Plugin manifest warnings",
    );
    expect(
      diagnosticsTitle([
        "codex_core_plugins::manifest warning",
        "other warning",
      ]),
    ).toBe("Diagnostics and plugin warnings");
  });
});
