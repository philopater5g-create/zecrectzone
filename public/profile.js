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
  "img-aim": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSIxNiIgeTE9IjIiIHgyPSIxNiIgeTI9IjMwIiBzdHJva2U9InJlZCIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjIiIHkxPSIxNiIgeDI9IjMwIiB5Mj0iMTYiIHN0cm9rZT0icmVkIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=",
  "img-sword": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMjggNGwtNC00LTE4IDE4LTIgNiA2LTJ6IiBmaWxsPSJjeWFuIiBzdHJva2U9ImJsYWNrIi8+PHBhdGggZD0iTTQgMjhsNCA0IDQtNC00LTR6IiBmaWxsPSJicm93biIgc3Ryb2tlPSJibGFjayIvPjwvc3ZnPg==",
  "img-pickaxe": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMiAybDI4IDI4IiBzdHJva2U9ImJyb3duIiBzdHJva2Utd2lkdGg9IjQiLz48cGF0aCBkPSJNMiAzMGMwLTEwIDEwLTIwIDI4LTI4bC04IDI4Yy0xMC04LTIwLTEwLTIwIDAiIGZpbGw9ImdyYXkiIHN0cm9rZT0iYmxhY2siLz48L3N2Zz4=",
  "img-trident": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMTYgMzJWOG0tOCA0VjRtMTYgOFY0bS0xNiA4YzAgNCAxNiA0IDE2IDAiIHN0cm9rZT0iZ29sZCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PC9zdmc+",
  "img-potion": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMjAgMzBIOHUtMi0yMGgtOHoiIGZpbGw9InB1cnBsZSIgc3Ryb2tlPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0xNCAxMFY0aDR2NiIgc3Ryb2tlPSJ3aGl0ZSIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
  "img-sparkle": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMTYgMmwyIDEwIDEwIDItMTAgMi0yIDEwLTItMTAtMTAtMiAxMC0yeiIgZmlsbD0id2hpdGUiIHN0cm9rZT0iY3lhbiIvPjwvc3ZnPg==",
  "img-heart": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMTYgMjhzLTEyLTgtMTItMTZhOCA4IDAgMCAxIDE2IDAgOCA4IDAgMCAxIDE2IDBjMCA4LTEyIDE2LTEyIDE2eiIgZmlsbD0icGluayIgc3Ryb2tlPSJkZWVwcGluayIvPjwvc3ZnPg==",
  "img-star": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMTYgMmw0IDEwaDEwbC04IDYgMyAxMS05LTctOSA3IDMtMTEtOC02aDEweiIgZmlsbD0iZ29sZCIgc3Ryb2tlPSJvcmFuZ2UiLz48L3N2Zz4=",
  "img-butterfly": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMTYgMTZjNC04IDEyLTggMTIgMHMtOCA4LTEyIDAtMTIgOC0xMiAwIDgtOCAxMiAwIiBmaWxsPSJza3libHVlIiBzdHJva2U9ImJsdWUiLz48L3N2Zz4=",
  "img-rose": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjEyIiByPSI4IiBmaWxsPSJyZWQiLz48cGF0aCBkPSJNMTYgMjB2MTAiIHN0cm9rZT0iZ3JlZW4iIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==",
  "img-arrow": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNNCA0bDIwIDEwLTEwIDItMiAxMHoiIGZpbGw9IndoaXRlIiBzdHJva2U9ImJsYWNrIi8+PC9zdmc+",
  "img-dot": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI2IiBmaWxsPSJyZWQiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==",
  "img-ring": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjeWFuIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI0IiBmaWxsPSJjeWFuIi8+PC9zdmc+",
  "img-glitch": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9ImxpbWUiIG9wYWNpdHk9IjAuNSIvPjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibWFnZW50YSIgb3BhY2l0eT0iMC41Ii8+PC9zdmc+",
  "img-matrix": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48dGV4dCB4PSI4IiB5PSIyNCIgZmlsbD0ibGltZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC13ZWlnaHQ9ImJvbGQiPjAxPC90ZXh0Pjwvc3ZnPg==",
  "img-skull": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMTYgNGMtNiAwLTEwIDQtMTAgMTAgMCA0IDIgOCA2IDEwdjRoOHYtNGM0LTIgNi02IDYtMTAgMC02LTQtMTAtMTAtMTB6IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJibGFjayIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTQiIHI9IjIiIGZpbGw9ImJsYWNrIi8+PGNpcmNsZSBjeD0iMjAiIGN5PSIxNCIgcj0iMiIgZmlsbD0iYmxhY2siLz48L3N2Zz4=",
  "img-ghost": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNNiAzMGMwLTEwIDQtMjYgMTAtMjZzMTAgMTYgMTAgMjZjLTItMi00LTItNSAwcy0zIDItNSAwLTMtMi01IDAtMyAyLTUgMCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuOCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTQiIHI9IjEuNSIgZmlsbD0iYmxhY2siLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjE0IiByPSIxLjUiIGZpbGw9ImJsYWNrIi8+PC9zdmc+",
  "img-blade": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNNCAyOGwyNC0yNCIgc3Ryb2tlPSJncmF5IiBzdHJva2Utd2lkdGg9IjQiLz48cGF0aCBkPSJNNCAyOGw0IDQgNC00LTQtNHoiIGZpbGw9ImJsYWNrIi8+PC9zdmc+",
  "img-bat": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMTYgMTJjLTQtNC0xMi00LTEyIDRzOCA0IDEyIDAgOCA0IDEyIDAtOC04LTEyLTQiIGZpbGw9ImJsYWNrIi8+PC9zdmc+",
  "img-scythe": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNOCAzMGwxNi0yNCIgc3Ryb2tlPSJicm93biIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTI0IDZjLTEwIDAtMjAgNC0yMCAxMiAxMC00IDIwLTQgMjAtMTIiIGZpbGw9InNpbHZlciIgc3Ryb2tlPSJibGFjayIvPjwvc3ZnPg==",
  "img-crown": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNNCAyNGw0LTEyIDggOCA4LTggNCAxMnoiIGZpbGw9ImdvbGQiIHN0cm9rZT0ib3JhbmdlIi8+PC9zdmc+",
  "img-money": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cmVjdCB4PSI0IiB5PSIxMCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjEyIiByeD0iMiIgZmlsbD0ibGlnaHRncmVlbiIgc3Ryb2tlPSJkYXJrZ3JlZW4iLz48dGV4dCB4PSIxMiIgeT0iMTkiIGZpbGw9ImRhcmtncmVlbiIgZm9udC1zaXplPSIxMCI+JDwvdGV4dD48L3N2Zz4=",
  "img-alien": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMTYgNGMtNiAwLTEwIDYtMTAgMTIgMCA4IDQgMTIgMTAgMTJzMTAtNCAxMC0xMmMwLTYtNC0xMi0xMC0xMnoiIGZpbGw9ImxpbWUiLz48ZWxsaXBzZSBjeD0iMTIiIGN5PSIxNCIgcng9IjMiIHJ5PSI1IiBmaWxsPSJibGFjayIvPjxlbGxpcHNlIGN4PSIyMCIgY3k9IjE0IiByeD0iMyIgcnk9IjUiIGZpbGw9ImJsYWNrIi8+PC9zdmc+",
  "img-rocket": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBkPSJNMTYgNHMtNiAxMC02IDIwaDEyYzAtMTAtNi0yMC02LTIweiIgZmlsbD0id2hpdGUiIHN0cm9rZT0icmVkIi8+PHBhdGggZD0iTTEwIDI0bC00IDR2NGw0LTRNMjIgMjRsNCA0djRsLTQtNCIgc3Ryb2tlPSJyZWQiIGZpbGw9Im5vbmUiLz48L3N2Zz4="
};

function applyCursor(cursor, target = document.body) {
  let cursorVal = 'default';
  if (cursor === 'none') {
    cursorVal = 'none';
  } else if (cursor === 'url' && window.__CUSTOM_CURSOR_URL__) {
    cursorVal = `url("${fullUrl(window.__CUSTOM_CURSOR_URL__)}"), auto`;
  } else if (CURSOR_PRESETS[cursor]) {
    cursorVal = `url("${CURSOR_PRESETS[cursor]}") 16 16, auto`;
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

  styleTag.textContent = `
    .profile-page, .gate-overlay, body { cursor: ${cursorVal} !important; }
    a, button, .link, [role="button"] { cursor: pointer; }
  `;
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
    if (canvas.style.position === 'fixed') {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    } else {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

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
  window.__CUSTOM_CURSOR_URL__ = p.customCursorUrl;
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
