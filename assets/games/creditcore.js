/* ════════════════════════════════════════════════════════════════
   G1 CREDIT CORE — CredTech Galaxy mini-game
   Sort + Catch mechanic. "What credit is & how it works."
   3 LEVELS · disjoint item pools per level · Combo multiplier up to 8x
   ════════════════════════════════════════════════════════════════ */
(function(){
  let G = null, raf = null, _onKey = null, _onResize = null;
  let curLevel = 1;

  /* ── Level configs: more items, less time per item, higher bars ─ */
  const LEVELS = [
    { n:1, name:'CADET',     time:90, itemDur:3.0, star3:1800, star2:1200 },
    { n:2, name:'PILOT',     time:80, itemDur:2.3, star3:2200, star2:1500 },
    { n:3, name:'COMMANDER', time:70, itemDur:1.8, star3:2600, star2:1800 },
  ];

  /* ── Item definitions — DISJOINT pool per level ─────────────── */
  // LEVEL 1 · the basics (8 good + 8 bad)
  const GOOD_L1 = [
    { e:'💳', label:'Credit Card',       sub:'Responsible use' },
    { e:'🏠', label:'Mortgage',           sub:'Builds equity' },
    { e:'🎓', label:'Student Loan',       sub:'Invests in future' },
    { e:'🚗', label:'Auto Loan',          sub:'Essential asset' },
    { e:'✅', label:'Paid Bill On Time',  sub:'Boosts history' },
    { e:'📉', label:'Low Balance',        sub:'Good utilization' },
    { e:'🛟', label:'Emergency Fund',     sub:'Financial safety net' },
    { e:'⏰', label:'On-Time Payment',   sub:'35% of FICO score' },
  ];
  const BAD_L1 = [
    { e:'⚠️', label:'Collections',       sub:'Serious damage' },
    { e:'🕐', label:'Late Payment',       sub:'Drops score fast' },
    { e:'💸', label:'Bankruptcy',         sub:'Stays 7-10 years' },
    { e:'🔴', label:'Maxed Out Card',     sub:'High utilization' },
    { e:'💀', label:'Payday Loan',        sub:'Predatory rates' },
    { e:'❌', label:'Missed Payment',     sub:'Hurts history' },
    { e:'📈', label:'High APR Debt',      sub:'Costs you more' },
    { e:'🦹', label:'Identity Theft',     sub:'Credit destroyer' },
  ];
  // LEVEL 2 · smart habits vs sneaky traps (9 good + 9 bad)
  const GOOD_L2 = [
    { e:'💰', label:'Paying Full Balance',    sub:'Zero interest charged' },
    { e:'📅', label:'Autopay Set Up',         sub:'Never miss a due date' },
    { e:'🧾', label:'Reading Statements',     sub:'Catches errors early' },
    { e:'🏦', label:'Keeping Old Account',    sub:'Long history helps' },
    { e:'🎯', label:'Budget Before Buying',   sub:'Spend with a plan' },
    { e:'🔍', label:'Free Credit Report',     sub:'Check it every year' },
    { e:'🧮', label:'Paying Over Minimum',    sub:'Shrinks debt faster' },
    { e:'🔒', label:'Strong Passwords',       sub:'Protects your identity' },
    { e:'💳', label:'One Starter Card',       sub:'Easy to manage' },
  ];
  const BAD_L2 = [
    { e:'🛒', label:'Impulse Spree',          sub:'Debt for forgotten stuff' },
    { e:'📬', label:'Ignoring Bills',         sub:'Problems grow bigger' },
    { e:'🃏', label:'5 New Cards At Once',    sub:'Too many hard checks' },
    { e:'🎰', label:'Borrowing To Gamble',    sub:'Risky and costly' },
    { e:'🫥', label:'Co-signing Blindly',     sub:'Their miss hurts you' },
    { e:'🐌', label:'Minimum Pay Forever',    sub:'Interest piles up' },
    { e:'🙈', label:'Never Checking Report',  sub:'Errors go unfixed' },
    { e:'🏧', label:'Cash Advance Habit',     sub:'Fees start day one' },
    { e:'🕳️', label:'Hiding Debt',           sub:'Small problems grow' },
  ];
  // LEVEL 3 · expert moves vs credit wreckers (10 good + 10 bad)
  const GOOD_L3 = [
    { e:'🧊', label:'Credit Freeze',          sub:'Blocks thieves fast' },
    { e:'🧩', label:'Healthy Credit Mix',     sub:'Different loan types' },
    { e:'🛡️', label:'Fraud Alerts On',       sub:'Extra protection' },
    { e:'⛄', label:'Debt Snowball Plan',     sub:'Smallest debt first' },
    { e:'🤝', label:'Trusted Authorized User',sub:'Learning wheels on' },
    { e:'💼', label:'Secured Card Start',     sub:'Deposit builds trust' },
    { e:'🗓️', label:'Paying Days Early',     sub:'Extra safe timing' },
    { e:'📝', label:'Disputing Errors',       sub:'Fix report mistakes' },
    { e:'🔎', label:'Reading Fine Print',     sub:'Know fees first' },
    { e:'⚖️', label:'Borrowing Within Limits',sub:'Only what you can repay' },
  ];
  const BAD_L3 = [
    { e:'🎣', label:'Clicking Phishing Links',sub:'Scammers steal data' },
    { e:'🏎️', label:'Loan Beyond Budget',    sub:'Payments you cannot make' },
    { e:'🧨', label:'Skipping Loan Payments', sub:'Default wrecks credit' },
    { e:'🌀', label:'New Debt For Old Debt',  sub:'The debt spiral' },
    { e:'🖊️', label:'Signing Without Reading',sub:'Hidden fees bite' },
    { e:'👥', label:'Sharing Card Online',    sub:'Big fraud risk' },
    { e:'🏚️', label:'Foreclosure',           sub:'Stays 7 years' },
    { e:'📵', label:'Dodging Collector Calls',sub:'Problems never vanish' },
    { e:'🏬', label:'Store Card Everywhere',  sub:'High APR traps' },
    { e:'⌛', label:'Paying Only If Reminded',sub:'Late marks add up' },
  ];
  const POOLS = [
    { good: GOOD_L1, bad: BAD_L1 },
    { good: GOOD_L2, bad: BAD_L2 },
    { good: GOOD_L3, bad: BAD_L3 },
  ];

  /* ── Build a shuffled queue — full pool, shuffle-bag, no repeats ─ */
  function buildQueue(level){
    const pool = POOLS[level-1] || POOLS[0];
    const sh=arr=>{ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; };
    const q = [
      ...pool.good.map(it=>({...it,correct:'good'})),
      ...pool.bad.map(it=>({...it,correct:'bad'})),
    ];
    return sh(q);
  }

  /* ── State factory ──────────────────────────────────────────── */
  function newGame(level){
    const L = LEVELS[level-1] || LEVELS[0];
    return {
      phase:'play',
      level: L.n,
      cfg: L,
      queue: buildQueue(L.n),
      idx:0,
      score:0,
      combo:0,
      comboMult:1,
      timeLeft: L.time,
      totalTime: L.time,
      itemTimer:0,
      ITEM_DURATION: L.itemDur,
      last:0,
      // flash animation state
      flashT:0,
      flashColor:'#38bdf8',
      floats:[], // floating score texts
    };
  }

  /* ── Screen entry point ────────────────────────────────────── */
  window.SCREENS.game_creditcore = function(){
    G = null;
    curLevel = 1;
    setTimeout(initGame, 40);
    return `<div id="ccRoot" style="position:absolute;inset:0;background:#03040c;overflow:hidden;font-family:'Inter',sans-serif;color:#fff;user-select:none;-webkit-user-select:none">

      <!-- Stars background -->
      <canvas id="ccStars" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.6"></canvas>

      <!-- Top bar -->
      <div style="position:absolute;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;padding:14px 16px;gap:10px;background:linear-gradient(180deg,rgba(3,4,12,.9) 60%,transparent)">
        <button onclick="creditCoreExit()" style="padding:7px 13px;border:1px solid rgba(56,189,248,.35);border-radius:9px;background:rgba(56,189,248,.1);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer;white-space:nowrap">← HUB</button>
        <div id="ccTitle" style="font-family:'Orbitron',sans-serif;font-size:.65rem;letter-spacing:.18em;color:#38bdf8;flex:1;text-align:center;text-shadow:0 0 12px rgba(56,189,248,.5)">💳 CREDIT CORE · LV 1</div>
        <button onclick="ccShowHelp()" title="How to play" style="padding:7px 10px;border:1px solid rgba(56,189,248,.35);border-radius:9px;background:rgba(56,189,248,.1);color:#7dd3fc;cursor:pointer;font-size:.8rem">❓</button>
        <div id="ccScoreDisplay" style="font-family:'Orbitron',sans-serif;font-size:.82rem;color:#fbbf24;min-width:70px;text-align:right;text-shadow:0 0 10px rgba(251,191,36,.4)">0</div>
      </div>

      <div style="position:absolute;top:46px;left:0;right:0;z-index:10;text-align:center;font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.08em;color:rgba(56,189,248,.5)">💡 Sort each item: GOOD for credit, or BAD — tap a button or press ← →</div>

      <!-- Timer bar -->
      <div style="position:absolute;top:64px;left:0;right:0;z-index:10;padding:0 16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <div id="ccTimerTxt" style="font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;color:rgba(56,189,248,.8)">90s</div>
          <div id="ccProgress" style="font-family:'Orbitron',sans-serif;font-size:.52rem;letter-spacing:.1em;color:rgba(255,255,255,.35)">0 / 20</div>
        </div>
        <div style="height:5px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden">
          <div id="ccTimerBar" style="height:100%;width:100%;background:linear-gradient(90deg,#38bdf8,#0ea5e9);border-radius:3px;transition:width .1s linear;box-shadow:0 0 8px rgba(56,189,248,.5)"></div>
        </div>
      </div>

      <!-- Item timer ring -->
      <div style="position:absolute;top:92px;left:0;right:0;z-index:8;display:flex;justify-content:center">
        <svg id="ccRingSvg" width="64" height="64" viewBox="0 0 64 64" style="transform:rotate(-90deg)">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(56,189,248,.1)" stroke-width="4"/>
          <circle id="ccRingArc" cx="32" cy="32" r="28" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"
            stroke-dasharray="175.9" stroke-dashoffset="0" style="transition:stroke-dashoffset .08s linear;filter:drop-shadow(0 0 4px #38bdf8)"/>
        </svg>
      </div>

      <!-- Main canvas for card -->
      <canvas id="ccCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>

      <!-- Combo display -->
      <div id="ccCombo" style="position:absolute;bottom:130px;left:0;right:0;text-align:center;z-index:9;font-family:'Orbitron',sans-serif;font-size:.75rem;letter-spacing:.18em;color:#fbbf24;opacity:0;transition:opacity .3s;text-shadow:0 0 16px rgba(251,191,36,.6)">1x COMBO</div>

      <!-- Sort buttons -->
      <div style="position:absolute;bottom:24px;left:0;right:0;z-index:10;display:flex;gap:14px;padding:0 20px;justify-content:center">
        <button id="ccBtnGood" onclick="ccSort('good')" style="flex:1;max-width:180px;padding:18px 12px;border:2px solid rgba(52,211,153,.5);border-radius:18px;background:rgba(52,211,153,.1);color:#34d399;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.12em;cursor:pointer;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:5px;box-shadow:0 0 20px rgba(52,211,153,.15)">
          <span style="font-size:1.5rem">✅</span>
          <span>GOOD CREDIT</span>
        </button>
        <button id="ccBtnBad" onclick="ccSort('bad')" style="flex:1;max-width:180px;padding:18px 12px;border:2px solid rgba(239,68,68,.5);border-radius:18px;background:rgba(239,68,68,.1);color:#ef4444;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.12em;cursor:pointer;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:5px;box-shadow:0 0 20px rgba(239,68,68,.15)">
          <span style="font-size:1.5rem">❌</span>
          <span>BAD CREDIT</span>
        </button>
      </div>

      <!-- Overlays -->
      <div id="ccGate" style="position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.88);backdrop-filter:blur(6px)"></div>
      <div id="ccOver" style="position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.92);backdrop-filter:blur(8px)"></div>
      <!-- HOW TO PLAY overlay (shown once at start, reopened via ❓; reuses the ccGate slot) -->
      <div id="ccHelp" style="position:absolute;inset:0;z-index:25;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.9);backdrop-filter:blur(6px);padding:20px;box-sizing:border-box"></div>
    </div>`;
  };

  /* ── Init ──────────────────────────────────────────────────── */
  function initGame(){
    const canvas = document.getElementById('ccCanvas');
    if(!canvas){ return; }
    const starsCanvas = document.getElementById('ccStars');

    // draw star field
    if(starsCanvas){
      const sc = starsCanvas.getContext('2d');
      starsCanvas.width = starsCanvas.clientWidth * devicePixelRatio;
      starsCanvas.height = starsCanvas.clientHeight * devicePixelRatio;
      sc.scale(devicePixelRatio, devicePixelRatio);
      const W = starsCanvas.clientWidth, H = starsCanvas.clientHeight;
      for(let i=0; i<120; i++){
        const x=Math.random()*W, y=Math.random()*H, r=Math.random()*1.2+.2, a=Math.random()*.7+.1;
        sc.beginPath(); sc.arc(x,y,r,0,Math.PI*2);
        sc.fillStyle=`rgba(56,189,248,${a})`; sc.fill();
      }
      for(let i=0; i<40; i++){
        const x=Math.random()*W, y=Math.random()*H, r=Math.random()*.6+.1, a=Math.random()*.4+.05;
        sc.beginPath(); sc.arc(x,y,r,0,Math.PI*2);
        sc.fillStyle=`rgba(251,191,36,${a})`; sc.fill();
      }
    }

    G = newGame(curLevel);
    G.last = performance.now();
    G.itemTimer = G.ITEM_DURATION; // start with item visible
    G.phase = 'help';   // hold on the tutorial before the first item starts ticking
    updateTitleBadge();

    const ctx = canvas.getContext('2d');
    function resize(){
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    }
    resize();
    _onResize = resize;
    window.addEventListener('resize', _onResize);

    // keyboard support
    _onKey = e => {
      if(!G || G.phase !== 'play') return;
      if(e.key === 'ArrowLeft' || e.key==='a' || e.key==='A') { ccSort('good'); e.preventDefault(); }
      if(e.key === 'ArrowRight' || e.key==='d' || e.key==='D') { ccSort('bad'); e.preventDefault(); }
    };
    window.addEventListener('keydown', _onKey);

    function loop(now){
      raf = requestAnimationFrame(loop);
      if(!G || G.phase !== 'play') return;
      const dt = Math.min((now - G.last) / 1000, 0.1);
      G.last = now; G.now = now;
      tick(dt, canvas.clientWidth, canvas.clientHeight, ctx);
    }
    raf = requestAnimationFrame(loop);

    showHowToPlay(true);
  }

  /* ── how-to-play intro (shown once at start) + ❓ re-open mid-game ──
     G.phase is held at 'help' (not 'play') while this is up, so the rAF
     loop above never advances G.last — no time is lost or double-counted. ── */
  function showHowToPlay(firstTime){
    const help = document.getElementById('ccHelp');
    if(!help || !G) return;
    help.style.display = 'flex';
    help.innerHTML = `
      <div style="max-width:360px;width:100%;text-align:center;padding:26px 22px;background:linear-gradient(160deg,rgba(3,4,12,.97),rgba(14,30,50,.97));border:1px solid rgba(56,189,248,.4);border-radius:20px;box-shadow:0 0 50px rgba(56,189,248,.2)">
        <div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.2em;color:#38bdf8;margin-bottom:10px">HOW TO PLAY</div>
        <div style="font-size:2rem;margin-bottom:8px">💳</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:1rem;margin-bottom:14px;color:#fff">CREDIT CORE</div>
        <ul style="text-align:left;font-size:.78rem;color:#ddd;line-height:1.65;margin:0 0 18px;padding-left:18px">
          <li>A card appears — decide if it's GOOD or BAD for credit before the ring around it runs out.</li>
          <li>Tap a button, or use the ← → arrow keys (or A / D).</li>
          <li>Sort in a row to build your COMBO multiplier and score way more per card.</li>
          <li>Each of the 3 levels gives you less time per card — stay sharp!</li>
          <li>Your final score decides your stars and coins at the end.</li>
        </ul>
        <button id="ccHelpBtn" style="padding:13px 30px;border:none;border-radius:11px;background:linear-gradient(90deg,#38bdf8,#0ea5e9);color:#031017;font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.12em;font-weight:900;cursor:pointer">${firstTime ? 'GOT IT — START ▶' : '▶ RESUME'}</button>
      </div>`;
    const btn = document.getElementById('ccHelpBtn');
    if(btn) btn.onclick = () => {
      help.style.display = 'none';
      if(!G) return;
      G.last = performance.now();   // reset the frame clock so the next dt is ~0, not the whole paused span
      G.phase = 'play';
    };
  }
  window.ccShowHelp = function(){
    if(!G || G.phase !== 'play') return;
    G.phase = 'help';
    showHowToPlay(false);
  };

  /* ── Main tick ─────────────────────────────────────────────── */
  function tick(dt, W, H, ctx){
    // count down game timer
    G.timeLeft -= dt;
    if(G.timeLeft <= 0){ G.timeLeft = 0; endGame(); return; }

    // item timer
    G.itemTimer -= dt;
    if(G.itemTimer <= 0){
      // time expired on this item — treat as wrong answer
      if(G.idx < G.queue.length){
        onWrong();
        advanceItem();
      }
    }

    // update floats
    G.floats = G.floats.filter(f=>{
      f.t -= dt;
      f.y -= 60 * dt;
      f.alpha = Math.min(1, f.t / 0.4);
      return f.t > 0;
    });

    // update HUD
    const bar = document.getElementById('ccTimerBar');
    if(bar) bar.style.width = (G.timeLeft / 90 * 100) + '%';
    const txt = document.getElementById('ccTimerTxt');
    if(txt) txt.textContent = Math.ceil(G.timeLeft) + 's';
    const prog = document.getElementById('ccProgress');
    if(prog) prog.textContent = G.idx + ' / 20';
    const scoreEl = document.getElementById('ccScoreDisplay');
    if(scoreEl) scoreEl.textContent = G.score;

    // item ring
    const arc = document.getElementById('ccRingArc');
    if(arc){
      const frac = Math.max(0, G.itemTimer / G.ITEM_DURATION);
      const circ = 2 * Math.PI * 28;
      arc.setAttribute('stroke-dashoffset', circ * (1 - frac));
      arc.setAttribute('stroke', frac > 0.4 ? '#38bdf8' : frac > 0.2 ? '#fbbf24' : '#ef4444');
    }

    // draw
    _ccDrawBg(ctx, W, H, G.now || 0);
    if(G.idx < G.queue.length) drawCard(ctx, W, H);
    drawFloats(ctx, W, H);
  }

  /* ── Draw card ─────────────────────────────────────────────── */
  const _ccStars=Array.from({length:50},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.1+0.2,s:Math.random()*0.5+0.2}));
  function _ccDrawBg(ctx,W,H,now){
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#030d1f'); bg.addColorStop(0.5,'#051428'); bg.addColorStop(1,'#071c12');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    // scrolling hex-grid dots
    const t=now/1000;
    for(const st of _ccStars){
      const tw=0.35+0.4*Math.sin(t*st.s+st.x*6.28);
      ctx.globalAlpha=tw*0.55; ctx.fillStyle='#38bdf8';
      ctx.beginPath(); ctx.arc(st.x*W,st.y*H*0.75,st.r,0,6.28); ctx.fill();
    }
    ctx.globalAlpha=1;
    // center radial ambient
    const cg=ctx.createRadialGradient(W/2,H*0.44,0,W/2,H*0.44,W*0.55);
    cg.addColorStop(0,'rgba(56,189,248,.07)'); cg.addColorStop(1,'transparent');
    ctx.fillStyle=cg; ctx.fillRect(0,0,W,H);
    // subtle floor gradient
    const fg=ctx.createLinearGradient(0,H*0.8,0,H);
    fg.addColorStop(0,'transparent'); fg.addColorStop(1,'rgba(56,189,248,.06)');
    ctx.fillStyle=fg; ctx.fillRect(0,H*0.8,W,H*0.2);
  }

  function drawCard(ctx, W, H){
    const item = G.queue[G.idx];
    const cx = W / 2, cy = H * 0.44;
    const cw = Math.min(W - 48, 300), ch = 180;

    // flash effect
    let flashAlpha = 0, flashColor = '#38bdf8';
    if(G.flashT > 0){
      G.flashT -= 0.016;
      flashAlpha = Math.max(0, G.flashT / 0.35);
      flashColor = G.flashColor;
    }

    ctx.save();
    // card glow
    const glow = flashAlpha > 0 ? flashColor : '#38bdf8';
    ctx.shadowColor = glow;
    ctx.shadowBlur = 24 + flashAlpha * 30;

    // card background
    const grad = ctx.createLinearGradient(cx - cw/2, cy - ch/2, cx + cw/2, cy + ch/2);
    if(flashAlpha > 0 && flashColor === '#34d399'){
      grad.addColorStop(0, `rgba(52,211,153,${0.22 + flashAlpha * 0.3})`);
      grad.addColorStop(1, `rgba(16,185,129,${0.12 + flashAlpha * 0.15})`);
    } else if(flashAlpha > 0 && flashColor === '#ef4444'){
      grad.addColorStop(0, `rgba(239,68,68,${0.22 + flashAlpha * 0.3})`);
      grad.addColorStop(1, `rgba(185,28,28,${0.12 + flashAlpha * 0.15})`);
    } else {
      grad.addColorStop(0, 'rgba(56,189,248,0.14)');
      grad.addColorStop(1, 'rgba(14,165,233,0.07)');
    }

    const r = 22;
    ctx.beginPath();
    ctx.moveTo(cx - cw/2 + r, cy - ch/2);
    ctx.lineTo(cx + cw/2 - r, cy - ch/2);
    ctx.arcTo(cx + cw/2, cy - ch/2, cx + cw/2, cy - ch/2 + r, r);
    ctx.lineTo(cx + cw/2, cy + ch/2 - r);
    ctx.arcTo(cx + cw/2, cy + ch/2, cx + cw/2 - r, cy + ch/2, r);
    ctx.lineTo(cx - cw/2 + r, cy + ch/2);
    ctx.arcTo(cx - cw/2, cy + ch/2, cx - cw/2, cy + ch/2 - r, r);
    ctx.lineTo(cx - cw/2, cy - ch/2 + r);
    ctx.arcTo(cx - cw/2, cy - ch/2, cx - cw/2 + r, cy - ch/2, r);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // card border
    ctx.strokeStyle = flashAlpha > 0 ? flashColor : 'rgba(56,189,248,0.5)';
    ctx.lineWidth = 1.5 + flashAlpha * 1.5;
    ctx.stroke();
    ctx.restore();

    // emoji
    const emojiSize = Math.min(64, cw * 0.22);
    ctx.font = `${emojiSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.e, cx, cy - 28);

    // label
    ctx.font = `700 ${Math.min(18, cw * 0.065)}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, cx, cy + 26);

    // sub label
    ctx.font = `400 ${Math.min(12, cw * 0.042)}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(148,163,184,0.85)';
    ctx.fillText(item.sub, cx, cy + 52);
  }

  /* ── Draw floating score texts ─────────────────────────────── */
  function drawFloats(ctx, W, H){
    for(const f of G.floats){
      ctx.save();
      ctx.globalAlpha = f.alpha;
      ctx.font = `700 ${f.size}px Orbitron, sans-serif`;
      ctx.fillStyle = f.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 12;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  /* ── Sort action (called from buttons or keyboard) ─────────── */
  window.ccSort = function(choice){
    if(!G || G.phase !== 'play') return;
    if(G.idx >= G.queue.length) return;

    const item = G.queue[G.idx];
    if(choice === item.correct){
      onCorrect(item);
    } else {
      onWrong();
    }
    advanceItem();
  };

  function onCorrect(item){
    G.combo++;
    G.comboMult = Math.min(8, 1 + Math.floor(G.combo / 2));
    const pts = 100 * G.comboMult;
    G.score += pts;

    // flash green
    G.flashColor = '#34d399';
    G.flashT = 0.35;

    // floating text
    const W = document.getElementById('ccCanvas')?.clientWidth || 320;
    const H = document.getElementById('ccCanvas')?.clientHeight || 600;
    const comboText = G.comboMult > 1 ? `+${pts} x${G.comboMult} COMBO!` : `+${pts}`;
    G.floats.push({ text: comboText, x: W/2, y: H*0.44 - 90, color:'#34d399', alpha:1, t:0.9, size: G.comboMult > 1 ? 17 : 14 });

    // pulse button
    pulseBtn('ccBtnGood');
    updateComboDisplay();
  }

  function onWrong(){
    G.score = Math.max(0, G.score - 50);
    G.combo = 0;
    G.comboMult = 1;

    G.flashColor = '#ef4444';
    G.flashT = 0.35;

    const W = document.getElementById('ccCanvas')?.clientWidth || 320;
    const H = document.getElementById('ccCanvas')?.clientHeight || 600;
    G.floats.push({ text:'-50', x: W/2, y: H*0.44 - 90, color:'#ef4444', alpha:1, t:0.7, size:14 });

    pulseBtn('ccBtnBad');
    updateComboDisplay();
  }

  function advanceItem(){
    G.idx++;
    G.itemTimer = G.ITEM_DURATION;
    if(G.idx >= G.queue.length){
      // all 20 done
      setTimeout(endGame, 400);
    }
  }

  function updateComboDisplay(){
    const el = document.getElementById('ccCombo');
    if(!el) return;
    if(G.comboMult > 1){
      el.textContent = `${G.comboMult}x COMBO`;
      el.style.opacity = '1';
      el.style.transform = 'scale(1.15)';
      setTimeout(()=>{ if(el){ el.style.transform='scale(1)'; } }, 150);
    } else {
      el.style.opacity = '0';
    }
  }

  function pulseBtn(id){
    const el = document.getElementById(id);
    if(!el) return;
    el.style.transform = 'scale(0.93)';
    el.style.transition = 'transform .1s';
    setTimeout(()=>{ if(el){ el.style.transform='scale(1)'; } }, 120);
  }

  /* ── End game ──────────────────────────────────────────────── */
  function updateTitleBadge(){
    const el = document.getElementById('ccTitle');
    if(el) el.textContent = `💳 CREDIT CORE · LV ${curLevel}/3`;
  }

  function endGame(){
    if(!G || G.phase === 'end') return;
    G.phase = 'end';
    cancelAnimationFrame(raf); raf = null;

    const score = G.score;
    const cfg = G.cfg || LEVELS[0];
    const stars = score >= cfg.star3 ? 3 : score >= cfg.star2 ? 2 : score >= 1 ? 1 : 0;
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_creditcore', { level: G.level, stars, is3star, isPerfect: is3star, badge: 'Credit Master' })
      : (stars===3 ? 150 : stars===2 ? 100 : 50);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('credtech_trust', stars*4);
    if (stars < 1 && window.cvSave) cvSave();

    // build stars HTML
    const starHTML = [1,2,3].map(i => `<span style="font-size:2.2rem;opacity:${i<=stars?'1':'0.2'};filter:${i<=stars?'drop-shadow(0 0 10px #fbbf24)':'none'};transition:all .4s ${i*0.15}s">⭐</span>`).join('');

    const el = document.getElementById('ccOver');
    if(!el) return;
    el.style.display = 'flex';
    el.innerHTML = `
      <div style="max-width:360px;width:90%;text-align:center;padding:28px 24px;border:1px solid rgba(56,189,248,.3);border-radius:24px;background:linear-gradient(160deg,rgba(3,4,12,.95),rgba(14,30,50,.95));box-shadow:0 0 60px rgba(56,189,248,.15),inset 0 0 40px rgba(56,189,248,.04)">

        <div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.22em;color:#38bdf8;margin-bottom:10px;text-shadow:0 0 10px rgba(56,189,248,.5)">${curLevel>=3?'👑 ALL 3 LEVELS MASTERED!':`LEVEL ${curLevel} · COMPLETE`}</div>

        <div style="display:flex;justify-content:center;gap:6px;margin:10px 0 16px">${starHTML}</div>

        <div style="font-family:'Orbitron',sans-serif;font-size:2.4rem;color:#fbbf24;margin:4px 0;text-shadow:0 0 20px rgba(251,191,36,.5);font-variant-numeric:tabular-nums">${score.toLocaleString()}</div>
        <div style="font-family:'Inter',sans-serif;font-size:.72rem;color:rgba(255,255,255,.45);letter-spacing:.08em;margin-bottom:18px">FINAL SCORE</div>

        <div style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.25);border-radius:12px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;gap:10px">
          <span style="font-size:1.4rem">🪙</span>
          <span style="font-family:'Orbitron',sans-serif;font-size:.85rem;color:#fbbf24">+${coins} COINS EARNED</span>
        </div>

        <div style="background:rgba(56,189,248,.07);border:1px solid rgba(56,189,248,.18);border-radius:14px;padding:14px 18px;margin-bottom:22px">
          <div style="font-size:1.3rem;margin-bottom:8px">💡</div>
          <div style="font-family:'Inter',sans-serif;font-size:.78rem;line-height:1.55;color:rgba(255,255,255,.75);font-style:italic">"Credit is a tool — used wisely, it builds wealth. Used carelessly, it creates debt."</div>
        </div>

        ${stars>=1 && curLevel<3 ? `<button onclick="ccNextLevel()" style="width:100%;margin-bottom:10px;padding:13px;border:none;border-radius:13px;background:linear-gradient(90deg,#38bdf8,#0ea5e9);color:#031017;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.1em;font-weight:900;cursor:pointer">LEVEL ${curLevel+1} ▶</button>` : ''}
        <div style="display:flex;gap:12px;justify-content:center">
          <button onclick="ccPlayAgain()" style="flex:1;max-width:140px;padding:13px 10px;border:1px solid rgba(56,189,248,.5);border-radius:13px;background:rgba(56,189,248,.15);color:#38bdf8;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.1em;cursor:pointer">↺ ${stars>=1 && curLevel<3 ? 'REPLAY' : 'PLAY AGAIN'}</button>
          <button onclick="creditCoreExit()" style="flex:1;max-width:140px;padding:13px 10px;border:1px solid rgba(251,191,36,.4);border-radius:13px;background:rgba(251,191,36,.1);color:#fbbf24;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
        </div>
      </div>`;
  }

  window.ccNextLevel = function(){
    if(curLevel>=3) return;
    curLevel++;
    ccPlayAgain();   // does the full canvas/loop restart; now reads the bumped curLevel
  };

  /* ── Play again ────────────────────────────────────────────── */
  window.ccPlayAgain = function(){
    if(raf){ cancelAnimationFrame(raf); raf = null; }

    const el = document.getElementById('ccOver');
    if(el) el.style.display = 'none';
    G = newGame(curLevel);   // replay the level just finished, not a reset to Lv1
    G.last = performance.now();
    G.itemTimer = G.ITEM_DURATION;
    G.phase = 'play';
    updateTitleBadge();

    // reset HUD
    const bar = document.getElementById('ccTimerBar');
    if(bar) bar.style.width = '100%';
    const combo = document.getElementById('ccCombo');
    if(combo) combo.style.opacity = '0';

    const canvas = document.getElementById('ccCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    function loop(now){
      raf = requestAnimationFrame(loop);
      if(!G || G.phase !== 'play') return;
      const dt = Math.min((now - G.last) / 1000, 0.1);
      G.last = now; G.now = now;
      tick(dt, canvas.clientWidth, canvas.clientHeight, ctx);
    }
    raf = requestAnimationFrame(loop);
  };

  /* ── Exit ──────────────────────────────────────────────────── */
  /* ── QA debug hook ─────────────────────────────────────────── */
  window._ccDbg = function(){ return G ? { curLevel, score: G.score, queueLen: G.queue.length, itemDur: G.ITEM_DURATION, phase: G.phase, timeLeft: G.timeLeft, itemTimer: G.itemTimer, last: G.last } : null; };
  window._ccWin = function(score){ if(!G) return; G.score = score; endGame(); };

  window.creditCoreExit = function(){
    if(raf){ cancelAnimationFrame(raf); raf = null; }
    if(_onKey){ window.removeEventListener('keydown', _onKey); _onKey = null; }
    if(_onResize){ window.removeEventListener('resize', _onResize); _onResize = null; }
    G = null;
    if(window.state) state.viewingWorld = 'credtech';
    goTo('credtech_hub');
  };

})();
