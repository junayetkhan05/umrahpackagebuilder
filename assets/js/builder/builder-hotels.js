/* ============================================================
   UMRAH BUILDER — BUILDER / HOTELS
   Makkah + Madinah hotel items with rooms + vendor costs
   ============================================================ */

/* ==================== MAKKAH HOTEL ==================== */
function addMakkahHotel() {
  makkahItems.push({
    id: ++mC,
    hotelId: null,
    vendorId: null,
    vendorName: '',
    name: '',
    distance: '',
    star: 4,
    imageIds: [],
    checkIn: '',
    checkOut: '',
    rooms: []
  });
  renderMakkahHotelsList();
  recalc();
}

function removeMakkahHotel(id) {
  makkahItems = makkahItems.filter(h => h.id !== id);
  renderMakkahHotelsList();
  recalc();
}

function onMakkahHotelChange(itemId, hotelId) {
  const h = makkahItems.find(x => x.id === itemId);
  if (!h) return;

  if (!hotelId) {
    h.hotelId = null;
    h.vendorId = null;
    h.vendorName = '';
    h.name = '';
    h.distance = '';
    h.star = 4;
    h.imageIds = [];
    h.rooms = [];
  } else {
    const dbH = STORE.makkahHotels.find(x => x.id === parseInt(hotelId));
    if (!dbH) return;
    h.hotelId = dbH.id;
    h.vendorId = dbH.vendorId || null;
    h.vendorName = h.vendorId ? (STORE.vendors.find(v => String(v.id) === String(h.vendorId))?.name || '') : '';
    h.name = dbH.name;
    h.distance = dbH.distance;
    h.star = dbH.star;
    h.imageIds = dbH.imageIds || [];
    if (!h.checkIn) h.checkIn = strVal('pkgCheckIn');
    if (!h.rooms.length) addHotelRoom('makkah', h.id, builderDefaultRoomSharing || 'double');
  }
  renderMakkahHotelsList();
  recalc();
}

/* ==================== MADINAH HOTEL ==================== */
function addMadinahHotel() {
  madinahItems.push({
    id: ++mdC,
    hotelId: null,
    vendorId: null,
    vendorName: '',
    name: '',
    distance: '',
    star: 4,
    imageIds: [],
    checkIn: '',
    checkOut: '',
    rooms: []
  });
  renderMadinahHotelsList();
  recalc();
}

function removeMadinahHotel(id) {
  madinahItems = madinahItems.filter(h => h.id !== id);
  renderMadinahHotelsList();
  recalc();
}

function onMadinahHotelChange(itemId, hotelId) {
  const h = madinahItems.find(x => x.id === itemId);
  if (!h) return;

  if (!hotelId) {
    h.hotelId = null;
    h.vendorId = null;
    h.vendorName = '';
    h.name = '';
    h.distance = '';
    h.star = 4;
    h.imageIds = [];
    h.rooms = [];
  } else {
    const dbH = STORE.madinahHotels.find(x => x.id === parseInt(hotelId));
    if (!dbH) return;
    h.hotelId = dbH.id;
    h.vendorId = dbH.vendorId || null;
    h.vendorName = h.vendorId ? (STORE.vendors.find(v => String(v.id) === String(h.vendorId))?.name || '') : '';
    h.name = dbH.name;
    h.distance = dbH.distance;
    h.star = dbH.star;
    h.imageIds = dbH.imageIds || [];

    const firstMakkah = makkahItems.find(m => m.hotelId && m.checkOut);
    if (!h.checkIn) h.checkIn = firstMakkah?.checkOut || '';
    if (!h.checkOut) h.checkOut = strVal('pkgCheckOut');
    if (!h.rooms.length) addHotelRoom('madinah', h.id, builderDefaultRoomSharing || 'double');
  }
  renderMadinahHotelsList();
  recalc();
}

