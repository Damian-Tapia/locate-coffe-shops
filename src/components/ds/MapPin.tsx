import type { CSSProperties, MouseEventHandler } from "react";
import { Icon } from "./Icon";
import type { ShopStatus } from "./StatusBadge";

export interface MapPinProps {
  active?: boolean;
  label?: string;
  status?: ShopStatus;
  onClick?: MouseEventHandler<HTMLDivElement>;
  style?: CSSProperties;
}

export function MapPin({ active, label, status = "open", onClick, style }: MapPinProps) {
  const closed = status === "closed";
  const bg = active ? "var(--map-pin-active)" : closed ? "var(--espresso-400)" : "var(--map-pin)";
  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        transform: active ? "scale(1.12)" : "none",
        transformOrigin: "bottom center",
        transition: "transform var(--dur-base) var(--ease-out)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: active ? 36 : 32,
          padding: label ? "0 12px 0 6px" : 0,
          width: label ? undefined : active ? 36 : 32,
          justifyContent: "center",
          borderRadius: "var(--radius-pill)",
          background: bg,
          color: "var(--marble)",
          border: "2px solid var(--marble)",
          boxShadow: "var(--shadow-md)",
          font: "700 13px/1 var(--font-sans)",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: label ? "rgba(253,250,244,.18)" : "transparent",
          }}
        >
          <Icon name="coffee" size={14} />
        </span>
        {label}
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "7px solid " + bg,
          marginTop: -1,
          filter: "drop-shadow(0 2px 1px rgba(46,30,22,.2))",
        }}
      />
    </div>
  );
}
