/* ════════════════════════════════════════════════════════════════
   INTEREST IMPACT LAB · Debt Detox District — Rebuilder Hub
   Compound interest debt mechanic: allocate monthly payments
   across loans to keep total debt below the target cap.
   Level 1 (Learn): One loan, slow-motion compounding demo.
   Level 2 (Master): Multiple loans, randomised emergency expenses.
   Screen ID : game_ddt_lab
   Hub       : rebuilder (#4B2D8F)
   Exit fn   : window.ddt_labExit
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── palette ──────────────────────────────────────────────── */
  const BG      = '#03040c';
  const ACCENT  = '#4B2D8F';
  const ACCENT2 = '#7C3AED';
  const GLOW    = '#9B5DFF';
  const CYAN    = '#00e5ff';
  const GREEN   = '#22d3a5';
  const RED     = '#ef4444';
  const ORANGE  = '#f97316';
  const GOLD    = '#f5c842';
  const DARK    = '#0a0618';

  /* ── level configs ────────────────────────────────────────── */
  const LEVELS = [
    {
      name: 'LEARN: Single Loan',
      desc: 'Watch compound interest grow on one loan. Keep debt below the cap for 6 months.',
      months: 6,
      budget: 300,         // available dollars per month
      capPct: 1.15,        // danger: debt grows beyond 115% of start
      loans: [
        { id: 'credit', label: 'Credit Card', balance: 1200, apr: 0.24, min: 35, color: '#ef4444' },
      ],
      emergencies: [],
      emergencyChance: 0,
    },
    {
      name: 'MASTER: Multi-Loan Juggle',
      desc: 'Three loans, surprise expenses, tight budget. Prioritise wisely.',
      months: 8,
      budget: 420,
      capPct: 1.12,
      loans: [
        { id: 'credit',  label: 'Credit Card', balance: 1400, apr: 0.26, min: 40, color: '#ef4444' },
        { id: 'medical', label: 'Medical Bill', balance: 800,  apr: 0.18, min: 25, color: '#f97316' },
        { id: 'personal',label: 'Personal Loan', balance: 500, apr: 0.14, min: 20, color: '#f5c842' },
      ],
      emergencies: [
        { label: '🚗 Car Repair',    cost: 120, msg: 'Surprise car repair!',   color: '#ef4444' },
        { label: '🏥 Medical Co-Pay',cost: 90,  msg: 'Unexpected medical bill!',color: '#f97316' },
        { label: '🔧 Home Fix',      cost: 80,  msg: 'Emergency home repair!',  color: '#f97316' },
        { label: '📱 Phone Broken',  cost: 60,  msg: 'Phone screen shattered!', color: '#f5c842' },
        { label: '🐾 Vet Visit',     cost: 110, msg: 'Pet emergency!',          color: '#ef4444' },
      ],
      emergencyChance: 0.45,  // 45% chance of an emergency each month
    },
  ];

  /* ── payment options ─────────────────────────────────────── */
  // returned per-loan each month; amount is computed dynamically
  const OPT_MIN  = 'min';   // pay minimum
  const OPT_SKIP = 'skip';  // skip (miss payment – penalty)
  const OPT_XTRA = 'extra'; // extra payment (+50% over minimum)

  /* ── state ────────────────────────────────────────────────── */
  let G = null;

  /* ── screen entry ─────────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_ddt_lab = function () {
    G = null;
    setTimeout(initGame, 40);
    return `<div id="ddt_root" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:'Inter',sans-serif;color:#fff;display:flex;flex-direction:column"></div>`;
  };

  /* ── exit ─────────────────────────────────────────────────── */
  window.ddt_labExit = function () {
    if (G && G.animHandle) { cancelAnimationFrame(G.animHandle); G.animHandle = null; }
    G = null;
    if (window.state) state.viewingWorld = 'rebuilder';
    goTo('hub');
  };

  /* ═══════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════ */
  function initGame() {
    const root = document.getElementById('ddt_root');
    if (!root) return;

    /* start at level selection */
    renderLevelSelect(root);
  }

  /* ── level select ─────────────────────────────────────────── */
  function renderLevelSelect(root) {
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:24px;padding:24px;box-sizing:border-box">
        <button onclick="window.ddt_labExit()" style="position:absolute;top:14px;left:14px;background:none;border:1px solid ${ACCENT2};border-radius:8px;color:#fff;padding:6px 14px;cursor:pointer;font-size:13px">← HUB</button>
        <div style="font-family:'Orbitron',monospace;font-size:clamp(16px,3vw,24px);color:${GLOW};letter-spacing:2px;text-align:center;text-shadow:0 0 20px ${GLOW}">⚗️ INTEREST IMPACT LAB</div>
        <div style="color:rgba(255,255,255,0.6);font-size:13px;text-align:center;max-width:340px">Master compound interest — fight back before debt takes over</div>
        <div style="display:flex;flex-direction:column;gap:16px;width:100%;max-width:380px">
          ${LEVELS.map((lv, i) => `
            <button onclick="window._ddtStartLevel(${i})" style="background:linear-gradient(135deg,${DARK} 0%,#120830 100%);border:1px solid ${ACCENT};border-radius:14px;padding:20px;cursor:pointer;text-align:left;transition:border-color 0.2s;width:100%"
              onmouseover="this.style.borderColor='${GLOW}'" onmouseout="this.style.borderColor='${ACCENT}'">
              <div style="font-family:'Orbitron',monospace;font-size:13px;color:${GLOW};margin-bottom:6px">${i === 0 ? '⬛ LEVEL 1' : '⬛ LEVEL 2'}</div>
              <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:4px">${lv.name}</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.55);line-height:1.5">${lv.desc}</div>
              <div style="display:flex;gap:12px;margin-top:10px;font-size:11px;color:${GLOW}">
                <span>📅 ${lv.months} months</span>
                <span>💰 $${lv.budget}/mo budget</span>
                <span>🏦 ${lv.loans.length} loan${lv.loans.length > 1 ? 's' : ''}</span>
              </div>
            </button>
          `).join('')}
        </div>
      </div>`;

    window._ddtStartLevel = function (idx) { startLevel(root, idx); };
  }

  /* ═══════════════════════════════════════════════════════════
     START LEVEL
  ═══════════════════════════════════════════════════════════ */
  function startLevel(root, lvIdx) {
    const cfg = LEVELS[lvIdx];

    /* deep-clone loans so we never mutate the config */
    const loans = cfg.loans.map(l => ({
      ...l,
      balance: l.balance,
      startBalance: l.balance,
    }));

    G = {
      lvIdx,
      cfg,
      loans,
      month: 1,
      score: 0,
      coins: 0,
      budget: cfg.budget,
      budgetLeft: cfg.budget,
      totalDebt: () => G.loans.reduce((s, l) => s + l.balance, 0),
      startDebt: loans.reduce((s, l) => s + l.balance, 0),
      capDebt: 0,        // set below
      dangerDebt: 0,     // set below
      choices: {},       // loanId → OPT_MIN | OPT_SKIP | OPT_XTRA
      phase: 'choose',   // 'choose' | 'result'
      emergency: null,   // {label, cost, msg, color} or null
      emergencyCost: 0,
      moleculeAnim: [],  // for canvas molecules
      alarmActive: false,
      animHandle: null,
      canvas: null,
      ctx: null,
    };
    G.capDebt    = G.startDebt * cfg.capPct;
    G.dangerDebt = G.capDebt * 1.08;

    renderGame(root);
    scheduleEmergency();
  }

  /* ════════════════════════════════════════════════════════════
     RENDER GAME UI
  ════════════════════════════════════════════════════════════ */
  function renderGame(root) {
    if (!G) return;
    const cfg = G.cfg;

    root.innerHTML = `
      <!-- TOP BAR -->
      <div id="ddt_topbar" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:${DARK};border-bottom:1px solid ${ACCENT};flex-shrink:0;z-index:10">
        <button onclick="window.ddt_labExit()" style="background:none;border:1px solid ${ACCENT2};border-radius:8px;color:#fff;padding:5px 11px;cursor:pointer;font-size:12px;flex-shrink:0">← HUB</button>
        <div style="font-family:'Orbitron',monospace;font-size:clamp(10px,2.5vw,14px);color:${GLOW};flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">⚗️ ${cfg.name}</div>
        <div style="display:flex;gap:10px;align-items:center;flex-shrink:0">
          <div style="font-family:'Orbitron',monospace;font-size:12px;color:${GOLD}">💰 <span id="ddt_score">0</span></div>
          <div style="font-family:'Orbitron',monospace;font-size:12px;color:${CYAN}">📅 <span id="ddt_month">1</span>/<span id="ddt_total">${cfg.months}</span></div>
        </div>
      </div>

      <!-- MAIN AREA -->
      <div style="display:flex;flex-direction:column;flex:1;overflow-y:auto;overflow-x:hidden;padding:12px;gap:12px;box-sizing:border-box">

        <!-- HUD STRIP -->
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <!-- Debt Meter -->
          <div style="flex:2;min-width:180px;background:${DARK};border:1px solid ${ACCENT};border-radius:12px;padding:12px">
            <div style="font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:1px;margin-bottom:6px">TOTAL DEBT</div>
            <div style="font-family:'Orbitron',monospace;font-size:clamp(18px,4vw,28px);color:${RED};font-weight:700" id="ddt_debtval">$${fmt(G.totalDebt())}</div>
            <!-- bar -->
            <div style="margin-top:8px;background:rgba(255,255,255,0.08);border-radius:4px;height:8px;position:relative;overflow:hidden">
              <div id="ddt_debtbar" style="height:100%;border-radius:4px;transition:width 0.5s;background:linear-gradient(90deg,${GREEN},${ORANGE},${RED})"></div>
              <!-- danger line -->
              <div id="ddt_capline" style="position:absolute;top:0;bottom:0;width:2px;background:${GOLD};border-radius:2px"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:10px;color:rgba(255,255,255,0.4)">
              <span>$0</span>
              <span id="ddt_caplabel" style="color:${GOLD}">Cap $${fmt(G.capDebt)}</span>
            </div>
          </div>
          <!-- Budget -->
          <div style="flex:1;min-width:130px;background:${DARK};border:1px solid ${ACCENT};border-radius:12px;padding:12px">
            <div style="font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:1px;margin-bottom:6px">BUDGET LEFT</div>
            <div style="font-family:'Orbitron',monospace;font-size:clamp(16px,3.5vw,22px);color:${CYAN};font-weight:700" id="ddt_budgetval">$${G.budgetLeft}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:4px">of $${G.budget}/month</div>
          </div>
        </div>

        <!-- MOLECULE CANVAS -->
        <div style="position:relative;border:1px solid ${ACCENT};border-radius:14px;overflow:hidden;background:${DARK}">
          <canvas id="ddt_canvas" style="width:100%;display:block;image-rendering:pixelated"></canvas>
          <div id="ddt_alarm" style="display:none;position:absolute;inset:0;border:3px solid ${RED};border-radius:14px;pointer-events:none;box-shadow:inset 0 0 30px rgba(239,68,68,0.3)"></div>
        </div>

        <!-- EMERGENCY BANNER -->
        <div id="ddt_emergency" style="display:none;border-radius:12px;padding:12px 16px;font-size:13px;font-weight:700;text-align:center"></div>

        <!-- LOAN PANELS -->
        <div id="ddt_loans" style="display:flex;flex-direction:column;gap:10px"></div>

        <!-- ACTION ROW -->
        <div id="ddt_actionrow" style="padding:4px 0 8px"></div>

      </div>
    `;

    /* set up canvas */
    const canvas = document.getElementById('ddt_canvas');
    const parent = canvas.parentElement;
    canvas.width  = parent.clientWidth || 340;
    canvas.height = Math.min(Math.round(canvas.width * 0.35), 130);
    canvas.style.height = canvas.height + 'px';
    G.canvas = canvas;
    G.ctx    = canvas.getContext('2d');

    initMolecules();
    renderLoans();
    renderActionRow();
    updateHUD();
    startMoleculeLoop();
  }

  /* ════════════════════════════════════════════════════════════
     MOLECULE CANVAS
  ════════════════════════════════════════════════════════════ */
  function initMolecules() {
    if (!G) return;
    G.moleculeAnim = [];
    const count = Math.min(G.loans.length * 6, 24);
    for (let i = 0; i < count; i++) {
      const lIdx = i % G.loans.length;
      addMolecule(lIdx);
    }
  }

  function addMolecule(lIdx) {
    if (!G || !G.canvas) return;
    const W = G.canvas.width, H = G.canvas.height;
    const loan = G.loans[lIdx];
    const ratio = loan.balance / loan.startBalance;
    G.moleculeAnim.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 4 + ratio * 10,
      baseR: 4 + ratio * 10,
      lIdx,
      phase: Math.random() * Math.PI * 2,
      speed: 0.015 + Math.random() * 0.02,
      color: loan.color,
      pulse: 0,
    });
  }

  function startMoleculeLoop() {
    if (G && G.animHandle) cancelAnimationFrame(G.animHandle);
    function loop() {
      if (!G) return;
      drawMolecules();
      G.animHandle = requestAnimationFrame(loop);
    }
    loop();
  }

  function drawMolecules() {
    if (!G || !G.ctx) return;
    const ctx = G.ctx;
    const W = G.canvas.width, H = G.canvas.height;
    ctx.clearRect(0, 0, W, H);

    /* background grid */
    ctx.strokeStyle = 'rgba(75,45,143,0.15)';
    ctx.lineWidth = 1;
    const gs = 28;
    for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const t = performance.now() / 1000;

    /* update & draw molecules */
    for (const m of G.moleculeAnim) {
      const loan = G.loans[m.lIdx];
      /* scale radius to current balance vs start */
      const ratio = Math.max(0.2, loan.balance / loan.startBalance);
      m.r = m.baseR * Math.min(ratio, 2.5);
      m.phase += m.speed;

      m.x += m.vx;
      m.y += m.vy;
      if (m.x < m.r)  { m.x = m.r;  m.vx *= -1; }
      if (m.x > W - m.r) { m.x = W - m.r; m.vx *= -1; }
      if (m.y < m.r)  { m.y = m.r;  m.vy *= -1; }
      if (m.y > H - m.r) { m.y = H - m.r; m.vy *= -1; }

      /* pulse ring */
      const pulseR = m.r + 4 + Math.sin(m.phase) * 3;

      /* glow */
      const grd = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      grd.addColorStop(0, m.color + 'ff');
      grd.addColorStop(1, m.color + '00');
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      /* ring */
      ctx.beginPath();
      ctx.arc(m.x, m.y, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = m.color + '40';
      ctx.lineWidth = 1;
      ctx.stroke();

      /* bonds to nearby molecules */
      for (const m2 of G.moleculeAnim) {
        if (m2 === m || m2.lIdx !== m.lIdx) continue;
        const dx = m2.x - m.x, dy = m2.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 60) {
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m2.x, m2.y);
          ctx.strokeStyle = m.color + Math.floor((1 - dist / 60) * 80).toString(16).padStart(2, '0');
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    /* loan balance labels on canvas */
    G.loans.forEach((loan, i) => {
      const x = (W / G.loans.length) * (i + 0.5);
      ctx.fillStyle = loan.color;
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`$${fmt(loan.balance)}`, x, H - 6);
    });

    /* alarm flash */
    if (G.alarmActive) {
      const alpha = 0.12 + Math.sin(t * 6) * 0.08;
      ctx.fillStyle = `rgba(239,68,68,${alpha})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ════════════════════════════════════════════════════════════
     LOAN PANELS
  ════════════════════════════════════════════════════════════ */
  function renderLoans() {
    if (!G) return;
    const container = document.getElementById('ddt_loans');
    if (!container) return;

    container.innerHTML = G.loans.map((loan, idx) => {
      const monthlyRate = loan.apr / 12;
      const interest    = loan.balance * monthlyRate;
      const minPay      = Math.max(loan.min, Math.round(interest + 1));
      const xtraPay     = Math.round(minPay * 1.5);

      return `
        <div id="ddt_loanpanel_${loan.id}" style="background:${DARK};border:1px solid ${loan.color}44;border-radius:12px;padding:12px;transition:border-color 0.3s">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div>
              <div style="font-weight:700;font-size:14px;color:${loan.color}">${loan.label}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.45)">APR ${(loan.apr * 100).toFixed(0)}% · Interest this month: <span style="color:${RED}">+$${fmt(interest)}</span></div>
            </div>
            <div style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:#fff" id="ddt_bal_${loan.id}">$${fmt(loan.balance)}</div>
          </div>
          <!-- payment option buttons -->
          <div style="display:flex;gap:7px;flex-wrap:wrap" id="ddt_opts_${loan.id}">
            <button data-loan="${loan.id}" data-opt="${OPT_SKIP}" onclick="window._ddtChoose('${loan.id}','${OPT_SKIP}')"
              style="${optBtnStyle(loan.id, OPT_SKIP, RED)}">
              ⏭ Skip (${fmtSign(0)})<br><span style="font-size:9px;opacity:0.7">Debt balloons!</span>
            </button>
            <button data-loan="${loan.id}" data-opt="${OPT_MIN}" onclick="window._ddtChoose('${loan.id}','${OPT_MIN}')"
              style="${optBtnStyle(loan.id, OPT_MIN, ORANGE)}">
              💳 Minimum ($${minPay})<br><span style="font-size:9px;opacity:0.7">Interest snowballs</span>
            </button>
            <button data-loan="${loan.id}" data-opt="${OPT_XTRA}" onclick="window._ddtChoose('${loan.id}','${OPT_XTRA}')"
              style="${optBtnStyle(loan.id, OPT_XTRA, GREEN)}">
              🚀 Extra ($${xtraPay})<br><span style="font-size:9px;opacity:0.7">Shrinks fast!</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function optBtnStyle(loanId, opt, col) {
    const chosen = G.choices[loanId] === opt;
    return `
      flex:1;min-width:80px;background:${chosen ? col + '33' : 'rgba(255,255,255,0.04)'};
      border:${chosen ? `2px solid ${col}` : '1px solid rgba(255,255,255,0.12)'};
      border-radius:9px;color:#fff;padding:8px 6px;cursor:pointer;font-size:12px;
      font-weight:${chosen ? '700' : '400'};line-height:1.4;
      transition:all 0.18s;text-align:center;
      box-shadow:${chosen ? `0 0 10px ${col}55` : 'none'}
    `;
  }

  window._ddtChoose = function (loanId, opt) {
    if (!G || G.phase !== 'choose') return;
    const loan     = G.loans.find(l => l.id === loanId);
    if (!loan) return;

    /* compute cost */
    const monthlyRate = loan.apr / 12;
    const interest    = loan.balance * monthlyRate;
    const minPay      = Math.max(loan.min, Math.round(interest + 1));
    const xtraPay     = Math.round(minPay * 1.5);
    const cost        = opt === OPT_SKIP ? 0 : opt === OPT_MIN ? minPay : xtraPay;

    /* rollback previous choice budget */
    const prev = G.choices[loanId];
    if (prev) {
      const prevCost = prevPayCost(loan, prev);
      G.budgetLeft += prevCost;
    }

    /* check budget */
    if (G.budgetLeft < cost) {
      flashMsg('Not enough budget! Choose a cheaper option.', RED);
      return;
    }

    G.choices[loanId] = opt;
    G.budgetLeft -= cost;

    /* re-render loan panels & budget */
    renderLoans();
    const budEl = document.getElementById('ddt_budgetval');
    if (budEl) { budEl.textContent = '$' + G.budgetLeft; budEl.style.color = G.budgetLeft < 50 ? RED : CYAN; }
    renderActionRow();
  };

  function prevPayCost(loan, opt) {
    const rate     = loan.apr / 12;
    const interest = loan.balance * rate;
    const minPay   = Math.max(loan.min, Math.round(interest + 1));
    const xtraPay  = Math.round(minPay * 1.5);
    return opt === OPT_SKIP ? 0 : opt === OPT_MIN ? minPay : xtraPay;
  }

  /* ════════════════════════════════════════════════════════════
     ACTION ROW
  ════════════════════════════════════════════════════════════ */
  function renderActionRow() {
    if (!G) return;
    const row = document.getElementById('ddt_actionrow');
    if (!row) return;
    const allChosen = G.loans.every(l => G.choices[l.id]);

    if (G.phase === 'choose') {
      row.innerHTML = `
        <div style="text-align:center">
          <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:8px">
            ${allChosen ? 'All loans assigned — ready to apply!' : `Choose a payment for each loan (${Object.keys(G.choices).length}/${G.loans.length} done)`}
          </div>
          <button onclick="window._ddtApply()" ${!allChosen ? 'disabled' : ''}
            style="background:${allChosen ? `linear-gradient(135deg,${ACCENT},${ACCENT2})` : 'rgba(255,255,255,0.05)'};
            border:1px solid ${allChosen ? GLOW : 'rgba(255,255,255,0.1)'};border-radius:10px;color:#fff;
            padding:12px 32px;cursor:${allChosen ? 'pointer' : 'not-allowed'};font-size:14px;font-weight:700;
            font-family:'Orbitron',monospace;letter-spacing:1px;
            box-shadow:${allChosen ? `0 0 20px ${GLOW}55` : 'none'}">
            ▶ APPLY MONTH ${G.month}
          </button>
        </div>
      `;
    } else if (G.phase === 'result') {
      row.innerHTML = `
        <div style="text-align:center">
          <button onclick="window._ddtNextMonth()"
            style="background:linear-gradient(135deg,${ACCENT},${ACCENT2});border:1px solid ${GLOW};
            border-radius:10px;color:#fff;padding:12px 32px;cursor:pointer;font-size:14px;font-weight:700;
            font-family:'Orbitron',monospace;letter-spacing:1px;box-shadow:0 0 20px ${GLOW}55">
            ▶ NEXT MONTH
          </button>
        </div>
      `;
    }
  }

  /* ════════════════════════════════════════════════════════════
     APPLY MONTH
  ════════════════════════════════════════════════════════════ */
  window._ddtApply = function () {
    if (!G || G.phase !== 'choose') return;
    G.phase = 'result';

    let monthScore = 0;
    let alarm = false;

    /* process each loan */
    G.loans.forEach(loan => {
      const opt          = G.choices[loan.id];
      const rate         = loan.apr / 12;
      const interest     = loan.balance * rate;
      const minPay       = Math.max(loan.min, Math.round(interest + 1));
      const xtraPay      = Math.round(minPay * 1.5);

      /* accrue interest first */
      loan.balance = Math.round(loan.balance + interest);

      /* then apply payment */
      if (opt === OPT_SKIP) {
        alarm = true;
        /* extra penalty: miss fee +$15 */
        loan.balance = Math.round(loan.balance + 15);
      } else if (opt === OPT_MIN) {
        loan.balance = Math.max(0, Math.round(loan.balance - minPay));
        monthScore += 80;
      } else if (opt === OPT_XTRA) {
        loan.balance = Math.max(0, Math.round(loan.balance - xtraPay));
        monthScore += 200;
      }
    });

    /* apply emergency cost (already deducted from budget; just ding score) */
    if (G.emergencyCost > 0) {
      monthScore = Math.max(0, monthScore - 50);
    }

    /* check total debt vs cap */
    const debt = G.totalDebt();
    if (debt < G.capDebt) {
      /* bonus for being below cap */
      monthScore += Math.round(((G.capDebt - debt) / G.capDebt) * 150);
    } else {
      monthScore -= 200;
    }

    if (alarm) {
      G.alarmActive = true;
      setTimeout(() => { if (G) G.alarmActive = false; }, 2400);
    }

    G.score += Math.max(0, monthScore);

    /* add molecules when debt grows */
    if (alarm && G.moleculeAnim.length < 40) {
      G.loans.forEach((l, i) => addMolecule(i));
    }

    /* pop molecules when paid extra */
    G.loans.forEach((loan, i) => {
      if (G.choices[loan.id] === OPT_XTRA) {
        /* remove 3 molecules of this loan */
        let removed = 0;
        G.moleculeAnim = G.moleculeAnim.filter(m => {
          if (m.lIdx === i && removed < 3) { removed++; return false; }
          return true;
        });
      }
    });

    updateHUD();
    renderLoans();
    showResultFeedback(alarm, debt);
    renderActionRow();

    /* check lose */
    if (debt >= G.dangerDebt) {
      setTimeout(() => endGame(0), 1500);
      return;
    }
    /* check all loans paid off */
    if (G.loans.every(l => l.balance === 0)) {
      setTimeout(() => endGame(3), 1000);
      return;
    }
    /* check last month */
    if (G.month >= G.cfg.months) {
      setTimeout(() => {
        const stars = calcStars(debt);
        endGame(stars);
      }, 1500);
    }
  };

  /* ── next month ───────────────────────────────────────────── */
  window._ddtNextMonth = function () {
    if (!G || G.phase !== 'result') return;
    G.month++;
    G.choices    = {};
    G.budgetLeft = G.budget;
    G.emergencyCost = 0;
    G.emergency  = null;
    G.phase      = 'choose';

    scheduleEmergency();
    renderLoans();
    updateHUD();

    const emEl = document.getElementById('ddt_emergency');
    if (emEl) emEl.style.display = 'none';

    /* result feedback clear */
    const fb = document.getElementById('ddt_result_fb');
    if (fb) fb.remove();

    renderActionRow();
  };

  /* ════════════════════════════════════════════════════════════
     EMERGENCY EXPENSES (Level 2)
  ════════════════════════════════════════════════════════════ */
  function scheduleEmergency() {
    if (!G) return;
    const cfg = G.cfg;
    if (!cfg.emergencies.length || Math.random() > cfg.emergencyChance) return;
    const em = cfg.emergencies[Math.floor(Math.random() * cfg.emergencies.length)];

    /* cap emergency to not fully drain budget */
    if (em.cost >= G.budgetLeft * 0.9) return;

    G.emergency     = em;
    G.emergencyCost = em.cost;
    G.budgetLeft   -= em.cost;

    const emEl = document.getElementById('ddt_emergency');
    if (!emEl) return;
    emEl.style.display  = 'block';
    emEl.style.background = em.color + '22';
    emEl.style.border   = `1px solid ${em.color}`;
    emEl.style.color    = em.color;
    emEl.innerHTML = `⚠️ ${em.label} — ${em.msg} <span style="font-weight:400;font-size:12px">$${em.cost} deducted from budget.</span>`;

    const budEl = document.getElementById('ddt_budgetval');
    if (budEl) { budEl.textContent = '$' + G.budgetLeft; budEl.style.color = G.budgetLeft < 50 ? RED : CYAN; }
  }

  /* ════════════════════════════════════════════════════════════
     HUD UPDATE
  ════════════════════════════════════════════════════════════ */
  function updateHUD() {
    if (!G) return;
    const debt    = G.totalDebt();
    const capDebt = G.capDebt;

    /* score */
    const scoreEl = document.getElementById('ddt_score');
    if (scoreEl) scoreEl.textContent = G.score;

    /* month */
    const monthEl = document.getElementById('ddt_month');
    if (monthEl) monthEl.textContent = G.month;

    /* debt value */
    const debtEl = document.getElementById('ddt_debtval');
    if (debtEl) {
      debtEl.textContent = '$' + fmt(debt);
      debtEl.style.color = debt >= capDebt ? RED : debt >= capDebt * 0.85 ? ORANGE : GREEN;
    }

    /* debt bar (capped at danger zone) */
    const barEl = document.getElementById('ddt_debtbar');
    if (barEl) {
      const pct = Math.min(100, (debt / G.dangerDebt) * 100);
      barEl.style.width = pct + '%';
    }

    /* cap line position */
    const lineEl = document.getElementById('ddt_capline');
    if (lineEl) {
      const linePct = (capDebt / G.dangerDebt) * 100;
      lineEl.style.left = Math.min(98, linePct) + '%';
    }

    /* alarm on canvas */
    const alarmEl = document.getElementById('ddt_alarm');
    if (alarmEl) alarmEl.style.display = (G.alarmActive || debt >= capDebt) ? 'block' : 'none';
  }

  /* ════════════════════════════════════════════════════════════
     RESULT FEEDBACK FLASH
  ════════════════════════════════════════════════════════════ */
  function showResultFeedback(alarm, debt) {
    const existing = document.getElementById('ddt_result_fb');
    if (existing) existing.remove();

    const msgs = [];
    G.loans.forEach(loan => {
      const opt = G.choices[loan.id];
      if (opt === OPT_SKIP)  msgs.push(`⚠️ ${loan.label}: SKIPPED — balance + late fee!`);
      if (opt === OPT_MIN)   msgs.push(`💳 ${loan.label}: Minimum paid — interest still growing.`);
      if (opt === OPT_XTRA)  msgs.push(`🚀 ${loan.label}: Extra payment — molecules shrinking!`);
    });
    if (alarm) msgs.push('🔴 DANGER: Skipping causes compounding interest on top of unpaid balance!');

    const debt2 = G.totalDebt();
    const capOk = debt2 < G.capDebt;
    msgs.push(capOk
      ? `✅ Total debt $${fmt(debt2)} — below cap $${fmt(G.capDebt)}! +${Math.round(((G.capDebt - debt2) / G.capDebt) * 150)} bonus pts`
      : `🔴 Total debt $${fmt(debt2)} has exceeded the cap $${fmt(G.capDebt)}! -200 pts`
    );

    const fb = document.createElement('div');
    fb.id = 'ddt_result_fb';
    fb.style.cssText = `background:${DARK};border:1px solid ${capOk ? GREEN : RED};border-radius:12px;padding:12px;font-size:12px;line-height:1.8;color:rgba(255,255,255,0.85)`;
    fb.innerHTML = msgs.map(m => `<div>${m}</div>`).join('');

    const ar = document.getElementById('ddt_actionrow');
    if (ar) ar.parentElement.insertBefore(fb, ar);
  }

  function flashMsg(msg, col) {
    const fb = document.getElementById('ddt_result_fb');
    if (fb) fb.remove();
    const el = document.createElement('div');
    el.id = 'ddt_result_fb';
    el.style.cssText = `background:${col}22;border:1px solid ${col};border-radius:10px;padding:10px;font-size:12px;color:${col};text-align:center;margin-bottom:6px`;
    el.textContent = msg;
    const ar = document.getElementById('ddt_actionrow');
    if (ar) ar.parentElement.insertBefore(el, ar);
    setTimeout(() => el.remove(), 2200);
  }

  /* ════════════════════════════════════════════════════════════
     STAR CALC
  ════════════════════════════════════════════════════════════ */
  function calcStars(finalDebt) {
    /* 3★ if debt is 90% or less of start debt AND score > 600 */
    const debtRatio = finalDebt / G.startDebt;
    if (debtRatio <= 0.90 && G.score >= 600) return 3;
    if (debtRatio <= 1.00 && G.score >= 250) return 2;
    if (finalDebt < G.capDebt) return 1;
    return 0;
  }

  /* ════════════════════════════════════════════════════════════
     END GAME
  ════════════════════════════════════════════════════════════ */
  function endGame(stars) {
    if (!G) return;
    if (G.animHandle) { cancelAnimationFrame(G.animHandle); G.animHandle = null; }

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ddt_lab', { level: G.lvIdx + 1, stars, is3star, isPerfect: is3star, badge: 'Interest Crusher' })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('ddt_recovery', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();
    const won   = stars > 0;

    const starStr = '⭐'.repeat(stars) + (stars < 3 ? '☆'.repeat(3 - stars) : '');
    const lessons = [
      'Compound interest on debt is interest <em>charging interest</em>.',
      'Skip or underpay this month → next month\'s balance is higher → next month\'s interest charge is higher too.',
      'Pay early and aggressively to break the compounding cycle.',
      'Time is either your greatest enemy <em>or</em> your greatest ally with debt.',
    ];

    const root = document.getElementById('ddt_root');
    if (!root) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute;inset:0;background:rgba(3,4,12,0.95);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:18px;padding:28px;box-sizing:border-box;z-index:99;overflow-y:auto
    `;
    overlay.innerHTML = `
      <div style="font-family:'Orbitron',monospace;font-size:clamp(20px,5vw,32px);color:${won ? GOLD : RED};text-align:center;text-shadow:0 0 24px ${won ? GOLD : RED}">
        ${won ? '🎉 MISSION ACCOMPLISHED!' : '💀 DEBT OVERFLOW'}
      </div>
      <div style="font-size:clamp(28px,8vw,48px)">${starStr}</div>
      <div style="background:${DARK};border:1px solid ${ACCENT};border-radius:14px;padding:18px 24px;text-align:center;max-width:360px;width:100%">
        <div style="font-family:'Orbitron',monospace;font-size:13px;color:${GOLD};margin-bottom:4px">SCORE</div>
        <div style="font-family:'Orbitron',monospace;font-size:28px;color:#fff;font-weight:700">${G.score.toLocaleString()}</div>
        <div style="display:flex;justify-content:center;gap:20px;margin-top:10px;font-size:13px">
          <div style="color:${GOLD}">💰 ${coins} coins</div>
          <div style="color:${CYAN}">⚡ +${Math.round(coins / 4)} XP</div>
          ${stars === 3 ? `<div style="color:${GLOW}">🏅 Interest Crusher Badge</div>` : ''}
        </div>
      </div>
      <div style="background:${ACCENT}22;border:1px solid ${ACCENT};border-radius:14px;padding:18px;max-width:360px;width:100%;font-size:13px;line-height:1.8;color:rgba(255,255,255,0.85)">
        <div style="font-family:'Orbitron',monospace;font-size:11px;color:${GLOW};letter-spacing:1px;margin-bottom:10px">THE LESSON</div>
        ${lessons.map(l => `<div style="margin-bottom:6px">💡 ${l}</div>`).join('')}
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        <button onclick="window._ddtPlayAgain()" style="background:linear-gradient(135deg,${ACCENT},${ACCENT2});border:1px solid ${GLOW};border-radius:10px;color:#fff;padding:12px 24px;cursor:pointer;font-size:14px;font-weight:700;font-family:'Orbitron',monospace">🔄 PLAY AGAIN</button>
        <button onclick="window.ddt_labExit()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);border-radius:10px;color:#fff;padding:12px 24px;cursor:pointer;font-size:14px;font-weight:700;font-family:'Orbitron',monospace">← HUB</button>
      </div>
    `;
    root.appendChild(overlay);

    window._ddtPlayAgain = function () {
      if (G && G.animHandle) { cancelAnimationFrame(G.animHandle); G.animHandle = null; }
      G = null;
      const r = document.getElementById('ddt_root');
      if (r) renderLevelSelect(r);
    };
  }

  /* ════════════════════════════════════════════════════════════
     UTILS
  ════════════════════════════════════════════════════════════ */
  function fmt(n) {
    return Math.round(n).toLocaleString();
  }
  function fmtSign(n) {
    return (n >= 0 ? '+' : '') + '$' + fmt(Math.abs(n));
  }

})();
