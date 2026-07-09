/* ════════════════════════════════════════════════════════════════
   RESEARCH CORE — Investopia Hub mini-game
   Mechanic: Spot & Match — Rate companies Strong Buy / Hold / Avoid
   Level 1 (Learn): 4 companies, clear metrics, 60s
   Level 2 (Master): 7 companies, news noise, analyst opinions, 75s
   Level 3 (Pro): 10 companies, conflicting hype/panic signals, 90s
   Accent: #00C853 (Investopia green)
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ACCENT     = '#00C853';
  const ACCENT_DIM = '#007A32';
  const BG         = '#03040c';
  const PANEL_BG   = '#080f1a';
  const PANEL_BOR  = '#0d2a1a';
  const HOLD_COL   = '#FFB300';
  const AVOID_COL  = '#F44336';
  const BUY_COL    = '#00C853';

  /* ─── COMPANY DATABASE ──────────────────────────────────────── */
  // Each company has 4 metrics and a correct rating
  // revenue: +high/+mid/flat/negative  earnings: strong/ok/weak
  // debt: low/mid/high   growth: fast/steady/slow/shrinking
  // correct: 'buy' | 'hold' | 'avoid'
  const COMPANIES_L1 = [
    {
      name: 'NOVA CORP', ticker: 'NVC', sector: 'Technology', quarter: 'Q2',
      revenue: '+18%', revenueDir: 1,
      earnings: 'Strong', earningsDir: 1,
      debt: 'Low', debtDir: 1,
      growth: 'Fast', growthDir: 1,
      correct: 'buy',
      hint: 'Revenue rising, strong earnings, low debt, fast growth — textbook Strong Buy.',
    },
    {
      name: 'STELLAR GOODS', ticker: 'SGL', sector: 'Retail', quarter: 'Q2',
      revenue: '+3%', revenueDir: 0,
      earnings: 'OK', earningsDir: 0,
      debt: 'Mid', debtDir: 0,
      growth: 'Steady', growthDir: 0,
      correct: 'hold',
      hint: 'Modest revenue and steady growth with average metrics — a Hold, not a buy yet.',
    },
    {
      name: 'REDROCK IND', ticker: 'RRI', sector: 'Energy', quarter: 'Q2',
      revenue: '-9%', revenueDir: -1,
      earnings: 'Weak', earningsDir: -1,
      debt: 'High', debtDir: -1,
      growth: 'Shrinking', growthDir: -1,
      correct: 'avoid',
      hint: 'Declining revenue, weak earnings, high debt — Avoid until the picture changes.',
    },
    {
      name: 'AXIOM HEALTH', ticker: 'AXH', sector: 'Healthcare', quarter: 'Q2',
      revenue: '+12%', revenueDir: 1,
      earnings: 'Strong', earningsDir: 1,
      debt: 'Mid', debtDir: 0,
      growth: 'Fast', growthDir: 1,
      correct: 'buy',
      hint: 'Strong revenue growth and earnings with manageable debt — Strong Buy.',
    },
  ];

  const COMPANIES_L2 = [
    {
      name: 'NOVA CORP', ticker: 'NVC', sector: 'Technology', quarter: 'Q3',
      revenue: '+22%', revenueDir: 1,
      earnings: 'Strong', earningsDir: 1,
      debt: 'Low', debtDir: 1,
      growth: 'Fast', growthDir: 1,
      correct: 'buy',
      news: 'CEO unveils 5-year expansion plan 📈',
      analyst: 'Goldman: Upgrade to BUY target $145',
      hint: 'Revenue accelerating, earnings beat, debt low — confirmed Strong Buy.',
    },
    {
      name: 'STELLAR GOODS', ticker: 'SGL', sector: 'Retail', quarter: 'Q3',
      revenue: '+4%', revenueDir: 0,
      earnings: 'OK', earningsDir: 0,
      debt: 'Mid', debtDir: 0,
      growth: 'Steady', growthDir: 0,
      news: 'New store openings on track 🏪',
      analyst: 'Morgan: Neutral — no catalyst yet',
      correct: 'hold',
      hint: 'No change in fundamentals — the neutral analyst view is consistent. Hold.',
    },
    {
      name: 'REDROCK IND', ticker: 'RRI', sector: 'Energy', quarter: 'Q3',
      revenue: '-14%', revenueDir: -1,
      earnings: 'Weak', earningsDir: -1,
      debt: 'High', debtDir: -1,
      growth: 'Shrinking', growthDir: -1,
      news: 'Regulatory fine issued ⚠️',
      analyst: 'JPM: Underweight — avoid sector',
      correct: 'avoid',
      hint: 'Every metric is worsening and analyst consensus is negative — Avoid.',
    },
    {
      name: 'AXIOM HEALTH', ticker: 'AXH', sector: 'Healthcare', quarter: 'Q3',
      revenue: '+15%', revenueDir: 1,
      earnings: 'Strong', earningsDir: 1,
      debt: 'Mid', debtDir: 0,
      growth: 'Fast', growthDir: 1,
      news: 'FDA approval for new product line 💊',
      analyst: 'Citi: Buy, raising estimates',
      correct: 'buy',
      hint: 'Catalysts are real — FDA approval + strong earnings + analyst upgrades = Buy.',
    },
    {
      name: 'CRYSTO DATA', ticker: 'CRD', sector: 'Cloud', quarter: 'Q3',
      revenue: '+31%', revenueDir: 1,
      earnings: 'Strong', earningsDir: 1,
      debt: 'Low', debtDir: 1,
      growth: 'Fast', growthDir: 1,
      news: 'Cloud contract with government 🏛️',
      analyst: 'BofA: Strong Buy — explosive growth',
      correct: 'buy',
      hint: 'Explosive revenue, strong earnings, low debt — ignore the hype, data confirms Buy.',
    },
    {
      name: 'MORROW MEDIA', ticker: 'MMD', sector: 'Media', quarter: 'Q3',
      revenue: '-6%', revenueDir: -1,
      earnings: 'Weak', earningsDir: -1,
      debt: 'High', debtDir: -1,
      growth: 'Slow', growthDir: -1,
      news: 'Subscriber numbers disappointing 📉',
      analyst: 'Wells: Sell — fundamentals deteriorating',
      correct: 'avoid',
      hint: 'Despite positive press elsewhere, fundamentals are weak across all four metrics.',
    },
    {
      name: 'ORBIT ENERGY', ticker: 'ORB', sector: 'Green Energy', quarter: 'Q3',
      revenue: '+7%', revenueDir: 0,
      earnings: 'OK', earningsDir: 0,
      debt: 'Mid', debtDir: 0,
      growth: 'Steady', growthDir: 0,
      news: 'Renewable subsidy extended ♻️',
      analyst: 'Deutsche: Hold — wait for next quarter',
      correct: 'hold',
      hint: 'Subsidies are encouraging but fundamentals are middling — Hold and watch.',
    },
  ];

  // Level 3 — Pro: 10 companies, disjoint from L1/L2. Hype/panic in the
  // news+analyst columns deliberately CONTRADICTS the correct fundamentals
  // rating on several cards — the whole point is to teach kids to trust
  // Revenue/Earnings/Debt/Growth over headlines and hot takes.
  const COMPANIES_L3 = [
    {
      name: 'QUANTA ROBOTICS', ticker: 'QTR', sector: 'Robotics', quarter: 'Q4',
      revenue: '+27%', revenueDir: 1,
      earnings: 'Strong', earningsDir: 1,
      debt: 'Low', debtDir: 1,
      growth: 'Fast', growthDir: 1,
      news: 'Viral video shows robot dropping a tray 🤖',
      analyst: 'Random blogger: "This stock is doomed"',
      correct: 'buy',
      hint: 'One clumsy robot video means nothing — revenue, earnings, and debt all say Strong Buy. Ignore the noise.',
    },
    {
      name: 'HARBOR FREIGHT LINES', ticker: 'HFL', sector: 'Logistics', quarter: 'Q4',
      revenue: '+2%', revenueDir: 0,
      earnings: 'OK', earningsDir: 0,
      debt: 'Mid', debtDir: 0,
      growth: 'Steady', growthDir: 0,
      news: 'CEO spotted buying a yacht 🛥️',
      analyst: 'Talk show host: "To the moon!"',
      correct: 'hold',
      hint: 'A yacht purchase is not a metric. Fundamentals are flat and steady — this is a Hold, hype or not.',
    },
    {
      name: 'VELOCITY MOTORS', ticker: 'VLM', sector: 'Automotive', quarter: 'Q4',
      revenue: '-17%', revenueDir: -1,
      earnings: 'Weak', earningsDir: -1,
      debt: 'High', debtDir: -1,
      growth: 'Shrinking', growthDir: -1,
      news: 'Flashy new concept car unveiled 🏎️',
      analyst: 'Influencer: "Best car ever, buy now!"',
      correct: 'avoid',
      hint: 'A cool concept car does not fix falling revenue, weak earnings, and high debt — Avoid.',
    },
    {
      name: 'BRIGHTLEAF FOODS', ticker: 'BLF', sector: 'Consumer Staples', quarter: 'Q4',
      revenue: '+9%', revenueDir: 1,
      earnings: 'Strong', earningsDir: 1,
      debt: 'Low', debtDir: 1,
      growth: 'Fast', growthDir: 1,
      news: 'Minor recall of one snack flavor 🍪',
      analyst: 'Financial paper: Buy — fundamentals excellent',
      correct: 'buy',
      hint: 'A single flavor recall is a footnote; every core metric is strong — Strong Buy.',
    },
    {
      name: 'SUMMIT MINERALS', ticker: 'SMT', sector: 'Mining', quarter: 'Q4',
      revenue: '-11%', revenueDir: -1,
      earnings: 'Weak', earningsDir: -1,
      debt: 'High', debtDir: -1,
      growth: 'Shrinking', growthDir: -1,
      news: 'Rare metal discovery announced 💎',
      analyst: 'Forum post: "Life-changing gains incoming!"',
      correct: 'avoid',
      hint: 'A discovery is a rumor until it shows up in revenue. Right now every metric says Avoid.',
    },
    {
      name: 'PIXELWAVE STUDIOS', ticker: 'PXW', sector: 'Gaming', quarter: 'Q4',
      revenue: '+34%', revenueDir: 1,
      earnings: 'Strong', earningsDir: 1,
      debt: 'Low', debtDir: 1,
      growth: 'Fast', growthDir: 1,
      news: 'Game delayed by two weeks 🎮',
      analyst: 'Reddit thread: "Sell everything now"',
      correct: 'buy',
      hint: 'A two-week delay is routine. Explosive revenue, strong earnings, low debt — Strong Buy.',
    },
    {
      name: 'CASCADE UTILITIES', ticker: 'CAS', sector: 'Utilities', quarter: 'Q4',
      revenue: '+3%', revenueDir: 0,
      earnings: 'OK', earningsDir: 0,
      debt: 'Mid', debtDir: 0,
      growth: 'Steady', growthDir: 0,
      news: 'Local news praises reliability 📰',
      analyst: 'Newsletter: "The next big breakout!"',
      correct: 'hold',
      hint: 'Nice press, but the numbers are just average — a steady Hold, not a "breakout."',
    },
    {
      name: 'IRONVAULT SECURITY', ticker: 'IVS', sector: 'Cybersecurity', quarter: 'Q4',
      revenue: '+21%', revenueDir: 1,
      earnings: 'Strong', earningsDir: 1,
      debt: 'Mid', debtDir: 0,
      growth: 'Fast', growthDir: 1,
      news: 'Minor data outage lasted 20 minutes ⚠️',
      analyst: 'Podcast host: "I would avoid this one"',
      correct: 'buy',
      hint: 'A 20-minute outage is small; strong revenue, earnings, and growth outweigh one bad headline — Buy.',
    },
    {
      name: 'DUNEWORTH REALTY', ticker: 'DWR', sector: 'Real Estate', quarter: 'Q4',
      revenue: '-8%', revenueDir: -1,
      earnings: 'Weak', earningsDir: -1,
      debt: 'High', debtDir: -1,
      growth: 'Slow', growthDir: -1,
      news: 'Celebrity buys penthouse in their building 🏙️',
      analyst: 'Social post: "This stock is unstoppable"',
      correct: 'avoid',
      hint: 'One celebrity sale does not offset falling revenue and high debt across the whole company — Avoid.',
    },
    {
      name: 'AZURE BIOSCIENCE', ticker: 'AZB', sector: 'Biotech', quarter: 'Q4',
      revenue: '+16%', revenueDir: 1,
      earnings: 'Strong', earningsDir: 1,
      debt: 'Low', debtDir: 1,
      growth: 'Fast', growthDir: 1,
      news: 'Lab trial results still pending 🧪',
      analyst: 'Late-night TV joke about the stock 📺',
      correct: 'buy',
      hint: 'Pending trials are neutral, not bad — current revenue, earnings, and debt already justify a Buy.',
    },
  ];

  /* ─── GAME STATE ─────────────────────────────────────────────── */
  let G = null;

  // Central per-level lookup — every level-scaling value lives here so
  // adding/tuning a level never requires touching gameplay logic again.
  const LEVEL_META = {
    1: { companies: COMPANIES_L1, timeLimit: 60, hasNews: false },
    2: { companies: COMPANIES_L2, timeLimit: 75, hasNews: true },
    3: { companies: COMPANIES_L3, timeLimit: 90, hasNews: true },
  };

  function newState(level) {
    const meta = LEVEL_META[level] || LEVEL_META[1];
    const companies = shuffle([...meta.companies]);
    return {
      level,
      phase: 'play',          // play | end
      companies,
      current: 0,             // index into companies[]
      score: 0,
      correct: 0,
      total: companies.length,
      timeLeft: meta.timeLimit,
      answers: [],             // {company, rating, isCorrect}
      timerId: null,
      feedback: null,          // {text, ok, t}
      startTime: Date.now(),
      streak: 0,               // consecutive correct ratings — VISUAL ONLY, does not affect scoring
      maxStreak: 0,            // best streak this run, shown on end screen
    };
  }

  /* ─── UTILITIES ─────────────────────────────────────────────── */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function q(sel) { return document.querySelector(sel); }

  function scoreToStars(correct, total) {
    const pct = correct / total;
    if (pct >= 0.85) return 3;
    if (pct >= 0.60) return 2;
    return 1;
  }

  /* ─── SCREEN REGISTRATION ────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};

  window.SCREENS.game_inv_research = function () {
    G = null;
    setTimeout(initGame, 40);
    return `
<div id="rc_root" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:'Inter',sans-serif;color:#fff;display:flex;flex-direction:column;">

  <!-- TOP BAR -->
  <div id="rc_topbar" style="display:flex;align-items:center;gap:10px;padding:10px 14px 8px;background:#060d16;border-bottom:1px solid ${PANEL_BOR};flex-shrink:0;">
    <button id="rc_back" onclick="window.inv_researchExit()" style="background:none;border:1px solid #1a3a2a;color:${ACCENT};font-size:18px;padding:4px 10px;border-radius:6px;cursor:pointer;font-family:inherit;">←</button>
    <div style="flex:1;min-width:0;">
      <div style="font-family:'Orbitron','Inter',sans-serif;font-size:11px;color:${ACCENT};letter-spacing:2px;text-transform:uppercase;">Investopia Hub</div>
      <div style="font-family:'Orbitron','Inter',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Research Core</div>
    </div>
    <div style="text-align:right;flex-shrink:0;">
      <div style="font-family:'Orbitron','Inter',sans-serif;font-size:18px;font-weight:700;color:${ACCENT}" id="rc_score">0</div>
      <div style="font-size:10px;color:#4a7a5a;letter-spacing:1px;">SCORE</div>
    </div>
    <div id="rc_timer_wrap" style="width:48px;height:48px;flex-shrink:0;">
      <svg viewBox="0 0 48 48" width="48" height="48">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#0d2a1a" stroke-width="4"/>
        <circle id="rc_timer_ring" cx="24" cy="24" r="20" fill="none" stroke="${ACCENT}" stroke-width="4"
          stroke-dasharray="125.66" stroke-dashoffset="0" stroke-linecap="round"
          transform="rotate(-90 24 24)" style="transition:stroke-dashoffset 0.9s linear,stroke 0.3s"/>
        <text id="rc_timer_txt" x="24" y="29" text-anchor="middle" fill="#fff"
          font-family="Orbitron,Inter,sans-serif" font-size="12" font-weight="700">60</text>
      </svg>
    </div>
  </div>

  <!-- PROGRESS BAR -->
  <div style="background:#060d16;padding:6px 14px;flex-shrink:0;border-bottom:1px solid ${PANEL_BOR};">
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="font-size:10px;color:#4a7a5a;letter-spacing:1px;white-space:nowrap;" id="rc_progress_label">Company 1 of 4</div>
      <div style="flex:1;background:#0d1a12;border-radius:3px;height:5px;overflow:hidden;">
        <div id="rc_progress_bar" style="height:100%;width:0%;background:${ACCENT};border-radius:3px;transition:width 0.4s;"></div>
      </div>
      <div style="font-size:10px;color:#4a7a5a;white-space:nowrap;" id="rc_correct_count">0 correct</div>
    </div>
  </div>

  <!-- MAIN CONTENT -->
  <div id="rc_main" style="flex:1;overflow-y:auto;overflow-x:hidden;padding:14px 12px 80px;display:flex;flex-direction:column;gap:12px;">
    <!-- injected by renderCard() -->
  </div>

  <!-- FEEDBACK TOAST -->
  <div id="rc_toast" style="position:absolute;bottom:80px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;pointer-events:none;opacity:0;transition:opacity 0.25s;white-space:nowrap;"></div>

  <!-- LEVEL SELECT OVERLAY (shown at start) -->
  <div id="rc_level_sel" style="position:absolute;inset:0;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:24px;z-index:100;">
    <div style="font-family:'Orbitron','Inter',sans-serif;font-size:22px;font-weight:700;color:${ACCENT};text-align:center;">Research Core</div>
    <div style="font-size:13px;color:#8ab898;text-align:center;max-width:280px;line-height:1.6;">Analyze company metrics and rate each business: Strong Buy, Hold, or Avoid — before time runs out.</div>

    <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:300px;">
      <button onclick="window._rcStartLevel(1)" style="background:${PANEL_BG};border:1.5px solid ${ACCENT};border-radius:10px;padding:18px 16px;cursor:pointer;text-align:left;color:#fff;font-family:inherit;">
        <div style="font-family:'Orbitron','Inter',sans-serif;font-size:13px;color:${ACCENT};font-weight:700;">LEVEL 1 — LEARN</div>
        <div style="font-size:12px;color:#8ab898;margin-top:4px;">4 companies · 60 seconds · Clear metrics</div>
      </button>
      <button onclick="window._rcStartLevel(2)" style="background:${PANEL_BG};border:1.5px solid ${HOLD_COL};border-radius:10px;padding:18px 16px;cursor:pointer;text-align:left;color:#fff;font-family:inherit;">
        <div style="font-family:'Orbitron','Inter',sans-serif;font-size:13px;color:${HOLD_COL};font-weight:700;">LEVEL 2 — MASTER</div>
        <div style="font-size:12px;color:#8ab898;margin-top:4px;">7 companies · 75 seconds · News + analyst noise</div>
      </button>
      <button onclick="window._rcStartLevel(3)" style="background:${PANEL_BG};border:1.5px solid ${AVOID_COL};border-radius:10px;padding:18px 16px;cursor:pointer;text-align:left;color:#fff;font-family:inherit;">
        <div style="font-family:'Orbitron','Inter',sans-serif;font-size:13px;color:${AVOID_COL};font-weight:700;">LEVEL 3 — PRO</div>
        <div style="font-size:12px;color:#8ab898;margin-top:4px;">10 companies · 90 seconds · Hype &amp; panic headlines that lie</div>
      </button>
    </div>

    <div style="font-size:11px;color:#3a6a4a;text-align:center;margin-top:6px;">Read Revenue · Earnings · Debt · Growth</div>
  </div>

</div>`;
  };

  /* ─── INIT ───────────────────────────────────────────────────── */
  function initGame() {
    // expose level starter
    window._rcStartLevel = function (lvl) {
      const overlay = q('#rc_level_sel');
      if (overlay) overlay.style.display = 'none';
      G = newState(lvl);
      updateTopBar();
      renderCard();
      startTimer();
    };

    // DEBUG HOOK — module state is closure-private, expose read + force-win
    // for QA. Not referenced by gameplay logic.
    window._rcDbg = function () {
      return G ? {
        level: G.level, current: G.current, total: G.total,
        score: G.score, correct: G.correct, timeLeft: G.timeLeft,
        phase: G.phase, hasNews: !!(LEVEL_META[G.level] || LEVEL_META[1]).hasNews,
        companies: G.companies.map(c => ({ name: c.name, correct: c.correct, hasNewsText: !!(c.news && c.analyst) })),
      } : null;
    };
    // Rates every remaining card with its correct answer, one at a time,
    // respecting the game's real async advance (setTimeout inside _rcRate).
    // Calls `done(finalDbgSnapshot)` once G.current reaches G.total or G is
    // reset (end screen shown). Mirrors real correct-tap play, just automated.
    window._rcForceWin = function (done) {
      function step() {
        if (!G || G.phase !== 'play') { if (done) done(window._rcDbg()); return; }
        if (G.current >= G.total) { if (done) done(window._rcDbg()); return; }
        const co = G.companies[G.current];
        window._rcRate(co.correct);
        setTimeout(step, 650); // > 600ms correct-answer advance delay in _rcRate
      }
      step();
    };
  }

  /* ─── TIMER ──────────────────────────────────────────────────── */
  function startTimer() {
    if (!G) return;
    if (G.timerId) clearInterval(G.timerId);
    G.timerId = setInterval(function () {
      if (!G || G.phase !== 'play') { clearInterval(G.timerId); return; }
      G.timeLeft--;
      updateTimerUI();
      if (G.timeLeft <= 0) {
        clearInterval(G.timerId);
        endGame();
      }
    }, 1000);
  }

  function updateTimerUI() {
    if (!G) return;
    const txt = q('#rc_timer_txt');
    const ring = q('#rc_timer_ring');
    if (!txt || !ring) return;

    const maxTime = (LEVEL_META[G.level] || LEVEL_META[1]).timeLimit;
    const pct = G.timeLeft / maxTime;
    const circumference = 125.66;
    const offset = circumference * (1 - pct);

    txt.textContent = G.timeLeft;
    ring.setAttribute('stroke-dashoffset', offset.toFixed(1));

    const col = pct > 0.5 ? ACCENT : pct > 0.25 ? HOLD_COL : AVOID_COL;
    ring.setAttribute('stroke', col);
    if (G.timeLeft <= 10) txt.setAttribute('fill', AVOID_COL);
    else txt.setAttribute('fill', '#fff');
  }

  /* ─── TOP BAR ────────────────────────────────────────────────── */
  function updateTopBar() {
    if (!G) return;
    const sc = q('#rc_score');
    if (sc) sc.textContent = G.score;

    const pb = q('#rc_progress_bar');
    const pl = q('#rc_progress_label');
    const cc = q('#rc_correct_count');

    const total = G.total;
    const current = G.current;
    const pct = (current / total) * 100;

    if (pb) pb.style.width = pct + '%';
    if (pl) pl.textContent = 'Company ' + (Math.min(current + 1, total)) + ' of ' + total;
    if (cc) cc.textContent = G.correct + ' correct';
  }

  /* ─── CARD RENDERER ──────────────────────────────────────────── */
  function metricColor(dir) {
    if (dir > 0) return BUY_COL;
    if (dir < 0) return AVOID_COL;
    return HOLD_COL;
  }

  function metricArrow(dir) {
    if (dir > 0) return '▲';
    if (dir < 0) return '▼';
    return '─';
  }

  function debtColor(dir) {
    // For debt: low debt = good (green), high debt = bad (red)
    if (dir > 0) return BUY_COL;    // dir 1 = low = good
    if (dir < 0) return AVOID_COL;  // dir -1 = high = bad
    return HOLD_COL;
  }

  function renderCard() {
    const main = q('#rc_main');
    if (!main || !G) return;

    if (G.current >= G.total) {
      main.innerHTML = '';
      endGame();
      return;
    }

    const co = G.companies[G.current];
    const hasNews = !!(LEVEL_META[G.level] || LEVEL_META[1]).hasNews;

    const metrics = [
      { label: 'Revenue', value: co.revenue, color: metricColor(co.revenueDir), arrow: metricArrow(co.revenueDir) },
      { label: 'Earnings', value: co.earnings, color: metricColor(co.earningsDir), arrow: metricArrow(co.earningsDir) },
      { label: 'Debt', value: co.debt, color: debtColor(co.debtDir), arrow: '' },
      { label: 'Growth', value: co.growth, color: metricColor(co.growthDir), arrow: '' },
    ];

    const metricsHTML = metrics.map(m => `
      <div style="background:#060d16;border:1px solid #0d2a1a;border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:3px;">
        <div style="font-size:10px;color:#4a7a5a;letter-spacing:1.5px;text-transform:uppercase;">${m.label}</div>
        <div style="font-size:16px;font-weight:700;color:${m.color};font-family:'Orbitron','Inter',sans-serif;">${m.arrow ? m.arrow + ' ' : ''}${m.value}</div>
      </div>
    `).join('');

    const newsBlock = hasNews ? `
      <div style="background:#030f08;border:1px solid #0d2a1a;border-radius:8px;padding:10px 12px;margin-top:2px;">
        <div style="font-size:10px;color:${ACCENT};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Market News</div>
        <div style="font-size:12px;color:#c8e8d4;line-height:1.5;">${co.news || '—'}</div>
      </div>
      <div style="background:#030a12;border:1px solid #0d1f2a;border-radius:8px;padding:10px 12px;">
        <div style="font-size:10px;color:#4a8aaa;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Analyst Opinion</div>
        <div style="font-size:12px;color:#a8cce0;line-height:1.5;">${co.analyst || '—'}</div>
      </div>
    ` : '';

    main.innerHTML = `
      <!-- HOLOGRAPHIC REPORT CARD -->
      <div id="rc_card" style="background:${PANEL_BG};border:1.5px solid ${PANEL_BOR};border-radius:12px;overflow:hidden;box-shadow:0 0 20px #00C85318;transition:transform 0.18s ease-out;transform:scale(1);">
        <!-- Card header -->
        <div style="background:linear-gradient(135deg,#060e18,#0a1a0e);padding:14px 16px;border-bottom:1px solid ${PANEL_BOR};display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-family:'Orbitron','Inter',sans-serif;font-size:16px;font-weight:700;letter-spacing:1px;">${co.name}</div>
            <div style="font-size:11px;color:#4a7a5a;margin-top:2px;">${co.ticker} · ${co.sector} · ${co.quarter}</div>
          </div>
          <div style="background:#060d16;border:1px solid ${PANEL_BOR};border-radius:6px;padding:6px 10px;text-align:center;">
            <div style="font-size:9px;color:#4a7a5a;letter-spacing:1px;">REPORT</div>
            <div style="font-family:'Orbitron','Inter',sans-serif;font-size:11px;color:${ACCENT};">LIVE</div>
          </div>
        </div>

        <!-- Metrics grid -->
        <div style="padding:14px 14px 10px;">
          <div style="font-size:10px;color:#4a7a5a;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Key Metrics</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${metricsHTML}
          </div>
        </div>

        ${hasNews ? `<div style="padding:0 14px 10px;display:flex;flex-direction:column;gap:8px;">${newsBlock}</div>` : ''}
      </div>

      <!-- RATING PROMPT -->
      <div style="text-align:center;margin:4px 0 2px;">
        <div style="font-size:12px;color:#4a7a5a;letter-spacing:1px;">RATE THIS COMPANY</div>
      </div>

      <!-- RATING BUTTONS -->
      <div style="display:flex;gap:8px;">
        <button id="rc_btn_buy" onclick="window._rcRate('buy')"
          style="flex:1;background:#03120a;border:2px solid ${BUY_COL};border-radius:10px;padding:16px 6px;cursor:pointer;color:${BUY_COL};font-family:'Orbitron','Inter',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;display:flex;flex-direction:column;align-items:center;gap:4px;transition:background 0.15s;">
          <span style="font-size:22px;">📈</span>
          STRONG BUY
        </button>
        <button id="rc_btn_hold" onclick="window._rcRate('hold')"
          style="flex:1;background:#120e03;border:2px solid ${HOLD_COL};border-radius:10px;padding:16px 6px;cursor:pointer;color:${HOLD_COL};font-family:'Orbitron','Inter',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;display:flex;flex-direction:column;align-items:center;gap:4px;transition:background 0.15s;">
          <span style="font-size:22px;">⏸️</span>
          HOLD
        </button>
        <button id="rc_btn_avoid" onclick="window._rcRate('avoid')"
          style="flex:1;background:#120303;border:2px solid ${AVOID_COL};border-radius:10px;padding:16px 6px;cursor:pointer;color:${AVOID_COL};font-family:'Orbitron','Inter',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;display:flex;flex-direction:column;align-items:center;gap:4px;transition:background 0.15s;">
          <span style="font-size:22px;">🚫</span>
          AVOID
        </button>
      </div>

      <!-- HINT: show reading instruction on first card -->
      ${G.current === 0 ? `
      <div style="background:#030c06;border:1px solid #0d2a1a;border-radius:8px;padding:10px 14px;font-size:11px;color:#4a7a5a;line-height:1.6;text-align:center;">
        💡 Read all four metrics before deciding. Revenue + Earnings = profit picture. Debt + Growth = future outlook.
      </div>` : ''}
    `;

    // Add hover effects via JS (no CSS classes available)
    ['buy', 'hold', 'avoid'].forEach(r => {
      const btn = q('#rc_btn_' + r);
      if (!btn) return;
      const colMap = { buy: BUY_COL, hold: HOLD_COL, avoid: AVOID_COL };
      const bgMap = { buy: '#052010', hold: '#201500', avoid: '#200505' };
      btn.addEventListener('mouseenter', function () { btn.style.background = bgMap[r]; });
      btn.addEventListener('mouseleave', function () { btn.style.background = r === 'buy' ? '#03120a' : r === 'hold' ? '#120e03' : '#120303'; });
    });

    updateTopBar();
  }

  /* ─── RATE HANDLER ───────────────────────────────────────────── */
  // Streak thresholds are purely cosmetic milestones for the celebration
  // banner/burst below — they do NOT feed into the score formula.
  const STREAK_MILESTONES = [3, 5];

  window._rcRate = function (rating) {
    if (!G || G.phase !== 'play') return;
    const co = G.companies[G.current];
    const isCorrect = rating === co.correct;

    // Points: base per company (UNCHANGED — streak adds zero points, visual only)
    const timeBonus = Math.floor(G.timeLeft / 10);
    const pts = isCorrect ? (20 + timeBonus) : 0;

    G.score += pts;
    if (isCorrect) {
      G.correct++;
      G.streak++;
      if (G.streak > G.maxStreak) G.maxStreak = G.streak;
    } else {
      G.streak = 0;
    }

    G.answers.push({ company: co.name, rating, isCorrect });

    // Flash feedback
    showToast(
      isCorrect
        ? '✓ Nailed it! +' + pts + ' pts'
        : 'OOPS — the real call was ' + ratingLabel(co.correct),
      isCorrect
    );

    // Highlight the tapped button briefly
    flashButton(rating, isCorrect);

    // Floating "+N" popup near the tapped button (correct only — cosmetic, no score change)
    if (isCorrect) spawnFloatingPoints(rating, pts);

    // Scale-pulse the whole report card so every rating feels impactful,
    // not just the button strip (fires on BOTH correct and incorrect).
    pulseCard(isCorrect);

    // Streak celebration burst at tuned milestones (3, 5+) — visual only.
    if (isCorrect && STREAK_MILESTONES.includes(G.streak)) {
      showStreakBanner(G.streak);
    }

    // Advance after a beat
    setTimeout(function () {
      if (!G || G.phase !== 'play') return;
      G.current++;
      updateTopBar();
      if (G.current >= G.total) {
        endGame();
      } else {
        renderCard();
      }
    }, isCorrect ? 600 : 900);
  };

  function ratingLabel(r) {
    return r === 'buy' ? 'Strong Buy' : r === 'hold' ? 'Hold' : 'Avoid';
  }

  function flashButton(rating, correct) {
    const btn = q('#rc_btn_' + rating);
    if (!btn) return;
    const orig = btn.style.background;
    btn.style.background = correct ? '#005020' : '#2a0505';
    setTimeout(function () { if (btn) btn.style.background = orig; }, 400);
  }

  function showToast(text, ok) {
    const t = q('#rc_toast');
    if (!t) return;
    t.textContent = text;
    t.style.background = ok ? '#012a0f' : '#1a0505';
    t.style.border = '1px solid ' + (ok ? BUY_COL : AVOID_COL);
    t.style.color = ok ? BUY_COL : AVOID_COL;
    t.style.opacity = '1';
    clearTimeout(t._tid);
    t._tid = setTimeout(function () { t.style.opacity = '0'; }, 1500);
  }

  /* ─── JUICE: floating "+N" popup ─────────────────────────────── */
  // Lightweight, self-contained: one absolutely-positioned div, a CSS
  // transition on transform/opacity, removed via setTimeout. Same
  // lightweight-DOM-effect style already used by showToast()/flashButton().
  function spawnFloatingPoints(rating, pts) {
    const btn = q('#rc_btn_' + rating);
    const root = q('#rc_root');
    if (!btn || !root) return;
    const bRect = btn.getBoundingClientRect();
    const rRect = root.getBoundingClientRect();

    const el = document.createElement('div');
    el.textContent = '+' + pts;
    el.style.cssText = 'position:absolute;left:' + (bRect.left - rRect.left + bRect.width / 2) + 'px;'
      + 'top:' + (bRect.top - rRect.top) + 'px;'
      + 'transform:translate(-50%,0) scale(0.8);opacity:0;'
      + 'color:' + BUY_COL + ';font-family:"Orbitron","Inter",sans-serif;font-size:16px;font-weight:700;'
      + 'pointer-events:none;z-index:150;transition:transform 0.7s ease-out,opacity 0.7s ease-out;';
    root.appendChild(el);

    // Kick the transition on the next frame so the initial state paints first.
    requestAnimationFrame(function () {
      el.style.transform = 'translate(-50%,-38px) scale(1.1)';
      el.style.opacity = '1';
      setTimeout(function () { el.style.opacity = '0'; }, 380);
    });
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 750);
  }

  /* ─── JUICE: report-card scale-pulse ─────────────────────────── */
  // CSS-transition based (transform:scale), consistent with the file's
  // inline-style approach — fires on both correct and incorrect answers.
  function pulseCard(ok) {
    const card = q('#rc_card');
    if (!card) return;
    card.style.transform = ok ? 'scale(1.03)' : 'scale(0.98)';
    setTimeout(function () { if (card) card.style.transform = 'scale(1)'; }, 180);
  }

  /* ─── JUICE: streak celebration banner ───────────────────────── */
  // Purely visual milestone popup — does not touch G.score. Injects one
  // shared @keyframes block (guarded by id, same idiom used elsewhere in
  // the codebase for one-time style injection).
  function ensureStreakStyle() {
    if (q('#rc_streak_style')) return;
    const s = document.createElement('style');
    s.id = 'rc_streak_style';
    s.textContent = '@keyframes rcStreakPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.12)}35%{transform:translate(-50%,-50%) scale(1)}78%{opacity:1}100%{opacity:0;transform:translate(-50%,-62%) scale(1.05)}}';
    document.head.appendChild(s);
  }

  function showStreakBanner(streak) {
    const root = q('#rc_root');
    if (!root) return;
    ensureStreakStyle();

    const el = document.createElement('div');
    el.textContent = '🔥 ' + streak + ' STREAK!';
    el.style.cssText = 'position:absolute;left:50%;top:38%;'
      + 'color:' + HOLD_COL + ';font-family:"Orbitron","Inter",sans-serif;font-size:20px;font-weight:700;'
      + 'letter-spacing:1px;text-shadow:0 0 12px ' + HOLD_COL + '88;pointer-events:none;z-index:160;'
      + 'animation:rcStreakPop 1.1s ease-out forwards;white-space:nowrap;';
    root.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1150);
  }

  /* ─── END GAME ───────────────────────────────────────────────── */
  function endGame() {
    if (!G || G.phase === 'end') return;
    G.phase = 'end';
    if (G.timerId) clearInterval(G.timerId);

    const stars = scoreToStars(G.correct, G.total);
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_inv_research', { level: G.level, stars, badge: 'Research Analyst', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('inv_wealth', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    const starsHTML = ['⭐', '⭐⭐', '⭐⭐⭐'][stars - 1];
    const accuracy = G.total > 0 ? Math.round((G.correct / G.total) * 100) : 0;
    const timeBonus = G.timeLeft > 0;

    // Build answers review HTML
    const answersHTML = G.answers.map(a => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:${a.isCorrect ? '#020f06' : '#0f0303'};border-radius:6px;border:1px solid ${a.isCorrect ? '#0d2a1a' : '#2a0d0d'};">
        <span style="font-size:14px;">${a.isCorrect ? '✓' : '✗'}</span>
        <span style="font-size:12px;flex:1;color:#c8d8d0;">${a.company}</span>
        <span style="font-size:11px;font-weight:600;color:${a.isCorrect ? BUY_COL : AVOID_COL};">${ratingLabel(a.rating)}</span>
      </div>
    `).join('');

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;background:' + BG + 'f0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;overflow-y:auto;overflow-x:hidden;z-index:200;padding:24px 16px 40px;';

    overlay.innerHTML = `
      <!-- GLOW ORB -->
      <div style="width:90px;height:90px;border-radius:50%;background:radial-gradient(circle,${ACCENT}33 0%,transparent 70%);border:2px solid ${ACCENT}44;display:flex;align-items:center;justify-content:center;margin-bottom:12px;flex-shrink:0;">
        <div style="font-size:40px;">${stars === 3 ? '🔬' : stars === 2 ? '📊' : '📋'}</div>
      </div>

      <div style="font-family:'Orbitron','Inter',sans-serif;font-size:20px;font-weight:700;color:${ACCENT};text-align:center;margin-bottom:4px;">
        ${stars === 3 ? 'Perfect Analysis!' : stars === 2 ? 'Good Research!' : 'Keep Learning!'}
      </div>
      <div style="font-size:26px;margin:6px 0;">${starsHTML}</div>

      <!-- STATS -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;width:100%;max-width:320px;margin:10px 0;">
        <div style="background:${PANEL_BG};border:1px solid ${PANEL_BOR};border-radius:8px;padding:10px;text-align:center;">
          <div style="font-family:'Orbitron','Inter',sans-serif;font-size:18px;font-weight:700;color:${ACCENT};">${G.correct}/${G.total}</div>
          <div style="font-size:10px;color:#4a7a5a;margin-top:2px;">CORRECT</div>
        </div>
        <div style="background:${PANEL_BG};border:1px solid ${PANEL_BOR};border-radius:8px;padding:10px;text-align:center;">
          <div style="font-family:'Orbitron','Inter',sans-serif;font-size:18px;font-weight:700;color:${HOLD_COL};">${accuracy}%</div>
          <div style="font-size:10px;color:#4a7a5a;margin-top:2px;">ACCURACY</div>
        </div>
        <div style="background:${PANEL_BG};border:1px solid ${PANEL_BOR};border-radius:8px;padding:10px;text-align:center;">
          <div style="font-family:'Orbitron','Inter',sans-serif;font-size:18px;font-weight:700;color:${ACCENT};">+${coins}</div>
          <div style="font-size:10px;color:#4a7a5a;margin-top:2px;">COINS</div>
        </div>
      </div>

      <!-- BADGE -->
      ${stars === 3 ? `
      <div style="background:linear-gradient(135deg,#020d07,#041a0c);border:1.5px solid ${ACCENT};border-radius:10px;padding:10px 18px;margin-bottom:10px;text-align:center;">
        <div style="font-size:11px;color:${ACCENT};letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Badge Earned</div>
        <div style="font-size:14px;font-weight:700;color:#fff;">🏅 Research Analyst</div>
      </div>` : ''}

      <!-- ANSWERS REVIEW -->
      <div style="width:100%;max-width:320px;margin-bottom:14px;">
        <div style="font-size:10px;color:#4a7a5a;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Your Ratings</div>
        <div style="display:flex;flex-direction:column;gap:5px;">${answersHTML}</div>
      </div>

      <!-- LESSON -->
      <div style="background:#020d07;border:1.5px solid ${ACCENT}55;border-radius:10px;padding:14px 16px;width:100%;max-width:320px;margin-bottom:18px;">
        <div style="font-size:10px;color:${ACCENT};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Lesson Learned</div>
        <div style="font-size:13px;color:#c8e8d4;line-height:1.7;">Great investors research before they buy — reading revenue, earnings, debt and growth helps you find businesses worth owning for the long term.</div>
      </div>

      <!-- BUTTONS -->
      <div style="display:flex;gap:10px;width:100%;max-width:320px;">
        <button onclick="window._rcPlayAgain()" style="flex:1;background:${ACCENT};border:none;border-radius:10px;padding:14px;color:#000;font-family:'Orbitron','Inter',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;">PLAY AGAIN</button>
        <button onclick="window.inv_researchExit()" style="flex:1;background:${PANEL_BG};border:1.5px solid ${PANEL_BOR};border-radius:10px;padding:14px;color:#8ab898;font-family:'Orbitron','Inter',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;">← HUB</button>
      </div>
    `;

    const root = q('#rc_root');
    if (root) root.appendChild(overlay);
  }

  /* ─── PLAY AGAIN ─────────────────────────────────────────────── */
  window._rcPlayAgain = function () {
    const root = q('#rc_root');
    if (!root) return;
    // Remove end overlay
    const overlays = root.querySelectorAll('div[style*="z-index:200"]');
    overlays.forEach(function (o) { o.remove(); });

    // Re-show level select
    const lvlSel = q('#rc_level_sel');
    if (lvlSel) lvlSel.style.display = 'flex';

    // Reset main
    const main = q('#rc_main');
    if (main) main.innerHTML = '';

    G = null;
  };

  /* ─── EXIT ───────────────────────────────────────────────────── */
  window.inv_researchExit = function () {
    if (G && G.timerId) clearInterval(G.timerId);
    G = null;
    document.removeEventListener('keydown', rcKeyHandler);
    if (window.state) state.viewingWorld = 'investor';
    if (window.goTo) goTo('hub');
  };

  /* ─── KEYBOARD SHORTCUTS ─────────────────────────────────────── */
  function rcKeyHandler(e) {
    if (!G || G.phase !== 'play') return;
    if (e.key === '1' || e.key === 'b') window._rcRate && window._rcRate('buy');
    if (e.key === '2' || e.key === 'h') window._rcRate && window._rcRate('hold');
    if (e.key === '3' || e.key === 'a') window._rcRate && window._rcRate('avoid');
    if (e.key === 'Escape') window.inv_researchExit && window.inv_researchExit();
  }
  document.addEventListener('keydown', rcKeyHandler);

})();
