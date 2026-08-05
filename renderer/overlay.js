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

window.overlayAPI.onNowPlaying((data) => {
  titleEl.textContent = data.title || 'Unknown title';
  artistEl.textContent = data.artist || '\u00A0';

  setArtwork(data.thumbnailUrl);

  card.classList.toggle('playing', !!data.playing);
});

window.overlayAPI.onShowCard(() => {
  requestAnimationFrame(() => card.classList.add('show'));
});

window.overlayAPI.onHideCard(() => {
  requestAnimationFrame(() => card.classList.remove('show'));
});

async function init() {
  const settings = await window.settingsAPI.getSettings();
  applySettings(settings);

  window.settingsAPI.onSettingsUpdated((newSettings) => {
    applySettings(newSettings);
  });
}

function applySettings(settings) {
  document.body.className = '';
  document.body.classList.add(`pos-${settings.position || 'top-right'}`);
  document.body.classList.add(`anim-${settings.animation || 'fade'}`);
}

init();