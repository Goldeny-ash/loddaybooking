import { NextRequest, NextResponse } from "next/server";
import Business from "@/lib/models/Business";
import { connectDB } from "@/lib/mongoDB";
import { enableBusinessDeposits } from "@/lib/server/enableBusinessDeposits";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { enabled } = await req.json();

    await connectDB();

    const business = await Business.findById(id);

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // ✅ HANDLE DISABLE
    if (enabled === false) {
      business.depositPolicy = {
        ...business.depositPolicy,
        enabled: false,
      };

      await business.save();

      return NextResponse.json({
        message: "Deposits disabled",
      });
    }

    // ✅ HANDLE ENABLE
    const result = await enableBusinessDeposits(id);

    return NextResponse.json({
      message: "Deposits enabled",
      walletId: result.walletId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update deposit settings" },
      { status: 500 }
    );
  }
}