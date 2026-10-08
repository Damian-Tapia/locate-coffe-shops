import type { ReactNode } from "react";

export type ShopStatus = "open" | "closing" | "closed" | "info";

const LABEL: Record<ShopStatus, string> = {
  open: "Open",
  closing: "Closing soon",
  closed: "Closed",
  info: "New",
};

export interface StatusBadgeProps {
  status?: ShopStatus;
  children?: ReactNode;
  size?: "sm" | "md";
}

export function StatusBadge({ status = "open", children, size = "md" }: StatusBadgeProps) {
  const sm = size === "sm";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: sm ? 22 : 26,
        padding: sm ? "0 8px" : "0 10px",
        borderRadius: "var(--radius-pill)",
        background: "var(--status-" + status + "-soft)",
        color: "var(--status-" + status + ")",
        font: "700 " + (sm ? 12 : 13) + "px/1 var(--font-sans)",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor" }} />
      {children || LABEL[status]}
    </span>
  );
}
