// app/api/cron/run/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import { runCronEngine } from "@/lib/cron/engine";

export const dynamic = "force-dynamic"; 
// Ensures this route is never cached by Vercel

export async function GET(req: Request) {
  try {
    /* =====================================================
       1. VERIFY SECRET (Security Layer)
    ===================================================== */

    const authHeader = req.headers.get("authorization");

    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* =====================================================
       2. CONNECT DATABASE
    ===================================================== */

    await connectDB();

    /* =====================================================
       3. RUN ENGINE
    ===================================================== */

    await runCronEngine();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("CRON_ERROR:", error);

    return NextResponse.json(
      { error: "Cron execution failed" },
      { status: 500 }
    );
  }
}