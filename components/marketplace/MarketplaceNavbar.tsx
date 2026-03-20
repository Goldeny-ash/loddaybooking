"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Handshake, Store } from "lucide-react";

interface Props {
  counties?: string[];
  selectedCounty?: string;
  onCountyChange?: (county: string) => void;
  onOpenFilters?: () => void;
}

export default function MarketplaceNavbar(_: Props) {
  const pathname = usePathname();
  const [activeHref, setActiveHref] = useState("#directory");

  useEffect(() => {
    const sections = ["#directory", "#categories", "#how-it-works"];

    const updateActiveSection = () => {
      if (pathname && pathname !== "/" && pathname !== "/marketplace") {
        setActiveHref("");
        return;
      }

      const scrollY = window.scrollY;
      if (scrollY < 220) {
        setActiveHref("#directory");
        return;
      }

      let current = "#directory";
      for (const href of sections) {
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY - 180;
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
    <nav className="fixed inset-x-0 top-0 z-[100] px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-fit max-w-full rounded-[1.35rem] border border-white/12 bg-[rgba(10,14,24,0.78)] px-2 py-2 text-white shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur sm:rounded-[1.55rem] sm:px-3 sm:py-2.5 md:px-4">
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex min-w-max items-center gap-1 sm:gap-1.5">
            <a
              href="#directory"
              className={`whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium transition sm:px-2.5 sm:py-2 sm:text-sm ${
                activeHref === "#directory"
                  ? "bg-[#15616D] text-[#FFECD1]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              Browse
            </a>
            <a
              href="#categories"
              className={`whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium transition sm:px-2.5 sm:py-2 sm:text-sm ${
                activeHref === "#categories"
                  ? "bg-[#15616D] text-[#FFECD1]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              Categories
            </a>
            <a
              href="#how-it-works"
              className={`whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium transition sm:px-2.5 sm:py-2 sm:text-sm ${
                activeHref === "#how-it-works"
                  ? "bg-[#15616D] text-[#FFECD1]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              How it works
            </a>
            <Link
              href="/affiliates"
              className="ml-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#78C0A8] px-1.5 py-1.5 text-[10px] font-semibold text-[#06231c] shadow-[0_10px_30px_rgba(120,192,168,0.22)] transition hover:-translate-y-0.5 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm"
            >
              <Handshake size={14} className="sm:h-4 sm:w-4" />
              <span className="sm:hidden">Join</span>
              <span className="hidden sm:inline">Partners</span>
            </Link>
            <a
              href="https://booking.lodday.com"
              className="ml-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FE7F2D] px-1.5 py-1.5 text-[10px] font-semibold text-[#001524] shadow-[0_10px_30px_rgba(254,127,45,0.28)] transition hover:-translate-y-0.5 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              <Store size={14} className="sm:h-4 sm:w-4" />
              <span className="sm:hidden">List</span>
              <span className="hidden sm:inline">List Business</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
