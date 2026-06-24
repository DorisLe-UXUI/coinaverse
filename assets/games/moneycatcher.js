/* ════════════════════════════════════════════════════════════════
   MONEY CATCHER 3.0 — real canvas arcade (Guardian / SaveScape Orbit)
   Move the piggy bank (mouse / touch / ← →) to CATCH coins & gems,
   DODGE savings-killers. Build combos, fill the vault to the goal.
   Loads after the main script; overrides the stub window.SCREENS.game_moneycatcher.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='guardian', GOAL=300, ROUND=60;
  let G=null, raf=null;

  window.mcInit=function(){ G=null; };  // playDistrictGame calls this before goTo

  function reset(){
    G={ phase:'play', score:0, vault:0, caught:0, missed:0, combo:0, best:0,
        time:ROUND, piggyX:0.5, vx:0, items:[], parts:[], floats:[],
        spawnT:0, last:0, started:performance.now(), shake:0, magnet:0, flash:0 };
  }

  // item kinds
  const COINS=[{e:'🪙',v:10},{e:'💰',v:15},{e:'💎',v:25}];
  const KILLERS=[{e:'🛍️',t:'Impulse buy'},{e:'🔥',t:'Money on fire'},{e:'💸',t:'Late fee'},{e:'🧾',t:'Surprise bill'}];

  window.SCREENS.game_moneycatcher=function(){
    if(!G) reset();
    setTimeout(mcBoot,30);
    return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#0c4a46,#04141f 60%,#02080f);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(180deg,rgba(2,12,18,.85),transparent)">
        <button onclick="mcExit()" style="padding:7px 14px;border:1px solid rgba(20,184,166,.4);border-radius:9px;background:rgba(20,184,166,.1);color:#5eead4;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← SAVESCAPE</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.2em;color:#2dd4bf;flex:1;text-align:center">🐷 MONEY CATCHER 3.0</div>
        <div id="mcTime" style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fbbf24;min-width:46px;text-align:right">${ROUND}s</div>
      </div>
      <div style="position:absolute;top:52px;left:0;right:0;z-index:5;display:flex;gap:8px;padding:0 18px;justify-content:center">
        ${hud('CAUGHT','mcCaught','#34d399')}${hud('MISSED','mcMissed','#f87171')}${hud('COMBO','mcCombo','#fbbf24')}
      </div>
      <div style="position:absolute;top:118px;left:18px;right:18px;z-index:5">
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:4px"><span>VAULT</span><span id="mcVaultTxt">0 / ${GOAL} 💎</span></div>
        <div style="height:10px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(20,184,166,.25)"><div id="mcVaultBar" style="height:100%;width:0%;background:linear-gradient(90deg,#14b8a6,#5eead4);transition:width .2s"></div></div>
      </div>
      <canvas id="mcCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:none"></canvas>
      <div id="mcHint" style="position:absolute;left:0;right:0;bottom:18px;text-align:center;z-index:4;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.14em;color:rgba(255,255,255,.45);pointer-events:none">MOVE: mouse · touch · ← →  ·  CATCH 🪙💰💎  ·  DODGE 🛍️🔥💸</div>
      <div id="mcOver" style="position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;background:rgba(2,10,16,.82);backdrop-filter:blur(4px)"></div>
    </div>`;
  };
  function hud(label,id,c){ return `<div style="flex:1;max-width:150px;text-align:center;background:rgba(20,184,166,.08);border:1px solid rgba(20,184,166,.18);border-radius:10px;padding:6px"><div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.45)">${label}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:1.1rem;color:${c}">0</div></div>`; }

  function mcBoot(){
    const cv=document.getElementById('mcCanvas'); if(!cv){ return; }
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);
    // input
    const setX=(clientX)=>{ const r=cv.getBoundingClientRect(); G.piggyX=Math.max(0,Math.min(1,(clientX-r.left)/r.width)); };
    cv.addEventListener('mousemove',e=>setX(e.clientX));
    cv.addEventListener('touchmove',e=>{ if(e.touches[0]){setX(e.touches[0].clientX); e.preventDefault();} },{passive:false});
    cv.addEventListener('touchstart',e=>{ if(e.touches[0])setX(e.touches[0].clientX); });
    G.keyL=G.keyR=false;
    const kd=e=>{ if(e.key==='ArrowLeft')G.keyL=true; if(e.key==='ArrowRight')G.keyR=true; };
    const ku=e=>{ if(e.key==='ArrowLeft')G.keyL=false; if(e.key==='ArrowRight')G.keyR=false; };
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
    G._cleanup=()=>{ window.removeEventListener('resize',size); window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku); };
    G.last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  function loop(now){
    const cv=document.getElementById('mcCanvas');
    if(!cv || !G){ cancelAnimationFrame(raf); return; }       // left screen → stop
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    let dt=Math.min(40,now-G.last)/1000; G.last=now;
    if(G.phase==='play'){ update(dt,W,H); }
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  function update(dt,W,H){
    // timer
    G.time-=dt; if(G.time<=0){ G.time=0; return end(); }
    const tEl=document.getElementById('mcTime'); if(tEl) tEl.textContent=Math.ceil(G.time)+'s';
    // piggy keyboard drift
    if(G.keyL) G.piggyX-=dt*1.3; if(G.keyR) G.piggyX+=dt*1.3;
    G.piggyX=Math.max(0,Math.min(1,G.piggyX));
    // difficulty ramps with time elapsed
    const prog=1-(G.time/ROUND);
    G.spawnT-=dt;
    if(G.spawnT<=0){
      G.spawnT=Math.max(0.32,0.85-prog*0.5);
      const killer=Math.random()<(0.22+prog*0.22);
      if(killer){ const k=KILLERS[Math.floor(Math.random()*KILLERS.length)]; G.items.push({x:Math.random()*0.86+0.07,y:-0.05,vy:0.28+prog*0.5+Math.random()*0.15,e:k.e,kind:'kill',t:k.t,r:24}); }
      else { const c=COINS[Math.floor(Math.random()* (Math.random()<0.18?3:2) )]; G.items.push({x:Math.random()*0.86+0.07,y:-0.05,vy:0.3+prog*0.55+Math.random()*0.2,e:c.e,kind:'coin',v:c.v,r:22}); }
    }
    const py=0.86, px=G.piggyX, catchR=0.07;
    for(const it of G.items){
      it.y+=it.vy*dt;
      // magnet pulls coins
      if(G.magnet>0 && it.kind==='coin'){ it.x += (px-it.x)*Math.min(1,dt*3); }
      if(it.y>=py-0.02 && it.y<=py+0.05 && Math.abs(it.x-px)<catchR){
        if(it.kind==='coin'){
          G.combo++; G.best=Math.max(G.best,G.combo); G.caught++;
          const gain=it.v*(1+Math.floor(G.combo/5));
          G.score+=gain; G.vault=Math.min(GOAL,G.vault+Math.round(gain/3));
          burst(it.x,py, '#34d399',10); floatTxt(it.x,py,'+'+gain, '#fde68a');
          if(G.combo%5===0){ G.flash=0.4; floatTxt(0.5,0.5,'COMBO x'+(1+Math.floor(G.combo/5)),'#2dd4bf'); }
          it.dead=1;
        } else {
          G.combo=0; G.missed++; G.vault=Math.max(0,G.vault-12); G.shake=0.4;
          burst(it.x,py,'#f87171',12); floatTxt(it.x,py,it.t,'#fca5a5');
          it.dead=1;
        }
      } else if(it.y>1.05){ if(it.kind==='coin'){ G.combo=0; } it.dead=1; }
    }
    G.items=G.items.filter(i=>!i.dead);
    if(G.magnet>0) G.magnet-=dt;
    if(G.shake>0) G.shake-=dt; if(G.flash>0) G.flash-=dt;
    // particles + floats
    for(const p of G.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=1.4*dt; p.life-=dt; }
    G.parts=G.parts.filter(p=>p.life>0);
    for(const f of G.floats){ f.y-=dt*0.12; f.life-=dt; }
    G.floats=G.floats.filter(f=>f.life>0);
    // sync HUD
    setTxt('mcCaught',G.caught); setTxt('mcMissed',G.missed); setTxt('mcCombo','x'+G.combo);
    const vb=document.getElementById('mcVaultBar'); if(vb) vb.style.width=(G.vault/GOAL*100)+'%';
    const vt=document.getElementById('mcVaultTxt'); if(vt) vt.textContent=G.vault+' / '+GOAL+' 💎';
    if(G.vault>=GOAL) return end(true);
  }

  function render(ctx,W,H,now){
    ctx.clearRect(0,0,W,H);
    let ox=0,oy=0; if(G.shake>0){ ox=(Math.random()-.5)*G.shake*22; oy=(Math.random()-.5)*G.shake*22; }
    ctx.save(); ctx.translate(ox,oy);
    // starfield
    ctx.fillStyle='rgba(255,255,255,.5)';
    for(let i=0;i<46;i++){ const sx=(i*73.3%W), sy=((i*129.7 + now*0.012*((i%3)+1))%H); ctx.globalAlpha=0.15+(i%5)*0.07; ctx.fillRect(sx,sy,2,2); }
    ctx.globalAlpha=1;
    if(G.flash>0){ ctx.fillStyle='rgba(45,212,191,'+(G.flash*0.25)+')'; ctx.fillRect(0,0,W,H); }
    // items
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const it of G.items){
      const x=it.x*W, y=it.y*H;
      if(it.kind==='coin'){ ctx.shadowColor='#fbbf24'; ctx.shadowBlur=14; } else { ctx.shadowColor='#ef4444'; ctx.shadowBlur=14; }
      ctx.font=(it.r*2)+'px serif'; ctx.fillText(it.e,x,y); ctx.shadowBlur=0;
    }
    // particles
    for(const p of G.parts){ ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); }
    ctx.globalAlpha=1;
    // piggy
    const px=G.piggyX*W, py=0.86*H;
    ctx.shadowColor='#2dd4bf'; ctx.shadowBlur=24; ctx.font='62px serif'; ctx.fillText('🐷',px,py); ctx.shadowBlur=0;
    if(G.magnet>0){ ctx.strokeStyle='rgba(45,212,191,.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,54,0,7); ctx.stroke(); }
    // float texts
    ctx.textAlign='center';
    for(const f of G.floats){ ctx.globalAlpha=Math.max(0,f.life/0.9); ctx.fillStyle=f.c; ctx.font='700 '+(f.big?22:15)+"px 'Inter',sans-serif"; ctx.fillText(f.t,f.x*W,f.y*H); }
    ctx.globalAlpha=1;
    ctx.restore();
  }

  function burst(x,y,c,n){ for(let i=0;i<n;i++){ const a=Math.random()*7,s=0.15+Math.random()*0.5; G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.2,s:2+Math.random()*3,c,life:0.5+Math.random()*0.3,max:0.8}); } }
  function floatTxt(x,y,t,c){ G.floats.push({x,y,t,c,life:0.9,big:t.indexOf('COMBO')>=0}); }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

  function end(win){
    if(G.phase==='over') return; G.phase='over';
    if(window.state){ state.coins=(state.coins||0)+G.score; if(window.cvAddXP) cvAddXP(Math.round(G.score/4),0); else if(window.cvSave) cvSave();
      state.gamesDone=state.gamesDone||{}; state.gamesDone['guardian:0']=1; }
    const won=win||G.vault>=GOAL;
    const o=document.getElementById('mcOver'); if(!o) return; o.style.display='flex';
    o.innerHTML=`<div style="max-width:420px;text-align:center;padding:34px 28px;border:1px solid ${won?'#fbbf24':'#14b8a6'};border-radius:22px;background:linear-gradient(160deg,rgba(8,40,46,.97),rgba(4,20,30,.97));box-shadow:0 0 60px rgba(20,184,166,.4)">
      <div style="font-size:3rem;margin-bottom:8px">${won?'🏆':'🐷'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:${won?'#fbbf24':'#2dd4bf'};margin-bottom:8px">${won?'VAULT GOAL REACHED!':"TIME'S UP"}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:2rem;margin:0 0 6px">${G.score} pts</h1>
      <p style="color:rgba(255,255,255,.65);margin:0 0 18px;font-size:.9rem">Vault ${G.vault}/${GOAL} 💎 · Best combo x${G.best} · +${G.score} 🪙</p>
      <button onclick="mcRestart()" style="padding:13px 26px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#14b8a6,#0d9488);color:#04201e;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;font-weight:900;cursor:pointer">▶ PLAY AGAIN</button>
      <button onclick="mcExit()" style="padding:13px 26px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
    </div>`;
  }

  window.mcRestart=function(){ reset(); const o=document.getElementById('mcOver'); if(o){o.style.display='none';o.innerHTML='';} mcBoot(); };
  window.mcExit=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); G=null; if(window.state)state.viewingWorld='guardian'; goTo('hub'); };
})();
