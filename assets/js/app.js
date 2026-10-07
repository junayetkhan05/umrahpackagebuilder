/* ============================================================
   UMRAH BUILDER — APP INIT
   Load DB + populate STORE + theme + badges + migration
   ============================================================ */

async function init() {
  try {
    /* 1. Open IndexedDB */
    await openDB();

    /* 2. Load all data stores in parallel */
    const [mk, md, f, t, v, z, sv, p, c, vend, pay, fu] = await Promise.all([
      dbGetAll(STORES.makkahHotels),
      dbGetAll(STORES.madinahHotels),
      dbGetAll(STORES.flights),
      dbGetAll(STORES.transports),
      dbGetAll(STORES.visas),
      dbGetAll(STORES.ziyarah),
      dbGetAll(STORES.services),
      dbGetAll(STORES.packages),
      dbGetAll(STORES.customers),
      dbGetAll(STORES.vendors),
      dbGetAll(STORES.payments),
      dbGetAll(STORES.followups)
    ]);

    /* 3. Populate STORE */
    STORE.makkahHotels = mk;
    STORE.madinahHotels = md;
    STORE.flights = f;
    STORE.transports = t;
    STORE.visas = v;
    STORE.ziyarah = z;
    STORE.services = sv;
    STORE.packages = p;
    STORE.customers = c;
    STORE.vendors = vend;
    STORE.payments = pay;
    STORE.followups = fu;

    /* 4. Load chat state + theme */
    loadChatState();
    await loadTheme();

    /* 5. Sidebar badges + dashboard + settings */
    updateSidebarBadges();
    await renderDashboard();
    await loadSettingsForm();

    /* 6. Data migration (async, doesn't block UI) */
    (async () => {
      /* Transport capacity fix */
      let transportFixed = 0;
      for (const t of STORE.transports) {
        const correctCap = VEHICLE_CAPACITY[t.vehicle];
        if (correctCap && t.capacity !== correctCap) {
          t.capacity = correctCap;
          t.updatedAt = Date.now();
          await dbSave(STORES.transports, t);
          transportFixed++;
        }
      }
      if (transportFixed > 0) {
        STORE.transports = await dbGetAll(STORES.transports);
      }

      /* Itinerary cleanup for old packages */
      let fixed = 0;
      for (const pkg of STORE.packages) {
        const sourceItinerary = Array.isArray(pkg.itinerary) ? pkg.itinerary : [];
        const seen = new Set();
        const cleanItin = [];

        sourceItinerary.forEach((it) => {
          const key = `${it.day}-${it.title || ''}-${it.description || ''}`;
          if (seen.has(key)) return;
          seen.add(key);
          const newIdx = cleanItin.length + 1;
          cleanItin.push({ ...it, id: newIdx, day: newIdx });
        });

        const maxDays = pkg.days || cleanItin.length;
        const capped = cleanItin.slice(0, maxDays);

        const cleanInclusions = dedupeTextItems(pkg.inclusions || []);
        const cleanExclusions = dedupeTextItems(pkg.exclusions || []);

        const changed =
          capped.length !== sourceItinerary.length ||
          cleanInclusions.length !== (pkg.inclusions || []).length ||
          cleanExclusions.length !== (pkg.exclusions || []).length;

        if (changed) {
          pkg.itinerary = capped;
          pkg.inclusions = cleanInclusions;
          pkg.exclusions = cleanExclusions;
          pkg.updatedAt = Date.now();
          await dbSave(STORES.packages, pkg);
          fixed++;
        }
      }
      if (fixed > 0) {
        STORE.packages = await dbGetAll(STORES.packages);
      }
    })();

    /* 7. Render packages list (in case user lands on packages page) */
    setTimeout(() => renderPackages(), 200);

    /* 8. Ready toast */
    toast('✅ Umrah Builder ready');
  } catch (e) {
    console.error('Init failed:', e);
    toast('Init failed: ' + e.message, 'error');
  }
}

/* ==================== START ==================== */
window.addEventListener('load', init);