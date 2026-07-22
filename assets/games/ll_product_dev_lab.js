/* ════════════════════════════════════════════════════════════════
   PRODUCT DEVELOPMENT LAB — Launch Lab · Risk Taker Hub
   Puzzle + Upgrade: allocate budget & dev time across upgrades
   to maximise Customer Satisfaction before launch.
   Level 1 (Learn)  : single product, generous budget, 40 s timer.
   Level 2 (Master) : 3 products in sequence, random bugs, customer
                      feedback cards demanding specific features.
   Level 3 (Founder): 5 products in sequence, tighter budget & timer,
                      higher bug/feedback rates + exclusive tougher
                      bug & feedback content. Only Level 3 completion
                      triggers the final scored result screen.
   Screen ID : game_ll_product_dev_lab
   Hub       : risktaker (#7C3AED)
   Exit fn   : window.ll_product_dev_labExit
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── palette ───────────────────────────────────────────────── */
  const BG      = '#03040c';
  const ACCENT  = '#7C3AED';
  const AC2     = '#9D5FFF';
  const AC3     = '#BF8FFF';
  const GOLD    = '#F5C842';
  const GREEN   = '#22D3A5';
  const RED     = '#EF4444';
  const CYAN    = '#00E5FF';
  const AMBER   = '#F59E0B';
  const DARK    = '#0D0818';
  const PANEL   = 'rgba(20,10,40,0.92)';

  /* ── upgrade catalogue ─────────────────────────────────────── */
  const ALL_UPGRADES = [
    {
      id: 'quality',
      label: 'Improve Quality',
      icon: '🔬',
      desc: 'Better materials & QA testing. High customer impact.',
      cost: 120,
      time: 7,
      sat: 20,
      pillar: 'quality',
    },
    {
      id: 'design',
      label: 'Improve Design',
      icon: '🎨',
      desc: 'Sleeker UI & packaging. Customers notice it immediately.',
      cost: 90,
      time: 5,
      sat: 16,
      pillar: 'design',
    },
    {
      id: 'bugfix',
      label: 'Fix Bugs',
      icon: '🐛',
      desc: 'Squash crashes & glitches. Required before launch.',
      cost: 60,
      time: 4,
      sat: 12,
      pillar: 'bugs',
    },
    {
      id: 'features',
      label: 'Add Features',
      icon: '⚙️',
      desc: 'New capabilities customers asked for. Big bang.',
      cost: 150,
      time: 8,
      sat: 22,
      pillar: 'features',
    },
    {
      id: 'durability',
      label: 'Increase Durability',
      icon: '🛡️',
      desc: 'Stronger build. Reduces returns & complaints.',
      cost: 80,
      time: 5,
      sat: 14,
      pillar: 'durability',
    },
    {
      id: 'marketing',
      label: 'Polish Marketing',
      icon: '📣',
      desc: 'Better launch copy & visuals. Amplifies satisfaction.',
      cost: 70,
      time: 3,
      sat: 10,
      pillar: 'marketing',
    },
    {
      id: 'testing',
      label: 'Beta Test',
      icon: '🧪',
      desc: 'Real user testing reveals hidden issues. Safe launch.',
      cost: 100,
      time: 6,
      sat: 15,
      pillar: 'testing',
    },
    {
      id: 'speed',
      label: 'Optimise Speed',
      icon: '⚡',
      desc: 'Faster performance. Customers love snappy products.',
      cost: 110,
      time: 6,
      sat: 17,
      pillar: 'speed',
    },
  ];

  /* ── product definitions ────────────────────────────────────── */
  const PRODUCTS = [
    {
      name: 'SmartWidget X',
      icon: '📱',
      desc: 'A connected consumer device',
      color: AC2,
      baseSat: 30,
    },
    {
      name: 'AeroBot Pro',
      icon: '🤖',
      desc: 'An autonomous assistant drone',
      color: CYAN,
      baseSat: 25,
    },
    {
      name: 'VaultPay App',
      icon: '💳',
      desc: 'A fintech payments platform',
      color: GREEN,
      baseSat: 28,
    },
    {
      name: 'NestHub Home',
      icon: '🏠',
      desc: 'A smart home control hub',
      color: GOLD,
      baseSat: 24,
    },
    {
      name: 'PulseBand Fit',
      icon: '⌚',
      desc: 'A wearable health tracker',
      color: RED,
      baseSat: 22,
    },
  ];

  /* ── bug types (Level 2+) ───────────────────────────────────── */
  const BUG_TYPES = [
    { label: 'Memory Leak', icon: '💾', cost: 50, time: 3, satPenalty: 8 },
    { label: 'UI Glitch',   icon: '🖥️', cost: 40, time: 2, satPenalty: 6 },
    { label: 'Crash Loop',  icon: '💥', cost: 80, time: 5, satPenalty: 14 },
    { label: 'Data Corruption', icon: '⚠️', cost: 70, time: 4, satPenalty: 12 },
  ];

  /* ── bug types exclusive to Level 3 (tougher, bigger penalties) ─ */
  const BUG_TYPES_L3 = [
    { label: 'Security Breach', icon: '🔓', cost: 110, time: 6, satPenalty: 18 },
    { label: 'Server Outage',   icon: '📡', cost: 95,  time: 5, satPenalty: 16 },
  ];

  /* ── customer feedback cards (Level 2+) ────────────────────── */
  const FEEDBACK_CARDS = [
    { demand: 'features',    text: '"I need more features NOW!"',  icon: '😤', bonusSat: 8 },
    { demand: 'design',      text: '"The design looks outdated."', icon: '😒', bonusSat: 6 },
    { demand: 'bugfix',      text: '"Fix the bugs before launch!"',icon: '🐛', bonusSat: 10 },
    { demand: 'quality',     text: '"Quality is not up to mark."', icon: '😠', bonusSat: 8 },
    { demand: 'speed',       text: '"It\'s way too slow!"',         icon: '🐌', bonusSat: 7 },
    { demand: 'durability',  text: '"This will break in a week."', icon: '😬', bonusSat: 7 },
  ];

  /* ── customer feedback cards exclusive to Level 3 ───────────── */
  const FEEDBACK_CARDS_L3 = [
    { demand: 'features',    text: '"Your competitor has way more features!"', icon: '📊', bonusSat: 10 },
    { demand: 'testing',     text: '"Did you even test this thing?!"',         icon: '🧐', bonusSat: 9 },
  ];

  /* ── level configs ──────────────────────────────────────────── */
  const L1_CONFIG = {
    budget:        700,
    timeLimit:     40,   // seconds
    productCount:  1,
    upgrades:      ['quality','design','bugfix','features','durability'],
    bugChance:     0,
    feedbackChance:0,
    launchThreshold: 50,  // min sat to launch
  };

  const L2_CONFIG = {
    budget:        550,     // per product
    timeLimit:     35,      // per product
    productCount:  3,
    upgrades:      ['quality','design','bugfix','features','durability','marketing','testing','speed'],
    bugChance:     0.4,     // roll per product
    feedbackChance:0.6,
    launchThreshold: 55,
  };

  const L3_CONFIG = {
    budget:        520,     // per product — slightly tighter than L2, pressure comes mainly from time/bugs/feedback
    timeLimit:     28,      // per product — noticeably tighter than L2's 35s
    productCount:  5,       // more products in sequence than L2's 3
    upgrades:      ['quality','design','bugfix','features','durability','marketing','testing','speed'],
    bugChance:     0.6,     // roll per product — higher than L2's 0.4
    feedbackChance:0.75,    // higher than L2's 0.6
    launchThreshold: 62,    // higher than L2's 55
  };

  /* ── scoring thresholds ─────────────────────────────────────── */
  const STAR3_SAT  = 80;   // avg satisfaction across all products
  const STAR3_EFF  = 0.30; // budget remaining ratio bonus (>30% left)
  const STAR2_SAT  = 60;
  const MIN_LAUNCH  = 45;  // below this = LOSS

  /* ── state ─────────────────────────────────────────────────── */
  let G = null;
  let _pdlSeenIntro = false; // module-level so it survives level-up/replay (which recreate G), like ll_scaling_center.js's _scSeenIntro

  /* ── screen registration ────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_ll_product_dev_lab = function () {
    G = null;
    setTimeout(initGame, 40);
    return buildShell();
  };

  /* ── shell HTML ─────────────────────────────────────────────── */
  function buildShell() {
    return `
<style id="pdl_styles">
  #pdl_root { position:absolute;inset:0;background:radial-gradient(130% 95% at 50% -8%, ${ACCENT}26, #150a2c 44%, ${BG} 100%);overflow:hidden;
    font-family:Inter,sans-serif;color:#fff;user-select:none; }

  /* ambient scanlines */
  #pdl_root::before {
    content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:repeating-linear-gradient(
      0deg,
      transparent 0px, transparent 3px,
      rgba(124,58,237,.03) 3px, rgba(124,58,237,.03) 4px
    );
  }

  /* conveyor belt animation */
  @keyframes pdl_belt {
    from { background-position: 0 0; }
    to   { background-position: 60px 0; }
  }
  @keyframes pdl_glow_pulse {
    0%,100% { box-shadow: 0 0 16px ${ACCENT}44; }
    50%      { box-shadow: 0 0 32px ${ACCENT}88, 0 0 60px ${ACCENT}33; }
  }
  @keyframes pdl_arm_wave {
    0%,100% { transform: rotate(-8deg); }
    50%      { transform: rotate(8deg); }
  }
  @keyframes pdl_printer_bounce {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-4px); }
  }
  @keyframes pdl_card_in {
    from { transform: translateY(20px) scale(.93); opacity:0; }
    to   { transform: translateY(0) scale(1); opacity:1; }
  }
  @keyframes pdl_shake {
    0%,100% { transform:translateX(0); }
    20%      { transform:translateX(-7px); }
    40%      { transform:translateX(7px); }
    60%      { transform:translateX(-4px); }
    80%      { transform:translateX(4px); }
  }
  @keyframes pdl_result_in {
    from { transform:translateY(32px) scale(.94); opacity:0; }
    to   { transform:translateY(0) scale(1); opacity:1; }
  }
  /* win-only end-screen entrance: bouncy scale+rotate pop, distinct from the
     loss screen's plain pdl_result_in fade (see endGame()) */
  @keyframes pdl_win_pop {
    0%   { transform:scale(.4) rotate(-8deg); opacity:0; }
    60%  { transform:scale(1.08) rotate(2deg); opacity:1; }
    100% { transform:scale(1) rotate(0deg); opacity:1; }
  }
  /* floating "+N SAT" label spawned at a bug chip's location (see
     spawnFloatingGain / fixBug) */
  @keyframes pdl_float_gain {
    0%   { transform:translate(-50%,-50%) scale(.7); opacity:0; }
    25%  { transform:translate(-50%,-70%) scale(1.1); opacity:1; }
    100% { transform:translate(-50%,-140%) scale(1); opacity:0; }
  }
  @keyframes pdl_confetti_fall {
    0%   { transform:translateY(-30px) rotate(0deg); opacity:1; }
    100% { transform:translateY(480px) rotate(360deg); opacity:0; }
  }
  @keyframes pdl_win_shine { to { background-position:-20% 0; } }
  .pdl-winshine::before {
    content:'';position:absolute;inset:0;
    background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.16) 48%,transparent 66%);
    background-size:220% 100%;background-position:120% 0;
    animation:pdl_win_shine 2.2s ease-in-out .3s 1;pointer-events:none;border-radius:inherit;
  }
  @keyframes pdl_star_pop {
    0%   { transform:scale(0) rotate(-20deg); opacity:0; }
    70%  { transform:scale(1.2) rotate(5deg);  opacity:1; }
    100% { transform:scale(1) rotate(0deg); opacity:1; }
  }
  @keyframes pdl_scan {
    from { transform:translateX(-100%); }
    to   { transform:translateX(400%); }
  }
  @keyframes pdl_fab_spin {
    0%   { transform:rotate(0deg); }
    100% { transform:rotate(360deg); }
  }
  @keyframes pdl_bug_wiggle {
    0%,100% { transform:rotate(-6deg) scale(1); }
    50%      { transform:rotate(6deg) scale(1.1); }
  }
  @keyframes pdl_bar_fill {
    from { width:0%; }
  }
  @keyframes pdl_tick {
    0%   { opacity:1; }
    50%  { opacity:.5; }
    100% { opacity:1; }
  }
  .pdl-upgrade-btn {
    position:relative;overflow:hidden;
    border-radius:12px;padding:10px 12px;
    cursor:pointer;transition:transform .12s, box-shadow .12s;
    border:1px solid ${ACCENT}55;
    background:linear-gradient(145deg,rgba(40,10,80,.9),rgba(20,5,40,.95));
    text-align:left;width:100%;box-sizing:border-box;
    display:flex;align-items:center;gap:10px;
    animation:pdl_card_in .22s ease both;
  }
  .pdl-upgrade-btn:hover:not(:disabled) {
    transform:translateY(-2px);
    box-shadow:0 0 18px ${ACCENT}55;
    border-color:${AC2}88;
  }
  .pdl-upgrade-btn:active:not(:disabled) { transform:scale(.97); }
  .pdl-upgrade-btn:disabled {
    opacity:.38;cursor:not-allowed;filter:grayscale(.6);
  }
  .pdl-upgrade-btn::after {
    content:'';position:absolute;top:0;left:-100%;width:40%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);
    transition:left .4s;
  }
  .pdl-upgrade-btn:hover::after { left:160%; }

  .pdl-bug-chip {
    display:inline-flex;align-items:center;gap:5px;
    padding:5px 10px;border-radius:20px;
    background:rgba(239,68,68,.15);border:1px solid ${RED}55;
    font-size:.65rem;color:${RED};cursor:pointer;
    animation:pdl_bug_wiggle .8s ease infinite;
    transition:background .15s;
  }
  .pdl-bug-chip:hover { background:rgba(239,68,68,.28); }

  .pdl-feedback-card {
    border-radius:12px;padding:10px 12px;
    background:rgba(245,198,66,.08);border:1px solid ${AMBER}44;
    animation:pdl_card_in .3s ease both;
    font-size:.68rem;line-height:1.5;
  }

  .pdl-sat-star { animation:pdl_star_pop .35s ease both; display:inline-block; }

  #pdl_timer_ring {
    transition:stroke-dashoffset .9s linear;
  }

  .pdl-panel {
    background:${PANEL};
    border:1px solid ${ACCENT}33;
    border-radius:14px;
  }
</style>

<div id="pdl_root" style="z-index:1">

  <!-- ═══ AMBIENT CANVAS ═══ -->
  <canvas id="pdl_canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.55"></canvas>

  <!-- ═══ TOP BAR ═══ -->
  <div id="pdl_topbar" style="
    position:absolute;top:0;left:0;right:0;z-index:30;
    display:flex;align-items:center;gap:8px;padding:8px 12px;
    background:linear-gradient(180deg,rgba(3,4,12,.95) 0%,rgba(3,4,12,.6) 100%);
    border-bottom:1px solid ${ACCENT}33;
  ">
    <button onclick="window.ll_product_dev_labExit()" style="
      padding:5px 12px;border:1px solid ${ACCENT}55;border-radius:8px;
      background:rgba(124,58,237,.1);color:${AC3};
      font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.14em;
      cursor:pointer;flex-shrink:0;transition:background .15s;
    " onmouseover="this.style.background='rgba(124,58,237,.25)'" onmouseout="this.style.background='rgba(124,58,237,.1)'">← HUB</button>

    <div style="font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.18em;color:${AC2};
      flex:1;text-align:center;text-shadow:0 0 14px ${ACCENT}88;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
      PRODUCT DEV LAB
    </div>

    <button onclick="window.pdlShowHelp()" title="How to play" style="
      padding:5px 9px;border:1px solid ${ACCENT}55;border-radius:8px;
      background:rgba(124,58,237,.1);color:${AC3};cursor:pointer;flex-shrink:0;font-size:.72rem;
    ">❓</button>

    <div style="display:flex;gap:10px;align-items:center;flex-shrink:0">
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.38rem;color:#555;letter-spacing:.1em">PRODUCT</div>
        <div id="pdl_product_label" style="font-family:Orbitron,sans-serif;font-size:.7rem;color:${AC2};font-variant-numeric:tabular-nums">1/1</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.38rem;color:#555;letter-spacing:.1em">BUDGET</div>
        <div id="pdl_budget_label" style="font-family:Orbitron,sans-serif;font-size:.7rem;color:${GREEN};font-variant-numeric:tabular-nums">$700</div>
      </div>
    </div>
  </div>

  <!-- ═══ MAIN LAYOUT ═══ -->
  <div style="position:absolute;top:46px;bottom:0;left:0;right:0;display:flex;flex-direction:column;z-index:2;overflow:hidden">

    <!-- PRODUCT + TIMER + SAT ROW -->
    <div id="pdl_product_row" style="
      padding:10px 12px 6px;
      display:flex;gap:10px;align-items:stretch;flex-shrink:0;
    ">
      <!-- Product card -->
      <div id="pdl_product_card" class="pdl-panel" style="
        flex:1;padding:12px 14px;
        display:flex;align-items:center;gap:12px;
        position:relative;overflow:hidden;
        border-color:${ACCENT}55;
      ">
        <!-- scan line effect -->
        <div style="position:absolute;top:0;bottom:0;width:20%;
          background:linear-gradient(90deg,transparent,rgba(124,58,237,.08),transparent);
          animation:pdl_scan 3s linear infinite;pointer-events:none"></div>

        <!-- Robotic arm (decorative) -->
        <div style="font-size:1.8rem;animation:pdl_arm_wave 2.5s ease-in-out infinite;transform-origin:bottom center;flex-shrink:0">🦾</div>
        <div style="flex:1;min-width:0">
          <div id="pdl_prod_icon" style="font-size:1.6rem;display:inline-block;animation:pdl_printer_bounce 1.8s ease-in-out infinite">📱</div>
          <div id="pdl_prod_name" style="font-family:Orbitron,sans-serif;font-size:.7rem;color:#fff;letter-spacing:.1em;margin-top:2px">SmartWidget X</div>
          <div id="pdl_prod_desc" style="font-size:.6rem;color:#778;margin-top:1px">A connected consumer device</div>
        </div>

        <!-- conveyor belt strip -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:5px;
          background:repeating-linear-gradient(90deg,
            ${ACCENT}44 0px,${ACCENT}44 14px,
            transparent 14px,transparent 22px
          );animation:pdl_belt 1s linear infinite"></div>
      </div>

      <!-- Timer ring + Budget mini -->
      <div style="display:flex;flex-direction:column;gap:8px;flex-shrink:0;align-items:center;justify-content:center">
        <!-- Timer ring -->
        <div style="position:relative;width:64px;height:64px;flex-shrink:0">
          <svg width="64" height="64" style="transform:rotate(-90deg)">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="5"/>
            <circle id="pdl_timer_ring" cx="32" cy="32" r="26" fill="none"
              stroke="${ACCENT}" stroke-width="5"
              stroke-dasharray="163.36" stroke-dashoffset="0"
              stroke-linecap="round"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div id="pdl_timer_val" style="font-family:Orbitron,sans-serif;font-size:.8rem;color:${AC2};font-variant-numeric:tabular-nums;animation:pdl_tick 1s ease infinite">0:40</div>
            <div style="font-family:Orbitron,sans-serif;font-size:.35rem;color:#445;letter-spacing:.08em">TIME</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SATISFACTION BAR -->
    <div style="padding:0 12px 8px;flex-shrink:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:#556;letter-spacing:.14em">CUSTOMER SATISFACTION</div>
        <div id="pdl_sat_stars" style="font-size:.9rem;letter-spacing:2px">★★★★☆</div>
      </div>
      <div style="height:9px;border-radius:5px;background:rgba(255,255,255,.06);overflow:hidden;position:relative">
        <div id="pdl_sat_bar" style="
          height:100%;border-radius:5px;transition:width .5s ease;
          background:linear-gradient(90deg,${ACCENT},${AC2},${CYAN});
          box-shadow:0 0 10px ${ACCENT}66;width:30%
        "></div>
        <!-- threshold markers -->
        <div style="position:absolute;top:0;bottom:0;left:60%;width:1px;background:${GOLD}55;pointer-events:none"></div>
        <div style="position:absolute;top:0;bottom:0;left:80%;width:1px;background:${GREEN}55;pointer-events:none"></div>
        <div style="position:absolute;top:0;bottom:0;left:45%;width:1px;background:${RED}44;pointer-events:none"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:2px">
        <div style="font-size:.42rem;color:${RED}88">▲ MIN LAUNCH 45%</div>
        <div id="pdl_sat_val" style="font-family:Orbitron,sans-serif;font-size:.5rem;color:${AC2};font-variant-numeric:tabular-nums">30 / 100</div>
        <div style="font-size:.42rem;color:${GREEN}88">★★★ AT 80% ▲</div>
      </div>
    </div>

    <!-- DIVIDER: conveyor glow -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,${ACCENT}55,transparent);flex-shrink:0;margin:0 12px"></div>

    <!-- BUGS + FEEDBACK AREA (Level 2) -->
    <div id="pdl_alerts_row" style="padding:5px 12px;flex-shrink:0;display:none">
      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
        <div id="pdl_bugs_container" style="display:flex;flex-wrap:wrap;gap:5px"></div>
        <div id="pdl_feedback_container" style="flex:1;min-width:0"></div>
      </div>
    </div>

    <!-- UPGRADES PANEL -->
    <div style="flex:1;overflow-y:auto;padding:6px 12px 12px" id="pdl_upgrades_scroll">
      <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:#445;letter-spacing:.16em;margin-bottom:7px">
        AVAILABLE UPGRADES — tap to apply
      </div>
      <div id="pdl_upgrades_grid" style="display:flex;flex-direction:column;gap:7px"></div>
    </div>

    <!-- LAUNCH BUTTON -->
    <div style="padding:8px 12px 12px;flex-shrink:0;border-top:1px solid ${ACCENT}22">
      <button id="pdl_launch_btn" onclick="pdlLaunch()" style="
        width:100%;padding:13px;border-radius:14px;cursor:pointer;
        font-family:Orbitron,sans-serif;font-size:.72rem;letter-spacing:.18em;
        border:2px solid ${ACCENT}88;
        background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(80,20,160,.3));
        color:${AC3};transition:all .18s;
        position:relative;overflow:hidden;
        animation:pdl_glow_pulse 2.5s ease-in-out infinite;
      "
      onmouseover="this.style.background='linear-gradient(135deg,rgba(124,58,237,.4),rgba(100,30,200,.5))';this.style.color='#fff'"
      onmouseout="this.style.background='linear-gradient(135deg,rgba(124,58,237,.2),rgba(80,20,160,.3))';this.style.color='${AC3}'">
        🚀 LAUNCH PRODUCT
      </button>
    </div>

  </div>

  <!-- TOAST -->
  <div id="pdl_toast" style="
    position:absolute;bottom:100px;left:50%;transform:translateX(-50%);
    z-index:80;pointer-events:none;font-family:Orbitron,sans-serif;
    font-size:.6rem;letter-spacing:.1em;padding:8px 18px;border-radius:10px;
    opacity:0;white-space:nowrap;transition:opacity .22s;
  "></div>

  <!-- UPGRADE FLASH OVERLAY -->
  <div id="pdl_flash" style="
    position:absolute;inset:0;z-index:60;pointer-events:none;
    background:rgba(124,58,237,.12);opacity:0;transition:opacity .15s;
  "></div>

  <!-- HOW-TO-PLAY OVERLAY (first-time intro + ❓ re-open) -->
  <div id="pdl_help" style="
    position:absolute;inset:0;z-index:95;display:none;
    align-items:center;justify-content:center;
    background:rgba(3,4,12,.94);backdrop-filter:blur(6px);padding:16px;
  "></div>

</div>`;
  }

  /* ── exit ───────────────────────────────────────────────────── */
  window.ll_product_dev_labExit = function () {
    if (G) {
      clearInterval(G._timerInterval);
      clearTimeout(G._bugTimer);
      clearTimeout(G._feedTimer);
      clearTimeout(G._toastTimer);
    }
    G = null;
    // Builder/Launch Lab hub id is 'builder' (WORLDS.builder) — this game is
    // reached from the Builder hub's Mini-Games grid, NOT risktaker.
    if (window.state) state.viewingWorld = 'builder';
    goTo('hub');
  };

  /* ═══════════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════════ */
  function initGame() {
    const root = document.getElementById('pdl_root');
    if (!root) return;

    injectCanvas();

    G = {
      level:          1,
      phase:          'playing',   // playing | transition | result
      productIdx:     0,
      products:       [],          // accumulated product records
      budget:         L1_CONFIG.budget,
      startBudget:    L1_CONFIG.budget,
      timeLeft:       L1_CONFIG.timeLimit,
      maxTime:        L1_CONFIG.timeLimit,
      satisfaction:   0,
      appliedUpgrades:[],          // upgrade ids applied this product
      bugs:           [],          // active bug objects
      feedback:       null,        // active feedback card
      feedbackMet:    false,
      config:         L1_CONFIG,
      _timerInterval: null,
      _bugTimer:      null,
      _feedTimer:     null,
      _toastTimer:    null,
      _animating:     false,
    };

    const prod = PRODUCTS[0];
    G.satisfaction = prod.baseSat;

    renderProduct();
    renderUpgrades();
    updateHUD();
    startTimer();

    /* first-time how-to-play, shown right as gameplay begins — pauses the
       just-started timer/interval so no dev time drains while reading */
    showHowToPlay();
  }

  /* ══════════════════════════════════════════════════════════════
     HOW-TO-PLAY — shown once automatically on first launch, and
     re-openable anytime via the ❓ button without losing progress.
     Pause trick: this game's clock is a setInterval that decrements
     G.timeLeft by exactly 1 once per fired tick (not a timestamp
     delta), so pausing is simply clearInterval() (no more ticks fire,
     so timeLeft cannot drain) and resuming is simply calling
     startTimer() again (installs a fresh interval; the next tick is
     always ~1s after resume, never counting the paused gap). Bug and
     feedback spawn timers are setTimeout-based and are likewise
     cleared on pause and freshly rescheduled via scheduleEvents() on
     resume, so no bug/feedback can silently fire while help is open.
  ══════════════════════════════════════════════════════════════ */
  function showHowToPlay () {
    const overlay = document.getElementById('pdl_help');
    if (!overlay) return;
    // firstTime (label text) is tracked separately from wasPlaying (pause logic) —
    // initGame() sets phase='playing' and starts the timer BEFORE this first
    // auto-show call, so gating the button label on phase alone always read
    // "RESUME" even on a brand-new launch. _pdlSeenIntro (module-level, survives
    // the level-up/replay G recreation) fixes that.
    const firstTime = !_pdlSeenIntro;
    const wasPlaying = G && G.phase === 'playing';
    if (wasPlaying) {
      G.phase = 'paused';
      clearInterval(G._timerInterval);
      clearTimeout(G._bugTimer);
      clearTimeout(G._feedTimer);
    }
    _pdlSeenIntro = true;
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div style="max-width:380px;width:94%;padding:26px 22px;background:rgba(20,8,45,.97);border:1.5px solid ${ACCENT}88;border-radius:18px;text-align:center;box-shadow:0 0 50px ${ACCENT}33;max-height:90vh;overflow-y:auto">
        <div style="font-family:Orbitron,sans-serif;font-size:.56rem;letter-spacing:.2em;color:${AC2};margin-bottom:8px">HOW TO PLAY</div>
        <div style="font-size:2rem;margin-bottom:6px">🏭</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.95rem;margin-bottom:14px">PRODUCT DEV LAB</div>
        <ul style="text-align:left;font-size:.74rem;color:rgba(255,255,255,.82);line-height:1.6;margin:0 0 18px;padding-left:18px">
          <li style="margin-bottom:8px"><b style="color:${AC2}">Goal:</b> get your product's Customer Satisfaction high enough to launch before the budget or dev time runs out.</li>
          <li style="margin-bottom:8px"><b style="color:${AC2}">How to play:</b> tap an upgrade card to apply it — each one costs budget and dev time but raises satisfaction.</li>
          <li style="margin-bottom:8px"><b style="color:${AC2}">Watch out:</b> from Level 2 on, bugs 🐛 pop up and drain satisfaction until fixed, and customer feedback cards ask for a specific upgrade — meet the demand for a bonus.</li>
          <li><b style="color:${AC2}">Scoring:</b> higher average satisfaction across every product, spent efficiently, earns more stars when you launch.</li>
        </ul>
        <button onclick="window.pdlCloseHelp()" style="padding:12px 30px;border:none;border-radius:11px;background:linear-gradient(90deg,${ACCENT},${AC2});color:#fff;font-family:Orbitron,sans-serif;font-size:.66rem;letter-spacing:.12em;font-weight:900;cursor:pointer">${firstTime ? 'GOT IT — START ▶' : '▶ RESUME'}</button>
      </div>`;
  }

  window.pdlShowHelp = function () {
    if (!G || G.phase === 'result') return;
    showHowToPlay();
  };

  window.pdlCloseHelp = function () {
    const overlay = document.getElementById('pdl_help');
    if (overlay) overlay.style.display = 'none';
    if (G && G.phase === 'paused') {
      G.phase = 'playing';
      startTimer();       // fresh interval — next tick always ~1s out, no paused-time debt
      scheduleEvents();    // fresh bug/feedback rolls, unaffected by how long help was open
    }
  };

  /* ── canvas ambient ─────────────────────────────────────────── */
  function injectCanvas() {
    const c = document.getElementById('pdl_canvas');
    if (!c) return;
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
    const ctx = c.getContext('2d');

    // Hex grid background
    ctx.strokeStyle = `rgba(124,58,237,.07)`;
    ctx.lineWidth = 1;
    const HEX = 36;
    for (let y = 0; y < c.height + HEX; y += HEX * 0.87) {
      const offset = Math.floor(y / (HEX * 0.87)) % 2 === 0 ? 0 : HEX * 0.5;
      for (let x = -HEX; x < c.width + HEX; x += HEX) {
        drawHex(ctx, x + offset, y, HEX * 0.4);
      }
    }

    // Glow nodes at sparse points
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * c.width;
      const y = Math.random() * c.height;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, 18);
      grd.addColorStop(0, 'rgba(124,58,237,.25)');
      grd.addColorStop(1, 'rgba(124,58,237,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(x - 18, y - 18, 36, 36);
    }

    // Diagonal lab lighting strips
    ctx.strokeStyle = 'rgba(0,229,255,.03)';
    ctx.lineWidth = 3;
    for (let i = -3; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * c.width / 4, 0);
      ctx.lineTo(i * c.width / 4 + c.height * 0.3, c.height);
      ctx.stroke();
    }
  }

  function drawHex(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + r * Math.cos(a);
      const py = y + r * Math.sin(a);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  /* ── timer ──────────────────────────────────────────────────── */
  function startTimer() {
    if (!G) return;
    clearInterval(G._timerInterval);
    const _ivId = G._timerInterval = setInterval(() => {
      if (!G || G.phase !== 'playing') { clearInterval(_ivId); return; }
      G.timeLeft--;
      updateTimerDisplay();
      if (G.timeLeft <= 0) {
        clearInterval(G._timerInterval);
        timeExpired();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (!G) return;
    const el = document.getElementById('pdl_timer_val');
    const ring = document.getElementById('pdl_timer_ring');
    const mins = Math.floor(G.timeLeft / 60);
    const secs = G.timeLeft % 60;
    if (el) {
      el.textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
      const pct = G.timeLeft / G.maxTime;
      el.style.color = pct < 0.25 ? RED : pct < 0.5 ? AMBER : AC2;
    }
    if (ring) {
      const CIRC = 163.36;
      const offset = CIRC * (1 - G.timeLeft / G.maxTime);
      ring.style.strokeDashoffset = offset;
      const pct = G.timeLeft / G.maxTime;
      ring.style.stroke = pct < 0.25 ? RED : pct < 0.5 ? AMBER : ACCENT;
    }
  }

  function timeExpired() {
    if (!G || G.phase !== 'playing') return;
    showToast('⏰ Time up! Auto-launching...', AMBER);
    setTimeout(() => {
      if (G && G.phase === 'playing') pdlLaunch(true);
    }, 800);
  }

  /* ── render current product ─────────────────────────────────── */
  function renderProduct() {
    if (!G) return;
    const cfg  = G.config;
    const pidx = G.productIdx;
    const prod = PRODUCTS[Math.min(pidx, PRODUCTS.length - 1)];
    const total = cfg.productCount;

    const iconEl = document.getElementById('pdl_prod_icon');
    const nameEl = document.getElementById('pdl_prod_name');
    const descEl = document.getElementById('pdl_prod_desc');
    const labelEl = document.getElementById('pdl_product_label');
    const card    = document.getElementById('pdl_product_card');

    if (iconEl) iconEl.textContent  = prod.icon;
    if (nameEl) nameEl.textContent  = prod.name;
    if (descEl) descEl.textContent  = prod.desc;
    if (labelEl) labelEl.textContent = `${pidx + 1}/${total}`;
    if (card) card.style.borderColor = prod.color + '55';
  }

  /* ── render upgrades ────────────────────────────────────────── */
  function renderUpgrades() {
    if (!G) return;
    const grid = document.getElementById('pdl_upgrades_grid');
    if (!grid) return;
    grid.innerHTML = '';

    const cfg = G.config;
    const ids  = cfg.upgrades;

    ids.forEach(uid => {
      const upg = ALL_UPGRADES.find(u => u.id === uid);
      if (!upg) return;

      const alreadyApplied = G.appliedUpgrades.filter(id => id === uid).length;
      // Each upgrade can be applied max 2 times (diminishing returns)
      const maxTimes = 2;
      const canApply = G.budget >= upg.cost && G.timeLeft > upg.time && alreadyApplied < maxTimes;

      const btn = document.createElement('button');
      btn.className = 'pdl-upgrade-btn';
      btn.disabled = !canApply;
      btn.dataset.uid = uid;

      const satGain = alreadyApplied === 0 ? upg.sat : Math.floor(upg.sat * 0.5);
      const efficiency = (satGain / upg.cost * 100).toFixed(1);

      btn.innerHTML = `
        <div style="font-size:1.5rem;flex-shrink:0">${upg.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-family:Orbitron,sans-serif;font-size:.52rem;color:${canApply ? '#eee' : '#556'};letter-spacing:.08em;margin-bottom:3px">
            ${upg.label}
            ${alreadyApplied > 0 ? `<span style="font-size:.4rem;color:${ACCENT}88;margin-left:5px">[×${alreadyApplied} applied]</span>` : ''}
          </div>
          <div style="font-size:.58rem;color:#667;line-height:1.4;margin-bottom:4px">${upg.desc}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">
            <span style="font-size:.5rem;padding:2px 7px;border-radius:10px;background:rgba(239,68,68,.12);color:${RED}">−$${upg.cost}</span>
            <span style="font-size:.5rem;padding:2px 7px;border-radius:10px;background:rgba(0,229,255,.09);color:${CYAN}">−${upg.time}s</span>
            <span style="font-size:.5rem;padding:2px 7px;border-radius:10px;background:rgba(124,58,237,.15);color:${AC3}">+${satGain} SAT</span>
            <span style="font-size:.45rem;padding:1px 5px;border-radius:8px;background:rgba(245,198,66,.08);color:${GOLD}88">eff ${efficiency}</span>
          </div>
        </div>
        <div style="flex-shrink:0;font-family:Orbitron,sans-serif;font-size:.62rem;color:${canApply ? ACCENT : '#334'}">▶</div>
      `;

      btn.addEventListener('click', () => applyUpgrade(uid));
      grid.appendChild(btn);
    });
  }

  /* ── apply upgrade ──────────────────────────────────────────── */
  function applyUpgrade(uid) {
    if (!G || G.phase !== 'playing' || G._animating) return;

    const upg = ALL_UPGRADES.find(u => u.id === uid);
    if (!upg) return;

    const alreadyApplied = G.appliedUpgrades.filter(id => id === uid).length;
    const satGain = alreadyApplied === 0 ? upg.sat : Math.floor(upg.sat * 0.5);

    if (G.budget < upg.cost) { showToast('💸 Not enough budget!', RED); return; }
    if (G.timeLeft <= upg.time) { showToast('⏰ Not enough dev time!', AMBER); return; }
    if (alreadyApplied >= 2) { showToast('⚠ Already applied twice!', AMBER); return; }

    // check feedback bonus
    let feedbackBonus = 0;
    if (G.feedback && !G.feedbackMet && G.feedback.demand === uid) {
      feedbackBonus = G.feedback.bonusSat;
      G.feedbackMet = true;
      showToast(`✅ Customer demand met! +${feedbackBonus} bonus SAT`, GREEN);
      setTimeout(() => clearFeedback(), 1200);
    }

    G._animating = true;
    G.budget     -= upg.cost;
    G.timeLeft   -= upg.time;
    G.satisfaction = Math.min(100, G.satisfaction + satGain + feedbackBonus);
    G.appliedUpgrades.push(uid);

    // Flash effect
    const flash = document.getElementById('pdl_flash');
    if (flash) {
      flash.style.opacity = '1';
      setTimeout(() => { if (flash) flash.style.opacity = '0'; }, 180);
    }

    showToast(`${upg.icon} ${upg.label}: +${satGain + feedbackBonus} SAT`, AC3);
    updateTimerDisplay();
    updateHUD();
    renderUpgrades();

    setTimeout(() => { if (G) G._animating = false; }, 250);

    // Check budget depleted
    if (G.budget <= 0) {
      clearInterval(G._timerInterval);
      showToast('💸 Budget exhausted! Auto-launching...', RED);
      setTimeout(() => { if (G && G.phase === 'playing') pdlLaunch(true); }, 1000);
    }
  }

  /* ── bug mechanics ──────────────────────────────────────────── */
  function spawnBug() {
    if (!G || G.phase !== 'playing') return;
    // Level 3 mixes in a tougher exclusive bug pool alongside the shared one.
    const pool = G.config === L3_CONFIG ? BUG_TYPES.concat(BUG_TYPES_L3) : BUG_TYPES;
    const bug = pool[Math.floor(Math.random() * pool.length)];
    const instance = { ...bug, id: Date.now() };
    G.bugs.push(instance);
    // apply sat penalty immediately
    G.satisfaction = Math.max(0, G.satisfaction - bug.satPenalty);
    updateHUD();
    renderBugs();
    showToast(`🐛 ${bug.label} detected! −${bug.satPenalty} SAT`, RED);
  }

  function fixBug(bugId) {
    if (!G || G.phase !== 'playing') return;
    const idx = G.bugs.findIndex(b => b.id === bugId);
    if (idx < 0) return;
    const bug = G.bugs[idx];

    if (G.budget < bug.cost) { showToast('💸 Not enough budget to fix!', RED); return; }
    if (G.timeLeft <= bug.time) { showToast('⏰ No time to fix bug!', AMBER); return; }

    // capture the clicked chip's on-screen position BEFORE the re-render
    // removes it, so the "+N SAT" floats from the bug the player actually
    // fixed rather than only showing a generic bottom toast (matters once
    // several bug chips are active at once — see spawnFloatingGain).
    const chipEl = document.querySelector(`.pdl-bug-chip[data-bug-id="${bug.id}"]`);
    const chipRect = chipEl ? chipEl.getBoundingClientRect() : null;

    G.budget   -= bug.cost;
    G.timeLeft -= bug.time;
    G.bugs.splice(idx, 1);

    // reward: get back partial sat
    const satReturn = Math.floor(bug.satPenalty * 0.8);
    G.satisfaction = Math.min(100, G.satisfaction + satReturn);

    if (chipRect) spawnFloatingGain(chipRect.left + chipRect.width / 2, chipRect.top, `+${satReturn} SAT`, GREEN);
    showToast(`🛠 ${bug.label} fixed! +${satReturn} SAT`, GREEN);
    updateHUD();
    updateTimerDisplay();
    renderBugs();
    renderUpgrades();
  }

  function renderBugs() {
    const container = document.getElementById('pdl_bugs_container');
    const alertsRow = document.getElementById('pdl_alerts_row');
    if (!container) return;
    container.innerHTML = '';

    if (G.bugs.length > 0) {
      if (alertsRow) alertsRow.style.display = 'block';
      G.bugs.forEach(bug => {
        const chip = document.createElement('div');
        chip.className = 'pdl-bug-chip';
        chip.dataset.bugId = bug.id; // lets fixBug() locate this exact chip's position for its floating "+N SAT"
        chip.innerHTML = `${bug.icon} ${bug.label} <span style="color:${RED};font-family:Orbitron,sans-serif;font-size:.48rem">−$${bug.cost}</span>`;
        chip.title = `Click to fix: −$${bug.cost}, −${bug.time}s dev time`;
        chip.addEventListener('click', () => fixBug(bug.id));
        container.appendChild(chip);
      });
    }

    checkAlertsRowVisibility();
  }

  /* ── customer feedback ──────────────────────────────────────── */
  function spawnFeedback() {
    if (!G || G.phase !== 'playing' || G.feedback) return;
    // Level 3 mixes in a tougher exclusive feedback pool alongside the shared one.
    const pool = G.config === L3_CONFIG ? FEEDBACK_CARDS.concat(FEEDBACK_CARDS_L3) : FEEDBACK_CARDS;
    const card = pool[Math.floor(Math.random() * pool.length)];
    G.feedback   = { ...card };
    G.feedbackMet = false;
    renderFeedback();
  }

  function clearFeedback() {
    G.feedback    = null;
    G.feedbackMet = false;
    renderFeedback();
  }

  function renderFeedback() {
    const container = document.getElementById('pdl_feedback_container');
    const alertsRow = document.getElementById('pdl_alerts_row');
    if (!container) return;
    container.innerHTML = '';

    if (G.feedback) {
      if (alertsRow) alertsRow.style.display = 'block';
      const upg = ALL_UPGRADES.find(u => u.id === G.feedback.demand);
      const card = document.createElement('div');
      card.className = 'pdl-feedback-card';
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:1rem">${G.feedback.icon}</span>
          <div>
            <div style="font-size:.65rem;color:${AMBER};font-style:italic">${G.feedback.text}</div>
            <div style="font-size:.55rem;color:#889;margin-top:2px">
              Apply <span style="color:${AC3};font-family:Orbitron,sans-serif">${upg ? upg.icon + ' ' + upg.label : G.feedback.demand}</span>
              for <span style="color:${GREEN}">+${G.feedback.bonusSat} bonus SAT</span>
            </div>
          </div>
          <div style="margin-left:auto;cursor:pointer;color:#445;font-size:.8rem;padding:4px" onclick="pdlDismissFeedback()">✕</div>
        </div>
      `;
      container.appendChild(card);
    }

    checkAlertsRowVisibility();
  }

  window.pdlDismissFeedback = function () {
    if (G) clearFeedback();
  };

  function checkAlertsRowVisibility() {
    const alertsRow = document.getElementById('pdl_alerts_row');
    if (!alertsRow || !G) return;
    const hasContent = (G.bugs && G.bugs.length > 0) || G.feedback;
    alertsRow.style.display = hasContent ? 'block' : 'none';
  }

  /* ── schedule bug/feedback events (any config with bugChance/feedbackChance) ─ */
  function scheduleEvents() {
    // Generalized guard: fires for ANY config carrying positive bugChance or
    // feedbackChance (currently L2_CONFIG and L3_CONFIG), not tied to one
    // specific config object by reference identity. Configs with 0/undefined
    // for both (e.g. L1_CONFIG) naturally no-op below without needing a bail-out.
    if (!G || !G.config || !((G.config.bugChance > 0) || (G.config.feedbackChance > 0))) return;

    clearTimeout(G._bugTimer);
    clearTimeout(G._feedTimer);

    if (Math.random() < G.config.bugChance) {
      G._bugTimer = setTimeout(() => {
        if (G && G.phase === 'playing') {
          spawnBug();
          scheduleEvents();
        }
      }, 6000 + Math.random() * 8000);
    }

    if (Math.random() < G.config.feedbackChance && !G.feedback) {
      G._feedTimer = setTimeout(() => {
        if (G && G.phase === 'playing' && !G.feedback) {
          spawnFeedback();
        }
      }, 5000 + Math.random() * 7000);
    }
  }

  /* ── LAUNCH (defined below after helpers are declared) ─────── */

  /* ── next product setup ─────────────────────────────────────── */
  function nextProduct() {
    if (!G) return;

    const cfg  = G.config;
    const prod = PRODUCTS[Math.min(G.productIdx, PRODUCTS.length - 1)];

    G.budget         = cfg.budget;
    G.startBudget    = cfg.budget;
    G.timeLeft       = cfg.timeLimit;
    G.maxTime        = cfg.timeLimit;
    G.satisfaction   = prod.baseSat;
    G.appliedUpgrades = [];
    G.bugs           = [];
    G.feedback       = null;
    G.feedbackMet    = false;
    G.phase          = 'playing';

    renderProduct();
    renderUpgrades();
    renderBugs();
    renderFeedback();
    updateHUD();
    startTimer();
    scheduleEvents();
  }

  /* ── product complete flash ─────────────────────────────────── */
  function showProductComplete(sat, callback) {
    const root = document.getElementById('pdl_root');
    if (!root) { callback && callback(); return; }

    const ov = document.createElement('div');
    ov.style.cssText = `
      position:absolute;inset:0;z-index:85;
      background:rgba(3,4,12,.88);
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
      animation:pdl_result_in .35s ease both;
    `;
    const color = sat >= STAR3_SAT ? GREEN : sat >= STAR2_SAT ? AMBER : sat >= MIN_LAUNCH ? AC2 : RED;
    ov.innerHTML = `
      <div style="font-size:2.4rem">${PRODUCTS[Math.min(G.productIdx, PRODUCTS.length - 1)].icon}</div>
      <div style="font-family:Orbitron,sans-serif;font-size:1rem;color:${color};letter-spacing:.2em;text-shadow:0 0 16px ${color}77">
        ${sat >= MIN_LAUNCH ? 'LAUNCHED!' : 'POOR LAUNCH'}
      </div>
      <div style="font-family:Orbitron,sans-serif;font-size:.65rem;color:#888;letter-spacing:.12em">
        Customer Satisfaction: <span style="color:${color}">${sat}%</span>
      </div>
      <div style="font-family:Orbitron,sans-serif;font-size:.55rem;color:${ACCENT};letter-spacing:.1em;margin-top:4px">
        Next product loading…
      </div>
    `;
    root.appendChild(ov);
    setTimeout(() => {
      ov.remove();
      callback && callback();
    }, 2000);
  }

  /* ── compute final result ───────────────────────────────────── */
  function computeFinalResult() {
    if (!G) return;

    const prods = G.products;
    const avgSat = prods.reduce((sum, p) => sum + p.sat, 0) / prods.length;
    const avgEff = prods.reduce((sum, p) => sum + p.efficiency, 0) / prods.length;

    let stars;
    if (avgSat >= STAR3_SAT && avgEff >= STAR3_EFF) stars = 3;
    else if (avgSat >= STAR3_SAT || (avgSat >= STAR2_SAT && avgEff >= 0.15)) stars = 2;
    else if (avgSat >= MIN_LAUNCH) stars = 1;
    else stars = 0;

    // Check if any product failed minimum launch
    const anyFailed = prods.some(p => p.sat < MIN_LAUNCH);
    if (anyFailed) stars = Math.max(0, stars - 1);

    endGame(stars, avgSat, avgEff, prods);
  }

  /* ── HUD update ─────────────────────────────────────────────── */
  function updateHUD() {
    if (!G) return;

    // Budget
    const budgetEl = document.getElementById('pdl_budget_label');
    if (budgetEl) {
      budgetEl.textContent = `$${G.budget}`;
      budgetEl.style.color = G.budget > G.startBudget * 0.5 ? GREEN
        : G.budget > G.startBudget * 0.2 ? AMBER : RED;
    }

    // Satisfaction bar
    const bar  = document.getElementById('pdl_sat_bar');
    const val  = document.getElementById('pdl_sat_val');
    const stars = document.getElementById('pdl_sat_stars');
    const pct  = Math.max(0, Math.min(100, G.satisfaction));

    if (bar) {
      bar.style.width = pct + '%';
      if (pct >= STAR3_SAT) bar.style.background = `linear-gradient(90deg,${ACCENT},${AC2},${GREEN})`;
      else if (pct >= STAR2_SAT) bar.style.background = `linear-gradient(90deg,${ACCENT},${AMBER})`;
      else if (pct >= MIN_LAUNCH) bar.style.background = `linear-gradient(90deg,${ACCENT},${CYAN})`;
      else bar.style.background = `linear-gradient(90deg,${RED}88,${RED})`;
    }
    if (val) val.textContent = `${pct} / 100`;
    if (stars) {
      const fullStars = Math.round(pct / 20);
      stars.innerHTML = Array.from({ length: 5 }, (_, i) =>
        `<span class="pdl-sat-star" style="color:${i < fullStars ? GOLD : '#333'};animation-delay:${i * 0.05}s">${i < fullStars ? '★' : '☆'}</span>`
      ).join('');
    }
  }

  /* ─────────────────────────────────────────────────────────────
     LEVEL TRANSITIONS: 1 → 2 → 3 → final result
  ───────────────────────────────────────────────────────────── */
  /* ═══════════════════════════════════════════════════════════════
     LAUNCH — defined here after all helpers are available
  ═══════════════════════════════════════════════════════════════ */
  window.pdlLaunch = function (forced) {
    if (!G || G.phase !== 'playing') return;

    clearInterval(G._timerInterval);
    clearTimeout(G._bugTimer);
    clearTimeout(G._feedTimer);

    const sat = G.satisfaction;

    if (sat < MIN_LAUNCH && !forced) {
      showToast(`❌ Satisfaction needs ≥${MIN_LAUNCH}%`, RED);
      const btn = document.getElementById('pdl_launch_btn');
      if (btn) {
        btn.style.animation = 'pdl_shake .4s ease';
        setTimeout(() => { if (btn) btn.style.animation = 'pdl_glow_pulse 2.5s ease-in-out infinite'; }, 450);
      }
      startTimer(); // restart timer
      return;
    }

    const budgetSpent = G.startBudget - G.budget;
    const efficiency  = G.budget / G.startBudget;

    G.products.push({
      name:       PRODUCTS[Math.min(G.productIdx, PRODUCTS.length - 1)].name,
      icon:       PRODUCTS[Math.min(G.productIdx, PRODUCTS.length - 1)].icon,
      sat:        sat,
      budget:     G.budget,
      startBudget:G.startBudget,
      spent:      budgetSpent,
      efficiency: efficiency,
      upgrades:   G.appliedUpgrades.length,
      bugs:       G.bugs.length,
    });

    G.phase = 'transition';

    // Level 1: single product → transition to Level 2
    if (G.config === L1_CONFIG) {
      showProductComplete(sat, () => showLevel1Complete());
      return;
    }

    // Level 2: multi-product → transition to Level 3 after the last product
    if (G.config === L2_CONFIG) {
      const total = G.config.productCount;
      if (G.productIdx + 1 < total) {
        showProductComplete(sat, () => {
          G.productIdx++;
          nextProduct();
        });
      } else {
        showProductComplete(sat, () => showLevel2Complete());
      }
      return;
    }

    // Level 3 (or any future config): multi-product → final result only after
    // the last product of THIS level. Only L3's completion reaches computeFinalResult().
    const total = G.config.productCount;
    if (G.productIdx + 1 < total) {
      showProductComplete(sat, () => {
        G.productIdx++;
        nextProduct();
      });
    } else {
      showProductComplete(sat, () => computeFinalResult());
    }
  };

  /* ── Level 1 complete banner ────────────────────────────────── */
  function showLevel1Complete() {
    const root = document.getElementById('pdl_root');
    if (!root) return;

    const ov = document.createElement('div');
    ov.id = 'pdl_l1_ov';
    ov.style.cssText = `
      position:absolute;inset:0;z-index:88;
      background:rgba(3,4,12,.93);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:14px;animation:pdl_result_in .4s ease both;text-align:center;padding:24px;
    `;
    ov.innerHTML = `
      <div style="font-size:2.6rem">🏭</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.95rem;color:${GREEN};letter-spacing:.22em;text-shadow:0 0 18px ${GREEN}88">
        PRODUCT LAUNCHED!
      </div>
      <div style="font-size:.72rem;color:#aaa;max-width:280px;line-height:1.7">
        You understood the trade-off. Now the <span style="color:${AMBER}">real market fights back</span> — random bugs, demanding customers, tighter budgets. Build <span style="color:${AC2}">3 products</span> under pressure.
      </div>
      <div style="font-family:Orbitron,sans-serif;font-size:.6rem;color:${ACCENT};letter-spacing:.14em;margin-top:4px">
        LEVEL 2 LOADING…
      </div>
    `;
    root.appendChild(ov);

    setTimeout(() => {
      ov.remove();
      startLevel2();
    }, 2800);
  }

  /* ── start level 2 ──────────────────────────────────────────── */
  function startLevel2() {
    if (!G) return;

    const prod = PRODUCTS[0];

    G.level          = 2;
    G.config         = L2_CONFIG;
    G.productIdx     = 0;
    G.products       = [];
    G.budget         = L2_CONFIG.budget;
    G.startBudget    = L2_CONFIG.budget;
    G.timeLeft       = L2_CONFIG.timeLimit;
    G.maxTime        = L2_CONFIG.timeLimit;
    G.satisfaction   = prod.baseSat;
    G.appliedUpgrades = [];
    G.bugs           = [];
    G.feedback       = null;
    G.feedbackMet    = false;
    G.phase          = 'playing';

    renderProduct();
    renderUpgrades();
    renderBugs();
    renderFeedback();
    updateHUD();
    startTimer();
    scheduleEvents();
  }

  /* ── Level 2 complete banner ────────────────────────────────── */
  function showLevel2Complete() {
    const root = document.getElementById('pdl_root');
    if (!root) return;

    const ov = document.createElement('div');
    ov.id = 'pdl_l2_ov';
    ov.style.cssText = `
      position:absolute;inset:0;z-index:88;
      background:rgba(3,4,12,.93);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:14px;animation:pdl_result_in .4s ease both;text-align:center;padding:24px;
    `;
    ov.innerHTML = `
      <div style="font-size:2.6rem">🚀</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.95rem;color:${GREEN};letter-spacing:.22em;text-shadow:0 0 18px ${GREEN}88">
        MISSION ACCOMPLISHED!
      </div>
      <div style="font-size:.72rem;color:#aaa;max-width:280px;line-height:1.7">
        Three products shipped under pressure. Now it's <span style="color:${RED}">crunch time</span> — faster clocks, tighter cash, and customers who compare you to the competition. Build <span style="color:${AC2}">5 products</span> to prove you're a real founder.
      </div>
      <div style="font-family:Orbitron,sans-serif;font-size:.6rem;color:${ACCENT};letter-spacing:.14em;margin-top:4px">
        LEVEL 3 LOADING…
      </div>
    `;
    root.appendChild(ov);

    setTimeout(() => {
      ov.remove();
      startLevel3();
    }, 2800);
  }

  /* ── start level 3 ──────────────────────────────────────────── */
  function startLevel3() {
    if (!G) return;

    const prod = PRODUCTS[0];

    G.level          = 3;
    G.config         = L3_CONFIG;
    G.productIdx     = 0;
    G.products       = [];
    G.budget         = L3_CONFIG.budget;
    G.startBudget    = L3_CONFIG.budget;
    G.timeLeft       = L3_CONFIG.timeLimit;
    G.maxTime        = L3_CONFIG.timeLimit;
    G.satisfaction   = prod.baseSat;
    G.appliedUpgrades = [];
    G.bugs           = [];
    G.feedback       = null;
    G.feedbackMet    = false;
    G.phase          = 'playing';

    renderProduct();
    renderUpgrades();
    renderBugs();
    renderFeedback();
    updateHUD();
    startTimer();
    scheduleEvents();
  }

  /* ═══════════════════════════════════════════════════════════════
     END GAME OVERLAY
  ═══════════════════════════════════════════════════════════════ */
  function endGame(stars, avgSat, avgEff, prods) {
    if (!G) return;
    G.phase = 'result';

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ll_product_dev_lab', { stars, level: G.level, badge: 'Product Genius Badge', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();
    if (window.StartupRewardsService) StartupRewardsService.submit({ pillar: 'product', successDelta: stars === 3 ? 15 : stars === 2 ? 8 : 3 });

    const root = document.getElementById('pdl_root');
    if (!root) return;

    const won    = stars >= 1;
    const starStr = stars >= 1
      ? ['⭐', '⭐⭐', '⭐⭐⭐'][stars - 1]
      : '💀';

    const effPct    = Math.round(avgEff * 100);
    const effBonus  = avgEff >= STAR3_EFF && stars === 3;

    const ov = document.createElement('div');
    ov.id = 'pdl_result_ov';
    ov.style.cssText = `
      position:absolute;inset:0;z-index:100;
      background:rgba(3,4,12,.93);
      display:flex;align-items:center;justify-content:center;padding:16px;
      overflow-y:auto;
    `;

    const productRows = prods.map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;
        padding:7px 10px;border-radius:9px;margin-bottom:5px;
        background:rgba(255,255,255,.03);border:1px solid ${ACCENT}22;">
        <div style="display:flex;align-items:center;gap:7px">
          <span style="font-size:1rem">${p.icon}</span>
          <div>
            <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:#ccc;letter-spacing:.08em">${p.name}</div>
            <div style="font-size:.5rem;color:#556;margin-top:1px">${p.upgrades} upgrades • $${p.spent} spent</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-family:Orbitron,sans-serif;font-size:.65rem;color:${p.sat >= STAR3_SAT ? GREEN : p.sat >= STAR2_SAT ? AMBER : p.sat >= MIN_LAUNCH ? CYAN : RED}">${p.sat}%</div>
          <div style="font-size:.42rem;color:#445">SAT</div>
        </div>
      </div>
    `).join('');

    /* win gets the bouncy pop (pdl_win_pop); loss keeps the plain fade
       (pdl_result_in) — so the launch-complete moment reads as more
       celebratory than a loss, instead of the card just swapping text */
    const resultAnim = won ? 'pdl_win_pop .5s cubic-bezier(.2,1.4,.4,1) both' : 'pdl_result_in .45s ease both';

    ov.innerHTML = `
      <div class="${won ? 'pdl-winshine' : ''}" style="
        width:min(380px,96vw);
        background:linear-gradient(150deg,rgba(20,8,45,.98),rgba(5,3,15,.99));
        border:2px solid ${ACCENT}44;border-radius:22px;padding:24px 20px;
        text-align:center;box-shadow:0 0 60px ${ACCENT}22,0 20px 60px rgba(0,0,0,.7);
        position:relative;overflow:hidden;
        animation:${resultAnim};
      ">
        <!-- top glow bar -->
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${ACCENT},${AC2},transparent)"></div>

        <!-- Hex grid overlay (decorative) -->
        <div style="position:absolute;inset:0;opacity:.04;pointer-events:none;
          background:repeating-linear-gradient(60deg,${ACCENT} 0px,${ACCENT} 1px,transparent 1px,transparent 20px),
            repeating-linear-gradient(120deg,${ACCENT} 0px,${ACCENT} 1px,transparent 1px,transparent 20px)"></div>

        <div style="position:relative">
          <div style="font-family:Orbitron,sans-serif;font-size:.48rem;letter-spacing:.25em;color:${ACCENT}88;margin-bottom:8px">
            ${won ? 'LAUNCH COMPLETE' : 'LAUNCH FAILURE'}
          </div>

          <div style="font-size:2.2rem;margin:6px 0">${starStr}</div>

          <div style="font-family:Orbitron,sans-serif;font-size:1.05rem;letter-spacing:.12em;
            color:${won ? (stars === 3 ? GREEN : stars === 2 ? AMBER : CYAN) : RED};
            margin-bottom:6px;text-shadow:0 0 14px ${won ? ACCENT : RED}77">
            ${won ? (stars === 3 ? 'PRODUCT GENIUS' : stars === 2 ? 'GREAT FOUNDER' : 'SHIPPED IT') : 'BUDGET BUST'}
          </div>

          ${effBonus ? `
          <div style="font-size:.58rem;color:${GOLD};background:rgba(245,198,66,.1);border:1px solid ${GOLD}33;border-radius:8px;padding:4px 10px;display:inline-block;margin-bottom:8px;font-family:Orbitron,sans-serif;letter-spacing:.1em">
            💡 EFFICIENCY BONUS
          </div>` : ''}

          <!-- stats row -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:12px 0 10px">
            ${statBox('AVG SAT', Math.round(avgSat) + '%', avgSat >= STAR3_SAT ? GREEN : avgSat >= STAR2_SAT ? AMBER : CYAN)}
            ${statBox('AVG EFF', effPct + '%', effPct >= 30 ? GREEN : effPct >= 15 ? AMBER : '#889')}
            ${statBox('PRODUCTS', String(prods.length), AC2)}
          </div>

          <!-- per-product breakdown -->
          ${prods.length > 1 ? `
          <div style="text-align:left;margin-bottom:12px">
            <div style="font-family:Orbitron,sans-serif;font-size:.4rem;color:#445;letter-spacing:.14em;margin-bottom:6px">PRODUCT BREAKDOWN</div>
            ${productRows}
          </div>` : `
          <div style="margin-bottom:12px">
            ${productRows}
          </div>
          `}

          <!-- coins -->
          ${coins > 0 ? `
          <div style="background:linear-gradient(135deg,rgba(245,200,66,.12),rgba(245,200,66,.04));
            border:1px solid rgba(245,200,66,.28);border-radius:12px;padding:10px;margin-bottom:14px">
            <div style="font-family:Orbitron,sans-serif;font-size:.44rem;color:${GOLD}77;letter-spacing:.15em">COINS EARNED</div>
            <div style="font-family:Orbitron,sans-serif;font-size:1.4rem;color:${GOLD};text-shadow:0 0 12px ${GOLD}66">+${coins} 🪙</div>
          </div>` : ''}

          <!-- lesson -->
          <div style="background:rgba(124,58,237,.06);border:1px solid ${ACCENT}22;border-radius:12px;
            padding:12px;margin-bottom:18px;text-align:left">
            <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:${ACCENT}88;letter-spacing:.14em;margin-bottom:5px">💡 LESSON</div>
            <div style="font-size:.68rem;line-height:1.7;color:#99aacc">
              Building a product means making choices. You can't fix every bug or add every feature — smart founders prioritise what customers value most and ship before the budget runs dry.
            </div>
          </div>

          <!-- buttons -->
          <div style="display:flex;gap:10px">
            <button onclick="pdlPlayAgain()" style="
              flex:1;padding:11px;border-radius:12px;cursor:pointer;
              border:2px solid ${ACCENT}55;background:rgba(124,58,237,.12);
              color:${AC3};font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.12em;
              transition:all .15s;
            " onmouseover="this.style.background='rgba(124,58,237,.28)'" onmouseout="this.style.background='rgba(124,58,237,.12)'">↻ PLAY AGAIN</button>
            <button onclick="window.ll_product_dev_labExit()" style="
              flex:1;padding:11px;border-radius:12px;cursor:pointer;
              border:2px solid ${GREEN}44;background:rgba(34,211,165,.07);
              color:${GREEN};font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.12em;
              transition:all .15s;
            " onmouseover="this.style.background='rgba(34,211,165,.2)'" onmouseout="this.style.background='rgba(34,211,165,.07)'">← HUB</button>
          </div>
        </div>

        <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${GREEN},transparent)"></div>
      </div>
    `;

    root.appendChild(ov);
    if (won) spawnConfetti(root);
  }

  /* ── confetti burst — real wins only, matches arcade.js's .arc-confetti recipe ── */
  function spawnConfetti (root) {
    if (!root) return;
    const colors = [ACCENT, AC2, GOLD, GREEN, '#fff'];
    for (let i = 0; i < 46; i++) {
      setTimeout(() => {
        if (!root.isConnected) return;
        const el = document.createElement('div');
        const x = Math.random() * 100;
        el.style.cssText = `position:absolute;top:-24px;left:${x}%;width:${5+Math.random()*5}px;height:${5+Math.random()*5}px;border-radius:${Math.random()>.5?'50%':'2px'};background:${colors[Math.floor(Math.random()*colors.length)]};z-index:110;pointer-events:none;animation:pdl_confetti_fall ${1.3+Math.random()*.8}s ease-in forwards`;
        root.appendChild(el);
        setTimeout(() => el.remove(), 2200);
      }, i * 28);
    }
  }

  function statBox(label, val, color) {
    return `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);
        border-radius:10px;padding:8px 5px;">
        <div style="font-family:Orbitron,sans-serif;font-size:.37rem;color:#445;letter-spacing:.1em;margin-bottom:3px">${label}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.82rem;color:${color};font-variant-numeric:tabular-nums">${val}</div>
      </div>
    `;
  }

  /* ── play again ─────────────────────────────────────────────── */
  window.pdlPlayAgain = function () {
    ['pdl_result_ov','pdl_l1_ov','pdl_l2_ov'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    G = null;
    initGame();
  };

  /* ── toast ──────────────────────────────────────────────────── */
  function showToast(msg, color) {
    const t = document.getElementById('pdl_toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = `rgba(3,4,12,.96)`;
    t.style.border      = `1px solid ${color}77`;
    t.style.color       = color;
    t.style.boxShadow   = `0 0 16px ${color}44`;
    t.style.opacity     = '1';
    clearTimeout(G && G._toastTimer);
    if (G) G._toastTimer = setTimeout(() => { if (t) t.style.opacity = '0'; }, 2200);
    else setTimeout(() => { if (t) t.style.opacity = '0'; }, 2200);
  }

  /* ── floating gain text ────────────────────────────────────────
     Spawns a small rising/fading label at a fixed-viewport (x,y) — used
     by fixBug() so the "+N SAT" appears at the specific bug chip just
     fixed rather than only the generic bottom toast, which matters once
     several bug chips are active on screen at once. Purely visual. ── */
  function spawnFloatingGain(x, y, text, color) {
    const root = document.getElementById('pdl_root');
    if (!root) return;
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;transform:translate(-50%,-50%);z-index:70;pointer-events:none;font-family:Orbitron,sans-serif;font-size:.62rem;font-weight:900;color:${color};text-shadow:0 0 10px ${color};animation:pdl_float_gain .8s ease-out forwards`;
    root.appendChild(el);
    setTimeout(() => el.remove(), 820);
  }

  /* ── debug hooks (console-only, no UI) ──────────────────────── */
  window._pdlDbg = () => G ? {
    level:        G.level,
    config:       G.config === L1_CONFIG ? 'L1' : G.config === L2_CONFIG ? 'L2' : G.config === L3_CONFIG ? 'L3' : 'unknown',
    productIdx:   G.productIdx,
    productCount: G.config ? G.config.productCount : null,
    satisfaction: G.satisfaction,
    budget:       G.budget,
    timeLeft:     G.timeLeft,
    phase:        G.phase,
    productsDone: G.products.length,
  } : null;

  // Force the current product to max satisfaction and immediately launch it.
  // Call repeatedly from the console to drive Level 1 -> 2 -> 3 -> endGame.
  window._pdlForceWin = () => {
    if (!G) return 'no game';
    G.satisfaction = 100;
    window.pdlLaunch(true);
    return 'launched';
  };

  // Convenience: force-win N times in a row (handles the async banner delays
  // between products/levels by polling for phase === 'playing' before each launch).
  window._pdlForceWinN = (n) => {
    n = n || 1;
    let fired = 0;
    const tick = () => {
      if (!G || fired >= n) return;
      if (G.phase === 'playing') {
        fired++;
        window._pdlForceWin();
      }
      setTimeout(tick, 150);
    };
    tick();
    return `queued ${n} force-wins`;
  };

})();
