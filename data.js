/**
 * SCHULZIEGEN — data.js
 * Gemeinsame Daten und Hilfsfunktionen für alle Seiten.
 * Diese Datei wird von jeder HTML-Seite eingebunden.
 */

// ══════════════════════════════════════════
// STORAGE HELPERS
// ══════════════════════════════════════════
const LS = {
  g: (k)    => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  s: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k)  => { try { localStorage.removeItem(k); } catch {} }
};

// ══════════════════════════════════════════
// ADMIN-AUTH
// ══════════════════════════════════════════
function hashPw(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return h.toString(36);
}

const ADMIN_PW_HASH = hashPw('ZiegenAdmin2025'); // Passwort hier ändern!

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

// ══════════════════════════════════════════
// BILDER-PFAD
// ══════════════════════════════════════════
// Alle Ziegenbilder liegen im Ordner "bilder/"
// Dateiname = Name der Ziege + .jpg  (z.B. bilder/Olaf.jpg)
// Falls ein Bild nicht gefunden wird, zeigt die App automatisch das Emoji.

const BILDER_ORDNER = '/OhmoorZiegen/bilder/';
const BILDER_ENDUNG = '.jpeg'; // Live-Bilder liegen aktuell als .jpeg vor

function ziegenbild(name) {
  return BILDER_ORDNER + name + BILDER_ENDUNG;
}


const API_BASE = 'https://ziegen-api.torstenbull.workers.dev';

function mapApiGoat(row) {
  return {
    id: row.id,
    name: row.name || '',
    nick: row.nickname || '',
    breed: row.breed || '',
    age: row.age || '',
    character: row.character || '',
    food: row.favorite_food || '',
    mother: row.mother_name || null,
    story: row.story || '',
    skill: row.special_skill || '',
    foto: row.main_image_url || ziegenbild(row.name || ''),
    photos: Array.isArray(row.photos) ? row.photos : [],
    votes: typeof row.votes === 'number' ? row.votes : 0,
    e: '🐐'
  };
}

