import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import ReferenceImage from "@/lib/models/ReferenceImage";
import Service from "@/lib/models/Service";
import { sendEmail } from "@/lib/email/sendEmail";

async function requirePlatformOwner() {
  const user = await currentUser();
  return Boolean(user?.id && user.id === process.env.PLATFORM_OWNER_CLERK_ID);
}

export async function GET() {
  try {
    if (!(await requirePlatformOwner())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const businesses = await Business.find({
      marketplaceStatus: { $in: ["pending", "approved", "rejected"] },
    })
      .select(
        "name email username phone description location marketplaceVisible marketplaceStatus marketplaceRequestedAt marketplaceRejectionReason"
      )
      .sort({ marketplaceRequestedAt: -1, updatedAt: -1 })
      .lean();

    const businessIds = businesses.map((item) => item._id);
    const [services, portfolio] = await Promise.all([
      Service.find({ businessId: { $in: businessIds } }).select("businessId name category").lean(),
      ReferenceImage.find({ businessId: { $in: businessIds } }).select("businessId images").lean(),
    ]);

    const servicesByBusiness = new Map<string, Array<{ name?: string; category?: string }>>();
    for (const service of services) {
      const key = service.businessId?.toString?.();
      if (!key) continue;
      const existing = servicesByBusiness.get(key) || [];
      existing.push({ name: service.name, category: service.category });
      servicesByBusiness.set(key, existing);
    }

    const portfolioByBusiness = new Map<string, string[]>();
    for (const ref of portfolio) {
      const key = ref.businessId?.toString?.();
      if (!key) continue;
      const urls = (ref.images || [])
        .map((image: { url?: string }) => String(image.url || "").trim())
        .filter(Boolean);
      portfolioByBusiness.set(key, [...(portfolioByBusiness.get(key) || []), ...urls]);
    }

    return NextResponse.json({
      requests: businesses.map((business) => {
        const id = business._id.toString();
        return {
          _id: id,
          name: business.name || "Business",
          email: business.email || "",
          username: business.username || "",
          phone: business.phone || "",
          description: business.description || "",
          location: business.location || {},
          marketplaceVisible: Boolean(business.marketplaceVisible),
          marketplaceStatus: business.marketplaceStatus || "none",
          marketplaceRequestedAt: business.marketplaceRequestedAt,
          marketplaceRejectionReason: business.marketplaceRejectionReason || "",
          services: servicesByBusiness.get(id) || [],
          images: (portfolioByBusiness.get(id) || []).slice(0, 4),
        };
      }),
    });
  } catch (error) {
    console.error("admin-marketplace-get", error);
    return NextResponse.json({ error: "Unable to load marketplace requests." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requirePlatformOwner())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const businessId = String(body?.businessId || "").trim();
    const action = String(body?.action || "").trim();
    const rejectionReason = String(body?.rejectionReason || "").trim();

    if (!businessId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    if (action === "approve") {
      business.marketplaceStatus = "approved";
      business.marketplaceVisible = true;
      business.marketplaceApprovedAt = new Date();
      business.marketplaceRejectedAt = undefined;
      business.marketplaceRejectionReason = "";
      await business.save();

      if (business.email) {
        await sendEmail("MARKETPLACE_APPROVED", { to: business.email }, {
          businessName: business.name || "Your business",
        });
      }

      return NextResponse.json({ success: true, message: "Marketplace request approved." });
    }

    business.marketplaceStatus = "rejected";
    business.marketplaceVisible = false;
    business.marketplaceRejectedAt = new Date();
    business.marketplaceApprovedAt = undefined;
    business.marketplaceRejectionReason = rejectionReason || "Please improve your business details and reapply.";
    await business.save();

    if (business.email) {
      await sendEmail("MARKETPLACE_REJECTED", { to: business.email }, {
        businessName: business.name || "Your business",
        reason: business.marketplaceRejectionReason,
      });
    }

    return NextResponse.json({ success: true, message: "Marketplace request rejected." });
  } catch (error) {
    console.error("admin-marketplace-post", error);
    return NextResponse.json({ error: "Unable to update marketplace request." }, { status: 500 });
  }
}
