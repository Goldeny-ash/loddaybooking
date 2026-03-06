"use client";

import { useState } from "react";
import axios from "axios";

interface RefundType {
  _id: string;
  status: string;
  amount: number;
  phoneNumber: string;
  bookingId: any;
  depositId: any;
}

export default function RefundsList({ refunds }: { refunds: RefundType[] }) {
  const [localRefunds, setLocalRefunds] = useState(refunds);

  const updateStatus = (id: string, status: string) => {
    setLocalRefunds((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status } : r))
    );
  };

  const approveRefund = async (id: string) => {
    try {
      const resp = await axios.post(`/api/admin/refunds/${id}/approve`);
      if (resp.data.success) {
        updateStatus(id, "SENT");
      } else {
        alert(resp.data.error);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Approval failed");
    }
  };

  const refuseRefund = async (id: string) => {
    try {
      await axios.post(`/api/admin/refunds/${id}/refuse`);
      updateStatus(id, "FAILED");
    } catch {
      alert("Failed to refuse refund");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Platform Refunds</h1>

      {localRefunds.length === 0 && <p>No refund requests.</p>}

      <div className="space-y-4">
        {localRefunds.map((refund) => {
          const booking = refund.bookingId;
          const deposit = refund.depositId;

          return (
            <div
              key={refund._id}
              className="border rounded p-5 bg-white shadow"
            >
              <div className="space-y-1">
                <p>
                  <strong>Customer:</strong> {booking.customerName}
                </p>
                <p>
                  <strong>Phone:</strong> {refund.phoneNumber}
                </p>
                <p>
                  <strong>Booking ID:</strong> {booking._id}
                </p>
                <p>
                  <strong>Deposit:</strong> KES {deposit.amount}
                </p>
                <p>
                  <strong>Refund Amount:</strong> KES {refund.amount}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="font-semibold">{refund.status}</span>
                </p>
              </div>

              {refund.status === "REQUESTED" && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => approveRefund(refund._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Approve & Send
                  </button>

                  <button
                    onClick={() => refuseRefund(refund._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded"
                  >
                    Refuse
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
