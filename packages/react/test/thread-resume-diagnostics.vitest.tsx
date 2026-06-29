// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FakeAgentTransport } from "@nyosegawa/agent-ui-core";
import type * as CodexNormalizer from "@nyosegawa/agent-ui-codex/normalizer";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@nyosegawa/agent-ui-codex/normalizer", async () => {
  const actual = await vi.importActual<typeof CodexNormalizer>(
    "@nyosegawa/agent-ui-codex/normalizer",
  );
  return {
    ...actual,
    normalizeThreadResumeResponse: vi.fn(() => {
      throw new Error("normalizer secret should not leak");
    }),
  };
});

describe("thread resume diagnostics", () => {
  it("emits raw-free diagnostics when resume normalization fails after a canonical id is known", async () => {
    const {
      AgentProvider,
    } = await import("../src");
    const { useAgentDiagnostics, useAgentThreadController } = await import("../src/headless");
    const user = userEvent.setup();
    const transport = new FakeAgentTransport({
      onRequest(request) {
        if (request.method === "thread/resume") {
          return {
            thread: {
              id: "thread-canonical-normalization-failed",
              name: "Raw thread name should not leak",
              status: { type: "idle" },
            },
          };
        }
        return {};
      },
    });

    function Probe() {
      const { resumeThread } = useAgentThreadController();
      const { auditDiagnostics, developerDiagnostics, userDiagnostics } =
        useAgentDiagnostics();
      const [result, setResult] = useState("none");
      return (
        <>
          <button
            onClick={() => {
              void resumeThread("thread-requested-normalization-failed").catch(
                (caught: unknown) => {
                  setResult(caught instanceof Error ? caught.message : String(caught));
                },
              );
            }}
            type="button"
          >
            Resume malformed canonical thread
          </button>
          <output aria-label="resume result">{result}</output>
          <output aria-label="developer resume diagnostics">
            {developerDiagnostics.warnings
              .map((warning) =>
                JSON.stringify({
                  id: warning.id,
                  message: warning.message,
                  raw: warning.raw,
                  reasonCode: warning.reasonCode,
                  requestedThreadId: warning.requestedThreadId,
                  threadId: warning.threadId,
                }),
              )
              .join("\n") || "none"}
          </output>
          <output aria-label="audit resume diagnostics">
            {auditDiagnostics.warnings.map((warning) => warning.reasonCode).join(",") ||
              "none"}
          </output>
          <output aria-label="user resume diagnostics">
            {userDiagnostics.warnings.map((warning) => warning.reasonCode).join(",") ||
              "none"}
          </output>
        </>
      );
    }

    render(
      <AgentProvider transport={transport}>
        <Probe />
      </AgentProvider>,
    );

    await user.click(
      await screen.findByRole("button", { name: "Resume malformed canonical thread" }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText("developer resume diagnostics")).toHaveTextContent(
        "resume_response_normalization_failed",
      ),
    );
    const developerDiagnostics = screen.getByLabelText(
      "developer resume diagnostics",
    );
    expect(developerDiagnostics).toHaveTextContent(
      "thread-requested-normalization-failed",
    );
    expect(developerDiagnostics).toHaveTextContent(
      "thread-canonical-normalization-failed",
    );
    expect(developerDiagnostics).not.toHaveTextContent("Raw thread name should not leak");
    expect(developerDiagnostics).not.toHaveTextContent("normalizer secret should not leak");
    expect(developerDiagnostics).not.toHaveTextContent('"raw":');
    expect(screen.getByLabelText("audit resume diagnostics")).toHaveTextContent(
      "resume_response_normalization_failed",
    );
    expect(screen.getByLabelText("user resume diagnostics")).toHaveTextContent(
      "none",
    );
    expect(screen.getByLabelText("resume result")).toHaveTextContent(
      "normalizer secret should not leak",
    );
  });
});
