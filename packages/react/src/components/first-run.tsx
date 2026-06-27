import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useAgentAccount } from "../hooks";
import { useAgentI18n } from "../i18n";
import { buttonClass } from "../components-internal";
import { useAgentContext } from "../provider";
import {
  AgentStarterCwd,
  ComposerRunControls,
  type AgentWorkingDirectoryResolver,
} from "./run-settings";
import { AgentComposerInput, AgentComposerToolbar } from "./composer";
import { AgentComposerSubmitButton } from "./composer-submit-button";
import { shouldSubmitOnComposerEnter } from "./composer-submit-semantics";
import { deferAction } from "./shared";

export function AgentFirstRun({
  fixedWorkingDirectory,
  onRequestWorkingDirectory,
  onStartThread,
}: {
  fixedWorkingDirectory?: string | null;
  onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
  onStartThread: (prompt?: string) => Promise<void> | void;
}) {
  const { t } = useAgentI18n();
  const { account, cancelLogin, login } = useAgentAccount();
  const { state } = useAgentContext();
  if (state.connection.status === "error" || state.connection.status === "closed") {
    return (
      <div className="aui-first-run">
        <strong>{t("firstRun.bridgeError.title")}</strong>
        <p>{t("firstRun.bridgeError.body")}</p>
      </div>
    );
  }
  if (state.connection.status === "connecting" || account.status === "unknown") {
    return (
      <div className="aui-first-run">
        <strong>{t("firstRun.preparing.title")}</strong>
        <p>{t("firstRun.preparing.body")}</p>
        <button className={buttonClass("secondary")} disabled type="button">
          {t("firstRun.preparing.cta")}
        </button>
      </div>
    );
  }
  if (account.status === "unauthenticated") {
    return (
      <div className="aui-first-run">
        <strong>{t("firstRun.connect.title")}</strong>
        <p>{t("firstRun.connect.body")}</p>
        <button
          className={buttonClass("primary")}
          onClick={() => deferAction(login)}
          type="button"
        >
          {t("firstRun.connect.cta")}
        </button>
      </div>
    );
  }
  if (account.status === "authenticating") {
    return (
      <div className="aui-first-run">
        <strong>{t("firstRun.authenticating.title")}</strong>
        <p>{t("firstRun.authenticating.body")}</p>
        <button
          className={buttonClass("secondary")}
          disabled={!account.login?.loginId}
          onClick={() => deferAction(cancelLogin)}
          type="button"
        >
          {t("account.cancelLogin")}
        </button>
      </div>
    );
  }
  return (
    <AgentStartComposer
      fixedWorkingDirectory={fixedWorkingDirectory}
      onRequestWorkingDirectory={onRequestWorkingDirectory}
      onStartThread={onStartThread}
    />
  );
}

export interface AgentStartComposerProps {
  fixedWorkingDirectory?: string | null;
  onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
  onStartThread: (prompt?: string) => Promise<void> | void;
}

export function AgentStartComposer({
  fixedWorkingDirectory,
  onRequestWorkingDirectory,
  onStartThread,
}: AgentStartComposerProps) {
  const { t } = useAgentI18n();
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

  return (
    <form
      aria-label={t("firstRun.form")}
      className="aui-first-run aui-first-run-starter"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <strong className="aui-visually-hidden">{t("firstRun.form")}</strong>
      <div className="aui-starter-card">
        {error ? (
          <p className="aui-starter-error" role="alert">
            {t("firstRun.error", { message: error })}
          </p>
        ) : null}
        <AgentComposerInput
          aria-label={t("aria.message")}
          className="aui-first-run-prompt"
          onChange={(event) => setPrompt(event.currentTarget.value)}
          onCompositionEnd={() => {
            isComposing.current = false;
          }}
          onCompositionStart={() => {
            isComposing.current = true;
          }}
          onKeyDown={(event) => {
            if (
              shouldSubmitOnComposerEnter({
                isComposing: isComposing.current,
                key: event.key,
                shiftKey: event.shiftKey,
              })
            ) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={t("firstRun.placeholder")}
          rows={2}
          value={prompt}
        />
        <AgentComposerToolbar
          className="aui-first-run-toolbar"
          start={<ComposerRunControls />}
          end={
            <AgentComposerSubmitButton
              canSubmit={!isSubmitting && Boolean(prompt.trim())}
              className="aui-first-run-submit"
              isStopAction={false}
              label={t("firstRun.startThread")}
              title={t("firstRun.startThread")}
            />
          }
        />
      </div>
      <AgentStarterCwd
        fixedWorkingDirectory={fixedWorkingDirectory}
        onRequestWorkingDirectory={onRequestWorkingDirectory}
      />
    </form>
  );
}
