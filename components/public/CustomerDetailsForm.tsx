import { useState, useEffect } from "react";
import ImageUpload from "@/components/ImageUpload";

interface Props {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  note?: string;
  customerLocation?: { address: string; lat: number; lng: number };
  services: any[];
  promoCode?: string; // optional incoming promo code
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange?: (v: string) => void;
  onNoteChange: (v: string) => void;
  onLocationChange: (loc: { address: string; lat: number; lng: number }) => void;
  onServiceRefsChange: (serviceId: string, urls: string[]) => void;
  onPromoCodeChange?: (code: string) => void; // callback to parent
}

export default function CustomerDetailsForm({
  customerName,
  customerPhone,
  customerEmail,
  note,
  customerLocation,
  services,
  promoCode: initialPromoCode,
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

  // Initialize local state from incoming services
  useEffect(() => {
    const initial: Record<string, string[]> = {};
    services.forEach((s) => {
      initial[s._id] = s.selectedRefs || [];
    });
    setServiceRefs(initial);
  }, [services]);

  const handleRefsChange = (serviceId: string, urls: string[]) => {
    setServiceRefs((prev) => ({ ...prev, [serviceId]: urls }));
    onServiceRefsChange(serviceId, urls);
  };

  const handlePromoCodeChange = (code: string) => {
    setPromoCode(code);
    if (onPromoCodeChange) onPromoCodeChange(code);
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg">Your details</h3>

      {/* Name */}
      <div>
        <label className="text-sm font-medium">Full name</label>
        <input
          value={customerName}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          placeholder="e.g. Ashley Muchiri"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-sm font-medium">Phone number</label>
        <input
          value={customerPhone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          placeholder="07XXXXXXXX"
          inputMode="numeric"
        />
      </div>

      {/* Email */}
      {onEmailChange && (
        <div>
          <label className="text-sm font-medium">
            Email <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            value={customerEmail || ""}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            placeholder="you@example.com"
          />
        </div>
      )}

      {/* Promo Code */}
      <div>
        <label className="text-sm font-medium">
          Promo Code <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          value={promoCode}
          onChange={(e) => handlePromoCodeChange(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          placeholder="Enter promo code"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium">
          Notes <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          value={note || ""}
          onChange={(e) => onNoteChange(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          rows={3}
          placeholder="Anything we should know?"
        />
      </div>

      {/* Customer Location */}
      <div className="space-y-2">
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          Your location (for mobile service)
          <input
            type="text"
            placeholder="Address e.g., Imara Daima"
            value={customerLocation?.address || ""}
            onChange={(e) =>
              onLocationChange({
                ...(customerLocation || { lat: 0, lng: 0 }),
                address: e.target.value,
              })
            }
            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Latitude e.g., -1.322"
            value={customerLocation?.lat || ""}
            onChange={(e) =>
              onLocationChange({
                ...(customerLocation || { address: "", lng: 0 }),
                lat: parseFloat(e.target.value),
              })
            }
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <input
            type="text"
            placeholder="Longitude e.g., 36.874"
            value={customerLocation?.lng || ""}
            onChange={(e) =>
              onLocationChange({
                ...(customerLocation || { address: "", lat: 0 }),
                lng: parseFloat(e.target.value),
              })
            }
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Customer Reference Images per Service */}
      {services.map((s) => (
        <div key={s._id} className="space-y-2">
          <p className="text-sm font-medium">
            {s.name} - Upload reference images (optional)
          </p>
          <ImageUpload
            value={serviceRefs[s._id] || []}
            onChange={(urls) => handleRefsChange(s._id, urls)}
            maxFiles={5}
          />
        </div>
      ))}
    </div>
  );
}
