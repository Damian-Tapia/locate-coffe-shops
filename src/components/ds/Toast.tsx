import { Icon } from "./Icon";

export interface ToastProps {
  message: string;
  icon?: string;
  action?: string;
  onAction?: () => void;
}

export function Toast({ message, icon = "check", action, onAction }: ToastProps) {
  return (
    <div
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        minHeight: 48,
        padding: "10px 10px 10px 16px",
        borderRadius: "var(--radius-pill)",
        background: "var(--surface-inverse)",
        color: "var(--text-inverse)",
        boxShadow: "var(--shadow-lg)",
        font: "var(--type-body-sm)",
        fontWeight: 500,
      }}
    >
      <Icon name={icon} size={18} color="var(--ochre-300)" />
      <span>{message}</span>
      {action && (
        <button
          onClick={onAction}
          style={{
            border: 0,
            background: "transparent",
            color: "var(--ochre-300)",
            font: "700 14px/1 var(--font-sans)",
            padding: "8px 10px",
            cursor: "pointer",
            borderRadius: "var(--radius-pill)",
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
