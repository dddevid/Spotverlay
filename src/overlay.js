// Tauri v2 — use the global __TAURI__ injected by withGlobalTauri: true
const { listen } = window.__TAURI__.event;
const { invoke } = window.__TAURI__.core;

const card = document.getElementById('card');
const artEl = document.getElementById('art');
const artWrap = document.getElementById('artWrap');
const titleEl = document.getElementById('title');
const artistEl = document.getElementById('artist');

function setArtwork(thumbnailUrl) {
  if (!thumbnailUrl) {
    artEl.removeAttribute('src');
    artWrap.classList.add('no-art');
    return;
  }
  artEl.onerror = () => {
    artEl.removeAttribute('src');
    artWrap.classList.add('no-art');
  };
  artEl.onload = () => {
    artWrap.classList.remove('no-art');
  };
  artEl.src = thumbnailUrl;
}

function showCard() {
  // Force a reflow so the browser registers the transition from the hidden state.
  // Without this, if the card was just created or its position class changed,
  // Chromium/WebView2 may batch the class addition and skip the transition.
  void card.offsetWidth;
  card.classList.add('show');
}

function hideCard() {
  void card.offsetWidth;
  card.classList.remove('show');
}

// ── Event listeners ─────────────────────────────────────────────────────────

listen('now-playing', (event) => {
  const data = event.payload;
  titleEl.textContent = data.title || 'Unknown title';
  artistEl.textContent = data.artist || '\u00A0';
  setArtwork(data.thumbnailUrl);
  card.classList.toggle('playing', !!data.playing);
});

listen('show-card', () => showCard());
listen('hide-card', () => hideCard());

listen('settings-updated', (event) => {
  applySettings(event.payload);
});

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const settings = await invoke('get_settings');
  applySettings(settings);
}

function applySettings(settings) {
  // Preserve the current show state so applying settings doesn't reset the animation
  const wasShowing = card.classList.contains('show');

  document.body.className = '';
  document.body.classList.add(`pos-${settings.position || 'top-right'}`);
  document.body.classList.add(`anim-${settings.animation || 'fade'}`);

  // Restore show state after class reset (without triggering another transition)
  if (wasShowing) {
    card.classList.add('show');
  }
}

init();
