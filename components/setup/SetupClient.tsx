"use client";

import { useEffect, useState } from "react";
import StaffSetup from "@/components/StaffSetup";
import ServiceSetup from "@/components/ServiceSetup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { Loader2, Check, X } from "lucide-react";

type Mode = "trial" | "subscribe";

interface BusinessForm {
  name: string;
  username: string;
  phone: string;
  email: string;
  logo: string;
  brandColor: string;
}

export default function SetupPage() {
  const router = useRouter();

  const [onboardingMode, setOnboardingMode] =
    useState<Mode>("trial");

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  const [phoneStatus, setPhoneStatus] = useState<
    "idle" | "valid" | "invalid"
  >("idle");

  const [emailStatus, setEmailStatus] = useState<
    "idle" | "valid" | "invalid"
  >("idle");

  const [businessForm, setBusinessForm] =
    useState<BusinessForm>({
      name: "",
      username: "",
      phone: "",
      email: "",
      logo: "",
      brandColor: "#FF7D00",
    });



  useEffect(() => {
    const saved = localStorage.getItem(
      "businessSetupDraft"
    );
    if (saved) setBusinessForm(JSON.parse(saved));
  }, []);

  const persistDraft = (data: BusinessForm) => {
    localStorage.setItem(
      "businessSetupDraft",
      JSON.stringify(data)
    );
  };

  const handleBusinessChange = (
    key: keyof BusinessForm,
    value: string
  ) => {
    const updated = {
      ...businessForm,
      [key]:
        key === "username"
          ? value
              .toLowerCase()
              .replace(/\s+/g, "-")
              .trim()
          : value,
    };
    setBusinessForm(updated);
    persistDraft(updated);
  };

  /* ================= USERNAME CHECK ================= */
  useEffect(() => {
    if (!businessForm.username) return;

    const timeout = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const res = await axios.get(
          `/api/business/check-username?username=${businessForm.username}`
        );
        setUsernameStatus(
          res.data.available
            ? "available"
            : "taken"
        );
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [businessForm.username]);

  /* ================= PHONE VALIDATION ================= */
  useEffect(() => {
    const phone = businessForm.phone;

    if (!phone) {
      setPhoneStatus("idle");
      return;
    }

    const isValid =
      /^(\+2547\d{8}|07\d{8})$/.test(phone);

    setPhoneStatus(isValid ? "valid" : "invalid");
  }, [businessForm.phone]);

  /* ================= EMAIL VALIDATION ================= */
  useEffect(() => {
    const email = businessForm.email;

    if (!email) {
      setEmailStatus("idle");
      return;
    }

    const isValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    setEmailStatus(isValid ? "valid" : "invalid");
  }, [businessForm.email]);

  const saveBusinessInfo = async () => {
    if (
      !businessForm.name ||
      !businessForm.username ||
      !businessForm.phone
    )
      return alert(
        "Name, username, and phone are required"
      );

    if (phoneStatus !== "valid")
      return alert(
        "Phone must start with +254 or 07"
      );

    if (
      businessForm.email &&
      emailStatus !== "valid"
    )
      return alert(
        "Please enter a valid email"
      );

    if (usernameStatus === "taken")
      return alert(
        "Username already taken"
      );

    setSaving(true);

    try {
      const res = await axios.post(
        "/api/business/setup",
        {
          ...businessForm,
          mode: onboardingMode,
        }
      );

      if (res.data.success)
        setStep(2);
    } catch (err: any) {
      alert(
        err?.response?.data?.error ||
          "Save failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const finishSetup = () => {
    if (onboardingMode === "subscribe") {
      router.push("/subscribe");
    } else {
      router.push("/dashboard");
    }
  };



  return (
    <div className="relative min-h-screen bg-[#F5EBDD] py-20 px-6">
      {/* Decorative Blobs */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-[#F3DCC4] rounded-full opacity-40 blur-3xl"></div>
      <div className="absolute bottom-10 right-20 w-60 h-60 bg-[#15616D] rounded-full opacity-10 blur-3xl"></div>

      <div className="relative max-w-5xl mx-auto bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl p-10 space-y-10">
        
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-serif text-[#001524]">
            Build Your Booking Engine.
          </h1>
          <p className="text-[#15616D]">
            Set up your business and start
            receiving bookings in minutes.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-3">
          {["Business", "Staff", "Services"].map(
            (label, i) => {
              const active =
                step === i + 1;
              return (
                <div
                  key={label}
                  className={`flex-1 text-center py-3 rounded-full text-sm font-medium transition ${
                    active
                      ? "bg-[#15616D] text-white shadow-md"
                      : "bg-[#F3DCC4] text-[#001524]"
                  }`}
                >
                  {label}
                </div>
              );
            }
          )}
        </div>

        {/* STEP 0 */}
        {step === 0 && (
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-semibold">
              Choose how to start
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div
                onClick={() =>
                  setOnboardingMode(
                    "trial"
                  )
                }
                className={`rounded-3xl p-8 shadow-lg hover:shadow-2xl transition cursor-pointer border-2 ${
                  onboardingMode ===
                  "trial"
                    ? "border-[#FF7D00] ring-2 ring-[#FF7D00]/30"
                    : "border-transparent"
                }`}
              >
                <h3 className="text-xl font-semibold">
                  14-Day Free Trial
                </h3>
                <p className="text-gray-500">
                  Try everything before
                  paying.
                </p>
              </div>

              <div
                onClick={() =>
                  setOnboardingMode(
                    "subscribe"
                  )
                }
                className={`rounded-3xl p-8 shadow-lg hover:shadow-2xl transition cursor-pointer border-2 ${
                  onboardingMode ===
                  "subscribe"
                    ? "border-[#FF7D00] ring-2 ring-[#FF7D00]/30"
                    : "border-transparent"
                }`}
              >
                <h3 className="text-xl font-semibold">
                  Subscribe Now
                </h3>
                <p className="text-gray-500">
                  Activate immediately.
                </p>
              </div>
            </div>

            <Button
              onClick={() =>
                setStep(1)
              }
              className="bg-[#FF7D00] text-white px-10 py-6 rounded-full text-lg"
            >
              Continue
            </Button>
          </div>
        )}

        {/* STEP 1 */}
{step === 1 && (
  <div className="space-y-6">

    {/* BUSINESS NAME */}
    <Input
      placeholder="Business Name"
      value={businessForm.name}
      onChange={(e) =>
        handleBusinessChange("name", e.target.value)
      }
    />

    {/* USERNAME */}
    <div className="relative space-y-1">
      <div className="relative">
        <Input
          placeholder="Username"
          value={businessForm.username}
          onChange={(e) =>
            handleBusinessChange("username", e.target.value)
          }
        />
        {usernameStatus === "checking" && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
        )}
        {usernameStatus === "available" && (
          <Check className="absolute right-3 top-3 h-4 w-4 text-green-600" />
        )}
        {usernameStatus === "taken" && (
          <X className="absolute right-3 top-3 h-4 w-4 text-red-600" />
        )}
      </div>

      {usernameStatus === "taken" && (
        <p className="text-xs text-red-500">
          Username already taken
        </p>
      )}
    </div>

    {/* PHONE */}
    <div className="relative space-y-1">
      <div className="relative">
        <Input
          placeholder="e.g. +254712345678 or 0712345678"
          value={businessForm.phone}
          onChange={(e) =>
            handleBusinessChange("phone", e.target.value)
          }
        />
        {phoneStatus === "valid" && (
          <Check className="absolute right-3 top-3 h-4 w-4 text-green-600" />
        )}
        {phoneStatus === "invalid" && (
          <X className="absolute right-3 top-3 h-4 w-4 text-red-600" />
        )}
      </div>

      {phoneStatus === "invalid" && (
        <p className="text-xs text-red-500">
          Input a valid phone number
        </p>
      )}
    </div>

    {/* EMAIL */}
    <div className="relative space-y-1">
      <div className="relative">
        <Input
          placeholder="e.g. name@email.com"
          value={businessForm.email}
          onChange={(e) =>
            handleBusinessChange("email", e.target.value)
          }
        />
        {emailStatus === "valid" && (
          <Check className="absolute right-3 top-3 h-4 w-4 text-green-600" />
        )}
        {emailStatus === "invalid" && (
          <X className="absolute right-3 top-3 h-4 w-4 text-red-600" />
        )}
      </div>

      {emailStatus === "invalid" && (
        <p className="text-xs text-red-500">
          Input a valid email address
        </p>
      )}
    </div>

    <ImageUpload
      value={businessForm.logo ? [businessForm.logo] : []}
      onChange={(urls) =>
        handleBusinessChange("logo", urls[0] || "")
      }
    />

    <div className="flex items-center gap-3">
      <label className="text-sm font-medium">
        Brand Color
      </label>
      <input
        type="color"
        value={businessForm.brandColor}
        onChange={(e) =>
          handleBusinessChange("brandColor", e.target.value)
        }
      />
    </div>

    <Button
      disabled={saving}
      onClick={saveBusinessInfo}
      className="bg-[#FF7D00] text-white rounded-full px-10 py-5"
    >
      {saving && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      Save & Continue
    </Button>
  </div>
)}
        {/* STEP 2 */}
        {step === 2 && (
          <>
            <StaffSetup />
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  setStep(1)
                }
              >
                Back
              </Button>
              <Button
                onClick={() =>
                  setStep(3)
                }
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <ServiceSetup />
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  setStep(2)
                }
              >
                Back
              </Button>
              <Button
                onClick={
                  finishSetup
                }
                className="bg-[#15616D] text-white rounded-full"
              >
                Finish Setup
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}