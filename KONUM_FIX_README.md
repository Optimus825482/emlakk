# Konum Field Fixer - Kullanım Kılavuzu

## 📋 Genel Bakış

Bu script, `sahibinden_liste` tablosundaki eski kayıtların `konum` sütununu düzeltir.

**Problem:**

- Eski kayıtlar: `konum = "Hendek, Merkez"` (İlçe + Mahalle)
- Yeni format: `konum = "Merkez"` (Sadece Mahalle)
- `ilce` sütunu zaten var: `ilce = "Hendek"`

**Çözüm:**
Script, konum sütunundaki ilçe adını kaldırıp sadece mahalle adını bırakır.

## 🚀 Kullanım

### 1. Test Modu (Dry-Run)

Önce test modunda çalıştırın, hiçbir değişiklik yapmaz:

```bash
cd yy/demir-gayrimenkul
python fix_konum_field.py
```

Script içinde `DRY_RUN = True` olduğu için sadece hangi kayıtların değişeceğini gösterir.

**Örnek Çıktı:**

```
[DRY-RUN] ID 123: 'Hendek, Merkez' -> 'Merkez'
[DRY-RUN] ID 124: 'Akyazı, Kuzuluk' -> 'Kuzuluk'
```

### 2. Gerçek Güncelleme

Test sonuçları uygunsa, gerçek güncelleme için:

1. Script'i düzenle:

```python
DRY_RUN = False  # Bu satırı değiştir
```

2. Çalıştır:

```bash
python fix_konum_field.py
```

3. Onay ver:

```
⚠️  UYARI: Bu işlem 6000+ kayıt güncelleyecek!
Devam etmek istiyor musunuz? (evet/hayir): evet
```

## ⚙️ Özellikler

### Kademeli İşleme

- **Batch Size:** 100 kayıt/batch
- **Rate Limiting:** Her batch arası 0.1s bekleme
- **Progress Tracking:** Gerçek zamanlı ilerleme göstergesi

### Checkpoint System

- İşlem kesilirse kaldığı yerden devam eder
- `konum_fix_checkpoint.json` dosyasına kaydedilir
- Manuel olarak silebilirsiniz

### Güvenlik

- Dry-run mode (test için)
- Kullanıcı onayı gerektirir
- Transaction-based updates
- Error handling

## 📊 Örnek Çıktı

```
======================================================================
🔧 Sahibinden Liste - Konum Field Fixer
======================================================================
Batch Size: 100
Dry Run: ❌ Hayır (gerçek güncelleme)

✅ Database bağlantısı başarılı
📊 Düzeltilecek toplam kayıt: 6247

🚀 İşlem başlıyor...
----------------------------------------------------------------------
📦 Batch 1: 100 işlendi, 87 güncellendi | Progress: 1.6% | Süre: 0.45s
📦 Batch 2: 100 işlendi, 92 güncellendi | Progress: 3.2% | Süre: 0.42s
📦 Batch 3: 100 işlendi, 95 güncellendi | Progress: 4.8% | Süre: 0.43s
...
📦 Batch 63: 47 işlendi, 41 güncellendi | Progress: 100.0% | Süre: 0.21s

======================================================================
✅ İşlem Tamamlandı!
======================================================================
📊 Toplam işlenen kayıt: 6247
✏️  Güncellenen kayıt: 5834
⏱️  Toplam süre: 28.45 saniye
⚡ Ortalama hız: 219.5 kayıt/saniye

💾 Checkpoint dosyası: konum_fix_checkpoint.json
🗑️  İşlem tamamlandı, checkpoint dosyasını silebilirsiniz
======================================================================
```

## 🛑 İşlemi Durdurma

İşlem sırasında `Ctrl+C` ile durdurabilirsiniz:

```
⚠️  İşlem kullanıcı tarafından durduruldu!
📍 Checkpoint kaydedildi: 2500 kayıt işlendi
```

Tekrar çalıştırdığınızda kaldığı yerden devam eder.

## 🔧 Konfigürasyon

Script içinde değiştirebileceğiniz ayarlar:

```python
BATCH_SIZE = 100      # Her batch'te kaç kayıt işlenecek
DRY_RUN = False       # Test modu (True = test, False = gerçek)
CHECKPOINT_FILE = "konum_fix_checkpoint.json"  # Checkpoint dosyası
```

## 📝 Parse Mantığı

Script şu mantıkla çalışır:

```python
# Örnek 1
konum = "Hendek, Merkez"
ilce = "Hendek"
# Sonuç: "Merkez"

# Örnek 2
konum = "Akyazı, Kuzuluk"
ilce = "Akyazı"
# Sonuç: "Kuzuluk"

# Örnek 3 (zaten düzgün)
konum = "Merkez"
ilce = "Hendek"
# Sonuç: "Merkez" (değişmez)
```

## ⚠️ Önemli Notlar

1. **Backup:** İşlem öncesi database backup almanız önerilir
2. **Test:** Mutlaka önce `DRY_RUN = True` ile test edin
3. **Checkpoint:** İşlem tamamlandıktan sonra checkpoint dosyasını silebilirsiniz
4. **Database:** `.env` dosyasında `DATABASE_URL` olmalı

## 🐛 Sorun Giderme

### "DATABASE_URL bulunamadı" hatası

```bash
# .env dosyasını kontrol edin
cat .env | grep DATABASE_URL
```

### Checkpoint'ten devam etmek istemiyorsanız

```bash
# Checkpoint dosyasını silin
rm konum_fix_checkpoint.json
```

### İşlem çok yavaş

```python
# Batch size'ı artırın
BATCH_SIZE = 200  # veya 500
```

## 📞 Destek

Sorun yaşarsanız:

1. Önce dry-run modunda test edin
2. Hata mesajını kontrol edin
3. Checkpoint dosyasını kontrol edin
4. Database bağlantısını test edin

---

**Son Güncelleme:** 2026-01-22
**Versiyon:** 1.0.0
