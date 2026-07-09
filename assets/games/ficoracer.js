/* ════════════════════════════════════════════════════════════════
   FICO RACER — true-3D circuit racer (rebuilt to match the delivered
   Unity build "Fico-racer-main" + the FICO Racer GDD):
   - Real closed circuit, chase camera, 4 cars (player + 3 AI personalities)
   - Real Toon-Racing car models (assets/games3d/rally*.fbx + atlas PNG)
   - FICO starts at 850 and gets DAMAGED DOWN. Car state degrades by band
     (CarStateManager enum): 850 NoDamage → 800 Dents → 700 Scratches →
     600 Smoke → 500 FlatTires (50% speed) → 400 Fire (10%) →
     350 Immobile (no steering) → 300 Destroyed (game over).
   - Track pickups (respawn 20s, like FicoScorePickup.cs): blue/green
     credit cards, on-time-payment checkmark, coins, red X traps.
   - Knowledge Gates are holographic arches: steer into lane A/B/C.
     The car never stops (GDD §10).
   - Post-race: placement, FICO delta, cash, lesson, cvAwardGame.
   ════════════════════════════════════════════════════════════════ */
(function(){
  let G=null, raf=null;

  window.frInit=function(){ if(G) teardown(); G=null; };

  /* ── Level definitions (GDD §8) ── */
  const LEVELS=[
    { name:'CREDIT CITY', sub:'BEGINNER · NEON CITY LOOP', laps:2, icon:'🏙️',
      desc:'Wide friendly streets. Learn payments, utilization and smart credit.',
      env:'city', fog:0x9fd8ff, fogFar:340, amb:0xffffff,
      pickups:26, hazardRate:.22, gateEvery:520, aiSkill:.86 },
    { name:'CYBER CANYON', sub:'INTERMEDIATE · DUSK CANYON RUN', laps:3, icon:'🏜️',
      desc:'Tighter corners and loan traps. Interest and debt get real.',
      env:'canyon', fog:0xffb27d, fogFar:300, amb:0xffe0c0,
      pickups:30, hazardRate:.34, gateEvery:480, aiSkill:.93 },
    { name:'QUANTUM NEXUS', sub:'ADVANCED · GALAXY CHAMPIONSHIP', laps:3, icon:'🌌',
      desc:'The championship arena of CredTech Galaxy. Fraud drones everywhere.',
      env:'space', fog:0x1b1040, fogFar:280, amb:0x9fb4ff,
      pickups:32, hazardRate:.46, gateEvery:440, aiSkill:1.0 },
  ];

  /* ── Cars (delivered Toon-Racing rally cars) ── */
  const CARS=[
    { key:'rally1', name:'CredRunner', tint:0xffffff },
    { key:'rally2', name:'Investor Ivy',     ai:{early:.88,late:1.06}, color:'#34d399' },
    { key:'rally3', name:'Maxed-Out Marcus', ai:{early:1.08,late:.84}, color:'#f87171' },
    { key:'rally4', name:'Prime Parker',     ai:{early:.97,late:.99}, color:'#60a5fa' },
  ];

  /* ── Car state bands (CarStateManager.cs) ── */
  // exact CarStateManager.cs thresholds: >800 NoDamage · >700 Dents · >600 Scratches ·
  // >500 Smoke · >400 FlatTires(50%) · >350 Fire(10%) · >300 Immobile(no steer) · ≤300 Destroyed
  const BANDS=[
    { min:800, label:'NO DAMAGE',   st:0, spd:1.00, steer:true,  col:'#34d399' },
    { min:700, label:'DENTS',       st:1, spd:1.00, steer:true,  col:'#a3e635' },
    { min:600, label:'SCRATCHES',   st:2, spd:1.00, steer:true,  col:'#fbbf24' },
    { min:500, label:'SMOKE',       st:3, spd:1.00, steer:true,  col:'#fb923c' },
    { min:400, label:'FLAT TIRES',  st:3, spd:0.50, steer:true,  col:'#f87171' },
    { min:350, label:'ON FIRE',     st:4, spd:0.12, steer:true,  col:'#ef4444' },
    { min:300, label:'IMMOBILE',    st:4, spd:0.12, steer:false, col:'#dc2626' },
    { min:-1,  label:'DESTROYED',   st:4, spd:0.00, steer:false, col:'#991b1b' },
  ];
  function bandFor(f){ for(const b of BANDS){ if(f>b.min) return b; } return BANDS[BANDS.length-1]; }

  /* ── Knowledge gate questions (steer into the lane!) ── */
  const QUIZ=[
    {q:'Payment history is what % of your FICO score?',opts:['35%','15%','10%'],ans:0,fact:'Payment history = 35% of FICO — the biggest factor!',fico:+30,cash:10},
    {q:'Best utilization to protect your score?',opts:['Below 30%','Below 70%','Below 90%'],ans:0,fact:'Keep utilization under 30% for a healthy score.',fico:+25,cash:8},
    {q:'2nd biggest FICO factor?',opts:['Utilization 30%','Credit age 15%','New credit 10%'],ans:0,fact:'Utilization is #2 at 30% — keep balances low!',fico:+25,cash:8},
    {q:'Highest possible FICO score?',opts:['850','900','1000'],ans:0,fact:'Perfect FICO is 850 — legendary status!',fico:+20,cash:5},
    {q:'An Emergency Fund helps you…',opts:['Avoid new debt','Raise your limit','Close accounts'],ans:0,fact:'Emergency funds cover setbacks without debt!',fico:+28,cash:12},
    {q:'Buy-Now-Pay-Later products…',opts:['Can hide real costs','Always help credit','Are free money'],ans:0,fact:'BNPL adds up — only buy what you can repay now.',fico:+20,cash:5},
    {q:'A missed payment stays on your report…',opts:['7 years','6 months','2 weeks'],ans:0,fact:'Missed payments stay 7 years — pay on time!',fico:+22,cash:7},
    {q:'Identity stolen — first move?',opts:['Freeze credit','Ignore it','Post about it'],ans:0,fact:'Fraud freeze + report immediately = best defense!',fico:+30,cash:15},
    {q:'Why diversify investments?',opts:['Spread the risk','Higher fees','Avoid taxes'],ans:0,fact:'Diversification spreads risk across assets.',fico:+25,cash:10},
    {q:'Paying only the minimum balance…',opts:['Costs more interest','Clears debt fast','Boosts score fast'],ans:0,fact:'Minimum payments = debt lingers and interest piles up.',fico:+20,cash:5},
    {q:'Debt Snowball means…',opts:['Smallest debts first','Biggest debts first','Pay nothing'],ans:0,fact:'Snowball = quick wins keep you motivated!',fico:+22,cash:8},
    {q:'A 750 FICO score is…',opts:['Very good','Poor','Average'],ans:0,fact:'750-799 is Very Good — strong choices!',fico:+20,cash:5},
  ];

  /* ══════════════ 3D libs (three r128 + self-hosted FBXLoader) ══════════════ */
  function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=()=>{ s.remove(); rej(new Error('load fail '+src)); }; document.head.appendChild(s); }); }
  let _libsP=null;
  function ensure3D(){
    if(window.THREE && window.THREE.FBXLoader) return Promise.resolve();
    if(_libsP) return _libsP;
    _libsP=(window.THREE?Promise.resolve():loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'))
      .then(()=>window.fflate?null:loadScript('assets/games3d/lib/fflate.min.js'))
      .then(()=>window.THREE.NURBSCurve?null:loadScript('assets/games3d/lib/NURBSUtils.js').then(()=>loadScript('assets/games3d/lib/NURBSCurve.js')).catch(()=>{}))
      .then(()=>window.THREE.FBXLoader?null:loadScript('assets/games3d/lib/FBXLoader.js'))
      .catch(e=>{ _libsP=null; throw e; });
    return _libsP;
  }

  /* ══════════════ SCREEN ══════════════ */
  window.SCREENS.game_ficoracer=function(){
    setTimeout(showLevelSelect,30);
    return `<div id="frRoot" style="position:absolute;inset:0;background:#04060f;overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div id="fr3dWrap" style="position:absolute;inset:0"></div>
      <div id="frUI" style="position:absolute;inset:0;pointer-events:none"></div>
    </div>`;
  };

  /* ── Level select (garage-style, GDD track cards) ── */
  function showLevelSelect(){
    const ui=document.getElementById('frUI'); if(!ui) return;
    const best=(window.state&&state.gameLevels&&state.gameLevels['game_ficoracer'])||0;
    ui.style.pointerEvents='auto';
    ui.innerHTML=`
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,rgba(56,189,248,.25),transparent 55%),linear-gradient(180deg,#050a1e,#02040c);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:20px">
        <button onclick="frExit()" style="position:absolute;top:14px;left:14px;padding:8px 16px;border:1px solid rgba(56,189,248,.4);border-radius:10px;background:rgba(10,16,40,.6);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← HUB</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.3em;color:#38bdf8">CREDTECH GALAXY PRESENTS</div>
        <div style="font-family:'Anton',sans-serif;font-size:clamp(2rem,6vw,3.4rem);letter-spacing:.04em;background:linear-gradient(90deg,#7dd3fc,#fbbf24);-webkit-background-clip:text;background-clip:text;color:transparent">🏁 FICO RACER</div>
        <div style="font-size:.85rem;color:rgba(255,255,255,.6);margin-top:-8px">Build your credit. Outrace your future. Start at 850 — keep your car alive!</div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:900px">
          ${LEVELS.map((L,i)=>{
            const locked=i>0 && best<i;
            return `<div onclick="${locked?'':'frStart('+i+')'}" style="width:250px;padding:20px 18px;border-radius:18px;border:1.5px solid ${locked?'rgba(255,255,255,.12)':'rgba(56,189,248,.45)'};background:linear-gradient(165deg,rgba(12,20,48,.95),rgba(4,8,24,.98));cursor:${locked?'default':'pointer'};text-align:center;position:relative;transition:all .2s" ${locked?'':`onmouseover="this.style.borderColor='#fbbf24';this.style.transform='translateY(-4px)'" onmouseout="this.style.borderColor='rgba(56,189,248,.45)';this.style.transform='none'"`}>
              <div style="font-size:2.4rem;margin-bottom:6px;filter:${locked?'grayscale(1) opacity(.4)':'none'}">${L.icon}</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:.85rem;letter-spacing:.1em;color:${locked?'rgba(255,255,255,.35)':'#7dd3fc'}">${L.name}</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:.45rem;letter-spacing:.14em;color:rgba(255,255,255,.4);margin:5px 0 8px">${L.sub}</div>
              <div style="font-size:.72rem;line-height:1.5;color:rgba(255,255,255,${locked?'.3':'.65'})">${L.desc}</div>
              <div style="margin-top:10px;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.1em;color:#fbbf24">${L.laps} LAPS · 3 RIVALS</div>
              ${locked?`<div style="position:absolute;top:10px;right:12px;font-size:1rem">🔒</div><div style="margin-top:8px;font-size:.55rem;color:rgba(255,255,255,.4)">Win ${LEVELS[i-1].name} to unlock</div>`:''}
            </div>`;}).join('')}
        </div>
        <div style="font-size:.62rem;color:rgba(255,255,255,.35)">🎮 Steer: ← → / A D / tilt-drag · Boost: SPACE or the ⚡ button · Steer through the ANSWER LANE at Knowledge Gates!</div>
      </div>`;
  }

  window.frStart=function(li){
    const ui=document.getElementById('frUI'); if(ui){ ui.style.pointerEvents='none'; ui.innerHTML=
      `<div id="frLoad" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#02040c">
        <div style="font-family:'Anton',sans-serif;font-size:2rem;color:#7dd3fc">LAUNCHING ${LEVELS[li].name}…</div>
        <div style="width:220px;height:8px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden"><div id="frLoadBar" style="width:10%;height:100%;border-radius:6px;background:linear-gradient(90deg,#38bdf8,#fbbf24);transition:width .3s"></div></div>
        <div id="frLoadTxt" style="font-size:.65rem;color:rgba(255,255,255,.45)">warming up the engine…</div>
      </div>`; }
    const bar=p=>{ const b=document.getElementById('frLoadBar'); if(b) b.style.width=(p*100)+'%'; };
    ensure3D().then(()=>{ bar(.45); return loadCarAssets(bar); })
      .then(models=>{ bar(1); startRace(li, models); })
      .catch(e=>{ console.warn('FICO 3D load issue:', e); startRace(li, null); });
  };

  /* ── FBX car loading (with procedural fallback) ── */
  let _carCache=null;
  function loadCarAssets(bar){
    if(_carCache) return Promise.resolve(_carCache);
    const loader=new THREE.FBXLoader();
    const texLoader=new THREE.TextureLoader();
    let done=0;
    const one=(c,i)=>new Promise(res=>{
      const tex=texLoader.load('assets/games3d/'+c.key+'.png', t=>{ t.flipY=true; });
      loader.load('assets/games3d/'+c.key+'.fbx', obj=>{
        // drop the *_Lights meshes — their pivots import offset and float above the roof
        const drop=[]; obj.traverse(m=>{ if(m.isMesh&&/_Lights$/i.test(m.name)) drop.push(m); });
        drop.forEach(m=>m.parent&&m.parent.remove(m));
        // normalize: center, sit on ground, length ≈ 4.2 units, forward = +Z
        obj.updateMatrixWorld(true);
        const box=new THREE.Box3().setFromObject(obj), size=box.getSize(new THREE.Vector3());
        const longest=Math.max(size.x,size.z);
        if(size.x>size.z) obj.rotation.y=Math.PI/2;             // align long axis to Z
        const s=4.2/(longest||1); obj.scale.setScalar(s);
        obj.updateMatrixWorld(true);
        const box2=new THREE.Box3().setFromObject(obj);
        obj.position.y=-box2.min.y; obj.position.x=-(box2.min.x+box2.max.x)/2; obj.position.z=-(box2.min.z+box2.max.z)/2;
        const wheels=[];
        obj.traverse(m=>{ if(m.isMesh){
          m.material=new THREE.MeshToonMaterial({ map:tex });
          m.castShadow=false; m.receiveShadow=false;
          if(/wheel|tire|tyre/i.test(m.name)) wheels.push(m);
        }});
        done++; if(bar) bar(.45+.55*done/CARS.length);
        res({root:obj, wheels});
      }, undefined, ()=>{ done++; if(bar) bar(.45+.55*done/CARS.length); res(null); });
    });
    return Promise.all(CARS.map(one)).then(arr=>{ _carCache=arr; return arr; });
  }
  function buildFallbackCar(hex){
    const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.9,.55,4.0), new THREE.MeshToonMaterial({color:hex}));
    body.position.y=.55; g.add(body);
    const cab=new THREE.Mesh(new THREE.BoxGeometry(1.5,.5,1.7), new THREE.MeshToonMaterial({color:0x0b1530}));
    cab.position.set(0,.98,-.2); g.add(cab);
    const wg=new THREE.CylinderGeometry(.42,.42,.32,14), wm=new THREE.MeshToonMaterial({color:0x111318});
    const wheels=[];
    [[-.95,.42,1.35],[.95,.42,1.35],[-.95,.42,-1.35],[.95,.42,-1.35]].forEach(p=>{ const w=new THREE.Mesh(wg,wm); w.rotation.z=Math.PI/2; w.position.set(p[0],p[1],p[2]); g.add(w); wheels.push(w); });
    const spoil=new THREE.Mesh(new THREE.BoxGeometry(1.8,.1,.5), new THREE.MeshToonMaterial({color:hex})); spoil.position.set(0,1.05,-1.9); g.add(spoil);
    return {root:g, wheels};
  }

  /* ══════════════ RACE ══════════════ */
  const TAU=Math.PI*2;
  function trackPoints(env){
    // three distinct closed circuits (x,z control points)
    if(env==='city')   return [[0,-120],[85,-110],[130,-55],[125,30],[70,80],[90,140],[30,175],[-55,160],[-95,95],[-70,30],[-120,-15],[-90,-90]];
    if(env==='canyon') return [[0,-140],[70,-120],[95,-45],[60,5],[110,60],[70,130],[-10,110],[-40,165],[-110,130],[-95,55],[-130,-20],[-60,-80]];
    return [[0,-130],[90,-115],[120,-40],[80,20],[130,80],[60,150],[-20,115],[-80,160],[-140,90],[-90,25],[-130,-60],[-50,-95]];
  }
  function makeCanvasTex(w,h,draw,repX,repY){
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    draw(c.getContext('2d'),w,h);
    const t=new THREE.CanvasTexture(c);
    if(repX||repY){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(repX||1,repY||1); }
    t.userData=t.userData||{}; t.userData.perRace=true;   // r128 textures lack userData; per-race = disposable
    return t;
  }

  function startRace(li, models){
    if(G) teardown();
    const wrap=document.getElementById('fr3dWrap'); if(!wrap) return;
    const L=LEVELS[li];
    const W=7;                         // road half-width
    const scene=new THREE.Scene();
    scene.fog=new THREE.Fog(L.fog, 40, L.fogFar);
    const cam=new THREE.PerspectiveCamera(68, wrap.clientWidth/Math.max(1,wrap.clientHeight), .1, 1200);
    const rndr=new THREE.WebGLRenderer({antialias:devicePixelRatio<=1, powerPreference:'high-performance'});
    rndr.setPixelRatio(Math.min(devicePixelRatio,1.25));   // retina 2x melts weak iGPUs — 1.25 looks fine
    rndr.setSize(wrap.clientWidth, wrap.clientHeight);
    wrap.innerHTML=''; wrap.appendChild(rndr.domElement);

    /* sky */
    if(L.env==='space'){
      scene.background=new THREE.Color(0x060218);
      const sg=new THREE.BufferGeometry(), sp=[];
      for(let i=0;i<1400;i++){ const r=500+Math.random()*300, a=Math.random()*TAU, b=(Math.random()-.5)*Math.PI; sp.push(r*Math.cos(a)*Math.cos(b), r*Math.sin(b)*.6+80, r*Math.sin(a)*Math.cos(b)); }
      sg.setAttribute('position', new THREE.Float32BufferAttribute(sp,3));
      scene.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xbfd7ff,size:1.6,sizeAttenuation:true})));
    } else {
      new THREE.TextureLoader().load('assets/games3d/sky_day.png', t=>{
        t.mapping=THREE.EquirectangularReflectionMapping;
        if(L.env==='canyon'){ scene.background=new THREE.Color(0xffa46b); scene.backgroundBlurriness=0; }
        scene.background=t;
      }, undefined, ()=>{ scene.background=new THREE.Color(L.fog); });
      if(L.env==='canyon') scene.fog=new THREE.Fog(0xffa46b,40,L.fogFar);
    }

    /* lights */
    scene.add(new THREE.AmbientLight(L.amb, L.env==='space'?.75:.95));
    const sun=new THREE.DirectionalLight(0xffffff, L.env==='space'?.6:1.0); sun.position.set(120,180,60); scene.add(sun);
    if(L.env==='space'){ const p=new THREE.PointLight(0x8b5cf6,1.2,400); p.position.set(0,120,0); scene.add(p); }

    /* track curve */
    const pts=trackPoints(L.env).map(p=>new THREE.Vector3(p[0],0,p[1]));
    const curve=new THREE.CatmullRomCurve3(pts,true,'catmullrom',.6);
    const SEG=420, P=[], T=[], NRM=[];
    for(let i=0;i<SEG;i++){ const u=i/SEG; P.push(curve.getPointAt(u)); const t=curve.getTangentAt(u).normalize(); T.push(t); NRM.push(new THREE.Vector3(-t.z,0,t.x)); }
    const trackLen=curve.getLength();
    // zero-alloc track lookup — curve.getPointAt runs an arc-length search, far too
    // slow to call ~40×/frame. P/T are arc-length uniform, so a table lerp matches.
    function posAt(u,out){ u=((u%1)+1)%1; const f=u*SEG, i=Math.floor(f)%SEG, j=(i+1)%SEG, a=f-Math.floor(f); return out.copy(P[i]).lerp(P[j],a); }
    function tanAt(u,out){ u=((u%1)+1)%1; const f=u*SEG, i=Math.floor(f)%SEG, j=(i+1)%SEG, a=f-Math.floor(f); return out.copy(T[i]).lerp(T[j],a).normalize(); }
    const _v1=new THREE.Vector3(), _v2=new THREE.Vector3(), _v3=new THREE.Vector3(), _v4=new THREE.Vector3(), _v5=new THREE.Vector3();

    function ribbon(halfIn,halfOut,tex,y){
      const g=new THREE.BufferGeometry(), v=[],uv=[],ix=[];
      for(let i=0;i<=SEG;i++){ const k=i%SEG, p=P[k], n=NRM[k];
        v.push(p.x+n.x*halfIn, y, p.z+n.z*halfIn, p.x+n.x*halfOut, y, p.z+n.z*halfOut);
        uv.push(0, i*.25, 1, i*.25); }
      for(let i=0;i<SEG;i++){ const a=i*2; ix.push(a,a+1,a+2, a+1,a+3,a+2); }
      g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
      g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
      g.setIndex(ix); g.computeVertexNormals();
      return new THREE.Mesh(g,new THREE.MeshToonMaterial({map:tex,side:THREE.DoubleSide}));
    }
    const roadTex=makeCanvasTex(256,256,(x,w,h)=>{
      x.fillStyle=L.env==='space'?'#141232':'#2b2e36'; x.fillRect(0,0,w,h);
      for(let i=0;i<700;i++){ x.fillStyle=`rgba(255,255,255,${Math.random()*.05})`; x.fillRect(Math.random()*w,Math.random()*h,1.5,1.5); }
      x.strokeStyle=L.env==='space'?'#6d5cff':'#f4f4f4'; x.lineWidth=7; x.setLineDash([26,22]);
      x.beginPath(); x.moveTo(w/2,0); x.lineTo(w/2,h); x.stroke();
      x.setLineDash([]); x.lineWidth=10; x.strokeStyle=L.env==='space'?'#38bdf8':'#e8e8e8';
      x.beginPath(); x.moveTo(4,0); x.lineTo(4,h); x.stroke();
      x.beginPath(); x.moveTo(w-4,0); x.lineTo(w-4,h); x.stroke();
    },1,1);
    roadTex.wrapT=THREE.RepeatWrapping;
    scene.add(ribbon(-W,W,roadTex,0));
    const curbTex=makeCanvasTex(64,64,(x,w,h)=>{ x.fillStyle='#e23b3b'; x.fillRect(0,0,w,h); x.fillStyle='#f4f4f4'; x.fillRect(0,0,w,h/2); },1,1); curbTex.wrapT=THREE.RepeatWrapping;
    scene.add(ribbon(-W-1.1,-W,curbTex,.02));
    scene.add(ribbon(W,W+1.1,curbTex,.02));

    /* ground */
    const groundCol=L.env==='city'?'#3f9b4e':L.env==='canyon'?'#c07a45':'#0b0824';
    const gtex=makeCanvasTex(256,256,(x,w,h)=>{ x.fillStyle=groundCol; x.fillRect(0,0,w,h);
      for(let i=0;i<900;i++){ x.fillStyle=`rgba(0,0,0,${Math.random()*.08})`; x.fillRect(Math.random()*w,Math.random()*h,2,2); } },60,60);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600), new THREE.MeshToonMaterial({map:gtex}));
    ground.rotation.x=-Math.PI/2; ground.position.y=-.05; scene.add(ground);

    /* fences + sponsor boards (delivered scene: FenceAds) */
    const ADS=['COINAVERSE','850 CLUB','CREDTECH GALAXY','PAY ON TIME','KEEP UTILIZATION LOW','MR JQ APPROVES'];
    const adMats=ADS.map((txt,i)=>new THREE.MeshBasicMaterial({map:makeCanvasTex(256,64,(x,w,h)=>{
      x.fillStyle=['#0a2a6b','#153c1e','#3c1560','#6b3a0a','#0a4a5e','#5e0a3c'][i%6]; x.fillRect(0,0,w,h);
      x.strokeStyle='rgba(255,255,255,.5)'; x.lineWidth=4; x.strokeRect(2,2,w-4,h-4);
      x.fillStyle='#fff'; x.font='900 26px Arial'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(txt,w/2,h/2+1);
    })}));
    const fenceG=new THREE.BoxGeometry(9,1.6,.15);
    const fenceGroups=adMats.map(()=>[]);
    function clearOfTrack(x,z,minD){ for(let k=0;k<SEG;k+=3){ const dx=P[k].x-x,dz=P[k].z-z; if(dx*dx+dz*dz<minD*minD) return false; } return true; }
    for(let i=0;i<SEG;i+=8){
      const side=(Math.floor(i/8)%2===0)?1:-1;
      const off=W+3.4, p=P[i], n=NRM[i];
      const fx=p.x+n.x*off*side, fz=p.z+n.z*off*side;
      // skip boards that land on ANOTHER section of the circuit
      let nearOther=false;
      for(let k=0;k<SEG;k+=3){ if(Math.abs(k-i)<14||Math.abs(k-i)>SEG-14) continue;
        const dx=P[k].x-fx,dz=P[k].z-fz; if(dx*dx+dz*dz<(W+2)*(W+2)){ nearOther=true; break; } }
      if(nearOther) continue;
      fenceGroups[Math.floor(i/8)%adMats.length].push({x:fx,y:.8,z:fz,ry:Math.atan2(T[i].x,T[i].z)});
    }

    /* environment decor — INSTANCED (a couple of draw calls instead of ~250) */
    const decor=new THREE.Group(); scene.add(decor);
    const _m4=new THREE.Matrix4(), _q=new THREE.Quaternion(), _eu=new THREE.Euler();
    function makeInst(geo,mat,items,parent){
      if(!items.length) return null;
      const im=new THREE.InstancedMesh(geo,mat,items.length);
      items.forEach((it,i)=>{
        _eu.set(0,it.ry||0,0); _q.setFromEuler(_eu);
        _v1.set(it.x,it.y,it.z); _v2.set(it.sx||1,it.sy||1,it.sz||1);
        _m4.compose(_v1,_q,_v2); im.setMatrixAt(i,_m4);
        if(it.color&&im.setColorAt) im.setColorAt(i,it.color);
      });
      if(im.instanceColor) im.instanceColor.needsUpdate=true;
      (parent||decor).add(im); return im;
    }
    fenceGroups.forEach((items,gi)=>makeInst(fenceG, adMats[gi], items, scene));
    function rndOffTrack(minD,maxD){
      for(let tries=0;tries<40;tries++){
        const x=(Math.random()-.5)*1100, z=(Math.random()-.5)*1100;
        let ok=true;
        for(let i=0;i<SEG;i+=6){ const dx=P[i].x-x,dz=P[i].z-z; if(dx*dx+dz*dz<minD*minD){ ok=false; break; } }
        if(ok && Math.hypot(x,z)<maxD) return [x,z];
      }
      return null;
    }
    if(L.env==='city'){
      const bI=[],gI=[],tkI=[],crI=[];
      for(let i=0;i<70;i++){ const s=rndOffTrack(26,520); if(!s) continue;
        const h=8+Math.random()*36, w=8+Math.random()*10, dd=8+Math.random()*10;
        bI.push({x:s[0],y:h/2,z:s[1],sx:w,sy:h,sz:dd,color:new THREE.Color().setHSL(.58+Math.random()*.06,.25,.28+Math.random()*.2)});
        if(Math.random()<.5) gI.push({x:s[0],y:h+.25,z:s[1],sx:w+.2,sy:.5,sz:dd+.2,color:new THREE.Color(Math.random()<.5?0x38bdf8:0xfbbf24)});
      }
      for(let i=0;i<50;i++){ const s=rndOffTrack(18,420); if(!s) continue;
        tkI.push({x:s[0],y:1.2,z:s[1]});
        const cs=1+Math.random()*.35; crI.push({x:s[0],y:3.4,z:s[1],sx:cs,sy:cs*1.15,sz:cs}); }
      makeInst(new THREE.BoxGeometry(1,1,1), new THREE.MeshToonMaterial({color:0xffffff}), bI);
      makeInst(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({color:0xffffff}), gI);
      makeInst(new THREE.CylinderGeometry(.3,.4,2.4,5), new THREE.MeshToonMaterial({color:0x6b4a2b}), tkI);
      makeInst(new THREE.SphereGeometry(2.1,7,6), new THREE.MeshToonMaterial({color:0x2f8f46}), crI);
    } else if(L.env==='canyon'){
      const rI=[];
      for(let i=0;i<80;i++){ const s=rndOffTrack(22,560); if(!s) continue;
        const h=6+Math.random()*40, r=3+Math.random()*7;
        rI.push({x:s[0],y:h/2,z:s[1],ry:Math.random()*TAU,sx:r,sy:h,sz:r,color:new THREE.Color().setHSL(.07,.5,.3+Math.random()*.18)}); }
      makeInst(new THREE.CylinderGeometry(.62,1,1,7), new THREE.MeshToonMaterial({color:0xffffff}), rI);
    } else {
      const tI=[],eI=[];
      for(let i=0;i<46;i++){ const s=rndOffTrack(26,560); if(!s) continue;
        const h=10+Math.random()*44;
        tI.push({x:s[0],y:h/2,z:s[1],sx:6,sy:h,sz:6});
        eI.push({x:s[0],y:h+.3,z:s[1],sx:6.3,sy:.6,sz:6.3,color:new THREE.Color([0x8b5cf6,0x38bdf8,0xf472b6][i%3])}); }
      makeInst(new THREE.BoxGeometry(1,1,1), new THREE.MeshToonMaterial({color:0x181242}), tI);
      makeInst(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({color:0xffffff}), eI);
      for(let i=0;i<3;i++){ const ring=new THREE.Mesh(new THREE.TorusGeometry(60+i*30,1.2,6,44), new THREE.MeshBasicMaterial({color:0x6d5cff,transparent:true,opacity:.35}));
        ring.position.set(0,90+i*20,0); ring.rotation.x=Math.PI/2.3; decor.add(ring); }
    }

    /* start gantry */
    const gant=new THREE.Group();
    const postG=new THREE.BoxGeometry(.8,9,.8), postM=new THREE.MeshToonMaterial({color:0xdddddd});
    const p0=P[0], n0=NRM[0];
    [[-1],[1]].forEach(([s])=>{ const po=new THREE.Mesh(postG,postM); po.position.set(p0.x+n0.x*(W+1.5)*s,4.5,p0.z+n0.z*(W+1.5)*s); gant.add(po); });
    const ban=new THREE.Mesh(new THREE.BoxGeometry((W+1.5)*2,1.6,.4), new THREE.MeshBasicMaterial({map:makeCanvasTex(512,64,(x,w,h)=>{
      x.fillStyle='#0b1024'; x.fillRect(0,0,w,h);
      for(let i=0;i<16;i++){ for(let j=0;j<2;j++){ x.fillStyle=(i+j)%2?'#fff':'#111'; x.fillRect(i*16,j*16,16,16); } }
      x.fillStyle='#fbbf24'; x.font='900 34px Arial'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('★ FICO RACER — START ★',w/2,h/2+8);
    })}));
    ban.position.set(p0.x,8.2,p0.z); ban.rotation.y=Math.atan2(T[0].x,T[0].z); gant.add(ban);
    scene.add(gant);

    /* cars */
    const carRoots=[], wheelSets=[];
    for(let i=0;i<4;i++){
      let mdl=models&&models[i];
      let inst;
      if(mdl){ inst={root:mdl.root.clone(true),wheels:[]}; inst.root.traverse(m=>{ if(m.isMesh){ m.material=m.material.clone(); if(/wheel|tire|tyre/i.test(m.name)) inst.wheels.push(m); } }); }
      else inst=buildFallbackCar([0xf59e0b,0x34d399,0xef4444,0x60a5fa][i]);
      const holder=new THREE.Group(); holder.add(inst.root);
      // name tag for AI
      if(i>0){ const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:makeCanvasTex(256,64,(x,w,h)=>{
          x.fillStyle='rgba(3,6,20,.75)'; x.beginPath(); x.roundRect?x.roundRect(0,0,w,h,18):x.fillRect(0,0,w,h); x.fill();
          x.fillStyle=CARS[i].color; x.font='700 30px Arial'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(CARS[i].name,w/2,h/2);
        }),transparent:true}));
        tag.scale.set(3.1,.78,1); tag.position.y=2.45; holder.add(tag); holder.userData.tag=tag; }
      scene.add(holder); carRoots.push(holder); wheelSets.push(inst.wheels);
    }

    /* pickups (delivered PickupAbles) */
    const texL=new THREE.TextureLoader();
    const PK_DEFS=[
      {k:'blue',  img:'pk_CreditCardBlue.png',  w:1.9,h:1.25, fico:+25, cash:0,  msg:'+25 FICO · Smart credit!',       good:true,  weight:.22},
      {k:'green', img:'pk_CreditCardGreen.png', w:1.9,h:1.25, fico:+15, cash:5,  msg:'+15 FICO · Healthy account!',    good:true,  weight:.16},
      {k:'check', img:'pk_GreenCheckmark.png',  w:1.5,h:1.5,  fico:+18, cash:0,  msg:'ON-TIME PAYMENT! +18 FICO',      good:true,  weight:.18, boost:.25},
      {k:'coin',  img:'pk_Coin.png',            w:1.3,h:1.3,  fico:0,   cash:12, msg:'+$12',                            good:true,  weight:.24},
      {k:'red',   img:'pk_CreditCardRed.png',   w:1.9,h:1.25, fico:-40, cash:0,  msg:'MAXED OUT! −40 FICO',            good:false, weight:0},
      {k:'x',     img:'pk_X.png',               w:1.5,h:1.5,  fico:-30, cash:-5, msg:'MISSED PAYMENT! −30 FICO',       good:false, weight:0},
    ];
    const pkTex={}; PK_DEFS.forEach(d=>pkTex[d.k]=texL.load('assets/games3d/'+d.img));
    const pickups=[];
    const goodDefs=PK_DEFS.filter(d=>d.good), badDefs=PK_DEFS.filter(d=>!d.good);
    for(let i=0;i<L.pickups;i++){
      const bad=Math.random()<L.hazardRate;
      let def;
      if(bad) def=badDefs[Math.floor(Math.random()*badDefs.length)];
      else { let r=Math.random()*goodDefs.reduce((a,d)=>a+d.weight,0); def=goodDefs.find(d=>(r-=d.weight)<=0)||goodDefs[0]; }
      const s=(i+1)/(L.pickups+1)+(Math.random()-.5)*.01;
      const d=(Math.random()*2-1)*(W-2);
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:pkTex[def.k],transparent:true}));
      sp.scale.set(def.w,def.h,1);
      // static world position — computed ONCE (was a per-frame arc-length curve lookup)
      posAt(s%1,_v1); tanAt(s%1,_v2); _v3.set(-_v2.z,0,_v2.x);
      sp.position.set(_v1.x+_v3.x*d, 1.15, _v1.z+_v3.z*d);
      scene.add(sp);
      pickups.push({def,s:s%1,d,node:sp,active:true,respawnAt:0});
    }

    /* knowledge gate arch (reused across gates) */
    const gate={ node:new THREE.Group(), s:-1, q:null, lanes:[], asked:0, answeredAt:-9, banner:0 };
    const laneMatOn=new THREE.MeshBasicMaterial({color:0x38bdf8,transparent:true,opacity:.42});
    const archM=new THREE.MeshBasicMaterial({color:0x7dd3fc,transparent:true,opacity:.9});
    [[-1],[1]].forEach(([sd])=>{ const po=new THREE.Mesh(new THREE.BoxGeometry(.6,8,.6),archM); po.position.set(sd*(W+.9),4,0); gate.node.add(po); });
    const topBar=new THREE.Mesh(new THREE.BoxGeometry((W+1)*2,1.1,.6),archM); topBar.position.y=8.2; gate.node.add(topBar);
    const laneW=(W*2-1)/3;
    for(let i=0;i<3;i++){
      const lane=new THREE.Group();
      const panel=new THREE.Mesh(new THREE.PlaneGeometry(laneW-.6,3.4), laneMatOn.clone());
      panel.position.y=2.2; lane.add(panel);
      const label=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true})); label.scale.set(3.4,1.7,1); label.position.y=5.2; lane.add(label);
      lane.position.x=-W+.5+laneW*(i+.5);
      gate.node.add(lane); gate.lanes.push({grp:lane,panel,label});
    }
    gate.node.visible=false; scene.add(gate.node);

    /* smoke + fire particles for damage states */
    function mkPuffTex(col){ return makeCanvasTex(64,64,(x,w,h)=>{ const g=x.createRadialGradient(32,32,4,32,32,30); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,w,h); }); }
    const smokeTex=mkPuffTex('rgba(120,120,130,.85)'), fireTex=mkPuffTex('rgba(255,140,40,.95)');
    // pooled sprites — no per-puff material allocation/disposal churn
    const puffs=[];
    for(let i=0;i<34;i++){
      const fire=i>=22;
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:fire?fireTex:smokeTex,transparent:true,depthWrite:false,opacity:0}));
      sp.visible=false; scene.add(sp);
      puffs.push({sp,fire,life:0,max:1,vy:0});
    }
    let _pfS=0,_pfF=22;
    function spawnPuff(pos,fire){
      let p;
      if(fire){ p=puffs[_pfF]; _pfF=22+((_pfF-22+1)%12); } else { p=puffs[_pfS]; _pfS=(_pfS+1)%22; }
      tanAt(G?G.s:0,_v4);
      p.sp.position.set(pos.x-_v4.x*2.1+(Math.random()-.5)*.5, pos.y+0.9+Math.random()*.3, pos.z-_v4.z*2.1+(Math.random()-.5)*.5);
      const sc=fire?.55:.8; p.sp.scale.set(sc,sc,1);
      p.max=p.life=fire?.45:.8; p.vy=fire?2.6:2.0; p.sp.visible=true;
    }

    /* HUD */
    const ui=document.getElementById('frUI');
    ui.style.pointerEvents='none';
    ui.innerHTML=`
      <div style="position:absolute;top:0;left:0;right:0;padding:10px 14px;display:flex;align-items:flex-start;gap:10px;background:linear-gradient(180deg,rgba(2,4,12,.82),transparent);pointer-events:none">
        <button onclick="frExit()" style="pointer-events:auto;padding:7px 13px;border:1px solid rgba(56,189,248,.4);border-radius:9px;background:rgba(10,16,40,.7);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.1em;cursor:pointer">← EXIT</button>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
            <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.18em;color:#7dd3fc">🏁 ${L.name}</div>
            <div style="display:flex;gap:14px;align-items:center">
              <div id="frLap" style="font-family:'Orbitron',sans-serif;font-size:.72rem;color:#fff">LAP 1/${L.laps}</div>
              <div id="frPos" style="font-family:'Orbitron',sans-serif;font-size:.92rem;color:#fbbf24">P4/4</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;color:rgba(255,255,255,.55)">FICO</div>
            <div style="flex:1;height:12px;border-radius:8px;background:linear-gradient(90deg,#ef4444,#f59e0b,#fbbf24,#a3e635,#34d399);position:relative;box-shadow:inset 0 0 6px rgba(0,0,0,.5)">
              <div id="frFicoPin" style="position:absolute;top:-4px;left:100%;transform:translateX(-50%);width:6px;height:20px;border-radius:3px;background:#fff;box-shadow:0 0 8px #fff;transition:left .25s"></div>
            </div>
            <div id="frFico" style="font-family:'Anton',sans-serif;font-size:1.25rem;color:#34d399;min-width:64px;text-align:right">850</div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:2px">
            <div id="frBand" style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:#34d399">NO DAMAGE</div>
            <div style="display:flex;gap:12px">
              <div id="frCash" style="font-family:'Orbitron',sans-serif;font-size:.58rem;color:#fbbf24">💰 $0</div>
              <div id="frSpd" style="font-family:'Orbitron',sans-serif;font-size:.58rem;color:#7dd3fc">0 MPH</div>
            </div>
          </div>
        </div>
      </div>
      <div id="frQBox" style="position:absolute;top:96px;left:50%;transform:translateX(-50%);max-width:640px;width:92%;padding:10px 16px;border-radius:14px;border:1.5px solid #38bdf8;background:rgba(3,8,26,.88);text-align:center;display:none;pointer-events:none">
        <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.2em;color:#7dd3fc;margin-bottom:4px">🎯 KNOWLEDGE GATE AHEAD — STEER INTO THE ANSWER LANE</div>
        <div id="frQTxt" style="font-size:.92rem;font-weight:700;color:#fff"></div>
      </div>
      <div id="frMsg" style="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);font-family:'Anton',sans-serif;font-size:2.2rem;color:#fbbf24;text-shadow:0 4px 24px rgba(0,0,0,.6);opacity:0;transition:opacity .2s;pointer-events:none;text-align:center"></div>
      <div id="frBoostWrap" style="position:absolute;right:16px;bottom:18px;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none">
        <div style="width:14px;height:120px;border-radius:8px;background:rgba(255,255,255,.09);overflow:hidden;display:flex;align-items:flex-end"><div id="frBoostBar" style="width:100%;height:0%;background:linear-gradient(180deg,#fbbf24,#f97316)"></div></div>
        <button id="frBoostBtn" style="pointer-events:auto;width:64px;height:64px;border-radius:50%;border:2px solid #fbbf24;background:radial-gradient(circle,#f59e0b,#b45309);color:#1a0d00;font-size:1.5rem;cursor:pointer;box-shadow:0 4px 20px rgba(245,158,11,.4)">⚡</button>
      </div>
      <div style="position:absolute;left:14px;bottom:18px;display:flex;gap:10px;pointer-events:none">
        <button id="frLBtn" style="pointer-events:auto;width:62px;height:62px;border-radius:16px;border:1px solid rgba(255,255,255,.25);background:rgba(10,16,40,.6);color:#fff;font-size:1.4rem;cursor:pointer">◀</button>
        <button id="frRBtn" style="pointer-events:auto;width:62px;height:62px;border-radius:16px;border:1px solid rgba(255,255,255,.25);background:rgba(10,16,40,.6);color:#fff;font-size:1.4rem;cursor:pointer">▶</button>
      </div>
      <div id="frCount" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Anton',sans-serif;font-size:7rem;color:#fbbf24;text-shadow:0 8px 40px rgba(0,0,0,.7);pointer-events:none">3</div>
      <div id="frOver" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(2,4,12,.78);backdrop-filter:blur(6px);pointer-events:auto"></div>`;

    /* state */
    G={ li,L,scene,cam,rndr,wrap,curve,P,T,NRM,SEG,trackLen,W,
        cars:carRoots, wheels:wheelSets, pickups, gate, puffs,
        fico:850, cash:0, band:BANDS[0],
        lap:1, done:false, phase:'count', countT:3.4,
        s:0, d:0, v:0, steerVis:0, spin:0, boost:0, boosting:0, offroad:false,
        gatesRight:0, gatesWrong:0, paysOnTime:0, missed:0,
        ai:[1,2,3].map(i=>({ s:-(i*.008)-.006, d:(i-2)*3.2, v:0, spin:0, prog:0,
                             skill:L.aiSkill*(CARS[i].ai?1:1), def:CARS[i] })),
        prog:0, startAt:performance.now(), last:performance.now(),
        keys:{}, dragX:0, camPos:new THREE.Vector3(), camLook:new THREE.Vector3(),
        nextGateAt: L.gateEvery, quizBag:[...QUIZ].sort(()=>Math.random()-.5), quizIdx:0,
        msgT:0 };

    /* place cars on grid */
    function place(root, s, d, yaw){
      posAt(s,_v1); tanAt(s,_v2); _v3.set(-_v2.z,0,_v2.x);
      root.position.set(_v1.x+_v3.x*d, 0, _v1.z+_v3.z*d);
      root.rotation.y=Math.atan2(_v2.x,_v2.z)+(yaw||0);
    }
    G.cars.forEach((c,i)=>{ if(i===0) place(c, -.004, 1.8, 0); else place(c, G.ai[i-1].s, G.ai[i-1].d, 0); });

    /* input */
    const kd=e=>{ if(!G) return; G.keys[e.key.toLowerCase()]=true;
      if([' ','arrowup','arrowleft','arrowright','a','d','w'].includes(e.key.toLowerCase())) e.preventDefault(); };
    const ku=e=>{ if(G) G.keys[e.key.toLowerCase()]=false; };
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
    const cvEl=rndr.domElement;
    let touchX=null;
    const ts=e=>{ if(e.touches[0]){ touchX=e.touches[0].clientX; e.preventDefault(); } };
    const tm=e=>{ if(touchX!=null&&e.touches[0]&&G){ G.dragX=(e.touches[0].clientX-touchX)/60; e.preventDefault(); } };
    const te=()=>{ touchX=null; if(G) G.dragX=0; };
    cvEl.addEventListener('touchstart',ts,{passive:false}); cvEl.addEventListener('touchmove',tm,{passive:false});
    cvEl.addEventListener('touchend',te); cvEl.addEventListener('touchcancel',te);
    const hold=(id,key)=>{ const b=document.getElementById(id); if(!b) return;
      const on=e=>{ if(G) G.keys[key]=true; e.preventDefault(); }, off=()=>{ if(G) G.keys[key]=false; };
      b.addEventListener('pointerdown',on); b.addEventListener('pointerup',off); b.addEventListener('pointerleave',off); };
    hold('frLBtn','arrowleft'); hold('frRBtn','arrowright'); hold('frBoostBtn',' ');
    const onResize=()=>{ if(!G) return; const w=wrap.clientWidth,h=Math.max(1,wrap.clientHeight);
      cam.aspect=w/h; cam.updateProjectionMatrix(); rndr.setSize(w,h); };
    window.addEventListener('resize',onResize);
    G._cleanup=()=>{ window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku);
      window.removeEventListener('resize',onResize);
      cvEl.removeEventListener('touchstart',ts); cvEl.removeEventListener('touchmove',tm);
      cvEl.removeEventListener('touchend',te); cvEl.removeEventListener('touchcancel',te); };

    G.place=place;
    G.spawnPuff=spawnPuff;
    G.posAt=posAt; G.tanAt=tanAt; G._v1=_v1; G._v2=_v2; G.decor=decor;
    G.el={ boost:document.getElementById('frBoostBar'), spd:document.getElementById('frSpd'),
           pos:document.getElementById('frPos'), lap:document.getElementById('frLap') };
    G._ft=0; G._fn=0; G._deg=0;
    window._frDbg=function(){ if(!G) return null;
      const out={s:G.s,d:G.d,v:G.v,cam:G.cam.position.toArray().map(n=>+n.toFixed(1))};
      out.cars=G.cars.map(c=>{ const b=new THREE.Box3().setFromObject(c), sz=b.getSize(new THREE.Vector3());
        return {pos:c.position.toArray().map(n=>+n.toFixed(1)), size:[+sz.x.toFixed(2),+sz.y.toFixed(2),+sz.z.toFixed(2)], dist:+c.position.distanceTo(G.cam.position).toFixed(1)}; });
      return out; };
    window._frSet=function(o){ if(!G||!o) return; if(typeof o.fico==='number') setFico(o.fico-G.fico); if(typeof o.s==='number') G.s=o.s; if(typeof o.lapDone==='number') G.prog=o.lapDone+G.s; };
    cancelAnimationFrame(raf); G.last=performance.now(); raf=requestAnimationFrame(loop);
  }

  /* ── helpers ── */
  function msg(t,col){ const m=document.getElementById('frMsg'); if(!m||!G) return;
    m.textContent=t; m.style.color=col||'#fbbf24'; m.style.opacity=1; G.msgT=1.4; }
  function setFico(delta){
    if(!G) return;
    G.fico=Math.max(0,Math.min(850,G.fico+delta));
    const b=bandFor(G.fico);
    if(b!==G.band){
      G.band=b;
      const bd=document.getElementById('frBand'); if(bd){ bd.textContent=b.label; bd.style.color=b.col; }
      if(b.st>=4) msg('🔥 '+b.label+'!', '#ef4444');
      else if(b.spd<1) msg('⚠ '+b.label+' — car slowed!', '#f87171');
      if(b.spd===0 && !G.done) finishRace(false,'destroyed');
    }
    const f=document.getElementById('frFico'); if(f){ f.textContent=Math.round(G.fico); f.style.color=b.col; }
    const pin=document.getElementById('frFicoPin'); if(pin) pin.style.left=(G.fico/850*100)+'%';
  }

  /* ── gate handling ── */
  function armGate(){
    const g=G.gate;
    const q0=G.quizBag[G.quizIdx%G.quizBag.length]; G.quizIdx++;
    const order=[0,1,2].sort(()=>Math.random()-.5);
    g.q={...q0, opts:order.map(i=>q0.opts[i]), ans:order.indexOf(q0.ans)};
    g.s=((G.s+140/G.trackLen)%1+1)%1;
    G.posAt(g.s,G._v1); G.tanAt(g.s,G._v2);
    g.node.position.set(G._v1.x,0,G._v1.z); g.node.rotation.y=Math.atan2(G._v2.x,G._v2.z);
    g.node.visible=true;
    g.lanes.forEach((ln,i)=>{
      const tex=new THREE.CanvasTexture((()=>{ const c=document.createElement('canvas'); c.width=256; c.height=128;
        const x=c.getContext('2d'); x.fillStyle='rgba(3,8,26,.92)';
        x.beginPath(); if(x.roundRect) x.roundRect(0,0,256,128,22); else x.rect(0,0,256,128); x.fill();
        x.strokeStyle='#38bdf8'; x.lineWidth=5; x.stroke();
        x.fillStyle='#7dd3fc'; x.font='900 30px Arial'; x.textAlign='center'; x.fillText('LANE '+String.fromCharCode(65+i),128,40);
        x.fillStyle='#fff'; x.font=(g.q.opts[i].length>14?'700 20px':'700 26px')+' Arial';
        x.fillText(g.q.opts[i],128,86,236); return c; })());
      ln.label.material.map=tex; ln.label.material.needsUpdate=true;
      ln.panel.material.color.setHex(0x38bdf8); ln.panel.material.opacity=.42;
    });
    const qb=document.getElementById('frQBox'), qt=document.getElementById('frQTxt');
    if(qb&&qt){ qt.textContent=g.q.q; qb.style.display='block'; }
  }
  function resolveGate(){
    const g=G.gate;
    const laneW=(G.W*2-1)/3;
    const li=Math.max(0,Math.min(2,Math.floor((G.d+G.W-.5)/laneW)));
    const ok=li===g.q.ans;
    if(ok){ G.gatesRight++; setFico(g.q.fico); G.cash+=g.q.cash; G.boost=Math.min(1,G.boost+.5);
      msg('✅ '+g.q.fact,'#34d399'); }
    else { G.gatesWrong++; setFico(-18); msg('💫 NICE TRY! Lane '+String.fromCharCode(65+g.q.ans)+' — '+g.q.fact,'#f87171'); }
    g.lanes.forEach((ln,i)=>{ ln.panel.material.color.setHex(i===g.q.ans?0x34d399:0xef4444); ln.panel.material.opacity=.6; });
    const qb=document.getElementById('frQBox'); if(qb) qb.style.display='none';
    g.answeredAt=performance.now();
    setTimeout(()=>{ if(G&&G.gate){ G.gate.node.visible=false; G.gate.s=-1; } },900);
    G.nextGateAt=G.prog*G.trackLen + G.L.gateEvery;
  }

  /* ══════════════ MAIN LOOP ══════════════ */
  function loop(now){
    if(!G || !document.getElementById('fr3dWrap') || !G.rndr.domElement.isConnected){ teardown(); return; }
    raf=requestAnimationFrame(loop);
    const dt=Math.min(.05,(now-G.last)/1000); G.last=now;
    const L=G.L;

    /* countdown */
    if(G.phase==='count'){
      G.countT-=dt;
      const c=document.getElementById('frCount');
      if(c){ const n=Math.ceil(G.countT-0.4);
        c.textContent=G.countT>0.4?String(Math.max(1,n)):'GO!';
        c.style.transform='scale('+(1+((G.countT%1)))+')';
        if(G.countT<=0){ c.style.display='none'; G.phase='race'; } }
      else if(G.countT<=0) G.phase='race';
    }

    const racing=G.phase==='race'&&!G.done;

    /* ── player physics ── */
    const baseSpd=27;
    if(racing){
      const b=G.band;
      let steer=0;
      if(b.steer && G.spin<=0){
        if(G.keys['arrowleft']||G.keys['a']) steer-=1;
        if(G.keys['arrowright']||G.keys['d']) steer+=1;
        steer+=Math.max(-1,Math.min(1,G.dragX));
      }
      const wantBoost=(G.keys[' ']||G.keys['arrowup']||G.keys['w'])&&G.boost>0&&b.spd>=.5;
      G.boosting=wantBoost?1:Math.max(0,G.boosting-dt*3);
      if(wantBoost) G.boost=Math.max(0,G.boost-dt*.4);
      G.offroad=Math.abs(G.d)>G.W-.9;
      const target=baseSpd*b.spd*(wantBoost?1.5:1)*(G.offroad?.55:1)*(G.spin>0?.35:1);
      G.v+=(target-G.v)*Math.min(1,dt*2.2);
      G.d+=steer*dt*13*(G.v/baseSpd);
      G.d=Math.max(-G.W-1.6,Math.min(G.W+1.6,G.d));
      if(G.spin>0) G.spin-=dt;
      G.s=((G.s+G.v*dt/G.trackLen)%1+1)%1;
      const lastProg=G.prog;
      G.prog=Math.floor(G.prog)+G.s;
      if(G.s<.5 && (lastProg%1)>.5) G.prog=Math.floor(lastProg)+1+G.s;   // wrapped start line
      if(Math.floor(G.prog)+1>G.lap){
        G.lap=Math.floor(G.prog)+1;
        if(G.lap>L.laps){ finishRace(true); }
        else { msg('LAP '+G.lap+' / '+L.laps,'#7dd3fc');
          const le=G.el.lap; if(le) le.textContent='LAP '+G.lap+'/'+L.laps; }
      }
    } else if(G.phase==='count'){ G.v=0; }

    /* visual: player car */
    const yaw=(G.spin>0? now/40 : G.steerVis);
    G.steerVis+=(((G.keys['arrowleft']||G.keys['a'])?-.28:((G.keys['arrowright']||G.keys['d'])?.28:Math.max(-1,Math.min(1,G.dragX))*.28))-G.steerVis)*Math.min(1,dt*8);
    G.place(G.cars[0], G.s, G.d, G.spin>0? now/40 : G.steerVis);
    G.wheels[0].forEach(w=>{ w.rotation.x+=G.v*dt*.9; });

    /* damage FX by band */
    if(G.band.st>=3 && Math.random()<(G.band.st>=4?.5:.22)) G.spawnPuff(G.cars[0].position, G.band.st>=4&&Math.random()<.5);
    for(let i=0;i<G.puffs.length;i++){ const p=G.puffs[i]; if(p.life<=0) continue;
      p.life-=dt; p.sp.position.y+=p.vy*dt;
      p.sp.material.opacity=Math.max(0,p.life/p.max)*.6; p.sp.scale.multiplyScalar(1+dt*.7);
      if(p.life<=0) p.sp.visible=false; }

    /* ── AI ── */
    G.ai.forEach((a,idx)=>{
      if(!racing){ G.place(G.cars[idx+1], a.s, a.d, 0); return; }
      const per=a.def.ai||{early:1,late:1};
      const t01=Math.min(1,(now-G.startAt)/90000);
      const pers=per.early+(per.late-per.early)*t01;
      const rubber=1+Math.max(-0.08,Math.min(0.08,(G.prog-(a.prog||0))*.35));
      const target=baseSpd*a.skill*pers*rubber*(a.spin>0?.35:1);
      a.v=a.v===0?target:a.v+(target-a.v)*Math.min(1,dt*2);
      if(a.spin>0) a.spin-=dt;
      a.s=((a.s+a.v*dt/G.trackLen)%1+1)%1;
      const lp=a.prog||0; a.prog=Math.floor(lp)+a.s;
      if(a.s<.5&&(lp%1)>.5) a.prog=Math.floor(lp)+1+a.s;
      // gentle racing line wobble + avoid player
      const want=Math.sin(a.s*TAU*3+idx*2)* (G.W-3);
      a.d+=(want-a.d)*Math.min(1,dt*.9);
      const ds=(a.prog-G.prog)*G.trackLen;
      if(Math.abs(ds)<4.6 && Math.abs(a.d-G.d)<2.0){
        const push=(a.d>G.d?1:-1)*dt*6; a.d+=push; G.d-=push*.5;
        if(Math.abs(ds)<2.4 && racing){ G.v*=.985; }
      }
      G.place(G.cars[idx+1], a.s, a.d, 0);
      G.wheels[idx+1].forEach(w=>{ w.rotation.x+=a.v*dt*.9; });
    });

    /* position */
    if(racing){
      const rank=1+G.ai.filter(a=>(a.prog||0)>G.prog).length;
      const pe=G.el.pos;
      if(pe){ pe.textContent='P'+rank+'/4'; pe.style.color=rank===1?'#fbbf24':rank<=3?'#34d399':'#f87171'; }
      G.rank=rank;
    }

    /* ── pickups ── */
    if(racing) G.pickups.forEach(pk=>{
      if(!pk.active){ if(now>=pk.respawnAt){ pk.active=true; pk.node.visible=true; } return; }
      const ds=Math.abs(((pk.s-G.s+1.5)%1)-.5)*G.trackLen;
      if(ds>150) return;                                   // far away — skip bob + hit test
      pk.node.position.y=1.15+Math.sin(now/300+pk.d)*0.18;
      if(ds<2.6 && Math.abs(pk.d-G.d)<1.7){
        pk.active=false; pk.node.visible=false; pk.respawnAt=now+20000;   // FicoScorePickup.respawnTime=20
        const d=pk.def;
        if(d.fico) setFico(d.fico);
        if(d.cash){ G.cash+=d.cash; const ce=document.getElementById('frCash'); if(ce) ce.textContent='💰 $'+G.cash; }
        if(d.boost) G.boost=Math.min(1,G.boost+d.boost);
        if(d.k==='check') G.paysOnTime++;
        if(d.k==='x') G.missed++;
        if(!d.good){ G.spin=.8; }
        msg((d.good?'':'💥 ')+d.msg, d.good?'#34d399':'#f87171');
      }
    });

    /* ── knowledge gates ── */
    if(racing){
      const dist=G.prog*G.trackLen;
      if(G.gate.s<0 && dist>=G.nextGateAt) armGate();
      if(G.gate.s>=0 && G.gate.q){
        const ds=((G.gate.s-G.s+1.5)%1)-.5;
        if(ds<0 && ds>-.02) resolveGate();
      }
    }

    /* ── HUD misc ── */
    const bb=G.el.boost; if(bb) bb.style.height=Math.round(G.boost*100)+'%';
    const sp=G.el.spd; if(sp) sp.textContent=Math.round(G.v*4.2)+' MPH';
    if(G.msgT>0){ G.msgT-=dt; if(G.msgT<=0){ const m=document.getElementById('frMsg'); if(m) m.style.opacity=0; } }

    /* ── chase camera (exp-decay follow: no trailing gap at speed) ── */
    const camBack=8.8, camUp=4.6;
    const t0=G.tanAt(G.s,G._v1);
    G._v2.set(G.cars[0].position.x - t0.x*camBack, camUp + (G.boosting?.35:0), G.cars[0].position.z - t0.z*camBack);
    const ka=1-Math.exp(-9*dt);
    G.camPos.lerp(G._v2, ka); G.cam.position.copy(G.camPos);
    G._v2.set(G.cars[0].position.x + t0.x*3.5, 1.6, G.cars[0].position.z + t0.z*3.5);
    G.camLook.lerp(G._v2, 1-Math.exp(-12*dt)); G.cam.lookAt(G.camLook);
    G.cam.fov=66+(G.boosting?9:0)+(G.v>20?3:0); G.cam.updateProjectionMatrix();
    // AI name tags: only near the camera (avoid clutter across the infield)
    for(let i=1;i<4;i++){ const tg=G.cars[i].userData.tag; if(tg) tg.visible=G.cars[i].position.distanceTo(G.cam.position)<55; }

    /* auto-quality: if the machine can't hold ~38fps, step down (PR → decor → fog) */
    G._ft+=dt; G._fn++;
    if(G._fn>=90){
      const avg=G._ft/G._fn; G._ft=0; G._fn=0;
      if(avg>1/38 && G._deg<2){
        G._deg++;
        if(G._deg===1){ G.rndr.setPixelRatio(1); }
        else {
          G.scene.fog.far*=0.72;
          if(G.decor) G.decor.traverse(o=>{ if(o.isInstancedMesh) o.count=Math.max(4,Math.floor(o.count*0.5)); });
        }
      }
    }

    G.rndr.render(G.scene, G.cam);
  }

  /* ══════════════ FINISH ══════════════ */
  function finishRace(finished, why){
    if(!G||G.done) return; G.done=true;
    const L=G.L, rank=finished?(G.rank||4):4;
    const win=finished && rank<=3;
    const stars=!finished?0:(rank===1?3:rank===2?2:rank===3?1:0);   // podium only — P4 gets consolation, not flagship pay
    let coins=0;
    if(window.state){
      state.gamesDone=state.gamesDone||{}; state.gamesDone['credtech:0']=1;
      if(stars>=1 && window.cvAwardGame){
        coins=cvAwardGame('game_ficoracer',{level:G.li+1,stars,badge:'Credit Champion',is3star:stars===3,isPerfect:stars===3&&G.fico>=800,isFlagship:true});
        if(window.cvHubMeter) try{ cvHubMeter('credtech_trust', stars*4); }catch(e){}
      } else {
        coins=50; state.coins=(state.coins||0)+coins;
        if(window.cvAddXP) cvAddXP(10,0); if(window.cvSave) cvSave();
      }
      // unlock next level on podium
      if(win && window.cvAwardGame && G.li+1<LEVELS.length){
        state.gameLevels=state.gameLevels||{};
        if((state.gameLevels['game_ficoracer']||0)<G.li+1) state.gameLevels['game_ficoracer']=G.li+1;
        if(window.cvSave) cvSave();
      }
    }
    const ficoDelta=Math.round(G.fico-850);
    const lesson= why==='destroyed' ? 'Your credit hit rock bottom and the car gave out. Dodge the red cards, grab on-time payments, and your ride stays fast!'
      : G.gatesWrong>G.gatesRight ? 'Knowledge Gates are free FICO — read the question early and get in lane!'
      : G.missed>0 ? 'Missed payments hurt the most. Payment history is 35% of your score!'
      : 'Strong credit habits = a faster car. Keep utilization low and pay on time!';
    const o=document.getElementById('frOver'); if(!o) return;
    o.style.display='flex';
    o.innerHTML=`<div style="max-width:520px;width:92%;text-align:center;padding:30px 26px;border:1.5px solid ${win?'#fbbf24':'#38bdf8'};border-radius:24px;background:linear-gradient(165deg,rgba(10,18,44,.98),rgba(3,6,20,.99));box-shadow:0 0 80px rgba(56,189,248,.35);animation:${win?'frWinPop .55s cubic-bezier(.2,1.4,.4,1)':'frFadeIn .3s ease'}">
      <style>
        @keyframes frWinPop{0%{transform:scale(.7) rotate(-3deg);opacity:0}60%{transform:scale(1.06) rotate(1deg);opacity:1}100%{transform:scale(1) rotate(0)}}
        @keyframes frFadeIn{0%{transform:scale(.94);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes frTrophyPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
      </style>
      <div style="font-size:3rem${win?';animation:frTrophyPulse 1.1s ease-in-out infinite':''}">${why==='destroyed'?'💥':win?['🏆','🥈','🥉'][rank-1]:'🏁'}</div>
      <div style="font-family:'Anton',sans-serif;font-size:1.7rem;margin:6px 0;color:${win?'#fbbf24':'#7dd3fc'}">${why==='destroyed'?'CAR DESTROYED':win?'MISSION ACCOMPLISHED!':'RACE COMPLETE'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.18em;color:rgba(255,255,255,.5);margin-bottom:14px">${L.name} · ${finished?('FINISHED P'+rank+'/4'):'DID NOT FINISH'}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
        ${[['FICO SCORE',Math.round(G.fico)+' <span style="font-size:.7rem;color:'+(ficoDelta>=0?'#34d399':'#f87171')+'">('+(ficoDelta>=0?'+':'')+ficoDelta+')</span>'],
           ['CASH EARNED','$'+G.cash],['COINS','+'+coins+' 🪙'],
           ['GATES','✅ '+G.gatesRight+' · ❌ '+G.gatesWrong],['ON-TIME PAYS',G.paysOnTime],['RATING','★'.repeat(stars)+'☆'.repeat(3-stars)]]
          .map(r=>`<div style="background:rgba(56,189,248,.07);border:1px solid rgba(56,189,248,.18);border-radius:12px;padding:9px 6px"><div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.45);margin-bottom:4px">${r[0]}</div><div style="font-family:'Anton',sans-serif;font-size:1.05rem;color:#fff">${r[1]}</div></div>`).join('')}
      </div>
      <p style="font-size:.8rem;line-height:1.55;color:rgba(255,255,255,.8);margin:0 0 16px;padding:11px 13px;background:rgba(52,211,153,.07);border-left:3px solid #34d399;border-radius:9px;text-align:left">💡 ${lesson}</p>
      <button onclick="frRestart()" style="padding:13px 24px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#02121f;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.1em;font-weight:900;cursor:pointer">▶ RACE AGAIN</button>
      ${win&&G.li+1<LEVELS.length?`<button onclick="frStartNext()" style="padding:13px 24px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#fbbf24,#d97706);color:#1a0d00;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.1em;font-weight:900;cursor:pointer">🔓 ${LEVELS[G.li+1].name} →</button>`:''}
      <button onclick="frMenu()" style="padding:13px 24px;margin:4px;border:1px solid rgba(255,255,255,.25);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.1em;cursor:pointer">TRACKS</button>
      <button onclick="frExit()" style="padding:13px 24px;margin:4px;border:1px solid rgba(255,255,255,.25);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
    </div>`;
  }

  /* ══════════════ teardown / controls ══════════════ */
  function teardown(){
    cancelAnimationFrame(raf); raf=null;
    if(!G) return;
    if(G._cleanup) G._cleanup();
    try{
      if(G.scene.background&&G.scene.background.dispose) G.scene.background.dispose();
      G.scene.traverse(o=>{ if(o.geometry) o.geometry.dispose();
        if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(m.map&&m.map.userData&&m.map.userData.perRace) m.map.dispose(); m.dispose(); }); } });
      G.rndr.dispose();
      if(G.rndr.forceContextLoss) G.rndr.forceContextLoss();
      if(G.rndr.domElement&&G.rndr.domElement.parentNode) G.rndr.domElement.parentNode.removeChild(G.rndr.domElement);
    }catch(e){}
    G=null;
  }
  window.frRestart=function(){ const li=G?G.li:0; teardown(); const ui=document.getElementById('frUI'); if(ui) ui.innerHTML=''; frStart(li); };
  window.frStartNext=function(){ const li=G?Math.min(G.li+1,LEVELS.length-1):0; teardown(); frStart(li); };
  window.frMenu=function(){ teardown(); showLevelSelect(); };
  window.frExit=function(){ teardown();
    if(window.state){ state.viewingWorld=state._returnHub||'credtech'; }
    goTo('hub'); };
})();
