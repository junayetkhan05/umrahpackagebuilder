/* ============================================================
   UMRAH BUILDER — PAGES / SETTINGS
   Quotation ref, user profile, company info, uploads, quick add
   ============================================================ */

/* ==================== GENERATE QUOTATION REF ==================== */
async function generateQuotationRef(type = 'UMR') {
  const s = await dbGetSetting('settings') || {};
  const companyPrefix = s.refCompanyPrefix || 'ALH';
  const typePrefix = s.refTypePrefix || type;
  const serialPad = parseInt(s.refSerialPad) || 4;
  const format = s.refFormat || '{COMPANY}-{TYPE}-{YEAR}-{SERIAL}';
  const year = new Date().getFullYear();

  const existing = STORE.packages.filter(p => p.refNo && p.refNo.includes(String(year)));
  let maxSerial = 0;
  existing.forEach(p => {
    const match = String(p.refNo).match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxSerial) maxSerial = num;
    }
  });

  const serial = String(maxSerial + 1).padStart(serialPad, '0');
  const now = new Date();

  const replacements = {
    '{COMPANY}': companyPrefix,
    '{TYPE}': typePrefix,
    '{YEAR}': String(now.getFullYear()),
    '{YEAR2}': String(now.getFullYear()).slice(-2),
    '{MONTH}': String(now.getMonth() + 1).padStart(2, '0'),
    '{DAY}': String(now.getDate()).padStart(2, '0'),
    '{SERIAL}': serial
  };

  let ref = format;
  Object.entries(replacements).forEach(([k, v]) => { ref = ref.replaceAll(k, v); });
  return ref;
}

async function regenerateRefNo() {
  const ref = await generateQuotationRef();
  setVal('pkgRefNo', ref);
  toast('🔄 Ref regenerated: ' + ref, 'info');
}

async function previewRefFormat() {
  const format = $('setRefFormat')?.value || '{COMPANY}-{TYPE}-{YEAR}-{SERIAL}';
  const company = $('setRefCompanyPrefix')?.value || 'ALH';
  const type = $('setRefTypePrefix')?.value || 'UMR';
  const pad = parseInt($('setRefSerialPad')?.value) || 4;
  const now = new Date();
  const serial = String(1).padStart(pad, '0');

  let ref = format
    .replaceAll('{COMPANY}', company)
    .replaceAll('{TYPE}', type)
    .replaceAll('{YEAR}', String(now.getFullYear()))
    .replaceAll('{YEAR2}', String(now.getFullYear()).slice(-2))
    .replaceAll('{MONTH}', String(now.getMonth() + 1).padStart(2, '0'))
    .replaceAll('{DAY}', String(now.getDate()).padStart(2, '0'))
    .replaceAll('{SERIAL}', serial);

  if ($('refPreview')) $('refPreview').textContent = ref;
}

/* ==================== UPDATE DASHBOARD NAME ==================== */
async function updateDashboardName() {
  const name = strVal('setUserName') || 'Admin';
  if ($('pageTitle')) $('pageTitle').innerHTML = `Welcome back, <span>${esc(name)}!</span>`;
  if ($('sideName')) $('sideName').textContent = name;
}

