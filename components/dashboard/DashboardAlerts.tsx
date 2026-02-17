"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Users, CreditCard, Bell, X } from "lucide-react";
import { getTheme } from "@/lib/theme";

interface Booking {
  status: string;
}

interface Business {
  access: {
    status: "TRIAL" | "ACTIVE" | "EXPIRED" | "INACTIVE" | "GRACE";
  };
  servicesCount: number;
  theme?: {
    primary?: string;
    accent?: string;
    bgSoft?: string;
    text?: string;
  };
}

interface AlertRule {
  key: string;
  condition: boolean;
  icon: React.ElementType;
  text: string;
  action?: React.ReactNode;
}

interface DashboardAlertsProps {
  business: Business;
  bookings: Booking[];
}

export default function DashboardAlerts({ business, bookings }: DashboardAlertsProps) {
  const theme = getTheme(business);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const pending = bookings.filter((b) => b.status === "pending").length;
  const noServices = business.servicesCount === 0;

  const alertRules: AlertRule[] = [
    {
      key: "subscription",
      condition: business.access.status !== "ACTIVE",
      icon: CreditCard,
      text:
        business.access.status === "TRIAL"
          ? "Your trial is active. Upgrade to avoid interruptions."
          : "Your subscription is inactive. Renew to keep bookings coming.",
      action: <button className="ml-2 text-sm underline text-blue-600">Manage</button>,
    },
    {
      key: "pending",
      condition: pending > 0,
      icon: Calendar,
      text: `${pending} booking${pending > 1 ? "s" : ""} awaiting approval.`,
    },
    {
      key: "noServices",
      condition: noServices,
      icon: Users,
      text: "You have no services published yet.",
    },
  ];

  const alerts = alertRules.filter((a) => a.condition && !dismissed.includes(a.key));

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative">
      {/* Bell icon with badge */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
            {alerts.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={`absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 shadow-lg rounded-xl p-3 space-y-2 z-50
          transform transition-all duration-300 ease-out
          ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
        style={{ border: `1px solid ${theme.primary}` }}
      >
        {alerts.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">✅ All systems normal.</p>
        )}
        {alerts.map((a) => {
          const Icon = a.icon;
          return (
            <div
              key={a.key}
              role="alert"
              className="flex items-start justify-between gap-3 p-3 rounded-lg border-l-4 border-primary bg-gray-50 dark:bg-gray-800 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <Icon aria-hidden="true" className="w-5 h-5 text-primary mt-1" />
                <p className="text-sm text-gray-900 dark:text-gray-100">{a.text}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {a.action && a.action}
                <button
                  onClick={() => setDismissed((prev) => [...prev, a.key])}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
