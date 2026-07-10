'use strict';

const path = require('node:path');
const express = require('express');

const db = require('./db');
const eventsRouter = require('./routes/events');
const reportsRouter = require('./routes/reports');
const contactRouter = require('./routes/contact');
const newsletterRouter = require('./routes/newsletter');
const adminRouter = require('./routes/admin');
const rateLimit = require('./middleware/rateLimit');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Güvenlik başlıkları
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "img-src 'self' https://images.unsplash.com data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "script-src 'self'",
      "connect-src 'self'",
    ].join('; '),
  });
  next();
});

app.use(express.json({ limit: '32kb' }));

// API
app.use('/api', rateLimit({ windowMs: 60_000, max: 120 }));
app.use('/api/events', eventsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/admin', adminRouter);

// GET /api/stats — site istatistikleri
app.get('/api/stats', (req, res) => {
  const events = db.prepare('SELECT COUNT(*) AS n FROM events').get().n;
  const ufo = db.prepare("SELECT COUNT(*) AS n FROM events WHERE category = 'ufo'").get().n;
  const ancient = db.prepare("SELECT COUNT(*) AS n FROM events WHERE category = 'ancient'").get().n;
  const reports = db.prepare('SELECT COUNT(*) AS n FROM reports WHERE approved = 1').get().n;
  const span = db.prepare('SELECT MIN(sort_year) AS oldest, MAX(sort_year) AS newest FROM events').get();
  const yearsSpanned = span.oldest != null ? span.newest - span.oldest : 0;
  res.json({ events, ufo, ancient, reports, yearsSpanned });
});

app.get('/api/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Statik frontend
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR, { extensions: ['html'], maxAge: '1h', index: 'index.html' }));

// Bilinmeyen API yolu → JSON 404; diğer her şey → SPA benzeri yönlendirme
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Uç nokta bulunamadı.' });
  }
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

// Merkezi hata yakalayıcı
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ error: 'Geçersiz istek gövdesi.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' });
});

module.exports = app;
