/* ============================================================
   UMRAH BUILDER — MASTERS / FLIGHTS
   Flight CRUD + table render
   ============================================================ */

function toggleFlightForms() {
  const type = $('fsTripType')?.value || 'round_trip';
  const returnSec = $('returnFlightSection');
  if (returnSec) returnSec.style.display = type === 'round_trip' ? 'block' : 'none';
  const lbl = $('fsGoingLabel');
  if (lbl) lbl.textContent = type === 'round_trip' ? 'Going Flight' : 'Flight';
}

function openFlightSetup(editId = null) {
  if (editId) {
    const f = STORE.flights.find(x => x.id === editId);
    if (f) {
      $('flightModalTitle').textContent = '✏️ Edit Flight';
      $('fsEditId').value = editId;
      $('fsTripType').value = f.tripType || 'round_trip';
      $('fsFrom').value = f.from || '';
      $('fsTo').value = f.to || '';
      $('fsAirline').value = f.airline || '';
      $('fsFareAdult').value = f.fareAdult || '';
      $('fsFareChild').value = f.fareChild || '';
      $('fsFareInfant').value = f.fareInfant || '';
      $('fsReturnFrom').value = f.returnFrom || '';
      $('fsReturnTo').value = f.returnTo || '';
      $('fsReturnAirline').value = f.returnAirline || '';
      $('fsReturnFareAdult').value = f.returnFareAdult || '';
      $('fsReturnFareChild').value = f.returnFareChild || '';
      $('fsReturnFareInfant').value = f.returnFareInfant || '';
    }
  } else {
    $('flightModalTitle').textContent = '✈ Add Flight';
    $('fsEditId').value = '';
    if ($('fsTripType')) $('fsTripType').value = 'round_trip';
    ['fsFrom','fsTo','fsAirline','fsFareAdult','fsFareChild','fsFareInfant','fsReturnFrom','fsReturnTo','fsReturnAirline','fsReturnFareAdult','fsReturnFareChild','fsReturnFareInfant'].forEach(id => {
      const e = $(id);
      if (e) e.value = '';
    });
  }
  toggleFlightForms();
  clearAllErrors();
  openModal('flightSetupModal');
}

async function saveFlightSetup() {
  clearAllErrors();
  const from = $('fsFrom').value.trim();
  const to = $('fsTo').value.trim();
  const editId = $('fsEditId').value;
  const tripType = $('fsTripType')?.value || 'round_trip';

  let err = false;
  if (!from) { setError('fsFrom', 'From required'); err = true; }
  if (!to) { setError('fsTo', 'To required'); err = true; }
  if (err) { toast('Fill required fields', 'error'); return; }

  showLoading('Saving...');
  try {
    const data = {
      id: editId ? parseInt(editId) : Date.now(),
      tripType, from, to,
      airline: $('fsAirline').value.trim(),
      fareAdult: parseFloat($('fsFareAdult').value) || 0,
      fareChild: parseFloat($('fsFareChild').value) || 0,
      fareInfant: parseFloat($('fsFareInfant').value) || 0,
      fare: parseFloat($('fsFareAdult').value) || 0,
      returnFrom: $('fsReturnFrom').value.trim(),
      returnTo: $('fsReturnTo').value.trim(),
      returnAirline: $('fsReturnAirline').value.trim(),
      returnFareAdult: parseFloat($('fsReturnFareAdult').value) || 0,
      returnFareChild: parseFloat($('fsReturnFareChild').value) || 0,
      returnFareInfant: parseFloat($('fsReturnFareInfant').value) || 0,
      createdAt: editId ? (STORE.flights.find(x => x.id === parseInt(editId))?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };
    await dbSave(STORES.flights, data);
    STORE.flights = await dbGetAll(STORES.flights);
    hideLoading();
    closeModal('flightSetupModal');
    renderFlightsTable();
    updateSidebarBadges();
    toast(editId ? '✅ Flight updated' : '✅ Flight saved');
  } catch (e) {
    hideLoading();
    toast('Save failed: ' + e.message, 'error');
  }
}

function deleteFlight(id) {
  const f = STORE.flights.find(x => x.id === id);
  if (!f) return;
  confirmDelete(`Delete flight "${f.from} → ${f.to}"?`, async () => {
    const idx = STORE.flights.findIndex(x => x.id === id);
    if (idx < 0) return;
    STORE.flights.splice(idx, 1);
    await dbDelete(STORES.flights, id);
    STORE.flights = await dbGetAll(STORES.flights);
    renderFlightsTable();
    updateSidebarBadges();
    toast('Flight deleted', 'warning');
  });
}

function renderFlightsTable() {
  const el = $('flightsTable');
  if (!el) return;
  const list = STORE.flights;

  if (!list.length) {
    el.innerHTML = '<div class="empty"><div class="ic">✈</div><div class="tx">No flights yet</div></div>';
    return;
  }

  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Route</th><th>Type</th><th>Airline</th><th>Adult</th><th>Child</th><th>Infant</th><th></th></tr></thead>
    <tbody>${list.map(f => {
      const totalAdult = (f.fareAdult || 0) + (f.tripType === 'round_trip' ? (f.returnFareAdult || 0) : 0);
      const totalChild = (f.fareChild || 0) + (f.tripType === 'round_trip' ? (f.returnFareChild || 0) : 0);
      const totalInfant = (f.fareInfant || 0) + (f.tripType === 'round_trip' ? (f.returnFareInfant || 0) : 0);
      return `<tr>
        <td><div class="cell-main">${esc(f.from)} ${f.tripType === 'round_trip' ? '⇄' : '→'} ${esc(f.to)}</div></td>
        <td><span class="pill ${f.tripType === 'round_trip' ? 'confirmed' : 'quoted'}">${f.tripType === 'round_trip' ? 'Round' : 'One Way'}</span></td>
        <td>${esc(f.airline) || '—'}</td>
        <td><strong>${fmt(totalAdult)}</strong></td>
        <td>${fmt(totalChild)}</td>
        <td>${fmt(totalInfant)}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn btn-sm btn-ghost btn-icon" onclick="openFlightSetup(${f.id})">✏️</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="quickAddFlight(${f.id})">➕</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="deleteFlight(${f.id})">🗑️</button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}