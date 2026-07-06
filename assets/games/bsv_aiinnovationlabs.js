/* ════════════════════════════════════════════════════════════════
   AI INNOVATION LABS v1.0 — Bitstream Valley / Coinaverse
   Sort incoming data cards into the correct bins to train an AI.
   Drag/tap cards to bins. Level 1 (Learn) & Level 2 (Master).
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  let G = null, raf = null;

  /* ── Constants ─────────────────────────────────────────────── */
  const ACCENT = '#00FFFF';
  const GOLD   = '#FFD700';
  const BG     = '#03040c';

  /* Data card types */
  const CARD_TYPES = {
    correct: {
      id: 'correct',
      label: 'CORRECT DATA',
      icon: '✓',
      color: '#00e676',
      glow: '#00e676',
      bg: 'rgba(0,230,118,0.12)',
      border: '#00e676',
      bin: 'train',
      pts: 100,
      iqDelta: 8,
    },
    incorrect: {
      id: 'incorrect',
      label: 'INCORRECT DATA',
      icon: '✗',
      color: '#ff1744',
      glow: '#ff1744',
      bg: 'rgba(255,23,68,0.12)',
      border: '#ff1744',
      bin: 'discard',
      pts: 80,
      iqDelta: -10,
    },
    biased: {
      id: 'biased',
      label: 'BIASED DATA',
      icon: '⚠',
      color: '#FF6D00',
      glow: '#FF6D00',
      bg: 'rgba(255,109,0,0.12)',
      border: '#FF6D00',
      bin: 'discard',
      pts: 80,
      iqDelta: -12,
    },
    spam: {
      id: 'spam',
      label: 'SPAM',
      icon: '⊘',
      color: '#9E9E9E',
      glow: '#aaa',
      bg: 'rgba(158,158,158,0.1)',
      border: '#9E9E9E',
      bin: 'discard',
      pts: 60,
      iqDelta: -6,
    },
  };

  /* Level 1 card data — obvious labels, clear descriptions */
  const CARDS_L1 = [
    { type: 'correct',   title: 'Real user age: 28',          desc: 'Verified census record' },
    { type: 'correct',   title: 'Hospital record: diagnosed',  desc: 'Certified by physician' },
    { type: 'correct',   title: 'GDP 2024: $26.9T',           desc: 'World Bank data' },
    { type: 'correct',   title: 'Population: 8.1 billion',    desc: 'UN verified statistic' },
    { type: 'correct',   title: 'Temperature: 37.0°C',        desc: 'Lab-calibrated reading' },
    { type: 'incorrect', title: 'Moon made of cheese',        desc: 'Factually false claim' },
    { type: 'incorrect', title: 'Earth is flat',              desc: 'Debunked conspiracy' },
    { type: 'incorrect', title: 'Vaccines cause autism',      desc: 'Retracted false study' },
    { type: 'incorrect', title: '2+2=5',                      desc: 'Mathematical error' },
    { type: 'biased',    title: 'Only men are engineers',     desc: 'Gender stereotype' },
    { type: 'biased',    title: 'Poor people are lazy',       desc: 'Class-based prejudice' },
    { type: 'biased',    title: 'All teens are criminals',    desc: 'Age discrimination' },
    { type: 'spam',      title: 'WIN $1,000,000 NOW!!!',      desc: 'Promotional junk' },
    { type: 'spam',      title: 'Click here for free iPhone', desc: 'Clickbait content' },
    { type: 'spam',      title: 'asdf jkl; qwerty lol',      desc: 'Random keystrokes' },
  ];

  /* Level 2 card data — subtle, requires scrutiny */
  const CARDS_L2 = [
    { type: 'correct',   title: 'Avg salary: $58,260',        desc: 'BLS 2024 median wage' },
    { type: 'correct',   title: 'CO₂: 421 ppm (2024)',        desc: 'NOAA verified reading' },
    { type: 'correct',   title: 'Literacy rate: 86.3%',       desc: 'UNESCO global survey' },
    { type: 'correct',   title: 'Speed of light: 299,792 km/s', desc: 'Physical constant' },
    { type: 'incorrect', title: 'Avg salary: $5,826',         desc: 'Off by factor of 10' },
    { type: 'incorrect', title: 'CO₂: 42 ppm — declining',   desc: 'Wrong figure + trend' },
    { type: 'incorrect', title: 'Literacy rate: 98%',         desc: 'Vastly overstated' },
    { type: 'incorrect', title: 'Einstein failed math',       desc: 'Popular myth, false' },
    { type: 'biased',    title: 'Women are bad at coding',    desc: 'Gender bias marker ⚠' },
    { type: 'biased',    title: 'Elderly resist technology',  desc: 'Age-group stereotype ⚠' },
    { type: 'biased',    title: 'Crime stats: urban areas',   desc: 'Racially coded framing ⚠' },
    { type: 'biased',    title: 'Poor diet = moral failure',  desc: 'Socioeconomic bias ⚠' },
    { type: 'spam',      title: 'Top 10 AI secrets!!!',       desc: 'SEO bait, no substance' },
    { type: 'spam',      title: 'LOL haha random text xD',    desc: 'No informational value' },
    { type: 'spam',      title: 'Buy followers — real cheap', desc: 'Spam solicitation' },
  ];

  const LEVEL_CFG = [
    {
      level: 1,
      name: 'LEARN MODE',
      dur: 90,
      scoreGoal3: 1000,
      scoreGoal2: 600,
      iqWinThreshold: 75,
      iqLoseThreshold: 15,
      spawnInterval: 3200,   // ms between new cards
      maxOnScreen: 4,
      speedMultiplier: 1,
      cards: CARDS_L1,
    },
    {
      level: 2,
      name: 'MASTER MODE',
      dur: 90,
      scoreGoal3: 1600,
      scoreGoal2: 900,
      iqWinThreshold: 80,
      iqLoseThreshold: 10,
      spawnInterval: 2000,
      maxOnScreen: 6,
      speedMultiplier: 1,
      cards: CARDS_L2,
    },
  ];

  /* ── Helpers ────────────────────────────────────────────────── */
  function randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ── Screen registration ─────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};

  window.SCREENS.game_bsv_aiinnovationlabs = function () {
    G = null;
    setTimeout(initGame, 40);
    return `<div id="ailWrap" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:'Inter',sans-serif;color:#fff;user-select:none;touch-action:none">

      <!-- TOP BAR -->
      <div id="ailTop" style="position:absolute;top:0;left:0;right:0;z-index:30;display:flex;align-items:center;gap:8px;padding:10px 12px 8px;background:linear-gradient(180deg,rgba(3,4,12,.95) 60%,transparent)">
        <button id="ailBack" style="padding:5px 11px;border:1px solid rgba(0,255,255,.35);border-radius:7px;background:rgba(0,255,255,.08);color:${ACCENT};font-size:.52rem;letter-spacing:.12em;cursor:pointer;font-family:inherit;white-space:nowrap">← HUB</button>
        <div style="font-size:.54rem;letter-spacing:.2em;color:${ACCENT};flex:1;text-align:center;font-weight:800;text-shadow:0 0 12px ${ACCENT}">AI INNOVATION LABS</div>
        <div style="display:flex;gap:6px;align-items:center">
          <div style="text-align:right">
            <div style="font-size:.34rem;letter-spacing:.1em;color:rgba(255,255,255,.35)">SCORE</div>
            <div id="ailScore" style="font-size:.85rem;color:${GOLD};font-weight:900;font-family:'Orbitron',monospace;line-height:1">0</div>
          </div>
          <div style="width:1px;height:28px;background:rgba(255,255,255,.1)"></div>
          <div style="text-align:right">
            <div style="font-size:.34rem;letter-spacing:.1em;color:rgba(255,255,255,.35)">TIME</div>
            <div id="ailTimer" style="font-size:.85rem;color:${GOLD};font-weight:900;font-family:'Orbitron',monospace;line-height:1">90</div>
          </div>
        </div>
      </div>

      <!-- IQ METER ROW -->
      <div id="ailIQRow" style="position:absolute;top:52px;left:0;right:0;z-index:25;padding:0 12px 6px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="font-size:.38rem;letter-spacing:.14em;color:${ACCENT};white-space:nowrap;min-width:64px">AI INTEL</div>
          <div style="flex:1;height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;border:1px solid rgba(0,255,255,.15)">
            <div id="ailIQBar" style="height:100%;width:50%;background:linear-gradient(90deg,${ACCENT},#a78bfa);border-radius:4px;transition:width .2s ease"></div>
          </div>
          <div id="ailIQVal" style="font-size:.52rem;color:${ACCENT};font-weight:800;font-family:'Orbitron',monospace;min-width:34px;text-align:right">50</div>
        </div>
        <div id="ailLvBadge" style="font-size:.34rem;letter-spacing:.18em;color:rgba(0,255,255,.45);text-align:center;margin-top:2px">LEVEL 1 — LEARN MODE</div>
      </div>

      <!-- BINS AREA (bottom) -->
      <div id="ailBins" style="position:absolute;bottom:0;left:0;right:0;z-index:25;display:flex;gap:8px;padding:8px 10px 10px">
        <!-- TRAIN bin (left) -->
        <div id="bin_train" class="ailBin" style="flex:1;border:2px dashed rgba(0,230,118,.4);border-radius:12px;min-height:70px;background:rgba(0,230,118,.04);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:border-color .15s,background .15s">
          <div style="font-size:1.2rem">🤖</div>
          <div style="font-size:.38rem;letter-spacing:.14em;color:#00e676;font-weight:700">TRAIN AI</div>
          <div style="font-size:.3rem;color:rgba(255,255,255,.3)">Correct data only</div>
        </div>
        <!-- DISCARD bin (right) -->
        <div id="bin_discard" class="ailBin" style="flex:1;border:2px dashed rgba(255,100,100,.3);border-radius:12px;min-height:70px;background:rgba(255,23,68,.04);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:border-color .15s,background .15s">
          <div style="font-size:1.2rem">🗑</div>
          <div style="font-size:.38rem;letter-spacing:.14em;color:#ff6e6e;font-weight:700">DISCARD</div>
          <div style="font-size:.3rem;color:rgba(255,255,255,.3)">Bad / biased / spam</div>
        </div>
      </div>

      <!-- CARD STREAM AREA -->
      <div id="ailStream" style="position:absolute;top:90px;left:0;right:0;bottom:98px;z-index:20;overflow:hidden"></div>

      <!-- PARTICLE LAYER -->
      <canvas id="ailPfx" style="position:absolute;inset:0;z-index:22;pointer-events:none;width:100%;height:100%"></canvas>

      <!-- FLASH OVERLAY -->
      <div id="ailFlash" style="position:absolute;inset:0;z-index:28;pointer-events:none;opacity:0;transition:opacity .08s"></div>

      <!-- LEVEL SELECT OVERLAY -->
      <div id="ailLevelSel" style="position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 20%,rgba(0,255,255,.06),${BG} 70%);gap:16px;padding:24px">
        <div style="font-size:.38rem;letter-spacing:.25em;color:rgba(0,255,255,.5)">BITSTREAM VALLEY</div>
        <div style="font-size:1.3rem;font-weight:900;letter-spacing:.1em;color:${ACCENT};text-shadow:0 0 30px ${ACCENT};text-align:center;line-height:1.2">AI INNOVATION<br>LABS</div>
        <div style="width:48px;height:2px;background:linear-gradient(90deg,transparent,${ACCENT},transparent)"></div>
        <div style="font-size:.48rem;letter-spacing:.1em;color:rgba(255,255,255,.45);text-align:center;max-width:300px;line-height:1.8">
          Sort incoming data cards into bins.<br>
          Feed the AI only <span style="color:#00e676">accurate data</span> — reject everything else.
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:320px">
          <button class="ailLvBtn" data-lv="0" style="width:100%;padding:14px 18px;border:1px solid ${ACCENT};border-radius:10px;background:rgba(0,255,255,.07);color:${ACCENT};font-size:.6rem;letter-spacing:.12em;cursor:pointer;font-weight:700;text-align:left">
            ⚡ LEVEL 1 &mdash; LEARN MODE
            <div style="font-size:.44rem;color:rgba(255,255,255,.4);font-weight:400;margin-top:3px;letter-spacing:.06em">Clearly labeled cards &bull; Slow pace &bull; 90 seconds</div>
          </button>
          <button class="ailLvBtn" data-lv="1" style="width:100%;padding:14px 18px;border:1px solid ${GOLD};border-radius:10px;background:rgba(255,215,0,.06);color:${GOLD};font-size:.6rem;letter-spacing:.12em;cursor:pointer;font-weight:700;text-align:left">
            🔥 LEVEL 2 &mdash; MASTER MODE
            <div style="font-size:.44rem;color:rgba(255,255,255,.4);font-weight:400;margin-top:3px;letter-spacing:.06em">Subtle bias markers &bull; Fast flow &bull; 90 seconds</div>
          </button>
        </div>
        <div style="font-size:.35rem;letter-spacing:.1em;color:rgba(255,255,255,.25);text-align:center;line-height:1.9">
          DRAG or TAP cards to the correct bin<br>↓ swipe on mobile
        </div>
      </div>

      <!-- END OVERLAY -->
      <div id="ailOver" style="position:absolute;inset:0;z-index:50;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(3,4,12,.93);backdrop-filter:blur(10px);gap:14px;padding:24px"></div>
    </div>`;
  };

  /* ── EXIT ────────────────────────────────────────────────────── */
  window.bsv_aiinnovationlabsExit = function () {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (G && G._evClean) G._evClean.forEach(fn => fn());
    G = null;
    if (window.state) state.viewingWorld = 'builder';
    if (window.goTo) goTo('hub');
  };

  /* ── INIT ────────────────────────────────────────────────────── */
  function initGame() {
    const wrap = document.getElementById('ailWrap');
    if (!wrap) return;

    const backBtn = document.getElementById('ailBack');
    if (backBtn) backBtn.addEventListener('click', window.bsv_aiinnovationlabsExit);

    wrap.querySelectorAll('.ailLvBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lv = parseInt(btn.dataset.lv, 10);
        document.getElementById('ailLevelSel').style.display = 'none';
        startLevel(lv);
      });
    });
  }

  /* ── GAME STATE ─────────────────────────────────────────────── */
  function makeGame(lvIdx) {
    const cfg = LEVEL_CFG[lvIdx];
    return {
      phase: 'play',
      lvIdx,
      cfg,
      score: 0,
      iq: 50,        // 0–100
      correct: 0,
      mistakes: 0,
      total: 0,
      timeLeft: cfg.dur,
      lastSpawn: 0,
      cards: [],       // active card DOM elements + data
      cardIdSeq: 0,
      particles: [],   // canvas particle effects
      last: performance.now(),
      _evClean: [],
    };
  }

  /* ── START LEVEL ─────────────────────────────────────────────── */
  function startLevel(lvIdx) {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (G && G._evClean) G._evClean.forEach(fn => fn());

    G = makeGame(lvIdx);
    const cfg = G.cfg;

    // Setup HUD
    const badge = document.getElementById('ailLvBadge');
    if (badge) badge.textContent = `LEVEL ${cfg.level} — ${cfg.name}`;
    updateHUD();

    // Particle canvas
    const pfx = document.getElementById('ailPfx');
    if (pfx) {
      pfx.width = pfx.clientWidth * devicePixelRatio;
      pfx.height = pfx.clientHeight * devicePixelRatio;
    }

    // Keyboard
    function onKey(e) {
      // No keyboard sorting in this game; dismiss optional
    }
    document.addEventListener('keydown', onKey);
    G._evClean.push(() => document.removeEventListener('keydown', onKey));

    // Bin highlight on drag-over (mouse)
    const binTrain   = document.getElementById('bin_train');
    const binDiscard = document.getElementById('bin_discard');
    [binTrain, binDiscard].forEach(bin => {
      if (!bin) return;
      function over(e) { e.preventDefault(); highlightBin(bin.id, true); }
      function out()   { highlightBin(bin.id, false); }
      function drop(e) {
        e.preventDefault();
        highlightBin(bin.id, false);
        const cardId = e.dataTransfer && e.dataTransfer.getData('cardId');
        if (cardId) handleDrop(cardId, bin.id === 'bin_train' ? 'train' : 'discard');
      }
      bin.addEventListener('dragover', over);
      bin.addEventListener('dragleave', out);
      bin.addEventListener('drop', drop);
      G._evClean.push(() => {
        bin.removeEventListener('dragover', over);
        bin.removeEventListener('dragleave', out);
        bin.removeEventListener('drop', drop);
      });
    });

    G.last = performance.now();
    G.lastSpawn = -cfg.spawnInterval; // spawn first card immediately
    raf = requestAnimationFrame(loop);
  }

  /* ── MAIN LOOP ───────────────────────────────────────────────── */
  function loop(now) {
    if (!G || G.phase !== 'play') return;
    const dt = Math.min(now - G.last, 100);
    G.last = now;

    G.timeLeft -= dt / 1000;
    if (G.timeLeft <= 0) {
      G.timeLeft = 0;
      finishGame();
      return;
    }

    // Spawn cards
    const timeSinceSpawn = now - G.lastSpawn;
    if (timeSinceSpawn >= G.cfg.spawnInterval && G.cards.length < G.cfg.maxOnScreen) {
      spawnCard();
      G.lastSpawn = now;
    }

    // Animate particles
    updateParticles(dt);

    updateHUD();
    raf = requestAnimationFrame(loop);
  }

  /* ── HUD ─────────────────────────────────────────────────────── */
  function updateHUD() {
    if (!G) return;
    const sc = document.getElementById('ailScore');
    if (sc) sc.textContent = G.score;
    const tm = document.getElementById('ailTimer');
    if (tm) {
      const s = Math.ceil(G.timeLeft);
      tm.textContent = s;
      tm.style.color = s <= 10 ? '#ff4444' : GOLD;
    }
    const iqBar = document.getElementById('ailIQBar');
    const iqVal = document.getElementById('ailIQVal');
    const iq = Math.round(clamp(G.iq, 0, 100));
    if (iqBar) {
      iqBar.style.width = iq + '%';
      const pct = iq / 100;
      const r = Math.round(lerp(255, 0, pct));
      const g = Math.round(lerp(23, 255, pct));
      const b = Math.round(lerp(68, 255, pct));
      iqBar.style.background = `linear-gradient(90deg,rgb(${r},${g},${b}),#a78bfa)`;
    }
    if (iqVal) iqVal.textContent = iq;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── CARD SPAWN ──────────────────────────────────────────────── */
  function spawnCard() {
    const stream = document.getElementById('ailStream');
    if (!stream) return;

    // Pick a weighted card
    const pool = G.cfg.cards;
    const rawData = pick(pool);
    const typeInfo = CARD_TYPES[rawData.type];

    const id = 'ail_card_' + (G.cardIdSeq++);
    const streamW = stream.clientWidth;
    const streamH = stream.clientHeight;

    // Grid-based positioning: find an open slot
    const cols = 2;
    const rows = Math.ceil(G.cfg.maxOnScreen / cols);
    const col = G.cardIdSeq % cols;
    const row = Math.floor(G.cardIdSeq / cols) % rows;
    const cardW = Math.floor((streamW - 30) / cols);
    const cardH = Math.min(120, Math.floor((streamH - 20) / rows) - 8);
    const x = 10 + col * (cardW + 10);
    const y = 8 + row * (cardH + 8);

    // Create card DOM
    const div = document.createElement('div');
    div.id = id;
    div.setAttribute('draggable', 'true');
    div.style.cssText = `
      position:absolute;
      left:${x}px; top:${y}px;
      width:${cardW}px; height:${cardH}px;
      background:${typeInfo.bg};
      border:1.5px solid ${typeInfo.border};
      border-radius:10px;
      box-shadow:0 0 14px ${typeInfo.glow}44, inset 0 0 20px rgba(0,0,0,.3);
      display:flex; flex-direction:column; justify-content:center; align-items:center; gap:4px;
      cursor:grab;
      transform:translateY(-20px) scale(.95);
      opacity:0;
      transition:transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s ease, box-shadow .15s;
      overflow:hidden;
      touch-action:none;
    `;

    div.innerHTML = `
      <div style="font-size:1.5rem;filter:drop-shadow(0 0 6px ${typeInfo.glow})">${typeInfo.icon}</div>
      <div style="font-size:.42rem;letter-spacing:.16em;color:${typeInfo.color};font-weight:800;text-align:center;padding:0 6px">${typeInfo.label}</div>
      <div style="font-size:.52rem;font-weight:700;text-align:center;padding:0 6px;color:rgba(255,255,255,.9);line-height:1.3">${rawData.title}</div>
      <div style="font-size:.38rem;text-align:center;color:rgba(255,255,255,.45);padding:0 8px;line-height:1.4">${rawData.desc}</div>
      <div style="position:absolute;bottom:5px;right:7px;font-size:.3rem;letter-spacing:.12em;color:rgba(255,255,255,.2)">${rawData.type.toUpperCase()}</div>
    `;

    stream.appendChild(div);

    // Animate in
    requestAnimationFrame(() => {
      div.style.transform = 'translateY(0) scale(1)';
      div.style.opacity = '1';
    });

    // Register in state
    const cardData = { id, el: div, type: rawData.type, typeInfo, x, y, cardW, cardH };
    G.cards.push(cardData);

    // --- DRAG (mouse) ---
    div.addEventListener('dragstart', e => {
      e.dataTransfer.setData('cardId', id);
      div.style.opacity = '0.5';
    });
    div.addEventListener('dragend', () => {
      div.style.opacity = '1';
    });

    // --- TOUCH DRAG ---
    let touchOriginX = 0, touchOriginY = 0;
    let ghost = null;

    div.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      touchOriginX = t.clientX;
      touchOriginY = t.clientY;
      div.style.transform = 'scale(1.05)';
      div.style.boxShadow = `0 0 28px ${typeInfo.glow}99, inset 0 0 20px rgba(0,0,0,.3)`;
      div.style.zIndex = '99';
    }, { passive: false });

    div.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - touchOriginX;
      const dy = t.clientY - touchOriginY;
      div.style.transform = `translate(${dx}px,${dy}px) scale(1.05)`;

      // Highlight bins based on finger Y position
      const screenH = window.innerHeight;
      const isNearBottom = t.clientY > screenH * 0.72;
      if (isNearBottom) {
        const midX = window.innerWidth / 2;
        if (t.clientX < midX) {
          highlightBin('bin_train', true);
          highlightBin('bin_discard', false);
        } else {
          highlightBin('bin_train', false);
          highlightBin('bin_discard', true);
        }
      } else {
        highlightBin('bin_train', false);
        highlightBin('bin_discard', false);
      }
    }, { passive: false });

    div.addEventListener('touchend', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      div.style.transform = 'translateY(0) scale(1)';
      div.style.zIndex = '';
      highlightBin('bin_train', false);
      highlightBin('bin_discard', false);

      // Check where finger landed
      const trainBin   = document.getElementById('bin_train');
      const discardBin = document.getElementById('bin_discard');
      if (trainBin && discardBin) {
        const tr = trainBin.getBoundingClientRect();
        const dr = discardBin.getBoundingClientRect();
        if (ptInRect(t.clientX, t.clientY, tr)) {
          handleDrop(id, 'train');
        } else if (ptInRect(t.clientX, t.clientY, dr)) {
          handleDrop(id, 'discard');
        } else {
          // Tap in stream area = show hint flash
          div.style.boxShadow = `0 0 14px ${typeInfo.glow}44, inset 0 0 20px rgba(0,0,0,.3)`;
        }
      }
    }, { passive: false });

    // --- CLICK TO CYCLE sort (quick-sort on double-tap / keyboard) ---
    div.addEventListener('click', e => {
      // Single tap: pulse card to remind user to drag
      div.style.transform = 'scale(1.04)';
      setTimeout(() => { div.style.transform = 'translateY(0) scale(1)'; }, 120);
    });
  }

  function ptInRect(x, y, r) {
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  /* ── DROP HANDLER ────────────────────────────────────────────── */
  function handleDrop(cardId, bin) {
    if (!G || G.phase !== 'play') return;
    const idx = G.cards.findIndex(c => c.id === cardId);
    if (idx === -1) return;
    const card = G.cards[idx];
    const correct = card.typeInfo.bin === bin;

    // Determine IQ change and score
    let scoreDelta = 0;
    let iqDelta = 0;

    if (correct) {
      scoreDelta = card.typeInfo.pts;
      iqDelta    = card.typeInfo.iqDelta;  // positive for correct data
      G.correct++;
      flashScreen('good');
      spawnParticles(card, '#00e676');
    } else {
      // Wrong bin
      if (bin === 'train' && card.type !== 'correct') {
        // Bad data INTO train bin — big IQ penalty
        iqDelta = card.typeInfo.iqDelta * 2; // more severe
        scoreDelta = 0;
      } else {
        // Correct data into discard — smaller penalty
        iqDelta = -5;
        scoreDelta = 0;
      }
      G.mistakes++;
      flashScreen('bad');
      spawnParticles(card, '#ff1744');
    }

    G.score = Math.max(0, G.score + scoreDelta);
    G.iq    = clamp(G.iq + iqDelta, 0, 100);
    G.total++;

    // Animate card out
    animateCardOut(card.el, correct, bin, () => {
      G.cards.splice(idx, 1);
    });

    // Check lose condition
    if (G.iq <= G.cfg.iqLoseThreshold) {
      G.phase = 'over';
      setTimeout(finishGame, 500);
    }

    // Check win condition
    if (G.iq >= 100) {
      G.phase = 'over';
      setTimeout(finishGame, 500);
    }

    updateHUD();
  }

  function animateCardOut(el, correct, bin, cb) {
    if (!el) { cb && cb(); return; }
    const targetX = bin === 'train' ? -160 : 160;
    el.style.transition = 'transform .3s cubic-bezier(.4,0,1,1), opacity .3s ease';
    el.style.transform = `translateX(${targetX}px) scale(${correct ? 0.8 : 0.7}) rotate(${correct ? -5 : 5}deg)`;
    el.style.opacity = '0';
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
      cb && cb();
    }, 320);
  }

  /* ── BIN HIGHLIGHTING ─────────────────────────────────────────── */
  function highlightBin(binId, on) {
    const bin = document.getElementById(binId);
    if (!bin) return;
    if (binId === 'bin_train') {
      bin.style.borderColor   = on ? '#00e676' : 'rgba(0,230,118,.4)';
      bin.style.background    = on ? 'rgba(0,230,118,.12)' : 'rgba(0,230,118,.04)';
      bin.style.boxShadow     = on ? '0 0 20px rgba(0,230,118,.25)' : '';
    } else {
      bin.style.borderColor   = on ? '#ff6e6e' : 'rgba(255,100,100,.3)';
      bin.style.background    = on ? 'rgba(255,23,68,.12)' : 'rgba(255,23,68,.04)';
      bin.style.boxShadow     = on ? '0 0 20px rgba(255,23,68,.25)' : '';
    }
  }

  /* ── FLASH ───────────────────────────────────────────────────── */
  function flashScreen(type) {
    const fl = document.getElementById('ailFlash');
    if (!fl) return;
    fl.style.transition = 'none';
    fl.style.background = type === 'good' ? 'rgba(0,230,118,.12)' : 'rgba(255,23,68,.15)';
    fl.style.opacity    = '1';
    setTimeout(() => {
      fl.style.transition = 'opacity .4s ease';
      fl.style.opacity    = '0';
    }, 60);
  }

  /* ── PARTICLES ───────────────────────────────────────────────── */
  function spawnParticles(card, color) {
    const pfx = document.getElementById('ailPfx');
    if (!pfx || !card.el) return;
    const r = card.el.getBoundingClientRect();
    const pR = pfx.getBoundingClientRect();
    const cx = (r.left + r.width / 2 - pR.left) * devicePixelRatio;
    const cy = (r.top + r.height / 2 - pR.top) * devicePixelRatio;

    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      G.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1, decay: 0.03 + Math.random() * 0.03,
        r: 2 + Math.random() * 3,
        color,
      });
    }
    renderParticles();
  }

  function updateParticles(dt) {
    if (!G.particles.length) return;
    G.particles = G.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= p.decay;
      return p.life > 0;
    });
    renderParticles();
  }

  function renderParticles() {
    const pfx = document.getElementById('ailPfx');
    if (!pfx) return;
    const ctx = pfx.getContext('2d');
    ctx.clearRect(0, 0, pfx.width, pfx.height);
    G.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /* ── FINISH ──────────────────────────────────────────────────── */
  function finishGame() {
    if (!G) return;
    G.phase = 'over';
    if (raf) { cancelAnimationFrame(raf); raf = null; }

    // Remove remaining cards
    G.cards.forEach(c => { if (c.el && c.el.parentNode) c.el.parentNode.removeChild(c.el); });
    G.cards = [];

    const cfg = G.cfg;
    const win = G.iq >= cfg.iqWinThreshold;
    const stars = G.score >= cfg.scoreGoal3 && win ? 3 :
                  G.score >= cfg.scoreGoal2 ? 2 : 1;
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bsv_aiinnovationlabs', { level: 1, is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();
    const accuracy = G.total > 0 ? Math.round((G.correct / G.total) * 100) : 0;

    // Stars display
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    // Badge
    const badge = accuracy >= 90 ? 'AI Architect Badge 🏅 + Innovation Bonus' :
                  accuracy >= 70 ? 'AI Architect Badge 🏅' :
                  'Data Apprentice 📋';

    // Result color
    const resultColor = win ? '#00e676' : '#ff4444';
    const resultLabel = win ? 'AI FULLY TRAINED!' : 'NICE TRY — GO AGAIN!';

    const over = document.getElementById('ailOver');
    if (!over) return;
    over.style.display = 'flex';
    over.innerHTML = `
      <div style="font-size:.36rem;letter-spacing:.22em;color:rgba(0,255,255,.5)">RESULTS</div>
      <div style="font-size:1rem;font-weight:900;letter-spacing:.1em;color:${resultColor};text-shadow:0 0 20px ${resultColor}">${resultLabel}</div>
      <div style="font-size:1.8rem;letter-spacing:.1em">${starStr}</div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <div style="background:rgba(255,215,0,.07);border:1px solid rgba(255,215,0,.25);border-radius:9px;padding:10px 16px;text-align:center;min-width:80px">
          <div style="font-size:.32rem;letter-spacing:.1em;color:rgba(255,255,255,.35)">COINS</div>
          <div style="font-size:1rem;color:${GOLD};font-weight:900;font-family:'Orbitron',monospace">+${coins}</div>
        </div>
        <div style="background:rgba(0,255,255,.07);border:1px solid rgba(0,255,255,.2);border-radius:9px;padding:10px 16px;text-align:center;min-width:80px">
          <div style="font-size:.32rem;letter-spacing:.1em;color:rgba(255,255,255,.35)">SCORE</div>
          <div style="font-size:1rem;color:${ACCENT};font-weight:900;font-family:'Orbitron',monospace">${G.score}</div>
        </div>
        <div style="background:rgba(0,230,118,.06);border:1px solid rgba(0,230,118,.2);border-radius:9px;padding:10px 16px;text-align:center;min-width:80px">
          <div style="font-size:.32rem;letter-spacing:.1em;color:rgba(255,255,255,.35)">ACCURACY</div>
          <div style="font-size:1rem;color:#00e676;font-weight:900;font-family:'Orbitron',monospace">${accuracy}%</div>
        </div>
        <div style="background:rgba(167,139,250,.06);border:1px solid rgba(167,139,250,.2);border-radius:9px;padding:10px 16px;text-align:center;min-width:80px">
          <div style="font-size:.32rem;letter-spacing:.1em;color:rgba(255,255,255,.35)">AI IQ</div>
          <div style="font-size:1rem;color:#a78bfa;font-weight:900;font-family:'Orbitron',monospace">${Math.round(G.iq)}</div>
        </div>
      </div>

      <div style="font-size:.44rem;color:${GOLD};letter-spacing:.1em;text-align:center">${badge}</div>

      <!-- Lesson -->
      <div style="background:rgba(0,255,255,.05);border:1px solid rgba(0,255,255,.12);border-radius:10px;padding:14px 18px;max-width:320px;text-align:center">
        <div style="font-size:.36rem;letter-spacing:.16em;color:${ACCENT};margin-bottom:6px;font-weight:700">💡 KEY LESSON</div>
        <div style="font-size:.48rem;line-height:1.7;color:rgba(255,255,255,.75)">
          AI systems are only as good as the data they are trained on. Biased or inaccurate training data produces biased and inaccurate AI. Responsible AI development starts with careful, high-quality, representative data.
        </div>
      </div>

      <!-- Buttons -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button id="ailPlayAgain" style="padding:12px 22px;border:1px solid ${ACCENT};border-radius:10px;background:rgba(0,255,255,.1);color:${ACCENT};font-size:.58rem;letter-spacing:.12em;cursor:pointer;font-weight:700">▶ PLAY AGAIN</button>
        <button id="ailHub" style="padding:12px 22px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.7);font-size:.58rem;letter-spacing:.12em;cursor:pointer;font-weight:700">← HUB</button>
      </div>
    `;

    const savedLvIdx = G.lvIdx;
    document.getElementById('ailPlayAgain').addEventListener('click', () => {
      over.style.display = 'none';
      // Clear stream
      const stream = document.getElementById('ailStream');
      if (stream) stream.innerHTML = '';
      startLevel(savedLvIdx);
    });
    document.getElementById('ailHub').addEventListener('click', window.bsv_aiinnovationlabsExit);
  }


})();
