/* ════════════════════════════════════════════════════════════════
   COINAVERSE ARCADE ENGINE
   One canvas engine + a LIBRARY of distinct game MECHANICS. Each hub
   district gets its OWN themed game instance via window.ARCADE_CFG[id]
   = { mech, title, accent, goal, time, hint, lesson, ...mechData }.
   Routing: playDistrictGame → arcInit(id,hub,i) → goTo('game_arc').
   Mechanics implement: start(g,cfg,A) update(dt,g,cfg,A,W,H)
   render(ctx,g,cfg,A,W,H) pointer(x,y,type,g,cfg,A) key(k,down,g,cfg,A)
   The engine owns: canvas/DPR, input, loop, HUD, particles, knowledge
   gate, win/lose, coin/XP award, return-to-origin-hub, exit/restart.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const CFG  = window.ARCADE_CFG  = window.ARCADE_CFG  || {};
  const MECH = window.ARCADE_MECH = window.ARCADE_MECH || {};
  let A=null, raf=null;

  /* ── shared helpers ── */
  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function hexA(hex,a){ const h=(hex||'#60a5fa').replace('#',''); const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }
  function sprite(ctx,e,x,y,r,glow){ ctx.save(); if(glow){ctx.shadowColor=glow;ctx.shadowBlur=14;} ctx.font=(r*2)+"px serif"; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(e,x,y); ctx.restore(); }
  function lbl(ctx,t,x,y,col,size,font){ ctx.font="700 "+(size||12)+"px '"+(font||'Inter')+"',sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=col; ctx.fillText(t,x,y); }
  window.arcRR=rr; window.arcHexA=hexA; window.arcSprite=sprite; window.arcLbl=lbl;  // for mechanics

  /* ── effects API given to mechanics ── */
  function mkAPI(){
    return {
      burst(x,y,c,n){ for(let i=0;i<(n||10);i++){ const a=Math.random()*7,s=0.12+Math.random()*0.5; A.g.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.2,s:2+Math.random()*3,c,life:0.5+Math.random()*0.3,max:0.8}); } },
      ring(x,y,c){ A.g.rings.push({x,y,r:0.25,c,life:0.5}); },
      float(x,y,t,c,big){ A.g.floats.push({x,y,t,c:c||'#fde68a',life:0.95,big:!!big}); },
      flash(c){ A.g.flash=0.25; A.g.flashC=c||A.cfg.accent; },
      shake(v){ A.g.shake=Math.max(A.g.shake,v||0.4); },
      add(score,prog){ A.g.score+=score||0; if(prog) A.g.prog=Math.max(0,A.g.prog+prog); bumpStreak(A.g); },
      win(){ end(true); }, lose(){ end(false); },
      get score(){return A.g.score;}, get prog(){return A.g.prog;}
    };
  }
  // purely-cosmetic hit streak (never changes scoring/goal balance): rapid consecutive
  // add() calls build a streak; a 1.8s gap between hits resets it. Milestones fire an
  // extra celebratory burst/flash/banner so mastery feels rewarded across every mechanic.
  const STREAK_MILE=[5,10,20,35];
  function bumpStreak(g){
    const now=performance.now();
    if(g._lastHitAt!=null && now-g._lastHitAt>1800) g.streak=0;
    g._lastHitAt=now; g.streak=(g.streak||0)+1;
    if(STREAK_MILE.indexOf(g.streak)>=0){
      A.api.flash('#fde68a'); A.api.shake(.55); A.api.burst(.5,.42,'#fde68a',22);
      A.api.float(.5,.34,'🔥 '+g.streak+' STREAK!','#fde68a',true);
    }
  }

  /* ── one-time CSS ── */
  function injectCSS(){
    if(document.getElementById('arcCSS')) return;
    const s=document.createElement('style'); s.id='arcCSS'; s.textContent=`
    /* ── Stitch "Cyber-Premium Gaming HUD" design system ── */
    .arc-wrap{position:absolute;inset:0;overflow:hidden;font-family:'Inter',sans-serif;color:#e5deff;
      background:radial-gradient(130% 95% at 50% -8%,color-mix(in srgb,var(--ac) 15%,#1a1240),#130d32 44%,#0A0429 100%)}
    .arc-wrap::after{content:'';position:absolute;inset:0;z-index:6;pointer-events:none;background:linear-gradient(rgba(0,229,255,0) 50%,rgba(0,229,255,.03) 50%);background-size:100% 4px}
    .arc-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.34;mix-blend-mode:screen;filter:saturate(1.15)}
    .arc-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(120% 95% at 50% 0%,rgba(10,4,41,.12),rgba(10,4,41,.8) 82%)}
    .arc-top{position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:12px;padding:0 22px;height:60px;background:rgba(255,255,255,.045);backdrop-filter:blur(18px);border-bottom:1px solid var(--ac);box-shadow:0 0 16px color-mix(in srgb,var(--ac) 30%,transparent)}
    .arc-back{padding:8px 15px;border:1px solid color-mix(in srgb,var(--ac) 55%,transparent);background:rgba(255,255,255,.04);color:#e5deff;font:500 .58rem/1 'Orbitron',monospace;letter-spacing:.16em;cursor:pointer;clip-path:polygon(0 0,100% 0,100% 62%,90% 100%,0 100%);transition:.15s}
    .arc-back:hover{background:color-mix(in srgb,var(--ac) 22%,transparent)}
    .arc-title{flex:1;min-width:0;text-align:center;font-family:'Anton',sans-serif;font-size:1.12rem;letter-spacing:.07em;color:var(--ac);text-shadow:0 0 16px color-mix(in srgb,var(--ac) 75%,transparent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    @media (max-width:420px){.arc-title{font-size:.85rem}}
    .arc-time{min-width:56px;text-align:right;font:400 1.15rem/1 'Anton',sans-serif;color:#FBBF24;text-shadow:0 0 10px rgba(251,191,36,.55)}
    .arc-stat{position:absolute;top:66px;left:22px;right:22px;z-index:5}
    .arc-statrow{display:flex;justify-content:space-between;font:500 .55rem/1 'Orbitron',monospace;letter-spacing:.16em;color:#8aa0b0;margin-bottom:6px;text-transform:uppercase}
    .arc-statrow b{font-family:'Anton';font-weight:400;letter-spacing:.02em}
    .arc-bar{position:relative;height:13px;background:rgba(255,255,255,.05);overflow:hidden;border:1px solid color-mix(in srgb,var(--ac) 32%,transparent)}
    .arc-bar::after{content:'';position:absolute;inset:0;background-image:repeating-linear-gradient(90deg,transparent 0 10px,rgba(10,4,41,.9) 10px 12px);pointer-events:none}
    .arc-fill{height:100%;width:0%;background:linear-gradient(90deg,var(--ac),#FBBF24);box-shadow:0 0 14px color-mix(in srgb,var(--ac) 70%,transparent);transition:width .2s}
    .arc-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
    .arc-hint{position:absolute;left:0;right:0;bottom:14px;text-align:center;z-index:4;font:500 .56rem/1.4 'Orbitron',monospace;letter-spacing:.13em;color:rgba(186,201,204,.65);pointer-events:none;padding:0 16px}
    .arc-ov{position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(10,4,41,.84);backdrop-filter:blur(6px);padding:22px}
    .arc-card{max-width:440px;text-align:center;padding:30px 26px;border:1px solid var(--ac);background:linear-gradient(150deg,rgba(255,255,255,.06),rgba(19,13,50,.92));backdrop-filter:blur(20px);box-shadow:0 0 50px color-mix(in srgb,var(--ac) 38%,transparent),inset 0 1px 0 rgba(255,255,255,.12);clip-path:polygon(0 0,97% 0,100% 10%,100% 100%,3% 100%,0 90%);animation:arcIn .35s ease}
    @keyframes arcIn{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
    .arc-btn{padding:14px 30px;margin:5px;border:none;cursor:pointer;font:400 .9rem/1 'Anton',sans-serif;letter-spacing:.08em;color:#001f24;background:var(--ac);box-shadow:0 0 20px color-mix(in srgb,var(--ac) 55%,transparent);clip-path:polygon(0 0,92% 0,100% 38%,100% 100%,8% 100%,0 62%);transition:.16s}
    .arc-btn:hover{filter:brightness(1.1);box-shadow:0 0 30px color-mix(in srgb,var(--ac) 80%,transparent)}
    .arc-btn.ghost{background:transparent;color:#d0bcff;border:1px solid #8B5CF6;box-shadow:none}
    .arc-btn.ghost:hover{background:rgba(139,92,246,.18)}`;
    document.head.appendChild(s);
  }

  /* ── lifecycle ── */
  // 3-LEVEL SYSTEM: every arcade game plays L1→L2→L3. Difficulty scales via a
  // per-level working config (rcfg); question/lesson pools are PARTITIONED per
  // level so content never repeats across levels (falls back to a shuffle when
  // a pool is too small). Finite-content mechs (quiz/match) scale by time only.
  const LV_GOAL=[1,1.45,1.9], LV_TIME=[1,.92,.85], LV_TIME_FINITE=[1,.8,.66];
  const FINITE={quiz:1,match:1};
  function shuffled(arr){ const o=arr.slice(); for(let i=o.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=o[i];o[i]=o[j];o[j]=t; } return o; }
  function part(arr,lv,per){ if(!arr||!arr.length) return arr;
    const start=(lv-1)*per, out=arr.slice(start,start+per);
    return out.length?out:shuffled(arr); }
  window.arcInit = function(id,hub,idx,lv){
    const cfg=CFG[id]||{};
    if(lv==null){ const gl=(window.state&&state.gameLevels&&state.gameLevels['arc_'+id])||0; lv=Math.min(3,gl+1); }
    lv=Math.max(1,Math.min(3,lv));
    const fin=FINITE[cfg.mech];
    const rcfg=Object.assign({},cfg,{
      goal: (cfg.goal&&!fin)?Math.round(cfg.goal*LV_GOAL[lv-1]):cfg.goal,
      time: cfg.time?Math.max(25,Math.round(cfg.time*(fin?LV_TIME_FINITE:LV_TIME)[lv-1])):cfg.time,
      qs: part(cfg.qs,lv,5),
      lesson: part(cfg.lesson,lv,2),
    });
    A={ id, hub:hub||null, idx:(idx==null?0:idx), lv, cfg:rcfg, base:cfg };
  };
  window.arcNextLevel=function(){ if(!A||A.lv>=3) return; const {id,hub,idx,lv}=A; arcInit(id,hub,idx,lv+1); goTo('game_arc'); };
  window.arcDbg = function(){ return (A&&A.g)?{score:Math.round(A.g.score),prog:Math.round(A.g.prog),time:Math.round(A.g.time),phase:A.g.phase,lv:A.lv}:null; };

  window.SCREENS.game_arc = function(){
    injectCSS();
    const cfg = (A&&A.cfg)||{}; const ac = cfg.accent||'#60a5fa';
    setTimeout(boot,30);
    return `<div class="arc-wrap" style="--ac:${ac}">
      ${cfg.bg?`<div class="arc-bg" style="background-image:url('${cfg.bg}')"></div>`:''}
      <div class="arc-top">
        <button class="arc-back" onclick="arcExit()">← ${cfg.hubName||'HUB'}</button>
        <div class="arc-title">${cfg.icon||'🎮'} ${cfg.title||'MINI-GAME'} <span style="font:700 .5rem/1 'Orbitron',sans-serif;letter-spacing:.14em;color:var(--ac);border:1px solid var(--ac);border-radius:6px;padding:3px 7px;margin-left:6px;vertical-align:2px">LV ${(A&&A.lv)||1}/3</span></div>
        <button class="arc-back" onclick="arcShowHelp()" title="How to play" style="padding:8px 12px">❓</button>
        <div class="arc-time" id="arcTime">${cfg.time||60}s</div>
      </div>
      <div class="arc-stat">
        <div class="arc-statrow"><span id="arcScoreL">SCORE <b id="arcScore" style="color:#fff">0</b></span><span id="arcGoalL">${cfg.goalLabel||'GOAL'} <b id="arcGoalTxt" style="color:var(--ac)">0 / ${cfg.goal||100}</b></span></div>
        <div class="arc-bar"><div class="arc-fill" id="arcFill"></div></div>
      </div>
      <canvas id="arcCv" class="arc-canvas"></canvas>
      <div class="arc-hint" id="arcHint">${cfg.hint||''}</div>
      <div class="arc-ov" id="arcGate"></div>
      <div class="arc-ov" id="arcOver"></div>
      <div class="arc-ov" id="arcHow" style="display:flex"></div>
    </div>`;
  };

  /* ── HOW TO PLAY — per-mechanic controls, shown before every level starts ── */
  const MECH_HOWTO = {
    catch:  '🖐️ MOVE to CATCH the good icons and DODGE the bad ones. Drag, tap a side, or use ← →.',
    lane:   '🚗 STEER between lanes to grab good items and swerve around bad ones. Drag or ← →.',
    tap:    '👆 TAP the right items the moment they appear, before time runs out.',
    quiz:   '🧠 Read each question, then TAP the answer you think is correct.',
    sort:   '📦 SORT every item into the correct bin — drag it, or tap a bin to send it there.',
    stack:  '🧱 TAP to drop each piece right when it lines up with the one below. A clean hit keeps your stack wide — a sloppy one shaves it thinner, so it gets harder to hit next time.',
    match:  '🃏 Flip two cards at a time and MATCH the pairs before time runs out.',
    balance:'⚖️ Keep the meter balanced — nudge it left or right before it tips too far.',
    aim:    '🎯 AIM carefully, then tap/click to launch at the right target.',
    grow:   '🌱 Make smart picks each round to GROW your total before time runs out.',
  };
  function howToBody(mode){   // mode: 'start' (first entry) | 'resume' (❓ button mid-play)
    const cfg=A.cfg, resume=mode==='resume';
    return `<div class="arc-card" style="max-width:460px">
      <div style="font:700 .5rem/1 'Orbitron',sans-serif;letter-spacing:.2em;color:var(--ac);margin-bottom:10px">HOW TO PLAY</div>
      <div style="font-size:2rem;margin-bottom:6px">${cfg.icon||'🎮'}</div>
      <div style="font-family:'Anton',sans-serif;font-size:1.15rem;margin-bottom:4px">${cfg.title||'MINI-GAME'}</div>
      <div style="font:700 .48rem/1 'Orbitron',sans-serif;letter-spacing:.16em;color:var(--ac);margin-bottom:14px">LEVEL ${A.lv}/3${A.lv>1?' · HARDER':''}</div>
      <p style="font-size:.92rem;line-height:1.55;margin:0 0 12px">${MECH_HOWTO[cfg.mech]||'Play the mission before time runs out!'}</p>
      <p style="font-size:.8rem;line-height:1.5;margin:0 0 10px;color:rgba(255,255,255,.7)">🎯 Goal: reach <b style="color:var(--ac)">${cfg.goal||100}</b> ${(cfg.goalLabel||'points').toLowerCase()} in <b style="color:#FBBF24">${cfg.time||60}s</b>.</p>
      ${cfg.lesson&&cfg.lesson.length?`<p style="font-size:.78rem;line-height:1.5;margin:0 0 16px;color:rgba(255,255,255,.55)">💡 Along the way, quick facts will pop up — tap GOT IT to keep going.</p>`:''}
      <button class="arc-btn" onclick="arcCloseHowTo()">${resume?'▶ RESUME':'▶ START'}</button>
    </div>`;
  }
  function showHowTo(mode){ const o=document.getElementById('arcHow'); if(!o) return; o.style.display='flex'; o.innerHTML=howToBody(mode||'start'); }
  window.arcShowHelp=function(){ if(!A||!A.g) return; if(A.g.phase==='play') A.g.phase='how'; showHowTo('resume'); };
  // loop() keeps rendering/ticking raf while paused (phase!=='play') — same trick the
  // knowledge gate already relies on — so resuming is just a phase flip + dt reset.
  window.arcCloseHowTo=function(){ const o=document.getElementById('arcHow'); if(o){o.style.display='none';o.innerHTML='';} if(A&&A.g){ A.g.phase='play'; A.g.last=performance.now(); } };

  function reset(){
    const cfg=A.cfg;
    A.g={ phase:'play', score:0, prog:0, time:cfg.time||60, last:0,
          gateT:(cfg.gateEvery||16), gateIdx:0, parts:[], floats:[], rings:[],
          shake:0, flash:0, flashC:cfg.accent, m:{} };   // m = mechanic scratch
    A.api=mkAPI();
    const mech=MECH[cfg.mech]; if(mech&&mech.start) mech.start(A.g,cfg,A.api);
  }

  function boot(){
    const cv=document.getElementById('arcCv'); if(!cv){ return; }
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);
    reset();
    A.g.phase='how';   // pause on the tutorial until the player taps START
    const mech=MECH[A.cfg.mech]||{};
    const rect=()=>cv.getBoundingClientRect();
    const norm=(cx,cy)=>{ const r=rect(); return [ (cx-r.left)/r.width, (cy-r.top)/r.height ]; };
    const pdown=(cx,cy)=>{ if(A.g.phase!=='play')return; const [x,y]=norm(cx,cy); A.g.ptr={x,y,down:true}; if(mech.pointer)mech.pointer(x,y,'down',A.g,A.cfg,A.api); };
    const pmove=(cx,cy)=>{ if(A.g.phase!=='play'||!A.g.ptr)return; const [x,y]=norm(cx,cy); A.g.ptr.x=x;A.g.ptr.y=y; if(mech.pointer)mech.pointer(x,y,'move',A.g,A.cfg,A.api); };
    const pup=(cx,cy)=>{ if(A.g.phase!=='play')return; const [x,y]=norm(cx,cy); if(mech.pointer)mech.pointer(x,y,'up',A.g,A.cfg,A.api); if(A.g.ptr)A.g.ptr.down=false; };
    const md=e=>pdown(e.clientX,e.clientY), mm=e=>pmove(e.clientX,e.clientY), mu=e=>pup(e.clientX,e.clientY);
    const td=e=>{ if(e.touches[0]){pdown(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();} };
    const tm=e=>{ if(e.touches[0]){pmove(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();} };
    const tu=e=>{ const t=e.changedTouches&&e.changedTouches[0]; pup(t?t.clientX:0,t?t.clientY:0); e.preventDefault(); };
    const kd=e=>{ if(A.g.phase!=='play')return; if(mech.key)mech.key(e.key,true,A.g,A.cfg,A.api); if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(e.key)>=0)e.preventDefault(); };
    const ku=e=>{ if(mech.key)mech.key(e.key,false,A.g,A.cfg,A.api); };
    cv.addEventListener('mousedown',md); window.addEventListener('mousemove',mm); window.addEventListener('mouseup',mu);
    cv.addEventListener('touchstart',td,{passive:false}); cv.addEventListener('touchmove',tm,{passive:false}); cv.addEventListener('touchend',tu,{passive:false});
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
    A._cleanup=()=>{ window.removeEventListener('resize',size); window.removeEventListener('mousemove',mm); window.removeEventListener('mouseup',mu); window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku); cv.removeEventListener('mousedown',md); cv.removeEventListener('touchstart',td); cv.removeEventListener('touchmove',tm); cv.removeEventListener('touchend',tu); };
    A.g.last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
    showHowTo('start');
  }

  function loop(now){
    const cv=document.getElementById('arcCv');
    if(!cv||!A||!A.g){ cancelAnimationFrame(raf); return; }
    const ctx=cv.getContext('2d'), W=cv.clientWidth, H=cv.clientHeight, g=A.g, cfg=A.cfg, mech=MECH[cfg.mech]||{};
    let dt=Math.min(40,now-g.last)/1000; g.last=now;
    if(g.phase==='play'){
      if(cfg.time){ g.time-=dt; if(g.time<=0){ g.time=0; return end(g.prog>=(cfg.goal||1e9)); } const te=document.getElementById('arcTime'); if(te)te.textContent=Math.ceil(g.time)+'s'; }
      if(cfg.lesson&&cfg.lesson.length){ g.gateT-=dt; if(g.gateT<=0){ return openGate(); } }
      if(mech.update) mech.update(dt,g,cfg,A.api,W,H);
      // shared effects
      for(const p of g.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=1.3*dt; p.life-=dt; } g.parts=g.parts.filter(p=>p.life>0);
      for(const f of g.floats){ f.y-=dt*0.12; f.life-=dt; } g.floats=g.floats.filter(f=>f.life>0);
      for(const r of g.rings){ r.r+=dt*1.9; r.life-=dt; } g.rings=g.rings.filter(r=>r.life>0);
      if(g.shake>0)g.shake-=dt*1.6; if(g.flash>0)g.flash-=dt;
      // HUD
      setTxt('arcScore',Math.round(g.score));
      const f=document.getElementById('arcFill'); if(f)f.style.width=Math.min(100,g.prog/(cfg.goal||100)*100)+'%';
      setTxt('arcGoalTxt',Math.round(g.prog)+' / '+(cfg.goal||100));
      if(cfg.goal&&g.prog>=cfg.goal) return end(true);
    }
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  function render(ctx,W,H,now){
    const g=A.g, cfg=A.cfg, mech=MECH[cfg.mech]||{};
    ctx.clearRect(0,0,W,H);
    let ox=0,oy=0; if(g.shake>0){ ox=(Math.random()-.5)*g.shake*20; oy=(Math.random()-.5)*g.shake*20; }
    ctx.save(); ctx.translate(ox,oy);
    // ambient starfield + soft drifting glow orbs — keeps the scene feeling alive
    // between spawns instead of a static void, purely cosmetic (no gameplay effect)
    ctx.fillStyle=hexA(cfg.accent||'#60a5fa',.5);
    for(let i=0;i<64;i++){ const sx=(i*47.7%W), sy=((i*97.3+now*0.014*((i%4)+1))%H); ctx.globalAlpha=0.08+(i%5)*0.045; ctx.fillRect(sx,sy,1+(i%3),1+(i%3)); }
    ctx.globalAlpha=1;
    for(let i=0;i<3;i++){ const ox2=W*(.2+i*.32), oy2=H*(.25+((i*137)%40)/100)+Math.sin(now*0.00025+i*2)*H*.05, r=W*(.09+i%2*.03);
      const gr=ctx.createRadialGradient(ox2,oy2,0,ox2,oy2,r); gr.addColorStop(0,hexA(cfg.accent,.07)); gr.addColorStop(1,hexA(cfg.accent,0));
      ctx.fillStyle=gr; ctx.fillRect(ox2-r,oy2-r,r*2,r*2); }
    ctx.globalAlpha=1;
    if(g.flash>0){ ctx.fillStyle=hexA(g.flashC,g.flash*0.22); ctx.fillRect(0,0,W,H); }
    if(mech.render) mech.render(ctx,g,cfg,A.api,W,H);
    // particles / rings / floats
    for(const p of g.parts){ ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); }
    ctx.globalAlpha=1;
    for(const r of g.rings){ ctx.globalAlpha=Math.max(0,r.life/0.5); ctx.strokeStyle=r.c; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(r.x*W,r.y*H,r.r*W*0.12,0,7); ctx.stroke(); }
    ctx.globalAlpha=1;
    ctx.textAlign='center';
    for(const f of g.floats){ ctx.globalAlpha=Math.max(0,f.life/0.95); ctx.fillStyle=f.c; ctx.font='800 '+(f.big?22:14)+"px 'Inter',sans-serif"; ctx.fillText(f.t,f.x*W,f.y*H); }
    ctx.globalAlpha=1;
    ctx.restore();
  }

  function setTxt(id,v){ const el=document.getElementById(id); if(el)el.textContent=v; }

  /* ── knowledge gate ── */
  function openGate(){
    const g=A.g,cfg=A.cfg; if(g.phase!=='play')return; g.phase='gate';
    const f=cfg.lesson[g.gateIdx%cfg.lesson.length]; g.gateIdx++;
    const o=document.getElementById('arcGate'); if(!o){ g.phase='play'; g.gateT=cfg.gateEvery||16; return; }
    o.style.display='flex';
    o.innerHTML=`<div class="arc-card">
      <div style="font:700 .5rem/1 'Orbitron',sans-serif;letter-spacing:.2em;color:var(--ac);margin-bottom:10px">★ DID YOU KNOW?</div>
      <div style="font-size:2.4rem;margin-bottom:8px">${f[0]}</div>
      <p style="font-size:1.02rem;line-height:1.5;margin:0 0 18px">${f[1]}</p>
      <button class="arc-btn" onclick="arcGateGo()">GOT IT →</button></div>`;
  }
  window.arcGateGo=function(){ const g=A&&A.g; if(!g)return; g.score+=30; g.gateT=A.cfg.gateEvery||16; g.phase='play'; const o=document.getElementById('arcGate'); if(o){o.style.display='none';o.innerHTML='';} g.last=performance.now(); g.flash=0.25; };

  /* ── end / award ── */
  function end(win){
    const g=A.g,cfg=A.cfg; if(g.phase==='over')return; g.phase='over';
    const score=Math.round(g.score);
    if(window.state){
      state.coins=(state.coins||0)+score; if(window.cvAddXP)cvAddXP(Math.round(score/4),0);
      state.gamesDone=state.gamesDone||{}; if(A.hub!=null)state.gamesDone[A.hub+':'+A.idx]=1;
      if(win){ state.gameLevels=state.gameLevels||{}; const k='arc_'+A.id;
        if((state.gameLevels[k]||0)<A.lv) state.gameLevels[k]=A.lv; }
      if(window.cvSave)cvSave();
    }
    const o=document.getElementById('arcOver'); if(!o)return; o.style.display='flex';
    const mastered=win&&A.lv>=3;
    o.innerHTML=`<div class="arc-card">
      <div style="font-size:3rem;margin-bottom:6px">${mastered?'👑':win?'🏆':'⏱'}</div>
      <div style="font:700 .58rem/1 'Orbitron',sans-serif;letter-spacing:.2em;color:var(--ac);margin-bottom:8px">${mastered?'ALL 3 LEVELS MASTERED!':win?('LEVEL '+A.lv+' — '+(cfg.winMsg||'MISSION COMPLETE!')):"TIME'S UP — LEVEL "+A.lv}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:2rem;margin:0 0 6px">${score} pts</h1>
      <p style="color:rgba(255,255,255,.65);margin:0 0 16px;font-size:.9rem">${win?'Goal reached':'Goal '+Math.round(g.prog)+'/'+(cfg.goal||0)} · +${score} 🪙${mastered?' · You beat every level of this game!':''}</p>
      ${win&&A.lv<3?`<button class="arc-btn" onclick="arcNextLevel()">LEVEL ${A.lv+1} ▶</button>
      <button class="arc-btn ghost" onclick="arcRestart()">↺ REPLAY LV ${A.lv}</button>`
      :`<button class="arc-btn" onclick="arcRestart()">▶ PLAY AGAIN</button>`}
      <button class="arc-btn ghost" onclick="arcExit()">← HUB</button></div>`;
  }

  window.arcRestart=function(){ ['arcGate','arcOver'].forEach(id=>{const o=document.getElementById(id);if(o){o.style.display='none';o.innerHTML='';}}); reset(); A.g.last=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop); };
  window.arcExit=function(){ if(A&&A._cleanup)A._cleanup(); cancelAnimationFrame(raf); const hub=(window.state&&state._returnHub)||A.hub||'guardian'; A=null; if(window.state)state.viewingWorld=hub; goTo('hub'); };

  /* ════════════════════════════════════════════════════════════════
     MECHANICS LIBRARY — each a distinct, real, playable game.
     ════════════════════════════════════════════════════════════════ */

  // 1 ── CATCH: move catcher, grab GOOD, dodge BAD ──────────────────
  MECH.catch={ start(g,cfg){ g.m={x:0.5,items:[],t:0}; },
    update(dt,g,cfg,A,W,H){ const m=g.m; const pr=1-(cfg.time?g.time/cfg.time:0.5);
      if(g.ptr)m.x=g.ptr.x; if(g.kL)m.x-=dt*1.3; if(g.kR)m.x+=dt*1.3; m.x=Math.max(.06,Math.min(.94,m.x));
      m.t-=dt; if(m.t<=0){ m.t=Math.max(.28,.62-pr*.32); const bad=Math.random()<(cfg.badRate||.3);
        const arr=bad?(cfg.bad||['💸']):(cfg.good||['🪙']); m.items.push({x:Math.random()*.86+.07,y:-.05,vy:.32+pr*.4+Math.random()*.2,e:arr[Math.floor(Math.random()*arr.length)],bad}); }
      for(const it of m.items){ it.y+=it.vy*dt;
        if(it.y>.84&&!it.done&&Math.abs(it.x-m.x)<.09){ it.done=1; if(it.bad){ g.score=Math.max(0,g.score-8); A.shake(.4); A.burst(it.x,.84,'#f87171',9); A.float(it.x,.8,'-8','#fca5a5'); } else { const v=cfg.pts||12; A.add(v,v); A.burst(it.x,.84,cfg.accent,10); A.ring(it.x,.84,cfg.accent); A.float(it.x,.8,'+'+v); A.flash(); } }
        if(it.y>1.02)it.done=1; }
      m.items=m.items.filter(i=>!i.done); },
    render(ctx,g,cfg,A,W,H){ for(const it of g.m.items) sprite(ctx,it.e,it.x*W,it.y*H,it.bad?20:21,it.bad?'#f87171':cfg.accent);
      const px=g.m.x*W,py=.86*H; sprite(ctx,cfg.player||'🧺',px,py,26,cfg.accent); },
    key(k,d,g){ if(k==='ArrowLeft')g.kL=d; if(k==='ArrowRight')g.kR=d; } };

  // 2 ── LANE: 3-lane runner, switch lanes, grab coins / dodge ──────
  MECH.lane={ start(g,cfg){ g.m={lane:1,obs:[],t:0,sw:0}; },
    update(dt,g,cfg,A,W,H){ const m=g.m; const pr=1-(cfg.time?g.time/cfg.time:.5);
      if(m.sw>0)m.sw-=dt;
      m.t-=dt; if(m.t<=0){ m.t=Math.max(.32,.66-pr*.34); const L=Math.floor(Math.random()*3); const bad=Math.random()<(cfg.badRate||.45);
        m.obs.push({lane:L,y:-.06,vy:.5+pr*.5,e:bad?(cfg.bad||['🚧'])[0]:(cfg.good||['🪙'])[0],bad}); }
      for(const o of m.obs){ o.y+=o.vy*dt;
        if(o.y>.78&&o.y<.92&&!o.done&&o.lane===m.lane){ o.done=1; if(o.bad){ g.score=Math.max(0,g.score-10); A.shake(.5); A.burst([.2,.5,.8][o.lane],.84,'#f87171',10);} else { const v=cfg.pts||14; A.add(v,v); A.ring([.2,.5,.8][o.lane],.84,cfg.accent); A.float([.2,.5,.8][o.lane],.8,'+'+v);} }
        if(o.y>1.05)o.done=1; }
      m.obs=m.obs.filter(o=>!o.done); },
    render(ctx,g,cfg,A,W,H){ const lx=[.2,.5,.8]; ctx.strokeStyle=hexA(cfg.accent,.18); ctx.lineWidth=2;
      lx.forEach(x=>{ctx.beginPath();ctx.moveTo(x*W,.1*H);ctx.lineTo(x*W,H);ctx.stroke();});
      for(const o of g.m.obs) sprite(ctx,o.e,lx[o.lane]*W,o.y*H,21,o.bad?'#f87171':cfg.accent);
      sprite(ctx,cfg.player||'🚀',lx[g.m.lane]*W,.85*H,26,cfg.accent); },
    pointer(x,y,t,g){ if(t==='down'){ g.m.lane=x<.34?0:x<.67?1:2; } },
    key(k,d,g){ if(d&&k==='ArrowLeft')g.m.lane=Math.max(0,g.m.lane-1); if(d&&k==='ArrowRight')g.m.lane=Math.min(2,g.m.lane+1); } };

  // 3 ── TAP: targets pop up, tap GOOD fast, avoid BAD ──────────────
  MECH.tap={ start(g,cfg){ g.m={tg:[],t:0}; },
    update(dt,g,cfg,A,W,H){ const m=g.m; const pr=1-(cfg.time?g.time/cfg.time:.5);
      m.t-=dt; if(m.t<=0){ m.t=Math.max(.26,.58-pr*.32); const bad=Math.random()<(cfg.badRate||.3);
        const arr=bad?(cfg.bad||['💣']):(cfg.good||['💰']); m.tg.push({x:.12+Math.random()*.76,y:.24+Math.random()*.6,e:arr[Math.floor(Math.random()*arr.length)],bad,life:1.1+Math.random()*.5,born:.0,s:0}); }
      for(const t of m.tg){ t.life-=dt; t.s=Math.min(1,t.s+dt*5); if(t.life<=0&&!t.bad){ t.dead=1; } if(t.life<=0)t.dead=1; }
      m.tg=m.tg.filter(t=>!t.dead); },
    render(ctx,g,cfg,A,W,H){ for(const t of g.m.tg){ const r=(22+(t.bad?2:0))*t.s; sprite(ctx,t.e,t.x*W,t.y*H,r,t.bad?'#f87171':cfg.accent);
        ctx.globalAlpha=.5; ctx.strokeStyle=t.bad?'#f87171':cfg.accent; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(t.x*W,t.y*H,r*1.5*Math.max(.2,t.life),0,7); ctx.stroke(); ctx.globalAlpha=1; } },
    pointer(x,y,type,g,cfg,A){ if(type!=='down')return; for(const t of g.m.tg){ if(t.dead)continue; if(Math.hypot((t.x-x),(t.y-y)*1)<.07){ t.dead=1; if(t.bad){ g.score=Math.max(0,g.score-10); A.shake(.4); A.burst(t.x,t.y,'#f87171',9);} else { const v=cfg.pts||14; A.add(v,v); A.burst(t.x,t.y,cfg.accent,11); A.ring(t.x,t.y,cfg.accent); A.float(t.x,t.y-.04,'+'+v);} return; } } } };

  // 4 ── QUIZ: question + 3 options, tap/key correct ────────────────
  MECH.quiz={ start(g,cfg){ g.m={i:0,fb:0,fbC:0}; },
    update(dt,g,cfg,A){ const m=g.m; if(m.fb>0){ m.fb-=dt; if(m.fb<=0){ m.i++; if(m.i>=(cfg.qs||[]).length)m.i=0; } } },
    render(ctx,g,cfg,A,W,H){ const qs=cfg.qs||[]; if(!qs.length)return; const q=qs[g.m.i%qs.length];
      lbl(ctx,'QUESTION '+((g.m.i%qs.length)+1)+' / '+qs.length, W/2,.16*H, hexA(cfg.accent,.8),11,'Orbitron');
      // wrap question
      ctx.fillStyle='#fff'; ctx.font="700 "+Math.min(26,W/22)+"px 'Inter',sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle';
      wrap(ctx,q.q,W/2,.27*H,W*.84,30);
      const n=q.a.length, bw=Math.min(W*.8,520), bh=54, gap=14, x0=W/2-bw/2, y0=.46*H;
      g.m.boxes=[]; for(let i=0;i<n;i++){ const by=y0+i*(bh+gap); const hit=g.m.fb>0&&g.m.fbC===i; const ok=g.m.fb>0&&i===q.c;
        rr(ctx,x0,by,bw,bh,12); ctx.fillStyle= ok?'rgba(34,197,94,.35)':(hit?'rgba(248,113,113,.35)':hexA(cfg.accent,.12)); ctx.fill();
        ctx.strokeStyle= ok?'#22c55e':(hit?'#f87171':hexA(cfg.accent,.6)); ctx.lineWidth=2; ctx.stroke();
        lbl(ctx,q.a[i],W/2,by+bh/2,'#fff',Math.min(17,W/30),'Inter'); g.m.boxes.push({x:x0,y:by,w:bw,h:bh,i}); } },
    pointer(x,y,type,g,cfg,A,W,H){ if(type!=='down'||g.m.fb>0)return; const qs=cfg.qs||[]; const q=qs[g.m.i%qs.length]; const cv=document.getElementById('arcCv'); const cw=cv.clientWidth,ch=cv.clientHeight;
      for(const b of (g.m.boxes||[])){ if(x*cw>=b.x&&x*cw<=b.x+b.w&&y*ch>=b.y&&y*ch<=b.y+b.h){ pick(b.i,q,g,cfg,A); return; } } },
    key(k,d,g,cfg,A){ if(!d)return; const qs=cfg.qs||[]; const q=qs[g.m.i%qs.length]; const n=parseInt(k,10); if(n>=1&&n<=q.a.length&&g.m.fb<=0)pick(n-1,q,g,cfg,A); } };
  function pick(i,q,g,cfg,A){ g.m.fb=.9; g.m.fbC=i; if(i===q.c){ const v=cfg.pts||34; A.add(v,v); A.float(.5,.4,'CORRECT +'+v,'#86efac',true); A.flash('#22c55e'); } else { g.score=Math.max(0,g.score-6); A.shake(.4); A.float(.5,.4,'Try again!','#fca5a5'); } }

  // 5 ── SORT: item falls, send LEFT or RIGHT by its category ───────
  MECH.sort={ start(g,cfg){ g.m={it:null,t:0,trail:[]}; },
    update(dt,g,cfg,A,W,H){ const m=g.m; const pr=1-(cfg.time?g.time/cfg.time:.5);
      if(!m.it){ m.t-=dt; if(m.t<=0){ const pool=cfg.items||[]; const p=pool[Math.floor(Math.random()*pool.length)]; m.it={e:p[0],t:p[1],side:p[2],x:.5,y:.34}; } }
      else { m.it.y+=(.14+pr*.1)*dt; m.trail.push({x:m.it.x,y:m.it.y,life:.4}); if(m.it.y>.58){ resolveSort(m.it.side,g,cfg,A); m.it=null; m.t=.2; } }
      for(const t of m.trail)t.life-=dt; m.trail=m.trail.filter(t=>t.life>0); },
    render(ctx,g,cfg,A,W,H){ const L=cfg.left||['NEED','#34d399'],R=cfg.right||['WANT','#f472b6'];
      for(const t of g.m.trail){ ctx.globalAlpha=Math.max(0,t.life/.4)*.35; sprite(ctx,g.m.it?g.m.it.e:'',t.x*W,t.y*H,14); } ctx.globalAlpha=1;
      rr(ctx,W*.04,H*.58,W*.4,H*.22,14); ctx.fillStyle=hexA(L[1],.14); ctx.fill(); ctx.strokeStyle=L[1]; ctx.lineWidth=2; ctx.stroke(); lbl(ctx,'◀ '+L[0],W*.24,H*.69,L[1],15,'Orbitron');
      rr(ctx,W*.56,H*.58,W*.4,H*.22,14); ctx.fillStyle=hexA(R[1],.14); ctx.fill(); ctx.strokeStyle=R[1]; ctx.lineWidth=2; ctx.stroke(); lbl(ctx,R[0]+' ▶',W*.76,H*.69,R[1],15,'Orbitron');
      const it=g.m.it; if(it){ sprite(ctx,it.e,it.x*W,it.y*H,24,cfg.accent); lbl(ctx,it.t,it.x*W,it.y*H+34,'#fff',12,'Inter'); } },
    pointer(x,y,type,g,cfg,A){ if(type==='down'&&g.m.it){ resolveSort(g.m.it.side, g, cfg, A, x<.5?0:1); g.m.it=null; g.m.t=.2; } },
    key(k,d,g,cfg,A){ if(d&&g.m.it){ if(k==='ArrowLeft'){resolveSort(g.m.it.side,g,cfg,A,0);g.m.it=null;g.m.t=.2;} if(k==='ArrowRight'){resolveSort(g.m.it.side,g,cfg,A,1);g.m.it=null;g.m.t=.2;} } } };
  function resolveSort(side,g,cfg,A,chosen){ const ok= chosen==null? false : (side===chosen); if(chosen==null){ return; } if(ok){ const v=cfg.pts||16; A.add(v,v); A.burst(.5,.5,cfg.accent,9); A.float(.5,.45,'+'+v); A.flash(); } else { g.score=Math.max(0,g.score-8); A.shake(.4); A.float(.5,.45,'Oops — wrong bin','#fca5a5'); } }

  // 6 ── STACK: moving block, tap to drop, build the tower ──────────
  // All vertical layout (block height, camera scroll, fall animation) is computed
  // HERE from H alone, in one place — a previous version derived the drop target in
  // normalized 0-1 units while render() used capped pixel units, so the two drifted
  // apart on any screen taller than ~485px and the falling block visibly landed off
  // from the tower. Drop resolution now runs on a fixed timer instead of comparing
  // positions, so it can't reintroduce that kind of unit mismatch.
  const STACK_DROP_DUR=0.22;
  function stackBH(H){ return Math.min(34,H*.07); }
  // keep the active build zone from climbing above ~22% of the canvas as the tower grows
  function stackCam(m,bh,baseY,H){ const topY=baseY-(m.blocks.length+1)*bh; const limit=H*0.22; return topY<limit?(limit-topY):0; }
  MECH.stack={ start(g,cfg){ g.m={blocks:[{x:.5,w:.34}],bx:.1,dir:1,w:.34,drop:null}; },
    update(dt,g,cfg,A,W,H){ const m=g.m; const sp=.5+g.prog/(cfg.goal||100)*.4; m.bx+=m.dir*sp*dt; if(m.bx<.06){m.bx=.06;m.dir=1;} if(m.bx>.94-m.w){m.bx=.94-m.w;m.dir=-1;}
      if(m.drop!=null){ m.drop.t+=dt; if(m.drop.t>=STACK_DROP_DUR){ const top=m.blocks[m.blocks.length-1]; const ov=overlap(m.drop.x,m.w,top.x,top.w); if(ov<=0){ A.shake(.5); g.score=Math.max(0,g.score-6); A.float(.5,.4,'Missed!','#fca5a5'); } else { m.w=ov; m.blocks.push({x:m.drop.cx,w:ov}); const v=cfg.pts||18; A.add(v,v); A.float(m.drop.cx,.4,'+'+v); A.flash(); A.ring(m.drop.cx,.5,cfg.accent); } m.drop=null; } } },
    render(ctx,g,cfg,A,W,H){ const bh=stackBH(H); const baseY=H*.92; const m=g.m; const cam=stackCam(m,bh,baseY,H);
      m.blocks.forEach((b,i)=>{ const y=baseY-(i+1)*bh+cam; rr(ctx,(b.x-b.w/2)*W, y, b.w*W, bh-3, 6); ctx.fillStyle=hexA(cfg.accent,.55); ctx.fill(); ctx.strokeStyle=cfg.accent; ctx.lineWidth=1.5; ctx.stroke(); });
      const topY=baseY-(m.blocks.length+1)*bh+cam;
      if(m.drop==null){ rr(ctx,m.bx*W, topY, m.w*W, bh-3, 6); ctx.fillStyle=hexA('#fde68a',.6); ctx.fill(); ctx.strokeStyle='#fde68a'; ctx.lineWidth=2; ctx.stroke(); }
      else { const p=Math.min(1,m.drop.t/STACK_DROP_DUR), y=topY-bh*7*(1-p); rr(ctx,(m.drop.cx-m.w/2)*W, y, m.w*W, bh-3, 6); ctx.fillStyle=hexA('#fde68a',.6); ctx.fill(); ctx.strokeStyle='#fde68a'; ctx.lineWidth=2; ctx.stroke(); }
      lbl(ctx,(cfg.stackLabel||'STACK IT'),W/2,H*.14,'#fff',13,'Orbitron'); },
    pointer(x,y,type,g,cfg,A){ if(type==='down')dropBlock(g); },
    key(k,d,g){ if(d&&(k===' '||k==='ArrowDown'))dropBlock(g); } };
  function overlap(x1,w1,x2,w2){ const l=Math.max(x1-w1/2,x2-w2/2),r=Math.min(x1+w1/2,x2+w2/2); return Math.max(0,r-l); }
  function dropBlock(g){ const m=g.m; if(m.drop!=null)return; m.drop={x:m.bx,cx:m.bx+m.w/2,t:0}; }

  // 7 ── MATCH: memory grid, flip pairs ─────────────────────────────
  MECH.match={ start(g,cfg){ const ps=(cfg.pairs||['🪙','💎','💰','🏦']).slice(0,6); let deck=ps.concat(ps); for(let i=deck.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=deck[i];deck[i]=deck[j];deck[j]=t; } g.m={cards:deck.map(e=>({e,up:false,done:false})),sel:[],lock:0,cols:Math.ceil(deck.length/3)}; },
    update(dt,g,cfg,A){ const m=g.m; if(m.lock>0){ m.lock-=dt; if(m.lock<=0){ const[a,b]=m.sel; if(m.cards[a].e===m.cards[b].e){ m.cards[a].done=m.cards[b].done=true; const v=cfg.pts||26; A.add(v,v); A.float(.5,.4,'PAIR +'+v,'#86efac',true); A.flash(); if(m.cards.every(c=>c.done))A.win(); } else { m.cards[a].up=m.cards[b].up=false; A.shake(.3); } m.sel=[]; } } },
    render(ctx,g,cfg,A,W,H){ const m=g.m,cols=m.cols,rows=Math.ceil(m.cards.length/cols); const cw=Math.min(W*.8/cols,H*.62/rows), gap=cw*.12, gw=cols*cw+(cols-1)*gap, x0=W/2-gw/2, y0=H*.26; m.geo={cw,gap,x0,y0,cols};
      m.cards.forEach((c,i)=>{ const cx=x0+(i%cols)*(cw+gap), cy=y0+Math.floor(i/cols)*(cw+gap); if(c.done){ctx.globalAlpha=.25;} rr(ctx,cx,cy,cw,cw,10); ctx.fillStyle=(c.up||c.done)?hexA(cfg.accent,.25):hexA(cfg.accent,.5); ctx.fill(); ctx.strokeStyle=cfg.accent; ctx.lineWidth=2; ctx.stroke(); if(c.up||c.done) sprite(ctx,c.e,cx+cw/2,cy+cw/2,cw*.3); else lbl(ctx,'?',cx+cw/2,cy+cw/2,hexA('#fff',.5),cw*.34,'Anton'); ctx.globalAlpha=1; }); },
    pointer(x,y,type,g,cfg,A,W,H){ if(type!=='down'||g.m.lock>0)return; const m=g.m,ge=m.geo; if(!ge)return; const cv=document.getElementById('arcCv'); const cw2=cv.clientWidth,ch=cv.clientHeight; const px=x*cw2,py=y*ch;
      m.cards.forEach((c,i)=>{ const cx=ge.x0+(i%ge.cols)*(ge.cw+ge.gap), cy=ge.y0+Math.floor(i/ge.cols)*(ge.cw+ge.gap); if(!c.up&&!c.done&&px>=cx&&px<=cx+ge.cw&&py>=cy&&py<=cy+ge.cw&&m.sel.length<2){ c.up=true; m.sel.push(i); if(m.sel.length===2)m.lock=.7; } }); } };

  // 8 ── BALANCE: keep the drifting meter in the center zone ─────────
  MECH.balance={ start(g,cfg){ g.m={v:.5,vel:0,push:0}; },
    update(dt,g,cfg,A,W,H){ const m=g.m; m.vel+=(Math.random()-.5)*dt*1.4; m.vel+=m.push*dt*2.2; m.vel*=.96; m.v+=m.vel*dt; if(m.v<0){m.v=0;m.vel*=-.4;} if(m.v>1){m.v=1;m.vel*=-.4;}
      const inZone=Math.abs(m.v-.5)<(cfg.zone||.16); if(inZone){ const v=(cfg.pts||16)*dt; A.add(v,v*1.0); g.inz=true; } else { g.inz=false; if(Math.abs(m.v-.5)>.42){ g.score=Math.max(0,g.score-12*dt); } } m.push=0; },
    render(ctx,g,cfg,A,W,H){ const cx=W/2, top=H*.2, bot=H*.86, h=bot-top; const z=cfg.zone||.16;
      // track
      rr(ctx,cx-26,top,52,h,26); ctx.fillStyle='rgba(255,255,255,.07)'; ctx.fill();
      // zone
      ctx.fillStyle=hexA('#22c55e',.22); ctx.fillRect(cx-26,top+h*(.5-z),52,h*z*2); ctx.strokeStyle=hexA('#22c55e',.6); ctx.lineWidth=1; ctx.strokeRect(cx-26,top+h*(.5-z),52,h*z*2);
      lbl(ctx,'SAFE',cx,top+h*.5,hexA('#86efac',.7),10,'Orbitron');
      // needle
      const ny=top+h*g.m.v; ctx.fillStyle=g.inz?'#34d399':'#f87171'; sprite(ctx,cfg.player||'⚖️',cx,ny,24,g.inz?cfg.accent:'#f87171');
      lbl(ctx,'◀ HOLD',W*.2,H*.5,hexA(cfg.accent,.8),13,'Orbitron'); lbl(ctx,'HOLD ▶',W*.8,H*.5,hexA(cfg.accent,.8),13,'Orbitron'); },
    pointer(x,y,type,g){ if(type==='down'||type==='move'){ g.m.push = x<.5?-1:1; } },
    key(k,d,g){ if(k==='ArrowLeft')g.kL=d; if(k==='ArrowRight')g.kR=d; if(d){ if(k==='ArrowLeft')g.m.push=-1; if(k==='ArrowRight')g.m.push=1; } } };

  // 9 ── AIM: a target roams, tap it; avoid decoys ──────────────────
  MECH.aim={ start(g,cfg){ g.m={x:.5,y:.4,vx:.18,vy:.13,decoy:[],t:0}; },
    update(dt,g,cfg,A,W,H){ const m=g.m; m.x+=m.vx*dt; m.y+=m.vy*dt; if(m.x<.08||m.x>.92)m.vx*=-1; if(m.y<.22||m.y>.8)m.vy*=-1; m.x=Math.max(.08,Math.min(.92,m.x)); m.y=Math.max(.22,Math.min(.8,m.y));
      m.t-=dt; if(m.t<=0){ m.t=1.4; if(m.decoy.length<3)m.decoy.push({x:.1+Math.random()*.8,y:.24+Math.random()*.56,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.3}); }
      for(const d of m.decoy){ d.x+=d.vx*dt; d.y+=d.vy*dt; if(d.x<.06||d.x>.94)d.vx*=-1; if(d.y<.22||d.y>.82)d.vy*=-1; } },
    render(ctx,g,cfg,A,W,H){ for(const d of g.m.decoy) sprite(ctx,(cfg.bad||['💣'])[0],d.x*W,d.y*H,20,'#f87171');
      const m=g.m; ctx.strokeStyle=cfg.accent; ctx.lineWidth=2; ctx.globalAlpha=.6; ctx.beginPath(); ctx.arc(m.x*W,m.y*H,30,0,7); ctx.stroke(); ctx.globalAlpha=1; sprite(ctx,(cfg.good||['🎯'])[0],m.x*W,m.y*H,22,cfg.accent); },
    pointer(x,y,type,g,cfg,A){ if(type!=='down')return; if(Math.hypot(x-g.m.x,y-g.m.y)<.07){ const v=cfg.pts||16; A.add(v,v); A.burst(g.m.x,g.m.y,cfg.accent,12); A.ring(g.m.x,g.m.y,cfg.accent); A.float(g.m.x,g.m.y-.04,'+'+v); g.m.x=.1+Math.random()*.8; g.m.y=.26+Math.random()*.5; g.m.vx*=1.05; A.flash(); return; } for(const d of g.m.decoy){ if(Math.hypot(x-d.x,y-d.y)<.06){ g.score=Math.max(0,g.score-10); A.shake(.4); A.burst(d.x,d.y,'#f87171',8); return; } } } };

  // 10 ── GROW: tap to grow your money, banked toward the goal ──────
  MECH.grow={ start(g,cfg){ g.m={pulse:0,evt:0,mult:1,events:[]}; },
    update(dt,g,cfg,A,W,H){ const m=g.m; if(m.pulse>0)m.pulse-=dt*3;
      m.evt-=dt; if(m.evt<=0){ m.evt=1.3+Math.random()*1.2; const good=Math.random()<.6; m.events.push({x:.15+Math.random()*.7,y:.3+Math.random()*.4,e:good?(cfg.good||['✨'])[0]:(cfg.bad||['💸'])[0],good,life:1.8}); }
      for(const e of m.events){ e.life-=dt; e.y-=dt*.05; } m.events=m.events.filter(e=>e.life>0); },
    render(ctx,g,cfg,A,W,H){ const s=1+Math.max(0,g.m.pulse)*.12; sprite(ctx,cfg.player||'🌳',W/2,H*.56,Math.min(64,W*.12)*s,cfg.accent);
      lbl(ctx,(cfg.tapLabel||'TAP TO GROW!'),W/2,H*.8,hexA('#fff',.7),14,'Orbitron');
      for(const e of g.m.events) sprite(ctx,e.e,e.x*W,e.y*H,18,e.good?cfg.accent:'#f87171'); },
    pointer(x,y,type,g,cfg,A,W,H){ if(type!=='down')return;
      for(const e of g.m.events){ if(!e.dead&&Math.hypot(x-e.x,y-e.y)<.07){ e.dead=1;e.life=0; if(e.good){ const v=(cfg.pts||10)*3; A.add(v,v); A.float(e.x,e.y,'+'+v,'#86efac'); A.burst(e.x,e.y,cfg.accent,10);} else { g.score=Math.max(0,g.score-8); A.float(e.x,e.y,'-8','#fca5a5'); A.shake(.3);} return; } }
      const cy=.56; if(Math.hypot((x-.5),(y-cy))<.16){ const v=cfg.pts||10; A.add(v,v); g.m.pulse=1; A.float(.5,cy-.1,'+'+v,cfg.accent); A.burst(.5,cy,cfg.accent,5);} } };

  /* ── shared text wrap for quiz ── */
  function wrap(ctx,text,cx,cy,maxW,lh){ const words=(text||'').split(' '); let line='',lines=[]; for(const w of words){ const t=line?line+' '+w:w; if(ctx.measureText(t).width>maxW&&line){ lines.push(line); line=w; } else line=t; } if(line)lines.push(line); const y0=cy-(lines.length-1)*lh/2; lines.forEach((l,i)=>ctx.fillText(l,cx,y0+i*lh)); }

})();
