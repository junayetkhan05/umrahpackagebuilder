/* ============================================================
   UMRAH BUILDER — BUILDER / TEMPLATES
   Apply quick-start template (Economy/Standard/Premium/Ramadan)
   ============================================================ */

async function applyTemplate(key) {
  const t = TEMPLATES[key];
  if (!t) return;

  openBuilder();
  setTimeout(async () => {
    if ($('pkgName')) $('pkgName').value = t.name;
    if ($('pkgType')) $('pkgType').value = t.type;

    builderDefaultRoomSharing = t.roomSharing;

    // Create hidden input for roomSharing if not present
    if (!$('roomSharing')) {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.id = 'roomSharing';
      $('builderModal')?.appendChild(hidden);
    }
    if ($('roomSharing')) $('roomSharing').value = t.roomSharing;
    if ($('pkgTemplateKey')) $('pkgTemplateKey').value = key;

    // Set default dates (today + 15 days)
    const todayD = new Date();
    const checkIn = new Date(todayD);
    checkIn.setDate(todayD.getDate() + 15);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + t.nights);

    if ($('pkgCheckIn')) $('pkgCheckIn').value = checkIn.toISOString().slice(0, 10);
    if ($('pkgCheckOut')) $('pkgCheckOut').value = checkOut.toISOString().slice(0, 10);

    calcDuration();
    toast(`✅ Template "${t.name}" loaded — সব price/quantity edit করতে পারবেন`, 'info');
  }, 150);
}