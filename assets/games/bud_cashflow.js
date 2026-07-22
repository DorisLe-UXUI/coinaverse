/* ════════════════════════════════════════════════════════════════
   CASHFLOW COMMAND — Budgetron Base / Strategist Hub
   Income vs. Expense balance mechanic. Drag tiles onto the
   correct column, monitor the Budget Meter, survive the month.
   Level 1: One paycheck, 5 expenses — calm tutorial.
   Level 2: Variable income + random shock events mid-month.
   Level 3: Freelance-grade income chaos + frequent shocks — the
            full Cashflow Commander gauntlet, fastest clock.
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  let G = null;
  const ACC = '#1a2a4a';           // hub accent — navy
  const GRN = '#22d3a5';           // green glow
  const GOLD = '#f5c842';          // gold / star
  const RED  = '#ef4444';          // danger
  const TILE_W = 130, TILE_H = 54; // tile dimensions (px)

  /* ── Level configs ─────────────────────────────────────────── */
  const LEVELS = [
    {
      name: 'LEARN: Basic Budget',
      desc: 'Allocate your paycheck against five expenses.',
      monthDur: 60,          // seconds of simulated month
      greenBonus: 800,       // pts bonus per second in green
      income: [
        { id:'paycheck', label:'Paycheck', icon:'💼', amt:2800 },
      ],
      expenses: [
        { id:'rent',     label:'Rent',          icon:'🏠', amt:1100 },
        { id:'food',     label:'Food',           icon:'🍔', amt:350  },
        { id:'internet', label:'Internet',       icon:'📡', amt:80   },
        { id:'entert',   label:'Entertainment',  icon:'🎬', amt:120  },
        { id:'shopping', label:'Shopping',       icon:'🛍️', amt:200  },
      ],
      shocks: [],
      shockChance: 0,
    },
    {
      name: 'MASTER: Shock Month',
      desc: 'Variable income + surprise expenses. Stay green!',
      monthDur: 90,
      greenBonus: 1200,
      income: [
        { id:'paycheck',  label:'Paycheck',    icon:'💼', amt:2600 },
        { id:'sidehust',  label:'Side Hustle', icon:'💻', amt:400  },
        { id:'allowance', label:'Allowance',   icon:'🎁', amt:200  },
        { id:'bday',      label:'Birthday $',  icon:'🎂', amt:150  },
      ],
      expenses: [
        { id:'rent',     label:'Rent',          icon:'🏠', amt:1200 },
        { id:'food',     label:'Food',           icon:'🍔', amt:380  },
        { id:'internet', label:'Internet',       icon:'📡', amt:90   },
        { id:'entert',   label:'Entertainment',  icon:'🎬', amt:180  },
        { id:'shopping', label:'Shopping',       icon:'🛍️', amt:250  },
      ],
      shocks: [
        { id:'tire',     label:'Flat Tire!',     icon:'🚗', extraAmt:320,  msg:'Flat tire — emergency repair!' },
        { id:'medical',  label:'Medical Bill!',  icon:'🏥', extraAmt:550,  msg:'Unexpected medical bill!' },
        { id:'laptop',   label:'Broken Laptop!', icon:'💻', extraAmt:480,  msg:'Laptop crashed — must replace!' },
        { id:'pipe',     label:'Leaky Pipe!',    icon:'🪠', extraAmt:290,  msg:'Emergency plumbing repair!' },
        { id:'pet',      label:'Vet Bill!',      icon:'🐾', extraAmt:410,  msg:'Pet emergency vet visit!' },
      ],
      shockChance: 0.35,   // probability each shock slot fires
    },
    {
      name: 'COMMANDER: Freelance Chaos',
      desc: 'Five gig-economy income streams. Frequent shocks. Fast clock!',
      monthDur: 75,
      greenBonus: 1700,
      income: [
        { id:'gig1',      label:'Client Invoice',  icon:'🧾', amt:1450 },
        { id:'gig2',      label:'Design Contract',  icon:'🖌️', amt:900  },
        { id:'gig3',      label:'Tutoring Gig',     icon:'📖', amt:260  },
        { id:'refund',    label:'Tax Refund',       icon:'💵', amt:380  },
        { id:'stipend',   label:'Scholarship',      icon:'🎓', amt:300  },
      ],
      expenses: [
        { id:'rent',      label:'Rent',             icon:'🏠', amt:1350 },
        { id:'food',      label:'Food',              icon:'🍔', amt:410  },
        { id:'internet',  label:'Internet',          icon:'📡', amt:95   },
        { id:'insurance', label:'Insurance',         icon:'🛡️', amt:150  },
        { id:'transit',   label:'Transit Pass',      icon:'🚆', amt:110  },
        { id:'savings',   label:'Savings Transfer',  icon:'🏦', amt:200  },
      ],
      shocks: [
        { id:'brokenphone', label:'Phone Cracked!',  icon:'📱', extraAmt:340, msg:'Phone screen shattered — repair now!' },
        { id:'lateclient',  label:'Client Chargeback!', icon:'⚠️', extraAmt:600, msg:'A client reversed payment — cover the gap!' },
        { id:'taxbill',     label:'Surprise Tax Bill!', icon:'🧮', extraAmt:520, msg:'Quarterly estimated taxes are due!' },
        { id:'apptowed',    label:'Car Towed!',      icon:'🚨', extraAmt:275, msg:'Parked in the wrong zone — towing fee!' },
        { id:'subrenew',    label:'Annual Renewal!', icon:'🔁', extraAmt:190, msg:'A yearly subscription auto-renewed!' },
        { id:'petvet2',     label:'Pet Surgery!',    icon:'🐾', extraAmt:640, msg:'Pet needs emergency surgery!' },
      ],
      shockChance: 0.55,   // higher than level 2 — chaos is the point
    },
  ];

  /* ── Financial literacy gates ──────────────────────────────── */
  const FACTS = [
    ['💼','Track every dollar — income you don\'t count can\'t save you.'],
    ['🟢','Keeping your budget in the green means you own your money.'],
    ['⚡','Shock expenses are real — an emergency fund absorbs them.'],
    ['🧮','Income minus expenses = net cash flow. Keep it positive!'],
    ['📉','Spending more than you earn pushes debt into next month.'],
    ['🏠','Fixed expenses (rent) come first. Build around them.'],
    ['💡','Cutting one want-spend often saves more than cutting ten habits.'],
  ];

  /* ══════════════════════════════════════════════════════════════
     SCREEN REGISTRATION
  ══════════════════════════════════════════════════════════════ */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_bud_cashflow = function(){
    G = null;
    setTimeout(initGame, 40);
    return `
<div id="bcWrap" style="position:absolute;inset:0;background:radial-gradient(130% 95% at 50% -8%,color-mix(in srgb, ${GRN} 14%, #1a1240),#130d32 44%,#0A0429 100%);overflow:hidden;font-family:'Inter',sans-serif;color:#fff;user-select:none;-webkit-user-select:none">
  <!-- cosmic scanline overlay (matches arcade.js .arc-wrap recipe) -->
  <div style="position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(rgba(34,211,165,0) 50%,rgba(34,211,165,.03) 50%);background-size:100% 4px"></div>

  <!-- TOP BAR -->
  <div id="bcTopBar" style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;gap:8px;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(3,4,12,.95),transparent);border-bottom:1px solid rgba(26,42,74,.6)">
    <button id="bcBack" style="padding:6px 12px;border:1px solid rgba(26,42,74,.8);border-radius:8px;background:rgba(26,42,74,.3);color:#93b4e8;font-family:'Orbitron',monospace;font-size:.52rem;letter-spacing:.12em;cursor:pointer;white-space:nowrap">← HUB</button>
    <div style="font-family:'Anton',sans-serif;font-size:.82rem;letter-spacing:.04em;color:#5a7fc0;text-shadow:0 0 14px rgba(90,127,192,.7);flex:1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">⚡ CASHFLOW COMMAND</div>
    <div id="bcScore" style="font-family:'Orbitron',monospace;font-size:.75rem;color:${GOLD};min-width:64px;text-align:right">0 pts</div>
    <div id="bcTimer" style="font-family:'Orbitron',monospace;font-size:.75rem;color:#93b4e8;min-width:42px;text-align:right">60s</div>
  </div>

  <!-- BUDGET METER BAR -->
  <div id="bcMeterWrap" style="position:absolute;top:46px;left:0;right:0;z-index:19;padding:6px 14px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
      <span style="font-family:'Orbitron',monospace;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.45)">BUDGET METER</span>
      <span id="bcNetTxt" style="font-family:'Orbitron',monospace;font-size:.48rem;color:${GRN}">+$0 / mo</span>
    </div>
    <div style="height:10px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid rgba(26,42,74,.5)">
      <div id="bcMeterFill" style="height:100%;width:50%;background:linear-gradient(90deg,${GRN},#6ee7b7);border-radius:5px;transition:width .25s,background .35s;transform-origin:left"></div>
    </div>
  </div>

  <!-- COLUMNS AREA (rendered by JS into canvas + DOM tiles) -->
  <canvas id="bcCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>

  <!-- TILE LAYER (draggable DOM tiles rendered over canvas) -->
  <div id="bcTileLayer" style="position:absolute;inset:0;pointer-events:none;z-index:10"></div>

  <!-- SHOCK BANNER -->
  <div id="bcShockBanner" style="position:absolute;top:90px;left:50%;transform:translateX(-50%);z-index:30;display:none;background:linear-gradient(135deg,rgba(239,68,68,.92),rgba(180,20,20,.92));border:1px solid rgba(239,68,68,.6);border-radius:12px;padding:10px 20px;font-family:'Orbitron',monospace;font-size:.62rem;letter-spacing:.12em;color:#fff;text-align:center;max-width:80vw;box-shadow:0 0 30px rgba(239,68,68,.5)"></div>

  <!-- FACT GATE -->
  <div id="bcGate" style="position:absolute;inset:0;z-index:40;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.88);backdrop-filter:blur(6px)"></div>

  <!-- END OVERLAY -->
  <div id="bcOver" style="position:absolute;inset:0;z-index:50;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.88);backdrop-filter:blur(5px)"></div>

</div>`;
  };

  /* ══════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════ */
  function initGame(){
    const wrap = document.getElementById('bcWrap');
    if(!wrap){ return; }
    resetGame(0);
  }

  function resetGame(levelIdx){
    // cancel previous RAF
    if(G && G._raf){ cancelAnimationFrame(G._raf); }

    const lv = LEVELS[levelIdx];
    G = {
      phase: 'play',
      level: levelIdx,
      lv,
      score: 0,
      greenTime: 0,      // accumulated seconds budget was green
      redTime: 0,
      month: lv.monthDur,
      elapsed: 0,
      last: 0,
      tiles: [],         // all tile objects {id, type, label, icon, amt, placed, col, el, x, y, dragging}
      placedIncome: 0,   // total income allocated
      placedExpense: 0,  // total expense allocated
      shockActive: [],   // active shock tiles
      shockScheduled: false,
      shockTimer: 0,
      shockDelay: (lv.shocks && lv.shocks.length > 0) ? (10 + Math.random()*(levelIdx>=2?8:12)) : 9999,
      shocksPool: [...lv.shocks].sort(()=>Math.random()-.5),
      shockIdx: 0,
      gateEvery: 22,
      gateT: 22,
      gateIdx: 0,
      redFlash: 0,
      streak: 0,           // consecutive correct drops (cosmetic only — no score math changes)
      streakFlash: 0,
      ambientParticles: [],// gentle drifting motes so idle canvas areas aren't dead-empty
      dropParts: [],       // burst particles fired on correct/incorrect tile drops
      _raf: null,
    };

    buildTiles(lv);
    renderColumns();
    startLoop();

    const back = document.getElementById('bcBack');
    if(back){ back.onclick = window.bud_cashflowExit; }

    updateHUD();
  }

  /* ── Build draggable tile DOM elements ───────────────────────── */
  function buildTiles(lv){
    const layer = document.getElementById('bcTileLayer');
    if(!layer) return;
    layer.innerHTML = '';
    G.tiles = [];

    const allItems = [
      ...lv.income.map(i => ({...i, type:'income'})),
      ...lv.expenses.map(i => ({...i, type:'expense'})),
    ];

    // Layout: stack tiles vertically in the TRAY zone (left third)
    const W = layer.clientWidth || window.innerWidth;
    const H = layer.clientHeight || window.innerHeight;
    const trayX = Math.round(W * 0.02);
    const startY = Math.round(H * 0.17);
    const gapY = Math.round((H * 0.78) / Math.max(allItems.length, 1));
    const clampedGapY = Math.min(gapY, TILE_H + 10);

    allItems.forEach((item, idx) => {
      const tile = {
        ...item,
        placed: false,
        col: null,      // 'income' | 'expense' | null
        x: trayX,
        y: startY + idx * clampedGapY,
        dragging: false,
        el: null,
        ox: 0, oy: 0,  // drag offset
      };
      G.tiles.push(tile);
      tile.el = createTileEl(tile);
      layer.appendChild(tile.el);
      positionTile(tile);
      attachDrag(tile);
    });
  }

  function createTileEl(tile){
    const el = document.createElement('div');
    el.dataset.id = tile.id;
    el.style.cssText = `
      position:absolute;
      width:${TILE_W}px;height:${TILE_H}px;
      border-radius:10px;
      display:flex;align-items:center;gap:8px;padding:0 10px;
      pointer-events:all;cursor:grab;
      border:1px solid ${tile.type==='income'?'rgba(34,211,165,.35)':'rgba(239,68,68,.35)'};
      background:${tile.type==='income'?'rgba(34,211,165,.12)':'rgba(239,68,68,.10)'};
      box-shadow:0 0 10px ${tile.type==='income'?'rgba(34,211,165,.18)':'rgba(239,68,68,.12)'};
      transition:box-shadow .2s,transform .12s;
      touch-action:none;user-select:none;-webkit-user-select:none;
      z-index:10;
    `;
    el.innerHTML = `
      <span style="font-size:1.1rem;flex-shrink:0">${tile.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Inter',sans-serif;font-size:.62rem;font-weight:700;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tile.label}</div>
        <div style="font-family:'Orbitron',monospace;font-size:.6rem;color:${tile.type==='income'?GRN:RED};font-weight:900">${tile.type==='income'?'+':'-'}$${tile.amt}</div>
      </div>
    `;
    return el;
  }

  function positionTile(tile){
    if(!tile.el) return;
    tile.el.style.left = tile.x + 'px';
    tile.el.style.top  = tile.y + 'px';
  }

  /* ── Drag logic ─────────────────────────────────────────────── */
  function attachDrag(tile){
    const el = tile.el;
    let startX, startY, startTileX, startTileY;

    function onStart(ex, ey){
      if(tile.placed) return; // already placed, lock
      tile.dragging = true;
      el.style.cursor = 'grabbing';
      el.style.zIndex = '99';
      el.style.transform = 'scale(1.07)';
      el.style.boxShadow = `0 0 22px ${tile.type==='income'?'rgba(34,211,165,.55)':'rgba(239,68,68,.55)'}`;
      startX = ex; startY = ey;
      startTileX = tile.x; startTileY = tile.y;
    }
    function onMove(ex, ey){
      if(!tile.dragging) return;
      tile.x = startTileX + (ex - startX);
      tile.y = startTileY + (ey - startY);
      positionTile(tile);
    }
    function onEnd(){
      if(!tile.dragging) return;
      tile.dragging = false;
      el.style.cursor = 'grab';
      el.style.transform = '';
      el.style.zIndex = '10';
      tryDrop(tile);
    }

    // Mouse — store handlers so they can be removed on exit
    const mmHandler = e => { if(tile.dragging) onMove(e.clientX, e.clientY); };
    const muHandler = () => { if(tile.dragging) onEnd(); };
    tile._mmHandler = mmHandler;
    tile._muHandler = muHandler;
    el.addEventListener('mousedown', e => { e.preventDefault(); onStart(e.clientX, e.clientY); });
    window.addEventListener('mousemove', mmHandler);
    window.addEventListener('mouseup', muHandler);

    // Touch
    el.addEventListener('touchstart', e => { e.preventDefault(); const t=e.touches[0]; onStart(t.clientX, t.clientY); }, {passive:false});
    el.addEventListener('touchmove',  e => { e.preventDefault(); const t=e.touches[0]; onMove(t.clientX, t.clientY); }, {passive:false});
    el.addEventListener('touchend',   e => { e.preventDefault(); onEnd(); }, {passive:false});
  }

  /* ── Drop detection ─────────────────────────────────────────── */
  function tryDrop(tile){
    const layer = document.getElementById('bcTileLayer');
    if(!layer) return;
    const W = layer.clientWidth || window.innerWidth;

    // Drop zones (columns drawn on canvas):
    //   Income column:  x 40%..60% of W (center-ish left)
    //   Expense column: x 65%..85% of W (center-ish right)
    const cx = tile.x + TILE_W/2;
    const incomeZoneL = W * 0.38, incomeZoneR = W * 0.62;
    const expenseZoneL = W * 0.63, expenseZoneR = W * 0.87;

    let droppedIn = null;
    if(cx >= incomeZoneL && cx <= incomeZoneR) droppedIn = 'income';
    else if(cx >= expenseZoneL && cx <= expenseZoneR) droppedIn = 'expense';

    if(droppedIn){
      const correct = (tile.type === droppedIn);
      snapTile(tile, droppedIn, correct);
    } else {
      // bounce back to tray
      snapBack(tile);
    }
  }

  function snapTile(tile, col, correct){
    const layer = document.getElementById('bcTileLayer');
    if(!layer) return;
    const W = layer.clientWidth || window.innerWidth;
    const H = layer.clientHeight || window.innerHeight;

    if(correct){
      tile.placed = true;
      tile.col = col;
      tile.el.style.cursor = 'default';
      tile.el.style.opacity = '0.92';

      // Snap into column stack
      const colTiles = G.tiles.filter(t => t.placed && t.col === col);
      const colX = col === 'income' ? W*0.39 : W*0.64;
      const startY = H * 0.18;
      const idx = colTiles.length - 1;
      tile.x = colX;
      tile.y = startY + idx * (TILE_H + 8);
      positionTile(tile);

      // Visual: glow
      tile.el.style.boxShadow = `0 0 16px ${col==='income'?'rgba(34,211,165,.6)':'rgba(239,68,68,.4)'}`;
      tile.el.style.border = `1px solid ${col==='income'?'rgba(34,211,165,.7)':'rgba(239,68,68,.6)'}`;

      // Update net flow
      if(col === 'income') G.placedIncome += tile.amt;
      else G.placedExpense += tile.amt;

      G.score += 80;
      spawnFloat(tile.el, `+80`, GRN);
      spawnDropParticles(tile.x + TILE_W / 2, tile.y + TILE_H / 2, tile.type === 'income' ? GRN : RED, 10);
      bumpStreak();
      updateHUD();
    } else {
      // Wrong column — wiggle and snap back
      tile.el.style.transform = 'translateX(-10px)';
      setTimeout(()=>{ if(tile.el){ tile.el.style.transform = 'translateX(10px)'; } }, 80);
      setTimeout(()=>{ if(tile.el){ tile.el.style.transform = ''; } }, 160);
      G.score = Math.max(0, G.score - 20);
      spawnFloat(tile.el, '-20', RED);
      G.streak = 0;
      G.redFlash = Math.max(G.redFlash, 0.5);
      snapBack(tile);
      updateHUD();
    }
  }

  /* ── Cosmetic drop streak (never changes score math beyond the same
     +80/tile that already existed — just celebrates doing it repeatedly) ── */
  const STREAK_MILE = [3, 5, 8];
  function bumpStreak(){
    if(!G) return;
    G.streak = (G.streak||0) + 1;
    if(STREAK_MILE.indexOf(G.streak) >= 0){
      G.streakFlash = 1;
      spawnStreakBanner(G.streak);
    }
  }

  function spawnStreakBanner(n){
    const wrap = document.getElementById('bcWrap');
    if(!wrap) return;
    const div = document.createElement('div');
    div.textContent = `🔥 ${n} STREAK!`;
    div.style.cssText = `
      position:absolute;top:34%;left:50%;transform:translate(-50%,-50%) scale(.7);
      color:${GOLD};font-family:'Orbitron',monospace;font-size:1.1rem;font-weight:900;
      letter-spacing:.1em;text-shadow:0 0 18px rgba(245,200,66,.8);
      pointer-events:none;z-index:210;
      animation:bcStreakPop .9s cubic-bezier(.2,1.6,.4,1) forwards;
    `;
    if(!document.getElementById('bcStreakStyle')){
      const s = document.createElement('style');
      s.id = 'bcStreakStyle';
      s.textContent = '@keyframes bcStreakPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}18%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}30%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-60%) scale(1.05)}}';
      document.head.appendChild(s);
    }
    wrap.appendChild(div);
    setTimeout(()=>{ if(div.parentNode) div.parentNode.removeChild(div); }, 950);
  }

  function snapBack(tile){
    // Return to original tray position
    const layer = document.getElementById('bcTileLayer');
    if(!layer) return;
    const W = layer.clientWidth || window.innerWidth;
    const H = layer.clientHeight || window.innerHeight;
    const trayX = Math.round(W * 0.02);

    tile.el.style.transition = 'left .25s, top .25s';
    tile.x = trayX;
    positionTile(tile);
    setTimeout(()=>{ if(tile.el) tile.el.style.transition=''; }, 280);
  }

  /* ── Canvas background render ───────────────────────────────── */
  function renderColumns(){
    const cv = document.getElementById('bcCanvas');
    if(!cv) return;
    const ctx = cv.getContext('2d');

    function resize(){
      cv.width  = cv.clientWidth  * devicePixelRatio;
      cv.height = cv.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      drawBg(ctx, cv.clientWidth, cv.clientHeight);
    }
    resize();
    G._resizeFn = resize;
    window.addEventListener('resize', resize);
  }

  function drawBg(ctx, W, H){
    // Dark bg
    ctx.fillStyle = '#03040c';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(26,42,74,.3)';
    ctx.lineWidth = 1;
    for(let y=70; y<H; y+=40){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    for(let x=0; x<W; x+=40){ ctx.beginPath(); ctx.moveTo(x,70); ctx.lineTo(x,H); ctx.stroke(); }

    const colW = Math.min(W*0.22, 200);
    const colH = H - 100;
    const colY = 80;

    // TRAY zone label
    ctx.font = "700 9px 'Orbitron', monospace";
    ctx.letterSpacing = '0.12em';
    ctx.fillStyle = 'rgba(147,180,232,.5)';
    ctx.textAlign = 'left';
    ctx.fillText('ALLOCATE →', W*0.02, 100);

    // INCOME column
    const incX = W * 0.39;
    drawColumn(ctx, incX, colY, colW, colH, GRN, 'INCOME', '💚');

    // EXPENSE column
    const expX = W * 0.64;
    drawColumn(ctx, expX, colY, colW, colH, RED, 'EXPENSES', '🔴');

    // REACTOR panel (far right)
    drawReactor(ctx, W, H);

    // Conveyor belt (decorative)
    drawConveyor(ctx, W, H);
  }

  function drawColumn(ctx, x, y, w, h, color, label, icon){
    // Glow outer
    const grd = ctx.createLinearGradient(x, y, x+w, y);
    grd.addColorStop(0, hexA(color, 0.0));
    grd.addColorStop(0.5, hexA(color, 0.06));
    grd.addColorStop(1, hexA(color, 0.0));
    ctx.fillStyle = grd;
    ctx.fillRect(x, y, w, h);

    // Border
    ctx.strokeStyle = hexA(color, 0.35);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4,4]);
    roundRect(ctx, x, y, w, h, 12);
    ctx.stroke();
    ctx.setLineDash([]);

    // Header
    ctx.fillStyle = hexA(color, 0.18);
    roundRect(ctx, x, y, w, 34, 12);
    ctx.fill();

    ctx.font = "700 10px 'Orbitron', monospace";
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w/2, y + 14);
    ctx.font = '10px sans-serif';
    ctx.fillText(icon, x + w/2, y + 28);

    ctx.textAlign = 'left';
  }

  function drawReactor(ctx, W, H){
    // Cash Flow Reactor panel on the right
    const rx = W * 0.875;
    const ry = H * 0.16;
    const rw = W * 0.115;
    const rh = H * 0.72;

    ctx.fillStyle = 'rgba(26,42,74,.25)';
    roundRect(ctx, rx, ry, rw, rh, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(26,42,74,.7)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, rx, ry, rw, rh, 14);
    ctx.stroke();

    ctx.font = "700 7.5px 'Orbitron', monospace";
    ctx.fillStyle = '#5a7fc0';
    ctx.textAlign = 'center';
    ctx.fillText('REACTOR', rx + rw/2, ry + 16);

    // Reactor core circle
    const cx2 = rx + rw/2, cy2 = ry + rh*0.42;
    const r = rw * 0.36;
    const grd2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r);
    grd2.addColorStop(0, 'rgba(34,211,165,.45)');
    grd2.addColorStop(0.5, 'rgba(34,211,165,.12)');
    grd2.addColorStop(1, 'rgba(34,211,165,.0)');
    ctx.fillStyle = grd2;
    ctx.beginPath();
    ctx.arc(cx2, cy2, r, 0, Math.PI*2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(34,211,165,.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx2, cy2, r, 0, Math.PI*2);
    ctx.stroke();

    ctx.font = "700 8px 'Orbitron', monospace";
    ctx.fillStyle = 'rgba(34,211,165,.6)';
    ctx.fillText('NET', cx2, cy2 + 4);

    ctx.textAlign = 'left';
  }

  function drawConveyor(ctx, W, H){
    // Decorative conveyor belt at bottom
    const beltY = H * 0.92;
    const beltH = 18;
    ctx.fillStyle = 'rgba(26,42,74,.3)';
    ctx.fillRect(0, beltY, W, beltH);
    ctx.strokeStyle = 'rgba(26,42,74,.6)';
    ctx.lineWidth = 1;
    for(let x=-((Date.now()/30)%30); x<W; x+=30){
      ctx.beginPath(); ctx.moveTo(x, beltY); ctx.lineTo(x, beltY+beltH); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(147,180,232,.25)';
    ctx.font = "700 7px 'Orbitron', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('CASHFLOW CONVEYOR ▶▶▶', W/2, beltY+12);
    ctx.textAlign = 'left';
  }

  /* ── Ambient data-motes ── purely decorative drifting glow specks so
     the large empty grid regions (esp. Level 1's calm 60s with zero
     shocks) never read as a static/dead screen. Colors match the
     existing navy/green/gold palette already used across the HUD. */
  const AMBIENT_COLORS = [GRN, GOLD, '#5a7fc0'];
  function ensureAmbientParticles(W, H){
    if(G.ambientParticles.length > 0) return;
    const count = Math.round(Math.max(W,H) / 55); // scales gently with screen size
    for(let i=0;i<count;i++){
      G.ambientParticles.push(spawnAmbientParticle(W, H, true));
    }
  }
  function spawnAmbientParticle(W, H, randomY){
    return {
      x: Math.random()*W,
      y: randomY ? Math.random()*H : H + 10,
      vy: -(6 + Math.random()*10),
      vx: (Math.random()-0.5)*4,
      r: 1 + Math.random()*1.6,
      color: AMBIENT_COLORS[Math.floor(Math.random()*AMBIENT_COLORS.length)],
      alpha: 0.15 + Math.random()*0.25,
      phase: Math.random()*Math.PI*2,
    };
  }
  function updateAmbientParticles(dt, W, H){
    ensureAmbientParticles(W, H);
    for(const p of G.ambientParticles){
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      p.phase += dt;
      if(p.y < -10){
        Object.assign(p, spawnAmbientParticle(W, H, false));
      }
    }
  }
  function drawAmbientParticles(ctx){
    for(const p of G.ambientParticles){
      const flicker = 0.7 + 0.3*Math.sin(p.phase*1.6);
      ctx.beginPath();
      ctx.fillStyle = hexA(p.color, p.alpha * flicker);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
  }

  /* ── Drop-feedback burst particles — fired on every correct tile drop so a
     good decision reads as a small celebratory pop, not just a floating number ── */
  function spawnDropParticles(x, y, color, n){
    for(let i=0;i<n;i++){
      const a = Math.random()*Math.PI*2, spd = 40 + Math.random()*90;
      G.dropParts.push({ x, y, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd-40, r:2+Math.random()*2.5, life:0.5+Math.random()*0.35, color });
    }
  }
  function updateDropParticles(dt){
    for(const p of G.dropParts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=180*dt; p.life-=dt; }
    G.dropParts = G.dropParts.filter(p=>p.life>0);
  }
  function drawDropParticles(ctx){
    for(const p of G.dropParts){
      ctx.globalAlpha = Math.max(0, p.life*2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  /* ── Budget meter HUD ───────────────────────────────────────── */
  function updateHUD(){
    const net = G.placedIncome - G.placedExpense;
    const netEl = document.getElementById('bcNetTxt');
    const meterEl = document.getElementById('bcMeterFill');

    if(netEl){
      netEl.textContent = (net >= 0 ? '+' : '') + '$' + net.toLocaleString() + ' / mo';
      netEl.style.color = net >= 0 ? GRN : RED;
    }

    // Meter: center = 0, full green = all income allocated, full red = overspent
    // 0..50% = negative (red), 50..100% = positive (green)
    const totalIncome = G.lv.income.reduce((s,i)=>s+i.amt,0) + G.shockActive.reduce((s,sh)=>s+sh.extraAmt,0);
    // clamp to -totalIncome .. +totalIncome
    const clamp = Math.max(-totalIncome, Math.min(totalIncome, net));
    const pct = 50 + (clamp / Math.max(totalIncome,1)) * 50;

    if(meterEl){
      meterEl.style.width = pct + '%';
      const isGreen = net >= 0;
      meterEl.style.background = isGreen
        ? `linear-gradient(90deg, ${GRN}, #6ee7b7)`
        : `linear-gradient(90deg, #7f1d1d, ${RED})`;
    }

    const scoreEl = document.getElementById('bcScore');
    if(scoreEl) scoreEl.textContent = G.score.toLocaleString() + ' pts';
  }

  /* ── Main loop ──────────────────────────────────────────────── */
  function startLoop(){
    G.last = performance.now();
    function tick(now){
      if(!G || G.phase !== 'play'){ return; }
      G._raf = requestAnimationFrame(tick);

      const dt = Math.min((now - G.last) / 1000, 0.1);
      G.last = now;
      G.elapsed += dt;
      G.month -= dt;

      // Redraw canvas bg periodically (conveyor animation)
      const cv = document.getElementById('bcCanvas');
      if(cv){
        const ctx = cv.getContext('2d');
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        drawBg(ctx, cv.clientWidth, cv.clientHeight);
        updateAmbientParticles(dt, cv.clientWidth, cv.clientHeight);
        drawAmbientParticles(ctx);
        updateDropParticles(dt);
        drawDropParticles(ctx);
        drawReactorLive(ctx, cv.clientWidth, cv.clientHeight);
        if(G.streakFlash > 0){
          G.streakFlash -= dt * 1.2;
          ctx.fillStyle = `rgba(245,200,66,${Math.max(0,G.streakFlash) * 0.10})`;
          ctx.fillRect(0, 0, cv.clientWidth, cv.clientHeight);
        }
      }

      // Accumulate green/red time only after all income tiles placed
      const allPlaced = G.tiles.filter(t=>t.type==='income').every(t=>t.placed);
      if(allPlaced){
        const net = G.placedIncome - G.placedExpense;
        if(net >= 0){
          G.greenTime += dt;
          G.score += Math.round(G.lv.greenBonus * dt);
        } else {
          G.redTime += dt;
          G.redFlash = Math.min(1, G.redFlash + dt * 3);
        }
      }
      if(G.redFlash > 0) G.redFlash -= dt * 2;

      // Red flash overlay
      if(cv){
        const ctx = cv.getContext('2d');
        if(G.redFlash > 0){
          ctx.fillStyle = `rgba(239,68,68,${G.redFlash * 0.12})`;
          ctx.fillRect(0, 0, cv.clientWidth, cv.clientHeight);
        }
      }

      // Timer
      const timerEl = document.getElementById('bcTimer');
      if(timerEl) timerEl.textContent = Math.max(0,Math.ceil(G.month)) + 's';

      // Shock events (any level with shocks configured — level 2 and level 3)
      if(G.lv.shocks.length > 0 && G.shockIdx < G.lv.shocks.length * G.lv.shockChance + 1){
        G.shockTimer += dt;
        if(G.shockTimer >= G.shockDelay){
          triggerShock();
          G.shockTimer = 0;
          G.shockDelay = G.level>=2 ? (10 + Math.random()*14) : (15 + Math.random()*20);
        }
      }

      // Fact gate
      G.gateT -= dt;
      if(G.gateT <= 0){ openGate(); return; }

      // Score update
      updateHUD();

      // Time up
      if(G.month <= 0){ endGame(); return; }

      // Lose: expenses exceed income by too much for too long
      const net2 = G.placedIncome - G.placedExpense;
      if(G.redTime > 20 && net2 < 0){
        endGame(true); // forced loss
        return;
      }
    }
    G._raf = requestAnimationFrame(tick);
  }

  function drawReactorLive(ctx, W, H){
    const rx = W * 0.875;
    const ry = H * 0.16;
    const rw = W * 0.115;
    const rh = H * 0.72;
    const cx2 = rx + rw/2;
    const cy2 = ry + rh*0.42;

    const net = G.placedIncome - G.placedExpense;
    const isGreen = net >= 0;
    const color = isGreen ? GRN : RED;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now()/600);

    // Pulsing core
    const r = rw * (0.32 + pulse * 0.06);
    const grd2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r);
    grd2.addColorStop(0, hexA(color, 0.55 + pulse*0.2));
    grd2.addColorStop(0.5, hexA(color, 0.12));
    grd2.addColorStop(1, hexA(color, 0.0));
    ctx.fillStyle = grd2;
    ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = hexA(color, 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI*2); ctx.stroke();

    // Net value inside
    ctx.font = "900 8px 'Orbitron', monospace";
    ctx.fillStyle = isGreen ? GRN : RED;
    ctx.textAlign = 'center';
    const netStr = (isGreen?'+':'') + '$' + Math.abs(net);
    ctx.fillText(netStr, cx2, cy2 + 3);

    // Score below reactor
    ctx.font = "700 7px 'Orbitron', monospace";
    ctx.fillStyle = '#5a7fc0';
    ctx.fillText('SCORE', cx2, ry + rh * 0.72);
    ctx.font = "900 11px 'Orbitron', monospace";
    ctx.fillStyle = GOLD;
    ctx.fillText(G.score.toLocaleString(), cx2, ry + rh * 0.82);

    // Green time bar
    const barH = rh * 0.12;
    const barY = ry + rh - barH - 8;
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    roundRect(ctx, rx+6, barY, rw-12, barH, 4); ctx.fill();
    const greenPct = Math.min(1, G.greenTime / G.lv.monthDur);
    ctx.fillStyle = GRN;
    roundRect(ctx, rx+6, barY, Math.max(0,(rw-12)*greenPct), barH, 4); ctx.fill();
    ctx.font = "600 6px 'Orbitron', monospace";
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fillText('GREEN TIME', cx2, barY - 3);

    ctx.textAlign = 'left';
  }

  /* ── Shock events (any level with a shocks pool configured) ──── */
  function triggerShock(){
    const lv = G.lv;
    if(!lv.shocks || lv.shocks.length === 0) return;
    // Pick a random shock not yet fired
    const unfire = lv.shocks.filter(s => !G.shockActive.find(a=>a.id===s.id));
    if(unfire.length === 0) return;
    if(Math.random() > lv.shockChance) return;

    const shock = unfire[Math.floor(Math.random()*unfire.length)];
    G.shockActive.push(shock);

    // Inject shock as expense tile
    injectShockTile(shock);

    // Show banner
    const banner = document.getElementById('bcShockBanner');
    if(banner){
      banner.textContent = shock.icon + ' ' + shock.msg + ' (-$' + shock.extraAmt + ')';
      banner.style.display = 'block';
      banner.style.animation = 'bcShockBannerPop .3s ease';
      setTimeout(()=>{ if(banner) banner.style.display='none'; }, 3500);
    }
    if(!document.getElementById('bcShockBannerStyle')){
      const s = document.createElement('style');
      s.id = 'bcShockBannerStyle';
      s.textContent = '@keyframes bcShockBannerPop{0%{transform:translateX(-50%) scale(.85);opacity:0}100%{transform:translateX(-50%) scale(1);opacity:1}}';
      document.head.appendChild(s);
    }

    G.score = Math.max(0, G.score - 30);
    G.streak = 0;
    G.redFlash = Math.max(G.redFlash, 0.6);
    spawnFloat(banner || document.getElementById('bcWrap'), '-30', RED);
  }

  function injectShockTile(shock){
    const layer = document.getElementById('bcTileLayer');
    if(!layer) return;
    const W = layer.clientWidth || window.innerWidth;
    const H = layer.clientHeight || window.innerHeight;

    // Count existing tray tiles
    const trayTiles = G.tiles.filter(t => !t.placed);
    const trayX = W * 0.02;
    const startY = H * 0.17;
    const idx = trayTiles.length;
    const clampedGapY = Math.min((H*0.78/Math.max(G.tiles.length,1)), TILE_H+10);

    const tile = {
      id: shock.id,
      type: 'expense',
      label: shock.label,
      icon: shock.icon,
      amt: shock.extraAmt,
      placed: false,
      col: null,
      x: trayX,
      y: Math.min(startY + idx*clampedGapY, H*0.82),
      dragging: false,
      el: null,
      shock: true,
    };

    G.tiles.push(tile);
    tile.el = createTileEl(tile);
    // Mark shock visually
    tile.el.style.background = 'rgba(239,68,68,.22)';
    tile.el.style.border = '1.5px solid rgba(239,68,68,.7)';
    tile.el.style.boxShadow = '0 0 18px rgba(239,68,68,.4)';
    tile.el.style.animation = 'bcShockPulse .4s ease 3';

    // Add pulse keyframe if not present
    if(!document.getElementById('bcShockStyle')){
      const s = document.createElement('style');
      s.id = 'bcShockStyle';
      s.textContent = '@keyframes bcShockPulse{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}';
      document.head.appendChild(s);
    }

    layer.appendChild(tile.el);
    positionTile(tile);
    attachDrag(tile);
    // shock tile not yet placed — budget updates when user drags it to expense column
  }

  /* ── Floating score text ────────────────────────────────────── */
  function spawnFloat(el, text, color){
    if(!el) return;
    const rect = el.getBoundingClientRect();
    const wrap = document.getElementById('bcWrap');
    if(!wrap) return;
    const wRect = wrap.getBoundingClientRect();

    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText = `
      position:absolute;
      left:${rect.left - wRect.left + TILE_W/2}px;
      top:${rect.top - wRect.top - 10}px;
      color:${color};
      font-family:'Orbitron',monospace;
      font-size:.72rem;
      font-weight:900;
      pointer-events:none;
      z-index:200;
      animation:bcFloat .8s ease forwards;
    `;
    if(!document.getElementById('bcFloatStyle')){
      const s = document.createElement('style');
      s.id = 'bcFloatStyle';
      s.textContent = '@keyframes bcFloat{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-40px)}}';
      document.head.appendChild(s);
    }
    wrap.appendChild(div);
    setTimeout(()=>{ if(div.parentNode) div.parentNode.removeChild(div); }, 850);
  }

  /* ── Knowledge gate ─────────────────────────────────────────── */
  function openGate(){
    if(!G || G.phase!=='play') return;
    G.phase = 'gate';
    const f = FACTS[G.gateIdx % FACTS.length];
    G.gateIdx++;

    const o = document.getElementById('bcGate');
    if(!o){ G.phase='play'; G.gateT=G.gateEvery; return; }
    o.style.display = 'flex';
    o.innerHTML = `
      <div style="max-width:440px;text-align:center;padding:32px 28px;border:1px solid ${ACC};border-radius:22px;background:linear-gradient(160deg,rgba(10,18,40,.97),rgba(3,4,12,.97));box-shadow:0 0 60px rgba(26,42,74,.8);animation:bcGateIn .35s ease">
        <style>@keyframes bcGateIn{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}</style>
        <div style="font-family:'Orbitron',monospace;font-size:.48rem;letter-spacing:.18em;color:#5a7fc0;margin-bottom:10px">⚡ COMMAND INTEL</div>
        <div style="font-size:2.5rem;margin-bottom:10px">${f[0]}</div>
        <p style="font-size:.95rem;line-height:1.6;color:#e2e8f0;margin:0 0 20px">${f[1]}</p>
        <button id="bcGateBtn" style="padding:13px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#1a2a4a,#2a4a8a);color:#fff;font-family:'Orbitron',monospace;font-size:.68rem;letter-spacing:.12em;font-weight:900;cursor:pointer;border:1px solid rgba(90,127,192,.5)">GOT IT → RESUME</button>
      </div>`;
    document.getElementById('bcGateBtn').onclick = closeGate;
  }

  function closeGate(){
    if(!G) return;
    G.gateT = G.gateEvery;
    G.phase = 'play';
    const o = document.getElementById('bcGate');
    if(o){ o.style.display='none'; o.innerHTML=''; }
    G.last = performance.now();
    // Cancel any stale RAF before starting a fresh loop to avoid double-loop
    if(G._raf){ cancelAnimationFrame(G._raf); G._raf = null; }
    startLoop();
  }

  /* ── End game ───────────────────────────────────────────────── */
  function endGame(forceLose){
    if(!G || G.phase === 'over') return;
    G.phase = 'over';
    if(G._raf){ cancelAnimationFrame(G._raf); G._raf = null; }

    const net = G.placedIncome - G.placedExpense;
    const win = !forceLose && net >= 0;
    const totalTime = G.lv.monthDur;
    const greenPct = G.greenTime / Math.max(totalTime, 1);
    const allAllocated = G.tiles.every(t => t.placed);

    // Star rating
    let stars = 1;
    if(win){
      if(greenPct >= 0.75 && allAllocated && G.score >= 2000) stars = 3;
      else if(greenPct >= 0.45 && G.score >= 1000) stars = 2;
    }

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bud_cashflow', { level: G.level + 1, stars, badge: 'Budget Boss', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    // Award
    if(window.state){
      state.gamesDone = state.gamesDone || {};
      state.gamesDone['strategist:bud_cashflow'] = 1;
      if(window.budgetDelta) budgetDelta(net);
    }

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3-stars);
    const lesson = 'Income minus expenses equals your real financial freedom. Every dollar you keep in the green is a dollar working for your future — spending more than you earn, even once, sets you back further than you think.';

    const o = document.getElementById('bcOver');
    if(!o) return;
    o.style.display = 'flex';
    const confettiHtml = win ? Array.from({ length: 16 }, (_, i) => {
      const emo = ['✦','●','▲','★'][i % 4], col = [GRN, GOLD, '#a855f7', '#14b8a6'][i % 4];
      return `<span style="position:absolute;top:-24px;left:${4 + Math.random() * 92}%;font-size:1.3rem;color:${col};animation:bcConfetti 1.7s ease-in ${(Math.random() * .5).toFixed(2)}s forwards;pointer-events:none">${emo}</span>`;
    }).join('') : '';
    o.innerHTML = `
      ${confettiHtml}
      <div style="max-width:460px;width:90%;text-align:center;padding:32px 28px;border:1px solid ${win?GOLD:RED};border-radius:22px;background:linear-gradient(160deg,rgba(10,18,40,.98),rgba(3,4,12,.98));box-shadow:0 0 70px ${win?'rgba(245,200,66,.35)':'rgba(239,68,68,.35)'};animation:bcOver .4s ease;position:relative;overflow:hidden">
        <style>@keyframes bcOver{0%{transform:scale(.9);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes bcConfetti{0%{transform:translateY(-30px) rotate(0deg);opacity:1}100%{transform:translateY(420px) rotate(360deg);opacity:0}}
        @keyframes bcShine{to{background-position:-20% 0}}</style>
        ${win ? `<div style="position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.16) 48%,transparent 66%);background-size:220% 100%;background-position:120% 0;animation:bcShine 2.2s ease-in-out .3s 1;pointer-events:none"></div>` : ''}
        <div style="font-size:2.8rem;margin-bottom:6px">${win?'🏆':'💸'}</div>
        <div style="font-family:'Anton',sans-serif;font-size:1.15rem;letter-spacing:.06em;color:${win?GOLD:RED};text-shadow:0 0 14px ${win?'rgba(245,200,66,.6)':'rgba(239,68,68,.6)'};margin-bottom:8px">${win?'MONTH SURVIVED!':'BUDGET BUSTED!'}</div>
        <div style="font-size:1.8rem;margin:6px 0;letter-spacing:4px">${starStr}</div>
        <div style="font-family:'Anton',sans-serif;font-size:1.7rem;color:${GOLD};margin:8px 0">${G.score.toLocaleString()} pts</div>
        <div style="display:flex;gap:8px;justify-content:center;margin:10px 0 14px;flex-wrap:wrap">
          <div style="background:rgba(26,42,74,.5);border:1px solid rgba(26,42,74,.8);border-radius:8px;padding:6px 12px;font-family:'Orbitron',monospace;font-size:.48rem;color:#93b4e8">NET FLOW<br><span style="color:${net>=0?GRN:RED};font-size:.75rem">${net>=0?'+':''}$${net}</span></div>
          <div style="background:rgba(26,42,74,.5);border:1px solid rgba(26,42,74,.8);border-radius:8px;padding:6px 12px;font-family:'Orbitron',monospace;font-size:.48rem;color:#93b4e8">GREEN TIME<br><span style="color:${GRN};font-size:.75rem">${Math.round(greenPct*100)}%</span></div>
          <div style="background:rgba(26,42,74,.5);border:1px solid rgba(26,42,74,.8);border-radius:8px;padding:6px 12px;font-family:'Orbitron',monospace;font-size:.48rem;color:#93b4e8">EARNED<br><span style="color:${GOLD};font-size:.75rem">+${coins} 🪙</span></div>
        </div>
        <p style="font-size:.78rem;line-height:1.6;color:rgba(255,255,255,.7);margin:0 0 20px;font-style:italic">"${lesson}"</p>
        ${win && G.level < LEVELS.length-1 ?`<button id="bcNextLvBtn" style="padding:12px 22px;margin:4px;border:none;border-radius:12px;background:linear-gradient(135deg,#1a2a4a,#2a4a8a);color:#fff;font-family:'Orbitron',monospace;font-size:.65rem;letter-spacing:.1em;cursor:pointer;border:1px solid rgba(90,127,192,.5)">⚡ LEVEL ${G.level+2}</button>` : ''}
        <button id="bcPlayAgainBtn" style="padding:12px 22px;margin:4px;border:none;border-radius:12px;background:linear-gradient(135deg,#22d3a5,#059669);color:#03040c;font-family:'Orbitron',monospace;font-size:.65rem;letter-spacing:.1em;font-weight:900;cursor:pointer">▶ PLAY AGAIN</button>
        <button id="bcHubBtn" style="padding:12px 22px;margin:4px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:rgba(255,255,255,.05);color:#fff;font-family:'Orbitron',monospace;font-size:.65rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
      </div>`;

    document.getElementById('bcPlayAgainBtn').onclick = ()=>{ restartGame(G.level); };
    document.getElementById('bcHubBtn').onclick = window.bud_cashflowExit;
    const nextLvBtn = document.getElementById('bcNextLvBtn');
    if(nextLvBtn) nextLvBtn.onclick = ()=>{ restartGame(G.level + 1); };
  }

  function restartGame(levelIdx){
    const o = document.getElementById('bcOver');
    if(o){ o.style.display='none'; o.innerHTML=''; }
    const g = document.getElementById('bcGate');
    if(g){ g.style.display='none'; g.innerHTML=''; }
    const layer = document.getElementById('bcTileLayer');
    if(layer) layer.innerHTML='';
    // Remove old resize listener and per-tile window drag listeners
    if(G){
      if(G._resizeFn) window.removeEventListener('resize', G._resizeFn);
      G.tiles.forEach(t => {
        if(t._mmHandler) window.removeEventListener('mousemove', t._mmHandler);
        if(t._muHandler) window.removeEventListener('mouseup', t._muHandler);
      });
    }
    resetGame(levelIdx);
  }

  /* ── DEBUG HOOKS (dev/QA only — no UI wiring) ─────────────────── */
  window._bcDbg = function(){
    if(!G) return null;
    return {
      level: G.level,               // 0-indexed
      levelNum: G.level + 1,        // 1-indexed (what UI shows)
      levelName: G.lv.name,
      levelCount: LEVELS.length,
      net: G.placedIncome - G.placedExpense,
      score: G.score,
      shockChance: G.lv.shockChance,
      shocksConfigured: G.lv.shocks.length,
      shocksActive: G.shockActive.map(s=>s.id),
      monthLeft: G.month,
    };
  };
  // action: 'goto'(levelIdx) | 'win' | 'lose'
  window._bcTest = function(action, arg){
    if(action === 'goto'){ restartGame(arg); return window._bcDbg(); }
    if(!G) return null;
    if(action === 'win'){
      // force a winning net flow, then end immediately
      G.placedIncome = 999999; G.placedExpense = 0;
      endGame(false);
      return window._bcDbg();
    }
    if(action === 'lose'){ endGame(true); return window._bcDbg(); }
    return window._bcDbg();
  };

  /* ── EXIT ───────────────────────────────────────────────────── */
  window.bud_cashflowExit = function(){
    if(G){
      if(G._raf) cancelAnimationFrame(G._raf);
      if(G._resizeFn) window.removeEventListener('resize', G._resizeFn);
      // Remove per-tile window mousemove/mouseup listeners to prevent ghost events
      G.tiles.forEach(t => {
        if(t._mmHandler) window.removeEventListener('mousemove', t._mmHandler);
        if(t._muHandler) window.removeEventListener('mouseup', t._muHandler);
      });
      G = null;
    }
    if(window.state) state.viewingWorld = 'strategist';
    goTo('hub');
  };

  /* ── Helpers ────────────────────────────────────────────────── */
  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }
  function hexA(hex, a){
    const h = hex.replace('#','');
    const full = h.length===3 ? h.split('').map(c=>c+c).join('') : h;
    const n = parseInt(full, 16);
    return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
  }

})();
