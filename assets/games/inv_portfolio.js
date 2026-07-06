/* ════════════════════════════════════════════════════════════════
   PORTFOLIO HQ — Investopia Hub · Diversification & Allocation
   Balance a portfolio across 4–6 asset classes using tap/drag.
   Live Diversification Meter. Market events force rebalancing.
   Level 1: 4 asset classes · Level 2: 6 + live market events
   Score = time in green zone + rebalancing accuracy
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ACCENT = '#00C853';
  const ACCENT_DIM = '#00961f';
  const BG = '#03040c';

  /* ── asset class catalogue ───────────────────────────────────── */
  const ASSETS = [
    { id:'stocks',    label:'Stocks',       icon:'📈', color:'#4ade80', darkColor:'#166534', minPct:10, maxPct:60, volatility:0.8 },
    { id:'realestate',label:'Real Estate',  icon:'🏢', color:'#60a5fa', darkColor:'#1e3a5f', minPct:10, maxPct:40, volatility:0.3 },
    { id:'cash',      label:'Cash',         icon:'💵', color:'#fbbf24', darkColor:'#713f12', minPct:5,  maxPct:30, volatility:0.05 },
    { id:'gold',      label:'Gold',         icon:'🥇', color:'#f59e0b', darkColor:'#78350f', minPct:5,  maxPct:25, volatility:0.4 },
    { id:'etfs',      label:'ETFs',         icon:'📊', color:'#a78bfa', darkColor:'#4c1d95', minPct:5,  maxPct:35, volatility:0.5 },
    { id:'crypto',    label:'Crypto',       icon:'₿',  color:'#f87171', darkColor:'#7f1d1d', minPct:0,  maxPct:15, volatility:1.5 },
  ];

  /* ── market event catalogue ──────────────────────────────────── */
  const EVENTS = [
    { id:'crash',    label:'MARKET CRASH!',     icon:'📉', desc:'Stocks are tanking — reduce exposure!',    affect:{ stocks:-15, crypto:-20 }, hint:'Move weight to Gold & Cash' },
    { id:'inflation',label:'INFLATION SPIKE!',  icon:'🔥', desc:'Inflation erodes Cash value fast.',         affect:{ cash:-8,  realestate:+5 }, hint:'Shift Cash to Real Estate & Gold' },
    { id:'ratehike', label:'RATE HIKE!',         icon:'🏦', desc:'Higher rates hit stocks & real estate.',   affect:{ stocks:-10, realestate:-8 }, hint:'Rotate to Cash & Gold' },
    { id:'boom',     label:'ECONOMIC BOOM!',     icon:'🚀', desc:'Growth surge — equities and ETFs rally!',  affect:{ stocks:+12, etfs:+10 }, hint:'Increase Stocks & ETFs exposure' },
    { id:'cryptobull',label:'CRYPTO MANIA!',     icon:'🌙', desc:'Crypto is surging — but risk is extreme.', affect:{ crypto:+25 }, hint:'Trim Crypto to stay balanced' },
    { id:'recession',label:'RECESSION RISK!',    icon:'🌧️', desc:'Safe havens outperform in downturns.',      affect:{ gold:+8, cash:+5 }, hint:'Build up Gold & Cash positions' },
  ];

  /* ── healthy allocation ranges (per level) ───────────────────── */
  const HEALTHY_RANGES = {
    1: { stocks:[15,55], realestate:[10,35], cash:[5,25], gold:[5,20] },
    2: { stocks:[10,50], realestate:[8,30],  cash:[5,20], gold:[5,20], etfs:[5,30], crypto:[0,12] },
  };

  let G = null, raf = null;
  /* accumulated window-level listeners so we can remove them all on exit */
  let _winListeners = [];

  /* ── screen entry ────────────────────────────────────────────── */
  window.SCREENS.game_inv_portfolio = function () {
    G = null;
    setTimeout(initGame, 40);
    return `<div id="phqRoot" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none">

      <!-- Top bar -->
      <div style="position:absolute;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(180deg,rgba(3,4,12,.95) 60%,transparent)">
        <button id="phqBackBtn" style="padding:7px 14px;border:1px solid ${ACCENT}44;border-radius:9px;background:${ACCENT}14;color:${ACCENT};font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer;white-space:nowrap">← HUB</button>
        <div style="font-family:Orbitron,sans-serif;font-size:.7rem;letter-spacing:.18em;color:${ACCENT};flex:1;text-align:center">PORTFOLIO HQ</div>
        <div style="display:flex;gap:10px;align-items:center">
          <div style="font-family:Orbitron,sans-serif;font-size:.65rem;color:#fbbf24" id="phqScore">0 PTS</div>
          <div style="font-family:Orbitron,sans-serif;font-size:.8rem;color:#fff" id="phqTimer">60s</div>
        </div>
      </div>

      <!-- Diversification Meter bar -->
      <div style="position:absolute;top:52px;left:16px;right:16px;z-index:9">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-family:Orbitron,sans-serif;font-size:.48rem;letter-spacing:.14em;color:rgba(255,255,255,.5)">DIVERSIFICATION METER</span>
          <span id="phqDivLabel" style="font-family:Orbitron,sans-serif;font-size:.52rem;color:${ACCENT}">BALANCED</span>
        </div>
        <div style="height:10px;border-radius:6px;background:rgba(255,255,255,.08);overflow:visible;position:relative;border:1px solid ${ACCENT}33">
          <!-- green zone marker -->
          <div style="position:absolute;top:-2px;bottom:-2px;left:25%;width:50%;background:${ACCENT}18;border:1px solid ${ACCENT}55;border-radius:4px;pointer-events:none"></div>
          <div id="phqDivBar" style="height:100%;width:50%;background:linear-gradient(90deg,${ACCENT},#69f0ae);border-radius:6px;transition:width .3s,background .3s;position:relative;z-index:1"></div>
          <!-- needle marker for balance score -->
          <div id="phqDivNeedle" style="position:absolute;top:-3px;width:3px;height:16px;border-radius:2px;background:#fff;transform:translateX(-50%);transition:left .3s;left:50%;z-index:2"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:.42rem;color:rgba(255,255,255,.35);margin-top:3px;font-family:Orbitron,sans-serif;letter-spacing:.08em">
          <span>TOO RISKY</span><span>BALANCED</span><span>TOO SAFE</span>
        </div>
      </div>

      <!-- Level badge -->
      <div id="phqLevelBadge" style="position:absolute;top:112px;left:16px;z-index:9;font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.5)">LVL 1 · LEARN</div>

      <!-- Event flash banner -->
      <div id="phqEventBanner" style="position:absolute;top:112px;left:50%;transform:translateX(-50%);z-index:20;display:none;min-width:220px;max-width:90vw;text-align:center;border-radius:12px;padding:10px 16px;border:1.5px solid ${ACCENT};background:rgba(3,4,12,.92);backdrop-filter:blur(8px)">
        <div id="phqEventIcon" style="font-size:1.5rem;line-height:1.2"></div>
        <div id="phqEventTitle" style="font-family:Orbitron,sans-serif;font-size:.7rem;letter-spacing:.14em;color:#fbbf24;margin:2px 0"></div>
        <div id="phqEventDesc" style="font-size:.68rem;color:rgba(255,255,255,.8);margin:2px 0"></div>
        <div id="phqEventHint" style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.1em;color:${ACCENT};margin-top:4px"></div>
      </div>

      <!-- Portfolio sliders area -->
      <div id="phqSliders" style="position:absolute;top:134px;left:0;right:0;bottom:0;overflow-y:auto;padding:8px 16px 100px;display:flex;flex-direction:column;gap:10px"></div>

      <!-- Bottom total + health -->
      <div style="position:absolute;bottom:0;left:0;right:0;z-index:9;background:linear-gradient(0deg,rgba(3,4,12,.98) 80%,transparent);padding:10px 16px 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
          <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.12em;color:rgba(255,255,255,.5)">TOTAL ALLOCATED: <span id="phqTotal" style="color:#fff">100%</span></div>
          <div id="phqHealthChip" style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.12em;padding:5px 12px;border-radius:20px;border:1px solid ${ACCENT};background:${ACCENT}22;color:${ACCENT}">PORTFOLIO HEALTHY</div>
        </div>
        <div style="margin-top:6px;display:flex;gap:6px;justify-content:center" id="phqHintRow">
          <span style="font-size:.6rem;color:rgba(255,255,255,.4);font-family:Orbitron,sans-serif;letter-spacing:.08em">Drag sliders to allocate — keep meter in the green!</span>
        </div>
      </div>

      <!-- End overlay -->
      <div id="phqOver" style="position:absolute;inset:0;z-index:30;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.92);backdrop-filter:blur(6px)"></div>
    </div>`;
  };

  /* ── exit function ───────────────────────────────────────────── */
  window.inv_portfolioExit = function () {
    cleanupGame();
    if (window.state) state.viewingWorld = 'investor';
    goTo('hub');
  };

  /* ── cleanup ─────────────────────────────────────────────────── */
  function cleanupGame() {
    cancelAnimationFrame(raf);
    /* clear any pending event-dismiss timeout */
    if (G && G._eventDismissTimeout) clearTimeout(G._eventDismissTimeout);
    G = null;
    /* remove all window-level listeners registered during this session */
    _winListeners.forEach(({ type, fn }) => window.removeEventListener(type, fn));
    _winListeners = [];
  }

  /* ── init ────────────────────────────────────────────────────── */
  function initGame() {
    const root = document.getElementById('phqRoot');
    if (!root) return;

    /* reset listener registry for this session */
    _winListeners = [];

    /* back button */
    const backBtn = document.getElementById('phqBackBtn');
    if (backBtn) backBtn.onclick = window.inv_portfolioExit;

    /* bootstrap state */
    G = {
      level: 1,
      phase: 'play',      // 'play' | 'event' | 'over'
      score: 0,
      timeLeft: 60,
      inGreenMs: 0,
      lastTick: performance.now(),
      eventCooldown: 0,
      activeEvent: null,
      eventTimer: 0,
      rebalanceBonus: 0,

      /* current allocations — must always sum to 100 */
      allocs: { stocks:40, realestate:20, cash:15, gold:15, etfs:0, crypto:0 },
      /* which assets are active this level */
      activeAssets: ['stocks','realestate','cash','gold'],

      /* dragging state */
      dragging: null,
      dragStartX: 0,
      dragStartVal: 0,
    };

    buildSliders();
    refreshMeter();
    startLoop();
  }

  /* ── build slider cards for active assets ────────────────────── */
  function buildSliders() {
    const container = document.getElementById('phqSliders');
    if (!container || !G) return;
    container.innerHTML = '';

    G.activeAssets.forEach(id => {
      const asset = ASSETS.find(a => a.id === id);
      const pct = G.allocs[id] || 0;

      const card = document.createElement('div');
      card.id = `phq_card_${id}`;
      card.style.cssText = `background:rgba(255,255,255,.04);border:1px solid ${asset.color}33;border-radius:14px;padding:12px 14px;position:relative;overflow:hidden;transition:border-color .2s`;

      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="font-size:1.3rem;line-height:1">${asset.icon}</div>
          <div style="flex:1">
            <div style="font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.12em;color:${asset.color}">${asset.label.toUpperCase()}</div>
            <div style="font-size:.6rem;color:rgba(255,255,255,.4);margin-top:1px">Range: ${asset.minPct}–${asset.maxPct}%</div>
          </div>
          <div id="phq_pct_${id}" style="font-family:Orbitron,sans-serif;font-size:1.4rem;font-weight:700;color:${asset.color};min-width:56px;text-align:right;font-variant-numeric:tabular-nums">${pct}%</div>
        </div>
        <!-- slider track -->
        <div id="phq_track_${id}" style="position:relative;height:28px;border-radius:8px;background:rgba(255,255,255,.07);overflow:visible;cursor:grab;touch-action:none;border:1px solid ${asset.color}22">
          <!-- fill -->
          <div id="phq_fill_${id}" style="position:absolute;inset:0;border-radius:8px;background:linear-gradient(90deg,${asset.darkColor},${asset.color});width:${pct}%;transition:width .1s;pointer-events:none"></div>
          <!-- range markers -->
          <div style="position:absolute;top:0;bottom:0;left:${asset.minPct}%;width:2px;background:${asset.color}66;pointer-events:none"></div>
          <div style="position:absolute;top:0;bottom:0;left:${asset.maxPct}%;width:2px;background:${asset.color}66;pointer-events:none"></div>
          <!-- thumb -->
          <div id="phq_thumb_${id}" style="position:absolute;top:50%;width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid ${asset.color};transform:translate(-50%,-50%);left:${pct}%;pointer-events:none;box-shadow:0 0 10px ${asset.color}88;transition:left .1s"></div>
        </div>
        <!-- health indicator -->
        <div id="phq_health_${id}" style="margin-top:6px;font-size:.55rem;color:rgba(255,255,255,.4);font-family:Orbitron,sans-serif;letter-spacing:.08em"></div>
      `;

      container.appendChild(card);
      setupSliderEvents(id, card);
    });

    updateAllSliderVisuals();
  }

  /* ── slider drag logic ───────────────────────────────────────── */
  function setupSliderEvents(id, card) {
    const track = document.getElementById(`phq_track_${id}`);
    if (!track) return;

    const getValFromX = (clientX) => {
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      return Math.round(pct);
    };

    const startDrag = (clientX) => {
      if (!G || G.phase !== 'play') return;
      G.dragging = id;
      G.dragStartX = clientX;
      G.dragStartVal = G.allocs[id];
      track.style.cursor = 'grabbing';
    };

    const doDrag = (clientX) => {
      if (!G || G.dragging !== id) return;
      const newVal = getValFromX(clientX);
      applyAlloc(id, newVal);
    };

    const endDrag = () => {
      if (!G || G.dragging !== id) return;
      G.dragging = null;
      track.style.cursor = 'grab';
      checkRebalanceBonus();
    };

    track.addEventListener('mousedown', e => { startDrag(e.clientX); e.preventDefault(); });
    const _onMouseMove = e => { if (G && G.dragging === id) doDrag(e.clientX); };
    const _onMouseUp = () => { if (G && G.dragging === id) endDrag(); };
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mouseup', _onMouseUp);
    _winListeners.push({ type: 'mousemove', fn: _onMouseMove }, { type: 'mouseup', fn: _onMouseUp });

    track.addEventListener('touchstart', e => { if (e.touches[0]) startDrag(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
    track.addEventListener('touchmove', e => { if (e.touches[0] && G && G.dragging === id) { doDrag(e.touches[0].clientX); e.preventDefault(); } }, { passive: false });
    track.addEventListener('touchend', e => { if (G && G.dragging === id) { endDrag(); e.preventDefault(); } }, { passive: false });

    /* tap the card to add/subtract 5 */
    card.addEventListener('click', e => {
      if (!G || G.phase !== 'play') return;
      const rect = card.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      if (relX > rect.width * 0.6) {
        applyAlloc(id, (G.allocs[id] || 0) + 5);
      } else if (relX < rect.width * 0.4) {
        applyAlloc(id, (G.allocs[id] || 0) - 5);
      }
      checkRebalanceBonus();
    });
  }

  /* ── allocate value to one asset, redistribute remainder ─────── */
  function applyAlloc(id, newVal) {
    if (!G) return;
    const asset = ASSETS.find(a => a.id === id);
    const clamped = Math.max(0, Math.min(100, Math.round(newVal)));

    const others = G.activeAssets.filter(a => a !== id);
    const oldVal = G.allocs[id] || 0;
    const diff = clamped - oldVal;

    /* subtract diff from other assets proportionally */
    let totalOthers = others.reduce((s, a) => s + (G.allocs[a] || 0), 0);
    if (totalOthers <= 0 && diff > 0) return; // can't add more, no room

    const newAllocs = { ...G.allocs };
    newAllocs[id] = clamped;

    /* redistribute */
    let remaining = 100 - clamped;
    let usedOthers = 0;
    others.forEach((a, i) => {
      if (i === others.length - 1) {
        newAllocs[a] = Math.max(0, remaining - usedOthers);
      } else {
        const share = totalOthers > 0 ? Math.round(((G.allocs[a] || 0) / totalOthers) * remaining) : Math.floor(remaining / others.length);
        newAllocs[a] = Math.max(0, share);
        usedOthers += newAllocs[a];
      }
    });

    /* verify sum = 100 */
    const total = G.activeAssets.reduce((s, a) => s + (newAllocs[a] || 0), 0);
    const drift = 100 - total;
    if (drift !== 0) {
      /* fix on the last other asset */
      const last = others[others.length - 1];
      newAllocs[last] = Math.max(0, (newAllocs[last] || 0) + drift);
    }

    G.allocs = newAllocs;
    updateAllSliderVisuals();
    refreshMeter();
  }

  /* ── update all slider DOM elements ─────────────────────────── */
  function updateAllSliderVisuals() {
    if (!G) return;
    let total = 0;
    G.activeAssets.forEach(id => {
      const pct = G.allocs[id] || 0;
      total += pct;
      const fillEl = document.getElementById(`phq_fill_${id}`);
      const thumbEl = document.getElementById(`phq_thumb_${id}`);
      const pctEl = document.getElementById(`phq_pct_${id}`);
      const healthEl = document.getElementById(`phq_health_${id}`);
      const cardEl = document.getElementById(`phq_card_${id}`);
      const asset = ASSETS.find(a => a.id === id);

      if (fillEl) fillEl.style.width = pct + '%';
      if (thumbEl) thumbEl.style.left = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';

      /* health annotation */
      const range = HEALTHY_RANGES[G.level][id];
      if (healthEl && range && asset) {
        if (pct < range[0]) {
          healthEl.textContent = `⚠ Too low (min ${range[0]}%)`;
          healthEl.style.color = '#f87171';
          if (cardEl) cardEl.style.borderColor = '#f8717166';
        } else if (pct > range[1]) {
          healthEl.textContent = `⚠ Too concentrated (max ${range[1]}%)`;
          healthEl.style.color = '#fbbf24';
          if (cardEl) cardEl.style.borderColor = '#fbbf2466';
        } else {
          healthEl.textContent = `✓ In healthy range`;
          healthEl.style.color = ACCENT;
          if (cardEl) cardEl.style.borderColor = asset.color + '55';
        }
      }
    });

    const totalEl = document.getElementById('phqTotal');
    if (totalEl) totalEl.textContent = total + '%';
  }

  /* ── diversification meter ───────────────────────────────────── */
  function getDivScore() {
    if (!G) return 0;
    const ranges = HEALTHY_RANGES[G.level];
    let inRangeCount = 0;
    let totalDeviation = 0;

    G.activeAssets.forEach(id => {
      const pct = G.allocs[id] || 0;
      const range = ranges[id];
      if (!range) return;
      if (pct >= range[0] && pct <= range[1]) {
        inRangeCount++;
      }
      const mid = (range[0] + range[1]) / 2;
      const halfSpan = (range[1] - range[0]) / 2 + 1;
      totalDeviation += Math.max(0, Math.abs(pct - mid) - halfSpan) / halfSpan;
    });

    const n = G.activeAssets.length;
    const inRangeFrac = inRangeCount / n;
    const devPenalty = Math.min(1, totalDeviation / n);

    /* 0 = terrible, 1 = perfect */
    return Math.max(0, inRangeFrac - devPenalty * 0.5);
  }

  function isInGreenZone() {
    return getDivScore() >= 0.65;
  }

  function refreshMeter() {
    if (!G) return;
    const score = getDivScore();
    const barEl = document.getElementById('phqDivBar');
    const needleEl = document.getElementById('phqDivNeedle');
    const labelEl = document.getElementById('phqDivLabel');
    const healthChip = document.getElementById('phqHealthChip');

    const pct = Math.round(score * 100);
    if (barEl) {
      barEl.style.width = pct + '%';
      if (score >= 0.65) {
        barEl.style.background = `linear-gradient(90deg,${ACCENT},#69f0ae)`;
      } else if (score >= 0.35) {
        barEl.style.background = 'linear-gradient(90deg,#f59e0b,#fbbf24)';
      } else {
        barEl.style.background = 'linear-gradient(90deg,#ef4444,#f87171)';
      }
    }
    if (needleEl) needleEl.style.left = pct + '%';

    if (labelEl) {
      if (score >= 0.8) { labelEl.textContent = 'PERFECT BALANCE'; labelEl.style.color = ACCENT; }
      else if (score >= 0.65) { labelEl.textContent = 'BALANCED'; labelEl.style.color = ACCENT; }
      else if (score >= 0.4) { labelEl.textContent = 'MODERATE RISK'; labelEl.style.color = '#fbbf24'; }
      else { labelEl.textContent = 'DANGER ZONE'; labelEl.style.color = '#f87171'; }
    }

    if (healthChip) {
      if (isInGreenZone()) {
        healthChip.textContent = 'PORTFOLIO HEALTHY ✓';
        healthChip.style.color = ACCENT;
        healthChip.style.borderColor = ACCENT;
        healthChip.style.background = ACCENT + '22';
      } else {
        healthChip.textContent = 'REBALANCE NEEDED ⚠';
        healthChip.style.color = '#f87171';
        healthChip.style.borderColor = '#f87171';
        healthChip.style.background = '#f8717122';
      }
    }
  }

  /* ── check rebalance bonus (did player fix something?) ────────── */
  function checkRebalanceBonus() {
    if (!G) return;
    if (G.activeEvent && isInGreenZone()) {
      G.rebalanceBonus += 25;
      G.score += 25;
      updateScoreDisplay();
      flashBonus('+25 REBALANCE!');
      dismissEvent();
    }
  }

  function flashBonus(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:50;font-family:Orbitron,sans-serif;font-size:1rem;letter-spacing:.15em;color:${ACCENT};background:rgba(3,4,12,.9);padding:10px 22px;border-radius:10px;border:1.5px solid ${ACCENT};pointer-events:none;animation:phqPop .8s ease forwards`;
    if (!document.getElementById('phqPopStyle')) {
      const s = document.createElement('style');
      s.id = 'phqPopStyle';
      s.textContent = `@keyframes phqPop{0%{opacity:0;transform:translate(-50%,-60%)}20%{opacity:1;transform:translate(-50%,-50%)}70%{opacity:1}100%{opacity:0;transform:translate(-50%,-40%)}}`;
      document.head.appendChild(s);
    }
    const root = document.getElementById('phqRoot');
    if (root) { root.appendChild(el); setTimeout(() => el.remove(), 900); }
  }

  /* ── market event system ─────────────────────────────────────── */
  function fireEvent() {
    if (!G || G.level < 2) return;
    const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    G.activeEvent = evt;
    G.eventTimer = 12; /* seconds to respond */

    const banner = document.getElementById('phqEventBanner');
    const iconEl = document.getElementById('phqEventIcon');
    const titleEl = document.getElementById('phqEventTitle');
    const descEl = document.getElementById('phqEventDesc');
    const hintEl = document.getElementById('phqEventHint');

    if (banner) {
      if (iconEl) iconEl.textContent = evt.icon;
      if (titleEl) titleEl.textContent = evt.label;
      if (descEl) descEl.textContent = evt.desc;
      if (hintEl) hintEl.textContent = '→ ' + evt.hint;
      banner.style.display = 'block';
      /* auto-dismiss after eventTimer */
      G._eventDismissTimeout = setTimeout(() => dismissEvent(), G.eventTimer * 1000);
    }

    /* market impact: apply the event's affect deltas to holdings */
    applyEventAffect(evt);
  }

  /* ── apply an event's affect deltas to allocations ───────────── */
  function applyEventAffect(evt) {
    if (!G || !evt || !evt.affect) return;

    /* shift affected holdings by their delta (percentage points) */
    Object.keys(evt.affect).forEach(id => {
      if (G.activeAssets.indexOf(id) < 0) return;
      G.allocs[id] = Math.max(0, Math.round((G.allocs[id] || 0) + evt.affect[id]));
    });

    /* renormalize so allocations still sum to 100 */
    const total = G.activeAssets.reduce((s, a) => s + (G.allocs[a] || 0), 0);
    if (total > 0 && total !== 100) {
      let running = 0;
      G.activeAssets.forEach((a, i) => {
        if (i === G.activeAssets.length - 1) {
          G.allocs[a] = Math.max(0, 100 - running);
        } else {
          G.allocs[a] = Math.max(0, Math.round(((G.allocs[a] || 0) / total) * 100));
          running += G.allocs[a];
        }
      });
    }

    updateAllSliderVisuals();
    refreshMeter();
  }

  function dismissEvent() {
    if (!G) return;
    G.activeEvent = null;
    clearTimeout(G._eventDismissTimeout);
    const banner = document.getElementById('phqEventBanner');
    if (banner) banner.style.display = 'none';
  }

  /* ── main game loop ──────────────────────────────────────────── */
  function startLoop() {
    cancelAnimationFrame(raf);
    G.lastTick = performance.now();
    G.eventCooldown = G.level === 1 ? 9999 : 18; /* first event at 18s in L2 */

    raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!G || G.phase !== 'play') return;

    const dt = (now - G.lastTick) / 1000;
    G.lastTick = now;

    G.timeLeft -= dt;
    if (G.timeLeft <= 0) {
      G.timeLeft = 0;
      endGame();
      return;
    }

    /* score: +1pt/sec while in green zone, +3pt/sec for perfect */
    const divScore = getDivScore();
    if (divScore >= 0.8) {
      G.score += dt * 3;
    } else if (divScore >= 0.65) {
      G.score += dt * 1;
    }
    /* penalty for being out of green */
    if (divScore < 0.35) {
      G.score = Math.max(0, G.score - dt * 2);
    }

    /* event cooldown */
    if (G.level >= 2) {
      G.eventCooldown -= dt;
      if (G.eventCooldown <= 0 && !G.activeEvent) {
        fireEvent();
        G.eventCooldown = 14 + Math.random() * 8;
      }
    }

    /* level up: after 60s on L1, go to L2 */
    if (G.level === 1 && G.timeLeft < 1 && G.phase === 'play') {
      // handled by endGame
    }

    updateScoreDisplay();
    updateTimerDisplay();
    refreshMeter();

    raf = requestAnimationFrame(tick);
  }

  function updateScoreDisplay() {
    const el = document.getElementById('phqScore');
    if (el && G) el.textContent = Math.floor(G.score) + ' PTS';
  }

  function updateTimerDisplay() {
    const el = document.getElementById('phqTimer');
    if (el && G) {
      const s = Math.ceil(G.timeLeft);
      el.textContent = s + 's';
      el.style.color = s <= 10 ? '#f87171' : '#fff';
    }
  }

  /* ── advance to level 2 ──────────────────────────────────────── */
  function advanceToLevel2() {
    if (!G) return;
    G.level = 2;
    G.timeLeft = 90;
    G.eventCooldown = 12;
    G.activeAssets = ['stocks', 'realestate', 'cash', 'gold', 'etfs', 'crypto'];
    /* redistribute existing to include new assets */
    G.allocs.etfs = 10;
    G.allocs.crypto = 5;
    /* rescale others down */
    const factor = 85 / (G.allocs.stocks + G.allocs.realestate + G.allocs.cash + G.allocs.gold);
    ['stocks', 'realestate', 'cash', 'gold'].forEach(id => {
      G.allocs[id] = Math.round(G.allocs[id] * factor);
    });
    /* fix rounding */
    const total = Object.values(G.allocs).reduce((s, v) => s + v, 0);
    G.allocs.stocks += (100 - total);

    const badge = document.getElementById('phqLevelBadge');
    if (badge) badge.textContent = 'LVL 2 · MASTER';
    badge && (badge.style.color = ACCENT);

    buildSliders();
    refreshMeter();
    dismissEvent();
    flashBonus('LEVEL 2 — MASTER!');
  }

  /* ── end game ────────────────────────────────────────────────── */
  function endGame() {
    if (!G) return;

    /* if we finished level 1 without losing, advance */
    if (G.level === 1 && G.score > 0) {
      advanceToLevel2();
      G.phase = 'play';
      G.lastTick = performance.now();
      raf = requestAnimationFrame(tick);
      return;
    }

    G.phase = 'over';
    cancelAnimationFrame(raf);
    dismissEvent();

    const finalScore = Math.floor(G.score);
    const stars = finalScore >= 300 ? 3 : finalScore >= 150 ? 2 : 1;
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_inv_portfolio', { level: G.level, stars, badge: 'Diversification Master', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('inv_wealth', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    const starsHTML = '⭐'.repeat(stars) + '<span style="opacity:.25">' + '⭐'.repeat(3 - stars) + '</span>';
    const divScore = getDivScore();
    const perfBonus = divScore >= 0.8 ? '<div style="margin-top:6px;font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.12em;color:#fbbf24">🏆 PERFECT BALANCE BONUS!</div>' : '';

    const overEl = document.getElementById('phqOver');
    if (!overEl) return;
    overEl.style.display = 'flex';
    overEl.innerHTML = `
      <div style="max-width:340px;width:90%;text-align:center;padding:28px 22px;border:1.5px solid ${ACCENT};border-radius:20px;background:rgba(3,4,12,.97)">
        <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.2em;color:${ACCENT};margin-bottom:8px">PORTFOLIO HQ · RESULT</div>
        <div style="font-size:2rem;margin:10px 0">${starsHTML}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:2rem;color:${ACCENT};font-weight:700">${finalScore}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.14em;color:rgba(255,255,255,.5);margin-bottom:8px">SCORE</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.9rem;color:#fbbf24;margin:8px 0">+${coins} 🪙 COINS</div>
        ${perfBonus}
        <div style="margin:16px 0;padding:14px 12px;background:${ACCENT}12;border-radius:12px;border:1px solid ${ACCENT}33;text-align:left">
          <div style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.14em;color:${ACCENT};margin-bottom:6px">LESSON LEARNED</div>
          <div style="font-size:.72rem;line-height:1.6;color:rgba(255,255,255,.85)">A diversified portfolio spreads risk across many asset classes — no single crash can wipe you out when you own Stocks, Real Estate, Gold, and more.</div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button onclick="phqPlayAgain()" style="flex:1;padding:12px;border:1.5px solid ${ACCENT};border-radius:10px;background:${ACCENT}22;color:${ACCENT};font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">PLAY AGAIN</button>
          <button onclick="inv_portfolioExit()" style="flex:1;padding:12px;border:1.5px solid rgba(255,255,255,.25);border-radius:10px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.8);font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← HUB</button>
        </div>
      </div>`;
  }

  window.phqPlayAgain = function () {
    const overEl = document.getElementById('phqOver');
    if (overEl) overEl.style.display = 'none';
    /* clear any pending event-dismiss timeout from previous run before overwriting G */
    if (G && G._eventDismissTimeout) clearTimeout(G._eventDismissTimeout);
    dismissEvent();
    /* remove window listeners from the previous slider session, they will be re-registered by buildSliders */
    _winListeners.forEach(({ type, fn }) => window.removeEventListener(type, fn));
    _winListeners = [];
    cancelAnimationFrame(raf);
    G = {
      level: 1,
      phase: 'play',
      score: 0,
      timeLeft: 60,
      inGreenMs: 0,
      lastTick: performance.now(),
      eventCooldown: 9999,
      activeEvent: null,
      eventTimer: 0,
      rebalanceBonus: 0,
      allocs: { stocks: 40, realestate: 20, cash: 15, gold: 15, etfs: 0, crypto: 0 },
      activeAssets: ['stocks', 'realestate', 'cash', 'gold'],
      dragging: null,
      dragStartX: 0,
      dragStartVal: 0,
    };
    const badge = document.getElementById('phqLevelBadge');
    if (badge) { badge.textContent = 'LVL 1 · LEARN'; badge.style.color = 'rgba(255,255,255,.5)'; }
    buildSliders();
    refreshMeter();
    startLoop();
  };

})();
