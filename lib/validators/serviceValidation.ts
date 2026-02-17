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

  // ---------- CATEGORY RULES ----------
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

  // ---------- PRUNE UNUSED CATEGORY BLOCKS ----------
  pruneCategoryBlocks(body);

  // ---------- MOBILE ----------
 

  // ---------- MEDICAL ----------
  if (body.medicalDiscountPercent && !body.medicalEligible) {
    throw new Error("medicalEligible must be true");
  }

  // ---------- PRICING MODE CHECK ----------
  const pricingModes = [
    body.basePrice,
    body.priceTiers?.length,
    body.areaPricing?.length,
    body.sessionPackages?.length,
  ].filter(v => v && v !== 0).length;

  if (pricingModes > 2) {
    throw new Error("Too many pricing strategies selected");
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
  "priceRangeMin",
  "priceRangeMax",
  "priceTiers",
  "areaPricing",
  "sessionPackages",

  "staffIds",

  // Inside SERVICE_UPDATE_FIELDS
"depositOverride",


  "gallery",

  "mobileEligible",
  "travelTimeMinutes",

  "promotions",

  "addOns",

  "medicalEligible",
  "medicalDiscountPercent",
];
