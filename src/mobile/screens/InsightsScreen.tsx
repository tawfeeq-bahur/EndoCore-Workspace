import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { EC } from "../theme/tokens";
import { Widget } from "../components/Widget";
import { MiniChart } from "../components/MiniChart";
import { AnalyticsData, Activity as UserActivity } from "../../types";

interface InsightsScreenProps {
  analytics: AnalyticsData | null;
  aiInsights: string | null;
  myActivity: UserActivity | null;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  analytics,
  aiInsights,
  myActivity,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const fadeStyle = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 380ms ease ${delay}ms, transform 380ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  // Weekly data
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  const weekData: number[] = analytics?.focusScoreHistory?.slice(-7).map((d) => d.score) ?? [52, 71, 48, 82, 68, 76, 60];
  const weekHours: number[] = analytics?.focusScoreHistory?.slice(-7).map((d) => Math.round(d.score / 25)) ?? [2, 3, 2, 4, 3, 3, 2];
  const maxHours = Math.max(...weekHours, 1);
  const avgFocus = analytics?.averageDailyFocus
    ? Math.round(analytics.averageDailyFocus * 10) / 10
    : 3.1;
  const weekTotal = analytics?.weeklyTotalHours ?? 17.4;

  // App breakdown
  const apps = analytics?.appBreakdown?.slice(0, 4) ?? [
    { name: "VS Code",  value: 68, color: EC.cyan },
    { name: "Browser",  value: 18, color: EC.textTertiary },
    { name: "Terminal", value: 9,  color: EC.orange },
    { name: "Other",    value: 5,  color: EC.textTertiary },
  ];

  return (
    <div
      style={{
        padding: `${EC.space.lg}px ${EC.pageX}px`,
        display: "flex",
        flexDirection: "column",
        gap: EC.space.lg,
      }}
    >
      {/* ── Screen Title ────────────────────────────────────── */}
      <div style={fadeStyle(0)}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: EC.textPrimary,
            letterSpacing: "-0.5px",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Insights
        </h1>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: EC.textTertiary }}>
          Performance over the last 7 days
        </p>
      </div>

      {/* ── Weekly Summary Row ──────────────────────────────── */}
      <div style={fadeStyle(60)}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: EC.space.md }}>
          <SummaryCell label="Weekly Total" value={`${weekTotal}h`} trend="up" />
          <SummaryCell label="Daily Avg" value={`${avgFocus}h`} trend="up" />
        </div>
      </div>

      {/* ── Weekly Bar Chart Widget ─────────────────────────── */}
      <div style={fadeStyle(120)}>
        <Widget size="md">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: EC.space.lg,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: EC.textPrimary }}>
              Weekly Focus
            </span>
            <span style={{ fontSize: 11, color: EC.textTertiary, fontFamily: "var(--font-mono)" }}>
              hours/day
            </span>
          </div>

          {/* Bar chart */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              height: 72,
            }}
          >
            {weekHours.map((h, i) => {
              const heightPct = (h / maxHours) * 100;
              const isToday = i === (new Date().getDay() + 6) % 7; // Mon-indexed
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: mounted ? `${Math.max(10, heightPct)}%` : "8%",
                      backgroundColor: isToday ? EC.cyan : EC.surface3,
                      borderRadius: "4px 4px 2px 2px",
                      transition: `height 600ms cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms`,
                      boxShadow: isToday ? `0 0 8px ${EC.cyanGlow}` : "none",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      color: isToday ? EC.cyan : EC.textTertiary,
                      fontFamily: "var(--font-mono)",
                      fontWeight: isToday ? 600 : 400,
                    }}
                  >
                    {weekDays[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </Widget>
      </div>

      {/* ── Trend Sparkline ─────────────────────────────────── */}
      <div style={fadeStyle(180)}>
        <Widget size="md">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: EC.space.lg,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: EC.textPrimary }}>
              Score Trend
            </span>
          </div>
          <MiniChart data={weekData} height={52} color={EC.success} />
        </Widget>
      </div>

      {/* ── App Breakdown ───────────────────────────────────── */}
      <div style={fadeStyle(240)}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: EC.textTertiary,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
            marginBottom: EC.space.md,
          }}
        >
          App Breakdown
        </p>
        <Widget size="md" style={{ padding: 0 }}>
          {apps.map((app, i) => (
            <div
              key={app.name}
              style={{
                padding: `${EC.space.md}px ${EC.space.xl}px`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: i < apps.length - 1 ? `1px solid ${EC.border}` : "none",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: EC.cyan,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontSize: 13, color: EC.textPrimary, fontWeight: 400 }}>
                {app.name}
              </span>
              {/* bar */}
              <div
                style={{
                  width: 80,
                  height: 4,
                  backgroundColor: EC.surface3,
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: mounted ? `${app.value}%` : "0%",
                    backgroundColor: i === 0 ? EC.cyan : EC.textTertiary,
                    borderRadius: 99,
                    transition: `width 700ms cubic-bezier(0.22,1,0.36,1) ${i * 80 + 300}ms`,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: EC.textTertiary,
                  fontFamily: "var(--font-mono)",
                  minWidth: 28,
                  textAlign: "right",
                }}
              >
                {app.value}%
              </span>
            </div>
          ))}
        </Widget>
      </div>

      {/* ── AI Insights Card ────────────────────────────────── */}
      {aiInsights && (
        <div style={fadeStyle(320)}>
          <div
            style={{
              backgroundColor: EC.surface1,
              border: `1px solid ${EC.cyanBorder}`,
              borderRadius: EC.radius.lg,
              padding: EC.space.xl,
              boxShadow: EC.shadow.sm,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Sparkles size={14} color={EC.cyan} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: EC.cyan,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono)",
                }}
              >
                AI Insight
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: EC.textSecondary,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {aiInsights}
            </p>
          </div>
        </div>
      )}

      <div style={{ height: 8 }} />
    </div>
  );
};

/* ── SummaryCell ──────────────────────────────────────────────── */
const SummaryCell: React.FC<{ label: string; value: string; trend?: "up" | "down" }> = ({
  label, value, trend,
}) => (
  <div
    style={{
      backgroundColor: EC.surface1,
      border: `1px solid ${EC.border}`,
      borderRadius: EC.radius.md,
      padding: EC.space.lg,
      boxShadow: EC.shadow.sm,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
      }}
    >
      <span style={{ fontSize: 11, color: EC.textTertiary, fontWeight: 500 }}>{label}</span>
      {trend === "up" && <TrendingUp size={12} color={EC.success} />}
      {trend === "down" && <TrendingDown size={12} color={EC.orange} />}
    </div>
    <div
      style={{
        fontSize: 26,
        fontWeight: 700,
        color: EC.textPrimary,
        letterSpacing: "-0.5px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {value}
    </div>
  </div>
);
