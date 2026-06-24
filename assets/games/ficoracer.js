/* ════════════════════════════════════════════════════════════════
   FICO RACER — real canvas neon highway racer (CredTech Galaxy)
   Endless 3-lane runner. Your FICO SCORE (300–850) is your engine:
   grab 💳✅🪙🛡️ to raise it & go FASTER, dodge 🟥💸🚧🦹 or it drops.
   Higher FICO = more speed = more distance = more coins. Survive 75s.
   ← → / swipe to switch lanes. Loads after the main script;
   overrides the stub window.SCREENS.game_ficoracer.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='credtech', ROUND=75, GOAL_DIST=6000;
  const FICO_MIN=300, FICO_MAX=850, FICO_START=580;
  let G=null, raf=null;

  window.frInit=function(){ G=null; };  // playDistrictGame calls this before goTo

  function reset(){
    G={ phase:'play', score:0, dist:0, coins:0, time:ROUND,
        fico:FICO_START, ficoShow:FICO_START,
        lane:1, laneX:1, // current lane index 0/1/2, laneX = tweened position
        items:[], parts:[], floats:[], stars:[], dashes:[],
        spawnT:0.6, last:0, started:performance.now(),
        shake:0, flash:0, flashC:'#38bdf8', slow:0, boost:0, shield:0,
        bestFico:FICO_START, picked:0, dodged:0, hits:0, roadScroll:0 };
    // parallax stars
    for(let i=0;i<70;i++) G.stars.push({x:Math.random(),y:Math.random(),z:Math.random()*0.7+0.3,s:Math.random()*2+1});
    // road dash markers (each travels from horizon -> bottom in t 0..1)
    for(let i=0;i<10;i++) G.dashes.push(i/10);
  }

  // pickup kinds — GOOD raise FICO / score, BAD lower FICO + slow you
  const GOOD=[
    {e:'💳',kind:'good',fico:18,score:0,c:'#38bdf8',t:'+CREDIT'},   // blue credit card
    {e:'✅',kind:'good',fico:14,score:40,c:'#34d399',t:'ON-TIME!',boost:1}, // on-time payment = boost
    {e:'🪙',kind:'good',fico:4,score:60,c:'#fbbf24',t:'+COIN'},     // coin
    {e:'🛡️',kind:'good',fico:8,score:0,c:'#a78bfa',t:'PROTECTED',shield:1} // shield
  ];
  const BAD=[
    {e:'🟥',kind:'bad',fico:-26,c:'#ef4444',t:'MAXED OUT'},   // maxed card
    {e:'💸',kind:'bad',fico:-20,c:'#fb7185',t:'BNPL TRAP'},   // buy-now-pay-later
    {e:'🚧',kind:'bad',fico:-16,c:'#f59e0b',t:'HAZARD'},      // hazard
    {e:'🦹',kind:'bad',fico:-30,c:'#a855f7',t:'FRAUD!'}       // fraud
  ];

  window.SCREENS.game_ficoracer=function(){
    if(!G) reset();
    setTimeout(frBoot,30);
    return `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#0a0e27 0%,#10153a 55%,#1a1a3e 100%);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div style="position:absolute;top:0;left:0;right:0;z-index:6;display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(180deg,rgba(5,8,24,.9),transparent)">
        <button onclick="frExit()" style="padding:7px 14px;border:1px solid rgba(56,189,248,.45);border-radius:9px;background:rgba(56,189,248,.1);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← CREDTECH</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.22em;color:#38bdf8;flex:1;text-align:center;text-shadow:0 0 18px rgba(56,189,248,.6)">🏎️ FICO RACER</div>
        <div id="frTime" style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fbbf24;min-width:46px;text-align:right">${ROUND}s</div>
      </div>

      <!-- FICO gauge (the hero stat) -->
      <div style="position:absolute;top:50px;left:18px;right:18px;z-index:6">
        <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:4px">
          <span style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.18em;color:rgba(255,255,255,.6)">FICO SCORE</span>
          <span id="frFicoNum" style="font-family:'Anton',sans-serif;font-size:2rem;line-height:1;color:#fbbf24;text-shadow:0 0 22px rgba(251,191,36,.55)">${FICO_START}</span>
        </div>
        <div style="height:12px;border-radius:7px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid rgba(56,189,248,.28);position:relative">
          <div id="frFicoBar" style="height:100%;width:0%;background:linear-gradient(90deg,#ef4444,#f59e0b 38%,#fbbf24 60%,#34d399 100%);transition:width .25s,filter .25s"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.3);margin-top:2px"><span>300 POOR</span><span id="frTier" style="color:#7dd3fc">FAIR</span><span>850 EXCELLENT</span></div>
      </div>

      <!-- stat chips -->
      <div style="position:absolute;top:118px;left:0;right:0;z-index:6;display:flex;gap:8px;padding:0 18px;justify-content:center">
        ${hud('DISTANCE','frDist','#7dd3fc','m')}${hud('SCORE','frScore','#fbbf24','')}${hud('COINS','frCoins','#fcd34d','🪙')}
      </div>

      <canvas id="frCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:pointer"></canvas>

      <div id="frHint" style="position:absolute;left:0;right:0;bottom:18px;text-align:center;z-index:4;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.13em;color:rgba(255,255,255,.5);pointer-events:none;text-shadow:0 0 10px rgba(0,0,0,.8)">← → / swipe to change lanes · grab 💳✅🪙🛡️ · dodge 🟥💸🚧🦹</div>
      <div id="frOver" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(5,8,20,.84);backdrop-filter:blur(5px)"></div>
    </div>`;
  };

  function hud(label,id,c,suf){ return `<div style="flex:1;max-width:140px;text-align:center;background:rgba(56,189,248,.07);border:1px solid rgba(56,189,248,.2);border-radius:10px;padding:6px"><div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.5)">${label}</div><div style="font-family:'Anton',sans-serif;font-size:1.1rem;color:${c}"><span id="${id}">0</span><span style="font-size:.6rem;opacity:.7">${suf}</span></div></div>`; }

  function frBoot(){
    const cv=document.getElementById('frCanvas'); if(!cv){ return; }
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);

    // ---- input: lane switching ----
    function moveLane(dir){ if(G&&G.phase==='play'){ G.lane=Math.max(0,Math.min(2,G.lane+dir)); } }
    const kd=e=>{ if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') moveLane(-1); else if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') moveLane(1); };
    window.addEventListener('keydown',kd);

    // tap left/right half (desktop click + mobile tap)
    const tap=(clientX)=>{ const r=cv.getBoundingClientRect(); const rel=(clientX-r.left)/r.width; if(rel<0.4) moveLane(-1); else if(rel>0.6) moveLane(1); else moveLane(G.lane===0?1:(G.lane===2?-1:1)); };
    cv.addEventListener('click',e=>tap(e.clientX));

    // swipe (touch)
    let tsx=null,tsy=null,tmoved=false;
    cv.addEventListener('touchstart',e=>{ if(e.touches[0]){ tsx=e.touches[0].clientX; tsy=e.touches[0].clientY; tmoved=false; } },{passive:true});
    cv.addEventListener('touchmove',e=>{ if(tsx==null||!e.touches[0])return; const dx=e.touches[0].clientX-tsx, dy=e.touches[0].clientY-tsy; if(!tmoved && Math.abs(dx)>28 && Math.abs(dx)>Math.abs(dy)){ moveLane(dx>0?1:-1); tmoved=true; } e.preventDefault(); },{passive:false});
    cv.addEventListener('touchend',e=>{ if(!tmoved && tsx!=null){ const r=cv.getBoundingClientRect(); tap(tsx); } tsx=null; },{passive:true});

    G._cleanup=()=>{ window.removeEventListener('resize',size); window.removeEventListener('keydown',kd); };
    G.last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  function loop(now){
    const cv=document.getElementById('frCanvas');
    if(!cv || !G){ cancelAnimationFrame(raf); return; }   // left screen → stop
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    let dt=Math.min(40,now-G.last)/1000; G.last=now;
    if(G.phase==='play'){ update(dt,W,H); }
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  // speed factor derived from FICO (0.45 .. 1.6), minus active slowdown, plus boost
  function speedFactor(){
    const norm=(G.fico-FICO_MIN)/(FICO_MAX-FICO_MIN); // 0..1
    let s=0.45+norm*1.05;
    if(G.boost>0) s*=1.5;
    if(G.slow>0) s*=0.45;
    return s;
  }
  function ficoTier(){ const f=G.fico; if(f>=800)return['EXCELLENT','#34d399']; if(f>=740)return['VERY GOOD','#86efac']; if(f>=670)return['GOOD','#a3e635']; if(f>=580)return['FAIR','#fbbf24']; return['POOR','#f87171']; }

  function update(dt,W,H){
    // timer
    G.time-=dt; if(G.time<=0){ G.time=0; return end(); }
    const tEl=document.getElementById('frTime'); if(tEl) tEl.textContent=Math.ceil(G.time)+'s';

    const prog=1-(G.time/ROUND);       // 0..1 over the round
    const spd=speedFactor();
    const worldSpeed=(0.55+prog*0.35)*spd; // how fast objects rush at us (per sec, in t-space)

    // distance + score accrue with speed
    const dgain=worldSpeed*dt*150;
    G.dist+=dgain; G.score+=dgain*0.25;
    G.roadScroll=(G.roadScroll+worldSpeed*dt)%1;

    // smooth lane tween
    G.laneX+=(G.lane-G.laneX)*Math.min(1,dt*11);

    // animate road dashes (move toward player = increase t, wrap)
    for(let i=0;i<G.dashes.length;i++){ G.dashes[i]+=worldSpeed*dt; if(G.dashes[i]>1) G.dashes[i]-=1; }
    // parallax stars drift down slowly
    for(const st of G.stars){ st.y+=(0.02+st.z*0.05)*dt; if(st.y>1){ st.y=0; st.x=Math.random(); } }

    // ---- spawn pickups in lanes ----
    G.spawnT-=dt;
    if(G.spawnT<=0){
      G.spawnT=Math.max(0.42,0.95-prog*0.5);
      const badChance=0.34+prog*0.18;
      const isBad=Math.random()<badChance;
      const pool=isBad?BAD:GOOD;
      // weight coins/cards a bit
      let def;
      if(isBad){ def=pool[Math.floor(Math.random()*pool.length)]; }
      else { const r=Math.random(); def= r<0.34?GOOD[0]: r<0.55?GOOD[1]: r<0.85?GOOD[2]:GOOD[3]; }
      const lane=Math.floor(Math.random()*3);
      G.items.push({lane,t:-0.02,def,r:1});
      // occasionally a second item in a different lane (forces choice)
      if(prog>0.35 && Math.random()<0.4){
        let l2=(lane+1+Math.floor(Math.random()*2))%3;
        const bad2=Math.random()<badChance;
        const p2=bad2?BAD:GOOD; let d2= bad2? p2[Math.floor(Math.random()*p2.length)] : (Math.random()<0.5?GOOD[2]:GOOD[0]);
        G.items.push({lane:l2,t:-0.02-Math.random()*0.06,def:d2,r:1});
      }
    }

    // car position (player) — t≈0.86 near bottom
    const carT=0.86;
    for(const it of G.items){
      it.t+=worldSpeed*dt;
      // collision: same lane & in the car's t-band
      if(!it.dead && it.t>=carT-0.05 && it.t<=carT+0.06 && it.lane===Math.round(G.laneX)){
        const d=it.def; const fx=laneNorm(it.lane,carT);
        if(d.kind==='good'){
          applyFico(d.fico); G.score+=d.score||0; G.picked++;
          if(d.score) addCoins(Math.round(d.score/10));
          if(d.boost){ G.boost=1.4; G.flash=0.4; G.flashC='#34d399'; floatTxt(fx,carT-0.06,'BOOST!','#34d399',1); }
          if(d.shield){ G.shield=Math.max(G.shield,1); }
          if(d.e==='🪙'){ G.coins+=1; }
          burst(it.lane,carT,d.c,12);
          floatTxt(fx,carT-0.02,(d.fico>0?'+'+d.fico+' FICO':d.t),d.c);
        } else {
          if(G.shield>0){ // shield absorbs one bad hit
            G.shield=0; burst(it.lane,carT,'#a78bfa',14); floatTxt(fx,carT-0.02,'BLOCKED!','#a78bfa',1); G.flash=0.3; G.flashC='#a78bfa';
          } else {
            applyFico(d.fico); G.hits++; G.slow=0.9; G.shake=0.5; G.flash=0.4; G.flashC='#ef4444';
            burst(it.lane,carT,d.c,16);
            floatTxt(fx,carT-0.02,d.t+' '+d.fico,d.c,1);
          }
        }
        it.dead=1;
      } else if(it.t>1.08){
        if(it.def.kind==='good' && it.def.e!=='🛡️') G.dodged++; // missed a good (no penalty, just stat)
        it.dead=1;
      }
    }
    G.items=G.items.filter(i=>!i.dead);

    // timers decay
    if(G.boost>0) G.boost-=dt;
    if(G.slow>0) G.slow-=dt;
    if(G.shake>0) G.shake-=dt;
    if(G.flash>0) G.flash-=dt;
    // shield persists until used or slowly fades after 8s
    if(G.shield>0){ G.shield-=dt*0.06; if(G.shield<0)G.shield=0; }

    // particles + floats (normalized space)
    for(const p of G.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=0.9*dt; p.life-=dt; }
    G.parts=G.parts.filter(p=>p.life>0);
    for(const f of G.floats){ f.y-=dt*0.14; f.life-=dt; }
    G.floats=G.floats.filter(f=>f.life>0);

    // animate displayed fico toward real (smooth gauge)
    G.ficoShow+=(G.fico-G.ficoShow)*Math.min(1,dt*6);

    // sync HUD
    setTxt('frDist',Math.floor(G.dist));
    setTxt('frScore',Math.floor(G.score));
    setTxt('frCoins',G.coins);
    setTxt('frFicoNum',Math.round(G.ficoShow));
    const bar=document.getElementById('frFicoBar');
    if(bar){ const pct=((G.fico-FICO_MIN)/(FICO_MAX-FICO_MIN))*100; bar.style.width=pct+'%'; bar.style.filter=(G.boost>0?'brightness(1.4) drop-shadow(0 0 8px #34d399)':'none'); }
    const tier=ficoTier(); const tEl2=document.getElementById('frTier'); if(tEl2){ tEl2.textContent=tier[0]; tEl2.style.color=tier[1]; }
    const fn=document.getElementById('frFicoNum'); if(fn) fn.style.color=tier[1];

    // win condition: hit distance goal
    if(G.dist>=GOAL_DIST) return end(true);
  }

  function applyFico(d){ G.fico=Math.max(FICO_MIN,Math.min(FICO_MAX,G.fico+d)); G.bestFico=Math.max(G.bestFico,G.fico); }
  function addCoins(n){ G.coins+=n; }

  // lane center -> NORMALIZED x (0..1) at perspective depth t.
  // matches the road geometry in render(): cx=0.5, far/near half in W-fractions.
  function laneNorm(lane,t){
    const farHalf=0.045, nearHalf=0.34;
    const h=farHalf+(nearHalf-farHalf)*t;
    return 0.5+(lane-1)*h;
  }
  // car's normalized x for the current (tweened) lane
  function carNorm(){ return laneNorm(G.laneX,0.86); }

  // ─────────── RENDER ───────────
  function render(ctx,W,H,now){
    ctx.clearRect(0,0,W,H);
    let ox=0,oy=0; if(G.shake>0){ ox=(Math.random()-.5)*G.shake*24; oy=(Math.random()-.5)*G.shake*20; }
    ctx.save(); ctx.translate(ox,oy);

    const horizonY=H*0.34;
    // ---- sky glow + parallax stars ----
    const sky=ctx.createLinearGradient(0,0,0,horizonY);
    sky.addColorStop(0,'rgba(10,14,39,0)'); sky.addColorStop(1,'rgba(56,189,248,0.10)');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,horizonY);
    for(const st of G.stars){
      const sy=st.y*horizonY;
      ctx.globalAlpha=0.3+st.z*0.6; ctx.fillStyle= st.z>0.7?'#7dd3fc':'#cbd5e1';
      ctx.fillRect(st.x*W, sy, st.s, st.s);
    }
    ctx.globalAlpha=1;
    // horizon sun/grid glow
    const sun=ctx.createRadialGradient(W/2,horizonY,4,W/2,horizonY,W*0.5);
    sun.addColorStop(0,'rgba(56,189,248,0.35)'); sun.addColorStop(0.5,'rgba(129,140,248,0.12)'); sun.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=sun; ctx.fillRect(0,horizonY-H*0.2,W,H*0.4);

    // ---- pseudo-3D road ----
    const cx=W/2;
    const nearHalf=W*0.34, farHalf=W*0.045;
    const roadTop=horizonY, roadBot=H;
    // perspective helper: t 0(horizon)..1(bottom) -> y and halfWidth
    const yAt=t=> roadTop + (roadBot-roadTop)*t;
    const halfAt=t=> farHalf + (nearHalf-farHalf)*t;

    // road surface
    ctx.beginPath();
    ctx.moveTo(cx-farHalf,roadTop); ctx.lineTo(cx+farHalf,roadTop);
    ctx.lineTo(cx+nearHalf,roadBot); ctx.lineTo(cx-nearHalf,roadBot); ctx.closePath();
    const rg=ctx.createLinearGradient(0,roadTop,0,roadBot);
    rg.addColorStop(0,'#0c1230'); rg.addColorStop(1,'#161a3a');
    ctx.fillStyle=rg; ctx.fill();

    // glowing road edges
    ctx.lineWidth=3; ctx.strokeStyle='#38bdf8'; ctx.shadowColor='#38bdf8'; ctx.shadowBlur=16;
    ctx.beginPath(); ctx.moveTo(cx-farHalf,roadTop); ctx.lineTo(cx-nearHalf,roadBot); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+farHalf,roadTop); ctx.lineTo(cx+nearHalf,roadBot); ctx.stroke();
    ctx.shadowBlur=0;

    // lane divider dashes (animated, 2 dividers between 3 lanes)
    for(const dl of [-1/3,1/3]){
      for(const dt0 of G.dashes){
        const t=dt0; if(t<0.02) continue;
        const segLen=0.05+ t*0.05;
        const t2=Math.min(1,t+segLen);
        const h1=halfAt(t), h2=halfAt(t2);
        const x1=cx+dl*2*h1, x2=cx+dl*2*h2;
        const y1=yAt(t), y2=yAt(t2);
        ctx.lineWidth=1+t*4; ctx.strokeStyle='rgba(125,211,252,'+(0.25+t*0.55)+')';
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      }
    }
    // faint horizontal scan lines for speed
    ctx.strokeStyle='rgba(56,189,248,0.07)'; ctx.lineWidth=1;
    for(let i=0;i<14;i++){ let t=((i/14)+G.roadScroll)%1; const h=halfAt(t),y=yAt(t); ctx.beginPath(); ctx.moveTo(cx-h,y); ctx.lineTo(cx+h,y); ctx.stroke(); }

    // ---- items in lanes ----
    ctx.textAlign='center'; ctx.textBaseline='middle';
    // draw far->near so near overlaps
    const sorted=G.items.slice().sort((a,b)=>a.t-b.t);
    for(const it of sorted){
      const t=Math.max(0,it.t);
      const h=halfAt(t);
      const lx=cx+(it.lane-1)*h; // lane center, scaled by perspective half-width
      const y=yAt(t);
      const sz=(10+t*52);
      const d=it.def;
      ctx.shadowColor=d.c; ctx.shadowBlur=10+t*14;
      ctx.globalAlpha=Math.min(1,0.25+t*1.2);
      ctx.font=sz+'px serif';
      ctx.fillText(d.e,lx,y);
      ctx.globalAlpha=1; ctx.shadowBlur=0;
    }

    // ---- particles (behind/around car) ----
    for(const p of G.parts){ ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); }
    ctx.globalAlpha=1;

    // ---- the car ----
    const carT=0.86;
    const carH=halfAt(carT);
    const carX=cx+(G.laneX-1)*carH;
    const carY=yAt(carT);
    // motion lines streaking up behind car (faster = more)
    const spd=speedFactor();
    ctx.strokeStyle='rgba(125,211,252,'+(0.2+Math.min(0.5,spd*0.25))+')'; ctx.lineWidth=2;
    for(let i=0;i<6;i++){ const lxx=carX+(Math.random()-0.5)*50; const ly=carY-10-(Math.random()*60); ctx.beginPath(); ctx.moveTo(lxx,ly); ctx.lineTo(lxx,ly-12-spd*16); ctx.stroke(); }
    // shield ring
    if(G.shield>0){ ctx.strokeStyle='rgba(167,139,250,'+(0.4+0.3*Math.sin(now*0.01))+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(carX,carY-6,44,0,7); ctx.stroke(); }
    // boost flames glow
    if(G.boost>0){ ctx.shadowColor='#34d399'; ctx.shadowBlur=30; }
    else { ctx.shadowColor='#38bdf8'; ctx.shadowBlur=22; }
    ctx.font='62px serif'; ctx.fillText('🏎️',carX,carY); ctx.shadowBlur=0;
    if(G.boost>0){ ctx.font='28px serif'; ctx.globalAlpha=0.7+0.3*Math.sin(now*0.03); ctx.fillText('🔥',carX,carY+34); ctx.globalAlpha=1; }

    // ---- float texts ----
    for(const f of G.floats){ ctx.globalAlpha=Math.max(0,f.life/0.9); ctx.fillStyle=f.c; ctx.font='800 '+(f.big?22:15)+"px 'Inter',sans-serif"; ctx.shadowColor=f.c; ctx.shadowBlur=8; ctx.fillText(f.t,f.x*W,f.y*H); ctx.shadowBlur=0; }
    ctx.globalAlpha=1;

    // ---- screen flash on event ----
    if(G.flash>0){ ctx.fillStyle=hexA(G.flashC,G.flash*0.3); ctx.fillRect(-30,-30,W+60,H+60); }

    ctx.restore();
  }

  // ─────────── helpers ───────────
  // particles live in normalized 0..1 space (rendered at p.x*W, p.y*H) so they
  // stay aligned with the road regardless of canvas size.
  function burst(lane,t,c,n){
    const x=laneNorm(lane,t), y=t;
    for(let i=0;i<n;i++){ const a=Math.random()*7,s=0.12+Math.random()*0.4; G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.18,s:2+Math.random()*3,c,life:0.5+Math.random()*0.35,max:0.85}); } }
  function floatTxt(x,y,t,c,big){ G.floats.push({x,y,t,c,life:0.95,big:!!big}); }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
  function hexA(hex,a){ const h=hex.replace('#',''); const r=parseInt(h.substring(0,2),16),g=parseInt(h.substring(2,4),16),b=parseInt(h.substring(4,6),16); return 'rgba('+r+','+g+','+b+','+a+')'; }

  function end(win){
    if(G.phase==='over') return; G.phase='over';
    const score=Math.floor(G.score);
    if(window.state){
      state.coins=(state.coins||0)+score;
      if(window.cvAddXP) cvAddXP(Math.round(score/4),0); else if(window.cvSave) cvSave();
      state.gamesDone=state.gamesDone||{}; state.gamesDone['credtech:0']=1;
    }
    const won=win||G.dist>=GOAL_DIST;
    const tier=ficoTier();
    const o=document.getElementById('frOver'); if(!o) return; o.style.display='flex';
    o.innerHTML=`<div style="max-width:430px;text-align:center;padding:34px 28px;border:1px solid ${won?'#34d399':'#38bdf8'};border-radius:22px;background:linear-gradient(160deg,rgba(12,20,52,.97),rgba(8,12,30,.97));box-shadow:0 0 64px rgba(56,189,248,.4)">
      <div style="font-size:3rem;margin-bottom:6px">${won?'🏁':'🏎️'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:${won?'#34d399':'#38bdf8'};margin-bottom:6px">${won?'GOAL DISTANCE REACHED!':"TIME'S UP — GREAT RUN"}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.5);margin-bottom:2px">FINAL FICO</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:3rem;margin:0 0 2px;color:${tier[1]};text-shadow:0 0 26px ${tier[1]}66">${Math.round(G.fico)}</h1>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.18em;color:${tier[1]};margin-bottom:14px">${tier[0]}</div>
      <p style="color:rgba(255,255,255,.7);margin:0 0 18px;font-size:.9rem;line-height:1.5">🏁 ${Math.floor(G.dist)}m · ⭐ ${score} pts · 🪙 ${G.coins} coins<br><span style="color:rgba(255,255,255,.45);font-size:.8rem">${G.picked} good grabbed · ${G.hits} crashes · +${score} 🪙 banked</span></p>
      <button onclick="frRestart()" style="padding:13px 26px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#38bdf8,#0ea5e9);color:#04121e;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;font-weight:900;cursor:pointer;box-shadow:0 0 24px rgba(56,189,248,.5)">▶ RACE AGAIN</button>
      <button onclick="frExit()" style="padding:13px 26px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;cursor:pointer">← CREDTECH</button>
    </div>`;
  }

  window.frRestart=function(){ reset(); const o=document.getElementById('frOver'); if(o){o.style.display='none';o.innerHTML='';} frBoot(); };
  window.frExit=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); G=null; if(window.state)state.viewingWorld='credtech'; goTo('hub'); };
})();
