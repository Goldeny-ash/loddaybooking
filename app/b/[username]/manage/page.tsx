"use client";

import ManageBookingClient from "@/components/public/ManageBookingClient";
import { useSearchParams } from "next/navigation";

export default function ManageBookingPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const token = searchParams.get("token");

  if (!bookingId || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-400">
        Invalid booking link
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <ManageBookingClient bookingId={bookingId} token={token} />
    </div>
  );
}
