# Crawler Hata Düzeltme Logu

## 19 Ocak 2026 - 08:50

### Sorun

```
{"success": false, "error": "Crawler hatası: {\"detail\":\"name 'args' is not defined\"}"}
```

### Kök Neden

`sahibinden_uc_batch_supabase.py` dosyasında **iki tane** `if __name__ == "__main__":` bloğu vardı:

1. **İlk blok (551. satır)**: Basit `main()` fonksiyonu - argparse yapıyor ama crawler'ı `run()` metodu ile çağırıyor
2. **İkinci blok (567. satır)**: Detaylı argparse + JSON output - API için tasarlanmış

İlk blok çalışıyordu ama `run()` metodu yok, bu yüzden hata veriyordu.

### Çözüm

İlk `main()` fonksiyonunu ve ilk `if __name__ == "__main__":` bloğunu kaldırdım.
Sadece ikinci (detaylı) blok kaldı - bu API için doğru çalışıyor.

### Değişiklikler

- ❌ Kaldırıldı: `def main()` fonksiyonu (551-559. satırlar)
- ❌ Kaldırıldı: İlk `if __name__ == "__main__":` bloğu (562-563. satırlar)
- ✅ Kaldı: İkinci `if __name__ == "__main__":` bloğu (detaylı argparse + JSON output)

### Sonraki Adımlar

1. Uvicorn'u yeniden başlat:

   ```bash
   # Ctrl+C ile durdur, sonra:
   uvicorn crawler_api:app --host 0.0.0.0 --port 8000 --reload
   ```

2. Admin panelden test et:
   - http://localhost:3000/admin/veri-toplama
   - "Taramayı Başlat" butonuna tıkla
   - Job durumunu izle

3. Beklenen davranış:
   - Crawler başlayacak
   - Cloudflare bypass için ilk çalıştırmada manuel geçiş gerekebilir
   - Supabase'e `collected_listings` tablosuna veri yazacak
   - JSON output dönecek: `{"success": true, "total_listings": X, ...}`

### Notlar

- Mock crawler devre dışı bırakıldı
- Gerçek crawler (`sahibinden_uc_batch_supabase.py`) aktif
- Rate limiter çalışıyor (adaptive delays)
- Cloudflare bypass için undetected-chromedriver kullanılıyor

---

## 19 Ocak 2026 - 09:15

### Sorun

Crawler ardışık 2 sayfada yeni ilan bulamazsa duruyordu. Kullanıcı tüm sayfaların taranmasını istedi.

### Kök Neden

`sahibinden_uc_batch_supabase.py` dosyasında 564-571. satırlar arasında `consecutive_no_new >= 2` kontrolü vardı:

```python
if new_count == 0:
    consecutive_no_new += 1
    if consecutive_no_new >= 2:
        logger.info(f"⚠️ Ardışık {consecutive_no_new} sayfada yeni ilan yok")
        self._add_log("warning", f"⚠️ Ardışık {consecutive_no_new} sayfada yeni ilan yok, kategori atlanıyor")
        break  # ❌ Burada duruyordu
else:
    consecutive_no_new = 0
```

### Çözüm

`break` komutunu ve uyarı mesajlarını kaldırdım. Artık sadece bilgilendirme amaçlı log yazıyor:

```python
if new_count == 0:
    consecutive_no_new += 1
    logger.info(f"ℹ️ Bu sayfada yeni ilan yok (ardışık: {consecutive_no_new})")
else:
    consecutive_no_new = 0
```

### Etki

- ✅ Crawler artık tüm `max_pages` sayısı kadar sayfayı tarayacak
- ✅ Yeni ilan olup olmadığına bakmaksızın devam edecek
- ✅ Daha kapsamlı veri toplama sağlanacak
- ℹ️ Ardışık yeni ilan olmayan sayfa sayısı hala loglanıyor (bilgilendirme amaçlı)

### Test

Mining API'yi yeniden başlat ve test et:

```bash
# Ctrl+C ile durdur, sonra:
cd yy/demir-gayrimenkul/crwal4ai
uvicorn mining_api:app --host 0.0.0.0 --port 8765 --reload
```

Admin panelden test:

- http://localhost:3000/admin/veri-toplama
- "Taramayı Başlat" butonuna tıkla
- Tüm sayfaların tarandığını gözlemle

---

## 🎯 FIX #8: Headless Mode Sorunu (19.01.2026)

### Sorun

Undetected-chromedriver headless mode'da Chrome'a bağlanamıyor:

```
❌ session not created: cannot connect to chrome at 127.0.0.1:xxxxx
from chrome not reachable
```

### Kök Neden

Undetected-chromedriver'ın bilinen bir bug'ı. Headless mode'da ChromeDriver patching sonrası Chrome process'ine bağlanamıyor.

