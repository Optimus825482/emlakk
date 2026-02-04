/**
 * Contact Types & Constants
 * @module types/admin/contact
 * @description Merkezi iletişim tip tanımları - src/db/schema/contacts.ts ile uyumlu
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ContactStatus = "new" | "read" | "replied" | "archived";
export type ContactSource =
  | "website"
  | "listing"
  | "valuation"
  | "whatsapp"
  | "phone";

export interface Contact {
  id: string;

  // İletişim bilgileri
  name: string;
  email: string;
  phone: string | null;

  // Mesaj
  subject: string | null;
  message: string;

  // Kaynak & Durum
  source: ContactSource;
  status: ContactStatus;

  // İlişkili ilan (opsiyonel)
  listingId: string | null;

  // Admin yanıtı
  adminReply: string | null;
  repliedAt: string | null;

  // İzleme
  ipAddress: string | null;
  userAgent: string | null;

  // Flags
  isSpam: boolean;

  // Zaman damgaları
  createdAt: string;
  updatedAt: string;
}

// Tablo görünümü için minimal versiyon
export interface ContactTableRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: ContactSource;
  status: ContactStatus;
  isSpam: boolean;
  createdAt: string;
}

// İletişim formu gönderimi için
export interface CreateContactInput {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  source?: ContactSource;
  listingId?: string;
}

// Admin yanıt formu için
export interface ContactReplyInput {
  adminReply: string;
  status?: ContactStatus;
}

// ============================================================================
// LABEL CONSTANTS
// ============================================================================

export const contactStatusLabels: Record<ContactStatus, string> = {
  new: "Yeni",
  read: "Okundu",
  replied: "Yanıtlandı",
  archived: "Arşivlendi",
};

export const contactStatusColors: Record<ContactStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  read: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  replied:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export const contactSourceLabels: Record<ContactSource, string> = {
  website: "Web Sitesi",
  listing: "İlan Sayfası",
  valuation: "Değerleme",
  whatsapp: "WhatsApp",
  phone: "Telefon",
};

export const contactSourceColors: Record<ContactSource, string> = {
  website:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  listing:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  valuation:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  whatsapp:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  phone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
};

// ============================================================================
// STATUS ICONS (Lucide icon names)
// ============================================================================

export const contactStatusIcons: Record<ContactStatus, string> = {
  new: "Mail",
  read: "MailOpen",
  replied: "Reply",
  archived: "Archive",
};

export const contactSourceIcons: Record<ContactSource, string> = {
  website: "Globe",
  listing: "Building2",
  valuation: "Calculator",
  whatsapp: "MessageCircle",
  phone: "Phone",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getContactStatusLabel(status: ContactStatus): string {
  return contactStatusLabels[status] || status;
}

export function getContactSourceLabel(source: ContactSource): string {
  return contactSourceLabels[source] || source;
}

export function formatContactDate(date: string): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateMessage(message: string, maxLength = 100): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength).trim() + "...";
}
