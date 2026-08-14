import React from "react";
import { EC } from "../theme/tokens";

type StatusVariant = "online" | "active" | "paused" | "offline" | "connecting";

interface StatusDotProps {
  variant?: StatusVariant;
  size?: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

const STATUS_COLORS: Record<StatusVariant, string> = {
  online:     EC.success,
  active:     EC.cyan,
  paused:     EC.orange,
  offline:    EC.textTertiary,
  connecting: EC.textSecondary,
};

const STATUS_LABELS: Record<StatusVariant, string> = {
  online:     "Online",
  active:     "Active",
  paused:     "Paused",
  offline:    "Offline",
  connecting: "Connecting",
};

/**
 * StatusDot — compact animated status indicator.
 * Uses a subtle pulse animation for live states (online, active).
 */
export const StatusDot: React.FC<StatusDotProps> = ({
  variant = "online",
  size = 7,
  label,
  showLabel = false,
  className = "",
}) => {
  const color = STATUS_COLORS[variant];
  const displayLabel = label ?? STATUS_LABELS[variant];
  const isPulsing = variant === "online" || variant === "active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      style={{ lineHeight: 1 }}
    >
      <span
        style={{
          display: "inline-block",
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: isPulsing ? `0 0 0 0 ${color}60` : "none",
          animation: isPulsing
            ? "ec-status-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite"
            : undefined,
          flexShrink: 0,
        }}
      />
      {showLabel && (
        <span
          style={{
            fontSize: 12,
            color: EC.textSecondary,
            fontWeight: 500,
          }}
        >
          {displayLabel}
        </span>
      )}

      {/* Inline keyframes for the pulse animation */}
      <style>{`
        @keyframes ec-status-pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${color}50; }
          50%       { box-shadow: 0 0 0 4px ${color}00; }
        }
      `}</style>
    </span>
  );
};
