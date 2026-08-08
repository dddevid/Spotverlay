const { invoke } = window.__TAURI__.core;

document.getElementById('btnStart').addEventListener('click', async () => {
  await invoke('complete_first_run');
});
