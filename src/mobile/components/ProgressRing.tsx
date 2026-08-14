import React, { useEffect, useRef } from "react";
import { EC } from "../theme/tokens";

interface ProgressRingProps {
  /** Value 0–100 */
  value: number;
  /** Outer diameter in px */
  size?: number;
  /** Stroke width in px */
  strokeWidth?: number;
  /** Fill color */
  color?: string;
  /** Track color */
  trackColor?: string;
  className?: string;
}

/**
 * ProgressRing — animated SVG circular progress indicator.
 * Smooth spring-like animation when value changes.
 * Used as the primary visual in the FocusHeroWidget.
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  color = EC.cyan,
  trackColor = EC.surface3,
  className = "",
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  const circleRef = useRef<SVGCircleElement>(null);
  const prevOffset = useRef(circumference);

  useEffect(() => {
    if (circleRef.current) {
      // Animate from previous offset to new offset
      circleRef.current.style.transition = "stroke-dashoffset 700ms cubic-bezier(0.34,1.56,0.64,1)";
      circleRef.current.style.strokeDashoffset = `${offset}`;
      prevOffset.current = offset;
    }
  }, [offset]);

  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ transform: "rotate(-90deg)", display: "block" }}
      aria-label={`${clampedValue}% progress`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Track ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        ref={circleRef}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference} // starts at 0%, animates on mount
        strokeLinecap="round"
        style={{
          transition: "stroke-dashoffset 700ms cubic-bezier(0.34,1.56,0.64,1)",
          filter: `drop-shadow(0 0 4px ${color}40)`,
        }}
      />
    </svg>
  );
};
