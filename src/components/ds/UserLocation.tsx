export interface UserLocationProps {
  accuracy?: number;
  heading?: number;
}

export function UserLocation({ accuracy = 56, heading }: UserLocationProps) {
  return (
    <div style={{ position: "relative", width: accuracy, height: accuracy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(63,110,134,.16)", border: "1px solid rgba(63,110,134,.3)" }} />
      {heading != null && (
        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            borderBottom: "16px solid rgba(63,110,134,.45)",
            transform: "rotate(" + heading + "deg) translateY(-14px)",
          }}
        />
      )}
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--map-user)", border: "3px solid #fff", boxShadow: "var(--shadow-sm)", position: "relative" }} />
    </div>
  );
}
