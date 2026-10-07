/* ============================================================
   UMRAH BUILDER — MASTERS / SERVICES
   Service CRUD + table render
   ============================================================ */

function openServiceSetup(editId = null) {
  if (editId) {
    const s = STORE.services.find(x => x.id === editId);
    if (s) {
      $('serviceModalTitle').textContent = '✏️ Edit Service';
      $('svcEditId').value = editId;
      $('svcName').value = s.name || '';
      $('svcPriceType').value = s.priceType || 'per_person';
      $('svcPrice').value = s.price || '';
    }
  } else {
    $('serviceModalTitle').textContent = '▦ Add Service';
    $('svcEditId').value = '';
    ['svcName','svcPrice'].forEach(id => {
      const e = $(id);
      if (e) e.value = '';
    });
    if ($('svcPriceType')) $('svcPriceType').value = 'per_person';
  }
  clearAllErrors();
  openModal('serviceSetupModal');
}

async function saveServiceSetup() {
  clearAllErrors();
  const name = $('svcName').value.trim();
  const editId = $('svcEditId').value;

  if (!name) {
    setError('svcName', 'Name required');
    toast('Name required', 'error');
    return;
  }

  showLoading('Saving...');
  try {
    const data = {
      id: editId ? parseInt(editId) : Date.now(),
      name,
      priceType: $('svcPriceType').value,
      price: parseFloat($('svcPrice').value) || 0,
      createdAt: editId ? (STORE.services.find(x => x.id === parseInt(editId))?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };
    await dbSave(STORES.services, data);
    STORE.services = await dbGetAll(STORES.services);
    hideLoading();
    closeModal('serviceSetupModal');
    renderServicesTable();
    toast(editId ? '✅ Service updated' : '✅ Service saved');
  } catch (e) {
    hideLoading();
    toast('Save failed: ' + e.message, 'error');
  }
}

function deleteService(id) {
  const s = STORE.services.find(x => x.id === id);
  if (!s) return;
  confirmDelete(`Delete service "${s.name}"?`, async () => {
    const idx = STORE.services.findIndex(x => x.id === id);
    if (idx < 0) return;
    STORE.services.splice(idx, 1);
    await dbDelete(STORES.services, id);
    STORE.services = await dbGetAll(STORES.services);
    renderServicesTable();
    toast('Service deleted', 'warning');
  });
}

function renderServicesTable() {
  const el = $('servicesTable');
  if (!el) return;
  const list = STORE.services;

  if (!list.length) {
    el.innerHTML = '<div class="empty"><div class="ic">▦</div><div class="tx">No services yet</div></div>';
    return;
  }

  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Service</th><th>Type</th><th>Price</th><th></th></tr></thead>
    <tbody>${list.map(s => `<tr>
      <td><div class="cell-main">${esc(s.name)}</div></td>
      <td>${s.priceType === 'per_group' ? 'Per Group' : 'Per Person'}</td>
      <td><span class="pill completed">${fmt(s.price)}</span></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn btn-sm btn-ghost btn-icon" onclick="openServiceSetup(${s.id})">✏️</button>
        <button class="btn btn-sm btn-ghost btn-icon" onclick="quickAddService(${s.id})">➕</button>
        <button class="btn btn-sm btn-ghost btn-icon" onclick="deleteService(${s.id})">🗑️</button>
      </td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}