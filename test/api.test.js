'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

// Testler geçici bir veritabanı kullanır; gerçek veriye dokunmaz.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ags-test-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db');
process.env.ADMIN_TOKEN = 'test-admin-token';

const app = require('../src/app');

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const get = (p, opts) => fetch(base + p, opts);
const post = (p, body, headers = {}) =>
  fetch(base + p, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

test('GET /api/health çalışıyor', async () => {
  const res = await get('/api/health');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
});

test('GET /api/events tüm olayları döndürür', async () => {
  const res = await get('/api/events');
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.count >= 12, `en az 12 olay bekleniyordu, ${data.count} geldi`);
  assert.ok(data.events[0].meta instanceof Array);
});

test('GET /api/events kategori filtresi', async () => {
  const res = await get('/api/events?category=ufo');
  const data = await res.json();
  assert.ok(data.events.every((e) => e.category === 'ufo'));
});

test('GET /api/events arama', async () => {
  const res = await get('/api/events?q=Roswell');
  const data = await res.json();
  assert.ok(data.count >= 1);
  assert.ok(data.events.some((e) => e.slug === 'roswell-1947'));
});

test('GET /api/events/:slug detay + görüntülenme sayacı', async () => {
  const first = await (await get('/api/events/gobekli-tepe')).json();
  const second = await (await get('/api/events/gobekli-tepe')).json();
  assert.equal(first.event.slug, 'gobekli-tepe');
  assert.equal(second.event.views, first.event.views + 1);
  assert.ok(Array.isArray(first.related));
});

test('GET /api/events/:slug bilinmeyen slug 404', async () => {
  const res = await get('/api/events/yok-boyle-bir-dosya');
  assert.equal(res.status, 404);
});

test('POST /api/reports geçerli bildirim kabul edilir', async () => {
  const res = await post('/api/reports', {
    name: 'Test Tanık',
    location: 'Ankara, Türkiye',
    sighted_at: '2026-07-01',
    description: 'Gökyüzünde üçgen biçimli sessiz bir cisim gördüm.',
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.ok, true);
});

test('POST /api/reports eksik alanlar 400 döner', async () => {
  const res = await post('/api/reports', { name: 'X' });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.fields.location);
  assert.ok(data.fields.description);
});

test('onaysız bildirim halka açık listede görünmez', async () => {
  const res = await get('/api/reports');
  const data = await res.json();
  assert.ok(data.reports.every((r) => r.name !== 'Test Tanık' || false), 'onaysız rapor sızdı');
  assert.equal(data.reports.length, 0);
});

test('admin onayı sonrası bildirim halka açık listeye düşer', async () => {
  const auth = { Authorization: 'Bearer test-admin-token' };
  const all = await (await get('/api/admin/reports', { headers: auth })).json();
  assert.ok(all.count >= 1);
  const id = all.reports[0].id;

  const patch = await fetch(`${base}/api/admin/reports/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ approved: true }),
  });
  assert.equal(patch.status, 200);

  const pub = await (await get('/api/reports')).json();
  assert.equal(pub.reports.length, 1);
  assert.ok(!('email' in pub.reports[0]), 'e-posta halka açık uçtan sızmamalı');
});

test('admin uçları token olmadan 401', async () => {
  const res = await get('/api/admin/reports');
  assert.equal(res.status, 401);
});

test('POST /api/newsletter abonelik + mükerrer kayıt', async () => {
  const first = await post('/api/newsletter', { email: 'test@example.com' });
  assert.equal(first.status, 201);
  const dup = await post('/api/newsletter', { email: 'test@example.com' });
  assert.equal(dup.status, 200);
});

test('POST /api/newsletter geçersiz e-posta 400', async () => {
  const res = await post('/api/newsletter', { email: 'gecersiz' });
  assert.equal(res.status, 400);
});

test('POST /api/contact geçerli mesaj kabul edilir', async () => {
  const res = await post('/api/contact', {
    name: 'Ziyaretçi',
    email: 'ziyaretci@example.com',
    subject: 'Kaynak önerisi',
    body: 'Rendlesham dosyası için ek belge önerim var.',
  });
  assert.equal(res.status, 201);
});

test('bilinmeyen API yolu JSON 404 döner', async () => {
  const res = await get('/api/olmayan-uc');
  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type'), /json/);
});

test('ana sayfa ve statik dosyalar sunuluyor', async () => {
  const home = await get('/');
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Antik Göklerin/);
  const css = await get('/css/style.css');
  assert.equal(css.status, 200);
});