/* ==================== HOTEL DATE UPDATE ==================== */
function updateHotelDate(cityType, hotelItemId, field, value) {
  const items = cityType === 'makkah' ? makkahItems : madinahItems;
  const h = items.find(x => x.id === hotelItemId);
  if (!h) return;

  h[field] = value;

  if (cityType === 'makkah') {
    h._makkahDateManual = true;
    if (field === 'checkOut') {
      madinahItems.forEach(mh => {
        if (!mh._madinahDateManual) {
          mh.checkIn = value;
          mh._madinahDateManual = false;
        }
      });
    }
  }
  if (cityType === 'madinah') h._madinahDateManual = true;

  if (h.checkIn && h.checkOut) {
    const nights = daysBetween(h.checkIn, h.checkOut);
    (h.rooms || []).forEach(r => { r.nights = nights; });
  }

  renderMakkahHotelsList();
  renderMadinahHotelsList();
  calcDuration();
}

/* ==================== ROOM MANAGEMENT ==================== */
function addHotelRoom(cityType, hotelItemId, roomType = 'double') {
  const items = cityType === 'makkah' ? makkahItems : madinahItems;
  const h = items.find(x => x.id === hotelItemId);
  if (!h) return;

  const cap = ROOM_CAPACITY[roomType] || 2;
  let totalNights = getPackageNights();
  if (h.checkIn && h.checkOut) totalNights = daysBetween(h.checkIn, h.checkOut);

  const rate = getHotelDefaultRate(cityType, h.hotelId, roomType, h.vendorId);

  hotelRoomCounter++;
  h.rooms.push({
    id: hotelRoomCounter,
    type: roomType,
    adults: cap,
    children: 0,
    nights: totalNights,
    rate,
    meal: 'room_only',
    mealRate: 0
  });

  renderMakkahHotelsList();
  renderMadinahHotelsList();
  recalc();
}

function removeHotelRoom(cityType, hotelItemId, roomId) {
  const items = cityType === 'makkah' ? makkahItems : madinahItems;
  const h = items.find(x => x.id === hotelItemId);
  if (!h) return;
  h.rooms = h.rooms.filter(r => r.id !== roomId);
  renderMakkahHotelsList();
  renderMadinahHotelsList();
  recalc();
}

function updateHotelRoom(cityType, hotelItemId, roomId, field, value) {
  const items = cityType === 'makkah' ? makkahItems : madinahItems;
  const h = items.find(x => x.id === hotelItemId);
  if (!h) return;
  const r = h.rooms.find(x => x.id === roomId);
  if (!r) return;

  if (field === 'type') {
    r.type = value;
    r.adults = ROOM_CAPACITY[value] || 2;
    const newRate = getHotelDefaultRate(cityType, h.hotelId, value, h.vendorId);
    if (newRate > 0) r.rate = newRate;
    if (r.meal && r.meal !== 'room_only') {
      const newMealRate = getHotelDefaultMealRate(cityType, h, r.meal);
      if (newMealRate > 0) r.mealRate = newMealRate;
    }
  } else if (field === 'meal') {
    r.meal = value;
    if (value === 'room_only') r.mealRate = 0;
    else {
      const autoRate = getHotelDefaultMealRate(cityType, h, value);
      if (autoRate > 0) r.mealRate = autoRate;
    }
  } else if (field === 'mealRate') {
    r.mealRate = Math.max(0, parseFloat(value) || 0);
  } else if (['adults', 'children', 'nights'].includes(field)) {
    r[field] = Math.max(0, parseInt(value) || 0);
  } else if (field === 'rate') {
    r.rate = Math.max(0, parseFloat(value) || 0);
  }

  renderMakkahHotelsList();
  renderMadinahHotelsList();
  recalc();
}

/* ==================== CUSTOMER SELLING RATE ==================== */
function getHotelDefaultRate(cityType, hotelId, roomType, vendorId = null) {
  if (!hotelId) return 0;
  const list = cityType === 'makkah' ? STORE.makkahHotels : STORE.madinahHotels;
  const dbH = list.find(x => x.id === parseInt(hotelId));
  if (!dbH) return 0;
  return dbH[roomType] || 0;
}

