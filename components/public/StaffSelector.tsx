"use client";

import React from "react";

interface Staff {
  _id: string;
  name: string;
}

interface Props {
  staffList: Staff[];
  selectedStaff: Staff | null;
  onSelect: (staff: Staff) => void;
}

export default function StaffSelector({ staffList, selectedStaff, onSelect }: Props) {
  if (!staffList.length) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Select Staff (optional)</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {staffList.map((staff) => (
          <button
            key={staff._id}
            onClick={() => onSelect(staff)}
            className={`border p-2 rounded text-sm hover:shadow transition ${
              selectedStaff?._id === staff._id ? "border-primary bg-primary/20" : "border-gray-200"
            }`}
          >
            {staff.name}
          </button>
        ))}
      </div>
    </div>
  );
}
