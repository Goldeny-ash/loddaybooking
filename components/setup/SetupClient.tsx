"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { useUser } from "@clerk/nextjs";
import { kenyaAdministrative } from "@/lib/constants/kenyaAdministrative";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";

type Mode = "trial" | "subscribe";

const DAYS = [
  "Monday","Tuesday","Wednesday",
  "Thursday","Friday","Saturday","Sunday",
];

export default function SetupPage() {
  const router = useRouter();
  const { user } = useUser();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<Mode>("trial");
  const [affiliateCode, setAffiliateCode] = useState("");

  const [popup, setPopup] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const showPopup = (message: string) => {
    setPopup(message);
    setTimeout(() => setPopup(null), 2500);
  };

  /* ================= PERSONAL ================= */

  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const personalWithDefaults = {
    firstName: personal.firstName || user?.firstName || "",
    lastName: personal.lastName || user?.lastName || "",
    email:
      personal.email || user?.primaryEmailAddress?.emailAddress || "",
    phone: personal.phone,
  };

  /* ================= BUSINESS ================= */

  const [business, setBusiness] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    logo: "",
    description: "",
    county: "",
    subCounty: "",
    ward: "",
    locationDescription: "",
  });

  const [usernameEdited, setUsernameEdited] = useState(false);

  const selectedCounty = kenyaAdministrative.find(
    (c) => c.county === business.county
  );
  const subCountyOptions = selectedCounty?.subCounties ?? [];
  const selectedSubCounty = subCountyOptions.find(
    (s) => s.name === business.subCounty
  );
  const wardOptions = selectedSubCounty?.wards ?? [];
  const requiresWard = wardOptions.length > 0;

  const slugifyUsername = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .trim();

  /* ================= OPENING HOURS ================= */

  const [openingHours, setOpeningHours] = useState<
    Record<string, { open: string; close: string; closed: boolean }>
  >({});

  /* ================= USERNAME CHECK ================= */

  const [usernameStatus, setUsernameStatus] =
    useState<"idle" | "checking" | "available" | "taken">("idle");
  const [businessNameStatus, setBusinessNameStatus] =
    useState<"idle" | "checking" | "available" | "taken">("idle");
  const lastUsernameNoticeRef = useRef("");
  const lastBusinessNameNoticeRef = useRef("");

  useEffect(() => {
    if (!business.username) {
      return;
    }

    const timeout = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const res = await axios.get(
          `/api/business/check-username?username=${business.username}`
        );
        const nextStatus: "available" | "taken" =
          res.data.available ? "available" : "taken";
        setUsernameStatus(nextStatus);

        const noticeKey = `${business.username}:${nextStatus}`;
        if (lastUsernameNoticeRef.current !== noticeKey) {
          showPopup(
            nextStatus === "available"
              ? `Username "@${business.username}" is available.`
              : `Username "@${business.username}" is not available.`
          );
          lastUsernameNoticeRef.current = noticeKey;
        }
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [business.username]);

  useEffect(() => {
    if (!business.name.trim()) {
      return;
    }

    const timeout = setTimeout(async () => {
      setBusinessNameStatus("checking");
      try {
        const res = await axios.get(
          `/api/business/check-name?name=${encodeURIComponent(business.name)}`
        );
        const nextStatus: "available" | "taken" =
          res.data.available ? "available" : "taken";
        setBusinessNameStatus(nextStatus);

        const noticeKey = `${business.name}:${nextStatus}`;
        if (lastBusinessNameNoticeRef.current !== noticeKey) {
          showPopup(
            nextStatus === "available"
              ? `Business name "${business.name}" is available.`
              : `Business name "${business.name}" is not available.`
          );
          lastBusinessNameNoticeRef.current = noticeKey;
        }
      } catch {
        setBusinessNameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [business.name]);

  /* ================= VALIDATION ================= */

  const isKenyanPhone = (phone: string) =>
    /^(\+2547\d{8}|07\d{8})$/.test(phone);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* ================= SAVE PERSONAL ================= */

  const savePersonal = async () => {
    if (!isKenyanPhone(personalWithDefaults.phone))
      return showPopup("Enter valid Kenyan phone number.");

    if (!isValidEmail(personalWithDefaults.email))
      return showPopup("Enter valid email address.");

    try {
      await axios.post("/api/user", personalWithDefaults);
      setStep(2);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string } | undefined)?.error
        : undefined;
      showPopup(message || "Failed to save personal details.");
    }
  };

  /* ================= SAVE BUSINESS ================= */

  const saveBusiness = async () => {
    if (usernameStatus !== "available")
      return showPopup("Username unavailable.");

    if (businessNameStatus !== "available")
      return showPopup("Business name unavailable.");

    if (!isKenyanPhone(business.phone))
      return showPopup("Invalid business phone number.");

    if (business.email && !isValidEmail(business.email))
      return showPopup("Invalid business email.");

    if (!business.county || !business.subCounty)
      return showPopup("Please select county and sub-county.");

    if (requiresWard && !business.ward)
      return showPopup("Please select ward.");

    setSaving(true);

    try {
      const payload = {
        ...business,
        openingHours,
        location: {
          county: business.county,
          subCounty: business.subCounty,
          ward: requiresWard ? business.ward : "",
          locationDescription:
            business.locationDescription,
          countyOptions: kenyaAdministrative.map((c) => c.county),
          subCountyOptions: subCountyOptions.map((s) => s.name),
          wardOptions,
        },
        mode: onboardingMode,
      };

      const res = await axios.post(
        "/api/business/setup",
        payload
      );

      if (res.data.success) {
        setSuccess(true);

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#FF7D00", "#15616D", "#F3DCC4"],
        });

        setTimeout(async () => {
          if (onboardingMode === "subscribe") {
            try {
              const sub = await axios.post(
                "/api/subscription/start",
                { phoneNumber: business.phone, affiliateCode: affiliateCode || undefined }
              );
              if (!sub.data?.success) throw new Error("Subscription start failed");
              window.location.href = "/subscription/success";
            } catch {
              router.push("/dashboard");
            }
          } else {
            router.push("/dashboard");
          }
        }, 900);
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string } | undefined)?.error
        : undefined;
      showPopup(message || "Business setup failed.");
    } finally {
      setSaving(false);
    }
  };

  /* ================= COPY MONDAY ================= */

  const copyMondayToAll = () => {
    const monday = openingHours["Monday"];

    if (!monday || (!monday.open && !monday.close && !monday.closed)) {
      showPopup("Set Monday hours first.");
      return;
    }

    const updated: typeof openingHours = {};

    DAYS.forEach((day) => {
      updated[day] = {
        open: monday.open || "",
        close: monday.close || "",
        closed: monday.closed || false,
      };
    });

    setOpeningHours(updated);
  };

  const getStatusBadge = (
    status: "idle" | "checking" | "available" | "taken",
    availableText: string,
    takenText: string
  ) => {
    if (status === "idle") return null;
    if (status === "checking") {
      return (
        <span className="text-xs rounded-full px-3 py-1 bg-amber-100 text-amber-800">
          Checking...
        </span>
      );
    }
    if (status === "available") {
      return (
        <span className="text-xs rounded-full px-3 py-1 bg-green-100 text-green-700">
          {availableText}
        </span>
      );
    }
    return (
      <span className="text-xs rounded-full px-3 py-1 bg-red-100 text-red-700">
        {takenText}
      </span>
    );
  };

  /* ================= UI ================= */

  return (
    <div className="relative min-h-screen bg-[#F5EBDD] py-20 px-6">
      <div className="relative max-w-5xl mx-auto bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl p-10 space-y-10">

        {/* SUCCESS OVERLAY */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#001524]/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl px-12 py-10 text-center shadow-2xl"
              >
                <div className="text-3xl font-semibold text-[#15616D] mb-2">
                  🎉 Setup Complete
                </div>
                <div className="text-gray-500">
                  Redirecting to your dashboard...
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* POPUP */}
        <AnimatePresence>
          {popup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 flex items-center justify-center z-50"
            >
              <div className="bg-[#001524] text-white px-10 py-6 rounded-3xl shadow-2xl text-lg text-center">
                {popup}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-serif text-[#001524]">
            Build Your Booking Engine.
          </h1>
          <p className="text-[#15616D]">
            Set up your business and start receiving bookings in minutes.
          </p>
        </div>

        {/* STEP INDICATOR */}
        <div className="flex gap-3">
          {["Plan", "Personal", "Business"].map((label, i) => (
            <div
              key={label}
              className={`flex-1 text-center py-3 rounded-full text-sm font-medium ${
                step === i
                  ? "bg-[#15616D] text-white shadow-md"
                  : "bg-[#F3DCC4] text-[#001524]"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* PLAN STEP */}
        {step === 0 && (
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-semibold">
              Choose how to start
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div
                onClick={() => setOnboardingMode("trial")}
                className={`rounded-3xl p-8 shadow-lg cursor-pointer border-2 ${
                  onboardingMode === "trial"
                    ? "border-[#FF7D00] ring-2 ring-[#FF7D00]/30"
                    : "border-transparent"
                }`}
              >
                <h3 className="text-xl font-semibold">
                  14-Day Free Trial
                </h3>
                <p className="text-gray-500">
                  Try everything before paying.
                </p>
              </div>

              <div
                onClick={() => setOnboardingMode("subscribe")}
                className={`rounded-3xl p-8 shadow-lg cursor-pointer border-2 ${
                  onboardingMode === "subscribe"
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

            {onboardingMode === "subscribe" && (
              <Input
                placeholder="Affiliate code (optional)"
                value={affiliateCode}
                onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
              />
            )}

            <Button
              onClick={() => setStep(1)}
              className="bg-[#FF7D00] text-white px-10 py-6 rounded-full text-lg"
            >
              Continue
            </Button>
          </div>
        )}

        {/* PERSONAL STEP */}
        {step === 1 && (
          <div className="space-y-6">
            <Input
              placeholder="First Name"
              value={personalWithDefaults.firstName}
              onChange={(e) =>
                setPersonal(prev => ({
                  ...prev,
                  firstName: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Last Name"
              value={personalWithDefaults.lastName}
              onChange={(e) =>
                setPersonal(prev => ({
                  ...prev,
                  lastName: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Email"
              value={personalWithDefaults.email}
              onChange={(e) =>
                setPersonal(prev => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
            />
            <Input
              placeholder="+2547XXXXXXXX"
              value={personal.phone}
              onChange={(e) =>
                setPersonal(prev => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button
                onClick={savePersonal}
                className="bg-[#FF7D00] text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

         {/* Business */}
        {step === 2 && (
          <div className="space-y-6">

            <div className="space-y-2">
              <Input
                placeholder="Business Name"
                value={business.name}
                onChange={(e) =>
                  setBusiness(prev => {
                    const nextName = e.target.value;
                    const nextAutoUsername = slugifyUsername(nextName);
                    if (!nextName.trim()) {
                      setBusinessNameStatus("idle");
                      lastBusinessNameNoticeRef.current = "";
                    }
                    if (!usernameEdited && !nextAutoUsername) {
                      setUsernameStatus("idle");
                      lastUsernameNoticeRef.current = "";
                    }
                    return {
                      ...prev,
                      name: nextName,
                      username: usernameEdited
                        ? prev.username
                        : nextAutoUsername,
                    };
                  })
                }
              />
              {getStatusBadge(
                businessNameStatus,
                "Name available",
                "Name not available"
              )}
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Username"
                value={business.username}
                onChange={(e) => {
                  setUsernameEdited(true);
                  if (!e.target.value.trim()) {
                    setUsernameStatus("idle");
                    lastUsernameNoticeRef.current = "";
                  }
                  setBusiness(prev => ({
                    ...prev,
                    username: e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .trim(),
                  }));
                }}
              />
              {getStatusBadge(
                usernameStatus,
                "Username available",
                "Username not available"
              )}
            </div>
{/* BUSINESS PHONE */}
<Input
  placeholder="Business Phone (+2547XXXXXXXX or 07XXXXXXXX)"
  value={business.phone}
  onChange={(e) =>
    setBusiness(prev => ({
      ...prev,
      phone: e.target.value,
    }))
  }
/>

{/* BUSINESS EMAIL */}
<Input
  placeholder="Business Email"
  value={business.email}
  onChange={(e) =>
    setBusiness(prev => ({
      ...prev,
      email: e.target.value,
    }))
  }
/>
            <ImageUpload
              value={business.logo ? [business.logo] : []}
              onChange={(urls) =>
                setBusiness(prev => ({
                  ...prev,
                  logo: urls[0] || "",
                }))
              }
            />

            <textarea
              placeholder="Describe your business..."
              className="w-full border rounded-lg p-3"
              value={business.description}
              onChange={(e) =>
                setBusiness(prev => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />

            {/* LOCATION */}
            <select
              value={business.county}
              onChange={(e)=>
                setBusiness(prev=>({
                  ...prev,
                  county:e.target.value,
                  subCounty:"",
                  ward:""
                }))
              }
              className="w-full border p-3 rounded-lg"
            >
              <option value="">Select County</option>
              {kenyaAdministrative.map((c)=>(
                <option key={c.county} value={c.county}>
                  {c.county}
                </option>
              ))}
            </select>

            {business.county && (
              <select
                value={business.subCounty}
                onChange={(e)=>
                  setBusiness(prev=>({
                    ...prev,
                    subCounty:e.target.value,
                    ward:""
                  }))
                }
                className="w-full border p-3 rounded-lg"
              >
                <option value="">Select SubCounty</option>
                {subCountyOptions.map((s)=>(
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </select>
            )}

            {business.subCounty && requiresWard && (
              <select
                value={business.ward}
                onChange={(e)=>
                  setBusiness(prev=>({
                    ...prev,
                    ward:e.target.value
                  }))
                }
                className="w-full border p-3 rounded-lg"
              >
                <option value="">Select Ward</option>
                {wardOptions.map((w)=>(
                    <option key={w} value={w}>{w}</option>
                  ))}
              </select>
            )}

            {business.subCounty && !requiresWard && (
              <div className="text-sm text-[#15616D]">
                No ward options available for this sub-county. You can continue.
              </div>
            )}

            <Input
              placeholder="Describe location (road, landmark, building...)"
              value={business.locationDescription}
              onChange={(e)=>
                setBusiness(prev=>({
                  ...prev,
                  locationDescription:e.target.value
                }))
              }
            />


            {/* Opening Hours */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">
                  Opening Hours
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyMondayToAll}
                >
                  Copy Monday to All
                </Button>
              </div>

              {DAYS.map((day) => (
                <div
                  key={day}
                  className="grid grid-cols-4 gap-4 items-center"
                >
                  <span className="font-medium">{day}</span>

                  <Input
                    type="time"
                    value={openingHours[day]?.open || ""}
                    onChange={(e) =>
                      setOpeningHours(prev => ({
                        ...prev,
                        [day]: {
                          ...prev[day],
                          open: e.target.value,
                          closed: false,
                        },
                      }))
                    }
                  />

                  <Input
                    type="time"
                    value={openingHours[day]?.close || ""}
                    onChange={(e) =>
                      setOpeningHours(prev => ({
                        ...prev,
                        [day]: {
                          ...prev[day],
                          close: e.target.value,
                          closed: false,
                        },
                      }))
                    }
                  />

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={openingHours[day]?.closed || false}
                      onChange={(e) =>
                        setOpeningHours(prev => ({
                          ...prev,
                          [day]: {
                            open: "",
                            close: "",
                            closed: e.target.checked,
                          },
                        }))
                      }
                    />
                    Closed
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>

              <Button
                disabled={saving}
                onClick={saveBusiness}
                className="bg-[#15616D] text-white rounded-full"
              >
                {saving ? "Saving..." : "Finish Setup"}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
