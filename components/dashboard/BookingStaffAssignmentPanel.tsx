"use client";

import { useMemo, useState } from "react";
import { UserCheck2, Users } from "lucide-react";
import { getTheme } from "@/lib/theme";
import BookingDetailsModal from "@/components/dashboard/bookings/BookingDetailsModal";
import {
  type DashboardBooking,
  resolvePrimaryServiceName,
} from "@/components/dashboard/bookings/bookingDisplay";

type StaffItem = {
  _id: string;
  name?: string;
  email?: string;
  services?: string[];
};

type ServiceItem = {
  _id: string;
  name?: string;
};

function getBookingServiceIds(booking: DashboardBooking): string[] {
  const fromServices = (booking.services || [])
    .map((s) => (typeof s.serviceId === "string" ? s.serviceId : s.serviceId?._id))
    .filter((id): id is string => Boolean(id));
  if (fromServices.length > 0) return fromServices;
  return [];
}

function toBookingDateTime(date?: string, time?: string) {
  if (!date || !time) return null;
  const value = new Date(`${date}T${time}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export default function BookingStaffAssignmentPanel({
  business,
  bookings,
  staffList,
  services,
}: {
  business: unknown;
  bookings: DashboardBooking[];
  staffList: StaffItem[];
  services: ServiceItem[];
}) {
  const theme = getTheme(business);
  const [selectedBooking, setSelectedBooking] = useState<DashboardBooking | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localBookings, setLocalBookings] = useState<DashboardBooking[]>(bookings);

  const serviceNameMap = useMemo(
    () => Object.fromEntries(services.map((s) => [s._id, s.name || "Service"])),
    [services]
  );

  const confirmed = useMemo(
    () =>
      localBookings.filter((b) => {
        if (b.status !== "confirmed") return false;

        const now = new Date();
        const bookingEnd = toBookingDateTime(b.date, b.endTime || b.startTime);
        if (!bookingEnd) return true;

        return bookingEnd.getTime() > now.getTime();
      }),
    [localBookings]
  );

  const eligibleStaff = (booking: DashboardBooking) => {
    const serviceIds = getBookingServiceIds(booking);
    if (serviceIds.length === 0) return staffList;
    return staffList.filter((staff) =>
      serviceIds.every((id) => (staff.services || []).includes(id))
    );
  };

  const assignStaff = async (bookingId: string, staffId: string) => {
    setSavingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: staffId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to assign staff");

      setLocalBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? {
                ...b,
                assignedTo: data.booking?.assignedTo
                  ? {
                      _id: data.booking.assignedTo._id,
                      name: data.booking.assignedTo.name,
                      email: data.booking.assignedTo.email,
                    }
                  : undefined,
                assignedAt: data.booking?.assignedAt,
              }
            : b
        )
      );
    } catch (error) {
      console.error(error);
      alert("Could not assign staff. Try again.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div
        className="rounded-2xl border p-4 md:p-5 space-y-4"
        style={{ borderColor: theme.primaryLight, backgroundColor: theme.backgroundSoft }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: theme.primaryDark }}>
              Staff Assignment
            </h3>
            <p className="text-sm" style={{ color: theme.accentDark }}>
              Assign staff to upcoming confirmed bookings. Staff email notifications are sent automatically.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border"
            style={{ borderColor: theme.primaryLight, color: theme.primaryDark }}
          >
            <Users size={12} />
            {confirmed.length} confirmed
          </span>
        </div>

        {confirmed.length === 0 ? (
          <p className="text-sm" style={{ color: theme.accentDark }}>
            No upcoming confirmed bookings available.
          </p>
        ) : (
          <div className="space-y-3">
            {confirmed.map((booking) => {
              const options = eligibleStaff(booking);
              const serviceIds = getBookingServiceIds(booking);
              const serviceLabel =
                serviceIds.length > 0
                  ? serviceIds.map((id) => serviceNameMap[id] || "Service").join(", ")
                  : resolvePrimaryServiceName(booking);

              return (
                <div
                  key={booking._id}
                  className="rounded-xl border bg-white p-3 md:p-4"
                  style={{ borderColor: theme.primaryLight }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="text-left min-w-0"
                    >
                      <p className="font-semibold truncate" style={{ color: theme.primaryDark }}>
                        {booking.customerName || "Customer"} • {booking.startTime} ({booking.date})
                      </p>
                      <p className="text-xs truncate" style={{ color: theme.accentDark }}>
                        {serviceLabel}
                      </p>
                    </button>

                    <div className="flex items-center gap-2">
                      <select
                        value={booking.assignedTo?._id || ""}
                        onChange={(e) => assignStaff(booking._id, e.target.value)}
                        className="rounded-lg border px-3 py-2 text-sm min-w-[220px] max-w-full bg-white"
                        style={{ borderColor: theme.primaryLight }}
                        disabled={savingId === booking._id}
                      >
                        <option value="">Unassigned</option>
                        {options.map((staff) => (
                          <option key={staff._id} value={staff._id}>
                            {staff.name || "Staff"}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs inline-flex items-center gap-1" style={{ color: theme.primary }}>
                        <UserCheck2 size={12} />
                        {booking.assignedTo?.name || "No assignee"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BookingDetailsModal
        booking={selectedBooking}
        business={business}
        onClose={() => setSelectedBooking(null)}
      />
    </>
  );
}
