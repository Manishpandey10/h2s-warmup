"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./language-provider";
import { UiIcon } from "./ui-icon";

export function ThemeToggle() {
  const { t } = useLanguage();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function syncTheme() {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem("rozmitra-theme");
      } catch {
        // Theme switching still works when storage is unavailable.
      }
      const nextDark = saved === "dark" || (saved !== "light" && media.matches);
      document.documentElement.dataset.theme = nextDark ? "dark" : "light";
      setDark(nextDark);
    }
    syncTheme();
    media.addEventListener("change", syncTheme);
    return () => media.removeEventListener("change", syncTheme);
  }, []);

  function toggle() {
    const nextDark = !dark;
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    setDark(nextDark);
    try {
      localStorage.setItem("rozmitra-theme", nextDark ? "dark" : "light");
    } catch {
      // The selected theme stays active for this page even without storage.
    }
  }

  return (
    <button
      className="secondary theme-toggle"
      type="button"
      aria-label={dark ? t.themeLight : t.themeDark}
      title={dark ? t.themeLight : t.themeDark}
      aria-pressed={dark}
      onClick={toggle}
    >
      <UiIcon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}
