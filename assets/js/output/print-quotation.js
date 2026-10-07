/* ============================================================
   UMRAH BUILDER — OUTPUT / PRINT QUOTATION
   Quotation preview + PDF download + content parser
   ============================================================ */

/* ==================== PARSE CONTENT ==================== */
function parseContent(content) {
  const lines = (content || '').split('\n');
  const sections = [];
  let currentSection = { title: 'Activities', items: [] };
  let hasExplicitSection = false;

  const sectionHeaders = /^(activities|places to visit|duration|notes|important|inclusions?|exclusions?|ziyarah)\s*:?\s*$/i;
  const durationLine = /^duration\s*:\s*(.+)/i;

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const durMatch = line.match(durationLine);
    if (durMatch) {
      if (currentSection.items.length && currentSection.title !== 'Duration') {
        sections.push(currentSection);
        currentSection = { title: 'Duration', items: [] };
      } else if (currentSection.title !== 'Duration') {
        currentSection.title = 'Duration';
      }
      currentSection.items.push(durMatch[1]);
      hasExplicitSection = true;
      continue;
    }

    if (sectionHeaders.test(line)) {
      if (currentSection.items.length && hasExplicitSection) {
        sections.push(currentSection);
      } else if (currentSection.items.length && !hasExplicitSection && currentSection.title !== 'Activities') {
        sections.push(currentSection);
      }
      currentSection = { title: line.replace(/:\s*$/, ''), items: [] };
      hasExplicitSection = true;
      continue;
    }

    const bulletMatch = line.match(/^[-•*]\s*(.+)/);
    if (bulletMatch) {
      currentSection.items.push(bulletMatch[1]);
      continue;
    }
    currentSection.items.push(line);
  }
  if (currentSection.items.length) sections.push(currentSection);
  return sections;
}

