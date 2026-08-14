import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, ChevronRight } from "lucide-react";
import { EC } from "../theme/tokens";
import { Widget } from "../components/Widget";
import { ProgressRing } from "../components/ProgressRing";
import { StatusDot } from "../components/StatusDot";
import { PressButton } from "../components/PressButton";
import { UserProfile, Activity as UserActivity } from "../../types";

interface FocusScreenProps {
  user: UserProfile | null;
  myActivity: UserActivity | null;
  onUpdateActivity?: (app?: string, project?: string, togglePause?: boolean) => void;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({
  user,
  myActivity,
  onUpdateActivity,
}) => {
  const [mounted, setMounted] = useState(false);
  const [localSeconds, setLocalSeconds] = useState(myActivity?.durationSeconds ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPaused = myActivity?.isPaused ?? false;
  const targetSeconds = (user?.productivityGoal ?? 4) * 3600;
  const progressPct = Math.min(100, Math.round((localSeconds / Math.max(targetSeconds, 1)) * 100));

  // Local timer tick
  useEffect(() => {
    setLocalSeconds(myActivity?.durationSeconds ?? 0);
  }, [myActivity?.durationSeconds]);

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setLocalSeconds((s) => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Format hh:mm:ss
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const fadeStyle = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 380ms ease ${delay}ms, transform 380ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
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
          Focus Session
        </h1>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: EC.textTertiary }}>
          {isPaused ? "Session paused" : "Session running"}
        </p>
      </div>

      {/* ── Session Timer Hero ──────────────────────────────── */}
      <div style={fadeStyle(80)}>
        <Widget size="lg">
          {/* Ring + Clock center */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: EC.space.xl,
              padding: `${EC.space.xl}px 0`,
            }}
          >
            {/* Progress ring */}
            <div style={{ position: "relative" }}>
              <ProgressRing
                value={mounted ? progressPct : 0}
                size={180}
                strokeWidth={10}
                color={isPaused ? EC.orange : EC.cyan}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 40,
                    fontWeight: 700,
                    color: EC.textPrimary,
                    letterSpacing: "-2px",
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1,
                  }}
                >
                  {formatTime(localSeconds)}
                </span>
                <StatusDot
                  variant={isPaused ? "paused" : "active"}
                  showLabel
                  size={6}
                />
              </div>
            </div>

            {/* Project info */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: EC.textPrimary }}>
                {myActivity?.project || "EndoCore Workspace"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: EC.textTertiary,
                  fontFamily: "var(--font-mono)",
                  marginTop: 4,
                }}
              >
                {myActivity?.app || "VS Code"}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div
            style={{
              display: "flex",
              gap: EC.space.md,
              marginTop: EC.space.sm,
            }}
          >
            <PressButton
              id="ec-focus-toggle"
              variant={isPaused ? "primary" : "secondary"}
              size="lg"
              fullWidth
              icon={isPaused ? <Play size={18} /> : <Pause size={18} />}
              onClick={() => onUpdateActivity?.(undefined, undefined, !isPaused)}
            >
              {isPaused ? "Resume" : "Pause"}
            </PressButton>
            <div style={{ minWidth: 56 }}>
              <PressButton
                id="ec-focus-stop"
                variant="ghost"
                size="lg"
                icon={<Square size={16} />}
                onClick={() => onUpdateActivity?.("", "", false)}
              >
                {""}
              </PressButton>
            </div>
          </div>
        </Widget>
      </div>

      {/* ── Session Stats Row ───────────────────────────────── */}
      <div style={fadeStyle(160)}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: EC.space.md,
          }}
        >
          {[
            { label: "Progress",  value: `${progressPct}%`,           mono: false },
            { label: "Goal",      value: `${user?.productivityGoal ?? 4}h`,    mono: true  },
            { label: "Streak",    value: `${user?.focusStreak ?? 14}d`, mono: true  },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: EC.surface2,
                border: `1px solid ${EC.border}`,
                borderRadius: EC.radius.md,
                padding: `${EC.space.lg}px ${EC.space.md}px`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: EC.textPrimary,
                  letterSpacing: "-0.5px",
                  fontFamily: stat.mono ? "var(--font-mono)" : "var(--font-sans)",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: EC.textTertiary,
                  marginTop: 4,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.05em",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Open Apps ───────────────────────────────────────── */}
      {myActivity?.openApps && myActivity.openApps.length > 0 && (
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
            Active Apps
          </p>
          <Widget size="md" style={{ padding: 0 }}>
            {myActivity.openApps.slice(0, 5).map((app, i) => (
              <div
                key={app}
                style={{
                  padding: `${EC.space.md}px ${EC.space.xl}px`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom: i < Math.min(4, myActivity.openApps!.length - 1) ? `1px solid ${EC.border}` : "none",
                }}
              >
                <StatusDot variant="active" size={5} />
                <span style={{ fontSize: 13, color: EC.textPrimary, fontWeight: 400 }}>{app}</span>
              </div>
            ))}
          </Widget>
        </div>
      )}
    </div>
  );
};
