import Business from "@/lib/models/Business";
import Wallet from "@/lib/models/Wallet";
import { connectDB } from "@/lib/mongoDB";

export async function enableBusinessDeposits(businessId: string) {
  console.log("🚀 enableBusinessDeposits called:", businessId);

  await connectDB();
  console.log("✅ DB connected inside enableBusinessDeposits");

  const business = await Business.findById(businessId);
  console.log("🔎 Business lookup result:", !!business);

  if (!business) {
    console.error("❌ Business not found");
    throw new Error("Business not found");
  }

  console.log("🛠 Enabling deposit policy...");
  business.depositPolicy = {
    ...business.depositPolicy,
    enabled: true,
  };

  await business.save();
  console.log("✅ Deposit policy saved");

  if (business.wallet?.walletId) {
    console.log("ℹ️ Business already has wallet:", business.wallet.walletId);
    return { walletId: business.wallet.walletId };
  }

  const existingWallet = await Wallet.findOne({ businessId });
  console.log("🔎 Existing wallet found:", !!existingWallet);

  if (existingWallet) {
    console.log("♻️ Reusing existing wallet:", existingWallet.walletId);

    business.wallet = {
      walletId: existingWallet.walletId,
      walletLabel: `BIZ_${business._id}`,
      walletCurrency: existingWallet.currency,
      canDisburse: true,
      walletCreatedAt: existingWallet.createdAt,
    };

    await business.save();
    console.log("✅ Business updated with existing wallet");

    return { walletId: existingWallet.walletId };
  }

  console.log("🌐 Creating IntaSend wallet...");

  const response = await fetch(
    "https://api.intasend.com/api/v1/wallets/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
      },
      body: JSON.stringify({
        wallet_type: "WORKING",
        currency: "KES",
        label: `BIZ_${business._id}`,
        can_disburse: true,
      }),
    }
  );

  console.log("📡 IntaSend response status:", response.status);

  if (!response.ok) {
    const errData = await response.json();
    console.error("❌ IntaSend wallet creation failed:", errData);
    throw new Error(JSON.stringify(errData));
  }

  const walletData = await response.json();
  console.log("✅ IntaSend wallet created:", walletData);

  business.wallet = {
    walletId: walletData.wallet_id,
    walletLabel: walletData.label,
    walletCurrency: walletData.currency,
    canDisburse: true,
    walletCreatedAt: new Date(),
  };

  await business.save();
  console.log("✅ Business updated with new wallet");

  await Wallet.create({
    walletId: walletData.wallet_id,
    businessId,
    currency: walletData.currency,
    currentBalance: 0,
    availableBalance: 0,
    canDisburse: true,
  });

  console.log("✅ Wallet record created in DB");

  return { walletId: walletData.wallet_id };
}
