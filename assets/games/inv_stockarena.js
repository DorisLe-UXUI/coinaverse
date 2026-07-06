/* ════════════════════════════════════════════════════════════════
   STOCK MARKET ARENA — Investopia Hub · Coinaverse
   Futuristic holographic trading arena. Buy / Sell / Time the market.
   Level 1: Learn (slow, clear trends, Market Boosts)
   Level 2: Master (breaking news, crashes, bull runs, AI rival)
   Win by finishing with the highest portfolio value before session ends.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── ACCENT / THEME ────────────────────────────────────────── */
  const AC = '#00C853';          // Investopia green
  const AC2 = '#00E676';         // lighter green for glows
  const GOLD = '#FFD600';
  const RED = '#FF1744';

  /* ─── CONSTANTS ─────────────────────────────────────────────── */
  const START_CASH   = 2000;
  const TICK_MS_L1   = 2200;   // slower for learn
  const TICK_MS_L2   = 1400;   // faster for master
  const SESSION_TIME = 90;     // seconds
  const BOOST_SPAWN_INT = 18;  // seconds between Market Boost spawns
  const PRICE_MIN    = 1;
  const PRICE_MAX    = 200;

  /* ─── STOCKS ─────────────────────────────────────────────────── */
  const STOCKS_L1 = [
    { ticker:'CVAI', name:'Coinaverse AI',      icon:'🤖', vol:0.04, base:40, trend:0.012 },
    { ticker:'CGRN', name:'Coinagreen Energy',   icon:'🌿', vol:0.03, base:28, trend:0.008 },
    { ticker:'CVTK', name:'Coincept TechKit',    icon:'⚙️',  vol:0.05, base:55, trend:0.015 },
    { ticker:'CTOP', name:'CoinTop Media',       icon:'📺', vol:0.035,base:35, trend:-0.005 },
  ];
  const STOCKS_L2 = [
    { ticker:'CVAI', name:'Coinaverse AI',        icon:'🤖', vol:0.07, base:40, trend:0.02  },
    { ticker:'CGRN', name:'Coinagreen Energy',     icon:'🌿', vol:0.05, base:28, trend:0.01  },
    { ticker:'CVTK', name:'Coincept TechKit',      icon:'⚙️',  vol:0.09, base:55, trend:0.025 },
    { ticker:'CTOP', name:'CoinTop Media',         icon:'📺', vol:0.06, base:35, trend:-0.008 },
    { ticker:'CBNK', name:'Coincept BankChain',    icon:'🏦', vol:0.08, base:62, trend:0.015 },
    { ticker:'CVEX', name:'Coin Vex Commodities',  icon:'⛏️',  vol:0.10, base:22, trend:0.005 },
  ];

  /* ─── NEWS EVENTS (level 2 only) ────────────────────────────── */
  const NEWS = [
    { text:'📈 BULL RUN: AI sector surging!',       ticker:'CVAI', bias:+18, dur:3 },
    { text:'📉 CRASH: Energy selloff begins!',       ticker:'CGRN', bias:-22, dur:4 },
    { text:'⚡ BREAKING: TechKit merger talks!',    ticker:'CVTK', bias:+25, dur:3 },
    { text:'📉 PANIC: Media ad revenue collapses!', ticker:'CTOP', bias:-15, dur:3 },
    { text:'🏦 BankChain lands govt contract!',     ticker:'CBNK', bias:+20, dur:3 },
    { text:'📉 MARKET CRASH: Panic selling!',       ticker:'ALL',  bias:-20, dur:5 },
    { text:'🚀 BULL SIGNAL: All sectors up!',       ticker:'ALL',  bias:+15, dur:4 },
    { text:'⛏️ Commodity shortage spikes prices!',  ticker:'CVEX', bias:+30, dur:3 },
    { text:'📉 Regulation threat hits AI stocks!',  ticker:'CVAI', bias:-18, dur:4 },
    { text:'💥 Interest rate hike incoming!',       ticker:'ALL',  bias:-12, dur:5 },
    { text:'🔥 VC funding flood — tech surge!',     ticker:'CVTK', bias:+22, dur:3 },
    { text:'📊 Earnings beat expectations!',        ticker:'CBNK', bias:+16, dur:3 },
  ];

  /* ─── END LESSON ─────────────────────────────────────────────── */
  const LESSON = 'Smart investors buy low, sell high, and never panic-sell during dips. Timing matters — patience and discipline beat emotional trading every time.';

  /* ─── STATE ──────────────────────────────────────────────────── */
  let G = null;
  let _tick = null, _countdown = null, _boostTimer = null, _newsTimer = null;

  /* ══════════════════════════════════════════════════════════════
     SCREEN ENTRY POINT
  ══════════════════════════════════════════════════════════════ */
  window.SCREENS.game_inv_stockarena = function () {
    G = null;
    setTimeout(initGame, 40);
    return buildShell();
  };

  /* ─── BUILD SHELL HTML ───────────────────────────────────────── */
  function buildShell() {
    return `
<style>
  /* ── root ── */
  #sa-root {
    position:absolute;inset:0;
    background:radial-gradient(ellipse at 50% -10%, #001f0a 0%, #03040c 60%, #020309 100%);
    overflow:hidden;font-family:'Inter',sans-serif;color:#fff;
    display:flex;flex-direction:column;
  }
  /* ── grid lines ambient ── */
  #sa-root::before {
    content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background-image:
      linear-gradient(rgba(0,200,83,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,200,83,.04) 1px, transparent 1px);
    background-size:42px 42px;
  }
  /* ── topbar ── */
  #sa-top {
    position:relative;z-index:6;display:flex;align-items:center;
    gap:8px;padding:11px 14px 9px;flex-shrink:0;
    background:linear-gradient(180deg,rgba(0,6,2,.95),rgba(0,6,2,.6));
    border-bottom:1px solid rgba(0,200,83,.18);
  }
  .sa-back {
    padding:6px 13px;border-radius:8px;
    border:1px solid rgba(0,200,83,.4);background:rgba(0,200,83,.1);
    color:${AC2};font-family:'Orbitron',sans-serif;font-size:.58rem;
    letter-spacing:.12em;cursor:pointer;white-space:nowrap;flex-shrink:0;
    transition:background .15s;
  }
  .sa-back:hover { background:rgba(0,200,83,.2); }
  #sa-gametitle {
    font-family:'Orbitron',sans-serif;font-size:.65rem;letter-spacing:.2em;
    color:${AC};flex:1;text-align:center;text-shadow:0 0 12px ${AC}88;
  }
  #sa-timer {
    font-family:'Orbitron',sans-serif;font-size:.85rem;color:${GOLD};
    min-width:46px;text-align:right;font-variant-numeric:tabular-nums;
  }
  /* ── HUD bar ── */
  #sa-hud {
    position:relative;z-index:6;display:flex;gap:5px;
    padding:6px 10px 5px;flex-shrink:0;
  }
  .sa-hb {
    flex:1;text-align:center;padding:5px 3px;border-radius:9px;
    background:rgba(0,200,83,.07);border:1px solid rgba(0,200,83,.16);
  }
  .sa-hb-lbl {
    font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.1em;
    color:rgba(255,255,255,.4);text-transform:uppercase;
  }
  .sa-hb-val {
    font-family:'Orbitron',sans-serif;font-size:.82rem;font-weight:900;
    color:#fff;line-height:1.25;font-variant-numeric:tabular-nums;
  }
  /* ── level badge ── */
  #sa-lvbadge {
    position:relative;z-index:6;flex-shrink:0;
    font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.15em;
    text-align:center;padding:3px 0 4px;
    color:rgba(255,255,255,.55);
    border-bottom:1px solid rgba(0,200,83,.1);
  }
  /* ── chart strip ── */
  #sa-chartstrip {
    position:relative;z-index:5;flex-shrink:0;
    height:64px;overflow:hidden;
    border-bottom:1px solid rgba(0,200,83,.12);
  }
  #sa-canvas {
    position:absolute;inset:0;width:100%;height:100%;display:block;
  }
  /* ── ticker tape ── */
  #sa-tape {
    position:relative;z-index:5;flex-shrink:0;
    height:24px;overflow:hidden;
    border-bottom:1px solid rgba(0,200,83,.1);
    background:rgba(0,10,4,.7);
  }
  #sa-tape-inner {
    display:flex;align-items:center;height:100%;white-space:nowrap;
    font-family:'Orbitron',sans-serif;font-size:.46rem;letter-spacing:.08em;
    gap:0;
    animation:saTape 22s linear infinite;
  }
  @keyframes saTape { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .sa-tick-item {
    padding:0 16px;border-right:1px solid rgba(0,200,83,.15);
    display:inline-flex;align-items:center;gap:5px;height:100%;
  }
  .sa-tick-up { color:${AC2}; }
  .sa-tick-dn { color:${RED}; }
  .sa-tick-fl { color:rgba(255,255,255,.4); }
  /* ── scrollable stock list ── */
  #sa-stocks {
    position:relative;z-index:5;flex:1;overflow-y:auto;
    padding:8px 9px;display:flex;flex-direction:column;gap:7px;
  }
  #sa-stocks::-webkit-scrollbar { width:3px; }
  #sa-stocks::-webkit-scrollbar-thumb { background:rgba(0,200,83,.3);border-radius:3px; }
  /* ── stock row card ── */
  .sa-card {
    border-radius:12px;border:1.5px solid rgba(0,200,83,.18);
    background:rgba(0,20,8,.65);padding:10px 12px;
    cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .09s;
    display:flex;align-items:center;gap:10px;
    -webkit-tap-highlight-color:transparent;
    position:relative;overflow:hidden;
  }
  .sa-card::before {
    content:'';position:absolute;inset:0;
    background:linear-gradient(90deg,rgba(0,200,83,.04),transparent);
    pointer-events:none;
  }
  .sa-card.selected {
    border-color:${AC};
    box-shadow:0 0 22px rgba(0,200,83,.38),inset 0 0 12px rgba(0,200,83,.08);
    transform:scale(1.015);
  }
  .sa-card.boost-glow {
    border-color:${GOLD};
    box-shadow:0 0 22px rgba(255,214,0,.5);
    animation:saBoostPulse .7s ease-in-out infinite alternate;
  }
  @keyframes saBoostPulse {
    0% { box-shadow:0 0 12px rgba(255,214,0,.4); }
    100% { box-shadow:0 0 32px rgba(255,214,0,.85), 0 0 60px rgba(255,214,0,.2); }
  }
  .sa-card-icon { font-size:1.5rem;flex-shrink:0;line-height:1; }
  .sa-card-info { flex:1;min-width:0; }
  .sa-card-ticker {
    font-family:'Orbitron',sans-serif;font-size:.68rem;font-weight:900;
    letter-spacing:.08em;color:${AC};line-height:1;
  }
  .sa-card-name {
    font-size:.52rem;color:rgba(255,255,255,.5);margin-top:1px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .sa-card-owned {
    font-size:.43rem;color:rgba(0,200,83,.7);margin-top:2px;
    font-family:'Orbitron',sans-serif;letter-spacing:.05em;
  }
  .sa-price-col { text-align:right;flex-shrink:0; }
  .sa-price {
    font-family:'Orbitron',sans-serif;font-size:.92rem;font-weight:900;
    line-height:1;font-variant-numeric:tabular-nums;
  }
  .sa-pchg {
    font-size:.48rem;font-family:'Orbitron',sans-serif;
    letter-spacing:.06em;margin-top:2px;font-variant-numeric:tabular-nums;
  }
  .sa-up { color:${AC2}; } .sa-dn { color:${RED}; } .sa-fl { color:rgba(255,255,255,.4); }
  /* mini sparkline in card */
  .sa-spark { flex-shrink:0; }
  /* ── qty row ── */
  #sa-qty-row {
    position:relative;z-index:6;display:flex;align-items:center;gap:7px;
    padding:6px 10px;flex-shrink:0;
    border-top:1px solid rgba(0,200,83,.1);
    background:rgba(0,4,2,.8);
  }
  .sa-ql { font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.1em;color:rgba(255,255,255,.45); }
  .sa-qbtn {
    width:30px;height:30px;border-radius:8px;
    border:1px solid rgba(0,200,83,.3);background:rgba(0,200,83,.1);
    color:${AC2};font-size:.95rem;cursor:pointer;
    display:flex;align-items:center;justify-content:center;font-weight:900;
    transition:background .12s;flex-shrink:0;
  }
  .sa-qbtn:hover { background:rgba(0,200,83,.22); }
  #sa-qval { font-family:'Orbitron',sans-serif;font-size:.82rem;color:#fff;min-width:20px;text-align:center; }
  #sa-cost-info { font-family:'Orbitron',sans-serif;font-size:.44rem;color:rgba(255,255,255,.4);flex:1;text-align:right;letter-spacing:.04em; }
  /* ── action buttons ── */
  #sa-actions {
    position:relative;z-index:6;display:flex;gap:7px;
    padding:7px 10px 10px;flex-shrink:0;
    background:rgba(0,4,2,.85);border-top:1px solid rgba(0,200,83,.1);
  }
  .sa-abtn {
    flex:1;padding:13px 4px;border:none;border-radius:12px;
    font-family:'Orbitron',sans-serif;font-size:.62rem;font-weight:900;
    letter-spacing:.1em;cursor:pointer;
    transition:transform .08s,box-shadow .15s;
    -webkit-tap-highlight-color:transparent;
  }
  .sa-abtn:active { transform:scale(.92); }
  .sa-btn-buy  {
    background:linear-gradient(135deg,${AC},#00952e);color:#001a08;
    box-shadow:0 4px 20px rgba(0,200,83,.35);
  }
  .sa-btn-buy:hover { box-shadow:0 4px 28px rgba(0,200,83,.6); }
  .sa-btn-sell {
    background:linear-gradient(135deg,${GOLD},#E65100);color:#1a0800;
    box-shadow:0 4px 20px rgba(255,214,0,.25);
  }
  .sa-btn-sell:hover { box-shadow:0 4px 28px rgba(255,214,0,.5); }
  .sa-btn-hold {
    background:rgba(0,200,83,.08);color:${AC2};
    border:1px solid rgba(0,200,83,.3)!important;
  }
  /* ── overlay ── */
  .sa-ov {
    position:absolute;inset:0;z-index:12;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,3,1,.88);backdrop-filter:blur(7px);
    padding:20px;
  }
  .sa-panel {
    max-width:400px;width:100%;text-align:center;padding:26px 20px;
    border-radius:20px;border:1.5px solid rgba(0,200,83,.35);
    background:linear-gradient(155deg,rgba(0,18,7,.98),rgba(0,8,3,.98));
    box-shadow:0 0 60px rgba(0,200,83,.25);
    animation:saPanelIn .32s ease;
  }
  @keyframes saPanelIn { 0%{transform:scale(.88);opacity:0} 100%{transform:scale(1);opacity:1} }
  /* ── AI rival bar ── */
  #sa-rival {
    position:relative;z-index:5;flex-shrink:0;
    display:flex;align-items:center;gap:8px;
    padding:4px 10px 5px;
    border-bottom:1px solid rgba(255,23,68,.12);
    background:rgba(255,0,30,.04);
  }
  #sa-rival-lbl {
    font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;
    color:rgba(255,60,60,.7);white-space:nowrap;flex-shrink:0;
  }
  #sa-rival-bar-wrap {
    flex:1;height:6px;border-radius:4px;
    background:rgba(255,255,255,.1);overflow:hidden;
  }
  #sa-rival-bar {
    height:100%;background:linear-gradient(90deg,${RED},#FF6D00);
    transition:width .5s;border-radius:4px;
  }
  #sa-rival-val {
    font-family:'Orbitron',sans-serif;font-size:.48rem;
    color:rgba(255,120,120,.9);min-width:52px;text-align:right;
    font-variant-numeric:tabular-nums;
  }
  /* ── news banner ── */
  .sa-news {
    position:absolute;top:0;left:0;right:0;z-index:10;
    display:flex;align-items:center;gap:10px;
    padding:8px 14px;pointer-events:none;
    border-bottom:1.5px solid;
    backdrop-filter:blur(4px);
    animation:saNewsIn .3s ease;
  }
  @keyframes saNewsIn { 0%{transform:translateY(-100%);opacity:0} 100%{transform:translateY(0);opacity:1} }
  /* ── toast ── */
  .sa-toast {
    position:absolute;bottom:125px;left:50%;
    transform:translateX(-50%);z-index:11;
    pointer-events:none;white-space:nowrap;
    font-family:'Inter',sans-serif;font-weight:800;font-size:.76rem;
    padding:8px 16px;border-radius:20px;
    box-shadow:0 4px 20px rgba(0,0,0,.5);
    animation:saToastUp 2.2s ease forwards;
  }
  @keyframes saToastUp {
    0%  { opacity:0; transform:translateX(-50%) translateY(10px); }
    18% { opacity:1; transform:translateX(-50%) translateY(0); }
    78% { opacity:1; }
    100%{ opacity:0; transform:translateX(-50%) translateY(-20px); }
  }
  /* ── boost pickup ── */
  .sa-boost-pickup {
    position:absolute;z-index:8;
    font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.1em;
    color:${GOLD};background:rgba(10,6,0,.92);
    border:1.5px solid ${GOLD};border-radius:30px;
    padding:6px 14px;cursor:pointer;
    box-shadow:0 0 20px rgba(255,214,0,.5);
    animation:saBoostFloat 2s ease-in-out infinite alternate;
    -webkit-tap-highlight-color:transparent;
  }
  @keyframes saBoostFloat {
    0% { transform:translateY(0); }
    100% { transform:translateY(-10px); }
  }
  /* ── stars ── */
  .sa-stars { font-size:2rem;letter-spacing:4px;margin:8px 0; }
  /* ── summary rows ── */
  .sa-srow {
    display:flex;justify-content:space-between;align-items:center;
    padding:7px 10px;border-radius:8px;
    background:rgba(0,200,83,.06);margin-bottom:5px;
  }
  .sa-srow-lbl { font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.45); }
  .sa-srow-val { font-family:'Orbitron',sans-serif;font-size:.72rem;font-weight:900; }
  /* ── ranking board ── */
  #sa-rank {
    position:absolute;right:10px;top:50%;transform:translateY(-50%);
    z-index:4;pointer-events:none;
    font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.07em;
  }
  .sa-rank-row {
    display:flex;align-items:center;gap:5px;
    background:rgba(0,10,4,.75);border:1px solid rgba(0,200,83,.18);
    border-radius:7px;padding:4px 8px;margin-bottom:3px;
    backdrop-filter:blur(4px);
    font-variant-numeric:tabular-nums;
  }
  /* ── level select ── */
  #sa-lvsel {
    position:absolute;inset:0;z-index:12;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:rgba(0,3,1,.95);padding:24px;
  }
</style>
<div id="sa-root">
  <div id="sa-top">
    <button class="sa-back" onclick="inv_stockarenaExit()">← HUB</button>
    <div id="sa-gametitle">STOCK MARKET ARENA</div>
    <div id="sa-timer">${SESSION_TIME}s</div>
  </div>

  <!-- HUD -->
  <div id="sa-hud">
    <div class="sa-hb"><div class="sa-hb-lbl">CASH</div><div class="sa-hb-val" id="sa-cash">$2,000</div></div>
    <div class="sa-hb"><div class="sa-hb-lbl">PORTFOLIO</div><div class="sa-hb-val" id="sa-port">$2,000</div></div>
    <div class="sa-hb"><div class="sa-hb-lbl">GAIN/LOSS</div><div class="sa-hb-val" id="sa-gain">+$0</div></div>
    <div class="sa-hb"><div class="sa-hb-lbl">BOOSTS</div><div class="sa-hb-val" id="sa-boosts" style="color:${GOLD}">0</div></div>
  </div>

  <!-- Level badge -->
  <div id="sa-lvbadge">LEVEL 1 — LEARN</div>

  <!-- AI rival (hidden until L2) -->
  <div id="sa-rival" style="display:none">
    <div id="sa-rival-lbl">AI RIVAL</div>
    <div id="sa-rival-bar-wrap"><div id="sa-rival-bar" style="width:50%"></div></div>
    <div id="sa-rival-val">$2,000</div>
  </div>

  <!-- Holographic chart strip -->
  <div id="sa-chartstrip">
    <canvas id="sa-canvas"></canvas>
  </div>

  <!-- Ticker tape -->
  <div id="sa-tape"><div id="sa-tape-inner"></div></div>

  <!-- Stock list -->
  <div id="sa-stocks"></div>

  <!-- Qty selector -->
  <div id="sa-qty-row">
    <div class="sa-ql">QTY</div>
    <button class="sa-qbtn" onclick="saQty(-1)">−</button>
    <div id="sa-qval">1</div>
    <button class="sa-qbtn" onclick="saQty(1)">+</button>
    <div id="sa-cost-info">Select a stock</div>
  </div>

  <!-- Action buttons -->
  <div id="sa-actions">
    <button class="sa-abtn sa-btn-buy"  onclick="saAct('buy')">BUY</button>
    <button class="sa-abtn sa-btn-sell" onclick="saAct('sell')">SELL</button>
    <button class="sa-abtn sa-btn-hold" onclick="saAct('hold')">HOLD</button>
  </div>

  <!-- Level select screen (shown first) -->
  <div id="sa-lvsel"></div>

  <!-- End overlay (hidden) -->
  <div class="sa-ov" id="sa-over" style="display:none"></div>
</div>`;
  }

  /* ══════════════════════════════════════════════════════════════
     INIT GAME
  ══════════════════════════════════════════════════════════════ */
  function initGame() {
    G = null;
    showLevelSelect();
  }

  function showLevelSelect() {
    var el = document.getElementById('sa-lvsel');
    if (!el) return;
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.innerHTML =
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.5rem;letter-spacing:.2em;color:' + AC + ';margin-bottom:6px">INVESTOPIA HUB</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:1.1rem;font-weight:900;letter-spacing:.1em;text-align:center;margin-bottom:4px;text-shadow:0 0 20px ' + AC + '88">STOCK MARKET ARENA</div>' +
      '<div style="font-size:.62rem;color:rgba(255,255,255,.55);text-align:center;margin-bottom:24px;line-height:1.6;max-width:280px">Compete in the trading arena. Buy low, sell high, outpace the AI rival.</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:300px">' +
        lvCard(1, '🏫 LEVEL 1 — LEARN', '4 stocks · Slow market · Market Boosts · Clear trends', '#saStartL1') +
        lvCard(2, '⚡ LEVEL 2 — MASTER', '6 stocks · Breaking news · AI rival · Market crashes', '#saStartL2') +
      '</div>';
    el.querySelector('#saStartL1').onclick = function(){ startLevel(1); };
    el.querySelector('#saStartL2').onclick = function(){ startLevel(2); };
  }

  function lvCard(n, title, desc, id) {
    var col = n === 1 ? AC : '#FF6D00';
    return '<div id="' + id.slice(1) + '" style="padding:16px;border-radius:14px;border:1.5px solid rgba(' + (n===1?'0,200,83':'255,109,0') + ',.35);background:rgba(' + (n===1?'0,200,83':'255,109,0') + ',.07);cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor=\'' + col + '\';this.style.boxShadow=\'0 0 22px ' + col + '44\'" onmouseout="this.style.borderColor=\'rgba(' + (n===1?'0,200,83':'255,109,0') + ',.35)\';this.style.boxShadow=\'none\'">' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.68rem;font-weight:900;color:' + col + ';margin-bottom:5px">' + title + '</div>' +
      '<div style="font-size:.58rem;color:rgba(255,255,255,.55);line-height:1.5">' + desc + '</div>' +
    '</div>';
  }

  function startLevel(lv) {
    var lvSel = document.getElementById('sa-lvsel');
    if (lvSel) lvSel.style.display = 'none';

    var rawStocks = lv === 1 ? STOCKS_L1 : STOCKS_L2;
    var stocks = rawStocks.map(function(s) {
      return {
        ticker: s.ticker,
        name: s.name,
        icon: s.icon,
        vol: s.vol,
        trend: s.trend,
        price: s.base,
        prev: s.base,
        base: s.base,
        shares: 0,
        history: [s.base, s.base, s.base, s.base, s.base],
        newsBoost: 0,
        newsBias: 0,
        hasBoost: false,
      };
    });

    G = {
      phase: 'play',
      level: lv,
      timeLeft: SESSION_TIME * 1000,
      cash: START_CASH,
      startCash: START_CASH,
      stocks: stocks,
      selected: null,
      qty: 1,
      boosts: 0,
      trades: 0,
      profitableTrades: 0,
      panicSells: 0,
      rivalValue: START_CASH,
      rivalGrowthRate: lv === 1 ? 0 : 0.012,
      nextBoostIn: BOOST_SPAWN_INT * 1000,
      tickMs: lv === 1 ? TICK_MS_L1 : TICK_MS_L2,
      newsIdx: 0,
      nextNewsIn: lv === 2 ? 10000 : Infinity,
      activeBoostIdx: -1,  // which stock card has the floating boost
    };

    // Update level badge
    var badge = document.getElementById('sa-lvbadge');
    if (badge) badge.textContent = lv === 1 ? 'LEVEL 1 — LEARN' : 'LEVEL 2 — MASTER';

    // Show rival bar on L2
    var rival = document.getElementById('sa-rival');
    if (rival) rival.style.display = lv === 2 ? 'flex' : 'none';

    mountGame();
  }

  /* ══════════════════════════════════════════════════════════════
     MOUNT — wire up canvas, timers, render
  ══════════════════════════════════════════════════════════════ */
  function mountGame() {
    if (!G) return;
    setupCanvas();
    renderStocks();
    syncHUD();
    buildTape();
    startTimers();
  }

  /* ── canvas chart setup ──────────────────────────────────────── */
  var _ctx = null, _cv = null, _raf = null, _resizeHandler = null;

  function setupCanvas() {
    _cv = document.getElementById('sa-canvas');
    if (!_cv) return;
    _ctx = _cv.getContext('2d');
    // Remove any previously registered resize handler before adding a new one
    if (_resizeHandler) {
      window.removeEventListener('resize', _resizeHandler);
      _resizeHandler = null;
    }
    _resizeHandler = function() {
      if (!_cv) return;
      _cv.width  = _cv.clientWidth  * (window.devicePixelRatio || 1);
      _cv.height = _cv.clientHeight * (window.devicePixelRatio || 1);
      _ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    };
    _resizeHandler();
    window.addEventListener('resize', _resizeHandler);
    drawCharts();
  }

  function drawCharts() {
    if (!_ctx || !_cv || !G) return;
    var W = _cv.clientWidth, H = _cv.clientHeight;
    _ctx.clearRect(0, 0, W, H);

    if (!G || !G.stocks.length) return;

    var cols = G.stocks.length;
    var sw = W / cols;

    G.stocks.forEach(function(st, i) {
      var x0 = i * sw;
      var hist = st.history;
      if (hist.length < 2) return;

      // find min/max of history for this stock
      var mn = Math.min.apply(null, hist), mx = Math.max.apply(null, hist);
      var rng = mx - mn || 1;
      var pad = 10;
      var drawH = H - pad * 2;

      // line color
      var up = hist[hist.length - 1] >= hist[0];
      var lineCol = up ? AC2 : RED;

      // fill
      _ctx.beginPath();
      hist.forEach(function(p, j) {
        var px = x0 + (j / (hist.length - 1)) * sw;
        var py = pad + drawH - ((p - mn) / rng) * drawH;
        j === 0 ? _ctx.moveTo(px, py) : _ctx.lineTo(px, py);
      });
      // close fill path to bottom
      _ctx.lineTo(x0 + sw, H);
      _ctx.lineTo(x0, H);
      _ctx.closePath();
      var grad = _ctx.createLinearGradient(0, pad, 0, H);
      grad.addColorStop(0, up ? 'rgba(0,200,83,.28)' : 'rgba(255,23,68,.22)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      _ctx.fillStyle = grad;
      _ctx.fill();

      // line
      _ctx.beginPath();
      hist.forEach(function(p, j) {
        var px = x0 + (j / (hist.length - 1)) * sw;
        var py = pad + drawH - ((p - mn) / rng) * drawH;
        j === 0 ? _ctx.moveTo(px, py) : _ctx.lineTo(px, py);
      });
      _ctx.strokeStyle = lineCol;
      _ctx.lineWidth = 1.5;
      _ctx.shadowColor = lineCol;
      _ctx.shadowBlur = 5;
      _ctx.stroke();
      _ctx.shadowBlur = 0;

      // divider
      if (i > 0) {
        _ctx.beginPath();
        _ctx.moveTo(x0, 0);
        _ctx.lineTo(x0, H);
        _ctx.strokeStyle = 'rgba(0,200,83,.1)';
        _ctx.lineWidth = 1;
        _ctx.stroke();
      }

      // ticker label
      _ctx.fillStyle = 'rgba(0,200,83,.8)';
      _ctx.font = '500 9px Orbitron, monospace';
      _ctx.fillText(st.ticker, x0 + 4, pad + 10);
    });
  }

  /* ── ticker tape ─────────────────────────────────────────────── */
  function buildTape() {
    var el = document.getElementById('sa-tape-inner');
    if (!el || !G) return;
    var html = '';
    // double for seamless loop
    for (var pass = 0; pass < 2; pass++) {
      G.stocks.forEach(function(st) {
        var up = st.price >= st.prev;
        var flat = st.price === st.prev;
        var cls = flat ? 'sa-tick-fl' : up ? 'sa-tick-up' : 'sa-tick-dn';
        var arr = flat ? '─' : up ? '▲' : '▼';
        var chg = st.prev > 0 ? ((st.price - st.prev) / st.prev * 100).toFixed(2) : '0.00';
        html += '<span class="sa-tick-item ' + cls + '">' +
          st.icon + ' ' + st.ticker + ' $' + st.price.toFixed(2) + ' ' + arr + ' ' + chg + '%' +
        '</span>';
      });
    }
    el.innerHTML = html;
  }

  /* ── render stock cards ──────────────────────────────────────── */
  function renderStocks() {
    var el = document.getElementById('sa-stocks');
    if (!el || !G) return;
    var html = '';
    G.stocks.forEach(function(st, idx) {
      var up   = st.price > st.prev;
      var flat = st.price === st.prev;
      var dir  = flat ? 'fl' : up ? 'up' : 'dn';
      var arr  = flat ? '─' : up ? '▲' : '▼';
      var chg  = st.prev > 0 ? ((st.price - st.prev) / st.prev * 100).toFixed(2) : '0.00';
      var sel  = G.selected === st.ticker;
      var boostCls = st.hasBoost ? ' boost-glow' : '';
      var selCls   = sel ? ' selected' : '';

      // mini sparkline via inline SVG
      var spark = makeSpark(st.history, up ? AC2 : RED);

      html += '<div class="sa-card' + selCls + boostCls + '" onclick="saSelect(\'' + st.ticker + '\')">' +
        '<div class="sa-card-icon">' + st.icon + '</div>' +
        '<div class="sa-card-info">' +
          '<div class="sa-card-ticker">' + st.ticker + '</div>' +
          '<div class="sa-card-name">' + st.name + '</div>' +
          (st.shares > 0
            ? '<div class="sa-card-owned">Own: ' + st.shares + ' sh · $' + (st.shares * st.price).toFixed(0) + '</div>'
            : '') +
          (st.hasBoost
            ? '<div style="font-family:\'Orbitron\',sans-serif;font-size:.42rem;color:' + GOLD + ';letter-spacing:.07em;margin-top:2px">⚡ MARKET BOOST active</div>'
            : '') +
        '</div>' +
        '<div class="sa-spark">' + spark + '</div>' +
        '<div class="sa-price-col">' +
          '<div class="sa-price sa-' + dir + '">$' + st.price.toFixed(2) + '</div>' +
          '<div class="sa-pchg sa-' + dir + '">' + arr + ' ' + chg + '%</div>' +
        '</div>' +
      '</div>';
    });
    el.innerHTML = html;
    updateCostInfo();
  }

  function makeSpark(hist, col) {
    if (hist.length < 2) return '';
    var W = 42, H = 28, pad = 3;
    var mn = Math.min.apply(null, hist);
    var mx = Math.max.apply(null, hist);
    var rng = mx - mn || 1;
    var pts = hist.map(function(v, i) {
      var x = pad + (i / (hist.length - 1)) * (W - pad * 2);
      var y = pad + (H - pad * 2) - ((v - mn) / rng) * (H - pad * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block">' +
      '<polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  }

  /* ── HUD sync ────────────────────────────────────────────────── */
  function syncHUD() {
    if (!G) return;
    var tv   = totalValue();
    var gain = tv - G.startCash;

    var cashEl = document.getElementById('sa-cash');
    if (cashEl) cashEl.textContent = fmt(G.cash);

    var portEl = document.getElementById('sa-port');
    if (portEl) portEl.textContent = fmt(tv);

    var gainEl = document.getElementById('sa-gain');
    if (gainEl) {
      gainEl.textContent = (gain >= 0 ? '+' : '') + fmt(gain);
      gainEl.style.color = gain >= 0 ? AC2 : RED;
    }

    var boostEl = document.getElementById('sa-boosts');
    if (boostEl) boostEl.textContent = G.boosts;

    // Rival bar (L2)
    if (G.level === 2) {
      var rivalVal = document.getElementById('sa-rival-val');
      var rivalBar = document.getElementById('sa-rival-bar');
      if (rivalVal) rivalVal.textContent = fmt(G.rivalValue);
      if (rivalBar) {
        var pct = Math.min(100, Math.max(0, (G.rivalValue / (G.startCash * 2)) * 100));
        rivalBar.style.width = pct + '%';
      }
    }
  }

  function fmt(n) { return '$' + Math.round(Math.abs(n)).toLocaleString(); }
  function totalValue() {
    if (!G) return 0;
    return G.stocks.reduce(function(s, st) { return s + st.shares * st.price; }, G.cash);
  }
  function getStock(ticker) {
    for (var i = 0; i < G.stocks.length; i++) {
      if (G.stocks[i].ticker === ticker) return G.stocks[i];
    }
    return null;
  }

  /* ── cost info ───────────────────────────────────────────────── */
  function updateCostInfo() {
    var el = document.getElementById('sa-cost-info');
    if (!el || !G) return;
    if (!G.selected) { el.textContent = 'Select a stock to trade'; return; }
    var st = getStock(G.selected);
    if (!st) return;
    var cost = st.price * G.qty;
    el.textContent = 'Cost: ' + fmt(cost) + '  ·  Own: ' + st.shares;
  }

  /* ══════════════════════════════════════════════════════════════
     TIMERS
  ══════════════════════════════════════════════════════════════ */
  function startTimers() {
    stopTimers();
    _tick = setInterval(tickPrices, G.tickMs);
    _countdown = setInterval(tickTimer, 200);
  }

  function stopTimers() {
    if (_tick)     { clearInterval(_tick);     _tick = null; }
    if (_countdown){ clearInterval(_countdown); _countdown = null; }
  }

  /* ── price tick ──────────────────────────────────────────────── */
  function tickPrices() {
    if (!G || G.phase !== 'play') return;

    G.stocks.forEach(function(st) {
      st.prev = st.price;

      // base random movement
      var swing = (Math.random() - 0.48) * st.vol * st.price;
      // trend bias (level 1 has clearer trends)
      var trendBias = st.trend * st.price;
      // news bias if active
      var nb = 0;
      if (st.newsBoost > 0) {
        nb = st.newsBias * st.price;
        st.newsBoost--;
      }
      // boost doubles positive movement
      if (st.hasBoost && swing > 0) swing *= 2;

      var next = st.price + swing + trendBias + nb;
      st.price = Math.max(PRICE_MIN, Math.min(PRICE_MAX, parseFloat(next.toFixed(2))));
      st.history.push(st.price);
      if (st.history.length > 28) st.history.shift();
    });

    // AI rival growth (L2)
    if (G.level === 2) {
      G.rivalValue *= (1 + G.rivalGrowthRate / 2 + (Math.random() - 0.4) * 0.008);
      G.rivalValue = Math.max(G.startCash * 0.5, G.rivalValue);
    }

    // Boost timer countdown
    G.nextBoostIn -= G.tickMs;
    if (G.nextBoostIn <= 0) {
      spawnBoost();
      G.nextBoostIn = BOOST_SPAWN_INT * 1000 + Math.random() * 8000;
    }

    // News timer (L2)
    if (G.level === 2) {
      G.nextNewsIn -= G.tickMs;
      if (G.nextNewsIn <= 0) {
        fireNews();
        G.nextNewsIn = 8000 + Math.random() * 10000;
      }
    }

    renderStocks();
    syncHUD();
    buildTape();
    drawCharts();
  }

  /* ── countdown ───────────────────────────────────────────────── */
  function tickTimer() {
    if (!G || G.phase !== 'play') return;
    G.timeLeft -= 200;
    var el = document.getElementById('sa-timer');
    if (el) {
      var s = Math.max(0, Math.ceil(G.timeLeft / 1000));
      el.textContent = s + 's';
      el.style.color = s <= 10 ? RED : GOLD;
    }
    if (G.timeLeft <= 0) endGame();
  }

  /* ── news events ─────────────────────────────────────────────── */
  function fireNews() {
    if (!G || G.phase !== 'play') return;
    var ev = NEWS[G.newsIdx % NEWS.length];
    G.newsIdx++;

    // apply bias to affected stocks
    G.stocks.forEach(function(st) {
      if (ev.ticker === 'ALL' || ev.ticker === st.ticker) {
        var pctBias = ev.bias / 100;
        st.newsBias = pctBias * (0.7 + Math.random() * 0.6);
        st.newsBoost = ev.dur;
      }
    });

    showNews(ev);
  }

  function showNews(ev) {
    var root = document.getElementById('sa-root');
    if (!root) return;
    var old = document.getElementById('sa-newsbanner');
    if (old) old.remove();

    var isPos = ev.bias > 0;
    var col   = isPos ? AC2 : RED;
    var bg    = isPos ? 'rgba(0,10,4,.9)' : 'rgba(10,0,2,.9)';

    var div = document.createElement('div');
    div.id = 'sa-newsbanner';
    div.className = 'sa-news';
    div.style.cssText = 'background:' + bg + ';border-color:' + col + ';box-shadow:0 4px 20px ' + col + '44;';
    div.innerHTML =
      '<span style="font-size:1.1rem;flex-shrink:0">' + (isPos ? '📈' : '📉') + '</span>' +
      '<div style="flex:1">' +
        '<div style="font-family:\'Orbitron\',sans-serif;font-size:.55rem;font-weight:900;letter-spacing:.1em;color:' + col + '">' + ev.text + '</div>' +
        '<div style="font-size:.44rem;color:rgba(255,255,255,.5);margin-top:1px;font-family:\'Inter\',sans-serif">Affects: ' + (ev.ticker === 'ALL' ? 'ALL STOCKS' : ev.ticker) + ' · Duration: ' + ev.dur + ' ticks</div>' +
      '</div>' +
      '<span style="font-family:\'Orbitron\',sans-serif;font-size:.4rem;letter-spacing:.12em;color:rgba(255,255,255,.3);flex-shrink:0">LIVE</span>';
    root.appendChild(div);

    setTimeout(function() {
      if (div.parentNode) div.remove();
    }, 4500);
  }

  /* ── boost spawn ─────────────────────────────────────────────── */
  function spawnBoost() {
    if (!G || G.phase !== 'play') return;
    // attach boost to a random stock (mark it)
    var idx = Math.floor(Math.random() * G.stocks.length);
    G.activeBoostIdx = idx;
    G.stocks[idx].hasBoost = false; // not activated yet, just shows pickup cue
    renderStocks(); // will show "⚡ MARKET BOOST available" text via hasBoost flag

    // Place floating pickup div on top of the stock list
    var root = document.getElementById('sa-root');
    var stocksEl = document.getElementById('sa-stocks');
    if (!root || !stocksEl) return;

    var old = document.getElementById('sa-boost-float');
    if (old) old.remove();

    var div = document.createElement('div');
    div.id = 'sa-boost-float';
    div.className = 'sa-boost-pickup';
    div.innerHTML = '⚡ MARKET BOOST — tap to collect!';

    // Position it randomly in the stocks area
    var rect = stocksEl.getBoundingClientRect();
    var rootRect = root.getBoundingClientRect();
    var top  = rect.top  - rootRect.top  + 30 + Math.random() * (rect.height - 80);
    var left = 20 + Math.random() * (rect.width - 160);
    div.style.top  = Math.max(rect.top - rootRect.top + 10, top) + 'px';
    div.style.left = Math.max(10, left) + 'px';

    div.onclick = function() {
      collectBoost(idx);
      div.remove();
    };
    root.appendChild(div);

    // Auto-remove after 10s if not collected
    setTimeout(function() {
      if (div.parentNode) div.remove();
      if (G && G.activeBoostIdx === idx) {
        G.activeBoostIdx = -1;
        G.stocks[idx].hasBoost = false;
        renderStocks();
      }
    }, 10000);
  }

  function collectBoost(idx) {
    if (!G) return;
    G.boosts++;
    G.activeBoostIdx = -1;
    // Apply boost to that stock for 4 ticks
    if (G.stocks[idx]) {
      G.stocks[idx].hasBoost = true;
      // Auto-expire after 4 ticks (8 seconds)
      var ticker = G.stocks[idx].ticker;
      setTimeout(function() {
        if (!G) return;
        var s = getStock(ticker);
        if (s) s.hasBoost = false;
        renderStocks();
      }, G.tickMs * 4);
    }
    syncHUD();
    renderStocks();
    showToast('⚡ Market Boost collected! Price movement amplified!', GOLD);
  }

  /* ══════════════════════════════════════════════════════════════
     PLAYER ACTIONS
  ══════════════════════════════════════════════════════════════ */
  window.saSelect = function(ticker) {
    if (!G || G.phase !== 'play') return;
    G.selected = (G.selected === ticker) ? null : ticker;
    renderStocks();
    updateCostInfo();
  };

  window.saQty = function(delta) {
    if (!G) return;
    G.qty = Math.max(1, Math.min(20, G.qty + delta));
    var el = document.getElementById('sa-qval');
    if (el) el.textContent = G.qty;
    updateCostInfo();
  };

  window.saAct = function(action) {
    if (!G || G.phase !== 'play') return;
    if (action === 'hold') {
      showToast('HOLD — watching for the right moment...', AC2);
      return;
    }
    if (!G.selected) {
      showToast('Select a stock first!', GOLD);
      return;
    }
    var st = getStock(G.selected);
    if (!st) return;

    if (action === 'buy') {
      var cost = st.price * G.qty;
      if (cost > G.cash) {
        showToast('Not enough cash!', RED);
        return;
      }
      G.cash -= cost;
      st.shares += G.qty;
      G.trades++;
      showToast('Bought ' + G.qty + ' ' + st.ticker + ' @ $' + st.price.toFixed(2), AC2);
    } else if (action === 'sell') {
      if (st.shares < G.qty) {
        showToast('Not enough shares to sell!', RED);
        return;
      }
      var proceeds = st.price * G.qty;
      // Detect panic sell (selling on a significant dip)
      var isPanic = st.price < st.prev * 0.97 && st.shares > 0;
      if (isPanic) {
        G.panicSells++;
        showToast('Panic sell detected! Buy low — sell high!', RED);
        setTimeout(function() {
          showToast('Tip: Hold through dips — they often recover!', GOLD);
        }, 2300);
      } else {
        G.profitableTrades++;
        showToast('Sold ' + G.qty + ' ' + st.ticker + ' → +$' + proceeds.toFixed(0), AC2);
      }
      G.cash += proceeds;
      st.shares -= G.qty;
      G.trades++;
    }

    syncHUD();
    renderStocks();
    updateCostInfo();
  };

  /* ── toast ───────────────────────────────────────────────────── */
  function showToast(text, col) {
    var root = document.getElementById('sa-root');
    if (!root) return;
    var old = root.querySelector('.sa-toast');
    if (old) old.remove();
    var div = document.createElement('div');
    div.className = 'sa-toast';
    div.style.cssText = 'color:' + (col || AC2) + ';background:rgba(0,4,2,.92);border:1px solid ' + (col || AC2) + '44;';
    div.textContent = text;
    root.appendChild(div);
    setTimeout(function() { if (div.parentNode) div.remove(); }, 2400);
  }

  /* ══════════════════════════════════════════════════════════════
     END GAME
  ══════════════════════════════════════════════════════════════ */
  function endGame() {
    if (!G || G.phase === 'over') return;
    G.phase = 'over';
    stopTimers();

    // Remove any floating boosts or news
    var bf = document.getElementById('sa-boost-float');
    if (bf) bf.remove();
    var nb = document.getElementById('sa-newsbanner');
    if (nb) nb.remove();

    var tv   = totalValue();
    var gain = tv - G.startCash;
    var gainPct = (gain / G.startCash) * 100;

    // --- Star rating ---
    // 3★: gain >= 20% (L1) / 25% (L2) AND panic sells <= 1
    // 2★: gain >= 5%  OR any profit
    // 1★: any positive result
    var star3thresh = G.level === 1 ? 20 : 25;
    var star2thresh = 5;
    var stars;
    if (gainPct >= star3thresh && G.panicSells <= 1) {
      stars = 3;
    } else if (gainPct >= star2thresh) {
      stars = 2;
    } else if (gain >= 0) {
      stars = 1;
    } else {
      // Could still award 1 star for trying
      stars = gain > -G.startCash * 0.5 ? 1 : 0;
    }
    stars = Math.max(0, Math.min(3, stars));

    // Coins
    var is3star = stars === 3;
    var coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_inv_stockarena', { level: G.level, stars: stars, badge: 'Market Champion', is3star: is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('inv_wealth', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    // Beat the rival?
    var beatRival = G.level === 2 ? tv > G.rivalValue : true;

    // Wealth delta (for any wealthMeter hook)
    var wealthDelta = Math.round(gainPct * 10) / 10;

    showEndOverlay(stars, coins, tv, gain, gainPct, beatRival, wealthDelta);
  }

  function showEndOverlay(stars, coins, tv, gain, gainPct, beatRival, wealthDelta) {
    var el = document.getElementById('sa-over');
    if (!el) return;
    el.style.display = 'flex';

    var positive = gain >= 0;
    var heroEmoji = stars === 3 ? '🏆' : stars === 2 ? '📈' : gain >= 0 ? '📊' : '📉';
    var headline  = stars === 3 ? 'MARKET CHAMPION!' : stars === 2 ? 'PROFITABLE SESSION' : gain >= 0 ? 'BREAK EVEN' : 'MARKET CLOSED';
    var headCol   = stars === 3 ? GOLD : stars === 2 ? AC : '#fff';

    var starsHtml = '';
    for (var i = 1; i <= 3; i++) {
      starsHtml += '<span style="color:' + (i <= stars ? GOLD : 'rgba(255,255,255,.2)') + ';text-shadow:' + (i <= stars ? '0 0 14px ' + GOLD : 'none') + '">' + (i <= stars ? '★' : '☆') + '</span>';
    }

    el.innerHTML = '<div class="sa-panel">' +
      '<div style="font-size:2.4rem;margin-bottom:6px">' + heroEmoji + '</div>' +
      '<div style="font-family:\'Orbitron\',sans-serif;font-size:.55rem;letter-spacing:.2em;color:' + headCol + ';margin-bottom:4px">' + headline + '</div>' +
      '<div style="font-size:1.8rem;letter-spacing:6px;margin:6px 0 12px">' + starsHtml + '</div>' +

      // Summary rows
      '<div style="margin-bottom:12px">' +
        srow('STARTING CASH', '$' + G.startCash.toLocaleString(), '#fff') +
        srow('FINAL PORTFOLIO', '$' + Math.round(tv).toLocaleString(), positive ? AC2 : RED) +
        srow('TOTAL GAIN/LOSS', (gain >= 0 ? '+' : '') + '$' + Math.round(gain).toLocaleString() + ' (' + gainPct.toFixed(1) + '%)', positive ? AC2 : RED) +
        srow('TRADES MADE', G.trades, '#fff') +
        srow('PANIC SELLS', G.panicSells, G.panicSells > 2 ? RED : AC2) +
        srow('MARKET BOOSTS USED', G.boosts, GOLD) +
        (G.level === 2 ? srow('BEAT AI RIVAL', beatRival ? '✓ YES' : '✗ NO', beatRival ? AC2 : RED) : '') +
        srow('COINS EARNED', '+' + coins + ' 🪙', GOLD) +
      '</div>' +

      // Lesson
      '<div style="background:rgba(0,200,83,.07);border-left:3px solid ' + AC + ';border-radius:0 8px 8px 0;padding:10px;margin-bottom:14px;text-align:left">' +
        '<div style="font-family:\'Orbitron\',sans-serif;font-size:.4rem;letter-spacing:.14em;color:' + AC + ';margin-bottom:4px">LESSON</div>' +
        '<div style="font-size:.6rem;line-height:1.55;color:rgba(255,255,255,.8)">' + LESSON + '</div>' +
      '</div>' +

      // Buttons
      '<div style="display:flex;gap:7px;flex-wrap:wrap;justify-content:center">' +
        '<button onclick="saPlayAgain()" style="flex:1;min-width:110px;padding:11px;border:none;border-radius:11px;background:linear-gradient(135deg,' + AC + ',#00952e);color:#001a08;font-family:\'Orbitron\',sans-serif;font-size:.6rem;font-weight:900;letter-spacing:.1em;cursor:pointer">↺ PLAY AGAIN</button>' +
        '<button onclick="inv_stockarenaExit()" style="flex:1;min-width:100px;padding:11px;border:1px solid rgba(255,255,255,.2);border-radius:11px;background:rgba(255,255,255,.06);color:#fff;font-family:\'Orbitron\',sans-serif;font-size:.6rem;letter-spacing:.1em;cursor:pointer">← HUB</button>' +
      '</div>' +
    '</div>';
  }

  function srow(label, val, col) {
    return '<div class="sa-srow">' +
      '<div class="sa-srow-lbl">' + label + '</div>' +
      '<div class="sa-srow-val" style="color:' + (col || '#fff') + '">' + val + '</div>' +
    '</div>';
  }

  /* ── play again ──────────────────────────────────────────────── */
  window.saPlayAgain = function() {
    stopTimers();
    if (_resizeHandler) {
      window.removeEventListener('resize', _resizeHandler);
      _resizeHandler = null;
    }
    G = null;
    _ctx = null; _cv = null;
    var over = document.getElementById('sa-over');
    if (over) over.style.display = 'none';
    // Remove lingering elements
    ['sa-boost-float','sa-newsbanner'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });
    showLevelSelect();
    var lvSel = document.getElementById('sa-lvsel');
    if (lvSel) lvSel.style.display = 'flex';
  };

  /* ══════════════════════════════════════════════════════════════
     EXIT
  ══════════════════════════════════════════════════════════════ */
  window.inv_stockarenaExit = function() {
    stopTimers();
    if (_resizeHandler) {
      window.removeEventListener('resize', _resizeHandler);
      _resizeHandler = null;
    }
    G = null;
    _ctx = null; _cv = null;
    if (window.state) state.viewingWorld = 'investor';
    goTo('hub');
  };

})();
