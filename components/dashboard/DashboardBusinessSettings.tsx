"use client";

import React, { useState, useEffect } from "react";
import ThemeSettings from "@/components/dashboard/ThemeSettings";
import StaffOverview from "@/components/dashboard/StaffOverview";
import ServicesManager from "@/components/dashboard/ServicesManager";
import AccessStatusCard from "@/components/dashboard/AccessStatusCard";
import { getTheme, applyThemeToRoot } from "@/lib/theme";
import Business from "@/lib/models/Business";


interface BusinessType {
  _id: string;
  name: string;
  username: string;
  phone?: string;
  email?: string;
  theme?: any;
  notificationPrefs?: {
    email?: boolean;
  };
  depositPolicy?: {
    enabled?: boolean;
    type?: "fixed" | "percent";
    value?: number;
    applyToCallout?: boolean;
  };
  bookingRules?: {
    autoApprove?: boolean;
    bufferMinutes?: number;
  };
  mobileSettings?: {
    enabled?: boolean;
    baseLocation?: {
      address?: string;
      lat?: number;
      lng?: number;
    };
    calloutPolicy?: {
      type?: "fixed" | "per_km" | "zone";
      baseFee?: number;
      perKmFee?: number;
      zones?: { name: string; radiusKm: number; fee: number }[];
    };
    maxDistanceKm?: number;
  };
  location?: {
    addressLine?: string;
    lat?: number;
    lng?: number;
  };
}

interface DashboardBusinessSettingsProps {
  initialBusiness: BusinessType;
  staffList: any[];
  services: any[];
}

const TABS = [
  "General",
  "Notifications & Payments", // merged tab
  "Access & Subscription",
  "Booking Rules & Mobile",   // merged booking rules + mobile/callout
  "Location",
  "Staff Management",
  "Services Management",
  "Theme Settings",
] as const;


const LOCATION_SUGGESTIONS = [
  "Uhuru Gardens Kenya",
  "Uhuru Park Nairobi",
  "Nyayo Stadium Nairobi",
  "Kasarani Stadium",
  "University of Nairobi Grounds",
  "KICC Grounds",
  "Ngong Racecourse",
  "Karura Forest",
  "Westlands Nairobi",
  "CBD Nairobi",
];

export default function DashboardBusinessSettings({
  initialBusiness,
  staffList,
  services,
}: DashboardBusinessSettingsProps) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("General");
  const [business, setBusiness] = useState({ ...initialBusiness });
  const [mapZoom, setMapZoom] = useState(17);

 // Track unsaved changes
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  

  useEffect(() => {
    const theme = getTheme(business);
    setMounted(true);
    applyThemeToRoot(theme);
  }, [business.theme]);

  // Mark as unsaved when business changes
  const handleChange = (field: string, value: any) => {
    setBusiness((prev) => {
      setUnsavedChanges(true);
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/business/${business._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(business),
      });

      if (!res.ok) throw new Error("Failed to save business settings");

      const updated = await res.json();
      setBusiness(updated);
      setUnsavedChanges(false);
      alert("Business settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving business settings");
    } finally {
      setSaving(false);
    }
  };

  // Coordinate parsing remains the same
  const parseCoordinate = (input: string): number | undefined => {
    input = input.trim();
    if (!input) return undefined;
    if (input.includes("°")) {
      const regex = /(\d+)°(\d+)'([\d.]+)"?([NSEW])?/i;
      const match = input.match(regex);
      if (match) {
        const [, deg, min, sec, dir] = match;
        let decimal = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
        if (dir?.toUpperCase() === "S" || dir?.toUpperCase() === "W") decimal *= -1;
        return decimal;
      }
      return undefined;
    }
    const num = parseFloat(input);
    if (isNaN(num)) return undefined;
    return num;
  };
