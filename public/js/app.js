/* Ana sayfa: arşiv, zaman tüneli, istatistikler, formlar */
'use strict';

const AGS = window.AGS;
const escS = AGS.esc.bind(AGS);

// ── İstatistikler ──────────────────────────────────
(async () => {
  try {
    const s = await AGS.get('/api/stats');
    const set = (key, val) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.textContent = val;
    };
    set('events', s.events);
    const years = Math.floor(s.yearsSpanned / 100) * 100;
    set('yearsSpanned', `${years.toLocaleString('tr-TR')}+`);
  } catch { /* istatistik yüklenemezse yer tutucular kalır */ }
})();

// ── Arşiv: filtre + arama + kartlar ────────────────
const grid = document.getElementById('event-grid');
const chips = document.querySelectorAll('.chip[data-filter]');
const searchInput = document.getElementById('archive-search');
let currentFilter = '';
let searchTimer = null;

async function loadEvents() {
  const q = searchInput.value.trim();
  const params = new URLSearchParams();
  if (currentFilter) params.set('category', currentFilter);
  if (q) params.set('q', q);

  grid.innerHTML = '<div class="loading">Arşiv yükleniyor…</div>';
  try {
    const data = await AGS.get(`/api/events?${params}`);
    if (data.events.length === 0) {
      grid.innerHTML = '<p class="empty-state">Bu aramayla eşleşen dosya bulunamadı.</p>';
      return;
    }
    grid.innerHTML = data.events.map((ev) => AGS.cardHTML(ev)).join('');
    window.StarChart.hydrate(grid);
  } catch {
    grid.innerHTML = '<p class="empty-state">Arşive şu an ulaşılamıyor. Lütfen sayfayı yenileyin.</p>';
  }
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    loadEvents();
  });
});

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadEvents, 280);
});

// Footer'daki kategori bağlantıları filtreyi tetikler
document.querySelectorAll('[data-filter-link]').forEach((a) => {
  a.addEventListener('click', () => {
    const target = a.dataset.filterLink;
    chips.forEach((c) => c.classList.toggle('active', c.dataset.filter === target));
    currentFilter = target;
    loadEvents();
  });
});

loadEvents();

// ── Zaman Tüneli ───────────────────────────────────
(async () => {
  const tl = document.getElementById('timeline');
  try {
    const data = await AGS.get('/api/events?sort=year');
    tl.innerHTML = data.events.map((ev) => `
      <li class="tl-item">
        <div class="tl-year">${escS(ev.year_display)}</div>
        <a href="/event.html?dosya=${encodeURIComponent(ev.slug)}">${escS(ev.title)}</a>
        <div class="tl-loc">${escS(ev.location)}</div>
      </li>`).join('');
  } catch {
    tl.innerHTML = '<li class="empty-state">Zaman tüneli yüklenemedi.</li>';
  }
})();

// ── Onaylanmış gözlemler ───────────────────────────
(async () => {
  const list = document.getElementById('report-list');
  try {
    const data = await AGS.get('/api/reports');
    if (data.reports.length === 0) return; // varsayılan boş mesajı bırak
    list.innerHTML = data.reports.map((r) => `
      <div class="report-item">
        <span class="who">${escS(r.name)} — ${escS(r.location)}</span>
        <span class="when">${escS(r.sighted_at)}</span>
        <p>${escS(r.description)}</p>
      </div>`).join('');
  } catch { /* liste yüklenemezse varsayılan mesaj kalır */ }
})();

// ── Form yardımcıları ──────────────────────────────
function wireForm(form, endpoint, buildBody) {
  const msg = form.querySelector('.form-msg') || form.parentElement.querySelector('.form-msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('invalid'));
    msg.className = 'form-msg';

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await AGS.post(endpoint, buildBody(form));
      msg.textContent = res.message || 'Gönderildi. Teşekkürler!';
      msg.classList.add('ok');
      form.reset();
    } catch (err) {
      const fields = err.data?.fields || {};
      for (const [name, text] of Object.entries(fields)) {
        const input = form.querySelector(`[name="${name}"]`);
        const field = input?.closest('.field');
        if (field) {
          field.classList.add('invalid');
          field.querySelector('.err').textContent = text;
        }
      }
      msg.textContent = err.message || 'Gönderilemedi. Lütfen tekrar deneyin.';
      msg.classList.add('fail');
    } finally {
      btn.disabled = false;
    }
  });
}

const formData = (form, names) =>
  Object.fromEntries(names.map((n) => [n, form.elements[n].value]));

wireForm(document.getElementById('report-form'), '/api/reports',
  (f) => formData(f, ['name', 'email', 'location', 'sighted_at', 'description']));

wireForm(document.getElementById('contact-form'), '/api/contact',
  (f) => formData(f, ['name', 'email', 'subject', 'body']));

wireForm(document.getElementById('newsletter-form'), '/api/newsletter',
  (f) => formData(f, ['email']));
