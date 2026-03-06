import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Wallet from "@/lib/models/Wallet";
import WalletTransaction from "@/lib/models/WalletTransaction";
import Payout from "@/lib/models/Payout";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import { syncIntasendWallet } from "@/lib/wallet/syncIntasendWallet";

const INTASEND_BASE_URL =
  process.env.INTASEND_TEST === "true"
    ? "https://sandbox.intasend.com"
    : "https://api.intasend.com";

function mapStatus(code: string | undefined) {
  switch (code) {
    case "TS100":
    case "PAYSUCCESS":
      return "SUCCESS";
    case "TF103":
    case "TF105":
    case "TF106":
    case "PAYERROR":
    case "INITIATION-FAILED":
    case "RESULT-FAILED":
    case "BF102":
    case "BF105":
    case "BF107":
      return "FAILED";
    case "TC108":
    case "CANCELLED":
    case "BE111":
      return "CANCELLED";
    case "TP101":
    case "TP102":
    case "TP104":
    case "TR109":
    case "TH107":
    case "PENDING":
    case "INITIATED":
    case "PROCESSING-RESULTS":
    case "OBSERVATION":
    case "RETRY":
    default:
      return "PROCESSING";
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const business = await getCurrentBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      trackingId?: string;
      payoutId?: string;
    };
    const trackingId = body.trackingId;

    const payout = await Payout.findOne({
      businessId: business._id,
      ...(body.payoutId ? { _id: body.payoutId } : {}),
      ...(trackingId ? { trackingId } : {}),
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    if (!payout.trackingId) {
      return NextResponse.json(
        { error: "Payout has no tracking ID" },
        { status: 400 }
      );
    }

    const statusResp = await fetch(`${INTASEND_BASE_URL}/api/v1/send-money/status/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tracking_id: payout.trackingId }),
    });
    const statusData = await statusResp.json();
    if (!statusResp.ok) {
      return NextResponse.json(
        { error: statusData?.detail || "Failed to fetch payout status" },
        { status: 502 }
      );
    }

    const rawCode =
      statusData?.status ||
      statusData?.state ||
      statusData?.transactions?.[0]?.status ||
      statusData?.transactions?.[0]?.state;
    const mappedStatus = mapStatus(rawCode);

    payout.providerState = String(rawCode || "");
    payout.lastStatusCheckAt = new Date();

    const walletTxn = await WalletTransaction.findById(payout.walletTransactionId);

    if (mappedStatus === "SUCCESS") {
      payout.status = "SUCCESS";
      payout.completedAt = new Date();
      if (walletTxn) {
        walletTxn.status = "SUCCESS";
        walletTxn.metadata = {
          ...(walletTxn.metadata || {}),
          sendMoneyStatus: statusData,
        };
        await walletTxn.save();
      }
    } else if (mappedStatus === "FAILED" || mappedStatus === "CANCELLED") {
      const alreadyReversed = Boolean(payout.reversedAt);
      payout.status = mappedStatus;
      payout.failureReason =
        statusData?.failed_reason ||
        statusData?.detail ||
        statusData?.message ||
        payout.failureReason;

      if (!alreadyReversed) {
        const wallet = await Wallet.findOne({
          businessId: business._id,
          walletId: payout.walletId,
        });
        if (wallet) {
          wallet.currentBalance = Number(wallet.currentBalance || 0) + Number(payout.amount || 0);
          wallet.availableBalance =
            Number(wallet.availableBalance || 0) + Number(payout.amount || 0);
          wallet.intasendCurrentBalance = wallet.currentBalance;
          wallet.intasendAvailableBalance = wallet.availableBalance;
          wallet.updatedAt = new Date();
          await wallet.save();
          await syncIntasendWallet(wallet);
        }

        payout.reversedAt = new Date();
        payout.status = "REVERSED";
        if (walletTxn) {
          walletTxn.status = mappedStatus === "CANCELLED" ? "CANCELLED" : "FAILED";
          walletTxn.failureReason = payout.failureReason;
          walletTxn.metadata = {
            ...(walletTxn.metadata || {}),
            sendMoneyStatus: statusData,
            reversalApplied: true,
          };
          await walletTxn.save();
        }
      }
    } else {
      payout.status = "PROCESSING";
      if (walletTxn) {
        walletTxn.status = "PROCESSING";
        walletTxn.metadata = {
          ...(walletTxn.metadata || {}),
          sendMoneyStatus: statusData,
        };
        await walletTxn.save();
      }
    }

    await payout.save();

    return NextResponse.json({
      success: true,
      payoutId: payout._id,
      trackingId: payout.trackingId,
      status: payout.status,
      providerState: payout.providerState,
      raw: statusData,
      terminal: ["SUCCESS", "REVERSED", "FAILED", "CANCELLED"].includes(payout.status),
    });
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Server error", details }, { status: 500 });
  }
}
