/* ════════════════════════════════════════════════════════════════
   G6 CREDIT LIMIT LAB — CredTech Galaxy
   Catcher mechanic: Balance Meter / Credit Utilization
   Concept: "Credit utilization, limits & ratios"
   3 LEVELS · disjoint item pools per level · harder start-util + faster spawn each level
   90-second session per level. Keep util <30% to win the bonus.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN = 'credtech';
  let G = null, raf = null;
  let curLevel = 1;   // 1|2|3 — chosen on level-select screen, advances via game-over screen
  let _cllFreshEntry = true; // true only for the very first cllBoot() after a hub entry; consumed on use

  /* ─── LEVEL CONFIGS — harder/faster/bigger each level ────────── */
  const LEVELS = [
    { n:1, name:'STARTER LIMIT',     time:90, startUtil:30, spawnStart:1.2, spawnEnd:3.0, star3:900,  star2:600  },
    { n:2, name:'RISING LIMIT',      time:90, startUtil:42, spawnStart:1.6, spawnEnd:3.6, star3:1250, star2:850  },
    { n:3, name:'MAX LIMIT PRESSURE',time:90, startUtil:55, spawnStart:2.0, spawnEnd:4.3, star3:1650, star2:1150 },
  ];

  /* ─── ITEM TABLES — DISJOINT pool per level ──────────────────── */
  // LEVEL 1 · the basics
  const GOOD_L1 = [
    { label:'On-Time Payment', icon:'💚', util:-3,  pts:10,  color:'#34d399' },
    { label:'Low Balance',     icon:'💳', util:-5,  pts:12,  color:'#34d399' },
    { label:'Limit Increase',  icon:'⬆️',  util:-8,  pts:15,  color:'#34d399' },
    { label:'Full Payment',    icon:'✅',  util:-6,  pts:14,  color:'#34d399' },
  ];
  const BAD_L1 = [
    { label:'Impulse Buy',  icon:'🛍️', util:+8,  pts:-5,  color:'#ef4444' },
    { label:'Cash Advance', icon:'💸', util:+12, pts:-10, color:'#ef4444' },
    { label:'Late Fee',     icon:'⚠️',  util:+5,  pts:-8,  color:'#ef4444' },
    { label:'Maxed Card',   icon:'💥', util:+20, pts:-15, color:'#ef4444' },
  ];
  // LEVEL 2 · smarter habits vs sneakier traps
  const GOOD_L2 = [
    { label:'Extra Principal',  icon:'🧮', util:-7,  pts:16,  color:'#34d399' },
    { label:'Balance Transfer', icon:'🔄', util:-10, pts:18,  color:'#34d399' },
    { label:'Autopay Set Up',   icon:'📅', util:-4,  pts:13,  color:'#34d399' },
    { label:'2nd Card Opened',  icon:'💳', util:-9,  pts:17,  color:'#34d399' },
    { label:'Statement Review', icon:'🧾', util:-5,  pts:14,  color:'#34d399' },
  ];
  const BAD_L2 = [
    { label:'Store Card Spree', icon:'🛒', util:+14, pts:-12, color:'#ef4444' },
    { label:'Skipped Minimum',  icon:'📵', util:+10, pts:-14, color:'#ef4444' },
    { label:'Interest Charge',  icon:'📈', util:+9,  pts:-10, color:'#ef4444' },
    { label:'New Loan Stacked', icon:'🏦', util:+16, pts:-16, color:'#ef4444' },
    { label:'Annual Fee Hit',   icon:'🧾', util:+6,  pts:-8,  color:'#ef4444' },
  ];
  // LEVEL 3 · expert moves vs credit wreckers — biggest swings, highest stakes
  const GOOD_L3 = [
    { label:'Lump-Sum Payoff',   icon:'💰', util:-14, pts:22,  color:'#34d399' },
    { label:'Limit Bump Earned', icon:'🚀', util:-11, pts:20,  color:'#34d399' },
    { label:'Debt Avalanche',    icon:'🏔️', util:-9,  pts:18,  color:'#34d399' },
    { label:'Credit Mix Fixed',  icon:'🧩', util:-6,  pts:16,  color:'#34d399' },
    { label:'Dispute Won',       icon:'📝', util:-8,  pts:17,  color:'#34d399' },
  ];
  const BAD_L3 = [
    { label:'Maxed 2 Cards',      icon:'💥', util:+24, pts:-20, color:'#ef4444' },
    { label:'Payday Loan Trap',   icon:'💀', util:+22, pts:-22, color:'#ef4444' },
    { label:'Cosigned Default',   icon:'🫥', util:+18, pts:-18, color:'#ef4444' },
    { label:'Emergency No Fund',  icon:'🚨', util:+15, pts:-16, color:'#ef4444' },
    { label:'Fraud Charge',       icon:'🎣', util:+20, pts:-19, color:'#ef4444' },
  ];
  const POOLS = [
    { good: GOOD_L1, bad: BAD_L1 },
    { good: GOOD_L2, bad: BAD_L2 },
    { good: GOOD_L3, bad: BAD_L3 },
  ];

  /* ─── HELPERS ─────────────────────────────────────────────── */
  function clamp(v,lo,hi){ return v<lo?lo:v>hi?hi:v; }
  function rnd(lo,hi){ return lo+Math.random()*(hi-lo); }

  /* ─── RESET ───────────────────────────────────────────────── */
  function reset(level){
    const L = LEVELS[(level||curLevel)-1] || LEVELS[0];
    G = {
      phase:    'play',
      level:    L.n,
      cfg:      L,
      util:     L.startUtil,  // credit utilization %, level-scoped starting point
      score:    0,
      combo:    0,           // consecutive good catches
      comboMult:1,
      time:     L.time,
      items:    [],
      floats:   [],          // floating score labels
      particles:[],
      basketX:  0.5,         // 0..1 normalised
      spawnAcc: 0,
      shake:    0,           // decaying screen-shake magnitude, triggered on a bad catch
      last:     0,
      keyL:     false,
      keyR:     false,
      _cleanup: null,
    };
  }

  /* ─── SCREEN ──────────────────────────────────────────────── */
  window.SCREENS.game_creditlimitlab = function(){
    G = null;
    curLevel = 1;   // fresh hub entry always starts the campaign at Level 1
    _cllFreshEntry = true; // gate the auto-tutorial to this one boot, not replays/next-level
    setTimeout(cllBoot, 40);
    return `<style>
      @keyframes cllWinPop{0%{transform:scale(.7) translateY(14px);opacity:0}60%{transform:scale(1.05) translateY(-4px);opacity:1}100%{transform:scale(1) translateY(0);opacity:1}}
      @keyframes cllFadeIn{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:translateY(0)}}
      @keyframes cllShine{to{background-position:-20% 0}}
      @keyframes cllConfettiFall{0%{transform:translateY(-30px) rotate(0deg);opacity:1}100%{transform:translateY(440px) rotate(360deg);opacity:0}}
      .cll-wrap{background:radial-gradient(130% 95% at 50% -8%,rgba(6,182,212,.15),#0a1e28 44%,#03040c 100%)}
      .cll-wrap::after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(rgba(6,182,212,0) 50%,rgba(6,182,212,.025) 50%);background-size:100% 4px}
      .cll-confetti{position:absolute;top:-24px;font-size:1.3rem;animation:cllConfettiFall 1.7s ease-in forwards;pointer-events:none;z-index:12}
      .cll-win-shine{position:relative;overflow:hidden}
      .cll-win-shine::before{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.16) 48%,transparent 66%);background-size:220% 100%;background-position:120% 0;animation:cllShine 2.2s ease-in-out .3s 1;pointer-events:none;border-radius:16px}
    </style>
    <div id="cllWrap" class="cll-wrap" style="position:absolute;inset:0;overflow:hidden;font-family:'Inter',sans-serif;color:#fff;user-select:none">

      <!-- TOP BAR -->
      <div id="cllBar" style="position:absolute;top:0;left:0;right:0;z-index:5;padding:10px 14px;display:flex;align-items:center;gap:10px;background:linear-gradient(180deg,rgba(3,4,12,.95),transparent)">
        <button onclick="cllExit()" style="padding:6px 13px;border:1px solid rgba(56,189,248,.35);border-radius:8px;background:rgba(56,189,248,.08);color:#38bdf8;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;cursor:pointer;flex-shrink:0">← HUB</button>
        <div id="cllTitle" style="font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.2em;color:#06b6d4;flex:1;text-align:center;text-shadow:0 0 18px rgba(6,182,212,.6)">CREDIT LIMIT LAB · LV 1/3</div>
        <button onclick="cllShowHelp()" title="How to play" style="padding:6px 10px;border:1px solid rgba(56,189,248,.35);border-radius:8px;background:rgba(56,189,248,.08);color:#38bdf8;cursor:pointer;font-size:.75rem;flex-shrink:0">❓</button>
        <div id="cllScore" style="font-family:'Orbitron',sans-serif;font-size:.75rem;color:#fbbf24;min-width:60px;text-align:right;font-variant-numeric:tabular-nums">0</div>
        <div id="cllTime" style="font-family:'Orbitron',sans-serif;font-size:.75rem;color:#e2e8f0;min-width:36px;text-align:right;font-variant-numeric:tabular-nums">90s</div>
      </div>

      <!-- UTILIZATION METER PANEL -->
      <div id="cllMeterPanel" style="position:absolute;top:48px;left:12px;right:12px;z-index:5">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <span style="font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.12em;color:rgba(255,255,255,.5)">CREDIT UTILIZATION</span>
          <span id="cllUtilPct" style="font-family:'Orbitron',sans-serif;font-size:.75rem;color:#06b6d4;font-variant-numeric:tabular-nums;text-shadow:0 0 12px rgba(6,182,212,.5)">30%</span>
        </div>
        <!-- Meter bar with zone segments -->
        <div style="position:relative;height:20px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);overflow:hidden">
          <!-- Zone segments (decorative dividers) -->
          <div style="position:absolute;inset:0;display:flex;pointer-events:none">
            <div style="flex:30;background:linear-gradient(90deg,rgba(52,211,153,.18),rgba(52,211,153,.08));border-right:1px solid rgba(52,211,153,.3)"></div>
            <div style="flex:20;background:linear-gradient(90deg,rgba(251,191,36,.10),rgba(251,191,36,.05));border-right:1px solid rgba(251,191,36,.25)"></div>
            <div style="flex:50;background:linear-gradient(90deg,rgba(239,68,68,.10),rgba(239,68,68,.06))"></div>
          </div>
          <!-- Fill bar -->
          <div id="cllUtilBar" style="position:absolute;top:0;left:0;height:100%;width:30%;border-radius:10px;transition:width .2s,background .3s;background:linear-gradient(90deg,#34d399,#6ee7b7)"></div>
          <!-- Needle/cursor marker -->
          <div id="cllUtilNeedle" style="position:absolute;top:0;bottom:0;width:3px;border-radius:2px;background:#fff;box-shadow:0 0 8px rgba(255,255,255,.8);transform:translateX(-50%);left:30%;transition:left .2s;z-index:2"></div>
          <!-- Zone labels -->
          <div style="position:absolute;inset:0;display:flex;pointer-events:none;align-items:center">
            <div style="flex:30;text-align:center;font-family:'Orbitron',sans-serif;font-size:.3rem;color:rgba(52,211,153,.8);letter-spacing:.08em">HEALTHY</div>
            <div style="flex:20;text-align:center;font-family:'Orbitron',sans-serif;font-size:.3rem;color:rgba(251,191,36,.8);letter-spacing:.08em">CAUTION</div>
            <div style="flex:50;text-align:center;font-family:'Orbitron',sans-serif;font-size:.3rem;color:rgba(239,68,68,.7);letter-spacing:.08em">DANGER</div>
          </div>
        </div>
        <!-- Zone tick marks -->
        <div style="position:relative;margin-top:2px;height:10px">
          <span style="position:absolute;left:0;font-family:'Orbitron',sans-serif;font-size:.28rem;color:rgba(255,255,255,.3)">0%</span>
          <span style="position:absolute;left:30%;transform:translateX(-50%);font-family:'Orbitron',sans-serif;font-size:.28rem;color:rgba(52,211,153,.5)">30%</span>
          <span style="position:absolute;left:50%;transform:translateX(-50%);font-family:'Orbitron',sans-serif;font-size:.28rem;color:rgba(251,191,36,.5)">50%</span>
          <span style="position:absolute;right:0;font-family:'Orbitron',sans-serif;font-size:.28rem;color:rgba(239,68,68,.5)">100%</span>
        </div>
      </div>

      <!-- COMBO BADGE -->
      <div id="cllCombo" style="position:absolute;top:130px;right:14px;z-index:5;font-family:'Orbitron',sans-serif;font-size:.6rem;color:#fbbf24;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.3);border-radius:8px;padding:4px 10px;letter-spacing:.1em;display:none">x1</div>

      <!-- CANVAS -->
      <canvas id="cllCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:none"></canvas>

      <!-- GAME OVER OVERLAY -->
      <div id="cllOver" style="position:absolute;inset:0;z-index:10;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(3,4,12,.9);backdrop-filter:blur(8px);gap:16px;padding:28px;text-align:center"></div>

      <!-- HOW TO PLAY overlay (shown once at start, reopened via ❓) -->
      <div id="cllHelp" style="position:absolute;inset:0;z-index:11;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.9);backdrop-filter:blur(6px);padding:20px;box-sizing:border-box"></div>
    </div>`;
  };

  /* ─── BOOT ────────────────────────────────────────────────── */
  function cllBoot(){
    const cv = document.getElementById('cllCanvas');
    if(!cv) return;
    reset();
    const titleEl = document.getElementById('cllTitle');
    if(titleEl) titleEl.textContent = `CREDIT LIMIT LAB · LV ${curLevel}/3`;
    const ctx = cv.getContext('2d');

    function resize(){
      cv.width  = cv.clientWidth  * devicePixelRatio;
      cv.height = cv.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Mouse / touch controls
    function setBasket(cx){
      const r = cv.getBoundingClientRect();
      G.basketX = clamp((cx - r.left) / r.width, 0.05, 0.95);
    }
    function onMouseMove(e){ setBasket(e.clientX); }
    function onTouchMove(e){ if(e.touches[0]){ setBasket(e.touches[0].clientX); e.preventDefault(); } }
    function onTouchStart(e){ if(e.touches[0]) setBasket(e.touches[0].clientX); }
    cv.addEventListener('mousemove',  onMouseMove);
    cv.addEventListener('touchmove',  onTouchMove,  { passive: false });
    cv.addEventListener('touchstart', onTouchStart);

    // Keyboard controls
    function kd(e){ if(e.key==='ArrowLeft')  { G.keyL=true; e.preventDefault(); }
                    if(e.key==='ArrowRight') { G.keyR=true; e.preventDefault(); } }
    function ku(e){ if(e.key==='ArrowLeft')  G.keyL=false;
                    if(e.key==='ArrowRight') G.keyR=false; }
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup',   ku);

    G._cleanup = function(){
      window.removeEventListener('resize',  resize);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup',   ku);
      cv.removeEventListener('mousemove',  onMouseMove);
      cv.removeEventListener('touchmove',  onTouchMove);
      cv.removeEventListener('touchstart', onTouchStart);
    };

    G.last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);

    if(_cllFreshEntry){
      // only the very first boot after a hub entry auto-shows the tutorial and
      // holds gameplay; replays/next-level (which also call cllBoot()) skip
      // straight to 'play' — reopening the same explanation is still always
      // available via the ❓ button (cllShowHelp).
      _cllFreshEntry = false;
      G.phase = 'help'; // hold on the tutorial before gameplay/timer starts ticking
      showHowToPlay(true);
    }
  }

  /* ─── HOW TO PLAY — shown once per session at first boot, reopened via ❓.
     While G.phase is 'help' (not 'play'), loop() below skips update() entirely
     and only keeps calling render(), so G.time never advances and nothing is
     double-counted. ────────────────────────────────────────────────────── */
  function showHowToPlay(firstTime){
    const help = document.getElementById('cllHelp');
    if(!help || !G) return;
    help.style.display = 'flex';
    help.innerHTML = `
      <div style="max-width:360px;width:100%;text-align:center;padding:26px 22px;background:linear-gradient(160deg,rgba(3,4,12,.97),rgba(2,20,30,.97));border:1px solid rgba(56,189,248,.4);border-radius:20px;box-shadow:0 0 50px rgba(6,182,212,.2)">
        <div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.2em;color:#38bdf8;margin-bottom:10px">HOW TO PLAY</div>
        <div style="font-size:2rem;margin-bottom:8px">🧪</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:1rem;margin-bottom:14px;color:#fff">CREDIT LIMIT LAB</div>
        <ul style="text-align:left;font-size:.78rem;color:#ddd;line-height:1.65;margin:0 0 18px;padding-left:18px">
          <li>Move your basket left and right — with your mouse, finger, or the ← → arrow keys — to catch falling items.</li>
          <li>Green items lower your credit utilization (good!). Red items push it up (watch out!).</li>
          <li>Keep utilization in the HEALTHY zone below 30% — the meter at the top shows exactly where you stand.</li>
          <li>Catching good items in a row builds a combo streak that multiplies your points and adds bigger bursts.</li>
          <li>Score as many points as you can before time runs out — all 3 levels use this same idea, just faster and trickier!</li>
        </ul>
        <button id="cllHelpBtn" style="padding:13px 30px;border:none;border-radius:11px;background:linear-gradient(90deg,#06b6d4,#38bdf8);color:#031017;font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.12em;font-weight:900;cursor:pointer">${firstTime ? 'GOT IT — START ▶' : '▶ RESUME'}</button>
      </div>`;
    const btn = document.getElementById('cllHelpBtn');
    if(btn) btn.onclick = () => {
      help.style.display = 'none';
      if(!G) return;
      G.last = performance.now(); // reset the frame clock so the next dt is ~0, not the whole paused span
      G.phase = 'play';
    };
  }
  window.cllShowHelp = function(){
    if(!G || G.phase !== 'play') return;
    G.phase = 'help';
    showHowToPlay(false);
  };

  /* ─── MAIN LOOP ───────────────────────────────────────────── */
  function loop(now){
    const cv = document.getElementById('cllCanvas');
    if(!cv || !G){ cancelAnimationFrame(raf); return; }
    const ctx = cv.getContext('2d');
    const W = cv.clientWidth, H = cv.clientHeight;
    const dt = clamp((now - G.last) / 1000, 0, 0.05);
    G.last = now;
    if(G.phase === 'play') update(dt, W, H);
    render(ctx, W, H, now);
    if(G && G.phase !== 'over') raf = requestAnimationFrame(loop);
  }

  /* ─── UPDATE ──────────────────────────────────────────────── */
  function update(dt, W, H){
    // Timer
    G.time -= dt;
    const ts = document.getElementById('cllTime');
    if(ts){ ts.textContent = Math.ceil(Math.max(0,G.time))+'s'; ts.style.color = G.time<15 ? '#ef4444' : '#e2e8f0'; }

    if(G.time <= 0){ G.time=0; return endGame(); }
    if(G.util >= 100){ return endGame(); }

    // Basket keyboard movement
    const speed = 1.6;
    if(G.keyL) G.basketX -= dt * speed;
    if(G.keyR) G.basketX += dt * speed;
    G.basketX = clamp(G.basketX, 0.05, 0.95);

    // Spawn items — ramp speed and rate over the level's session length
    const prog = clamp(1 - G.time/G.cfg.time, 0, 1);
    const spawnRate = G.cfg.spawnStart + prog * (G.cfg.spawnEnd - G.cfg.spawnStart);
    G.spawnAcc += dt * spawnRate;
    while(G.spawnAcc >= 1){ G.spawnAcc -= 1; spawnItem(prog); }

    // Move items
    const baseSpeed = (0.14 + prog * 0.14) * H; // fraction of screen per second
    const CANVAS_TOP = 160 / H; // normalised top offset for UI
    for(let i = G.items.length - 1; i >= 0; i--){
      const it = G.items[i];
      it.y += dt * (baseSpeed * it.speedMult) / H;

      // Sine drift for bad items
      if(!it.good){ it.drift = (it.drift||0) + dt * it.driftFreq; it.x = clamp(it.baseX + Math.sin(it.drift) * it.driftAmp, 0.04, 0.96); }

      // Basket collision (near floor)
      const bxn = G.basketX;
      const byn = 1 - (50/H); // basket centre y normalised
      const bHalfW = 80/(W*2);
      if(it.y > byn - 0.04 && it.y < byn + 0.04 && Math.abs(it.x - bxn) < bHalfW + 0.04){
        // Caught!
        catchItem(it, it.x * W, byn * H);
        G.items.splice(i,1);
        continue;
      }

      // Floor miss
      if(it.y > 1.08){
        if(it.good){
          // Missed a good item — break combo
          G.combo = 0; G.comboMult = 1;
          updateComboUI();
          spawnFloat(it.x*W, H*0.85, '-COMBO', '#ef4444');
        }
        G.items.splice(i,1);
        continue;
      }
    }

    // Particles
    for(let p = G.particles.length-1; p>=0; p--){
      const pk = G.particles[p];
      pk.x += pk.vx * dt;
      pk.y += pk.vy * dt;
      pk.vy += 200 * dt; // gravity
      pk.life -= dt;
      if(pk.life <= 0) G.particles.splice(p,1);
    }

    // Floats
    for(let f = G.floats.length-1; f>=0; f--){
      const fl = G.floats[f];
      fl.y -= 60 * dt;
      fl.life -= dt;
      if(fl.life <= 0) G.floats.splice(f,1);
    }

    // Screen shake decay
    if(G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.2);

    // Update meter UI
    updateMeterUI();
    updateComboUI();
  }

  /* ─── SPAWN ───────────────────────────────────────────────── */
  function spawnItem(prog){
    const isGood = Math.random() < 0.52; // slightly more good than bad
    const levelPool = POOLS[G.level - 1] || POOLS[0];
    const pool = isGood ? levelPool.good : levelPool.bad;
    const def = pool[Math.floor(Math.random() * pool.length)];
    const x = rnd(0.07, 0.93);
    G.items.push({
      good:      isGood,
      def:       def,
      x:         x,
      baseX:     x,
      y:         -0.06,
      speedMult: rnd(0.8, 1.3 + prog * 0.5),
      driftFreq: rnd(2.5, 4.5),
      driftAmp:  isGood ? 0 : rnd(0.03, 0.08),
      wobble:    Math.random() * Math.PI * 2,
      size:      rnd(28, 36),
    });
  }

  /* ─── CATCH ───────────────────────────────────────────────── */
  function catchItem(it, sx, sy){
    const def = it.def;

    // Update utilization
    G.util = clamp(G.util + def.util, 0, 100);

    // Combo tracking
    if(it.good){
      G.combo++;
      G.comboMult = Math.min(4, 1 + Math.floor(G.combo / 3));
    } else {
      G.combo = 0; G.comboMult = 1;
      G.shake = 0.5;
    }

    // Scoring formula: pts * (1 + streak/10)
    const streak = G.combo;
    const base = def.pts;
    const earned = Math.round(base * (1 + streak / 10) * G.comboMult);
    G.score = Math.max(0, G.score + earned);

    const scoreEl = document.getElementById('cllScore');
    if(scoreEl) scoreEl.textContent = G.score;

    // Float label — text grows with combo tier so a x4 catch visibly pops harder than a x1
    const comboScale = it.good ? G.comboMult : 1;
    const label = (earned >= 0 ? '+' : '') + earned + ' pts';
    spawnFloat(sx, sy - 20, label, it.good ? '#34d399' : '#ef4444', comboScale);

    // Util float
    const utilLabel = (def.util >= 0 ? '+' : '') + def.util + '% util';
    spawnFloat(sx, sy - 44, utilLabel, it.good ? '#06b6d4' : '#f97316', 1);

    // Particles — burst size/speed scale with combo depth (visual only, scoring untouched)
    const burstCount = it.good ? Math.min(10 + comboScale * 4, 26) : 6;
    const burstSpeedMult = it.good ? 1 + (comboScale - 1) * 0.25 : 1;
    burst(sx, sy, it.good ? '#34d399' : '#ef4444', burstCount, burstSpeedMult);
  }

  /* ─── PARTICLES ───────────────────────────────────────────── */
  function burst(x, y, color, count, speedMult){
    speedMult = speedMult || 1;
    for(let i = 0; i < count; i++){
      const angle = (Math.PI*2 * i/count) + rnd(-0.4,0.4);
      const speed = rnd(60,180) * speedMult;
      G.particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 80, color, life: rnd(.4,.8), size: rnd(2,5) });
    }
  }

  /* ─── FLOATS ──────────────────────────────────────────────── */
  function spawnFloat(x, y, text, color, scale){
    G.floats.push({ x, y, text, color, life: 1.0, scale: scale || 1 });
  }

  /* ─── METER UI UPDATE ─────────────────────────────────────── */
  function updateMeterUI(){
    const pct = clamp(G.util, 0, 100);
    const bar = document.getElementById('cllUtilBar');
    const needle = document.getElementById('cllUtilNeedle');
    const pctEl = document.getElementById('cllUtilPct');

    if(pctEl){
      pctEl.textContent = Math.round(pct) + '%';
      pctEl.style.color = pct < 30 ? '#34d399' : pct < 50 ? '#fbbf24' : '#ef4444';
      pctEl.style.textShadow = pct >= 50 ? '0 0 16px rgba(239,68,68,.7)' : pct >= 30 ? '0 0 12px rgba(251,191,36,.5)' : '0 0 12px rgba(52,211,153,.5)';
    }
    if(bar){
      bar.style.width = pct + '%';
      if(pct < 30)        bar.style.background = 'linear-gradient(90deg,#34d399,#6ee7b7)';
      else if(pct < 50)   bar.style.background = 'linear-gradient(90deg,#d97706,#fbbf24)';
      else                bar.style.background = 'linear-gradient(90deg,#dc2626,#ef4444)';
    }
    if(needle) needle.style.left = pct + '%';
  }

  /* ─── COMBO UI ────────────────────────────────────────────── */
  function updateComboUI(){
    const el = document.getElementById('cllCombo');
    if(!el) return;
    if(G.combo < 2){ el.style.display='none'; return; }
    el.style.display = 'block';
    el.textContent = 'x' + G.comboMult;
    el.style.color = G.comboMult >= 4 ? '#ef4444' : G.comboMult >= 3 ? '#f97316' : G.comboMult >= 2 ? '#fbbf24' : '#e2e8f0';
    el.style.borderColor = el.style.color.replace(')',', .35)').replace('rgb','rgba');
    el.style.background = el.style.color.replace(')',', .1)').replace('rgb','rgba');
  }

  /* ─── RENDER ──────────────────────────────────────────────── */
  function render(ctx, W, H, now){
    // Clear
    ctx.clearRect(0,0,W,H);

    // Screen shake on a bad catch — wraps the whole scene since this game has no
    // separate HUD-in-canvas text to protect (score/timer live in the DOM top bar)
    const shakeMag = G.shake > 0 ? G.shake * 14 : 0;
    const shx = shakeMag ? (Math.random()-.5)*shakeMag : 0, shy = shakeMag ? (Math.random()-.5)*shakeMag : 0;
    ctx.save(); ctx.translate(shx, shy);

    // Background glow from utilisation
    const util = G.util;
    const dangerGlow = clamp((util-50)/50,0,1);
    if(dangerGlow > 0){
      const rg = ctx.createRadialGradient(W/2,H,0,W/2,H,H*0.7);
      rg.addColorStop(0, `rgba(239,68,68,${dangerGlow*0.15})`);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0,0,W,H);
    }
    const goodGlow = clamp((30-util)/30,0,1);
    if(goodGlow > 0){
      const rg2 = ctx.createRadialGradient(W/2,H,0,W/2,H,H*0.5);
      rg2.addColorStop(0, `rgba(52,211,153,${goodGlow*0.08})`);
      rg2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg2;
      ctx.fillRect(0,0,W,H);
    }

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(56,189,248,0.04)';
    ctx.lineWidth = 1;
    for(let lx=0; lx<W; lx+=40){ ctx.beginPath(); ctx.moveTo(lx,0); ctx.lineTo(lx,H); ctx.stroke(); }
    for(let ly=0; ly<H; ly+=40){ ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(W,ly); ctx.stroke(); }

    // Falling items
    G.items.forEach(it => {
      const x = it.x * W;
      const y = it.y * H;
      const sz = it.size;

      // Item glow
      ctx.save();
      ctx.shadowColor = it.good ? '#34d399' : '#ef4444';
      ctx.shadowBlur = 14;

      // Item circle background
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI*2);
      ctx.fillStyle = it.good ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)';
      ctx.fill();

      // Animated ring
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.003 + it.wobble);
      ctx.beginPath();
      ctx.arc(x, y, sz + pulse*4, 0, Math.PI*2);
      ctx.strokeStyle = it.good ? `rgba(52,211,153,${0.3+pulse*0.3})` : `rgba(239,68,68,${0.3+pulse*0.3})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // Emoji icon
      ctx.font = `${sz*1.1}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.def.icon, x, y);

      // Label below icon
      ctx.save();
      ctx.font = `600 ${clamp(sz*0.38,8,12)}px Inter,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = it.good ? '#86efac' : '#fca5a5';
      ctx.shadowBlur = 0;
      // Short label - trim to fit
      const lbl = it.def.label.length > 10 ? it.def.label.slice(0,10)+'…' : it.def.label;
      ctx.fillText(lbl, x, y + sz + 4);
      ctx.restore();
    });

    // Basket
    drawBasket(ctx, W, H, now);

    // Particles
    G.particles.forEach(p => {
      const a = clamp(p.life / 0.6, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });

    // Float labels — size scales with combo tier (fl.scale) so a high-combo catch reads bigger
    G.floats.forEach(fl => {
      const a = clamp(fl.life, 0, 1);
      const fsize = Math.round(13 + ((fl.scale||1) - 1) * 3);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = `700 ${fsize}px Orbitron,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = fl.color;
      ctx.shadowColor = fl.color;
      ctx.shadowBlur = 8 + ((fl.scale||1) - 1) * 2;
      ctx.fillText(fl.text, fl.x, fl.y);
      ctx.restore();
    });

    // Danger flicker at high util
    if(util >= 85){
      const flicker = Math.sin(now * 0.012) > 0.6 ? 0.06 : 0;
      if(flicker){
        ctx.fillStyle = `rgba(239,68,68,${flicker})`;
        ctx.fillRect(0,0,W,H);
      }
    }

    ctx.restore(); // matches the shake save() at the top of render()
  }

  /* ─── DRAW BASKET ─────────────────────────────────────────── */
  function drawBasket(ctx, W, H, now){
    if(!G) return;
    const bx = G.basketX * W;
    const by = H - 42;
    const bw = 80, bh = 28;
    const util = G.util;

    // Basket color based on util zone
    const col = util < 30 ? '#06b6d4' : util < 50 ? '#fbbf24' : '#ef4444';

    ctx.save();
    // Glow
    ctx.shadowColor = col;
    ctx.shadowBlur = util >= 50 ? 20 : 14;

    // Basket body (trapezoid-ish via rounded rect + clip)
    ctx.beginPath();
    ctx.moveTo(bx - bw/2 + 8, by - bh/2);
    ctx.lineTo(bx + bw/2 - 8, by - bh/2);
    ctx.lineTo(bx + bw/2, by + bh/2);
    ctx.lineTo(bx - bw/2, by + bh/2);
    ctx.closePath();
    ctx.fillStyle = `rgba(${util<30?'6,182,212':util<50?'217,119,6':'185,28,28'},0.25)`;
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Catch zone highlight (inner line)
    ctx.beginPath();
    ctx.moveTo(bx - bw/2 + 10, by - bh/2 + 7);
    ctx.lineTo(bx + bw/2 - 10, by - bh/2 + 7);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.stroke();

    // Basket label credit card symbol
    ctx.globalAlpha = 0.8;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText('💳', bx, by);

    // Combo ring if active
    if(G.combo >= 2){
      const pulse = 0.7 + 0.3 * Math.sin(now * 0.006);
      ctx.globalAlpha = pulse * 0.6;
      ctx.beginPath();
      ctx.ellipse(bx, by, bw/2+8, bh/2+6, 0, 0, Math.PI*2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ─── END GAME ────────────────────────────────────────────── */
  function endGame(){
    if(!G || G.phase !== 'play') return;
    G.phase = 'over';
    cancelAnimationFrame(raf);

    // Stars — level-scoped thresholds (each level needs a bigger score for the same star)
    let stars;
    if(G.score >= G.cfg.star3) stars = 3;
    else if(G.score >= G.cfg.star2) stars = 2;
    else stars = 1;

    // Bonus for finishing with util < 30% (the real FICO "healthy" line — stays fixed
    // even as levels 2/3 start further above it, which is what makes them harder)
    let bonus = 0;
    const bonusWon = G.util < 30 && G.time <= 0;
    if(bonusWon){ bonus = 200; G.score += bonus; }

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_creditlimitlab', { level: G.level, stars, is3star, isPerfect: is3star && bonusWon, badge: 'Credit Limit Lab Master' })
      : (stars===3?150:stars===2?100:50);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('credtech_trust', stars*4);
    if (stars < 1 && window.cvSave) cvSave();

    // Stars string
    const starsStr = '⭐'.repeat(stars) + (stars<3?'<span style="opacity:.25">'+('⭐'.repeat(3-stars))+'</span>':'');

    // Util status
    const utilZone = G.util < 30 ? { label:'HEALTHY ✓', color:'#34d399' } : G.util < 50 ? { label:'CAUTION', color:'#fbbf24' } : { label:'DANGER!', color:'#ef4444' };

    const earlyCrash = G.util >= 100;

    const showNext = stars >= 1 && curLevel < 3 && !earlyCrash;
    const headline = earlyCrash
      ? 'OOPS — credit maxed out at 100% util'
      : (stars >= 1
          ? (curLevel >= 3 ? '👑 MISSION ACCOMPLISHED — ALL 3 LEVELS!' : `MISSION ACCOMPLISHED · LV ${curLevel}`)
          : 'NICE TRY! Power up and try again');

    const ov = document.getElementById('cllOver');
    if(!ov) return;
    ov.style.display = 'flex';
    /* win (real stars, no crash) gets a punchy overshoot pop; a util-maxout crash
       gets a plain, subdued fade — so the end screen actually feels different, not just re-texted */
    const endAnim = earlyCrash ? 'cllFadeIn .4s ease' : 'cllWinPop .5s cubic-bezier(.34,1.56,.64,1)';
    // confetti + shine sweep on a real finish only (never on a util-maxout crash)
    const confettiHTML = !earlyCrash ? Array.from({length:18},(_,i)=>{
      const emo=['✦','●','▲','★'][i%4], col=['#06b6d4','#38bdf8','#34d399','#fbbf24'][i%4];
      return `<span class="cll-confetti" style="left:${4+Math.random()*92}%;animation-delay:${(Math.random()*.5).toFixed(2)}s;color:${col}">${emo}</span>`;
    }).join('') : '';
    ov.innerHTML = `${confettiHTML}
      <div class="${earlyCrash?'':'cll-win-shine'}" style="display:flex;flex-direction:column;align-items:center;gap:16px;animation:${endAnim}">
      <div style="font-family:'Orbitron',sans-serif;font-size:.45rem;letter-spacing:.22em;color:#38bdf8;opacity:.8;margin-bottom:-6px">${headline}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:1.3rem;font-weight:900;letter-spacing:.06em;background:linear-gradient(135deg,#06b6d4,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0">
        ${G.score}<span style="font-size:.6rem;opacity:.6"> PTS</span>
      </div>
      <div style="font-size:1.6rem;letter-spacing:.1em">${starsStr}</div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 16px;min-width:80px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.3rem;color:rgba(255,255,255,.4);letter-spacing:.1em;margin-bottom:4px">FINAL UTIL</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:.75rem;color:${utilZone.color}">${Math.round(G.util)}%</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:.28rem;color:${utilZone.color};opacity:.7;margin-top:2px">${utilZone.label}</div>
        </div>
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 16px;min-width:80px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.3rem;color:rgba(255,255,255,.4);letter-spacing:.1em;margin-bottom:4px">COINS</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:.75rem;color:#fbbf24">+${coins}</div>
        </div>
        ${bonusWon ? `<div style="background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);border-radius:10px;padding:10px 16px;min-width:80px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.3rem;color:#34d399;letter-spacing:.1em;margin-bottom:4px">UTIL BONUS</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:.75rem;color:#34d399">+${bonus}</div>
        </div>` : ''}
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 16px;min-width:80px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.3rem;color:rgba(255,255,255,.4);letter-spacing:.1em;margin-bottom:4px">BEST COMBO</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:.75rem;color:#38bdf8">x${G.comboMult}</div>
        </div>
      </div>

      <div style="max-width:290px;background:linear-gradient(135deg,rgba(6,182,212,.1),rgba(56,189,248,.05));border:1px solid rgba(6,182,212,.25);border-radius:12px;padding:14px 18px;line-height:1.6">
        <div style="font-family:'Orbitron',sans-serif;font-size:.32rem;letter-spacing:.14em;color:#38bdf8;margin-bottom:6px">💡 CREDIT TIP</div>
        <div style="font-size:.78rem;color:rgba(255,255,255,.85)">Keep credit utilization <strong style="color:#34d399">below 30%</strong> — it accounts for <strong style="color:#fbbf24">30% of your FICO score</strong>. Paying balances down before your statement closes helps the most.</div>
      </div>

      ${showNext ? `<button onclick="cllNextLevel()" style="width:100%;max-width:290px;padding:13px;border:none;border-radius:10px;background:linear-gradient(90deg,#34d399,#10b981);color:#052e16;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.12em;font-weight:900;cursor:pointer;box-shadow:0 4px 20px rgba(52,211,153,.35)">LEVEL ${curLevel+1} ▶ ${LEVELS[curLevel].name}</button>` : ''}
      <div style="display:flex;gap:12px;margin-top:4px">
        <button onclick="cllReplay()" style="padding:12px 24px;background:linear-gradient(135deg,#0891b2,#06b6d4);border:none;border-radius:10px;color:#fff;font-family:'Orbitron',sans-serif;font-size:.52rem;letter-spacing:.15em;cursor:pointer;box-shadow:0 4px 20px rgba(6,182,212,.4)">${showNext ? 'REPLAY LV '+curLevel : 'PLAY AGAIN'}</button>
        <button onclick="cllExit()" style="padding:12px 24px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);border-radius:10px;color:#e2e8f0;font-family:'Orbitron',sans-serif;font-size:.52rem;letter-spacing:.15em;cursor:pointer">← HUB</button>
      </div>
      </div>`;
  }

  /* ─── REPLAY / NEXT LEVEL / EXIT ─────────────────────────── */
  window.cllReplay = function(){
    if(G && G._cleanup) G._cleanup();
    const ov = document.getElementById('cllOver');
    if(ov) ov.style.display = 'none';
    cancelAnimationFrame(raf);
    G = null;
    setTimeout(cllBoot, 40);   // reset(no-arg) inside cllBoot re-uses curLevel
  };

  window.cllNextLevel = function(){
    if(curLevel >= 3) return;
    curLevel++;
    window.cllReplay();       // rebuild via cllBoot, which now reads the bumped curLevel
  };

  window.cllExit = function(){
    cancelAnimationFrame(raf);
    if(G && G._cleanup) G._cleanup();
    G = null;
    if(window.state) state.viewingWorld = TOKEN;
    if(window.goTo) goTo('credtech_hub');
  };

  /* ─── INIT HOOK (for playDistrictGame) ───────────────────── */
  window.cllInit = function(){ G = null; curLevel = 1; };

  /* ─── QA debug hook ───────────────────────────────────────── */
  window._cllDbg = function(){ return G ? { curLevel, level: G.level, util: G.util, score: G.score, time: G.time } : { curLevel, G: null }; };
  window._cllForceLevel = function(n){ curLevel = Math.max(1, Math.min(3, n)); window.cllReplay(); };
  window._cllForceWin = function(){ if(!G) return; G.score = G.cfg.star3 + 1; G.util = 10; G.time = 0; endGame(); };

})();
