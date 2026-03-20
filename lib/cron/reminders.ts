import { runReminderProcessor } from "./processors/reminders.processors";

export async function runReminderJobs() {
  await runReminderProcessor();
}
