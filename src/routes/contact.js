'use strict';

const { Router } = require('express');
const db = require('../db');
const rateLimit = require('../middleware/rateLimit');
const { validateBody } = require('../middleware/validate');

const router = Router();

// POST /api/contact — iletişim formu
router.post(
  '/',
  rateLimit({ windowMs: 60_000, max: 5 }),
  validateBody({
    name: { required: true, maxLen: 80 },
    email: { email: true, required: true },
    subject: { required: true, maxLen: 150 },
    body: { required: true, maxLen: 3000 },
  }),
  (req, res) => {
    const { name, email, subject, body } = req.validated;
    db.prepare(
      'INSERT INTO messages (name, email, subject, body) VALUES (?, ?, ?, ?)'
    ).run(name, email, subject, body);
    res.status(201).json({ ok: true, message: 'Mesajınız iletildi. En kısa sürede dönüş yapılacaktır.' });
  }
);

module.exports = router;
