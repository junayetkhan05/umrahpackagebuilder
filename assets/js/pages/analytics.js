/* ============================================================
   UMRAH BUILDER — PAGES / ANALYTICS
   Analytics dashboard + table + charts + Excel import/export
   ============================================================ */

/* analyticsFilterFrom, analyticsFilterTo declared in state.js */

/* ==================== RENDER ANALYTICS ==================== */
function renderAnalytics() {
  const packages = STORE.packages || [];
  const activePackages = packages.filter(p => p.status !== 'Cancelled');

  let totalCustomerSell = 0;
  let totalVendorCost = 0;
  let totalVendorVisa = 0;
  let totalPending = 0;
  let totalNetProfit = 0;

  const statusCounts = {}, typeRevenue = {};

  activePackages.forEach(p => {
    const customerSell = p.grandTotal || 0;
    totalCustomerSell += customerSell;

    const vendorCost = (p.vendorHotelCost || 0) + (p.vendorFlightCost || 0) +
                       (p.vendorTransportCost || 0) + (p.vendorServiceCost || 0) +
                       (p.vendorZiyarahCost || 0) + (p.vendorVisaCost || 0);
    totalVendorCost += vendorCost;
    totalVendorVisa += (p.vendorVisaCost || 0);

    if (!['Paid', 'Completed', 'Travelled'].includes(p.status)) totalPending += customerSell;

    const profit = customerSell - vendorCost - (p.vatAmount || 0) - (p.serviceFeeAmount || 0);
    totalNetProfit += profit;

    const st = p.status || 'Draft';
    if (!statusCounts[st]) statusCounts[st] = { count: 0, revenue: 0 };
    statusCounts[st].count++;
    statusCounts[st].revenue += customerSell;

    const tp = p.type || 'Standard';
    if (!typeRevenue[tp]) typeRevenue[tp] = { count: 0, revenue: 0, profit: 0 };
    typeRevenue[tp].count++;
    typeRevenue[tp].revenue += customerSell;
    typeRevenue[tp].profit += profit;
  });

  /* Customer paid */
  let customerPaid = 0;
  STORE.customers.forEach(c => {
    (c.payments || []).forEach(pm => {
      customerPaid += Math.max(0, Number(pm.amount || 0));
    });
  });
  STORE.packages.forEach(p => {
    const advance = getPackageAdvance(p);
    if (advance <= 0) return;
    let alreadyRecorded = false;
    STORE.customers.forEach(c => {
      if (alreadyRecorded) return;
      (c.payments || []).forEach(pm => {
        if (pm.packageId === p.id && pm.isAdvance) alreadyRecorded = true;
      });
    });
    if (!alreadyRecorded) customerPaid += advance;
  });
  const customerDue = Math.max(0, totalCustomerSell - customerPaid);

  /* Vendor paid */
  let vendorPaid = 0;
  STORE.vendors.forEach(v => {
    (v.payments || []).forEach(pm => {
      vendorPaid += Math.max(0, Number(pm.amount || 0));
    });
  });
  const vendorDue = Math.max(0, totalVendorCost - vendorPaid);
  const cashInHand = customerPaid - vendorPaid;
  const profitMargin = totalCustomerSell > 0 ? (totalNetProfit / totalCustomerSell) * 100 : 0;

  /* Profile */
  dbGetSetting('settings').then(s => {
    s = s || {};
    const name = s.userName || 'Admin';
    const role = s.userRole || 'Travel Agent';
    if ($('anProfileName')) $('anProfileName').textContent = name;
    if ($('anProfileRole')) $('anProfileRole').textContent = role;
    if ($('anAvatarImg') && s.userPicData) {
      $('anAvatarImg').src = s.userPicData;
      $('anAvatarImg').style.display = 'block';
      if ($('anAvatarFallback')) $('anAvatarFallback').style.display = 'none';
    } else {
      if ($('anAvatarImg')) $('anAvatarImg').style.display = 'none';
      if ($('anAvatarFallback')) {
        $('anAvatarFallback').style.display = 'flex';
        $('anAvatarFallback').textContent = name[0].toUpperCase();
      }
    }
  });

  /* KPIs */
  if ($('kpiGross')) $('kpiGross').textContent = fmt(totalCustomerSell);
  if ($('kpiNet')) $('kpiNet').textContent = fmt(totalNetProfit);
  if ($('kpiVendor')) $('kpiVendor').textContent = fmt(totalVendorCost);
  if ($('kpiPending')) $('kpiPending').textContent = fmt(totalPending);
  if ($('kpiCustomerPaid')) $('kpiCustomerPaid').textContent = fmt(customerPaid);
  if ($('kpiCustomerDue')) $('kpiCustomerDue').textContent = fmt(customerDue);
  if ($('kpiVendorPaid')) $('kpiVendorPaid').textContent = fmt(vendorPaid);
  if ($('kpiVendorDue')) $('kpiVendorDue').textContent = fmt(vendorDue);
  if ($('kpiVisaCost')) $('kpiVisaCost').textContent = fmt(totalVendorVisa);
  if ($('kpiCash')) $('kpiCash').textContent = fmt(cashInHand);
  if ($('kpiMargin')) $('kpiMargin').textContent = profitMargin.toFixed(1) + '%';

  /* Status list */
  const statusList = $('analyticsStatusList');
  if (statusList) {
    const entries = Object.entries(statusCounts);
    statusList.innerHTML = !entries.length
      ? '<div class="empty-slot"><span class="ic">📊</span>No data yet</div>'
      : entries.map(([s, d]) => `<div class="an-list-row"><span class="name">${esc(s)} (${d.count})</span><span class="val">${fmt(d.revenue)}</span></div>`).join('');
  }

  /* Type list */
  const typeList = $('analyticsTypeList');
  if (typeList) {
    const entries = Object.entries(typeRevenue);
    typeList.innerHTML = !entries.length
      ? '<div class="empty-slot"><span class="ic">🎯</span>No data yet</div>'
      : entries.map(([t, d]) => `<div class="an-list-row"><span class="name">${esc(t)} (${d.count})</span><span class="val">${fmt(d.revenue)} · +${fmt(d.profit)}</span></div>`).join('');
  }

  renderAnalyticsTable(activePackages);
  renderAnalyticsCharts(activePackages, statusCounts);
}

