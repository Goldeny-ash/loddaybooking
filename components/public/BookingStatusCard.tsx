"use client";

import React from "react";
import { CheckCircle, Clock, User } from "lucide-react";

interface Props {
  status: "pending" | "approved" | "confirmed" | "rejected";
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  whatsappShareUrl?: string;
}

export default function BookingStatusCard({
  status,
  customerName,
  serviceName,
  date,
  time,
  whatsappShareUrl,
}: Props) {
  const statusLabel =
    status === "pending"
      ? "Pending approval"
      : status === "approved" || status === "confirmed"
      ? "Confirmed"
      : "Rejected";

  const statusColor =
    status === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : status === "approved" || status === "confirmed"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

  return (
    <div className="max-w-md mx-auto p-6 border rounded shadow bg-white space-y-4 text-center">
      <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
      <h1 className="text-xl font-semibold">Booking Received!</h1>

      <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${statusColor}`}>
        {statusLabel}
      </div>

      <div className="space-y-1 mt-2 text-left">
        <p>
          <User className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>{customerName}</strong> booked <strong>{serviceName}</strong>
        </p>
        <p>
          <Clock className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>{date}</strong> at <strong>{time}</strong>
        </p>
      </div>

      {whatsappShareUrl && (
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Share on WhatsApp
        </a>
      )}
    </div>
  );
}
