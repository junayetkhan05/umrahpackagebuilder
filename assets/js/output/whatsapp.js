/* ============================================================
   UMRAH BUILDER — OUTPUT / WHATSAPP
   Share package via WhatsApp (message only / PDF + message)
   ============================================================ */

/* ==================== OPEN SHARE MODAL ==================== */
function sharePackageWhatsApp(id) {
  const p = STORE.packages.find(x => x.id === id);
  if (!p) return;

  $('waPkgId').value = id;
  $('waPkgName').textContent = p.name || 'Untitled Package';
  $('waPhoneInput').value = p.customerPhone || '';
  clearAllErrors();
  openModal('whatsappShareModal');
}

/* ==================== BUILD MESSAGE ==================== */
function buildWhatsAppMessage(p) {
  let msg = `*🕋 ${p.name || 'Umrah Package'}*\n`;
  if (p.refNo) msg += `Ref: ${p.refNo}\n`;

  msg += `\n📅 ${p.checkIn || p.start || '—'} → ${p.checkOut || p.end || '—'}\n`;
  msg += `📆 ${p.nights || 0}N / ${p.days || 0}D\n`;
  msg += `👥 ${p.paxAdult || 0}A${p.paxChild ? ' + ' + p.paxChild + 'C' : ''}\n\n`;

  msg += `🕌 *Makkah:* ${(p.makkahHotels || []).map(h => `${h.name} (${h.rooms?.length || 0} rooms)`).join(', ') || '—'}\n`;
  msg += `🕌 *Madinah:* ${(p.madinahHotels || []).map(h => `${h.name} (${h.rooms?.length || 0} rooms)`).join(', ') || '—'}\n\n`;

  const packagePaid = getPackagePaid(p);
  const packageDue = Math.max(0, Number(p.grandTotal || 0) - packagePaid);

  msg += `💰 *Total:* ${fmt(p.grandTotal)}\n`;
  if (packagePaid > 0 || packageDue > 0) {
    msg += `💵 *Paid:* ${fmt(packagePaid)}\n`;
    msg += `⏳ *Due:* ${fmt(packageDue)}\n`;
  }
  msg += `👤 *Per Person:* ${fmt(p.perPerson)}\n`;
  if (p.validUntil) msg += `⏳ Valid until: ${p.validUntil}\n`;
  msg += `\nধন্যবাদ! 🙏`;
  return msg;
}

/* ==================== NORMALIZE PHONE ==================== */
function normalizeWaPhone(raw) {
  let phone = String(raw || '').replace(/\D/g, '');
  if (!phone) return '';
  if (phone.startsWith('01')) phone = '88' + phone;
  else if (phone.startsWith('1') && phone.length === 10) phone = '880' + phone;
  return phone;
}

/* ==================== SEND MESSAGE ONLY ==================== */
function waJustMessage() {
  const id = parseInt($('waPkgId').value);
  const phoneRaw = $('waPhoneInput').value.trim();

  if (!phoneRaw) {
    setError('waPhoneInput', 'Phone number দিন');
    return;
  }
  const phone = normalizeWaPhone(phoneRaw);
  if (!phone || phone.length < 10) {
    setError('waPhoneInput', 'Valid number দিন');
    return;
  }

  const p = STORE.packages.find(x => x.id === id);
  if (!p) return;

  const msg = buildWhatsAppMessage(p);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');

  closeModal('whatsappShareModal');
  toast('✅ WhatsApp opened');
}

/* ==================== SEND PDF + MESSAGE ==================== */
async function waWithPDF() {
  const id = parseInt($('waPkgId').value);
  const phoneRaw = $('waPhoneInput').value.trim();

  if (!phoneRaw) {
    setError('waPhoneInput', 'Phone number দিন');
    return;
  }
  const phone = normalizeWaPhone(phoneRaw);
  if (!phone || phone.length < 10) {
    setError('waPhoneInput', 'Valid number দিন');
    return;
  }

  const p = STORE.packages.find(x => x.id === id);
  if (!p) return;

  closeModal('whatsappShareModal');
  showLoading('Generating PDF...');

  try {
    /* Generate quotation first */
    await printQuotation(id);
    await new Promise(r => setTimeout(r, 400));

    const el = document.getElementById('umrahPrintArea');
    if (!el) throw new Error('Quotation not ready');

    const fn = `${(p.name || 'Umrah').replace(/[^a-z0-9]/gi, '_')}_${(p.customerName || 'Customer').replace(/[^a-z0-9]/gi, '_')}.pdf`;

    const pdfBlob = await html2pdf().set({
      margin: [5, 5, 5, 5],
      filename: fn,
      image: { type: 'jpeg', quality: .95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.pdf-header', '.pdf-footer'] }
    }).from(el).outputPdf('blob');

    /* Download PDF */
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fn;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

    /* Remove quotation modal */
    document.getElementById('invoiceModal')?.remove();
    hideLoading();

    /* Try Web Share API (mobile) */
    let shared = false;
    try {
      const file = new File([pdfBlob], fn, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: p.name || 'Umrah Package',
          text: buildWhatsAppMessage(p)
        });
        shared = true;
        toast('✅ WhatsApp-এ PDF শেয়ার হয়েছে');
      }
    } catch (e) {
      console.warn('Web Share failed:', e);
    }

    /* Fallback: open WhatsApp with message + file name hint */
    if (!shared) {
      const msg = buildWhatsAppMessage(p) + `\n\n📄 PDF: ${fn}`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      toast('✅ PDF downloaded — WhatsApp এ attach করুন', 'info');
    }
  } catch (e) {
    hideLoading();
    document.getElementById('invoiceModal')?.remove();
    toast('PDF failed: ' + e.message, 'error');
  }
}

/* ==================== ALIAS ==================== */
function shareWhatsApp(id) {
  return sharePackageWhatsApp(id);
}