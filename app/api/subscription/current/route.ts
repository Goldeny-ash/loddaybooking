import { connectDB } from "@/lib/mongoDB";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import Subscription from "@/lib/models/Subscription";

export async function GET() {
  await connectDB();

  const business = await getCurrentBusiness({ requireSetup: true });
  if (!business) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await Subscription.findOne({
    businessId: business._id.toString(),
  }).sort({ createdAt: -1 });

  return Response.json({ subscription });
}
