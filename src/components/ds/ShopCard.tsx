import { useState, type MouseEventHandler } from "react";
import { Icon } from "./Icon";
import { Rating } from "./Rating";
import { StatusBadge, type ShopStatus } from "./StatusBadge";

export interface ShopCardProps {
  name: string;
  neighborhood?: string;
  distance?: string;
  walk?: string;
  rating?: number;
  reviews?: number;
  status?: ShopStatus;
  statusText?: string;
  price?: string;
  image?: string;
  layout?: "row" | "column";
  selected?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function ShopCard({
  name,
  neighborhood,
  distance,
  walk,
  rating,
  reviews,
  status = "open",
  statusText,
  price,
  image,
  layout = "row",
  selected,
  onClick,
}: ShopCardProps) {
  const [hover, setHover] = useState(false);

  const photo = (
    <div
      style={{
        background: image ? "center/cover url(" + image + ")" : "var(--terracotta-100)",
        borderRadius: layout === "row" ? "var(--radius-md)" : "var(--radius-arch)",
        flexShrink: 0,
        width: layout === "row" ? 76 : "100%",
        height: layout === "row" ? 76 : 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--terracotta-500)",
      }}
    >
      {!image && <Icon name="coffee" size={26} />}
    </div>
  );

  const meta = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, font: "var(--type-data)", color: "var(--text-body)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Icon name="footprints" size={14} color="var(--text-muted)" />
        {distance}
        {walk && " · " + walk}
      </span>
      {rating != null && <Rating value={rating} count={reviews} compact />}
      {price && <span style={{ color: "var(--text-muted)" }}>{price}</span>}
    </div>
  );

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: layout === "row" ? "row" : "column",
        gap: layout === "row" ? 14 : 12,
        padding: layout === "row" ? 12 : 14,
        borderRadius: "var(--radius-lg)",
        cursor: onClick ? "pointer" : "default",
        background: "var(--surface-card)",
        border: "1px solid " + (selected ? "var(--accent)" : "var(--border-subtle)"),
        boxShadow: selected ? "0 0 0 1px var(--accent), var(--shadow-sm)" : hover ? "var(--shadow-md)" : "var(--shadow-xs)",
        transition: "box-shadow var(--dur-base) var(--ease-out)",
      }}
    >
      {photo}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: 1 }}>
        {neighborhood && (
          <div style={{ font: "var(--type-eyebrow)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase", color: "var(--text-muted)" }}>
            {neighborhood}
          </div>
        )}
        <div style={{ font: "400 21px/1.15 var(--font-display)", color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </div>
        {meta}
        <div>
          <StatusBadge status={status} size="sm">
            {statusText}
          </StatusBadge>
        </div>
      </div>
    </div>
  );
}
