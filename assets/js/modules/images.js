/* ============================================================
   UMRAH BUILDER — MODULES / IMAGES
   Hotel image upload, preview, save to IndexedDB
   ============================================================ */

/* hotelImgs declared in state.js */

function renderImageGrid(gridId, arr) {
  const g = $(gridId);
  if (!g) return;
  g.innerHTML = arr.map((item, i) => {
    const has = item && item.url;
    return `<div class="img-slot ${has ? 'filled' : ''}" onclick="document.getElementById('${gridId}_input_${i}').click()">
      ${has ? `<img src="${item.url}">` : `<div class="ph"><span class="ic">📷</span>Image ${i + 1}</div>`}
      ${has ? `<button class="rm" onclick="event.stopPropagation();removeImg('${gridId}',${i})">✕</button>` : ''}
      <input type="file" id="${gridId}_input_${i}" accept="image/*" onchange="handleImgUpload(event,'${gridId}',${i})">
    </div>`;
  }).join('');
}

function handleImgUpload(ev, gridId, index) {
  const file = ev.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    toast('ছবি 2MB এর কম হতে হবে', 'error');
    return;
  }
  if (!file.type.startsWith('image/')) {
    toast('শুধু ছবি', 'error');
    return;
  }
  const url = URL.createObjectURL(file);
  if (hotelImgs[index] && hotelImgs[index].url) URL.revokeObjectURL(hotelImgs[index].url);
  hotelImgs[index] = { file, url };
  renderImageGrid(gridId, hotelImgs);
}

function removeImg(gridId, index) {
  if (hotelImgs[index] && hotelImgs[index].url) URL.revokeObjectURL(hotelImgs[index].url);
  hotelImgs[index] = null;
  renderImageGrid(gridId, hotelImgs);
}

async function saveImagesForRecord(prefix, imgs) {
  const ids = [];
  for (let i = 0; i < imgs.length; i++) {
    const it = imgs[i];
    if (it && it.file) {
      const id = `${prefix}_${Date.now()}_${i}`;
      await dbSaveImage(id, it.file);
      ids.push(id);
    }
  }
  return ids;
}

async function getImageUrl(id) {
  try {
    const r = await dbGetImage(id);
    if (r && r.blob) return URL.createObjectURL(r.blob);
  } catch (e) {}
  return null;
}

async function getImageDataURL(id) {
  try {
    const r = await dbGetImage(id);
    if (r && r.blob) {
      return new Promise((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(r.blob);
      });
    }
  } catch (e) {}
  return null;
}