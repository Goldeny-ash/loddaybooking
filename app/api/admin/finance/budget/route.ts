import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import BudgetCategory from "@/lib/models/BudgetCategory";
import BudgetExpenditure from "@/lib/models/BudgetExpenditure";

async function ensureAdmin() {
  const user = await currentUser();
  return Boolean(user?.id && user.id === process.env.PLATFORM_OWNER_CLERK_ID);
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();

  const [categories, expenditures] = await Promise.all([
    BudgetCategory.find({ active: true }).sort({ createdAt: -1 }).lean(),
    BudgetExpenditure.find()
      .populate("categoryId", "name color")
      .sort({ spentAt: -1 })
      .limit(200)
      .lean(),
  ]);

  return NextResponse.json({ categories, expenditures });
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