/* ==================== RENDER ANALYTICS TABLE ==================== */
function renderAnalyticsTable(activePackages) {
  const tbody = $('analyticsTableBody');
  if (!tbody) return;

  let filtered = activePackages.slice();
  if (analyticsFilterFrom) filtered = filtered.filter(p => (p.checkIn || p.start || p.createdAt) >= analyticsFilterFrom);
  if (analyticsFilterTo) filtered = filtered.filter(p => (p.checkIn || p.start || p.createdAt) <= analyticsFilterTo);

  if ($('anPkgCountBadge')) $('anPkgCountBadge').textContent = filtered.length + ' packages';

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:32px;color:var(--text-3)">No packages found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const customerSell = p.grandTotal || 0;
    const vendorCost = (p.vendorHotelCost || 0) + (p.vendorFlightCost || 0) +
                      (p.vendorTransportCost || 0) + (p.vendorServiceCost || 0) +
                      (p.vendorZiyarahCost || 0) + (p.vendorVisaCost || 0);
    const profit = customerSell - vendorCost - (p.vatAmount || 0) - (p.serviceFeeAmount || 0);
    const margin = customerSell > 0 ? ((profit / customerSell) * 100).toFixed(1) : '0.0';
    const cls = (p.status || 'draft').toLowerCase().replace(/\s+/g, '-');

    let received = getPackageAdvance(p);
    STORE.customers.forEach(c => {
      (c.payments || []).forEach(pm => {
        if (pm.packageId === p.id) received += Math.max(0, Number(pm.amount || 0));
      });
    });

    let vendorPaidPkg = 0;
    STORE.vendors.forEach(v => {
      (v.payments || []).forEach(pm => {
        if (pm.packageId === p.id) vendorPaidPkg += (pm.amount || 0);
      });
    });

    const due = Math.max(0, customerSell - received);
    const pkgDate = p.checkIn || p.start || (p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '—');

    return `<tr onclick="openFinancialDetail(${p.id})">
      <td><div class="cell-sub" style="color:var(--primary);font-weight:800">${esc(p.refNo || '—')}</div></td>
      <td><div class="cell-sub" style="font-weight:700">${esc(pkgDate)}</div></td>
      <td><div class="cell-main">${esc(p.name) || 'Untitled'}</div></td>
      <td>${esc(p.customerName) || '—'}</td>
      <td><span class="pill ${cls}"><span class="dot"></span>${esc(p.status || 'Draft')}</span></td>
      <td>${fmt(vendorCost)}</td>
      <td><strong>${fmt(customerSell)}</strong></td>
      <td style="color:var(--green);font-weight:700">${fmt(received)}</td>
      <td style="color:var(--red);font-weight:700">${fmt(vendorPaidPkg)}</td>
      <td style="color:${due > 0 ? 'var(--red)' : 'var(--green)'};font-weight:700">${fmt(due)}</td>
      <td style="color:var(--green);font-weight:700">${fmt(profit)}</td>
      <td style="color:var(--amber);font-weight:700">${margin}%</td>
      <td><button class="btn btn-xs btn-primary" onclick="event.stopPropagation();openFinancialDetail(${p.id})">👁️ View</button></td>
    </tr>`;
  }).join('');
}

