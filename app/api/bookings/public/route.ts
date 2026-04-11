import { NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import Promotion from "@/lib/models/Promotion";
import Staff from "@/lib/models/Staff";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import { toMinutes } from "@/lib/availability/time";
import type { CustomerLocation } from "@/lib/types/customerLocation";
import {
  buildDashboardUrl,
  buildManageBookingUrl,
  computeCalloutCharge,
  computeDepositAmountForService,
} from "@/lib/booking/utils";

export const dynamic = "force-dynamic";

interface CartService {
  _id?: string;
  serviceId?: string;
  price?: number;
  durationMinutes: number;
  isBundle?: boolean;
  bundleItems?: CartService[];
  selectedReferenceImages?: { referenceId: string; imageIndex: number }[];
  selectedAddOns?: { title: string; durationMinutes: number; price?: number }[];
  selectedSessions?: { sessions: number; durationMinutes: number; price?: number }[];
  selectedAreas?: { area: string; min: number; max: number; price?: number }[];
  selectedTier?: { label: string; min: number; max: number; price: number };
  depositAmount?: number;
  isMobile?: boolean;
}

type StaffDayOverride = {
  date?: string;
  closed?: boolean;
  blocks?: Array<{ start?: string; end?: string }>;
};

function normalizeCustomerLocation(location?: Partial<CustomerLocation> | null) {
  if (!location) return undefined;

  const county = String(location.county || "").trim();
  const subCounty = String(location.subCounty || "").trim();
  const ward = String(location.ward || "").trim();
  const locationDescription = String(location.locationDescription || "").trim();
  const address =
    String(location.address || "").trim() ||
    [ward, subCounty, county].filter(Boolean).join(", ");
  const lat = typeof location.lat === "number" ? location.lat : undefined;
  const lng = typeof location.lng === "number" ? location.lng : undefined;
  const mapsLink =
    String(location.mapsLink || "").trim() ||
    (typeof lat === "number" && typeof lng === "number"
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : "");

  return {
    county,
    subCounty,
    ward,
    address,
    locationDescription,
    lat,
    lng,
    mapsLink,
  };
}

async function hasCapacityForSlot(params: {
  businessId: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  endTime: string;
}) {
  const { businessId, serviceIds, date, startTime, endTime } = params;
  const businessObjectId = new mongoose.Types.ObjectId(businessId);
  const slotStart = toMinutes(startTime);
  const slotEnd = toMinutes(endTime);

  const staff = await Staff.find({
    businessId: businessObjectId,
    services: { $in: serviceIds },
  }).lean();

  if (!staff.length) {
    return false;
  }

  const weekday = new Date(date)
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  let staffCapacity = 0;

  for (const member of staff) {
    const availability = member.weeklyAvailability?.[weekday];
    if (!availability?.start || !availability?.end || availability.closed) {
      continue;
    }

    const availabilityStart = toMinutes(availability.start);
    const availabilityEnd = toMinutes(availability.end);

    if (slotStart < availabilityStart || slotEnd > availabilityEnd) {
      continue;
    }

    const dayOverride = (member.availabilityOverrides || []).find(
      (override: StaffDayOverride) => override?.date === date
    ) as StaffDayOverride | undefined;

    if (dayOverride?.closed) {
      continue;
    }

    const overlapsBlockedRange = (dayOverride?.blocks || []).some((block) => {
      if (!block?.start || !block?.end) return false;
      const blockedStart = toMinutes(block.start);
      const blockedEnd = toMinutes(block.end);
      return slotStart < blockedEnd && blockedStart < slotEnd;
    });

    if (overlapsBlockedRange) {
      continue;
    }

    staffCapacity += 1;
  }

  if (staffCapacity === 0) {
    return false;
  }

  const bookings = await Booking.find({
    businessId: businessObjectId,
    date,
    status: { $in: ["confirmed", "pendingDeposit", "pending"] },
  }).lean();

  const overlappingBookings = bookings.filter((booking) => {
    const bookingStart = toMinutes(booking.startTime);
    const bookingEnd = toMinutes(booking.endTime);
    return slotStart < bookingEnd && bookingStart < slotEnd;
  }).length;

  return overlappingBookings < staffCapacity;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      businessId,
      services: rawServices,
      date,
      startTime,
      endTime,
      customerName,
      customerPhone,
      customerEmail,
      note,
      customerLocation,
      promoCode,
      calloutFee,
      distanceKm,
      termsAccepted,
    } = body;

    if (
      !businessId ||
      !rawServices?.length ||
      !date ||
      !startTime ||
      !endTime ||
      !customerName ||
      !customerPhone ||
      !customerEmail
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const now = new Date();
    const { status, trialEndsAt } = business.access || {};
    const subscriptionValid =
      Boolean(business.adminBenefits?.demoBusiness) ||
      status === "ACTIVE" ||
      status === "GRACE" ||
      (status === "TRIAL" && trialEndsAt && new Date(trialEndsAt) >= now);

    if (!subscriptionValid) {
      return NextResponse.json({ error: "Business not accepting bookings" }, { status: 403 });
    }

    if (!termsAccepted) {
      return NextResponse.json({ error: "You must accept the booking terms first." }, { status: 400 });
    }

    const services: CartService[] = [];

    for (const service of rawServices) {
      if (service.isBundle && service.bundleItems?.length) {
        for (const item of service.bundleItems) {
          const nestedService = await Service.findById(item.serviceId);
          if (!nestedService) continue;
          services.push({
            ...item,
            serviceId: nestedService._id.toString(),
          });
        }
      } else {
        const id = service._id?.toString() || service.serviceId;
        if (!id) continue;
        services.push({ ...service, serviceId: id });
      }
    }

    if (!services.length) {
      return NextResponse.json({ error: "No valid services selected" }, { status: 400 });
    }

    const serviceIds = services
      .map((service) => service.serviceId)
      .filter((serviceId): serviceId is string => Boolean(serviceId));

    const slotStillAvailable = await hasCapacityForSlot({
      businessId,
      serviceIds,
      date,
      startTime,
      endTime,
    });

    if (!slotStillAvailable) {
      return NextResponse.json(
        { error: "That time slot is no longer available. Please choose another one." },
        { status: 409 }
      );
    }

    let subtotal = 0;
    const processedServices: Array<Record<string, unknown>> = [];
    const isMobileBooking = services.some((service) => service.isMobile);

    for (const service of services) {
      const dbService = await Service.findById(service.serviceId);
      if (!dbService) continue;

      let primaryPrice =
        typeof service.price === "number" && Number.isFinite(service.price)
          ? service.price
          : service.selectedTier?.price ?? 0;

      if (!primaryPrice) {
        if (service.selectedSessions?.length) {
          primaryPrice = service.selectedSessions.reduce(
            (sum, session) => sum + (Number(session.price) || 0),
            0
          );
        } else if (service.selectedAreas?.length) {
          primaryPrice = service.selectedAreas.reduce(
            (sum, area) => sum + (Number(area.price) || 0),
            0
          );
        } else {
          primaryPrice = Number(dbService.basePrice || 0);
        }
      }

      const addOnsTotal =
        service.selectedAddOns?.reduce((sum, addOn) => sum + (Number(addOn.price) || 0), 0) || 0;

      const finalServicePrice =
        typeof service.price === "number" && Number.isFinite(service.price)
          ? service.price
          : primaryPrice + addOnsTotal;
      subtotal += finalServicePrice;

      const computedServiceDeposit = computeDepositAmountForService({
        servicePrice: finalServicePrice,
        service: dbService,
        businessPolicy: business.depositPolicy,
      });

      processedServices.push({
        serviceId: dbService._id,
        serviceName: dbService.name,
        serviceDescription: dbService.description || "",
        serviceImage:
          Array.isArray(dbService.gallery) && dbService.gallery.length > 0 ? dbService.gallery[0] : null,
        durationMinutes: Number(service.durationMinutes || dbService.durationMinutes),
        price: finalServicePrice,
        depositAmount: computedServiceDeposit,
        selectedTier: service.selectedTier || null,
        selectedAddOns: service.selectedAddOns || [],
        selectedSessions: service.selectedSessions || [],
        selectedAreas: service.selectedAreas || [],
      });
    }

    let discountAmount = 0;
    let appliedPromoCode: string | null = null;

    if (promoCode) {
      const normalizedPromoCode = String(promoCode).trim().toUpperCase();
      const promo = await Promotion.findOne({
        businessId: business._id,
        promoCode: normalizedPromoCode,
        active: true,
      }).populate("services");

      if (promo) {
        const promoServiceIds = (promo.services || []).map((service: any) => service._id.toString());
        const applicableServices = processedServices.filter((service) =>
          promoServiceIds.includes(String(service.serviceId))
        );

        if (applicableServices.length) {
          appliedPromoCode = promo.promoCode;
          discountAmount =
            promo.type === "percent"
              ? (applicableServices.reduce((sum, service) => sum + Number(service.price || 0), 0) *
                  promo.value) /
                100
              : promo.type === "fixed"
                ? promo.value
                : 0;

          if (discountAmount > subtotal) {
            discountAmount = subtotal;
          }
        }
      }
    }

    const discountedSubtotal = subtotal - discountAmount;
    const normalizedCustomerLocation = normalizeCustomerLocation(customerLocation);
    const computedCallout = isMobileBooking
      ? computeCalloutCharge({
          mobileSettings: business.mobileSettings,
          customerLocation: normalizedCustomerLocation,
        })
      : { calloutFee: 0, distanceKm: null };
    const normalizedCalloutFee = Math.max(
      0,
      Number.isFinite(Number(calloutFee)) ? Number(calloutFee) : computedCallout.calloutFee || 0
    );
    const normalizedDistanceKm =
      typeof distanceKm === "number" && Number.isFinite(distanceKm)
        ? distanceKm
        : computedCallout.distanceKm ?? undefined;
    const totalDurationMinutes = processedServices.reduce(
      (sum, service) => sum + Number(service.durationMinutes || 0),
      0
    );
    const grandTotal = discountedSubtotal + normalizedCalloutFee;

    let depositAmount = processedServices.reduce(
      (sum, service) => sum + Number(service.depositAmount || 0),
      0
    );

    if (business.depositPolicy?.enabled && business.depositPolicy?.applyToCallout && normalizedCalloutFee > 0) {
      const calloutDeposit =
        business.depositPolicy.type === "percent"
          ? Math.round((normalizedCalloutFee * Number(business.depositPolicy.value || 0)) / 100)
          : Number(business.depositPolicy.value || 0);
      depositAmount += Math.max(0, Math.min(calloutDeposit, normalizedCalloutFee));
    }

    if (depositAmount > grandTotal) {
      depositAmount = grandTotal;
    }

    const autoApprove = business.bookingRules?.autoApprove === true;
    let bookingStatus: "pending" | "pendingDeposit" | "confirmed";

    if (!autoApprove) {
      bookingStatus = "pending";
    } else if (depositAmount > 0) {
      bookingStatus = "pendingDeposit";
    } else {
      bookingStatus = "confirmed";
    }

    let booking: any = null;
    let attempts = 0;

    while (!booking && attempts < 5) {
      attempts += 1;
      const bookingKey = uuidv4();
      const manageToken = crypto.randomBytes(32).toString("hex");

      try {
        booking = await Booking.create({
          bookingKey,
          businessId: new mongoose.Types.ObjectId(businessId),
          date,
          startTime,
          endTime,
          customerName,
          customerPhone,
          customerEmail,
          note,
          termsAccepted: Boolean(termsAccepted),
          isMobile: isMobileBooking,
          customerLocation: normalizedCustomerLocation,
          distanceKm: normalizedDistanceKm,
          totalDurationMinutes,
          subtotal,
          calloutFee: normalizedCalloutFee,
          discountAmount,
          grandTotal,
          depositAmount,
          appliedPromoCode,
          status: bookingStatus,
          manageToken,
          services: processedServices,
        });
      } catch (err: any) {
        if (err?.code === 11000) continue;
        throw err;
      }
    }

    if (!booking) {
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    const manageUrl = buildManageBookingUrl({
      username: business.username,
      bookingId: booking._id.toString(),
      token: booking.manageToken,
    });
    const dashboardUrl = buildDashboardUrl();
    const customerRecipient = typeof customerEmail === "string" ? customerEmail.trim() : "";
    const businessRecipient = typeof business.email === "string" ? business.email.trim() : "";
    const bookingForEmail = {
      ...booking.toObject(),
      services: processedServices,
    };

    try {
      await dispatchEmailEvent("BOOKING_CREATED", {
        business,
        booking: bookingForEmail,
        customerEmail: customerRecipient,
        businessEmail: businessRecipient,
        manageUrl,
        dashboardUrl,
      });
    } catch (err) {
      console.error("Email dispatch failed:", err);
    }

    return NextResponse.json(
      {
        ok: true,
        bookingId: booking._id.toString(),
        bookingKey: booking.bookingKey,
        manageToken: booking.manageToken,
        username: business.username,
        status: booking.status,
        totalDurationMinutes,
        subtotal,
        discountAmount,
        grandTotal,
        depositAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
