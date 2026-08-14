import React from "react";
import { EC } from "../theme/tokens";

interface WidgetProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
  pressable?: boolean;
  onClick?: () => void;
}

/**
 * Widget — the core floating instrument container.
 * Each widget communicates one idea. Do not combine unrelated info.
 */
export const Widget: React.FC<WidgetProps> = ({
  children,
  size = "md",
  className = "",
  style,
  pressable = false,
  onClick,
}) => {
  const radiusMap = { sm: EC.radius.sm, md: EC.radius.md, lg: EC.radius.lg };
  const paddingMap = { sm: EC.space.md, md: EC.space.xl, lg: EC.space.xl };

  const baseStyle: React.CSSProperties = {
    backgroundColor: EC.surface1,
    border: `1px solid ${EC.border}`,
    borderRadius: radiusMap[size],
    padding: paddingMap[size],
    boxShadow: EC.shadow.sm,
    position: "relative",
    overflow: "hidden",
    ...style,
  };

  if (pressable || onClick) {
    return (
      <div
        style={baseStyle}
        className={`ec-widget-pressable ${className}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {children}
      </div>
    );
  }

  return (
    <div style={baseStyle} className={className}>
      {children}
    </div>
  );
};
