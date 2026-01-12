import "dotenv/config";
import { db } from "./index";
import { visionPillars, companyPrinciples, contentSections } from "./schema";
import { eq, sql } from "drizzle-orm";

/**
 * Veritabanı Temizleme Script'i
 * - Duplicate pillars ve principles kayıtlarını temizler
 * - Hero içeriğindeki eski Google URL'sini temizler
 */
async function cleanup() {
  console.log("🧹 Veritabanı temizliği başlıyor...\n");

  try {
    // ==========================================
    // 1. Duplicate Vision Pillars Temizliği
    // ==========================================
    console.log("📋 Vision Pillars kontrol ediliyor...");

    const allPillars = await db.select().from(visionPillars);
    console.log(`   Toplam kayıt: ${allPillars.length}`);

    if (allPillars.length > 3) {
      // Title'a göre grupla, her gruptan sadece ilkini tut
      const uniqueTitles = new Map<string, string>();
      const idsToDelete: string[] = [];

      for (const pillar of allPillars) {
        if (uniqueTitles.has(pillar.title)) {
          idsToDelete.push(pillar.id);
        } else {
          uniqueTitles.set(pillar.title, pillar.id);
        }
      }

      if (idsToDelete.length > 0) {
        for (const id of idsToDelete) {
          await db.delete(visionPillars).where(eq(visionPillars.id, id));
        }
        console.log(`   ✅ ${idsToDelete.length} duplicate pillar silindi`);
      }
    } else {
      console.log("   ✅ Duplicate yok");
    }

    // ==========================================
    // 2. Duplicate Company Principles Temizliği
    // ==========================================
    console.log("\n📋 Company Principles kontrol ediliyor...");

    const allPrinciples = await db.select().from(companyPrinciples);
    console.log(`   Toplam kayıt: ${allPrinciples.length}`);

    if (allPrinciples.length > 3) {
      const uniqueTitles = new Map<string, string>();
      const idsToDelete: string[] = [];

      for (const principle of allPrinciples) {
        if (uniqueTitles.has(principle.title)) {
          idsToDelete.push(principle.id);
        } else {
          uniqueTitles.set(principle.title, principle.id);
        }
      }

      if (idsToDelete.length > 0) {
        for (const id of idsToDelete) {
          await db
            .delete(companyPrinciples)
            .where(eq(companyPrinciples.id, id));
        }
        console.log(`   ✅ ${idsToDelete.length} duplicate principle silindi`);
      }
    } else {
      console.log("   ✅ Duplicate yok");
    }

    // ==========================================
    // 3. Hero founderImage Kontrolü
    // ==========================================
    console.log("\n📋 Hero içeriği kontrol ediliyor...");

    const [heroContent] = await db
      .select()
      .from(contentSections)
      .where(eq(contentSections.key, "hero_main"))
      .limit(1);

    if (heroContent) {
      const heroData = heroContent.data as Record<string, unknown>;
      const currentImage = heroData?.founderImage as string;

      if (currentImage?.includes("googleusercontent.com")) {
        console.log("   ⚠️  Hero'da eski Google URL'si tespit edildi");
        console.log(
          "   📝 Admin panelinden yeni resim yükleyin: /admin/icerik/hero"
        );
      } else if (currentImage?.startsWith("/uploads/")) {
        console.log(`   ✅ Hero resmi doğru: ${currentImage}`);
      } else if (!currentImage) {
        console.log("   ⚠️  Hero resmi boş - Admin panelinden yükleyin");
      } else {
        console.log(`   ℹ️  Hero resmi: ${currentImage}`);
      }
    } else {
      console.log("   ⚠️  Hero kaydı bulunamadı - Seed çalıştırın");
    }

    // ==========================================
    // 4. Sonuç Özeti
    // ==========================================
    console.log("\n" + "=".repeat(50));
    console.log("🎉 Temizlik tamamlandı!");
    console.log("=".repeat(50));

    // Güncel sayıları göster
    const finalPillars = await db.select().from(visionPillars);
    const finalPrinciples = await db.select().from(companyPrinciples);

    console.log(`\n📊 Güncel Durum:`);
    console.log(`   Vision Pillars: ${finalPillars.length} kayıt`);
    console.log(`   Company Principles: ${finalPrinciples.length} kayıt`);
  } catch (error) {
    console.error("❌ Temizlik hatası:", error);
    process.exit(1);
  }

  process.exit(0);
}

cleanup();
