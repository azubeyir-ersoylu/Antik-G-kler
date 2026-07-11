# Antik Göklerin Sırları

Tek dosyalık statik site: `index.html` (HTML + inline CSS + küçük vanilla JS).
Backend yok, build sistemi yok, veritabanı yok. Görseller Unsplash CDN'den çekiliyor.

İçerik: UFO/UAP olayları (Roswell 1947, Trindade 1958, Rendlesham 1980, Phoenix
Işıkları 1997, USS Nimitz 2004) ve kadim yapılar (Giza, Stonehenge, Nazca,
Göbekli Tepe) hakkında 10 bölümlük belgesel tarzı sayfa. Her bölüm görsel,
başlık, açıklama metni ve meta veriler (koordinat/tarih/tanık) içeriyor,
hepsi HTML içine hardcoded.

## Notlar / tercihler
- Kullanıcı Türkçe konuşuyor, yanıtlar Türkçe olmalı.
- n8n entegrasyonu üzerinde çalışılıyor (bkz. branch adı:
  claude/bana-n8n-integration-lsnp29). Olası kullanım alanları konuşuldu:
  1) İçerik üretim/güncelleme hattı: n8n workflow → yeni olay verisi topla →
     LLM ile metin üret/çevir → GitHub API ile index.html'e yeni <section>
     commit'le → deploy tetikle.
  2) Sitede form yoksa eklenip n8n Webhook node'una fetch() ile POST atılması
     (backend yazmadan form işleme — Sheet'e yazma, e-posta, Slack bildirimi).
  3) Zamanlanmış (cron) workflow ile kırık görsel linki kontrolü, GitHub Issue açma.
  4) GitHub push → n8n webhook → deploy servisini tetikleme → Slack'e rapor.
- Somut bir uygulama isteği geldiğinde yukarıdaki seçeneklerden hangisinin
  hedeflendiği netleştirilmeli (form mu, otomatik içerik hattı mı, CI/CD mi).
