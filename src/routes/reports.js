'use strict';

const { Router } = require('express');
const db = require('../db');
const rateLimit = require('../middleware/rateLimit');
const { validateBody } = require('../middleware/validate');

const router = Router();

// GET /api/reports — yalnızca onaylanmış gözlem bildirimleri (topluluk duvarı)
router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, name, location, sighted_at, description, created_at
       FROM reports WHERE approved = 1
       ORDER BY created_at DESC LIMIT 50`
    )
    .all();
  res.json({ count: rows.length, reports: rows });
});

// POST /api/reports — yeni gözlem bildirimi (onay bekler)
router.post(
  '/',
  rateLimit({ windowMs: 60_000, max: 5 }),
  validateBody({
    name: { required: true, maxLen: 80 },
    email: { email: true, required: false },
    location: { required: true, maxLen: 120 },
    sighted_at: { required: true, maxLen: 40 },
    description: { required: true, maxLen: 2000 },
  }),
  (req, res) => {
    const { name, email, location, sighted_at, description } = req.validated;
    const info = db
      .prepare(
        `INSERT INTO reports (name, email, location, sighted_at, description)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(name, email, location, sighted_at, description);
    res.status(201).json({
      ok: true,
      id: Number(info.lastInsertRowid),
      message: 'Gözlem bildiriminiz alındı. Editör onayından sonra arşivde yayımlanacaktır.',
    });
  }
);

module.exports = router;
