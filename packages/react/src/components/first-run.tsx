import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useAgentAuth } from "../hooks";
import { IconSend, buttonClass } from "../components-internal";
import { useAgentContext } from "../provider";
import { AgentStarterCwd, ComposerRunSettings } from "./run-settings";
import { deferAction } from "./shared";

export function AgentFirstRun({
  onStartThread,
}: {
  onStartThread: (prompt?: string) => Promise<void> | void;
}) {
  const { account, cancelLogin, login } = useAgentAuth();
  const { state } = useAgentContext();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isComposing = useRef(false);
  const submit = useCallback(() => {
    const input = prompt.trim();
    if (!input) return;
    setError(undefined);
    setIsSubmitting(true);
    deferAction(async () => {
      try {
        await onStartThread(input || undefined);
        setPrompt("");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught));
      } finally {
        setIsSubmitting(false);
      }
    });
  }, [onStartThread, prompt]);

  if (state.connection.status === "error" || state.connection.status === "closed") {
    return (
      <div className="aui-first-run">
        <strong>Codex bridge unavailable</strong>
        <p>
          Check diagnostics, restart the local bridge, then reconnect before starting a
          thread.
        </p>
      </div>
    );
  }
  if (state.connection.status === "connecting" || account.status === "unknown") {
    return (
      <div className="aui-first-run">
        <strong>Preparing Codex</strong>
        <p>Connecting to the local bridge and checking account state.</p>
        <button className={buttonClass("secondary")} disabled type="button">
          Syncing
        </button>
      </div>
    );
  }
  if (account.status === "unauthenticated") {
    return (
      <div className="aui-first-run">
        <strong>Connect Codex</strong>
        <p>Sign in with ChatGPT device code before starting a real local thread.</p>
        <button
          className={buttonClass("primary")}
          onClick={() => deferAction(login)}
          type="button"
        >
          Start device-code login
        </button>
      </div>
    );
  }
  if (account.status === "authenticating") {
    return (
      <div className="aui-first-run">
        <strong>Complete Codex login</strong>
        <p>Open the device login link and enter the code shown in the status bar.</p>
        <button
          className={buttonClass("secondary")}
          disabled={!account.login?.loginId}
          onClick={() => deferAction(cancelLogin)}
          type="button"
        >
          Cancel login
        </button>
      </div>
    );
  }
  return (
    <form
      aria-label="Start a Codex thread"
      className="aui-first-run aui-first-run-starter"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <strong className="aui-visually-hidden">Start a Codex thread</strong>
      <div className="aui-starter-card">
        {error ? (
          <p className="aui-starter-error" role="alert">
            Could not start thread: {error}
          </p>
        ) : null}
        <textarea
          aria-label="Message"
          className="aui-first-run-prompt"
          onChange={(event) => setPrompt(event.currentTarget.value)}
          onCompositionEnd={() => {
            isComposing.current = false;
          }}
          onCompositionStart={() => {
            isComposing.current = true;
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !isComposing.current) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Ask Codex what to work on"
          rows={3}
          value={prompt}
        />
        <div className="aui-first-run-toolbar">
          <ComposerRunSettings />
          <button
            aria-label="Start thread"
            className={buttonClass("primary", {
              className: "aui-first-run-submit",
              iconOnly: true,
              size: "lg",
            })}
            disabled={isSubmitting || !prompt.trim()}
            type="submit"
          >
            <IconSend size={18} />
          </button>
        </div>
      </div>
      <AgentStarterCwd />
    </form>
  );
}
