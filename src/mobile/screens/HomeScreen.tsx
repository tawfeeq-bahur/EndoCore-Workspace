import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, ChevronRight, Zap, Clock, Trophy } from "lucide-react";
import { EC } from "../theme/tokens";
import { Widget } from "../components/Widget";
import { ProgressRing } from "../components/ProgressRing";
import { MiniChart } from "../components/MiniChart";
import { StatusDot } from "../components/StatusDot";
import { PressButton } from "../components/PressButton";
import { UserProfile, Activity as UserActivity, AnalyticsData } from "../../types";

interface HomeScreenProps {
  user: UserProfile | null;
  myActivity: UserActivity | null;
  analytics: AnalyticsData | null;
  aiInsights: string | null;
  greeting: string;
  userName: string;
  onUpdateActivity?: (app?: string, project?: string, togglePause?: boolean) => void;
  onNavigateFocus?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  myActivity,
  analytics,
  aiInsights,
  greeting,
  userName,
  onUpdateActivity,
  onNavigateFocus,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // ── Data derivations ────────────────────────────────────────
  const focusSeconds     = myActivity?.durationSeconds ?? 0;
  const targetSeconds    = (user?.productivityGoal ?? 4) * 3600;
  const progressPct      = Math.min(100, Math.round((focusSeconds / Math.max(targetSeconds, 1)) * 100));
  const focusHours       = Math.floor(focusSeconds / 3600);
  const focusMins        = Math.floor((focusSeconds % 3600) / 60);
  const targetHours      = user?.productivityGoal ?? 4;
  const isPaused         = myActivity?.isPaused ?? false;
  const isConnected      = true; // workstation always connected
  const deviceName       = user?.deviceConnected || "WS-WORKSTATION-11";

  // Velocity: derive from analytics or placeholder
  const velocityPct = analytics?.weeklyProdGoalAchieved
    ? Math.round((analytics.weeklyProdGoalAchieved - 100))
    : 400;
  const velocityLabel = velocityPct >= 0 ? `+${velocityPct}%` : `${velocityPct}%`;

  // Focus sparkline data — 7 days
  const sparkData = analytics?.focusScoreHistory?.length
    ? analytics.focusScoreHistory.slice(-7).map((d) => d.score)
    : [42, 58, 51, 74, 68, 81, progressPct];

  // Milestones
  const milestones = [
    { label: "Deep Work",      sub: "90-min block",    status: "done"       },
    { label: "Coding Session", sub: "Active now",      status: "active"     },
    { label: "Documentation",  sub: "Up next",         status: "upcoming"   },
  ];

  const milestoneColor = (s: string) =>
    s === "done"   ? EC.success  :
    s === "active" ? EC.cyan     :
                     EC.textTertiary;

  const milestoneStatus = (s: string) =>
    s === "done"   ? "Completed"   :
    s === "active" ? "In Progress" :
                     "Upcoming";

