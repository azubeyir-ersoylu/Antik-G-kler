'use strict';

const { Router } = require('express');
const db = require('../db');

const router = Router();

function toPublic(row) {
  const { meta_json, ...rest } = row;
  return { ...rest, meta: JSON.parse(meta_json) };
}

// GET /api/events?category=ufo|ancient&q=arama&sort=year|-year
router.get('/', (req, res) => {
  const { category, q, sort } = req.query;
  const where = [];
  const params = {};

  if (category === 'ufo' || category === 'ancient') {
    where.push('category = :category');
    params.category = category;
  }
  if (typeof q === 'string' && q.trim()) {
    where.push('(title LIKE :q OR location LIKE :q OR summary LIKE :q OR body LIKE :q)');
    params.q = `%${q.trim()}%`;
  }

  const order = sort === '-year' ? 'sort_year DESC' : 'sort_year ASC';
  const sql = `
    SELECT * FROM events
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${order}
  `;
  const rows = db.prepare(sql).all(params);
  res.json({ count: rows.length, events: rows.map(toPublic) });
});

// GET /api/events/:slug — detay; görüntülenme sayacını artırır
router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM events WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Olay bulunamadı.' });

  db.prepare('UPDATE events SET views = views + 1 WHERE id = ?').run(row.id);
  row.views += 1;

  const related = db
    .prepare(
      `SELECT slug, title, year_display, location, image, image_alt, category
       FROM events WHERE category = ? AND slug != ?
       ORDER BY RANDOM() LIMIT 3`
    )
    .all(row.category, row.slug);

  res.json({ event: toPublic(row), related });
});

module.exports = router;
