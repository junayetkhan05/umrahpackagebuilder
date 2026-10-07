/* ============================================================
   UMRAH BUILDER — BUILDER / ITINERARY
   Auto-generate from dates + drag-drop + render
   ============================================================ */

/* ==================== AUTO-GENERATE ITINERARY ==================== */
function regenerateItineraryFromDates() {
  try {
    const pkgIn = strVal('pkgCheckIn');
    const pkgOut = strVal('pkgCheckOut');

    if (!pkgIn || !pkgOut) {
      itineraryItems = [];
      itC = 0;
      renderItineraryList();
      return;
    }

    const totalNights = daysBetween(pkgIn, pkgOut);
    if (totalNights <= 0) return;
    const totalDays = totalNights + 1;

    // Determine transit day (Makkah → Madinah)
    const makkahHotelWithDates = makkahItems.find(h => h.hotelId && h.checkOut);
    let transitDate, transitDayNum;

    if (makkahHotelWithDates && makkahHotelWithDates.checkOut) {
      transitDate = makkahHotelWithDates.checkOut;
      transitDayNum = daysBetween(pkgIn, transitDate) + 1;
      if (transitDayNum < 2) transitDayNum = 2;
      if (transitDayNum > totalDays - 1) transitDayNum = Math.max(2, totalDays - 1);
      transitDate = addDays(pkgIn, transitDayNum - 1);
    } else {
      transitDayNum = Math.max(2, Math.ceil(totalDays / 2));
      if (transitDayNum > totalDays - 1) transitDayNum = Math.max(2, totalDays - 1);
      transitDate = addDays(pkgIn, transitDayNum - 1);
    }

    // Load Ziyarah master descriptions (safe)
    let makkahZiyarahDesc = '';
    let madinahZiyarahDesc = '';
    try {
      const makkahZiyarah = STORE.ziyarah.find(z => z && z.city === 'Makkah');
      if (makkahZiyarah) makkahZiyarahDesc = buildZiyarahDescriptionFromMaster(makkahZiyarah);
    } catch (e) { console.warn('Makkah ziyarah build failed:', e); }

    try {
      const madinahZiyarah = STORE.ziyarah.find(z => z && z.city === 'Madinah');
      if (madinahZiyarah) madinahZiyarahDesc = buildZiyarahDescriptionFromMaster(madinahZiyarah);
    } catch (e) { console.warn('Madinah ziyarah build failed:', e); }

    const newItinerary = [];

    for (let i = 0; i < totalDays; i++) {
      const date = addDays(pkgIn, i);
      const dayNum = i + 1;
      let city = '', title = '', description = '', fixed = false, type = '', ziyarahZone = null, zone = '';

      if (i === totalDays - 1) {
        city = 'Transit';
        title = 'Departure';
        type = 'departure';
        fixed = true;
        zone = 'transit';
        description = `Activities\n\nBreakfast at the hotel.\n\nCheck out from the hotel.\n\nPrivate transfer to the airport.\n\nDeparture for your return journey.`;
      } else if (i === 0) {
        city = 'Makkah';
        title = 'Arrival in Jeddah – Transfer to Makkah';
        type = 'arrival';
        fixed = true;
        zone = 'makkah';
        description = `Activities\n\nDeparture from Dhaka to Jeddah International Airport.\n\nMeet & greet by our airport representative upon arrival.\n\nPrivate transfer from Jeddah Airport to your hotel in Makkah.\n\nCheck in and relax after your journey.\n\nPerform your Umrah under the guidance of our experienced tour guide.`;
      } else if (dayNum === transitDayNum) {
        city = 'Transit';
        title = 'Transfer from Makkah to Madinah';
        type = 'transfer';
        fixed = true;
        zone = 'transit';
        description = `Activities\n\nBreakfast at the hotel.\n\nCheck out from the Makkah hotel.\n\nTransfer to Madinah by private air-conditioned vehicle.\n\nJourney duration: Approximately 5–6 hours (Non-stop).\n\nCheck in to the Madinah hotel.\n\nOffer prayers at Masjid An-Nabawi and spend the evening in Ibadah.`;
      } else if (dayNum < transitDayNum) {
        zone = 'makkah';
        if (dayNum === 2) {
          city = 'Makkah';
          title = 'Perform Umrah';
          type = 'umrah';
          description = `Activities\n\nBreakfast at the hotel.\n\nPerform Umrah under the guidance of our experienced tour guide.`;
        } else if (dayNum === 3) {
          city = 'Makkah';
          title = 'Ziyarah Tour in Makkah';
          type = 'ziyarah';
          ziyarahZone = 'makkah';
          description = makkahZiyarahDesc || `Activities\n\nAfter breakfast, guided Ziyarah tour of historical Islamic sites in Makkah.\n\nPlaces to Visit\n\nMina\n\nArafat (Mount Arafat)\n\nMuzdalifah\n\nJabal Al-Noor (Cave of Hira)\n\nJabal Thawr\n\nJamarat\n\nJannat Al-Mu'alla`;
        } else {
          city = 'Makkah';
          title = 'Worship & Spiritual Activities in Makkah';
          type = 'worship';
          description = `Activities\n\nBreakfast at the hotel.\n\nPerform Salah at Masjid Al Haram.\n\nPerform Nafl Tawaf.\n\nRecite the Holy Qur'an.\n\nEngage in Dhikr and Du'a.`;
        }
      } else {
        zone = 'madinah';
        if (dayNum === transitDayNum + 1) {
          city = 'Madinah';
          title = 'Ziyarah Tour in Madinah';
          type = 'ziyarah';
          ziyarahZone = 'madinah';
          description = madinahZiyarahDesc || `Activities\n\nAfter breakfast, guided Ziyarah tour of historical Islamic sites in Madinah.\n\nPlaces to Visit\n\nMasjid Quba\n\nMasjid Al-Qiblatain\n\nUhud Mountain & Martyrs Cemetery\n\nMasjid Al-Jumu'ah`;
        } else {
          city = 'Madinah';
          title = 'Worship & Spiritual Activities in Madinah';
          type = 'worship';
          description = `Activities\n\nBreakfast at the hotel.\n\nPerform daily prayers at Masjid An-Nabawi.\n\nVisit Rawdah (subject to permit).\n\nRecite the Holy Qur'an.\n\nEngage in Dhikr, Du'a and personal Ibadah.`;
        }
      }

      newItinerary.push({
        id: dayNum,
        day: dayNum,
        date,
        city,
        title,
        description,
        fixed,
        type,
        ziyarahZone,
        zone
      });
    }

    itineraryItems = newItinerary;
    itC = itineraryItems.length;
    renderItineraryList();
  } catch (err) {
    console.error('Itinerary regenerate failed:', err);
  }
}

