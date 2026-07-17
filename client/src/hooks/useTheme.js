import { useEffect, useState } from "react";

/** Dark mode with localStorage persistence + system preference default. */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("resumeai-theme");
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("resumeai-theme", theme);
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}
