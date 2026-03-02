const PFG_DEFAULT = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

function getBaseUrl() { return window.location.origin; }
function fullUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return getBaseUrl() + (path.startsWith('/') ? path : '/' + path);
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
  const full = fullUrl(url);
  if (!full) return `<img class="pfp" src="${fallback}" alt="" style="${style}">`;
  if (isVideoUrl(full)) return `<video class="pfp" autoplay muted loop playsinline style="${style}" src="${full}"></video>`;
  return `<img class="pfp" src="${full}" alt="" onerror="this.src='${fallback}'" style="${style}">`;
}

function pfpHoverHtml(url, shape) {
  if (!url) return '';
  const full = fullUrl(url);
  const radius = pfpRadius(shape);
  const style = `border-radius:${radius}`;
  if (isVideoUrl(full)) return `<video class="pfp-hover" autoplay muted loop playsinline style="${style}" src="${full}"></video>`;
  return `<img class="pfp-hover" src="${full}" alt="" onerror="this.style.display='none'" style="${style}">`;
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

function buildCard(p, displayName, viewCount) {
  const borderC = p.borderColor || 'rgba(255,255,255,0.1)';
  const borderColorRgb = hexToRgb(p.borderColor || '#ffffff');
  const borderColorWithOpacity = `rgba(${borderColorRgb.join(',')}, ${p.borderOpacity ?? 0.1})`;

  const glow = p.glowOnHover ? `rgba(${hexToRgb(p.accentColor).join(',')},${(p.shadowIntensity ?? 0.5) * 0.4})` : 'transparent';
  const tx = p.tiltX ?? 10, ty = p.tiltY ?? 10, scale = p.scaleOnHover ?? 1.02;

  let bg = p.bgColor || '#0f0f11';
  if (p.bgGradient && p.gradientStart && p.gradientEnd) {
    bg = `linear-gradient(${p.gradientAngle ?? 135}deg, ${p.gradientStart}, ${p.gradientEnd})`;
  } else if (p.bgImage) {
    bg = `url(${fullUrl(p.bgImage)}) center/cover`;
  }

  // Image filters
  const imgFilters = [];
  if (p.grayscaleEffect) imgFilters.push('grayscale(100%)');
  if (p.sepiaEffect) imgFilters.push('sepia(100%)');
  if (p.imgBrightness !== 100) imgFilters.push(`brightness(${p.imgBrightness ?? 100}%)`);
  if (p.imgContrast !== 100) imgFilters.push(`contrast(${p.imgContrast ?? 100}%)`);
  if (p.imgSaturation !== 100) imgFilters.push(`saturate(${p.imgSaturation ?? 100}%)`);
  const filterStr = imgFilters.length ? imgFilters.join(' ') : 'none';
  const textShadowStr = (p.textShadow ?? 0) > 0 ? `0 2px ${(p.textShadow ?? 0) * 2}px rgba(0,0,0,0.5)` : 'none';

  const card = document.createElement('div');
  card.className = 'profile-card' + (p.switchPfpOnHover ? ' switch-pfp' : '') + (p.glowOnHover ? ' glow-on-hover' : '');

  // Hover Animation Class
  if (p.hoverAnimation === 'lift') card.classList.add('hover-lift');
  else if (p.hoverAnimation === 'bounce') card.classList.add('hover-bounce');
  else if (p.hoverAnimation === 'shake') card.classList.add('hover-shake');

  card.style.cssText = `
    --card-glow: ${glow};
    --scale: ${scale};
    background: ${bg};
    border: ${p.borderWidth ?? 1}px ${p.borderStyle ?? 'solid'} ${borderColorWithOpacity};
    border-radius: ${p.borderRadius ?? 24}px;
    width: ${p.cardWidth ?? 340}px;
    padding: ${p.cardPadding ?? 32}px;
    opacity: ${p.cardOpacity ?? 1};
    transform: rotate(${p.cardRotation ?? 0}deg);
    transition: transform ${p.tiltDuration ?? 0.3}s ease, box-shadow ${p.tiltDuration ?? 0.3}s ease, opacity 0.3s ease;
    font-family: '${p.fontFamily || 'DM Sans'}', sans-serif;
    font-size: ${p.fontSize ?? 16}px;
    font-weight: ${p.fontWeight ?? '400'};
    text-align: ${p.textAlign ?? 'center'};
    text-shadow: ${textShadowStr};
    box-shadow: 0 20px 40px -12px rgba(0,0,0,${0.3 + (p.shadowIntensity ?? 0.5) * 0.2})${p.borderGlow ? `, 0 0 20px ${p.accentColor}` : ''};
    backdrop-filter: ${p.blurBg ? 'blur(12px)' : 'none'};
    filter: ${filterStr};
  `;

  // Entrance Animation
  if (p.cardEntrance && p.cardEntrance !== 'none') {
    card.classList.add('animate-' + p.cardEntrance);
    card.style.setProperty('--dur', (p.entranceDuration ?? 0.6) + 's');
  }

  const pfpUrl = p.pfp ? fullUrl(p.pfp) : PFG_DEFAULT;
  const pfp2Url = p.pfp2 ? fullUrl(p.pfp2) : '';

  const textAnimClass = p.textAnimation && p.textAnimation !== 'none' ? `text-animate-${p.textAnimation}` : '';

  card.innerHTML = `
    <div class="pfp-container">
      ${pfpHtml(pfpUrl, p.pfpShape, PFG_DEFAULT)}
      ${pfpHoverHtml(pfp2Url, p.pfpShape)}
    </div>
    <div class="display-name ${textAnimClass}" style="color:inherit">${escapeHtml(displayName)}</div>
    <div class="description ${textAnimClass}" style="color:inherit;opacity:0.8">${escapeHtml(p.description || '')}</div>
    ${viewCount > 0 ? `<div class="profile-views ${textAnimClass}">${viewCount.toLocaleString()} view${viewCount === 1 ? '' : 's'}</div>` : ''}
    <div class="links ${textAnimClass}" style="gap:${p.elementSpacing ?? 16}px">
      ${(p.links || []).map(l => `
        <a href="${escapeHtml(l.url)}" class="link style-${p.linkStyle ?? 'default'}" target="_blank" rel="noopener" style="--accent:${p.accentColor || '#f59e0b'}">${escapeHtml(l.title || 'Link')}</a>
      `).join('')}
    </div>
  `;

  if (p.hoverAnimation === 'tilt' || !p.hoverAnimation) {
    card.onmouseenter = () => {
      card.style.transform = `perspective(1000px) rotateX(${ty}deg) rotateY(${tx}deg) scale(${scale}) rotate(${p.cardRotation ?? 0}deg)`;
    };
    card.onmouseleave = () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) rotate(${p.cardRotation ?? 0}deg)`;
    };
  }

  return card;
}

function showGate(slug, displayName, accentColor, onEnter) {
  const overlay = document.createElement('div');
  overlay.className = 'gate-overlay';
  overlay.innerHTML = `
    <div class="gate-content">
      <p class="gate-question">Do you want to enter?</p>
      <p class="gate-name">${escapeHtml(displayName)}</p>
      <p class="gate-hint">Click anywhere to continue</p>
    </div>
  `;
  overlay.style.setProperty('--accent', accentColor || '#f59e0b');
  document.body.appendChild(overlay);

  overlay.addEventListener('click', function one(e) {
    overlay.removeEventListener('click', one);
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    overlay.style.setProperty('--x', x + '%');
    overlay.style.setProperty('--y', y + '%');
    overlay.classList.add('gate-reveal');

    const duration = 850;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const r = t * 180;
      overlay.style.setProperty('--r', r + '%');
      if (t < 1) requestAnimationFrame(tick);
      else {
        overlay.remove();
        sessionStorage.setItem('profile_entered_' + slug, '1');
        onEnter();
      }
    }
    requestAnimationFrame(tick);
  });
}

function playMusic(musicUrl) {
  if (!musicUrl) return;
  const src = fullUrl(musicUrl);
  const audio = document.createElement('audio');
  audio.src = src;
  audio.loop = true;
  audio.volume = 0.6;
  audio.play().catch(() => { });
  document.body.appendChild(audio);
}

const CURSOR_PRESETS = {
  'img-aim': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke="red" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="30" stroke="red" stroke-width="2"/><line x1="2" y1="16" x2="30" y2="16" stroke="red" stroke-width="2"/></svg>',
  'img-sword': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M28 4l-4-4-18 18-2 6 6-2z" fill="cyan" stroke="black"/><path d="M4 28l4 4 4-4-4-4z" fill="brown" stroke="black"/></svg>',
  'img-pickaxe': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M2 2l28 28" stroke="brown" stroke-width="4"/><path d="M2 30c0-10 10-20 28-28l-8 28c-10-8-20-10-20 0" fill="gray" stroke="black"/></svg>',
  'img-trident': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 32V8m-8 4V4m16 8V4m-16 8c0 4 16 4 16 0" stroke="gold" stroke-width="2" fill="none"/></svg>',
  'img-potion': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M10 30h12l-2-20h-8z" fill="purple" stroke="white"/><path d="M14 10V4h4v6" stroke="white" fill="none"/></svg>',
  'img-sparkle': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 2l2 10 10 2-10 2-2 10-2-10-10-2 10-2z" fill="white" stroke="cyan"/></svg>',
  'img-heart': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 28s-12-8-12-16a8 8 0 0 1 16 0 8 8 0 0 1 16 0c0 8-12 16-12 16z" fill="pink" stroke="deeppink"/></svg>',
  'img-star': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 2l4 10h10l-8 6 3 11-9-7-9 7 3-11-8-6h10z" fill="gold" stroke="orange"/></svg>',
  'img-butterfly': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 16c4-8 12-8 12 0s-8 8-12 0-12 8-12 0 8-8 12 0" fill="skyblue" stroke="blue"/></svg>',
  'img-rose': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="12" r="8" fill="red"/><path d="M16 20v10" stroke="green" stroke-width="2"/></svg>',
  'img-arrow': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M4 4l20 10-10 2-2 10z" fill="white" stroke="black"/></svg>',
  'img-dot': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="6" fill="red" stroke="white" stroke-width="2"/></svg>',
  'img-ring': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="none" stroke="cyan" stroke-width="2"/><circle cx="16" cy="16" r="4" fill="cyan"/></svg>',
  'img-glitch': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="4" y="4" width="20" height="20" fill="lime" opacity="0.5"/><rect x="8" y="8" width="20" height="20" fill="magenta" opacity="0.5"/></svg>',
  'img-matrix': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="8" y="24" fill="lime" font-family="monospace" font-weight="bold">01</text></svg>',
  'img-skull': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 4c-6 0-10 4-10 10 0 4 2 8 6 10v4h8v-4c4-2 6-6 6-10 0-6-4-10-10-10z" fill="white" stroke="black"/><circle cx="12" cy="14" r="2" fill="black"/><circle cx="20" cy="14" r="2" fill="black"/></svg>',
  'img-ghost': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M6 30c0-10 4-26 10-26s10 16 10 26c-2-2-4-2-5 0s-3 2-5 0-3-2-5 0-3 2-5 0" fill="white" opacity="0.8"/><circle cx="12" cy="14" r="1.5" fill="black"/><circle cx="20" cy="14" r="1.5" fill="black"/></svg>',
  'img-blade': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M4 28l24-24" stroke="gray" stroke-width="4"/><path d="M4 28l4 4 4-4-4-4z" fill="black"/></svg>',
  'img-bat': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 12c-4-4-12-4-12 4s8 4 12 0 8 4 12 0-8-8-12-4" fill="black"/></svg>',
  'img-scythe': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M8 30l16-24" stroke="brown" stroke-width="2"/><path d="M24 6c-10 0-20 4-20 12 10-4 20-4 20-12" fill="silver" stroke="black"/></svg>',
  'img-crown': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M4 24l4-12 8 8 8-8 4 12z" fill="gold" stroke="orange"/></svg>',
  'img-money': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="4" y="10" width="24" height="12" rx="2" fill="lightgreen" stroke="darkgreen"/><text x="12" y="19" fill="darkgreen" font-size="10">$</text></svg>',
  'img-alien': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 4c-6 0-10 6-10 12 0 8 4 12 10 12s10-4 10-12c0-6-4-12-10-12z" fill="lime"/><ellipse cx="12" cy="14" rx="3" ry="5" fill="black"/><ellipse cx="20" cy="14" rx="3" ry="5" fill="black"/></svg>',
  'img-rocket': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 4s-6 10-6 20h12c0-10-6-20-6-20z" fill="white" stroke="red"/><path d="M10 24l-4 4v4l4-4M22 24l4 4v4l-4-4" stroke="red" fill="none"/></svg>'
};

function applyCursor(cursor, target = document.body) {
  if (!cursor || cursor === 'default') {
    target.style.cursor = 'default';
    return;
  }
  if (cursor === 'none') {
    target.style.cursor = 'none';
    return;
  }
  if (CURSOR_PRESETS[cursor]) {
    target.style.cursor = `url("${CURSOR_PRESETS[cursor]}") 16 16, auto`;
  } else {
    target.style.cursor = cursor;
  }
}

window.initCursorEffects = function (effect, container = document.body) {
  // Cleanup existing
  const oldCanvas = container.querySelector('.cursor-effects-canvas');
  if (oldCanvas) oldCanvas.remove();

  if (!effect || effect === 'none') return;

  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-effects-canvas';
  canvas.style.position = (container === document.body) ? 'fixed' : 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '100000';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let mouse = { x: -100, y: -100, lastX: -100, lastY: -100 };

  function resize() {
    const rect = container.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
  }
  window.addEventListener('resize', resize);
  resize();

  const moveHandler = e => {
    const rect = container.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

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
      ctx.font = '15px monospace';
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      for (let i = 0; i < 5; i++) ctx.fillText(Math.random() > 0.5 ? '0' : '1', Math.random() * width, Math.random() * height);
    }

    if (effect === 'glitch') {
      if (Math.random() > 0.95) {
        ctx.fillStyle = `rgba(${Math.random() * 255},0,0,0.15)`;
        ctx.fillRect(0, Math.random() * height, width, 5);
      }
    }

    if (effect === 'velocity') {
      ctx.beginPath();
      ctx.moveTo(mouse.x, mouse.y);
      ctx.lineTo(mouse.x - (mouse.x - mouse.lastX) * 5, mouse.y - (mouse.y - mouse.lastY) * 5);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
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
      mouse.ghostX += (mouse.x - mouse.ghostX) * 0.1;
      mouse.ghostY += (mouse.y - mouse.ghostY) * 0.1;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.arc(mouse.ghostX, mouse.ghostY, 6, 0, Math.PI * 2); ctx.fill();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= 0.015;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;

      if (p.type === 'star') {
        ctx.font = `${p.size}px serif`; ctx.fillText('⭐', p.x, p.y);
      } else if (p.type === 'heart') {
        ctx.font = `${p.size}px serif`; ctx.fillText('❤️', p.x, p.y);
      } else if (p.type === 'orb') {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, p.color); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'ripple') {
        ctx.strokeStyle = p.color; ctx.beginPath();
        ctx.arc(p.x, p.y, (1 - p.life) * 40, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();

  return () => {
    active = false;
    canvas.remove();
    container.removeEventListener('mousemove', moveHandler);
  };
};

async function load() {
  const slug = window.__PROFILE_SLUG__ || (() => { const m = window.location.pathname.match(/\/c\/([^/]+)/); return m ? m[1] : new URLSearchParams(location.search).get('u'); })();
  if (!slug) {
    document.getElementById('error').textContent = 'Profile not found';
    return;
  }

  const res = await fetch(`/api/c/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    document.getElementById('error').textContent = 'Profile not found';
    return;
  }
  const data = await res.json();
  const p = data.profile || {};
  const displayName = data.displayName || data.username || 'User';
  const viewCount = data.viewCount ?? 0;
  const musicUrl = p.musicUrl || '';

  const card = buildCard(p, displayName, viewCount);
  const container = document.getElementById('cardContainer');
  container.appendChild(card);
  document.title = `${displayName} — Card.lol`;

  // Apply cursor and effects
  applyCursor(p.customCursor);
  initCursorEffects(p.cursorEffect);

  // Apply page background
  const profilePage = document.querySelector('.profile-page');
  if (profilePage) {
    if (p.pageBgUrl) {
      const pageBgFull = fullUrl(p.pageBgUrl);
      if (isVideoUrl(pageBgFull)) {
        const video = document.createElement('video');
        video.className = 'bg-video';
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.src = pageBgFull;
        if (p.blurPageBg) video.style.filter = 'blur(12px)';
        document.body.insertBefore(video, document.body.firstChild);
      } else {
        profilePage.style.backgroundImage = `url(${pageBgFull})`;
        profilePage.style.backgroundSize = 'cover';
        profilePage.style.backgroundPosition = 'center';
        profilePage.style.backgroundAttachment = 'fixed';
        if (p.blurPageBg) profilePage.style.filter = 'blur(12px)';
      }
    } else if (p.pageBgColor) {
      profilePage.style.backgroundColor = p.pageBgColor;
    }
  }

  const alreadyEntered = sessionStorage.getItem('profile_entered_' + slug);

  if (alreadyEntered) {
    playMusic(musicUrl);
    return;
  }

  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  const homeLink = document.querySelector('.profile-home');
  if (homeLink) homeLink.style.visibility = 'hidden';

  showGate(slug, displayName, p.accentColor, () => {
    container.style.opacity = '1';
    container.style.pointerEvents = '';
    if (homeLink) homeLink.style.visibility = '';
    playMusic(musicUrl);
  });
}

load();