/* ==================== PRINT QUOTATION ==================== */
async function printQuotation(id) {
  const p = STORE.packages.find(x => x.id === id);
  if (!p) return;

  const s = await dbGetSetting('settings') || {};
  const company = s.company || '';
  const address = s.address || '';
  const phones = s.phone || '';
  const emails = s.email || '';
  const license = s.license || '';
  const headerImg = s.headerImgData || '';
  const footerImg = s.footerImgData || '';

  const paxAdult = p.paxAdult || 0;
  const paxChild = p.paxChild || 0;
  const paxInfant = p.paxInfant || 0;
  const makkahHotels = p.makkahHotels || [];
  const madinahHotels = p.madinahHotels || [];

  /* Preload hotel images as data URLs */
  const hotelImages = {};
  for (const h of [...makkahHotels, ...madinahHotels]) {
    if (h.imageIds && h.imageIds.length) {
      const dataUrl = await getImageDataURL(h.imageIds[0]);
      if (dataUrl) hotelImages[h.id || h.name] = dataUrl;
    }
  }

  let grandHotelTotal = 0;
  let hotelRowsHTML = '';

  const buildHotelRows = (hotels, city) => {
    return hotels.map(h => {
      const imgKey = h.id || h.name;
      const imgData = hotelImages[imgKey];
      const imgCell = imgData
        ? `<img src="${imgData}" style="width:80px;height:80px;border-radius:8px;object-fit:cover;display:block;border:1px solid #e5e7eb">`
        : '<div style="width:80px;height:80px;border-radius:8px;background:#fff7ed;display:flex;align-items:center;justify-content:center;font-size:30px;border:1px solid #e5e7eb">🕌</div>';

      const rooms = h.rooms || [];
      if (!rooms.length) {
        return `<tr><td style="padding:10px;border-bottom:1px solid #f4f4f5;vertical-align:middle">
          <div style="display:flex;align-items:center;gap:12px">${imgCell}
            <div>
              <strong style="font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:.5px">${esc(city)}</strong>
              <div style="font-size:13px;font-weight:800;color:#18181b;margin-top:2px">${esc(h.name) || '—'}</div>
              ${h.distance ? `<div style="font-size:10px;color:#a1a1aa;margin-top:2px">📍 ${esc(h.distance)}</div>` : ''}
            </div>
          </div>
        </td><td colspan="4" style="padding:10px;text-align:center;color:#a1a1aa;font-size:10px">No rooms</td></tr>`;
      }

      return rooms.map((r, idx) => {
        const paxInRoom = (r.adults || 0) + (r.children || 0);
        const mealPerNight = (r.mealRate || 0) * paxInRoom;
        const totalRatePerNight = (r.rate || 0) + mealPerNight;
        const total = totalRatePerNight * (r.nights || 0);
        grandHotelTotal += total;

        const typeLabel = { quad: 'Quad (4)', triple: 'Triple (3)', double: 'Double (2)', single: 'Single (1)' }[r.type] || r.type;
        const guests = `${r.adults || 0}A${r.children ? '+' + r.children + 'C' : ''}`;
        const mealLabel = {
          room_only: ' (Room Only)',
          breakfast: ' (Room + Breakfast)',
          half_board: ' (Room + Half Board)',
          full_board: ' (Room + Full Board)'
        }[r.meal] || '';

        return `<tr>
          <td style="padding:10px;border-bottom:1px solid #f4f4f5;vertical-align:middle">
            ${idx === 0 ? `<div style="display:flex;align-items:center;gap:12px">${imgCell}
              <div>
                <strong style="font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:.5px">${esc(city)}</strong>
                <div style="font-size:13px;font-weight:800;color:#18181b;margin-top:2px">${esc(h.name) || '—'}</div>
                ${h.distance ? `<div style="font-size:10px;color:#a1a1aa;margin-top:2px">📍 ${esc(h.distance)}</div>` : ''}
              </div>
            </div>` : ''}
          </td>
          <td style="padding:8px;border-bottom:1px solid #f4f4f5;font-size:11px">Room ${idx + 1} · ${typeLabel} · ${guests}${mealLabel}</td>
          <td style="padding:8px;border-bottom:1px solid #f4f4f5;font-size:11px">${r.nights || 0}</td>
          <td style="padding:8px;border-bottom:1px solid #f4f4f5;font-size:11px">${fmt(totalRatePerNight)}</td>
          <td style="padding:8px;border-bottom:1px solid #f4f4f5;font-size:11px"><strong>${fmt(total)}</strong></td>
        </tr>`;
      }).join('');
    }).join('');
  };

  hotelRowsHTML += buildHotelRows(makkahHotels, 'Makkah');
  hotelRowsHTML += buildHotelRows(madinahHotels, 'Madinah');

  let passengersStr = `${paxAdult}A`;
  if (paxChild) passengersStr += ` + ${paxChild}C`;
  if (paxInfant) passengersStr += ` + ${paxInfant}I`;

  /* Itinerary */
  const _seenItin = new Set();
  const itineraryRows = (p.itinerary || []).filter(it => {
    const key = `${it.day}-${it.title || ''}-${it.description || ''}`;
    if (_seenItin.has(key)) return false;
    _seenItin.add(key);
    return true;
  }).slice(0, p.days || 999);

  const inclusions = dedupeTextItems(p.inclusions || []);
  const exclusions = dedupeTextItems(p.exclusions || []);
  const importantNotes = dedupeTextItems(p.importantNotes || []);
  const paymentTerms = dedupeTextItems(p.paymentTerms || []);
  const cancellationPolicyItems = dedupeTextItems(p.cancellationPolicyItems || []);

  const docTitle = `${p.name || 'Umrah Package'} — ${p.nights || 0}N/${p.days || 0}D`;

  /* Cost breakdown */
  const paxTotalForBreakdown = (p.paxAdult || 0) + (p.paxChild || 0);
  const breakdownPax = Math.max(1, paxTotalForBreakdown);

  const costRows = [
    { icon: '🕌', label: 'Hotel Accommodation', value: p.hotelCost || 0 },
    { icon: '▤', label: 'Visa', value: p.visaCost || 0 },
    { icon: '✈', label: 'Flight (Round Trip)', value: p.flightCost || 0 },
    { icon: '★', label: 'Ziyarah Transport', value: p.ziyarahTransportCost || 0 },
    { icon: '▣', label: 'Transport / Transfer', value: p.transportCost || 0 },
    { icon: '▦', label: 'Other Services', value: p.serviceCost || 0 }
  ].filter(r => r.value > 0);

  const subtotalPerPerson = paxTotalForBreakdown > 0 ? (p.subTotal || 0) / paxTotalForBreakdown : 0;
  const vatPerPerson = paxTotalForBreakdown > 0 ? (p.vatAmount || 0) / paxTotalForBreakdown : 0;
  const serviceFeePerPerson = paxTotalForBreakdown > 0 ? (p.serviceFeeAmount || 0) / paxTotalForBreakdown : 0;
  const markupPerPerson = paxTotalForBreakdown > 0 ? (p.markupAmount || 0) / paxTotalForBreakdown : 0;
  const discountPerPerson = paxTotalForBreakdown > 0 ? (p.discountAmount || 0) / paxTotalForBreakdown : 0;
  const grandPerPerson = p.perPerson || 0;

  const costBreakdownHtml = costRows.length ? `
    <div class="cost-breakdown-section" style="margin-top:20px;padding:16px 18px;background:linear-gradient(135deg,#fff7ed,#fafafa);border:2px solid #fed7aa;border-radius:12px;page-break-inside:avoid">
      <div style="font-size:13px;font-weight:900;color:#18181b;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #f97316;text-transform:uppercase;letter-spacing:1px;text-align:center">📊 Cost Breakdown (Per Person)</div>
      <table style="width:100%;border-collapse:collapse;font-size:11.5px">
        <tbody>
          ${costRows.map(r => `<tr><td style="padding:6px 0;color:#52525b;font-weight:600"><span style="margin-right:8px">${r.icon}</span>${r.label}</td><td style="padding:6px 0;text-align:right;color:#18181b;font-weight:700;white-space:nowrap">৳ ${Math.round(r.value / breakdownPax).toLocaleString()}</td></tr>`).join('')}
          <tr style="border-top:1px dashed #fed7aa">
            <td style="padding:8px 0 4px;color:#52525b;font-weight:700">Subtotal Per Person</td>
            <td style="padding:8px 0 4px;text-align:right;color:#18181b;font-weight:800">৳ ${Math.round(subtotalPerPerson).toLocaleString()}</td>
          </tr>
          ${vatPerPerson > 0 ? `<tr><td style="padding:4px 0;color:#52525b;font-weight:600"><span style="margin-right:8px">💵</span>VAT (${p.vatPercent || 0}%)</td><td style="padding:4px 0;text-align:right;color:#f59e0b;font-weight:700">৳ ${Math.round(vatPerPerson).toLocaleString()}</td></tr>` : ''}
          ${serviceFeePerPerson > 0 ? `<tr><td style="padding:4px 0;color:#52525b;font-weight:600"><span style="margin-right:8px">▦</span>Service Fee</td><td style="padding:4px 0;text-align:right;color:#18181b;font-weight:700">৳ ${Math.round(serviceFeePerPerson).toLocaleString()}</td></tr>` : ''}
          ${markupPerPerson > 0 ? `<tr><td style="padding:4px 0;color:#52525b;font-weight:600"><span style="margin-right:8px">💰</span>Markup</td><td style="padding:4px 0;text-align:right;color:#f59e0b;font-weight:700">৳ ${Math.round(markupPerPerson).toLocaleString()}</td></tr>` : ''}
          ${discountPerPerson > 0 ? `<tr><td style="padding:4px 0;color:#52525b;font-weight:600"><span style="margin-right:8px">🎁</span>Discount</td><td style="padding:4px 0;text-align:right;color:#ef4444;font-weight:700">- ৳ ${Math.round(discountPerPerson).toLocaleString()}</td></tr>` : ''}
          <tr style="border-top:2px solid #f97316">
            <td style="padding:12px 0 4px;color:#18181b;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:.5px">👤 Total Per Person</td>
            <td style="padding:12px 0 4px;text-align:right;color:#ea580c;font-weight:900;font-size:18px;white-space:nowrap">৳ ${grandPerPerson.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>` : '';

  const includesExcludesHtml = (inclusions.length || exclusions.length) ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px;page-break-inside:avoid">
      ${inclusions.length ? `<div style="padding:14px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px">
        <div style="font-size:12px;font-weight:900;color:#166534;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #16a34a;text-transform:uppercase;letter-spacing:1px">✓ Package Inclusions</div>
        <ul style="list-style:none;padding:0;margin:0">
          ${inclusions.map(x => `<li style="padding:3px 0 3px 16px;position:relative;font-size:11px;color:#166534;line-height:1.6"><span style="position:absolute;left:0;color:#16a34a;font-weight:800">✓</span>${esc(x.text)}</li>`).join('')}
        </ul>
      </div>` : ''}
      ${exclusions.length ? `<div style="padding:14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px">
        <div style="font-size:12px;font-weight:900;color:#991b1b;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #dc2626;text-transform:uppercase;letter-spacing:1px">✕ Package Exclusions</div>
        <ul style="list-style:none;padding:0;margin:0">
          ${exclusions.map(x => `<li style="padding:3px 0 3px 16px;position:relative;font-size:11px;color:#991b1b;line-height:1.6"><span style="position:absolute;left:0;color:#dc2626;font-weight:800">✕</span>${esc(x.text)}</li>`).join('')}
        </ul>
      </div>` : ''}
    </div>` : '';

  const importantNotesHtml = importantNotes.length ? `
    <div style="margin-top:18px;padding:14px;background:#eff6ff;border-left:4px solid #3b82f6;border-radius:10px;page-break-inside:avoid">
      <div style="font-size:12px;font-weight:900;color:#1e40af;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px">📝 Important Notes</div>
      <ul style="list-style:none;padding:0;margin:0">
        ${importantNotes.map(x => `<li style="padding:3px 0 3px 16px;position:relative;font-size:11px;color:#1e3a8a;line-height:1.7"><span style="position:absolute;left:0;color:#3b82f6;font-weight:800">✓</span>${esc(x.text)}</li>`).join('')}
      </ul>
    </div>` : '';

  const paymentTermsHtml = paymentTerms.length ? `
    <div style="margin-top:14px;padding:14px;background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;page-break-inside:avoid">
      <div style="font-size:12px;font-weight:900;color:#1e40af;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #3b82f6;text-transform:uppercase;letter-spacing:1px">💳 Payment Terms</div>
      <ul style="list-style:none;padding:0;margin:0">
        ${paymentTerms.map(x => `<li style="padding:3px 0 3px 16px;position:relative;font-size:11px;color:#1e3a8a;line-height:1.7"><span style="position:absolute;left:0;color:#3b82f6;font-weight:800">✓</span>${esc(x.text)}</li>`).join('')}
      </ul>
    </div>` : '';

  const cancellationPolicyHtml = cancellationPolicyItems.length ? `
    <div style="margin-top:14px;padding:14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;page-break-inside:avoid">
      <div style="font-size:12px;font-weight:900;color:#991b1b;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #dc2626;text-transform:uppercase;letter-spacing:1px">❌ Cancellation Policy</div>
      <ul style="list-style:none;padding:0;margin:0">
        ${cancellationPolicyItems.map(x => `<li style="padding:3px 0 3px 16px;position:relative;font-size:11px;color:#991b1b;line-height:1.7"><span style="position:absolute;left:0;color:#dc2626;font-weight:800">✓</span>${esc(x.text)}</li>`).join('')}
      </ul>
    </div>` : '';

  const html = `<div class="modal-bg act" id="invoiceModal" style="background:#e8e8ec;backdrop-filter:none">
    <div class="modal" style="max-width:880px;border-radius:0">
      <div class="modal-head" style="background:#f5f5f7">
        <h2 style="color:#18181b">🖨️ Quotation Preview</h2>
        <button class="close-btn" onclick="this.closest('.modal-bg').remove()" style="background:#e8e8ec;color:#52525b">✕</button>
      </div>
      <div class="modal-body" style="padding:20px;background:#e8e8ec;max-height:80vh">
        <div id="umrahPrintArea" style="max-width:820px;margin:0 auto;background:#fff;padding:0;font-family:'Inter','Hind Siliguri',sans-serif;color:#18181b">
          ${headerImg ? `<div data-pdf-header class="pdf-header" style="width:100%;text-align:center;padding:20px 30px 10px;page-break-after:avoid"><img src="${headerImg}" style="max-width:100%;max-height:140px;object-fit:contain"></div>` : ''}
          <div style="padding:24px 40px 20px">
            <div style="text-align:center;margin-bottom:22px;padding-bottom:14px;border-bottom:3px solid #f97316">
              <div style="font-size:24px;font-weight:900;color:#18181b;letter-spacing:-.03em;margin-bottom:6px">${esc(docTitle)}</div>
              ${company ? `<div style="font-size:13px;color:#71717a;font-style:italic">${esc(company)}</div>` : ''}
              ${p.refNo ? `<div style="font-size:11px;color:#f97316;font-weight:800;margin-top:4px">Ref: ${esc(p.refNo)}</div>` : ''}
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
              <div style="padding:10px 12px;background:#fafafa;border-radius:8px;border-left:3px solid #f97316"><div style="font-size:9.5px;color:#71717a;text-transform:uppercase;font-weight:800;letter-spacing:1px">Customer</div><div style="font-size:13px;font-weight:800;color:#18181b;margin-top:2px">${esc(p.customerName) || '—'}</div></div>
              <div style="padding:10px 12px;background:#fafafa;border-radius:8px;border-left:3px solid #f97316"><div style="font-size:9.5px;color:#71717a;text-transform:uppercase;font-weight:800;letter-spacing:1px">Phone</div><div style="font-size:13px;font-weight:800;color:#18181b;margin-top:2px">${esc(p.customerPhone) || '—'}</div></div>
              <div style="padding:10px 12px;background:#fafafa;border-radius:8px;border-left:3px solid #f97316"><div style="font-size:9.5px;color:#71717a;text-transform:uppercase;font-weight:800;letter-spacing:1px">Check In</div><div style="font-size:13px;font-weight:800;color:#18181b;margin-top:2px">${p.checkIn || p.start || '—'}</div></div>
              <div style="padding:10px 12px;background:#fafafa;border-radius:8px;border-left:3px solid #f97316"><div style="font-size:9.5px;color:#71717a;text-transform:uppercase;font-weight:800;letter-spacing:1px">Check Out</div><div style="font-size:13px;font-weight:800;color:#18181b;margin-top:2px">${p.checkOut || p.end || '—'}</div></div>
              <div style="padding:10px 12px;background:#fafafa;border-radius:8px;border-left:3px solid #f97316"><div style="font-size:9.5px;color:#71717a;text-transform:uppercase;font-weight:800;letter-spacing:1px">Duration</div><div style="font-size:13px;font-weight:800;color:#18181b;margin-top:2px">${p.nights || 0}N / ${p.days || 0}D</div></div>
              <div style="padding:10px 12px;background:#fafafa;border-radius:8px;border-left:3px solid #f97316"><div style="font-size:9.5px;color:#71717a;text-transform:uppercase;font-weight:800;letter-spacing:1px">Passengers</div><div style="font-size:13px;font-weight:800;color:#18181b;margin-top:2px">${passengersStr}</div></div>
            </div>

            <div style="font-size:12px;font-weight:900;color:#18181b;margin:18px 0 10px;padding-bottom:6px;border-bottom:2px solid #f97316;text-transform:uppercase;letter-spacing:1px">🏨 Hotel Accommodation</div>
            <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;border:1px solid #e5e7eb">
              <thead>
                <tr style="background:#fef3c7">
                  <th style="padding:9px;text-align:left;color:#92400e;font-size:9.5px;text-transform:uppercase;font-weight:800">Hotel</th>
                  <th style="padding:9px;text-align:left;color:#92400e;font-size:9.5px;text-transform:uppercase;font-weight:800">Room / Sharing</th>
                  <th style="padding:9px;text-align:left;color:#92400e;font-size:9.5px;text-transform:uppercase;font-weight:800">Nights</th>
                  <th style="padding:9px;text-align:left;color:#92400e;font-size:9.5px;text-transform:uppercase;font-weight:800">Rate/Night</th>
                  <th style="padding:9px;text-align:left;color:#92400e;font-size:9.5px;text-transform:uppercase;font-weight:800">Total</th>
                </tr>
              </thead>
              <tbody>
                ${hotelRowsHTML || '<tr><td colspan="5" style="padding:14px;text-align:center;color:#999">No hotels</td></tr>'}
                ${hotelRowsHTML ? `<tr style="background:#fff7ed"><td colspan="4" style="padding:11px;text-align:right;font-weight:900;color:#92400e;text-transform:uppercase;font-size:10px;border-top:2px solid #f97316">Hotel Subtotal</td><td style="padding:11px;font-weight:900;color:#ea580c;font-size:13px;border-top:2px solid #f97316">${fmt(grandHotelTotal)}</td></tr>` : ''}
              </tbody>
            </table>

            ${itineraryRows.length ? `
              <div style="font-size:12px;font-weight:900;color:#18181b;margin:18px 0 12px;padding-bottom:6px;border-bottom:2px solid #f97316;text-transform:uppercase;letter-spacing:1px">📅 Day-wise Itinerary</div>
              ${itineraryRows.map((it, idx) => {
                const sections = parseContent(it.description);
                return `<div style="margin-bottom:14px;page-break-inside:avoid">
                  <div style="display:flex;align-items:center;border:1px solid #e8e8ec;border-radius:6px;overflow:hidden;margin-bottom:10px">
                    <div style="background:#f97316;color:#fff;font-size:11px;font-weight:800;padding:8px 14px;white-space:nowrap;flex-shrink:0">Day ${it.day}</div>
                    <div style="flex:1;background:#f4f4f5;padding:8px 14px;font-size:11.5px;font-weight:800;color:#18181b;letter-spacing:-.1px">${esc(it.title) || ''}</div>
                  </div>
                  <div style="padding-left:2px">
                    ${sections.length ? sections.map(sec => {
                      const isDuration = sec.title.toLowerCase() === 'duration';
                      if (isDuration) {
                        return `<div style="margin-bottom:8px;font-size:11px;color:#333"><strong style="color:#18181b">${esc(sec.title)}:</strong> ${sec.items.map(x => esc(x)).join(', ')}</div>`;
                      }
                      return `<div style="margin-bottom:8px">
                        <div style="font-size:11.5px;font-weight:800;color:#18181b;margin-bottom:5px">${esc(sec.title)}</div>
                        <ul style="list-style:none;padding:0;margin:0">
                          ${sec.items.map(item => `<li style="padding:3px 0 3px 18px;position:relative;font-size:10.5px;color:#333;line-height:1.7"><span style="position:absolute;left:4px;top:3px;color:#18181b;font-weight:900;font-size:12px">•</span>${esc(item)}</li>`).join('')}
                        </ul>
                      </div>`;
                    }).join('') : `<div style="padding:6px 0;font-size:10.5px;color:#999;font-style:italic">No content</div>`}
                  </div>
                  ${idx < itineraryRows.length - 1 ? '<div style="height:1px;background:#f4f4f5;margin:12px 0 8px"></div>' : ''}
                </div>`;
              }).join('')}
            ` : ''}

            ${costBreakdownHtml}
            ${includesExcludesHtml}
            ${importantNotesHtml}

            ${(paymentTermsHtml || cancellationPolicyHtml) ? `<div style="font-size:12px;font-weight:900;color:#18181b;margin:20px 0 12px;padding-bottom:6px;border-bottom:2px solid #18181b;text-transform:uppercase;letter-spacing:1px">📋 Terms and Policies</div>` : ''}
            ${paymentTermsHtml}
            ${cancellationPolicyHtml}

            <div style="background:#fafafa;padding:16px;border-radius:12px;border:2px solid #fed7aa;margin-top:18px">
              ${p.advanceAmount ? `
                <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#71717a"><span>Grand Total</span><span style="font-weight:800;color:#18181b">${fmt(p.grandTotal)}</span></div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#16a34a"><span>Advance Paid</span><span style="font-weight:800">- ${fmt(p.advanceAmount)}</span></div>
                <div style="height:1px;background:#e5e7eb;margin:8px 0"></div>
              ` : ''}
              <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:18px;font-weight:900;color:#18181b">
                <span>${p.advanceAmount ? 'DUE AMOUNT' : 'GRAND TOTAL'}</span>
                <span style="color:#ea580c">${fmt(p.dueAmount || p.grandTotal)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;font-weight:900;color:#16a34a;border-top:2px solid #f97316">
                <span>👤 Per Person</span>
                <span>${fmt(p.perPerson)}</span>
              </div>
              ${p.validUntil ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:11px;color:#71717a;text-align:center;font-weight:600">⏳ Valid until: <strong style="color:#18181b">${p.validUntil}</strong></div>` : ''}
            </div>

            ${(address || phones || emails || license) ? `
              <div style="margin-top:18px;padding:14px;background:#18181b;border-radius:10px;color:#fff;font-size:10.5px;line-height:1.7;text-align:center">
                ${address ? '📍 ' + esc(address) : ''}${phones ? ' · 📞 ' + esc(phones) : ''}${emails ? '<br>✉️ ' + esc(emails) : ''}${license ? '<br>📋 License: ' + esc(license) : ''}
              </div>
            ` : ''}
          </div>
          ${footerImg ? `<div data-pdf-footer class="pdf-footer" style="width:100%;text-align:center;padding:10px 30px 20px;page-break-before:avoid"><img src="${footerImg}" style="max-width:100%;max-height:120px;object-fit:contain"></div>` : ''}
        </div>
      </div>
      <div class="modal-foot">
        <div></div>
        <div class="right-actions">
          <button class="btn btn-secondary" onclick="this.closest('.modal-bg').remove()">Close</button>
          <button class="btn btn-green" onclick="downloadPDF()">📥 Download PDF</button>
          <button class="btn btn-primary" onclick="window.print()">🖨️ Print</button>
        </div>
      </div>
    </div>
  </div>`;

  $('modalsContainer').insertAdjacentHTML('beforeend', html);
}

/* ==================== DOWNLOAD PDF ==================== */
async function downloadPDF() {
  const el = document.getElementById('umrahPrintArea');
  if (!el) {
    toast('Quotation not ready', 'error');
    return;
  }

  const p = STORE.packages.find(x => x.id === currentViewPackageId);
  const safe = value => String(value || '').trim().replace(/[\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 100);
  const fn = `${safe(p?.name || 'Umrah')}_${safe(p?.customerName || 'Customer')}.pdf`;

  toast('Generating PDF...', 'info');
  try {
    await html2pdf().set({
      margin: [5, 5, 5, 5],
      filename: fn,
      image: { type: 'jpeg', quality: .95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.pdf-header', '.pdf-footer'] }
    }).from(el).save();
    toast('PDF downloaded');
  } catch (e) {
    toast('PDF failed: ' + e.message, 'error');
  }
}