"use client";

import React, { useEffect, useState, ReactNode } from "react";
import Image from "next/image";
import { getTheme, applyThemeToRoot } from "@/lib/theme";
import { SidebarMenuTrigger } from "./SideBar";

interface DashboardHeaderProps {
  business: any;
  children?: ReactNode;
  rightSlot?: React.ReactNode;
}

export default function DashboardHeader({
  business,
  children,
  rightSlot,
}: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const theme = getTheme(business);
    applyThemeToRoot(theme);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, [business]);

  const firstName = business?.name?.split(" ")?.[0] || "there";

  return (
    <>
      <div
        id="dashboard-home"
        className="md:hidden rounded-3xl border p-4 shadow-sm"
        style={{
          borderColor: "var(--brand-primary-light)",
          background: "linear-gradient(180deg, #ffffff 0%, var(--brand-bg-soft) 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <SidebarMenuTrigger />
          
          <div className="flex items-center gap-2">
            {children}
            {rightSlot}
           
          </div>
        </div>

        <h2 className="text-2xl font-bold leading-tight" style={{ color: "var(--brand-primary-dark)" }}>
          Hi {firstName}!
        </h2>
        <p className="text-sm text-gray-500 mb-3">{greeting}</p>

        
       

      
      </div>

      <div className="hidden md:flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {business?.logo && (
            <Image
              src={business.logo}
              alt={business.name}
              className="w-16 h-16 object-cover rounded"
              width={64}
              height={64}
            />
          )}
          <div>
            <h2 className="text-lg font-medium text-gray-500">
              {greeting}, {business.name || "User"}
            </h2>
            <h1 className="text-3xl font-bold" style={{ color: "var(--brand-primary-dark)" }}>
              {business.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {business.trialDaysLeft > 0 && (
            <span
              className="px-2 py-1 text-xs font-medium rounded"
              style={{ backgroundColor: "#FFF4E5", color: "#FF7D00" }}
            >
              Trial: {business.trialDaysLeft} days left
            </span>
          )}
          {children}
          {rightSlot}
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer">
            {business.name?.charAt(0) || "A"}
          </div>
        </div>
      </div>
    </>
  );
}
