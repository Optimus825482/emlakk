/**
 * Appointment Types & Constants
 * @module types/admin/appointment
 * @description Merkezi randevu tip tanımları - src/db/schema/appointments.ts ile uyumlu
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "noshow";
export type AppointmentType =
  | "viewing"
  | "valuation"
  | "consultation"
  | "selling"
  | "other";

export interface Appointment {
  id: string;

  // Müşteri bilgileri
  name: string;
  email: string;
  phone: string | null;

  // Randevu detayları
  type: AppointmentType;
  status: AppointmentStatus;
  date: string;
  time: string;

  // İlişkili ilan (opsiyonel)
  listingId: string | null;

  // Ek bilgiler
  message: string | null;
  adminNotes: string | null;

  // Zaman damgaları
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
}

// Tablo görünümü için minimal versiyon
export interface AppointmentTableRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: AppointmentType;
  status: AppointmentStatus;
  date: string;
  time: string;
  listingId: string | null;
  createdAt: string;
}

// Randevu oluşturma formu için
export interface CreateAppointmentInput {
  name: string;
  email: string;
  phone?: string;
  type: AppointmentType;
  date: string;
  time: string;
  message?: string;
  listingId?: string;
}

// Admin güncelleme için
export interface UpdateAppointmentInput {
  status?: AppointmentStatus;
  date?: string;
  time?: string;
  adminNotes?: string;
}

// ============================================================================
// LABEL CONSTANTS
// ============================================================================

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  cancelled: "İptal Edildi",
  completed: "Tamamlandı",
  noshow: "Gelmedi",
};

export const appointmentStatusColors: Record<AppointmentStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  noshow: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export const appointmentTypeLabels: Record<AppointmentType, string> = {
  viewing: "İlan Gösterimi",
  valuation: "Değerleme / Ekspertiz",
  consultation: "Danışmanlık",
  selling: "Satış İşlemleri",
  other: "Diğer",
};

export const appointmentTypeColors: Record<AppointmentType, string> = {
  viewing:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  valuation:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  consultation:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  selling:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

// ============================================================================
// STATUS ICONS (Lucide icon names)
// ============================================================================

export const appointmentStatusIcons: Record<AppointmentStatus, string> = {
  pending: "Clock",
  confirmed: "CheckCircle",
  cancelled: "XCircle",
  completed: "CheckCheck",
  noshow: "UserX",
};

export const appointmentTypeIcons: Record<AppointmentType, string> = {
  viewing: "Eye",
  valuation: "Calculator",
  consultation: "MessageSquare",
  selling: "HandCoins",
  other: "MoreHorizontal",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  return appointmentStatusLabels[status] || status;
}

export function getAppointmentTypeLabel(type: AppointmentType): string {
  return appointmentTypeLabels[type] || type;
}

export function formatAppointmentDate(date: string): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatAppointmentTime(time: string): string {
  // time: "14:30:00" -> "14:30"
  return time.substring(0, 5);
}

export function formatAppointmentDateTime(date: string, time: string): string {
  return `${formatAppointmentDate(date)} - ${formatAppointmentTime(time)}`;
}

export function isAppointmentPast(date: string, time: string): boolean {
  const appointmentDate = new Date(`${date}T${time}`);
  return appointmentDate < new Date();
}

export function isAppointmentToday(date: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return date === today;
}

export function isAppointmentUpcoming(date: string, time: string): boolean {
  const appointmentDate = new Date(`${date}T${time}`);
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  return appointmentDate >= now && appointmentDate <= oneHourFromNow;
}
