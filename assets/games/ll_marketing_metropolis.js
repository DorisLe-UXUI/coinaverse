/* ════════════════════════════════════════════════════════════════
   MARKETING METROPOLIS — Launch Lab / Risk Taker Hub
   Catch good engagement items (Likes, Shares, Subscribers, Reviews,
   Customers) to grow followers. Dodge harmful ones (Fake News, Bad
   Reviews, Spam, Hacks, Cancel events).
   Reputation hits 0 → run ends. Reach follower target → win.
   Level 1: single lane, slow, forgiving.
   Level 2: multi-lane, faster, scandal challenges, trend multipliers.
   Level 3: fastest, most bad items, reputation slowly decays every
   second unless you keep catching — consistent effort matters.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── palette ─────────────────────────────────────────────────── */
  const ACC   = '#7C3AED';
  const ACC2  = '#A78BFA';
  const ACC3  = '#6D28D9';
  const GOLD  = '#FBBF24';
  const NEON  = '#38BDF8';
  const PINK  = '#F472B6';
  const GOOD  = '#22C55E';
  const DANGER= '#EF4444';
  const BG    = '#03040c';

  /* ── game constants ──────────────────────────────────────────── */
  const MAX_LEVEL = 3;
  const LEVEL_CFG = {
    1: {
      duration:     90,
      targetFollowers: 500,
      laneCount:    2,
      spawnInterval:850,
      itemSpeed:    2.6,
      repDrain:     0,
      badChance:    .28,
      scandalChance:0,
      label:        'LEARN',
      scandals:     false,
      trends:       false
    },
    2: {
      duration:     90,
      targetFollowers: 1500,
      laneCount:    4,
      spawnInterval:750,
      itemSpeed:    3.8,
      repDrain:     0,
      badChance:    .38,
      scandalChance:.0012,
      label:        'MASTER',
      scandals:     true,
      trends:       true
    },
    3: {
      duration:     80,
      targetFollowers: 3000,
      laneCount:    4,
      spawnInterval:560,
      itemSpeed:    5.2,
      repDrain:     1.2,
      badChance:    .46,
      scandalChance:.002,
      label:        'EXPERT',
      scandals:     true,
      trends:       true
    }
  };

  /* star thresholds: followers reached */
  const STAR3_L1 = 500, STAR2_L1 = 300;
  const STAR3_L2 = 1500, STAR2_L2 = 900;
  const STAR3_L3 = 3000, STAR2_L3 = 1800;
  const STAR3_BY_LVL = { 1: STAR3_L1, 2: STAR3_L2, 3: STAR3_L3 };
  const STAR2_BY_LVL = { 1: STAR2_L1, 2: STAR2_L2, 3: STAR2_L3 };

  /* ── item definitions ────────────────────────────────────────── */
  const GOOD_ITEMS = [
    { id:'like',     label:'Like',         emoji:'👍', value:10,  color:'#818CF8', rep:2  },
    { id:'share',    label:'Share',        emoji:'🔁', value:20,  color:NEON,      rep:3  },
    { id:'sub',      label:'Subscriber',   emoji:'🔔', value:40,  color:GOOD,      rep:4  },
    { id:'review',   label:'+Review',      emoji:'⭐', value:30,  color:GOLD,      rep:6  },
    { id:'customer', label:'Customer',     emoji:'🛒', value:60,  color:PINK,      rep:5  },
    { id:'dm',       label:'DM Inquiry',   emoji:'💬', value:25,  color:ACC2,      rep:3  },
  ];

  const BAD_ITEMS = [
    { id:'fakenews', label:'Fake News',    emoji:'📰', damage:15, color:DANGER,    repDmg:18 },
    { id:'badrev',   label:'Bad Review',   emoji:'👎', damage:8,  color:'#F97316', repDmg:12 },
    { id:'spam',     label:'Spam',         emoji:'🗑️', damage:5,  color:'#78716C', repDmg:8  },
    { id:'hack',     label:'Hack Alert',   emoji:'💀', damage:20, color:'#DC2626', repDmg:25 },
    { id:'cancel',   label:'Cancel Event', emoji:'🔥', damage:25, color:'#9F1239', repDmg:30 },
  ];

  const POWERUPS = [
    { id:'viral',    label:'Viral Video',     emoji:'📹', color:'#FBBF24', duration:5000 },
    { id:'influencer',label:'Influencer',     emoji:'🌟', color:PINK,      duration:6000 },
    { id:'trending', label:'Trending #Tag',   emoji:'#️⃣', color:NEON,      duration:4000 },
  ];

  /* ── state ───────────────────────────────────────────────────── */
  let G = null;
  let _raf = null;
  let _spawnTimer = null;
  let _scandalTimer = null;
  let _viralSpike = null;

  /* ══════════════════════════════════════════════════════════════
     SCREEN ENTRY
  ══════════════════════════════════════════════════════════════ */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS['game_ll_marketing_metropolis'] = function () {
    G = null;
    cancelAnimationFrame(_raf);
    clearInterval(_spawnTimer);
    clearTimeout(_scandalTimer);
    clearInterval(_viralSpike); _viralSpike = null;
    _removeInputListeners();
    setTimeout(initGame, 40);
    return `
<div id="mmRoot" style="position:absolute;inset:0;background:radial-gradient(130% 95% at 50% -8%, ${ACC}26, #0a0620 44%, ${BG} 100%);overflow:hidden;font-family:Inter,sans-serif;color:#fff;touch-action:none">

  <!-- Background canvas -->
  <canvas id="mmBg" style="position:absolute;inset:0;opacity:.3;pointer-events:none"></canvas>

  <!-- Neon city skyline decorations -->
  <div id="mmSkyline" style="position:absolute;bottom:0;left:0;right:0;height:120px;pointer-events:none;z-index:1"></div>

  <!-- TOP BAR -->
  <div style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;gap:8px;padding:10px 12px 8px;background:linear-gradient(180deg,rgba(3,4,12,.98) 70%,transparent);border-bottom:1px solid ${ACC}44">
    <button id="mmBack" style="background:transparent;border:1px solid ${ACC}55;color:${ACC2};font-size:.85rem;padding:4px 10px;border-radius:6px;cursor:pointer;font-family:Inter,sans-serif">←</button>
    <div style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.18em;color:${ACC2};flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">MARKETING METROPOLIS</div>
    <div style="display:flex;align-items:center;gap:12px">
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.1em;color:rgba(255,255,255,.4)">FOLLOWERS</div>
        <div id="mmScore" style="font-family:Orbitron,sans-serif;font-size:.75rem;letter-spacing:.06em;color:${GOLD};font-variant-numeric:tabular-nums">0</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.1em;color:rgba(255,255,255,.4)">TIME</div>
        <div id="mmTimer" style="font-family:Orbitron,sans-serif;font-size:.75rem;letter-spacing:.06em;color:#fff;font-variant-numeric:tabular-nums">90</div>
      </div>
    </div>
  </div>

  <!-- REPUTATION BAR -->
  <div style="position:absolute;top:62px;left:12px;right:12px;z-index:15">
    <div style="display:flex;justify-content:space-between;margin-bottom:3px">
      <span style="font-family:Orbitron,sans-serif;font-size:.4rem;letter-spacing:.12em;color:rgba(255,255,255,.4)">REPUTATION</span>
      <span id="mmRepPct" style="font-family:Orbitron,sans-serif;font-size:.4rem;letter-spacing:.08em;color:${GOOD}">100%</span>
    </div>
    <div style="height:7px;border-radius:4px;background:rgba(255,255,255,.07);overflow:hidden;border:1px solid rgba(255,255,255,.1)">
      <div id="mmRepBar" style="height:100%;width:100%;background:linear-gradient(90deg,${GOOD},${NEON});border-radius:4px;transition:width .3s ease"></div>
    </div>
  </div>

  <!-- GOAL BAR -->
  <div style="position:absolute;top:88px;left:12px;right:12px;z-index:15">
    <div style="display:flex;justify-content:space-between;margin-bottom:3px">
      <span style="font-family:Orbitron,sans-serif;font-size:.4rem;letter-spacing:.12em;color:rgba(255,255,255,.4)">GROWTH TARGET</span>
      <span id="mmGoalLbl" style="font-family:Orbitron,sans-serif;font-size:.4rem;letter-spacing:.08em;color:${ACC2}">0 / 500</span>
    </div>
    <div style="height:5px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden;border:1px solid ${ACC}33">
      <div id="mmGoalBar" style="height:100%;width:0%;background:linear-gradient(90deg,${ACC},${ACC2});border-radius:3px;transition:width .4s ease"></div>
    </div>
  </div>

  <!-- LEVEL + POWERUP STATUS ROW -->
  <div style="position:absolute;top:112px;left:12px;right:12px;z-index:15;display:flex;align-items:center;justify-content:space-between">
    <div id="mmLvlBadge" style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.14em;color:rgba(255,255,255,.35)">LVL 1 · LEARN</div>
    <div id="mmPowerupStatus" style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.1em;color:${GOLD};display:none"></div>
    <div id="mmCombo" style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.1em;color:${GOLD}">COMBO ×1</div>
  </div>

  <!-- PLAY AREA (canvas) -->
  <canvas id="mmCanvas" style="position:absolute;top:130px;left:0;right:0;bottom:60px;z-index:5"></canvas>

  <!-- PLATFORM (player zone) -->
  <div id="mmPlatformZone" style="position:absolute;bottom:60px;left:0;right:0;height:56px;z-index:8;pointer-events:none">
    <!-- platform bar -->
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${ACC},${ACC2},${NEON},${ACC2},${ACC},transparent);opacity:.7"></div>
  </div>

  <!-- glow pool beneath the player — a colored light pool grounds the sprite
       against this near-black cosmic backdrop far better than a dark drop-shadow would -->
  <div id="mmPlayerGlow" style="position:absolute;bottom:60px;z-index:9;width:100px;height:22px;pointer-events:none;transform:translateX(-50%);left:50%;background:radial-gradient(ellipse at center, ${ACC}66 0%, ${NEON}22 55%, transparent 78%);filter:blur(1px)"></div>

  <!-- PLAYER element (basket/character) -->
  <div id="mmPlayer" style="position:absolute;bottom:64px;z-index:10;width:68px;height:52px;pointer-events:none;transform:translateX(-50%);left:50%">
    <canvas id="mmPlayerCanvas" width="68" height="52"></canvas>
  </div>

  <!-- FLOATING ITEMS CONTAINER -->
  <div id="mmItems" style="position:absolute;top:130px;left:0;right:0;bottom:116px;z-index:6;pointer-events:none;overflow:hidden"></div>

  <!-- SCANDAL CHALLENGE OVERLAY -->
  <div id="mmScandal" style="position:absolute;top:140px;left:50%;transform:translateX(-50%);z-index:18;display:none;min-width:260px;max-width:88vw;text-align:center;border-radius:14px;padding:12px 20px;border:2px solid ${DANGER};background:rgba(3,4,12,.96);backdrop-filter:blur(8px)">
    <div style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.14em;color:${DANGER};margin-bottom:6px">⚠ REPUTATION CRISIS ⚠</div>
    <div id="mmScandalDesc" style="font-size:.72rem;margin-bottom:4px"></div>
    <div style="font-family:Orbitron,sans-serif;font-size:.44rem;color:rgba(255,255,255,.5)">CATCH <span id="mmScandalTarget" style="color:${GOLD}"></span> TO REPAIR!</div>
    <div id="mmScandalTimer" style="font-family:Orbitron,sans-serif;font-size:.55rem;color:${DANGER};margin-top:4px">5</div>
  </div>

  <!-- FEEDBACK FLASH -->
  <div id="mmFeedback" style="position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);z-index:25;pointer-events:none;display:none;font-family:Orbitron,sans-serif;font-size:1.4rem;font-weight:900;text-align:center;text-shadow:0 0 20px currentColor;white-space:nowrap"></div>

  <!-- TREND BANNER -->
  <div id="mmTrend" style="position:absolute;top:130px;left:0;right:0;z-index:16;display:none;text-align:center;padding:6px;font-family:Orbitron,sans-serif;font-size:.45rem;letter-spacing:.12em;background:linear-gradient(90deg,transparent,${ACC}55,transparent)"></div>

  <!-- STREAK CELEBRATION BANNER (purely cosmetic — no score impact) -->
  <div id="mmStreak" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:26;display:none;pointer-events:none;text-align:center;font-family:Orbitron,sans-serif;font-size:1.05rem;font-weight:900;letter-spacing:.1em;color:${GOLD};text-shadow:0 0 24px ${GOLD},0 0 6px #fff;white-space:nowrap"></div>

  <!-- BOTTOM LANES INDICATOR -->
  <div id="mmLaneBar" style="position:absolute;bottom:30px;left:12px;right:12px;z-index:9;display:flex;gap:4px;justify-content:center;align-items:center;pointer-events:none"></div>

  <!-- DRAG INDICATOR (touch zone text) -->
  <div style="position:absolute;bottom:8px;left:0;right:0;text-align:center;font-family:Orbitron,sans-serif;font-size:.38rem;letter-spacing:.1em;color:rgba(255,255,255,.22);z-index:9;pointer-events:none">DRAG OR USE ← → ARROW KEYS</div>

  <!-- END OVERLAY -->
  <div id="mmOver" style="position:absolute;inset:0;z-index:30;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.95);backdrop-filter:blur(8px)"></div>

</div>`;
  };

  /* ══════════════════════════════════════════════════════════════
     EXIT
  ══════════════════════════════════════════════════════════════ */
  window.ll_marketing_metropolisExit = function () {
    G = null;
    cancelAnimationFrame(_raf);
    clearInterval(_spawnTimer);
    clearTimeout(_scandalTimer);
    clearInterval(_viralSpike); _viralSpike = null;
    _removeInputListeners();
    // Builder/Launch Lab hub id is 'builder' (WORLDS.builder) — this game is
    // reached from the Builder hub's Mini-Games grid, NOT risktaker.
    if (window.state) state.viewingWorld = 'builder';
    goTo('hub');
  };

  /* ══════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════ */
  function initGame () {
    const root = document.getElementById('mmRoot');
    if (!root) return;

    document.getElementById('mmBack').onclick = window.ll_marketing_metropolisExit;

    drawBgGrid();
    drawSkyline();
    startLevel(1);
    setupInput();
  }

  /* ── background holographic city grid ───────────────────────── */
  function drawBgGrid () {
    const c = document.getElementById('mmBg');
    if (!c) return;
    const dpr = devicePixelRatio || 1;
    const W = innerWidth, H = innerHeight;
    c.width  = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);

    /* perspective grid lines */
    ctx.strokeStyle = ACC;
    ctx.lineWidth = .6;
    const step = 36;
    for (let x = 0; x <= W; x += step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y <= H; y += step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    /* converging horizon lines */
    ctx.strokeStyle = ACC2;
    ctx.lineWidth = .3;
    const vx = W/2, vy = H * .55;
    for (let angle = -60; angle <= 60; angle += 8) {
      const rad = (angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(vx + Math.sin(rad) * W, vy - Math.cos(rad) * H);
      ctx.stroke();
    }

    /* glowing dots at intersections */
    ctx.fillStyle = ACC;
    for (let x = 0; x <= W; x += step * 3) {
      for (let y = 0; y <= H; y += step * 3) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  /* ── neon city skyline ───────────────────────────────────────── */
  function drawSkyline () {
    const zone = document.getElementById('mmSkyline');
    if (!zone) return;
    const W = innerWidth;
    const buildings = [];
    let x = -10;
    while (x < W + 20) {
      const w = 20 + Math.random() * 50;
      const h = 30 + Math.random() * 90;
      const hue = Math.random() < .4 ? ACC : Math.random() < .5 ? NEON : ACC2;
      buildings.push({ x, w, h, hue });
      x += w + 2 + Math.random() * 8;
    }
    const svgH = 120;
    const rects = buildings.map(b => {
      const y = svgH - b.h;
      const windows = [];
      for (let wy = y + 8; wy < svgH - 6; wy += 10) {
        for (let wx = b.x + 4; wx < b.x + b.w - 6; wx += 8) {
          if (Math.random() > .35) windows.push(`<rect x="${wx}" y="${wy}" width="4" height="5" fill="${b.hue}" opacity="${.3+Math.random()*.5}"/>`);
        }
      }
      return `<rect x="${b.x}" y="${y}" width="${b.w}" height="${b.h}" fill="${BG}" stroke="${b.hue}" stroke-width=".5" opacity=".7"/>
              ${windows.join('')}`;
    }).join('');
    zone.innerHTML = `<svg width="${W}" height="${svgH}" viewBox="0 0 ${W} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;left:0">${rects}</svg>`;
  }

  /* ══════════════════════════════════════════════════════════════
     START LEVEL
  ══════════════════════════════════════════════════════════════ */
  function startLevel (lvl) {
    cancelAnimationFrame(_raf);
    clearInterval(_spawnTimer);
    clearTimeout(_scandalTimer);

    const cfg = LEVEL_CFG[lvl];
    const W   = innerWidth;
    const canvas = document.getElementById('mmCanvas');
    const zone   = document.getElementById('mmItems');
    zone.innerHTML = '';

    /* compute play area height */
    const topOffset = 130;
    const bottomPad = 116;
    const playH = innerHeight - topOffset - bottomPad;

    G = {
      lvl,
      cfg,
      followers: 0,
      targetFollowers: cfg.targetFollowers,
      reputation: 100,
      timeLeft:   cfg.duration,
      running:    true,
      paused:     false,
      combo:      1,
      comboTimer: null,
      streak:     0,    /* cosmetic-only counter for streak celebration banner — never read by scoring math */
      playerX:    W / 2,
      playerW:    68,
      playerSpeed:6,
      items:      [],
      nextId:     0,
      powerup:    null,    /* { id, expiresAt } */
      scandal:    null,    /* { targetId, expiresAt, timer } */
      trendItem:  null,    /* { id, mult, expiresAt } */
      activePowerupEnd: 0,
      lastTimestamp: null,
      playH,
      W,
      spawnAccum: 0,
      laneCount:  cfg.laneCount,
      keys:       { left:false, right:false },
      score3: STAR3_BY_LVL[lvl],
      score2: STAR2_BY_LVL[lvl],
      outcome: null,
      repDecayAccum: 0,
    };

    /* UI */
    document.getElementById('mmLvlBadge').textContent = `LVL ${lvl} · ${cfg.label}`;
    document.getElementById('mmScore').textContent = '0';
    document.getElementById('mmTimer').textContent = cfg.duration;
    document.getElementById('mmGoalLbl').textContent = `0 / ${cfg.targetFollowers}`;
    document.getElementById('mmGoalBar').style.width = '0%';
    document.getElementById('mmRepBar').style.width = '100%';
    document.getElementById('mmRepPct').textContent = '100%';
    document.getElementById('mmRepPct').style.color = GOOD;
    document.getElementById('mmCombo').textContent = 'COMBO ×1';
    document.getElementById('mmScandal').style.display = 'none';
    document.getElementById('mmTrend').style.display = 'none';
    document.getElementById('mmPowerupStatus').style.display = 'none';
    document.getElementById('mmOver').style.display = 'none';

    /* size canvas */
    const dpr = devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = playH * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = playH + 'px';

    /* lane indicators */
    const laneBar = document.getElementById('mmLaneBar');
    laneBar.innerHTML = Array.from({length: cfg.laneCount}, (_,i) =>
      `<div style="flex:1;height:3px;border-radius:2px;background:${ACC}44;border:1px solid ${ACC}66" id="mmLane${i}"></div>`
    ).join('');

    drawPlayer();
    scheduleSpawn();
    gameLoop(performance.now());
    startCountdown();
  }

  /* ── countdown clock ─────────────────────────────────────────── */
  function startCountdown () {
    const tick = setInterval(() => {
      if (!G || !G.running) { clearInterval(tick); return; }
      G.timeLeft = Math.max(0, G.timeLeft - 1);
      const el = document.getElementById('mmTimer');
      if (el) {
        el.textContent = G.timeLeft;
        el.style.color = G.timeLeft <= 10 ? DANGER : '#fff';
      }
      if (G.timeLeft <= 0) {
        clearInterval(tick);
        triggerEnd('time');
      }
    }, 1000);
  }

  /* ── draw player character ───────────────────────────────────── */
  function drawPlayer () {
    const c = document.getElementById('mmPlayerCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 68, 52);

    /* basket / receive platform */
    /* body */
    ctx.fillStyle = ACC3;
    roundRect(ctx, 4, 20, 60, 28, 8);
    ctx.fill();

    /* top glow strip */
    const grad = ctx.createLinearGradient(4, 20, 64, 20);
    grad.addColorStop(0, ACC);
    grad.addColorStop(.5, ACC2);
    grad.addColorStop(1, NEON);
    ctx.fillStyle = grad;
    roundRect(ctx, 4, 20, 60, 6, [6,6,0,0]);
    ctx.fill();

    /* phone screen face */
    ctx.fillStyle = '#0a0a1a';
    roundRect(ctx, 12, 10, 44, 26, 5);
    ctx.fill();

    /* screen content — wifi/signal icon */
    ctx.fillStyle = ACC2;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📱', 34, 29);

    /* side handles */
    ctx.fillStyle = ACC;
    ctx.fillRect(0, 28, 6, 16);
    ctx.fillRect(62, 28, 6, 16);

    /* glow effect */
    ctx.shadowColor = ACC;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = ACC;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 4, 20, 60, 28, 8);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radii = Array.isArray(r) ? r : [r,r,r,r];
    ctx.beginPath();
    ctx.moveTo(x + radii[0], y);
    ctx.lineTo(x + w - radii[1], y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+radii[1]);
    ctx.lineTo(x+w, y+h-radii[2]);
    ctx.quadraticCurveTo(x+w, y+h, x+w-radii[2], y+h);
    ctx.lineTo(x+radii[3], y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-radii[3]);
    ctx.lineTo(x, y+radii[0]);
    ctx.quadraticCurveTo(x, y, x+radii[0], y);
    ctx.closePath();
  }

  /* ── spawn scheduler ─────────────────────────────────────────── */
  function scheduleSpawn () {
    clearInterval(_spawnTimer);
    _spawnTimer = setInterval(() => {
      if (!G || !G.running) return;
      spawnItem();
      /* occasionally spawn a power-up */
      if (Math.random() < .12) spawnPowerup();
    }, G.cfg.spawnInterval);
  }

  function spawnItem () {
    if (!G) return;
    const zone = document.getElementById('mmItems');
    if (!zone) return;

    /* pick lane */
    const lane     = Math.floor(Math.random() * G.laneCount);
    const laneW    = G.W / G.laneCount;
    const laneX    = lane * laneW + laneW * (.15 + Math.random() * .7);

    /* pick good vs bad — higher levels have more bads (config-driven) */
    const badChance = G.cfg.badChance;
    const isGood    = Math.random() > badChance;

    /* scandal repair priority */
    let def;
    if (G.scandal && isGood && Math.random() < .35) {
      def = GOOD_ITEMS.find(i => i.id === G.scandal.targetId) || pickRandom(GOOD_ITEMS);
    } else if (isGood) {
      def = pickRandom(GOOD_ITEMS);
    } else {
      def = pickRandom(BAD_ITEMS);
    }

    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;
      left:${laneX}px;
      top:-60px;
      transform:translateX(-50%);
      width:52px;height:52px;
      border-radius:50%;
      background:radial-gradient(circle at 35% 35%, ${def.color}33, ${def.color}11);
      border:2px solid ${def.color};
      box-shadow:0 0 14px ${def.color}88;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      font-size:1.3rem;
      cursor:pointer;
      z-index:6;
      transition:box-shadow .15s;
    `;
    el.title = def.label;

    const labelEl = document.createElement('div');
    labelEl.style.cssText = `font-family:Orbitron,sans-serif;font-size:.28rem;letter-spacing:.06em;color:${def.color};margin-top:1px;text-align:center;line-height:1;white-space:nowrap`;
    labelEl.textContent = def.label;

    el.innerHTML = `<span>${def.emoji}</span>`;
    el.appendChild(labelEl);

    /* trend multiplier glow */
    if (G.trendItem && isGood && def.id === G.trendItem.id) {
      el.style.boxShadow = `0 0 24px ${GOLD}, 0 0 8px ${GOLD}`;
      el.style.borderColor = GOLD;
    }

    zone.appendChild(el);

    const item = {
      id:     G.nextId++,
      el,
      x:      laneX,
      y:      -60,
      isGood,
      def,
      lane,
      speed:  G.cfg.itemSpeed * (.85 + Math.random() * .3),
      caught: false,
      missed: false,
    };
    G.items.push(item);
  }

  function spawnPowerup () {
    if (!G) return;
    const zone = document.getElementById('mmItems');
    if (!zone) return;

    const pu = pickRandom(POWERUPS);
    const laneX = G.W * (.1 + Math.random() * .8);

    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;
      left:${laneX}px;
      top:-70px;
      transform:translateX(-50%);
      width:60px;height:60px;
      border-radius:12px;
      background:radial-gradient(circle, ${pu.color}22, transparent);
      border:2px solid ${pu.color};
      box-shadow:0 0 20px ${pu.color}99, 0 0 40px ${pu.color}44;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      font-size:1.5rem;
      animation:mm_pulse 1s ease-in-out infinite alternate;
    `;
    const lbl = document.createElement('div');
    lbl.style.cssText = `font-family:Orbitron,sans-serif;font-size:.26rem;color:${pu.color};margin-top:2px;text-align:center;line-height:1.2`;
    lbl.textContent = pu.label.toUpperCase();
    el.innerHTML = `<span>${pu.emoji}</span>`;
    el.appendChild(lbl);
    zone.appendChild(el);

    const item = {
      id:      G.nextId++,
      el,
      x:       laneX,
      y:       -70,
      isGood:  true,
      isPowerup: true,
      def:     { ...pu, value:0, rep:0 },
      speed:   G.cfg.itemSpeed * .7,
      caught:  false,
      missed:  false,
    };
    G.items.push(item);
  }

  /* ── inject animation keyframe once ─────────────────────────── */
  (function injectStyles() {
    if (document.getElementById('mm_styles')) return;
    const s = document.createElement('style');
    s.id = 'mm_styles';
    s.textContent = `
      @keyframes mm_pulse { from{box-shadow:0 0 10px ${ACC}88} to{box-shadow:0 0 28px ${ACC}} }
      @keyframes mm_float { 0%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-4px)} 100%{transform:translateX(-50%) translateY(0)} }
      @keyframes mm_catch { 0%{transform:translate(-50%,-50%) scale(1);opacity:1} 100%{transform:translate(-50%,-50%) scale(2.2);opacity:0} }
      @keyframes mm_feedout { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,-80%) scale(.8)} }
      @keyframes mm_scandalPulse { 0%,100%{border-color:${DANGER}} 50%{border-color:#FF8888} }
      @keyframes mm_streakPop {
        0%   { transform:translate(-50%,-50%) scale(.4) rotate(-6deg); opacity:0; }
        35%  { transform:translate(-50%,-50%) scale(1.25) rotate(3deg); opacity:1; }
        60%  { transform:translate(-50%,-50%) scale(1) rotate(0deg); opacity:1; }
        100% { transform:translate(-50%,-65%) scale(.92) rotate(0deg); opacity:0; }
      }
      @keyframes mm_confettiFall { 0%{transform:translateY(-30px) rotate(0deg);opacity:1} 100%{transform:translateY(480px) rotate(360deg);opacity:0} }
      @keyframes mm_winShine { to { background-position:-20% 0; } }
      .mm-winshine::before { content:''; position:absolute; inset:0; background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.16) 48%,transparent 66%); background-size:220% 100%; background-position:120% 0; animation:mm_winShine 2.2s ease-in-out .3s 1; pointer-events:none; border-radius:inherit }
      /* Cyber-Premium Gaming HUD scanline — same recipe as arcade.js .arc-wrap::after */
      #mmRoot::after { content:''; position:absolute; inset:0; z-index:28; pointer-events:none; background:linear-gradient(rgba(124,58,237,0) 50%,rgba(124,58,237,.025) 50%); background-size:100% 4px; }
    `;
    document.head.appendChild(s);
  })();

  /* ══════════════════════════════════════════════════════════════
     GAME LOOP
  ══════════════════════════════════════════════════════════════ */
  function gameLoop (ts) {
    if (!G || !G.running) return;
    const dt = G.lastTimestamp ? Math.min((ts - G.lastTimestamp) / 16.67, 3) : 1;
    const frameMs = G.lastTimestamp ? (ts - G.lastTimestamp) : 16.67;
    G.lastTimestamp = ts;

    updatePlayer(dt);
    updateItems(dt);
    updatePowerupDisplay();
    updateReputationDecay(frameMs);
    checkScandal();

    _raf = requestAnimationFrame(gameLoop);
  }

  /* ── reputation decay (Level 3: reputation fades if you coast) ──
     Repurposes the repDrain config field — reputation ticks down by
     cfg.repDrain points per second of real elapsed time, independent
     of catching/missing items. Teaches that consistent engagement
     matters, not just big one-off wins. No-op when cfg.repDrain is 0
     (Level 1 & 2 behavior is unchanged). ────────────────────────── */
  function updateReputationDecay (frameMs) {
    if (!G || !G.cfg.repDrain) return;
    G.repDecayAccum += frameMs;
    if (G.repDecayAccum < 1000) return;
    const secs = Math.floor(G.repDecayAccum / 1000);
    G.repDecayAccum -= secs * 1000;

    const before = G.reputation;
    G.reputation = Math.max(0, G.reputation - G.cfg.repDrain * secs);
    if (G.reputation !== before) {
      updateScoreUI();
      if (G.reputation <= 0) {
        triggerEnd('rep');
      }
    }
  }

  /* ── player movement ─────────────────────────────────────────── */
  function updatePlayer (dt) {
    if (!G) return;
    const speed = G.playerSpeed * dt;
    if (G.keys.left)  G.playerX = Math.max(G.playerW/2,       G.playerX - speed);
    if (G.keys.right) G.playerX = Math.min(G.W - G.playerW/2, G.playerX + speed);

    const playerEl = document.getElementById('mmPlayer');
    if (playerEl) playerEl.style.left = G.playerX + 'px';
    const glowEl = document.getElementById('mmPlayerGlow');
    if (glowEl) glowEl.style.left = G.playerX + 'px';
  }

  /* ── update falling items ────────────────────────────────────── */
  function updateItems (dt) {
    if (!G) return;
    const zoneH = G.playH;

    /* trending multiplier */
    if (G.trendItem && Date.now() > G.trendItem.expiresAt) {
      G.trendItem = null;
      const t = document.getElementById('mmTrend');
      if (t) t.style.display = 'none';
    }

    for (let i = G.items.length - 1; i >= 0; i--) {
      const item = G.items[i];
      if (item.caught || item.missed) {
        /* clean up */
        if (item.el && item.el.parentNode) {
          /* short delay before removal */
          if (!item.removeAt) item.removeAt = Date.now() + 400;
          if (Date.now() > item.removeAt) {
            item.el.parentNode.removeChild(item.el);
            G.items.splice(i, 1);
          }
        } else {
          G.items.splice(i, 1);
        }
        continue;
      }

      item.y += item.speed * dt;
      item.el.style.top = item.y + 'px';

      /* check catch: item enters catch zone */
      const catchZoneTop = zoneH - 68;
      if (!item.caught && item.y >= catchZoneTop) {
        /* x collision check */
        const itemCX = item.x;
        const pLeft  = G.playerX - G.playerW / 2 - 10;
        const pRight = G.playerX + G.playerW / 2 + 10;

        if (itemCX >= pLeft && itemCX <= pRight) {
          catchItem(item);
        }
      }

      /* item fell through (missed) */
      if (item.y > zoneH + 20) {
        item.missed = true;
        if (item.el) item.el.style.opacity = '0';
        /* if good item missed — no rep damage, just no gain */
        /* if bad item missed — no harm either, dodged */
      }
    }
  }

  /* ── catch item ──────────────────────────────────────────────── */
  function catchItem (item) {
    if (!G || item.caught) return;
    item.caught = true;
    item.el.style.transition = 'transform .3s,opacity .3s';
    item.el.style.transform  = 'translateX(-50%) scale(0)';
    item.el.style.opacity    = '0';

    if (item.isPowerup) {
      activatePowerup(item.def);
      showFeedback(`${item.def.emoji} ${item.def.label.toUpperCase()}!`, GOLD);
      return;
    }

    if (item.isGood) {
      let mult = G.combo;
      if (G.powerup && G.powerup.id === 'influencer') mult *= 2;
      if (G.powerup && G.powerup.id === 'viral')      mult *= 3;
      if (G.trendItem && G.trendItem.id === item.def.id) mult *= 2;

      const gained   = Math.round(item.def.value * mult);
      const repGain  = item.def.rep || 0;

      G.followers  += gained;
      G.reputation  = Math.min(100, G.reputation + repGain * .5);

      /* combo ramp */
      G.combo = Math.min(G.combo + 1, 8);
      clearTimeout(G.comboTimer);
      G.comboTimer = setTimeout(() => { if (G) G.combo = 1; }, 3000);

      /* cosmetic streak celebration — purely visual counter, independent of
         G.combo's ×score multiplier (which stays capped at 8 and unaffected
         by this). Every 5th consecutive good catch pops an extra burst +
         banner; does not change followers/score math in any way. */
      G.streak++;
      if (G.streak > 0 && G.streak % 5 === 0) {
        showStreakBanner(G.streak);
      }

      /* scandal repair */
      if (G.scandal && item.def.id === G.scandal.targetId) {
        resolveScandal(true);
      }

      updateScoreUI();
      showFeedback(`+${gained} ${item.def.emoji}`, item.def.color);
      flashLane(item.lane, item.def.color);

      /* win check */
      if (G.followers >= G.targetFollowers) {
        triggerEnd('win');
      }
    } else {
      /* bad item caught */
      let dmg = item.def.repDmg;
      if (G.powerup && G.powerup.id === 'trending') {
        dmg = 0; /* frozen bad items do no damage */
        showFeedback('BLOCKED! ' + item.def.emoji, NEON);
      } else {
        G.reputation = Math.max(0, G.reputation - dmg);
        G.combo = 1;
        G.streak = 0;
        clearTimeout(G.comboTimer);
        updateScoreUI();
        showFeedback(`${item.def.emoji} ${item.def.label}!`, DANGER);
        screenShake();
        if (G.reputation <= 0) {
          triggerEnd('rep');
        }
      }
    }
  }

  /* ── UI updates ──────────────────────────────────────────────── */
  function updateScoreUI () {
    if (!G) return;
    const scoreEl = document.getElementById('mmScore');
    const repBar  = document.getElementById('mmRepBar');
    const repPct  = document.getElementById('mmRepPct');
    const goalLbl = document.getElementById('mmGoalLbl');
    const goalBar = document.getElementById('mmGoalBar');
    const comboEl = document.getElementById('mmCombo');

    if (scoreEl) scoreEl.textContent = G.followers.toLocaleString();
    if (goalLbl) goalLbl.textContent  = `${G.followers.toLocaleString()} / ${G.targetFollowers.toLocaleString()}`;
    const goalPct = Math.min(100, (G.followers / G.targetFollowers) * 100);
    if (goalBar) goalBar.style.width = goalPct + '%';

    const rep = Math.round(G.reputation);
    if (repBar) repBar.style.width = rep + '%';
    if (repPct) {
      repPct.textContent = rep + '%';
      repPct.style.color = rep > 60 ? GOOD : rep > 30 ? GOLD : DANGER;
    }
    if (repBar) {
      repBar.style.background = rep > 60
        ? `linear-gradient(90deg,${GOOD},${NEON})`
        : rep > 30
          ? `linear-gradient(90deg,${GOLD},#FDE68A)`
          : `linear-gradient(90deg,${DANGER},#FCA5A5)`;
    }
    if (comboEl) comboEl.textContent = `COMBO ×${G.combo}`;
    if (comboEl) comboEl.style.color = G.combo >= 4 ? GOLD : G.combo >= 2 ? ACC2 : 'rgba(255,255,255,.4)';
  }

  /* ── powerups ────────────────────────────────────────────────── */
  function activatePowerup (def) {
    if (!G) return;
    G.powerup = { id: def.id, expiresAt: Date.now() + def.duration };

    if (def.id === 'viral') {
      /* follower spike animation */
      let spikes = 0;
      clearInterval(_viralSpike);
      _viralSpike = setInterval(() => {
        if (!G || spikes >= 8) { clearInterval(_viralSpike); _viralSpike = null; return; }
        G.followers += 30 + Math.floor(Math.random() * 50);
        updateScoreUI();
        spikes++;
        if (G.followers >= G.targetFollowers) { clearInterval(_viralSpike); _viralSpike = null; triggerEnd('win'); }
      }, 600);
    }

    if (def.id === 'trending' && G.cfg.trends) {
      /* freeze bad items — mark them */
      G.items.forEach(it => {
        if (!it.isGood && !it.caught) {
          it.speed = 0.3;
          if (it.el) { it.el.style.opacity = '.5'; it.el.style.filter = 'grayscale(80%)'; }
        }
      });
    }

    if (def.id === 'influencer' && G.cfg.trends) {
      /* pick a trending item type */
      const tDef = pickRandom(GOOD_ITEMS);
      G.trendItem = { id: tDef.id, mult: 2, expiresAt: Date.now() + 6000 };
      const t = document.getElementById('mmTrend');
      if (t) {
        t.textContent = `🔥 TRENDING: ${tDef.emoji} ${tDef.label.toUpperCase()} — 2× VALUE!`;
        t.style.display = 'block';
        t.style.color   = GOLD;
      }
    }
  }

  function updatePowerupDisplay () {
    if (!G) return;
    const el = document.getElementById('mmPowerupStatus');
    if (!el) return;
    if (G.powerup && Date.now() < G.powerup.expiresAt) {
      const rem = Math.ceil((G.powerup.expiresAt - Date.now()) / 1000);
      const pu  = POWERUPS.find(p => p.id === G.powerup.id);
      el.style.display = 'block';
      el.textContent   = `${pu ? pu.emoji : '⚡'} ${G.powerup.id.toUpperCase()} ${rem}s`;
      el.style.color   = pu ? pu.color : GOLD;
    } else {
      if (G.powerup) {
        /* expired — restore bad item speeds */
        if (G.powerup.id === 'trending') {
          G.items.forEach(it => {
            if (!it.isGood && !it.caught) {
              it.speed = G.cfg.itemSpeed * (.85 + Math.random() * .3);
              if (it.el) { it.el.style.opacity = '1'; it.el.style.filter = 'none'; }
            }
          });
        }
        G.powerup = null;
      }
      el.style.display = 'none';
    }
  }

  /* ── scandal system (Level 2) ────────────────────────────────── */
  function launchScandal () {
    if (!G || !G.cfg.scandals || G.scandal) return;

    const badItem = pickRandom(BAD_ITEMS.filter(b => b.id !== 'spam'));
    const repair  = pickRandom(GOOD_ITEMS.filter(g => g.id === 'review' || g.id === 'sub'));

    const scandals = [
      { desc: `A competitor spread rumors about your brand!`, bad: badItem },
      { desc: `Your ad campaign backfired — critics are angry!`, bad: badItem },
      { desc: `A viral post called out your customer service!`, bad: badItem },
    ];
    if (G.lvl >= 3) {
      scandals.push(
        { desc: `Investors are asking questions after a rough quarter!`, bad: badItem },
        { desc: `A partner brand publicly distanced themselves from you!`, bad: badItem },
      );
    }
    const s = pickRandom(scandals);

    G.scandal = {
      targetId:  repair.id,
      expiresAt: Date.now() + 6000,
      countdown: 6,
    };

    const banner = document.getElementById('mmScandal');
    document.getElementById('mmScandalDesc').textContent   = s.desc;
    document.getElementById('mmScandalTarget').textContent = `${repair.emoji} ${repair.label}`;
    document.getElementById('mmScandalTimer').textContent  = '6';
    if (banner) {
      banner.style.display = 'block';
      banner.style.animation = 'mm_scandalPulse 1s ease infinite';
    }

    G.scandal.intervalId = setInterval(() => {
      if (!G || !G.scandal) return;
      G.scandal.countdown--;
      const t = document.getElementById('mmScandalTimer');
      if (t) t.textContent = Math.max(0, G.scandal.countdown);
      if (G.scandal.countdown <= 0) {
        resolveScandal(false);
      }
    }, 1000);
  }

  function resolveScandal (success) {
    if (!G || !G.scandal) return;
    clearInterval(G.scandal.intervalId);
    G.scandal = null;
    const banner = document.getElementById('mmScandal');
    if (banner) banner.style.display = 'none';
    if (!success) {
      G.reputation = Math.max(0, G.reputation - 25);
      updateScoreUI();
      showFeedback('CRISIS! -25 REP', DANGER);
      screenShake();
      if (G.reputation <= 0) triggerEnd('rep');
    } else {
      G.reputation = Math.min(100, G.reputation + 12);
      updateScoreUI();
      showFeedback('CRISIS AVERTED! 🛡', GOOD);
    }
  }

  function checkScandal () {
    if (!G || !G.cfg.scandals) return;
    /* fire scandal randomly — cadence is config-driven (higher at L3) */
    if (!G.scandal && G.timeLeft < G.cfg.duration - 15 && Math.random() < G.cfg.scandalChance) {
      launchScandal();
    }
  }

  /* ── lane flash ──────────────────────────────────────────────── */
  function flashLane (lane, color) {
    const el = document.getElementById(`mmLane${lane}`);
    if (!el) return;
    el.style.background = color;
    el.style.boxShadow  = `0 0 8px ${color}`;
    setTimeout(() => {
      if (el) { el.style.background = `${ACC}44`; el.style.boxShadow = 'none'; }
    }, 400);
  }

  /* ── streak celebration (cosmetic only — reads G.streak, never writes
     followers/reputation/combo). Fires every 5th consecutive good catch. ── */
  function showStreakBanner (n) {
    const el = document.getElementById('mmStreak');
    if (!el) return;
    el.textContent   = `🔥 ${n} STREAK!`;
    el.style.display = 'block';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'mm_streakPop .9s ease forwards';
    setTimeout(() => { if (el) el.style.display = 'none'; }, 900);
    /* small extra flourish: pulse every lane briefly for a fuller-screen pop */
    for (let i = 0; i < (G ? G.laneCount : 0); i++) flashLane(i, GOLD);
  }

  /* ── feedback text ───────────────────────────────────────────── */
  function showFeedback (msg, color) {
    const el = document.getElementById('mmFeedback');
    if (!el) return;
    el.textContent   = msg;
    el.style.color   = color;
    el.style.display = 'block';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'mm_feedout .8s ease forwards';
    setTimeout(() => { if (el) el.style.display = 'none'; }, 800);
  }

  /* ── screen shake ────────────────────────────────────────────── */
  function screenShake () {
    const root = document.getElementById('mmRoot');
    if (!root) return;
    let t = 0;
    const shk = setInterval(() => {
      t++;
      root.style.transform = t < 6
        ? `translate(${(Math.random()-.5)*8}px,${(Math.random()-.5)*5}px)`
        : 'translate(0,0)';
      if (t >= 8) { clearInterval(shk); root.style.transform=''; }
    }, 40);
  }

  /* ── end game ────────────────────────────────────────────────── */
  function triggerEnd (reason) {
    if (!G || !G.running) return;
    G.running = false;
    cancelAnimationFrame(_raf);
    clearInterval(_spawnTimer);
    clearInterval(_viralSpike); _viralSpike = null;
    if (G.scandal) clearInterval(G.scandal.intervalId);

    const won    = reason === 'win';
    const rep0   = reason === 'rep';
    const f      = G.followers;
    const s3     = G.score3, s2 = G.score2;
    const stars  = f >= s3 && won ? 3 : f >= s2 ? 2 : f > 0 ? 1 : 0;
    const finishedLvl = G.lvl;

    if (finishedLvl < MAX_LEVEL && (won || reason === 'time') && stars >= 1) {
      /* transition to the next level after a delay */
      setTimeout(() => showLevelTransition(finishedLvl, stars, f), 800);
    } else {
      setTimeout(() => endGame(stars, rep0, f, reason), 600);
    }
  }

  /* headline + subtitle shown per just-finished level, and the pitch
     for what's coming next (kept out of the DANGER/rep0 vocabulary —
     no "level complete", "quiz", "wrong/incorrect" language) */
  const LEVEL_TRANSITION_COPY = {
    1: {
      headline: 'MISSION 1 ACCOMPLISHED',
      next:     'LAUNCHING MISSION 2',
      pitch:    'Multi-platform. Faster trends. Reputation crises.'
    },
    2: {
      headline: 'MISSION 2 ACCOMPLISHED',
      next:     'LAUNCHING MISSION 3',
      pitch:    'Full-speed growth. Bigger crises. Reputation fades if you coast — keep engaging!'
    },
  };

  function showLevelTransition (finishedLvl, stars1, f1) {
    const over = document.getElementById('mmOver');
    if (!over) return;
    const nextLvl = finishedLvl + 1;
    const copy = LEVEL_TRANSITION_COPY[finishedLvl] || LEVEL_TRANSITION_COPY[1];
    const triggerName = `mmStartLevel${nextLvl}`;

    over.style.display = 'flex';
    over.innerHTML = `
      <div style="text-align:center;padding:28px 24px;max-width:320px">
        <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.18em;color:${ACC2};margin-bottom:8px">${copy.headline}</div>
        <div style="font-size:2rem;margin:8px 0">${'⭐'.repeat(stars1)}${'☆'.repeat(3-stars1)}</div>
        <div style="font-size:.9rem;color:rgba(255,255,255,.7);margin-bottom:16px">${f1.toLocaleString()} Followers gained</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.62rem;color:${GOLD};letter-spacing:.14em;margin-bottom:6px">${copy.next}</div>
        <div style="font-size:.75rem;color:rgba(255,255,255,.5);margin-bottom:20px">${copy.pitch}</div>
        <button onclick="document.getElementById('mmOver').style.display='none';window.${triggerName}()" style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.12em;padding:12px 32px;border-radius:10px;border:none;background:linear-gradient(135deg,${ACC},${ACC3});color:#fff;cursor:pointer;box-shadow:0 0 20px ${ACC}77">
          READY →
        </button>
      </div>
    `;
    window[triggerName] = function () { startLevel(nextLvl); };
  }

  function endGame (stars, rep0, followers, reason) {
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ll_marketing_metropolis', { stars, level: G ? G.lvl : 1, badge: 'Marketing Master', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();
    if (window.StartupRewardsService) StartupRewardsService.submit({ pillar: 'marketing', successDelta: stars === 3 ? 15 : stars === 2 ? 8 : 3 });

    const starStr  = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const title    = rep0
      ? 'REPUTATION DESTROYED'
      : stars === 3 ? 'VIRAL SENSATION!'
      : stars === 2 ? 'GROWTH ACHIEVED'
      : stars === 1 ? 'KEEP HUSTLING'
      : 'CANCELLED';

    const badges = [];
    if (stars === 3) badges.push({ label:'Marketing Master', emoji:'🏆', color:GOLD });
    if (stars >= 2)  badges.push({ label:'Viral Bonus',      emoji:'📈', color:NEON });
    badges.push({ label:`+${coins} Coins`, emoji:'🪙', color:GOLD });

    const realWin = !rep0 && stars >= 2; // "real win" bar for the confetti/shine celebration
    const over = document.getElementById('mmOver');
    if (!over) return;
    over.style.display = 'flex';
    over.innerHTML = `
      <div class="${realWin ? 'mm-winshine' : ''}" style="position:relative;text-align:center;padding:28px 20px;max-width:360px;width:90vw">
        <div style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.2em;color:${rep0?DANGER:ACC2};margin-bottom:10px">
          ${rep0 ? '⚠ GAME OVER' : 'CAMPAIGN RESULTS'}
        </div>
        <div style="font-family:Orbitron,sans-serif;font-size:.85rem;letter-spacing:.08em;color:#fff;margin-bottom:10px;text-wrap:balance">${title}</div>
        <div style="font-size:2.2rem;margin:10px 0;letter-spacing:.1em">${starStr}</div>
        <div style="display:flex;justify-content:center;gap:20px;margin:12px 0">
          <div style="text-align:center">
            <div style="font-family:Orbitron,sans-serif;font-size:.38rem;letter-spacing:.1em;color:rgba(255,255,255,.4)">FOLLOWERS</div>
            <div style="font-family:Orbitron,sans-serif;font-size:.9rem;color:${GOLD};font-variant-numeric:tabular-nums">${followers.toLocaleString()}</div>
          </div>
          <div style="text-align:center">
            <div style="font-family:Orbitron,sans-serif;font-size:.38rem;letter-spacing:.1em;color:rgba(255,255,255,.4)">COINS</div>
            <div style="font-family:Orbitron,sans-serif;font-size:.9rem;color:${GOLD}">+${coins}</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:10px 0">
          ${badges.map(b => `<div style="display:flex;align-items:center;gap:5px;border:1px solid ${b.color}55;border-radius:8px;padding:5px 10px;background:${b.color}11">
            <span>${b.emoji}</span>
            <span style="font-family:Orbitron,sans-serif;font-size:.38rem;color:${b.color};letter-spacing:.08em">${b.label}</span>
          </div>`).join('')}
        </div>
        <div style="margin:14px auto;max-width:280px;padding:12px 16px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid ${ACC}33;font-size:.72rem;color:rgba(255,255,255,.6);line-height:1.6;font-style:italic">
          "Growing an audience takes consistent effort — and one bad moment can undo weeks of work. Real marketers know that reputation is more valuable than reach, and viral growth means nothing without trust."
        </div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:4px">
          <button onclick="window.SCREENS['game_ll_marketing_metropolis']&&(document.getElementById('mmOver').style.display='none',startL1())" style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.1em;padding:11px 22px;border-radius:9px;border:1px solid ${ACC};background:transparent;color:${ACC2};cursor:pointer">↺ PLAY AGAIN</button>
          <button onclick="window.ll_marketing_metropolisExit()" style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.1em;padding:11px 22px;border-radius:9px;border:none;background:linear-gradient(135deg,${ACC},${ACC3});color:#fff;cursor:pointer;box-shadow:0 0 16px ${ACC}66">← HUB</button>
        </div>
      </div>
    `;
    window.startL1 = function () { startLevel(1); };
    if (realWin) spawnConfetti(over);
  }

  /* ── confetti burst — real wins only, matches arcade.js's .arc-confetti recipe ── */
  function spawnConfetti (root) {
    if (!root) return;
    const colors = [ACC, ACC2, GOLD, GOOD, '#fff'];
    for (let i = 0; i < 46; i++) {
      setTimeout(() => {
        if (!root.isConnected) return;
        const el = document.createElement('div');
        const x = Math.random() * 100;
        el.style.cssText = `position:absolute;top:-24px;left:${x}%;width:${5+Math.random()*5}px;height:${5+Math.random()*5}px;border-radius:${Math.random()>.5?'50%':'2px'};background:${colors[Math.floor(Math.random()*colors.length)]};z-index:35;pointer-events:none;animation:mm_confettiFall ${1.3+Math.random()*.8}s ease-in forwards`;
        root.appendChild(el);
        setTimeout(() => el.remove(), 2200);
      }, i * 28);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     INPUT
  ══════════════════════════════════════════════════════════════ */

  /* stored so they can be removed on exit */
  let _onKeyDown = null;
  let _onKeyUp   = null;

  function _removeInputListeners () {
    if (_onKeyDown) { document.removeEventListener('keydown', _onKeyDown); _onKeyDown = null; }
    if (_onKeyUp)   { document.removeEventListener('keyup',   _onKeyUp);   _onKeyUp   = null; }
  }

  function setupInput () {
    /* remove any previously attached listeners before adding new ones */
    _removeInputListeners();

    /* keyboard */
    const onKey = (e, down) => {
      if (!G) return;
      if (e.key === 'ArrowLeft'  || e.key === 'a') { G.keys.left  = down; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd') { G.keys.right = down; e.preventDefault(); }
    };
    _onKeyDown = e => onKey(e, true);
    _onKeyUp   = e => onKey(e, false);
    document.addEventListener('keydown', _onKeyDown, { passive: false });
    document.addEventListener('keyup',   _onKeyUp,   { passive: false });

    /* touch / mouse drag on canvas */
    const canvas = document.getElementById('mmCanvas');

    const handleMove = (clientX) => {
      if (!G || !G.running) return;
      const rect = canvas ? canvas.getBoundingClientRect() : { left: 0 };
      const x    = clientX - rect.left;
      G.playerX  = Math.max(G.playerW/2, Math.min(G.W - G.playerW/2, x));
    };

    if (canvas) {
      canvas.addEventListener('mousemove', e => { handleMove(e.clientX); });
      canvas.addEventListener('touchmove', e => { e.preventDefault(); handleMove(e.touches[0].clientX); }, { passive: false });
    }

    /* global touch fallback for whole screen */
    const root = document.getElementById('mmRoot');
    if (root) {
      root.addEventListener('touchmove', e => {
        if (!G || !G.running) return;
        handleMove(e.touches[0].clientX);
      }, { passive: true });
      root.addEventListener('mousemove', e => {
        if (!G || !G.running) return;
        handleMove(e.clientX);
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════
     UTILITIES
  ══════════════════════════════════════════════════════════════ */
  function pickRandom (arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ══════════════════════════════════════════════════════════════
     DEBUG HOOK (dev/QA only — G is closure-private otherwise)
  ══════════════════════════════════════════════════════════════ */
  window._mmDbg = () => G ? {
    lvl: G.lvl,
    followers: G.followers,
    target: G.targetFollowers,
    reputation: G.reputation,
    timeLeft: G.timeLeft,
    running: G.running,
    score3: G.score3,
    score2: G.score2,
  } : null;
  window._mmForceWin = () => { if (G) { G.followers = G.targetFollowers; triggerEnd('win'); } };
  window._mmSkipToLevel = (n) => { startLevel(n); };

})();
