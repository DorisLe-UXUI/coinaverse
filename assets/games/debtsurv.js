/* ════════════════════════════════════════════════════════════════
   DEBT SURVIVAL: GLADIATOR PIT — GDD v1.0 compliant (rev 2)
   Top-down arena survival. Financial Health = Vehicle Health.

   GDD METRICS (6 live stats — all implemented):
     - Credit Health (300–850)
     - Debt Balance (0–1000)
     - Savings Reserve (0–100, percentage)
     - Interest Pressure (0–100)
     - Financial Knowledge (1–100)
     - Risk Exposure (0–100)

   GDD ITEMS (GDD-faithful names & behaviors):
     BENEFICIAL: Coin, Cash, Green Tank (armor immunity), Gold Puddle,
                 Shield Orb (savings-powered), First Aid, Debt Ray (reduces debt)
     HAZARDS:    Scam Box (random jackpot OR trap), Late Fee Trap (red, penalties)

   GDD SYSTEMS:
     - Knowledge Gates: quiz adaptive to Financial Knowledge level
     - Combo multiplier up to ×5+, shown in end report
     - 1–5 Star Arena Rating on end screen
     - Encouraging Coach tip (contextual, positive)
     - End stats: Debt Destroyed, Credit Improved, Citizens Rescued,
                  Savings Earned, Boss Damage, Best Combo
     - Boss Nemesis: appears randomly (not constant chaser), IP-buffed
     - Interest Pressure rises over time, buffs boss speed & size
   ════════════════════════════════════════════════════════════════ */
