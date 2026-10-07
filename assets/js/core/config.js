/* ============================================================
   UMRAH BUILDER — CORE / CONFIG
   Constants: DB info, STORES, Capacities
   ============================================================ */

const DB_NAME = 'UmrahBuilderPremium';
const DB_VERSION = 19;

const STORES = {
  makkahHotels: 'makkahHotels',
  madinahHotels: 'madinahHotels',
  flights: 'flights',
  transports: 'transports',
  visas: 'visas',
  ziyarah: 'ziyarah',
  services: 'services',
  packages: 'packages',
  customers: 'customers',
  vendors: 'vendors',
  payments: 'payments',
  followups: 'followups',
  images: 'images',
  settings: 'settings'
};

const VEHICLE_CAPACITY = {
  'Sedan': 4,
  '7-Seater': 7,
  'Hiace': 12,
  'GMC': 7,
  'Coaster': 22
};

const CAR_SEATERS = {
  sedan: { label: 'Sedan', seats: 4 },
  '7seater': { label: '7-Seater SUV', seats: 7 },
  hiace: { label: 'Hiace', seats: 12 },
  coaster: { label: 'Coaster', seats: 22 }
};

const ROOM_CAPACITY = {
  quad: 4,
  triple: 3,
  double: 2,
  single: 1
};