/* ==================== RENDER ITINERARY LIST ==================== */
function renderItineraryList() {
  const el = $('itineraryList');
  if (!el) return;

  if ($('itineraryCount')) $('itineraryCount').textContent = itineraryItems.length;

  if (!itineraryItems.length) {
    el.innerHTML = '<div class="empty-slot"><span class="ic">📅</span>Check-in / Check-out date দিন — itinerary auto তৈরি হবে</div>';
    return;
  }

  el.innerHTML = itineraryItems.map(item => renderItineraryCard(item)).join('');
  initItinerarySortable();
}

function renderItineraryCard(item) {
  const lockIcon = item.fixed ? '<span class="lock-icon">🔒</span>' : '';
  const dragHandle = item.fixed
    ? '<span class="itin-drag-spacer"></span>'
    : '<span class="itin-drag-handle" data-handle>⋮⋮</span>';
  const dateStr = item.date ? formatDateBn(item.date) : '';
  const disabledAttr = item.fixed ? 'disabled' : '';
  const ziyarahBadge = item.type === 'ziyarah' ? '<span class="itin-ziyarah-badge">★ ZIYARAH</span>' : '';
  const lockedTag = item.fixed ? '<span class="itin-locked-tag">🔒 LOCKED</span>' : '';
  const deleteBtn = item.fixed
    ? ''
    : `<button class="danger" onclick="deleteItineraryDay(${item.id})" title="Delete">✕</button>`;
  const zoneAttr = item.zone ? `data-zone="${item.zone}"` : '';

  return `
    <div class="itin-card ${item.fixed ? 'locked' : ''}" data-id="${item.id}" data-fixed="${item.fixed}" ${zoneAttr}>
      <div class="itin-head">
        <div class="itin-badge ${item.fixed ? 'locked-badge' : ''}">${lockIcon}Day ${item.day}</div>
        <div class="itin-title-bar">
          ${dragHandle}
          <input type="text" class="itin-title-input" value="${escapeAttr(item.title)}" placeholder="Day title..." ${disabledAttr} onchange="updateItineraryField(${item.id}, 'title', this.value)">
          ${ziyarahBadge}
          ${lockedTag}
          <span class="itin-date-label">${dateStr}</span>
          ${deleteBtn ? `<div class="itin-actions">${deleteBtn}</div>` : ''}
        </div>
      </div>
      <div class="itin-desc">
        <textarea placeholder="Description..." ${disabledAttr} onchange="updateItineraryField(${item.id}, 'description', this.value)">${esc(item.description)}</textarea>
      </div>
    </div>
  `;
}

