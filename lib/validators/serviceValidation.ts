import slugify from "slugify";
import Promotion from "@/lib/models/Promotion";

/**
 * Removes empty string values recursively
 */
function stripEmpty(obj: any) {
  if (!obj || typeof obj !== "object") return obj;

  Object.keys(obj).forEach(key => {
    const value = obj[key];

    // Only delete undefined, null, or empty string — keep false
    if (value === "" || value === null || value === undefined) {
      delete obj[key];
    } else if (typeof value === "object" && value !== null) {
      stripEmpty(value);
      if (Object.keys(value).length === 0) {
        delete obj[key];
      }
    }
  });

  return obj;
}



/**
 * Remove category blocks not matching selected category
 */
function pruneCategoryBlocks(body: any) {
  const allowed: Record<string, string[]> = {
    Hair: ["hair"],
    Nails: ["nails"],
    "Body Enhancements": ["bodyMod"],
    "Permanent Makeup": ["pmu"],
    "Beauty Treatments": ["beauty"],
  };

  Object.values(allowed)
    .flat()
    .forEach(key => {
      if (!allowed[body.category]?.includes(key)) {
        delete body[key];
      }
    });

  return body;
}

export async function validateServicePayload(body: any) {
  // ---------- SLUG ----------
  if (body.name) {
    body.slug = slugify(body.name, { lower: true, strict: true });
  }

  // ---------- CLEAN EMPTY STRINGS ----------
  stripEmpty(body);

  // ---------- PRICE RANGE NORMALIZATION ----------
  if (body.priceRange) {
    const min = body.priceRange.min ?? 0;
    const max = body.priceRange.max ?? 0;

    if (!min && !max) {
      delete body.priceRange;
    } else {
      body.priceRange = {
        min: Number(min),
        max: Number(max),
      };

      if (body.priceRange.min > body.priceRange.max) {
        throw new Error("Price range min cannot exceed max");
      }
    }
  }

  // ---------- DEPOSIT ----------
  if (body.depositOverride) {
    if (!body.depositOverride.enabled) {
      delete body.depositOverride;
    } else {
      body.depositOverride.value = Number(body.depositOverride.value);

      if (body.depositOverride.type === "percent") {
        if (
          body.depositOverride.value < 1 ||
          body.depositOverride.value > 100
        ) {
          throw new Error("Deposit percent must be 1-100");
        }
      }
    }
  }

  // ---------- DURATION RECALCULATION ----------
  if (body.durationMinutes) {
    body.durationMinutes = Number(body.durationMinutes);
    body.durationHours = Math.floor(body.durationMinutes / 60);
    body.durationRemainderMinutes =
      body.durationMinutes % 60;
  }

  // ---------- CATEGORY BLOCK ----------
  if (body.category === "Other") {
    if (!body.customCategory) {
      throw new Error("Please provide a custom category name");
    }
  } else {
    delete body.customCategory;
  }

  switch (body.category) {
    case "Hair":
      body.hair = body.hair || {};
      break;
    case "Nails":
      body.nails = body.nails || {};
      break;
    case "Body Enhancements":
      body.bodyMod = body.bodyMod || {};
      break;
    case "Permanent Makeup":
      body.pmu = body.pmu || {};
      break;
    case "Beauty Treatments":
      body.beauty = body.beauty || {};
      break;
  }

  pruneCategoryBlocks(body);

  // ---------- PRICING MODE VALIDATION ----------
  const pricingModes = [
    body.basePrice,
    body.priceRange ? 1 : 0,
    body.priceTiers?.length,
    body.areaPricing?.length,
    body.sessionPackages?.length,
  ].filter(v => v && v !== 0).length;

  if (pricingModes === 0) {
    throw new Error("At least one pricing structure required");
  }

  if (pricingModes > 1) {
    throw new Error("Only one pricing mode allowed");
  }

  // ---------- MEDICAL ----------
  if (body.medicalDiscountPercent && !body.medicalEligible) {
    throw new Error("medicalEligible must be true");
  }

  // ---------- PROMOTIONS ----------
  if (body.promotions?.length) {
    const count = await Promotion.countDocuments({
      _id: { $in: body.promotions },
    });

    if (count !== body.promotions.length) {
      throw new Error("Invalid promotion ids");
    }
  }

  return body;
}

/**
 * Fields allowed in PATCH / PUT
 */
export const SERVICE_UPDATE_FIELDS = [
  "name",
  "description",
  "slug",

  "category",
  "customCategory",
  "subCategory",
  "niche",
  "variant",

  "targetGender",
  "durationMinutes",

  "hair",
  "nails",
  "bodyMod",
  "pmu",
  "beauty",

  "basePrice",
  "priceRange",        // ✅ correct field
  "priceTiers",
  "areaPricing",
  "sessionPackages",

  "staffIds",

  "depositOverride",   // ✅ correct

  "gallery",

  "mobileEligible",    // ✅ correct field name
  "travelTimeMinutes",

  "promotions",

  "addOns",

  "medicalEligible",
  "medicalDiscountPercent",
];
