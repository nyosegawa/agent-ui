import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevronDown, IconClose, buttonClass } from "../components-internal";

export interface AuiMenuProps {
  ariaLabel: string;
  children: (close: () => void) => React.ReactNode;
  compact: boolean;
  icon?: React.ReactNode;
  label: string;
}

interface MenuAnchor {
  left: number;
  top: number;
}

export function AuiMenu({ ariaLabel, children, compact, icon, label }: AuiMenuProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => {
    setOpen((current) => {
      if (current) return false;
      const rect = triggerRef.current?.getBoundingClientRect();
      setAnchor(rect ? { left: rect.left, top: rect.top } : null);
      return true;
    });
  }, []);

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

  const panelStyle: React.CSSProperties | undefined =
    compact || !anchor
      ? undefined
      : {
          bottom: `${Math.max(
            8,
            (typeof window === "undefined" ? 0 : window.innerHeight) -
              anchor.top +
              8,
          )}px`,
          left: `${Math.max(
            8,
            Math.min(
              anchor.left,
              (typeof window === "undefined" ? 360 : window.innerWidth) - 296,
            ),
          )}px`,
        };

  return (
    <div className="aui-menu" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className="aui-composer-tool"
        data-active={open ? "true" : undefined}
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
            onKeyDown={onPanelKeyDown}
            ref={panelRef}
            role="menu"
            style={panelStyle}
          >
            <header className="aui-menu-panel-header">
              <strong>{ariaLabel}</strong>
              <button
                aria-label="Close menu"
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