/* ==================== UPDATE / DELETE ITINERARY ==================== */
function updateItineraryField(id, field, value) {
  const item = itineraryItems.find(i => i.id === id);
  if (!item || item.fixed) return;
  item[field] = value;
}

function deleteItineraryDay(id) {
  const item = itineraryItems.find(i => i.id === id);
  if (!item || item.fixed) return;
  if (!confirm(`Delete Day ${item.day}: "${item.title}"?`)) return;
  itineraryItems = itineraryItems.filter(i => i.id !== id);
  renumberItinerary();
  renderItineraryList();
  toast('Day deleted', 'warning');
}

function renumberItinerary() {
  itineraryItems.forEach((item, idx) => { item.day = idx + 1; });
}

/* ==================== SORTABLE (DRAG & DROP) ==================== */
function initItinerarySortable() {
  if (itinerarySortable) {
    try { itinerarySortable.destroy(); } catch (e) {}
  }
  const el = $('itineraryList');
  if (!el || typeof Sortable === 'undefined') return;

  itinerarySortable = new Sortable(el, {
    animation: 180,
    handle: '[data-handle]',
    ghostClass: 'ghost',
    dragClass: 'dragging',
    filter: '[data-fixed="true"]',
    onMove: (evt) => {
      const dragged = evt.dragged, related = evt.related;
      if (!dragged || !related) return true;
      if (dragged.dataset.fixed === 'true') return false;

      const draggedZone = dragged.dataset.zone || '';
      const relatedZone = related.dataset.zone || '';
      if (draggedZone === 'makkah' && relatedZone === 'madinah') return false;
      if (draggedZone === 'madinah' && relatedZone === 'makkah') return false;
      if (related.dataset.fixed === 'true') return false;
      return true;
    },
    onEnd: (evt) => {
      const draggedZone = evt.item.dataset.zone || '';
      const newOrderItems = Array.from(el.querySelectorAll('.itin-card'));
      const newIdx = evt.newIndex;
      const targetZone = newOrderItems[newIdx]?.dataset.zone || '';

      if (draggedZone && targetZone && draggedZone !== targetZone) {
        toast('❌ Makkah day Madinah zone-এ যাবে না', 'error');
        renderItineraryList();
        return;
      }

      const newOrder = [];
      newOrderItems.forEach(card => {
        const id = parseInt(card.dataset.id);
        const item = itineraryItems.find(i => i.id === id);
        if (item) newOrder.push(item);
      });
      itineraryItems = newOrder;
      renumberItinerary();
      renderItineraryList();
      toast('✓ Day order updated');
    }
  });
}

/* ==================== ADD CUSTOM DAY ==================== */
function addItineraryItem() {
  const nextDay = itineraryItems.length + 1;
  const pkgIn = $('pkgCheckIn')?.value;
  const dateStr = pkgIn ? addDays(pkgIn, nextDay - 1) : '';

  itineraryItems.push({
    id: Date.now(),
    day: nextDay,
    date: dateStr,
    city: 'Makkah',
    title: '',
    description: '',
    fixed: false,
    type: 'custom',
    zone: 'makkah'
  });
  renumberItinerary();
  renderItineraryList();
}