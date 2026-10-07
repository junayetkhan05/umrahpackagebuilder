/* ============================================================
   UMRAH BUILDER — BUILDER / SERVICE
   Service items add/remove/change + list render
   ============================================================ */

/* ==================== ADD SERVICE ITEM ==================== */
function addServiceItem() {
  serviceItems.push({
    id: ++sC,
    serviceId: null,
    name: '',
    priceType: 'per_person',
    price: 0
  });
  renderServicesList();
  recalc();
}

/* ==================== REMOVE SERVICE ITEM ==================== */
function removeServiceItem(id) {
  serviceItems = serviceItems.filter(s => s.id !== id);
  renderServicesList();
  recalc();
}

/* ==================== ON SERVICE CHANGE ==================== */
function onServiceItemChange(itemId, serviceId) {
  const s = serviceItems.find(x => x.id === itemId);
  if (!s) return;

  if (!serviceId) {
    s.serviceId = null;
    s.name = '';
    s.price = 0;
  } else {
    const dbS = STORE.services.find(x => x.id === parseInt(serviceId));
    if (!dbS) return;
    s.serviceId = dbS.id;
    s.name = dbS.name;
    s.priceType = dbS.priceType;
    s.price = dbS.price || 0;
  }
  renderServicesList();
  recalc();
}

/* ==================== UPDATE SERVICE FIELD ==================== */
function updateServiceItem(id, field, value) {
  const s = serviceItems.find(x => x.id === id);
  if (!s) return;

  if (field === 'price') s.price = Math.max(0, parseFloat(value) || 0);
  else s[field] = value;

  recalc();
}

/* ==================== RENDER SERVICES LIST ==================== */
function renderServicesList() {
  const el = $('servicesList');
  if (!el) return;

  if ($('serviceCount')) $('serviceCount').textContent = serviceItems.length;
  if (!serviceItems.length) {
    el.innerHTML = '<div class="empty-slot"><span class="ic">▦</span>No service</div>';
    return;
  }

  const opts = STORE.services.map(s =>
    `<option value="${s.id}">${esc(s.name)} — ${fmt(s.price)}</option>`
  ).join('');

  el.innerHTML = serviceItems.map((s, i) => `
    <div class="item-card">
      <div class="item-card-head">
        <span class="lbl">Service ${i + 1}</span>
        <button class="remove-btn" onclick="removeServiceItem(${s.id})">✕</button>
      </div>
      <div class="field" style="margin-bottom:14px">
        <label>Select Service</label>
        <select onchange="onServiceItemChange(${s.id},this.value)" data-selected="${s.serviceId || ''}">
          <option value="">-- Choose --</option>${opts}
        </select>
      </div>
      <div class="field">
        <label>Price</label>
        <input type="number" value="${s.price || ''}" onchange="updateServiceItem(${s.id},'price',this.value)">
      </div>
    </div>
  `).join('');

  serviceItems.forEach(s => {
    if (s.serviceId) {
      const sel = el.querySelector(`select[data-selected="${s.serviceId}"]`);
      if (sel) sel.value = s.serviceId;
    }
  });
}