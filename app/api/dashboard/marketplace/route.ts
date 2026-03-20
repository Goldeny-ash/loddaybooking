import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { sendEmail } from "@/lib/email/sendEmail";

const ADMIN_MARKETPLACE_URL = "https://admin.lodday.com/marketplace";

function isActiveSubscription(status?: string) {
  return status === "ACTIVE";
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const business = await Business.findOne({ clerkUserId: userId }).lean();
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({
      business: {
        _id: business._id.toString(),
        name: business.name || "",
        email: business.email || "",
        username: business.username || "",
        accessStatus: business.access?.status || "INACTIVE",
        marketplaceVisible: Boolean(business.marketplaceVisible),
        marketplaceStatus: business.marketplaceStatus || "none",
        marketplaceRejectionReason: business.marketplaceRejectionReason || "",
      },
    });
  } catch (error) {
    console.error("dashboard-marketplace-get", error);
    return NextResponse.json({ error: "Unable to load marketplace settings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const business = await Business.findOne({ clerkUserId: userId });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await request.json();
    const action = String(body?.action || "").trim();
    const accessStatus = business.access?.status || "INACTIVE";

    if (!isActiveSubscription(accessStatus)) {
      return NextResponse.json(
        { error: "Marketplace access is available on active subscriptions only." },
        { status: 403 }
      );
    }

    if (action === "request") {
      business.marketplaceVisible = false;
      business.marketplaceStatus = "pending";
      business.marketplaceRequestedAt = new Date();
      business.marketplaceRejectedAt = undefined;
      business.marketplaceApprovedAt = undefined;
      business.marketplaceRejectionReason = "";
      await business.save();

      if (business.email) {
        await sendEmail("MARKETPLACE_REQUEST_RECEIVED", {
          to: business.email,
        }, {
          businessName: business.name || "Your business",
        });
      }

      await sendEmail("MARKETPLACE_REQUEST_ADMIN_ALERT", {
        to: "support@lodday.com",
      }, {
        businessName: business.name || "Business",
        adminUrl: ADMIN_MARKETPLACE_URL,
      });

      return NextResponse.json({
        success: true,
        message: "Your request is pending approval. You will be notified once reviewed.",
        business: {
          marketplaceVisible: false,
          marketplaceStatus: "pending",
          marketplaceRejectionReason: "",
        },
      });
    }

    if (action === "toggle") {
      if (business.marketplaceStatus !== "approved") {
        return NextResponse.json(
          { error: "Only approved businesses can toggle marketplace visibility." },
          { status: 400 }
        );
      }

      business.marketplaceVisible = !business.marketplaceVisible;
      await business.save();

      return NextResponse.json({
        success: true,
        message: business.marketplaceVisible
          ? "Your business is now visible on the marketplace."
          : "Your business has been hidden from the marketplace.",
        business: {
          marketplaceVisible: Boolean(business.marketplaceVisible),
          marketplaceStatus: business.marketplaceStatus,
          marketplaceRejectionReason: business.marketplaceRejectionReason || "",
        },
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("dashboard-marketplace-post", error);
    return NextResponse.json({ error: "Unable to update marketplace settings." }, { status: 500 });
  }
}
