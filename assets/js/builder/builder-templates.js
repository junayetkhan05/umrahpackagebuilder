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

/*
 * Hotel pricing override: this file loads after builder-hotels.js.
 * Use the selected hotel's selling rate when configured; if that room
 * category has no selling rate, fall back to the linked vendor's rate
 * instead of leaving a stale price or displaying zero.
 */
function getHotelDefaultRate(cityType, hotelId, roomType, vendorId = null) {
  if (!hotelId) return 0;

  const master = getHotelMaster(cityType, hotelId);
  if (!master) return 0;

  const sellingRate = Number(master[roomType]);
  if (Number.isFinite(sellingRate) && sellingRate > 0) return sellingRate;

  const linkedVendorId = vendorId || master.vendorId;
  const vendorRate = Number(getHotelVendorRate(cityType, hotelId, roomType, linkedVendorId));
  return Number.isFinite(vendorRate) ? vendorRate : 0;
}

function syncHotelRoomPricing(cityType, hotelItem, room) {
  if (!hotelItem?.hotelId || !room) return;

  const master = getHotelMaster(cityType, hotelItem.hotelId);
  if (!master) return;

  // Refresh from the currently selected hotel's rate on every room-type change.
  room.rate = getHotelDefaultRate(cityType, hotelItem.hotelId, room.type, hotelItem.vendorId);

  const mealField = { breakfast: 'breakfast', half_board: 'halfBoard', full_board: 'fullBoard' }[room.meal];
  if (!mealField) {
    room.mealRate = 0;
    return;
  }

  const mealRate = Number(master[mealField]);
  room.mealRate = Number.isFinite(mealRate) ? mealRate : 0;
}
