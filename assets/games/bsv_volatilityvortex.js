/* ════════════════════════════════════════════════════════════════
   VOLATILITY VORTEX — Bitstream Valley Hub · Coinaverse v25
   Portfolio Balance mechanic · Market Risk & Price Swings
   3 asset sliders (Cash / Crypto / Diversified) · Risk Meter
   Level 1: gentle swings · Level 2: crashes, bull runs, news
   Level 3: contagion, de-pegs, whipsaws & compound macro shocks
   Win: finish above starting value · Lose: crash below threshold
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── palette ──────────────────────────────────────────────── */
  const AC     = '#00FFFF';  // builder hub cyan
  const AC2    = '#0af';
  const BG     = '#03040c';
  const DANGER = '#FF3D3D';
  const WARN   = '#FFB300';
  const GOLD   = '#FFD700';

  const C_CASH   = '#69F0AE';
  const C_CRYPTO = '#FF6D6D';
  const C_DIV    = '#7C83FD';

  /* ── asset definitions ────────────────────────────────────── */
  const ASSETS = [
    {
      id: 'cash',
      label: 'Cash',
      icon: '💵',
      color: C_CASH,
      dark: '#0d3320',
      desc: 'Stable · Low return · Safe haven',
      returnBase:  0.01,   // per-tick base return multiplier (tiny positive)
      riskWeight:  0.0,    // contribution to risk meter (0=none)
      volatility:  0.05,
    },
    {
      id: 'crypto',
      label: 'BTC Crypto',
      icon: '₿',
      color: C_CRYPTO,
      dark: '#3a0a0a',
      desc: 'High risk · High reward · Volatile',
      returnBase:  0.04,
      riskWeight:  1.0,
      volatility:  1.8,
    },
    {
      id: 'div',
      label: 'Diversified',
      icon: '📊',
      color: C_DIV,
      dark: '#1a1730',
      desc: 'Moderate buffer · Mixed assets',
      returnBase:  0.022,
      riskWeight:  0.4,
      volatility:  0.5,
    },
  ];

  /* ── market event catalogue ───────────────────────────────── */
  const EVENTS_LVL1 = [
    { id:'minordip',   label:'Minor Market Dip',      icon:'📉', color:WARN,   desc:'Stocks slip slightly.',          affect:{ crypto:-4, div:-2 },   hint:'Consider adding more Cash.' },
    { id:'recovery',   label:'Recovery Signal',        icon:'📈', color:C_DIV,  desc:'Markets stabilise.',             affect:{ div:+3 },               hint:'Diversified assets are benefiting.' },
    { id:'newsblip',   label:'Breaking News Blip',     icon:'📰', color:WARN,   desc:'Uncertainty causes small dip.',  affect:{ crypto:-5 },            hint:'Crypto reacts to headlines fast.' },
    { id:'goldmove',   label:'Safe Haven Demand',      icon:'🥇', color:C_CASH, desc:'Investors move to safety.',      affect:{ cash:+2, crypto:-3 },   hint:'Cash holds value in uncertainty.' },
    { id:'hype',       label:'Social Media Hype',      icon:'🔥', color:WARN,   desc:'Crypto pumps briefly.',          affect:{ crypto:+6, div:-2 },    hint:'Hype-driven gains can reverse fast.' },
    { id:'fed',        label:'Fed Rate Signal',        icon:'🏦', color:AC2,    desc:'Rates expected to hold.',        affect:{ div:+2, cash:+1 },      hint:'Stable rates help balanced portfolios.' },
  ];

  const EVENTS_LVL2 = [
    { id:'crash',      label:'MARKET CRASH!',          icon:'💥', color:DANGER, desc:'Crypto down 30% — panic selling!',affect:{ crypto:-28, div:-10 },  hint:'Shift hard into Cash now.' },
    { id:'bullrun',    label:'CRYPTO BULL RUN!',       icon:'🚀', color:GOLD,   desc:'BTC surges 40% — mania phase.',  affect:{ crypto:+35, div:+5 },   hint:'Trim Crypto to stay balanced.' },
    { id:'recession',  label:'RECESSION WARNING!',     icon:'🌧', color:DANGER, desc:'GDP contracts — broad sell-off.',affect:{ crypto:-15, div:-12 },  hint:'Raise Cash, cut risk fast.' },
    { id:'inflation',  label:'INFLATION SHOCK!',       icon:'🔥', color:DANGER, desc:'Inflation spikes 9% — cash erodes.',affect:{ cash:-8, crypto:-10 },hint:'Move to Diversified assets.' },
    { id:'regulation', label:'REGULATORY CRACKDOWN!',  icon:'⚠️', color:DANGER, desc:'Crypto banned in major market.',  affect:{ crypto:-22 },           hint:'Cut Crypto exposure immediately.' },
    { id:'viraltweet', label:'CEO TWEET — 1000% UP!',  icon:'🐦', color:GOLD,   desc:'Social media pumps Crypto hard.', affect:{ crypto:+28, div:-4 },  hint:'Hype bubbles pop — rebalance!' },
    { id:'geo',        label:'GEOPOLITICAL CRISIS!',   icon:'⚡', color:DANGER, desc:'Global conflict shocks markets.', affect:{ crypto:-18, div:-14 },  hint:'Safe havens only. Go to Cash.' },
    { id:'adoption',   label:'INSTITUTIONAL ADOPT.',   icon:'🏛', color:C_DIV,  desc:'Wall Street buys Crypto en masse.',affect:{ crypto:+20, div:+8 },  hint:'Could be a turning point — watch risk.' },
    { id:'etfapproval',label:'CRYPTO ETF APPROVED!',   icon:'📜', color:GOLD,   desc:'Regulatory green light — surge!',  affect:{ crypto:+18, div:+6 },  hint:'Diversified assets benefit too.' },
  ];

  const EVENTS_LVL3 = [
    { id:'depeg',      label:'STABLECOIN DE-PEGS!',    icon:'⛓️‍💥', color:DANGER, desc:'A "stable" coin breaks $1 and craters to 60¢.', affect:{ crypto:-32, cash:-6 },  hint:'Nothing is 100% safe — check backing, not just the label.' },
    { id:'exchcollapse',label:'EXCHANGE COLLAPSES!',   icon:'🏦', color:DANGER, desc:'A major exchange freezes withdrawals overnight.', affect:{ crypto:-36, div:-16 }, hint:'Contagion spreads fast — this is why you diversify.' },
    { id:'whipsaw',    label:'FLASH CRASH & SNAPBACK', icon:'⚡', color:WARN,   desc:'Price free-falls 25% then fully recovers in seconds.', affect:{ crypto:-30 },      hint:'Panic-selling here locks in a loss that reverses anyway.' },
    { id:'dedollar',   label:'DE-DOLLARIZATION SHIFT', icon:'🌐', color:C_DIV,  desc:'Nations shift reserves away from the dollar.',    affect:{ cash:-10, crypto:+14 }, hint:'Currency shifts change what "safe" even means.' },
    { id:'ratehike',   label:'SURPRISE RATE HIKE!',    icon:'📈', color:DANGER, desc:'Central bank hikes rates hard, unannounced.',     affect:{ crypto:-20, div:-14 }, hint:'Higher borrowing costs squeeze risky assets first.' },
    { id:'supplyshock',label:'SUPPLY CHAIN SHOCK',     icon:'🚢', color:WARN,   desc:'A shipping crunch hits real-economy earnings.',   affect:{ div:-18, crypto:+6 }, hint:'Diversified holdings feel real-world shocks too.' },
    { id:'rugpull',    label:'PROJECT INSOLVENCY!',    icon:'🕳️', color:DANGER, desc:'A top crypto project runs out of reserves and folds.', affect:{ crypto:-34, div:-8 }, hint:'Concentration in one project multiplies this pain.' },
    { id:'swfmove',    label:'SOVEREIGN FUND SHIFT',   icon:'🏛️', color:GOLD,   desc:'A national wealth fund reallocates billions into crypto.', affect:{ crypto:+30, cash:-5 }, hint:'Big institutional money can move markets overnight.' },
    { id:'algospike',  label:'ALGO-TRADING SPIKE',     icon:'🤖', color:AC2,    desc:'Automated trading bots trigger a violent swing.', affect:{ crypto:-24, div:+10 }, hint:'Machines can amplify moves faster than any headline.' },
    { id:'creditfreeze',label:'CREDIT MARKET FREEZE',  icon:'🧊', color:DANGER, desc:'Lending dries up across the board — everyone sells.', affect:{ crypto:-20, div:-18, cash:+4 }, hint:'When credit freezes, even Cash allocation matters more.' },
  ];

  /* ── risk meter config ────────────────────────────────────── */
  const SAFE_BAND_LOW  = 20;  // risk meter 0–100
  const SAFE_BAND_HIGH = 70;
  const TOO_SAFE_THRESH  = 15; // below = missing gains
  const TOO_RISKY_THRESH = 78; // above = danger zone

  /* ── scoring thresholds ────────────────────────────────────── */
  // Portfolio starts at 10000. Win if above 10000. Score = final value.
  const STAR3_SCORE = 12500;
  const STAR2_SCORE = 10500;
  const SAFETY_THRESHOLD = 8000;   // lose if below this

  /* ── level configs ────────────────────────────────────────── */
  const LEVEL_CFG = [
    {
      level: 1, title: 'LEARN', subtitle: 'Predictable Market Swings',
      duration: 75,          // seconds
      eventPool: EVENTS_LVL1,
      eventIntervalMs: 7000,
      eventDurationMs: 5000,
      maxSimultaneous: 1,
      priceShiftScale: 0.6,
      stabilityBonus: 3,
    },
    {
      level: 2, title: 'MASTER', subtitle: 'Chaos & Crisis',
      duration: 90,
      eventPool: EVENTS_LVL2,
      eventIntervalMs: 4500,
      eventDurationMs: 4000,
      maxSimultaneous: 2,
      priceShiftScale: 1.2,
      stabilityBonus: 5,
    },
    {
      level: 3, title: 'LEGEND', subtitle: 'Contagion & Compound Shocks',
      duration: 100,
      eventPool: EVENTS_LVL3,
      eventIntervalMs: 3500,
      eventDurationMs: 3500,
      maxSimultaneous: 3,
      priceShiftScale: 1.6,
      stabilityBonus: 7,
    },
  ];

  /* ── level config lookup (generic, off-by-one-proof) ──────── */
  function getLevelCfg(lv) {
    return LEVEL_CFG.find(c => c.level === lv) || LEVEL_CFG[0];
  }

  /* ── module state ─────────────────────────────────────────── */
  let G = null;
  let raf = null;
  let bgCtx = null;
  // Track document-level drag listeners so they can be removed on cleanup
  let _docListeners = [];

  /* ══════════════════════════════════════════════════════════
     SCREEN REGISTRATION
  ══════════════════════════════════════════════════════════ */
  window.SCREENS = window.SCREENS || {};

  window.SCREENS.game_bsv_volatilityvortex = function () {
    G = null;
    cancelAnimationFrame(raf);
    setTimeout(initGame, 40);
    return `
<div id="vvRoot" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none;">

  <!-- animated vortex canvas (bg) -->
  <canvas id="vvBgCanvas" style="position:absolute;inset:0;pointer-events:none;opacity:0.55;"></canvas>

  <!-- particle canvas -->
  <canvas id="vvPartCanvas" style="position:absolute;inset:0;pointer-events:none;opacity:0.7;"></canvas>

  <!-- TOP BAR ───────────────────────────────────────────── -->
  <div id="vvTopBar" style="position:absolute;top:0;left:0;right:0;height:54px;background:rgba(3,4,12,.85);border-bottom:1px solid ${AC}33;display:flex;align-items:center;padding:0 12px;gap:10px;z-index:50;backdrop-filter:blur(6px);">
    <button id="vvBackBtn" style="background:none;border:1px solid ${AC}55;color:${AC};font-family:Orbitron,monospace;font-size:11px;padding:6px 11px;border-radius:7px;cursor:pointer;letter-spacing:.08em;white-space:nowrap;flex-shrink:0;">← HUB</button>
    <div style="font-family:Orbitron,monospace;font-size:12px;font-weight:700;color:${AC};letter-spacing:1.5px;flex:1;text-align:center;text-shadow:0 0 12px ${AC}88;">VOLATILITY VORTEX</div>
    <button id="vvHelpBtn" title="How to play" style="background:none;border:1px solid ${AC}55;color:${AC};font-size:12px;padding:6px 9px;border-radius:7px;cursor:pointer;flex-shrink:0;">❓</button>
    <div style="display:flex;align-items:center;gap:14px;flex-shrink:0;">
      <div style="text-align:center;">
        <div style="font-size:8px;color:#aaa;letter-spacing:1px;font-family:Orbitron,monospace;">PORTFOLIO</div>
        <div id="vvPortVal" style="font-family:Orbitron,monospace;font-size:14px;color:${AC};font-weight:700;font-variant-numeric:tabular-nums;">$10,000</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:8px;color:#aaa;letter-spacing:1px;font-family:Orbitron,monospace;">TIME</div>
        <div id="vvTimer" style="font-family:Orbitron,monospace;font-size:16px;color:#fff;font-weight:700;font-variant-numeric:tabular-nums;">75s</div>
      </div>
    </div>
  </div>

  <!-- RISK METER ────────────────────────────────────────── -->
  <div id="vvRiskSection" style="position:absolute;top:54px;left:0;right:0;padding:8px 14px 6px;background:rgba(3,4,12,.7);border-bottom:1px solid ${AC}22;z-index:40;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <span style="font-family:Orbitron,monospace;font-size:8px;letter-spacing:1.2px;color:rgba(255,255,255,.5);">RISK METER</span>
      <span id="vvRiskLabel" style="font-family:Orbitron,monospace;font-size:9px;font-weight:700;color:${AC};letter-spacing:1px;">BALANCED</span>
    </div>
    <!-- meter track -->
    <div style="position:relative;height:22px;border-radius:6px;background:rgba(255,255,255,.06);border:1px solid ${AC}33;overflow:hidden;">
      <!-- safe band highlight -->
      <div style="position:absolute;top:0;bottom:0;left:${SAFE_BAND_LOW}%;width:${SAFE_BAND_HIGH-SAFE_BAND_LOW}%;background:${AC}18;pointer-events:none;"></div>
      <!-- left danger zone -->
      <div style="position:absolute;top:0;bottom:0;left:0;width:${TOO_SAFE_THRESH}%;background:${WARN}18;pointer-events:none;"></div>
      <!-- right danger zone -->
      <div style="position:absolute;top:0;bottom:0;left:${TOO_RISKY_THRESH}%;right:0;background:${DANGER}22;pointer-events:none;"></div>
      <!-- risk fill bar -->
      <div id="vvRiskFill" style="position:absolute;top:0;bottom:0;left:0;width:40%;border-radius:6px;background:linear-gradient(90deg,${C_CASH},${AC},${C_CRYPTO});transition:width .4s ease,opacity .2s;pointer-events:none;"></div>
      <!-- needle indicator -->
      <div id="vvRiskNeedle" style="position:absolute;top:-1px;bottom:-1px;width:3px;background:#fff;border-radius:2px;transform:translateX(-50%);left:40%;transition:left .4s ease;pointer-events:none;box-shadow:0 0 8px #fff9;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:7px;color:rgba(255,255,255,.3);margin-top:2px;font-family:Orbitron,monospace;letter-spacing:.08em;">
      <span>TOO SAFE (MISS GAINS)</span><span style="color:${AC}88;">STABLE BAND</span><span>TOO RISKY (CRASH)</span>
    </div>
  </div>

  <!-- LEVEL BADGE -->
  <div id="vvLevelBadge" style="position:absolute;top:134px;left:14px;z-index:30;font-family:Orbitron,monospace;font-size:8px;letter-spacing:1.2px;color:rgba(255,255,255,.45);">LVL 1 · LEARN</div>

  <!-- EVENT FLASH BANNER -->
  <div id="vvEventBanner" style="position:absolute;top:138px;left:50%;transform:translateX(-50%);z-index:45;display:none;min-width:240px;max-width:92vw;text-align:center;border-radius:12px;padding:10px 16px 12px;border:1.5px solid ${AC};background:rgba(3,4,12,.94);backdrop-filter:blur(8px);box-shadow:0 0 24px ${AC}44;">
    <div id="vvEvIcon" style="font-size:1.6rem;line-height:1.3;"></div>
    <div id="vvEvTitle" style="font-family:Orbitron,monospace;font-size:11px;letter-spacing:1.2px;color:#FFB300;margin:2px 0;font-weight:700;"></div>
    <div id="vvEvDesc" style="font-size:11px;color:rgba(255,255,255,.8);margin:2px 0;"></div>
    <div id="vvEvHint" style="font-family:Orbitron,monospace;font-size:8px;letter-spacing:.8px;color:${AC};margin-top:4px;"></div>
    <div id="vvEvTimer" style="margin-top:6px;height:3px;border-radius:3px;background:${AC};transform-origin:left;"></div>
  </div>

  <!-- SLIDERS AREA ──────────────────────────────────────── -->
  <div id="vvSliders" style="position:absolute;top:158px;left:0;right:0;bottom:90px;overflow-y:auto;padding:6px 13px 10px;display:flex;flex-direction:column;gap:9px;"></div>

  <!-- BOTTOM BAR ────────────────────────────────────────── -->
  <div style="position:absolute;bottom:0;left:0;right:0;height:90px;background:linear-gradient(0deg,rgba(3,4,12,.98) 70%,transparent);z-index:40;padding:10px 14px 14px;display:flex;flex-direction:column;gap:6px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="font-family:Orbitron,monospace;font-size:9px;letter-spacing:.8px;color:rgba(255,255,255,.45);">TOTAL: <span id="vvTotalPct" style="color:#fff;">100%</span></div>
      <div id="vvStatusChip" style="font-family:Orbitron,monospace;font-size:9px;letter-spacing:.8px;padding:4px 12px;border-radius:20px;border:1px solid ${AC};background:${AC}22;color:${AC};">PORTFOLIO BALANCED</div>
      <div style="font-family:Orbitron,monospace;font-size:9px;color:rgba(255,255,255,.45);">STABILITY: <span id="vvStabScore" style="color:${AC};">0</span></div>
    </div>
    <div style="height:3px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;">
      <div id="vvPortBar" style="height:100%;width:100%;border-radius:3px;background:linear-gradient(90deg,${C_CASH},${AC},${C_CRYPTO});transition:width .4s,background .4s;"></div>
    </div>
    <div style="text-align:center;font-size:9px;color:rgba(255,255,255,.35);font-family:Orbitron,monospace;letter-spacing:.08em;">DRAG SLIDERS — KEEP RISK IN THE CYAN BAND</div>
  </div>

  <!-- END OVERLAY ───────────────────────────────────────── -->
  <div id="vvOver" style="position:absolute;inset:0;z-index:100;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.95);backdrop-filter:blur(8px);"></div>

</div>`;
  };

  /* ══════════════════════════════════════════════════════════
     EXIT FUNCTION
  ══════════════════════════════════════════════════════════ */
  window.bsv_volatilityvortexExit = function () {
    cleanupGame();
    if (window.state) state.viewingWorld = 'builder';
    goTo('hub');
  };

  /* ── debug hooks (dev/QA only — G is module-private) ──── */
  window._vvDbg = () => G ? {
    level: G.level,
    portValue: Math.round(G.portValue),
    startValue: G.startValue,
    riskMeter: Math.round(G.riskMeter),
    timeLeft: Math.round(G.timeLeft),
    timeLeftRaw: G.timeLeft,   // unrounded — needed to verify pause/resume math to sub-second precision
    phase: G.phase,
    cfgTitle: G.cfg && G.cfg.title,
  } : null;

  window._vvForceAdvance = () => {
    if (G) {
      G.timeLeft = 0.01;
      G.portValue = Math.max(G.portValue, G.startValue + 1);
    }
  };

  /* ── shake (bad market events / crash) ───────────────────── */
  function shakeRoot() {
    const root = document.getElementById('vvRoot');
    if (!root) return;
    root.classList.remove('vv-shaking');
    void root.offsetWidth;
    root.classList.add('vv-shaking');
  }

  /* ── cleanup ──────────────────────────────────────────── */
  function cleanupGame() {
    G = null;
    cancelAnimationFrame(raf);
    raf = null;
    bgCtx = null;
    // Remove all document-level drag listeners accumulated from setupSliderEvents
    _docListeners.forEach(({ type, fn, opts }) => {
      if (opts !== undefined) {
        document.removeEventListener(type, fn, opts);
      } else {
        document.removeEventListener(type, fn);
      }
    });
    _docListeners = [];
  }

  /* ══════════════════════════════════════════════════════════
     INIT GAME
  ══════════════════════════════════════════════════════════ */
  function initGame() {
    const root = document.getElementById('vvRoot');
    if (!root) return;

    /* back button */
    const backBtn = document.getElementById('vvBackBtn');
    if (backBtn) backBtn.onclick = window.bsv_volatilityvortexExit;

    /* help button — reopens the same HOW TO PLAY overlay shown at intro, without losing the run */
    const helpBtn = document.getElementById('vvHelpBtn');
    if (helpBtn) helpBtn.onclick = window.bsv_vvShowHelp;

    /* setup bg canvas */
    setupBgCanvas();
    setupParticles();

    /* bootstrap state */
    G = {
      level: 1,
      cfg: getLevelCfg(1),
      phase: 'intro',      // 'intro' | 'play' | 'event' | 'paused' | 'between' | 'over' — tick() only advances time/portfolio during 'play'/'event'

      /* portfolio */
      startValue: 10000,
      portValue: 10000,
      portGrowth: 0,       // percent gain/loss vs start

      /* allocations — sum to 100 */
      allocs: { cash: 40, crypto: 30, div: 30 },

      /* asset price offsets (percentage point bonus/penalty) */
      prices: { cash: 0, crypto: 0, div: 0 },

      /* risk meter 0–100 */
      riskMeter: 40,
      riskTarget: 40,
      riskInStableMs: 0,
      riskOutStableMs: 0,
      stabilityScore: 0,
      stableStreakMs: 0,   // cosmetic-only: CURRENT consecutive ms in the safe band (resets on exit,
                           // unlike riskInStableMs which is a lifetime cumulative total). Drives the
                           // STABILITY chip's glow escalation only — never read by scoring/thresholds.

      /* time */
      timeLeft: getLevelCfg(1).duration,
      lastTick: performance.now(),

      /* events */
      activeEvents: [],
      eventCooldown: 2500,
      nextEventIn: 3500,
      lastEventId: null,   // guards against firing the same event twice in a row

      /* dragging */
      dragging: null,
      dragStartX: 0,
      dragStartAlloc: 0,

      /* crash/win flags */
      crashed: false,
      levelCleared: false,

      /* particles */
      particles: [],
    };

    buildSliders();
    updateAllVisuals();
    startLoop();
    showHowToPlay();   // shown once automatically before Level 1 truly starts; tick() already no-ops
                        // outside phase 'play'/'event', and refreshes G.lastTick every frame even
                        // while paused (see tick(), line ~813) — so resuming needs no extra timestamp math.
  }

  /* ── HOW-TO-PLAY overlay — shown once automatically before Level 1,
     re-opened anytime via the ❓ button without losing the run.
     Pausing = set G.phase = 'paused'. tick() keeps running every frame
     (drawing the background) but skips ALL of timeLeft/portfolio/risk/
     event logic while phase isn't 'play'/'event', and keeps G.lastTick
     fresh every frame regardless of phase — so the instant we flip back
     to 'play' the very next dt is just one frame's worth, never the
     paused duration. No manual timestamp shifting needed here. ── */
  function showHowToPlay() {
    const overlay = document.getElementById('vvOver');
    if (!overlay || !G) return;
    const wasActive = G.phase === 'play' || G.phase === 'event';
    if (wasActive) G.phase = 'paused';
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div style="max-width:360px;width:90%;text-align:center;padding:0 12px;">
        <div style="font-family:Orbitron,monospace;font-size:11px;letter-spacing:2px;color:${AC};margin-bottom:10px;">HOW TO PLAY</div>
        <div style="font-size:2.2rem;margin-bottom:8px;">🌪️</div>
        <div style="font-family:'Anton',sans-serif;font-size:19px;letter-spacing:.02em;color:${AC};text-shadow:0 0 20px ${AC}88;margin-bottom:16px;">VOLATILITY VORTEX</div>
        <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:13px 15px;margin-bottom:20px;text-align:left;">
          <div style="display:flex;flex-direction:column;gap:9px;">
            <div style="display:flex;gap:8px;align-items:flex-start;"><span style="font-size:14px;flex-shrink:0;">🎯</span><span style="font-size:11px;color:rgba(255,255,255,.8);line-height:1.5;">Split $10,000 across <b style="color:${C_CASH}">Cash</b>, <b style="color:${C_CRYPTO}">Crypto</b>, and <b style="color:${C_DIV}">Diversified</b> — finish above where you started.</span></div>
            <div style="display:flex;gap:8px;align-items:flex-start;"><span style="font-size:14px;flex-shrink:0;">👆</span><span style="font-size:11px;color:rgba(255,255,255,.8);line-height:1.5;">Drag each slider to change how much you hold. All three always add up to 100%.</span></div>
            <div style="display:flex;gap:8px;align-items:flex-start;"><span style="font-size:14px;flex-shrink:0;">⚡</span><span style="font-size:11px;color:rgba(255,255,255,.8);line-height:1.5;">Watch for market events — crashes, bull runs, and breaking news shift prices fast. Read the hint and rebalance.</span></div>
            <div style="display:flex;gap:8px;align-items:flex-start;"><span style="font-size:14px;flex-shrink:0;">⚖️</span><span style="font-size:11px;color:rgba(255,255,255,.8);line-height:1.5;">Keep the <b style="color:${AC}">Risk Meter</b> needle in the cyan band — too safe misses gains, too risky risks a crash.</span></div>
            <div style="display:flex;gap:8px;align-items:flex-start;"><span style="font-size:14px;flex-shrink:0;">⏱️</span><span style="font-size:11px;color:rgba(255,255,255,.8);line-height:1.5;">Same rules on all 3 levels — later levels just bring faster, bigger swings.</span></div>
          </div>
        </div>
        <button id="vvHowtoDismiss" style="padding:13px 30px;border-radius:10px;cursor:pointer;background:${AC}22;border:1.5px solid ${AC};color:${AC};font-family:Orbitron,monospace;font-size:12px;letter-spacing:1px;font-weight:700;">${wasActive ? '▶ RESUME' : 'GOT IT — START ▶'}</button>
      </div>`;
    document.getElementById('vvHowtoDismiss').onclick = () => {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
      if (G && (G.phase === 'intro' || G.phase === 'paused')) {
        G.phase = 'play';
      }
    };
  }

  // ── ❓ re-open the how-to-play overlay mid-game without losing the run ──
  window.bsv_vvShowHelp = function () {
    if (!G || G.phase === 'over' || G.phase === 'between' || G.phase === 'intro') return;
    showHowToPlay();
  };

  /* ══════════════════════════════════════════════════════════
     BACKGROUND VORTEX CANVAS
  ══════════════════════════════════════════════════════════ */
  let bgVortexAngle = 0;
  let bgParticles = [];
  let partCtx = null;

  function setupBgCanvas() {
    const c = document.getElementById('vvBgCanvas');
    if (!c) return;
    c.width = c.offsetWidth || 390;
    c.height = c.offsetHeight || 844;
    bgCtx = c.getContext('2d');
    bgParticles = [];
  }

  function setupParticles() {
    const c = document.getElementById('vvPartCanvas');
    if (!c) return;
    c.width = c.offsetWidth || 390;
    c.height = c.offsetHeight || 844;
    partCtx = c.getContext('2d');
    // spawn ambient particles
    for (let i = 0; i < 38; i++) spawnAmbientParticle();
  }

  function spawnAmbientParticle() {
    if (!partCtx) return;
    const c = document.getElementById('vvPartCanvas');
    const w = c ? c.width : 390;
    const h = c ? c.height : 844;
    const colors = [AC, C_CRYPTO + '99', C_DIV + '88', C_CASH + '77'];
    bgParticles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.7 - 0.1,
      r: Math.random() * 2.2 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      life: 0,
      maxLife: 140 + Math.random() * 200,
      color: colors[Math.floor(Math.random() * colors.length)],
      twist: (Math.random() - 0.5) * 0.04,
    });
  }

  function drawBg(now) {
    if (!bgCtx) return;
    const c = document.getElementById('vvBgCanvas');
    if (!c) return;
    const w = c.width, h = c.height;

    const _vvBg=bgCtx.createLinearGradient(0,0,0,h);
    _vvBg.addColorStop(0,'#03081a'); _vvBg.addColorStop(0.5,'#050c22'); _vvBg.addColorStop(1,'#03081a');
    bgCtx.fillStyle=_vvBg; bgCtx.fillRect(0,0,w,h);
    bgVortexAngle += 0.004;

    /* draw vortex spiral lines */
    const cx = w * 0.5, cy = h * 0.62;
    for (let i = 0; i < 7; i++) {
      const baseAngle = bgVortexAngle + (i / 7) * Math.PI * 2;
      bgCtx.beginPath();
      for (let t = 0; t < 400; t += 2) {
        const r = t * 0.55;
        const a = baseAngle + t * 0.03;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a) * 0.45;
        if (t === 0) bgCtx.moveTo(x, y);
        else bgCtx.lineTo(x, y);
      }
      const alpha = 0.12 + Math.sin(bgVortexAngle * 2 + i) * 0.04;
      bgCtx.strokeStyle = i % 2 === 0 ? `rgba(0,255,255,${alpha})` : `rgba(124,131,253,${alpha * 0.7})`;
      bgCtx.lineWidth = 0.8;
      bgCtx.stroke();
    }

    /* pulse ring */
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.0012);
    bgCtx.beginPath();
    bgCtx.arc(cx, cy, 60 + pulse * 40, 0, Math.PI * 2);
    bgCtx.strokeStyle = `rgba(0,255,255,${0.08 + pulse * 0.06})`;
    bgCtx.lineWidth = 1.5;
    bgCtx.stroke();
  }

  function drawParticles() {
    if (!partCtx) return;
    const c = document.getElementById('vvPartCanvas');
    if (!c) return;
    const w = c.width, h = c.height;
    partCtx.clearRect(0, 0, w, h);

    for (let i = bgParticles.length - 1; i >= 0; i--) {
      const p = bgParticles[i];
      p.life++;
      p.x += p.vx + Math.sin(p.life * p.twist) * 0.3;
      p.y += p.vy;
      const lifeRatio = p.life / p.maxLife;
      const a = p.alpha * (lifeRatio < 0.15 ? lifeRatio / 0.15 : lifeRatio > 0.8 ? (1 - lifeRatio) / 0.2 : 1);

      partCtx.beginPath();
      partCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      partCtx.fillStyle = p.color.length > 7 ? p.color : p.color + Math.round(a * 255).toString(16).padStart(2, '0');
      partCtx.fill();

      if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > w + 10) {
        bgParticles.splice(i, 1);
        spawnAmbientParticle();
      }
    }
  }

  /* ══════════════════════════════════════════════════════════
     BUILD SLIDER CARDS
  ══════════════════════════════════════════════════════════ */
  function buildSliders() {
    const container = document.getElementById('vvSliders');
    if (!container || !G) return;
    container.innerHTML = '';

    ASSETS.forEach(asset => {
      const pct = G.allocs[asset.id];
      const card = document.createElement('div');
      card.id = `vv_card_${asset.id}`;
      card.style.cssText = `background:rgba(255,255,255,.04);border:1px solid ${asset.color}33;border-radius:13px;padding:11px 13px;position:relative;overflow:hidden;transition:border-color .25s,box-shadow .25s;`;

      card.innerHTML = `
        <!-- glow strip -->
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${asset.color}88,transparent);pointer-events:none;"></div>

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px;">
          <div style="font-size:1.25rem;line-height:1;">${asset.icon}</div>
          <div style="flex:1;">
            <div style="font-family:Orbitron,monospace;font-size:10px;letter-spacing:1.2px;color:${asset.color};font-weight:700;">${asset.label.toUpperCase()}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.38);margin-top:1px;">${asset.desc}</div>
          </div>
          <div style="text-align:right;">
            <div id="vv_pct_${asset.id}" style="font-family:Orbitron,monospace;font-size:22px;font-weight:700;color:${asset.color};font-variant-numeric:tabular-nums;line-height:1;">${pct}%</div>
            <div id="vv_gain_${asset.id}" style="font-size:8px;color:rgba(255,255,255,.4);font-family:Orbitron,monospace;margin-top:1px;">+0.0%</div>
          </div>
        </div>

        <!-- slider track -->
        <div id="vv_track_${asset.id}" style="position:relative;height:32px;border-radius:8px;background:rgba(255,255,255,.06);overflow:visible;cursor:grab;touch-action:none;border:1px solid ${asset.color}22;-webkit-tap-highlight-color:transparent;">
          <!-- fill -->
          <div id="vv_fill_${asset.id}" style="position:absolute;inset:0;border-radius:8px;background:linear-gradient(90deg,${asset.dark},${asset.color}99);width:${pct}%;pointer-events:none;transition:width .08s;"></div>
          <!-- min/max markers -->
          <div style="position:absolute;top:0;bottom:0;left:10%;width:1px;background:${asset.color}44;pointer-events:none;"></div>
          <div style="position:absolute;top:0;bottom:0;left:70%;width:1px;background:${asset.color}44;pointer-events:none;"></div>
          <!-- thumb -->
          <div id="vv_thumb_${asset.id}" style="position:absolute;top:50%;width:26px;height:26px;border-radius:50%;background:${BG};border:2.5px solid ${asset.color};transform:translate(-50%,-50%);left:${pct}%;pointer-events:none;box-shadow:0 0 14px ${asset.color}99;transition:left .08s;display:flex;align-items:center;justify-content:center;">
            <div style="width:8px;height:8px;border-radius:50%;background:${asset.color};"></div>
          </div>
        </div>

        <!-- mini price chart placeholder -->
        <canvas id="vv_chart_${asset.id}" width="200" height="22" style="margin-top:7px;width:100%;height:22px;opacity:0.7;display:block;"></canvas>
      `;

      container.appendChild(card);
      setupSliderEvents(asset.id, card);
      initMiniChart(asset.id);
    });
  }

  /* ── mini price chart history ─────────────────────────── */
  const chartHistory = { cash: [], crypto: [], div: [] };
  function initMiniChart(id) {
    for (let i = 0; i < 30; i++) chartHistory[id].push(0);
  }

  function drawMiniChart(id) {
    const canvas = document.getElementById(`vv_chart_${id}`);
    if (!canvas || !G) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const hist = chartHistory[id];
    const asset = ASSETS.find(a => a.id === id);
    if (!asset || hist.length < 2) return;

    const min = Math.min(...hist) - 1;
    const max = Math.max(...hist) + 1;
    const range = max - min || 1;

    ctx.beginPath();
    hist.forEach((v, i) => {
      const x = (i / (hist.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = asset.color + 'cc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // fill under line
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, asset.color + '44');
    grad.addColorStop(1, asset.color + '00');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  /* ── slider drag events ────────────────────────────────── */
  function setupSliderEvents(id, card) {
    const track = document.getElementById(`vv_track_${id}`);
    if (!track) return;

    function getXRatio(e) {
      const rect = track.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    }

    function startDrag(e) {
      if (!G || G.phase === 'over') return;
      e.preventDefault();
      G.dragging = id;
      G.dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
      G.dragStartAlloc = G.allocs[id];
      track.style.cursor = 'grabbing';
      applyDrag(e);
    }

    function applyDrag(e) {
      if (!G || G.dragging !== id) return;
      e.preventDefault();
      const ratio = getXRatio(e);
      const newVal = Math.round(ratio * 100);
      setAlloc(id, newVal);
    }

    function endDrag(e) {
      if (!G || G.dragging !== id) return;
      G.dragging = null;
      track.style.cursor = 'grab';
    }

    track.addEventListener('mousedown',  startDrag, { passive: false });
    track.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('mousemove',  applyDrag, { passive: false });
    document.addEventListener('touchmove',  applyDrag, { passive: false });
    document.addEventListener('mouseup',    endDrag);
    document.addEventListener('touchend',   endDrag);

    // Store refs for removal on cleanup
    _docListeners.push(
      { type: 'mousemove', fn: applyDrag, opts: { passive: false } },
      { type: 'touchmove', fn: applyDrag, opts: { passive: false } },
      { type: 'mouseup',   fn: endDrag,   opts: undefined },
      { type: 'touchend',  fn: endDrag,   opts: undefined }
    );
  }

  /* ── allocation logic: keep sum=100, clamp each 0–90 ───── */
  function setAlloc(id, newVal) {
    if (!G) return;
    newVal = Math.max(0, Math.min(90, newVal));
    const oldVal = G.allocs[id];
    const delta = newVal - oldVal;
    if (delta === 0) return;

    // distribute the delta across other two assets proportionally
    const others = ASSETS.map(a => a.id).filter(a => a !== id);
    const otherSum = others.reduce((s, a) => s + G.allocs[a], 0);

    if (otherSum === 0) {
      // edge: all in one; give delta evenly to others
      others.forEach(a => { G.allocs[a] = Math.max(0, G.allocs[a] - Math.round(delta / others.length)); });
    } else {
      others.forEach(a => {
        const share = G.allocs[a] / otherSum;
        G.allocs[a] = Math.max(0, Math.round(G.allocs[a] - delta * share));
      });
    }
    G.allocs[id] = newVal;

    // normalize to exactly 100
    let sum = ASSETS.reduce((s, a) => s + G.allocs[a.id], 0);
    let diff = 100 - sum;
    if (diff !== 0) {
      // add remainder to the largest other
      const largest = others.reduce((a, b) => G.allocs[a] >= G.allocs[b] ? a : b);
      G.allocs[largest] = Math.max(0, G.allocs[largest] + diff);
    }

    updateAllVisuals();
  }

  /* ══════════════════════════════════════════════════════════
     VISUAL UPDATES
  ══════════════════════════════════════════════════════════ */
  function updateAllVisuals() {
    if (!G) return;
    updateSliders();
    updateRiskMeter();
    updateTopBar();
    updateStatusChip();
    updatePortBar();
  }

  function updateSliders() {
    if (!G) return;
    ASSETS.forEach(asset => {
      const id = asset.id;
      const pct = G.allocs[id];
      const gainPct = G.prices[id] || 0;

      const pctEl   = document.getElementById(`vv_pct_${id}`);
      const gainEl  = document.getElementById(`vv_gain_${id}`);
      const fillEl  = document.getElementById(`vv_fill_${id}`);
      const thumbEl = document.getElementById(`vv_thumb_${id}`);
      const cardEl  = document.getElementById(`vv_card_${id}`);

      if (pctEl)   pctEl.textContent = pct + '%';
      if (fillEl)  fillEl.style.width = pct + '%';
      if (thumbEl) thumbEl.style.left = pct + '%';

      if (gainEl) {
        const sign = gainPct >= 0 ? '+' : '';
        gainEl.textContent = sign + gainPct.toFixed(1) + '%';
        gainEl.style.color = gainPct >= 0 ? '#69F0AE' : DANGER;
      }

      if (cardEl) {
        const isActive = pct > 0;
        cardEl.style.borderColor = isActive ? asset.color + '55' : asset.color + '18';
        cardEl.style.boxShadow = isActive ? `0 0 14px ${asset.color}22` : 'none';
      }

      drawMiniChart(id);
    });

    const totalEl = document.getElementById('vvTotalPct');
    if (totalEl) {
      const sum = ASSETS.reduce((s, a) => s + G.allocs[a.id], 0);
      totalEl.textContent = sum + '%';
      totalEl.style.color = sum === 100 ? '#fff' : DANGER;
    }
  }

  function computeRiskLevel() {
    if (!G) return 50;
    // weighted sum of allocations * riskWeight
    let risk = 0;
    ASSETS.forEach(asset => {
      risk += (G.allocs[asset.id] / 100) * asset.riskWeight * 100;
    });
    // boost risk if price volatility is active
    ASSETS.forEach(asset => {
      if (G.prices[asset.id] && asset.volatility > 0.5) {
        risk += Math.abs(G.prices[asset.id]) * asset.riskWeight * 0.5;
      }
    });
    return Math.max(0, Math.min(100, risk));
  }

  function updateRiskMeter() {
    if (!G) return;
    const risk = computeRiskLevel();
    G.riskMeter = risk;

    const fillEl   = document.getElementById('vvRiskFill');
    const needleEl = document.getElementById('vvRiskNeedle');
    const labelEl  = document.getElementById('vvRiskLabel');

    if (fillEl)   fillEl.style.width = risk + '%';
    if (needleEl) needleEl.style.left = risk + '%';

    let label = 'BALANCED', color = AC;
    if (risk < TOO_SAFE_THRESH) {
      label = 'TOO CONSERVATIVE'; color = WARN;
    } else if (risk < SAFE_BAND_LOW) {
      label = 'UNDEREXPOSED'; color = WARN;
    } else if (risk > TOO_RISKY_THRESH) {
      label = 'DANGER — OVEREXPOSED'; color = DANGER;
    } else if (risk > SAFE_BAND_HIGH) {
      label = 'HIGH RISK'; color = WARN;
    }

    if (labelEl) { labelEl.textContent = label; labelEl.style.color = color; }
    if (fillEl) {
      fillEl.style.opacity = risk > TOO_RISKY_THRESH ? '0.9' : '0.75';
    }
  }

  function updateTopBar() {
    if (!G) return;
    const portEl  = document.getElementById('vvPortVal');
    const timerEl = document.getElementById('vvTimer');
    if (portEl) {
      const val = Math.round(G.portValue);
      portEl.textContent = '$' + val.toLocaleString();
      portEl.style.color = G.portValue >= G.startValue ? AC : DANGER;
    }
    if (timerEl) {
      timerEl.textContent = Math.ceil(G.timeLeft) + 's';
      timerEl.style.color = G.timeLeft <= 10 ? DANGER : '#fff';
    }
  }

  function updateStatusChip() {
    if (!G) return;
    const chip = document.getElementById('vvStatusChip');
    if (!chip) return;
    const risk = G.riskMeter;
    let text = 'PORTFOLIO BALANCED', bg = AC + '22', border = AC, color = AC;

    if (risk < TOO_SAFE_THRESH) {
      text = 'MISSING GAINS!'; bg = WARN + '22'; border = WARN; color = WARN;
    } else if (risk > TOO_RISKY_THRESH) {
      text = 'CRASH RISK!'; bg = DANGER + '22'; border = DANGER; color = DANGER;
    } else if (G.portValue < SAFETY_THRESHOLD + 500) {
      text = 'NEAR THRESHOLD!'; bg = WARN + '22'; border = WARN; color = WARN;
    }

    chip.textContent = text;
    chip.style.background = bg;
    chip.style.borderColor = border;
    chip.style.color = color;
  }

  function updatePortBar() {
    if (!G) return;
    const bar = document.getElementById('vvPortBar');
    if (!bar) return;
    const ratio = Math.max(0, Math.min(1, (G.portValue - SAFETY_THRESHOLD) / (G.startValue * 1.8 - SAFETY_THRESHOLD)));
    bar.style.width = (ratio * 100) + '%';
    bar.style.background = G.portValue < SAFETY_THRESHOLD + 500
      ? `linear-gradient(90deg,${DANGER},${WARN})`
      : `linear-gradient(90deg,${C_CASH},${AC},${C_CRYPTO})`;
  }

  /* ══════════════════════════════════════════════════════════
     GAME LOOP
  ══════════════════════════════════════════════════════════ */
  function startLoop() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!G || G.phase === 'over') return;
    raf = requestAnimationFrame(tick);

    const dt = Math.min(now - G.lastTick, 80);
    G.lastTick = now;

    drawBg(now);
    drawParticles();

    if (G.phase === 'play' || G.phase === 'event') {
      G.timeLeft -= dt / 1000;

      // tick portfolio value
      tickPortfolio(dt);

      // risk tracking
      const risk = G.riskMeter;
      if (risk >= SAFE_BAND_LOW && risk <= SAFE_BAND_HIGH) {
        G.riskInStableMs += dt;
        G.stabilityScore += G.cfg.stabilityBonus * (dt / 1000);
        G.stableStreakMs += dt;   // cosmetic streak — see field comment above
      } else {
        G.riskOutStableMs += dt;
        // penalise for being out of zone
        G.portValue -= (Math.abs(risk - 45) * 0.005) * (dt / 1000) * 5;
        G.stableStreakMs = 0;     // streak breaks the instant risk leaves the safe band
      }

      // check crash
      if (G.portValue <= SAFETY_THRESHOLD) {
        G.crashed = true;
        shakeRoot();
        triggerGameOver(false);
        return;
      }

      // time expired
      if (G.timeLeft <= 0) {
        G.timeLeft = 0;
        const profitable = G.portValue > G.startValue;
        if (profitable && G.level < LEVEL_CFG.length) {
          // profitable finish, more levels remain — advance (lvl1->2, lvl2->3, ...)
          advanceToLevel(G.level + 1);
          return;
        } else {
          // final level reached, OR not profitable — this run ends here
          triggerGameOver(profitable);
          return;
        }
      }

      // event system
      G.nextEventIn -= dt;
      if (G.nextEventIn <= 0) {
        G.nextEventIn = G.cfg.eventIntervalMs + Math.random() * 2000;
        if (G.activeEvents.length < G.cfg.maxSimultaneous) {
          fireEvent();
        }
      }

      // tick active events
      tickEvents(dt, now);

      // update stability score display — reward escalation (cosmetic only, no scoring
      // change): the longer the CURRENT stable-band streak runs, the brighter/bolder
      // this chip glows, so staying balanced for a while visibly pays off more than
      // just having entered the zone a second ago. Resets instantly on stableStreakMs=0.
      const stabEl = document.getElementById('vvStabScore');
      if (stabEl) {
        stabEl.textContent = Math.round(G.stabilityScore);
        const streakDepth = Math.max(0, Math.min(5, Math.floor(G.stableStreakMs / 3000))); // +1 tier per 3s in-zone, caps at 5
        stabEl.style.textShadow = streakDepth > 0 ? `0 0 ${4 + streakDepth * 4}px ${AC}` : 'none';
        stabEl.style.fontWeight = streakDepth >= 3 ? '900' : '700';
      }

      updateAllVisuals();
    }
  }

  /* ── portfolio value tick ─────────────────────────────── */
  function tickPortfolio(dt) {
    if (!G) return;
    let totalReturn = 0;

    ASSETS.forEach(asset => {
      const weight = G.allocs[asset.id] / 100;
      // base return + current price offset influence
      const priceBonus = (G.prices[asset.id] || 0) / 100;
      const tick = weight * (asset.returnBase + priceBonus * 0.3) * (dt / 1000);
      totalReturn += tick;
    });

    // small random noise (fractional rate, like the other terms above — do NOT multiply by
    // G.portValue here, since it's applied via G.portValue * totalReturn below already)
    totalReturn += (Math.random() - 0.5) * 0.0004 * (dt / 1000);

    G.portValue += G.portValue * totalReturn;
    G.portValue = Math.max(100, G.portValue);

    // decay price offsets gradually back toward 0
    ASSETS.forEach(asset => {
      G.prices[asset.id] = (G.prices[asset.id] || 0) * (1 - 0.008 * (dt / 16));
      // add history
      chartHistory[asset.id].push(G.prices[asset.id]);
      if (chartHistory[asset.id].length > 30) chartHistory[asset.id].shift();
    });
  }

  /* ── fire a market event ──────────────────────────────── */
  function fireEvent() {
    if (!G) return;
    const pool = G.cfg.eventPool;
    let ev = pool[Math.floor(Math.random() * pool.length)];
    // avoid firing the exact same event back-to-back (small UX guard; safe no-op if pool has 1 entry)
    if (pool.length > 1 && ev.id === G.lastEventId) {
      let attempts = 0;
      while (ev.id === G.lastEventId && attempts < 5) {
        ev = pool[Math.floor(Math.random() * pool.length)];
        attempts++;
      }
    }
    G.lastEventId = ev.id;
    const instance = {
      ...ev,
      timeLeft: G.cfg.eventDurationMs,
      totalTime: G.cfg.eventDurationMs,
      id: ev.id + '_' + Date.now(),
    };
    G.activeEvents.push(instance);

    // Bad news (net-negative affect) gets a screen shake so a crash/recession
    // headline lands with real impact, not just a banner — good news doesn't shake.
    const netAffect = Object.values(ev.affect).reduce((s, v) => s + v, 0);
    if (netAffect < 0) shakeRoot();

    // apply price effects
    Object.entries(ev.affect).forEach(([assetId, delta]) => {
      if (G.prices[assetId] !== undefined) {
        G.prices[assetId] = (G.prices[assetId] || 0) + delta * G.cfg.priceShiftScale;
        // also directly nudge portfolio value for big events
        const directImpact = (G.allocs[assetId] / 100) * (delta * G.cfg.priceShiftScale * 0.8);
        G.portValue += G.portValue * (directImpact / 100);
      }
    });

    // show banner if single event
    if (G.activeEvents.length === 1) showEventBanner(instance);
  }

  /* ── tick events ──────────────────────────────────────── */
  function tickEvents(dt, now) {
    if (!G) return;
    G.activeEvents.forEach(ev => { ev.timeLeft -= dt; });
    G.activeEvents = G.activeEvents.filter(ev => {
      if (ev.timeLeft <= 0) {
        if (G.activeEvents[0] === ev) hideEventBanner();
        return false;
      }
      return true;
    });

    // update event timer bar
    if (G.activeEvents.length > 0) {
      const ev = G.activeEvents[0];
      const pct = (ev.timeLeft / ev.totalTime) * 100;
      const timerBar = document.getElementById('vvEvTimer');
      if (timerBar) timerBar.style.width = pct + '%';
    }
  }

  /* ── event banner UI ──────────────────────────────────── */
  function showEventBanner(ev) {
    const banner = document.getElementById('vvEventBanner');
    if (!banner) return;
    document.getElementById('vvEvIcon').textContent  = ev.icon;
    document.getElementById('vvEvTitle').textContent = ev.label;
    document.getElementById('vvEvDesc').textContent  = ev.desc;
    document.getElementById('vvEvHint').textContent  = '💡 ' + ev.hint;
    banner.style.borderColor = ev.color || AC;
    banner.style.display = 'block';
    banner.style.animation = 'none';
    banner.offsetWidth; // force reflow
    banner.style.animation = 'vvBannerIn .25s ease';
  }

  function hideEventBanner() {
    const banner = document.getElementById('vvEventBanner');
    if (banner) banner.style.display = 'none';
  }

  /* ── advance to an arbitrary level (generic, N-level safe) ── */
  function advanceToLevel(lv) {
    if (!G) return;
    G.level = lv;
    G.cfg = getLevelCfg(lv);
    G.timeLeft = G.cfg.duration;
    G.activeEvents = [];
    G.nextEventIn = 2000;
    G.lastEventId = null;
    G.lastTick = performance.now();
    hideEventBanner();

    const badge = document.getElementById('vvLevelBadge');
    if (badge) badge.textContent = `LVL ${lv} · ${G.cfg.title}`;

    // show level-up flash
    showLevelUpFlash(lv);
  }

  function showLevelUpFlash(lv) {
    const root = document.getElementById('vvRoot');
    if (!root) return;
    const cfg = getLevelCfg(lv);
    const flash = document.createElement('div');
    flash.style.cssText = `position:absolute;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,255,255,.08);pointer-events:none;animation:vvFlash .7s ease forwards;`;
    flash.innerHTML = `<div style="font-family:'Anton',sans-serif;font-size:32px;letter-spacing:.04em;color:${AC};text-shadow:0 0 30px ${AC};text-align:center;">LEVEL ${lv}<br><span style="font-family:Orbitron,monospace;font-size:14px;color:#fff;letter-spacing:1px;">${cfg.title} MODE — BRACE FOR IMPACT</span></div>`;
    root.appendChild(flash);
    setTimeout(() => { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 1200);
  }

  /* ══════════════════════════════════════════════════════════
     GAME OVER
  ══════════════════════════════════════════════════════════ */
  function triggerGameOver(won) {
    if (!G) return;
    G.phase = 'over';
    cancelAnimationFrame(raf);
    hideEventBanner();

    const finalValue = Math.round(G.portValue);
    const stability  = Math.round(G.stabilityScore);

    // compute score for star rating
    let score = finalValue + stability * 2;
    if (!won) score = 0;

    const stars = score >= STAR3_SCORE + stability * 2 - 100
      ? (finalValue >= STAR3_SCORE ? 3 : finalValue >= STAR2_SCORE ? 2 : 1)
      : (won ? (finalValue >= STAR2_SCORE ? 2 : 1) : 0);

    const actualStars = won ? Math.max(1, stars) : 0;
    endGame(actualStars, finalValue, won, stability);
  }

  function endGame(stars, finalValue, won, stability) {
    if (!stars && !won) stars = 0;
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bsv_volatilityvortex', { level: G.level, is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    const overlay = document.getElementById('vvOver');
    if (!overlay) return;

    const portChange = finalValue - 10000;
    const portPct = ((portChange / 10000) * 100).toFixed(1);
    const changeColor = portChange >= 0 ? C_CASH : DANGER;
    const starStr = stars > 0 ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '💸';

    overlay.style.display = 'flex';
    const confettiHTML = won ? Array.from({ length: 18 }, (_, i) => {
      const emo = ['✦', '●', '▲', '★', '💹'][i % 5], col = [AC, GOLD, C_DIV, C_CASH][i % 4];
      return `<span class="vv-confetti" style="left:${4 + Math.random() * 92}%;animation-delay:${(Math.random() * .5).toFixed(2)}s;color:${col}">${emo}</span>`;
    }).join('') : '';
    overlay.innerHTML = `${confettiHTML}
      <div class="${won ? 'vvWinPanel' : ''}" style="max-width:360px;width:90%;text-align:center;padding:0 12px;">
        <!-- title -->
        <div style="font-family:Orbitron,monospace;font-size:11px;letter-spacing:2px;color:${AC};margin-bottom:10px;">VOLATILITY VORTEX</div>

        <!-- outcome -->
        <div style="font-family:'Anton',sans-serif;font-size:${won?'30px':'26px'};letter-spacing:.02em;color:${won?AC:DANGER};margin-bottom:4px;text-shadow:0 0 20px ${won?AC:DANGER}88;line-height:1.2;">
          ${won ? 'MARKET SURVIVED' : 'PORTFOLIO CRASHED'}
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,.55);margin-bottom:18px;">${won ? 'You kept the portfolio above safety threshold.' : 'Your portfolio fell below the safety threshold.'}</div>

        <!-- stars -->
        <div style="font-size:2rem;margin-bottom:14px;letter-spacing:4px;">${starStr}</div>

        <!-- stats grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
          <div style="background:rgba(255,255,255,.05);border:1px solid ${AC}33;border-radius:10px;padding:10px 8px;">
            <div style="font-family:Orbitron,monospace;font-size:8px;color:rgba(255,255,255,.4);margin-bottom:4px;letter-spacing:.8px;">FINAL VALUE</div>
            <div style="font-family:Orbitron,monospace;font-size:13px;font-weight:700;color:${changeColor};font-variant-numeric:tabular-nums;">$${finalValue.toLocaleString()}</div>
            <div style="font-size:8px;color:${changeColor};margin-top:2px;">${portChange >= 0 ? '+' : ''}${portPct}%</div>
          </div>
          <div style="background:rgba(255,255,255,.05);border:1px solid ${AC}33;border-radius:10px;padding:10px 8px;">
            <div style="font-family:Orbitron,monospace;font-size:8px;color:rgba(255,255,255,.4);margin-bottom:4px;letter-spacing:.8px;">STABILITY</div>
            <div style="font-family:Orbitron,monospace;font-size:13px;font-weight:700;color:${AC};font-variant-numeric:tabular-nums;">${stability}</div>
            <div style="font-size:8px;color:rgba(255,255,255,.4);margin-top:2px;">points</div>
          </div>
          <div style="background:rgba(255,255,255,.05);border:1px solid ${GOLD}55;border-radius:10px;padding:10px 8px;">
            <div style="font-family:Orbitron,monospace;font-size:8px;color:rgba(255,255,255,.4);margin-bottom:4px;letter-spacing:.8px;">COINS</div>
            <div style="font-family:Orbitron,monospace;font-size:13px;font-weight:700;color:${GOLD};font-variant-numeric:tabular-nums;">+${coins}</div>
            <div style="font-size:8px;color:rgba(255,255,255,.4);margin-top:2px;">earned</div>
          </div>
        </div>

        ${stars === 3 ? `<div style="background:${AC}18;border:1px solid ${AC}55;border-radius:10px;padding:8px 12px;margin-bottom:14px;font-family:Orbitron,monospace;font-size:9px;color:${AC};letter-spacing:.8px;">🏆 RISK MASTER BADGE · DIVERSIFICATION BONUS UNLOCKED</div>` : ''}

        <!-- lesson -->
        <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:13px 14px;margin-bottom:18px;text-align:left;">
          <div style="font-family:Orbitron,monospace;font-size:8px;letter-spacing:1.2px;color:${AC};margin-bottom:6px;">💡 LESSON LEARNED</div>
          <div style="font-size:11px;color:rgba(255,255,255,.75);line-height:1.55;">
            Diversification is how investors survive market volatility. Putting everything into one asset — especially crypto — means one bad day can wipe you out. Spreading risk across multiple asset types smooths out the swings.
          </div>
        </div>

        <!-- buttons -->
        <div style="display:flex;gap:10px;">
          <button id="vvPlayAgain" class="vv-shard" style="flex:1;padding:13px;border-radius:10px;background:${AC}22;border:1.5px solid ${AC};color:${AC};font-family:Orbitron,monospace;font-size:11px;letter-spacing:1px;cursor:pointer;font-weight:700;transition:background .2s;box-shadow:0 0 20px ${AC}44;">▶ PLAY AGAIN</button>
          <button id="vvGoHub" style="flex:1;padding:13px;border-radius:10px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.25);color:#fff;font-family:Orbitron,monospace;font-size:11px;letter-spacing:1px;cursor:pointer;transition:background .2s;">← HUB</button>
        </div>
      </div>
    `;

    document.getElementById('vvPlayAgain').onclick = () => {
      overlay.style.display = 'none';
      cleanupGame();
      setTimeout(initGame, 40);
    };
    document.getElementById('vvGoHub').onclick = window.bsv_volatilityvortexExit;

    // hover effects
    ['vvPlayAgain','vvGoHub'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('mouseenter', () => btn.style.opacity = '0.85');
      btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
    });
  }

  /* ══════════════════════════════════════════════════════════
     INJECT KEYFRAME ANIMATIONS
  ══════════════════════════════════════════════════════════ */
  (function injectStyles() {
    if (document.getElementById('vvStyles')) return;
    const style = document.createElement('style');
    style.id = 'vvStyles';
    style.textContent = `
      @keyframes vvBannerIn {
        from { opacity:0; transform:translateX(-50%) translateY(-12px) scale(.95); }
        to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
      }
      @keyframes vvFlash {
        0%   { opacity:0; }
        20%  { opacity:1; }
        80%  { opacity:1; }
        100% { opacity:0; }
      }
      /* Distinct celebratory entrance for the end-of-run panel on a WIN — the
         previous behaviour was a hard display:flex swap with zero animation, which
         read as a plain text-swap rather than a moment. Loss keeps the flat swap
         (a crash shouldn't feel triumphant); win overshoots past 1x then settles. */
      @keyframes vvWinPop {
        0%   { opacity:0; transform:scale(.7) translateY(14px); }
        50%  { opacity:1; transform:scale(1.08) translateY(-3px); }
        75%  { transform:scale(.97) translateY(0); }
        100% { opacity:1; transform:scale(1) translateY(0); }
      }
      .vvWinPanel { animation:vvWinPop .5s cubic-bezier(.34,1.56,.64,1) both; }
      #vvSliders::-webkit-scrollbar { width:4px; }
      #vvSliders::-webkit-scrollbar-track { background:transparent; }
      #vvSliders::-webkit-scrollbar-thumb { background:${AC}44; border-radius:4px; }
      #vvBackBtn:hover { background:${AC}22 !important; }
      @keyframes vvConfettiFall { 0%{transform:translateY(-30px) rotate(0deg);opacity:1} 100%{transform:translateY(460px) rotate(360deg);opacity:0} }
      .vv-confetti { position:absolute;top:-24px;font-size:1.3rem;animation:vvConfettiFall 1.7s ease-in forwards;pointer-events:none;z-index:120; }
      @keyframes vvShake {10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}
      .vv-shaking { animation:vvShake .45s; }
      .vv-shard { clip-path:polygon(0 0,92% 0,100% 34%,100% 100%,8% 100%,0 66%) !important; transition:filter .15s; }
      .vv-shard:hover { filter:brightness(1.1); }
    `;
    document.head.appendChild(style);
  })();

})();