  // ── Animation delay helper ──────────────────────────────────
  const fadeStyle = (delay: number): React.CSSProperties => ({
    opacity:   mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 400ms ease ${delay}ms, transform 400ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  return (
    <div
      style={{
        padding: `${EC.space.lg}px ${EC.pageX}px`,
        display: "flex",
        flexDirection: "column",
        gap: EC.space.lg,
      }}
    >
      {/* ── 1. Connection Status Pill ────────────────────────── */}
      <div style={fadeStyle(0)}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: EC.surface2,
            border: `1px solid ${EC.border}`,
            borderRadius: EC.radius.pill,
            padding: "6px 12px 6px 8px",
          }}
        >
          <StatusDot variant={isConnected ? "online" : "offline"} size={6} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: EC.textSecondary,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.02em",
            }}
          >
            {deviceName}
          </span>
          <span
            style={{
              fontSize: 11,
              color: isConnected ? EC.success : EC.textTertiary,
              fontWeight: 500,
            }}
          >
            {isConnected ? "Connected" : "Offline"}
          </span>
        </div>
      </div>

      {/* ── 2. Greeting ──────────────────────────────────────── */}
      <div style={{ ...fadeStyle(60), marginTop: -4 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: EC.textPrimary,
            letterSpacing: "-0.5px",
            lineHeight: 1.15,
            margin: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          {greeting},<br />
          <span style={{ fontWeight: 400, color: EC.textSecondary }}>{userName}.</span>
        </h1>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 14,
            color: EC.textTertiary,
            fontWeight: 400,
          }}
        >
          {isPaused ? "Session paused — pick it up anytime." : "Ready to focus?"}
        </p>
      </div>

      {/* ── 3. Focus Hero Widget ─────────────────────────────── */}
      <div style={fadeStyle(120)}>
        <Widget size="lg">
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: EC.space.xl,
            }}
          >
            <span
              style={{
                fontSize: EC.type.micro,
                fontWeight: 500,
                color: EC.textTertiary,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "var(--font-mono)",
              }}
            >
              Today's Focus
            </span>
            <span
              style={{
                fontSize: 12,
                color: isPaused ? EC.orange : EC.success,
                fontWeight: 500,
                backgroundColor: isPaused ? EC.orangeDim : EC.successDim,
                border: `1px solid ${isPaused ? EC.orangeBorder : EC.successBorder}`,
                borderRadius: EC.radius.pill,
                padding: "3px 10px",
              }}
            >
              {isPaused ? "Paused" : "● Active"}
            </span>
          </div>

          {/* Ring + metric */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: EC.space.xl,
            }}
          >
            {/* Progress Ring */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ProgressRing value={mounted ? progressPct : 0} size={116} strokeWidth={9} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: EC.textPrimary,
                    letterSpacing: "-1px",
                    lineHeight: 1,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {progressPct}%
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: EC.textTertiary,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 500,
                  }}
                >
                  of goal
                </span>
              </div>
            </div>

            {/* Right-side meta */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: EC.textPrimary,
                    letterSpacing: "-1px",
                    lineHeight: 1,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {focusHours}h {String(focusMins).padStart(2, "0")}m
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: EC.textTertiary,
                    marginTop: 4,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  / {targetHours}h 00m goal
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: EC.textTertiary,
                    fontFamily: "var(--font-mono)",
                    marginBottom: 3,
                    letterSpacing: "0.04em",
                  }}
                >
                  {myActivity?.project || "EndoCore Workspace"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: EC.textTertiary,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {myActivity?.app || "VS Code"}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: EC.space.xl }}>
            <PressButton
              variant="primary"
              size="lg"
              fullWidth
              id="ec-home-continue-focus"
              onClick={onNavigateFocus}
            >
              {isPaused ? "Resume Focus" : "Continue Focus"}
            </PressButton>
          </div>
        </Widget>
      </div>

      {/* ── 4. Compact 2-Column Metric Grid ─────────────────── */}
      <div style={fadeStyle(180)}>
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
          Today
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: EC.space.md,
          }}
        >
          {/* Focus Time metric */}
          <MetricWidget
            label="Focus Time"
            value={`${focusHours}h ${String(focusMins).padStart(2, "0")}m`}
            sub="Today"
            accentColor={EC.cyan}
            icon={<Clock size={14} />}
          />
          {/* Velocity metric */}
          <MetricWidget
            label="Velocity"
            value={velocityLabel}
            sub="vs last week"
            accentColor={EC.orange}
            icon={<Zap size={14} />}
          />
        </div>
      </div>

      {/* ── 5. Telemetry / Sparkline Widget ─────────────────── */}
      <div style={fadeStyle(240)}>
        <Widget size="md">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: EC.space.lg,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: EC.textPrimary,
              }}
            >
              Focus Velocity
            </span>
            <span
              style={{
                fontSize: 11,
                color: EC.textTertiary,
                fontFamily: "var(--font-mono)",
              }}
            >
              7-day
            </span>
          </div>
          <MiniChart data={sparkData} height={56} color={EC.cyan} />
          {/* X-axis labels */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span
                key={d}
                style={{
                  fontSize: 9,
                  color: EC.textTertiary,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </Widget>
      </div>

      {/* ── 6. Milestones Widget ─────────────────────────────── */}
      <div style={fadeStyle(300)}>
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
          Milestones
        </p>
        <Widget size="md" style={{ padding: 0, overflow: "hidden" }}>
          {milestones.map((m, i) => (
            <div
              key={m.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `${EC.space.lg}px ${EC.space.xl}px`,
                borderBottom:
                  i < milestones.length - 1
                    ? `1px solid ${EC.border}`
                    : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <StatusDot
                  variant={
                    m.status === "done"
                      ? "online"
                      : m.status === "active"
                      ? "active"
                      : "offline"
                  }
                  size={7}
                />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: EC.textPrimary,
                      lineHeight: 1.2,
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: EC.textTertiary,
                      marginTop: 2,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {m.sub}
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: milestoneColor(m.status),
                  backgroundColor:
                    m.status === "done"
                      ? EC.successDim
                      : m.status === "active"
                      ? EC.cyanDim
                      : "transparent",
                  borderRadius: EC.radius.pill,
                  padding: m.status !== "upcoming" ? "3px 10px" : "3px 0",
                }}
              >
                {milestoneStatus(m.status)}
              </span>
            </div>
          ))}
        </Widget>
      </div>

      {/* Bottom breathing space */}
      <div style={{ height: 8 }} />
    </div>
  );
};

/* ── MetricWidget sub-component ──────────────────────────────── */
interface MetricWidgetProps {
  label: string;
  value: string;
  sub?: string;
  accentColor?: string;
  icon?: React.ReactNode;
}

const MetricWidget: React.FC<MetricWidgetProps> = ({
  label,
  value,
  sub,
  accentColor = EC.cyan,
  icon,
}) => (
  <div
    style={{
      backgroundColor: EC.surface1,
      border: `1px solid ${EC.border}`,
      borderRadius: EC.radius.md,
      padding: `${EC.space.lg}px`,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: EC.shadow.sm,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: EC.textTertiary,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      {icon && (
        <span style={{ color: accentColor, opacity: 0.8 }}>{icon}</span>
      )}
    </div>
    <div
      style={{
        fontSize: 24,
        fontWeight: 700,
        color: EC.textPrimary,
        letterSpacing: "-0.5px",
        lineHeight: 1,
        fontFamily: "var(--font-sans)",
      }}
    >
      {value}
    </div>
    {sub && (
      <span
        style={{
          fontSize: 10,
          color: EC.textTertiary,
          fontFamily: "var(--font-mono)",
        }}
      >
        {sub}
      </span>
    )}
  </div>
);
