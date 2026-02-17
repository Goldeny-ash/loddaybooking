"use client";

import { useState, useEffect, useCallback } from "react";
import { format, isToday, isThisWeek, parseISO } from "date-fns";
import BookingsFilter from "./BookingsFilter";
import BookingStatusBadge from "@/components/dashboard/bookings/BookingStatusBadge";
import BookingActions from "@/components/dashboard/bookings/BookingActions";

interface BookingsTableProps {
  businessId: string;
  initialBookings?: any[];
}

export default function BookingsTable({
  businessId,
  initialBookings = [],
}: BookingsTableProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [activeFilters, setActiveFilters] = useState<any>({});

  // ---------------- FETCHER ----------------

  const fetchFilteredBookings = useCallback(
    async (filters: any, pageOverride?: number) => {
      const controller = new AbortController();

      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.append("businessId", businessId);

        Object.entries(filters || {}).forEach(([key, value]) => {
          if (value) params.append(key, String(value));
        });

        params.append("page", String(pageOverride ?? page));
        params.append("pageSize", String(pageSize));

        const res = await fetch(
          `/api/bookings/filter?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          console.error(await res.json());
          setBookings([]);
          return;
        }

        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Booking fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    },
    [businessId, page, pageSize]
  );

  // ---------------- INITIAL LOAD ----------------

  useEffect(() => {
    if (!initialBookings.length) {
      fetchFilteredBookings({}, 1);
    }
  }, []);

  // ---------------- PAGE CHANGE ----------------

  useEffect(() => {
    fetchFilteredBookings(activeFilters);
  }, [page]);

  // ---------------- FILTER HANDLER ----------------

  const handleFilter = (filters: any) => {
    setPage(1);
    setActiveFilters(filters);
    fetchFilteredBookings(filters, 1);
  };

  // ---------------- UI HELPERS ----------------

  const updateBooking = (updated: any) => {
    setBookings((prev) =>
      prev.map((b) => (b._id === updated._id ? updated : b))
    );
  };

  const relativeDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return `Today ${format(date, "hh:mm a")}`;
    if (isThisWeek(date)) return `This Week ${format(date, "EEE hh:mm a")}`;
    return format(date, "MMM dd yyyy hh:mm a");
  };

  return (
    <div>
      <BookingsFilter onFilter={handleFilter} />

      <div className="overflow-x-auto rounded shadow relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {["Date", "Customer", "Service", "Staff", "Status", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-medium uppercase"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {bookings.length ? (
              bookings.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{relativeDate(b.date)}</td>
                  <td className="px-4 py-2">{b.customerName}</td>
                  <td className="px-4 py-2">{b.serviceId?.name}</td>
                  <td className="px-4 py-2">{b.staffId?.name}</td>
                  <td className="px-4 py-2">
                    <BookingStatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-2">
                    <BookingActions booking={b} onUpdate={updateBooking} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-2 text-center">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}

      <div className="flex justify-end mt-3 gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 rounded border"
        >
          Previous
        </button>

        <span className="px-3 py-1">{page}</span>

        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 rounded border"
        >
          Next
        </button>
      </div>
    </div>
  );
}
