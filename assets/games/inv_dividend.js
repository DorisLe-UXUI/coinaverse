/* ════════════════════════════════════════════════════════════════
   DIVIDEND DISTRICT — Passive income & compounding garden game
   Investopia Hub · accent #00C853
   Plant investments → collect dividends → reinvest → compound
   Level 1: Learn timing and reinvestment basics
   Level 2: Market fluctuations, rate changes, dynamic strategy
   Level 3: Global diversification — faster cycles, harsher events
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ACCENT      = '#00C853';
  const ACCENT_DIM  = '#00892f';
  const BG_DEEP     = '#03040c';
  const BG_CARD     = '#090f18';
  const GOLD        = '#FFD700';
  const WARN        = '#FF6B35';
  const EXPERT_RED  = '#FF3D3D';
  const CASH_START  = 500;
  const CYCLE_MS_L1 = 5000;   // dividend payout every 5s (level 1)
  const CYCLE_MS_L2 = 4000;   // faster in level 2
  const CYCLE_MS_L3 = 3000;   // fastest in level 3 — expert pacing
  const GAME_TIME   = 75;     // seconds per level
  const TARGET_L1   = 60;     // $60/month passive income to win level 1
  const TARGET_L2   = 120;    // $120/month passive income to win level 2
  const TARGET_L3   = 200;    // $200/month passive income to win level 3
  const THRESHOLD   = 0;      // passive income must stay >= 0 (no selling required in L1)
  const STAR3_L1    = 80;
  const STAR3_L2    = 150;
  const STAR3_L3    = 240;
  const STAR2_L1    = 60;
  const STAR2_L2    = 100;
  const STAR2_L3    = 170;

  // ── Tree definitions ─────────────────────────────────────────
  // minLevel gates a tree into the shop starting at that game level (default 1)
  const TREE_TYPES = [
    { id:'util',  name:'UtilCorp',    emoji:'🌳', color:'#4CAF50', basePay:8,  cost:100, upgCost:80,  maxLv:3, sector:'Utilities' },
    { id:'tech',  name:'TechDiv',     emoji:'🌲', color:'#00BCD4', basePay:12, cost:150, upgCost:100, maxLv:3, sector:'Technology' },
    { id:'reit',  name:'REIT Trust',  emoji:'🏡', color:'#FF9800', basePay:18, cost:200, upgCost:120, maxLv:3, sector:'Real Estate' },
    { id:'bond',  name:'BondFund',    emoji:'🍀', color:'#9C27B0', basePay:5,  cost:75,  upgCost:60,  maxLv:3, sector:'Bonds' },
    { id:'blue',  name:'BluechipDiv', emoji:'🌴', color:'#F44336', basePay:22, cost:250, upgCost:150, maxLv:3, sector:'Blue Chip' },
    { id:'intl',  name:'GlobalYield', emoji:'🌍', color:'#26C6DA', basePay:30, cost:320, upgCost:180, maxLv:3, sector:'International', minLevel:3 },
  ];

  const PLOTS_L1 = 4;
  const PLOTS_L2 = 6;
  const PLOTS_L3 = 8;

  // ── Market events for level 2+ ─────────────────────────────────
  const MARKET_EVENTS = [
    { type:'rate_up',   text:'⬆️ Interest rates rise — bonds yield more!',  sector:'Bonds',       mult:1.4, duration:12 },
    { type:'rate_down', text:'⬇️ Rate cut — REIT demand soars!',             sector:'Real Estate', mult:1.3, duration:10 },
    { type:'div_cut',   text:'✂️ TechDiv cuts dividend 30%!',                sector:'Technology',  mult:0.7, duration:15 },
    { type:'div_boost', text:'🚀 UtilCorp raises dividend!',                 sector:'Utilities',   mult:1.5, duration:12 },
    { type:'recession', text:'📉 Market slowdown hits Blue Chip!',           sector:'Blue Chip',   mult:0.6, duration:10 },
    { type:'boom',      text:'📈 Tech sector boom! TechDiv surging!',        sector:'Technology',  mult:1.6, duration:8  },
    { type:'merger',    text:'🤝 REIT merger — income spikes!',              sector:'Real Estate', mult:1.8, duration:8  },
    { type:'crisis',    text:'⚠️ Bond market stress — yields compressed.',   sector:'Bonds',       mult:0.75,duration:12 },
    { type:'currency',    text:'💱 Currency swing hits GlobalYield!',              sector:'International', mult:0.65,duration:10 },
    { type:'global_boom', text:'🌏 Global markets rally — GlobalYield soars!',     sector:'International', mult:1.7, duration:8  },
    { type:'tax_law',     text:'📜 New dividend tax law — all payouts dip briefly!', sector:'Bonds',      mult:0.8, duration:8  },
  ];

  let G = null;
  let raf = null;
  let _gen = 0;              // bumped on every (re)entry / reset — lets a stale,
                              // already-superseded deferred initGame() recognize
                              // it lost the race and bail out instead of
                              // clobbering whatever a newer entry already built
  let _eventsBound = false;   // guards bindEvents() from stacking duplicate
                              // listeners across "PLAY AGAIN" (which re-runs
                              // initGame() on the SAME #divd-root/buttons
                              // instead of a fresh mount)

  // ──────────────────────────────────────────────────────────────
  //  SCREEN ENTRY POINT
  // ──────────────────────────────────────────────────────────────
  window.SCREENS = window.SCREENS || {};

  /* ── COSMIC VISUAL SYSTEM — shared nebula/starfield/scanline recipe (see
     arcade.js .arc-wrap) applied here so the garden no longer sits on a flat
     solid background. Scoped to #divd-* ids/classes to avoid any collision
     with sibling mini-games. ── */
  function injectDivdCosmicStyle() {
    if (document.getElementById('divdCosmicStyle')) return;
    const s = document.createElement('style');
    s.id = 'divdCosmicStyle';
    s.textContent = `
      #divd-root{background:radial-gradient(130% 95% at 50% -8%,color-mix(in srgb,${ACCENT} 15%,#1a1240),#130d32 44%,#0A0429 100%)!important}
      #divd-root::after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(rgba(0,229,255,0) 50%,rgba(0,229,255,.025) 50%);background-size:100% 4px}
      .divd-stars{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
      .divd-star{position:absolute;border-radius:50%;background:#fff;animation:divdTwinkle 3.2s ease-in-out infinite}
      @keyframes divdTwinkle{0%,100%{opacity:.12}50%{opacity:.85}}
      @keyframes divdConfettiFall{0%{transform:translateY(-30px) rotate(0deg);opacity:1}100%{transform:translateY(460px) rotate(360deg);opacity:0}}
      .divd-confetti{position:absolute;top:-24px;font-size:1.3rem;animation:divdConfettiFall 1.7s ease-in forwards;pointer-events:none}
    `;
    document.head.appendChild(s);
  }
  function divdStarsHTML(n) {
    let out = '';
    for (let i = 0; i < (n || 42); i++) {
      const x = (i * 53.7) % 100, y = (i * 91.3 + 13) % 100, sz = 1 + (i % 3), dur = (2.4 + (i % 5) * .4).toFixed(1), delay = ((i * .37) % 3).toFixed(2);
      out += `<span class="divd-star" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${sz}px;height:${sz}px;animation-duration:${dur}s;animation-delay:${delay}s"></span>`;
    }
    return out;
  }
  function divdConfetti(count) {
    const root = document.getElementById('divd-root');
    if (!root) return;
    const colors = [ACCENT, GOLD, '#fff', '#00E676'];
    const emojis = ['✦', '●', '▲', '★'];
    let html = '';
    for (let i = 0; i < (count || 26); i++) {
      html += `<span class="divd-confetti" style="left:${(4 + Math.random() * 92).toFixed(1)}%;animation-delay:${(Math.random() * .5).toFixed(2)}s;color:${colors[i % colors.length]}">${emojis[i % emojis.length]}</span>`;
    }
    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:105;';
    layer.innerHTML = html;
    root.appendChild(layer);
    setTimeout(() => { if (layer.parentNode) layer.remove(); }, 2200);
  }

  window.SCREENS.game_inv_dividend = function () {
    G = null;
    _gen++;
    const myGen = _gen;
    _eventsBound = false;   // a brand-new #divd-root is about to be mounted
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    injectDivdCosmicStyle();
    // Deferred one tick so the HTML returned below has actually been inserted
    // into the DOM (goTo() assigns it to app.innerHTML right after this
    // function returns) before initGame() goes looking for #divd-root. The
    // generation check makes any now-stale call a no-op if the screen gets
    // entered again (e.g. a fast double-tap on the hub tile) before this
    // fires: previously, that second entry's own initGame() would win the
    // DOM lookup, but THIS older, delayed call could still fire afterward
    // and silently rebuild G from scratch — wiping out a game the player had
    // already started and tapped "GOT IT" on, leaving them stuck back on the
    // tutorial gate with no visible cause and no way to start.
    setTimeout(() => { if (myGen === _gen) initGame(); }, 40);
    return `<div id="divd-root" style="position:absolute;inset:0;background:${BG_DEEP};overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none">
      <div class="divd-stars">${divdStarsHTML(42)}</div>

      <!-- ── TOP BAR ── -->
      <div id="divd-topbar" style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(180deg,rgba(3,4,12,.95),transparent)">
        <button id="divd-exit-btn" style="padding:6px 13px;border:1px solid ${ACCENT_DIM};border-radius:8px;background:rgba(0,200,83,.1);color:${ACCENT};font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.14em;cursor:pointer;white-space:nowrap;flex-shrink:0">← INVEST</button>
        <div style="font-family:Orbitron,sans-serif;font-size:.72rem;letter-spacing:.2em;color:${ACCENT};flex:1;text-align:center">🌿 DIVIDEND DISTRICT</div>
        <button id="divd-help-btn" title="How to play" style="padding:6px 10px;border:1px solid ${ACCENT_DIM};border-radius:8px;background:rgba(0,200,83,.1);color:${ACCENT};cursor:pointer;flex-shrink:0;font-size:.78rem">❓</button>
        <div style="display:flex;gap:10px;align-items:center;flex-shrink:0">
          <div style="display:flex;flex-direction:column;align-items:center">
            <span style="font-family:Orbitron,sans-serif;font-size:.55rem;color:rgba(255,255,255,.45);letter-spacing:.1em">INCOME/MO</span>
            <span id="divd-income" style="font-family:Orbitron,sans-serif;font-size:.85rem;color:${ACCENT};font-variant-numeric:tabular-nums">$0</span>
          </div>
          <div style="width:1px;height:28px;background:rgba(0,200,83,.25)"></div>
          <div style="display:flex;flex-direction:column;align-items:center">
            <span style="font-family:Orbitron,sans-serif;font-size:.55rem;color:rgba(255,255,255,.45);letter-spacing:.1em">CASH</span>
            <span id="divd-cash" style="font-family:Orbitron,sans-serif;font-size:.85rem;color:${GOLD};font-variant-numeric:tabular-nums">$500</span>
          </div>
          <div style="width:1px;height:28px;background:rgba(0,200,83,.25)"></div>
          <div style="display:flex;flex-direction:column;align-items:center">
            <span style="font-family:Orbitron,sans-serif;font-size:.55rem;color:rgba(255,255,255,.45);letter-spacing:.1em">TIME</span>
            <span id="divd-timer" style="font-family:Orbitron,sans-serif;font-size:.85rem;color:#fff;font-variant-numeric:tabular-nums">75s</span>
          </div>
        </div>
      </div>

      <!-- ── LEVEL BADGE ── -->
      <div id="divd-lvlbadge" style="position:absolute;top:54px;left:50%;transform:translateX(-50%);z-index:18;font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.18em;color:rgba(0,200,83,.7);padding:3px 12px;border:1px solid rgba(0,200,83,.25);border-radius:20px;background:rgba(0,200,83,.06);white-space:nowrap">LEVEL 1 · LEARN</div>

      <!-- ── MARKET EVENT BANNER ── -->
      <div id="divd-event-banner" style="position:absolute;top:80px;left:16px;right:16px;z-index:17;display:none;padding:8px 14px;background:rgba(255,107,53,.18);border:1px solid rgba(255,107,53,.55);border-radius:10px;font-size:.75rem;color:#FFAB76;text-align:center;font-weight:600"></div>

      <!-- ── GARDEN AREA ── -->
      <div id="divd-garden" style="position:absolute;top:110px;left:0;right:0;bottom:160px;overflow:hidden"></div>

      <!-- ── TREE SHOP TRAY ── -->
      <div id="divd-shop" style="position:absolute;bottom:0;left:0;right:0;height:155px;background:linear-gradient(0deg,${BG_CARD},rgba(9,15,24,.95));border-top:1px solid rgba(0,200,83,.18);z-index:15;display:flex;flex-direction:column;padding:10px 12px 14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.16em;color:rgba(0,200,83,.65)">PLANT AN INVESTMENT</span>
          <button id="divd-reinvest-btn" style="padding:5px 14px;border:1px solid ${ACCENT};border-radius:8px;background:rgba(0,200,83,.15);color:${ACCENT};font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer;transition:.15s">REINVEST ALL</button>
        </div>
        <div id="divd-shop-row" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:none"></div>
      </div>

      <!-- ── TARGET BAR ── -->
      <div id="divd-targetbar" style="position:absolute;bottom:155px;left:16px;right:16px;z-index:14;display:flex;align-items:center;gap:10px;padding:5px 0">
        <span style="font-family:Orbitron,sans-serif;font-size:.5rem;color:rgba(255,255,255,.4);letter-spacing:.12em;white-space:nowrap">TARGET</span>
        <div style="flex:1;height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden">
          <div id="divd-progress-fill" style="height:100%;width:0%;background:linear-gradient(90deg,${ACCENT_DIM},${ACCENT});border-radius:3px;transition:width .4s ease"></div>
        </div>
        <span id="divd-target-label" style="font-family:Orbitron,sans-serif;font-size:.5rem;color:rgba(0,200,83,.7);white-space:nowrap">$0 / $60</span>
      </div>

      <!-- ── TOOLTIP ── -->
      <div id="divd-tooltip" style="position:absolute;z-index:50;display:none;pointer-events:none;max-width:180px;padding:8px 12px;background:rgba(9,15,24,.97);border:1px solid rgba(0,200,83,.4);border-radius:10px;font-size:.72rem;line-height:1.5;color:#d0f5e2"></div>

      <!-- ── FLOATING LABELS CANVAS ── -->
      <canvas id="divd-canvas" style="position:absolute;inset:0;pointer-events:none;z-index:16"></canvas>

    </div>`;
  };

  // ──────────────────────────────────────────────────────────────
  //  INIT
  // ──────────────────────────────────────────────────────────────
  function initGame() {
    const root = document.getElementById('divd-root');
    if (!root) return;

    _divdPauseStartTs = null;   // guard against a leftover pause timestamp from
                                 // a previous session bleeding into a fresh game
                                 // (closeHowToPlay() re-baselines the clock
                                 // whenever this is non-null)

    const numPlots = PLOTS_L1;
    G = {
      level: 1,
      cash: CASH_START,
      passiveIncome: 0,         // $/month total
      time: GAME_TIME,
      running: false,           // gated until the how-to-play intro is dismissed
      plots: buildPlots(numPlots),
      pendingPayouts: [],       // { plotIdx, amount, collected } — glowing icons above trees
      floats: [],               // floating +$ text
      particles: [],            // sparkle particles
      lastTick: performance.now(),
      lastCycleTick: performance.now(),
      eventActive: null,        // { event, endsAt }
      nextEventAt: 25 + Math.random() * 10,   // level 2 only
      totalCollected: 0,
      reinvestCount: 0,
      gameOver: false,
      pendingLevel2: false,
    };

    layoutPlots();
    renderShop();
    bindEvents();
    resizeCanvas();

    showHowToPlay();   // raf loop starts only once the player dismisses this
  }

  // ──────────────────────────────────────────────────────────────
  //  HOW-TO-PLAY TUTORIAL — shown once automatically before Level 1 starts,
  //  reopenable anytime via the ❓ button without losing time or progress.
  //  One explanation covers all 3 levels (same plant/collect/reinvest loop
  //  throughout — later levels just add market events and a faster clock).
  // ──────────────────────────────────────────────────────────────
  let _divdPauseStartTs = null;

  function showHowToPlay() {
    const root = document.getElementById('divd-root');
    if (!root) return;
    let overlay = document.getElementById('divd-help-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'divd-help-overlay';
      root.appendChild(overlay);
    }
    const wasRunning = !!(G && G.running);
    overlay.style.cssText = `
      position:absolute;inset:0;z-index:95;display:flex;flex-direction:column;
      align-items:center;justify-content:center;padding:24px;
      background:rgba(3,4,12,.93);backdrop-filter:blur(8px);
    `;
    overlay.innerHTML = `
      <div style="max-width:340px;width:100%;text-align:center;padding:26px 22px;background:${BG_CARD};border:1.5px solid ${ACCENT_DIM};border-radius:18px;box-shadow:0 0 40px rgba(0,200,83,.15)">
        <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.2em;color:${ACCENT};margin-bottom:10px">HOW TO PLAY</div>
        <div style="font-size:2rem;margin-bottom:8px">🌿</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.95rem;margin-bottom:14px;color:#eee">DIVIDEND DISTRICT</div>
        <ul style="list-style:none;margin:0 0 16px;padding:0;text-align:left;font-size:.72rem;color:rgba(255,255,255,.75);line-height:1.7">
          <li style="margin-bottom:8px">🎯 <b style="color:${ACCENT}">Goal:</b> grow your monthly passive income to hit the target before time runs out.</li>
          <li style="margin-bottom:8px">🌱 <b style="color:${ACCENT}">Plant:</b> tap a tree card in the shop tray, then tap an empty plot to plant it.</li>
          <li style="margin-bottom:8px">💰 <b style="color:${ACCENT}">Collect:</b> tap the glowing bubble above a tree to collect its dividend payout.</li>
          <li style="margin-bottom:8px">♻️ <b style="color:${ACCENT}">Reinvest:</b> tap REINVEST ALL to auto-upgrade trees — this is how income compounds.</li>
          <li>📉 Watch for market event banners — they boost or cut a sector's payouts for a while.</li>
        </ul>
        <button id="divd-help-dismiss" style="padding:12px 30px;border:none;border-radius:11px;background:${ACCENT};color:#03130f;font-family:Orbitron,sans-serif;font-size:.68rem;letter-spacing:.12em;font-weight:900;cursor:pointer">${wasRunning ? '▶ RESUME' : 'GOT IT — START ▶'}</button>
      </div>`;
    const btn = document.getElementById('divd-help-dismiss');
    if (btn) btn.onclick = () => closeHowToPlay();
  }

  function closeHowToPlay() {
    const overlay = document.getElementById('divd-help-overlay');
    if (overlay) overlay.remove();
    if (!G || G.gameOver) return;

    if (_divdPauseStartTs !== null) {
      // Re-baseline lastTick/lastCycleTick to "now" so the delta-time loop's
      // very first dt after resume is small (one frame), not the full paused
      // duration — this is the rAF equivalent of the setInterval epoch-shift
      // trick: it stops the pause from being counted as elapsed game time.
      const now = performance.now();
      G.lastTick = now;
      G.lastCycleTick = now;
      _divdPauseStartTs = null;
    }
    G.running = true;
    raf = requestAnimationFrame(loop);
  }

  // Re-open the tutorial mid-game via the ❓ button. Stops the rAF chain by
  // setting G.running=false — loop() early-returns on that flag and (crucially)
  // does NOT reschedule itself, so no more frames fire until closeHowToPlay()
  // manually restarts requestAnimationFrame with a fresh lastTick baseline.
  window.divdShowHelp = function () {
    if (!G || G.gameOver) return;
    if (G.running) {
      G.running = false;
      _divdPauseStartTs = performance.now();
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }
    showHowToPlay();
  };

  // ──────────────────────────────────────────────────────────────
  //  PLOT BUILDING
  // ──────────────────────────────────────────────────────────────
  function buildPlots(n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      // cyclePhaseMs staggers each plot's payout cadence so bubbles trickle in
      // one-by-one rather than every planted tree popping in perfect unison —
      // this does NOT change $/month income (computeTotalIncome sums basePay
      // regardless of collection timing), it only spreads out WHEN the
      // collectible bubbles visually appear, closing the long dead gaps.
      arr.push({ idx: i, treeType: null, level: 0, el: null, payout: null, pendingPay: 0, glowing: false, cyclePhaseMs: Math.floor(Math.random() * 1800) });
    }
    return arr;
  }

  function layoutPlots() {
    const garden = document.getElementById('divd-garden');
    if (!garden || !G) return;
    garden.innerHTML = '';

    const n = G.plots.length;
    const cols = n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);

    garden.style.display = 'grid';
    garden.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    garden.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    garden.style.gap = '12px';
    garden.style.padding = '14px 16px';

    G.plots.forEach((plot, i) => {
      const el = document.createElement('div');
      el.id = `divd-plot-${i}`;
      el.dataset.idx = i;
      el.style.cssText = `
        position:relative;display:flex;flex-direction:column;align-items:center;
        justify-content:flex-end;cursor:pointer;border-radius:14px;
        background:rgba(0,200,83,.05);border:1px dashed rgba(0,200,83,.2);
        padding:8px 6px 6px;min-height:80px;transition:border-color .2s,background .2s;
        touch-action:manipulation;
      `;

      const inner = document.createElement('div');
      inner.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;';

      const treeEmoji = document.createElement('div');
      treeEmoji.className = 'divd-tree-emoji';
      treeEmoji.style.cssText = 'font-size:2rem;line-height:1;transition:transform .3s;';
      treeEmoji.textContent = '🌱';

      const treeName = document.createElement('div');
      treeName.className = 'divd-tree-name';
      treeName.style.cssText = 'font-size:.58rem;color:rgba(255,255,255,.35);font-weight:500;text-align:center;min-height:.7rem;';

      const payLabel = document.createElement('div');
      payLabel.className = 'divd-tree-pay';
      payLabel.style.cssText = `font-family:Orbitron,sans-serif;font-size:.6rem;color:${ACCENT};min-height:.75rem;font-variant-numeric:tabular-nums;`;

      const upgradeBtn = document.createElement('button');
      upgradeBtn.className = 'divd-upg-btn';
      upgradeBtn.style.cssText = `display:none;margin-top:2px;padding:2px 8px;border:1px solid ${ACCENT_DIM};border-radius:6px;background:rgba(0,200,83,.12);color:${ACCENT};font-size:.52rem;font-family:Orbitron,sans-serif;cursor:pointer;white-space:nowrap;`;
      upgradeBtn.textContent = '⬆ UPGRADE';
      upgradeBtn.dataset.idx = i;

      // payout collector bubble
      const bubble = document.createElement('div');
      bubble.className = 'divd-payout-bubble';
      bubble.style.cssText = `
        position:absolute;top:-18px;left:50%;transform:translateX(-50%);
        display:none;background:${ACCENT};color:#03040c;font-family:Orbitron,sans-serif;
        font-size:.62rem;padding:3px 8px;border-radius:20px;font-weight:700;
        cursor:pointer;z-index:10;animation:divd-pulse 0.7s ease-in-out infinite;
        white-space:nowrap;font-variant-numeric:tabular-nums;
        box-shadow:0 0 12px rgba(0,200,83,.8);
      `;
      bubble.dataset.idx = i;

      inner.append(treeEmoji, treeName, payLabel, upgradeBtn);
      el.append(bubble, inner);
      garden.append(el);
      plot.el = el;
      plot.payBubble = bubble;

      // Hover tooltip
      el.addEventListener('mouseenter', (e) => showPlotTooltip(i, e));
      el.addEventListener('mouseleave', hideTooltip);
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('divd-upg-btn') || e.target === upgradeBtn) {
          handleUpgrade(i);
        } else if (e.target === bubble || e.target.closest('.divd-payout-bubble') === bubble) {
          collectPayout(i);
        } else {
          handlePlotTap(i);
        }
      });
      upgradeBtn.addEventListener('click', (e) => { e.stopPropagation(); handleUpgrade(i); });
      bubble.addEventListener('click', (e) => { e.stopPropagation(); collectPayout(i); });
    });

    // inject pulse animation
    if (!document.getElementById('divd-style')) {
      const s = document.createElement('style');
      s.id = 'divd-style';
      s.textContent = `
        @keyframes divd-pulse { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.1)} }
        @keyframes divd-sway { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
        @keyframes divd-glow { 0%,100%{box-shadow:0 0 10px rgba(0,200,83,.4),inset 0 0 6px rgba(0,200,83,.1)} 50%{box-shadow:0 0 22px rgba(0,200,83,.7),inset 0 0 12px rgba(0,200,83,.18)} }
        .divd-plot-planted { animation:divd-glow 2.5s ease-in-out infinite !important; border-color:rgba(0,200,83,.5) !important; background:rgba(0,200,83,.08) !important; }
        .divd-tree-sway { animation:divd-sway 3s ease-in-out infinite; }
      `;
      document.head.append(s);
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  SHOP RENDER
  // ──────────────────────────────────────────────────────────────
  function renderShop() {
    const row = document.getElementById('divd-shop-row');
    if (!row) return;
    row.innerHTML = '';

    // Level 1 only sees the first 3 trees; later trees (incl. minLevel-gated ones) unlock progressively.
    const types = G.level === 1
      ? TREE_TYPES.slice(0, 3)
      : TREE_TYPES.filter(t => (t.minLevel || 1) <= G.level);

    types.forEach(t => {
      const card = document.createElement('div');
      card.dataset.treeId = t.id;
      const canAfford = G.cash >= t.cost;
      card.style.cssText = `
        flex-shrink:0;width:90px;padding:8px 8px 6px;border-radius:10px;
        border:1px solid ${canAfford ? t.color + '80' : 'rgba(255,255,255,.1)'};
        background:${canAfford ? 'rgba(0,200,83,.06)' : 'rgba(255,255,255,.03)'};
        cursor:${canAfford ? 'pointer' : 'not-allowed'};opacity:${canAfford ? '1' : '.45'};
        display:flex;flex-direction:column;align-items:center;gap:3px;transition:.15s;
        touch-action:manipulation;
      `;
      card.innerHTML = `
        <div style="font-size:1.5rem;line-height:1">${t.emoji}</div>
        <div style="font-size:.58rem;font-weight:700;color:${t.color};text-align:center;line-height:1.2">${t.name}</div>
        <div style="font-size:.52rem;color:rgba(255,255,255,.5);text-align:center">${t.sector}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.62rem;color:${ACCENT};margin-top:2px">+$${t.basePay}/mo</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.58rem;color:${GOLD}">$${t.cost}</div>
      `;
      if (canAfford) {
        card.addEventListener('click', () => selectTreeType(t.id));
        card.addEventListener('mouseenter', () => { card.style.borderColor = t.color; card.style.background = 'rgba(0,200,83,.12)'; });
        card.addEventListener('mouseleave', () => { card.style.borderColor = t.color + '80'; card.style.background = 'rgba(0,200,83,.06)'; });
      }
      row.append(card);
    });

    // Add "buy" cursor tracking
    if (G.selectedTree) {
      row.querySelectorAll('[data-tree-id]').forEach(c => {
        if (c.dataset.treeId === G.selectedTree) {
          c.style.borderColor = ACCENT;
          c.style.boxShadow = `0 0 10px ${ACCENT}60`;
        }
      });
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  SELECTION + PLANTING
  // ──────────────────────────────────────────────────────────────
  function selectTreeType(id) {
    G.selectedTree = (G.selectedTree === id) ? null : id;
    renderShop();
    if (G.selectedTree) {
      const t = TREE_TYPES.find(x => x.id === id);
      showToast(`🌱 Tap an empty plot to plant ${t.name}`, 2000);
    }
  }

  function handlePlotTap(idx) {
    if (!G) return;
    const plot = G.plots[idx];
    if (!plot) return;

    if (plot.pendingPay > 0) { collectPayout(idx); return; }

    if (!G.selectedTree) {
      if (plot.treeType) {
        const t = TREE_TYPES.find(x => x.id === plot.treeType);
        showToast(`${t.emoji} ${t.name} — Lv.${plot.level} · paying $${computePayout(plot)}/mo`, 2200);
      } else {
        showToast('Tap a tree card below to select, then tap this plot.', 2000);
      }
      return;
    }

    if (plot.treeType) {
      showToast('This plot already has a tree!', 1500);
      return;
    }

    const t = TREE_TYPES.find(x => x.id === G.selectedTree);
    if (!t) return;

    if (G.cash < t.cost) {
      showToast(`Need $${t.cost} to plant ${t.name}!`, 1800);
      return;
    }

    // Plant!
    G.cash -= t.cost;
    plot.treeType = t.id;
    plot.level = 1;
    plot.pendingPay = 0;
    plot.cycleProgress = 0;
    G.selectedTree = null;
    G.passiveIncome = computeTotalIncome();

    updatePlotEl(plot);
    renderShop();
    updateHUD();
    spawnFloat(plot.el, `🌱 +${t.name}!`, ACCENT, 18);
  }

  function handleUpgrade(idx) {
    if (!G) return;
    const plot = G.plots[idx];
    if (!plot || !plot.treeType) return;
    const t = TREE_TYPES.find(x => x.id === plot.treeType);
    if (!t) return;

    if (plot.level >= t.maxLv) { showToast('Already at max level!', 1500); return; }

    const cost = t.upgCost * plot.level;
    if (G.cash < cost) { showToast(`Need $${cost} to upgrade!`, 1800); return; }

    G.cash -= cost;
    plot.level++;
    G.passiveIncome = computeTotalIncome();
    updatePlotEl(plot);
    renderShop();
    updateHUD();
    spawnFloat(plot.el, `⬆ Level ${plot.level}!`, GOLD, 20);
    // sparkles
    for (let i = 0; i < 10; i++) spawnParticle(plot.el, ACCENT);
  }

  function collectPayout(idx) {
    if (!G) return;
    const plot = G.plots[idx];
    if (!plot || plot.pendingPay <= 0) return;
    const amt = plot.pendingPay;
    plot.pendingPay = 0;
    plot.payBubble.style.display = 'none';
    G.cash += amt;
    G.totalCollected += amt;

    spawnFloat(plot.el, `+$${amt}`, ACCENT, 22);
    for (let i = 0; i < 6; i++) spawnParticle(plot.el, ACCENT);
    updateHUD();
  }

  // ──────────────────────────────────────────────────────────────
  //  REINVEST
  // ──────────────────────────────────────────────────────────────
  function handleReinvest() {
    if (!G) return;
    // Collect all pending first
    G.plots.forEach(p => { if (p.pendingPay > 0) collectPayout(p.idx); });

    // Auto-upgrade trees that can be upgraded, cheapest first
    let reinvested = false;
    const upgradeable = G.plots
      .filter(p => p.treeType && p.level < (TREE_TYPES.find(x => x.id === p.treeType)?.maxLv || 3))
      .sort((a, b) => {
        const ta = TREE_TYPES.find(x => x.id === a.treeType);
        const tb = TREE_TYPES.find(x => x.id === b.treeType);
        return (ta.upgCost * a.level) - (tb.upgCost * b.level);
      });

    for (const p of upgradeable) {
      const t = TREE_TYPES.find(x => x.id === p.treeType);
      const cost = t.upgCost * p.level;
      if (G.cash >= cost) {
        G.cash -= cost;
        p.level++;
        reinvested = true;
        G.reinvestCount++;
        spawnFloat(p.el, `♻ Reinvested!`, '#00E676', 16);
        for (let i = 0; i < 8; i++) spawnParticle(p.el, ACCENT);
        updatePlotEl(p);
      }
    }

    if (reinvested) {
      G.passiveIncome = computeTotalIncome();
      updateHUD();
      renderShop();
      showToast('💹 Compounding in action!', 2000);
    } else {
      showToast('Collect dividends first, then reinvest!', 2000);
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  PAYOUT COMPUTATION
  // ──────────────────────────────────────────────────────────────
  function computePayout(plot) {
    if (!plot.treeType) return 0;
    const t = TREE_TYPES.find(x => x.id === plot.treeType);
    if (!t) return 0;
    let pay = t.basePay * plot.level;

    // Market event multiplier
    if (G.eventActive) {
      const ev = G.eventActive.event;
      if (t.sector === ev.sector) pay = Math.round(pay * ev.mult);
    }
    return pay;
  }

  function computeTotalIncome() {
    if (!G) return 0;
    return G.plots.reduce((s, p) => s + computePayout(p), 0);
  }

  // ──────────────────────────────────────────────────────────────
  //  PLOT ELEMENT UPDATE
  // ──────────────────────────────────────────────────────────────
  function updatePlotEl(plot) {
    const el = plot.el;
    if (!el) return;

    const emojiEl = el.querySelector('.divd-tree-emoji');
    const nameEl  = el.querySelector('.divd-tree-name');
    const payEl   = el.querySelector('.divd-tree-pay');
    const upgBtn  = el.querySelector('.divd-upg-btn');

    if (!plot.treeType) {
      emojiEl.textContent = '🌱';
      nameEl.textContent = 'Empty Plot';
      nameEl.style.color = 'rgba(255,255,255,.3)';
      payEl.textContent = '';
      upgBtn.style.display = 'none';
      el.classList.remove('divd-plot-planted');
      emojiEl.classList.remove('divd-tree-sway');
      return;
    }

    const t = TREE_TYPES.find(x => x.id === plot.treeType);
    const pay = computePayout(plot);
    const lvEmoji = plot.level === 1 ? '' : plot.level === 2 ? '✨' : '🌟';

    // Tree emoji grows with level
    const emojisByLevel = { 1: t.emoji, 2: t.emoji, 3: t.emoji };
    emojiEl.textContent = emojisByLevel[plot.level];
    emojiEl.style.fontSize = plot.level === 1 ? '1.8rem' : plot.level === 2 ? '2.2rem' : '2.6rem';
    emojiEl.style.filter = plot.level === 3 ? 'drop-shadow(0 0 8px gold)' : 'none';
    emojiEl.classList.add('divd-tree-sway');

    nameEl.textContent = `${t.name} ${lvEmoji}Lv${plot.level}`;
    nameEl.style.color = t.color;
    payEl.textContent = `+$${pay}/mo`;

    const maxLv = t.maxLv;
    if (plot.level < maxLv) {
      const cost = t.upgCost * plot.level;
      upgBtn.style.display = 'inline-block';
      upgBtn.textContent = `⬆ $${cost}`;
      upgBtn.style.opacity = G.cash >= cost ? '1' : '.45';
    } else {
      upgBtn.style.display = 'none';
    }

    el.classList.add('divd-plot-planted');
    el.style.borderStyle = 'solid';
  }

  function updateAllPlots() {
    if (!G) return;
    G.plots.forEach(p => updatePlotEl(p));
  }

  // ──────────────────────────────────────────────────────────────
  //  PAYOUT BUBBLE
  // ──────────────────────────────────────────────────────────────
  function showPayoutBubble(plot) {
    if (!plot.el || !plot.treeType) return;
    const pay = computePayout(plot);
    plot.pendingPay = pay;
    const bubble = plot.payBubble;
    bubble.textContent = `+$${pay} 💰`;
    bubble.style.display = 'block';
    // bounce in
    bubble.style.animation = 'none';
    void bubble.offsetWidth;
    bubble.style.animation = 'divd-pulse 0.7s ease-in-out infinite';
  }

  // ──────────────────────────────────────────────────────────────
  //  HUD UPDATE
  // ──────────────────────────────────────────────────────────────
  function updateHUD() {
    const incEl   = document.getElementById('divd-income');
    const cashEl  = document.getElementById('divd-cash');
    const fillEl  = document.getElementById('divd-progress-fill');
    const targEl  = document.getElementById('divd-target-label');

    const target  = G.level === 1 ? TARGET_L1 : G.level === 2 ? TARGET_L2 : TARGET_L3;

    if (incEl)  incEl.textContent  = `$${G.passiveIncome}`;
    if (cashEl) cashEl.textContent = `$${Math.floor(G.cash)}`;

    const pct = Math.min(100, (G.passiveIncome / target) * 100);
    if (fillEl) fillEl.style.width = pct + '%';
    if (targEl) targEl.textContent = `$${G.passiveIncome} / $${target}`;

    // income color warning
    if (incEl) {
      incEl.style.color = G.passiveIncome >= target ? GOLD : G.passiveIncome > 0 ? ACCENT : '#FF6B35';
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  MAIN GAME LOOP
  // ──────────────────────────────────────────────────────────────
  function loop(ts) {
    if (!G || !G.running) return;

    const dt = (ts - G.lastTick) / 1000;
    G.lastTick = ts;

    // Timer
    G.time -= dt;
    const timerEl = document.getElementById('divd-timer');
    if (timerEl) {
      const t = Math.max(0, Math.ceil(G.time));
      timerEl.textContent = t + 's';
      timerEl.style.color = t <= 10 ? WARN : '#fff';
    }

    // Dividend cycle — trigger payouts for planted trees
    const cycleMs = G.level === 1 ? CYCLE_MS_L1 : G.level === 2 ? CYCLE_MS_L2 : CYCLE_MS_L3;
    if (ts - G.lastCycleTick >= cycleMs) {
      G.lastCycleTick = ts;
      G.plots.forEach(p => {
        if (p.treeType && p.pendingPay === 0) showPayoutBubble(p);
      });
    }

    // Level 2+ market events (level 3 keeps events firing, pulling from the expanded pool)
    if (G.level >= 2) {
      if (G.eventActive && ts / 1000 > G.eventActive.endsAt) {
        G.eventActive = null;
        const banner = document.getElementById('divd-event-banner');
        if (banner) banner.style.display = 'none';
        G.passiveIncome = computeTotalIncome();
        updateAllPlots();
        updateHUD();
      }
      if (!G.eventActive && G.time < G.nextEventAt) {
        triggerMarketEvent(ts);
      }
    }

    // Particles
    updateParticles(dt);
    updateFloats(dt);

    // Time up?
    if (G.time <= 0) {
      G.running = false;
      G.gameOver = true;
      const finalIncome = G.passiveIncome;
      const target = G.level === 1 ? TARGET_L1 : G.level === 2 ? TARGET_L2 : TARGET_L3;
      const star3   = G.level === 1 ? STAR3_L1 : G.level === 2 ? STAR3_L2 : STAR3_L3;
      const star2   = G.level === 1 ? STAR2_L1 : G.level === 2 ? STAR2_L2 : STAR2_L3;

      if (G.level === 1 && finalIncome >= TARGET_L1) {
        // Advance to level 2
        showLevel1Win(finalIncome, star3, star2);
      } else if (G.level === 2 && finalIncome >= TARGET_L2) {
        // Advance to level 3
        showLevel2Win(finalIncome, star3, star2);
      } else {
        const stars = finalIncome >= star3 ? 3 : finalIncome >= star2 ? 2 : finalIncome > 0 ? 1 : 0;
        endGame(stars, finalIncome);
      }
      return;
    }

    raf = requestAnimationFrame(loop);
  }

  // ──────────────────────────────────────────────────────────────
  //  LEVEL 2 TRANSITION
  // ──────────────────────────────────────────────────────────────
  function showLevel1Win(income, star3, star2) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute;inset:0;z-index:90;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:16px;
      background:rgba(3,4,12,.92);backdrop-filter:blur(6px);
    `;
    overlay.innerHTML = `
      <div style="font-family:Orbitron,sans-serif;font-size:1.3rem;color:${ACCENT};letter-spacing:.12em;text-align:center">LEVEL 1 CLEARED!</div>
      <div style="font-size:2.5rem">🌟🌟</div>
      <div style="font-size:.9rem;color:rgba(255,255,255,.7);text-align:center;max-width:280px;line-height:1.6">
        You built <span style="color:${ACCENT};font-weight:700">$${income}/month</span> in passive income!<br>
        <span style="color:${GOLD}">Now face real market conditions…</span>
      </div>
      <button id="divd-l2-btn" style="padding:12px 28px;border:2px solid ${ACCENT};border-radius:12px;background:rgba(0,200,83,.15);color:${ACCENT};font-family:Orbitron,sans-serif;font-size:.8rem;letter-spacing:.18em;cursor:pointer;">LEVEL 2 — MASTER</button>
    `;
    const root = document.getElementById('divd-root');
    if (root) root.append(overlay);

    document.getElementById('divd-l2-btn')?.addEventListener('click', () => {
      overlay.remove();
      startLevel2();
    });
  }

  function startLevel2() {
    // Keep existing trees, add more plots, harder target
    const extraPlots = PLOTS_L2 - G.plots.length;
    for (let i = 0; i < extraPlots; i++) {
      G.plots.push({ idx: G.plots.length, treeType: null, level: 0, el: null, payBubble: null, pendingPay: 0 });
    }
    G.level = 2;
    G.time = GAME_TIME;
    G.running = true;
    G.eventActive = null;
    G.nextEventAt = 60 - 15;
    G.lastCycleTick = performance.now();
    G.lastTick = performance.now();

    const badge = document.getElementById('divd-lvlbadge');
    if (badge) { badge.textContent = 'LEVEL 2 · MASTER'; badge.style.color = GOLD; badge.style.borderColor = 'rgba(255,215,0,.35)'; }

    const targetBar = document.getElementById('divd-target-label');
    if (targetBar) targetBar.textContent = `$${G.passiveIncome} / $${TARGET_L2}`;

    layoutPlots();
    G.plots.forEach(p => { if (p.treeType) updatePlotEl(p); });
    renderShop();
    updateHUD();

    raf = requestAnimationFrame(loop);
  }

  // ──────────────────────────────────────────────────────────────
  //  LEVEL 3 TRANSITION
  // ──────────────────────────────────────────────────────────────
  function showLevel2Win(income, star3, star2) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute;inset:0;z-index:90;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:16px;
      background:rgba(3,4,12,.92);backdrop-filter:blur(6px);
    `;
    overlay.innerHTML = `
      <div style="font-family:Orbitron,sans-serif;font-size:1.3rem;color:${GOLD};letter-spacing:.12em;text-align:center">LEVEL 2 CLEARED!</div>
      <div style="font-size:2.5rem">🌟🌟🌟</div>
      <div style="font-size:.9rem;color:rgba(255,255,255,.7);text-align:center;max-width:280px;line-height:1.6">
        You built <span style="color:${GOLD};font-weight:700">$${income}/month</span> in passive income through real market swings!<br>
        <span style="color:${EXPERT_RED}">Ready to diversify globally?</span>
      </div>
      <button id="divd-l3-btn" style="padding:12px 28px;border:2px solid ${EXPERT_RED};border-radius:12px;background:rgba(255,61,61,.15);color:${EXPERT_RED};font-family:Orbitron,sans-serif;font-size:.8rem;letter-spacing:.18em;cursor:pointer;">LEVEL 3 — EXPERT</button>
    `;
    const root = document.getElementById('divd-root');
    if (root) root.append(overlay);

    document.getElementById('divd-l3-btn')?.addEventListener('click', () => {
      overlay.remove();
      startLevel3();
    });
  }

  function startLevel3() {
    // Keep existing trees, add more plots, hardest target, faster cycles + events
    const extraPlots = PLOTS_L3 - G.plots.length;
    for (let i = 0; i < extraPlots; i++) {
      G.plots.push({ idx: G.plots.length, treeType: null, level: 0, el: null, payBubble: null, pendingPay: 0 });
    }
    G.level = 3;
    G.time = GAME_TIME;
    G.running = true;
    G.eventActive = null;
    G.nextEventAt = 60 - 10;   // shorter runway than level 2 — first event lands sooner
    G.lastCycleTick = performance.now();
    G.lastTick = performance.now();

    const badge = document.getElementById('divd-lvlbadge');
    if (badge) { badge.textContent = 'LEVEL 3 · EXPERT'; badge.style.color = EXPERT_RED; badge.style.borderColor = 'rgba(255,61,61,.35)'; }

    const targetBar = document.getElementById('divd-target-label');
    if (targetBar) targetBar.textContent = `$${G.passiveIncome} / $${TARGET_L3}`;

    layoutPlots();
    G.plots.forEach(p => { if (p.treeType) updatePlotEl(p); });
    renderShop();
    updateHUD();

    raf = requestAnimationFrame(loop);
  }

  // ──────────────────────────────────────────────────────────────
  //  MARKET EVENTS (LEVEL 2+)
  // ──────────────────────────────────────────────────────────────
  function triggerMarketEvent(ts) {
    const ev = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    G.eventActive = { event: ev, endsAt: ts / 1000 + ev.duration };
    G.nextEventAt = G.time - (ev.duration + 5 + Math.random() * 8);
    G.passiveIncome = computeTotalIncome();

    const banner = document.getElementById('divd-event-banner');
    if (banner) {
      banner.textContent = ev.text;
      banner.style.display = 'block';
      banner.style.borderColor = ev.mult >= 1 ? `rgba(0,200,83,.55)` : 'rgba(255,107,53,.55)';
      banner.style.background  = ev.mult >= 1 ? 'rgba(0,200,83,.12)' : 'rgba(255,107,53,.18)';
      banner.style.color       = ev.mult >= 1 ? '#A5F3C8' : '#FFAB76';
    }

    updateAllPlots();
    updateHUD();
    for (let i = 0; i < 12; i++) spawnParticle(null, ev.mult >= 1 ? ACCENT : WARN);
  }

  // ──────────────────────────────────────────────────────────────
  //  END GAME
  // ──────────────────────────────────────────────────────────────
  function endGame(stars, finalIncome) {
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_inv_dividend', { level: G.level, stars, badge: 'Passive Income', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('inv_wealth', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    const starStr  = stars > 0 ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆';
    const target   = G.level === 1 ? TARGET_L1 : G.level === 2 ? TARGET_L2 : TARGET_L3;
    const star3    = G.level === 1 ? STAR3_L1 : G.level === 2 ? STAR3_L2 : STAR3_L3;
    const efficiency = G.reinvestCount;

    // Badges
    const badges = [];
    if (finalIncome >= star3) badges.push({ e: '💰', t: 'Passive Income Badge' });
    if (G.reinvestCount >= 3)  badges.push({ e: '♻', t: 'Compounding Bonus' });
    if (finalIncome > 0) badges.push({ e: '📈', t: 'Dividend Streak' });

    const badgeHTML = badges.map(b => `<div style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border:1px solid rgba(0,200,83,.3);border-radius:20px;background:rgba(0,200,83,.08);font-size:.65rem;color:${ACCENT}">${b.e} ${b.t}</div>`).join('');

    const overlay = document.createElement('div');
    overlay.id = 'divd-end-overlay';
    overlay.style.cssText = `
      position:absolute;inset:0;z-index:100;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:12px;padding:24px 20px;
      background:rgba(3,4,12,.93);backdrop-filter:blur(8px);overflow-y:auto;
    `;

    overlay.innerHTML = `
      <div style="font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.22em;color:${ACCENT};opacity:.7;text-transform:uppercase;margin-bottom:2px">DIVIDEND DISTRICT</div>
      <div style="font-size:2.4rem;letter-spacing:.15em">${starStr}</div>
      <div style="font-family:Orbitron,sans-serif;font-size:1.5rem;color:${finalIncome >= target ? GOLD : ACCENT};font-variant-numeric:tabular-nums">$${finalIncome}<span style="font-size:.75rem;color:rgba(255,255,255,.5)">/month</span></div>
      ${finalIncome >= target ? `<div style="font-size:.75rem;color:${ACCENT};font-weight:600">Target Reached! 🎯</div>` : `<div style="font-size:.72rem;color:rgba(255,107,53,.8)">Target: $${target}/month — keep planting!</div>`}

      <div style="display:flex;align-items:center;gap:8px;padding:8px 18px;border:1px solid rgba(255,215,0,.3);border-radius:10px;background:rgba(255,215,0,.06);">
        <span style="font-size:1.2rem">🪙</span>
        <span style="font-family:Orbitron,sans-serif;font-size:1rem;color:${GOLD}">${coins} COINS</span>
      </div>

      ${badges.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:300px">${badgeHTML}</div>` : ''}

      <div style="max-width:280px;padding:12px 16px;background:rgba(0,200,83,.06);border:1px solid rgba(0,200,83,.2);border-radius:12px;text-align:center;font-size:.75rem;color:rgba(255,255,255,.65);line-height:1.65;font-style:italic">
        💡 <strong style="color:${ACCENT}">Lesson:</strong> Dividend investing creates money while you sleep — the secret is reinvesting every payout so compounding multiplies your income over time.
      </div>

      <div style="display:flex;gap:12px;margin-top:6px">
        <button id="divd-play-again" style="padding:11px 22px;border:2px solid ${ACCENT};border-radius:11px;background:rgba(0,200,83,.12);color:${ACCENT};font-family:Orbitron,sans-serif;font-size:.68rem;letter-spacing:.16em;cursor:pointer;">▶ PLAY AGAIN</button>
        <button id="divd-hub-btn" style="padding:11px 22px;border:2px solid rgba(255,255,255,.2);border-radius:11px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);font-family:Orbitron,sans-serif;font-size:.68rem;letter-spacing:.16em;cursor:pointer;">← HUB</button>
      </div>
    `;

    const root = document.getElementById('divd-root');
    if (root) root.append(overlay);

    // Celebration confetti on a real win (2-3 stars) — matches the
    // confetti-on-real-wins-only language used across the app.
    if (stars >= 2) divdConfetti(stars === 3 ? 34 : 18);

    document.getElementById('divd-play-again')?.addEventListener('click', () => {
      overlay.remove();
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      G = null;
      // Unlike the very first entry, #divd-root and every child element
      // (garden plots, shop cards, the exit/reinvest/help buttons) are
      // already mounted and are NOT being torn down here — only G itself is
      // being reset — so there is nothing to wait a tick for. Calling
      // initGame() synchronously means G goes directly from "the game that
      // just ended" to "a freshly-built G with plots ready", with no gap in
      // between where the still-interactive old plot tiles / REINVEST ALL
      // button could be tapped while G was null. That gap is exactly what
      // used to throw "Cannot read properties of null (reading 'plots')" on
      // a stray tap, and — via the same deferred-initGame mechanism used on
      // first entry — could also let a slow rebuild silently stomp a game
      // already in progress.
      initGame();
    });
    document.getElementById('divd-hub-btn')?.addEventListener('click', () => {
      window.inv_dividendExit();
    });
  }

  // ──────────────────────────────────────────────────────────────
  //  EXIT FUNCTION
  // ──────────────────────────────────────────────────────────────
  window.inv_dividendExit = function () {
    _gen++;   // invalidate any still-pending deferred initGame() from this session
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    document.removeEventListener('keydown', kbHandler);
    window.removeEventListener('resize', resizeCanvas);
    _eventsBound = false;
    G = null;
    if (window.state) state.viewingWorld = 'investor';
    goTo('hub');
  };

  // ──────────────────────────────────────────────────────────────
  //  DEBUG HOOKS (dev only — safe no-ops when no game is running)
  // ──────────────────────────────────────────────────────────────
  window._divdDbg = () => G ? { level: G.level, time: G.time, passiveIncome: G.passiveIncome, cash: Math.round(G.cash), plots: G.plots.length, running: G.running, gameOver: G.gameOver, lastTick: G.lastTick, paused: _divdPauseStartTs !== null } : null;
  window._divdForceLevel3 = () => {
    if (!G) return 'no game running';
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    startLevel3();
    return 'forced to level 3 — check window._divdDbg()';
  };

  // ──────────────────────────────────────────────────────────────
  //  VISUAL HELPERS — Particles & Floats
  // ──────────────────────────────────────────────────────────────
  function resizeCanvas() {
    const c = document.getElementById('divd-canvas');
    if (!c) return;
    c.width = c.offsetWidth || window.innerWidth;
    c.height = c.offsetHeight || window.innerHeight;
  }

  function spawnFloat(refEl, text, color, size) {
    const canvas = document.getElementById('divd-canvas');
    if (!canvas || !refEl) return;
    const rect = refEl.getBoundingClientRect();
    const cRect = canvas.getBoundingClientRect();
    G.floats.push({
      x: rect.left - cRect.left + rect.width / 2,
      y: rect.top - cRect.top,
      text, color, size: size || 16,
      life: 1.2, maxLife: 1.2,
      vy: -(40 + Math.random() * 20),
    });
  }

  function spawnParticle(refEl, color) {
    const canvas = document.getElementById('divd-canvas');
    if (!canvas) return;
    let cx = canvas.width / 2, cy = canvas.height / 2;
    if (refEl) {
      const rect = refEl.getBoundingClientRect();
      const cRect = canvas.getBoundingClientRect();
      cx = rect.left - cRect.left + rect.width / 2;
      cy = rect.top - cRect.top + rect.height / 2;
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 80;
    G.particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: color || ACCENT,
      r: 2 + Math.random() * 3,
      life: 0.8 + Math.random() * 0.4,
      maxLife: 1.0,
    });
  }

  function updateParticles(dt) {
    const canvas = document.getElementById('divd-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Particles
    G.particles = G.particles.filter(p => p.life > 0);
    G.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt; // gravity
      p.life -= dt;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = hexAlpha(p.color, alpha);
      ctx.fill();
    });

    // Floats
    G.floats = G.floats.filter(f => f.life > 0);
    G.floats.forEach(f => {
      f.y += f.vy * dt;
      f.vy *= 0.95;
      f.life -= dt;
      const alpha = Math.min(1, f.life / (f.maxLife * 0.4));
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = `bold ${f.size}px Orbitron, Inter, sans-serif`;
      ctx.fillStyle = f.color;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  function updateFloats(dt) { /* handled inside updateParticles */ }

  function hexAlpha(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a.toFixed(2)})`;
  }

  // ──────────────────────────────────────────────────────────────
  //  TOOLTIP
  // ──────────────────────────────────────────────────────────────
  function showPlotTooltip(idx, e) {
    if (!G) return;
    const plot = G.plots[idx];
    if (!plot) return;
    const tip = document.getElementById('divd-tooltip');
    if (!tip) return;

    let html = '';
    if (plot.treeType) {
      const t = TREE_TYPES.find(x => x.id === plot.treeType);
      const pay = computePayout(plot);
      const upgCost = t.upgCost * plot.level;
      html = `<b style="color:${t.color}">${t.emoji} ${t.name}</b><br>
              Level ${plot.level} / ${t.maxLv}<br>
              Payout: <b style="color:${ACCENT}">+$${pay}/cycle</b><br>
              ${plot.level < t.maxLv ? `Upgrade: <b style="color:${GOLD}">$${upgCost}</b>` : '<span style="color:gold">MAX LEVEL</span>'}
              ${plot.pendingPay > 0 ? `<br><b style="color:${ACCENT}">💰 $${plot.pendingPay} ready!</b>` : ''}`;
    } else {
      html = '<span style="color:rgba(255,255,255,.5)">Empty plot — select a tree and tap to plant!</span>';
    }

    tip.innerHTML = html;
    tip.style.display = 'block';

    const root = document.getElementById('divd-root');
    const rRect = root ? root.getBoundingClientRect() : { left: 0, top: 0 };
    let tx = e.clientX - rRect.left + 12;
    let ty = e.clientY - rRect.top - 10;
    if (tx + 190 > (root?.offsetWidth || 400)) tx -= 200;
    tip.style.left = tx + 'px';
    tip.style.top  = ty + 'px';
  }

  function hideTooltip() {
    const tip = document.getElementById('divd-tooltip');
    if (tip) tip.style.display = 'none';
  }

  // ──────────────────────────────────────────────────────────────
  //  TOAST
  // ──────────────────────────────────────────────────────────────
  function showToast(msg, dur) {
    let t = document.getElementById('divd-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'divd-toast';
      t.style.cssText = `
        position:absolute;bottom:170px;left:50%;transform:translateX(-50%);z-index:80;
        padding:7px 16px;border-radius:20px;background:rgba(0,200,83,.18);
        border:1px solid rgba(0,200,83,.4);color:#A5F3C8;font-size:.73rem;
        font-weight:600;white-space:nowrap;pointer-events:none;transition:opacity .3s;
      `;
      const root = document.getElementById('divd-root');
      if (root) root.append(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._tid);
    t._tid = setTimeout(() => { t.style.opacity = '0'; }, dur || 2000);
  }

  // ──────────────────────────────────────────────────────────────
  //  EVENT BINDING
  // ──────────────────────────────────────────────────────────────
  // Keyboard: R to reinvest, space to collect all. Module-level (not rebuilt
  // per-G) since it only ever needs to be attached once per #divd-root mount
  // — it reads the live G at fire time, so it stays correct across every
  // "PLAY AGAIN" reset without needing to be re-bound.
  function kbHandler(e) {
    if (!G || !G.running) return;
    if (e.key === 'r' || e.key === 'R') handleReinvest();
    if (e.key === ' ') {
      e.preventDefault();
      G.plots.forEach(p => { if (p.pendingPay > 0) collectPayout(p.idx); });
    }
  }

  function bindEvents() {
    // initGame() re-runs on every "PLAY AGAIN" against the SAME #divd-root
    // (it isn't re-mounted), so without this guard every replay stacked one
    // more copy of every listener below onto the still-live exit/reinvest/
    // help buttons and onto window/document — e.g. a single REINVEST ALL
    // click after a few replays would fire handleReinvest() several times.
    if (_eventsBound) return;
    _eventsBound = true;

    document.getElementById('divd-exit-btn')?.addEventListener('click', () => window.inv_dividendExit());
    document.getElementById('divd-reinvest-btn')?.addEventListener('click', handleReinvest);
    document.getElementById('divd-help-btn')?.addEventListener('click', () => window.divdShowHelp());
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('keydown', kbHandler);
  }

})();
