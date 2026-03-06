import Business from "@/lib/models/Business";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";

export async function runSubscriptionProcessor() {
  const now = new Date();

  const businesses = await Business.find({
  "access.status": { $in: ["ACTIVE", "GRACE"] },
  "access.nextChargeAt": { $lte: new Date() },
})
.limit(100)
.lean();

  for (const business of businesses) {
    const access = business.access;

    /* =====================================================
       ACTIVE → PAYMENT FAILED (Missed charge date)
    ===================================================== */
    if (
      access.status === "ACTIVE" &&
      access.nextChargeAt &&
      access.nextChargeAt.getTime() < now.getTime()
    ) {
      // Move into grace
      access.status = "GRACE";
      access.graceEndsAt = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      await dispatchEmailEvent("SUBSCRIPTION_FAILED", {
        business,
        retryUrl: `${process.env.APP_URL}/billing`,
      });

      await business.save();
      continue;
    }

    /* =====================================================
       GRACE WARNING (1 day left)
    ===================================================== */
    if (
      access.status === "GRACE" &&
      access.graceEndsAt
    ) {
      const diffHours =
        (access.graceEndsAt.getTime() - now.getTime()) /
        (1000 * 60 * 60);

      if (
        diffHours <= 24 &&
        diffHours > 23 &&
        !access.graceWarningSent
      ) {
        await dispatchEmailEvent("SUBSCRIPTION_GRACE_WARNING", {
          business,
          retryUrl: `${process.env.APP_URL}/billing`,
        });

        access.graceWarningSent = true;
        await business.save();
      }
    }

    /* =====================================================
       GRACE EXPIRED → HARD EXPIRE
    ===================================================== */
    if (
      access.status === "GRACE" &&
      access.graceEndsAt &&
      access.graceEndsAt.getTime() <= now.getTime()
    ) {
      access.status = "EXPIRED";

      await dispatchEmailEvent("SUBSCRIPTION_EXPIRED", {
        business,
        retryUrl: `${process.env.APP_URL}/billing`,
      });

      await business.save();
    }
  }
}