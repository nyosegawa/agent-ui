import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevronDown, IconClose, buttonClass } from "../components-internal";
import { useAgentI18n } from "../i18n";

export interface AuiMenuProps {
  ariaLabel: string;
  children: (close: () => void) => React.ReactNode;
  className?: string;
  compact: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  label: string;
  triggerClassName?: string;
}

interface MenuAnchor {
  bottom: number;
  left: number;
  top: number;
}

export function AuiMenu({
  ariaLabel,
  children,
  className,
  compact,
  disabled = false,
  icon,
  label,
  triggerClassName = "aui-composer-tool",
}: AuiMenuProps) {
  const { t } = useAgentI18n();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen((current) => {
      if (current) return false;
      const rect = triggerRef.current?.getBoundingClientRect();
      setAnchor(rect ? { bottom: rect.bottom, left: rect.left, top: rect.top } : null);
      return true;
    });
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
        triggerRef.current?.focus();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    };
    const onReflow = () => close();
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current
      ?.querySelector<HTMLElement>('[role^="menuitem"]:not([disabled])')
      ?.focus();
  }, [open]);

  const onPanelKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        '[role^="menuitem"]:not([disabled])',
      ) ?? [],
    );
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length;
    items[nextIndex]?.focus();
  };

  const panelPlacement =
    compact || !anchor || typeof window === "undefined"
      ? null
      : menuPanelPlacement(anchor);
  const panelStyle: React.CSSProperties | undefined =
    compact || !panelPlacement
      ? undefined
      : {
          left: `${panelPlacement.left}px`,
          maxHeight: `${panelPlacement.maxHeight}px`,
          ...(panelPlacement.placement === "below"
            ? { top: `${panelPlacement.top}px` }
            : { bottom: `${panelPlacement.bottom}px` }),
        };

  return (
    <div className={["aui-menu", className].filter(Boolean).join(" ")} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={triggerClassName}
        data-active={open ? "true" : undefined}
        disabled={disabled}
        onClick={toggle}
        ref={triggerRef}
        type="button"
      >
        {icon ? (
          <span className="aui-composer-tool-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="aui-composer-tool-label">{label}</span>
        <IconChevronDown size={13} />
      </button>
      {open ? (
        <>
          <div
            className="aui-menu-backdrop"
            data-compact={compact ? "true" : undefined}
            onClick={close}
          />
          <div
            aria-label={ariaLabel}
            className="aui-menu-panel"
            data-compact={compact ? "true" : undefined}
            data-placement={panelPlacement?.placement}
            onKeyDown={onPanelKeyDown}
            ref={panelRef}
            role="menu"
            style={panelStyle}
          >
            <header className="aui-menu-panel-header">
              <strong>{ariaLabel}</strong>
              <button
                aria-label={t("common.closeMenu")}
                className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
                onClick={() => {
                  close();
                  triggerRef.current?.focus();
                }}
                type="button"
              >
                <IconClose size={14} />
              </button>
            </header>
            <div className="aui-menu-panel-body">{children(close)}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function menuPanelPlacement(anchor: MenuAnchor) {
  const margin = 8;
  const panelWidth = 272;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const spaceAbove = Math.max(0, anchor.top - margin);
  const spaceBelow = Math.max(0, viewportHeight - anchor.bottom - margin);
  const placement = spaceBelow >= spaceAbove ? "below" : "above";
  const availableHeight = placement === "below" ? spaceBelow : spaceAbove;
  return {
    bottom: Math.max(margin, viewportHeight - anchor.top + margin),
    left: Math.max(margin, Math.min(anchor.left, viewportWidth - panelWidth - margin)),
    maxHeight: Math.max(1, Math.min(432, availableHeight)),
    placement,
    top: Math.max(margin, anchor.bottom + margin),
  } as const;
}
