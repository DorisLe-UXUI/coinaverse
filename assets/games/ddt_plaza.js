/* ════════════════════════════════════════════════════════════════════════════
   PAYMENT PLAN PLAZA — Debt Detox District / Coinaverse
   Debt Snowball vs Avalanche repayment strategy simulation.
   Drag payment coins onto debt accounts. Fewest turns = most stars.
   Level 1: 3 debts, learn both strategies side-by-side.
   Level 2: 6 debts + surprise expense events mid-plan.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────────────────── */
  const SCREEN_ID  = 'game_ddt_plaza';
  const WORLD_ID   = 'rebuilder';
  const ACCENT     = '#4B2D8F';
  const ACCENT2    = '#6B3FCF';
  const ACCENT_DIM = '#2D1A5A';
  const GOLD       = '#FFD166';
  const GOLD_DIM   = '#B8943F';
  const GREEN      = '#06D6A0';
  const RED        = '#EF4444';
  const ROAD_GLOW  = '#7C4DFF';

  const STAR3_TURNS_L1 = 4;   // complete L1 in ≤4 turns
  const STAR3_TURNS_L2 = 9;   // complete L2 in ≤9 turns
  const STAR2_TURNS_L1 = 6;
  const STAR2_TURNS_L2 = 13;

  /* ── Debt definitions ──────────────────────────────────────────────────── */
  const DEBTS_L1 = [
    { id: 'dl1_a', name: 'Payday Loan',    balance: 150,  apr: 30, minPay: 30,  icon: '💸' },
    { id: 'dl1_b', name: 'Credit Card',    balance: 300,  apr: 22, minPay: 25,  icon: '💳' },
    { id: 'dl1_c', name: 'Personal Loan',  balance: 900,  apr: 6,  minPay: 45,  icon: '🏦' },
  ];

  const DEBTS_L2 = [
    { id: 'dl2_a', name: 'Payday Loan',    balance: 200,  apr: 35, minPay: 40,  icon: '💸' },
    { id: 'dl2_b', name: 'Store Card',     balance: 350,  apr: 28, minPay: 30,  icon: '🛍️' },
    { id: 'dl2_c', name: 'Credit Card A',  balance: 480,  apr: 22, minPay: 35,  icon: '💳' },
    { id: 'dl2_d', name: 'Medical Bill',   balance: 600,  apr: 8,  minPay: 40,  icon: '🏥' },
    { id: 'dl2_e', name: 'Credit Card B',  balance: 750,  apr: 19, minPay: 45,  icon: '💳' },
    { id: 'dl2_f', name: 'Personal Loan',  balance: 1200, apr: 9,  minPay: 60,  icon: '🏦' },
  ];

  const BUDGET_L1 = 500;
  const BUDGET_L2 = 800;

  /* ── Surprise events for Level 2 ───────────────────────────────────────── */
  const EVENTS_L2 = [
    { turn: 3, text: 'Car repair needed!',       budgetHit: -120, icon: '🚗' },
    { turn: 6, text: 'Unexpected medical bill!', budgetHit: -200, icon: '🏥' },
    { turn: 9, text: 'Got a side hustle bonus!', budgetHit: +150, icon: '💰' },
  ];

  /* ── Game state ────────────────────────────────────────────────────────── */
  let G = null;

  function newGame(level) {
    const rawDebts = level === 1 ? DEBTS_L1 : DEBTS_L2;
    const budget   = level === 1 ? BUDGET_L1 : BUDGET_L2;
    const debts    = rawDebts.map(d => ({
      ...d,
      balance:    d.balance,
      origBal:    d.balance,
      paid:       false,
      litUp:      false,
    }));

    // Pre-calculate interest saved comparison (for end screen)
    const snowballOrder  = [...debts].sort((a,b) => a.origBal - b.origBal).map(d=>d.id);
    const avalancheOrder = [...debts].sort((a,b) => b.apr - a.apr).map(d=>d.id);

    return {
      level,
      debts,
      budget,
      origBudget:   budget,
      turn:         1,
      totalInterestPaid: 0,
      turnsTarget:  level === 1 ? STAR3_TURNS_L1 : STAR3_TURNS_L2,
      phase:        'play',       // 'play' | 'event' | 'end'
      snowballOrder,
      avalancheOrder,
      // drag state
      drag:         null,         // { coinEl, startX, startY, currentX, currentY, budgetUsed }
      budgetUsed:   0,            // this turn
      turnPayments: {},           // debtId -> amount paid this turn
      floats:       [],           // { id, text, x, y, color, created }
      eventQueue:   (level === 2 ? [...EVENTS_L2] : []),
      pendingEvent: null,
      showHint:     null,
      hintTimer:    null,
    };
  }

  /* ── Screen entry point ────────────────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};

  window.SCREENS[SCREEN_ID] = function () {
    G = null;
    setTimeout(initGame, 40);
    return `
<div id="ddtRoot" style="position:absolute;inset:0;background:#03040c;overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none;-webkit-user-select:none">

  <!-- Stars bg canvas -->
  <canvas id="ddtStars" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.5"></canvas>

  <!-- Road grid canvas (plaza visual) -->
  <canvas id="ddtRoad" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.35"></canvas>

  <!-- TOP BAR -->
  <div id="ddtTopBar" style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;padding:12px 14px;gap:10px;background:linear-gradient(180deg,rgba(3,4,12,.95) 70%,transparent)">
    <button onclick="window.ddt_plazaExit()" style="padding:7px 13px;border:1px solid rgba(75,45,143,.6);border-radius:9px;background:rgba(75,45,143,.2);color:#A78BFA;font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer;white-space:nowrap;transition:all .15s" onmouseover="this.style.background='rgba(75,45,143,.4)'" onmouseout="this.style.background='rgba(75,45,143,.2)'">← HUB</button>
    <div style="font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.18em;color:#A78BFA;flex:1;text-align:center;text-shadow:0 0 14px rgba(75,45,143,.8)">💜 PAYMENT PLAN PLAZA</div>
    <div style="display:flex;gap:12px;align-items:center">
      <div style="font-family:Orbitron,sans-serif;font-size:.58rem;color:rgba(255,255,255,.45);letter-spacing:.08em">TURN</div>
      <div id="ddtTurnNum" style="font-family:Orbitron,sans-serif;font-size:1rem;color:#FFD166;text-shadow:0 0 10px rgba(255,209,102,.5);min-width:28px;text-align:center">1</div>
    </div>
  </div>

  <!-- HUD: budget pool -->
  <div id="ddtHud" style="position:absolute;top:56px;left:0;right:0;z-index:15;padding:8px 14px">
    <div style="display:flex;align-items:center;gap:10px;background:rgba(75,45,143,.12);border:1px solid rgba(75,45,143,.3);border-radius:12px;padding:10px 14px">
      <div style="font-size:1.3rem">💰</div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
          <div style="font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.12em;color:rgba(255,255,255,.5)">MONTHLY BUDGET</div>
          <div style="display:flex;gap:8px;align-items:baseline">
            <span id="ddtBudgetUsed" style="font-family:Orbitron,sans-serif;font-size:.75rem;color:#EF4444;font-variant-numeric:tabular-nums">$0</span>
            <span style="color:rgba(255,255,255,.3);font-size:.65rem">/</span>
            <span id="ddtBudgetTotal" style="font-family:Orbitron,sans-serif;font-size:.75rem;color:#FFD166;font-variant-numeric:tabular-nums">$500</span>
          </div>
        </div>
        <div style="height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden">
          <div id="ddtBudgetBar" style="height:100%;width:100%;background:linear-gradient(90deg,#4B2D8F,#7C4DFF);border-radius:3px;transition:width .3s ease;box-shadow:0 0 8px rgba(75,45,143,.6)"></div>
        </div>
      </div>
      <button id="ddtEndTurnBtn" onclick="ddtEndTurn()" style="padding:8px 14px;border:1px solid rgba(255,209,102,.5);border-radius:9px;background:rgba(255,209,102,.15);color:#FFD166;font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.1em;cursor:pointer;white-space:nowrap;transition:all .15s;box-shadow:0 0 12px rgba(255,209,102,.15)">END TURN →</button>
    </div>

    <!-- Coin pool (draggable coins) -->
    <div id="ddtCoinPool" style="display:flex;gap:8px;padding:8px 0 4px;flex-wrap:wrap;justify-content:center;min-height:44px"></div>
  </div>

  <!-- Debt cards area -->
  <div id="ddtCardsArea" style="position:absolute;top:180px;bottom:0;left:0;right:0;z-index:10;overflow-y:auto;padding:8px 12px 80px;-webkit-overflow-scrolling:touch">
    <div id="ddtCardsGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px"></div>
  </div>

  <!-- Float labels layer -->
  <div id="ddtFloats" style="position:absolute;inset:0;z-index:25;pointer-events:none;overflow:hidden"></div>

  <!-- Event overlay -->
  <div id="ddtEventOverlay" style="position:absolute;inset:0;z-index:40;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.88);backdrop-filter:blur(8px)"></div>

  <!-- End overlay -->
  <div id="ddtEndOverlay" style="position:absolute;inset:0;z-index:50;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.92);backdrop-filter:blur(10px)"></div>

  <!-- Strategy hint pill -->
  <div id="ddtHintPill" style="position:absolute;bottom:16px;left:12px;right:12px;z-index:30;display:none;background:rgba(75,45,143,.25);border:1px solid rgba(75,45,143,.5);border-radius:12px;padding:10px 14px;font-size:.78rem;color:rgba(255,255,255,.8);text-align:center;backdrop-filter:blur(4px)"></div>

</div>`;
  };

  /* ── Init ──────────────────────────────────────────────────────────────── */
  function initGame() {
    const root = document.getElementById('ddtRoot');
    if (!root) return;

    drawStars();
    drawRoadGrid();

    showLevelSelect();
  }

  /* ── Level select / tutorial screen ───────────────────────────────────── */
  function showLevelSelect() {
    const end = document.getElementById('ddtEndOverlay');
    end.style.display = 'flex';
    end.innerHTML = `
      <div style="max-width:440px;width:92%;padding:28px 24px;background:rgba(10,5,30,.95);border:1px solid rgba(75,45,143,.5);border-radius:20px;text-align:center;box-shadow:0 0 60px rgba(75,45,143,.3)">
        <div style="font-size:2.2rem;margin-bottom:8px">💜</div>
        <div style="font-family:Orbitron,sans-serif;font-size:1rem;letter-spacing:.18em;color:#A78BFA;margin-bottom:6px">PAYMENT PLAN PLAZA</div>
        <div style="font-size:.78rem;color:rgba(255,255,255,.55);margin-bottom:20px;line-height:1.5">Drag payment coins onto your debts.<br>Choose your strategy wisely.</div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
          <div style="background:rgba(75,45,143,.15);border:1px solid rgba(75,45,143,.4);border-radius:12px;padding:12px 10px">
            <div style="font-size:1.3rem;margin-bottom:4px">🏔️</div>
            <div style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.1em;color:#A78BFA;margin-bottom:4px">SNOWBALL</div>
            <div style="font-size:.68rem;color:rgba(255,255,255,.55);line-height:1.4">Pay smallest balance first for quick psychological wins</div>
          </div>
          <div style="background:rgba(255,209,102,.07);border:1px solid rgba(255,209,102,.3);border-radius:12px;padding:12px 10px">
            <div style="font-size:1.3rem;margin-bottom:4px">🌊</div>
            <div style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.1em;color:#FFD166;margin-bottom:4px">AVALANCHE</div>
            <div style="font-size:.68rem;color:rgba(255,255,255,.55);line-height:1.4">Pay highest interest first to save the most money</div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          <button onclick="ddtStartLevel(1)" style="padding:14px;border:1px solid rgba(75,45,143,.6);border-radius:12px;background:rgba(75,45,143,.3);color:#A78BFA;font-family:Orbitron,sans-serif;font-size:.72rem;letter-spacing:.14em;cursor:pointer;transition:all .2s;box-shadow:0 0 20px rgba(75,45,143,.2)" onmouseover="this.style.background='rgba(75,45,143,.5)'" onmouseout="this.style.background='rgba(75,45,143,.3)'">
            LEVEL 1 — LEARN
            <div style="font-family:Inter,sans-serif;font-size:.62rem;color:rgba(255,255,255,.4);font-weight:400;margin-top:3px;letter-spacing:.02em">3 debts · Compare both strategies side-by-side</div>
          </button>
          <button onclick="ddtStartLevel(2)" style="padding:14px;border:1px solid rgba(255,209,102,.4);border-radius:12px;background:rgba(255,209,102,.08);color:#FFD166;font-family:Orbitron,sans-serif;font-size:.72rem;letter-spacing:.14em;cursor:pointer;transition:all .2s;box-shadow:0 0 20px rgba(255,209,102,.1)" onmouseover="this.style.background='rgba(255,209,102,.18)'" onmouseout="this.style.background='rgba(255,209,102,.08)'">
            LEVEL 2 — MASTER
            <div style="font-family:Inter,sans-serif;font-size:.62rem;color:rgba(255,255,255,.4);font-weight:400;margin-top:3px;letter-spacing:.02em">6 debts · Surprise expenses force adaptation</div>
          </button>
        </div>
      </div>`;
  }

  /* ── Start a level ─────────────────────────────────────────────────────── */
  window.ddtStartLevel = function (level) {
    document.getElementById('ddtEndOverlay').style.display = 'none';
    document.getElementById('ddtEventOverlay').style.display = 'none';
    G = newGame(level);
    document.getElementById('ddtBudgetTotal').textContent = '$' + G.budget;
    renderAll();
  };

  /* ── Render everything ─────────────────────────────────────────────────── */
  function renderAll() {
    if (!G) return;
    updateHUD();
    renderCoinPool();
    renderCards();
  }

  /* ── HUD update ─────────────────────────────────────────────────────────── */
  function updateHUD() {
    if (!G) return;
    setTxt('ddtTurnNum', G.turn);
    setTxt('ddtBudgetTotal', '$' + G.budget);
    const used = G.budgetUsed;
    const total = G.budget;
    setTxt('ddtBudgetUsed', '$' + used);
    const pct = Math.min(used / total * 100, 100);
    const bar = document.getElementById('ddtBudgetBar');
    if (bar) {
      bar.style.width = (100 - pct) + '%';
      if (pct > 80) {
        bar.style.background = 'linear-gradient(90deg,#EF4444,#F97316)';
      } else if (pct > 50) {
        bar.style.background = 'linear-gradient(90deg,#F97316,#FFD166)';
      } else {
        bar.style.background = 'linear-gradient(90deg,#4B2D8F,#7C4DFF)';
      }
    }
  }

  /* ── Coin pool ─────────────────────────────────────────────────────────── */
  const COIN_VALUES = [25, 50, 100, 200];

  function renderCoinPool() {
    if (!G) return;
    const pool = document.getElementById('ddtCoinPool');
    if (!pool) return;

    const remaining = G.budget - G.budgetUsed;
    pool.innerHTML = '';

    COIN_VALUES.forEach(val => {
      if (val > remaining) return;
      const coin = document.createElement('div');
      coin.className = 'ddt-coin';
      coin.dataset.val = val;
      coin.style.cssText = `
        display:inline-flex;align-items:center;justify-content:center;
        width:52px;height:52px;border-radius:50%;
        background:radial-gradient(circle at 35% 35%, #8B5CF6, #4B2D8F);
        border:2px solid rgba(167,139,250,.6);
        font-family:Orbitron,sans-serif;font-size:.6rem;color:#FFD166;
        font-variant-numeric:tabular-nums;cursor:grab;
        box-shadow:0 0 14px rgba(75,45,143,.6),inset 0 1px 2px rgba(255,255,255,.15);
        transition:transform .1s,box-shadow .1s;
        touch-action:none;position:relative;flex-shrink:0;
      `;
      coin.innerHTML = `<span style="text-align:center;line-height:1.1">$${val}</span>`;

      coin.addEventListener('mousedown', e => startDrag(e, coin, val));
      coin.addEventListener('touchstart', e => startDrag(e, coin, val), { passive: false });
      pool.appendChild(coin);
    });

    if (remaining <= 0) {
      pool.innerHTML = '<div style="font-size:.72rem;color:rgba(255,255,255,.35);padding:8px;font-style:italic">Budget exhausted for this turn</div>';
    }
  }

  /* ── Debt cards ────────────────────────────────────────────────────────── */
  function renderCards() {
    if (!G) return;
    const grid = document.getElementById('ddtCardsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    G.debts.forEach(debt => {
      const card = buildCard(debt);
      grid.appendChild(card);
    });
  }

  function buildCard(debt) {
    const card = document.createElement('div');
    card.id   = 'card_' + debt.id;

    const pct      = Math.max(0, debt.balance / debt.origBal * 100);
    const isPaid   = debt.balance <= 0;
    const payment  = G.turnPayments[debt.id] || 0;
    const interest = +(debt.balance * (debt.apr / 100 / 12)).toFixed(2);

    // Snowball and avalanche hints
    const snowIdx = G.snowballOrder.indexOf(debt.id);
    const avaIdx  = G.avalancheOrder.indexOf(debt.id);
    const isSnowTarget = snowIdx === 0 && !isPaid;
    const isAvaTarget  = avaIdx  === 0 && !isPaid;

    let stratBadge = '';
    if (isSnowTarget && isAvaTarget) {
      stratBadge = `<div style="font-size:.52rem;background:rgba(6,214,160,.15);border:1px solid rgba(6,214,160,.4);border-radius:5px;padding:2px 5px;color:#06D6A0;letter-spacing:.06em;margin-bottom:4px">★ BOTH TARGET THIS</div>`;
    } else if (isSnowTarget) {
      stratBadge = `<div style="font-size:.52rem;background:rgba(167,139,250,.12);border:1px solid rgba(167,139,250,.35);border-radius:5px;padding:2px 5px;color:#A78BFA;letter-spacing:.06em;margin-bottom:4px">🏔️ SNOWBALL TARGET</div>`;
    } else if (isAvaTarget) {
      stratBadge = `<div style="font-size:.52rem;background:rgba(255,209,102,.1);border:1px solid rgba(255,209,102,.3);border-radius:5px;padding:2px 5px;color:#FFD166;letter-spacing:.06em;margin-bottom:4px">🌊 AVALANCHE TARGET</div>`;
    }

    const borderColor = isPaid ? '#06D6A0' : (isSnowTarget || isAvaTarget ? 'rgba(75,45,143,.7)' : 'rgba(75,45,143,.3)');
    const bgColor     = isPaid ? 'rgba(6,214,160,.08)' : 'rgba(75,45,143,.08)';
    const glowColor   = isPaid ? '0 0 20px rgba(6,214,160,.3)' : (isSnowTarget || isAvaTarget ? '0 0 20px rgba(75,45,143,.3)' : 'none');

    card.style.cssText = `
      background:${bgColor};border:1px solid ${borderColor};border-radius:14px;
      padding:12px;position:relative;transition:border-color .3s,box-shadow .3s;
      box-shadow:${glowColor};overflow:hidden;
    `;

    card.setAttribute('data-debt-id', debt.id);

    if (isPaid) {
      card.innerHTML = `
        <div style="text-align:center;padding:8px 0">
          <div style="font-size:1.8rem;margin-bottom:4px">✅</div>
          <div style="font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.1em;color:#06D6A0">${debt.icon} ${debt.name}</div>
          <div style="font-size:.62rem;color:rgba(6,214,160,.7);margin-top:4px">PAID OFF!</div>
          <div style="height:6px;border-radius:3px;background:rgba(6,214,160,.2);margin-top:8px;overflow:hidden">
            <div style="width:100%;height:100%;background:#06D6A0;border-radius:3px;box-shadow:0 0 6px rgba(6,214,160,.6)"></div>
          </div>
        </div>`;
    } else {
      card.innerHTML = `
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#4B2D8F,transparent);opacity:.5"></div>
        ${stratBadge}
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="font-size:1.1rem">${debt.icon}</span>
          <div style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.08em;color:rgba(255,255,255,.9);line-height:1.2">${debt.name}</div>
        </div>

        <div style="margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
            <span style="font-size:.6rem;color:rgba(255,255,255,.4)">BALANCE</span>
            <span style="font-family:Orbitron,sans-serif;font-size:.85rem;color:#fff;font-variant-numeric:tabular-nums">$${debt.balance.toFixed(0)}</span>
          </div>
          <div style="height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden">
            <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#7C4DFF,#A78BFA);border-radius:3px;transition:width .4s ease;box-shadow:0 0 6px rgba(124,77,255,.5)"></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px">
          <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:7px;padding:5px 6px;text-align:center">
            <div style="font-size:.5rem;color:rgba(255,255,255,.35);margin-bottom:1px">APR</div>
            <div style="font-family:Orbitron,sans-serif;font-size:.72rem;color:#F87171;font-variant-numeric:tabular-nums">${debt.apr}%</div>
          </div>
          <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:7px;padding:5px 6px;text-align:center">
            <div style="font-size:.5rem;color:rgba(255,255,255,.35);margin-bottom:1px">MIN PAY</div>
            <div style="font-family:Orbitron,sans-serif;font-size:.72rem;color:rgba(255,255,255,.7);font-variant-numeric:tabular-nums">$${debt.minPay}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;font-size:.58rem;color:rgba(255,255,255,.35);margin-bottom:8px">
          <span>Monthly interest: <span style="color:#F87171;font-variant-numeric:tabular-nums">$${interest.toFixed(2)}</span></span>
        </div>

        ${payment > 0 ? `<div style="font-size:.6rem;color:#06D6A0;text-align:center;background:rgba(6,214,160,.1);border:1px solid rgba(6,214,160,.25);border-radius:6px;padding:4px;font-variant-numeric:tabular-nums">This turn: −$${payment}</div>` : ''}

        <!-- drop zone indicator -->
        <div id="drop_${debt.id}" style="position:absolute;inset:0;border-radius:14px;border:2px dashed rgba(75,45,143,.0);transition:all .2s;pointer-events:none"></div>
      `;
    }

    // Drop target listeners
    if (!isPaid) {
      card.addEventListener('dragover', e => { e.preventDefault(); highlightDrop(debt.id, true); });
      card.addEventListener('dragleave', () => highlightDrop(debt.id, false));
      card.addEventListener('drop', e => { e.preventDefault(); handleDrop(debt.id); });
      card.addEventListener('mouseup', () => handleDrop(debt.id));
      card.addEventListener('touchend', () => handleDrop(debt.id));
    }

    return card;
  }

  function highlightDrop(debtId, on) {
    const el = document.getElementById('drop_' + debtId);
    if (el) {
      el.style.borderColor = on ? 'rgba(75,45,143,.7)' : 'rgba(75,45,143,.0)';
      el.style.background  = on ? 'rgba(75,45,143,.12)' : 'transparent';
    }
  }

  /* ── Drag system ───────────────────────────────────────────────────────── */
  let dragGhost = null;
  let draggingVal = 0;
  let dragOver    = null;

  function startDrag(e, coinEl, val) {
    if (G.phase !== 'play') return;
    e.preventDefault();

    draggingVal = val;
    dragOver    = null;

    const rect = coinEl.getBoundingClientRect();
    const cx   = e.touches ? e.touches[0].clientX : e.clientX;
    const cy   = e.touches ? e.touches[0].clientY : e.clientY;

    // Ghost
    dragGhost = document.createElement('div');
    dragGhost.style.cssText = `
      position:fixed;width:52px;height:52px;border-radius:50%;
      background:radial-gradient(circle at 35% 35%, #8B5CF6, #4B2D8F);
      border:2px solid #A78BFA;display:flex;align-items:center;justify-content:center;
      font-family:Orbitron,sans-serif;font-size:.6rem;color:#FFD166;
      box-shadow:0 0 20px rgba(75,45,143,.8);pointer-events:none;z-index:9999;
      transform:scale(1.15);opacity:.9;
    `;
    dragGhost.textContent = '$' + val;
    dragGhost.style.left  = (cx - 26) + 'px';
    dragGhost.style.top   = (cy - 26) + 'px';
    document.body.appendChild(dragGhost);

    const onMove = ev => {
      const mx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const my = ev.touches ? ev.touches[0].clientY : ev.clientY;
      dragGhost.style.left = (mx - 26) + 'px';
      dragGhost.style.top  = (my - 26) + 'px';

      // Detect which card we're over
      const el = document.elementFromPoint(mx, my);
      const card = el && el.closest('[data-debt-id]');
      const newOver = card ? card.getAttribute('data-debt-id') : null;

      if (newOver !== dragOver) {
        if (dragOver) highlightDrop(dragOver, false);
        dragOver = newOver;
        if (dragOver) highlightDrop(dragOver, true);
      }
    };

    const onUp = ev => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onUp);

      if (dragGhost) { dragGhost.remove(); dragGhost = null; }
      if (dragOver) { highlightDrop(dragOver, false); handleDrop(dragOver); }
      dragOver = null;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend',  onUp);
  }

  function handleDrop(debtId) {
    if (!G || G.phase !== 'play') return;
    if (!draggingVal || draggingVal <= 0) return;

    const debt = G.debts.find(d => d.id === debtId);
    if (!debt || debt.balance <= 0) return;

    const remaining = G.budget - G.budgetUsed;
    if (remaining <= 0) {
      showHintPill('No budget remaining for this turn!', '#EF4444');
      draggingVal = 0;
      return;
    }

    const pay = Math.min(draggingVal, remaining, debt.balance);
    if (pay <= 0) { draggingVal = 0; return; }

    // Apply payment
    debt.balance = +(debt.balance - pay).toFixed(2);
    G.budgetUsed += pay;
    G.turnPayments[debt.id] = (G.turnPayments[debt.id] || 0) + pay;

    if (debt.balance <= 0) {
      debt.balance = 0;
      debt.paid    = true;
      debt.litUp   = true;
      floatText(debtId, '🎉 PAID OFF!', '#06D6A0');
      checkStratHint(debt);
    } else {
      floatText(debtId, '-$' + pay, '#A78BFA');
    }

    draggingVal = 0;

    // Remove this snow/ava target from front if paid
    if (debt.paid) {
      G.snowballOrder  = G.snowballOrder.filter(id => id !== debtId);
      G.avalancheOrder = G.avalancheOrder.filter(id => id !== debtId);
    }

    updateHUD();
    renderCards();
    renderCoinPool();
    checkWin();
  }

  function checkStratHint(debt) {
    const snowFirst = G.snowballOrder[0] === debt.id || debt.origBal === Math.min(...G.debts.filter(d=>!d.paid).map(d=>d.origBal));
    const avaFirst  = G.avalancheOrder[0] === debt.id || debt.apr === Math.max(...G.debts.filter(d=>!d.paid).map(d=>d.apr));
    if (snowFirst && avaFirst) {
      showHintPill('Both strategies agree — great move!', '#06D6A0');
    } else if (snowFirst) {
      showHintPill('Snowball win — quick payoff builds momentum!', '#A78BFA');
    } else if (avaFirst) {
      showHintPill('Avalanche win — high interest crushed!', '#FFD166');
    }
  }

  /* ── End Turn ──────────────────────────────────────────────────────────── */
  window.ddtEndTurn = function () {
    if (!G || G.phase !== 'play') return;

    // Apply min payments if budget allows (auto), then add monthly interest
    G.debts.forEach(debt => {
      if (debt.balance <= 0) return;

      // If the player made no payment, must at least pay minimum (if budget allows)
      const paid = G.turnPayments[debt.id] || 0;
      if (paid < debt.minPay && G.budgetUsed < G.budget) {
        const autoPay = Math.min(debt.minPay - paid, G.budget - G.budgetUsed, debt.balance);
        if (autoPay > 0) {
          debt.balance = +(debt.balance - autoPay).toFixed(2);
          G.budgetUsed += autoPay;
          G.turnPayments[debt.id] = (G.turnPayments[debt.id] || 0) + autoPay;
          if (debt.balance <= 0) { debt.balance = 0; debt.paid = true; debt.litUp = true; }
        }
      }

      // Add monthly interest (happens after payments each turn)
      if (debt.balance > 0) {
        const interestCharge = +(debt.balance * (debt.apr / 100 / 12)).toFixed(2);
        debt.balance = +(debt.balance + interestCharge).toFixed(2);
        G.totalInterestPaid += interestCharge;
      }
    });

    // Check for events
    const ev = G.eventQueue.find(e => e.turn === G.turn);
    if (ev) {
      G.eventQueue = G.eventQueue.filter(e => e !== ev);
      G.pendingEvent = ev;
      G.phase = 'event';
      showEvent(ev);
      return;
    }

    advanceTurn();
  };

  function advanceTurn() {
    G.turn++;
    G.budgetUsed   = 0;
    G.turnPayments = {};

    // Budget modifier from events already applied
    if (G.pendingEvent) {
      G.budget = Math.max(0, G.budget + G.pendingEvent.budgetHit);
      G.pendingEvent = null;
    }

    G.phase = 'play';
    checkWin();
    if (G.phase === 'play') {
      renderAll();
      updateRoadLights();
    }
  }

  function showEvent(ev) {
    const overlay = document.getElementById('ddtEventOverlay');
    overlay.style.display = 'flex';
    const isGood = ev.budgetHit > 0;
    overlay.innerHTML = `
      <div style="max-width:380px;width:90%;padding:28px 22px;background:rgba(10,5,30,.96);border:1px solid ${isGood ? 'rgba(6,214,160,.5)' : 'rgba(239,68,68,.5)'};border-radius:18px;text-align:center;box-shadow:0 0 40px ${isGood ? 'rgba(6,214,160,.3)' : 'rgba(239,68,68,.3)'}">
        <div style="font-size:2.5rem;margin-bottom:10px">${ev.icon}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.72rem;letter-spacing:.14em;color:${isGood ? '#06D6A0' : '#EF4444'};margin-bottom:8px">${isGood ? 'SURPRISE INCOME!' : 'UNEXPECTED EXPENSE!'}</div>
        <div style="font-size:.85rem;color:#fff;margin-bottom:6px;font-weight:600">${ev.text}</div>
        <div style="font-size:.78rem;color:rgba(255,255,255,.55);margin-bottom:18px">Your monthly budget ${isGood ? 'increases' : 'decreases'} by <span style="color:${isGood ? '#06D6A0' : '#EF4444'};font-variant-numeric:tabular-nums">${isGood ? '+' : ''}$${Math.abs(ev.budgetHit)}</span> this turn.</div>
        <div style="font-size:.72rem;color:rgba(255,255,255,.4);margin-bottom:16px;font-style:italic">"Rigid plans break. Adapt your strategy and keep going."</div>
        <button onclick="ddtDismissEvent()" style="padding:12px 28px;border:1px solid ${isGood ? 'rgba(6,214,160,.5)' : 'rgba(239,68,68,.5)'};border-radius:10px;background:${isGood ? 'rgba(6,214,160,.15)' : 'rgba(239,68,68,.15)'};color:${isGood ? '#06D6A0' : '#EF4444'};font-family:Orbitron,sans-serif;font-size:.68rem;letter-spacing:.12em;cursor:pointer">GOT IT — ADAPT</button>
      </div>`;
  }

  window.ddtDismissEvent = function () {
    document.getElementById('ddtEventOverlay').style.display = 'none';
    advanceTurn();
  };

  /* ── Win / Lose check ──────────────────────────────────────────────────── */
  function checkWin() {
    if (!G) return;

    const allPaid = G.debts.every(d => d.balance <= 0);
    if (allPaid) {
      G.phase = 'end';
      setTimeout(() => showEndScreen(true), 600);
      return;
    }

    // Lose: budget exhausted and all debts still have minimum balance unpaid
    const minRequired = G.debts.filter(d=>d.balance>0).reduce((s,d)=>s+d.minPay,0);
    if (G.budget - G.budgetUsed < minRequired && !allPaid && G.turn > 2) {
      G.phase = 'end';
      setTimeout(() => showEndScreen(false), 600);
    }
  }

  function showEndScreen(win) {
    if (!G) return;

    // Stars calculation
    const turns    = G.turn;
    const star3T   = G.level === 1 ? STAR3_TURNS_L1 : STAR3_TURNS_L2;
    const star2T   = G.level === 1 ? STAR2_TURNS_L1 : STAR2_TURNS_L2;
    let stars = 0;
    if (win && turns <= star3T) stars = 3;
    else if (win && turns <= star2T) stars = 2;
    else if (win) stars = 2;  // any completion = at least 2 stars

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ddt_plaza', { level: G.level, stars, is3star, isPerfect: is3star, badge: 'Strategy Master' })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('ddt_recovery', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    // Interest summary
    const intPaid   = G.totalInterestPaid.toFixed(2);
    const starsHtml = '⭐'.repeat(stars) + '<span style="opacity:.2">' + '⭐'.repeat(3 - stars) + '</span>';

    // Strategy recommendation
    const snowFirst = G.snowballOrder;
    const avaFirst  = G.avalancheOrder;
    const lesson = !win
      ? `Your budget ran out before covering the minimum payments — in real life that means late fees, credit damage and growing balances.<br><br><b>Tip:</b> knock out a small debt early (snowball) or the highest APR first (avalanche) so interest stops eating your budget.<br><br><em>Try again — plan the order before you spend.</em>`
      : G.level === 1
      ? `<b>Snowball</b> paid off your smallest debts first — fast wins to keep you motivated.<br><b>Avalanche</b> hit the highest interest rates first — saving the most money overall.<br><br>Neither strategy is wrong. <em>The best one is the one you stick to.</em>`
      : `You faced real surprises mid-plan and adapted. That's the real skill.<br><br><b>Snowball</b> gives momentum. <b>Avalanche</b> saves money. Rigid rules break — flexible thinking wins.<br><br><em>The only losing move: paying only minimums while interest compounds.</em>`;

    const overlay = document.getElementById('ddtEndOverlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div style="max-width:440px;width:92%;padding:28px 22px;background:rgba(10,5,30,.97);border:1px solid rgba(75,45,143,.6);border-radius:20px;text-align:center;box-shadow:0 0 60px rgba(75,45,143,.4);max-height:90vh;overflow-y:auto">

        <div style="font-family:Orbitron,sans-serif;font-size:1.6rem;margin-bottom:4px">${starsHtml}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.82rem;letter-spacing:.18em;color:${win?'#A78BFA':'#F87171'};margin-bottom:4px">${win?'DEBT FREE!':'OUT OF BUDGET'}</div>
        <div style="font-size:.72rem;color:rgba(255,255,255,.45);margin-bottom:16px">${win?`Completed in ${turns} turn${turns!==1?'s':''}`:`Minimum payments exceeded your remaining budget on turn ${turns}`}</div>

        <!-- Stats row -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
          <div style="background:rgba(75,45,143,.15);border:1px solid rgba(75,45,143,.3);border-radius:10px;padding:10px 6px">
            <div style="font-family:Orbitron,sans-serif;font-size:.9rem;color:#FFD166">💰${coins}</div>
            <div style="font-size:.55rem;color:rgba(255,255,255,.4);margin-top:2px">COINS EARNED</div>
          </div>
          <div style="background:rgba(75,45,143,.15);border:1px solid rgba(75,45,143,.3);border-radius:10px;padding:10px 6px">
            <div style="font-family:Orbitron,sans-serif;font-size:.9rem;color:#A78BFA">${turns}</div>
            <div style="font-size:.55rem;color:rgba(255,255,255,.4);margin-top:2px">TURNS</div>
          </div>
          <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:10px 6px">
            <div style="font-family:Orbitron,sans-serif;font-size:.75rem;color:#F87171;font-variant-numeric:tabular-nums">$${intPaid}</div>
            <div style="font-size:.55rem;color:rgba(255,255,255,.4);margin-top:2px">INTEREST PAID</div>
          </div>
        </div>

        ${stars === 3 ? '<div style="background:rgba(255,209,102,.1);border:1px solid rgba(255,209,102,.35);border-radius:10px;padding:8px 12px;font-size:.65rem;color:#FFD166;margin-bottom:14px;font-family:Orbitron,sans-serif;letter-spacing:.08em">🏆 STRATEGY MASTER BADGE EARNED</div>' : ''}

        <!-- Lesson -->
        <div style="background:rgba(75,45,143,.1);border:1px solid rgba(75,45,143,.3);border-radius:12px;padding:14px;text-align:left;margin-bottom:18px">
          <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.12em;color:#A78BFA;margin-bottom:8px">📚 WHAT YOU LEARNED</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.75);line-height:1.6">${lesson}</div>
        </div>

        <!-- Buttons -->
        <div style="display:flex;gap:10px">
          <button onclick="ddtStartLevel(${G.level})" style="flex:1;padding:13px;border:1px solid rgba(75,45,143,.6);border-radius:11px;background:rgba(75,45,143,.25);color:#A78BFA;font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer;transition:all .2s" onmouseover="this.style.background='rgba(75,45,143,.45)'" onmouseout="this.style.background='rgba(75,45,143,.25)'">PLAY AGAIN</button>
          <button onclick="window.ddt_plazaExit()" style="flex:1;padding:13px;border:1px solid rgba(255,209,102,.4);border-radius:11px;background:rgba(255,209,102,.1);color:#FFD166;font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer;transition:all .2s" onmouseover="this.style.background='rgba(255,209,102,.22)'" onmouseout="this.style.background='rgba(255,209,102,.1)'">← HUB</button>
        </div>
        ${G.level===1 ? `<button onclick="ddtStartLevel(2)" style="width:100%;margin-top:8px;padding:13px;border:1px solid rgba(6,214,160,.4);border-radius:11px;background:rgba(6,214,160,.08);color:#06D6A0;font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer" onmouseover="this.style.background='rgba(6,214,160,.18)'" onmouseout="this.style.background='rgba(6,214,160,.08)'">TRY LEVEL 2 — MASTER →</button>` : ''}
      </div>`;
  }

  /* ── Float text ────────────────────────────────────────────────────────── */
  function floatText(debtId, text, color) {
    const card = document.getElementById('card_' + debtId);
    const layer = document.getElementById('ddtFloats');
    if (!card || !layer) return;

    const rect = card.getBoundingClientRect();
    const rootRect = document.getElementById('ddtRoot').getBoundingClientRect();

    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;
      left:${rect.left - rootRect.left + rect.width/2}px;
      top:${rect.top - rootRect.top}px;
      transform:translateX(-50%);
      font-family:Orbitron,sans-serif;font-size:.72rem;
      color:${color};font-weight:700;pointer-events:none;
      text-shadow:0 0 10px ${color};
      animation:ddtFloat 1.2s ease-out forwards;
      white-space:nowrap;
    `;
    el.textContent = text;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  /* ── Road lights update ─────────────────────────────────────────────────── */
  function updateRoadLights() {
    // Redraw road with lit segments
    drawRoadGrid();
  }

  /* ── Hint pill ─────────────────────────────────────────────────────────── */
  function showHintPill(text, color) {
    const pill = document.getElementById('ddtHintPill');
    if (!pill) return;
    pill.textContent = text;
    pill.style.color  = color || 'rgba(255,255,255,.8)';
    pill.style.borderColor = (color || '#4B2D8F') + '80';
    pill.style.display = 'block';
    clearTimeout(G.hintTimer);
    G.hintTimer = setTimeout(() => { pill.style.display = 'none'; }, 3000);
  }

  /* ── Draw star field ───────────────────────────────────────────────────── */
  function drawStars() {
    const canvas = document.getElementById('ddtStars');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.clientWidth  * dpr;
    canvas.height = canvas.clientHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = Math.random() * 1.3 + 0.2;
      const a = Math.random() * 0.7 + 0.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.random()>.5?'167,139,250':'255,209,102'},${a})`;
      ctx.fill();
    }
    // Nebula blobs
    for (let i = 0; i < 4; i++) {
      const grd = ctx.createRadialGradient(
        Math.random()*W, Math.random()*H, 0,
        Math.random()*W, Math.random()*H, 150+Math.random()*200
      );
      grd.addColorStop(0, 'rgba(75,45,143,.08)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ── Draw road grid (plaza visual) ────────────────────────────────────── */
  function drawRoadGrid() {
    const canvas = document.getElementById('ddtRoad');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.clientWidth  * dpr;
    canvas.height = canvas.clientHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = canvas.clientWidth, H = canvas.clientHeight;

    // Perspective grid
    const vp = { x: W / 2, y: H * 0.55 };
    const horizon = H * 0.3;
    const numLines = 12;

    ctx.strokeStyle = 'rgba(75,45,143,.35)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= numLines; i++) {
      const t = i / numLines;
      const bx = t * W;
      ctx.beginPath();
      ctx.moveTo(bx, H);
      ctx.lineTo(vp.x, horizon);
      ctx.stroke();
    }

    // Horizontal depth lines
    for (let j = 1; j <= 8; j++) {
      const y = horizon + (H - horizon) * (j / 8);
      const t = (y - horizon) / (H - horizon);
      ctx.strokeStyle = `rgba(75,45,143,${0.1 + t * 0.25})`;
      ctx.lineWidth = t * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Monument glow at center-ish
    const monGrd = ctx.createRadialGradient(vp.x, horizon, 0, vp.x, horizon, 80);
    monGrd.addColorStop(0, 'rgba(75,45,143,.4)');
    monGrd.addColorStop(0.5, 'rgba(75,45,143,.15)');
    monGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = monGrd;
    ctx.fillRect(0, 0, W, H);

    // Lit road segments for paid debts
    if (G && G.debts) {
      const paidCount = G.debts.filter(d => d.litUp).length;
      if (paidCount > 0) {
        ctx.strokeStyle = `rgba(6,214,160,${0.4 + paidCount*0.1})`;
        ctx.lineWidth   = 3;
        ctx.shadowColor = '#06D6A0';
        ctx.shadowBlur  = 12;
        for (let p = 0; p < paidCount; p++) {
          const t = (p + 1) / (G.debts.length + 1);
          const y = horizon + (H - horizon) * t;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
    }
  }

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  function setTxt(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  }

  /* ── CSS animation injection ───────────────────────────────────────────── */
  (function injectCSS() {
    if (document.getElementById('ddtStyles')) return;
    const s = document.createElement('style');
    s.id = 'ddtStyles';
    s.textContent = `
      @keyframes ddtFloat {
        0%   { opacity:1; transform:translateX(-50%) translateY(0); }
        100% { opacity:0; transform:translateX(-50%) translateY(-60px); }
      }
      @keyframes ddtPulse {
        0%,100% { box-shadow: 0 0 16px rgba(75,45,143,.4); }
        50%      { box-shadow: 0 0 28px rgba(75,45,143,.8); }
      }
      .ddt-coin:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 0 22px rgba(75,45,143,.9),inset 0 1px 2px rgba(255,255,255,.2) !important;
      }
      #ddtEndTurnBtn:hover {
        background: rgba(255,209,102,.28) !important;
        box-shadow: 0 0 20px rgba(255,209,102,.3) !important;
      }
    `;
    document.head.appendChild(s);
  })();

  /* ── Exit ──────────────────────────────────────────────────────────────── */
  window.ddt_plazaExit = function () {
    if (G && G.hintTimer) { clearTimeout(G.hintTimer); G.hintTimer = null; }
    G = null;
    if (window.state) state.viewingWorld = WORLD_ID;
    goTo('hub');
  };

})();
