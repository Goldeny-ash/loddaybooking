"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Home,
  Sparkles,
  BadgeDollarSign,
  Mail,
  LogIn,
  UserPlus,
  LayoutDashboard,
} from "lucide-react";

const navItems = [
  { name: "Home", href: "/", Icon: Home },
  { name: "Features", href: "#features", Icon: Sparkles },
  { name: "Pricing", href: "#pricing", Icon: BadgeDollarSign },
  { name: "Contact", href: "#contact", Icon: Mail },
];

export default function Navbar() {
  const pathname = usePathname();
  const [activeHref, setActiveHref] = useState("/");

  useEffect(() => {
    if (pathname !== "/") {
      setActiveHref(pathname);
      return;
    }

    const sections = ["/", "#features", "#pricing", "#contact"];

    const updateActiveSection = () => {
      const scrollY = window.scrollY;
      if (scrollY < 160) {
        setActiveHref("/");
        return;
      }

      let current = "/";
      for (const href of sections.slice(1)) {
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
    <nav className="fixed top-4 left-0 right-0 z-[100] px-4 md:top-6">
      <div className="mx-auto w-fit max-w-full rounded-2xl md:rounded-full shadow-2xl backdrop-blur-md bg-[rgba(255,236,209,0.9)] border border-black/10">
        <div className="flex items-center justify-center gap-2 md:gap-4 px-3 py-2.5 md:px-5 md:py-3">
          <div className="hidden md:flex items-center gap-3">
            {navItems.map((item) => {
              const isActive = activeHref === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#15616D] text-[#FFECD1]"
                      : "hover:bg-black/5"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-[#15616D]/20 px-4 py-2 text-sm font-medium text-[#15616D] hover:bg-black/5"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <SignedOut>
              <Link
                href="/sign-in?redirect_url=/setup"
                className="px-5 py-2 rounded-full bg-[#15616D] text-white text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up?redirect_url=/setup"
                className="px-5 py-2 rounded-full bg-[#FE7F2D] text-white text-sm font-medium"
              >
                Sign up
              </Link>
            </SignedOut>

            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>

          <div className="md:hidden flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = activeHref === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-label={item.name}
                  title={item.name}
                  className={`p-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-[#15616D] text-[#FFECD1]"
                      : "hover:bg-black/5"
                  }`}
                >
                  <item.Icon size={18} />
                </Link>
              );
            })}
            <Link
              href="/dashboard"
              aria-label="Dashboard"
              title="Dashboard"
              className="p-2 rounded-lg border border-[#15616D]/20 text-[#15616D]"
            >
              <LayoutDashboard size={18} />
            </Link>

            <SignedOut>
              <Link
                href="/sign-in?redirect_url=/setup"
                aria-label="Sign in"
                title="Sign in"
                className="p-2 rounded-lg bg-[#15616D] text-white"
              >
                <LogIn size={18} />
              </Link>
              <Link
                href="/sign-up?redirect_url=/setup"
                aria-label="Sign up"
                title="Sign up"
                className="p-2 rounded-lg bg-[#FE7F2D] text-white"
              >
                <UserPlus size={18} />
              </Link>
            </SignedOut>
            <SignedIn>
              <div className="px-1">
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