/* ==================== VENDOR COST RATE ==================== */
function getHotelVendorRate(cityType, hotelId, roomType, vendorId = null) {
  if (!hotelId) return 0;
  const list = cityType === 'makkah' ? STORE.makkahHotels : STORE.madinahHotels;
  const dbH = list.find(x => x.id === parseInt(hotelId));
  if (!dbH) return 0;

  const vId = vendorId || dbH.vendorId;
  if (!vId) return 0;

  const vendor = STORE.vendors.find(v => String(v.id) === String(vId));
  if (!vendor) return 0;

  const vh = findVendorHotel(vendor, dbH);
  return Number(vh?.[roomType] || 0);
}

/* ==================== MEAL RATES ==================== */
function getHotelDefaultMealRate(cityType, hotelItem, meal) {
  if (!hotelItem) return 0;
  if (meal === 'room_only' || !meal) return 0;

  const field = { breakfast: 'breakfast', half_board: 'halfBoard', full_board: 'fullBoard' }[meal];
  if (!field) return 0;

  const master = (cityType === 'makkah' ? STORE.makkahHotels : STORE.madinahHotels).find(h => h.id === hotelItem.hotelId);
  return Number(master?.[field] || 0);
}

function getHotelVendorMealRate(cityType, hotelItem, meal) {
  if (!hotelItem) return 0;
  if (meal === 'room_only' || !meal) return 0;

  const field = { breakfast: 'breakfast', half_board: 'halfBoard', full_board: 'fullBoard' }[meal];
  if (!field) return 0;

  const master = (cityType === 'makkah' ? STORE.makkahHotels : STORE.madinahHotels).find(h => h.id === hotelItem.hotelId);
  if (!master) return 0;

  const vId = hotelItem.vendorId || master.vendorId;
  if (!vId) return 0;

  const vendor = STORE.vendors.find(v => String(v.id) === String(vId));
  if (!vendor) return 0;

  const vh = findVendorHotel(vendor, master);
  return Number(vh?.[field] || 0);
}

/* ==================== HOTEL TOTALS ==================== */
function getHotelTotal(h) {
  return (h.rooms || []).reduce((sum, r) => {
    const paxInRoom = (r.adults || 0) + (r.children || 0);
    const mealPerNight = (r.mealRate || 0) * paxInRoom;
    const totalRatePerNight = (r.rate || 0) + mealPerNight;
    return sum + (totalRatePerNight * (r.nights || 0));
  }, 0);
}

function getHotelVendorCost(h, cityType) {
  return (h.rooms || []).reduce((sum, r) => {
    const vendorRoomRate = getHotelVendorRate(cityType, h.hotelId, r.type, h.vendorId);
    const vendorMealRate = getHotelVendorMealRate(cityType, h, r.meal);
    const paxInRoom = (r.adults || 0) + (r.children || 0);
    const mealPerNight = vendorMealRate * paxInRoom;
    const totalRatePerNight = vendorRoomRate + mealPerNight;
    return sum + (totalRatePerNight * (r.nights || 0));
  }, 0);
}

function getMakkahTotal() {
  return makkahItems.reduce((s, h) => s + getHotelTotal(h), 0);
}
function getMadinahTotal() {
  return madinahItems.reduce((s, h) => s + getHotelTotal(h), 0);
}
function getMakkahVendorCost() {
  return makkahItems.reduce((s, h) => s + getHotelVendorCost(h, 'makkah'), 0);
}
function getMadinahVendorCost() {
  return madinahItems.reduce((s, h) => s + getHotelVendorCost(h, 'madinah'), 0);
}

