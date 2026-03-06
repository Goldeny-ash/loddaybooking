import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Wallet from "@/lib/models/Wallet";
import WalletTransaction from "@/lib/models/WalletTransaction";
import { getBusinessWalletStats } from "@/lib/wallet/getBusinessWalletStats";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import { syncIntasendWallet } from "@/lib/wallet/syncIntasendWallet";
import {
  computeMaxWithdrawable,
  getProtectedFutureDeposits,
} from "@/lib/wallet/getWalletWithdrawalLimits";
import { syncIntasendWalletTransactions } from "@/lib/wallet/syncIntasendWalletTransactions";

export async function GET() {
  await connectDB();
  const business = await getCurrentBusiness({ requireSetup: true });
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const walletDoc = await Wallet.findOne({ businessId: business._id });
  if (walletDoc) {
    await syncIntasendWallet(walletDoc);
    await syncIntasendWalletTransactions({
      walletId: walletDoc.walletId,
      businessId: business._id.toString(),
      currency: walletDoc.currency,
      currentBalance: walletDoc.currentBalance,
    });
  }

  const [transactions, baseStats, protectedFutureDeposits] = await Promise.all([
    WalletTransaction.find({ businessId: business._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    getBusinessWalletStats(business._id.toString()),
    getProtectedFutureDeposits(business._id.toString()),
  ]);

  const availableBalance = Number(walletDoc?.availableBalance || 0);
  const maxWithdrawable = computeMaxWithdrawable(
    availableBalance,
    protectedFutureDeposits
  );

  return NextResponse.json({
    wallet: walletDoc ? walletDoc.toObject() : null,
    transactions,
    stats: {
      ...baseStats,
      availableBalance,
      protectedFutureDeposits,
      maxWithdrawable,
    },
  });
}