/* ==================== LOAD SETTINGS FORM ==================== */
async function loadSettingsForm() {
  try {
    const s = await dbGetSetting('settings') || {};

    if ($('setUserName')) $('setUserName').value = s.userName || 'Admin';
    if ($('setUserEmail')) $('setUserEmail').value = s.userEmail || 'admin@umrah.com';
    if ($('setUserPhone')) $('setUserPhone').value = s.userPhone || '';
    if ($('setUserRole')) $('setUserRole').value = s.userRole || 'Travel Agent';
    if ($('setCompany')) $('setCompany').value = s.company || 'Al-Haram Travels';
    if ($('setPhone')) $('setPhone').value = s.phone || '';
    if ($('setAddress')) $('setAddress').value = s.address || '';
    if ($('setEmail')) $('setEmail').value = s.email || '';
    if ($('setLicense')) $('setLicense').value = s.license || '';
    if ($('setSarRate')) $('setSarRate').value = s.sarRate || '32.80';
    if ($('setUsdRate')) $('setUsdRate').value = s.usdRate || '120';
    if ($('setExBuffer')) $('setExBuffer').value = s.exBuffer || '2';
    if ($('setRefCompanyPrefix')) $('setRefCompanyPrefix').value = s.refCompanyPrefix || 'ALH';
    if ($('setRefTypePrefix')) $('setRefTypePrefix').value = s.refTypePrefix || 'UMR';
    if ($('setRefSerialPad')) $('setRefSerialPad').value = s.refSerialPad || '4';
    if ($('setRefFormat')) $('setRefFormat').value = s.refFormat || '{COMPANY}-{TYPE}-{YEAR}-{SERIAL}';
    if ($('setVatPercent')) $('setVatPercent').value = s.vatPercent !== undefined ? s.vatPercent : '15';
    if ($('setServiceFee')) $('setServiceFee').value = s.serviceFee || '0';
    if ($('setDefaultPolicy')) $('setDefaultPolicy').value = s.defaultPolicy || '';
    if ($('setDefaultNotes')) $('setDefaultNotes').value = s.defaultNotes || '';

    previewRefFormat();

    // Profile picture
    if (s.userPicData) {
      const prev = $('profilePicPreview');
      if (prev) prev.innerHTML = `<img src="${s.userPicData}" alt="">`;
      const sideImg = $('sideAvatar'), sideFall = $('sideAvatarFallback');
      if (sideImg) { sideImg.src = s.userPicData; sideImg.style.display = 'block'; }
      if (sideFall) sideFall.style.display = 'none';
    }

    // Header/Footer images
    if (s.headerImgData) {
      const hp = $('headerImgPreview');
      if (hp) hp.innerHTML = `<img src="${s.headerImgData}" alt="">`;
    }
    if (s.footerImgData) {
      const fp = $('footerImgPreview');
      if (fp) fp.innerHTML = `<img src="${s.footerImgData}" alt="">`;
    }

    if ($('sideName')) $('sideName').textContent = s.userName || 'Admin';
    if ($('sideEmail')) $('sideEmail').textContent = s.userEmail || 'admin@umrah.com';
    if ($('pageTitle')) {
      const name = s.userName || 'Admin';
      $('pageTitle').innerHTML = `Welcome back, <span>${esc(name)}!</span>`;
    }
  } catch (e) {
    console.warn(e);
  }
}
async function loadSettingsForm() {
  try {
    const s = await dbGetSetting('settings') || {};
    
    // ... existing code ...

    // ⭐ NEW: Render linked providers
    if (typeof renderAccountInfo === 'function') {
      setTimeout(renderAccountInfo, 100);
    }

  } catch (e) {
    console.warn(e);
  }
}
/* ==================== SAVE SETTINGS ==================== */
async function saveSettings() {
  try {
    const e = await dbGetSetting('settings') || {};
    const vatValue = parseFloat($('setVatPercent')?.value);

    const data = {
      ...e,
      userName: $('setUserName')?.value || 'Admin',
      userEmail: $('setUserEmail')?.value || '',
      userPhone: $('setUserPhone')?.value || '',
      userRole: $('setUserRole')?.value || '',
      company: $('setCompany')?.value || '',
      phone: $('setPhone')?.value || '',
      address: $('setAddress')?.value || '',
      email: $('setEmail')?.value || '',
      license: $('setLicense')?.value || '',
      sarRate: parseFloat($('setSarRate')?.value) || 32.80,
      usdRate: parseFloat($('setUsdRate')?.value) || 120,
      exBuffer: parseFloat($('setExBuffer')?.value) || 2,
      refCompanyPrefix: $('setRefCompanyPrefix')?.value || 'ALH',
      refTypePrefix: $('setRefTypePrefix')?.value || 'UMR',
      refSerialPad: parseInt($('setRefSerialPad')?.value) || 4,
      refFormat: $('setRefFormat')?.value || '{COMPANY}-{TYPE}-{YEAR}-{SERIAL}',
      vatPercent: Number.isFinite(vatValue) ? vatValue : 15,
      serviceFee: parseFloat($('setServiceFee')?.value) || 0,
      defaultPolicy: $('setDefaultPolicy')?.value || '',
      defaultNotes: $('setDefaultNotes')?.value || '',
      savedAt: Date.now()
    };

    await dbSaveSetting('settings', data);
    loadSettingsForm();
    updateDashboardName();
    toast('✅ Settings saved');
  } catch (e) {
    toast('Save failed: ' + e.message, 'error');
  }
}

