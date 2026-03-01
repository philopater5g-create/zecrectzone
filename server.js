import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { MongoClient } from 'mongodb';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

// --- MongoDB Connection ---
const MONGODB_URI = process.env.MONGODB_URI;

let dbClient = null;
let db = null;

async function getDb() {
  if (db) return db;
  if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set. Please add it in your Vercel project settings.');
  if (!dbClient) {
    dbClient = new MongoClient(MONGODB_URI, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000 });
    await dbClient.connect();
  }
  db = dbClient.db('cardlol');
  // Ensure indexes exist
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  await db.collection('users').createIndex({ 'profile.customLink': 1 }, { sparse: true });
  await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
  await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return db;
}

app.use(express.json());
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });
const uploadMusic = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const isProd = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// On Vercel (serverless), req.protocol may not reflect HTTPS correctly.
function isSecureRequest(req) {
  if (!isProd) return false;
  const proto = req.headers['x-forwarded-proto'];
  return proto === 'https' || (typeof proto === 'string' && proto.split(',')[0].trim() === 'https');
}

function makeCookieOptions(req) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: isSecureRequest(req),
  };
}

// --- Database Helpers ---
async function getSession(token) {
  if (!token) return null;
  const database = await getDb();
  const session = await database.collection('sessions').findOne({ token });
  if (!session) return null;
  return { username: session.username };
}

async function setSession(token, username) {
  const database = await getDb();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await database.collection('sessions').updateOne(
    { token },
    { $set: { token, username, expiresAt } },
    { upsert: true }
  );
}

async function deleteSession(token) {
  if (!token) return;
  const database = await getDb();
  await database.collection('sessions').deleteOne({ token });
}

async function getUser(username) {
  if (!username) return null;
  const database = await getDb();
  const user = await database.collection('users').findOne({ username: username.toLowerCase() });
  if (!user) return null;
  const { _id, ...rest } = user;
  return rest;
}

async function saveUser(username, userData) {
  const database = await getDb();
  const { _id, ...data } = userData;
  await database.collection('users').updateOne(
    { username: username.toLowerCase() },
    { $set: { ...data, username: username.toLowerCase() } },
    { upsert: true }
  );
}

async function userExists(username) {
  const database = await getDb();
  const count = await database.collection('users').countDocuments({ username: username.toLowerCase() });
  return count > 0;
}

const defaultProfile = {
  displayName: '', description: '', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  pfp2: '', pfpShape: 'circle', switchPfpOnHover: false, links: [],
  tiltX: 10, tiltY: 10, tiltDuration: 0.3, scaleOnHover: 1.02, glowOnHover: true,
  bgColor: '#0f0f11', bgGradient: '', bgImage: '', blurBg: false,
  pageBgUrl: '', pageBgColor: '#09090b', blurPageBg: false,
  accentColor: '#f59e0b', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 24, shadowIntensity: 0.5, fontFamily: 'DM Sans',
  previewTitle: '', previewDescription: '', previewImage: '',
  customLink: '', musicUrl: '',
};

async function findUserBySlug(slug) {
  if (!slug) return null;
  const s = slug.toLowerCase().replace(/\s/g, '');
  const database = await getDb();
  // First try direct username match
  let user = await database.collection('users').findOne({ username: s });
  if (user) { const { _id, ...rest } = user; return rest; }
  // Then try custom link
  user = await database.collection('users').findOne({ 'profile.customLink': s });
  if (user) { const { _id, ...rest } = user; return rest; }
  return null;
}

