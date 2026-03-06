"use client";

import { useEffect, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import ServiceHelpPopup from "@/components/dashboard/ServiceHelpPopup";
import ThemedPopup from "@/components/ThemedPopup";

/* ================= TYPES ================= */

interface PriceTier {
  label: string;
  price?: number;
  min?: number;
  max?: number;
}

interface SessionPackage {
  sessions: number;
  price: number;
}

interface AreaPrice {
  area: string;
  min?: number;
  max?: number;
}

interface AddOn {
  title: string;
  price: number;
  durationMinutes: number;
}

interface CategoryData {
  _id?: string;
  category: string;
  customCategory?: string;
  subCategory?: string;
  tags?: string[];
  targetGender: "women" | "men" | "unisex";
  durationMinutes?: number;

  basePrice?: number;
  priceRangeMin?: number;
  priceRangeMax?: number;
  priceRange?: {
    min?: number;
    max?: number;
  };

  priceTiers?: PriceTier[];
  sessionPackages?: SessionPackage[];
  areaPricing?: AreaPrice[];
  addOns?: AddOn[];

  depositEnabled?: boolean;
  depositType?: "fixed" | "percent";
  depositValue?: number;

  mobileEligible?: boolean;
  gallery?: string[];
}

/* FIX depositOverride typing */
type CategoryDataWithDeposit = CategoryData & {
  depositOverride?: {
    enabled?: boolean;
    type?: "fixed" | "percent";
    value?: number;
  };
};

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (service: CategoryData) => void;
  onDelete?: (serviceId: string) => void | Promise<void>;
  initialData?: CategoryData & {
    name: string;
    description: string;
  };
}

const CATEGORY_OPTIONS = [
  "Hair",
  "Nails",
  "Body Enhancements",
  "Permanent Makeup",
  "Beauty Treatments",
  "Other",
] as const;

