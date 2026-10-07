/* ============================================================
   UMRAH BUILDER — BUILDER / CONTENT
   Inclusions, Exclusions, Important Notes, Payment Terms, Cancellation Policy
   + renderAll() master function
   ============================================================ */

/* ==================== INCLUSIONS ==================== */
function addInclusionItem(value = '') {
  incC++;
  inclusionsItems.push({ id: incC, text: value });
  renderInclusionsList();
}

function removeInclusionItem(id) {
  inclusionsItems = inclusionsItems.filter(x => x.id !== id);
  renderInclusionsList();
}

function updateInclusionItem(id, value) {
  const it = inclusionsItems.find(x => x.id === id);
  if (it) it.text = value;
}

function renderInclusionsList() {
  const el = $('inclusionsList');
  if (!el) return;
  if (!inclusionsItems.length) {
    el.innerHTML = '<div class="empty-slot" style="padding:14px;font-size:12px"><span class="ic">✅</span>No inclusions</div>';
    return;
  }
  el.innerHTML = inclusionsItems.map(it => `
    <div class="editable-item">
      <input type="text" value="${esc(it.text)}" onchange="updateInclusionItem(${it.id},this.value)" placeholder="Add inclusion...">
      <button class="rm-btn" onclick="removeInclusionItem(${it.id})">✕</button>
    </div>
  `).join('');
}

/* ==================== EXCLUSIONS ==================== */
function addExclusionItem(value = '') {
  excC++;
  exclusionsItems.push({ id: excC, text: value });
  renderExclusionsList();
}

function removeExclusionItem(id) {
  exclusionsItems = exclusionsItems.filter(x => x.id !== id);
  renderExclusionsList();
}

function updateExclusionItem(id, value) {
  const it = exclusionsItems.find(x => x.id === id);
  if (it) it.text = value;
}

function renderExclusionsList() {
  const el = $('exclusionsList');
  if (!el) return;
  if (!exclusionsItems.length) {
    el.innerHTML = '<div class="empty-slot" style="padding:14px;font-size:12px"><span class="ic">❌</span>No exclusions</div>';
    return;
  }
  el.innerHTML = exclusionsItems.map(it => `
    <div class="editable-item">
      <input type="text" value="${esc(it.text)}" onchange="updateExclusionItem(${it.id},this.value)" placeholder="Add exclusion...">
      <button class="rm-btn" onclick="removeExclusionItem(${it.id})">✕</button>
    </div>
  `).join('');
}

/* ==================== IMPORTANT NOTES ==================== */
function addImportantNoteItem(value = '') {
  noteC++;
  importantNotesItems.push({ id: noteC, text: value });
  renderImportantNotesList();
}

function removeImportantNoteItem(id) {
  importantNotesItems = importantNotesItems.filter(x => x.id !== id);
  renderImportantNotesList();
}

function updateImportantNoteItem(id, value) {
  const it = importantNotesItems.find(x => x.id === id);
  if (it) it.text = value;
}

function renderImportantNotesList() {
  const el = $('importantNotesList');
  if (!el) return;
  if (!importantNotesItems.length) {
    el.innerHTML = '<div class="empty-slot" style="padding:14px;font-size:12px"><span class="ic">📝</span>No notes</div>';
    return;
  }
  el.innerHTML = importantNotesItems.map(it => `
    <div class="editable-item">
      <input type="text" value="${esc(it.text)}" onchange="updateImportantNoteItem(${it.id},this.value)" placeholder="Add note...">
      <button class="rm-btn" onclick="removeImportantNoteItem(${it.id})">✕</button>
    </div>
  `).join('');
}

/* ==================== PAYMENT TERMS ==================== */
function addPaymentTermItem(value = '') {
  ptC++;
  paymentTermsItems.push({ id: ptC, text: value });
  renderPaymentTermsList();
}

function removePaymentTermItem(id) {
  paymentTermsItems = paymentTermsItems.filter(x => x.id !== id);
  renderPaymentTermsList();
}

function updatePaymentTermItem(id, value) {
  const it = paymentTermsItems.find(x => x.id === id);
  if (it) it.text = value;
}

function renderPaymentTermsList() {
  const el = $('paymentTermsList');
  if (!el) return;
  if (!paymentTermsItems.length) {
    el.innerHTML = '<div class="empty-slot" style="padding:10px;font-size:11.5px"><span class="ic">💳</span>No terms</div>';
    return;
  }
  el.innerHTML = paymentTermsItems.map(it => `
    <div class="editable-item">
      <input type="text" value="${esc(it.text)}" onchange="updatePaymentTermItem(${it.id},this.value)" placeholder="Payment term...">
      <button class="rm-btn" onclick="removePaymentTermItem(${it.id})">✕</button>
    </div>
  `).join('');
}

/* ==================== CANCELLATION POLICY ==================== */
function addCancellationPolicyItem(value = '') {
  cpC++;
  cancellationPolicyItems.push({ id: cpC, text: value });
  renderCancellationPolicyList();
}

function removeCancellationPolicyItem(id) {
  cancellationPolicyItems = cancellationPolicyItems.filter(x => x.id !== id);
  renderCancellationPolicyList();
}

function updateCancellationPolicyItem(id, value) {
  const it = cancellationPolicyItems.find(x => x.id === id);
  if (it) it.text = value;
}

function renderCancellationPolicyList() {
  const el = $('cancellationPolicyList');
  if (!el) return;
  if (!cancellationPolicyItems.length) {
    el.innerHTML = '<div class="empty-slot" style="padding:10px;font-size:11.5px"><span class="ic">❌</span>No policies</div>';
    return;
  }
  el.innerHTML = cancellationPolicyItems.map(it => `
    <div class="editable-item">
      <input type="text" value="${esc(it.text)}" onchange="updateCancellationPolicyItem(${it.id},this.value)" placeholder="Cancellation policy...">
      <button class="rm-btn" onclick="removeCancellationPolicyItem(${it.id})">✕</button>
    </div>
  `).join('');
}

/* ==================== RENDER ALL ==================== */
function renderAll() {
  try { renderMakkahHotelsList(); } catch (e) { console.warn('makkah', e); }
  try { renderMadinahHotelsList(); } catch (e) { console.warn('madinah', e); }
  try { renderFlightsList(); } catch (e) { console.warn('flight', e); }
  try { renderTransportsList(); } catch (e) { console.warn('transport', e); }
  try { renderVisasList(); } catch (e) { console.warn('visa', e); }
  try { renderServicesList(); } catch (e) { console.warn('services', e); }
  try { renderItineraryList(); } catch (e) { console.warn('itinerary', e); }
  try { renderInclusionsList(); } catch (e) { console.warn('inclusions', e); }
  try { renderExclusionsList(); } catch (e) { console.warn('exclusions', e); }
  try { renderImportantNotesList(); } catch (e) { console.warn('notes', e); }
  try { renderPaymentTermsList(); } catch (e) { console.warn('pt', e); }
  try { renderCancellationPolicyList(); } catch (e) { console.warn('cp', e); }
  try { renderZiyarahTransportList(); } catch (e) { console.warn('zyTrans', e); }
}