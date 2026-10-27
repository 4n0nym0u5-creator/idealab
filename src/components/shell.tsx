"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Columns3, Download, GitCompare, History, LayoutDashboard, Library, Moon, Scale, Search, Sun } from "lucide-react";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ideas", label: "Ideas", icon: Library },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/rubric", label: "Rubric", icon: Scale },
  { href: "/runs", label: "Runs", icon: History },
];

function current(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("idealab-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <div className="app-frame">
      <a href="#main" className="sr-only">Skip to content</a>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Mark />
          <div>
            <strong>IdeaLab</strong>
            <span>Sydney · portfolio lab</span>
          </div>
        </Link>
        <nav className="nav" aria-label="Primary">
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} aria-current={current(pathname, link.href) ? "page" : undefined}>
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <p className="side-note">Single-user studio. Scores follow the SideHustle rubric. Auth can sit in front of getActor() later.</p>
      </aside>
      <div className="main-col">
        <header className="topbar">
          <form className="search" action="/ideas">
            <Search size={16} />
            <input name="q" placeholder="Search ideas, problems, competitors" aria-label="Search ideas" />
          </form>
          <a className="text-btn" href="/api/export">
            <Download size={15} /> Export
          </a>
          <button className="icon-btn" type="button" onClick={toggleTheme} aria-label={dark ? "Switch to light" : "Switch to dark"}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>
        <nav className="mobile-nav" aria-label="Mobile">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={current(pathname, link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <main id="main">{children}</main>
      </div>
    </div>
  );
}

function Mark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden className="text-accent">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <g fill="var(--bg)">
        {Array.from({ length: 12 }, (_, index) => (
          <rect
            key={index}
            x={5 + (index % 4) * 6}
            y={6 + Math.floor(index / 4) * 6}
            width="4"
            height="4"
            rx="1"
            opacity={0.35 + (index % 5) * 0.12}
          />
        ))}
      </g>
    </svg>
  );
}
