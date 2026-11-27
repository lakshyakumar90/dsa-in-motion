import { BookMarked, BookOpen, Home, Menu, Moon, Sun, Workflow, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { readStorage } from "@/lib/utils";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hash, setHash] = useState(() => window.location.hash || "#home");

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const progress = readStorage<Record<string, boolean>>("dsa-motion-progress", {});
  const solvedCount = Object.values(progress).filter(Boolean).length;
  const routeRoot = hash.slice(1).split("/")[0] || "home";

  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="DSA in Motion home">
        <span className="brand-mark">▥</span>
        <span>dsa<span className="brand-muted">.motion</span></span>
      </a>
      <Button
        className="mobile-menu"
        size="icon"
        variant="ghost"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </Button>
      <nav className={menuOpen ? "site-nav open" : "site-nav"} aria-label="Main navigation" onClick={() => setMenuOpen(false)}>
        <a href="#home" className={routeRoot === "home" || routeRoot === "learn" || routeRoot === "topic" ? "is-current" : ""}>
          <Home size={15} /> Learn
        </a>
        <a href="#questions" className={routeRoot === "questions" || routeRoot === "question" ? "is-current" : ""}>
          <BookOpen size={15} /> Practice Sheet <span>165</span>
        </a>
        <a href="#notes" className={routeRoot === "notes" ? "is-current" : ""}>
          <BookMarked size={15} /> Notes <span>14</span>
        </a>
        <a href="#lab" className={routeRoot === "lab" ? "is-current" : ""}>
          <Workflow size={15} /> Playground
        </a>
      </nav>
      <div className="header-right">
        <a href="#questions" className="header-progress-pill" title="Your completed questions">
          <span className="progress-dot" /> {solvedCount} / 165
        </a>
        <Button
          className="theme-toggle"
          size="icon"
          variant="outline"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </Button>
      </div>
    </header>
  );
}
