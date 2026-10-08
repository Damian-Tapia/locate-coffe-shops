import { useState, type CSSProperties, type MouseEventHandler } from "react";
import { Icon } from "./Icon";

type Variant = "floating" | "outline" | "plain";

export interface IconButtonProps {
  icon: string;
  variant?: Variant;
  size?: number;
  active?: boolean;
  label?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
}

export function IconButton({ icon, variant = "floating", size = 44, active, label, onClick, style }: IconButtonProps) {
  const [hover, setHover] = useState(false);
  const V = {
    floating: {
      bg: active ? "var(--accent)" : hover ? "var(--travertine-50)" : "var(--surface-raised)",
      fg: active ? "var(--text-on-accent)" : "var(--text-strong)",
      sh: "var(--shadow-md)",
      bd: "transparent",
    },
    outline: {
      bg: active ? "var(--accent-soft)" : hover ? "var(--travertine-100)" : "var(--surface-card)",
      fg: active ? "var(--accent)" : "var(--text-strong)",
      sh: "none",
      bd: "var(--border-default)",
    },
    plain: {
      bg: hover ? "var(--travertine-100)" : "transparent",
      fg: active ? "var(--accent)" : "var(--text-body)",
      sh: "none",
      bd: "transparent",
    },
  }[variant];

  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "1px solid " + V.bd,
        background: V.bg,
        color: V.fg,
        boxShadow: V.sh,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        transition: "background var(--dur-fast) var(--ease-out)",
        flexShrink: 0,
        ...style,
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.45)} />
    </button>
  );
}
