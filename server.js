import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { Redis } from '@upstash/redis';
import { put } from '@vercel/blob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

// Initialize Redis directly, supporting both Upstash and Vercel KV environment variables
const kvUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const kvToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

let kv;
if (kvUrl && kvToken) {
  kv = new Redis({ url: kvUrl, token: kvToken });
} else {
  console.warn("WARNING: Redis environment variables are missing. Database calls will fail.");
  // Create a dummy proxy so the app doesn't immediately crash on boot
  kv = new Proxy({}, { get: () => async () => null });
}

app.use(express.json());
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));

// Configure Multer to hold files in memory (RAM) instead of writing to disk
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });
const uploadMusic = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// --- Vercel KV Database Helpers ---
async function getSession(token) {
  if (!token) return null;
  const data = await kv.get(`session:${token}`);
  return typeof data === 'string' ? JSON.parse(data) : data;
}
async function setSession(token, username) {
  await kv.set(`session:${token}`, JSON.stringify({ username }), { ex: 7 * 24 * 60 * 60 });
}
async function deleteSession(token) {
  if (!token) return;
  await kv.del(`session:${token}`);
}

async function getUser(username) {
  const data = await kv.get(`user:${username}`);
  return typeof data === 'string' ? JSON.parse(data) : data;
}
async function saveUser(username, userData) {
  await kv.set(`user:${username}`, JSON.stringify(userData));
  if (userData.profile?.customLink) {
    const slug = userData.profile.customLink.toLowerCase().replace(/\s/g, '');
    await kv.set(`slug:${slug}`, username);
  }
}
async function userExists(username) {
  const exists = await kv.exists(`user:${username}`);
  return exists === 1 || exists === true;
}

const defaultProfile = {
  displayName: '', description: '', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  pfp2: '', pfpShape: 'circle', switchPfpOnHover: false, links: [],
  tiltX: 10, tiltY: 10, tiltDuration: 0.3, scaleOnHover: 1.02, glowOnHover: true,
  bgColor: '#0f0f11', bgGradient: '', bgImage: '', blurBg: false,
  accentColor: '#f59e0b', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 24, shadowIntensity: 0.5, fontFamily: 'DM Sans',
  previewTitle: '', previewDescription: '', previewImage: '',
  customLink: '', musicUrl: '',
};

async function findUserBySlug(slug) {
  const s = (slug || '').toLowerCase().replace(/\s/g, '');
  let user = await getUser(s);
  if (user) return user;

  const usernameFromSlug = await kv.get(`slug:${s}`);
  if (usernameFromSlug) return await getUser(usernameFromSlug);
  return null;
}

// --- Middleware ---
async function auth(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const sessionData = await getSession(token);
  if (!sessionData) return res.status(401).json({ error: 'Unauthorized' });
  req.user = sessionData;
  next();
}

// --- Routes ---
app.post('/api/signup', async (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const lower = username.toLowerCase().replace(/\s/g, '');
  if (await userExists(lower)) return res.status(400).json({ error: 'Username taken' });
  if (lower.length < 3) return res.status(400).json({ error: 'Username too short' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ chars' });

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const token = randomUUID();
  const profile = { ...defaultProfile, displayName: displayName || username };

  const newUser = { username: lower, displayName: displayName || username, password: hash, profile, viewCount: 0, createdAt: Date.now() };
  await saveUser(lower, newUser);
  await setSession(token, lower);

  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ success: true, username: lower });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const lower = username.toLowerCase().replace(/\s/g, '');
  const user = await getUser(lower);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = randomUUID();
  await setSession(token, lower);
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ success: true, username: lower });
});

app.post('/api/logout', async (req, res) => {
  await deleteSession(req.cookies?.token);
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/me', auth, async (req, res) => {
  const user = await getUser(req.user.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (typeof user.viewCount !== 'number') user.viewCount = 0;
  const { password, ...rest } = user;
  res.json(rest);
});

// --- Vercel Blob Upload Handler ---
async function handleUpload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    const isMusic = req.file.fieldname === 'music';
    const ext = isMusic
      ? ((req.file.originalname || '').match(/\.(mp3|m4a|ogg|wav)$/i)?.[1] || 'mp3')
      : ((req.file.originalname || '').match(/\.(png|jpg|jpeg|gif|webp|svg|mp4)$/i)?.[1] || 'png');

    const filename = `${req.user.username}/${req.file.fieldname}-${Date.now()}.${ext}`;
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype
    });
    res.json({ url: blob.url });
  } catch (error) {
    console.error("Blob upload error:", error);
    res.status(500).json({ error: 'Failed to upload to cloud storage' });
  }
}

app.post('/api/upload/pfp', auth, upload.single('pfp'), handleUpload);
app.post('/api/upload/pfp2', auth, upload.single('pfp2'), handleUpload);
app.post('/api/upload/bg', auth, upload.single('bg'), handleUpload);
app.post('/api/upload/preview', auth, upload.single('preview'), handleUpload);
app.post('/api/upload/music', auth, uploadMusic.single('music'), handleUpload);

app.put('/api/profile', auth, async (req, res) => {
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
});

app.get('/api/c/:slug', async (req, res) => {
  const u = await findUserBySlug(req.params.slug);
  if (!u) return res.status(404).json({ error: 'Profile not found' });
  if (typeof u.viewCount !== 'number') u.viewCount = 0;
  res.json({ username: u.username, displayName: u.displayName, profile: u.profile, viewCount: u.viewCount });
});

app.get('/c/:slug', async (req, res) => {
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
});

function escape(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default app;

// In Vercel, the express app is exported. 
// For local execution, we start the server if not running inside a serverless environment.
if (process.env.NODE_ENV !== 'production' || process.env.RUN_LOCAL === 'true') {
  app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}
