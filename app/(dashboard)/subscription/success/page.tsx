"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function SubscriptionSuccessPage() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    const checkStatus = async () => {
      const res = await axios.get("/api/subscription/status");
      if (res.data.status === "ACTIVE") {
        setStatus("Subscription Activated 🎉");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        setTimeout(checkStatus, 3000);
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <h1 className="text-2xl font-semibold">{status}</h1>
        <p className="text-sm text-gray-500 mt-2">
          Waiting for payment confirmation...
        </p>
      </div>
    </div>
  );
}
