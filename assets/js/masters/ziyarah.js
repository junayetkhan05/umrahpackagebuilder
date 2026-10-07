/* ============================================================
   UMRAH BUILDER — MASTERS / ZIYARAH
   Ziyarah master CRUD + places draft + car options
   ============================================================ */

/* ziyarahPlacesDraft, ziyarahPlaceCounter declared in state.js */

function openZiyarahSetup(editId = null) {
  ziyarahPlacesDraft = [];
  ziyarahPlaceCounter = 0;

  if (editId) {
    const z = STORE.ziyarah.find(x => x.id === editId);
    if (z) {
      $('ziyarahModalTitle').textContent = '✏️ Edit Ziyarah';
      $('zsEditId').value = editId;
      $('zsName').value = z.name || '';
      $('zsCity').value = z.city || 'Makkah';
      $('zsDuration').value = z.duration || '';
      $('zsMainDesc').value = z.mainDesc || '';
      $('zsCarSedan').value = z.carRates?.sedan || '';
      $('zsCar7Seater').value = z.carRates?.['7seater'] || '';
      $('zsCarHiace').value = z.carRates?.hiace || '';
      $('zsCarCoaster').value = z.carRates?.coaster || '';
      ziyarahPlacesDraft = JSON.parse(JSON.stringify(z.places || []));
      ziyarahPlaceCounter = Math.max(0, ...ziyarahPlacesDraft.map(p => p.id || 0));
    }
  } else {
    $('ziyarahModalTitle').textContent = '★ Add Ziyarah';
    $('zsEditId').value = '';
    ['zsName','zsDuration','zsMainDesc','zsCarSedan','zsCar7Seater','zsCarHiace','zsCarCoaster'].forEach(id => setVal(id, ''));
    setVal('zsCity', 'Makkah');
  }
  renderZiyarahPlacesDraft();
  clearAllErrors();
  openModal('ziyarahSetupModal');
}

function addZiyarahPlaceRow() {
  ziyarahPlaceCounter++;
  ziyarahPlacesDraft.push({ id: ziyarahPlaceCounter, name: '', desc: '' });
  renderZiyarahPlacesDraft();
}

function removeZiyarahPlaceDraft(id) {
  ziyarahPlacesDraft = ziyarahPlacesDraft.filter(p => p.id !== id);
  renderZiyarahPlacesDraft();
}

function updateZiyarahPlaceDraft(id, field, value) {
  const p = ziyarahPlacesDraft.find(x => x.id === id);
  if (p) p[field] = value;
}

function renderZiyarahPlacesDraft() {
  const el = $('zsPlacesList');
  if (!el) return;
  if ($('zsPlacesCount')) $('zsPlacesCount').textContent = ziyarahPlacesDraft.length;

  if (!ziyarahPlacesDraft.length) {
    el.innerHTML = '<div class="empty-slot" style="padding:14px"><span class="ic">📍</span>No places added</div>';
    return;
  }

  el.innerHTML = ziyarahPlacesDraft.map((p, i) => `
    <div class="place-item">
      <input type="text" class="place-name" value="${escapeAttr(p.name)}"
             placeholder="Place ${i + 1} name" onchange="updateZiyarahPlaceDraft(${p.id},'name',this.value)">
      <textarea class="place-desc" placeholder="Description..." onchange="updateZiyarahPlaceDraft(${p.id},'desc',this.value)">${esc(p.desc)}</textarea>
      <button class="rm-btn" onclick="removeZiyarahPlaceDraft(${p.id})">✕</button>
    </div>
  `).join('');
}

