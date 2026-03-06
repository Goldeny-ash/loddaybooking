import { connectDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Service from "@/lib/models/Service";
import { validateServicePayload } from "@/lib/validators/serviceValidation";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import { enableBusinessDeposits } from "@/lib/server/enableBusinessDeposits";

export async function POST(req: Request) {
  console.log("🔵 POST /api/services called");

  await connectDB();
  console.log("✅ DB connected");

  const business = await getCurrentBusiness();
  console.log("🔎 Current business:", business?._id);

  if (!business) {
    console.log("❌ No business found (Unauthorized)");
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await req.json();
    console.log("📦 Request body:", body);
  } catch (err) {
    console.error("❌ Failed parsing JSON:", err);
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  try {
    console.log("🛠 Running validation...");
    const validated = await validateServicePayload({
      ...body,
      businessId: business._id,
    });

    console.log("✅ Validation passed");

    const service = new Service(validated);
    await service.save();
    console.log("✅ Service created:", service._id);

    if (service.depositOverride?.enabled === true) {
      console.log("💰 Deposit override enabled → Enabling business deposits");

      const walletResult = await enableBusinessDeposits(
        service.businessId.toString()
      );

      console.log("🏦 Wallet result:", walletResult);
    }

    console.log("🎉 Service creation completed successfully");

    return NextResponse.json({ success: true, service });
  } catch (error: unknown) {
    console.error("🔥 POST /api/services ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Invalid request";

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
