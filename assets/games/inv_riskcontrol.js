/* ════════════════════════════════════════════════════════════════
   RISK CONTROL CENTER — Defensive Investing Mini-Game
   Investopia Hub · Coinaverse v25
   Shield & Balance mechanic · 3 levels · Radar threat system
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── accent / palette ──────────────────────────────────────── */
  const AC   = '#00C853'; // Investopia green
  const DANGER = '#FF3D3D';
  const WARN   = '#FFB300';
  const GOLD   = '#FFD700';
  const BG     = '#03040c';

  /* ── threat catalogue ──────────────────────────────────────── */
  const THREATS = [
    { id:'correction',   label:'Market Correction',     icon:'📉', color:WARN,   damage:12, bestAction:'shield',    tip:'Deploy Shield absorbs general market corrections.' },
    { id:'crash',        label:'Market Crash',          icon:'💥', color:DANGER, damage:25, bestAction:'shield',    tip:'Deploy Shield protects your core portfolio.' },
    { id:'inflation',    label:'Inflation Spike',       icon:'🔥', color:DANGER, damage:18, bestAction:'cash',      tip:'Raise Cash buffers against inflation erosion.' },
    { id:'recession',    label:'Recession Warning',     icon:'🌀', color:DANGER, damage:22, bestAction:'diversify', tip:'Diversify spreads risk across uncorrelated assets.' },
    { id:'geo',          label:'Geopolitical Crisis',   icon:'⚡', color:WARN,   damage:15, bestAction:'cut',       tip:'Cut Exposure reduces sector-specific risk.' },
    { id:'sector',       label:'Sector Collapse',       icon:'🏚', color:DANGER, damage:20, bestAction:'cut',       tip:'Cut Exposure in that sector before losses spread.' },
    { id:'liquidity',    label:'Liquidity Crunch',      icon:'💧', color:WARN,   damage:14, bestAction:'cash',      tip:'Raise Cash ensures you can meet obligations.' },
    { id:'volatility',   label:'Volatility Surge',      icon:'〰', color:WARN,   damage:10, bestAction:'diversify', tip:'Diversify smooths out volatility across positions.' },
  ];

  /* ── actions ───────────────────────────────────────────────── */
  const ACTIONS = [
    { id:'shield',    label:'Deploy Shield',   icon:'🛡', color:AC,      desc:'General protection against market drops' },
    { id:'cash',      label:'Raise Cash',      icon:'💵', color:'#69F0AE',desc:'Liquidity buffer against inflation/crunch' },
    { id:'diversify', label:'Diversify',       icon:'🌐', color:'#40C4FF',desc:'Spread exposure across uncorrelated assets' },
    { id:'cut',       label:'Cut Exposure',    icon:'✂️', color:WARN,    desc:'Reduce risk in a specific sector' },
  ];

  /* ── level configs ─────────────────────────────────────────── */
  const LEVEL_CFG = [
    {
      level: 1, title: 'LEARN', subtitle: 'Simple Corrections',
      threatCount: 6, simultaneousMax: 1,
      intervalMs: 5000, responseWindow: 6000,
      threatPool: ['correction','inflation','geo','volatility','liquidity','correction'],
      growthPerDefend: 3, growthPerBestAction: 5,
    },
    {
      level: 2, title: 'MASTER', subtitle: 'Crisis Storm',
      threatCount: 9, simultaneousMax: 3,
      intervalMs: 3200, responseWindow: 4500,
      threatPool: ['crash','recession','inflation','geo','sector','crash','liquidity','recession','crash'],
      growthPerDefend: 2, growthPerBestAction: 4,
    },
    {
      level: 3, title: 'PRO', subtitle: 'Black Swan Event',
      threatCount: 12, simultaneousMax: 4,
      intervalMs: 2200, responseWindow: 3200,
      threatPool: ['crash','sector','recession','crash','geo','sector','inflation','crash','recession','liquidity','sector','crash'],
      growthPerDefend: 1, growthPerBestAction: 3,
    },
  ];

  /* ── module state ──────────────────────────────────────────── */
  let G = null;

  /* ══════════════════════════════════════════════════════════════
     SCREEN REGISTRATION
  ══════════════════════════════════════════════════════════════ */
  window.SCREENS = window.SCREENS || {};

  window.SCREENS.game_inv_riskcontrol = function () {
    G = null;
    setTimeout(initGame, 40);
    return `
<div id="rcc-root" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none;">

  <!-- scanline overlay -->
  <canvas id="rcc-bg-canvas" style="position:absolute;inset:0;pointer-events:none;opacity:0.18;"></canvas>

  <!-- top bar -->
  <div id="rcc-topbar" style="position:absolute;top:0;left:0;right:0;height:52px;background:rgba(0,0,0,0.7);border-bottom:1px solid ${AC}22;display:flex;align-items:center;padding:0 14px;gap:14px;z-index:50;">
    <button id="rcc-back" style="background:none;border:1px solid ${AC}44;color:${AC};font-size:18px;width:36px;height:36px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">←</button>
    <div style="font-family:Orbitron,monospace;font-size:13px;font-weight:700;color:${AC};letter-spacing:1px;flex:1;">RISK CONTROL CENTER</div>
    <div style="display:flex;align-items:center;gap:18px;">
      <div style="text-align:center;">
        <div style="font-size:9px;color:#aaa;letter-spacing:1px;">PORTFOLIO</div>
        <div id="rcc-health-val" style="font-family:Orbitron,monospace;font-size:15px;color:${AC};font-weight:700;">100%</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:9px;color:#aaa;letter-spacing:1px;">GROWTH</div>
        <div id="rcc-growth-val" style="font-family:Orbitron,monospace;font-size:15px;color:${GOLD};font-weight:700;">+0%</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:9px;color:#aaa;letter-spacing:1px;">SCORE</div>
        <div id="rcc-score-val" style="font-family:Orbitron,monospace;font-size:15px;color:#fff;font-weight:700;">0</div>
      </div>
      <div id="rcc-timer-wrap" style="text-align:center;">
        <div style="font-size:9px;color:#aaa;letter-spacing:1px;">TIME</div>
        <div id="rcc-timer-val" style="font-family:Orbitron,monospace;font-size:15px;color:#fff;font-weight:700;">--</div>
      </div>
    </div>
  </div>

  <!-- health bar -->
  <div style="position:absolute;top:52px;left:0;right:0;height:4px;background:#1a1a2e;z-index:49;">
    <div id="rcc-healthbar" style="height:100%;background:linear-gradient(90deg,${DANGER},${WARN},${AC});width:100%;transition:width 0.4s;"></div>
  </div>

  <!-- level badge -->
  <div id="rcc-level-badge" style="position:absolute;top:64px;left:50%;transform:translateX(-50%);font-family:Orbitron,monospace;font-size:10px;color:${AC};letter-spacing:2px;background:${AC}18;border:1px solid ${AC}33;padding:3px 12px;border-radius:20px;z-index:48;">LEVEL 1 · LEARN</div>

  <!-- main arena -->
  <div id="rcc-arena" style="position:absolute;top:84px;left:0;right:0;bottom:180px;display:flex;align-items:center;justify-content:center;">

    <!-- radar / portfolio display -->
    <canvas id="rcc-radar" style="position:absolute;touch-action:none;"></canvas>

    <!-- threat cards container -->
    <div id="rcc-threats" style="position:absolute;inset:0;pointer-events:none;"></div>

    <!-- feedback flash -->
    <div id="rcc-feedback" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:Orbitron,monospace;font-size:22px;font-weight:900;pointer-events:none;opacity:0;text-align:center;text-shadow:0 0 20px currentColor;z-index:30;white-space:nowrap;"></div>
  </div>

  <!-- action panel -->
  <div id="rcc-actions" style="position:absolute;bottom:0;left:0;right:0;height:176px;background:rgba(0,4,20,0.95);border-top:1px solid ${AC}33;padding:14px;z-index:50;">
    <div style="display:flex;gap:10px;height:100%;">
    </div>
  </div>

  <!-- tip bar -->
  <div id="rcc-tip" style="position:absolute;bottom:176px;left:0;right:0;height:28px;background:rgba(0,200,83,0.08);border-top:1px solid ${AC}22;border-bottom:1px solid ${AC}22;display:flex;align-items:center;justify-content:center;padding:0 16px;font-size:11px;color:${AC}cc;letter-spacing:0.3px;z-index:49;"></div>

  <!-- intro overlay -->
  <div id="rcc-intro" style="position:absolute;inset:0;background:rgba(3,4,12,0.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;z-index:100;padding:24px;text-align:center;">
    <div style="font-family:Orbitron,monospace;font-size:10px;color:${AC};letter-spacing:3px;">INVESTOPIA · RISK CONTROL CENTER</div>
    <div style="font-family:Orbitron,monospace;font-size:26px;font-weight:900;color:#fff;text-shadow:0 0 30px ${AC}88;line-height:1.2;">DEFENSIVE<br>INVESTING</div>
    <div style="max-width:340px;font-size:13px;color:#ccc;line-height:1.6;">Market threats are incoming. Protect your portfolio by deploying the right defensive strategy for each threat. Keep your health above zero while growing your wealth.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:360px;width:100%;">
      ${ACTIONS.map(a => `<div style="background:${a.color}14;border:1px solid ${a.color}44;border-radius:8px;padding:10px;text-align:left;">
        <div style="font-size:18px;">${a.icon}</div>
        <div style="font-size:12px;font-weight:700;color:${a.color};margin-top:4px;">${a.label}</div>
        <div style="font-size:10px;color:#999;margin-top:2px;">${a.desc}</div>
      </div>`).join('')}
    </div>
    <button id="rcc-start-btn" style="font-family:Orbitron,monospace;font-size:13px;font-weight:700;letter-spacing:2px;background:${AC};color:#000;border:none;padding:14px 36px;border-radius:8px;cursor:pointer;margin-top:8px;">ACTIVATE DEFENSE SYSTEM</button>
  </div>

  <!-- end overlay (hidden) -->
  <div id="rcc-end" style="position:absolute;inset:0;background:rgba(3,4,12,0.97);display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:100;padding:24px;text-align:center;">
    <div id="rcc-end-title" style="font-family:Orbitron,monospace;font-size:13px;letter-spacing:3px;color:${AC};"></div>
    <div id="rcc-end-stars" style="font-size:44px;letter-spacing:8px;"></div>
    <div id="rcc-end-stats" style="display:flex;gap:24px;margin:4px 0;"></div>
    <div id="rcc-end-coins" style="font-family:Orbitron,monospace;font-size:18px;color:${GOLD};font-weight:700;"></div>
    <div id="rcc-end-lesson" style="max-width:340px;font-size:13px;color:#bbb;line-height:1.65;padding:14px;background:${AC}0e;border:1px solid ${AC}33;border-radius:10px;"></div>
    <div style="display:flex;gap:12px;margin-top:6px;">
      <button id="rcc-replay-btn" style="font-family:Orbitron,monospace;font-size:11px;font-weight:700;letter-spacing:1.5px;background:${AC};color:#000;border:none;padding:12px 28px;border-radius:7px;cursor:pointer;">PLAY AGAIN</button>
      <button id="rcc-hub-btn" style="font-family:Orbitron,monospace;font-size:11px;font-weight:700;letter-spacing:1.5px;background:none;color:${AC};border:1.5px solid ${AC};padding:12px 28px;border-radius:7px;cursor:pointer;">← HUB</button>
    </div>
  </div>

</div>`;
  };

  /* ══════════════════════════════════════════════════════════════
     EXIT
  ══════════════════════════════════════════════════════════════ */
  window.inv_riskcontrolExit = function () {
    // Cancel radar animation loop
    if (radarRaf) { cancelAnimationFrame(radarRaf); radarRaf = null; }
    // Clear all timers from active game state before nulling G
    if (G) {
      if (G.spawnTimer) clearTimeout(G.spawnTimer);
      if (G.checkTimer) clearInterval(G.checkTimer);
      if (G.activeThreats) {
        G.activeThreats.forEach(t => { if (t.expireTimer) clearTimeout(t.expireTimer); });
      }
    }
    G = null;
    // Remove keydown listener
    document.removeEventListener('keydown', onKey);
    if (window.state) state.viewingWorld = 'investor';
    goTo('hub');
  };

  /* ══════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════ */
  function initGame() {
    const root = document.getElementById('rcc-root');
    if (!root) return;

    // Build action buttons
    buildActionPanel();

    // Background canvas (grid lines)
    setupBgCanvas();

    // Radar canvas
    setupRadar();

    // Button bindings
    const backBtn = document.getElementById('rcc-back');
    if (backBtn) backBtn.addEventListener('click', window.inv_riskcontrolExit);

    const startBtn = document.getElementById('rcc-start-btn');
    if (startBtn) startBtn.addEventListener('click', startLevel1);

    const replayBtn = document.getElementById('rcc-replay-btn');
    if (replayBtn) replayBtn.addEventListener('click', () => { hideEnd(); startLevel1(); });

    const hubBtn = document.getElementById('rcc-hub-btn');
    if (hubBtn) hubBtn.addEventListener('click', window.inv_riskcontrolExit);

    // Keyboard support
    document.addEventListener('keydown', onKey);

    // Init G state placeholder (not started yet)
    G = { started: false };

    // DEBUG HOOK — G is module-private; expose read + force-advance for QA.
    // Not referenced by gameplay logic.
    window._rccDbg = function () {
      return G ? {
        started: G.started, levelIdx: G.levelIdx, levelNumber: G.cfg ? G.cfg.level : null,
        health: G.health, growth: G.growth, score: G.score, finished: G.finished,
        totalThreats: G.totalThreats, activeThreatCount: G.activeThreats ? G.activeThreats.length : 0,
        totalConfiguredLevels: LEVEL_CFG.length,
      } : null;
    };
    // Instantly resolves every active/incoming threat with its best action
    // until the whole campaign (all LEVEL_CFG entries) finishes, then calls
    // done(finalDbgSnapshot). Mirrors real optimal play, just automated.
    window._rccForceWinAll = function (done) {
      function pump() {
        if (!G) { if (done) done(null); return; }
        if (!G.started && G.finished) { if (done) done(window._rccDbg()); return; }
        if (G.activeThreats && G.activeThreats.length) {
          // Resolve every active threat optimally
          G.activeThreats.slice().forEach(t => triggerAction(t.bestAction));
        }
        setTimeout(pump, 120);
      }
      pump();
    };
  }

  /* ── action panel ──────────────────────────────────────────── */
  function buildActionPanel() {
    const panel = document.querySelector('#rcc-actions > div');
    if (!panel) return;
    panel.innerHTML = '';
    ACTIONS.forEach((a, idx) => {
      const btn = document.createElement('button');
      btn.id = `rcc-action-${a.id}`;
      btn.dataset.action = a.id;
      btn.style.cssText = `
        flex:1;background:${a.color}18;border:1.5px solid ${a.color}55;border-radius:10px;
        color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:6px;padding:8px 4px;transition:background 0.15s,transform 0.1s;
        -webkit-tap-highlight-color:transparent;position:relative;overflow:hidden;
      `;
      btn.innerHTML = `
        <div style="font-size:26px;line-height:1;">${a.icon}</div>
        <div style="font-family:Orbitron,monospace;font-size:9px;font-weight:700;color:${a.color};letter-spacing:0.8px;text-align:center;">${a.label}</div>
        <div style="font-size:9px;color:#888;text-align:center;line-height:1.3;padding:0 4px;">${a.desc}</div>
        <div style="position:absolute;top:6px;right:8px;font-family:Orbitron,monospace;font-size:9px;color:${a.color}88;">[${idx+1}]</div>
      `;
      btn.addEventListener('click', () => triggerAction(a.id));
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); triggerAction(a.id); }, { passive: false });
      // hover
      btn.addEventListener('mouseenter', () => { btn.style.background = `${a.color}30`; btn.style.transform = 'scale(1.03)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = `${a.color}18`; btn.style.transform = 'scale(1)'; });
      panel.appendChild(btn);
    });
  }

  /* ── keyboard ──────────────────────────────────────────────── */
  function onKey(e) {
    if (!G || !G.started) return;
    const map = { '1':'shield','2':'cash','3':'diversify','4':'cut' };
    if (map[e.key]) { e.preventDefault(); triggerAction(map[e.key]); }
    if (e.key === 'Escape') window.inv_riskcontrolExit();
  }

  /* ── background canvas scanlines ───────────────────────────── */
  function setupBgCanvas() {
    const c = document.getElementById('rcc-bg-canvas');
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = AC;
    ctx.lineWidth = 0.5;
    const step = 28;
    for (let y = 0; y < c.height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
    }
    for (let x = 0; x < c.width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
    }
  }

  /* ── radar canvas ──────────────────────────────────────────── */
  let radarAngle = 0;
  let radarRaf = null;

  function setupRadar() {
    const canvas = document.getElementById('rcc-radar');
    if (!canvas) return;
    const arena = document.getElementById('rcc-arena');
    const aw = arena.offsetWidth;
    const ah = arena.offsetHeight;
    const size = Math.min(aw, ah) * 0.72;
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    if (radarRaf) cancelAnimationFrame(radarRaf);
    drawRadarLoop(canvas, size / 2);
  }

  function drawRadarLoop(canvas, r) {
    const ctx = canvas.getContext('2d');
    const cx = r, cy = r;

    function frame() {
      radarRaf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, r * 2, r * 2);

      // Background circle
      ctx.beginPath();
      ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,200,83,0.03)';
      ctx.fill();
      ctx.strokeStyle = AC + '33';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Concentric rings
      [0.25, 0.5, 0.75, 1].forEach(f => {
        ctx.beginPath();
        ctx.arc(cx, cy, (r - 4) * f, 0, Math.PI * 2);
        ctx.strokeStyle = AC + '22';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Cross hairs
      ctx.strokeStyle = AC + '33';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(4, cy); ctx.lineTo(r * 2 - 4, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 4); ctx.lineTo(cx, r * 2 - 4); ctx.stroke();

      // Sweep arm
      radarAngle += 0.02;
      const sweepGrad = ctx.createConicalGradient
        ? null // not standard; skip
        : null;

      // Draw sweep as a filled arc sector
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - 4, radarAngle - 0.6, radarAngle, false);
      ctx.closePath();
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r - 4);
      grd.addColorStop(0, AC + '00');
      grd.addColorStop(1, AC + '22');
      ctx.fillStyle = grd;
      ctx.fill();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(radarAngle) * (r - 4), cy + Math.sin(radarAngle) * (r - 4));
      ctx.strokeStyle = AC + 'cc';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Portfolio core
      const health = G ? (G.health || 100) : 100;
      const hColor = health > 60 ? AC : health > 30 ? WARN : DANGER;
      const coreR = Math.max(16, (r - 4) * 0.18 * (health / 100));

      // Shield rings (pulse when health < 70)
      if (G && G.started) {
        const pulse = (health < 70) ? (0.5 + 0.5 * Math.sin(Date.now() / 200)) : 1;
        const shieldR = (r - 4) * 0.32;
        ctx.beginPath();
        ctx.arc(cx, cy, shieldR, 0, Math.PI * 2);
        ctx.strokeStyle = `${hColor}${Math.round(40 * pulse).toString(16).padStart(2,'0')}`;
        ctx.lineWidth = 3 * pulse;
        ctx.stroke();

        // Outer shield
        ctx.beginPath();
        ctx.arc(cx, cy, (r - 4) * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = `${AC}22`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Core glow
      const grd2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.5);
      grd2.addColorStop(0, hColor + 'cc');
      grd2.addColorStop(0.5, hColor + '44');
      grd2.addColorStop(1, hColor + '00');
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grd2;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = hColor;
      ctx.fill();

      // Center label
      ctx.font = 'bold 10px Orbitron,monospace';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(health) + '%', cx, cy);

      // Threat blips (active threats on radar)
      if (G && G.activeThreats) {
        G.activeThreats.forEach(t => {
          if (!t.radarX) return;
          const age = (Date.now() - t.spawnTime) / t.responseWindow;
          const blipR = 5 + 2 * Math.sin(Date.now() / 150);
          ctx.beginPath();
          ctx.arc(t.radarX, t.radarY, blipR, 0, Math.PI * 2);
          ctx.fillStyle = t.color + 'cc';
          ctx.fill();
          ctx.strokeStyle = t.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Progress ring around blip (shrinks as time runs out)
          ctx.beginPath();
          ctx.arc(t.radarX, t.radarY, blipR + 4, -Math.PI / 2, -Math.PI / 2 + (1 - age) * Math.PI * 2);
          ctx.strokeStyle = t.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }
    }
    frame();
  }

  /* ══════════════════════════════════════════════════════════════
     GAME FLOW
  ══════════════════════════════════════════════════════════════ */
  function startLevel1() {
    hideIntro();
    beginLevel(0);
  }

  function beginLevel(levelIdx) {
    if (radarRaf) { /* keep running */ }

    const cfg = LEVEL_CFG[levelIdx];
    G = {
      started:        true,
      levelIdx:       levelIdx,
      cfg:            cfg,
      health:         100,
      growth:         0,
      score:          0,
      totalThreats:   cfg.threatPool.length,
      threatQueueIdx: 0,
      activeThreats:  [],
      resolved:       0,
      bestActions:    0,
      missedThreats:  0,
      spawnTimer:     null,
      checkTimer:     null,
      finished:       false,
    };

    // Update level badge
    const badge = document.getElementById('rcc-level-badge');
    if (badge) badge.textContent = `LEVEL ${cfg.level} · ${cfg.title} — ${cfg.subtitle}`;

    updateHUD();
    setTip('Threats incoming — activate the right defense!');

    // Start spawning
    spawnNext();
  }

  /* ── spawning ──────────────────────────────────────────────── */
  function spawnNext() {
    if (!G || !G.started || G.finished) return;

    if (G.threatQueueIdx >= G.totalThreats) {
      // All threats dispatched — wait for resolution
      G.checkTimer = setInterval(checkAllResolved, 500);
      return;
    }

    const cfg = G.cfg;
    const maxSim = cfg.simultaneousMax;

    // How many to spawn this wave
    const toSpawn = Math.min(
      maxSim,
      G.totalThreats - G.threatQueueIdx
    );

    for (let i = 0; i < toSpawn; i++) {
      if (G.threatQueueIdx < G.totalThreats) {
        spawnThreat(G.cfg.threatPool[G.threatQueueIdx]);
        G.threatQueueIdx++;
      }
    }

    G.spawnTimer = setTimeout(spawnNext, cfg.intervalMs);
  }

  function checkAllResolved() {
    if (!G) return;
    if (G.activeThreats.length === 0 && G.threatQueueIdx >= G.totalThreats) {
      clearInterval(G.checkTimer);
      finishLevel();
    }
  }

  function spawnThreat(threatId) {
    if (!G) return;
    const def = THREATS.find(t => t.id === threatId) || THREATS[0];
    const cfg = G.cfg;

    // Radar position (random on ring 0.4–0.9)
    const canvas = document.getElementById('rcc-radar');
    const r = canvas ? canvas.width / 2 : 80;
    const angle = Math.random() * Math.PI * 2;
    const dist = (0.4 + Math.random() * 0.5) * (r - 4);
    const rx = r + Math.cos(angle) * dist;
    const ry = r + Math.sin(angle) * dist;

    const threat = {
      ...def,
      uid:          Date.now() + Math.random(),
      spawnTime:    Date.now(),
      responseWindow: cfg.responseWindow,
      radarX:       rx,
      radarY:       ry,
      expireTimer:  null,
    };

    G.activeThreats.push(threat);

    // DOM card
    renderThreatCard(threat);

    // Auto-expire if not answered
    threat.expireTimer = setTimeout(() => threatExpired(threat), cfg.responseWindow);
  }

  function renderThreatCard(threat) {
    const container = document.getElementById('rcc-threats');
    if (!container) return;

    const arena = document.getElementById('rcc-arena');
    const aw = arena.offsetWidth;
    const ah = arena.offsetHeight;

    // Position based on radar position, but clamped to arena edges
    const canvas = document.getElementById('rcc-radar');
    const cr = canvas ? canvas.width / 2 : 80;
    // Convert radar coords to arena coords
    const radarLeft = (aw - cr * 2) / 2;
    const radarTop  = (ah - cr * 2) / 2;
    const ax = radarLeft + threat.radarX;
    const ay = radarTop  + threat.radarY;

    // Offset card outward from center
    const cx = aw / 2, cy = ah / 2;
    const dx = ax - cx, dy = ay - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Place card at radar blip, offset 8px outward
    const cardX = Math.max(8, Math.min(aw - 160, ax + (dx / len) * 8 - 75));
    const cardY = Math.max(8, Math.min(ah - 90,  ay + (dy / len) * 8 - 40));

    const card = document.createElement('div');
    card.id = `rcc-threat-${threat.uid}`;
    card.style.cssText = `
      position:absolute;left:${cardX}px;top:${cardY}px;
      width:148px;background:rgba(3,4,12,0.92);border:1.5px solid ${threat.color};
      border-radius:8px;padding:8px 10px;pointer-events:none;
      box-shadow:0 0 16px ${threat.color}44;
      animation:rcc-card-in 0.2s ease-out;
    `;
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:18px;">${threat.icon}</span>
        <div>
          <div style="font-size:10px;font-weight:700;color:${threat.color};line-height:1.2;">${threat.label}</div>
          <div style="font-size:9px;color:#aaa;">−${threat.damage}% if ignored</div>
        </div>
      </div>
      <div style="margin-top:6px;height:3px;background:#1a1a2e;border-radius:2px;overflow:hidden;">
        <div id="rcc-threat-timer-${threat.uid}" style="height:100%;background:${threat.color};width:100%;transition:width linear;"></div>
      </div>
    `;
    container.appendChild(card);

    // Animate timer bar
    requestAnimationFrame(() => {
      const bar = document.getElementById(`rcc-threat-timer-${threat.uid}`);
      if (bar) {
        bar.style.transitionDuration = `${threat.responseWindow}ms`;
        bar.style.width = '0%';
      }
    });

    // Inject keyframe if not done
    if (!document.getElementById('rcc-card-anim')) {
      const style = document.createElement('style');
      style.id = 'rcc-card-anim';
      style.textContent = `
        @keyframes rcc-card-in { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        @keyframes rcc-card-out { from { opacity:1; } to { opacity:0; transform:scale(0.9) translateY(-6px); } }
        @keyframes rcc-flash { 0%,100%{opacity:0} 20%,80%{opacity:1} }
      `;
      document.head.appendChild(style);
    }
  }

  function removeThreatCard(threat) {
    const card = document.getElementById(`rcc-threat-${threat.uid}`);
    if (card) {
      card.style.animation = 'rcc-card-out 0.25s ease-in forwards';
      setTimeout(() => card.remove(), 260);
    }
  }

  function threatExpired(threat) {
    if (!G || !G.started) return;
    const idx = G.activeThreats.findIndex(t => t.uid === threat.uid);
    if (idx === -1) return; // already handled
    G.activeThreats.splice(idx, 1);
    removeThreatCard(threat);

    // Take damage
    applyDamage(threat.damage, threat.label);
    G.missedThreats++;

    if (G.health <= 0) {
      gameOver();
    }
  }

  /* ── action trigger ─────────────────────────────────────────── */
  function triggerAction(actionId) {
    if (!G || !G.started || G.finished) return;

    if (G.activeThreats.length === 0) {
      pulseButton(actionId, false);
      setTip('No active threats right now — wait for the radar!');
      return;
    }

    // Find best matching threat (prefer best action match)
    let targetThreat = G.activeThreats.find(t => t.bestAction === actionId);
    if (!targetThreat) targetThreat = G.activeThreats[0]; // resolve oldest

    // Clear expire timer
    if (targetThreat.expireTimer) clearTimeout(targetThreat.expireTimer);

    const idx = G.activeThreats.findIndex(t => t.uid === targetThreat.uid);
    if (idx !== -1) G.activeThreats.splice(idx, 1);
    removeThreatCard(targetThreat);

    const isBest = actionId === targetThreat.bestAction;
    const dmgReduced = isBest ? Math.round(targetThreat.damage * 0.05) : Math.round(targetThreat.damage * 0.45);
    const growthGain = isBest ? G.cfg.growthPerBestAction : G.cfg.growthPerDefend;

    // Apply partial damage even if not best action
    if (dmgReduced > 0) applyDamage(dmgReduced, null);

    // Growth
    G.growth += growthGain;
    G.growth = Math.min(G.growth, 60);

    // Score
    const reactionMs = Date.now() - targetThreat.spawnTime;
    const speedBonus = Math.max(0, Math.round((G.cfg.responseWindow - reactionMs) / 100));
    const points = (isBest ? 100 : 40) + speedBonus;
    G.score += points;
    G.resolved++;
    if (isBest) G.bestActions++;

    pulseButton(actionId, true);
    showFeedback(isBest ? '✓ OPTIMAL' : '✓ DEFENDED', isBest ? AC : WARN);
    setTip(isBest ? `Perfect! ${targetThreat.tip}` : `Defended, but ${ACTIONS.find(a=>a.id===targetThreat.bestAction)?.label} was optimal.`);

    updateHUD();

    if (G.health <= 0) gameOver();
  }

  function applyDamage(dmg, label) {
    if (!G) return;
    G.health = Math.max(0, G.health - dmg);
    updateHUD();
    if (label) showFeedback(`⚠ ${label} hit!`, DANGER);
  }

  /* ── finish / game over ─────────────────────────────────────── */
  function finishLevel() {
    if (!G || G.finished) return;

    const isLastLevel = G.levelIdx >= LEVEL_CFG.length - 1;

    if (!isLastLevel) {
      // Advance to the next level in the campaign
      const nextIdx = G.levelIdx + 1;
      const finishedCfg = G.cfg;
      const nextCfg = LEVEL_CFG[nextIdx];
      G.finished = true;
      showFeedback(`MISSION ${finishedCfg.level} ACCOMPLISHED!`, AC);
      setTip(`Excellent defense! Preparing ${nextCfg.subtitle.toLowerCase()}...`);
      setTimeout(() => {
        const savedHealth = G.health;
        const savedGrowth = G.growth;
        const savedScore  = G.score;
        beginLevel(nextIdx);
        G.health  = savedHealth;
        G.growth  = savedGrowth;
        G.score   = savedScore;
        updateHUD();
      }, 2200);
    } else {
      // Final level done — end game
      G.finished = true;
      setTimeout(() => endGame(), 800);
    }
  }

  function gameOver() {
    if (!G || G.finished) return;
    G.finished = true;
    G.started  = false;
    if (G.spawnTimer) clearTimeout(G.spawnTimer);
    if (G.checkTimer) clearInterval(G.checkTimer);
    // Clear active threats
    G.activeThreats.forEach(t => { if (t.expireTimer) clearTimeout(t.expireTimer); });
    G.activeThreats = [];
    document.getElementById('rcc-threats').innerHTML = '';
    showFeedback('PORTFOLIO WIPED OUT', DANGER);
    setTimeout(() => endGameWithStars(1), 1200);
  }

  function endGame() {
    if (!G) return;
    G.started = false;
    if (G.spawnTimer) clearTimeout(G.spawnTimer);
    if (G.checkTimer) clearInterval(G.checkTimer);

    const health = G.health;
    const growth = G.growth;
    const accuracy = G.resolved > 0 ? Math.round((G.bestActions / G.resolved) * 100) : 0;

    let stars;
    if (health >= 70 && accuracy >= 60 && growth >= 10) stars = 3;
    else if (health >= 40 && accuracy >= 35) stars = 2;
    else if (health > 0) stars = 1;
    else stars = 1;

    endGameWithStars(stars);
  }

  function endGameWithStars(stars) {
    if (!G) return;
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_inv_riskcontrol', { level: (G.levelIdx || 0) + 1, stars, badge: 'Risk Manager', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('inv_wealth', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    // Populate end overlay
    document.getElementById('rcc-end-title').textContent =
      G.health > 0 ? 'MISSION ACCOMPLISHED' : 'PORTFOLIO LOST';

    document.getElementById('rcc-end-stars').textContent =
      '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    const health = G ? G.health : 0;
    const growth = G ? G.growth : 0;
    const accuracy = G && G.resolved > 0 ? Math.round((G.bestActions / G.resolved) * 100) : 0;

    document.getElementById('rcc-end-stats').innerHTML = `
      <div style="text-align:center;">
        <div style="font-family:Orbitron,monospace;font-size:18px;color:${AC};font-weight:700;">${Math.round(health)}%</div>
        <div style="font-size:10px;color:#888;">Health</div>
      </div>
      <div style="text-align:center;">
        <div style="font-family:Orbitron,monospace;font-size:18px;color:${GOLD};font-weight:700;">+${Math.round(growth)}%</div>
        <div style="font-size:10px;color:#888;">Growth</div>
      </div>
      <div style="text-align:center;">
        <div style="font-family:Orbitron,monospace;font-size:18px;color:#40C4FF;font-weight:700;">${accuracy}%</div>
        <div style="font-size:10px;color:#888;">Accuracy</div>
      </div>
      <div style="text-align:center;">
        <div style="font-family:Orbitron,monospace;font-size:18px;color:#fff;font-weight:700;">${G ? G.score : 0}</div>
        <div style="font-size:10px;color:#888;">Score</div>
      </div>
    `;

    document.getElementById('rcc-end-coins').textContent = `+ ${coins} COINS EARNED`;

    document.getElementById('rcc-end-lesson').textContent =
      "Smart investors don't just chase gains — they protect what they have. Diversifying, holding cash, and managing risk keeps your wealth safe through any storm.";

    showEnd();
  }

  /* ── HUD helpers ───────────────────────────────────────────── */
  function updateHUD() {
    if (!G) return;
    const h = Math.max(0, Math.round(G.health));
    const g = Math.round(G.growth);

    const hv = document.getElementById('rcc-health-val');
    const hb = document.getElementById('rcc-healthbar');
    const gv = document.getElementById('rcc-growth-val');
    const sv = document.getElementById('rcc-score-val');

    if (hv) {
      hv.textContent = h + '%';
      hv.style.color = h > 60 ? AC : h > 30 ? WARN : DANGER;
    }
    if (hb) {
      hb.style.width = h + '%';
      hb.style.background = h > 60
        ? `linear-gradient(90deg,${DANGER},${WARN},${AC})`
        : h > 30
          ? `linear-gradient(90deg,${DANGER},${WARN})`
          : DANGER;
    }
    if (gv) gv.textContent = `+${g}%`;
    if (sv) sv.textContent = G.score;
  }

  function setTip(text) {
    const tip = document.getElementById('rcc-tip');
    if (tip) tip.textContent = text;
  }

  function showFeedback(text, color) {
    const fb = document.getElementById('rcc-feedback');
    if (!fb) return;
    fb.textContent = text;
    fb.style.color = color;
    fb.style.animation = 'none';
    requestAnimationFrame(() => {
      fb.style.animation = 'rcc-flash 1.1s ease-out forwards';
    });
  }

  function pulseButton(actionId, success) {
    const btn = document.getElementById(`rcc-action-${actionId}`);
    if (!btn) return;
    const orig = btn.style.background;
    btn.style.background = success ? AC + '55' : DANGER + '44';
    btn.style.transform = 'scale(0.96)';
    setTimeout(() => {
      btn.style.background = orig;
      btn.style.transform = 'scale(1)';
    }, 220);
  }

  /* ── overlay show/hide ─────────────────────────────────────── */
  function hideIntro() {
    const el = document.getElementById('rcc-intro');
    if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 320); }
  }

  function showEnd() {
    const el = document.getElementById('rcc-end');
    if (el) { el.style.display = 'flex'; }
  }

  function hideEnd() {
    const el = document.getElementById('rcc-end');
    if (el) { el.style.display = 'none'; }
    // Clear threat cards
    const tc = document.getElementById('rcc-threats');
    if (tc) tc.innerHTML = '';
  }

})();
