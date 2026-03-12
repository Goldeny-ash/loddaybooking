import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import BudgetCategory from "@/lib/models/BudgetCategory";
import BudgetExpenditure from "@/lib/models/BudgetExpenditure";

const INTASEND_BASE_URL =
  process.env.INTASEND_TEST === "true"
    ? "https://sandbox.intasend.com"
    : "https://api.intasend.com";

const SETTLEMENT_WALLET_ID = process.env.INTASEND_SETTLEMENT_WALLET_ID || "";

async function ensureAdmin() {
  const user = await currentUser();
  return Boolean(user?.id && user.id === process.env.PLATFORM_OWNER_CLERK_ID);
}

async function fetchSettlementWalletSummary() {
  if (!process.env.INTASEND_SECRET_KEY) {
    return { wallet: null, transactions: [], error: "Missing INTASEND_SECRET_KEY" };
  }

  if (!SETTLEMENT_WALLET_ID) {
    return { wallet: null, transactions: [], error: "Missing INTASEND_SETTLEMENT_WALLET_ID" };
  }

  const headers = {
    Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    const [walletRes, txRes] = await Promise.all([
      fetch(`${INTASEND_BASE_URL}/api/v1/wallets/${SETTLEMENT_WALLET_ID}/`, {
        method: "GET",
        headers,
        cache: "no-store",
      }),
      fetch(`${INTASEND_BASE_URL}/api/v1/wallets/${SETTLEMENT_WALLET_ID}/transactions/`, {
        method: "GET",
        headers,
        cache: "no-store",
      }),
    ]);

    const [walletData, txData] = await Promise.all([walletRes.json(), txRes.json()]);

    if (!walletRes.ok) {
      return {
        wallet: null,
        transactions: [],
        error: walletData?.detail || "Failed to fetch settlement wallet",
      };
    }

    const transactions = Array.isArray(txData)
      ? txData
      : Array.isArray(txData?.results)
        ? txData.results
        : [];

    const totals = transactions.reduce(
      (acc, txn) => {
        const value = Number(txn?.value ?? 0);
        if (value >= 0) acc.inflow += value;
        else acc.outflow += Math.abs(value);
        return acc;
      },
      { inflow: 0, outflow: 0 }
    );

    return {
      wallet: {
        walletId: SETTLEMENT_WALLET_ID,
        label: walletData?.label || "Settlement Wallet",
        currency: walletData?.currency || "KES",
        currentBalance: Number(walletData?.current_balance ?? 0),
        availableBalance: Number(walletData?.available_balance ?? 0),
        canDisburse: Boolean(walletData?.can_disburse),
        isClearing:
          Number(walletData?.current_balance ?? 0) >
          Number(walletData?.available_balance ?? 0),
        inflow: totals.inflow,
        outflow: totals.outflow,
        transactionCount: transactions.length,
        syncedAt: new Date().toISOString(),
      },
      transactions: transactions.slice(0, 20),
      error: txRes.ok ? null : txData?.detail || "Failed to fetch settlement transactions",
    };
  } catch (error) {
    return {
      wallet: null,
      transactions: [],
      error: error instanceof Error ? error.message : "Settlement wallet sync failed",
    };
  }
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();

  const [categories, expenditures, settlementWallet] = await Promise.all([
    BudgetCategory.find({ active: true }).sort({ createdAt: -1 }).lean(),
    BudgetExpenditure.find()
      .populate("categoryId", "name color")
      .sort({ spentAt: -1 })
      .limit(200)
      .lean(),
    fetchSettlementWalletSummary(),
  ]);

  return NextResponse.json({
    categories,
    expenditures,
    settlementWallet: settlementWallet.wallet,
    settlementTransactions: settlementWallet.transactions,
    settlementWalletError: settlementWallet.error,
  });
}

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();

  const body = await req.json();
  const mode = String(body.mode || "");

  if (mode === "category") {
    if (!body.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }
    const category = await BudgetCategory.create({
      name: String(body.name).trim(),
      monthlyAllocation: Number(body.monthlyAllocation || 0),
      color: String(body.color || "#0ea5e9"),
    });
    return NextResponse.json({ category });
  }

  if (mode === "expense") {
    if (!body.categoryId || !body.description || !body.amount) {
      return NextResponse.json(
        { error: "categoryId, description and amount are required" },
        { status: 400 }
      );
    }
    const expense = await BudgetExpenditure.create({
      categoryId: body.categoryId,
      description: String(body.description).trim(),
      amount: Number(body.amount),
      spentAt: body.spentAt ? new Date(body.spentAt) : new Date(),
    });
    return NextResponse.json({ expense });
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}
