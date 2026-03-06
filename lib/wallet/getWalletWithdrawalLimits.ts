import Deposit from "@/lib/models/Deposit";
import mongoose from "mongoose";

export async function getProtectedFutureDeposits(businessId: string) {
  const businessObjectId = new mongoose.Types.ObjectId(businessId);
  const today = new Date().toISOString().slice(0, 10);

  const agg = await Deposit.aggregate([
    {
      $lookup: {
        from: "bookings",
        localField: "bookingId",
        foreignField: "_id",
        as: "booking",
      },
    },
    { $unwind: "$booking" },
    {
      $match: {
        businessId: businessObjectId,
        status: "PAID",
        walletCredited: true,
        refundedAmount: { $lte: 0 },
        "booking.depositRefunded": { $ne: true },
        "booking.depositPaidOut": { $ne: true },
        "booking.date": { $gt: today },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$netAmount" },
      },
    },
  ]);

  return Number(agg[0]?.total || 0);
}

export function computeMaxWithdrawable(availableBalance: number, protectedFunds: number) {
  return Math.max(0, Number(availableBalance || 0) - Number(protectedFunds || 0));
}
