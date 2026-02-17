"use client";

import Link from "next/link";

const colors = {
  blackManga: "#001524",
  delightfulPeach: "#FFECD1",
  seamount: "#15616D",
};

export default function HeroNavbar() {
  return (
    <div className="w-full flex justify-center mb-20 relative z-20">
      <div className="max-w-6xl w-full px-6 flex justify-center">
        <nav
          className="flex items-center gap-6 px-8 py-3 rounded-full shadow-xl backdrop-blur-md text-sm"
          style={{
            background: "rgba(255, 236, 209, 0.85)",
            color: colors.blackManga,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <Link href="/" className="font-medium hover:opacity-70">
            Home
          </Link>

          <Link href="#features" className="font-medium hover:opacity-70">
            Features
          </Link>

          <Link href="#pricing" className="font-medium hover:opacity-70">
            Pricing
          </Link>

          <Link
            href="/dashboard"
            className="ml-2 px-4 py-1.5 rounded-full text-sm shadow-sm"
            style={{
              background: colors.seamount,
              color: colors.delightfulPeach,
            }}
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </div>
  );
}
