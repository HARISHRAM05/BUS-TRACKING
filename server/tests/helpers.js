// Small helpers shared by the API test suites (no test framework needed - plain Node)

// HTTP client bound to the test server: req(method, path, body, token) -> { s: status, j: json, h: headers }
const createClient = (base) => {
  const req = async (method, path, body, token) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { s: res.status, j: await res.json().catch(() => ({})), h: res.headers };
  };

  const login = async (email, password) => (await req('POST', '/auth/login', { email, password })).j.data.token;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  return { req, login, sleep };
};

// Counts passed/failed checks and prints one line per check
const createChecker = () => {
  const result = { pass: 0, fail: 0 };
  const check = (name, condition, details = '') => {
    if (condition) {
      result.pass += 1;
      console.log(`  ok    ${name}`);
    } else {
      result.fail += 1;
      console.log(`  FAIL  ${name} ${details}`);
    }
  };
  return { check, result };
};

module.exports = { createClient, createChecker };
