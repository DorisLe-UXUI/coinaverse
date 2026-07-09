/* ════════════════════════════════════════════════════════════════
   SCALING CENTER — Launch Lab / Risk Taker Hub
   Resource Management + Path Building
   Connect nodes (Factory → Warehouse → AI Hub → Shipping → HQ)
   Draw efficient routes, manage budget, handle disruptions.
   Level 1: Single city, learn routing basics, generous budget.
   Level 2: Multi-city, random disruptions, real-time re-routing.
   WIN: Reach Global Company status before the timer expires.
   Pillar: scale
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── palette ─────────────────────────────────────────────────── */
  const ACC   = '#7C3AED';
  const ACC2  = '#A78BFA';
  const ACC3  = '#5B21B6';
  const GOLD  = '#FBBF24';
  const CYAN  = '#22D3EE';
  const GOOD  = '#22C55E';
  const WARN  = '#F59E0B';
  const DANGER= '#EF4444';
  const BG    = '#03040c';
  const BG2   = '#0a0a1a';
  const BG3   = '#0f0f2e';

  /* ── node type definitions ───────────────────────────────────── */
  const NODE_TYPES = {
    FACTORY:   { label:'Factory',   emoji:'🏭', color:'#7C3AED', glow:'#7C3AED60', tier:0 },
    WAREHOUSE: { label:'Warehouse', emoji:'📦', color:'#22D3EE', glow:'#22D3EE60', tier:1 },
    AI_HUB:    { label:'AI Hub',    emoji:'🤖', color:'#A78BFA', glow:'#A78BFA60', tier:2 },
    SHIPPING:  { label:'Shipping',  emoji:'🚢', color:'#FBBF24', glow:'#FBBF2460', tier:3 },
    HQ:        { label:'Global HQ', emoji:'🌐', color:'#22C55E', glow:'#22C55E60', tier:4 },
  };

  /* ── resource flow definitions ───────────────────────────────── */
  const RESOURCES = [
    { id:'supplies',    label:'Supplies',    emoji:'⚙️',  color:'#7C3AED', from:'FACTORY',   to:'WAREHOUSE' },
    { id:'automation',  label:'Automation',  emoji:'🤖',  color:'#A78BFA', from:'WAREHOUSE',  to:'AI_HUB'   },
    { id:'shipping',    label:'Shipping',    emoji:'📦',  color:'#FBBF24', from:'AI_HUB',     to:'SHIPPING'  },
    { id:'global',      label:'Global',      emoji:'🌐',  color:'#22C55E', from:'SHIPPING',   to:'HQ'        },
  ];

  /* ── disruption types ────────────────────────────────────────── */
  const DISRUPTIONS = [
    { id:'outage',   label:'Factory Outage',       emoji:'⚡', node:'FACTORY',   penaltyBudget:0,  penaltyThroughput:40, duration:8  },
    { id:'delay',    label:'Shipping Delay',        emoji:'🌊', node:'SHIPPING',  penaltyBudget:0,  penaltyThroughput:30, duration:10 },
    { id:'demand',   label:'Demand Spike',          emoji:'📈', node:'WAREHOUSE', penaltyBudget:20, penaltyThroughput:0,  duration:6  },
    { id:'upgrade',  label:'Tech Upgrade Available',emoji:'🔬', node:'AI_HUB',    penaltyBudget:0,  penaltyThroughput:0,  duration:12 },
    { id:'cyberattack', label:'Cyberattack',        emoji:'🛑', node:'AI_HUB',    penaltyBudget:30, penaltyThroughput:55, duration:9,  severe:true },
    { id:'freeze',   label:'Regulatory Freeze',     emoji:'🧊', node:'HQ',        penaltyBudget:40, penaltyThroughput:20, duration:10, severe:true },
  ];

  /* ── level config ────────────────────────────────────────────── */
  const CFG = {
    1: {
      label: 'LEARN',
      time: 120,
      budget: 800,
      globalTarget: 60,    // throughput score needed for Global Company
      nodes: [
        { id:'f1', type:'FACTORY',   x:0.18, y:0.35, city:'Springfield' },
        { id:'w1', type:'WAREHOUSE', x:0.38, y:0.28, city:'Springfield' },
        { id:'a1', type:'AI_HUB',    x:0.55, y:0.40, city:'Springfield' },
        { id:'s1', type:'SHIPPING',  x:0.72, y:0.30, city:'Springfield' },
        { id:'h1', type:'HQ',        x:0.82, y:0.55, city:'Springfield' },
      ],
      hints: true,
      disruptions: false,
      disruptInterval: [8, 16],   // seconds between disruption rolls [min, min+range]
    },
    2: {
      label: 'MASTER',
      time: 90,
      budget: 1200,
      globalTarget: 120,
      nodes: [
        { id:'f1', type:'FACTORY',   x:0.12, y:0.25, city:'North City' },
        { id:'f2', type:'FACTORY',   x:0.15, y:0.65, city:'South City' },
        { id:'w1', type:'WAREHOUSE', x:0.32, y:0.20, city:'North City' },
        { id:'w2', type:'WAREHOUSE', x:0.30, y:0.70, city:'South City' },
        { id:'a1', type:'AI_HUB',    x:0.50, y:0.35, city:'Central Hub' },
        { id:'a2', type:'AI_HUB',    x:0.50, y:0.65, city:'Central Hub' },
        { id:'s1', type:'SHIPPING',  x:0.68, y:0.25, city:'Port Alpha' },
        { id:'s2', type:'SHIPPING',  x:0.70, y:0.72, city:'Port Beta' },
        { id:'h1', type:'HQ',        x:0.85, y:0.50, city:'Global HQ' },
      ],
      hints: false,
      disruptions: true,
      disruptInterval: [8, 18],   // seconds between disruption rolls [min, min+range]
    },
    3: {
      label: 'LEGENDARY',
      time: 75,
      budget: 1500,
      globalTarget: 170,
      nodes: [
        { id:'f1', type:'FACTORY',   x:0.08, y:0.14, city:'North City' },
        { id:'w1', type:'WAREHOUSE', x:0.22, y:0.10, city:'North City' },
        { id:'f2', type:'FACTORY',   x:0.07, y:0.52, city:'West Bay' },
        { id:'w3', type:'WAREHOUSE', x:0.21, y:0.48, city:'West Bay' },
        { id:'f3', type:'FACTORY',   x:0.09, y:0.90, city:'South City' },
        { id:'w2', type:'WAREHOUSE', x:0.23, y:0.86, city:'South City' },
        { id:'a1', type:'AI_HUB',    x:0.42, y:0.28, city:'Central Hub' },
        { id:'a2', type:'AI_HUB',    x:0.42, y:0.62, city:'Central Hub' },
        { id:'a3', type:'AI_HUB',    x:0.58, y:0.45, city:'Innovation District' },
        { id:'s1', type:'SHIPPING',  x:0.74, y:0.12, city:'Port Alpha' },
        { id:'s2', type:'SHIPPING',  x:0.76, y:0.50, city:'Port Beta' },
        { id:'s3', type:'SHIPPING',  x:0.74, y:0.88, city:'Port Beta' },
        { id:'h1', type:'HQ',        x:0.93, y:0.50, city:'Global HQ' },
      ],
      hints: false,
      disruptions: true,
      severeDisruptions: true,   // unlocks the harsher DISRUPTIONS entries (cyberattack/freeze)
      disruptInterval: [5, 12],  // faster/harsher than level 2's [8, 18]
    }
  };

  /* ── star thresholds ─────────────────────────────────────────── */
  const STAR3_SPEND = 0.60;   // spent ≤60% of budget = 3 stars
  const STAR2_SPEND = 0.85;   // spent ≤85% of budget = 2 stars

  /* ── internal state ──────────────────────────────────────────── */
  let G = null;
  let _raf = null;
  let _canvas = null;
  let _ctx = null;

  /* ══════════════════════════════════════════════════════════════
     SCREEN ENTRY POINT
  ══════════════════════════════════════════════════════════════ */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS['game_ll_scaling_center'] = function () {
    G = null;
    cancelAnimationFrame(_raf);
    setTimeout(initGame, 40);
    return `
<style id="sc_styles">
  /* win-only entrance for the final result / level-complete overlays:
     bouncy scale+rotate pop, distinct from the loss screen's plain fade
     (see endGame() / showLevelComplete()) */
  @keyframes sc_win_pop {
    0%   { transform:scale(.4) rotate(-8deg); opacity:0; }
    60%  { transform:scale(1.08) rotate(2deg); opacity:1; }
    100% { transform:scale(1) rotate(0deg); opacity:1; }
  }
  @keyframes sc_loss_fade {
    from { transform:scale(.97); opacity:0; }
    to   { transform:scale(1); opacity:1; }
  }
</style>
<div id="sc_root" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none;">
  <!-- TOP BAR -->
  <div id="sc_topbar" style="position:absolute;top:0;left:0;right:0;height:52px;background:${BG2};border-bottom:1px solid ${ACC}40;display:flex;align-items:center;padding:0 12px;gap:12px;z-index:30;">
    <button id="sc_back" style="background:${ACC}25;border:1px solid ${ACC}60;color:${ACC2};padding:6px 14px;border-radius:8px;cursor:pointer;font-size:14px;font-family:Inter,sans-serif;">← HUB</button>
    <div style="flex:1;text-align:center;">
      <span style="font-family:'Orbitron',monospace;font-size:13px;font-weight:700;letter-spacing:2px;color:${ACC2};">SCALING CENTER</span>
    </div>
    <button id="sc_help_btn" title="How to play" style="background:${ACC}25;border:1px solid ${ACC}60;color:${ACC2};padding:6px 10px;border-radius:8px;cursor:pointer;font-size:13px;font-family:Inter,sans-serif;">❓</button>
    <div style="display:flex;gap:16px;align-items:center;">
      <div>
        <span style="font-size:10px;color:#888;letter-spacing:1px;">THROUGHPUT</span><br>
        <span id="sc_score" style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:${GOLD};">0</span>
      </div>
      <div>
        <span style="font-size:10px;color:#888;letter-spacing:1px;">BUDGET</span><br>
        <span id="sc_budget" style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:${GOOD};">$800</span>
      </div>
      <div>
        <span style="font-size:10px;color:#888;letter-spacing:1px;">TIME</span><br>
        <span id="sc_timer" style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:#fff;">2:00</span>
      </div>
    </div>
  </div>

  <!-- LEVEL BADGE -->
  <div id="sc_lvlbadge" style="position:absolute;top:60px;left:50%;transform:translateX(-50%);background:${ACC}30;border:1px solid ${ACC}60;border-radius:20px;padding:4px 16px;font-size:11px;letter-spacing:2px;color:${ACC2};z-index:20;">LVL 1 · LEARN</div>

  <!-- STATUS BAR -->
  <div id="sc_statusbar" style="position:absolute;top:60px;left:12px;background:${BG2};border:1px solid ${ACC}30;border-radius:8px;padding:6px 12px;z-index:20;min-width:180px;">
    <div style="font-size:10px;color:#888;letter-spacing:1px;margin-bottom:4px;">GLOBAL STATUS</div>
    <div id="sc_progress_bar" style="height:8px;background:#ffffff15;border-radius:4px;overflow:hidden;">
      <div id="sc_progress_fill" style="height:100%;background:linear-gradient(90deg,${ACC},${GOOD});width:0%;transition:width 0.3s;border-radius:4px;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:3px;">
      <span id="sc_progress_pct" style="font-size:10px;color:${ACC2};">0%</span>
      <span style="font-size:10px;color:#555;">GLOBAL: 100%</span>
    </div>
  </div>

  <!-- DISRUPTION PANEL -->
  <div id="sc_disruption" style="position:absolute;top:60px;right:12px;background:${DANGER}15;border:1px solid ${DANGER}40;border-radius:8px;padding:6px 12px;z-index:20;display:none;max-width:200px;">
    <div style="font-size:10px;color:${DANGER};letter-spacing:1px;">⚠ DISRUPTION</div>
    <div id="sc_dis_text" style="font-size:12px;color:#fff;margin-top:2px;"></div>
  </div>

  <!-- CANVAS -->
  <canvas id="sc_canvas" style="position:absolute;top:52px;left:0;right:0;bottom:60px;display:block;cursor:crosshair;touch-action:none;"></canvas>

  <!-- BOTTOM PANEL -->
  <div id="sc_bottom" style="position:absolute;bottom:0;left:0;right:0;height:60px;background:${BG2};border-top:1px solid ${ACC}30;display:flex;align-items:center;padding:0 16px;gap:12px;z-index:20;">
    <div style="font-size:11px;color:#888;">
      <span style="color:${ACC2};">CLICK</span> node to start route &nbsp;·&nbsp;
      <span style="color:${ACC2};">CLICK</span> target to connect &nbsp;·&nbsp;
      <span style="color:${WARN};">RIGHT-CLICK</span> to delete route
    </div>
    <div style="flex:1;"></div>
    <div id="sc_hint" style="font-size:11px;color:${GOLD};display:none;"></div>
    <button id="sc_upgrade_btn" style="display:none;background:${GOLD}20;border:1px solid ${GOLD}60;color:${GOLD};padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-family:Inter,sans-serif;">⬆ UPGRADE NODE ($150)</button>
  </div>

  <!-- END OVERLAY (hidden) -->
  <div id="sc_overlay" style="display:none;position:absolute;inset:0;background:${BG}ee;z-index:50;display:none;align-items:center;justify-content:center;flex-direction:column;gap:16px;"></div>

  <!-- HOW-TO-PLAY OVERLAY (first-time intro + ❓ re-open; kept separate from
       sc_overlay so it can sit on top of the level-select/transition/end
       screens without overwriting their markup) -->
  <div id="sc_help" style="display:none;position:absolute;inset:0;background:${BG}ee;z-index:55;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:16px;"></div>
</div>`;
  };

  /* ══════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════ */
  function initGame () {
    _canvas = document.getElementById('sc_canvas');
    if (!_canvas) return;
    _ctx = _canvas.getContext('2d');
    resizeCanvas();

    document.getElementById('sc_back').addEventListener('click', window.ll_scaling_centerExit);
    document.getElementById('sc_upgrade_btn').addEventListener('click', onUpgradeClick);

    _canvas.addEventListener('mousedown', onMouseDown);
    _canvas.addEventListener('mouseup',   onMouseUp);
    _canvas.addEventListener('mousemove', onMouseMove);
    _canvas.addEventListener('contextmenu', onRightClick);
    _canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    _canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
    _canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });

    window.addEventListener('resize', resizeCanvas);

    const helpBtn = document.getElementById('sc_help_btn');
    if (helpBtn) helpBtn.addEventListener('click', window.scShowHelp);

    showLevelSelect();

    /* first-time how-to-play, shown on top of the level-select screen so a
       fresh player reads it before picking a level. No RAF is running yet
       at this point (showLevelSelect() itself calls cancelAnimationFrame),
       so there is no timer to pause here — see showHowToPlay() for the
       mid-game pause/resume path used when reopened via ❓ during play. */
    if (!_scSeenIntro) {
      _scSeenIntro = true;
      showHowToPlay();
    }
  }
  let _scSeenIntro = false;

  function resizeCanvas () {
    if (!_canvas) return;
    const root = document.getElementById('sc_root');
    if (!root) return;
    _canvas.width  = root.clientWidth;
    _canvas.height = root.clientHeight - 52 - 60;
    if (G && G.phase === 'play') layoutNodes();
  }

  /* ══════════════════════════════════════════════════════════════
     LEVEL SELECT
  ══════════════════════════════════════════════════════════════ */
  function showLevelSelect () {
    cancelAnimationFrame(_raf);
    const ov = document.getElementById('sc_overlay');
    ov.style.display = 'flex';
    ov.style.flexDirection = 'column';
    ov.style.alignItems = 'center';
    ov.style.justifyContent = 'center';
    ov.innerHTML = `
      <div style="font-family:'Orbitron',monospace;font-size:22px;font-weight:700;color:${ACC2};letter-spacing:3px;margin-bottom:6px;">SCALING CENTER</div>
      <div style="font-size:13px;color:#888;margin-bottom:30px;text-align:center;max-width:360px;">Connect factories to warehouses to AI hubs to shipping centres to build a global company. Route efficiently to maximize throughput.</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;">
        <div onclick="window._scStartLevel(1)" style="cursor:pointer;background:${ACC}20;border:2px solid ${ACC};border-radius:12px;padding:20px 28px;text-align:center;transition:all 0.2s;" onmouseover="this.style.background='${ACC}40'" onmouseout="this.style.background='${ACC}20'">
          <div style="font-size:24px;margin-bottom:8px;">🏙️</div>
          <div style="font-family:'Orbitron',monospace;font-size:14px;color:${ACC2};letter-spacing:1px;">LEVEL 1</div>
          <div style="font-size:12px;color:${GOOD};margin-top:4px;">LEARN</div>
          <div style="font-size:11px;color:#666;margin-top:8px;">Single city<br>120 seconds<br>Budget: $800</div>
        </div>
        <div onclick="window._scStartLevel(2)" style="cursor:pointer;background:${GOLD}10;border:2px solid ${GOLD}80;border-radius:12px;padding:20px 28px;text-align:center;transition:all 0.2s;" onmouseover="this.style.background='${GOLD}20'" onmouseout="this.style.background='${GOLD}10'">
          <div style="font-size:24px;margin-bottom:8px;">🌍</div>
          <div style="font-family:'Orbitron',monospace;font-size:14px;color:${GOLD};letter-spacing:1px;">LEVEL 2</div>
          <div style="font-size:12px;color:${WARN};margin-top:4px;">MASTER</div>
          <div style="font-size:11px;color:#666;margin-top:8px;">Multi-city<br>90 seconds<br>Random disruptions</div>
        </div>
        <div onclick="window._scStartLevel(3)" style="cursor:pointer;background:${DANGER}10;border:2px solid ${DANGER}80;border-radius:12px;padding:20px 28px;text-align:center;transition:all 0.2s;" onmouseover="this.style.background='${DANGER}20'" onmouseout="this.style.background='${DANGER}10'">
          <div style="font-size:24px;margin-bottom:8px;">🚀</div>
          <div style="font-family:'Orbitron',monospace;font-size:14px;color:${DANGER};letter-spacing:1px;">LEVEL 3</div>
          <div style="font-size:12px;color:${DANGER};margin-top:4px;">LEGENDARY</div>
          <div style="font-size:11px;color:#666;margin-top:8px;">8 cities<br>75 seconds<br>Severe disruptions</div>
        </div>
      </div>`;
    window._scStartLevel = startLevel;
  }

  /* ══════════════════════════════════════════════════════════════
     HOW-TO-PLAY — shown once automatically on top of the level-select
     screen, and re-openable anytime via the ❓ button without losing
     progress. Pause trick: same as the game's own gameLoop clock —
     G.lastTick = performance.now(), dt = (ts - G.lastTick)/1000 each
     frame. Freezing the RAF (cancelAnimationFrame) stops G.timeLeft
     from draining; on resume, resetting G.lastTick = performance.now()
     right before restarting the loop makes the very next dt exclude
     the entire paused duration. If no level is in progress (still on
     the level-select / transition / end screen), there is no RAF
     running and nothing to pause — the overlay just layers on top.
  ══════════════════════════════════════════════════════════════ */
  function showHowToPlay () {
    const overlay = document.getElementById('sc_help');
    if (!overlay) return;
    const wasPlay = G && G.phase === 'play';
    if (wasPlay) {
      G.phase = 'paused';
      cancelAnimationFrame(_raf);
    }
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div style="max-width:380px;width:92%;padding:26px 22px;background:rgba(10,10,26,.97);border:1.5px solid ${ACC}88;border-radius:18px;text-align:center;box-shadow:0 0 50px ${ACC}33;max-height:90vh;overflow-y:auto">
        <div style="font-family:'Orbitron',monospace;font-size:11px;letter-spacing:3px;color:${ACC2};margin-bottom:8px">HOW TO PLAY</div>
        <div style="font-size:2rem;margin-bottom:6px">🌐</div>
        <div style="font-family:'Orbitron',monospace;font-size:15px;margin-bottom:14px">SCALING CENTER</div>
        <ul style="text-align:left;font-size:12.5px;color:rgba(255,255,255,.82);line-height:1.6;margin:0 0 18px;padding-left:18px">
          <li style="margin-bottom:8px"><b style="color:${ACC2}">Goal:</b> build a full pipeline — Factory → Warehouse → AI Hub → Shipping → Global HQ — before time runs out.</li>
          <li style="margin-bottom:8px"><b style="color:${ACC2}">How to play:</b> click a node to start a route, then click another node to connect them. Right-click a route to delete it.</li>
          <li style="margin-bottom:8px"><b style="color:${ACC2}">Watch out:</b> every route costs budget, and from Level 2 on random disruptions ⚡ can knock out a node — reroute or upgrade it to recover.</li>
          <li><b style="color:${ACC2}">Scoring:</b> reach Global Company status while spending less of your budget to earn more stars.</li>
        </ul>
        <button onclick="window.scCloseHelp()" style="background:${ACC};border:none;color:#fff;padding:12px 30px;border-radius:11px;cursor:pointer;font-size:13px;font-family:'Orbitron',monospace;letter-spacing:1px;font-weight:700;">${wasPlay ? '▶ RESUME' : 'GOT IT — START ▶'}</button>
      </div>`;
  }

  window.scShowHelp = function () {
    if (G && G.phase === 'end') return;
    showHowToPlay();
  };

  window.scCloseHelp = function () {
    const overlay = document.getElementById('sc_help');
    if (overlay) overlay.style.display = 'none';
    if (G && G.phase === 'paused') {
      G.phase = 'play';
      G.lastTick = performance.now();   // exclude paused duration from next dt
      _raf = requestAnimationFrame(gameLoop);
    }
  };

  /* ══════════════════════════════════════════════════════════════
     START LEVEL
  ══════════════════════════════════════════════════════════════ */
  function startLevel (lvl) {
    cancelAnimationFrame(_raf);
    const cfg = CFG[lvl];

    document.getElementById('sc_overlay').style.display = 'none';
    document.getElementById('sc_lvlbadge').textContent = `LVL ${lvl} · ${cfg.label}`;
    document.getElementById('sc_hint').style.display = cfg.hints ? 'block' : 'none';

    G = {
      level:         lvl,
      phase:         'play',
      score:         0,          // throughput score
      budget:        cfg.budget,
      budgetStart:   cfg.budget,
      timeLeft:      cfg.time,
      lastTick:      performance.now(),
      nodes:         buildNodes(cfg),
      routes:        [],         // { fromId, toId, resourceId, cost, throughput, bottleneck, broken }
      dragging:      null,       // { fromNode }
      mouseX:        0,
      mouseY:        0,
      selectedNode:  null,
      disruptions:   [],         // active disruption objects
      nextDisrupt:   cfg.disruptions ? rollDisruptInterval(cfg) : 9999,
      disruptTimer:  0,
      throughputAccum: 0,        // accumulates fractional throughput per tick
      globalPct:     0,
      globalTarget:  cfg.globalTarget,
      particles:     [],
      gridLines:     generateGrid(),
      won:           false,
    };

    layoutNodes();
    updateHUD();
    setHint(lvl === 1 ? '💡 Click a Factory node to start drawing a route' : null);
    _raf = requestAnimationFrame(gameLoop);
  }

  /* ── build node objects from config ─────────────────────────── */
  function buildNodes (cfg) {
    return cfg.nodes.map(nd => ({
      id:         nd.id,
      type:       nd.type,
      city:       nd.city,
      xPct:       nd.x,
      yPct:       nd.y,
      x:          0,
      y:          0,
      r:          28,
      throughput: 100,     // 0-100%, reduced by disruptions
      level:      1,       // node upgrade level (1-3)
      disrupted:  false,
      pulse:      0,
    }));
  }

  function layoutNodes () {
    if (!G || !_canvas) return;
    const W = _canvas.width;
    const H = _canvas.height;
    G.nodes.forEach(nd => {
      nd.x = nd.xPct * W;
      nd.y = nd.yPct * H;
    });
  }

  function generateGrid () {
    const lines = [];
    for (let i = 0; i <= 20; i++) {
      lines.push({ type: 'h', pct: i / 20 });
      lines.push({ type: 'v', pct: i / 20 });
    }
    return lines;
  }

  /* ══════════════════════════════════════════════════════════════
     GAME LOOP
  ══════════════════════════════════════════════════════════════ */
  function gameLoop (ts) {
    if (!G || G.phase !== 'play') return;
    const dt = Math.min((ts - G.lastTick) / 1000, 0.1);
    G.lastTick = ts;

    /* timer */
    G.timeLeft -= dt;
    if (G.timeLeft <= 0) {
      G.timeLeft = 0;
      finishLevel(false);
      return;
    }

    /* disruptions (any level with CFG[level].disruptions === true) */
    if (CFG[G.level].disruptions) {
      G.disruptTimer += dt;
      if (G.disruptTimer >= G.nextDisrupt) {
        fireDisruption();
        G.nextDisrupt = G.disruptTimer + rollDisruptInterval(CFG[G.level]);
      }
      /* tick disruption durations */
      G.disruptions = G.disruptions.filter(dis => {
        dis.remaining -= dt;
        if (dis.remaining <= 0) {
          resolveDisruption(dis);
          return false;
        }
        return true;
      });
    }

    /* throughput calculation */
    const tp = calcThroughput();
    G.throughputAccum += tp * dt;
    if (G.throughputAccum >= 1) {
      const earned = Math.floor(G.throughputAccum);
      G.score += earned;
      G.throughputAccum -= earned;
    }

    /* global company progress */
    G.globalPct = Math.min(100, (G.score / G.globalTarget) * 100);

    /* check win */
    if (G.globalPct >= 100 && !G.won) {
      G.won = true;
      finishLevel(true);
      return;
    }

    /* particles */
    tickParticles(dt);

    /* node pulse */
    G.nodes.forEach(nd => {
      nd.pulse = (nd.pulse + dt * 2) % (Math.PI * 2);
    });

    /* resource packets along routes */
    G.routes.forEach(rt => {
      rt.packetT = ((rt.packetT || 0) + dt * 0.8) % 1;
    });

    updateHUD();
    draw();
    _raf = requestAnimationFrame(gameLoop);
  }

  /* ── throughput calculation ──────────────────────────────────── */
  function calcThroughput () {
    if (!G.routes.length) return 0;

    // Build adjacency for each resource chain
    let totalFlow = 0;
    RESOURCES.forEach(res => {
      const chain = findChain(res.from, res.to);
      if (chain) {
        // flow = min throughput along chain * budget factor
        const minTP = chain.reduce((m, rt) => {
          const nd = getNode(rt.fromId);
          const ndTo = getNode(rt.toId);
          const ndTP = nd ? nd.throughput : 0;
          const ndToTP = ndTo ? ndTo.throughput : 0;
          const rtTP  = rt.broken ? 0 : Math.min(ndTP, ndToTP);
          return Math.min(m, rtTP);
        }, 100);
        // throughput points per second per chain
        totalFlow += (minTP / 100) * 4;
      }
    });

    // Bottleneck penalty
    G.routes.forEach(rt => {
      const nd = getNode(rt.fromId);
      const ndTo = getNode(rt.toId);
      const tp = nd && ndTo ? Math.min(nd.throughput, ndTo.throughput) : 0;
      rt.bottleneck = tp < 50;
    });

    return totalFlow;
  }

  /* find a connected chain of routes from type A to type B */
  function findChain (fromType, toType) {
    // BFS through routes
    const fromNodes = G.nodes.filter(n => n.type === fromType).map(n => n.id);
    const toNodes   = new Set(G.nodes.filter(n => n.type === toType).map(n => n.id));

    for (const startId of fromNodes) {
      const visited = new Set();
      const queue = [[startId, []]];
      while (queue.length) {
        const [cur, path] = queue.shift();
        if (toNodes.has(cur)) return path;
        if (visited.has(cur)) continue;
        visited.add(cur);
        G.routes.filter(r => r.fromId === cur && !r.broken).forEach(rt => {
          queue.push([rt.toId, [...path, rt]]);
        });
      }
    }
    return null;
  }

  /* ══════════════════════════════════════════════════════════════
     DISRUPTIONS
  ══════════════════════════════════════════════════════════════ */
  /* roll a seconds-until-next-disruption value from a level's
     disruptInterval:[min, max] tuple; falls back to the old hardcoded
     8-18s window if a level config is somehow missing the field. */
  function rollDisruptInterval (cfg) {
    const iv = cfg && cfg.disruptInterval;
    if (!iv) return 8 + Math.random() * 10;
    const [min, max] = iv;
    return min + Math.random() * (max - min);
  }

  function fireDisruption () {
    /* Level 3 draws from the full pool (incl. severe types); earlier levels
       stay on the original 4 so their balance is unchanged. */
    const pool = CFG[G.level].severeDisruptions
      ? DISRUPTIONS
      : DISRUPTIONS.filter(d => !d.severe);
    const def = pool[Math.floor(Math.random() * pool.length)];
    const affected = G.nodes.filter(n => n.type === def.node);
    if (!affected.length) return;
    const nd = affected[Math.floor(Math.random() * affected.length)];

    const dis = {
      ...def,
      nodeId:    nd.id,
      remaining: def.duration,
    };
    G.disruptions.push(dis);

    nd.disrupted = true;
    if (def.penaltyThroughput > 0) nd.throughput = Math.max(10, nd.throughput - def.penaltyThroughput);
    if (def.penaltyBudget > 0) G.budget = Math.max(0, G.budget - def.penaltyBudget);

    /* break routes connected to disrupted node for outages */
    if (def.id === 'outage') {
      G.routes.filter(r => r.fromId === nd.id || r.toId === nd.id).forEach(r => r.broken = true);
    }

    const disEl = document.getElementById('sc_disruption');
    const disTx = document.getElementById('sc_dis_text');
    disEl.style.display = 'block';
    disTx.textContent = `${def.emoji} ${def.label} at ${nd.city || nd.id}`;
    clearTimeout(_disruptTimer);
    _disruptTimer = setTimeout(() => { if (disEl) disEl.style.display = 'none'; }, 4000);

    spawnParticles(nd.x, nd.y, DANGER, 12);
  }

  function resolveDisruption (dis) {
    const nd = getNode(dis.nodeId);
    if (!nd) return;
    nd.disrupted = false;
    nd.throughput = Math.min(100, nd.throughput + dis.penaltyThroughput);
    /* re-enable broken routes */
    if (dis.id === 'outage') {
      G.routes.filter(r => r.fromId === nd.id || r.toId === nd.id).forEach(r => r.broken = false);
    }
    spawnParticles(nd.x, nd.y, GOOD, 8);
  }

  /* ══════════════════════════════════════════════════════════════
     ROUTING INTERACTION
  ══════════════════════════════════════════════════════════════ */
  function onMouseDown (e) {
    if (!G || G.phase !== 'play') return;
    const pos = canvasPos(e);
    const nd = hitNode(pos.x, pos.y);
    if (nd) {
      G.dragging = { fromNode: nd };
      G.selectedNode = nd;
      document.getElementById('sc_upgrade_btn').style.display = 'block';
    } else {
      G.selectedNode = null;
      document.getElementById('sc_upgrade_btn').style.display = 'none';
    }
    G.mouseX = pos.x;
    G.mouseY = pos.y;
  }

  function onMouseUp (e) {
    if (!G || G.phase !== 'play') return;
    const pos = canvasPos(e);
    if (G.dragging) {
      const toNode = hitNode(pos.x, pos.y);
      if (toNode && toNode.id !== G.dragging.fromNode.id) {
        tryConnect(G.dragging.fromNode, toNode);
      }
      G.dragging = null;
    }
  }

  function onMouseMove (e) {
    if (!G) return;
    const pos = canvasPos(e);
    G.mouseX = pos.x;
    G.mouseY = pos.y;
  }

  function onRightClick (e) {
    e.preventDefault();
    if (!G || G.phase !== 'play') return;
    const pos = canvasPos(e);
    deleteRouteAt(pos.x, pos.y);
  }

  function onTouchStart (e) {
    e.preventDefault();
    if (!G || G.phase !== 'play') return;
    const t = e.touches[0];
    const pos = canvasPos(t);
    const nd = hitNode(pos.x, pos.y);
    if (nd) {
      G.dragging = { fromNode: nd };
      G.selectedNode = nd;
      document.getElementById('sc_upgrade_btn').style.display = 'block';
    }
    G.mouseX = pos.x;
    G.mouseY = pos.y;
  }

  function onTouchEnd (e) {
    e.preventDefault();
    if (!G || G.phase !== 'play') return;
    if (G.dragging && e.changedTouches.length) {
      const t = e.changedTouches[0];
      const pos = canvasPos(t);
      const toNode = hitNode(pos.x, pos.y);
      if (toNode && toNode.id !== G.dragging.fromNode.id) {
        tryConnect(G.dragging.fromNode, toNode);
      }
      G.dragging = null;
    }
  }

  function onTouchMove (e) {
    e.preventDefault();
    if (!G) return;
    if (e.touches.length) {
      const t = e.touches[0];
      const pos = canvasPos(t);
      G.mouseX = pos.x;
      G.mouseY = pos.y;
    }
  }

  function onUpgradeClick () {
    if (!G || !G.selectedNode) return;
    const nd = G.selectedNode;
    const cost = 150;
    if (G.budget < cost) { flashMsg('Not enough budget!', DANGER, nd.x, nd.y); return; }
    if (nd.level >= 3) { flashMsg('Already max level!', WARN, nd.x, nd.y); return; }
    G.budget -= cost;
    nd.level++;
    nd.throughput = Math.min(100, nd.throughput + 20);
    spawnParticles(nd.x, nd.y, GOLD, 16);
    flashMsg(`${NODE_TYPES[nd.type].label} upgraded to L${nd.level}!`, GOOD, nd.x, nd.y);
  }

  /* ── try to add a route between two nodes ────────────────────── */
  function tryConnect (from, to) {
    /* midpoint used to anchor all flashMsg calls below at the route the
       player is actually drawing, instead of a fixed top-center spot */
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    /* check not duplicate */
    const exists = G.routes.find(r =>
      (r.fromId === from.id && r.toId === to.id) ||
      (r.fromId === to.id   && r.toId === from.id)
    );
    if (exists) { flashMsg('Route already exists', WARN, midX, midY); return; }

    /* cost = pixel distance * 0.2 */
    const dist = Math.hypot(from.x - to.x, from.y - to.y);
    const cost = Math.round(dist * 0.25);

    if (G.budget < cost) { flashMsg(`Need $${cost} — not enough budget!`, DANGER, midX, midY); return; }

    G.budget -= cost;
    G.routes.push({
      fromId:    from.id,
      toId:      to.id,
      cost,
      broken:    false,
      bottleneck:false,
      packetT:   Math.random(),
    });

    /* check if valid resource connection for hint */
    const validLink = RESOURCES.find(res =>
      (from.type === res.from && to.type === res.to) ||
      (to.type === res.from && from.type === res.to)
    );
    if (validLink) {
      spawnParticles(midX, midY, ACC2, 10);
      flashMsg(`${validLink.emoji} ${validLink.label} route active! -$${cost}`, GOOD, midX, midY);
    } else {
      flashMsg(`Route connected -$${cost}`, ACC2, midX, midY);
    }

    /* update hint */
    if (CFG[G.level].hints) updateHint();
  }

  /* ── delete a route near click position ─────────────────────── */
  function deleteRouteAt (x, y) {
    let best = null, bestD = 18;
    G.routes.forEach(rt => {
      const from = getNode(rt.fromId);
      const to   = getNode(rt.toId);
      if (!from || !to) return;
      const d = distToSegment(x, y, from.x, from.y, to.x, to.y);
      if (d < bestD) { bestD = d; best = rt; }
    });
    if (best) {
      G.routes = G.routes.filter(r => r !== best);
      /* partial refund */
      const refund = Math.floor(best.cost * 0.4);
      G.budget += refund;
      flashMsg(`Route removed. Refunded $${refund}`, WARN, x, y);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     DRAW
  ══════════════════════════════════════════════════════════════ */
  function draw () {
    if (!_canvas || !_ctx || !G) return;
    const ctx = _ctx;
    const W = _canvas.width;
    const H = _canvas.height;

    /* background */
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    /* grid */
    drawGrid(ctx, W, H);

    /* city zones — only meaningful once nodes span more than one city,
       works for any level's actual layout instead of a hardcoded one */
    if (cityCount(G.nodes) > 1) drawCityZones(ctx, W, H);

    /* routes */
    G.routes.forEach(rt => drawRoute(ctx, rt));

    /* dragging line */
    if (G.dragging) {
      const fn = G.dragging.fromNode;
      ctx.save();
      ctx.strokeStyle = ACC2;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(fn.x, fn.y);
      ctx.lineTo(G.mouseX, G.mouseY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      /* cost preview */
      const dist = Math.hypot(fn.x - G.mouseX, fn.y - G.mouseY);
      const cost = Math.round(dist * 0.25);
      ctx.fillStyle = ACC2;
      ctx.font = '11px Inter,sans-serif';
      ctx.fillText(`-$${cost}`, (fn.x + G.mouseX) / 2 + 8, (fn.y + G.mouseY) / 2 - 8);
    }

    /* nodes */
    G.nodes.forEach(nd => drawNode(ctx, nd));

    /* particles */
    drawParticles(ctx);

    /* resource type legend bottom right */
    drawLegend(ctx, W, H);
  }

  function drawGrid (ctx, W, H) {
    ctx.save();
    ctx.strokeStyle = `${ACC}12`;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 24; i++) {
      const x = (i / 24) * W;
      const y = (i / 24) * H;
      ctx.beginPath(); ctx.moveTo(x, 0);  ctx.lineTo(x, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y);  ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  /* count of distinct city names among a node list (city undefined counts
     as a single implicit group so old/edge-case configs stay safe) */
  function cityCount (nodes) {
    if (!nodes || !nodes.length) return 0;
    return new Set(nodes.map(n => n.city || '__none__')).size;
  }

  const ZONE_PALETTE = [ACC, CYAN, ACC2, GOLD, WARN, GOOD, DANGER, '#60A5FA', '#F472B6', '#34D399'];

  /* derive city zones straight from whatever nodes the active level laid
     out — works for L1's single city, L2's 6, L3's 8, or any future
     relayout, instead of a name/position list hardcoded to one level. */
  function drawCityZones (ctx, W, H) {
    if (!G || !G.nodes || !G.nodes.length) return;
    const groups = new Map();
    G.nodes.forEach(nd => {
      const key = nd.city || '__none__';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(nd);
    });

    const minSpan = Math.min(W, H);
    let colorIdx = 0;
    groups.forEach((members, name) => {
      const cx = members.reduce((s, n) => s + n.x, 0) / members.length;
      const cy = members.reduce((s, n) => s + n.y, 0) / members.length;
      const spread = members.reduce((m, n) => Math.max(m, Math.hypot(n.x - cx, n.y - cy)), 0);
      const r = Math.max(spread + 46, minSpan * 0.11);
      const color = ZONE_PALETTE[colorIdx % ZONE_PALETTE.length];
      colorIdx++;

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color + '18');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '9px Inter,sans-serif';
      ctx.fillStyle = color + '80';
      ctx.textAlign = 'center';
      ctx.fillText(name.toUpperCase(), cx, cy + r - 6);
    });
    ctx.textAlign = 'left';
  }

  function drawRoute (ctx, rt) {
    const from = getNode(rt.fromId);
    const to   = getNode(rt.toId);
    if (!from || !to) return;

    ctx.save();

    /* find resource type for this connection */
    const res = RESOURCES.find(r =>
      (from.type === r.from && to.type === r.to) ||
      (to.type === r.from && from.type === r.to)
    );
    const col = rt.broken ? DANGER : rt.bottleneck ? WARN : (res ? res.color : '#ffffff40');

    /* glow */
    if (!rt.broken) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = col;
    }

    ctx.strokeStyle = rt.broken ? DANGER + '80' : col + 'cc';
    ctx.lineWidth = rt.broken ? 1.5 : rt.bottleneck ? 2 : 2.5;
    if (rt.broken) ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x,   to.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    /* animated packet along the route */
    if (!rt.broken) {
      const t = rt.packetT;
      const px = from.x + (to.x - from.x) * t;
      const py = from.y + (to.y - from.y) * t;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 10;
      ctx.shadowColor = col;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    /* cost label */
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    ctx.fillStyle = '#ffffff40';
    ctx.font = '9px Inter,sans-serif';
    ctx.fillText(`$${rt.cost}`, mx + 6, my - 4);

    ctx.restore();
  }

  function drawNode (ctx, nd) {
    const def = NODE_TYPES[nd.type];
    const r   = nd.r + nd.level * 3;
    const sel = G.selectedNode && G.selectedNode.id === nd.id;

    ctx.save();

    /* glow ring */
    const glowR = r + 8 + Math.sin(nd.pulse) * 4;
    const g = ctx.createRadialGradient(nd.x, nd.y, r - 4, nd.x, nd.y, glowR + 6);
    const glowCol = nd.disrupted ? DANGER : def.color;
    g.addColorStop(0, glowCol + '60');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(nd.x, nd.y, glowR + 6, 0, Math.PI * 2);
    ctx.fill();

    /* hexagon body */
    ctx.shadowBlur = sel ? 20 : 12;
    ctx.shadowColor = nd.disrupted ? DANGER : def.color;
    drawHex(ctx, nd.x, nd.y, r);
    const bg = ctx.createRadialGradient(nd.x, nd.y - r * 0.3, 2, nd.x, nd.y, r);
    bg.addColorStop(0, BG3);
    bg.addColorStop(1, BG2);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = nd.disrupted ? DANGER : sel ? '#fff' : def.color;
    ctx.lineWidth = sel ? 2.5 : 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* emoji */
    ctx.font = `${r * 0.7}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.emoji, nd.x, nd.y - 4);

    /* label */
    ctx.font = `bold 9px Inter,sans-serif`;
    ctx.fillStyle = nd.disrupted ? DANGER : def.color;
    ctx.fillText(def.label.toUpperCase(), nd.x, nd.y + r + 10);

    /* throughput bar */
    const bw = r * 2;
    const bh = 4;
    const bx = nd.x - r;
    const by = nd.y + r + 16;
    ctx.fillStyle = '#ffffff15';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 2);
    ctx.fill();
    const tpCol = nd.throughput > 70 ? GOOD : nd.throughput > 40 ? WARN : DANGER;
    ctx.fillStyle = tpCol;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw * nd.throughput / 100, bh, 2);
    ctx.fill();

    /* level badge */
    if (nd.level > 1) {
      ctx.fillStyle = GOLD;
      ctx.font = `bold 9px Orbitron,monospace`;
      ctx.fillText(`L${nd.level}`, nd.x + r - 6, nd.y - r + 8);
    }

    /* disruption indicator */
    if (nd.disrupted) {
      ctx.font = '14px serif';
      ctx.fillText('⚡', nd.x + r * 0.5, nd.y - r * 0.5);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  function drawHex (ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawLegend (ctx, W, H) {
    const lx = W - 160;
    const ly = H - 90;
    ctx.fillStyle = BG2 + 'cc';
    ctx.strokeStyle = ACC + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(lx - 8, ly - 8, 160, 90, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = '8px Orbitron,monospace';
    ctx.fillStyle = ACC2;
    ctx.fillText('RESOURCE FLOW', lx, ly + 2);

    RESOURCES.forEach((res, i) => {
      const ry = ly + 14 + i * 16;
      ctx.fillStyle = res.color;
      ctx.beginPath();
      ctx.arc(lx + 4, ry + 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cccccc';
      ctx.font = '9px Inter,sans-serif';
      ctx.fillText(`${res.emoji} ${NODE_TYPES[res.from].label} → ${NODE_TYPES[res.to].label}`, lx + 12, ry + 8);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     PARTICLES
  ══════════════════════════════════════════════════════════════ */
  function spawnParticles (x, y, color, count) {
    if (!G) return;
    for (let i = 0; i < count; i++) {
      const a  = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 80;
      G.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        color,
        r: 2 + Math.random() * 3,
      });
    }
  }

  function tickParticles (dt) {
    G.particles = G.particles.filter(p => {
      p.x   += p.vx * dt;
      p.y   += p.vy * dt;
      p.vy  += 60 * dt;
      p.life -= dt * 1.5;
      return p.life > 0;
    });
  }

  function drawParticles (ctx) {
    G.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle   = p.color;
      ctx.shadowBlur  = 6;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     HUD UPDATE
  ══════════════════════════════════════════════════════════════ */
  function updateHUD () {
    if (!G) return;
    const scoreEl  = document.getElementById('sc_score');
    const budgetEl = document.getElementById('sc_budget');
    const timerEl  = document.getElementById('sc_timer');
    const fillEl   = document.getElementById('sc_progress_fill');
    const pctEl    = document.getElementById('sc_progress_pct');
    if (!scoreEl) return;

    scoreEl.textContent  = G.score;
    budgetEl.textContent = `$${G.budget}`;
    budgetEl.style.color = G.budget < 100 ? DANGER : G.budget < 300 ? WARN : GOOD;

    const m = Math.floor(G.timeLeft / 60);
    const s = Math.floor(G.timeLeft % 60);
    timerEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    timerEl.style.color = G.timeLeft < 20 ? DANGER : G.timeLeft < 45 ? WARN : '#fff';

    const pct = Math.min(100, Math.round(G.globalPct));
    if (fillEl) fillEl.style.width = pct + '%';
    if (pctEl)  pctEl.textContent  = pct + '%';
  }

  /* ══════════════════════════════════════════════════════════════
     HINTS
  ══════════════════════════════════════════════════════════════ */
  function setHint (msg) {
    const el = document.getElementById('sc_hint');
    if (!el) return;
    el.style.display = msg ? 'block' : 'none';
    el.textContent   = msg || '';
  }

  function updateHint () {
    if (!G || G.level !== 1) return;
    // check which connections are made
    const hasF_W  = G.routes.some(r => connType(r, 'FACTORY', 'WAREHOUSE'));
    const hasW_A  = G.routes.some(r => connType(r, 'WAREHOUSE', 'AI_HUB'));
    const hasA_S  = G.routes.some(r => connType(r, 'AI_HUB', 'SHIPPING'));
    const hasS_HQ = G.routes.some(r => connType(r, 'SHIPPING', 'HQ'));
    if (!hasF_W)  setHint('💡 Connect Factory → Warehouse to start');
    else if (!hasW_A)  setHint('✅ Good! Now connect Warehouse → AI Hub');
    else if (!hasA_S)  setHint('✅ Great! Now connect AI Hub → Shipping');
    else if (!hasS_HQ) setHint('✅ Almost! Connect Shipping → Global HQ');
    else setHint('🚀 Full pipeline active! Throughput rising!');
  }

  function connType (rt, typeA, typeB) {
    const from = getNode(rt.fromId);
    const to   = getNode(rt.toId);
    if (!from || !to) return false;
    return (from.type === typeA && to.type === typeB) ||
           (from.type === typeB && to.type === typeA);
  }

  /* ══════════════════════════════════════════════════════════════
     FLASH MESSAGE
  ══════════════════════════════════════════════════════════════ */
  let _flashTimer = null;
  let _disruptTimer = null;

  /* convert canvas-internal coordinates (as used by G.nodes[].x/y and route
     midpoints) to viewport/client coordinates, for positioning an
     absolutely-positioned HTML element over the canvas. Inverse of
     canvasPos() above. */
  function canvasToClient (cx, cy) {
    if (!_canvas) return null;
    const rect = _canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: rect.left + cx * (rect.width  / _canvas.width),
      y: rect.top  + cy * (rect.height / _canvas.height),
    };
  }

  /* anchorCX/anchorCY (optional, canvas-space): with up to 13 nodes active
     in Level 3, anchoring the message at the node/route that triggered it
     (instead of a fixed top-center position) lets the player tell which
     specific action just happened. Falls back to the original fixed
     top-center spot when no coordinates are given or conversion fails
     (e.g. canvas not yet laid out). */
  function flashMsg (msg, color, anchorCX, anchorCY) {
    let el = document.getElementById('sc_flash');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sc_flash';
      /* max-width + normal wrap (not nowrap) so a longer message can't
         bleed past the viewport edge on narrow screens once it's anchored
         near a node close to the left/right edge instead of always
         center-screen */
      el.style.cssText = `position:absolute;top:90px;left:50%;transform:translateX(-50%);
        background:${BG2}ee;border:1px solid ${ACC}40;border-radius:8px;
        padding:8px 18px;font-size:13px;z-index:40;pointer-events:none;
        transition:opacity 0.3s;white-space:normal;max-width:min(280px,86vw);text-align:center;`;
      document.getElementById('sc_root').appendChild(el);
    }

    let pos = null;
    if (anchorCX !== undefined && anchorCY !== undefined) {
      pos = canvasToClient(anchorCX, anchorCY);
    }
    if (pos) {
      const clampedX = Math.max(80, Math.min(window.innerWidth  - 80, pos.x));
      const clampedY = Math.max(70, Math.min(window.innerHeight - 40, pos.y - 34)); // float just above the node
      el.style.top       = clampedY + 'px';
      el.style.left      = clampedX + 'px';
      el.style.transform = 'translate(-50%,-100%)';
    } else {
      el.style.top       = '90px';
      el.style.left      = '50%';
      el.style.transform = 'translateX(-50%)';
    }

    el.textContent  = msg;
    el.style.color  = color || '#fff';
    el.style.borderColor = (color || ACC) + '80';
    el.style.opacity = '1';
    clearTimeout(_flashTimer);
    _flashTimer = setTimeout(() => { el.style.opacity = '0'; }, 2200);
  }

  /* ══════════════════════════════════════════════════════════════
     FINISH / END GAME
  ══════════════════════════════════════════════════════════════ */
  function finishLevel (won) {
    cancelAnimationFrame(_raf);
    if (!G) return;
    G.phase = 'end';

    /* calculate stars */
    const spendRatio = 1 - (G.budget / G.budgetStart);
    let stars;
    if (!won) {
      stars = G.score > G.globalTarget * 0.5 ? 1 : 0;
    } else {
      if (spendRatio <= STAR3_SPEND) stars = 3;
      else if (spendRatio <= STAR2_SPEND) stars = 2;
      else stars = 1;
    }

    /* advance to the next level on a win, unless we just won the final level */
    if (won && G.level === 1) {
      showLevelComplete(stars, 1, 2, () => startLevel(2));
      return;
    }
    if (won && G.level === 2) {
      showLevelComplete(stars, 2, 3, () => startLevel(3));
      return;
    }

    /* final game over or win (level 3 win, or a loss at any level) */
    endGame(stars, won);
  }

  function showLevelComplete (stars, completedLvl, nextLvl, onContinue) {
    const ov = document.getElementById('sc_overlay');
    ov.style.display = 'flex';
    ov.style.flexDirection = 'column';
    ov.style.alignItems = 'center';
    ov.style.justifyContent = 'center';
    const starStr = ['', '⭐', '⭐⭐', '⭐⭐⭐'][stars] || '';
    const flavor = completedLvl === 1
      ? 'City scaled. Time to go multi-city!'
      : 'Multi-city network mastered. One challenge remains — go legendary!';
    /* this screen only ever shows on a level win (see finishLevel), so it
       always gets the bouncy win-pop entrance, never the plain loss fade */
    ov.innerHTML = `
      <div style="animation:sc_win_pop .5s cubic-bezier(.2,1.4,.4,1) both;text-align:center">
        <div style="font-size:36px;margin-bottom:8px;">${starStr}</div>
        <div style="font-family:'Orbitron',monospace;font-size:20px;color:${GOOD};margin-bottom:6px;">CITY SCALED!</div>
        <div style="font-size:13px;color:#888;margin-bottom:24px;">Level ${completedLvl} complete. ${flavor}</div>
        <button onclick="this.closest('#sc_overlay').style.display='none';window._scContinue()" style="background:${ACC};border:none;color:#fff;padding:12px 32px;border-radius:8px;cursor:pointer;font-size:15px;font-family:Orbitron,monospace;letter-spacing:1px;">CONTINUE → LEVEL ${nextLvl}</button>
      </div>`;
    window._scContinue = onContinue;
  }

  function endGame (stars, won) {
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ll_scaling_center', { stars, level: G ? G.level : 1, badge: 'Scaling Legend Badge', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();
    if (window.StartupRewardsService) StartupRewardsService.submit({ pillar: 'scale', successDelta: stars === 3 ? 15 : stars === 2 ? 8 : 3 });

    const ov = document.getElementById('sc_overlay');
    ov.style.display = 'flex';
    ov.style.flexDirection = 'column';
    ov.style.alignItems = 'center';
    ov.style.justifyContent = 'center';
    ov.style.gap = '0';

    const starStr = stars >= 3 ? '⭐⭐⭐' : stars === 2 ? '⭐⭐' : stars === 1 ? '⭐' : '💀';
    const titleMsg = won
      ? (stars === 3 ? '🌐 GLOBAL EMPIRE!' : stars === 2 ? '🚀 GLOBAL COMPANY!' : '✅ SCALED!')
      : '📉 OPERATION FAILED';
    const titleCol = won ? GOOD : DANGER;
    const badges = won ? (stars >= 3
      ? `<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:12px;">
           <span style="background:${ACC}30;border:1px solid ${ACC};border-radius:20px;padding:4px 12px;font-size:11px;color:${ACC2};">🏅 Scaling Legend Badge</span>
           <span style="background:${GOLD}20;border:1px solid ${GOLD}80;border-radius:20px;padding:4px 12px;font-size:11px;color:${GOLD};">⚙️ Automation Master Badge</span>
         </div>` : '') : '';

    const lesson = `<div style="background:${ACC}15;border:1px solid ${ACC}30;border-radius:8px;padding:14px 20px;margin:16px 0;max-width:400px;text-align:center;">
      <div style="font-size:10px;color:${ACC2};letter-spacing:2px;margin-bottom:6px;">THE LESSON</div>
      <div style="font-size:13px;color:#ccc;line-height:1.6;">The best businesses do not just grow — they <span style="color:${ACC2};font-weight:600;">scale</span>. Scaling means using systems, automation and smart routing so that doing more does not always cost more. That is how a startup becomes a global company.</div>
    </div>`;

    /* win gets the bouncy pop (sc_win_pop); loss gets a plain fade
       (sc_loss_fade) — so reaching Global Company status feels more
       celebratory than an operation failure, instead of identical statics */
    const endAnim = won ? 'sc_win_pop .5s cubic-bezier(.2,1.4,.4,1) both' : 'sc_loss_fade .35s ease both';

    ov.innerHTML = `
      <div style="text-align:center;padding:20px;animation:${endAnim};">
        <div style="font-size:40px;margin-bottom:6px;">${starStr}</div>
        <div style="font-family:'Orbitron',monospace;font-size:22px;color:${titleCol};margin-bottom:4px;letter-spacing:2px;">${titleMsg}</div>
        <div style="font-size:13px;color:#888;margin-bottom:16px;">Throughput: ${G ? G.score : 0} · Budget remaining: $${G ? G.budget : 0}</div>
        ${badges}
        <div style="display:flex;gap:10px;justify-content:center;margin-bottom:8px;">
          <div style="background:${GOLD}20;border:1px solid ${GOLD}60;border-radius:8px;padding:10px 18px;text-align:center;">
            <div style="font-size:10px;color:#888;letter-spacing:1px;">COINS EARNED</div>
            <div style="font-family:'Orbitron',monospace;font-size:22px;color:${GOLD};">+${coins}</div>
          </div>
          <div style="background:${ACC}20;border:1px solid ${ACC}60;border-radius:8px;padding:10px 18px;text-align:center;">
            <div style="font-size:10px;color:#888;letter-spacing:1px;">STARS</div>
            <div style="font-family:'Orbitron',monospace;font-size:22px;color:${ACC2};">${stars}/3</div>
          </div>
        </div>
        ${lesson}
        <div style="display:flex;gap:12px;justify-content:center;margin-top:8px;">
          <button onclick="window._scShowLvlSel()" style="background:${ACC}30;border:1px solid ${ACC};color:${ACC2};padding:11px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-family:Orbitron,monospace;letter-spacing:1px;">▶ PLAY AGAIN</button>
          <button onclick="window.ll_scaling_centerExit()" style="background:${BG2};border:1px solid #444;color:#aaa;padding:11px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-family:Inter,sans-serif;">← HUB</button>
        </div>
      </div>`;

    window._scShowLvlSel = showLevelSelect;
  }

  /* ══════════════════════════════════════════════════════════════
     EXIT
  ══════════════════════════════════════════════════════════════ */
  window.ll_scaling_centerExit = function () {
    cancelAnimationFrame(_raf);
    clearTimeout(_flashTimer);
    clearTimeout(_disruptTimer);
    window.removeEventListener('resize', resizeCanvas);
    G = null;
    if (window.state) state.viewingWorld = 'risktaker';
    if (window.goTo) goTo('hub');
  };

  /* ══════════════════════════════════════════════════════════════
     DEBUG HOOKS (console-drivable, no waiting on real timers)
  ══════════════════════════════════════════════════════════════ */
  window._scDbg = () => G ? {
    level:        G.level,
    phase:        G.phase,
    score:        G.score,
    budget:       G.budget,
    globalPct:    G.globalPct,
    globalTarget: G.globalTarget,
    nodeCount:    G.nodes ? G.nodes.length : 0,
    cityCount:    G.nodes ? cityCount(G.nodes) : 0,
    routeCount:   G.routes ? G.routes.length : 0,
    timeLeft:     G.timeLeft,
  } : null;

  /* Sets score to the win threshold so the very next gameLoop tick takes
     the real win branch (globalPct >= 100 -> finishLevel(true)) — this
     exercises the actual L1->L2->L3 chain instead of bypassing it. */
  window._scForceWin = () => {
    if (!G) return 'no game';
    G.score = G.globalTarget;
    return `score set to globalTarget (${G.globalTarget}) on level ${G.level} — next tick triggers the real win path`;
  };

  /* ══════════════════════════════════════════════════════════════
     UTILITIES
  ══════════════════════════════════════════════════════════════ */
  function getNode (id) {
    return G ? G.nodes.find(n => n.id === id) : null;
  }

  function hitNode (x, y) {
    if (!G) return null;
    return G.nodes.find(nd => Math.hypot(nd.x - x, nd.y - y) <= nd.r + nd.level * 3 + 6) || null;
  }

  function canvasPos (e) {
    const rect = _canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (_canvas.width  / rect.width),
      y: (e.clientY - rect.top)  * (_canvas.height / rect.height),
    };
  }

  function distToSegment (px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }

})();
