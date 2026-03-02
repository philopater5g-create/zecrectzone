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
