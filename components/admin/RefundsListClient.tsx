// app/admin/refunds/RefundsListClient.tsx
"use client";

import { useState } from "react";
import axios from "axios";

interface RefundWithBooking {
  _id: string;
  status: string;
  amount: number;
  bookingId: {
    _id: string;
    customerName: string;
    customerPhone: string;
    date: string;
    startTime: string;
    depositAmount: number;
  };
}

export default function RefundsList({ refunds }: { refunds: RefundWithBooking[] }) {
  const [localRefunds, setLocalRefunds] = useState(refunds);

  const approveRefund = async (id: string, bookingName: string, bookingPhone: string) => {
    try {
      console.log("[RefundsList] Approving refund ID:", id);

      const resp = await axios.post(`/api/admin/refunds/${id}/approve`);
      console.log("[RefundsList] PayHero response:", resp.data);

      if (resp.data.success) {
        setLocalRefunds((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: "SENT" } : r))
        );
        alert(`Refund approved & payout triggered for ${bookingName} (${bookingPhone})`);
      } else {
        console.warn("[RefundsList] PayHero returned error:", resp.data.error);
        alert(resp.data.error || "Failed to approve refund");
      }
    } catch (err: any) {
      console.error("[RefundsList] Approve Refund Error:", err?.response?.data || err?.message || err);
      alert(err?.response?.data?.error || err?.message || "Failed to approve refund");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Platform Refunds</h1>
      {localRefunds.length === 0 ? (
        <p>No refund requests found.</p>
      ) : (
        <div className="space-y-4">
          {localRefunds.map((refund) => {
            const booking = refund.bookingId;
            const bookingDateTime = new Date(`${booking.date}T${booking.startTime}`);
            const isPastService = bookingDateTime < new Date();

            return (
              <div
                key={refund._id}
                className="border rounded p-4 bg-white shadow flex flex-col md:flex-row justify-between items-start md:items-center"
              >
                <div className="flex-1 space-y-1">
                  <p>
                    <strong>Customer:</strong> {booking.customerName} ({booking.customerPhone})
                  </p>
                  <p>
                    <strong>Booking ID:</strong> {booking._id}
                  </p>
                  <p>
                    <strong>Service Date:</strong> {booking.date} at {booking.startTime}
                  </p>
                  <p>
                    <strong>Deposit Amount:</strong> KES {booking.depositAmount}
                  </p>
                  <p>
                    <strong>Refund Status:</strong> {refund.status}
                  </p>
                  {isPastService && <p className="text-red-600 font-bold">⚠️ Service slot has passed</p>}
                </div>

                {refund.status === "REQUESTED" && !isPastService && (
                  <button
                    onClick={() =>
                      approveRefund(refund._id, booking.customerName, booking.customerPhone)
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-2 md:mt-0"
                  >
                    Approve & Send
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
