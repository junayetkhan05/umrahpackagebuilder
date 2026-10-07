/* ============================================================
   UMRAH BUILDER — MODULES / MODALS
   Open/close modal + Delete confirmation
   ============================================================ */

function openModal(id) {
  const m = $(id);
  if (m) m.classList.add('act');
  if (id === 'builderModal') $('stickySummary')?.classList.add('act');
}

function closeModal(id) {
  const m = $(id);
  if (m) m.classList.remove('act');
  if (id === 'builderModal') $('stickySummary')?.classList.remove('act');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-bg.act').forEach(m => m.classList.remove('act'));
    $('stickySummary')?.classList.remove('act');
  }
});

/* ==================== DELETE CONFIRM ==================== */
let pendingDelete = null;

function confirmDelete(message, callback) {
  pendingDelete = callback;
  const msgEl = $('deleteConfirmMessage');
  if (msgEl) msgEl.textContent = message;
  const inputEl = $('deleteConfirmInput');
  if (inputEl) inputEl.value = '';
  const btn = $('deleteConfirmBtn');
  if (btn) btn.disabled = true;
  openModal('deleteConfirmModal');
  setTimeout(() => $('deleteConfirmInput')?.focus(), 200);
}

function checkDeleteConfirm() {
  const val = String($('deleteConfirmInput')?.value || '').trim().toLowerCase();
  const btn = $('deleteConfirmBtn');
  if (btn) btn.disabled = val !== 'confirm';
}

function executeDelete() {
  const val = String($('deleteConfirmInput')?.value || '').trim().toLowerCase();
  if (val !== 'confirm') return;
  const cb = pendingDelete;
  pendingDelete = null;
  closeModal('deleteConfirmModal');
  if (cb) cb();
}