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
  profile = p;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
  const setCheck = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };
  const setColor = (id, textId, v) => { set(id, v); set(textId, v); };
  // Basic fields
  set('displayName', p.displayName); set('description', p.description);
  set('customLink', (p.customLink || '').toLowerCase()); set('musicUrl', p.musicUrl || '');
  set('pfpShape', p.pfpShape || 'circle');
  setCheck('switchPfpOnHover', p.switchPfpOnHover);
  // Animations
  set('tiltX', p.tiltX ?? 10); set('tiltY', p.tiltY ?? 10);
  set('tiltDuration', p.tiltDuration ?? 0.3); set('scaleOnHover', p.scaleOnHover ?? 1.02);
  setCheck('glowOnHover', p.glowOnHover ?? true);
  set('hoverAnimation', p.hoverAnimation || 'tilt');
  set('cardEntrance', p.cardEntrance || 'none'); set('entranceDuration', p.entranceDuration ?? 0.6);
  set('textAnimation', p.textAnimation || 'none');
  // Colors
  setColor('bgColor', 'bgColorText', p.bgColor || '#0f0f11');
  setColor('pageBgColor', 'pageBgColorText', p.pageBgColor || '#09090b');
  setColor('accentColor', 'accentColorText', p.accentColor || '#f59e0b');
  setCheck('blurBg', p.blurBg); setCheck('blurPageBg', p.blurPageBg);
  set('bgOpacity', p.bgOpacity ?? 1);
  // Borders
  setColor('borderColor', 'borderColorText', p.borderColor || '#ffffff');
  set('borderWidth', p.borderWidth ?? 1); set('borderStyle', p.borderStyle || 'solid');
  set('borderOpacity', p.borderOpacity ?? 0.1); setCheck('borderGlow', p.borderGlow);
  set('borderRadius', p.borderRadius ?? 24); set('shadowIntensity', p.shadowIntensity ?? 0.5);
  // Typography
  set('fontFamily', p.fontFamily || 'DM Sans'); set('fontSize', p.fontSize ?? 16);
  set('fontWeight', p.fontWeight || '400'); set('textAlign', p.textAlign || 'center');
  set('textShadow', p.textShadow ?? 0);
  // Effects
  set('cardOpacity', p.cardOpacity ?? 1); set('cardRotation', p.cardRotation ?? 0);
  set('imgBrightness', p.imgBrightness ?? 100); set('imgContrast', p.imgContrast ?? 100);
  set('imgSaturation', p.imgSaturation ?? 100);
  setCheck('grayscaleEffect', p.grayscaleEffect); setCheck('sepiaEffect', p.sepiaEffect);
  // Layout
  set('cardWidth', p.cardWidth ?? 340); set('cardPadding', p.cardPadding ?? 32);
  set('elementSpacing', p.elementSpacing ?? 16); set('linkStyle', p.linkStyle || 'default');
  // Gradients
  setColor('gradientStart', 'gradientStartText', p.gradientStart || '#0f0f11');
  setColor('gradientEnd', 'gradientEndText', p.gradientEnd || '#1a1a1a');
  set('gradientAngle', p.gradientAngle ?? 135); setCheck('bgGradient', p.bgGradient);
  // Meta
  set('previewTitle', p.previewTitle); set('previewDescription', p.previewDescription);
  set('customCursor', p.customCursor || 'default'); set('cursorEffect', p.cursorEffect || 'none');
  updateRangeLabels();

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
    if (p.customCursor && p.customCursor.startsWith('emoji-')) {
      const emoji = document.querySelector(`#customCursor option[value="${p.customCursor}"]`)?.textContent.split(' ')[0] || '✨';
      rightSide.style.cursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size:24px'><text y='24'>${emoji}</text></svg>") 16 16, auto`;
    } else {
      rightSide.style.cursor = p.customCursor || 'default';
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
    'customCursor', 'cursorEffect'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', debouncePreview), el.addEventListener('change', debouncePreview);
  });
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
