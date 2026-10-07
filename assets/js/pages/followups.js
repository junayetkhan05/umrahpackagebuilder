/* ============================================================
   UMRAH BUILDER — PAGES / FOLLOWUPS
   Follow-up CRUD + render + toggle complete
   ============================================================ */

/* currentFollowTab declared in state.js */

/* ==================== SWITCH TAB ==================== */
function switchFollowTab(tab) {
  currentFollowTab = tab;
  const pkgTab = $('followTabPackage');
  const leadTab = $('followTabLead');

  if (pkgTab) {
    pkgTab.classList.toggle('btn-secondary', tab === 'package');
    pkgTab.classList.toggle('btn-ghost', tab !== 'package');
  }
  if (leadTab) {
    leadTab.classList.toggle('btn-secondary', tab === 'lead');
    leadTab.classList.toggle('btn-ghost', tab !== 'lead');
  }
  renderFollowups();
}

/* ==================== OPEN FOLLOW SETUP ==================== */
function openFollowSetup(editId = null) {
  if (editId) {
    const f = STORE.followups.find(x => x.id === editId);
    if (f) {
      $('followModalTitle').textContent = '✏️ Edit Follow-up';
      $('followEditId').value = editId;
      $('followType').value = f.type || 'lead';
      $('followName').value = f.name || '';
      $('followPhone').value = f.phone || '';
      $('followEmail').value = f.email || '';
      $('followDate').value = f.date || '';
      $('followTime').value = f.time || '';
      $('followPriority').value = f.priority || 'medium';
      $('followSubject').value = f.subject || '';
      $('followNotes').value = f.notes || '';
    }
  } else {
    $('followModalTitle').textContent = '🔔 Add Follow-up';
    $('followEditId').value = '';
    ['followName', 'followPhone', 'followEmail', 'followSubject', 'followNotes', 'followTime'].forEach(id => setVal(id, ''));
    setVal('followType', 'lead');
    setVal('followDate', today());
    setVal('followPriority', 'medium');
  }
  clearAllErrors();
  openModal('followSetupModal');
}

