/* ============================================================
   UMRAH BUILDER — CORE / DATABASE (Firebase Firestore)
   ============================================================ */

let db = null;

/* ==================== INIT ==================== */
async function openDB() {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const check = setInterval(() => {
      tries++;
      if (window.firebaseDB) {
        db = window.firebaseDB;
        clearInterval(check);
        console.log('✅ Firestore connected');
        resolve(db);
      }
      if (tries > 50) {
        clearInterval(check);
        reject(new Error('Firebase not loaded. Check your config.'));
      }
    }, 100);
  });
}

/* ==================== SAVE ==================== */
async function dbSave(storeName, data) {
  if (!db) throw new Error('DB not ready');
  const { doc, setDoc } = window.firebaseFns;
  const id = String(data.id);
  await setDoc(doc(db, storeName, id), data);
  return id;
}

/* ==================== GET ALL ==================== */
async function dbGetAll(storeName) {
  if (!db) throw new Error('DB not ready');
  const { collection, getDocs } = window.firebaseFns;
  const snapshot = await getDocs(collection(db, storeName));
  const arr = [];
  snapshot.forEach(doc => arr.push({ ...doc.data(), id: doc.data().id || doc.id }));
  return arr;
}

/* ==================== DELETE ==================== */
async function dbDelete(storeName, id) {
  if (!db) throw new Error('DB not ready');
  const { doc, deleteDoc } = window.firebaseFns;
  await deleteDoc(doc(db, storeName, String(id)));
}

/* ==================== SETTINGS ==================== */
async function dbSaveSetting(key, value) {
  if (!db) throw new Error('DB not ready');
  const { doc, setDoc } = window.firebaseFns;
  await setDoc(doc(db, 'settings', key), { key, value, savedAt: Date.now() });
}

async function dbGetSetting(key) {
  if (!db) throw new Error('DB not ready');
  const { doc, getDoc } = window.firebaseFns;
  const snap = await getDoc(doc(db, 'settings', key));
  if (snap.exists()) return snap.data().value;
  return undefined;
}

/* ==================== IMAGES ==================== */
async function dbSaveImage(id, blob) {
  if (!db) throw new Error('DB not ready');
  const { doc, setDoc } = window.firebaseFns;

  const base64 = await new Promise((res) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });

  await setDoc(doc(db, 'images', id), {
    id,
    base64,
    type: blob.type,
    size: blob.size,
    savedAt: Date.now()
  });
}

async function dbGetImage(id) {
  if (!db) throw new Error('DB not ready');
  const { doc, getDoc } = window.firebaseFns;
  const snap = await getDoc(doc(db, 'images', id));
  if (!snap.exists()) return null;

  const data = snap.data();
  const binary = atob(data.base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return { ...data, blob: new Blob([array], { type: data.type }) };
}