/* ============================================================
   UMRAH BUILDER — CHATBOT / HOTEL LIST
   Hotel list flow + pagination + single hotel detail
   ============================================================ */

/* chatbotHotelListState declared in state.js */

/* ==================== LIST CITY ==================== */
function chatbotListCity(city) {
  const hotels = city === 'makkah' ? STORE.makkahHotels : STORE.madinahHotels;

  if (!hotels.length) {
    chatbotAddHtml(`<div class="chatbot-bubble">😔 ${city} এ কোনো hotel নেই।</div>`);
    return;
  }

  chatState.pendingListCity = city;
  chatState.step = 'ask_list_star';
  saveChatState();

  chatbotAddHtml(`
    <div class="chatbot-bubble">
      🕌 <b>${city.charAt(0).toUpperCase() + city.slice(1)} Hotels</b><br><br>কত star?
      <div class="chatbot-options">
        <button class="chatbot-option-btn" onclick="chatbotListStar('${city}', 3)">⭐⭐⭐ 3 Star</button>
        <button class="chatbot-option-btn" onclick="chatbotListStar('${city}', 4)">⭐⭐⭐⭐ 4 Star</button>
        <button class="chatbot-option-btn" onclick="chatbotListStar('${city}', 5)">⭐⭐⭐⭐⭐ 5 Star</button>
        <button class="chatbot-option-btn" onclick="chatbotListStar('${city}', 'all')">🌟 All Stars</button>
      </div>
    </div>
  `);
}

/* ==================== LIST STAR ==================== */
function chatbotListStar(city, star) {
  let hotels = city === 'makkah' ? STORE.makkahHotels : STORE.madinahHotels;

  /* Filter expired + star */
  hotels = hotels.filter(h => !isHotelExpired(h));
  if (star !== 'all') {
    hotels = hotels.filter(h => String(h.star) === String(star));
  }

  if (!hotels.length) {
    chatbotAddHtml(`<div class="chatbot-bubble">😔 ${city} এ কোনো hotel পাওয়া যায়নি।</div>`);
    chatState.step = null;
    saveChatState();
    return;
  }

  /* Sort by lowest rate */
  hotels.sort((a, b) => {
    const aVals = [a.quad, a.triple, a.double, a.single].filter(x => x > 0);
    const bVals = [b.quad, b.triple, b.double, b.single].filter(x => x > 0);
    const aMin = aVals.length ? Math.min(...aVals) : 999999;
    const bMin = bVals.length ? Math.min(...bVals) : 999999;
    return aMin - bMin;
  });

  /* Store in state for pagination */
  chatbotHotelListState = {
    city,
    star,
    allHotels: hotels,
    visibleCount: 5,
    perPage: 5
  };

  /* Remove previous list container if any */
  document.getElementById('chatbotHotelListContainer')?.remove();

  chatbotAddHtml(`
    <div class="chatbot-bubble" style="max-width:100%">
      🕌 <b>${city.charAt(0).toUpperCase() + city.slice(1)} · ${star === 'all' ? 'All Stars' : star + '⭐'}</b><br>
      <span style="font-size:11.5px;color:var(--text-3)">${hotels.length} hotels · Lowest first ↓ (${Math.min(5, hotels.length)} showing)</span>
    </div>
  `);

  renderChatbotHotelListPage();
  chatState.step = null;
  saveChatState();
}

