import WalletsListClient from "@/components/admin/WalletsListClient";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { connectDB } from "@/lib/mongoDB";
import Wallet from "@/lib/models/Wallet";

export const dynamic = "force-dynamic";

export default async function AdminWalletsPage() {
  await requirePlatformOwner();
  await connectDB();

  const wallets = await Wallet.find()
    .populate("businessId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return <WalletsListClient wallets={wallets} />;
}
