/* ════════════════════════════════════════════════════════════════
   STOCK SURGE v2 — Multi-stock HTML card trading game
   13 Coincept stocks · BUY/SELL/HOLD · Surge Moment · News · Moods
   7 levels · Financial literacy gates · Mobile-first touch UI
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── constants ───────────────────────────────────────────────── */
  const START_CASH   = 1000;
  const TICK_MS      = 2000;   // price tick every 2 seconds
  const GATE_EVERY   = 20000;  // knowledge gate every ~20s
  const SURGE_CHANCE = 0.15;   // 15% chance per round of a Surge Moment

  /* ── stock catalogue ─────────────────────────────────────────── */
  const STOCKS = [
    { ticker:'CEG',  name:'Coincept Education Group',    sector:'Education',     risk:'Steady',  base:10 },
    { ticker:'CGS',  name:'Coincept Gaming Studios',     sector:'Gaming',        risk:'Bouncy',  base:10 },
    { ticker:'CTL',  name:'Coincept Technology Labs',    sector:'Technology',    risk:'Wild',    base:10 },
    { ticker:'CEC',  name:'Coincept Entertainment Co',   sector:'Entertainment', risk:'Bouncy',  base:10 },
    { ticker:'CAC',  name:'Coincept Apparel Collective', sector:'Apparel',       risk:'Steady',  base:10 },
    { ticker:'CCC',  name:'Coincept Cosmetics & Care',   sector:'Cosmetics',     risk:'Bouncy',  base:10 },
    { ticker:'CVW',  name:'Coincept VR Worlds',          sector:'VR',            risk:'Wild',    base:10 },
    { ticker:'CAI',  name:'Coincept AI Systems',         sector:'AI',            risk:'Wild',    base:10 },
    { ticker:'CFT',  name:'Coincept Financial Tools',    sector:'FinTech',       risk:'Steady',  base:10 },
    { ticker:'CCCX', name:'Coincept Crypto Concepts',    sector:'Crypto',        risk:'Wild',    base:10 },
    { ticker:'CGP',  name:'Coincept Global Partners',    sector:'Partnerships',  risk:'Steady',  base:10 },
    { ticker:'CIV',  name:'Coincept Innovation Ventures',sector:'Innovation',    risk:'Wild',    base:10 },
    { ticker:'CHL',  name:'Coincept Home & Living',      sector:'Housing',       risk:'Bouncy',  base:10, unlockLevel:5 },
  ];

  // Risk volatility ranges (percent per tick)
  const RISK_RANGE = {
    Steady: { lo:1, hi:3,  surgeMult:1.2 },
    Bouncy: { lo:3, hi:7,  surgeMult:1.5 },
    Wild:   { lo:5, hi:20, surgeMult:2.0 },
  };

  const PRICE_MIN = 2, PRICE_MAX = 50;

  /* ── level definitions ───────────────────────────────────────── */
  const LEVELS = [
    // GDD Sec 10: Lv1 = CEG+CGS only ("Welcome to Exchange — what stocks are + buying & selling")
    // Win: end round with more than starting cash (target = START_CASH + $100 profit)
    { level:1, tickers:['CEG','CGS'],                                                      target:1100, time:75, hasSurge:false, hasPortView:false, hasLabels:false, hasNews:false, multiRound:1,
      winCondition:'profit', winLabel:'End with +$100 profit' },
    // GDD Sec 10: Lv2 = +CTL +CEC ("Timing Is Everything — buy low, sell high"); Surge introduced
    // Win: make 1 profitable sell
    { level:2, tickers:['CEG','CGS','CTL','CEC'],                                          target:2000, time:75, hasSurge:true,  hasPortView:false, hasLabels:false, hasNews:false, multiRound:1,
      winCondition:'profitSell', winLabel:'Make 1 profitable sell' },
    // GDD Sec 10: Lv3 = 5 stocks; Portfolio view unlocked; Win = own 3+ different stocks
    { level:3, tickers:['CEG','CGS','CTL','CEC','CAC'],                                    target:2500, time:75, hasSurge:true,  hasPortView:true,  hasLabels:false, hasNews:false, multiRound:1,
      diversify:3, winCondition:'diversify', winLabel:'Own 3+ different stocks' },
    // GDD Sec 10: Lv4 = +CCC; Risk labels shown; Win = own 1 Steady + 1 Wild stock
    { level:4, tickers:['CEG','CGS','CTL','CEC','CAC','CCC'],                              target:3000, time:75, hasSurge:true,  hasPortView:true,  hasLabels:true,  hasNews:false, multiRound:1,
      winCondition:'steadyAndWild', winLabel:'Own 1 Steady + 1 Wild stock' },
    // GDD Sec 10: Lv5 = full 13-stock access (incl CHL); News/mood introduced
    // Win: respond correctly to 2 news events
    { level:5, tickers:['CEG','CGS','CTL','CEC','CAC','CCC','CVW','CAI','CFT','CCCX','CGP','CIV','CHL'], target:4000, time:90, hasSurge:true, hasPortView:true, hasLabels:true, hasNews:true,  multiRound:1,
      winCondition:'newsResponse', winLabel:'Respond correctly to 2 news events' },
    // GDD Sec 10: Lv6 = multi-round (3 Pulses); Win: hold through a dip and finish positive
    { level:6, tickers:['CEG','CGS','CTL','CEC','CAC','CCC','CVW','CAI','CFT','CCCX','CGP','CIV','CHL'], target:5000, time:75, hasSurge:true, hasPortView:true, hasLabels:true, hasNews:true,  multiRound:3 },
    // GDD Sec 10: Lv7 = Trader League; Leaderboards, daily missions, streak bonuses
    { level:7, tickers:['CEG','CGS','CTL','CEC','CAC','CCC','CVW','CAI','CFT','CCCX','CGP','CIV','CHL'], target:6000, time:90, hasSurge:true, hasPortView:true, hasLabels:true, hasNews:true,  multiRound:1, traderLeague:true },
  ];

  /* ── news events ─────────────────────────────────────────────── */
  const NEWS_POS = [
    { text:'New game release tops charts!',   ticker:'CGS'  },
    { text:'School partnership expands!',     ticker:'CEG'  },
    { text:'AI patent approved!',             ticker:'CAI'  },
    { text:'VR headset sales record!',        ticker:'CVW'  },
    { text:'Fashion collab goes viral!',      ticker:'CAC'  },
    { text:'FinTech award winner!',           ticker:'CFT'  },
    { text:'Crypto adoption surges!',         ticker:'CCCX' },
    { text:'Innovation grant awarded!',       ticker:'CIV'  },
    { text:'Entertainment deal signed!',      ticker:'CEC'  },
    { text:'Housing boom continues!',         ticker:'CHL'  },
  ];
  const NEWS_NEG = [
    { text:'Buggy update frustrates users',   ticker:'CGS'  },
    { text:'Slow enrollment season',          ticker:'CEG'  },
    { text:'AI regulation concern',           ticker:'CAI'  },
    { text:'VR launch delayed',              ticker:'CVW'  },
    { text:'Supply chain issues',             ticker:'CAC'  },
    { text:'Data breach reported',            ticker:'CFT'  },
    { text:'Crypto market dip',              ticker:'CCCX' },
    { text:'Funding round fails',             ticker:'CIV'  },
    { text:'Production costs soar',           ticker:'CEC'  },
    { text:'Interest rates hurt housing',     ticker:'CHL'  },
  ];
  const NEWS_VOL = [
    { text:'Mystery acquisition rumor!',      ticker:'CTL'  },
    { text:'Influencer mentions brand',       ticker:'CCC'  },
    { text:'Surprise earnings report',        ticker:'CGP'  },
    { text:'Analyst upgrades/downgrades',     ticker:null   }, // any
    { text:'Market-wide volatility spike',    ticker:'ALL'  }, // all
    { text:'Insider trading investigation',   ticker:null   },
    { text:'Product launch hype',             ticker:null   },
    { text:'Competitor enters market',        ticker:null   },
    { text:'Government contract rumor',       ticker:'CFT'  },
    { text:'Viral social media moment',       ticker:'CCC'  },
  ];

  /* ── financial literacy facts ────────────────────────────────── */
  const FACTS = [
    { icon:'💡', title:'Buy Low, Sell High', body:'The core of investing: buy shares when prices are low, sell when they rise. Patience is key.' },
    { icon:'🧺', title:'Diversification',    body:'Spread your money across different stocks. If one drops, others can cushion the loss.' },
    { icon:'⚖️', title:'Risk vs Reward',     body:'Higher risk stocks can win big — or crash hard. Steady stocks grow slowly but safely.' },
    { icon:'📰', title:'News Moves Prices',  body:'Good news lifts stocks; bad news drops them. Real investors read before they trade.' },
    { icon:'⏳', title:'Patience Pays',      body:'Panic-selling locks in losses. Often the best move is HOLD and wait for recovery.' },
    { icon:'📈', title:'Portfolio Value',    body:'Your portfolio = cash + (shares × price). Track both — not just the stock price.' },
    { icon:'💸', title:'Realized vs Unrealized', body:'Profit is only REALIZED when you sell. Paper gains disappear if you hold too long.' },
  ];

  /* ── state ───────────────────────────────────────────────────── */
  let S = null;
  let _tickInterval   = null;
  let _gateTimeout    = null;
  let _surgeTimeout   = null;
  let _countdownInt   = null;
  let _newsTimeout    = null;
  let _surgeCdInt     = null;

  window.ssInit = function () { S = null; };

  /* ══════════════════════════════════════════════════════════════
     SCREEN — returns HTML string
  ══════════════════════════════════════════════════════════════ */
  window.SCREENS.game_stocksurge = function () {
    if (!S) initGame(1);
    setTimeout(ssMount, 30);
    return buildShell();
  };

  /* ── build initial HTML shell ────────────────────────────────── */
  function buildShell() {
    return `
<style>
  #ss-root { position:absolute;inset:0;background:linear-gradient(160deg,#071a10 0%,#031409 55%,#020d07 100%);overflow:hidden;font-family:'Inter',sans-serif;color:#fff;display:flex;flex-direction:column; }
  .ss-topbar { display:flex;align-items:center;gap:8px;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(3,20,9,.95) 0%,transparent 100%);flex-shrink:0;flex-wrap:wrap; }
  .ss-back-btn { padding:6px 12px;border:1px solid rgba(16,185,129,.4);border-radius:8px;background:rgba(16,185,129,.1);color:#6ee7b7;font-size:.6rem;letter-spacing:.1em;cursor:pointer;font-family:'Orbitron',sans-serif;white-space:nowrap; }
  .ss-help-btn { padding:6px 9px;border:1px solid rgba(16,185,129,.4);border-radius:8px;background:rgba(16,185,129,.1);color:#6ee7b7;font-size:.62rem;cursor:pointer;font-family:'Orbitron',sans-serif;flex-shrink:0; }
  .ss-title { font-family:'Orbitron',sans-serif;font-size:.65rem;letter-spacing:.2em;color:#34d399;flex:1;text-align:center; }
  .ss-timer { font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fbbf24;min-width:42px;text-align:right; }
  .ss-hud { display:flex;gap:6px;padding:0 12px 8px;flex-shrink:0; }
  .ss-hud-box { flex:1;text-align:center;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.18);border-radius:10px;padding:5px 4px; }
  .ss-hud-label { font-size:.42rem;letter-spacing:.1em;color:rgba(255,255,255,.45);font-family:'Orbitron',sans-serif;text-transform:uppercase; }
  .ss-hud-val { font-size:.95rem;font-weight:900;color:#fff;font-family:'Anton',sans-serif;line-height:1.2; }
  .ss-stocks { flex:1;overflow-y:auto;padding:0 10px 8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px;align-content:center;justify-content:center; }
  .ss-stocks::-webkit-scrollbar { width:3px; }
  .ss-stocks::-webkit-scrollbar-thumb { background:rgba(16,185,129,.3);border-radius:3px; }
  .ss-card { border-radius:13px;border:1.5px solid rgba(16,185,129,.2);background:rgba(7,31,13,.7);padding:10px;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .1s;-webkit-tap-highlight-color:transparent;position:relative;overflow:hidden; }
  .ss-card.selected { border-color:#34d399;box-shadow:0 0 18px rgba(52,211,153,.45);transform:scale(1.03); }
  .ss-card.surge-glow { animation:ssGlowPulse .6s ease-in-out infinite alternate; }
  @keyframes ssGlowPulse { 0%{box-shadow:0 0 12px rgba(251,191,36,.4)} 100%{box-shadow:0 0 28px rgba(251,191,36,.9),0 0 50px rgba(251,191,36,.3)} }
  .ss-card-top { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px; }
  .ss-ticker { font-family:'Orbitron',sans-serif;font-size:.7rem;font-weight:900;letter-spacing:.08em;color:#6ee7b7; }
  .ss-risk-badge { font-size:.38rem;letter-spacing:.08em;padding:2px 5px;border-radius:5px;font-family:'Orbitron',sans-serif;font-weight:700;text-transform:uppercase;flex-shrink:0; }
  .ss-risk-S { background:rgba(16,185,129,.2);color:#34d399; }
  .ss-risk-B { background:rgba(251,191,36,.2);color:#fbbf24; }
  .ss-risk-W { background:rgba(239,68,68,.2);color:#f87171; }
  .ss-card-name { font-size:.52rem;color:rgba(255,255,255,.6);margin-bottom:5px;line-height:1.3; }
  .ss-price-row { display:flex;align-items:center;justify-content:space-between; }
  .ss-price { font-family:'Anton',sans-serif;font-size:1.15rem;line-height:1; }
  .ss-up { color:#34d399; } .ss-down { color:#f87171; } .ss-flat { color:#9ca3af; }
  .ss-arrow { font-size:.85rem; }
  .ss-mood { font-size:.42rem;letter-spacing:.08em;font-family:'Orbitron',sans-serif;margin-top:3px; }
  .ss-mood-calm { color:#9ca3af; } .ss-mood-hype { color:#34d399; } .ss-mood-panic { color:#f87171; }
  .ss-shares-owned { font-size:.42rem;color:rgba(255,255,255,.45);margin-top:3px; }
  .ss-actions { display:flex;gap:6px;padding:8px 10px;flex-shrink:0;background:rgba(3,20,9,.8);border-top:1px solid rgba(16,185,129,.12); }
  .ss-qty-row { display:flex;align-items:center;gap:6px;padding:0 10px 6px;flex-shrink:0; }
  .ss-qty-label { font-size:.5rem;letter-spacing:.1em;color:rgba(255,255,255,.5);font-family:'Orbitron',sans-serif; }
  .ss-qty-btn { width:28px;height:28px;border-radius:7px;border:1px solid rgba(16,185,129,.3);background:rgba(16,185,129,.1);color:#6ee7b7;font-size:.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;font-weight:700;flex-shrink:0; }
  .ss-qty-val { font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fff;min-width:22px;text-align:center; }
  .ss-cost-info { font-size:.45rem;color:rgba(255,255,255,.45);font-family:'Orbitron',sans-serif;flex:1;text-align:right; }
  .ss-action-btn { flex:1;padding:12px 4px;border-radius:12px;border:none;font-family:'Orbitron',sans-serif;font-size:.62rem;font-weight:900;letter-spacing:.08em;cursor:pointer;transition:transform .08s;-webkit-tap-highlight-color:transparent; }
  .ss-action-btn:active { transform:scale(.93); }
  .ss-btn-buy  { background:linear-gradient(135deg,#34d399,#059669);color:#031409; }
  .ss-btn-sell { background:linear-gradient(135deg,#fcd34d,#d97706);color:#0a0700; }
  .ss-btn-hold { background:rgba(16,185,129,.12);color:#6ee7b7;border:1px solid rgba(16,185,129,.3)!important; }
  /* overlays */
  .ss-overlay { position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;background:rgba(2,10,5,.88);backdrop-filter:blur(6px);padding:20px; }
  .ss-panel { max-width:420px;width:100%;text-align:center;padding:28px 22px;border-radius:20px;background:linear-gradient(160deg,rgba(7,31,13,.98),rgba(3,16,8,.98)); }
  @keyframes ssPanelIn { 0%{transform:scale(.9);opacity:0} 100%{transform:scale(1);opacity:1} }
  .ss-panel { animation:ssPanelIn .3s ease; }
  /* Distinct celebratory entrance for a WIN specifically — overshoots past 1x then
     settles, plus a bright glow ring pulse, so hitting the mission reads as a bigger
     moment than the routine Knowledge Gate / Help panels sharing .ss-panel above. */
  @keyframes ssWinPop {
    0%   { transform:scale(.7)  rotate(-2deg); opacity:0; box-shadow:0 0 0 rgba(251,191,36,0); }
    45%  { transform:scale(1.12) rotate(1deg); opacity:1; box-shadow:0 0 70px rgba(251,191,36,.65); }
    70%  { transform:scale(.96) rotate(-.5deg); box-shadow:0 0 55px rgba(251,191,36,.5); }
    100% { transform:scale(1)   rotate(0deg);  box-shadow:0 0 60px rgba(16,185,129,.4); }
  }
  .ss-panel-win { animation:ssWinPop .55s cubic-bezier(.34,1.56,.64,1) both; }
  .ss-surge-overlay { position:absolute;inset:0;z-index:8;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(251,191,36,.08);backdrop-filter:blur(2px);pointer-events:none; }
  .ss-surge-box { text-align:center;padding:18px 28px;border-radius:16px;border:2px solid #fbbf24;background:rgba(2,10,5,.92);box-shadow:0 0 40px rgba(251,191,36,.5); }
  @keyframes ssSurgeIn { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  .ss-surge-box { animation:ssSurgeIn .4s ease; }
  .ss-news-banner { position:absolute;top:0;left:0;right:0;z-index:7;display:flex;align-items:center;gap:10px;padding:8px 14px;pointer-events:none; }
  @keyframes ssBannerIn { 0%{transform:translateY(-100%);opacity:0} 100%{transform:translateY(0);opacity:1} }
  .ss-news-banner { animation:ssBannerIn .35s ease; }
  .ss-toast { position:absolute;bottom:130px;left:50%;transform:translateX(-50%);z-index:9;pointer-events:none;white-space:nowrap; }
  @keyframes ssToastUp { 0%{opacity:0;transform:translateX(-50%) translateY(10px)} 20%{opacity:1;transform:translateX(-50%) translateY(0)} 80%{opacity:1} 100%{opacity:0;transform:translateX(-50%) translateY(-20px)} }
  .ss-toast { animation:ssToastUp 2s ease forwards; }
</style>
<div id="ss-root">
  <canvas id="ss-bg-canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.6"></canvas>
  <div class="ss-topbar">
    <button class="ss-back-btn" onclick="ssExit()">← HUB</button>
    <div class="ss-title" id="ss-title">📊 STOCK SURGE</div>
    <button class="ss-help-btn" onclick="ssShowHelp()" title="How to play">❓</button>
    <div class="ss-timer" id="ss-timer">75s</div>
  </div>

  <div class="ss-hud">
    <div class="ss-hud-box">
      <div class="ss-hud-label">CASH</div>
      <div class="ss-hud-val" id="ss-cash">$1,000</div>
    </div>
    <div class="ss-hud-box">
      <div class="ss-hud-label">PORTFOLIO</div>
      <div class="ss-hud-val" id="ss-port">$1,000</div>
    </div>
    <div class="ss-hud-box">
      <div class="ss-hud-label">GAIN / LOSS</div>
      <div class="ss-hud-val" id="ss-gain">+$0</div>
    </div>
    <div class="ss-hud-box">
      <div class="ss-hud-label">TARGET</div>
      <div class="ss-hud-val" id="ss-target">$1,500</div>
    </div>
  </div>

  <!-- stock cards grid -->
  <div class="ss-stocks" id="ss-stocks"></div>

  <!-- qty row -->
  <div class="ss-qty-row">
    <div class="ss-qty-label">QTY</div>
    <button class="ss-qty-btn" onclick="ssQty(-1)">−</button>
    <div class="ss-qty-val" id="ss-qty">1</div>
    <button class="ss-qty-btn" onclick="ssQty(1)">+</button>
    <div class="ss-cost-info" id="ss-cost-info">Select a stock</div>
  </div>

  <!-- action buttons -->
  <div class="ss-actions">
    <button class="ss-action-btn ss-btn-buy"  onclick="ssAct('buy')">BUY</button>
    <button class="ss-action-btn ss-btn-sell" onclick="ssAct('sell')">SELL</button>
    <button class="ss-action-btn ss-btn-hold" onclick="ssAct('hold')">HOLD</button>
  </div>

  <!-- overlays (hidden by default) -->
  <div class="ss-overlay" id="ss-gate" style="display:none"></div>
  <div class="ss-overlay" id="ss-over"  style="display:none"></div>
  <div class="ss-overlay" id="ss-info"  style="display:none"></div>
  <div class="ss-overlay" id="ss-help"  style="display:none"></div>
</div>`;
  }

  /* ══════════════════════════════════════════════════════════════
     GAME INIT
  ══════════════════════════════════════════════════════════════ */
  function initGame(levelNum) {
    stopTimers();
    const lv = LEVELS[Math.min(levelNum - 1, LEVELS.length - 1)];

    // Build active stocks list for this level
    const activeStocks = STOCKS.filter(function (st) {
      return lv.tickers.indexOf(st.ticker) !== -1;
    }).map(function (st) {
      return {
        ticker:   st.ticker,
        name:     st.name,
        sector:   st.sector,
        risk:     st.risk,
        price:    st.base,
        prev:     st.base,
        history:  [st.base, st.base, st.base], // last 3 ticks for mood
        shares:   0,
        surge:    false,
        newsBoost:0,  // ticks remaining with news bias
        newsDrift:0,
      };
    });

    S = {
      phase:       'play',
      level:       levelNum,
      lv:          lv,
      round:       1,
      timeLeft:    lv.time * 1000,   // ms
      lastTick:    Date.now(),
      cash:        START_CASH,
      startCash:   START_CASH,
      stocks:      activeStocks,
      selected:    null,   // ticker string
      qty:         1,
      trades:      0,
      gateIdx:     0,
      surgeActive: false,
      surgeCountdown: 0,
      surgeTickers: [],
      newsVisible: false,
      newsText:    '',
      newsType:    'pos',
      // Win-condition trackers (GDD Sec 10)
      profitSells:       0,     // Lv2: count of sells where price > buy price
      newsCorrectTrades: 0,     // Lv5: trades made in correct direction after a news event
      lastBuyPrice:      {},    // ticker -> avg buy price for profit-sell detection
      lastNewsType:      null,  // 'pos'|'neg'|'vol' — current active news bias
      lastNewsTicker:    null,  // ticker affected by current news
      profitStreak:      0,     // cosmetic-only: consecutive profitable sells, resets on a losing sell
    };
  }

  /* ══════════════════════════════════════════════════════════════
     MOUNT — wires up live game after HTML is in the DOM
  ══════════════════════════════════════════════════════════════ */
  function ssMount() {
    if (!S) return;
    renderCards();
    syncHUD();
    syncTitle();
    var q = document.getElementById('ss-qty'); if (q) q.textContent = S.qty;   // DOM persists across restarts
    startTimers();
    ssInitCanvas();
    // HOW TO PLAY — auto-shown once per session, before the player's very first round.
    // Fires AFTER startTimers() so the pause path below is identical to the mid-game
    // ❓ reopen (ssShowHelp), instead of a second "don't start timers yet" code path.
    if (!window._ssTutorialShown) {
      window._ssTutorialShown = true;
      ssShowHelp();
    }
  }

  /* ── HOW-TO-PLAY overlay — shown once automatically before the first round,
     reopened anytime via the ❓ button without losing the run. Pausing reuses
     the same stopTimers()/startTimers() pair as the Knowledge Gate (both are
     resume-safe per their own comments), so surge/news/gate timers never
     double-fire on resume. ── */
  window.ssShowHelp = function () {
    if (!S || S.phase === 'over') return;
    var wasPlaying = S.phase === 'play';
    if (wasPlaying) { S.phase = 'paused'; stopTimers(); clearSurge(); }
    var el = document.getElementById('ss-help');
    if (!el) return;
    el.style.display = 'flex';
    el.innerHTML = '<div class="ss-panel" style="border:1px solid #34d399;box-shadow:0 0 50px rgba(16,185,129,.4)">' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.48rem;letter-spacing:.18em;color:#6ee7b7;margin-bottom:10px">HOW TO PLAY</div>' +
      '<div style="font-size:2.2rem;margin-bottom:8px">📊</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.85rem;font-weight:900;color:#34d399;text-shadow:0 0 20px rgba(52,211,153,.5);margin-bottom:14px">STOCK SURGE</div>' +
      '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:13px 15px;margin-bottom:18px;text-align:left">' +
        '<div style="display:flex;flex-direction:column;gap:9px">' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">🎯</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">Grow your cash by picking stocks, then <b style="color:#34d399">BUY</b> low and <b style="color:#fbbf24">SELL</b> high to hit each level\'s mission.</span></div>' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">👆</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">Tap a stock card to select it, set QTY, then tap BUY, SELL, or HOLD to wait it out.</span></div>' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">⚡</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">Watch for SURGE MOMENTS and NEWS banners — they swing prices fast. React quickly!</span></div>' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">⛩</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">Knowledge Gates pop up with quick investing facts — read them for bonus coins.</span></div>' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">🏆</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">7 levels total — each one adds new stocks and a new mission. Complete the mission to advance.</span></div>' +
        '</div>' +
      '</div>' +
      '<button onclick="ssCloseHelp()" style="padding:13px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#34d399,#059669);color:#031409;font-family:\'Orbitron\',sans-serif;font-size:.68rem;letter-spacing:.1em;font-weight:900;cursor:pointer">' + (wasPlaying ? '▶ RESUME' : 'GOT IT — START ▶') + '</button>' +
    '</div>';
  };

  window.ssCloseHelp = function () {
    var el = document.getElementById('ss-help');
    if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    if (S && S.phase === 'paused') {
      S.phase = 'play';
      startTimers();   // resume-safe (see startTimers()/scheduleGate() comments) — re-arms gate/news/countdown fresh
    }
  };

  /* ── Live canvas sparklines background ───────────────────────── */
  var _ssBgRaf = null;
  var _ssBgParts = [];
  var _ssBgCleanup = null;
  function ssInitCanvas() {
    var cv = document.getElementById('ss-bg-canvas');
    if (!cv) return;
    if (_ssBgCleanup) _ssBgCleanup();   // restart/next-level reuse the DOM — kill the old loop first
    var ctx = cv.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    function resize() {
      cv.width  = cv.clientWidth  * dpr;
      cv.height = cv.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    _ssBgCleanup = function () {
      cancelAnimationFrame(_ssBgRaf); _ssBgRaf = null; _ssBgParts = [];
      window.removeEventListener('resize', resize);
    };

    function drawBg(t) {
      if (!S || !document.getElementById('ss-bg-canvas')) return;
      _ssBgRaf = requestAnimationFrame(drawBg);
      var W = cv.clientWidth, H = cv.clientHeight;
      ctx.clearRect(0, 0, W, H);

      // animated grid
      var gs = 48, off = (t * 0.015) % gs;
      ctx.strokeStyle = 'rgba(16,185,129,.05)';
      ctx.lineWidth = 1;
      for (var gx = -off; gx < W; gx += gs) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
      for (var gy = 0; gy < H; gy += gs) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

      // sparklines — one panel per stock
      var stocks = S ? S.stocks.filter(function(s){ return s.history && s.history.length >= 2; }) : [];
      if (stocks.length) {
        var cols = Math.ceil(Math.sqrt(stocks.length));
        var rows = Math.ceil(stocks.length / cols);
        stocks.forEach(function(st, i) {
          var pts = st.history.slice(-24);
          if (pts.length < 2) return;
          var col = i % cols, row = Math.floor(i / cols);
          var pw = W / cols, ph = H / rows;
          var px = col * pw, py = row * ph;
          var lo = Math.min.apply(null, pts), hi = Math.max.apply(null, pts);
          var rng = hi - lo || 0.001;
          var isUp = pts[pts.length-1] >= pts[0];
          var lc = isUp ? 'rgba(52,211,153,' : 'rgba(248,113,113,';

          // gradient fill
          var grad = ctx.createLinearGradient(0, py, 0, py + ph);
          grad.addColorStop(0, isUp ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.1)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.beginPath();
          for (var j = 0; j < pts.length; j++) {
            var lx = px + (j / (pts.length - 1)) * pw;
            var ly = py + ph - ((pts[j] - lo) / rng) * ph * 0.72 - ph * 0.12;
            if (j === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly);
          }
          var endX = px + pw, endY = py + ph;
          ctx.lineTo(endX, endY); ctx.lineTo(px, endY); ctx.closePath();
          ctx.fillStyle = grad; ctx.fill();

          // line stroke
          ctx.beginPath();
          for (var k = 0; k < pts.length; k++) {
            var lx2 = px + (k / (pts.length - 1)) * pw;
            var ly2 = py + ph - ((pts[k] - lo) / rng) * ph * 0.72 - ph * 0.12;
            if (k === 0) ctx.moveTo(lx2, ly2); else ctx.lineTo(lx2, ly2);
          }
          ctx.strokeStyle = lc + '.55)'; ctx.lineWidth = 1.5; ctx.stroke();

          // ticker ghost label
          ctx.fillStyle = lc + '.25)';
          ctx.font = "700 8px 'Orbitron',monospace";
          ctx.textAlign = 'left';
          ctx.fillText(st.ticker, px + 5, py + 13);
        });
      }

      // float particles
      for (var pi = _ssBgParts.length - 1; pi >= 0; pi--) {
        var p = _ssBgParts[pi];
        p.x += p.vx; p.y += p.vy; p.vy += 0.018; p.life -= 0.018;
        if (p.life <= 0) { _ssBgParts.splice(pi, 1); continue; }
        ctx.globalAlpha = p.life * 0.85;
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    _ssBgRaf = requestAnimationFrame(drawBg);

    // expose burst for buy/sell. `streak` (cosmetic only, default 0) scales particle
    // count/speed/size so a deeper profit streak visibly pops harder — capped at 5
    // so depth never overwhelms the canvas.
    window._ssBurst = function(x, y, up, streak) {
      var c = up ? '#34d399' : '#f87171';
      var depth = Math.max(0, Math.min(5, streak || 0));
      var count = 10 + depth * 3;              // 10 → 25 particles
      var speedB = 1 + depth * 0.15;            // subtle extra kick per streak level
      var W2 = cv.clientWidth, H2 = cv.clientHeight;
      for (var i = 0; i < count; i++) {
        _ssBgParts.push({ x: x*W2, y: y*H2, vx:(Math.random()-.5)*4*speedB, vy:(-Math.random()*3-1)*speedB, r:(Math.random()*2.5+1)*(1+depth*0.08), c:c, life:1 });
      }
    };

    // cleanup when exiting — wrap ssExit ONCE (re-wrapping would chain dead closures)
    if (!window._ssExitWrapped) {
      window._ssExitWrapped = true;
      var _origExit = window.ssExit;
      window.ssExit = function() {
        if (_ssBgCleanup) { _ssBgCleanup(); _ssBgCleanup = null; }
        if (_origExit) _origExit();
      };
    }
  }

  /* ── helpers ─────────────────────────────────────────────────── */
  function fmt(n) { return '$' + Math.round(Math.abs(n)).toLocaleString(); }
  function fmtSigned(n) { return (n >= 0 ? '+' : '-') + fmt(n); }
  // Level-6 rounds carry the portfolio over, so the target must escalate per round
  function curTarget() {
    if (!S) return 0;
    var t = S.lv.target || 0;
    return (S.lv.multiRound > 1) ? Math.round(t * (1 + 0.35 * (S.round - 1))) : t;
  }
  function portfolioValue() {
    return S.stocks.reduce(function (sum, st) { return sum + st.shares * st.price; }, 0);
  }
  function totalValue() { return S.cash + portfolioValue(); }
  function getStock(ticker) {
    for (var i = 0; i < S.stocks.length; i++) {
      if (S.stocks[i].ticker === ticker) return S.stocks[i];
    }
    return null;
  }
  function riskLabel(risk) {
    return risk === 'Steady' ? 'S' : risk === 'Bouncy' ? 'B' : 'W';
  }
  // Normalized [0,1] position of a stock's card, for feedback bursts that should
  // originate AT the card the player acted on rather than a fixed screen point.
  function cardBurstPos(ticker) {
    var card = document.getElementById('ss-card-' + ticker);
    var root = document.getElementById('ss-root');
    if (!card || !root) return { x: 0.5, y: 0.75 };
    var cr = card.getBoundingClientRect(), rr = root.getBoundingClientRect();
    var w = rr.width || 1, h = rr.height || 1;
    return {
      x: Math.max(0, Math.min(1, (cr.left + cr.width / 2 - rr.left) / w)),
      y: Math.max(0, Math.min(1, (cr.top + cr.height / 2 - rr.top) / h))
    };
  }
  function moodOf(st) {
    var h = st.history;
    if (h.length < 2) return 'Calm';
    var recent = h[h.length - 1] - h[Math.max(0, h.length - 3)];
    if (recent > 0.15) return 'Hype';
    if (recent < -0.15) return 'Panic';
    return 'Calm';
  }
  function stopTimers() {
    if (_tickInterval)   { clearInterval(_tickInterval);  _tickInterval   = null; }
    if (_gateTimeout)    { clearTimeout(_gateTimeout);    _gateTimeout    = null; }
    if (_surgeTimeout)   { clearTimeout(_surgeTimeout);   _surgeTimeout   = null; }
    if (_countdownInt)   { clearInterval(_countdownInt);  _countdownInt   = null; }
    if (_newsTimeout)    { clearTimeout(_newsTimeout);     _newsTimeout    = null; }
    if (_surgeCdInt)     { clearInterval(_surgeCdInt);    _surgeCdInt     = null; }
  }
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ══════════════════════════════════════════════════════════════
     TIMERS
  ══════════════════════════════════════════════════════════════ */
  function startTimers() {
    stopTimers();   // resume-safe: never stack intervals

    // Price tick every 2s
    _tickInterval = setInterval(tickPrices, TICK_MS);

    // Knowledge gate every ~20s
    scheduleGate();

    // Surge moment — roll once per round (not re-rolled on every gate resume)
    if (S.lv.hasSurge && !S.surgeRolled) {
      S.surgeRolled = true;
      if (Math.random() < SURGE_CHANCE) {
        // trigger between 15s and (roundTime - 20s) into the round
        var minDelay = 15000;
        var maxDelay = Math.max(16000, S.lv.time * 1000 - 20000);
        var delay    = rand(minDelay, maxDelay);
        _surgeTimeout = setTimeout(triggerSurge, delay);
      }
    }

    // News events — only level 5+
    if (S.lv.hasNews) {
      scheduleNews();
    }

    // Main countdown loop
    _countdownInt = setInterval(tickTimer, 500);
  }

  function scheduleGate() {
    _gateTimeout = setTimeout(function () {
      if (S && S.phase === 'play') openGate();
    }, GATE_EVERY + Math.random() * 4000);
  }

  function scheduleNews() {
    var delay = rand(8000, 16000);
    _newsTimeout = setTimeout(function () {
      if (!S || S.phase !== 'play') return;
      fireNewsEvent();
      scheduleNews(); // chain
    }, delay);
  }

  /* ── countdown ───────────────────────────────────────────────── */
  function tickTimer() {
    if (!S || S.phase !== 'play') return;
    S.timeLeft -= 500;
    var el = document.getElementById('ss-timer');
    if (el) {
      var secs = Math.max(0, Math.ceil(S.timeLeft / 1000));
      el.textContent = secs + 's';
      el.style.color = secs <= 10 ? '#f87171' : '#fbbf24';
    }
    if (S.timeLeft <= 0) endRound();
  }

  /* ── price ticks ─────────────────────────────────────────────── */
  function tickPrices() {
    if (!S || S.phase !== 'play') return;

    S.stocks.forEach(function (st) {
      st.prev = st.price;
      var r = RISK_RANGE[st.risk];

      // base random swing
      var pct = rand(r.lo, r.hi);
      if (Math.random() < 0.5) pct = -pct;

      // Surge boost
      if (st.surge) pct *= r.surgeMult;

      // News bias
      if (st.newsBoost > 0) {
        pct += st.newsDrift;
        st.newsBoost--;
      }

      // GDD Sec 8.3 / Table C: Hard 25% max-loss cap per round.
      // If portfolio is already at/below the floor, bias prices upward so player can't lose more.
      var tv = totalValue();
      var floorValue = S.startCash * 0.75; // 25% loss cap
      if (tv <= floorValue) {
        // Force upward movement — lift by at least enough to stop further losses
        pct = Math.abs(pct) + 2; // always positive (upward) when at cap floor
      }

      var next = st.price * (1 + pct / 100);
      st.price = Math.max(PRICE_MIN, Math.min(PRICE_MAX, Math.round(next * 100) / 100));

      // track history for mood
      st.history.push(st.price);
      if (st.history.length > 6) st.history.shift();
    });

    // news effect fully decayed on every stock → close the Lv5 response window
    if (S.lastNewsType && !S.stocks.some(function (s2) { return s2.newsBoost > 0; })) {
      S.lastNewsType = null; S.lastNewsTicker = null;
    }

    renderCards();
    syncHUD();

    // Check win conditions (GDD Sec 10 per-level conditions + fallback target check)
    if (checkWinCondition()) return endRound(true);
  }

  /* ══════════════════════════════════════════════════════════════
     SURGE MOMENT
  ══════════════════════════════════════════════════════════════ */
  function triggerSurge() {
    if (!S || S.phase !== 'play') return;
    S.surgeActive = true;
    S.surgeCountdown = 4;

    // Pick 1-2 stocks to surge
    var pool = S.stocks.slice();
    var count = Math.min(2, pool.length);
    S.surgeTickers = [];
    for (var i = 0; i < count; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      S.surgeTickers.push(pool[idx].ticker);
      pool[idx].surge = true;
      pool.splice(idx, 1);
    }

    showSurgeOverlay();
    renderCards(); // flash glow immediately

    // countdown
    // GDD Sec 8.2: Surge duration = 3–5s. Countdown from 4 then end immediately.
    var cd = 4;
    _surgeCdInt = setInterval(function () {
      cd--;
      var cdEl = document.getElementById('ss-surge-cd');
      if (cdEl) cdEl.textContent = cd;
      if (cd <= 0) {
        clearInterval(_surgeCdInt);
        _surgeCdInt = null;
        // End surge after 1 more second (total ~5s window, matching GDD 3–5s)
        setTimeout(function () {
          if (!S) return;
          S.stocks.forEach(function (st) { st.surge = false; });
          S.surgeActive = false;
          S.surgeTickers = [];
          hideSurgeOverlay();
          renderCards();
        }, 1000);
      }
    }, 1000);
  }

  function showSurgeOverlay() {
    // inject surge banner into ss-root
    var root = document.getElementById('ss-root');
    if (!root || document.getElementById('ss-surge')) return;
    var div = document.createElement('div');
    div.id = 'ss-surge';
    div.className = 'ss-surge-overlay';
    div.innerHTML = '<div class="ss-surge-box">' +
      '<div style="font-size:1.8rem;margin-bottom:4px">⚡</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.65rem;letter-spacing:.18em;color:#fbbf24;font-weight:900">SURGE MOMENT!</div>' +
      '<div style="font-size:.55rem;color:rgba(255,255,255,.7);margin:4px 0 8px;font-family:\'Inter\',sans-serif">Prices moving fast — act quickly!</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:2rem;color:#fbbf24;font-weight:900" id="ss-surge-cd">4</div>' +
      '</div>';
    root.appendChild(div);
    // auto-remove overlay after 5s
    setTimeout(function () {
      var el = document.getElementById('ss-surge');
      if (el) el.remove();
    }, 5000);
  }

  function hideSurgeOverlay() {
    var el = document.getElementById('ss-surge');
    if (el) el.remove();
  }

  // Fully unwind a surge — the countdown interval dies with stopTimers(), so any
  // gate/round-end during the window would otherwise leave surge multipliers on forever.
  function clearSurge() {
    if (_surgeCdInt) { clearInterval(_surgeCdInt); _surgeCdInt = null; }
    if (S) { S.stocks.forEach(function (st) { st.surge = false; }); S.surgeActive = false; S.surgeTickers = []; }
    hideSurgeOverlay();
  }

  /* ══════════════════════════════════════════════════════════════
     NEWS EVENTS
  ══════════════════════════════════════════════════════════════ */
  function fireNewsEvent() {
    var r = Math.random();
    var ev, type;
    if (r < 0.35) {
      ev   = pick(NEWS_POS);
      type = 'pos';
    } else if (r < 0.70) {
      ev   = pick(NEWS_NEG);
      type = 'neg';
    } else {
      ev   = pick(NEWS_VOL);
      type = 'vol';
    }

    var affectedTickers = [];
    if (ev.ticker === 'ALL') {
      affectedTickers = S.stocks.map(function (st) { return st.ticker; });
    } else if (ev.ticker === null) {
      // any random active stock
      affectedTickers = [pick(S.stocks).ticker];
    } else {
      var st = getStock(ev.ticker);
      if (st) affectedTickers = [ev.ticker];
      else affectedTickers = [pick(S.stocks).ticker];
    }

    // Store active news context for win-condition tracking (Lv5)
    S.lastNewsType   = type;
    S.lastNewsTicker = ev.ticker; // 'ALL', null, or specific ticker
    S.newsEventCredited = false;  // each news event can credit ONE correct response

    // Apply drift to affected stocks (GDD Table D: pos/neg +10%, neutral +20% volatility)
    affectedTickers.forEach(function (ticker) {
      var st = getStock(ticker);
      if (!st) return;
      if (type === 'pos') {
        st.newsDrift  = rand(10, 20);   // +10..+20% boost this tick
        st.newsBoost  = 3;
      } else if (type === 'neg') {
        st.newsDrift  = -rand(10, 20);
        st.newsBoost  = 3;
      } else {
        // Neutral/volatile: +20% volatility swing (GDD Table D)
        st.newsDrift  = (Math.random() < 0.5 ? 1 : -1) * rand(10, 20);
        st.newsBoost  = 2;
      }
    });

    showNewsBanner(ev.text, type, affectedTickers);
  }

  function showNewsBanner(text, type, tickers) {
    var root = document.getElementById('ss-root');
    if (!root) return;

    var old = document.getElementById('ss-news');
    if (old) old.remove();

    var color = type === 'pos' ? '#34d399' : type === 'neg' ? '#f87171' : '#fbbf24';
    var icon  = type === 'pos' ? '📈' : type === 'neg' ? '📉' : '⚡';

    var div = document.createElement('div');
    div.id = 'ss-news';
    div.className = 'ss-news-banner';
    div.style.cssText = 'position:absolute;top:0;left:0;right:0;z-index:7;display:flex;align-items:center;gap:10px;padding:8px 14px;background:linear-gradient(90deg,rgba(3,20,9,.97),rgba(7,31,13,.95));border-bottom:1.5px solid ' + color + ';box-shadow:0 4px 20px ' + color + '44;pointer-events:none;animation:ssBannerIn .35s ease;';
    div.innerHTML = '<span style="font-size:1.1rem">' + icon + '</span>' +
      '<div style="flex:1">' +
        '<div style="font-family:\'Orbitron\',sans-serif;font-size:.55rem;font-weight:900;letter-spacing:.1em;color:' + color + '">' + text + '</div>' +
        '<div style="font-size:.45rem;color:rgba(255,255,255,.5);font-family:\'Inter\',sans-serif">Affects: ' + tickers.join(', ') + '</div>' +
      '</div>' +
      '<div style="font-size:.45rem;color:rgba(255,255,255,.35);font-family:\'Orbitron\',sans-serif;letter-spacing:.08em">NEWS</div>';
    root.appendChild(div);

    setTimeout(function () {
      if (div.parentNode) {
        div.style.animation = 'ssBannerIn .3s ease reverse';
        setTimeout(function () { if (div.parentNode) div.remove(); }, 300);
      }
    }, 4000);
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER CARDS
  ══════════════════════════════════════════════════════════════ */
  function renderCards() {
    var container = document.getElementById('ss-stocks');
    if (!container || !S) return;

    var html = '';
    S.stocks.forEach(function (st) {
      var up    = st.price >= st.prev;
      var flat  = st.price === st.prev;
      var dir   = flat ? 'flat' : up ? 'up' : 'down';
      var mood  = moodOf(st);
      var moodClass = mood === 'Hype' ? 'ss-mood-hype' : mood === 'Panic' ? 'ss-mood-panic' : 'ss-mood-calm';
      var moodIcon  = mood === 'Hype' ? '🔥 HYPE' : mood === 'Panic' ? '😱 PANIC' : '😌 CALM';
      var isSel  = S.selected === st.ticker;
      var isSurge = S.surgeTickers.indexOf(st.ticker) !== -1;
      var rl     = riskLabel(st.risk);
      var arrow  = flat ? '→' : up ? '▲' : '▼';
      var change = st.prev > 0 ? ((st.price - st.prev) / st.prev * 100).toFixed(1) : '0.0';
      var changeTxt = (up ? '+' : '') + change + '%';

      html += '<div class="ss-card' + (isSel ? ' selected' : '') + (isSurge ? ' surge-glow' : '') + '"' +
        ' onclick="ssSelect(\'' + st.ticker + '\')"' +
        ' id="ss-card-' + st.ticker + '">' +
        '<div class="ss-card-top">' +
          '<div class="ss-ticker">' + st.ticker + '</div>' +
          (S.lv.hasLabels
            ? '<div class="ss-risk-badge ss-risk-' + rl + '">' + st.risk + '</div>'
            : '') +
        '</div>' +
        '<div class="ss-card-name">' + st.name + '</div>' +
        '<div class="ss-price-row">' +
          '<div class="ss-price ss-' + dir + '">$' + st.price.toFixed(2) + '</div>' +
          '<div class="ss-arrow ss-' + dir + '">' + arrow + ' <span style="font-size:.5rem">' + changeTxt + '</span></div>' +
        '</div>' +
        '<div class="ss-mood ' + moodClass + '">' + moodIcon + '</div>' +
        (st.shares > 0 ? '<div class="ss-shares-owned">You own: ' + st.shares + ' shares</div>' : '') +
      '</div>';
    });

    container.innerHTML = html;
    updateCostInfo();
  }

  /* ══════════════════════════════════════════════════════════════
     HUD SYNC
  ══════════════════════════════════════════════════════════════ */
  function syncHUD() {
    if (!S) return;
    var tv   = totalValue();
    var gain = tv - S.startCash;
    var txt  = document.getElementById('ss-cash');
    if (txt) txt.textContent = fmt(S.cash);
    var pe = document.getElementById('ss-port');
    if (pe) { pe.textContent = fmt(tv); pe.style.color = tv >= curTarget() ? '#fbbf24' : '#fff'; }
    var ge = document.getElementById('ss-gain');
    if (ge) { ge.textContent = fmtSigned(gain); ge.style.color = gain >= 0 ? '#34d399' : '#f87171'; }
    var te = document.getElementById('ss-target');
    if (te) {
      // Show win-condition label for levels with special conditions (GDD Sec 10)
      if (S.lv.winLabel && S.lv.winCondition !== 'profit' && S.lv.winCondition !== 'profitSell') {
        te.textContent = S.lv.winLabel;
      } else if (S.lv.winCondition === 'profitSell') {
        te.textContent = 'Profit Sell!';
      } else {
        te.textContent = fmt(curTarget());
      }
    }
  }

  function syncTitle() {
    var el = document.getElementById('ss-title');
    if (el) el.textContent = '📊 STOCK SURGE — LV' + S.level + (S.lv.traderLeague ? ' 🏆 TRADER LEAGUE' : '');
  }

  /* ══════════════════════════════════════════════════════════════
     PLAYER ACTIONS
  ══════════════════════════════════════════════════════════════ */
  window.ssSelect = function (ticker) {
    if (!S || S.phase !== 'play') return;
    S.selected = (S.selected === ticker) ? null : ticker;
    renderCards();
    updateCostInfo();
  };

  window.ssQty = function (delta) {
    if (!S) return;
    S.qty = Math.max(1, Math.min(10, S.qty + delta));
    var el = document.getElementById('ss-qty');
    if (el) el.textContent = S.qty;
    updateCostInfo();
  };

  function updateCostInfo() {
    var el = document.getElementById('ss-cost-info');
    if (!el || !S) return;
    if (!S.selected) { el.textContent = 'Select a stock'; return; }
    var st = getStock(S.selected);
    if (!st) { el.textContent = 'Select a stock'; return; }
    var cost = st.price * S.qty;
    el.textContent = 'Cost: ' + fmt(cost) + ' · Own: ' + st.shares;
  }

  window.ssAct = function (action) {
    if (!S || S.phase !== 'play') return;
    if (action === 'hold') { showToast('HOLD — watching the market', '#9ca3af'); return; }
    if (!S.selected) { showToast('Select a stock first!', '#fbbf24'); return; }
    var st = getStock(S.selected);
    if (!st) return;

    if (action === 'buy') {
      var cost = st.price * S.qty;
      if (cost > S.cash) { showToast('Not enough cash!', '#f87171'); return; }
      S.cash -= cost;
      // Track avg buy price per ticker for profit-sell detection (Lv2 win condition)
      var prevShares  = st.shares;
      var prevAvg     = S.lastBuyPrice[st.ticker] || st.price;
      var newTotal    = prevShares + S.qty;
      S.lastBuyPrice[st.ticker] = newTotal > 0
        ? (prevAvg * prevShares + st.price * S.qty) / newTotal
        : st.price;
      st.shares += S.qty;
      S.trades++;
      // Lv5 news-response tracking: buying a stock whose active news is positive = correct
      if (S.lv.winCondition === 'newsResponse' && S.lastNewsType === 'pos' && !S.newsEventCredited &&
          (S.lastNewsTicker === st.ticker || S.lastNewsTicker === 'ALL')) {
        S.newsEventCredited = true;
        S.newsCorrectTrades++;
      }
      showToast('Bought ' + S.qty + ' ' + st.ticker + ' @ $' + st.price.toFixed(2), '#34d399');
      if (window._ssBurst) { var bp = cardBurstPos(st.ticker); _ssBurst(bp.x, bp.y, true); }
    } else if (action === 'sell') {
      if (st.shares < S.qty) { showToast('Not enough shares!', '#f87171'); return; }
      var proceeds = st.price * S.qty;
      var avgBuy   = S.lastBuyPrice[st.ticker] || 0;
      var sellProfitable = avgBuy > 0 && st.price > avgBuy;
      S.cash += proceeds;
      st.shares -= S.qty;
      if (st.shares === 0) delete S.lastBuyPrice[st.ticker];
      S.trades++;
      // Lv2: count profitable sells (GDD Sec 10 Lv2 win = "make 1 profitable sell")
      if (sellProfitable) S.profitSells++;
      // Cosmetic-only streak: consecutive profitable sells escalate the sell toast's
      // punch (size/glow/exclamation) — never touches score, coins, or win conditions.
      S.profitStreak = sellProfitable ? (S.profitStreak + 1) : 0;
      // Lv5 news-response tracking: selling a stock whose active news is negative = correct
      if (S.lv.winCondition === 'newsResponse' && S.lastNewsType === 'neg' && !S.newsEventCredited &&
          (S.lastNewsTicker === st.ticker || S.lastNewsTicker === 'ALL')) {
        S.newsEventCredited = true;
        S.newsCorrectTrades++;
      }
      // GDD Appendix A lesson: "Selling after a rise locks in profit!" vs panic sell
      var lesson = sellProfitable
        ? '💡 Selling after a rise locks in profit!'
        : '📰 Selling in a dip locks in losses. Patience!';
      if (window._ssBurst) {
        var bp2 = cardBurstPos(st.ticker);
        _ssBurst(bp2.x, bp2.y, sellProfitable, sellProfitable ? S.profitStreak : 0);
      }
      var streakTag = sellProfitable && S.profitStreak >= 2 ? ' 🔥x' + S.profitStreak : '';
      showToast('Sold ' + S.qty + ' ' + st.ticker + ' → +' + fmt(proceeds) + streakTag, '#fbbf24', sellProfitable ? S.profitStreak : 0);
      setTimeout(function () { showToast(lesson, '#6ee7b7'); }, 2100);
    }

    syncHUD();
    renderCards();

    // Check win after trade (GDD Sec 10 per-level win conditions)
    if (checkWinCondition()) endRound(true);
  };

  /* ══════════════════════════════════════════════════════════════
     WIN CONDITION (GDD Section 10 per-level conditions)
  ══════════════════════════════════════════════════════════════ */
  function checkWinCondition() {
    if (!S) return false;
    var tv  = totalValue();
    var wc  = S.lv.winCondition;

    // Lv1: end with any profit above start (target = START_CASH + $100)
    if (wc === 'profit') return tv >= S.lv.target;

    // Lv2: make 1 profitable sell (sell higher than you bought)
    if (wc === 'profitSell') return S.profitSells >= 1;

    // Lv3: own at least 3 different stocks (and hit value target)
    if (wc === 'diversify') {
      var uniqueOwned = S.stocks.filter(function (st) { return st.shares > 0; }).length;
      return uniqueOwned >= 3 && tv >= S.lv.target;
    }

    // Lv4: own 1 Steady + 1 Wild stock (and hit value target)
    if (wc === 'steadyAndWild') {
      var hasSteady = S.stocks.some(function (st) { return st.shares > 0 && st.risk === 'Steady'; });
      var hasWild   = S.stocks.some(function (st) { return st.shares > 0 && st.risk === 'Wild'; });
      return hasSteady && hasWild && tv >= S.lv.target;
    }

    // Lv5: respond correctly to 2 news events
    if (wc === 'newsResponse') return S.newsCorrectTrades >= 2 && tv >= S.lv.target;

    // Default / Lv6-7: reach target portfolio value (escalates per round on Lv6)
    return tv >= curTarget();
  }

  /* ══════════════════════════════════════════════════════════════
     KNOWLEDGE GATE
  ══════════════════════════════════════════════════════════════ */
  function openGate() {
    if (!S || S.phase !== 'play') return;
    S.phase = 'gate';
    stopTimers(); // pause everything
    clearSurge(); // a paused surge could never end otherwise

    var f   = FACTS[S.gateIdx % FACTS.length];
    S.gateIdx++;

    var el = document.getElementById('ss-gate');
    if (!el) { S.phase = 'play'; startTimers(); return; }

    el.style.display = 'flex';
    el.innerHTML = '<div class="ss-panel" style="border:1px solid #34d399;box-shadow:0 0 50px rgba(16,185,129,.4)">' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.48rem;letter-spacing:.18em;color:#6ee7b7;margin-bottom:10px">⛩ KNOWLEDGE GATE</div>' +
      '<div style="font-size:2.2rem;margin-bottom:8px">' + f.icon + '</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.72rem;font-weight:900;color:#fff;margin-bottom:10px">' + f.title + '</div>' +
      '<p style="font-size:.82rem;line-height:1.55;color:rgba(255,255,255,.85);margin:0 0 18px">' + f.body + '</p>' +
      '<button onclick="ssGateClose()" style="padding:12px 28px;border:none;border-radius:12px;background:linear-gradient(135deg,#34d399,#059669);color:#031409;font-family:\'Orbitron\',sans-serif;font-size:.68rem;letter-spacing:.1em;font-weight:900;cursor:pointer">GOT IT! +10 🪙 →</button>' +
    '</div>';
  }

  window.ssGateClose = function () {
    if (!S) return;
    // reward real coins, NOT game cash — game cash would count toward the profit target
    if (window.state) { state.coins = (state.coins || 0) + 10; if (window.cvSave) cvSave(); }
    S.phase = 'play';
    var el = document.getElementById('ss-gate');
    if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    syncHUD();
    startTimers(); // resume (startTimers already calls scheduleGate internally)
  };

  /* ══════════════════════════════════════════════════════════════
     END ROUND / GAME OVER
  ══════════════════════════════════════════════════════════════ */
  function endRound(won) {
    if (!S || S.phase === 'over') return;
    S.phase = 'over';
    stopTimers();
    clearSurge();

    var tv     = totalValue();
    var profit = tv - S.startCash;
    var won2   = won || checkWinCondition();   // timeout must respect the level's mission too

    // Multi-round progression (Level 6)
    if (won2 && S.lv.multiRound > 1 && S.round < S.lv.multiRound) {
      S.round++;
      S.phase = 'play';
      S.surgeRolled = false;              // each round gets its own surge roll
      // carry over cash & portfolio, reset timer; target escalates via curTarget()
      S.timeLeft = S.lv.time * 1000;
      startTimers();
      syncHUD();
      showToast('Round ' + S.round + ' — new target ' + fmt(curTarget()) + '!', '#fbbf24');
      return;
    }

    // Coins reward — win-gated + routed through cvAwardGame (records stars/level/badge)
    var reward = 0;
    if (window.state) {
      if (won2 && window.cvAwardGame) {
        var stars = profit >= 2 * Math.max(1, curTarget() - S.startCash) ? 3 : 2;
        // Pass the REAL level reached (1-7) so permanent progress (state.gameLevels) isn't
        // capped at 3 — cvAwardGame's own coin formula already treats lv>=3 as one flat tier.
        reward = cvAwardGame('game_stocksurge', { level: S.level, stars: stars, badge: 'Market Mogul', is3star: stars === 3, isPerfect: stars === 3, isFlagship: true });
      } else {
        reward = profit > 0 ? 40 : 20;    // small consolation, no farming value
        state.coins = (state.coins || 0) + reward;
        if (window.cvAddXP) cvAddXP(Math.round(reward / 4), 0);
        else if (window.cvSave) cvSave();
      }
    }

    // Diversification check (Level 3)
    var uniqueOwned = S.stocks.filter(function (st) { return st.shares > 0; }).length;
    var diversifyMsg = '';
    if (S.lv.diversify && uniqueOwned < S.lv.diversify) {
      diversifyMsg = '<div style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:10px;padding:10px;margin-bottom:14px;font-size:.6rem;color:#fbbf24;font-family:\'Orbitron\',sans-serif;letter-spacing:.05em">💡 TIP: Own 3+ different stocks to diversify risk!</div>';
    }

    // GDD Appendix A + Sec 10: per-level lesson text tied to the concept taught
    var LEVEL_LESSONS = {
      1: { win: '💡 You turned your cash into profit — that\'s what investing is all about!',
           loss: '📉 Stocks go up AND down. Try buying when the price is lower next time.' },
      2: { win: '💡 Selling after a rise locks in profit — that\'s the buy-low, sell-high rule!',
           loss: '📉 Buying after a big spike can be risky. Watch for the right moment.' },
      3: { win: '🧺 Spreading across multiple stocks cushioned your portfolio — diversification works!',
           loss: '🧺 Owning just one stock is risky. Spread your money next time!' },
      4: { win: '⚖️ Great mix of Steady and Wild! Risk vs reward is the investor\'s core skill.',
           loss: '⚖️ Wild stocks can drop fast. Balance them with Steady stocks next round.' },
      5: { win: '📰 You read the news and acted — good investors do exactly that!',
           loss: '📰 News moves prices. Watch for good and bad news bubbles and react quickly.' },
      6: { win: '⏳ Patience paid off! Holding through dips is a real investor move.',
           loss: '⏳ Selling in a dip locks in losses. Sometimes the best move is to hold.' },
      7: { win: '🏆 Trader League material! Consistency and long-term strategy win every time.',
           loss: '🏆 Great investors think long-term. Smart choices over time grow investments.' },
    };
    var lvLessons = LEVEL_LESSONS[Math.min(S.level, 7)] || LEVEL_LESSONS[7];
    var lesson = won2 ? lvLessons.win : (profit >= 0 ? lvLessons.win : lvLessons.loss);

    var el = document.getElementById('ss-over');
    if (!el) return;
    el.style.display = 'flex';
    el.innerHTML = '<div class="ss-panel' + (won2 ? ' ss-panel-win' : '') + '" style="border:1px solid ' + (won2 ? '#fbbf24' : '#10b981') + ';box-shadow:0 0 60px rgba(16,185,129,.4)">' +
      '<div style="font-size:2.6rem;margin-bottom:8px">' + (won2 ? '🏆' : profit >= 0 ? '📈' : '📉') + '</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.55rem;letter-spacing:.18em;color:' + (won2 ? '#fbbf24' : '#34d399') + ';margin-bottom:8px">' + (won2 ? 'TARGET REACHED!' : profit >= 0 ? 'PROFITABLE RUN' : 'MARKET CLOSED') + '</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.42rem;letter-spacing:.14em;color:rgba(255,255,255,.5);margin-bottom:6px">INVESTMENT ACCOUNT SUMMARY</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;text-align:left">' +
        summaryRow('STARTING VALUE', fmt(S.startCash)) +
        summaryRow('ENDING VALUE',   fmt(tv)) +
        summaryRow('PROFIT / LOSS',  fmtSigned(profit), profit >= 0 ? '#34d399' : '#f87171') +
        summaryRow('TRADES MADE',    S.trades) +
        summaryRow('MISSION', S.lv.winLabel || ('Reach ' + fmt(S.lv.target))) +
        summaryRow('LEVEL', 'LV' + S.level) +
        summaryRow('REWARD', '+' + reward + ' 🪙', '#fbbf24') +
      '</div>' +
      diversifyMsg +
      '<p style="font-size:.65rem;line-height:1.5;color:rgba(255,255,255,.7);margin:0 0 16px;padding:10px;background:rgba(52,211,153,.07);border-radius:8px;border-left:3px solid #34d399">' + lesson + '</p>' +
      (won2 && S.level < 7
        ? '<button onclick="ssNextLevel()" style="padding:11px 20px;margin:3px;border:none;border-radius:12px;background:linear-gradient(135deg,#fbbf24,#d97706);color:#0a0700;font-family:\'Orbitron\',sans-serif;font-size:.62rem;letter-spacing:.1em;font-weight:900;cursor:pointer">▶ NEXT LEVEL</button>'
        : '') +
      '<button onclick="ssRestart()" style="padding:11px 20px;margin:3px;border:none;border-radius:12px;background:linear-gradient(135deg,#34d399,#059669);color:#031409;font-family:\'Orbitron\',sans-serif;font-size:.62rem;letter-spacing:.1em;font-weight:900;cursor:pointer">↺ PLAY AGAIN</button>' +
      '<button onclick="ssExit()" style="padding:11px 20px;margin:3px;border:1px solid rgba(255,255,255,.2);border-radius:12px;background:rgba(255,255,255,.06);color:#fff;font-family:\'Orbitron\',sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer">← HUB</button>' +
    '</div>';
  }

  function summaryRow(label, val, color) {
    return '<div style="background:rgba(16,185,129,.07);border-radius:7px;padding:6px 8px">' +
      '<div style="font-size:.38rem;letter-spacing:.08em;color:rgba(255,255,255,.4);font-family:\'Orbitron\',sans-serif">' + label + '</div>' +
      '<div style="font-size:.82rem;font-weight:900;color:' + (color || '#fff') + ';font-family:\'Anton\',sans-serif">' + val + '</div>' +
    '</div>';
  }

  /* ══════════════════════════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════════════════════════ */
  function showToast(text, color, streak) {
    var root = document.getElementById('ss-root');
    if (!root) return;
    var old = root.querySelector('.ss-toast');
    if (old) old.remove();
    // Reward escalation (cosmetic only): deeper profit streaks get a slightly bigger,
    // brighter-glowing toast. Caps at streak 5 so it never runs away visually.
    // NOTE: the outer .ss-toast element's `transform` is driven entirely by the
    // ssToastUp keyframes (translateX/translateY) — any scale set inline on it would
    // be clobbered the instant the animation starts. So the scale is applied to an
    // INNER wrapper span instead, which the keyframes never touch.
    var depth    = Math.max(0, Math.min(5, streak || 0));
    var scale    = 1 + depth * 0.06;          // 1.00 → 1.30 at depth 5
    var glowSize = 18 + depth * 6;             // 18px → 48px
    var glowA    = 0.35 + depth * 0.09;        // 0.35 → 0.80
    var div = document.createElement('div');
    div.className = 'ss-toast';
    div.style.cssText = 'position:absolute;bottom:130px;left:50%;pointer-events:none;white-space:nowrap;z-index:9;';
    div.innerHTML = '<span style="display:inline-block;transform:scale(' + scale + ');font-family:\'Inter\',sans-serif;font-weight:800;font-size:.78rem;color:' + (color || '#34d399') + ';background:rgba(2,10,5,.9);padding:8px 16px;border-radius:20px;border:1px solid ' + (color || '#34d399') + (depth >= 2 ? 'cc' : '44') + ';box-shadow:0 4px ' + glowSize + 'px rgba(251,191,36,' + glowA + ');">' + text + '</span>';
    root.appendChild(div);
    setTimeout(function () { if (div.parentNode) div.remove(); }, 2100);
  }

  /* ══════════════════════════════════════════════════════════════
     GLOBAL CONTROLS
  ══════════════════════════════════════════════════════════════ */
  window.ssRestart = function () {
    stopTimers();
    hideOverlays();
    initGame(S ? S.level : 1);
    ssMount();
  };

  window.ssNextLevel = function () {
    stopTimers();
    hideOverlays();
    var next = S ? Math.min(S.level + 1, 7) : 1;
    initGame(next);
    ssMount();
  };

  window.ssExit = function () {
    stopTimers();
    S = null;
    if (window.state) state.viewingWorld = state._returnHub || 'investor';
    goTo('hub');
  };

  function hideOverlays() {
    ['ss-gate', 'ss-over', 'ss-info'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    });
    hideSurgeOverlay();
    var news = document.getElementById('ss-news');
    if (news) news.remove();
  }

})();
