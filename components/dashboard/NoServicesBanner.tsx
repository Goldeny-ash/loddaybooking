"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getTheme } from "@/lib/theme";

export default function NoServicesBanner({ business }: { business: any }) {
  const theme = getTheme(business);

  return (
    <div
      className="p-4 rounded-lg flex items-center justify-between"
      style={{ backgroundColor: theme.accentLight, border: `1px solid ${theme.accent}` }}
    >
      <div className="flex gap-3 items-center">
        <AlertTriangle className="h-5 w-5" style={{ color: theme.accentDark }} />
        <p className="text-sm" style={{ color: theme.accentDark }}>
          You need at least one service before customers can book.
        </p>
      </div>

      <Link
        href="/setup?step=3"
        className="text-sm font-medium underline"
        style={{ color: theme.primary }}
      >
        Add services
      </Link>
    </div>
  );
}
