/* Ortak davranışlar: menü, kaydırma animasyonu, yıldız tuvali, API yardımcıları */
'use strict';

// ── Mini API istemcisi ─────────────────────────────
window.AGS = {
  async get(path) {
    const res = await fetch(path, { headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'İstek başarısız.'), { data, status: res.status });
    return data;
  },
  async post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'İstek başarısız.'), { data, status: res.status });
    return data;
  },
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  },
  cardHTML(ev) {
    const esc = this.esc.bind(this);
    return `
      <a class="card reveal in" href="/event.html?dosya=${encodeURIComponent(ev.slug)}">
        <div class="card-media">
          <img src="${esc(ev.image)}" alt="${esc(ev.image_alt)}" loading="lazy">
          <span class="card-year">${esc(ev.year_display)}</span>
        </div>
        <div class="card-body">
          <span class="card-loc">${esc(ev.location)}</span>
          <h3>${esc(ev.title)}</h3>
          ${ev.summary ? `<p>${esc(ev.summary)}</p>` : ''}
          <div class="card-foot">
            ${ev.status ? `<span class="badge badge-${esc(ev.status_type)}">${esc(ev.status)}</span>` : '<span></span>'}
            <span class="card-more">Dosyayı Aç</span>
          </div>
        </div>
      </a>`;
  },
};

// ── Mobil menü ─────────────────────────────────────
const toggle = document.querySelector('.nav-toggle');
const menu = document.getElementById('nav-menu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Kaydırma animasyonu ────────────────────────────
const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      revealIO.unobserve(e.target);
    }
  }
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => revealIO.observe(el));

// ── Hero yıldız tuvali ─────────────────────────────
const canvas = document.querySelector('.hero-stars');
if (canvas && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const n = Math.floor((canvas.width * canvas.height) / 9000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.3 + 0.2,
      p: Math.random() * Math.PI * 2,
      s: Math.random() * 0.015 + 0.004,
    }));
  }
  resize();
  addEventListener('resize', resize);

  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const st of stars) {
      st.p += st.s;
      const a = 0.25 + Math.abs(Math.sin(st.p)) * 0.65;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240, 220, 170, ${a})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  })();
}

// ── Footer yılı ────────────────────────────────────
document.querySelectorAll('#year').forEach((el) => { el.textContent = new Date().getFullYear(); });
