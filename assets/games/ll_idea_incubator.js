/* ════════════════════════════════════════════════════════════════
   IDEA INCUBATOR — Launch Lab / Risk Taker Hub
   Drag Problem cards onto matching Solution cards to form startups.
   Correct match → Startup Energy + Idea pillar progress.
   Bad match → Failed Idea, energy drain.
   Level 1: Simple pairings, low pressure, few cards.
   Level 2: Customer segments, budgets, demographics, disruptors.
   WIN: Generate enough successful startups before time expires.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── palette ─────────────────────────────────────────────────── */
  const ACC   = '#7C3AED';   // hub accent violet
  const ACC2  = '#A78BFA';   // lighter violet
  const ACC3  = '#6D28D9';   // deep violet
  const GOLD  = '#FBBF24';   // gold
  const NEON  = '#38BDF8';   // neon blue
  const GOOD  = '#22C55E';
  const DANGER= '#EF4444';
  const BG    = '#03040c';

  /* ── level config ────────────────────────────────────────────── */
  const CFG = {
    1: { time: 90,  need: 5,  maxFail: 3, cards: 4, label: 'LEARN' },
    2: { time: 75,  need: 7,  maxFail: 3, cards: 6, label: 'MASTER' }
  };

  /* ── star thresholds (successful matches) ────────────────────── */
  const STAR3_L1 = 5, STAR2_L1 = 3;
  const STAR3_L2 = 7, STAR2_L2 = 5;

  /* ══════════════════════════════════════════════════════════════
     CARD DATA
     Each pair: { id, problem, solution, category, emoji, tags[] }
     Level 2 only: customer segments w/ budget + age
  ══════════════════════════════════════════════════════════════ */
  const ALL_PAIRS = [
    /* ── food & delivery ──────────────────────────────────────── */
    {
      id: 'lunch',
      problem:  { text: 'Long lunch lines',    emoji: '🍔', tags: ['food','time'] },
      solution: { text: 'Delivery Robot',       emoji: '🤖', tags: ['food','time'] },
      category: 'food',
      bizName:  'QuickBite',
      energy: 30
    },
    {
      id: 'grocery',
      problem:  { text: 'Grocery runs waste time', emoji: '🛒', tags: ['food','time'] },
      solution: { text: 'Auto-Reorder App',        emoji: '📱', tags: ['food','time'] },
      category: 'food',
      bizName:  'RefillAI',
      energy: 25
    },
    /* ── transport ─────────────────────────────────────────────── */
    {
      id: 'parking',
      problem:  { text: 'No parking downtown', emoji: '🚗', tags: ['transport','stress'] },
      solution: { text: 'Smart Parking Sensor', emoji: '📡', tags: ['transport','tech'] },
      category: 'transport',
      bizName:  'ParkSense',
      energy: 35
    },
    {
      id: 'commute',
      problem:  { text: 'Slow city commutes',   emoji: '🚌', tags: ['transport','time'] },
      solution: { text: 'E-Scooter Sharing',    emoji: '🛴', tags: ['transport','green'] },
      category: 'transport',
      bizName:  'ZipZoom',
      energy: 30
    },
    /* ── health ────────────────────────────────────────────────── */
    {
      id: 'appointments',
      problem:  { text: 'Hard to book doctor', emoji: '🏥', tags: ['health','access'] },
      solution: { text: 'Telehealth Platform', emoji: '💊', tags: ['health','tech'] },
      category: 'health',
      bizName:  'MediLink',
      energy: 40
    },
    {
      id: 'fitness',
      problem:  { text: 'Gym too expensive',     emoji: '💪', tags: ['health','cost'] },
      solution: { text: 'Home Workout AI',        emoji: '🤸', tags: ['health','tech'] },
      category: 'health',
      bizName:  'FitBrain',
      energy: 30
    },
    /* ── education ─────────────────────────────────────────────── */
    {
      id: 'tutoring',
      problem:  { text: 'Kids struggle with math', emoji: '📚', tags: ['edu','kids'] },
      solution: { text: 'AI Tutor App',            emoji: '🧮', tags: ['edu','tech'] },
      category: 'edu',
      bizName:  'MathMind',
      energy: 35
    },
    {
      id: 'skills',
      problem:  { text: 'No time to learn skills', emoji: '🎓', tags: ['edu','time'] },
      solution: { text: '5-Min Micro-Lessons',     emoji: '⏱', tags: ['edu','time'] },
      category: 'edu',
      bizName:  'SnapSkill',
      energy: 25
    },
    /* ── environment ───────────────────────────────────────────── */
    {
      id: 'plastic',
      problem:  { text: 'Too much plastic waste', emoji: '♻️', tags: ['env','youth'] },
      solution: { text: 'Reusable Box Service',   emoji: '📦', tags: ['env','green'] },
      category: 'env',
      bizName:  'BoxLoop',
      energy: 35
    },
    {
      id: 'energy',
      problem:  { text: 'High electricity bills', emoji: '⚡', tags: ['env','cost'] },
      solution: { text: 'Home Solar Optimizer',   emoji: '☀️', tags: ['env','tech'] },
      category: 'env',
      bizName:  'SolarIQ',
      energy: 40
    },
    /* ── pets ──────────────────────────────────────────────────── */
    {
      id: 'pet',
      problem:  { text: 'Pets lonely when owner travels', emoji: '🐶', tags: ['pets','care'] },
      solution: { text: 'On-Demand Pet Sitter',           emoji: '🐾', tags: ['pets','service'] },
      category: 'pets',
      bizName:  'PawPal',
      energy: 25
    },
  ];

  /* ── Level 2 customer segments (add mismatch risk) ─────────── */
  const SEGMENTS = [
    { label: 'Teen (14-17)',   age: [14,17], budget: [0,20],   icon: '🧑',  id:'teen'   },
    { label: 'College (18-24)',age: [18,24], budget: [5,40],   icon: '🎓',  id:'college'},
    { label: 'Parent (30-45)',  age: [30,45], budget: [20,100], icon: '👨‍👩‍👧', id:'parent' },
    { label: 'Senior (55+)',   age: [55,99], budget: [10,60],  icon: '👴',  id:'senior' },
    { label: 'Startup (25-35)',age: [25,35], budget: [10,200], icon: '🚀',  id:'startup'},
  ];

  /* Problem-segment compatibility: which segment ids go with which category */
  const CAT_SEGS = {
    food:      ['teen','college','parent','startup'],
    transport: ['college','parent','startup'],
    health:    ['parent','senior'],
    edu:       ['teen','college','parent'],
    env:       ['teen','college','startup'],
    pets:      ['parent','senior'],
  };

  /* ── disruptors (Level 2) ───────────────────────────────────── */
  const DISRUPTORS = [
    { id:'patent',  icon:'⚖️',  text: 'Competitor filed a patent! Drain -15 energy.', effect: 'energy', val: -15 },
    { id:'trend',   icon:'📉',  text: 'Market trend shifted! Next match must change category.', effect: 'block', val: 0 },
    { id:'investor',icon:'💼',  text: 'Investor day! Next correct match worth double!',  effect: 'double', val: 0 },
    { id:'pivot',   icon:'🔄',  text: 'Pivot needed! Discard current Problem card.',     effect: 'discard', val: 0 },
  ];

  /* ══════════════════════════════════════════════════════════════
     GAME STATE
  ══════════════════════════════════════════════════════════════ */
  let G = null;
  let _raf = null;

  /* ══════════════════════════════════════════════════════════════
     SCREEN ENTRY
  ══════════════════════════════════════════════════════════════ */
  window.SCREENS.game_ll_idea_incubator = function () {
    G = null;
    cancelAnimationFrame(_raf);
    setTimeout(initGame, 40);
    return `
<div id="iiRoot" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none">

  <!-- Background: holographic grid lines -->
  <canvas id="iiCanvas" style="position:absolute;inset:0;pointer-events:none;opacity:.18"></canvas>

  <!-- Top bar -->
  <div id="iiTopBar" style="position:absolute;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;gap:8px;padding:10px 14px;background:linear-gradient(180deg,rgba(3,4,12,.97) 70%,transparent)">
    <button id="iiBack" style="padding:6px 13px;border:1px solid ${ACC}55;border-radius:8px;background:${ACC}18;color:${ACC2};font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer;flex-shrink:0">← HUB</button>
    <div style="font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.2em;color:${ACC2};flex:1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">IDEA INCUBATOR</div>
    <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.1em;color:rgba(255,255,255,.4)">SCORE</div>
        <div id="iiScore" style="font-family:Orbitron,sans-serif;font-size:.8rem;color:${GOLD}">0</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.1em;color:rgba(255,255,255,.4)">TIME</div>
        <div id="iiTimer" style="font-family:Orbitron,sans-serif;font-size:.9rem;color:#fff">90s</div>
      </div>
    </div>
  </div>

  <!-- Startup Success Meter -->
  <div id="iiMeterRow" style="position:absolute;top:52px;left:14px;right:14px;z-index:9">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
      <span style="font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.14em;color:rgba(255,255,255,.45)">STARTUP SUCCESS METER</span>
      <span id="iiMeterLbl" style="font-family:Orbitron,sans-serif;font-size:.48rem;letter-spacing:.12em;color:${ACC2}">IDEA PILLAR</span>
    </div>
    <div style="height:8px;border-radius:5px;background:rgba(255,255,255,.07);overflow:hidden;border:1px solid ${ACC}33">
      <div id="iiMeterBar" style="height:100%;width:0%;background:linear-gradient(90deg,${ACC},${NEON});border-radius:5px;transition:width .4s"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:.4rem;color:rgba(255,255,255,.3);margin-top:2px;font-family:Orbitron,sans-serif;letter-spacing:.08em">
      <span>0 IDEAS</span>
      <span id="iiGoalLbl">GOAL: 5 MATCHES</span>
    </div>
  </div>

  <!-- Stats row -->
  <div id="iiStats" style="position:absolute;top:95px;left:14px;right:14px;z-index:9;display:flex;gap:8px;align-items:center">
    <div style="display:flex;align-items:center;gap:5px">
      <span style="font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.1em;color:rgba(255,255,255,.4)">ENERGY</span>
      <div style="width:80px;height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden;border:1px solid ${ACC}22">
        <div id="iiEnergy" style="height:100%;width:60%;background:linear-gradient(90deg,${GOOD},#86efac);border-radius:3px;transition:width .35s"></div>
      </div>
    </div>
    <div style="margin-left:auto;display:flex;gap:10px">
      <span style="font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.1em;color:${GOOD}">✓ <span id="iiHits">0</span></span>
      <span style="font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.1em;color:${DANGER}">✗ <span id="iiFails">0</span></span>
      <span style="font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.1em;color:${GOLD}">🔥 <span id="iiCombo">0x</span></span>
    </div>
  </div>

  <!-- Level badge -->
  <div id="iiLvlBadge" style="position:absolute;top:116px;left:14px;z-index:9;font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.14em;color:rgba(255,255,255,.4)">LVL 1 · LEARN</div>

  <!-- Drag ghost -->
  <div id="iiGhost" style="position:fixed;pointer-events:none;z-index:50;display:none;transform:translate(-50%,-50%)"></div>

  <!-- Main play area -->
  <div id="iiPlay" style="position:absolute;top:132px;left:0;right:0;bottom:0;overflow-y:auto;padding:8px 14px 90px"></div>

  <!-- Disruptor banner -->
  <div id="iiDisrupt" style="position:absolute;top:132px;left:50%;transform:translateX(-50%);z-index:25;display:none;min-width:200px;max-width:90vw;text-align:center;border-radius:12px;padding:10px 18px;border:1.5px solid ${GOLD};background:rgba(3,4,12,.94);backdrop-filter:blur(8px);pointer-events:none">
    <div id="iiDisrIcon" style="font-size:1.6rem"></div>
    <div id="iiDisrText" style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.1em;color:${GOLD};margin-top:4px"></div>
  </div>

  <!-- Match feedback flash -->
  <div id="iiFeedback" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:40;pointer-events:none;display:none;font-family:Orbitron,sans-serif;font-size:1.6rem;font-weight:900;text-align:center"></div>

  <!-- End overlay -->
  <div id="iiOver" style="position:absolute;inset:0;z-index:30;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.94);backdrop-filter:blur(6px)"></div>

</div>`;
  };

  /* ══════════════════════════════════════════════════════════════
     EXIT
  ══════════════════════════════════════════════════════════════ */
  window.ll_idea_incubatorExit = function () {
    G = null;
    _drag = null;
    cancelAnimationFrame(_raf);
    /* remove drag listeners that may be live if user exits mid-drag */
    window.removeEventListener('mousemove',  onDragMove);
    window.removeEventListener('mouseup',    onDragEnd);
    window.removeEventListener('touchmove',  onDragMove);
    window.removeEventListener('touchend',   onDragEnd);
    if (window.state) state.viewingWorld = 'risktaker';
    goTo('hub');
  };

  /* ══════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════ */
  function initGame () {
    const root = document.getElementById('iiRoot');
    if (!root) return;

    /* back button */
    document.getElementById('iiBack').onclick = window.ll_idea_incubatorExit;

    /* background canvas grid */
    drawBgGrid();

    startLevel(1);
  }

  /* ── background holographic grid ─────────────────────────────── */
  function drawBgGrid () {
    const canvas = document.getElementById('iiCanvas');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    /* perspective grid */
    ctx.strokeStyle = ACC;
    ctx.lineWidth   = 0.5;
    const step = 40;
    for (let x = 0; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    /* floating orbs */
    const orbCols = [ACC, NEON, GOLD];
    for (let i = 0; i < 6; i++) {
      const ox = Math.random() * W;
      const oy = Math.random() * H;
      const r  = 30 + Math.random() * 60;
      const g  = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
      const c  = orbCols[i % orbCols.length];
      g.addColorStop(0, c + '30');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ══════════════════════════════════════════════════════════════
     LEVEL SETUP
  ══════════════════════════════════════════════════════════════ */
  function startLevel (lvl) {
    cancelAnimationFrame(_raf);
    const cfg = CFG[lvl];

    /* shuffle and pick pairs */
    const pool = shuffle([...ALL_PAIRS]).slice(0, Math.min(cfg.cards + 4, ALL_PAIRS.length));

    G = {
      level:       lvl,
      phase:       'play',
      score:       0,
      hits:        0,
      fails:       0,
      combo:       0,
      maxCombo:    0,
      energy:      60,
      maxEnergy:   100,
      timeLeft:    cfg.time,
      lastTick:    performance.now(),
      need:        cfg.need,
      maxFail:     cfg.maxFail,
      pool:        pool,
      problems:    [],          // active problem card objects
      solutions:   [],          // active solution card objects
      activeProbId:null,        // currently dragged problem id
      doubleNext:  false,
      blockCat:    null,        // must change category (disruptor)
      disruptCooldown: 0,
      startMs:     performance.now(),
    };

    /* update static UI */
    document.getElementById('iiLvlBadge').textContent = `LVL ${lvl} · ${cfg.label}`;
    document.getElementById('iiGoalLbl').textContent  = `GOAL: ${cfg.need} MATCHES`;
    updateHUD();

    /* render initial cards */
    renderCards();

    /* start tick */
    _raf = requestAnimationFrame(tick);
  }

  /* ══════════════════════════════════════════════════════════════
     CARD RENDERING
  ══════════════════════════════════════════════════════════════ */
  function renderCards () {
    const cfg = CFG[G.level];
    const play = document.getElementById('iiPlay');
    if (!play) return;
    play.innerHTML = '';

    /* how many of each type to show */
    const visibleCount = Math.min(cfg.cards, G.pool.length);
    const pairs = G.pool.slice(0, visibleCount);

    /* ── segment panel (Level 2 only) ─────────────────────────── */
    if (G.level === 2) {
      const segRow = document.createElement('div');
      segRow.id = 'iiSegRow';
      segRow.style.cssText = `display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:8px;scrollbar-width:none`;
      const activeSeg = G.activeSeg || pickRandomSeg();
      G.activeSeg = activeSeg;
      SEGMENTS.forEach(seg => {
        const chip = document.createElement('div');
        chip.style.cssText = `flex-shrink:0;padding:5px 10px;border-radius:20px;font-family:Orbitron,sans-serif;font-size:.46rem;letter-spacing:.1em;border:1px solid ${seg.id === activeSeg.id ? ACC : 'rgba(255,255,255,.15)'};background:${seg.id === activeSeg.id ? ACC + '30' : 'rgba(255,255,255,.04)'};color:${seg.id === activeSeg.id ? ACC2 : 'rgba(255,255,255,.5)'};transition:all .2s;cursor:default;white-space:nowrap`;
        chip.textContent = seg.icon + ' ' + seg.label;
        if (seg.id === activeSeg.id) {
          chip.style.boxShadow = `0 0 8px ${ACC}55`;
        }
        segRow.appendChild(chip);
      });
      play.appendChild(segRow);

      /* budget display */
      const budgetBar = document.createElement('div');
      budgetBar.style.cssText = `display:flex;align-items:center;gap:6px;margin-bottom:10px`;
      budgetBar.innerHTML = `<span style="font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.1em;color:rgba(255,255,255,.4)">CUSTOMER BUDGET:</span><span style="font-family:Orbitron,sans-serif;font-size:.6rem;color:${GOLD}">$${activeSeg.budget[0]}–$${activeSeg.budget[1]}/mo</span><span style="font-size:.7rem">${activeSeg.icon}</span>`;
      play.appendChild(budgetBar);
    }

    /* ── instruction hint ─────────────────────────────────────── */
    const hint = document.createElement('div');
    hint.style.cssText = `font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.1em;color:rgba(255,255,255,.3);margin-bottom:8px;text-align:center`;
    hint.textContent = 'DRAG PROBLEM → DROP ON MATCHING SOLUTION';
    play.appendChild(hint);

    /* ── columns: problems on left, solutions on right ─────────── */
    const cols = document.createElement('div');
    cols.style.cssText = `display:grid;grid-template-columns:1fr 1fr;gap:8px`;
    play.appendChild(cols);

    const probCol = document.createElement('div');
    probCol.id = 'iiProbCol';
    probCol.style.cssText = `display:flex;flex-direction:column;gap:7px`;

    const solCol = document.createElement('div');
    solCol.id = 'iiSolCol';
    solCol.style.cssText = `display:flex;flex-direction:column;gap:7px`;

    /* column labels */
    const mkLabel = (txt, col) => {
      const l = document.createElement('div');
      l.style.cssText = `font-family:Orbitron,sans-serif;font-size:.46rem;letter-spacing:.14em;color:${col};margin-bottom:2px;text-align:center`;
      l.textContent = txt;
      return l;
    };
    probCol.appendChild(mkLabel('⚡ PROBLEMS', DANGER));
    solCol.appendChild(mkLabel('💡 SOLUTIONS', GOOD));

    /* shuffle solutions so they don't line up obviously */
    const shuffledSols = shuffle(pairs.map(p => p));

    /* build problem cards */
    G.problems = pairs.map(pair => ({ ...pair, matched: false }));
    G.solutions = shuffledSols.map(pair => ({ ...pair, matched: false }));

    G.problems.forEach(prob => {
      const el = buildProbCard(prob);
      probCol.appendChild(el);
    });

    G.solutions.forEach(sol => {
      const el = buildSolCard(sol);
      solCol.appendChild(el);
    });

    cols.appendChild(probCol);
    cols.appendChild(solCol);
  }

  /* ── pick a random segment ───────────────────────────────────── */
  function pickRandomSeg () {
    return SEGMENTS[Math.floor(Math.random() * SEGMENTS.length)];
  }

  /* ── build a problem card ─────────────────────────────────────── */
  function buildProbCard (prob) {
    const el = document.createElement('div');
    el.id   = 'prob_' + prob.id;
    el.dataset.id = prob.id;
    el.style.cssText = `
      background: linear-gradient(135deg, rgba(239,68,68,.12), rgba(239,68,68,.06));
      border: 1.5px solid rgba(239,68,68,.35);
      border-radius: 10px;
      padding: 10px 10px;
      cursor: grab;
      transition: border-color .2s, box-shadow .2s, opacity .3s;
      touch-action: none;
      min-height: 60px;
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    `;
    el.innerHTML = `
      <span style="font-size:1.4rem;flex-shrink:0">${prob.problem.emoji}</span>
      <div>
        <div style="font-size:.7rem;font-weight:600;line-height:1.3">${prob.problem.text}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.38rem;letter-spacing:.1em;color:rgba(255,255,255,.35);margin-top:2px">${prob.category.toUpperCase()}</div>
      </div>
    `;

    /* drag events */
    el.addEventListener('mousedown',  e => onProbDragStart(e, prob.id));
    el.addEventListener('touchstart', e => onProbDragStart(e, prob.id), { passive: false });

    return el;
  }

  /* ── build a solution card ─────────────────────────────────────── */
  function buildSolCard (sol) {
    const el = document.createElement('div');
    el.id   = 'sol_' + sol.id;
    el.dataset.id = sol.id;
    el.style.cssText = `
      background: linear-gradient(135deg, rgba(34,197,94,.1), rgba(34,197,94,.04));
      border: 1.5px solid rgba(34,197,94,.3);
      border-radius: 10px;
      padding: 10px 10px;
      transition: border-color .2s, box-shadow .2s, opacity .3s;
      touch-action: none;
      min-height: 60px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    el.innerHTML = `
      <span style="font-size:1.4rem;flex-shrink:0">${sol.solution.emoji}</span>
      <div>
        <div style="font-size:.7rem;font-weight:600;line-height:1.3">${sol.solution.text}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.38rem;letter-spacing:.1em;color:rgba(255,255,255,.35);margin-top:2px">${sol.category.toUpperCase()}</div>
      </div>
    `;
    return el;
  }

  /* ══════════════════════════════════════════════════════════════
     DRAG + DROP
  ══════════════════════════════════════════════════════════════ */
  let _drag = null; // { probId, startX, startY, ox, oy }

  function onProbDragStart (e, probId) {
    if (!G || G.phase !== 'play') return;
    const prob = G.problems.find(p => p.id === probId);
    if (!prob || prob.matched) return;

    e.preventDefault();
    const { clientX, clientY } = getXY(e);

    /* highlight dragged card */
    const el = document.getElementById('prob_' + probId);
    if (el) {
      el.style.opacity     = '0.5';
      el.style.borderColor = ACC;
      el.style.boxShadow   = `0 0 14px ${ACC}66`;
    }

    /* show ghost */
    const ghost = document.getElementById('iiGhost');
    ghost.style.display = 'block';
    ghost.style.left    = clientX + 'px';
    ghost.style.top     = clientY + 'px';
    ghost.innerHTML = `<div style="background:${ACC}ee;border:1.5px solid ${ACC2};border-radius:10px;padding:8px 12px;font-size:.8rem;box-shadow:0 0 18px ${ACC}88;pointer-events:none;white-space:nowrap">${prob.problem.emoji} ${prob.problem.text}</div>`;

    _drag = { probId, clientX, clientY };
    G.activeProbId = probId;

    /* highlight valid drop zones */
    G.solutions.forEach(sol => {
      if (sol.matched) return;
      const selEl = document.getElementById('sol_' + sol.id);
      if (selEl) {
        selEl.style.borderColor = `${ACC}99`;
        selEl.style.boxShadow   = `0 0 10px ${ACC}44`;
      }
    });

    window.addEventListener('mousemove',  onDragMove);
    window.addEventListener('mouseup',    onDragEnd);
    window.addEventListener('touchmove',  onDragMove, { passive: false });
    window.addEventListener('touchend',   onDragEnd);
  }

  function onDragMove (e) {
    e.preventDefault();
    const { clientX, clientY } = getXY(e);
    const ghost = document.getElementById('iiGhost');
    if (ghost) {
      ghost.style.left = clientX + 'px';
      ghost.style.top  = clientY + 'px';
    }
  }

  function onDragEnd (e) {
    window.removeEventListener('mousemove',  onDragMove);
    window.removeEventListener('mouseup',    onDragEnd);
    window.removeEventListener('touchmove',  onDragMove);
    window.removeEventListener('touchend',   onDragEnd);

    const ghost = document.getElementById('iiGhost');
    if (ghost) ghost.style.display = 'none';

    if (!_drag || !G || G.phase !== 'play') { _drag = null; return; }

    /* restore dragged card */
    const probEl = document.getElementById('prob_' + _drag.probId);
    if (probEl) {
      probEl.style.opacity     = '1';
      probEl.style.borderColor = '';
      probEl.style.boxShadow   = '';
    }

    /* clear sol highlights */
    G.solutions.forEach(sol => {
      const selEl = document.getElementById('sol_' + sol.id);
      if (selEl && !sol.matched) {
        selEl.style.borderColor = '';
        selEl.style.boxShadow   = '';
      }
    });

    /* find drop target */
    const { clientX, clientY } = getXY(e);
    const dropTarget = findDropTarget(clientX, clientY);

    if (dropTarget) {
      resolveMatch(_drag.probId, dropTarget);
    }

    _drag = null;
    G.activeProbId = null;
  }

  function findDropTarget (x, y) {
    if (!G) return null;
    for (const sol of G.solutions) {
      if (sol.matched) continue;
      const el = document.getElementById('sol_' + sol.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return sol.id;
      }
    }
    return null;
  }

  function getXY (e) {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }

  /* ══════════════════════════════════════════════════════════════
     MATCH RESOLUTION
  ══════════════════════════════════════════════════════════════ */
  function resolveMatch (probId, solId) {
    if (!G) return;
    const prob = G.problems.find(p => p.id === probId);
    const sol  = G.solutions.find(s => s.id === solId);
    if (!prob || !sol || prob.matched || sol.matched) return;

    let correct = (probId === solId);

    /* Level 2: check segment compatibility */
    if (G.level === 2 && correct && G.activeSeg) {
      const compatSegs = CAT_SEGS[prob.category] || [];
      if (!compatSegs.includes(G.activeSeg.id)) {
        correct = false; /* demographic mismatch */
      }
      /* check block category disruptor */
      if (G.blockCat && prob.category === G.blockCat) {
        correct = false;
        G.blockCat = null;
        flashFeedback('📉 TREND BLOCK!', DANGER, false);
        return;
      }
    }

    if (correct) {
      onCorrectMatch(prob, sol);
    } else {
      onWrongMatch(prob, sol);
    }
  }

  function onCorrectMatch (prob, sol) {
    prob.matched = true;
    sol.matched  = true;
    G.hits++;
    G.combo++;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;

    let energy = prob.energy || 30;
    let pts    = 100;

    if (G.doubleNext) {
      energy     *= 2;
      pts        *= 2;
      G.doubleNext = false;
      flashFeedback('💼 DOUBLE SCORE!', GOLD, true);
    }

    /* combo bonus */
    if (G.combo >= 3) {
      pts  += 50 * (G.combo - 2);
      energy += 10;
    }

    G.energy  = Math.min(G.maxEnergy, G.energy + energy * 0.4);
    G.score  += pts;

    /* animate matched cards */
    animateCard('prob_' + prob.id, true);
    animateCard('sol_'  + sol.id,  true);

    /* combo flash */
    if (G.combo >= 3) {
      flashFeedback(`🔥 ${G.combo}x COMBO!`, GOLD, true);
    } else {
      flashFeedback('✅ ' + prob.bizName + ' LAUNCHED!', GOOD, true);
    }

    updateHUD();

    /* refill card pool if needed */
    setTimeout(() => {
      removeCard('prob_' + prob.id);
      removeCard('sol_'  + sol.id);
      refillCards();
      checkWin();
    }, 600);
  }

  function onWrongMatch (prob, sol) {
    G.fails++;
    G.combo = 0;
    G.energy = Math.max(0, G.energy - 20);
    G.score  = Math.max(0, G.score - 25);

    animateCard('prob_' + prob.id, false);
    animateCard('sol_'  + sol.id,  false);

    /* Level 2: demographic mismatch message */
    if (G.level === 2 && prob.id === sol.id && G.activeSeg) {
      flashFeedback(`❌ WRONG SEGMENT!`, DANGER, false);
    } else {
      flashFeedback('❌ FAILED IDEA!', DANGER, false);
    }

    updateHUD();
    setTimeout(() => checkLose(), 300);
  }

  /* ── card animation ──────────────────────────────────────────── */
  function animateCard (id, success) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.transition    = 'all .4s';
    el.style.borderColor   = success ? GOOD  : DANGER;
    el.style.boxShadow     = success ? `0 0 18px ${GOOD}88` : `0 0 18px ${DANGER}88`;
    el.style.transform     = success ? 'scale(1.04)' : 'scale(0.96)';
    el.style.opacity       = '0.6';
  }

  function removeCard (id) {
    const el = document.getElementById(id);
    if (el) {
      el.style.transition = 'all .3s';
      el.style.opacity    = '0';
      el.style.height     = '0';
      el.style.padding    = '0';
      el.style.margin     = '0';
      setTimeout(() => el.remove(), 320);
    }
  }

  /* ── refill cards ────────────────────────────────────────────── */
  function refillCards () {
    if (!G) return;
    const cfg = CFG[G.level];
    const unmatchedProbs = G.problems.filter(p => !p.matched);
    const unmatchedSols  = G.solutions.filter(s => !s.matched);

    /* how many new pairs to add */
    const needed = cfg.cards - unmatchedProbs.length;
    if (needed <= 0) return;

    /* draw from remaining pool (not yet used) */
    const usedIds    = new Set(G.problems.map(p => p.id));
    const available  = ALL_PAIRS.filter(p => !usedIds.has(p.id));
    const newPairs   = shuffle(available).slice(0, needed);

    const probCol = document.getElementById('iiProbCol');
    const solCol  = document.getElementById('iiSolCol');
    if (!probCol || !solCol) return;

    newPairs.forEach(pair => {
      const pObj = { ...pair, matched: false };
      const sObj = { ...pair, matched: false };
      G.problems.push(pObj);
      G.solutions.push(sObj);

      /* insert prob card */
      const pEl = buildProbCard(pObj);
      pEl.style.opacity   = '0';
      pEl.style.transform = 'translateY(10px)';
      probCol.appendChild(pEl);
      requestAnimationFrame(() => {
        pEl.style.transition = 'all .35s';
        pEl.style.opacity    = '1';
        pEl.style.transform  = 'none';
      });

      /* insert sol card (shuffled into random position) */
      const sEl = buildSolCard(sObj);
      sEl.style.opacity   = '0';
      sEl.style.transform = 'translateY(10px)';
      const idx = Math.floor(Math.random() * (solCol.children.length + 1));
      const ref = solCol.children[idx] || null;
      solCol.insertBefore(sEl, ref);
      requestAnimationFrame(() => {
        sEl.style.transition = 'all .35s';
        sEl.style.opacity    = '1';
        sEl.style.transform  = 'none';
      });
    });

    /* Level 2: rotate segment occasionally */
    if (G.level === 2 && G.hits > 0 && G.hits % 2 === 0) {
      G.activeSeg = pickRandomSeg();
      const segRow = document.getElementById('iiSegRow');
      if (segRow) {
        Array.from(segRow.children).forEach((chip, i) => {
          const seg = SEGMENTS[i];
          const active = seg && seg.id === G.activeSeg.id;
          chip.style.borderColor  = active ? ACC : 'rgba(255,255,255,.15)';
          chip.style.background   = active ? ACC + '30' : 'rgba(255,255,255,.04)';
          chip.style.color        = active ? ACC2 : 'rgba(255,255,255,.5)';
          chip.style.boxShadow    = active ? `0 0 8px ${ACC}55` : 'none';
        });
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     DISRUPTORS (Level 2)
  ══════════════════════════════════════════════════════════════ */
  function triggerDisruptor () {
    if (!G || G.phase !== 'play') return;
    const d = DISRUPTORS[Math.floor(Math.random() * DISRUPTORS.length)];

    const banner = document.getElementById('iiDisrupt');
    document.getElementById('iiDisrIcon').textContent = d.icon;
    document.getElementById('iiDisrText').textContent = d.text;
    banner.style.display = 'block';

    switch (d.effect) {
      case 'energy':
        G.energy = Math.max(0, G.energy + d.val);
        updateHUD();
        break;
      case 'double':
        G.doubleNext = true;
        break;
      case 'block': {
        /* block random category for next match */
        const cats = [...new Set(G.problems.filter(p => !p.matched).map(p => p.category))];
        if (cats.length) G.blockCat = cats[Math.floor(Math.random() * cats.length)];
        break;
      }
      case 'discard': {
        const unmatched = G.problems.filter(p => !p.matched);
        if (unmatched.length > 0) {
          const target = unmatched[Math.floor(Math.random() * unmatched.length)];
          target.matched = true;
          removeCard('prob_' + target.id);
          setTimeout(refillCards, 400);
        }
        break;
      }
    }

    setTimeout(() => { banner.style.display = 'none'; }, 3000);
    G.disruptCooldown = G.level === 2 ? 18 : 999;
  }

  /* ══════════════════════════════════════════════════════════════
     HUD UPDATE
  ══════════════════════════════════════════════════════════════ */
  function updateHUD () {
    if (!G) return;
    const cfg = CFG[G.level];

    /* score */
    const scoreEl = document.getElementById('iiScore');
    if (scoreEl) scoreEl.textContent = G.score;

    /* timer */
    const timerEl = document.getElementById('iiTimer');
    if (timerEl) {
      timerEl.textContent = Math.ceil(G.timeLeft) + 's';
      timerEl.style.color = G.timeLeft <= 10 ? DANGER : G.timeLeft <= 20 ? GOLD : '#fff';
    }

    /* meter bar */
    const pct = Math.min(100, (G.hits / cfg.need) * 100);
    const bar = document.getElementById('iiMeterBar');
    if (bar) bar.style.width = pct + '%';

    /* energy bar */
    const engEl = document.getElementById('iiEnergy');
    if (engEl) {
      const ePct = Math.max(0, Math.min(100, (G.energy / G.maxEnergy) * 100));
      engEl.style.width      = ePct + '%';
      engEl.style.background = ePct < 25 ? `linear-gradient(90deg,${DANGER},#fca5a5)` : `linear-gradient(90deg,${GOOD},#86efac)`;
    }

    /* hits / fails / combo */
    const hEl = document.getElementById('iiHits');
    const fEl = document.getElementById('iiFails');
    const cEl = document.getElementById('iiCombo');
    if (hEl) hEl.textContent = G.hits;
    if (fEl) fEl.textContent = G.fails;
    if (cEl) {
      cEl.textContent = G.combo + 'x';
      cEl.style.color = G.combo >= 3 ? GOLD : 'rgba(255,255,255,.4)';
    }
  }

  /* ── feedback flash ─────────────────────────────────────────── */
  function flashFeedback (text, color, success) {
    const el = document.getElementById('iiFeedback');
    if (!el) return;
    el.textContent    = text;
    el.style.color    = color;
    el.style.display  = 'block';
    el.style.opacity  = '1';
    el.style.transform = 'translate(-50%,-50%) scale(1)';
    el.style.textShadow = `0 0 24px ${color}`;
    el.style.transition = 'none';
    setTimeout(() => {
      el.style.transition = 'all .5s';
      el.style.opacity    = '0';
      el.style.transform  = `translate(-50%,-60%) scale(${success ? 1.15 : 0.9})`;
    }, 700);
    setTimeout(() => { el.style.display = 'none'; }, 1300);
  }

  /* ══════════════════════════════════════════════════════════════
     WIN / LOSE CHECKS
  ══════════════════════════════════════════════════════════════ */
  function checkWin () {
    if (!G || G.phase !== 'play') return;
    const cfg = CFG[G.level];
    if (G.hits >= cfg.need) {
      G.phase = 'over';
      G.won   = true;
      const stars = calcStars();
      setTimeout(() => endGame(stars), 400);
    }
  }

  function checkLose () {
    if (!G || G.phase !== 'play') return;
    const cfg = CFG[G.level];
    if (G.fails >= cfg.maxFail || G.energy <= 0) {
      G.phase = 'over';
      G.won   = false;
      const stars = G.hits > 0 ? 1 : 0;
      setTimeout(() => endGame(stars), 400);
    }
  }

  function calcStars () {
    const cfg = CFG[G.level];
    const s3  = G.level === 1 ? STAR3_L1 : STAR3_L2;
    const s2  = G.level === 1 ? STAR2_L1 : STAR2_L2;
    if (G.hits >= s3 && G.fails === 0)     return 3;
    if (G.hits >= s3)                       return 2;
    if (G.hits >= s2)                       return 2;
    if (G.hits > 0)                         return 1;
    return 1;
  }

  /* ══════════════════════════════════════════════════════════════
     GAME LOOP
  ══════════════════════════════════════════════════════════════ */
  function tick (now) {
    if (!G || G.phase !== 'play') return;

    const dt = (now - G.lastTick) / 1000;
    G.lastTick = now;

    /* countdown */
    G.timeLeft -= dt;
    if (G.timeLeft <= 0) {
      G.timeLeft = 0;
      G.phase    = 'over';
      G.won      = G.hits >= CFG[G.level].need;
      const stars = G.hits >= (G.level === 1 ? STAR3_L1 : STAR3_L2) ? 3
                  : G.hits >= (G.level === 1 ? STAR2_L1 : STAR2_L2) ? 2
                  : G.hits > 0 ? 1 : 0;
      updateHUD();
      if (stars > 0) endGame(stars);
      else           endGame(1);
      return;
    }

    /* disruptor cooldown (Level 2) */
    if (G.level === 2) {
      G.disruptCooldown -= dt;
      if (G.disruptCooldown <= 0) {
        triggerDisruptor();
      }
    }

    /* energy passive drain */
    G.energy = Math.max(0, G.energy - dt * 0.8);
    if (G.energy <= 0 && G.phase === 'play') {
      G.phase = 'over';
      G.won   = false;
      endGame(1);
      return;
    }

    updateHUD();
    _raf = requestAnimationFrame(tick);
  }

  /* ══════════════════════════════════════════════════════════════
     END GAME
  ══════════════════════════════════════════════════════════════ */
  function endGame (stars) {
    if (!G) return;
    cancelAnimationFrame(_raf);

    stars = Math.max(1, Math.min(3, stars));
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ll_idea_incubator', { stars, level: G.level, badge: 'Inventor Badge', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    /* emit service event */
    const durationMs = performance.now() - (G.startMs || 0);
    const accuracyPct = G.hits + G.fails > 0 ? Math.round((G.hits / (G.hits + G.fails)) * 100) : 0;
    try {
      if (window.StartupRewardsService) {
        window.StartupRewardsService.submit({
          gameId:       'idea_incubator',
          level:        G.level,
          score:        G.score,
          accuracyPct,
          durationMs,
          mistakes:     G.fails,
          pillar:       'idea',
          successDelta: G.hits
        });
      }
    } catch (_) {}

    const won      = G.won;
    const scoreVal = G.score;
    const hits     = G.hits;
    const fails    = G.fails;
    const combo    = G.maxCombo;
    const level    = G.level;

    const el = document.getElementById('iiOver');
    if (!el) return;

    const starHTML  = '⭐'.repeat(stars);
    const titleText = !won ? '⏱ TIME\'S UP!'
                    : stars === 3 ? '🚀 UNICORN FOUNDER!'
                    : stars === 2 ? '✅ STARTUP LAUNCHED!'
                    : '💡 IDEAS SPARKED!';

    const comboBonus = combo >= 3 ? `<div style="background:rgba(251,191,36,.12);border:1px solid ${GOLD}44;border-radius:10px;padding:8px 14px;margin-top:4px"><div style="font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.12em;color:${GOLD}">IDEA COMBO BONUS</div><div style="font-family:Orbitron,sans-serif;font-size:1rem;color:${GOLD}">🔥 ${combo}x STREAK</div></div>` : '';

    const badgeHTML = stars === 3 ? `<div style="background:rgba(124,58,237,.18);border:1px solid ${ACC}44;border-radius:10px;padding:8px 14px;margin-top:4px"><div style="font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.12em;color:${ACC2}">BADGE UNLOCKED</div><div style="font-size:.8rem;margin-top:2px">🏆 Inventor Badge</div></div>` : '';

    el.innerHTML = `
      <div style="max-width:380px;width:92%;text-align:center;border:1.5px solid ${ACC}88;border-radius:18px;padding:28px 20px;background:linear-gradient(160deg,rgba(10,5,22,.98),rgba(18,8,40,.98));box-shadow:0 0 40px ${ACC}33;overflow-y:auto;max-height:90vh">
        <div style="font-family:Orbitron,sans-serif;font-size:.56rem;letter-spacing:.24em;color:${ACC2};margin-bottom:10px">IDEA INCUBATOR</div>
        <div style="font-size:1.4rem;font-weight:800;color:#fff;margin-bottom:4px">${titleText}</div>
        <div style="font-size:2rem;margin:12px 0;letter-spacing:3px">${starHTML}</div>

        <div style="display:flex;gap:8px;justify-content:center;margin:12px 0;flex-wrap:wrap">
          <div style="background:rgba(124,58,237,.18);border:1px solid ${ACC}44;border-radius:10px;padding:8px 14px">
            <div style="font-family:Orbitron,sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.4);margin-bottom:3px">SCORE</div>
            <div style="font-family:Orbitron,sans-serif;font-size:1.3rem;color:${GOLD}">${scoreVal}</div>
          </div>
          <div style="background:rgba(34,197,94,.1);border:1px solid ${GOOD}44;border-radius:10px;padding:8px 14px">
            <div style="font-family:Orbitron,sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.4);margin-bottom:3px">COINS</div>
            <div style="font-family:Orbitron,sans-serif;font-size:1.3rem;color:${GOOD}">+${coins}</div>
          </div>
          <div style="background:rgba(239,68,68,.08);border:1px solid ${DANGER}33;border-radius:10px;padding:8px 14px">
            <div style="font-family:Orbitron,sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.4);margin-bottom:3px">ACCURACY</div>
            <div style="font-family:Orbitron,sans-serif;font-size:1.3rem;color:${accuracyPct >= 70 ? GOOD : DANGER}">${accuracyPct}%</div>
          </div>
        </div>

        <div style="display:flex;gap:6px;justify-content:center;margin-bottom:10px">
          <div style="font-family:Orbitron,sans-serif;font-size:.5rem;color:${GOOD}">✓ ${hits} MATCHES</div>
          <div style="font-family:Orbitron,sans-serif;font-size:.5rem;color:rgba(255,255,255,.3)">·</div>
          <div style="font-family:Orbitron,sans-serif;font-size:.5rem;color:${DANGER}">✗ ${fails} FAILED</div>
        </div>

        ${comboBonus}
        ${badgeHTML}

        <div style="background:rgba(124,58,237,.1);border:1px solid ${ACC}33;border-radius:12px;padding:14px;margin:14px 0;text-align:left">
          <div style="font-family:Orbitron,sans-serif;font-size:.46rem;letter-spacing:.14em;color:${ACC2};margin-bottom:6px">LESSON</div>
          <div style="font-size:.8rem;line-height:1.6;color:#cbd5e1">Great businesses start by solving real problems. Matching the right solution to the right customer need is the foundation of every successful startup — that is called <strong>product-market fit</strong>. Get that right and everything else follows.</div>
        </div>

        ${level === 1 && won ? `<div style="margin-bottom:10px"><button id="iiLevel2Btn" style="padding:10px 20px;border-radius:10px;border:1.5px solid ${GOLD};background:rgba(251,191,36,.15);color:${GOLD};font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.12em;cursor:pointer">▶ LEVEL 2: MASTER</button></div>` : ''}

        <div style="display:flex;gap:8px;justify-content:center;margin-top:4px">
          <button id="iiPlayAgain" style="padding:10px 18px;border-radius:10px;border:1.5px solid ${ACC}66;background:${ACC}22;color:${ACC2};font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.12em;cursor:pointer">↺ PLAY AGAIN</button>
          <button id="iiGoHub" style="padding:10px 18px;border-radius:10px;border:1.5px solid rgba(124,58,237,.35);background:rgba(124,58,237,.1);color:rgba(167,139,250,.7);font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.12em;cursor:pointer">← HUB</button>
        </div>
      </div>`;

    el.style.display = 'flex';

    /* button handlers */
    const paBtn = document.getElementById('iiPlayAgain');
    if (paBtn) paBtn.onclick = () => {
      el.style.display = 'none';
      startLevel(level);
    };

    const hubBtn = document.getElementById('iiGoHub');
    if (hubBtn) hubBtn.onclick = window.ll_idea_incubatorExit;

    const l2Btn = document.getElementById('iiLevel2Btn');
    if (l2Btn) l2Btn.onclick = () => {
      el.style.display = 'none';
      startLevel(2);
    };
  }

  /* ══════════════════════════════════════════════════════════════
     UTILS
  ══════════════════════════════════════════════════════════════ */
  function shuffle (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

})();
