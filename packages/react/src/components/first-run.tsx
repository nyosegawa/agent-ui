import type React from "react";
import { useAgentAuth } from "../hooks";
import { IconSpark, buttonClass } from "../components-internal";
import { useAgentContext } from "../provider";
import { AgentRunControls } from "./run-settings";
import { deferAction } from "./shared";

export function AgentFirstRun({ onStartThread }: { onStartThread: () => void }) {
  const { account, cancelLogin, login } = useAgentAuth();
  const { state } = useAgentContext();
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
    <div className="aui-first-run">
      <strong>Start a Codex thread</strong>
      <p>Choose a model, effort, execution mode, and working directory, then start.</p>
      <AgentRunControls autoRefresh={false} variant="panel" />
      <button
        className={buttonClass("primary")}
        onClick={() => deferAction(onStartThread)}
        type="button"
      >
        <IconSpark size={14} />
        <span>Start thread</span>
      </button>
    </div>
  );
}
