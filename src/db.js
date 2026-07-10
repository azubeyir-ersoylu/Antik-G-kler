'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'antik-gokler.db');
const SEED_PATH = path.join(DATA_DIR, 'seed-events.json');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    slug          TEXT NOT NULL UNIQUE,
    title         TEXT NOT NULL,
    category      TEXT NOT NULL CHECK (category IN ('ufo', 'ancient')),
    location      TEXT NOT NULL,
    year_display  TEXT NOT NULL,
    date_display  TEXT NOT NULL,
    sort_year     INTEGER NOT NULL,
    coordinates   TEXT,
    status        TEXT NOT NULL,
    status_type   TEXT NOT NULL CHECK (status_type IN ('red', 'yellow', 'green')),
    summary       TEXT NOT NULL,
    body          TEXT NOT NULL,
    image         TEXT NOT NULL,
    image_alt     TEXT NOT NULL,
    source        TEXT NOT NULL,
    meta_json     TEXT NOT NULL DEFAULT '[]',
    views         INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT,
    location    TEXT NOT NULL,
    sighted_at  TEXT NOT NULL,
    description TEXT NOT NULL,
    approved    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT NOT NULL,
    body       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
  CREATE INDEX IF NOT EXISTS idx_events_sort_year ON events(sort_year);
`);

function seed({ force = false } = {}) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM events').get().n;
  if (count > 0 && !force) return;

  const events = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const insert = db.prepare(`
    INSERT INTO events
      (slug, title, category, location, year_display, date_display, sort_year,
       coordinates, status, status_type, summary, body, image, image_alt, source, meta_json)
    VALUES
      (:slug, :title, :category, :location, :year_display, :date_display, :sort_year,
       :coordinates, :status, :status_type, :summary, :body, :image, :image_alt, :source, :meta_json)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title, category = excluded.category, location = excluded.location,
      year_display = excluded.year_display, date_display = excluded.date_display,
      sort_year = excluded.sort_year, coordinates = excluded.coordinates,
      status = excluded.status, status_type = excluded.status_type,
      summary = excluded.summary, body = excluded.body, image = excluded.image,
      image_alt = excluded.image_alt, source = excluded.source, meta_json = excluded.meta_json
  `);

  for (const ev of events) {
    insert.run({
      slug: ev.slug,
      title: ev.title,
      category: ev.category,
      location: ev.location,
      year_display: ev.year_display,
      date_display: ev.date_display,
      sort_year: ev.sort_year,
      coordinates: ev.coordinates ?? null,
      status: ev.status,
      status_type: ev.status_type,
      summary: ev.summary,
      body: ev.body,
      image: ev.image,
      image_alt: ev.image_alt,
      source: ev.source,
      meta_json: JSON.stringify(ev.meta ?? []),
    });
  }
}

seed({ force: process.argv.includes('--reseed') });

if (require.main === module) {
  const n = db.prepare('SELECT COUNT(*) AS n FROM events').get().n;
  console.log(`Veritabanı hazır: ${DB_PATH} (${n} olay)`);
}

module.exports = db;
