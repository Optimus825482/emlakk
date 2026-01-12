import "dotenv/config";
import { db } from "./index";
import { contentSections } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Hero founderImage'ı temizle
 * Eski Google URL'sini kaldırır, admin'den yeni resim yüklenmesini sağlar
 */
async function fixHeroImage() {
  console.log("🔧 Hero resmi düzeltiliyor...\n");

  try {
    const [heroContent] = await db
      .select()
      .from(contentSections)
      .where(eq(contentSections.key, "hero_main"))
      .limit(1);

    if (!heroContent) {
      console.log("❌ Hero kaydı bulunamadı!");
      process.exit(1);
    }

    const heroData = heroContent.data as Record<string, unknown>;
    const currentImage = heroData?.founderImage as string;

    console.log(`📷 Mevcut resim: ${currentImage?.substring(0, 60)}...`);

    if (currentImage?.includes("googleusercontent.com")) {
      // Google URL'sini temizle
      const updatedData = {
        ...heroData,
        founderImage: "", // Boş yap, admin'den yüklenecek
      };

      await db
        .update(contentSections)
        .set({
          data: updatedData,
          image: null,
          updatedAt: new Date(),
        })
        .where(eq(contentSections.key, "hero_main"));

      console.log("\n✅ Hero resmi temizlendi!");
      console.log("📝 Şimdi admin panelinden yeni resim yükleyin:");
      console.log("   http://localhost:3000/admin/icerik/hero");
    } else if (currentImage?.startsWith("/uploads/")) {
      console.log("\n✅ Hero resmi zaten doğru formatta!");
    } else {
      console.log("\n⚠️  Hero resmi boş veya bilinmeyen format");
      console.log("📝 Admin panelinden yeni resim yükleyin");
    }
  } catch (error) {
    console.error("❌ Hata:", error);
    process.exit(1);
  }

  process.exit(0);
}

fixHeroImage();
