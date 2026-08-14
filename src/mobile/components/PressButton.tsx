import React from "react";
import { EC } from "../theme/tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface PressButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  id?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: EC.cyan,
    color: "#050505",
    border: "none",
    fontWeight: 600,
  },
  secondary: {
    backgroundColor: EC.surface2,
    color: EC.textPrimary,
    border: `1px solid ${EC.borderMd}`,
    fontWeight: 500,
  },
  ghost: {
    backgroundColor: "transparent",
    color: EC.textSecondary,
    border: `1px solid ${EC.border}`,
    fontWeight: 500,
  },
  danger: {
    backgroundColor: "rgba(200,80,80,0.12)",
    color: "#FF5F5F",
    border: "1px solid rgba(200,80,80,0.22)",
    fontWeight: 500,
  },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: 36, paddingLeft: 14, paddingRight: 14, fontSize: 13, borderRadius: EC.radius.sm },
  md: { height: 48, paddingLeft: 20, paddingRight: 20, fontSize: 15, borderRadius: EC.radius.sm },
  lg: { height: 56, paddingLeft: 24, paddingRight: 24, fontSize: 16, borderRadius: EC.radius.sm },
};

/**
 * PressButton — touch-optimized button with minimum 44×44px target,
 * smooth press animation, and consistent visual system.
 */
export const PressButton: React.FC<PressButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  iconPosition = "left",
  disabled = false,
  onClick,
  type = "button",
  className = "",
  id,
}) => {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    outline: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    transition: "transform 100ms ease, opacity 100ms ease, background-color 150ms ease",
    width: fullWidth ? "100%" : "auto",
    fontFamily: "var(--font-sans)",
    letterSpacing: "-0.1px",
    whiteSpace: "nowrap",
    ...VARIANT_STYLES[variant],
    ...SIZE_STYLES[size],
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.965)";
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
  };

  return (
    <button
      type={type}
      id={id}
      style={baseStyle}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown as any}
      onTouchEnd={handleMouseUp as any}
      className={className}
    >
      {icon && iconPosition === "left" && icon}
      {children}
      {icon && iconPosition === "right" && icon}
    </button>
  );
};
