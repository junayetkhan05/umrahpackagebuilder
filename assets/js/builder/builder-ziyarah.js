/* ============================================================
   UMRAH BUILDER — BUILDER / ZIYARAH TRANSPORT
   Ziyarah transport items (auto car select by pax)
   ============================================================ */

/* ==================== ADD ZIYARAH TRANSPORT ITEM ==================== */
function addZiyarahTransportItem() {
  if (!STORE.ziyarah.length) {
    toast('No Ziyarah Master Data. Add Ziyarah first.', 'warning');
    return;
  }
  ztC++;
  ziyarahTransportItems.push({
    id: ztC,
    ziyarahId: null,
    city: '',
    name: '',
    pax: Math.max(1, (intVal('paxAdult', 0) + intVal('paxChild', 0))),
    car: 'hiace',
    cars: 1,
    price: 0,
    auto: true
  });
  renderZiyarahTransportList();
  recalc();
}

/* ==================== REMOVE ZIYARAH TRANSPORT ITEM ==================== */
function removeZiyarahTransportItem(idx) {
  if (idx < 0 || idx >= ziyarahTransportItems.length) return;
  ziyarahTransportItems.splice(idx, 1);
  renderZiyarahTransportList();
  recalc();
}

/* ==================== ON ZIYARAH SELECT ==================== */
function onZiyarahSelectChange(idx, ziyarahId) {
  const item = ziyarahTransportItems[idx];
  if (!item) return;

  if (!ziyarahId) {
    item.ziyarahId = null;
    item.city = '';
    item.name = '';
    item.car = 'hiace';
    item.cars = 1;
    item.price = 0;
  } else {
    const z = STORE.ziyarah.find(x => x.id === parseInt(ziyarahId));
    if (!z) return;
    item.ziyarahId = z.id;
    item.city = z.city;
    item.name = z.name;

    const pax = Math.max(1, (intVal('paxAdult', 0) + intVal('paxChild', 0)));
    item.pax = pax;

    const best = autoSelectBestCar(pax, z.carRates || {});
    if (best) {
      item.car = best.car;
      item.cars = best.cars;
      item.price = best.rate;
      item.auto = true;
    }
  }
  renderZiyarahTransportList();
  recalc();
}

/* ==================== RENDER ZIYARAH TRANSPORT LIST ==================== */
function renderZiyarahTransportList() {
  const el = $('ziyarahTransportList');
  if (!el) return;

  if ($('ziyarahCount')) $('ziyarahCount').textContent = ziyarahTransportItems.length;

  const allZiyarah = STORE.ziyarah;

  if (!ziyarahTransportItems.length) {
    el.innerHTML = '<div class="zy-empty"><span class="ic">★</span>No Ziyarah added — Click "➕ Add Ziyarah"</div>';
    return;
  }

  el.innerHTML = ziyarahTransportItems.map((item, idx) => {
    const z = item.ziyarahId ? STORE.ziyarah.find(x => x.id === item.ziyarahId) : null;
    const carOptions = getZiyarahCarOptions();
    const rates = z?.carRates || {};
    const total = (Number(item.price) || 0) * (Number(item.cars) || 1);

    const autoLabel = item.auto
      ? '<span style="font-size:9.5px;color:var(--green);font-weight:800">AUTO</span>'
      : '<span style="font-size:9.5px;color:var(--amber);font-weight:800">MANUAL</span>';

    const curOpt = carOptions.find(o => o.id === item.car);
    const minCars = curOpt ? Math.ceil(item.pax / curOpt.seats) : 1;

    const ziyarahOptions = allZiyarah.map(zz =>
      `<option value="${zz.id}" ${item.ziyarahId === zz.id ? 'selected' : ''}>${esc(zz.name)} (${esc(zz.city)})</option>`
    ).join('');

    return `
      <div class="zy-transport-item">
        <div class="ztf">
          <label>Ziyarah</label>
          <select onchange="onZiyarahSelectChange(${idx}, this.value)">
            <option value="">-- Select Ziyarah --</option>${ziyarahOptions}
          </select>
        </div>
        <div class="ztf">
          <label>Car ${autoLabel}</label>
          <select onchange="updateZiyarahCar(${idx}, this.value)" ${!z ? 'disabled' : ''}>
            ${carOptions.map(o => {
              const rate = Number(rates[o.id] || 0);
              const cars = Math.ceil(item.pax / o.seats);
              const totalOpt = rate * cars;
              return `<option value="${o.id}" ${item.car === o.id ? 'selected' : ''}>${o.label} (${o.seats} seats) · ${fmt(rate)} × ${cars} = ${fmt(totalOpt)}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="ztf">
          <label>Cars (min ${minCars})</label>
          <input type="number" min="${minCars}" value="${item.cars}" onchange="updateZiyarahCars(${idx}, this.value)">
        </div>
        <div class="ztf">
          <label>Total</label>
          <div class="zy-zt-total">${fmt(total)}</div>
        </div>
        <button class="zy-remove-btn" onclick="removeZiyarahTransportItem(${idx})" title="Remove">✕</button>
      </div>
    `;
  }).join('');
}

/* ==================== UPDATE CAR SELECTION ==================== */
function updateZiyarahCar(idx, carId) {
  const item = ziyarahTransportItems[idx];
  if (!item) return;
  const z = STORE.ziyarah.find(x => x.id === item.ziyarahId);
  if (!z) return;

  const rates = z.carRates || {};
  const carOptions = getZiyarahCarOptions();
  const opt = carOptions.find(o => o.id === carId);

  item.car = carId;
  item.price = Number(rates[carId] || 0);
  if (opt) item.cars = Math.ceil(item.pax / opt.seats);
  item.auto = false;

  renderZiyarahTransportList();
  recalc();
}

/* ==================== UPDATE CARS COUNT ==================== */
function updateZiyarahCars(idx, val) {
  const item = ziyarahTransportItems[idx];
  if (!item) return;

  const opt = getZiyarahCarOptions().find(o => o.id === item.car);
  const minCars = opt ? Math.ceil(item.pax / opt.seats) : 1;

  item.cars = Math.max(minCars, parseInt(val) || minCars);
  item.auto = false;

  renderZiyarahTransportList();
  recalc();
}

/* ==================== GET TOTAL COST ==================== */
function getZiyarahTransportCost() {
  return ziyarahTransportItems.reduce((sum, t) =>
    sum + ((Number(t.price) || 0) * (Number(t.cars) || 1)), 0
  );
}