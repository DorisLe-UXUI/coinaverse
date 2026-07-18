/* ════════════════════════════════════════════════════════════════
   STOCK SURGE v3 — GDD-aligned rebuild (Coincept Studios GDD v1.0)
   13 Coincept pseudo-stocks · Steady/Bouncy/Wild behavior classes
   Market Pulse timing · Surge Moments · 30-event news library
   CEO mascots + collectible cards (earned only) · Badges · Boosts
   Lifetime Investment Account · Daily Missions · Portfolio view
   Investopia Districts & Investor Titles · Knowledge Gates
   Premium navy / electric-violet / neon-blue / gold / teal UI
   ════════════════════════════════════════════════════════════════
   SCOPE NOTES (deliberately out of this client-only, single-file pass):
   - No real multiplayer/matchmaking (GDD §17 Duel/Team/Market Madness)
   - No real money, server-side seasons/live-ops, or sold Mystery Boxes
     (GDD §18/§19 — this app has no backend; everything is localStorage)
   - No Investor Pet system (GDD §16) — explicitly optional, skipped
   - No permanent Upgrades/Cosmetics shop (GDD §12.2/12.3) — no in-game
     economy/shop UI this pass to keep the file shippable
   - No parent-controlled Leaderboard screen (GDD §20 #11) — no backend
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── constants ───────────────────────────────────────────────── */
  const START_CASH    = 1000;
  const TICK_MS        = 2000;   // GDD Table C: price tick every 2-4s
  const GATE_EVERY     = 20000;  // knowledge gate every ~20s
  const SURGE_CHANCE   = 0.15;   // GDD Table C: 15% chance per round
  const DIP_THRESHOLD  = 0.92;   // 8%+ below avg buy price counts as "a dip" (GDD Sec10 Lv6)

  /* ── stock catalogue (GDD Sec 6 + Table A) ──────────────────────
     Every stock shares one global rule-set — no bespoke mechanics per
     stock (GDD Sec 6 engineering note). icon/ceo/quote = GDD Sec 14
     Character System flavor (CEO mascots make tickers feel alive). */
  const STOCKS = [
    { ticker:'CEG',  name:'Coincept Education Group',    sector:'Education',     risk:'Steady', base:10, icon:'📘', ceo:'Professor Penny',  quote:'Knowledge is the best investment.' },
    { ticker:'CGS',  name:'Coincept Gaming Studios',      sector:'Gaming',        risk:'Bouncy', base:10, icon:'🎮', ceo:'Pixel Pete',        quote:'Always building new games.' },
    { ticker:'CTL',  name:'Coincept Technology Labs',     sector:'Technology',    risk:'Wild',   base:10, icon:'💻', ceo:'Circuit Sam',       quote:'Move fast, build faster.' },
    { ticker:'CEC',  name:'Coincept Entertainment Co',    sector:'Entertainment', risk:'Bouncy', base:10, icon:'🎬', ceo:'Star Nova',         quote:'Lights, camera, profits!' },
    { ticker:'CAC',  name:'Coincept Apparel Collective',  sector:'Apparel',       risk:'Steady', base:10, icon:'👕', ceo:'Fashion Fox',       quote:'Loves trends.' },
    { ticker:'CCC',  name:'Coincept Cosmetics & Care',    sector:'Cosmetics',     risk:'Bouncy', base:10, icon:'💄', ceo:'Glimmer Glow',      quote:'Shine bright, sell brighter.' },
    { ticker:'CVW',  name:'Coincept VR Worlds',           sector:'VR',            risk:'Wild',   base:10, icon:'🥽', ceo:'Vira Vision',       quote:'Sees the future first.' },
    { ticker:'CAI',  name:'Coincept AI Systems',          sector:'AI',            risk:'Wild',   base:10, icon:'🧠', ceo:'Professor Byte',    quote:'Genius but unpredictable.' },
    { ticker:'CFT',  name:'Coincept Financial Tools',     sector:'FinTech',       risk:'Steady', base:10, icon:'💳', ceo:'Ledger Lin',        quote:'Every coin counted.' },
    { ticker:'CCCX', name:'Coincept Crypto Concepts',     sector:'Crypto',        risk:'Wild',   base:10, icon:'🪙', ceo:'Chain Charlie',     quote:'Bold moves, big swings.' },
    { ticker:'CGP',  name:'Coincept Global Partners',     sector:'Partnerships',  risk:'Steady', base:10, icon:'🤝', ceo:'Handshake Hank',    quote:'Better together.' },
    { ticker:'CIV',  name:'Coincept Innovation Ventures', sector:'Innovation',    risk:'Wild',   base:10, icon:'💡', ceo:'Spark Ivy',         quote:'Tomorrow starts today.' },
    { ticker:'CHL',  name:'Coincept Home & Living',       sector:'Housing',       risk:'Bouncy', base:10, icon:'🏠', ceo:'Home Base Holly',   quote:'Building where dreams live.', unlockLevel:5 },
  ];
  var STOCK_BY_TICKER = {};
  STOCKS.forEach(function (s) { STOCK_BY_TICKER[s.ticker] = s; });

  // GDD Sec 7.1 / Table B: asymmetric, upward-skewed per-risk movement ranges
  // (min%..max% per tick, NOT a symmetric +/- band — the skew is itself part of
  // the Sec 22 "encouraging market" safety design, not just flavor).
  const RISK_RANGE = {
    Steady: { min:-1, max:3,  surgeMult:1.2 },
    Bouncy: { min:-3, max:7,  surgeMult:1.5 },
    Wild:   { min:-5, max:20, surgeMult:2.0 },
  };

  const PRICE_MIN = 2, PRICE_MAX = 50;

  /* ── collectible CEO card rarities (GDD Sec 14.2) ───────────────
     Earned only — never purchased (GDD Sec 5.1 "Earned, Not Bought"). */
  const CARD_RARITIES = [
    { id:'Common',    weight:55, color:'#cbd5e1', glow:'rgba(203,213,225,.35)' },
    { id:'Rare',      weight:28, color:'#38bdf8', glow:'rgba(56,189,248,.55)'  },
    { id:'Epic',      weight:13, color:'#a855f7', glow:'rgba(168,85,247,.6)'   },
    { id:'Legendary', weight:4,  color:'#fbbf24', glow:'rgba(251,191,36,.75)'  },
  ];

  /* ── local achievement badges (GDD Sec 11.3) ────────────────────
     Distinct from the single global cvAwardGame `badge` slot — these are
     Stock-Surge-specific flavor achievements shown in the round summary. */
  const BADGE_DEFS = {
    perfectTrade: { name:'Perfect Trade', icon:'🎯', desc:'Sold 20%+ above your buy price.' },
    diversifier:  { name:'Diversifier',   icon:'🧺', desc:'Owned 3+ different stocks in one round.' },
    steadyHands:  { name:'Steady Hands',  icon:'🤲', desc:'Held through a dip and stayed positive.' },
    winStreak:    { name:'Win Streak',    icon:'🔥', desc:'Won 3 rounds in a row.' },
  };

  /* ── daily missions pool (GDD Sec 11.1) ─────────────────────────
     3 are chosen per real-world day; small direct coin reward on
     completion (same non-cvAwardGame pattern the Knowledge Gate already
     uses) — cvAwardGame stays reserved for game-completion per contract. */
  const DAILY_MISSIONS = [
    { id:'smartSell',    name:'Make 1 Smart Sell',              desc:'Sell a stock higher than you bought it.',           icon:'💰' },
    { id:'diversify3',   name:'Diversify Across 3 Industries',  desc:'Own stock in 3 different sectors in one round.',    icon:'🧺' },
    { id:'surviveSurge', name:'Survive a Surge Moment',         desc:'Get through a Surge Moment without panic-selling.', icon:'⚡' },
    { id:'profitTrade',  name:'Make a Profitable Trade',        desc:'Complete any trade that ends in profit.',           icon:'📈' },
    { id:'holdRound',    name:'Hold a Full Round',              desc:'Hold at least one stock for an entire round.',     icon:'⏳' },
    { id:'avoidDipSell', name:'Avoid Selling at a Loss',        desc:'Finish a round without a losing sell.',             icon:'🛡️' },
  ];

  /* ── level definitions — GDD Sec 10 + Sec 15.2 (Investopia Districts)
     + Sec 15.3 (Investor Titles, replacing generic Bronze→Diamond) ── */
  const LEVELS = [
    { level:1, tickers:['CEG','CGS'],                                                      target:1100, time:75, hasSurge:false, hasPortView:false, hasLabels:false, hasNews:false, multiRound:1,
      district:'Investment Street', title:'Paper Trader',
      winCondition:'profit', winLabel:'End with +$100 profit' },
    { level:2, tickers:['CEG','CGS','CTL','CEC'],                                          target:2000, time:75, hasSurge:true,  hasPortView:false, hasLabels:false, hasNews:false, multiRound:1,
      district:'Market Square', title:'Market Explorer',
      winCondition:'profitSell', winLabel:'Make 1 profitable sell' },
    { level:3, tickers:['CEG','CGS','CTL','CEC','CAC'],                                    target:2500, time:75, hasSurge:true,  hasPortView:true,  hasLabels:false, hasNews:false, multiRound:1,
      district:'Investor Heights', title:'Junior Analyst',
      diversify:3, winCondition:'diversify', winLabel:'Own 3+ different stocks' },
    { level:4, tickers:['CEG','CGS','CTL','CEC','CAC','CCC'],                              target:3000, time:75, hasSurge:true,  hasPortView:true,  hasLabels:true,  hasNews:false, multiRound:1,
      district:'Wealth Boulevard', title:'Portfolio Builder',
      winCondition:'steadyAndWild', winLabel:'Own 1 Steady + 1 Wild stock' },
    { level:5, tickers:['CEG','CGS','CTL','CEC','CAC','CCC','CVW','CAI','CFT','CCCX','CGP','CIV','CHL'], target:4000, time:90, hasSurge:true, hasPortView:true, hasLabels:true, hasNews:true,  multiRound:1,
      district:'Innovation District', title:'Investment Strategist',
      winCondition:'newsResponse', winLabel:'Respond correctly to 2 news events' },
    { level:6, tickers:['CEG','CGS','CTL','CEC','CAC','CCC','CVW','CAI','CFT','CCCX','CGP','CIV','CHL'], target:5000, time:75, hasSurge:true, hasPortView:true, hasLabels:true, hasNews:true,  multiRound:3,
      district:'Wall Street Nexus', title:'Market Master',
      winCondition:'holdThroughDip', winLabel:'Hold through a dip, finish positive' },
    { level:7, tickers:['CEG','CGS','CTL','CEC','CAC','CCC','CVW','CAI','CFT','CCCX','CGP','CIV','CHL'], target:6000, time:90, hasSurge:true, hasPortView:true, hasLabels:true, hasNews:true,  multiRound:1, traderLeague:true,
      district:'Investopia Tower', title:'Investopia Legend' },
  ];

  /* ── news events — GDD Sec 9.1's actual 30-event library + Table D ──
     (10 positive / 10 negative / 10 neutral-volatile; 'ALL'=market-wide,
     null=random single stock, ticker=that stock specifically). ── */
  const NEWS_POS = [
    { text:'Coincept Gaming releases a hit game!',              ticker:'CGS'  },
    { text:'Coincept Education partners with schools',          ticker:'CEG'  },
    { text:'Coincept Tech launches a new app',                  ticker:'CTL'  },
    { text:'Holiday sales boost Coincept Apparel',               ticker:'CAC'  },
    { text:'Coincept Cosmetics goes viral on social media',      ticker:'CCC'  },
    { text:'Investors feel confident today',                     ticker:'ALL'  },
    { text:'New characters added to Moolahtopia',                ticker:'CEC'  },
    { text:'Coincept wins a youth innovation award',             ticker:'CIV'  },
    { text:'App downloads hit a new record',                     ticker:'CTL'  },
    { text:'Big companies want to partner with Coincept',        ticker:'CGP'  },
  ];
  const NEWS_NEG = [
    { text:'A game update has bugs',                 ticker:'CGS' },
    { text:'School orders slow this month',          ticker:'CEG' },
    { text:'Fashion trend changes',                  ticker:'CAC' },
    { text:'Tech maintenance causes delays',         ticker:'CTL' },
    { text:'Social media rumors spread',              ticker:'CCC' },
    { text:'Holiday sales miss expectations',         ticker:'CEC' },
    { text:'Competitors release similar products',    ticker:'CVW' },
    { text:'Investors feel nervous today',            ticker:'ALL' },
    { text:'Product launch is delayed',               ticker:'CAI' },
    { text:'Mixed reviews affect sales',               ticker:'CFT' },
  ];
  const NEWS_VOL = [
    { text:'Surprise announcement coming soon',       ticker:null  },
    { text:'Big influencer talks about Coincept',      ticker:'CCCX' },
    { text:'Market feels unpredictable today',         ticker:'ALL'  },
    { text:'New idea teased — details unknown',        ticker:'CIV'  },
    { text:'Investors disagree on the future',         ticker:'ALL'  },
    { text:'Trend changes quickly',                    ticker:null  },
    { text:'Sudden rush of buyers',                    ticker:null  },
    { text:'Sudden rush of sellers',                   ticker:null  },
    { text:'Confusing news causes swings',             ticker:null  },
    { text:'Market reacts fast to rumors',             ticker:'CHL'  },
  ];

  /* ── financial literacy facts — GDD Sec 2.2 Educational Objectives
     (the first 7 are verbatim-mapped to the GDD's 7 objectives; the last
     2 are useful bonus concepts kept from the prior build). ── */
  const FACTS = [
    { icon:'🏢', title:'What Is a Stock?',       body:'A stock is a tiny piece of a company. When you buy a share, you actually own a small slice of that business!' },
    { icon:'📈', title:'Prices Move for Reasons', body:'Stock prices rise and fall as investors react to news, trends, and how well a company is doing. Nothing moves for no reason.' },
    { icon:'💡', title:'Buy Low, Sell High',      body:'The core of investing: buy shares when prices are low, sell when they rise. Patience is key.' },
    { icon:'⚖️', title:'Risk vs Reward',          body:'Higher-risk stocks can win big — or drop hard. Steady stocks grow slower but feel safer. Choose what fits your plan.' },
    { icon:'🧺', title:'Diversification',         body:'Spread your money across different stocks. If one drops, the others can cushion the loss.' },
    { icon:'⏳', title:'Patience Over Panic',      body:'Selling in a panic locks in losses. Real investors often hold steady and let the market recover.' },
    { icon:'🏦', title:'Investing vs Saving',      body:'Saving keeps money safe for later. Investing puts money to work, aiming to grow it. They’re two different buckets!' },
    { icon:'📰', title:'News Moves Prices',        body:'Good news lifts stocks; bad news drops them. Smart investors read before they trade.' },
    { icon:'💸', title:'Realized vs Unrealized',   body:'Profit is only REALIZED when you sell. Paper gains can disappear if you hold too long without a plan.' },
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
     GLOBAL PERSISTENT STATE (window.state.ss_*) — namespaced so the
     5 other flagship-game rebuilds running in parallel can't collide.
  ══════════════════════════════════════════════════════════════ */
  function ensureGlobalState() {
    if (!window.state) return;
    state.ss_lifetime = state.ss_lifetime || { rounds:0, totalProfit:0, bestDay:0, biggestDrop:0, sumReturnPct:0, totalAccount:0 };
    state.ss_cards    = state.ss_cards    || {};
    state.ss_badges   = state.ss_badges   || [];
    state.ss_winStreak  = state.ss_winStreak  || 0;
    state.ss_bestStreak = state.ss_bestStreak || 0;
    state.ss_boosts   = state.ss_boosts   || { trendGlasses:0, timeFreeze:0, autoShield:0 };
    var today = new Date().toDateString();
    if (state.ss_dailyDate !== today) {
      state.ss_dailyDate     = today;
      state.ss_dailyMissions = pickDailyMissions();
      state.ss_dailyProgress = {};
    } else {
      state.ss_dailyMissions = state.ss_dailyMissions || pickDailyMissions();
      state.ss_dailyProgress = state.ss_dailyProgress || {};
    }
    if (window.cvSave) cvSave();
  }

  function pickDailyMissions() {
    var pool = DAILY_MISSIONS.slice();
    var chosen = [];
    for (var i = 0; i < 3 && pool.length; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      chosen.push(pool[idx].id);
      pool.splice(idx, 1);
    }
    return chosen;
  }

  // Dispatch a completed in-round behavior against today's 3 missions.
  function ssMissionEvent(type) {
    if (!window.state) return;
    ensureGlobalState();
    if (state.ss_dailyMissions.indexOf(type) === -1) return;
    if (state.ss_dailyProgress[type]) return;
    state.ss_dailyProgress[type] = true;
    state.coins = (state.coins || 0) + 25;
    if (window.cvAddXP) cvAddXP(6, 0);
    if (window.cvSave) cvSave();
    showToast('✅ Daily Mission complete! +25 🪙', '#2dd4bf');
  }

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
  #ss-root { position:absolute;inset:0;background:linear-gradient(160deg,#0a0a24 0%,#12082e 55%,#05040f 100%);overflow:hidden;font-family:'Inter',sans-serif;color:#fff;display:flex;flex-direction:column;
    --ss-violet:#a855f7; --ss-violet-lt:#c084fc; --ss-blue:#38bdf8; --ss-blue-lt:#7dd3fc; --ss-gold:#fbbf24; --ss-gold-dk:#d97706; --ss-teal:#2dd4bf; --ss-teal-lt:#5eead4; --ss-rose:#fb7185; }
  .ss-topbar { display:flex;align-items:center;gap:8px;padding:10px 14px 6px;background:linear-gradient(180deg,rgba(10,10,36,.95) 0%,transparent 100%);flex-shrink:0;flex-wrap:wrap; }
  .ss-back-btn { padding:6px 12px;border:1px solid rgba(56,189,248,.4);border-radius:8px;background:rgba(56,189,248,.1);color:var(--ss-blue-lt);font-size:.6rem;letter-spacing:.1em;cursor:pointer;font-family:'Orbitron',sans-serif;white-space:nowrap; }
  .ss-help-btn { padding:6px 9px;border:1px solid rgba(56,189,248,.4);border-radius:8px;background:rgba(56,189,248,.1);color:var(--ss-blue-lt);font-size:.62rem;cursor:pointer;font-family:'Orbitron',sans-serif;flex-shrink:0; }
  .ss-title { font-family:'Anton',sans-serif;font-size:.78rem;letter-spacing:.06em;flex:1;text-align:center;background:linear-gradient(90deg,var(--ss-blue-lt),var(--ss-gold));-webkit-background-clip:text;background-clip:text;color:transparent; }
  .ss-timer { font-family:'Orbitron',sans-serif;font-size:.8rem;color:var(--ss-gold);min-width:42px;text-align:right; }
  .ss-rank-strip { padding:0 14px 6px;font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.08em;color:rgba(255,255,255,.55);text-align:center;flex-shrink:0; }
  .ss-hud { display:flex;gap:6px;padding:0 12px 8px;flex-shrink:0; }
  .ss-hud-box { flex:1;text-align:center;background:rgba(56,189,248,.07);border:1px solid rgba(56,189,248,.18);border-radius:10px;padding:5px 4px; }
  .ss-hud-label { font-size:.42rem;letter-spacing:.1em;color:rgba(255,255,255,.45);font-family:'Orbitron',sans-serif;text-transform:uppercase; }
  .ss-hud-val { font-size:.95rem;font-weight:900;color:#fff;font-family:'Anton',sans-serif;line-height:1.2; }
  .ss-feature-row { display:flex;gap:6px;padding:0 12px 8px;flex-shrink:0; }
  .ss-feature-btn { flex:1;padding:6px 4px;border-radius:9px;border:1px solid rgba(168,85,247,.3);background:rgba(168,85,247,.08);color:var(--ss-violet-lt);font-family:'Orbitron',sans-serif;font-size:.46rem;letter-spacing:.05em;cursor:pointer;white-space:nowrap;position:relative; }
  .ss-stocks { flex:1;overflow-y:auto;padding:0 10px 8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px;align-content:center;justify-content:center; }
  .ss-stocks::-webkit-scrollbar { width:3px; }
  .ss-stocks::-webkit-scrollbar-thumb { background:rgba(99,102,241,.35);border-radius:3px; }
  .ss-card { border-radius:13px;border:1.5px solid rgba(99,102,241,.22);background:rgba(10,8,32,.7);padding:10px;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .1s;-webkit-tap-highlight-color:transparent;position:relative;overflow:hidden; }
  .ss-card.selected { border-color:var(--ss-gold);box-shadow:0 0 18px rgba(251,191,36,.45);transform:scale(1.03); }
  .ss-card.surge-glow { animation:ssGlowPulse .6s ease-in-out infinite alternate; }
  @keyframes ssGlowPulse { 0%{box-shadow:0 0 12px rgba(251,191,36,.4)} 100%{box-shadow:0 0 28px rgba(251,191,36,.9),0 0 50px rgba(168,85,247,.4)} }
  .ss-card-top { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px; }
  .ss-ticker { font-family:'Orbitron',sans-serif;font-size:.7rem;font-weight:900;letter-spacing:.06em;color:var(--ss-blue-lt); }
  .ss-risk-badge { font-size:.38rem;letter-spacing:.08em;padding:2px 5px;border-radius:5px;font-family:'Orbitron',sans-serif;font-weight:700;text-transform:uppercase;flex-shrink:0; }
  .ss-risk-S { background:rgba(45,212,191,.2);color:var(--ss-teal-lt); }
  .ss-risk-B { background:rgba(56,189,248,.2);color:var(--ss-blue-lt); }
  .ss-risk-W { background:rgba(168,85,247,.22);color:var(--ss-violet-lt); }
  .ss-card-name { font-size:.5rem;color:rgba(255,255,255,.55);margin-bottom:5px;line-height:1.3; }
  .ss-price-row { display:flex;align-items:center;justify-content:space-between; }
  .ss-price { font-family:'Anton',sans-serif;font-size:1.15rem;line-height:1; }
  .ss-up { color:var(--ss-teal-lt); } .ss-down { color:var(--ss-rose); } .ss-flat { color:#9ca3af; }
  .ss-arrow { font-size:.85rem; }
  .ss-spark { margin:3px 0 1px; }
  .ss-trend-hint { font-size:.4rem;color:var(--ss-blue-lt);font-family:'Orbitron',sans-serif;margin-top:2px; }
  .ss-mood { font-size:.42rem;letter-spacing:.08em;font-family:'Orbitron',sans-serif;margin-top:3px; }
  .ss-mood-calm { color:#9ca3af; } .ss-mood-hype { color:var(--ss-teal-lt); } .ss-mood-panic { color:var(--ss-rose); }
  .ss-shares-owned { font-size:.42rem;color:rgba(255,255,255,.45);margin-top:3px; }
  .ss-actions { display:flex;gap:6px;padding:8px 10px;flex-shrink:0;background:rgba(5,4,15,.8);border-top:1px solid rgba(99,102,241,.15); }
  .ss-qty-row { display:flex;align-items:center;gap:6px;padding:0 10px 6px;flex-shrink:0; }
  .ss-qty-label { font-size:.5rem;letter-spacing:.1em;color:rgba(255,255,255,.5);font-family:'Orbitron',sans-serif; }
  .ss-qty-btn { width:28px;height:28px;border-radius:7px;border:1px solid rgba(56,189,248,.3);background:rgba(56,189,248,.1);color:var(--ss-blue-lt);font-size:.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;font-weight:700;flex-shrink:0; }
  .ss-qty-val { font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fff;min-width:22px;text-align:center; }
  .ss-cost-info { font-size:.45rem;color:rgba(255,255,255,.45);font-family:'Orbitron',sans-serif;flex:1;text-align:right; }
  .ss-action-btn { flex:1;padding:12px 4px;border-radius:12px;border:none;font-family:'Orbitron',sans-serif;font-size:.58rem;font-weight:900;letter-spacing:.06em;cursor:pointer;transition:transform .08s;-webkit-tap-highlight-color:transparent;position:relative; }
  .ss-action-btn:active { transform:scale(.93); }
  .ss-btn-buy   { background:linear-gradient(135deg,#2dd4bf,#0891b2);color:#031409; }
  .ss-btn-sell  { background:linear-gradient(135deg,#fcd34d,#d97706);color:#0a0700; }
  .ss-btn-hold  { background:rgba(99,102,241,.14);color:#c7d2fe;border:1px solid rgba(99,102,241,.35)!important; }
  .ss-btn-boost { background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff; }
  .ss-boost-count { display:none;align-items:center;justify-content:center;position:absolute;top:-6px;right:-4px;min-width:16px;height:16px;padding:0 3px;border-radius:8px;background:var(--ss-gold);color:#1a0d00;font-size:.5rem;font-weight:900;font-family:'Orbitron',sans-serif; }
  /* overlays */
  .ss-overlay { position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;background:rgba(2,2,10,.88);backdrop-filter:blur(6px);padding:20px; }
  .ss-panel { max-width:420px;width:100%;text-align:center;padding:28px 22px;border-radius:20px;background:linear-gradient(160deg,rgba(18,8,46,.98),rgba(10,10,36,.98)); }
  @keyframes ssPanelIn { 0%{transform:scale(.9);opacity:0} 100%{transform:scale(1);opacity:1} }
  .ss-panel { animation:ssPanelIn .3s ease; }
  @keyframes ssWinPop {
    0%   { transform:scale(.7)  rotate(-2deg); opacity:0; box-shadow:0 0 0 rgba(251,191,36,0); }
    45%  { transform:scale(1.12) rotate(1deg); opacity:1; box-shadow:0 0 70px rgba(251,191,36,.65); }
    70%  { transform:scale(.96) rotate(-.5deg); box-shadow:0 0 55px rgba(251,191,36,.5); }
    100% { transform:scale(1)   rotate(0deg);  box-shadow:0 0 60px rgba(56,189,248,.4); }
  }
  .ss-panel-win { animation:ssWinPop .55s cubic-bezier(.34,1.56,.64,1) both; }
  .ss-surge-overlay { position:absolute;inset:0;z-index:8;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(168,85,247,.08);backdrop-filter:blur(2px);pointer-events:none; }
  .ss-surge-box { text-align:center;padding:18px 28px;border-radius:16px;border:2px solid var(--ss-gold);background:rgba(2,2,10,.92);box-shadow:0 0 40px rgba(251,191,36,.5); }
  @keyframes ssSurgeIn { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  .ss-surge-box { animation:ssSurgeIn .4s ease; }
  .ss-lightning { position:absolute;top:-10%;width:3px;height:120%;background:linear-gradient(180deg,transparent,#fbbf24,#a855f7,transparent);opacity:0;pointer-events:none;z-index:8; }
  .ss-l1 { left:18%;animation:ssBolt .5s ease .05s; } .ss-l2 { left:52%;animation:ssBolt .5s ease .15s; } .ss-l3 { left:82%;animation:ssBolt .5s ease .25s; }
  @keyframes ssBolt { 0%{opacity:0;transform:scaleY(.3) skewX(-12deg)} 30%{opacity:1;transform:scaleY(1) skewX(-12deg)} 100%{opacity:0;transform:scaleY(1) skewX(-12deg)} }
  @keyframes ssShake { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-6px,3px)} 40%{transform:translate(5px,-4px)} 60%{transform:translate(-4px,4px)} 80%{transform:translate(4px,2px)} }
  .ss-shake { animation:ssShake .5s ease; }
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
  <div class="ss-rank-strip" id="ss-rank-strip"></div>

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

  <div class="ss-feature-row">
    <button class="ss-feature-btn" onclick="ssCards()">🎴 CEOs</button>
    <button class="ss-feature-btn" onclick="ssMissions()">📋 Missions</button>
    <button class="ss-feature-btn" id="ss-portfolio-btn" style="display:none" onclick="ssPortfolio()">📊 Portfolio</button>
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
    <button class="ss-action-btn ss-btn-boost" onclick="ssBoosts()">🎒 BOOST<span class="ss-boost-count" id="ss-boost-count">0</span></button>
  </div>

  <!-- overlays (hidden by default) -->
  <div class="ss-overlay" id="ss-gate"      style="display:none"></div>
  <div class="ss-overlay" id="ss-over"      style="display:none"></div>
  <div class="ss-overlay" id="ss-info"      style="display:none"></div>
  <div class="ss-overlay" id="ss-help"      style="display:none"></div>
  <div class="ss-overlay" id="ss-boosts"    style="display:none"></div>
  <div class="ss-overlay" id="ss-portfolio" style="display:none"></div>
  <div class="ss-overlay" id="ss-cards"     style="display:none"></div>
  <div class="ss-overlay" id="ss-missions"  style="display:none"></div>
</div>`;
  }

  /* ══════════════════════════════════════════════════════════════
     GAME INIT
  ══════════════════════════════════════════════════════════════ */
  function initGame(levelNum) {
    stopTimers();
    ensureGlobalState();
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
        icon:     st.icon,
        ceo:      st.ceo,
        price:    st.base,
        prev:     st.base,
        history:  [st.base, st.base, st.base], // last ticks for mood + sparkline
        shares:   0,
        surge:    false,
        newsBoost:0,  // ticks remaining with news bias
        newsDrift:0,
        lastPct:  undefined,
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
      // Sec 22 safeguards / Sec 10 Lv6 / Sec 11 badges & missions tracking
      dipHeld:            {},   // ticker -> held through an 8%+ dip without selling
      dipHeldAny:         false,
      hadPerfectTrade:    false,
      hadDiversify3:      false,
      hadLossSell:        false,
      cardsEarnedThisRound: 0,
      surgeSoldDuring:    false,
      // Sec 12.1 Boosts (in-round activation state; charges live in state.ss_boosts)
      ssFreezeUntil:       0,
      ssTrendGlassesUntil: 0,
      ssShieldActive:      false,
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
    var pbtn = document.getElementById('ss-portfolio-btn');
    if (pbtn) pbtn.style.display = S.lv.hasPortView ? 'inline-block' : 'none';
    updateBoostBadge();
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
    el.innerHTML = '<div class="ss-panel" style="border:1px solid var(--ss-blue);box-shadow:0 0 50px rgba(56,189,248,.4)">' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.48rem;letter-spacing:.18em;color:var(--ss-blue-lt);margin-bottom:10px">HOW TO PLAY</div>' +
      '<div style="font-size:2.2rem;margin-bottom:8px">📊</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.85rem;font-weight:900;color:#fff;text-shadow:0 0 20px rgba(56,189,248,.5);margin-bottom:14px">STOCK SURGE</div>' +
      '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:13px 15px;margin-bottom:18px;text-align:left">' +
        '<div style="display:flex;flex-direction:column;gap:9px">' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">🎯</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">Grow your cash by picking stocks, then <b style="color:var(--ss-teal-lt)">BUY</b> low and <b style="color:var(--ss-gold)">SELL</b> high to hit each level\'s mission.</span></div>' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">👆</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">Tap a stock card to select it, set QTY, then tap BUY, SELL, or HOLD to wait it out.</span></div>' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">⚡</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">Watch for SURGE MOMENTS and NEWS banners — they swing prices fast. React quickly!</span></div>' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">🎒</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">Smart trades earn BOOSTS — tap the boost button to spend one.</span></div>' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">🎴</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">Win rounds to earn collectible CEO cards, badges and daily mission rewards.</span></div>' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">⛩</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">Knowledge Gates pop up with quick investing facts — read them for bonus coins.</span></div>' +
          '<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:.8rem;flex-shrink:0">🏆</span><span style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.5">7 levels total — each unlocks a new Investopia District and Investor Title.</span></div>' +
        '</div>' +
      '</div>' +
      '<button onclick="ssCloseHelp()" style="padding:13px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#2dd4bf,#0891b2);color:#031409;font-family:\'Orbitron\',sans-serif;font-size:.68rem;letter-spacing:.1em;font-weight:900;cursor:pointer">' + (wasPlaying ? '▶ RESUME' : 'GOT IT — START ▶') + '</button>' +
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

  /* ── Live canvas sparklines + parallax background + particle bursts ── */
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

      // depth layer 1 — slow-drifting starfield (parallax, furthest back)
      var sn = 26, so = (t * 0.006) % H;
      ctx.fillStyle = 'rgba(168,85,247,.16)';
      for (var si = 0; si < sn; si++) {
        var sx = (si * 137.5) % W;
        var sy = (si * 71 + so) % H;
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }

      // depth layer 2 — animated grid (nearer)
      var gs = 48, off = (t * 0.015) % gs;
      ctx.strokeStyle = 'rgba(56,189,248,.05)';
      ctx.lineWidth = 1;
      for (var gx = -off; gx < W; gx += gs) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
      for (var gy = 0; gy < H; gy += gs) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

      // sparklines — one panel per stock (nearest depth layer)
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
          var lc = isUp ? 'rgba(45,212,191,' : 'rgba(251,113,133,';

          var grad = ctx.createLinearGradient(0, py, 0, py + ph);
          grad.addColorStop(0, isUp ? 'rgba(45,212,191,.12)' : 'rgba(251,113,133,.1)');
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

          ctx.beginPath();
          for (var k = 0; k < pts.length; k++) {
            var lx2 = px + (k / (pts.length - 1)) * pw;
            var ly2 = py + ph - ((pts[k] - lo) / rng) * ph * 0.72 - ph * 0.12;
            if (k === 0) ctx.moveTo(lx2, ly2); else ctx.lineTo(lx2, ly2);
          }
          ctx.strokeStyle = lc + '.55)'; ctx.lineWidth = 1.5; ctx.stroke();

          ctx.fillStyle = lc + '.25)';
          ctx.font = "700 8px 'Orbitron',monospace";
          ctx.textAlign = 'left';
          ctx.fillText(st.ticker, px + 5, py + 13);
        });
      }

      // float particles + confetti (shared pool, differentiated by p.type)
      for (var pi = _ssBgParts.length - 1; pi >= 0; pi--) {
        var p = _ssBgParts[pi];
        p.x += p.vx; p.y += p.vy; p.vy += (p.type === 'confetti' ? 0.05 : 0.018); p.life -= (p.type === 'confetti' ? 0.01 : 0.018);
        if (p.type === 'confetti') p.rot += p.vrot;
        if (p.life <= 0 || p.y > H + 20) { _ssBgParts.splice(pi, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life) * 0.9;
        if (p.type === 'confetti') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
          ctx.restore();
        } else {
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    _ssBgRaf = requestAnimationFrame(drawBg);

    // expose burst for buy/sell. `streak` (cosmetic only, default 0) scales particle
    // count/speed/size so a deeper profit streak visibly pops harder — capped at 5
    // so depth never overwhelms the canvas.
    window._ssBurst = function(x, y, up, streak) {
      var c = up ? '#2dd4bf' : '#fb7185';
      var depth = Math.max(0, Math.min(5, streak || 0));
      var count = 10 + depth * 3;              // 10 → 25 particles
      var speedB = 1 + depth * 0.15;            // subtle extra kick per streak level
      var W2 = cv.clientWidth, H2 = cv.clientHeight;
      for (var i = 0; i < count; i++) {
        _ssBgParts.push({ x: x*W2, y: y*H2, vx:(Math.random()-.5)*4*speedB, vy:(-Math.random()*3-1)*speedB, r:(Math.random()*2.5+1)*(1+depth*0.08), c:c, life:1, type:'spark' });
      }
    };

    // Level-complete confetti burst (GDD Sec 20 #09 "Level Complete Screen — Confetti")
    window._ssConfetti = function () {
      var W2 = cv.clientWidth, H2 = cv.clientHeight;
      var colors = ['#fbbf24','#a855f7','#38bdf8','#2dd4bf','#fb7185'];
      for (var i = 0; i < 70; i++) {
        _ssBgParts.push({
          x: Math.random()*W2, y: -10 - Math.random()*60,
          vx: (Math.random()-.5)*2.4, vy: Math.random()*1.6+1.4,
          r: Math.random()*3+2, c: colors[i % colors.length],
          life: 1, type:'confetti', rot: Math.random()*6.28, vrot:(Math.random()-.5)*.3,
        });
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

  // Screen shake for Surge Moments (GDD Sec 8.2/20 #05 "Screen shake, neon lightning streaks")
  function ssScreenShake() {
    var root = document.getElementById('ss-root');
    if (!root) return;
    root.classList.remove('ss-shake'); void root.offsetWidth; // restart animation if already mid-shake
    root.classList.add('ss-shake');
    setTimeout(function () { if (root) root.classList.remove('ss-shake'); }, 500);
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
  // Small inline SVG trend line per card (GDD Sec 20 #03 "mini trend graph")
  function sparkSVG(history, up) {
    var pts = history.slice(-6);
    if (pts.length < 2) return '';
    var w = 60, h = 16;
    var lo = Math.min.apply(null, pts), hi = Math.max.apply(null, pts), rng = (hi - lo) || 0.001;
    var d = pts.map(function (p, i) {
      var x = (i / (pts.length - 1)) * w;
      var y = h - ((p - lo) / rng) * h;
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    var col = up ? 'var(--ss-teal-lt)' : 'var(--ss-rose)';
    return '<svg class="ss-spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block"><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
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
  function rollRarity() {
    var r = Math.random() * 100, acc = 0;
    for (var i = 0; i < CARD_RARITIES.length; i++) {
      acc += CARD_RARITIES[i].weight;
      if (r <= acc) return CARD_RARITIES[i].id;
    }
    return CARD_RARITIES[0].id;
  }

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
      el.style.color = secs <= 10 ? '#fb7185' : '#fbbf24';
    }
    if (S.timeLeft <= 0) endRound();
  }

  /* ── price ticks ─────────────────────────────────────────────── */
  function tickPrices() {
    if (!S || S.phase !== 'play') return;
    // Boost: Time Freeze (GDD Sec 12.1) — pauses PRICE changes only, timer keeps running
    if (S.ssFreezeUntil && Date.now() < S.ssFreezeUntil) return;

    var elapsed = (S.lv.time * 1000) - S.timeLeft;

    S.stocks.forEach(function (st) {
      st.prev = st.price;
      var r = RISK_RANGE[st.risk];

      // GDD Table B: asymmetric per-risk range (upward-skewed, not a symmetric swing)
      var pct = rand(r.min, r.max);

      // Surge boost
      if (st.surge) pct *= r.surgeMult;

      // News bias
      if (st.newsBoost > 0) {
        pct += st.newsDrift;
        st.newsBoost--;
      }

      // GDD Sec 22 Educational Safeguards — encouraging market, never hides the lesson
      if (elapsed < 30000) pct += 1.5;                              // "First 30 Seconds" mild upward bias
      if (S.level <= 2) pct += 1;                                   // "Tutorial Bias" toward positive outcomes
      if (st.lastPct !== undefined && st.lastPct <= -6) pct += 3;    // "Recovery Events" often follow big drops

      // Boost: Auto-Sell Shield — absorbs the next loss on a currently-held stock, once
      if (S.ssShieldActive && st.shares > 0 && pct < 0) {
        pct = Math.abs(pct) * 0.3;
        S.ssShieldActive = false;
        showToast('🛡️ Shield absorbed a loss on ' + st.ticker + '!', '#38bdf8');
      }

      // GDD Sec 8.3 / Table C: hard 25% max-loss cap per round.
      // If portfolio is already at/below the floor, bias prices upward so player can't lose more.
      var tv = totalValue();
      var floorValue = S.startCash * 0.75; // 25% loss cap
      if (tv <= floorValue) {
        pct = Math.abs(pct) + 2; // always positive (upward) when at cap floor
      }

      var next = st.price * (1 + pct / 100);
      st.price = Math.max(PRICE_MIN, Math.min(PRICE_MAX, Math.round(next * 100) / 100));
      st.lastPct = pct;

      // GDD Sec 10 Lv6 "hold through a dip, finish positive": remember any stock that
      // dipped 8%+ below the player's avg buy price while STILL held (not sold away).
      if (st.shares > 0 && S.lastBuyPrice[st.ticker] && st.price <= S.lastBuyPrice[st.ticker] * DIP_THRESHOLD) {
        S.dipHeld[st.ticker] = true;
        S.dipHeldAny = true;
      }

      // track history for mood + sparkline
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
    S.surgeSoldDuring = false;

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

    ssScreenShake();
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
          // Daily mission + boost reward for surviving without panic-selling into the dip
          if (!S.surgeSoldDuring) {
            ssMissionEvent('surviveSurge');
            if (Math.random() < 0.4) awardBoost('autoShield');
          }
          S.surgeSoldDuring = false;
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
    div.innerHTML = '<div class="ss-lightning ss-l1"></div><div class="ss-lightning ss-l2"></div><div class="ss-lightning ss-l3"></div>' +
      '<div class="ss-surge-box">' +
      '<div style="font-size:1.8rem;margin-bottom:4px">⚡</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.65rem;letter-spacing:.18em;color:var(--ss-gold);font-weight:900">SURGE MOMENT!</div>' +
      '<div style="font-size:.55rem;color:rgba(255,255,255,.7);margin:4px 0 8px;font-family:\'Inter\',sans-serif">Prices moving fast — act quickly!</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:2rem;color:var(--ss-gold);font-weight:900" id="ss-surge-cd">4</div>' +
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

    var color = type === 'pos' ? '#2dd4bf' : type === 'neg' ? '#fb7185' : '#fbbf24';
    var icon  = type === 'pos' ? '📈' : type === 'neg' ? '📉' : '⚡';

    var div = document.createElement('div');
    div.id = 'ss-news';
    div.className = 'ss-news-banner';
    div.style.cssText = 'position:absolute;top:0;left:0;right:0;z-index:7;display:flex;align-items:center;gap:10px;padding:8px 14px;background:linear-gradient(90deg,rgba(10,10,36,.97),rgba(18,8,46,.95));border-bottom:1.5px solid ' + color + ';box-shadow:0 4px 20px ' + color + '44;pointer-events:none;animation:ssBannerIn .35s ease;';
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

    var glassesOn = S.ssTrendGlassesUntil && Date.now() < S.ssTrendGlassesUntil;

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
      var rr = RISK_RANGE[st.risk];

      html += '<div class="ss-card' + (isSel ? ' selected' : '') + (isSurge ? ' surge-glow' : '') + '"' +
        ' onclick="ssSelect(\'' + st.ticker + '\')"' +
        ' id="ss-card-' + st.ticker + '">' +
        '<div class="ss-card-top">' +
          '<div class="ss-ticker">' + st.icon + ' ' + st.ticker + '</div>' +
          (S.lv.hasLabels
            ? '<div class="ss-risk-badge ss-risk-' + rl + '">' + st.risk + '</div>'
            : '') +
        '</div>' +
        '<div class="ss-card-name">' + st.name + ' · ' + st.ceo + '</div>' +
        '<div class="ss-price-row">' +
          '<div class="ss-price ss-' + dir + '">$' + st.price.toFixed(2) + '</div>' +
          '<div class="ss-arrow ss-' + dir + '">' + arrow + ' <span style="font-size:.5rem">' + changeTxt + '</span></div>' +
        '</div>' +
        sparkSVG(st.history, up) +
        (glassesOn ? '<div class="ss-trend-hint">📐 Likely ' + rr.min + '% to +' + rr.max + '%</div>' : '') +
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
    if (ge) { ge.textContent = fmtSigned(gain); ge.style.color = gain >= 0 ? '#2dd4bf' : '#fb7185'; }
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
    syncRank();
  }

  function syncTitle() {
    var el = document.getElementById('ss-title');
    if (el) el.textContent = '📊 STOCK SURGE — LV' + S.level + (S.lv.traderLeague ? ' 🏆 TRADER LEAGUE' : '');
    syncRank();
  }

  // GDD Sec 15.2 Investopia Districts + Sec 15.3 Investor Titles (replaces
  // generic Bronze→Diamond league tiers with on-brand progression labels).
  function syncRank() {
    var el = document.getElementById('ss-rank-strip');
    if (!el || !S) return;
    var streak = (window.state && state.ss_winStreak) || 0;
    el.innerHTML = '🏙️ <b style="color:#fff">' + (S.lv.district || '') + '</b> &nbsp;·&nbsp; 🎓 ' + (S.lv.title || '') +
      (streak > 0 ? ' &nbsp;·&nbsp; 🔥 x' + streak : '');
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
      if (cost > S.cash) { showToast('Not enough cash!', '#fb7185'); return; }
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
      // GDD Sec 11.3 Diversifier badge + Sec 11.1 daily mission + Sec 12.1 earned boost
      var uniqueNow = S.stocks.filter(function (s2) { return s2.shares > 0; }).length;
      if (uniqueNow >= 3 && !S.hadDiversify3) {
        S.hadDiversify3 = true;
        ssMissionEvent('diversify3');
        awardBoost('trendGlasses');
      }
      showToast('Bought ' + S.qty + ' ' + st.ticker + ' @ $' + st.price.toFixed(2), '#2dd4bf');
      if (window._ssBurst) { var bp = cardBurstPos(st.ticker); _ssBurst(bp.x, bp.y, true); }
    } else if (action === 'sell') {
      if (st.shares < S.qty) { showToast('Not enough shares!', '#fb7185'); return; }
      var proceeds = st.price * S.qty;
      var avgBuy   = S.lastBuyPrice[st.ticker] || 0;
      var sellProfitable = avgBuy > 0 && st.price > avgBuy;
      S.cash += proceeds;
      st.shares -= S.qty;
      if (st.shares === 0) delete S.lastBuyPrice[st.ticker];
      S.trades++;
      // Lv2: count profitable sells (GDD Sec 10 Lv2 win = "make 1 profitable sell")
      if (sellProfitable) {
        S.profitSells++;
        ssMissionEvent('smartSell');
        ssMissionEvent('profitTrade');
        if (st.price >= avgBuy * 1.2) S.hadPerfectTrade = true;   // GDD Sec 11.3 "Perfect Trade" badge
        if (Math.random() < 0.25) awardBoost();                    // GDD Sec 12.1 "earned by good choices"
      } else {
        S.hadLossSell = true;
      }
      if (S.surgeActive && S.surgeTickers.indexOf(st.ticker) !== -1) S.surgeSoldDuring = true;
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
      setTimeout(function () { showToast(lesson, '#5eead4'); }, 2100);
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

    // Lv6: hold a stock through an 8%+ dip without selling it away, finish positive
    if (wc === 'holdThroughDip') {
      var stillHoldingDipped = Object.keys(S.dipHeld).some(function (t) {
        var st = getStock(t); return st && st.shares > 0;
      });
      return stillHoldingDipped && tv >= curTarget();
    }

    // Default / Lv7: reach target portfolio value (escalates per round on Lv6)
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
    el.innerHTML = '<div class="ss-panel" style="border:1px solid var(--ss-blue);box-shadow:0 0 50px rgba(56,189,248,.4)">' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.48rem;letter-spacing:.18em;color:var(--ss-blue-lt);margin-bottom:10px">⛩ KNOWLEDGE GATE</div>' +
      '<div style="font-size:2.2rem;margin-bottom:8px">' + f.icon + '</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.72rem;font-weight:900;color:#fff;margin-bottom:10px">' + f.title + '</div>' +
      '<p style="font-size:.82rem;line-height:1.55;color:rgba(255,255,255,.85);margin:0 0 18px">' + f.body + '</p>' +
      '<button onclick="ssGateClose()" style="padding:12px 28px;border:none;border-radius:12px;background:linear-gradient(135deg,#2dd4bf,#0891b2);color:#031409;font-family:\'Orbitron\',sans-serif;font-size:.68rem;letter-spacing:.1em;font-weight:900;cursor:pointer">GOT IT! +10 🪙 →</button>' +
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
     BOOSTS — GDD Sec 12.1 (earned, temporary power-ups; not sold)
  ══════════════════════════════════════════════════════════════ */
  function awardBoost(preferKey) {
    if (!window.state) return;
    ensureGlobalState();
    var keys = ['trendGlasses', 'timeFreeze', 'autoShield'];
    var key = (preferKey && keys.indexOf(preferKey) !== -1) ? preferKey : pick(keys);
    state.ss_boosts[key] = (state.ss_boosts[key] || 0) + 1;
    if (window.cvSave) cvSave();
    var names = { trendGlasses:'Trend Glasses 🔍', timeFreeze:'Time Freeze ⏱️', autoShield:'Auto-Shield 🛡️' };
    showToast('🎁 Earned a boost: ' + names[key], '#a855f7');
    updateBoostBadge();
  }

  function updateBoostBadge() {
    if (!window.state) return;
    ensureGlobalState();
    var total = 0;
    var B = state.ss_boosts || {};
    Object.keys(B).forEach(function (k) { total += B[k] || 0; });
    var badge = document.getElementById('ss-boost-count');
    if (badge) { badge.textContent = total; badge.style.display = total > 0 ? 'flex' : 'none'; }
  }

  window.ssBoosts = function () {
    if (!S || S.phase !== 'play' || !window.state) return;
    ensureGlobalState();
    var el = document.getElementById('ss-boosts');
    if (!el) return;
    var B = state.ss_boosts;
    var defs = [
      { key:'trendGlasses', name:'Trend Glasses', icon:'🔍', desc:'Reveals each stock’s likely move range for 10s.' },
      { key:'timeFreeze',   name:'Time Freeze',    icon:'⏱️', desc:'Pauses price changes for 3s so you can decide.' },
      { key:'autoShield',   name:'Auto-Shield',    icon:'🛡️', desc:'Blocks your next loss on a stock you’re holding.' },
    ];
    el.style.display = 'flex';
    el.innerHTML = '<div class="ss-panel" style="border:1px solid var(--ss-violet);box-shadow:0 0 50px rgba(168,85,247,.4);max-width:380px">' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.5rem;letter-spacing:.18em;color:var(--ss-violet-lt);margin-bottom:12px">🎒 YOUR BOOSTS</div>' +
      defs.map(function (d) {
        var n = B[d.key] || 0;
        return '<div style="display:flex;align-items:center;gap:10px;background:rgba(168,85,247,.07);border:1px solid rgba(168,85,247,.2);border-radius:12px;padding:10px;margin-bottom:8px;text-align:left">' +
          '<div style="font-size:1.4rem">' + d.icon + '</div>' +
          '<div style="flex:1"><div style="font-family:\'Orbitron\',sans-serif;font-size:.6rem;color:#fff;font-weight:900">' + d.name + ' x' + n + '</div>' +
          '<div style="font-size:.5rem;color:rgba(255,255,255,.55);margin-top:2px">' + d.desc + '</div></div>' +
          '<button ' + (n <= 0 ? 'disabled' : '') + ' onclick="ssUseBoost(\'' + d.key + '\')" style="padding:8px 12px;border:none;border-radius:9px;background:' + (n > 0 ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'rgba(255,255,255,.08)') + ';color:' + (n > 0 ? '#fff' : 'rgba(255,255,255,.3)') + ';font-family:\'Orbitron\',sans-serif;font-size:.5rem;font-weight:900;cursor:' + (n > 0 ? 'pointer' : 'default') + '">USE</button>' +
        '</div>';
      }).join('') +
      '<button onclick="ssBoostsClose()" style="margin-top:6px;padding:11px 24px;border:1px solid rgba(255,255,255,.2);border-radius:12px;background:rgba(255,255,255,.06);color:#fff;font-family:\'Orbitron\',sans-serif;font-size:.6rem;letter-spacing:.1em;cursor:pointer">CLOSE</button>' +
    '</div>';
  };

  window.ssBoostsClose = function () {
    var el = document.getElementById('ss-boosts');
    if (el) { el.style.display = 'none'; el.innerHTML = ''; }
  };

  window.ssUseBoost = function (key) {
    if (!S || S.phase !== 'play' || !window.state) return;
    ensureGlobalState();
    if (!state.ss_boosts[key]) { showToast('No charges left!', '#fb7185'); window.ssBoostsClose(); return; }
    state.ss_boosts[key]--;
    if (window.cvSave) cvSave();
    if (key === 'trendGlasses') {
      S.ssTrendGlassesUntil = Date.now() + 10000;
      showToast('🔍 Trend Glasses active — risk ranges revealed!', '#38bdf8');
    } else if (key === 'timeFreeze') {
      S.ssFreezeUntil = Date.now() + 3000;
      showToast('⏱️ Time Freeze — prices paused for 3s!', '#38bdf8');
    } else if (key === 'autoShield') {
      S.ssShieldActive = true;
      showToast('🛡️ Auto-Shield armed for your next dip!', '#38bdf8');
    }
    renderCards();
    updateBoostBadge();
    window.ssBoostsClose();
  };

  /* ══════════════════════════════════════════════════════════════
     PORTFOLIO VIEW — GDD Sec 20 #07 (gated by lv.hasPortView, Lv3+)
  ══════════════════════════════════════════════════════════════ */
  window.ssPortfolio = function () {
    if (!S) return;
    var el = document.getElementById('ss-portfolio');
    if (!el) return;
    var owned = S.stocks.filter(function (st) { return st.shares > 0; });
    var tv = portfolioValue();
    el.style.display = 'flex';
    if (!owned.length) {
      el.innerHTML = '<div class="ss-panel" style="border:1px solid var(--ss-blue);box-shadow:0 0 50px rgba(56,189,248,.4)">' +
        '<div style="font-size:2rem;margin-bottom:8px">📊</div>' +
        '<div style="font-family:\'Orbitron\',sans-serif;font-size:.55rem;color:var(--ss-blue-lt);margin-bottom:14px;line-height:1.6">No holdings yet — buy a stock to see your portfolio breakdown!</div>' +
        '<button onclick="ssPortfolioClose()" style="padding:11px 24px;border:none;border-radius:12px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#022;font-family:\'Orbitron\',sans-serif;font-size:.6rem;font-weight:900;cursor:pointer">CLOSE</button>' +
      '</div>';
      return;
    }
    var palette = ['#38bdf8', '#a855f7', '#fbbf24', '#2dd4bf', '#fb7185', '#818cf8'];
    var bars = owned.map(function (st, i) {
      var val = st.shares * st.price;
      var pct = tv > 0 ? (val / tv * 100) : 0;
      return '<div style="flex:' + Math.max(pct, 4) + ' 0 0;background:' + palette[i % palette.length] + ';height:100%" title="' + st.ticker + '"></div>';
    }).join('');
    var rows = owned.map(function (st) {
      var val = st.shares * st.price;
      var avg = S.lastBuyPrice[st.ticker] || st.price;
      var gain = (st.price - avg) * st.shares;
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08)">' +
        '<div style="text-align:left"><div style="font-family:\'Orbitron\',sans-serif;font-size:.58rem;color:#fff;font-weight:900">' + st.icon + ' ' + st.ticker + '</div><div style="font-size:.46rem;color:rgba(255,255,255,.5)">' + st.shares + ' shares · ' + fmt(val) + '</div></div>' +
        '<div style="font-family:\'Anton\',sans-serif;font-size:.7rem;color:' + (gain >= 0 ? 'var(--ss-teal-lt)' : 'var(--ss-rose)') + '">' + fmtSigned(gain) + '</div>' +
      '</div>';
    }).join('');
    el.innerHTML = '<div class="ss-panel" style="border:1px solid var(--ss-blue);box-shadow:0 0 50px rgba(56,189,248,.4);max-width:400px">' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.5rem;letter-spacing:.18em;color:var(--ss-blue-lt);margin-bottom:10px">📊 YOUR PORTFOLIO</div>' +
      '<div style="display:flex;height:16px;border-radius:8px;overflow:hidden;margin-bottom:14px;background:rgba(255,255,255,.06)">' + bars + '</div>' +
      '<div style="max-height:220px;overflow-y:auto">' + rows + '</div>' +
      '<p style="font-size:.52rem;color:rgba(255,255,255,.55);margin:14px 0;line-height:1.5">💡 Spreading your investments lowers risk!</p>' +
      '<button onclick="ssPortfolioClose()" style="padding:11px 24px;border:none;border-radius:12px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#022;font-family:\'Orbitron\',sans-serif;font-size:.6rem;letter-spacing:.1em;font-weight:900;cursor:pointer">CLOSE</button>' +
    '</div>';
  };

  window.ssPortfolioClose = function () {
    var el = document.getElementById('ss-portfolio');
    if (el) { el.style.display = 'none'; el.innerHTML = ''; }
  };

  /* ══════════════════════════════════════════════════════════════
     CEO CARD COLLECTION — GDD Sec 14 (earned only, never purchased)
  ══════════════════════════════════════════════════════════════ */
  function rollCeoCard() {
    if (!window.state || !S) return null;
    ensureGlobalState();
    var ticker = pick(S.lv.tickers);
    var rarity = rollRarity();
    var key = ticker + ':' + rarity;
    var isNew = !state.ss_cards[key];
    if (isNew) {
      state.ss_cards[key] = true;
      S.cardsEarnedThisRound = (S.cardsEarnedThisRound || 0) + 1;
    } else {
      state.coins = (state.coins || 0) + 15; // duplicate → small consolation coins
    }
    if (window.cvSave) cvSave();
    var st = STOCK_BY_TICKER[ticker];
    return { ticker:ticker, rarity:rarity, isNew:isNew, ceo:st.ceo, icon:st.icon };
  }

  window.ssCards = function () {
    if (!S || S.phase === 'over') return;
    var wasPlaying = S.phase === 'play';
    if (wasPlaying) { S.phase = 'paused'; stopTimers(); clearSurge(); }
    ensureGlobalState();
    var el = document.getElementById('ss-cards');
    if (!el) return;
    var owned = (window.state && state.ss_cards) || {};
    var grid = STOCKS.map(function (s) {
      var tiers = CARD_RARITIES.map(function (r) {
        var has = !!owned[s.ticker + ':' + r.id];
        return '<span style="width:9px;height:9px;border-radius:50%;display:inline-block;margin:0 1px;background:' + (has ? r.color : 'rgba(255,255,255,.15)') + '"></span>';
      }).join('');
      return '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px;text-align:center">' +
        '<div style="font-size:1.6rem">' + s.icon + '</div>' +
        '<div style="font-family:\'Orbitron\',sans-serif;font-size:.5rem;color:#fff;font-weight:900;margin-top:4px">' + s.ceo + '</div>' +
        '<div style="font-size:.4rem;color:rgba(255,255,255,.4);margin:2px 0">' + s.ticker + '</div>' +
        '<div>' + tiers + '</div>' +
      '</div>';
    }).join('');
    el.style.display = 'flex';
    el.innerHTML = '<div class="ss-panel" style="border:1px solid var(--ss-violet);box-shadow:0 0 50px rgba(168,85,247,.4);max-width:460px">' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.5rem;letter-spacing:.18em;color:var(--ss-violet-lt);margin-bottom:10px">🎴 MEET THE CEOs</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:280px;overflow-y:auto;margin-bottom:14px">' + grid + '</div>' +
      '<p style="font-size:.48rem;color:rgba(255,255,255,.5);margin:0 0 14px">Win rounds to earn collectible CEO cards — Common, Rare, Epic &amp; Legendary!</p>' +
      '<button onclick="ssCardsClose()" style="padding:11px 24px;border:none;border-radius:12px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-family:\'Orbitron\',sans-serif;font-size:.6rem;letter-spacing:.1em;font-weight:900;cursor:pointer">' + (wasPlaying ? '▶ RESUME' : 'CLOSE') + '</button>' +
    '</div>';
  };

  window.ssCardsClose = function () {
    var el = document.getElementById('ss-cards');
    if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    if (S && S.phase === 'paused') { S.phase = 'play'; startTimers(); }
  };

  /* ══════════════════════════════════════════════════════════════
     DAILY MISSIONS — GDD Sec 11.1 (resets daily via date-string key)
  ══════════════════════════════════════════════════════════════ */
  window.ssMissions = function () {
    if (!S || S.phase === 'over') return;
    var wasPlaying = S.phase === 'play';
    if (wasPlaying) { S.phase = 'paused'; stopTimers(); clearSurge(); }
    ensureGlobalState();
    var el = document.getElementById('ss-missions');
    if (!el) return;
    var ids  = (window.state && state.ss_dailyMissions) || [];
    var prog = (window.state && state.ss_dailyProgress) || {};
    var rows = ids.map(function (id) {
      var m = DAILY_MISSIONS.filter(function (x) { return x.id === id; })[0];
      if (!m) return '';
      var done = !!prog[id];
      return '<div style="display:flex;align-items:center;gap:10px;background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.2);border-radius:12px;padding:10px;margin-bottom:8px;text-align:left;opacity:' + (done ? '.55' : '1') + '">' +
        '<div style="font-size:1.3rem">' + (done ? '✅' : m.icon) + '</div>' +
        '<div style="flex:1"><div style="font-family:\'Orbitron\',sans-serif;font-size:.56rem;color:#fff;font-weight:900">' + m.name + '</div>' +
        '<div style="font-size:.48rem;color:rgba(255,255,255,.55);margin-top:2px">' + m.desc + '</div></div>' +
        '<div style="font-family:\'Orbitron\',sans-serif;font-size:.5rem;color:var(--ss-gold)">+25</div>' +
      '</div>';
    }).join('');
    el.style.display = 'flex';
    el.innerHTML = '<div class="ss-panel" style="border:1px solid var(--ss-teal);box-shadow:0 0 50px rgba(45,212,191,.4);max-width:380px">' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.5rem;letter-spacing:.18em;color:var(--ss-teal-lt);margin-bottom:12px">📋 DAILY MISSIONS</div>' +
      rows +
      '<p style="font-size:.48rem;color:rgba(255,255,255,.5);margin:10px 0 14px">Resets every day — complete all 3 for bonus coins!</p>' +
      '<button onclick="ssMissionsClose()" style="padding:11px 24px;border:none;border-radius:12px;background:linear-gradient(135deg,#2dd4bf,#0d9488);color:#022;font-family:\'Orbitron\',sans-serif;font-size:.6rem;letter-spacing:.1em;font-weight:900;cursor:pointer">' + (wasPlaying ? '▶ RESUME' : 'CLOSE') + '</button>' +
    '</div>';
  };

  window.ssMissionsClose = function () {
    var el = document.getElementById('ss-missions');
    if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    if (S && S.phase === 'paused') { S.phase = 'play'; startTimers(); }
  };

  /* ══════════════════════════════════════════════════════════════
     BADGES + LIFETIME ACCOUNT — GDD Sec 11.3 / Sec 13.2
  ══════════════════════════════════════════════════════════════ */
  function checkAndAwardBadges() {
    if (!window.state) return [];
    ensureGlobalState();
    var earned = [];
    function award(id) {
      if (state.ss_badges.indexOf(id) === -1) { state.ss_badges.push(id); earned.push(id); }
    }
    if (S.hadPerfectTrade) award('perfectTrade');
    if (S.hadDiversify3) award('diversifier');
    if (S.dipHeldAny && (totalValue() - S.startCash) >= 0) award('steadyHands');
    if ((state.ss_winStreak || 0) >= 3) award('winStreak');
    if (earned.length && window.cvSave) cvSave();
    return earned;
  }

  function updateLifetime(profit, tv) {
    if (!window.state) return;
    ensureGlobalState();
    var L = state.ss_lifetime;
    L.rounds = (L.rounds || 0) + 1;
    L.totalProfit = (L.totalProfit || 0) + profit;
    L.totalAccount = tv; // latest running Investment Account value (GDD Sec 13.2)
    if (profit > (L.bestDay || 0)) L.bestDay = profit;
    if (profit < (L.biggestDrop || 0)) L.biggestDrop = profit;
    var retPct = S.startCash > 0 ? (profit / S.startCash * 100) : 0;
    L.sumReturnPct = (L.sumReturnPct || 0) + retPct;
    if (window.cvSave) cvSave();
  }

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

    // GDD Sec 13.2 lifetime metrics + Sec 11.2 win streak + Sec 11.3 badges + Sec 14 cards
    var newBadges  = [];
    var cardResult = null;
    if (window.state) {
      updateLifetime(profit, tv);
      if (won2) {
        state.ss_winStreak = (state.ss_winStreak || 0) + 1;
        if (state.ss_winStreak > (state.ss_bestStreak || 0)) state.ss_bestStreak = state.ss_winStreak;
      } else {
        state.ss_winStreak = 0;
      }
      newBadges = checkAndAwardBadges();
      if (won2) cardResult = rollCeoCard();
      if (window.cvSave) cvSave();
    }
    if (won2 && window._ssConfetti) window._ssConfetti();

    // Coins reward — win-gated + routed through cvAwardGame (records stars/level/badge)
    var reward = 0;
    if (window.state) {
      if (won2 && window.cvAwardGame) {
        var stars = profit >= 2 * Math.max(1, curTarget() - S.startCash) ? 3 : 2;
        // Pass the REAL level reached (1-7) so permanent progress (state.gameLevels) isn't
        // capped at 3 — cvAwardGame's own coin formula already treats lv>=3 as one flat tier.
        reward = cvAwardGame('game_stocksurge', { level: S.level, stars: stars, badge: 'Market Mogul', is3star: stars === 3, isPerfect: stars === 3, isFlagship: true, collectibles: S.cardsEarnedThisRound || 0 });
      } else {
        reward = profit > 0 ? 40 : 20;    // small consolation, no farming value
        state.coins = (state.coins || 0) + reward;
        if (window.cvAddXP) cvAddXP(Math.round(reward / 4), 0);
        else if (window.cvSave) cvSave();
      }
    }

    // Hold-a-full-round / avoid-a-loss-sell daily missions (checked once at settle)
    if (S.stocks.some(function (st) { return st.shares > 0; })) ssMissionEvent('holdRound');
    if (S.trades > 0 && !S.hadLossSell) ssMissionEvent('avoidDipSell');

    // Diversification check (Level 3)
    var uniqueOwned = S.stocks.filter(function (st) { return st.shares > 0; }).length;
    var diversifyMsg = '';
    if (S.lv.diversify && uniqueOwned < S.lv.diversify) {
      diversifyMsg = '<div style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:10px;padding:10px;margin-bottom:14px;font-size:.6rem;color:var(--ss-gold);font-family:\'Orbitron\',sans-serif;letter-spacing:.05em">💡 TIP: Own 3+ different stocks to diversify risk!</div>';
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

    // NEW — lifetime account block (Sec 13.2)
    var lifetimeBlock = '';
    if (window.state && state.ss_lifetime) {
      var Lf = state.ss_lifetime;
      var avgRet = Lf.rounds ? (Lf.sumReturnPct / Lf.rounds) : 0;
      lifetimeBlock = '<div style="background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.2);border-radius:10px;padding:9px 12px;margin-bottom:12px;text-align:left">' +
        '<div style="font-family:\'Orbitron\',sans-serif;font-size:.4rem;letter-spacing:.14em;color:var(--ss-blue-lt);margin-bottom:5px">🏦 LIFETIME INVESTMENT ACCOUNT</div>' +
        '<div style="font-size:.54rem;color:rgba(255,255,255,.75);line-height:1.65">Account Value: <b style="color:#fff">' + fmt(Lf.totalAccount || 0) + '</b> · Best Day: <b style="color:var(--ss-teal-lt)">' + fmtSigned(Lf.bestDay || 0) + '</b> · Rounds Played: <b>' + (Lf.rounds || 0) + '</b> · Avg Return: <b>' + avgRet.toFixed(1) + '%</b></div>' +
      '</div>';
    }
    // NEW — newly-earned badges strip (Sec 11.3)
    var badgesBlock = '';
    if (newBadges && newBadges.length) {
      badgesBlock = '<div style="margin-bottom:12px">' + newBadges.map(function (id) {
        var b = BADGE_DEFS[id] || { name:id, icon:'🏅' };
        return '<span style="display:inline-block;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.4);border-radius:20px;padding:5px 12px;margin:2px;font-family:\'Orbitron\',sans-serif;font-size:.46rem;color:var(--ss-gold)">' + b.icon + ' NEW BADGE: ' + b.name + '</span>';
      }).join('') + '</div>';
    }
    // NEW — CEO card reveal (Sec 14.2, earned-only collectible)
    var cardBlock = '';
    if (cardResult) {
      var rarityDef = CARD_RARITIES.filter(function (r) { return r.id === cardResult.rarity; })[0] || CARD_RARITIES[0];
      cardBlock = '<div style="border:2px solid ' + rarityDef.color + ';box-shadow:0 0 24px ' + rarityDef.glow + ';border-radius:14px;padding:12px;margin-bottom:14px;background:rgba(255,255,255,.03)">' +
        '<div style="font-family:\'Orbitron\',sans-serif;font-size:.42rem;letter-spacing:.14em;color:' + rarityDef.color + ';margin-bottom:6px">' + (cardResult.isNew ? '🎴 NEW CEO CARD!' : '🎴 DUPLICATE CARD · +15 🪙') + '</div>' +
        '<div style="font-size:2rem">' + cardResult.icon + '</div>' +
        '<div style="font-family:\'Anton\',sans-serif;font-size:.85rem;color:#fff">' + cardResult.ceo + '</div>' +
        '<div style="font-size:.5rem;color:rgba(255,255,255,.5)">' + cardResult.ticker + ' · ' + rarityDef.id + '</div>' +
      '</div>';
    }
    var streakBlock = (won2 && window.state && state.ss_winStreak > 1)
      ? '<div style="font-family:\'Orbitron\',sans-serif;font-size:.5rem;color:var(--ss-gold);margin-bottom:10px">🔥 Win Streak: ' + state.ss_winStreak + '</div>'
      : '';

    var el = document.getElementById('ss-over');
    if (!el) return;
    el.style.display = 'flex';
    el.innerHTML = '<div class="ss-panel' + (won2 ? ' ss-panel-win' : '') + '" style="border:1px solid ' + (won2 ? '#fbbf24' : '#38bdf8') + ';box-shadow:0 0 60px rgba(56,189,248,.4)">' +
      '<div style="font-size:2.6rem;margin-bottom:8px">' + (won2 ? '🏆' : profit >= 0 ? '📈' : '📉') + '</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.55rem;letter-spacing:.18em;color:' + (won2 ? '#fbbf24' : '#2dd4bf') + ';margin-bottom:8px">' + (won2 ? 'TARGET REACHED!' : profit >= 0 ? 'PROFITABLE RUN' : 'MARKET CLOSED') + '</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.42rem;letter-spacing:.14em;color:rgba(255,255,255,.5);margin-bottom:6px">INVESTMENT ACCOUNT SUMMARY</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;text-align:left">' +
        summaryRow('STARTING VALUE', fmt(S.startCash)) +
        summaryRow('ENDING VALUE',   fmt(tv)) +
        summaryRow('PROFIT / LOSS',  fmtSigned(profit), profit >= 0 ? '#2dd4bf' : '#fb7185') +
        summaryRow('TRADES MADE',    S.trades) +
        summaryRow('MISSION', S.lv.winLabel || ('Reach ' + fmt(S.lv.target))) +
        summaryRow('LEVEL', S.lv.district + ' (LV' + S.level + ')') +
        summaryRow('REWARD', '+' + reward + ' 🪙', '#fbbf24') +
      '</div>' +
      streakBlock +
      cardBlock +
      badgesBlock +
      diversifyMsg +
      '<p style="font-size:.65rem;line-height:1.5;color:rgba(255,255,255,.7);margin:0 0 16px;padding:10px;background:rgba(56,189,248,.07);border-radius:8px;border-left:3px solid var(--ss-blue)">' + lesson + '</p>' +
      lifetimeBlock +
      (won2 && S.level < 7
        ? '<button onclick="ssNextLevel()" style="padding:11px 20px;margin:3px;border:none;border-radius:12px;background:linear-gradient(135deg,#fbbf24,#d97706);color:#0a0700;font-family:\'Orbitron\',sans-serif;font-size:.62rem;letter-spacing:.1em;font-weight:900;cursor:pointer">▶ NEXT LEVEL</button>'
        : '') +
      '<button onclick="ssRestart()" style="padding:11px 20px;margin:3px;border:none;border-radius:12px;background:linear-gradient(135deg,#2dd4bf,#0891b2);color:#031409;font-family:\'Orbitron\',sans-serif;font-size:.62rem;letter-spacing:.1em;font-weight:900;cursor:pointer">↺ PLAY AGAIN</button>' +
      '<button onclick="ssExit()" style="padding:11px 20px;margin:3px;border:1px solid rgba(255,255,255,.2);border-radius:12px;background:rgba(255,255,255,.06);color:#fff;font-family:\'Orbitron\',sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer">← HUB</button>' +
    '</div>';
  }

  function summaryRow(label, val, color) {
    return '<div style="background:rgba(56,189,248,.07);border-radius:7px;padding:6px 8px">' +
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
    div.innerHTML = '<span style="display:inline-block;transform:scale(' + scale + ');font-family:\'Inter\',sans-serif;font-weight:800;font-size:.78rem;color:' + (color || '#2dd4bf') + ';background:rgba(2,2,10,.9);padding:8px 16px;border-radius:20px;border:1px solid ' + (color || '#2dd4bf') + (depth >= 2 ? 'cc' : '44') + ';box-shadow:0 4px ' + glowSize + 'px rgba(251,191,36,' + glowA + ');">' + text + '</span>';
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
    ['ss-gate', 'ss-over', 'ss-info', 'ss-boosts', 'ss-portfolio', 'ss-cards', 'ss-missions'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    });
    hideSurgeOverlay();
    var news = document.getElementById('ss-news');
    if (news) news.remove();
  }

})();