### Çözüm

**Headless mode kullanma!** Chrome penceresini açık tut (headful mode).

```python
# ❌ YANLIŞ
options.add_argument("--headless=new")

# ✅ DOĞRU
# Headless argument ekleme!
```

### Ek Adımlar

1. Chrome profile temizle: `uc_chrome_profile` klasörünü sil
2. ChromeDriver cache temizle: `%APPDATA%\undetected_chromedriver` sil
3. Chrome processleri kapat: `Get-Process chrome,chromedriver | Stop-Process -Force`

### Sonuç

✅ Crawler başarıyla çalışıyor (headful mode)
✅ Cloudflare bypass başarılı
✅ Real-time monitoring çalışıyor

### Dosyalar

- `crwal4ai/sahibinden_uc_batch_supabase.py` - Headless mode kaldırıldı
- `docs/CLOUDFLARE_BYPASS.md` - Dokümantasyon güncellendi

---

## 2026-01-19 - Real-time Logs & Boş Sayfa İyileştirmesi

**Sorun:**

- Real-time logs admin panelde görünmüyordu
- Boş sayfa kontrolü stats güncellemiyordu

**Çözüm:**

1. **Frontend logs görünürlüğü:**
   - Logs yoksa "Henüz log yok..." mesajı gösteriliyor
   - Logs ters çevrildi (en yeni üstte)
   - Log sayısı gösteriliyor
   - `activeJob.logs && activeJob.logs.length > 0` kontrolü iyileştirildi

2. **Boş sayfa kontrolü iyileştirildi:**
   - Boş sayfa geldiğinde kategori tamamlanıyor
   - Az ilan (< 10) geldiğinde son sayfa olarak işaretleniyor
   - Son sayfada stats güncelleniyor
   - Progress bar "Son sayfa - Tamamlandı" mesajı gösteriyor

**Dosyalar:**

- `src/app/admin/veri-toplama/page.tsx` - Logs UI iyileştirildi
- `crwal4ai/sahibinden_uc_batch_supabase.py` - Boş sayfa kontrolü iyileştirildi

---

## 2026-01-19 - Bina Kategorisi Tek Yapıldı

**Değişiklik:**

- Bina kategorisi artık satılık/kiralık ayrımı olmadan tek kategori
- URL: https://www.sahibinden.com/bina/sakarya-hendek
- Hem satılık hem kiralık binaları içerir

**Güncellenen Dosyalar:**

1. `crwal4ai/sahibinden_uc_batch_supabase.py`
   - `bina_satilik` → `bina` olarak değiştirildi
   - Transaction: "satilik" (default, ama hem satılık hem kiralık içerir)

2. `src/app/admin/veri-toplama/page.tsx`
   - Dropdown: "Bina - Satılık" → "Bina (Tümü)"

3. `src/app/api/crawler/stats/route.ts`
   - Bina kategorisi eklendi
   - Transaction filtresi bina için null (tüm ilanlar)

4. `crwal4ai/mining_api.py`
   - Stats endpoint'ine bina kategorisi eklendi
   - `by_category` içinde "bina" alanı eklendi

**Kategori Listesi (Güncel):**

- konut_satilik
- konut_kiralik
- isyeri_satilik
- isyeri_kiralik
- arsa_satilik
- **bina** (yeni - tek kategori)

---

## 2026-01-19 - Chrome Kapatma Sorunu Düzeltildi

**Sorun:**

- Crawler bitince Chrome penceresi açık kalıyordu
- `close_browser()` çağrılıyordu ama Chrome kapanmıyordu

**Kök Neden:**

- `__main__` bloğundaki `finally` bloğu exception durumunda çalışıyordu
- Normal bitişte `finally` bloğu çalışmıyordu (nested try-except yapısı)

**Çözüm:**

1. **İç finally bloğu iyileştirildi:**
   - Exception yakalanıyor ve re-raise ediliyor
   - Finally bloğu her durumda çalışıyor
   - Log mesajları eklendi: "🔒 Chrome kapatılıyor..." ve "✅ Chrome kapatıldı"

2. **`close_browser()` metodu güçlendirildi:**
   - Önce `driver.quit()` deneniyor
   - Hata olursa `driver.close()` deneniyor (force kill)
   - Her durumda `self.driver = None` yapılıyor
   - Log mesajları eklendi

**Dosyalar:**

- `crwal4ai/sahibinden_uc_batch_supabase.py` - Chrome kapatma iyileştirildi

**Test:**

- Crawler'ı çalıştır ve bitişini bekle
- Chrome penceresinin otomatik kapandığını doğrula
- Log'larda "✅ Chrome kapatıldı" mesajını gör
