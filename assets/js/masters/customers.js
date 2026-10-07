/* ============================================================
   UMRAH BUILDER — MASTERS / CUSTOMERS
   Customer CRUD + totals + view + search
   ============================================================ */

/* customerSearchQuery declared in state.js */

function searchCustomers(q) {
  customerSearchQuery = String(q || '').toLowerCase();
  renderCustomersTable();
}

function openCustomerSetup(editId = null) {
  if (editId) {
    const c = STORE.customers.find(x => x.id === editId);
    if (c) {
      $('customerModalTitle').textContent = '✏️ Edit Customer';
      $('custEditId').value = editId;
      $('custName').value = c.customerName || '';
      $('custPhone').value = c.phone || '';
      $('custEmail').value = c.email || '';
      $('custPassport').value = c.passport || '';
      $('custNationality').value = c.nationality || 'Bangladeshi';
      $('custNid').value = c.nid || '';
      $('custAddress').value = c.address || '';
      $('custNotes').value = c.notes || '';
    }
  } else {
    $('customerModalTitle').textContent = '👤 Add Customer';
    ['custName','custPhone','custEmail','custPassport','custNid','custAddress','custNotes'].forEach(id => setVal(id, ''));
    setVal('custNationality', 'Bangladeshi');
    setVal('custEditId', '');
  }
  clearAllErrors();
  openModal('customerSetupModal');
}