/* ==================== SAVE FOLLOW ==================== */
async function saveFollowSetup() {
  clearAllErrors();
  const name = strVal('followName');
  const phone = strVal('followPhone');
  const date = strVal('followDate');
  const editId = strVal('followEditId');

  let err = false;
  if (!name) { setError('followName', 'Name required'); err = true; }
  if (!phone) { setError('followPhone', 'Phone required'); err = true; }
  if (!date) { setError('followDate', 'Date required'); err = true; }
  if (err) { toast('Fill required fields', 'error'); return; }

  showLoading('Saving...');
  try {
    const existing = editId ? STORE.followups.find(x => x.id === parseInt(editId)) : null;
    const data = {
      id: editId ? parseInt(editId) : Date.now(),
      type: strVal('followType', 'lead'),
      name,
      phone,
      email: strVal('followEmail'),
      date,
      time: strVal('followTime'),
      priority: strVal('followPriority', 'medium'),
      subject: strVal('followSubject'),
      notes: strVal('followNotes'),
      completed: existing?.completed || false,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    await dbSave(STORES.followups, data);
    STORE.followups = await dbGetAll(STORES.followups);
    hideLoading();
    closeModal('followSetupModal');
    renderFollowups();
    updateSidebarBadges();
    toast(editId ? '✅ Follow-up updated' : '✅ Follow-up saved');
  } catch (e) {
    hideLoading();
    toast('Save failed: ' + e.message, 'error');
  }
}

/* ==================== DELETE FOLLOW ==================== */
function deleteFollowup(id) {
  const f = STORE.followups.find(x => x.id === id);
  if (!f) return;
  confirmDelete(`Delete follow-up for "${f.name}"?`, async () => {
    STORE.followups = STORE.followups.filter(x => x.id !== id);
    await dbDelete(STORES.followups, id);
    STORE.followups = await dbGetAll(STORES.followups);
    renderFollowups();
    updateSidebarBadges();
    toast('Follow-up deleted', 'warning');
  });
}

/* ==================== TOGGLE COMPLETE ==================== */
async function toggleFollowComplete(id) {
  const f = STORE.followups.find(x => x.id === id);
  if (!f) return;
  f.completed = !f.completed;
  f.updatedAt = Date.now();
  await dbSave(STORES.followups, f);
  STORE.followups = await dbGetAll(STORES.followups);
  renderFollowups();
  updateSidebarBadges();
  toast(f.completed ? '✅ Marked as done' : '🔄 Reopened', 'info');
}

/* ==================== RENDER FOLLOWUPS ==================== */
function renderFollowups() {
  const el = $('followupsList');
  if (!el) return;

  const todayStr = today();

  /* ========== LEAD TAB ========== */
  if (currentFollowTab === 'lead') {
    const list = STORE.followups.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    if (!list.length) {
      el.innerHTML = '<div class="empty"><div class="ic">🔔</div><div class="tx">No lead follow-ups yet — click "Add Follow-up"</div></div>';
      return;
    }

    el.innerHTML = list.map(f => {
      const isOverdue = f.date < todayStr && !f.completed;
      const isToday = f.date === todayStr && !f.completed;
      const status = f.completed ? 'completed' : (isOverdue ? 'overdue' : (isToday ? 'today' : 'upcoming'));
      const typeIcons = { lead: '👤', inquiry: '📞', quote: '📄', reminder: '⏰', other: '📦' };
      const priorityLabel = { low: 'Low', medium: 'Medium', high: 'High' };

      return `<div class="followup-row ${status}" onclick="openFollowSetup(${f.id})">
        <div class="followup-icon ${f.type}">${typeIcons[f.type] || '🔔'}</div>
        <div class="followup-info">
          <h4>${esc(f.name)}<span class="followup-priority ${f.priority}">${priorityLabel[f.priority]}</span>${f.completed ? '<span style="font-size:10px;color:var(--green);font-weight:800">✓ DONE</span>' : ''}</h4>
          <div class="meta">
            <span>📞 ${esc(f.phone)}</span>
            ${f.subject ? `<span>📌 ${esc(f.subject)}</span>` : ''}
            ${f.email ? `<span>✉️ ${esc(f.email)}</span>` : ''}
          </div>
        </div>
        <div class="followup-date">
          <div class="day">${f.date || '—'}</div>
          <div class="lbl">${isOverdue ? '⚠️ Overdue' : isToday ? '🔥 Today' : (f.completed ? '✓ Done' : 'Upcoming')}</div>
        </div>
        <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
          <button class="btn btn-sm btn-ghost btn-icon" onclick="toggleFollowComplete(${f.id})">${f.completed ? '🔄' : '✓'}</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="openFollowSetup(${f.id})">✏️</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="deleteFollowup(${f.id})">🗑️</button>
        </div>
      </div>`;
    }).join('');
    return;
  }

  /* ========== PACKAGE TAB ========== */
  const due = STORE.packages.filter(p =>
    p.followupDate && p.followupDate <= todayStr &&
    !['Confirmed', 'Paid', 'Travelled', 'Completed', 'Cancelled'].includes(p.status)
  ).sort((a, b) => (a.followupDate || '').localeCompare(b.followupDate || ''));

  if (!due.length) {
    el.innerHTML = '<div class="empty"><div class="ic">🔔</div><div class="tx">No pending package follow-ups</div></div>';
    return;
  }

  el.innerHTML = due.map(p => {
    const cls = (p.status || 'draft').toLowerCase().replace(/\s+/g, '-');
    const isOverdue = p.followupDate < todayStr;
    return `<div class="followup-row ${isOverdue ? 'overdue' : 'today'}" onclick="viewPackage(${p.id})">
      <div class="followup-icon" style="background:linear-gradient(135deg,#a855f7,#9333ea)">📦</div>
      <div class="followup-info">
        <h4>${esc(p.name) || 'Untitled'}</h4>
        <div class="meta">
          <span>👤 ${esc(p.customerName) || '—'}</span>
          <span>📞 ${esc(p.customerPhone) || '—'}</span>
          <span style="color:${isOverdue ? 'var(--red)' : 'var(--purple)'};font-weight:700">🔔 ${p.followupDate}</span>
        </div>
      </div>
      <span class="pkg-row-badge ${cls}">${esc(p.status || 'Draft')}</span>
      <span class="pkg-row-price">${fmt(p.grandTotal)}</span>
    </div>`;
  }).join('');
}