async function saveZiyarahSetup() {
  clearAllErrors();
  const name = $('zsName').value.trim();
  const editId = $('zsEditId').value;

  if (!name) {
    setError('zsName', 'Name required');
    toast('Name required', 'error');
    return;
  }

  showLoading('Saving...');
  try {
    const existing = editId ? STORE.ziyarah.find(x => x.id === parseInt(editId)) : null;
    const data = {
      id: editId ? parseInt(editId) : Date.now(),
      name,
      city: $('zsCity').value,
      duration: $('zsDuration').value.trim(),
      mainDesc: $('zsMainDesc').value.trim(),
      places: JSON.parse(JSON.stringify(ziyarahPlacesDraft)),
      carRates: {
        sedan: parseFloat($('zsCarSedan').value) || 0,
        '7seater': parseFloat($('zsCar7Seater').value) || 0,
        hiace: parseFloat($('zsCarHiace').value) || 0,
        coaster: parseFloat($('zsCarCoaster').value) || 0
      },
      price: parseFloat($('zsCarHiace').value) || 0,
      places_text: ziyarahPlacesDraft.map(p => p.name).filter(Boolean).join(', '),
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    await dbSave(STORES.ziyarah, data);
    STORE.ziyarah = await dbGetAll(STORES.ziyarah);

    hideLoading();
    closeModal('ziyarahSetupModal');
    renderZiyarahMasterPage();
    updateSidebarBadges();

    try { regenerateItineraryFromDates(); } catch (e) {}
    try { renderZiyarahTransportList(); } catch (e) {}

    toast(editId ? '✅ Ziyarah updated' : '✅ Ziyarah saved');
  } catch (e) {
    hideLoading();
    toast('Save failed: ' + e.message, 'error');
  }
}

function deleteZiyarah(id) {
  const z = STORE.ziyarah.find(x => x.id === id);
  if (!z) return;
  confirmDelete(`Delete ziyarah "${z.name}"?`, async () => {
    const idx = STORE.ziyarah.findIndex(x => x.id === id);
    if (idx < 0) return;
    STORE.ziyarah.splice(idx, 1);
    await dbDelete(STORES.ziyarah, id);
    STORE.ziyarah = await dbGetAll(STORES.ziyarah);
    renderZiyarahMasterPage();
    updateSidebarBadges();

    try { regenerateItineraryFromDates(); } catch (e) {}
    try { renderZiyarahTransportList(); } catch (e) {}

    toast('Ziyarah deleted', 'warning');
  });
}

function duplicateZiyarah(id) {
  const z = STORE.ziyarah.find(x => x.id === id);
  if (!z) return;
  if (!confirm(`Duplicate "${z.name}"?`)) return;

  const copy = JSON.parse(JSON.stringify(z));
  copy.id = Date.now();
  copy.name = (z.name || 'Ziyarah') + ' (Copy)';
  copy.createdAt = Date.now();
  copy.updatedAt = Date.now();

  dbSave(STORES.ziyarah, copy).then(async () => {
    STORE.ziyarah = await dbGetAll(STORES.ziyarah);
    renderZiyarahMasterPage();
    updateSidebarBadges();
    toast('✅ Ziyarah duplicated');
  }).catch(e => toast('Failed: ' + e.message, 'error'));
}

function renderZiyarahMasterPage() {
  const el = $('ziyarahMasterList');
  if (!el) return;

  const list = STORE.ziyarah.slice().sort((a, b) => (a.city || '').localeCompare(b.city || ''));

  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="ic">★</div><div class="tx">No Ziyarah yet — Click "Add Ziyarah"</div></div>`;
    return;
  }

  el.innerHTML = list.map(z => {
    const cityKey = (z.city || 'makkah').toLowerCase();
    const carRates = z.carRates || {};
    const places = z.places || [];
    const hasCars = (carRates.sedan || 0) + (carRates['7seater'] || 0) + (carRates.hiace || 0) + (carRates.coaster || 0) > 0;

    return `
      <div class="zy-master-card">
        <div class="zy-master-head">
          <div class="zy-master-title">
            <span class="zy-city-badge ${cityKey}">🕌 ${esc(z.city || 'Makkah')}</span>
            ${esc(z.name)}
          </div>
          <div class="zy-master-actions">
            <button class="btn btn-sm btn-ghost btn-icon" onclick="openZiyarahSetup(${z.id})" title="Edit">✏️</button>
            <button class="btn btn-sm btn-ghost btn-icon" onclick="duplicateZiyarah(${z.id})" title="Duplicate">📋</button>
            <button class="btn btn-sm btn-ghost btn-icon" onclick="deleteZiyarah(${z.id})" title="Delete">🗑️</button>
          </div>
        </div>
        ${z.duration ? `<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:var(--blue-bg);border-radius:20px;font-size:11px;color:var(--blue);font-weight:700;margin-bottom:12px">⏱️ ${esc(z.duration)}</div>` : ''}
        ${z.mainDesc ? `<div class="zy-master-desc">${esc(z.mainDesc)}</div>` : ''}
        ${places.length ? `
          <div style="display:flex;align-items:center;gap:8px;margin:14px 0 8px">
            <span style="font-size:11px;font-weight:800;color:var(--text-3);text-transform:uppercase;letter-spacing:.8px">📍 Places to Visit</span>
            <span style="font-size:10px;background:var(--amber-bg);color:var(--amber);padding:2px 8px;border-radius:20px;font-weight:800">${places.length}</span>
          </div>
          <div class="zy-places-list">
            ${places.slice(0, 8).map(p => `<div class="zy-place-item"><b>${esc(p.name)}</b>${p.desc ? ' — ' + esc(p.desc) : ''}</div>`).join('')}
            ${places.length > 8 ? `<div class="zy-place-item" style="color:var(--text-3);font-style:italic">+ ${places.length - 8} more...</div>` : ''}
          </div>
        ` : ''}
        <div style="display:flex;align-items:center;gap:8px;margin:14px 0 8px">
          <span style="font-size:11px;font-weight:800;color:var(--text-3);text-transform:uppercase;letter-spacing:.8px">🚗 Car Rates (Per Vehicle)</span>
          ${!hasCars ? '<span style="font-size:10px;background:var(--red-bg);color:var(--red);padding:2px 8px;border-radius:20px;font-weight:800">⚠️ Not Set</span>' : ''}
        </div>
        <div class="zy-car-rates-row">
          <div class="zy-car-chip"><div class="icon">🚗</div><div class="name">Sedan (4)</div><div class="price">${carRates.sedan ? fmt(carRates.sedan) : '—'}</div></div>
          <div class="zy-car-chip"><div class="icon">🚐</div><div class="name">7-Seater (7)</div><div class="price">${carRates['7seater'] ? fmt(carRates['7seater']) : '—'}</div></div>
          <div class="zy-car-chip"><div class="icon">🚐</div><div class="name">Hiace (12)</div><div class="price">${carRates.hiace ? fmt(carRates.hiace) : '—'}</div></div>
          <div class="zy-car-chip"><div class="icon">🚌</div><div class="name">Coaster (22)</div><div class="price">${carRates.coaster ? fmt(carRates.coaster) : '—'}</div></div>
        </div>
      </div>
    `;
  }).join('');
}

function getZiyarahCarOptions() {
  return [
    { id: 'sedan', label: 'Sedan', seats: 4 },
    { id: '7seater', label: '7-Seater SUV', seats: 7 },
    { id: 'hiace', label: 'Hiace', seats: 12 },
    { id: 'coaster', label: 'Coaster', seats: 22 }
  ];
}

function autoSelectBestCar(pax, carRates) {
  const options = getZiyarahCarOptions();
  let best = null;
  options.forEach(opt => {
    const rate = Number(carRates[opt.id] || 0);
    if (rate <= 0) return;
    const cars = Math.ceil(pax / opt.seats);
    const total = rate * cars;
    const wastedSeats = (cars * opt.seats) - pax;
    if (best === null || total < best.total || (total === best.total && wastedSeats < best.wastedSeats)) {
      best = { car: opt.id, cars, rate, total, seats: opt.seats, label: opt.label, wastedSeats };
    }
  });
  return best;
}

function buildZiyarahDescriptionFromMaster(z) {
  if (!z) return '';
  let text = (z.mainDesc || '').trim();
  if (text) text += '\n\n';

  let placesArr = [];
  if (Array.isArray(z.places)) {
    placesArr = z.places;
  } else if (typeof z.places === 'string' && z.places.trim()) {
    placesArr = z.places.split(',').map(s => ({ name: s.trim(), desc: '' })).filter(p => p.name);
  } else if (z.places_text) {
    placesArr = String(z.places_text).split(',').map(s => ({ name: s.trim(), desc: '' })).filter(p => p.name);
  }

  if (placesArr.length) {
    text += 'Places to Visit\n\n';
    placesArr.forEach(p => {
      const pname = typeof p === 'string' ? p : (p?.name || '');
      const pdesc = typeof p === 'object' ? (p?.desc || '') : '';
      if (pname && pname.trim()) {
        text += pname.trim();
        if (pdesc && pdesc.trim()) text += ` — ${pdesc.trim()}`;
        text += '\n\n';
      }
    });
  }

  if (z.duration) text += `Duration: ${z.duration}\n`;
  return text.trim();
}