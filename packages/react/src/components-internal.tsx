import type React from "react";

// --- Icon set ---------------------------------------------------------------
// Inline SVG icons keep the React package zero-dep. Each icon respects
// currentColor so button/text variants can recolor them via CSS.

function Icon({
  children,
  size = 16,
  strokeWidth = 1.75,
  title,
}: {
  children: React.ReactNode;
  size?: number;
  strokeWidth?: number;
  title?: string;
}) {
  return (
    <svg
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
      fill="none"
      focusable="false"
      height={size}
      role={title ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

export const IconPaperclip = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 01-7.78-7.78l9.2-9.19a3.67 3.67 0 015.19 5.19l-9.2 9.19a1.83 1.83 0 11-2.6-2.6l8.49-8.48" />
  </Icon>
);

export const IconImage = (props: { size?: number }) => (
  <Icon size={props.size}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M3.5 17.5l4.5-4.5 4 4 3-3 5.5 5.5" />
  </Icon>
);

export const IconApp = (props: { size?: number }) => (
  <Icon size={props.size}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Icon>
);

export const IconPlugin = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M9 2v4M15 2v4M7 6h10v6a5 5 0 01-10 0V6zM12 17v5" />
  </Icon>
);

export const IconSend = (props: { size?: number }) => (
  <Icon size={props.size} strokeWidth={2}>
    <path d="M5 12l14-8-4 18-3-7-7-3z" />
  </Icon>
);

export const IconStop = (props: { size?: number }) => (
  <Icon size={props.size} strokeWidth={0}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
  </Icon>
);

export const IconFolder = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </Icon>
);

export const IconSearch = (props: { size?: number }) => (
  <Icon size={props.size}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </Icon>
);

export const IconShield = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M12 3l8 3v6c0 4.4-3.4 8-8 9-4.6-1-8-4.6-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

export const IconClose = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M6 6l12 12M6 18L18 6" />
  </Icon>
);

export const IconCheck = (props: { size?: number }) => (
  <Icon size={props.size} strokeWidth={2.2}>
    <path d="M5 13l4 4L19 7" />
  </Icon>
);

export const IconBlock = (props: { size?: number }) => (
  <Icon size={props.size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 5.6l12.8 12.8" />
  </Icon>
);

export const IconSpark = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </Icon>
);

export const IconChevronDown = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const IconHistory = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M3 12a9 9 0 109-9 9.3 9.3 0 00-7 3M3 3v5h5M12 7v5l3 2" />
  </Icon>
);

export const IconAdd = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const IconMoreVertical = (props: { size?: number }) => (
  <Icon size={props.size} strokeWidth={2.4}>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </Icon>
);

export const IconRefresh = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5" />
  </Icon>
);

export const IconCpu = (props: { size?: number }) => (
  <Icon size={props.size}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
  </Icon>
);

export const IconGauge = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M12 13l4-4M4 18a9 9 0 1116 0" />
    <circle cx="12" cy="13" r="1.4" fill="currentColor" stroke="none" />
  </Icon>
);

export const IconAlert = (props: { size?: number }) => (
  <Icon size={props.size}>
    <path d="M12 9v4M12 17h.01M10.3 3.9L2.4 17.5A1.9 1.9 0 004 20.4h16a1.9 1.9 0 001.6-2.9L13.7 3.9a1.9 1.9 0 00-3.4 0z" />
  </Icon>
);

// --- Button helper ----------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg";

export function buttonClass(
  variant: ButtonVariant = "secondary",
  options: { className?: string; iconOnly?: boolean; size?: ButtonSize } = {},
): string {
  const parts = ["aui-btn", `aui-btn-${variant}`];
  if (options.size && options.size !== "md") parts.push(`aui-btn-${options.size}`);
  if (options.iconOnly) parts.push("aui-btn-icon-only");
  if (options.className) parts.push(options.className);
  return parts.join(" ");
}
