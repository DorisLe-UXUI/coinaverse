/* ════════════════════════════════════════════════════════════════
   EFFICIENCY LAB · Budgetron Base — Strategist Hub
   Resource-management puzzle: route tasks through conveyor belts,
   assign robot assistants, optimize Money + Time + Energy usage.
   Level 1 (Learn): 5 tasks, comfortable budgets, no disruptions.
   Level 2 (Master): 12 tasks + live disruptive events.
   Screen ID : game_bud_efflab
   Hub       : strategist (#1a2a4a)
   Exit fn   : window.bud_efflabExit
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── palette ───────────────────────────────────────────────── */
  const BG      = '#03040c';
  const ACCENT  = '#1a2a4a';
  const AMBER   = '#f5a623';
  const AMBER2  = '#ffcc70';
  const CYAN    = '#00e5ff';
  const GREEN   = '#22d3a5';
  const RED     = '#ef4444';
  const GOLD    = '#f5c842';
  const PURPLE  = '#a78bfa';
  const DARK    = '#0a1120';

  /* ── conveyor belt slots ───────────────────────────────────── */
  const BELT_SLOTS = 5;  // visible queue slots

  /* ── task catalogue ────────────────────────────────────────── */
  // Each task: money delta (+earn / -cost), time cost, energy delta
  // Positive money = earn. Negative money = spend.
  // Time is always a cost (positive = more time consumed).
  // Energy positive = restore. Negative = drain.
  const ALL_TASKS = [
    { id:'work',      label:'Go to Work',      emoji:'💼', time:8,  money:+120, energy:-30, required:true  },
    { id:'cook',      label:'Cook Dinner',      emoji:'🍳', time:2,  money:-15,  energy:+20, required:true  },
    { id:'study',     label:'Study',            emoji:'📚', time:3,  money:0,    energy:-25, required:false },
    { id:'exercise',  label:'Exercise',         emoji:'🏋️', time:1,  money:-5,   energy:+35, required:false },
    { id:'bills',     label:'Pay Bills',        emoji:'💳', time:1,  money:-80,  energy:-5,  required:true  },
    { id:'shop',      label:'Grocery Shop',     emoji:'🛒', time:2,  money:-60,  energy:-10, required:true  },
    { id:'sleep',     label:'Sleep',            emoji:'😴', time:8,  money:0,    energy:+60, required:false },
    { id:'commute',   label:'Commute',          emoji:'🚌', time:2,  money:-10,  energy:-15, required:false },
    { id:'sidejob',   label:'Side Job',         emoji:'💻', time:3,  money:+50,  energy:-20, required:false },
    { id:'laundry',   label:'Do Laundry',       emoji:'👕', time:2,  money:-5,   energy:-10, required:false },
    { id:'medappt',   label:'Doctor Visit',     emoji:'🏥', time:3,  money:-40,  energy:-5,  required:false },
    { id:'socialize', label:'Hang with Friends',emoji:'👥', time:2,  money:-20,  energy:+15, required:false },
    { id:'bank',      label:'Bank Errand',      emoji:'🏦', time:1,  money:+10,  energy:-5,  required:false },
    { id:'repairs',   label:'Home Repairs',     emoji:'🔧', time:3,  money:-70,  energy:-20, required:false },
    { id:'overtime',  label:'Overtime',         emoji:'⏰', time:4,  money:+90,  energy:-40, required:false },
  ];

  /* ── level configs ─────────────────────────────────────────── */
  const LEVEL1_IDS  = ['work','cook','bills','shop','exercise'];
  const LEVEL2_IDS  = ['work','cook','bills','shop','study','sidejob','commute','laundry','sleep','socialize','bank','repairs'];

  // Starting resources
  const L1_RESOURCES = { money: 300, time: 24, energy: 100 };
  const L2_RESOURCES = { money: 250, time: 24, energy: 80 };

  // Star thresholds: efficiency = resources remaining / starting resources (avg %)
  const STAR3_THRESHOLD = 0.50;  // at least 50% of any single resource above 50%
  const STAR2_THRESHOLD = 0.20;  // at least 20% of resources remain

  /* ── disruptive events (Level 2) ───────────────────────────── */
  const EVENTS = [
    {
      id:'traffic',
      label:'🚦 Traffic Jam!',
      desc:'Commute & work tasks cost +3 extra Time.',
      color: '#ff9800',
      apply: (task, G) => {
        if (task.id === 'commute' || task.id === 'work') return { time: task.time + 3 };
        return null;
      },
      duration: 2,  // lasts 2 tasks
    },
    {
      id:'outage',
      label:'💡 Power Outage!',
      desc:'Study, Sidejob & Laundry are disabled for 1 task.',
      color: '#ffd600',
      disables: ['study','sidejob','laundry'],
      duration: 1,
    },
    {
      id:'emergency',
      label:'🚨 Family Emergency!',
      desc:'A mandatory Doctor Visit has been injected into your queue!',
      color: RED,
      injectTask: 'medappt',
      duration: 0,
    },
    {
      id:'overtime',
      label:'💰 Overtime Offer!',
      desc:'Overtime task added — earns +90 Money but costs -40 Energy.',
      color: GREEN,
      injectTask: 'overtime',
      duration: 0,
    },
  ];

  /* ── state ─────────────────────────────────────────────────── */
  let G = null;

  /* ── screen registration ───────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_bud_efflab = function () {
    G = null;
    setTimeout(initGame, 40);
    return `
<div id="ef_root" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none">

  <!-- ambient grid canvas -->
  <canvas id="ef_canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.4"></canvas>

  <!-- conveyor glow strips -->
  <div id="ef_belts_bg" style="position:absolute;inset:0;pointer-events:none"></div>

  <!-- ═══ TOP BAR ═══ -->
  <div id="ef_topbar" style="
    position:absolute;top:0;left:0;right:0;z-index:30;
    display:flex;align-items:center;gap:8px;
    padding:8px 12px;
    background:linear-gradient(180deg,rgba(0,0,0,.9) 0%,transparent 100%);
    border-bottom:1px solid rgba(245,166,35,.15);
  ">
    <button id="ef_back_btn" onclick="window.bud_efflabExit()" style="
      padding:5px 11px;border:1px solid rgba(245,166,35,.4);border-radius:8px;
      background:rgba(245,166,35,.08);color:${AMBER};
      font-family:Orbitron,sans-serif;font-size:.52rem;letter-spacing:.14em;cursor:pointer;
      flex-shrink:0;transition:background .15s;
    " onmouseover="this.style.background='rgba(245,166,35,.2)'" onmouseout="this.style.background='rgba(245,166,35,.08)'">← HUB</button>

    <div style="font-family:Orbitron,sans-serif;font-size:.68rem;letter-spacing:.18em;color:${AMBER};flex:1;text-align:center;text-shadow:0 0 12px ${AMBER}66;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
      EFFICIENCY LAB
    </div>

    <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:#666;letter-spacing:.1em">SCORE</div>
        <div id="ef_score" style="font-family:Orbitron,sans-serif;font-size:.82rem;color:${GOLD};font-variant-numeric:tabular-nums;text-shadow:0 0 8px ${GOLD}66">0</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:#666;letter-spacing:.1em">LEVEL</div>
        <div id="ef_level" style="font-family:Orbitron,sans-serif;font-size:.82rem;color:${AMBER}">1</div>
      </div>
    </div>
  </div>

  <!-- ═══ RESOURCE METERS ═══ -->
  <div id="ef_meters" style="
    position:absolute;top:50px;left:0;right:0;z-index:28;
    display:flex;gap:6px;padding:8px 12px;
    background:rgba(3,4,12,.85);
    border-bottom:1px solid rgba(245,166,35,.1);
  ">
    <!-- Money -->
    <div style="flex:1">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <span style="font-family:Orbitron,sans-serif;font-size:.46rem;color:${GREEN};letter-spacing:.1em">💰 MONEY</span>
        <span id="ef_money_val" style="font-family:Orbitron,sans-serif;font-size:.55rem;color:${GREEN};font-variant-numeric:tabular-nums">$300</span>
      </div>
      <div style="height:7px;border-radius:4px;background:rgba(255,255,255,.07);overflow:hidden">
        <div id="ef_money_bar" style="height:100%;border-radius:4px;background:linear-gradient(90deg,${GREEN},#6bffde);transition:width .4s ease;width:100%"></div>
      </div>
    </div>
    <!-- Time -->
    <div style="flex:1">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <span style="font-family:Orbitron,sans-serif;font-size:.46rem;color:${CYAN};letter-spacing:.1em">⏱ TIME</span>
        <span id="ef_time_val" style="font-family:Orbitron,sans-serif;font-size:.55rem;color:${CYAN};font-variant-numeric:tabular-nums">24h</span>
      </div>
      <div style="height:7px;border-radius:4px;background:rgba(255,255,255,.07);overflow:hidden">
        <div id="ef_time_bar" style="height:100%;border-radius:4px;background:linear-gradient(90deg,${CYAN},#b2f0ff);transition:width .4s ease;width:100%"></div>
      </div>
    </div>
    <!-- Energy -->
    <div style="flex:1">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <span style="font-family:Orbitron,sans-serif;font-size:.46rem;color:${AMBER};letter-spacing:.1em">⚡ ENERGY</span>
        <span id="ef_energy_val" style="font-family:Orbitron,sans-serif;font-size:.55rem;color:${AMBER};font-variant-numeric:tabular-nums">100</span>
      </div>
      <div style="height:7px;border-radius:4px;background:rgba(255,255,255,.07);overflow:hidden">
        <div id="ef_energy_bar" style="height:100%;border-radius:4px;background:linear-gradient(90deg,${AMBER},${AMBER2});transition:width .4s ease;width:100%"></div>
      </div>
    </div>
  </div>

  <!-- ═══ EVENT BANNER ═══ -->
  <div id="ef_event_banner" style="
    position:absolute;top:112px;left:12px;right:12px;z-index:29;
    display:none;
    border-radius:10px;padding:8px 12px;
    border:1px solid;
  ">
    <div style="display:flex;align-items:center;gap:8px">
      <div id="ef_event_icon" style="font-size:1rem"></div>
      <div>
        <div id="ef_event_title" style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.1em"></div>
        <div id="ef_event_desc" style="font-size:.62rem;color:#bbb;margin-top:2px"></div>
      </div>
      <div id="ef_event_turns" style="margin-left:auto;font-family:Orbitron,sans-serif;font-size:.5rem;color:#888"></div>
    </div>
  </div>

  <!-- ═══ MAIN LAYOUT: Task Pool + Belt + Done ═══ -->
  <div id="ef_layout" style="
    position:absolute;top:130px;left:0;right:0;bottom:0;
    display:flex;flex-direction:column;
    gap:0;
    overflow:hidden;
  ">

    <!-- TASK POOL (available tasks) -->
    <div style="padding:6px 12px 0">
      <div style="font-family:Orbitron,sans-serif;font-size:.46rem;color:#555;letter-spacing:.14em;margin-bottom:5px">
        TASK POOL — drag to queue
      </div>
      <div id="ef_pool" style="
        display:flex;flex-wrap:wrap;gap:5px;
        min-height:70px;max-height:130px;overflow-y:auto;
        padding:4px 0;
      "></div>
    </div>

    <!-- DIVIDER LINE -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,${AMBER}44,transparent);margin:6px 12px;flex-shrink:0"></div>

    <!-- CONVEYOR BELT -->
    <div style="padding:0 12px;flex-shrink:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <div style="font-family:Orbitron,sans-serif;font-size:.46rem;color:#555;letter-spacing:.14em">
          CONVEYOR QUEUE
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <div style="font-family:Orbitron,sans-serif;font-size:.44rem;color:${PURPLE};letter-spacing:.08em">
            🤖 ROBOTS: <span id="ef_robots_count">2</span> available
          </div>
          <button id="ef_run_btn" onclick="efRunNext()" style="
            padding:5px 14px;border-radius:8px;cursor:pointer;
            border:1px solid ${GREEN}66;
            background:rgba(34,211,165,.12);
            color:${GREEN};font-family:Orbitron,sans-serif;font-size:.52rem;letter-spacing:.1em;
            transition:all .15s;
          "
          onmouseover="this.style.background='rgba(34,211,165,.25)'" onmouseout="this.style.background='rgba(34,211,165,.12)'">
            ▶ RUN NEXT
          </button>
        </div>
      </div>

      <!-- Belt slots -->
      <div id="ef_belt" style="display:flex;gap:5px;height:76px;overflow-x:auto;padding-bottom:2px"></div>
    </div>

    <!-- DIVIDER -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,${AMBER}33,transparent);margin:5px 12px;flex-shrink:0"></div>

    <!-- COMPLETED TASKS -->
    <div style="padding:0 12px;flex:1;overflow-y:auto;padding-bottom:80px">
      <div style="font-family:Orbitron,sans-serif;font-size:.46rem;color:#555;letter-spacing:.14em;margin-bottom:5px">
        COMPLETED — <span id="ef_done_count">0</span> / <span id="ef_total_count">0</span>
      </div>
      <div id="ef_done_list" style="display:flex;flex-wrap:wrap;gap:5px"></div>
    </div>

  </div>

  <!-- ═══ ROBOT ASSIGN POPUP ═══ -->
  <div id="ef_robot_popup" style="
    position:absolute;z-index:60;
    background:linear-gradient(135deg,rgba(10,17,32,.98),rgba(3,4,12,.98));
    border:1px solid ${PURPLE}88;border-radius:14px;
    padding:14px 16px;
    box-shadow:0 0 30px rgba(167,139,250,.25);
    display:none;min-width:180px;
  ">
    <div style="font-family:Orbitron,sans-serif;font-size:.55rem;color:${PURPLE};letter-spacing:.12em;margin-bottom:8px">🤖 ASSIGN ROBOT?</div>
    <div id="ef_robot_popup_task" style="font-size:.7rem;color:#ccc;margin-bottom:10px"></div>
    <div style="font-size:.62rem;color:${GREEN};margin-bottom:10px">Saves 20% on all resource costs</div>
    <div style="display:flex;gap:8px">
      <button id="ef_robot_yes" style="
        flex:1;padding:7px;border-radius:8px;cursor:pointer;
        border:1px solid ${PURPLE}66;background:rgba(167,139,250,.15);
        color:${PURPLE};font-family:Orbitron,sans-serif;font-size:.52rem;
        transition:background .12s;
      "
      onmouseover="this.style.background='rgba(167,139,250,.3)'" onmouseout="this.style.background='rgba(167,139,250,.15)'">YES (−1 Robot)</button>
      <button id="ef_robot_no" style="
        flex:1;padding:7px;border-radius:8px;cursor:pointer;
        border:1px solid #44444488;background:rgba(255,255,255,.05);
        color:#888;font-family:Orbitron,sans-serif;font-size:.52rem;
        transition:background .12s;
      "
      onmouseover="this.style.background='rgba(255,255,255,.1)'" onmouseout="this.style.background='rgba(255,255,255,.05)'">SKIP</button>
    </div>
  </div>

  <!-- TOAST -->
  <div id="ef_toast" style="
    position:absolute;bottom:90px;left:50%;transform:translateX(-50%);
    z-index:80;pointer-events:none;
    font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.1em;
    padding:8px 18px;border-radius:10px;
    opacity:0;white-space:nowrap;
    transition:opacity .2s;
  "></div>

  <!-- TASK DETAIL TOOLTIP -->
  <div id="ef_tooltip" style="
    position:absolute;z-index:55;
    background:rgba(10,17,32,.97);
    border:1px solid ${AMBER}55;border-radius:10px;
    padding:10px 12px;pointer-events:none;
    display:none;min-width:160px;
  "></div>

  <!-- PROCESSING OVERLAY (task running animation) -->
  <div id="ef_processing" style="
    position:absolute;inset:0;z-index:70;
    display:none;
    background:rgba(3,4,12,.65);
    align-items:center;justify-content:center;
    flex-direction:column;gap:10px;
  ">
    <div id="ef_proc_icon" style="font-size:2.8rem"></div>
    <div id="ef_proc_label" style="font-family:Orbitron,sans-serif;font-size:.9rem;color:${AMBER};letter-spacing:.15em;text-shadow:0 0 16px ${AMBER}"></div>
    <div id="ef_proc_bar_wrap" style="width:200px;height:6px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden">
      <div id="ef_proc_bar" style="height:100%;border-radius:4px;background:linear-gradient(90deg,${AMBER},${AMBER2});width:0%;transition:width .05s linear"></div>
    </div>
    <div id="ef_proc_delta" style="font-size:.7rem;color:#ccc;text-align:center;padding:0 20px"></div>
  </div>

</div>`;
  };

  /* ── exit ──────────────────────────────────────────────────── */
  window.bud_efflabExit = function () {
    if (G) {
      clearTimeout(G._eventTimer);
      clearTimeout(G._toastTimer);
      clearInterval(G._countdownTimer);
      if (G._animBarId) cancelAnimationFrame(G._animBarId);
    }
    G = null;
    if (window.state) state.viewingWorld = 'strategist';
    goTo('hub');
  };

  /* ═══════════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════════ */
  function initGame() {
    const root = document.getElementById('ef_root');
    if (!root) return;

    G = {
      level: 1,
      phase: 'playing',     // playing | processing | result
      score: 0,
      resources: { ...L1_RESOURCES },
      startResources: { ...L1_RESOURCES },
      taskPool: [],         // available to queue
      beltQueue: [],        // { task, robot } — ordered queue
      completed: [],        // finished tasks
      required: [],         // required task ids
      robots: 2,            // available robot assistants
      maxRobots: 2,
      tasksTotal: 0,
      activeEvent: null,    // current disruptive event
      eventTurnsLeft: 0,
      eventsFired: [],
      pendingRobotSlot: -1, // belt index awaiting robot decision
      dragSrc: null,        // { taskId, fromPool:bool, beltIdx }
      dragEl: null,
      running: false,
      roundComplete: false,
      _eventTimer: null,
      _toastTimer: null,
      _countdownTimer: null,
      _animBarId: null,
    };

    injectStyles();
    buildCanvas();
    buildLevel1();
    renderAll();
    scheduleEvent();
  }

  /* ── level setup ───────────────────────────────────────────── */
  function buildLevel1() {
    const ids = LEVEL1_IDS;
    G.level = 1;
    G.resources = { ...L1_RESOURCES };
    G.startResources = { ...L1_RESOURCES };
    G.taskPool = ids.map(id => ALL_TASKS.find(t => t.id === id)).filter(Boolean).map(t => ({ ...t }));
    G.required = ids.filter(id => ALL_TASKS.find(t => t.id === id && t.required));
    G.beltQueue = [];
    G.completed = [];
    G.robots = 2;
    G.maxRobots = 2;
    G.tasksTotal = ids.length;
    G.score = 0;
    G.activeEvent = null;
    G.eventTurnsLeft = 0;
    G.eventsFired = [];
    updateHUD();
    document.getElementById('ef_level').textContent = '1';
  }

  function buildLevel2() {
    const ids = LEVEL2_IDS;
    G.level = 2;
    G.resources = { ...L2_RESOURCES };
    G.startResources = { ...L2_RESOURCES };
    G.taskPool = ids.map(id => ALL_TASKS.find(t => t.id === id)).filter(Boolean).map(t => ({ ...t }));
    G.required = ids.filter(id => {
      const t = ALL_TASKS.find(tt => tt.id === id);
      return t && t.required;
    });
    G.beltQueue = [];
    G.completed = [];
    G.robots = 2;
    G.maxRobots = 2;
    G.tasksTotal = ids.length;
    G.activeEvent = null;
    G.eventTurnsLeft = 0;
    G.eventsFired = [];
    updateHUD();
    document.getElementById('ef_level').textContent = '2';
    scheduleEvent();
  }

  /* ── canvas ambient grid ───────────────────────────────────── */
  function buildCanvas() {
    const c = document.getElementById('ef_canvas');
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const ctx = c.getContext('2d');

    // Grid
    ctx.strokeStyle = 'rgba(245,166,35,.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < c.width; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
    }
    for (let y = 0; y < c.height; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
    }

    // Glowing nodes at intersections (sparse)
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * (c.width / 48)) * 48;
      const y = Math.floor(Math.random() * (c.height / 48)) * 48;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, 6);
      grd.addColorStop(0, 'rgba(245,166,35,.35)');
      grd.addColorStop(1, 'rgba(245,166,35,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(x - 6, y - 6, 12, 12);
    }

    // Diagonal optimization pathway lines
    ctx.strokeStyle = 'rgba(0,229,255,.04)';
    ctx.lineWidth = 2;
    for (let i = -5; i < 15; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 80, 0);
      ctx.lineTo(i * 80 + c.height * 0.4, c.height);
      ctx.stroke();
    }
  }

  /* ── inject CSS ────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('ef_styles')) return;
    const s = document.createElement('style');
    s.id = 'ef_styles';
    s.textContent = `
      @keyframes ef_belt_move {
        0%   { background-position: 0 0; }
        100% { background-position: 40px 0; }
      }
      @keyframes ef_task_in {
        0%   { transform: translateY(12px) scale(.9); opacity:0; }
        100% { transform: translateY(0) scale(1);    opacity:1; }
      }
      @keyframes ef_task_complete {
        0%   { transform: scale(1);   opacity:1; }
        50%  { transform: scale(1.15); opacity:.8; }
        100% { transform: scale(.8);  opacity:.4; }
      }
      @keyframes ef_proc_pulse {
        0%,100% { box-shadow: 0 0 20px ${AMBER}44; }
        50%      { box-shadow: 0 0 40px ${AMBER}88; }
      }
      @keyframes ef_robot_blink {
        0%,100% { opacity:1; }
        50%      { opacity:.4; }
      }
      @keyframes ef_event_flash {
        0%,100% { opacity:1; }
        50%      { opacity:.7; }
      }
      @keyframes ef_shake {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-6px); }
        40%      { transform: translateX(6px); }
        60%      { transform: translateX(-4px); }
        80%      { transform: translateX(4px); }
      }
      @keyframes ef_result_in {
        0%   { transform: translateY(30px) scale(.95); opacity:0; }
        100% { transform: translateY(0) scale(1);      opacity:1; }
      }
      #ef_belt::-webkit-scrollbar { height: 3px; }
      #ef_belt::-webkit-scrollbar-track { background: rgba(255,255,255,.04); }
      #ef_belt::-webkit-scrollbar-thumb { background: ${AMBER}55; border-radius:2px; }
      #ef_pool::-webkit-scrollbar { width: 3px; }
      #ef_pool::-webkit-scrollbar-track { background: rgba(255,255,255,.04); }
      #ef_pool::-webkit-scrollbar-thumb { background: ${AMBER}55; border-radius:2px; }
      .ef-task-tile {
        border-radius:10px;
        padding:7px 9px;
        cursor:grab;
        transition: box-shadow .12s, transform .12s, opacity .2s;
        animation: ef_task_in .2s ease both;
        position:relative;
        min-width:90px;
        display:flex;flex-direction:column;gap:2px;
        touch-action:none;
      }
      .ef-task-tile:active { cursor:grabbing; transform:scale(1.05); }
      .ef-task-tile.disabled { opacity:.35; cursor:not-allowed; filter:grayscale(.7); }
      .ef-task-tile.robot-assigned::after {
        content:'🤖';
        position:absolute;top:-6px;right:-4px;
        font-size:.7rem;
        animation:ef_robot_blink 1.2s ease infinite;
      }
      .ef-belt-slot {
        flex-shrink:0;
        width:95px;height:72px;
        border-radius:10px;
        border:2px dashed rgba(245,166,35,.25);
        background:rgba(245,166,35,.04);
        display:flex;align-items:center;justify-content:center;
        position:relative;
        transition:border-color .15s, background .15s;
      }
      .ef-belt-slot.drag-over {
        border-color: ${AMBER}88;
        background: rgba(245,166,35,.12);
        box-shadow: 0 0 12px ${AMBER}44;
      }
      .ef-belt-slot .slot-number {
        position:absolute;top:3px;left:5px;
        font-family:Orbitron,sans-serif;font-size:.38rem;
        color:rgba(245,166,35,.3);letter-spacing:.08em;
      }
      .ef-done-chip {
        padding:4px 10px;border-radius:20px;
        font-size:.6rem;display:flex;align-items:center;gap:4px;
        animation: ef_task_in .2s ease both;
      }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */
  function renderAll() {
    renderPool();
    renderBelt();
    renderDone();
    updateHUD();
  }

  /* ── task pool ─────────────────────────────────────────────── */
  function renderPool() {
    const pool = document.getElementById('ef_pool');
    if (!pool) return;
    pool.innerHTML = '';

    if (!G.taskPool.length) {
      pool.innerHTML = `<div style="font-size:.65rem;color:#444;padding:10px;font-style:italic">All tasks queued or completed.</div>`;
      return;
    }

    G.taskPool.forEach((task, i) => {
      const tile = buildTaskTile(task, false, i, null);
      pool.appendChild(tile);
    });
  }

  /* ── belt ──────────────────────────────────────────────────── */
  function renderBelt() {
    const belt = document.getElementById('ef_belt');
    if (!belt) return;
    belt.innerHTML = '';

    // Always show BELT_SLOTS slots minimum, expand for queue
    const slots = Math.max(BELT_SLOTS, G.beltQueue.length + 1);

    for (let i = 0; i < slots; i++) {
      const slot = document.createElement('div');
      slot.className = 'ef-belt-slot';
      slot.dataset.slotIdx = i;

      // Conveyor stripe pattern
      slot.style.backgroundImage = `repeating-linear-gradient(
        90deg,
        transparent 0px,
        transparent 8px,
        rgba(245,166,35,.04) 8px,
        rgba(245,166,35,.04) 10px
      )`;
      slot.style.animation = 'ef_belt_move 1.5s linear infinite';

      const numEl = document.createElement('div');
      numEl.className = 'slot-number';
      numEl.textContent = `#${i + 1}`;
      slot.appendChild(numEl);

      // Next-to-run indicator
      if (i === 0 && G.beltQueue.length > 0) {
        const arrow = document.createElement('div');
        arrow.style.cssText = `position:absolute;top:2px;right:4px;font-size:.55rem;color:${GREEN};font-family:Orbitron,sans-serif;`;
        arrow.textContent = '▶ NEXT';
        slot.appendChild(arrow);
      }

      if (G.beltQueue[i]) {
        const entry = G.beltQueue[i];
        const tile = buildTaskTile(entry.task, true, i, entry.robot);
        slot.appendChild(tile);

        // Remove from slot button
        const rmBtn = document.createElement('button');
        rmBtn.style.cssText = `
          position:absolute;bottom:3px;right:3px;
          background:rgba(239,68,68,.15);border:1px solid ${RED}44;border-radius:5px;
          color:${RED};cursor:pointer;font-size:.5rem;padding:1px 5px;z-index:5;
        `;
        rmBtn.textContent = '✕';
        rmBtn.onclick = (e) => {
          e.stopPropagation();
          removeFromBelt(i);
        };
        slot.appendChild(rmBtn);
      } else {
        // Empty slot: show drop hint
        const hint = document.createElement('div');
        hint.style.cssText = `font-size:.6rem;color:rgba(245,166,35,.25);font-family:Orbitron,sans-serif;letter-spacing:.08em;text-align:center;`;
        hint.textContent = 'DROP\nHERE';
        hint.style.whiteSpace = 'pre';
        slot.appendChild(hint);
      }

      // drag-over events
      slot.addEventListener('dragover', e => {
        e.preventDefault();
        slot.classList.add('drag-over');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', e => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        handleDrop(i);
      });

      // touch drop (global handler sets G.dragSrc, we read slotIdx on touchend)
      slot.addEventListener('touchend', e => {
        e.preventDefault();
        if (G.dragSrc) handleDrop(i);
      });

      belt.appendChild(slot);
    }
  }

  /* ── done list ─────────────────────────────────────────────── */
  function renderDone() {
    const done = document.getElementById('ef_done_list');
    const cnt  = document.getElementById('ef_done_count');
    const tot  = document.getElementById('ef_total_count');
    if (!done) return;
    done.innerHTML = '';
    G.completed.forEach(entry => {
      const chip = document.createElement('div');
      chip.className = 'ef-done-chip';
      const wasRequired = G.required.includes(entry.task.id);
      chip.style.cssText = `
        padding:4px 10px;border-radius:20px;
        font-size:.6rem;display:flex;align-items:center;gap:4px;
        animation: ef_task_in .2s ease both;
        background:${wasRequired ? 'rgba(34,211,165,.12)' : 'rgba(255,255,255,.05)'};
        border:1px solid ${wasRequired ? GREEN + '55' : 'rgba(255,255,255,.1)'};
        color:${wasRequired ? GREEN : '#888'};
      `;
      chip.innerHTML = `${entry.task.emoji} <span>${entry.task.label}</span>${entry.robot ? ' 🤖' : ''}`;
      done.appendChild(chip);
    });
    if (cnt) cnt.textContent = G.completed.length;
    if (tot) tot.textContent = G.tasksTotal;
  }

  /* ── task tile builder ─────────────────────────────────────── */
  function buildTaskTile(task, inBelt, idx, robotAssigned) {
    const tile = document.createElement('div');
    tile.className = 'ef-task-tile' + (robotAssigned ? ' robot-assigned' : '');

    const isDisabled = G.activeEvent &&
      G.activeEvent.disables &&
      G.activeEvent.disables.includes(task.id);

    if (isDisabled) tile.classList.add('disabled');

    const isRequired = G.required.includes(task.id);
    tile.style.cssText = `
      border-radius:10px;
      padding:7px 9px;
      cursor:${isDisabled ? 'not-allowed' : 'grab'};
      transition: box-shadow .12s, transform .12s, opacity .2s;
      animation: ef_task_in .2s ease both;
      position:relative;
      min-width:${inBelt ? '75px' : '90px'};
      display:flex;flex-direction:column;gap:2px;
      touch-action:none;
      background: ${inBelt ? 'linear-gradient(145deg,rgba(26,42,74,.8),rgba(10,17,32,.9))' : 'linear-gradient(145deg,rgba(20,30,55,.85),rgba(10,17,32,.9))'};
      border: 1px solid ${isRequired ? AMBER + '66' : 'rgba(255,255,255,.12)'};
      box-shadow: ${isRequired ? '0 0 8px ' + AMBER + '22' : 'none'};
    `;
    if (robotAssigned) tile.style.setProperty('--robot', '1');

    // Cost preview with event modifier
    let effectiveTime   = task.time;
    let effectiveMoney  = task.money;
    let effectiveEnergy = task.energy;

    if (G.activeEvent && G.activeEvent.apply) {
      const mod = G.activeEvent.apply(task, G);
      if (mod) {
        if (mod.time !== undefined)   effectiveTime   = mod.time;
        if (mod.money !== undefined)  effectiveMoney  = mod.money;
        if (mod.energy !== undefined) effectiveEnergy = mod.energy;
      }
    }

    if (robotAssigned) {
      effectiveTime   = Math.floor(effectiveTime   * 0.8);
      effectiveMoney  = effectiveMoney < 0 ? Math.floor(effectiveMoney * 0.8) : Math.ceil(effectiveMoney * 1.0);
      effectiveEnergy = effectiveEnergy < 0 ? Math.floor(effectiveEnergy * 0.8) : Math.ceil(effectiveEnergy * 1.0);
    }

    tile.innerHTML = `
      <div style="display:flex;align-items:center;gap:4px">
        <span style="font-size:${inBelt ? '.9' : '1.1'}rem">${task.emoji}</span>
        <span style="font-family:Orbitron,sans-serif;font-size:${inBelt ? '.38' : '.44'}rem;color:#dde;letter-spacing:.06em;line-height:1.2">${task.label}</span>
      </div>
      <div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:2px">
        <span style="font-size:.45rem;padding:1px 4px;border-radius:4px;background:rgba(0,229,255,.1);color:${CYAN}">⏱${effectiveTime}h</span>
        <span style="font-size:.45rem;padding:1px 4px;border-radius:4px;background:${effectiveMoney >= 0 ? 'rgba(34,211,165,.1)' : 'rgba(239,68,68,.1)'};color:${effectiveMoney >= 0 ? GREEN : RED}">${effectiveMoney >= 0 ? '+' : ''}$${effectiveMoney}</span>
        <span style="font-size:.45rem;padding:1px 4px;border-radius:4px;background:${effectiveEnergy >= 0 ? 'rgba(245,166,35,.1)' : 'rgba(239,68,68,.1)'};color:${effectiveEnergy >= 0 ? AMBER : RED}">${effectiveEnergy >= 0 ? '+' : ''}${effectiveEnergy}⚡</span>
      </div>
      ${isRequired && !inBelt ? `<div style="font-size:.38rem;color:${AMBER};font-family:Orbitron,sans-serif;letter-spacing:.06em">★ REQUIRED</div>` : ''}
    `;

    if (!isDisabled) {
      // Desktop drag
      tile.draggable = true;
      tile.addEventListener('dragstart', e => {
        G.dragSrc = { taskId: task.id, fromPool: !inBelt, beltIdx: inBelt ? idx : -1 };
        e.dataTransfer.effectAllowed = 'move';
      });
      tile.addEventListener('dragend', () => { G.dragSrc = null; });

      // Touch drag
      let touchStartX = 0, touchStartY = 0;
      let ghostEl = null;
      tile.addEventListener('touchstart', e => {
        const t = e.touches[0];
        touchStartX = t.clientX; touchStartY = t.clientY;
        G.dragSrc = { taskId: task.id, fromPool: !inBelt, beltIdx: inBelt ? idx : -1 };
        ghostEl = tile.cloneNode(true);
        ghostEl.style.cssText += `position:fixed;top:${t.clientY - 20}px;left:${t.clientX - 40}px;opacity:.8;pointer-events:none;z-index:90;width:${tile.offsetWidth}px;`;
        document.body.appendChild(ghostEl);
      }, { passive: true });
      tile.addEventListener('touchmove', e => {
        const t = e.touches[0];
        if (ghostEl) { ghostEl.style.top = (t.clientY - 20) + 'px'; ghostEl.style.left = (t.clientX - 40) + 'px'; }
        e.preventDefault();
      }, { passive: false });
      tile.addEventListener('touchend', e => {
        if (ghostEl) { ghostEl.remove(); ghostEl = null; }
        // Find which slot was touched
        const t = e.changedTouches[0];
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (el) {
          const slotEl = el.closest('.ef-belt-slot');
          if (slotEl && slotEl.dataset.slotIdx !== undefined) {
            handleDrop(parseInt(slotEl.dataset.slotIdx));
          }
        }
      });

      // Hover tooltip
      tile.addEventListener('mouseenter', e => showTooltip(task, e.clientX, e.clientY));
      tile.addEventListener('mouseleave', () => hideTooltip());
      tile.addEventListener('mousemove',  e => posTooltip(e.clientX, e.clientY));
    }

    return tile;
  }

  /* ── tooltip ───────────────────────────────────────────────── */
  function showTooltip(task, x, y) {
    const tt = document.getElementById('ef_tooltip');
    if (!tt) return;
    const positive = v => v >= 0;
    tt.innerHTML = `
      <div style="font-family:Orbitron,sans-serif;font-size:.52rem;color:${AMBER};letter-spacing:.1em;margin-bottom:6px">${task.emoji} ${task.label}</div>
      <div style="display:flex;flex-direction:column;gap:3px;font-size:.62rem;">
        <div style="color:${CYAN}">⏱ Time cost: ${task.time}h</div>
        <div style="color:${positive(task.money) ? GREEN : RED}">💰 Money: ${task.money >= 0 ? '+' : ''}$${task.money}</div>
        <div style="color:${positive(task.energy) ? AMBER : RED}">⚡ Energy: ${task.energy >= 0 ? '+' : ''}${task.energy}</div>
      </div>
      ${G.required.includes(task.id) ? `<div style="margin-top:6px;font-size:.5rem;color:${AMBER};font-family:Orbitron,sans-serif;">★ REQUIRED TO COMPLETE LEVEL</div>` : ''}
    `;
    tt.style.display = 'block';
    posTooltip(x, y);
  }

  function posTooltip(x, y) {
    const tt = document.getElementById('ef_tooltip');
    if (!tt) return;
    const w = tt.offsetWidth || 170;
    const h = tt.offsetHeight || 100;
    const px = Math.min(x + 12, window.innerWidth - w - 8);
    const py = Math.min(y + 12, window.innerHeight - h - 8);
    tt.style.left = px + 'px';
    tt.style.top  = py + 'px';
  }

  function hideTooltip() {
    const tt = document.getElementById('ef_tooltip');
    if (tt) tt.style.display = 'none';
  }

  /* ═══════════════════════════════════════════════════════════════
     DRAG & DROP LOGIC
  ═══════════════════════════════════════════════════════════════ */
  function handleDrop(slotIdx) {
    if (!G || G.phase !== 'playing' || G.running) return;
    if (!G.dragSrc) return;

    const { taskId, fromPool, beltIdx } = G.dragSrc;
    G.dragSrc = null;

    // Find task
    let task = null;
    if (fromPool) {
      const poolIdx = G.taskPool.findIndex(t => t.id === taskId);
      if (poolIdx < 0) return;

      // Check if event disables this task
      if (G.activeEvent && G.activeEvent.disables && G.activeEvent.disables.includes(taskId)) {
        showToast(`🚫 ${task ? task.label : taskId} is disabled!`, RED);
        return;
      }

      task = G.taskPool.splice(poolIdx, 1)[0];
      // Insert into belt at slotIdx
      G.beltQueue.splice(slotIdx, 0, { task, robot: false });
    } else {
      // Reordering within belt
      if (beltIdx === slotIdx) return;
      const entry = G.beltQueue.splice(beltIdx, 1)[0];
      if (!entry) return;
      G.beltQueue.splice(slotIdx, 0, entry);
    }

    renderAll();
  }

  function removeFromBelt(slotIdx) {
    if (!G || G.running) return;
    const entry = G.beltQueue.splice(slotIdx, 1)[0];
    if (!entry) return;
    G.taskPool.push(entry.task);
    renderAll();
  }

  /* ═══════════════════════════════════════════════════════════════
     ROBOT ASSIGN
  ═══════════════════════════════════════════════════════════════ */
  function offerRobotAssign(slotIdx) {
    if (!G || G.robots <= 0) return;
    if (G.beltQueue[slotIdx] && G.beltQueue[slotIdx].robot) return; // already assigned

    G.pendingRobotSlot = slotIdx;
    const entry = G.beltQueue[slotIdx];
    if (!entry) return;

    const popup = document.getElementById('ef_robot_popup');
    const taskLabel = document.getElementById('ef_robot_popup_task');
    const yesBtn = document.getElementById('ef_robot_yes');
    const noBtn  = document.getElementById('ef_robot_no');

    if (!popup) return;

    taskLabel.textContent = `Task: ${entry.task.emoji} ${entry.task.label}`;

    popup.style.display = 'block';
    // Position near slot
    const belt = document.getElementById('ef_belt');
    if (belt) {
      const beltRect = belt.getBoundingClientRect();
      popup.style.top  = (beltRect.bottom + 6) + 'px';
      popup.style.left = '12px';
    }

    yesBtn.onclick = () => {
      G.beltQueue[G.pendingRobotSlot].robot = true;
      G.robots--;
      popup.style.display = 'none';
      renderAll();
    };
    noBtn.onclick = () => {
      popup.style.display = 'none';
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     RUN NEXT TASK
  ═══════════════════════════════════════════════════════════════ */
  window.efRunNext = function () {
    if (!G || G.phase !== 'playing' || G.running) return;
    if (G.beltQueue.length === 0) {
      showToast('Queue is empty! Add tasks first.', AMBER);
      return;
    }

    // Offer robot before running?
    const entry = G.beltQueue[0];
    if (G.robots > 0 && !entry.robot) {
      // Show a quick prompt
      offerRobotAssign(0);
      return;
    }

    executeNext();
  };

  function executeNext() {
    if (!G || G.phase !== 'playing' || !G.beltQueue.length) return;

    const entry = G.beltQueue.shift();
    const { task, robot } = entry;
    G.running = true;

    // Calculate effective costs
    let timeCost   = task.time;
    let moneyCost  = task.money;    // can be positive (earn) or negative (spend)
    let energyCost = task.energy;   // can be positive (restore) or negative (drain)

    if (G.activeEvent && G.activeEvent.apply) {
      const mod = G.activeEvent.apply(task, G);
      if (mod) {
        if (mod.time !== undefined)   timeCost   = mod.time;
        if (mod.money !== undefined)  moneyCost  = mod.money;
        if (mod.energy !== undefined) energyCost = mod.energy;
      }
    }

    if (robot) {
      timeCost   = Math.ceil(timeCost * 0.8);
      moneyCost  = moneyCost < 0 ? Math.ceil(moneyCost * 0.8) : moneyCost;
      energyCost = energyCost < 0 ? Math.ceil(energyCost * 0.8) : energyCost;
      G.robots++;  // robot returns after use — max cap
      G.robots = Math.min(G.robots, G.maxRobots);
    }

    // Show processing overlay
    const proc = document.getElementById('ef_processing');
    const procIcon = document.getElementById('ef_proc_icon');
    const procLabel = document.getElementById('ef_proc_label');
    const procDelta = document.getElementById('ef_proc_delta');
    const procBar   = document.getElementById('ef_proc_bar');

    if (proc) {
      proc.style.display = 'flex';
      proc.style.animation = 'ef_proc_pulse 1s ease infinite';
    }
    if (procIcon)  procIcon.textContent  = task.emoji;
    if (procLabel) procLabel.textContent = task.label.toUpperCase();

    const deltaLines = [
      `⏱ Time: −${timeCost}h`,
      `💰 Money: ${moneyCost >= 0 ? '+' : ''}$${moneyCost}`,
      `⚡ Energy: ${energyCost >= 0 ? '+' : ''}${energyCost}`,
    ];
    if (robot) deltaLines.push('🤖 Robot assisted (20% savings)');
    if (procDelta) procDelta.innerHTML = deltaLines.join('<br>');
    if (procBar) { procBar.style.transition = 'none'; procBar.style.width = '0%'; }

    // Animate bar fill
    const duration = 1200;
    const startTime = performance.now();
    function animBar(now) {
      const p = Math.min((now - startTime) / duration, 1);
      if (procBar) procBar.style.width = (p * 100) + '%';
      if (p < 1) {
        if (G) G._animBarId = requestAnimationFrame(animBar);
      } else {
        if (G) G._animBarId = null;
      }
    }
    if (G) G._animBarId = requestAnimationFrame(animBar);

    setTimeout(() => {
      if (!G) return;

      // Apply resources
      G.resources.time   = Math.max(0, G.resources.time + (timeCost > 0 ? -timeCost : 0));
      G.resources.money  += moneyCost;
      G.resources.energy += energyCost;
      G.resources.energy  = Math.max(0, Math.min(150, G.resources.energy));

      G.completed.push({ task, robot });

      // Score: base pts + efficiency bonus
      const effBonus = robot ? 20 : 0;
      G.score += 100 + effBonus;

      if (proc) { proc.style.display = 'none'; proc.style.animation = 'none'; }

      // Decrement active event turns
      if (G.activeEvent && G.activeEvent.duration > 0) {
        G.eventTurnsLeft--;
        if (G.eventTurnsLeft <= 0) {
          G.activeEvent = null;
          hideEventBanner();
        } else {
          updateEventBanner();
        }
      }

      G.running = false;

      // Check lose: any resource at 0
      if (G.resources.time <= 0 || G.resources.energy <= 0 || G.resources.money < -200) {
        triggerLose();
        return;
      }

      updateHUD();
      renderAll();
      updateScoreEl();

      // Check win: all required tasks completed + pool empty
      checkWinCondition();

    }, duration + 100);
  }

  /* ── win check ─────────────────────────────────────────────── */
  function checkWinCondition() {
    if (!G) return;

    const completedIds = G.completed.map(e => e.task.id);
    const allRequired  = G.required.every(id => completedIds.includes(id));

    // Also check if pool is empty (all available tasks done or queued)
    const poolEmpty   = G.taskPool.length === 0 && G.beltQueue.length === 0;

    if (allRequired && poolEmpty) {
      // All tasks processed
      if (G.level === 1) {
        // Advance to level 2
        showLevelTransition();
      } else {
        triggerWin();
      }
    } else if (allRequired && G.taskPool.length === 0 && G.beltQueue.length === 0) {
      if (G.level === 1) showLevelTransition();
      else triggerWin();
    }
  }

  function showLevelTransition() {
    if (!G) return;
    G.phase = 'transition';
    const root = document.getElementById('ef_root');
    if (!root) return;

    const overlay = document.createElement('div');
    overlay.id = 'ef_lvl_overlay';
    overlay.style.cssText = `
      position:absolute;inset:0;z-index:90;
      background:rgba(3,4,12,.92);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:16px;animation:ef_result_in .4s ease both;
    `;
    overlay.innerHTML = `
      <div style="font-size:2.5rem">🏭</div>
      <div style="font-family:Orbitron,sans-serif;font-size:1rem;color:${GREEN};letter-spacing:.2em;text-shadow:0 0 16px ${GREEN}">LEVEL 1 COMPLETE!</div>
      <div style="font-size:.75rem;color:#aaa;text-align:center;max-width:260px;line-height:1.6">
        Nice optimization! Now the <span style="color:${AMBER}">real world hits back</span> — disruptions incoming. Adapt your routing plan.
      </div>
      <div style="font-family:Orbitron,sans-serif;font-size:.62rem;color:${AMBER};letter-spacing:.12em;">Level 2 starts in 3…</div>
    `;
    root.appendChild(overlay);

    let count = 3;
    const countEl = overlay.querySelector('[style*="starts in"]');
    G._countdownTimer = setInterval(() => {
      if (!G) { clearInterval(G && G._countdownTimer); return; }
      count--;
      if (countEl) countEl.textContent = `Level 2 starts in ${count}…`;
      if (count <= 0) {
        clearInterval(G._countdownTimer);
        G._countdownTimer = null;
        overlay.remove();
        G.phase = 'playing';
        buildLevel2();
        renderAll();
      }
    }, 1000);
  }

  /* ── win / lose ────────────────────────────────────────────── */
  function triggerWin() {
    if (!G) return;
    G.phase = 'result';
    clearTimeout(G._eventTimer);

    // Calculate stars
    const moneyRatio  = G.resources.money  / G.startResources.money;
    const timeRatio   = G.resources.time   / G.startResources.time;
    const energyRatio = G.resources.energy / G.startResources.energy;
    const minRatio    = Math.min(moneyRatio, timeRatio, energyRatio);
    const avgRatio    = (moneyRatio + timeRatio + energyRatio) / 3;

    let stars;
    if (minRatio >= STAR3_THRESHOLD) stars = 3;
    else if (avgRatio >= STAR2_THRESHOLD) stars = 2;
    else stars = 1;

    endGame(stars, true);
  }

  function triggerLose() {
    if (!G) return;
    G.phase = 'result';
    clearTimeout(G._eventTimer);
    G.running = false;

    const proc = document.getElementById('ef_processing');
    if (proc) proc.style.display = 'none';

    // Shake
    const root = document.getElementById('ef_root');
    if (root) {
      root.style.animation = 'none';
      requestAnimationFrame(() => { root.style.animation = 'ef_shake .4s ease'; });
    }

    setTimeout(() => endGame(0, false), 400);
  }

  /* ═══════════════════════════════════════════════════════════════
     END GAME
  ═══════════════════════════════════════════════════════════════ */
  function endGame(stars, won) {
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bud_efflab', { level: 1, stars, badge: 'Efficiency Master', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    // feed shared Budgetron Budget Meter (net-equivalent of +15/+8/+3, −8 on resource bankruptcy)
    if (window.budgetDelta) budgetDelta(stars === 3 ? 600 : stars === 2 ? 320 : stars >= 1 ? 120 : -320);

    const root = document.getElementById('ef_root');
    if (!root) return;

    const starStr = stars >= 1 ? ['⭐', '⭐⭐', '⭐⭐⭐'][stars - 1] : '💀';
    const completed = G ? G.completed.length : 0;
    const moneyLeft  = G ? G.resources.money  : 0;
    const timeLeft   = G ? G.resources.time   : 0;
    const energyLeft = G ? G.resources.energy : 0;

    const overlay = document.createElement('div');
    overlay.id = 'ef_result_overlay';
    overlay.style.cssText = `
      position:absolute;inset:0;z-index:100;
      background:rgba(3,4,12,.92);
      display:flex;align-items:center;justify-content:center;
      padding:20px;
    `;
    overlay.innerHTML = `
      <div style="
        width:min(360px,92vw);
        background:linear-gradient(145deg,rgba(26,42,74,.97),rgba(5,8,20,.98));
        border:2px solid rgba(245,166,35,.3);
        border-radius:22px;
        padding:26px 22px;
        text-align:center;
        box-shadow:0 0 60px rgba(245,166,35,.12),0 20px 60px rgba(0,0,0,.7);
        position:relative;overflow:hidden;
        animation:ef_result_in .4s ease both;
      ">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${AMBER},transparent)"></div>

        <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.25em;color:${AMBER}66;margin-bottom:8px">
          ${won ? 'LAB COMPLETE' : 'RESOURCES DEPLETED'}
        </div>

        <div style="font-size:2.4rem;margin:6px 0">${starStr}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:1.2rem;letter-spacing:.1em;color:${won ? GOLD : RED};margin-bottom:18px;text-shadow:0 0 12px ${won ? GOLD : RED}66">
          ${won ? (stars === 3 ? 'OPTIMIZED!' : stars === 2 ? 'EFFICIENT!' : 'COMPLETED!') : 'SYSTEM FAILURE'}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:12px">
          ${statBox('TASKS DONE', completed, CYAN)}
          ${statBox('SCORE', G ? G.score : 0, GOLD)}
          ${statBox('LEVEL', G ? G.level : 1, AMBER)}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:16px">
          ${statBox('MONEY LEFT', '$' + moneyLeft, moneyLeft > 0 ? GREEN : RED)}
          ${statBox('TIME LEFT', timeLeft + 'h', timeLeft > 5 ? CYAN : RED)}
          ${statBox('ENERGY LEFT', energyLeft, energyLeft > 30 ? AMBER : RED)}
        </div>

        ${coins > 0 ? `
        <div style="
          background:linear-gradient(135deg,rgba(245,200,66,.12),rgba(245,200,66,.04));
          border:1px solid rgba(245,200,66,.3);
          border-radius:12px;padding:10px;margin-bottom:14px;
        ">
          <div style="font-family:Orbitron,sans-serif;font-size:.5rem;color:${GOLD}77;letter-spacing:.15em">COINS EARNED</div>
          <div style="font-family:Orbitron,sans-serif;font-size:1.5rem;color:${GOLD};text-shadow:0 0 12px ${GOLD}66">+${coins} 🪙</div>
        </div>
        ` : ''}

        <div style="
          background:rgba(0,229,255,.04);border:1px solid rgba(0,229,255,.12);
          border-radius:10px;padding:12px;margin-bottom:18px;
          font-size:.7rem;line-height:1.65;color:#aabbcc;text-align:left;
        ">
          <span style="color:${CYAN};font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.1em;display:block;margin-bottom:5px">💡 LESSON</span>
          Life runs on three resources — money, time, and energy — and none of them are unlimited. Optimizing how you use all three is what separates people who feel constantly broke and busy from those who accomplish more with less. Plan before you act.
        </div>

        <div style="display:flex;gap:10px">
          <button onclick="efPlayAgain()" style="
            flex:1;padding:11px;border-radius:12px;cursor:pointer;
            border:2px solid ${AMBER}55;
            background:rgba(245,166,35,.1);
            color:${AMBER};font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.12em;
            transition:all .15s;
          "
          onmouseover="this.style.background='rgba(245,166,35,.22)'" onmouseout="this.style.background='rgba(245,166,35,.1)'">
            ↻ PLAY AGAIN
          </button>
          <button onclick="window.bud_efflabExit()" style="
            flex:1;padding:11px;border-radius:12px;cursor:pointer;
            border:2px solid ${GREEN}55;
            background:rgba(34,211,165,.08);
            color:${GREEN};font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.12em;
            transition:all .15s;
          "
          onmouseover="this.style.background='rgba(34,211,165,.2)'" onmouseout="this.style.background='rgba(34,211,165,.08)'">
            ← HUB
          </button>
        </div>

        <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${GREEN},transparent)"></div>
      </div>
    `;

    root.appendChild(overlay);
  }

  function statBox(label, val, color) {
    return `
      <div style="
        background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);
        border-radius:10px;padding:8px 6px;
      ">
        <div style="font-family:Orbitron,sans-serif;font-size:.4rem;color:#555;letter-spacing:.1em;margin-bottom:3px">${label}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.85rem;color:${color};font-variant-numeric:tabular-nums">${val}</div>
      </div>
    `;
  }

  /* ── play again ────────────────────────────────────────────── */
  window.efPlayAgain = function () {
    const ov = document.getElementById('ef_result_overlay');
    if (ov) ov.remove();
    const lvl = document.getElementById('ef_lvl_overlay');
    if (lvl) lvl.remove();
    G = null;
    initGame();
  };

  /* ═══════════════════════════════════════════════════════════════
     HUD UPDATE
  ═══════════════════════════════════════════════════════════════ */
  function updateHUD() {
    if (!G) return;

    const mv = document.getElementById('ef_money_val');
    const tv = document.getElementById('ef_time_val');
    const ev = document.getElementById('ef_energy_val');
    const mb = document.getElementById('ef_money_bar');
    const tb = document.getElementById('ef_time_bar');
    const eb = document.getElementById('ef_energy_bar');
    const rc = document.getElementById('ef_robots_count');

    if (mv) mv.textContent = '$' + G.resources.money;
    if (tv) tv.textContent = G.resources.time + 'h';
    if (ev) ev.textContent = G.resources.energy;

    const moneyPct  = Math.max(0, Math.min(100, (G.resources.money  / G.startResources.money)  * 100));
    const timePct   = Math.max(0, Math.min(100, (G.resources.time   / G.startResources.time)   * 100));
    const energyPct = Math.max(0, Math.min(100, (G.resources.energy / 150) * 100));

    if (mb) { mb.style.width = moneyPct  + '%'; mb.style.background = barColor(moneyPct,  GREEN); }
    if (tb) { tb.style.width = timePct   + '%'; tb.style.background = barColor(timePct,   CYAN);  }
    if (eb) { eb.style.width = energyPct + '%'; eb.style.background = barColor(energyPct, AMBER); }

    if (rc) rc.textContent = G.robots;
  }

  function barColor(pct, nominal) {
    if (pct > 50) return `linear-gradient(90deg,${nominal},${nominal}cc)`;
    if (pct > 20) return `linear-gradient(90deg,${GOLD},${GOLD}cc)`;
    return `linear-gradient(90deg,${RED},${RED}cc)`;
  }

  function updateScoreEl() {
    const el = document.getElementById('ef_score');
    if (el && G) el.textContent = G.score;
  }

  /* ═══════════════════════════════════════════════════════════════
     DISRUPTIVE EVENTS (Level 2)
  ═══════════════════════════════════════════════════════════════ */
  function scheduleEvent() {
    if (!G || G.level < 2 || G.phase !== 'playing') return;
    clearTimeout(G._eventTimer);
    const delay = 8000 + Math.random() * 10000;
    G._eventTimer = setTimeout(() => {
      if (!G || G.level < 2 || G.phase !== 'playing') return;
      fireRandomEvent();
    }, delay);
  }

  function fireRandomEvent() {
    if (!G || G.activeEvent) return;  // already have one running

    const eligible = EVENTS.filter(e => !G.eventsFired.includes(e.id));
    if (!eligible.length) return;

    const ev = eligible[Math.floor(Math.random() * eligible.length)];
    G.eventsFired.push(ev.id);
    G.activeEvent = ev;
    G.eventTurnsLeft = ev.duration;

    showEventBanner(ev);

    // Inject task if needed
    if (ev.injectTask) {
      const t = ALL_TASKS.find(tt => tt.id === ev.injectTask);
      if (t && !G.taskPool.find(tp => tp.id === t.id) && !G.completed.find(c => c.task.id === t.id)) {
        G.taskPool.unshift({ ...t });
        G.required.push(t.id);
        G.tasksTotal++;
        showToast(`⚠ ${ev.label} — new task added!`, ev.color || AMBER);
      }
    } else {
      showToast(`⚠ ${ev.label}`, ev.color || AMBER);
    }

    if (ev.duration === 0) {
      // one-shot event
      G.activeEvent = null;
      hideEventBanner();
    }

    renderAll();
    scheduleEvent();  // schedule next
  }

  function showEventBanner(ev) {
    const banner = document.getElementById('ef_event_banner');
    const icon   = document.getElementById('ef_event_icon');
    const title  = document.getElementById('ef_event_title');
    const desc   = document.getElementById('ef_event_desc');
    const turns  = document.getElementById('ef_event_turns');
    if (!banner) return;

    banner.style.display = 'block';
    banner.style.borderColor = (ev.color || AMBER) + '88';
    banner.style.background = (ev.color || AMBER) + '11';
    banner.style.animation = 'ef_event_flash .8s ease infinite';

    const parts = (ev.label || '').split(' ');
    if (icon)  icon.textContent  = parts[0] || '⚠';
    if (title) { title.textContent = parts.slice(1).join(' '); title.style.color = ev.color || AMBER; }
    if (desc)  desc.textContent  = ev.desc || '';
    if (turns) turns.textContent = ev.duration > 0 ? `${G.eventTurnsLeft} tasks left` : 'ONE-TIME';
  }

  function hideEventBanner() {
    const banner = document.getElementById('ef_event_banner');
    if (banner) { banner.style.display = 'none'; banner.style.animation = 'none'; }
  }

  function updateEventBanner() {
    const turns = document.getElementById('ef_event_turns');
    if (turns && G.activeEvent) turns.textContent = `${G.eventTurnsLeft} tasks left`;
  }

  /* ── toast ─────────────────────────────────────────────────── */
  function showToast(msg, color) {
    const t = document.getElementById('ef_toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = `rgba(3,4,12,.95)`;
    t.style.border = `1px solid ${color}77`;
    t.style.color = color;
    t.style.boxShadow = `0 0 16px ${color}44`;
    t.style.opacity = '1';
    clearTimeout(G && G._toastTimer);
    if (G) G._toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 2200);
  }

})();
