/**
 * Supabase Storage Bucket Setup Script
 *
 * Bu script'i çalıştırmadan önce Supabase Dashboard'dan manuel olarak
 * "listings" bucket'ını oluşturmanız gerekiyor:
 *
 * 1. Supabase Dashboard > Storage > New Bucket
 * 2. Name: "listings"
 * 3. Public bucket: ✓ (işaretli)
 * 4. Create bucket
 *
 * Veya bu script'i çalıştırın: npx tsx src/db/setup-storage.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function setupStorage() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("🚀 Supabase Storage kurulumu başlıyor...\n");

  // Bucket oluştur
  const { data: bucket, error: bucketError } =
    await supabase.storage.createBucket("listings", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });

  if (bucketError) {
    if (bucketError.message.includes("already exists")) {
      console.log("✅ 'listings' bucket zaten mevcut\n");
    } else {
      console.error("❌ Bucket oluşturulamadı:", bucketError.message);
      return;
    }
  } else {
    console.log("✅ 'listings' bucket oluşturuldu\n");
  }

  // Bucket listele
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error("❌ Bucket listelenemedi:", listError.message);
    return;
  }

  console.log("📦 Mevcut bucket'lar:");
  buckets.forEach((b) => {
    console.log(`   - ${b.name} (${b.public ? "public" : "private"})`);
  });

  console.log("\n✨ Storage kurulumu tamamlandı!");
  console.log("\n📝 Not: RLS politikaları için Supabase Dashboard'u kullanın.");
}

setupStorage().catch(console.error);
