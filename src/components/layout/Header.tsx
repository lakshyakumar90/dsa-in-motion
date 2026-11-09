import { BookOpen, Home, Menu, Moon, Sun, Workflow, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Button } from "@/components/ui/button";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header"><a className="brand" href="#home" aria-label="DSA in Motion home"><span className="brand-mark">▥</span><span>dsa<span className="brand-muted">.motion</span></span></a>
    <Button className="mobile-menu" size="icon" variant="ghost" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</Button>
    <nav className={menuOpen ? "site-nav open" : "site-nav"} aria-label="Main navigation" onClick={() => setMenuOpen(false)}><a href="#home"><Home size={16} /> Learn</a><a href="#questions"><BookOpen size={16} /> Question sheet <span>165</span></a><a href="#lab"><Workflow size={16} /> Playground</a></nav>
    <Button className="theme-toggle" size="icon" variant="outline" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</Button>
  </header>;
}
