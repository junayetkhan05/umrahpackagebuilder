/* ============================================================
   UMRAH BUILDER — MODULES / NAVIGATION
   Page navigation + Sidebar badges + TITLES
   ============================================================ */

const TITLES = {
  dashboard: ['Welcome back, <span>Admin!</span>', 'Overview of your Umrah business'],
  analytics: ['Analytics', 'Financial summary & profit tracking'],
  packages: ['Packages', 'Manage all your Umrah packages'],
  followups: ['Follow-ups', 'Reminders & lead tracking'],
  makkah: ['Makkah Hotels', 'Premium hotels near Haram'],
  madinah: ['Madinah Hotels', 'Hotels near Masjid an-Nabawi'],
  flights: ['Flights', 'Manage flight routes'],
  transports: ['Transport Routes', 'Vehicle options for pilgrims'],
  visas: ['Visa Types', 'Visa processing options'],
  ziyarah: ['Ziyarah Tours', 'Master data · Auto-inject into itinerary'],
  services: ['Other Services', 'Additional services'],
  customers: ['Customers', 'Customer database & payment tracking'],
  vendors: ['Vendors', 'Vendor directory & payments'],
  reports: ['📊 Reports', 'Business overview & analytics'],
  accounts: ['💼 Accounts & Expenses', 'Track income, expense & profit'],
  performance: ['📈 Employee Performance', 'Team productivity & ranking'],
  tasks: ['✅ Tasks & To-Do', 'Team workflow management'],
  documents: ['📁 Documents', 'Customer & employee files'],
  settings: ['Settings', 'Company & preferences']
};

async function nav(page, el) {
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('act'));
  if (el) el.classList.add('act');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('act'));
  const pg = $('page-' + page);
  if (pg) pg.classList.add('act');

  const t = TITLES[page] || TITLES.dashboard;
  const s = await dbGetSetting('settings') || {};
  const name = s.userName || 'Admin';

  if (page === 'dashboard') {
    const pt = $('pageTitle');
    if (pt) pt.innerHTML = `Welcome back, <span>${esc(name)}!</span>`;
  } else {
    const pt = $('pageTitle');
    if (pt) pt.innerHTML = t[0];
  }
  const ps = $('pageSubtitle');
  if (ps) ps.textContent = t[1];

  // Route to page renderers
  if (page === 'dashboard') renderDashboard();
  if (page === 'analytics') renderAnalytics();
  if (page === 'packages') renderPackages();
  if (page === 'followups') renderFollowups();
  if (page === 'makkah') renderHotelsTable('makkah');
  if (page === 'madinah') renderHotelsTable('madinah');
  if (page === 'flights') renderFlightsTable();
  if (page === 'transports') renderTransportsTable();
  if (page === 'visas') renderVisasTable();
  if (page === 'ziyarah') renderZiyarahMasterPage();
  if (page === 'services') renderServicesTable();
  if (page === 'customers') renderCustomersTable();
  if (page === 'vendors') renderVendorsTable();
  if (page === 'settings') loadSettingsForm();

  // Business pages
  if (page === 'reports') renderReports();
  if (page === 'accounts') renderAccounts();
  if (page === 'performance') renderPerformance();
  if (page === 'tasks') renderTasks();
  if (page === 'documents') renderDocuments();
}

function updateSidebarBadges() {
  const set = (id, n) => {
    const e = $(id);
    if (e) e.textContent = n > 0 ? n : '';
  };

  set('navPkgCount', STORE.packages.length);
  set('navMakkahCount', STORE.makkahHotels.length);
  set('navMadinahCount', STORE.madinahHotels.length);
  set('navFlightCount', STORE.flights.length);
  set('navTransportCount', STORE.transports.length);
  set('navVisaCount', STORE.visas.length);
  set('navZiyarahCount', STORE.ziyarah.length);

  const todayStr = today();
  const duePkg = STORE.packages.filter(p =>
    p.followupDate && p.followupDate <= todayStr &&
    !['Confirmed','Paid','Travelled','Completed','Cancelled'].includes(p.status)
  ).length;
  const dueLead = STORE.followups.filter(f => f.date && f.date <= todayStr && !f.completed).length;
  set('navFollowCount', duePkg + dueLead);

  // Task badge (uses tasksCache if loaded)
  if (window.tasksCache) {
    const taskDue = window.tasksCache.filter(t => !t.completed && t.due && t.due <= todayStr).length;
    set('navTaskCount', taskDue);
  }
}