"use client";

import { useState } from "react";
import { CalendarClock, Clock3, Home, Settings, X } from "lucide-react";
import DashboardBusinessSettings from "./DashboardBusinessSettings";
import UpcomingBookings from "./bookings/UpcomingBookings";
import TodaysSchedule from "./TodaysSchedule";

interface NewBottomSidebarProps {
  business: any;
  staffList: any[];
  services: any[];
  bookings: any[];
}

export default function NewBottomSidebar({
  business,
  staffList,
  services,
  bookings,
}: NewBottomSidebarProps) {
  const [active, setActive] = useState("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activePopup, setActivePopup] = useState<"upcoming" | "today" | null>(null);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <nav
        className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-2xl border bg-white shadow-2xl px-4 py-2"
        style={{ borderColor: "var(--brand-primary-light)" }}
      >
        <div className="flex items-center gap-6">
          <BottomIcon
            label="Dashboard"
            active={active === "dashboard"}
            onClick={() => {
              setActive("dashboard");
              goTo("dashboard-home");
            }}
            icon={<Home size={18} />}
          />
          <BottomIcon
            label="Upcoming"
            active={active === "upcoming"}
            onClick={() => {
              setActive("upcoming");
              setActivePopup("upcoming");
            }}
            icon={<CalendarClock size={18} />}
          />
          <BottomIcon
            label="Today"
            active={active === "today"}
            onClick={() => {
              setActive("today");
              setActivePopup("today");
            }}
            icon={<Clock3 size={18} />}
          />
          <BottomIcon
            label="Settings"
            active={active === "settings"}
            onClick={() => {
              setActive("settings");
              setSettingsOpen(true);
            }}
            icon={<Settings size={18} />}
          />
        </div>
      </nav>

      {settingsOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Business Settings</h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="rounded-lg p-2 hover:bg-gray-100"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>
          <div className="h-[calc(100vh-64px)] overflow-y-auto p-4">
            <DashboardBusinessSettings
              initialBusiness={business}
              staffList={staffList}
              services={services}
            />
          </div>
        </div>
      )}

      {activePopup && (
        <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="relative w-[95%] h-[88%] overflow-y-auto rounded-2xl shadow-2xl border border-white/30 bg-white/90 p-4">
            <button
              onClick={() => setActivePopup(null)}
              className="absolute top-3 right-3 text-sm px-3 py-1 bg-white rounded shadow"
            >
              Close
            </button>

            {activePopup === "upcoming" && (
              <UpcomingBookings initialBookings={bookings} business={business} />
            )}
            {activePopup === "today" && (
              <TodaysSchedule bookings={bookings} business={business} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BottomIcon({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center text-[11px] gap-1 transition-colors ${
        active ? "text-[var(--brand-primary-dark)]" : "text-gray-500"
      }`}
      aria-label={label}
      title={label}
    >
      <span
        className={`grid place-content-center rounded-full h-8 w-8 ${
          active ? "bg-[var(--brand-bg-soft)]" : ""
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
