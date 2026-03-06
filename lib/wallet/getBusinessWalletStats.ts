import Deposit from "@/lib/models/Deposit";
import mongoose from "mongoose";

export async function getBusinessWalletStats(businessId: string) {
  const businessObjectId = new mongoose.Types.ObjectId(businessId);

  const [withdrawableAgg, onHoldAgg] = await Promise.all([

    // --------------------------------------
    // WITHDRAWABLE
    // --------------------------------------
    Deposit.aggregate([
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
          walletCredited: true, // 🔒 ensure credited
          "booking.status": "completed",
          "booking.depositPaidOut": { $ne: true },
          "booking.depositRefunded": { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$netAmount" }, // ✅ FIXED
        },
      },
    ]),

    // --------------------------------------
    // ON HOLD
    // --------------------------------------
    Deposit.aggregate([
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
          "booking.depositPaidOut": { $ne: true },
          "booking.depositRefunded": { $ne: true },
          "booking.status": { $ne: "completed" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$netAmount" }, // ✅ FIXED
        },
      },
    ]),
  ]);

  return {
    withdrawable: withdrawableAgg[0]?.total || 0,
    onHold: onHoldAgg[0]?.total || 0,
  };
}
