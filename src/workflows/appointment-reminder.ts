/**
 * Randevu Hatırlatma Workflow'u (Placeholder)
 *
 * NOT: Workflow sistemi şu anda devre dışı
 * Gelecekte cron job veya queue sistemi ile entegre edilecek
 */

import { getAppointment, updateAppointmentStatus } from "./steps/database";
import { sendEmail } from "./steps/email";

export async function appointmentReminderWorkflow(appointmentId: string) {
  // TODO: Implement with cron job or queue system
  console.log(`Workflow placeholder called for appointment: ${appointmentId}`);

  return {
    success: false,
    reason: "workflow_system_disabled",
    message: "Workflow sistemi şu anda devre dışı",
  };
}
