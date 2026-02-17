"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTheme } from "@/lib/theme";

export default function BookingActions({
  booking,
  onUpdate,
  business,
}: {
  booking: any;
  onUpdate: (b: any) => void;
  business?: any;
}) {
  const theme = getTheme(business);
  const [loading, setLoading] = useState(false);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (booking.status !== "pending") return null;

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(true);
    try {
      const body: any = {};
      if (action === "reject") body.rejectionReason = rejectionReason;

      const res = await fetch(`/api/bookings/${booking._id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update booking");
        setLoading(false);
        return;
      }

      const data = await res.json();
      onUpdate(data.booking);
      setShowRejectPopup(false);
      setRejectionReason("");
    } catch (err) {
      console.error("Booking action error:", err);
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 relative">
      <Button
        size="sm"
        disabled={loading}
        onClick={() => handleAction("approve")}
        style={{ backgroundColor: theme.primary, color: "white" }}
      >
        {loading ? "Processing..." : "Approve"}
      </Button>

      <Button
        size="sm"
        disabled={loading}
        variant="outline"
        onClick={() => setShowRejectPopup(true)}
        style={{
          borderColor: theme.primary,
          color: theme.primaryDark,
          backgroundColor: theme.backgroundSoft,
        }}
      >
        Reject
      </Button>

      {showRejectPopup && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white border rounded shadow-md w-80 z-50">
          <h4 className="font-semibold mb-2">Rejection Reason</h4>
          <Input
            placeholder="Enter reason for rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button size="sm" variant="ghost" onClick={() => setShowRejectPopup(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              style={{ backgroundColor: theme.primary, color: "white" }}
              onClick={() => handleAction("reject")}
              disabled={loading || !rejectionReason.trim()}
            >
              {loading ? "Processing..." : "Reject"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
