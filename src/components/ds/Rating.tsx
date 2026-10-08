import { Icon } from "./Icon";

export interface RatingProps {
  value: number;
  count?: number;
  compact?: boolean;
}

export function Rating({ value, count, compact }: RatingProps) {
  if (compact) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, font: "var(--type-data)", color: "var(--text-strong)" }}>
        <Icon name="star" size={14} color="var(--rating-star)" />
        {value.toFixed(1)}
        {count != null && <span style={{ color: "var(--text-muted)" }}>({count})</span>}
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-flex", gap: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Icon key={i} name="star" size={15} color={i <= Math.round(value) ? "var(--rating-star)" : "var(--travertine-300)"} />
        ))}
      </span>
      <span style={{ font: "var(--type-data)", color: "var(--text-strong)" }}>{value.toFixed(1)}</span>
      {count != null && <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>{count} reviews</span>}
    </span>
  );
}
