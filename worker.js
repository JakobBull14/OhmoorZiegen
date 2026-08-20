function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password"
    }
  });
}

function text(message, status = 200) {
  return new Response(message, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password"
    }
  });
}

function normalizeName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

function validatePlayerName(name) {
  const cleaned = normalizeName(name);
  if (cleaned.length < 3) return { ok: false, error: "Bitte mindestens 3 Zeichen eingeben." };
  if (cleaned.length > 16) return { ok: false, error: "Bitte höchstens 16 Zeichen verwenden." };
  if (!/^[a-zA-Z0-9äöüÄÖÜß _-]+$/.test(cleaned)) {
    return { ok: false, error: "Erlaubt sind Buchstaben, Zahlen, Leerzeichen, - und _." };
  }
  if (!/[a-zA-ZäöüÄÖÜß]/.test(cleaned)) {
    return { ok: false, error: "Der Name muss mindestens einen Buchstaben enthalten." };
  }
  return { ok: true, name: cleaned };
}

function formatDateLabel(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleDateString("de-DE") + " " + d.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(value);
  }
}

// SHA-256 hash (secure, used for all new passwords)
async function getAdminHash(raw) {
  const data = new TextEncoder().encode(raw);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Legacy Java-style hash – kept only for backward-compat login with old stored hashes
function getLegacyHash(raw) {
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

async function isAdmin(request, env) {
  const pw = request.headers.get("X-Admin-Password") || "";

  const row = await env.DB.prepare(`
    SELECT value
    FROM app_settings
    WHERE key = 'admin_password_hash'
    LIMIT 1
  `).first();

  const storedHash = row?.value || "";
  // Accept SHA-256 (new) or legacy hash (old DB entries — auto-upgrades on next password change)
  return (await getAdminHash(pw)) === storedHash || getLegacyHash(pw) === storedHash;
}

async function loadGoatPhotos(env) {
  const { results } = await env.DB.prepare(`
    SELECT goat_id, image_url
    FROM goat_images
    ORDER BY created_at ASC, id ASC
  `).all();
  const byGoat = new Map();
  for (const row of results || []) {
    if (!byGoat.has(row.goat_id)) byGoat.set(row.goat_id, []);
    byGoat.get(row.goat_id).push(row.image_url);
  }
  return byGoat;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

// ================= QUIZ =================
if (path === '/api/quiz' && request.method === 'GET') {
  const { results } = await env.DB.prepare(`
    SELECT id, question, option_a, option_b, option_c, option_d, correct_option
    FROM quiz_questions
    ORDER BY id
  `).all();

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// ================= QUIZ LEADERBOARD =================

// GET – Rangliste laden
if (path === '/api/quiz/leaderboard' && request.method === 'GET') {
  const { results } = await env.DB.prepare(`
    SELECT id, player_name, score, total, created_at
    FROM (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY player_name
          ORDER BY score DESC, created_at ASC
        ) as rn
      FROM quiz_leaderboard
    )
    WHERE rn = 1
    ORDER BY score DESC, created_at ASC
    LIMIT 50
  `).all();

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// POST – Ergebnis speichern
if (path === '/api/quiz/leaderboard' && request.method === 'POST') {
  const body = await request.json();

  const playerName = (body.player_name || '').trim();
  const score = Number(body.score);
  const total = Number(body.total);
  const deviceToken = (body.device_token || '').trim();

  if (!playerName || playerName.length < 3) {
    return new Response(JSON.stringify({ error: 'Ungültiger Name' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  if (!Number.isFinite(score) || !Number.isFinite(total)) {
    return new Response(JSON.stringify({ error: 'Ungültiger Score' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  await env.DB.prepare(`
    INSERT INTO quiz_leaderboard (player_name, score, total, device_token)
    VALUES (?, ?, ?, ?)
  `).bind(playerName, score, total, deviceToken || null).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// ================= ADMIN QUIZ ADD =================
if (path === '/api/admin/quiz' && request.method === 'POST') {
  if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);

  const body = await request.json();

  await env.DB.prepare(`
    INSERT INTO quiz_questions (
      question, option_a, option_b, option_c, option_d, correct_option
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    body.question || '',
    body.option_a || '',
    body.option_b || '',
    body.option_c || '',
    body.option_d || '',
    body.correct_option || 'A'
  ).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// ================= ADMIN QUIZ UPDATE =================
if (path.match(/^\/api\/admin\/quiz\/\d+$/) && request.method === 'PUT') {
  if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);

  const id = Number(path.split('/').pop());
  const body = await request.json();

  await env.DB.prepare(`
    UPDATE quiz_questions
    SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ?
    WHERE id = ?
  `).bind(
    body.question || '',
    body.option_a || '',
    body.option_b || '',
    body.option_c || '',
    body.option_d || '',
    body.correct_option || 'A',
    id
  ).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}


// ================= ADMIN QUIZ DELETE =================
// ================= ADMIN QUIZ LEADERBOARD DELETE =================
if (path.match(/^\/api\/admin\/quiz\/leaderboard\/(\d+)$/) && request.method === 'DELETE') {
  if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);

  const id = Number(path.split('/').pop());

  const row = await env.DB.prepare(`
    SELECT player_name
    FROM quiz_leaderboard
    WHERE id = ?
    LIMIT 1
  `).bind(id).first();

  if (!row) return json({ ok: true });

  await env.DB.prepare(`
    DELETE FROM quiz_leaderboard
    WHERE player_name = ?
  `).bind(row.player_name).run();

  return json({ ok: true });
}

// ================= ADMIN QUIZ LEADERBOARD RESET =================
if (path === "/api/admin/quiz/leaderboard/reset" && request.method === "POST") {
  if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);

  await env.DB.prepare("DELETE FROM quiz_leaderboard").run();
  await env.DB.prepare("DELETE FROM sqlite_sequence WHERE name = 'quiz_leaderboard'").run();

  return json({ ok: true });
}

if (path.match(/^\/api\/admin\/quiz\/\d+$/) && request.method === 'DELETE') {
   if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);

  const id = Number(path.split('/').pop());

  await env.DB.prepare(`
    DELETE FROM quiz_questions
    WHERE id = ?
  `).bind(id).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

    if (request.method === "OPTIONS") {
      return text("", 204);
    }

    try {
      // ================= FACTS =================
      if (path === '/api/facts' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT id, icon, title, content
          FROM facts
          WHERE is_active = 1
          ORDER BY id ASC
      `).all();

  return json(results || []);
}

// ================= ADMIN FACT ADD =================
if (path === '/api/admin/facts' && request.method === 'POST') {
  if (!await isAdmin(request, env)) {
    return json({ error: "Forbidden" }, 403);
  }

  const body = await request.json();

  await env.DB.prepare(`
    INSERT INTO facts (icon, title, content, is_active)
    VALUES (?, ?, ?, 1)
  `).bind(
    String(body.icon || '').trim(),
    String(body.title || '').trim(),
    String(body.content || '').trim()
  ).run();

  return json({ ok: true });
}

// ================= ADMIN FACT UPDATE & DELETE =================
const factAdminMatch = path.match(/^\/api\/admin\/facts\/(\d+)$/);

if (factAdminMatch && request.method === 'PUT') {
  if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);
  const id = Number(factAdminMatch[1]);
  const body = await request.json();
  await env.DB.prepare(`
    UPDATE facts SET icon = ?, title = ?, content = ? WHERE id = ?
  `).bind(
    String(body.icon || '').trim(),
    String(body.title || '').trim(),
    String(body.content || '').trim(),
    id
  ).run();
  return json({ ok: true });
}

if (factAdminMatch && request.method === 'DELETE') {
  if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);
  const id = Number(factAdminMatch[1]);
  await env.DB.prepare("DELETE FROM facts WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

// ================= FEEDBACK SUBMIT / UPDATE =================
if (path === '/api/feedback' && request.method === 'POST') {
  const body = await request.json();
  const playerName = String(body.player_name || '').trim();
  const deviceToken = String(body.device_token || '').trim();
  const rating = Number(body.rating);
  const feedbackText = String(body.text || '').trim();

  if (!playerName || playerName.length < 2) return json({ error: 'Name fehlt.' }, 400);
  if (!deviceToken) return json({ error: 'Gerät nicht identifizierbar.' }, 400);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: 'Ungültige Bewertung.' }, 400);

  const existing = await env.DB.prepare(
    'SELECT id FROM feedback WHERE device_token = ? LIMIT 1'
  ).bind(deviceToken).first();

  if (existing) {
    await env.DB.prepare(`
      UPDATE feedback SET player_name = ?, rating = ?, text = ?, created_at = CURRENT_TIMESTAMP
      WHERE device_token = ?
    `).bind(playerName, rating, feedbackText || null, deviceToken).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO feedback (player_name, device_token, rating, text) VALUES (?, ?, ?, ?)
    `).bind(playerName, deviceToken, rating, feedbackText || null).run();
  }
  return json({ ok: true });
}

// ================= FEEDBACK GET OWN =================
if (path === '/api/feedback/my' && request.method === 'POST') {
  const body = await request.json();
  const deviceToken = String(body.device_token || '').trim();
  if (!deviceToken) return json({ rating: null, text: null });
  const row = await env.DB.prepare(
    'SELECT rating, text FROM feedback WHERE device_token = ? LIMIT 1'
  ).bind(deviceToken).first();
  return json({ rating: row?.rating ?? null, text: row?.text ?? null });
}

// ================= ADMIN FEEDBACK LIST =================
if (path === '/api/admin/feedback' && request.method === 'GET') {
  if (!await isAdmin(request, env)) return json({ error: 'Forbidden' }, 403);
  const { results } = await env.DB.prepare(`
    SELECT id, player_name, rating, text, created_at
    FROM feedback
    ORDER BY created_at DESC
  `).all();
  return json(results || []);
}

// ================= ADMIN FEEDBACK DELETE =================
const feedbackAdminMatch = path.match(/^\/api\/admin\/feedback\/(\d+)$/);
if (feedbackAdminMatch && request.method === 'DELETE') {
  if (!await isAdmin(request, env)) return json({ error: 'Forbidden' }, 403);
  const id = Number(feedbackAdminMatch[1]);
  await env.DB.prepare('DELETE FROM feedback WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

      if (path === "/api/goats" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT g.*, p.name AS mother_name FROM goats g LEFT JOIN goats p ON p.id = g.mother_id ORDER BY g.id").all();
        const photosByGoat = await loadGoatPhotos(env);
        return json((results || []).map(row => ({ ...row, photos: photosByGoat.get(row.id) || [] })));
      }

      if (path === "/api/goat-images" && request.method === "GET") {
        const goatId = Number(url.searchParams.get("goat_id"));
        if (!goatId) return json([]);
        const { results } = await env.DB.prepare(`
          SELECT id, goat_id, image_url, caption, created_at
          FROM goat_images
          WHERE goat_id = ?
          ORDER BY created_at ASC, id ASC
        `).bind(goatId).all();
        return json(results || []);
      }

      if (path === "/api/votes/current" && request.method === "POST") {
        const body = await request.json();
        const deviceToken = String(body.device_token || "").trim();
        if (!deviceToken) return json({ goat_id: null });

        const { results } = await env.DB.prepare(
          "SELECT goat_id FROM votes WHERE device_token = ? LIMIT 1"
        ).bind(deviceToken).all();

        return json({ goat_id: results?.[0]?.goat_id ?? null });
      }

      if (path === "/api/votes/results" && request.method === "GET") {
        const { results } = await env.DB.prepare(`
          SELECT g.id, g.name, g.main_image_url,
                 COUNT(v.id) AS votes
          FROM goats g
          LEFT JOIN votes v ON v.goat_id = g.id
          GROUP BY g.id, g.name, g.main_image_url
          ORDER BY votes DESC, g.name ASC
        `).all();

        const total_votes = results.reduce((sum, row) => sum + Number(row.votes || 0), 0);

        return json({
          total_votes,
          results: results.map(r => ({
            id: r.id,
            name: r.name,
            main_image_url: r.main_image_url,
            votes: Number(r.votes || 0)
          }))
        });
      }

      if (path === "/api/votes" && request.method === "POST") {
        const body = await request.json();
        const goatId = Number(body.goat_id);
        const deviceToken = String(body.device_token || "").trim();

        if (!goatId || !deviceToken) {
          return json({ error: "Ungültige Abstimmung." }, 400);
        }

        const goatCheck = await env.DB.prepare(
          "SELECT id FROM goats WHERE id = ? LIMIT 1"
        ).bind(goatId).first();

        if (!goatCheck) {
          return json({ error: "Ziege nicht gefunden." }, 404);
        }

        const existing = await env.DB.prepare(
          "SELECT id FROM votes WHERE device_token = ? LIMIT 1"
        ).bind(deviceToken).first();

        if (existing) {
          await env.DB.prepare(
            "UPDATE votes SET goat_id = ?, created_at = CURRENT_TIMESTAMP WHERE device_token = ?"
          ).bind(goatId, deviceToken).run();
        } else {
          await env.DB.prepare(`
            INSERT INTO votes (goat_id, device_token) VALUES (?, ?)
            ON CONFLICT(device_token) DO UPDATE SET goat_id = excluded.goat_id
          `).bind(goatId, deviceToken).run();
        }

        return json({ ok: true, goat_id: goatId });
      }

      if (path === "/api/leaderboard" && request.method === "GET") {
        const { results } = await env.DB.prepare(`
          SELECT id, player_name, score, pairs, created_at
          FROM (
            SELECT
              id,
              player_name,
              score,
              pairs,
              created_at,
              ROW_NUMBER() OVER (
                PARTITION BY player_name
                ORDER BY score ASC, created_at ASC, id ASC
              ) AS rn
            FROM leaderboard
          )
          WHERE rn = 1
          ORDER BY score ASC, created_at ASC, id ASC
          LIMIT 50
        `).all();

  return json(results.map(r => ({
    ...r,
    score: Number(r.score || 0),
    pairs: r.pairs == null ? null : Number(r.pairs),
    date_label: formatDateLabel(r.created_at)
  })));
}

      if (path === "/api/leaderboard" && request.method === "POST") {
        const body = await request.json();
        const validation = validatePlayerName(body.player_name);
        if (!validation.ok) return json({ error: validation.error }, 400);

        const playerName = validation.name;
        const score = Number(body.score);
        const pairs = body.pairs == null ? null : Number(body.pairs);
        const deviceToken = String(body.device_token || "").trim();

        if (!Number.isFinite(score) || score <= 0) return json({ error: "Ungültiger Score." }, 400);
        if (pairs !== null && (!Number.isFinite(pairs) || pairs <= 0)) {
          return json({ error: "Ungültige Paar-Anzahl." }, 400);
        }

        const blocked = await env.DB.prepare(
          "SELECT term FROM blocked_names WHERE is_active = 1 OR is_active IS NULL"
        ).all();

        const lower = playerName.toLowerCase();
        for (const row of blocked.results || []) {
          const term = String(row.term || "").trim().toLowerCase();
          if (term && lower.includes(term)) {
            return json({ error: "Dieser Name ist nicht erlaubt." }, 400);
          }
        }

        await env.DB.prepare(`
          INSERT INTO leaderboard (player_name, score, pairs, device_token, created_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(playerName, score, pairs, deviceToken || null).run();

        return json({ ok: true });
      }

      if (path === "/api/admin/goats" && request.method === "POST") {
        if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);
        const body = await request.json();
        const name = normalizeName(body.name);
        if (!name) return json({ error: "Name fehlt." }, 400);

        const result = await env.DB.prepare(`
          INSERT INTO goats (name, nickname, breed, age, character, favorite_food, story, special_skill, main_image_url, deceased_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          name,
          String(body.nickname || "").trim(),
          String(body.breed || "").trim(),
          String(body.age || "").trim(),
          String(body.character || "").trim(),
          String(body.favorite_food || "").trim(),
          String(body.story || "").trim(),
          String(body.special_skill || "").trim(),
          String(body.main_image_url || "").trim(),
          body.deceased_date ? String(body.deceased_date).trim() : null
        ).run();

        return json({ ok: true, id: result.meta?.last_row_id || null });
      }

      if (path === "/api/admin/upload-image" && request.method === "POST") {
        if (!(await isAdmin(request, env))) return json({ error: "Forbidden" }, 403);

        const formData = await request.formData();
        const file = formData.get("file");
        const goatIdRaw = String(formData.get("goat_id") || "").trim();
        const caption = String(formData.get("caption") || "").trim();

        if (!file || typeof file === "string") {
          return json({ error: "Keine Datei empfangen." }, 400);
        }

        // Validate goatId is a safe positive integer (prevents path traversal in R2 key)
        const goatIdInt = parseInt(goatIdRaw, 10);
        if (!Number.isInteger(goatIdInt) || goatIdInt <= 0) {
          return json({ error: "Ungültige Ziegen-ID." }, 400);
        }

        const ext = file.name && file.name.includes(".")
          ? file.name.split(".").pop().toLowerCase()
          : "jpg";

        const ALLOWED_TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
        if (!ALLOWED_TYPES[ext]) {
          return json({ error: "Nur jpg, jpeg, png oder webp erlaubt." }, 400);
        }

        const skipGallery = formData.get("skip_gallery") === "true";

        // Server-side gallery slot limit (max 5 per goat)
        if (!skipGallery) {
          const { results: existingImgs } = await env.DB.prepare(
            "SELECT id FROM goat_images WHERE goat_id = ?"
          ).bind(goatIdInt).all();
          if ((existingImgs || []).length >= 5) {
            return json({ error: "Maximal 5 Galeriebilder pro Ziege erlaubt." }, 400);
          }
        }

        // Use server-determined content-type, never trust client-supplied value
        const key = `goats/${goatIdInt}/${Date.now()}.${ext}`;
        await env.ZIEGEN_BILDER.put(key, file.stream(), {
          httpMetadata: { contentType: ALLOWED_TYPES[ext] }
        });

        const publicUrl = `https://pub-78b8df31088d4faba7413d07037dbd2e.r2.dev/${key}`;

        if (!skipGallery) {
          await env.DB.prepare(`
            INSERT INTO goat_images (goat_id, image_url, caption)
            VALUES (?, ?, ?)
          `).bind(goatIdInt, publicUrl, caption).run();
        }

        return json({
          ok: true,
          image_url: publicUrl,
          caption
        });
      }

      const goatAdminMatch = path.match(/^\/api\/admin\/goats\/(\d+)$/);

      if (goatAdminMatch && request.method === "PUT") {
        if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);
        const id = Number(goatAdminMatch[1]);
        const body = await request.json();
        const name = normalizeName(body.name);
        if (!id) return json({ error: "Ungültige Ziegen-ID." }, 400);
        if (!name) return json({ error: "Name fehlt." }, 400);

        const existing = await env.DB.prepare("SELECT id FROM goats WHERE id = ? LIMIT 1").bind(id).first();
        if (!existing) return json({ error: "Ziege nicht gefunden." }, 404);

        await env.DB.prepare(`
          UPDATE goats
          SET name = ?, nickname = ?, breed = ?, age = ?, character = ?, favorite_food = ?, story = ?, special_skill = ?, mother_id = ?, main_image_url = ?, deceased_date = ?
          WHERE id = ?
        `).bind(
          name,
          String(body.nickname || "").trim(),
          String(body.breed || "").trim(),
          String(body.age || "").trim(),
          String(body.character || "").trim(),
          String(body.favorite_food || "").trim(),
          String(body.story || "").trim(),
          String(body.special_skill || "").trim(),
          body.mother_id ?? null,
          String(body.main_image_url || "").trim(),
          body.deceased_date ? String(body.deceased_date).trim() : null,
          id
        ).run();

        return json({ ok: true, id });
      }

      const goatMainImageMatch = path.match(/^\/api\/admin\/goats\/(\d+)\/main-image$/);
      if (goatMainImageMatch && request.method === "PUT") {
        if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);
        const id = Number(goatMainImageMatch[1]);
        const body = await request.json();
        await env.DB.prepare(`
          UPDATE goats SET main_image_url = ? WHERE id = ?
        `).bind(String(body.main_image_url || "").trim(), id).run();
        return json({ ok: true, id });
      }

      if (goatAdminMatch && request.method === "DELETE") {
        if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);
        const id = Number(goatAdminMatch[1]);
        await env.DB.prepare("DELETE FROM goats WHERE id = ?").bind(id).run();
        await env.DB.prepare("DELETE FROM votes WHERE goat_id = ?").bind(id).run();
        await env.DB.prepare("DELETE FROM goat_images WHERE goat_id = ?").bind(id).run();
        return json({ ok: true });
      }

      if (path === "/api/admin/goat-images" && request.method === "POST") {
        if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);
        const body = await request.json();
        const goatId = Number(body.goat_id);
        const imageUrl = String(body.image_url || "").trim();
        const caption = String(body.caption || "").trim();
        if (!goatId || !imageUrl) return json({ error: "Ziege und Bild-URL werden benötigt." }, 400);

        // Enforce max 5 gallery images per goat
        const { results: existingImgs } = await env.DB.prepare(
          "SELECT id FROM goat_images WHERE goat_id = ?"
        ).bind(goatId).all();
        if ((existingImgs || []).length >= 5) {
          return json({ error: "Maximal 5 Galeriebilder pro Ziege erlaubt." }, 400);
        }

        const result = await env.DB.prepare(`
          INSERT INTO goat_images (goat_id, image_url, caption)
          VALUES (?, ?, ?)
        `).bind(goatId, imageUrl, caption).run();
        return json({ ok: true, id: result.meta?.last_row_id || null });
      }

      const goatImageAdminMatch = path.match(/^\/api\/admin\/goat-images\/(\d+)$/);
      if (goatImageAdminMatch && request.method === "DELETE") {
        if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);
        const id = Number(goatImageAdminMatch[1]);
        await env.DB.prepare("DELETE FROM goat_images WHERE id = ?").bind(id).run();
        return json({ ok: true });
      }

      const delMatch = path.match(/^\/api\/admin\/leaderboard\/(\d+)$/);
      if (delMatch && request.method === "DELETE") {
        if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);
        const id = Number(delMatch[1]);
        await env.DB.prepare("DELETE FROM leaderboard WHERE id = ?").bind(id).run();
        return json({ ok: true });
      }

      if (path === "/api/admin/leaderboard/reset" && request.method === "POST") {
        if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);
        await env.DB.prepare("DELETE FROM leaderboard").run();
        await env.DB.prepare("DELETE FROM sqlite_sequence WHERE name = 'leaderboard'").run();
        return json({ ok: true });
      }

      if (path === "/api/admin/votes/reset" && request.method === "POST") {
        if (!await isAdmin(request, env)) return json({ error: "Forbidden" }, 403);
        await env.DB.prepare("DELETE FROM votes").run();
        await env.DB.prepare("DELETE FROM sqlite_sequence WHERE name = 'votes'").run();
        return json({ ok: true });
      }

      if (path === "/api/admin/verify" && request.method === "POST") {
        if (!(await isAdmin(request, env))) return json({ error: "Forbidden" }, 403);
        return json({ ok: true });
      }

      if (path === "/api/admin/password" && request.method === "POST") {
        if (!(await isAdmin(request, env))) return json({ error: "Forbidden" }, 403);

        const body = await request.json();
        const newPassword = String(body.new_password || "").trim();

        if (newPassword.length < 8) {
          return json({ error: "Das neue Passwort muss mindestens 8 Zeichen haben." }, 400);
        }

        // Always store as SHA-256 going forward (upgrades legacy hashes automatically)
        const newHash = await getAdminHash(newPassword);

        await env.DB.prepare(`
          INSERT INTO app_settings (key, value)
          VALUES ('admin_password_hash', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).bind(newHash).run();

        return json({ ok: true });
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err?.message || "Serverfehler" }, 500);
    }
  }
};