/* ==================== FILTER HELPERS ==================== */
function filterFinancialSummary() {
  analyticsFilterFrom = $('finSummaryDateFrom')?.value || null;
  analyticsFilterTo = $('finSummaryDateTo')?.value || null;
  renderAnalytics();
  toast('🔍 Filter applied', 'info');
}

function clearFinancialFilter() {
  analyticsFilterFrom = null;
  analyticsFilterTo = null;
  if ($('finSummaryDateFrom')) $('finSummaryDateFrom').value = '';
  if ($('finSummaryDateTo')) $('finSummaryDateTo').value = '';
  renderAnalytics();
  toast('↻ Filter cleared', 'info');
}

/* ==================== RENDER ANALYTICS CHARTS ==================== */
function renderAnalyticsCharts(packages, statusCounts) {
  const isDark = document.body.classList.contains('dark');
  const gridColor = isDark ? '#27272a' : '#f0f0f2';
  const tickColor = isDark ? '#71717a' : '#a1a1aa';

  /* Revenue chart */
  const revCanvas = document.getElementById('analyticsRevenueChart');
  if (revCanvas) {
    if (window._anRevChart) window._anRevChart.destroy();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const revData = new Array(12).fill(0);
    packages.forEach(p => {
      const d = new Date(p.createdAt || 0);
      revData[d.getMonth()] += (p.grandTotal || 0);
    });

    const ctx = revCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 260);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#818cf8');

    window._anRevChart = new Chart(revCanvas, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Revenue',
          data: revData,
          backgroundColor: grad,
          borderRadius: 8,
          barThickness: 22
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#18181b',
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: { label: c => '৳ ' + c.parsed.y.toLocaleString() }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: tickColor, font: { size: 11, weight: '600' } },
            border: { display: false }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: tickColor,
              font: { size: 10, weight: '600' },
              callback: v => '৳' + (v >= 1000 ? (v / 1000) + 'k' : v)
            },
            border: { display: false },
            beginAtZero: true
          }
        }
      }
    });
  }

  /* Status donut chart */
  const statusCanvas = document.getElementById('analyticsStatusChart');
  if (statusCanvas) {
    if (window._anStatChart) window._anStatChart.destroy();

    const statusColors = {
      'Draft': '#a1a1aa',
      'Quoted': '#3b82f6',
      'Follow-up': '#a855f7',
      'Confirmed': '#22c55e',
      'Paid': '#16a34a',
      'Visa Processing': '#f59e0b',
      'Ticketed': '#0ea5e9',
      'Completed': '#f97316',
      'Cancelled': '#ef4444',
      'No Response': '#fb923c'
    };

    const labels = Object.keys(statusCounts);
    const data = labels.map(l => statusCounts[l].count);
    const colors = labels.map(l => statusColors[l] || '#94a3b8');

    window._anStatChart = new Chart(statusCanvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: data.length ? data : [1],
          backgroundColor: data.length ? colors : [gridColor],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        cutout: '70%',
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false
      }
    });

    const legendEl = $('analyticsStatusLegend');
    if (legendEl) {
      legendEl.innerHTML = labels.length
        ? labels.map((l, i) => `<div class="an-legend-row"><span class="name"><span class="an-legend-dot" style="background:${colors[i]}"></span>${esc(l)}</span><span class="val">${data[i]}</span></div>`).join('')
        : '<div style="text-align:center;color:var(--text-3);font-size:12px;padding:16px">No data</div>';
    }
  }
}