async function saveCustomerSetup() {
  clearAllErrors();
  const name = strVal('custName');
  const phone = strVal('custPhone');
  const editId = strVal('custEditId');

  if (!name) { setError('custName', 'Name required'); return; }
  if (!phone) { setError('custPhone', 'Phone required'); return; }

  showLoading('Saving...');
  try {
    const existing = editId ? STORE.customers.find(x => x.id === parseInt(editId)) : null;
    const data = {
      id: editId ? parseInt(editId) : Date.now(),
      customerName: name,
      phone,
      email: strVal('custEmail'),
      passport: strVal('custPassport'),
      nationality: strVal('custNationality', 'Bangladeshi'),
      nid: strVal('custNid'),
      address: strVal('custAddress'),
      notes: strVal('custNotes'),
      payments: existing?.payments || [],
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    await dbSave(STORES.customers, data);
    STORE.customers = await dbGetAll(STORES.customers);
    hideLoading();
    closeModal('customerSetupModal');
    renderCustomersTable();
    if (typeof renderDashboard === 'function') renderDashboard();
    toast(editId ? '✅ Customer updated' : '✅ Customer saved');
  } catch (e) {
    hideLoading();
    toast('Save failed: ' + e.message, 'error');
  }
}

function deleteCustomer(id) {
  const c = STORE.customers.find(x => x.id === id);
  if (!c) return;
  confirmDelete(`Delete customer "${c.customerName}"?`, async () => {
    STORE.customers = STORE.customers.filter(x => x.id !== id);
    await dbDelete(STORES.customers, id);
    STORE.customers = await dbGetAll(STORES.customers);
    renderCustomersTable();
    if (typeof renderDashboard === 'function') renderDashboard();
    toast('Customer deleted', 'warning');
  });
}

function getCustomerPackages(customer) {
  return STORE.packages.filter(p =>
    p.customerId === customer.id ||
    (p.customerPhone && customer.phone && p.customerPhone === customer.phone)
  );
}

function getCustomerTotals(customer) {
  const pkgs = getCustomerPackages(customer);
  const totalBilled = pkgs.reduce((sum, p) => sum + Math.max(0, Number(p.grandTotal || 0)), 0);
  const ledgerPaid = (customer.payments || []).reduce((sum, p) => sum + Math.max(0, Number(p.amount || 0)), 0);
  const advancePaid = pkgs.reduce((sum, p) => sum + getPackageAdvance(p), 0);
  const totalPaid = ledgerPaid + advancePaid;
  const due = Math.max(0, totalBilled - totalPaid);
  return { totalBilled, totalPaid, due, packages: pkgs.length, ledgerPaid, advancePaid };
}

function renderCustomersTable() {
  const el = $('customersTable');
  if (!el) return;

  let list = STORE.customers.slice();
  if (customerSearchQuery) {
    list = list.filter(c =>
      (c.customerName || '').toLowerCase().includes(customerSearchQuery) ||
      (c.phone || '').includes(customerSearchQuery) ||
      (c.passport || '').toLowerCase().includes(customerSearchQuery)
    );
  }

  if (!list.length) {
    el.innerHTML = '<div class="empty"><div class="ic">👥</div><div class="tx">No customers yet</div></div>';
    return;
  }

  el.innerHTML = list.map(c => {
    const t = getCustomerTotals(c);
    return `<div class="customer-row" onclick="viewCustomer(${c.id})">
      <div class="customer-avatar">${esc(c.customerName[0] || '?').toUpperCase()}</div>
      <div class="customer-info">
        <h4>${esc(c.customerName)}</h4>
        <div class="meta"><span>📞 ${esc(c.phone) || '—'}</span><span>📦 ${t.packages} package${t.packages !== 1 ? 's' : ''}</span></div>
      </div>
      <div class="customer-stats">
        <div class="customer-stat"><div class="lbl">Billed</div><div class="val primary">${fmt(t.totalBilled)}</div></div>
        <div class="customer-stat"><div class="lbl">Paid</div><div class="val green">${fmt(t.totalPaid)}</div></div>
        <div class="customer-stat"><div class="lbl">Due</div><div class="val ${t.due > 0 ? 'red' : 'green'}">${fmt(t.due)}</div></div>
      </div>
      <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
        <button class="btn btn-sm btn-ghost btn-icon" onclick="openCustomerSetup(${c.id})">✏️</button>
        <button class="btn btn-sm btn-ghost btn-icon" onclick="deleteCustomer(${c.id})">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function viewCustomer(id) {
  const c = STORE.customers.find(x => x.id === id);
  if (!c) return;

  const t = getCustomerTotals(c);
  const pkgs = STORE.packages.filter(p =>
    p.customerId === c.id ||
    (p.customerPhone && p.customerPhone === c.phone)
  );
  const payments = c.payments || [];

  const pkgList = pkgs.length ? pkgs.map(p => {
    const pkgPaid = getPackageAdvance(p) + payments.filter(pm => pm.packageId === p.id).reduce((s, pm) => s + Math.max(0, Number(pm.amount || 0)), 0);
    const pkgDue = Math.max(0, (p.grandTotal || 0) - pkgPaid);
    return `<div class="payment-row" style="cursor:pointer" onclick="closeModal('customerViewModal'); viewPackage(${p.id})">
      <div class="info"><div style="font-weight:700">${esc(p.name) || 'Untitled'}</div>
      <div class="date">${p.checkIn || p.start || '—'} · ${esc(p.status || 'Draft')}</div></div>
      <div style="text-align:right"><div style="font-weight:800">${fmt(p.grandTotal)}</div>
      <div class="date">Paid ${fmt(pkgPaid)} · Due <span style="color:${pkgDue > 0 ? 'var(--red)' : 'var(--green)'}">${fmt(pkgDue)}</span></div></div>
    </div>`;
  }).join('') : '<div style="color:var(--text-3);font-size:12px;padding:8px">No packages</div>';

  const paymentList = payments.length
    ? payments.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(pm => `
      <div class="payment-row">
        <div class="info">
          <div style="font-weight:700">${esc(pm.method || 'Cash')}${pm.reference ? ' · ' + esc(pm.reference) : ''}</div>
          <div class="date">${esc(pm.date) || '—'}</div>
        </div>
        <div class="amt">+ ${fmt(pm.amount)}</div>
        <button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();deletePayment(${c.id}, '${pm.id}')">✕</button>
      </div>
    `).join('')
    : '<div style="color:var(--text-3);font-size:12px;padding:8px">No payments yet</div>';

  const html = `
    <div style="padding:20px;background:linear-gradient(135deg,var(--primary-bg),var(--card));border-radius:14px;margin-bottom:20px;border:1px solid var(--primary-light)">
      <div style="display:flex;gap:14px;align-items:center">
        <div class="customer-avatar" style="width:60px;height:60px;font-size:22px">${esc(c.customerName[0] || '?').toUpperCase()}</div>
        <div style="flex:1">
          <h3 style="font-size:20px;font-weight:800;margin-bottom:4px">${esc(c.customerName)}</h3>
          <div style="font-size:12.5px;color:var(--text-2)">${esc(c.phone) || ''} ${c.email ? '· ' + esc(c.email) : ''}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="this.closest('.modal-bg').remove(); openCustomerSetup(${c.id})">✏️ Edit</button>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-block"><div class="lbl">Passport</div><div class="val">${esc(c.passport) || '—'}</div></div>
      <div class="detail-block"><div class="lbl">Nationality</div><div class="val">${esc(c.nationality) || '—'}</div></div>
      <div class="detail-block"><div class="lbl">NID</div><div class="val">${esc(c.nid) || '—'}</div></div>
      <div class="detail-block"><div class="lbl">Address</div><div class="val">${esc(c.address) || '—'}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="padding:16px;border-radius:14px;text-align:center;background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff">
        <div style="font-size:10px;opacity:.9;text-transform:uppercase;font-weight:800;margin-bottom:6px">Total Billed</div>
        <div style="font-size:20px;font-weight:900">${fmt(t.totalBilled)}</div>
      </div>
      <div style="padding:16px;border-radius:14px;text-align:center;background:var(--green-bg);border:1px solid var(--green)">
        <div style="font-size:10px;color:var(--green);text-transform:uppercase;font-weight:800;margin-bottom:6px">Total Paid</div>
        <div style="font-size:20px;font-weight:900;color:var(--green)">${fmt(t.totalPaid)}</div>
      </div>
      <div style="padding:16px;border-radius:14px;text-align:center;background:${t.due > 0 ? 'var(--red-bg)' : 'var(--green-bg)'};border:1px solid ${t.due > 0 ? 'var(--red)' : 'var(--green)'}">
        <div style="font-size:10px;color:${t.due > 0 ? 'var(--red)' : 'var(--green)'};text-transform:uppercase;font-weight:800;margin-bottom:6px">Due</div>
        <div style="font-size:20px;font-weight:900;color:${t.due > 0 ? 'var(--red)' : 'var(--green)'}">${fmt(t.due)}</div>
      </div>
    </div>
    <h4 style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--text-2);margin-bottom:10px">📦 Packages (${pkgs.length})</h4>
    ${pkgList}
    <div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 10px">
      <h4 style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--text-2)">💰 Payments (${payments.length})</h4>
      <button class="btn btn-primary btn-xs" onclick="event.stopPropagation();openPaymentModal('customer', ${c.id})">➕ Add Payment</button>
    </div>
    ${paymentList}
  `;

  $('customerViewBody').innerHTML = html;
  $('customerViewModal').querySelector('h2').textContent = '👤 Customer Details';
  openModal('customerViewModal');
}