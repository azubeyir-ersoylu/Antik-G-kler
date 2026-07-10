/* Olay detay sayfası: ?dosya=<slug> parametresine göre dosyayı yükler */
'use strict';

(async () => {
  const AGS = window.AGS;
  const esc = AGS.esc.bind(AGS);
  const slug = new URLSearchParams(location.search).get('dosya');

  const show = (id, text) => {
    const el = document.getElementById(id);
    if (!el) return el;
    if (text != null) el.textContent = text;
    el.hidden = false;
    return el;
  };

  if (!slug) {
    location.replace('/404.html');
    return;
  }

  let data;
  try {
    data = await AGS.get(`/api/events/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err.status === 404) { location.replace('/404.html'); return; }
    document.getElementById('d-title').textContent = 'Dosyaya şu an ulaşılamıyor.';
    return;
  }

  const ev = data.event;
  document.title = `${ev.title} — Antik Göklerin Sırları`;

  // Hero: fotoğraf yüklenirse üzerine ince takımyıldız katmanı,
  // yüklenemezse tam yıldız haritası çizilir.
  const chart = document.getElementById('d-chart');
  const chartOpts = { seed: ev.slug, warm: ev.category === 'ancient', big: true };
  const heroImg = new Image();
  heroImg.onload = () => {
    document.querySelector('.detail-hero .bg').style.backgroundImage = `url("${ev.image}")`;
    window.StarChart.draw(chart, { ...chartOpts, overlay: true, alpha: 0.5 });
  };
  heroImg.onerror = () => window.StarChart.draw(chart, chartOpts);
  heroImg.src = ev.image;

  const status = show('d-status', ev.status);
  status.className = `badge badge-${ev.status_type}`;

  document.getElementById('d-title').textContent = ev.title;
  show('d-location', ev.location);
  show('d-date', ev.date_display);
  if (ev.coordinates) show('d-coords', ev.coordinates);
  show('d-views', `${ev.views.toLocaleString('tr-TR')} görüntülenme`);

  const body = document.getElementById('d-body');
  body.innerHTML =
    ev.body.split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join('') +
    `<p class="source">Kaynak: ${esc(ev.source)}</p>`;

  if (ev.meta.length > 0) {
    document.getElementById('d-facts-list').innerHTML = ev.meta.map((m) => `
      <div class="fact">
        <span class="ico">${esc(m.icon)}</span>
        <div><div class="val">${esc(m.val)}</div><div class="sub">${esc(m.sub)}</div></div>
      </div>`).join('');
    document.getElementById('d-facts').hidden = false;
  }

  if (data.related.length > 0) {
    const relBox = document.getElementById('d-related');
    relBox.innerHTML = data.related.map((r) => AGS.cardHTML(r)).join('');
    document.getElementById('d-related-wrap').hidden = false;
    window.StarChart.hydrate(relBox);
  }
})();
