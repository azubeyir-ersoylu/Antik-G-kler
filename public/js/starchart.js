/* Tohumlu üretken yıldız haritası: her dosya için slug'dan türetilen,
   tekrarlanabilir bir takımyıldız + usturlap deseni çizer.
   Fotoğraf yüklenene kadar yer tutucu, yüklenemezse kalıcı görsel olur. */
'use strict';

(function () {
  function seededRand(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 100000) / 100000;
    };
  }

  /* canvas'a çizer; opts: { seed, warm, big, alpha } */
  function draw(canvas, opts) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.offsetWidth || 320;
    const h = canvas.offsetHeight || 180;
    if (!w || !h) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const rnd = seededRand(opts.seed || 'ags');
    const alpha = opts.alpha ?? 1;
    ctx.globalAlpha = alpha;

    // zemin + kategori tonu (kadim yapılar sıcak, UFO vakaları soğuk)
    if (!opts.overlay) {
      ctx.fillStyle = '#070a16';
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * .5, h * .55, 10, w * .5, h * .55, Math.max(w, h) * .75);
      g.addColorStop(0, opts.warm ? 'rgba(201,168,76,.14)' : 'rgba(112,190,200,.10)');
      g.addColorStop(1, 'rgba(5,7,15,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // arka plan yıldızları
    const n = Math.floor((w * h) / (opts.big ? 2600 : 1900));
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = rnd() * h, r = rnd() * 1.1 + .2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.fillStyle = `rgba(235,225,195,${.15 + rnd() * .5})`;
      ctx.fill();
    }

    // takımyıldız: parlak düğümler + ince altın hat
    const pts = [];
    const k = 5 + Math.floor(rnd() * 4);
    for (let i = 0; i < k; i++) {
      pts.push({ x: w * (.12 + rnd() * .76), y: h * (.14 + rnd() * .7) });
    }
    pts.sort((a, b) => a.x - b.x);
    ctx.strokeStyle = 'rgba(201,168,76,.4)';
    ctx.lineWidth = .8;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.1, 0, 7);
      ctx.fillStyle = '#f0d080';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5.5, 0, 7);
      ctx.strokeStyle = 'rgba(240,208,128,.25)';
      ctx.lineWidth = .7;
      ctx.stroke();
    }

    // usturlap halkası + kadran çizgileri
    const cx = w * (.22 + rnd() * .56);
    const cy = h * (.3 + rnd() * .4);
    const R = Math.min(w, h) * (opts.big ? .34 : .42);
    ctx.strokeStyle = 'rgba(201,168,76,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(201,168,76,.13)';
    ctx.beginPath(); ctx.arc(cx, cy, R * .72, 0, 7); ctx.stroke();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.lineTo(cx + Math.cos(a) * (R - (i % 6 ? 4 : 9)), cy + Math.sin(a) * (R - (i % 6 ? 4 : 9)));
      ctx.strokeStyle = 'rgba(201,168,76,.3)';
      ctx.lineWidth = .8;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* Bir kapsayıcıdaki tüm kart tuvallerini çizer ve fotoğraf
     yükleme/yüklenememe durumlarını bağlar. */
  function hydrate(root) {
    (root || document).querySelectorAll('canvas[data-chart-seed]').forEach((canvas) => {
      draw(canvas, {
        seed: canvas.dataset.chartSeed,
        warm: canvas.dataset.chartWarm === '1',
        big: canvas.dataset.chartBig === '1',
      });
      const img = canvas.parentElement.querySelector('img');
      if (!img) return;
      const ok = () => img.classList.add('loaded');
      const fail = () => img.classList.add('failed');
      if (img.complete) {
        (img.naturalWidth > 0 ? ok : fail)();
      } else {
        img.addEventListener('load', ok, { once: true });
        img.addEventListener('error', fail, { once: true });
      }
    });
  }

  window.StarChart = { draw, hydrate };
})();
