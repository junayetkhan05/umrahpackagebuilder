/* ============================================================
   UMRAH BUILDER — PAGES / PACKAGES
   List + search + view modal + delete + duplicate
   ============================================================ */

/* pkgSearchQuery declared in state.js */

/* ==================== SEARCH ==================== */
function searchPackages(q) {
  pkgSearchQuery = String(q || '').toLowerCase();
  renderPackages();
}

function globalSearchHandler(q) {
  pkgSearchQuery = String(q || '').trim().toLowerCase();
  if (!pkgSearchQuery) {
    renderPackages();
    return;
  }
  nav('packages', document.querySelector('[data-page=packages]'));
}

/* ==================== RENDER PACKAGES LIST ==================== */
function renderPackages() {
  const el = $('packagesList');
  if (!el) return;

  let list = STORE.packages.slice();

  if (pkgSearchQuery) {
    list = list.filter(p =>
      (p.name || '').toLowerCase().includes(pkgSearchQuery) ||
      (p.customerName || '').toLowerCase().includes(pkgSearchQuery) ||
      (p.refNo || '').toLowerCase().includes(pkgSearchQuery) ||
      (p.customerPhone || '').toLowerCase().includes(pkgSearchQuery) ||
      (p.customerPassport || '').toLowerCase().includes(pkgSearchQuery)
    );
  }

  list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="ic">🕋</div><div class="tx">${STORE.packages.length ? 'No packages match' : 'No packages yet — Create one'}</div></div>`;
    return;
  }

  el.innerHTML = `<div class="pkg-list">` + list.map(p => {
    const cls = (p.status || 'draft').toLowerCase().replace(/\s+/g, '-');
    return `<div class="pkg-row" onclick="viewPackage(${p.id})">
      <span class="pkg-row-dot ${cls}"></span>
      <div class="pkg-row-info">
        <h4>${esc(p.name) || 'Untitled'}${p.refNo ? `<span class="ref-no">${esc(p.refNo)}</span>` : ''}</h4>
        <div class="meta">
          <span>🕋 ${esc(p.type || 'Umrah')}</span>
          <span>📅 ${p.checkIn || p.start || '—'} → ${p.checkOut || p.end || '—'}</span>
          <span>${p.nights || 0}N / ${p.days || 0}D</span>
          <span>${p.paxAdult || 0}A ${p.paxChild || 0}C</span>
        </div>
      </div>
      <span class="pkg-row-badge ${cls}">${esc(p.status || 'Draft')}</span>
      <span class="pkg-row-price">${fmt(p.grandTotal)}</span>
      <div style="display:flex;gap:4px;flex-shrink:0" onclick="event.stopPropagation()">
        <button class="btn btn-sm btn-ghost btn-icon" onclick="duplicatePackage(${p.id})">📋</button>
        <button class="btn btn-sm btn-ghost btn-icon" onclick="editPackage(${p.id})">✏️</button>
        <button class="btn btn-sm btn-ghost btn-icon" onclick="deletePackage(${p.id})">🗑️</button>
      </div>
    </div>`;
  }).join('') + `</div>`;
}

/* ==================== DELETE ==================== */
function deletePackage(id) {
  const p = STORE.packages.find(x => x.id === id);
  if (!p) return;
  confirmDelete(`Delete package "${p.name}"?`, async () => {
    const idx = STORE.packages.findIndex(x => x.id === id);
    if (idx < 0) return;
    STORE.packages.splice(idx, 1);
    await dbDelete(STORES.packages, id);
    STORE.packages = await dbGetAll(STORES.packages);
    renderPackages();
    if (typeof renderDashboard === 'function') renderDashboard();
    updateSidebarBadges();
    toast('Package deleted', 'warning');
  });
}

/* ==================== DUPLICATE ==================== */
function duplicatePackage(id) {
  const p = STORE.packages.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Duplicate "${p.name}"?`)) return;

  const copy = JSON.parse(JSON.stringify(p));
  copy.id = Date.now();
  copy.name = (p.name || 'Package') + ' (Copy)';
  copy.status = 'Draft';
  copy.customerId = null;
  copy.customerName = '';
  copy.customerPhone = '';
  copy.customerPassport = '';
  copy.customerEmail = '';
  copy.createdAt = Date.now();
  copy.updatedAt = Date.now();

  generateQuotationRef().then(refNo => {
    copy.refNo = refNo;
    dbSave(STORES.packages, copy).then(async () => {
      STORE.packages = await dbGetAll(STORES.packages);
      renderPackages();
      if (typeof renderDashboard === 'function') renderDashboard();
      updateSidebarBadges();
      toast('✅ Package duplicated');
    }).catch(e => toast('Failed: ' + e.message, 'error'));
  });
}

