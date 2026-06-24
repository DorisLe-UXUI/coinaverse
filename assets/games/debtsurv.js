/* ════════════════════════════════════════════════════════════════
   DEBT SURVIVAL: GLADIATOR PIT — real canvas arena survivor
   (Rebuilder / Debt Detox · teaches crushing debt)
   Top-down twin-stick-lite: move (WASD / arrows / drag), AUTO-FIRE
   payments 💵 at the nearest debt monster. Survive the pit, grab 💎,
   snag power-ups, outlast the Debt Titan boss.
   Loads after the main script; overrides the stub window.SCREENS.game_debtsurv.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='rebuilder', SURVIVE=70;     // seconds to win
  let G=null, raf=null;

  window.dsInit=function(){ G=null; };     // playDistrictGame calls this before goTo

  function reset(){
    G={ phase:'play', score:0, kills:0, time:SURVIVE,
        // player in arena-normalized coords (0..1 of the shorter logic space)
        px:0.5, py:0.5, pvx:0, pvy:0, hp:100, maxhp:100, hitFlash:0,
        fireT:0, fireRate:0.42, dmg:34, shield:0, rapid:0,
        enemies:[], shots:[], gems:[], powers:[], parts:[], floats:[],
        spawnT:0.6, last:0, started:performance.now(),
        shake:0, flash:0, dir:1, walkT:0, bossUp:false, bossDead:false,
        keys:{}, touch:null };
  }

  // enemy archetypes — debt monsters
  const FOES={
    rat:    {e:'🐀', hp:34,  spd:0.115, dmg:9,  r:0.026, score:8,  drop:0.16, name:'Debt Rat'},
    drone:  {e:'👾', hp:64,  spd:0.082, dmg:13, r:0.030, score:14, drop:0.22, name:'Collection Drone'},
    vamp:   {e:'🧛', hp:96,  spd:0.066, dmg:18, r:0.034, score:22, drop:0.30, name:'Credit Vampire'},
    titan:  {e:'👹', hp:230, spd:0.040, dmg:26, r:0.052, score:60, drop:0.65, name:'Debt Titan'}
  };

  window.SCREENS.game_debtsurv=function(){
    if(!G) reset();
    setTimeout(dsBoot,30);
    return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,#4a1f1f,#2d1b1b 62%,#180c0c);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(180deg,rgba(20,8,8,.9),transparent)">
        <button onclick="dsExit()" style="padding:7px 14px;border:1px solid rgba(245,158,11,.45);border-radius:9px;background:rgba(245,158,11,.1);color:#fcd34d;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← DEBT DETOX</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.18em;color:#f59e0b;flex:1;text-align:center;text-shadow:0 0 14px rgba(245,158,11,.5)">⚔️ DEBT SURVIVAL · GLADIATOR PIT</div>
        <div id="dsTime" style="font-family:'Anton',sans-serif;font-size:1.05rem;color:#fcd34d;min-width:52px;text-align:right">${SURVIVE}s</div>
      </div>
      <div style="position:absolute;top:50px;left:0;right:0;z-index:5;display:flex;gap:8px;padding:0 18px;justify-content:center">
        ${hud('SCORE','dsScore','#fcd34d')}${hud('KILLS','dsKills','#fb923c')}${hud('STATUS','dsStat','#f87171')}
      </div>
      <div style="position:absolute;top:116px;left:18px;right:18px;z-index:5">
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:4px"><span>❤️ HEALTH</span><span id="dsHpTxt">100 / 100</span></div>
        <div style="height:12px;border-radius:7px;background:rgba(0,0,0,.4);overflow:hidden;border:1px solid rgba(245,158,11,.3)"><div id="dsHpBar" style="height:100%;width:100%;background:linear-gradient(90deg,#ef4444,#f59e0b);transition:width .15s"></div></div>
      </div>
      <canvas id="dsCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:crosshair"></canvas>
      <div id="dsHint" style="position:absolute;left:0;right:0;bottom:18px;text-align:center;z-index:4;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.14em;color:rgba(255,255,255,.5);pointer-events:none">WASD / arrows / drag to MOVE · 💵 auto-attacks nearest debt · grab 💎 ⚡ ❤️ 🛡️ 💥</div>
      <div id="dsOver" style="position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;background:rgba(16,6,6,.84);backdrop-filter:blur(4px)"></div>
    </div>`;
  };
  function hud(label,id,c){ return `<div style="flex:1;max-width:150px;text-align:center;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:6px"><div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.5)">${label}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:1.1rem;color:${c}">0</div></div>`; }

  function dsBoot(){
    const cv=document.getElementById('dsCanvas'); if(!cv){ return; }
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);
    // ---- input: keyboard ----
    const kd=e=>{ const k=e.key.toLowerCase(); G.keys[k]=true; if(['arrowleft','arrowright','arrowup','arrowdown',' '].indexOf(e.key.toLowerCase())>=0||['w','a','s','d'].indexOf(k)>=0) e.preventDefault(); };
    const ku=e=>{ G.keys[e.key.toLowerCase()]=false; };
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
    // ---- input: pointer / touch (move toward point) ----
    const pt=(clientX,clientY)=>{ const r=cv.getBoundingClientRect(); const sh=Math.min(r.width,r.height);
      // map screen → logic so player chases finger
      G.touch={ x:(clientX-r.left - (r.width-sh)/2)/sh, y:(clientY-r.top - (r.height-sh)/2)/sh }; };
    const clr=()=>{ G.touch=null; };
    cv.addEventListener('mousedown',e=>pt(e.clientX,e.clientY));
    cv.addEventListener('mousemove',e=>{ if(e.buttons&1) pt(e.clientX,e.clientY); });
    window.addEventListener('mouseup',clr);
    cv.addEventListener('touchstart',e=>{ if(e.touches[0]){pt(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault();} },{passive:false});
    cv.addEventListener('touchmove',e=>{ if(e.touches[0]){pt(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault();} },{passive:false});
    cv.addEventListener('touchend',clr); cv.addEventListener('touchcancel',clr);
    G._cleanup=()=>{ window.removeEventListener('resize',size); window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku); window.removeEventListener('mouseup',clr); };
    G.last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  // logic space mapping helpers: arena is a centered square of side `sh` in screen px
  function geo(W,H){ const sh=Math.min(W,H); return { sh, ox:(W-sh)/2, oy:(H-sh)/2 }; }
  function toScreen(x,y,g){ return [ g.ox + x*g.sh, g.oy + y*g.sh ]; }

  function loop(now){
    const cv=document.getElementById('dsCanvas');
    if(!cv || !G){ cancelAnimationFrame(raf); return; }        // left screen → stop
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    let dt=Math.min(40,now-G.last)/1000; G.last=now;
    if(G.phase==='play'){ update(dt,W,H); }
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  function dist2(ax,ay,bx,by){ const dx=ax-bx,dy=ay-by; return dx*dx+dy*dy; }

  function update(dt,W,H){
    // ---- timer / win ----
    G.time-=dt; if(G.time<=0){ G.time=0; return end(true); }
    const tEl=document.getElementById('dsTime'); if(tEl) tEl.textContent=Math.ceil(G.time)+'s';
    const elapsed=SURVIVE-G.time;
    const prog=elapsed/SURVIVE;                                 // 0..1 ramp

    // ---- player movement ----
    let mx=0,my=0;
    if(G.keys['a']||G.keys['arrowleft'])  mx-=1;
    if(G.keys['d']||G.keys['arrowright']) mx+=1;
    if(G.keys['w']||G.keys['arrowup'])    my-=1;
    if(G.keys['s']||G.keys['arrowdown'])  my+=1;
    if(G.touch){
      const dx=G.touch.x-G.px, dy=G.touch.y-G.py, d=Math.hypot(dx,dy);
      if(d>0.012){ mx+=dx/d; my+=dy/d; }                        // steer toward finger
    }
    const ml=Math.hypot(mx,my); if(ml>0){ mx/=ml; my/=ml; if(Math.abs(mx)>0.05) G.dir=mx>0?1:-1; G.walkT+=dt*9; }
    const spd=0.42;
    G.px+=mx*spd*dt; G.py+=my*spd*dt;
    const pad=0.045;
    G.px=Math.max(pad,Math.min(1-pad,G.px)); G.py=Math.max(pad,Math.min(1-pad,G.py));

    // ---- spawning (difficulty ramps) ----
    G.spawnT-=dt;
    if(G.spawnT<=0){
      G.spawnT=Math.max(0.34, 1.05 - prog*0.72);
      let type='rat';
      const r=Math.random();
      if(prog<0.25){ type = r<0.78?'rat':'drone'; }
      else if(prog<0.55){ type = r<0.5?'rat': r<0.85?'drone':'vamp'; }
      else { type = r<0.34?'rat': r<0.66?'drone':'vamp'; }
      spawnFoe(type, prog);
      if(prog>0.4 && Math.random()<0.35) spawnFoe(r<0.6?'rat':'drone', prog); // swarms later
    }
    // ---- mini-boss near the end (once) ----
    if(!G.bossUp && G.time<=18){ G.bossUp=true; spawnFoe('titan',prog); G.flash=0.5;
      floatTxt(0.5,0.32,'⚠ DEBT TITAN','#ef4444',true); }

    // ---- auto-fire at nearest foe ----
    G.fireT-=dt;
    const rate=G.rapid>0 ? G.fireRate*0.42 : G.fireRate;
    if(G.fireT<=0 && G.enemies.length){
      let best=null, bd=1e9;
      for(const e of G.enemies){ const d=dist2(e.x,e.y,G.px,G.py); if(d<bd){ bd=d; best=e; } }
      if(best){
        const ang=Math.atan2(best.y-G.py, best.x-G.px);
        const sp=0.9;
        G.shots.push({x:G.px,y:G.py,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:0.016,life:1.6});
        if(G.rapid>0){ // little spread while rapid
          G.shots.push({x:G.px,y:G.py,vx:Math.cos(ang+0.18)*sp,vy:Math.sin(ang+0.18)*sp,r:0.013,life:1.4});
          G.shots.push({x:G.px,y:G.py,vx:Math.cos(ang-0.18)*sp,vy:Math.sin(ang-0.18)*sp,r:0.013,life:1.4});
        }
        G.fireT=rate;
      }
    }

    // ---- move shots ----
    for(const s of G.shots){ s.x+=s.vx*dt; s.y+=s.vy*dt; s.life-=dt;
      if(s.x<-0.05||s.x>1.05||s.y<-0.05||s.y>1.05||s.life<=0) s.dead=1; }

    // ---- enemies chase + collide ----
    for(const e of G.enemies){
      const dx=G.px-e.x, dy=G.py-e.y, d=Math.hypot(dx,dy)||1;
      e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt;
      if(e.flash>0) e.flash-=dt;
      // soft separation so they don't perfectly stack
      // shot hits
      for(const s of G.shots){ if(s.dead) continue;
        if(dist2(s.x,s.y,e.x,e.y) < (e.r+s.r)*(e.r+s.r)){
          s.dead=1; e.hp-=G.dmg; e.flash=0.12; e.kx=(e.x-G.px); e.ky=(e.y-G.py);
          burst(e.x,e.y,'#fcd34d',5);
          if(e.hp<=0){ killFoe(e); }
          break;
        }
      }
      // touch player
      if(!e.dead && dist2(e.x,e.y,G.px,G.py) < (e.r+0.04)*(e.r+0.04)){
        if(G.shield>0){ // shield bounces & damages
          e.hp-=20; e.flash=0.12; const ka=Math.atan2(e.y-G.py,e.x-G.px); e.x+=Math.cos(ka)*0.05; e.y+=Math.sin(ka)*0.05;
          burst(e.x,e.y,'#38bdf8',6); if(e.hp<=0) killFoe(e);
        } else {
          if(!e.hitCD || e.hitCD<=0){ G.hp-=e.dmg; e.hitCD=0.6; G.hitFlash=0.35; G.shake=0.45;
            burst(G.px,G.py,'#ef4444',8); floatTxt(G.px,G.py-0.04,'-'+e.dmg,'#fca5a5');
            if(G.hp<=0){ G.hp=0; return end(false); } }
        }
      }
      if(e.hitCD>0) e.hitCD-=dt;
    }
    G.enemies=G.enemies.filter(e=>!e.dead);
    G.shots=G.shots.filter(s=>!s.dead);

    // ---- pickups: gems ----
    for(const gm of G.gems){ gm.life-=dt; gm.bob+=dt*4;
      // magnet-ish: gentle pull when close
      const d=Math.hypot(G.px-gm.x,G.py-gm.y);
      if(d<0.12){ gm.x+=(G.px-gm.x)*Math.min(1,dt*5); gm.y+=(G.py-gm.y)*Math.min(1,dt*5); }
      if(d<0.05){ G.score+=gm.v; burst(gm.x,gm.y,'#34d399',8); floatTxt(gm.x,gm.y,'+'+gm.v,'#6ee7b7'); gm.dead=1; }
      else if(gm.life<=0) gm.dead=1;
    }
    G.gems=G.gems.filter(g=>!g.dead);

    // ---- pickups: powers ----
    for(const p of G.powers){ p.life-=dt; p.bob+=dt*3.5;
      if(dist2(p.x,p.y,G.px,G.py) < 0.05*0.05){ applyPower(p); p.dead=1; }
      else if(p.life<=0) p.dead=1;
    }
    G.powers=G.powers.filter(p=>!p.dead);

    // ---- timers ----
    if(G.rapid>0) G.rapid-=dt;
    if(G.shield>0) G.shield-=dt;
    if(G.hitFlash>0) G.hitFlash-=dt;
    if(G.shake>0) G.shake-=dt;
    if(G.flash>0) G.flash-=dt;

    // ---- particles + floats ----
    for(const pt of G.parts){ pt.x+=pt.vx*dt; pt.y+=pt.vy*dt; pt.vy+=0.4*dt; pt.life-=dt; }
    G.parts=G.parts.filter(p=>p.life>0);
    for(const f of G.floats){ f.y-=dt*0.1; f.life-=dt; }
    G.floats=G.floats.filter(f=>f.life>0);

    // ---- HUD sync ----
    setTxt('dsScore',G.score); setTxt('dsKills',G.kills);
    const st=document.getElementById('dsStat');
    if(st){ let s='—', c='#f87171';
      if(G.shield>0){ s='🛡️'+Math.ceil(G.shield); c='#38bdf8'; }
      else if(G.rapid>0){ s='⚡'+Math.ceil(G.rapid); c='#fcd34d'; }
      st.textContent=s; st.style.color=c; }
    const hb=document.getElementById('dsHpBar'); if(hb){ hb.style.width=Math.max(0,G.hp/G.maxhp*100)+'%'; }
    const ht=document.getElementById('dsHpTxt'); if(ht) ht.textContent=Math.max(0,Math.round(G.hp))+' / '+G.maxhp;
  }

  function spawnFoe(type,prog){
    const f=FOES[type];
    // spawn from a random edge of the arena
    let x,y; const e=Math.floor(Math.random()*4);
    if(e===0){ x=Math.random(); y=-0.04; }
    else if(e===1){ x=Math.random(); y=1.04; }
    else if(e===2){ x=-0.04; y=Math.random(); }
    else { x=1.04; y=Math.random(); }
    const sclHp = type==='titan' ? 1 : (1+prog*0.6);
    const sclSpd= type==='titan' ? 1 : (1+prog*0.45);
    G.enemies.push({ type, e:f.e, x, y, r:f.r, hp:f.hp*sclHp, maxhp:f.hp*sclHp,
      spd:f.spd*sclSpd, dmg:f.dmg, score:f.score, drop:f.drop, name:f.name,
      flash:0, hitCD:0, kx:0, ky:0 });
  }

  function killFoe(e){
    e.dead=1; G.kills++; G.score+=e.score;
    burst(e.x,e.y, e.type==='titan'?'#ef4444':'#fb923c', e.type==='titan'?26:13);
    floatTxt(e.x,e.y,'+'+e.score,'#fcd34d');
    if(e.type==='titan'){ G.bossDead=true; G.flash=0.5; G.shake=0.5;
      // titan showers gems
      for(let i=0;i<5;i++) G.gems.push({x:e.x+(Math.random()-.5)*0.1,y:e.y+(Math.random()-.5)*0.1,v:15,life:8,bob:Math.random()*6});
      maybePower(e.x,e.y,true);
    } else {
      if(Math.random()<e.drop) G.gems.push({x:e.x,y:e.y,v: e.type==='vamp'?12:(e.type==='drone'?8:5), life:7, bob:Math.random()*6});
      maybePower(e.x,e.y,false);
    }
  }

  const POWERS=[
    {k:'heal',  e:'❤️', c:'#f87171'},
    {k:'rapid', e:'⚡', c:'#fcd34d'},
    {k:'shield',e:'🛡️', c:'#38bdf8'},
    {k:'bomb',  e:'💥', c:'#fb923c'}
  ];
  function maybePower(x,y,force){
    if(!force && Math.random()>0.07) return;
    const p=POWERS[Math.floor(Math.random()*POWERS.length)];
    G.powers.push({k:p.k,e:p.e,c:p.c,x:Math.max(0.06,Math.min(0.94,x)),y:Math.max(0.06,Math.min(0.94,y)),life:9,bob:Math.random()*6});
  }
  function applyPower(p){
    burst(p.x,p.y,p.c,12);
    if(p.k==='heal'){ G.hp=Math.min(G.maxhp,G.hp+35); floatTxt(G.px,G.py-0.05,'+35 ❤️','#fca5a5'); }
    else if(p.k==='rapid'){ G.rapid=7; floatTxt(G.px,G.py-0.05,'⚡ RAPID FIRE','#fcd34d'); }
    else if(p.k==='shield'){ G.shield=7; floatTxt(G.px,G.py-0.05,'🛡️ SHIELD','#38bdf8'); }
    else if(p.k==='bomb'){
      floatTxt(G.px,G.py-0.05,'💥 DEBT WIPE!','#fb923c'); G.flash=0.55; G.shake=0.5;
      for(const en of G.enemies){ en.hp-=140; en.flash=0.14; if(en.hp<=0) killFoe(en); burst(en.x,en.y,'#fb923c',6); }
    }
  }

  function render(ctx,W,H,now){
    ctx.clearRect(0,0,W,H);
    const g=geo(W,H);
    let ox=0,oy=0; if(G.shake>0){ ox=(Math.random()-.5)*G.shake*24; oy=(Math.random()-.5)*G.shake*24; }
    ctx.save(); ctx.translate(ox,oy);

    drawArena(ctx,W,H,g,now);

    if(G.flash>0){ ctx.fillStyle='rgba(239,68,68,'+(G.flash*0.3)+')'; ctx.fillRect(0,0,W,H); }

    ctx.textAlign='center'; ctx.textBaseline='middle';

    // ---- gems ----
    for(const gm of G.gems){ const [sx,sy]=toScreen(gm.x,gm.y,g); const bob=Math.sin(gm.bob)*3;
      const a = gm.life<2 ? Math.max(0.2, gm.life/2) : 1; ctx.globalAlpha=a;
      ctx.shadowColor='#34d399'; ctx.shadowBlur=16; ctx.font='22px serif'; ctx.fillText('💎',sx,sy+bob); ctx.shadowBlur=0;
    }
    ctx.globalAlpha=1;
    // ---- powers ----
    for(const p of G.powers){ const [sx,sy]=toScreen(p.x,p.y,g); const bob=Math.sin(p.bob)*3;
      const a = p.life<2 ? Math.max(0.2, p.life/2) : 1;
      ctx.globalAlpha=a*(0.55+0.45*Math.abs(Math.sin(now*0.006)));
      ctx.strokeStyle=p.c; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(sx,sy+bob,18,0,7); ctx.stroke();
      ctx.globalAlpha=a; ctx.shadowColor=p.c; ctx.shadowBlur=18; ctx.font='24px serif'; ctx.fillText(p.e,sx,sy+bob); ctx.shadowBlur=0;
    }
    ctx.globalAlpha=1;

    // ---- enemies ----
    for(const e of G.enemies){ let [sx,sy]=toScreen(e.x,e.y,g);
      const sz=e.r*g.sh*2.0;
      // knockback wobble on hit
      if(e.flash>0){ sx+=(Math.random()-.5)*4; sy+=(Math.random()-.5)*4; }
      // health ring for tanky foes
      if(e.type==='vamp'||e.type==='titan'){ const frac=Math.max(0,e.hp/e.maxhp);
        ctx.strokeStyle='rgba(0,0,0,.45)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(sx,sy,sz*0.62,0,7); ctx.stroke();
        ctx.strokeStyle = e.type==='titan'?'#ef4444':'#f59e0b'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(sx,sy,sz*0.62,-Math.PI/2,-Math.PI/2+frac*Math.PI*2); ctx.stroke();
      }
      ctx.shadowColor = e.type==='titan'?'#ef4444':'#7f1d1d'; ctx.shadowBlur = e.type==='titan'?22:10;
      ctx.font=sz+'px serif';
      if(e.flash>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillText(e.e,sx,sy); ctx.restore(); }
      ctx.fillText(e.e,sx,sy); ctx.shadowBlur=0;
    }

    // ---- shots (glowing payments) ----
    for(const s of G.shots){ const [sx,sy]=toScreen(s.x,s.y,g);
      ctx.shadowColor='#fde68a'; ctx.shadowBlur=14;
      ctx.fillStyle='#fde68a'; ctx.beginPath(); ctx.arc(sx,sy,s.r*g.sh,0,7); ctx.fill();
      ctx.shadowBlur=0; ctx.globalAlpha=0.9; ctx.font=(s.r*g.sh*1.9)+'px serif'; ctx.fillText('💵',sx,sy); ctx.globalAlpha=1;
    }

    // ---- player (hero) ----
    drawHero(ctx, ...toScreen(G.px,G.py,g), g.sh, now);

    // ---- particles ----
    for(const p of G.parts){ const [sx,sy]=toScreen(p.x,p.y,g); ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(sx,sy,p.s,0,7); ctx.fill(); }
    ctx.globalAlpha=1;

    // ---- float texts ----
    ctx.textAlign='center';
    for(const f of G.floats){ const [sx,sy]=toScreen(f.x,f.y,g); ctx.globalAlpha=Math.max(0,f.life/0.95);
      ctx.fillStyle=f.c; ctx.font='800 '+(f.big?24:15)+"px 'Inter',sans-serif";
      ctx.shadowColor='rgba(0,0,0,.6)'; ctx.shadowBlur=4; ctx.fillText(f.t,sx,sy); ctx.shadowBlur=0; }
    ctx.globalAlpha=1;

    ctx.restore();
  }

  function drawArena(ctx,W,H,g,now){
    // arena floor — gritty amber/red pit with a grid
    const {sh,ox:aox,oy:aoy}=g;
    ctx.save();
    ctx.beginPath(); ctx.rect(aox,aoy,sh,sh); ctx.clip();
    const grad=ctx.createRadialGradient(aox+sh/2,aoy+sh*0.42,sh*0.1, aox+sh/2,aoy+sh/2,sh*0.75);
    grad.addColorStop(0,'#5a2626'); grad.addColorStop(0.6,'#3a1a1a'); grad.addColorStop(1,'#200f0f');
    ctx.fillStyle=grad; ctx.fillRect(aox,aoy,sh,sh);
    // grid
    ctx.strokeStyle='rgba(245,158,11,.07)'; ctx.lineWidth=1;
    const step=sh/12;
    for(let i=1;i<12;i++){ ctx.beginPath(); ctx.moveTo(aox+i*step,aoy); ctx.lineTo(aox+i*step,aoy+sh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(aox,aoy+i*step); ctx.lineTo(aox+sh,aoy+i*step); ctx.stroke(); }
    // pulsing center sigil
    const pr=sh*0.30 + Math.sin(now*0.002)*6;
    ctx.strokeStyle='rgba(245,158,11,.10)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(aox+sh/2,aoy+sh/2,pr,0,7); ctx.stroke();
    ctx.restore();
    // arena border — glowing rim
    ctx.save(); ctx.shadowColor='#f59e0b'; ctx.shadowBlur=18;
    ctx.strokeStyle='rgba(245,158,11,.55)'; ctx.lineWidth=4; ctx.strokeRect(aox+2,aoy+2,sh-4,sh-4);
    ctx.restore();
    // vignette outside arena to focus the pit
    ctx.fillStyle='rgba(16,6,6,.55)';
    if(aox>0){ ctx.fillRect(0,0,aox,H); ctx.fillRect(aox+sh,0,W-aox-sh,H); }
    if(aoy>0){ ctx.fillRect(0,0,W,aoy); ctx.fillRect(0,aoy+sh,W,H-aoy-sh); }
  }

  function drawHero(ctx,cx,cy,sh,now){
    const baseR=sh*0.030;
    // shield aura
    if(G.shield>0){ ctx.strokeStyle='rgba(56,189,248,'+(0.5+0.3*Math.sin(now*0.01))+')'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(cx,cy,baseR*2.4,0,7); ctx.stroke();
      ctx.shadowColor='#38bdf8'; ctx.shadowBlur=18; ctx.beginPath(); ctx.arc(cx,cy,baseR*2.4,0,7); ctx.stroke(); ctx.shadowBlur=0; }
    if(G.rapid>0){ ctx.strokeStyle='rgba(252,211,77,'+(0.4+0.3*Math.sin(now*0.02))+')'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(cx,cy,baseR*2.05,0,7); ctx.stroke(); }
    // body shadow on floor
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(cx,cy+baseR*1.5,baseR*1.1,baseR*0.4,0,0,7); ctx.fill();
    // hit flash tint
    const bob=Math.sin(G.walkT)* (baseR*0.18);
    ctx.save(); ctx.translate(cx,cy-bob); ctx.scale(G.dir,1);
    ctx.shadowColor = G.hitFlash>0 ? '#ef4444' : '#f59e0b'; ctx.shadowBlur = G.hitFlash>0 ? 26 : 18;
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font=(baseR*2.5)+'px serif';
    ctx.fillText('🛡️',0,0);
    ctx.restore(); ctx.shadowBlur=0;
    if(G.hitFlash>0){ ctx.globalAlpha=G.hitFlash*0.6; ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(cx,cy,baseR*2,0,7); ctx.fill(); ctx.globalAlpha=1; }
  }

  function burst(x,y,c,n){ for(let i=0;i<n;i++){ const a=Math.random()*7,s=0.18+Math.random()*0.55; G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,s:2+Math.random()*3,c,life:0.45+Math.random()*0.3,max:0.78}); } }
  function floatTxt(x,y,t,c,big){ G.floats.push({x,y,t,c,life:0.95,big:!!big}); }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

  function end(win){
    if(G.phase==='over') return; G.phase='over';
    const score=G.score;
    if(window.state){ state.coins=(state.coins||0)+score; if(window.cvAddXP) cvAddXP(Math.round(score/4),0); else if(window.cvSave) cvSave();
      state.gamesDone=state.gamesDone||{}; state.gamesDone['rebuilder:0']=1; }
    const o=document.getElementById('dsOver'); if(!o) return; o.style.display='flex';
    const survived = SURVIVE - Math.max(0,Math.ceil(G.time));
    o.innerHTML=`<div style="max-width:430px;text-align:center;padding:34px 28px;border:1px solid ${win?'#f59e0b':'#ef4444'};border-radius:22px;background:linear-gradient(160deg,rgba(58,26,26,.97),rgba(24,12,12,.97));box-shadow:0 0 60px ${win?'rgba(245,158,11,.45)':'rgba(239,68,68,.4)'}">
      <div style="font-size:3rem;margin-bottom:8px">${win?'🏆':'💀'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:${win?'#fcd34d':'#fca5a5'};margin-bottom:8px">${win?'DEBT CRUSHED — YOU SURVIVED!':'OVERWHELMED BY DEBT'}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:2rem;margin:0 0 6px;color:#fff">${score} pts</h1>
      <p style="color:rgba(255,255,255,.65);margin:0 0 18px;font-size:.9rem">${G.kills} debts crushed · survived ${survived}s${G.bossDead?' · 👹 Titan slain':''} · +${score} 🪙</p>
      <button onclick="dsRestart()" style="padding:13px 26px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#2d1b1b;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;font-weight:900;cursor:pointer">▶ FIGHT AGAIN</button>
      <button onclick="dsExit()" style="padding:13px 26px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
    </div>`;
  }

  window.dsRestart=function(){ reset(); const o=document.getElementById('dsOver'); if(o){o.style.display='none';o.innerHTML='';} dsBoot(); };
  window.dsExit=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); G=null; if(window.state)state.viewingWorld='rebuilder'; goTo('hub'); };
})();
