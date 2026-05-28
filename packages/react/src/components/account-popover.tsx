import { useEffect, useRef, useState } from "react";
import { useAgentAccount } from "../hooks";
import { useAgentI18n } from "../i18n";
import {
  IconChevronDown,
  IconClose,
  IconUser,
  buttonClass,
} from "../components-internal";
import { AgentUsagePanel } from "./usage-panels";

export function AgentAccountControl({
  account,
  statusText,
}: {
  account: Record<string, unknown> | undefined;
  statusText: string;
}) {
  const { t } = useAgentI18n();
  const { logout } = useAgentAccount();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const label = accountLabelText(account) ?? t("account.authenticated");
  const email = accountValue(account, "email");
  const planType = accountValue(account, "planType");
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => dialogRef.current?.focus());
  }, [open]);
  return (
    <div className="aui-account-control">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("account.openMenu")}
        className="aui-account-trigger"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        title={label}
        type="button"
      >
        <span className="aui-account-avatar" aria-hidden="true">
          <IconUser size={14} />
        </span>
        {planType ? <span className="aui-account-plan">{planType}</span> : null}
        <IconChevronDown size={14} />
      </button>
      {open ? (
        <>
          <button
            aria-label={t("common.close")}
            className="aui-account-backdrop"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div
            aria-label={t("account.details")}
            aria-modal="true"
            className="aui-account-popover"
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="aui-account-popover-header">
              <div>
                <strong>{t("account.details")}</strong>
                <span>{statusText}</span>
              </div>
              <button
                aria-label={t("common.close")}
                className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                type="button"
              >
                <IconClose size={14} />
              </button>
            </div>
            <dl className="aui-account-meta">
              {email ? (
                <div>
                  <dt>{t("account.email")}</dt>
                  <dd>{email}</dd>
                </div>
              ) : null}
              {planType ? (
                <div>
                  <dt>{t("account.plan")}</dt>
                  <dd>{planType}</dd>
                </div>
              ) : null}
              <div>
                <dt>{t("account.status")}</dt>
                <dd>{statusText}</dd>
              </div>
            </dl>
            <AgentUsagePanel />
            <div className="aui-account-actions">
              <button
                className={buttonClass("secondary", { size: "sm" })}
                onClick={() => {
                  void logout().finally(() => setOpen(false));
                }}
                type="button"
              >
                {t("account.logout")}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function accountLabelText(account: Record<string, unknown> | undefined): string | undefined {
  if (!account) return undefined;
  const email = accountValue(account, "email");
  const planType = accountValue(account, "planType");
  if (email && planType) return `${email} (${planType})`;
  return email ?? planType;
}

function accountValue(
  account: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = account?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
