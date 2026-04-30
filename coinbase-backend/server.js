const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dns = require('dns');
const { Resolver } = require('dns');
const util = require('util');
const path = require('path');

// Use reliable public DNS servers for Atlas SRV/TXT resolution.
dns.setServers(['1.1.1.1', '8.8.8.8']);

const dnsPromises = dns.promises;

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    endpoints: [
      'POST /auth/register',
      'POST /auth/login',
      'GET /profile',
      'GET /crypto',
      'GET /crypto/gainers',
      'GET /crypto/new',
      'POST /crypto'
    ]
  });
});

const mongoUri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;

if (!mongoUri || !jwtSecret) {
  console.error('Missing required environment variables. Create a .env file with:');
  if (!mongoUri) console.error('  - MONGO_URI');
  if (!jwtSecret) console.error('  - JWT_SECRET');
  process.exit(1);
}

async function resolveSrvWithFallback(name) {
  try {
    return await dnsPromises.resolveSrv(name);
  } catch (error) {
    console.warn('Default DNS SRV lookup failed:', error.message);
    const resolver = new Resolver();
    resolver.setServers(['1.1.1.1', '8.8.8.8']);
    const resolveSrv = util.promisify(resolver.resolveSrv.bind(resolver));
    return resolveSrv(name);
  }
}

async function resolveTxtWithFallback(name) {
  try {
    return await dnsPromises.resolveTxt(name);
  } catch (error) {
    console.warn('Default DNS TXT lookup failed:', error.message);
    const resolver = new Resolver();
    resolver.setServers(['1.1.1.1', '8.8.8.8']);
    const resolveTxt = util.promisify(resolver.resolveTxt.bind(resolver));
    return resolveTxt(name);
  }
}

async function connectToMongo(uri) {
  try {
    await mongoose.connect(uri);
    console.log('DB connected');
  } catch (err) {
    const shouldFallback =
      uri.startsWith('mongodb+srv://') &&
      err.message.includes('querySrv');

    if (!shouldFallback) {
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
    }

    console.warn('MongoDB SRV lookup failed; attempting explicit host fallback...');

    try {
      const parsed = new URL(uri);
      const srvHost = parsed.hostname;
      const srvRecords = await resolveSrvWithFallback(`_mongodb._tcp.${srvHost}`);
      const txtRecords = await resolveTxtWithFallback(srvHost);

      const hosts = srvRecords.map((record) => `${record.name}:${record.port}`).join(',');
      const fallbackParams = new URLSearchParams();

      if (txtRecords.length) {
        const txtString = txtRecords.map((chunks) => chunks.join('')).join('&');
        new URLSearchParams(txtString).forEach((value, key) => {
          fallbackParams.set(key, value);
        });
      }

      parsed.searchParams.forEach((value, key) => {
        fallbackParams.set(key, value);
      });

      if (!fallbackParams.has('retryWrites')) fallbackParams.set('retryWrites', 'true');
      if (!fallbackParams.has('w')) fallbackParams.set('w', 'majority');
      if (!fallbackParams.has('tls') && !fallbackParams.has('ssl')) fallbackParams.set('tls', 'true');

      const auth = parsed.username ? `${parsed.username}:${parsed.password}@` : '';
      const pathname = parsed.pathname || '/';
      const fallbackUri = `mongodb://${auth}${hosts}${pathname}${fallbackParams.toString() ? `?${fallbackParams.toString()}` : ''}`;

      console.log('Trying fallback MongoDB URI:', fallbackUri);
      await mongoose.connect(fallbackUri);
      console.log('DB connected using explicit host fallback');
    } catch (fallbackErr) {
      console.error('MongoDB fallback connection error:', fallbackErr.message);
      process.exit(1);
    }
  }
}

connectToMongo(mongoUri);

app.use('/auth', require('./routes/authRoutes'));
app.use('/profile', require('./routes/userRoutes'));
app.use('/crypto', require('./routes/cryptoRoutes'));

app.listen(process.env.PORT || 3000, () => console.log('Server running'));