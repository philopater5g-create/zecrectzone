import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import cookieParser from 'cookie-parser';
import multer from 'multer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

const DATA_FILE = join(__dirname, 'data', 'users.json');
const UPLOADS_DIR = join(__dirname, 'uploads');
const SALT_ROUNDS = 10;

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = join(UPLOADS_DIR, req.user.username);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const isMusic = file.fieldname === 'music';
    const ext = isMusic
      ? ((file.originalname || '').match(/\.(mp3|m4a|ogg|wav)$/i)?.[1] || 'mp3')
      : ((file.originalname || '').match(/\.(png|jpg|jpeg|gif|webp|svg|mp4)$/i)?.[1] || 'png');
    cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });
const uploadMusic = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB for audio

const sessions = {};
if (!existsSync(join(__dirname, 'data'))) mkdirSync(join(__dirname, 'data'), { recursive: true });

function getUsers() {
  if (!existsSync(DATA_FILE)) return {};
  return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
}

function saveUsers(users) {
  writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

function auth(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
  if (!token || !sessions[token]) return res.status(401).json({ error: 'Unauthorized' });
  req.user = sessions[token];
  next();
}

const defaultProfile = {
  displayName: '',
  description: '',
  pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  pfp2: '',
  pfpShape: 'circle',
  switchPfpOnHover: false,
  links: [],
  tiltX: 10, tiltY: 10, tiltDuration: 0.3, scaleOnHover: 1.02,
  glowOnHover: true,
  bgColor: '#0f0f11', bgGradient: '', bgImage: '',
  blurBg: false,
  accentColor: '#f59e0b', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 24, shadowIntensity: 0.5,
  fontFamily: 'DM Sans',
  previewTitle: '', previewDescription: '', previewImage: '',
  customLink: '',
  musicUrl: '',
};

function findUserBySlug(users, slug) {
  const s = (slug || '').toLowerCase().replace(/\s/g, '');
  for (const u of Object.values(users)) {
    if (u.username === s) return u;
    if ((u.profile?.customLink || '').toLowerCase().replace(/\s/g, '') === s) return u;
  }
  return null;
}

app.post('/api/signup', async (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const users = getUsers();
  const lower = username.toLowerCase().replace(/\s/g, '');
  if (users[lower]) return res.status(400).json({ error: 'Username taken' });
  if (lower.length < 3) return res.status(400).json({ error: 'Username too short' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ chars' });
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const token = randomUUID();
  const profile = { ...defaultProfile, displayName: displayName || username };
  users[lower] = { username: lower, displayName: displayName || username, password: hash, profile, viewCount: 0, createdAt: Date.now() };
  saveUsers(users);
  sessions[token] = { username: lower };
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ success: true, username: lower });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const users = getUsers();
  const lower = username.toLowerCase().replace(/\s/g, '');
  const user = users[lower];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = randomUUID();
  sessions[token] = { username: lower };
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ success: true, username: lower });
});

app.post('/api/logout', (req, res) => {
  const token = req.cookies?.token;
  if (token) delete sessions[token];
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/me', auth, (req, res) => {
  const users = getUsers();
  const user = users[req.user.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (typeof user.viewCount !== 'number') user.viewCount = 0;
  const { password, ...rest } = user;
  res.json(rest);
});

app.post('/api/upload/pfp', auth, upload.single('pfp'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.user.username}/${req.file.filename}`;
  res.json({ url });
});

app.post('/api/upload/pfp2', auth, upload.single('pfp2'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.user.username}/${req.file.filename}`;
  res.json({ url });
});

app.post('/api/upload/bg', auth, upload.single('bg'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.user.username}/${req.file.filename}`;
  res.json({ url });
});

app.post('/api/upload/preview', auth, upload.single('preview'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.user.username}/${req.file.filename}`;
  res.json({ url });
});

app.post('/api/upload/music', auth, uploadMusic.single('music'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.user.username}/${req.file.filename}`;
  res.json({ url });
});

app.put('/api/profile', auth, (req, res) => {
  const users = getUsers();
  const user = users[req.user.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (req.body.customLink !== undefined) {
    const slug = String(req.body.customLink || '').toLowerCase().replace(/\s/g, '');
    if (slug && !/^[a-z0-9\-]{2,30}$/.test(slug)) return res.status(400).json({ error: 'Custom link: 2–30 chars, letters, numbers, hyphens only' });
    if (slug) {
      const existing = findUserBySlug(users, slug);
      if (existing && existing.username !== user.username) return res.status(400).json({ error: 'Custom link already taken' });
    }
  }
  user.profile = { ...user.profile, ...req.body };
  user.displayName = user.profile.displayName || user.username;
  saveUsers(users);
  res.json({ success: true, profile: user.profile });
});

app.get('/api/c/:slug', (req, res) => {
  const users = getUsers();
  const u = findUserBySlug(users, req.params.slug);
  if (!u) return res.status(404).json({ error: 'Profile not found' });
  if (typeof u.viewCount !== 'number') u.viewCount = 0;
  res.json({ username: u.username, displayName: u.displayName, profile: u.profile, viewCount: u.viewCount });
});

app.get('/c/:slug', (req, res) => {
  const users = getUsers();
  const u = findUserBySlug(users, req.params.slug);
  if (u) {
    if (typeof u.viewCount !== 'number') u.viewCount = 0;
    u.viewCount++;
    saveUsers(users);
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
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.use(express.static(join(__dirname, 'public')));

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
