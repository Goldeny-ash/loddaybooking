"use client";

import { useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DepositModal({
  bookingId,
  token,
  amount,
  serviceName,
  calloutFee = 0,
  onSuccess,
  onClose,
}: {
  bookingId: string;
  token?: string;
  amount: number;
  serviceName: string;
  calloutFee?: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [externalReference, setExternalReference] = useState("");
  const [status, setStatus] = useState<"PENDING" | "PAID" | "FAILED" | null>(null);
  const [error, setError] = useState("");
  const [retryAllowed, setRetryAllowed] = useState(false);
  const [polling, setPolling] = useState(false);
  const [providerTariff, setProviderTariff] = useState(0);

  const mobileTariff = (calloutFee || 0) + providerTariff;
  const total = amount + mobileTariff;
  const formatPhone = (v: string) =>
    v.startsWith("0") ? `254${v.slice(1)}` : v.replace("+", "");

  const initiate = async () => {
    if (loading || polling) return;

    if (!phone || phone.length < 9) {
      setError("Enter a valid phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/bookings/deposit/initiate", {
        bookingId,
        token,
        phoneNumber: formatPhone(phone),
        amount: total,
      });

      setProviderTariff(Number(res.data?.mobileTariff || 0));
      setExternalReference(res.data.externalReference);
      setStatus("PENDING");
      setPolling(true);

      pollDeposit(res.data.externalReference);
    } catch (err: unknown) {
      const apiMessage =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error ===
          "string"
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Payment error";
      const message = apiMessage ?? "Payment error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const pollDeposit = (ref: string) => {
    const start = Date.now();

    const interval = setInterval(async () => {
      const elapsed = Date.now() - start;

      if (elapsed > 180000) {
        clearInterval(interval);
        setPolling(false);
        setRetryAllowed(true);
        setError("Payment timed out. Retry?");
        return;
      }

      const r = await axios.get(`/api/bookings/deposit/status?token=${ref}`);

      if (r.data.status === "PAID") {
        clearInterval(interval);
        setPolling(false);
        onSuccess();
        onClose();
      }

      if (r.data.status === "FAILED") {
        clearInterval(interval);
        setPolling(false);
        setRetryAllowed(true);
        setError("Payment failed. Retry?");
      }
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm px-4 py-8 grid place-items-center">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--brand-primary-light)] bg-white p-6 text-gray-900 shadow-xl">
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/80">
            <Loader2 className="animate-spin w-6 h-6" />
          </div>
        )}

        <h2
          className="text-2xl font-semibold"
          style={{ color: "var(--brand-primary-dark)" }}
        >
          Pay Deposit
        </h2>

        <div className="mt-4 text-sm" style={{ color: "var(--brand-accent-dark)" }}>
          <p className="font-medium">{serviceName}</p>
          <p>Deposit: KES {amount}</p>
          {mobileTariff > 0 && <p>Mobile tariff: KES {mobileTariff}</p>}
          <p className="mt-1 font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
            Total: KES {total}
          </p>
        </div>

        {!externalReference && (
          <Input
            className="mt-4"
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}

        {status === "PENDING" && (
          <p className="mt-3 text-sm text-blue-600">
            Waiting for mobile payment confirmation...
          </p>
        )}

        {status === "FAILED" && (
          <p className="text-red-600 text-sm">
            Payment failed. Try again.
          </p>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Close
          </Button>

          {retryAllowed && (
            <Button
              onClick={() => {
                setRetryAllowed(false);
                initiate();
              }}
            >
              Retry Payment
            </Button>
          )}

          <Button onClick={initiate} disabled={loading || polling || phone.length < 9}>
            {loading ? "Processing..." : `Pay KES ${total}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
