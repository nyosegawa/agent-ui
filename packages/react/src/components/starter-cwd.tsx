import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { selectRunSettings } from "@nyosegawa/agent-ui-core";
import {
  IconCheck,
  IconChevronDown,
  IconFolder,
  IconFolderAdd,
} from "../components-internal";
import { useAgentI18n, type AgentI18nKey } from "../i18n";
import { useAgentContext } from "../provider";
import { isUserFacingPath } from "./sidebar";

export type AgentWorkingDirectoryResolver = () =>
  | Promise<string | null | undefined>
  | string
  | null
  | undefined;

/**
 * Compact working-directory selector for the start screen. cwd is a
 * thread-start setting, so it sits beneath the starter composer as a context
 * pill rather than inside the composer toolbar.
 */
export function AgentStarterCwd({
  fixedWorkingDirectory,
  onRequestWorkingDirectory,
}: {
  fixedWorkingDirectory?: string | null;
  onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
}) {
  const { t } = useAgentI18n();
  const { dispatch, state } = useAgentContext();
  const runSettings = selectRunSettings(state);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cwdOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            runSettings.cwd,
            ...Object.values(state.threads)
              .map((thread) => thread.thread.path)
              .filter((path): path is string => Boolean(path && isUserFacingPath(path))),
          ].filter((path): path is string => Boolean(path && isUserFacingPath(path))),
        ),
      ).slice(0, 12),
    [runSettings.cwd, state.threads],
  );
  const selectedCwd = runSettings.cwd || undefined;
  const fixedCwd =
    typeof fixedWorkingDirectory === "string" && fixedWorkingDirectory.trim()
      ? fixedWorkingDirectory.trim()
      : undefined;
  const triggerLabel = selectedCwd ? folderName(selectedCwd) : t("run.cwd.selectFolder");
  const setStarterCwd = useCallback(
    (cwd: string) =>
      dispatch({ cwd: cwd.trim() || undefined, type: "runSettings/updated" }),
    [dispatch],
  );
  const requestWorkingDirectory = useCallback(async () => {
    setOpen(false);
    const requested = onRequestWorkingDirectory
      ? await onRequestWorkingDirectory()
      : fallbackWorkingDirectoryPrompt(t, runSettings.cwd ?? cwdOptions[0]);
    const next = typeof requested === "string" ? requested.trim() : "";
    if (next) setStarterCwd(next);
  }, [cwdOptions, onRequestWorkingDirectory, runSettings.cwd, setStarterCwd, t]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (fixedCwd) {
    return (
      <div className="aui-starter-context" aria-label={t("aria.threadStartContext")}>
        <div className="aui-starter-cwd">
          <div
            aria-label={`${t("run.workingDirectory")}: ${fixedCwd}`}
            className="aui-starter-cwd-trigger"
            role="status"
          >
            <IconFolder size={15} />
            <span className="aui-starter-cwd-trigger-label">
              {folderName(fixedCwd)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aui-starter-context" aria-label={t("aria.threadStartContext")}>
      <div className="aui-starter-cwd" ref={rootRef}>
        <div className="aui-starter-cwd-picker">
          <button
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={t("run.workingDirectory")}
            className="aui-starter-cwd-trigger"
            onClick={() => setOpen((current) => !current)}
            title={selectedCwd ?? t("run.cwd.serverDefault")}
            type="button"
          >
            <IconFolder size={15} />
            <span className="aui-starter-cwd-trigger-label">{triggerLabel}</span>
            <IconChevronDown size={13} />
          </button>
          {open ? (
            <div className="aui-starter-cwd-menu" role="menu" aria-label={t("run.workingDirectory")}>
              <div className="aui-starter-cwd-section-label">{t("run.cwd.recent")}</div>
              {cwdOptions.length > 0 ? (
                cwdOptions.map((cwd) => {
                  const selected = cwd === selectedCwd;
                  return (
                    <button
                      aria-checked={selected}
                      className="aui-starter-cwd-item"
                      key={cwd}
                      onClick={() => {
                        setStarterCwd(cwd);
                        setOpen(false);
                      }}
                      role="menuitemradio"
                      title={cwd}
                      type="button"
                    >
                      <span>{folderName(cwd)}</span>
                      {selected ? <IconCheck size={15} /> : null}
                    </button>
                  );
                })
              ) : (
                <span className="aui-starter-cwd-empty">{t("run.cwd.noRecent")}</span>
              )}
              <div className="aui-starter-cwd-separator" />
              <button
                className="aui-starter-cwd-item aui-starter-cwd-open"
                onClick={() => void requestWorkingDirectory()}
                role="menuitem"
                type="button"
              >
                {t("run.cwd.openFolder")}
              </button>
            </div>
          ) : null}
        </div>
        <button
          aria-label={t("run.cwd.openFolderAction")}
          className="aui-starter-cwd-action"
          onClick={() => void requestWorkingDirectory()}
          title={t("run.cwd.openFolderAction")}
          type="button"
        >
          <IconFolderAdd size={16} />
        </button>
      </div>
    </div>
  );
}

function folderName(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  return normalized.split("/").pop() || normalized || path;
}

function fallbackWorkingDirectoryPrompt(
  t: (key: AgentI18nKey) => string,
  current?: string,
): string | null | undefined {
  if (typeof window === "undefined" || typeof window.prompt !== "function") return undefined;
  return window.prompt(t("run.cwd.prompt"), current ?? "");
}
