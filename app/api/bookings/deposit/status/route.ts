import { connectDB } from "@/lib/mongoDB";
import Deposit from "@/lib/models/Deposit";

export async function GET(req: Request) {
  await connectDB();

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });

  const deposit = await Deposit.findOne({ externalReference: token });
  if (!deposit) return Response.json({ error: "Deposit not found" }, { status: 404 });

  return Response.json({
    depositId: deposit._id.toString(),
    status: deposit.status,
    amount: deposit.amount,
    bookingId: deposit.bookingId.toString(),
    mpesaReceipt: deposit.mpesaReceipt || null,
  });
}
