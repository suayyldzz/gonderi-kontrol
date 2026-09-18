# Gönderi Kontrol

Sosyal medya gönderisini paylaşmadan önce **X, Threads, Instagram ve LinkedIn** kurallarına göre kontrol eden, kampanya linkleri için **UTM parametresi** üreten küçük bir web aracı.

**Canlı demo:** https://suayyldzz.github.io/gonderi-kontrol/

![test](https://github.com/suayyldzz/gonderi-kontrol/actions/workflows/ci.yml/badge.svg)

## Ne yapar?

- **Platform limitleri:** Her platform için karakter sayısı, kalan hak ve doluluk çubuğu.
- **X'e özel sayım:** Linkler uzunluğundan bağımsız 23 karakter sayılır (t.co kısaltması).
- **Doğru karakter sayımı:** `Intl.Segmenter` ile emoji (👨‍👩‍👧) ve Türkçe karakterler tek karakter sayılır.
- **Hashtag analizi:** Türkçe karakter destekli; tekrar eden etiketleri ve Instagram'ın 30 hashtag sınırını uyarır.
- **"Devamı" uyarısı:** Instagram ve LinkedIn akışta metnin yalnızca başını gösterir; ilk cümlenin o alana sığıp sığmadığını söyler.
- **UTM link oluşturucu:** `utm_source`, `utm_medium`, `utm_campaign` ekleyerek hangi paylaşımın trafik getirdiğini analitikte ayırt etmeyi sağlar.
- Metin tarayıcıda saklanır; sayfa yenilense de kaybolmaz. Hiçbir veri sunucuya gitmez.

## Kullanılan teknolojiler

Framework'süz, bağımlılıksız: HTML, CSS, JavaScript (ES modules). Açık/koyu tema sistem ayarını izler, mobil uyumludur.

Analiz mantığı (`src/analyze.js`) DOM'dan bağımsız saf fonksiyonlardan oluşur, bu yüzden Node'un yerleşik test çalıştırıcısıyla test edilir ve her push'ta GitHub Actions üzerinde çalışır.

## Yerelde çalıştırma

```bash
git clone https://github.com/suayyldzz/gonderi-kontrol.git
cd gonderi-kontrol
npx serve .      # veya herhangi bir statik sunucu
npm test         # Node 20+
```

## Proje yapısı

```
index.html          arayüz
style.css           tema ve düzen
app.js              arayüz bağlantıları
src/analyze.js      analiz ve UTM mantığı (saf fonksiyonlar)
test/               node:test birim testleri
```

## Not

Platform limitleri yayın tarihindeki genel hesap kurallarına göredir; platformlar bu değerleri zaman zaman değiştirir. Değerler `src/analyze.js` içindeki `PLATFORMS` nesnesinden güncellenebilir.

## Lisans

MIT
