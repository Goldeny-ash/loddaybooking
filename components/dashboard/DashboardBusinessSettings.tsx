"use client";

import { useEffect, useMemo, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import AccessStatusCard from "@/components/dashboard/AccessStatusCard";
import PreciseLocationButton from "@/components/public/PreciseLocationButton";
import { kenyaAdministrative } from "@/lib/constants/kenyaAdministrative";
import { applyThemeToRoot, getTheme } from "@/lib/theme";

const TABS = [
  "General Settings",
  "Theme Settings",
  "Booking Rules & Mobile",
  "Access & Subscription",
] as const;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const slugifyUsername = (value: string) => value.toLowerCase().replace(/\s+/g, "-").trim();

function getAreaOptions(county: string, subCounty: string, wardName: string) {
  const countyData = kenyaAdministrative.find((item) => item.county === county);
  const subCountyData = countyData?.subCounties.find((item) => item.name === subCounty);
  const ward = (subCountyData?.wards || []).find((item) =>
    typeof item === "string" ? item === wardName : item.name === wardName
  );
  if (!ward || typeof ward === "string") return [];
  return ward.areas || [];
}

function Card({
  title,
  description,
  children,
  theme,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <section
      className="rounded-[1.5rem] border p-5 shadow-sm"
      style={{ background: theme.backgroundSoft || "#fff", borderColor: `${theme.primary}22` }}
    >
      <h3 className="text-xl font-semibold" style={{ color: theme.primaryDark }}>
        {title}
      </h3>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-slate-800">{label}</span>
      {children}
    </label>
  );
}

export default function DashboardBusinessSettings({
  initialBusiness,
}: {
  initialBusiness: any;
  staffList: any[];
  services: any[];
}) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("General Settings");
  const [business, setBusiness] = useState({
    ...initialBusiness,
    theme: initialBusiness.theme || {},
    location: initialBusiness.location || {},
    socialLinks: initialBusiness.socialLinks || {},
    openingHours: initialBusiness.openingHours || {},
    bookingRules: initialBusiness.bookingRules || {},
    depositPolicy: initialBusiness.depositPolicy || {},
    mobileSettings: {
      enabled: initialBusiness.mobileSettings?.enabled || false,
      baseLocation: initialBusiness.mobileSettings?.baseLocation || {},
      calloutPolicy: {
        type: initialBusiness.mobileSettings?.calloutPolicy?.type === "per_km" ? "per_km" : "fixed",
        baseFee: initialBusiness.mobileSettings?.calloutPolicy?.baseFee || 0,
        perKmFee: initialBusiness.mobileSettings?.calloutPolicy?.perKmFee || 0,
      },
    },
  });
  const [saving, setSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [usernameState, setUsernameState] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const theme = useMemo(() => getTheme(business), [business]);
  const selectedCounty = kenyaAdministrative.find((item) => item.county === (business.location?.county || ""));
  const subCounties = selectedCounty?.subCounties || [];
  const selectedSubCounty = subCounties.find((item) => item.name === business.location?.subCounty);
  const wards = selectedSubCounty?.wards || [];
  const areaOptions = getAreaOptions(
    business.location?.county || "",
    business.location?.subCounty || "",
    business.location?.ward || ""
  );

  useEffect(() => {
    applyThemeToRoot(theme);
  }, [theme]);

  useEffect(() => {
    const next = slugifyUsername(business.username || "");
    const current = slugifyUsername(initialBusiness.username || "");
    if (!next || next === current) {
      setUsernameState("idle");
      return;
    }
    const controller = new AbortController();
    setUsernameState("checking");
    fetch(`/api/business/check-username?username=${encodeURIComponent(next)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => setUsernameState(data.available ? "available" : "taken"))
      .catch(() => setUsernameState("idle"));
    return () => controller.abort();
  }, [business.username, initialBusiness.username]);

  const update = (field: string, value: any) => {
    setBusiness((prev: any) => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const patch = (field: string, value: Record<string, unknown>) => {
    update(field, { ...(business[field] || {}), ...value });
  };

  const save = async () => {
    if (usernameState === "taken") {
      alert("Please choose a unique username before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/business/${business._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(business),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Failed to save business settings");
      setBusiness(payload);
      setUnsavedChanges(false);
      alert("Business settings saved successfully.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save business settings");
    } finally {
      setSaving(false);
    }
  };

  const useBusinessLocationAsBase = () => {
    const mapsLink =
      business.location?.mapsLink ||
      (business.location?.lat && business.location?.lng
        ? `https://www.google.com/maps?q=${business.location.lat},${business.location.lng}`
        : "");

    patch("mobileSettings", {
      baseLocation: {
        ...(business.mobileSettings?.baseLocation || {}),
        lat: business.location?.lat,
        lng: business.location?.lng,
        address: mapsLink,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-[1.5rem] border p-3 shadow-sm"
        style={{ background: theme.backgroundSoft || "#fff", borderColor: `${theme.primary}22` }}
      >
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: activeTab === tab ? theme.primary : "#fff", color: activeTab === tab ? "#fff" : theme.primaryDark }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "General Settings" ? (
        <div className="space-y-6">
          <Card title="Business profile" description="Update the public details people see on your booking page." theme={theme}>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label="Business name">
                <input value={business.name || ""} onChange={(e) => update("name", e.target.value)} placeholder="Business name" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
              </LabeledField>
              <div className="space-y-2">
                <LabeledField label="Username">
                  <input value={business.username || ""} onChange={(e) => update("username", slugifyUsername(e.target.value))} placeholder="Username" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
                </LabeledField>
                <p className="text-xs text-slate-500">
                  {usernameState === "checking" ? "Checking username..." : usernameState === "taken" ? "This username is already taken." : usernameState === "available" ? "This username is available." : "This becomes part of your booking link."}
                </p>
              </div>
              <LabeledField label="Phone number">
                <input value={business.phone || ""} onChange={(e) => update("phone", e.target.value)} placeholder="Phone number" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
              </LabeledField>
              <LabeledField label="Business email">
                <input value={business.email || ""} onChange={(e) => update("email", e.target.value)} placeholder="Business email" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
              </LabeledField>
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium text-slate-800">Business logo</p>
                <ImageUpload value={business.logo ? [business.logo] : []} onChange={(urls) => update("logo", urls[0] || "")} maxFiles={1} />
              </div>
              <div className="md:col-span-2">
                <LabeledField label="Business description">
                  <textarea value={business.description || ""} onChange={(e) => update("description", e.target.value)} rows={4} placeholder="Business description" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
                </LabeledField>
              </div>
              {(["facebook", "instagram", "twitter", "tiktok"] as const).map((key) => (
                <LabeledField key={key} label={`${key[0].toUpperCase() + key.slice(1)} link`}>
                  <input value={business.socialLinks?.[key] || ""} onChange={(e) => patch("socialLinks", { [key]: e.target.value })} placeholder={`${key[0].toUpperCase() + key.slice(1)} link`} className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
                </LabeledField>
              ))}
            </div>
          </Card>

          <Card title="Business location" description="Choose county, sub-county, ward, and area, then capture the exact location with the precise-location button." theme={theme}>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label="County">
                <select value={business.location?.county || ""} onChange={(e) => patch("location", { county: e.target.value, subCounty: "", ward: "", area: "" })} className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none">
                  <option value="">Select county</option>
                  {kenyaAdministrative.map((item) => <option key={item.county} value={item.county}>{item.county}</option>)}
                </select>
              </LabeledField>
              <LabeledField label="Sub-county">
                <select value={business.location?.subCounty || ""} onChange={(e) => patch("location", { subCounty: e.target.value, ward: "", area: "" })} className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none">
                  <option value="">Select sub-county</option>
                  {subCounties.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
              </LabeledField>
              <LabeledField label="Ward">
                <select value={business.location?.ward || ""} onChange={(e) => patch("location", { ward: e.target.value, area: "" })} className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none">
                  <option value="">Select ward</option>
                  {wards.map((ward) => {
                    const value = typeof ward === "string" ? ward : ward.name;
                    return <option key={value} value={value}>{value}</option>;
                  })}
                </select>
              </LabeledField>
              <LabeledField label="Area">
                <select value={business.location?.area || ""} onChange={(e) => patch("location", { area: e.target.value })} className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none">
                  <option value="">Select area</option>
                  {areaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
              </LabeledField>
              <div className="md:col-span-2">
                <LabeledField label="Location description">
                  <textarea value={business.location?.locationDescription || ""} onChange={(e) => patch("location", { locationDescription: e.target.value })} rows={3} placeholder="Location description" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
                </LabeledField>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-sm font-medium text-slate-800">Precise business location</p>
              <div className="mt-3">
                <PreciseLocationButton onLocationResolved={({ lat, lng, mapsLink }) => patch("location", { lat, lng, mapsLink })} />
              </div>
              {business.location?.mapsLink ? (
                <a href={business.location.mapsLink} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-sky-700 underline underline-offset-4">
                  Open saved business Google Maps link
                </a>
              ) : null}
            </div>
          </Card>

          <Card title="Opening hours" description="A compact layout like staff availability, so each day is easy to scan." theme={theme}>
            <div className="space-y-2">
              {DAYS.map((day, index) => {
                const slot = business.openingHours?.[day] || {};
                return (
                  <div key={day} className="flex flex-wrap items-center gap-2">
                    <span className="w-24 text-sm font-medium">{day}</span>
                    <input type="time" value={slot.open || ""} disabled={slot.closed} onChange={(e) => update("openingHours", { ...(business.openingHours || {}), [day]: { ...slot, open: e.target.value } })} className="w-28 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none disabled:bg-slate-100" />
                    <span className="text-sm text-slate-500">to</span>
                    <input type="time" value={slot.close || ""} disabled={slot.closed} onChange={(e) => update("openingHours", { ...(business.openingHours || {}), [day]: { ...slot, close: e.target.value } })} className="w-28 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none disabled:bg-slate-100" />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={slot.closed || false} onChange={(e) => update("openingHours", { ...(business.openingHours || {}), [day]: { ...slot, closed: e.target.checked, open: e.target.checked ? "" : slot.open || "", close: e.target.checked ? "" : slot.close || "" } })} />
                      Closed
                    </label>
                    {index === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          const monday = business.openingHours?.Monday || {};
                          update(
                            "openingHours",
                            DAYS.reduce((acc: Record<string, any>, currentDay) => {
                              acc[currentDay] = { ...monday };
                              return acc;
                            }, {})
                          );
                        }}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
                      >
                        Copy Monday to all
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "Theme Settings" ? (
        <Card title="Theme settings" description="These colors shape the same branded look across mobile and desktop." theme={theme}>
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Primary color">
              <input type="color" value={business.theme?.primary || "#FF7D00"} onChange={(e) => patch("theme", { primary: e.target.value })} className="h-12 w-20 rounded-lg border border-black/10 bg-transparent" />
            </LabeledField>
            <LabeledField label="Accent color">
              <input type="color" value={business.theme?.accent || "#78290F"} onChange={(e) => patch("theme", { accent: e.target.value })} className="h-12 w-20 rounded-lg border border-black/10 bg-transparent" />
            </LabeledField>
          </div>
        </Card>
      ) : null}

      {activeTab === "Booking Rules & Mobile" ? (
        <div className="space-y-6">
          <Card title="Booking rules" description="Auto-approve means you do not manually confirm each booking. Deposits help reduce no-shows. Example: fixed KES 500, or 20 percent of the service total." theme={theme}>
            <div className="space-y-4 rounded-2xl border border-black/10 bg-white p-4">
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Automatically approve bookings</span>
                <input type="checkbox" checked={business.bookingRules?.autoApprove || false} onChange={(e) => patch("bookingRules", { autoApprove: e.target.checked })} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Enable deposits</span>
                <input type="checkbox" checked={business.depositPolicy?.enabled || false} onChange={(e) => patch("depositPolicy", { enabled: e.target.checked })} />
              </label>
              <LabeledField label="Deposit type">
                <select value={business.depositPolicy?.type || "fixed"} onChange={(e) => patch("depositPolicy", { type: e.target.value })} className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none">
                  <option value="fixed">Fixed amount</option>
                  <option value="percent">Percentage</option>
                </select>
              </LabeledField>
              <LabeledField label="Deposit value">
                <input type="number" value={business.depositPolicy?.value || 0} onChange={(e) => patch("depositPolicy", { value: Number(e.target.value) })} placeholder="Deposit value" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
              </LabeledField>
            </div>
          </Card>

          <Card title="Mobile settings" description="Set the base location using the precise-location button or reuse the saved business location. Base location saves latitude, longitude, and the Google Maps link. Mobile pricing only uses fixed fee or per KM fee." theme={theme}>
            <div className="space-y-4 rounded-2xl border border-black/10 bg-white p-4">
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Enable mobile services</span>
                <input type="checkbox" checked={business.mobileSettings?.enabled || false} onChange={(e) => patch("mobileSettings", { enabled: e.target.checked })} />
              </label>
              <LabeledField label="Base location Google Maps link">
                <input value={business.mobileSettings?.baseLocation?.address || ""} onChange={(e) => patch("mobileSettings", { baseLocation: { ...(business.mobileSettings?.baseLocation || {}), address: e.target.value } })} placeholder="Base location Google Maps link" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
              </LabeledField>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={useBusinessLocationAsBase} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  Use business location as base
                </button>
                <PreciseLocationButton onLocationResolved={({ lat, lng, mapsLink }) => patch("mobileSettings", { baseLocation: { ...(business.mobileSettings?.baseLocation || {}), lat, lng, address: mapsLink } })} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <LabeledField label="Base latitude">
                  <input type="number" value={business.mobileSettings?.baseLocation?.lat || 0} onChange={(e) => patch("mobileSettings", { baseLocation: { ...(business.mobileSettings?.baseLocation || {}), lat: Number(e.target.value) } })} placeholder="Base latitude" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
                </LabeledField>
                <LabeledField label="Base longitude">
                  <input type="number" value={business.mobileSettings?.baseLocation?.lng || 0} onChange={(e) => patch("mobileSettings", { baseLocation: { ...(business.mobileSettings?.baseLocation || {}), lng: Number(e.target.value) } })} placeholder="Base longitude" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
                </LabeledField>
              </div>
              {business.mobileSettings?.baseLocation?.address ? (
                <a href={business.mobileSettings.baseLocation.address} target="_blank" rel="noreferrer" className="inline-block text-sm text-sky-700 underline underline-offset-4">
                  Open saved base location link
                </a>
              ) : null}
              <LabeledField label="Mobile pricing type">
                <select value={business.mobileSettings?.calloutPolicy?.type || "fixed"} onChange={(e) => patch("mobileSettings", { calloutPolicy: { ...(business.mobileSettings?.calloutPolicy || {}), type: e.target.value } })} className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none">
                  <option value="fixed">Fixed fee</option>
                  <option value="per_km">Per KM</option>
                </select>
              </LabeledField>
              {business.mobileSettings?.calloutPolicy?.type === "fixed" ? (
                <LabeledField label="Fixed fee">
                  <input type="number" value={business.mobileSettings?.calloutPolicy?.baseFee || 0} onChange={(e) => patch("mobileSettings", { calloutPolicy: { ...(business.mobileSettings?.calloutPolicy || {}), baseFee: Number(e.target.value), perKmFee: 0 } })} placeholder="Fixed fee" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
                </LabeledField>
              ) : null}
              {business.mobileSettings?.calloutPolicy?.type === "per_km" ? (
                <LabeledField label="Per KM fee">
                  <input type="number" value={business.mobileSettings?.calloutPolicy?.perKmFee || 0} onChange={(e) => patch("mobileSettings", { calloutPolicy: { ...(business.mobileSettings?.calloutPolicy || {}), perKmFee: Number(e.target.value), baseFee: 0 } })} placeholder="Per KM fee" className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none" />
                </LabeledField>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "Access & Subscription" ? <AccessStatusCard business={business} /> : null}

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={!unsavedChanges || saving || usernameState === "checking"} className="rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: theme.primary }}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
