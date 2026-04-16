const API_BASE = 'https://ziegen-api.torstenbull.workers.dev';

// ================= API BASIS =================
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
async function getGoatsFromApi() {
  const res = await fetch(`${API_BASE}/api/goats`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return await res.json();
}

// ================= ADMIN GOATS =================
async function adminAddGoat(goat, adminPassword) {
  return await apiRequest('/api/admin/goats', {
    method: 'POST',
    headers: { 'X-Admin-Password': adminPassword },
    body: JSON.stringify(goat)
  });
}

async function adminDeleteGoat(id, adminPassword) {
  return await apiRequest(`/api/admin/goats/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Password': adminPassword }
  });
}

async function adminUpdateGoat(id, goat, adminPassword) {
  return await apiRequest(`/api/admin/goats/${id}`, {
    method: 'PUT',
    headers: { 'X-Admin-Password': adminPassword },
    body: JSON.stringify(goat)
  });
}

// ================= BILDER =================
async function fetchGoatImages(goatId) {
  const res = await fetch(`${API_BASE}/api/goat-images?goat_id=${goatId}`);
  return await res.json();
}

async function adminUpdateGoatMainImage(id, url, adminPassword) {
  return await apiRequest(`/api/admin/goats/${id}/main-image`, {
    method: 'PUT',
    headers: { 'X-Admin-Password': adminPassword },
    body: JSON.stringify({ main_image_url: url })
  });
}

async function adminAddGoatImage(goatId, imageUrl, caption, adminPassword) {
  return await apiRequest('/api/admin/goat-images', {
    method: 'POST',
    headers: { 'X-Admin-Password': adminPassword },
    body: JSON.stringify({
      goat_id: goatId,
      image_url: imageUrl,
      caption: caption || ''
    })
  });
}

async function adminDeleteGoatImage(id, adminPassword) {
  return await apiRequest(`/api/admin/goat-images/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Password': adminPassword }
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

async function adminResetLeaderboard(adminPassword) {
  return await apiRequest('/api/admin/leaderboard/reset', {
    method: 'POST',
    headers: { 'X-Admin-Password': adminPassword }
  });
}

// ================= VOTING =================
async function submitVote(goatId) {
  return await apiRequest('/api/votes', {
    method: 'POST',
    body: JSON.stringify({ goat_id: goatId })
  });
}

async function adminResetVotes(adminPassword) {
  return await apiRequest('/api/admin/votes/reset', {
    method: 'POST',
    headers: { 'X-Admin-Password': adminPassword }
  });
}