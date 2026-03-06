import { runReminderProcessor } from "./processors/reminders.processors";
import { runSubscriptionProcessor } from "./processors/subscriptions.processor";
import { runTrialProcessor } from "./processors/trials.processors";
import { runPostAppointmentProcessor } from "./processors/postAppointment.processor";
import { runDailySummaryProcessor } from "./processors/dailySummary.processor";
import { runInvoiceReminderProcessor } from "./processors/invoice.processor";

export async function runCronEngine() {
  console.log("Cron engine started:", new Date().toISOString());

  await runReminderProcessor();
  await runPostAppointmentProcessor();
  await runTrialProcessor();
  await runSubscriptionProcessor();
  await runDailySummaryProcessor();
  await runInvoiceReminderProcessor();

  console.log("Cron engine finished.");
}
