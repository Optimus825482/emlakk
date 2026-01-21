/**
 * Workflow Trigger Helper
 * NOT: Workflow sistemi kaldırıldı. Bu fonksiyonlar artık hiçbir şey yapmıyor.
 * Geriye dönük uyumluluk için bırakıldı.
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
 * NOT: Workflow sistemi kaldırıldı, bu fonksiyon artık hiçbir şey yapmıyor
 */
export async function triggerWorkflow(
  workflow: WorkflowType,
  params: TriggerParams,
): Promise<void> {
  // No-op: Workflow sistemi kaldırıldı
  console.log(`[DEPRECATED] Workflow trigger ignored: ${workflow}`, params);
}

/**
 * Randevu oluşturulduğunda hatırlatma workflow'unu tetikler
 * NOT: Workflow sistemi kaldırıldı, bu fonksiyon artık hiçbir şey yapmıyor
 */
export function triggerAppointmentReminder(appointmentId: string): void {
  // No-op: Workflow sistemi kaldırıldı
  console.log(`[DEPRECATED] Appointment reminder ignored:`, appointmentId);
}

/**
 * Değerleme talebi oluşturulduğunda AI değerleme workflow'unu tetikler
 * NOT: Workflow sistemi kaldırıldı, bu fonksiyon artık hiçbir şey yapmıyor
 */
export function triggerAIValuation(valuationId: string): void {
  // No-op: Workflow sistemi kaldırıldı
  console.log(`[DEPRECATED] AI valuation ignored:`, valuationId);
}

/**
 * İlan oluşturulduğunda/güncellendiğinde açıklama oluşturma workflow'unu tetikler
 * NOT: Workflow sistemi kaldırıldı, bu fonksiyon artık hiçbir şey yapmıyor
 */
export function triggerListingDescription(listingId: string): void {
  // No-op: Workflow sistemi kaldırıldı
  console.log(`[DEPRECATED] Listing description ignored:`, listingId);
}
