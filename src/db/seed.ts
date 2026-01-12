import "dotenv/config";
import { db } from "./index";
import {
  users,
  listings,
  siteSettings,
  teamMembers,
  hendekStats,
  hendekPopulationHistory,
  hendekOsbStats,
  founderProfile,
  visionPillars,
  companyPrinciples,
  manifesto,
  homepageSections,
  contentSections,
} from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // ==========================================
    // 1. Admin kullanıcı oluştur
    // ==========================================
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const [adminUser] = await db
      .insert(users)
      .values({
        name: "Mustafa Demir",
        email: "admin@demirgayrimenkul.com",
        password: hashedPassword,
        role: "admin",
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    if (adminUser) {
      console.log("✅ Admin kullanıcı oluşturuldu:");
      console.log(`   Email: admin@demirgayrimenkul.com`);
      console.log(`   Şifre: admin123`);
    } else {
      console.log("ℹ️  Admin kullanıcı zaten mevcut");
    }

    // ==========================================
    // 2. Site Ayarları
    // ==========================================
    const [settings] = await db
      .insert(siteSettings)
      .values({
        siteName: "Demir Gayrimenkul",
        siteTagline: "Hendek'in Sağlam Kararı",
        phone: "+90 264 614 54 54",
        email: "info@demirgayrimenkul.com",
        whatsapp: "+90 532 614 54 54",
        address: "Kemaliye Mah. Cumhuriyet Meydanı No:12, Hendek / Sakarya",
        socialMedia: {
          instagram: "https://instagram.com/demirgayrimenkul",
          linkedin: "https://linkedin.com/company/demirgayrimenkul",
        },
        workingHours: {
          weekdays: "09:00 - 18:00",
          saturday: "10:00 - 14:00",
          sunday: "Kapalı",
        },
        footerText: "Geleneksel dürüstlük, modern teknoloji ile buluşuyor.",
        copyrightText: "© 2026 Demir Gayrimenkul. Tüm hakları saklıdır.",
      })
      .onConflictDoNothing()
      .returning();

    if (settings) {
      console.log("✅ Site ayarları oluşturuldu");
    }

    // ==========================================
    // 3. Ekip Üyeleri
    // ==========================================
    const teamData = [
      {
        name: "Mustafa Demir",
        title: "Kurucu & Genel Müdür",
        bio: "15 yıllık gayrimenkul tecrübesiyle Hendek'in en güvenilir emlak danışmanı.",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAzpx5Psr7pRq_oIJ0myPrOzordnEQ7EZkvovjKg1zCZCKovA66G2Q-ONEXpAlBWHKUdEas6ravpkAE9KyNOYenDRiy6PspzeGlrubHQAka0ShJXWMW-v1Pm4igZzfgUP5RicoyBb-MBdGPvIBu14wlvFZnUCPkAxsRsWa18CWloNDEPuOwS3Trd8AVUbxBkzxO975B7zOljuvV1KkHTwzHefLJ_3SLRrbrQZp6E1u7Anhcv2sfcUX2e0VOyueUtPTkVnawXU-rZope",
        phone: "+90 532 614 54 54",
        email: "mustafa@demirgayrimenkul.com",
        socialMedia: {
          linkedin: "https://linkedin.com/in/mustafademir",
          instagram: "https://instagram.com/mustafademir",
        },
        isActive: true,
        sortOrder: "1",
      },
    ];

    for (const member of teamData) {
      await db.insert(teamMembers).values(member).onConflictDoNothing();
    }
    console.log("✅ Ekip üyeleri oluşturuldu");

    // ==========================================
    // 4. Örnek İlanlar
    // ==========================================
    const sampleListings = [
      // KİRALIK KONUT - 2 adet
      {
        title: "Merkezi Konumda 3+1 Kiralık Daire",
        slug: "merkezi-konumda-3-1-kiralik-daire",
        description:
          "Hendek merkezde, okullara ve hastaneye yakın, yeni tadilatlı 3+1 daire. Doğalgaz kombili, asansörlü binada.",
        type: "konut" as const,
        status: "active" as const,
        transactionType: "rent" as const,
        address: "Kemaliye Mah. Atatürk Cad. No:45",
        city: "Hendek",
        district: "Merkez",
        neighborhood: "Kemaliye",
        area: 120,
        price: "12500",
        features: {
          rooms: "3+1",
          bathrooms: 1,
          floors: 3,
          buildingAge: 5,
          heating: "Doğalgaz Kombi",
          parking: true,
          elevator: true,
        },
        images: [
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
        ],
        isFeatured: true,
        isNew: true,
      },
      {
        title: "Site İçinde 2+1 Kiralık Daire",
        slug: "site-icinde-2-1-kiralik-daire",
        description:
          "Güvenlikli site içinde, havuz ve otopark imkanlı 2+1 daire. Eşyalı olarak kiralanabilir.",
        type: "konut" as const,
        status: "active" as const,
        transactionType: "rent" as const,
        address: "Yeni Mah. Site Yolu No:12",
        city: "Hendek",
        district: "Merkez",
        neighborhood: "Yeni Mahalle",
        area: 85,
        price: "9500",
        features: {
          rooms: "2+1",
          bathrooms: 1,
          floors: 5,
          buildingAge: 3,
          heating: "Merkezi Sistem",
          parking: true,
          elevator: true,
          security: true,
          pool: true,
        },
        images: [
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        ],
        isFeatured: false,
        isNew: true,
      },

      // SATILIK KONUT - 2 adet
      {
        title: "Müstakil Bahçeli Villa",
        slug: "mustakil-bahceli-villa",
        description:
          "500 m² bahçe içinde, 4+2 müstakil villa. Havuz yapımına uygun, doğa manzaralı.",
        type: "konut" as const,
        status: "active" as const,
        transactionType: "sale" as const,
        address: "Dikmen Köyü Yolu No:8",
        city: "Hendek",
        district: "Dikmen",
        neighborhood: "Dikmen Köyü",
        area: 220,
        price: "4500000",
        features: {
          rooms: "4+2",
          bathrooms: 2,
          floors: 2,
          buildingAge: 0,
          heating: "Yerden Isıtma",
          parking: true,
          garden: true,
        },
        images: [
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        ],
        isFeatured: true,
        isNew: true,
        aiScore: 92,
        aiInsight:
          "Bölgedeki villa fiyatları son 1 yılda %25 arttı. Yatırım için ideal.",
      },
      {
        title: "Yeni Yapı 3+1 Satılık Daire",
        slug: "yeni-yapi-3-1-satilik-daire",
        description:
          "Sıfır binada, güney cepheli, açık mutfaklı modern daire. Tapu hazır, krediye uygun.",
        type: "konut" as const,
        status: "active" as const,
        transactionType: "sale" as const,
        address: "Cumhuriyet Mah. Yeni Sok. No:15",
        city: "Hendek",
        district: "Merkez",
        neighborhood: "Cumhuriyet",
        area: 135,
        price: "2850000",
        features: {
          rooms: "3+1",
          bathrooms: 2,
          floors: 4,
          buildingAge: 0,
          heating: "Doğalgaz Kombi",
          parking: true,
          elevator: true,
        },
        images: [
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
        ],
        isFeatured: false,
        isNew: true,
      },

      // KİRALIK DÜKKAN - 2 adet
      {
        title: "Ana Cadde Üzeri Kiralık Dükkan",
        slug: "ana-cadde-uzeri-kiralik-dukkan",
        description:
          "Hendek ana caddesinde, yoğun yaya trafiği olan bölgede 80 m² dükkan. Her işe uygun.",
        type: "ticari" as const,
        status: "active" as const,
        transactionType: "rent" as const,
        address: "Cumhuriyet Cad. No:78",
        city: "Hendek",
        district: "Merkez",
        neighborhood: "Merkez",
        area: 80,
        price: "25000",
        features: {
          floors: 1,
          parking: false,
        },
        images: [
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
        ],
        isFeatured: true,
        isNew: false,
      },
      {
        title: "AVM İçinde Kiralık İşyeri",
        slug: "avm-icinde-kiralik-isyeri",
        description:
          "Hendek AVM'de, hazır dekorasyonlu 45 m² dükkan. Giyim, aksesuar veya cafe için ideal.",
        type: "ticari" as const,
        status: "active" as const,
        transactionType: "rent" as const,
        address: "Hendek AVM B Blok No:12",
        city: "Hendek",
        district: "Merkez",
        neighborhood: "Merkez",
        area: 45,
        price: "18000",
        features: {
          floors: 1,
          parking: true,
          security: true,
        },
        images: [
          "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800",
        ],
        isFeatured: false,
        isNew: true,
      },

      // SATILIK DÜKKAN - 2 adet
      {
        title: "Köşe Başı Satılık Dükkan",
        slug: "kose-basi-satilik-dukkan",
        description:
          "İki cepheli köşe dükkan, 150 m². Depo + asma kat mevcut. Yatırımlık.",
        type: "ticari" as const,
        status: "active" as const,
        transactionType: "sale" as const,
        address: "İstasyon Cad. No:1",
        city: "Hendek",
        district: "Merkez",
        neighborhood: "İstasyon",
        area: 150,
        price: "3200000",
        features: {
          floors: 2,
          parking: true,
        },
        images: [
          "https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800",
        ],
        isFeatured: true,
        isNew: false,
        aiScore: 88,
        aiInsight:
          "Bölgede ticari gayrimenkul talebi artıyor. Kira getirisi yüksek.",
      },
      {
        title: "Satılık Depo + Dükkan",
        slug: "satilik-depo-dukkan",
        description:
          "Sanayi bölgesine yakın, 200 m² kapalı alan. Toptan ticaret için uygun.",
        type: "ticari" as const,
        status: "active" as const,
        transactionType: "sale" as const,
        address: "Sanayi Yolu No:45",
        city: "Hendek",
        district: "Sanayi",
        neighborhood: "OSB Girişi",
        area: 200,
        price: "2100000",
        features: {
          floors: 1,
          parking: true,
          infrastructure: true,
        },
        images: [
          "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800",
        ],
        isFeatured: false,
        isNew: true,
      },

      // BOŞ ARAZİ - 2 adet
      {
        title: "İmarlı Satılık Arsa - 500 m²",
        slug: "imarli-satilik-arsa-500",
        description:
          "Konut imarlı, altyapısı hazır arsa. 3 kat izinli, köşe parsel.",
        type: "konut" as const,
        status: "active" as const,
        transactionType: "sale" as const,
        address: "Yeni Mahalle 145 Ada 12 Parsel",
        city: "Hendek",
        district: "Merkez",
        neighborhood: "Yeni Mahalle",
        area: 500,
        price: "1750000",
        features: {
          infrastructure: true,
          roadAccess: "Asfalt yol cepheli",
        },
        images: [
          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        ],
        isFeatured: true,
        isNew: true,
        aiScore: 95,
        aiInsight:
          "Bölgede arsa fiyatları hızla artıyor. Erken yatırım avantajı.",
      },
      {
        title: "Sanayi İmarlı Arsa - 2000 m²",
        slug: "sanayi-imarli-arsa-2000",
        description:
          "OSB yakınında sanayi imarlı arsa. Fabrika veya depo yapımına uygun.",
        type: "sanayi" as const,
        status: "active" as const,
        transactionType: "sale" as const,
        address: "Organize Sanayi Bölgesi Yanı",
        city: "Hendek",
        district: "OSB",
        neighborhood: "Sanayi",
        area: 2000,
        price: "4200000",
        features: {
          infrastructure: true,
          roadAccess: "TIR yolu cepheli",
        },
        images: [
          "https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=800",
        ],
        isFeatured: true,
        isNew: false,
        aiScore: 90,
        aiInsight:
          "Hendek OSB genişliyor. Sanayi arsası değer kazanmaya devam edecek.",
      },

      // FINDIK BAHÇESİ - 2 adet
      {
        title: "Verimli Fındık Bahçesi - 8 Dönüm",
        slug: "verimli-findik-bahcesi-8-donum",
        description:
          "Tam verimde 800 adet fındık ağacı. Sulama sistemi mevcut, bakımlı.",
        type: "tarim" as const,
        status: "active" as const,
        transactionType: "sale" as const,
        address: "Çamlıca Köyü",
        city: "Hendek",
        district: "Çamlıca",
        neighborhood: "Çamlıca Köyü",
        area: 8000,
        price: "2400000",
        features: {
          treeCount: 800,
          irrigation: true,
          organic: false,
          soilType: "Killi-tınlı",
        },
        images: [
          "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800",
        ],
        isFeatured: true,
        isNew: true,
        aiScore: 87,
        aiInsight:
          "Fındık fiyatları yükselişte. Yıllık getiri potansiyeli yüksek.",
      },
      {
        title: "Organik Sertifikalı Fındık Bahçesi",
        slug: "organik-sertifikali-findik-bahcesi",
        description:
          "12 dönüm organik sertifikalı fındık bahçesi. Yol cepheli, elektrik ve su mevcut.",
        type: "tarim" as const,
        status: "active" as const,
        transactionType: "sale" as const,
        address: "Aksu Köyü Mevkii",
        city: "Hendek",
        district: "Aksu",
        neighborhood: "Aksu Köyü",
        area: 12000,
        price: "4800000",
        features: {
          treeCount: 1200,
          irrigation: true,
          organic: true,
          soilType: "Humuslu toprak",
          roadAccess: "Stabilize yol",
        },
        images: [
          "https://images.unsplash.com/photo-1595855759920-86582396756a?w=800",
        ],
        isFeatured: false,
        isNew: true,
        aiScore: 91,
        aiInsight:
          "Organik fındık primi %30 daha yüksek. Premium segment yatırımı.",
      },
    ];

    for (const listing of sampleListings) {
      await db.insert(listings).values(listing).onConflictDoNothing();
    }
    console.log(`✅ ${sampleListings.length} örnek ilan oluşturuldu`);

    // ==========================================
    // 5. Hendek İstatistikleri
    // ==========================================
    const hendekStatsData = [
      {
        key: "population",
        label: "Nüfus (2024)",
        value: "92.729",
        numericValue: 92729,
        unit: "kişi",
        description: "Yıllık %1.4 büyüme",
        icon: "groups",
        color: "terracotta",
        source: "TÜİK",
        year: 2024,
        sortOrder: 1,
      },
      {
        key: "osb_employment",
        label: "OSB İstihdam",
        value: "10.500",
        numericValue: 10500,
        unit: "kişi",
        description: "Hedef: 20.000 kişi",
        icon: "factory",
        color: "blue",
        source: "Sakarya 2. OSB",
        year: 2024,
        sortOrder: 2,
      },
      {
        key: "osb_area",
        label: "OSB Alanı",
        value: "352",
        numericValue: 352,
        unit: "Hektar",
        description: "96 sanayi parseli",
        icon: "domain",
        color: "forest",
        source: "Sakarya 2. OSB",
        year: 2024,
        sortOrder: 3,
      },
      {
        key: "university",
        label: "Üniversite",
        value: "SAÜ",
        description: "Eğitim Fakültesi & MYO",
        icon: "school",
        color: "purple",
        source: "Sakarya Üniversitesi",
        sortOrder: 4,
      },
    ];

    for (const stat of hendekStatsData) {
      await db.insert(hendekStats).values(stat).onConflictDoNothing();
    }
    console.log("✅ Hendek istatistikleri oluşturuldu");

    // ==========================================
    // 6. Hendek Nüfus Geçmişi
    // ==========================================
    const populationData = [
      {
        year: 2024,
        totalPopulation: 92729,
        malePopulation: 45462,
        femalePopulation: 47267,
        growthRate: "1.36",
      },
      {
        year: 2023,
        totalPopulation: 91486,
        malePopulation: 45204,
        femalePopulation: 46282,
        growthRate: "1.48",
      },
      {
        year: 2022,
        totalPopulation: 90153,
        malePopulation: 44277,
        femalePopulation: 45876,
        growthRate: "2.32",
      },
      {
        year: 2021,
        totalPopulation: 88105,
        malePopulation: 43660,
        femalePopulation: 44445,
        growthRate: "1.72",
      },
      {
        year: 2020,
        totalPopulation: 86612,
        malePopulation: 42909,
        femalePopulation: 43703,
        growthRate: "1.22",
      },
      {
        year: 2019,
        totalPopulation: 85570,
        malePopulation: 42237,
        femalePopulation: 43333,
        growthRate: "1.75",
      },
      {
        year: 2018,
        totalPopulation: 84099,
        malePopulation: 41378,
        femalePopulation: 42721,
        growthRate: "3.02",
      },
      {
        year: 2017,
        totalPopulation: 81635,
        malePopulation: 40598,
        femalePopulation: 41037,
        growthRate: "1.71",
      },
      {
        year: 2016,
        totalPopulation: 80264,
        malePopulation: 39958,
        femalePopulation: 40306,
        growthRate: "2.67",
      },
      {
        year: 2015,
        totalPopulation: 78179,
        malePopulation: 38953,
        femalePopulation: 39226,
        growthRate: "1.98",
      },
      {
        year: 2014,
        totalPopulation: 76664,
        malePopulation: 38021,
        femalePopulation: 38643,
        growthRate: "0.70",
      },
      {
        year: 2013,
        totalPopulation: 76134,
        malePopulation: 37956,
        femalePopulation: 38178,
        growthRate: "1.36",
      },
      {
        year: 2012,
        totalPopulation: 75113,
        malePopulation: 37459,
        femalePopulation: 37654,
        growthRate: "1.62",
      },
      {
        year: 2011,
        totalPopulation: 73918,
        malePopulation: 36955,
        femalePopulation: 36963,
        growthRate: "0.14",
      },
      {
        year: 2010,
        totalPopulation: 73815,
        malePopulation: 36828,
        femalePopulation: 36987,
        growthRate: "-0.36",
      },
      {
        year: 2009,
        totalPopulation: 74084,
        malePopulation: 36829,
        femalePopulation: 37255,
        growthRate: "-0.70",
      },
      {
        year: 2008,
        totalPopulation: 74607,
        malePopulation: 37394,
        femalePopulation: 37213,
        growthRate: "-0.38",
      },
      {
        year: 2007,
        totalPopulation: 74890,
        malePopulation: 37420,
        femalePopulation: 37470,
        growthRate: "0.00",
      },
    ];

    for (const pop of populationData) {
      await db
        .insert(hendekPopulationHistory)
        .values(pop)
        .onConflictDoNothing();
    }
    console.log("✅ Hendek nüfus geçmişi oluşturuldu");

    // ==========================================
    // 7. Hendek OSB Verileri
    // ==========================================
    await db
      .insert(hendekOsbStats)
      .values({
        year: 2024,
        totalArea: 352,
        totalParcels: 96,
        allocatedParcels: 95,
        activeCompanies: 80,
        productionParcels: 81,
        currentEmployment: 10500,
        targetEmployment: 20000,
        notes:
          "Sakarya 2. OSB - D-100 ve TEM Otoyolu arasında konumlu. Karma OSB olarak faaliyet göstermektedir.",
      })
      .onConflictDoNothing();
    console.log("✅ Hendek OSB verileri oluşturuldu");

    // ==========================================
    // 8. Kurucu Profili (Hakkımızda)
    // ==========================================
    await db
      .insert(founderProfile)
      .values({
        name: "Mustafa Demir",
        title: "Kurucu & Genel Müdür",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDuf9XScVb-SalxtegrV02UzvGbPO6LIMHeYy_BkcwZLWRVKFfrnKlweap7x-ZRNeZzXk0gcG0poug0EEWnTy93aqmbA_RKFmWXPdwSsar0IjDjtuvm741CN78biOxd2pdRMAZCxh5E48Uy0_a8eq4Ub0ACAWAlAhSrjQKJzdmSMteKOA5jzM6h885dMJRJWBi1XN-OUjyXzMhSia2Y_ifoJ3b_gndM1haU8rRD3WSzSJ9wBnc8yzgcMVuEJHlqskjrOBy21sWCGAVT",
        badgeText: "Kurucu Vizyonu",
        heroTitle: "Hendek'in Toprağından,",
        heroTitleHighlight: "Geleceğin Teknolojisine.",
        narrativeTitle: '"Amatör Ruh & Profesyonel Veri"',
        narrativeParagraph1:
          "Yılların getirdiği yerel esnaf samimiyetini, küresel dünyanın veri bilimiyle harmanlıyoruz. Hendek'in her sokağını, her ağacını bilen bir hafıza, şimdi en ileri teknolojiyle analiz ediliyor.",
        narrativeParagraph2:
          "Bizim için emlak danışmanlığı sadece mülk satışı değildir; bir ailenin geleceğini inşa etmek, bir yatırımcının hayallerini doğru zemine oturtmaktır. Geleneksel güveni, yapay zeka destekli öngörülerle birleştirerek hata payını sıfıra indirmeyi hedefliyoruz.",
        narrativeDividerText: "Neden Hendek?",
      })
      .onConflictDoNothing();
    console.log("✅ Kurucu profili oluşturuldu");

    // ==========================================
    // 9. Manifesto
    // ==========================================
    await db
      .insert(manifesto)
      .values({
        shortTitle: "Manifesto",
        shortText:
          "Teknolojiyi benimsemiyoruz; onu yerel uzmanlığımızı ölçeklendirmek için kullanıyoruz. Hendek'in toprağını biliyoruz, şimdi bu toprağa dijital geleceği getiriyoruz.",
        fullTitle: "Manifesto",
        fullText:
          "Teknolojiyi benimsemiyoruz; onu yerel uzmanlığımızı ölçeklendirmek için kullanıyoruz. Hendek'in toprağını biliyoruz, şimdi bu toprağa dijital geleceği getiriyoruz. Her veri noktası, nesiller boyu biriken tecrübenin dijital yansımasıdır. Yapay zeka bizim için bir araç, amaç değil. Amaç her zaman aynı: Müşterilerimize en doğru kararı verdirmek, yatırımlarını güvence altına almak.",
        signature: "— Mustafa Demir",
        isActive: true,
      })
      .onConflictDoNothing();
    console.log("✅ Manifesto oluşturuldu");

    // ==========================================
    // 10. Vizyon Temelleri (Pillars) - Önce temizle, sonra ekle
    // ==========================================
    // Mevcut kayıtları kontrol et
    const existingPillars = await db.select().from(visionPillars);

    if (existingPillars.length === 0) {
      const pillarsData = [
        {
          icon: "forest",
          title: "Kökler",
          description:
            "Hendek'te onlarca yıllık deneyim ve yerel ağ ile toprağın dilinden anlıyoruz. Bölgenin demografik değişimini ve potansiyelini ezbere biliyoruz.",
          sortOrder: 1,
          isActive: true,
        },
        {
          icon: "neurology",
          title: "Dijital Dönüşüm",
          description:
            "Gayrimenkul değerlemesinde yapay zeka ve veri analitiği ile hatasız öngörüler. Piyasa trendlerini anlık takip eden algoritmalarımızla riskleri minimize ediyoruz.",
          sortOrder: 2,
          isActive: true,
        },
        {
          icon: "handshake",
          title: "Sağlamlık Sözü",
          description:
            "Sadece ticaret değil, güvene dayalı etik değerler ve şeffaf süreç yönetimi. Her adımda dürüstlük, her imzada kalıcı dostluklar hedefliyoruz.",
          sortOrder: 3,
          isActive: true,
        },
      ];

      for (const pillar of pillarsData) {
        await db.insert(visionPillars).values(pillar);
      }
      console.log("✅ Vizyon temelleri oluşturuldu");
    } else {
      console.log("ℹ️  Vizyon temelleri zaten mevcut, atlanıyor");
    }

    // ==========================================
    // 11. Şirket İlkeleri (Principles) - Önce kontrol et
    // ==========================================
    const existingPrinciples = await db.select().from(companyPrinciples);

    if (existingPrinciples.length === 0) {
      const principlesData = [
        { icon: "verified", title: "Dürüstlük", sortOrder: 1, isActive: true },
        {
          icon: "query_stats",
          title: "Veri Odaklılık",
          sortOrder: 2,
          isActive: true,
        },
        {
          icon: "location_on",
          title: "Yerel Güç",
          sortOrder: 3,
          isActive: true,
        },
      ];

      for (const principle of principlesData) {
        await db.insert(companyPrinciples).values(principle);
      }
      console.log("✅ Şirket ilkeleri oluşturuldu");
    } else {
      console.log("ℹ️  Şirket ilkeleri zaten mevcut, atlanıyor");
    }

    // ==========================================
    // 12. Ana Sayfa Bölümleri (Homepage Sections)
    // ==========================================
    const homepageSectionsData = [
      {
        key: "hero",
        name: "Hero Section",
        description:
          "Ana giriş bölümü - Mustafa Demir vizyonu ve CTA butonları",
        isVisible: true,
        sortOrder: 1,
      },
      {
        key: "manifesto",
        name: "Manifesto",
        description: "Şirket manifestosu - Vizyon beyanı",
        isVisible: true,
        sortOrder: 2,
      },
      {
        key: "investment_guide",
        name: "Rakamlarla Hendek",
        description: "Hendek istatistikleri - Nüfus, OSB, Üniversite verileri",
        isVisible: true,
        sortOrder: 3,
      },
      {
        key: "featured_listings",
        name: "Öne Çıkan İlanlar",
        description: "Seçili ilanların vitrin görünümü",
        isVisible: true,
        sortOrder: 4,
      },
      {
        key: "category_listings",
        name: "Kategori İlanları",
        description: "Sanayi, Tarım, Konut kategorileri",
        isVisible: true,
        sortOrder: 5,
      },
      {
        key: "ai_valuation_cta",
        name: "AI Değerleme CTA",
        description: "Yapay zeka değerleme çağrısı",
        isVisible: true,
        sortOrder: 6,
      },
    ];

    for (const section of homepageSectionsData) {
      await db.insert(homepageSections).values(section).onConflictDoNothing();
    }
    console.log("✅ Ana sayfa bölümleri oluşturuldu");

    // ==========================================
    // 13. Hero İçeriği (Content Sections)
    // ==========================================
    await db
      .insert(contentSections)
      .values({
        key: "hero_main",
        type: "hero",
        title: "Ana Sayfa Hero",
        data: {
          badge: "Hendek'in Premium Gayrimenkulü",
          title: "Demir Gayrimenkul:",
          titleHighlight: "Akıllı",
          titleAccent: "Yatırım",
          titleEnd: "Demir Güven.",
          description:
            "Yılların getirdiği yerel esnaf samimiyetini, küresel dünyanın veri bilimiyle harmanlıyoruz. Hendek'in her sokağını, her ağacını bilen bir hafıza, şimdi en ileri teknolojiyle analiz ediliyor.",
          ctaPrimary: "Hendek'i Keşfedin",
          ctaSecondary: "Mülk Değerleme Platformu",
          founderName: "Mustafa Demir",
          founderTitle: "Gayrimenkul Danışmanı | Yatırım & Proje Geliştirme",
          founderQuote: "Bence değil, Verilere göre yatırım...",
          founderImage:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBwBxjnlD8oG91ppgfi54IxEc9XrUF8Exr8QYn-aOUdtTGYQydCpipdWrmwGhZrUIhZd6GujmF3kUKPeG_Ec_cxMM5KNEJOlqlQBV79i7Pbqol5KuMVl08CJhHCYE0g805MULvB6hAr5pZfS_rgrmLNgQ5uXrVphLP-8h-gXA7st0lSyk9iSZsFzFvPOa_hcNaVo665LUsMXGDn-qZSdTd0Y725QiyVRLK7U0irc5SmsTXsA8Vp67MSIQhv4PO0BGPAhPVgmjRVGXep",
          // Flat yapıda feature alanları (admin paneli için)
          feature1Icon: "speed",
          feature1Title: "Hızlı Satış Analizi",
          feature1Desc: "Saniyeler içinde AI destekli değerleme.",
          feature2Icon: "school",
          feature2Title: "Hendek Yatırım Rehberi",
          feature2Desc: "Uzman eğitimsel içgörüler.",
          feature3Icon: "location_city",
          feature3Title: "Yaşam Alanı Keşfet",
          feature3Desc: "Hayalinizdeki yaşam alanını bulun.",
        },
        isActive: true,
      })
      .onConflictDoNothing();
    console.log("✅ Hero içeriği oluşturuldu");

    console.log("\n🎉 Seed tamamlandı!");
    console.log("=====================================");
    console.log("Admin Girişi:");
    console.log("  Email: admin@demirgayrimenkul.com");
    console.log("  Şifre: admin123");
    console.log("=====================================");
  } catch (error) {
    console.error("❌ Seed hatası:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
