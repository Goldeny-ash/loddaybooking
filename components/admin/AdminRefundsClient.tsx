"use client";
import { useState } from "react";
import axios from "axios";

interface RefundWithBooking {
  _id: string;
  amount: number;
  status: string;
  phoneNumber: string;
  bookingId: {
    _id: string;
    customerName: string;
    customerPhone: string;
    date: string;
    startTime: string;
    depositAmount: number;
    status: string;
  };
}

export default function AdminRefundsClient({ initialRefunds }: { initialRefunds: RefundWithBooking[] }) {
  const [refunds, setRefunds] = useState(initialRefunds);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  const approveRefund = async (id: string) => {
    setLoadingIds((prev) => [...prev, id]);
    try {
      await axios.post(`/api/admin/refunds/${id}/approve`);
      alert("Refund approved & sent!");
      setRefunds(refunds.map(r => r._id === id ? { ...r, status: "SENT" } : r));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed");
    } finally {
      setLoadingIds((prev) => prev.filter(x => x !== id));
    }
  };

  return (
    <div className="space-y-4">
      {refunds.map(refund => {
        const booking = refund.bookingId;
        const bookingDateTime = new Date(`${booking.date}T${booking.startTime}`);
        const isPastService = bookingDateTime < new Date();
        const isLoading = loadingIds.includes(refund._id);

        return (
          <div key={refund._id} className="border rounded p-4 flex justify-between">
            <div>
              <p>{booking.customerName} ({booking.customerPhone})</p>
              <p>Deposit: KES {booking.depositAmount}</p>
              <p>Status: {refund.status}</p>
              {isPastService && <p className="text-red-600">Service passed</p>}
            </div>
            {refund.status === "REQUESTED" && !isPastService && (
              <button
                disabled={isLoading}
                onClick={() => approveRefund(refund._id)}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                {isLoading ? "Processing..." : "Approve & Send"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
