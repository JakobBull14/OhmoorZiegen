<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Schulziegen – Admin</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

<div id="nav-root"></div>

<main class="app-main">

  <!-- LOGIN-MASKE (wird ausgeblendet wenn eingeloggt) -->
  <div id="login-screen">
    <div style="max-width:360px;margin:0 auto">
      <div class="page-title">🔐 Admin-Login</div>
      <p class="section-sub">Dieser Bereich ist nur für Lehrerinnen und Lehrer.</p>
      <div class="form-group">
        <label class="form-label">Admin-Passwort</label>
        <input class="form-input" id="pw-input" type="password" placeholder="Passwort eingeben"
               onkeydown="if(event.key==='Enter')doLogin()">
      </div>
      <button class="btn-primary btn-primary-full" onclick="doLogin()">Anmelden</button>
      <div class="auth-msg" id="login-msg"></div>
      <div style="margin-top:16px;text-align:center">
        <a href="index.html" style="font-size:13px;color:var(--clr-blue)">← Zurück zur App</a>
      </div>
    </div>
  </div>

  <!-- ADMIN-INHALT (nur nach Login sichtbar) -->
  <div id="admin-screen" class="hidden">

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:10px">
      <div class="page-title" style="margin-bottom:0">🔐 Admin-Bereich</div>
      <button class="btn-danger" onclick="doLogout()">Abmelden</button>
    </div>

    <div class="admin-badge" style="margin-bottom:28px">
      ✓ Du bist als Admin angemeldet. Alle Ziegen-Texte und Fotos können direkt auf der Ziegen-Seite bearbeitet werden.
    </div>

    <div class="admin-wrap">

      <!-- ZIEGE HINZUFÜGEN -->
      <div class="admin-section">
        <div class="admin-section-title">➕ Neue Ziege hinzufügen</div>
        <div class="form-grid">
          <div class="f-group"><label>Name *</label><input id="a-name" placeholder="z.B. Frieda"></div>
          <div class="f-group"><label>Spitzname</label><input id="a-nick"></div>
          <div class="f-group"><label>Rasse</label><input id="a-breed" placeholder="z.B. Zwergziege"></div>
          <div class="f-group"><label>Alter</label><input id="a-age" placeholder="z.B. 3 Jahre"></div>
          <div class="f-group"><label>Charakter</label><input id="a-char"></div>
          <div class="f-group"><label>Lieblingsessen</label><input id="a-food"></div>
        </div>
        <div class="f-group" style="margin-top:12px">
          <label>Mutter</label>
          <select id="a-mother"></select>
        </div>
        <div class="f-group" style="margin-top:12px">
          <label>Geschichte</label>
          <textarea id="a-story" placeholder="Was macht diese Ziege besonders?"></textarea>
        </div>
        <div class="f-group" style="margin-top:12px">
          <label>Besondere Fähigkeit</label>
          <input id="a-skill">
        </div>
        <div class="btn-row">
          <button class="btn-primary" onclick="addGoat()">Ziege hinzufügen</button>
        </div>
        <div id="add-msg"></div>
      </div>

      <!-- ZIEGE ENTFERNEN -->
      <div class="admin-section">
        <div class="admin-section-title">🗑️ Ziege entfernen</div>
        <div class="f-group">
          <label>Ziege auswählen</label>
          <select id="del-sel"></select>
        </div>
        <div class="btn-row">
          <button class="btn-danger" onclick="removeGoat()">Ausgewählte Ziege entfernen</button>
        </div>
      </div>

      <!-- QUIZ-EDITOR -->
      <div class="admin-section">
        <div class="admin-section-title">🧠 Quiz-Fragen bearbeiten</div>
        <p class="section-sub">Änderungen werden automatisch gespeichert.</p>
        <div id="quiz-editor"></div>
        <button class="add-question-btn" onclick="addQuizQ()">+ Neue Frage hinzufügen</button>
      </div>

      <!-- MEMORY-EINSTELLUNGEN -->
      <div class="admin-section">
        <div class="admin-section-title">🃏 Memory-Einstellungen</div>
        <div class="mem-config">
          <div class="mem-config-row">
            <label>Anzahl Paare:</label>
            <select id="mem-pairs" class="form-input" style="width:auto" onchange="saveMemCfg()">
              ${[3,4,5,6,7,8,9].map(n => `<option value="${n}">${n} Paare</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="mem-msg"></div>
      </div>

      <!-- AKTIONEN -->
      <div class="admin-section">
        <div class="admin-section-title">⚙️ Weitere Aktionen</div>
        <div class="btn-row">
          <button class="btn-danger" onclick="doResetVotes()">Alle Abstimmungs-Stimmen zurücksetzen</button>
          <button class="btn-danger" onclick="doResetScores()">Rangliste leeren</button>
        </div>
      </div>

    </div>
  </div>
</main>

<script src="data.js"></script>
<script src="nav.js"></script>
<script>
buildNav('admin');

// ── LOGIN ──
function doLogin() {
  const pw = document.getElementById('pw-input').value;
  if (adminLogin(pw)) {
    showAdmin();
  } else {
    const msg = document.getElementById('login-msg');
    msg.textContent = 'Falsches Passwort.';
    msg.className = 'auth-msg err';
    document.getElementById('pw-input').value = '';
  }
}

function doLogout() {
  adminLogout();
  document.getElementById('admin-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

function showAdmin() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-screen').classList.remove('hidden');
  initAdminForms();
  renderQuizEditor();
  // Nav neu bauen (jetzt mit Admin-Link)
  buildNav('admin');
}

// Beim Laden prüfen
if (isAdminLoggedIn()) { showAdmin(); }

// ── FORMULARE INITIALISIEREN ──
function initAdminForms() {
  const goats = getGoats();
  const cfg   = getMemConfig();

  // Mutter-Select füllen
  const motherSel = document.getElementById('a-mother');
  motherSel.innerHTML = '<option value="">— Keine —</option>' +
    goats.map(g => `<option value="${g.name}">${g.name}</option>`).join('');

  // Löschen-Select füllen
  document.getElementById('del-sel').innerHTML =
    goats.map(g => `<option value="${g.id}">${g.name} – ${g.nick}</option>`).join('');

  // Memory-Paare
  document.getElementById('mem-pairs').value = cfg.pairs;
}

// ── ZIEGE HINZUFÜGEN ──
function addGoat() {
  const name = document.getElementById('a-name').value.trim();
  if (!name) { showMsg('add-msg', 'Name fehlt!', 'err'); return; }

  const goats = getGoats();
  const newId = Math.max(...goats.map(g => g.id), 0) + 1;

  goats.push({
    id:        newId,
    name,
    nick:      document.getElementById('a-nick').value.trim()  || name,
    breed:     document.getElementById('a-breed').value.trim() || 'Hausziege',
    age:       document.getElementById('a-age').value.trim()   || '?',
    character: document.getElementById('a-char').value.trim()  || '—',
    food:      document.getElementById('a-food').value.trim()  || '—',
    mother:    document.getElementById('a-mother').value       || null,
    story:     document.getElementById('a-story').value.trim() || '—',
    skill:     document.getElementById('a-skill').value.trim() || '—',
    photos: [], votes: 0, e: '🐐'
  });

  saveGoats(goats);
  showMsg('add-msg', `✓ ${name} wurde hinzugefügt!`, 'ok');
  ['a-name','a-nick','a-breed','a-age','a-char','a-food','a-story','a-skill'].forEach(id => {
    document.getElementById(id).value = '';
  });
  setTimeout(initAdminForms, 600);
}

// ── ZIEGE ENTFERNEN ──
function removeGoat() {
  const id = parseInt(document.getElementById('del-sel').value);
  const goats = getGoats();
  const g = goats.find(g => g.id === id);
  if (!g) return;
  if (!confirm(`"${g.name}" wirklich entfernen?`)) return;
  saveGoats(goats.filter(g => g.id !== id));
  initAdminForms();
}

// ── MEMORY ──
function saveMemCfg() {
  const pairs = parseInt(document.getElementById('mem-pairs').value);
  saveMemConfig({ pairs, mode: 'photo-emoji' });
  showMsg('mem-msg', 'Gespeichert!', 'ok');
  setTimeout(() => { document.getElementById('mem-msg').innerHTML = ''; }, 2000);
}

// ── QUIZ-EDITOR ──
function renderQuizEditor() {
  const qs = getQuiz();
  document.getElementById('quiz-editor').innerHTML = qs.map((q, qi) => `
    <div class="qe-item">
      <div class="qe-header">
        <span class="qe-question-text">${qi + 1}. ${escHtml(q.q)}</span>
        <button class="qe-delete" onclick="deleteQuizQ(${qi})">✕</button>
      </div>
      <div class="qe-body">
        <div class="qe-field">
          <label>Frage</label>
          <input value="${escHtml(q.q)}" onchange="updateQuizQ(${qi},'q',this.value)">
        </div>
        <div class="qe-field">
          <label>Emoji</label>
          <input value="${q.e}" onchange="updateQuizQ(${qi},'e',this.value)" style="width:80px">
        </div>
        <div class="qe-field">
          <label>Antworten (Kreis = richtige Antwort)</label>
          <div class="qe-answers-grid">
            ${q.a.map((a, ai) => `
              <div class="qe-answer-wrap">
                <span class="qe-answer-label">${String.fromCharCode(65 + ai)}:</span>
                <input value="${escHtml(a)}" onchange="updateQuizQ(${qi},'a${ai}',this.value)" style="flex:1">
                <input type="radio" name="correct_${qi}" value="${ai}"
                       ${q.c === ai ? 'checked' : ''}
                       onchange="updateQuizQ(${qi},'c',${ai})" title="Richtige Antwort">
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`).join('');
}

function updateQuizQ(qi, key, val) {
  const qs = getQuiz();
  if (key === 'q') qs[qi].q = val;
  else if (key === 'e') qs[qi].e = val;
  else if (key.startsWith('a')) qs[qi].a[parseInt(key[1])] = val;
  else if (key === 'c') qs[qi].c = parseInt(val);
  saveQuiz(qs);
}

function deleteQuizQ(qi) {
  if (!confirm('Frage löschen?')) return;
  const qs = getQuiz();
  qs.splice(qi, 1);
  saveQuiz(qs);
  renderQuizEditor();
}

function addQuizQ() {
  const qs = getQuiz();
  qs.push({ q:"Neue Frage?", e:"🐐", a:["Antwort A","Antwort B","Antwort C","Antwort D"], c:0 });
  saveQuiz(qs);
  renderQuizEditor();
  setTimeout(() => {
    const items = document.querySelectorAll('.qe-item');
    if (items.length) items[items.length - 1].scrollIntoView({ behavior:'smooth' });
  }, 100);
}

// ── WEITERE AKTIONEN ──
function doResetVotes() {
  if (!confirm('Alle Stimmen für "Ziege des Monats" zurücksetzen?')) return;
  resetAllVotes();
  alert('Stimmen wurden zurückgesetzt.');
}

function doResetScores() {
  if (!confirm('Rangliste wirklich leeren?')) return;
  clearScores();
  alert('Rangliste geleert.');
}

// ── HILFSFUNKTIONEN ──
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.innerHTML = `<div class="msg ${type}">${text}</div>`;
  setTimeout(() => el.innerHTML = '', 3000);
}
</script>
</body>
</html>
