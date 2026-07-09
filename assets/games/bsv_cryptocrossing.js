/* ════════════════════════════════════════════════════════════════
   CRYPTO CROSSING v1.0 — Bitstream Valley / Coinaverse
   Endless-runner on a glowing cyber highway through space.
   Collect BTC/ETH/Stablecoins/Keys, dodge Scam Coins/Hackers.
   3-lane swipe + keyboard controls. Level 1 (Learn) & 2 (Master).
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  let G = null, raf = null;

  /* ── Constants ─────────────────────────────────────────────── */
  const ACCENT = '#00FFFF';
  const LANES = 3;
  const LANE_FRAC = [0.22, 0.50, 0.78]; // x fractions of canvas width

  const GOOD_ITEMS = [
    { id: 'btc',   label: 'BTC',        symbol: '₿',  color: '#F7931A', glow: '#ffb347', pts: 120, walletHP: 0,  scam: false },
    { id: 'eth',   label: 'ETH',        symbol: 'Ξ',  color: '#8B5CF6', glow: '#c4b5fd', pts: 80,  walletHP: 0,  scam: false },
    { id: 'usdt',  label: 'USDT',       symbol: '$',  color: '#26A17B', glow: '#6ee7b7', pts: 40,  walletHP: 0,  scam: false },
    { id: 'key',   label: 'WALLET KEY', symbol: '🔑', color: '#00FFFF', glow: '#a5f3fc', pts: 200, walletHP: 15, scam: false },
  ];

  /* Level 2 adds fake coins that look like real ones — similar symbol/color */
  const BAD_ITEMS = [
    { id: 'scambtc',  label: 'SCAM BTC',    symbol: 'B',  color: '#e8882a', glow: '#ef4444', pts: 0, walletHP: -25, scam: true },
    { id: 'fakewlt',  label: 'FAKE WALLET', symbol: '👜', color: '#374151', glow: '#ef4444', pts: 0, walletHP: -30, scam: true },
    { id: 'hacker',   label: 'HACKER',      symbol: '☠',  color: '#dc2626', glow: '#ff0040', pts: 0, walletHP: -35, scam: true },
    { id: 'rugpull',  label: 'RUG PULL',    symbol: '⚠',  color: '#b91c1c', glow: '#ff3366', pts: 0, walletHP: -20, scam: true },
    { id: 'phish',    label: 'PHISHING',    symbol: '🎣', color: '#7f1d1d', glow: '#f87171', pts: 0, walletHP: -20, scam: true },
  ];

  /* Level 2 fake coins: visually similar to real ones */
  const FAKE_COINS = [
    { id: 'fakebtc2', label: 'SCAM COIN',   symbol: '฿',  color: '#d97706', glow: '#ef4444', pts: 0, walletHP: -25, scam: true },
    { id: 'fakeeth2', label: 'FAKE TOKEN',  symbol: 'Σ',  color: '#7c3aed', glow: '#ef4444', pts: 0, walletHP: -20, scam: true },
  ];

  /* Level 3 exclusive scams — disjoint from L1/L2, sharper look-alikes + higher stakes.
     Real financial-literacy concepts: fake airdrops, pump-and-dump baiting, impersonation,
     clone wallet apps, and fake "giveaway" bots — all genuine crypto scam categories. */
  const BAD_ITEMS_L3 = [
    { id: 'airdrop',   label: 'FAKE AIRDROP',   symbol: '🎁', color: '#9333ea', glow: '#ff0040', pts: 0, walletHP: -30, scam: true },
    { id: 'pumpdump',  label: 'PUMP & DUMP',    symbol: '📈', color: '#b45309', glow: '#ff3366', pts: 0, walletHP: -35, scam: true },
    { id: 'imposter',  label: 'IMPOSTER SUPPORT', symbol: '🎭', color: '#4b5563', glow: '#ff0040', pts: 0, walletHP: -30, scam: true },
    { id: 'giveaway',  label: 'GIVEAWAY BOT',   symbol: '🤖', color: '#dc2626', glow: '#ff3366', pts: 0, walletHP: -35, scam: true },
  ];
  const FAKE_COINS_L3 = [
    { id: 'clonewlt',  label: 'CLONE WALLET APP', symbol: '📱', color: '#0e7490', glow: '#ef4444', pts: 0, walletHP: -30, scam: true },
    { id: 'ghostkey',  label: 'GHOST KEY',      symbol: '🔓', color: '#334155', glow: '#ef4444', pts: 0, walletHP: -35, scam: true },
    { id: 'fakensrf',  label: 'KNOCKOFF NFT',   symbol: 'Ξ̶',  color: '#a21caf', glow: '#ef4444', pts: 0, walletHP: -25, scam: true },
  ];

  const LEVEL_CFG = [
    {
      name: 'LEARN MODE',      level: 1,   dur: 60,
      scoreGoal1: 800, scoreGoal2: 400,   // 3★ / 2★ thresholds
      goodChance: 0.78, badChance: 0.22,
      spawnInterval: 1.3, speedBase: 200, speedRamp: 0,
      bridges: false, slowZones: false, fakeLook: false,
      badPool: BAD_ITEMS, fakePool: FAKE_COINS,
    },
    {
      name: 'MASTER MODE',     level: 2,   dur: 90,
      scoreGoal1: 1800, scoreGoal2: 900,
      goodChance: 0.55, badChance: 0.45,
      spawnInterval: 0.85, speedBase: 280, speedRamp: 8,
      bridges: true, slowZones: true, fakeLook: true,
      badPool: BAD_ITEMS, fakePool: FAKE_COINS,
    },
    {
      name: 'PRO MODE',        level: 3,   dur: 110,
      scoreGoal1: 3000, scoreGoal2: 1600,
      goodChance: 0.42, badChance: 0.58,
      spawnInterval: 0.62, speedBase: 350, speedRamp: 14,
      bridges: true, slowZones: true, fakeLook: true,
      badPool: BAD_ITEMS_L3, fakePool: FAKE_COINS_L3,
    },
  ];

  /* ── Helpers ────────────────────────────────────────────────── */
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── State factory ──────────────────────────────────────────── */
  function makeState(lvIdx) {
    const cfg = LEVEL_CFG[lvIdx];
    return {
      phase: 'play',           // 'play' | 'over' | 'paused'
      lvIdx,
      cfg,
      score: 0,
      walletHP: 100,
      walletHPMax: 100,
      scamsAvoided: 0,
      scamsHit: 0,
      timeLeft: cfg.dur,
      elapsed: 0,
      spawnAcc: 0,
      speedCurrent: cfg.speedBase,

      // Player
      lane: 1,                 // 0 | 1 | 2
      targetLane: 1,
      laneX: 0,                // actual canvas x, animated
      jumping: false,
      jumpT: 0,                // 0–1 arc
      sliding: false,
      slideT: 0,
      slideKick: false,        // one-frame flag

      // Objects
      tokens: [],              // falling collectibles
      bridges: [],             // horizontal blockers (level 2)
      slowZones: [],           // slow-down strips (level 2)
      particles: [],
      floatTexts: [],

      // HUD
      shake: 0,
      flashBad: 0,
      flashGood: 0,
      integrityBonus: false,

      // Input
      touchStartX: null,
      touchStartY: null,
      keyLeft: false,
      keyRight: false,
      keyUp: false,
      keyDown: false,

      last: performance.now(),

      // cleanup refs
      _evClean: [],
    };
  }

  /* ── SCREEN ─────────────────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};

  window.SCREENS.game_bsv_cryptocrossing = function () {
    G = null;
    setTimeout(initGame, 40);
    return `<div id="ccWrap" style="position:absolute;inset:0;background:#03040c;overflow:hidden;font-family:'Inter',sans-serif;color:#fff;user-select:none;touch-action:none">

      <!-- TOP BAR -->
      <div id="ccTopBar" style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;gap:8px;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.85),transparent)">
        <button id="ccBack" style="padding:5px 11px;border:1px solid rgba(0,255,255,.35);border-radius:7px;background:rgba(0,255,255,.08);color:#00FFFF;font-size:.55rem;letter-spacing:.12em;cursor:pointer;font-family:inherit">← HUB</button>
        <div style="font-size:.58rem;letter-spacing:.18em;color:#00FFFF;flex:1;text-align:center;font-weight:700">CRYPTO CROSSING</div>
        <div id="ccTimer" style="font-size:.88rem;color:#FFD700;min-width:42px;text-align:right;font-weight:800;letter-spacing:.05em">60s</div>
      </div>

      <!-- WALLET HP BAR + SCORE ROW -->
      <div style="position:absolute;top:44px;left:0;right:0;z-index:20;padding:0 12px;display:flex;gap:7px;align-items:stretch">
        <div style="flex:1;background:rgba(0,0,0,.4);border:1px solid rgba(0,255,255,.18);border-radius:9px;padding:5px 8px">
          <div style="font-size:.35rem;letter-spacing:.12em;color:rgba(255,255,255,.4);margin-bottom:2px">WALLET HEALTH</div>
          <div style="height:7px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden">
            <div id="ccHPBar" style="height:100%;width:100%;background:linear-gradient(90deg,#00FFFF,#00ff99);border-radius:4px;transition:width .12s"></div>
          </div>
        </div>
        <div style="background:rgba(0,0,0,.4);border:1px solid rgba(255,215,0,.25);border-radius:9px;padding:5px 10px;text-align:center;min-width:72px">
          <div style="font-size:.35rem;letter-spacing:.1em;color:rgba(255,255,255,.4)">SCORE</div>
          <div id="ccScore" style="font-size:.9rem;color:#FFD700;font-weight:900;line-height:1.1">0</div>
        </div>
      </div>

      <!-- LEVEL BADGE -->
      <div id="ccLvBadge" style="position:absolute;top:84px;left:0;right:0;z-index:20;text-align:center;font-size:.38rem;letter-spacing:.2em;color:rgba(0,255,255,.55)">LEVEL 1 — LEARN MODE</div>

      <!-- CANVAS -->
      <canvas id="ccCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas>

      <!-- LEVEL SELECT OVERLAY (shown first) -->
      <div id="ccLevelSel" style="position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 0%,#001a2e,#03040c 70%);gap:18px;padding:24px">
        <div style="font-size:1.4rem;font-weight:900;letter-spacing:.12em;color:#00FFFF;text-shadow:0 0 30px #00FFFF">CRYPTO CROSSING</div>
        <div style="font-size:.55rem;letter-spacing:.15em;color:rgba(255,255,255,.5);text-align:center;max-width:280px;line-height:1.7">Sprint the digital highway — collect real crypto, dodge scams. Check every symbol before you grab it!</div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center">
          <button class="ccLvBtn" data-lv="0" style="padding:14px 22px;border:1px solid #00FFFF;border-radius:10px;background:rgba(0,255,255,.1);color:#00FFFF;font-size:.65rem;letter-spacing:.12em;cursor:pointer;font-weight:700">⚡ LEVEL 1<br><span style="font-size:.5rem;color:rgba(255,255,255,.5);font-weight:400">LEARN MODE</span></button>
          <button class="ccLvBtn" data-lv="1" style="padding:14px 22px;border:1px solid #FFD700;border-radius:10px;background:rgba(255,215,0,.08);color:#FFD700;font-size:.65rem;letter-spacing:.12em;cursor:pointer;font-weight:700">🔥 LEVEL 2<br><span style="font-size:.5rem;color:rgba(255,255,255,.5);font-weight:400">MASTER MODE</span></button>
          <button class="ccLvBtn" data-lv="2" style="padding:14px 22px;border:1px solid #ff4d9d;border-radius:10px;background:rgba(255,77,157,.08);color:#ff4d9d;font-size:.65rem;letter-spacing:.12em;cursor:pointer;font-weight:700">👑 LEVEL 3<br><span style="font-size:.5rem;color:rgba(255,255,255,.5);font-weight:400">PRO MODE</span></button>
        </div>
        <div style="font-size:.42rem;color:rgba(255,255,255,.3);letter-spacing:.1em;text-align:center;line-height:1.8">SWIPE UP → JUMP &nbsp;|&nbsp; SWIPE DOWN → SLIDE &nbsp;|&nbsp; SWIPE LEFT/RIGHT → CHANGE LANE<br>ARROW KEYS + SPACE also work</div>
      </div>

      <!-- END OVERLAY -->
      <div id="ccOver" style="position:absolute;inset:0;z-index:40;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(3,4,12,.92);backdrop-filter:blur(8px);gap:14px;padding:24px"></div>
    </div>`;
  };

  /* ── INIT ────────────────────────────────────────────────────── */
  function initGame() {
    const wrap = document.getElementById('ccWrap');
    if (!wrap) return;

    // Back button
    const backBtn = document.getElementById('ccBack');
    if (backBtn) backBtn.addEventListener('click', window.bsv_cryptocrossingExit);

    // Level select buttons
    wrap.querySelectorAll('.ccLvBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lv = parseInt(btn.dataset.lv, 10);
        document.getElementById('ccLevelSel').style.display = 'none';
        startLevel(lv);
      });
    });
  }

  function startLevel(lvIdx) {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    // Clean up old state listeners
    if (G && G._evClean) G._evClean.forEach(fn => fn());

    G = makeState(lvIdx);

    const lv = G.cfg;
    const badge = document.getElementById('ccLvBadge');
    if (badge) badge.textContent = `LEVEL ${lv.level} — ${lv.name}`;
    const timer = document.getElementById('ccTimer');
    if (timer) timer.textContent = lv.dur + 's';

    const cv = document.getElementById('ccCanvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');

    function resize() {
      cv.width = cv.clientWidth * devicePixelRatio;
      cv.height = cv.clientHeight * devicePixelRatio;
    }
    resize();

    // Input handlers
    function onKeyDown(e) {
      if (!G || G.phase !== 'play') return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); queueLane(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); queueLane(1); }
      if (e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); tryJump(); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); trySlide(); }
    }
    function onTouchStart(e) {
      if (!G || G.phase !== 'play') return;
      const t = e.touches[0];
      G.touchStartX = t.clientX;
      G.touchStartY = t.clientY;
    }
    function onTouchEnd(e) {
      if (!G || G.phase !== 'play') return;
      if (G.touchStartX === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - G.touchStartX;
      const dy = t.clientY - G.touchStartY;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      const thresh = 25;
      if (adx < thresh && ady < thresh) return;
      if (ady > adx) {
        if (dy < 0) tryJump(); else trySlide();
      } else {
        queueLane(dx < 0 ? -1 : 1);
      }
      G.touchStartX = null;
      G.touchStartY = null;
    }

    const resizeFn = resize;
    window.addEventListener('resize', resizeFn);
    window.addEventListener('keydown', onKeyDown);
    cv.addEventListener('touchstart', onTouchStart, { passive: true });
    cv.addEventListener('touchend', onTouchEnd, { passive: true });

    G._evClean = [
      () => window.removeEventListener('resize', resizeFn),
      () => window.removeEventListener('keydown', onKeyDown),
      () => cv.removeEventListener('touchstart', onTouchStart),
      () => cv.removeEventListener('touchend', onTouchEnd),
    ];

    G.last = performance.now();
    // initialise player x position
    G.laneX = cv.clientWidth * LANE_FRAC[G.lane];

    raf = requestAnimationFrame(ts => loop(ts, cv, ctx));
  }

  /* ── INPUT HELPERS ──────────────────────────────────────────── */
  function queueLane(dir) {
    if (!G) return;
    const next = clamp(G.targetLane + dir, 0, LANES - 1);
    G.targetLane = next;
  }
  function tryJump() {
    if (!G || G.jumping || G.sliding) return;
    G.jumping = true;
    G.jumpT = 0;
  }
  function trySlide() {
    if (!G || G.jumping) return;
    G.sliding = true;
    G.slideT = 0;
  }

  /* ── GAME LOOP ──────────────────────────────────────────────── */
  function loop(ts, cv, ctx) {
    if (!G || G.phase === 'over') return;
    const W = cv.clientWidth, H = cv.clientHeight;
    const dt = Math.min((ts - G.last) / 1000, 0.05);
    G.last = ts;

    update(dt, W, H);
    render(ctx, W, H, ts);
    updateHUD();

    raf = requestAnimationFrame(ts2 => loop(ts2, cv, ctx));
  }

  /* ── UPDATE ─────────────────────────────────────────────────── */
  function update(dt, W, H) {
    const cfg = G.cfg;

    // Timer
    G.timeLeft -= dt;
    G.elapsed += dt;
    if (G.timeLeft <= 0) { G.timeLeft = 0; endRound(); return; }
    if (G.walletHP <= 0) { endRound(); return; }

    // Speed ramp (level 2)
    G.speedCurrent = cfg.speedBase + cfg.speedRamp * G.elapsed;

    // Lane animation
    const targetX = W * LANE_FRAC[G.targetLane];
    G.lane = G.targetLane;
    G.laneX += (targetX - G.laneX) * Math.min(1, dt * 14);

    // Jump arc (sin curve, 0.45s)
    if (G.jumping) {
      G.jumpT += dt / 0.45;
      if (G.jumpT >= 1) { G.jumpT = 1; G.jumping = false; }
    }
    // Slide duration (0.5s)
    if (G.sliding) {
      G.slideT += dt / 0.5;
      if (G.slideT >= 1) { G.sliding = false; G.slideT = 0; }
    }

    // Spawn tokens
    G.spawnAcc += dt;
    const interval = cfg.spawnInterval * (G.sliding ? 1 : 1);
    if (G.spawnAcc >= interval) {
      G.spawnAcc = 0;
      spawnToken(W, H, cfg);
    }

    // Spawn bridges (level 2)
    if (cfg.bridges && Math.random() < dt * 0.35) {
      spawnBridge(W, H);
    }
    // Spawn slow zones (level 2)
    if (cfg.slowZones && Math.random() < dt * 0.25) {
      spawnSlowZone(W, H);
    }

    const speed = G.speedCurrent;

    // Move tokens
    for (let i = G.tokens.length - 1; i >= 0; i--) {
      const t = G.tokens[i];
      // slow zone effect
      let spd = speed;
      for (const sz of G.slowZones) {
        if (Math.abs(t.y - sz.y) < sz.h) spd *= 0.45;
      }
      t.y += spd * dt;
      t.age += dt;

      // Collision with player
      const px = G.laneX;
      const jumpOff = G.jumping ? Math.sin(G.jumpT * Math.PI) : 0;
      const py = playerYBase(H) - jumpOff * H * 0.22;
      const hitH = G.sliding ? 28 : 52;

      if (t.lane === G.lane && !t.hit &&
          Math.abs(t.x - px) < 36 &&
          Math.abs(t.y - py) < hitH) {
        t.hit = true;
        collectToken(t, W, H);
      }

      // Off screen
      if (t.y > H + 60) {
        if (t.item.scam && !t.hit) G.scamsAvoided++;
        G.tokens.splice(i, 1);
      }
    }

    // Move bridges
    for (let i = G.bridges.length - 1; i >= 0; i--) {
      const b = G.bridges[i];
      b.y += speed * dt * 0.9;
      b.x += b.vx * dt;
      if (b.x < 0 || b.x > W - b.w) b.vx *= -1;

      // Player collision — if on bridge lane and not jumping high enough
      const jumpOff = G.jumping ? Math.sin(G.jumpT * Math.PI) : 0;
      const py = playerYBase(H) - jumpOff * H * 0.22;
      const px = G.laneX;
      if (!b.hit && py > b.y - 20 && py < b.y + 30 && jumpOff < 0.35 &&
          px > b.x && px < b.x + b.w) {
        b.hit = true;
        G.shake = 0.25;
        G.flashBad = 0.3;
        G.walletHP = Math.max(0, G.walletHP - 15);
        spawnFloat('BRIDGE HIT!', px, py, '#ff3366');
      }

      if (b.y > H + 80) G.bridges.splice(i, 1);
    }

    // Move slow zones
    for (let i = G.slowZones.length - 1; i >= 0; i--) {
      const sz = G.slowZones[i];
      sz.y += speed * dt * 0.6;
      if (sz.y > H + sz.h) G.slowZones.splice(i, 1);
    }

    // Particles
    for (let i = G.particles.length - 1; i >= 0; i--) {
      const p = G.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      p.life -= dt;
      if (p.life <= 0) G.particles.splice(i, 1);
    }

    // Float texts
    for (let i = G.floatTexts.length - 1; i >= 0; i--) {
      const f = G.floatTexts[i];
      f.y -= 60 * dt;
      f.life -= dt;
      if (f.life <= 0) G.floatTexts.splice(i, 1);
    }

    // Decay shake/flash
    G.shake = Math.max(0, G.shake - dt * 3);
    G.flashBad = Math.max(0, G.flashBad - dt * 3);
    G.flashGood = Math.max(0, G.flashGood - dt * 3);
  }

  function playerYBase(H) {
    return H * 0.72;
  }

  function spawnToken(W, H, cfg) {
    const isGood = Math.random() < cfg.goodChance;
    let item;
    if (isGood) {
      item = pick(GOOD_ITEMS);
    } else {
      if (cfg.fakeLook && Math.random() < 0.4) {
        item = pick(cfg.fakePool || FAKE_COINS);
      } else {
        item = pick(cfg.badPool || BAD_ITEMS);
      }
    }
    const lane = randInt(0, 2);
    G.tokens.push({
      lane,
      x: W * LANE_FRAC[lane],
      y: -40,
      item,
      hit: false,
      age: 0,
      spin: Math.random() * Math.PI * 2,
    });
  }

  function spawnBridge(W, H) {
    const bw = W * rand(0.3, 0.55);
    G.bridges.push({
      x: rand(0, W - bw),
      y: -30,
      w: bw,
      h: 22,
      vx: rand(40, 90) * (Math.random() < 0.5 ? 1 : -1),
      hit: false,
    });
  }

  function spawnSlowZone(W, H) {
    G.slowZones.push({
      x: 0,
      y: -80,
      w: W,
      h: 70,
    });
  }

  function collectToken(t, W, H) {
    const item = t.item;
    if (item.scam) {
      // Hit by scam
      G.walletHP = Math.max(0, G.walletHP + item.walletHP);
      G.scamsHit++;
      G.shake = 0.4;
      G.flashBad = 0.5;
      burstParticles(t.x, t.y, '#ff3366', 8);
      spawnFloat(item.label + '!', t.x, t.y, '#ff3366');
    } else {
      // Collected good item
      G.score += item.pts;
      G.flashGood = 0.18;
      if (item.walletHP > 0) {
        G.walletHP = Math.min(G.walletHPMax, G.walletHP + item.walletHP);
      }
      burstParticles(t.x, t.y, item.color, 6);
      spawnFloat('+' + item.pts, t.x, t.y, item.color);
    }
  }

  function burstParticles(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = rand(60, 180);
      G.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 80,
        color,
        r: rand(2, 5),
        life: rand(0.4, 0.9),
      });
    }
  }

  function spawnFloat(text, x, y, color) {
    G.floatTexts.push({ text, x, y, color, life: 0.85 });
  }

  /* ── RENDER ─────────────────────────────────────────────────── */
  function render(ctx, W, H, ts) {
    ctx.clearRect(0, 0, W, H);

    // Camera shake
    let sx = 0, sy = 0;
    if (G.shake > 0) {
      sx = (Math.random() - 0.5) * G.shake * 14;
      sy = (Math.random() - 0.5) * G.shake * 8;
    }
    ctx.save();
    ctx.translate(sx, sy);

    // Background — star field
    drawBackground(ctx, W, H, ts);

    // Highway
    drawHighway(ctx, W, H, ts);

    // Slow zones
    for (const sz of G.slowZones) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#8B5CF6';
      ctx.fillRect(sz.x, sz.y, sz.w, sz.h);
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = 'rgba(139,92,246,.15)';
      ctx.font = '600 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ CONGESTION ZONE ⚡', W / 2, sz.y + sz.h / 2 + 4);
      ctx.restore();
    }

    // Bridges
    for (const b of G.bridges) {
      ctx.save();
      const grd = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
      grd.addColorStop(0, '#00FFFF');
      grd.addColorStop(1, '#8B5CF6');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.rect(b.x, b.y, b.w, b.h);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,255,255,.08)';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = 'bold 10px Inter';
      ctx.fillStyle = '#00FFFF';
      ctx.textAlign = 'center';
      ctx.fillText('BLOCKCHAIN BRIDGE', b.x + b.w / 2, b.y + b.h / 2 + 4);
      ctx.restore();
    }

    // Tokens
    for (const t of G.tokens) {
      if (t.hit) continue;
      drawToken(ctx, t, ts);
    }

    // Player
    drawPlayer(ctx, W, H, ts);

    // Particles
    for (const p of G.particles) {
      ctx.save();
      ctx.globalAlpha = p.life / 0.9;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Float texts
    for (const f of G.floatTexts) {
      ctx.save();
      ctx.globalAlpha = f.life / 0.85;
      ctx.fillStyle = f.color;
      ctx.font = 'bold 15px Inter';
      ctx.textAlign = 'center';
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 10;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }

    // Flash overlays
    if (G.flashBad > 0) {
      ctx.save();
      ctx.globalAlpha = G.flashBad * 0.25;
      ctx.fillStyle = '#ff3366';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (G.flashGood > 0) {
      ctx.save();
      ctx.globalAlpha = G.flashGood * 0.18;
      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    ctx.restore(); // end shake
  }

  // Stars
  const STARS = [];
  for (let i = 0; i < 120; i++) {
    STARS.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + 0.3, spd: Math.random() * 0.0004 + 0.0001 });
  }

  function drawBackground(ctx, W, H, ts) {
    // Deep space gradient
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#03040c');
    grd.addColorStop(0.6, '#050818');
    grd.addColorStop(1, '#0a0420');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.save();
    for (const s of STARS) {
      const t = (ts * s.spd) % 1;
      const y = (s.y + t) % 1;
      const twinkle = 0.4 + 0.6 * Math.sin(ts * 0.002 + s.x * 10);
      ctx.globalAlpha = twinkle * 0.7;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x * W, y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Nebula glow blobs
    ctx.save();
    ctx.globalAlpha = 0.04;
    const ng1 = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, W * 0.4);
    ng1.addColorStop(0, '#8B5CF6'); ng1.addColorStop(1, 'transparent');
    ctx.fillStyle = ng1; ctx.fillRect(0, 0, W, H);
    const ng2 = ctx.createRadialGradient(W * 0.8, H * 0.7, 0, W * 0.8, H * 0.7, W * 0.35);
    ng2.addColorStop(0, '#00FFFF'); ng2.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = ng2; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawHighway(ctx, W, H, ts) {
    const vanY = H * 0.38;    // vanishing point Y
    const vanX = W * 0.5;
    const groundY = H + 20;

    // Road surface fill
    const roadGrd = ctx.createLinearGradient(0, vanY, 0, groundY);
    roadGrd.addColorStop(0, 'rgba(5,8,30,.0)');
    roadGrd.addColorStop(0.2, 'rgba(5,8,30,.6)');
    roadGrd.addColorStop(1, 'rgba(10,5,40,.85)');
    ctx.fillStyle = roadGrd;

    // Trapezoidal road shape
    const rWTop = W * 0.12;
    const rWBot = W * 0.98;
    ctx.beginPath();
    ctx.moveTo(vanX - rWTop, vanY);
    ctx.lineTo(vanX + rWTop, vanY);
    ctx.lineTo(vanX + rWBot / 2, groundY);
    ctx.lineTo(vanX - rWBot / 2, groundY);
    ctx.closePath();
    ctx.fill();

    // Lane dividers — 2 lines between 3 lanes, perspective
    const laneEdges = [0.1, 0.27, 0.5, 0.73, 0.90]; // relative across road
    for (let li = 1; li < laneEdges.length - 1; li++) {
      const frac = laneEdges[li];
      const xTop = vanX + (frac - 0.5) * rWTop * 2;
      const xBot = vanX + (frac - 0.5) * rWBot;

      // Dashed neon lines scrolling
      const dashLen = 40;
      const gapLen = 30;
      const scroll = (ts * 0.25 * G.speedCurrent / 200) % (dashLen + gapLen);

      ctx.save();
      ctx.strokeStyle = li === 2 ? 'rgba(0,255,255,.35)' : 'rgba(0,255,255,.18)';
      ctx.lineWidth = li === 2 ? 2 : 1;
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = li === 2 ? 8 : 4;
      ctx.setLineDash([dashLen, gapLen]);
      ctx.lineDashOffset = -scroll;
      ctx.beginPath();
      ctx.moveTo(xTop, vanY);
      ctx.lineTo(xBot, groundY);
      ctx.stroke();
      ctx.restore();
    }

    // Road edges glowing
    const edgeL = { xTop: vanX - rWTop, xBot: vanX - rWBot / 2 };
    const edgeR = { xTop: vanX + rWTop, xBot: vanX + rWBot / 2 };

    ctx.save();
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 18;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(edgeL.xTop, vanY); ctx.lineTo(edgeL.xBot, groundY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(edgeR.xTop, vanY); ctx.lineTo(edgeR.xBot, groundY);
    ctx.stroke();
    ctx.restore();

    // Horizon glow
    ctx.save();
    const hGrd = ctx.createLinearGradient(0, vanY - 20, 0, vanY + 30);
    hGrd.addColorStop(0, 'transparent');
    hGrd.addColorStop(0.5, 'rgba(0,255,255,.12)');
    hGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = hGrd;
    ctx.fillRect(0, vanY - 20, W, 50);
    ctx.restore();
  }

  function drawToken(ctx, t, ts) {
    const item = t.item;
    const sz = 28;
    t.spin += 0.04;
    const pulse = 0.85 + 0.15 * Math.sin(ts * 0.004 + t.x);

    ctx.save();
    ctx.translate(t.x, t.y);

    // Glow
    ctx.shadowColor = item.glow;
    ctx.shadowBlur = 20 * pulse;

    // Circle bg
    ctx.beginPath();
    ctx.arc(0, 0, sz, 0, Math.PI * 2);
    const cGrd = ctx.createRadialGradient(0, 0, 4, 0, 0, sz);
    cGrd.addColorStop(0, item.color + 'cc');
    cGrd.addColorStop(1, item.color + '44');
    ctx.fillStyle = cGrd;
    ctx.fill();

    // Border
    ctx.strokeStyle = item.scam ? '#ff3366' : item.color;
    ctx.lineWidth = 2;
    if (item.scam) {
      ctx.setLineDash([4, 3]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Symbol
    ctx.shadowBlur = 0;
    if ([...item.symbol].length === 1 && item.symbol.codePointAt(0) > 127) {
      // emoji
      ctx.font = `${sz * 0.85}px Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(item.symbol, 0, 1);
    } else {
      ctx.font = `900 ${sz * 0.75}px Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(item.symbol, 0, 1);
    }

    // Label below coin (small)
    ctx.shadowBlur = 0;
    ctx.font = `700 8px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = item.scam ? '#ff3366' : item.color;
    ctx.fillText(item.label, 0, sz + 4);

    // Scam warning flash
    if (item.scam && Math.sin(ts * 0.012) > 0.3) {
      ctx.font = '900 10px Inter';
      ctx.fillStyle = '#ff3366';
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = 8;
      ctx.fillText('⚠', sz + 6, -sz * 0.5);
    }

    ctx.restore();
  }

  function drawPlayer(ctx, W, H, ts) {
    const px = G.laneX;
    const baseY = playerYBase(H);
    const jumpOff = G.jumping ? Math.sin(G.jumpT * Math.PI) * H * 0.22 : 0;
    const py = baseY - jumpOff;

    // Shadow on ground
    ctx.save();
    const shadowA = lerp(0.45, 0.08, jumpOff / (H * 0.22 + 0.001));
    ctx.globalAlpha = shadowA;
    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.ellipse(px, baseY + 10, 20 - jumpOff * 0.12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(px, py);

    // Slide squash
    const scaleY = G.sliding ? 0.55 : 1.0;
    const scaleX = G.sliding ? 1.4 : 1.0;
    ctx.scale(scaleX, scaleY);

    const bw = 22, bh = 44;

    // Body glow
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 18 + 8 * Math.sin(ts * 0.006);

    // Suit body
    const bodyGrd = ctx.createLinearGradient(-bw, -bh, bw, bh);
    bodyGrd.addColorStop(0, '#001a2e');
    bodyGrd.addColorStop(0.5, '#003344');
    bodyGrd.addColorStop(1, '#001020');
    ctx.fillStyle = bodyGrd;
    ctx.beginPath();
    ctx.roundRect(-bw, -bh, bw * 2, bh * 2, 10);
    ctx.fill();

    // Cyan suit trim
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Face visor
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(0,255,255,.15)';
    ctx.fillRect(-bw * 0.6, -bh * 0.75, bw * 1.2, bh * 0.35);
    ctx.strokeStyle = 'rgba(0,255,255,.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-bw * 0.6, -bh * 0.75, bw * 1.2, bh * 0.35);

    // BTC logo on chest
    ctx.shadowBlur = 0;
    ctx.font = 'bold 13px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 6;
    ctx.fillText('₿', 0, bh * 0.15);

    // Running legs (animated)
    ctx.shadowBlur = 0;
    const legSwing = G.jumping ? 0 : Math.sin(ts * 0.012) * 8;
    ctx.strokeStyle = '#00cccc';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    // Left leg
    ctx.beginPath();
    ctx.moveTo(-8, bh);
    ctx.lineTo(-8 - legSwing, bh + 14);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(8, bh);
    ctx.lineTo(8 + legSwing, bh + 14);
    ctx.stroke();

    ctx.restore();

    // Jump trail
    if (G.jumping && jumpOff > 5) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(px, py + 10);
      ctx.lineTo(px, baseY);
      ctx.stroke();
      ctx.restore();
    }

    // Lane indicator triangles below player
    for (let li = 0; li < LANES; li++) {
      const lx = W * LANE_FRAC[li];
      ctx.save();
      ctx.globalAlpha = li === G.lane ? 0.9 : 0.2;
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath();
      ctx.moveTo(lx, baseY + 28);
      ctx.lineTo(lx - 8, baseY + 40);
      ctx.lineTo(lx + 8, baseY + 40);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── HUD UPDATE ─────────────────────────────────────────────── */
  function updateHUD() {
    const hp = document.getElementById('ccHPBar');
    if (hp) {
      const pct = G.walletHP / G.walletHPMax * 100;
      hp.style.width = pct + '%';
      hp.style.background = pct > 60
        ? 'linear-gradient(90deg,#00FFFF,#00ff99)'
        : pct > 30
          ? 'linear-gradient(90deg,#FFD700,#ffa500)'
          : 'linear-gradient(90deg,#ff3366,#ff6666)';
    }
    const sc = document.getElementById('ccScore');
    if (sc) sc.textContent = G.score;
    const ti = document.getElementById('ccTimer');
    if (ti) {
      const s = Math.ceil(G.timeLeft);
      ti.textContent = s + 's';
      ti.style.color = s <= 10 ? '#ff3366' : '#FFD700';
    }
  }

  /* ── END ROUND ──────────────────────────────────────────────── */
  function endRound() {
    if (!G || G.phase === 'over') return;
    G.phase = 'over';
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (G._evClean) G._evClean.forEach(fn => fn());

    const cfg = G.cfg;
    const score = G.score;
    let stars = 0;
    if (score >= cfg.scoreGoal1) stars = 3;
    else if (score >= cfg.scoreGoal2) stars = 2;
    else if (score > 0) stars = 1;

    const perfectScam = G.scamsHit === 0;
    const integrityDelta = perfectScam ? 8 : Math.max(0, 5 - G.scamsHit);
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bsv_cryptocrossing', { level: cfg.level, is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const overDiv = document.getElementById('ccOver');
    if (!overDiv) return;

    const accuracyPct = G.scamsHit + G.scamsAvoided > 0
      ? Math.round(G.scamsAvoided / (G.scamsHit + G.scamsAvoided + 0.01) * 100)
      : 100;

    overDiv.innerHTML = `
      <div style="font-size:2.2rem;letter-spacing:.04em;line-height:1">${starStr}</div>
      <div style="font-size:1.3rem;font-weight:900;letter-spacing:.1em;color:#00FFFF;text-shadow:0 0 20px #00FFFF">${stars === 3 ? 'BLOCKCHAIN CERTIFIED!' : stars === 2 ? 'DELIVERY COMPLETE' : stars === 1 ? 'DELIVERED' : 'HACKED'}</div>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
        <div style="text-align:center;background:rgba(0,255,255,.07);border:1px solid rgba(0,255,255,.2);border-radius:10px;padding:10px 16px">
          <div style="font-size:.38rem;letter-spacing:.12em;color:rgba(255,255,255,.45);margin-bottom:3px">SCORE</div>
          <div style="font-size:1.1rem;font-weight:900;color:#FFD700">${score}</div>
        </div>
        <div style="text-align:center;background:rgba(0,255,255,.07);border:1px solid rgba(0,255,255,.2);border-radius:10px;padding:10px 16px">
          <div style="font-size:.38rem;letter-spacing:.12em;color:rgba(255,255,255,.45);margin-bottom:3px">COINS EARNED</div>
          <div style="font-size:1.1rem;font-weight:900;color:#FFD700">🪙 ${coins}</div>
        </div>
        <div style="text-align:center;background:rgba(0,255,255,.07);border:1px solid rgba(0,255,255,.2);border-radius:10px;padding:10px 16px">
          <div style="font-size:.38rem;letter-spacing:.12em;color:rgba(255,255,255,.45);margin-bottom:3px">SCAM BLOCK</div>
          <div style="font-size:1.1rem;font-weight:900;color:${accuracyPct >= 80 ? '#00ff99' : '#ff3366'}">${accuracyPct}%</div>
        </div>
      </div>
      ${perfectScam ? '<div style="font-size:.55rem;letter-spacing:.12em;color:#FFD700;background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.3);border-radius:8px;padding:7px 14px">🏆 AUTHENTICITY BONUS — ZERO SCAMS HIT! +' + integrityDelta + ' INTEGRITY</div>' : ''}
      <div style="max-width:300px;text-align:center;background:rgba(0,0,0,.4);border:1px solid rgba(0,255,255,.15);border-radius:10px;padding:12px 16px">
        <div style="font-size:.4rem;letter-spacing:.15em;color:#00FFFF;margin-bottom:6px">BLOCKCHAIN LESSON</div>
        <div style="font-size:.52rem;line-height:1.7;color:rgba(255,255,255,.8)">Real crypto has real value — always verify before you collect. Scam coins and fake wallets are designed to look legitimate. Check the symbol, source, and wallet address before trusting any digital currency.</div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        <button id="ccReplay" style="padding:12px 22px;border:1px solid #00FFFF;border-radius:10px;background:rgba(0,255,255,.12);color:#00FFFF;font-size:.62rem;letter-spacing:.12em;cursor:pointer;font-weight:700">▶ PLAY AGAIN</button>
        <button id="ccHub" style="padding:12px 22px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.7);font-size:.62rem;letter-spacing:.12em;cursor:pointer">← HUB</button>
      </div>`;
    overDiv.style.display = 'flex';
    overDiv.style.flexDirection = 'column';
    overDiv.style.alignItems = 'center';
    overDiv.style.justifyContent = 'center';
    overDiv.style.gap = '14px';

    document.getElementById('ccReplay')?.addEventListener('click', () => {
      overDiv.style.display = 'none';
      startLevel(G ? G.lvIdx : 0);
    });
    document.getElementById('ccHub')?.addEventListener('click', window.bsv_cryptocrossingExit);
  }

  /* ── EXIT ────────────────────────────────────────────────────── */
  window.bsv_cryptocrossingExit = function () {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (G && G._evClean) G._evClean.forEach(fn => fn());
    G = null;
    if (window.state) state.viewingWorld = 'builder';
    if (window.goTo) goTo('hub');
  };

  /* ── DEBUG HOOK (dev/QA only) ───────────────────────────────── */
  window._ccDbg = () => G ? {
    lvIdx: G.lvIdx, level: G.cfg.level, name: G.cfg.name,
    score: G.score, walletHP: G.walletHP, timeLeft: G.timeLeft,
    scoreGoal1: G.cfg.scoreGoal1, scoreGoal2: G.cfg.scoreGoal2,
    badPoolIds: (G.cfg.badPool || []).map(i => i.id),
    fakePoolIds: (G.cfg.fakePool || []).map(i => i.id),
  } : null;
  window._ccForceWin = (targetScore) => {
    if (!G) return 'no active game — call startLevel(0|1|2) first';
    G.score = targetScore != null ? targetScore : G.cfg.scoreGoal1;
    G.timeLeft = 0;
    return 'forced score=' + G.score + ', next frame will trigger endRound()';
  };

})();