/* ==================== USER PROFILE PICTURE ==================== */
async function uploadUserPic(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('Max 2MB', 'error'); return; }

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const e = await dbGetSetting('settings') || {};
    e.userPicData = ev.target.result;
    await dbSaveSetting('settings', e);
    loadSettingsForm();
    toast('✅ Profile photo uploaded');
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

async function removeUserPic() {
  confirmDelete('Remove profile photo?', async () => {
    const e = await dbGetSetting('settings') || {};
    e.userPicData = '';
    await dbSaveSetting('settings', e);
    const prev = $('profilePicPreview');
    if (prev) prev.innerHTML = '<span id="profilePicFallback">A</span>';
    const sideImg = $('sideAvatar'), sideFall = $('sideAvatarFallback');
    if (sideImg) { sideImg.src = ''; sideImg.style.display = 'none'; }
    if (sideFall) sideFall.style.display = 'flex';
    toast('✅ Photo removed');
  });
}

/* ==================== HEADER IMAGE ==================== */
async function uploadHeaderImg(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('Max 2MB', 'error'); return; }

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const e = await dbGetSetting('settings') || {};
    e.headerImgData = ev.target.result;
    await dbSaveSetting('settings', e);
    loadSettingsForm();
    toast('✅ Header image uploaded');
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

async function removeHeaderImg() {
  confirmDelete('Remove header image?', async () => {
    const e = await dbGetSetting('settings') || {};
    e.headerImgData = '';
    await dbSaveSetting('settings', e);
    const hp = $('headerImgPreview');
    if (hp) hp.innerHTML = '<span>No header image</span>';
    toast('✅ Header removed');
  });
}

/* ==================== FOOTER IMAGE ==================== */
async function uploadFooterImg(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('Max 2MB', 'error'); return; }

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const e = await dbGetSetting('settings') || {};
    e.footerImgData = ev.target.result;
    await dbSaveSetting('settings', e);
    loadSettingsForm();
    toast('✅ Footer image uploaded');
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

async function removeFooterImg() {
  confirmDelete('Remove footer image?', async () => {
    const e = await dbGetSetting('settings') || {};
    e.footerImgData = '';
    await dbSaveSetting('settings', e);
    const fp = $('footerImgPreview');
    if (fp) fp.innerHTML = '<span>No footer image</span>';
    toast('✅ Footer removed');
  });
}

/* ==================== QUICK ADD (from master tables) ==================== */
function quickAddHotel(ct, id) {
  openBuilder();
  setTimeout(() => {
    if (ct === 'makkah') {
      addMakkahHotel();
      const l = makkahItems[makkahItems.length - 1];
      if (l) onMakkahHotelChange(l.id, id);
    } else {
      addMadinahHotel();
      const l = madinahItems[madinahItems.length - 1];
      if (l) onMadinahHotelChange(l.id, id);
    }
  }, 150);
}

function quickAddFlight(id) {
  openBuilder();
  setTimeout(() => {
    addFlightItem();
    const l = flightItems[flightItems.length - 1];
    if (l) onFlightItemChange(l.id, id);
  }, 150);
}

function quickAddTransport(id) {
  openBuilder();
  setTimeout(() => {
    addTransportItem();
    const l = transportItems[transportItems.length - 1];
    if (l) onTransportItemChange(l.id, id);
  }, 150);
}

function quickAddVisa(id) {
  openBuilder();
  setTimeout(() => {
    addVisaItem();
    const l = visaItems[visaItems.length - 1];
    if (l) onVisaItemChange(l.id, id);
  }, 150);
}

function quickAddService(id) {
  openBuilder();
  setTimeout(() => {
    addServiceItem();
    const l = serviceItems[serviceItems.length - 1];
    if (l) onServiceItemChange(l.id, id);
  }, 150);
}

/* ==================== SETTINGS - LIVE PREVIEW ==================== */
document.addEventListener('input', e => {
  if (['setRefFormat', 'setRefCompanyPrefix', 'setRefTypePrefix', 'setRefSerialPad'].includes(e.target.id)) {
    previewRefFormat();
  }
});