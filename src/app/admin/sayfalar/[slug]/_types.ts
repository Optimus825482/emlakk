// Sayfa konfigürasyon tipi
export interface PageConfig {
  name: string;
  icon: string;
  path: string;
}

// Sayfa konfigürasyonları
export const pageConfigs: Record<string, PageConfig> = {
  anasayfa: { name: "Ana Sayfa", icon: "home", path: "/" },
  hakkimizda: { name: "Hakkımızda", icon: "info", path: "/hakkimizda" },
  hendek: { name: "Hendek Verileri", icon: "analytics", path: "/" },
  iletisim: { name: "İletişim", icon: "mail", path: "/iletisim" },
  degerleme: { name: "AI Değerleme", icon: "auto_awesome", path: "/degerleme" },
  rehber: { name: "Yatırım Rehberi", icon: "menu_book", path: "/rehber" },
  randevu: { name: "Randevu", icon: "calendar_month", path: "/randevu" },
};

// Editor props
export interface EditorProps {
  config: PageConfig;
}

// Hendek tipi
export interface HendekStat {
  id: string;
  key: string;
  label: string;
  value: string;
  numericValue: number | null;
  unit: string | null;
  description: string | null;
  icon: string;
  color: string;
  source: string | null;
  year: number | null;
  isActive: boolean;
  sortOrder: number;
}

// Rehber feature tipi
export interface RehberFeature {
  icon: string;
  title: string;
  description: string;
}

// Rehber içerik tipi
export interface RehberContent {
  title: string;
  subtitle: string;
  description: string;
  comingSoonText: string;
  features: RehberFeature[];
  progressItems: { label: string; progress: number }[];
}

// İletişim içerik tipi
export interface IletisimContent {
  heroTitle: string;
  heroDescription: string;
  formTitle: string;
  formDescription: string;
  successTitle: string;
  successMessage: string;
  notificationEmail: string;
  features: { icon: string; title: string; description: string }[];
}

// Randevu içerik tipi
export interface RandevuContent {
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  successTitle: string;
  successMessage: string;
  notificationEmail: string;
  brokerName: string;
  brokerTitle: string;
  brokerPhone: string;
  brokerEmail: string;
  appointmentTypes: AppointmentType[];
}

// Randevu tipi
export interface AppointmentType {
  key: string;
  label: string;
  icon: string;
  description: string;
  duration: string;
  isActive: boolean;
}

// Nüfus verisi tipi
export interface PopulationData {
  id: string;
  year: number;
  totalPopulation: number;
  malePopulation: number | null;
  femalePopulation: number | null;
  growthRate: string | null;
}
