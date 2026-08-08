const { invoke } = window.__TAURI__.core;

let currentSettings = {};

const switchEl = document.getElementById('switchAlwaysOnTop');
const toggleRow = document.getElementById('toggleAlwaysOnTop');
const posBtns = document.querySelectorAll('.pos-btn');
const animBtns = document.querySelectorAll('.seg-btn');
const saveFeedback = document.getElementById('saveFeedback');
let feedbackTimer = null;

async function init() {
  currentSettings = await invoke('get_settings');

  if (currentSettings.alwaysOnTop) {
    switchEl.classList.add('on');
  } else {
    switchEl.classList.remove('on');
  }
  
  selectPosition(currentSettings.position || 'top-right');
  selectAnimation(currentSettings.animation || 'fade');
}

toggleRow.addEventListener('click', () => {
  currentSettings.alwaysOnTop = !currentSettings.alwaysOnTop;
  switchEl.classList.toggle('on', currentSettings.alwaysOnTop);
});

posBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    selectPosition(btn.dataset.pos);
  });
});

animBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    selectAnimation(btn.dataset.anim);
  });
});

function selectPosition(pos) {
  currentSettings.position = pos;
  posBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.pos === pos);
  });
}

function selectAnimation(anim) {
  currentSettings.animation = anim;
  animBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.anim === anim);
  });
}

document.getElementById('btnSave').addEventListener('click', async () => {
  await invoke('save_settings', {
    newSettings: {
      alwaysOnTop: currentSettings.alwaysOnTop,
      position: currentSettings.position,
      animation: currentSettings.animation,
      firstRun: currentSettings.firstRun,
    }
  });

  clearTimeout(feedbackTimer);
  saveFeedback.classList.add('visible');
  feedbackTimer = setTimeout(() => {
    saveFeedback.classList.remove('visible');
  }, 2000);
});

init();
