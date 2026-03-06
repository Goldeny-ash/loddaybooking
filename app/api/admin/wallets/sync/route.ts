import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Wallet from "@/lib/models/Wallet";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { syncIntasendWallet } from "@/lib/wallet/syncIntasendWallet";
import { syncIntasendWalletTransactions } from "@/lib/wallet/syncIntasendWalletTransactions";

export async function POST() {
  try {
    await requirePlatformOwner();
    await connectDB();

    const wallets = await Wallet.find({ walletId: { $exists: true, $ne: "" } });
    const results: Array<{
      walletDbId: string;
      walletId: string;
      success: boolean;
      error?: string;
      currentBalance?: number;
      availableBalance?: number;
      isClearing?: boolean;
      transactionsInserted?: number;
      transactionsUpdated?: number;
    }> = [];

    for (const wallet of wallets) {
      const synced = await syncIntasendWallet(wallet);
      const txSync = synced.success
        ? await syncIntasendWalletTransactions({
            walletId: wallet.walletId,
            businessId: wallet.businessId.toString(),
            currency: wallet.currency,
            currentBalance: wallet.currentBalance,
          })
        : { success: false, inserted: 0, updated: 0, error: "Balance sync failed" };
      results.push({
        walletDbId: wallet._id.toString(),
        walletId: wallet.walletId,
        success: synced.success,
        error: synced.error,
        currentBalance: synced.currentBalance,
        availableBalance: synced.availableBalance,
        isClearing: synced.isClearing,
        transactionsInserted: txSync.inserted,
        transactionsUpdated: txSync.updated,
      });
    }

    const syncedCount = results.filter((r) => r.success).length;
    const failedCount = results.length - syncedCount;

    return NextResponse.json({
      success: failedCount === 0,
      total: results.length,
      syncedCount,
      failedCount,
      results,
    });
  } catch (err: unknown) {
    console.error("[Admin Wallets Bulk Sync Error]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
