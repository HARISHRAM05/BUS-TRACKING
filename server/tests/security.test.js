// Security suite: helmet headers and login rate limiting.
// Runs LAST because it deliberately gets this IP rate limited.
module.exports = async ({ req, check }) => {
  // ---------- helmet ----------
  const r = await req('GET', '/health');
  check('helmet: X-Content-Type-Options nosniff', r.h.get('x-content-type-options') === 'nosniff');
  check('helmet: X-Powered-By hidden', r.h.get('x-powered-by') === null);
  check('helmet: Strict-Transport-Security set', !!r.h.get('strict-transport-security'));
  check('helmet: X-Frame-Options set', !!r.h.get('x-frame-options'));

  // ---------- rate limit: only failed logins count, the limit is AUTH_RATE_LIMIT_MAX ----------
  const max = Number(process.env.AUTH_RATE_LIMIT_MAX);
  const statuses = [];
  let blocked;
  for (let i = 0; i < max + 5; i += 1) {
    const attempt = await req('POST', '/auth/login', { email: 'admin@karunya.edu.in', password: 'Wrong@123' });
    statuses.push(attempt.s);
    if (attempt.s === 429) {
      blocked = attempt;
      break;
    }
  }
  check('repeated failed logins end in 429', !!blocked, statuses.join(','));
  check('429 uses the standard JSON error format', blocked?.j.success === false && /Too many/.test(blocked?.j.message));
  check('429 includes RateLimit headers', !!blocked?.h.get('ratelimit-limit') || !!blocked?.h.get('ratelimit'));
  check('failures before the block were normal 401/403/422/409', statuses.slice(0, -1).every((s) => [401, 403, 409, 422].includes(s)));

  // Other endpoints are not affected by the login limiter
  const health = await req('GET', '/health');
  check('rest of the API still works while login is limited', health.s === 200);
};
