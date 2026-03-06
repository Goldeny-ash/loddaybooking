import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Wallet from "@/lib/models/Wallet";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { syncIntasendWallet } from "@/lib/wallet/syncIntasendWallet";
import { syncIntasendWalletTransactions } from "@/lib/wallet/syncIntasendWalletTransactions";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePlatformOwner();
    await connectDB();

    const { id } = await context.params;
    const wallet = await Wallet.findById(id);

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const result = await syncIntasendWallet(wallet);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to sync wallet" },
        { status: 502 }
      );
    }

    const txSync = await syncIntasendWalletTransactions({
      walletId: wallet.walletId,
      businessId: wallet.businessId.toString(),
      currency: wallet.currency,
      currentBalance: wallet.currentBalance,
    });

    return NextResponse.json({
      success: true,
      walletId: result.walletId,
      currentBalance: result.currentBalance,
      availableBalance: result.availableBalance,
      canDisburse: result.canDisburse,
      isClearing: result.isClearing,
      intasendLastSync: result.syncedAt,
      transactionsSynced: txSync.success,
      transactionsInserted: txSync.inserted,
      transactionsUpdated: txSync.updated,
    });
  } catch (err: unknown) {
    console.error("[Admin Wallet Sync Error]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
