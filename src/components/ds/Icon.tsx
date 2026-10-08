import type { CSSProperties, HTMLAttributes } from "react";

export interface IconProps extends HTMLAttributes<HTMLElement> {
  name: string;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color = "currentColor", style, ...rest }: IconProps) {
  const combinedStyle: CSSProperties = {
    fontSize: size,
    lineHeight: 1,
    color,
    display: "inline-flex",
    width: size,
    height: size,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...style,
  };
  return <i className={"icon-" + name} aria-hidden="true" style={combinedStyle} {...rest} />;
}
