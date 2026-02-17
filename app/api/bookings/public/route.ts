// app/api/bookings/public/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import Promotion from "@/lib/models/Promotion";
import mongoose from "mongoose";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/email/sendEmail";
import { getTheme, BrandTheme } from "@/lib/theme";

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
    }: {
      businessId: string;
      services: CartService[];
      date: string;
      startTime: string;
      endTime: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      note?: string;
      customerLocation?: { address: string; lat: number; lng: number };
      promoCode?: string;
    } = body;

    if (!businessId || !rawServices?.length || !date || !startTime || !endTime || !customerName || !customerPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const business = await Business.findById(businessId);
    if (!business)
      return NextResponse.json({ error: "Business not found" }, { status: 404 });

    /* =====================================================
       SUBSCRIPTION VALIDATION
    ===================================================== */
    const now = new Date();
    const { status, trialEndsAt } = business.access || {};
    const subscriptionValid =
      status === "ACTIVE" ||
      status === "GRACE" ||
      (status === "TRIAL" && trialEndsAt && new Date(trialEndsAt) >= now);

    if (!subscriptionValid) {
      return NextResponse.json(
        { error: "Business not accepting bookings" },
        { status: 403 }
      );
    }

    /* =====================================================
       FLATTEN SERVICES
    ===================================================== */
    const services: CartService[] = [];

    for (const s of rawServices) {
      if (s.isBundle && s.bundleItems?.length) {
        for (const item of s.bundleItems) {
          const svc = await Service.findById(item.serviceId);
          if (!svc) continue;
          services.push({ ...item, serviceId: svc._id.toString() });
        }
      } else {
        const id = s._id?.toString() || s.serviceId;
        if (!id) continue;
        services.push({ ...s, serviceId: id });
      }
    }

    if (!services.length)
      return NextResponse.json({ error: "No valid services selected" }, { status: 400 });

    /* =====================================================
       PRICE CALCULATION
    ===================================================== */
    let subtotal = 0;
    const processedServices: any[] = [];
    const customerRefImages: {
      url: string;
      serviceId: mongoose.Types.ObjectId;
      imageIndex: number;
    }[] = [];

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

      const validReferenceImages: {
        referenceId: mongoose.Types.ObjectId;
        imageIndex: number;
      }[] = [];

      if (s.selectedReferenceImages?.length) {
        for (const ref of s.selectedReferenceImages) {
          if (mongoose.Types.ObjectId.isValid(ref.referenceId)) {
            validReferenceImages.push({
              referenceId: new mongoose.Types.ObjectId(ref.referenceId),
              imageIndex: ref.imageIndex ?? 0,
            });
          } else {
            customerRefImages.push({
              url: ref.referenceId,
              serviceId: svc._id,
              imageIndex: ref.imageIndex ?? 0,
            });
          }
        }
      }

      processedServices.push({
        serviceId: svc._id,
        serviceName: svc.name,
        durationMinutes: Number(s.durationMinutes || svc.durationMinutes),
        price: finalServicePrice,
        depositAmount: s.depositAmount || 0,
        selectedReferenceImages: validReferenceImages,
        selectedAddOns: s.selectedAddOns || [],
        selectedSessions: s.selectedSessions || [],
        selectedAreas: s.selectedAreas || [],
        selectedTier: s.selectedTier,
      });
    }

    /* =====================================================
       APPLY PROMO
    ===================================================== */
    let discountAmount = 0;
    let appliedPromoCode: string | null = null;

    if (promoCode) {
      const promo = await Promotion.findOne({
        promoCode,
        active: true,
        $or: [
          { startDate: { $lte: new Date() }, endDate: { $gte: new Date() } },
          { startDate: null, endDate: null },
        ],
      }).populate("services");

      if (promo) {
        const promoServiceIds = (promo.services || []).map(
          (p: any) => p._id.toString()
        );

        const applicableServices = processedServices.filter((s) =>
          promoServiceIds.includes(s.serviceId.toString())
        );

        if (applicableServices.length > 0) {
          appliedPromoCode = promo.promoCode;

          discountAmount =
            promo.type === "percent"
              ? (applicableServices.reduce((sum, s) => sum + s.price, 0) *
                  promo.value) /
                100
              : promo.type === "fixed"
              ? promo.value
              : 0;

          if (discountAmount > subtotal) discountAmount = subtotal;
        }
      }
    }

    const discountedSubtotal = subtotal - discountAmount;

    /* =====================================================
       CALLOUT FEE (Mobile)
    ===================================================== */
    let calloutFee = 0;
    let distanceKm = 0;

    if (
      isMobileBooking &&
      business.mobileSettings?.enabled &&
      customerLocation?.lat &&
      customerLocation?.lng
    ) {
      const { baseLocation, calloutPolicy, maxDistanceKm } =
        business.mobileSettings;

      const R = 6371;
      const dLat =
        ((customerLocation.lat - baseLocation.lat) * Math.PI) / 180;
      const dLng =
        ((customerLocation.lng - baseLocation.lng) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((baseLocation.lat * Math.PI) / 180) *
          Math.cos((customerLocation.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = R * c;

      if (distanceKm > (maxDistanceKm || 0)) {
        return NextResponse.json(
          { error: "Customer location exceeds mobile service range" },
          { status: 400 }
        );
      }

      if (calloutPolicy?.type === "fixed")
        calloutFee = calloutPolicy.baseFee || 0;
      else if (calloutPolicy?.type === "per_km")
        calloutFee = (calloutPolicy.perKmFee || 0) * distanceKm;
      else if (calloutPolicy?.type === "zone")
        calloutFee =
          calloutPolicy.zones?.find((z: any) => distanceKm <= z.radiusKm)
            ?.fee || 0;
    }

    const totalDurationMinutes = processedServices.reduce(
      (sum, s) => sum + s.durationMinutes,
      0
    );

    const grandTotal = discountedSubtotal + calloutFee;

    /* =====================================================
       DEPOSIT
    ===================================================== */
    let depositAmount = processedServices.reduce(
      (sum, s) => sum + (s.depositAmount || 0),
      0
    );

    if (depositAmount > grandTotal) depositAmount = grandTotal;

    /* =====================================================
       BOOKING CREATION
    ===================================================== */
    let booking: any = null;
    let attempts = 0;

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
          customerLocation: isMobileBooking ? customerLocation : undefined,
          distanceKm,
          totalDurationMinutes,
          subtotal,
          discountAmount,
          calloutFee,
          grandTotal,
          depositAmount,
          appliedPromoCode,
          status: "pending",
          manageToken,
          services: processedServices,
          customerReferenceImages: customerRefImages,
        });
      } catch (err) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as any).code === 11000
        ) {
          continue;
        }
        throw err;
      }
    }

    if (!booking)
      return NextResponse.json(
        { error: "Failed to create unique booking" },
        { status: 500 }
      );

    /* =====================================================
       EMAIL DISPATCH (Safe)
    ===================================================== */
    const theme: BrandTheme = getTheme(business);
    const manageUrl = `https://booking.lodday.com/manage/${booking._id}?token=${booking.manageToken}`;
    const dashboardUrl = `https://booking.lodday.com/dashboard/bookings/${booking._id}`;

    if (customerEmail) {
      try {
        await sendEmail("BOOKING_RECEIVED_CUSTOMER", customerEmail, {
          business,
          theme,
          booking,
          manageUrl,
        });
      } catch (err) {
        console.error("Customer email failed:", err);
      }
    }

    if (business.email) {
      try {
        await sendEmail("NEW_BOOKING_BUSINESS", business.email, {
          business,
          theme,
          booking,
          dashboardUrl,
        });
      } catch (err) {
        console.error("Business email failed:", err);
      }
    }

    /* =====================================================
       RESPONSE
    ===================================================== */
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
        calloutFee,
        grandTotal,
        depositAmount,
        services: processedServices,
        customerLocation: isMobileBooking ? customerLocation : null,
        customerReferenceImages: customerRefImages,
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