async function getGoatsFromApi() {
  const res = await fetch(`${API_BASE}/api/goats`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const rows = await res.json();
  return rows.map(mapApiGoat);
}

// ══════════════════════════════════════════
// ZIEGEN-DATEN
// ══════════════════════════════════════════
const DEFAULT_GOATS = [
  { id:1, name:"Polli",   nick:"Der Müllschlucker", breed:"Mischlingsziege",  age:"4 Jahre", character:"Allesfresser, frech",        food:"Plastik & Papier (und alles andere!)",  mother:"Tom",  story:"Olaf hat einmal einen ganzen Schulaufsatz gefressen – und der Lehrer hat es geglaubt! Er frisst buchstäblich alles: Plastikflaschen, Papier, Taschentücher, sogar einen Stundenplan.", skill:"Kann jeden Mülleimer öffnen. Weltmeister im Papierschreddern.",           e:"🐐" },
  { id:2, name:"Pico",  nick:"Die Prinzessin",    breed:"Bunte Edelziege",  age:"6 Jahre", character:"Elegant, wählerisch",        food:"Nur Bio-Äpfel & frisches Gras",         mother:null,     story:"Bella ist die Älteste und weiß das genau. Sie lässt sich nur streicheln, wenn SIE es will. Bei Regen weigert sie sich hinauszugehen.",                                              skill:"Meisterin des selbstbewussten Blicks. Kann mit einem Augenaufschlag verzaubern.",   e:"🐐" },
  { id:3, name:"Paul", nick:"Der Ausreißer",     breed:"Toggenburger Mix", age:"3 Jahre", character:"Abenteuerlustig, frech",     food:"Alles aus dem Lehrergarten",            mother:"Pico",  story:"Flecki hat es schon dreimal geschafft, aus dem Gehege zu entkommen – einmal bis in die Schulküche! Seitdem wird das Schloss doppelt geprüft.",                                    skill:"Experte im Schlösserknacken. Kann jede Lücke im Zaun finden.",                     e:"🐐" },
  { id:4, name:"Tom",  nick:"Die Großmutter",    breed:"Weiße Hausziege",  age:"8 Jahre", character:"Gutmütig, geduldig",         food:"Weizenstroh & Möhren",                  mother:null,     story:"Berta ist so ruhig, dass sogar ängstliche Kinder sie streicheln. Sie hat schon drei Generationen von Schulkindern erlebt.",                                                      skill:"Kann ängstliche Kinder in 30 Sekunden beruhigen. Legende des Schulhofs.",          e:"🐐" },
  { id:5, name:"Else",  nick:"Der Philosoph",     breed:"Burenziege Mix",   age:"5 Jahre", character:"Nachdenklich, ruhig",        food:"Frisches Heu, gemütlich gekaut",        mother:null,     story:"Mecki steht oft stundenlang auf dem Hügel und schaut in die Ferne. Niemand weiß, ob er meditiert oder einfach schläft.",                                                         skill:"Meditationsmeister. Kann alle um ihn herum entspannen.",                           e:"🐐" },
  { id:6, name:"Pünktchen", nick:"Die Hüpferin",      breed:"Zwergziege",       age:"2 Jahre", character:"Wild, energiegeladen",       food:"Bananen, Äpfel – alles was hüpft",      mother:"Paul", story:"Hoppel springt über alles was ihr in den Weg kommt: Eimer, Kinder, manchmal sogar Mecki. Hochsprung-Rekord: 1,20 m!",                                                          skill:"Hält den Schulrekord im Ziegenhochsprung.",                                        e:"🐐" },
  { id:7, name:"Charlotta",   nick:"Die Diva",          breed:"Saanen-Mix",       age:"3 Jahre", character:"Laut, dramatisch, charmant", food:"Rosenblätter – notfalls auch Gras",     mother:"Pico",  story:"Zara meckert laut, wenn das Frühstück auch nur eine Minute zu spät kommt. Einmal hat sie eine ganze Schulstunde unterbrochen!",                                                  skill:"Lautestes Meckern der Schule. Kann Unterricht stoppen.",                           e:"🐐" },
  { id:8, name:"Balou",  nick:"Der Winzling",      breed:"Zwergziege",       age:"1 Jahr",  character:"Schüchtern, neugierig, süß", food:"Noch hauptsächlich Milch",              mother:"Charlotta",   story:"Knopf ist das jüngste Mitglied und versteckt sich hinter Berta, wenn zu viele Kinder kommen. Wenn er Mut fasst, ist er der neugierigste von allen!",                           skill:"Sieht dabei immer unwiderstehlich niedlich aus.",                                  e:"🐐" },
  { id:9, name:"Olaf",  nick:"Der Wächter",       breed:"Burenziege",       age:"4 Jahre", character:"Stark, dominant, schützend", food:"Viel – ist schließlich der Beschützer", mother:null,     story:"Sturm stellt sich zwischen die Herde und alles Verdächtige – ob Fremde, Krähen oder unbekannte Eimer. Die Herde vertraut ihm blind.",                                          skill:"Offizieller Wächter der Herde. Hat jeden verdächtigen Eimer verjagt.",            e:"🐐" },
];

// Ziegen laden (mit gespeicherten Änderungen aus localStorage)
function getGoats() {
  const stored = LS.g('sz_goats');
  if (stored && Array.isArray(stored) && stored.length > 0) return stored;
  // Beim ersten Aufruf: Standarddaten speichern
  const init = DEFAULT_GOATS.map(g => ({ ...g, foto: ziegenbild(g.name), photos: [], votes: 0 }));
  LS.s('sz_goats', init);
  return init;
}

function saveGoats(goats) {
  LS.s('sz_goats', goats);
}

// Einzelne Ziege per ID
function getGoatById(id) {
  return getGoats().find(g => g.id === parseInt(id)) || null;
}

// ══════════════════════════════════════════
// QUIZ-FRAGEN
// ══════════════════════════════════════════
const DEFAULT_QUIZ = [
  { q:"Welche Ziege frisst alles – auch Plastik und Papier?",       e:"🗑️", a:["Pico","Polli","Else","Olaf"],                              c:1 },
  { q:"Wer ist das älteste Mitglied der Herde?",                    e:"🎂", a:["Charlotta","Tom","Pico","Else"],                           c:1 },
  { q:"Wessen Tochter ist Paul?",                                   e:"👨‍👩‍👧", a:["Toms","Charlottas","Picos","Olafs"],                  c:2 },
  { q:"Welche Ziege hat dreimal das Gehege verlassen?",             e:"🏃", a:["Polli","Olaf","Paul","Pünktchen"],                         c:2 },
  { q:"Wer ist das jüngste Mitglied der Herde?",                   e:"🐣", a:["Pünktchen","Charlotta","Balou","Paul"],                    c:2 },
  { q:"Was ist die besondere Form der Ziegen-Pupillen?",            e:"👁️", a:["Rund","Oval","Rechteckig","Dreieckig"],                    c:2 },
  { q:"Wessen Tochter ist Balou?",                                  e:"👶", a:["Picos","Toms","Pauls","Charlottas"],                       c:3 },
  { q:"Welche Ziege hat den Unterricht unterbrochen?",              e:"📢", a:["Pico","Balou","Charlotta","Olaf"],                         c:2 },
  { q:"Wie hoch ist Pünktchens Hochsprung-Rekord?",                e:"🏆", a:["0,80 m","1,20 m","1,50 m","0,60 m"],                      c:1 },
  { q:"Welche Ziege steht stundenlang auf dem Hügel und schaut in die Ferne?", e:"🤔", a:["Tom","Else","Polli","Olaf"],                   c:1 },
];

function getQuiz() {
  const stored = LS.g('sz_quiz');
  return (stored && Array.isArray(stored) && stored.length > 0) ? stored : DEFAULT_QUIZ;
}

function saveQuiz(q) { LS.s('sz_quiz', q); }

// ══════════════════════════════════════════
// MEMORY CONFIG
// ══════════════════════════════════════════
function getMemConfig() {
  return LS.g('sz_memconfig') || { pairs: 6, mode: 'photo-emoji' };
}
function saveMemConfig(cfg) { LS.s('sz_memconfig', cfg); }

// ══════════════════════════════════════════
// RANGLISTE
// ══════════════════════════════════════════
function getScores() { return LS.g('sz_scores') || []; }

function saveScore(username, moves, pairs) {
  let scores = getScores();
  scores.push({ username, moves, pairs, date: new Date().toLocaleDateString('de') });
  scores.sort((a, b) => a.moves - b.moves || (b.pairs - a.pairs));
  LS.s('sz_scores', scores.slice(0, 50));
}

function clearScores() { LS.s('sz_scores', []); }

// ══════════════════════════════════════════
// ABSTIMMUNG
// ══════════════════════════════════════════
// Wir nutzen einen einfachen Browser-Fingerprint statt Login
function getVoterKey() {
  let key = LS.g('sz_voter_key');
  if (!key) {
    key = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    LS.s('sz_voter_key', key);
  }
  return key;
}

function getVotedId()   { return LS.g('sz_voted_' + getVoterKey()); }
function setVotedId(id) { LS.s('sz_voted_' + getVoterKey(), id); }

function resetAllVotes() {
  const goats = getGoats();
  goats.forEach(g => g.votes = 0);
  saveGoats(goats);
  // Alle Vote-Keys löschen
  Object.keys(localStorage)
    .filter(k => k.startsWith('sz_voted_'))
    .forEach(k => localStorage.removeItem(k));
}

// ══════════════════════════════════════════
// DARK MODE
// ══════════════════════════════════════════
function applyDark() {
  const dark = LS.g('sz_dark') || false;
  document.documentElement.toggleAttribute('data-dark', dark);
  const tog = document.getElementById('dark-tog');
  if (tog) tog.checked = dark;
}

function toggleDark() {
  const dark = document.getElementById('dark-tog').checked;
  LS.s('sz_dark', dark);
  applyDark();
}

// ══════════════════════════════════════════
// NAVIGATION — aktiven Tab markieren
// ══════════════════════════════════════════
function markActiveNav(pageId) {
  document.querySelectorAll('.nav-tab[data-page]').forEach(t => {
    t.classList.toggle('active', t.dataset.page === pageId);
  });
  document.querySelectorAll('.bottom-nav-item[data-page]').forEach(t => {
    t.classList.toggle('active', t.dataset.page === pageId);
  });
}

// ══════════════════════════════════════════
// FOTO-KARUSSEL (wiederverwendbar)
// ══════════════════════════════════════════
let _phIdx = 0;
let _phGoat = null;

function initCarousel(goat, containerId) {
  _phGoat = goat;
  _phIdx  = 0;
  renderCarousel(containerId);
}

function renderCarousel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const photos = _phGoat.photos || [];
  if (!photos.length) {
    container.innerHTML = `<div class="photo-slide" style="font-size:7rem;display:flex;align-items:center;justify-content:center;height:100%">${_phGoat.e}</div>`;
    return;
  }
  container.innerHTML = `
    <div class="photo-track" id="ph-track" style="transform:translateX(-${_phIdx * 100}%)">
      ${photos.map(s => `<div class="photo-slide"><img src="${s}" alt="${_phGoat.name}"></div>`).join('')}
    </div>
    ${photos.length > 1 ? `
      <button class="ph-nav l" onclick="carouselNav(-1)"${_phIdx === 0 ? ' disabled' : ''}>‹</button>
      <button class="ph-nav r" onclick="carouselNav(1)"${_phIdx >= photos.length - 1 ? ' disabled' : ''}>›</button>
      <div class="ph-dots">${photos.map((_, i) => `<button class="ph-dot${i === _phIdx ? ' on' : ''}" onclick="carouselGo(${i})"></button>`).join('')}</div>
    ` : ''}`;
}

