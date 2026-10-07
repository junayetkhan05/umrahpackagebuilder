/* ============================================================
   UMRAH BUILDER — MODULES / CALCULATOR
   Package totals, recalc, markup handling, paid helpers
   ============================================================ */

/* ==================== PACKAGE NIGHTS ==================== */
function getPackageNights() {
  return daysBetween($('pkgCheckIn')?.value, $('pkgCheckOut')?.value);
}

/* ==================== PACKAGE PAID HELPERS ==================== */
function getPackageAdvance(p) {
  return Math.max(0, Number(p?.advanceAmount || 0));
}

function getPackageLedgerPaid(p) {
  let paid = 0;
  STORE.customers.forEach(c => (c.payments || []).forEach(pm => {
    if (pm.packageId === p.id) paid += Math.max(0, Number(pm.amount || 0));
  }));
  return paid;
}

function getPackagePaid(p) {
  return getPackageAdvance(p) + getPackageLedgerPaid(p);
}

/* ==================== MARKUP INPUT TOGGLE ==================== */
function toggleMarkupInput() {
  const type = strVal('markupType', 'percent');
  const pctInput = $('markupPercent');
  const valInput = $('markupValue');
  const valLabel = $('markupFixedLabel');

  if (pctInput) pctInput.disabled = type !== 'percent';
  if (valInput) valInput.disabled = type === 'percent';

  if (valLabel) {
    const labels = {
      fixed: 'Fixed Markup (৳)',
      per_person: 'Markup Per Person (৳)',
      target: 'Target Selling Price (৳)'
    };
    valLabel.textContent = labels[type] || 'Fixed / Target (৳)';
  }
  recalc();
}

/* ==================== TOTAL GUESTS DISPLAY ==================== */
function updateTotalGuestsDisplay() {
  const pax = intVal('paxAdult', 0) + intVal('paxChild', 0) + intVal('paxInfant', 0);
  const el = $('totalGuestsDisplay');
  if (el) el.value = pax + ' guests';
}

