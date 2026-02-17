"use client";

import { getTheme } from "@/lib/theme";

export default function BookingStatusBadge({
  status,
  business,
}: {
  status: string;
  business?: any;
}) {
  const theme = business
    ? getTheme(business)
    : { primary: "#FF7D00", accentDark: "#001524" };

  // Define colors for each status
  const styles: Record<
    string,
    { bg: string; text: string; label?: string }
  > = {
    pending: { bg: "#FEF3C7", text: "#92400E", label: "Pending approval" },
    pendingDeposit: { bg: "#FEE2E2", text: "#B91C1C", label: "Awaiting deposit" },
    confirmed: { bg: "#DCFCE7", text: "#166534", label: "Confirmed" },
    rejected: { bg: "#FECACA", text: "#991B1B", label: "Rejected" },
    cancelled: { bg: "#E5E7EB", text: "#6B7280", label: "Cancelled" },
    rescheduled: { bg: "#DBEAFE", text: "#1E3A8A", label: "Rescheduled" },
    refunded: { bg: "#F0FDF4", text: "#065F46", label: "Refunded" },
  };

  const style = styles[status] || { bg: "#E5E7EB", text: "#374151", label: status };

  return (
    <span
      className="px-2 py-1 rounded text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
      title={style.label} // tooltip
    >
      {status}
    </span>
  );
}
