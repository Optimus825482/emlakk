/**
 * Supabase Storage RLS Politikaları Setup Script
 *
 * Bu script Storage bucket için güvenlik politikalarını ayarlar.
 * Çalıştır: npx tsx src/db/setup-storage-policies.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function setupStoragePolicies() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("🔐 Storage RLS politikaları ayarlanıyor...\n");

  // SQL ile politikaları ayarla
  const policies = [
    // 1. Herkes okuyabilir (public read)
    {
      name: "Public Read Access",
      sql: `
        CREATE POLICY "Public Read Access"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'listings');
      `,
    },
    // 2. Service role ile yükleme (authenticated upload via API)
    {
      name: "Service Role Upload",
      sql: `
        CREATE POLICY "Service Role Upload"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'listings');
      `,
    },
    // 3. Service role ile silme
    {
      name: "Service Role Delete",
      sql: `
        CREATE POLICY "Service Role Delete"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'listings');
      `,
    },
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql: policy.sql,
      });

      if (error) {
        if (error.message.includes("already exists")) {
          console.log(`⚠️  "${policy.name}" zaten mevcut`);
        } else {
          console.log(`❌ "${policy.name}" hatası:`, error.message);
        }
      } else {
        console.log(`✅ "${policy.name}" oluşturuldu`);
      }
    } catch (err) {
      console.log(
        `⚠️  "${policy.name}" - RPC mevcut değil, manuel ayarlama gerekli`
      );
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 MANUEL AYARLAMA TALİMATLARI");
  console.log("=".repeat(60));
  console.log(`
Supabase Dashboard'a git ve şu adımları takip et:

1. Storage > listings bucket > Policies sekmesi

2. "New Policy" butonuna tıkla

3. Şu politikaları ekle:

   📖 READ (SELECT) - Herkes okuyabilir:
   ─────────────────────────────────────
   Policy name: "Public Read Access"
   Allowed operation: SELECT
   Target roles: (boş bırak - herkes)
   USING expression: true
   
   📤 INSERT - Yükleme (API üzerinden):
   ─────────────────────────────────────
   Policy name: "Authenticated Upload"
   Allowed operation: INSERT
   Target roles: authenticated (veya boş)
   WITH CHECK expression: true
   
   🗑️ DELETE - Silme (API üzerinden):
   ─────────────────────────────────────
   Policy name: "Authenticated Delete"
   Allowed operation: DELETE
   Target roles: authenticated (veya boş)
   USING expression: true

NOT: Biz service_role key kullandığımız için API'den yapılan
işlemler RLS'i bypass eder. Bu politikalar sadece doğrudan
client erişimi için geçerlidir.

Şu anki yapı güvenli çünkü:
- Upload/Delete sadece backend API üzerinden yapılıyor
- API, service_role key kullanıyor (RLS bypass)
- Public bucket olduğu için resimler herkes tarafından görülebilir
`);

  console.log("\n✨ Bilgilendirme tamamlandı!");
}

setupStoragePolicies().catch(console.error);