export default function AddServiceForm({
  open,
  onClose,
  onAdd,
  onDelete,
  initialData,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{
    message: string;
    closeForm?: boolean;
    deletedId?: string;
    variant?: "success" | "error";
  } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const showPopup = (
    message: string,
    options?: {
      closeForm?: boolean;
      deletedId?: string;
      variant?: "success" | "error";
    }
  ) => {
    setPopup({ message, ...options });
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [currentCategory, setCurrentCategory] =
    useState<CategoryDataWithDeposit>({
      category: "",
      targetGender: "unisex",
      priceTiers: [],
      sessionPackages: [],
      areaPricing: [],
      addOns: [],
      gallery: [],
      depositEnabled: false,
      depositType: "fixed",
      depositValue: 0,
    });

  /* ================= HELPERS ================= */

  const normalizeNumber = (val: string) => {
    if (!val) return 0;
    return Number(val.replace(/^0+/, ""));
  };

  const activePricingMode = (() => {
    if (currentCategory.basePrice) return "base";
    if (
      currentCategory.priceRangeMin ||
      currentCategory.priceRangeMax
    )
      return "range";
    if (currentCategory.priceTiers?.length) return "tier";
    if (currentCategory.sessionPackages?.length) return "package";
    if (currentCategory.areaPricing?.length) return "area";
    return null;
  })();

  const updateField = (
    key: keyof CategoryDataWithDeposit,
    value: any
  ) => setCurrentCategory(prev => ({ ...prev, [key]: value }));

  const updateArrayItem = (
    key: keyof CategoryDataWithDeposit,
    index: number,
    field: string,
    value: any
  ) => {
    const copy = [...(currentCategory[key] as any[])];
    copy[index][field] = value;
    updateField(key, copy);
  };

  const removeArrayItem = (
    key: keyof CategoryDataWithDeposit,
    index: number
  ) => {
    const copy = [...(currentCategory[key] as any[])];
    copy.splice(index, 1);
    updateField(key, copy);
  };

  const addArrayItem = (
    key: keyof CategoryDataWithDeposit,
    value: any
  ) => {
    updateField(key, [
      ...(currentCategory[key] as any[]),
      value,
    ]);
  };

  /* ================= INIT EDIT ================= */

  useEffect(() => {
  if (!initialData) return;

  const data = initialData as CategoryDataWithDeposit;
  const incomingCategory = data.category || "";
  const isKnownCategory = CATEGORY_OPTIONS.includes(
    incomingCategory as (typeof CATEGORY_OPTIONS)[number]
  );

  setName(initialData.name || "");
  setDescription(initialData.description || "");

  setCurrentCategory(prev => ({
  ...prev,
  ...data,
  category: isKnownCategory ? incomingCategory : "Other",
  customCategory: isKnownCategory ? data.customCategory || "" : incomingCategory,

  priceRangeMin: data.priceRange?.min ?? 0,
  priceRangeMax: data.priceRange?.max ?? 0,

  mobileEligible: data.mobileEligible ?? false,

  depositEnabled: data.depositOverride?.enabled ?? false,
  depositType: data.depositOverride?.type ?? "fixed",
  depositValue: data.depositOverride?.value ?? 0,
}));
}, [initialData]);

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) return showPopup("Service name is required", { variant: "error" });
    if (!currentCategory.category)
      return showPopup("Category is required", { variant: "error" });
    if (
      currentCategory.category === "Other" &&
      !currentCategory.customCategory?.trim()
    ) {
      return showPopup("Please type the category name", { variant: "error" });
    }
    if (!currentCategory.durationMinutes)
      return showPopup("Duration is required", { variant: "error" });

    const hasPricing =
      currentCategory.basePrice ||
      currentCategory.priceRangeMin ||
      currentCategory.priceRangeMax ||
      currentCategory.priceTiers?.length ||
      currentCategory.sessionPackages?.length ||
      currentCategory.areaPricing?.length;

    if (!hasPricing)
      return showPopup(
        "You must define at least one pricing structure",
        { variant: "error" }
      );

    setLoading(true);

    try {
const resolvedCategory =
  currentCategory.category === "Other"
    ? "Other"
    : currentCategory.category;

const body: any = {
  name,
  description,
  ...currentCategory,
  category: resolvedCategory,
  customCategory:
    currentCategory.category === "Other"
      ? currentCategory.customCategory?.trim()
      : undefined,

  priceRange:
    currentCategory.priceRangeMin ||
    currentCategory.priceRangeMax
      ? {
          min: currentCategory.priceRangeMin || 0,
          max: currentCategory.priceRangeMax || 0,
        }
      : undefined,

  depositOverride: currentCategory.depositEnabled
    ? {
        enabled: true,
        type: currentCategory.depositType,
        value: currentCategory.depositValue,
      }
    : undefined,
};

delete body.priceRangeMin;
delete body.priceRangeMax;
delete body.depositEnabled;
delete body.depositType;
delete body.depositValue;

      const url = initialData?._id
        ? `/api/services/${initialData._id}`
        : "/api/services";

      const method = initialData?._id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed");

    if (data.service) onAdd(data.service);

showPopup(
  initialData?._id
    ? "Service updated successfully"
    : "Service created successfully",
  { closeForm: true, variant: "success" }
);
    } catch (err) {
      showPopup(
        err instanceof Error ? err.message : "Network error",
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

    return (
    <div className="fixed inset-0 z-50 flex justify-center items-start overflow-auto bg-black/30 p-4">
      <ServiceHelpPopup
        show={showHelp}
        onClose={() => setShowHelp(false)}
      />

      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-xl space-y-6"
      >
        <h2 className="text-xl font-bold flex justify-between">
          Add Service
          <button type="button" onClick={() => setShowHelp(true)}>
            ?
          </button>
        </h2>

        {/* CATEGORY */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">
            Category *
          </label>
          <select
            className="border p-2 w-full rounded"
            value={currentCategory.category}
            onChange={(e) =>
              updateField("category", e.target.value)
            }
          >
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {currentCategory.category === "Other" && (
          <div className="space-y-2">
            <label className="text-sm font-medium block">
              Type Category *
            </label>
            <input
              className="border p-2 w-full rounded"
              value={currentCategory.customCategory || ""}
              onChange={(e) =>
                updateField("customCategory", e.target.value)
              }
              placeholder="e.g. Barbering"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium block">
            Service Name *
          </label>
          <input
            placeholder="Enter service name"
            className="border p-2 w-full rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium block">
            Description
          </label>
          <textarea
            placeholder="Optional description"
            className="border p-2 w-full rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* DURATION */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">
            Duration *
          </label>
          <p className="text-xs text-gray-500">
            How long will this service take?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Hours"
              className="border p-2 rounded"
              value={
                Math.floor((currentCategory.durationMinutes || 0) / 60) ||
                ""
              }
              onChange={(e) => {
                const hours = normalizeNumber(e.target.value);
                const mins =
                  currentCategory.durationMinutes
                    ? currentCategory.durationMinutes % 60
                    : 0;
                updateField("durationMinutes", hours * 60 + mins);
              }}
            />
            <input
              type="number"
              placeholder="Minutes"
              className="border p-2 rounded"
              value={
                currentCategory.durationMinutes
                  ? currentCategory.durationMinutes % 60
                  : ""
              }
              onChange={(e) => {
                const mins = normalizeNumber(e.target.value);
                const hours =
                  currentCategory.durationMinutes
                    ? Math.floor(currentCategory.durationMinutes / 60)
                    : 0;
                updateField("durationMinutes", hours * 60 + mins);
              }}
            />
          </div>
        </div>

        {/* BASE PRICE */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">
            Base Price *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-gray-500">
              KES
            </span>
            <input
              type="number"
              disabled={
                activePricingMode !== null &&
                activePricingMode !== "base"
              }
              className="border pl-12 p-2 w-full rounded"
              value={currentCategory.basePrice || ""}
              onChange={e =>
                updateField(
                  "basePrice",
                  normalizeNumber(e.target.value)
                )
              }
            />
          </div>
          <p className="text-xs text-gray-500">
            Flat price for this service.
          </p>
        </div>

        {/* ADVANCED TOGGLE */}
        <button
          type="button"
          className="text-sm underline text-[var(--brand-primary)]"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced
            ? "Hide Advanced Options"
            : "Show Advanced Options"}
        </button>

        {/* ADVANCED */}
        {showAdvanced && (
          <div className="space-y-6 border-t pt-4">

            {/* PRICE RANGE */}
            <div>
              <h3 className="font-semibold flex gap-2">
                Price Range
                <span title="Use minimum and maximum range pricing">?</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-500">
                    KES
                  </span>
                  <input
                    type="number"
                    disabled={
                      activePricingMode !== null &&
                      activePricingMode !== "range"
                    }
                    className="border pl-12 p-2 w-full"
                    placeholder="Min"
                    value={currentCategory.priceRangeMin || ""}
                    onChange={e =>
                      updateField(
                        "priceRangeMin",
                        normalizeNumber(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-500">
                    KES
                  </span>
                  <input
                    type="number"
                    disabled={
                      activePricingMode !== null &&
                      activePricingMode !== "range"
                    }
                    className="border pl-12 p-2 w-full"
                    placeholder="Max"
                    value={currentCategory.priceRangeMax || ""}
                    onChange={e =>
                      updateField(
                        "priceRangeMax",
                        normalizeNumber(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* PRICE TIERS */}
            <div>
              <h3 className="font-semibold flex gap-2">
                Price Tiers
                <span title="Create pricing based on variations like length or size">?</span>
              </h3>

              {(currentCategory.priceTiers || []).map((tier, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 mt-2">
                  <input
                    placeholder="Label"
                    className="border p-2"
                    value={tier.label}
                    onChange={e =>
                      updateArrayItem("priceTiers", i, "label", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="Min"
                    className="border p-2"
                    value={tier.min || ""}
                    onChange={e =>
                      updateArrayItem(
                        "priceTiers",
                        i,
                        "min",
                        normalizeNumber(e.target.value)
                      )
                    }
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="border p-2"
                    value={tier.max || ""}
                    onChange={e =>
                      updateArrayItem(
                        "priceTiers",
                        i,
                        "max",
                        normalizeNumber(e.target.value)
                      )
                    }
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-xs text-gray-500">
                      KES
                    </span>
                    <input
                      type="number"
                      className="border pl-10 p-2 w-full"
                      value={tier.price || ""}
                      onChange={e =>
                        updateArrayItem(
                          "priceTiers",
                          i,
                          "price",
                          normalizeNumber(e.target.value)
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="col-span-4 bg-red-100 p-1 rounded"
                    onClick={() => removeArrayItem("priceTiers", i)}
                  >
                    Remove Tier
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="mt-2 bg-gray-200 px-3 py-1 rounded"
                onClick={() =>
                  addArrayItem("priceTiers", {
                    label: "",
                    min: 0,
                    max: 0,
                    price: 0,
                  })
                }
              >
                Add Tier
              </button>
            </div>

            {/* SESSION PACKAGES */}
            <div>
              <h3 className="font-semibold flex gap-2">
                Session Packages
                <span title="Bundle sessions together at discounted rate">?</span>
              </h3>

              {(currentCategory.sessionPackages || []).map((pkg, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mt-2">
                  <input
                    type="number"
                    placeholder="Sessions"
                    className="border p-2"
                    value={pkg.sessions}
                    onChange={e =>
                      updateArrayItem(
                        "sessionPackages",
                        i,
                        "sessions",
                        normalizeNumber(e.target.value)
                      )
                    }
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-xs text-gray-500">
                      KES
                    </span>
                    <input
                      type="number"
                      className="border pl-10 p-2 w-full"
                      value={pkg.price}
                      onChange={e =>
                        updateArrayItem(
                          "sessionPackages",
                          i,
                          "price",
                          normalizeNumber(e.target.value)
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="bg-red-100 rounded"
                    onClick={() =>
                      removeArrayItem("sessionPackages", i)
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="mt-2 bg-gray-200 px-3 py-1 rounded"
                onClick={() =>
                  addArrayItem("sessionPackages", {
                    sessions: 1,
                    price: 0,
                  })
                }
              >
                Add Package
              </button>
            </div>

            {/* AREA PRICING */}
            <div>
              <h3 className="font-semibold flex gap-2">
                Area Pricing
                <span title="Charge different rates for different locations">?</span>
              </h3>

              {(currentCategory.areaPricing || []).map((area, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 mt-2">
                  <input
                    placeholder="Area"
                    className="border p-2"
                    value={area.area}
                    onChange={e =>
                      updateArrayItem("areaPricing", i, "area", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="Min"
                    className="border p-2"
                    value={area.min || ""}
                    onChange={e =>
                      updateArrayItem(
                        "areaPricing",
                        i,
                        "min",
                        normalizeNumber(e.target.value)
                      )
                    }
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="border p-2"
                    value={area.max || ""}
                    onChange={e =>
                      updateArrayItem(
                        "areaPricing",
                        i,
                        "max",
                        normalizeNumber(e.target.value)
                      )
                    }
                  />
                  <button
                    type="button"
                    className="bg-red-100 rounded"
                    onClick={() => removeArrayItem("areaPricing", i)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="mt-2 bg-gray-200 px-3 py-1 rounded"
                onClick={() =>
                  addArrayItem("areaPricing", {
                    area: "",
                    min: 0,
                    max: 0,
                  })
                }
              >
                Add Area
              </button>
            </div>

            {/* ADD-ONS */}
            <div>
              <h3 className="font-semibold flex gap-2">
                Add-Ons
                <span title="Optional extras customers can select">?</span>
              </h3>

              {(currentCategory.addOns || []).map((addOn, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mt-2">
                  <input
                    placeholder="Title"
                    className="border p-2"
                    value={addOn.title}
                    onChange={e =>
                      updateArrayItem("addOns", i, "title", e.target.value)
                    }
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-xs text-gray-500">
                      KES
                    </span>
                    <input
                      type="number"
                      className="border pl-10 p-2 w-full"
                      value={addOn.price}
                      onChange={e =>
                        updateArrayItem(
                          "addOns",
                          i,
                          "price",
                          normalizeNumber(e.target.value)
                        )
                      }
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="Duration (min)"
                    className="border p-2"
                    value={addOn.durationMinutes}
                    onChange={e =>
                      updateArrayItem(
                        "addOns",
                        i,
                        "durationMinutes",
                        normalizeNumber(e.target.value)
                      )
                    }
                  />
                  <button
                    type="button"
                    className="col-span-3 bg-red-100 p-1 rounded"
                    onClick={() => removeArrayItem("addOns", i)}
                  >
                    Remove Add-On
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="mt-2 bg-gray-200 px-3 py-1 rounded"
                onClick={() =>
                  addArrayItem("addOns", {
                    title: "",
                    price: 0,
                    durationMinutes: 0,
                  })
                }
              >
                Add Add-On
              </button>
            </div>

           

          </div>
        )}
        <div className="border p-3 rounded space-y-2">
              <label className="text-sm font-medium block">
                Deposit
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentCategory.depositEnabled}
                  onChange={e =>
                    updateField(
                      "depositEnabled",
                      e.target.checked
                    )
                  }
                />
                Enable deposit to book this service
              </label>

              {currentCategory.depositEnabled && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <select
                    className="border p-2 rounded"
                    value={currentCategory.depositType}
                    onChange={e =>
                      updateField(
                        "depositType",
                        e.target.value
                      )
                    }
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percent">Percent</option>
                  </select>

                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-500">
                      {currentCategory.depositType === "fixed"
                        ? "KES"
                        : "%"}
                    </span>
                    <input
                      type="number"
                      className="border pl-12 p-2 w-full rounded"
                      value={currentCategory.depositValue || ""}
                      onChange={e =>
                        updateField(
                          "depositValue",
                          normalizeNumber(e.target.value)
                        )
                      }
                    />
                  </div>
                  
                </div>

                
              )}
            </div>
  {/* MOBILE ELIGIBILITY */}
        <div className="border p-3 rounded space-y-2">
          <label className="text-sm font-medium block">
            Mobile Option
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={currentCategory.mobileEligible ?? false}
              onChange={e =>
                updateField("mobileEligible", e.target.checked)
              }
            />
            Enable at customer location
          </label>
        </div>

        {/* GALLERY */}
        <ImageUpload
          value={currentCategory.gallery || []}
          onChange={(files: string[]) =>
            updateField("gallery", files)
          }
        />

        {/* SAVE */}
        <div className="flex gap-2">
          {!!initialData?._id && (
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                if (!initialData?._id) return;
                setLoading(true);
                try {
                  const res = await fetch(
                    `/api/services/${initialData._id}`,
                    { method: "DELETE" }
                  );
                  const data = await res.json();
                  if (!res.ok || !data?.success) {
                    throw new Error(data?.error || "Delete failed");
                  }
                  showPopup("Service deleted successfully", {
                    closeForm: true,
                    deletedId: initialData._id,
                    variant: "success",
                  });
                } catch (err) {
                  showPopup(
                    err instanceof Error
                      ? err.message
                      : "Failed to delete service",
                    { variant: "error" }
                  );
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--brand-primary)] text-white px-4 py-2 rounded flex-1"
          >
            {loading ? "Saving..." : "Save Service"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 px-4 py-2 rounded flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
      <ThemedPopup
        message={popup?.message || null}
        variant={popup?.variant || "success"}
        onClose={async () => {
          const shouldCloseForm = popup?.closeForm;
          const deletedId = popup?.deletedId;
          setPopup(null);
          if (deletedId && onDelete) {
            await onDelete(deletedId);
          }
          if (shouldCloseForm) {
            onClose();
          }
        }}
      />
    </div>
  );
}


