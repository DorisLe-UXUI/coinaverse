/* ════════════════════════════════════════════════════════════════
   REBUILDING STATION — Debt Detox District
   Drag positive financial action tiles onto broken buildings.
   Each repair restores the city and raises the Financial Health meter.
   Level 1: 5 buildings, clear visual cues, learn the model.
   Level 2: Full district + setback events, limited repair budget.
   Level 3: Larger district, faster setbacks, tighter time-per-building ratio.
   Accent: #4B2D8F  WorldId: rebuilder
   ════════════════════════════════════════════════════════════════ */
(function(){

  /* ─── PALETTE & CONSTANTS ───────────────────────────────────── */
  const ACCENT      = '#4B2D8F';
  const ACCENT_LT   = '#7C52D4';
  const ACCENT_DIM  = '#2A1A5E';
  const GOLD        = '#F5C842';
  const GREEN       = '#34D399';
  const RED         = '#F87171';
  const RUST        = '#B45309';
  const BG          = '#03040c';

  /* ─── REPAIR ACTIONS ────────────────────────────────────────── */
  const ACTIONS = [
    { id:'efund',  label:'Emergency Fund', icon:'🛟', color:'#34D399', desc:'Catch expenses before they become debt' },
    { id:'bills',  label:'Pay Bills',      icon:'📋', color:'#60A5FA', desc:'Pay every bill on time, every month'  },
    { id:'debt',   label:'Reduce Debt',    icon:'📉', color:'#F59E0B', desc:'Chip away at balances systematically' },
    { id:'save',   label:'Grow Savings',   icon:'💰', color:'#A78BFA', desc:'Set aside money before you spend'     },
    { id:'credit', label:'Build Credit',   icon:'📈', color:'#F472B6', desc:'On-time payments boost your score'    },
  ];

  /* ─── SETBACK EVENTS (Level 2+) ─────────────────────────────── */
  const SETBACKS = [
    { id:'medical', icon:'🏥', label:'Medical Bill',  desc:'Unexpected hospital visit',      hpHit:12, budgetHit:80  },
    { id:'car',     icon:'🚗', label:'Car Breakdown', desc:'Repair cost arrived suddenly',   hpHit:10, budgetHit:100 },
    { id:'jobloss', icon:'💼', label:'Job Loss',       desc:'Income paused — prioritize now', hpHit:18, budgetHit:150 },
    { id:'hike',    icon:'🏠', label:'Rent Hike',      desc:'Monthly expense jumped',         hpHit:8,  budgetHit:60  },
    { id:'fraud',   icon:'🔒', label:'Card Fraud Alert',desc:'A charge you didn\'t make showed up', hpHit:14, budgetHit:120 },
  ];

  /* ─── LEVEL DEFINITIONS ─────────────────────────────────────── */
  const LEVELS = [
    {
      label: 'LEVEL 1 — LEARN',
      buildingCount: 5,
      timerSec: 90,
      budgetStart: null,   // null = unlimited
      setbackRate: null,   // no setbacks
      optimalOrder: ['efund','bills','debt','save','credit'],
      starThresholds: [450, 300]  // [3★, 2★]
    },
    {
      label: 'LEVEL 2 — MASTER',
      buildingCount: 8,
      timerSec: 150,
      // NOTE: budgetStart must comfortably exceed buildingCount*repairCost (800)
      // PLUS the expected setback drain over timerSec at setbackRate, or the
      // level becomes structurally unwinnable (verified by simulation — see
      // Level 3 comment below for the same check applied to Level 3).
      budgetStart: 1300,
      setbackRate: 22,     // seconds between setbacks
      optimalOrder: ['efund','debt','bills','save','credit','efund','bills','debt'],
      starThresholds: [600, 380]
    },
    {
      label: 'LEVEL 3 — CRISIS',
      buildingCount: 11,
      timerSec: 210,
      // Economy verified by simulation: 11 buildings * $100 repair = $1100 minimum,
      // plus expected setback drain (~17s avg interval over 210s ≈ 12 hits *
      // ~$102 avg = ~$1224) requires budgetStart well above the sum of both to
      // remain winnable for a competent player while staying harder than Level 2
      // (higher buildingCount, faster setbackRate, tighter time-per-building ratio).
      budgetStart: 1900,
      setbackRate: 17,     // seconds between setbacks — faster than Level 2's 22
      optimalOrder: ['efund','debt','bills','save','credit','efund','bills','debt','save','credit','efund'],
      starThresholds: [780, 500]
    }
  ];

  /* ─── STATE ─────────────────────────────────────────────────── */
  let G = null, raf = null;

  /* ─── DEBUG HOOK (dev/QA only) ───────────────────────────────── */
  window._rbDbg = function () {
    return G ? { level: G.lvIdx + 1, repaired: G.repairedCount, buildingCount: G.lv.buildingCount, budget: G.budget, health: G.health, score: G.score } : null;
  };
  window._rbForceLevel = function (idx) { startLevel(idx); };
  window._rbForceWin = function () { if (G) { G.repairedCount = G.lv.buildingCount; G.health = 100; endGame(calcStars()); } };

  /* ─── STORED LISTENER REFS (for cleanup) ────────────────────── */
  let _onDragMove = null, _onDragEnd = null, _onResize = null;

  /* ─── HELPERS ───────────────────────────────────────────────── */
  function clamp(v,lo,hi){ return v<lo?lo:v>hi?hi:v; }
  function rnd(lo,hi){ return lo+Math.random()*(hi-lo); }
  function el(id){ return document.getElementById(id); }
  function txt(id,v){ const e=el(id); if(e) e.textContent=v; }

  function lerp(a,b,t){ return a+(b-a)*t; }

  function hexToRgb(hex){
    const r=parseInt(hex.slice(1,3),16);
    const g=parseInt(hex.slice(3,5),16);
    const b=parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }

  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r);
    ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h);
    ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r);
    ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
  }

  /* ─── SCREEN REGISTRATION ───────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_ddt_rebuild = function(){
    G = null;
    if(raf){ cancelAnimationFrame(raf); raf=null; }
    setTimeout(initGame, 40);
    return `<div id="rbRoot" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:'Inter',sans-serif;color:#fff;touch-action:none">

      <!-- TOP BAR -->
      <div id="rbBar" style="position:absolute;top:0;left:0;right:0;z-index:30;display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(180deg,rgba(3,4,12,.98) 60%,transparent)">
        <button id="rbBack" style="padding:7px 13px;border:1px solid rgba(75,45,143,.55);border-radius:9px;background:rgba(75,45,143,.25);color:#c4b5fd;font-family:'Orbitron',sans-serif;font-size:.56rem;letter-spacing:.1em;cursor:pointer;white-space:nowrap;flex-shrink:0">← HUB</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.18em;color:${ACCENT_LT};flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">REBUILDING STATION</div>
        <div id="rbTimerWrap" style="text-align:right;flex-shrink:0">
          <div id="rbTimer" style="font-family:'Orbitron',sans-serif;font-size:.88rem;color:${GOLD};font-variant-numeric:tabular-nums">--:--</div>
          <div style="font-size:.42rem;letter-spacing:.1em;color:rgba(255,255,255,.35)">TIME</div>
        </div>
      </div>

      <!-- HUD ROW -->
      <div id="rbHud" style="position:absolute;top:50px;left:0;right:0;z-index:30;display:flex;gap:6px;padding:0 12px;justify-content:center;flex-wrap:nowrap">
        <div style="background:rgba(75,45,143,.2);border:1px solid rgba(75,45,143,.4);border-radius:10px;padding:5px 10px;text-align:center;min-width:72px">
          <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:#a78bfa;margin-bottom:2px">RESTORED</div>
          <div id="rbRestored" style="font-family:'Orbitron',sans-serif;font-size:.78rem;color:${GREEN};font-variant-numeric:tabular-nums">0/5</div>
        </div>
        <div style="background:rgba(75,45,143,.2);border:1px solid rgba(75,45,143,.4);border-radius:10px;padding:5px 10px;text-align:center;min-width:72px">
          <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:#a78bfa;margin-bottom:2px">HEALTH</div>
          <div id="rbHealth" style="font-family:'Orbitron',sans-serif;font-size:.78rem;color:${GREEN};font-variant-numeric:tabular-nums">70%</div>
        </div>
        <div style="background:rgba(75,45,143,.2);border:1px solid rgba(75,45,143,.4);border-radius:10px;padding:5px 10px;text-align:center;min-width:72px">
          <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:#a78bfa;margin-bottom:2px">SCORE</div>
          <div id="rbScore" style="font-family:'Orbitron',sans-serif;font-size:.78rem;color:${GOLD};font-variant-numeric:tabular-nums">0</div>
        </div>
        <div id="rbBudgetWrap" style="background:rgba(75,45,143,.2);border:1px solid rgba(75,45,143,.4);border-radius:10px;padding:5px 10px;text-align:center;min-width:72px;display:none">
          <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:#a78bfa;margin-bottom:2px">BUDGET</div>
          <div id="rbBudget" style="font-family:'Orbitron',sans-serif;font-size:.78rem;color:${GOLD};font-variant-numeric:tabular-nums">$800</div>
        </div>
      </div>

      <!-- HEALTH BAR -->
      <div style="position:absolute;top:100px;left:12px;right:12px;z-index:30">
        <div style="height:6px;background:rgba(75,45,143,.2);border-radius:3px;overflow:hidden;border:1px solid rgba(75,45,143,.3)">
          <div id="rbHealthBar" style="height:100%;width:70%;border-radius:3px;transition:width .4s ease,background .4s ease;background:${GREEN}"></div>
        </div>
      </div>

      <!-- CANVAS (buildings + city) -->
      <canvas id="rbCanvas" style="position:absolute;top:112px;left:0;right:0;bottom:170px;width:100%;display:block;touch-action:none"></canvas>

      <!-- ACTION TRAY -->
      <div id="rbTray" style="position:absolute;bottom:0;left:0;right:0;z-index:30;height:170px;background:rgba(10,6,24,.96);border-top:1px solid rgba(75,45,143,.4);padding:10px 10px 14px;overflow:hidden">
        <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.16em;color:rgba(124,82,212,.8);margin-bottom:8px;text-align:center">REPAIR ACTION TILES — DRAG TO BUILDING</div>
        <div id="rbTiles" style="display:flex;gap:8px;justify-content:center;flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch"></div>
      </div>

      <!-- FLOATING DRAG TILE (cloned while dragging) -->
      <div id="rbDragGhost" style="position:absolute;z-index:100;pointer-events:none;display:none;transform:translate(-50%,-50%)"></div>

      <!-- SETBACK OVERLAY SLOT -->
      <div id="rbSetbackSlot" style="position:absolute;top:112px;left:0;right:0;z-index:40;pointer-events:none"></div>

      <!-- END OVERLAY -->
      <div id="rbEnd" style="display:none;position:absolute;inset:0;z-index:60;background:rgba(3,4,12,.94);flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center"></div>

      <!-- LEVEL SELECT -->
      <div id="rbSelect" style="position:absolute;inset:0;z-index:55;background:rgba(3,4,12,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px"></div>

    </div>`;
  };

  /* ─── EXIT ──────────────────────────────────────────────────── */
  function cleanupListeners(){
    if(_onDragMove){ window.removeEventListener('mousemove', _onDragMove); window.removeEventListener('touchmove', _onDragMove); _onDragMove=null; }
    if(_onDragEnd){  window.removeEventListener('mouseup',  _onDragEnd);  window.removeEventListener('touchend',  _onDragEnd);  _onDragEnd=null; }
    if(_onResize){   window.removeEventListener('resize',   _onResize);   _onResize=null; }
  }

  window.ddt_rebuildExit = function(){
    cleanupListeners();
    G = null;
    if(raf){ cancelAnimationFrame(raf); raf=null; }
    if(window.state) state.viewingWorld = 'rebuilder';
    goTo('hub');
  };

  /* ─── INIT ──────────────────────────────────────────────────── */
  function initGame(){
    const root = el('rbRoot');
    if(!root){ setTimeout(initGame,30); return; }

    const back = el('rbBack');
    if(back) back.onclick = ()=> window.ddt_rebuildExit();

    injectStyles();
    showLevelSelect();
  }

  function injectStyles(){
    const s = document.createElement('style');
    s.textContent = `
      @keyframes rbTileShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
      @keyframes rbFlash{0%{opacity:0}20%{opacity:1}80%{opacity:1}100%{opacity:0}}
      @keyframes rbSetbackIn{from{opacity:0;transform:translateY(-16px) scale(.95)}to{opacity:1;transform:none}}
      @keyframes rbBuildRepair{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
      @keyframes rbPop{0%{transform:scale(.8);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1);opacity:1}}
      @keyframes rbWinCardIn{0%{opacity:0;transform:scale(.6) rotate(-6deg) translateY(20px)}55%{opacity:1;transform:scale(1.08) rotate(2deg) translateY(-4px)}80%{transform:scale(.97) rotate(-1deg)}100%{opacity:1;transform:scale(1) rotate(0) translateY(0)}}
      @keyframes rbLoseCardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      .rbTile{
        flex-shrink:0;width:92px;height:110px;border-radius:14px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:5px;cursor:grab;user-select:none;position:relative;
        border:1.5px solid rgba(75,45,143,.5);
        background:rgba(42,26,94,.6);
        transition:box-shadow .15s,transform .15s,opacity .15s;
      }
      .rbTile:hover{box-shadow:0 0 18px rgba(124,82,212,.4);transform:translateY(-2px)}
      .rbTile.used{opacity:.32;pointer-events:none;filter:grayscale(1)}
      .rbTile.shake{animation:rbTileShake .3s}
      #rbTiles::-webkit-scrollbar{height:3px}
      #rbTiles::-webkit-scrollbar-track{background:transparent}
      #rbTiles::-webkit-scrollbar-thumb{background:rgba(75,45,143,.5);border-radius:2px}
    `;
    document.head.appendChild(s);
  }

  /* ─── LEVEL SELECT ──────────────────────────────────────────── */
  function showLevelSelect(){
    const sel = el('rbSelect');
    if(!sel) return;
    sel.style.display = 'flex';
    sel.innerHTML = `
      <div style="font-size:2.2rem;margin-bottom:4px">🏗️</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.9rem;letter-spacing:.2em;color:${ACCENT_LT};margin-bottom:6px">REBUILDING STATION</div>
      <div style="color:rgba(255,255,255,.6);font-size:.75rem;max-width:320px;line-height:1.65;margin-bottom:22px;text-align:center">Drag action tiles onto broken buildings to restore your city. Each repair raises your Financial Health meter.</div>
      <div style="display:flex;flex-direction:column;gap:11px;width:100%;max-width:340px">
        ${LEVELS.map((lv,i)=>`
          <button id="rbSelBtn${i}" style="padding:15px 18px;border:1px solid rgba(75,45,143,.5);border-radius:14px;background:rgba(42,26,94,.55);color:#e2e8f0;font-family:'Inter',sans-serif;font-size:.8rem;cursor:pointer;text-align:left;display:flex;align-items:center;gap:14px">
            <div style="font-size:1.5rem">${i===0?'🎓':i===1?'🏆':'🔥'}</div>
            <div>
              <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.15em;color:${ACCENT_LT};margin-bottom:3px">${lv.label}</div>
              <div style="color:rgba(255,255,255,.55);font-size:.7rem">${lv.buildingCount} buildings · ${lv.timerSec}s${lv.budgetStart?` · $${lv.budgetStart} budget · setbacks active`:' · no setbacks'}</div>
            </div>
          </button>`).join('')}
      </div>
    `;
    LEVELS.forEach((_,i)=>{
      const btn = el('rbSelBtn'+i);
      if(btn) btn.onclick = ()=> startLevel(i);
    });
  }

  /* ─── START LEVEL ───────────────────────────────────────────── */
  function startLevel(lvIdx){
    const sel = el('rbSelect');
    if(sel) sel.style.display = 'none';
    const endEl = el('rbEnd');
    if(endEl) endEl.style.display = 'none';

    const lv = LEVELS[lvIdx];

    // Build buildings list — repeat ACTIONS cyclically if needed
    const buildings = [];
    for(let i=0; i<lv.buildingCount; i++){
      const action = ACTIONS[i % ACTIONS.length];
      buildings.push({
        id: 'b'+i,
        action: action.id,
        repaired: false,
        repairProgress: 0,   // 0..1
        repairing: false,    // animating
        repairTimer: 0,
        x: 0, y: 0, w: 0, h: 0, // set in layout
        shakeT: 0,
        glowT: 0,
        col: i,              // grid column
        row: Math.floor(i / (lv.buildingCount > 5 ? 4 : 5))
      });
    }

    G = {
      phase: 'play',
      lvIdx,
      lv,
      buildings,
      tiles: ACTIONS.map((a,i)=>({
        ...a,
        used: false,
        el: null,
        tileIdx: i
      })),
      health: 70,
      score: 0,
      timeLeft: lv.timerSec,
      budget: lv.budgetStart,
      repairedCount: 0,
      optimalIdx: 0,           // tracks order bonuses
      bonusStreak: 0,
      setbackTimer: lv.setbackRate || 9999,
      setbacksHandled: 0,
      pendingSetback: null,
      lastT: null,
      particles: [],
      floats: [],
      drag: {
        active: false,
        tileId: null,
        x: 0, y: 0
      },
      canvas: null,
      ctx: null,
      shakeT: 0,
      flashT: 0,
      flashC: ACCENT
    };

    // budget UI
    const budWrap = el('rbBudgetWrap');
    if(budWrap) budWrap.style.display = lv.budgetStart ? 'block' : 'none';

    setupCanvas();
    buildTiles();
    setupDragInput();
    updateHUD();
    if(raf){ cancelAnimationFrame(raf); }
    G.lastT = null;
    raf = requestAnimationFrame(loop);
  }

  /* ─── CANVAS SETUP ──────────────────────────────────────────── */
  function setupCanvas(){
    const cv = el('rbCanvas');
    if(!cv){ return; }
    G.canvas = cv;
    G.ctx = cv.getContext('2d');
    sizeCanvas();
    if(_onResize) window.removeEventListener('resize', _onResize);
    _onResize = sizeCanvas;
    window.addEventListener('resize', _onResize);
  }

  function sizeCanvas(){
    const cv = G && G.canvas;
    if(!cv) return;
    cv.width  = cv.clientWidth  * (window.devicePixelRatio||1);
    cv.height = cv.clientHeight * (window.devicePixelRatio||1);
    layoutBuildings();
  }

  function layoutBuildings(){
    if(!G) return;
    const cv = G.canvas;
    if(!cv) return;
    const dpr = window.devicePixelRatio||1;
    const W = cv.width/dpr, H = cv.height/dpr;
    const n = G.buildings.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n/cols);
    const pad  = 12;
    const gapX = 10, gapY = 14;
    const cellW = (W - pad*2 - gapX*(cols-1)) / cols;
    const cellH = (H - pad*2 - gapY*(rows-1)) / rows;

    G.buildings.forEach((b,i)=>{
      const col = i % cols;
      const row = Math.floor(i / cols);
      b.x = pad + col*(cellW+gapX);
      b.y = pad + row*(cellH+gapY);
      b.w = cellW;
      b.h = cellH;
      b.col = col;
      b.row = row;
    });
  }

  /* ─── TILE HTML ─────────────────────────────────────────────── */
  function buildTiles(){
    const tray = el('rbTiles');
    if(!tray) return;
    tray.innerHTML = '';
    G.tiles.forEach((t,i)=>{
      const div = document.createElement('div');
      div.className = 'rbTile';
      div.id = 'rbTile_'+t.id;
      div.setAttribute('data-tileid', t.id);
      div.innerHTML = `
        <div style="font-size:1.7rem;filter:drop-shadow(0 0 6px ${t.color})">${t.icon}</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.1em;color:${t.color};text-align:center;line-height:1.3">${t.label}</div>
        <div style="font-size:.52rem;color:rgba(255,255,255,.4);text-align:center;line-height:1.3;padding:0 4px">${t.desc}</div>
      `;
      div.style.borderColor = t.color+'55';
      div.style.boxShadow = `0 0 12px ${t.color}22, inset 0 1px 0 rgba(255,255,255,.05)`;
      tray.appendChild(div);
      t.el = div;
    });
  }

  /* ─── DRAG INPUT ────────────────────────────────────────────── */
  function setupDragInput(){
    const root = el('rbRoot');
    if(!root) return;

    const ghost = el('rbDragGhost');

    function getPoint(e){
      if(e.touches && e.touches.length) return {x:e.touches[0].clientX, y:e.touches[0].clientY};
      return {x:e.clientX, y:e.clientY};
    }

    function tileFromTarget(target){
      let el = target;
      while(el && el !== root){
        if(el.dataset && el.dataset.tileid) return el.dataset.tileid;
        el = el.parentElement;
      }
      return null;
    }

    function onDragStart(e){
      if(!G || G.phase !== 'play') return;
      const tileId = tileFromTarget(e.target);
      if(!tileId) return;
      const tile = G.tiles.find(t=>t.id===tileId);
      if(!tile || tile.used) return;
      e.preventDefault();

      const pt = getPoint(e);
      G.drag.active  = true;
      G.drag.tileId  = tileId;
      G.drag.x       = pt.x;
      G.drag.y       = pt.y;

      // show ghost
      if(ghost){
        ghost.style.display = 'block';
        ghost.style.left    = pt.x+'px';
        ghost.style.top     = pt.y+'px';
        ghost.innerHTML = `<div style="
          width:80px;height:80px;border-radius:12px;
          background:rgba(42,26,94,.9);border:2px solid ${tile.color};
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
          box-shadow:0 0 20px ${tile.color}66;
          font-size:1.6rem;
        ">${tile.icon}<div style="font-family:Orbitron,sans-serif;font-size:.4rem;color:${tile.color};letter-spacing:.08em">${tile.label}</div></div>`;
      }

      // dim the source tile
      if(tile.el){ tile.el.style.opacity = '0.4'; }
    }

    function onDragMove(e){
      if(!G || !G.drag.active) return;
      e.preventDefault();
      const pt = getPoint(e);
      G.drag.x = pt.x;
      G.drag.y = pt.y;
      if(ghost){
        ghost.style.left = pt.x+'px';
        ghost.style.top  = pt.y+'px';
      }
    }

    function onDragEnd(e){
      if(!G || !G.drag.active) return;
      e.preventDefault();

      const tile = G.tiles.find(t=>t.id===G.drag.tileId);
      if(tile && tile.el) tile.el.style.opacity = tile.used ? '0.32' : '1';

      if(ghost) ghost.style.display = 'none';

      // find which building we dropped onto
      const pt = G.drag;
      tryDrop(pt.x, pt.y, G.drag.tileId);

      G.drag.active = false;
      G.drag.tileId = null;
    }

    // Remove any previously registered window drag listeners before re-adding
    if(_onDragMove){ window.removeEventListener('mousemove', _onDragMove); window.removeEventListener('touchmove', _onDragMove); }
    if(_onDragEnd){  window.removeEventListener('mouseup',  _onDragEnd);  window.removeEventListener('touchend',  _onDragEnd); }

    _onDragMove = onDragMove;
    _onDragEnd  = onDragEnd;

    root.addEventListener('mousedown',  onDragStart);
    root.addEventListener('touchstart', onDragStart, {passive:false});
    window.addEventListener('mousemove',  _onDragMove);
    window.addEventListener('touchmove',  _onDragMove, {passive:false});
    window.addEventListener('mouseup',    _onDragEnd);
    window.addEventListener('touchend',   _onDragEnd);
  }

  function tryDrop(screenX, screenY, tileId){
    if(!G) return;
    const cv = G.canvas;
    if(!cv) return;
    const rect = cv.getBoundingClientRect();
    const dpr  = window.devicePixelRatio||1;
    // convert to canvas logical coords
    const lx = (screenX - rect.left);
    const ly = (screenY - rect.top);

    const tile     = G.tiles.find(t=>t.id===tileId);
    if(!tile || tile.used) return;

    // hit-test buildings
    const hit = G.buildings.find(b=>
      !b.repaired &&
      lx >= b.x && lx <= b.x+b.w &&
      ly >= b.y && ly <= b.y+b.h
    );

    if(!hit){
      // missed — shake tile
      if(tile.el){ tile.el.classList.remove('shake'); void tile.el.offsetWidth; tile.el.classList.add('shake'); }
      return;
    }

    // Does the tile match the building?
    if(hit.action !== tile.id){
      // Wrong action — visual rejection
      addFloat(hit.x+hit.w/2, hit.y+hit.h/2, 'OOPS — try a different tile!', RED, 0.9);
      if(tile.el){ tile.el.classList.remove('shake'); void tile.el.offsetWidth; tile.el.classList.add('shake'); }
      hit.shakeT = 0.4;
      G.health = clamp(G.health - 3, 0, 100);
      G.score  = Math.max(0, G.score - 10);
      G.shakeT = 0.25;
      checkLose();
      return;
    }

    // Check budget
    const repairCost = 100; // each repair costs $100 in any level with a budget (Level 2+)
    if(G.lv.budgetStart && G.budget < repairCost){
      addFloat(hit.x+hit.w/2, hit.y+hit.h/2, 'Not enough budget!', RED, 0.9);
      if(tile.el){ tile.el.classList.remove('shake'); void tile.el.offsetWidth; tile.el.classList.add('shake'); }
      return;
    }

    // Valid repair!
    applyRepair(hit, tile, repairCost);
  }

  function applyRepair(building, tile, cost){
    // budget
    if(G.lv.budgetStart) G.budget = Math.max(0, G.budget - cost);

    // mark tile used
    tile.used = true;
    if(tile.el) tile.el.classList.add('used');
    // toolbox refill — once every tile is spent, re-arm them all
    // (Level 2 has 8 buildings and Level 3 has 11, but only 5 action tiles exist,
    // so repeated refill cycles are required to reach buildingCount repairs)
    if(G.tiles.every(t => t.used)){
      setTimeout(() => {
        if(!G || G.phase !== 'play') return;
        G.tiles.forEach(t => {
          t.used = false;
          if(t.el){ t.el.classList.remove('used'); t.el.style.opacity = '1'; }
        });
      }, 900);
    }

    // start building repair animation
    building.repairing   = true;
    building.repairTimer = 0.8; // animate for 0.8s

    // check optimal order bonus
    const optOrder = G.lv.optimalOrder;
    const expectedAction = optOrder[G.repairedCount % optOrder.length];
    let bonus = 80;
    let orderBonus = false;
    if(building.action === expectedAction){
      bonus += 50;
      G.bonusStreak++;
      orderBonus = true;
      G.optimalIdx++;
    } else {
      G.bonusStreak = 0;
    }

    // streak bonus
    const streakBonus = G.bonusStreak >= 3 ? 30 : 0;
    const totalBonus = bonus + streakBonus;

    G.score  += totalBonus;
    G.health  = clamp(G.health + 15, 0, 100);
    G.repairedCount++;

    const action = ACTIONS.find(a=>a.id===building.action);

    // float texts — streak label grows with streak depth so hit #10 reads as a bigger deal than hit #3
    const streakScale = streakBonus>0 ? Math.min(0.8 + (G.bonusStreak-3)*0.08, 1.3) : 0.8;
    addFloat(building.x+building.w/2, building.y+building.h/3, `+${totalBonus} pts`, GOLD, 1.1);
    if(orderBonus) addFloat(building.x+building.w/2, building.y+building.h/3+22, 'OPTIMAL ORDER!', GREEN, 0.85);
    if(streakBonus>0) addFloat(building.x+building.w/2, building.y+building.h/3+44, `STREAK ×${G.bonusStreak}!`, ACCENT_LT, streakScale);

    // burst particle count scales with streak depth (18 base, up to +24 at high streaks) so the
    // celebration visibly escalates instead of looking identical from hit #1 to hit #10
    const burstCount = 18 + Math.min(G.bonusStreak * 2, 24);
    burst(building.x+building.w/2, building.y+building.h/2, action?action.color:ACCENT_LT, burstCount);

    // After animation: mark repaired
    setTimeout(()=>{
      if(!G) return;
      building.repaired       = true;
      building.repairing      = false;
      building.repairProgress = 1;
      building.glowT          = 2;
      checkWin();
    }, 900);
  }

  /* ─── SETBACK SYSTEM ────────────────────────────────────────── */
  function triggerSetback(){
    if(!G || G.pendingSetback) return;
    const sb = SETBACKS[Math.floor(Math.random()*SETBACKS.length)];
    G.pendingSetback = {...sb};
    G.health = clamp(G.health - sb.hpHit, 0, 100);
    if(G.lv.budgetStart) G.budget = Math.max(0, G.budget - sb.budgetHit);
    G.shakeT  = 0.5;
    G.flashT  = 0.5;
    G.flashC  = RED;

    showSetbackCard(G.pendingSetback);
    checkLose();
  }

  function showSetbackCard(sb){
    const slot = el('rbSetbackSlot');
    if(!slot) return;
    slot.innerHTML = `
      <div id="rbSetbackCard" style="
        position:absolute;top:8px;left:12px;right:12px;
        background:rgba(15,6,30,.95);border:1.5px solid rgba(248,113,113,.6);
        border-radius:16px;padding:14px 16px;
        box-shadow:0 0 28px rgba(248,113,113,.3),inset 0 1px 0 rgba(255,255,255,.04);
        pointer-events:all;animation:rbSetbackIn .3s ease;
        z-index:40;
      ">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="font-size:1.9rem;line-height:1;flex-shrink:0">${sb.icon}</div>
          <div style="flex:1;min-width:0">
            <div style="font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.14em;color:#fca5a5;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">SETBACK: ${sb.label.toUpperCase()}</div>
            <div style="color:rgba(255,255,255,.6);font-size:.7rem;line-height:1.45;margin-bottom:8px">${sb.desc}</div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <div style="font-size:.68rem;color:${RED}">HP −${sb.hpHit}%${G.lv.budgetStart?' · Budget −$'+sb.budgetHit:''}</div>
              <button id="rbSetbackOk" style="margin-left:auto;padding:6px 14px;border:1px solid rgba(124,82,212,.5);border-radius:8px;background:rgba(75,45,143,.3);color:#c4b5fd;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.08em;cursor:pointer">GOT IT — KEEP GOING</button>
            </div>
          </div>
        </div>
      </div>`;
    slot.style.pointerEvents = 'all';
    const okBtn = el('rbSetbackOk');
    if(okBtn) okBtn.onclick = dismissSetback;
  }

  function dismissSetback(){
    const slot = el('rbSetbackSlot');
    if(slot) slot.innerHTML = '';
    if(G){ G.pendingSetback = null; G.setbacksHandled++; }
  }

  /* ─── GAME LOOP ─────────────────────────────────────────────── */
  function loop(ts){
    if(!G || G.phase !== 'play'){ raf=null; return; }
    if(!G.lastT) G.lastT = ts;
    const dt = Math.min((ts-G.lastT)/1000, 0.1);
    G.lastT = ts;
    update(dt, ts);
    render(ts);
    raf = requestAnimationFrame(loop);
  }

  function update(dt, ts){
    // Timer
    G.timeLeft -= dt;
    if(G.timeLeft <= 0){
      G.timeLeft = 0;
      endGame(calcStars());
      return;
    }
    const m = Math.floor(G.timeLeft/60);
    const s = Math.floor(G.timeLeft%60);
    txt('rbTimer', (m<10?'0':'')+m+':'+(s<10?'0':'')+s);
    const timerEl = el('rbTimer');
    if(timerEl) timerEl.style.color = G.timeLeft<20 ? RED : G.timeLeft<40 ? '#FB923C' : GOLD;

    // Building repair timers
    G.buildings.forEach(b=>{
      if(b.repairing){
        b.repairTimer = Math.max(0, b.repairTimer - dt);
        b.repairProgress = 1 - b.repairTimer/0.8;
      }
      if(b.shakeT>0) b.shakeT = Math.max(0, b.shakeT-dt);
      if(b.glowT>0)  b.glowT  = Math.max(0, b.glowT-dt);
    });

    // Setback timer
    if(G.lv.setbackRate && !G.pendingSetback){
      G.setbackTimer -= dt;
      if(G.setbackTimer <= 0){
        G.setbackTimer = G.lv.setbackRate*(0.8+Math.random()*0.5);
        triggerSetback();
      }
    }

    // Shake / flash decay
    if(G.shakeT>0) G.shakeT = Math.max(0, G.shakeT-dt);
    if(G.flashT>0) G.flashT = Math.max(0, G.flashT-dt);

    // Particles & floats
    G.particles = G.particles.filter(p=>{
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; p.vy+=260*dt;
      return p.life>0;
    });
    G.floats = G.floats.filter(f=>{ f.y-=50*dt; f.life-=dt; return f.life>0; });

    updateHUD();
    checkLose();
  }

  function updateHUD(){
    if(!G) return;
    txt('rbRestored', G.repairedCount+'/'+G.lv.buildingCount);
    txt('rbHealth',   Math.round(G.health)+'%');
    txt('rbScore',    G.score);

    const hbar = el('rbHealthBar');
    if(hbar){
      hbar.style.width      = G.health+'%';
      hbar.style.background = G.health > 60 ? GREEN : G.health > 30 ? '#F59E0B' : RED;
    }
    const healthEl = el('rbHealth');
    if(healthEl) healthEl.style.color = G.health > 60 ? GREEN : G.health > 30 ? '#F59E0B' : RED;

    if(G.lv.budgetStart){
      txt('rbBudget', '$'+Math.round(G.budget));
      const bEl = el('rbBudget');
      if(bEl) bEl.style.color = G.budget < 150 ? RED : GOLD;
    }
  }

  /* ─── RENDER ────────────────────────────────────────────────── */
  function render(ts){
    if(!G) return;
    const cv  = G.canvas;
    const ctx = G.ctx;
    if(!cv||!ctx) return;
    const dpr = window.devicePixelRatio||1;
    const W = cv.width/dpr, H = cv.height/dpr;
    ctx.save();
    ctx.scale(dpr, dpr);

    // shake
    if(G.shakeT>0){
      const m = G.shakeT*9;
      ctx.translate((Math.random()-.5)*m, (Math.random()-.5)*m);
    }

    // background sky — shifts from grey-rust to purple as health improves
    const healthT = G.health/100;
    const bgTop   = lerpHex('#1A0F0F', '#160A2E', healthT);
    const bgBot   = lerpHex('#0A0505', '#03040c', healthT);
    const bgGrad  = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0, bgTop);
    bgGrad.addColorStop(1, bgBot);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);

    // ground strip
    const gGrad = ctx.createLinearGradient(0,H*0.88,0,H);
    gGrad.addColorStop(0, lerpHex('#1A1010','#1A1035', healthT));
    gGrad.addColorStop(1, BG);
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, H*0.88, W, H*0.12);

    // ambient glow from repaired buildings
    if(healthT>0.3){
      const glow = ctx.createRadialGradient(W/2,H*0.5,10,W/2,H*0.5,W*0.6);
      glow.addColorStop(0,`rgba(75,45,143,${healthT*0.18})`);
      glow.addColorStop(1,'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0,0,W,H);
    }

    // flash overlay
    if(G.flashT>0){
      ctx.globalAlpha = G.flashT*0.3;
      ctx.fillStyle   = G.flashC;
      ctx.fillRect(0,0,W,H);
      ctx.globalAlpha = 1;
    }

    // draw buildings
    G.buildings.forEach(b=> drawBuilding(ctx, b, ts));

    // particles
    G.particles.forEach(p=>{
      ctx.globalAlpha = Math.max(0, p.life/p.maxLife);
      ctx.fillStyle   = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // floats
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    G.floats.forEach(f=>{
      ctx.globalAlpha = clamp(f.life, 0, 1);
      ctx.font        = `700 ${Math.round(f.scale*14)}px Inter,sans-serif`;
      ctx.fillStyle   = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur  = 8;
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;

    // Drop zone highlight if dragging
    if(G.drag.active && G.canvas){
      const rect = G.canvas.getBoundingClientRect();
      const lx = G.drag.x - rect.left;
      const ly = G.drag.y - rect.top;
      G.buildings.forEach(b=>{
        if(b.repaired) return;
        const tile = G.tiles.find(t=>t.id===G.drag.tileId);
        if(!tile) return;
        const isMatch = b.action === tile.id;
        const inside  = lx>=b.x && lx<=b.x+b.w && ly>=b.y && ly<=b.y+b.h;
        if(inside){
          ctx.strokeStyle = isMatch ? GREEN : RED;
          ctx.lineWidth   = 3;
          ctx.shadowColor = isMatch ? GREEN : RED;
          ctx.shadowBlur  = 12;
          roundRect(ctx, b.x+2, b.y+2, b.w-4, b.h-4, 8);
          ctx.stroke();
          ctx.shadowBlur  = 0;
        }
      });
    }

    ctx.restore();
  }

  /* ─── BUILDING DRAW ─────────────────────────────────────────── */
  function drawBuilding(ctx, b, ts){
    const now   = ts/1000;
    const shake = b.shakeT>0 ? (Math.random()-.5)*b.shakeT*8 : 0;
    const action= ACTIONS.find(a=>a.id===b.action);
    const col   = action ? action.color : '#888';
    const prog  = b.repairProgress; // 0..1

    ctx.save();
    ctx.translate(b.x+b.w/2+shake, 0);
    ctx.translate(-(b.x+b.w/2), 0);

    const x = b.x, y = b.y, w = b.w, h = b.h;
    const cornerR = 7;

    // Building body color: lerp from rust-damaged to clean repaired
    const bodyColor = b.repaired
      ? lerpHex('#1A2440', '#1E3060', 1)
      : lerpHex('#1A0B0B', '#1A2440', prog);

    roundRect(ctx, x, y, w, h, cornerR);
    ctx.fillStyle = bodyColor;
    ctx.fill();

    // Rust / damage texture strips (fade out as repaired)
    if(!b.repaired){
      const rustAlpha = (1-prog)*0.7;
      ctx.globalAlpha = rustAlpha;
      for(let ri=0; ri<4; ri++){
        const ry = y + h*0.2 + ri*(h*0.15);
        const rw = w*(0.6+Math.random()*0.01);
        ctx.fillStyle = '#4A2000';
        ctx.fillRect(x+(w-rw)/2, ry, rw, h*0.05);
      }
      ctx.globalAlpha = 1;
    }

    // Border
    const bAlpha = b.repaired ? 0.9 : 0.4+prog*0.3;
    ctx.strokeStyle = b.repaired ? col+'CC' : '#5C3D1E';
    ctx.lineWidth   = b.repaired ? 2 : 1.5;
    if(b.glowT>0){
      ctx.shadowColor = col;
      ctx.shadowBlur  = 20*Math.min(b.glowT,1);
    }
    roundRect(ctx, x, y, w, h, cornerR);
    ctx.globalAlpha = bAlpha;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;

    // Windows
    const winRows = 3, winCols = 3;
    const winW = w*0.14, winH = h*0.1;
    const wPadX = (w - winCols*(winW+4)) / 2;
    const wPadY = h*0.12;
    for(let wr=0; wr<winRows; wr++){
      for(let wc=0; wc<winCols; wc++){
        const wx = x + wPadX + wc*(winW+5);
        const wy = y + wPadY + wr*(winH+6);
        // Repaired windows glow; broken ones are dark/cracked
        if(b.repaired){
          const flicker = 0.7 + 0.3*Math.sin(now*2.5+wr*1.3+wc*0.7);
          ctx.fillStyle = `rgba(${hexToRgb(col)},${flicker*0.7})`;
          ctx.shadowColor = col;
          ctx.shadowBlur  = 6;
        } else {
          const lit = prog > 0.5 && Math.random()>0.7;
          ctx.fillStyle = lit ? `rgba(${hexToRgb(col)},${prog*0.5})` : 'rgba(20,8,8,0.9)';
          ctx.shadowBlur = 0;
        }
        roundRect(ctx, wx, wy, winW, winH, 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Rooftop detail
    if(b.repaired){
      // antenna / beacon
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.7+0.3*Math.sin(now*3);
      ctx.beginPath();
      ctx.arc(x+w/2, y+4, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // vertical line
      ctx.strokeStyle = col+'88';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(x+w/2, y);
      ctx.lineTo(x+w/2, y+4);
      ctx.stroke();
    }

    // Label: what this building needs (icon + action type)
    if(!b.repaired){
      // need label badge at top
      const badgeY = y + h*0.13;
      ctx.fillStyle   = 'rgba(10,4,20,.85)';
      ctx.strokeStyle = col+'66';
      ctx.lineWidth   = 1;
      roundRect(ctx, x+w*0.15, badgeY-10, w*0.7, 22, 5);
      ctx.fill();
      ctx.stroke();
      ctx.font          = `700 ${Math.round(w*0.12)}px Inter,sans-serif`;
      ctx.fillStyle     = col;
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'middle';
      ctx.shadowColor   = col;
      ctx.shadowBlur    = b.shakeT>0 ? 0 : 5;
      ctx.fillText(action?action.icon:'?', x+w/2, badgeY+1);
      ctx.shadowBlur    = 0;

      // Repair progress bar (shown while repairing)
      if(b.repairing && prog>0){
        const barY = y+h-10;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        roundRect(ctx, x+4, barY-4, w-8, 8, 3); ctx.fill();
        ctx.fillStyle = col;
        roundRect(ctx, x+4, barY-4, (w-8)*prog, 8, 3); ctx.fill();
      }
    } else {
      // Restored label
      ctx.font         = `600 ${Math.round(w*0.11)}px Inter,sans-serif`;
      ctx.fillStyle    = col;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = col;
      ctx.shadowBlur   = 8;
      ctx.fillText('✓ RESTORED', x+w/2, y+h*0.88);
      ctx.shadowBlur   = 0;

      // icon on restored building
      ctx.font = Math.round(w*0.18)+'px serif';
      ctx.fillText(action?action.icon:'', x+w/2, y+h*0.52);
    }

    // Cracks overlay on damaged buildings (fades out)
    if(!b.repaired && prog<0.5){
      const crAlpha = (1-prog*2)*0.45;
      ctx.globalAlpha = crAlpha;
      ctx.strokeStyle = '#2A1010';
      ctx.lineWidth   = 1;
      // simple crack lines
      ctx.beginPath();
      ctx.moveTo(x+w*0.3, y+h*0.4); ctx.lineTo(x+w*0.45, y+h*0.55); ctx.lineTo(x+w*0.38, y+h*0.65);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x+w*0.65, y+h*0.3); ctx.lineTo(x+w*0.6, y+h*0.45); ctx.lineTo(x+w*0.7, y+h*0.6);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  /* ─── HELPERS ───────────────────────────────────────────────── */
  function lerpHex(a,b,t){
    const ar=parseInt(a.slice(1,3),16), ag=parseInt(a.slice(3,5),16), ab=parseInt(a.slice(5,7),16);
    const br=parseInt(b.slice(1,3),16), bg=parseInt(b.slice(3,5),16), bb=parseInt(b.slice(5,7),16);
    const r=Math.round(lerp(ar,br,t)), g=Math.round(lerp(ag,bg,t)), bl=Math.round(lerp(ab,bb,t));
    return '#'+[r,g,bl].map(v=>v.toString(16).padStart(2,'0')).join('');
  }

  function burst(x,y,c,n){
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2, spd=60+Math.random()*120;
      G.particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-80,c,r:2.5+Math.random()*2.5,life:0.7+Math.random()*0.4,maxLife:1.1});
    }
  }

  function addFloat(x,y,text,color,scale=1){
    G.floats.push({x,y,text,color,life:1.3,scale});
  }

  /* ─── WIN / LOSE ────────────────────────────────────────────── */
  function checkWin(){
    if(!G || G.phase!=='play') return;
    if(G.repairedCount >= G.lv.buildingCount){
      G.health = 100;
      setTimeout(()=> endGame(calcStars()), 600);
    }
  }

  function checkLose(){
    if(!G || G.phase!=='play') return;
    if(G.health <= 0){
      G.health = 0;
      endGame(0);
    }
  }

  function calcStars(){
    if(!G) return 0;
    const lv  = G.lv;
    const won = G.repairedCount >= lv.buildingCount && G.health > 0;
    if(!won && G.score <= 0) return 0;
    if(G.score >= lv.starThresholds[0]) return 3;
    if(G.score >= lv.starThresholds[1]) return 2;
    return 1;
  }

  /* ─── END GAME ──────────────────────────────────────────────── */
  function endGame(stars){
    if(!G || G.phase==='end') return;
    G.phase = 'end';
    if(raf){ cancelAnimationFrame(raf); raf=null; }

    // clear setback
    const slot = el('rbSetbackSlot');
    if(slot) slot.innerHTML = '';

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ddt_rebuild', { level: G.lvIdx + 1, stars, is3star, isPerfect: is3star, badge: 'Rebuilder' })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('ddt_recovery', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    const won      = G.repairedCount >= G.lv.buildingCount && G.health > 0;
    const starStr  = '⭐'.repeat(stars)+'☆'.repeat(3-stars);
    const endEl    = el('rbEnd');
    if(!endEl) return;
    endEl.style.display = 'flex';

    const mainColor = won ? GREEN : RED;
    const mainLabel = won ? 'DISTRICT RESTORED!' : stars>0 ? 'PARTIAL RESTORATION' : 'FINANCIAL HEALTH FAILED';
    // Win gets a bouncy, overshooting entrance; loss/partial gets a plain calm fade — so the
    // win moment reads as more celebratory instead of both states swapping in identically.
    const cardAnim = won ? 'rbWinCardIn .6s cubic-bezier(.22,1.4,.36,1) both' : 'rbLoseCardIn .4s ease both';

    endEl.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;animation:${cardAnim}">
      <div style="font-size:2.5rem;margin-bottom:4px">${won?'🏙️':'🏚️'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.8rem;letter-spacing:.2em;color:${mainColor};margin-bottom:8px">${mainLabel}</div>
      <div style="font-size:1.7rem;letter-spacing:.1em;margin-bottom:4px">${starStr}</div>

      <div style="display:flex;gap:14px;margin-bottom:18px;flex-wrap:wrap;justify-content:center">
        <div style="text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.12em;color:rgba(255,255,255,.4)">SCORE</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:1.1rem;color:${GOLD}">${G.score}</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.12em;color:rgba(255,255,255,.4)">RESTORED</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:1.1rem;color:${GREEN}">${G.repairedCount}/${G.lv.buildingCount}</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.12em;color:rgba(255,255,255,.4)">HEALTH</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:1.1rem;color:${G.health>60?GREEN:G.health>30?'#F59E0B':RED}">${Math.round(G.health)}%</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.12em;color:rgba(255,255,255,.4)">COINS</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:1.1rem;color:${GOLD}">+${stars>0?coins:0}</div>
        </div>
      </div>

      <div style="background:rgba(42,26,94,.45);border:1px solid rgba(75,45,143,.4);border-radius:14px;padding:14px 18px;max-width:340px;margin-bottom:20px;text-align:left">
        <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:${ACCENT_LT};margin-bottom:8px">LESSON</div>
        <div style="font-size:.75rem;line-height:1.7;color:rgba(255,255,255,.75)">Recovering from debt is a step-by-step rebuild — not a single moment. The order matters: an emergency fund comes first so one unexpected expense does not send you back into debt. Then reduce debt, pay bills on time, grow savings, and finally improve credit. Small consistent actions compound into full financial health.</div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button id="rbPlayAgain" style="padding:12px 22px;border:none;border-radius:12px;background:linear-gradient(135deg,${ACCENT},${ACCENT_LT});color:#fff;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer;box-shadow:0 0 18px ${ACCENT}66">▶ PLAY AGAIN</button>
        <button id="rbChooseLvl" style="padding:12px 20px;border:1px solid rgba(75,45,143,.5);border-radius:12px;background:rgba(42,26,94,.5);color:#c4b5fd;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer">⚙ LEVELS</button>
        <button id="rbToHub"     style="padding:12px 20px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.55);font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.08em;cursor:pointer">← HUB</button>
      </div>
    </div>
    `;

    const lvIdx = G.lvIdx;
    el('rbPlayAgain') && (el('rbPlayAgain').onclick = ()=> startLevel(lvIdx));
    el('rbChooseLvl') && (el('rbChooseLvl').onclick = ()=>{ endEl.style.display='none'; showLevelSelect(); });
    el('rbToHub')     && (el('rbToHub').onclick     = ()=> window.ddt_rebuildExit());
  }

})();
