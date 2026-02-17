"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RenewSubscriptionModal({
  businessId,
  onClose,
  onSuccess,
}: any) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  const formatPhone = (v: string) => {
    if (v.startsWith("0")) return `254${v.slice(1)}`;
    if (v.startsWith("+")) return v.replace("+", "");
    return v;
  };

  const initiate = async () => {
    setLoading(true);
    setError("");

    const res = await axios.post("/api/subscription/initiate", {
      businessId,
      phoneNumber: formatPhone(phone),
    });

    setReference(res.data.reference);
  };

  useEffect(() => {
    if (!reference) return;

    const timer = setInterval(async () => {
      const r = await axios.get(
        `/api/subscription/status?reference=${reference}`
      );

      if (r.data.status === "ACTIVE") {
        clearInterval(timer);
        onSuccess();
        onClose();
      }

      if (r.data.status === "FAILED") {
        setError("Payment failed. Try again.");
        setLoading(false);
        clearInterval(timer);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [reference]);

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 relative">

        {loading && (
          <div className="absolute inset-0 bg-white/80 grid place-items-center rounded-xl">
            <Loader2 className="animate-spin" />
          </div>
        )}

        <h2 className="text-xl font-semibold">Renew Subscription</h2>

        <div className="text-sm text-gray-500">
          KES 10 / month <br />
          Renews: {new Date().toDateString()}
        </div>

        <Input
          placeholder="07xxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <p className="text-xs text-gray-400">
          Payments secured by M-Pesa.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={initiate}
            disabled={loading || phone.length < 9}
          >
            Pay KES 10
          </Button>
        </div>
      </div>
    </div>
  );
}
