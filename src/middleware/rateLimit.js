'use strict';

// Basit bellek-içi hız sınırlayıcı: pencere başına IP bazında istek sayar.
// Tek süreçli dağıtımlar için yeterlidir; çok süreçli ortamda paylaşımlı
// bir depo (ör. Redis) gerekir.
function rateLimit({ windowMs = 60_000, max = 30 } = {}) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({
        error: 'Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.',
      });
    }
    next();
  };
}

module.exports = rateLimit;
