/* ============================================================
   UMRAH BUILDER — CHATBOT / ZIYARAH
   Ziyarah selection + pax input + best car calculation
   ============================================================ */

/* ==================== PICK ZIYARAH ==================== */
function chatbotPickZiyarah(ziyarahId) {
  const z = STORE.ziyarah.find(x => x.id === ziyarahId);
  if (!z) return;

  chatState.mode = 'ziyarah';
  chatState.ziyarahId = ziyarahId;
  chatState.step = 'ziyarah_pax';
  saveChatState();

  chatbotAddHtml(`
    <div class="chatbot-bubble">
      ★ <b>${esc(z.name)}</b> (${esc(z.city)})<br>
      ${z.duration ? '⏱️ ' + esc(z.duration) + '<br>' : ''}
      <br>কতজন যাবে? (Custom number টাইপ করুন অথবা নিচে থেকে বেছে নিন)
      <div class="chatbot-options">
        <button class="chatbot-option-btn" onclick="chatbotZiyarahPax(2)">2 জন</button>
        <button class="chatbot-option-btn" onclick="chatbotZiyarahPax(3)">3 জন</button>
        <button class="chatbot-option-btn" onclick="chatbotZiyarahPax(4)">4 জন</button>
        <button class="chatbot-option-btn" onclick="chatbotZiyarahPax(7)">7 জন</button>
        <button class="chatbot-option-btn" onclick="chatbotZiyarahPax(8)">8 জন</button>
        <button class="chatbot-option-btn" onclick="chatbotZiyarahPax(12)">12 জন</button>
        <button class="chatbot-option-btn" onclick="chatbotZiyarahPax(16)">16 জন</button>
        <button class="chatbot-option-btn" onclick="chatbotZiyarahPax(20)">20 জন</button>
      </div>
    </div>
  `);
}

/* ==================== ZIYARAH PAX CALCULATION ==================== */
function chatbotZiyarahPax(pax) {
  const z = STORE.ziyarah.find(x => x.id === chatState.ziyarahId);
  if (!z) return;

  chatState.ziyarahPax = pax;

  const rates = z.carRates || {};
  const options = getZiyarahCarOptions();

  /* Build car option rows */
  const rows = options.map(o => {
    const rate = Number(rates[o.id] || 0);
    if (rate <= 0) return null;

    const cars = Math.ceil(pax / o.seats);
    const total = rate * cars;
    const wastedSeats = (cars * o.seats) - pax;

    return {
      id: o.id,
      label: o.label,
      seats: o.seats,
      rate,
      cars,
      total,
      wastedSeats
    };
  }).filter(Boolean);

  if (!rows.length) {
    chatbotAddHtml(`<div class="chatbot-bubble">😔 এই Ziyarah-তে কোনো car rate set করা নেই। Dashboard → Ziyarah → Edit থেকে rate দিন।</div>`);
    chatState = {
      step: null, mode: null, cities: [], star: null, nights: null,
      roomType: null, pax: null, meal: null, rooms: [], results: [],
      transportId: null, ziyarahId: null, pendingListCity: null, ziyarahPax: null
    };
    saveChatState();
    return;
  }

  /* Sort by total cost, then by wasted seats */
  rows.sort((a, b) => {
    if (a.total !== b.total) return a.total - b.total;
    return a.wastedSeats - b.wastedSeats;
  });

  const best = rows[0];

  const optionsHtml = rows.map((o, i) => {
    const isBest = i === 0;
    return `<div class="zy-car-option ${isBest ? 'best' : ''}">
      <div class="zy-car-left">
        <div class="zy-car-name">${o.label} (${o.seats} seats) ${isBest ? '<span class="best-tag">★ BEST</span>' : ''}</div>
        <div class="zy-car-sub">${o.cars} car × ${fmt(o.rate)} = ${o.cars * o.seats} seats${o.wastedSeats > 0 ? ` · ${o.wastedSeats} empty` : ' · Full'}</div>
      </div>
      <div class="zy-car-total">${fmt(o.total)}</div>
    </div>`;
  }).join('');

  chatbotAddHtml(`
    <div class="chatbot-bubble" style="max-width:100%">
      <b>★ ${esc(z.name)} — ${pax} জন</b><br>
      <div style="font-size:11.5px;color:var(--text-3);margin-bottom:10px">🚐 Capacity অনুযায়ী সেরা car auto-নির্বাচিত</div>
      ${optionsHtml}
      <div style="font-size:11px;color:var(--text-3);margin-top:10px;padding-top:10px;border-top:1px dashed var(--border)">
        ✅ <b>${best.label} × ${best.cars} car</b> best option — total <b style="color:var(--primary)">${fmt(best.total)}</b>
      </div>
    </div>
  `);

  chatbotAddActions([
    { label: 'আরেকটা Ziyarah', icon: '★', onclick: "chatbotAsk('ziyarah')", type: 'secondary' },
    { label: 'Hotel Booking', icon: '🏨', onclick: "chatbotAsk('hotel')", type: 'secondary' },
    { label: 'নতুন শুরু', icon: '🔄', onclick: 'chatbotReset()', type: 'primary' }
  ]);

  /* Reset state */
  chatState = {
    step: null, mode: null, cities: [], star: null, nights: null,
    roomType: null, pax: null, meal: null, rooms: [], results: [],
    transportId: null, ziyarahId: null, pendingListCity: null, ziyarahPax: null
  };
  saveChatState();
}