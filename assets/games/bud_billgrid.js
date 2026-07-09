/* ════════════════════════════════════════════════════════════════
   BILL MANAGEMENT GRID — Budgetron Base (Strategist Hub)
   Drag bill tiles from the sidebar onto the correct due-date
   calendar cell before the overdue timer expires.
   Level 1: 6 bills, clear spacing. Level 2: 10 new bills with
   disruption events (holiday, paycheck delay). Level 3: 14 new
   bills, faster month, shorter grace, 3 disruptions.
   Scoring: Budget Health Score · Payment Streak bonus.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────── */
  const ACCENT     = '#1a2a4a';
  const ACCENT_LT  = '#2e4a7a';
  const ACCENT_GL  = '#4a7abf';
  const GOLD       = '#f0b429';
  const GREEN      = '#22c55e';
  const RED        = '#ef4444';
  const ORANGE     = '#f97316';
  const BG         = '#03040c';
  const BG2        = '#060b18';

  const DAYS_IN_MONTH = 30; // we use a simplified 30-day June
  const DAY_LABELS    = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  // June 1 2026 = Monday → offset 1
  const MONTH_START_DOW = 1;
  const MONTH_NAME  = 'JUNE 2026';

  /* ── Bill definitions ───────────────────────────────────────── */
  const ALL_BILLS = [
    { id:'electric',     label:'Electric',     icon:'⚡', color:'#facc15', amount:'$87',  dueDay:5  },
    { id:'water',        label:'Water',        icon:'💧', color:'#38bdf8', amount:'$34',  dueDay:8  },
    { id:'internet',     label:'Internet',     icon:'📡', color:'#a78bfa', amount:'$65',  dueDay:10 },
    { id:'phone',        label:'Phone',        icon:'📱', color:'#34d399', amount:'$55',  dueDay:15 },
    { id:'rent',         label:'Rent',         icon:'🏠', color:'#fb923c', amount:'$950', dueDay:1  },
    { id:'insurance',    label:'Insurance',    icon:'🛡️', color:'#f472b6', amount:'$120', dueDay:20 },
    { id:'streaming',    label:'Streaming',    icon:'🎬', color:'#c084fc', amount:'$18',  dueDay:3  },
    { id:'gym',          label:'Gym',          icon:'💪', color:'#4ade80', amount:'$45',  dueDay:12 },
    { id:'cloud',        label:'Cloud',        icon:'☁️', color:'#7dd3fc', amount:'$12',  dueDay:7  },
    { id:'gas',          label:'Gas',          icon:'🔥', color:'#fca5a5', amount:'$62',  dueDay:18 },
    { id:'credit',       label:'Credit Card',  icon:'💳', color:'#f0abfc', amount:'$220', dueDay:22 },
    { id:'car',          label:'Car Note',     icon:'🚗', color:'#86efac', amount:'$340', dueDay:14 },
    { id:'trash',        label:'Trash',        icon:'🗑️', color:'#a8a29e', amount:'$28',  dueDay:6  },
    { id:'medical',      label:'Medical',      icon:'🏥', color:'#fda4af', amount:'$75',  dueDay:25 },
    { id:'software',     label:'Software',     icon:'💻', color:'#67e8f9', amount:'$30',  dueDay:9  },
    { id:'music',        label:'Music App',    icon:'🎵', color:'#f9a8d4', amount:'$11',  dueDay:27 },
    /* Level 3 bill set — all-new household bills */
    { id:'mortgage',     label:'Mortgage',     icon:'🏡', color:'#fdba74', amount:'$1,150', dueDay:1  },
    { id:'heating',      label:'Heating',      icon:'🌡️', color:'#fb7185', amount:'$95',  dueDay:2  },
    { id:'sewer',        label:'Sewer',        icon:'🚰', color:'#5eead4', amount:'$26',  dueDay:4  },
    { id:'cabletv',      label:'Cable TV',     icon:'📺', color:'#93c5fd', amount:'$49',  dueDay:6  },
    { id:'petcare',      label:'Pet Care',     icon:'🐶', color:'#fcd34d', amount:'$38',  dueDay:8  },
    { id:'tuition',      label:'School Fees',  icon:'🎒', color:'#c4b5fd', amount:'$130', dueDay:10 },
    { id:'buspass',      label:'Bus Pass',     icon:'🚌', color:'#fde047', amount:'$40',  dueDay:12 },
    { id:'security',     label:'Security',     icon:'🚨', color:'#f87171', amount:'$32',  dueDay:14 },
    { id:'lawn',         label:'Lawn Care',    icon:'🌱', color:'#86efac', amount:'$35',  dueDay:16 },
    { id:'news',         label:'News Sub',     icon:'📰', color:'#d4d4d8', amount:'$15',  dueDay:18 },
    { id:'daycare',      label:'Daycare',      icon:'🧸', color:'#f0abfc', amount:'$210', dueDay:20 },
    { id:'dentist',      label:'Dentist',      icon:'🦷', color:'#e0f2fe', amount:'$85',  dueDay:22 },
    { id:'piano',        label:'Piano Class',  icon:'🎹', color:'#a5b4fc', amount:'$60',  dueDay:24 },
    { id:'sports',       label:'Team Fees',    icon:'⚽', color:'#6ee7b7', amount:'$50',  dueDay:28 },
  ];

  /* Disjoint bill subsets — no bill repeats across levels */
  const LVL1_IDS = ['rent','electric','water','internet','phone','insurance'];
  const LVL2_IDS = ['streaming','trash','cloud','software','gym','car','gas','credit','medical','music'];
  const LVL3_IDS = ['mortgage','heating','sewer','cabletv','petcare','tuition','buspass','security','lawn','news','daycare','dentist','piano','sports'];

  /* ── Disruption events ─────────────────────────────────────────
     type: 'holiday'  → day X blocked (payment bounces)
     type: 'weekend'  → days X,X+1 blocked from bank transfers
     type: 'paycheck' → bills after day Y get +2 days grace */
  const DISRUPTIONS_L2 = [
    { type:'holiday',  day:6,  label:'🎉 Holiday — banks closed today!',            affectDays:[6]     },
    { type:'paycheck', day:10, label:'💸 Paycheck delayed — arrives day 13!',       graceFrom:11, graceTo:30, bonusDays:2 },
  ];
  const DISRUPTIONS_L3 = [
    { type:'holiday',  day:10, label:'🎉 Holiday — banks closed today!',            affectDays:[10]    },
    { type:'paycheck', day:12, label:'💸 Paycheck delayed — arrives day 15!',       graceFrom:13, graceTo:30, bonusDays:2 },
    { type:'weekend',  day:20, label:'🏖️ Weekend — bank transfers blocked Sat–Sun!', affectDays:[20,21] },
  ];

  /* ── Level configs: bills, pacing, grace, tolerance, stars ────── */
  const LEVELS = [
    { n:1, name:'LEARN',  ids:LVL1_IDS, monthSecs:45, graceSec:18, tolerance:0, disruptions:[],             lateAllow:0 },
    { n:2, name:'MANAGE', ids:LVL2_IDS, monthSecs:55, graceSec:12, tolerance:1, disruptions:DISRUPTIONS_L2, lateAllow:2 },
    { n:3, name:'MASTER', ids:LVL3_IDS, monthSecs:65, graceSec:9,  tolerance:1, disruptions:DISRUPTIONS_L3, lateAllow:3 },
  ];

  /* ── Game state ─────────────────────────────────────────────── */
  let G = null;

  /* ── Entry point registered on SCREENS ──────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_bud_billgrid = function () {
    G = null;
    setTimeout(initGame, 40);
    return `<div id="bbg_root" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none">
      <!-- TOP BAR -->
      <div id="bbg_bar" style="position:absolute;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;gap:10px;padding:10px 16px 8px;background:linear-gradient(180deg,rgba(3,4,12,.95),rgba(3,4,12,.0));border-bottom:1px solid rgba(74,122,191,.18)">
        <button id="bbg_back" style="padding:6px 13px;border:1px solid rgba(74,122,191,.45);border-radius:8px;background:rgba(26,42,74,.6);color:${ACCENT_GL};font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer;flex-shrink:0">← HUB</button>
        <div style="font-family:Orbitron,sans-serif;font-size:.68rem;letter-spacing:.18em;color:${ACCENT_GL};flex:1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">BILL MANAGEMENT GRID</div>
        <button onclick="bbgShowHelp()" title="How to play" style="padding:6px 10px;border:1px solid rgba(74,122,191,.45);border-radius:8px;background:rgba(26,42,74,.6);color:${ACCENT_GL};cursor:pointer;flex-shrink:0;font-size:.75rem">❓</button>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <div style="text-align:center">
            <div style="font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.12em;color:rgba(255,255,255,.45)">HEALTH</div>
            <div id="bbg_health" style="font-family:Orbitron,sans-serif;font-size:.82rem;color:${GREEN};min-width:40px;text-align:center">100</div>
          </div>
          <div style="text-align:center">
            <div style="font-family:Orbitron,sans-serif;font-size:.44rem;letter-spacing:.12em;color:rgba(255,255,255,.45)">STREAK</div>
            <div id="bbg_streak" style="font-family:Orbitron,sans-serif;font-size:.82rem;color:${GOLD};min-width:30px;text-align:center">0</div>
          </div>
        </div>
      </div>

      <!-- CLOCK & LEVEL BADGE -->
      <div id="bbg_clock_row" style="position:absolute;top:52px;left:0;right:0;z-index:9;display:flex;align-items:center;justify-content:center;gap:16px;padding:4px 16px">
        <div id="bbg_lvlbadge" style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.15em;padding:3px 10px;border:1px solid ${ACCENT_GL};border-radius:20px;color:${ACCENT_GL};background:rgba(26,42,74,.5)">LEVEL 1</div>
        <div id="bbg_clock" style="font-family:Orbitron,sans-serif;font-size:.95rem;color:#c7d9f5;letter-spacing:.08em">📅 Day <span id="bbg_day">1</span></div>
        <div id="bbg_score" style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.15em;padding:3px 10px;border:1px solid rgba(240,180,41,.4);border-radius:20px;color:${GOLD};background:rgba(240,180,41,.08)">SCORE: <span id="bbg_scoreval">0</span></div>
      </div>

      <!-- DISRUPTION BANNER -->
      <div id="bbg_disrupt" style="position:absolute;top:86px;left:16px;right:16px;z-index:9;display:none;text-align:center;padding:5px 12px;background:rgba(249,115,22,.18);border:1px solid rgba(249,115,22,.55);border-radius:8px;font-size:.7rem;color:#fed7aa;font-weight:600"></div>

      <!-- MAIN LAYOUT: sidebar + calendar -->
      <div id="bbg_layout" style="position:absolute;top:108px;left:0;right:0;bottom:0;display:flex;gap:0">
        <!-- BILL SIDEBAR -->
        <div id="bbg_sidebar" style="width:82px;flex-shrink:0;overflow-y:auto;overflow-x:hidden;padding:8px 4px 8px 6px;display:flex;flex-direction:column;gap:6px;border-right:1px solid rgba(74,122,191,.2);background:rgba(6,11,24,.8)">
          <div style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.35);text-align:center;margin-bottom:2px">BILLS</div>
          <div id="bbg_bill_list"></div>
        </div>
        <!-- CALENDAR AREA -->
        <div id="bbg_cal_wrap" style="flex:1;overflow:auto;padding:6px 6px 8px 6px">
          <div id="bbg_month_label" style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.2em;color:${ACCENT_GL};text-align:center;margin-bottom:6px">${MONTH_NAME}</div>
          <div id="bbg_cal_header" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:2px"></div>
          <div id="bbg_calendar" style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px"></div>
        </div>
      </div>

      <!-- DRONE CANVAS (floating payment drones overlay) -->
      <canvas id="bbg_canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:8"></canvas>

      <!-- END OVERLAY -->
      <div id="bbg_over" style="position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.88);backdrop-filter:blur(6px);padding:24px"></div>

      <!-- LEVEL TRANSITION -->
      <div id="bbg_lvltrans" style="position:absolute;inset:0;z-index:19;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.9);backdrop-filter:blur(5px)"></div>

      <!-- DRAG GHOST -->
      <div id="bbg_ghost" style="position:fixed;z-index:30;display:none;pointer-events:none;width:72px;text-align:center;transform:translate(-50%,-50%)"></div>
    </div>`;
  };

  /* ── QA debug hook (module state is private; this is the read/probe surface) ── */
  window._bbgDbg = function () {
    return G ? { level: G.level, phase: G.phase, bills: G.bills.length, disruptions: G.disruptions.length,
                 graceSec: G.bills[0] && G.bills[0].graceSec, onTime: G.onTime, late: G.late } : null;
  };
  window._bbgTest = function (action, arg) {
    if (!G) return;
    if (action === 'buildLevel') buildLevel(arg);
    if (action === 'completeAll') { G.bills.forEach(b => { b.paid = true; }); G.onTime = arg; checkLevelComplete(); }
  };

  /* ── Exit ────────────────────────────────────────────────────── */
  window.bud_billgridExit = function () {
    if (G && G.raf) { cancelAnimationFrame(G.raf); G.raf = null; }
    G = null;
    document.removeEventListener('keydown', handleKey);
    window.removeEventListener('mousemove', _onWindowMouseMove);
    window.removeEventListener('mouseup',   _onWindowMouseUp);
    if (window.state) state.viewingWorld = 'strategist';
    goTo('hub');
  };

  /* ── Init ────────────────────────────────────────────────────── */
  function initGame() {
    const root = document.getElementById('bbg_root');
    if (!root) return;

    G = {
      level:         1,
      phase:         'intro',   // 'intro' | 'play' | 'between' | 'over' — paused until START
      health:        100,
      streak:        0,
      bestStreak:    0,
      score:         0,
      onTime:        0,
      late:          0,
      missed:        0,
      bills:         [],        // active bill objects
      placed:        {},        // dayNum → billId
      drones:        [],        // animated drones
      disruptions:   [],        // active disruption event objects
      activeDisrupt: null,
      drag:          null,      // current drag state
      raf:           null,
      lastTs:        0,
      flashCells:    {},        // dayNum → { color, t }
      particles:     [],
    };

    buildLevel(1);
    startDroneLoop();
    wireInput();
    showHowToPlay();

    const backBtn = document.getElementById('bbg_back');
    if (backBtn) backBtn.onclick = window.bud_billgridExit;
  }

  /* ── How-to-play intro (shown once at start) + ❓ re-open mid-game ──── */
  function showHowToPlay() {
    const over = document.getElementById('bbg_over');
    if (!over) return;
    over.style.display = 'flex';
    over.style.flexDirection = 'column';
    over.style.alignItems = 'center';
    over.style.justifyContent = 'center';
    over.innerHTML = `
      <div style="max-width:340px;text-align:center">
        <div style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.2em;color:${ACCENT_GL};margin-bottom:10px">HOW TO PLAY</div>
        <div style="font-size:2rem;margin-bottom:8px">🧾</div>
        <div style="font-family:Orbitron,sans-serif;font-size:1rem;margin-bottom:14px">BILL MANAGEMENT GRID</div>
        <div style="display:flex;gap:8px;margin-bottom:16px;text-align:left">
          <div style="flex:1;background:rgba(255,255,255,.04);border-radius:9px;padding:9px 6px"><div style="font-size:1.1rem">👆</div><div style="font-size:.58rem;color:rgba(255,255,255,.6);margin-top:4px">Drag a bill from the sidebar</div></div>
          <div style="flex:1;background:rgba(255,255,255,.04);border-radius:9px;padding:9px 6px"><div style="font-size:1.1rem">📅</div><div style="font-size:.58rem;color:rgba(255,255,255,.6);margin-top:4px">Drop it on its due-date cell</div></div>
          <div style="flex:1;background:rgba(255,255,255,.04);border-radius:9px;padding:9px 6px"><div style="font-size:1.1rem">⏰</div><div style="font-size:.58rem;color:rgba(255,255,255,.6);margin-top:4px">Pay before the timer runs out!</div></div>
        </div>
        <p style="font-size:.78rem;color:rgba(255,255,255,.65);line-height:1.5;margin:0 0 18px">3 levels, each with more bills and real surprises — holidays, weekends and paycheck delays shift your due dates. Stay on time to protect your Budget Health.</p>
        <button id="bbg_startbtn" style="padding:13px 30px;border:none;border-radius:11px;background:linear-gradient(135deg,${ACCENT_LT},${ACCENT_GL});color:#fff;font-family:Orbitron,sans-serif;font-size:.68rem;letter-spacing:.12em;font-weight:900;cursor:pointer">${G.phase === 'intro' ? '▶ START' : '▶ RESUME'}</button>
      </div>`;
    const btn = document.getElementById('bbg_startbtn');
    if (btn) btn.onclick = () => {
      over.style.display = 'none'; over.innerHTML = '';
      if (G && G.phase === 'paused' && _pauseStartTs) {
        _levelStartTs += (Date.now() - _pauseStartTs);   // shift the clock — paused time doesn't burn grace periods
        _pauseStartTs = null;
      } else {
        _levelStartTs = Date.now();   // first-time intro: the clock hasn't meaningfully started yet
      }
      if (G) G.phase = 'play';
    };
  }
  let _pauseStartTs = null;
  window.bbgShowHelp = function () {
    if (!G || G.phase === 'over' || G.phase === 'between' || G.phase === 'intro') return;
    _pauseStartTs = Date.now();
    G.phase = 'paused';
    showHowToPlay();
  };

  /* ── Build a level ───────────────────────────────────────────── */
  function curLevel() { return LEVELS[(G.level || 1) - 1] || LEVELS[0]; }

  function buildLevel(lvl) {
    G.level = lvl;
    G.placed = {};
    G.drones = [];
    G.flashCells = {};
    G.particles = [];
    G.activeDisrupt = null;

    const lv = curLevel();
    G.bills = lv.ids.map(id => {
      const def = ALL_BILLS.find(b => b.id === id);
      return {
        ...def,
        paid:    false,
        overdue: false,
        graceExtra: 0,  // extra days from paycheck delay event
        overdueTimerStart: null,
        graceSec: lv.graceSec,
      };
    });

    G.disruptions = lv.disruptions.map(d => ({ ...d, triggered: false, active: false }));

    _levelStartTs = Date.now();
    updateLvlBadge();
    buildCalendar();
    renderBillList();
    updateHUD();
  }

  /* ── Calendar DOM ────────────────────────────────────────────── */
  function buildCalendar() {
    const header = document.getElementById('bbg_cal_header');
    const cal    = document.getElementById('bbg_calendar');
    if (!header || !cal) return;

    // Day-of-week headers
    header.innerHTML = DAY_LABELS.map(d =>
      `<div style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.1em;color:rgba(255,255,255,.35);text-align:center;padding:2px 0">${d}</div>`
    ).join('');

    // Blank cells before day 1
    let cells = '';
    for (let i = 0; i < MONTH_START_DOW; i++) {
      cells += `<div style="min-height:52px;background:rgba(6,11,24,.3);border-radius:5px;opacity:.2"></div>`;
    }

    // Day cells
    for (let day = 1; day <= DAYS_IN_MONTH; day++) {
      const bill     = G.bills.find(b => b.dueDay === day);
      const hasBill  = !!bill;
      const isWknd   = isDayWeekend(day);
      const dotColor = hasBill ? bill.color : 'transparent';
      cells += `<div id="bbg_cell_${day}"
        data-day="${day}"
        style="min-height:52px;border-radius:6px;padding:4px 3px;position:relative;
               background:${isWknd ? 'rgba(26,42,74,.15)' : 'rgba(14,24,50,.55)'};
               border:1px solid ${hasBill ? `rgba(74,122,191,.45)` : 'rgba(74,122,191,.12)'};
               box-sizing:border-box;cursor:default;transition:border-color .2s,background .2s">
          <div style="font-family:Orbitron,sans-serif;font-size:.5rem;color:rgba(255,255,255,.45);text-align:right;line-height:1">${day}</div>
          ${hasBill ? `<div class="bbg_due_dot" style="width:6px;height:6px;border-radius:50%;background:${dotColor};margin:2px auto 0;box-shadow:0 0 6px ${dotColor}"></div>
          <div id="bbg_celllabel_${day}" style="font-size:.45rem;color:rgba(255,255,255,.35);text-align:center;margin-top:1px;line-height:1.1">${bill.icon}</div>` : ''}
          <div id="bbg_cellbill_${day}" style="margin-top:2px"></div>
          <div id="bbg_timer_${day}" style="display:none;position:absolute;top:2px;left:3px;font-family:Orbitron,sans-serif;font-size:.42rem;color:${ORANGE};font-variant-numeric:tabular-nums"></div>
        </div>`;
    }

    cal.innerHTML = cells;

    // Wire drop targets
    for (let day = 1; day <= DAYS_IN_MONTH; day++) {
      const cell = document.getElementById(`bbg_cell_${day}`);
      if (cell) {
        cell.addEventListener('mouseup', () => handleDrop(day));
        cell.addEventListener('touchend', (e) => { e.preventDefault(); handleDrop(day); });
      }
    }
  }

  /* ── Bill Sidebar ────────────────────────────────────────────── */
  function renderBillList() {
    const list = document.getElementById('bbg_bill_list');
    if (!list) return;
    list.innerHTML = '';
    G.bills.forEach(bill => {
      if (bill.paid) return;
      const el = document.createElement('div');
      el.id = `bbg_bill_${bill.id}`;
      el.dataset.billid = bill.id;
      el.style.cssText = `
        width:70px;border-radius:8px;padding:5px 4px;text-align:center;cursor:grab;
        background:rgba(14,24,50,.8);border:1px solid ${bill.color}55;
        position:relative;box-sizing:border-box;margin-bottom:2px;
        transition:opacity .2s,transform .15s;touch-action:none;
        ${bill.overdue ? `box-shadow:0 0 10px ${RED}88;border-color:${RED};` : ''}
      `;
      el.innerHTML = `
        <div style="font-size:1.3rem;line-height:1.1">${bill.icon}</div>
        <div style="font-size:.5rem;color:rgba(255,255,255,.8);margin-top:2px;line-height:1.1;font-weight:600">${bill.label}</div>
        <div style="font-size:.55rem;color:${bill.color};font-family:Orbitron,sans-serif;font-variant-numeric:tabular-nums">${bill.amount}</div>
        <div style="font-size:.42rem;color:rgba(255,255,255,.4);margin-top:1px">due: <span style="color:${bill.color}">day ${bill.dueDay}</span></div>
        ${bill.overdue ? `<div style="font-size:.42rem;color:${RED};font-weight:700;margin-top:2px;animation:bbg_pulse 0.6s infinite">OVERDUE!</div>` : ''}
      `;
      wireCardDrag(el, bill.id);
      list.appendChild(el);
    });

    // CSS animation if not injected
    if (!document.getElementById('bbg_styles')) {
      const st = document.createElement('style');
      st.id = 'bbg_styles';
      st.textContent = `
        @keyframes bbg_pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes bbg_glow  { 0%,100%{box-shadow:0 0 8px ${ACCENT_GL}} 50%{box-shadow:0 0 22px ${ACCENT_GL}} }
        @keyframes bbg_drone_fly { 0%{opacity:0;transform:translateY(8px)} 10%{opacity:1} 90%{opacity:1} 100%{opacity:0;transform:translateY(-8px)} }
        @keyframes bbg_flash_green { 0%,100%{background:rgba(34,197,94,.0)} 30%{background:rgba(34,197,94,.35)} }
        @keyframes bbg_flash_red { 0%,100%{background:rgba(239,68,68,.0)} 30%{background:rgba(239,68,68,.35)} }
        @keyframes bbg_drop_in { 0%{opacity:0;transform:scale(.7)} 100%{opacity:1;transform:scale(1)} }
        @keyframes bbg_slide_in { 0%{opacity:0;transform:translateY(-12px)} 100%{opacity:1;transform:translateY(0)} }
        .bbg_cell_accept { border-color:${ACCENT_GL} !important; background:rgba(74,122,191,.22) !important; }
        .bbg_cell_reject { border-color:${RED} !important; background:rgba(239,68,68,.15) !important; }
      `;
      document.head.appendChild(st);
    }
  }

  /* ── Shared window-level drag handlers (single instance, removable on exit) ── */
  function _onWindowMouseMove(e) {
    if (!G || !G.drag) return;
    const ghost = document.getElementById('bbg_ghost');
    if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; }
  }
  function _onWindowMouseUp() {
    if (!G || !G.drag) return;
    const ghost = document.getElementById('bbg_ghost');
    if (ghost) ghost.style.display = 'none';
    // Restore opacity on the dragged card
    const draggedEl = document.getElementById(`bbg_bill_${G.drag.billId}`);
    if (draggedEl) { draggedEl.style.opacity = '1'; draggedEl.style.transform = 'scale(1)'; }
    clearDropHighlights();
    G.drag = null;
  }

  /* ── Drag ────────────────────────────────────────────────────── */
  function wireCardDrag(el, billId) {
    const ghost = document.getElementById('bbg_ghost');

    function startDrag(cx, cy) {
      if (!G || G.phase !== 'play') return;
      const bill = G.bills.find(b => b.id === billId);
      if (!bill || bill.paid) return;
      G.drag = { billId, startX: cx, startY: cy };
      el.style.opacity = '.4';
      el.style.transform = 'scale(.95)';
      ghost.innerHTML = `<div style="background:rgba(14,24,50,.95);border:1.5px solid ${bill.color};border-radius:10px;padding:6px 4px;text-align:center;box-shadow:0 0 18px ${bill.color}55">
        <div style="font-size:1.6rem">${bill.icon}</div>
        <div style="font-size:.55rem;color:rgba(255,255,255,.9);font-weight:700">${bill.label}</div>
        <div style="font-size:.6rem;color:${bill.color};font-family:Orbitron,sans-serif">${bill.amount}</div>
      </div>`;
      ghost.style.display = 'block';
      ghost.style.left = cx + 'px';
      ghost.style.top  = cy + 'px';
      highlightDropTargets(bill);
    }

    // Mouse — per-card mousedown only; move/up handled by shared window listeners
    el.addEventListener('mousedown', e => { e.preventDefault(); startDrag(e.clientX, e.clientY); });

    // Touch — per-card only
    el.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; startDrag(t.clientX, t.clientY); }, { passive: false });
    el.addEventListener('touchmove',  e => {
      e.preventDefault();
      if (!G || !G.drag || G.drag.billId !== billId) return;
      const t = e.touches[0];
      if (ghost) { ghost.style.left = t.clientX + 'px'; ghost.style.top = t.clientY + 'px'; }
    }, { passive: false });
    el.addEventListener('touchend', e => {
      e.preventDefault();
      if (!G || !G.drag || G.drag.billId !== billId) return;
      if (ghost) ghost.style.display = 'none';
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
      clearDropHighlights();
      G.drag = null;
    }, { passive: false });
  }

  function highlightDropTargets(bill) {
    for (let d = 1; d <= DAYS_IN_MONTH; d++) {
      const cell = document.getElementById(`bbg_cell_${d}`);
      if (!cell) continue;
      if (d === bill.dueDay) {
        cell.classList.add('bbg_cell_accept');
      } else if (isNearDue(d, bill.dueDay)) {
        cell.style.outline = `1px solid rgba(240,180,41,.35)`;
      }
    }
  }

  function isNearDue(day, dueDay) {
    return Math.abs(day - dueDay) <= 2;
  }

  function clearDropHighlights() {
    for (let d = 1; d <= DAYS_IN_MONTH; d++) {
      const cell = document.getElementById(`bbg_cell_${d}`);
      if (cell) { cell.classList.remove('bbg_cell_accept','bbg_cell_reject'); cell.style.outline = ''; }
    }
  }

  /* ── Drop ────────────────────────────────────────────────────── */
  function handleDrop(day) {
    if (!G || !G.drag || G.phase !== 'play') return;
    const bill = G.bills.find(b => b.id === G.drag.billId);
    if (!bill || bill.paid) { G.drag = null; return; }

    // Is day blocked by a disruption?
    const blocked = G.disruptions.some(d => d.triggered && d.affectDays && d.affectDays.includes(day));
    if (blocked) {
      showCellFlash(day, 'red');
      showFloatText(day, '❌ Blocked!', RED);
      G.drag = null;
      clearDropHighlights();
      const ghost = document.getElementById('bbg_ghost');
      if (ghost) ghost.style.display = 'none';
      const el = document.getElementById(`bbg_bill_${bill.id}`);
      if (el) { el.style.opacity = '1'; el.style.transform = 'scale(1)'; }
      return;
    }

    // Effective due day (may be shifted by paycheck delay)
    const effectiveDue = bill.dueDay + bill.graceExtra;
    const tolerance    = curLevel().tolerance; // levels 2-3 allow a day of slack

    // Correct drop?
    const isCorrect = (day === bill.dueDay) ||
                      (tolerance > 0 && day >= bill.dueDay - tolerance && day <= effectiveDue + tolerance);

    // Also: is it too early (paying before it's due is fine; paying day 1 for a day-30 bill scores normally)
    const isLate = day > effectiveDue + tolerance;

    G.drag = null;
    clearDropHighlights();
    const ghost = document.getElementById('bbg_ghost');
    if (ghost) ghost.style.display = 'none';
    const el = document.getElementById(`bbg_bill_${bill.id}`);
    if (el) { el.style.opacity = '1'; el.style.transform = 'scale(1)'; }

    if (isCorrect) {
      placeBill(bill, day, false);
    } else if (isLate) {
      placeBill(bill, day, true);
    } else {
      // Wrong day (off by too much)
      showCellFlash(day, 'red');
      showFloatText(day, `Wrong day!`, RED);
      const billEl = document.getElementById(`bbg_bill_${bill.id}`);
      if (billEl) { billEl.style.animation = 'none'; void billEl.offsetWidth; billEl.style.animation = 'bbg_pulse .4s 2'; }
      penalize(15);
    }
  }

  function placeBill(bill, day, late) {
    bill.paid = true;
    bill.overdue = false;
    G.placed[day] = bill.id;

    if (late || bill.overdue) {
      G.late++;
      G.streak = 0;
      penalize(20);
      showCellFlash(day, 'red');
      showFloatText(day, 'LATE! -20pts', RED);
    } else {
      G.onTime++;
      G.streak++;
      if (G.streak > G.bestStreak) G.bestStreak = G.streak;
      const pts = 50 + G.streak * 5;
      G.score += pts;
      gainHealth(5);
      showCellFlash(day, 'green');
      showFloatText(day, `+${pts} ON TIME!`, GREEN);
      launchDrone(bill, day);
    }

    renderCellBill(day, bill, late);
    hideOverdueTimer(day);

    // Remove from sidebar
    const el = document.getElementById(`bbg_bill_${bill.id}`);
    if (el) el.remove();

    updateHUD();
    checkLevelComplete();
  }

  function renderCellBill(day, bill, late) {
    const slot = document.getElementById(`bbg_cellbill_${day}`);
    if (!slot) return;
    slot.style.animation = 'bbg_drop_in .25s ease';
    slot.innerHTML = `<div style="background:${late ? RED : bill.color}22;border:1px solid ${late ? RED : bill.color}88;border-radius:4px;padding:2px 3px;text-align:center">
      <div style="font-size:.8rem;line-height:1">${bill.icon}</div>
      <div style="font-size:.4rem;color:${late ? RED : '#fff'};font-weight:600;line-height:1.1">${late ? 'LATE' : '✓ PAID'}</div>
    </div>`;
    // dim the due-date dot
    const dot = document.querySelector(`#bbg_cell_${day} .bbg_due_dot`);
    if (dot) dot.style.opacity = '.3';
  }

  /* ── Drone animation (canvas) ────────────────────────────────── */
  function launchDrone(bill, targetDay) {
    const sidebarEl = document.getElementById(`bbg_sidebar`);
    const cellEl    = document.getElementById(`bbg_cell_${targetDay}`);
    if (!sidebarEl || !cellEl) return;

    const sr = sidebarEl.getBoundingClientRect();
    const cr = cellEl.getBoundingClientRect();
    G.drones.push({
      icon:  bill.icon,
      color: bill.color,
      sx: sr.right - 10,
      sy: (sr.top + sr.bottom) / 2,
      ex: (cr.left + cr.right) / 2,
      ey: (cr.top + cr.bottom) / 2,
      t:  0,
      dur: 0.9,
      active: true,
    });
  }

  function startDroneLoop() {
    const canvas = document.getElementById('bbg_canvas');
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    let last = 0;
    function loop(ts) {
      if (!G) return;
      const dt = Math.min((ts - last) / 1000, 0.1);
      last = ts;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawDrones(ctx, dt);
      drawParticles(ctx, dt);
      updateOverdueTimers();
      G.raf = requestAnimationFrame(loop);
    }
    G.raf = requestAnimationFrame(loop);
  }

  function drawDrones(ctx, dt) {
    if (!G) return;
    G.drones = G.drones.filter(dr => dr.active);
    G.drones.forEach(dr => {
      dr.t = Math.min(dr.t + dt / dr.dur, 1);
      const ease = 1 - Math.pow(1 - dr.t, 3);
      const x = dr.sx + (dr.ex - dr.sx) * ease;
      // arc upward
      const arcY = -60 * Math.sin(dr.t * Math.PI);
      const y = dr.sy + (dr.ey - dr.sy) * ease + arcY;
      const alpha = dr.t < 0.08 ? dr.t / 0.08 : dr.t > 0.88 ? (1 - dr.t) / 0.12 : 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      // drone body
      ctx.fillStyle = dr.color;
      ctx.shadowColor = dr.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      // icon
      ctx.shadowBlur = 0;
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(dr.icon, x, y);
      // trail
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.moveTo(dr.sx + (dr.ex - dr.sx) * ease * 0.85, dr.sy + (dr.ey - dr.sy) * ease * 0.85 + arcY * 0.85);
      ctx.lineTo(x, y);
      ctx.strokeStyle = dr.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      if (dr.t >= 1) {
        dr.active = false;
        spawnParticles(dr.ex, dr.ey, dr.color);
      }
    });
  }

  function spawnParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.4;
      G.particles.push({
        x, y, color,
        vx: Math.cos(angle) * (1.5 + Math.random() * 2.5),
        vy: Math.sin(angle) * (1.5 + Math.random() * 2.5),
        r: 3 + Math.random() * 3,
        life: 1,
      });
    }
  }

  function drawParticles(ctx, dt) {
    if (!G) return;
    G.particles = G.particles.filter(p => p.life > 0);
    G.particles.forEach(p => {
      p.life -= dt * 2.5;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /* ── Overdue timers ──────────────────────────────────────────── */
  let _timerBase = Date.now();
  let _levelStartTs = Date.now();

  function updateOverdueTimers() {
    if (!G || G.phase !== 'play') return;
    const now  = Date.now();
    const elapsed = (now - _levelStartTs) / 1000; // seconds since level start

    G.bills.forEach(bill => {
      if (bill.paid) return;

      // When does the clock "reach" this bill's due date? Each level has its
      // own month length (monthSecs) — higher levels run faster.
      const gameDayNow = 1 + elapsed * (DAYS_IN_MONTH / curLevel().monthSecs);
      const effectiveDue = bill.dueDay + bill.graceExtra;

      if (gameDayNow > effectiveDue && !bill.overdue) {
        // Start overdue timer
        if (!bill.overdueTimerStart) bill.overdueTimerStart = now;
        const od = (now - bill.overdueTimerStart) / 1000;
        showOverdueTimer(bill, od);

        if (od > bill.graceSec && !bill.penaltyApplied) {
          // Grace period expired → overdue penalty
          bill.overdue = true;
          bill.penaltyApplied = true;
          penalize(25);
          G.late++;
          G.streak = 0;
          updateHUD();
          const el = document.getElementById(`bbg_bill_${bill.id}`);
          if (el) {
            el.style.borderColor = RED;
            el.style.boxShadow   = `0 0 14px ${RED}99`;
          }
          // Re-render bill list to show OVERDUE
          renderBillList();
          rewireAllBillDrags();
        }
      }

      // Update the in-game day counter
      const dayDisp = document.getElementById('bbg_day');
      if (dayDisp) dayDisp.textContent = Math.min(30, Math.ceil(gameDayNow));

      // Trigger disruption events (levels 2-3 both carry a disruption list)
      if (G.disruptions.length) checkDisruptions(gameDayNow);
    });
  }

  function showOverdueTimer(bill, seconds) {
    const timerEl = document.getElementById(`bbg_timer_${bill.dueDay}`);
    if (!timerEl) return;
    const remaining = Math.max(0, bill.graceSec - seconds);
    timerEl.style.display = 'block';
    timerEl.textContent = `⏰${remaining.toFixed(0)}s`;
    timerEl.style.color = remaining < 5 ? RED : ORANGE;
  }

  function hideOverdueTimer(day) {
    const timerEl = document.getElementById(`bbg_timer_${day}`);
    if (timerEl) timerEl.style.display = 'none';
  }

  /* ── Disruptions (Levels 2-3, each with its own event mix) ────── */
  function checkDisruptions(gameDayNow) {
    G.disruptions.forEach(ev => {
      if (ev.triggered) return;
      if (gameDayNow >= ev.day) {
        ev.triggered = true;
        ev.active    = true;
        G.activeDisrupt = ev;
        showDisruptBanner(ev);

        if (ev.type === 'paycheck') {
          // Give extra grace to bills due after graceFrom
          G.bills.forEach(b => {
            if (!b.paid && b.dueDay >= ev.graceFrom && b.dueDay <= ev.graceTo) {
              b.graceExtra += ev.bonusDays;
            }
          });
        }

        // Hide banner after 5s
        setTimeout(() => {
          ev.active = false;
          if (G.activeDisrupt === ev) G.activeDisrupt = null;
          const banner = document.getElementById('bbg_disrupt');
          if (banner) banner.style.display = 'none';
        }, 5000);
      }
    });
  }

  function showDisruptBanner(ev) {
    const banner = document.getElementById('bbg_disrupt');
    if (!banner) return;
    banner.textContent = ev.label;
    banner.style.display = 'block';
    banner.style.animation = 'bbg_slide_in .4s ease';
  }

  /* ── Weekend helper ──────────────────────────────────────────── */
  function isDayWeekend(day) {
    // June 2026: day 1 = Mon (dow 1). Sat=6, Sun=0
    const dow = (MONTH_START_DOW + day - 1) % 7;
    return dow === 0 || dow === 6;
  }

  /* ── Cell flash ──────────────────────────────────────────────── */
  function showCellFlash(day, type) {
    const cell = document.getElementById(`bbg_cell_${day}`);
    if (!cell) return;
    cell.style.animation = 'none';
    void cell.offsetWidth;
    cell.style.animation = `bbg_flash_${type} .5s ease`;
    setTimeout(() => { if (cell) cell.style.animation = ''; }, 600);
  }

  /* ── Float text ──────────────────────────────────────────────── */
  function showFloatText(day, text, color) {
    const cell = document.getElementById(`bbg_cell_${day}`);
    if (!cell) return;
    const r = cell.getBoundingClientRect();
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;left:${(r.left+r.right)/2}px;top:${r.top}px;
      transform:translateX(-50%);z-index:25;
      font-family:Orbitron,sans-serif;font-size:.6rem;color:${color};
      font-weight:700;pointer-events:none;white-space:nowrap;
      text-shadow:0 0 10px ${color};
      animation:bbg_slide_in .3s ease;
    `;
    el.textContent = text;
    document.body.appendChild(el);
    let y = 0;
    const fly = setInterval(() => {
      y -= 1.5;
      el.style.top = (r.top + y) + 'px';
      el.style.opacity = String(Math.max(0, 1 - Math.abs(y) / 45));
      if (Math.abs(y) > 44) { clearInterval(fly); el.remove(); }
    }, 20);
  }

  /* ── HUD update ──────────────────────────────────────────────── */
  function updateHUD() {
    const hel  = document.getElementById('bbg_health');
    const stel = document.getElementById('bbg_streak');
    const scel = document.getElementById('bbg_scoreval');
    if (hel)  { hel.textContent = Math.max(0, Math.round(G.health)); hel.style.color = G.health >= 70 ? GREEN : G.health >= 40 ? GOLD : RED; }
    if (stel) stel.textContent = G.streak;
    if (scel) scel.textContent = G.score;
  }

  function updateLvlBadge() {
    const badge = document.getElementById('bbg_lvlbadge');
    if (badge) badge.textContent = `LEVEL ${G.level}/3 — ${curLevel().name}`;
  }

  function penalize(pts) {
    G.health = Math.max(0, G.health - pts);
    G.score  = Math.max(0, G.score - Math.round(pts / 2));
    updateHUD();
    if (G.health <= 0) triggerGameOver(false);
  }

  function gainHealth(pts) {
    G.health = Math.min(100, G.health + pts);
    updateHUD();
  }

  /* ── Level completion check ──────────────────────────────────── */
  function checkLevelComplete() {
    const unpaid = G.bills.filter(b => !b.paid);
    if (unpaid.length > 0) return;

    if (G.level < 3) {
      // Advance to the next level
      G.phase = 'between';
      setTimeout(() => showLevelTransition(), 400);
    } else {
      // All 3 levels done — win!
      triggerGameOver(true);
    }
  }

  const TRANSITION_COPY = {
    1: 'You mastered the basics. Now face 10 new bills with disruption events — a bank holiday and a paycheck delay!',
    2: 'Nice adapting! Level 3 brings 14 new household bills, a faster month, tighter grace periods, and THREE disruptions in one run.',
  };

  function showLevelTransition() {
    const trans = document.getElementById('bbg_lvltrans');
    if (!trans) return;
    const justDone = G.level, next = justDone + 1;
    trans.style.display = 'flex';
    trans.style.flexDirection = 'column';
    trans.style.alignItems = 'center';
    trans.style.justifyContent = 'center';
    trans.innerHTML = `
      <div style="text-align:center;max-width:320px">
        <div style="font-size:2.5rem;margin-bottom:12px">🎉</div>
        <div style="font-family:Orbitron,sans-serif;font-size:1rem;color:${GREEN};letter-spacing:.15em;margin-bottom:8px">LEVEL ${justDone} COMPLETE!</div>
        <div style="color:rgba(255,255,255,.7);font-size:.8rem;margin-bottom:20px;line-height:1.6">${TRANSITION_COPY[justDone] || ''}</div>
        <div style="display:flex;gap:16px;justify-content:center;margin-bottom:16px">
          <div style="text-align:center">
            <div style="font-family:Orbitron,sans-serif;font-size:1.2rem;color:${GREEN}">${G.onTime}</div>
            <div style="font-size:.55rem;color:rgba(255,255,255,.5)">ON TIME</div>
          </div>
          <div style="text-align:center">
            <div style="font-family:Orbitron,sans-serif;font-size:1.2rem;color:${RED}">${G.late}</div>
            <div style="font-size:.55rem;color:rgba(255,255,255,.5)">LATE</div>
          </div>
          <div style="text-align:center">
            <div style="font-family:Orbitron,sans-serif;font-size:1.2rem;color:${GOLD}">${G.streak}</div>
            <div style="font-size:.55rem;color:rgba(255,255,255,.5)">STREAK</div>
          </div>
        </div>
        <button id="bbg_goL2" style="padding:12px 32px;font-family:Orbitron,sans-serif;font-size:.75rem;letter-spacing:.15em;border:none;border-radius:10px;background:linear-gradient(135deg,${ACCENT_LT},${ACCENT_GL});color:#fff;cursor:pointer;box-shadow:0 0 20px ${ACCENT_GL}55">ADVANCE TO LEVEL ${next} →</button>
      </div>`;
    const btn = document.getElementById('bbg_goL2');
    if (btn) btn.onclick = () => {
      trans.style.display = 'none';
      G.phase = 'play';
      buildLevel(next);   // buildLevel() sets _levelStartTs itself
      renderBillList();
      rewireAllBillDrags();
    };
  }

  /* ── Game over ───────────────────────────────────────────────── */
  // Win only happens once ALL 3 levels are cleared (see checkLevelComplete),
  // so stars are judged on the CUMULATIVE run across every level played.
  const TOTAL_BILLS = LEVELS.reduce((s, l) => s + l.ids.length, 0);
  const TOTAL_LATE_OK = LEVELS.reduce((s, l) => s + l.lateAllow, 0);

  function triggerGameOver(won) {
    if (!G || G.phase === 'over') return;
    G.phase = 'over';

    const perfWin  = G.late === 0 && G.onTime >= TOTAL_BILLS;
    const goodWin  = G.late <= TOTAL_LATE_OK && won;
    const stars    = perfWin ? 3 : (goodWin ? 2 : (won ? 1 : 0));
    const finalStars = Math.max(1, stars); // at least 1 if they finish
    endGame(won ? finalStars : 0, won);
  }

  function endGame(stars, won) {
    if (!G) return;
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bud_billgrid', { level: G.level, stars, badge: 'Bill Master', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    // feed shared Budgetron Budget Meter — net of on-time vs late bills
    if (window.budgetDelta) budgetDelta(won ? G.onTime * 40 - G.late * 100 : -400);

    const over = document.getElementById('bbg_over');
    if (!over) return;

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const healthColor = G.health >= 70 ? GREEN : G.health >= 40 ? GOLD : RED;

    over.style.display = 'flex';
    over.style.flexDirection = 'column';
    over.style.alignItems = 'center';
    over.style.justifyContent = 'center';
    over.innerHTML = `
      <div style="text-align:center;max-width:340px;animation:bbg_drop_in .4s ease">
        <div style="font-size:2.2rem;margin-bottom:6px">${won ? '🏆' : '💸'}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:1.05rem;color:${won ? GREEN : RED};letter-spacing:.15em;margin-bottom:12px">${won ? 'MONTH COMPLETE!' : 'TOO MANY LATE BILLS'}</div>
        <div style="font-size:1.9rem;margin-bottom:8px;letter-spacing:.08em">${starStr}</div>

        <!-- Stats grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
          ${statBox('ON TIME', G.onTime, GREEN)}
          ${statBox('LATE', G.late, RED)}
          ${statBox('STREAK', G.bestStreak, GOLD)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          ${statBox('SCORE', G.score, ACCENT_GL)}
          ${statBox('HEALTH', Math.round(G.health) + '%', healthColor)}
        </div>

        ${coins > 0 ? `<div style="font-family:Orbitron,sans-serif;font-size:.7rem;color:${GOLD};margin-bottom:12px;letter-spacing:.12em">+${coins} COINS EARNED 🪙</div>` : ''}

        <!-- Lesson -->
        <div style="background:rgba(26,42,74,.5);border:1px solid ${ACCENT_GL}44;border-radius:10px;padding:12px 16px;margin-bottom:18px;text-align:left">
          <div style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.15em;color:${ACCENT_GL};margin-bottom:6px">END LESSON</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.85);line-height:1.6">Late payments cost more than the bill itself — fees, credit damage, and stress add up fast. Knowing every due date and scheduling payments in advance is the simplest money habit that protects everything else.</div>
        </div>

        <div style="display:flex;gap:12px;justify-content:center">
          <button id="bbg_replay" style="padding:11px 22px;font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.12em;border:1px solid ${ACCENT_GL};border-radius:10px;background:rgba(74,122,191,.2);color:${ACCENT_GL};cursor:pointer">PLAY AGAIN</button>
          <button id="bbg_tohub"  style="padding:11px 22px;font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.12em;border:none;border-radius:10px;background:linear-gradient(135deg,${ACCENT_LT},${ACCENT_GL});color:#fff;cursor:pointer">← HUB</button>
        </div>
      </div>`;

    document.getElementById('bbg_replay').onclick = () => {
      over.style.display = 'none';
      if (G && G.raf) { cancelAnimationFrame(G.raf); G.raf = null; }
      G = null;
      initGame();
    };
    document.getElementById('bbg_tohub').onclick = window.bud_billgridExit;
  }

  function statBox(label, value, color) {
    return `<div style="background:rgba(14,24,50,.7);border:1px solid ${color}33;border-radius:8px;padding:8px 6px;text-align:center">
      <div style="font-family:Orbitron,sans-serif;font-size:1rem;color:${color};font-variant-numeric:tabular-nums">${value}</div>
      <div style="font-size:.45rem;color:rgba(255,255,255,.4);letter-spacing:.1em;margin-top:2px">${label}</div>
    </div>`;
  }

  /* ── Keyboard support ────────────────────────────────────────── */
  function wireInput() {
    _levelStartTs = Date.now();
    // Keyboard: press digit keys 1-9, 0 to quick-pay first overdue bill
    document.addEventListener('keydown', handleKey);
    // Single shared window listeners for drag (registered once, removed on exit)
    window.addEventListener('mousemove', _onWindowMouseMove);
    window.addEventListener('mouseup',   _onWindowMouseUp);
  }

  function handleKey(e) {
    if (!G || G.phase !== 'play') return;
    // No keyboard shortcuts for this drag game; left for future extension
  }

  /* ── Re-wire all drags after re-render ───────────────────────── */
  function rewireAllBillDrags() {
    G.bills.forEach(bill => {
      if (bill.paid) return;
      const el = document.getElementById(`bbg_bill_${bill.id}`);
      if (el) wireCardDrag(el, bill.id);
    });
  }

})();
