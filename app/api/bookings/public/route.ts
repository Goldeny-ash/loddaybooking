import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import Promotion from "@/lib/models/Promotion";
import mongoose from "mongoose";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";

interface CartService {
  _id?: string;
  serviceId?: string;
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
    } = body;

    if (
      !businessId ||
      !rawServices?.length ||
      !date ||
      !startTime ||
      !endTime ||
      !customerName ||
      !customerPhone
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const business = await Business.findById(businessId);
    if (!business)
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );

    /* ===================================================== */
    /* SUBSCRIPTION VALIDATION */
    /* ===================================================== */

    const now = new Date();
    const { status, trialEndsAt } = business.access || {};

    const subscriptionValid =
      status === "ACTIVE" ||
      status === "GRACE" ||
      (status === "TRIAL" &&
        trialEndsAt &&
        new Date(trialEndsAt) >= now);

    if (!subscriptionValid) {
      return NextResponse.json(
        { error: "Business not accepting bookings" },
        { status: 403 }
      );
    }

    /* ===================================================== */
    /* FLATTEN SERVICES */
    /* ===================================================== */

    const services: CartService[] = [];

    for (const s of rawServices) {
      if (s.isBundle && s.bundleItems?.length) {
        for (const item of s.bundleItems) {
          const svc = await Service.findById(item.serviceId);
          if (!svc) continue;
          services.push({
            ...item,
            serviceId: svc._id.toString(),
          });
        }
      } else {
        const id = s._id?.toString() || s.serviceId;
        if (!id) continue;
        services.push({ ...s, serviceId: id });
      }
    }

    if (!services.length) {
      return NextResponse.json(
        { error: "No valid services selected" },
        { status: 400 }
      );
    }

    /* ===================================================== */
    /* PRICE CALCULATION */
    /* ===================================================== */

    let subtotal = 0;
    const processedServices: any[] = [];
    const isMobileBooking = services.some((s) => s.isMobile);

    for (const s of services) {
      const svc = await Service.findById(s.serviceId);
      if (!svc) continue;

      let primaryPrice = s.selectedTier?.price ?? 0;

      if (!primaryPrice) {
        if (s.selectedSessions?.length) {
          primaryPrice = s.selectedSessions.reduce(
            (sum, sess) => sum + (Number(sess.price) || 0),
            0
          );
        } else if (s.selectedAreas?.length) {
          primaryPrice = s.selectedAreas.reduce(
            (sum, area) => sum + (Number(area.price) || 0),
            0
          );
        } else {
          primaryPrice = Number(svc.basePrice || 0);
        }
      }

      const addOnsTotal =
        s.selectedAddOns?.reduce(
          (sum, add) => sum + (Number(add.price) || 0),
          0
        ) || 0;

      const finalServicePrice = primaryPrice + addOnsTotal;
      subtotal += finalServicePrice;
      const serviceOverrideEnabled = Boolean(svc.depositOverride?.enabled);
      const businessPolicyEnabled = Boolean(business.depositPolicy?.enabled);
      let computedServiceDeposit = 0;

      if (serviceOverrideEnabled) {
        const value = Number(svc.depositOverride?.value || 0);
        computedServiceDeposit =
          svc.depositOverride?.type === "percent"
            ? (value / 100) * finalServicePrice
            : value;
      } else if (businessPolicyEnabled) {
        const value = Number(business.depositPolicy?.value || 0);
        computedServiceDeposit =
          business.depositPolicy?.type === "percent"
            ? (value / 100) * finalServicePrice
            : value;
      }

      if (computedServiceDeposit < 0) computedServiceDeposit = 0;
      if (computedServiceDeposit > finalServicePrice) {
        computedServiceDeposit = finalServicePrice;
      }

     processedServices.push({
  serviceId: svc._id,

  serviceName: svc.name,
  serviceDescription: svc.description || "",

  serviceImage:
    Array.isArray(svc.gallery) && svc.gallery.length > 0
      ? svc.gallery[0]
      : null,

  durationMinutes:
    Number(s.durationMinutes || svc.durationMinutes),

  price: finalServicePrice,

  depositAmount: Math.round(computedServiceDeposit),

  selectedTier: s.selectedTier || null,

  selectedAddOns: s.selectedAddOns || [],

  selectedSessions: s.selectedSessions || [],

  selectedAreas: s.selectedAreas || [],
});
    }

    /* ===================================================== */
    /* PROMO */
    /* ===================================================== */

    let discountAmount = 0;
    let appliedPromoCode: string | null = null;

    if (promoCode) {
      const promo = await Promotion.findOne({
        promoCode,
        active: true,
      }).populate("services");

      if (promo) {
        const promoServiceIds = (promo.services || []).map(
          (p: any) => p._id.toString()
        );

        const applicable = processedServices.filter((s) =>
          promoServiceIds.includes(s.serviceId.toString())
        );

        if (applicable.length) {
          appliedPromoCode = promo.promoCode;

          discountAmount =
            promo.type === "percent"
              ? (applicable.reduce((sum, s) => sum + s.price, 0) *
                  promo.value) /
                100
              : promo.type === "fixed"
              ? promo.value
              : 0;

          if (discountAmount > subtotal)
            discountAmount = subtotal;
        }
      }
    }

    const discountedSubtotal = subtotal - discountAmount;
    const totalDurationMinutes = processedServices.reduce(
      (sum, s) => sum + s.durationMinutes,
      0
    );

    const grandTotal = discountedSubtotal;

    /* ===================================================== */
    /* DEPOSIT */
    /* ===================================================== */

    let depositAmount = processedServices.reduce(
      (sum, s) => sum + (s.depositAmount || 0),
      0
    );

    if (depositAmount > grandTotal)
      depositAmount = grandTotal;

    /* ===================================================== */
    /* CREATE BOOKING */
    /* ===================================================== */

    let booking: any = null;
    let attempts = 0;

    /* ===================================================== */
/* DETERMINE BOOKING STATUS */
/* ===================================================== */

const autoApprove = business.bookingRules?.autoApprove === true;
const depositEnabled = business.depositPolicy?.enabled === true;
const hasDeposit = depositEnabled && depositAmount > 0;

let bookingStatus: "pending" | "pendingDeposit" | "confirmed";



if (!autoApprove) {

  // business must approve first
  bookingStatus = "pending";

} else {

  // booking auto approved
  if (depositAmount > 0) {
    bookingStatus = "pendingDeposit";
  } else {
    bookingStatus = "confirmed";
  }

}

    while (!booking && attempts < 5) {
      attempts++;
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
          isMobile: isMobileBooking,
          totalDurationMinutes,
          subtotal,
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
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    /* ===================================================== */
    /* CENTRALIZED EMAIL DISPATCH */
    /* ===================================================== */

    const manageUrl = `https://booking.lodday.com/${business.username}/manage/${booking._id}?token=${booking.manageToken}`;
    const dashboardUrl = `https://booking.lodday.com/dashboard/bookings/${booking._id}`;
    const customerRecipient =
      typeof customerEmail === "string" ? customerEmail.trim() : "";
    const businessRecipient =
      typeof business.email === "string" ? business.email.trim() : "";
    const bookingForEmail = {
      ...booking.toObject(),
      services: processedServices,
    };

    try {
      console.log("[BOOKING] Dispatching email", {
  bookingId: booking._id.toString(),
  status: booking.status,
  customerEmail,
  businessEmail: business.email,
});
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

    /* ===================================================== */
    /* RESPONSE */
    /* ===================================================== */

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
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
