import type { CSSProperties, MouseEventHandler } from "react";
import { Icon } from "./Icon";

export interface FilterChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  count?: number;
  style?: CSSProperties;
}

export function FilterChip({ label, icon, selected, onClick, count, style }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 36,
        padding: "0 14px",
        borderRadius: "var(--radius-pill)",
        border: "1px solid " + (selected ? "var(--espresso-800)" : "var(--border-default)"),
        background: selected ? "var(--espresso-800)" : "var(--surface-raised)",
        color: selected ? "var(--text-inverse)" : "var(--text-strong)",
        font: "600 14px/1 var(--font-sans)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: selected ? "none" : "var(--shadow-xs)",
        transition: "background var(--dur-fast)",
        flexShrink: 0,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={16} />}
      {label}
      {count != null && <span style={{ font: "var(--type-data)", fontSize: 12, opacity: 0.7 }}>{count}</span>}
    </button>
  );
}
