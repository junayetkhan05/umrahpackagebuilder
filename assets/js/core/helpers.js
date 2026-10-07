/* ============================================================
   UMRAH BUILDER — CORE / HELPERS
   Date helpers, Format helpers, Toast, Loading, DOM helpers
   ============================================================ */

/* ==================== DATE HELPERS ==================== */
function daysBetween(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  if (e <= s) return 0;
  return Math.round((e - s) / 86400000);
}

function addDays(dateStr, n) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDateBn(dateStr) {
  if (!dateStr) return '';
  try {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

function formatDateForExcel(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().slice(0, 10);
  } catch (e) {
    return dateStr;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ==================== FORMAT HELPERS ==================== */
const $ = id => document.getElementById(id);

function fmt(n) {
  return '৳ ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function escapeAttr(s) {
  return esc(s);
}

/* ==================== VALUE HELPERS ==================== */
function numVal(id, fallback = 0) {
  const el = $(id);
  const n = parseFloat(el?.value);
  return Number.isFinite(n) ? n : fallback;
}

function intVal(id, fallback = 0) {
  const el = $(id);
  const n = parseInt(el?.value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function strVal(id, fallback = '') {
  const el = $(id);
  return el ? String(el.value ?? '').trim() : fallback;
}

function setVal(id, value) {
  const el = $(id);
  if (el) el.value = value ?? '';
}

/* ==================== TOAST ==================== */
function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  const icon = document.createElement('span');
  icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '!' : 'i';
  const txt = document.createElement('span');
  txt.textContent = msg;
  txt.style.flex = '1';
  t.appendChild(icon);
  t.appendChild(txt);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ==================== LOADING ==================== */
let loadingCount = 0;

function showLoading(text = 'Loading...') {
  loadingCount++;
  const ov = $('loadingOverlay');
  if (!ov) return;
  ov.classList.add('act');
  const lt = $('loadingText');
  if (lt) lt.textContent = text;
}

function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) $('loadingOverlay')?.classList.remove('act');
}

/* ==================== ERROR HELPERS ==================== */
function setError(id, msg) {
  const el = $(id);
  if (!el) return;
  el.classList.add('error');
  const f = el.closest('.field');
  if (f) {
    f.classList.add('has-error');
    const e = f.querySelector('.err-msg');
    if (e) e.textContent = msg;
  }
}

function clearError(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove('error');
  const f = el.closest('.field');
  if (f) f.classList.remove('has-error');
}

function clearAllErrors() {
  document.querySelectorAll('.field.has-error').forEach(f => f.classList.remove('has-error'));
  document.querySelectorAll('.field input.error,.field select.error').forEach(el => el.classList.remove('error'));
}

/* ==================== HOTEL EXPIRY ==================== */
function isHotelExpired(h) {
  if (!h.validUntil) return false;
  return h.validUntil < today();
}

function isHotelExpiringSoon(h) {
  if (!h.validUntil) return false;
  const diff = Math.round((new Date(h.validUntil) - new Date()) / 86400000);
  return diff >= 0 && diff <= 7;
}

/* ==================== DEDUPE TEXT ITEMS ==================== */
function dedupeTextItems(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter(item => {
    const text = String(item?.text || '').trim();
    if (!text || seen.has(text.toLowerCase())) return false;
    seen.add(text.toLowerCase());
    return true;
  }).map((item, index) => ({ ...item, id: index + 1, text: String(item.text).trim() }));
}