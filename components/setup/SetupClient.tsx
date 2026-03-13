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

const SETUP_STORAGE_KEY = "lodday_setup_draft";
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function FieldLabel({
  htmlFor,
  label,
  required = false,
  hint,
}: {
  htmlFor?: string;
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[#001524]">
      {label}
      {required ? <span className="ml-1 text-[#C2410C]">*</span> : null}
      {hint ? <span className="ml-2 text-xs font-normal text-[#15616D]">{hint}</span> : null}
    </label>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const { user } = useUser();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<Mode>("trial");
  const [popup, setPopup] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

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
    area: "",
    locationDescription: "",
  });

  const [usernameEdited, setUsernameEdited] = useState(false);
  const [openingHours, setOpeningHours] = useState<
    Record<string, { open: string; close: string; closed: boolean }>
  >({});

  const [usernameStatus, setUsernameStatus] =
    useState<"idle" | "checking" | "available" | "taken">("idle");
  const [businessNameStatus, setBusinessNameStatus] =
    useState<"idle" | "checking" | "available" | "taken">("idle");

  const lastUsernameNoticeRef = useRef("");
  const lastBusinessNameNoticeRef = useRef("");

  const personalWithDefaults = {
    firstName: personal.firstName || user?.firstName || "",
    lastName: personal.lastName || user?.lastName || "",
    email: personal.email || user?.primaryEmailAddress?.emailAddress || "",
    phone: personal.phone,
  };

  const selectedCounty = kenyaAdministrative.find((c) => c.county === business.county);
  const subCountyOptions = selectedCounty?.subCounties ?? [];
  const selectedSubCounty = subCountyOptions.find((s) => s.name === business.subCounty);
  const wardOptions = selectedSubCounty?.wards ?? [];
  const selectedWard = wardOptions.find((w) => w.name === business.ward);
  const areaOptions = selectedWard?.areas ?? [];
  const requiresWard = wardOptions.length > 0;
  const requiresArea = areaOptions.length > 0;

  const showPopup = (message: string) => {
    setPopup(message);
    setTimeout(() => setPopup(null), 2500);
  };

  const slugifyUsername = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .trim();

  const isKenyanPhone = (phone: string) => /^(\+2547\d{8}|07\d{8})$/.test(phone);
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedDraft = window.localStorage.getItem(SETUP_STORAGE_KEY);
    if (!savedDraft) return;

    try {
      const parsed = JSON.parse(savedDraft) as {
        step?: number;
        onboardingMode?: Mode;
        personal?: typeof personal;
        business?: typeof business;
        openingHours?: typeof openingHours;
        usernameEdited?: boolean;
      };

      if (typeof parsed.step === "number") setStep(parsed.step);
      if (parsed.onboardingMode === "trial" || parsed.onboardingMode === "subscribe") {
        setOnboardingMode(parsed.onboardingMode);
      }
      if (parsed.personal) setPersonal((prev) => ({ ...prev, ...parsed.personal }));
      if (parsed.business) setBusiness((prev) => ({ ...prev, ...parsed.business }));
      if (parsed.openingHours) setOpeningHours(parsed.openingHours);
      if (typeof parsed.usernameEdited === "boolean") setUsernameEdited(parsed.usernameEdited);
    } catch {
      window.localStorage.removeItem(SETUP_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      SETUP_STORAGE_KEY,
      JSON.stringify({
        step,
        onboardingMode,
        personal,
        business,
        openingHours,
        usernameEdited,
      })
    );
  }, [step, onboardingMode, personal, business, openingHours, usernameEdited]);

  useEffect(() => {
    if (!business.username) {
      setUsernameStatus("idle");
      return;
    }

    const timeout = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const res = await axios.get(`/api/business/check-username?username=${business.username}`);
        const nextStatus: "available" | "taken" = res.data.available ? "available" : "taken";
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
      setBusinessNameStatus("idle");
      return;
    }

    const timeout = setTimeout(async () => {
      setBusinessNameStatus("checking");
      try {
        const res = await axios.get(
          `/api/business/check-name?name=${encodeURIComponent(business.name)}`
        );
        const nextStatus: "available" | "taken" = res.data.available ? "available" : "taken";
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

  const savePersonal = async () => {
    if (!personalWithDefaults.firstName.trim() || !personalWithDefaults.lastName.trim()) {
      return showPopup("Please complete all personal details.");
    }

    if (!isKenyanPhone(personalWithDefaults.phone)) {
      return showPopup("Enter a valid Kenyan phone number.");
    }

    if (!isValidEmail(personalWithDefaults.email)) {
      return showPopup("Enter a valid email address.");
    }

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

  const saveBusiness = async () => {
    if (!business.name.trim()) return showPopup("Business name is required.");
    if (!business.username.trim()) return showPopup("Username is required.");

    if (usernameStatus !== "available") return showPopup("Username unavailable.");
    if (businessNameStatus !== "available") return showPopup("Business name unavailable.");
    if (!isKenyanPhone(business.phone)) return showPopup("Invalid business phone number.");
    if (!business.email) return showPopup("Business email is required.");
    if (!isValidEmail(business.email)) return showPopup("Invalid business email.");

    const hasLocationInput = Boolean(
      business.county ||
        business.subCounty ||
        business.ward ||
        business.area ||
        business.locationDescription.trim()
    );

    if (hasLocationInput && (!business.county || !business.subCounty)) {
      return showPopup("Please select county and sub-county.");
    }

    if (hasLocationInput && requiresWard && !business.ward) {
      return showPopup("Please select ward.");
    }

    if (hasLocationInput && requiresArea && !business.area) {
      return showPopup("Please select area.");
    }

    setSaving(true);

    try {
      const payload = {
        ...business,
        openingHours,
        location: {
          county: business.county,
          subCounty: business.subCounty,
          ward: requiresWard ? business.ward : "",
          area: requiresArea ? business.area : "",
          locationDescription: business.locationDescription,
          countyOptions: kenyaAdministrative.map((c) => c.county),
          subCountyOptions: subCountyOptions.map((s) => s.name),
          wardOptions: wardOptions.map((w) => w.name),
          areaOptions,
        },
        mode: onboardingMode,
      };

      const res = await axios.post("/api/business/setup", payload);

      if (res.data.success) {
        setSuccess(true);

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#FF7D00", "#15616D", "#F3DCC4"],
        });

        if (typeof window !== "undefined") {
          window.localStorage.removeItem(SETUP_STORAGE_KEY);
        }

        setTimeout(async () => {
          if (onboardingMode === "subscribe") {
            try {
              const sub = await axios.post("/api/subscription/start", {
                phoneNumber: business.phone,
              });
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
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">
          Checking...
        </span>
      );
    }
    if (status === "available") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
          {availableText}
        </span>
      );
    }
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
        {takenText}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#F5EBDD] px-6 py-20">
      <div className="relative mx-auto max-w-5xl space-y-10 rounded-[40px] bg-white/90 p-10 shadow-2xl backdrop-blur-md">
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
                className="rounded-3xl bg-white px-12 py-10 text-center shadow-2xl"
              >
                <div className="mb-2 text-3xl font-semibold text-[#15616D]">Setup Complete</div>
                <div className="text-gray-500">Redirecting to your dashboard...</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {popup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
            >
              <div className="rounded-3xl bg-[#001524] px-10 py-6 text-center text-lg text-white shadow-2xl">
                {popup}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3 text-center">
          <h1 className="text-5xl font-serif text-[#001524]">Build Your Booking Engine.</h1>
          <p className="text-[#15616D]">
            Set up your business and start receiving bookings in minutes.
          </p>
        </div>

        <div className="flex gap-3">
          {["Plan", "Personal", "Business"].map((label, i) => (
            <div
              key={label}
              className={`flex-1 rounded-full py-3 text-center text-sm font-medium ${
                step === i
                  ? "bg-[#15616D] text-white shadow-md"
                  : "bg-[#F3DCC4] text-[#001524]"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-semibold">Choose how to start</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div
                onClick={() => setOnboardingMode("trial")}
                className={`cursor-pointer rounded-3xl border-2 p-8 shadow-lg ${
                  onboardingMode === "trial"
                    ? "border-[#FF7D00] ring-2 ring-[#FF7D00]/30"
                    : "border-transparent"
                }`}
              >
                <h3 className="text-xl font-semibold">14-Day Free Trial</h3>
                <p className="text-gray-500">Try everything before paying.</p>
              </div>

              <div
                onClick={() => setOnboardingMode("subscribe")}
                className={`cursor-pointer rounded-3xl border-2 p-8 shadow-lg ${
                  onboardingMode === "subscribe"
                    ? "border-[#FF7D00] ring-2 ring-[#FF7D00]/30"
                    : "border-transparent"
                }`}
              >
                <h3 className="text-xl font-semibold">Subscribe Now</h3>
                <p className="text-gray-500">Activate immediately.</p>
              </div>
            </div>

            <Button
              onClick={() => setStep(1)}
              className="rounded-full bg-[#FF7D00] px-10 py-6 text-lg text-white"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="firstName" label="First Name" required />
              <Input
                id="firstName"
                placeholder="First name"
                value={personalWithDefaults.firstName}
                onChange={(e) =>
                  setPersonal((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="lastName" label="Last Name" required />
              <Input
                id="lastName"
                placeholder="Last name"
                value={personalWithDefaults.lastName}
                onChange={(e) =>
                  setPersonal((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="personalEmail" label="Personal Email" required />
              <Input
                id="personalEmail"
                type="email"
                placeholder="you@example.com"
                value={personalWithDefaults.email}
                onChange={(e) =>
                  setPersonal((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="personalPhone" label="Phone Number" required />
              <Input
                id="personalPhone"
                placeholder="0712345678"
                value={personal.phone}
                onChange={(e) =>
                  setPersonal((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={savePersonal} className="bg-[#FF7D00] text-white">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="businessName" label="Business Name" required />
              <Input
                id="businessName"
                placeholder="Business name"
                value={business.name}
                onChange={(e) =>
                  setBusiness((prev) => {
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
                      username: usernameEdited ? prev.username : nextAutoUsername,
                    };
                  })
                }
              />
              {getStatusBadge(businessNameStatus, "Name available", "Name not available")}
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="businessUsername" label="Username" required />
              <Input
                id="businessUsername"
                placeholder="your-business-name"
                value={business.username}
                onChange={(e) => {
                  setUsernameEdited(true);
                  if (!e.target.value.trim()) {
                    setUsernameStatus("idle");
                    lastUsernameNoticeRef.current = "";
                  }
                  setBusiness((prev) => ({
                    ...prev,
                    username: e.target.value.toLowerCase().replace(/\s+/g, "-").trim(),
                  }));
                }}
              />
              {getStatusBadge(usernameStatus, "Username available", "Username not available")}
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="businessPhone" label="Business Phone" required />
              <Input
                id="businessPhone"
                placeholder="0712345678"
                value={business.phone}
                onChange={(e) =>
                  setBusiness((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="businessEmail" label="Business Email" required />
              <Input
                id="businessEmail"
                type="email"
                placeholder="business@example.com"
                value={business.email}
                onChange={(e) =>
                  setBusiness((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <FieldLabel
                label="Business Logo Upload"
                hint="Optional. Upload one logo up to 2MB."
              />
              <ImageUpload
                value={business.logo ? [business.logo] : []}
                maxFiles={1}
                maxFileSize={2_000_000}
                onChange={(urls) =>
                  setBusiness((prev) => ({
                    ...prev,
                    logo: urls[0] || "",
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="businessDescription" label="Describe Your Business" />
              <textarea
                id="businessDescription"
                placeholder="Tell clients what you offer, what makes your business special, and the kind of experience they can expect."
                className="min-h-32 w-full rounded-lg border p-3"
                value={business.description}
                onChange={(e) =>
                  setBusiness((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-[#F3DCC4] bg-[#FFF9F2] p-4">
              <div className="space-y-1">
                <FieldLabel
                  label="Business Location"
                  hint="If you are a mobile service, you can skip this step."
                />
                <p className="text-sm text-[#15616D]">
                  Add your county, sub-county, ward, area, and a short location note to help
                  clients find you.
                </p>
              </div>

              <select
                value={business.county}
                onChange={(e) =>
                  setBusiness((prev) => ({
                    ...prev,
                    county: e.target.value,
                    subCounty: "",
                    ward: "",
                    area: "",
                  }))
                }
                className="w-full rounded-lg border p-3"
              >
                <option value="">Select County</option>
                {kenyaAdministrative.map((county) => (
                  <option key={county.county} value={county.county}>
                    {county.county}
                  </option>
                ))}
              </select>

              {business.county && (
                <select
                  value={business.subCounty}
                  onChange={(e) =>
                    setBusiness((prev) => ({
                      ...prev,
                      subCounty: e.target.value,
                      ward: "",
                      area: "",
                    }))
                  }
                  className="w-full rounded-lg border p-3"
                >
                  <option value="">Select Sub-County</option>
                  {subCountyOptions.map((subCounty) => (
                    <option key={subCounty.name} value={subCounty.name}>
                      {subCounty.name}
                    </option>
                  ))}
                </select>
              )}

              {business.subCounty && requiresWard && (
                <select
                  value={business.ward}
                  onChange={(e) =>
                    setBusiness((prev) => ({
                      ...prev,
                      ward: e.target.value,
                      area: "",
                    }))
                  }
                  className="w-full rounded-lg border p-3"
                >
                  <option value="">Select Ward</option>
                  {wardOptions.map((ward) => (
                    <option key={ward.name} value={ward.name}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              )}

              {business.subCounty && !requiresWard && (
                <div className="text-sm text-[#15616D]">
                  No ward options available for this sub-county. You can continue.
                </div>
              )}

              {business.ward && requiresArea && (
                <select
                  value={business.area}
                  onChange={(e) =>
                    setBusiness((prev) => ({
                      ...prev,
                      area: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border p-3"
                >
                  <option value="">Select Area</option>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              )}

              <div className="space-y-2">
                <FieldLabel htmlFor="locationDescription" label="Describe Your Location" />
                <textarea
                  id="locationDescription"
                  placeholder="Share your road, building, landmark, estate, or any directions that help clients find you faster."
                  className="min-h-32 w-full rounded-lg border p-3"
                  value={business.locationDescription}
                  onChange={(e) =>
                    setBusiness((prev) => ({
                      ...prev,
                      locationDescription: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Opening Hours</h3>
                  <p className="text-sm text-[#15616D]">
                    Tap the time fields to choose a time or type it manually. Times stay visible on
                    mobile.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={copyMondayToAll}>
                  Copy Monday to All
                </Button>
              </div>

              {DAYS.map((day) => (
                <div
                  key={day}
                  className="grid gap-3 rounded-2xl border border-[#F3DCC4] bg-[#FFF9F2] p-4 md:grid-cols-[minmax(110px,140px)_1fr_1fr_auto] md:items-center"
                >
                  <span className="font-medium">{day}</span>

                  <div className="space-y-2">
                    <FieldLabel htmlFor={`${day}-open`} label="Opens" />
                    <Input
                      id={`${day}-open`}
                      type="time"
                      value={openingHours[day]?.open || ""}
                      className="bg-white text-[#001524] [color-scheme:light]"
                      onChange={(e) =>
                        setOpeningHours((prev) => ({
                          ...prev,
                          [day]: {
                            ...prev[day],
                            open: e.target.value,
                            closed: false,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor={`${day}-close`} label="Closes" />
                    <Input
                      id={`${day}-close`}
                      type="time"
                      value={openingHours[day]?.close || ""}
                      className="bg-white text-[#001524] [color-scheme:light]"
                      onChange={(e) =>
                        setOpeningHours((prev) => ({
                          ...prev,
                          [day]: {
                            ...prev[day],
                            close: e.target.value,
                            closed: false,
                          },
                        }))
                      }
                    />
                  </div>

                  <label className="flex items-center gap-2 self-end text-sm md:self-center">
                    <input
                      type="checkbox"
                      checked={openingHours[day]?.closed || false}
                      onChange={(e) =>
                        setOpeningHours((prev) => ({
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
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>

              <Button
                disabled={saving}
                onClick={saveBusiness}
                className="rounded-full bg-[#15616D] text-white"
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
