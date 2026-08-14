import React, { useRef, useEffect } from "react";
import { Home, Crosshair, TrendingUp, User } from "lucide-react";
import { EC } from "./theme/tokens";
import { NavTab } from "./EndoCoreShell";

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home",     label: "Home",     icon: <Home size={22} strokeWidth={1.8} /> },
  { id: "focus",    label: "Focus",    icon: <Crosshair size={22} strokeWidth={1.8} /> },
  { id: "insights", label: "Insights", icon: <TrendingUp size={22} strokeWidth={1.8} /> },
  { id: "profile",  label: "Profile",  icon: <User size={22} strokeWidth={1.8} /> },
];

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadCount?: number;
}

/**
 * BottomNav — fixed 4-tab bottom navigation.
 * Active indicator: small cyan dot below label (not a pill).
 * Smooth opacity+translate animation between states.
 * Touch targets: full-column tap area, 68px height.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  unreadCount = 0,
}) => {
  return (
    <nav
      id="ec-bottom-nav"
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: EC.z.bottomNav,
        backgroundColor: EC.surface1,
        borderTop: `1px solid ${EC.border}`,
        height: "calc(68px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <NavButton
            key={item.id}
            item={item}
            isActive={isActive}
            onSelect={() => onSelectTab(item.id)}
          />
        );
      })}
    </nav>
  );
};

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onSelect: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, isActive, onSelect }) => {
  const ref = useRef<HTMLButtonElement>(null);

  const handlePress = () => {
    // Micro press feedback
    if (ref.current) {
      ref.current.style.transform = "scale(0.9)";
      setTimeout(() => {
        if (ref.current) ref.current.style.transform = "scale(1)";
      }, 120);
    }
    onSelect();
  };

  return (
    <button
      ref={ref}
      id={`ec-nav-${item.id}`}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      onClick={handlePress}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "8px 4px 4px",
        color: isActive ? EC.cyan : EC.textTertiary,
        transition: "color 200ms ease, transform 120ms ease",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        minHeight: 44,
      }}
    >
      {/* Icon */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "opacity 200ms ease, transform 200ms ease",
          opacity: isActive ? 1 : 0.55,
          transform: isActive ? "translateY(-1px)" : "translateY(0)",
        }}
      >
        {item.icon}
      </span>

      {/* Label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: isActive ? 600 : 400,
          letterSpacing: "0.02em",
          transition: "opacity 200ms ease, font-weight 200ms ease",
          opacity: isActive ? 1 : 0.45,
          fontFamily: "var(--font-sans)",
          lineHeight: 1,
        }}
      >
        {item.label}
      </span>

      {/* Active dot indicator */}
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          backgroundColor: EC.cyan,
          opacity: isActive ? 1 : 0,
          transform: isActive ? "scale(1)" : "scale(0)",
          transition: "opacity 250ms ease, transform 250ms cubic-bezier(0.34,1.56,0.64,1)",
          marginTop: 1,
        }}
      />
    </button>
  );
};
