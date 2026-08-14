import React, { useState, useEffect } from "react";
import { LogOut, Monitor, Target, Shield, ChevronRight, Edit3 } from "lucide-react";
import { EC } from "../theme/tokens";
import { Widget } from "../components/Widget";
import { StatusDot } from "../components/StatusDot";
import { PressButton } from "../components/PressButton";
import { UserProfile, Activity as UserActivity } from "../../types";

interface ProfileScreenProps {
  user: UserProfile | null;
  myActivity: UserActivity | null;
  electronTracking?: boolean;
  onSignOut: () => void;
  onSubmitSettings?: (updates: Partial<UserProfile>) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  myActivity,
  electronTracking = false,
  onSignOut,
  onSubmitSettings,
}) => {
  const [mounted, setMounted] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(user?.productivityGoal ?? 4));

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const fadeStyle = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(10px)",
    transition: `opacity 360ms ease ${delay}ms, transform 360ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "EC";

  const saveGoal = () => {
    const h = parseInt(goalInput, 10);
    if (!isNaN(h) && h > 0 && h <= 16) {
      onSubmitSettings?.({ productivityGoal: h });
    }
    setEditingGoal(false);
  };

  return (
    <div
      style={{
        padding: `${EC.space.lg}px ${EC.pageX}px`,
        display: "flex",
        flexDirection: "column",
        gap: EC.space.lg,
      }}
    >
      {/* ── Profile Card ─────────────────────────────────────── */}
      <div style={fadeStyle(0)}>
        <Widget size="lg">
          <div style={{ display: "flex", alignItems: "center", gap: EC.space.lg }}>
            {/* Avatar */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: EC.surface3,
                border: `1px solid ${EC.borderMd}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: EC.textSecondary,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {initials}
                </span>
              )}
            </div>

            {/* Name + headline */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: EC.textPrimary,
                  letterSpacing: "-0.3px",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name ?? "User"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: EC.textTertiary,
                  marginTop: 3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {user?.email ?? ""}
              </div>
              {user?.headline && (
                <div
                  style={{
                    fontSize: 13,
                    color: EC.textSecondary,
                    marginTop: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.headline}
                </div>
              )}
            </div>
          </div>

          {/* Username */}
          {user?.username && (
            <div
              style={{
                marginTop: EC.space.lg,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: EC.textTertiary,
                  fontFamily: "var(--font-mono)",
                }}
              >
                @{user.username}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: EC.cyan,
                  backgroundColor: EC.cyanDim,
                  border: `1px solid ${EC.cyanBorder}`,
                  borderRadius: EC.radius.pill,
                  padding: "2px 8px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                }}
              >
                PRO
              </span>
            </div>
          )}
        </Widget>
      </div>

      {/* ── Device Status ────────────────────────────────────── */}
      <div style={fadeStyle(80)}>
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
          Workstation
        </p>
        <Widget size="sm">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: EC.radius.sm,
                  backgroundColor: EC.surface2,
                  border: `1px solid ${EC.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Monitor size={16} color={EC.textSecondary} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: EC.textPrimary }}>
                  {user?.deviceConnected || "WS-WORKSTATION-11"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: EC.textTertiary,
                    fontFamily: "var(--font-mono)",
                    marginTop: 2,
                  }}
                >
                  {electronTracking ? "Desktop agent active" : "Web tracking"}
                </div>
              </div>
            </div>
            <StatusDot variant="online" showLabel size={6} />
          </div>
        </Widget>
      </div>

      {/* ── Focus Goal ───────────────────────────────────────── */}
      <div style={fadeStyle(160)}>
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
          Configuration
        </p>
        <Widget size="sm">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: EC.radius.sm,
                  backgroundColor: EC.surface2,
                  border: `1px solid ${EC.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Target size={16} color={EC.textSecondary} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: EC.textPrimary }}>
                  Daily Focus Goal
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: EC.textTertiary,
                    fontFamily: "var(--font-mono)",
                    marginTop: 2,
                  }}
                >
                  Target hours per day
                </div>
              </div>
            </div>

            {editingGoal ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  id="ec-profile-goal-input"
                  style={{
                    width: 52,
                    height: 36,
                    backgroundColor: EC.surface2,
                    border: `1px solid ${EC.cyanBorder}`,
                    borderRadius: EC.radius.sm,
                    color: EC.textPrimary,
                    fontSize: 15,
                    fontWeight: 700,
                    textAlign: "center",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && saveGoal()}
                  autoFocus
                />
                <PressButton variant="primary" size="sm" onClick={saveGoal} id="ec-profile-goal-save">
                  Save
                </PressButton>
              </div>
            ) : (
              <button
                onClick={() => setEditingGoal(true)}
                id="ec-profile-goal-edit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: EC.textSecondary,
                  padding: "8px",
                  borderRadius: EC.radius.sm,
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: EC.textPrimary,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {user?.productivityGoal ?? 4}h
                </span>
                <Edit3 size={13} />
              </button>
            )}
          </div>
        </Widget>
      </div>

      {/* ── Privacy ──────────────────────────────────────────── */}
      <div style={fadeStyle(240)}>
        <Widget size="sm">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: EC.radius.sm,
                backgroundColor: EC.surface2,
                border: `1px solid ${EC.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={16} color={EC.textSecondary} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: EC.textPrimary }}>
                Privacy Mode
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: EC.textTertiary,
                  fontFamily: "var(--font-mono)",
                  marginTop: 2,
                }}
              >
                {user?.privacyMode ?? "Standard"}
              </div>
            </div>
          </div>
        </Widget>
      </div>

      {/* ── Sign Out ─────────────────────────────────────────── */}
      <div style={{ ...fadeStyle(320), marginTop: 8 }}>
        <PressButton
          id="ec-profile-signout"
          variant="danger"
          size="lg"
          fullWidth
          icon={<LogOut size={16} />}
          onClick={onSignOut}
        >
          Sign Out
        </PressButton>
      </div>

      {/* Footer version */}
      <div
        style={{
          textAlign: "center",
          fontSize: 10,
          color: EC.textTertiary,
          fontFamily: "var(--font-mono)",
          marginTop: 4,
        }}
      >
        EndoCore v1.0 · Focus Intelligence
      </div>

      <div style={{ height: 8 }} />
    </div>
  );
};
