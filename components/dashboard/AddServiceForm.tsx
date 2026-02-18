"use client";
import { useEffect, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import ServiceHelpPopup from "@/components/dashboard/ServiceHelpPopup";

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
  applicableCategories?: string[];
}

interface CategoryData {
  _id?: string;

  category: string;
  subCategory?: string;
  niche?: string;
  variant?: string;
  tags?: string[];

  targetGender: "women" | "men" | "unisex";
  durationMinutes?: number;

  hair?: {
    hairType?: string;
    hairMaterial?: string;
    hairOrigin?: string;
    lengthTier?: string;
    density?: string;
    texture?: string;
    method?: string;
    specialty?: string;
    braidStyle?: string;
    installMethod?: string;
    weaveType?: string;
    stylingTarget?: string;
    retouchType?: string;
    isChemical?: boolean;
    chemicalType?: string;
    relaxerOwnership?: string;
    brandUsed?: string;
    colorType?: string;
    treatmentType?: string;
  };

  nails?: {
    nailType?: string;
    style?: string;
    addOns?: AddOn[];
  };

  bodyMod?: {
    size?: string;
    colorType?: string;
  };

  pmu?: {
    technique?: string;
    touchUpDurationMonths?: number;
    packageEligible?: boolean;
  };

  beauty?: {
    treatmentType?: string;
    technique?: string;
    sessionFocus?: string;
    packageEligible?: boolean;
  };

  basePrice?: number;
  priceRangeMin?: number;
  priceRangeMax?: number;

  priceTiers?: PriceTier[];
  sessionPackages?: SessionPackage[];
  areaPricing?: AreaPrice[];

  staffIds?: string[];

  depositEnabled?: boolean;
  depositType?: "fixed" | "percent";
  depositValue?: number;

  addOns?: AddOn[];

  promotions?: unknown[];

  medicalEligible?: boolean;
  medicalDiscountPercent?: number;

  mobileEligibility?: boolean;

  gallery?: string[];
}

interface AddServiceFormProps {
  open: boolean;
  onClose: () => void;
  onAdd: (service: CategoryData) => void;
  initialData?: CategoryData & { name: string; description: string };
}

const defaultAddOn: AddOn = {
  title: "",
  price: 0,
  durationMinutes: 0,
  applicableCategories: [],
};

