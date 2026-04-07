"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle, Store } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-[#15616D] text-white">
      {!compact ? (
        <nav className="fixed inset-x-0 top-0 z-[100] px-4 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-fit max-w-full rounded-[1.35rem] border border-white/12 bg-[rgba(21,97,109,0.82)] px-2 py-2 text-white shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur sm:rounded-[1.55rem] sm:px-3 sm:py-2.5 md:px-4">
            <div className="overflow-x-auto scrollbar-none">
              <div className="flex min-w-max items-center gap-1 sm:gap-1.5">
                <a
                  href="#top"
                  className={`whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium transition sm:px-2.5 sm:py-2 sm:text-sm ${
                    activeHref === "#top"
                      ? "bg-[#FE7F2D] text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Home
                </a>
                <a
                  href="#blog-grid"
                  className={`whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium transition sm:px-2.5 sm:py-2 sm:text-sm ${
                    activeHref === "#blog-grid"
                      ? "bg-[#FE7F2D] text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Posts
                </a>
                <a
                  href="#whatsapp-channel"
                  className={`whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium transition sm:px-2.5 sm:py-2 sm:text-sm ${
                    activeHref === "#whatsapp-channel"
                      ? "bg-[#FE7F2D] text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  WhatsApp
                </a>
                <Link
                  href={blogHref(basePath)}
                  className="ml-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#C2E0E0] px-1.5 py-1.5 text-[10px] font-semibold text-[#06231c] shadow-[0_10px_30px_rgba(194,224,224,0.22)] transition hover:-translate-y-0.5 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm"
                >
                  <MessageCircle size={14} className="sm:h-4 sm:w-4" />
                  <span>Blog</span>
                </Link>
                <a
                  href="https://booking.lodday.com"
                  className="ml-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FE7F2D] px-1.5 py-1.5 text-[10px] font-semibold text-[#001524] shadow-[0_10px_30px_rgba(254,127,45,0.28)] transition hover:-translate-y-0.5 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm"
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
