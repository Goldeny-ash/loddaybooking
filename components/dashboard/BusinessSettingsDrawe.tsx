// components/dashboard/BusinessSettingsDrawer.tsx
"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import DashboardBusinessSettings from "./DashboardBusinessSettings";

interface BusinessSettingsDrawerProps {
  initialBusiness: any;
  staffList: any[];
  services: any[];
}

export default function BusinessSettingsDrawer({
  initialBusiness,
  staffList,
  services,
}: BusinessSettingsDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating / Header Gear Button */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full hover:bg-gray-200 transition"
        title="Business Settings"
      >
        <Settings className="w-6 h-6 text-gray-700" />
      </button>

      {/* Drawer Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="ml-auto w-full max-w-3xl bg-white shadow-xl h-full overflow-y-auto transition-transform transform translate-x-0">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Business Settings</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <DashboardBusinessSettings
                initialBusiness={initialBusiness}
                staffList={staffList}
                services={services}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
