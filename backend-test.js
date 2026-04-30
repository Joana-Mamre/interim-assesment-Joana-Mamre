const fetch = global.fetch || require('node-fetch');
const base = 'http://localhost:3000';
const email = `joana+${Date.now()}@example.com`;
const password = 'mamre';
const name = 'Joana';
const cryptoData = { name: 'TestCoin', symbol: 'TST', price: 1.23, image: 'https://example.com/tst.png', change24h: 5.67 };

(async () => {
  try {
    const root = await fetch(`${base}/`);
    console.log('GET /', root.status);
    console.log(await root.text());

    const register = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    console.log('POST /auth/register', register.status);
    console.log(await register.text());

    const login = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const setCookie = login.headers.get('set-cookie');
    console.log('POST /auth/login', login.status, setCookie ? setCookie.split(';')[0] : 'no-cookie');
    console.log(await login.text());

    const headers = setCookie ? { cookie: setCookie.split(';')[0] } : {};
    const profile = await fetch(`${base}/profile`, { headers });
    console.log('GET /profile', profile.status);
    console.log(await profile.text());

    const cryptoAll = await fetch(`${base}/crypto`);
    console.log('GET /crypto', cryptoAll.status);
    console.log(await cryptoAll.text());

    const gainers = await fetch(`${base}/crypto/gainers`);
    console.log('GET /crypto/gainers', gainers.status);
    console.log(await gainers.text());

    const newListings = await fetch(`${base}/crypto/new`);
    console.log('GET /crypto/new', newListings.status);
    console.log(await newListings.text());

    const addCrypto = await fetch(`${base}/crypto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cryptoData)
    });
    console.log('POST /crypto', addCrypto.status);
    console.log(await addCrypto.text());
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