// --- Middleware ---
async function auth(req, res, next) {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const sessionData = await getSession(token);
    if (!sessionData) return res.status(401).json({ error: 'Unauthorized' });
    req.user = sessionData;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// --- Routes ---
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const lower = username.toLowerCase().replace(/\s/g, '');
    if (lower.length < 3) return res.status(400).json({ error: 'Username too short' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ chars' });
    if (await userExists(lower)) return res.status(400).json({ error: 'Username taken' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const token = randomUUID();
    const profile = { ...defaultProfile, displayName: displayName || username };

    const newUser = { username: lower, displayName: displayName || username, password: hash, profile, viewCount: 0, createdAt: Date.now() };
    await saveUser(lower, newUser);
    await setSession(token, lower);

    res.cookie('token', token, makeCookieOptions(req));
    res.json({ success: true, username: lower });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const lower = username.toLowerCase().replace(/\s/g, '');
    const user = await getUser(lower);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = randomUUID();
    await setSession(token, lower);
    res.cookie('token', token, makeCookieOptions(req));
    res.json({ success: true, username: lower });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logout', async (req, res) => {
  await deleteSession(req.cookies?.token).catch(() => { });
  res.clearCookie('token', { path: '/', sameSite: 'lax', secure: isSecureRequest(req) });
  res.json({ success: true });
});

app.get('/api/health', async (req, res) => {
  const hasMongoUri = !!MONGODB_URI;
  let dbOk = false;
  if (hasMongoUri) {
    try {
      await getDb();
      dbOk = true;
    } catch { }
  }
  res.json({
    ok: dbOk,
    dbConnected: dbOk,
    hasMongoUri,
    hint: !hasMongoUri ? 'Add MONGODB_URI to your Vercel environment variables. Get a free connection string at mongodb.com/atlas.' : (!dbOk ? 'MONGODB_URI is set but could not connect. Check the URI is correct.' : undefined)
  });
});

app.get('/api/debug-env', (req, res) => {
  res.json({
    MONGODB_URI: process.env.MONGODB_URI ? `✅ set (${process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')})` : '❌ missing',
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? '✅ set' : '❌ missing (optional, needed for image uploads)',
    NODE_ENV: process.env.NODE_ENV || '(not set)',
    VERCEL: process.env.VERCEL || '(not set)',
  });
});

app.get('/api/me', auth, async (req, res) => {
  try {
    const user = await getUser(req.user.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (typeof user.viewCount !== 'number') user.viewCount = 0;
    const { password, ...rest } = user;
    res.json(rest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Upload Handler (Local & Vercel Blob) ---
async function handleUpload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    const isMusic = req.file.fieldname === 'music';
    const ext = isMusic
      ? ((req.file.originalname || '').match(/\.(mp3|m4a|ogg|wav)$/i)?.[1] || 'mp3')
      : ((req.file.originalname || '').match(/\.(png|jpg|jpeg|gif|webp|svg|mp4)$/i)?.[1] || 'png');

    const timestamp = Date.now();
    const filename = `${req.user.username}/${req.file.fieldname}-${timestamp}.${ext}`;
    
    // Check if we're in production (Vercel)
    if (isProd) {
      // On Vercel, we MUST use Blob storage
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ 
          error: 'Upload storage not configured. Please add BLOB_READ_WRITE_TOKEN to Vercel environment variables. Go to Settings → Storage → Connect Store (Blob) in your Vercel dashboard.' 
        });
      }
      const blob = await put(filename, req.file.buffer, {
        access: 'public',
        contentType: req.file.mimetype
      });
      res.json({ url: blob.url });
    } else {
      // Local file storage for development
      const uploadDir = join(__dirname, 'uploads', req.user.username);
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      const localFilename = `${req.file.fieldname}-${timestamp}.${ext}`;
      const filePath = join(uploadDir, localFilename);
      await writeFile(filePath, req.file.buffer);
      const url = `/uploads/${req.user.username}/${localFilename}`.replace(/\\/g, '/');
      res.json({ url });
    }
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: 'Failed to upload file: ' + error.message });
  }
}

app.post('/api/upload/pfp', auth, upload.single('pfp'), handleUpload);
app.post('/api/upload/pfp2', auth, upload.single('pfp2'), handleUpload);
app.post('/api/upload/bg', auth, upload.single('bg'), handleUpload);
app.post('/api/upload/pagebg', auth, upload.single('pagebg'), handleUpload);
app.post('/api/upload/preview', auth, upload.single('preview'), handleUpload);
app.post('/api/upload/music', auth, uploadMusic.single('music'), handleUpload);

app.put('/api/profile', auth, async (req, res) => {
  try {
    const user = await getUser(req.user.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.customLink !== undefined) {
      const slug = String(req.body.customLink || '').toLowerCase().replace(/\s/g, '');
      if (slug && !/^[a-z0-9\-]{2,30}$/.test(slug)) return res.status(400).json({ error: 'Custom link: 2–30 chars, letters, numbers, hyphens only' });
      if (slug) {
        const existing = await findUserBySlug(slug);
        if (existing && existing.username !== user.username) return res.status(400).json({ error: 'Custom link already taken' });
      }
    }

    user.profile = { ...user.profile, ...req.body };
    user.displayName = user.profile.displayName || user.username;
    await saveUser(user.username, user);
    res.json({ success: true, profile: user.profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/c/:slug', async (req, res) => {
  try {
    const u = await findUserBySlug(req.params.slug);
    if (!u) return res.status(404).json({ error: 'Profile not found' });
    if (typeof u.viewCount !== 'number') u.viewCount = 0;
    res.json({ username: u.username, displayName: u.displayName, profile: u.profile, viewCount: u.viewCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/c/:slug', async (req, res) => {
  try {
    const u = await findUserBySlug(req.params.slug);
    if (u) {
      if (typeof u.viewCount !== 'number') u.viewCount = 0;
      u.viewCount++;
      await saveUser(u.username, u);
    }
    const profile = u?.profile || defaultProfile;
    const displayName = u?.displayName || req.params.slug;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const ogImage = profile.previewImage
      ? (profile.previewImage.startsWith('http') ? profile.previewImage : baseUrl + profile.previewImage)
      : (profile.pfp?.startsWith('http') ? profile.pfp : baseUrl + (profile.pfp || ''));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta property="og:title" content="${escape(profile.previewTitle || displayName + ' — Card.lol')}">
  <meta property="og:description" content="${escape(profile.previewDescription || profile.description || 'Check out my profile')}">
  <meta property="og:image" content="${escape(ogImage)}">
  <meta property="og:url" content="${baseUrl}/c/${escape(req.params.slug)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(profile.previewTitle || displayName + ' — Card.lol')}">
  <meta name="twitter:description" content="${escape(profile.previewDescription || profile.description || '')}">
  <meta name="twitter:image" content="${escape(ogImage)}">
  <title>${escape(profile.previewTitle || displayName + ' — Card.lol')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="profile-page"><div id="cardContainer"></div><p id="error" class="profile-error"></p><a href="/" class="profile-home">← card.lol</a></div>
  <script>window.__PROFILE_SLUG__ = "${escape(req.params.slug)}";</script>
  <script src="/profile.js"></script>
</body>
</html>`;
    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading profile');
  }
});

function escape(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default app;

// For local execution only
if (process.env.NODE_ENV !== 'production' || process.env.RUN_LOCAL === 'true') {
  app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}
