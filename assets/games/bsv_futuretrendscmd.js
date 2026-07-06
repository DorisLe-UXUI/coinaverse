/* ════════════════════════════════════════════════════════════════
   FUTURE TRENDS CMD — Bitstream Valley mini-game
   Technology forecasting prediction game. Analyze trend signals
   and predict which emerging technologies will shape the future.
   Teaches: trend analysis, signal vs. noise, innovation forecasting.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ACCENT     = '#00FFFF';
  const SCREEN_ID  = 'game_bsv_futuretrendscmd';
  const WORLD_ID   = 'builder';

  // ── Game constants ─────────────────────────────────────────────
  const ROUND_TIME_L1    = 90;   // seconds
  const ROUND_TIME_L2    = 75;
  const TARGET_CORRECT   = 6;    // correct forecasts needed to win
  const MAX_WRONG        = 3;    // allowed wrong investments before loss
  const STREAK_BONUS     = 25;   // extra coins per streak milestone
  const BASE_POINTS      = 100;
  const STAR3_SCORE      = 700;
  const STAR2_SCORE      = 400;

  // ── Tech card pool ─────────────────────────────────────────────
  // outcome: 'invest' = this tech will succeed (correct = Invest)
  //          'pass'   = this tech is a fad    (correct = Pass)
  const TECH_POOL_L1 = [
    {
      id: 't1', name: 'Generative AI', icon: '🧠',
      tagline: 'Machines that create text, images, and code.',
      outcome: 'invest',
      signals: {
        adoption: 'rapid',      // 'rapid','steady','slow','falling'
        sentiment: 'positive',  // 'positive','mixed','negative'
        hype: 'low',            // 'low','medium','high'
        confidence: 95,
        experts: 'Consensus: transformative across every industry.',
        utility: 'Replaces repetitive knowledge work at scale.',
        funding: '$50B+ invested by leading tech firms.',
        hint: 'All signals point up — real, sustained adoption.'
      }
    },
    {
      id: 't2', name: 'CryptoGame Coins', icon: '🎮',
      tagline: 'Play-to-earn tokens replace real gaming value.',
      outcome: 'pass',
      signals: {
        adoption: 'falling',
        sentiment: 'negative',
        hype: 'high',
        confidence: 20,
        experts: 'Economists: circular token economies collapse without real demand.',
        utility: 'Token value depends entirely on new player inflow.',
        funding: 'Most projects abandoned after initial hype.',
        hint: 'High hype + falling adoption = classic fad cycle.'
      }
    },
    {
      id: 't3', name: 'Solar Energy', icon: '☀️',
      tagline: 'Photovoltaic cells convert sunlight to clean electricity.',
      outcome: 'invest',
      signals: {
        adoption: 'rapid',
        sentiment: 'positive',
        hype: 'low',
        confidence: 92,
        experts: 'IEA: largest source of new electricity by 2027.',
        utility: 'Cost per watt fell 90% over a decade.',
        funding: '$400B/yr global investment, growing.',
        hint: 'Decades of steady adoption + falling costs = durable trend.'
      }
    },
    {
      id: 't4', name: 'NFT Art Speculation', icon: '🖼️',
      tagline: 'Digital jpegs sell for millions on blockchain.',
      outcome: 'pass',
      signals: {
        adoption: 'falling',
        sentiment: 'negative',
        hype: 'high',
        confidence: 15,
        experts: 'Analysts: 95% of NFT collections lost all value by 2023.',
        utility: 'No inherent utility beyond social signaling.',
        funding: 'Trading volume dropped 97% from peak.',
        hint: 'Crashed hard — speculative bubble, not real technology.'
      }
    },
    {
      id: 't5', name: 'Cloud Computing', icon: '☁️',
      tagline: 'Rent compute power and storage over the internet.',
      outcome: 'invest',
      signals: {
        adoption: 'rapid',
        sentiment: 'positive',
        hype: 'low',
        confidence: 99,
        experts: 'Gartner: cloud is foundational infrastructure for every business.',
        utility: 'Enables startups to scale without hardware.',
        funding: 'AWS, Azure, GCP combine $500B+ annual revenue.',
        hint: 'Already proven — steady growth, not hype.'
      }
    },
    {
      id: 't6', name: 'Hoverboard Commuting', icon: '🛹',
      tagline: 'Self-balancing boards replace cars in cities.',
      outcome: 'pass',
      signals: {
        adoption: 'falling',
        sentiment: 'negative',
        hype: 'high',
        confidence: 8,
        experts: 'Urban planners: impractical for weather, distance, safety.',
        utility: 'Limited range, no cargo, dangerous on roads.',
        funding: 'Major manufacturers exited market.',
        hint: 'Media buzz didn\'t match real-world utility — pure hype.'
      }
    },
    {
      id: 't7', name: 'Robotics Automation', icon: '🤖',
      tagline: 'Robots perform physical manufacturing and delivery tasks.',
      outcome: 'invest',
      signals: {
        adoption: 'steady',
        sentiment: 'positive',
        hype: 'medium',
        confidence: 85,
        experts: 'McKinsey: 40% of physical tasks automatable by 2030.',
        utility: 'Reduces errors, works 24/7, handles dangerous tasks.',
        funding: '$80B invested; Amazon, Tesla leading deployment.',
        hint: 'Steady, real-world deployment beats excitement.'
      }
    },
    {
      id: 't8', name: 'Metaverse VR Offices', icon: '🥽',
      tagline: 'Workers commute to virtual reality office worlds.',
      outcome: 'pass',
      signals: {
        adoption: 'falling',
        sentiment: 'negative',
        hype: 'high',
        confidence: 18,
        experts: 'Researchers: headset fatigue and low utility killed adoption.',
        utility: 'Workers prefer real video calls; hardware is heavy.',
        funding: 'Meta wrote off $40B+; Horizon Worlds near-abandoned.',
        hint: 'Massive hype, massive spend — adoption never followed.'
      }
    },
  ];

  const TECH_POOL_L2 = [
    {
      id: 'q1', name: 'Quantum Computing', icon: '⚛️',
      tagline: 'Qubits solve problems classical computers cannot.',
      outcome: 'invest',
      signals: {
        adoption: 'slow',
        sentiment: 'mixed',
        hype: 'high',
        confidence: 70,
        experts: 'Split: "decades away" vs "breakthrough in 2-3 years" — real debate.',
        utility: 'Drug discovery, logistics, encryption — proven use cases emerging.',
        funding: '$35B invested; Google, IBM, IonQ making real progress.',
        hint: 'Conflicting signals — but real utility and serious investment.'
      }
    },
    {
      id: 'q2', name: 'Web3 Social Networks', icon: '🕸️',
      tagline: 'Decentralized social platforms owned by users via tokens.',
      outcome: 'pass',
      signals: {
        adoption: 'slow',
        sentiment: 'mixed',
        hype: 'high',
        confidence: 22,
        experts: 'Technologists: UX too complex; token incentives attract bots not users.',
        utility: 'Failed to reach mainstream despite years of effort.',
        funding: 'VC funding collapsed after FTX scandal.',
        hint: 'Positive sentiment from insiders, but adoption data tells the real story.'
      }
    },
    {
      id: 'q3', name: 'Biotech Gene Therapy', icon: '🧬',
      tagline: 'Edit genes to cure genetic diseases permanently.',
      outcome: 'invest',
      signals: {
        adoption: 'steady',
        sentiment: 'mixed',
        hype: 'medium',
        confidence: 78,
        experts: 'FDA approved first gene therapies; more in trial pipeline.',
        utility: 'Sickle cell cured in trials; cancer treatments emerging.',
        funding: '$20B/yr, led by Moderna, Vertex, Beam Therapeutics.',
        hint: 'Mixed sentiment hides real results: actual cures in clinical data.'
      }
    },
    {
      id: 'q4', name: 'Carbon Credit NFTs', icon: '🌿',
      tagline: 'Tokenize carbon offsets on blockchain for ESG trading.',
      outcome: 'pass',
      signals: {
        adoption: 'falling',
        sentiment: 'mixed',
        hype: 'high',
        confidence: 25,
        experts: 'Auditors: 90% of voluntary carbon credits found to be worthless.',
        utility: 'Blockchain adds cost and complexity, not verification.',
        funding: 'Major projects (Verra, Gold Standard) pulled back.',
        hint: 'Green + crypto buzz masked fundamentally broken accounting.'
      }
    },
    {
      id: 'q5', name: 'Autonomous Vehicles', icon: '🚗',
      tagline: 'Self-driving cars navigate public roads without humans.',
      outcome: 'invest',
      signals: {
        adoption: 'slow',
        sentiment: 'mixed',
        hype: 'high',
        confidence: 65,
        experts: 'Divided: full autonomy timeline debated, but Waymo scaling robotaxis.',
        utility: 'Waymo logs millions of real paid rides; trucks going autonomous.',
        funding: '$100B+ cumulative; still burning cash but real deployments.',
        hint: 'Slow adoption ≠ fad; massive real investment signals durable trend.'
      }
    },
    {
      id: 'q6', name: 'AI Crypto Trading Bots', icon: '📈',
      tagline: 'AI bots automatically trade crypto for profit.',
      outcome: 'pass',
      signals: {
        adoption: 'steady',
        sentiment: 'mixed',
        hype: 'high',
        confidence: 30,
        experts: 'Quants: retail bots consistently underperform market-makers.',
        utility: 'Most bots lose to fees, slippage, and professional algos.',
        funding: 'Revenue from selling bots, not from bot profits.',
        hint: 'Steady adoption of a product that mostly doesn\'t deliver returns.'
      }
    },
    {
      id: 'q7', name: 'Space Mining', icon: '🚀',
      tagline: 'Extract rare minerals from asteroids and the Moon.',
      outcome: 'invest',
      signals: {
        adoption: 'slow',
        sentiment: 'positive',
        hype: 'high',
        confidence: 55,
        experts: 'NASA, ESA confirming technical feasibility; SpaceX lowering launch cost.',
        utility: 'Asteroid 16-Psyche estimated $10 quintillion in metals.',
        funding: 'US, Luxembourg passed space mining laws; AstroForge launching.',
        hint: 'High hype, but government frameworks + falling launch costs = real.'
      }
    },
    {
      id: 'q8', name: 'AI Relationship Companions', icon: '💬',
      tagline: 'AI chatbots form emotional bonds replacing human connection.',
      outcome: 'pass',
      signals: {
        adoption: 'steady',
        sentiment: 'mixed',
        hype: 'high',
        confidence: 35,
        experts: 'Psychologists: dependent relationships with AI harm long-term wellbeing.',
        utility: 'Growing user base — but regulators and ethicists raising alarms.',
        funding: 'Replika, Character.AI profitable but facing bans in multiple countries.',
        hint: 'Adoption + revenue doesn\'t mean sustainable — regulatory risk is real signal.'
      }
    },
  ];

  // ── State object ───────────────────────────────────────────────
  let G = null;

  // ── Screen entry point ─────────────────────────────────────────
  window.SCREENS[SCREEN_ID] = function () {
    G = null;
    setTimeout(initGame, 40);
    return `
<div id="ftcmd_root" style="
  position:absolute;inset:0;background:#03040c;overflow:hidden;
  font-family:Inter,sans-serif;color:#fff;display:flex;flex-direction:column;">

  <!-- top bar -->
  <div id="ftcmd_topbar" style="
    display:flex;align-items:center;gap:12px;padding:10px 14px;
    background:rgba(0,255,255,0.07);border-bottom:1px solid rgba(0,255,255,0.2);
    flex-shrink:0;z-index:10;">
    <button id="ftcmd_back" style="
      background:none;border:1px solid rgba(0,255,255,0.4);color:${ACCENT};
      font-size:18px;padding:4px 10px;border-radius:6px;cursor:pointer;
      font-family:Inter,sans-serif;">←</button>
    <div style="flex:1;">
      <div style="font-family:Orbitron,monospace;font-size:11px;color:${ACCENT};letter-spacing:2px;opacity:.7;">BITSTREAM VALLEY</div>
      <div style="font-family:Orbitron,monospace;font-size:14px;color:#fff;letter-spacing:1px;">FUTURE TRENDS CMD</div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:9px;color:rgba(255,255,255,.5);letter-spacing:1px;">SCORE</div>
      <div id="ftcmd_score" style="font-family:Orbitron,monospace;font-size:18px;color:${ACCENT};">0</div>
    </div>
    <div style="text-align:center;min-width:52px;">
      <div style="font-size:9px;color:rgba(255,255,255,.5);letter-spacing:1px;">TIME</div>
      <div id="ftcmd_timer" style="font-family:Orbitron,monospace;font-size:18px;color:#fff;">--</div>
    </div>
  </div>

  <!-- status bar -->
  <div id="ftcmd_statusbar" style="
    display:flex;align-items:center;justify-content:space-between;
    padding:7px 16px;background:rgba(0,0,0,.4);border-bottom:1px solid rgba(0,255,255,0.1);
    flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="font-size:10px;color:rgba(255,255,255,.5);">CORRECT:</span>
      <div id="ftcmd_correct_dots" style="display:flex;gap:4px;"></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <span id="ftcmd_streak_badge" style="
        font-size:10px;padding:2px 8px;border-radius:12px;
        background:rgba(0,255,255,0.1);border:1px solid rgba(0,255,255,0.3);
        color:${ACCENT};font-family:Orbitron,monospace;display:none;">
        🔥 STREAK x<span id="ftcmd_streak_num">0</span>
      </span>
      <span style="font-size:10px;color:rgba(255,255,255,.5);">MISSES:</span>
      <div id="ftcmd_wrong_dots" style="display:flex;gap:4px;"></div>
    </div>
    <div style="font-size:10px;color:rgba(255,255,255,.5);" id="ftcmd_level_label">LEVEL 1</div>
  </div>

  <!-- main area -->
  <div id="ftcmd_main" style="flex:1;overflow:hidden;position:relative;display:flex;flex-direction:column;">

    <!-- ambient background art -->
    <div id="ftcmd_bg_art" style="
      position:absolute;inset:0;pointer-events:none;overflow:hidden;opacity:.18;">
      <div style="position:absolute;top:-40px;left:-40px;width:300px;height:300px;
        border-radius:50%;border:2px solid ${ACCENT};opacity:.4;"></div>
      <div style="position:absolute;top:20px;left:20px;width:180px;height:180px;
        border-radius:50%;border:1px solid ${ACCENT};opacity:.3;"></div>
      <div style="position:absolute;bottom:-60px;right:-60px;width:350px;height:350px;
        border-radius:50%;border:2px solid ${ACCENT};opacity:.3;"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        font-size:200px;opacity:.03;">🌐</div>
    </div>

    <!-- card display area -->
    <div id="ftcmd_card_area" style="
      flex:1;display:flex;flex-direction:column;align-items:center;
      justify-content:center;padding:12px;overflow:hidden;position:relative;">
      <div id="ftcmd_card_slot" style="width:100%;max-width:380px;"></div>
    </div>

    <!-- action buttons -->
    <div id="ftcmd_actions" style="
      display:flex;gap:12px;padding:12px 16px 14px;
      background:rgba(0,0,0,.5);border-top:1px solid rgba(0,255,255,0.1);
      flex-shrink:0;justify-content:center;">
      <button id="ftcmd_btn_pass" style="
        flex:1;max-width:160px;padding:14px;border-radius:10px;cursor:pointer;
        background:rgba(255,60,60,.1);border:2px solid rgba(255,60,60,.5);
        color:#FF6B6B;font-size:15px;font-weight:700;font-family:Orbitron,monospace;
        letter-spacing:1px;transition:all .15s;">⛔ PASS</button>
      <button id="ftcmd_btn_invest" style="
        flex:1;max-width:160px;padding:14px;border-radius:10px;cursor:pointer;
        background:rgba(0,255,255,.1);border:2px solid rgba(0,255,255,.5);
        color:${ACCENT};font-size:15px;font-weight:700;font-family:Orbitron,monospace;
        letter-spacing:1px;transition:all .15s;">📈 INVEST</button>
    </div>

  </div>

  <!-- detail panel overlay -->
  <div id="ftcmd_detail" style="
    display:none;position:absolute;inset:0;background:rgba(3,4,12,.95);
    z-index:20;flex-direction:column;overflow-y:auto;"></div>

  <!-- end overlay -->
  <div id="ftcmd_end" style="
    display:none;position:absolute;inset:0;background:rgba(3,4,12,.97);
    z-index:30;flex-direction:column;align-items:center;justify-content:center;
    padding:24px;text-align:center;"></div>

  <!-- feedback flash -->
  <div id="ftcmd_flash" style="
    position:absolute;inset:0;pointer-events:none;z-index:25;
    display:flex;align-items:center;justify-content:center;opacity:0;"></div>

</div>`;
  };

  // ── Init ───────────────────────────────────────────────────────
  function initGame() {
    const root = document.getElementById('ftcmd_root');
    if (!root) return;

    G = {
      level: 1,
      score: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      bestStreak: 0,
      timeLeft: ROUND_TIME_L1,
      timerID: null,
      cards: [],
      currentIdx: 0,
      decided: false,
      phase: 'play',   // 'play' | 'ended'
      startTime: Date.now(),
    };

    buildLevel(1);
    renderDots();
    renderCard();
    startTimer();
    bindActions();
  }

  // ── Build shuffled card queue for a level ──────────────────────
  function buildLevel(lv) {
    const pool = lv === 1 ? TECH_POOL_L1 : TECH_POOL_L2;
    G.cards = shuffle([...pool]);
    G.currentIdx = 0;
    G.level = lv;
    document.getElementById('ftcmd_level_label').textContent = `LEVEL ${lv}`;
    G.timeLeft = lv === 1 ? ROUND_TIME_L1 : ROUND_TIME_L2;
    updateTimerDisplay();
  }

  // ── Timer ──────────────────────────────────────────────────────
  function startTimer() {
    clearInterval(G.timerID);
    G.timerID = setInterval(function () {
      if (G.phase !== 'play') { clearInterval(G.timerID); return; }
      G.timeLeft--;
      updateTimerDisplay();
      if (G.timeLeft <= 0) {
        clearInterval(G.timerID);
        triggerEnd(false, 'timeout');
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const el = document.getElementById('ftcmd_timer');
    if (!el) return;
    const m = Math.floor(G.timeLeft / 60);
    const s = G.timeLeft % 60;
    el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    el.style.color = G.timeLeft <= 15 ? '#FF6B6B' : '#fff';
  }

  // ── Named button handlers (stored so they can be removed on re-init) ──
  function backHandler()   { window.bsv_futuretrendscmdExit(); }
  function investHandler() { handleChoice('invest'); }
  function passHandler()   { handleChoice('pass'); }

  // ── Bind buttons ───────────────────────────────────────────────
  function bindActions() {
    const back    = document.getElementById('ftcmd_back');
    const invest  = document.getElementById('ftcmd_btn_invest');
    const pass    = document.getElementById('ftcmd_btn_pass');

    // Remove before adding to prevent duplicate listeners on Play Again
    back.removeEventListener('click', backHandler);
    invest.removeEventListener('click', investHandler);
    pass.removeEventListener('click',   passHandler);
    document.removeEventListener('keydown', keyHandler);

    back.addEventListener('click', backHandler);
    invest.addEventListener('click', investHandler);
    pass.addEventListener('click',   passHandler);

    // keyboard
    document.addEventListener('keydown', keyHandler);

    // hover effects (use named fns via dataset flag to avoid duplicates)
    if (!invest.dataset.hoverBound) {
      [invest, pass].forEach(function (btn) {
        btn.dataset.hoverBound = '1';
        btn.addEventListener('mouseenter', function () { btn.style.transform = 'scale(1.04)'; });
        btn.addEventListener('mouseleave', function () { btn.style.transform = 'scale(1)'; });
      });
    }
  }

  function keyHandler(e) {
    if (G && G.phase === 'play') {
      if (e.key === 'ArrowRight' || e.key === 'i' || e.key === 'I') handleChoice('invest');
      if (e.key === 'ArrowLeft'  || e.key === 'p' || e.key === 'P') handleChoice('pass');
      if (e.key === 'Escape') closeDetail();
    }
  }

  // ── Render progress dots ───────────────────────────────────────
  function renderDots() {
    const cdEl = document.getElementById('ftcmd_correct_dots');
    const wdEl = document.getElementById('ftcmd_wrong_dots');
    if (!cdEl || !wdEl) return;

    cdEl.innerHTML = '';
    wdEl.innerHTML = '';

    for (let i = 0; i < TARGET_CORRECT; i++) {
      const d = document.createElement('div');
      d.style.cssText = `width:10px;height:10px;border-radius:50%;
        background:${i < G.correct ? ACCENT : 'rgba(0,255,255,.15)'};
        border:1px solid ${i < G.correct ? ACCENT : 'rgba(0,255,255,.3)'};
        transition:all .3s;`;
      cdEl.appendChild(d);
    }
    for (let i = 0; i < MAX_WRONG; i++) {
      const d = document.createElement('div');
      d.style.cssText = `width:10px;height:10px;border-radius:50%;
        background:${i < G.wrong ? '#FF6B6B' : 'rgba(255,107,107,.15)'};
        border:1px solid ${i < G.wrong ? '#FF6B6B' : 'rgba(255,107,107,.3)'};
        transition:all .3s;`;
      wdEl.appendChild(d);
    }
  }

  function updateStreak() {
    const badge = document.getElementById('ftcmd_streak_badge');
    const num   = document.getElementById('ftcmd_streak_num');
    if (G.streak >= 2) {
      badge.style.display = 'inline-block';
      num.textContent = G.streak;
    } else {
      badge.style.display = 'none';
    }
  }

  // ── Render current card ────────────────────────────────────────
  function renderCard() {
    const slot = document.getElementById('ftcmd_card_slot');
    if (!slot) return;

    if (G.currentIdx >= G.cards.length) {
      // exhausted pool — reshuffle or end
      if (G.correct >= TARGET_CORRECT) { triggerEnd(true, 'complete'); return; }
      G.cards = shuffle([...(G.level === 1 ? TECH_POOL_L1 : TECH_POOL_L2)]);
      G.currentIdx = 0;
    }

    const card = G.cards[G.currentIdx];
    const adoptColor = { rapid:'#00FF88', steady:'#00FFFF', slow:'#FFD700', falling:'#FF6B6B' };
    const adoptIcon  = { rapid:'↑↑', steady:'↑', slow:'→', falling:'↓↓' };
    const sentColor  = { positive:'#00FF88', mixed:'#FFD700', negative:'#FF6B6B' };
    const hypeColor  = { low:'#00FF88', medium:'#FFD700', high:'#FF6B6B' };

    const confW = card.signals.confidence;
    const confColor = confW >= 75 ? '#00FF88' : confW >= 50 ? '#FFD700' : '#FF6B6B';

    slot.innerHTML = `
<div id="ftcmd_card" style="
  background:linear-gradient(145deg,rgba(0,255,255,.06) 0%,rgba(3,4,12,1) 100%);
  border:1.5px solid rgba(0,255,255,.35);border-radius:16px;
  padding:18px;box-shadow:0 0 30px rgba(0,255,255,.08);
  cursor:pointer;user-select:none;position:relative;overflow:hidden;">

  <!-- glow line top -->
  <div style="position:absolute;top:0;left:0;right:0;height:2px;
    background:linear-gradient(90deg,transparent,${ACCENT},transparent);opacity:.6;"></div>

  <!-- card header -->
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
    <div style="font-size:44px;line-height:1;">${card.icon}</div>
    <div style="flex:1;">
      <div style="font-family:Orbitron,monospace;font-size:16px;color:#fff;font-weight:700;">${card.name}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:3px;line-height:1.4;">${card.tagline}</div>
    </div>
  </div>

  <!-- signal grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
    <div style="background:rgba(0,0,0,.4);border-radius:8px;padding:8px;border:1px solid rgba(255,255,255,.07);">
      <div style="font-size:9px;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:4px;">MARKET ADOPTION</div>
      <div style="font-size:14px;font-weight:700;color:${adoptColor[card.signals.adoption]};">
        ${adoptIcon[card.signals.adoption]} ${card.signals.adoption.toUpperCase()}
      </div>
    </div>
    <div style="background:rgba(0,0,0,.4);border-radius:8px;padding:8px;border:1px solid rgba(255,255,255,.07);">
      <div style="font-size:9px;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:4px;">NEWS SENTIMENT</div>
      <div style="font-size:14px;font-weight:700;color:${sentColor[card.signals.sentiment]};">
        ${card.signals.sentiment.toUpperCase()}
      </div>
    </div>
    <div style="background:rgba(0,0,0,.4);border-radius:8px;padding:8px;border:1px solid rgba(255,255,255,.07);">
      <div style="font-size:9px;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:4px;">HYPE RISK</div>
      <div style="font-size:14px;font-weight:700;color:${hypeColor[card.signals.hype]};">
        ${card.signals.hype === 'low' ? '🟢' : card.signals.hype === 'medium' ? '🟡' : '🔴'} ${card.signals.hype.toUpperCase()}
      </div>
    </div>
    <div style="background:rgba(0,0,0,.4);border-radius:8px;padding:8px;border:1px solid rgba(255,255,255,.07);">
      <div style="font-size:9px;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:4px;">FORECAST CONFIDENCE</div>
      <div style="font-size:14px;font-weight:700;color:${confColor};">
        ${confW}%
      </div>
    </div>
  </div>

  <!-- confidence bar -->
  <div style="height:4px;background:rgba(255,255,255,.08);border-radius:2px;margin-bottom:14px;overflow:hidden;">
    <div style="height:100%;width:${confW}%;background:linear-gradient(90deg,${confColor},${confColor}88);
      border-radius:2px;transition:width .8s ease;"></div>
  </div>

  <!-- tap to inspect -->
  <div id="ftcmd_inspect_btn" style="
    display:flex;align-items:center;justify-content:center;gap:6px;
    padding:8px;border-radius:8px;cursor:pointer;
    background:rgba(0,255,255,.05);border:1px solid rgba(0,255,255,.2);
    color:rgba(0,255,255,.7);font-size:12px;
    transition:background .15s;">
    🔍 TAP TO INSPECT FULL SIGNAL REPORT
  </div>

</div>`;

    // tap card / inspect button → open detail
    document.getElementById('ftcmd_card').addEventListener('click', function () { openDetail(card); });
    document.getElementById('ftcmd_inspect_btn').addEventListener('click', function (e) {
      e.stopPropagation(); openDetail(card);
    });
  }

  // ── Detail panel ───────────────────────────────────────────────
  function openDetail(card) {
    const panel = document.getElementById('ftcmd_detail');
    if (!panel) return;

    const adoptColor = { rapid:'#00FF88', steady:'#00FFFF', slow:'#FFD700', falling:'#FF6B6B' };
    const adoptIcon  = { rapid:'↑↑', steady:'↑', slow:'→', falling:'↓↓' };
    const sentColor  = { positive:'#00FF88', mixed:'#FFD700', negative:'#FF6B6B' };
    const hypeColor  = { low:'#00FF88', medium:'#FFD700', high:'#FF6B6B' };
    const confW = card.signals.confidence;
    const confColor = confW >= 75 ? '#00FF88' : confW >= 50 ? '#FFD700' : '#FF6B6B';

    panel.innerHTML = `
<div style="padding:16px 16px 24px;max-width:440px;margin:0 auto;width:100%;">

  <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
    <button id="ftcmd_close_detail" style="
      background:none;border:1px solid rgba(0,255,255,.4);color:${ACCENT};
      font-size:16px;padding:4px 10px;border-radius:6px;cursor:pointer;">←</button>
    <div style="font-family:Orbitron,monospace;font-size:13px;color:${ACCENT};">SIGNAL REPORT</div>
  </div>

  <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
    <div style="font-size:50px;">${card.icon}</div>
    <div>
      <div style="font-family:Orbitron,monospace;font-size:17px;color:#fff;">${card.name}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px;">${card.tagline}</div>
    </div>
  </div>

  <div style="background:rgba(0,255,255,.05);border:1px solid rgba(0,255,255,.2);
    border-radius:12px;padding:14px;margin-bottom:12px;">
    <div style="font-size:9px;color:${ACCENT};letter-spacing:2px;margin-bottom:10px;">⚡ MARKET SIGNALS</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div>
        <div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px;">ADOPTION TREND</div>
        <div style="font-size:15px;font-weight:700;color:${adoptColor[card.signals.adoption]};">
          ${adoptIcon[card.signals.adoption]} ${card.signals.adoption.toUpperCase()}
        </div>
      </div>
      <div>
        <div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px;">SENTIMENT</div>
        <div style="font-size:15px;font-weight:700;color:${sentColor[card.signals.sentiment]};">
          ${card.signals.sentiment.toUpperCase()}
        </div>
      </div>
      <div>
        <div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px;">HYPE RISK</div>
        <div style="font-size:15px;font-weight:700;color:${hypeColor[card.signals.hype]};">
          ${card.signals.hype === 'low' ? '🟢' : card.signals.hype === 'medium' ? '🟡' : '🔴'} ${card.signals.hype.toUpperCase()}
        </div>
      </div>
      <div>
        <div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px;">CONFIDENCE</div>
        <div style="font-size:15px;font-weight:700;color:${confColor};">${confW}%</div>
      </div>
    </div>
    <div style="margin-top:10px;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;">
      <div style="height:100%;width:${confW}%;background:${confColor};border-radius:3px;"></div>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">

    <div style="background:rgba(0,0,0,.4);border-radius:10px;padding:12px;
      border-left:3px solid #00FF88;">
      <div style="font-size:9px;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:5px;">💡 UTILITY</div>
      <div style="font-size:12px;color:rgba(255,255,255,.85);line-height:1.5;">${card.signals.utility}</div>
    </div>

    <div style="background:rgba(0,0,0,.4);border-radius:10px;padding:12px;
      border-left:3px solid #4FC3F7;">
      <div style="font-size:9px;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:5px;">🎓 EXPERT VIEW</div>
      <div style="font-size:12px;color:rgba(255,255,255,.85);line-height:1.5;">${card.signals.experts}</div>
    </div>

    <div style="background:rgba(0,0,0,.4);border-radius:10px;padding:12px;
      border-left:3px solid #FFD700;">
      <div style="font-size:9px;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:5px;">💰 FUNDING</div>
      <div style="font-size:12px;color:rgba(255,255,255,.85);line-height:1.5;">${card.signals.funding}</div>
    </div>

  </div>

  <div style="display:flex;gap:10px;">
    <button id="ftcmd_det_pass" style="
      flex:1;padding:13px;border-radius:10px;cursor:pointer;
      background:rgba(255,60,60,.1);border:2px solid rgba(255,60,60,.5);
      color:#FF6B6B;font-size:14px;font-weight:700;font-family:Orbitron,monospace;">⛔ PASS</button>
    <button id="ftcmd_det_invest" style="
      flex:1;padding:13px;border-radius:10px;cursor:pointer;
      background:rgba(0,255,255,.1);border:2px solid rgba(0,255,255,.5);
      color:${ACCENT};font-size:14px;font-weight:700;font-family:Orbitron,monospace;">📈 INVEST</button>
  </div>

</div>`;

    panel.style.display = 'flex';
    document.getElementById('ftcmd_close_detail').addEventListener('click', closeDetail);
    document.getElementById('ftcmd_det_invest').addEventListener('click', function () { closeDetail(); handleChoice('invest'); });
    document.getElementById('ftcmd_det_pass').addEventListener('click',   function () { closeDetail(); handleChoice('pass'); });
  }

  function closeDetail() {
    const p = document.getElementById('ftcmd_detail');
    if (p) p.style.display = 'none';
  }

  // ── Handle player choice ───────────────────────────────────────
  function handleChoice(choice) {
    if (!G || G.phase !== 'play') return;
    if (G.decided) return;

    const card = G.cards[G.currentIdx];
    const correct = (choice === card.outcome);
    G.decided = true;

    if (correct) {
      G.correct++;
      G.streak++;
      G.bestStreak = Math.max(G.bestStreak, G.streak);
      const streakBonus = G.streak >= 3 ? Math.floor(G.streak / 3) * STREAK_BONUS : 0;
      const timeBonus = Math.max(0, Math.floor(G.timeLeft / 5) * 5);
      G.score += BASE_POINTS + streakBonus + timeBonus;
      flashFeedback(true, card.name, G.streak, streakBonus);
    } else {
      G.wrong++;
      G.streak = 0;
      G.score = Math.max(0, G.score - 30);
      flashFeedback(false, card.name, 0, 0);
    }

    updateScore();
    updateStreak();
    renderDots();

    // check win / loss
    if (G.correct >= TARGET_CORRECT && G.level === 1) {
      // advance to level 2
      setTimeout(function () {
        G.decided = false;
        showLevelTransition(2);
      }, 1200);
      return;
    }
    if (G.correct >= TARGET_CORRECT && G.level === 2) {
      setTimeout(function () { triggerEnd(true, 'complete'); }, 1200);
      return;
    }
    if (G.wrong >= MAX_WRONG) {
      setTimeout(function () { triggerEnd(false, 'toomany'); }, 1200);
      return;
    }

    // next card
    setTimeout(function () {
      G.decided = false;
      G.currentIdx++;
      renderCard();
    }, 1200);
  }

  // ── Level transition ───────────────────────────────────────────
  function showLevelTransition(lv) {
    clearInterval(G.timerID);
    const end = document.getElementById('ftcmd_end');
    if (!end) return;

    end.innerHTML = `
<div style="text-align:center;padding:30px 24px;max-width:380px;">
  <div style="font-size:50px;margin-bottom:16px;">⚡</div>
  <div style="font-family:Orbitron,monospace;font-size:20px;color:${ACCENT};margin-bottom:8px;">
    MISSION ACCOMPLISHED!
  </div>
  <div style="font-size:13px;color:rgba(255,255,255,.6);margin-bottom:20px;line-height:1.5;">
    You read the clear signals well.<br>
    Now face <strong style="color:#FFD700;">mixed signals</strong> and real complexity.
  </div>
  <div style="background:rgba(0,255,255,.07);border:1px solid rgba(0,255,255,.3);
    border-radius:12px;padding:14px;margin-bottom:24px;font-size:13px;color:rgba(255,255,255,.7);">
    Level 2 has conflicting data — some technologies with hype are genuinely real.<br>
    Focus on <em>utility + funding</em> over <em>sentiment</em>.
  </div>
  <button id="ftcmd_lv2_btn" style="
    padding:14px 32px;border-radius:10px;cursor:pointer;
    background:rgba(0,255,255,.1);border:2px solid ${ACCENT};
    color:${ACCENT};font-size:15px;font-weight:700;font-family:Orbitron,monospace;">
    ENTER LEVEL 2 →
  </button>
</div>`;
    end.style.display = 'flex';

    document.getElementById('ftcmd_lv2_btn').addEventListener('click', function () {
      end.style.display = 'none';
      G.correct = 0;
      G.wrong = 0;
      G.decided = false;
      buildLevel(2);
      renderDots();
      renderCard();
      startTimer();
    });
  }

  // ── Flash feedback ─────────────────────────────────────────────
  function flashFeedback(correct, name, streak, bonus) {
    const flash = document.getElementById('ftcmd_flash');
    if (!flash) return;

    const color  = correct ? '#00FF88' : '#FF6B6B';
    const icon   = correct ? '✅' : '❌';
    const label  = correct ? 'CORRECT FORECAST!' : 'NICE TRY — FADS LOSE MONEY';
    const sub    = correct
      ? (streak >= 3 ? `🔥 ${streak}-STREAK! +${bonus} BONUS` : `Nice analysis! +${BASE_POINTS} pts`)
      : `-30 pts — Read the signals more carefully.`;

    flash.innerHTML = `
<div style="background:rgba(3,4,12,.92);border:2px solid ${color};border-radius:14px;
  padding:18px 28px;text-align:center;box-shadow:0 0 30px ${color}44;">
  <div style="font-size:40px;margin-bottom:6px;">${icon}</div>
  <div style="font-family:Orbitron,monospace;font-size:15px;color:${color};font-weight:700;">${label}</div>
  <div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:6px;">${sub}</div>
</div>`;

    flash.style.opacity = '1';
    flash.style.transition = 'opacity 0s';
    setTimeout(function () {
      flash.style.transition = 'opacity 0.6s';
      flash.style.opacity = '0';
    }, 900);
  }

  // ── Score display ──────────────────────────────────────────────
  function updateScore() {
    const el = document.getElementById('ftcmd_score');
    if (el) el.textContent = G.score;
  }

  // ── End game ───────────────────────────────────────────────────
  function triggerEnd(won, reason) {
    if (!G || G.phase === 'ended') return;
    G.phase = 'ended';
    clearInterval(G.timerID);

    // accuracy bonus
    const totalAttempts = G.correct + G.wrong;
    const accuracy = totalAttempts > 0 ? Math.round((G.correct / totalAttempts) * 100) : 0;
    if (accuracy >= 90) G.score += 150;
    else if (accuracy >= 75) G.score += 75;

    endGame(won ? calcStars() : 0, won, reason, accuracy);
  }

  function calcStars() {
    if (G.score >= STAR3_SCORE) return 3;
    if (G.score >= STAR2_SCORE) return 2;
    return 1;
  }

  function endGame(stars, won, reason, accuracy) {
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bsv_futuretrendscmd', { level: 1, is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    const end = document.getElementById('ftcmd_end');
    if (!end) return;

    const starsHTML = won
      ? ['⭐','⭐','⭐'].map(function (s, i) {
          return `<span style="font-size:36px;opacity:${i < stars ? 1 : 0.2};
            transition:opacity .3s ${i*0.2}s;">${s}</span>`;
        }).join('')
      : '<span style="font-size:36px;">💀</span>';

    const titleText  = won ? (stars === 3 ? 'FUTURE VISIONARY!' : stars === 2 ? 'TREND ANALYST' : 'FORECASTER') : 'SIGNAL LOST';
    const titleColor = won ? ACCENT : '#FF6B6B';

    const reasonText = !won
      ? (reason === 'timeout' ? 'Time expired before reaching the target.' : `Too many missed forecasts (${MAX_WRONG} allowed).`)
      : '';

    const badgeHTML = won && stars === 3
      ? `<div style="background:rgba(0,255,255,.1);border:1px solid ${ACCENT};border-radius:10px;
           padding:8px 16px;margin-bottom:12px;font-size:12px;color:${ACCENT};">
           🏆 Future Visionary Badge Earned!
         </div>`
      : '';

    const streakHTML = G.bestStreak >= 3
      ? `<div style="font-size:12px;color:#FFD700;margin-bottom:6px;">🔥 Best Streak: ${G.bestStreak}x</div>`
      : '';

    end.innerHTML = `
<div style="text-align:center;padding:28px 20px;max-width:400px;width:100%;">

  <div style="font-family:Orbitron,monospace;font-size:11px;color:rgba(0,255,255,.5);
    letter-spacing:3px;margin-bottom:12px;">${won ? 'MISSION COMPLETE' : 'NICE TRY — GO AGAIN!'}</div>

  <div style="display:flex;gap:4px;justify-content:center;margin-bottom:14px;">${starsHTML}</div>

  <div style="font-family:Orbitron,monospace;font-size:20px;color:${titleColor};
    margin-bottom:6px;">${titleText}</div>

  ${reasonText ? `<div style="font-size:12px;color:rgba(255,107,107,.7);margin-bottom:12px;">${reasonText}</div>` : ''}

  <div style="background:rgba(0,0,0,.4);border-radius:12px;padding:14px;margin-bottom:14px;
    border:1px solid rgba(0,255,255,.15);">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:center;margin-bottom:10px;">
      <div>
        <div style="font-size:9px;color:rgba(255,255,255,.4);letter-spacing:1px;">SCORE</div>
        <div style="font-family:Orbitron,monospace;font-size:20px;color:${ACCENT};">${G.score}</div>
      </div>
      <div>
        <div style="font-size:9px;color:rgba(255,255,255,.4);letter-spacing:1px;">ACCURACY</div>
        <div style="font-family:Orbitron,monospace;font-size:20px;color:#FFD700;">${accuracy}%</div>
      </div>
    </div>
    ${streakHTML}
    ${coins > 0 ? `<div style="font-size:13px;color:#FFD700;font-weight:700;">+${coins} 🪙 Coinaverse Coins</div>` : ''}
    ${coins > 0 ? `<div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:3px;">+${Math.floor(coins/4)} XP earned</div>` : ''}
  </div>

  ${badgeHTML}

  <!-- lesson -->
  <div style="background:rgba(0,255,255,.05);border:1px solid rgba(0,255,255,.2);
    border-radius:12px;padding:14px;margin-bottom:20px;text-align:left;">
    <div style="font-size:9px;color:${ACCENT};letter-spacing:2px;margin-bottom:8px;">📡 ANALYST INSIGHT</div>
    <div style="font-size:12px;color:rgba(255,255,255,.75);line-height:1.6;">
      Not every new technology becomes the future — many trends are hype with no lasting value.
      Analyzing real signals like <strong style="color:#00FF88;">adoption rate</strong>,
      <strong style="color:#00FF88;">utility</strong>, and
      <strong style="color:#00FF88;">expert consensus</strong>
      (not just media buzz) is how smart investors and innovators decide where to focus.
    </div>
  </div>

  <div style="display:flex;gap:10px;justify-content:center;">
    <button id="ftcmd_play_again" style="
      flex:1;max-width:150px;padding:13px;border-radius:10px;cursor:pointer;
      background:rgba(0,255,255,.1);border:2px solid ${ACCENT};
      color:${ACCENT};font-size:13px;font-weight:700;font-family:Orbitron,monospace;">
      ▶ PLAY AGAIN
    </button>
    <button id="ftcmd_to_hub" style="
      flex:1;max-width:150px;padding:13px;border-radius:10px;cursor:pointer;
      background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.2);
      color:rgba(255,255,255,.7);font-size:13px;font-weight:700;font-family:Orbitron,monospace;">
      ← HUB
    </button>
  </div>

</div>`;

    end.style.display = 'flex';

    document.getElementById('ftcmd_play_again').addEventListener('click', function () {
      document.removeEventListener('keydown', keyHandler);
      end.style.display = 'none';
      G = null;
      initGame();
    });
    document.getElementById('ftcmd_to_hub').addEventListener('click', function () {
      window.bsv_futuretrendscmdExit();
    });
  }

  // ── Exit ───────────────────────────────────────────────────────
  window.bsv_futuretrendscmdExit = function () {
    if (G) {
      clearInterval(G.timerID);
      G = null;
    }
    document.removeEventListener('keydown', keyHandler);
    if (window.state) state.viewingWorld = WORLD_ID;
    goTo('hub');
  };

  // ── Utilities ──────────────────────────────────────────────────
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

})();
