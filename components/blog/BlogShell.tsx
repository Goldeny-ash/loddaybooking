"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { MessageCircle, Moon, Store, Sun } from "lucide-react";

function blogHref(basePath = "", slug?: string) {
  const normalizedBase = basePath || "/blg";
  return slug ? `${normalizedBase}/${slug}` : normalizedBase;
}

export default function BlogShell({
  children,
  compact = false,
  basePath = "",
}: {
  children: React.ReactNode;
  compact?: boolean;
  basePath?: string;
}) {
  const pathname = usePathname();
  const [activeHref, setActiveHref] = useState("#top");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = window.localStorage.getItem("lodday-blog-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    const sections = ["#top", "#blog-grid", "#whatsapp-channel"];

    const updateActiveSection = () => {
      if (pathname && pathname !== "/blg") {
        setActiveHref("");
        return;
      }

      const scrollY = window.scrollY;
      if (scrollY < 220) {
        setActiveHref("#top");
        return;
      }

      let current = "#top";
      for (const href of sections) {
        const id = href.slice(1);
        const element = document.getElementById(id);
        if (!element) continue;
        const top = element.getBoundingClientRect().top + window.scrollY - 180;
        if (scrollY >= top) current = href;
      }

      setActiveHref(current);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("lodday-blog-theme", theme);
  }, [theme]);

  const themeVars: CSSProperties =
    theme === "dark"
      ? {
          "--blog-shell-bg": "#000000",
          "--blog-page-bg": "#000000",
          "--blog-page-bg-soft": "#0a0a0a",
          "--blog-surface": "#0a0a0a",
          "--blog-surface-muted": "#111111",
          "--blog-surface-elevated": "#0f0f0f",
          "--blog-border": "rgba(255,255,255,0.14)",
          "--blog-text": "#ffffff",
          "--blog-text-muted": "rgba(255,255,255,0.74)",
          "--blog-text-soft": "rgba(255,255,255,0.62)",
          "--blog-link": "#ffffff",
          "--blog-accent": "#ffffff",
          "--blog-accent-strong": "#d4d4d4",
          "--blog-accent-contrast": "#000000",
          "--blog-warm": "#ffffff",
          "--blog-panel": "#050505",
          "--blog-card": "#0a0a0a",
          "--blog-card-text": "#ffffff",
          "--blog-card-muted": "rgba(255,255,255,0.72)",
          "--blog-footer-bg": "#050505",
          "--blog-footer-text": "#ffffff",
          "--blog-footer-muted": "rgba(255,255,255,0.68)",
        }
      : {
          "--blog-shell-bg": "#ffffff",
          "--blog-page-bg": "#ffffff",
          "--blog-page-bg-soft": "#f7f7f7",
          "--blog-surface": "#ffffff",
          "--blog-surface-muted": "#f7f7f7",
          "--blog-surface-elevated": "#f3f3f3",
          "--blog-border": "rgba(0,0,0,0.12)",
          "--blog-text": "#000000",
          "--blog-text-muted": "rgba(0,0,0,0.76)",
          "--blog-text-soft": "rgba(0,0,0,0.58)",
          "--blog-link": "#000000",
          "--blog-accent": "#000000",
          "--blog-accent-strong": "#222222",
          "--blog-accent-contrast": "#ffffff",
          "--blog-warm": "#000000",
          "--blog-panel": "#ffffff",
          "--blog-card": "#ffffff",
          "--blog-card-text": "#000000",
          "--blog-card-muted": "rgba(0,0,0,0.68)",
          "--blog-footer-bg": "#ffffff",
          "--blog-footer-text": "#000000",
          "--blog-footer-muted": "rgba(0,0,0,0.66)",
        };

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden bg-[var(--blog-shell-bg)] text-[var(--blog-text)] transition-colors duration-300"
      style={themeVars}
      data-theme={theme}
    >
      <button
        type="button"
        onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        className="fixed right-4 top-4 z-[110] inline-flex items-center gap-2 rounded-full border border-[var(--blog-border)] bg-[var(--blog-surface)] px-4 py-2 text-sm font-semibold text-[var(--blog-text)] shadow-[0_12px_35px_rgba(0,0,0,0.18)] transition hover:scale-[1.01] sm:right-6 sm:top-5"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        <span>{theme === "dark" ? "Light" : "Dark"}</span>
      </button>

      {!compact ? (
        <nav className="fixed inset-x-0 top-0 z-[100] px-4 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-fit max-w-full rounded-[1.35rem] border border-[var(--blog-border)] bg-[var(--blog-surface)] px-2 py-2 text-[var(--blog-text)] shadow-[0_18px_60px_rgba(0,0,0,0.18)] sm:rounded-[1.55rem] sm:px-3 sm:py-2.5 md:px-4">
            <div className="overflow-x-auto scrollbar-none">
              <div className="flex min-w-max items-center gap-1 sm:gap-1.5">
                <a
                  href="#top"
                  className={`whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium transition sm:px-2.5 sm:py-2 sm:text-sm ${
                    activeHref === "#top"
                      ? "bg-[var(--blog-warm)] text-white"
                      : "text-[var(--blog-text-muted)] hover:bg-black/5 hover:text-[var(--blog-text)]"
                  }`}
                >
                  Home
                </a>
                <a
                  href="#blog-grid"
                  className={`whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium transition sm:px-2.5 sm:py-2 sm:text-sm ${
                    activeHref === "#blog-grid"
                      ? "bg-[var(--blog-warm)] text-white"
                      : "text-[var(--blog-text-muted)] hover:bg-black/5 hover:text-[var(--blog-text)]"
                  }`}
                >
                  Posts
                </a>
                <a
                  href="#whatsapp-channel"
                  className={`whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium transition sm:px-2.5 sm:py-2 sm:text-sm ${
                    activeHref === "#whatsapp-channel"
                      ? "bg-[var(--blog-warm)] text-white"
                      : "text-[var(--blog-text-muted)] hover:bg-black/5 hover:text-[var(--blog-text)]"
                  }`}
                >
                  WhatsApp
                </a>
                <Link
                  href={blogHref(basePath)}
                  className="ml-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[var(--blog-border)] bg-[var(--blog-surface-muted)] px-1.5 py-1.5 text-[10px] font-semibold text-[var(--blog-text)] shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm"
                >
                  <MessageCircle size={14} className="sm:h-4 sm:w-4" />
                  <span>Blog</span>
                </Link>
                <a
                  href="https://booking.lodday.com"
                  className="ml-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--blog-warm)] px-1.5 py-1.5 text-[var(--blog-accent-contrast)] shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm"
                >
                  <Store size={14} className="sm:h-4 sm:w-4" />
                  <span className="sm:hidden">Lodday</span>
                  <span className="hidden sm:inline">Visit Lodday</span>
                </a>
              </div>
            </div>
          </div>
        </nav>
      ) : null}

      <div id="top" className={compact ? "" : "pt-14 sm:pt-28"}>
        {children}
      </div>
    </div>
  );
}
