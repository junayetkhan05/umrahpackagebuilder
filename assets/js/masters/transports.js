/* ============================================================
   UMRAH BUILDER — MASTERS / TRANSPORTS
   Transport CRUD + table render
   ============================================================ */

/* ==================== VEHICLE CHANGE ==================== */
function onVehicleChange() {
  const v = $('tsVehicle')?.value || 'Hiace';
  const cap = VEHICLE_CAPACITY[v] || 12;
  if ($('tsCapacity')) $('tsCapacity').value = cap;
}

/* ==================== OPEN TRANSPORT SETUP ==================== */
function openTransportSetup(editId = null) {
  if (editId) {
    const t = STORE.transports.find(x => x.id === editId);
    if (t) {
      $('transportModalTitle').textContent = '✏️ Edit Transport';
      $('tsEditId').value = editId;
      $('tsFrom').value = t.from || '';
      $('tsTo').value = t.to || '';
      $('tsVehicle').value = t.vehicle || 'Hiace';
      $('tsCapacity').value = t.capacity || 12;
      $('tsPriceType').value = t.priceType || 'per_vehicle';
      $('tsVehicleCount').value = t.vehicleCount || 1;
      $('tsPrice').value = t.price || '';
    }
  } else {
    $('transportModalTitle').textContent = '▣ Add Transport';
    $('tsEditId').value = '';
    ['tsFrom','tsTo','tsPrice'].forEach(id => {
      const e = $(id);
      if (e) e.value = '';
    });
    if ($('tsVehicle')) $('tsVehicle').value = 'Hiace';
    if ($('tsCapacity')) $('tsCapacity').value = 12;
    if ($('tsPriceType')) $('tsPriceType').value = 'per_vehicle';
    if ($('tsVehicleCount')) $('tsVehicleCount').value = 1;
  }
  clearAllErrors();
  openModal('transportSetupModal');
}

/* ==================== SAVE TRANSPORT ==================== */
async function saveTransportSetup() {
  clearAllErrors();
  const from = $('tsFrom').value.trim();
  const to = $('tsTo').value.trim();
  const editId = $('tsEditId').value;

  let err = false;
  if (!from) { setError('tsFrom', 'From required'); err = true; }
  if (!to) { setError('tsTo', 'To required'); err = true; }
  if (err) { toast('Fill required fields', 'error'); return; }

  showLoading('Saving...');
  try {
    const vehicle = $('tsVehicle').value;
    const data = {
      id: editId ? parseInt(editId) : Date.now(),
      from, to, vehicle,
      capacity: VEHICLE_CAPACITY[vehicle] || parseInt($('tsCapacity').value) || 12,
      priceType: $('tsPriceType').value,
      vehicleCount: parseInt($('tsVehicleCount').value) || 1,
      price: parseFloat($('tsPrice').value) || 0,
      createdAt: editId ? (STORE.transports.find(x => x.id === parseInt(editId))?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };
    await dbSave(STORES.transports, data);
    STORE.transports = await dbGetAll(STORES.transports);
    hideLoading();
    closeModal('transportSetupModal');
    renderTransportsTable();
    updateSidebarBadges();
    toast(editId ? '✅ Transport updated' : '✅ Transport saved');
  } catch (e) {
    hideLoading();
    toast('Save failed: ' + e.message, 'error');
  }
}

/* ==================== DELETE TRANSPORT ==================== */
function deleteTransport(id) {
  const t = STORE.transports.find(x => x.id === id);
  if (!t) return;
  confirmDelete(`Delete route "${t.from} → ${t.to}"?`, async () => {
    const idx = STORE.transports.findIndex(x => x.id === id);
    if (idx < 0) return;
    STORE.transports.splice(idx, 1);
    await dbDelete(STORES.transports, id);
    STORE.transports = await dbGetAll(STORES.transports);
    renderTransportsTable();
    updateSidebarBadges();
    toast('Transport deleted', 'warning');
  });
}

/* ==================== RENDER TRANSPORTS TABLE ==================== */
function renderTransportsTable() {
  const el = $('transportsTable');
  if (!el) return;
  const list = STORE.transports;

  if (!list.length) {
    el.innerHTML = '<div class="empty"><div class="ic">▣</div><div class="tx">No transports yet</div></div>';
    return;
  }

  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Route</th><th>Vehicle</th><th>Capacity</th><th>Pricing</th><th>Price</th><th></th></tr></thead>
    <tbody>${list.map(t => `<tr>
      <td><div class="cell-main">${esc(t.from)} → ${esc(t.to)}</div></td>
      <td>${esc(t.vehicle)} ${t.vehicleCount > 1 ? '× ' + t.vehicleCount : ''}</td>
      <td>${t.capacity || VEHICLE_CAPACITY[t.vehicle] || '—'} seats</td>
      <td><span class="pill ${t.priceType === 'per_vehicle' ? 'confirmed' : 'quoted'}">${t.priceType === 'per_vehicle' ? 'Per Vehicle' : 'Per Person'}</span></td>
      <td><strong>${fmt(t.price)}</strong></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn btn-sm btn-ghost btn-icon" onclick="openTransportSetup(${t.id})">✏️</button>
        <button class="btn btn-sm btn-ghost btn-icon" onclick="quickAddTransport(${t.id})">➕</button>
        <button class="btn btn-sm btn-ghost btn-icon" onclick="deleteTransport(${t.id})">🗑️</button>
      </td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}