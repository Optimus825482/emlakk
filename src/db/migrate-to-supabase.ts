/**
 * Lokal PostgreSQL'den Supabase'e Veri Aktarım Script'i
 *
 * Çalıştır: npx tsx src/db/migrate-to-supabase.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import * as schema from "./schema";

config({ path: ".env" });

// Lokal veritabanı bağlantısı
const LOCAL_DB_URL =
  "postgresql://postgres:518518Erkan@localhost:5432/demir_db";

// Supabase veritabanı bağlantısı (DIRECT_URL kullan - pooler değil)
const SUPABASE_DB_URL = process.env.DIRECT_URL!;

async function migrateData() {
  console.log("🚀 Veri aktarımı başlıyor...\n");

  // Lokal DB bağlantısı
  const localClient = postgres(LOCAL_DB_URL);
  const localDb = drizzle(localClient, { schema });

  // Supabase DB bağlantısı
  const supabaseClient = postgres(SUPABASE_DB_URL, { ssl: "require" });
  const supabaseDb = drizzle(supabaseClient, { schema });

  try {
    // 1. Users
    console.log("👤 Users aktarılıyor...");
    const users = await localDb.select().from(schema.users);
    if (users.length > 0) {
      for (const user of users) {
        try {
          await supabaseDb
            .insert(schema.users)
            .values(user)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ User ${user.email} zaten mevcut veya hata`);
        }
      }
      console.log(`   ✅ ${users.length} kullanıcı aktarıldı`);
    } else {
      console.log("   ℹ️ Aktarılacak kullanıcı yok");
    }

    // 2. Site Settings
    console.log("⚙️ Site Settings aktarılıyor...");
    const settings = await localDb.select().from(schema.siteSettings);
    if (settings.length > 0) {
      for (const setting of settings) {
        try {
          await supabaseDb
            .insert(schema.siteSettings)
            .values(setting)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Setting zaten mevcut`);
        }
      }
      console.log(`   ✅ ${settings.length} ayar aktarıldı`);
    }

    // 3. Content Sections
    console.log("📄 Content Sections aktarılıyor...");
    const contentSections = await localDb.select().from(schema.contentSections);
    if (contentSections.length > 0) {
      for (const section of contentSections) {
        try {
          await supabaseDb
            .insert(schema.contentSections)
            .values(section)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Section ${section.key} zaten mevcut`);
        }
      }
      console.log(`   ✅ ${contentSections.length} içerik bölümü aktarıldı`);
    }

    // 4. Homepage Sections
    console.log("🏠 Homepage Sections aktarılıyor...");
    const homepageSections = await localDb
      .select()
      .from(schema.homepageSections);
    if (homepageSections.length > 0) {
      for (const section of homepageSections) {
        try {
          await supabaseDb
            .insert(schema.homepageSections)
            .values(section)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Homepage section ${section.key} zaten mevcut`);
        }
      }
      console.log(`   ✅ ${homepageSections.length} anasayfa bölümü aktarıldı`);
    }

    // 5. Listings
    console.log("🏢 Listings aktarılıyor...");
    const listings = await localDb.select().from(schema.listings);
    if (listings.length > 0) {
      for (const listing of listings) {
        try {
          await supabaseDb
            .insert(schema.listings)
            .values(listing)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Listing ${listing.slug} zaten mevcut`);
        }
      }
      console.log(`   ✅ ${listings.length} ilan aktarıldı`);
    }

    // 6. Appointments
    console.log("📅 Appointments aktarılıyor...");
    const appointments = await localDb.select().from(schema.appointments);
    if (appointments.length > 0) {
      for (const appointment of appointments) {
        try {
          await supabaseDb
            .insert(schema.appointments)
            .values(appointment)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Appointment zaten mevcut`);
        }
      }
      console.log(`   ✅ ${appointments.length} randevu aktarıldı`);
    }

    // 7. Contacts
    console.log("📧 Contacts aktarılıyor...");
    const contacts = await localDb.select().from(schema.contacts);
    if (contacts.length > 0) {
      for (const contact of contacts) {
        try {
          await supabaseDb
            .insert(schema.contacts)
            .values(contact)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Contact zaten mevcut`);
        }
      }
      console.log(`   ✅ ${contacts.length} iletişim kaydı aktarıldı`);
    }

    // 8. Valuations
    console.log("💰 Valuations aktarılıyor...");
    const valuations = await localDb.select().from(schema.valuations);
    if (valuations.length > 0) {
      for (const valuation of valuations) {
        try {
          await supabaseDb
            .insert(schema.valuations)
            .values(valuation)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Valuation zaten mevcut`);
        }
      }
      console.log(`   ✅ ${valuations.length} değerleme aktarıldı`);
    }

    // 9. Hendek Stats
    console.log("📊 Hendek Stats aktarılıyor...");
    const hendekStats = await localDb.select().from(schema.hendekStats);
    if (hendekStats.length > 0) {
      for (const stat of hendekStats) {
        try {
          await supabaseDb
            .insert(schema.hendekStats)
            .values(stat)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Stat ${stat.key} zaten mevcut`);
        }
      }
      console.log(`   ✅ ${hendekStats.length} istatistik aktarıldı`);
    }

    // 10. Team Members
    console.log("👥 Team Members aktarılıyor...");
    const teamMembers = await localDb.select().from(schema.teamMembers);
    if (teamMembers.length > 0) {
      for (const member of teamMembers) {
        try {
          await supabaseDb
            .insert(schema.teamMembers)
            .values(member)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Team member zaten mevcut`);
        }
      }
      console.log(`   ✅ ${teamMembers.length} ekip üyesi aktarıldı`);
    }

    // 11. Founder Profile
    console.log("👔 Founder Profile aktarılıyor...");
    const founderProfile = await localDb.select().from(schema.founderProfile);
    if (founderProfile.length > 0) {
      for (const profile of founderProfile) {
        try {
          await supabaseDb
            .insert(schema.founderProfile)
            .values(profile)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Founder profile zaten mevcut`);
        }
      }
      console.log(`   ✅ ${founderProfile.length} kurucu profili aktarıldı`);
    }

    // 12. Manifesto
    console.log("📜 Manifesto aktarılıyor...");
    const manifesto = await localDb.select().from(schema.manifesto);
    if (manifesto.length > 0) {
      for (const m of manifesto) {
        try {
          await supabaseDb
            .insert(schema.manifesto)
            .values(m)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Manifesto zaten mevcut`);
        }
      }
      console.log(`   ✅ ${manifesto.length} manifesto aktarıldı`);
    }

    // 13. Vision Pillars
    console.log("🎯 Vision Pillars aktarılıyor...");
    const visionPillars = await localDb.select().from(schema.visionPillars);
    if (visionPillars.length > 0) {
      for (const pillar of visionPillars) {
        try {
          await supabaseDb
            .insert(schema.visionPillars)
            .values(pillar)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Vision pillar zaten mevcut`);
        }
      }
      console.log(`   ✅ ${visionPillars.length} vizyon sütunu aktarıldı`);
    }

    // 14. Company Principles
    console.log("💼 Company Principles aktarılıyor...");
    const companyPrinciples = await localDb
      .select()
      .from(schema.companyPrinciples);
    if (companyPrinciples.length > 0) {
      for (const principle of companyPrinciples) {
        try {
          await supabaseDb
            .insert(schema.companyPrinciples)
            .values(principle)
            .onConflictDoNothing();
        } catch (e) {
          console.log(`   ⚠️ Company principle zaten mevcut`);
        }
      }
      console.log(
        `   ✅ ${companyPrinciples.length} şirket prensibi aktarıldı`
      );
    }

    console.log("\n" + "=".repeat(50));
    console.log("✨ VERİ AKTARIMI TAMAMLANDI!");
    console.log("=".repeat(50));

    // Özet
    console.log("\n📋 ÖZET:");
    console.log(`   Users: ${users.length}`);
    console.log(`   Site Settings: ${settings.length}`);
    console.log(`   Content Sections: ${contentSections.length}`);
    console.log(`   Homepage Sections: ${homepageSections.length}`);
    console.log(`   Listings: ${listings.length}`);
    console.log(`   Appointments: ${appointments.length}`);
    console.log(`   Contacts: ${contacts.length}`);
    console.log(`   Valuations: ${valuations.length}`);
    console.log(`   Hendek Stats: ${hendekStats.length}`);
    console.log(`   Team Members: ${teamMembers.length}`);
    console.log(`   Founder Profile: ${founderProfile.length}`);
    console.log(`   Manifesto: ${manifesto.length}`);
    console.log(`   Vision Pillars: ${visionPillars.length}`);
    console.log(`   Company Principles: ${companyPrinciples.length}`);
  } catch (error) {
    console.error("\n❌ Hata oluştu:", error);
  } finally {
    await localClient.end();
    await supabaseClient.end();
  }
}

migrateData();
