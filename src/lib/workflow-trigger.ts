/**
 * Workflow Trigger Helper
 * Workflow'ları arka planda tetiklemek için yardımcı fonksiyonlar
 */

type WorkflowType =
  | "appointment-reminder"
  | "ai-valuation"
  | "listing-description";

interface TriggerParams {
  appointmentId?: string;
  valuationId?: string;
  listingId?: string;
}

/**
 * Workflow'u arka planda tetikler (fire-and-forget)
 * API response'u beklemeden devam eder
 */
export async function triggerWorkflow(
  workflow: WorkflowType,
  params: TriggerParams
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Fire-and-forget - response beklemiyoruz
  fetch(`${baseUrl}/api/workflows/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow, params }),
  }).catch((error) => {
    // Hata olursa sadece logla, ana işlemi etkilemesin
    console.error(`Workflow trigger error (${workflow}):`, error);
  });
}

/**
 * Randevu oluşturulduğunda hatırlatma workflow'unu tetikler
 */
export function triggerAppointmentReminder(appointmentId: string): void {
  triggerWorkflow("appointment-reminder", { appointmentId });
}

/**
 * Değerleme talebi oluşturulduğunda AI değerleme workflow'unu tetikler
 */
export function triggerAIValuation(valuationId: string): void {
  triggerWorkflow("ai-valuation", { valuationId });
}

/**
 * İlan oluşturulduğunda/güncellendiğinde açıklama oluşturma workflow'unu tetikler
 */
export function triggerListingDescription(listingId: string): void {
  triggerWorkflow("listing-description", { listingId });
}
