"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Contact", href: "#contact" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]">
      <div className="flex items-center gap-4 px-5 py-3 rounded-full shadow-2xl backdrop-blur-md bg-[rgba(255,236,209,0.9)] border border-black/10">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

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
    </nav>
  );
}
