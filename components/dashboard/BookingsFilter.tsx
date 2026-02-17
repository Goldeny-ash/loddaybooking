"use client";

import { useState, useEffect } from "react";
import { getTheme } from "@/lib/theme";

interface BookingsFilterProps {
  staffOptions?: string[];
  serviceOptions?: string[];
  onFilter: (filters: {
    status?: string;
    date?: string;
    staff?: string;
    service?: string;
    range?: "today" | "week";
  }) => void;
}

export default function BookingsFilter({
  staffOptions = [],
  serviceOptions = [],
  onFilter,
}: BookingsFilterProps) {
  const theme = getTheme({});
  const [status, setStatus] = useState("");
  const [staff, setStaff] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [range, setRange] = useState<"today" | "week" | "">("");

  const applyFilter = () => {
    onFilter({
      status: status || undefined,
      staff: staff || undefined,
      service: service || undefined,
      date: date || undefined,
      range: range || undefined,
    });
  };

  const resetFilters = () => {
    setStatus("");
    setStaff("");
    setService("");
    setDate("");
    setRange("");
    onFilter({});
  };

  useEffect(() => {
    applyFilter(); // live apply
  }, [status, staff, service, range, date]);

  return (
    <div className="flex flex-wrap gap-2 items-end mb-4">
      <select
        className="border px-2 py-1 rounded"
        style={{ borderColor: theme.primary }}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
        <option value="rejected">Rejected</option>
      </select>

      <select
        className="border px-2 py-1 rounded"
        style={{ borderColor: theme.primary }}
        value={staff}
        onChange={(e) => setStaff(e.target.value)}
      >
        <option value="">All Staff</option>
        {staffOptions.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        className="border px-2 py-1 rounded"
        style={{ borderColor: theme.primary }}
        value={service}
        onChange={(e) => setService(e.target.value)}
      >
        <option value="">All Services</option>
        {serviceOptions.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <input
        type="date"
        className="border px-2 py-1 rounded"
        style={{ borderColor: theme.primary }}
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div className="flex gap-1">
        <button
          className="px-3 py-1 rounded text-sm"
          style={{ backgroundColor: theme.primary, color: "white" }}
          onClick={() => setRange("today")}
        >
          Today
        </button>
        <button
          className="px-3 py-1 rounded text-sm"
          style={{ backgroundColor: theme.primary, color: "white" }}
          onClick={() => setRange("week")}
        >
          This Week
        </button>
        <button
          className="px-3 py-1 rounded text-sm border"
          style={{ borderColor: theme.primary }}
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
