/* ============================================================
   UMRAH BUILDER — MASTERS / HOTELS
   ============================================================ */

function openHotelSetup(cityType, editId = null, preselectedVendorId = null) {
  $('hsCityType').value = cityType;
  $('hsEditId').value = editId || '';

  const vendorSelect = $('hsVendorId');
  if (vendorSelect) {
    const vendors = STORE.vendors.filter(v => v.type === 'hotel');
    vendorSelect.innerHTML = '<option value="">-- No Vendor --</option>' +
      vendors.map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('');
  }

  hotelImgs.forEach((it, i) => {
    if (it && it.url) URL.revokeObjectURL(it.url);
    hotelImgs[i] = null;
  });

  if (editId) {
    const store = cityType === 'makkah' ? STORE.makkahHotels : STORE.madinahHotels;
    const h = store.find(x => x.id === editId);
    if (h) {
      $('hotelModalTitle').textContent = '✏️ Edit Hotel';
      $('hsName').value = h.name || '';
      $('hsDistance').value = h.distance || '';
      $('hsStar').value = h.star || '4';
      $('hsQuad').value = h.quad || '';
      $('hsTriple').value = h.triple || '';
      $('hsDouble').value = h.double || '';
      $('hsSingle').value = h.single || '';
      $('hsBreakfast').value = h.breakfast || '';
      $('hsHalfBoard').value = h.halfBoard || '';
      $('hsFullBoard').value = h.fullBoard || '';
      $('hsValidFrom').value = h.validFrom || '';
      $('hsValidUntil').value = h.validUntil || '';
      if (vendorSelect) vendorSelect.value = h.vendorId || '';

      (async () => {
        if (h.imageIds && h.imageIds.length) {
          for (let i = 0; i < Math.min(h.imageIds.length, 3); i++) {
            const url = await getImageUrl(h.imageIds[i]);
            if (url) hotelImgs[i] = { file: null, url, existingId: h.imageIds[i] };
          }
          renderImageGrid('hotelImgGrid', hotelImgs);
        }
      })();
    }
  } else {
    $('hotelModalTitle').textContent = cityType === 'makkah' ? '🕌 Add Makkah Hotel' : '🕌 Add Madinah Hotel';
    ['hsName','hsDistance','hsQuad','hsTriple','hsDouble','hsSingle','hsBreakfast','hsHalfBoard','hsFullBoard','hsValidFrom','hsValidUntil'].forEach(id => {
      const e = $(id);
      if (e) e.value = '';
    });
    if ($('hsStar')) $('hsStar').value = '4';
    if (vendorSelect) vendorSelect.value = preselectedVendorId || '';
  }

  renderImageGrid('hotelImgGrid', hotelImgs);
  clearAllErrors();
  openModal('hotelSetupModal');
}

