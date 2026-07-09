/* ════════════════════════════════════════════════════════════════
   STARTUP STREET — Launch Lab · Business Ops & Resource Allocation
   Balance five budget sliders across rounds to satisfy customer
   demand while keeping Profit and Happiness meters healthy.
   Level 1: Single business, fixed demand, guided feedback.
   Level 2: Two locations, random market events, reactive pressure.
   Level 3: Three locations, frequent/severe events, high volatility.
   Score = final Profit + Happiness bonus  |  Pillar: ops
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── palette ─────────────────────────────────────────────────── */
  const ACCENT   = '#7C3AED';
  const ACCENT_L = '#a855f7';
  const ACCENT_D = '#5b21b6';
  const GRN      = '#22d3a5';
  const GOLD     = '#f5c842';
  const RED      = '#ef4444';
  const AMBER    = '#f59e0b';
  const BG       = '#03040c';

  /* ── slider config ───────────────────────────────────────────── */
  const PILLARS = [
    { id:'inventory',  label:'Inventory',        icon:'📦', color:'#60a5fa', desc:'Stock needed to fulfil orders' },
    { id:'employees',  label:'Employees',        icon:'👥', color:'#4ade80', desc:'Staff quality & service speed' },
    { id:'marketing',  label:'Marketing',        icon:'📣', color:'#f472b6', desc:'Customer growth & brand reach' },
    { id:'operations', label:'Operations',       icon:'⚙️',  color:'#fbbf24', desc:'Efficiency & uptime' },
    { id:'support',    label:'Cust. Support',    icon:'💬', color:'#a78bfa', desc:'Retention & satisfaction' },
  ];

  /* IDEAL RANGES per pillar [min%, max%] — sum to 100 nominal */
  const IDEAL = {
    inventory:  [15, 30],
    employees:  [15, 28],
    marketing:  [10, 22],
    operations: [10, 22],
    support:    [ 8, 20],
  };

  /* ── random events (Level 2) ─────────────────────────────────── */
  const EVENTS = [
    { id:'supplier',  icon:'🚚', title:'SUPPLIER DELAY!',     desc:'Inventory cut by 25% this round.',    affect:{inventory:-25}, hint:'Raise Inventory slider before next round.' },
    { id:'viral',     icon:'🔥', title:'VIRAL MOMENT!',       desc:'Marketing demand spikes — or you miss new customers.', affect:{marketing:-20}, hint:'Boost Marketing to capture the surge.' },
    { id:'equipment', icon:'⚙️', title:'EQUIPMENT FAILURE!',  desc:'Operations dropped — efficiency falls.', affect:{operations:-20}, hint:'Fund Operations to get back online.' },
    { id:'turnover',  icon:'🚪', title:'STAFF WALKOUT!',      desc:'Two employees quit — service quality drops.', affect:{employees:-22}, hint:'Raise Employees slider immediately.' },
    { id:'reviews',   icon:'⭐', title:'BAD REVIEWS!',        desc:'Customer support overwhelmed.', affect:{support:-20}, hint:'Invest in Customer Support to recover trust.' },
    { id:'boom',      icon:'🚀', title:'DEMAND SPIKE!',       desc:'Customers up 30% — can you handle it?', affect:{inventory:-15, employees:-15}, hint:'Balance Inventory & Employees to meet demand.' },
    { id:'recession', icon:'📉', title:'MARKET SLOWDOWN!',    desc:'Marketing matters more now.', affect:{marketing:-18, support:-12}, hint:'Reinvest in Marketing & Support to retain loyalty.' },
    { id:'audit',     icon:'🧾', title:'SURPRISE AUDIT!',     desc:'Franchise inspectors freeze cash — Inventory and Operations both take a hit.', affect:{inventory:-30, operations:-25}, hint:'Rebuild Inventory & Operations fast to pass the next check.' },
    { id:'blackout',  icon:'⚡', title:'CITYWIDE BLACKOUT!',  desc:'Every location loses power — service and morale crash hard.', affect:{operations:-35, employees:-20, support:-15}, hint:'Pour budget into Operations to get the lights back on.' },
  ];

  /* ── level definitions ───────────────────────────────────────── */
  const LEVELS = [
    {
      id: 1,
      name: 'LEARN: Solo Founder',
      desc: 'One shop, fixed demand. Dial in your budget — watch the meters respond.',
      rounds: 5,
      budget: 100,        // points to allocate (percentage)
      locations: [
        { id:'loc0', name:'Neon Café', emoji:'☕', demand: 68 },
      ],
      eventChance: 0,
      roundDuration: 18,  // seconds per round
      demandVariance: 0,
    },
    {
      id: 2,
      name: 'MASTER: Multi-Location CEO',
      desc: 'Two shops, market events, shifting demand. Keep both businesses alive.',
      rounds: 6,
      budget: 100,
      locations: [
        { id:'loc0', name:'Neon Café',       emoji:'☕', demand: 72 },
        { id:'loc1', name:'Volt Boutique',   emoji:'🛍️', demand: 65 },
      ],
      eventChance: 0.6,
      roundDuration: 22,
      demandVariance: 15,
    },
    {
      id: 3,
      name: 'LEGENDARY: Franchise Empire',
      desc: 'Three locations, relentless events, volatile demand. Run the whole empire — no room for error.',
      rounds: 8,
      budget: 100,
      locations: [
        { id:'loc0', name:'Neon Café',      emoji:'☕', demand: 80 },
        { id:'loc1', name:'Volt Boutique',  emoji:'🛍️', demand: 76 },
        { id:'loc2', name:'Pulse Kiosk',    emoji:'🎧', demand: 84 },
      ],
      eventChance: 0.8,
      roundDuration: 16,
      demandVariance: 25,
    },
  ];

  /* ── literacy facts (shown between rounds) ───────────────────── */
  const FACTS = [
    ['📦', 'Understocking means lost sales — but overstocking wastes cash.'],
    ['👥', 'Your team is your product. Underpay them and quality shows.'],
    ['📣', 'Marketing isn\'t optional — without it, growth stalls silently.'],
    ['⚙️', 'Operations inefficiency compounds: small losses add up fast.'],
    ['💬', 'It costs 5× more to acquire a customer than to keep one.'],
    ['💰', 'Cash flow is king. Profit on paper means nothing if you\'re broke.'],
    ['🎯', 'Budget allocation is strategy — every dollar is a decision.'],
  ];

  /* ── state ───────────────────────────────────────────────────── */
  let G = null;
  let _raf = null;
  let _endTimer = null;

  /* ══════════════════════════════════════════════════════════════
     SCREEN REGISTRATION
  ══════════════════════════════════════════════════════════════ */
  window.SCREENS = window.SCREENS || {};

  window.SCREENS.game_ll_startup_street = function () {
    G = null;
    clearTimeout(window._ssInitTimer);
    window._ssInitTimer = setTimeout(initGame, 40);
    return `<div id="ssRoot" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none;-webkit-user-select:none">

  <!-- Animated background grid -->
  <canvas id="ssBg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.35"></canvas>

  <!-- TOP BAR -->
  <div id="ssTopBar" style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;gap:8px;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(3,4,12,.97) 70%,transparent);border-bottom:1px solid ${ACCENT}33">
    <button id="ssBack" style="padding:6px 13px;border:1px solid ${ACCENT}66;border-radius:8px;background:${ACCENT}18;color:${ACCENT_L};font-family:Orbitron,sans-serif;font-size:.52rem;letter-spacing:.12em;cursor:pointer;white-space:nowrap;transition:background .2s">← HUB</button>
    <div style="font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.18em;color:${ACCENT_L};flex:1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🏙️ STARTUP STREET</div>
    <button id="ssHelpBtn" title="How to play" style="padding:6px 10px;border:1px solid ${ACCENT}66;border-radius:8px;background:${ACCENT}18;color:${ACCENT_L};cursor:pointer;flex-shrink:0;font-size:.72rem">❓</button>
    <div id="ssScore" style="font-family:Orbitron,sans-serif;font-size:.72rem;color:${GOLD};min-width:68px;text-align:right">$0</div>
    <div id="ssTimer" style="font-family:Orbitron,sans-serif;font-size:.72rem;color:${ACCENT_L};min-width:38px;text-align:right">18s</div>
  </div>

  <!-- HEALTH BARS ROW -->
  <div style="position:absolute;top:46px;left:0;right:0;z-index:19;padding:5px 14px;background:rgba(3,4,12,.85)">
    <div style="display:flex;gap:10px;align-items:center">
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="font-family:Orbitron,sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.45)">💰 PROFIT</span>
          <span id="ssProfitPct" style="font-family:Orbitron,sans-serif;font-size:.44rem;color:${GRN}">100%</span>
        </div>
        <div style="height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid ${ACCENT}33">
          <div id="ssProfitBar" style="height:100%;width:100%;background:linear-gradient(90deg,${GRN},#6ee7b7);border-radius:4px;transition:width .4s,background .4s"></div>
        </div>
      </div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="font-family:Orbitron,sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.45)">😊 HAPPINESS</span>
          <span id="ssHappyPct" style="font-family:Orbitron,sans-serif;font-size:.44rem;color:${GRN}">100%</span>
        </div>
        <div style="height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid ${ACCENT}33">
          <div id="ssHappyBar" style="height:100%;width:100%;background:linear-gradient(90deg,#f472b6,#a78bfa);border-radius:4px;transition:width .4s,background .4s"></div>
        </div>
      </div>
      <div style="font-family:Orbitron,sans-serif;font-size:.45rem;color:rgba(255,255,255,.4);white-space:nowrap" id="ssRoundLabel">RD 1/5</div>
    </div>
  </div>

  <!-- MAIN GAME AREA (injected by JS) -->
  <div id="ssMain" style="position:absolute;top:86px;left:0;right:0;bottom:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:8px 12px 20px"></div>

  <!-- EVENT BANNER -->
  <div id="ssEventBanner" style="position:absolute;top:90px;left:10%;right:10%;z-index:35;display:none;border-radius:14px;padding:12px 16px;background:linear-gradient(135deg,rgba(239,68,68,.95),rgba(124,58,237,.85));border:1.5px solid rgba(239,68,68,.7);box-shadow:0 0 32px rgba(239,68,68,.4);text-align:center">
    <div id="ssEventIcon" style="font-size:1.5rem;line-height:1.2">🔥</div>
    <div id="ssEventTitle" style="font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.14em;color:#fff;margin:4px 0 3px">EVENT</div>
    <div id="ssEventDesc" style="font-size:.72rem;color:rgba(255,255,255,.85);margin-bottom:4px">...</div>
    <div id="ssEventHint" style="font-family:Orbitron,sans-serif;font-size:.45rem;letter-spacing:.1em;color:#fbbf24">HINT</div>
  </div>

  <!-- FACT GATE (between rounds) -->
  <div id="ssGate" style="position:absolute;inset:0;z-index:45;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.92);backdrop-filter:blur(8px)"></div>

  <!-- END OVERLAY -->
  <div id="ssOver" style="position:absolute;inset:0;z-index:50;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.92);backdrop-filter:blur(6px)"></div>

  <!-- HOW-TO-PLAY OVERLAY (first-time intro + ❓ re-open) -->
  <div id="ssHelp" style="position:absolute;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.94);backdrop-filter:blur(6px);padding:16px"></div>

</div>`;
  };

  /* ══════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════ */
  function initGame() {
    const root = document.getElementById('ssRoot');
    if (!root) return;

    injectStyles();
    drawBg();
    startLevel(0);

    const back = document.getElementById('ssBack');
    if (back) back.onclick = window.ll_startup_streetExit;

    const helpBtn = document.getElementById('ssHelpBtn');
    if (helpBtn) helpBtn.onclick = window.ssShowHelp;

    /* first-time how-to-play, shown right as gameplay begins — pauses the
       just-started RAF loop so no round time drains while the player reads */
    showHowToPlay();
  }

  /* ══════════════════════════════════════════════════════════════
     HOW-TO-PLAY — shown once automatically on first launch, and
     re-openable anytime via the ❓ button without losing progress.
     Pause trick: same delta-clock pattern as tick() — G.lastTick =
     performance.now(), dt = (now - G.lastTick)/1000 each frame,
     G.roundTimer -= dt. Freezing the RAF (cancelAnimationFrame) stops
     G.roundTimer from draining; on resume, resetting G.lastTick =
     performance.now() right before restarting the loop makes the very
     next dt exclude the entire paused duration. If the player opens
     help while on the between-round fact gate (phase 'gate') there is
     no RAF running and no round timer at risk, so we simply layer the
     overlay on top without touching phase — closing it returns to
     whatever screen was already showing.
  ══════════════════════════════════════════════════════════════ */
  function showHowToPlay () {
    const overlay = document.getElementById('ssHelp');
    if (!overlay) return;
    const wasPlay = G && G.phase === 'play';
    if (wasPlay) {
      G.phase = 'paused';
      if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    }
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div style="max-width:380px;width:92%;padding:26px 22px;background:rgba(10,5,22,.97);border:1.5px solid ${ACCENT}88;border-radius:18px;text-align:center;box-shadow:0 0 50px ${ACCENT}33;max-height:90vh;overflow-y:auto">
        <div style="font-family:Orbitron,sans-serif;font-size:.56rem;letter-spacing:.2em;color:${ACCENT_L};margin-bottom:8px">HOW TO PLAY</div>
        <div style="font-size:2rem;margin-bottom:6px">🏙️</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.95rem;margin-bottom:14px">STARTUP STREET</div>
        <ul style="text-align:left;font-size:.74rem;color:rgba(255,255,255,.82);line-height:1.6;margin:0 0 18px;padding-left:18px">
          <li style="margin-bottom:8px"><b style="color:${ACCENT_L}">Goal:</b> keep Profit and Happiness healthy across every round by budgeting well.</li>
          <li style="margin-bottom:8px"><b style="color:${ACCENT_L}">How to play:</b> drag the 5 sliders to split your 100% budget across Inventory, Employees, Marketing, Operations and Support, then tap DEPLOY ROUND.</li>
          <li style="margin-bottom:8px"><b style="color:${ACCENT_L}">Watch out:</b> from Level 2 on, random events knock a slider down — react fast before the round timer runs out, and don't let Profit or Happiness hit zero.</li>
          <li><b style="color:${ACCENT_L}">Scoring:</b> higher Profit and Happiness at the end of every round earns more stars.</li>
        </ul>
        <button onclick="window.ssCloseHelp()" style="padding:12px 30px;border:none;border-radius:11px;background:linear-gradient(90deg,${ACCENT_D},${ACCENT});color:#fff;font-family:Orbitron,sans-serif;font-size:.66rem;letter-spacing:.12em;font-weight:900;cursor:pointer">${wasPlay ? '▶ RESUME' : 'GOT IT — START ▶'}</button>
      </div>`;
  }

  window.ssShowHelp = function () {
    if (!G || G.phase === 'end') return;
    showHowToPlay();
  };

  window.ssCloseHelp = function () {
    const overlay = document.getElementById('ssHelp');
    if (overlay) overlay.style.display = 'none';
    if (G && G.phase === 'paused') {
      G.phase = 'play';
      startLoop();   // startLoop() itself resets G.lastTick = performance.now() before the first frame
    }
  };

  /* ── inject keyframe styles ──────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('ssStyles')) return;
    const s = document.createElement('style');
    s.id = 'ssStyles';
    s.textContent = `
      @keyframes ssPop{0%{opacity:0;transform:translate(-50%,-60%) scale(.8)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}70%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-40%) scale(.9)}}
      @keyframes ssPulse{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.5)}50%{box-shadow:0 0 0 6px rgba(124,58,237,.0)}}
      @keyframes ssShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
      @keyframes ssSlideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes ssBlink{0%,100%{opacity:1}50%{opacity:.4}}
      .ss-slider::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${ACCENT_L};border:2.5px solid #fff;box-shadow:0 0 10px ${ACCENT}88;cursor:pointer}
      .ss-slider::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:${ACCENT_L};border:2.5px solid #fff;cursor:pointer}
      .ss-slider{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;background:rgba(255,255,255,.12);outline:none;cursor:pointer}
      .ss-loc-card{border-radius:14px;border:1.5px solid ${ACCENT}44;background:rgba(124,58,237,.06);padding:10px 12px;margin-bottom:12px;animation:ssSlideIn .35s ease}
      .ss-loc-card.warning{border-color:${AMBER}88;background:rgba(245,158,11,.06)}
      .ss-loc-card.danger{border-color:${RED}88;background:rgba(239,68,68,.06);animation:ssShake .4s ease}
      .ss-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:.65rem;font-family:Orbitron,sans-serif;letter-spacing:.08em}
    `;
    document.head.appendChild(s);
  }

  /* ── animated bg grid ────────────────────────────────────────── */
  function drawBg() {
    const c = document.getElementById('ssBg');
    if (!c) return;
    c.width  = c.offsetWidth  || window.innerWidth;
    c.height = c.offsetHeight || window.innerHeight;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = ACCENT + '44';
    ctx.lineWidth = .6;
    const step = 40;
    for (let x = 0; x <= W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // glow nodes at intersections
    for (let x = 0; x <= W; x += step*3) {
      for (let y = 0; y <= H; y += step*3) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI*2);
        ctx.fillStyle = ACCENT + '99';
        ctx.fill();
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     LEVEL START
  ══════════════════════════════════════════════════════════════ */
  function startLevel(lvIdx) {
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }

    const lv = LEVELS[lvIdx];
    const sliders = {};
    PILLARS.forEach((p, i) => {
      sliders[p.id] = 20; // start equal split (5×20=100)
    });

    G = {
      phase:      'play',
      lvIdx,
      lv,
      round:      1,
      totalRounds: lv.rounds,
      sliders,          // pillar id → 0-100 value (must sum to 100)
      eventPenalties: {}, // pillar id → penalty% from active event
      profit:     100,   // 0-100 meter
      happiness:  100,   // 0-100 meter
      score:      0,
      roundTimer: lv.roundDuration,
      lastTick:   performance.now(),
      factIdx:    0,
      activeEvent: null,
      eventShown: false,
      roundResults: [], // per-location results per round
      locationStates: lv.locations.map(loc => ({
        ...loc,
        demand: loc.demand,
        profit: 100,
        happiness: 100,
      })),
      allocated: 100,   // budget allocated (always 100 for %)
    };

    renderMain();
    renderHUD();
    startLoop();
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER MAIN PANEL
  ══════════════════════════════════════════════════════════════ */
  function renderMain() {
    const main = document.getElementById('ssMain');
    if (!main || !G) return;

    const lv = G.lv;
    let html = '';

    /* budget total indicator */
    const total = sliderTotal();
    const over  = total > 100;
    const under = total < 100;
    const exact = total === 100;

    html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.14em;color:rgba(255,255,255,.5)">${lv.name}</div>
      <div id="ssBudgetChip" class="ss-pill" style="background:${exact?ACCENT+'22':over?RED+'22':AMBER+'22'};border:1px solid ${exact?ACCENT:over?RED:AMBER}66;color:${exact?ACCENT_L:over?RED:AMBER}">
        BUDGET: <span id="ssBudgetNum" style="font-weight:700">${total}%</span> / 100%
      </div>
    </div>`;

    /* Instruction blurb */
    html += `<div style="font-size:.72rem;color:rgba(255,255,255,.55);margin-bottom:10px;line-height:1.5">
      ${lv.locations.length > 1
        ? 'Allocate budget across sliders — each affects <b style="color:#fff">both locations</b>. React to events.'
        : 'Drag sliders to allocate your 100% budget. Watch the meters.'
      }
    </div>`;

    /* SLIDER SECTION */
    html += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">`;
    PILLARS.forEach(p => {
      const val = G.sliders[p.id];
      const pen = (G.eventPenalties[p.id] || 0);
      const eff = Math.max(0, val - pen);
      const inIdeal = eff >= IDEAL[p.id][0] && eff <= IDEAL[p.id][1];
      const warn    = eff < IDEAL[p.id][0];
      const statusColor = inIdeal ? GRN : warn ? RED : AMBER;

      html += `<div style="background:rgba(255,255,255,.03);border-radius:10px;border:1px solid rgba(255,255,255,.07);padding:8px 10px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:.95rem">${p.icon}</span>
            <span style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.1em;color:${p.color}">${p.label.toUpperCase()}</span>
            ${pen>0 ? `<span class="ss-pill" style="background:${RED}22;border:1px solid ${RED}55;color:${RED};font-size:.4rem">EVENT -${pen}%</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-family:Orbitron,sans-serif;font-size:.55rem;color:${statusColor}">${eff}%</span>
            <span style="font-size:.6rem">${inIdeal ? '✓' : warn ? '⚠' : '↑'}</span>
          </div>
        </div>
        <input type="range" class="ss-slider" id="ss-slider-${p.id}"
          min="0" max="60" step="1" value="${val}"
          style="accent-color:${p.color}"
          data-pillar="${p.id}">
        <div style="display:flex;justify-content:space-between;font-size:.48rem;color:rgba(255,255,255,.3);margin-top:2px">
          <span>0%</span>
          <span style="color:rgba(255,255,255,.4);font-size:.44rem">${p.desc}</span>
          <span>60%</span>
        </div>
      </div>`;
    });
    html += '</div>';

    /* LOCATION CARDS */
    html += `<div style="margin-bottom:8px">
      <div style="font-family:Orbitron,sans-serif;font-size:.48rem;letter-spacing:.14em;color:rgba(255,255,255,.4);margin-bottom:6px">BUSINESS LOCATIONS</div>
    `;
    G.locationStates.forEach((loc, i) => {
      const locProfit  = loc.profit;
      const locHappy   = loc.happiness;
      const pColor = locProfit  > 60 ? GRN : locProfit  > 30 ? AMBER : RED;
      const hColor = locHappy   > 60 ? GRN : locHappy   > 30 ? AMBER : RED;
      const cardClass = locProfit < 30 || locHappy < 30 ? 'ss-loc-card danger' : (locProfit < 60 || locHappy < 60 ? 'ss-loc-card warning' : 'ss-loc-card');
      html += `<div class="${cardClass}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:1.1rem">${loc.emoji}</span>
            <span style="font-family:Orbitron,sans-serif;font-size:.52rem;letter-spacing:.1em;color:#fff">${loc.name}</span>
          </div>
          <span style="font-size:.65rem;color:rgba(255,255,255,.4)">Demand: ${loc.demand}%</span>
        </div>
        <div style="display:flex;gap:10px">
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;font-size:.42rem;color:rgba(255,255,255,.4);margin-bottom:2px">
              <span>💰 Profit</span><span id="ss-loc-p-${i}" style="color:${pColor}">${locProfit}%</span>
            </div>
            <div style="height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden">
              <div id="ss-locbar-p-${i}" style="height:100%;width:${locProfit}%;background:${pColor};border-radius:3px;transition:width .4s,background .4s"></div>
            </div>
          </div>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;font-size:.42rem;color:rgba(255,255,255,.4);margin-bottom:2px">
              <span>😊 Happy</span><span id="ss-loc-h-${i}" style="color:${hColor}">${locHappy}%</span>
            </div>
            <div style="height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden">
              <div id="ss-locbar-h-${i}" style="height:100%;width:${locHappy}%;background:${hColor};border-radius:3px;transition:width .4s,background .4s"></div>
            </div>
          </div>
        </div>
      </div>`;
    });
    html += '</div>';

    /* COMMIT ROUND BUTTON */
    html += `<button id="ssCommitBtn" style="width:100%;padding:13px;border-radius:12px;border:1.5px solid ${ACCENT};background:linear-gradient(135deg,${ACCENT_D},${ACCENT});font-family:Orbitron,sans-serif;font-size:.72rem;letter-spacing:.18em;color:#fff;cursor:pointer;box-shadow:0 0 18px ${ACCENT}55;transition:transform .1s,box-shadow .2s;animation:ssPulse 2s infinite">
      ▶ DEPLOY ROUND ${G.round} / ${G.totalRounds}
    </button>`;

    main.innerHTML = html;

    /* attach slider listeners */
    PILLARS.forEach(p => {
      const el = document.getElementById('ss-slider-' + p.id);
      if (!el) return;
      el.addEventListener('input', () => {
        G.sliders[p.id] = +el.value;
        updateBudgetChip();
        updateSliderFeedback(p.id);
      });
      el.addEventListener('change', () => {
        G.sliders[p.id] = +el.value;
        updateBudgetChip();
      });
    });

    const commitBtn = document.getElementById('ssCommitBtn');
    if (commitBtn) commitBtn.onclick = commitRound;
  }

  /* ── live budget chip update (no full re-render) ─────────────── */
  function updateBudgetChip() {
    const total = sliderTotal();
    const chip  = document.getElementById('ssBudgetChip');
    const num   = document.getElementById('ssBudgetNum');
    if (!chip || !num) return;
    const over  = total > 100;
    const exact = total === 100;
    num.textContent = total + '%';
    chip.style.background = exact ? ACCENT+'22' : over ? RED+'22' : AMBER+'22';
    chip.style.borderColor = (exact ? ACCENT : over ? RED : AMBER) + '66';
    chip.style.color       = exact ? ACCENT_L : over ? RED : AMBER;
  }

  function updateSliderFeedback(pillarId) {
    /* live-update just the value label for the changed pillar */
    const val = G.sliders[pillarId];
    const pen = G.eventPenalties[pillarId] || 0;
    const eff = Math.max(0, val - pen);
    const inIdeal = eff >= IDEAL[pillarId][0] && eff <= IDEAL[pillarId][1];
    const warn    = eff < IDEAL[pillarId][0];
    const statusColor = inIdeal ? GRN : warn ? RED : AMBER;
    const slider = document.getElementById('ss-slider-' + pillarId);
    if (slider) {
      const row = slider.closest('div[style*="background:rgba"]');
      if (row) {
        const valSpan = row.querySelector('span[style*="Orbitron"]');
        if (valSpan) { valSpan.textContent = eff + '%'; valSpan.style.color = statusColor; }
        const iconSpan = row.querySelectorAll('span');
        iconSpan.forEach(s => {
          if (s.textContent === '✓' || s.textContent === '⚠' || s.textContent === '↑') {
            s.textContent = inIdeal ? '✓' : warn ? '⚠' : '↑';
          }
        });
      }
    }
  }

  function sliderTotal() {
    return PILLARS.reduce((s, p) => s + (G.sliders[p.id] || 0), 0);
  }

  /* ══════════════════════════════════════════════════════════════
     ROUND COMMIT — evaluate allocation vs demand
  ══════════════════════════════════════════════════════════════ */
  function commitRound() {
    if (!G || G.phase !== 'play') return;

    const total = sliderTotal();
    if (total > 102) {
      shakeElement('ssCommitBtn');
      showPopup(`Over budget! ${total}% ≠ 100%`, RED);
      return;
    }

    /* evaluate each location */
    G.locationStates.forEach((loc, i) => {
      const result = evaluateLocation(loc);
      loc.profit    = Math.max(0, Math.min(100, loc.profit    + result.profitDelta));
      loc.happiness = Math.max(0, Math.min(100, loc.happiness + result.happyDelta));
    });

    /* global meters = average of locations */
    const avgProfit  = avg(G.locationStates.map(l => l.profit));
    const avgHappy   = avg(G.locationStates.map(l => l.happiness));
    G.profit    = avgProfit;
    G.happiness = avgHappy;

    /* score contribution */
    const roundScore = Math.round((avgProfit + avgHappy) * 2);
    G.score += roundScore;

    showPopup(`+${roundScore} pts`, ACCENT_L);
    renderHUD();
    updateLocationBars();

    /* check lose condition */
    if (G.profit <= 0 || G.happiness <= 0) {
      if (_endTimer) clearTimeout(_endTimer);
      _endTimer = setTimeout(() => endGame(0, true), 400);
      return;
    }

    /* clear event penalties after round */
    G.eventPenalties = {};
    G.activeEvent    = null;
    const banner = document.getElementById('ssEventBanner');
    if (banner) banner.style.display = 'none';

    if (G.round >= G.totalRounds) {
      if (_endTimer) clearTimeout(_endTimer);
      _endTimer = setTimeout(() => resolveEnd(), 500);
    } else {
      G.round++;
      G.roundTimer = G.lv.roundDuration;
      showFactGate();
    }
  }

  function evaluateLocation(loc) {
    /* For each pillar: compare effective allocation vs ideal range.
       Below ideal min → penalty. Above ideal max → diminishing returns (mild penalty).
       Demand factor: higher demand = bigger swings. */
    let profitDelta = 0;
    let happyDelta  = 0;
    const demandFactor = (loc.demand / 100);

    PILLARS.forEach(p => {
      const val = G.sliders[p.id];
      const pen = G.eventPenalties[p.id] || 0;
      const eff = Math.max(0, val - pen);
      const [minI, maxI] = IDEAL[p.id];

      let score = 0;
      if (eff >= minI && eff <= maxI) {
        score = 1; // perfect
      } else if (eff < minI) {
        score = eff / minI; // 0→1 as eff goes 0→min
      } else {
        // over max: mild negative (overspending)
        score = 1 - ((eff - maxI) / (60 - maxI)) * 0.4;
      }

      /* Each pillar affects profit and happiness differently */
      const profitWeight = { inventory: 3, employees: 2, marketing: 1.5, operations: 2, support: 1.5 };
      const happyWeight  = { inventory: 1.5, employees: 2.5, marketing: 1, operations: 1.5, support: 3 };

      const baseProfit = (score - 0.5) * 10 * profitWeight[p.id] * demandFactor;
      const baseHappy  = (score - 0.5) * 10 * happyWeight[p.id]  * demandFactor;

      profitDelta += baseProfit;
      happyDelta  += baseHappy;
    });

    /* variance from demand fluctuation */
    if (G.lv.demandVariance > 0) {
      const jitter = (Math.random() - 0.5) * G.lv.demandVariance * 0.15;
      profitDelta += jitter;
      happyDelta  += jitter;
    }

    return { profitDelta: Math.round(profitDelta), happyDelta: Math.round(happyDelta) };
  }

  function avg(arr) {
    return arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
  }

  function resolveEnd() {
    /* determine stars */
    const p = G.profit, h = G.happiness;
    let stars = 1;
    if (p >= 75 && h >= 75) stars = 3;
    else if (p >= 50 && h >= 50) stars = 2;
    endGame(stars, false);
  }

  /* ══════════════════════════════════════════════════════════════
     RANDOM EVENTS (Level 2+)
  ══════════════════════════════════════════════════════════════ */
  function maybeFireEvent() {
    if (!G || G.lvIdx < 1) return;
    if (G.activeEvent) return;
    if (Math.random() > G.lv.eventChance) return;

    const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    G.activeEvent = evt;

    /* apply penalties */
    G.eventPenalties = {};
    if (evt.affect) {
      Object.keys(evt.affect).forEach(pid => {
        G.eventPenalties[pid] = Math.abs(evt.affect[pid]);
      });
    }

    const banner    = document.getElementById('ssEventBanner');
    const iconEl    = document.getElementById('ssEventIcon');
    const titleEl   = document.getElementById('ssEventTitle');
    const descEl    = document.getElementById('ssEventDesc');
    const hintEl    = document.getElementById('ssEventHint');

    if (banner) {
      if (iconEl)  iconEl.textContent  = evt.icon;
      if (titleEl) titleEl.textContent = evt.title;
      if (descEl)  descEl.textContent  = evt.desc;
      if (hintEl)  hintEl.textContent  = '→ ' + evt.hint;
      banner.style.display = 'block';
    }

    /* Update slider UI to show penalties */
    renderMain();

    setTimeout(() => {
      const b = document.getElementById('ssEventBanner');
      if (b) b.style.display = 'none';
    }, 5000);
  }

  /* ══════════════════════════════════════════════════════════════
     FACT GATE (between rounds)
  ══════════════════════════════════════════════════════════════ */
  function showFactGate() {
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    G.phase = 'gate';

    const [icon, text] = FACTS[G.factIdx % FACTS.length];
    G.factIdx++;

    const gate = document.getElementById('ssGate');
    if (!gate) return;

    gate.style.display = 'flex';
    gate.innerHTML = `<div style="max-width:88%;text-align:center;animation:ssSlideIn .4s ease">
      <div style="font-size:2.2rem;margin-bottom:14px">${icon}</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.15em;color:${ACCENT_L};margin-bottom:10px">DID YOU KNOW?</div>
      <div style="font-size:.9rem;line-height:1.6;color:rgba(255,255,255,.88);margin-bottom:22px;font-weight:400">${text}</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.45rem;letter-spacing:.1em;color:rgba(255,255,255,.4);margin-bottom:16px">ROUND ${G.round} / ${G.totalRounds}</div>
      <button id="ssGateBtn" style="padding:11px 30px;border-radius:11px;border:1.5px solid ${ACCENT};background:${ACCENT}22;color:${ACCENT_L};font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.14em;cursor:pointer">
        NEXT ROUND →
      </button>
    </div>`;

    const btn = document.getElementById('ssGateBtn');
    if (btn) btn.onclick = () => {
      gate.style.display = 'none';
      G.phase = 'play';
      renderMain();
      renderHUD();
      startLoop();
      /* maybe fire event on new round */
      setTimeout(maybeFireEvent, 1200);
    };
  }

  /* ══════════════════════════════════════════════════════════════
     GAME LOOP (round timer countdown)
  ══════════════════════════════════════════════════════════════ */
  function startLoop() {
    if (_raf) cancelAnimationFrame(_raf);
    G.lastTick = performance.now();
    _raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!G || G.phase !== 'play') return;
    const dt = (now - G.lastTick) / 1000;
    G.lastTick = now;

    G.roundTimer -= dt;
    if (G.roundTimer < 0) G.roundTimer = 0;

    const timerEl = document.getElementById('ssTimer');
    if (timerEl) {
      const sec = Math.ceil(G.roundTimer);
      timerEl.textContent = sec + 's';
      timerEl.style.color = sec <= 5 ? RED : ACCENT_L;
      if (sec <= 5) timerEl.style.animation = 'ssBlink .5s infinite';
      else timerEl.style.animation = '';
    }

    if (G.roundTimer <= 0) {
      /* auto-commit if timer runs out — do not re-queue loop */
      _raf = null;
      commitRound();
      return;
    }

    _raf = requestAnimationFrame(tick);
  }

  /* ══════════════════════════════════════════════════════════════
     HUD UPDATES
  ══════════════════════════════════════════════════════════════ */
  function renderHUD() {
    if (!G) return;
    const scoreEl  = document.getElementById('ssScore');
    const profBar  = document.getElementById('ssProfitBar');
    const profPct  = document.getElementById('ssProfitPct');
    const happBar  = document.getElementById('ssHappyBar');
    const happPct  = document.getElementById('ssHappyPct');
    const rdLabel  = document.getElementById('ssRoundLabel');

    if (scoreEl) scoreEl.textContent = '$' + G.score;
    if (rdLabel) rdLabel.textContent = `RD ${G.round}/${G.totalRounds}`;

    const pColor = G.profit   > 60 ? GRN : G.profit   > 30 ? AMBER : RED;
    const hColor = G.happiness > 60 ? GRN : G.happiness > 30 ? AMBER : RED;

    if (profBar) { profBar.style.width = G.profit + '%'; profBar.style.background = pColor; }
    if (profPct) { profPct.textContent = G.profit + '%'; profPct.style.color = pColor; }
    if (happBar) { happBar.style.width = G.happiness + '%'; happBar.style.background = hColor; }
    if (happPct) { happPct.textContent = G.happiness + '%'; happPct.style.color = hColor; }
  }

  function updateLocationBars() {
    if (!G) return;
    G.locationStates.forEach((loc, i) => {
      const pEl   = document.getElementById(`ss-loc-p-${i}`);
      const hEl   = document.getElementById(`ss-loc-h-${i}`);
      const pbEl  = document.getElementById(`ss-locbar-p-${i}`);
      const hbEl  = document.getElementById(`ss-locbar-h-${i}`);
      const pCol  = loc.profit    > 60 ? GRN : loc.profit    > 30 ? AMBER : RED;
      const hCol  = loc.happiness > 60 ? GRN : loc.happiness > 30 ? AMBER : RED;
      if (pEl)  { pEl.textContent = loc.profit + '%';    pEl.style.color = pCol; }
      if (hEl)  { hEl.textContent = loc.happiness + '%'; hEl.style.color = hCol; }
      if (pbEl) { pbEl.style.width = loc.profit    + '%'; pbEl.style.background = pCol; }
      if (hbEl) { hbEl.style.width = loc.happiness + '%'; hbEl.style.background = hCol; }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     END GAME
  ══════════════════════════════════════════════════════════════ */
  function endGame(stars, bankrupt) {
    if (!G) return;
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    G.phase = 'end';

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ll_startup_street', { stars, level: G.lv.id, badge: 'CEO Badge', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();
    if (window.StartupRewardsService) StartupRewardsService.submit({ pillar: 'ops', successDelta: stars === 3 ? 15 : stars === 2 ? 8 : 3 });

    const starStr  = '⭐'.repeat(stars) + (stars < 3 ? '☆'.repeat(3 - stars) : '');

    /* explicit per-transition continue logic — index 0 win → offer index 1,
       index 1 win → offer index 2, index 2 (final) win → no continue button. */
    const nextIdx = G.lvIdx + 1;
    const hasNextLevel = nextIdx < LEVELS.length;
    const canContinue = hasNextLevel && !bankrupt;
    const NEXT_LEVEL_LABEL = ['🚀 MASTER LEVEL →', '👑 EMPIRE LEVEL →']; // label shown when leaving lvIdx 0, 1 respectively
    const nextLabel = canContinue ? (NEXT_LEVEL_LABEL[G.lvIdx] || `▶ ${LEVELS[nextIdx].name} →`) : '';

    const lesson   = 'Running a business means juggling many things at once. Spending too much on one area and ignoring another is how startups fail — every dollar must be allocated where it creates the most value.';

    const badge = stars === 3 ? '👑 CEO Badge' : stars === 2 ? '📊 COO Badge' : '🎓 Intern Badge';

    const overEl = document.getElementById('ssOver');
    if (!overEl) return;
    overEl.style.display = 'flex';

    overEl.innerHTML = `<div style="max-width:90%;width:340px;text-align:center;animation:ssSlideIn .5s ease">
      <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.18em;color:${ACCENT_L};margin-bottom:10px">
        ${bankrupt ? 'BUSINESS COLLAPSED' : 'PERIOD COMPLETE'}
      </div>
      <div style="font-size:2rem;letter-spacing:.1em;margin-bottom:6px">${starStr}</div>
      <div style="font-family:Orbitron,sans-serif;font-size:1.1rem;color:${stars===3?GOLD:stars===2?ACCENT_L:'#94a3b8'};margin-bottom:4px">
        ${bankrupt ? 'BANKRUPT' : stars===3 ? 'FLAWLESS EXEC' : stars===2 ? 'PROFITABLE' : 'SURVIVAL MODE'}
      </div>

      <div style="display:flex;gap:10px;justify-content:center;margin:14px 0">
        <div style="background:${ACCENT}22;border:1px solid ${ACCENT}55;border-radius:10px;padding:9px 16px">
          <div style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.1em;color:${ACCENT_L};margin-bottom:3px">COINS</div>
          <div style="font-family:Orbitron,sans-serif;font-size:1rem;color:${GOLD}">+${coins}</div>
        </div>
        <div style="background:${ACCENT}22;border:1px solid ${ACCENT}55;border-radius:10px;padding:9px 16px">
          <div style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.1em;color:${ACCENT_L};margin-bottom:3px">XP</div>
          <div style="font-family:Orbitron,sans-serif;font-size:1rem;color:${GRN}">+${Math.round(coins/4)}</div>
        </div>
        <div style="background:${ACCENT}22;border:1px solid ${ACCENT}55;border-radius:10px;padding:9px 16px">
          <div style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.1em;color:${ACCENT_L};margin-bottom:3px">SCORE</div>
          <div style="font-family:Orbitron,sans-serif;font-size:1rem;color:#fff">$${G.score}</div>
        </div>
      </div>

      <div style="background:rgba(124,58,237,.12);border:1px solid ${ACCENT}44;border-radius:10px;padding:10px 14px;margin-bottom:14px;text-align:left">
        <div style="font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.12em;color:${ACCENT_L};margin-bottom:5px">AWARD: ${badge}</div>
        <div style="font-size:.72rem;line-height:1.55;color:rgba(255,255,255,.75)">📖 ${lesson}</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px">
        ${canContinue ? `<button id="ssToL2Btn" style="padding:11px;border-radius:10px;border:1.5px solid ${GOLD};background:${GOLD}22;color:${GOLD};font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.14em;cursor:pointer">
          ${nextLabel}
        </button>` : ''}
        <button id="ssAgainBtn" style="padding:11px;border-radius:10px;border:1.5px solid ${ACCENT};background:${ACCENT}22;color:${ACCENT_L};font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.14em;cursor:pointer">
          ↺ PLAY AGAIN
        </button>
        <button id="ssHubBtn" style="padding:11px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:rgba(255,255,255,.7);font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.14em;cursor:pointer">
          ← HUB
        </button>
      </div>
    </div>`;

    const l2Btn    = document.getElementById('ssToL2Btn');
    const againBtn = document.getElementById('ssAgainBtn');
    const hubBtn   = document.getElementById('ssHubBtn');
    if (l2Btn)    l2Btn.onclick    = () => { overEl.style.display='none'; startLevel(nextIdx); };
    if (againBtn) againBtn.onclick = () => { overEl.style.display='none'; startLevel(G.lvIdx); };
    if (hubBtn)   hubBtn.onclick   = window.ll_startup_streetExit;
  }

  /* ══════════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════════ */
  function showPopup(msg, color) {
    const root = document.getElementById('ssRoot');
    if (!root) return;
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);z-index:55;font-family:Orbitron,sans-serif;font-size:.9rem;letter-spacing:.12em;color:${color};background:rgba(3,4,12,.9);padding:8px 20px;border-radius:10px;border:1.5px solid ${color};pointer-events:none;animation:ssPop .85s ease forwards;white-space:nowrap`;
    root.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function shakeElement(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.animation = 'ssShake .4s ease';
    setTimeout(() => { el.style.animation = 'ssPulse 2s infinite'; }, 450);
  }

  /* ══════════════════════════════════════════════════════════════
     EXIT
  ══════════════════════════════════════════════════════════════ */
  window.ll_startup_streetExit = function () {
    G = null;
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    if (_endTimer) { clearTimeout(_endTimer); _endTimer = null; }
    clearTimeout(window._ssInitTimer);
    if (window.state) state.viewingWorld = 'risktaker';
    goTo('hub');
  };

  /* ══════════════════════════════════════════════════════════════
     DEBUG HOOKS (console-only, for tracing the L1→L2→L3 chain)
  ══════════════════════════════════════════════════════════════ */
  window._ssDbg = () => G ? {
    lvIdx: G.lvIdx,
    level: G.lv ? G.lv.id : null,
    levelName: G.lv ? G.lv.name : null,
    round: G.round,
    totalRounds: G.totalRounds,
    profit: G.profit,
    happiness: G.happiness,
    score: G.score,
    phase: G.phase,
    roundTimer: G.roundTimer,
  } : null;

  window._ssForceFinish = () => {
    if (!G) return 'no game';
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    G.profit = 100;
    G.happiness = 100;
    G.round = G.totalRounds;
    const finishedIdx = G.lvIdx;
    resolveEnd(); // reads G.profit/G.happiness → 3 stars → calls endGame(3, false)
    return 'forced end at lvIdx ' + finishedIdx;
  };

})();
