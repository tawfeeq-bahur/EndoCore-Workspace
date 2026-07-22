import { useState, useEffect } from "react";
import { PlatformMode } from "../types";

export function usePlatformMode(): PlatformMode {
  const [platformMode, setPlatformMode] = useState<PlatformMode>(() => getMode());

  function getMode(): PlatformMode {
    if (typeof window === "undefined") return "desktop-web";
    const urlParams = new URLSearchParams(window.location.search);
    const forcedPlatform = urlParams.get("platform");

    if (forcedPlatform === "mobile") {
      return "mobile-companion";
    }

    if ((window as any).electronAPI) {
      return "desktop-electron";
    }

    if (window.innerWidth < 768) {
      return "responsive-web";
    }

    return "desktop-web";
  }

  useEffect(() => {
    const handleResize = () => {
      setPlatformMode(getMode());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return platformMode;
}
