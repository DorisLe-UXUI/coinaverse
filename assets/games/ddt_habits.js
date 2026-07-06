/* ════════════════════════════════════════════════════════════════
   HABIT RESET CENTER · Debt Detox District — Rebuilder Hub
   Match bad financial habits to their best healthy replacements.
   Level 1 (Learn): Clear one-to-one matches taught in pairs.
   Level 2 (Master): Distractors + scenario-based best-fit matching.
   Screen ID : game_ddt_habits
   Hub       : rebuilder (#4B2D8F)
   Exit fn   : window.ddt_habitsExit
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── palette ───────────────────────────────────────────────── */
  const BG       = '#03040c';
  const ACCENT   = '#4B2D8F';
  const PURPLE   = '#7c3aed';
  const PURPLE2  = '#a78bfa';
  const VIOLET   = '#c4b5fd';
  const GOLD     = '#fbbf24';
  const GOLD2    = '#fef08a';
  const GREEN    = '#22c55e';
  const RED      = '#ef4444';
  const DARK1    = '#0d0818';
  const DARK2    = '#110d1e';
  const MUTED    = '#3d2f6b';

  /* ── timing & scoring ─────────────────────────────────────── */
  const LEVEL_TIME   = 60;       // seconds per level
  const BASE_SCORE   = 120;      // per correct match
  const SPEED_BONUS  = 60;       // extra if matched within 4s of selection
  const MISMATCH_PEN = 30;       // score penalty per wrong tap
  const MAX_ERRORS   = 5;        // errors before game over
  const STAR3_SCORE  = 900;
  const STAR2_SCORE  = 500;

  /* ── habit data ─────────────────────────────────────────────── */
  // Level 1: simple, obvious pairs
  const L1_PAIRS = [
    {
      id: 'impulse',
      bad:  { label: 'Impulse Shopping',     icon: '🛍️', desc: 'Buying without thinking' },
      good: { label: '24-Hour Rule',          icon: '⏳', desc: 'Wait a day before buying' },
    },
    {
      id: 'minpay',
      bad:  { label: 'Minimum Payment Only', icon: '💳', desc: 'Paying the bare minimum' },
      good: { label: 'Pay Extra When Possible', icon: '💪', desc: 'Beat your balance down faster' },
    },
    {
      id: 'nobudget',
      bad:  { label: 'No Budget',            icon: '🤷', desc: 'Spending without a plan' },
      good: { label: 'Spending Plan',        icon: '📋', desc: 'Know where every dollar goes' },
    },
    {
      id: 'latebills',
      bad:  { label: 'Late Bills',           icon: '🔴', desc: 'Missing payment deadlines' },
      good: { label: 'Set AutoPay',          icon: '⚡', desc: 'Never miss a due date again' },
    },
  ];

  // Level 2: distractors included — best match must be chosen
  // Each scenario has one BEST answer and one or two distractors
  const L2_SCENARIOS = [
    {
      id: 'late_fee',
      bad:  { label: 'Late Bills', icon: '🔴', desc: 'You keep forgetting rent and get $35 late fees every month' },
      options: [
        { label: 'Set AutoPay',       icon: '⚡', isCorrect: true,  reason: 'Removes human error entirely' },
        { label: 'Spending Plan',     icon: '📋', isCorrect: false, reason: 'Helps overall but doesn\'t fix late payments' },
        { label: '24-Hour Rule',      icon: '⏳', isCorrect: false, reason: 'For shopping, not bill timing' },
      ]
    },
    {
      id: 'cart_regret',
      bad:  { label: 'Impulse Shopping', icon: '🛍️', desc: 'You buy trending items and regret it within a week' },
      options: [
        { label: '24-Hour Rule',      icon: '⏳', isCorrect: true,  reason: 'Breaks the emotional trigger cycle' },
        { label: 'Set AutoPay',       icon: '⚡', isCorrect: false, reason: 'For bills, not shopping decisions' },
        { label: 'Pay Extra',         icon: '💪', isCorrect: false, reason: 'Helps debt, not impulse buying' },
      ]
    },
    {
      id: 'debt_spiral',
      bad:  { label: 'Minimum Payments', icon: '💳', desc: 'You owe $4,000 and only pay the $25 minimum each month' },
      options: [
        { label: 'Pay Extra When Possible', icon: '💪', isCorrect: true,  reason: 'Directly reduces principal & interest' },
        { label: '24-Hour Rule',      icon: '⏳', isCorrect: false, reason: 'Helps future spending, not current debt' },
        { label: 'Spending Plan',     icon: '📋', isCorrect: false, reason: 'Useful but doesn\'t directly attack the debt' },
      ]
    },
    {
      id: 'no_plan',
      bad:  { label: 'No Budget',    icon: '🤷', desc: 'You earn $3,000/month but never know where it goes' },
      options: [
        { label: 'Spending Plan',     icon: '📋', isCorrect: true,  reason: 'Directly solves the visibility problem' },
        { label: 'Set AutoPay',       icon: '⚡', isCorrect: false, reason: 'Automates bills, doesn\'t track spending' },
        { label: 'Pay Extra',         icon: '💪', isCorrect: false, reason: 'Can\'t pay extra if you don\'t know your cash flow' },
      ]
    },
    {
      id: 'stress_spend',
      bad:  { label: 'Stress Shopping', icon: '😤', desc: 'You shop online when anxious and regret it the next morning' },
      options: [
        { label: '24-Hour Rule',      icon: '⏳', isCorrect: true,  reason: 'Breaks the emotional trigger before purchase' },
        { label: 'Spending Plan',     icon: '📋', isCorrect: false, reason: 'Useful but doesn\'t stop emotional triggers' },
        { label: 'Set AutoPay',       icon: '⚡', isCorrect: false, reason: 'For recurring bills, not mood-driven spending' },
      ]
    },
    {
      id: 'cc_interest',
      bad:  { label: 'Carrying Balance', icon: '💸', desc: 'You carry $1,200 on a 24% APR card paying $30/month' },
      options: [
        { label: 'Pay Extra When Possible', icon: '💪', isCorrect: true,  reason: 'Slashes interest accumulation fastest' },
        { label: 'Spending Plan',     icon: '📋', isCorrect: false, reason: 'Good tool but doesn\'t attack existing debt' },
        { label: '24-Hour Rule',      icon: '⏳', isCorrect: false, reason: 'Helps future purchases, not existing debt' },
      ]
    },
  ];

  /* ── state ─────────────────────────────────────────────────── */
  let G = null;

  /* ── screen registration ────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_ddt_habits = function () {
    G = null;
    setTimeout(initGame, 40);
    return `
<div id="ddt_root" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:'Inter',sans-serif;color:#fff">

  <!-- ambient bg canvas -->
  <canvas id="ddt_bg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.7"></canvas>

  <!-- TOP BAR -->
  <div id="ddt_topbar" style="
    position:absolute;top:0;left:0;right:0;z-index:30;
    display:flex;align-items:center;gap:10px;
    padding:10px 14px;
    background:linear-gradient(to bottom,rgba(3,4,12,.95),rgba(3,4,12,.7));
    border-bottom:1px solid ${MUTED};
    backdrop-filter:blur(8px);
  ">
    <button id="ddt_back" style="
      background:rgba(75,45,143,.25);border:1px solid ${ACCENT};
      color:${VIOLET};border-radius:8px;padding:6px 12px;cursor:pointer;
      font-size:14px;font-family:Inter,sans-serif;flex-shrink:0;
      transition:background .2s;
    ">← Hub</button>
    <div style="flex:1;text-align:center">
      <div style="font-family:'Orbitron',monospace;font-size:13px;font-weight:700;color:${PURPLE2};letter-spacing:2px;text-transform:uppercase">
        Habit Reset Center
      </div>
      <div id="ddt_levelind" style="font-size:10px;color:${MUTED};margin-top:1px;letter-spacing:1px">LEVEL 1 — LEARN</div>
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-shrink:0">
      <div style="text-align:right">
        <div style="font-size:9px;color:${VIOLET};letter-spacing:1px;text-transform:uppercase">SCORE</div>
        <div id="ddt_score" style="font-family:'Orbitron',monospace;font-size:16px;font-weight:800;color:${GOLD}">0</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:9px;color:${VIOLET};letter-spacing:1px;text-transform:uppercase">TIME</div>
        <div id="ddt_timer" style="font-family:'Orbitron',monospace;font-size:16px;font-weight:800;color:#fff">1:00</div>
      </div>
    </div>
  </div>

  <!-- HUD STRIP -->
  <div id="ddt_hud" style="
    position:absolute;top:58px;left:0;right:0;z-index:20;
    display:flex;align-items:center;justify-content:space-between;
    padding:7px 16px;
    background:rgba(13,8,24,.8);
    border-bottom:1px solid rgba(75,45,143,.4);
  ">
    <div style="display:flex;align-items:center;gap:6px">
      <span style="font-size:15px">🔥</span>
      <div>
        <div style="font-size:9px;color:${VIOLET};letter-spacing:1px">STREAK</div>
        <div id="ddt_streak" style="font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:${GOLD}">0</div>
      </div>
    </div>
    <div style="display:flex;gap:16px;align-items:center">
      <div style="display:flex;align-items:center;gap:5px">
        <span style="font-size:13px">💰</span>
        <div>
          <div style="font-size:9px;color:${VIOLET};letter-spacing:1px">COINS</div>
          <div id="ddt_coins_hud" style="font-family:'Orbitron',monospace;font-size:13px;color:${GOLD2}">0</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:5px">
        <span style="font-size:13px">💪</span>
        <div>
          <div style="font-size:9px;color:${VIOLET};letter-spacing:1px">STRENGTH</div>
          <div id="ddt_strength" style="font-family:'Orbitron',monospace;font-size:13px;color:${PURPLE2}">Lv.1</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:5px">
        <span style="font-size:13px">⚡</span>
        <div>
          <div style="font-size:9px;color:${RED};letter-spacing:1px">ERRORS</div>
          <div id="ddt_errors" style="font-family:'Orbitron',monospace;font-size:13px;color:${RED}">0/${MAX_ERRORS}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- MAIN GAME AREA -->
  <div id="ddt_arena" style="
    position:absolute;top:110px;left:0;right:0;bottom:0;
    display:flex;flex-direction:column;align-items:center;
    overflow-y:auto;padding:12px 14px 20px;
    scroll-behavior:smooth;
  "></div>

  <!-- CANVAS for connection lines -->
  <canvas id="ddt_lines" style="position:absolute;top:110px;left:0;right:0;bottom:0;pointer-events:none;z-index:15"></canvas>

  <!-- FEEDBACK POPUP -->
  <div id="ddt_feedback" style="
    position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);
    z-index:50;pointer-events:none;opacity:0;
    font-family:'Orbitron',monospace;font-size:22px;font-weight:900;
    text-shadow:0 0 20px currentColor;transition:opacity .3s;
  "></div>

  <!-- MACHINE ACTIVATIONS -->
  <div id="ddt_machines" style="position:absolute;bottom:0;left:0;right:0;height:60px;z-index:10;pointer-events:none;display:flex;align-items:flex-end;gap:0"></div>

  <!-- END OVERLAY (hidden) -->
  <div id="ddt_endoverlay" style="
    display:none;position:absolute;inset:0;z-index:100;
    background:rgba(3,4,12,.93);backdrop-filter:blur(10px);
    align-items:center;justify-content:center;flex-direction:column;
    text-align:center;padding:24px;
  ">
    <div id="ddt_end_title" style="font-family:'Orbitron',monospace;font-size:22px;font-weight:900;color:${PURPLE2};margin-bottom:8px;letter-spacing:2px"></div>
    <div id="ddt_end_stars" style="font-size:42px;margin:12px 0;letter-spacing:6px"></div>
    <div id="ddt_end_coins" style="font-family:'Orbitron',monospace;font-size:18px;color:${GOLD};margin-bottom:4px"></div>
    <div id="ddt_end_xp" style="font-size:12px;color:${VIOLET};margin-bottom:16px"></div>
    <div id="ddt_end_lesson" style="
      max-width:420px;font-size:13px;line-height:1.7;color:rgba(196,181,253,.85);
      background:rgba(75,45,143,.15);border:1px solid rgba(75,45,143,.4);
      border-radius:12px;padding:14px 18px;margin-bottom:20px;text-align:left;
    "></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
      <button id="ddt_replay" style="
        background:linear-gradient(135deg,${ACCENT},${PURPLE});
        border:none;color:#fff;padding:12px 28px;border-radius:10px;
        font-family:'Orbitron',monospace;font-size:13px;font-weight:700;
        cursor:pointer;letter-spacing:1px;transition:transform .15s;
      ">PLAY AGAIN</button>
      <button id="ddt_hub" style="
        background:transparent;border:2px solid ${MUTED};
        color:${VIOLET};padding:12px 28px;border-radius:10px;
        font-family:'Orbitron',monospace;font-size:13px;font-weight:700;
        cursor:pointer;letter-spacing:1px;transition:border-color .2s;
      ">← HUB</button>
    </div>
  </div>

</div>`;
  };

  /* ── exit ──────────────────────────────────────────────────── */
  window.ddt_habitsExit = function () {
    if (G) {
      clearInterval(G.timerHandle);
      cancelAnimationFrame(G.animHandle);
    }
    G = null;
    if (window.state) state.viewingWorld = 'rebuilder';
    goTo('hub');
  };

  /* ── init ──────────────────────────────────────────────────── */
  function initGame() {
    const root = document.getElementById('ddt_root');
    if (!root) return;

    G = {
      level: 1,
      score: 0,
      streak: 0,
      bestStreak: 0,
      errors: 0,
      coinsEarned: 0,
      strength: 1,
      timeLeft: LEVEL_TIME,
      timerHandle: null,
      animHandle: null,
      selectedBad: null,      // index of selected bad node
      selectedBadEl: null,
      matchedCount: 0,
      totalPairs: 0,
      pairs: [],              // current level pair data
      badEls: [],             // DOM elements for bad nodes
      goodEls: [],            // DOM elements for good nodes
      matched: [],            // array of booleans tracking matched status
      connecting: false,
      selectionTime: 0,
      machineLevel: 0,        // how many machines activated
      // L2
      currentScenarioIdx: 0,
      l2Order: [],
    };

    setupBgCanvas();
    setupMachines();
    startLevel(1);

    // Button listeners
    document.getElementById('ddt_back').addEventListener('click', window.ddt_habitsExit);
    document.getElementById('ddt_back').addEventListener('mouseenter', function(){ this.style.background='rgba(75,45,143,.5)'; });
    document.getElementById('ddt_back').addEventListener('mouseleave', function(){ this.style.background='rgba(75,45,143,.25)'; });
  }

  /* ── bg canvas (ambient particles) ────────────────────────── */
  function setupBgCanvas() {
    const c = document.getElementById('ddt_bg');
    if (!c) return;
    const ctx = c.getContext('2d');
    const root = document.getElementById('ddt_root');
    const W = root.offsetWidth, H = root.offsetHeight;
    c.width = W; c.height = H;

    const particles = Array.from({length: 60}, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      hue: Math.random() < 0.5 ? 270 : 45,  // purple or gold
    }));

    // Grid lines
    function drawGrid() {
      const _hbg=ctx.createLinearGradient(0,0,0,H);
      _hbg.addColorStop(0,'#080518'); _hbg.addColorStop(0.5,'#0c0620'); _hbg.addColorStop(1,'#080518');
      ctx.fillStyle=_hbg; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = `rgba(75,45,143,0.08)`;
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      // Particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,65%,${p.alpha})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });
    }

    function loop() {
      if (!G) return;
      drawGrid();
      G.animHandle = requestAnimationFrame(loop);
    }
    drawGrid();
    G.animHandle = requestAnimationFrame(loop);
  }

  /* ── machines strip ────────────────────────────────────────── */
  function setupMachines() {
    const container = document.getElementById('ddt_machines');
    if (!container) return;
    const machineIcons = ['⚙️','🔬','🖥️','🔋','⚗️','🛠️','💡'];
    container.innerHTML = '';
    const root = document.getElementById('ddt_root');
    const count = Math.floor(root.offsetWidth / 50) + 1;
    for (let i = 0; i < count; i++) {
      const m = document.createElement('div');
      m.className = 'ddt_machine';
      m.style.cssText = `
        flex:1;text-align:center;font-size:22px;opacity:.15;
        transition:opacity .4s,filter .4s;filter:grayscale(1);
        padding-bottom:4px;
      `;
      m.textContent = machineIcons[i % machineIcons.length];
      container.appendChild(m);
    }
  }

  function activateMachine() {
    const machines = document.querySelectorAll('.ddt_machine');
    const inactive = Array.from(machines).filter(m => parseFloat(m.style.opacity) < 0.5);
    if (inactive.length > 0) {
      const m = inactive[0];
      m.style.opacity = '1';
      m.style.filter = 'none';
      m.style.textShadow = `0 0 12px ${PURPLE2}`;
      // pulse
      m.style.transform = 'scale(1.4)';
      setTimeout(() => { m.style.transform = 'scale(1)'; }, 300);
      G.machineLevel++;
    }
  }

  /* ── level setup ───────────────────────────────────────────── */
  function startLevel(lvl) {
    G.level = lvl;
    G.selectedBad = null;
    G.selectedBadEl = null;
    G.matchedCount = 0;
    G.connecting = false;
    clearInterval(G.timerHandle);
    G.timeLeft = LEVEL_TIME;
    updateTimer();

    document.getElementById('ddt_levelind').textContent =
      lvl === 1 ? 'LEVEL 1 — LEARN' : 'LEVEL 2 — MASTER';

    if (lvl === 1) {
      buildLevel1();
    } else {
      buildLevel2();
    }

    startTimer();
  }

  /* ── level 1 UI ─────────────────────────────────────────────── */
  function buildLevel1() {
    G.pairs = [...L1_PAIRS];
    G.totalPairs = G.pairs.length;
    G.matched = new Array(G.pairs.length).fill(false);
    G.badEls = [];
    G.goodEls = [];

    // Shuffle good side
    const goodOrder = shuffleArr(G.pairs.map((p, i) => i));

    const arena = document.getElementById('ddt_arena');
    arena.innerHTML = '';

    // Instruction
    const instr = document.createElement('div');
    instr.style.cssText = `
      text-align:center;font-size:12px;color:${VIOLET};
      margin-bottom:14px;letter-spacing:.5px;line-height:1.5;
    `;
    instr.innerHTML = `Tap a <span style="color:${RED}">bad habit</span> then tap its best <span style="color:${GREEN}">healthy replacement</span>`;
    arena.appendChild(instr);

    // Columns container
    const cols = document.createElement('div');
    cols.id = 'ddt_cols';
    cols.style.cssText = `
      display:flex;gap:0;width:100%;max-width:520px;
      align-self:center;
    `;

    // Bad column
    const badCol = document.createElement('div');
    badCol.id = 'ddt_badcol';
    badCol.style.cssText = `flex:1;display:flex;flex-direction:column;gap:10px;padding-right:8px;`;

    const badLabel = document.createElement('div');
    badLabel.style.cssText = `font-size:10px;letter-spacing:2px;color:${RED};text-align:center;margin-bottom:4px;font-weight:600;text-transform:uppercase;`;
    badLabel.textContent = '⚠ Harmful Habits';
    badCol.appendChild(badLabel);

    G.pairs.forEach((pair, i) => {
      const el = createBadNode(pair.bad, i, 'l1');
      badCol.appendChild(el);
      G.badEls[i] = el;
    });

    // Connector column (visual separator)
    const midCol = document.createElement('div');
    midCol.style.cssText = `width:36px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:30px;gap:10px;`;
    for (let i = 0; i < G.pairs.length; i++) {
      const dot = document.createElement('div');
      dot.id = `ddt_dot_${i}`;
      dot.style.cssText = `
        width:8px;height:8px;border-radius:50%;
        background:${MUTED};margin:22px 0;
        transition:background .3s,box-shadow .3s;
        flex-shrink:0;
      `;
      midCol.appendChild(dot);
    }

    // Good column
    const goodCol = document.createElement('div');
    goodCol.id = 'ddt_goodcol';
    goodCol.style.cssText = `flex:1;display:flex;flex-direction:column;gap:10px;padding-left:8px;`;

    const goodLabel = document.createElement('div');
    goodLabel.style.cssText = `font-size:10px;letter-spacing:2px;color:${GREEN};text-align:center;margin-bottom:4px;font-weight:600;text-transform:uppercase;`;
    goodLabel.textContent = '✓ Better Habits';
    goodCol.appendChild(goodLabel);

    goodOrder.forEach((pairIdx, visualPos) => {
      const pair = G.pairs[pairIdx];
      const el = createGoodNode(pair.good, pairIdx, 'l1');
      goodCol.appendChild(el);
      G.goodEls[pairIdx] = el;
    });

    cols.appendChild(badCol);
    cols.appendChild(midCol);
    cols.appendChild(goodCol);
    arena.appendChild(cols);
  }

  function createBadNode(data, idx, mode) {
    const el = document.createElement('div');
    el.className = 'ddt_bad_node';
    el.dataset.idx = idx;
    el.dataset.mode = mode;
    el.style.cssText = `
      display:flex;align-items:center;gap:8px;
      background:linear-gradient(135deg,rgba(239,68,68,.12),rgba(13,8,24,.8));
      border:1.5px solid rgba(239,68,68,.4);border-radius:10px;
      padding:10px 12px;cursor:pointer;
      transition:all .2s;user-select:none;
      min-height:56px;position:relative;overflow:hidden;
    `;
    el.innerHTML = `
      <span style="font-size:20px;flex-shrink:0">${data.icon}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:rgba(252,165,165,1);line-height:1.2">${data.label}</div>
        ${data.desc ? `<div style="font-size:10px;color:rgba(252,165,165,.55);margin-top:2px;line-height:1.3">${data.desc}</div>` : ''}
      </div>
    `;
    el.addEventListener('click', () => handleBadClick(idx, el));
    el.addEventListener('mouseenter', () => { if (!el.dataset.matched) el.style.borderColor = 'rgba(239,68,68,.8)'; });
    el.addEventListener('mouseleave', () => { if (!el.dataset.matched && !el.dataset.selected) el.style.borderColor = 'rgba(239,68,68,.4)'; });
    return el;
  }

  function createGoodNode(data, pairIdx, mode) {
    const el = document.createElement('div');
    el.className = 'ddt_good_node';
    el.dataset.pairidx = pairIdx;
    el.dataset.mode = mode;
    el.style.cssText = `
      display:flex;align-items:center;gap:8px;
      background:linear-gradient(135deg,rgba(34,197,94,.12),rgba(13,8,24,.8));
      border:1.5px solid rgba(34,197,94,.35);border-radius:10px;
      padding:10px 12px;cursor:pointer;
      transition:all .2s;user-select:none;
      min-height:56px;position:relative;overflow:hidden;
    `;
    el.innerHTML = `
      <span style="font-size:20px;flex-shrink:0">${data.icon}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:rgba(134,239,172,1);line-height:1.2">${data.label}</div>
        ${data.desc ? `<div style="font-size:10px;color:rgba(134,239,172,.5);margin-top:2px;line-height:1.3">${data.desc}</div>` : ''}
      </div>
    `;
    el.addEventListener('click', () => handleGoodClick(pairIdx, el));
    el.addEventListener('mouseenter', () => { if (!el.dataset.matched) el.style.borderColor = 'rgba(34,197,94,.8)'; });
    el.addEventListener('mouseleave', () => { if (!el.dataset.matched && !el.dataset.selected) el.style.borderColor = 'rgba(34,197,94,.35)'; });
    return el;
  }

  /* ── level 2 UI ─────────────────────────────────────────────── */
  function buildLevel2() {
    G.l2Order = shuffleArr(L2_SCENARIOS.map((_, i) => i));
    G.currentScenarioIdx = 0;
    G.totalPairs = L2_SCENARIOS.length;
    G.matched = new Array(G.totalPairs).fill(false);
    renderL2Scenario();
  }

  function renderL2Scenario() {
    if (!G || G.currentScenarioIdx >= G.l2Order.length) {
      // All done
      endGame(calcStars());
      return;
    }
    const scenario = L2_SCENARIOS[G.l2Order[G.currentScenarioIdx]];
    const arena = document.getElementById('ddt_arena');
    arena.innerHTML = '';

    // Progress
    const prog = document.createElement('div');
    prog.style.cssText = `display:flex;gap:6px;justify-content:center;margin-bottom:14px;`;
    for (let i = 0; i < G.totalPairs; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        width:28px;height:5px;border-radius:3px;
        background:${i < G.currentScenarioIdx ? PURPLE2 : i === G.currentScenarioIdx ? GOLD : MUTED};
        transition:background .3s;
      `;
      prog.appendChild(dot);
    }
    arena.appendChild(prog);

    // Scenario label
    const scenLabel = document.createElement('div');
    scenLabel.style.cssText = `font-size:10px;letter-spacing:2px;color:${VIOLET};text-align:center;margin-bottom:10px;text-transform:uppercase;`;
    scenLabel.textContent = `Challenge ${G.currentScenarioIdx + 1} of ${G.totalPairs}`;
    arena.appendChild(scenLabel);

    // Bad habit card
    const badCard = document.createElement('div');
    badCard.style.cssText = `
      width:100%;max-width:420px;align-self:center;
      background:linear-gradient(135deg,rgba(239,68,68,.15),rgba(13,8,24,.9));
      border:2px solid rgba(239,68,68,.5);border-radius:14px;
      padding:16px;margin-bottom:16px;
    `;
    badCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="font-size:28px">${scenario.bad.icon}</span>
        <div>
          <div style="font-size:11px;color:rgba(252,165,165,.6);letter-spacing:1px;text-transform:uppercase;margin-bottom:2px">⚠ HARMFUL HABIT</div>
          <div style="font-size:15px;font-weight:700;color:rgba(252,165,165,1)">${scenario.bad.label}</div>
        </div>
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,.75);line-height:1.6;background:rgba(0,0,0,.3);padding:10px;border-radius:8px">
        📋 <em>${scenario.bad.desc}</em>
      </div>
    `;
    arena.appendChild(badCard);

    // Question
    const qLabel = document.createElement('div');
    qLabel.style.cssText = `
      font-size:12px;color:${GOLD2};text-align:center;
      margin-bottom:12px;letter-spacing:.5px;font-weight:600;
    `;
    qLabel.textContent = '↓ Choose the BEST replacement habit ↓';
    arena.appendChild(qLabel);

    // Options
    const opts = shuffleArr([...scenario.options]);
    const optContainer = document.createElement('div');
    optContainer.style.cssText = `
      display:flex;flex-direction:column;gap:10px;
      width:100%;max-width:420px;align-self:center;
    `;
    opts.forEach((opt, i) => {
      const btn = document.createElement('div');
      btn.style.cssText = `
        display:flex;align-items:center;gap:10px;
        background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(13,8,24,.85));
        border:1.5px solid rgba(34,197,94,.3);border-radius:10px;
        padding:12px 14px;cursor:pointer;transition:all .2s;
      `;
      btn.innerHTML = `
        <span style="font-size:22px;flex-shrink:0">${opt.icon}</span>
        <div style="font-size:13px;font-weight:700;color:rgba(134,239,172,.9)">${opt.label}</div>
      `;
      btn.addEventListener('mouseenter', () => btn.style.borderColor = 'rgba(34,197,94,.7)');
      btn.addEventListener('mouseleave', () => btn.style.borderColor = 'rgba(34,197,94,.3)');
      btn.addEventListener('click', () => handleL2Choice(opt, btn, optContainer, scenario));
      optContainer.appendChild(btn);
    });
    arena.appendChild(optContainer);

    // Reason hint area (fills in after answer)
    const reasonArea = document.createElement('div');
    reasonArea.id = 'ddt_reason';
    reasonArea.style.cssText = `
      width:100%;max-width:420px;align-self:center;
      margin-top:14px;opacity:0;transition:opacity .4s;
    `;
    arena.appendChild(reasonArea);
  }

  /* ── click handlers ─────────────────────────────────────────── */
  function handleBadClick(idx, el) {
    if (!G || G.matched[idx] || G.connecting) return;

    // Deselect previous
    if (G.selectedBadEl) {
      G.selectedBadEl.style.borderColor = 'rgba(239,68,68,.4)';
      G.selectedBadEl.style.background = 'linear-gradient(135deg,rgba(239,68,68,.12),rgba(13,8,24,.8))';
      G.selectedBadEl.style.transform = '';
      delete G.selectedBadEl.dataset.selected;
    }

    G.selectedBad = idx;
    G.selectedBadEl = el;
    G.selectionTime = Date.now();

    el.style.borderColor = GOLD;
    el.style.background = `linear-gradient(135deg,rgba(251,191,36,.18),rgba(13,8,24,.9))`;
    el.style.transform = 'scale(1.02)';
    el.dataset.selected = '1';

    // Pulse
    flashEl(el, GOLD, 200);
  }

  function handleGoodClick(pairIdx, el) {
    if (!G || G.matched[pairIdx]) return;
    if (G.selectedBad === null) {
      // No bad selected — highlight the el briefly
      flashEl(el, PURPLE2, 300);
      showFeedback('← Pick a bad habit first!', VIOLET);
      return;
    }

    const elapsed = Date.now() - G.selectionTime;
    const isCorrect = (G.selectedBad === pairIdx);

    if (isCorrect) {
      handleCorrectMatch(G.selectedBad, pairIdx, el, elapsed);
    } else {
      handleWrongMatch(G.selectedBad, pairIdx, el);
    }
  }

  function handleCorrectMatch(badIdx, goodIdx, goodEl, elapsed) {
    G.connecting = true;
    G.matched[badIdx] = true;
    G.matchedCount++;
    G.streak++;
    if (G.streak > G.bestStreak) G.bestStreak = G.streak;

    const streakMult = Math.min(1 + (G.streak - 1) * 0.2, 3);
    let pts = Math.round(BASE_SCORE * streakMult);
    if (elapsed < 4000) pts += SPEED_BONUS;
    G.score += pts;
    G.coinsEarned = Math.floor(G.score / 10);

    const badEl = G.badEls[badIdx];
    const goodNodeEl = goodEl;

    // Success styling
    badEl.style.borderColor = GREEN;
    badEl.style.background = `linear-gradient(135deg,rgba(34,197,94,.25),rgba(13,8,24,.9))`;
    badEl.style.opacity = '.6';
    badEl.style.transform = '';
    badEl.dataset.matched = '1';
    delete badEl.dataset.selected;

    goodNodeEl.style.borderColor = GREEN;
    goodNodeEl.style.background = `linear-gradient(135deg,rgba(34,197,94,.25),rgba(13,8,24,.9))`;
    goodNodeEl.dataset.matched = '1';

    // Checkmark overlay on bad node (dissolve animation)
    const check = document.createElement('div');
    check.style.cssText = `
      position:absolute;inset:0;background:rgba(34,197,94,.15);
      border-radius:10px;display:flex;align-items:center;justify-content:center;
      font-size:22px;animation:ddt_dissolve 1.2s forwards;pointer-events:none;
    `;
    check.textContent = '✓';
    ensureKeyframes();
    badEl.appendChild(check);

    // Dot indicator
    const dot = document.getElementById(`ddt_dot_${badIdx}`);
    if (dot) {
      dot.style.background = GREEN;
      dot.style.boxShadow = `0 0 8px ${GREEN}`;
    }

    // Flash connection line between nodes
    drawConnectionLine(badEl, goodNodeEl, GREEN);

    // Feedback
    const feedbackText = G.streak >= 3
      ? `🔥 ${G.streak}x STREAK! +${pts}`
      : `✓ CORRECT! +${pts}`;
    showFeedback(feedbackText, GREEN);

    // Activate machine
    activateMachine();

    // Strength level
    if (G.matchedCount % 2 === 0) {
      G.strength = Math.min(G.strength + 1, 5);
    }

    updateHUD();

    // Sparkle on good node
    spawnSparkles(goodNodeEl, PURPLE2);

    G.selectedBad = null;
    G.selectedBadEl = null;

    setTimeout(() => {
      G.connecting = false;
      // Check level complete
      if (G.matchedCount >= G.totalPairs) {
        setTimeout(() => {
          clearInterval(G.timerHandle);
          if (G.level === 1) {
            // Transition to level 2
            showLevelTransition();
          } else {
            endGame(calcStars());
          }
        }, 600);
      }
    }, 500);
  }

  function handleWrongMatch(badIdx, goodIdx, goodEl) {
    G.errors++;
    G.streak = 0;
    G.score = Math.max(0, G.score - MISMATCH_PEN);

    // Error styling
    const badEl = G.badEls[badIdx];
    badEl.style.borderColor = RED;
    badEl.style.background = `linear-gradient(135deg,rgba(239,68,68,.25),rgba(13,8,24,.9))`;
    goodEl.style.borderColor = RED;
    goodEl.style.background = `linear-gradient(135deg,rgba(239,68,68,.2),rgba(13,8,24,.85))`;

    showFeedback(`✗ MISMATCH! -${MISMATCH_PEN}`, RED);
    drawConnectionLine(badEl, goodEl, RED);

    // Shake
    shakeEl(badEl);
    shakeEl(goodEl);

    setTimeout(() => {
      // Reset styles
      if (badEl && !badEl.dataset.matched) {
        badEl.style.borderColor = 'rgba(239,68,68,.4)';
        badEl.style.background = 'linear-gradient(135deg,rgba(239,68,68,.12),rgba(13,8,24,.8))';
        badEl.style.transform = '';
        delete badEl.dataset.selected;
      }
      if (goodEl && !goodEl.dataset.matched) {
        goodEl.style.borderColor = 'rgba(34,197,94,.35)';
        goodEl.style.background = 'linear-gradient(135deg,rgba(34,197,94,.12),rgba(13,8,24,.8))';
      }
      G.selectedBad = null;
      G.selectedBadEl = null;
      updateHUD();
    }, 800);

    updateHUD();

    if (G.errors >= MAX_ERRORS) {
      clearInterval(G.timerHandle);
      setTimeout(() => endGame(0), 600);
    }
  }

  function handleL2Choice(opt, btn, container, scenario) {
    if (!G) return;
    const elapsed = Date.now() - (G.l2StartTime || Date.now());
    G.l2StartTime = null;

    // Disable all buttons
    Array.from(container.children).forEach(b => {
      b.style.cursor = 'default';
      b.style.pointerEvents = 'none';
    });

    const isCorrect = opt.isCorrect;

    if (isCorrect) {
      btn.style.borderColor = GREEN;
      btn.style.background = `linear-gradient(135deg,rgba(34,197,94,.3),rgba(13,8,24,.9))`;
      G.streak++;
      if (G.streak > G.bestStreak) G.bestStreak = G.streak;
      const streakMult = Math.min(1 + (G.streak - 1) * 0.2, 3);
      let pts = Math.round(BASE_SCORE * streakMult);
      if (elapsed < 4000) pts += SPEED_BONUS;
      G.score += pts;
      G.coinsEarned = Math.floor(G.score / 10);
      G.matchedCount++;
      if (G.matchedCount % 2 === 0) G.strength = Math.min(G.strength + 1, 5);
      activateMachine();
      showFeedback(G.streak >= 3 ? `🔥 ${G.streak}x STREAK! +${pts}` : `✓ CORRECT! +${pts}`, GREEN);
      spawnSparklesByCoords(btn.getBoundingClientRect(), PURPLE2);
    } else {
      btn.style.borderColor = RED;
      btn.style.background = `linear-gradient(135deg,rgba(239,68,68,.2),rgba(13,8,24,.9))`;
      G.errors++;
      G.streak = 0;
      G.score = Math.max(0, G.score - MISMATCH_PEN);
      showFeedback(`✗ NOT THE BEST CHOICE! -${MISMATCH_PEN}`, RED);
      shakeEl(btn);
      // Highlight correct
      Array.from(container.children).forEach(b => {
        const label = b.querySelector('div')?.textContent;
        const correctOpt = scenario.options.find(o => o.isCorrect);
        if (correctOpt && b.querySelector('div')?.textContent === correctOpt.label) {
          b.style.borderColor = GREEN;
          b.style.background = `linear-gradient(135deg,rgba(34,197,94,.2),rgba(13,8,24,.9))`;
        }
      });
    }

    // Show reason
    const reasonArea = document.getElementById('ddt_reason');
    if (reasonArea) {
      reasonArea.innerHTML = `
        <div style="
          background:rgba(75,45,143,.2);border:1px solid rgba(75,45,143,.4);
          border-radius:10px;padding:12px 14px;font-size:12px;color:${VIOLET};line-height:1.6;
        ">
          <strong style="color:${isCorrect ? GREEN : GOLD}">
            ${isCorrect ? '✓ Why it works:' : '💡 Best choice reason:'}
          </strong><br>
          ${isCorrect ? opt.reason : scenario.options.find(o => o.isCorrect).reason}
        </div>
      `;
      reasonArea.style.opacity = '1';
    }

    updateHUD();

    if (G.errors >= MAX_ERRORS) {
      clearInterval(G.timerHandle);
      setTimeout(() => endGame(0), 1000);
      return;
    }

    setTimeout(() => {
      G.currentScenarioIdx++;
      G.l2StartTime = Date.now();
      if (G.currentScenarioIdx >= G.l2Order.length) {
        clearInterval(G.timerHandle);
        setTimeout(() => endGame(calcStars()), 300);
      } else {
        renderL2Scenario();
      }
    }, isCorrect ? 1400 : 2000);
  }

  /* ── level transition ────────────────────────────────────────── */
  function showLevelTransition() {
    const arena = document.getElementById('ddt_arena');
    arena.innerHTML = `
      <div style="
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        min-height:300px;text-align:center;gap:16px;
      ">
        <div style="font-size:48px;animation:ddt_pulse 1s infinite">🏆</div>
        <div style="font-family:'Orbitron',monospace;font-size:20px;font-weight:900;color:${GOLD};letter-spacing:2px">
          LEVEL 1 COMPLETE!
        </div>
        <div style="font-size:13px;color:${VIOLET};max-width:300px;line-height:1.6">
          You've learned the basic habit pairs.<br>Now test your judgment in real scenarios.
        </div>
        <div style="
          background:rgba(75,45,143,.25);border:1px solid ${ACCENT};
          border-radius:10px;padding:12px 20px;
          font-family:'Orbitron',monospace;font-size:14px;color:${PURPLE2};
        ">
          🔓 LEVEL 2 — MASTER MODE
        </div>
        <button id="ddt_next_lvl" style="
          background:linear-gradient(135deg,${ACCENT},${PURPLE});
          border:none;color:#fff;padding:13px 32px;border-radius:10px;
          font-family:'Orbitron',monospace;font-size:13px;font-weight:700;
          cursor:pointer;letter-spacing:1px;margin-top:8px;
        ">BEGIN LEVEL 2 →</button>
      </div>
    `;
    document.getElementById('ddt_next_lvl').addEventListener('click', () => {
      startLevel(2);
    });
    ensureKeyframes();
  }

  /* ── timer ──────────────────────────────────────────────────── */
  function startTimer() {
    G.timerHandle = setInterval(() => {
      if (!G) return;
      G.timeLeft--;
      updateTimer();
      if (G.timeLeft <= 0) {
        clearInterval(G.timerHandle);
        endGame(calcStars());
      }
    }, 1000);
  }

  function updateTimer() {
    const el = document.getElementById('ddt_timer');
    if (!el || !G) return;
    const m = Math.floor(G.timeLeft / 60);
    const s = G.timeLeft % 60;
    el.textContent = `${m}:${s.toString().padStart(2,'0')}`;
    el.style.color = G.timeLeft <= 10 ? RED : '#fff';
    if (G.timeLeft <= 10 && G.timeLeft > 0) {
      el.style.textShadow = `0 0 10px ${RED}`;
    } else {
      el.style.textShadow = '';
    }
  }

  function updateHUD() {
    if (!G) return;
    const scoreEl = document.getElementById('ddt_score');
    const streakEl = document.getElementById('ddt_streak');
    const coinsEl  = document.getElementById('ddt_coins_hud');
    const strengthEl = document.getElementById('ddt_strength');
    const errorsEl = document.getElementById('ddt_errors');
    if (scoreEl)    scoreEl.textContent = G.score.toLocaleString();
    if (streakEl)   { streakEl.textContent = G.streak; streakEl.style.color = G.streak >= 3 ? GOLD : GOLD; }
    if (coinsEl)    coinsEl.textContent = G.coinsEarned;
    if (strengthEl) { strengthEl.textContent = `Lv.${G.strength}`; }
    if (errorsEl)   { errorsEl.textContent = `${G.errors}/${MAX_ERRORS}`; errorsEl.style.color = G.errors >= MAX_ERRORS - 1 ? RED : (G.errors > 0 ? '#f97316' : RED); }
  }

  /* ── end game ───────────────────────────────────────────────── */
  function calcStars() {
    if (!G) return 0;
    if (G.score >= STAR3_SCORE) return 3;
    if (G.score >= STAR2_SCORE) return 2;
    if (G.score > 0) return 1;
    return 0;
  }

  function endGame(stars) {
    if (!G) return;
    clearInterval(G.timerHandle);
    cancelAnimationFrame(G.animHandle);

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ddt_habits', { level: G.level, stars, is3star, isPerfect: is3star, badge: 'Habit Hero' })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('ddt_recovery', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    const overlay = document.getElementById('ddt_endoverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';

    const titleEl = document.getElementById('ddt_end_title');
    const starsEl = document.getElementById('ddt_end_stars');
    const coinsEl = document.getElementById('ddt_end_coins');
    const xpEl    = document.getElementById('ddt_end_xp');
    const lessonEl= document.getElementById('ddt_end_lesson');

    if (stars === 0) {
      titleEl.textContent = 'HABITS NOT RESET';
      titleEl.style.color = RED;
    } else if (stars === 3) {
      titleEl.textContent = 'HABITS FULLY RESET!';
      titleEl.style.color = GOLD;
    } else {
      titleEl.textContent = 'HABITS RESET';
      titleEl.style.color = PURPLE2;
    }

    starsEl.textContent = '⭐'.repeat(stars) + (stars < 3 ? '☆'.repeat(3 - stars) : '');
    coinsEl.textContent = `+${coins} Recovery Coins`;
    xpEl.textContent    = `+${Math.round(coins / 4)} XP  •  Best Streak: ${G.bestStreak}  •  Score: ${G.score.toLocaleString()}`;

    lessonEl.innerHTML = `
      <div style="font-family:'Orbitron',monospace;font-size:10px;letter-spacing:2px;color:${PURPLE2};margin-bottom:8px;text-transform:uppercase">💡 END LESSON</div>
      Financial health is built on daily habits. Impulse shopping, minimum-only payments, no budget, and late bills are the four habits most likely to keep someone in debt. Each one has a direct replacement that costs nothing but intention. <strong style="color:${GOLD}">Awareness is the first step</strong> — then practice makes the new habit automatic.
    `;

    document.getElementById('ddt_replay').addEventListener('click', () => {
      overlay.style.display = 'none';
      initGame();
    });
    document.getElementById('ddt_hub').addEventListener('click', () => {
      window.ddt_habitsExit();
    });
  }

  /* ── visual helpers ──────────────────────────────────────────── */
  function showFeedback(text, color) {
    const el = document.getElementById('ddt_feedback');
    if (!el) return;
    el.textContent = text;
    el.style.color = color;
    el.style.opacity = '1';
    setTimeout(() => { if (el) el.style.opacity = '0'; }, 900);
  }

  function flashEl(el, color, duration) {
    el.style.boxShadow = `0 0 16px ${color}`;
    setTimeout(() => { if (el) el.style.boxShadow = ''; }, duration);
  }

  function shakeEl(el) {
    el.animate([
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(0)' },
    ], { duration: 400, easing: 'ease-out' });
  }

  function drawConnectionLine(fromEl, toEl, color) {
    const canvas = document.getElementById('ddt_lines');
    if (!canvas) return;
    const arena = document.getElementById('ddt_arena');
    const arenaTop = arena ? arena.getBoundingClientRect().top : 110;

    const fromR = fromEl.getBoundingClientRect();
    const toR   = toEl.getBoundingClientRect();

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext('2d');
    const x1 = (fromR.left + fromR.right) / 2;
    const y1 = (fromR.top + fromR.bottom) / 2 - arenaTop + (arena ? arena.scrollTop : 0);
    const x2 = (toR.left + toR.right) / 2;
    const y2 = (toR.top + toR.bottom) / 2 - arenaTop + (arena ? arena.scrollTop : 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Draw particles along the line
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowBlur = 12;
      ctx.fill();
    }

    setTimeout(() => {
      if (canvas) {
        const ctx2 = canvas.getContext('2d');
        ctx2.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 900);
  }

  function spawnSparkles(el, color) {
    const r = el.getBoundingClientRect();
    spawnSparklesByCoords(r, color);
  }

  function spawnSparklesByCoords(r, color) {
    const root = document.getElementById('ddt_root');
    if (!root) return;
    const rootR = root.getBoundingClientRect();
    const cx = r.left + r.width / 2 - rootR.left;
    const cy = r.top + r.height / 2 - rootR.top;

    for (let i = 0; i < 10; i++) {
      const s = document.createElement('div');
      const angle = (i / 10) * Math.PI * 2;
      const dist = 30 + Math.random() * 30;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      s.style.cssText = `
        position:absolute;left:${cx}px;top:${cy}px;
        width:5px;height:5px;border-radius:50%;
        background:${color};pointer-events:none;z-index:60;
        transform:translate(-50%,-50%);
        transition:transform .6s ease-out,opacity .6s ease-out;
      `;
      root.appendChild(s);
      requestAnimationFrame(() => {
        s.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
        s.style.opacity = '0';
      });
      setTimeout(() => s.remove(), 700);
    }
  }

  function ensureKeyframes() {
    if (document.getElementById('ddt_kf')) return;
    const style = document.createElement('style');
    style.id = 'ddt_kf';
    style.textContent = `
      @keyframes ddt_dissolve {
        0%   { opacity:0; transform:scale(.8); }
        30%  { opacity:1; transform:scale(1.1); }
        100% { opacity:0; transform:scale(1.5); }
      }
      @keyframes ddt_pulse {
        0%,100% { transform:scale(1); }
        50%     { transform:scale(1.15); }
      }
      @keyframes ddt_glow {
        0%,100% { box-shadow:0 0 8px ${PURPLE}; }
        50%     { box-shadow:0 0 20px ${PURPLE2}, 0 0 40px ${ACCENT}; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ── utility ─────────────────────────────────────────────────── */
  function shuffleArr(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

})();