/* ==================== RENDER HOTEL LIST PAGE ==================== */
function renderChatbotHotelListPage() {
  const wrap = $('chatbotMessages');
  if (!wrap) return;

  const state = chatbotHotelListState;
  const { city, allHotels, visibleCount } = state;
  const visible = allHotels.slice(0, visibleCount);
  const hasMore = visibleCount < allHotels.length;
  const remaining = allHotels.length - visibleCount;

  /* Find lowest price */
  const allRates = allHotels.flatMap(h => [h.quad, h.triple, h.double, h.single].filter(x => x > 0));
  const lowestPrice = allRates.length ? Math.min(...allRates) : 0;

  const html = `
    <div class="chatbot-bubble" style="max-width:100%;padding:0;background:transparent;border:none;box-shadow:none">
      <div style="display:flex;flex-direction:column;gap:8px">
        ${visible.map((h, i) => {
          const rates = [h.quad, h.triple, h.double, h.single].filter(x => x > 0);
          const minRate = rates.length ? Math.min(...rates) : 0;
          const isLowest = minRate > 0 && minRate === lowestPrice;

          return `<div class="chatbot-hotel-card" onclick="chatbotHotelDetail(${h.id},'${city}')">
            ${isLowest ? '<span class="best-badge">💰 Lowest</span>' : ''}
            <div class="hotel-name">${i + 1}. ${esc(h.name)}</div>
            <div class="hotel-meta">
              <span>${'⭐'.repeat(h.star)}</span>
              <span>📍 ${esc(h.distance) || '—'}</span>
            </div>
            <div class="hotel-price-row">
              ${h.quad ? `<span class="price-chip">Quad: ${fmt(h.quad)}</span>` : ''}
              ${h.triple ? `<span class="price-chip">Triple: ${fmt(h.triple)}</span>` : ''}
              ${h.double ? `<span class="price-chip">Double: ${fmt(h.double)}</span>` : ''}
              ${h.single ? `<span class="price-chip">Single: ${fmt(h.single)}</span>` : ''}
            </div>
          </div>`;
        }).join('')}

        ${hasMore
          ? `<button class="chatbot-load-more" onclick="chatbotLoadMoreHotels()"><span>📋 Load More (${remaining} more)</span></button>`
          : `<div style="text-align:center;font-size:11px;color:var(--text-3);padding:8px;font-weight:600">✓ All ${allHotels.length} hotels shown</div>`}
      </div>
    </div>
  `;

  let container = document.getElementById('chatbotHotelListContainer');
  if (container) {
    container.innerHTML = html;
  } else {
    const div = document.createElement('div');
    div.className = 'chatbot-msg bot';
    div.id = 'chatbotHotelListContainer';
    div.innerHTML = html;
    wrap.appendChild(div);
  }
  wrap.scrollTop = wrap.scrollHeight;
}

/* ==================== LOAD MORE ==================== */
function chatbotLoadMoreHotels() {
  chatbotHotelListState.visibleCount += chatbotHotelListState.perPage;
  renderChatbotHotelListPage();

  const wrap = $('chatbotMessages');
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
}

window.chatbotLoadMoreHotels = chatbotLoadMoreHotels;

/* ==================== SINGLE HOTEL DETAIL ==================== */
function chatbotHotelDetail(hotelId, city) {
  const hotels = city === 'makkah' ? STORE.makkahHotels : STORE.madinahHotels;
  const h = hotels.find(x => x.id === hotelId);
  if (!h) return;

  const expired = isHotelExpired(h);
  const statusBadge = expired
    ? '<span style="color:var(--red);font-weight:800;font-size:10px">⚠️ EXPIRED</span>'
    : (h.validUntil ? '<span style="color:var(--green);font-weight:800;font-size:10px">✓ ACTIVE</span>' : '');

  chatbotAddHtml(`
    <div class="chatbot-bubble" style="max-width:100%">
      <b>🏨 ${esc(h.name)}</b> ${statusBadge}<br>
      ${'⭐'.repeat(h.star)} · 📍 ${esc(h.distance) || '—'}<br>
      <div style="margin-top:10px;padding:12px;background:var(--card);border-radius:10px;border:1px solid var(--border)">
        <div style="font-size:11px;font-weight:800;color:var(--primary);margin-bottom:6px">💰 ROOM RATES</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>Quad:</span><b>${fmt(h.quad)}</b></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>Triple:</span><b>${fmt(h.triple)}</b></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>Double:</span><b>${fmt(h.double)}</b></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>Single:</span><b>${fmt(h.single)}</b></div>
      </div>
    </div>
  `);
}