import React, { useEffect, useRef } from "react";
import { EC } from "../theme/tokens";

interface MiniChartProps {
  /** Array of 5–14 data points (0–100 scale) */
  data?: number[];
  /** Chart height in px */
  height?: number;
  /** Color of the line and fill */
  color?: string;
  className?: string;
}

const DEFAULT_DATA = [38, 55, 42, 70, 62, 80, 72];

/**
 * MiniChart — lightweight SVG area sparkline for telemetry visualization.
 * Animates in on mount. Designed to communicate trend, not exact values.
 */
export const MiniChart: React.FC<MiniChartProps> = ({
  data = DEFAULT_DATA,
  height = 56,
  color = EC.cyan,
  className = "",
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGPathElement>(null);

  const points = data.length < 2 ? [...DEFAULT_DATA] : data;
  const width = 300; // SVG viewBox width — will scale via preserveAspectRatio
  const padding = { top: 4, bottom: 4, left: 0, right: 0 };

  const minV = Math.min(...points);
  const maxV = Math.max(...points);
  const range = maxV - minV || 1;

  const toX = (i: number) =>
    padding.left + (i / (points.length - 1)) * (width - padding.left - padding.right);
  const toY = (v: number) =>
    padding.top + (1 - (v - minV) / range) * (height - padding.top - padding.bottom);

  // Build smooth cubic bezier curve
  const buildPath = () => {
    let d = `M ${toX(0)} ${toY(points[0])}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = toX(i - 1) + (toX(i) - toX(i - 1)) / 3;
      const cp1y = toY(points[i - 1]);
      const cp2x = toX(i) - (toX(i) - toX(i - 1)) / 3;
      const cp2y = toY(points[i]);
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX(i)} ${toY(points[i])}`;
    }
    return d;
  };

  const buildFillPath = () => {
    const linePath = buildPath();
    const lastX = toX(points.length - 1);
    const firstX = toX(0);
    const bottomY = height - padding.bottom;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Animate on mount via SVG stroke-dasharray trick
  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength?.() || 800;
      pathRef.current.style.strokeDasharray = `${len}`;
      pathRef.current.style.strokeDashoffset = `${len}`;
      requestAnimationFrame(() => {
        if (pathRef.current) {
          pathRef.current.style.transition = "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)";
          pathRef.current.style.strokeDashoffset = "0";
        }
      });
    }
    if (fillRef.current) {
      fillRef.current.style.opacity = "0";
      setTimeout(() => {
        if (fillRef.current) {
          fillRef.current.style.transition = "opacity 600ms ease 200ms";
          fillRef.current.style.opacity = "1";
        }
      }, 50);
    }
  }, [data.join(",")]);

  const gradId = `ec-chart-grad-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.00" />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <path
        ref={fillRef}
        d={buildFillPath()}
        fill={`url(#${gradId})`}
        style={{ opacity: 0 }}
      />

      {/* Line */}
      <path
        ref={pathRef}
        d={buildPath()}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Final point dot */}
      <circle
        cx={toX(points.length - 1)}
        cy={toY(points[points.length - 1])}
        r="2.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
      />
    </svg>
  );
};
