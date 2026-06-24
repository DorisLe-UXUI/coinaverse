/* ════════════════════════════════════════════════════════════════
   FICO RACER — 3D (three.js) — CredTech Galaxy
   • Cosmic VIDEO background (transparent WebGL over a galaxy video)
   • Sleek 3D sports-car model (banks/rotates on lane change)
   • LEARN WHILE PLAYING: facts pop on pickups + Knowledge Gates
     (one lesson card at a time — tap GOT IT to keep racing)
   ════════════════════════════════════════════════════════════════ */
(function(){
  const LANES=[-2.4,0,2.4], CARZ=3.2, SPAWNZ=-120, KILLZ=10, DUR=80, GOAL=4000;
  const COSMIC='https://github.com/DorisLe-UXUI/coinaverse-assets/releases/download/v1.0/credtech_hub.mp4';
  let G=null, raf=null;

  const FACTS=[
    ['💳','Pay your FULL balance each month — you skip interest and build trust.'],
    ['📊','Utilization: keep what you owe under 30% of your card limit.'],
    ['🗓️','Payment history is 35% of your FICO — never miss a due date.'],
    ['⏳','Older accounts help your score — keep your first card open.'],
    ['🚫','Buy-Now-Pay-Later traps add up fast. Only buy what you can repay.'],
    ['🔁','Opening many new cards at once can lower your score.'],
    ['🛡️','Check your credit report every year for errors or fraud.'],
    ['📈','On-time payments + low balances = a rising credit score.'],
  ];

  window.frInit=function(){ G=null; };

  function ensureThree(cb){
    if(window.THREE) return cb();
    if(window._three3dQ){ window._three3dQ.push(cb); return; }
    window._three3dQ=[cb];
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload=()=>{ const q=window._three3dQ; window._three3dQ=null; q.forEach(f=>f()); };
    s.onerror=()=>{ const w=document.getElementById('fr3dWrap'); if(w) w.innerHTML='<div style="color:#fff;text-align:center;padding-top:40vh;font-family:Orbitron">3D engine failed to load — check connection.</div>'; };
    document.head.appendChild(s);
  }

  window.SCREENS.game_ficoracer=function(){
    setTimeout(()=>ensureThree(boot),30);
    return `<div style="position:absolute;inset:0;background:#03040c;overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <video id="frBgVid" autoplay loop muted playsinline poster="assets/bg/cosmic_main.jpeg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.95;z-index:0"><source src="${COSMIC}" type="video/mp4"></video>
      <div style="position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse at 50% 45%,transparent 45%,rgba(3,4,12,.45) 85%)"></div>
      <div id="fr3dWrap" style="position:absolute;inset:0;z-index:1">
        <div id="fr3dLoad" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.2em"><div style="font-size:2rem">🏎️</div>LOADING 3D ENGINE…</div>
      </div>
      <img id="frCar" src="assets/games/car.png" style="position:absolute;left:50%;bottom:0;width:min(34vw,420px);z-index:3;transform:translateX(-50%);transition:transform .18s cubic-bezier(.34,1.2,.64,1);pointer-events:none;filter:drop-shadow(0 14px 34px rgba(0,0,0,.7))">
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(180deg,rgba(3,4,12,.8),transparent);pointer-events:none">
        <button onclick="frExit()" style="pointer-events:auto;padding:7px 14px;border:1px solid rgba(56,189,248,.4);border-radius:9px;background:rgba(56,189,248,.12);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← CREDTECH</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.2em;color:#38bdf8;flex:1;text-align:center;text-shadow:0 0 12px rgba(56,189,248,.6)">🏎️ FICO RACER · 3D</div>
        <div id="frTime" style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fbbf24;min-width:46px;text-align:right">${DUR}s</div>
      </div>
      <div style="position:absolute;top:52px;left:18px;right:18px;z-index:5;pointer-events:none">
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.7);margin-bottom:3px"><span>FICO SCORE</span><span id="frFicoTxt">650</span></div>
        <div style="height:9px;border-radius:5px;background:rgba(0,0,0,.4);overflow:hidden;border:1px solid rgba(56,189,248,.3)"><div id="frFicoBar" style="height:100%;width:64%;background:linear-gradient(90deg,#ef4444,#f59e0b,#fbbf24,#34d399);transition:width .25s"></div></div>
        <div style="display:flex;gap:8px;margin-top:8px">${stat('DISTANCE','frDist','#7dd3fc')}${stat('SCORE','frScore','#fbbf24')}${stat('COINS','frCoins','#fff')}</div>
      </div>
      <div id="frFact" style="position:absolute;left:50%;top:120px;transform:translateX(-50%);z-index:6;max-width:80%;display:none;pointer-events:none"></div>
      <div style="position:absolute;left:0;right:0;bottom:16px;text-align:center;z-index:4;font-family:'Orbitron',sans-serif;font-size:.52rem;letter-spacing:.14em;color:rgba(255,255,255,.5);pointer-events:none">← → / swipe / tap sides to STEER · grab 💳✅🪙 · dodge 🟥🚧 · learn as you race</div>
      <div id="frGate" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.86);backdrop-filter:blur(5px);padding:22px"></div>
      <div id="frOver" style="position:absolute;inset:0;z-index:10;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.85);backdrop-filter:blur(4px)"></div>
    </div>`;
  };
  function stat(l,id,c){ return `<div style="flex:1;text-align:center;background:rgba(10,16,40,.55);border:1px solid rgba(56,189,248,.2);border-radius:9px;padding:5px"><div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.5)">${l}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:1rem;color:${c}">0</div></div>`; }

  function buildCar(T){
    const car=new T.Group();
    const red=new T.MeshStandardMaterial({color:0xe11d48,metalness:.75,roughness:.22,emissive:0x37000f,emissiveIntensity:.5});
    const dark=new T.MeshStandardMaterial({color:0x0b1022,metalness:.5,roughness:.25});
    const glass=new T.MeshStandardMaterial({color:0x0a1c33,metalness:.9,roughness:.05,emissive:0x0a2540,emissiveIntensity:.6});
    const neon=new T.MeshBasicMaterial({color:0x38bdf8});
    // low wide chassis (tapered: narrower at front)
    const chassis=new T.Mesh(new T.BoxGeometry(1.7,0.32,3.2),red); chassis.position.y=0.4; car.add(chassis);
    const floor=new T.Mesh(new T.BoxGeometry(1.5,0.2,3.0),dark); floor.position.y=0.24; car.add(floor);
    // sloped nose
    const nose=new T.Mesh(new T.BoxGeometry(1.5,0.22,1.0),red); nose.position.set(0,0.36,-1.7); nose.rotation.x=-0.12; car.add(nose);
    const splitter=new T.Mesh(new T.BoxGeometry(1.8,0.06,0.4),dark); splitter.position.set(0,0.2,-2.05); car.add(splitter);
    // cockpit canopy (sleek glass)
    const canopy=new T.Mesh(new T.BoxGeometry(1.05,0.42,1.5),glass); canopy.position.set(0,0.78,-0.1); car.add(canopy);
    const canopyTop=new T.Mesh(new T.BoxGeometry(0.9,0.1,1.2),dark); canopyTop.position.set(0,1.0,-0.1); car.add(canopyTop);
    // side pods
    [-0.92,0.92].forEach(x=>{ const pod=new T.Mesh(new T.BoxGeometry(0.28,0.34,1.8),red); pod.position.set(x,0.45,0.1); car.add(pod); });
    // rear wing
    const wingPost1=new T.Mesh(new T.BoxGeometry(0.1,0.4,0.1),dark); wingPost1.position.set(-0.5,0.85,1.5); car.add(wingPost1);
    const wingPost2=wingPost1.clone(); wingPost2.position.x=0.5; car.add(wingPost2);
    const wing=new T.Mesh(new T.BoxGeometry(1.9,0.08,0.55),new T.MeshStandardMaterial({color:0x111316,emissive:0x38bdf8,emissiveIntensity:.7,metalness:.4,roughness:.3})); wing.position.set(0,1.05,1.55); car.add(wing);
    // tail lights
    [-0.55,0.55].forEach(x=>{ const tl=new T.Mesh(new T.BoxGeometry(0.34,0.13,0.06),new T.MeshBasicMaterial({color:0xff2d55})); tl.position.set(x,0.5,1.62); car.add(tl); });
    // head lights
    [-0.5,0.5].forEach(x=>{ const hl=new T.Mesh(new T.BoxGeometry(0.28,0.1,0.06),new T.MeshBasicMaterial({color:0xbfe9ff})); hl.position.set(x,0.42,-2.04); car.add(hl); });
    // wheels (big rear, glowing rims)
    const wheels=[];
    const mkWheel=(x,z,r)=>{ const g=new T.Group();
      const tire=new T.Mesh(new T.CylinderGeometry(r,r,0.34,20),new T.MeshStandardMaterial({color:0x07070d,roughness:.85})); tire.rotation.z=Math.PI/2; g.add(tire);
      const rim=new T.Mesh(new T.TorusGeometry(r*0.62,0.05,8,20),neon); rim.rotation.y=Math.PI/2; g.add(rim);
      g.position.set(x,r,z); car.add(g); wheels.push(g); };
    mkWheel(-0.92,-1.05,0.36); mkWheel(0.92,-1.05,0.36); mkWheel(-0.95,1.15,0.44); mkWheel(0.95,1.15,0.44);
    return {car,wheels};
  }

  function boot(){
    const wrap=document.getElementById('fr3dWrap'); if(!wrap||!window.THREE) return;
    const ld=document.getElementById('fr3dLoad'); if(ld) ld.remove();
    const T=window.THREE;
    const W=wrap.clientWidth, H=wrap.clientHeight;
    const scene=new T.Scene(); scene.fog=new T.Fog(0x0a1230,55,125);
    const cam=new T.PerspectiveCamera(70,W/H,0.1,300); cam.position.set(0,3.6,8); cam.lookAt(0,1,-14);
    const rndr=new T.WebGLRenderer({antialias:true,alpha:true}); rndr.setClearColor(0x000000,0);
    rndr.setPixelRatio(Math.min(2,devicePixelRatio)); rndr.setSize(W,H); wrap.appendChild(rndr.domElement);

    scene.add(new T.AmbientLight(0x88aadd,0.85));
    const dir=new T.DirectionalLight(0xffffff,1.0); dir.position.set(4,10,6); scene.add(dir);
    const pt=new T.PointLight(0x38bdf8,1.6,46); pt.position.set(0,6,6); scene.add(pt);
    const rim=new T.PointLight(0xff2d55,1.1,18); rim.position.set(0,2,10); scene.add(rim);

    const road=new T.Mesh(new T.PlaneGeometry(9,400), new T.MeshStandardMaterial({color:0x0a1633,roughness:.85,metalness:.2,transparent:true,opacity:.96}));
    road.rotation.x=-Math.PI/2; road.position.z=-160; scene.add(road);
    const railMat=new T.MeshBasicMaterial({color:0x38bdf8});
    [-4.5,4.5].forEach(x=>{ const r=new T.Mesh(new T.BoxGeometry(0.16,0.5,400),railMat); r.position.set(x,0.25,-160); scene.add(r); });
    const dashMat=new T.MeshBasicMaterial({color:0xbcd4ff,transparent:true,opacity:.6});
    const dashes=[]; const DASH_N=28, DASH_GAP=6;
    for(let i=0;i<DASH_N;i++){ for(const lx of [-1.2,1.2]){ const d=new T.Mesh(new T.BoxGeometry(0.14,0.02,2.4),dashMat); d.position.set(lx,0.02,-i*DASH_GAP); scene.add(d); dashes.push(d); } }
    const rungMat=new T.MeshBasicMaterial({color:0x1b3a66,transparent:true,opacity:.5});
    const rungs=[]; const RUNG_N=44, RUNG_GAP=5;
    for(let i=0;i<RUNG_N;i++){ const r=new T.Mesh(new T.BoxGeometry(9,0.02,0.1),rungMat); r.position.set(0,0.011,-i*RUNG_GAP); scene.add(r); rungs.push(r); }

    const underglow=new T.PointLight(0xff2d55,1.1,9); underglow.position.set(0,0.4,CARZ+1); scene.add(underglow);
    const bv=document.getElementById('frBgVid'); if(bv&&bv.play){ bv.play().catch(()=>{}); }   // ensure cosmic video runs

    G={ T,scene,cam,rndr,wrap, dashes,rungs, dead:false,phase:'play',
        lane:1, fico:650, score:0, dist:0, coins:0, time:DUR,
        items:[], spawnT:0, speed:34, shake:0, last:performance.now(),
        DASH_SPAN:DASH_N*DASH_GAP, RUNG_SPAN:RUNG_N*RUNG_GAP, gateT:16, gateIdx:0 };
    updateCar(0);

    const lane=(d)=>{ if(!G||G.phase!=='play')return; const p=G.lane; G.lane=Math.max(0,Math.min(2,G.lane+d)); if(G.lane!==p) updateCar(G.lane>p?1:-1); };
    G.lane2=lane;
    G.kd=e=>{ if(e.key==='ArrowLeft')lane(-1); else if(e.key==='ArrowRight')lane(1); };
    window.addEventListener('keydown',G.kd);
    const cv=rndr.domElement; G.tsx=null;
    cv.addEventListener('touchstart',e=>{ G.tsx=e.touches[0].clientX; },{passive:true});
    cv.addEventListener('touchend',e=>{ if(G.tsx==null)return; const dx=e.changedTouches[0].clientX-G.tsx; if(Math.abs(dx)>24) lane(dx>0?1:-1); else { const r=cv.getBoundingClientRect(); lane(e.changedTouches[0].clientX<r.left+r.width/2?-1:1); } G.tsx=null; },{passive:true});
    cv.addEventListener('mousedown',e=>{ const r=cv.getBoundingClientRect(); lane(e.clientX<r.left+r.width/2?-1:1); });
    G.onResize=()=>{ if(!G||G.dead)return; const w=wrap.clientWidth,h=wrap.clientHeight; G.cam.aspect=w/h; G.cam.updateProjectionMatrix(); G.rndr.setSize(w,h); };
    window.addEventListener('resize',G.onResize);

    G.last=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  const ITEMS={
    good:[{e:'card',c:0x2563eb,fico:14,sc:120,coin:0,fact:'💳 Smart! Used responsibly, a card builds credit.'},{e:'coin',c:0xfbbf24,fico:4,sc:80,coin:1,fact:'🪙 Rewards add up when you pay on time.'},{e:'token',c:0x22c55e,fico:18,sc:150,coin:0,fact:'✅ On-time payment — the #1 way to raise your FICO!'}],
    bad:[{e:'card',c:0xef4444,fico:-22,sc:-60,coin:0,fact:'🟥 Maxing a card spikes utilization — score drops.'},{e:'barrier',c:0xf97316,fico:-16,sc:-40,coin:0,fact:'🚧 A missed/late payment dents your credit.'}]
  };
  function spawn(){
    const T=G.T; const lane=Math.floor(Math.random()*3);
    const bad=Math.random()<(0.32+Math.min(0.2,G.dist/12000));
    const def=bad?ITEMS.bad[Math.floor(Math.random()*ITEMS.bad.length)]:ITEMS.good[Math.floor(Math.random()*ITEMS.good.length)];
    let mesh;
    if(def.e==='coin'){ mesh=new T.Mesh(new T.CylinderGeometry(0.6,0.6,0.14,24),new T.MeshStandardMaterial({color:def.c,metalness:.85,roughness:.2,emissive:0x553300,emissiveIntensity:.5})); mesh.rotation.x=Math.PI/2; mesh.position.y=0.9; }
    else if(def.e==='barrier'){ mesh=new T.Mesh(new T.BoxGeometry(1.8,0.9,0.4),new T.MeshStandardMaterial({color:def.c,emissive:0x401500,emissiveIntensity:.7,metalness:.3,roughness:.5})); mesh.position.y=0.45; }
    else { mesh=new T.Mesh(new T.BoxGeometry(1.0,1.4,0.12),new T.MeshStandardMaterial({color:def.c,emissive:def.c,emissiveIntensity:.55,metalness:.4,roughness:.3})); mesh.position.y=0.9; }
    mesh.position.x=LANES[lane]; mesh.position.z=SPAWNZ;
    G.scene.add(mesh);
    G.items.push({mesh,lane,def,bad,spin:(Math.random()*0.6+0.4)*(Math.random()<.5?-1:1),dead:0,hit:false});
  }

  function loop(now){
    const wrap=document.getElementById('fr3dWrap');
    if(!G||G.dead||!wrap){ cancelAnimationFrame(raf); return; }
    let dt=Math.min(40,now-G.last)/1000; G.last=now;
    if(G.phase==='play'){
      G.time-=dt; if(G.time<=0){ G.time=0; return end(); }
      const tEl=document.getElementById('frTime'); if(tEl) tEl.textContent=Math.ceil(G.time)+'s';
      // knowledge gate every ~16s
      G.gateT-=dt; if(G.gateT<=0){ openGate(); }
      G.speed=22+(G.fico-300)/550*42;
      G.dist+=G.speed*dt;
      const mv=G.speed*dt;
      G.dashes.forEach(d=>{ d.position.z+=mv; if(d.position.z>CARZ+6) d.position.z-=G.DASH_SPAN; });
      G.rungs.forEach(r=>{ r.position.z+=mv; if(r.position.z>CARZ+6) r.position.z-=G.RUNG_SPAN; });
      G.spawnT-=dt; if(G.spawnT<=0){ G.spawnT=Math.max(0.42,0.95-G.dist/9000); spawn(); }
      for(const it of G.items){
        it.mesh.position.z+=mv;
        if(it.def.e==='coin') it.mesh.rotation.z+=dt*4; else it.mesh.rotation.y+=it.spin*dt*2.2;
        if(!it.hit && Math.abs(it.mesh.position.z-CARZ)<1.4 && it.lane===G.lane){
          it.hit=true; it.dead=1;
          if(it.bad){ G.fico=Math.max(300,G.fico+it.def.fico); G.score=Math.max(0,G.score+it.def.sc); G.speed*=0.55; G.shake=0.5; flash('#ef4444'); }
          else { G.fico=Math.min(850,G.fico+it.def.fico); G.score+=it.def.sc; if(it.def.coin) G.coins+=10; flash('#34d399'); }
          showFact(it.def.fact, it.bad);
        } else if(it.mesh.position.z>KILLZ){ it.dead=1; }
      }
      G.items=G.items.filter(it=>{ if(it.dead){ G.scene.remove(it.mesh); it.mesh.geometry.dispose(); it.mesh.material.dispose(); return false; } return true; });
      if(G.shake>0){ G.shake-=dt; G.cam.position.x=(Math.random()-.5)*G.shake*1.2; G.cam.position.y=3.6+(Math.random()-.5)*G.shake; } else { G.cam.position.x*=0.8; G.cam.position.y=3.6; }
      setT('frFicoTxt',Math.round(G.fico)); const fb=document.getElementById('frFicoBar'); if(fb) fb.style.width=((G.fico-300)/550*100)+'%';
      setT('frDist',Math.round(G.dist)+'m'); setT('frScore',G.score); setT('frCoins',G.coins);
      if(G.score>=GOAL) return end(true);
    }
    G.rndr.render(G.scene,G.cam);
    raf=requestAnimationFrame(loop);
  }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function updateCar(dir){ const c=document.getElementById('frCar'); if(!c||!G)return; const off=(G.lane-1)*23;
    c.style.transform='translateX(calc(-50% + '+off+'vw)) rotate('+(dir*10)+'deg)';
    clearTimeout(G._carT); G._carT=setTimeout(()=>{ const c2=document.getElementById('frCar'); if(c2&&G) c2.style.transform='translateX(calc(-50% + '+off+'vw)) rotate(0deg)'; },180); }
  function setT(id,v){ const e=document.getElementById(id); if(e)e.textContent=v; }
  function flash(c){ const w=document.getElementById('fr3dWrap'); if(!w)return; const f=document.createElement('div'); f.style.cssText='position:absolute;inset:0;pointer-events:none;background:'+c+';opacity:.2;transition:opacity .4s'; w.appendChild(f); requestAnimationFrame(()=>f.style.opacity='0'); setTimeout(()=>f.remove(),420); }
  function showFact(txt,bad){ const el=document.getElementById('frFact'); if(!el||!txt)return;
    el.style.display='block';
    el.innerHTML=`<div style="background:rgba(3,4,12,.82);border:1px solid ${bad?'rgba(239,68,68,.6)':'rgba(52,211,153,.6)'};border-radius:12px;padding:9px 16px;font-size:.82rem;color:#fff;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.5)">${txt}</div>`;
    clearTimeout(window._frFactT); window._frFactT=setTimeout(()=>{ const e=document.getElementById('frFact'); if(e)e.style.display='none'; },2200);
  }

  function openGate(){
    if(!G||G.phase!=='play')return; G.phase='gate';
    const f=FACTS[G.gateIdx%FACTS.length]; G.gateIdx++;
    const o=document.getElementById('frGate'); if(!o){ G.phase='play'; return; }
    o.style.display='flex';
    o.innerHTML=`<div style="max-width:440px;text-align:center;padding:30px 26px;border:1px solid #38bdf8;border-radius:22px;background:linear-gradient(160deg,rgba(10,16,40,.97),rgba(3,4,12,.97));box-shadow:0 0 50px rgba(56,189,248,.4);animation:frGateIn .35s ease">
      <style>@keyframes frGateIn{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}</style>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.2em;color:#7dd3fc;margin-bottom:10px">⛩️ KNOWLEDGE GATE · CREDIT TIP</div>
      <div style="font-size:2.4rem;margin-bottom:8px">${f[0]}</div>
      <p style="font-size:1.02rem;line-height:1.5;color:#fff;margin:0 0 18px">${f[1]}</p>
      <button onclick="frGateGo()" style="padding:13px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.12em;font-weight:900;cursor:pointer">GOT IT → +50 FICO</button>
    </div>`;
  }
  window.frGateGo=function(){ if(!G)return; G.fico=Math.min(850,G.fico+50); G.score+=60; G.gateT=16; G.phase='play'; const o=document.getElementById('frGate'); if(o){o.style.display='none';o.innerHTML='';} flash('#38bdf8'); };

  function end(win){
    if(!G||G.phase==='over') return; G.phase='over';
    const won=win||G.score>=GOAL;
    if(window.state){ const rw=G.score+G.coins; state.coins=(state.coins||0)+rw; if(window.cvAddXP)cvAddXP(Math.round(rw/4),0); else if(window.cvSave)cvSave(); state.gamesDone=state.gamesDone||{}; state.gamesDone['credtech:0']=1; }
    const tier=G.fico>=800?'Platinum':G.fico>=750?'Elite':G.fico>=700?'Prime':G.fico>=600?'Builder':'Recovery';
    const o=document.getElementById('frOver'); if(!o)return; o.style.display='flex';
    o.innerHTML=`<div style="max-width:420px;text-align:center;padding:32px 26px;border:1px solid ${won?'#fbbf24':'#38bdf8'};border-radius:22px;background:linear-gradient(160deg,rgba(10,16,40,.97),rgba(3,4,12,.97));box-shadow:0 0 60px rgba(56,189,248,.4)">
      <div style="font-size:3rem;margin-bottom:6px">${won?'🏁':'🏎️'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:${won?'#fbbf24':'#38bdf8'};margin-bottom:8px">${won?'RACE WON!':'FINISH LINE'}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:2rem;margin:0 0 4px">${G.score} pts</h1>
      <p style="color:rgba(255,255,255,.7);margin:0 0 16px;font-size:.9rem">FICO ${Math.round(G.fico)} · ${tier} tier · ${Math.round(G.dist)}m · +${G.score+G.coins} 🪙</p>
      <button onclick="frRestart()" style="padding:13px 26px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;font-weight:900;cursor:pointer">▶ RACE AGAIN</button>
      <button onclick="frExit()" style="padding:13px 26px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
    </div>`;
  }

  function teardown(){
    if(!G) return; G.dead=true; cancelAnimationFrame(raf);
    if(G.kd) window.removeEventListener('keydown',G.kd);
    if(G.onResize) window.removeEventListener('resize',G.onResize);
    try{ G.scene.traverse(o=>{ if(o.geometry)o.geometry.dispose(); if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose()); } }); G.rndr.dispose(); if(G.rndr.domElement&&G.rndr.domElement.parentNode) G.rndr.domElement.parentNode.removeChild(G.rndr.domElement); }catch(e){}
  }
  window.frRestart=function(){ teardown(); G=null; ['frGate','frOver'].forEach(id=>{const o=document.getElementById(id);if(o){o.style.display='none';o.innerHTML='';}}); ensureThree(boot); };
  window.frExit=function(){ teardown(); G=null; if(window.state)state.viewingWorld='credtech'; goTo('hub'); };
})();
