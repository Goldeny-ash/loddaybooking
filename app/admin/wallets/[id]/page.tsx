import { connectDB } from "@/lib/mongoDB";
import Wallet from "@/lib/models/Wallet";
import WalletTransaction from "@/lib/models/WalletTransaction";
import { currentUser } from "@clerk/nextjs/server";
import WalletDetailsClient from "@/components/admin/WalletDetailsClient";

export default async function WalletDetailsPage(
  context: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();

  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    throw new Error("UNAUTHORIZED");
  }

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