/* ==================== VIEW PACKAGE MODAL ==================== */
async function viewPackage(id) {
  const p = STORE.packages.find(x => x.id === id);
  if (!p) return;
  currentViewPackageId = id;

  const paxTotal = (p.paxAdult || 0) + (p.paxChild || 0);
  const cls = (p.status || 'draft').toLowerCase().replace(/\s+/g, '-');

  const sec = (title, items, renderer) =>
    `<div style="margin-bottom:20px"><h4 style="font-size:12px;font-weight:800;color:var(--text-2);margin-bottom:10px;text-transform:uppercase;letter-spacing:1.2px">${title}</h4>${items.length ? items.map(renderer).join('') : '<div style="color:var(--text-3);font-size:12px;padding:8px">None</div>'}</div>`;

  /* Hotel card renderer */
  const hotelCard = async (h) => {
    let imgHtml = '';
    if (h.imageIds && h.imageIds.length) {
      const imgData = await getImageDataURL(h.imageIds[0]);
      if (imgData) imgHtml = `<img src="${imgData}" style="width:70px;height:70px;border-radius:10px;object-fit:cover;flex-shrink:0">`;
    }
    const rooms = h.rooms || [];
    const hotelTotal = rooms.reduce((s, r) => {
      const paxInRoom = (r.adults || 0) + (r.children || 0);
      const mealPerNight = (r.mealRate || 0) * paxInRoom;
      return s + (((r.rate || 0) + mealPerNight) * (r.nights || 0));
    }, 0);

    const roomsHtml = rooms.length ? rooms.map((r, ri) => {
      const paxInRoom = (r.adults || 0) + (r.children || 0);
      const mealPerNight = (r.mealRate || 0) * paxInRoom;
      const total = ((r.rate || 0) + mealPerNight) * (r.nights || 0);
      const mealLabel = {
        room_only: 'Room Only',
        breakfast: '🍳 Breakfast',
        half_board: '🍱 Half Board',
        full_board: '🍽️ Full Board'
      }[r.meal] || 'Room Only';
      return `<div style="padding:6px 10px;background:var(--card);border-radius:8px;margin-top:6px;display:flex;justify-content:space-between;align-items:center;font-size:11.5px;border:1px solid var(--border)"><span><b>Room ${ri + 1}</b> · ${r.type.toUpperCase()} · ${r.adults}A${r.children ? '+' + r.children + 'C' : ''} · ${r.nights}N · ${mealLabel}</span><b style="color:var(--primary)">${fmt(total)}</b></div>`;
    }).join('') : '<div style="font-size:11px;color:var(--text-3);margin-top:4px">No rooms</div>';

    return `<div style="padding:14px;background:var(--bg-2);border-radius:10px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
        ${imgHtml || '<div style="width:70px;height:70px;border-radius:10px;background:var(--primary-bg);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">🕌</div>'}
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">${esc(h.name) || '—'}</div>
          <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">📍 ${esc(h.distance) || '—'} · ${'⭐'.repeat(parseInt(h.star) || 0)}</div>
          ${h.checkIn ? `<div style="font-size:11px;color:var(--blue);margin-top:2px">📅 ${h.checkIn} → ${h.checkOut}</div>` : ''}
        </div>
        <div style="font-weight:800;color:var(--primary);font-size:15px">${fmt(hotelTotal)}</div>
      </div>
      ${roomsHtml}
    </div>`;
  };

  const simpleRow = (icon, title, sub, amount) =>
    `<div style="padding:12px 14px;background:var(--bg-2);border-radius:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:12px"><div><div style="font-weight:700;font-size:13px">${icon} ${esc(title)}</div>${sub ? `<div style="font-size:11px;color:var(--text-3);margin-top:2px">${esc(sub)}</div>` : ''}</div><div style="font-weight:800;color:var(--primary);font-size:14px">${fmt(amount)}</div></div>`;

  /* Itinerary */
  const itineraryHtml = (() => {
    const seen = new Set();
    const uniqueItems = [];
    (p.itinerary || []).forEach(it => {
      const key = `${it.day}-${it.title || ''}-${it.description || ''}`;
      if (!seen.has(key)) { seen.add(key); uniqueItems.push(it); }
    });
    const maxDays = p.days || uniqueItems.length;
    const capped = uniqueItems.slice(0, maxDays);

    if (!capped.length) return '<div style="color:var(--text-3);font-size:12px;padding:8px">No itinerary</div>';

    return capped.map((it) => {
      const cityKey = (it.city || 'makkah').toLowerCase();
      const badge = it.city
        ? `<span style="font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;background:${cityKey === 'makkah' ? 'var(--primary-bg)' : cityKey === 'madinah' ? 'var(--green-bg)' : 'var(--blue-bg)'};color:${cityKey === 'makkah' ? 'var(--primary)' : cityKey === 'madinah' ? 'var(--green)' : 'var(--blue)'};margin-left:6px">${cityKey.toUpperCase()}</span>`
        : '';
      return `<div style="padding:12px 14px;background:var(--bg-2);border-radius:10px;margin-bottom:6px;display:flex;gap:12px;align-items:flex-start"><div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:11px;flex-shrink:0">D${it.day}<small style="font-size:8px;opacity:.9">DAY</small></div><div style="flex:1"><div style="font-weight:700;font-size:13px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">${esc(it.title) || 'Day ' + it.day} ${badge}</div>${it.description ? `<div style="font-size:11.5px;color:var(--text-2);margin-top:4px;line-height:1.6;white-space:pre-wrap">${esc(it.description)}</div>` : ''}</div></div>`;
    }).join('');
  })();

  /* Inclusions/Exclusions */
  const viewInclusions = dedupeTextItems(p.inclusions || []);
  const viewExclusions = dedupeTextItems(p.exclusions || []);
  const inclusionsHtml = viewInclusions.length
    ? `<ul style="list-style:none;padding:0">${viewInclusions.map(it => `<li style="padding:4px 0 4px 20px;position:relative;font-size:12.5px;color:var(--text-2)"><span style="position:absolute;left:0;color:var(--green);font-weight:800">✓</span>${esc(it.text)}</li>`).join('')}</ul>`
    : '<div style="color:var(--text-3);font-size:12px;padding:8px">None</div>';
  const exclusionsHtml = viewExclusions.length
    ? `<ul style="list-style:none;padding:0">${viewExclusions.map(it => `<li style="padding:4px 0 4px 20px;position:relative;font-size:12.5px;color:var(--text-2)"><span style="position:absolute;left:0;color:var(--red);font-weight:800">✕</span>${esc(it.text)}</li>`).join('')}</ul>`
    : '<div style="color:var(--text-3);font-size:12px;padding:8px">None</div>';

  /* Hotel cards */
  let makkahRowsHtml = '', madinahRowsHtml = '';
  for (const h of (p.makkahHotels || [])) makkahRowsHtml += await hotelCard(h);
  for (const h of (p.madinahHotels || [])) madinahRowsHtml += await hotelCard(h);

  /* Vendor payments */
  let vendorPaidForPkg = 0;
  const vendorPaymentsByCategory = {};
  STORE.vendors.forEach(v => {
    (v.payments || []).forEach(pm => {
      if (pm.packageId === p.id) {
        vendorPaidForPkg += (pm.amount || 0);
        if (!vendorPaymentsByCategory[pm.category]) vendorPaymentsByCategory[pm.category] = 0;
        vendorPaymentsByCategory[pm.category] += (pm.amount || 0);
      }
    });
  });

  /* Customer payments */
  let customerPaidForPkg = getPackageAdvance(p);
  STORE.customers.forEach(c => {
    (c.payments || []).forEach(pm => {
      if (pm.packageId === p.id) customerPaidForPkg += Math.max(0, Number(pm.amount || 0));
    });
  });

  const customerDue = Math.max(0, (p.grandTotal || 0) - customerPaidForPkg);
  const vendorDuePkg = Math.max(0, (p.totalVendorCost || 0) - vendorPaidForPkg);

  const hotelVendorBreakdown = renderHotelVendorBreakdown(p);

  const vendorCostButtons = `
    <div style="padding:16px;background:var(--bg-2);border-radius:12px;margin-top:16px;border:1px solid var(--border)">
      <h4 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--text-2);margin-bottom:10px">💸 Vendor Payments (Vendor Cost: ${fmt(p.totalVendorCost || 0)})</h4>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <button class="btn btn-secondary btn-sm" onclick="openVendorPaymentModal(${p.id},'hotel')">🕌 Hotel<br><span style="font-size:10px">${fmt(vendorPaymentsByCategory.hotel || 0)} / ${fmt(p.vendorHotelCost || 0)}</span></button>
        <button class="btn btn-secondary btn-sm" onclick="openVendorPaymentModal(${p.id},'flight')">✈ Flight<br><span style="font-size:10px">${fmt(vendorPaymentsByCategory.flight || 0)} / ${fmt(p.vendorFlightCost || 0)}</span></button>
        <button class="btn btn-secondary btn-sm" onclick="openVendorPaymentModal(${p.id},'transport')">▣ Transport<br><span style="font-size:10px">${fmt(vendorPaymentsByCategory.transport || 0)} / ${fmt(p.vendorTransportCost || 0)}</span></button>
        <button class="btn btn-secondary btn-sm" onclick="openVendorPaymentModal(${p.id},'visa')">▤ Visa<br><span style="font-size:10px">${fmt(vendorPaymentsByCategory.visa || 0)} / ${fmt(p.vendorVisaCost || 0)}</span></button>
        <button class="btn btn-secondary btn-sm" onclick="openVendorPaymentModal(${p.id},'service')">▦ Service<br><span style="font-size:10px">${fmt(vendorPaymentsByCategory.service || 0)} / ${fmt(p.vendorServiceCost || 0)}</span></button>
      </div>
    </div>`;

  const html = `<div class="modal-bg act">
    <div class="modal wide">
      <div class="modal-head">
        <h2>🕋 Package Details ${p.refNo ? `<span style="font-size:11px;color:var(--text-3);font-weight:600;margin-left:8px">${esc(p.refNo)}</span>` : ''}</h2>
        <button class="close-btn" onclick="this.closest('.modal-bg').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div style="padding:20px;background:linear-gradient(135deg,var(--primary-bg),var(--card));border-radius:14px;margin-bottom:20px;border:1px solid var(--primary-light)">
          <h3 style="font-size:20px;font-weight:800;margin-bottom:8px">${esc(p.name)}</h3>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <span class="pill ${cls}"><span class="dot"></span>${esc(p.status || 'Draft')}</span>
            <span style="font-size:12px;color:var(--text-2)">📅 ${p.checkIn || p.start || '—'} → ${p.checkOut || p.end || '—'}</span>
            <span style="font-size:12px;color:var(--text-2)">📆 ${p.nights || 0}N / ${p.days || 0}D</span>
            <span style="font-size:12px;color:var(--text-2)">👥 ${p.paxAdult || 0}A ${p.paxChild || 0}C</span>
          </div>
          <div style="font-size:12.5px;color:var(--text-2);margin-top:10px">👤 <b>${esc(p.customerName)}</b>${p.customerPhone ? ' · 📞 ' + esc(p.customerPhone) : ''}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px">
          <div style="padding:16px;border-radius:14px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff">
            <div style="font-size:11px;opacity:.9;text-transform:uppercase;font-weight:800;margin-bottom:8px">👤 Customer</div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px"><span>Sell:</span><b>${fmt(p.grandTotal)}</b></div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px"><span>Paid:</span><b>${fmt(customerPaidForPkg)}</b></div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;padding-top:6px;border-top:1px solid rgba(255,255,255,.3)"><span>Due:</span><b>${fmt(customerDue)}</b></div>
          </div>
          <div style="padding:16px;border-radius:14px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff">
            <div style="font-size:11px;opacity:.9;text-transform:uppercase;font-weight:800;margin-bottom:8px">🏢 Vendor</div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px"><span>Cost:</span><b>${fmt(p.totalVendorCost || 0)}</b></div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px"><span>Paid:</span><b>${fmt(vendorPaidForPkg)}</b></div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;padding-top:6px;border-top:1px solid rgba(255,255,255,.3)"><span>Due:</span><b>${fmt(vendorDuePkg)}</b></div>
          </div>
        </div>

        ${makkahRowsHtml ? sec('🕌 Makkah Hotels', [1], () => makkahRowsHtml) : ''}
        ${madinahRowsHtml ? sec('🕌 Madinah Hotels', [1], () => madinahRowsHtml) : ''}
        ${(p.ziyarahTransport && p.ziyarahTransport.length) ? sec('★ Ziyarah Transport', p.ziyarahTransport, t => simpleRow('🚐', t.name || 'Ziyarah', CAR_SEATERS[t.car]?.label || t.car, (t.price || 0) * (t.cars || 1))) : ''}
        ${sec('Flights', p.flights || [], f => {
          const isRound = f.tripType === 'round_trip';
          const totalAdult = (f.fareAdult || 0) + (isRound ? (f.returnFareAdult || 0) : 0);
          const total = totalAdult * (p.paxAdult || 0) + ((f.fareChild || 0) + (isRound ? (f.returnFareChild || 0) : 0)) * (p.paxChild || 0);
          return simpleRow('✈', f.from + (isRound ? ' ⇄ ' : ' → ') + f.to, (f.airline || '') + ' · ' + (isRound ? 'Round Trip' : 'One Way'), total);
        })}
        ${sec('Transports', p.transports || [], t => {
          const isPerVehicle = t.priceType === 'per_vehicle';
          const total = isPerVehicle ? (t.price || 0) * (t.vehicleCount || 1) : (t.price || 0) * paxTotal;
          const cap = VEHICLE_CAPACITY[t.vehicle] || t.capacity || '';
          const sub = isPerVehicle ? `${t.vehicle} (${cap} seats) × ${t.vehicleCount || 1} vehicle` : `${paxTotal} pax`;
          return simpleRow('▣', t.from + ' → ' + t.to, sub, total);
        })}
        ${sec('Visa', p.visas || [], v => simpleRow('▤', v.name, '', ((v.priceAdult || v.price || 0) * (p.paxAdult || 0)) + ((v.priceChild || 0) * (p.paxChild || 0))))}
        ${sec('Services', p.services || [], s => simpleRow('▦', s.name, '', (s.price || 0) * (s.priceType === 'per_group' ? 1 : paxTotal)))}
        ${sec('📅 Itinerary', itineraryHtml ? [1] : [], () => itineraryHtml)}
        ${sec('✅ Inclusions', inclusionsHtml ? [1] : [], () => inclusionsHtml)}
        ${sec('✕ Exclusions', exclusionsHtml ? [1] : [], () => exclusionsHtml)}
        ${hotelVendorBreakdown}
        ${vendorCostButtons}

        <div style="padding:20px;background:var(--bg-2);border-radius:14px;margin-top:16px;border:1px solid var(--border);display:none" id="adminCostSection">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:var(--text-2)"><span>Customer Sell (Sub Total)</span><span style="font-weight:700;color:var(--text)">${fmt(p.subTotal)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:var(--text-2)"><span>Vendor Cost</span><span style="font-weight:700;color:var(--blue)">${fmt(p.totalVendorCost || 0)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:var(--text-2)"><span>VAT (${p.vatPercent || 0}%)</span><span style="font-weight:700;color:var(--amber)">${fmt(p.vatAmount || 0)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:16px;border-top:2px solid var(--border-2);margin-top:6px"><span style="font-weight:800">GRAND TOTAL</span><span style="font-weight:900;color:var(--primary);font-size:20px">${fmt(p.grandTotal)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:var(--red)"><span>Customer Due</span><span style="font-weight:800">${fmt(customerDue)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:var(--text-2)"><span>Profit</span><span style="font-weight:700;color:var(--green)">${fmt(p.actualProfit)}</span></div>
        </div>
      </div>
      <div class="modal-foot">
        <div class="left-actions">
          <button class="btn btn-secondary btn-sm" onclick="toggleAdminCost()" id="toggleAdminBtn">👁️ Show Admin View</button>
          <button class="btn btn-danger" onclick="deletePackageFromView()">🗑️ Delete</button>
        </div>
        <div class="right-actions">
          <button class="btn btn-secondary" onclick="sharePackageWhatsApp(${p.id})">📱 WhatsApp</button>
          <button class="btn btn-green" onclick="printQuotation(${p.id})">🖨️ Quotation</button>
          <button class="btn btn-primary" onclick="this.closest('.modal-bg').remove(); editPackage(${p.id})">✏️ Edit</button>
        </div>
      </div>
    </div>
  </div>`;

  $('modalsContainer').insertAdjacentHTML('beforeend', html);
}

/* ==================== ADMIN COST TOGGLE ==================== */
function toggleAdminCost() {
  const sec = $('adminCostSection');
  const btn = $('toggleAdminBtn');
  if (!sec) return;
  const isHidden = sec.style.display === 'none';
  sec.style.display = isHidden ? 'block' : 'none';
  if (btn) btn.textContent = isHidden ? '🙈 Hide Admin View' : '👁️ Show Admin View';
}

/* ==================== DELETE FROM VIEW ==================== */
function deletePackageFromView() {
  if (!currentViewPackageId) return;
  const id = currentViewPackageId;
  document.querySelectorAll('#modalsContainer .modal-bg').forEach(m => m.remove());
  closeModal('customerViewModal');
  deletePackage(id);
}