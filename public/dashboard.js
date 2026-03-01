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
  const previewImg = document.getElementById('previewUrl')?.value?.trim();
  return {
    displayName: (document.getElementById('displayName')?.value || '').trim(),
    description: (document.getElementById('description')?.value || '').trim(),
    pfp: pfp || PFG_DEFAULT,
    pfp2: pfp2 || '',
    switchPfpOnHover: document.getElementById('switchPfpOnHover')?.checked ?? false,
    pfpShape: document.getElementById('pfpShape')?.value || 'circle',
    tiltX: +document.getElementById('tiltX')?.value ?? 10,
    tiltY: +document.getElementById('tiltY')?.value ?? 10,
    tiltDuration: +document.getElementById('tiltDuration')?.value ?? 0.3,
    scaleOnHover: +document.getElementById('scaleOnHover')?.value ?? 1.02,
    glowOnHover: document.getElementById('glowOnHover')?.checked ?? true,
    bgColor: document.getElementById('bgColor')?.value || '#0f0f11',
    bgImage: bg || '',
    blurBg: document.getElementById('blurBg')?.checked ?? false,
    accentColor: document.getElementById('accentColor')?.value || '#f59e0b',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: +document.getElementById('borderRadius')?.value ?? 24,
    shadowIntensity: +document.getElementById('shadowIntensity')?.value ?? 0.5,
    fontFamily: document.getElementById('fontFamily')?.value || 'DM Sans',
    links: getLinks(),
    previewTitle: (document.getElementById('previewTitle')?.value || '').trim(),
    previewDescription: (document.getElementById('previewDescription')?.value || '').trim(),
    previewImage: previewImg || '',
    customLink: (document.getElementById('customLink')?.value || '').trim().toLowerCase().replace(/\s/g, '').replace(/^\-+|\-+$/g, ''),
    musicUrl: document.getElementById('musicUrl')?.value?.trim() || '',
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
  set('displayName', p.displayName);
  set('description', p.description);
  set('previewTitle', p.previewTitle);
  set('previewDescription', p.previewDescription);
  set('customLink', (p.customLink || '').toLowerCase());
  set('musicUrl', p.musicUrl || '');
  setCheck('switchPfpOnHover', p.switchPfpOnHover);
  setCheck('glowOnHover', p.glowOnHover ?? true);
  setCheck('blurBg', p.blurBg);
  document.getElementById('pfpShape').value = p.pfpShape || 'circle';
  document.getElementById('tiltX').value = p.tiltX ?? 10;
  document.getElementById('tiltY').value = p.tiltY ?? 10;
  document.getElementById('tiltDuration').value = p.tiltDuration ?? 0.3;
  document.getElementById('scaleOnHover').value = p.scaleOnHover ?? 1.02;
  document.getElementById('bgColor').value = p.bgColor || '#0f0f11';
  document.getElementById('bgColorText').value = p.bgColor || '#0f0f11';
  document.getElementById('accentColor').value = p.accentColor || '#f59e0b';
  document.getElementById('accentColorText').value = p.accentColor || '#f59e0b';
  document.getElementById('borderRadius').value = p.borderRadius ?? 24;
  document.getElementById('shadowIntensity').value = p.shadowIntensity ?? 0.5;
  document.getElementById('fontFamily').value = p.fontFamily || 'DM Sans';
  updateRangeLabels();

  setUploadZoneDisplay('pfp', p.pfp && p.pfp !== PFG_DEFAULT ? fullUrl(p.pfp) : '');
  setUploadZoneDisplay('pfp2', p.pfp2 ? fullUrl(p.pfp2) : '');
  setUploadZoneDisplay('bg', p.bgImage ? fullUrl(p.bgImage) : '');
  setUploadZoneDisplay('preview', p.previewImage ? fullUrl(p.previewImage) : '');
  document.getElementById('pfpUrl').value = p.pfp && p.pfp !== PFG_DEFAULT ? (p.pfp.startsWith('/') ? p.pfp : '/' + p.pfp.replace(getBaseUrl(), '')) : '';
  document.getElementById('pfp2Url').value = p.pfp2 ? (p.pfp2.startsWith('/') ? p.pfp2 : p.pfp2.replace(getBaseUrl(), '')) : '';
  document.getElementById('bgUrl').value = p.bgImage ? (p.bgImage.startsWith('/') ? p.bgImage : p.bgImage.replace(getBaseUrl(), '')) : '';
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
  const map = { pfp: ['pfpZone','pfpPreview','pfpUrl'], pfp2: ['pfp2Zone','pfp2Preview','pfp2Url'], bg: ['bgZone','bgPreview','bgUrl'], preview: ['previewZone','previewImagePreview','previewUrl'] };
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
  r('tiltX','tiltXVal'); r('tiltY','tiltYVal'); r('tiltDuration','tiltDurationVal'); r('scaleOnHover','scaleVal');
  r('borderRadius','radiusVal'); r('shadowIntensity','shadowVal');
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

  let bg = p.bgColor || '#0f0f11';
  if (p.bgImage) bg = `url(${fullUrl(p.bgImage)}) center/cover`;
  const glow = p.glowOnHover ? `rgba(${hexToRgb(p.accentColor).join(',')},${(p.shadowIntensity || 0.5) * 0.4})` : 'transparent';

  card.style.cssText = `
    --card-glow: ${glow};
    background: ${bg};
    border-color: rgba(255,255,255,0.1);
    border-radius: ${p.borderRadius}px;
    transition: transform ${p.tiltDuration}s ease, box-shadow ${p.tiltDuration}s ease;
    font-family: '${p.fontFamily}', sans-serif;
    box-shadow: 0 20px 40px -12px rgba(0,0,0,${0.3 + (p.shadowIntensity || 0.5) * 0.2});
    backdrop-filter: ${p.blurBg ? 'blur(12px)' : 'none'};
  `;
  card.classList.toggle('switch-pfp', p.switchPfpOnHover);
  card.classList.toggle('glow-on-hover', p.glowOnHover);

  const pfpUrl = p.pfp ? fullUrl(p.pfp) : PFG_DEFAULT;
  const pfp2Url = p.pfp2 ? fullUrl(p.pfp2) : '';
  card.innerHTML = `
    <div class="pfp-container">
      ${pfpHtml(pfpUrl, p.pfpShape, PFG_DEFAULT)}
      ${pfpHoverHtml(pfp2Url, p.pfpShape)}
    </div>
    <div class="display-name">${escapeHtml(p.displayName || user?.username || 'Your Name')}</div>
    <div class="description">${escapeHtml(p.description || 'Your bio goes here...')}</div>
    <div class="links">
      ${(p.links || []).slice(0, 5).map(l => `<a href="${escapeHtml(l.url)}" class="link" target="_blank" rel="noopener" style="--accent:${p.accentColor}">${escapeHtml(l.title || 'Link')}</a>`).join('')}
      ${!p.links?.length ? '<span class="link" style="opacity:0.5">Add links →</span>' : ''}
    </div>
  `;
  card.onmouseenter = () => {
    const tx = p.tiltX || 0, ty = p.tiltY || 0, scale = p.scaleOnHover || 1.02;
    card.style.transform = `perspective(1000px) rotateX(${ty}deg) rotateY(${tx}deg) scale(${scale})`;
  };
  card.onmouseleave = () => { card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'; };
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
      if (urlId !== 'musicUrl') setUploadZoneDisplay(urlId.replace('Url',''), getBaseUrl() + url);
      if (onSuccess) onSuccess(); else setUploadZoneDisplay(urlId.replace('Url',''), getBaseUrl() + url);
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

  setupUpload('pfpZone','pfpInput','/api/upload/pfp','pfp','pfpUrl');
  setupUpload('pfp2Zone','pfp2Input','/api/upload/pfp2','pfp2','pfp2Url');
  setupUpload('bgZone','bgInput','/api/upload/bg','bg','bgUrl');
  setupUpload('previewZone','previewInput','/api/upload/preview','preview','previewUrl');
  setupUpload('musicZone','musicInput','/api/upload/music','music','musicUrl', () => {
    const mz = document.getElementById('musicZone');
    const ml = document.getElementById('musicLabel');
    if (mz && ml) { mz.classList.add('has-file'); ml.textContent = 'Track uploaded'; }
  });

  ['displayName','description','customLink','musicUrl','switchPfpOnHover','pfpShape','tiltX','tiltY','tiltDuration','scaleOnHover','glowOnHover','bgColor','bgColorText','blurBg','accentColor','accentColorText','borderRadius','shadowIntensity','fontFamily','previewTitle','previewDescription'].forEach(id => {
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
