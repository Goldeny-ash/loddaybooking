"use client";

import { useEffect, useMemo, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import PreciseLocationButton from "@/components/public/PreciseLocationButton";
import { kenyaAdministrative } from "@/lib/constants/kenyaAdministrative";
import type { CustomerLocation } from "@/lib/types/customerLocation";

interface ServiceItem {
  _id: string;
  name: string;
  selectedRefs?: string[];
  isMobile?: boolean;
}

interface Props {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  note?: string;
  customerLocation?: CustomerLocation;
  services: ServiceItem[];
  promoCode?: string;
  showMobileLocation?: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange?: (value: string) => void;
  onNoteChange: (value: string) => void;
  onLocationChange: (location: CustomerLocation) => void;
  onServiceRefsChange: (serviceId: string, urls: string[]) => void;
  onPromoCodeChange?: (code: string) => void;
}

const EMPTY_LOCATION: CustomerLocation = {
  county: "",
  subCounty: "",
  ward: "",
  address: "",
  locationDescription: "",
  mapsLink: "",
};

export default function CustomerDetailsForm({
  customerName,
  customerPhone,
  customerEmail,
  note,
  customerLocation,
  services,
  promoCode: initialPromoCode,
  showMobileLocation = false,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onNoteChange,
  onLocationChange,
  onServiceRefsChange,
  onPromoCodeChange,
}: Props) {
  const [serviceRefs, setServiceRefs] = useState<Record<string, string[]>>({});
  const [promoCode, setPromoCode] = useState(initialPromoCode || "");

  useEffect(() => {
    const initial: Record<string, string[]> = {};
    services.forEach((service) => {
      initial[service._id] = service.selectedRefs || [];
    });
    setServiceRefs(initial);
  }, [services]);

  const location = customerLocation || EMPTY_LOCATION;
  const selectedCounty = useMemo(
    () => kenyaAdministrative.find((item) => item.county === location.county),
    [location.county]
  );
  const subCountyOptions = selectedCounty?.subCounties ?? [];
  const selectedSubCounty = subCountyOptions.find((item) => item.name === location.subCounty);
  const wardOptions = selectedSubCounty?.wards ?? [];
  const requiresWard = wardOptions.length > 0;

  const handleRefsChange = (serviceId: string, urls: string[]) => {
    setServiceRefs((prev) => ({ ...prev, [serviceId]: urls }));
    onServiceRefsChange(serviceId, urls);
  };

  const handlePromoCodeChange = (code: string) => {
    setPromoCode(code);
    onPromoCodeChange?.(code);
  };

  const updateLocation = (next: Partial<CustomerLocation>) => {
    const merged = {
      ...EMPTY_LOCATION,
      ...location,
      ...next,
    };

    const addressParts = [merged.ward, merged.subCounty, merged.county].filter(Boolean);
    merged.address = addressParts.join(", ");

    onLocationChange(merged);
  };

  return (
    <div className="space-y-6 text-white">
      <h3 className="text-lg font-semibold">Your details</h3>

      <div>
        <label className="text-sm font-medium text-white">Full name *</label>
        <input
          value={customerName}
          onChange={(event) => onNameChange(event.target.value)}
          className="mt-1 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/60"
          placeholder="e.g. john doe"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-white">Phone number *</label>
        <input
          value={customerPhone}
          onChange={(event) => onPhoneChange(event.target.value)}
          className="mt-1 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/60"
          placeholder="07XXXXXXXX"
          inputMode="numeric"
        />
      </div>

      {onEmailChange ? (
        <div>
          <label className="text-sm font-medium text-white">Email *</label>
          <input
            value={customerEmail || ""}
            onChange={(event) => onEmailChange(event.target.value)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/60"
            placeholder="you@example.com"
          />
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-white">
          Promo code <span className="text-white/70">(optional)</span>
        </label>
        <input
          value={promoCode}
          onChange={(event) => handlePromoCodeChange(event.target.value)}
          className="mt-1 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/60"
          placeholder="Enter promo code"
        />
      </div>

      {showMobileLocation ? (
        <div className="space-y-4 rounded-xl border border-white/15 bg-white/5 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">Your location for mobile services</p>
            <p className="text-xs text-white/75">
              Select your county, sub-county, and ward first, then describe where you are.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-white">County</label>
            <select
              value={location.county}
              onChange={(event) =>
                updateLocation({
                  county: event.target.value,
                  subCounty: "",
                  ward: "",
                })
              }
              className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-white"
            >
              <option value="" className="text-black">
                Select county
              </option>
              {kenyaAdministrative.map((item) => (
                <option key={item.county} value={item.county} className="text-black">
                  {item.county}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white">Sub-county</label>
            <select
              value={location.subCounty}
              onChange={(event) =>
                updateLocation({
                  subCounty: event.target.value,
                  ward: "",
                })
              }
              disabled={!location.county}
              className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-white disabled:opacity-60"
            >
              <option value="" className="text-black">
                Select sub-county
              </option>
              {subCountyOptions.map((item) => (
                <option key={item.name} value={item.name} className="text-black">
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {requiresWard ? (
            <div>
              <label className="text-sm font-medium text-white">Ward</label>
              <select
                value={location.ward || ""}
                onChange={(event) => updateLocation({ ward: event.target.value })}
                disabled={!location.subCounty}
                className="mt-1 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-white disabled:opacity-60"
              >
                <option value="" className="text-black">
                  Select ward
                </option>
                {wardOptions.map((ward) => (
                  <option key={typeof ward === "string" ? ward : ward.name} value={typeof ward === "string" ? ward : ward.name} className="text-black">
                    {typeof ward === "string" ? ward : ward.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="text-sm font-medium text-white">Location description</label>
            <textarea
              value={location.locationDescription || ""}
              onChange={(event) => updateLocation({ locationDescription: event.target.value })}
              className="mt-1 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/60"
              rows={3}
              placeholder="Describe your current location, nearby landmark, apartment, floor, or house number."
            />
          </div>

          <PreciseLocationButton
            onLocationResolved={({ lat, lng, mapsLink }) =>
              updateLocation({
                lat,
                lng,
                mapsLink,
              })
            }
          />

          {location.mapsLink ? (
            <a
              href={location.mapsLink}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm text-white underline underline-offset-4"
            >
              Open generated Google Maps location
            </a>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-white">
          Notes <span className="text-white/70">(optional)</span>
        </label>
        <textarea
          value={note || ""}
          onChange={(event) => onNoteChange(event.target.value)}
          className="mt-1 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/60"
          rows={3}
          placeholder="Anything we should know?"
        />
      </div>

      {services.map((service) => (
        <div key={service._id} className="space-y-2">
          <p className="text-sm font-medium text-white">
            {service.name} - Upload reference images (optional)
          </p>
          <ImageUpload
            value={serviceRefs[service._id] || []}
            onChange={(urls) => handleRefsChange(service._id, urls)}
            maxFiles={5}
          />
        </div>
      ))}
    </div>
  );
}
function normalizeWard(ward: string | { name: string; areas: string[] }) {
  if (typeof ward === "string") {
    return { name: ward, areas: [] as string[] };
  }

  return {
    name: ward.name,
    areas: Array.isArray(ward.areas) ? ward.areas : [],
  };
}
