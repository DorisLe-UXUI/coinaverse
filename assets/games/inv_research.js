/* ════════════════════════════════════════════════════════════════
   RESEARCH CORE — Investopia Hub mini-game
   Mechanic: Spot & Match — Rate companies Strong Buy / Hold / Avoid
   Level 1 (Learn): 4 companies, clear metrics, 60s
   Level 2 (Master): 7 companies, news noise, analyst opinions, 75s
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

  /* ─── GAME STATE ─────────────────────────────────────────────── */
  let G = null;

  function newState(level) {
    const companies = level === 1 ? shuffle([...COMPANIES_L1]) : shuffle([...COMPANIES_L2]);
    return {
      level,
      phase: 'play',          // play | end
      companies,
      current: 0,             // index into companies[]
      score: 0,
      correct: 0,
      total: companies.length,
      timeLeft: level === 1 ? 60 : 75,
      answers: [],             // {company, rating, isCorrect}
      timerId: null,
      feedback: null,          // {text, ok, t}
      startTime: Date.now(),
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

    const maxTime = G.level === 1 ? 60 : 75;
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
    const isL2 = G.level === 2;

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

    const newsBlock = isL2 ? `
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
      <div style="background:${PANEL_BG};border:1.5px solid ${PANEL_BOR};border-radius:12px;overflow:hidden;box-shadow:0 0 20px #00C85318;">
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

        ${isL2 ? `<div style="padding:0 14px 10px;display:flex;flex-direction:column;gap:8px;">${newsBlock}</div>` : ''}
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
  window._rcRate = function (rating) {
    if (!G || G.phase !== 'play') return;
    const co = G.companies[G.current];
    const isCorrect = rating === co.correct;

    // Points: base per company
    const timeBonus = Math.floor(G.timeLeft / 10);
    const pts = isCorrect ? (20 + timeBonus) : 0;

    G.score += pts;
    if (isCorrect) G.correct++;

    G.answers.push({ company: co.name, rating, isCorrect });

    // Flash feedback
    showToast(
      isCorrect
        ? '✓ Correct! +' + pts + ' pts'
        : '✗ Wrong — correct: ' + ratingLabel(co.correct),
      isCorrect
    );

    // Highlight the tapped button briefly
    flashButton(rating, isCorrect);

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
