/**
 * Notification Helper
 * Admin paneline bildirim göndermek için yardımcı fonksiyonlar
 */

type NotificationType =
  | "appointment"
  | "contact"
  | "valuation"
  | "listing"
  | "system";

interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Yeni bildirim oluşturur (fire-and-forget)
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }).catch((error) => {
    console.error("Notification create error:", error);
  });
}

/**
 * Yeni randevu bildirimi
 */
export function notifyNewAppointment(
  appointmentId: string,
  name: string,
  type: string
): void {
  const typeLabels: Record<string, string> = {
    viewing: "Görüntüleme",
    consultation: "Danışmanlık",
    valuation: "Değerleme",
  };

  createNotification({
    type: "appointment",
    title: "Yeni Randevu Talebi",
    message: `${name} - ${typeLabels[type] || type} randevusu talep etti`,
    entityType: "appointment",
    entityId: appointmentId,
  });
}

/**
 * Yeni mesaj bildirimi
 */
export function notifyNewContact(
  contactId: string,
  name: string,
  subject?: string
): void {
  createNotification({
    type: "contact",
    title: "Yeni Mesaj",
    message: `${name}${subject ? ` - ${subject}` : ""} mesaj gönderdi`,
    entityType: "contact",
    entityId: contactId,
  });
}

/**
 * Yeni değerleme talebi bildirimi
 */
export function notifyNewValuation(
  valuationId: string,
  name: string,
  propertyType: string
): void {
  const typeLabels: Record<string, string> = {
    land: "Arsa",
    residential: "Konut",
    commercial: "Ticari",
    industrial: "Sanayi",
    agricultural: "Tarım",
  };

  createNotification({
    type: "valuation",
    title: "Yeni Değerleme Talebi",
    message: `${name} - ${
      typeLabels[propertyType] || propertyType
    } değerleme talep etti`,
    entityType: "valuation",
    entityId: valuationId,
  });
}
