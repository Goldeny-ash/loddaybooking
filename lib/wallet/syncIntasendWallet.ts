const INTASEND_BASE_URL =
  process.env.INTASEND_TEST === "true"
    ? "https://sandbox.intasend.com"
    : "https://api.intasend.com";

type SyncResult = {
  success: boolean;
  walletId?: string;
  currentBalance?: number;
  availableBalance?: number;
  canDisburse?: boolean;
  isClearing?: boolean;
  syncedAt?: Date;
  error?: string;
};

type SyncableWallet = {
  walletId?: string;
  canDisburse?: boolean;
  currentBalance?: number;
  availableBalance?: number;
  intasendCurrentBalance?: number;
  intasendAvailableBalance?: number;
  isClearing?: boolean;
  intasendLastSync?: Date | null;
  updatedAt?: Date;
  currency?: string;
  save: () => Promise<unknown>;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected wallet sync error";
}

export async function syncIntasendWallet(wallet: SyncableWallet): Promise<SyncResult> {
  if (!wallet?.walletId) {
    return { success: false, error: "Wallet not found or missing walletId" };
  }

  if (!process.env.INTASEND_SECRET_KEY) {
    return { success: false, error: "Missing INTASEND_SECRET_KEY" };
  }

  try {
    const response = await fetch(
      `${INTASEND_BASE_URL}/api/v1/wallets/${wallet.walletId}/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.detail || "Failed to fetch wallet details from IntaSend",
      };
    }

    const currentBalance = Number(data?.current_balance ?? 0);
    const availableBalance = Number(data?.available_balance ?? 0);
    const isClearing = currentBalance > availableBalance;
    const syncedAt = new Date();

    wallet.currentBalance = currentBalance;
    wallet.availableBalance = availableBalance;
    wallet.intasendCurrentBalance = currentBalance;
    wallet.intasendAvailableBalance = availableBalance;
    wallet.canDisburse = Boolean(data?.can_disburse ?? wallet.canDisburse);
    wallet.isClearing = isClearing;
    wallet.intasendLastSync = syncedAt;
    wallet.updatedAt = syncedAt;

    if (typeof data?.currency === "string" && data.currency.trim()) {
      wallet.currency = data.currency;
    }

    await wallet.save();

    return {
      success: true,
      walletId: wallet.walletId,
      currentBalance,
      availableBalance,
      canDisburse: wallet.canDisburse,
      isClearing,
      syncedAt,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
