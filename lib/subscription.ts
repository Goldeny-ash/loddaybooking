import Subscription from "@/lib/models/Subscription";
import { Types } from "mongoose";
import Business from "@/lib/models/Business";

export class SubscriptionError extends Error {
  statusCode = 403;
}

export const ensureMarketplaceAccess = async (
  businessId: string | Types.ObjectId
) => {
  const business = await Business.findById(businessId);

  if (!business)
    throw new SubscriptionError("Business not found");

  const status = business.access?.status;

  if (!["ACTIVE", "TRIAL"].includes(status)) {
    throw new SubscriptionError(
      "Subscription expired. Please renew to continue receiving bookings."
    );
  }
};
