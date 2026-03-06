import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Review from "@/lib/models/Review";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";

type ReviewType = "platform" | "business";

interface BusinessLite {
  _id: mongoose.Types.ObjectId;
  name?: string;
  username?: string;
  logo?: string;
}

interface ReviewRow {
  _id: mongoose.Types.ObjectId;
  reviewType: ReviewType;
  rating: number;
  comment?: string;
  reviewerName: string;
  isAnonymous?: boolean;
  avatar?: { kind?: string; value?: string; imageUrl?: string };
  photoUrls?: string[];
  createdAt: Date;
  businessName?: string;
  businessId?: BusinessLite;
}

interface BookingReviewDoc {
  _id: mongoose.Types.ObjectId;
  customerName?: string;
  businessId?: BusinessLite;
}

function toSafeRating(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function toSafeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get("scope") || "all").trim();
  const businessId = searchParams.get("businessId")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") || 18), 60);

  const filter: Record<string, unknown> = { status: "approved" };

  if (scope === "platform") {
    filter.reviewType = "platform";
  }

  if (scope === "business") {
    filter.reviewType = "business";
    if (businessId && mongoose.Types.ObjectId.isValid(businessId)) {
      filter.businessId = new mongoose.Types.ObjectId(businessId);
    } else {
      return NextResponse.json({ error: "Valid businessId is required for business scope." }, { status: 400 });
    }
  }

  const rows = (await Review.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number.isFinite(limit) && limit > 0 ? limit : 18)
    .populate({ path: "businessId", select: "name username logo" })
    .select("reviewType rating comment reviewerName isAnonymous avatar photoUrls createdAt businessName")
    .lean()) as ReviewRow[];

  const reviews = rows.map((row) => {
    const business = row.businessId;
    const displayName = row.isAnonymous ? "Anonymous" : row.reviewerName;
    const avatarImageUrl =
      row.avatar?.imageUrl ||
      (row.avatar?.kind === "logo" ? business?.logo || "" : "") ||
      row.photoUrls?.[0] ||
      "";

    return {
      id: String(row._id),
      reviewType: row.reviewType as ReviewType,
      rating: Number(row.rating || 0),
      comment: row.comment || "",
      displayName,
      isAnonymous: Boolean(row.isAnonymous),
      createdAt: row.createdAt,
      avatarKind: row.avatar?.kind || "initials",
      avatarValue: row.avatar?.value || "",
      avatarImageUrl,
      photoUrls: Array.isArray(row.photoUrls) ? row.photoUrls : [],
      business: business
        ? {
            id: String(business._id),
            name: business.name || row.businessName || "",
            username: business.username || "",
            logo: business.logo || "",
          }
        : row.businessName
        ? { id: "", name: row.businessName, username: "", logo: "" }
        : null,
    };
  });

  return NextResponse.json({ reviews });
}

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const { userId } = await auth();

  const requestedType = toSafeString(body.reviewType, "platform");
  const reviewType: ReviewType = requestedType === "business" ? "business" : "platform";
  const rating = toSafeRating(body.rating);
  const comment = toSafeString(body.comment);
  const source = toSafeString(body.source, "direct");

  if (!rating) {
    return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  }

  const isAnonymous = Boolean(body.isAnonymous);
  const reviewerNameInput = toSafeString(body.reviewerName);
  const bookingIdInput = toSafeString(body.bookingId);
  const tokenInput = toSafeString(body.token);
  const businessIdInput = toSafeString(body.businessId);
  const businessUsernameInput = toSafeString(body.businessUsername).toLowerCase();
  const businessNameInput = toSafeString(body.businessName);

  const photoUrls = Array.isArray(body.photoUrls)
    ? body.photoUrls.filter((u: unknown) => typeof u === "string" && u.trim()).map((u: string) => u.trim()).slice(0, 6)
    : [];

  let booking: BookingReviewDoc | null = null;
  if (bookingIdInput && mongoose.Types.ObjectId.isValid(bookingIdInput)) {
    const bookingQuery: Record<string, unknown> = { _id: bookingIdInput };
    if (tokenInput) bookingQuery.manageToken = tokenInput;

    booking = (await Booking.findOne(bookingQuery)
      .populate({ path: "businessId", select: "name username logo" })
      .select("customerName businessId")
      .lean()) as BookingReviewDoc | null;
  }

  let loggedBusiness: BusinessLite | null = null;
  if (userId) {
    loggedBusiness = (await Business.findOne({ clerkUserId: userId })
      .select("_id name username logo")
      .lean()) as BusinessLite | null;
  }

  let resolvedBusiness: BusinessLite | null = null;

  if (booking?.businessId?._id) {
    resolvedBusiness = booking.businessId;
  } else if (businessIdInput && mongoose.Types.ObjectId.isValid(businessIdInput)) {
    resolvedBusiness = (await Business.findById(businessIdInput).select("_id name username logo").lean()) as BusinessLite | null;
  } else if (businessUsernameInput) {
    resolvedBusiness = (await Business.findOne({ username: businessUsernameInput }).select("_id name username logo").lean()) as BusinessLite | null;
  } else if (loggedBusiness) {
    resolvedBusiness = loggedBusiness;
  }

  if (reviewType === "business" && !resolvedBusiness?._id) {
    return NextResponse.json(
      { error: "Business review requires a valid business context. Add a business username or use a booking review link." },
      { status: 400 }
    );
  }

  const resolvedReviewerName =
    reviewerNameInput ||
    (booking?.customerName ? String(booking.customerName) : "") ||
    (loggedBusiness?.name ? String(loggedBusiness.name) : "") ||
    "Anonymous";

  const avatarKindRaw = toSafeString(body.avatarKind, "");
  const avatarKind = ["logo", "photo", "animal", "element", "initials"].includes(avatarKindRaw)
    ? avatarKindRaw
    : "initials";
  const avatarValue = toSafeString(body.avatarValue);
  let avatarImageUrl = toSafeString(body.avatarImageUrl);

  if (avatarKind === "logo" && resolvedBusiness?.logo) {
    avatarImageUrl = resolvedBusiness.logo;
  }
  if (avatarKind === "photo" && !avatarImageUrl && photoUrls[0]) {
    avatarImageUrl = photoUrls[0];
  }

  const doc = await Review.create({
    reviewType,
    rating,
    comment,
    businessId: resolvedBusiness?._id || undefined,
    businessName: resolvedBusiness?.name || businessNameInput || "",
    bookingId: booking?._id || (bookingIdInput && mongoose.Types.ObjectId.isValid(bookingIdInput) ? bookingIdInput : undefined),
    reviewerName: isAnonymous ? "Anonymous" : resolvedReviewerName,
    isAnonymous,
    avatar: {
      kind: avatarKind,
      value: avatarValue,
      imageUrl: avatarImageUrl,
    },
    photoUrls,
    source: ["home", "manage", "email", "direct"].includes(source) ? source : "direct",
    status: "approved",
  });

  return NextResponse.json(
    {
      ok: true,
      review: {
        id: String(doc._id),
        reviewType,
      },
    },
    { status: 201 }
  );
}
