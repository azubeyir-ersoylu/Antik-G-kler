'use strict';

const crypto = require('node:crypto');
const { Router } = require('express');
const db = require('../db');

const router = Router();

// Yönetim uçları ADMIN_TOKEN ortam değişkeniyle korunur.
// Token tanımlı değilse tüm yönetim uçları kapalıdır.
function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(503).json({ error: 'Yönetim paneli yapılandırılmamış (ADMIN_TOKEN tanımlı değil).' });
  }
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Yetkisiz erişim.' });
  }
  next();
}

router.use(requireAdmin);

// GET /api/admin/reports — tüm gözlem bildirimleri (onay bekleyenler dahil)
router.get('/reports', (req, res) => {
  const rows = db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all();
  res.json({ count: rows.length, reports: rows });
});

// PATCH /api/admin/reports/:id — bildirimi onayla / onayını kaldır
router.patch('/reports/:id', (req, res) => {
  const approved = req.body?.approved ? 1 : 0;
  const info = db.prepare('UPDATE reports SET approved = ? WHERE id = ?').run(approved, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Bildirim bulunamadı.' });
  res.json({ ok: true, approved: Boolean(approved) });
});

// DELETE /api/admin/reports/:id
router.delete('/reports/:id', (req, res) => {
  const info = db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Bildirim bulunamadı.' });
  res.json({ ok: true });
});

// GET /api/admin/messages — iletişim formu mesajları
router.get('/messages', (req, res) => {
  const rows = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
  res.json({ count: rows.length, messages: rows });
});

// GET /api/admin/subscribers — bülten aboneleri
router.get('/subscribers', (req, res) => {
  const rows = db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC').all();
  res.json({ count: rows.length, subscribers: rows });
});

module.exports = router;
