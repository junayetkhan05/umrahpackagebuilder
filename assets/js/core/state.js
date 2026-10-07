/* ============================================================
   UMRAH BUILDER — CORE / STATE
   Global STORE + Builder states + Module caches
   ============================================================ */

/* ==================== MAIN STORE ==================== */
const STORE = {
  makkahHotels: [],
  madinahHotels: [],
  flights: [],
  transports: [],
  visas: [],
  ziyarah: [],
  services: [],
  packages: [],
  customers: [],
  vendors: [],
  payments: [],
  followups: []
};

/* ==================== BUILDER STATE ==================== */
let makkahItems = [];
let madinahItems = [];
let flightItems = [];
let transportItems = [];
let visaItems = [];
let serviceItems = [];
let itineraryItems = [];
let inclusionsItems = [];
let exclusionsItems = [];
let importantNotesItems = [];
let paymentTermsItems = [];
let cancellationPolicyItems = [];
let ziyarahTransportItems = [];

/* ==================== COUNTERS ==================== */
let mC = 0, mdC = 0, fC = 0, tC = 0, vC = 0, sC = 0, itC = 0;
let incC = 0, excC = 0, noteC = 0, ptC = 0, cpC = 0, ztC = 0;
let hotelRoomCounter = 0;

/* ==================== BUILDER MODES ==================== */
let editingPackageId = null;
let currentViewPackageId = null;
let pkgSearchQuery = '';
let builderDefaultRoomSharing = 'double';

/* ==================== CHART INSTANCES ==================== */
let progressChartInstance = null;
let typeChartInstance = null;
let reportChart = null;
let reportTypeChart = null;
let perfChart = null;

/* ==================== ANALYTICS ==================== */
let analyticsFilterFrom = null;
let analyticsFilterTo = null;

/* ==================== FOLLOW-UP ==================== */
let currentFollowTab = 'package';

/* ==================== SEARCH ==================== */
let customerSearchQuery = '';
let vendorSearchQuery = '';

/* ==================== VENDOR ==================== */
let vendorItemCounter = 0;
let vendorItemsDraft = [];
let currentVendorType = 'hotel';
let currentViewVendorId = null;

/* ==================== ZIYARAH DRAFT ==================== */
let ziyarahPlacesDraft = [];
let ziyarahPlaceCounter = 0;

/* ==================== HOTEL IMAGES ==================== */
let hotelImgs = [null, null, null];

/* ==================== ITINERARY SORTABLE ==================== */
let itinerarySortable = null;

/* ==================== TASKS ==================== */
let tasksCache = [];
let currentTaskTab = 'all';

/* ==================== DOCUMENTS ==================== */
let docsCache = [];

/* ==================== EXPENSES ==================== */
let expensesCache = [];

/* ==================== EMPLOYEES ==================== */
let employeeDraft = [];

/* ==================== TEMPLATES ==================== */
const TEMPLATES = {
  economy: { name: 'Economy Umrah Package', type: 'Economy', nights: 6, days: 7, roomSharing: 'quad' },
  standard: { name: 'Standard Umrah Package', type: 'Standard', nights: 9, days: 10, roomSharing: 'triple' },
  premium: { name: 'Premium Umrah Package', type: 'Premium', nights: 11, days: 12, roomSharing: 'double' },
  ramadan: { name: 'Ramadan Special Umrah', type: 'Ramadan', nights: 14, days: 15, roomSharing: 'double' }
};

/* ==================== CHATBOT STATE ==================== */
let chatState = {
  step: null, mode: null, cities: [], star: null, nights: null,
  roomType: null, pax: null, meal: null, rooms: [], results: [],
  transportId: null, ziyarahId: null, pendingListCity: null, ziyarahPax: null
};

let chatbotHotelListState = {
  city: null, star: null, allHotels: [], visibleCount: 5, perPage: 5
};