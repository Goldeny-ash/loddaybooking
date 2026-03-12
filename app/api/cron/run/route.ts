// app/api/cron/run/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import { runCronEngine } from "@/lib/cron/engine";
import CronRun from "@/lib/models/CronRun";

export const dynamic = "force-dynamic"; 
// Ensures this route is never cached by Vercel

export async function GET(req: Request) {
  try {
    /* =====================================================
       1. VERIFY SECRET (Security Layer)
    ===================================================== */

    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const expectedAuth = cronSecret ? `Bearer ${cronSecret}` : "";
    const fromVercelCron = req.headers.get("x-vercel-cron");

    if (!cronSecret) {
      return NextResponse.json(
        { error: "Missing CRON_SECRET" },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth && !fromVercelCron) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* =====================================================
       2. CONNECT DATABASE
    ===================================================== */

    await connectDB();

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    const now = new Date();
    const isoNow = now.toISOString();
    const utcDate = isoNow.slice(0, 10);
    const utcMinute = isoNow.slice(0, 16);
    const runKey = `minute:${utcMinute}`;

    if (!force) {
      const existing = await CronRun.findOne({ key: runKey }).lean();
      if (existing?.status === "success") {
        return NextResponse.json({
          ok: true,
          skipped: true,
          reason: "already-ran-this-minute",
          runKey,
        });
      }
    }

    await CronRun.findOneAndUpdate(
      { key: runKey },
      {
        key: runKey,
        date: utcDate,
        status: "running",
        startedAt: now,
        finishedAt: null,
        error: "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    /* =====================================================
       3. RUN ENGINE
    ===================================================== */

    await runCronEngine();

    await CronRun.findOneAndUpdate(
      { key: runKey },
      {
        status: "success",
        finishedAt: new Date(),
      }
    );

    return NextResponse.json({
      ok: true,
      runKey,
      forced: force,
    });
  } catch (error) {
    console.error("CRON_ERROR:", error);

    const now = new Date();
    const isoNow = now.toISOString();
    const utcDate = isoNow.slice(0, 10);
    const utcMinute = isoNow.slice(0, 16);
    const runKey = `minute:${utcMinute}`;
    const errorMessage =
      error instanceof Error ? error.message : "Cron execution failed";

    try {
      await CronRun.findOneAndUpdate(
        { key: runKey },
        {
          status: "failed",
          finishedAt: new Date(),
          error: errorMessage,
        }
      );
    } catch (dbError) {
      console.error("CRON_ERROR_LOGGING_FAILED:", dbError);
    }

    return NextResponse.json(
      { error: "Cron execution failed" },
      { status: 500 }
    );
  }
}
