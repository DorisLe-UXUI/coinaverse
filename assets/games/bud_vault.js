/* ════════════════════════════════════════════════════════════════
   EMERGENCY FUND VAULT — GDD v1
   Strategist Hub · BudgetTron Base · accent #1a2a4a
   Catch falling savings tokens to build your emergency fund.
   Shield strength = fund % of goal. Emergencies strike randomly;
   tap Pay Now or Defer. Savings = zero → instant loss.
   ════════════════════════════════════════════════════════════════ */
(function(){

  /* ─── CONSTANTS ─────────────────────────────────────────────── */
  const ACCENT='#1a2a4a', GOLD='#f59e0b', SHIELD='#38bdf8', RED='#ef4444', GREEN='#22c55e';
  const LEVELS=[
    { label:'LEVEL 1 — STARTER',  goal:500,  duration:90,  tokenRate:1.8, emergencyRate:18, maxActive:1 },
    { label:'LEVEL 2 — MASTERY',  goal:3000, duration:120, tokenRate:1.4, emergencyRate:12, maxActive:3 }
  ];
  const TOKENS=[
    { kind:'coin',  emoji:'🪙', value:15,   color:'#f59e0b', prob:0.42 },
    { kind:'bill',  emoji:'💵', value:50,   color:'#22c55e', prob:0.30 },
    { kind:'bonus', emoji:'⭐', value:120,  color:'#a78bfa', prob:0.16 },
    { kind:'x2',    emoji:'✨', value:0,    color:'#38bdf8', prob:0.12 }  // multiplier
  ];
  const EMERGENCIES=[
    { id:'car',    icon:'🚗', name:'Car Repair',    baseCost:380, desc:'Radiator blew — needs immediate fix.' },
    { id:'job',    icon:'💼', name:'Job Loss',       baseCost:600, desc:'Unexpected layoff. Bills still due.' },
    { id:'hospital',icon:'🏥',name:'Hospital Visit', baseCost:450, desc:'ER visit — insurance didn\'t cover it.' },
    { id:'home',   icon:'🏠', name:'Home Repair',   baseCost:320, desc:'Roof leak during the storm last night.' }
  ];
  const FACTS=[
    {icon:'🛟','text':'Even $500 in savings prevents most people from falling into debt during emergencies.'},
    {icon:'📅','text':'3–6 months of expenses saved = financial security against most life disruptions.'},
    {icon:'⚡','text':'Without an emergency fund, unexpected costs become credit card debt at 20%+ APR.'},
    {icon:'🧠','text':'Pay yourself first: auto-transfer to savings before spending anything else.'},
    {icon:'🏦','text':'A high-yield savings account earns 4–5x more than a standard bank account.'}
  ];

  /* ─── STATE ─────────────────────────────────────────────────── */
  let G=null, raf=null, canvas=null, ctx=null;
  let _onMouseDown=null, _onTouchStart=null, _onResize=null;

  /* ─── SCREEN REGISTRATION ───────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_bud_vault = function(){
    G=null;
    if(raf){ cancelAnimationFrame(raf); raf=null; }
    setTimeout(initGame,40);
    return `<div id="bvRoot" style="position:absolute;inset:0;background:#03040c;overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <!-- TOP BAR -->
      <div id="bvBar" style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;gap:10px;padding:10px 16px;background:linear-gradient(180deg,rgba(3,4,12,.95),transparent)">
        <button id="bvBack" style="padding:7px 13px;border:1px solid rgba(56,189,248,.35);border-radius:9px;background:rgba(26,42,74,.6);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.1em;cursor:pointer;white-space:nowrap">← VAULT</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.18em;color:#38bdf8;flex:1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">EMERGENCY FUND VAULT</div>
        <div id="bvTimer" style="font-family:'Orbitron',sans-serif;font-size:.85rem;color:#f59e0b;min-width:44px;text-align:right">90s</div>
      </div>
      <!-- HUD ROW -->
      <div id="bvHud" style="position:absolute;top:50px;left:0;right:0;z-index:20;display:flex;gap:8px;padding:0 14px;justify-content:center">
        <div class="bvStat" style="background:rgba(26,42,74,.7);border:1px solid rgba(56,189,248,.25);border-radius:10px;padding:5px 12px;text-align:center;min-width:80px">
          <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.12em;color:#7dd3fc;margin-bottom:2px">SAVED</div>
          <div id="bvSaved" style="font-family:'Orbitron',sans-serif;font-size:.82rem;color:#22c55e;font-variant-numeric:tabular-nums">$0</div>
        </div>
        <div class="bvStat" style="background:rgba(26,42,74,.7);border:1px solid rgba(56,189,248,.25);border-radius:10px;padding:5px 12px;text-align:center;min-width:80px">
          <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.12em;color:#7dd3fc;margin-bottom:2px">GOAL</div>
          <div id="bvGoal" style="font-family:'Orbitron',sans-serif;font-size:.82rem;color:#f59e0b;font-variant-numeric:tabular-nums">$500</div>
        </div>
        <div class="bvStat" style="background:rgba(26,42,74,.7);border:1px solid rgba(56,189,248,.25);border-radius:10px;padding:5px 12px;text-align:center;min-width:80px">
          <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.12em;color:#7dd3fc;margin-bottom:2px">SHIELD</div>
          <div id="bvShield" style="font-family:'Orbitron',sans-serif;font-size:.82rem;color:#38bdf8;font-variant-numeric:tabular-nums">0%</div>
        </div>
        <div class="bvStat" style="background:rgba(26,42,74,.7);border:1px solid rgba(56,189,248,.25);border-radius:10px;padding:5px 12px;text-align:center;min-width:70px">
          <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.12em;color:#7dd3fc;margin-bottom:2px">SCORE</div>
          <div id="bvScore" style="font-family:'Orbitron',sans-serif;font-size:.82rem;color:#a78bfa;font-variant-numeric:tabular-nums">0</div>
        </div>
      </div>
      <!-- SHIELD BAR -->
      <div style="position:absolute;top:108px;left:14px;right:14px;z-index:20">
        <div style="height:8px;background:rgba(56,189,248,.12);border-radius:4px;overflow:hidden;border:1px solid rgba(56,189,248,.2)">
          <div id="bvShieldBar" style="height:100%;width:0%;background:linear-gradient(90deg,#1d4ed8,#38bdf8);border-radius:4px;transition:width .3s ease"></div>
        </div>
      </div>
      <!-- CANVAS -->
      <canvas id="bvCanvas" style="position:absolute;top:122px;left:0;right:0;bottom:0;width:100%;touch-action:none"></canvas>
      <!-- FACT TICKER -->
      <div id="bvFact" style="display:none;position:absolute;bottom:12px;left:14px;right:14px;z-index:20;background:rgba(26,42,74,.9);border:1px solid rgba(56,189,248,.3);border-radius:12px;padding:10px 14px;font-size:.72rem;color:#bae6fd;line-height:1.5;text-align:center"></div>
      <!-- EMERGENCY CARDS LAYER -->
      <div id="bvEmgLayer" style="position:absolute;top:130px;left:0;right:0;bottom:60px;z-index:25;pointer-events:none"></div>
      <!-- END OVERLAY -->
      <div id="bvEnd" style="display:none;position:absolute;inset:0;z-index:50;background:rgba(3,4,12,.92);display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center"></div>
    </div>`;
  };

  /* ─── EXIT ──────────────────────────────────────────────────── */
  window.bud_vaultExit = function(){
    if(raf){ cancelAnimationFrame(raf); raf=null; }
    // clear fact ticker timeout before nulling G
    if(G && G._factTO){ clearTimeout(G._factTO); }
    G=null;
    // remove resize listener
    if(_onResize){ window.removeEventListener('resize',_onResize); _onResize=null; }
    // remove canvas input listeners
    if(canvas){
      if(_onMouseDown){ canvas.removeEventListener('mousedown',_onMouseDown); _onMouseDown=null; }
      if(_onTouchStart){ canvas.removeEventListener('touchstart',_onTouchStart); _onTouchStart=null; }
    }
    if(window.state) state.viewingWorld='strategist';
    goTo('hub');
  };

  /* ─── INIT ──────────────────────────────────────────────────── */
  function initGame(){
    canvas=document.getElementById('bvCanvas');
    if(!canvas){ setTimeout(initGame,30); return; }
    ctx=canvas.getContext('2d');
    sizeCanvas();

    const back=document.getElementById('bvBack');
    if(back) back.onclick=()=>window.bud_vaultExit();

    G={
      phase:'level_select',   // level_select → play → end
      level:0,
      savings:0,
      score:0,
      multiplier:1,
      mulTimer:0,
      time:0,
      zeroBalance:false,      // flag for 3-star check
      tokens:[],
      particles:[],
      floats:[],              // floating text
      emergencies:[],         // active emergency cards
      emgQueue:[],
      emgTimer:0,
      shakeT:0,
      flashT:0,
      flashC:'#fff',
      lastT:null,
      factTimer:0,
      factIdx:0,
      shieldPct:0,
      emgHandled:0,           // emergencies handled with pay (no depletion)
      started:false
    };

    showLevelSelect();
    if(_onResize){ window.removeEventListener('resize',_onResize); }
    _onResize=sizeCanvas;
    window.addEventListener('resize',_onResize);
  }

  function sizeCanvas(){
    if(!canvas) return;
    const root=document.getElementById('bvRoot');
    if(!root) return;
    canvas.width=root.clientWidth;
    canvas.height=root.clientHeight-122;
  }

  /* ─── LEVEL SELECT OVERLAY ──────────────────────────────────── */
  function showLevelSelect(){
    const end=document.getElementById('bvEnd');
    if(!end) return;
    end.style.display='flex';
    end.innerHTML=`
      <div style="font-family:'Orbitron',sans-serif;font-size:1.1rem;letter-spacing:.2em;color:#38bdf8;margin-bottom:6px">🏦 EMERGENCY FUND VAULT</div>
      <div style="color:#94a3b8;font-size:.78rem;margin-bottom:20px;max-width:320px;line-height:1.6">Build your savings shield before emergencies strike. Catch falling tokens — pay emergencies wisely.</div>
      <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:320px">
        ${LEVELS.map((lv,i)=>`
          <button onclick="bvStartLevel(${i})" style="padding:16px 20px;border:1px solid rgba(56,189,248,.4);border-radius:14px;background:rgba(26,42,74,.7);color:#e2e8f0;font-family:'Inter',sans-serif;font-size:.82rem;cursor:pointer;text-align:left;display:flex;align-items:center;gap:14px;transition:background .2s">
            <div style="font-family:'Orbitron',sans-serif;font-size:1.4rem">${i===0?'🎓':'🏆'}</div>
            <div>
              <div style="font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.15em;color:#38bdf8;margin-bottom:3px">${lv.label}</div>
              <div style="color:#94a3b8;font-size:.72rem">Goal: <span style="color:#22c55e;font-weight:700">$${lv.goal.toLocaleString()}</span> · ${lv.duration}s · ${i===0?'One emergency at a time':'Multiple simultaneous emergencies'}</div>
            </div>
          </button>`).join('')}
      </div>`;
  }

  window.bvStartLevel=function(lvIdx){
    const end=document.getElementById('bvEnd');
    if(end) end.style.display='none';

    G.level=lvIdx;
    G.phase='play';
    G.savings=0;
    G.score=0;
    G.multiplier=1;
    G.mulTimer=0;
    G.time=LEVELS[lvIdx].duration;
    G.zeroBalance=false;
    G.tokens=[];
    G.particles=[];
    G.floats=[];
    G.emergencies=[];
    G.emgQueue=[];
    G.emgTimer=LEVELS[lvIdx].emergencyRate*0.5; // first emergency comes early
    G.shakeT=0;
    G.flashT=0;
    G.lastT=null;
    G.factTimer=20;
    G.factIdx=0;
    G.emgHandled=0;
    G.started=true;

    updateHUD();
    updateGoalLabel();
    setupInput();
    if(raf){ cancelAnimationFrame(raf); }
    raf=requestAnimationFrame(loop);
  };

  /* ─── INPUT ─────────────────────────────────────────────────── */
  function setupInput(){
    if(!canvas) return;
    // remove any previously registered listeners to prevent stacking on PLAY AGAIN
    if(_onMouseDown){ canvas.removeEventListener('mousedown',_onMouseDown); _onMouseDown=null; }
    if(_onTouchStart){ canvas.removeEventListener('touchstart',_onTouchStart); _onTouchStart=null; }

    const onDown=e=>{
      if(G.phase!=='play') return;
      const rect=canvas.getBoundingClientRect();
      const pts=e.touches?Array.from(e.touches).map(t=>({x:t.clientX-rect.left,y:t.clientY-rect.top}))
                        :[{x:e.clientX-rect.left,y:e.clientY-rect.top}];
      pts.forEach(pt=>catchToken(pt.x,pt.y));
    };
    _onMouseDown=onDown;
    _onTouchStart=e=>{e.preventDefault();onDown(e);};
    canvas.addEventListener('mousedown',_onMouseDown);
    canvas.addEventListener('touchstart',_onTouchStart,{passive:false});
  }

  function catchToken(sx,sy){
    // check tokens from top of stack (front of visual)
    for(let i=G.tokens.length-1;i>=0;i--){
      const t=G.tokens[i];
      const dx=sx-t.x, dy=sy-t.y;
      if(dx*dx+dy*dy < t.r*t.r*1.4){
        collectToken(t,i);
        return;
      }
    }
  }

  /* ─── GAME LOOP ─────────────────────────────────────────────── */
  function loop(ts){
    if(!G||G.phase!=='play'){ raf=null; return; }
    if(!G.lastT) G.lastT=ts;
    const dt=Math.min((ts-G.lastT)/1000,0.1);
    G.lastT=ts;

    update(dt);
    render();
    raf=requestAnimationFrame(loop);
  }

  /* ─── UPDATE ────────────────────────────────────────────────── */
  function update(dt){
    const lv=LEVELS[G.level];

    // timer
    G.time-=dt;
    if(G.time<=0){ G.time=0; endGame(calcStars()); return; }

    // x2 multiplier timer
    if(G.mulTimer>0){ G.mulTimer-=dt; if(G.mulTimer<=0){ G.multiplier=1; G.mulTimer=0; } }

    // decay fx
    if(G.shakeT>0) G.shakeT=Math.max(0,G.shakeT-dt);
    if(G.flashT>0) G.flashT=Math.max(0,G.flashT-dt);

    // spawn tokens
    G.spawnAccum=(G.spawnAccum||0)+dt;
    if(G.spawnAccum>=lv.tokenRate){
      G.spawnAccum=0;
      spawnToken();
    }

    // move tokens down
    const W=canvas.width, H=canvas.height;
    const speed=H*0.18; // px/s
    G.tokens.forEach(t=>{
      t.y+=speed*dt;
      t.wobble=(t.wobble||0)+dt*2.5;
      t.x+=Math.sin(t.wobble)*0.6;
    });
    // remove tokens that hit the floor
    G.tokens=G.tokens.filter(t=>{
      if(t.y>H-20){
        missedToken(t);
        return false;
      }
      return true;
    });

    // particles
    G.particles=G.particles.filter(p=>{
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; p.vy+=200*dt;
      return p.life>0;
    });

    // floats
    G.floats=G.floats.filter(f=>{ f.y-=55*dt; f.life-=dt; return f.life>0; });

    // emergency timer
    G.emgTimer-=dt;
    if(G.emgTimer<=0){
      G.emgTimer=lv.emergencyRate*(0.85+Math.random()*0.3);
      if(G.emergencies.length<lv.maxActive) triggerEmergency();
    }

    // deferred emergency cost escalation
    G.emergencies.forEach(e=>{
      e.deferTime=(e.deferTime||0)+dt;
      if(e.deferTime>8 && !e.escalated){
        e.escalated=true;
        e.cost=Math.round(e.cost*1.35);
        e.el && updateEmgCard(e);
      }
    });

    // fact ticker
    G.factTimer-=dt;
    if(G.factTimer<=0){
      G.factTimer=22;
      showFact();
    }

    // shield
    const pct=G.savings/lv.goal;
    G.shieldPct=Math.min(1,pct);

    // zero check
    if(G.savings<=0 && G.started){
      G.savings=0;
      G.zeroBalance=true;
      // instant lose only if an emergency is active and unpaid
      if(G.emergencies.some(e=>!e.resolved && e.deferTime>15)){
        endGame(0);
        return;
      }
    }

    updateHUD();
  }

  /* ─── TOKEN SPAWN ───────────────────────────────────────────── */
  function spawnToken(){
    const W=canvas.width;
    const roll=Math.random(), cum=[0];
    TOKENS.forEach(t=>{ cum.push(cum[cum.length-1]+t.prob); });
    let kind=TOKENS[TOKENS.length-1];
    for(let i=0;i<TOKENS.length;i++){ if(roll>=cum[i]&&roll<cum[i+1]){ kind=TOKENS[i]; break; } }
    const r=W*0.052;
    G.tokens.push({
      x:r+Math.random()*(W-r*2), y:-r*1.2,
      r, kind:kind.kind, emoji:kind.emoji, value:kind.value,
      color:kind.color, wobble:Math.random()*Math.PI*2,
      pulse:Math.random()*Math.PI*2
    });
  }

  /* ─── COLLECT / MISS TOKEN ──────────────────────────────────── */
  function collectToken(t,idx){
    G.tokens.splice(idx,1);
    let val=0;
    if(t.kind==='x2'){
      G.multiplier=2; G.mulTimer=8;
      spawnParticles(t.x,t.y,'#38bdf8',12);
      addFloat(t.x,t.y,'×2 MULTIPLIER!','#38bdf8',1.0);
      G.score+=10*G.multiplier;
    } else {
      val=t.value*G.multiplier;
      G.savings+=val;
      G.score+=val;
      spawnParticles(t.x,t.y,t.color,8);
      addFloat(t.x,t.y,`+$${val}`,'#22c55e',0.8);
    }
  }

  function missedToken(t){
    // small penalty: lose a token but no savings deduction
    // just a visual puff
    spawnParticles(t.x,canvas.height-30,'#ef4444',4);
  }

  /* ─── EMERGENCY SYSTEM ──────────────────────────────────────── */
  function triggerEmergency(){
    const lv=LEVELS[G.level];
    // pick a random emergency not already active
    const active=G.emergencies.map(e=>e.id);
    const pool=EMERGENCIES.filter(e=>!active.includes(e.id));
    if(!pool.length) return;
    const def=pool[Math.floor(Math.random()*pool.length)];

    // scale cost slightly with level
    const cost=Math.round(def.baseCost*(G.level===0?0.9:1+(Math.random()*0.3)));

    const emg={
      id:def.id, icon:def.icon, name:def.name, desc:def.desc,
      cost, deferTime:0, escalated:false, resolved:false, el:null
    };

    G.emergencies.push(emg);
    renderEmgCard(emg);
    G.shakeT=0.35;
    G.flashT=0.3; G.flashC='#ef444440';
  }

  function renderEmgCard(emg){
    const layer=document.getElementById('bvEmgLayer');
    if(!layer) return;

    // position: stack cards from left with offset
    const idx=G.emergencies.filter(e=>!e.resolved).indexOf(emg);
    const card=document.createElement('div');
    card.id=`bvEmg_${emg.id}`;
    card.style.cssText=`
      position:absolute;pointer-events:all;
      top:${10+idx*8}px;left:${12+idx*6}px;right:${12+idx*6}px;
      background:rgba(15,10,30,.92);border:1px solid rgba(239,68,68,.5);
      border-radius:16px;padding:14px 16px;
      box-shadow:0 0 24px rgba(239,68,68,.3),inset 0 1px 0 rgba(255,255,255,.05);
      animation:bvEmgIn .3s ease;
    `;

    card.innerHTML=emgCardHTML(emg);
    layer.appendChild(card);
    emg.el=card;

    // pay button
    const payBtn=card.querySelector('[data-pay]');
    const deferBtn=card.querySelector('[data-defer]');
    if(payBtn) payBtn.onclick=()=>payEmergency(emg);
    if(deferBtn) deferBtn.onclick=()=>deferEmergency(emg);
  }

  function emgCardHTML(emg){
    const canAfford=G.savings>=emg.cost;
    return `
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="font-size:1.8rem;line-height:1">${emg.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-family:'Orbitron',sans-serif;font-size:.65rem;letter-spacing:.15em;color:#fca5a5;margin-bottom:2px">${emg.name.toUpperCase()}</div>
          <div style="color:#94a3b8;font-size:.7rem;margin-bottom:8px;line-height:1.4">${emg.desc}${emg.escalated?'<span style="color:#f87171;margin-left:6px">⚠ ESCALATED</span>':''}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div style="font-family:'Orbitron',sans-serif;font-size:.95rem;color:#ef4444;font-variant-numeric:tabular-nums">$${emg.cost.toLocaleString()}</div>
            <div style="display:flex;gap:8px">
              <button data-pay style="padding:7px 14px;border:1px solid ${canAfford?'#22c55e':'#374151'};border-radius:9px;background:${canAfford?'rgba(34,197,94,.2)':'rgba(55,65,81,.3)'};color:${canAfford?'#4ade80':'#6b7280'};font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.08em;cursor:${canAfford?'pointer':'not-allowed'}">PAY NOW</button>
              <button data-defer style="padding:7px 14px;border:1px solid rgba(251,191,36,.3);border-radius:9px;background:rgba(251,191,36,.12);color:#fbbf24;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.08em;cursor:pointer">DEFER −10%</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function updateEmgCard(emg){
    if(!emg.el) return;
    emg.el.innerHTML=emgCardHTML(emg);
    const payBtn=emg.el.querySelector('[data-pay]');
    const deferBtn=emg.el.querySelector('[data-defer]');
    if(payBtn) payBtn.onclick=()=>payEmergency(emg);
    if(deferBtn) deferBtn.onclick=()=>deferEmergency(emg);
  }

  function payEmergency(emg){
    if(emg.resolved) return;
    if(G.savings<emg.cost){
      // can't afford — shake
      G.shakeT=0.5; G.flashT=0.4; G.flashC='#ef444460';
      addFloat(canvas.width/2,canvas.height*0.3,'NOT ENOUGH SAVINGS!','#ef4444',1.2);
      return;
    }
    const prevSavings=G.savings;
    G.savings-=emg.cost;
    if(G.savings<=0){ G.savings=0; G.zeroBalance=true; }

    G.score+=Math.round(emg.cost*0.5); // reward for handling correctly
    emg.resolved=true;

    // check if handled without depletion
    if(prevSavings-emg.cost>0) G.emgHandled++;

    removeEmgCard(emg);
    addFloat(canvas.width/2,canvas.height*0.35,`EMERGENCY PAID -$${emg.cost.toLocaleString()}`,'#f87171',1.0);
    spawnParticles(canvas.width/2,canvas.height*0.4,'#ef4444',10);
  }

  function deferEmergency(emg){
    if(emg.resolved) return;
    // deferring penalizes: -10% of score and note
    const pen=Math.round(G.score*0.10)||20;
    G.score=Math.max(0,G.score-pen);
    addFloat(canvas.width/2,canvas.height*0.35,`DEFERRED -${pen} pts`,'#fbbf24',0.9);
    // cost goes up faster now
    emg.deferTime+=4;
    updateEmgCard(emg);
  }

  function removeEmgCard(emg){
    const layer=document.getElementById('bvEmgLayer');
    if(emg.el && layer){
      emg.el.style.opacity='0';
      emg.el.style.transform='scale(.9)';
      emg.el.style.transition='opacity .25s,transform .25s';
      setTimeout(()=>{ if(emg.el&&emg.el.parentNode)emg.el.parentNode.removeChild(emg.el); },280);
    }
    G.emergencies=G.emergencies.filter(e=>e.id!==emg.id);
  }

  /* ─── PARTICLES & FLOATS ────────────────────────────────────── */
  function spawnParticles(x,y,color,n){
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2, spd=80+Math.random()*140;
      G.particles.push({ x,y, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd-60, life:0.7+Math.random()*0.4, color });
    }
  }
  function addFloat(x,y,text,color,scale=1){
    G.floats.push({ x,y,text,color,life:1.2,scale });
  }

  /* ─── FACT TICKER ───────────────────────────────────────────── */
  function showFact(){
    const el=document.getElementById('bvFact');
    if(!el) return;
    const f=FACTS[G.factIdx%FACTS.length]; G.factIdx++;
    el.style.display='block';
    el.innerHTML=`<span style="margin-right:8px">${f.icon}</span>${f.text}`;
    clearTimeout(G._factTO);
    G._factTO=setTimeout(()=>{ if(el) el.style.display='none'; },6000);
  }

  /* ─── HUD UPDATE ────────────────────────────────────────────── */
  function updateHUD(){
    const lv=LEVELS[G.level];
    const savedEl=document.getElementById('bvSaved');
    const shieldEl=document.getElementById('bvShield');
    const shieldBar=document.getElementById('bvShieldBar');
    const scoreEl=document.getElementById('bvScore');
    const timerEl=document.getElementById('bvTimer');
    if(savedEl) savedEl.textContent=`$${Math.round(G.savings).toLocaleString()}`;
    const pct=Math.round(Math.min(100,G.savings/lv.goal*100));
    if(shieldEl) shieldEl.textContent=`${pct}%`;
    if(shieldBar) shieldBar.style.width=pct+'%';
    if(scoreEl) scoreEl.textContent=G.score;
    if(timerEl){
      const s=Math.ceil(G.time);
      timerEl.textContent=s+'s';
      timerEl.style.color=s<=15?'#ef4444':s<=30?'#f59e0b':'#f59e0b';
    }
  }
  function updateGoalLabel(){
    const lv=LEVELS[G.level];
    const el=document.getElementById('bvGoal');
    if(el) el.textContent=`$${lv.goal.toLocaleString()}`;
  }

  /* ─── RENDER ────────────────────────────────────────────────── */
  function render(){
    const W=canvas.width, H=canvas.height;
    if(!ctx||!W||!H) return;

    // shake
    ctx.save();
    if(G.shakeT>0){
      const m=G.shakeT*8;
      ctx.translate((Math.random()-.5)*m,(Math.random()-.5)*m);
    }

    // background
    ctx.fillStyle='#03040c';
    ctx.fillRect(0,0,W,H);

    // flash overlay
    if(G.flashT>0){
      ctx.fillStyle=G.flashC;
      ctx.globalAlpha=G.flashT*2;
      ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=1;
    }

    // draw vault
    drawVault(W,H);

    // shield arcs
    drawShield(W,H);

    // falling zone divider (subtle)
    ctx.strokeStyle='rgba(56,189,248,.06)';
    ctx.lineWidth=1;
    ctx.setLineDash([6,8]);
    ctx.beginPath();
    ctx.moveTo(0,H*0.6);
    ctx.lineTo(W,H*0.6);
    ctx.stroke();
    ctx.setLineDash([]);

    // tokens
    const now=performance.now()/1000;
    G.tokens.forEach(t=>drawToken(t,now));

    // particles
    G.particles.forEach(p=>{
      const a=p.life/0.9;
      ctx.globalAlpha=Math.min(1,a);
      ctx.fillStyle=p.color;
      ctx.beginPath();
      ctx.arc(p.x,p.y,4,0,Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha=1;

    // floats
    G.floats.forEach(f=>{
      const a=Math.min(1,f.life);
      ctx.save();
      ctx.globalAlpha=a;
      ctx.font=`bold ${Math.round(f.scale*15)}px Inter,sans-serif`;
      ctx.fillStyle=f.color;
      ctx.textAlign='center';
      ctx.shadowColor=f.color;
      ctx.shadowBlur=12;
      ctx.fillText(f.text,f.x,f.y);
      ctx.restore();
    });

    // multiplier badge
    if(G.multiplier>1){
      ctx.save();
      ctx.font='bold 13px Orbitron,sans-serif';
      ctx.fillStyle='#38bdf8';
      ctx.shadowColor='#38bdf8';
      ctx.shadowBlur=18;
      ctx.textAlign='right';
      ctx.fillText(`×2 ACTIVE ${G.mulTimer.toFixed(1)}s`,W-14,H-12);
      ctx.restore();
    }

    ctx.restore();
  }

  /* ─── VAULT VISUAL ──────────────────────────────────────────── */
  function drawVault(W,H){
    const cx=W/2, cy=H*0.72;
    const vw=Math.min(W*0.38,160), vh=vw*1.1;

    // vault body
    const grad=ctx.createLinearGradient(cx-vw/2,cy-vh/2,cx+vw/2,cy+vh/2);
    grad.addColorStop(0,'#0f1f3d');
    grad.addColorStop(1,'#070d18');
    ctx.fillStyle=grad;
    roundRect(ctx,cx-vw/2,cy-vh/2,vw,vh,16);
    ctx.fill();

    // vault border glow
    const glowAlpha=0.3+G.shieldPct*0.5;
    ctx.strokeStyle=`rgba(56,189,248,${glowAlpha})`;
    ctx.lineWidth=2.5;
    ctx.shadowColor='#38bdf8';
    ctx.shadowBlur=18*G.shieldPct;
    roundRect(ctx,cx-vw/2,cy-vh/2,vw,vh,16);
    ctx.stroke();
    ctx.shadowBlur=0;

    // vault door detail
    const dr=vw*0.25;
    ctx.strokeStyle='rgba(56,189,248,.4)';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(cx,cy,dr,0,Math.PI*2);
    ctx.stroke();

    ctx.strokeStyle='rgba(56,189,248,.2)';
    ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.arc(cx,cy,dr*0.65,0,Math.PI*2);
    ctx.stroke();

    // spokes
    for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2+(performance.now()/8000);
      ctx.strokeStyle='rgba(56,189,248,.2)';
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*dr*0.65,cy+Math.sin(a)*dr*0.65);
      ctx.lineTo(cx+Math.cos(a)*dr,cy+Math.sin(a)*dr);
      ctx.stroke();
    }

    // handle
    ctx.fillStyle='rgba(56,189,248,.4)';
    ctx.beginPath();
    ctx.arc(cx,cy,6,0,Math.PI*2);
    ctx.fill();

    // savings fill meter inside vault
    const fillH=vh*0.6*G.shieldPct;
    if(fillH>0){
      ctx.save();
      roundRect(ctx,cx-vw/2+4,cy-vh/2+4,vw-8,vh-8,12);
      ctx.clip();
      const fg=ctx.createLinearGradient(cx,cy+vh/2,cx,cy+vh/2-fillH);
      fg.addColorStop(0,'rgba(34,197,94,.4)');
      fg.addColorStop(1,'rgba(56,189,248,.2)');
      ctx.fillStyle=fg;
      ctx.fillRect(cx-vw/2+4,cy+vh/2-fillH-vh*0.2,vw-8,fillH+vh*0.2);
      ctx.restore();
    }

    // "$" label
    ctx.font=`bold ${Math.round(vw*0.18)}px Orbitron,sans-serif`;
    ctx.fillStyle='rgba(56,189,248,.6)';
    ctx.textAlign='center';
    ctx.fillText('$',cx,cy+vw*0.09);

    // savings amount below vault
    ctx.font=`bold ${Math.round(W*0.038)}px Orbitron,sans-serif`;
    ctx.fillStyle='#22c55e';
    ctx.shadowColor='#22c55e';
    ctx.shadowBlur=10;
    ctx.fillText(`$${Math.round(G.savings).toLocaleString()}`,cx,cy+vh/2+28);
    ctx.shadowBlur=0;
    ctx.font=`${Math.round(W*0.026)}px Inter,sans-serif`;
    ctx.fillStyle='#64748b';
    ctx.fillText('emergency savings',cx,cy+vh/2+46);
  }

  /* ─── SHIELD ARC ────────────────────────────────────────────── */
  function drawShield(W,H){
    if(G.shieldPct<=0) return;
    const cx=W/2, cy=H*0.72;
    const lv=LEVELS[G.level];
    const rad=Math.min(W*0.42,200);
    const t=performance.now()/1000;

    ctx.save();

    // outer glow ring
    const rings=3;
    for(let r=0;r<rings;r++){
      const rrad=rad+(r*12)+Math.sin(t*1.4+r)*4;
      const alpha=G.shieldPct*(0.22-r*0.06);
      ctx.strokeStyle=`rgba(56,189,248,${alpha})`;
      ctx.lineWidth=2-r*0.4;
      ctx.beginPath();
      ctx.arc(cx,cy,rrad,-Math.PI/2,Math.PI*2*G.shieldPct-Math.PI/2);
      ctx.stroke();
    }

    // filled arc
    ctx.strokeStyle=SHIELD;
    ctx.lineWidth=4;
    ctx.shadowColor=SHIELD;
    ctx.shadowBlur=16*G.shieldPct;
    ctx.lineCap='round';
    ctx.globalAlpha=0.6*G.shieldPct+0.2;
    ctx.beginPath();
    ctx.arc(cx,cy,rad,-Math.PI/2,Math.PI*2*G.shieldPct-Math.PI/2);
    ctx.stroke();
    ctx.globalAlpha=1;
    ctx.shadowBlur=0;

    // shield % label at top of arc
    if(G.shieldPct>0.05){
      const ang=-Math.PI/2;
      const tx=cx+Math.cos(ang)*(rad+26);
      const ty=cy+Math.sin(ang)*(rad+26);
      ctx.font=`bold ${Math.round(W*0.03)}px Orbitron,sans-serif`;
      ctx.fillStyle='#38bdf8';
      ctx.textAlign='center';
      ctx.fillText(`${Math.round(G.shieldPct*100)}%`,tx,ty+6);
    }

    ctx.restore();
  }

  /* ─── TOKEN DRAWING ─────────────────────────────────────────── */
  function drawToken(t,now){
    const pulse=Math.sin(now*3+t.pulse)*3;
    const r=t.r+pulse;

    ctx.save();

    // glow
    ctx.shadowColor=t.color;
    ctx.shadowBlur=18;

    // circle bg
    ctx.fillStyle=`rgba(${hexToRgb(t.color)},0.18)`;
    ctx.beginPath();
    ctx.arc(t.x,t.y,r,0,Math.PI*2);
    ctx.fill();

    // border
    ctx.strokeStyle=t.color;
    ctx.lineWidth=2;
    ctx.globalAlpha=0.85;
    ctx.beginPath();
    ctx.arc(t.x,t.y,r,0,Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha=1;
    ctx.shadowBlur=0;

    // emoji
    ctx.font=`${Math.round(r*1.15)}px sans-serif`;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(t.emoji,t.x,t.y);

    // value label
    if(t.kind!=='x2'){
      ctx.font=`bold ${Math.round(r*0.55)}px Orbitron,sans-serif`;
      ctx.fillStyle='#fff';
      ctx.textBaseline='bottom';
      ctx.shadowColor='#000';
      ctx.shadowBlur=4;
      ctx.fillText(`+$${t.value}`,t.x,t.y+r+1);
      ctx.shadowBlur=0;
    }

    ctx.restore();
    ctx.textBaseline='alphabetic';
  }

  /* ─── STAR CALCULATION ──────────────────────────────────────── */
  function calcStars(){
    const lv=LEVELS[G.level];
    const reached=G.savings>=lv.goal;
    if(!reached) return G.savings>0?1:0;
    // 3 stars: reached goal, no zero-balance, absorbed at least one emergency
    if(!G.zeroBalance && G.emgHandled>=1) return 3;
    // 2 stars: reached goal, minor issues
    return 2;
  }

  /* ─── END GAME ──────────────────────────────────────────────── */
  function endGame(stars){
    G.phase='end';
    if(raf){ cancelAnimationFrame(raf); raf=null; }

    // remove all emergency cards
    const layer=document.getElementById('bvEmgLayer');
    if(layer) layer.innerHTML='';

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bud_vault', { level: G.level + 1, stars, badge: 'Vault Guardian', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    const lv=LEVELS[G.level];
    const won=G.savings>=lv.goal;
    // feed shared Budgetron Budget Meter — savings built, or shortfall vs goal
    if(window.budgetDelta) budgetDelta(won ? G.savings : G.savings - lv.goal);
    const starStr='⭐'.repeat(stars)+'☆'.repeat(3-stars);

    const end=document.getElementById('bvEnd');
    if(!end) return;
    end.style.display='flex';

    const mainColor=won?'#22c55e':'#ef4444';
    const mainLabel=won?'FUND SECURED':'VAULT DEPLETED';

    end.innerHTML=`
      <div style="font-size:2.6rem;margin-bottom:4px">${won?'🏦':'💸'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.8rem;letter-spacing:.2em;color:${mainColor};margin-bottom:8px">${mainLabel}</div>
      <div style="font-size:1.8rem;letter-spacing:.12em;margin-bottom:6px">${starStr}</div>
      <div style="display:flex;gap:16px;margin-bottom:18px">
        <div style="text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.12em;color:#64748b">SAVED</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:1rem;color:#22c55e">$${Math.round(G.savings).toLocaleString()}</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.12em;color:#64748b">SCORE</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:1rem;color:#a78bfa">${G.score}</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.12em;color:#64748b">COINS</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:1rem;color:#f59e0b">+${stars>0?coins:0}</div>
        </div>
      </div>
      <div style="background:rgba(26,42,74,.6);border:1px solid rgba(56,189,248,.2);border-radius:12px;padding:14px 18px;max-width:320px;margin-bottom:20px;font-size:.75rem;color:#94a3b8;line-height:1.7;text-align:left">
        <span style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.12em;color:#38bdf8;display:block;margin-bottom:6px">LESSON</span>
        An emergency fund is not optional — it is the wall between a bad day and a financial crisis. Even a small cushion of $500 can prevent debt spirals. Start saving before the emergency happens, because it always happens.
      </div>
      <div style="display:flex;gap:12px">
        <button onclick="bvStartLevel(${G.level})" style="padding:12px 24px;border:1px solid rgba(56,189,248,.4);border-radius:12px;background:rgba(26,42,74,.7);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer">PLAY AGAIN</button>
        <button onclick="window.bud_vaultExit()" style="padding:12px 24px;border:1px solid rgba(26,42,74,.6);border-radius:12px;background:rgba(26,42,74,.4);color:#64748b;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
      </div>`;
  }

  /* ─── HELPERS ───────────────────────────────────────────────── */
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

  const _hexCache={};
  function hexToRgb(hex){
    if(_hexCache[hex]) return _hexCache[hex];
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    _hexCache[hex]=`${r},${g},${b}`;
    return _hexCache[hex];
  }

  /* inject keyframe for emergency card entrance */
  (function(){
    const s=document.createElement('style');
    s.textContent=`@keyframes bvEmgIn{from{opacity:0;transform:translateY(-12px) scale(.95)}to{opacity:1;transform:none}}`;
    document.head.appendChild(s);
  })();

})();