(function(){
  let G=null, raf=null, gateTimer=null, _cleanupFn=null;

  window.dsInit=function(){
    clearTimeout(gateTimer);
    if(_cleanupFn){ _cleanupFn(); _cleanupFn=null; }
    cancelAnimationFrame(raf);
    G=null;
  };

  /* ─── LEVEL DEFINITIONS ─────────────────────────────────────── */
  const LEVELS=[
    { label:'LEVEL 1', duration:120, bossSpd:0.045, trapRate:0.10, spawnRate:3.5, items:5, ipRate:0.8  },
    { label:'LEVEL 2', duration:240, bossSpd:0.062, trapRate:0.22, spawnRate:2.8, items:7, ipRate:1.4  },
    { label:'LEVEL 3', duration:360, bossSpd:0.080, trapRate:0.35, spawnRate:2.2, items:9, ipRate:2.0  }
  ];

  /* ─── COLLECTIBLE / ITEM DEFINITIONS ────────────────────────── */
  const ITEMS=[
    { k:'coin',    e:'🪙', label:'COIN',           good:true,  r:0.028 },
    { k:'cash',    e:'💵', label:'CASH',           good:true,  r:0.032 },
    { k:'tank',    e:'🟢', label:'GREEN TANK',     good:true,  r:0.034 }, // GDD: temporary armored hull, shrug off enemy contact
    { k:'puddle',  e:'🟡', label:'GOLD PUDDLE',    good:true,  r:0.030 },
    { k:'shield',  e:'🔮', label:'SHIELD ORB',     good:true,  r:0.030 },
    { k:'firstaid',e:'💊', label:'FIRST AID',      good:true,  r:0.030 },
    { k:'debtray', e:'⚡', label:'DEBT RAY',       good:true,  r:0.028 }, // GDD: beneficial — melts debt enemies, reduces Debt Balance
    { k:'scam',    e:'📦', label:'SCAM BOX',       good:false, r:0.030 }, // GDD: high risk/reward — random jackpot OR trap
    { k:'latefee', e:'🔴', label:'LATE FEE TRAP',  good:false, r:0.028 }  // GDD: red warning symbol, adds penalties on contact
  ];
  const GOOD_ITEMS = ITEMS.filter(i=> i.good);
  const TRAP_ITEMS = ITEMS.filter(i=>!i.good);

  /* ─── KNOWLEDGE GATE QUIZ DATA (GDD: correct=bonus, wrong=penalty) ── */
  const GATE_QUESTIONS=[
    {
      icon:'📈',
      q:'What causes debt to grow faster over time?',
      choices:['Interest charges','Saving money','Paying on time','Spending less'],
      correct:0,
      correctFx:'Interest reduction granted — Interest Pressure -15!',
      wrongFx:'Enemy buff applied — boss gains speed!',
      correctEffect: G=>{ G.interestPressure=clamp(G.interestPressure-15,0,100); G.financialKnowledge=clamp(G.financialKnowledge+8,1,100); },
      wrongEffect:   G=>{ G.bossBuffT=8; G.flash=0.5; G.flashC='#ef4444'; }
    },
    {
      icon:'🛟',
      q:'What helps handle financial emergencies?',
      choices:['Credit card debt','Emergency savings','Buying more things','Ignoring bills'],
      correct:1,
      correctFx:'Defensive shield granted — Savings Reserve +15!',
      wrongFx:'Emergency attack triggers — boss charges!',
      correctEffect: G=>{ G.savingsReserve=clamp(G.savingsReserve+15,0,100); G.shieldHits=clamp(G.shieldHits+1,0,4); },
      wrongEffect:   G=>{ if(G.bActive){ G.bx=G.px+0.15; G.by=G.py+0.15; G.bRetargetT=0; } else { G.bAppearT=0; } G.flash=0.5; G.flashC='#ef4444'; }
    },
    {
      icon:'💳',
      q:'What happens after long-term non-payment of debt?',
      choices:['Debt disappears','Interest stops','Collections begin','Credit improves'],
      correct:2,
      correctFx:'Collection shield granted — Risk Exposure -20!',
      wrongFx:'Drone swarm summoned — trap items surge!',
      correctEffect: G=>{ G.riskExposure=clamp(G.riskExposure-20,0,100); G.financialKnowledge=clamp(G.financialKnowledge+8,1,100); },
      wrongEffect:   G=>{ for(let i=0;i<3;i++) spawnTrapItem(); G.riskExposure=clamp(G.riskExposure+15,0,100); }
    },
    {
      icon:'🏦',
      q:'What improves your credit score over time?',
      choices:['Paying bills late','Missing payments','Paying on time consistently','Opening many credit cards'],
      correct:2,
      correctFx:'Credit boost granted — Credit Health +30!',
      wrongFx:'Credit loss applied — Credit Health -20!',
      correctEffect: G=>{ G.creditHealth=clamp(G.creditHealth+30,300,850); G.financialKnowledge=clamp(G.financialKnowledge+10,1,100); },
      wrongEffect:   G=>{ G.creditHealth=clamp(G.creditHealth-20,300,850); G.flash=0.4; G.flashC='#ef4444'; }
    },
    {
      icon:'📊',
      q:'Why is it important to diversify investments?',
      choices:['It guarantees profits','It reduces risk','It increases debt','It lowers your credit'],
      correct:1,
      correctFx:'Reward multiplier granted — combo boost!',
      wrongFx:'Volatility penalty — Interest Pressure +20!',
      correctEffect: G=>{ G.comboMult=Math.min(G.comboMult+1,5); G.financialKnowledge=clamp(G.financialKnowledge+12,1,100); },
      wrongEffect:   G=>{ G.interestPressure=clamp(G.interestPressure+20,0,100); G.flash=0.4; G.flashC='#ef4444'; }
    },
    {
      icon:'❄️',
      q:'The avalanche method means paying which debts first?',
      choices:['Smallest balance first','Newest debts first','Highest interest rate first','Oldest debts first'],
      correct:2,
      correctFx:'Avalanche power — Debt Balance -100!',
      wrongFx:'APR rises — Interest Pressure +15!',
      correctEffect: G=>{ G.debtBalance=clamp(G.debtBalance-100,0,1000); G.financialKnowledge=clamp(G.financialKnowledge+10,1,100); },
      wrongEffect:   G=>{ G.interestPressure=clamp(G.interestPressure+15,0,100); }
    },
    {
      icon:'🪙',
      q:'A credit score above 750 means you get:',
      choices:['Higher interest rates','Lower interest rates','More debt collectors','Fewer loan options'],
      correct:1,
      correctFx:'Credit shield active — damage reduced!',
      wrongFx:'Rate spike — debt grows faster!',
      correctEffect: G=>{ G.shieldHits=clamp(G.shieldHits+2,0,4); G.financialKnowledge=clamp(G.financialKnowledge+8,1,100); },
      wrongEffect:   G=>{ G.debtBalance=clamp(G.debtBalance+80,0,1000); G.interestPressure=clamp(G.interestPressure+10,0,100); }
    },
    {
      icon:'💵',
      q:'Paying only the minimum on a credit card means:',
      choices:['Debt clears fast','You pay more interest over time','Credit score jumps','No more interest'],
      correct:1,
      correctFx:'Financial Knowledge up — combo multiplier grows!',
      wrongFx:'Interest trap — Interest Pressure +25!',
      correctEffect: G=>{ G.financialKnowledge=clamp(G.financialKnowledge+15,1,100); G.comboMult=Math.min(G.comboMult+1,5); },
      wrongEffect:   G=>{ G.interestPressure=clamp(G.interestPressure+25,0,100); G.flash=0.5; G.flashC='#ef4444'; }
    }
  ];

  /* ─── ENCOURAGING COACH TIPS (GDD: positive, contextual) ───── */
  const COACH_TIPS_WIN=[
    'Your savings shielded you from major damage!',
    'Paying down debt made you faster — great strategy!',
    'High credit health reduced every hit you took!',
    'Managing interest pressure kept the boss weak!',
    'Your financial knowledge grew with every gate!',
    'Staying debt-free is the ultimate power-up!'
  ];
  const COACH_TIPS_LOSE=[
    'Tip: Keep savings above 30% to absorb big hits!',
    'Tip: Reduce debt early — it slows you down!',
    'Tip: Answer Knowledge Gates correctly for big bonuses!',
    'Tip: High interest pressure buffs the boss — watch it!',
    'Tip: Build your combo by chaining good pickups!',
    'Tip: Shield orbs block one full boss collision!'
  ];

  /* ─── HELPERS ───────────────────────────────────────────────── */
  function clamp(v,lo,hi){ return v<lo?lo:v>hi?hi:v; }
  function rnd(lo,hi){ return lo+Math.random()*(hi-lo); }
  function dist2(ax,ay,bx,by){ const dx=ax-bx,dy=ay-by; return dx*dx+dy*dy; }
  function geo(W,H){
    const pad=8, topUI=148;
    const aw=W-pad*2, ah=H-topUI-pad;
    const sh=Math.min(aw,ah);
    return { sh, ox:(W-sh)/2, oy:topUI+(ah-sh)/2 };
  }
  function toScreen(x,y,g){ return [g.ox+x*g.sh, g.oy+y*g.sh]; }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
  function setW(id,pct){ const el=document.getElementById(id); if(el) el.style.width=clamp(pct,0,100)+'%'; }

  /* ─── FINANCIAL HEALTH FORMULA (uses all 6 GDD metrics) ─────── */
  function finHealth(G){
    const csPct   = (G.creditHealth-300)/(850-300);        // 0..1
    const savPct  = clamp(G.savingsReserve/100,0,1);        // 0..1
    const debtPct = clamp(G.debtBalance/1000,0,1);          // 0..1 (GDD cap = 1000)
    const ipPct   = clamp(G.interestPressure/100,0,1);      // 0..1
    const kPct    = clamp((G.financialKnowledge-1)/99,0,1); // 0..1
    const rPct    = clamp(G.riskExposure/100,0,1);          // 0..1
    return clamp(Math.round(
      (csPct*0.30 + savPct*0.25 - debtPct*0.20 - ipPct*0.10 + kPct*0.10 - rPct*0.05)*1000
    ),0,1000);
  }

  function dmgMult(G){
    // Interest Pressure amplifies damage (GDD: bosses gain power as IP rises)
    const ipBoost = 1 + G.interestPressure*0.005;  // up to +50% at IP=100
    if(G.creditHealth>=750) return 0.75*ipBoost;
    if(G.creditHealth>=650) return 1.0 *ipBoost;
    if(G.creditHealth>=550) return 1.25*ipBoost;
    if(G.creditHealth>=400) return 1.5 *ipBoost;
    return 2.0*ipBoost;
  }

  function playerSpd(G){
    // Debt slows (GDD cap 1000), knowledge speeds slightly
    // GDD: "higher debt directly increases enemy strength" — also slows player
    const debtFactor = 1 - clamp(G.debtBalance/1000,0,1)*0.5;
    const kFactor    = 1 + clamp((G.financialKnowledge-1)/99,0,1)*0.15;
    return 0.38 * debtFactor * kFactor;
  }

  /* ─── STAR RATING (GDD: 1–5 stars) ─────────────────────────── */
  function calcStars(win, fhs, timeLeft, lv){
    if(!win){
      // loss = FHS hit 0, so rate it by how long the player survived
      const survived = lv&&lv.duration ? 1-clamp(timeLeft/lv.duration,0,1) : 0;
      if(survived>=0.75) return 2;
      if(survived>=0.4)  return 1;
      return 0;
    }
    // wins always end at timeLeft=0 — rate on Financial Health (0-1000)
    if(fhs>=850) return 5;
    if(fhs>=700) return 4;
    if(fhs>=550) return 3;
    if(fhs>=400) return 2;
    return 1;
  }
  function starStr(n){ return '★'.repeat(n)+'☆'.repeat(Math.max(0,5-n)); }

  /* ─── RESET / INIT ──────────────────────────────────────────── */
  function reset(lvlIdx){
    const lv=LEVELS[lvlIdx||0];
    const now=performance.now();
    G={
      phase:'select',
      lvlIdx:lvlIdx||0, lv,
      // ── 6 GDD financial metrics ──
      creditHealth:650,     creditHealthStart:650,
      debtBalance:0,        debtBalanceStart:0,       // GDD cap: 0–1000
      savingsReserve:40,    savingsReserveStart:40,    // GDD: 0–100 (%)
      interestPressure:0,   interestPressureStart:0,   // GDD: 0–100 (NEW)
      financialKnowledge:20,financialKnowledgeStart:20,// GDD: 1–100 (NEW)
      riskExposure:10,      riskExposureStart:10,      // GDD: 0–100 (NEW)
      // ── legacy aliases for item effects ──
      get creditScore(){ return this.creditHealth; },
      set creditScore(v){ this.creditHealth=v; },
      get debt(){ return this.debtBalance; },
      set debt(v){ this.debtBalance=v; },
      get savings(){ return this.savingsReserve; },
      set savings(v){ this.savingsReserve=clamp(v,0,100); },
      // ── vehicle ──
      px:0.5, py:0.5, pvx:0, pvy:0,
      dir:1, walkT:0,
      hitFlash:0, hitCD:0,
      shieldHits:0,
      tankArmor:0,    // GDD: Green Tank armor duration (seconds of damage immunity)
      // ── boss nemesis (GDD: appears randomly, not constant chaser) ──
      bActive:false,        // boss only active during appearance windows
      bAppearT:rnd(8,18),   // seconds until first appearance
      bDepartT:0,           // how long boss stays (set on appear)
      bx:0.15, by:0.15,
      bTargetX:0.5, bTargetY:0.5,
      bRetargetT:0,
      bSlowT:0,
      bossBuffT:0,          // penalty from wrong gate answer (boss speed boost)
      bossHitCount:0,       // GDD end stat: Boss Damage dealt
      // ── items on floor ──
      items:[], itemSpawnT:0,
      // ── GDD end-of-match stats ──
      citizensRescued:0,    // for end report (simulated via pickup count)
      debtDestroyed:0,      // total debt reduced this run
      savingsEarned:0,      // total savings% gained this run
      bestCombo:0,          // best combo achieved
      // ── combo system (GDD: up to ×5+) ──
      comboMult:1,          // current combo multiplier
      comboT:0,             // time since last combo-eligible action
      comboCount:0,         // consecutive chain
      // ── particles & floats ──
      parts:[], floats:[],
      // ── timer ──
      timeLeft:lv.duration,
      // ── knowledge gate (now quiz-based) ──
      gateT:25, gateIdx:0,
      // ── misc ──
      keys:{}, touch:null, drag:null,
      shake:0, flash:0, flashC:'#ef4444',
      last:now,
      firstAidStacks:0,
      startTime:now
    };
  }

  /* ─── SCREEN HTML ───────────────────────────────────────────── */
  window.SCREENS.game_debtsurv=function(){
    if(!G) reset(0);
    setTimeout(dsBoot,30);
    return `<div id="dsRoot" style="position:absolute;inset:0;background:#0f0f14;overflow:hidden;font-family:'Inter',sans-serif;color:#fff">

      <!-- TOP HUD: timer + level -->
      <div style="position:absolute;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(15,15,20,0.92);border-bottom:1px solid rgba(249,115,22,0.25)">
        <button onclick="dsExit()" style="padding:6px 13px;border:1px solid rgba(249,115,22,0.4);border-radius:8px;background:rgba(249,115,22,0.1);color:#fb923c;font-size:.6rem;letter-spacing:.1em;cursor:pointer;white-space:nowrap">← HUB</button>
        <div style="flex:1;text-align:center">
          <div style="font-size:.55rem;letter-spacing:.2em;color:rgba(255,255,255,0.45);font-family:monospace">⚔ DEBT SURVIVAL · GLADIATOR PIT</div>
        </div>
        <div style="text-align:right">
          <div id="dsTimer" style="font-size:1.3rem;font-weight:900;color:#fbbf24;line-height:1">--:--</div>
          <div style="font-size:.45rem;color:rgba(255,255,255,0.4);letter-spacing:.1em">TIME LEFT</div>
        </div>
      </div>

      <!-- STAT BARS ROW (6 GDD metrics) -->
      <div style="position:absolute;top:52px;left:0;right:0;z-index:10;padding:5px 16px;display:flex;flex-direction:column;gap:3px;background:rgba(15,15,20,0.85)">
        ${statBar('CREDIT','dsCSBar','dsCSTxt','#22c55e','0%')}
        ${statBar('DEBT','dsDebtBar','dsDebtTxt','#ef4444','0%')}
        ${statBar('SAVINGS','dsSavBar','dsSavTxt','#3b82f6','0%')}
        ${statBar('INTEREST','dsIPBar','dsIPTxt','#f97316','0%')}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1px">
          <div id="dsComboDisp" style="font-size:.52rem;font-weight:800;color:#fbbf24;letter-spacing:.06em">×1 COMBO</div>
          <div id="dsLvLabel" style="font-size:.5rem;letter-spacing:.14em;color:#fb923c"></div>
          <div id="dsStatus" style="font-size:.5rem;color:#fbbf24;min-width:80px;text-align:right"></div>
        </div>
      </div>

      <canvas id="dsCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:none"></canvas>

      <div id="dsGate" style="position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.82);backdrop-filter:blur(6px);padding:20px"></div>
      <div id="dsSelect" style="position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);padding:20px"></div>
      <div id="dsOver" style="position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.88);backdrop-filter:blur(6px);padding:20px"></div>
    </div>`;
  };

  function statBar(label,barId,txtId,color,w){
    return `<div style="display:flex;align-items:center;gap:8px">
      <div style="font-size:.40rem;letter-spacing:.1em;color:rgba(255,255,255,0.5);width:58px">${label}</div>
      <div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden">
        <div id="${barId}" style="height:100%;width:${w};background:${color};border-radius:4px;transition:width .18s"></div>
      </div>
      <div id="${txtId}" style="font-size:.48rem;font-weight:700;color:${color};min-width:52px;text-align:right">--</div>
    </div>`;
  }

  /* ─── BOOT / INPUT ──────────────────────────────────────────── */
  function dsBoot(){
    const cv=document.getElementById('dsCanvas'); if(!cv) return;
    if(_cleanupFn){ _cleanupFn(); _cleanupFn=null; }   // never stack window listener sets across re-renders
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);

    const kd=e=>{
      if(!G) return;
      G.keys[e.key.toLowerCase()]=true;
      if(['arrowleft','arrowright','arrowup','arrowdown',' '].includes(e.key.toLowerCase())||['w','a','s','d'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const ku=e=>{ if(G) G.keys[e.key.toLowerCase()]=false; };
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);

    let touchOrigin=null;
    cv.addEventListener('touchstart',e=>{
      if(!G) return;
      const t=e.touches[0];
      const r=cv.getBoundingClientRect();
      touchOrigin={x:t.clientX-r.left, y:t.clientY-r.top};
      G.drag={dx:0,dy:0};
      e.preventDefault();
    },{passive:false});
    cv.addEventListener('touchmove',e=>{
      if(!touchOrigin||!G) return;
      const t=e.touches[0];
      const r=cv.getBoundingClientRect();
      const dx=(t.clientX-r.left)-touchOrigin.x;
      const dy=(t.clientY-r.top)-touchOrigin.y;
      const d=Math.hypot(dx,dy)||1;
      G.drag={dx:d>8?dx/d:0, dy:d>8?dy/d:0};
      e.preventDefault();
    },{passive:false});
    const clrTouch=()=>{ touchOrigin=null; if(G) G.drag=null; };
    cv.addEventListener('touchend',clrTouch); cv.addEventListener('touchcancel',clrTouch);

    _cleanupFn=()=>{
      window.removeEventListener('resize',size);
      window.removeEventListener('keydown',kd);
      window.removeEventListener('keyup',ku);
    };
    G._cleanup=_cleanupFn;
    G.last=performance.now();
    showSelect();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  /* ─── LEVEL SELECT ──────────────────────────────────────────── */
  function showSelect(){
    const el=document.getElementById('dsSelect'); if(!el) return;
    el.style.display='flex';
    el.innerHTML=`<div style="max-width:480px;width:100%;text-align:center;padding:30px 24px;border:1px solid rgba(249,115,22,0.5);border-radius:20px;background:linear-gradient(160deg,#1a1a2e,#0f0f1a);box-shadow:0 0 60px rgba(249,115,22,0.25)">
      <div style="font-size:.5rem;letter-spacing:.22em;color:#fb923c;margin-bottom:8px">⚔ DEBT SURVIVAL · GLADIATOR PIT</div>
      <div style="font-size:2rem;margin-bottom:6px">🚗 vs 🚛</div>
      <p style="font-size:.82rem;color:rgba(255,255,255,0.65);margin:0 0 20px;line-height:1.5">Outrun the <b style="color:#ef4444">Debt Collector Nemesis</b>. Answer Knowledge Gates. Grab power-ups. Survive to earn ★★★★★.</p>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:8px">
        ${LEVELS.map((l,i)=>`<button onclick="dsStartLv(${i})" style="flex:1;min-width:120px;padding:12px 8px;border:1px solid rgba(249,115,22,0.4);border-radius:12px;background:rgba(249,115,22,0.08);color:#fbbf24;cursor:pointer;font-size:.7rem;font-weight:700;letter-spacing:.1em">
          <div>${l.label}</div>
          <div style="font-size:.55rem;color:rgba(255,255,255,0.5);margin-top:4px">${l.duration/60} min${l.duration>60?'s':''}</div>
        </button>`).join('')}
      </div>
      <p style="font-size:.55rem;color:rgba(255,255,255,0.3);margin-top:12px">WASD / Arrows · Touch drag to steer · Answer gates correctly for bonuses!</p>
    </div>`;
  }
  window.dsStartLv=function(i){
    reset(i);
    const el=document.getElementById('dsSelect'); if(el){el.style.display='none';el.innerHTML='';}
    G.phase='play'; G.last=performance.now();
    const lbl=document.getElementById('dsLvLabel'); if(lbl) lbl.textContent=LEVELS[i].label;
    spawnItems();
  };

  /* ─── ITEM SPAWNING ─────────────────────────────────────────── */
  function spawnItems(){
    const lv=G.lv;
    for(let i=0;i<lv.items;i++) spawnOneItem();
    G.itemSpawnT=lv.spawnRate;
  }

  function spawnOneItem(){
    const lv=G.lv;
    let pool;
    if(Math.random()<lv.trapRate) pool=TRAP_ITEMS;
    else pool=GOOD_ITEMS;
    const def=pool[Math.floor(Math.random()*pool.length)];
    let x,y,tries=0;
    do {
      x=rnd(0.06,0.94); y=rnd(0.06,0.94);
      tries++;
    } while(tries<20 && dist2(x,y,G.px,G.py)<0.08*0.08);
    G.items.push({ k:def.k, e:def.e, r:def.r, x, y, bob:Math.random()*6, life:20, pulse:0 });
  }

  // Spawn a trap item specifically (penalty from wrong gate answer)
  function spawnTrapItem(){
    const def=TRAP_ITEMS[Math.floor(Math.random()*TRAP_ITEMS.length)];
    let x=rnd(0.2,0.8), y=rnd(0.2,0.8);
    G.items.push({ k:def.k, e:def.e, r:def.r, x, y, bob:Math.random()*6, life:12, pulse:0 });
  }

  /* ─── MAIN LOOP ─────────────────────────────────────────────── */
  function loop(now){
    const cv=document.getElementById('dsCanvas');
    if(!cv||!G){ cancelAnimationFrame(raf); return; }
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    const dt=clamp((now-G.last)/1000,0,0.05); G.last=now;
    if(G.phase==='play') update(dt,W,H,now);
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  /* ─── UPDATE ────────────────────────────────────────────────── */
  function update(dt,W,H,now){
    // ── Timer ──
    G.timeLeft-=dt;
    if(G.timeLeft<=0){ G.timeLeft=0; return end(true); }
    const m=Math.floor(G.timeLeft/60), s=Math.floor(G.timeLeft%60);
    setTxt('dsTimer',(m<10?'0':'')+m+':'+(s<10?'0':'')+s);

    // ── Interest Pressure rises over time (GDD: buffs boss) ──
    G.interestPressure=clamp(G.interestPressure + G.lv.ipRate*dt, 0, 100);

    // ── Knowledge Gate every 25s ──
    G.gateT-=dt;
    if(G.gateT<=0) return openGate();

    // ── Player movement ──
    let mx=0,my=0;
    if(G.keys['a']||G.keys['arrowleft'])  mx-=1;
    if(G.keys['d']||G.keys['arrowright']) mx+=1;
    if(G.keys['w']||G.keys['arrowup'])    my-=1;
    if(G.keys['s']||G.keys['arrowdown'])  my+=1;
    if(G.drag){ mx+=G.drag.dx; my+=G.drag.dy; }
    const ml=Math.hypot(mx,my);
    if(ml>0){ mx/=ml; my/=ml; if(Math.abs(mx)>0.05) G.dir=mx>0?1:-1; G.walkT+=dt*10; }
    const spd=playerSpd(G);
    G.px=clamp(G.px+mx*spd*dt, 0.03, 0.97);
    G.py=clamp(G.py+my*spd*dt, 0.03, 0.97);

    // ── Combo decay: if no pickup for 4s, combo resets ──
    G.comboT+=dt;
    if(G.comboT>4 && G.comboMult>1){
      G.comboMult=Math.max(1,G.comboMult-1);
      G.comboT=0;
    }

    // ── Boss Nemesis (GDD: appears randomly, not constant chaser) ──
    if(!G.bActive){
      G.bAppearT-=dt;
      if(G.bAppearT<=0){
        // Boss appears at a random edge
        const edge=Math.floor(Math.random()*4);
        if(edge===0){ G.bx=rnd(0.05,0.95); G.by=0.04; }
        else if(edge===1){ G.bx=rnd(0.05,0.95); G.by=0.96; }
        else if(edge===2){ G.bx=0.04; G.by=rnd(0.05,0.95); }
        else { G.bx=0.96; G.by=rnd(0.05,0.95); }
        G.bActive=true;
        G.bDepartT=rnd(8,16);  // stays for 8–16s then retreats
        G.bRetargetT=0;
        floatTxt(0.5,0.25,'💀 DEBT COLLECTOR INCOMING!','#fca5a5',true);
        G.shake=0.3;
      }
    } else {
      // Boss pursues player while active
      if(G.bRetargetT<=0){
        G.bTargetX=G.px; G.bTargetY=G.py;
        G.bRetargetT=1.5;
      }
      G.bRetargetT-=dt;
      if(G.bossBuffT>0) G.bossBuffT-=dt;
      const bSpd=(G.bSlowT>0 ? G.lv.bossSpd*0.35 : G.lv.bossSpd) * (G.bossBuffT>0?1.5:1.0)
               * (1 + G.interestPressure*0.006); // IP buffs boss speed (GDD)
      if(G.bSlowT>0) G.bSlowT-=dt;
      const bdx=G.bTargetX-G.bx, bdy=G.bTargetY-G.by, bd=Math.hypot(bdx,bdy)||1;
      G.bx=clamp(G.bx+bdx/bd*bSpd*dt, 0.03, 0.97);
      G.by=clamp(G.by+bdy/bd*bSpd*dt, 0.03, 0.97);

      // Boss departure
      G.bDepartT-=dt;
      if(G.bDepartT<=0){
        G.bActive=false;
        G.bAppearT=rnd(10,22); // wait before next appearance
        floatTxt(0.5,0.25,'💀 DEBT COLLECTOR RETREATS!','#86efac',true);
      }

      // ── Boss collision with player ──
      if(G.hitCD<=0 && dist2(G.bx,G.by,G.px,G.py)<(0.055+0.04)*(0.055+0.04)){
        if(G.tankArmor>0){
          // GDD: Green Tank armor — shrug off enemy contact
          floatTxt(G.px,G.py-0.05,'🟢 ARMOR BLOCKED!','#4ade80');
          G.shake=0.2; G.hitCD=0.8;
          G.bossHitCount++; // armor deflection counts as boss damage
        } else if(G.shieldHits>0){
          G.shieldHits--;
          floatTxt(G.px,G.py-0.05,'🔮 SHIELD BLOCKED!','#a78bfa');
          G.shake=0.4; G.hitCD=1.0;                  // i-frames, else all charges drain in one overlap
        } else {
          const mult=dmgMult(G);
          G.creditHealth=clamp(G.creditHealth - Math.round(50*mult), 300, 850);
          G.debtBalance=clamp(G.debtBalance + Math.round(80*mult), 0, 1000);
          G.savingsReserve=clamp(G.savingsReserve - Math.round(10*mult), 0, 100);
          G.riskExposure=clamp(G.riskExposure+10, 0, 100);
          G.hitFlash=0.4; G.shake=0.5; G.hitCD=1.2;
          G.comboMult=1; G.comboT=0; // collision breaks combo
          burst(G.px,G.py,'#ef4444',10);
          floatTxt(G.px,G.py-0.05,'💥 DEBT COLLECTOR HIT!','#fca5a5',true);
          if(finHealth(G)<=0) return end(false);
        }
      }
    }
    if(G.hitCD>0) G.hitCD-=dt;   // tick cooldown even while boss is away

    // ── Item timers ──
    G.itemSpawnT-=dt;
    if(G.itemSpawnT<=0){ spawnOneItem(); G.itemSpawnT=G.lv.spawnRate; }

    // ── Item collision ──
    for(const it of G.items){
      it.bob+=dt*4; it.life-=dt; it.pulse+=dt*5;
      if(it.life<=0){ it.dead=1; continue; }
      if(dist2(it.x,it.y,G.px,G.py)<(it.r+0.04)*(it.r+0.04)){
        applyItem(it);
        it.dead=1;
      }
    }
    G.items=G.items.filter(i=>!i.dead);

    // ── Timers ──
    if(G.tankArmor>0) G.tankArmor-=dt;
    if(G.hitFlash>0) G.hitFlash-=dt;
    if(G.shake>0) G.shake-=dt;
    if(G.flash>0) G.flash-=dt;

    // ── Particles & floats ──
    for(const p of G.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=0.3*dt; p.life-=dt; }
    G.parts=G.parts.filter(p=>p.life>0);
    for(const f of G.floats){ f.y-=dt*0.09; f.life-=dt; }
    G.floats=G.floats.filter(f=>f.life>0);

    // ── HUD sync ──
    syncHUD();

    // ── Lose check ──
    if(finHealth(G)<=0) end(false);
  }

  function syncHUD(){
    // Credit Health: 300–850
    const csPct=((G.creditHealth-300)/550)*100;
    setW('dsCSBar',csPct);
    setTxt('dsCSTxt',G.creditHealth);

    // Debt Balance: 0–1000 (GDD cap)
    const debtPct=clamp(G.debtBalance/1000,0,1)*100;
    setW('dsDebtBar',debtPct);
    setTxt('dsDebtTxt',G.debtBalance+'/1000');

    // Savings Reserve: 0–100%
    setW('dsSavBar',clamp(G.savingsReserve,0,100));
    setTxt('dsSavTxt',Math.round(G.savingsReserve)+'%');

    // Interest Pressure: 0–100 (NEW)
    setW('dsIPBar',clamp(G.interestPressure,0,100));
    const ipColor=G.interestPressure>70?'#ef4444':G.interestPressure>40?'#fb923c':'#f97316';
    const ipEl=document.getElementById('dsIPTxt');
    if(ipEl){ ipEl.textContent=Math.round(G.interestPressure)+'%'; ipEl.style.color=ipColor; }
    const ipBar=document.getElementById('dsIPBar');
    if(ipBar) ipBar.style.background=ipColor;

    // Combo display (GDD: up to ×5+)
    const cDisp=document.getElementById('dsComboDisp');
    if(cDisp){
      cDisp.textContent='×'+G.comboMult+' COMBO';
      cDisp.style.color=G.comboMult>=5?'#fbbf24':G.comboMult>=3?'#fb923c':'rgba(255,255,255,0.45)';
    }

    // Status line
    const st=document.getElementById('dsStatus'); if(!st) return;
    if(G.tankArmor>0) st.textContent='🟢 ARMOR '+Math.ceil(G.tankArmor)+'s';
    else if(G.shieldHits>0) st.textContent='🔮 SHIELD ×'+G.shieldHits;
    else if(G.bSlowT>0) st.textContent='🟡 SLOWING BOSS';
    else if(G.bActive) st.textContent='💀 BOSS ACTIVE!';
    else st.textContent='';
  }

  /* ─── APPLY ITEM EFFECT ─────────────────────────────────────── */
  function applyItem(it){
    burst(it.x,it.y,'#fbbf24',8);

    // Advance combo (GDD: chain of good actions builds multiplier up to ×5+)
    if(it.k!=='scam' && it.k!=='latefee'){
      G.comboCount++;
      G.comboT=0;
      if(G.comboCount%3===0 && G.comboMult<5){
        G.comboMult++;
        floatTxt(it.x,it.y-0.07,'×'+G.comboMult+' COMBO!','#fbbf24',true);
      }
      if(G.comboMult>G.bestCombo) G.bestCombo=G.comboMult;
    } else {
      // Trap breaks combo
      G.comboMult=1; G.comboCount=0;
    }

    switch(it.k){
      case 'coin':
        G.savingsReserve=clamp(G.savingsReserve+5,0,100);
        G.creditHealth=clamp(G.creditHealth+5,300,850);
        G.savingsEarned+=5;
        // Citizen rescue simulation: coin pickups represent helping citizens
        if(Math.random()<0.25){ G.citizensRescued++; floatTxt(it.x,it.y-0.08,'👤 CITIZEN RESCUED!','#86efac'); }
        floatTxt(it.x,it.y-0.03,'🪙 SAV+5%','#fbbf24'); break;
      case 'cash':
        G.savingsReserve=clamp(G.savingsReserve+12,0,100);
        G.creditHealth=clamp(G.creditHealth+10,300,850);
        G.savingsEarned+=12;
        if(Math.random()<0.35){ G.citizensRescued++; floatTxt(it.x,it.y-0.08,'👤 CITIZEN RESCUED!','#86efac'); }
        floatTxt(it.x,it.y-0.03,'💵 SAV+12%','#86efac'); break;
      case 'tank':
        // GDD: Green Tank — temporary armored hull that shrugs off enemy contact damage
        G.tankArmor=6; // seconds of damage immunity (boss collisions blocked)
        G.shieldHits=clamp(G.shieldHits+1,0,4); // 1 extra block from armor
        G.creditHealth=clamp(G.creditHealth+15,300,850);
        floatTxt(it.x,it.y-0.03,'🟢 ARMOR UP! 6s IMMUNITY','#4ade80',true);
        G.flash=0.3; G.flashC='#22c55e'; break;
      case 'puddle':
        G.bSlowT=3;
        G.bossHitCount++; // counts as hitting the boss
        floatTxt(it.x,it.y-0.03,'🟡 BOSS SLOWED 3s','#fde68a'); break;
      case 'shield':
        // GDD: Shield Orb — savings-powered shield bubble that absorbs one big hit
        G.shieldHits=clamp(G.shieldHits+2,0,4);
        G.savingsReserve=clamp(G.savingsReserve+5,0,100);
        floatTxt(it.x,it.y-0.03,'🔮 SHIELD ×'+G.shieldHits,'#a78bfa'); break;
      case 'firstaid':
        G.firstAidStacks=clamp(G.firstAidStacks+1,0,4);
        const redPct=[0.25,0.50,0.75,1.0][G.firstAidStacks-1];
        const cut=Math.round(G.debtBalance*redPct);
        G.debtBalance=Math.round(G.debtBalance*(1-redPct));
        G.debtDestroyed+=cut;
        G.interestPressure=clamp(G.interestPressure-8,0,100);
        floatTxt(it.x,it.y-0.03,'💊 DEBT -'+Math.round(redPct*100)+'%','#86efac',true); break;
      case 'debtray':
        // GDD: Debt Ray — BENEFICIAL pickup: focused beam that melts debt, reduces Debt Balance & Interest Pressure
        { const raycut=Math.round(80+Math.random()*60); // 80–140 debt destroyed
          G.debtBalance=clamp(G.debtBalance-raycut,0,1000);
          G.debtDestroyed+=raycut;
          G.interestPressure=clamp(G.interestPressure-12,0,100);
          G.creditHealth=clamp(G.creditHealth+10,300,850);
          G.bossHitCount++; // ray hit counts as boss damage
          G.flash=0.3; G.flashC='#22c55e';
          floatTxt(it.x,it.y-0.03,'⚡ DEBT RAY! -'+raycut+' DEBT','#4ade80',true); break; }
      // ── HAZARDS (GDD: Scam Box high-risk/random; Late Fee Trap adds penalties) ──
      case 'scam':
        // GDD: Scam Box — high risk / high reward: random jackpot OR predatory trap
        if(Math.random()<0.35){
          // Jackpot outcome (35% chance)
          G.savingsReserve=clamp(G.savingsReserve+20,0,100);
          G.savingsEarned+=20;
          G.creditHealth=clamp(G.creditHealth+20,300,850);
          G.flash=0.3; G.flashC='#22c55e';
          floatTxt(it.x,it.y-0.04,'📦 JACKPOT! SAV+20%','#4ade80',true);
          G.comboMult=Math.min(G.comboMult+1,5); G.comboCount=0; // jackpot builds combo
        } else {
          // Trap outcome (65% chance)
          G.debtBalance=clamp(G.debtBalance+100,0,1000);
          G.creditHealth=clamp(G.creditHealth-40,300,850);
          G.riskExposure=clamp(G.riskExposure+20,0,100);
          G.hitFlash=0.5; G.shake=0.4; G.flash=0.5; G.flashC='#ef4444';
          floatTxt(it.x,it.y-0.04,'📦 SCAM! DEBT+100','#fca5a5',true);
        }
        break;
      case 'latefee':
        // GDD: Late Fee Trap — red warning symbol, adds penalties on contact
        G.debtBalance=clamp(G.debtBalance+60,0,1000);
        G.interestPressure=clamp(G.interestPressure+15,0,100);
        G.creditHealth=clamp(G.creditHealth-25,300,850);
        G.riskExposure=clamp(G.riskExposure+10,0,100);
        G.hitFlash=0.4; G.shake=0.3; G.flash=0.4; G.flashC='#ef4444';
        floatTxt(it.x,it.y-0.04,'🔴 LATE FEE! DEBT+60','#fca5a5',true); break;
    }
    if(finHealth(G)<=0) end(false);
  }

  /* ─── RENDER ────────────────────────────────────────────────── */
  function render(ctx,W,H,now){
    ctx.clearRect(0,0,W,H);
    if(G.phase==='select'||G.phase==='over'||G.phase==='gate') return;
    const g=geo(W,H);
    let ox=0,oy=0;
    if(G.shake>0){ ox=(Math.random()-.5)*G.shake*18; oy=(Math.random()-.5)*G.shake*18; }
    ctx.save(); ctx.translate(ox,oy);

    drawArena(ctx,W,H,g,now);

    if(G.flash>0){
      ctx.fillStyle='rgba('+(G.flashC==='#22c55e'?'34,197,94':'239,68,68')+','+(G.flash*0.25)+')';
      ctx.fillRect(0,0,W,H);
    }

    ctx.textAlign='center'; ctx.textBaseline='middle';

    // ── Items on floor ──
    for(const it of G.items){
      const [sx,sy]=toScreen(it.x,it.y,g);
      const bob=Math.sin(it.bob)*3;
      const a=it.life<3?Math.max(0.2,it.life/3):1;
      ctx.globalAlpha=a;
      const pr=it.r*g.sh*1.6*(1+0.12*Math.sin(it.pulse));
      const isTrap=it.k==='scam'||it.k==='latefee';
      ctx.strokeStyle=isTrap?'rgba(249,115,22,0.6)':'rgba(34,197,94,0.5)';
      ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(sx,sy+bob,pr,0,Math.PI*2); ctx.stroke();
      ctx.shadowColor=isTrap?'#f97316':'#22c55e'; ctx.shadowBlur=12;
      ctx.font=(it.r*g.sh*2.2)+'px serif'; ctx.fillText(it.e,sx,sy+bob);
      ctx.shadowBlur=0; ctx.globalAlpha=1;
    }

    // ── Boss (only when active) ──
    if(G.bActive) drawBoss(ctx,g,now);

    // ── Player vehicle ──
    drawPlayer(ctx,g,now);

    // ── Particles ──
    for(const p of G.parts){
      const [sx,sy]=toScreen(p.x,p.y,g);
      ctx.globalAlpha=clamp(p.life/p.max,0,1);
      ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(sx,sy,p.s,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;

    // ── Float texts ──
    ctx.textAlign='center';
    for(const f of G.floats){
      const [sx,sy]=toScreen(f.x,f.y,g);
      ctx.globalAlpha=clamp(f.life,0,1);
      ctx.fillStyle=f.c; ctx.font='700 '+(f.big?18:13)+'px Inter,sans-serif';
      ctx.shadowColor='rgba(0,0,0,0.7)'; ctx.shadowBlur=4;
      ctx.fillText(f.t,sx,sy); ctx.shadowBlur=0;
    }
    ctx.globalAlpha=1;

    // ── Boss incoming countdown (show when inactive) ──
    if(!G.bActive && G.bAppearT<6){
      const g2=geo(W,H);
      const [sx,sy]=toScreen(0.5,0.12,g2);
      ctx.globalAlpha=0.5+0.4*Math.sin(now*0.015);
      ctx.fillStyle='#fca5a5'; ctx.font='700 11px Inter,sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('💀 NEMESIS IN '+Math.ceil(G.bAppearT)+'s',sx,sy);
      ctx.globalAlpha=1;
    }

    ctx.restore();
  }

  function drawArena(ctx,W,H,g,now){
    const {sh,ox,oy}=g;
    ctx.fillStyle='#0f0f14'; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.beginPath(); ctx.rect(ox,oy,sh,sh); ctx.clip();
    const grad=ctx.createRadialGradient(ox+sh/2,oy+sh*0.45,sh*0.05, ox+sh/2,oy+sh/2,sh*0.8);
    grad.addColorStop(0,'#1a1a30'); grad.addColorStop(0.6,'#13131f'); grad.addColorStop(1,'#0c0c16');
    ctx.fillStyle=grad; ctx.fillRect(ox,oy,sh,sh);
    // Neon grid — redder when Interest Pressure is high
    const ipFrac=G.interestPressure/100;
    ctx.strokeStyle=`rgba(${Math.round(249+ipFrac*6)},${Math.round(115-ipFrac*80)},22,0.06)`; ctx.lineWidth=1;
    const step=sh/14;
    for(let i=1;i<14;i++){
      ctx.beginPath(); ctx.moveTo(ox+i*step,oy); ctx.lineTo(ox+i*step,oy+sh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox,oy+i*step); ctx.lineTo(ox+sh,oy+i*step); ctx.stroke();
    }
    const pr=sh*0.28+Math.sin(now*0.0015)*5;
    ctx.strokeStyle='rgba(249,115,22,0.08)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(ox+sh/2,oy+sh/2,pr,0,Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.shadowColor='#f97316'; ctx.shadowBlur=16;
    ctx.strokeStyle='rgba(249,115,22,0.6)'; ctx.lineWidth=3;
    ctx.strokeRect(ox+2,oy+2,sh-4,sh-4);
    ctx.restore();
  }

  function drawPlayer(ctx,g,now){
    const [sx,sy]=toScreen(G.px,G.py,g);
    const sz=g.sh*0.055;
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(sx,sy+sz*0.7,sz*0.75,sz*0.25,0,0,Math.PI*2); ctx.fill();
    if(G.shieldHits>0){
      const alpha=0.5+0.3*Math.sin(now*0.012);
      ctx.strokeStyle=`rgba(167,139,250,${alpha})`; ctx.lineWidth=3;
      ctx.shadowColor='#a78bfa'; ctx.shadowBlur=18;
      ctx.beginPath(); ctx.arc(sx,sy,sz*1.6,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    }
    if(G.tankArmor>0){
      // GDD: Green Tank armor — show green armored ring around vehicle
      const aa=0.5+0.4*Math.sin(now*0.018);
      ctx.strokeStyle=`rgba(34,197,94,${aa})`; ctx.lineWidth=3;
      ctx.shadowColor='#22c55e'; ctx.shadowBlur=16;
      ctx.beginPath(); ctx.arc(sx,sy,sz*1.5,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    }
    // Combo aura
    if(G.comboMult>=3){
      const ca=0.3+0.2*Math.sin(now*0.02);
      ctx.strokeStyle=`rgba(251,191,36,${ca})`; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(sx,sy,sz*2.0,0,Math.PI*2); ctx.stroke();
    }
    ctx.save(); ctx.translate(sx,sy); ctx.scale(G.dir,1);
    ctx.shadowColor=G.hitFlash>0?'#ef4444':'#f97316';
    ctx.shadowBlur=G.hitFlash>0?28:14;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font=sz*2.1+'px serif'; ctx.fillText('🚗',0,0);
    if(G.debtBalance>400){
      ctx.globalAlpha=0.5+0.3*Math.sin(now*0.015);
      ctx.font=sz*1.4+'px serif';
      ctx.fillText('💨',sz*0.8,-sz*0.6);
      ctx.globalAlpha=1;
    }
    ctx.restore(); ctx.shadowBlur=0;
    if(G.hitFlash>0){
      ctx.globalAlpha=G.hitFlash*0.55; ctx.fillStyle='#ef4444';
      ctx.beginPath(); ctx.arc(sx,sy,sz*1.4,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    }
  }

  function drawBoss(ctx,g,now){
    const [sx,sy]=toScreen(G.bx,G.by,g);
    const sz=g.sh*0.070;
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(sx,sy+sz*0.8,sz*0.9,sz*0.28,0,0,Math.PI*2); ctx.fill();
    if(G.bSlowT>0){
      ctx.strokeStyle='rgba(253,224,71,0.7)'; ctx.lineWidth=3;
      ctx.shadowColor='#fde047'; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(sx,sy,sz*1.8,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    }
    if(G.bossBuffT>0){
      ctx.strokeStyle='rgba(239,68,68,0.8)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(sx,sy,sz*2.2,0,Math.PI*2); ctx.stroke();
    }
    // IP-scaled size (GDD: Interest Pressure buffs boss)
    const ipScale=1+G.interestPressure*0.003;
    const bdx=G.bTargetX-G.bx; const flip=bdx>0?1:-1;
    ctx.save(); ctx.translate(sx,sy); ctx.scale(flip*ipScale,ipScale);
    ctx.shadowColor='#ef4444'; ctx.shadowBlur=22;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font=sz*2.0+'px serif'; ctx.fillText('🚛',0,0);
    ctx.restore(); ctx.shadowBlur=0;
    const pulse=(Math.sin(now*0.008)*0.5+0.5)*0.4+0.2;
    ctx.strokeStyle=`rgba(239,68,68,${pulse})`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(sx,sy,sz*1.9*ipScale,0,Math.PI*2); ctx.stroke();
    ctx.font='700 9px Inter,sans-serif'; ctx.fillStyle='#fca5a5';
    ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillText('💀 DEBT COLLECTOR',sx,sy+sz*1.1*ipScale);
    // Depart timer bar
    const dRatio=clamp(G.bDepartT/16,0,1);
    const bw=sz*4;
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(sx-bw/2, sy-sz*1.6, bw, 5);
    ctx.fillStyle='#ef4444';
    ctx.fillRect(sx-bw/2, sy-sz*1.6, bw*dRatio, 5);
  }

  /* ─── PARTICLES & FLOATS ────────────────────────────────────── */
  function burst(x,y,c,n){
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2, s=0.15+Math.random()*0.5;
      G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,s:2+Math.random()*3,c,life:0.5+Math.random()*0.3,max:0.8});
    }
  }
  function floatTxt(x,y,t,c,big){ G.floats.push({x,y,t,c,life:1.1,big:!!big}); }

  /* ─── KNOWLEDGE GATE (GDD: quiz with correct/wrong effects) ── */
  function openGate(){
    if(!G||G.phase!=='play') return;
    G.phase='gate';
    const q=GATE_QUESTIONS[G.gateIdx%GATE_QUESTIONS.length]; G.gateIdx++;
    const o=document.getElementById('dsGate'); if(!o){ G.phase='play'; G.gateT=25; return; }
    o.style.display='flex';
    const shuffled=q.choices.map((c,i)=>({c,i})).sort(()=>Math.random()-0.5);
    o.innerHTML=`<div style="max-width:460px;width:100%;text-align:center;padding:28px 24px;border:1px solid rgba(249,115,22,0.6);border-radius:20px;background:linear-gradient(160deg,#1a1428,#0f0f1a);box-shadow:0 0 60px rgba(249,115,22,0.35)">
      <div style="font-size:.45rem;letter-spacing:.2em;color:#fb923c;margin-bottom:10px">⚡ KNOWLEDGE GATE</div>
      <div style="font-size:2.4rem;margin-bottom:8px">${q.icon}</div>
      <p style="font-size:.9rem;line-height:1.5;color:#fff;font-weight:700;margin:0 0 18px">${q.q}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        ${shuffled.map(({c,i})=>`<button onclick="dsGateAnswer(${i},${q.correct})" style="padding:12px 10px;border:1px solid rgba(249,115,22,0.35);border-radius:10px;background:rgba(249,115,22,0.07);color:#fff;font-size:.72rem;cursor:pointer;text-align:left;line-height:1.3">${c}</button>`).join('')}
      </div>
      <div id="dsGateResult" style="min-height:30px;font-size:.68rem;color:#fbbf24;margin-top:4px"></div>
    </div>`;
  }

  window.dsGateAnswer=function(chosen, correct){
    if(!G||G.phase!=='gate') return;
    const q=GATE_QUESTIONS[(G.gateIdx-1)%GATE_QUESTIONS.length];
    const isCorrect=(chosen===correct);
    const res=document.getElementById('dsGateResult');

    // Apply effect to game state
    if(isCorrect){
      q.correctEffect(G);
      if(res) res.innerHTML=`<span style="color:#4ade80">✅ CORRECT! ${q.correctFx}</span>`;
    } else {
      q.wrongEffect(G);
      if(res) res.innerHTML=`<span style="color:#f87171">💪 NICE TRY! ${q.wrongFx}</span>`;
    }

    // Grey out buttons
    const btns=document.querySelectorAll('#dsGate button');
    btns.forEach(b=>{ b.disabled=true; b.style.opacity='0.5'; });

    // Auto-continue after 1.8s
    // GDD: gate interval scales with Financial Knowledge — more knowledge = gates appear more often (edge of mastery)
    clearTimeout(gateTimer);
    gateTimer=setTimeout(()=>{
      gateTimer=null;
      if(!G) return;
      const kFrac=clamp((G.financialKnowledge-1)/99,0,1);
      G.gateT=25 - kFrac*10; // 25s at knowledge=1, down to 15s at knowledge=100
      G.phase='play'; G.last=performance.now();
      const o=document.getElementById('dsGate'); if(o){o.style.display='none';o.innerHTML='';}
    }, 1800);
  };

  /* ─── END SCREEN (GDD: star rating, headline stats, coach tip) ─ */
  function end(win){
    if(!G||G.phase==='over') return;
    G.phase='over';
    const fhs=finHealth(G);
    const stars=calcStars(win, fhs, G.timeLeft, G.lv);
    if(window.state){
      state.gamesDone=state.gamesDone||{};
      if(stars>=1 && window.cvAwardGame){
        // replay-safe award (400/600/900 flagship table) + persists stars/level/badge
        cvAwardGame('game_debtsurv',{level:(G.lvlIdx||0)+1,stars:Math.min(3,stars),badge:'Debt Survivor',is3star:stars>=3,isPerfect:win&&fhs>=800,isFlagship:true});
      } else {
        state.coins=(state.coins||0)+50;             // small consolation on a wipe-out
        if(window.cvAddXP) cvAddXP(20,0);
        if(window.cvSave) cvSave();
      }
    }
    const starDisp=starStr(stars);

    // GDD: Encouraging Coach tip (contextual, not random quote)
    let coachTip;
    if(win){
      if(G.savingsReserve>60) coachTip=COACH_TIPS_WIN[0];
      else if(G.debtBalance<200) coachTip=COACH_TIPS_WIN[1];
      else if(G.creditHealth>750) coachTip=COACH_TIPS_WIN[2];
      else if(G.interestPressure<30) coachTip=COACH_TIPS_WIN[3];
      else if(G.financialKnowledge>60) coachTip=COACH_TIPS_WIN[4];
      else coachTip=COACH_TIPS_WIN[5];
    } else {
      if(G.savingsReserve<20) coachTip=COACH_TIPS_LOSE[0];
      else if(G.debtBalance>600) coachTip=COACH_TIPS_LOSE[1];
      else if(G.financialKnowledge<30) coachTip=COACH_TIPS_LOSE[2];
      else if(G.interestPressure>70) coachTip=COACH_TIPS_LOSE[3];
      else if(G.bestCombo<2) coachTip=COACH_TIPS_LOSE[4];
      else coachTip=COACH_TIPS_LOSE[5];
    }

    const elapsedMin=Math.floor((G.lv.duration-G.timeLeft)/60);
    const elapsedSec=Math.floor((G.lv.duration-G.timeLeft)%60);
    const o=document.getElementById('dsOver'); if(!o) return;
    o.style.display='flex';
    o.innerHTML=`<div style="max-width:480px;width:100%;text-align:center;padding:28px 20px;border:1px solid ${win?'rgba(249,115,22,0.6)':'rgba(239,68,68,0.5)'};border-radius:20px;background:linear-gradient(160deg,#1a1428,#0f0f1a);box-shadow:0 0 60px ${win?'rgba(249,115,22,0.4)':'rgba(239,68,68,0.35)'}">

      <!-- STAR RATING (GDD: 1–5 stars) -->
      <div style="font-size:1.8rem;letter-spacing:4px;color:#fbbf24;margin-bottom:2px">${starDisp}</div>
      <div style="font-size:.48rem;letter-spacing:.2em;color:rgba(255,255,255,0.35);margin-bottom:6px">ARENA RATING</div>
      <div style="font-size:.55rem;letter-spacing:.22em;color:${win?'#fbbf24':'#fca5a5'};margin-bottom:4px">${win?'YOU SURVIVED!':'FINANCIAL HEALTH DEPLETED'}</div>
      <div style="font-size:.58rem;color:rgba(255,255,255,0.45);margin-bottom:14px">Survived ${elapsedMin>0?elapsedMin+'m ':''}${elapsedSec}s · ${G.lv.label}</div>

      <!-- GDD END-OF-MATCH HEADLINE STATS -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px;margin-bottom:12px;text-align:left">
        <div style="font-size:.48rem;letter-spacing:.15em;color:rgba(255,255,255,0.45);margin-bottom:8px;text-align:center">MATCH REPORT</div>
        ${endStatRow('💳 Debt Destroyed',  G.debtBalanceStart, G.debtBalance, G.debtDestroyed,  'debt')}
        ${endStatRow('📈 Credit Improved', G.creditHealthStart, G.creditHealth, null,            'credit')}
        ${endStatRow('💰 Savings Earned',  G.savingsReserveStart, G.savingsReserve, G.savingsEarned, 'savings')}
        ${endStatRow('🔥 Interest Cleared',G.interestPressureStart, G.interestPressure, null,   'interest')}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="font-size:.6rem;color:rgba(255,255,255,0.6)">👤 Citizens Rescued</span>
          <span style="font-size:.6rem;color:#4ade80;font-weight:700">${G.citizensRescued}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="font-size:.6rem;color:rgba(255,255,255,0.6)">💥 Boss Damage</span>
          <span style="font-size:.6rem;color:#fb923c;font-weight:700">${G.bossHitCount}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0">
          <span style="font-size:.6rem;color:rgba(255,255,255,0.6)">⚡ Best Combo</span>
          <span style="font-size:.6rem;color:#fbbf24;font-weight:700">×${G.bestCombo}</span>
        </div>
      </div>

      <!-- ENCOURAGING COACH TIP (GDD: positive, contextual) -->
      <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.25);border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;gap:8px;align-items:flex-start;text-align:left">
        <div style="font-size:1.2rem;flex-shrink:0">🏆</div>
        <div>
          <div style="font-size:.4rem;letter-spacing:.15em;color:#fb923c;margin-bottom:3px">COACH SAYS</div>
          <p style="font-size:.74rem;line-height:1.45;color:#fff;margin:0">${coachTip}</p>
        </div>
      </div>

      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button onclick="dsRestart()" style="padding:11px 18px;border:none;border-radius:12px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-weight:900;font-size:.66rem;letter-spacing:.1em;cursor:pointer">▶ PLAY AGAIN</button>
        <button onclick="dsChangeLv()" style="padding:11px 18px;border:1px solid rgba(249,115,22,0.4);border-radius:12px;background:rgba(249,115,22,0.08);color:#fb923c;font-weight:700;font-size:.66rem;letter-spacing:.1em;cursor:pointer">⚙ CHANGE LEVEL</button>
        <button onclick="dsExit()" style="padding:11px 18px;border:1px solid rgba(255,255,255,0.15);border-radius:12px;background:rgba(255,255,255,0.05);color:#fff;font-size:.66rem;cursor:pointer">← HUB</button>
      </div>
    </div>`;
  }

  // GDD: headline stat rows showing start→end delta
  function endStatRow(label, before, after, earned, type){
    let better, dispVal, unit='';
    if(type==='debt'){
      better=earned>0||after<=before;   // destroying debt is a win even if some balance remains
      dispVal=earned>0?'-'+earned:String(after-before);
    } else if(type==='interest'){
      better=after<before;
      dispVal=(after-before>0?'+':'')+Math.round(after-before);
      unit='%';
    } else if(type==='savings'){
      better=after>before;
      dispVal=earned>0?'+'+Math.round(earned)+'%':(Math.round(after-before)+'%');
    } else {
      better=after>before;
      dispVal=(after-before>0?'+':'')+Math.round(after-before);
    }
    const same=before===after;
    const c=same?'#fbbf24':better?'#4ade80':'#f87171';
    const arrow=same?'→':better?'▲':'▼';
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <span style="font-size:.6rem;color:rgba(255,255,255,0.6)">${label}</span>
      <span style="font-size:.6rem;color:rgba(255,255,255,0.35)">${Math.round(before)}${unit} → ${Math.round(after)}${unit}</span>
      <span style="font-size:.62rem;color:${c};font-weight:700">${arrow} ${dispVal}${unit}</span>
    </div>`;
  }

  window.dsRestart=function(){
    const lvl=G?G.lvlIdx:0;
    reset(lvl);
    const o=document.getElementById('dsOver'); if(o){o.style.display='none';o.innerHTML='';}
    G.phase='play'; G.last=performance.now();
    const lbl=document.getElementById('dsLvLabel'); if(lbl) lbl.textContent=LEVELS[lvl].label;
    spawnItems();
  };
  window.dsChangeLv=function(){
    const o=document.getElementById('dsOver'); if(o){o.style.display='none';o.innerHTML='';}
    reset(0);
    showSelect();
  };
  window.dsExit=function(){
    clearTimeout(gateTimer); gateTimer=null;
    if(_cleanupFn){ _cleanupFn(); _cleanupFn=null; }
    else if(G&&G._cleanup) G._cleanup();
    cancelAnimationFrame(raf); G=null;
    if(window.state) state.viewingWorld=state._returnHub||'rebuilder';
    goTo('hub');
  };

})();
