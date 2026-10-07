/* ============================================================
   UMRAH BUILDER — BUILDER / TRANSPORT
   Transport items add/remove/change + list render
   ============================================================ */

/* ==================== ADD TRANSPORT ITEM ==================== */
function addTransportItem() {
  transportItems.push({
    id: ++tC,
    transportId: null,
    from: '',
    to: '',
    vehicle: '',
    capacity: 12,
    priceType: 'per_vehicle',
    vehicleCount: 1,
    price: 0
  });
  renderTransportsList();
  recalc();
}

/* ==================== REMOVE TRANSPORT ITEM ==================== */
function removeTransportItem(id) {
  transportItems = transportItems.filter(t => t.id !== id);
  renderTransportsList();
  recalc();
}

/* ==================== ON TRANSPORT CHANGE ==================== */
function onTransportItemChange(itemId, transportId) {
  const t = transportItems.find(x => x.id === itemId);
  if (!t) return;

  if (!transportId) {
    t.transportId = null;
    t.from = '';
    t.to = '';
    t.vehicle = '';
    t.capacity = 12;
    t.priceType = 'per_vehicle';
    t.vehicleCount = 1;
    t.price = 0;
  } else {
    const dbT = STORE.transports.find(x => x.id === parseInt(transportId));
    if (!dbT) return;
    t.transportId = dbT.id;
    t.from = dbT.from;
    t.to = dbT.to;
    t.vehicle = dbT.vehicle;
    t.capacity = dbT.capacity || VEHICLE_CAPACITY[dbT.vehicle] || 12;
    t.priceType = dbT.priceType || 'per_vehicle';
    t.vehicleCount = dbT.vehicleCount || 1;
    t.price = dbT.price || 0;
  }
  renderTransportsList();
  recalc();
}

/* ==================== UPDATE TRANSPORT FIELD ==================== */
function updateTransportItemField(id, field, value) {
  const t = transportItems.find(x => x.id === id);
  if (!t) return;

  if (field === 'price') t.price = Math.max(0, parseFloat(value) || 0);
  else if (field === 'vehicleCount') t.vehicleCount = Math.max(1, parseInt(value) || 1);
  else t[field] = value;

  renderTransportsList();
  recalc();
}

/* ==================== RENDER TRANSPORTS LIST ==================== */
function renderTransportsList() {
  const el = $('transportsList');
  if (!el) return;

  if ($('transportCount')) $('transportCount').textContent = transportItems.length;
  if (!transportItems.length) {
    el.innerHTML = '<div class="empty-slot"><span class="ic">▣</span>No transport</div>';
    return;
  }

  const opts = STORE.transports.map(t =>
    `<option value="${t.id}">${esc(t.from)} → ${esc(t.to)} — ${esc(t.vehicle)}</option>`
  ).join('');

  el.innerHTML = transportItems.map((t, i) => {
    const cap = VEHICLE_CAPACITY[t.vehicle] || t.capacity || 12;

    return `<div class="item-card">
      <div class="item-card-head">
        <span class="lbl">Transport ${i + 1}</span>
        <button class="remove-btn" onclick="removeTransportItem(${t.id})">✕</button>
      </div>
      <div class="field" style="margin-bottom:14px">
        <label>Select Route</label>
        <select onchange="onTransportItemChange(${t.id},this.value)" data-selected="${t.transportId || ''}">
          <option value="">-- Choose Route --</option>${opts}
        </select>
      </div>
      ${t.transportId ? `
        <div class="grid-2">
          <div class="field">
            <label>Vehicle</label>
            <input type="text" value="${esc(t.vehicle)} (${cap} seats)" readonly>
          </div>
          <div class="field">
            <label>Price (৳)</label>
            <input type="number" value="${t.price || ''}" onchange="updateTransportItemField(${t.id},'price',this.value)">
          </div>
        </div>
      ` : ''}
    </div>`;
  }).join('');

  transportItems.forEach(t => {
    if (t.transportId) {
      const sel = el.querySelector(`select[data-selected="${t.transportId}"]`);
      if (sel) sel.value = t.transportId;
    }
  });
}