import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import { connectDB } from "@/lib/mongoDB";
import Wallet from "@/lib/models/Wallet";
import WalletTransaction from "@/lib/models/WalletTransaction";
import { getBusinessWalletStats } from "@/lib/wallet/getBusinessWalletStats";
import BusinessWalletPanel from "@/components/dashboard/BusinessWalletPanel";
import { syncIntasendWallet } from "@/lib/wallet/syncIntasendWallet";
import {
  computeMaxWithdrawable,
  getProtectedFutureDeposits,
} from "@/lib/wallet/getWalletWithdrawalLimits";
import { syncIntasendWalletTransactions } from "@/lib/wallet/syncIntasendWalletTransactions";

export const dynamic = "force-dynamic";

export default async function BusinessWalletPage() {
  const business = await getCurrentBusiness({ requireSetup: true });
  if (!business) return null;

  await connectDB();

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
  const wallet = walletDoc ? walletDoc.toObject() : null;

  const transactions = await WalletTransaction.find({
    businessId: business._id,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const [baseStats, protectedFutureDeposits] = await Promise.all([
    getBusinessWalletStats(business._id.toString()),
    getProtectedFutureDeposits(business._id.toString()),
  ]);

  const availableBalance = Number(wallet?.availableBalance || 0);
  const maxWithdrawable = computeMaxWithdrawable(
    availableBalance,
    protectedFutureDeposits
  );
  const stats = {
    ...baseStats,
    availableBalance,
    protectedFutureDeposits,
    maxWithdrawable,
  };

  return (
    <BusinessWalletPanel
      business={business}
      wallet={wallet}
      transactions={transactions}
      stats={stats}
    />
  );
}
