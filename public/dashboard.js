// CURSOR_PRESETS is now loaded from cursor-presets.js

const CURSOR_SCALE = 32;

function scaleCursor(url, hotspot) {
  const [hx, hy] = hotspot || [0, 0];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${CURSOR_SCALE}' height='${CURSOR_SCALE}' viewBox='0 0 32 32'><image href='${url}' width='32' height='32'/></svg>`;
  const scaledHotspot = [Math.round(hx * CURSOR_SCALE / 32), Math.round(hy * CURSOR_SCALE / 32)];
  return `url("data:image/svg+xml;base64,${btoa(svg)}") ${scaledHotspot[0]} ${scaledHotspot[1]}, auto`;
}

let cursorInterval = null;
function applyCursor(cursor, target = document.body) {
  if (cursorInterval) { clearInterval(cursorInterval); cursorInterval = null; }

  let cursorVal = 'default';
  const preset = window.CURSOR_PRESETS ? window.CURSOR_PRESETS[cursor] : null;

  if (cursor === 'none') {
    cursorVal = 'none';
  } else if (cursor === 'url') {
    const url = document.getElementById('customCursorUrl')?.value;
    if (url) cursorVal = `url("${fullUrl(url)}"), auto`;
  } else if (preset) {
    if (typeof preset === 'string') {
      cursorVal = `url("${preset}") 16 16, auto`;
    } else if (preset.type === 'cur') {
      cursorVal = scaleCursor(preset.data, preset.hotspot);
    } else if (preset.type === 'ani' && preset.frames) {
      let frame = 0;
      const updateFrame = () => {
        const f = preset.frames[frame];
        const val = scaleCursor(f, preset.hotspot);
        target.style.cursor = val;

        let styleTag = document.getElementById('custom-cursor-style');
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'custom-cursor-style';
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = `body, .profile-card, * { cursor: ${val} !important; } a, button, .link, [role="button"], .upload-zone, .tab { cursor: pointer !important; }`;

        frame = (frame + 1) % preset.frames.length;
      };
      updateFrame();
      cursorInterval = setInterval(updateFrame, preset.rate || 100);
      return;
    }
  } else if (cursor && cursor !== 'default') {
    cursorVal = cursor;
  }

  target.style.cursor = cursorVal;

  let styleTag = document.getElementById('custom-cursor-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'custom-cursor-style';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = `body, .profile-card, * { cursor: ${cursorVal} !important; } a, button, .link, [role="button"], .upload-zone, .tab { cursor: pointer !important; }`;
}

window.initCursorEffects = function (effect, container = document.body) {
  const oldCanvas = container.querySelector('.cursor-effects-canvas');
  if (oldCanvas) oldCanvas.remove();
  if (!effect || effect === 'none') return;
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-effects-canvas';
  canvas.style.position = (container === document.body) ? 'fixed' : 'absolute';
  canvas.style.top = '0'; canvas.style.left = '0'; canvas.style.width = '100%'; canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none'; canvas.style.zIndex = '100000';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let mouse = { x: -100, y: -100, lastX: -100, lastY: -100 };
  function resize() {
    const rect = container.getBoundingClientRect();
    width = canvas.width = rect.width; height = canvas.height = rect.height;
  }
  window.addEventListener('resize', resize);
  resize();
  const moveHandler = e => {
    const rect = container.getBoundingClientRect();
    mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    if (effect === 'trail') createTrail(mouse.x, mouse.y);
    if (effect === 'sparkles') createSparkle(mouse.x, mouse.y);
    if (effect === 'bubbles') createBubble(mouse.x, mouse.y);
    if (effect === 'smoke') createSmoke(mouse.x, mouse.y);
    if (effect === 'rainbow') createRainbow(mouse.x, mouse.y);
    if (effect === 'stars') createStar(mouse.x, mouse.y);
    if (effect === 'hearts') createHeart(mouse.x, mouse.y);
    if (effect === 'fire') createFire(mouse.x, mouse.y);
    if (effect === 'pixel') createPixel(mouse.x, mouse.y);
    if (effect === 'confetti') createConfetti(mouse.x, mouse.y);
    if (effect === 'snow') createSnow(mouse.x, mouse.y);
    if (effect === 'energy') createEnergy(mouse.x, mouse.y);
    if (effect === 'ripple') createRipple(mouse.x, mouse.y);
  };
  container.addEventListener('mousemove', moveHandler);
  function createTrail(x, y) { particles.push({ x, y, size: 5, color: 'rgba(255,255,255,0.5)', life: 1, vx: 0, vy: 0 }); }
  function createSparkle(x, y) { for (let i = 0; i < 3; i++) particles.push({ x, y, size: Math.random() * 3, color: `hsl(${Math.random() * 360},100%,70%)`, life: 1, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 }); }
  function createBubble(x, y) { particles.push({ x, y, size: Math.random() * 10 + 5, color: 'rgba(255,255,255,0.2)', life: 1, vx: (Math.random() - 0.5), vy: -Math.random() * 2 }); }
  function createSmoke(x, y) { particles.push({ x, y, size: 10, color: 'rgba(100,100,100,0.1)', life: 1, vx: (Math.random() - 0.5), vy: -Math.random() * 2 }); }
  function createRainbow(x, y) { particles.push({ x, y, size: 8, color: `hsl(${Date.now() % 360},100%,50%)`, life: 1, vx: 0, vy: 0 }); }
  function createStar(x, y) { particles.push({ x, y, size: 15, color: '#ff0', life: 1, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, type: 'star' }); }
  function createHeart(x, y) { particles.push({ x, y, size: 15, color: '#f00', life: 1, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, type: 'heart' }); }
  function createFire(x, y) { for (let i = 0; i < 2; i++) particles.push({ x, y, size: 10, color: `rgb(255,${Math.random() * 100},0)`, life: 1, vx: (Math.random() - 0.5), vy: -Math.random() * 3 }); }
  function createPixel(x, y) { particles.push({ x, y, size: 6, color: '#0f0', life: 1, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 }); }
  function createConfetti(x, y) { for (let i = 0; i < 5; i++) particles.push({ x, y, size: 5, color: `hsl(${Math.random() * 360},100%,50%)`, life: 1, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, gravity: 0.2 }); }
  function createSnow(x, y) { particles.push({ x: Math.random() * width, y: -10, size: Math.random() * 3 + 1, color: '#fff', life: 1, vx: (Math.random() - 0.5), vy: Math.random() * 2 + 1 }); }
  function createEnergy(x, y) { particles.push({ x, y, size: 12, color: 'cyan', life: 1, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, type: 'orb' }); }
  function createRipple(x, y) { particles.push({ x, y, size: 2, color: 'rgba(255,255,255,0.4)', life: 1, vx: 0, vy: 0, type: 'ripple' }); }
  let active = true;
  function draw() {
    if (!active || !canvas.parentElement) return;
    ctx.clearRect(0, 0, width, height);
    if (effect === 'snow') createSnow();
    if (effect === 'matrix') {
      ctx.font = '15px monospace'; ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      for (let i = 0; i < 5; i++) ctx.fillText(Math.random() > 0.5 ? '0' : '1', Math.random() * width, Math.random() * height);
    }
    if (effect === 'glitch') {
      if (Math.random() > 0.95) { ctx.fillStyle = `rgba(${Math.random() * 255},0,0,0.15)`; ctx.fillRect(0, Math.random() * height, width, 5); }
    }
    if (effect === 'velocity') {
      ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(mouse.x - (mouse.x - mouse.lastX) * 5, mouse.y - (mouse.y - mouse.lastY) * 5);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke();
      mouse.lastX = mouse.x; mouse.lastY = mouse.y;
    }
    if (effect === 'cursor-ring') {
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 15, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    }
    if (effect === 'dot-trail') {
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
    }
    if (effect === 'magnetic') {
      ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(width / 2, height / 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.stroke();
    }
    if (effect === 'ghost') {
      if (mouse.ghostX === undefined) { mouse.ghostX = mouse.x; mouse.ghostY = mouse.y; }
      mouse.ghostX += (mouse.x - mouse.ghostX) * 0.1; mouse.ghostY += (mouse.y - mouse.ghostY) * 0.1;
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(mouse.ghostX, mouse.ghostY, 6, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.life -= 0.015;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy; if (p.gravity) p.vy += p.gravity;
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      if (p.type === 'star') { ctx.font = `${p.size}px serif`; ctx.fillText('⭐', p.x, p.y); }
      else if (p.type === 'heart') { ctx.font = `${p.size}px serif`; ctx.fillText('❤️', p.x, p.y); }
      else if (p.type === 'orb') {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, p.color); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'ripple') {
        ctx.strokeStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, (1 - p.life) * 40, 0, Math.PI * 2); ctx.stroke();
      } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1; requestAnimationFrame(draw);
  }
  draw();
  return () => { active = false; canvas.remove(); container.removeEventListener('mousemove', moveHandler); };
};

let user = null;
let profile = {};
const PFG_DEFAULT = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

function getBaseUrl() { return window.location.origin; }
function fullUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return getBaseUrl() + (path.startsWith('/') ? path : '/' + path);
}

function getProfile() {
  const pfp = document.getElementById('pfpUrl')?.value?.trim();
  const pfp2 = document.getElementById('pfp2Url')?.value?.trim();
  const bg = document.getElementById('bgUrl')?.value?.trim();
  const pageBg = document.getElementById('pageBgUrl')?.value?.trim();
  const previewImg = document.getElementById('previewUrl')?.value?.trim();
  const getValue = (id, def) => document.getElementById(id)?.value ?? def;
  const getNum = (id, def) => +document.getElementById(id)?.value ?? def;
  const getCheck = (id, def) => document.getElementById(id)?.checked ?? def;
  return {
    displayName: (getValue('displayName', '') || '').trim(),
    description: (getValue('description', '') || '').trim(),
    pfp: pfp || PFG_DEFAULT,
    pfp2: pfp2 || '',
    switchPfpOnHover: getCheck('switchPfpOnHover', false),
    pfpShape: getValue('pfpShape', 'circle'),
    // Animations
    tiltX: getNum('tiltX', 10),
    tiltY: getNum('tiltY', 10),
    tiltDuration: getNum('tiltDuration', 0.3),
    scaleOnHover: getNum('scaleOnHover', 1.02),
    glowOnHover: getCheck('glowOnHover', true),
    hoverAnimation: getValue('hoverAnimation', 'tilt'),
    cardEntrance: getValue('cardEntrance', 'none'),
    entranceDuration: getNum('entranceDuration', 0.6),
    textAnimation: getValue('textAnimation', 'none'),
    // Colors
    bgColor: getValue('bgColor', '#0f0f11'),
    bgImage: bg || '',
    blurBg: getCheck('blurBg', false),
    bgOpacity: getNum('bgOpacity', 1),
    pageBgUrl: pageBg || '',
    pageBgColor: getValue('pageBgColor', '#09090b'),
    blurPageBg: getCheck('blurPageBg', false),
    accentColor: getValue('accentColor', '#f59e0b'),
    // Borders
    borderColor: getValue('borderColor', '#ffffff'),
    borderWidth: getNum('borderWidth', 1),
    borderStyle: getValue('borderStyle', 'solid'),
    borderOpacity: getNum('borderOpacity', 0.1),
    borderGlow: getCheck('borderGlow', false),
    borderRadius: getNum('borderRadius', 24),
    shadowIntensity: getNum('shadowIntensity', 0.5),
    // Typography
    fontFamily: getValue('fontFamily', 'DM Sans'),
    fontSize: getNum('fontSize', 16),
    fontWeight: getValue('fontWeight', '400'),
    textAlign: getValue('textAlign', 'center'),
    textShadow: getNum('textShadow', 0),
    // Effects
    cardOpacity: getNum('cardOpacity', 1),
    cardRotation: getNum('cardRotation', 0),
    imgBrightness: getNum('imgBrightness', 100),
    imgContrast: getNum('imgContrast', 100),
    imgSaturation: getNum('imgSaturation', 100),
    grayscaleEffect: getCheck('grayscaleEffect', false),
    sepiaEffect: getCheck('sepiaEffect', false),
    // Layout
    cardWidth: getNum('cardWidth', 340),
    cardPadding: getNum('cardPadding', 32),
    elementSpacing: getNum('elementSpacing', 16),
    linkStyle: getValue('linkStyle', 'default'),
    // Gradients
    gradientStart: getValue('gradientStart', '#0f0f11'),
    gradientEnd: getValue('gradientEnd', '#1a1a1a'),
    gradientAngle: getNum('gradientAngle', 135),
    bgGradient: getCheck('bgGradient', false),
    // Meta
    links: getLinks(),
    previewTitle: (getValue('previewTitle', '') || '').trim(),
    previewDescription: (getValue('previewDescription', '') || '').trim(),
    previewImage: previewImg || '',
    customLink: (getValue('customLink', '') || '').trim().toLowerCase().replace(/\s/g, '').replace(/^\-+|\-+$/g, ''),
    musicUrl: getValue('musicUrl', '')?.trim() || '',
    customCursor: getValue('customCursor', 'default'),
    cursorEffect: getValue('cursorEffect', 'none'),
  };
}

function getLinks() {
  return [...document.querySelectorAll('.link-item')].map(el => ({
    title: (el.querySelector('input[placeholder="Title"]')?.value || '').trim(),
    url: (el.querySelector('input[placeholder="URL"]')?.value || '').trim(),
  })).filter(l => l.url);
}

function applyProfile(p) {
  if (!p) return;
  profile = p;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

  setVal('pfpUrl', p.pfp);
  setVal('pfp2Url', p.pfp2);
  setVal('bgUrl', p.bgImage);
  setVal('pageBgUrl', p.pageBgUrl);
  setVal('previewUrl', p.previewImage);
  setVal('description', p.description);
  setVal('accentColor', p.accentColor);
  setVal('accentColorText', p.accentColor);
  setVal('bgColor', p.bgColor);
  setVal('bgColorText', p.bgColor);
  setVal('gradientStart', p.gradientStart);
  setVal('gradientStartText', p.gradientStart);
  setVal('gradientEnd', p.gradientEnd);
  setVal('gradientEndText', p.gradientEnd);
  setVal('gradientAngle', p.gradientAngle || 135);
  setVal('borderColor', p.borderColor);
  setVal('borderColorText', p.borderColor);
  setVal('borderOpacity', p.borderOpacity ?? 0.1);
  setVal('borderOpacityVal', p.borderOpacity ?? 0.1);
  setVal('borderRadius', p.borderRadius ?? 24);
  setVal('borderRadiusVal', p.borderRadius ?? 24);
  setVal('borderWidth', p.borderWidth ?? 1);
  setVal('borderWidthVal', p.borderWidth ?? 1);
  setVal('borderStyle', p.borderStyle || 'solid');
  setCheck('borderGlow', p.borderGlow);
  setVal('cardWidth', p.cardWidth ?? 340);
  setVal('cardWidthVal', p.cardWidth ?? 340);
  setVal('cardPadding', p.cardPadding ?? 32);
  setVal('cardPaddingVal', p.cardPadding ?? 32);
  setVal('elementSpacing', p.elementSpacing ?? 16);
  setVal('elementSpacingVal', p.elementSpacing ?? 16);
  setVal('textAlign', p.textAlign || 'center');
  setVal('pfpShape', p.pfpShape || 'circle');
  setVal('hoverAnimation', p.hoverAnimation || 'none');
  setVal('cardEntrance', p.cardEntrance || 'none');
  setVal('entranceDuration', p.entranceDuration ?? 0.6);
  setVal('entranceDurationVal', p.entranceDuration ?? 0.6);
  setVal('textAnimation', p.textAnimation || 'none');
  setVal('cardRotation', p.cardRotation ?? 0);
  setVal('cardRotationVal', p.cardRotation ?? 0);
  setVal('cardOpacity', p.cardOpacity ?? 1);
  setVal('cardOpacityVal', p.cardOpacity ?? 1);
  setCheck('bgGradient', p.bgGradient);
  setCheck('blurBg', p.blurBg);
  setCheck('blurPageBg', p.blurPageBg);
  setCheck('switchPfpOnHover', p.switchPfpOnHover);
  setCheck('glowOnHover', p.glowOnHover);
  setCheck('grayscaleEffect', p.grayscaleEffect);
  setCheck('sepiaEffect', p.sepiaEffect);
  setVal('imgBrightness', p.imgBrightness ?? 100);
  setVal('imgBrightnessVal', p.imgBrightness ?? 100);
  setVal('imgContrast', p.imgContrast ?? 100);
  setVal('imgContrastVal', p.imgContrast ?? 100);
  setVal('imgSaturation', p.imgSaturation ?? 100);
  setVal('imgSaturationVal', p.imgSaturation ?? 100);
  setVal('tiltX', p.tiltX ?? 10);
  setVal('tiltY', p.tiltY ?? 10);
  setVal('scaleOnHover', p.scaleOnHover ?? 1.02);
  setVal('tiltDuration', p.tiltDuration ?? 0.3);
  setVal('shadowIntensity', p.shadowIntensity ?? 0.5);
  setVal('textShadow', p.textShadow ?? 0);
  setVal('fontSize', p.fontSize ?? 16);
  setVal('fontWeight', p.fontWeight || '400');
  setVal('previewTitle', p.previewTitle);
  setVal('previewDescription', p.previewDescription);
  setVal('customLink', p.customLink);
  setVal('musicUrl', p.musicUrl);
  setVal('cursorEffect', p.cursorEffect || 'none');
  setVal('customCursor', p.customCursor || 'default');
  setVal('customCursorUrl', p.customCursorUrl || '');

  const urlField = document.getElementById('field-customCursorUrl');
  if (urlField) urlField.style.display = p.customCursor === 'url' ? 'block' : 'none';

  setUploadZoneDisplay('pfp', p.pfp && p.pfp !== PFG_DEFAULT ? fullUrl(p.pfp) : '');
  setUploadZoneDisplay('pfp2', p.pfp2 ? fullUrl(p.pfp2) : '');
  setUploadZoneDisplay('bg', p.bgImage ? fullUrl(p.bgImage) : '');
  setUploadZoneDisplay('pagebg', p.pageBgUrl ? fullUrl(p.pageBgUrl) : '');
  setUploadZoneDisplay('preview', p.previewImage ? fullUrl(p.previewImage) : '');
  document.getElementById('pfpUrl').value = p.pfp && p.pfp !== PFG_DEFAULT ? (p.pfp.startsWith('/') ? p.pfp : '/' + p.pfp.replace(getBaseUrl(), '')) : '';
  document.getElementById('pfp2Url').value = p.pfp2 ? (p.pfp2.startsWith('/') ? p.pfp2 : p.pfp2.replace(getBaseUrl(), '')) : '';
  document.getElementById('bgUrl').value = p.bgImage ? (p.bgImage.startsWith('/') ? p.bgImage : p.bgImage.replace(getBaseUrl(), '')) : '';
  document.getElementById('pageBgUrl').value = p.pageBgUrl ? (p.pageBgUrl.startsWith('/') ? p.pageBgUrl : p.pageBgUrl.replace(getBaseUrl(), '')) : '';
  document.getElementById('previewUrl').value = p.previewImage ? (p.previewImage.startsWith('/') ? p.previewImage : p.previewImage.replace(getBaseUrl(), '')) : '';
  const musicUrlEl = document.getElementById('musicUrl');
  if (musicUrlEl) musicUrlEl.value = p.musicUrl ? (p.musicUrl.startsWith('/') ? p.musicUrl : (p.musicUrl.replace(getBaseUrl(), '').replace(/^\/+/, '/') || p.musicUrl)) : '';
  const mz = document.getElementById('musicZone');
  const ml = document.getElementById('musicLabel');
  if (mz && ml) { mz.classList.toggle('has-file', !!p.musicUrl); ml.textContent = p.musicUrl ? 'Track uploaded' : 'Click to upload MP3'; }
  renderLinks(p.links || []);
  updateLinkTab();
}

function updateLinkTab() {
  const slug = (document.getElementById('customLink')?.value || profile.customLink || user?.username || '').trim().toLowerCase().replace(/\s/g, '') || user?.username || '';
  const url = slug ? getBaseUrl() + '/c/' + encodeURIComponent(slug) : getBaseUrl() + '/c/' + (user?.username || '');
  const el = document.getElementById('profileUrlDisplay');
  if (el) el.textContent = url;
  const vc = document.getElementById('viewCountDisplay');
  if (vc && user) vc.textContent = (user.viewCount ?? 0).toLocaleString();
}

function setUploadZoneDisplay(name, displayUrl) {
  const map = { pfp: ['pfpZone', 'pfpPreview', 'pfpUrl'], pfp2: ['pfp2Zone', 'pfp2Preview', 'pfp2Url'], bg: ['bgZone', 'bgPreview', 'bgUrl'], pagebg: ['pageBgZone', 'pageBgPreview', 'pageBgUrl'], preview: ['previewZone', 'previewImagePreview', 'previewUrl'] };
  const [zoneId, previewId, urlId] = map[name] || [];
  const zone = document.getElementById(zoneId);
  const preview = document.getElementById(previewId);
  if (!zone) return;
  if (displayUrl) {
    zone.classList.add('has-file');
    const isVideo = (displayUrl || '').toLowerCase().includes('.mp4');
    const vid = zone.querySelector('.upload-preview-video');
    if (preview) { preview.src = isVideo ? '' : displayUrl; preview.style.display = isVideo ? 'none' : 'block'; }
    if (vid) { vid.src = isVideo ? displayUrl : ''; vid.style.display = isVideo ? 'block' : 'none'; }
  } else {
    zone.classList.remove('has-file');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    const vid = zone.querySelector('.upload-preview-video');
    if (vid) { vid.src = ''; vid.style.display = 'none'; }
  }
}

function updateRangeLabels() {
  const r = (id, labelId) => { const v = document.getElementById(id)?.value; const l = document.getElementById(labelId); if (l) l.textContent = v; };
  r('tiltX', 'tiltXVal'); r('tiltY', 'tiltYVal'); r('tiltDuration', 'tiltDurationVal'); r('scaleOnHover', 'scaleVal');
  r('borderRadius', 'radiusVal'); r('shadowIntensity', 'shadowVal');
  r('cardOpacity', 'cardOpacityVal'); r('cardRotation', 'cardRotationVal');
  r('imgBrightness', 'imgBrightnessVal'); r('imgContrast', 'imgContrastVal'); r('imgSaturation', 'imgSaturationVal');
  r('textShadow', 'textShadowVal'); r('entranceDuration', 'entranceDurationVal');
  r('borderWidth', 'borderWidthVal'); r('borderOpacity', 'borderOpacityVal');
  r('cardWidth', 'cardWidthVal'); r('cardPadding', 'cardPaddingVal'); r('elementSpacing', 'elementSpacingVal');
  r('bgOpacity', 'bgOpacityVal'); r('gradientAngle', 'gradientAngleVal'); r('fontSize', 'fontSizeVal');
}

function pfpRadius(shape) {
  if (shape === 'circle') return '50%';
  if (shape === 'rounded') return '16px';
  return '4px';
}

function isVideoUrl(url) {
  return (url || '').toLowerCase().includes('.mp4') || (url || '').toLowerCase().endsWith('mp4');
}

function pfpHtml(url, shape, fallback) {
  const radius = pfpRadius(shape);
  const style = `border-radius:${radius}`;
  if (!url) return `<img class="pfp" src="${fallback}" alt="" style="${style}">`;
  if (isVideoUrl(url)) return `<video class="pfp" autoplay muted loop playsinline style="${style}" src="${url}"></video>`;
  return `<img class="pfp" src="${url}" alt="" onerror="this.src='${fallback}'" style="${style}">`;
}

function pfpHoverHtml(url, shape) {
  if (!url) return '';
  const radius = pfpRadius(shape);
  const style = `border-radius:${radius}`;
  if (isVideoUrl(url)) return `<video class="pfp-hover" autoplay muted loop playsinline style="${style}" src="${url}"></video>`;
  return `<img class="pfp-hover" src="${url}" alt="" onerror="this.style.display='none'" style="${style}">`;
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return [245, 158, 11];
  const m = hex.slice(1).match(/.{2}/g);
  return m ? m.map(x => parseInt(x, 16)) : [245, 158, 11];
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}



function renderPreview() {
  const p = getProfile();
  const card = document.getElementById('previewCard');
  if (!card) return;

  // Background (with gradient support)
  let bg = p.bgColor || '#0f0f11';
  if (p.bgGradient && p.gradientStart && p.gradientEnd) {
    bg = `linear-gradient(${p.gradientAngle ?? 135}deg, ${p.gradientStart}, ${p.gradientEnd})`;
  } else if (p.bgImage) {
    bg = `url(${fullUrl(p.bgImage)}) center/cover`;
  }

  // Border with opacity
  const borderColorRgb = hexToRgb(p.borderColor || '#ffffff');
  const borderColorWithOpacity = `rgba(${borderColorRgb.join(',')}, ${p.borderOpacity ?? 0.1})`;

  // Image filters
  const imgFilters = [];
  if (p.grayscaleEffect) imgFilters.push('grayscale(100%)');
  if (p.sepiaEffect) imgFilters.push('sepia(100%)');
  if (p.imgBrightness !== 100) imgFilters.push(`brightness(${p.imgBrightness ?? 100}%)`);
  if (p.imgContrast !== 100) imgFilters.push(`contrast(${p.imgContrast ?? 100}%)`);
  if (p.imgSaturation !== 100) imgFilters.push(`saturate(${p.imgSaturation ?? 100}%)`);
  const filterStr = imgFilters.length ? imgFilters.join(' ') : 'none';

  const glow = p.glowOnHover ? `rgba(${hexToRgb(p.accentColor).join(',')},${(p.shadowIntensity ?? 0.5) * 0.4})` : 'transparent';
  const textShadowStr = (p.textShadow ?? 0) > 0 ? `0 2px ${(p.textShadow ?? 0) * 2}px rgba(0,0,0,0.5)` : 'none';

  // Hover Animation Class
  card.classList.remove('hover-lift', 'hover-bounce', 'hover-shake');
  if (p.hoverAnimation === 'lift') card.classList.add('hover-lift');
  else if (p.hoverAnimation === 'bounce') card.classList.add('hover-bounce');
  else if (p.hoverAnimation === 'shake') card.classList.add('hover-shake');

  card.style.cssText = `
    --card-glow: ${glow};
    --scale: ${p.scaleOnHover ?? 1.02};
    background: ${bg};
    border: ${p.borderWidth}px ${p.borderStyle} ${borderColorWithOpacity};
    border-radius: ${p.borderRadius}px;
    width: ${p.cardWidth}px;
    padding: ${p.cardPadding}px;
    opacity: ${p.cardOpacity};
    transform: rotate(${p.cardRotation}deg);
    transition: transform ${p.tiltDuration}s ease, box-shadow ${p.tiltDuration}s ease, opacity 0.3s ease;
    font-family: '${p.fontFamily}', sans-serif;
    font-size: ${p.fontSize}px;
    font-weight: ${p.fontWeight};
    text-align: ${p.textAlign};
    text-shadow: ${textShadowStr};
    box-shadow: 0 20px 40px -12px rgba(0,0,0,${0.3 + (p.shadowIntensity || 0.5) * 0.2})${p.borderGlow ? `, 0 0 20px ${p.accentColor}` : ''};
    backdrop-filter: ${p.blurBg ? 'blur(12px)' : 'none'};
    filter: ${filterStr};
  `;

  // Apply cursor to the preview area
  const rightSide = document.querySelector('.dashboard-right');
  if (rightSide) {
    applyCursor(p.customCursor, rightSide);
    if (window.initCursorEffects) {
      if (this._cleanupEffect) this._cleanupEffect();
      this._cleanupEffect = window.initCursorEffects(p.cursorEffect, rightSide);
    }
  }

  card.classList.toggle('switch-pfp', p.switchPfpOnHover);
  card.classList.toggle('glow-on-hover', p.glowOnHover);

  const pfpUrl = p.pfp ? fullUrl(p.pfp) : PFG_DEFAULT;
  const pfp2Url = p.pfp2 ? fullUrl(p.pfp2) : '';
  const textAnimClass = p.textAnimation && p.textAnimation !== 'none' ? `text-animate-${p.textAnimation}` : '';

  card.innerHTML = `
    <div class="pfp-container">
      ${pfpHtml(pfpUrl, p.pfpShape, PFG_DEFAULT)}
      ${pfpHoverHtml(pfp2Url, p.pfpShape)}
    </div>
    <div class="display-name ${textAnimClass}">${escapeHtml(p.displayName || user?.username || 'Your Name')}</div>
    <div class="description ${textAnimClass}">${escapeHtml(p.description || 'Your bio goes here...')}</div>
    <div class="links ${textAnimClass}" style="gap:${p.elementSpacing ?? 16}px">
      ${(p.links || []).slice(0, 5).map(l => `<a href="${escapeHtml(l.url)}" class="link style-${p.linkStyle ?? 'default'}" target="_blank" rel="noopener" style="--accent:${p.accentColor}">${escapeHtml(l.title || 'Link')}</a>`).join('')}
      ${!p.links?.length ? '<span class="link" style="opacity:0.5">Add links →</span>' : ''}
    </div>
  `;

  if (p.hoverAnimation === 'tilt' || !p.hoverAnimation) {
    card.onmouseenter = () => {
      const tx = p.tiltX || 0, ty = p.tiltY || 0, scale = p.scaleOnHover || 1.02;
      card.style.transform = `perspective(1000px) rotateX(${ty}deg) rotateY(${tx}deg) scale(${scale}) rotate(${p.cardRotation ?? 0}deg)`;
    };
    card.onmouseleave = () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) rotate(${p.cardRotation ?? 0}deg)`;
    };
  } else {
    card.onmouseenter = null;
    card.onmouseleave = null;
  }
}

function renderLinks(links) {
  const c = document.getElementById('linksContainer');
  if (!c) return;
  c.innerHTML = '';
  const list = links?.length ? links : [{ title: '', url: '' }];
  list.forEach(l => {
    const div = document.createElement('div');
    div.className = 'link-item';
    div.innerHTML = `<input type="text" placeholder="Title" value="${escapeHtml(l.title)}" class="input"><input type="url" placeholder="URL" value="${escapeHtml(l.url)}" class="input"><button type="button" class="btn-remove">×</button>`;
    div.querySelector('.btn-remove').onclick = () => { div.remove(); if (!c.children.length) addLinkRow(); debouncePreview(); };
    div.querySelectorAll('input').forEach(i => i.addEventListener('input', debouncePreview));
    c.appendChild(div);
  });
}

function addLinkRow() {
  const c = document.getElementById('linksContainer');
  const div = document.createElement('div');
  div.className = 'link-item';
  div.innerHTML = `<input type="text" placeholder="Title" class="input"><input type="url" placeholder="URL" class="input"><button type="button" class="btn-remove">×</button>`;
  div.querySelector('.btn-remove').onclick = () => { div.remove(); debouncePreview(); };
  div.querySelectorAll('input').forEach(i => i.addEventListener('input', debouncePreview));
  c.appendChild(div);
}

let previewT;
function debouncePreview() { clearTimeout(previewT); previewT = setTimeout(renderPreview, 80); }

async function uploadFile(endpoint, file, field) {
  const fd = new FormData();
  fd.append(field, file);
  const res = await fetch(endpoint, { method: 'POST', body: fd, credentials: 'include' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(errorData.error || `Upload failed with status ${res.status}`);
  }
  const { url } = await res.json();
  return url;
}

function setupUpload(zoneId, inputId, endpoint, field, urlId, onSuccess) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;
  zone.onclick = () => input.click();
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(endpoint, file, field);
      document.getElementById(urlId).value = url;
      if (urlId !== 'musicUrl') setUploadZoneDisplay(urlId.replace('Url', ''), getBaseUrl() + url);
      if (onSuccess) onSuccess(); else setUploadZoneDisplay(urlId.replace('Url', ''), getBaseUrl() + url);
      debouncePreview();
      input.value = '';
    } catch (e) {
      console.error('Upload error:', e);
      alert('Upload failed: ' + e.message);
    }
  };
}

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('panel-' + tab.dataset.tab);
    if (panel) panel.classList.add('active');
    if (tab.dataset.tab === 'link') {
      updateLinkTab();
      fetch('/api/me', { credentials: 'include' }).then(r => r.ok && r.json()).then(u => { if (u) { user.viewCount = u.viewCount ?? 0; document.getElementById('viewCountDisplay').textContent = (u.viewCount ?? 0).toLocaleString(); } });
    }
  });
});

document.getElementById('copyLinkBtn')?.addEventListener('click', () => {
  const url = document.getElementById('profileUrlDisplay')?.textContent;
  if (url) navigator.clipboard.writeText(url).then(() => alert('Copied!')).catch(() => alert('Copy failed'));
});

// Init
(async () => {
  const res = await fetch('/api/me', { credentials: 'include' });
  if (!res.ok) { location.href = '/'; return; }
  user = await res.json();
  user.viewCount = user.viewCount ?? 0;
  profile = user.profile || {};

  // Populate ZIP presets
  const optgroup = document.getElementById('zipPresets');
  if (optgroup && window.CURSOR_PRESETS) {
    Object.keys(window.CURSOR_PRESETS).forEach(key => {
      if (key.startsWith('zip-')) {
        const option = document.createElement('option');
        option.value = key;
        const name = key.replace('zip-', '').replace(/-/g, ' ');
        option.textContent = (window.CURSOR_PRESETS[key].type === 'ani' ? '⭐ ' : '🖱️ ') + name.charAt(0).toUpperCase() + name.slice(1);
        optgroup.appendChild(option);
      }
    });
  }

  applyProfile(profile);
  renderPreview();

  const effectiveSlug = (profile.customLink || user.username || '').trim().toLowerCase() || user.username;
  document.getElementById('viewLink').href = `/c/${encodeURIComponent(effectiveSlug || user.username)}`;
  document.getElementById('logoutBtn').onclick = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    location.href = '/';
  };

  document.getElementById('addLinkBtn').onclick = () => { addLinkRow(); debouncePreview(); };

  setupUpload('pfpZone', 'pfpInput', '/api/upload/pfp', 'pfp', 'pfpUrl');
  setupUpload('pfp2Zone', 'pfp2Input', '/api/upload/pfp2', 'pfp2', 'pfp2Url');
  setupUpload('bgZone', 'bgInput', '/api/upload/bg', 'bg', 'bgUrl');
  setupUpload('pageBgZone', 'pageBgInput', '/api/upload/pagebg', 'pagebg', 'pageBgUrl');
  setupUpload('previewZone', 'previewInput', '/api/upload/preview', 'preview', 'previewUrl');
  setupUpload('musicZone', 'musicInput', '/api/upload/music', 'music', 'musicUrl', () => {
    const mz = document.getElementById('musicZone');
    const ml = document.getElementById('musicLabel');
    if (mz && ml) { mz.classList.add('has-file'); ml.textContent = 'Track uploaded'; }
  });

  [
    // Basic
    'displayName', 'description', 'customLink', 'musicUrl', 'switchPfpOnHover', 'pfpShape', 'previewTitle', 'previewDescription',
    // Animations  
    'tiltX', 'tiltY', 'tiltDuration', 'scaleOnHover', 'glowOnHover', 'hoverAnimation', 'cardEntrance', 'entranceDuration', 'textAnimation',
    // Colors
    'bgColor', 'bgColorText', 'blurBg', 'bgOpacity', 'pageBgColor', 'pageBgColorText', 'blurPageBg', 'accentColor', 'accentColorText',
    // Borders
    'borderColor', 'borderColorText', 'borderWidth', 'borderStyle', 'borderOpacity', 'borderGlow', 'borderRadius', 'shadowIntensity',
    // Typography
    'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'textShadow',
    // Effects
    'cardOpacity', 'cardRotation', 'imgBrightness', 'imgContrast', 'imgSaturation', 'grayscaleEffect', 'sepiaEffect',
    // Layout
    'cardWidth', 'cardPadding', 'elementSpacing', 'linkStyle',
    // Gradients
    'gradientStart', 'gradientStartText', 'gradientEnd', 'gradientEndText', 'gradientAngle', 'bgGradient',
    // Cursors
    'customCursor', 'customCursorUrl', 'cursorEffect'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', debouncePreview);
  });

  const customCursorSelect = document.getElementById('customCursor');
  if (customCursorSelect) {
    customCursorSelect.addEventListener('change', () => {
      const field = document.getElementById('field-customCursorUrl');
      if (field) field.style.display = customCursorSelect.value === 'url' ? 'block' : 'none';
      renderPreview();
    });
  }
  document.getElementById('linksContainer')?.addEventListener('input', debouncePreview);

  document.getElementById('saveBtn').onclick = async () => {
    const p = getProfile();
    const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(p) });
    if (res.ok) {
      profile = { ...profile, ...p };
      const slug = (p.customLink || user.username || '').trim().toLowerCase() || user.username;
      document.getElementById('viewLink').href = `/c/${encodeURIComponent(slug)}`;
      updateLinkTab();
      alert('Saved!');
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to save');
    }
  };
})();
