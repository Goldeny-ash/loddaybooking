"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, RefreshCw, Smartphone } from "lucide-react";

const BASE_SUBSCRIPTION_AMOUNT = 600;
const CHECKOUT_STORAGE_KEY = "lodday_subscription_checkout";

type SubscriptionStatus = "IDLE" | "PENDING" | "ACTIVE" | "FAILED";

type CheckoutDraft = {
  phoneNumber?: string;
  businessName?: string;
  source?: string;
};

function formatPhoneInput(value: string) {
  return value.replace(/[^\d+]/g, "").slice(0, 13);
}

function normalizePhone(value: string) {
  const cleaned = value.trim().replace(/\s+/g, "");
  if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;
  return cleaned.replace("+", "");
}

export default function SubscriptionSuccessClient({
  source,
}: {
  source?: string;
}) {
  const router = useRouter();
  const fromSetup = source === "setup";

  const [phoneNumber, setPhoneNumber] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [businessName, setBusinessName] = useState("your business");
  const [amount, setAmount] = useState(BASE_SUBSCRIPTION_AMOUNT);
  const [mobileTariff, setMobileTariff] = useState(0);
  const [status, setStatus] = useState<SubscriptionStatus>("IDLE");
  const [reference, setReference] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Enter the M-Pesa number that should receive the STK prompt."
  );
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const [retryReady, setRetryReady] = useState(false);

  const pollingTimeoutRef = useRef<number | null>(null);
  const pollingDeadlineRef = useRef<number | null>(null);

  const total = amount + mobileTariff;

  const clearPollingTimer = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  };

  const clearCheckoutDraft = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CHECKOUT_STORAGE_KEY);
    }
  };

  const beginPolling = () => {
    clearPollingTimer();
    pollingDeadlineRef.current = Date.now() + 3 * 60 * 1000;
    setPolling(true);
    setRetryReady(false);
    setStatus("PENDING");
    setStatusMessage("Waiting for payment confirmation from M-Pesa.");

    const tick = async () => {
      try {
        const res = await axios.get("/api/subscription/status");
        const nextStatus = String(res.data?.status || "");

        if (nextStatus === "ACTIVE") {
          clearPollingTimer();
          setPolling(false);
          setStatus("ACTIVE");
          setError("");
          setRetryReady(false);
          setStatusMessage("Payment confirmed. Redirecting you to the dashboard.");
          clearCheckoutDraft();
          window.setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
          return;
        }

        if (nextStatus === "FAILED") {
          clearPollingTimer();
          setPolling(false);
          setStatus("FAILED");
          setRetryReady(true);
          setStatusMessage("The last payment attempt did not complete.");
          setError("The payment failed or was cancelled. You can try again.");
          return;
        }

        if (pollingDeadlineRef.current && Date.now() > pollingDeadlineRef.current) {
          clearPollingTimer();
          setPolling(false);
          setRetryReady(true);
          setStatus("FAILED");
          setStatusMessage("We have not received confirmation yet.");
          setError("The confirmation is taking too long. You can retry payment safely.");
          return;
        }

        pollingTimeoutRef.current = window.setTimeout(tick, 3000);
      } catch {
        pollingTimeoutRef.current = window.setTimeout(tick, 3000);
      }
    };

    void tick();
  };

  const loadLatestStatus = async () => {
    try {
      const res = await axios.get("/api/subscription/status");
      const nextStatus = String(res.data?.status || "");
      const subscription = res.data?.subscription;

      if (subscription?.phoneNumber && !phoneNumber) {
        setPhoneNumber(subscription.phoneNumber);
      }
      if (typeof subscription?.amount === "number") {
        setAmount(subscription.amount);
      }
      if (subscription?.externalReference) {
        setReference(subscription.externalReference);
      }

      if (nextStatus === "ACTIVE") {
        setStatus("ACTIVE");
        setStatusMessage("Your subscription is already active. Redirecting to the dashboard.");
        clearCheckoutDraft();
        window.setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
        return;
      }

      if (nextStatus === "PENDING") {
        setStatus("PENDING");
        setStatusMessage("A payment request is already in progress on your phone.");
        beginPolling();
        return;
      }

      if (nextStatus === "FAILED") {
        setStatus("FAILED");
        setRetryReady(true);
        setStatusMessage("The last subscription payment did not complete.");
        return;
      }
    } catch {
      // Keep checkout available even if status lookup fails.
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedDraft = window.localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!savedDraft) {
      void loadLatestStatus();
      return;
    }

    try {
      const parsed = JSON.parse(savedDraft) as CheckoutDraft;
      if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
      if (parsed.businessName) setBusinessName(parsed.businessName);
    } catch {
      window.localStorage.removeItem(CHECKOUT_STORAGE_KEY);
    }

    void loadLatestStatus();

    return () => {
      clearPollingTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      clearPollingTimer();
    };
  }, []);

  const startPayment = async () => {
    if (loading || polling) return;

    if (normalizePhone(phoneNumber).length < 12) {
      setError("Enter a valid Safaricom M-Pesa number like 07XXXXXXXX.");
      return;
    }

    setLoading(true);
    setError("");
    setRetryReady(false);

    try {
      const res = await axios.post("/api/subscription/start", {
        phoneNumber,
        affiliateCode: affiliateCode || undefined,
      });

      setAmount(Number(res.data?.amount || BASE_SUBSCRIPTION_AMOUNT));
      setMobileTariff(Number(res.data?.mobileTariff || 0));
      setReference(String(res.data?.reference || ""));
      setStatus("PENDING");
      setStatusMessage("STK prompt sent. Approve it on your phone to activate your subscription.");

      beginPolling();
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error ===
          "string"
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
            "We could not start the payment request."
          : "We could not start the payment request.";
      setStatus("FAILED");
      setRetryReady(true);
      setError(message);
      setStatusMessage("Payment could not be started.");
    } finally {
      setLoading(false);
    }
  };

  const retryPayment = async () => {
    clearPollingTimer();
    setPolling(false);
    setMobileTariff(0);
    setReference("");
    await startPayment();
  };

  const continueWithTrial = () => {
    clearCheckoutDraft();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f6f0e8_38%,_#efe2d1_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-[0_25px_80px_rgba(0,21,36,0.12)] backdrop-blur">
          <div className="bg-[linear-gradient(135deg,#001524,#15616D_55%,#2A8F9D)] px-6 py-8 text-white sm:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm">
              <Smartphone className="h-4 w-4" />
              Secure M-Pesa checkout
            </div>
            <h1 className="max-w-xl text-3xl font-semibold sm:text-4xl">
              Finish activating {businessName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
              Review your subscription, enter the number that should receive the STK prompt, and
              confirm payment when you are ready.
            </p>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
            <div className="grid gap-4 rounded-[28px] bg-[#FFF8F1] p-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Plan</p>
                <p className="mt-2 text-lg font-semibold text-[#001524]">Monthly access</p>
                <p className="text-sm text-[#4B5563]">Everything you need to run bookings.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Subscription</p>
                <p className="mt-2 text-lg font-semibold text-[#001524]">KES {amount}</p>
                <p className="text-sm text-[#4B5563]">Billed once payment is confirmed.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Provider tariff</p>
                <p className="mt-2 text-lg font-semibold text-[#001524]">
                  {mobileTariff > 0 ? `KES ${mobileTariff}` : "Fetched at payment"}
                </p>
                <p className="text-sm text-[#4B5563]">
                  We will add the mobile charge to your total automatically.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#E5D6C7] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#001524]">Checkout details</h2>
                  <p className="mt-1 text-sm text-[#5B6470]">{statusMessage}</p>
                </div>
                {status === "ACTIVE" ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Active
                  </span>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="subscription-phone" className="text-sm font-medium text-[#001524]">
                    M-Pesa phone number
                  </label>
                  <Input
                    id="subscription-phone"
                    placeholder="07XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                    disabled={loading || polling}
                    className="h-12 rounded-2xl border-[#D5C2B0] bg-[#FFFDF9]"
                  />
                  <p className="text-sm text-[#6B7280]">
                    Use the number that should receive and approve the STK push.
                  </p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label
                    htmlFor="affiliate-code"
                    className="text-sm font-medium text-[#001524]"
                  >
                    Affiliate code
                  </label>
                  <Input
                    id="affiliate-code"
                    placeholder="Optional referral code"
                    value={affiliateCode}
                    onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
                    disabled={loading || polling}
                    className="h-12 rounded-2xl border-[#D5C2B0] bg-[#FFFDF9]"
                  />
                  <p className="text-sm text-[#6B7280]">
                    If valid, the discount is applied before the provider tariff is added.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] bg-[#001524] p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/70">Amount to approve</p>
                    <p className="mt-2 text-3xl font-semibold">KES {total}</p>
                  </div>
                  {loading || polling ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {loading ? "Sending prompt" : "Checking status"}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 space-y-2 text-sm text-white/75">
                  <p>Subscription: KES {amount}</p>
                  <p>Mobile tariff: {mobileTariff > 0 ? `KES ${mobileTariff}` : "Added after prompt"}</p>
                  {reference ? <p>Reference: {reference}</p> : null}
                </div>
              </div>

              {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={startPayment}
                  disabled={loading || polling}
                  className="h-12 flex-1 rounded-full bg-[#FF7D00] text-white hover:bg-[#E56F00]"
                >
                  {loading ? "Sending STK prompt..." : "Pay Now"}
                </Button>

                {retryReady ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={retryPayment}
                    disabled={loading}
                    className="h-12 rounded-full border-[#15616D] text-[#15616D]"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Payment
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                  className="h-12 rounded-full text-[#001524]"
                >
                  Back to dashboard
                </Button>
              </div>

              {fromSetup ? (
                <div className="mt-6 rounded-[24px] border border-[#D6EAE7] bg-[#F3FBFA] p-4">
                  <h3 className="text-base font-semibold text-[#001524]">Need more time first?</h3>
                  <p className="mt-2 text-sm text-[#4B5563]">
                    Your business has already been created on the free trial. You can continue to
                    the dashboard now and subscribe later when you are ready.
                  </p>
                  <Button
                    type="button"
                    onClick={continueWithTrial}
                    variant="outline"
                    className="mt-4 h-11 rounded-full border-[#15616D] text-[#15616D]"
                  >
                    Continue With Free Trial
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(0,21,36,0.08)] backdrop-blur">
            <h2 className="text-lg font-semibold text-[#001524]">What happens next</h2>
            <div className="mt-4 space-y-4 text-sm text-[#4B5563]">
              <p>1. Tap Pay Now to send an M-Pesa prompt to the number above.</p>
              <p>2. Approve the request on your phone.</p>
              <p>3. We keep checking automatically and activate your subscription once payment clears.</p>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#E7D8C9] bg-[#FFF9F2] p-6 shadow-[0_18px_60px_rgba(0,21,36,0.06)]">
            <h2 className="text-lg font-semibold text-[#001524]">Helpful notes</h2>
            <div className="mt-4 space-y-3 text-sm text-[#4B5563]">
              <p>The mobile tariff is charged by the payment provider and appears after the request starts.</p>
              <p>If the prompt expires or fails, use Retry Payment to send a fresh request.</p>
              <p>You can safely leave this page after activation. We will redirect you automatically.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
