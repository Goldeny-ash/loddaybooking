import WalletTransaction from "@/lib/models/WalletTransaction";

const INTASEND_BASE_URL =
  process.env.INTASEND_TEST === "true"
    ? "https://sandbox.intasend.com"
    : "https://api.intasend.com";

type SyncWalletLike = {
  walletId: string;
  businessId: string;
  currency?: string;
  currentBalance?: number;
};

type Result = {
  success: boolean;
  inserted: number;
  updated: number;
  error?: string;
};

function mapSendMoneyStateToStatus(state: string | undefined) {
  switch (state) {
    case "PAYSUCCESS":
      return "SUCCESS";
    case "PAYERROR":
    case "RESULT-FAILED":
    case "INITIATION-FAILED":
    case "FAILED":
      return "FAILED";
    case "CANCELLED":
      return "CANCELLED";
    case "PENDING":
    case "INITIATED":
    case "PROCESSING-RESULTS":
    case "OBSERVATION":
    case "RETRY":
    default:
      return "PROCESSING";
  }
}

function mapNarrativeToType(narrative: string | undefined, value: number) {
  const text = (narrative || "").toLowerCase();
  if (text.includes("withdraw") || text.includes("payout") || value < 0) {
    return "WITHDRAWAL_MPESA";
  }
  if (value > 0) return "DEPOSIT";
  return "ADJUSTMENT";
}

async function fetchJson(path: string, init?: RequestInit) {
  const resp = await fetch(`${INTASEND_BASE_URL}${path}`, {
    method: "GET",
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await resp.json();
  return { ok: resp.ok, status: resp.status, data };
}

export async function syncIntasendWalletTransactions(
  wallet: SyncWalletLike
): Promise<Result> {
  if (!process.env.INTASEND_SECRET_KEY) {
    return { success: false, inserted: 0, updated: 0, error: "Missing INTASEND_SECRET_KEY" };
  }

  try {
    let inserted = 0;
    let updated = 0;

    const walletStatement = await fetchJson(
      `/api/v1/wallets/${wallet.walletId}/transactions/`
    );

    if (walletStatement.ok && Array.isArray(walletStatement.data)) {
      const txns = [...walletStatement.data].sort((a, b) => {
        const aTime = new Date(a?.created_at || 0).getTime();
        const bTime = new Date(b?.created_at || 0).getTime();
        return aTime - bTime;
      });

      for (const txn of txns) {
        const value = Number(txn?.value ?? 0);
        const amount = Math.abs(value);
        const newBalance = Number(txn?.running_balance ?? wallet.currentBalance ?? 0);
        const previousBalance = newBalance - value;
        const createdAt = txn?.created_at ? new Date(txn.created_at) : new Date();
        const externalReference = `intasend_wallet:${wallet.walletId}:${txn?.invoice || "na"}:${txn?.created_at || ""}`;

        const exists = await WalletTransaction.findOne({
          walletId: wallet.walletId,
          businessId: wallet.businessId,
          externalReference,
        }).select("_id");

        if (exists) continue;

        await WalletTransaction.create({
          walletId: wallet.walletId,
          businessId: wallet.businessId,
          type: mapNarrativeToType(txn?.narrative, value),
          direction: value >= 0 ? "CREDIT" : "DEBIT",
          amount,
          netAmount: amount,
          currency: wallet.currency || "KES",
          previousBalance,
          newBalance,
          previousAvailableBalance: previousBalance,
          newAvailableBalance: newBalance,
          invoiceId: txn?.invoice,
          externalReference,
          narrative: txn?.narrative || "Synced from IntaSend wallet statement",
          status: "SUCCESS",
          initiatedBy: "SYSTEM",
          createdAt,
          updatedAt: createdAt,
          metadata: {
            source: "intasend_wallet_statement",
            raw: txn,
          },
        });
        inserted += 1;
      }
    }

    const sendMoneyList = await fetchJson(
      `/api/v1/send-money/transactions/?wallet_id=${encodeURIComponent(wallet.walletId)}`
    );

    const sendMoneyResults = Array.isArray(sendMoneyList.data?.results)
      ? sendMoneyList.data.results
      : Array.isArray(sendMoneyList.data)
        ? sendMoneyList.data
        : [];

    for (const payoutTxn of sendMoneyResults) {
      const trackingId =
        payoutTxn?.tracking_id ||
        payoutTxn?.record_id ||
        payoutTxn?.id ||
        payoutTxn?.reference;
      if (!trackingId) continue;

      const status = mapSendMoneyStateToStatus(payoutTxn?.state);
      const updateResult = await WalletTransaction.updateMany(
        {
          walletId: wallet.walletId,
          businessId: wallet.businessId,
          trackingId,
        },
        {
          $set: {
            status,
            metadata: {
              source: "intasend_send_money_transactions",
              raw: payoutTxn,
            },
          },
        }
      );
      updated += updateResult.modifiedCount || 0;
    }

    return { success: true, inserted, updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Transaction sync failed";
    return { success: false, inserted: 0, updated: 0, error: message };
  }
}
