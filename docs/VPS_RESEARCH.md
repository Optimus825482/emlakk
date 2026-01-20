# 🚀 Demir Gayrimenkul - VPS Araştırma & Karşılaştırma Raporu (2026)

Bu rapor, projenizdeki **Crawler/Mining** servisinin yüksek RAM ve CPU gereksinimleri (özellikle Selenium + Chrome kullanımı) göz önünde bulundurularak hazırlanmıştır.

## 📊 Genel Karşılaştırma Tablosu

| Sağlayıcı              | Paket    | vCPU | RAM  | Disk       | Aylık Fiyat (Tahmini) | Lokasyon           |
| :--------------------- | :------- | :--- | :--- | :--------- | :-------------------- | :----------------- |
| **Hetzner (Şampiyon)** | CX32     | 4    | 8 GB | 80 GB SSD  | **€10.50 ($11.50)**   | Almanya/Finlandiya |
| **Contabo (Fiyat)**    | Cloud S  | 4    | 8 GB | 50 GB NVMe | **$5.50 (185 TL)**    | Almanya/ABD        |
| **DigitalOcean**       | Standard | 2    | 4 GB | 80 GB SSD  | **$24.00 (800 TL)**   | Global             |
| **Türkiye (Cenuta)**   | VDS L    | 4    | 8 GB | 80 GB SSD  | **~750 TL**           | Türkiye            |

---

## 🔍 Detaylı Analiz

### 1. Hetzner Cloud (Önerilen)

_Geliştirici dostu, en yüksek ham performans._

- **Artıları:** Donanım kalitesi çok yüksek, ağ hızı (bandwidth) çok geniş, arayüzü çok hızlı.
- **Eksileri:** Euro bazlı fiyatlandırma (Kur dalgalanması), kimlik doğrulaması bazen katı olabiliyor.
- **Bizim İçin Not:** Crawler tıkandığında tek tıkla RAM artırma imkanı vermesi en büyük avantajı.

### 2. Contabo

_En ucuz RAM/CPU oranı._

- **Artıları:** Rakipsiz fiyat. Hetzner'in yarı fiyatına daha fazla donanım verir.
- **Eksileri:** "Overselling" nedeniyle yoğun saatlerde CPU performansı dalgalanabilir. Disk I/O hızı bazen düşüktür.
- **Bizim İçin Not:** Eğer bütçe öncelikli ise en mantıklı yedek.

### 3. Türkiye Lokasyon (Cenuta/Turhost)

_Düşük gecikme ve yerel destek._

- **Artıları:** Sahibinden/Emlakjet gibi sitelerin yurtdışı IP bloklamalarından etkilenme riski en düşük olan seçenektir.
- **Eksileri:** Donanım/Fiyat oranı yurtdışına göre daha pahalıdır.
- **Bizim İçin Not:** Eğer crawler yurtdışı IP'si yüzünden sürekli "Captcha"ya düşerse zorunlu tercih olur.

---

## 🛠️ Teknik Gereksinim Analizi (Neden 8GB RAM?)

Crawler servisimiz **Selenium + undetected-chromedriver** kullanmaktadır. Bu araçlar gerçek bir Chrome tarayıcısı açar ve her bir sayfa (tab) için ciddi kaynak tüketir:

- **Chrome Process:** ~300MB - 800MB (Sayfa başına)
- **Xvfb (Sanal Ekran):** ~100MB - 300MB
- **Node.js/Next.js Side:** ~500MB
- **Mining API (Python):** ~300MB

**Toplam İşletim Sistemi + Uygulama Yükü:**

- **Boşta:** ~1.5 GB
- **Tarama Anında (Zirve):** ~4 GB - 6 GB

> ⚠️ **Uyarı:** 2GB veya 4GB RAM'li sunucularda "Out of Memory" (Hafıza Yetersiz) hataları ve kilitlenmeler yaşanabilir. Bu yüzden **8GB RAM** en güvenli limandır.

---

## 🎯 Kiro'nun Stratejik Tavsiyesi

Benim önerim **Hetzner CX32 (x86)** paketiyle başlamaktır.

- **Neden?** €10.50 (yaklaşık 350-380 TL) gibi bir rakama 8GB RAM ve 4 gerçek çekirdekli mükemmel performans alırsınız.
- **Strateji:** Önce Hetzner ile başlarız. Eğer Sahibinden lokasyon bazlı (Türkiye dışı) çok agresif bloklama yaparsa, projeyi bir imaj ile Türkiye lokasyonlu bir VDS'e 15 dakikada taşırım.

**Sonraki Adım:**
Hangi firmadan satın alım yapmak isterseniz, bana ilettiğinizde sunucuyu **Dockerize** edilmiş şekilde kuracak olan "Deployment Workflow"u hazırlayacağım.

---

**© 2026 Demir Gayrimenkul - Production Hazırlık Ekibi**
