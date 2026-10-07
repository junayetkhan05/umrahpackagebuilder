/* ============================================================
   UMRAH BUILDER — MASTERS / VISAS
   Visa CRUD + table render
   ============================================================ */

function openVisaSetup(editId = null) {
  if (editId) {
    const v = STORE.visas.find(x => x.id === editId);
    if (v) {
      $('visaModalTitle').textContent = '✏️ Edit Visa';
      $('vsEditId').value = editId;
      $('vsName').value = v.name || '';
      $('vsValidity').value = v.validity || 90;
      $('vsProcessing').value = v.processing || '';
      $('vsPriceAdult').value = v.priceAdult || v.price || '';
      $('vsPriceChild').value = v.priceChild || '';
      $('vsPriceInfant').value = v.priceInfant || '';
      if ($('vsCostAdult')) $('vsCostAdult').value = v.costAdult || '';
      if ($('vsCostChild')) $('vsCostChild').value = v.costChild || '';
      if ($('vsCostInfant')) $('vsCostInfant').value = v.costInfant || '';
    }
  } else {
    $('visaModalTitle').textContent = '▤ Add Visa';
    $('vsEditId').value = '';
    ['vsName','vsProcessing','vsPriceAdult','vsPriceChild','vsPriceInfant','vsCostAdult','vsCostChild','vsCostInfant'].forEach(id => {
      const e = $(id);
      if (e) e.value = '';
    });
    if ($('vsValidity')) $('vsValidity').value = 90;
  }
  clearAllErrors();
  openModal('visaSetupModal');
}

async function saveVisaSetup() {
  clearAllErrors();
  const name = $('vsName').value.trim();
  const editId = $('vsEditId').value;

  if (!name) {
    setError('vsName', 'Name required');
    toast('Name required', 'error');
    return;
  }

  showLoading('Saving...');
  try {
    const data = {
      id: editId ? parseInt(editId) : Date.now(),
      name,
      validity: parseInt($('vsValidity').value) || 90,
      processing: $('vsProcessing').value.trim(),
      priceAdult: parseFloat($('vsPriceAdult').value) || 0,
      priceChild: parseFloat($('vsPriceChild').value) || 0,
      priceInfant: parseFloat($('vsPriceInfant').value) || 0,
      costAdult: parseFloat($('vsCostAdult')?.value) || 0,
      costChild: parseFloat($('vsCostChild')?.value) || 0,
      costInfant: parseFloat($('vsCostInfant')?.value) || 0,
      price: parseFloat($('vsPriceAdult').value) || 0,
      createdAt: editId ? (STORE.visas.find(x => x.id === parseInt(editId))?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };
    await dbSave(STORES.visas, data);
    STORE.visas = await dbGetAll(STORES.visas);
    hideLoading();
    closeModal('visaSetupModal');
    renderVisasTable();
    updateSidebarBadges();
    toast(editId ? '✅ Visa updated' : '✅ Visa saved');
  } catch (e) {
    hideLoading();
    toast('Save failed: ' + e.message, 'error');
  }
}

function deleteVisa(id) {
  const v = STORE.visas.find(x => x.id === id);
  if (!v) return;
  confirmDelete(`Delete visa "${v.name}"?`, async () => {
    const idx = STORE.visas.findIndex(x => x.id === id);
    if (idx < 0) return;
    STORE.visas.splice(idx, 1);
    await dbDelete(STORES.visas, id);
    STORE.visas = await dbGetAll(STORES.visas);
    renderVisasTable();
    updateSidebarBadges();
    toast('Visa deleted', 'warning');
  });
}

function renderVisasTable() {
  const el = $('visasTable');
  if (!el) return;
  const list = STORE.visas;

  if (!list.length) {
    el.innerHTML = '<div class="empty"><div class="ic">▤</div><div class="tx">No visas yet</div></div>';
    return;
  }

  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Type</th><th>Validity</th><th>Sell (Adult)</th><th>Vendor Cost</th><th></th></tr></thead>
    <tbody>${list.map(v => `<tr>
      <td><div class="cell-main">${esc(v.name)}</div></td>
      <td>${v.validity} days</td>
      <td><strong>${fmt(v.priceAdult || v.price || 0)}</strong></td>
      <td style="color:var(--blue);font-weight:700">${fmt(v.costAdult || 0)}</td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn btn-sm btn-ghost btn-icon" onclick="openVisaSetup(${v.id})">✏️</button>
        <button class="btn btn-sm btn-ghost btn-icon" onclick="quickAddVisa(${v.id})">➕</button>
        <button class="btn btn-sm btn-ghost btn-icon" onclick="deleteVisa(${v.id})">🗑️</button>
      </td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}