/* ════════════════════════════════════════════════════════════════════════════
   SMART SPENDING PLAZA — Coinaverse / Budgetron Base (Strategist)
   Value-based spending: Compare products, pick the best LONG-TERM VALUE.
   True Cost = price ÷ lifespan in months.  Best value = lowest true cost.
   Level 1: simple two-card comparisons.
   Level 2: sales, hidden fees, subscriptions, bundles.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  /* ── CONSTANTS ─────────────────────────────────────────────────────────── */
  const SCREEN_ID   = 'game_bud_plaza';
  const WORLD_ID    = 'strategist';
  const ACCENT      = '#1a2a4a';
  const ACCENT_GLOW = '#2a4a8a';
  const TEAL        = '#00e5c0';
  const TEAL_DIM    = '#00b89a';
  const GOLD        = '#fbbf24';
  const RED_ERR     = '#f87171';
  const ROUND_SECS  = 90;          // total time per round
  const COMBO_BONUS = 10;          // extra pts per correct streak
  const STAR3_SCORE = 820;
  const STAR2_SCORE = 500;
  const STAR1_SCORE = 1;

  /* ── PRODUCT CATALOGUE ─────────────────────────────────────────────────── */
  // Each round = one question with 2-4 product options.
  // bestIdx: index of the best-value option (lowest trueCostPerMonth).
  // trueCostPerMonth is pre-calculated for display (shown after pick).
  // hint: what the AI assistant says.
  // For Level 2, hidden fees are baked into the effective price shown in breakdown.

  const ROUNDS_L1 = [
    {
      level: 1,
      question: 'Which shoes deliver the best value?',
      hint: 'Divide the price by how long it lasts!',
      products: [
        { emoji: '👟', name: 'Budget Kicks', price: 30, lifeMonths: 3,  stars: 2, warranty: 0,  reviews: '1.2k', badge: null },
        { emoji: '👟', name: 'ProStep Ultra', price: 70, lifeMonths: 36, stars: 5, warranty: 24, reviews: '8.4k', badge: 'BEST SELLER' },
      ],
      bestIdx: 1,
    },
    {
      level: 1,
      question: 'Which phone case is the smarter buy?',
      hint: 'A quality case protects your phone — and your wallet long-term.',
      products: [
        { emoji: '📱', name: 'Thin Shell', price: 8,  lifeMonths: 4,  stars: 2, warranty: 0, reviews: '890',  badge: null },
        { emoji: '📱', name: 'ArmorGuard Pro', price: 25, lifeMonths: 24, stars: 5, warranty: 12, reviews: '5.1k', badge: null },
      ],
      bestIdx: 1,
    },
    {
      level: 1,
      question: 'Which backpack is worth buying?',
      hint: 'Higher upfront cost can mean way less over time.',
      products: [
        { emoji: '🎒', name: 'BasicPack', price: 20,  lifeMonths: 6,  stars: 2, warranty: 0, reviews: '430',  badge: null },
        { emoji: '🎒', name: 'TrailMaster X', price: 80, lifeMonths: 60, stars: 5, warranty: 24, reviews: '9.7k', badge: 'TOP RATED' },
      ],
      bestIdx: 1,
    },
    {
      level: 1,
      question: 'Which umbrella keeps you drier — over time?',
      hint: 'Count how often you\'d replace the cheap one.',
      products: [
        { emoji: '☂️', name: 'Mini Fold', price: 10, lifeMonths: 5,  stars: 2, warranty: 0, reviews: '200',  badge: null },
        { emoji: '☂️', name: 'StormShield', price: 35, lifeMonths: 36, stars: 5, warranty: 12, reviews: '3.2k', badge: null },
      ],
      bestIdx: 1,
    },
    {
      level: 1,
      question: 'Which water bottle gives you the most value?',
      hint: 'Calculate the cost per month for each.',
      products: [
        { emoji: '🍶', name: 'Plastic Squeezy', price: 5,  lifeMonths: 3,  stars: 2, warranty: 0, reviews: '320', badge: null },
        { emoji: '🍶', name: 'HydroVault Steel', price: 40, lifeMonths: 60, stars: 5, warranty: 24, reviews: '12k', badge: 'ECO PICK' },
      ],
      bestIdx: 1,
    },
    {
      level: 1,
      question: 'Which headphones win on long-term value?',
      hint: 'A 5-star product may cost more upfront but far less overall.',
      products: [
        { emoji: '🎧', name: 'BudBeat Basic', price: 15, lifeMonths: 4,  stars: 2, warranty: 0,  reviews: '580', badge: null },
        { emoji: '🎧', name: 'SonicPro HD',  price: 90, lifeMonths: 48, stars: 5, warranty: 24, reviews: '22k', badge: null },
        { emoji: '🎧', name: 'MidFi 300',   price: 45, lifeMonths: 18, stars: 3, warranty: 6,  reviews: '3.1k', badge: null },
      ],
      bestIdx: 1,  // $90/48mo = $1.88; $45/18 = $2.50; $15/4 = $3.75
    },
  ];

  const ROUNDS_L2 = [
    {
      level: 2,
      question: 'The Budget Blade is on SALE — is it the best deal?',
      hint: 'Sale prices don\'t always mean best value. Check the lifespan!',
      products: [
        { emoji: '🔪', name: 'Budget Blade (SALE!)', price: 12, lifeMonths: 4,  stars: 2, warranty: 0, reviews: '440', badge: 'SALE -40%',
          note: 'Was $20 — now $12' },
        { emoji: '🔪', name: 'ChefEdge Pro',        price: 55, lifeMonths: 72, stars: 5, warranty: 36, reviews: '14k', badge: null,
          note: null },
      ],
      bestIdx: 1,  // $12/4=$3.00 vs $55/72=$0.76
    },
    {
      level: 2,
      question: 'Which streaming plan gives you more per dollar?',
      hint: 'Watch out for hidden fees and add-ons in subscriptions!',
      products: [
        { emoji: '📺', name: 'StreamBase Free Trial', price: 0,  lifeMonths: 1,  stars: 3, warranty: 0, reviews: '2.1k', badge: 'FREE TRIAL',
          note: '$14.99/mo after 1 month + $4.99 HD add-on' },
        { emoji: '📺', name: 'ClearStream Annual',    price: 96, lifeMonths: 12, stars: 5, warranty: 0, reviews: '18k', badge: 'BEST VALUE',
          note: '$8/mo billed yearly — HD included' },
      ],
      // StreamBase true cost = $14.99+$4.99 = $19.98/mo vs ClearStream $8/mo
      bestIdx: 1,
    },
    {
      level: 2,
      question: 'Which gym membership is actually cheaper?',
      hint: 'Annual vs monthly — always run the full math.',
      products: [
        { emoji: '🏋️', name: 'FlexGym Monthly',  price: 40,  lifeMonths: 1,  stars: 3, warranty: 0, reviews: '3.4k', badge: null,
          note: '$40/mo, cancel anytime' },
        { emoji: '🏋️', name: 'IronPass Annual',  price: 300, lifeMonths: 12, stars: 5, warranty: 0, reviews: '9.2k', badge: '38% OFF',
          note: '$25/mo billed as $300/yr — includes classes' },
      ],
      bestIdx: 1,  // $40/mo vs $25/mo
    },
    {
      level: 2,
      question: 'Which bundle is the best value?',
      hint: 'Bundles can save money — but only if you use everything in them.',
      products: [
        { emoji: '🖨️', name: 'Printer + Ink Bundle', price: 80, lifeMonths: 12, stars: 4, warranty: 12, reviews: '5.5k', badge: 'BUNDLE',
          note: 'Includes 2 ink packs — saves $30 vs buying separate' },
        { emoji: '🖨️', name: 'Printer Only',         price: 60, lifeMonths: 12, stars: 4, warranty: 12, reviews: '5.5k', badge: null,
          note: 'Ink packs sold separately: $25 each' },
        { emoji: '🖨️', name: 'Budget Printer',       price: 40, lifeMonths: 6,  stars: 2, warranty: 0,  reviews: '800', badge: null,
          note: 'No warranty, runs out of ink fast — $20 each refill' },
      ],
      // Bundle: $80/12=$6.67. Printer+2ink: $60+$50=$110/12=$9.17. Budget: $40/6=$6.67 but no warranty, low quality
      // Bundle wins clearly because printer-only is $110 total.
      bestIdx: 0,
    },
    {
      level: 2,
      question: 'Which laptop deal delivers the best value over 3 years?',
      hint: 'Extended warranties and reliability ratings matter for big purchases.',
      products: [
        { emoji: '💻', name: 'BudgetBook 11',  price: 350, lifeMonths: 18, stars: 2, warranty: 6,  reviews: '2.1k', badge: null,
          note: 'Low reliability score — likely needs repair' },
        { emoji: '💻', name: 'PixelBook Pro',  price: 900, lifeMonths: 60, stars: 5, warranty: 36, reviews: '41k', badge: 'EDITOR\'S CHOICE',
          note: '5-year average lifespan, extended warranty included' },
        { emoji: '💻', name: 'MidRange i5',    price: 550, lifeMonths: 30, stars: 3, warranty: 12, reviews: '8.7k', badge: null,
          note: 'Decent mid-tier option' },
      ],
      // $350/18=$19.44; $900/60=$15.00; $550/30=$18.33
      bestIdx: 1,
    },
    {
      level: 2,
      question: 'Which coffee maker gives you the best value per cup?',
      hint: 'Pod machines look cheap but the pods add up fast!',
      products: [
        { emoji: '☕', name: 'PodPresso Mini',    price: 60,  lifeMonths: 36, stars: 3, warranty: 12, reviews: '7.3k', badge: null,
          note: '$0.75/pod × 30 pods/mo = $22.50/mo running cost' },
        { emoji: '☕', name: 'BrewMaster 5-Cup', price: 120, lifeMonths: 60, stars: 5, warranty: 24, reviews: '18k', badge: 'BEST BREWER',
          note: '$0.05/cup × 90 cups/mo = $4.50/mo running cost' },
      ],
      // Total cost: PodPresso = $60 + 36×$22.50 = $870; BrewMaster = $120 + 60×$4.50 = $390
      // Per month: $870/36=$24.17 vs $390/60=$6.50
      bestIdx: 1,
    },
  ];

  /* ── STATE ─────────────────────────────────────────────────────────────── */
  let G = null;

  function freshState() {
    // Shuffle and interleave rounds: 4 L1, then 6 L2
    const l1 = shuffle([...ROUNDS_L1]);
    const l2 = shuffle([...ROUNDS_L2]);
    const queue = [...l1.slice(0, 4), ...l2.slice(0, 6)];
    return {
      phase: 'intro',    // intro | play | result | gameover
      rounds: queue,
      roundIdx: 0,
      score: 0,
      combo: 0,
      bestCombo: 0,
      correct: 0,
      total: 0,
      timeLeft: ROUND_SECS,
      lastTick: performance.now(),
      choiceResult: null,  // { correct, breakdown, chosen, best }
      rafId: null,
      timerRunning: false,
    };
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ── SCREEN REGISTRATION ─────────────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS[SCREEN_ID] = function () {
    G = freshState();
    setTimeout(initGame, 40);
    return `<div id="bpRoot" style="position:absolute;inset:0;background:#03040c;overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap');
        #bpRoot * { box-sizing: border-box; }
        .bp-card {
          background: linear-gradient(145deg, #0d1f3c, #071428);
          border: 2px solid ${ACCENT};
          border-radius: 18px;
          padding: 18px 14px 14px;
          cursor: pointer;
          transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
          position: relative;
          overflow: hidden;
          flex: 1;
          min-width: 0;
          touch-action: manipulation;
          user-select: none;
        }
        .bp-card:hover, .bp-card:active {
          transform: translateY(-4px) scale(1.02);
          border-color: ${TEAL};
          box-shadow: 0 0 28px rgba(0,229,192,0.25), 0 0 60px rgba(26,42,74,0.5);
        }
        .bp-card.selected-correct {
          border-color: ${TEAL} !important;
          box-shadow: 0 0 40px rgba(0,229,192,0.45) !important;
          transform: translateY(-4px) scale(1.03) !important;
        }
        .bp-card.selected-wrong {
          border-color: ${RED_ERR} !important;
          box-shadow: 0 0 40px rgba(248,113,113,0.35) !important;
        }
        .bp-card.best-reveal {
          border-color: ${GOLD} !important;
          box-shadow: 0 0 40px rgba(251,191,36,0.35) !important;
        }
        .bp-star { color: ${GOLD}; font-size: 0.85rem; }
        .bp-btn {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          padding: 12px 24px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.12s;
        }
        .bp-btn:hover { opacity: 0.88; transform: scale(1.04); }
        .bp-btn-teal { background: linear-gradient(135deg, ${TEAL}, ${TEAL_DIM}); color: #03040c; }
        .bp-btn-outline { background: transparent; border: 2px solid ${TEAL}; color: ${TEAL}; }
        .bp-badge {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.42rem;
          letter-spacing: 0.12em;
          padding: 3px 8px;
          border-radius: 6px;
          background: linear-gradient(90deg, ${GOLD}, #f59e0b);
          color: #03040c;
          font-weight: 700;
          position: absolute;
          top: 10px; right: 10px;
        }
        .bp-hologram {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          pointer-events: none;
          background: linear-gradient(135deg, rgba(0,229,192,0.04) 0%, transparent 50%, rgba(26,42,74,0.08) 100%);
        }
        .bp-scanline {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,229,192,0.02) 3px, rgba(0,229,192,0.02) 4px);
        }
        .bp-true-cost {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: ${TEAL};
        }
        .bp-per-month {
          font-family: 'Inter', sans-serif;
          font-size: 0.62rem;
          color: rgba(255,255,255,0.5);
          margin-top: 1px;
        }
        .bp-pill {
          display: inline-block;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.45rem;
          letter-spacing: 0.1em;
          padding: 3px 9px;
          border-radius: 20px;
          background: rgba(0,229,192,0.12);
          border: 1px solid rgba(0,229,192,0.3);
          color: ${TEAL};
          margin-top: 5px;
        }
        .bp-overlay {
          position: absolute;
          inset: 0;
          background: rgba(3,4,12,0.88);
          backdrop-filter: blur(8px);
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 24px;
        }
        .bp-float-text {
          position: absolute;
          font-family: 'Orbitron', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          pointer-events: none;
          z-index: 30;
          animation: bpFloat 1.2s ease-out forwards;
        }
        @keyframes bpFloat {
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-80px); }
        }
        @keyframes bpPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,229,192,0.3); }
          50%       { box-shadow: 0 0 45px rgba(0,229,192,0.55); }
        }
        @keyframes bpShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px); }
          40%     { transform: translateX(8px); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(5px); }
        }
        .bp-shake { animation: bpShake 0.4s ease; }
        .bp-combo-badge {
          animation: bpCombo 0.5s cubic-bezier(0.36,0.07,0.19,0.97);
        }
        @keyframes bpCombo {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        .bp-grid-deco {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(rgba(0,229,192,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,229,192,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .bp-store-deco {
          font-size: 2.2rem;
          text-shadow: 0 0 20px rgba(0,229,192,0.4);
          animation: bpStoreGlow 2s ease-in-out infinite alternate;
        }
        @keyframes bpStoreGlow {
          0%   { text-shadow: 0 0 20px rgba(0,229,192,0.3); }
          100% { text-shadow: 0 0 40px rgba(0,229,192,0.7), 0 0 80px rgba(26,42,74,0.5); }
        }
        .bp-assistant {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0,229,192,0.07);
          border: 1px solid rgba(0,229,192,0.2);
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 12px;
        }
        .bp-assistant-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${TEAL}, ${ACCENT});
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
          box-shadow: 0 0 15px rgba(0,229,192,0.35);
        }
        .bp-level-badge {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.45rem;
          letter-spacing: 0.15em;
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-block;
        }
        .bp-level-1 { background: rgba(96,165,250,0.15); border: 1px solid rgba(96,165,250,0.35); color: #93c5fd; }
        .bp-level-2 { background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.35); color: ${GOLD}; }
      </style>
      <!-- bg decorations -->
      <div class="bp-grid-deco"></div>
      <!-- ambient store windows (decorative) -->
      <div id="bpDeco" style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0"></div>
      <!-- top bar -->
      <div id="bpTopBar" style="position:relative;z-index:10;display:flex;align-items:center;gap:10px;padding:12px 16px 10px;background:linear-gradient(180deg,rgba(3,4,12,0.9),transparent)">
        <button id="bpBack" style="padding:7px 13px;border:1px solid rgba(26,42,74,0.8);border-radius:9px;background:rgba(26,42,74,0.35);color:rgba(255,255,255,0.7);font-family:'Orbitron',sans-serif;font-size:0.58rem;letter-spacing:0.1em;cursor:pointer;transition:all 0.15s">← EXIT</button>
        <div style="flex:1;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:0.68rem;letter-spacing:0.2em;color:${TEAL}">SMART SPENDING PLAZA</div>
        </div>
        <!-- HUD chips -->
        <div style="display:flex;gap:6px;align-items:center">
          <div style="text-align:center;background:rgba(26,42,74,0.4);border:1px solid rgba(26,42,74,0.8);border-radius:8px;padding:4px 10px">
            <div style="font-family:'Orbitron',sans-serif;font-size:0.38rem;letter-spacing:0.1em;color:rgba(255,255,255,0.45)">VALUE</div>
            <div id="bpScore" style="font-family:'Orbitron',sans-serif;font-size:0.9rem;font-weight:700;color:${TEAL}">0</div>
          </div>
          <div id="bpTimerChip" style="text-align:center;background:rgba(26,42,74,0.4);border:1px solid rgba(26,42,74,0.8);border-radius:8px;padding:4px 10px">
            <div style="font-family:'Orbitron',sans-serif;font-size:0.38rem;letter-spacing:0.1em;color:rgba(255,255,255,0.45)">TIME</div>
            <div id="bpTimer" style="font-family:'Orbitron',sans-serif;font-size:0.9rem;font-weight:700;color:${GOLD}">${ROUND_SECS}s</div>
          </div>
        </div>
      </div>
      <!-- combo bar -->
      <div id="bpComboRow" style="position:relative;z-index:10;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 16px;min-height:24px">
        <div id="bpComboEl" style="font-family:'Orbitron',sans-serif;font-size:0.55rem;letter-spacing:0.15em;color:rgba(255,255,255,0.35)">COMBO ×0</div>
        <div id="bpStreakEl" style="font-size:0.75rem"></div>
      </div>
      <!-- main game area -->
      <div id="bpMain" style="position:relative;z-index:5;padding:0 14px 14px;flex:1;overflow-y:auto;overflow-x:hidden"></div>
      <!-- float layer -->
      <div id="bpFloatLayer" style="position:absolute;inset:0;pointer-events:none;z-index:25"></div>
    </div>`;
  };

  /* ── INIT ──────────────────────────────────────────────────────────────── */
  function initGame() {
    if (!G) return;
    const back = document.getElementById('bpBack');
    if (back) back.addEventListener('click', window.bud_plazaExit);

    // Ambient store deco
    renderDeco();
    // Show intro overlay
    showIntro();
  }

  function renderDeco() {
    const d = document.getElementById('bpDeco');
    if (!d) return;
    const icons = ['🛍️','🏪','💳','🤖','🏷️','💡','📦','🛒'];
    let html = '';
    const positions = [
      [8,15],[85,10],[5,65],[90,58],[45,88],[20,82],[72,20],[60,70]
    ];
    positions.forEach(([l, t], i) => {
      const size = 1.4 + (i % 3) * 0.3;
      html += `<div style="position:absolute;left:${l}%;top:${t}%;font-size:${size}rem;opacity:${0.08 + (i%4)*0.03};transform:rotate(${(i%5-2)*8}deg);filter:blur(${i%2}px)">${icons[i]}</div>`;
    });
    // Holographic price tag decorations
    const prices = ['$12.99','$0.83/mo','VALUE★','$3.75/mo'];
    prices.forEach((p, i) => {
      const sides = [12, 78, 25, 65];
      const tops = [30, 45, 75, 20];
      html += `<div style="position:absolute;left:${sides[i]}%;top:${tops[i]}%;font-family:'Orbitron',sans-serif;font-size:0.38rem;color:${TEAL};opacity:0.07;letter-spacing:0.1em;transform:rotate(${(i%3-1)*12}deg)">${p}</div>`;
    });
    d.innerHTML = html;
  }

  /* ── INTRO OVERLAY ─────────────────────────────────────────────────────── */
  function showIntro() {
    const main = document.getElementById('bpMain');
    if (!main) return;
    main.innerHTML = '';
    const overlay = document.createElement('div');
    overlay.className = 'bp-overlay';
    overlay.style.cssText = 'position:absolute;inset:0;z-index:15;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:28px;background:rgba(3,4,12,0.92)';
    overlay.innerHTML = `
      <div style="text-align:center;max-width:420px">
        <div style="font-size:3rem;margin-bottom:12px;filter:drop-shadow(0 0 20px rgba(0,229,192,0.5))">🛍️</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:1.05rem;font-weight:700;letter-spacing:0.15em;color:${TEAL};margin-bottom:8px">SMART SPENDING PLAZA</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:0.5rem;letter-spacing:0.18em;color:rgba(255,255,255,0.45);margin-bottom:20px">VALUE-BASED SPENDING CHALLENGE</div>
        <div style="background:rgba(26,42,74,0.4);border:1px solid rgba(26,42,74,0.8);border-radius:14px;padding:16px;margin-bottom:20px;text-align:left">
          <div style="font-family:'Orbitron',sans-serif;font-size:0.5rem;letter-spacing:0.12em;color:${TEAL};margin-bottom:10px">HOW TO PLAY</div>
          <div style="font-size:0.75rem;line-height:1.7;color:rgba(255,255,255,0.75)">
            Compare products side-by-side and pick the one with the <strong style="color:${TEAL}">best long-term value</strong> — not just the lowest price.<br><br>
            📊 <strong>True Cost</strong> = Price ÷ Lifespan (per month)<br>
            ⚡ Faster picks earn <strong>combo bonuses</strong><br>
            🤖 AI assistant gives hints
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:20px">
          <div style="background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.25);border-radius:10px;padding:8px 14px;font-size:0.68rem;color:#93c5fd">
            <span style="font-family:'Orbitron',sans-serif;font-size:0.42rem;display:block;letter-spacing:0.12em;margin-bottom:2px">LEVEL 1</span>
            Simple comparisons
          </div>
          <div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.25);border-radius:10px;padding:8px 14px;font-size:0.68rem;color:${GOLD}">
            <span style="font-family:'Orbitron',sans-serif;font-size:0.42rem;display:block;letter-spacing:0.12em;margin-bottom:2px">LEVEL 2</span>
            Sales, fees, bundles
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button id="bpStartBtn" class="bp-btn bp-btn-teal" style="font-size:0.72rem;padding:14px 32px">▶ START SHOPPING</button>
        </div>
      </div>`;
    document.getElementById('bpRoot').appendChild(overlay);
    document.getElementById('bpStartBtn').addEventListener('click', () => {
      overlay.remove();
      startRound();
    });
  }

  /* ── ROUND LOGIC ───────────────────────────────────────────────────────── */
  function startRound() {
    if (!G) return;
    if (G.roundIdx >= G.rounds.length) { endGame(calcStars()); return; }
    G.phase = 'play';
    G.choiceResult = null;
    if (!G.timerRunning) {
      G.timerRunning = true;
      G.lastTick = performance.now();
      tickTimer();
    }
    renderRound();
  }

  function renderRound() {
    if (!G) return;
    const round = G.rounds[G.roundIdx];
    const main = document.getElementById('bpMain');
    if (!main) return;
    const isL2 = round.level === 2;
    const progress = G.roundIdx + 1;
    const total = G.rounds.length;

    // Build product cards HTML
    let cardsHtml = round.products.map((p, i) => buildCard(p, i, round)).join('');

    main.innerHTML = `
      <!-- progress + level -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-family:'Orbitron',sans-serif;font-size:0.48rem;letter-spacing:0.12em;color:rgba(255,255,255,0.4)">ROUND ${progress} / ${total}</div>
        <span class="bp-level-badge bp-level-${round.level}">LEVEL ${round.level}: ${isL2 ? 'MASTER' : 'LEARN'}</span>
        <div style="display:flex;gap:3px">${Array.from({length:total},(_,i)=>`<div style="width:${Math.max(16,Math.floor(220/total))}px;height:4px;border-radius:2px;background:${i<G.roundIdx?TEAL:i===G.roundIdx?'rgba(0,229,192,0.4)':'rgba(255,255,255,0.1)'}"></div>`).join('')}</div>
      </div>
      <!-- progress bar -->
      <div style="height:3px;border-radius:2px;background:rgba(255,255,255,0.08);margin-bottom:12px;overflow:hidden">
        <div style="height:100%;width:${(G.roundIdx/total)*100}%;background:linear-gradient(90deg,${TEAL},${TEAL_DIM});transition:width 0.4s"></div>
      </div>
      <!-- AI assistant hint -->
      <div class="bp-assistant">
        <div class="bp-assistant-avatar">🤖</div>
        <div style="flex:1">
          <div style="font-family:'Orbitron',sans-serif;font-size:0.42rem;letter-spacing:0.1em;color:${TEAL};margin-bottom:3px">AI SHOPPING ASSISTANT</div>
          <div style="font-size:0.72rem;color:rgba(255,255,255,0.8)">${round.hint}</div>
        </div>
      </div>
      <!-- question -->
      <div style="font-family:'Orbitron',sans-serif;font-size:0.75rem;font-weight:700;letter-spacing:0.1em;color:#fff;text-align:center;margin:0 0 14px;line-height:1.4">${round.question}</div>
      <!-- store window deco -->
      <div style="text-align:center;margin-bottom:10px">
        <span class="bp-store-deco">🏪</span>
        <span style="font-family:'Orbitron',sans-serif;font-size:0.4rem;letter-spacing:0.15em;color:rgba(255,255,255,0.3);display:block;margin-top:4px">TAP THE BEST VALUE PRODUCT</span>
      </div>
      <!-- product cards -->
      <div id="bpCards" style="display:flex;gap:10px;align-items:stretch;flex-wrap:${round.products.length > 2 ? 'wrap' : 'nowrap'}">
        ${cardsHtml}
      </div>
      <!-- result area (hidden initially) -->
      <div id="bpResultArea" style="margin-top:14px;display:none"></div>
    `;

    // Attach click handlers to each card
    round.products.forEach((_, i) => {
      const card = document.getElementById(`bpCard_${i}`);
      if (card) {
        card.addEventListener('click', () => handlePick(i));
        card.addEventListener('touchstart', (e) => { e.preventDefault(); handlePick(i); }, { passive: false });
      }
    });
  }

  function buildCard(p, idx, round) {
    const stars = '★'.repeat(p.stars) + '☆'.repeat(5 - p.stars);
    const trueCost = computeTrueCost(p);
    const hasNote = p.note;
    return `
      <div id="bpCard_${idx}" class="bp-card" style="min-width:${round.products.length > 2 ? 'calc(50% - 5px)' : '0'};flex:${round.products.length > 2 ? '0 0 calc(50% - 5px)' : '1'}">
        <div class="bp-hologram"></div>
        <div class="bp-scanline"></div>
        ${p.badge ? `<div class="bp-badge">${p.badge}</div>` : ''}
        <div style="text-align:center;margin-bottom:12px">
          <div style="font-size:2.5rem;filter:drop-shadow(0 0 12px rgba(0,229,192,0.3));margin-bottom:6px">${p.emoji}</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:0.62rem;font-weight:700;color:#fff;line-height:1.3">${p.name}</div>
        </div>
        <!-- holo price tag -->
        <div style="background:rgba(0,229,192,0.07);border:1px solid rgba(0,229,192,0.18);border-radius:10px;padding:9px;margin-bottom:10px;text-align:center;position:relative">
          <div style="font-family:'Orbitron',sans-serif;font-size:1.25rem;font-weight:700;color:#fff;line-height:1">${fmtPrice(p.price)}</div>
          <div style="font-family:'Inter',sans-serif;font-size:0.58rem;color:rgba(255,255,255,0.45);margin-top:3px">upfront price</div>
        </div>
        <!-- attributes -->
        <div style="font-size:0.65rem;display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:rgba(255,255,255,0.55)">Lasts</span>
            <span style="color:#fff;font-weight:600">${fmtMonths(p.lifeMonths)}</span>
          </div>
          <div style="height:1px;background:rgba(255,255,255,0.06)"></div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:rgba(255,255,255,0.55)">Rating</span>
            <span class="bp-star" style="font-size:0.75rem">${stars}</span>
          </div>
          <div style="height:1px;background:rgba(255,255,255,0.06)"></div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:rgba(255,255,255,0.55)">Reviews</span>
            <span style="color:#fff;font-weight:600">${p.reviews}</span>
          </div>
          <div style="height:1px;background:rgba(255,255,255,0.06)"></div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:rgba(255,255,255,0.55)">Warranty</span>
            <span style="color:#fff;font-weight:600">${p.warranty > 0 ? fmtMonths(p.warranty) : 'None'}</span>
          </div>
          ${hasNote ? `<div style="height:1px;background:rgba(255,255,255,0.06)"></div>
          <div style="font-size:0.6rem;color:${GOLD};line-height:1.4;padding:3px 0">${p.note}</div>` : ''}
        </div>
        <!-- true cost (hidden, revealed on pick) -->
        <div id="bpTrueCost_${idx}" style="display:none;margin-top:10px;text-align:center;padding:8px;background:rgba(0,229,192,0.06);border:1px solid rgba(0,229,192,0.15);border-radius:8px">
          <div class="bp-true-cost">${fmtPrice(trueCost)}<span style="font-size:0.6rem;font-weight:400;color:rgba(255,255,255,0.5)">/mo</span></div>
          <div class="bp-per-month">TRUE COST PER MONTH</div>
        </div>
      </div>`;
  }

  function computeTrueCost(p) {
    // Special overrides for L2 products with running costs
    if (p.name === 'StreamBase Free Trial') return 19.98;
    if (p.name === 'ClearStream Annual')    return 8.00;
    if (p.name === 'FlexGym Monthly')       return 40.00;
    if (p.name === 'IronPass Annual')       return 25.00;
    if (p.name === 'PodPresso Mini')        return 24.17;
    if (p.name === 'BrewMaster 5-Cup')      return 6.50;
    // Printer bundle: true total cost / months
    if (p.name === 'Printer + Ink Bundle')  return parseFloat((80 / 12).toFixed(2));
    if (p.name === 'Printer Only')          return parseFloat((110 / 12).toFixed(2));
    // Default: price / lifeMonths
    return parseFloat((p.price / p.lifeMonths).toFixed(2));
  }

  function fmtPrice(n) {
    if (n === 0) return 'FREE';
    return '$' + (Number.isInteger(n) ? n.toFixed(2) : n.toFixed(2));
  }

  function fmtMonths(m) {
    if (m >= 12) {
      const y = m / 12;
      return Number.isInteger(y) ? `${y} yr${y > 1 ? 's' : ''}` : `${(y).toFixed(1)} yrs`;
    }
    return `${m} mo${m > 1 ? 's' : ''}`;
  }

  /* ── PICK HANDLING ─────────────────────────────────────────────────────── */
  function handlePick(chosenIdx) {
    if (!G || G.phase !== 'play') return;
    const round = G.rounds[G.roundIdx];
    const correct = chosenIdx === round.bestIdx;
    G.phase = 'result';
    G.total++;
    if (correct) {
      G.correct++;
      G.combo++;
      if (G.combo > G.bestCombo) G.bestCombo = G.combo;
      const comboBonus = Math.min(G.combo - 1, 5) * COMBO_BONUS;
      const pts = 100 + comboBonus;
      G.score += pts;
      floatText(`+${pts}`, correct ? TEAL : RED_ERR, chosenIdx);
    } else {
      G.combo = 0;
      G.score = Math.max(0, G.score - 20);
      floatText('−20', RED_ERR, chosenIdx);
    }
    updateHUD();
    showResult(chosenIdx, correct, round);
  }

  function showResult(chosenIdx, correct, round) {
    // Reveal true cost on all cards
    round.products.forEach((_, i) => {
      const tc = document.getElementById(`bpTrueCost_${i}`);
      if (tc) tc.style.display = 'block';
    });

    // Style chosen card
    const chosenCard = document.getElementById(`bpCard_${chosenIdx}`);
    const bestCard   = document.getElementById(`bpCard_${round.bestIdx}`);
    if (chosenCard) {
      chosenCard.classList.add(correct ? 'selected-correct' : 'selected-wrong');
      if (!correct) chosenCard.classList.add('bp-shake');
    }
    if (!correct && bestCard) bestCard.classList.add('best-reveal');

    // Disable all cards
    round.products.forEach((_, i) => {
      const c = document.getElementById(`bpCard_${i}`);
      if (c) { c.style.cursor = 'default'; c.style.pointerEvents = 'none'; }
    });

    // Build breakdown explanation
    const best  = round.products[round.bestIdx];
    let breakdownHtml = round.products.map((p, i) => {
      const isBest = i === round.bestIdx;
      const isChosen = i === chosenIdx;
      const tc = computeTrueCost(p);
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:8px;background:${isBest ? 'rgba(0,229,192,0.08)' : 'rgba(255,255,255,0.03)'};border:1px solid ${isBest ? 'rgba(0,229,192,0.25)' : 'rgba(255,255,255,0.07)'};margin-bottom:6px">
        <span style="font-size:0.68rem;color:rgba(255,255,255,0.75);flex:1">${p.emoji} ${p.name}</span>
        <span style="font-family:'Orbitron',sans-serif;font-size:0.72rem;font-weight:700;color:${isBest ? TEAL : '#fff'};margin-left:12px">${fmtPrice(tc)}<span style="font-size:0.48rem;font-weight:400;color:rgba(255,255,255,0.4)">/mo</span></span>
        ${isBest ? `<span style="margin-left:8px;font-size:0.65rem">✅</span>` : isChosen && !correct ? `<span style="margin-left:8px;font-size:0.65rem">❌</span>` : ''}
      </div>`;
    }).join('');

    const resultArea = document.getElementById('bpResultArea');
    if (!resultArea) return;
    resultArea.style.display = 'block';
    resultArea.innerHTML = `
      <div style="background:${correct ? 'rgba(0,229,192,0.07)' : 'rgba(248,113,113,0.07)'};border:1px solid ${correct ? 'rgba(0,229,192,0.25)' : 'rgba(248,113,113,0.25)'};border-radius:14px;padding:16px">
        <div style="text-align:center;margin-bottom:14px">
          <div style="font-size:1.8rem;margin-bottom:6px">${correct ? '✅' : '❌'}</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:0.72rem;font-weight:700;color:${correct ? TEAL : RED_ERR}">${correct ? 'GREAT VALUE CHOICE!' : 'NOT THE BEST VALUE'}</div>
          ${!correct ? `<div style="font-size:0.65rem;color:rgba(255,255,255,0.6);margin-top:4px">${best.emoji} ${best.name} was the better deal</div>` : ''}
        </div>
        <!-- true cost breakdown -->
        <div style="margin-bottom:14px">
          <div style="font-family:'Orbitron',sans-serif;font-size:0.42rem;letter-spacing:0.12em;color:rgba(255,255,255,0.4);margin-bottom:8px">TRUE COST BREAKDOWN</div>
          ${breakdownHtml}
        </div>
        <!-- insight -->
        <div style="background:rgba(26,42,74,0.35);border:1px solid rgba(26,42,74,0.7);border-radius:10px;padding:10px 12px;margin-bottom:14px">
          <div style="font-size:0.65rem;color:rgba(255,255,255,0.75);line-height:1.6">
            💡 ${generateInsight(round, correct, chosenIdx)}
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          ${G.roundIdx + 1 < G.rounds.length
            ? `<button id="bpNextBtn" class="bp-btn bp-btn-teal" style="font-size:0.62rem;padding:12px 28px">NEXT PRODUCT ▶</button>`
            : `<button id="bpNextBtn" class="bp-btn bp-btn-teal" style="font-size:0.62rem;padding:12px 28px">SEE RESULTS ▶</button>`
          }
          <button id="bpExitResultBtn" class="bp-btn bp-btn-outline" style="font-size:0.62rem;padding:12px 18px">← HUB</button>
        </div>
      </div>`;
    document.getElementById('bpNextBtn').addEventListener('click', () => { G.roundIdx++; if (G.roundIdx >= G.rounds.length) { endGame(calcStars()); } else { G.phase = 'play'; renderRound(); } });
    document.getElementById('bpExitResultBtn').addEventListener('click', window.bud_plazaExit);
    // scroll to result
    setTimeout(() => { resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
  }

  function generateInsight(round, correct, chosenIdx) {
    const best    = round.products[round.bestIdx];
    const bestTC  = computeTrueCost(best);
    const worst   = round.products.reduce((a, b) => computeTrueCost(a) > computeTrueCost(b) ? a : b);
    const worstTC = computeTrueCost(worst);
    const savings = (worstTC - bestTC).toFixed(2);
    if (round.level === 2 && round.products.find(p => p.name.includes('Free Trial'))) {
      return `That "free" trial becomes $19.98/mo after the first month — nearly $240/year. The annual plan at $8/mo saves you $143/year!`;
    }
    if (round.level === 2 && round.products.find(p => p.name.includes('PodPresso'))) {
      return `The pod machine looks cheap upfront, but pod costs add $270+/year. The BrewMaster saves you over $200/year in ongoing costs.`;
    }
    if (round.level === 2 && round.products.find(p => p.name.includes('Printer + Ink Bundle'))) {
      return `The bundle includes ink worth $50 extra — buying printer-only means spending $110 total. The bundle saves you $30!`;
    }
    if (correct) {
      return `Correct! ${best.emoji} ${best.name} costs ${fmtPrice(bestTC)}/month — saving you ${fmtPrice(parseFloat(savings))}/month vs the cheapest option. Smart shoppers always calculate true cost!`;
    } else {
      return `${best.emoji} ${best.name} at ${fmtPrice(bestTC)}/month beats the cheaper sticker price. You'd save ${fmtPrice(parseFloat(savings))}/month with the better choice. Always calculate true cost!`;
    }
  }

  /* ── TIMER ─────────────────────────────────────────────────────────────── */
  function tickTimer() {
    if (!G || !G.timerRunning) return;
    const now = performance.now();
    const dt  = (now - G.lastTick) / 1000;
    G.lastTick = now;
    if (G.phase === 'play') {
      G.timeLeft = Math.max(0, G.timeLeft - dt);
    }
    updateHUD();
    if (G.timeLeft <= 0) {
      G.timerRunning = false;
      endGame(calcStars());
      return;
    }
    G.rafId = requestAnimationFrame(tickTimer);
  }

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  function updateHUD() {
    const scoreEl = document.getElementById('bpScore');
    const timerEl = document.getElementById('bpTimer');
    const comboEl = document.getElementById('bpComboEl');
    const streakEl = document.getElementById('bpStreakEl');
    const timerChip = document.getElementById('bpTimerChip');
    if (scoreEl) scoreEl.textContent = G.score;
    if (timerEl) {
      const t = Math.ceil(G.timeLeft);
      timerEl.textContent = t + 's';
      timerEl.style.color = t <= 10 ? RED_ERR : GOLD;
      if (timerChip) timerChip.style.borderColor = t <= 10 ? 'rgba(248,113,113,0.5)' : 'rgba(26,42,74,0.8)';
    }
    if (comboEl) {
      comboEl.textContent = `COMBO ×${G.combo}`;
      comboEl.style.color = G.combo >= 3 ? TEAL : G.combo >= 1 ? GOLD : 'rgba(255,255,255,0.3)';
      if (G.combo >= 2) { comboEl.classList.remove('bp-combo-badge'); void comboEl.offsetWidth; comboEl.classList.add('bp-combo-badge'); }
    }
    if (streakEl) {
      streakEl.textContent = G.combo >= 5 ? '🔥🔥🔥' : G.combo >= 3 ? '🔥🔥' : G.combo >= 2 ? '🔥' : '';
    }
  }

  /* ── FLOAT TEXT ────────────────────────────────────────────────────────── */
  function floatText(text, color, cardIdx) {
    const layer = document.getElementById('bpFloatLayer');
    if (!layer) return;
    const card = document.getElementById(`bpCard_${cardIdx}`);
    let x = 50, y = 40;
    if (card) {
      const r = card.getBoundingClientRect();
      const root = document.getElementById('bpRoot').getBoundingClientRect();
      x = ((r.left + r.width / 2 - root.left) / root.width) * 100;
      y = ((r.top - root.top) / root.height) * 100;
    }
    const el = document.createElement('div');
    el.className = 'bp-float-text';
    el.style.cssText = `left:${x}%;top:${y}%;color:${color};transform:translateX(-50%)`;
    el.textContent = text;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  /* ── STAR CALCULATION ──────────────────────────────────────────────────── */
  function calcStars() {
    if (G.score >= STAR3_SCORE) return 3;
    if (G.score >= STAR2_SCORE) return 2;
    if (G.score >= STAR1_SCORE) return 1;
    return 1;
  }

  /* ── END GAME ──────────────────────────────────────────────────────────── */
  function endGame(stars) {
    if (!G) return;
    G.timerRunning = false;
    G.phase = 'gameover';
    cancelAnimationFrame(G.rafId);

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bud_plaza', { level: 1, stars, badge: 'Value Hunter', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    // feed shared Budgetron Budget Meter — value score above/below par spend
    if (window.budgetDelta) budgetDelta(G.score - 250);

    const accuracy = G.total > 0 ? Math.round((G.correct / G.total) * 100) : 0;
    const starsHtml = [1, 2, 3].map(i => `<span style="font-size:2rem;${i <= stars ? `color:${GOLD};filter:drop-shadow(0 0 12px rgba(251,191,36,0.7))` : 'color:rgba(255,255,255,0.15)'}">${i <= stars ? '⭐' : '★'}</span>`).join('');

    const root = document.getElementById('bpRoot');
    const overlay = document.createElement('div');
    overlay.className = 'bp-overlay';
    overlay.style.position = 'absolute';
    overlay.innerHTML = `
      <div style="text-align:center;max-width:440px;width:100%">
        <!-- store banner -->
        <div style="font-family:'Orbitron',sans-serif;font-size:0.5rem;letter-spacing:0.2em;color:rgba(255,255,255,0.35);margin-bottom:10px">SMART SPENDING PLAZA — RESULTS</div>
        <!-- stars -->
        <div style="margin-bottom:16px;display:flex;gap:8px;justify-content:center">${starsHtml}</div>
        <!-- score card -->
        <div style="background:rgba(26,42,74,0.4);border:1px solid rgba(26,42,74,0.8);border-radius:16px;padding:20px;margin-bottom:18px">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
            <div style="text-align:center">
              <div style="font-family:'Orbitron',sans-serif;font-size:0.4rem;letter-spacing:0.1em;color:rgba(255,255,255,0.4);margin-bottom:4px">VALUE SCORE</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:1.4rem;font-weight:700;color:${TEAL}">${G.score}</div>
            </div>
            <div style="text-align:center;border-left:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07)">
              <div style="font-family:'Orbitron',sans-serif;font-size:0.4rem;letter-spacing:0.1em;color:rgba(255,255,255,0.4);margin-bottom:4px">ACCURACY</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:1.4rem;font-weight:700;color:${GOLD}">${accuracy}%</div>
            </div>
            <div style="text-align:center">
              <div style="font-family:'Orbitron',sans-serif;font-size:0.4rem;letter-spacing:0.1em;color:rgba(255,255,255,0.4);margin-bottom:4px">BEST COMBO</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:1.4rem;font-weight:700;color:#a78bfa">×${G.bestCombo}</div>
            </div>
          </div>
          <!-- coins earned -->
          <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:center;gap:10px">
            <span style="font-size:1.4rem">🪙</span>
            <div>
              <div style="font-family:'Orbitron',sans-serif;font-size:0.42rem;letter-spacing:0.1em;color:rgba(255,255,255,0.45)">COINS EARNED</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;color:${GOLD}">+${coins}</div>
            </div>
          </div>
        </div>
        <!-- lesson -->
        <div style="background:rgba(0,229,192,0.06);border:1px solid rgba(0,229,192,0.18);border-radius:14px;padding:16px;margin-bottom:20px;text-align:left">
          <div style="font-family:'Orbitron',sans-serif;font-size:0.45rem;letter-spacing:0.14em;color:${TEAL};margin-bottom:10px">💡 END LESSON</div>
          <div style="font-size:0.73rem;line-height:1.7;color:rgba(255,255,255,0.82)">
            <strong style="color:#fff">"Price is what you pay; value is what you get."</strong><br><br>
            A higher upfront cost that lasts years is almost always cheaper than a low-price item you replace every few months. Always calculate the <strong style="color:${TEAL}">true cost per month</strong> before you buy.
          </div>
        </div>
        <!-- star thresholds -->
        <div style="display:flex;gap:6px;justify-content:center;margin-bottom:20px">
          <div style="font-size:0.6rem;color:rgba(255,255,255,0.4);display:flex;align-items:center;gap:4px">
            <span style="color:${GOLD}">⭐⭐⭐</span> ${STAR3_SCORE}+
          </div>
          <div style="color:rgba(255,255,255,0.2)">·</div>
          <div style="font-size:0.6rem;color:rgba(255,255,255,0.4);display:flex;align-items:center;gap:4px">
            <span style="color:${GOLD}">⭐⭐</span> ${STAR2_SCORE}+
          </div>
          <div style="color:rgba(255,255,255,0.2)">·</div>
          <div style="font-size:0.6rem;color:rgba(255,255,255,0.4);display:flex;align-items:center;gap:4px">
            <span style="color:${GOLD}">⭐</span> any score
          </div>
        </div>
        <!-- buttons -->
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button id="bpPlayAgain" class="bp-btn bp-btn-teal" style="font-size:0.68rem;padding:14px 28px">🔄 PLAY AGAIN</button>
          <button id="bpHub" class="bp-btn bp-btn-outline" style="font-size:0.68rem;padding:14px 22px">← HUB</button>
        </div>
      </div>`;
    root.appendChild(overlay);
    document.getElementById('bpPlayAgain').addEventListener('click', () => {
      overlay.remove();
      G = freshState();
      G.phase = 'play';
      const main = document.getElementById('bpMain');
      if (main) main.innerHTML = '';
      startRound();
    });
    document.getElementById('bpHub').addEventListener('click', window.bud_plazaExit);
  }

  /* ── EXIT ──────────────────────────────────────────────────────────────── */
  window.bud_plazaExit = function () {
    if (G) { G.timerRunning = false; cancelAnimationFrame(G.rafId); G = null; }
    if (window.state) state.viewingWorld = WORLD_ID;
    goTo('hub');
  };

})();
