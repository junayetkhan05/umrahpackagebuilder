/* ============================================================
   UMRAH BUILDER — PAGES / DASHBOARD
   renderDashboard + updateCharts
   ============================================================ */

/* ==================== RENDER DASHBOARD ==================== */
async function renderDashboard() {
  const setNum = (id, n) => {
    const e = $(id);
    if (e) e.textContent = n;
  };

  setNum('statPackages', STORE.packages.length);
  setNum('statCustomers', STORE.customers.length);

  // Total Due (from customers)
  let totalDue = 0;
  STORE.customers.forEach(c => {
    const t = getCustomerTotals(c);
    totalDue += t.due;
  });
  const dueEl = $('statDue');
  if (dueEl) dueEl.textContent = fmt(totalDue).replace('৳ ', '৳');

  // Total Received (customer payments + package advances not already recorded)
  let totalReceived = 0;
  STORE.customers.forEach(c => {
    (c.payments || []).forEach(p => {
      totalReceived += Math.max(0, Number(p.amount || 0));
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
    if (!alreadyRecorded) totalReceived += advance;
  });
  const revEl = $('statRevenue');
  if (revEl) revEl.textContent = fmt(totalReceived).replace('৳ ', '৳');

  // Recent packages
  const el = $('recentPackagesList');
  if (el) {
    const recent = STORE.packages.slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 5);

    if (!recent.length) {
      el.innerHTML = '<div class="empty-slot"><span class="ic">📦</span>No packages yet — Create your first!</div>';
    } else {
      el.innerHTML = recent.map(p => {
        const cls = (p.status || 'draft').toLowerCase().replace(/\s+/g, '-');
        return `<div class="pkg-row" onclick="viewPackage(${p.id})">
          <span class="pkg-row-dot ${cls}"></span>
          <div class="pkg-row-info">
            <h4>${esc(p.name) || 'Untitled'}</h4>
            <div class="meta">
              <span>${p.nights || 0}N / ${p.days || 0}D</span>
              <span>${p.paxAdult || 0} adults</span>
            </div>
          </div>
          <span class="pkg-row-badge ${cls}">${esc(p.status || 'Draft')}</span>
          <span class="pkg-row-price">${fmt(p.grandTotal)}</span>
        </div>`;
      }).join('');
    }
  }

  // Page title (greeting)
  const s = await dbGetSetting('settings') || {};
  const name = s.userName || 'Admin';
  if ($('pageTitle')) $('pageTitle').innerHTML = `Welcome back, <span>${esc(name)}!</span>`;

  updateCharts();
  updateSidebarBadges();
}

/* ==================== UPDATE CHARTS ==================== */
function updateCharts() {
  // Package type split
  const types = { Economy: 0, Standard: 0, Premium: 0, Ramadan: 0 };
  STORE.packages.forEach(p => {
    const t = p.type || 'Standard';
    if (types[t] !== undefined) types[t]++;
  });

  if ($('legendStandard')) $('legendStandard').textContent = types.Standard;
  if ($('legendEconomy')) $('legendEconomy').textContent = types.Economy;
  if ($('legendPremium')) $('legendPremium').textContent = types.Premium;
  if ($('legendRamadan')) $('legendRamadan').textContent = types.Ramadan;

  // Donut chart
  const donutEl = document.getElementById('typeChart');
  if (donutEl) {
    if (typeChartInstance) typeChartInstance.destroy();
    const total = Object.values(types).reduce((a, b) => a + b, 0);
    const isDark = document.body.classList.contains('dark');
    const emptyColor = isDark ? '#27272a' : '#f0f0f2';

    if (total === 0) {
      typeChartInstance = new Chart(donutEl, {
        type: 'doughnut',
        data: {
          labels: ['No Data'],
          datasets: [{ data: [1], backgroundColor: [emptyColor], borderWidth: 0 }]
        },
        options: {
          cutout: '72%',
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    } else {
      typeChartInstance = new Chart(donutEl, {
        type: 'doughnut',
        data: {
          labels: ['Standard', 'Economy', 'Premium', 'Ramadan'],
          datasets: [{
            data: [types.Standard, types.Economy, types.Premium, types.Ramadan],
            backgroundColor: ['#f97316', '#3b82f6', '#a855f7', '#22c55e'],
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          cutout: '72%',
          plugins: { legend: { display: false } },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  }

  // Progress chart (cumulative package creation over 30 days)
  const canvasEl = document.getElementById('progressChart');
  if (canvasEl) {
    if (progressChartInstance) progressChartInstance.destroy();

    const isDark = document.body.classList.contains('dark');
    const gridColor = isDark ? '#27272a' : '#f0f0f2';
    const tickColor = isDark ? '#71717a' : '#a1a1aa';

    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    const counts = days.map(d => {
      const start = new Date();
      start.setDate(start.getDate() - (30 - d));
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return STORE.packages.filter(p => {
        const c = new Date(p.createdAt || 0);
        return c >= start && c < end;
      }).length;
    });

    let cumulative = 0;
    const cumData = counts.map(c => { cumulative += c; return cumulative; });

    const ctx = canvasEl.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, 'rgba(249,115,22,.25)');
    grad.addColorStop(1, 'rgba(249,115,22,0)');

    progressChartInstance = new Chart(canvasEl, {
      type: 'line',
      data: {
        labels: days.map(d => (d === 1 || d % 5 === 0) ? d : ''),
        datasets: [{
          label: 'Total Packages',
          data: cumData,
          borderColor: '#f97316',
          backgroundColor: grad,
          borderWidth: 2.5,
          fill: true,
          tension: .35,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#f97316',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3
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
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: tickColor, font: { size: 10, weight: '600' } },
            border: { display: false }
          },
          y: {
            grid: { color: gridColor, drawBorder: false },
            ticks: { color: tickColor, font: { size: 10, weight: '600' }, padding: 8 },
            border: { display: false },
            beginAtZero: true
          }
        }
      }
    });
  }
}