import type { CSSProperties } from "react";

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: (string | SegmentedOption)[];
  value: string;
  onChange?: (value: string) => void;
  style?: CSSProperties;
}

export function SegmentedControl({ options, value, onChange, style }: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        padding: 3,
        gap: 2,
        borderRadius: "var(--radius-pill)",
        background: "var(--surface-sunken)",
        border: "1px solid var(--border-subtle)",
        ...style,
      }}
    >
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        const on = v === value;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={on}
            onClick={() => onChange && onChange(v)}
            style={{
              flex: 1,
              height: 34,
              padding: "0 14px",
              border: 0,
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
              background: on ? "var(--surface-raised)" : "transparent",
              boxShadow: on ? "var(--shadow-sm)" : "none",
              color: on ? "var(--text-strong)" : "var(--text-muted)",
              font: "600 14px/1 var(--font-sans)",
              transition: "background var(--dur-fast)",
              whiteSpace: "nowrap",
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
