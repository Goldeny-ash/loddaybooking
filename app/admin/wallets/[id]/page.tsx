import WalletDetailsClient from "@/components/admin/WalletDetailsClient";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { connectDB } from "@/lib/mongoDB";
import Wallet from "@/lib/models/Wallet";
import WalletTransaction from "@/lib/models/WalletTransaction";

export const dynamic = "force-dynamic";

export default async function WalletDetailsPage(
  context: { params: Promise<{ id: string }> }
) {
  await requirePlatformOwner();
  await connectDB();

  const { id } = await context.params;

  const wallet = await Wallet.findById(id)
    .populate("businessId", "name email")
    .lean();

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const transactions = await WalletTransaction.find({
    walletId: wallet.walletId,
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return (
    <WalletDetailsClient wallet={wallet} transactions={transactions} />
  );
}
