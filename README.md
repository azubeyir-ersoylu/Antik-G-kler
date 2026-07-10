# ✦ Antik Göklerin Sırları

Belgelenmiş UFO vakaları ve kadim yapılar arşivi — tam yığın (full-stack) bir belgesel web sitesi.

Roswell'den Göbekli Tepe'ye 13 vaka dosyası; tanıklar, koordinatlar ve birincil kaynaklarla.

## Özellikler

**Frontend**
- Modern, karanlık/altın temalı duyarlı (responsive) tasarım
- Canlı arama ve kategori filtreli **Gizem Arşivi** (UFO Vakaları / Kadim Yapılar)
- MÖ 9600'den 2004'e **Zaman Tüneli**
- Her vaka için ayrı **dosya detay sayfası** (künye, kaynak, ilgili dosyalar, görüntülenme sayacı)
- Topluluk **gözlem bildirme** formu ve onaylanmış gözlemler duvarı
- Bülten aboneliği ve iletişim formu
- Animasyonlu yıldız tuvali, kaydırma animasyonları, mobil menü, `prefers-reduced-motion` desteği
- Her dosyaya özel **üretken yıldız haritası** (`public/js/starchart.js`): fotoğraf yüklenene kadar
  yer tutucu olarak görünür, fotoğraf hiç yüklenemezse kalıcı görsel olur; detay sayfasında
  fotoğrafın üzerine ince bir takımyıldız katmanı çizilir

**Backend (Express 5 + SQLite)**
- REST API — olaylar, gözlem bildirimleri, iletişim, bülten, istatistikler
- Node'un yerleşik `node:sqlite` modülü — harici veritabanı gerekmez
- Sunucu tarafı form doğrulama, IP bazlı hız sınırlama (rate limiting)
- Güvenlik başlıkları (CSP, X-Frame-Options, nosniff…)
- Token korumalı yönetim uçları (bildirim onaylama/silme, mesaj ve abone listeleri)

## Kurulum

```bash
npm install
npm start          # http://localhost:3000
```

Geliştirme modu (dosya değişince yeniden başlar):

```bash
npm run dev
```

Veritabanı ilk çalıştırmada `data/antik-gokler.db` olarak otomatik oluşturulur ve
`data/seed-events.json` içeriğiyle doldurulur. Seed verisini güncelledikten sonra:

```bash
npm run seed
```

## Testler

```bash
npm test
```

Testler geçici bir veritabanıyla çalışır; gerçek veriye dokunmaz.

## API

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/events` | Tüm dosyalar. `?category=ufo\|ancient`, `?q=arama`, `?sort=year\|-year` |
| GET | `/api/events/:slug` | Dosya detayı + ilgili dosyalar (görüntülenmeyi artırır) |
| GET | `/api/reports` | Onaylanmış gözlem bildirimleri |
| POST | `/api/reports` | Yeni gözlem bildirimi (onay bekler) |
| POST | `/api/contact` | İletişim mesajı |
| POST | `/api/newsletter` | Bülten aboneliği |
| GET | `/api/stats` | Arşiv istatistikleri |
| GET | `/api/health` | Sağlık kontrolü |

### Yönetim uçları

`ADMIN_TOKEN` ortam değişkeni tanımlanınca aktifleşir; `Authorization: Bearer <token>` başlığı gerekir.

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/admin/reports` | Tüm bildirimler (onaysızlar dahil) |
| PATCH | `/api/admin/reports/:id` | `{"approved": true}` ile onayla |
| DELETE | `/api/admin/reports/:id` | Bildirimi sil |
| GET | `/api/admin/messages` | İletişim mesajları |
| GET | `/api/admin/subscribers` | Bülten aboneleri |

## Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `PORT` | `3000` | Sunucu portu |
| `HOST` | `0.0.0.0` | Dinlenecek adres |
| `DB_PATH` | `data/antik-gokler.db` | SQLite dosya yolu |
| `ADMIN_TOKEN` | — | Yönetim uçlarını açan gizli token |

## Proje Yapısı

```
├── server.js              # Giriş noktası
├── src/
│   ├── app.js             # Express uygulaması, güvenlik, statik sunum
│   ├── db.js              # SQLite şema + seed
│   ├── middleware/        # rateLimit, validate
│   └── routes/            # events, reports, contact, newsletter, admin
├── data/seed-events.json  # Vaka dosyaları (seed verisi)
├── public/                # Frontend (HTML/CSS/JS)
└── test/api.test.js       # API testleri (node --test)
```

---

*Bu site belgesel amaçlarla hazırlanmıştır. Fotoğraflar: [Unsplash](https://unsplash.com)*
