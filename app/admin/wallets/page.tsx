import { connectDB } from "@/lib/mongoDB";
import Wallet from "@/lib/models/Wallet";
import { currentUser } from "@clerk/nextjs/server";
import WalletsListClient from "@/components/admin/WalletsListClient";

export default async function AdminWalletsPage() {
  const user = await currentUser();

  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    throw new Error("UNAUTHORIZED");
  }

  await connectDB();

  const wallets = await Wallet.find()
    .populate("businessId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return <WalletsListClient wallets={wallets} />;
}
