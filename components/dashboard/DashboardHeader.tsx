"use client";
import React, { useEffect, useState, ReactNode } from "react";
import Image from "next/image";
import { getTheme, applyThemeToRoot } from "@/lib/theme";

interface DashboardHeaderProps {
  business: any;
  children?: ReactNode;
rightSlot?: React.ReactNode;
}

export default function DashboardHeader({ business, children, rightSlot }: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const theme = getTheme(business);
    applyThemeToRoot(theme);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, [business]);

  const logoUrl = business.logo || null; // string from schema

{/* Revenue today */}
<span className="px-2 py-1 text-sm font-medium rounded" 
      style={{ backgroundColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}>
  KES {business.revenueToday ? business.revenueToday.toLocaleString() : ""} {business.revenueToday ? "today" : ""}
</span>

  return (
    <div className="flex items-center justify-between mb-4">
      {/* LEFT: logo + greeting */}
      <div className="flex items-center gap-4">
        {logoUrl && (
          <Image
            src={logoUrl}
            alt={business.name}
            className="w-16 h-16 object-cover rounded"
            width={64}
            height={64}
          />
        )}
        <div>
          <h2 className="text-lg font-medium text-gray-500">{greeting}, {business.name || "User"} 👋</h2>
          <h1 className="text-3xl font-bold" style={{ color: "var(--brand-primary-dark)" }}>
            {business.name}
          </h1>
        </div>
      </div>

      {/* RIGHT: info + children */}
      <div className="flex items-center gap-4">
        {/* Trial badge */}
        {business.trialDaysLeft > 0 && (
          <span className="px-2 py-1 text-xs font-medium rounded" style={{ backgroundColor: "#FFF4E5", color: "#FF7D00" }}>
            Trial: {business.trialDaysLeft} days left
          </span>
        )}

        {/* Revenue today */}
       

        {/* Render children (notification bell) */}
        {children}
        {rightSlot}

        {/* Profile menu placeholder */}
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer">
          {business.name?.charAt(0) || "A"}
        </div>
      </div>
    </div>
  );
}