async function saveHotelSetup() {
  clearAllErrors();
  const name = $('hsName').value.trim();
  const cityType = $('hsCityType').value;
  const editId = $('hsEditId').value;

  if (!name) {
    setError('hsName', 'Hotel name দিন');
    toast('Hotel name দিন', 'error');
    return;
  }

  showLoading('Saving...');
  try {
    const storeName = cityType === 'makkah' ? STORES.makkahHotels : STORES.madinahHotels;
    const existing = editId ? STORE[cityType === 'makkah' ? 'makkahHotels' : 'madinahHotels'].find(x => x.id === parseInt(editId)) : null;
    const newImageIds = await saveImagesForRecord('hotel_' + Date.now(), hotelImgs);
    const keepIds = hotelImgs.filter(it => it && it.existingId).map(it => it.existingId);
    const imageIds = [...keepIds, ...newImageIds];
    const vendorId = $('hsVendorId')?.value ? parseInt($('hsVendorId').value) : null;

    const data = {
      id: editId ? parseInt(editId) : Date.now(),
      city: cityType === 'makkah' ? 'Makkah' : 'Madinah',
      cityType,
      name,
      distance: $('hsDistance').value.trim(),
      star: $('hsStar').value,
      quad: parseFloat($('hsQuad').value) || 0,
      triple: parseFloat($('hsTriple').value) || 0,
      double: parseFloat($('hsDouble').value) || 0,
      single: parseFloat($('hsSingle').value) || 0,
      breakfast: parseFloat($('hsBreakfast').value) || 0,
      halfBoard: parseFloat($('hsHalfBoard').value) || 0,
      fullBoard: parseFloat($('hsFullBoard').value) || 0,
      validFrom: $('hsValidFrom').value || '',
      validUntil: $('hsValidUntil').value || '',
      vendorId,
      imageIds,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    await dbSave(storeName, data);
    if (cityType === 'makkah') STORE.makkahHotels = await dbGetAll(STORES.makkahHotels);
    else STORE.madinahHotels = await dbGetAll(STORES.madinahHotels);

    hideLoading();
    closeModal('hotelSetupModal');
    renderHotelsTable(cityType);
    updateSidebarBadges();
    if (typeof renderDashboard === 'function') renderDashboard();
    toast(editId ? '✅ Hotel updated' : '✅ Hotel saved');
  } catch (e) {
    hideLoading();
    toast('Save failed: ' + e.message, 'error');
  }
}

function deleteHotel(id, cityType) {
  const arr = cityType === 'makkah' ? STORE.makkahHotels : STORE.madinahHotels;
  const h = arr.find(x => x.id === id);
  if (!h) return;

  confirmDelete(`Delete "${h.name}" hotel?`, async () => {
    const storeName = cityType === 'makkah' ? STORES.makkahHotels : STORES.madinahHotels;
    const idx = arr.findIndex(x => x.id === id);
    if (idx < 0) return;
    arr.splice(idx, 1);
    await dbDelete(storeName, id);
    if (cityType === 'makkah') STORE.makkahHotels = await dbGetAll(storeName);
    else STORE.madinahHotels = await dbGetAll(storeName);
    renderHotelsTable(cityType);
    updateSidebarBadges();
    if (typeof renderDashboard === 'function') renderDashboard();
    toast('Hotel deleted', 'warning');
  });
}

async function renderHotelsTable(cityType) {
  const el = $(cityType === 'makkah' ? 'makkahTable' : 'madinahTable');
  if (!el) return;

  let list = cityType === 'makkah' ? STORE.makkahHotels : STORE.madinahHotels;
  const starFilter = $(cityType === 'makkah' ? 'makkahStarFilter' : 'madinahStarFilter')?.value || 'all';
  const statusFilter = $(cityType === 'makkah' ? 'makkahStatusFilter' : 'madinahStatusFilter')?.value || 'all';

  if (starFilter !== 'all') list = list.filter(h => String(h.star) === starFilter);
  if (statusFilter === 'active') list = list.filter(h => !isHotelExpired(h));
  else if (statusFilter === 'expired') list = list.filter(h => isHotelExpired(h));

  if (!list.length) {
    el.innerHTML = '<div class="empty"><div class="ic">🕌</div><div class="tx">No hotels found</div></div>';
    return;
  }

  const rows = await Promise.all(list.map(async h => {
    let img = null;
    if (h.imageIds && h.imageIds.length) img = await getImageUrl(h.imageIds[0]);
    const expired = isHotelExpired(h);
    const expiringSoon = isHotelExpiringSoon(h);

    let statusBadge = '';
    if (expired) statusBadge = '<span class="status-badge expired">⚠️ EXPIRED</span>';
    else if (expiringSoon) statusBadge = '<span class="status-badge warning">⏰ Expiring Soon</span>';
    else if (h.validUntil) statusBadge = '<span class="status-badge active">✓ Active</span>';

    const validity = (h.validFrom || h.validUntil)
      ? `<div class="validity-info ${expired ? 'expired' : ''}">📅 ${h.validFrom || '—'} → ${h.validUntil || '—'}</div>`
      : '';

    const vendorName = h.vendorId ? (STORE.vendors.find(v => v.id === h.vendorId)?.name || '') : '';

    return `<tr class="${expired ? 'expired-row' : ''}">
      <td>
        <div class="cell-avatar">${img ? `<img src="${img}">` : '🕌'}</div>
        <div class="cell-main">${esc(h.name)} ${statusBadge}</div>
        ${h.distance ? `<div class="cell-sub">📍 ${esc(h.distance)}</div>` : ''}
        ${vendorName ? `<div class="cell-sub" style="color:var(--blue)">🏢 ${esc(vendorName)}</div>` : ''}
        ${validity}
      </td>
      <td>${'⭐'.repeat(parseInt(h.star) || 0)}</td>
      <td><div class="cell-sub" style="color:var(--text-2);font-size:11.5px;line-height:1.7">
        <b>Q:</b> ${fmt(h.quad)} · <b>T:</b> ${fmt(h.triple)}<br>
        <b>D:</b> ${fmt(h.double)} · <b>S:</b> ${fmt(h.single)}
      </div></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn btn-sm btn-ghost btn-icon" onclick="openHotelSetup('${cityType}',${h.id})">✏️</button>
        <button class="btn btn-sm btn-ghost btn-icon" onclick="quickAddHotel('${cityType}',${h.id})">➕</button>
        <button class="btn btn-sm btn-ghost btn-icon" onclick="deleteHotel(${h.id},'${cityType}')">🗑️</button>
      </td>
    </tr>`;
  }));

  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Hotel</th><th>Star</th><th>Selling Rates (per night)</th><th></th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table></div>`;
}

function openHotelSetupFromVendor(cityType) {
  $('vthCityType').value = cityType;
  const vendors = STORE.vendors.filter(v => v.type === 'hotel');
  if (!vendors.length) {
    toast('No hotel vendors yet. Create a vendor first.', 'warning');
    return;
  }
  const sel = $('vthVendorId');
  sel.innerHTML = '<option value="">-- Choose Vendor --</option>' +
    vendors.map(v => `<option value="${v.id}">${esc(v.name)}${v.phone ? ' · ' + esc(v.phone) : ''}</option>`).join('');
  openModal('vendorToHotelModal');
}

function proceedVendorToHotel() {
  const vendorId = $('vthVendorId').value;
  const cityType = $('vthCityType').value;
  if (!vendorId) {
    toast('Choose a vendor', 'error');
    return;
  }
  closeModal('vendorToHotelModal');
  setTimeout(() => openHotelSetup(cityType, null, parseInt(vendorId)), 200);
}