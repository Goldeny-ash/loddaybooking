import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { sendEmail as sendSmtpEmail } from "@/lib/email/transporter";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

function addThirtyDays(date: Date) {
  const result = new Date(date);
  result.setDate(result.getDate() + 30);
  return result;
}

function normalizeBusinessPayload(business: any) {
  return {
    _id: String(business._id),
    name: business.name || "",
    email: business.email || "",
    username: business.username || "",
    marketplaceVisible: Boolean(business.marketplaceVisible),
    marketplaceStatus: business.marketplaceStatus || "none",
    access: {
      status: business.access?.status || "INACTIVE",
      nextChargeAt: business.access?.nextChargeAt
        ? new Date(business.access.nextChargeAt).toISOString()
        : undefined,
      subscriptionExpiresAt: business.access?.subscriptionExpiresAt
        ? new Date(business.access.subscriptionExpiresAt).toISOString()
        : undefined,
      billing: {
        customerId: business.access?.billing?.customerId || "",
      },
    },
    adminBenefits: {
      demoBusiness: Boolean(business.adminBenefits?.demoBusiness),
      freeMonthGrantedAt: business.adminBenefits?.freeMonthGrantedAt
        ? new Date(business.adminBenefits.freeMonthGrantedAt).toISOString()
        : undefined,
      freeMonthEndsAt: business.adminBenefits?.freeMonthEndsAt
        ? new Date(business.adminBenefits.freeMonthEndsAt).toISOString()
        : undefined,
    },
  };
}

function buildFreeMonthEmail({
  businessName,
  nextPaymentDate,
}: {
  businessName: string;
  nextPaymentDate: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:32px;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#15616D 0%,#FE7F2D 100%);color:#ffffff;">
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;opacity:0.9;">Congratulations</p>
          <h1 style="margin:0;font-size:30px;line-height:1.2;">You just received a full free month on Lodday</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;">Hi ${businessName},</p>
          <p style="margin:0 0 16px;">
            Your business has been awarded a complimentary full month of Lodday access. Your booking page,
            marketplace tools, and premium features are now active.
          </p>
          <div style="margin:20px 0;padding:18px;border-radius:20px;background:#FFF4E1;border:1px solid #FFE0BF;">
            <p style="margin:0 0 8px;font-weight:700;color:#78290F;">Next subscription payment</p>
            <p style="margin:0;color:#7c2d12;">Your next payment date is <strong>${nextPaymentDate}</strong>.</p>
          </div>
          <p style="margin:0 0 16px;">
            Keep growing your business, share your booking page, and make the most of the month ahead.
          </p>
          <p style="margin:0;">The Lodday team</p>
        </div>
      </div>
    </div>
  `;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    await requirePlatformOwner();
    const { businessId } = await params;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
    }

    const body = await req.json();
    const action = String(body?.action || "").trim();
    const value = Boolean(body?.value);

    await connectDB();

    const business = await Business.findById(businessId);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (action === "demo") {
      business.adminBenefits = business.adminBenefits || {};
      business.adminBenefits.demoBusiness = value;

      if (value) {
        business.marketplaceStatus = "approved";
        business.marketplaceVisible = true;
        business.marketplaceApprovedAt = business.marketplaceApprovedAt || new Date();
        business.marketplaceRejectedAt = undefined;
        business.marketplaceRejectionReason = "";
      }

      await business.save();

      return NextResponse.json({
        success: true,
        business: normalizeBusinessPayload(business.toObject()),
      });
    }

    if (action === "freeMonth") {
      business.adminBenefits = business.adminBenefits || {};

      if (business.adminBenefits.freeMonthGrantedAt) {
        return NextResponse.json(
          { error: "This business has already received its one free month." },
          { status: 409 }
        );
      }

      const now = new Date();
      const nextChargeAt = addThirtyDays(now);

      business.access = business.access || {};
      business.access.status = "ACTIVE";
      business.access.lastChargeAt = now;
      business.access.nextChargeAt = nextChargeAt;
      business.access.subscriptionExpiresAt = nextChargeAt;
      business.adminBenefits.freeMonthGrantedAt = now;
      business.adminBenefits.freeMonthEndsAt = nextChargeAt;

      await business.save();

      if (business.email) {
        try {
          await sendSmtpEmail({
            to: business.email,
            subject: "You have received a free month on Lodday",
            html: buildFreeMonthEmail({
              businessName: business.name || "there",
              nextPaymentDate: nextChargeAt.toDateString(),
            }),
          });
          business.adminBenefits.freeMonthEmailSentAt = new Date();
          await business.save();
        } catch (error) {
          console.error("admin-free-month-email", error);
        }
      }

      return NextResponse.json({
        success: true,
        business: normalizeBusinessPayload(business.toObject()),
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update business.";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
