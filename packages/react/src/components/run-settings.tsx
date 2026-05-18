import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import { useAgentModels, useAgentRunSettings } from "../hooks";
import {
  IconCheck,
  IconClose,
  IconCpu,
  IconFolder,
  IconGauge,
  IconShield,
  buttonClass,
} from "../components-internal";
import { useAgentContext } from "../provider";
import { AuiMenu } from "./disclosure";
import { isUserFacingPath } from "./sidebar";
import { useCompactLayout } from "./shared";

export interface AgentRunControlsProps {
  autoRefresh?: boolean;
  /**
   * "compact" renders an inline, dense form intended to sit inside another
   * surface. "panel" renders the full-width labeled settings form used by the
   * empty-state and fixture gallery close-up.
   */
  variant?: "compact" | "panel";
}

export function AgentRunControls({
  autoRefresh = true,
  variant = "panel",
}: AgentRunControlsProps = {}) {
  const { state } = useAgentContext();
  const { models, refreshModels } = useAgentModels();
  const {
    executionModes,
    runSettings,
    selectedModel,
    setCwd,
    setEffort,
    setExecutionMode,
    setModelId,
    supportedEfforts,
  } = useAgentRunSettings();
  const hasEffortOptions = supportedEfforts.length > 0;
  const cwdOptions = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(state.threads)
            .map((thread) => thread.thread.path)
            .filter((path): path is string => Boolean(path && isUserFacingPath(path))),
        ),
      ).slice(0, 12),
    [state.threads],
  );

  useEffect(() => {
    if (autoRefresh && state.connection.status === "connected" && models.length === 0) {
      void refreshModels().catch(() => undefined);
    }
  }, [autoRefresh, models.length, refreshModels, state.connection.status]);

  return (
    <section
      className={variant === "compact" ? "aui-run-controls-compact" : "aui-run-controls"}
      aria-label="Run settings"
    >
      <fieldset className="aui-mode-group">
        <legend>Execution mode</legend>
        <div
          aria-label="Execution mode"
          className="aui-segmented"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const currentIndex = executionModes.findIndex(
              (mode) => mode.id === runSettings.executionMode,
            );
            const nextIndex =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? executionModes.length - 1
                  : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + executionModes.length) %
                    executionModes.length;
            const next = executionModes[nextIndex];
            if (next) setExecutionMode(next.id);
          }}
          role="radiogroup"
        >
          {executionModes.map((mode) => {
            const selected = runSettings.executionMode === mode.id;
            return (
              <button
                aria-checked={selected}
                className="aui-segment"
                key={mode.id}
                onClick={() => setExecutionMode(mode.id)}
                role="radio"
                tabIndex={selected ? 0 : -1}
                title={mode.description}
                type="button"
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="aui-field">
        <span>Model</span>
        <select
          aria-label="Model"
          className="aui-select"
          onChange={(event) => setModelId(event.currentTarget.value)}
          value={runSettings.modelId ?? ""}
        >
          <option value="">Server default</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {formatModelOption(model)}
            </option>
          ))}
        </select>
      </label>
      <label className="aui-field">
        <span>Effort</span>
        <select
          aria-label="Effort"
          className="aui-select"
          disabled={!hasEffortOptions}
          onChange={(event) => setEffort(event.currentTarget.value)}
          value={runSettings.effort ?? ""}
        >
          <option value="">
            {selectedModel && hasEffortOptions ? "Model default" : "Server default"}
          </option>
          {supportedEfforts.map((effort) => (
            <option key={effort} value={effort}>
              {effort}
            </option>
          ))}
        </select>
      </label>
      <label className="aui-field aui-field-wide">
        <span>Working directory</span>
        <div className="aui-input-shell aui-input-with-icon">
          <IconFolder size={14} />
          <input
            aria-label="Working directory"
            className="aui-text-input"
            list={cwdOptions.length > 0 ? "aui-cwd-options" : undefined}
            onChange={(event) => setCwd(event.currentTarget.value)}
            placeholder={cwdOptions[0] ?? "Server default cwd"}
            type="text"
            value={runSettings.cwd ?? ""}
          />
          {runSettings.cwd ? (
            <button
              aria-label="Clear working directory"
              className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
              onClick={() => setCwd("")}
              title="Clear working directory"
              type="button"
            >
              <IconClose size={14} />
            </button>
          ) : null}
          {cwdOptions.length > 0 ? (
            <datalist id="aui-cwd-options">
              {cwdOptions.map((cwd) => (
                <option key={cwd} value={cwd} />
              ))}
            </datalist>
          ) : null}
        </div>
      </label>
    </section>
  );
}

export interface AgentRunSettingsPanelProps {
  autoRefresh?: boolean;
}

export function AgentRunSettingsPanel({
  autoRefresh = false,
}: AgentRunSettingsPanelProps = {}) {
  return <AgentRunControls autoRefresh={autoRefresh} variant="compact" />;
}

function formatModelOption(model: { id: string; name?: string }): string {
  if (!model.name || model.name === model.id) return model.id;
  return `${model.name} (${model.id})`;
}

