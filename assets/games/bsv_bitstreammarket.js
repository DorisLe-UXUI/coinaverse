/* ════════════════════════════════════════════════════════════════
   BITSTREAM MARKET — Bitstream Valley Hub · Coinaverse
   Virtual economy trading sim. Futuristic holographic marketplace.
   Buy low, sell high, trade smart. Grow wallet to target before time runs out.
   Level 1 (Learn): Slow steady prices, small inventory, no pressure.
   Level 2 (Master): Supply limits, demand spikes, seasonal shifts, flash events.
   Win: Grow wallet to target value. Lose: Go bankrupt.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── ACCENT / THEME ────────────────────────────────────────── */
  const AC   = '#00FFFF';   // Bitstream cyan
  const AC2  = '#40FFFF';   // lighter cyan glow
  const GOLD = '#FFD700';
  const RED  = '#FF3366';
  const GREEN= '#00FF88';
  const PURPLE='#BB88FF';

  /* ─── ITEM CATALOGUE ─────────────────────────────────────────── */
  const ALL_ITEMS = [
    { id:'gem',    name:'Rare Gem',       icon:'💎', basePx:320,  vol:0.04, trend: 0.009, rarity:'common'  },
    { id:'blade',  name:'Cyber Blade',    icon:'⚔️',  basePx:480,  vol:0.06, trend: 0.012, rarity:'uncommon'},
    { id:'shield', name:'Data Shield',    icon:'🛡️',  basePx:260,  vol:0.035,trend: 0.007, rarity:'common'  },
    { id:'core',   name:'Neon Core',      icon:'🔮', basePx:550,  vol:0.07, trend: 0.015, rarity:'rare'    },
    { id:'chip',   name:'Quantum Chip',   icon:'🧩', basePx:180,  vol:0.05, trend:-0.006, rarity:'common'  },
    { id:'drone',  name:'Scout Drone',    icon:'🚁', basePx:410,  vol:0.065,trend: 0.010, rarity:'uncommon'},
    { id:'pass',   name:'Nexus Pass',     icon:'🎫', basePx:720,  vol:0.08, trend: 0.018, rarity:'rare'    },
    { id:'coil',   name:'Arc Coil',       icon:'⚡', basePx:230,  vol:0.045,trend:-0.004, rarity:'common'  },
  ];

  /* ─── LEVEL 1 items (subset, slower) ────────────────────────── */
  const ITEMS_L1 = ['gem','shield','chip','coil'].map(id => ALL_ITEMS.find(i=>i.id===id));
  /* ─── LEVEL 2 items (all) ────────────────────────────────────── */
  const ITEMS_L2 = ALL_ITEMS;
  /* ─── LEVEL 3 items (all, same catalogue — the challenge is tighter
     supply/time/events, not new goods) ──────────────────────────── */
  const ITEMS_L3 = ALL_ITEMS;

  /* ─── MARKET EVENTS (Level 2+) ───────────────────────────────── */
  const MARKET_EVENTS = [
    { text:'⚡ DEMAND SPIKE: Rare Gems flooding exchanges!',  id:'gem',   bias:+28, dur:4 },
    { text:'📉 OVERSUPPLY: Data Shields crashing!',          id:'shield', bias:-22, dur:4 },
    { text:'🔥 HYPE: Cyber Blades trending on BitNet!',      id:'blade',  bias:+35, dur:3 },
    { text:'💎 SHORTAGE: Neon Cores running out!',           id:'core',   bias:+40, dur:3 },
    { text:'📦 DUMP: Quantum Chips mass-liquidated!',        id:'chip',   bias:-30, dur:4 },
    { text:'🚁 NEWS: Scout Drone ban lifted — surge!',       id:'drone',  bias:+25, dur:3 },
    { text:'🎫 Nexus Pass season event starts!',             id:'pass',   bias:+45, dur:3 },
    { text:'📉 MARKET CRASH: All items falling!',            id:'ALL',    bias:-20, dur:5 },
    { text:'🚀 BULL MARKET: Everything surging!',            id:'ALL',    bias:+18, dur:4 },
    { text:'⚡ Arc Coils power shortage — demand up!',       id:'coil',   bias:+20, dur:3 },
    { text:'🔮 Neon Cores: New synthetic supply — crash!',   id:'core',   bias:-35, dur:4 },
    { text:'🛡️ Hackers: Data Shields in high demand!',       id:'shield', bias:+30, dur:3 },
  ];

  /* ─── MARKET EVENTS EXCLUSIVE TO LEVEL 3 (sharper swings, disjoint text) ─ */
  const MARKET_EVENTS_L3 = [
    { text:'🌪️ FLASH CRASH: Entire exchange in freefall!',    id:'ALL',    bias:-32, dur:3 },
    { text:'🐋 WHALE BUY: Nexus Pass cornered by big trader!', id:'pass',   bias:+55, dur:2 },
    { text:'⚙️ RECALL: Quantum Chips pulled from shelves!',   id:'chip',   bias:-40, dur:3 },
    { text:'🔥 VIRAL: Cyber Blade meme goes global!',         id:'blade',  bias:+50, dur:2 },
    { text:'🛰️ SUPPLY CHAIN BREAK: Scout Drones scarce!',      id:'drone',  bias:+38, dur:3 },
    { text:'💎 CARTEL DUMP: Rare Gems flood the market!',     id:'gem',    bias:-30, dur:3 },
    { text:'🚀 EVERYTHING RALLY: Whole exchange surges!',     id:'ALL',    bias:+26, dur:3 },
  ];

  /* ─── END LESSON ─────────────────────────────────────────────── */
  const LESSON = 'In any market — digital or real — prices are set by supply and demand. Buying when demand is low and selling when it is high is the foundation of trading. Patience, timing, and reading market signals matter more than luck.';

  /* ─── GAME CONSTANTS ─────────────────────────────────────────── */
  const START_WALLET_L1 = 4200;
  const TARGET_L1       = 6000;
  const TIME_L1         = 120;  // seconds

  const START_WALLET_L2 = 3500;
  const TARGET_L2       = 7000;
  const TIME_L2         = 150;  // seconds

  const START_WALLET_L3 = 3000;
  const TARGET_L3       = 9000;
  const TIME_L3          = 170; // seconds

  const TICK_MS_L1      = 2800;
  const TICK_MS_L2      = 1800;
  const TICK_MS_L3      = 1200;
  const MAX_HELD_EACH   = 5;    // max qty of one item you can hold
  const SUPPLY_MAX_L2   = 8;    // items have limited stock in L2
  const SUPPLY_MAX_L3   = 5;    // L3: tighter stock than L2 — scarcer, harder

  /* ─── PER-LEVEL CONFIG TABLE (keyed by the numeric level, 1/2/3) ───────
     Every ternary that used to say "lvl === 1 ? X : Y" now reads this table
     instead, so adding/tuning a level never requires touching game logic. */
  const LEVEL_CFG = {
    1: {
      items: ITEMS_L1, startWallet: START_WALLET_L1, target: TARGET_L1,
      totalTime: TIME_L1, tickMs: TICK_MS_L1, volMult: 0.7,
      supplyLimited: false, supplyMax: 99,
      eventsOn: false, events: [],
      badgeText: 'LEVEL 1 · LEARN — STEADY MARKET',
    },
    2: {
      items: ITEMS_L2, startWallet: START_WALLET_L2, target: TARGET_L2,
      totalTime: TIME_L2, tickMs: TICK_MS_L2, volMult: 1.4,
      supplyLimited: true, supplyMax: SUPPLY_MAX_L2,
      eventsOn: true, events: MARKET_EVENTS,
      badgeText: 'LEVEL 2 · MASTER — VOLATILE MARKET',
    },
    3: {
      items: ITEMS_L3, startWallet: START_WALLET_L3, target: TARGET_L3,
      totalTime: TIME_L3, tickMs: TICK_MS_L3, volMult: 1.9,
      supplyLimited: true, supplyMax: SUPPLY_MAX_L3,
      eventsOn: true, events: MARKET_EVENTS.concat(MARKET_EVENTS_L3),
      badgeText: 'LEVEL 3 · LEGEND — FLASH MARKET',
    },
  };

  /* ─── STATE ──────────────────────────────────────────────────── */
  let G = null;
  let _tick = null, _countdown = null, _evtTimer = null;

  /* ══════════════════════════════════════════════════════════════
     SCREEN ENTRY POINT
  ══════════════════════════════════════════════════════════════ */
  window.SCREENS.game_bsv_bitstreammarket = function () {
    G = null;
    clearAllTimers();
    setTimeout(initGame, 40);
    return buildShell();
  };

  /* ─── EXIT ───────────────────────────────────────────────────── */
  window.bsv_bitstreammarketExit = function () {
    G = null;
    clearAllTimers();
    if (window.state) state.viewingWorld = 'builder';
    goTo('hub');
  };

  /* ─── CLEAR TIMERS ───────────────────────────────────────────── */
  function clearAllTimers() {
    if (_tick)      { clearInterval(_tick);      _tick = null;      }
    if (_countdown) { clearInterval(_countdown); _countdown = null; }
    if (_evtTimer)  { clearTimeout(_evtTimer);   _evtTimer = null;  }
  }

  /* ══════════════════════════════════════════════════════════════
     SHELL HTML
  ══════════════════════════════════════════════════════════════ */
  function buildShell() {
    return `
<style>
  /* ── root ── */
  #bm-root {
    position:absolute;inset:0;
    background:radial-gradient(ellipse at 50% -15%, #001a1a 0%, #03040c 55%, #020309 100%);
    overflow:hidden;font-family:'Inter',sans-serif;color:#fff;
    display:flex;flex-direction:column;
  }
  /* ── ambient grid ── */
  #bm-root::before {
    content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background-image:
      linear-gradient(rgba(0,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,255,.03) 1px, transparent 1px);
    background-size:38px 38px;
  }
  /* ── scan line effect ── */
  #bm-root::after {
    content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:repeating-linear-gradient(
      0deg, transparent, transparent 2px, rgba(0,0,0,.08) 2px, rgba(0,0,0,.08) 4px
    );
  }
  /* ── top bar ── */
  #bm-top {
    position:relative;z-index:8;display:flex;align-items:center;
    gap:8px;padding:11px 14px 9px;flex-shrink:0;
    background:linear-gradient(180deg,rgba(0,8,8,.96),rgba(0,8,8,.6));
    border-bottom:1.5px solid rgba(0,255,255,.2);
  }
  #bm-back {
    padding:6px 12px;border-radius:8px;
    border:1px solid rgba(0,255,255,.4);background:rgba(0,255,255,.08);
    color:${AC2};font-family:'Orbitron',sans-serif;font-size:.56rem;
    letter-spacing:.12em;cursor:pointer;white-space:nowrap;flex-shrink:0;
    transition:background .15s;
  }
  #bm-back:hover { background:rgba(0,255,255,.18); }
  #bm-title {
    font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.2em;
    color:${AC};flex:1;text-align:center;
    text-shadow:0 0 18px ${AC}99;
  }
  #bm-timer {
    font-family:'Orbitron',sans-serif;font-size:.85rem;color:${GOLD};
    min-width:46px;text-align:right;font-variant-numeric:tabular-nums;
  }
  /* ── wallet HUD ── */
  #bm-hud {
    position:relative;z-index:7;display:flex;gap:5px;
    padding:6px 10px 5px;flex-shrink:0;
    background:rgba(0,4,6,.6);border-bottom:1px solid rgba(0,255,255,.08);
  }
  .bm-hb {
    flex:1;text-align:center;padding:5px 3px;border-radius:9px;
    background:rgba(0,255,255,.05);border:1px solid rgba(0,255,255,.12);
  }
  .bm-hb-lbl {
    font-family:'Orbitron',sans-serif;font-size:.37rem;letter-spacing:.1em;
    color:rgba(255,255,255,.38);text-transform:uppercase;
  }
  .bm-hb-val {
    font-family:'Orbitron',sans-serif;font-size:.8rem;font-weight:900;
    line-height:1.3;font-variant-numeric:tabular-nums;
  }
  /* ── progress bar ── */
  #bm-progress-wrap {
    position:relative;z-index:7;padding:4px 10px 5px;flex-shrink:0;
    background:rgba(0,4,6,.5);border-bottom:1px solid rgba(0,255,255,.06);
  }
  #bm-progress-labels {
    display:flex;justify-content:space-between;
    font-family:'Orbitron',sans-serif;font-size:.37rem;letter-spacing:.07em;
    color:rgba(255,255,255,.35);margin-bottom:3px;
  }
  #bm-prog-bar-bg {
    height:7px;border-radius:5px;background:rgba(255,255,255,.08);
    overflow:hidden;border:1px solid rgba(0,255,255,.15);
  }
  #bm-prog-bar-fill {
    height:100%;border-radius:5px;
    background:linear-gradient(90deg, ${AC}, ${AC2});
    box-shadow:0 0 10px ${AC}88;
    transition:width .4s ease;
  }
  /* ── live feed ticker ── */
  #bm-feed {
    position:relative;z-index:7;flex-shrink:0;
    height:22px;overflow:hidden;
    background:rgba(0,10,12,.8);border-bottom:1px solid rgba(0,255,255,.1);
  }
  #bm-feed-inner {
    display:flex;align-items:center;height:100%;white-space:nowrap;
    font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.07em;
    animation:bmFeed 30s linear infinite;
  }
  @keyframes bmFeed { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .bm-feed-item {
    padding:0 14px;border-right:1px solid rgba(0,255,255,.12);
    display:inline-flex;align-items:center;gap:5px;height:100%;
  }
  /* ── event banner ── */
  #bm-event {
    position:relative;z-index:7;flex-shrink:0;
    overflow:hidden;max-height:0;transition:max-height .3s ease;
  }
  #bm-event.active { max-height:32px; }
  #bm-event-inner {
    padding:6px 14px;
    background:linear-gradient(90deg,rgba(187,136,255,.25),rgba(0,255,255,.1));
    border-bottom:1px solid rgba(187,136,255,.4);
    font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.06em;
    color:#fff;text-align:center;
  }
  /* ── level badge ── */
  #bm-lvbadge {
    position:relative;z-index:7;flex-shrink:0;
    font-family:'Orbitron',sans-serif;font-size:.46rem;letter-spacing:.16em;
    text-align:center;padding:2px 0 3px;
    color:rgba(255,255,255,.4);
    border-bottom:1px solid rgba(0,255,255,.07);
    background:rgba(0,0,8,.4);
  }
  /* ── item cards list ── */
  #bm-market {
    position:relative;z-index:6;flex:1;overflow-y:auto;
    padding:8px 9px;display:flex;flex-direction:column;gap:7px;
  }
  #bm-market::-webkit-scrollbar { width:3px; }
  #bm-market::-webkit-scrollbar-thumb { background:rgba(0,255,255,.25);border-radius:3px; }
  /* ── item card ── */
  .bm-card {
    border-radius:13px;border:1.5px solid rgba(0,255,255,.14);
    background:rgba(0,18,22,.7);
    cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .08s;
    -webkit-tap-highlight-color:transparent;
    overflow:hidden;
  }
  .bm-card:active { transform:scale(.985); }
  .bm-card.sel {
    border-color:${AC};
    box-shadow:0 0 20px rgba(0,255,255,.35),inset 0 0 14px rgba(0,255,255,.06);
  }
  .bm-card.event-glow {
    border-color:${PURPLE};
    box-shadow:0 0 18px rgba(187,136,255,.5);
    animation:bmEventPulse .8s ease-in-out infinite alternate;
  }
  @keyframes bmEventPulse {
    0% { box-shadow:0 0 10px rgba(187,136,255,.4); }
    100% { box-shadow:0 0 30px rgba(187,136,255,.85), 0 0 55px rgba(187,136,255,.2); }
  }
  .bm-card-main {
    display:flex;align-items:center;gap:10px;padding:10px 12px 8px;
  }
  .bm-card-icon { font-size:1.45rem;flex-shrink:0;line-height:1; }
  .bm-card-info { flex:1;min-width:0; }
  .bm-card-name {
    font-family:'Orbitron',sans-serif;font-size:.64rem;font-weight:900;
    letter-spacing:.07em;color:${AC};line-height:1;
  }
  .bm-card-sub {
    font-size:.48rem;color:rgba(255,255,255,.42);margin-top:1px;
  }
  .bm-card-held {
    font-size:.41rem;color:rgba(0,255,255,.65);margin-top:2px;
    font-family:'Orbitron',sans-serif;letter-spacing:.04em;
  }
  .bm-price-col { text-align:right;flex-shrink:0; }
  .bm-price {
    font-family:'Orbitron',sans-serif;font-size:.9rem;font-weight:900;
    line-height:1;font-variant-numeric:tabular-nums;
  }
  .bm-pchg {
    font-size:.45rem;font-family:'Orbitron',sans-serif;
    letter-spacing:.06em;margin-top:2px;font-variant-numeric:tabular-nums;
    text-align:right;
  }
  .bm-up { color:${GREEN}; }
  .bm-dn { color:${RED}; }
  .bm-fl { color:rgba(255,255,255,.35); }
  /* sparkline canvas inside card */
  .bm-spark-wrap { padding:0 12px 8px;display:flex;align-items:center;gap:6px; }
  .bm-spark-canvas { flex:1;height:30px;display:block; }
  /* supply bar (L2) */
  .bm-supply-row { padding:0 12px 8px;display:flex;align-items:center;gap:6px; }
  .bm-supply-lbl { font-family:'Orbitron',sans-serif;font-size:.36rem;letter-spacing:.07em;color:rgba(255,255,255,.35); }
  .bm-supply-bg { flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden; }
  .bm-supply-fill { height:100%;border-radius:3px;background:${PURPLE};transition:width .4s; }
  /* ── action bar ── */
  #bm-action {
    position:relative;z-index:8;flex-shrink:0;
    padding:7px 10px 8px;
    background:rgba(0,4,8,.9);border-top:1.5px solid rgba(0,255,255,.15);
  }
  #bm-action-hint {
    font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.08em;
    color:rgba(255,255,255,.3);text-align:center;margin-bottom:5px;
  }
  #bm-action-btns {
    display:flex;gap:7px;
  }
  .bm-btn {
    flex:1;padding:11px 4px;border-radius:11px;border:none;
    font-family:'Orbitron',sans-serif;font-size:.62rem;font-weight:900;
    letter-spacing:.1em;cursor:pointer;transition:opacity .12s,transform .08s;
    -webkit-tap-highlight-color:transparent;
  }
  .bm-btn:active { transform:scale(.94); }
  .bm-btn:disabled { opacity:.3;cursor:default; }
  #bm-btn-buy {
    background:linear-gradient(135deg,${GREEN},#00cc66);
    color:#000;box-shadow:0 4px 16px rgba(0,255,136,.4);
  }
  #bm-btn-sell {
    background:linear-gradient(135deg,${RED},#cc0033);
    color:#fff;box-shadow:0 4px 16px rgba(255,51,102,.4);
  }
  #bm-btn-trade {
    background:linear-gradient(135deg,${PURPLE},#8844dd);
    color:#fff;box-shadow:0 4px 16px rgba(187,136,255,.4);
  }
  /* qty selector */
  #bm-qty-row {
    display:flex;align-items:center;gap:6px;margin-bottom:5px;
    justify-content:center;
  }
  .bm-ql { font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.09em;color:rgba(255,255,255,.4); }
  .bm-qbtn {
    width:28px;height:28px;border-radius:7px;
    border:1px solid rgba(0,255,255,.28);background:rgba(0,255,255,.08);
    color:${AC2};font-size:.9rem;cursor:pointer;display:flex;
    align-items:center;justify-content:center;font-weight:900;
    transition:background .1s;flex-shrink:0;
  }
  .bm-qbtn:hover { background:rgba(0,255,255,.2); }
  #bm-qval { font-family:'Orbitron',sans-serif;font-size:.82rem;color:#fff;min-width:18px;text-align:center; }
  #bm-cost-info {
    font-family:'Orbitron',sans-serif;font-size:.41rem;color:rgba(255,255,255,.38);
    text-align:center;letter-spacing:.04em;
  }
  /* ── trade modal ── */
  #bm-trade-modal {
    position:absolute;inset:0;z-index:20;
    background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;
    padding:16px;
  }
  #bm-trade-box {
    background:linear-gradient(145deg,#020d14,#030a10);
    border:1.5px solid ${AC};border-radius:16px;
    padding:18px;width:100%;max-width:340px;
    box-shadow:0 0 40px rgba(0,255,255,.3);
  }
  #bm-trade-title {
    font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.2em;
    color:${AC};text-align:center;margin-bottom:12px;
    text-shadow:0 0 12px ${AC}88;
  }
  .bm-trade-list {
    display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;margin-bottom:12px;
  }
  .bm-trade-item {
    display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;
    border:1px solid rgba(0,255,255,.18);background:rgba(0,255,255,.05);
    cursor:pointer;transition:border-color .12s;
  }
  .bm-trade-item:hover { border-color:${AC}; }
  .bm-trade-item-icon { font-size:1.1rem; }
  .bm-trade-item-name { flex:1;font-family:'Orbitron',sans-serif;font-size:.52rem;letter-spacing:.05em;color:#fff; }
  .bm-trade-item-px { font-family:'Orbitron',sans-serif;font-size:.52rem;color:${AC};font-variant-numeric:tabular-nums; }
  .bm-trade-item-diff { font-family:'Orbitron',sans-serif;font-size:.42rem;margin-top:1px;font-variant-numeric:tabular-nums; }
  #bm-trade-cancel {
    width:100%;padding:9px;border-radius:9px;
    border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);
    color:rgba(255,255,255,.5);font-family:'Orbitron',sans-serif;
    font-size:.52rem;letter-spacing:.1em;cursor:pointer;
    transition:background .12s;
  }
  #bm-trade-cancel:hover { background:rgba(255,255,255,.1); }
  /* ── level select modal ── */
  #bm-lvl-modal {
    position:absolute;inset:0;z-index:30;
    background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;
    padding:20px;
  }
  #bm-lvl-box {
    background:linear-gradient(145deg,#020d14,#030a10);
    border:1.5px solid ${AC};border-radius:18px;
    padding:24px 20px;width:100%;max-width:320px;
    box-shadow:0 0 50px rgba(0,255,255,.35);text-align:center;
  }
  #bm-lvl-box h2 {
    font-family:'Orbitron',sans-serif;font-size:.9rem;letter-spacing:.2em;
    color:${AC};margin:0 0 6px;text-shadow:0 0 14px ${AC}99;
  }
  #bm-lvl-box p { font-size:.7rem;color:rgba(255,255,255,.5);margin:0 0 20px;line-height:1.5; }
  .bm-lvl-btn {
    display:block;width:100%;padding:14px;border-radius:12px;
    border:1.5px solid rgba(0,255,255,.3);background:rgba(0,255,255,.08);
    color:#fff;font-family:'Orbitron',sans-serif;font-size:.62rem;
    letter-spacing:.12em;cursor:pointer;margin-bottom:10px;
    transition:border-color .15s,background .15s;text-align:left;
  }
  .bm-lvl-btn:hover { border-color:${AC};background:rgba(0,255,255,.16); }
  .bm-lvl-btn strong { color:${AC};display:block;margin-bottom:2px; }
  .bm-lvl-btn small { display:block;font-size:.48rem;color:rgba(255,255,255,.4);margin-top:3px; }
  /* ── end overlay ── */
  #bm-end {
    position:absolute;inset:0;z-index:25;
    background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;
    padding:20px;
  }
  #bm-end-box {
    background:linear-gradient(145deg,#020d14,#030a10);
    border-radius:18px;padding:24px 20px;width:100%;max-width:340px;
    text-align:center;
    box-shadow:0 0 60px rgba(0,255,255,.25);
  }
  #bm-end-badge {
    font-size:.58rem;font-family:'Orbitron',sans-serif;letter-spacing:.18em;
    color:rgba(255,255,255,.45);margin-bottom:8px;
  }
  #bm-end-stars { font-size:1.8rem;margin-bottom:8px; }
  #bm-end-title {
    font-family:'Orbitron',sans-serif;font-size:1rem;letter-spacing:.18em;
    margin-bottom:4px;
  }
  #bm-end-wallet {
    font-family:'Orbitron',sans-serif;font-size:1.5rem;font-weight:900;
    color:${AC};margin-bottom:4px;font-variant-numeric:tabular-nums;
    text-shadow:0 0 18px ${AC}88;
  }
  #bm-end-coins {
    font-family:'Orbitron',sans-serif;font-size:.7rem;color:${GOLD};
    margin-bottom:14px;
  }
  #bm-end-lesson {
    font-size:.62rem;line-height:1.6;color:rgba(255,255,255,.6);
    margin-bottom:18px;padding:12px;border-radius:10px;
    border:1px solid rgba(0,255,255,.15);background:rgba(0,255,255,.04);
    text-align:left;
  }
  #bm-end-btns { display:flex;gap:10px; }
  .bm-end-btn {
    flex:1;padding:12px;border-radius:11px;border:none;
    font-family:'Orbitron',sans-serif;font-size:.58rem;font-weight:900;
    letter-spacing:.1em;cursor:pointer;transition:opacity .12s;
  }
  #bm-end-again {
    background:linear-gradient(135deg,${AC},${AC2});
    color:#000;box-shadow:0 4px 18px rgba(0,255,255,.4);
  }
  #bm-end-hub {
    background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);
    border:1px solid rgba(255,255,255,.18);
  }
  /* ── float labels ── */
  .bm-float {
    position:absolute;z-index:15;pointer-events:none;
    font-family:'Orbitron',sans-serif;font-size:.7rem;font-weight:900;
    text-shadow:0 2px 8px rgba(0,0,0,.8);
    animation:bmFloat 1.1s ease-out forwards;
  }
  @keyframes bmFloat {
    0%   { opacity:1; transform:translateY(0) scale(1); }
    60%  { opacity:.9; transform:translateY(-36px) scale(1.12); }
    100% { opacity:0; transform:translateY(-62px) scale(.9); }
  }
  /* ── sold-out pill ── */
  .bm-soldout {
    display:inline-block;padding:2px 7px;border-radius:4px;
    background:rgba(255,51,102,.2);border:1px solid rgba(255,51,102,.5);
    font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.07em;
    color:${RED};vertical-align:middle;margin-left:6px;
  }
</style>

<div id="bm-root">
  <!-- TOP BAR -->
  <div id="bm-top">
    <button id="bm-back">← HUB</button>
    <div id="bm-title">BITSTREAM MARKET</div>
    <div id="bm-timer">2:00</div>
  </div>
  <!-- WALLET HUD -->
  <div id="bm-hud">
    <div class="bm-hb">
      <div class="bm-hb-lbl">WALLET</div>
      <div class="bm-hb-val" id="bm-wallet" style="color:${AC}">$0</div>
    </div>
    <div class="bm-hb">
      <div class="bm-hb-lbl">TARGET</div>
      <div class="bm-hb-val" id="bm-target" style="color:${GOLD}">$0</div>
    </div>
    <div class="bm-hb">
      <div class="bm-hb-lbl">TRADES</div>
      <div class="bm-hb-val" id="bm-trades" style="color:${GREEN}">0</div>
    </div>
    <div class="bm-hb">
      <div class="bm-hb-lbl">PROFIT</div>
      <div class="bm-hb-val" id="bm-profit">$0</div>
    </div>
  </div>
  <!-- PROGRESS -->
  <div id="bm-progress-wrap">
    <div id="bm-progress-labels">
      <span>START</span>
      <span id="bm-prog-pct">0%</span>
      <span>TARGET</span>
    </div>
    <div id="bm-prog-bar-bg"><div id="bm-prog-bar-fill" style="width:0%"></div></div>
  </div>
  <!-- FEED TICKER -->
  <div id="bm-feed"><div id="bm-feed-inner"></div></div>
  <!-- EVENT BANNER -->
  <div id="bm-event"><div id="bm-event-inner"></div></div>
  <!-- LEVEL BADGE -->
  <div id="bm-lvbadge">LEVEL 1 · LEARN</div>
  <!-- MARKET LIST -->
  <div id="bm-market"></div>
  <!-- ACTION BAR -->
  <div id="bm-action">
    <div id="bm-action-hint">TAP AN ITEM TO SELECT, THEN ACT</div>
    <div id="bm-qty-row">
      <span class="bm-ql">QTY</span>
      <button class="bm-qbtn" id="bm-q-dn">−</button>
      <span id="bm-qval">1</span>
      <button class="bm-qbtn" id="bm-q-up">+</button>
      <span class="bm-ql" id="bm-cost-info" style="margin-left:4px">—</span>
    </div>
    <div id="bm-action-btns">
      <button class="bm-btn" id="bm-btn-buy"  disabled>BUY</button>
      <button class="bm-btn" id="bm-btn-sell" disabled>SELL</button>
      <button class="bm-btn" id="bm-btn-trade" disabled>TRADE</button>
    </div>
  </div>
</div>

<!-- LEVEL SELECT MODAL (shown first) -->
<div id="bm-lvl-modal">
  <div id="bm-lvl-box">
    <h2>BITSTREAM MARKET</h2>
    <p>Buy low, sell high, grow your virtual economy wallet before time runs out.</p>
    <button class="bm-lvl-btn" id="bm-lvl1-btn">
      <strong>LEVEL 1 · LEARN</strong>
      Wallet $4,200 → Target $6,000 · 2 min
      <small>Steady prices · Small inventory · No pressure</small>
    </button>
    <button class="bm-lvl-btn" id="bm-lvl2-btn">
      <strong>LEVEL 2 · MASTER</strong>
      Wallet $3,500 → Target $7,000 · 2:30 min
      <small>Limited supply · Demand spikes · Flash market events</small>
    </button>
    <button class="bm-lvl-btn" id="bm-lvl3-btn" style="border-color:rgba(255,77,157,.4);background:rgba(255,77,157,.07)">
      <strong style="color:#ff4d9d">LEVEL 3 · LEGEND</strong>
      Wallet $3,000 → Target $9,000 · 2:50 min
      <small>Scarcest supply · Rapid flash events · Fastest ticking market</small>
    </button>
  </div>
</div>
`;
  }

  /* ══════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════ */
  function initGame() {
    const back = document.getElementById('bm-back');
    if (!back) return;
    back.addEventListener('click', window.bsv_bitstreammarketExit);

    document.getElementById('bm-q-dn').addEventListener('click', () => changeQty(-1));
    document.getElementById('bm-q-up').addEventListener('click', () => changeQty(+1));
    document.getElementById('bm-btn-buy').addEventListener('click', doBuy);
    document.getElementById('bm-btn-sell').addEventListener('click', doSell);
    document.getElementById('bm-btn-trade').addEventListener('click', openTrade);

    document.getElementById('bm-lvl1-btn').addEventListener('click', () => startLevel(1));
    document.getElementById('bm-lvl2-btn').addEventListener('click', () => startLevel(2));
    document.getElementById('bm-lvl3-btn').addEventListener('click', () => startLevel(3));
  }

  /* ══════════════════════════════════════════════════════════════
     START LEVEL
  ══════════════════════════════════════════════════════════════ */
  function startLevel(lvl) {
    clearAllTimers();

    const modal = document.getElementById('bm-lvl-modal');
    if (modal) modal.style.display = 'none';

    const cfg = LEVEL_CFG[lvl] || LEVEL_CFG[1];
    const items       = cfg.items;
    const startWallet = cfg.startWallet;
    const target      = cfg.target;
    const totalTime   = cfg.totalTime;
    const tickMs      = cfg.tickMs;

    // Build market items
    const market = items.map(item => ({
      ...item,
      price:  item.basePx,
      prev:   item.basePx,
      pct:    0,
      history:[item.basePx],
      // Supply-limited levels seed to a random point within their own cap
      // (never exceeds cfg.supplyMax, so the % bar can never overflow).
      supply: cfg.supplyLimited
        ? Math.max(1, Math.floor(Math.random() * (cfg.supplyMax - 3)) + 3)
        : cfg.supplyMax,
      eventBias: 0,
      eventTicks: 0,
    }));

    G = {
      lvl,
      cfg,
      items: market,
      wallet: startWallet,
      target,
      startWallet,
      totalTime,
      timeLeft: totalTime,
      tickMs,
      held: {},   // { itemId: qty }
      selectedId: null,
      qty: 1,
      tradesMade: 0,
      profitableTrades: 0,
      totalProfit: 0,
      running: true,
      eventActive: false,
    };

    // init held map
    market.forEach(it => { G.held[it.id] = 0; });

    document.getElementById('bm-lvbadge').textContent = cfg.badgeText;
    document.getElementById('bm-target').textContent = '$' + fmtNum(target);

    buildMarketCards();
    buildFeedTicker();
    renderAll();

    // Price tick
    _tick = setInterval(priceTick, tickMs);
    // Countdown
    _countdown = setInterval(countdownTick, 1000);
    // Events (any level with eventsOn — L2, L3, ...)
    if (cfg.eventsOn) scheduleEvent();
  }

  /* ══════════════════════════════════════════════════════════════
     PRICE TICK
  ══════════════════════════════════════════════════════════════ */
  function priceTick() {
    if (!G || !G.running) return;
    const volMult = G.cfg.volMult;

    G.items.forEach(it => {
      const item = G.items.find(i => i.id === it.id);
      // Volatility
      const vol = item.vol * volMult;
      const rand = (Math.random() - 0.48) * 2; // slight upward bias
      let delta = item.price * (vol * rand + item.trend);

      // Apply event bias
      if (item.eventTicks > 0) {
        delta += item.price * (item.eventBias / 100) * 0.35;
        item.eventTicks--;
        if (item.eventTicks === 0) { item.eventBias = 0; }
      }

      item.prev = item.price;
      item.price = Math.max(10, Math.min(2000, item.price + delta));
      item.pct = ((item.price - item.prev) / item.prev) * 100;

      // Keep history for sparkline (last 14 points)
      item.history.push(item.price);
      if (item.history.length > 14) item.history.shift();
    });

    renderPrices();
    updateFeedTicker();
  }

  /* ══════════════════════════════════════════════════════════════
     COUNTDOWN
  ══════════════════════════════════════════════════════════════ */
  function countdownTick() {
    if (!G || !G.running) return;
    G.timeLeft--;
    renderTimer();

    // Check win/lose conditions
    if (G.wallet <= 0 && totalHeldValue() === 0) {
      triggerEnd('bankrupt');
      return;
    }
    if (G.timeLeft <= 0) {
      // Time up — auto-liquidate holdings and check
      liquidateAll();
      const won = G.wallet >= G.target;
      triggerEnd(won ? 'win' : 'lose');
    }
  }

  /* ══════════════════════════════════════════════════════════════
     MARKET EVENTS (Level 2)
  ══════════════════════════════════════════════════════════════ */
  function scheduleEvent() {
    if (!G || !G.running) return;
    // L3 fires events on a tighter, faster cadence than L2 (8–16s vs 12–26s)
    const isL3 = G.lvl === 3;
    const delay = isL3 ? (8000 + Math.random() * 8000) : (12000 + Math.random() * 14000);
    _evtTimer = setTimeout(fireEvent, delay);
  }

  function fireEvent() {
    if (!G || !G.running) return;
    const pool = (G.cfg && G.cfg.events && G.cfg.events.length) ? G.cfg.events : MARKET_EVENTS;
    const ev = pool[Math.floor(Math.random() * pool.length)];

    // Apply bias to items
    G.items.forEach(it => {
      if (ev.id === 'ALL' || ev.id === it.id) {
        it.eventBias = ev.bias;
        it.eventTicks = ev.dur * 2 + 1;
        // glow affected cards
        const card = document.getElementById('bm-card-' + it.id);
        if (card) {
          card.classList.add('event-glow');
          setTimeout(() => card && card.classList.remove('event-glow'), ev.dur * 2000);
        }
      }
    });

    // Show banner
    const banner = document.getElementById('bm-event');
    const inner  = document.getElementById('bm-event-inner');
    if (banner && inner) {
      inner.textContent = ev.text;
      banner.classList.add('active');
      setTimeout(() => banner && banner.classList.remove('active'), 4000);
    }

    G.eventActive = true;
    scheduleEvent(); // chain next
  }

  /* ══════════════════════════════════════════════════════════════
     BUILD MARKET CARDS
  ══════════════════════════════════════════════════════════════ */
  function buildMarketCards() {
    const container = document.getElementById('bm-market');
    if (!container || !G) return;
    container.innerHTML = '';

    G.items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'bm-card';
      card.id = 'bm-card-' + item.id;
      card.innerHTML = cardHTML(item);
      card.addEventListener('click', () => selectItem(item.id));
      container.appendChild(card);

      // Draw initial sparkline
      drawSparkline(item);
    });
  }

  function cardHTML(item) {
    const pctColor = item.pct > 0 ? 'bm-up' : item.pct < 0 ? 'bm-dn' : 'bm-fl';
    const pctArrow = item.pct > 0 ? '▲' : item.pct < 0 ? '▼' : '●';
    const heldQty  = G.held[item.id] || 0;
    const soldOut  = G.cfg.supplyLimited && item.supply <= 0;
    const rarityColor = item.rarity === 'rare' ? GOLD : item.rarity === 'uncommon' ? PURPLE : 'rgba(255,255,255,.4)';

    let supplyHTML = '';
    if (G.cfg.supplyLimited) {
      const supplyPct = Math.max(0, (item.supply / G.cfg.supplyMax) * 100);
      const supplyColor = supplyPct < 30 ? RED : supplyPct < 60 ? GOLD : GREEN;
      supplyHTML = `
        <div class="bm-supply-row">
          <span class="bm-supply-lbl">SUPPLY</span>
          <div class="bm-supply-bg"><div class="bm-supply-fill" id="bm-sup-${item.id}" style="width:${supplyPct}%;background:${supplyColor}"></div></div>
          <span class="bm-supply-lbl" id="bm-sup-txt-${item.id}" style="min-width:28px;text-align:right">${item.supply}</span>
        </div>`;
    }

    return `
      <div class="bm-card-main">
        <div class="bm-card-icon">${item.icon}</div>
        <div class="bm-card-info">
          <div class="bm-card-name">${item.name}${soldOut ? '<span class="bm-soldout">SOLD OUT</span>' : ''}</div>
          <div class="bm-card-sub" style="color:${rarityColor}">${item.rarity.toUpperCase()} · ${item.id.toUpperCase()}</div>
          ${heldQty > 0 ? `<div class="bm-card-held">HOLDING: ${heldQty}</div>` : ''}
        </div>
        <div class="bm-price-col">
          <div class="bm-price" id="bm-px-${item.id}" style="color:${pctColor === 'bm-up' ? GREEN : pctColor === 'bm-dn' ? RED : '#fff'}">$${fmtNum(item.price)}</div>
          <div class="bm-pchg ${pctColor}" id="bm-pchg-${item.id}">${pctArrow} ${Math.abs(item.pct).toFixed(1)}%</div>
        </div>
      </div>
      <div class="bm-spark-wrap">
        <canvas class="bm-spark-canvas" id="bm-spark-${item.id}" height="30"></canvas>
      </div>
      ${supplyHTML}
    `;
  }

  /* ══════════════════════════════════════════════════════════════
     SPARKLINE
  ══════════════════════════════════════════════════════════════ */
  function drawSparkline(item) {
    requestAnimationFrame(() => {
      const canvas = document.getElementById('bm-spark-' + item.id);
      if (!canvas) return;
      const W = canvas.offsetWidth || 200;
      canvas.width  = W;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, 30);

      const h = item.history;
      if (h.length < 2) return;

      const mn = Math.min(...h), mx = Math.max(...h);
      const rng = mx - mn || 1;
      const pts = h.map((v, i) => ({
        x: (i / (h.length - 1)) * W,
        y: 28 - ((v - mn) / rng) * 24,
      }));

      const last = h[h.length - 1];
      const prev = h[h.length - 2];
      const color = last >= prev ? '#00FF88' : '#FF3366';

      // Fill gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 30);
      grad.addColorStop(0, color + '55');
      grad.addColorStop(1, color + '00');

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, 30);
      ctx.lineTo(pts[0].x, 30);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Endpoint dot
      const ep = pts[pts.length - 1];
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     FEED TICKER
  ══════════════════════════════════════════════════════════════ */
  function buildFeedTicker() {
    const inner = document.getElementById('bm-feed-inner');
    if (!inner || !G) return;
    // Build a duplicated marquee content
    inner.innerHTML = buildTickerItems() + buildTickerItems();
  }

  function buildTickerItems() {
    if (!G) return '';
    return G.items.map(item => {
      const cl = item.pct > 0 ? 'bm-up' : item.pct < 0 ? 'bm-dn' : 'bm-fl';
      return `<span class="bm-feed-item"><span>${item.icon} ${item.name}</span><span class="${cl}">$${fmtNum(item.price)} ${item.pct > 0 ? '▲' : item.pct < 0 ? '▼' : '●'}</span></span>`;
    }).join('');
  }

  function updateFeedTicker() {
    const inner = document.getElementById('bm-feed-inner');
    if (!inner || !G) return;
    inner.innerHTML = buildTickerItems() + buildTickerItems();
  }

  /* ══════════════════════════════════════════════════════════════
     SELECT ITEM
  ══════════════════════════════════════════════════════════════ */
  function selectItem(id) {
    if (!G || !G.running) return;
    // Toggle
    if (G.selectedId === id) {
      G.selectedId = null;
    } else {
      G.selectedId = id;
      G.qty = 1;
    }
    // Update card highlights
    G.items.forEach(it => {
      const card = document.getElementById('bm-card-' + it.id);
      if (card) card.classList.toggle('sel', it.id === G.selectedId);
    });
    renderActionBar();
  }

  /* ══════════════════════════════════════════════════════════════
     QTY
  ══════════════════════════════════════════════════════════════ */
  function changeQty(delta) {
    if (!G || !G.selectedId) return;
    const item = G.items.find(i => i.id === G.selectedId);
    if (!item) return;
    G.qty = Math.max(1, Math.min(MAX_HELD_EACH, (G.qty || 1) + delta));
    renderActionBar();
  }

  /* ══════════════════════════════════════════════════════════════
     BUY
  ══════════════════════════════════════════════════════════════ */
  function doBuy() {
    if (!G || !G.running || !G.selectedId) return;
    const item = G.items.find(i => i.id === G.selectedId);
    if (!item) return;

    const qty = G.qty || 1;
    const cost = Math.round(item.price * qty);
    if (cost > G.wallet) { flashMsg('Not enough funds!', RED); return; }
    if (G.cfg.supplyLimited && item.supply < qty) {
      if (item.supply === 0) { flashMsg('Sold out!', RED); return; }
      G.qty = item.supply;
      renderActionBar();
      return;
    }
    if ((G.held[item.id] || 0) + qty > MAX_HELD_EACH) {
      flashMsg('Holding limit reached!', RED); return;
    }

    G.wallet -= cost;
    G.held[item.id] = (G.held[item.id] || 0) + qty;
    if (G.cfg.supplyLimited) item.supply = Math.max(0, item.supply - qty);

    G.tradesMade++;
    showFloat(item.id, '-$' + fmtNum(cost), RED);
    rebuildCard(item);
    renderAll();
  }

  /* ══════════════════════════════════════════════════════════════
     SELL
  ══════════════════════════════════════════════════════════════ */
  function doSell() {
    if (!G || !G.running || !G.selectedId) return;
    const item = G.items.find(i => i.id === G.selectedId);
    if (!item) return;

    const held = G.held[item.id] || 0;
    if (held === 0) { flashMsg('Nothing to sell!', RED); return; }

    const qty = Math.min(G.qty || 1, held);
    const revenue = Math.round(item.price * qty);

    // Rough profit calc — compare against base price as cost basis approximation
    const baseCost = item.basePx * qty;
    const profit = revenue - baseCost;
    G.totalProfit += profit;
    if (profit > 0) G.profitableTrades++;

    G.wallet += revenue;
    G.held[item.id] -= qty;
    if (G.cfg.supplyLimited) item.supply = Math.min(G.cfg.supplyMax, item.supply + Math.floor(qty / 2));

    G.tradesMade++;
    showFloat(item.id, '+$' + fmtNum(revenue), GREEN);

    // Check win
    if (G.wallet >= G.target) {
      rebuildCard(item);
      renderAll();
      setTimeout(() => triggerEnd('win'), 300);
      return;
    }

    rebuildCard(item);
    renderAll();
  }

  /* ══════════════════════════════════════════════════════════════
     TRADE (swap one held item for another)
  ══════════════════════════════════════════════════════════════ */
  function openTrade() {
    if (!G || !G.running || !G.selectedId) return;
    const fromItem = G.items.find(i => i.id === G.selectedId);
    if (!fromItem || (G.held[fromItem.id] || 0) === 0) {
      flashMsg('Hold an item to trade it!', RED); return;
    }

    // Build trade modal listing other items
    const tradeTargets = G.items.filter(it => it.id !== fromItem.id);
    const modal = document.createElement('div');
    modal.id = 'bm-trade-modal';
    modal.innerHTML = `
      <div id="bm-trade-box">
        <div id="bm-trade-title">TRADE ${fromItem.icon} ${fromItem.name.toUpperCase()}</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;color:rgba(255,255,255,.35);text-align:center;margin-bottom:8px;">
          You hold: ${G.held[fromItem.id]} · Value: $${fmtNum(Math.round(fromItem.price * G.held[fromItem.id]))}
        </div>
        <div class="bm-trade-list">
          ${tradeTargets.map(it => {
            const myVal  = Math.round(fromItem.price * G.held[fromItem.id]);
            const getQty = Math.floor(myVal / it.price);
            const diff   = myVal - (getQty * it.price);
            const diffColor = diff >= 0 ? GREEN : RED;
            const soldOut = G.cfg.supplyLimited && it.supply <= 0;
            return `
              <div class="bm-trade-item ${soldOut ? 'opacity:.4;pointer-events:none' : ''}" data-tid="${it.id}" data-qty="${getQty}">
                <span class="bm-trade-item-icon">${it.icon}</span>
                <div style="flex:1">
                  <div class="bm-trade-item-name">${it.name} ${soldOut ? '(SOLD OUT)' : ''}</div>
                  <div class="bm-trade-item-diff" style="color:${diffColor}">
                    Get ${getQty}x · Wallet ${diff >= 0 ? '+' : ''}$${fmtNum(Math.round(diff))}
                  </div>
                </div>
                <div class="bm-trade-item-px">$${fmtNum(it.price)}</div>
              </div>`;
          }).join('')}
        </div>
        <button id="bm-trade-cancel">CANCEL</button>
      </div>
    `;

    document.getElementById('bm-root').appendChild(modal);

    // Wire trade item clicks
    modal.querySelectorAll('.bm-trade-item').forEach(el => {
      el.addEventListener('click', () => {
        const toId  = el.dataset.tid;
        const toQty = parseInt(el.dataset.qty, 10);
        execTrade(fromItem.id, toId, toQty);
        modal.remove();
      });
    });
    document.getElementById('bm-trade-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  }

  function execTrade(fromId, toId, toQty) {
    if (!G || toQty < 1) { flashMsg('Trade value too small!', RED); return; }
    const fromItem = G.items.find(i => i.id === fromId);
    const toItem   = G.items.find(i => i.id === toId);
    if (!fromItem || !toItem) return;

    const fromQty = G.held[fromId] || 0;
    if (fromQty === 0) return;

    const fromVal = Math.round(fromItem.price * fromQty);
    const toCost  = Math.round(toItem.price * toQty);
    const diff    = fromVal - toCost;

    // Liquidate from item, acquire to item
    G.held[fromId] = 0;
    if (G.cfg.supplyLimited) fromItem.supply = Math.min(G.cfg.supplyMax, fromItem.supply + fromQty);

    const actualQty = Math.min(toQty, MAX_HELD_EACH - (G.held[toId] || 0));
    G.held[toId] = (G.held[toId] || 0) + actualQty;
    if (G.cfg.supplyLimited) toItem.supply = Math.max(0, toItem.supply - actualQty);
    G.wallet += diff;

    G.tradesMade++;
    if (diff > 0) { G.profitableTrades++; G.totalProfit += diff; }

    showFloat(toId, '🔄 TRADED', PURPLE);
    G.selectedId = null;

    G.items.forEach(it => rebuildCard(it));
    renderAll();

    if (G.wallet >= G.target) setTimeout(() => triggerEnd('win'), 300);
  }

  /* ══════════════════════════════════════════════════════════════
     LIQUIDATE ALL HELD ITEMS (on time up)
  ══════════════════════════════════════════════════════════════ */
  function liquidateAll() {
    if (!G) return;
    G.items.forEach(item => {
      const held = G.held[item.id] || 0;
      if (held > 0) {
        G.wallet += Math.round(item.price * held);
        G.held[item.id] = 0;
      }
    });
  }

  function totalHeldValue() {
    if (!G) return 0;
    return G.items.reduce((sum, it) => sum + Math.round(it.price * (G.held[it.id] || 0)), 0);
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  function renderAll() {
    if (!G) return;
    renderHUD();
    renderProgress();
    renderActionBar();
  }

  function renderHUD() {
    const profit = G.totalProfit;
    const profitColor = profit >= 0 ? GREEN : RED;
    setEl('bm-wallet', '$' + fmtNum(Math.round(G.wallet)));
    setEl('bm-trades', String(G.tradesMade));
    const profitEl = document.getElementById('bm-profit');
    if (profitEl) {
      profitEl.textContent = (profit >= 0 ? '+' : '') + '$' + fmtNum(Math.round(Math.abs(profit)));
      profitEl.style.color = profitColor;
    }
    // Wallet color based on health
    const walletEl = document.getElementById('bm-wallet');
    if (walletEl) {
      const ratio = G.wallet / G.startWallet;
      walletEl.style.color = ratio >= 1 ? AC : ratio > 0.5 ? GOLD : RED;
    }
  }

  function renderProgress() {
    if (!G) return;
    const totalVal = G.wallet + totalHeldValue();
    const span = G.target - G.startWallet;
    const pct  = Math.max(0, Math.min(100, ((totalVal - G.startWallet) / span) * 100));
    const fill = document.getElementById('bm-prog-bar-fill');
    const pctEl= document.getElementById('bm-prog-pct');
    if (fill) fill.style.width = pct.toFixed(1) + '%';
    if (pctEl) pctEl.textContent = Math.round(pct) + '%';
  }

  function renderTimer() {
    if (!G) return;
    const el = document.getElementById('bm-timer');
    if (!el) return;
    const m = Math.floor(G.timeLeft / 60);
    const s = G.timeLeft % 60;
    el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    el.style.color = G.timeLeft <= 20 ? RED : G.timeLeft <= 45 ? GOLD : GOLD;
  }

  function renderPrices() {
    if (!G) return;
    G.items.forEach(item => {
      const pxEl   = document.getElementById('bm-px-'   + item.id);
      const pchgEl = document.getElementById('bm-pchg-' + item.id);
      if (pxEl) {
        pxEl.textContent = '$' + fmtNum(item.price);
        pxEl.style.color = item.pct > 0 ? GREEN : item.pct < 0 ? RED : '#fff';
      }
      if (pchgEl) {
        const arrow = item.pct > 0 ? '▲' : item.pct < 0 ? '▼' : '●';
        const cl    = item.pct > 0 ? 'bm-up' : item.pct < 0 ? 'bm-dn' : 'bm-fl';
        pchgEl.textContent = arrow + ' ' + Math.abs(item.pct).toFixed(1) + '%';
        pchgEl.className = 'bm-pchg ' + cl;
      }
      // Supply bars
      if (G.cfg.supplyLimited) {
        const supFill = document.getElementById('bm-sup-' + item.id);
        const supTxt  = document.getElementById('bm-sup-txt-' + item.id);
        if (supFill) {
          const pct = Math.max(0, (item.supply / G.cfg.supplyMax) * 100);
          const color = pct < 30 ? RED : pct < 60 ? GOLD : GREEN;
          supFill.style.width = pct + '%';
          supFill.style.background = color;
        }
        if (supTxt) supTxt.textContent = item.supply;
      }
      // Sparkline
      drawSparkline(item);
    });
    renderActionBar();
  }

  function renderActionBar() {
    if (!G) return;
    const item = G.selectedId ? G.items.find(i => i.id === G.selectedId) : null;
    const qval = document.getElementById('bm-qval');
    const hint = document.getElementById('bm-action-hint');
    const costInfo = document.getElementById('bm-cost-info');
    const btnBuy   = document.getElementById('bm-btn-buy');
    const btnSell  = document.getElementById('bm-btn-sell');
    const btnTrade = document.getElementById('bm-btn-trade');

    if (!item) {
      if (qval)    qval.textContent = '1';
      if (hint)    hint.textContent = 'TAP AN ITEM CARD TO SELECT';
      if (costInfo)costInfo.textContent = '—';
      if (btnBuy)  btnBuy.disabled  = true;
      if (btnSell) btnSell.disabled = true;
      if (btnTrade)btnTrade.disabled= true;
      return;
    }

    const qty  = G.qty || 1;
    const cost = Math.round(item.price * qty);
    const held = G.held[item.id] || 0;
    const soldOut = G.cfg.supplyLimited && item.supply <= 0;

    if (qval) qval.textContent = qty;
    if (hint) hint.textContent = item.icon + ' ' + item.name + ' @ $' + fmtNum(item.price);

    if (costInfo) {
      const buyCost  = '$' + fmtNum(cost) + ' to buy';
      const sellRev  = held > 0 ? ' | $' + fmtNum(Math.round(item.price * Math.min(qty, held))) + ' to sell' : '';
      costInfo.textContent = buyCost + sellRev;
    }

    if (btnBuy)  btnBuy.disabled  = cost > G.wallet || soldOut || (G.held[item.id] || 0) >= MAX_HELD_EACH;
    if (btnSell) btnSell.disabled = held === 0;
    if (btnTrade)btnTrade.disabled= held === 0;
  }

  function rebuildCard(item) {
    const card = document.getElementById('bm-card-' + item.id);
    if (!card) return;
    const wasSel = card.classList.contains('sel');
    const wasGlow = card.classList.contains('event-glow');
    card.innerHTML = cardHTML(item);
    if (wasSel) card.classList.add('sel');
    if (wasGlow) card.classList.add('event-glow');
    drawSparkline(item);
  }

  /* ══════════════════════════════════════════════════════════════
     FLOAT LABELS & FLASH
  ══════════════════════════════════════════════════════════════ */
  function showFloat(itemId, text, color) {
    const card = document.getElementById('bm-card-' + itemId);
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const root = document.getElementById('bm-root');
    if (!root) return;
    const rootRect = root.getBoundingClientRect();

    const el = document.createElement('div');
    el.className = 'bm-float';
    el.textContent = text;
    el.style.color = color;
    el.style.left  = (rect.left - rootRect.left + rect.width / 2 - 40) + 'px';
    el.style.top   = (rect.top  - rootRect.top  + rect.height / 2)     + 'px';
    root.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  function flashMsg(msg, color) {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99;
      padding:10px 20px;border-radius:10px;background:rgba(0,0,0,.9);border:1.5px solid ${color};
      color:${color};font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.12em;
      white-space:nowrap;pointer-events:none;animation:bmFloat .9s ease-out forwards;`;
    el.textContent = msg;
    const root = document.getElementById('bm-root');
    if (root) { root.appendChild(el); setTimeout(() => el.remove(), 950); }
  }

  /* ══════════════════════════════════════════════════════════════
     END GAME
  ══════════════════════════════════════════════════════════════ */
  function triggerEnd(reason) {
    if (!G) return;
    G.running = false;
    clearAllTimers();

    const finalWallet = Math.round(G.wallet);
    const won = reason === 'win';

    // Compute stars
    let stars = 1;
    if (won) {
      const profitRatio = (finalWallet - G.startWallet) / (G.target - G.startWallet);
      if (profitRatio >= 1.4 && G.profitableTrades >= 3) stars = 3;
      else if (profitRatio >= 1.0) stars = 2;
      else stars = 1;
    } else {
      stars = finalWallet > G.startWallet * 0.5 ? 1 : 0;
    }

    endGame(stars, finalWallet, reason);
  }

  function endGame(stars, finalWallet, reason) {
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bsv_bitstreammarket', { level: (G && G.lvl) || 1, is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    const won = reason !== 'lose' && reason !== 'bankrupt';
    const starsStr = '⭐'.repeat(Math.max(0, stars));

    const overlay = document.createElement('div');
    overlay.id = 'bm-end';
    overlay.innerHTML = `
      <div id="bm-end-box">
        <div id="bm-end-badge">${won ? 'MARKET MASTER' : reason === 'bankrupt' ? 'BANKRUPT' : 'TIME EXPIRED'}</div>
        <div id="bm-end-stars">${starsStr || '💔'}</div>
        <div id="bm-end-title" style="color:${won ? AC : RED}">${won ? 'WALLET TARGET HIT!' : 'MARKET CLOSED'}</div>
        <div id="bm-end-wallet">${won ? '$' + fmtNum(finalWallet) : '$' + fmtNum(finalWallet)}</div>
        <div id="bm-end-coins">+${coins} coins · ${G.tradesMade} trades · ${G.profitableTrades} profitable</div>
        <div id="bm-end-lesson">${LESSON}</div>
        <div id="bm-end-btns">
          <button class="bm-end-btn" id="bm-end-again">PLAY AGAIN</button>
          <button class="bm-end-btn" id="bm-end-hub">← HUB</button>
        </div>
      </div>`;

    document.getElementById('bm-root').appendChild(overlay);

    document.getElementById('bm-end-again').addEventListener('click', () => {
      overlay.remove();
      G = null;
      const lvlModal = document.getElementById('bm-lvl-modal');
      if (lvlModal) lvlModal.style.display = 'flex';
      else {
        // Re-create level modal
        const newModal = document.createElement('div');
        newModal.id = 'bm-lvl-modal';
        newModal.innerHTML = `<div id="bm-lvl-box">
          <h2>BITSTREAM MARKET</h2>
          <p>Buy low, sell high, grow your virtual economy wallet before time runs out.</p>
          <button class="bm-lvl-btn" id="bm-lvl1-btn2">
            <strong>LEVEL 1 · LEARN</strong>Wallet $4,200 → Target $6,000 · 2 min
            <small>Steady prices · Small inventory · No pressure</small>
          </button>
          <button class="bm-lvl-btn" id="bm-lvl2-btn2">
            <strong>LEVEL 2 · MASTER</strong>Wallet $3,500 → Target $7,000 · 2:30 min
            <small>Limited supply · Demand spikes · Flash market events</small>
          </button>
          <button class="bm-lvl-btn" id="bm-lvl3-btn2" style="border-color:rgba(255,77,157,.4);background:rgba(255,77,157,.07)">
            <strong style="color:#ff4d9d">LEVEL 3 · LEGEND</strong>Wallet $3,000 → Target $9,000 · 2:50 min
            <small>Scarcest supply · Rapid flash events · Fastest ticking market</small>
          </button>
        </div>`;
        document.getElementById('bm-root').appendChild(newModal);
        document.getElementById('bm-lvl1-btn2').addEventListener('click', () => { newModal.remove(); startLevel(1); });
        document.getElementById('bm-lvl2-btn2').addEventListener('click', () => { newModal.remove(); startLevel(2); });
        document.getElementById('bm-lvl3-btn2').addEventListener('click', () => { newModal.remove(); startLevel(3); });
      }
    });
    document.getElementById('bm-end-hub').addEventListener('click', window.bsv_bitstreammarketExit);
  }

  /* ══════════════════════════════════════════════════════════════
     UTILS
  ══════════════════════════════════════════════════════════════ */
  function fmtNum(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ── DEBUG HOOK (dev/QA only) ───────────────────────────────── */
  window._bmDbg = () => G ? {
    lvl: G.lvl, wallet: G.wallet, target: G.target, timeLeft: G.timeLeft,
    supplyLimited: G.cfg.supplyLimited, supplyMax: G.cfg.supplyMax,
    volMult: G.cfg.volMult, eventsOn: G.cfg.eventsOn,
    eventPoolSize: (G.cfg.events || []).length,
    itemSupplies: G.items.map(i => ({ id: i.id, supply: i.supply })),
  } : null;
  window._bmForceWin = () => {
    if (!G) return 'no active game — call startLevel(1|2|3) first';
    G.wallet = G.target;
    triggerEnd('win');
    return 'forced wallet=' + G.wallet + ' (target=' + G.target + '), triggerEnd(\'win\') invoked';
  };

})();
