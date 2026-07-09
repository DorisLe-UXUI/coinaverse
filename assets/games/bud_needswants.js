/* ════════════════════════════════════════════════════════════════
   NEEDS VS. WANTS · BUDGETRON BASE — Swipe-sort mini-game
   Items stream in one by one. Sort into NEED or WANT column.
   Level 1 (10 items): Clear-cut. Level 2 (10 items): Gray-area + impulse distractors.
   Level 3 (10 items): Debt-trap / opportunity-cost scenarios, faster timer, more impulse pressure.
   Screen ID : game_bud_needswants
   Hub       : strategist (#1a2a4a)
   ════════════════════════════════════════════════════════════════ */
(function () {
  /* ── constants ─────────────────────────────────────────────── */
  const ACCENT     = '#1a2a4a';
  const CYAN       = '#00f5ff';
  const TEAL       = '#00c9b1';
  const PINK       = '#ff4dab';
  const GOLD       = '#ffd166';
  const ERROR_MAX  = 6;          // lose if wrong decisions > this
  const ITEMS_PER_LEVEL = 10;
  const TOTAL_ITEMS= 30;
  const ITEM_TIMER_BY_LEVEL = { 1: 8000, 2: 8000, 3: 5500 }; // ms each item stays before timing out (L3 = faster)
  const SPEED_BONUS_CUTOFF = 3000; // decisions under 3s earn speed bonus

  /* level tier for a given deck index (0-based) */
  function levelForIdx(idx) {
    if (idx >= ITEMS_PER_LEVEL * 2) return 3;
    if (idx >= ITEMS_PER_LEVEL) return 2;
    return 1;
  }

  /* ── item catalogues ─────────────────────────────────────────── */
  const LVL1 = [
    // NEEDS
    { e:'🛒', t:'Groceries',       correct:'need' },
    { e:'💊', t:'Medicine',        correct:'need' },
    { e:'📚', t:'School Supplies', correct:'need' },
    { e:'💡', t:'Electricity Bill',correct:'need' },
    { e:'🚌', t:'Bus Pass',        correct:'need' },
    // WANTS
    { e:'👠', t:'Designer Shoes',  correct:'want' },
    { e:'🎮', t:'Game Skins',      correct:'want' },
    { e:'🍬', t:'Candy Haul',      correct:'want' },
    { e:'⌚', t:'Luxury Watch',    correct:'want' },
    { e:'🧴', t:'Luxury Perfume',  correct:'want' },
  ];

  const LVL2 = [
    // gray-area items with context
    {
      e:'💻', t:'Laptop',
      scenario:'You start college next week and need to submit assignments online. Your school library closes at 5pm.',
      correct:'need'
    },
    {
      e:'🏋️', t:'Gym Membership',
      scenario:'Your doctor recommended regular exercise after you were diagnosed with high blood pressure.',
      correct:'need'
    },
    {
      e:'✈️', t:'Family Vacation',
      scenario:'Your family hasn\'t taken a break in 3 years. Everyone is burned out, but you have credit card debt.',
      correct:'want'
    },
    {
      e:'📱', t:'New Smartphone',
      scenario:'Your current phone still works, but a new model just launched with better cameras.',
      correct:'want'
    },
    {
      e:'🌐', t:'Internet Service',
      scenario:'You work remotely. Without internet at home, you can\'t complete your job.',
      correct:'need'
    },
    {
      e:'🎓', t:'Online Course',
      scenario:'A certification course would increase your salary by 30%, but you need to pay upfront.',
      correct:'need'
    },
    {
      e:'🛋️', t:'New Sofa',
      scenario:'Your current couch is old but functional. This one is 60% off and looks amazing.',
      correct:'want'
    },
    {
      e:'🚗', t:'Car Repair',
      scenario:'Your car\'s brakes are squeaking. You drive your kids to school every day.',
      correct:'need'
    },
    {
      e:'🎧', t:'Noise-Canceling Headphones',
      scenario:'You study in a noisy apartment. You\'ve tried earplugs but struggle to focus.',
      correct:'want'
    },
    {
      e:'🐕', t:'Pet Food',
      scenario:'Your dog runs out of food tomorrow. There\'s no other food available for him.',
      correct:'need'
    },
  ];

  const LVL3 = [
    // debt-trap / opportunity-cost / true-cost scenarios — harder than LVL2
    {
      e:'💳', t:'Buy-Now-Pay-Later Sneakers',
      scenario:'The app splits the $180 sneakers into 4 payments. You already have 2 other BNPL plans running and rent is due Friday.',
      correct:'want'
    },
    {
      e:'🦷', t:'Dentist Visit',
      scenario:'A cracked tooth is causing sharp pain when you eat. Waiting could turn it into a costlier root canal.',
      correct:'need'
    },
    {
      e:'🎰', t:'Loot Box Bundle',
      scenario:'A limited-time bundle promises rare game items. The odds of getting anything valuable are under 5%.',
      correct:'want'
    },
    {
      e:'🧯', t:'Fire Extinguisher',
      scenario:'Your apartment building requires one per unit for the fire inspection next week. You don\'t have one.',
      correct:'need'
    },
    {
      e:'📈', t:'Skip a Retirement Contribution',
      scenario:'Your employer matches 401(k) contributions dollar-for-dollar. Skipping this month to buy concert tickets means losing free matched money forever.',
      correct:'need'
    },
    {
      e:'🏦', t:'High-Interest Payday Loan',
      scenario:'You\'re short $200 for a bill. The payday loan charges 400% APR and is due in two weeks.',
      correct:'want'
    },
    {
      e:'👶', t:'Baby Formula',
      scenario:'Your infant sibling needs formula and the current can runs out tomorrow morning.',
      correct:'need'
    },
    {
      e:'🎁', t:'Limited-Edition Sneaker Drop',
      scenario:'A resale hype sneaker drops today. You\'d need to put it on a credit card you\'re still paying off from last month.',
      correct:'want'
    },
    {
      e:'🩺', t:'Prescription Refill',
      scenario:'Your asthma inhaler prescription runs out in 2 days and you have no backup.',
      correct:'need'
    },
    {
      e:'🌴', t:'Impulse Weekend Trip',
      scenario:'Friends invite you on a spontaneous trip this weekend. Flights alone would wipe out your entire emergency fund.',
      correct:'want'
    },
  ];

  const IMPULSE_BANNERS = [
    '🔥 50% OFF TODAY ONLY!',
    '⚡ FLASH SALE — 2 HOURS LEFT!',
    '🎉 BUY NOW — DEAL EXPIRES SOON!',
    '💥 LIMITED STOCK — GRAB IT!',
    '🛒 ONLY 3 LEFT AT THIS PRICE!',
  ];
  const IMPULSE_BANNERS_L3 = [
    '💳 SPLIT IT INTO 4 EASY PAYMENTS!',
    '🎰 ONE-TIME LOOT DROP — DON\'T MISS OUT!',
    '⏰ PRICE GOES UP IN 10 MINUTES!',
    '🔓 UNLOCK VIP ACCESS NOW!',
    '🚨 EVERYONE ELSE ALREADY BOUGHT THEIRS!',
  ];

  /* ── state ────────────────────────────────────────────────────── */
  let G = null;

  /* ── screen registration ─────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_bud_needswants = function () {
    G = null;
    setTimeout(initGame, 40);
    return `
<div id="nw_root" style="position:absolute;inset:0;background:#03040c;overflow:hidden;font-family:Inter,sans-serif;color:#fff">

  <!-- starfield canvas -->
  <canvas id="nw_stars" style="position:absolute;inset:0;width:100%;height:100%;opacity:.5"></canvas>

  <!-- futuristic district bg strips -->
  <div style="position:absolute;bottom:0;left:0;right:0;height:38%;background:linear-gradient(to top,#0a1628,transparent);pointer-events:none"></div>
  <div id="nw_storefronts" style="position:absolute;bottom:0;left:0;right:0;height:110px;overflow:hidden;pointer-events:none"></div>

  <!-- TOP BAR -->
  <div id="nw_topbar" style="
    position:absolute;top:0;left:0;right:0;z-index:20;
    display:flex;align-items:center;gap:10px;
    padding:10px 14px;
    background:linear-gradient(180deg,rgba(0,0,0,.85) 0%,transparent 100%);
    border-bottom:1px solid rgba(0,245,255,.12);
  ">
    <button id="nw_back" onclick="window.bud_needswantsExit()" style="
      padding:6px 12px;border:1px solid rgba(0,245,255,.35);border-radius:8px;
      background:rgba(0,245,255,.08);color:${CYAN};
      font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.15em;cursor:pointer;
      transition:background .15s;
    " onmouseover="this.style.background='rgba(0,245,255,.18)'" onmouseout="this.style.background='rgba(0,245,255,.08)'">← HUB</button>
    <div style="font-family:Orbitron,sans-serif;font-size:.72rem;letter-spacing:.18em;color:${CYAN};flex:1;text-align:center;text-shadow:0 0 12px ${CYAN}88">
      NEEDS vs. WANTS
    </div>
    <div style="display:flex;gap:10px;align-items:center">
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.55rem;color:#aaa;letter-spacing:.1em">SCORE</div>
        <div id="nw_score" style="font-family:Orbitron,sans-serif;font-size:.85rem;color:${GOLD};text-shadow:0 0 8px ${GOLD}88">0</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.55rem;color:#aaa;letter-spacing:.1em">TIME</div>
        <div id="nw_timer" style="font-family:Orbitron,sans-serif;font-size:.85rem;color:${CYAN};text-shadow:0 0 8px ${CYAN}88">--</div>
      </div>
    </div>
  </div>

  <!-- STREAK + LEVEL BADGE -->
  <div style="position:absolute;top:54px;left:0;right:0;z-index:18;display:flex;justify-content:center;gap:14px;align-items:center;padding:4px 0">
    <div style="display:flex;align-items:center;gap:6px">
      <span id="nw_streak_icon" style="font-size:1rem">🔥</span>
      <span id="nw_streak" style="font-family:Orbitron,sans-serif;font-size:.6rem;color:${GOLD};letter-spacing:.1em">STREAK: 0</span>
    </div>
    <div id="nw_level_badge" style="
      font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.14em;
      padding:3px 10px;border-radius:20px;
      border:1px solid rgba(0,245,255,.4);
      background:rgba(0,245,255,.07);
      color:${CYAN};
    ">LEVEL 1 · LEARN</div>
    <div style="display:flex;align-items:center;gap:6px">
      <span style="font-family:Orbitron,sans-serif;font-size:.6rem;color:#ff6b6b;letter-spacing:.1em">ERRORS:</span>
      <span id="nw_errors" style="font-family:Orbitron,sans-serif;font-size:.6rem;color:#ff6b6b">0/${ERROR_MAX}</span>
    </div>
  </div>

  <!-- BUDGET HEALTH BAR -->
  <div style="position:absolute;top:92px;left:14px;right:14px;z-index:18">
    <div style="display:flex;justify-content:space-between;margin-bottom:3px">
      <span style="font-family:Orbitron,sans-serif;font-size:.5rem;color:#aaa;letter-spacing:.1em">BUDGET HEALTH</span>
      <span id="nw_health_val" style="font-family:Orbitron,sans-serif;font-size:.5rem;color:${TEAL}">100</span>
    </div>
    <div style="height:6px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden">
      <div id="nw_health_bar" style="height:100%;width:100%;border-radius:4px;background:linear-gradient(90deg,${TEAL},${CYAN});transition:width .4s ease"></div>
    </div>
  </div>

  <!-- PROGRESS DOTS -->
  <div id="nw_progress" style="position:absolute;top:116px;left:14px;right:14px;z-index:18;display:flex;gap:3px;justify-content:center"></div>

  <!-- SCENARIO CARD (hidden by default) -->
  <div id="nw_scenario" style="
    display:none;position:absolute;top:138px;left:14px;right:14px;z-index:25;
    background:linear-gradient(135deg,rgba(26,42,74,.95),rgba(0,10,30,.95));
    border:1px solid rgba(0,245,255,.35);border-radius:12px;
    padding:12px 16px;box-shadow:0 0 20px rgba(0,245,255,.15);
  ">
    <div style="font-family:Orbitron,sans-serif;font-size:.55rem;color:${CYAN};letter-spacing:.14em;margin-bottom:6px">📋 SCENARIO</div>
    <div id="nw_scenario_text" style="font-size:.78rem;line-height:1.5;color:#dde4f0"></div>
  </div>

  <!-- ITEM CARD AREA -->
  <div id="nw_item_area" style="position:absolute;top:148px;left:0;right:0;bottom:160px;z-index:15;display:flex;align-items:center;justify-content:center">
    <!-- item card injected dynamically -->
  </div>

  <!-- SWIPE HINT OVERLAYS (visible on drag) -->
  <div id="nw_hint_need" style="
    position:absolute;top:148px;left:0;bottom:160px;width:45%;z-index:14;
    background:linear-gradient(90deg,rgba(0,201,177,.18),transparent);
    border-right:none;pointer-events:none;opacity:0;transition:opacity .1s;
    display:flex;align-items:center;justify-content:flex-start;padding-left:18px;
  ">
    <div style="font-family:Orbitron,sans-serif;font-size:1.4rem;color:${TEAL};text-shadow:0 0 20px ${TEAL}">◀ NEED</div>
  </div>
  <div id="nw_hint_want" style="
    position:absolute;top:148px;right:0;bottom:160px;width:45%;z-index:14;
    background:linear-gradient(270deg,rgba(255,77,171,.18),transparent);
    pointer-events:none;opacity:0;transition:opacity .1s;
    display:flex;align-items:center;justify-content:flex-end;padding-right:18px;
  ">
    <div style="font-family:Orbitron,sans-serif;font-size:1.4rem;color:${PINK};text-shadow:0 0 20px ${PINK}">WANT ▶</div>
  </div>

  <!-- BOTTOM COLUMNS -->
  <div style="position:absolute;bottom:0;left:0;right:0;z-index:16;height:155px;display:flex;gap:10px;padding:10px 14px">

    <!-- NEED COLUMN -->
    <div id="nw_col_need" onclick="playerSorted('need')" style="
      flex:1;border-radius:14px;cursor:pointer;
      border:2px solid rgba(0,201,177,.45);
      background:linear-gradient(180deg,rgba(0,201,177,.12),rgba(0,201,177,.04));
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
      box-shadow:0 0 18px rgba(0,201,177,.1);
      transition:all .12s;user-select:none;
      position:relative;overflow:hidden;
    "
    onmouseover="this.style.background='linear-gradient(180deg,rgba(0,201,177,.22),rgba(0,201,177,.08))';this.style.borderColor='rgba(0,201,177,.7)'"
    onmouseout="this.style.background='linear-gradient(180deg,rgba(0,201,177,.12),rgba(0,201,177,.04))';this.style.borderColor='rgba(0,201,177,.45)'">
      <div style="font-size:1.6rem">✅</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.75rem;letter-spacing:.18em;color:${TEAL};text-shadow:0 0 10px ${TEAL}88">NEED</div>
      <div style="font-size:.65rem;color:rgba(0,201,177,.7);text-align:center;padding:0 6px">Essential for living</div>
      <div id="nw_need_count" style="font-family:Orbitron,sans-serif;font-size:1.1rem;color:${TEAL}">0</div>
    </div>

    <!-- WANT COLUMN -->
    <div id="nw_col_want" onclick="playerSorted('want')" style="
      flex:1;border-radius:14px;cursor:pointer;
      border:2px solid rgba(255,77,171,.45);
      background:linear-gradient(180deg,rgba(255,77,171,.12),rgba(255,77,171,.04));
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
      box-shadow:0 0 18px rgba(255,77,171,.1);
      transition:all .12s;user-select:none;
    "
    onmouseover="this.style.background='linear-gradient(180deg,rgba(255,77,171,.22),rgba(255,77,171,.08))';this.style.borderColor='rgba(255,77,171,.7)'"
    onmouseout="this.style.background='linear-gradient(180deg,rgba(255,77,171,.12),rgba(255,77,171,.04))';this.style.borderColor='rgba(255,77,171,.45)'">
      <div style="font-size:1.6rem">💎</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.75rem;letter-spacing:.18em;color:${PINK};text-shadow:0 0 10px ${PINK}88">WANT</div>
      <div style="font-size:.65rem;color:rgba(255,77,171,.7);text-align:center;padding:0 6px">Nice to have</div>
      <div id="nw_want_count" style="font-family:Orbitron,sans-serif;font-size:1.1rem;color:${PINK}">0</div>
    </div>

  </div>

  <!-- SPEED METER -->
  <div id="nw_speed_meter" style="
    position:absolute;bottom:160px;left:14px;right:14px;z-index:17;
    height:3px;border-radius:2px;background:rgba(255,255,255,.06);overflow:hidden;
  ">
    <div id="nw_speed_bar" style="height:100%;width:100%;background:linear-gradient(90deg,${GOLD},#ff9f1c);border-radius:2px;transition:width .05s"></div>
  </div>

  <!-- IMPULSE BANNER (injected dynamically, z=30) -->

  <!-- FEEDBACK TOAST -->
  <div id="nw_toast" style="
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);
    z-index:50;pointer-events:none;
    font-family:Orbitron,sans-serif;font-size:1.1rem;letter-spacing:.12em;
    padding:10px 24px;border-radius:12px;
    transition:transform .1s,opacity .2s;opacity:0;
  "></div>

  <!-- MOVING HOLOGRAPHIC CARTS -->
  <div id="nw_carts" style="position:absolute;bottom:155px;left:0;right:0;height:30px;overflow:hidden;pointer-events:none;z-index:10"></div>

</div>`;
  };

  /* ── exit function ────────────────────────────────────────────── */
  window.bud_needswantsExit = function () {
    if (G) {
      clearTimeout(G.itemTimer);
      clearTimeout(G.impulseTimer);
      clearTimeout(G._impulseDismiss);
      clearTimeout(G._toastTimer);
      if (G._keyHandler) document.removeEventListener('keydown', G._keyHandler);
      if (G._mmHandler)  document.removeEventListener('mousemove', G._mmHandler);
      if (G._muHandler)  document.removeEventListener('mouseup',   G._muHandler);
    }
    G = null;
    if (window.state) state.viewingWorld = 'strategist';
    goTo('hub');
  };

  /* ── init ─────────────────────────────────────────────────────── */
  function initGame() {
    const root = document.getElementById('nw_root');
    if (!root) return;

    // build item list: shuffle each level independently
    const lvl1 = shuffle([...LVL1]);
    const lvl2 = shuffle([...LVL2]);
    const lvl3 = shuffle([...LVL3]);
    const allItems = [...lvl1, ...lvl2, ...lvl3];

    G = {
      items: allItems,
      currentIdx: 0,
      level: 1,
      score: 0,
      errors: 0,
      streak: 0,
      bestStreak: 0,
      health: 100,
      needCount: 0,
      wantCount: 0,
      sorted: 0,
      impulseClicks: 0,
      decisionTimes: [],
      itemStart: 0,
      itemTimer: null,
      impulseTimer: null,
      cartAnim: null,
      phase: 'playing',   // playing | scenario | result
      scenarioShown: false,
      speedFraction: 1,
      dragStartX: null,
      dragCurrentX: null,
      isDragging: false,
      cardEl: null,
    };

    buildStars();
    buildStorefronts();
    buildProgressDots();
    buildCarts();
    startItemTimer();
    showCurrentItem();
    scheduleImpulse();
  }

  /* ── starfield ────────────────────────────────────────────────── */
  function buildStars() {
    const c = document.getElementById('nw_stars');
    if (!c) return;
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
    const ctx = c.getContext('2d');
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * c.width;
      const y = Math.random() * c.height;
      const r = Math.random() * 1.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,220,255,${.3 + Math.random() * .5})`;
      ctx.fill();
    }
    // grid lines
    ctx.strokeStyle = 'rgba(0,245,255,.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < c.width; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
    }
    for (let y = 0; y < c.height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
    }
  }

  /* ── holographic storefronts ─────────────────────────────────── */
  function buildStorefronts() {
    const el = document.getElementById('nw_storefronts');
    if (!el) return;
    const stores = [
      { name:'HOLO MART', color: CYAN },
      { name:'FLUX FASHION', color: PINK },
      { name:'QUANTUM GOODS', color: TEAL },
      { name:'NEO LUXE', color: GOLD },
      { name:'BYTE BAZAAR', color: '#a78bfa' },
      { name:'CORE ESSENTIALS', color: CYAN },
    ];
    el.innerHTML = stores.map((s, i) => `
      <div style="
        position:absolute;bottom:0;left:${i * 17}%;width:16%;height:${75 + Math.random()*25}px;
        border-top:2px solid ${s.color}44;
        border-left:1px solid ${s.color}22;border-right:1px solid ${s.color}22;
        background:linear-gradient(180deg,${s.color}08,transparent);
        display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
        padding-bottom:6px;overflow:hidden;
      ">
        <div style="width:40%;height:12px;background:${s.color}22;border:1px solid ${s.color}44;border-radius:2px;margin-bottom:4px"></div>
        <div style="font-family:Orbitron,sans-serif;font-size:.38rem;color:${s.color}88;letter-spacing:.1em;text-align:center">${s.name}</div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:${s.color}33;box-shadow:0 0 6px ${s.color}"></div>
      </div>
    `).join('');
  }

  /* ── progress dots ────────────────────────────────────────────── */
  function buildProgressDots() {
    const el = document.getElementById('nw_progress');
    if (!el) return;
    el.innerHTML = Array.from({ length: TOTAL_ITEMS }, (_, i) =>
      `<div id="nw_dot_${i}" style="
        width:8px;height:8px;border-radius:50%;
        background:rgba(255,255,255,.12);
        border:1px solid rgba(255,255,255,.08);
        transition:all .3s;
        ${(i === ITEMS_PER_LEVEL || i === ITEMS_PER_LEVEL * 2) ? 'margin-left:8px;' : ''}
      "></div>`
    ).join('');
  }

  function updateDot(idx, correct) {
    const dot = document.getElementById(`nw_dot_${idx}`);
    if (!dot) return;
    dot.style.background = correct ? TEAL : '#ff4444';
    dot.style.borderColor = correct ? TEAL : '#ff4444';
    dot.style.boxShadow = `0 0 6px ${correct ? TEAL : '#ff4444'}`;
  }

  /* ── moving holographic carts ────────────────────────────────── */
  function buildCarts() {
    const el = document.getElementById('nw_carts');
    if (!el) return;
    el.innerHTML = '';
    const cartEmojis = ['🛒', '🛍️', '🚚'];
    for (let i = 0; i < 3; i++) {
      const cart = document.createElement('div');
      cart.style.cssText = `
        position:absolute;top:0;font-size:.9rem;opacity:.35;
        animation:nw_cart ${6 + i * 3}s linear ${i * -2}s infinite;
        filter:hue-rotate(${i * 40}deg);
      `;
      cart.textContent = cartEmojis[i % cartEmojis.length];
      el.appendChild(cart);
    }
    if (!document.getElementById('nw_cart_style')) {
      const st = document.createElement('style');
      st.id = 'nw_cart_style';
      st.textContent = `
        @keyframes nw_cart {
          0%   { left:-40px; }
          100% { left:110%; }
        }
        @keyframes nw_card_in {
          0%   { transform:translateY(40px) scale(.92); opacity:0; }
          100% { transform:translateY(0) scale(1);    opacity:1; }
        }
        @keyframes nw_pulse_glow {
          0%,100% { box-shadow:0 0 16px ${CYAN}44; }
          50%      { box-shadow:0 0 32px ${CYAN}88; }
        }
        @keyframes nw_impulse_in {
          0%   { transform:translateY(-60px) rotate(-3deg); opacity:0; }
          60%  { transform:translateY(6px)   rotate(1deg);  opacity:1; }
          100% { transform:translateY(0)     rotate(0deg);  opacity:1; }
        }
        @keyframes nw_impulse_flash {
          0%,100% { background:rgba(255,60,0,.18); }
          50%      { background:rgba(255,60,0,.32); }
        }
        @keyframes nw_toast_in {
          0%   { transform:translate(-50%,-50%) scale(.7); opacity:0; }
          40%  { transform:translate(-50%,-50%) scale(1.1); opacity:1; }
          100% { transform:translate(-50%,-50%) scale(1);   opacity:1; }
        }
        @keyframes nw_shake {
          0%,100% { transform:translateX(0); }
          20%      { transform:translateX(-8px); }
          40%      { transform:translateX(8px); }
          60%      { transform:translateX(-5px); }
          80%      { transform:translateX(5px); }
        }
        @keyframes nw_speed_tick {
          0%   { width:100%; }
          100% { width:0%;   }
        }
      `;
      document.head.appendChild(st);
    }
  }

  /* ── show current item ────────────────────────────────────────── */
  function showCurrentItem() {
    if (!G || G.phase !== 'playing') return;
    const area = document.getElementById('nw_item_area');
    if (!area) return;

    if (G.currentIdx >= TOTAL_ITEMS) {
      endRound(); return;
    }

    const item = G.items[G.currentIdx];
    const currentLevel = levelForIdx(G.currentIdx);
    const hasScenario = currentLevel >= 2; // L2 and L3 both show scenario context

    // update level badge whenever the tier changes
    if (currentLevel !== G.level) {
      G.level = currentLevel;
      const badge = document.getElementById('nw_level_badge');
      if (badge) {
        if (currentLevel === 2) {
          badge.textContent = 'LEVEL 2 · MASTER';
          badge.style.borderColor = `rgba(255,209,102,.5)`;
          badge.style.color = GOLD;
        } else if (currentLevel === 3) {
          badge.textContent = 'LEVEL 3 · EXPERT';
          badge.style.borderColor = `rgba(255,77,171,.5)`;
          badge.style.color = PINK;
        }
      }
    }

    // show scenario card if lvl2 or lvl3
    const scEl = document.getElementById('nw_scenario');
    if (scEl) {
      if (hasScenario && item.scenario) {
        scEl.style.display = 'block';
        document.getElementById('nw_scenario_text').textContent = item.scenario;
        // push item area down
        area.style.top = '240px';
      } else {
        scEl.style.display = 'none';
        area.style.top = '148px';
      }
    }

    // build item card
    const card = document.createElement('div');
    card.id = 'nw_card';
    G.cardEl = card;

    card.style.cssText = `
      position:relative;
      width:min(220px,58vw);
      background:linear-gradient(145deg,rgba(26,42,74,.9),rgba(0,10,30,.95));
      border:2px solid rgba(0,245,255,.35);
      border-radius:20px;
      padding:24px 20px;
      text-align:center;
      box-shadow:0 0 28px rgba(0,245,255,.15),0 8px 32px rgba(0,0,0,.5);
      cursor:grab;
      animation:nw_card_in .3s ease both, nw_pulse_glow 2s ease infinite;
      user-select:none;
      touch-action:none;
    `;
    card.innerHTML = `
      <div style="font-size:2.8rem;margin-bottom:10px;filter:drop-shadow(0 0 8px rgba(0,245,255,.4))">${item.e}</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.85rem;letter-spacing:.1em;color:#eef4ff;margin-bottom:6px">${item.t}</div>
      <div style="font-size:.6rem;color:rgba(0,245,255,.5);font-family:Orbitron,sans-serif;letter-spacing:.1em">${hasScenario ? 'READ CONTEXT ↑' : 'NEED or WANT?'}</div>
      <div style="position:absolute;top:-1px;left:50%;transform:translateX(-50%);width:60%;height:2px;background:linear-gradient(90deg,transparent,${CYAN},transparent);border-radius:2px"></div>
    `;

    area.innerHTML = '';
    area.appendChild(card);

    // start item timer / speed bar
    G.itemStart = Date.now();
    startItemTimer();
    startSpeedBar();

    // drag / swipe support
    setupCardDrag(card);
    // keyboard
    setupKeyboard();
  }

  /* ── current item timer duration (scales with level) ────────────── */
  function currentItemTimer() {
    return ITEM_TIMER_BY_LEVEL[G ? G.level : 1] || ITEM_TIMER_BY_LEVEL[1];
  }

  /* ── item timer ───────────────────────────────────────────────── */
  function startItemTimer() {
    clearTimeout(G.itemTimer);
    G.itemTimer = setTimeout(() => {
      if (!G || G.phase !== 'playing') return;
      // timed out — count as error
      handleDecision(null, false, true);
    }, currentItemTimer());
  }

  /* ── speed bar ────────────────────────────────────────────────── */
  function startSpeedBar() {
    const bar = document.getElementById('nw_speed_bar');
    if (!bar) return;
    bar.style.transition = 'none';
    bar.style.width = '100%';
    requestAnimationFrame(() => {
      bar.style.transition = `width ${currentItemTimer()}ms linear`;
      bar.style.width = '0%';
    });
  }

  /* ── drag / swipe ─────────────────────────────────────────────── */
  function setupCardDrag(card) {
    let startX = 0, startY = 0, currentX = 0;

    function onStart(x, y) {
      startX = x; startY = y; currentX = x;
      card.style.cursor = 'grabbing';
      card.style.transition = 'none';
      card.style.animation = 'none';
    }

    function onMove(x) {
      currentX = x;
      const dx = currentX - startX;
      const rotate = dx * 0.06;
      card.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
      // show hints
      const needH = document.getElementById('nw_hint_need');
      const wantH = document.getElementById('nw_hint_want');
      if (needH) needH.style.opacity = dx < -30 ? Math.min(1, (-dx - 30) / 80) : 0;
      if (wantH) wantH.style.opacity = dx > 30  ? Math.min(1, (dx  - 30) / 80) : 0;
    }

    function onEnd() {
      const dx = currentX - startX;
      const needH = document.getElementById('nw_hint_need');
      const wantH = document.getElementById('nw_hint_want');
      if (needH) needH.style.opacity = 0;
      if (wantH) wantH.style.opacity = 0;
      if (dx < -60) {
        animateCardOut(card, 'left');
        playerSorted('need');
      } else if (dx > 60) {
        animateCardOut(card, 'right');
        playerSorted('want');
      } else {
        card.style.transform = '';
        card.style.animation = 'nw_pulse_glow 2s ease infinite';
        card.style.cursor = 'grab';
      }
    }

    // mouse
    card.addEventListener('mousedown', e => { onStart(e.clientX, e.clientY); e.preventDefault(); });

    // Store named handlers so they can be removed on exit / next card
    const mmHandler = e => { if (card.style.cursor === 'grabbing') onMove(e.clientX); };
    const muHandler = () => { if (card.style.cursor === 'grabbing') onEnd(); };
    // Remove previous card's listeners before adding new ones
    if (G._mmHandler) document.removeEventListener('mousemove', G._mmHandler);
    if (G._muHandler) document.removeEventListener('mouseup',   G._muHandler);
    G._mmHandler = mmHandler;
    G._muHandler = muHandler;
    document.addEventListener('mousemove', mmHandler);
    document.addEventListener('mouseup',   muHandler);

    // touch
    card.addEventListener('touchstart', e => { const t = e.touches[0]; onStart(t.clientX, t.clientY); }, { passive: true });
    card.addEventListener('touchmove',  e => { const t = e.touches[0]; onMove(t.clientX); e.preventDefault(); }, { passive: false });
    card.addEventListener('touchend',   () => onEnd());
  }

  function animateCardOut(card, dir) {
    if (!card) return;
    const x = dir === 'left' ? -window.innerWidth : window.innerWidth;
    card.style.transition = 'transform .25s ease, opacity .25s ease';
    card.style.transform = `translateX(${x}px) rotate(${dir === 'left' ? -15 : 15}deg)`;
    card.style.opacity = '0';
  }

  /* ── keyboard support ─────────────────────────────────────────── */
  function setupKeyboard() {
    if (G._keyHandler) document.removeEventListener('keydown', G._keyHandler);
    G._keyHandler = (e) => {
      if (!G || G.phase !== 'playing') return;
      if (e.key === 'ArrowLeft'  || e.key === 'n') { animateCardOut(G.cardEl, 'left');  playerSorted('need'); }
      if (e.key === 'ArrowRight' || e.key === 'w') { animateCardOut(G.cardEl, 'right'); playerSorted('want'); }
    };
    document.addEventListener('keydown', G._keyHandler);
  }

  /* ── player decision ──────────────────────────────────────────── */
  window.playerSorted = function (choice) {
    if (!G || G.phase !== 'playing') return;
    if (G.currentIdx >= TOTAL_ITEMS) return;

    clearTimeout(G.itemTimer);
    const item = G.items[G.currentIdx];
    const correct = choice === item.correct;
    const elapsed = Date.now() - G.itemStart;
    G.decisionTimes.push(elapsed);

    handleDecision(choice, correct, false);
  };

  /* ── debug hook (dev/test only) ──────────────────────────────────
     window._nwDbg()                    -> snapshot of current state
     window._nwTest('jumpTo', 20)        -> force currentIdx to a given index and re-render
     window._nwTest('autoWin', cb)       -> auto-answer every remaining item correctly (async;
                                            advance is deliberately delayed ~380ms/item to match
                                            real gameplay pacing, so pass a callback for the final state)
  ── */
  window._nwDbg = function () {
    if (!G) return null;
    return {
      level: G.level,
      currentIdx: G.currentIdx,
      totalItems: TOTAL_ITEMS,
      itemsPerLevel: ITEMS_PER_LEVEL,
      currentItem: G.items[G.currentIdx] || null,
      currentItemTimerMs: currentItemTimer(),
      errors: G.errors,
      score: G.score,
      phase: G.phase,
    };
  };
  window._nwTest = function (action, arg) {
    if (!G) return null;
    if (action === 'jumpTo') {
      G.currentIdx = Math.max(0, Math.min(TOTAL_ITEMS - 1, arg));
      showCurrentItem();
      return window._nwDbg();
    }
    if (action === 'autoWin') {
      const cb = arg;
      const step = () => {
        if (!G || G.phase !== 'playing' || G.currentIdx >= TOTAL_ITEMS) {
          if (typeof cb === 'function') cb(window._nwDbg());
          return;
        }
        const item = G.items[G.currentIdx];
        clearTimeout(G.itemTimer);
        handleDecision(item.correct, true, false);
        setTimeout(step, 400); // wait out handleDecision's own 380ms advance delay
      };
      step();
      return null; // async — use callback for result
    }
    return null;
  };

  function handleDecision(choice, correct, timedOut) {
    if (!G) return;

    if (timedOut) {
      // timeout = wrong
      correct = false;
      G.errors++;
      G.streak = 0;
      shakeScreen();
      showToast('⏱ TOO SLOW!', '#ff9800');
      updateHealth(-10);
      updateDot(G.currentIdx, false);
    } else if (correct) {
      const elapsed = G.decisionTimes[G.decisionTimes.length - 1] || currentItemTimer();
      const speedBonus = elapsed < SPEED_BONUS_CUTOFF ? 20 : 0;
      const streakBonus = Math.min(G.streak * 5, 50);
      const pts = 50 + speedBonus + streakBonus;
      G.score += pts;
      G.streak++;
      G.bestStreak = Math.max(G.bestStreak, G.streak);
      updateHealth(8);
      updateDot(G.currentIdx, true);
      showToast(speedBonus ? `⚡ +${pts} FAST!` : `✅ +${pts}`, TEAL);
      if (choice === 'need') { G.needCount++; }
      else { G.wantCount++; }
    } else {
      G.errors++;
      G.streak = 0;
      G.score = Math.max(0, G.score - 20);
      updateHealth(-12);
      updateDot(G.currentIdx, false);
      shakeScreen();
      showToast('💪 NICE TRY  −20', '#ff4444');
      if (choice === 'need') { G.needCount++; }
      else if (choice === 'want') { G.wantCount++; }
    }

    G.sorted++;
    G.currentIdx++;
    updateHUD();

    // check lose condition
    if (G.errors >= ERROR_MAX) {
      G.phase = 'result';
      setTimeout(() => endRound(), 400);
      return;
    }

    setTimeout(() => {
      if (!G) return;
      if (G.currentIdx >= TOTAL_ITEMS) {
        endRound();
      } else {
        showCurrentItem();
      }
    }, 380);
  }

  /* ── health bar ───────────────────────────────────────────────── */
  function updateHealth(delta) {
    if (!G) return;
    G.health = Math.max(0, Math.min(100, G.health + delta));
    const bar = document.getElementById('nw_health_bar');
    const val = document.getElementById('nw_health_val');
    if (bar) bar.style.width = G.health + '%';
    if (val) val.textContent = G.health;
    if (bar) {
      const hue = G.health > 50 ? TEAL : G.health > 25 ? GOLD : '#ff4444';
      bar.style.background = `linear-gradient(90deg,${hue},${hue}88)`;
    }
  }

  /* ── HUD update ───────────────────────────────────────────────── */
  function updateHUD() {
    if (!G) return;
    const sc = document.getElementById('nw_score');
    const er = document.getElementById('nw_errors');
    const st = document.getElementById('nw_streak');
    const nc = document.getElementById('nw_need_count');
    const wc = document.getElementById('nw_want_count');
    if (sc) sc.textContent = G.score;
    if (er) er.textContent = `${G.errors}/${ERROR_MAX}`;
    if (st) st.textContent = `STREAK: ${G.streak}`;
    if (nc) nc.textContent = G.needCount;
    if (wc) wc.textContent = G.wantCount;
    // streak icon
    const si = document.getElementById('nw_streak_icon');
    if (si) si.textContent = G.streak >= 5 ? '🔥' : G.streak >= 3 ? '⚡' : '✨';
  }

  /* ── toast feedback ───────────────────────────────────────────── */
  function showToast(msg, color) {
    const t = document.getElementById('nw_toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = `${color}22`;
    t.style.border = `1px solid ${color}88`;
    t.style.color = color;
    t.style.boxShadow = `0 0 24px ${color}55`;
    t.style.opacity = '1';
    t.style.animation = 'nw_toast_in .25s ease both';
    clearTimeout(G._toastTimer);
    G._toastTimer = setTimeout(() => {
      if (!t) return;
      t.style.opacity = '0';
      t.style.transform = 'translate(-50%,-50%) scale(.8)';
    }, 900);
  }

  /* ── screen shake ─────────────────────────────────────────────── */
  function shakeScreen() {
    const root = document.getElementById('nw_root');
    if (!root) return;
    root.style.animation = 'none';
    requestAnimationFrame(() => {
      root.style.animation = 'nw_shake .35s ease';
    });
  }

  /* ── impulse banner ───────────────────────────────────────────── */
  function scheduleImpulse() {
    if (!G || G.phase !== 'playing') return;
    // impulse pressure escalates each level: L1 slow/rare, L2 faster, L3 fastest+most frequent
    const tier = levelForIdx(G.currentIdx);
    const delay = tier === 3
      ? 2500 + Math.random() * 4000
      : tier === 2
        ? 4000 + Math.random() * 6000
        : 8000 + Math.random() * 10000;

    G.impulseTimer = setTimeout(() => {
      if (!G || G.phase !== 'playing') return;
      spawnImpulseBanner();
    }, delay);
  }

  function spawnImpulseBanner() {
    if (!G || G.phase !== 'playing') return;
    const root = document.getElementById('nw_root');
    if (!root) return;

    const tier = levelForIdx(G.currentIdx);
    const pool = tier === 3 ? IMPULSE_BANNERS_L3 : IMPULSE_BANNERS;
    const txt = pool[Math.floor(Math.random() * pool.length)];
    const banner = document.createElement('div');
    banner.id = 'nw_impulse';
    banner.style.cssText = `
      position:absolute;
      top:${28 + Math.random() * 30}%;
      left:5%;right:5%;
      z-index:30;
      background:rgba(255,60,0,.2);
      border:2px solid rgba(255,120,0,.7);
      border-radius:14px;
      padding:14px 20px;
      text-align:center;
      cursor:pointer;
      animation:nw_impulse_in .35s cubic-bezier(.2,.8,.3,1.2) both, nw_impulse_flash 1s ease infinite .35s;
      box-shadow:0 0 30px rgba(255,80,0,.4);
    `;
    banner.innerHTML = `
      <div style="font-family:Orbitron,sans-serif;font-size:1rem;letter-spacing:.12em;color:#ff9f1c;text-shadow:0 0 10px #ff9f1c">${txt}</div>
      <div style="font-size:.68rem;color:rgba(255,200,100,.7);margin-top:4px">Click to buy — costs budget points!</div>
    `;
    banner.onclick = () => {
      if (!G) return;
      const penalty = tier === 3 ? 45 : 30;
      const healthHit = tier === 3 ? -22 : -15;
      G.impulseClicks++;
      G.score = Math.max(0, G.score - penalty);
      updateHealth(healthHit);
      shakeScreen();
      showToast(`💸 IMPULSE BUY! −${penalty}`, '#ff9800');
      updateHUD();
      banner.remove();
      scheduleImpulse();
    };

    // dismiss button
    const dismiss = document.createElement('button');
    dismiss.style.cssText = `
      position:absolute;top:6px;right:10px;
      background:none;border:none;color:#ff9f1caa;cursor:pointer;
      font-size:.85rem;padding:2px 6px;
    `;
    dismiss.textContent = '✕';
    dismiss.onclick = (e) => {
      e.stopPropagation();
      banner.remove();
      scheduleImpulse();
    };
    banner.appendChild(dismiss);

    root.appendChild(banner);

    // auto-remove after 6 seconds
    G._impulseDismiss = setTimeout(() => {
      if (banner.parentNode) banner.remove();
      scheduleImpulse();
    }, 6000);
  }

  /* ── end round ────────────────────────────────────────────────── */
  function endRound() {
    if (!G) return;
    G.phase = 'result';
    clearTimeout(G.itemTimer);
    clearTimeout(G.impulseTimer);
    clearTimeout(G._impulseDismiss);
    if (G._keyHandler) document.removeEventListener('keydown', G._keyHandler);

    const won = G.errors < ERROR_MAX && G.currentIdx >= TOTAL_ITEMS;
    const accuracy = G.sorted > 0 ? ((G.sorted - G.errors) / G.sorted) : 0;
    const avgTime = G.decisionTimes.length
      ? G.decisionTimes.reduce((a, b) => a + b, 0) / G.decisionTimes.length
      : ITEM_TIMER_BY_LEVEL[1];
    const zeroImpulse = G.impulseClicks === 0;

    let stars;
    if (!won) {
      stars = 0;
    } else if (accuracy >= 0.95 && avgTime < 3200 && zeroImpulse) {
      stars = 3;
    } else if (accuracy >= 0.80) {
      stars = 2;
    } else {
      stars = 1;
    }

    endGame(stars, won, accuracy, avgTime);
  }

  /* ── end game overlay ─────────────────────────────────────────── */
  function endGame(stars, won, accuracy, avgTime) {
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bud_needswants', { level: (G ? G.level : 1), stars, badge: 'Smart Shopper', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    // budget delta to shared Budgetron meter (net-equivalent of +15/+8/+3, −10 on loss)
    if (window.budgetDelta) budgetDelta(stars === 3 ? 600 : stars === 2 ? 320 : stars === 1 ? 120 : -400);

    if (window.state && coins > 0) {
      // smart-decision streak to hub state
      if (state.smartStreak !== undefined) {
        state.smartStreak = (state.smartStreak || 0) + (G ? G.bestStreak : 0);
      }

      if (window.cvSave) cvSave();
    }

    const root = document.getElementById('nw_root');
    if (!root) return;

    const accPct = Math.round((accuracy || 0) * 100);
    const avgSec = ((avgTime || 0) / 1000).toFixed(1);
    const starStr = stars >= 1
      ? ['⭐','⭐⭐','⭐⭐⭐'][stars - 1]
      : '💀';

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute;inset:0;z-index:100;
      background:rgba(3,4,12,.92);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:20px;
      animation:nw_card_in .4s ease both;
    `;

    overlay.innerHTML = `
      <div style="
        width:min(360px,90vw);
        background:linear-gradient(145deg,rgba(26,42,74,.97),rgba(0,10,30,.98));
        border:2px solid rgba(0,245,255,.3);
        border-radius:24px;
        padding:28px 24px;
        text-align:center;
        box-shadow:0 0 60px rgba(0,245,255,.15),0 20px 60px rgba(0,0,0,.7);
        position:relative;overflow:hidden;
      ">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${CYAN},transparent)"></div>

        <div style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.25em;color:${CYAN}88;margin-bottom:8px">
          ${won ? 'ROUND COMPLETE' : 'BUDGET DEPLETED'}
        </div>

        <div style="font-size:2.4rem;margin:6px 0">${starStr}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:1.3rem;letter-spacing:.1em;color:${won ? GOLD : '#ff4444'};margin-bottom:16px;text-shadow:0 0 12px ${won ? GOLD : '#ff4444'}88">
          ${won ? (stars === 3 ? 'MASTERED!' : stars === 2 ? 'GREAT JOB!' : 'CLEARED!') : 'TRY AGAIN'}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
          ${statBox('SCORE', G ? G.score : 0, CYAN)}
          ${statBox('ACCURACY', accPct + '%', TEAL)}
          ${statBox('AVG SPEED', avgSec + 's', GOLD)}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px">
          ${statBox('ERRORS', (G ? G.errors : 0) + '/' + ERROR_MAX, '#ff6b6b')}
          ${statBox('IMPULSE BUYS', G ? G.impulseClicks : 0, G && G.impulseClicks === 0 ? TEAL : '#ff9800')}
        </div>

        ${coins > 0 ? `
        <div style="
          background:linear-gradient(135deg,rgba(255,209,102,.15),rgba(255,209,102,.05));
          border:1px solid rgba(255,209,102,.35);
          border-radius:12px;padding:10px;margin-bottom:16px;
        ">
          <div style="font-family:Orbitron,sans-serif;font-size:.55rem;color:${GOLD}88;letter-spacing:.15em">COINS EARNED</div>
          <div style="font-family:Orbitron,sans-serif;font-size:1.5rem;color:${GOLD};text-shadow:0 0 12px ${GOLD}88">+${coins} 🪙</div>
        </div>
        ` : ''}

        <div style="
          background:rgba(0,245,255,.05);border:1px solid rgba(0,245,255,.15);
          border-radius:10px;padding:12px;margin-bottom:20px;
          font-size:.72rem;line-height:1.6;color:#aabbcc;text-align:left;
        ">
          <span style="color:${CYAN};font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.1em;display:block;margin-bottom:4px">💡 LESSON</span>
          The difference between a need and a want is not always obvious — but pausing before you buy is the habit that protects your budget. Resisting one impulse buy a week can save hundreds of dollars a year.
        </div>

        <div style="display:flex;gap:10px">
          <button onclick="nwPlayAgain()" style="
            flex:1;padding:12px;border-radius:12px;cursor:pointer;
            border:2px solid ${CYAN}66;
            background:rgba(0,245,255,.1);
            color:${CYAN};font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.12em;
            transition:all .15s;
          "
          onmouseover="this.style.background='rgba(0,245,255,.2)'"
          onmouseout="this.style.background='rgba(0,245,255,.1)'">
            ↻ PLAY AGAIN
          </button>
          <button onclick="window.bud_needswantsExit()" style="
            flex:1;padding:12px;border-radius:12px;cursor:pointer;
            border:2px solid ${TEAL}66;
            background:rgba(0,201,177,.1);
            color:${TEAL};font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.12em;
            transition:all .15s;
          "
          onmouseover="this.style.background='rgba(0,201,177,.2)'"
          onmouseout="this.style.background='rgba(0,201,177,.1)'">
            ← HUB
          </button>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${TEAL},transparent)"></div>
      </div>
    `;

    root.appendChild(overlay);
  }

  function statBox(label, val, color) {
    return `
      <div style="
        background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
        border-radius:10px;padding:8px 6px;
      ">
        <div style="font-family:Orbitron,sans-serif;font-size:.45rem;color:#888;letter-spacing:.1em;margin-bottom:3px">${label}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.9rem;color:${color};font-variant-numeric:tabular-nums">${val}</div>
      </div>
    `;
  }

  /* ── play again ───────────────────────────────────────────────── */
  window.nwPlayAgain = function () {
    G = null;
    const root = document.getElementById('nw_root');
    if (!root) { goTo('game_bud_needswants'); return; }
    // re-init in place
    const area = document.getElementById('nw_item_area');
    const scEl = document.getElementById('nw_scenario');
    const existing = root.querySelector('[style*="z-index:100"]');
    if (existing) existing.remove();
    if (area) area.innerHTML = '';
    if (scEl) scEl.style.display = 'none';
    const imp = document.getElementById('nw_impulse');
    if (imp) imp.remove();
    // reset progress dots
    const prog = document.getElementById('nw_progress');
    if (prog) {
      Array.from(prog.children).forEach(d => {
        d.style.background = 'rgba(255,255,255,.12)';
        d.style.borderColor = 'rgba(255,255,255,.08)';
        d.style.boxShadow = 'none';
      });
    }
    // reset level badge
    const badge = document.getElementById('nw_level_badge');
    if (badge) {
      badge.textContent = 'LEVEL 1 · LEARN';
      badge.style.borderColor = 'rgba(0,245,255,.4)';
      badge.style.color = CYAN;
    }
    // reset health bar
    const hbar = document.getElementById('nw_health_bar');
    const hval = document.getElementById('nw_health_val');
    if (hbar) { hbar.style.width = '100%'; hbar.style.background = `linear-gradient(90deg,${TEAL},${CYAN})`; }
    if (hval) hval.textContent = '100';
    initGame();
  };

  /* ── utils ────────────────────────────────────────────────────── */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

})();
