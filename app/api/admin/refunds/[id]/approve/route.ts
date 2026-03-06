import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Refund from "@/lib/models/Refund";
import Booking from "@/lib/models/Booking";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requirePlatformOwner();
  await connectDB();

  const { id } = await context.params;

  const refund = await Refund.findById(id);
  if (!refund) {
    return NextResponse.json({ error: "Refund not found" }, { status: 404 });
  }

  if (refund.status !== "REQUESTED") {
    return NextResponse.json(
      { error: "Refund not eligible" },
      { status: 400 }
    );
  }

  // Lock immediately
  refund.status = "APPROVED";
  refund.approvedAt = new Date();
  await refund.save();

  try {
    const response = await fetch(
      "https://api.intasend.com/api/v1/send-money/initiate/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
        },
        body: JSON.stringify({
          currency: "KES",
          transactions: [
            {
              name: "Customer Refund",
              account: refund.phoneNumber,
              amount: refund.amount,
              narrative: "Booking refund",
            },
          ],
          requires_approval: "NO",
        }),
      }
    );

    const data = await response.json();

    if (!data.tracking_id) {
      throw new Error("Missing tracking_id from IntaSend");
    }

    refund.status = "SENT";
    refund.trackingId = data.tracking_id;
    refund.sentAt = new Date();
    await refund.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    refund.status = "FAILED";
    refund.failureReason = err.message;
    refund.failedAt = new Date();
    await refund.save();

    return NextResponse.json(
      { error: "Initiation failed" },
      { status: 500 }
    );
  }
}
