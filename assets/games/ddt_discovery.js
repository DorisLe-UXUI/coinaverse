/* ════════════════════════════════════════════════════════════════
   DEBT DISCOVERY · DEBT DETOX DISTRICT — Drag-sort mini-game
   Sort 25 debt cards into Good Debt / Bad Debt before time runs out.
   Level 1 (8 cards): Clear-cut examples.
   Level 2 (8 cards): Situational — same loan type, different context.
   Level 3 (9 cards): Multi-factor — weigh rate + income + timing + purpose at once.
   Screen ID : game_ddt_discovery
   Hub       : rebuilder (#4B2D8F)
   ════════════════════════════════════════════════════════════════ */
(function () {

  /* ── palette ─────────────────────────────────────────────────── */
  const ACCENT   = '#4B2D8F';   // hub purple
  const VIOLET   = '#7B52EF';   // lighter purple glow
  const GOLD     = '#F5C842';   // good debt / coins
  const CRIMSON  = '#E84060';   // bad debt / error
  const TEAL     = '#00D4AA';   // combo / speed bonus
  const DIM      = '#0A060F';   // near-black bg

  /* ── game constants ──────────────────────────────────────────── */
  const LEVEL_SIZES  = [8, 8, 9];                          // cards per level (1,2,3)
  const TOTAL_CARDS  = LEVEL_SIZES.reduce((a, b) => a + b, 0); // 25
  const CARD_TIMEOUT = 12000;   // ms per card before auto-miss (L1/L2)
  const CARD_TIMEOUT_L3 = 9000; // ms per card on Level 3 — faster, multi-factor cards
  const SPEED_BONUS_MS = 2500;  // sort under this → speed bonus
  const COMBO_THRESHOLD = 3;    // consecutive correct → combo bonus
  const ERROR_MAX    = 6;       // max wrong before game over
  const STAR3_SCORE  = 300;
  const STAR2_SCORE  = 180;

  /* ── debt card catalogue ─────────────────────────────────────── */
  const LEVEL1 = [
    // GOOD DEBT — clear cut
    { e: '🏠', t: 'Mortgage',           cat: 'good',
      note: 'Builds equity and provides shelter — a classic wealth-building debt.' },
    { e: '🎓', t: 'Student Loan',       cat: 'good',
      note: 'Invests in education that raises your lifetime earning potential.' },
    { e: '🏪', t: 'Small Business Loan',cat: 'good',
      note: 'Funds income-generating assets — can return far more than it costs.' },
    { e: '🚗', t: 'Affordable Car Loan',cat: 'good',
      note: 'Enables commuting to work with manageable payments and low interest.' },
    // BAD DEBT — clear cut
    { e: '💸', t: 'Payday Loan',        cat: 'bad',
      note: '300–400% APR traps borrowers in a cycle of fees and renewals.' },
    { e: '💳', t: 'High-Interest Credit Card',cat: 'bad',
      note: 'Carrying a 29% APR balance means interest outgrows the purchase.' },
    { e: '🛍️', t: 'BNPL for Wants',    cat: 'bad',
      note: '"Buy Now Pay Later" for non-essentials adds hidden fees and spending habits that harm budgets.' },
    { e: '🎰', t: 'Gambling Debt',      cat: 'bad',
      note: 'No asset created — pure liability with no path to repayment income.' },
  ];

  const LEVEL2 = [
    // Situational — requires reasoning from context
    {
      e: '🚗', t: 'Car Loan — 19% APR',  cat: 'bad',
      ctx: 'You earn $32 000/yr. The monthly payment is $680 and the loan rate is 19%.',
      note: 'At 19% APR with a tight income, interest will cost more than the car is worth.'
    },
    {
      e: '🚗', t: 'Car Loan — 3.9% APR', cat: 'good',
      ctx: 'You earn $70 000/yr. Monthly payment is $320 at 3.9% — the car is needed for work.',
      note: 'Low-rate, proportionate payment for a work asset — this passes the good-debt test.'
    },
    {
      e: '🎓', t: 'Graduate Degree Loan',cat: 'good',
      ctx: 'An MBA at a target school costs $80 000 but increases your expected salary by $45 000/yr.',
      note: 'ROI is clear: salary uplift repays the loan in under two years.'
    },
    {
      e: '🎓', t: 'For-Profit Degree',   cat: 'bad',
      ctx: 'The school is unaccredited. Graduates report median salary below minimum wage. Loan: $60 000.',
      note: 'No income gain + $60 K debt = financial damage disguised as education.'
    },
    {
      e: '🏪', t: 'Business Expansion Loan',cat: 'good',
      ctx: 'Your bakery\'s revenue doubled. A $50 000 loan funds a second location with projected breakeven in 8 months.',
      note: 'Data-backed expansion with a clear payback timeline — textbook good debt.'
    },
    {
      e: '💳', t: 'Balance Transfer Card', cat: 'good',
      ctx: '0% APR for 18 months. You have a plan to pay off the full balance within 12 months.',
      note: 'Strategic use of 0% intro rate to eliminate existing debt — smart if disciplined.'
    },
    {
      e: '💳', t: 'Store Credit Card',    cat: 'bad',
      ctx: '28% APR, no rewards. You use it for everyday shopping and carry a monthly balance.',
      note: 'High-rate revolving balance with no benefit erodes net worth every cycle.'
    },
    {
      e: '🏖️', t: 'Vacation Loan',        cat: 'bad',
      ctx: '14% APR personal loan to fund a two-week holiday. No asset created.',
      note: 'Paying 14% interest for a memory means the trip costs 30–40% more than the sticker price.'
    },
  ];

  const LEVEL3 = [
    // Multi-factor — must weigh rate + income + timing + purpose together, no easy tell
    {
      e: '🏠', t: 'HELOC to Pay Off Cards', cat: 'bad',
      ctx: 'You have $18,000 in credit card debt at 24% APR. A HELOC offers 9% — but it puts your house up as collateral and you have no plan to stop overspending.',
      note: 'Lower rate is real, but securing unsecured debt against your home without fixing the spending root cause risks losing the house over a habit, not an emergency.'
    },
    {
      e: '🎓', t: 'Trade Certification Loan', cat: 'good',
      ctx: 'A $9,000 loan funds a 6-month electrician certification. Licensed electricians in your area earn $28,000/yr more than your current job, and demand is high.',
      note: 'Short program, verified local demand, and a clear multi-year salary jump — the ROI math clears fast even on a modest loan.'
    },
    {
      e: '🚗', t: 'Lease Buyout at Peak Value', cat: 'bad',
      ctx: 'Your lease ends in 2 months. You\'d buy the car for $3,000 more than its trade-in value, financed at 12% APR, just to avoid the hassle of shopping around.',
      note: 'Paying above market value plus double-digit interest for convenience is a bad trade — a little shopping effort saves real money.'
    },
    {
      e: '🏪', t: 'Inventory Loan — Seasonal Spike', cat: 'good',
      ctx: 'Your shop takes a $15,000 short-term loan to stock up before the holiday season, based on 3 years of proven sales data, repaid in full by January.',
      note: 'Data-backed, short-term, self-liquidating — the loan pays for itself from predictable revenue before it\'s even due.'
    },
    {
      e: '💳', t: '0% Card Used for New Debt', cat: 'bad',
      ctx: 'You transferred old debt to a 0% APR card, then kept swiping it for daily purchases you can\'t otherwise afford, growing the balance every month.',
      note: 'A 0% rate only helps if the balance shrinks — spending it back up erases the benefit and sets up a bigger bill once the intro rate expires.'
    },
    {
      e: '⚡', t: 'Home Efficiency Retrofit Loan', cat: 'good',
      ctx: 'A $7,000 loan at 5% funds insulation and a heat pump. Verified quotes show $110/month in energy savings — the loan payment is $95/month.',
      note: 'The monthly savings exceed the monthly payment from day one — this debt pays for itself immediately, not eventually.'
    },
    {
      e: '🎰', t: '"Debt Consolidation" for Betting Losses', cat: 'bad',
      ctx: 'A personal loan consolidates gambling losses into one payment at 16% APR — but the betting habit that created the debt hasn\'t changed.',
      note: 'Consolidating the number doesn\'t fix the behavior — without stopping the root cause, new debt just refills the hole.'
    },
    {
      e: '🏥', t: 'Planned Dental Work — 0% Plan', cat: 'good',
      ctx: 'A needed dental procedure costs $2,400. The dentist offers 0% APR over 12 months, and the fixed $200/month fits comfortably in your budget.',
      note: 'Necessary care, zero interest, and a payment that fits your budget without strain — this checks every good-debt box.'
    },
    {
      e: '📈', t: 'Margin Loan to Buy Volatile Stock', cat: 'bad',
      ctx: 'You borrow against your brokerage account at 11% interest to buy a single speculative stock, risking a forced sale if the price drops.',
      note: 'Borrowing to bet on one volatile asset — with a margin call risk — is speculation with debt attached, not investing.'
    },
  ];

  /* ── deck / level-boundary helpers ───────────────────────────── */
  const ALL_LEVEL_DECKS = [LEVEL1, LEVEL2, LEVEL3];

  /* cumulative deckIdx at which each level ENDS, e.g. [8,16,25] */
  const LEVEL_END_IDX = (() => {
    const out = [];
    let running = 0;
    for (const size of LEVEL_SIZES) { running += size; out.push(running); }
    return out;
  })();

  function buildFullDeck() {
    return ALL_LEVEL_DECKS.reduce((acc, lvlArr) => acc.concat(shuffle([...lvlArr])), []);
  }

  /* given a deckIdx, which level (1-based) is that card in? */
  function levelForDeckIdx(idx) {
    for (let i = 0; i < LEVEL_END_IDX.length; i++) {
      if (idx < LEVEL_END_IDX[i]) return i + 1;
    }
    return LEVEL_SIZES.length;
  }

  /* ── state object ────────────────────────────────────────────── */
  let G = null;

  /* ── screen registration ─────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_ddt_discovery = function () {
    G = null;
    setTimeout(initGame, 40);
    return `
<div id="ddt_root" style="
  position:absolute;inset:0;background:${DIM};overflow:hidden;
  font-family:Inter,sans-serif;color:#fff;user-select:none;
">
  <!-- ambient city canvas -->
  <canvas id="ddt_bg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>

  <!-- gradient overlays -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 50% at 50% 100%,rgba(75,45,143,.18),transparent);pointer-events:none"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:35%;background:linear-gradient(to top,rgba(10,6,15,.9),transparent);pointer-events:none"></div>

  <!-- top bar -->
  <div id="ddt_topbar" style="
    position:absolute;top:0;left:0;right:0;z-index:20;
    display:flex;align-items:center;gap:10px;
    padding:10px 14px;
    background:linear-gradient(to bottom,rgba(10,6,15,.92),transparent);
  ">
    <button id="ddt_back" style="
      background:rgba(75,45,143,.3);border:1px solid rgba(123,82,239,.4);
      color:${VIOLET};border-radius:10px;padding:7px 12px;cursor:pointer;
      font-size:.85rem;font-family:Inter,sans-serif;transition:all .15s;flex-shrink:0;
    "
    onmouseover="this.style.background='rgba(75,45,143,.55)'"
    onmouseout="this.style.background='rgba(75,45,143,.3)'"
    onclick="window.ddt_discoveryExit()">← Back</button>

    <div style="flex:1;min-width:0">
      <div style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.2em;color:${VIOLET}88;line-height:1">DEBT DETOX DISTRICT</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.82rem;letter-spacing:.08em;color:#fff;line-height:1.2;margin-top:1px">DEBT DISCOVERY</div>
    </div>

    <!-- score -->
    <div style="text-align:center;flex-shrink:0">
      <div style="font-family:Orbitron,sans-serif;font-size:.45rem;color:${GOLD}88;letter-spacing:.15em">SCORE</div>
      <div id="ddt_score_val" style="font-family:Orbitron,sans-serif;font-size:1.05rem;color:${GOLD};text-shadow:0 0 10px ${GOLD}66;font-variant-numeric:tabular-nums">0</div>
    </div>

    <!-- timer -->
    <div style="text-align:center;flex-shrink:0">
      <div style="font-family:Orbitron,sans-serif;font-size:.45rem;color:#aaa;letter-spacing:.15em">TIME</div>
      <div id="ddt_timer_val" style="font-family:Orbitron,sans-serif;font-size:1.05rem;color:#fff;font-variant-numeric:tabular-nums">1:00</div>
    </div>
  </div>

  <!-- level + combo strip -->
  <div style="
    position:absolute;top:52px;left:0;right:0;z-index:15;
    display:flex;align-items:center;justify-content:space-between;
    padding:4px 14px;
  ">
    <div id="ddt_level_badge" style="
      font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.18em;
      color:${VIOLET};border:1px solid rgba(123,82,239,.5);
      border-radius:20px;padding:3px 10px;
    ">LEVEL 1 · LEARN</div>

    <div id="ddt_combo_wrap" style="display:none;align-items:center;gap:5px">
      <div style="font-family:Orbitron,sans-serif;font-size:.45rem;color:${TEAL};letter-spacing:.15em">COMBO</div>
      <div id="ddt_combo_val" style="font-family:Orbitron,sans-serif;font-size:.8rem;color:${TEAL};text-shadow:0 0 8px ${TEAL}">×1</div>
    </div>

    <!-- cards counter -->
    <div style="font-family:Orbitron,sans-serif;font-size:.5rem;color:#aaa;letter-spacing:.1em">
      <span id="ddt_cards_done">0</span>/<span>${TOTAL_CARDS}</span>
    </div>
  </div>

  <!-- progress bar -->
  <div style="position:absolute;top:82px;left:14px;right:14px;z-index:15;height:3px;background:rgba(255,255,255,.08);border-radius:2px">
    <div id="ddt_progress_bar" style="height:100%;width:0%;background:linear-gradient(90deg,${ACCENT},${VIOLET});border-radius:2px;transition:width .3s ease"></div>
  </div>

  <!-- error health pip row -->
  <div id="ddt_pips" style="
    position:absolute;top:93px;left:0;right:0;z-index:15;
    display:flex;justify-content:center;gap:6px;
  "></div>

  <!-- bins row (bottom) -->
  <div id="ddt_bins" style="
    position:absolute;bottom:0;left:0;right:0;z-index:10;
    display:flex;height:130px;
  ">
    <!-- GOOD DEBT bin -->
    <div id="ddt_bin_good" style="
      flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:linear-gradient(to top,rgba(245,200,66,.12),rgba(245,200,66,.04));
      border-top:2px solid rgba(245,200,66,.35);
      border-right:1px solid rgba(255,255,255,.06);
      cursor:pointer;transition:background .15s;
      gap:4px;
    ">
      <div style="font-size:1.5rem">✅</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.15em;color:${GOLD}">GOOD DEBT</div>
      <div id="ddt_good_count" style="font-family:Orbitron,sans-serif;font-size:.9rem;color:${GOLD};font-variant-numeric:tabular-nums">0</div>
    </div>
    <!-- BAD DEBT bin -->
    <div id="ddt_bin_bad" style="
      flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:linear-gradient(to top,rgba(232,64,96,.12),rgba(232,64,96,.04));
      border-top:2px solid rgba(232,64,96,.35);
      border-left:1px solid rgba(255,255,255,.06);
      cursor:pointer;transition:background .15s;
      gap:4px;
    ">
      <div style="font-size:1.5rem">❌</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.15em;color:${CRIMSON}">BAD DEBT</div>
      <div id="ddt_bad_count" style="font-family:Orbitron,sans-serif;font-size:.9rem;color:${CRIMSON};font-variant-numeric:tabular-nums">0</div>
    </div>
  </div>

  <!-- card stage (middle) -->
  <div id="ddt_stage" style="
    position:absolute;left:0;right:0;
    top:110px;bottom:130px;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    z-index:12;
  ">
    <!-- card goes here dynamically -->
    <div id="ddt_hint" style="
      font-size:.7rem;color:rgba(255,255,255,.3);margin-top:12px;
      font-family:Inter,sans-serif;text-align:center;
    ">Drag the card · or tap a bin · or press ← →</div>
  </div>

  <!-- feedback flash -->
  <div id="ddt_flash" style="
    position:absolute;inset:0;z-index:50;pointer-events:none;
    opacity:0;transition:opacity .15s;
  "></div>

  <!-- card timeout bar sits below card -->
  <div id="ddt_timeout_track" style="
    position:absolute;left:10%;right:10%;height:3px;border-radius:2px;
    background:rgba(255,255,255,.08);z-index:13;display:none;
  ">
    <div id="ddt_timeout_bar" style="height:100%;width:100%;border-radius:2px;background:${VIOLET};transition:width linear"></div>
  </div>

  <style>
    @keyframes ddt_card_in {
      from { opacity:0; transform:translateY(-40px) scale(.9); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    @keyframes ddt_card_fly_good {
      to { opacity:0; transform:translateX(-120vw) rotate(-15deg); }
    }
    @keyframes ddt_card_fly_bad {
      to { opacity:0; transform:translateX(120vw) rotate(15deg); }
    }
    @keyframes ddt_shake {
      0%,100%{ transform:translateX(0) }
      20%{ transform:translateX(-8px) }
      40%{ transform:translateX(8px) }
      60%{ transform:translateX(-6px) }
      80%{ transform:translateX(6px) }
    }
    @keyframes ddt_pulse_good {
      0%{ box-shadow:0 0 0 0 rgba(245,200,66,.5); }
      100%{ box-shadow:0 0 0 20px rgba(245,200,66,0); }
    }
    @keyframes ddt_pulse_bad {
      0%{ box-shadow:0 0 0 0 rgba(232,64,96,.5); }
      100%{ box-shadow:0 0 0 20px rgba(232,64,96,0); }
    }
    @keyframes ddt_pop_in {
      from{ transform:scale(0) rotate(-10deg); opacity:0; }
      to  { transform:scale(1) rotate(0deg); opacity:1; }
    }
    @keyframes ddt_bonus_float {
      0%  { opacity:1; transform:translateY(0) scale(1); }
      100%{ opacity:0; transform:translateY(-60px) scale(1.3); }
    }
    @keyframes ddt_city_glow {
      0%,100%{ opacity:.6; }
      50%{ opacity:1; }
    }
    @keyframes ddt_combo_particle {
      0%  { opacity:1; transform:translate(0,0) scale(1); }
      100%{ opacity:0; transform:translate(var(--px),var(--py)) scale(.3); }
    }
    @keyframes ddt_win_pop {
      0%  { opacity:0; transform:scale(.5) rotate(-6deg); }
      60% { opacity:1; transform:scale(1.07) rotate(2deg); }
      82% { transform:scale(.96) rotate(-1deg); }
      100%{ opacity:1; transform:scale(1) rotate(0deg); }
    }
    #ddt_bin_good:hover { background: linear-gradient(to top, rgba(245,200,66,.22), rgba(245,200,66,.08)) !important; }
    #ddt_bin_bad:hover  { background: linear-gradient(to top, rgba(232,64,96,.22), rgba(232,64,96,.08)) !important; }
  </style>
</div>`;
  };

  /* ── init ────────────────────────────────────────────────────── */
  function initGame() {
    const root = document.getElementById('ddt_root');
    if (!root) return;

    /* build shuffled deck: L1 cards, then L2 cards, then L3 cards */
    const deck = buildFullDeck();

    G = {
      deck,
      deckIdx:       0,
      score:         0,
      errors:        0,
      combo:         0,
      bestCombo:     0,
      goodCount:     0,
      badCount:      0,
      level:         1,
      timeLeft:      60,  // seconds
      cardStartMs:   0,
      active:        false,
      done:          false,
      timerInterval: null,
      cardTimeout:   null,
      lastLevelUpIdx: -1, // deckIdx the level-up banner was last shown at — prevents re-triggering it forever
      /* drag state */
      dragging:      false,
      dragCard:      null,
      dragStartX:    0,
      dragStartY:    0,
      dragOffX:      0,
      dragOffY:      0,
      cardX:         0,
      cardY:         0,
    };

    buildPips();
    drawCityBg();
    attachBinListeners();  // only called on first load; ddt_playAgain uses initGameReplay which skips this
    attachKeyboard();
    startTimer();
    showNextCard();
  }

  /* ── city background canvas ──────────────────────────────────── */
  function drawCityBg() {
    const canvas = document.getElementById('ddt_bg');
    if (!canvas) return;
    const W = canvas.offsetWidth || window.innerWidth;
    const H = canvas.offsetHeight || window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    /* sky gradient */
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#06030E');
    sky.addColorStop(1, '#130926');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    /* stars */
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H * 0.7;
      const r = Math.random() * 1.2 + 0.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,180,255,${Math.random() * 0.6 + 0.2})`;
      ctx.fill();
    }

    /* silhouette buildings */
    const buildings = [
      { x: 0,          w: 55,  h: 90,  col: '#120A1E' },
      { x: 40,         w: 35,  h: 130, col: '#0F0820' },
      { x: 65,         w: 60,  h: 75,  col: '#110922' },
      { x: 110,        w: 45,  h: 110, col: '#0C061A' },
      { x: 140,        w: 70,  h: 160, col: '#100820' },
      { x: W * 0.28,   w: 50,  h: 100, col: '#12092A' },
      { x: W * 0.35,   w: 40,  h: 140, col: '#0E071F' },
      { x: W * 0.44,   w: 80,  h: 85,  col: '#130A22' },
      { x: W * 0.55,   w: 45,  h: 150, col: '#0F0820' },
      { x: W * 0.62,   w: 60,  h: 95,  col: '#110922' },
      { x: W * 0.72,   w: 35,  h: 125, col: '#0C061A' },
      { x: W * 0.79,   w: 55,  h: 80,  col: '#100820' },
      { x: W - 120,    w: 50,  h: 110, col: '#0E071F' },
      { x: W - 70,     w: 40,  h: 145, col: '#12092A' },
      { x: W - 38,     w: 38,  h: 75,  col: '#0F0820' },
    ];

    buildings.forEach(b => {
      /* main silhouette */
      ctx.fillStyle = b.col;
      ctx.fillRect(b.x, H - b.h, b.w, b.h);

      /* purple glow windows */
      for (let wy = H - b.h + 8; wy < H - 15; wy += 14) {
        for (let wx = b.x + 5; wx < b.x + b.w - 8; wx += 12) {
          if (Math.random() < 0.45) {
            ctx.fillStyle = Math.random() < 0.3
              ? `rgba(245,200,66,${Math.random() * 0.5 + 0.2})`
              : `rgba(123,82,239,${Math.random() * 0.5 + 0.2})`;
            ctx.fillRect(wx, wy, 6, 5);
          }
        }
      }

      /* rooftop accent line */
      ctx.strokeStyle = `rgba(123,82,239,${Math.random() * 0.4 + 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x, H - b.h);
      ctx.lineTo(b.x + b.w, H - b.h);
      ctx.stroke();
    });

    /* ground glow strip */
    const grd = ctx.createLinearGradient(0, H - 20, 0, H);
    grd.addColorStop(0, `rgba(75,45,143,.4)`);
    grd.addColorStop(1, `rgba(75,45,143,0)`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, H - 20, W, 20);
  }

  /* ── error pips ──────────────────────────────────────────────── */
  function buildPips() {
    const container = document.getElementById('ddt_pips');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < ERROR_MAX; i++) {
      const pip = document.createElement('div');
      pip.id = `ddt_pip_${i}`;
      pip.style.cssText = `
        width:10px;height:10px;border-radius:50%;
        background:rgba(232,64,96,.6);
        border:1px solid rgba(232,64,96,.4);
        transition:all .2s;
      `;
      container.appendChild(pip);
    }
  }

  function updatePips() {
    for (let i = 0; i < ERROR_MAX; i++) {
      const pip = document.getElementById(`ddt_pip_${i}`);
      if (!pip) continue;
      if (i < G.errors) {
        pip.style.background = 'rgba(232,64,96,.15)';
        pip.style.border = '1px solid rgba(232,64,96,.15)';
      } else {
        pip.style.background = 'rgba(232,64,96,.6)';
        pip.style.border = '1px solid rgba(232,64,96,.4)';
      }
    }
  }

  /* ── timer ───────────────────────────────────────────────────── */
  function startTimer() {
    G.timerInterval = setInterval(() => {
      if (!G || G.done || !G.active) return;   // don't burn the clock while the level-up banner is up
      G.timeLeft--;
      updateTimerDisplay();
      if (G.timeLeft <= 0) {
        clearInterval(G.timerInterval);
        triggerEnd(false);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const el = document.getElementById('ddt_timer_val');
    if (!el) return;
    const m = Math.floor(G.timeLeft / 60);
    const s = G.timeLeft % 60;
    el.textContent = `${m}:${s.toString().padStart(2,'0')}`;
    el.style.color = G.timeLeft <= 10 ? CRIMSON : G.timeLeft <= 20 ? '#FF9900' : '#fff';
    if (G.timeLeft <= 10) el.style.textShadow = `0 0 8px ${CRIMSON}88`;
    else el.style.textShadow = 'none';
  }

  /* ── card rendering ──────────────────────────────────────────── */
  function showNextCard() {
    if (!G || G.done) return;

    if (G.deckIdx >= G.deck.length) {
      triggerEnd(true);
      return;
    }

    /* level transition announcement — fires at the end of L1 and end of L2.
       deckIdx doesn't change while the banner is up (no card was sorted), so guard
       with lastLevelUpIdx or this refires forever every time CONTINUE calls back in. */
    if (LEVEL_END_IDX.slice(0, -1).includes(G.deckIdx) && G.deckIdx !== G.lastLevelUpIdx) {
      G.lastLevelUpIdx = G.deckIdx;
      showLevelUp();
      return;
    }

    const card = G.deck[G.deckIdx];
    G.cardStartMs = Date.now();
    G.active = true;

    const stage = document.getElementById('ddt_stage');
    if (!stage) return;

    /* clear old card */
    const old = document.getElementById('ddt_active_card');
    if (old) old.remove();

    /* level 2+ context banner — situational cards hide the giveaway note and show ctx instead */
    const showCtx = G.level >= 2 && card.ctx;
    const ctxHtml = showCtx ? `
      <div style="
        background:rgba(75,45,143,.25);border:1px solid rgba(123,82,239,.3);
        border-radius:10px;padding:8px 12px;margin-top:10px;
        font-size:.68rem;line-height:1.5;color:#c9b8f0;text-align:center;
        max-width:280px;
      ">${card.ctx}</div>` : '';

    const cardEl = document.createElement('div');
    cardEl.id = 'ddt_active_card';
    cardEl.style.cssText = `
      position:relative;
      width:min(300px,80vw);
      background:linear-gradient(145deg,rgba(30,18,55,.97),rgba(18,10,35,.99));
      border:2px solid rgba(123,82,239,.5);
      border-radius:20px;
      padding:22px 18px;
      text-align:center;
      box-shadow:0 0 40px rgba(75,45,143,.3),0 8px 32px rgba(0,0,0,.6);
      animation:ddt_card_in .35s cubic-bezier(.22,1,.36,1) both;
      cursor:grab;
      z-index:30;
      touch-action:none;
    `;
    cardEl.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${VIOLET},transparent);border-radius:20px 20px 0 0"></div>
      <div style="font-size:2.8rem;line-height:1;margin-bottom:10px">${card.e}</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.85rem;letter-spacing:.05em;color:#fff;margin-bottom:6px">${card.t}</div>
      ${showCtx ? '' : `<div style="font-size:.65rem;color:rgba(255,255,255,.4);line-height:1.5;max-width:230px;margin:0 auto">${card.note}</div>`}
      ${ctxHtml}
      <div style="margin-top:14px;display:flex;justify-content:center;gap:20px">
        <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:${GOLD}88;letter-spacing:.12em">← GOOD</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:${CRIMSON}88;letter-spacing:.12em">BAD →</div>
      </div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${ACCENT},transparent);border-radius:0 0 20px 20px"></div>
    `;

    stage.appendChild(cardEl);

    /* position timeout track */
    const track = document.getElementById('ddt_timeout_track');
    if (track) {
      const stageRect = stage.getBoundingClientRect();
      const cardRect  = cardEl.getBoundingClientRect();
      track.style.display = 'block';
      track.style.top  = (cardRect.bottom - stageRect.top + 8) + 'px';
    }

    /* start card timeout bar */
    startCardTimeout(cardEl);

    /* attach drag */
    attachDrag(cardEl, card);

    /* update HUD */
    updateHUD();
  }

  /* ── card timeout ────────────────────────────────────────────── */
  function startCardTimeout(cardEl) {
    if (G.cardTimeout) clearTimeout(G.cardTimeout);
    const timeoutMs = G.level >= 3 ? CARD_TIMEOUT_L3 : CARD_TIMEOUT;
    const bar = document.getElementById('ddt_timeout_bar');
    if (bar) {
      bar.style.transition = 'none';
      bar.style.width = '100%';
      requestAnimationFrame(() => {
        bar.style.transition = `width ${timeoutMs}ms linear`;
        bar.style.width = '0%';
      });
    }
    G.cardTimeout = setTimeout(() => {
      if (!G || G.done || !G.active) return;
      /* timed out → count as miss */
      registerSort(null, cardEl);
    }, timeoutMs);
  }

  /* ── drag system ─────────────────────────────────────────────── */
  function attachDrag(cardEl, card) {
    let startX = 0, startY = 0, currX = 0, currY = 0;
    let isDragging = false;
    let stageRect;

    function getStage() {
      return document.getElementById('ddt_stage');
    }

    function onStart(ex, ey) {
      isDragging = true;
      startX = ex; startY = ey;
      currX = 0; currY = 0;
      stageRect = getStage()?.getBoundingClientRect();
      cardEl.style.cursor = 'grabbing';
      cardEl.style.transition = 'none';
      cardEl.style.zIndex = '40';
    }

    function onMove(ex, ey) {
      if (!isDragging) return;
      currX = ex - startX;
      currY = ey - startY;
      const rot = currX * 0.08;
      cardEl.style.transform = `translate(${currX}px, ${currY}px) rotate(${rot}deg)`;

      /* tint overlay */
      if (currX < -30) {
        cardEl.style.boxShadow = `0 0 40px rgba(245,200,66,.5),0 8px 32px rgba(0,0,0,.6),inset 0 0 0 2px rgba(245,200,66,.5)`;
      } else if (currX > 30) {
        cardEl.style.boxShadow = `0 0 40px rgba(232,64,96,.5),0 8px 32px rgba(0,0,0,.6),inset 0 0 0 2px rgba(232,64,96,.5)`;
      } else {
        cardEl.style.boxShadow = `0 0 40px rgba(75,45,143,.3),0 8px 32px rgba(0,0,0,.6)`;
      }
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      cardEl.style.cursor = 'grab';

      const THRESHOLD = 80;
      if (currX < -THRESHOLD) {
        flyCard(cardEl, 'good', card);
      } else if (currX > THRESHOLD) {
        flyCard(cardEl, 'bad', card);
      } else {
        /* snap back */
        cardEl.style.transition = 'transform .3s cubic-bezier(.22,1,.36,1), box-shadow .2s';
        cardEl.style.transform  = 'translate(0,0) rotate(0deg)';
        cardEl.style.boxShadow  = `0 0 40px rgba(75,45,143,.3),0 8px 32px rgba(0,0,0,.6)`;
        cardEl.style.zIndex     = '30';
      }
    }

    /* mouse */
    const _mm = e => { if (isDragging) onMove(e.clientX, e.clientY); };
    const _mu = () => { if (isDragging) onEnd(); };
    cardEl.addEventListener('mousedown', e => { onStart(e.clientX, e.clientY); e.preventDefault(); });
    window.addEventListener('mousemove', _mm);
    window.addEventListener('mouseup', _mu);
    /* store on G so exit can remove them */
    G._mouseMove = _mm;
    G._mouseUp   = _mu;

    /* touch */
    cardEl.addEventListener('touchstart', e => {
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    cardEl.addEventListener('touchmove', e => {
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    cardEl.addEventListener('touchend', () => { onEnd(); });
  }

  /* ── bin tap ─────────────────────────────────────────────────── */
  function attachBinListeners() {
    const binGood = document.getElementById('ddt_bin_good');
    const binBad  = document.getElementById('ddt_bin_bad');
    if (binGood) binGood.addEventListener('click', () => {
      if (!G || !G.active || G.done) return;
      const cardEl = document.getElementById('ddt_active_card');
      if (cardEl) flyCard(cardEl, 'good', G.deck[G.deckIdx]);
    });
    if (binBad) binBad.addEventListener('click', () => {
      if (!G || !G.active || G.done) return;
      const cardEl = document.getElementById('ddt_active_card');
      if (cardEl) flyCard(cardEl, 'bad', G.deck[G.deckIdx]);
    });
  }

  /* ── keyboard ─────────────────────────────────────────────────── */
  function attachKeyboard() {
    function handler(e) {
      if (!G || !G.active || G.done) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        const cardEl = document.getElementById('ddt_active_card');
        if (cardEl) flyCard(cardEl, 'good', G.deck[G.deckIdx]);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        const cardEl = document.getElementById('ddt_active_card');
        if (cardEl) flyCard(cardEl, 'bad', G.deck[G.deckIdx]);
      }
    }
    document.addEventListener('keydown', handler);
    /* store ref for cleanup */
    G._kbHandler = handler;
  }

  /* ── fly animation → resolve ─────────────────────────────────── */
  function flyCard(cardEl, direction, card) {
    if (!G || !G.active) return;
    G.active = false;
    if (G.cardTimeout) { clearTimeout(G.cardTimeout); G.cardTimeout = null; }

    /* stop timeout bar */
    const bar = document.getElementById('ddt_timeout_bar');
    if (bar) { bar.style.transition = 'none'; bar.style.width = bar.style.width; }

    const anim = direction === 'good' ? 'ddt_card_fly_good' : 'ddt_card_fly_bad';
    cardEl.style.animation = `${anim} .4s cubic-bezier(.55,.06,.68,.19) forwards`;

    setTimeout(() => {
      registerSort(direction, cardEl);
    }, 380);
  }

  /* ── sort logic ──────────────────────────────────────────────── */
  function registerSort(direction, cardEl) {
    if (!G) return;
    /* remove per-card drag listeners before they accumulate */
    if (G._mouseMove) { window.removeEventListener('mousemove', G._mouseMove); G._mouseMove = null; }
    if (G._mouseUp)   { window.removeEventListener('mouseup',   G._mouseUp);   G._mouseUp   = null; }
    if (cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);

    const card = G.deck[G.deckIdx];
    const elapsed = Date.now() - G.cardStartMs;

    if (direction === null) {
      /* timed out — count as wrong */
      onWrong(card, 'timeout');
    } else if (direction === card.cat) {
      onCorrect(card, elapsed);
    } else {
      onWrong(card, 'wrong');
    }

    G.deckIdx++;
    updateHUD();

    /* pause briefly then show next */
    setTimeout(() => {
      if (!G || G.done) return;
      showNextCard();
    }, 600);
  }

  function onCorrect(card, elapsed) {
    G.combo++;
    if (G.combo > G.bestCombo) G.bestCombo = G.combo;

    let pts = 10;

    /* speed bonus */
    let speedBonus = 0;
    if (elapsed < SPEED_BONUS_MS) {
      speedBonus = 5;
      pts += speedBonus;
    }

    /* combo bonus */
    let comboBonus = 0;
    if (G.combo >= COMBO_THRESHOLD) {
      comboBonus = Math.min(G.combo - COMBO_THRESHOLD + 1, 5) * 3;
      pts += comboBonus;
    }

    G.score += pts;
    if (card.cat === 'good') G.goodCount++; else G.badCount++;

    updateScoreDisplay();
    updateCombo();
    flashScreen(GOLD, 0.18);
    pulseBin(card.cat);

    if (speedBonus > 0 || comboBonus > 0) {
      showFloatingBonus(`+${pts}`, comboBonus > 0 ? TEAL : GOLD, G.combo);
    } else {
      showFloatingBonus(`+${pts}`, GOLD, G.combo);
    }
  }

  function onWrong(card, reason) {
    G.combo = 0;
    G.score = Math.max(0, G.score - 5);
    G.errors++;

    updateScoreDisplay();
    updateCombo();
    updatePips();
    flashScreen(CRIMSON, 0.25);
    shakeStage();

    if (reason === 'timeout') showFloatingBonus('⏰ MISS!', CRIMSON);
    else showFloatingBonus('💪 NICE TRY −5', CRIMSON);

    if (G.errors >= ERROR_MAX) {
      setTimeout(() => triggerEnd(false), 300);
    }
  }

  /* ── combo display ───────────────────────────────────────────── */
  function updateCombo() {
    const wrap = document.getElementById('ddt_combo_wrap');
    const val  = document.getElementById('ddt_combo_val');
    if (!wrap || !val) return;
    if (G.combo >= COMBO_THRESHOLD) {
      wrap.style.display = 'flex';
      val.textContent = `×${G.combo}`;
      val.style.color = G.combo >= 6 ? GOLD : TEAL;
    } else {
      wrap.style.display = 'none';
    }
  }

  /* ── HUD update ──────────────────────────────────────────────── */
  function updateHUD() {
    const done = document.getElementById('ddt_cards_done');
    const prog = document.getElementById('ddt_progress_bar');
    const gc   = document.getElementById('ddt_good_count');
    const bc   = document.getElementById('ddt_bad_count');
    if (done) done.textContent = G.deckIdx;
    if (prog) prog.style.width = `${(G.deckIdx / TOTAL_CARDS) * 100}%`;
    if (gc)   gc.textContent = G.goodCount;
    if (bc)   bc.textContent = G.badCount;
  }

  function updateScoreDisplay() {
    const el = document.getElementById('ddt_score_val');
    if (el) el.textContent = G.score;
  }

  /* ── flash / shake / pulse ───────────────────────────────────── */
  function flashScreen(color, alpha) {
    const el = document.getElementById('ddt_flash');
    if (!el) return;
    el.style.background = color;
    el.style.opacity = alpha;
    setTimeout(() => { el.style.opacity = 0; }, 180);
  }

  function shakeStage() {
    const stage = document.getElementById('ddt_stage');
    if (!stage) return;
    stage.style.animation = 'ddt_shake .35s ease';
    setTimeout(() => { stage.style.animation = ''; }, 380);
  }

  /* pulses the bin that ACTUALLY matches the card's category — previously
     this always pulsed the good bin even when a card was correctly sorted
     into bad debt, so players sorting into the bad bin got feedback on the
     wrong side of the screen. cat is 'good' or 'bad'. */
  function pulseBin(cat) {
    const binId = cat === 'good' ? 'ddt_bin_good' : 'ddt_bin_bad';
    const anim  = cat === 'good' ? 'ddt_pulse_good' : 'ddt_pulse_bad';
    const bin = document.getElementById(binId);
    if (!bin) return;
    bin.style.animation = `${anim} .4s ease-out`;
    setTimeout(() => { bin.style.animation = ''; }, 420);
  }

  /* combo (optional) scales the visual punch — hit #1 and hit #10 in a
     streak should NOT look identical: font grows and a particle burst
     appears once the combo is deep enough. Purely visual — scoring math
     (pts/comboBonus) is untouched. */
  function showFloatingBonus(text, color, combo) {
    const stage = document.getElementById('ddt_stage');
    if (!stage) return;
    const comboLevel = combo || 0;
    const growth = Math.min(comboLevel, 10) * 0.035; // up to +0.35rem at combo 10+
    const fontSize = (1.2 + growth).toFixed(2) + 'rem';

    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      font-family:Orbitron,sans-serif;font-size:${fontSize};font-weight:700;
      color:${color};text-shadow:0 0 12px ${color}88;
      pointer-events:none;z-index:80;white-space:nowrap;
      animation:ddt_bonus_float .8s ease-out forwards;
    `;
    el.textContent = text;
    stage.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 850);

    /* particle burst scales with combo depth once past the combo threshold */
    if (comboLevel >= COMBO_THRESHOLD) {
      const particleCount = 9 + Math.min(12, comboLevel);
      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.4;
        const dist  = 40 + Math.random() * 50;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        p.style.cssText = `
          position:absolute;top:50%;left:50%;width:5px;height:5px;border-radius:50%;
          background:${color};box-shadow:0 0 6px ${color};pointer-events:none;z-index:79;
          --px:${px}px;--py:${py}px;
          animation:ddt_combo_particle .6s ease-out forwards;
        `;
        stage.appendChild(p);
        setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 620);
      }
    }
  }

  /* ── level up transition ─────────────────────────────────────── */
  const LEVEL_UP_COPY = {
    2: {
      badgeText: 'LEVEL 2 · MASTER',
      badgeColor: GOLD,
      unlockText: 'LEVEL 2 UNLOCKED',
      modeText: 'MASTER MODE',
      desc: 'Now context matters — the same debt type can be Good or Bad depending on interest rate, income, and purpose.'
    },
    3: {
      badgeText: 'LEVEL 3 · STRATEGIST',
      badgeColor: TEAL,
      unlockText: 'LEVEL 3 UNLOCKED',
      modeText: 'STRATEGIST MODE',
      desc: 'Multiple factors stack at once — rate, timing, purpose, and habit all matter together. The clock is faster now, too.'
    }
  };

  function showLevelUp() {
    G.active = false;
    const targetLevel = levelForDeckIdx(G.deckIdx);
    G.level = targetLevel;
    const copy = LEVEL_UP_COPY[targetLevel] || LEVEL_UP_COPY[2];

    const badge = document.getElementById('ddt_level_badge');
    if (badge) {
      badge.textContent = copy.badgeText;
      badge.style.borderColor = `${copy.badgeColor}80`;
      badge.style.color = copy.badgeColor;
    }

    const stage = document.getElementById('ddt_stage');
    if (!stage) { showNextCard(); return; }

    const banner = document.createElement('div');
    banner.style.cssText = `
      position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
      z-index:60;background:rgba(10,6,15,.85);animation:ddt_card_in .3s ease both;
    `;
    banner.innerHTML = `
      <div style="font-size:2rem;margin-bottom:10px">🔓</div>
      <div style="font-family:Orbitron,sans-serif;font-size:1.1rem;letter-spacing:.12em;color:${copy.badgeColor};text-shadow:0 0 16px ${copy.badgeColor}88;margin-bottom:8px">${copy.unlockText}</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.15em;color:${VIOLET};margin-bottom:14px">${copy.modeText}</div>
      <div style="font-size:.72rem;color:rgba(255,255,255,.6);text-align:center;max-width:260px;line-height:1.6;margin-bottom:20px">
        ${copy.desc}
      </div>
      <button id="ddt_continue_btn" style="
        font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.15em;
        background:linear-gradient(135deg,${ACCENT},${VIOLET});
        border:none;color:#fff;border-radius:14px;padding:12px 28px;cursor:pointer;
        box-shadow:0 0 20px rgba(75,45,143,.5);
      ">CONTINUE →</button>
    `;

    const root = document.getElementById('ddt_root');
    if (root) root.appendChild(banner);

    document.getElementById('ddt_continue_btn')?.addEventListener('click', () => {
      banner.remove();
      showNextCard();
    });
  }

  /* ── end game ────────────────────────────────────────────────── */
  function triggerEnd(won) {
    if (!G || G.done) return;
    G.done   = true;
    G.active = false;
    if (G.timerInterval) clearInterval(G.timerInterval);
    if (G.cardTimeout)   clearTimeout(G.cardTimeout);
    if (G._kbHandler)    document.removeEventListener('keydown', G._kbHandler);

    /* remove active card */
    const old = document.getElementById('ddt_active_card');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    /* compute stars */
    let stars;
    if (!won) {
      stars = G.score >= STAR2_SCORE ? 1 : G.score > 0 ? 1 : 0;
    } else if (G.score >= STAR3_SCORE && G.errors === 0) {
      stars = 3;
    } else if (G.score >= STAR2_SCORE) {
      stars = 2;
    } else {
      stars = 1;
    }

    endGame(stars, won);
  }

  function endGame(stars, won) {
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ddt_discovery', { level: G.level, stars, is3star, isPerfect: is3star, badge: 'Debt Detective' })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('ddt_recovery', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    const root = document.getElementById('ddt_root');
    if (!root) return;

    const starStr = stars >= 1 ? ['⭐','⭐⭐','⭐⭐⭐'][stars - 1] : '💀';
    const accuracy = G.deckIdx > 0 ? Math.round(((G.deckIdx - G.errors) / Math.max(G.deckIdx,1)) * 100) : 0;

    const overlay = document.createElement('div');
    overlay.id = 'ddt_end_overlay';
    overlay.style.cssText = `
      position:absolute;inset:0;z-index:100;
      background:rgba(10,6,15,.92);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:20px;
      animation:ddt_card_in .4s ease both;
    `;

    /* won runs get a bouncy scale+rotate pop-in on the card itself so a
       3-star clear FEELS different from a session-ended loss, which keeps
       the plainer backdrop fade only */
    const cardAnim = won ? 'ddt_win_pop .55s cubic-bezier(.22,1.4,.4,1) .1s both' : 'ddt_card_in .4s ease both';

    overlay.innerHTML = `
      <div style="
        width:min(360px,90vw);
        background:linear-gradient(145deg,rgba(30,18,55,.98),rgba(15,8,28,.99));
        border:2px solid rgba(123,82,239,.4);
        border-radius:24px;
        padding:26px 22px;
        text-align:center;
        box-shadow:0 0 60px rgba(75,45,143,.25),0 20px 60px rgba(0,0,0,.8);
        position:relative;overflow:hidden;
        animation:${cardAnim};
      ">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${VIOLET},transparent)"></div>

        <div style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.22em;color:${VIOLET}88;margin-bottom:6px">
          ${won ? 'DISTRICT CLEARED' : 'SESSION ENDED'}
        </div>

        <div style="font-size:2.6rem;margin:4px 0 8px">${starStr}</div>

        <div style="font-family:Orbitron,sans-serif;font-size:1.15rem;letter-spacing:.1em;
          color:${won ? GOLD : CRIMSON};
          text-shadow:0 0 14px ${won ? GOLD : CRIMSON}88;margin-bottom:18px">
          ${won ? (stars === 3 ? 'DEBT MASTER!' : stars === 2 ? 'WELL SORTED!' : 'CLEARED!') : 'BETTER LUCK!'}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
          ${statBox('SCORE', G.score, GOLD)}
          ${statBox('ACCURACY', accuracy + '%', TEAL)}
          ${statBox('ERRORS', G.errors + '/' + ERROR_MAX, CRIMSON)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          ${statBox('GOOD DEBT', G.goodCount, GOLD)}
          ${statBox('BAD DEBT',  G.badCount,  CRIMSON)}
        </div>

        ${coins > 0 ? `
        <div style="
          background:linear-gradient(135deg,rgba(245,200,66,.12),rgba(245,200,66,.04));
          border:1px solid rgba(245,200,66,.3);
          border-radius:12px;padding:10px;margin-bottom:14px;
        ">
          <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:${GOLD}88;letter-spacing:.15em">COINS EARNED</div>
          <div style="font-family:Orbitron,sans-serif;font-size:1.4rem;color:${GOLD};text-shadow:0 0 12px ${GOLD}88">+${coins} 🪙</div>
        </div>
        ` : ''}

        <div style="
          background:rgba(75,45,143,.15);border:1px solid rgba(123,82,239,.25);
          border-radius:12px;padding:12px;margin-bottom:18px;
          font-size:.68rem;line-height:1.65;color:#b8a8d8;text-align:left;
        ">
          <div style="font-family:Orbitron,sans-serif;font-size:.48rem;letter-spacing:.1em;color:${VIOLET};margin-bottom:5px">💡 LESSON</div>
          Not all debt is harmful. <strong style="color:${GOLD}">Good debt</strong> — like a mortgage or student loan — builds assets and future income. <strong style="color:${CRIMSON}">Bad debt</strong> — like payday loans or luxury credit — costs more than it gives back. Always ask: does this debt help me grow or hold me back?
        </div>

        <div style="display:flex;gap:10px">
          <button onclick="window.ddt_playAgain()" style="
            flex:1;padding:11px 8px;border-radius:12px;cursor:pointer;
            border:2px solid rgba(123,82,239,.5);
            background:rgba(75,45,143,.2);
            color:${VIOLET};font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.1em;
            transition:all .15s;
          "
          onmouseover="this.style.background='rgba(75,45,143,.4)'"
          onmouseout="this.style.background='rgba(75,45,143,.2)'">
            ↻ PLAY AGAIN
          </button>
          <button onclick="window.ddt_discoveryExit()" style="
            flex:1;padding:11px 8px;border-radius:12px;cursor:pointer;
            border:2px solid rgba(245,200,66,.4);
            background:rgba(245,200,66,.1);
            color:${GOLD};font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.1em;
            transition:all .15s;
          "
          onmouseover="this.style.background='rgba(245,200,66,.2)'"
          onmouseout="this.style.background='rgba(245,200,66,.1)'">
            ← HUB
          </button>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${ACCENT},transparent)"></div>
      </div>
    `;

    root.appendChild(overlay);
  }

  function statBox(label, val, color) {
    return `
      <div style="
        background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);
        border-radius:10px;padding:8px 4px;
      ">
        <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:#666;letter-spacing:.08em;margin-bottom:3px">${label}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.85rem;color:${color};font-variant-numeric:tabular-nums">${val}</div>
      </div>
    `;
  }

  /* ── play again ──────────────────────────────────────────────── */
  window.ddt_playAgain = function () {
    /* clear any running timers from the previous round before re-init */
    if (G) {
      if (G.timerInterval) clearInterval(G.timerInterval);
      if (G.cardTimeout)   clearTimeout(G.cardTimeout);
      if (G._kbHandler)    document.removeEventListener('keydown', G._kbHandler);
      if (G._mouseMove)    window.removeEventListener('mousemove', G._mouseMove);
      if (G._mouseUp)      window.removeEventListener('mouseup', G._mouseUp);
    }
    G = null;

    const overlay = document.getElementById('ddt_end_overlay');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);

    /* reset level badge */
    const badge = document.getElementById('ddt_level_badge');
    if (badge) {
      badge.textContent = 'LEVEL 1 · LEARN';
      badge.style.borderColor = 'rgba(123,82,239,.5)';
      badge.style.color = VIOLET;
    }

    /* reset progress */
    const prog = document.getElementById('ddt_progress_bar');
    if (prog) prog.style.width = '0%';

    /* reset combo */
    const wrap = document.getElementById('ddt_combo_wrap');
    if (wrap) wrap.style.display = 'none';

    /* reset bin counts display */
    const gc = document.getElementById('ddt_good_count');
    const bc = document.getElementById('ddt_bad_count');
    if (gc) gc.textContent = '0';
    if (bc) bc.textContent = '0';

    /* reset timer display */
    const tv = document.getElementById('ddt_timer_val');
    if (tv) { tv.textContent = '1:00'; tv.style.color = '#fff'; tv.style.textShadow = 'none'; }

    /* reset score display */
    const sv = document.getElementById('ddt_score_val');
    if (sv) sv.textContent = '0';

    /* rebuild pips */
    buildPips();

    /* rebuild game state — skip bin listeners (DOM nodes persist, listeners already attached) */
    initGameReplay();
  };

  /* initGameReplay: same as initGame but skips attachBinListeners to avoid duplicate handlers */
  function initGameReplay() {
    const root = document.getElementById('ddt_root');
    if (!root) return;

    const deck = buildFullDeck();

    G = {
      deck,
      deckIdx:       0,
      score:         0,
      errors:        0,
      combo:         0,
      bestCombo:     0,
      goodCount:     0,
      badCount:      0,
      level:         1,
      timeLeft:      60,
      cardStartMs:   0,
      active:        false,
      done:          false,
      timerInterval: null,
      cardTimeout:   null,
      lastLevelUpIdx: -1,
      dragging:      false,
      dragCard:      null,
      dragStartX:    0,
      dragStartY:    0,
      dragOffX:      0,
      dragOffY:      0,
      cardX:         0,
      cardY:         0,
    };

    buildPips();
    attachKeyboard();
    startTimer();
    showNextCard();
  }

  /* ── exit ────────────────────────────────────────────────────── */
  window.ddt_discoveryExit = function () {
    if (G) {
      if (G.timerInterval) clearInterval(G.timerInterval);
      if (G.cardTimeout)   clearTimeout(G.cardTimeout);
      if (G._kbHandler)    document.removeEventListener('keydown', G._kbHandler);
      if (G._mouseMove)    window.removeEventListener('mousemove', G._mouseMove);
      if (G._mouseUp)      window.removeEventListener('mouseup', G._mouseUp);
    }
    G = null;
    if (window.state) state.viewingWorld = 'rebuilder';
    goTo('hub');
  };

  /* ── debug hook (dev-only; safe no-op in prod if never called) ── */
  window._ddtDiscoveryDbg = function () {
    return G ? {
      level: G.level,
      deckIdx: G.deckIdx,
      deckLen: G.deck.length,
      levelEndIdx: LEVEL_END_IDX,
      score: G.score,
      errors: G.errors,
    } : null;
  };
  /* force-jump straight to the first card of Level 3, for QA */
  window._ddtDiscoveryForceLevel3 = function () {
    if (!G) return false;
    if (G.cardTimeout) { clearTimeout(G.cardTimeout); G.cardTimeout = null; }
    const old = document.getElementById('ddt_active_card');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    G.deckIdx = LEVEL_END_IDX[1];   // first index of level 3
    G.active = false;
    showNextCard();
    return true;
  };

  /* ── utils ───────────────────────────────────────────────────── */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

})();
