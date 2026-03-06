import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Wallet from "@/lib/models/Wallet";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import { syncIntasendWalletTransactions } from "@/lib/wallet/syncIntasendWalletTransactions";

export async function POST() {
  try {
    await connectDB();
    const business = await getCurrentBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallet = await Wallet.findOne({ businessId: business._id });
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const result = await syncIntasendWalletTransactions({
      walletId: wallet.walletId,
      businessId: business._id.toString(),
      currency: wallet.currency,
      currentBalance: wallet.currentBalance,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to sync transactions" },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Server error", details }, { status: 500 });
  }
}