/* ==================== RENDER MAKKAH HOTELS ==================== */
function renderMakkahHotelsList() {
  const el = $('makkahHotelsList');
  if (!el) return;

  if ($('makkahHotelCount')) $('makkahHotelCount').textContent = makkahItems.length;
  if (!makkahItems.length) {
    el.innerHTML = '<div class="empty-slot"><span class="ic">🕌</span>No Makkah hotel</div>';
    return;
  }

  const makkahOnlyHotels = STORE.makkahHotels.filter(h =>
    (h.city || 'Makkah').toLowerCase() === 'makkah' || h.cityType === 'makkah'
  );
  const opts = makkahOnlyHotels.map(h =>
    `<option value="${h.id}">${esc(h.name)} — ${esc(h.distance || '')}</option>`
  ).join('');

  el.innerHTML = makkahItems.map((h, i) => {
    const hotelTotal = getHotelTotal(h);
    const hotelVendorCost = getHotelVendorCost(h, 'makkah');
    const hotelProfit = hotelTotal - hotelVendorCost;

    return `<div class="item-card">
      <div class="item-card-head">
        <span class="lbl">Makkah Hotel ${i + 1}</span>
        <button class="remove-btn" onclick="removeMakkahHotel(${h.id})">✕</button>
      </div>
      <div class="field" style="margin-bottom:14px">
        <label>Select Hotel</label>
        <select onchange="onMakkahHotelChange(${h.id},this.value)" data-selected="${h.hotelId || ''}">
          <option value="">-- Choose Hotel --</option>${opts}
        </select>
      </div>
      ${h.hotelId ? `
        <div style="padding:10px 14px;background:var(--primary-bg);border-radius:10px;margin-bottom:12px;font-size:12px;line-height:1.7;border-left:3px solid var(--primary)">
          <div>📍 <b>${esc(h.distance) || '—'}</b></div>
          <div>${'⭐'.repeat(parseInt(h.star) || 0)}</div>
          ${h.vendorName
            ? `<div style="color:var(--blue);font-weight:700">🏢 Vendor: ${esc(h.vendorName)}</div>`
            : '<div style="color:var(--red);font-weight:700;font-size:11px">⚠️ No vendor linked</div>'}
        </div>

        <div class="hotel-stay-dates">
          <div class="date-field"><label>📅 Check-in (Auto)</label><input type="date" value="${h.checkIn || ''}" readonly></div>
          <div class="date-field"><label>📅 Check-out</label><input type="date" value="${h.checkOut || ''}" onchange="updateHotelDate('makkah',${h.id},'checkOut',this.value)"></div>
        </div>

        <div class="hotel-rooms-block">
          <div class="block-head">
            <div class="title">🛏️ Rooms (${h.rooms.length})</div>
            <button class="btn btn-primary btn-xs" onclick="addHotelRoom('makkah',${h.id},'double')">➕ Add Room</button>
          </div>
          ${h.rooms.length ? h.rooms.map((r, ri) => {
            const cap = ROOM_CAPACITY[r.type] || 2;
            const paxInRoom = (r.adults || 0) + (r.children || 0);
            const mealPerNight = (r.mealRate || 0) * paxInRoom;
            const totalRatePerNight = (r.rate || 0) + mealPerNight;
            const total = totalRatePerNight * (r.nights || 0);
            const vendorRoomRate = getHotelVendorRate('makkah', h.hotelId, r.type, h.vendorId);
            const vendorMealRate = getHotelVendorMealRate('makkah', h, r.meal);
            const vendorMealPerNight = vendorMealRate * paxInRoom;
            const vendorTotalRatePerNight = vendorRoomRate + vendorMealPerNight;
            const vendorTotal = vendorTotalRatePerNight * (r.nights || 0);
            const roomProfit = total - vendorTotal;

            return `<div class="hotel-room-row">
              <div class="rn">R${ri + 1}<small>ROOM</small></div>
              <div class="rc"><label>Type</label>
                <select onchange="updateHotelRoom('makkah',${h.id},${r.id},'type',this.value)">
                  <option value="quad" ${r.type === 'quad' ? 'selected' : ''}>Quad (4)</option>
                  <option value="triple" ${r.type === 'triple' ? 'selected' : ''}>Triple (3)</option>
                  <option value="double" ${r.type === 'double' ? 'selected' : ''}>Double (2)</option>
                  <option value="single" ${r.type === 'single' ? 'selected' : ''}>Single (1)</option>
                </select>
              </div>
              <div class="rc"><label>Adults</label><input type="number" min="1" max="${cap}" value="${r.adults}" onchange="updateHotelRoom('makkah',${h.id},${r.id},'adults',this.value)"></div>
              <div class="rc"><label>Nights</label><input type="number" min="0" value="${r.nights || 0}" onchange="updateHotelRoom('makkah',${h.id},${r.id},'nights',this.value)"></div>
              <div class="rc"><label>Room Rate/Night</label><input type="number" min="0" value="${r.rate || ''}" onchange="updateHotelRoom('makkah',${h.id},${r.id},'rate',this.value)"></div>
              <div class="rc"><label>Meal Rate/Person</label><input type="number" min="0" value="${r.mealRate || ''}" onchange="updateHotelRoom('makkah',${h.id},${r.id},'mealRate',this.value)" ${r.meal === 'room_only' ? 'disabled' : ''}></div>
              <div class="rc"><label>Meal</label>
                <select onchange="updateHotelRoom('makkah',${h.id},${r.id},'meal',this.value)">
                  <option value="room_only" ${r.meal === 'room_only' ? 'selected' : ''}>Room Only</option>
                  <option value="breakfast" ${r.meal === 'breakfast' ? 'selected' : ''}>🍳 Breakfast</option>
                  <option value="half_board" ${r.meal === 'half_board' ? 'selected' : ''}>🍱 Half Board</option>
                  <option value="full_board" ${r.meal === 'full_board' ? 'selected' : ''}>🍽️ Full Board</option>
                </select>
              </div>
              <div class="rc">
                <label>Total</label>
                <div class="room-total-box">
                  <div class="sell-line"><span class="lbl">Sell</span><span class="val">${fmt(total)}</span></div>
                  <div class="cost-line"><span class="lbl">Cost</span><span class="val">${fmt(vendorTotal)}</span></div>
                  <div class="profit-line ${roomProfit < 0 ? 'negative' : ''}"><span class="lbl">Profit</span><span class="val">${roomProfit >= 0 ? '+' : ''}${fmt(roomProfit)}</span></div>
                </div>
              </div>
              <button class="rr-btn" onclick="removeHotelRoom('makkah',${h.id},${r.id})">✕</button>
            </div>`;
          }).join('') : `<div class="hotel-rooms-empty">No rooms — click "+ Add Room"</div>`}

          ${h.rooms.length ? `
            <div class="hotel-rooms-total">
              <div class="sub-item sell">
                <div class="lbl">Customer Sell</div>
                <div class="val">${fmt(hotelTotal)}</div>
                <div class="meta">${h.rooms.length} room(s)</div>
              </div>
              <div class="sub-item cost">
                <div class="lbl">Vendor Cost</div>
                <div class="val">${fmt(hotelVendorCost)}</div>
                <div class="meta">From Vendor Setup</div>
              </div>
              <div class="sub-item profit">
                <div class="lbl">Profit</div>
                <div class="val ${hotelProfit < 0 ? 'negative' : ''}">${hotelProfit >= 0 ? '+' : ''}${fmt(hotelProfit)}</div>
                <div class="meta">${hotelTotal > 0 ? ((hotelProfit / hotelTotal) * 100).toFixed(1) + '%' : '0%'}</div>
              </div>
              <div class="total-badge">
                <div class="lbl">Total</div>
                <div class="val">${fmt(hotelTotal)}</div>
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>`;
  }).join('');

  makkahItems.forEach(h => {
    if (h.hotelId) {
      const sel = el.querySelector(`select[data-selected="${h.hotelId}"]`);
      if (sel) sel.value = h.hotelId;
    }
  });
}

/* ==================== RENDER MADINAH HOTELS ==================== */
function renderMadinahHotelsList() {
  const el = $('madinahHotelsList');
  if (!el) return;

  if ($('madinahHotelCount')) $('madinahHotelCount').textContent = madinahItems.length;
  if (!madinahItems.length) {
    el.innerHTML = '<div class="empty-slot"><span class="ic">🕌</span>No Madinah hotel</div>';
    return;
  }

  const madinahOnlyHotels = STORE.madinahHotels.filter(h =>
    (h.city || 'Madinah').toLowerCase() === 'madinah' || h.cityType === 'madinah'
  );
  const opts = madinahOnlyHotels.map(h =>
    `<option value="${h.id}">${esc(h.name)} — ${esc(h.distance || '')}</option>`
  ).join('');

  el.innerHTML = madinahItems.map((h, i) => {
    const hotelTotal = getHotelTotal(h);
    const hotelVendorCost = getHotelVendorCost(h, 'madinah');
    const hotelProfit = hotelTotal - hotelVendorCost;

    return `<div class="item-card">
      <div class="item-card-head">
        <span class="lbl">Madinah Hotel ${i + 1}</span>
        <button class="remove-btn" onclick="removeMadinahHotel(${h.id})">✕</button>
      </div>
      <div class="field" style="margin-bottom:14px">
        <label>Select Hotel</label>
        <select onchange="onMadinahHotelChange(${h.id},this.value)" data-selected="${h.hotelId || ''}">
          <option value="">-- Choose Hotel --</option>${opts}
        </select>
      </div>
      ${h.hotelId ? `
        <div style="padding:10px 14px;background:var(--primary-bg);border-radius:10px;margin-bottom:12px;font-size:12px;line-height:1.7;border-left:3px solid var(--primary)">
          <div>📍 <b>${esc(h.distance) || '—'}</b></div>
          <div>${'⭐'.repeat(parseInt(h.star) || 0)}</div>
          ${h.vendorName
            ? `<div style="color:var(--blue);font-weight:700">🏢 Vendor: ${esc(h.vendorName)}</div>`
            : '<div style="color:var(--red);font-weight:700;font-size:11px">⚠️ No vendor linked</div>'}
        </div>

        <div class="hotel-stay-dates">
          <div class="date-field"><label>📅 Check-in (Auto)</label><input type="date" value="${h.checkIn || ''}" readonly></div>
          <div class="date-field"><label>📅 Check-out (Auto)</label><input type="date" value="${h.checkOut || ''}" readonly></div>
        </div>

        <div class="hotel-rooms-block">
          <div class="block-head">
            <div class="title">🛏️ Rooms (${h.rooms.length})</div>
            <button class="btn btn-primary btn-xs" onclick="addHotelRoom('madinah',${h.id},'double')">➕ Add Room</button>
          </div>
          ${h.rooms.length ? h.rooms.map((r, ri) => {
            const cap = ROOM_CAPACITY[r.type] || 2;
            const paxInRoom = (r.adults || 0) + (r.children || 0);
            const mealPerNight = (r.mealRate || 0) * paxInRoom;
            const totalRatePerNight = (r.rate || 0) + mealPerNight;
            const total = totalRatePerNight * (r.nights || 0);
            const vendorRoomRate = getHotelVendorRate('madinah', h.hotelId, r.type, h.vendorId);
            const vendorMealRate = getHotelVendorMealRate('madinah', h, r.meal);
            const vendorMealPerNight = vendorMealRate * paxInRoom;
            const vendorTotalRatePerNight = vendorRoomRate + vendorMealPerNight;
            const vendorTotal = vendorTotalRatePerNight * (r.nights || 0);
            const roomProfit = total - vendorTotal;

            return `<div class="hotel-room-row">
              <div class="rn">R${ri + 1}<small>ROOM</small></div>
              <div class="rc"><label>Type</label>
                <select onchange="updateHotelRoom('madinah',${h.id},${r.id},'type',this.value)">
                  <option value="quad" ${r.type === 'quad' ? 'selected' : ''}>Quad (4)</option>
                  <option value="triple" ${r.type === 'triple' ? 'selected' : ''}>Triple (3)</option>
                  <option value="double" ${r.type === 'double' ? 'selected' : ''}>Double (2)</option>
                  <option value="single" ${r.type === 'single' ? 'selected' : ''}>Single (1)</option>
                </select>
              </div>
              <div class="rc"><label>Adults</label><input type="number" min="1" max="${cap}" value="${r.adults}" onchange="updateHotelRoom('madinah',${h.id},${r.id},'adults',this.value)"></div>
              <div class="rc"><label>Nights</label><input type="number" min="0" value="${r.nights || 0}" onchange="updateHotelRoom('madinah',${h.id},${r.id},'nights',this.value)"></div>
              <div class="rc"><label>Room Rate/Night</label><input type="number" min="0" value="${r.rate || ''}" onchange="updateHotelRoom('madinah',${h.id},${r.id},'rate',this.value)"></div>
              <div class="rc"><label>Meal Rate/Person</label><input type="number" min="0" value="${r.mealRate || ''}" onchange="updateHotelRoom('madinah',${h.id},${r.id},'mealRate',this.value)" ${r.meal === 'room_only' ? 'disabled' : ''}></div>
              <div class="rc"><label>Meal</label>
                <select onchange="updateHotelRoom('madinah',${h.id},${r.id},'meal',this.value)">
                  <option value="room_only" ${r.meal === 'room_only' ? 'selected' : ''}>Room Only</option>
                  <option value="breakfast" ${r.meal === 'breakfast' ? 'selected' : ''}>🍳 Breakfast</option>
                  <option value="half_board" ${r.meal === 'half_board' ? 'selected' : ''}>🍱 Half Board</option>
                  <option value="full_board" ${r.meal === 'full_board' ? 'selected' : ''}>🍽️ Full Board</option>
                </select>
              </div>
              <div class="rc">
                <label>Total</label>
                <div class="room-total-box">
                  <div class="sell-line"><span class="lbl">Sell</span><span class="val">${fmt(total)}</span></div>
                  <div class="cost-line"><span class="lbl">Cost</span><span class="val">${fmt(vendorTotal)}</span></div>
                  <div class="profit-line ${roomProfit < 0 ? 'negative' : ''}"><span class="lbl">Profit</span><span class="val">${roomProfit >= 0 ? '+' : ''}${fmt(roomProfit)}</span></div>
                </div>
              </div>
              <button class="rr-btn" onclick="removeHotelRoom('madinah',${h.id},${r.id})">✕</button>
            </div>`;
          }).join('') : `<div class="hotel-rooms-empty">No rooms</div>`}

          ${h.rooms.length ? `
            <div class="hotel-rooms-total">
              <div class="sub-item sell">
                <div class="lbl">Customer Sell</div>
                <div class="val">${fmt(hotelTotal)}</div>
                <div class="meta">${h.rooms.length} room(s)</div>
              </div>
              <div class="sub-item cost">
                <div class="lbl">Vendor Cost</div>
                <div class="val">${fmt(hotelVendorCost)}</div>
                <div class="meta">From Vendor Setup</div>
              </div>
              <div class="sub-item profit">
                <div class="lbl">Profit</div>
                <div class="val ${hotelProfit < 0 ? 'negative' : ''}">${hotelProfit >= 0 ? '+' : ''}${fmt(hotelProfit)}</div>
                <div class="meta">${hotelTotal > 0 ? ((hotelProfit / hotelTotal) * 100).toFixed(1) + '%' : '0%'}</div>
              </div>
              <div class="total-badge">
                <div class="lbl">Total</div>
                <div class="val">${fmt(hotelTotal)}</div>
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>`;
  }).join('');

  madinahItems.forEach(h => {
    if (h.hotelId) {
      const sel = el.querySelector(`select[data-selected="${h.hotelId}"]`);
      if (sel) sel.value = h.hotelId;
    }
  });
}