const TabSaveButton = () => (
  <div className="flex justify-end pt-6 border-t border-gray-200">
    <button
      onClick={handleSave}
      disabled={!unsavedChanges || saving}
      className={`px-6 py-3 rounded-lg font-semibold transition shadow-sm ${
        saving
          ? "bg-gray-500 text-white cursor-not-allowed"
          : unsavedChanges
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : "bg-gray-200 text-gray-500 cursor-not-allowed"
      }`}
    >
      {saving ? "Saving..." : "Save Changes"}
    </button>
  </div>
);


  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-6">
        {/* GENERAL */}
        {activeTab === "General" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">General Info</h3>
            <input
              type="text"
              placeholder="Business Name"
              value={business.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <input
              type="text"
              placeholder="Username"
              value={business.username || ""}
              onChange={(e) => handleChange("username", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <input
              type="text"
              placeholder="Phone"
              value={business.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email"
              value={business.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
            />

            <ThemeSettings
              business={business}
            />
             <TabSaveButton />
          </div>
        )}

       {activeTab === "Notifications & Payments" && (
  <div className="space-y-4">

    {/* NOTIFICATIONS */}
    <h3 className="text-lg font-semibold">Notifications</h3>
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={business.notificationPrefs?.email || false}
        onChange={(e) =>
          handleChange("notificationPrefs", {
            ...business.notificationPrefs,
            email: e.target.checked,
          })
        }
      />
      Email Notifications
    </label>

    {/* DEPOSITS & PAYMENTS */}
    <h3 className="text-lg font-semibold mt-6">Deposits & Payments</h3>
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={business.depositPolicy?.enabled || false}
        onChange={(e) =>
          handleChange("depositPolicy", {
            ...business.depositPolicy,
            enabled: e.target.checked,
          })
        }
      />
      Enable Deposits
    </label>

    <select
      value={business.depositPolicy?.type || "fixed"}
      onChange={(e) =>
        handleChange("depositPolicy", {
          ...business.depositPolicy,
          type: e.target.value,
        })
      }
      className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
    >
      <option value="fixed">Fixed</option>
      <option value="percent">Percent</option>
    </select>

    <input
      type="number"
      placeholder="Deposit Value"
      value={business.depositPolicy?.value || 0}
      onChange={(e) =>
        handleChange("depositPolicy", {
          ...business.depositPolicy,
          value: Number(e.target.value),
        })
      }
      className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
    />

    <label className="flex items-center gap-2">
      Apply to callouts:
      <input
        type="checkbox"
        checked={business.depositPolicy?.applyToCallout || false}
        onChange={(e) =>
          handleChange("depositPolicy", {
            ...business.depositPolicy,
            applyToCallout: e.target.checked,
          })
        }
        className="ml-2"
      />
    </label>

    <TabSaveButton />
  </div>
)}


        {/* ACCESS & SUBSCRIPTION */}
        {activeTab === "Access & Subscription" && (
          <div className="space-y-4">
            <AccessStatusCard business={business} />
            
          </div>
        )}

       

       {activeTab === "Booking Rules & Mobile" && (
  <div className="space-y-6">

   {activeTab === "Booking Rules & Mobile" && (
  <div className="space-y-6">

    {/* ---------------- BOOKING RULES ---------------- */}
    <h3 className="text-lg font-semibold">Booking Rules</h3>

    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-600">
        Automatically approve bookings without manual confirmation.
      </span>
      <input
        type="checkbox"
        checked={business.bookingRules?.autoApprove || false}
        onChange={(e) =>
          handleChange("bookingRules", {
            ...business.bookingRules,
            autoApprove: e.target.checked,
          })
        }
        className="mt-1"
      />
    </label>

    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-600">
        Buffer time (in minutes) between bookings to prevent overlapping appointments.
      </span>
      <input
        type="number"
        placeholder="e.g., 15"
        value={business.bookingRules?.bufferMinutes || 0}
        onChange={(e) =>
          handleChange("bookingRules", {
            ...business.bookingRules,
            bufferMinutes: Number(e.target.value),
          })
        }
        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
      />
    </label>

    {/* ---------------- MOBILE / CALLOUT SETTINGS ---------------- */}
    <h3 className="text-lg font-semibold mt-6">Mobile / Callout Settings</h3>
    <p className="text-sm text-gray-500">
      Enable this if you provide services at your customer's location. 
      You can set fees based on distance or specific zones. 
      Example: A barber who travels from Imara Daima to Embakasi/Umoja but cannot leave Embakasi area.
    </p>

    {/* Enable Mobile */}
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={business.mobileSettings?.enabled || false}
        onChange={(e) =>
          handleChange("mobileSettings", {
            ...business.mobileSettings,
            enabled: e.target.checked,
          })
        }
      />
      Enable Mobile / Callout Services
    </label>

    {/* Base Location */}
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-600">
        Base location: where your mobile worker starts from. Used to calculate travel distance.
      </span>
      <input
        type="text"
        placeholder="Enter base address e.g., Imara Daima"
        value={business.mobileSettings?.baseLocation?.address || ""}
        onChange={(e) =>
          handleChange("mobileSettings", {
            ...business.mobileSettings,
            baseLocation: {
              ...business.mobileSettings?.baseLocation,
              address: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
      />
    </label>

    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Latitude e.g., -1.322"
        value={business.mobileSettings?.baseLocation?.lat || ""}
        onChange={(e) =>
          handleChange("mobileSettings", {
            ...business.mobileSettings,
            baseLocation: {
              ...business.mobileSettings?.baseLocation,
              lat: parseFloat(e.target.value),
            },
          })
        }
        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
      />
      <input
        type="text"
        placeholder="Longitude e.g., 36.874"
        value={business.mobileSettings?.baseLocation?.lng || ""}
        onChange={(e) =>
          handleChange("mobileSettings", {
            ...business.mobileSettings,
            baseLocation: {
              ...business.mobileSettings?.baseLocation,
              lng: parseFloat(e.target.value),
            },
          })
        }
        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
      />
    </div>

    {/* Callout Policy Type */}
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-600">
        How to charge for callouts. <br/>
        - Fixed: same fee for any distance. <br/>
        - Per KM: base fee + fee per kilometer. <br/>
        - Zone: different fees for defined areas.
      </span>
      <select
        value={business.mobileSettings?.calloutPolicy?.type || "fixed"}
        onChange={(e) =>
          handleChange("mobileSettings", {
            ...business.mobileSettings,
            calloutPolicy: {
              ...business.mobileSettings?.calloutPolicy,
              type: e.target.value,
            },
          })
        }
        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
      >
        <option value="fixed">Fixed Fee</option>
        <option value="per_km">Per KM</option>
        <option value="zone">Zones</option>
      </select>
    </label>

    {/* Fees */}
    {business.mobileSettings?.calloutPolicy?.type === "fixed" && (
      <input
        type="number"
        placeholder="Fixed fee e.g., 300 KES"
        value={business.mobileSettings?.calloutPolicy?.baseFee || 0}
        onChange={(e) =>
          handleChange("mobileSettings", {
            ...business.mobileSettings,
            calloutPolicy: {
              ...business.mobileSettings?.calloutPolicy,
              baseFee: Number(e.target.value),
            },
          })
        }
        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
      />
    )}

    {business.mobileSettings?.calloutPolicy?.type === "per_km" && (
      <div className="space-y-2">
        <input
          type="number"
          placeholder="Base fee e.g., 300 KES"
          value={business.mobileSettings?.calloutPolicy?.baseFee || 0}
          onChange={(e) =>
            handleChange("mobileSettings", {
              ...business.mobileSettings,
              calloutPolicy: {
                ...business.mobileSettings?.calloutPolicy,
                baseFee: Number(e.target.value),
              },
            })
          }
          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <input
          type="number"
          placeholder="Per KM fee e.g., 50 KES/km"
          value={business.mobileSettings?.calloutPolicy?.perKmFee || 0}
          onChange={(e) =>
            handleChange("mobileSettings", {
              ...business.mobileSettings,
              calloutPolicy: {
                ...business.mobileSettings?.calloutPolicy,
                perKmFee: Number(e.target.value),
              },
            })
          }
          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>
    )}

    {/* Zone Management */}
    {business.mobileSettings?.calloutPolicy?.type === "zone" && (
      <div className="space-y-2">
        <span className="text-sm text-gray-600">
          Add zones: Name, radius from base (KM), and fee.
          Example: Embakasi 5 km → 300 KES, Umoja 10 km → 500 KES.
        </span>
        {business.mobileSettings.calloutPolicy?.zones?.map((zone, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              placeholder="Zone Name e.g., Embakasi"
              value={zone.name || ""}
              onChange={(e) => {
                const zones = [...(business.mobileSettings?.calloutPolicy?.zones || [])];
                zones[index].name = e.target.value;
                handleChange("mobileSettings", {
                  ...business.mobileSettings,
                  calloutPolicy: {
                    ...business.mobileSettings?.calloutPolicy,
                    zones,
                  },
                });
              }}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <input
              type="number"
              placeholder="Radius KM"
              value={zone.radiusKm || 0}
              onChange={(e) => {
                const zones = [...(business.mobileSettings?.calloutPolicy?.zones || [])];
                zones[index].radiusKm = Number(e.target.value);
                handleChange("mobileSettings", {
                  ...business.mobileSettings,
                  calloutPolicy: {
                    ...business.mobileSettings?.calloutPolicy,
                    zones,
                  },
                });
              }}
              className="w-20 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <input
              type="number"
              placeholder="Fee KES"
              value={zone.fee || 0}
              onChange={(e) => {
                const zones = [...(business.mobileSettings?.calloutPolicy?.zones || [])];
                zones[index].fee = Number(e.target.value);
                handleChange("mobileSettings", {
                  ...business.mobileSettings,
                  calloutPolicy: {
                    ...business.mobileSettings?.calloutPolicy,
                    zones,
                  },
                });
              }}
              className="w-24 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <button
              onClick={() => {
                const zones = [...(business.mobileSettings?.calloutPolicy?.zones || [])];
                zones.splice(index, 1);
                handleChange("mobileSettings", {
                  ...business.mobileSettings,
                  calloutPolicy: {
                    ...business.mobileSettings?.calloutPolicy,
                    zones,
                  },
                });
              }}
              className="px-2 py-1 bg-red-500 text-white rounded-lg"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const zones = [
              ...(business.mobileSettings?.calloutPolicy?.zones || []),
              { name: "", radiusKm: 0, fee: 0 },
            ];
            handleChange("mobileSettings", {
              ...business.mobileSettings,
              calloutPolicy: {
                ...business.mobileSettings?.calloutPolicy,
                zones,
              },
            });
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Add Zone
        </button>
      </div>
    )}

    {/* Max Distance */}
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-600">
        Maximum distance (KM) the mobile worker can travel. 
        Example: If set to 10 KM, customers outside 10 KM from base location cannot book.
      </span>
      <input
        type="number"
        placeholder="e.g., 10 KM"
        value={business.mobileSettings?.maxDistanceKm || 0}
        onChange={(e) =>
          handleChange("mobileSettings", {
            ...business.mobileSettings,
            maxDistanceKm: Number(e.target.value),
          })
        }
        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
      />
    </label>

    <TabSaveButton />
  </div>
)}
  </div>
)}

       {/* LOCATION */}
{activeTab === "Location" && (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Location</h3>

    <p className="text-sm text-gray-500">
      For accurate customer visibility, go to{" "}
      <a
        href="https://gps-coordinates.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-primary"
      >
        gps-coordinates.org
      </a>{" "}
      to get your exact latitude and longitude in decimal degrees.
    </p>

    {/* Address Input */}
    <input
      list="location-suggestions"
      value={business.location?.addressLine || ""}
      onChange={(e) =>
        handleChange("location", {
          ...business.location,
          addressLine: e.target.value,
        })
      }
      placeholder="Type your address here"
      className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
    />
    <datalist id="location-suggestions">
      {LOCATION_SUGGESTIONS.map((place) => (
        <option key={place} value={place} />
      ))}
    </datalist>

    {/* Latitude / Longitude Inputs */}
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Latitude"
        value={business.location?.lat || ""}
        onChange={(e) =>
          handleChange("location", {
            ...business.location,
            lat: parseCoordinate(e.target.value),
          })
        }
        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
      />
      <input
        type="text"
        placeholder="Longitude"
        value={business.location?.lng || ""}
        onChange={(e) =>
          handleChange("location", {
            ...business.location,
            lng: parseCoordinate(e.target.value),
          })
        }
        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
      />
    </div>

    {/* Use Current Location */}
    <button
      type="button"
      onClick={() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              handleChange("location", {
                ...business.location,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
              alert("Location updated based on your current position!");
            },
            (err) => alert("Unable to get your location: " + err.message)
          );
        } else {
          alert("Geolocation is not supported by your browser.");
        }
      }}
      className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
    >
      Use My Current Location
    </button>

    {/* Map Container */}
    <div
      className="relative h-64 rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
      onClick={(e) => {
        // calculate click position to convert to lat/lng approx
        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = (e.clientX - rect.left) / rect.width;
        const yPercent = (e.clientY - rect.top) / rect.height;

        // simple approximation: update lat/lng roughly (better: use Maps API for accuracy)
        if (business.location?.lat && business.location?.lng) {
          handleChange("location", {
            ...business.location,
            lat: business.location.lat - (yPercent - 0.5) * 0.01,
            lng: business.location.lng + (xPercent - 0.5) * 0.01,
          });
        }
      }}
    >
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.google.com/maps?q=${
          business.location?.lat && business.location?.lng
            ? `${business.location.lat},${business.location.lng}`
            : encodeURIComponent(business.location?.addressLine || "")
        }&z=${mapZoom}&output=embed`}
      />
      {/* Zoom Slider */}
      <input
        type="range"
        min={10}
        max={21}
        value={mapZoom}
        onChange={(e) => setMapZoom(Number(e.target.value))}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-44 w-2 bg-gray-300 rounded-full appearance-none cursor-pointer"
      />
    </div>

    {/* Display Coordinates */}
    {business.location?.lat && business.location?.lng && (
      <div className="text-sm text-gray-600 mt-1">
        Latitude: {business.location.lat.toFixed(6)}, Longitude:{" "}
        {business.location.lng.toFixed(6)}
      </div>
    )}

    {/* Refresh Map */}
    <button
      onClick={() => setBusiness({ ...business })}
      className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
    >
      Refresh Map
    </button>
    <TabSaveButton />
  </div>
)}


        {/* STAFF MANAGEMENT */}
        {activeTab === "Staff Management" && (
          <StaffOverview
            staffList={staffList}
            services={services}
          />
        )}

        {/* SERVICES MANAGEMENT */}
        {activeTab === "Services Management" && (
          <ServicesManager business={business} />
        )}

      

       
        </div>
      </div>
    
  );
}