/* ==================== EXPORT EXCEL ==================== */
function exportAnalyticsExcel() {
  if (typeof XLSX === 'undefined') {
    toast('Excel library not loaded', 'error');
    return;
  }
  try {
    const packages = STORE.packages.filter(p => p.status !== 'Cancelled');
    if (!packages.length) {
      toast('No data to export', 'warning');
      return;
    }

    const rows = packages.map(p => {
      const customerSell = p.grandTotal || 0;
      const vendorCost = (p.vendorHotelCost || 0) + (p.vendorFlightCost || 0) +
                        (p.vendorTransportCost || 0) + (p.vendorServiceCost || 0) +
                        (p.vendorZiyarahCost || 0) + (p.vendorVisaCost || 0);
      const profit = customerSell - vendorCost - (p.vatAmount || 0) - (p.serviceFeeAmount || 0);
      const margin = customerSell > 0 ? ((profit / customerSell) * 100).toFixed(1) : '0.0';

      let received = getPackageAdvance(p);
      STORE.customers.forEach(c => {
        (c.payments || []).forEach(pm => {
          if (pm.packageId === p.id) received += Math.max(0, Number(pm.amount || 0));
        });
      });

      let vendorPaid = 0;
      STORE.vendors.forEach(v => {
        (v.payments || []).forEach(pm => {
          if (pm.packageId === p.id) vendorPaid += (pm.amount || 0);
        });
      });

      return {
        'Ref No': p.refNo || '',
        'Package Name': p.name || '',
        'Type': p.type || '',
        'Status': p.status || '',
        'Customer': p.customerName || '',
        'Phone': p.customerPhone || '',
        'Check In': formatDateForExcel(p.checkIn || p.start),
        'Check Out': formatDateForExcel(p.checkOut || p.end),
        'Nights': p.nights || 0,
        'Adults': p.paxAdult || 0,
        'Children': p.paxChild || 0,
        'Infants': p.paxInfant || 0,
        'Hotel Cost (Vendor)': p.vendorHotelCost || 0,
        'Flight Cost (Vendor)': p.vendorFlightCost || 0,
        'Transport Cost (Vendor)': p.vendorTransportCost || 0,
        'Visa Cost (Vendor)': p.vendorVisaCost || 0,
        'Ziyarah Cost (Vendor)': p.vendorZiyarahCost || 0,
        'Service Cost (Vendor)': p.vendorServiceCost || 0,
        'Total Vendor Cost': vendorCost,
        'Customer Sell': customerSell,
        'VAT': p.vatAmount || 0,
        'Service Fee': p.serviceFeeAmount || 0,
        'Customer Paid': received,
        'Customer Due': Math.max(0, customerSell - received),
        'Vendor Paid': vendorPaid,
        'Vendor Due': Math.max(0, vendorCost - vendorPaid),
        'Profit': profit,
        'Margin %': margin,
        'Per Person': p.perPerson || 0,
        'Created At': formatDateForExcel(p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '')
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Packages Analytics');
    const fn = `Umrah_Analytics_${today()}.xlsx`;
    XLSX.writeFile(wb, fn);
    toast('✅ Excel exported: ' + fn, 'success');
  } catch (e) {
    console.error(e);
    toast('Export failed: ' + e.message, 'error');
  }
}

/* ==================== IMPORT EXCEL ==================== */
async function importAnalyticsData(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    toast('Excel library not loaded', 'error');
    return;
  }
  if (!confirm('⚠️ এই operation পুরনো data replace করবে!\n\nContinue?')) {
    event.target.value = '';
    return;
  }

  showLoading('Importing data...');
  try {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    if (!rows.length) throw new Error('No data found');

    let imported = 0;
    for (const row of rows) {
      const refNo = row['Ref No'] || '';
      if (!refNo) continue;
      const existing = STORE.packages.find(p => p.refNo === refNo);
      if (!existing) continue;

      existing.vendorHotelCost = parseFloat(row['Hotel Cost (Vendor)']) || existing.vendorHotelCost;
      existing.vendorFlightCost = parseFloat(row['Flight Cost (Vendor)']) || existing.vendorFlightCost;
      existing.vendorTransportCost = parseFloat(row['Transport Cost (Vendor)']) || existing.vendorTransportCost;
      existing.vendorVisaCost = parseFloat(row['Visa Cost (Vendor)']) || existing.vendorVisaCost;
      existing.vendorZiyarahCost = parseFloat(row['Ziyarah Cost (Vendor)']) || existing.vendorZiyarahCost;
      existing.vendorServiceCost = parseFloat(row['Service Cost (Vendor)']) || existing.vendorServiceCost;
      existing.grandTotal = parseFloat(row['Customer Sell']) || existing.grandTotal;
      existing.updatedAt = Date.now();

      await dbSave(STORES.packages, existing);
      imported++;
    }

    STORE.packages = await dbGetAll(STORES.packages);
    hideLoading();
    event.target.value = '';
    renderAnalytics();
    toast(`✅ ${imported} package(s) updated`);
  } catch (e) {
    hideLoading();
    event.target.value = '';
    console.error(e);
    toast('Import failed: ' + e.message, 'error');
  }
}