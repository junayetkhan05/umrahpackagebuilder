/* ============================================================
   UMRAH BUILDER — BUILDER / FLIGHT
   Flight items add/remove/change + list render
   ============================================================ */

/* ==================== ADD FLIGHT ITEM ==================== */
function addFlightItem() {
  flightItems.push({
    id: ++fC,
    flightId: null,
    from: '',
    to: '',
    airline: '',
    tripType: 'round_trip',
    fareAdult: 0,
    fareChild: 0,
    fareInfant: 0,
    fare: 0,
    returnFrom: '',
    returnTo: '',
    returnAirline: '',
    returnFareAdult: 0,
    returnFareChild: 0,
    returnFareInfant: 0
  });
  renderFlightsList();
  recalc();
}

/* ==================== REMOVE FLIGHT ITEM ==================== */
function removeFlightItem(id) {
  flightItems = flightItems.filter(f => f.id !== id);
  renderFlightsList();
  recalc();
}

/* ==================== ON FLIGHT CHANGE ==================== */
function onFlightItemChange(itemId, flightId) {
  const f = flightItems.find(x => x.id === itemId);
  if (!f) return;

  if (!flightId) {
    f.flightId = null;
    f.from = '';
    f.to = '';
    f.airline = '';
    f.tripType = 'round_trip';
    f.fareAdult = 0;
    f.fareChild = 0;
    f.fareInfant = 0;
    f.fare = 0;
    f.returnFrom = '';
    f.returnTo = '';
    f.returnAirline = '';
    f.returnFareAdult = 0;
    f.returnFareChild = 0;
    f.returnFareInfant = 0;
  } else {
    const dbF = STORE.flights.find(x => x.id === parseInt(flightId));
    if (!dbF) return;
    f.flightId = dbF.id;
    f.from = dbF.from;
    f.to = dbF.to;
    f.airline = dbF.airline;
    f.tripType = dbF.tripType || 'round_trip';
    f.fareAdult = dbF.fareAdult || dbF.fare || 0;
    f.fareChild = dbF.fareChild || 0;
    f.fareInfant = dbF.fareInfant || 0;
    f.fare = f.fareAdult;
    f.returnFrom = dbF.returnFrom || '';
    f.returnTo = dbF.returnTo || '';
    f.returnAirline = dbF.returnAirline || '';
    f.returnFareAdult = dbF.returnFareAdult || 0;
    f.returnFareChild = dbF.returnFareChild || 0;
    f.returnFareInfant = dbF.returnFareInfant || 0;
  }
  renderFlightsList();
  recalc();
}

/* ==================== RENDER FLIGHTS LIST ==================== */
function renderFlightsList() {
  const el = $('flightsList');
  if (!el) return;

  if ($('flightCount')) $('flightCount').textContent = flightItems.length;
  if (!flightItems.length) {
    el.innerHTML = '<div class="empty-slot"><span class="ic">✈</span>No flight</div>';
    return;
  }

  const opts = STORE.flights.map(f =>
    `<option value="${f.id}">${esc(f.from)} ${f.tripType === 'round_trip' ? '⇄' : '→'} ${esc(f.to)} — ${esc(f.airline || '')}</option>`
  ).join('');

  el.innerHTML = flightItems.map((f, i) => {
    const isRound = f.tripType === 'round_trip';
    const totalAdult = (f.fareAdult || 0) + (isRound ? (f.returnFareAdult || 0) : 0);
    const totalChild = (f.fareChild || 0) + (isRound ? (f.returnFareChild || 0) : 0);
    const paxAdult = intVal('paxAdult', 0);
    const paxChild = intVal('paxChild', 0);
    const total = totalAdult * paxAdult + totalChild * paxChild;

    return `<div class="item-card">
      <div class="item-card-head">
        <span class="lbl">Flight ${i + 1}</span>
        <button class="remove-btn" onclick="removeFlightItem(${f.id})">✕</button>
      </div>
      <div class="field" style="margin-bottom:14px">
        <label>Select Flight</label>
        <select onchange="onFlightItemChange(${f.id},this.value)" data-selected="${f.flightId || ''}">
          <option value="">-- Choose Flight --</option>${opts}
        </select>
      </div>
      ${f.flightId ? `
        <div class="hotel-rooms-total" style="grid-template-columns:1fr auto">
          <div class="sub-item sell">
            <div class="lbl">Flight Total</div>
            <div class="val">${fmt(total)}</div>
            <div class="meta">${paxAdult}A${paxChild ? ' + ' + paxChild + 'C' : ''}</div>
          </div>
          <div class="total-badge">
            <div class="lbl">Total</div>
            <div class="val">${fmt(total)}</div>
          </div>
        </div>
      ` : ''}
    </div>`;
  }).join('');

  flightItems.forEach(f => {
    if (f.flightId) {
      const sel = el.querySelector(`select[data-selected="${f.flightId}"]`);
      if (sel) sel.value = f.flightId;
    }
  });
}