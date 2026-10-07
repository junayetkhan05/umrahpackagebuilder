/* ============================================================
   UMRAH BUILDER — CORE / THEME
   Dark/Light mode toggle + save + load
   ============================================================ */

async function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  try {
    const s = await dbGetSetting('settings') || {};
    s.theme = isDark ? 'dark' : 'light';
    await dbSaveSetting('settings', s);
  } catch (e) {}
  updateThemeUI(isDark);
  toast(isDark ? '🌙 Night mode ON' : '☀️ Light mode ON', 'info');
}

function updateThemeUI(isDark) {
  const icon = $('themeIcon');
  const label = $('themeLabel');
  const sIcon = $('settingsThemeIcon');
  const sLabel = $('settingsThemeLabel');
  const sBtn = $('settingsThemeBtn');

  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  if (label) label.textContent = isDark ? 'Day Mode' : 'Night Mode';
  if (sIcon) sIcon.textContent = isDark ? '☀️' : '🌙';
  if (sLabel) sLabel.textContent = isDark ? 'Disable Night Mode' : 'Enable Night Mode';
  if (sBtn) {
    sBtn.classList.toggle('btn-secondary', isDark);
    sBtn.classList.toggle('btn-primary', !isDark);
  }
}

async function loadTheme() {
  try {
    const s = await dbGetSetting('settings') || {};
    const isDark = s.theme === 'dark';
    document.body.classList.toggle('dark', isDark);
    updateThemeUI(isDark);
  } catch (e) {}
}