"use client";

import { useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DepositModal({
  bookingId,
  amount,
  serviceName,
  calloutFee = 0,
  onSuccess,
  onClose,
}: any) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [externalReference, setExternalReference] = useState("");
  const [status, setStatus] =
    useState<"PENDING" | "PAID" | "FAILED" | null>(null);
  const [error, setError] = useState("");

  const total = amount + (calloutFee || 0);

  const formatPhone = (v: string) =>
    v.startsWith("0") ? `254${v.slice(1)}` : v.replace("+", "");

  // --------------------------------------------
  // INITIATE PAYMENT
  // --------------------------------------------

  const initiate = async () => {
    if (!phone || phone.length < 9) {
      setError("Enter a valid phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/bookings/deposit/initiate", {
        bookingId,
        phoneNumber: formatPhone(phone),
        amount: total,
      });

      setExternalReference(res.data.externalReference);
      setStatus("PENDING");

      pollDeposit(res.data.externalReference);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    }
  };

  // --------------------------------------------
  // POLL STATUS
  // --------------------------------------------

  const pollDeposit = (ref: string) => {
    const start = Date.now();

    const interval = setInterval(async () => {
      try {
        if (Date.now() - start > 180_000) {
          clearInterval(interval);
          setLoading(false);
          setStatus(null);
          setError("Payment timed out. Please try again.");
          return;
        }

        const r = await axios.get(
          `/api/bookings/deposit/status?token=${ref}`
        );

        if (r.data.status === "PAID") {
          clearInterval(interval);
          setLoading(false);
          setStatus("PAID");
          onSuccess();
          onClose();
        }

        if (r.data.status === "FAILED") {
          clearInterval(interval);
          setLoading(false);
          setStatus("FAILED");
          setError("Payment failed. Please try again.");
        }
      } catch {
        //
      }
    }, 3000);
  };

  // --------------------------------------------

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <div className="bg-black rounded-2xl p-6 w-full max-w-md space-y-5 shadow-xl relative">

        {loading && (
          <div className="absolute inset-0 bg-white/80 grid place-items-center rounded-2xl">
            <Loader2 className="animate-spin w-6 h-6" />
          </div>
        )}

        <h2 className="text-2xl font-semibold">
          Pay Deposit
        </h2>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium">{serviceName}</p>
          <p>Deposit: KES {amount}</p>
          {calloutFee > 0 && <p>Call-out fee: KES {calloutFee}</p>}
          <p className="font-semibold mt-1">Total: KES {total}</p>
        </div>

        {!externalReference && (
          <Input
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}

        {status === "PENDING" && (
          <p className="text-blue-600 text-sm">
            Waiting for mobile payment confirmation…
          </p>
        )}

        {status === "FAILED" && (
          <p className="text-red-600 text-sm">
            Payment failed. Try again.
          </p>
        )}

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </Button>

          {!externalReference ? (
            <Button
              onClick={initiate}
              disabled={loading || phone.length < 9}
            >
              Pay KES {total}
            </Button>
          ) : (
            <Button disabled>
              Processing…
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
