/* ════════════════════════════════════════════════════════════════
   GOAL QUEST · BUDGET BOSS — real canvas arcade (Strategist / BudgetTron)
   Spending items FALL from the top. Sort each one before it hits the floor:
   ←  NEED  ·  ↓  WANT  ·  →  SAVE   (tap a bin or drag the item too).
   Sort right → score, combo, budget health, fill the GOAL meter.
   Sort wrong / let it fall → lose budget health, reset combo, screen shake.
   3-LEVEL MISSION LADDER: L1 Rookie → L2 Pro (higher goal, faster falls,
   more want-decoys) → L3 Legend (highest goal, rarer powers, faster gates).
   Each level has its OWN item mix + its own 4 budget tips (never repeated
   within a level, never repeated across levels).
   Loads after the main script; overrides the stub window.SCREENS.game_goalquest.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='strategist';
  let G=null, raf=null, LV=0;            // LV = current level index (0..2)

  // ── 3-LEVEL SYSTEM — real scaling knobs per level ────────────────────
  //    goal: GOAL meter target · round: seconds · gate: secs between tips
  //    fall: item fall-speed multiplier · spawn: spawn-interval multiplier
  //    mix: spawn odds (power rarer + want-decoys heavier on higher levels)
  const LEVELS=[
    { name:'ROOKIE', goal:300, round:70, gate:18, fall:1.0,  spawn:1.0,  mix:{power:0.07, save:0.13,  want:0.40} },
    { name:'PRO',    goal:420, round:70, gate:16, fall:1.22, spawn:0.85, mix:{power:0.055,save:0.115, want:0.46} },
    { name:'LEGEND', goal:560, round:70, gate:13, fall:1.45, spawn:0.72, mix:{power:0.035,save:0.10,  want:0.495} }
  ];
  function L(){ return LEVELS[LV]; }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

  // ── LEARN WHILE PLAYING: 12 budgeting lessons — each level owns a
  //    disjoint slice of 4 (L1 → 0-3 · L2 → 4-7 · L3 → 8-11), shuffled per
  //    run and never shown twice within a level nor across levels ────────
  const FACTS=[
    // LEVEL 1 · basics
    ['🧠','A budget gives every dollar a job before you spend it.'],
    ['🍞','Needs (food, rent, transport) come before wants.'],
    ['📊','Try 50/30/20: needs / wants / savings.'],
    ['🎯','Plan to a goal — vague goals rarely get funded.'],
    // LEVEL 2 · habits
    ['✂️','Cut one small want each week and send it straight to savings.'],
    ['💧','Track spending — small leaks sink big budgets.'],
    ['🛟','An emergency buffer turns surprises into small bumps, not disasters.'],
    ['🧾','Check receipts against your plan — a budget only works if you look at it.'],
    // LEVEL 3 · pro moves
    ['⏳','Pay yourself first: save the moment money arrives, not from leftovers.'],
    ['📈','Savings grow with compound interest — money earns money over time.'],
    ['🎪','Impulse buys love pressure. Wait 24 hours before big wants.'],
    ['🏦','Separate accounts for each goal make it harder to raid your dreams.']
  ];

  window.gqInit=function(){ G=null; LV=0; };   // playDistrictGame calls this before goTo

  function reset(){
    G={ phase:'play', score:0, goal:0, health:100, combo:0, best:0, sorted:0, perfect:0,
        time:L().round, items:[], parts:[], floats:[], rings:[],
        spawnT:0.6, last:0, started:performance.now(), shake:0, flash:0, flashC:'#60a5fa',
        x2:0, slow:0, lastBin:-1, bins:[0.18,0.5,0.82], gateT:L().gate, gateIdx:0,
        facts:shuffle(FACTS.slice(LV*4,LV*4+4)) };
  }

  // ── item catalogue — EACH LEVEL has its own item/label mix ───────────
  const NEEDS=[
    [ // L1 · everyday basics
      {e:'🍞',t:'Groceries'},{e:'💊',t:'Medicine'},{e:'🚌',t:'Bus fare'},
      {e:'📚',t:'School books'},{e:'🏠',t:'Rent'},{e:'⚡',t:'Electric bill'}
    ],
    [ // L2 · household reality
      {e:'🦷',t:'Dentist'},{e:'🧼',t:'Soap & shampoo'},{e:'🚰',t:'Water bill'},
      {e:'🎒',t:'School bag'},{e:'🧥',t:'Winter coat'},{e:'📱',t:'Phone bill'}
    ],
    [ // L3 · grown-up needs
      {e:'🩹',t:'First aid'},{e:'🥦',t:'Veggies'},{e:'🔌',t:'Internet bill'},
      {e:'👓',t:'Glasses'},{e:'🧺',t:'Laundry'},{e:'🚑',t:'Insurance'}
    ]
  ];
  const WANTS=[
    [ // L1 · classic wants
      {e:'🎮',t:'New game'},{e:'👟',t:'Sneakers'},{e:'🍭',t:'Candy'},
      {e:'🧸',t:'Toy'},{e:'🕶',t:'Shades'},{e:'🍕',t:'Extra pizza'}
    ],
    [ // L2 · sneaky decoys that sound need-ish
      {e:'🎧',t:'Headphones'},{e:'🛹',t:'Skateboard'},{e:'🍦',t:'Ice cream'},
      {e:'🎬',t:'Movie night'},{e:'🍱',t:'Gourmet lunch'},{e:'💅',t:'Nail art'}
    ],
    [ // L3 · deluxe temptations
      {e:'🧋',t:'Boba run'},{e:'🎡',t:'Theme park'},{e:'👑',t:'Designer cap'},
      {e:'📸',t:'New camera'},{e:'🥤',t:'Brand-name water'},{e:'🎤',t:'Karaoke set'}
    ]
  ];
  const SAVES=[
    [ {e:'💰',t:'Paycheck'},{e:'💵',t:'Bonus'},{e:'🤑',t:'Birthday $'} ],            // L1
    [ {e:'🏦',t:'Allowance'},{e:'💎',t:'Gift money'},{e:'📈',t:'Interest'} ],         // L2
    [ {e:'🪙',t:'Side hustle'},{e:'💌',t:'Lucky money'},{e:'🏆',t:'Prize cash'} ]     // L3
  ];
  const POWERS=[ {e:'⏰',k:'time',t:'+5s'},{e:'✨',k:'x2',t:'Double pts'} ];
  // bin index: 0 NEED · 1 WANT · 2 SAVE
  const BIN_COL=['#34d399','#f472b6','#60a5fa'];
  const BIN_LBL=['NEED','WANT','SAVE'];

  window.SCREENS.game_goalquest=function(){
    if(!G) reset();
    setTimeout(gqBoot,30);
    return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#1e293b,#0f172a 62%,#070d18);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(180deg,rgba(7,13,24,.85),transparent)">
        <button onclick="gqExit()" style="padding:7px 14px;border:1px solid rgba(59,130,246,.4);border-radius:9px;background:rgba(59,130,246,.12);color:#93c5fd;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← BUDGETRON</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.2em;color:#60a5fa;flex:1;text-align:center">🎯 GOAL QUEST · <span id="gqLvl">LV ${LV+1}/3</span></div>
        <div id="gqTime" style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fbbf24;min-width:46px;text-align:right">${L().round}s</div>
      </div>
      <div style="position:absolute;top:52px;left:0;right:0;z-index:5;display:flex;gap:8px;padding:0 18px;justify-content:center">
        ${hud('SCORE','gqScore','#93c5fd')}${hud('COMBO','gqCombo','#fbbf24')}${hud('SORTED','gqSorted','#a78bfa')}
      </div>
      <div style="position:absolute;top:118px;left:18px;right:18px;z-index:5">
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:4px"><span>💙 BUDGET HEALTH</span><span id="gqHpTxt">100%</span></div>
        <div style="height:9px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(248,113,113,.25)"><div id="gqHpBar" style="height:100%;width:100%;background:linear-gradient(90deg,#22c55e,#86efac);transition:width .2s,background .3s"></div></div>
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin:8px 0 4px"><span>🎯 GOAL METER</span><span id="gqGoalTxt">0 / ${L().goal}</span></div>
        <div style="height:11px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(59,130,246,.3)"><div id="gqGoalBar" style="height:100%;width:0%;background:linear-gradient(90deg,#2563eb,#60a5fa);transition:width .2s"></div></div>
      </div>
      <canvas id="gqCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>
      <div id="gqHint" style="position:absolute;left:0;right:0;bottom:16px;text-align:center;z-index:4;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.13em;color:rgba(255,255,255,.5);pointer-events:none">←/tap NEED · ↓/tap WANT · →/tap SAVE  ·  drag items too  ·  sort 💰 to SAVE</div>
      <div id="gqGate" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(7,13,24,.86);backdrop-filter:blur(5px);padding:22px"></div>
      <div id="gqOver" style="position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;background:rgba(7,13,24,.84);backdrop-filter:blur(4px)"></div>
    </div>`;
  };
  function hud(label,id,c){ return `<div style="flex:1;max-width:150px;text-align:center;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.18);border-radius:10px;padding:6px"><div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.45)">${label}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:1.1rem;color:${c}">0</div></div>`; }

  function gqBoot(){
    const cv=document.getElementById('gqCanvas'); if(!cv){ return; }
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);

    // ── input: keyboard ──────────────────────────────────────────────
    const kd=e=>{
      if(G.phase!=='play') return;
      if(e.key==='ArrowLeft'){ sortActive(0); e.preventDefault(); }
      else if(e.key==='ArrowDown'){ sortActive(1); e.preventDefault(); }
      else if(e.key==='ArrowRight'){ sortActive(2); e.preventDefault(); }
    };
    window.addEventListener('keydown',kd);

    // ── input: pointer (mouse + touch). Tap a bin to sort the lowest
    //    item; or drag the lowest item into a bin. ──────────────────────
    const binAt=(clientX)=>{ const r=cv.getBoundingClientRect(); const fx=(clientX-r.left)/r.width; let bi=0,bd=9; G.bins.forEach((bx,i)=>{ const d=Math.abs(bx-fx); if(d<bd){bd=d;bi=i;} }); return bi; };
    const lowest=()=>{ let lo=null; for(const it of G.items){ if(it.dead||it.kind==='power') continue; if(!lo||it.y>lo.y) lo=it; } return lo; };
    const down=(clientX,clientY)=>{
      if(G.phase!=='play') return;
      const r=cv.getBoundingClientRect(); const fy=(clientY-r.top)/r.height;
      // grab an item near the pointer to drag it
      const fx=(clientX-r.left)/r.width;
      let pick=null,pd=0.12;
      for(const it of G.items){ if(it.dead) continue; const d=Math.hypot(it.x-fx,it.y-fy); if(d<pd){pd=d;pick=it;} }
      if(pick && pick.kind==='power'){ resolve(pick,0); return; }   // tap a power-up → collect instantly
      if(pick && fy<0.78){ G.drag=pick; pick.grab=true; }
      else { G.tapBin=binAt(clientX); }   // tapped a bin/zone → resolve on up
    };
    const move=(clientX,clientY)=>{ if(G.drag){ const r=cv.getBoundingClientRect(); G.drag.x=Math.max(0.05,Math.min(0.95,(clientX-r.left)/r.width)); G.drag.y=Math.max(0,Math.min(0.95,(clientY-r.top)/r.height)); } };
    const up=(clientX)=>{
      if(G.drag){ const bi=binAt(clientX); resolve(G.drag,bi); G.drag.grab=false; G.drag=null; }
      else if(G.tapBin!=null){ const lo=lowest(); if(lo) resolve(lo,G.tapBin); G.tapBin=null; }
    };
    const mDown=e=>down(e.clientX,e.clientY);
    const mMove=e=>move(e.clientX,e.clientY);
    const mUp=e=>up(e.clientX);
    const tDown=e=>{ if(e.touches[0]){ down(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); } };
    const tMove=e=>{ if(e.touches[0]){ move(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); } };
    const tUp=e=>{ const t=(e.changedTouches&&e.changedTouches[0]); up(t?t.clientX:0); e.preventDefault(); };
    cv.addEventListener('mousedown',mDown); window.addEventListener('mousemove',mMove); window.addEventListener('mouseup',mUp);
    cv.addEventListener('touchstart',tDown,{passive:false}); cv.addEventListener('touchmove',tMove,{passive:false}); cv.addEventListener('touchend',tUp,{passive:false});

    G._cleanup=()=>{
      window.removeEventListener('resize',size); window.removeEventListener('keydown',kd);
      window.removeEventListener('mousemove',mMove); window.removeEventListener('mouseup',mUp);
      cv.removeEventListener('mousedown',mDown);
      cv.removeEventListener('touchstart',tDown); cv.removeEventListener('touchmove',tMove); cv.removeEventListener('touchend',tUp);
    };
    G.last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  // pick the lowest live item and sort it into bin `bi`
  function sortActive(bi){
    let lo=null; for(const it of G.items){ if(it.dead||it.kind==='power') continue; if(!lo||it.y>lo.y) lo=it; }
    if(lo) resolve(lo,bi);
  }

  // resolve item → bin (correct = item.bin matches bi)
  function _resolveSort(it,bi){
    if(it.dead) return;
    const correct = it.bin===bi;
    it.dead=1;
    G.sorted++;
    if(correct){
      G.combo++; G.best=Math.max(G.best,G.combo); G.perfect++;
      const mult = (1+Math.floor(G.combo/4)) * (G.x2>0?2:1);
      const base = it.kind==='save'?22:15;
      const gain = base*mult;
      G.score += gain;
      G.goal = Math.min(L().goal, G.goal + Math.round(base/2)*(G.x2>0?2:1));
      G.health = Math.min(100, G.health + (it.kind==='save'?5:3));
      ring(it.x,it.y,BIN_COL[bi]); burst(it.x,it.y,BIN_COL[bi],11);
      floatTxt(it.x,it.y,'+'+gain,'#fde68a');
      G.flash=0.25; G.flashC=BIN_COL[bi];
      if(G.combo>1 && G.combo%4===0){ floatTxt(0.5,0.42,'COMBO x'+(1+Math.floor(G.combo/4)),'#60a5fa'); }
    } else {
      G.combo=0; G.health=Math.max(0,G.health-14); G.shake=0.42;
      burst(it.x,it.y,'#f87171',13);
      floatTxt(it.x,it.y, it.bin===0?'OOPS — that\'s a NEED!':it.bin===1?'OOPS — that\'s a WANT!':'OOPS — SAVE that!','#fca5a5');
      // brief teachable nudge reinforcing the budgeting rule
      const TIP=it.bin===0?'Needs come first':it.bin===1?'Wants after needs':'Pay your future self';
      floatTxt(it.x, Math.min(0.92,it.y+0.07), TIP, '#93c5fd');
    }
  }

  function loop(now){
    const cv=document.getElementById('gqCanvas');
    if(!cv || !G){ if(G&&G._cleanup){G._cleanup();} G=null; cancelAnimationFrame(raf); return; }   // left screen → stop + release listeners
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    let dt=Math.min(40,now-G.last)/1000; G.last=now;
    if(G.phase==='play'){ update(dt,W,H); }
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  function update(dt,W,H){
    // timer
    G.time-=dt; if(G.time<=0){ G.time=0; return end(); }
    const tEl=document.getElementById('gqTime'); if(tEl) tEl.textContent=Math.ceil(G.time)+'s';
    // knowledge gate — pauses play, shows one lesson card (faster on higher levels)
    G.gateT-=dt; if(G.gateT<=0){ openGate(); return; }
    const prog=1-(G.time/L().round);
    const slowF = G.slow>0?0.45:1;

    // spawn — items fall faster + more often as time runs down; per-level
    // fall/spawn multipliers + item-mix odds make each level feel different
    G.spawnT-=dt;
    if(G.spawnT<=0){
      G.spawnT=Math.max(0.4,(1.25-prog*0.7)*L().spawn);
      const roll=Math.random(), M=L().mix, F=L().fall;
      if(roll<M.power){ // power-up (rarer on higher levels)
        const p=POWERS[Math.floor(Math.random()*POWERS.length)];
        G.items.push({x:Math.random()*0.8+0.1,y:-0.06,vy:(0.26+prog*0.3)*F,e:p.e,kind:'power',pk:p.k,t:p.t,bin:-1,r:20,spin:0});
      } else if(roll<M.power+M.save){ // save / bonus item → SAVE bin
        const s=SAVES[LV][Math.floor(Math.random()*SAVES[LV].length)];
        G.items.push({x:Math.random()*0.8+0.1,y:-0.06,vy:(0.3+prog*0.5+Math.random()*0.15)*F,e:s.e,kind:'save',t:s.t,bin:2,r:23,spin:0});
      } else if(roll<1-M.want){ // need
        const n=NEEDS[LV][Math.floor(Math.random()*NEEDS[LV].length)];
        G.items.push({x:Math.random()*0.8+0.1,y:-0.06,vy:(0.32+prog*0.55+Math.random()*0.2)*F,e:n.e,kind:'need',t:n.t,bin:0,r:22,spin:0});
      } else { // want (decoy-heavy on L2/L3)
        const w=WANTS[LV][Math.floor(Math.random()*WANTS[LV].length)];
        G.items.push({x:Math.random()*0.8+0.1,y:-0.06,vy:(0.32+prog*0.55+Math.random()*0.2)*F,e:w.e,kind:'want',t:w.t,bin:1,r:22,spin:0});
      }
    }

    const floorY=0.82;
    for(const it of G.items){
      if(it.grab) continue;            // held by drag → frozen
      it.y += it.vy*dt*slowF;
      it.spin += dt*1.4;
      if(it.y>=floorY){
        if(it.kind==='power'){ it.dead=1; }   // missed power-ups: no penalty
        else {
          it.dead=1; G.combo=0; G.health=Math.max(0,G.health-10); G.shake=0.34;
          burst(it.x,floorY,'#f87171',9); floatTxt(it.x,floorY,'Missed!','#fca5a5');
        }
      }
    }
    // collect power-ups when they reach the bin row by tap? simpler: power-ups
    // are collected by tapping/dragging them like items. Handle via resolve-less catch:
    // if a power-up is dragged to any bin OR tapped, grant it.
    G.items=G.items.filter(i=>!i.dead);

    if(G.x2>0) G.x2-=dt;
    if(G.slow>0) G.slow-=dt;
    if(G.shake>0) G.shake-=dt; if(G.flash>0) G.flash-=dt;

    // effects
    for(const p of G.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=1.4*dt; p.life-=dt; }
    G.parts=G.parts.filter(p=>p.life>0);
    for(const f of G.floats){ f.y-=dt*0.12; f.life-=dt; }
    G.floats=G.floats.filter(f=>f.life>0);
    for(const rg of G.rings){ rg.r+=dt*1.9; rg.life-=dt; }
    G.rings=G.rings.filter(r=>r.life>0);

    // HUD sync
    setTxt('gqScore',G.score); setTxt('gqCombo','x'+G.combo); setTxt('gqSorted',G.sorted);
    const hb=document.getElementById('gqHpBar'); if(hb){ hb.style.width=G.health+'%'; hb.style.background = G.health>50?'linear-gradient(90deg,#22c55e,#86efac)':G.health>25?'linear-gradient(90deg,#f59e0b,#fcd34d)':'linear-gradient(90deg,#ef4444,#fca5a5)'; }
    const ht=document.getElementById('gqHpTxt'); if(ht) ht.textContent=Math.round(G.health)+'%';
    const gb=document.getElementById('gqGoalBar'); if(gb) gb.style.width=(G.goal/L().goal*100)+'%';
    const gt=document.getElementById('gqGoalTxt'); if(gt) gt.textContent=G.goal+' / '+L().goal;

    if(G.health<=0) return end(false);
    if(G.goal>=L().goal) return end(true);
  }

  // power-ups: granted via resolve() too — intercept there
  function resolve(it,bi){
    if(it.kind==='power'){
      it.dead=1;
      if(it.pk==='time'){ G.time=Math.min(L().round,G.time+5); floatTxt(it.x,it.y,'+5 SEC','#5eead4'); }
      else if(it.pk==='x2'){ G.x2=8; floatTxt(it.x,it.y,'POINTS x2!','#fde68a'); }
      burst(it.x,it.y,'#a78bfa',12); ring(it.x,it.y,'#a78bfa');
      G.flash=0.25; G.flashC='#a78bfa';
      return;
    }
    _resolveSort(it,bi);
  }

  const _gqStars=Array.from({length:60},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.1+0.3,s:Math.random()*0.5+0.2,c:Math.random()<0.5?'#93c5fd':'#c4b5fd'}));
  function _gqBg(ctx,W,H,now){
    // rich dark gradient background
    const bg=ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#0a0416'); bg.addColorStop(0.4,'#0d0829'); bg.addColorStop(1,'#0a1628');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    // perspective floor grid vanishing toward bottom
    ctx.strokeStyle='rgba(139,92,246,.09)'; ctx.lineWidth=1;
    const vy=H*0.82;
    for(let i=0;i<=10;i++){
      const t=i/10;
      ctx.beginPath(); ctx.moveTo(t*W,0); ctx.lineTo(W/2+(t*W-W/2)*3,vy); ctx.stroke();
    }
    for(let j=0;j<4;j++){
      const fy=H*0.25*(j+0.5);
      const sc=1-fy/vy; const lx=W/2-W*sc*0.5; const rx=W/2+W*sc*0.5;
      ctx.beginPath(); ctx.moveTo(lx,fy); ctx.lineTo(rx,fy); ctx.stroke();
    }
    // twinkling stars
    const t=now/1000;
    for(const st of _gqStars){
      const tw=0.3+0.45*Math.sin(t*st.s+st.x*6.28);
      ctx.globalAlpha=tw*0.65; ctx.fillStyle=st.c;
      ctx.beginPath(); ctx.arc(st.x*W,st.y*H*0.65,st.r,0,6.28); ctx.fill();
    }
    ctx.globalAlpha=1;
    // top ambient glow
    const tg=ctx.createRadialGradient(W/2,-H*0.1,0,W/2,-H*0.1,W*0.7);
    tg.addColorStop(0,'rgba(139,92,246,.12)'); tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg; ctx.fillRect(0,0,W,H);
  }

  function render(ctx,W,H,now){
    _gqBg(ctx,W,H,now);
    let ox=0,oy=0; if(G.shake>0){ ox=(Math.random()-.5)*G.shake*22; oy=(Math.random()-.5)*G.shake*22; }
    ctx.save(); ctx.translate(ox,oy);
    if(G.flash>0){ ctx.fillStyle=hexA(G.flashC,G.flash*0.18); ctx.fillRect(0,0,W,H); }

    // ── bins / drop zones across the bottom ──────────────────────────
    const floorY=0.82*H;
    const binW=W/3;
    for(let i=0;i<3;i++){
      const cx=G.bins[i]*W;
      const x0=i*binW, x1=binW;
      const col=BIN_COL[i];
      // zone column glow — deeper
      const grad=ctx.createLinearGradient(0,floorY-30,0,H);
      grad.addColorStop(0,hexA(col,0)); grad.addColorStop(0.5,hexA(col,0.08)); grad.addColorStop(1,hexA(col,0.28));
      ctx.fillStyle=grad; ctx.fillRect(x0,floorY,x1,H-floorY);
      // divider
      if(i>0){
        ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(x0,floorY); ctx.lineTo(x0,H); ctx.stroke();
      }
      // floor glow line
      ctx.shadowColor=col; ctx.shadowBlur=10;
      ctx.strokeStyle=hexA(col,0.65); ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x0+6,floorY); ctx.lineTo(x0+binW-6,floorY); ctx.stroke();
      ctx.shadowBlur=0;
      // bin body (rounded) — glassy panel
      const bw=binW*0.68, bh=50, bx=cx-bw/2, by=H-bh-10;
      roundRect(ctx,bx,by,bw,bh,14);
      // glass fill
      const bg2=ctx.createLinearGradient(0,by,0,by+bh);
      bg2.addColorStop(0,hexA(col,0.22)); bg2.addColorStop(1,hexA(col,0.08));
      ctx.fillStyle=bg2; ctx.fill();
      ctx.shadowColor=col; ctx.shadowBlur=14;
      ctx.strokeStyle=hexA(col,0.7); ctx.lineWidth=2; ctx.stroke();
      ctx.shadowBlur=0;
      // inner highlight line
      roundRect(ctx,bx+3,by+3,bw-6,8,8);
      ctx.fillStyle='rgba(255,255,255,.08)'; ctx.fill();
      // label
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowColor=col; ctx.shadowBlur=8;
      ctx.fillStyle=col; ctx.font="700 13px 'Orbitron',sans-serif"; ctx.fillText(BIN_LBL[i],cx,by+bh/2-6);
      ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font="9px 'Orbitron',sans-serif";
      ctx.fillText(i===0?'← KEY':i===1?'↓ KEY':'→ KEY',cx,by+bh/2+13);
    }

    // ── falling items ────────────────────────────────────────────────
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const it of G.items){
      const x=it.x*W, y=it.y*H;
      const col = it.kind==='save'?'#60a5fa':it.kind==='power'?'#a78bfa':'#e2e8f0';
      // capsule behind emoji + label
      ctx.save(); ctx.translate(x,y);
      const wob=Math.sin(it.spin)*0.04;
      ctx.rotate(it.grab?0:wob);
      ctx.shadowColor=col; ctx.shadowBlur=it.grab?26:14;
      const r=it.r;
      ctx.font=(r*2)+'px serif'; ctx.fillText(it.e,0,-2);
      ctx.shadowBlur=0;
      ctx.restore();
      // label chip under item
      const lab=it.t;
      ctx.font="700 10px 'Inter',sans-serif";
      const tw=ctx.measureText(lab).width+14;
      roundRect(ctx,x-tw/2,y+r-2,tw,16,8);
      ctx.fillStyle='rgba(15,23,42,.82)'; ctx.fill();
      ctx.strokeStyle=hexA(col,0.5); ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle=it.kind==='save'?'#93c5fd':it.kind==='power'?'#c4b5fd':'#cbd5e1';
      ctx.fillText(lab,x,y+r+6);
    }

    // ── particles ────────────────────────────────────────────────────
    for(const p of G.parts){ ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); }
    ctx.globalAlpha=1;
    // ── success rings ────────────────────────────────────────────────
    for(const rg of G.rings){ ctx.globalAlpha=Math.max(0,rg.life/0.5); ctx.strokeStyle=rg.c; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(rg.x*W,rg.y*H,rg.r*W*0.12,0,7); ctx.stroke(); }
    ctx.globalAlpha=1;
    // ── float texts ──────────────────────────────────────────────────
    ctx.textAlign='center';
    for(const f of G.floats){ ctx.globalAlpha=Math.max(0,f.life/0.9); ctx.fillStyle=f.c; ctx.font='700 '+(f.big?22:14)+"px 'Inter',sans-serif"; ctx.fillText(f.t,f.x*W,f.y*H); }
    ctx.globalAlpha=1;

    // x2 badge
    if(G.x2>0){ ctx.textAlign='left'; ctx.fillStyle='#fde68a'; ctx.font="700 12px 'Orbitron',sans-serif"; ctx.fillText('✨ x2  '+Math.ceil(G.x2)+'s',14,170); }
    ctx.restore();
  }

  // ── helpers ──────────────────────────────────────────────────────
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function hexA(hex,a){ const h=hex.replace('#',''); const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }
  function burst(x,y,c,n){ for(let i=0;i<n;i++){ const a=Math.random()*7,s=0.15+Math.random()*0.5; G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.2,s:2+Math.random()*3,c,life:0.5+Math.random()*0.3,max:0.8}); } }
  function ring(x,y,c){ G.rings.push({x,y,r:0.3,c,life:0.5}); }
  function floatTxt(x,y,t,c){ G.floats.push({x,y,t,c,life:0.9,big:t.indexOf('COMBO')>=0||t.indexOf('x2')>=0}); }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

  function end(win){
    if(G.phase==='over') return; G.phase='over';
    const score=G.score;
    const won = win===true || G.goal>=L().goal;                     // computed BEFORE awards (keep!)
    const acc = G.sorted>0?Math.round(G.perfect/G.sorted*100):0;    // computed BEFORE awards (keep!)
    const lvl=LV+1, isFinal=LV>=2;
    let earned=0;
    if(window.state){
      state.gamesDone=state.gamesDone||{}; state.gamesDone['strategist:0']=1;
      const stars = won ? (acc>=90?3:acc>=70?2:1) : 0;
      if(stars>=1 && window.cvAwardGame){
        earned = cvAwardGame('game_goalquest',{level:lvl,stars,badge:'Budget Boss',is3star:stars===3,isPerfect:stars===3,isFlagship:true});
      } else if(!won){
        earned=50; state.coins=(state.coins||0)+earned;   // small consolation, no farming value
        if(window.cvSave) cvSave();
      }
    }
    const o=document.getElementById('gqOver'); if(!o) return; o.style.display='flex';
    const P="padding:13px 26px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;font-weight:900;cursor:pointer";
    const GH="padding:13px 26px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;cursor:pointer";
    const title = won ? (isFinal ? '👑 ALL 3 LEVELS MASTERED!' : 'MISSION ACCOMPLISHED — LEVEL '+lvl+' ✔') : 'NICE TRY! POWER UP AND TRY AGAIN';
    const sub = won ? 'GOAL FUNDED — BUDGET BOSS!' : (G.health<=0 ? 'OOPS — the budget ran dry' : 'OOPS — the clock beat the goal');
    const btns = won
      ? (isFinal
          ? '<button onclick="gqRestart()" style="'+GH+'">↺ REPLAY L3</button><button onclick="gqExit()" style="'+P+'">← HUB</button>'
          : '<button onclick="gqNextLevel()" style="'+P+'">LEVEL '+(lvl+1)+' ▶</button><button onclick="gqRestart()" style="'+GH+'">↺ REPLAY</button><button onclick="gqExit()" style="'+GH+'">← HUB</button>')
      : '<button onclick="gqRestart()" style="'+P+'">↺ TRY AGAIN</button><button onclick="gqExit()" style="'+GH+'">← HUB</button>';
    o.innerHTML=`<div style="max-width:440px;text-align:center;padding:34px 28px;border:1px solid ${won?'#fbbf24':'#3b82f6'};border-radius:22px;background:linear-gradient(160deg,rgba(30,41,59,.97),rgba(7,13,24,.97));box-shadow:0 0 60px rgba(59,130,246,.4)">
      <div style="font-size:3rem;margin-bottom:8px">${won?(isFinal?'👑':'🏆'):G.health<=0?'💸':'⏱'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:${won?'#fbbf24':'#60a5fa'};margin-bottom:6px">${title}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:8px">${sub}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:2rem;margin:0 0 6px">${score} pts</h1>
      <p style="color:rgba(255,255,255,.65);margin:0 0 18px;font-size:.9rem">LEVEL ${lvl}/3 · Goal ${G.goal}/${L().goal} 🎯 · Accuracy ${acc}% · Best combo x${G.best} · +${earned} 🪙</p>
      ${btns}
    </div>`;
  }

  // ── KNOWLEDGE GATE — pauses play, shows one budgeting lesson from this
  //    level's shuffled slice of 4; once all are shown, gates silently
  //    skip so no tip ever repeats ───────────────────────────────────────
  function openGate(){
    if(!G || G.phase!=='play') return;
    if(G.gateIdx>=G.facts.length){ G.gateT=L().gate; return; }   // all 4 tips shown this level → never repeat
    G.phase='gate';
    const f=G.facts[G.gateIdx]; G.gateIdx++;
    const o=document.getElementById('gqGate'); if(!o){ G.phase='play'; G.gateT=L().gate; return; }
    o.style.display='flex';
    o.innerHTML=`<div style="max-width:440px;text-align:center;padding:30px 26px;border:1px solid #3b82f6;border-radius:22px;background:linear-gradient(160deg,rgba(30,41,59,.97),rgba(7,13,24,.97));box-shadow:0 0 50px rgba(59,130,246,.4);animation:gqGateIn .35s ease">
      <style>@keyframes gqGateIn{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}</style>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.2em;color:#93c5fd;margin-bottom:10px">⛩️ KNOWLEDGE GATE · BUDGET TIP · LV ${LV+1}</div>
      <div style="font-size:2.4rem;margin-bottom:8px">${f[0]}</div>
      <p style="font-size:1.02rem;line-height:1.5;color:#fff;margin:0 0 18px">${f[1]}</p>
      <button onclick="gqGateGo()" style="padding:13px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#60a5fa,#2563eb);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.12em;font-weight:900;cursor:pointer">GOT IT → +10 HEALTH</button>
    </div>`;
  }
  window.gqGateGo=function(){
    if(!G) return;
    G.health=Math.min(100,G.health+10); G.score+=40;
    G.gateT=L().gate; G.phase='play';
    const o=document.getElementById('gqGate'); if(o){ o.style.display='none'; o.innerHTML=''; }
    G.last=performance.now();   // avoid a dt jump on resume
    G.flash=0.25; G.flashC='#60a5fa';
  };

  window.gqRestart=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); reset(); ['gqGate','gqOver'].forEach(id=>{const o=document.getElementById(id);if(o){o.style.display='none';o.innerHTML='';}}); gqBoot(); };
  // advance to the next level IN PLACE: release listeners, re-init state at
  // LV+1, refresh the level chip, then re-boot the canvas (gqRestart-style)
  window.gqNextLevel=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); LV=Math.min(2,LV+1); reset(); ['gqGate','gqOver'].forEach(id=>{const o=document.getElementById(id);if(o){o.style.display='none';o.innerHTML='';}}); const lt=document.getElementById('gqLvl'); if(lt) lt.textContent='LV '+(LV+1)+'/3'; gqBoot(); };
  window.gqExit=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); G=null; if(window.state)state.viewingWorld=state._returnHub||'strategist'; goTo('hub'); };
})();
