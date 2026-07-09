/* ════════════════════════════════════════════════════════════════
   SCORE TOWER — G2 CredTech Galaxy mini-game
   Stack credit factor blocks to build your FICO score toward the
   level target. Slide-and-drop mechanic. 3 LEVELS · disjoint block
   pools + facts per level · faster/harder each level.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const START_FICO  = 300;
  let curLevel = 1;

  /* ── Level configs: higher target, less time, faster slide ──── */
  const LEVELS = [
    { n:1, name:'CADET',     target:680, round:90, gateEvery:22, speedStart:0.45, speedStep:0.012, speedCap:0.80 },
    { n:2, name:'PILOT',     target:750, round:75, gateEvery:19, speedStart:0.55, speedStep:0.016, speedCap:0.95 },
    { n:3, name:'COMMANDER', target:800, round:62, gateEvery:16, speedStart:0.65, speedStep:0.020, speedCap:1.15 },
  ];
  function cfgFor(level){ return LEVELS[level-1] || LEVELS[0]; }

  let G = null;

  /* ── Block catalogue — DISJOINT set per level ────────────────── */
  // Level 1 · the core 5 FICO factors (fundamentals)
  const BLOCKS_L1 = [
    { id:'payment',    label:'PAYMENT HISTORY',     pts:+35, color:'#34d399', glow:'#34d399', dark:'#064e3b', weight:4 },
    { id:'utiliz',     label:'CREDIT UTILIZATION',  pts:+30, color:'#38bdf8', glow:'#38bdf8', dark:'#0c4a6e', weight:3 },
    { id:'age',        label:'CREDIT AGE',           pts:+15, color:'#fbbf24', glow:'#fbbf24', dark:'#78350f', weight:3 },
    { id:'mix',        label:'CREDIT MIX',           pts:+10, color:'#a78bfa', glow:'#a78bfa', dark:'#4c1d95', weight:2 },
    { id:'late',       label:'LATE PAYMENT',         pts:-20, color:'#ef4444', glow:'#ef4444', dark:'#7f1d1d', weight:2 },
  ];
  // Level 2 · smart moves vs sneaky traps (new set, harder swings)
  const BLOCKS_L2 = [
    { id:'autopay',    label:'AUTOPAY SET UP',       pts:+28, color:'#34d399', glow:'#34d399', dark:'#064e3b', weight:3 },
    { id:'oldacct',    label:'KEPT OLD ACCOUNT',      pts:+22, color:'#2dd4bf', glow:'#2dd4bf', dark:'#134e4a', weight:3 },
    { id:'inquiry',    label:'NEW INQUIRY',           pts: -14, color:'#fb923c', glow:'#f97316', dark:'#7c2d12', weight:3 },
    { id:'maxcard',    label:'MAXED CARD',            pts:-32, color:'#f43f5e', glow:'#f43f5e', dark:'#881337', weight:3 },
    { id:'fullpay',    label:'PAID FULL BALANCE',     pts:+26, color:'#38bdf8', glow:'#38bdf8', dark:'#0c4a6e', weight:2 },
    { id:'cashadv',    label:'CASH ADVANCE',          pts:-18, color:'#ef4444', glow:'#ef4444', dark:'#7f1d1d', weight:2 },
  ];
  // Level 3 · expert moves vs credit wreckers (biggest swings, fastest pace)
  const BLOCKS_L3 = [
    { id:'freeze',     label:'CREDIT FREEZE SET',     pts:+24, color:'#38bdf8', glow:'#38bdf8', dark:'#0c4a6e', weight:2 },
    { id:'dispute',     label:'DISPUTED ERROR',        pts:+30, color:'#34d399', glow:'#34d399', dark:'#064e3b', weight:2 },
    { id:'mixhealthy',  label:'HEALTHY CREDIT MIX',    pts:+20, color:'#a78bfa', glow:'#a78bfa', dark:'#4c1d95', weight:2 },
    { id:'collections', label:'SENT TO COLLECTIONS',   pts:-40, color:'#f43f5e', glow:'#f43f5e', dark:'#881337', weight:3 },
    { id:'default',     label:'LOAN DEFAULT',          pts:-45, color:'#dc2626', glow:'#dc2626', dark:'#450a0a', weight:3 },
    { id:'idtheft',      label:'IDENTITY THEFT HIT',    pts:-30, color:'#ef4444', glow:'#ef4444', dark:'#7f1d1d', weight:2 },
    { id:'snowball',      label:'DEBT SNOWBALL PLAN',    pts:+28, color:'#fbbf24', glow:'#fbbf24', dark:'#78350f', weight:2 },
  ];
  const BLOCK_SETS = [BLOCKS_L1, BLOCKS_L2, BLOCKS_L3];

  const FACTS_L1 = [
    ['📊','Payment history is the biggest factor — 35% of your FICO score!'],
    ['💳','Keep credit utilization below 30% to protect your score.'],
    ['⏳','Older accounts boost your score — don\'t close them!'],
    ['🔀','Having a mix of credit types (cards + loans) helps your score.'],
    ['❌','One late payment can drop your FICO score by 100+ points.'],
  ];
  const FACTS_L2 = [
    ['📅','Autopay for at least the minimum prevents accidental late payments.'],
    ['🏦','Keeping your oldest account open protects your average credit age.'],
    ['🔍','Too many new credit applications create hard inquiries — limit them.'],
    ['🚨','Maxing out a card spikes your utilization — pay it down fast.'],
    ['💰','Paying your full statement balance avoids interest entirely.'],
    ['🏧','Cash advances start charging interest and fees the moment you take them.'],
  ];
  const FACTS_L3 = [
    ['🧊','A credit freeze blocks identity thieves from opening new accounts in your name.'],
    ['📝','Disputing a report error you didn\'t cause can restore lost points.'],
    ['🧩','A healthy mix of cards + installment loans can nudge your score up.'],
    ['⚠️','Collections accounts can stay on your report for up to 7 years.'],
    ['🧨','Defaulting on a loan is one of the most damaging events for your score.'],
    ['🦹','Identity theft can tank your score fast — freeze and monitor your credit.'],
    ['⛄','A debt snowball (smallest balance first) builds momentum to pay off debt.'],
  ];
  const FACT_SETS = [FACTS_L1, FACTS_L2, FACTS_L3];

  let BLOCKS = BLOCKS_L1, FACTS = FACTS_L1;

  /* ── Weighted random block picker (rebuilt per level) ────────── */
  let BLOCK_POOL = [];
  function buildPool(level){
    BLOCKS = BLOCK_SETS[level-1] || BLOCK_SETS[0];
    FACTS  = FACT_SETS[level-1]  || FACT_SETS[0];
    BLOCK_POOL = [];
    BLOCKS.forEach(b => { for(let i=0;i<b.weight;i++) BLOCK_POOL.push(b); });
  }
  function randBlock(){ return BLOCK_POOL[Math.floor(Math.random()*BLOCK_POOL.length)]; }

  /* ── State ───────────────────────────────────────────────────── */
  function reset(){
    const cfg = cfgFor(curLevel);
    buildPool(curLevel);
    G = {
      phase:'play',
      level: cfg.n,
      cfg: cfg,
      fico: START_FICO,
      time: cfg.round,
      score: 0,
      blocksDropped: 0,
      blocksLanded: 0,
      /* sliding block */
      block: null,
      blockX: 0,        // 0..1 normalized
      blockDir: 1,      // 1=right, -1=left
      blockSpeed: cfg.speedStart, // normalized units/sec
      dropping: false,
      dropY: 0,         // 0..1, animates down
      dropResult: null, // {pts, label, color}
      /* tower: array of landed block records {color,label,pts,h} */
      tower: [],
      /* particles */
      parts: [],
      floats: [],
      /* ui */
      shake: 0, flash: 0, flashColor:'#38bdf8',
      last: 0,
      gateT: cfg.gateEvery, gateIdx: 0,
      /* input gate */
      inputLocked: false,
    };
    spawnBlock();
    updateLevelChrome();
  }

  /* ── Sync top-bar / target chrome to current level (called on
     reset + level-advance since the HTML shell is only built once) ── */
  function updateLevelChrome(){
    if(!G) return;
    const cfg = G.cfg;
    const title = document.getElementById('stTitle');
    if(title) title.textContent = `🏦 SCORE TOWER · LV ${cfg.n}/3`;
    const tEl = document.getElementById('stTime');
    if(tEl) tEl.textContent = cfg.round + 's';
    const targetVal = document.getElementById('stTargetVal');
    if(targetVal) targetVal.textContent = cfg.target;
    const marker = document.getElementById('stTargetMarker');
    if(marker) marker.style.left = ((cfg.target - START_FICO) / (850 - START_FICO) * 100).toFixed(1) + '%';
    const scaleTarget = document.getElementById('stScaleTarget');
    if(scaleTarget) scaleTarget.textContent = cfg.target + ' TARGET';
  }

  /* ── Drop-zone center (normalized) ─────────────────────────── */
  const DROP_CENTER = 0.5;
  const DROP_HALF   = 0.15; // half-width of good zone
  const GREAT_HALF  = 0.055;

  function spawnBlock(){
    if(!G) return;
    const b = randBlock();
    const goLeft = (Math.random() < 0.5);
    G.block     = b;
    G.blockX    = goLeft ? 0.06 : 0.94;
    G.blockDir  = goLeft ? 1 : -1;
    G.dropping  = false;
    G.dropY     = 0;
    G.inputLocked = false;
    // Slightly speed up every block, capped per-level
    const cfg = G.cfg || cfgFor(curLevel);
    G.blockSpeed = Math.min(cfg.speedCap, cfg.speedStart + G.blocksDropped * cfg.speedStep);
  }

  /* ── Screen ─────────────────────────────────────────────────── */
  window.scoretowerInit = function(){ G = null; };

  window.SCREENS.game_scoretower = function(){
    G = null;
    curLevel = 1; // fresh entry from hub always starts at Level 1
    setTimeout(stBoot, 40);
    return `<div id="stWrap" style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,#0a1628,#03040c 60%);overflow:hidden;font-family:'Inter',sans-serif;color:#fff;user-select:none">

      <!-- TOP BAR -->
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:10px;padding:11px 16px;background:linear-gradient(180deg,rgba(3,4,12,.92),transparent)">
        <button onclick="scoretowerExit()" style="padding:7px 13px;border:1px solid rgba(251,191,36,.35);border-radius:9px;background:rgba(251,191,36,.08);color:#fde68a;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.12em;cursor:pointer">← CREDTECH</button>
        <div id="stTitle" style="font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.2em;color:#fbbf24;flex:1;text-align:center">🏦 SCORE TOWER · LV 1/3</div>
        <div id="stTime" style="font-family:'Orbitron',sans-serif;font-size:.85rem;color:#38bdf8;min-width:44px;text-align:right">${LEVELS[0].round}s</div>
      </div>

      <!-- FICO + TARGET -->
      <div style="position:absolute;top:48px;left:0;right:0;z-index:5;padding:0 16px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
          <div>
            <span style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.45)">FICO SCORE</span>
            <span id="stFico" style="font-family:'Orbitron',sans-serif;font-size:1.45rem;font-weight:900;color:#fbbf24;margin-left:8px;text-shadow:0 0 20px rgba(251,191,36,.6)">${START_FICO}</span>
          </div>
          <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.1em;color:rgba(255,255,255,.5)">TARGET: <span id="stTargetVal" style="color:#38bdf8">${LEVELS[0].target}</span></div>
        </div>
        <div style="position:relative;height:12px;border-radius:8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);overflow:visible">
          <div id="stFicoBar" style="height:100%;border-radius:8px;background:linear-gradient(90deg,#fbbf24,#f59e0b);transition:width .35s ease;width:0%"></div>
          <!-- target marker -->
          <div id="stTargetMarker" style="position:absolute;top:-3px;bottom:-3px;width:2px;background:#38bdf8;border-radius:2px;box-shadow:0 0 8px #38bdf8;left:${((LEVELS[0].target-START_FICO)/(850-START_FICO)*100).toFixed(1)}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.36rem;color:rgba(255,255,255,.3);margin-top:2px;letter-spacing:.08em"><span>300</span><span id="stScaleTarget">${LEVELS[0].target} TARGET</span><span>850</span></div>
      </div>

      <!-- CANVAS -->
      <canvas id="stCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>

      <!-- DROP HINT -->
      <div id="stHint" style="position:absolute;left:0;right:0;bottom:14px;text-align:center;z-index:4;font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.13em;color:rgba(255,255,255,.38);pointer-events:none">TAP · CLICK · SPACE to DROP the block</div>

      <!-- FACT TOAST -->
      <div id="stFact" style="position:absolute;left:50%;top:168px;transform:translateX(-50%);z-index:6;max-width:82%;display:none;pointer-events:none"></div>

      <!-- KNOWLEDGE GATE -->
      <div id="stGate" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.88);backdrop-filter:blur(6px);padding:24px"></div>

      <!-- END OVERLAY -->
      <div id="stOver" style="position:absolute;inset:0;z-index:10;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.88);backdrop-filter:blur(4px)"></div>
    </div>`;
  };

  /* ── Boot ────────────────────────────────────────────────────── */
  function stBoot(){
    /* Cancel any running RAF from ANY IIFE instance (shared window global) */
    cancelAnimationFrame(window._stRaf); window._stRaf = null;
    window._stLoopGen = (window._stLoopGen || 0) + 1;
    const myGen = window._stLoopGen;
    const cv = document.getElementById('stCanvas');
    if(!cv) return;
    reset();
    const ctx = cv.getContext('2d');

    function size(){
      cv.width  = cv.clientWidth  * devicePixelRatio;
      cv.height = cv.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    size();
    window.addEventListener('resize', size);

    function onDrop(e){
      if(!G || G.phase !== 'play' || G.dropping || G.inputLocked) return;
      e.preventDefault();
      triggerDrop();
    }
    cv.addEventListener('pointerdown', onDrop);
    function onKey(e){
      if(e.code === 'Space' || e.key === ' '){
        e.preventDefault();
        if(!G || G.phase !== 'play' || G.dropping || G.inputLocked) return;
        triggerDrop();
      }
    }
    document.addEventListener('keydown', onKey);

    G._cleanup = function(){
      window.removeEventListener('resize', size);
      document.removeEventListener('keydown', onKey);
      cv.removeEventListener('pointerdown', onDrop);
    };

    G.last = performance.now();
    function loop(now){
      if(window._stLoopGen !== myGen) return;
      window._stRaf = requestAnimationFrame(loop);
      if(!G) return;
      const dt = Math.min((now - G.last) / 1000, 0.1);
      G.last = now;
      if(G.phase === 'play') update(dt, now);
      render(ctx, cv.clientWidth, cv.clientHeight, now);
    }
    window._stRaf = requestAnimationFrame(loop);
  }

  /* ── Drop trigger ────────────────────────────────────────────── */
  function triggerDrop(){
    if(!G || !G.block) return;
    G.dropping    = true;
    G.dropY       = 0;
    G.inputLocked = true;
    G.blocksDropped++;
  }

  /* ── Update ──────────────────────────────────────────────────── */
  function update(dt, now){
    if(!G) return;

    /* timer */
    G.time -= dt;
    const tEl = document.getElementById('stTime');
    if(tEl){
      const t = Math.max(0, Math.ceil(G.time));
      tEl.textContent = t + 's';
      tEl.style.color = t <= 15 ? '#ef4444' : '#38bdf8';
    }
    if(G.time <= 0){ G.time = 0; return endGame(); }

    /* knowledge gate */
    G.gateT -= dt;
    if(G.gateT <= 0) openGate();

    /* sliding block */
    if(!G.dropping && G.block){
      G.blockX += G.blockDir * G.blockSpeed * dt;
      if(G.blockX > 0.96){ G.blockX = 0.96; G.blockDir = -1; }
      if(G.blockX < 0.04){ G.blockX = 0.04; G.blockDir = 1; }
    }

    /* dropping animation */
    if(G.dropping){
      G.dropY += dt * 2.6;
      if(G.dropY >= 1){
        G.dropY = 1;
        landBlock();
      }
    }

    /* particles + floats */
    for(const p of G.parts){ p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 2.4*dt; p.life -= dt; }
    G.parts = G.parts.filter(p => p.life > 0);
    for(const f of G.floats){ f.y -= dt * 0.09; f.life -= dt; }
    G.floats = G.floats.filter(f => f.life > 0);

    /* decay effects */
    if(G.shake > 0) G.shake -= dt * 3;
    if(G.flash > 0) G.flash -= dt * 3;

    /* FICO bar sync */
    const pct = Math.max(0, Math.min(100, ((G.fico - START_FICO) / (850 - START_FICO)) * 100));
    const bar = document.getElementById('stFicoBar');
    if(bar){ bar.style.width = pct.toFixed(1) + '%'; }

    /* FICO display */
    const fd = document.getElementById('stFico');
    if(fd){ fd.textContent = Math.max(300, Math.min(850, Math.round(G.fico))); }

    /* win check */
    if(G.fico >= G.cfg.target && G.phase === 'play'){ return endGame(); }
  }

  /* ── Land block ─────────────────────────────────────────────── */
  function landBlock(){
    if(!G || !G.block) return;
    const b    = G.block;
    const dist = Math.abs(G.blockX - DROP_CENTER);
    const great = dist < GREAT_HALF;
    const good  = dist < DROP_HALF;

    /* accuracy multiplier */
    let mult = good ? (great ? 1.0 : 0.7) : 0.4;
    let pts  = Math.round(b.pts * mult);
    if(b.pts < 0) pts = b.pts; // penalties are always full

    G.fico = Math.max(300, Math.min(850, G.fico + pts));
    G.score += Math.max(0, pts);
    G.blocksLanded++;

    /* tower record */
    G.tower.push({ color: b.color, label: b.label, pts });

    /* burst */
    burst(G.blockX, 0.82, b.color, pts > 0 ? 20 : 14);

    /* float label */
    const sign = pts >= 0 ? '+' : '';
    floatTxt(G.blockX, 0.78, sign + pts + ' FICO', pts >= 0 ? b.color : '#ef4444', true);
    if(great && pts > 0) floatTxt(G.blockX, 0.72, 'PERFECT!', '#fbbf24', false);

    /* feedback flash */
    G.flash = pts < 0 ? 0.5 : 0.3;
    G.flashColor = pts < 0 ? '#ef4444' : b.color;
    if(pts < 0) G.shake = 0.4;

    /* show inline fact */
    if(Math.random() < 0.28){
      const fRand = FACTS[Math.floor(Math.random() * FACTS.length)];
      showFact(fRand[0] + ' ' + fRand[1]);
    }

    G.dropping = false;
    setTimeout(() => { if(G && G.phase === 'play') spawnBlock(); }, 320);
  }

  /* ── Render ──────────────────────────────────────────────────── */
  function render(ctx, W, H, now){
    ctx.clearRect(0, 0, W, H);

    const shX = G.shake > 0 ? (Math.random()-.5)*G.shake*18 : 0;
    const shY = G.shake > 0 ? (Math.random()-.5)*G.shake*18 : 0;
    ctx.save(); ctx.translate(shX, shY);

    /* ambient star field */
    drawStars(ctx, W, H, now);

    /* drop zone */
    drawDropZone(ctx, W, H, now);

    /* tower */
    drawTower(ctx, W, H, now);

    /* sliding/dropping block */
    if(G.block){
      if(!G.dropping){
        drawBlock(ctx, W, H, G.block, G.blockX, 0.15, 1.0, now);
        /* dashed drop guide */
        drawGuide(ctx, W, H, G.blockX);
      } else {
        const ry = 0.15 + G.dropY * 0.67;
        drawBlock(ctx, W, H, G.block, G.blockX, ry, 1.0, now);
      }
    }

    /* flash overlay */
    if(G.flash > 0){
      ctx.fillStyle = hexA(G.flashColor, G.flash * 0.22);
      ctx.fillRect(0, 0, W, H);
    }

    /* particles */
    for(const p of G.parts){
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x*W, p.y*H, p.s, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* float texts */
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for(const f of G.floats){
      ctx.globalAlpha = Math.max(0, f.life / 0.85);
      ctx.fillStyle = f.c;
      ctx.font = (f.big ? '800 20px' : '700 14px') + " 'Orbitron',sans-serif";
      ctx.shadowColor = f.c; ctx.shadowBlur = 10;
      ctx.fillText(f.t, f.x*W, f.y*H);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  /* ── Draw helpers ────────────────────────────────────────────── */
  function drawStars(ctx, W, H, now){
    if(!G._stars){
      G._stars = [];
      for(let i=0;i<55;i++) G._stars.push({x:Math.random(),y:Math.random(),r:0.4+Math.random()*1.0,sp:0.2+Math.random()*0.8,ph:Math.random()*Math.PI*2});
    }
    for(const s of G._stars){
      const a = 0.12 + 0.08*Math.sin(now*0.001*s.sp + s.ph);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawDropZone(ctx, W, H, now){
    const cx  = DROP_CENTER * W;
    const zoneW = DROP_HALF * 2 * W;
    const y = H * 0.84;
    const ht = H * 0.012;
    const glow = 0.45 + 0.15*Math.sin(now * 0.003);

    /* outer glow zone */
    ctx.save();
    ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 18 * glow;
    const gz = ctx.createLinearGradient(cx - zoneW/2, 0, cx + zoneW/2, 0);
    gz.addColorStop(0,'rgba(251,191,36,0)');
    gz.addColorStop(0.3,'rgba(251,191,36,0.22)');
    gz.addColorStop(0.5,'rgba(251,191,36,0.35)');
    gz.addColorStop(0.7,'rgba(251,191,36,0.22)');
    gz.addColorStop(1,'rgba(251,191,36,0)');
    ctx.fillStyle = gz;
    rr(ctx, cx - zoneW/2, y - ht*2, zoneW, ht*4, 6); ctx.fill();
    ctx.restore();

    /* center line */
    ctx.save();
    ctx.shadowColor='#fbbf24'; ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(251,191,36,0.8)'; ctx.lineWidth = 2;
    ctx.setLineDash([6,4]);
    ctx.beginPath(); ctx.moveTo(cx, y - H*0.5); ctx.lineTo(cx, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* "DROP HERE" label */
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(251,191,36,0.5)';
    ctx.font = "9px 'Orbitron',sans-serif";
    ctx.fillText('DROP', cx, y + ht*4);
  }

  function drawBlock(ctx, W, H, blk, nx, ny, alpha, now){
    const bW = Math.min(W * 0.40, 180);
    const bH = bW * 0.26;
    const x  = nx * W;
    const y  = ny * H;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = blk.glow; ctx.shadowBlur = 20;

    /* body */
    const grad = ctx.createLinearGradient(x - bW/2, y - bH/2, x - bW/2, y + bH/2);
    grad.addColorStop(0, blk.color + 'ee');
    grad.addColorStop(1, blk.dark  + 'cc');
    ctx.fillStyle = grad;
    ctx.strokeStyle = blk.color;
    ctx.lineWidth = 1.8;
    rr(ctx, x - bW/2, y - bH/2, bW, bH, 10);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    /* left accent bar */
    ctx.fillStyle = blk.color;
    rr(ctx, x - bW/2, y - bH/2, 6, bH, 4);
    ctx.fill();

    /* pts badge */
    const sign = blk.pts >= 0 ? '+' : '';
    const badgeW = 48, badgeH = bH * 0.62;
    const bx = x + bW/2 - badgeW - 10;
    const by = y - badgeH/2;
    ctx.fillStyle = blk.pts >= 0 ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.25)';
    rr(ctx, bx, by, badgeW, badgeH, 6); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = blk.pts >= 0 ? '#fff' : '#fca5a5';
    ctx.font = "900 13px 'Orbitron',sans-serif";
    ctx.fillText(sign + blk.pts, bx + badgeW/2, y);

    /* label */
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = "700 11px 'Inter',sans-serif";
    const maxLabelW = bW - badgeW - 42;
    ctx.fillText(truncate(ctx, blk.label, maxLabelW), x - bW/2 + 16, y);

    ctx.restore();
  }

  function drawGuide(ctx, W, H, nx){
    const x  = nx * W;
    const y1 = H * 0.20;
    const y2 = H * 0.84;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3,5]);
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawTower(ctx, W, H, now){
    const towerSlots = 10;
    const blockH     = Math.max(18, H * 0.048);
    const blockGap   = 3;
    const tW         = W * 0.60;
    const baseY      = H * 0.84;
    const cx         = W * DROP_CENTER;

    const recent = G.tower.slice(-towerSlots);
    for(let i = 0; i < recent.length; i++){
      const bt  = recent[i];
      const idx = recent.length - 1 - i; // 0=top, recent.length-1=bottom
      const y   = baseY - idx * (blockH + blockGap) - blockH;
      const shrinkRatio = 1 - idx * 0.025;
      const bW  = tW * Math.max(0.55, shrinkRatio);
      const alpha = Math.max(0.2, 1 - idx * 0.07);

      ctx.save();
      ctx.globalAlpha = alpha;

      const grad = ctx.createLinearGradient(cx - bW/2, y, cx - bW/2, y + blockH);
      grad.addColorStop(0, bt.color + 'cc');
      grad.addColorStop(1, bt.color + '55');
      ctx.fillStyle = grad;
      ctx.strokeStyle = bt.color + '88';
      ctx.lineWidth = 1;
      rr(ctx, cx - bW/2, y, bW, blockH, 5);
      ctx.fill(); ctx.stroke();

      if(i === 0){
        /* topmost block glow */
        ctx.shadowColor = bt.color; ctx.shadowBlur = 16;
        rr(ctx, cx - bW/2, y, bW, blockH, 5); ctx.stroke();
        ctx.shadowBlur = 0;
      }

      /* tiny label on wide enough blocks */
      if(bW > 90){
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = "700 9px 'Inter',sans-serif";
        ctx.fillText(bt.label, cx, y + blockH/2);
      }

      ctx.restore();
    }

    /* ground line */
    ctx.save();
    ctx.strokeStyle = 'rgba(251,191,36,0.4)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(cx - tW*0.55, baseY); ctx.lineTo(cx + tW*0.55, baseY); ctx.stroke();
    ctx.restore();
  }

  /* ── Utilities ───────────────────────────────────────────────── */
  function rr(ctx, x, y, w, h, r){
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
    const n = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
    return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
  }

  function burst(nx, ny, color, n){
    for(let i=0;i<n;i++){
      const a = Math.random()*Math.PI*2;
      const s = 0.12 + Math.random()*0.4;
      G.parts.push({x:nx, y:ny, vx:Math.cos(a)*s, vy:Math.sin(a)*s-0.3, s:2+Math.random()*3, c:color, life:0.6+Math.random()*0.4, max:1.0});
    }
  }

  function floatTxt(nx, ny, t, c, big){
    G.floats.push({x:nx, y:ny, t, c, life:0.85, big:!!big});
  }

  function truncate(ctx, text, maxW){
    if(ctx.measureText(text).width <= maxW) return text;
    while(text.length > 3 && ctx.measureText(text+'…').width > maxW) text = text.slice(0,-1);
    return text + '…';
  }

  /* ── Fact toast ──────────────────────────────────────────────── */
  function showFact(txt){
    const el = document.getElementById('stFact'); if(!el) return;
    el.style.display = 'block';
    el.innerHTML = `<div style="background:rgba(3,4,12,.88);border:1px solid rgba(251,191,36,.5);border-radius:13px;padding:9px 16px;font-size:.8rem;color:#fff;text-align:center;box-shadow:0 8px 28px rgba(0,0,0,.5)">${txt}</div>`;
    clearTimeout(window._stFactT);
    window._stFactT = setTimeout(()=>{ const e=document.getElementById('stFact'); if(e) e.style.display='none'; }, 2400);
  }

  /* ── Knowledge Gate ──────────────────────────────────────────── */
  function openGate(){
    if(!G || G.phase !== 'play') return;
    G.phase = 'gate';
    const f = FACTS[G.gateIdx % FACTS.length]; G.gateIdx++;
    const o = document.getElementById('stGate'); if(!o){ G.phase='play'; G.gateT=G.cfg.gateEvery; return; }
    o.style.display = 'flex';
    o.innerHTML = `<div style="max-width:420px;text-align:center;padding:32px 26px;border:1px solid rgba(251,191,36,.6);border-radius:22px;background:linear-gradient(160deg,rgba(10,6,2,.97),rgba(3,4,12,.97));box-shadow:0 0 60px rgba(251,191,36,.3);animation:stGateIn .32s ease">
      <style>@keyframes stGateIn{0%{transform:scale(.9);opacity:0}100%{transform:scale(1);opacity:1}}</style>
      <div style="font-family:'Orbitron',sans-serif;font-size:.46rem;letter-spacing:.2em;color:#fde68a;margin-bottom:10px">💡 CREDIT KNOWLEDGE GATE</div>
      <div style="font-size:2.6rem;margin-bottom:10px">${f[0]}</div>
      <p style="font-size:1rem;line-height:1.55;color:#fff;margin:0 0 20px">${f[1]}</p>
      <button onclick="stGateGo()" style="padding:13px 32px;border:none;border-radius:12px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#03040c;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.12em;font-weight:900;cursor:pointer">GOT IT → RESUME</button>
    </div>`;
  }

  window.stGateGo = function(){
    if(!G) return;
    G.gateT   = G.cfg.gateEvery;
    G.phase   = 'play';
    G.last    = performance.now();
    const o = document.getElementById('stGate');
    if(o){ o.style.display='none'; o.innerHTML=''; }
    floatTxt(0.5, 0.45, '+KNOWLEDGE!', '#fbbf24', false);
  };

  /* ── End game ────────────────────────────────────────────────── */
  function endGame(){
    if(!G || G.phase === 'over') return;
    G.phase = 'over';

    const cfg    = G.cfg;
    const fico   = Math.max(300, Math.min(850, Math.round(G.fico)));
    const stars  = fico >= cfg.target ? 3 : fico >= (cfg.target - 120) ? 2 : 1;
    const won    = fico >= cfg.target;
    const isFinalLevel = curLevel >= LEVELS.length;
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_scoretower', { level: curLevel, stars, is3star, isPerfect: won && is3star && isFinalLevel, badge: 'Score Tower Master' })
      : (stars===3?150:stars===2?100:50);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('credtech_trust', stars*4);
    if(window.state){
      if(stars < 1 && window.cvSave) cvSave();
      state.gamesDone = state.gamesDone||{};
      state.gamesDone['credtech:scoretower'] = Math.max(state.gamesDone['credtech:scoretower']||0, stars);
    }

    const starStr  = '⭐'.repeat(stars) + '☆'.repeat(3-stars);
    const accentC  = won ? '#fbbf24' : fico >= (cfg.target - 120) ? '#38bdf8' : '#ef4444';
    const headline = won ? (isFinalLevel ? 'MISSION ACCOMPLISHED!' : 'TARGET REACHED!') : fico >= (cfg.target - 120) ? 'GOOD SCORE!' : 'NICE TRY! POWER UP AND TRY AGAIN';
    const emoji    = won ? '🏆' : fico >= (cfg.target - 120) ? '📈' : '🔧';
    const canAdvance = won && stars >= 1 && !isFinalLevel;

    const o = document.getElementById('stOver'); if(!o) return;
    o.style.display = 'flex';
    o.innerHTML = `<div style="max-width:440px;width:90%;text-align:center;padding:34px 26px;border:1px solid ${accentC}44;border-radius:24px;background:linear-gradient(160deg,rgba(10,8,2,.98),rgba(3,4,12,.98));box-shadow:0 0 70px ${hexA(accentC,0.35)};animation:stOverIn .4s ease">
      <style>@keyframes stOverIn{0%{transform:translateY(30px);opacity:0}100%{transform:translateY(0);opacity:1}}</style>
      <div style="font-size:3rem;margin-bottom:6px">${emoji}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.18em;color:rgba(255,255,255,.4);margin-bottom:4px">LEVEL ${curLevel} · ${cfg.name}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.22em;color:${accentC};margin-bottom:10px">${headline}</div>
      <div style="font-size:1.8rem;margin-bottom:4px">${starStr}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:2.6rem;font-weight:900;color:#fbbf24;text-shadow:0 0 30px rgba(251,191,36,.6);line-height:1.1;margin-bottom:2px">${fico}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.12em;color:rgba(255,255,255,.45);margin-bottom:18px">FINAL FICO SCORE · TARGET WAS ${cfg.target}</div>
      <div style="background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.2);border-radius:13px;padding:13px 16px;margin-bottom:18px;text-align:left">
        <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:#fde68a;margin-bottom:7px">📚 CREDIT LESSON</div>
        <p style="margin:0;font-size:.88rem;line-height:1.55;color:rgba(255,255,255,.85)">Your credit score is built by <strong style="color:#fbbf24">5 factors</strong> — payment history matters most at <strong style="color:#34d399">35%</strong>, followed by utilization (30%), credit age (15%), credit mix (10%), and new inquiries (10%). Pay on time, keep balances low!</p>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:18px">
        <span style="font-size:1.2rem">🪙</span>
        <span style="font-family:'Orbitron',sans-serif;font-size:1rem;font-weight:900;color:#fbbf24">+${coins} COINS EARNED</span>
      </div>
      ${canAdvance ? `<button onclick="stNextLevel()" style="width:100%;margin-bottom:10px;padding:14px;border:none;border-radius:13px;background:linear-gradient(90deg,#fbbf24,#f59e0b);color:#1a0d00;font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.1em;font-weight:900;cursor:pointer">LEVEL ${curLevel+1} · ${LEVELS[curLevel].name} ▶</button>` : ''}
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button onclick="stRestart()" style="padding:13px 26px;border:none;border-radius:13px;background:${canAdvance?'rgba(255,255,255,.08)':'linear-gradient(135deg,#fbbf24,#f59e0b)'};color:${canAdvance?'#fff':'#03040c'};font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.1em;font-weight:900;cursor:pointer;border:${canAdvance?'1px solid rgba(255,255,255,.2)':'none'}">↺ ${canAdvance ? 'REPLAY LEVEL' : 'PLAY AGAIN'}</button>
        <button onclick="scoretowerExit()" style="padding:13px 26px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
      </div>
    </div>`;
  }

  window.stNextLevel = function(){
    if(curLevel >= LEVELS.length) return;
    curLevel++;
    window.stRestart();
  };

  window.stRestart = function(){
    ['stOver','stGate'].forEach(id=>{const o=document.getElementById(id);if(o){o.style.display='none';o.innerHTML='';}});
    const ft=document.getElementById('stFact'); if(ft) ft.style.display='none';
    reset();
    G.last = performance.now();
  };

  window.scoretowerExit = function(){
    if(G && G._cleanup) G._cleanup();
    cancelAnimationFrame(window._stRaf); window._stRaf = null;
    window._stLoopGen = (window._stLoopGen || 0) + 1; // kill any running loop
    clearTimeout(window._stFactT); window._stFactT = null;
    G = null;
    curLevel = 1;
    if(window.state) state.viewingWorld = 'credtech';
    goTo('credtech_hub');
  };

  /* ── QA debug hook ──────────────────────────────────────────── */
  window._stDbg = function(){ return G ? { level: G.level, curLevel, fico: G.fico, target: G.cfg.target, time: G.time, phase: G.phase } : null; };
  window._stForceWin = function(){ if(!G) return; G.fico = G.cfg.target; };

})();
