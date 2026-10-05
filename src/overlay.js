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
  void card.offsetWidth;
  card.classList.add('show');
}
function hideCard() {
  void card.offsetWidth;
  card.classList.remove('show');
}
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
async function init() {
  const settings = await invoke('get_settings');
  applySettings(settings);
}
function applySettings(settings) {
  const wasShowing = card.classList.contains('show');
  document.body.className = '';
  document.body.classList.add(`pos-${settings.position || 'top-right'}`);
  document.body.classList.add(`anim-${settings.animation || 'fade'}`);
  if (wasShowing) {
    card.classList.add('show');
  }
}
init();