export default function AddServiceForm({
  open,
  onClose,
  onAdd,
  initialData,
}: AddServiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [currentCategory, setCurrentCategory] = useState<CategoryData>({
    category: "",
    targetGender: "unisex",
    staffIds: [],
    depositEnabled: false,
    depositType: "fixed",
    depositValue: 0,
    gallery: [],
    priceTiers: [],
    sessionPackages: [],
    areaPricing: [],
    addOns: [],
    tags: [],
  });

  useEffect(() => {
  if (!initialData) return;

  setName(initialData.name || "");
  setDescription(initialData.description || "");

  setCurrentCategory((prev) => ({
    ...prev,
    ...initialData,
  }));
}, [initialData]);

  const updateCategoryField = <K extends keyof CategoryData>(
    key: K,
    value: CategoryData[K]
  ) =>
    setCurrentCategory((prev) => ({
      ...prev,
      [key]: value,
    }));

  const updateNestedField = <
    P extends keyof CategoryData,
    K extends string,
  >(
    parent: P,
    key: K,
    value: unknown
  ) =>
    setCurrentCategory((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as Record<
          string,
          unknown
        > | undefined),
        [key]: value,
      },
    }));

  const handleAddAddOn = () =>
    updateCategoryField("addOns", [
      ...(currentCategory.addOns || []),
      { ...defaultAddOn },
    ]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    if (!name) {
      setError("Service name is required");
      return;
    }

    if (!currentCategory.category) {
      setError("Category is required");
      return;
    }

    setLoading(true);

    try {
      const body = {
  name,
  description,
  ...currentCategory,
  depositOverride: currentCategory.depositEnabled
    ? {
        enabled: currentCategory.depositEnabled,
        type: currentCategory.depositType,
        value: currentCategory.depositValue,
      }
    : undefined,
};
delete body.depositEnabled;
delete body.depositType;
delete body.depositValue;

      const url = initialData?._id
        ? `/api/services/${initialData._id}`
        : "/api/services";

      const method = initialData?._id
        ? "PATCH"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(body),
      });

      const data: {
        success: boolean;
        service?: CategoryData;
        error?: string;
      } = await res.json();

      if (!data.success)
        throw new Error(
          data.error ||
            "Failed to save service"
        );

      if (data.service)
        onAdd(data.service);

      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error"
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
        onClose={() =>
          setShowHelp(false)
        }
      />

      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-180 max-h-[90vh] overflow-y-auto p-6 rounded-xl space-y-5 relative"
      >
        <h2 className="text-xl font-bold flex justify-between items-center">
          Add Service
          <button
            type="button"
            onClick={() =>
              setShowHelp(true)
            }
            className="text-blue-500 text-lg font-bold"
          >
            ?
          </button>
        </h2>

        {/* Service Name & Description */}
        <input
          placeholder="Service Name"
          className="border p-2 w-full"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <textarea
          placeholder="Description"
          className="border p-2 w-full"
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
        />

        {/* Subcategory */}
        <input
          placeholder="Sub Category"
          className="border p-2 w-full"
          value={
            currentCategory.subCategory ||
            ""
          }
          onChange={(e) =>
            updateCategoryField(
              "subCategory",
              e.target.value
            )
          }
        />

        {/* Tags */}
        <input
          placeholder="Tags (comma separated)"
          className="border p-2 w-full"
          value={
            currentCategory.tags?.join(
              ", "
            ) || ""
          }
          onChange={(e) =>
            updateCategoryField(
              "tags",
              e.target.value
                .split(",")
                .map((t) =>
                  t.trim()
                )
            )
          }
        />

        {/* Duration */}
        <input
          type="number"
          placeholder="Duration (minutes)"
          className="border p-2 w-full"
          value={
            currentCategory.durationMinutes ||
            ""
          }
          onChange={(e) =>
            updateCategoryField(
              "durationMinutes",
              Number(e.target.value)
            )
          }
        />

        {/* Category Select */}
        <select
          className="border p-2 w-full"
          value={
            currentCategory.category
          }
          onChange={(e) =>
            updateCategoryField(
              "category",
              e.target.value
            )
          }
        >
          <option value="">
            Select Category
          </option>
          <option value="Hair">
            Hair
          </option>
          <option value="Nails">
            Nails
          </option>
          <option value="Waxing">
            Waxing
          </option>
          <option value="Body Enhancements">
            Body Enhancements
          </option>
          <option value="Permanent Makeup">
            Permanent Makeup
          </option>
          <option value="Makeup">
            Makeup
          </option>
          <option value="Beauty Treatments">
            Beauty Treatments
          </option>
        </select>

        {/* CATEGORY-SPECIFIC FIELDS */}
        {currentCategory.category === "Hair" && (
          <div className="space-y-2 border p-3 rounded">
            <h3 className="font-semibold">
              Hair Details
            </h3>
            {[
              "lengthTier",
              "density",
              "installMethod",
              "retouchType",
              "brandUsed",
            ].map((field) => (
              <input
                key={field}
                placeholder={field.replace(
                  /([A-Z])/g,
                  " $1"
                )}
                className="border p-2 w-full"
                value={String(
                  (currentCategory.hair?.[
                    field as keyof typeof currentCategory.hair
                  ] as string) ||
                    ""
                )}
                onChange={(e) =>
                  updateNestedField(
                    "hair",
                    field,
                    e.target.value
                  )
                }
              />
            ))}
          </div>
        )}

        {currentCategory.category === "Nails" && (
          <div className="space-y-2 border p-3 rounded">
            <h3 className="font-semibold">
              Nails Details
            </h3>
            <input
              placeholder="Nail Type"
              className="border p-2 w-full"
              value={
                currentCategory.nails
                  ?.nailType || ""
              }
              onChange={(e) =>
                updateNestedField(
                  "nails",
                  "nailType",
                  e.target.value
                )
              }
            />
            <input
              placeholder="Style"
              className="border p-2 w-full"
              value={
                currentCategory.nails
                  ?.style || ""
              }
              onChange={(e) =>
                updateNestedField(
                  "nails",
                  "style",
                  e.target.value
                )
              }
            />
          </div>
        )}

        {currentCategory.category ===
          "Body Enhancements" && (
          <div className="space-y-2 border p-3 rounded">
            <h3 className="font-semibold">
              Body Modifications
            </h3>
            <input
              placeholder="Size"
              className="border p-2 w-full"
              value={
                currentCategory.bodyMod
                  ?.size || ""
              }
              onChange={(e) =>
                updateNestedField(
                  "bodyMod",
                  "size",
                  e.target.value
                )
              }
            />
            <input
              placeholder="Color Type"
              className="border p-2 w-full"
              value={
                currentCategory.bodyMod
                  ?.colorType || ""
              }
              onChange={(e) =>
                updateNestedField(
                  "bodyMod",
                  "colorType",
                  e.target.value
                )
              }
            />
          </div>
        )}

        {currentCategory.category ===
          "Permanent Makeup" && (
          <div className="space-y-2 border p-3 rounded">
            <h3 className="font-semibold">
              PMU Details
            </h3>
            <input
              placeholder="Technique"
              className="border p-2 w-full"
              value={
                currentCategory.pmu
                  ?.technique || ""
              }
              onChange={(e) =>
                updateNestedField(
                  "pmu",
                  "technique",
                  e.target.value
                )
              }
            />
            <input
              type="number"
              placeholder="Touch-Up Duration (Months)"
              className="border p-2 w-full"
              value={
                currentCategory.pmu
                  ?.touchUpDurationMonths ||
                ""
              }
              onChange={(e) =>
                updateNestedField(
                  "pmu",
                  "touchUpDurationMonths",
                  Number(e.target.value)
                )
              }
            />
          </div>
        )}

        {currentCategory.category ===
          "Beauty Treatments" && (
          <div className="space-y-2 border p-3 rounded">
            <h3 className="font-semibold">
              Beauty Treatment Details
            </h3>
            <input
              placeholder="Treatment Type"
              className="border p-2 w-full"
              value={
                currentCategory.beauty
                  ?.treatmentType || ""
              }
              onChange={(e) =>
                updateNestedField(
                  "beauty",
                  "treatmentType",
                  e.target.value
                )
              }
            />
            <input
              placeholder="Technique / Focus"
              className="border p-2 w-full"
              value={
                currentCategory.beauty
                  ?.technique || ""
              }
              onChange={(e) =>
                updateNestedField(
                  "beauty",
                  "technique",
                  e.target.value
                )
              }
            />
          </div>
        )}

        {/* PRICING */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="number"
            placeholder="Base Price"
            className="border p-2"
            value={
              currentCategory.basePrice ||
              ""
            }
            onChange={(e) =>
              updateCategoryField(
                "basePrice",
                Number(e.target.value)
              )
            }
          />

          <input
            type="number"
            placeholder="Price From"
            className="border p-2"
            value={
              currentCategory.priceRangeMin ||
              ""
            }
            onChange={(e) =>
              updateCategoryField(
                "priceRangeMin",
                Number(e.target.value)
              )
            }
          />

          <input
            type="number"
            placeholder="Price To"
            className="border p-2"
            value={
              currentCategory.priceRangeMax ||
              ""
            }
            onChange={(e) =>
              updateCategoryField(
                "priceRangeMax",
                Number(e.target.value)
              )
            }
          />
        </div>

        {/* PRICE TIERS */}
        <div className="border p-3 rounded space-y-2 mt-2">
          <h3 className="font-semibold">
            Price Tiers
          </h3>

          {(currentCategory.priceTiers ||
            []).map((tier, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
            >
              <input
                placeholder="Label"
                className="border p-2 flex-1 w-full"
                value={tier.label}
                onChange={(e) => {
                  const newTiers = [
                    ...(currentCategory.priceTiers ||
                      []),
                  ];
                  newTiers[i].label =
                    e.target.value;
                  updateCategoryField(
                    "priceTiers",
                    newTiers
                  );
                }}
              />

              <input
                type="number"
                placeholder="Min"
                className="border p-2 w-full sm:w-24"
                value={tier.min || ""}
                onChange={(e) => {
                  const newTiers = [
                    ...(currentCategory.priceTiers ||
                      []),
                  ];
                  newTiers[i].min =
                    Number(
                      e.target.value
                    );
                  updateCategoryField(
                    "priceTiers",
                    newTiers
                  );
                }}
              />

              <input
                type="number"
                placeholder="Max"
                className="border p-2 w-full sm:w-24"
                value={tier.max || ""}
                onChange={(e) => {
                  const newTiers = [
                    ...(currentCategory.priceTiers ||
                      []),
                  ];
                  newTiers[i].max =
                    Number(
                      e.target.value
                    );
                  updateCategoryField(
                    "priceTiers",
                    newTiers
                  );
                }}
              />

              <input
                type="number"
                placeholder="Price"
                className="border p-2 w-full sm:w-24"
                value={tier.price || ""}
                onChange={(e) => {
                  const newTiers = [
                    ...(currentCategory.priceTiers ||
                      []),
                  ];
                  newTiers[i].price =
                    Number(
                      e.target.value
                    );
                  updateCategoryField(
                    "priceTiers",
                    newTiers
                  );
                }}
              />

              <button
                type="button"
                className="bg-red-200 px-2 py-1 rounded w-full sm:w-auto"
                onClick={() => {
                  const newTiers = [
                    ...(currentCategory.priceTiers ||
                      []),
                  ];
                  newTiers.splice(i, 1);
                  updateCategoryField(
                    "priceTiers",
                    newTiers
                  );
                }}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="bg-gray-200 px-3 py-1 rounded"
            onClick={() =>
              updateCategoryField(
                "priceTiers",
                [
                  ...(currentCategory.priceTiers ||
                    []),
                  {
                    label: "",
                    min: 0,
                    max: 0,
                    price: 0,
                  },
                ]
              )
            }
          >
            Add Price Tier
          </button>
        </div>

        {/* Add-Ons Section */}
        <div className="border p-3 rounded space-y-2">
          <h3 className="font-semibold">
            Service Add-Ons
          </h3>
          {(currentCategory.addOns ||
            []).map((addOn, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
            >
              <input
                placeholder="Title"
                className="border p-2 flex-1 w-full"
                value={addOn.title}
                onChange={(e) => {
                  const newAddOns = [
                    ...(currentCategory.addOns ||
                      []),
                  ];
                  newAddOns[i].title =
                    e.target.value;
                  updateCategoryField(
                    "addOns",
                    newAddOns
                  );
                }}
              />
              <input
                type="number"
                placeholder="Price"
                className="border p-2 w-full sm:w-24"
                value={addOn.price}
                onChange={(e) => {
                  const newAddOns = [
                    ...(currentCategory.addOns ||
                      []),
                  ];
                  newAddOns[i].price =
                    Number(
                      e.target.value
                    );
                  updateCategoryField(
                    "addOns",
                    newAddOns
                  );
                }}
              />
              <input
                type="number"
                placeholder="Duration (min)"
                className="border p-2 w-full sm:w-28"
                value={
                  addOn.durationMinutes
                }
                onChange={(e) => {
                  const newAddOns = [
                    ...(currentCategory.addOns ||
                      []),
                  ];
                  newAddOns[i].durationMinutes =
                    Number(
                      e.target.value
                    );
                  updateCategoryField(
                    "addOns",
                    newAddOns
                  );
                }}
              />
              <button
                type="button"
                className="bg-red-200 px-2 py-1 rounded w-full sm:w-auto"
                onClick={() => {
                  const newAddOns = [
                    ...(currentCategory.addOns ||
                      []),
                  ];
                  newAddOns.splice(i, 1);
                  updateCategoryField(
                    "addOns",
                    newAddOns
                  );
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="bg-gray-200 px-3 py-1 rounded"
            onClick={handleAddAddOn}
          >
            Add Add-On
          </button>
        </div>

        {/* SESSION PACKAGES */}
        <div className="border p-3 rounded space-y-2 mt-2">
          <h3 className="font-semibold">
            Session Packages
          </h3>
          {(currentCategory.sessionPackages ||
            []).map((pkg, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
            >
              <input
                type="number"
                placeholder="Sessions"
                className="border p-2 w-full sm:w-24"
                value={pkg.sessions}
                onChange={(e) => {
                  const newPkgs = [
                    ...(currentCategory.sessionPackages ||
                      []),
                  ];
                  newPkgs[i].sessions =
                    Number(
                      e.target.value
                    );
                  updateCategoryField(
                    "sessionPackages",
                    newPkgs
                  );
                }}
              />
              <input
                type="number"
                placeholder="Price"
                className="border p-2 w-full sm:w-24"
                value={pkg.price}
                onChange={(e) => {
                  const newPkgs = [
                    ...(currentCategory.sessionPackages ||
                      []),
                  ];
                  newPkgs[i].price =
                    Number(
                      e.target.value
                    );
                  updateCategoryField(
                    "sessionPackages",
                    newPkgs
                  );
                }}
              />
              <button
                type="button"
                className="bg-red-200 px-2 py-1 rounded w-full sm:w-auto"
                onClick={() => {
                  const newPkgs = [
                    ...(currentCategory.sessionPackages ||
                      []),
                  ];
                  newPkgs.splice(i, 1);
                  updateCategoryField(
                    "sessionPackages",
                    newPkgs
                  );
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="bg-gray-200 px-3 py-1 rounded"
            onClick={() =>
              updateCategoryField(
                "sessionPackages",
                [
                  ...(currentCategory.sessionPackages ||
                    []),
                  {
                    sessions: 1,
                    price: 0,
                  },
                ]
              )
            }
          >
            Add Session Package
          </button>
        </div>

        {/* AREA PRICING */}
        <div className="border p-3 rounded space-y-2 mt-2">
          <h3 className="font-semibold">
            Area Pricing
          </h3>
          {(currentCategory.areaPricing ||
            []).map((area, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
            >
              <input
                placeholder="Area"
                className="border p-2 flex-1 w-full"
                value={area.area}
                onChange={(e) => {
                  const newAreas = [
                    ...(currentCategory.areaPricing ||
                      []),
                  ];
                  newAreas[i].area =
                    e.target.value;
                  updateCategoryField(
                    "areaPricing",
                    newAreas
                  );
                }}
              />
              <input
                type="number"
                placeholder="Min"
                className="border p-2 w-full sm:w-24"
                value={area.min || ""}
                onChange={(e) => {
                  const newAreas = [
                    ...(currentCategory.areaPricing ||
                      []),
                  ];
                  newAreas[i].min =
                    Number(
                      e.target.value
                    );
                  updateCategoryField(
                    "areaPricing",
                    newAreas
                  );
                }}
              />
              <input
                type="number"
                placeholder="Max"
                className="border p-2 w-full sm:w-24"
                value={area.max || ""}
                onChange={(e) => {
                  const newAreas = [
                    ...(currentCategory.areaPricing ||
                      []),
                  ];
                  newAreas[i].max =
                    Number(
                      e.target.value
                    );
                  updateCategoryField(
                    "areaPricing",
                    newAreas
                  );
                }}
              />
              <button
                type="button"
                className="bg-red-200 px-2 py-1 rounded w-full sm:w-auto"
                onClick={() => {
                  const newAreas = [
                    ...(currentCategory.areaPricing ||
                      []),
                  ];
                  newAreas.splice(i, 1);
                  updateCategoryField(
                    "areaPricing",
                    newAreas
                  );
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="bg-gray-200 px-3 py-1 rounded"
            onClick={() =>
              updateCategoryField(
                "areaPricing",
                [
                  ...(currentCategory.areaPricing ||
                    []),
                  {
                    area: "",
                    min: 0,
                    max: 0,
                  },
                ]
              )
            }
          >
            Add Area Pricing
          </button>
        </div>

        {/* DEPOSIT */}
        <div className="border p-3 rounded space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                currentCategory.depositEnabled ||
                false
              }
              onChange={(e) =>
                updateCategoryField(
                  "depositEnabled",
                  e.target.checked
                )
              }
            />
            Enable Deposit
          </label>

          {currentCategory.depositEnabled && (
            <div className="grid grid-cols-2 gap-2">
              <select
                className="border p-2"
                value={
                  currentCategory.depositType ||
                  "fixed"
                }
                onChange={(e) =>
                  updateCategoryField(
                    "depositType",
                    e.target.value as
                      | "fixed"
                      | "percent"
                  )
                }
              >
                <option value="fixed">
                  Fixed
                </option>
                <option value="percent">
                  Percent
                </option>
              </select>

              <input
                type="number"
                placeholder="Deposit Value"
                className="border p-2"
                value={
                  currentCategory.depositValue ||
                  ""
                }
                onChange={(e) =>
                  updateCategoryField(
                    "depositValue",
                    Number(e.target.value)
                  )
                }
              />
            </div>
          )}
        </div>

        {/* MOBILE ELIGIBILITY */}
        <label className="flex items-center gap-2 mt-2">
         <input
  type="checkbox"
  checked={currentCategory.mobileEligibility || false}
  onChange={(e) =>
    updateCategoryField("mobileEligibility", e.target.checked)
  }
/>

          Mobile Eligibility
        </label>

        {/* GALLERY */}
        <ImageUpload
          value={
            currentCategory.gallery ||
            []
          }
          onChange={(files: string[]) =>
            updateCategoryField(
              "gallery",
              files
            )
          }
        />

        {error && (
          <p className="text-red-500 text-sm">
            {error}
          </p>
        )}

        {/* SAVE & CANCEL */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--brand-primary)] text-white px-4 py-2 rounded flex-1"
          >
            {loading
              ? "Saving..."
              : "Save Service"}
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
    </div>
  );
}
