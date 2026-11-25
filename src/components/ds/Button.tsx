import { useState, type CSSProperties, type ReactNode, type MouseEventHandler } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "dark" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconRight?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
  type?: "button" | "submit" | "reset";
}

const SIZES: Record<Size, { h: string; px: number; fs: number }> = {
  sm: { h: "var(--control-sm)", px: 14, fs: 14 },
  md: { h: "var(--control-md)", px: 20, fs: 15 },
  lg: { h: "var(--control-lg)", px: 24, fs: 16 },
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  fullWidth,
  disabled,
  children,
  onClick,
  style,
  type = "button",
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const s = SIZES[size] || SIZES.md;
  const V = {
    primary: {
      bg: press ? "var(--accent-press)" : hover ? "var(--accent-hover)" : "var(--accent)",
      fg: "var(--text-on-accent)",
      bd: "transparent",
      sh: "var(--shadow-sm)",
    },
    secondary: {
      bg: press ? "var(--travertine-200)" : hover ? "var(--travertine-100)" : "var(--surface-card)",
      fg: "var(--text-strong)",
      bd: "var(--border-default)",
      sh: "var(--shadow-xs)",
    },
    dark: {
      bg: press ? "var(--espresso-900)" : hover ? "var(--espresso-700)" : "var(--espresso-800)",
      fg: "var(--text-inverse)",
      bd: "transparent",
      sh: "var(--shadow-sm)",
    },
    ghost: {
      bg: press ? "var(--travertine-200)" : hover ? "var(--travertine-100)" : "transparent",
      fg: "var(--accent)",
      bd: "transparent",
      sh: "none",
    },
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setHover(true); }}
      onPointerLeave={() => {
        setHover(false);
        setPress(false);
      }}
      onPointerDown={() => setPress(true)}
      onPointerUp={() => setPress(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: s.h,
        padding: "0 " + s.px + "px",
        width: fullWidth ? "100%" : undefined,
        borderRadius: "var(--radius-pill)",
        border: "1px solid " + V.bd,
        background: V.bg,
        color: V.fg,
        boxShadow: V.sh,
        font: "600 " + s.fs + "px/1 var(--font-sans)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transform: press && !disabled ? "scale(0.98)" : "none",
        transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
        whiteSpace: "nowrap",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={s.fs + 3} />}
      {children}
      {iconRight && <Icon name={iconRight} size={s.fs + 3} />}
    </button>
  );
}
