/* ════════════════════════════════════════════════════════════════
   FICO RACER — TRUE 3D (three.js) — CredTech Galaxy
   Real 3D perspective road, a rotating/banking car model, and 3D
   spinning pickups flying toward the camera. Grab good credit (blue
   cards / coins / ✅), dodge bad (red cards / barriers). FICO = speed.
   Self-contained: lazy-loads three.js from CDN on first play.
   Overrides the stub window.SCREENS.game_ficoracer.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const LANES=[-2.4,0,2.4], CARZ=3.2, SPAWNZ=-120, KILLZ=10, DUR=80, GOAL=4000;
  let G=null, raf=null;

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
    return `<div style="position:absolute;inset:0;background:#05060f;overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div id="fr3dWrap" style="position:absolute;inset:0">
        <div id="fr3dLoad" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.2em">
          <div style="font-size:2rem">🏎️</div>LOADING 3D ENGINE…
        </div>
      </div>
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(180deg,rgba(5,6,15,.85),transparent);pointer-events:none">
        <button onclick="frExit()" style="pointer-events:auto;padding:7px 14px;border:1px solid rgba(56,189,248,.4);border-radius:9px;background:rgba(56,189,248,.1);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← CREDTECH</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.2em;color:#38bdf8;flex:1;text-align:center">🏎️ FICO RACER · 3D</div>
        <div id="frTime" style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fbbf24;min-width:46px;text-align:right">${DUR}s</div>
      </div>
      <div style="position:absolute;top:52px;left:18px;right:18px;z-index:5;pointer-events:none">
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.6);margin-bottom:3px"><span>FICO SCORE</span><span id="frFicoTxt">650</span></div>
        <div style="height:9px;border-radius:5px;background:rgba(255,255,255,.12);overflow:hidden;border:1px solid rgba(56,189,248,.25)"><div id="frFicoBar" style="height:100%;width:64%;background:linear-gradient(90deg,#ef4444,#f59e0b,#fbbf24,#34d399);transition:width .25s"></div></div>
        <div style="display:flex;gap:8px;margin-top:8px">
          ${stat('DISTANCE','frDist','#7dd3fc')}${stat('SCORE','frScore','#fbbf24')}${stat('COINS','frCoins','#fff')}
        </div>
      </div>
      <div style="position:absolute;left:0;right:0;bottom:16px;text-align:center;z-index:4;font-family:'Orbitron',sans-serif;font-size:.52rem;letter-spacing:.14em;color:rgba(255,255,255,.45);pointer-events:none">← → / swipe / tap sides to STEER · grab 💳✅🪙 · dodge 🟥🚧</div>
      <div id="frOver" style="position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;background:rgba(5,6,15,.82);backdrop-filter:blur(4px)"></div>
    </div>`;
  };
  function stat(l,id,c){ return `<div style="flex:1;text-align:center;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.18);border-radius:9px;padding:5px"><div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.45)">${l}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:1rem;color:${c}">0</div></div>`; }

  function boot(){
    const wrap=document.getElementById('fr3dWrap'); if(!wrap||!window.THREE) return;
    const ld=document.getElementById('fr3dLoad'); if(ld) ld.remove();
    const T=window.THREE;
    const W=wrap.clientWidth, H=wrap.clientHeight;
    const scene=new T.Scene(); scene.background=new T.Color(0x05060f); scene.fog=new T.Fog(0x05060f,45,115);
    const cam=new T.PerspectiveCamera(70,W/H,0.1,300); cam.position.set(0,3.6,8); cam.lookAt(0,1,-14);
    const rndr=new T.WebGLRenderer({antialias:true}); rndr.setPixelRatio(Math.min(2,devicePixelRatio)); rndr.setSize(W,H); wrap.appendChild(rndr.domElement);

    scene.add(new T.AmbientLight(0x6688cc,0.7));
    const dir=new T.DirectionalLight(0xffffff,0.9); dir.position.set(4,10,6); scene.add(dir);
    const pt=new T.PointLight(0x38bdf8,1.4,40); pt.position.set(0,5,6); scene.add(pt);

    const road=new T.Mesh(new T.PlaneGeometry(9,400), new T.MeshStandardMaterial({color:0x0a1230,roughness:.9,metalness:.1}));
    road.rotation.x=-Math.PI/2; road.position.z=-160; scene.add(road);
    const railMat=new T.MeshBasicMaterial({color:0x38bdf8});
    [-4.5,4.5].forEach(x=>{ const r=new T.Mesh(new T.BoxGeometry(0.16,0.5,400),railMat); r.position.set(x,0.25,-160); scene.add(r); });
    const dashMat=new T.MeshBasicMaterial({color:0xbcd4ff,transparent:true,opacity:.55});
    const dashes=[]; const DASH_N=28, DASH_GAP=6;
    for(let i=0;i<DASH_N;i++){ for(const lx of [-1.2,1.2]){ const d=new T.Mesh(new T.BoxGeometry(0.14,0.02,2.4),dashMat); d.position.set(lx,0.02,-i*DASH_GAP); scene.add(d); dashes.push(d); } }
    const rungMat=new T.MeshBasicMaterial({color:0x14315e});
    const rungs=[]; const RUNG_N=44, RUNG_GAP=5;
    for(let i=0;i<RUNG_N;i++){ const r=new T.Mesh(new T.BoxGeometry(9,0.02,0.1),rungMat); r.position.set(0,0.011,-i*RUNG_GAP); scene.add(r); rungs.push(r); }
    const starGeo=new T.BufferGeometry(); const sv=[];
    for(let i=0;i<400;i++){ sv.push((Math.random()-.5)*200,Math.random()*80+5,-Math.random()*200); }
    starGeo.setAttribute('position',new T.Float32BufferAttribute(sv,3));
    scene.add(new T.Points(starGeo,new T.PointsMaterial({color:0x9fd8ff,size:.5})));

    // car
    const car=new T.Group();
    const bodyMat=new T.MeshStandardMaterial({color:0xe11d48,metalness:.6,roughness:.3,emissive:0x3a0010});
    const body=new T.Mesh(new T.BoxGeometry(1.5,0.45,2.8),bodyMat); body.position.y=0.45; car.add(body);
    const cabin=new T.Mesh(new T.BoxGeometry(1.1,0.5,1.3),new T.MeshStandardMaterial({color:0x0b1022,metalness:.4,roughness:.2,emissive:0x0a1830})); cabin.position.set(0,0.85,-0.1); car.add(cabin);
    const nose=new T.Mesh(new T.BoxGeometry(1.2,0.2,0.7),bodyMat); nose.position.set(0,0.4,-1.5); car.add(nose);
    const wing=new T.Mesh(new T.BoxGeometry(1.7,0.08,0.5),new T.MeshStandardMaterial({color:0x111111,emissive:0x38bdf8,emissiveIntensity:.5})); wing.position.set(0,0.7,1.4); car.add(wing);
    [-0.7,0.7].forEach(x=>{ const tl=new T.Mesh(new T.BoxGeometry(0.3,0.12,0.08),new T.MeshBasicMaterial({color:0xff3b3b})); tl.position.set(x,0.5,1.45); car.add(tl); });
    const wheelGeo=new T.CylinderGeometry(0.34,0.34,0.3,16); const wheelMat=new T.MeshStandardMaterial({color:0x0a0a12,roughness:.8});
    const wheels=[];
    [[-0.8,-0.95],[0.8,-0.95],[-0.8,1.0],[0.8,1.0]].forEach(([x,z])=>{ const w=new T.Mesh(wheelGeo,wheelMat); w.rotation.z=Math.PI/2; w.position.set(x,0.34,z); car.add(w); wheels.push(w); });
    car.position.set(0,0,CARZ); scene.add(car);
    const underglow=new T.PointLight(0xff2d55,1.2,6); underglow.position.set(0,0.2,CARZ); scene.add(underglow);

    G={ T,scene,cam,rndr,wrap, car,wheels,dashes,rungs, dead:false,phase:'play',
        lane:1, carX:0, fico:650, score:0, dist:0, coins:0, time:DUR,
        items:[], spawnT:0, speed:34, shake:0, last:performance.now(),
        DASH_SPAN:DASH_N*DASH_GAP, RUNG_SPAN:RUNG_N*RUNG_GAP };

    const lane=(d)=>{ if(!G||G.phase!=='play')return; G.lane=Math.max(0,Math.min(2,G.lane+d)); };
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
    good:[{e:'card',c:0x2563eb,fico:14,sc:120,coin:0},{e:'coin',c:0xfbbf24,fico:4,sc:80,coin:1},{e:'token',c:0x22c55e,fico:18,sc:150,coin:0}],
    bad:[{e:'card',c:0xef4444,fico:-22,sc:-60,coin:0},{e:'barrier',c:0xf97316,fico:-16,sc:-40,coin:0}]
  };
  function spawn(){
    const T=G.T; const lane=Math.floor(Math.random()*3);
    const bad=Math.random()<(0.32+Math.min(0.2,G.dist/12000));
    const def=bad?ITEMS.bad[Math.floor(Math.random()*ITEMS.bad.length)]:ITEMS.good[Math.floor(Math.random()*ITEMS.good.length)];
    let mesh;
    if(def.e==='coin'){ mesh=new T.Mesh(new T.CylinderGeometry(0.6,0.6,0.14,24),new T.MeshStandardMaterial({color:def.c,metalness:.8,roughness:.25,emissive:0x553300,emissiveIntensity:.4})); mesh.rotation.x=Math.PI/2; mesh.position.y=0.9; }
    else if(def.e==='barrier'){ mesh=new T.Mesh(new T.BoxGeometry(1.8,0.9,0.4),new T.MeshStandardMaterial({color:def.c,emissive:0x401500,emissiveIntensity:.6,metalness:.3,roughness:.5})); mesh.position.y=0.45; }
    else { mesh=new T.Mesh(new T.BoxGeometry(1.0,1.4,0.12),new T.MeshStandardMaterial({color:def.c,emissive:def.c,emissiveIntensity:.45,metalness:.4,roughness:.3})); mesh.position.y=0.9; }
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
      G.speed=22+(G.fico-300)/550*42;
      G.dist+=G.speed*dt;
      const tx=LANES[G.lane];
      const prevX=G.carX; G.carX+=(tx-G.carX)*Math.min(1,dt*9);
      const dx=G.carX-prevX;
      G.car.position.x=G.carX;
      G.car.rotation.y=lerp(G.car.rotation.y,(tx-G.carX)*-0.5+dx*-4.5,0.18);
      G.car.rotation.z=lerp(G.car.rotation.z,Math.max(-0.5,Math.min(0.5,dx*-6)),0.18);
      G.car.position.y=Math.sin(now*0.006)*0.03;
      G.wheels.forEach(w=>w.rotation.x-=G.speed*dt*0.5);
      const mv=G.speed*dt;
      G.dashes.forEach(d=>{ d.position.z+=mv; if(d.position.z>CARZ+6) d.position.z-=G.DASH_SPAN; });
      G.rungs.forEach(r=>{ r.position.z+=mv; if(r.position.z>CARZ+6) r.position.z-=G.RUNG_SPAN; });
      G.spawnT-=dt; if(G.spawnT<=0){ G.spawnT=Math.max(0.42,0.95-G.dist/9000); spawn(); }
      for(const it of G.items){
        it.mesh.position.z+=mv;
        if(it.def.e==='coin') it.mesh.rotation.z+=dt*4; else it.mesh.rotation.y+=it.spin*dt*2.2;
        if(!it.hit && Math.abs(it.mesh.position.z-CARZ)<1.4 && it.lane===G.lane){
          it.hit=true; it.dead=1;
          if(it.bad){ G.fico=Math.max(300,G.fico+it.def.fico); G.score=Math.max(0,G.score+it.def.sc); G.speed*=0.55; G.shake=0.5; flash('#ef4444'); float(it.def.fico+' FICO','#fca5a5'); }
          else { G.fico=Math.min(850,G.fico+it.def.fico); G.score+=it.def.sc; if(it.def.coin) G.coins+=10; flash('#34d399'); float('+'+it.def.sc,'#fde68a'); }
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
  function setT(id,v){ const e=document.getElementById(id); if(e)e.textContent=v; }
  function flash(c){ const w=document.getElementById('fr3dWrap'); if(!w)return; const f=document.createElement('div'); f.style.cssText='position:absolute;inset:0;pointer-events:none;background:'+c+';opacity:.22;transition:opacity .4s'; w.appendChild(f); requestAnimationFrame(()=>f.style.opacity='0'); setTimeout(()=>f.remove(),420); }
  function float(t,c){ const w=document.getElementById('fr3dWrap'); if(!w)return; const el=document.createElement('div'); el.textContent=t; el.style.cssText='position:absolute;left:50%;top:60%;transform:translateX(-50%);pointer-events:none;font-family:Inter,sans-serif;font-weight:800;font-size:1.1rem;color:'+c+';text-shadow:0 2px 8px #000;transition:all .8s'; w.appendChild(el); requestAnimationFrame(()=>{ el.style.top='48%'; el.style.opacity='0'; }); setTimeout(()=>el.remove(),820); }

  function end(win){
    if(!G||G.phase==='over') return; G.phase='over';
    const won=win||G.score>=GOAL;
    if(window.state){ const rw=G.score+G.coins; state.coins=(state.coins||0)+rw; if(window.cvAddXP)cvAddXP(Math.round(rw/4),0); else if(window.cvSave)cvSave(); state.gamesDone=state.gamesDone||{}; state.gamesDone['credtech:0']=1; }
    const tier=G.fico>=800?'Platinum':G.fico>=750?'Elite':G.fico>=700?'Prime':G.fico>=600?'Builder':'Recovery';
    const o=document.getElementById('frOver'); if(!o)return; o.style.display='flex';
    o.innerHTML=`<div style="max-width:420px;text-align:center;padding:32px 26px;border:1px solid ${won?'#fbbf24':'#38bdf8'};border-radius:22px;background:linear-gradient(160deg,rgba(10,16,40,.97),rgba(5,6,15,.97));box-shadow:0 0 60px rgba(56,189,248,.4)">
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
  window.frRestart=function(){ teardown(); G=null; const o=document.getElementById('frOver'); if(o){o.style.display='none';o.innerHTML='';} ensureThree(boot); };
  window.frExit=function(){ teardown(); G=null; if(window.state)state.viewingWorld='credtech'; goTo('hub'); };
})();
