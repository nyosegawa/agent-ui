import type React from "react";
import { useEffect, useRef } from "react";
import { useAgentModels, useAgentRunSettings } from "../hooks";
import { useAgentI18n, type AgentI18nKey } from "../i18n";
import {
  IconCheck,
  IconCpu,
  IconGauge,
  IconShield,
} from "../components-internal";
import { useAgentContext } from "../provider";
import { AuiMenu } from "./disclosure";
import { useCompactLayout, useElementCompactLayout } from "./shared";

export { AgentStarterCwd, type AgentWorkingDirectoryResolver } from "./starter-cwd";

export interface AgentRunControlsProps {
  autoRefresh?: boolean;
  variant?: "compact" | "panel";
}

export function AgentRunControls({
  autoRefresh = true,
  variant = "panel",
}: AgentRunControlsProps = {}) {
  const { t } = useAgentI18n();
  const { state } = useAgentContext();
  const { models, refreshModels } = useAgentModels();
  const {
    policies,
    runSettings,
    selectedModel,
    selectedPolicy,
    setEffort,
    setModelId,
    setPolicyId,
    supportedEfforts,
  } = useAgentRunSettings();
  const hasEffortOptions = supportedEfforts.length > 0;

  useEffect(() => {
    if (autoRefresh && state.connection.status === "connected" && models.length === 0) {
      void refreshModels().catch(() => undefined);
    }
  }, [autoRefresh, models.length, refreshModels, state.connection.status]);

  return (
    <section
      className={variant === "compact" ? "aui-run-controls-compact" : "aui-run-controls"}
      aria-label={t("aria.runControls")}
    >
      <fieldset className="aui-policy-group">
        <legend>{t("run.policy")}</legend>
        <div
          aria-label={t("run.policy")}
          className="aui-segmented"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const currentIndex = policies.findIndex(
              (policy) => policy.id === selectedPolicy?.id,
            );
            const nextIndex =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? policies.length - 1
                  : (currentIndex +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      policies.length) %
                    policies.length;
            const next = policies[nextIndex];
            if (next) setPolicyId(next.id);
          }}
          role="radiogroup"
        >
          {policies.map((policy) => {
            const selected = selectedPolicy?.id === policy.id;
            return (
              <button
                aria-checked={selected}
                className="aui-segment"
                key={policy.id}
                onClick={() => setPolicyId(policy.id)}
                role="radio"
                tabIndex={selected ? 0 : -1}
                title={runPolicyDescription(policy, t)}
                type="button"
              >
                {runPolicyLabel(policy, t)}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="aui-field">
        <span>{t("run.model")}</span>
        <select
          aria-label={t("run.model")}
          className="aui-select"
          onChange={(event) => setModelId(event.currentTarget.value)}
          value={runSettings.modelId ?? ""}
        >
          <option value="">{t("common.serverDefault")}</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {formatModelOption(model)}
            </option>
          ))}
        </select>
      </label>
      <label className="aui-field">
        <span>{t("run.effort")}</span>
        <select
          aria-label={t("run.effort")}
          className="aui-select"
          disabled={!hasEffortOptions}
          onChange={(event) => setEffort(event.currentTarget.value)}
          value={runSettings.effort ?? ""}
        >
          <option value="">
            {selectedModel && hasEffortOptions
              ? t("run.modelDefault")
              : t("common.serverDefault")}
          </option>
          {supportedEfforts.map((effort) => (
            <option key={effort} value={effort}>
              {effort}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function formatModelOption(model: { id: string; name?: string }): string {
  if (!model.name || model.name === model.id) return model.id;
  return `${model.name} (${model.id})`;
}

function MenuSection({ children, label }: { children: React.ReactNode; label: string }) {
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
        {description ? <span className="aui-menu-item-desc">{description}</span> : null}
      </span>
      <span className="aui-menu-item-check" aria-hidden="true">
        {selected ? <IconCheck size={14} /> : null}
      </span>
    </button>
  );
}

function effortOptionLabel(effort: string, t: (key: AgentI18nKey) => string): string {
  switch (effort) {
    case "minimal":
      return t("run.effort.minimal");
    case "low":
      return t("run.effort.low");
    case "medium":
      return t("run.effort.medium");
    case "high":
      return t("run.effort.high");
    case "xhigh":
      return t("run.effort.veryHigh");
    default:
      return effort.charAt(0).toUpperCase() + effort.slice(1);
  }
}

function composerModelLabel(
  selectedModel: { id: string; name?: string } | undefined,
  modelId: string | undefined,
  t: (key: AgentI18nKey) => string,
): string {
  if (!modelId && !selectedModel) return t("run.defaultModel");
  return selectedModel?.name ?? selectedModel?.id ?? modelId ?? t("run.model");
}

function composerEffortLabel(
  effort: string | undefined,
  hasEfforts: boolean,
  t: (key: AgentI18nKey) => string,
): string {
  if (effort) return effortOptionLabel(effort, t);
  return hasEfforts ? t("run.defaultEffort") : t("run.defaultEffort");
}

function runPolicyLabel(
  policy: { id: string; label: string },
  t: (key: AgentI18nKey) => string,
): string {
  if (isDefaultPolicyId(policy.id)) {
    return t(`run.policy.${policy.id}.label` as AgentI18nKey);
  }
  return policy.label;
}

function runPolicyDescription(
  policy: { description: string; id: string },
  t: (key: AgentI18nKey) => string,
): string {
  if (isDefaultPolicyId(policy.id)) {
    return t(`run.policy.${policy.id}.description` as AgentI18nKey);
  }
  return policy.description;
}

function isDefaultPolicyId(id: string): boolean {
  return id === "review" || id === "auto" || id === "read-only" || id === "full-access";
}

/**
 * Policy / model / effort selectors that live directly inside the composer
 * toolbar. Working directory is intentionally absent here; cwd is a
 * thread-start setting and is shown read-only in the thread header for an
 * existing thread.
 */
export function ComposerRunControls() {
  const { t } = useAgentI18n();
  const viewportCompact = useCompactLayout();
  const [settingsRef, compact] = useElementCompactLayout<HTMLDivElement>(
    520,
    viewportCompact,
  );
  const { state } = useAgentContext();
  const { models, refreshModels } = useAgentModels();
  const {
    policies,
    runSettings,
    selectedModel,
    selectedPolicy,
    setEffort,
    setModelId,
    setPolicyId,
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

  const hasEfforts = supportedEfforts.length > 0;

  return (
    <div className="aui-composer-settings" ref={settingsRef}>
      <AuiMenu
        ariaLabel={t("run.policy")}
        compact={compact}
        icon={<IconShield size={14} />}
        label={selectedPolicy ? runPolicyLabel(selectedPolicy, t) : t("run.policy")}
      >
        {(close) =>
          policies.map((policy) => (
            <MenuOption
              description={runPolicyDescription(policy, t)}
              icon={<IconShield size={14} />}
              key={policy.id}
              label={runPolicyLabel(policy, t)}
              onSelect={() => {
                setPolicyId(policy.id);
                close();
              }}
              selected={selectedPolicy?.id === policy.id}
            />
          ))
        }
      </AuiMenu>
      <AuiMenu
        ariaLabel={t("run.modelAndEffort")}
        compact={compact}
        icon={<IconGauge size={14} />}
        label={`${composerModelLabel(selectedModel, runSettings.modelId, t)} · ${composerEffortLabel(
          runSettings.effort,
          hasEfforts,
          t,
        )}`}
      >
        {(close) => (
          <>
            <MenuSection label={t("run.model")}>
              <MenuOption
                icon={<IconCpu size={14} />}
                label={t("common.serverDefault")}
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
            <MenuSection label={t("run.effort")}>
              {hasEfforts ? (
                <>
                  <MenuOption
                    icon={<IconGauge size={14} />}
                    label={
                      selectedModel ? t("run.modelDefault") : t("common.serverDefault")
                    }
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
                      label={effortOptionLabel(effort, t)}
                      onSelect={() => {
                        setEffort(effort);
                        close();
                      }}
                      selected={runSettings.effort === effort}
                    />
                  ))}
                </>
              ) : (
                <p className="aui-menu-empty">{t("run.noSelectableEffort")}</p>
              )}
            </MenuSection>
          </>
        )}
      </AuiMenu>
    </div>
  );
}
