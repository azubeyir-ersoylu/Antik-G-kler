'use strict';

const { Router } = require('express');
const db = require('../db');
const rateLimit = require('../middleware/rateLimit');
const { validateBody } = require('../middleware/validate');

const router = Router();

// POST /api/newsletter — bülten aboneliği
router.post(
  '/',
  rateLimit({ windowMs: 60_000, max: 5 }),
  validateBody({ email: { email: true, required: true } }),
  (req, res) => {
    const { email } = req.validated;
    try {
      db.prepare('INSERT INTO subscribers (email) VALUES (?)').run(email);
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        return res.json({ ok: true, message: 'Bu adres zaten kayıtlı — arşiv güncellemeleri size ulaşacak.' });
      }
      throw err;
    }
    res.status(201).json({ ok: true, message: 'Aboneliğiniz alındı. Yeni dosyalar açıldığında haber vereceğiz.' });
  }
);

module.exports = router;