function MenuSection({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div aria-label={label} className="aui-menu-section" role="group">
      <span className="aui-menu-section-label">{label}</span>
      {children}
    </div>
  );
}

function MenuOption({
  description,
  icon,
  label,
  onSelect,
  selected,
}: {
  description?: string;
  icon?: React.ReactNode;
  label: string;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <button
      aria-checked={selected}
      className="aui-menu-item"
      data-selected={selected ? "true" : undefined}
      onClick={onSelect}
      role="menuitemradio"
      type="button"
    >
      {icon ? (
        <span className="aui-menu-item-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="aui-menu-item-body">
        <span className="aui-menu-item-label">{label}</span>
        {description ? (
          <span className="aui-menu-item-desc">{description}</span>
        ) : null}
      </span>
      <span className="aui-menu-item-check" aria-hidden="true">
        {selected ? <IconCheck size={14} /> : null}
      </span>
    </button>
  );
}

function effortOptionLabel(effort: string): string {
  switch (effort) {
    case "minimal":
      return "Minimal";
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "xhigh":
      return "Very high";
    default:
      return effort.charAt(0).toUpperCase() + effort.slice(1);
  }
}

function composerModelLabel(
  selectedModel: { id: string; name?: string } | undefined,
  modelId: string | undefined,
): string {
  if (!modelId && !selectedModel) return "Default model";
  return selectedModel?.name ?? selectedModel?.id ?? modelId ?? "Model";
}

function composerEffortLabel(
  effort: string | undefined,
  hasEfforts: boolean,
): string {
  if (effort) return effortOptionLabel(effort);
  return hasEfforts ? "Auto effort" : "Default effort";
}

/**
 * Mode / model / effort selectors that live directly inside the composer
 * toolbar. Working directory is intentionally absent here; cwd is a
 * thread-start setting and is shown read-only in the thread header for an
 * existing thread.
 */
export function ComposerRunSettings() {
  const compact = useCompactLayout();
  const { state } = useAgentContext();
  const { models, refreshModels } = useAgentModels();
  const {
    executionModes,
    runSettings,
    selectedModel,
    setEffort,
    setExecutionMode,
    setModelId,
    supportedEfforts,
  } = useAgentRunSettings();
  const didRefresh = useRef(false);

  useEffect(() => {
    if (
      !didRefresh.current &&
      state.connection.status === "connected" &&
      models.length === 0
    ) {
      didRefresh.current = true;
      void refreshModels().catch(() => undefined);
    }
  }, [models.length, refreshModels, state.connection.status]);

  const currentMode =
    executionModes.find((mode) => mode.id === runSettings.executionMode) ??
    executionModes[0];
  const hasEfforts = supportedEfforts.length > 0;

  return (
    <div className="aui-composer-settings">
      <AuiMenu
        ariaLabel="Execution mode"
        compact={compact}
        icon={<IconShield size={14} />}
        label={currentMode?.label ?? "Mode"}
      >
        {(close) =>
          executionModes.map((mode) => (
            <MenuOption
              description={mode.description}
              icon={<IconShield size={14} />}
              key={mode.id}
              label={mode.label}
              onSelect={() => {
                setExecutionMode(mode.id);
                close();
              }}
              selected={currentMode?.id === mode.id}
            />
          ))
        }
      </AuiMenu>
      <AuiMenu
        ariaLabel="Model and effort"
        compact={compact}
        icon={<IconCpu size={14} />}
        label={`${composerModelLabel(selectedModel, runSettings.modelId)} · ${composerEffortLabel(
          runSettings.effort,
          hasEfforts,
        )}`}
      >
        {(close) => (
          <>
            <MenuSection label="Model">
              <MenuOption
                icon={<IconCpu size={14} />}
                label="Server default"
                onSelect={() => {
                  setModelId("");
                  close();
                }}
                selected={!runSettings.modelId}
              />
              {models.map((model) => (
                <MenuOption
                  icon={<IconCpu size={14} />}
                  key={model.id}
                  label={formatModelOption(model)}
                  onSelect={() => {
                    setModelId(model.id);
                    close();
                  }}
                  selected={runSettings.modelId === model.id}
                />
              ))}
            </MenuSection>
            <MenuSection label="Effort">
              {hasEfforts ? (
                <>
                  <MenuOption
                    icon={<IconGauge size={14} />}
                    label={selectedModel ? "Model default" : "Server default"}
                    onSelect={() => {
                      setEffort("");
                      close();
                    }}
                    selected={!runSettings.effort}
                  />
                  {supportedEfforts.map((effort) => (
                    <MenuOption
                      icon={<IconGauge size={14} />}
                      key={effort}
                      label={effortOptionLabel(effort)}
                      onSelect={() => {
                        setEffort(effort);
                        close();
                      }}
                      selected={runSettings.effort === effort}
                    />
                  ))}
                </>
              ) : (
                <p className="aui-menu-empty">
                  This model exposes no selectable effort.
                </p>
              )}
            </MenuSection>
          </>
        )}
      </AuiMenu>
    </div>
  );
}
