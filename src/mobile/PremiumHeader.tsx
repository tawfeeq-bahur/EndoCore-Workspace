import React, { useState } from "react";
import { Bell, User } from "lucide-react";
import { EC } from "./theme/tokens";
import { UserProfile } from "../types";

interface PremiumHeaderProps {
  unreadCount?: number;
  user?: UserProfile | null;
}

/**
 * PremiumHeader — fixed top header for EndoCore mobile.
 * Intentionally minimal: wordmark · notification · avatar.
 * Does not use blur or glassmorphism. Clean solid surface.
 */
export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  unreadCount = 0,
  user,
}) => {
  const [notifPressed, setNotifPressed] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "EC";

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: EC.z.header,
        backgroundColor: EC.bg,
        borderBottom: `1px solid ${EC.border}`,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: EC.pageX,
        paddingRight: EC.pageX,
        // Safe area top inset for notched phones
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* ── Wordmark ──────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: EC.textPrimary,
            letterSpacing: "-0.5px",
            lineHeight: 1,
            fontFamily: "var(--font-sans)",
          }}
        >
          EndoCore
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: EC.textTertiary,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
          }}
        >
          Focus Intelligence
        </span>
      </div>

      {/* ── Right Controls ────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Notification Bell */}
        <button
          id="ec-header-notif"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          onClick={() => setNotifPressed((p) => !p)}
          style={{
            position: "relative",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: EC.radius.sm,
            cursor: "pointer",
            color: EC.textSecondary,
            transition: "color 150ms ease, background-color 150ms ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = EC.surface2)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <Bell size={20} strokeWidth={1.6} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 7,
                height: 7,
                backgroundColor: EC.cyan,
                borderRadius: "50%",
                border: `1.5px solid ${EC.bg}`,
              }}
            />
          )}
        </button>

        {/* Avatar Pill */}
        <div
          id="ec-header-avatar"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: EC.surface2,
            border: `1px solid ${EC.borderMd}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            overflow: "hidden",
            flexShrink: 0,
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
                fontSize: 13,
                fontWeight: 600,
                color: EC.textSecondary,
                letterSpacing: "-0.3px",
                fontFamily: "var(--font-sans)",
              }}
            >
              {initials}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
