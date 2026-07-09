/* ════════════════════════════════════════════════════════════════
   BIZ OP 1.0 — real canvas business sim (Builder / LAUNCH LAB)
   Pick a shop, then RUN it. Customers queue with an order + a draining
   PATIENCE bar. TAP a customer to SERVE (spends 1 stock, earns revenue
   + tip — bigger tip when patience is high). Build serve COMBOS.
   Watch INVENTORY: tap RESTOCK before you run dry. Angry walk-offs
   crush HAPPINESS. Hit the revenue GOAL before time runs out.
   3-LEVEL MISSION LADDER: L1 Rookie → L2 Pro (higher goal, faster
   customer spawns, shorter patience, pricier restocks) → L3 Legend
   (highest goal, fastest spawns, shortest patience, priciest restocks).
   Each level has its OWN 4 entrepreneurship tips (never repeated within
   a level, never repeated across levels).
   Loads after the main script; overrides the stub window.SCREENS.game_bizop.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const MAXQ=5, START_STOCK=8, STOCK_CAP=12, RESTOCK_QTY=6, GATE_EVERY=18;
  let G=null, raf=null, LV=0;   // LV = current level index (0..2)

  // ── 3-LEVEL SYSTEM — real scaling knobs per level ────────────────────
  //    goal: revenue target · round: seconds · spawnMul: spawn-interval
  //    multiplier (lower=faster customers) · patMul: patience multiplier
  //    (lower=shorter fuse) · restockCost: $ per restock (pricier = tighter
  //    margins on higher levels)
  const LEVELS=[
    { name:'ROOKIE', goal:2000, round:80, spawnMul:1.0,  patMul:1.0,  restockCost:40 },
    { name:'PRO',    goal:2800, round:82, spawnMul:0.82, patMul:0.82, restockCost:55 },
    { name:'LEGEND', goal:3800, round:85, spawnMul:0.68, patMul:0.68, restockCost:70 }
  ];
  function L(){ return LEVELS[LV]; }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

  // LEARN WHILE PLAYING — 12 entrepreneurship lessons, split into 3
  // disjoint 4-fact slices (L1 → 0-3 · L2 → 4-7 · L3 → 8-11), shuffled per
  // run and never repeated within a level nor across levels
  const FACTS=[
    // LEVEL 1 · the basics
    ['💡','Start with a real problem people will pay to solve.'],
    ['😀','Happy customers come back — service matters.'],
    ['📦','Keep stock ready, but don\'t over-order and waste cash.'],
    ['🏷️','Price to cover costs AND make a profit.'],
    // LEVEL 2 · running the shop
    ['⚡','Fast service = more customers served = more revenue.'],
    ['💰','Revenue minus costs = profit. Watch both.'],
    ['📣','Marketing brings customers — but spend wisely.'],
    ['🔁','Repeat customers cost less to win than brand-new ones — treat them well.'],
    // LEVEL 3 · scaling up
    ['📊','Track your numbers daily — small trends become big problems if ignored.'],
    ['🧯','Keep a cash cushion — slow days happen even to great businesses.'],
    ['🤝','Your team\'s mood shows up in every customer interaction — support them too.'],
    ['🚀','Reinvest some profit into growth, but never spend money you don\'t have.']
  ];

  window.boInit=function(){ G=null; LV=0; };  // playDistrictGame calls this before goTo

  // Selectable shops (each themes the order menu + base price)
  const SHOPS={
    burger:{ e:'🍔', name:'BURGER BARN', menu:['🍔','🍟','🥤','🌭','🥗'], base:55 },
    coffee:{ e:'☕', name:'BEAN MACHINE', menu:['☕','🥐','🧁','🍪','🥤'], base:50 },
    pizza:{ e:'🍕', name:'PIZZA PALACE', menu:['🍕','🥤','🧄','🍗','🥗'], base:60 }
  };
  // Customer face pool — varied so the queue feels alive
  const FACES=['🧑','👩','👨','👵','👴','🧒','👧','👦','🧔','👱','👩‍🦱','🧑‍🦰','👨‍🦳','🧓','👩‍🦳'];

  function reset(keepShop){
    const shop = keepShop || (G&&G.shopKey) || null;
    G={ phase: shop?'play':'pick', shopKey:shop,
        revenue:0, stock:START_STOCK, happy:100, time:L().round,
        served:0, lost:0, combo:0, bestCombo:0, tips:0,
        queue:[], parts:[], floats:[], coins:[],
        spawnT:0.6, last:0, started:performance.now(),
        shake:0, flash:0, turbo:0, mkt:0, restockPulse:0, lowWarn:0,
        gateT:GATE_EVERY, gateIdx:0,
        facts:shuffle(FACTS.slice(LV*4,LV*4+4)) };
  }

  window.SCREENS.game_bizop=function(){
    if(!G) reset();
    setTimeout(boBoot,30);
    return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,#3d2560,#2d1b4e 55%,#1a1030);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div style="position:absolute;top:0;left:0;right:0;z-index:6;display:flex;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(180deg,rgba(26,16,48,.9),transparent)">
        <button onclick="boExit()" style="padding:7px 14px;border:1px solid rgba(168,85,247,.45);border-radius:9px;background:rgba(168,85,247,.12);color:#c084fc;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer;white-space:nowrap">← LAUNCH LAB</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.2em;color:#c084fc;flex:1;text-align:center">💼 BIZ OP · <span id="boLvl">LV ${LV+1}/3</span></div>
        <div id="boTime" style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fbbf24;min-width:42px;text-align:right">${L().round}s</div>
      </div>

      <!-- Revenue + goal bar -->
      <div style="position:absolute;top:50px;left:16px;right:16px;z-index:6">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4px">
          <span style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55)">REVENUE</span>
          <span id="boRevTxt" style="font-family:'Anton',sans-serif;font-size:1.55rem;line-height:1;color:#34d399">$0</span>
        </div>
        <div style="height:9px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(168,85,247,.3)"><div id="boRevBar" style="height:100%;width:0%;background:linear-gradient(90deg,#a855f7,#34d399);transition:width .25s"></div></div>
        <div style="text-align:right;font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.1em;color:rgba(255,255,255,.4);margin-top:2px">GOAL $<span id="boGoalTxt">${L().goal}</span></div>
      </div>

      <!-- Stat chips -->
      <div style="position:absolute;top:118px;left:16px;right:16px;z-index:6;display:flex;gap:8px;justify-content:center">
        ${chip('STOCK','boStock','#fbbf24')}${chip('HAPPY','boHappyN','#34d399')}${chip('COMBO','boCombo','#c084fc')}
      </div>
      <!-- Happiness bar -->
      <div style="position:absolute;top:172px;left:16px;right:16px;z-index:6">
        <div style="height:7px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(239,68,68,.25)"><div id="boHappyBar" style="height:100%;width:100%;background:linear-gradient(90deg,#f472b6,#34d399);transition:width .25s"></div></div>
      </div>

      <canvas id="boCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>

      <!-- Restock button -->
      <button id="boRestock" onclick="boDoRestock()" style="position:absolute;left:50%;bottom:64px;transform:translateX(-50%);z-index:7;padding:13px 24px;border:none;border-radius:15px;background:linear-gradient(135deg,#a855f7,#7e22ce);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.08em;font-weight:900;cursor:pointer;box-shadow:0 6px 22px rgba(168,85,247,.5);display:none">📦 RESTOCK +${RESTOCK_QTY} <span style="opacity:.8;font-size:.6rem">(−$<span id="boRestockCostTxt">${L().restockCost}</span>)</span></button>

      <div id="boHint" style="position:absolute;left:0;right:0;bottom:20px;text-align:center;z-index:5;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.1em;color:rgba(255,255,255,.42);pointer-events:none">TAP a customer to SERVE · keep STOCK up · serve fast for TIPS</div>

      <!-- Shop picker overlay -->
      <div id="boPick" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(26,16,48,.92);backdrop-filter:blur(5px)"></div>
      <!-- Knowledge gate overlay -->
      <div id="boGate" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(26,16,48,.88);backdrop-filter:blur(5px);padding:22px"></div>
      <!-- End overlay -->
      <div id="boOver" style="position:absolute;inset:0;z-index:10;display:none;align-items:center;justify-content:center;background:rgba(26,16,48,.86);backdrop-filter:blur(5px)"></div>
    </div>`;
  };

  function chip(label,id,c){ return `<div style="flex:1;max-width:130px;text-align:center;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);border-radius:11px;padding:6px"><div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.45)">${label}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:1.15rem;color:${c}">—</div></div>`; }

  function showPicker(){
    const p=document.getElementById('boPick'); if(!p) return; p.style.display='flex';
    const card=(k,s)=>`<button onclick="boPickShop('${k}')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px 14px;min-width:104px;border:2px solid rgba(168,85,247,.4);border-radius:18px;background:linear-gradient(160deg,rgba(61,37,96,.9),rgba(45,27,78,.9));color:#fff;cursor:pointer;transition:transform .12s,border-color .15s" onmouseover="this.style.transform='translateY(-5px)';this.style.borderColor='#c084fc'" onmouseout="this.style.transform='none';this.style.borderColor='rgba(168,85,247,.4)'"><div style="font-size:2.6rem">${s.e}</div><div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.06em;color:#c084fc">${s.name}</div></button>`;
    p.innerHTML=`<div style="max-width:440px;text-align:center;padding:30px 22px">
      <div style="font-size:2.4rem;margin-bottom:4px">💼</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.2em;color:#c084fc;margin-bottom:6px">CHOOSE YOUR BUSINESS</div>
      <p style="color:rgba(255,255,255,.6);margin:0 0 20px;font-size:.85rem">Serve every customer before they lose patience. Hit <b style="color:#34d399">$${L().goal}</b> revenue in ${L().round}s!</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">${card('burger',SHOPS.burger)}${card('coffee',SHOPS.coffee)}${card('pizza',SHOPS.pizza)}</div>
    </div>`;
  }
  window.boPickShop=function(k){ G.shopKey=k; G.phase='play'; const p=document.getElementById('boPick'); if(p){p.style.display='none';p.innerHTML='';} const rb=document.getElementById('boRestock'); if(rb)rb.style.display='block'; G.last=performance.now(); };

  function boBoot(){
    const cv=document.getElementById('boCanvas'); if(!cv){ return; }
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);

    // SERVE on tap/click — hit-test the customer slots
    const hit=(clientX,clientY)=>{
      if(!G||G.phase!=='play') return;
      const r=cv.getBoundingClientRect();
      const x=(clientX-r.left)/r.width, y=(clientY-r.top)/r.height;
      // iterate front→back so nearest gets served
      let best=-1, bestD=1e9;
      for(let i=0;i<G.queue.length;i++){
        const c=G.queue[i]; if(c.state!=='wait') continue;
        const dx=x-c.x, dy=y-c.cy; const d=dx*dx+dy*dy;
        if(d<0.018 && d<bestD){ bestD=d; best=i; }
      }
      if(best>=0) serve(G.queue[best]);
      else if(G.stock<=2){ // generous: tapping empty area when low nudges restock glow
        G.restockPulse=0.5;
      }
    };
    const md=e=>hit(e.clientX,e.clientY);
    const ts=e=>{ if(e.touches[0]){ hit(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); } };
    cv.addEventListener('mousedown',md);
    cv.addEventListener('touchstart',ts,{passive:false});
    // keyboard: R restock, 1-5 serve nth waiting customer
    const kd=e=>{
      if(!G||G.phase!=='play') return;
      if(e.key==='r'||e.key==='R'){ boDoRestock(); }
      else if(e.key>='1'&&e.key<='5'){ const idx=+e.key-1; const w=G.queue.filter(c=>c.state==='wait'); if(w[idx]) serve(w[idx]); }
    };
    window.addEventListener('keydown',kd);
    G._cleanup=()=>{ window.removeEventListener('resize',size); window.removeEventListener('keydown',kd); cv.removeEventListener('mousedown',md); cv.removeEventListener('touchstart',ts); };

    if(G.phase==='pick') showPicker();
    else { const rb=document.getElementById('boRestock'); if(rb)rb.style.display='block'; }
    G.last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  function loop(now){
    const cv=document.getElementById('boCanvas');
    if(!cv || !G){ cancelAnimationFrame(raf); return; }   // left screen → stop
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    let dt=Math.min(40,now-G.last)/1000; G.last=now;
    if(G.phase==='play') update(dt,W,H);
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  // queue layout: 5 slots across, sitting in the lower-mid band
  function slotX(i){ return 0.12 + i*0.19; }
  const QY=0.62;

  function spawnCustomer(prog){
    if(G.queue.length>=MAXQ) return;
    // find a free slot index
    const taken=new Set(G.queue.map(c=>c.slot));
    let slot=-1; for(let i=0;i<MAXQ;i++){ if(!taken.has(i)){ slot=i; break; } }
    if(slot<0) return;
    const shop=SHOPS[G.shopKey]||SHOPS.burger;
    const order=shop.menu[Math.floor(Math.random()*shop.menu.length)];
    const face=FACES[Math.floor(Math.random()*FACES.length)];
    const patMax=(4.2 - prog*1.4 + Math.random()*1.2)*L().patMul;   // shrinks as game heats up + as level ramps
    G.queue.push({ slot, x:slotX(slot)-0.16, tx:slotX(slot), cy:QY, face, order, base:shop.base,
                   pat:patMax, patMax, state:'in', enter:0, bob:Math.random()*6.28, served:0, leave:0 });
  }

  function serve(c){
    if(G.stock<=0){ G.restockPulse=0.7; G.shake=0.18; floatTxt(c.tx, QY-0.07, 'NO STOCK!', '#fca5a5'); return; }
    G.stock--;
    G.combo++; G.bestCombo=Math.max(G.bestCombo,G.combo);
    G.served++;
    const patFrac=c.pat/c.patMax;
    const tip=Math.round(c.base*0.6*patFrac);          // fast serve = big tip
    const comboBonus=Math.floor(G.combo/3)*5;
    const gain=c.base+tip+comboBonus;
    G.revenue+=gain; G.tips+=tip;
    c.state='served'; c.served=1; c.leave=0;
    // fly coins toward the revenue readout (top)
    flyCoins(c.tx, QY-0.04, 3+Math.floor(patFrac*3));
    burst(c.tx, QY-0.05, '#34d399', 9);
    floatTxt(c.tx, QY-0.09, '+$'+gain, patFrac>0.55?'#fde68a':'#a7f3d0');
    if(tip>0 && patFrac>0.6) floatTxt(c.tx, QY-0.15, 'NICE TIP!', '#fbbf24');
    if(G.combo>1 && G.combo%3===0){ G.flash=0.35; floatTxt(0.5,0.34,'COMBO x'+G.combo,'#c084fc'); }
    if(G.stock<=2) G.restockPulse=0.6;
  }

  window.boDoRestock=function(){
    if(!G||G.phase!=='play') return;
    if(G.stock>=STOCK_CAP){ floatTxt(0.5,0.5,'STOCK FULL','#c084fc'); return; }
    const cost=L().restockCost;
    if(G.revenue<cost){ G.shake=0.18; floatTxt(0.5,0.5,'NEED $'+cost,'#fca5a5'); return; }
    G.revenue-=cost;
    G.stock=Math.min(STOCK_CAP,G.stock+RESTOCK_QTY);
    G.restockPulse=0; G.flash=0.25;
    burst(0.5,0.9,'#fbbf24',12);
    floatTxt(0.5,0.86,'+'+RESTOCK_QTY+' STOCK','#fde68a');
  };

  function update(dt,W,H){
    G.time-=dt; if(G.time<=0){ G.time=0; return end(); }
    const tEl=document.getElementById('boTime'); if(tEl){ tEl.textContent=Math.ceil(G.time)+'s'; tEl.style.color=G.time<15?'#f87171':'#fbbf24'; }
    // KNOWLEDGE GATE every ~18s — pauses everything (customers/patience/timer freeze)
    G.gateT-=dt; if(G.gateT<=0){ return openGate(); }
    const prog=1-(G.time/L().round);

    // spawn customers (marketing power-up speeds spawns; per-level spawnMul
    // makes higher levels throw customers at you faster)
    G.spawnT-=dt*(G.mkt>0?1.8:1);
    if(G.spawnT<=0){
      G.spawnT=Math.max(0.9, 2.3 - prog*1.3) * (0.7+Math.random()*0.6) * L().spawnMul;
      spawnCustomer(prog);
      // occasional power-up gift instead of plain spawn pacing
    }
    // rare power-up drops as floating pickups handled simply: every ~18s grant turbo/mkt automatically on milestones
    // (kept lightweight — flavor only)

    let anyServedThisFrame=false;
    for(const c of G.queue){
      // slide-in
      if(c.state==='in'){ c.enter+=dt*3.2; c.x += (c.tx-c.x)*Math.min(1,dt*8); if(c.enter>=1){ c.state='wait'; c.x=c.tx; } }
      else if(c.state==='wait'){
        c.bob+=dt*4;
        c.pat -= dt*(G.turbo>0?0.55:1) * (0.85);
        if(c.pat<=0){ // walked off angry
          c.pat=0; c.state='angry'; c.leave=0; G.combo=0; G.lost++;
          G.happy=Math.max(0, G.happy-16); G.shake=0.32;
          burst(c.tx, QY-0.04, '#f87171', 12); floatTxt(c.tx, QY-0.1, '😡 LEFT', '#fca5a5');
        }
      }
      else if(c.state==='served'){ c.leave+=dt; c.cy -= dt*0.25; if(c.leave>0.6) c.dead=1; anyServedThisFrame=true; }
      else if(c.state==='angry'){ c.leave+=dt; c.x += dt*0.4; if(c.leave>0.6) c.dead=1; }
    }
    G.queue=G.queue.filter(c=>!c.dead);

    // power-up flavor: auto-grant on combo streaks (cheap + satisfying)
    if(G.combo>0 && G.combo%9===0 && G.turbo<=0 && Math.random()<0.5){ G.turbo=6; floatTxt(0.5,0.42,'⚡ TURBO SERVICE','#67e8f9'); }
    if(G.served>0 && G.served%12===0 && G.mkt<=0){ G.mkt=6; floatTxt(0.5,0.42,'📣 RUSH HOUR','#f9a8d4'); }

    if(G.turbo>0) G.turbo-=dt;
    if(G.mkt>0) G.mkt-=dt;
    if(G.shake>0) G.shake-=dt; if(G.flash>0) G.flash-=dt;
    if(G.restockPulse>0) G.restockPulse-=dt;

    // particles / floats / coins
    for(const p of G.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=1.2*dt; p.life-=dt; }
    G.parts=G.parts.filter(p=>p.life>0);
    for(const f of G.floats){ f.y-=dt*0.13; f.life-=dt; }
    G.floats=G.floats.filter(f=>f.life>0);
    for(const co of G.coins){ co.t+=dt*2.2; co.x=co.sx+(co.dx-co.sx)*ease(co.t); co.y=co.sy+(co.dy-co.sy)*ease(co.t)-Math.sin(Math.min(1,co.t)*3.14)*0.12; if(co.t>=1) co.dead=1; }
    G.coins=G.coins.filter(c=>!c.dead);

    // HUD sync
    setTxt('boStock',G.stock);
    setTxt('boHappyN',Math.round(G.happy)+'%');
    setTxt('boCombo','x'+G.combo);
    setTxt('boRevTxt','$'+G.revenue);
    setTxt('boGoalTxt',L().goal);
    setTxt('boRestockCostTxt',L().restockCost);
    const rb=document.getElementById('boRevBar'); if(rb) rb.style.width=Math.min(100,G.revenue/L().goal*100)+'%';
    const hb=document.getElementById('boHappyBar'); if(hb) hb.style.width=G.happy+'%';
    const sc=document.getElementById('boStock'); if(sc) sc.style.color = G.stock<=2 ? '#f87171' : '#fbbf24';
    // restock button glow when low
    const rbtn=document.getElementById('boRestock');
    if(rbtn){ const lit=G.stock<=3||G.restockPulse>0; rbtn.style.boxShadow= lit ? '0 0 26px rgba(251,191,36,.85),0 6px 22px rgba(168,85,247,.5)' : '0 6px 22px rgba(168,85,247,.5)'; rbtn.style.transform='translateX(-50%)'+(lit?' scale(1.05)':''); }

    if(G.revenue>=L().goal) return end(true);
    if(G.happy<=0) return end(false);
  }
  function ease(t){ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); }

  const _bzStars=Array.from({length:45},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.0+0.25,s:Math.random()*0.45+0.2,c:Math.random()<0.5?'#c4b5fd':'#f0abfc'}));
  function _bzBg(ctx,W,H,counterY,now){
    // deep purple/indigo gradient sky
    const bg=ctx.createLinearGradient(0,0,0,counterY);
    bg.addColorStop(0,'#0d0618'); bg.addColorStop(0.5,'#120a22'); bg.addColorStop(1,'#1a0a2e');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,counterY);
    // warm floor zone
    const flr=ctx.createLinearGradient(0,counterY-20,0,H);
    flr.addColorStop(0,'rgba(168,85,247,.2)'); flr.addColorStop(1,'rgba(126,34,206,.06)');
    ctx.fillStyle=flr; ctx.fillRect(0,counterY-20,W,H-counterY+20);
    // glowing counter divider line
    ctx.shadowColor='#c084fc'; ctx.shadowBlur=12;
    ctx.fillStyle='rgba(192,132,252,.6)'; ctx.fillRect(0,counterY-2,W,3);
    ctx.shadowBlur=0;
    // twinkling stars in the "sky" area
    const t=now/1000;
    for(const st of _bzStars){
      const tw=0.25+0.45*Math.sin(t*st.s+st.x*6.28);
      ctx.globalAlpha=tw*0.65; ctx.fillStyle=st.c;
      ctx.beginPath(); ctx.arc(st.x*W,st.y*(counterY*0.9),st.r,0,6.28); ctx.fill();
    }
    ctx.globalAlpha=1;
    // top glow arc
    const tg=ctx.createRadialGradient(W/2,-20,0,W/2,-20,W*0.8);
    tg.addColorStop(0,'rgba(192,132,252,.10)'); tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg; ctx.fillRect(0,0,W,counterY);
  }

  function render(ctx,W,H,now){
    const counterY=QY*H+44;
    _bzBg(ctx,W,H,counterY,now);
    let ox=0,oy=0; if(G.shake>0){ ox=(Math.random()-.5)*G.shake*20; oy=(Math.random()-.5)*G.shake*20; }
    ctx.save(); ctx.translate(ox,oy);
    if(G.flash>0){ ctx.fillStyle='rgba(168,85,247,'+(G.flash*0.22)+')'; ctx.fillRect(0,0,W,H); }

    // shop sign (your stand)
    const shop=SHOPS[G.shopKey];
    if(shop){
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='34px serif'; ctx.globalAlpha=0.9; ctx.fillText(shop.e, W*0.5, counterY+ (H-counterY)*0.5); ctx.globalAlpha=1;
      ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font="600 11px 'Orbitron',sans-serif"; ctx.fillText('YOUR '+shop.name, W*0.5, counterY+(H-counterY)*0.5+34);
    }

    ctx.textAlign='center'; ctx.textBaseline='middle';
    // customers
    for(const c of G.queue){
      const x=c.x*W, y=c.cy*H;
      let alpha=1, scale=1;
      if(c.state==='in') alpha=Math.min(1,c.enter);
      if(c.state==='served'){ alpha=Math.max(0,1-c.leave/0.6); scale=1+c.leave*0.3; }
      if(c.state==='angry'){ alpha=Math.max(0,1-c.leave/0.6); }
      ctx.globalAlpha=alpha;
      const bob=c.state==='wait'?Math.sin(c.bob)*2:0;

      // order bubble above head
      if(c.state==='wait'||c.state==='in'){
        const by=y-46+bob;
        ctx.fillStyle='rgba(255,255,255,.95)';
        roundRect(ctx, x-20, by-20, 40, 34, 9); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x-6,by+13); ctx.lineTo(x+6,by+13); ctx.lineTo(x,by+21); ctx.closePath(); ctx.fill();
        ctx.font='20px serif'; ctx.fillText(c.order, x, by-2);
      }

      // body
      ctx.save(); ctx.translate(x,y+bob); ctx.scale(scale,scale);
      if(c.state==='served'){ ctx.shadowColor='#34d399'; ctx.shadowBlur=20; }
      else if(c.state==='angry'){ ctx.shadowColor='#ef4444'; ctx.shadowBlur=18; }
      ctx.font='46px serif'; ctx.fillText(c.state==='angry'?'😡':c.face, 0, 0);
      ctx.shadowBlur=0; ctx.restore();

      // patience bar under feet
      if(c.state==='wait'){
        const pf=c.pat/c.patMax, bw=46, bx=x-bw/2, byb=y+30+bob;
        ctx.globalAlpha=alpha; ctx.fillStyle='rgba(0,0,0,.4)'; roundRect(ctx,bx,byb,bw,6,3); ctx.fill();
        const col = pf>0.5?'#34d399':pf>0.25?'#fbbf24':'#f87171';
        ctx.fillStyle=col; roundRect(ctx,bx,byb,bw*pf,6,3); ctx.fill();
      }
      ctx.globalAlpha=1;
    }

    // particles
    for(const p of G.parts){ ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); }
    ctx.globalAlpha=1;
    // flying coins
    ctx.font='20px serif';
    for(const co of G.coins){ ctx.globalAlpha=Math.max(0,1-co.t*0.3); ctx.fillText('🪙', co.x*W, co.y*H); }
    ctx.globalAlpha=1;

    // float texts
    for(const f of G.floats){ ctx.globalAlpha=Math.max(0,f.life/0.9); ctx.fillStyle=f.c; ctx.font='800 '+(f.big?22:15)+"px 'Inter',sans-serif"; ctx.fillText(f.t,f.x*W,f.y*H); }
    ctx.globalAlpha=1;

    // power-up status badges (top-left under bars)
    let badgeX=22;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    if(G.turbo>0){ ctx.font="700 12px 'Orbitron',sans-serif"; ctx.fillStyle='#67e8f9'; ctx.fillText('⚡ TURBO '+Math.ceil(G.turbo), badgeX, 200); }
    if(G.mkt>0){ ctx.font="700 12px 'Orbitron',sans-serif"; ctx.fillStyle='#f9a8d4'; ctx.fillText('📣 RUSH '+Math.ceil(G.mkt), badgeX, G.turbo>0?218:200); }
    ctx.restore();
  }

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function burst(x,y,c,n){ for(let i=0;i<n;i++){ const a=Math.random()*7,s=0.12+Math.random()*0.45; G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.18,s:2+Math.random()*3,c,life:0.45+Math.random()*0.3,max:0.75}); } }
  function flyCoins(x,y,n){ for(let i=0;i<n;i++){ G.coins.push({sx:x+(Math.random()-.5)*0.05,sy:y,dx:0.5+(Math.random()-.5)*0.18,dy:0.06,x,y,t:-i*0.08}); } }
  function floatTxt(x,y,t,c){ G.floats.push({x,y,t,c,life:0.9,big:t.indexOf('COMBO')>=0||t.indexOf('TURBO')>=0||t.indexOf('RUSH')>=0}); }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

  function end(win){
    if(G.phase==='over') return; G.phase='over';
    const score=G.revenue;
    const won = win===true || G.revenue>=L().goal;                 // computed BEFORE awards (keep!)
    const lvl=LV+1, isFinal=LV>=2;
    let earned=0;
    if(window.state){
      state.gamesDone=state.gamesDone||{}; state.gamesDone['builder:0']=1;
      const stars = won ? (G.happy>=80?3:G.happy>=50?2:1) : 0;
      if(stars>=1 && window.cvAwardGame){
        earned = cvAwardGame('game_bizop',{level:lvl,stars,badge:'Biz Tycoon',is3star:stars===3,isPerfect:stars===3,isFlagship:true});
      } else if(!won){
        earned=50; state.coins=(state.coins||0)+earned;   // small consolation, no farming value
        if(window.cvAddXP) cvAddXP(10,0); if(window.cvSave) cvSave();
      }
    }
    const rb=document.getElementById('boRestock'); if(rb) rb.style.display='none';
    const o=document.getElementById('boOver'); if(!o) return; o.style.display='flex';
    const P="padding:13px 26px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#a855f7,#7e22ce);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;font-weight:900;cursor:pointer";
    const GH="padding:13px 26px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;cursor:pointer";
    const title = won ? (isFinal ? '👑 ALL 3 LEVELS MASTERED!' : 'MISSION ACCOMPLISHED — LEVEL '+lvl+' ✔') : 'NICE TRY! POWER UP AND TRY AGAIN';
    const sub = won ? 'REVENUE GOAL SMASHED!' : (G.happy<=0 ? 'OOPS — customers walked out' : "OOPS — the clock beat the goal");
    const btns = won
      ? (isFinal
          ? '<button onclick="boRestart()" style="'+GH+'">↺ REPLAY L3</button><button onclick="boExit()" style="'+P+'">← HUB</button>'
          : '<button onclick="boNextLevel()" style="'+P+'">LEVEL '+(lvl+1)+' ▶</button><button onclick="boRestart()" style="'+GH+'">↺ REPLAY</button><button onclick="boExit()" style="'+GH+'">← HUB</button>')
      : '<button onclick="boRestart()" style="'+P+'">↺ TRY AGAIN</button><button onclick="boExit()" style="'+GH+'">← HUB</button>';
    o.innerHTML=`<div style="max-width:430px;text-align:center;padding:34px 28px;border:1px solid ${won?'#fbbf24':'#a855f7'};border-radius:22px;background:linear-gradient(160deg,rgba(45,27,78,.97),rgba(26,16,48,.97));box-shadow:0 0 60px rgba(168,85,247,.45)">
      <div style="font-size:3rem;margin-bottom:8px">${won?(isFinal?'👑':'🏆'):'💼'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:${won?'#fbbf24':'#c084fc'};margin-bottom:6px">${title}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:8px">${sub}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:2.2rem;margin:0 0 6px;color:#fff">$${score}</h1>
      <p style="color:rgba(255,255,255,.65);margin:0 0 18px;font-size:.9rem">LEVEL ${lvl}/3 · Served ${G.served} · Lost ${G.lost} · Tips $${G.tips} · Best combo x${G.bestCombo}<br>+${earned} 🪙 earned</p>
      ${btns}
    </div>`;
  }

  // full-screen Knowledge Gate — PAUSES the game (phase!=='play' freezes update())
  // draws from THIS level's shuffled slice of 4 (G.facts); once all 4 shown,
  // gates silently skip so no tip ever repeats within or across levels
  function openGate(){
    if(!G||G.phase!=='play') return;
    if(G.gateIdx>=G.facts.length){ G.gateT=GATE_EVERY; return; }
    G.phase='gate';
    const f=G.facts[G.gateIdx]; G.gateIdx++;
    const o=document.getElementById('boGate'); if(!o){ G.phase='play'; G.gateT=GATE_EVERY; return; }
    o.style.display='flex';
    o.innerHTML=`<div style="max-width:440px;text-align:center;padding:30px 26px;border:1px solid #a855f7;border-radius:22px;background:linear-gradient(160deg,rgba(61,37,96,.97),rgba(26,16,48,.97));box-shadow:0 0 50px rgba(168,85,247,.4);animation:boGateIn .35s ease">
      <style>@keyframes boGateIn{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}</style>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.2em;color:#c084fc;margin-bottom:10px">⛩️ KNOWLEDGE GATE · BIZ TIP · LV ${LV+1}</div>
      <div style="font-size:2.4rem;margin-bottom:8px">${f[0]}</div>
      <p style="font-size:1.02rem;line-height:1.5;color:#fff;margin:0 0 18px">${f[1]}</p>
      <button onclick="boGateGo()" style="padding:13px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#a855f7,#7e22ce);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.12em;font-weight:900;cursor:pointer">GOT IT → +$120</button>
    </div>`;
  }
  window.boGateGo=function(){ if(!G)return; G.revenue+=120; G.gateT=GATE_EVERY; G.phase='play'; G.last=performance.now(); const o=document.getElementById('boGate'); if(o){o.style.display='none';o.innerHTML='';} };

  window.boRestart=function(){ if(G&&G._cleanup)G._cleanup(); const keep=G&&G.shopKey; reset(keep); ['boOver','boGate'].forEach(id=>{const o=document.getElementById(id); if(o){o.style.display='none';o.innerHTML='';}}); boBoot(); };
  // advance to the next level IN PLACE: release listeners, re-init state at
  // LV+1, refresh the level chip, then re-boot the canvas (boRestart-style) —
  // mirrors boRestart's _cleanup()-before-reset() ordering so no listeners leak
  window.boNextLevel=function(){
    if(G&&G._cleanup)G._cleanup();
    const keep=G&&G.shopKey;
    LV=Math.min(2,LV+1);
    reset(keep);
    ['boOver','boGate'].forEach(id=>{const o=document.getElementById(id); if(o){o.style.display='none';o.innerHTML='';}});
    const lt=document.getElementById('boLvl'); if(lt) lt.textContent='LV '+(LV+1)+'/3';
    boBoot();
  };
  window.boExit=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); G=null; if(window.state)state.viewingWorld=state._returnHub||'builder'; goTo('hub'); };

  // ── DEBUG HOOK (G is module-private — expose read-only state + a
  //    force-win helper for logic-level verification without a browser) ──
  window._boDbg=function(){
    return G ? { LV, phase:G.phase, revenue:G.revenue, goal:L().goal, happy:G.happy,
                  shopKey:G.shopKey, gateIdx:G.gateIdx, factsThisLevel:G.facts,
                  levelName:L().name, isFinal:LV>=2, restockCost:L().restockCost } : { LV, phase:'no-G' };
  };
  // force-win the current level instantly (test-only convenience — bypasses
  // normal play to drive LV 0→1→2 and confirm the mastered banner at LV2)
  window._boForceWin=function(){ if(!G) return false; if(G.phase==='pick') window.boPickShop('burger'); G.revenue=L().goal; G.happy=100; end(true); return true; };
})();
