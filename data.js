/**
 * SCHULZIEGEN — data.js (FINAL STABIL)
 */

// ================= STORAGE =================
const LS = {
  g: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  s: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} }
};

// ================= ADMIN =================
function hashPw(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return h.toString(36);
}

const ADMIN_PW_HASH = hashPw('ZiegenAdmin2025');

function isAdminLoggedIn() {
  return LS.g('sz_admin_session') === true;
}

function adminLogin(pw) {
  if (hashPw(pw) === ADMIN_PW_HASH) {
    LS.s('sz_admin_session', true);
    return true;
  }
  return false;
}

function adminLogout() {
  LS.del('sz_admin_session');
}

// ================= API =================
const API_BASE = 'https://ziegen-api.torstenbull.workers.dev';

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `API ${res.status}`);
  return data;
}

// ================= GOATS =================
function mapApiGoat(row) {
  return {
    id: row.id,
    name: row.name || '',
    nick: row.nickname || '',
    breed: row.breed || '',
    age: row.age || '',
    character: row.character || '',
    food: row.favorite_food || '',
    story: row.story || '',
    skill: row.special_skill || '',
    foto: row.main_image_url || '',
    photos: Array.isArray(row.photos) ? row.photos : [],
    e: '🐐'
  };
}

async function getGoatsFromApi() {
  const res = await fetch(`${API_BASE}/api/goats`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const rows = await res.json();
  return rows.map(mapApiGoat);
}

// ================= ADMIN GOATS =================
async function adminAddGoat(goat, pw) {
  return await apiRequest('/api/admin/goats', {
    method: 'POST',
    headers: { 'X-Admin-Password': pw },
    body: JSON.stringify(goat)
  });
}

async function adminDeleteGoat(id, pw) {
  return await apiRequest(`/api/admin/goats/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Password': pw }
  });
}

async function adminUpdateGoat(id, goat, pw) {
  return await apiRequest(`/api/admin/goats/${id}`, {
    method: 'PUT',
    headers: { 'X-Admin-Password': pw },
    body: JSON.stringify(goat)
  });
}

// ================= IMAGES =================
async function fetchGoatImages(goatId) {
  const res = await fetch(`${API_BASE}/api/goat-images?goat_id=${goatId}`);
  return await res.json();
}

async function adminUpdateGoatMainImage(id, url, pw) {
  return await apiRequest(`/api/admin/goats/${id}/main-image`, {
    method: 'PUT',
    headers: { 'X-Admin-Password': pw },
    body: JSON.stringify({ main_image_url: url })
  });
}

async function adminAddGoatImage(goatId, imageUrl, caption, pw) {
  return await apiRequest('/api/admin/goat-images', {
    method: 'POST',
    headers: { 'X-Admin-Password': pw },
    body: JSON.stringify({
      goat_id: goatId,
      image_url: imageUrl,
      caption: caption || ''
    })
  });
}

async function adminDeleteGoatImage(id, pw) {
  return await apiRequest(`/api/admin/goat-images/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Password': pw }
  });
}

// ================= LEADERBOARD =================
async function fetchLeaderboard() {
  const res = await fetch(`${API_BASE}/api/leaderboard`);
  return await res.json();
}

async function saveScore(name, score, pairs) {
  return await apiRequest('/api/leaderboard', {
    method: 'POST',
    body: JSON.stringify({
      player_name: name,
      score,
      pairs
    })
  });
}

async function adminResetLeaderboard(pw) {
  return await apiRequest('/api/admin/leaderboard/reset', {
    method: 'POST',
    headers: { 'X-Admin-Password': pw }
  });
}

// ================= VOTING =================
async function submitVote(goatId) {
  return await apiRequest('/api/votes', {
    method: 'POST',
    body: JSON.stringify({ goat_id: goatId })
  });
}

async function adminResetVotes(pw) {
  return await apiRequest('/api/admin/votes/reset', {
    method: 'POST',
    headers: { 'X-Admin-Password': pw }
  });
}

// ================= DARK MODE =================
function applyDark() {
  const dark = LS.g('sz_dark') || false;
  document.documentElement.toggleAttribute('data-dark', dark);
}

function toggleDark() {
  const dark = document.getElementById('dark-tog').checked;
  LS.s('sz_dark', dark);
  applyDark();
}

// ================= NAME =================
function getDisplayName() {
  let name = LS.g('sz_display_name');
  if (!name) {
    const animals = ['Ziegenfan','Herde','Meckerer','ZiegenProfi'];
    name = animals[Math.floor(Math.random() * animals.length)] + '_' + Math.floor(Math.random() * 99);
    LS.s('sz_display_name', name);
  }
  return name;
}

function setDisplayName(name) {
  LS.s('sz_display_name', name);
}