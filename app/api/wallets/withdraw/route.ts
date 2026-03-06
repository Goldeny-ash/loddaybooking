import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Wallet from "@/lib/models/Wallet";
import WalletTransaction from "@/lib/models/WalletTransaction";
import Payout from "@/lib/models/Payout";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import { syncIntasendWallet } from "@/lib/wallet/syncIntasendWallet";
import {
  computeMaxWithdrawable,
  getProtectedFutureDeposits,
} from "@/lib/wallet/getWalletWithdrawalLimits";

const INTASEND_BASE_URL =
  process.env.INTASEND_TEST === "true"
    ? "https://sandbox.intasend.com"
    : "https://api.intasend.com";

function normalizePhone(phone: string) {
  if (!phone) return null;
  let cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("07")) cleaned = `254${cleaned.substring(1)}`;
  if (cleaned.startsWith("+254")) cleaned = cleaned.replace("+", "");
  if (!/^2547\d{8}$/.test(cleaned)) return null;
  return cleaned;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const business = await getCurrentBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      amount?: number;
      phone?: string;
    };

    const rawAmount = Number(body?.amount || 0);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return NextResponse.json(
        { error: "Provide a valid withdrawal amount" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(body?.phone || business.phone || "");
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Invalid M-Pesa phone number format" },
        { status: 400 }
      );
    }

    const wallet = await Wallet.findOne({ businessId: business._id });
    if (!wallet || !wallet.walletId) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const sync = await syncIntasendWallet(wallet);
    if (!sync.success) {
      return NextResponse.json(
        { error: sync.error || "Failed to refresh wallet balance" },
        { status: 502 }
      );
    }

    const protectedFutureDeposits = await getProtectedFutureDeposits(
      business._id.toString()
    );
    const maxWithdrawable = computeMaxWithdrawable(
      Number(wallet.availableBalance || 0),
      protectedFutureDeposits
    );

    if (rawAmount > maxWithdrawable) {
      return NextResponse.json(
        {
          error: "Amount exceeds withdrawable funds",
          maxWithdrawable,
          protectedFutureDeposits,
          availableBalance: wallet.availableBalance,
        },
        { status: 400 }
      );
    }

    const payout = await Payout.create({
      businessId: business._id,
      walletId: wallet.walletId,
      amount: rawAmount,
      currency: wallet.currency || "KES",
      bookingIds: [],
      depositIds: [],
      method: "MPESA",
      destinationAccount: normalizedPhone,
      status: "PENDING",
      initiatedAt: new Date(),
    });

    const initiateResponse = await fetch(
      `${INTASEND_BASE_URL}/api/v1/send-money/initiate/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: "MPESA-B2C",
          currency: wallet.currency || "KES",
          wallet_id: wallet.walletId,
          requires_approval: "NO",
          transactions: [
            {
              name: business.name || "Business Withdrawal",
              account: normalizedPhone,
              amount: rawAmount,
              narrative: "Business Withdrawal",
            },
          ],
        }),
      }
    );

    const initiateData = await initiateResponse.json();
    if (!initiateResponse.ok || !initiateData?.tracking_id) {
      payout.status = "FAILED";
      payout.failureReason =
        initiateData?.detail || initiateData?.message || "Withdrawal initiation failed";
      await payout.save();
      return NextResponse.json(
        {
          error: payout.failureReason,
          details: initiateData,
        },
        { status: 400 }
      );
    }

    const previousBalance = Number(wallet.currentBalance || 0);
    const previousAvailableBalance = Number(wallet.availableBalance || 0);
    const newBalance = previousBalance - rawAmount;
    const newAvailableBalance = previousAvailableBalance - rawAmount;

    wallet.currentBalance = newBalance;
    wallet.availableBalance = newAvailableBalance;
    wallet.intasendCurrentBalance = newBalance;
    wallet.intasendAvailableBalance = newAvailableBalance;
    wallet.updatedAt = new Date();
    await wallet.save();

    const walletTxn = await WalletTransaction.create({
      walletId: wallet.walletId,
      businessId: business._id,
      type: "WITHDRAWAL_MPESA",
      direction: "DEBIT",
      amount: rawAmount,
      netAmount: rawAmount,
      currency: wallet.currency || "KES",
      previousBalance,
      newBalance,
      previousAvailableBalance,
      newAvailableBalance,
      trackingId: initiateData.tracking_id,
      status: "PROCESSING",
      narrative: `Withdrawal to ${normalizedPhone}`,
      initiatedBy: "BUSINESS",
      metadata: {
        source: "withdraw_api",
        sendMoneyInitiate: initiateData,
      },
    });

    payout.trackingId = initiateData.tracking_id;
    payout.providerState = initiateData?.state || initiateData?.status || "INITIATED";
    payout.status = "PROCESSING";
    payout.walletTransactionId = walletTxn._id;
    payout.lastStatusCheckAt = new Date();
    await payout.save();

    return NextResponse.json({
      success: true,
      payoutId: payout._id,
      trackingId: payout.trackingId,
      status: payout.status,
      phone: normalizedPhone,
      amount: rawAmount,
      maxWithdrawable,
      protectedFutureDeposits,
      availableBalance: Number(sync.availableBalance || wallet.availableBalance || 0),
    });
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Server error", details }, { status: 500 });
  }
}