/* ==================== CALCULATE PACKAGE TOTALS ==================== */
function calculatePackageTotals() {
  const paxAdult = Math.max(0, intVal('paxAdult', 0));
  const paxChild = Math.max(0, intVal('paxChild', 0));
  const paxInfant = Math.max(0, intVal('paxInfant', 0));
  const paxChargeable = paxAdult + paxChild;

  const hotelCost = getMakkahTotal() + getMadinahTotal();
  const ziyarahTransportCost = getZiyarahTransportCost();
  const vendorHotelCost = getMakkahVendorCost() + getMadinahVendorCost();

  /* Flight */
  let flightCost = 0;
  (flightItems || []).forEach(f => {
    const isRound = f.tripType === 'round_trip';
    const totalAdult = (f.fareAdult || 0) + (isRound ? (f.returnFareAdult || 0) : 0);
    const totalChild = (f.fareChild || 0) + (isRound ? (f.returnFareChild || 0) : 0);
    const totalInfant = (f.fareInfant || 0) + (isRound ? (f.returnFareInfant || 0) : 0);
    flightCost += totalAdult * paxAdult + totalChild * paxChild + totalInfant * paxInfant;
  });

  /* Transport */
  const transportCost = (transportItems || []).reduce((sum, t) => {
    const price = Math.max(0, Number(t.price || 0));
    if (t.priceType === 'per_vehicle') {
      const capacity = Number(t.capacity || VEHICLE_CAPACITY[t.vehicle] || 0);
      const required = capacity > 0 ? Math.ceil(paxChargeable / capacity) : 1;
      const vehicles = Math.max(1, Number(t.vehicleCount || 1), required);
      return sum + (price * vehicles);
    }
    return sum + (price * paxChargeable);
  }, 0);

  /* Visa */
  let visaCost = 0, visaVendorCost = 0;
  (visaItems || []).forEach(v => {
    const adultFee = Math.max(0, Number(v.priceAdult || v.price || 0));
    const childFee = Math.max(0, Number(v.priceChild || adultFee));
    const infantFee = Math.max(0, Number(v.priceInfant || 0));
    visaCost += adultFee * paxAdult + childFee * paxChild + infantFee * paxInfant;

    const adultCost = Math.max(0, Number(v.costAdult || 0));
    const childCost = Math.max(0, Number(v.costChild || adultCost));
    const infantCost = Math.max(0, Number(v.costInfant || 0));
    visaVendorCost += adultCost * paxAdult + childCost * paxChild + infantCost * paxInfant;
  });

  /* Service */
  const serviceCost = (serviceItems || []).reduce((sum, sv) => {
    const multiplier = sv.priceType === 'per_group' ? 1 : paxChargeable;
    return sum + (Math.max(0, Number(sv.price || 0)) * multiplier);
  }, 0);

  /* Subtotal */
  const subTotal = hotelCost + flightCost + transportCost + visaCost + serviceCost + ziyarahTransportCost;

  /* VAT + Service Fee */
  const vatPercent = Math.max(0, numVal('vatPercent', 0));
  const vatAmount = vatPercent > 0 ? Math.round(subTotal * vatPercent / 100) : 0;
  const serviceFeeAmount = Math.max(0, numVal('serviceFeeAmount', 0));
  const totalWithTaxes = subTotal + vatAmount + serviceFeeAmount;

  /* Markup */
  const markupType = strVal('markupType', 'percent') || 'percent';
  const markupPercent = Math.max(0, numVal('markupPercent', 0));
  const markupValue = Math.max(0, numVal('markupValue', 0));
  const discountAmount = Math.max(0, numVal('discountAmount', 0));
  const advanceAmount = Math.max(0, numVal('advanceAmount', 0));

  let markupAmount = 0;
  if (markupType === 'fixed') markupAmount = markupValue;
  else if (markupType === 'per_person') markupAmount = markupValue * paxChargeable;
  else if (markupType === 'target') markupAmount = Math.max(0, markupValue - totalWithTaxes);
  else markupAmount = totalWithTaxes * markupPercent / 100;
  markupAmount = Math.round(markupAmount);

  const grossTotal = totalWithTaxes + markupAmount;
  const grandTotal = Math.max(0, Math.round(grossTotal - discountAmount));
  const dueAmount = Math.max(0, grandTotal - advanceAmount);

  /* Vendor costs */
  const vendorFlightCost = flightCost;
  const vendorTransportCost = transportCost;
  const vendorServiceCost = serviceCost;
  const vendorZiyarahCost = ziyarahTransportCost;
  const vendorVisaCost = visaVendorCost;

  const totalVendorCost = vendorHotelCost + vendorFlightCost + vendorTransportCost +
                          vendorServiceCost + vendorZiyarahCost + vendorVisaCost;

  const actualProfit = grandTotal - totalVendorCost - vatAmount - serviceFeeAmount;
  const profitMargin = grandTotal > 0 ? (actualProfit / grandTotal) * 100 : 0;
  const perPerson = paxChargeable > 0 ? Math.round(grandTotal / paxChargeable) : 0;

  return {
    paxAdult, paxChild, paxInfant, paxChargeable,
    hotelCost, flightCost, transportCost, visaCost, serviceCost, ziyarahTransportCost,
    subTotal, vatPercent, vatAmount, serviceFeeAmount, totalWithTaxes,
    markupType, markupPercent, markupValue, markupAmount,
    discountAmount, advanceAmount, dueAmount,
    grossTotal, grandTotal, perPerson,
    vendorHotelCost, vendorFlightCost, vendorTransportCost, vendorServiceCost, vendorZiyarahCost, vendorVisaCost,
    totalVendorCost, actualProfit, profitMargin
  };
}

/* ==================== RECALC ==================== */
function recalc() {
  const t = calculatePackageTotals();

  if ($('sumHotel')) $('sumHotel').textContent = fmt(t.hotelCost);
  if ($('sumFlight')) $('sumFlight').textContent = fmt(t.flightCost);
  if ($('sumTransport')) $('sumTransport').textContent = fmt(t.transportCost);
  if ($('sumVisa')) $('sumVisa').textContent = fmt(t.visaCost);
  if ($('sumZiyarah')) $('sumZiyarah').textContent = fmt(t.ziyarahTransportCost);
  if ($('sumServices')) $('sumServices').textContent = fmt(t.serviceCost);
  if ($('grandSubTotal')) $('grandSubTotal').textContent = fmt(t.subTotal);
  if ($('vatAmount')) $('vatAmount').textContent = fmt(t.vatAmount);
  if ($('markupAmount')) $('markupAmount').textContent = fmt(t.markupAmount);
  if ($('grandTotal')) $('grandTotal').textContent = fmt(t.grandTotal);
  if ($('perPersonTotal')) $('perPersonTotal').textContent = fmt(t.perPerson);
  if ($('dueAmount')) $('dueAmount').textContent = fmt(t.dueAmount);
  if ($('profitAmount')) $('profitAmount').textContent = fmt(t.actualProfit);
  if ($('profitMargin')) $('profitMargin').textContent = t.profitMargin.toFixed(1) + '%';
  if ($('ssSubTotal')) $('ssSubTotal').textContent = fmt(t.totalVendorCost);
  if ($('ssGrandTotal')) $('ssGrandTotal').textContent = fmt(t.grandTotal);
  if ($('ssProfit')) $('ssProfit').textContent = fmt(t.actualProfit);
  if ($('ssPerPerson')) $('ssPerPerson').textContent = fmt(t.perPerson);

  updateTotalGuestsDisplay();
  return t;
}