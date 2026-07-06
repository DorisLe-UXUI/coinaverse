/* ════════════════════════════════════════════════════════════════
   MONEY CATCHER v4.1 — GDD v3.0-spec implementation
   Guardian / SaveScape Orbit — ages 8-13
   Piggy bank catches falling money; dodge Savings Killers.
   Stamina replaces lives. Combo multiplier (per-district cap).
   9 power-ups. 5 negative item types. Financial literacy embedded.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='guardian';
  let G=null, raf=null;

  // ── Level configs (GDD v3.0 — 5 SaveScape Districts) ───────────
  // comboCap: per-district max multiplier (GDD §05)
  const LEVELS=[
    {name:'Penny Park 2075',   dur:90,  moneyGoal:10000, stockGoal:15, spawnRate:2.0, ramp:0.02, negRate:0.10, speedStart:1.0, speedEnd:1.5, puChance:0.10, comboCap:5},
    {name:'Allowance Alley',   dur:120, moneyGoal:25000, stockGoal:30, spawnRate:2.4, ramp:0.025,negRate:0.13, speedStart:1.0, speedEnd:1.65,puChance:0.08, comboCap:7},
    {name:'Savings Bay',       dur:150, moneyGoal:50000, stockGoal:50, spawnRate:2.8, ramp:0.03, negRate:0.17, speedStart:1.05,speedEnd:1.85,puChance:0.06, comboCap:8},
  ];

  // ── Item tables ─────────────────────────────────────────────────
  const POS_ITEMS=[
    {type:'coin', e:'🪙', label:'Coin',   money:1,   pts:10},
    {type:'coin', e:'🪙', label:'Coin',   money:5,   pts:20},
    {type:'coin', e:'🪙', label:'Coin',   money:10,  pts:30},
    {type:'cash', e:'💵', label:'Cash',   money:20,  pts:60},
    {type:'cash', e:'💵', label:'Cash',   money:50,  pts:120},
    {type:'cash', e:'💵', label:'Cash',   money:100, pts:200},
    {type:'stock',e:'📈', label:'Coincept Stock', stock:1, pts:250},
  ];

  // GDD §13 Savings Killers: Late Fee, Impulse Purchase, Broken Piggy Bank, Emergency Expense, Fire Money
  // GDD: Late Fee moves straight+fast; High Interest/Fire Money zigzag; Impulse Purchase slow wobble
  const NEG_ITEMS=[
    {type:'latefee',     e:'🧾', label:'Late Fee',        money:-3,  stamina:-6,  speed:1.3, zigzag:false, effect:'money'},
    {type:'impulse',     e:'🛍️', label:'Impulse Purchase', money:-5,  stamina:0,   speed:0.9, zigzag:true,  amp:0.8, freq:2.2, effect:'money'},
    {type:'brokenpiggy', e:'🐷', label:'Broken Piggy!',   money:0,   stamina:0,   speed:1.0, zigzag:false, effect:'combo'},
    {type:'emergency',   e:'🚨', label:'Emergency!',      money:-2,  stamina:-12, speed:1.1, zigzag:false, effect:'stamina'},
    {type:'firemoney',   e:'🔥', label:'Fire Money',      money:-10, stamina:-14, speed:1.2, zigzag:true,  amp:1.0, freq:4.0, effect:'money'},
  ];

  // Power-ups (GDD v3.0 §11 — all 9 in-run abilities)
  const POWERUPS=[
    {type:'magnet',    e:'🧲', label:'Money Magnet',      dur:5,  color:'#fbbf24'},
    {type:'shield',    e:'🛡️', label:'Insurance Shield',   dur:0,  color:'#60a5fa', hits:2},
    {type:'freeze',    e:'❄️', label:'Time Freeze',        dur:3,  color:'#7dd3fc'},
    {type:'speed',     e:'⚡', label:'Speed Boost',        dur:6,  color:'#a78bfa'},
    {type:'debtburn',  e:'💥', label:'Debt Destroyer',     dur:0,  color:'#fb923c', instant:true},
    {type:'goldpiggy', e:'🐷', label:'Golden Piggy',       dur:8,  color:'#fde68a'},   // GDD: all money 2×
    {type:'coinstorm', e:'🌧️', label:'Coin Storm',         dur:5,  color:'#34d399'},   // GDD: money rains
    {type:'vaultmult', e:'✖️', label:'Vault Multiplier',   dur:5,  color:'#818cf8'},   // GDD: deposits worth 2×
    {type:'supersaver',e:'🦸', label:'Super Saver Mode',   dur:8,  color:'#e879f9'},   // GDD: combo timer pauses
  ];

  const PIG={id:'small',e:'🐷',stamina:100,staminaMax:100};

  // Financial literacy fact gates (GDD §03 learning outcomes + §13 Savings Killers concepts)
  const FACTS=[
    ['🐷','Pay yourself first — save BEFORE you spend.'],
    ['🧾','Late fees drain your savings. Always pay on time!'],
    ['🛍️','Impulse purchases eat your savings. Ask: do I need this NOW?'],
    ['🔥','Fire money burns your savings fast — pause before every purchase.'],
    ['📈','Investing in stocks builds wealth over the long term.'],
    ['🛡️','Insurance protects your savings from unexpected events.'],
    ['🎯','Set a clear savings goal — it keeps you motivated.'],
    ['🚨','Always keep an emergency fund — unexpected costs happen!'],
    ['💰','Small savings compound over time into BIG wealth.'],
  ];

  // ── Init ────────────────────────────────────────────────────────
  window.mcInit=function(){ G=null; };

  function reset(levelIdx){
    const lv=LEVELS[levelIdx||0];
    G={
      phase:'play', level:levelIdx||0, lv,
      money:0, stock:0, score:0,
      moneyGoal:lv.moneyGoal, stockGoal:lv.stockGoal,
      stamina:100, staminaMax:100,
      piggyX:0.5, vx:0,
      combo:0, comboMult:1,
      items:[], parts:[], floats:[],
      time:lv.dur, spawnAcc:0, elapsed:0, last:0,
      // GDD §11 power-up state — all 9 types
      pu:{ magnet:0, shield:0, shieldHits:0, freeze:0, speed:0, goldpiggy:0, coinstorm:0, vaultmult:0, supersaver:0 },
      // GDD §15 end-of-run tracking
      avoided:{ latefee:0, impulse:0 }, comboPeak:0,
      shake:0, flash:{r:0,g:0,b:0,a:0},
      gateEvery:22, gateT:22, gateIdx:0,
      keyL:false, keyR:false,
    };
  }

  // ── Screen ──────────────────────────────────────────────────────
  window.SCREENS.game_moneycatcher=function(){
    if(!G) reset(0);
    setTimeout(mcBoot,30);
    return `
    <div id="mcWrap" style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#0c4a46,#04141f 60%,#02080f);overflow:hidden;font-family:'Inter',sans-serif;color:#fff;user-select:none">
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(180deg,rgba(2,12,18,.9),transparent)">
        <button onclick="mcExit()" style="padding:6px 12px;border:1px solid rgba(20,184,166,.4);border-radius:8px;background:rgba(20,184,166,.1);color:#5eead4;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.16em;color:#2dd4bf;flex:1;text-align:center" id="mcLevelName">MONEY CATCHER</div>
        <div id="mcTime" style="font-family:'Orbitron',sans-serif;font-size:.85rem;color:#fbbf24;min-width:42px;text-align:right">90s</div>
      </div>
      <div style="position:absolute;top:46px;left:0;right:0;z-index:5;padding:0 12px;display:flex;gap:6px">
        <div style="flex:1;background:rgba(0,0,0,.35);border:1px solid rgba(20,184,166,.2);border-radius:10px;padding:5px 8px">
          <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;color:rgba(255,255,255,.45);letter-spacing:.1em;margin-bottom:2px">STAMINA</div>
          <div style="height:8px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden"><div id="mcStamBar" style="height:100%;width:100%;background:linear-gradient(90deg,#34d399,#6ee7b7);border-radius:4px;transition:width .15s"></div></div>
        </div>
        <div style="background:rgba(0,0,0,.35);border:1px solid rgba(251,191,36,.25);border-radius:10px;padding:5px 10px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;color:rgba(255,255,255,.45)">COMBO</div>
          <div id="mcCombo" style="font-family:'Anton',sans-serif;font-size:.95rem;color:#fbbf24;line-height:1">x1</div>
        </div>
        <div style="background:rgba(0,0,0,.35);border:1px solid rgba(52,211,153,.2);border-radius:10px;padding:5px 10px;text-align:center;min-width:68px">
          <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;color:rgba(255,255,255,.45)">SAVED</div>
          <div id="mcMoney" style="font-family:'Anton',sans-serif;font-size:.85rem;color:#34d399;line-height:1">$0</div>
        </div>
        <div style="background:rgba(0,0,0,.35);border:1px solid rgba(99,102,241,.3);border-radius:10px;padding:5px 10px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;color:rgba(255,255,255,.45)">STOCK</div>
          <div id="mcStock" style="font-family:'Anton',sans-serif;font-size:.85rem;color:#818cf8;line-height:1">0</div>
        </div>
      </div>
      <div style="position:absolute;top:96px;left:12px;right:12px;z-index:5">
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.1em;color:rgba(255,255,255,.4);margin-bottom:3px"><span>SAVINGS GOAL</span><span id="mcGoalTxt">$0 / $10K</span></div>
        <div style="height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid rgba(20,184,166,.15)"><div id="mcGoalBar" style="height:100%;width:0%;background:linear-gradient(90deg,#14b8a6,#5eead4);transition:width .25s"></div></div>
      </div>
      <div id="mcPuRow" style="position:absolute;top:112px;left:0;right:0;z-index:5;display:flex;justify-content:center;gap:8px;padding:4px 12px;min-height:22px"></div>
      <canvas id="mcCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:none"></canvas>
      <div id="mcGate" style="position:absolute;inset:0;z-index:9;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(2,10,16,.88);backdrop-filter:blur(6px);padding:24px;gap:18px"></div>
      <div id="mcOver" style="position:absolute;inset:0;z-index:10;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(2,10,16,.85);backdrop-filter:blur(5px);gap:14px;padding:24px"></div>
    </div>`;
  };

  // ── Boot ─────────────────────────────────────────────────────────
  function mcBoot(){
    const cv=document.getElementById('mcCanvas'); if(!cv) return;
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);
    const setX=(cx)=>{ const r=cv.getBoundingClientRect(); G.piggyX=Math.max(0.05,Math.min(0.95,(cx-r.left)/r.width)); };
    const onMM=e=>setX(e.clientX);
    const onTM=e=>{ if(e.touches[0]){setX(e.touches[0].clientX);e.preventDefault();} };
    const onTS=e=>{ if(e.touches[0])setX(e.touches[0].clientX); };
    cv.addEventListener('mousemove',onMM);
    cv.addEventListener('touchmove',onTM,{passive:false});
    cv.addEventListener('touchstart',onTS);
    const kd=e=>{ if(e.key==='ArrowLeft')G.keyL=true; if(e.key==='ArrowRight')G.keyR=true; };
    const ku=e=>{ if(e.key==='ArrowLeft')G.keyL=false; if(e.key==='ArrowRight')G.keyR=false; };
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
    G._cleanup=()=>{
      window.removeEventListener('resize',size);
      window.removeEventListener('keydown',kd);
      window.removeEventListener('keyup',ku);
      cv.removeEventListener('mousemove',onMM);
      cv.removeEventListener('touchmove',onTM);
      cv.removeEventListener('touchstart',onTS);
    };
    const ln=document.getElementById('mcLevelName');
    if(ln) ln.textContent='🐷 '+LEVELS[G.level].name.toUpperCase();
    G.last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  function loop(now){
    const cv=document.getElementById('mcCanvas');
    if(!cv||!G){ if(G&&G._cleanup){G._cleanup();} G=null; cancelAnimationFrame(raf); return; }
    const ctx=cv.getContext('2d'); const W=cv.clientWidth,H=cv.clientHeight;
    const dt=Math.min(40,now-G.last)/1000; G.last=now;
    if(G.phase==='play') update(dt,W,H,now);
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  // ── Update ───────────────────────────────────────────────────────
  function update(dt,W,H,now){
    G.elapsed+=dt;
    G.time-=dt;
    const tEl=document.getElementById('mcTime');
    if(tEl){ tEl.textContent=Math.ceil(Math.max(0,G.time))+'s'; tEl.style.color=G.time<15?'#f87171':'#fbbf24'; }
    if(G.time<=0){ G.time=0; return endGame(true); }
    // gate
    G.gateT-=dt;
    if(G.gateT<=0){ return openGate(); }
    // piggy move
    const spd=G.pu.speed>0?1.7:1.2;
    if(G.keyL) G.piggyX-=dt*spd; if(G.keyR) G.piggyX+=dt*spd;
    G.piggyX=Math.max(0.05,Math.min(0.95,G.piggyX));
    // power-up timers (all timed power-ups)
    ['magnet','freeze','speed','goldpiggy','coinstorm','vaultmult','supersaver'].forEach(k=>{ if(G.pu[k]>0) G.pu[k]-=dt; });
    // Coin Storm: periodically spawn extra positive items while active
    if(G.pu.coinstorm>0){ G._stormAcc=(G._stormAcc||0)+dt; if(G._stormAcc>=0.3){ G._stormAcc=0; spawnStormCoin(); } }
    // spawn
    const prog=Math.min(1,G.elapsed/G.lv.dur);
    const spawnRate=G.lv.spawnRate+G.lv.ramp*G.elapsed;
    G.spawnAcc+=dt*spawnRate;
    while(G.spawnAcc>=1){ G.spawnAcc-=1; spawnItem(prog); }
    // move items
    const frozen=G.pu.freeze>0;
    const baseSpd=lerp(G.lv.speedStart,G.lv.speedEnd,prog)*H*0.22;
    for(let i=G.items.length-1;i>=0;i--){
      const it=G.items[i];
      if(!frozen||it.neg){
        it.y+=dt*(baseSpd*(it.neg?it.negDef.speed:1));
        if(it.neg&&it.negDef.zigzag){
          it.zigT=(it.zigT||0)+dt*it.negDef.freq;
          it.xPx=(it.xPx||it.x*W)+Math.sin(it.zigT)*it.negDef.amp*W*0.018;
          it.xPx=Math.max(W*0.05,Math.min(W*0.95,it.xPx));
          it.x=it.xPx/W;
        }
      }
      if(!it.neg&&G.pu.magnet>0){
        const dx=G.piggyX-it.x; const dy=0.85-it.y/H;
        if(Math.abs(dx)<0.3){ it.x+=dx*dt*5; it.y+=dy*H*dt*3; }
      }
      // catch detection
      if(Math.abs(it.x-G.piggyX)<0.07&&Math.abs(it.y/H-0.85)<0.07){
        catchItem(it); G.items.splice(i,1); continue;
      }
      if(it.y>H*1.05){
        if(it.neg){
          // GDD §15: track avoided Savings Killers for end-of-run screen
          if(it.negDef.type==='latefee') G.avoided.latefee++;
          if(it.negDef.type==='impulse') G.avoided.impulse++;
        } else if(!it.isPu){
          // GDD §11: Super Saver Mode pauses combo break on miss
          if(G.pu.supersaver<=0){ G.combo=0; G.comboMult=1; }
          spawnFloat('MISS','rgba(255,255,255,.3)',it.x,0.96);
        }
        G.items.splice(i,1);
      }
    }
    // particles & floats
    for(let i=G.parts.length-1;i>=0;i--){ const p=G.parts[i]; p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=dt*0.5; if(p.life<=0)G.parts.splice(i,1); }
    for(let i=G.floats.length-1;i>=0;i--){ const f=G.floats[i]; f.life-=dt; f.y-=dt*0.035; if(f.life<=0)G.floats.splice(i,1); }
    if(G.flash.a>0) G.flash.a=Math.max(0,G.flash.a-dt*3);
    if(G.shake>0)   G.shake=Math.max(0,G.shake-dt*8);
    updateHUD();
  }

  function G_H(){ const cv=document.getElementById('mcCanvas'); return cv?cv.clientHeight:600; }

  function spawnItem(prog){
    const r=Math.random();
    const x=0.06+Math.random()*0.88;
    const H=G_H();
    if(r<G.lv.negRate){
      const neg=NEG_ITEMS[Math.floor(Math.random()*NEG_ITEMS.length)];
      G.items.push({x,y:-H*0.05,neg:true,negDef:neg,e:neg.e,label:neg.label,xPx:x*(document.getElementById('mcCanvas')||{clientWidth:400}).clientWidth,zigT:0});
    } else if(r<G.lv.negRate+G.lv.puChance){
      const pu=POWERUPS[Math.floor(Math.random()*POWERUPS.length)];
      G.items.push({x,y:-H*0.05,isPu:true,puDef:pu,e:pu.e,label:pu.label});
    } else {
      const pos=POS_ITEMS[Math.floor(Math.random()*POS_ITEMS.length)];
      G.items.push({x,y:-H*0.05,posDef:pos,e:pos.e,label:pos.label});
    }
  }

  function catchItem(it){
    if(it.neg){
      if(G.pu.shield>0&&G.pu.shieldHits>0){
        G.pu.shieldHits--; if(G.pu.shieldHits<=0)G.pu.shield=0;
        spawnFloat('🛡️ BLOCKED!','#60a5fa',it.x,it.y/G_H()); return;
      }
      const def=it.negDef;
      // GDD §13: different Savings Killer effects
      if(def.effect==='combo'){
        // Broken Piggy Bank — Lose Combo only
        G.combo=0; G.comboMult=1;
        G.flash={r:220,g:160,b:40,a:0.3}; G.shake=0.01;
        spawnFloat(`${def.e} COMBO BROKEN!`,'#fbbf24',it.x,it.y/G_H());
      } else if(def.effect==='stamina'){
        // Emergency Expense — Lose Stamina (and small money)
        G.money=Math.max(0,G.money+(def.money||0));
        G.stamina=Math.max(0,G.stamina+def.stamina);
        G.combo=0; G.comboMult=1;
        G.flash={r:220,g:40,b:40,a:0.45}; G.shake=0.018;
        spawnFloat(`${def.e} ${def.label}!`,'#ef4444',it.x,it.y/G_H());
        if(G.stamina<=0){ G.stamina=0; endGame(false); }
      } else {
        // money-based killers: Late Fee, Impulse Purchase, Fire Money
        G.money=Math.max(0,G.money+def.money);
        G.stamina=Math.max(0,G.stamina+(def.stamina||0));
        G.combo=0; G.comboMult=1;
        G.flash={r:220,g:40,b:40,a:0.4}; G.shake=0.016;
        spawnFloat(`${def.e} ${def.label}!`,def.stamina<-10?'#ef4444':'#f97316',it.x,it.y/G_H());
        if(G.stamina<=0){ G.stamina=0; endGame(false); }
      }
    } else if(it.isPu){
      activatePU(it.puDef,it.x,it.y/G_H());
    } else {
      const pos=it.posDef;
      G.combo++;
      // GDD §05: per-district combo cap
      const cap=G.lv.comboCap||5;
      G.comboMult=Math.min(cap, G.combo>=15?cap:G.combo>=10?Math.min(cap,4):G.combo>=5?Math.min(cap,2):1);
      if(G.comboMult>G.comboPeak) G.comboPeak=G.comboMult;
      // GDD §11: Golden Piggy doubles money value
      const goldBonus=G.pu.goldpiggy>0?2:1;
      // GDD §11: Vault Multiplier doubles deposits
      const vaultBonus=G.pu.vaultmult>0?2:1;
      const earned=pos.money?(pos.money*G.comboMult*goldBonus*vaultBonus):0;
      G.money+=earned; G.stock+=(pos.stock||0); G.score+=(pos.pts||0)*G.comboMult;
      G.flash={r:52,g:211,b:153,a:0.12};
      spawnFloat(pos.stock?'📈 +1 STOCK!':'+$'+earned,pos.stock?'#818cf8':'#34d399',it.x,it.y/G_H());
      burst(it.x,it.y/G_H(),pos.stock?'#818cf8':'#fbbf24',5);
    }
  }

  function activatePU(def,x,y){
    spawnFloat(`${def.e} ${def.label}!`,def.color,x,y); burst(x,y,def.color,8);
    if(def.type==='magnet')    G.pu.magnet=def.dur;
    if(def.type==='shield')    { G.pu.shield=1; G.pu.shieldHits=def.hits||2; }
    if(def.type==='freeze')    G.pu.freeze=def.dur;
    if(def.type==='speed')     G.pu.speed=def.dur;
    if(def.type==='debtburn')  { G.items=G.items.filter(i=>!i.neg); spawnFloat('💥 ALL DEBT DESTROYED!','#fb923c',0.5,0.5); }
    // GDD §11 new power-ups
    if(def.type==='goldpiggy') G.pu.goldpiggy=def.dur; // all money 2×
    if(def.type==='coinstorm') { G.pu.coinstorm=def.dur; G._stormAcc=0; } // money rains
    if(def.type==='vaultmult') G.pu.vaultmult=def.dur;  // savings deposited 2×
    if(def.type==='supersaver'){ G.pu.supersaver=def.dur; } // combo timer pauses (no-drop miss won't break combo)
  }

  function spawnStormCoin(){
    // GDD §11 Coin Storm: spawns coins from the top
    const pos=POS_ITEMS[Math.floor(Math.random()*4)]; // coins only
    const x=0.06+Math.random()*0.88;
    const H=G_H();
    G.items.push({x,y:-H*0.05,posDef:pos,e:pos.e,label:pos.label,storm:true});
  }

  function updateHUD(){
    const pct=G.stamina/G.staminaMax*100;
    const sb=document.getElementById('mcStamBar');
    if(sb){ sb.style.width=pct+'%'; sb.style.background=pct>50?'linear-gradient(90deg,#34d399,#6ee7b7)':pct>25?'linear-gradient(90deg,#fbbf24,#fde68a)':'linear-gradient(90deg,#ef4444,#f87171)'; }
    const mc=document.getElementById('mcCombo');
    if(mc){ mc.textContent='x'+G.comboMult; mc.style.color=G.comboMult>=5?'#f87171':G.comboMult>=3?'#a78bfa':G.comboMult>=2?'#34d399':'#fbbf24'; }
    const mm=document.getElementById('mcMoney'); if(mm) mm.textContent='$'+fmt(G.money);
    const ms=document.getElementById('mcStock'); if(ms) ms.textContent=G.stock;
    const gb=document.getElementById('mcGoalBar'); if(gb) gb.style.width=Math.min(100,G.money/G.moneyGoal*100)+'%';
    const gt=document.getElementById('mcGoalTxt'); if(gt) gt.textContent='$'+fmt(G.money)+' / $'+fmt(G.moneyGoal);
    const row=document.getElementById('mcPuRow'); if(!row) return;
    const active=[];
    if(G.pu.magnet>0)    active.push(`🧲 ${G.pu.magnet.toFixed(1)}s`);
    if(G.pu.shield>0)    active.push(`🛡️ ×${G.pu.shieldHits}`);
    if(G.pu.freeze>0)    active.push(`❄️ ${G.pu.freeze.toFixed(1)}s`);
    if(G.pu.speed>0)     active.push(`⚡ ${G.pu.speed.toFixed(1)}s`);
    if(G.pu.goldpiggy>0) active.push(`🐷 ${G.pu.goldpiggy.toFixed(1)}s`);
    if(G.pu.coinstorm>0) active.push(`🌧️ ${G.pu.coinstorm.toFixed(1)}s`);
    if(G.pu.vaultmult>0) active.push(`✖️ ${G.pu.vaultmult.toFixed(1)}s`);
    if(G.pu.supersaver>0)active.push(`🦸 ${G.pu.supersaver.toFixed(1)}s`);
    row.innerHTML=active.map(s=>`<span style="font-size:.62rem;background:rgba(255,255,255,.1);border-radius:6px;padding:2px 8px">${s}</span>`).join('');
  }

  function fmt(n){ return n>=1000?(n/1000).toFixed(n%1000===0?0:1)+'K':Math.round(n)+''; }
  function lerp(a,b,t){ return a+(b-a)*Math.min(1,Math.max(0,t)); }
  function spawnFloat(label,color,x,y){ G.floats.push({label,color,x,y:y||0.8,life:1.2}); }
  function burst(x,y,color,n){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2; G.parts.push({x,y,vx:Math.cos(a)*0.12*Math.random(),vy:(Math.sin(a)*0.12-0.08)*Math.random(),life:0.5+Math.random()*0.4,color}); } }

  // ── Render ───────────────────────────────────────────────────────
  const _mcStars=Array.from({length:55},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.2+0.3,s:Math.random()*0.4+0.3}));
  function _drawBg(ctx,W,H,now){
    // deep gradient sky
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#030c14'); bg.addColorStop(0.5,'#041520'); bg.addColorStop(1,'#061a10');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    // subtle grid perspective
    ctx.strokeStyle='rgba(20,184,166,.07)'; ctx.lineWidth=1;
    const vp=H*1.4; // vanishing point Y
    for(let i=0;i<=12;i++){
      const t=i/12; const bx=t*W;
      ctx.beginPath(); ctx.moveTo(bx,0); ctx.lineTo(W/2+(bx-W/2)*2,vp); ctx.stroke();
    }
    for(let j=1;j<=5;j++){
      const fy=H*0.25*j;
      const scale=1-fy/vp;
      const lx=W/2-W*scale; const rx=W/2+W*scale;
      ctx.beginPath(); ctx.moveTo(lx,fy); ctx.lineTo(rx,fy); ctx.stroke();
    }
    // twinkling stars
    const t=now/1000;
    for(const st of _mcStars){
      const tw=0.4+0.4*Math.sin(t*st.s+st.x*6.28);
      ctx.globalAlpha=tw*0.7; ctx.fillStyle='#5eead4';
      ctx.beginPath(); ctx.arc(st.x*W,st.y*H*0.5,st.r,0,6.28); ctx.fill();
    }
    ctx.globalAlpha=1;
    // floor glow strip
    const fg=ctx.createLinearGradient(0,H*0.88,0,H);
    fg.addColorStop(0,'rgba(20,184,166,.12)'); fg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fg; ctx.fillRect(0,H*0.88,W,H*0.12);
  }
  function _drawPiggy(ctx,px,py,ps,now,pus){
    const bob=Math.sin(now/600)*ps*0.04;
    const goldpiggy=pus&&pus.goldpiggy>0;
    const bodyR=ps*0.9;
    // body gradient (3D sphere illusion)
    const bodyGrad=ctx.createRadialGradient(px-bodyR*0.25,py-bodyR*0.3+bob,bodyR*0.1,px,py+bob,bodyR);
    if(goldpiggy){
      bodyGrad.addColorStop(0,'#fef3c7'); bodyGrad.addColorStop(0.5,'#fbbf24'); bodyGrad.addColorStop(1,'#92400e');
    } else {
      bodyGrad.addColorStop(0,'#fda4af'); bodyGrad.addColorStop(0.5,'#f9a8d4'); bodyGrad.addColorStop(1,'#9f1239');
    }
    ctx.shadowColor=goldpiggy?'#fbbf24':'#f472b6'; ctx.shadowBlur=ps*0.6;
    ctx.fillStyle=bodyGrad; ctx.beginPath(); ctx.arc(px,py+bob,bodyR,0,6.28); ctx.fill();
    ctx.shadowBlur=0;
    // ears
    const ec=goldpiggy?'#fbbf24':'#fb7185';
    [[px-bodyR*0.6,py-bodyR*0.75+bob,ps*0.28],[px+bodyR*0.6,py-bodyR*0.75+bob,ps*0.28]].forEach(([ex,ey,er])=>{
      ctx.fillStyle=ec; ctx.beginPath(); ctx.arc(ex,ey,er,0,6.28); ctx.fill();
      ctx.fillStyle=goldpiggy?'#fef3c7':'#ffe4e6'; ctx.beginPath(); ctx.arc(ex,ey,er*0.55,0,6.28); ctx.fill();
    });
    // snout
    const snoutGrad=ctx.createRadialGradient(px,py+bodyR*0.3+bob,1,px,py+bodyR*0.3+bob,ps*0.35);
    snoutGrad.addColorStop(0,goldpiggy?'#fef3c7':'#ffe4e6'); snoutGrad.addColorStop(1,goldpiggy?'#fbbf24':'#fda4af');
    ctx.fillStyle=snoutGrad; ctx.beginPath(); ctx.ellipse(px,py+bodyR*0.3+bob,ps*0.35,ps*0.25,0,0,6.28); ctx.fill();
    // nostrils
    ctx.fillStyle='rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.arc(px-ps*0.12,py+bodyR*0.28+bob,ps*0.06,0,6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(px+ps*0.12,py+bodyR*0.28+bob,ps*0.06,0,6.28); ctx.fill();
    // eyes
    ctx.fillStyle='#fff';
    [[px-bodyR*0.32,py-bodyR*0.1+bob],[px+bodyR*0.32,py-bodyR*0.1+bob]].forEach(([ex,ey])=>{
      ctx.beginPath(); ctx.arc(ex,ey,ps*0.14,0,6.28); ctx.fill();
      ctx.fillStyle='#1a1a2e'; ctx.beginPath(); ctx.arc(ex+ps*0.02,ey+ps*0.02,ps*0.08,0,6.28); ctx.fill();
      ctx.fillStyle='#fff';
    });
    // coin slot on top
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.beginPath();
    ctx.ellipse(px,py-bodyR*0.82+bob,ps*0.22,ps*0.07,0,0,6.28); ctx.fill();
  }

  function render(ctx,W,H,now){
    _drawBg(ctx,W,H,now);
    let sx=0,sy=0;
    if(G.shake>0){ sx=(Math.random()-.5)*G.shake*W*0.6; sy=(Math.random()-.5)*G.shake*H*0.3; }
    ctx.save(); ctx.translate(sx,sy);
    const frozen=G.pu.freeze>0;
    // items — enhanced with glow halos
    for(const it of G.items){
      const ix=it.x*W, iy=it.y;
      const glowC=it.neg?'#ef4444':it.isPu?it.puDef.color:'#fbbf24';
      ctx.globalAlpha=frozen&&!it.neg?0.55:1;
      const fs=Math.round(W*0.052);
      // glow halo
      const halo=ctx.createRadialGradient(ix,iy,1,ix,iy,fs*0.9);
      halo.addColorStop(0,glowC+'55'); halo.addColorStop(1,'transparent');
      ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(ix,iy,fs*0.9,0,6.28); ctx.fill();
      // emoji
      ctx.font=`${fs}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowColor=glowC; ctx.shadowBlur=it.neg?18:12;
      ctx.fillText(it.e,ix,iy);
      ctx.shadowBlur=0; ctx.globalAlpha=1;
    }
    // particles — sized up, more vibrant
    for(const p of G.parts){
      ctx.globalAlpha=Math.min(p.life,0.9);
      ctx.fillStyle=p.color;
      ctx.shadowColor=p.color; ctx.shadowBlur=6;
      ctx.beginPath(); ctx.arc(p.x*W,p.y*H,W*0.009,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
    }
    ctx.globalAlpha=1;
    // floats
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const f of G.floats){
      ctx.globalAlpha=Math.min(1,f.life*1.4);
      ctx.font=`bold ${Math.round(W*0.034)}px 'Orbitron',sans-serif`;
      ctx.fillStyle=f.color; ctx.shadowColor=f.color; ctx.shadowBlur=12;
      ctx.fillText(f.label,f.x*W,f.y*H);
    }
    ctx.shadowBlur=0; ctx.globalAlpha=1;
    // piggy — 3D drawn
    const ppx=G.piggyX*W, ppy=H*0.84, pps=W*0.072;
    if(G.pu.shield>0&&G.pu.shieldHits>0){
      for(let r=0;r<3;r++){
        ctx.beginPath(); ctx.arc(ppx,ppy,pps*(1.5+r*0.2)+Math.sin(now/400+r)*pps*0.08,0,6.28);
        ctx.strokeStyle=`rgba(96,165,250,${0.4-r*0.12})`; ctx.lineWidth=2-r*0.4;
        ctx.shadowColor='#60a5fa'; ctx.shadowBlur=14; ctx.stroke(); ctx.shadowBlur=0;
      }
    }
    if(G.pu.speed>0){
      ctx.globalAlpha=0.22;
      _drawPiggy(ctx,ppx-pps*1.2,ppy+pps*0.1,pps*0.85,now,G.pu);
      ctx.globalAlpha=1;
    }
    _drawPiggy(ctx,ppx,ppy,pps,now,G.pu);
    if(G.pu.magnet>0){
      const mr=now/1000; const mr2=W*0.26;
      ctx.beginPath(); ctx.arc(ppx,ppy,mr2+Math.sin(mr)*mr2*0.05,0,6.28);
      ctx.strokeStyle='rgba(251,191,36,.2)'; ctx.lineWidth=1.5; ctx.setLineDash([6,5]); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
    // screen flash
    if(G.flash.a>0){ ctx.fillStyle=`rgba(${G.flash.r},${G.flash.g},${G.flash.b},${G.flash.a*0.7})`; ctx.fillRect(0,0,W,H); }
    // low stamina vignette
    if(G.stamina<G.staminaMax*0.3){
      const pulse=0.22+0.14*Math.sin(now/1000*4);
      const grd=ctx.createRadialGradient(W/2,H/2,H*0.18,W/2,H/2,H*0.72);
      grd.addColorStop(0,'transparent'); grd.addColorStop(1,`rgba(220,30,30,${pulse})`);
      ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);
    }
  }

  // ── Knowledge Gate ───────────────────────────────────────────────
  function openGate(){
    const gate=document.getElementById('mcGate');
    if(!gate){ G.gateT=G.gateEvery; return; }        // missing overlay → skip gate, don't soft-lock
    G.phase='gate';
    const [icon,text]=FACTS[G.gateIdx%FACTS.length]; G.gateIdx++;
    gate.style.display='flex';
    gate.innerHTML=`
      <div style="font-size:2.6rem">${icon}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.18em;color:#5eead4">MONEY LESSON</div>
      <div style="font-size:.9rem;line-height:1.65;text-align:center;max-width:280px;color:#e2e8f0">${text}</div>
      <button onclick="mcCloseGate()" style="padding:12px 30px;background:linear-gradient(135deg,#0d9488,#14b8a6);border:none;border-radius:10px;color:#fff;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.14em;cursor:pointer;margin-top:6px">GOT IT →</button>`;
  }
  window.mcCloseGate=function(){
    const gate=document.getElementById('mcGate'); if(gate) gate.style.display='none';
    G.phase='play'; G.gateT=G.gateEvery;
  };

  // ── End Game (GDD §15 End-of-Run Screen) ─────────────────────────
  function endGame(timeUp){
    if(G.phase==='over') return;                     // guard vs double fire in one frame
    G.phase='over'; cancelAnimationFrame(raf);
    const lv=LEVELS[G.level];
    const won=timeUp&&G.money>=lv.moneyGoal&&G.stock>=lv.stockGoal&&G.stamina>0;
    const _li=G.level||0; const _isPerfect=won&&G.stamina>60;
    // Route through cvAwardGame (same 400/600/900+perfect table, replay-safe, records stars/badges)
    if(won && window.cvAwardGame){
      const stars=_isPerfect?3:(G.stamina>30?2:1);
      cvAwardGame('game_moneycatcher',{level:_li+1,stars,badge:'Savings Guardian',is3star:stars===3,isPerfect:_isPerfect,isFlagship:true});
    } else if(window.state){
      state.coins=(state.coins||0)+50;               // small consolation on a loss
      if(window.cvAddXP) cvAddXP(10,0);
      if(window.cvSave) cvSave();
    }
    const overEl=document.getElementById('mcOver'); if(!overEl) return;
    overEl.style.display='flex';
    // GDD §15: vault growth % (approximation vs goal)
    const vaultGrowthPct=Math.min(100,Math.round(G.money/lv.moneyGoal*100));
    // GDD §15: financial literacy tips — context-aware
    let tip;
    if(won){
      tip='Your Savings Empire just grew! Small, consistent savings compound into real wealth over time.';
    } else if(G.stamina<=0){
      tip='Emergency expenses and late fees drain savings fast — always keep a buffer and pay on time!';
    } else {
      tip='Avoid Impulse Purchases and Late Fees to protect your savings vault next time.';
    }
    // GDD §15: headline is "Your Savings Empire Just Grew!" for wins
    const headline=won?'Your Savings Empire Just Grew!':'Game Over';
    overEl.innerHTML=`
      <div style="font-size:2.2rem">${won?'🏆':'💔'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:${won?.65:.75}rem;letter-spacing:.14em;color:${won?'#34d399':'#f87171'};text-align:center;max-width:280px">${headline}</div>
      <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 18px;width:100%;max-width:300px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:center">
          ${stat('💰 SAVINGS DEPOSITED','$'+fmt(G.money),G.money>=lv.moneyGoal?'#34d399':'#f87171')}
          ${stat('📈 VAULT GROWTH','+'+vaultGrowthPct+'%',vaultGrowthPct>=100?'#34d399':'#fbbf24')}
          ${stat('🛍️ IMPULSE AVOIDED',G.avoided.impulse,'#a78bfa')}
          ${stat('🧾 LATE FEES AVOIDED',G.avoided.latefee,'#60a5fa')}
          ${stat('🔥 PEAK COMBO','×'+G.comboPeak,'#fbbf24')}
          ${stat('❤️ STAMINA',Math.round(G.stamina)+'%','#e2e8f0')}
        </div>
      </div>
      <div style="font-size:.78rem;color:#94a3b8;text-align:center;max-width:280px;line-height:1.5;padding:10px 14px;background:rgba(255,255,255,.04);border-radius:10px;border-left:3px solid #14b8a6">💡 ${tip}</div>
      <div style="display:flex;gap:12px">
        ${won&&G.level<LEVELS.length-1?`<button onclick="mcNextDistrict()" style="padding:11px 22px;background:linear-gradient(135deg,#f59e0b,#fbbf24);border:none;border-radius:10px;color:#1a0a00;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;font-weight:900;cursor:pointer">NEXT DISTRICT → ${LEVELS[G.level+1].name.toUpperCase()}</button>`:''}
        <button onclick="mcReplay()" style="padding:11px 22px;background:linear-gradient(135deg,#0d9488,#14b8a6);border:none;border-radius:10px;color:#fff;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer">REPLAY</button>
        <button onclick="mcExit()" style="padding:11px 22px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:10px;color:#e2e8f0;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer">← HUB</button>
      </div>`;
  }
  function stat(label,val,color){ return `<div><div style="font-family:'Orbitron',sans-serif;font-size:.36rem;color:rgba(255,255,255,.4);letter-spacing:.08em;margin-bottom:4px">${label}</div><div style="font-family:'Anton',sans-serif;font-size:.95rem;color:${color}">${val}</div></div>`; }

  window.mcReplay=function(){
    if(G&&G._cleanup)G._cleanup(); reset(G?G.level:0);
    const o=document.getElementById('mcOver'); if(o)o.style.display='none';
    setTimeout(mcBoot,30);
  };
  window.mcNextDistrict=function(){
    const next=Math.min(G?G.level+1:0,LEVELS.length-1);
    if(G&&G._cleanup)G._cleanup(); reset(next);
    const o=document.getElementById('mcOver'); if(o)o.style.display='none';
    setTimeout(mcBoot,30);
  };
  window.mcExit=function(){
    cancelAnimationFrame(raf); if(G&&G._cleanup)G._cleanup(); G=null;
    if(window.state) state.viewingWorld=state._returnHub||TOKEN; goTo('hub');
  };
})();
