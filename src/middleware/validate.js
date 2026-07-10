'use strict';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value, maxLen) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
}

function isEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim()) && value.length <= 254;
}

// Alan tanımlarına göre req.body'yi doğrular; hataları tek yanıtta toplar.
// fields: { alanAdi: { maxLen, required, email } }
function validateBody(fields) {
  return (req, res, next) => {
    const body = req.body ?? {};
    const errors = {};
    const data = {};

    for (const [name, rule] of Object.entries(fields)) {
      const raw = body[name];
      if (rule.email) {
        if (raw == null || raw === '') {
          if (rule.required) errors[name] = 'E-posta adresi gerekli.';
          else data[name] = null;
        } else if (!isEmail(raw)) {
          errors[name] = 'Geçerli bir e-posta adresi girin.';
        } else {
          data[name] = raw.trim().toLowerCase();
        }
        continue;
      }
      const value = clean(raw, rule.maxLen);
      if (value == null) {
        if (rule.required) errors[name] = `Bu alan gerekli (en fazla ${rule.maxLen} karakter).`;
        else data[name] = null;
      } else {
        data[name] = value;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Form doğrulanamadı.', fields: errors });
    }
    req.validated = data;
    next();
  };
}

module.exports = { validateBody, isEmail };