function carouselNav(dir) {
  const photos = _phGoat.photos || [];
  _phIdx = Math.max(0, Math.min(photos.length - 1, _phIdx + dir));
  const track = document.getElementById('ph-track');
  if (track) track.style.transform = `translateX(-${_phIdx * 100}%)`;
}

function carouselGo(i) {
  _phIdx = i;
  const track = document.getElementById('ph-track');
  if (track) track.style.transform = `translateX(-${_phIdx * 100}%)`;
}

// ══════════════════════════════════════════
// HILFSFUNKTIONEN
// ══════════════════════════════════════════
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function goatPhotoOrEmoji(g, size='small') {
  // 1. Hochgeladene Fotos haben Vorrang
  if (g.photos && g.photos.length) {
    return `<img src="${g.photos[0]}" alt="${g.name}" loading="lazy">`;
  }
  // 2. Bild aus dem bilder/-Ordner (z.B. bilder/Olaf.jpg)
  if (g.foto) {
    return `<img src="${g.foto}" alt="${g.name}" loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='block'"><span style="display:none;font-size:${size === 'large' ? '5rem' : '2.2rem'}">${g.e}</span>`;
  }
  // 3. Fallback: Emoji
  const fs = size === 'large' ? '5rem' : '2.2rem';
  return `<span style="font-size:${fs}">${g.e}</span>`;
}

// Gibt Benutzernamen zurück (für Rangliste) — ohne Login einfach Gerätename
function getDisplayName() {
  let name = LS.g('sz_display_name');
  if (!name) {
    // Zufälligen Tiernamen vergeben
    const animals = ['Ziegenfan','Herdenkind','Meckerer','Hoppelfreund','BertaFan','OlafFan','HerdeHeld','ZiegenProfi'];
    name = animals[Math.floor(Math.random() * animals.length)] + '_' + Math.floor(Math.random() * 99 + 1);
    LS.s('sz_display_name', name);
  }
  return name;
}

function setDisplayName(name) { LS.s('sz_display_name', name); }
