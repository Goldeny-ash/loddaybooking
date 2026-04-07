import Business from "@/lib/models/Business";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";

export async function runTrialProcessor() {
  const now = new Date();

  const businesses = await Business.find({
    "access.status": "TRIAL",
  });

  for (const business of businesses) {
    const access = business.access;

    if (!access.trialEndsAt) continue;

    const diffHours =
      (access.trialEndsAt.getTime() - now.getTime()) /
      (1000 * 60 * 60);

    /* =====================================================
       3 DAYS BEFORE TRIAL ENDS
    ===================================================== */
    if (
      diffHours <= 72 &&
      diffHours > 71 &&
      !access.trialWarningSent
    ) {
      await dispatchEmailEvent("TRIAL_EXPIRING", {
        business,
        upgradeUrl: "https://booking.lodday.com/subscription",
      });

      access.trialWarningSent = true;
      await business.save();
    }

    /* =====================================================
       TRIAL EXPIRED
    ===================================================== */
    if (access.trialEndsAt.getTime() <= now.getTime()) {
      access.status = "EXPIRED";

      await dispatchEmailEvent("TRIAL_EXPIRED", {
        business,
        upgradeUrl: "https://booking.lodday.com/subscription",
      });

      await business.save();
    }
  }
}
