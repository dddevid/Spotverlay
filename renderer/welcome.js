document.getElementById('btnStart').addEventListener('click', async () => {
  await window.settingsAPI.completeFirstRun();
});
