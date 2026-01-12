/**
 * Emlakjet'ten alınan gerçek Hendek ilanlarına dayalı seed script
 * Mevcut ilanları temizler ve 3 örnek ilan ekler
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { listings } from "./schema/listings";
import { listingViews } from "./schema/listing-analytics";

// Seed için DIRECT_URL kullan (pooler değil, direkt bağlantı)
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL veya DIRECT_URL tanımlı değil!");
  process.exit(1);
}
console.log(
  "🔗 Bağlantı URL'i:",
  connectionString.replace(/:[^:@]+@/, ":***@")
);

const seedClient = postgres(connectionString, {
  ssl: "require",
  max: 1,
  idle_timeout: 0,
  connect_timeout: 60,
  prepare: false, // Supabase için önemli
});
const db = drizzle(seedClient, { schema });

async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 2000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(
        `⚠️  Bağlantı hatası, ${delay / 1000}s sonra tekrar deneniyor... (${
          i + 1
        }/${retries})`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Max retries reached");
}

async function seedFromEmlakjet() {
  console.log("🗑️  Mevcut ilanlar temizleniyor...");

  // Önce listing_views tablosunu temizle (foreign key constraint)
  await retry(() => db.delete(listingViews));
  console.log("✓ Listing views temizlendi");

  // Sonra listings tablosunu temizle
  await retry(() => db.delete(listings));
  console.log("✓ Listings temizlendi");

  console.log("\n📝 Emlakjet'ten alınan örnek ilanlar ekleniyor...\n");

  // Emlakjet'ten alınan gerçek ilan verileri
  const emlakjetListings = [
    {
      title: "Hendek Yeni Mahalle'de 3+1 Satılık Daire",
      slug: "hendek-yeni-mahalle-3-1-satilik-daire",
      description: `Sakarya Hendek Yeni Mahalle'de satılık 3+1 daire. 

Daire Özellikleri:
• 145 m² kullanım alanı
• 3+1 oda düzeni
• Merkezi konumda
• Ulaşım kolaylığı
• Okullara ve hastaneye yakın

Yeni Mahalle, Hendek'in en gelişmiş bölgelerinden biridir. Bölgede ortalama m² fiyatı 22.040 TL civarındadır. Yatırım için ideal bir lokasyondur.

Detaylı bilgi ve randevu için iletişime geçiniz.`,
      type: "konut" as const,
      status: "active" as const,
      transactionType: "sale" as const,
      address: "Yeni Mahalle, Hendek, Sakarya",
      city: "Hendek",
      district: "Sakarya",
      neighborhood: "Yeni Mahalle",
      latitude: "40.7927",
      longitude: "30.0983",
      area: 145,
      price: "4600000",
      pricePerSqm: "31724",
      features: {
        rooms: "3+1",
        bathrooms: 1,
        floors: 4,
        buildingAge: 5,
        heating: "Doğalgaz Kombi",
        parking: true,
        elevator: true,
        security: false,
      },
      aiScore: 78,
      aiInsight:
        "Yeni Mahalle, Hendek'in en değerli bölgelerinden biri. Bölgede ortalama amortisman süresi 14 yıl. 2026 sonuna kadar %21 değer artışı bekleniyor.",
      roiEstimate: "7.14",
      images: [
        "https://imaj.emlakjet.com/resize/736/415/listing/18796220/E697978745885675F779134E7EF07EBA18796220.jpg",
        "https://imaj.emlakjet.com/resize/364/202/listing/18796220/A8636CC22DC2309CF5E4B6A7860F624818796220.jpg",
        "https://imaj.emlakjet.com/resize/364/202/listing/18796220/320EB5B1448C58B797C16143566EF0F018796220.jpg",
      ],
      thumbnail:
        "https://imaj.emlakjet.com/resize/736/415/listing/18796220/E697978745885675F779134E7EF07EBA18796220.jpg",
      metaTitle: "Hendek Yeni Mahalle 3+1 Satılık Daire | Demir Gayrimenkul",
      metaDescription:
        "Sakarya Hendek Yeni Mahalle'de 145 m² 3+1 satılık daire. Merkezi konum, ulaşım kolaylığı. 4.600.000 TL",
      isFeatured: true,
      isNew: true,
      publishedAt: new Date(),
    },
    {
      title: "Hendek Beyköy Mahallesi'nde Bahçeli Müstakil Ev",
      slug: "hendek-beykoy-bahceli-mustakil-ev",
      description: `Sakarya Hendek Beyköy Mahallesi'nde 380 m² arsa üzerinde satılık müstakil ev.

Ev Özellikleri:
• 93 m² kapalı alan
• 380 m² arsa
• 3+1 oda düzeni
• Bahçeli müstakil yapı
• Doğa ile iç içe konum

Beyköy Mahallesi, Hendek'in sakin ve huzurlu bölgelerinden biridir. Şehir merkezine yakın konumda olup, doğal yaşam arayanlar için idealdir.

Detaylı bilgi için iletişime geçiniz.`,
      type: "konut" as const,
      status: "active" as const,
      transactionType: "sale" as const,
      address: "Beyköy Mahallesi, Hendek, Sakarya",
      city: "Hendek",
      district: "Sakarya",
      neighborhood: "Beyköy Mahallesi",
      latitude: "40.7856",
      longitude: "30.1124",
      area: 93,
      price: "2500000",
      pricePerSqm: "26882",
      features: {
        rooms: "3+1",
        bathrooms: 1,
        floors: 2,
        buildingAge: 21,
        heating: "Soba",
        parking: true,
        garden: true,
        furnished: false,
      },
      aiScore: 72,
      aiInsight:
        "Beyköy Mahallesi'nde ortalama konut fiyatı 5.967.903 TL. Bu ilan bölge ortalamasının altında, yatırım fırsatı olabilir.",
      roiEstimate: "5.50",
      images: [
        "https://imaj.emlakjet.com/resize/736/415/listing/18803881/F311852677AED26149564629D709F11518803881.jpeg",
        "https://imaj.emlakjet.com/resize/364/202/listing/18803881/DEAF553303624345F0799A606F23F98118803881.jpeg",
        "https://imaj.emlakjet.com/resize/364/202/listing/18803881/4464341193F45877E91222EEFD563D8B18803881.jpeg",
      ],
      thumbnail:
        "https://imaj.emlakjet.com/resize/736/415/listing/18803881/F311852677AED26149564629D709F11518803881.jpeg",
      metaTitle: "Hendek Beyköy Bahçeli Müstakil Ev | Demir Gayrimenkul",
      metaDescription:
        "Sakarya Hendek Beyköy'de 380 m² arsa üzerinde 3+1 müstakil ev. Bahçeli, doğa ile iç içe. 2.500.000 TL",
      isFeatured: true,
      isNew: true,
      publishedAt: new Date(),
    },
    {
      title: "Hendek Çakallık'ta 1800 m² Arsa İçinde Çiftlik Evi",
      slug: "hendek-cakallik-ciftlik-evi-1800m2",
      description: `Sakarya Hendek Çakallık Mahallesi'nde 1800 m² arsa içinde satılık çiftlik evi.

Mülk Özellikleri:
• 600 m² kapalı alan
• 1800 m² arsa
• 6+2 oda düzeni
• Geniş bahçe ve tarım alanı
• Doğa ile iç içe yaşam

Çakallık Mahallesi, Hendek'in kırsal karakterini koruyan bölgelerinden biridir. Çiftlik hayatı ve hobi bahçeciliği için ideal bir mülktür.

ACİL SATILIK - Uygun fiyat fırsatı!

Detaylı bilgi için iletişime geçiniz.`,
      type: "konut" as const,
      status: "active" as const,
      transactionType: "sale" as const,
      address: "Çakallık Mahallesi, Hendek, Sakarya",
      city: "Hendek",
      district: "Sakarya",
      neighborhood: "Çakallık Mahallesi",
      latitude: "40.7654",
      longitude: "30.0876",
      area: 600,
      price: "13250000",
      pricePerSqm: "22083",
      features: {
        rooms: "6+2",
        bathrooms: 2,
        floors: 2,
        buildingAge: 15,
        heating: "Soba",
        parking: true,
        garden: true,
        irrigation: true,
      },
      aiScore: 85,
      aiInsight:
        "Çakallık Mahallesi'nde m² fiyatı 14.766 TL. Bu mülk geniş arsa alanı ile yatırım potansiyeli yüksek. Bölge sosyo-ekonomik statüsü D seviyesinde.",
      roiEstimate: "4.20",
      images: [
        "https://imaj.emlakjet.com/resize/736/415/listing/18739762/ED40458A39392E60C19C5BB7170DC6D518739762.jpg",
        "https://imaj.emlakjet.com/resize/364/202/listing/18739762/CE27A7D88193F10405EEC6FC53311F2018739762.jpg",
        "https://imaj.emlakjet.com/resize/364/202/listing/18739762/6EFEC66ECEA6619C9214AC89E87F9B2A18739762.jpg",
      ],
      thumbnail:
        "https://imaj.emlakjet.com/resize/736/415/listing/18739762/ED40458A39392E60C19C5BB7170DC6D518739762.jpg",
      metaTitle: "Hendek Çakallık Çiftlik Evi 1800 m² | Demir Gayrimenkul",
      metaDescription:
        "Sakarya Hendek Çakallık'ta 1800 m² arsa içinde 6+2 çiftlik evi. Doğa ile iç içe yaşam. 13.250.000 TL",
      isFeatured: false,
      isNew: true,
      publishedAt: new Date(),
    },
  ];

  // İlanları ekle
  for (const listing of emlakjetListings) {
    await retry(() => db.insert(listings).values(listing));
    console.log(`✓ Eklendi: ${listing.title}`);
  }

  console.log("\n✅ Seed işlemi tamamlandı!");
  console.log(`📊 Toplam ${emlakjetListings.length} ilan eklendi.`);

  await seedClient.end();
  process.exit(0);
}

seedFromEmlakjet().catch(async (error) => {
  console.error("❌ Seed hatası:", error);
  await seedClient.end();
  process.exit(1);
});
