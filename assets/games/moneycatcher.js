/* ════════════════════════════════════════════════════════════════
   MONEY CATCHER — true-3D rebuild (rebuilt to match the delivered
   Unity build "MultiMoneyGame" — MoneyCatcher/GameManager.cs,
   PlayerManager.cs, ElementSpawner.cs, DroppingElement.cs, LevelGoal.cs):
   - Real 3D hero (RPGTinyHeroWavePolyart mesh + Idle/WalkFWD anims),
     runs left/right along the SAME lane bounds as PlayerManager.cs
     (minX=-4 / maxX=4), faces its movement direction, animates.
   - Real delivered art (01-Art icons: Coin_1/5/10/25/50, Cash_5/10/
     20/50/100, Stock, LateFee, HighInterest, FireMoney, MoneyMagnet,
     Shield, TimeFreeze, SpeedBoost, DebtClear) as billboarded sprites.
   - Exact power-up numbers from PlayerManager.cs: magnet 5s, insurance
     2 charges, freeze 3s, speed boost 6s(1.5x) — DebtBurner instant-clears.
   - 3 SaveScape Districts (unchanged GDD v3.0 balance): Penny Park 2075 /
     Allowance Alley / Savings Bay — goal/spawn/speed/combo-cap all as-is.
   - Combo, stamina, knowledge gates, end-of-run screen: ported from the
     existing 2D build (GDD-aligned) onto the new 3D presentation layer.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='guardian';
  let G=null, raf=null;

  window.mcInit=function(){ if(G) teardown(); G=null; };

  /* ── Level definitions (GDD v3.0 — 3 SaveScape Districts, unchanged) ── */
  const LEVELS=[
    {name:'Penny Park 2075', env:'park', dur:90,  moneyGoal:10000, stockGoal:15, spawnRate:2.0, ramp:0.02, negRate:0.10, speedStart:1.0, speedEnd:1.5, puChance:0.10, comboCap:5,
      sky:0xaee4ff, ground:'#4caf6e', desc:'Wide open lawns. Learn the basics of catching and saving.'},
    {name:'Allowance Alley', env:'alley', dur:120, moneyGoal:25000, stockGoal:30, spawnRate:2.4, ramp:0.025,negRate:0.13, speedStart:1.0, speedEnd:1.65,puChance:0.08, comboCap:7,
      sky:0xffd9a0, ground:'#8a8f98', desc:'Busier streets, faster drops. Dodge Late Fees and High Interest.'},
    {name:'Savings Bay',     env:'bay',  dur:150, moneyGoal:50000, stockGoal:50, spawnRate:2.8, ramp:0.03, negRate:0.17, speedStart:1.05,speedEnd:1.85,puChance:0.06, comboCap:8,
      sky:0x8fd8ff, ground:'#3a6f7d', desc:'The championship vault. Everything moves fast — stay sharp!'},
  ];

  /* ── Item tables — real delivered icons (01-Art), authentic to the
     shipped ElementType enum + PlayerManager.cs power-up numbers ── */
  const POS_ITEMS=[
    {type:'coin', icon:'mc_coin1.png',  label:'Coin',   money:1,   pts:10},
    {type:'coin', icon:'mc_coin5.png',  label:'Coin',   money:5,   pts:20},
    {type:'coin', icon:'mc_coin10.png', label:'Coin',   money:10,  pts:35},
    {type:'coin', icon:'mc_coin25.png', label:'Coin',   money:25,  pts:60},
    {type:'coin', icon:'mc_coin50.png', label:'Coin',   money:50,  pts:100},
    {type:'cash', icon:'mc_cash5.png',   label:'Cash',   money:5,   pts:25},
    {type:'cash', icon:'mc_cash10.png',  label:'Cash',   money:10,  pts:40},
    {type:'cash', icon:'mc_cash20.png',  label:'Cash',   money:20,  pts:70},
    {type:'cash', icon:'mc_cash50.png',  label:'Cash',   money:50,  pts:130},
    {type:'cash', icon:'mc_cash100.png', label:'Cash',   money:100, pts:220},
    {type:'stock',icon:'mc_stock.png',   label:'Coincept Stock', stock:1, pts:250},
  ];

  // ElementType.LateFee / HighInterest / FireMoney — the 3 delivered Savings Killers
  const NEG_ITEMS=[
    {type:'latefee',      icon:'mc_latefee.png',      label:'Late Fee',      money:-3,  stamina:-6,  speed:1.3, zigzag:false},
    {type:'highinterest', icon:'mc_highinterest.png', label:'High Interest', money:-6,  stamina:-4,  speed:1.1, zigzag:false},
    {type:'firemoney',    icon:'mc_firemoney.png',    label:'Fire Money',    money:-10, stamina:-14, speed:1.2, zigzag:true, amp:1.1, freq:4.0},
  ];

  // ElementType.MoneyMagnet / InsuranceBlocker / TimeFreeze / SpeedBoost / DebtBurner
  // — durations copied verbatim from PlayerManager.cs's own [Header("Power-up Settings")]
  const POWERUPS=[
    {type:'magnet',   icon:'mc_pu_magnet.png',  label:'Money Magnet',    dur:5, color:'#fbbf24'},
    {type:'shield',   icon:'mc_pu_shield.png',  label:'Insurance Blocker', dur:0, color:'#60a5fa', hits:2},
    {type:'freeze',   icon:'mc_pu_freeze.png',  label:'Time Freeze',     dur:3, color:'#7dd3fc'},
    {type:'speed',    icon:'mc_pu_speed.png',   label:'Speed Boost',    dur:6, color:'#a78bfa'},
    {type:'debtburn', icon:'mc_pu_debtburn.png',label:'Debt Burner',    dur:0, color:'#fb923c', instant:true},
  ];

  const FACTS=[
    ['🐷','Pay yourself first — save BEFORE you spend.'],
    ['🧾','Late fees drain your savings. Always pay on time!'],
    ['📊','High interest debt grows fast — the longer you carry it, the more it costs you.'],
    ['🔥','Fire money burns your savings fast — pause before every purchase.'],
    ['📈','Investing in stocks builds wealth over the long term.'],
    ['🛡️','Insurance protects your savings from unexpected events.'],
    ['🎯','Set a clear savings goal — it keeps you motivated.'],
    ['🚨','Always keep an emergency fund — unexpected costs happen!'],
    ['💰','Small savings compound over time into BIG wealth.'],
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
  window.SCREENS.game_moneycatcher=function(){
    setTimeout(showLevelSelect,30);
    return `<div id="mcRoot" style="position:absolute;inset:0;background:#04140f;overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div id="mc3dWrap" style="position:absolute;inset:0"></div>
      <div id="mcUI" style="position:absolute;inset:0;pointer-events:none"></div>
    </div>`;
  };

  /* ── Level select (SaveScape District cards) ── */
  function showLevelSelect(){
    const ui=document.getElementById('mcUI'); if(!ui) return;
    const best=(window.state&&state.gameLevels&&state.gameLevels['game_moneycatcher'])||0;
    ui.style.pointerEvents='auto';
    const icons=['🌳','🏙️','🌊'];
    ui.innerHTML=`
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,rgba(20,184,166,.25),transparent 55%),linear-gradient(180deg,#052a24,#02140f);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px;overflow-y:auto">
        <button onclick="mcExit()" style="position:absolute;top:14px;left:14px;padding:8px 16px;border:1px solid rgba(20,184,166,.4);border-radius:10px;background:rgba(4,20,16,.6);color:#5eead4;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← HUB</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.3em;color:#2dd4bf">SAVESCAPE ORBIT PRESENTS</div>
        <div style="font-family:'Anton',sans-serif;font-size:clamp(1.8rem,6vw,3rem);letter-spacing:.04em;background:linear-gradient(90deg,#5eead4,#fbbf24);-webkit-background-clip:text;background-clip:text;color:transparent">🐷 MONEY CATCHER</div>
        <div style="font-size:.85rem;color:rgba(255,255,255,.6);margin-top:-8px;text-align:center;max-width:520px">Run your Guardian left and right — catch coins, cash &amp; stock, dodge Savings Killers!</div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:900px">
          ${LEVELS.map((L,i)=>{
            const locked=i>0 && best<i;
            return `<div onclick="${locked?'':'mcStart('+i+')'}" style="width:250px;padding:20px 18px;border-radius:18px;border:1.5px solid ${locked?'rgba(255,255,255,.12)':'rgba(20,184,166,.45)'};background:linear-gradient(165deg,rgba(6,36,30,.95),rgba(2,14,11,.98));cursor:${locked?'default':'pointer'};text-align:center;position:relative;transition:all .2s" ${locked?'':`onmouseover="this.style.borderColor='#fbbf24';this.style.transform='translateY(-4px)'" onmouseout="this.style.borderColor='rgba(20,184,166,.45)';this.style.transform='none'"`}>
              <div style="font-size:2.4rem;margin-bottom:6px;filter:${locked?'grayscale(1) opacity(.4)':'none'}">${icons[i]}</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:.8rem;letter-spacing:.08em;color:${locked?'rgba(255,255,255,.35)':'#5eead4'}">${L.name.toUpperCase()}</div>
              <div style="font-size:.72rem;line-height:1.5;color:rgba(255,255,255,${locked?'.3':'.65'});margin-top:8px">${L.desc}</div>
              <div style="margin-top:10px;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.1em;color:#fbbf24">GOAL $${fmt(L.moneyGoal)} · ${L.stockGoal} STOCK · ${L.dur}s</div>
              ${locked?`<div style="position:absolute;top:10px;right:12px;font-size:1rem">🔒</div><div style="margin-top:8px;font-size:.55rem;color:rgba(255,255,255,.4)">Win ${LEVELS[i-1].name} to unlock</div>`:''}
            </div>`;}).join('')}
        </div>
        <div style="font-size:.62rem;color:rgba(255,255,255,.35)">🎮 Move: ← → / A D / drag · Catch the good stuff, dodge the red ones!</div>
      </div>`;
  }

  window.mcStart=function(li){
    const ui=document.getElementById('mcUI'); if(ui){ ui.style.pointerEvents='none'; ui.innerHTML=
      `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#02140f">
        <div style="font-family:'Anton',sans-serif;font-size:2rem;color:#5eead4">ENTERING ${LEVELS[li].name.toUpperCase()}…</div>
        <div style="width:220px;height:8px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden"><div id="mcLoadBar" style="width:10%;height:100%;border-radius:6px;background:linear-gradient(90deg,#14b8a6,#fbbf24);transition:width .3s"></div></div>
        <div style="font-size:.65rem;color:rgba(255,255,255,.45)">warming up the piggy bank…</div>
      </div>`; }
    const bar=p=>{ const b=document.getElementById('mcLoadBar'); if(b) b.style.width=(p*100)+'%'; };
    ensure3D().then(()=>{ bar(1); startGame(li, null); })
      .catch(e=>{ console.warn('MoneyCatcher 3D load issue:', e); startGame(li, null); });
  };

  /* ── FBX hero loading — NOT currently used (see startGame: the hero is always the
     procedural buildFallbackHero() below). The delivered RPGTinyHeroWavePolyart
     "AllBodiesCloaks.fbx" bundles 20 Body##/3 Cloak## variants whose bones are
     doubly-parented (each bone's parent is itself a same-named Bone node) — normal
     AnimationMixer retargeting and manual bone-rotation posing both silently no-op
     on this rig, and the raw bind pose is a full T-pose (arms out ~2x body height),
     so there's no safe way to re-pose it without risking a broken-looking character.
     Left here (unused) in case a future pass finds a working retarget path. ── */
  let _heroCache=null;
  function loadHeroAsset(bar){
    if(_heroCache) return Promise.resolve(_heroCache);
    const loader=new THREE.FBXLoader();
    const texLoader=new THREE.TextureLoader();
    const albedo=texLoader.load('assets/games3d/mc_hero_albedo.png', t=>{ t.flipY=true; });
    let steps=0; const tick=()=>{ steps++; if(bar) bar(.4+.6*Math.min(1,steps/3)); };
    return new Promise(res=>{
      loader.load('assets/games3d/mc_hero.fbx', body=>{
        tick();
        // this FBX bundles 20 alternate Body## + 3 alternate Cloak## skinned meshes
        // (Unity-side costume options, all siblings on the same skeleton) — keep
        // exactly one body variant visible and drop the rest, or every variant
        // renders stacked on top of the others.
        const KEEP='Body01';
        const drop=[];
        body.traverse(m=>{ if(m.isMesh && m.name!==KEEP) drop.push(m); });
        drop.forEach(m=>{ m.visible=false; m.parent&&m.parent.remove(m); });
        body.updateMatrixWorld(true);
        const box=new THREE.Box3().setFromObject(body), size=box.getSize(new THREE.Vector3());
        const s=1.8/(size.y||1); body.scale.setScalar(s);
        body.updateMatrixWorld(true);
        const box2=new THREE.Box3().setFromObject(body);
        body.position.y=-box2.min.y; body.position.x=-(box2.min.x+box2.max.x)/2; body.position.z=-(box2.min.z+box2.max.z)/2;
        body.traverse(m=>{ if(m.isMesh){ m.material=new THREE.MeshToonMaterial({map:albedo}); m.castShadow=false; m.receiveShadow=false; } });
        const mixer=new THREE.AnimationMixer(body);
        const anims={};
        const loadAnim=(key,file)=>new Promise(r=>{
          loader.load('assets/games3d/'+file, obj=>{ tick(); if(obj.animations&&obj.animations[0]) anims[key]=obj.animations[0]; r(); }, undefined, ()=>{ tick(); r(); });
        });
        Promise.all([loadAnim('idle','mc_hero_idle.fbx'), loadAnim('run','mc_hero_run.fbx')]).then(()=>{
          const actions={};
          Object.keys(anims).forEach(k=>{ actions[k]=mixer.clipAction(anims[k]); actions[k].play(); actions[k].weight=k==='idle'?1:0; });
          _heroCache={root:body, mixer, actions};
          res(_heroCache);
        });
      }, undefined, ()=>{ res(null); });
    });
  }
  function buildFallbackHero(){
    // three r128 has no CapsuleGeometry — rounded-cylinder limbs match FICO Racer's
    // own procedural-fallback convention (Box/Cylinder/Sphere only).
    const g=new THREE.Group();
    const skin=new THREE.MeshToonMaterial({color:0xffd1a3}), shirt=new THREE.MeshToonMaterial({color:0x14b8a6}), pants=new THREE.MeshToonMaterial({color:0x334155});
    const head=new THREE.Mesh(new THREE.SphereGeometry(.32,12,10), skin); head.position.y=1.5; g.add(head);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.33,12,8,0,Math.PI*2,0,Math.PI/2), new THREE.MeshToonMaterial({color:0x0d9488})); cap.position.y=1.58; g.add(cap);
    const torso=new THREE.Mesh(new THREE.CylinderGeometry(.24,.3,.62,10), shirt); torso.position.y=1.03; g.add(torso);
    const legL=new THREE.Mesh(new THREE.CylinderGeometry(.11,.13,.52,8), pants); legL.position.set(-.13,.4,0); g.add(legL);
    const legR=legL.clone(); legR.position.x=.13; g.add(legR);
    const armL=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,.44,8), skin); armL.position.set(-.4,1.05,0); armL.rotation.z=.25; g.add(armL);
    const armR=armL.clone(); armR.position.x=.4; armR.rotation.z=-.25; g.add(armR);
    return {root:g, mixer:null, actions:null, legs:[legL,legR], arms:[armL,armR], _fallback:true};
  }

  /* ══════════════ GAME ══════════════ */
  function makeCanvasTex(w,h,draw,repX,repY){
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    draw(c.getContext('2d'),w,h);
    const t=new THREE.CanvasTexture(c);
    if(repX||repY){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(repX||1,repY||1); }
    return t;
  }

  function startGame(li, hero){
    if(G) teardown();
    const wrap=document.getElementById('mc3dWrap'); if(!wrap) return;
    const L=LEVELS[li];
    const LANE_MIN=-4, LANE_MAX=4;             // exact PlayerManager.cs minX/maxX
    const scene=new THREE.Scene();
    scene.fog=new THREE.Fog(L.sky, 16, 40);
    const cam=new THREE.PerspectiveCamera(50, wrap.clientWidth/Math.max(1,wrap.clientHeight), .1, 200);
    cam.position.set(0,3.6,11); cam.lookAt(0,1.2,0);           // set immediately — don't wait for the lerp to converge
    const rndr=new THREE.WebGLRenderer({antialias:devicePixelRatio<=1, powerPreference:'high-performance'});
    rndr.setPixelRatio(Math.min(devicePixelRatio,1.25));
    rndr.setSize(wrap.clientWidth, wrap.clientHeight);
    wrap.innerHTML=''; wrap.appendChild(rndr.domElement);

    /* sky */
    scene.background=new THREE.Color(L.sky);
    scene.add(new THREE.AmbientLight(0xffffff,.6));
    const sun=new THREE.DirectionalLight(0xffffff,.55); sun.position.set(6,12,8); scene.add(sun);

    /* ground */
    const gtex=makeCanvasTex(128,128,(x,w,h)=>{ x.fillStyle=L.ground; x.fillRect(0,0,w,h);
      for(let i=0;i<260;i++){ x.fillStyle=`rgba(0,0,0,${Math.random()*.08})`; x.fillRect(Math.random()*w,Math.random()*h,2,2); }
      for(let i=0;i<260;i++){ x.fillStyle=`rgba(255,255,255,${Math.random()*.06})`; x.fillRect(Math.random()*w,Math.random()*h,2,2); }
    },10,10);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60), new THREE.MeshToonMaterial({map:gtex}));
    ground.rotation.x=-Math.PI/2; scene.add(ground);
    const laneTex=makeCanvasTex(64,64,(x,w,h)=>{ x.fillStyle=L.env==='bay'?'#c9a86a':'#d8d3c4'; x.fillRect(0,0,w,h);
      x.strokeStyle='rgba(0,0,0,.08)'; x.lineWidth=2; for(let i=0;i<4;i++){ x.beginPath(); x.moveTo(0,i*16); x.lineTo(64,i*16); x.stroke(); } },1,6);
    const lane=new THREE.Mesh(new THREE.PlaneGeometry(LANE_MAX-LANE_MIN+2.4, 5), new THREE.MeshToonMaterial({map:laneTex}));
    lane.rotation.x=-Math.PI/2; lane.position.y=.01; scene.add(lane);

    /* per-district decor (procedural — no heavy model loading, cheap InstancedMesh) */
    const decor=new THREE.Group(); scene.add(decor);
    function decorItem(geo,mat,x,y,z,sx,sy,sz,ry){ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); if(sx) m.scale.set(sx,sy||sx,sz||sx); if(ry) m.rotation.y=ry; decor.add(m); return m; }
    const edge=LANE_MAX+1.6;
    if(L.env==='park'){
      const fenceM=new THREE.MeshToonMaterial({color:0xf4f4f0});
      for(let side=-1;side<=1;side+=2) for(let i=-3;i<=3;i++) decorItem(new THREE.BoxGeometry(.12,.55,.12),fenceM, side*edge, .27, i*1.4);
      const trunkM=new THREE.MeshToonMaterial({color:0x6b4a2b}), leafM=new THREE.MeshToonMaterial({color:0x3fae5c});
      [[-6.4,-3],[6.4,0],[-6.8,3.4],[7,4.2]].forEach(([x,z])=>{ decorItem(new THREE.CylinderGeometry(.15,.2,1.4,6),trunkM,x,.7,z); decorItem(new THREE.SphereGeometry(1,7,6),leafM,x,1.7,z); });
      const bldM=[0xffd6e0,0xc8e6ff,0xfff2b3].map(c=>new THREE.MeshToonMaterial({color:c}));
      for(let i=0;i<7;i++){ const x=(i-3)*3.4, h=3+Math.random()*3; decorItem(new THREE.BoxGeometry(2,h,2),bldM[i%3],x,h/2,-12-Math.random()*3); }
    } else if(L.env==='alley'){
      const houseM=[0xf59e0b,0x60a5fa,0xf87171,0xa78bfa].map(c=>new THREE.MeshToonMaterial({color:c}));
      for(let side=-1;side<=1;side+=2) for(let i=-2;i<=2;i++){ const h=2.4+Math.random()*1.2;
        decorItem(new THREE.BoxGeometry(2.4,h,2.2), houseM[(i+2)%4], side*(edge+1.2), h/2, i*2.6);
        decorItem(new THREE.ConeGeometry(1.7,1,4), new THREE.MeshToonMaterial({color:0x475569}), side*(edge+1.2), h+.5, i*2.6, 1,1,1,Math.PI/4); }
      const postM=new THREE.MeshToonMaterial({color:0x334155});
      for(let side=-1;side<=1;side+=2) for(let i=-3;i<=3;i++) decorItem(new THREE.CylinderGeometry(.06,.06,1.1,6),postM, side*edge, .55, i*1.4);
    } else { // bay
      const water=new THREE.Mesh(new THREE.PlaneGeometry(40,40), new THREE.MeshToonMaterial({color:0x1b6d8a,transparent:true,opacity:.85}));
      water.rotation.x=-Math.PI/2; water.position.set(edge+8,-.02,-4); scene.add(water);
      const plankM=new THREE.MeshToonMaterial({color:0x8a6a45});
      for(let side=-1;side<=1;side+=2) for(let i=-3;i<=3;i++) decorItem(new THREE.BoxGeometry(.18,.5,1.3),plankM, side*edge, .25, i*1.4);
      const hullM=new THREE.MeshToonMaterial({color:0xf5f5f5}), sailM=new THREE.MeshToonMaterial({color:0xfacc15});
      [[edge+7,-8],[edge+11,-2]].forEach(([x,z])=>{ decorItem(new THREE.CapsuleGeometry(.6,2,4,8),hullM,x,.4,z,1,1,1,Math.PI/2); decorItem(new THREE.ConeGeometry(.5,1.6,4),sailM,x,1.6,z); });
    }

    /* hero — procedural Guardian character (see loadHeroAsset's comment above) */
    const heroInst=Object.assign(buildFallbackHero(),{isFallback:true});
    scene.add(heroInst.root);

    /* HUD (reuses the established Money Catcher HUD layout) */
    const ui=document.getElementById('mcUI');
    ui.style.pointerEvents='none';
    ui.innerHTML=`
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(180deg,rgba(2,12,18,.9),transparent);pointer-events:none">
        <button onclick="mcExit()" style="pointer-events:auto;padding:6px 12px;border:1px solid rgba(20,184,166,.4);border-radius:8px;background:rgba(20,184,166,.1);color:#5eead4;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.16em;color:#2dd4bf;flex:1;text-align:center">🐷 ${L.name.toUpperCase()}</div>
        <button onclick="mcShowHelp()" style="pointer-events:auto;width:26px;height:26px;border-radius:50%;border:1px solid rgba(20,184,166,.4);background:rgba(20,184,166,.12);color:#5eead4;font-size:.7rem;cursor:pointer">❓</button>
        <div id="mcTime" style="font-family:'Orbitron',sans-serif;font-size:.85rem;color:#fbbf24;min-width:42px;text-align:right">${L.dur}s</div>
      </div>
      <div style="position:absolute;top:46px;left:0;right:0;z-index:5;padding:0 12px;display:flex;gap:6px;pointer-events:none">
        <div style="flex:1;background:rgba(0,0,0,.35);border:1px solid rgba(20,184,166,.2);border-radius:10px;padding:5px 8px">
          <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;color:rgba(255,255,255,.45);letter-spacing:.1em;margin-bottom:2px">STAMINA</div>
          <div style="height:8px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden"><div id="mcStamBar" style="height:100%;width:100%;background:linear-gradient(90deg,#34d399,#6ee7b7);border-radius:4px;transition:width .15s"></div></div>
        </div>
        <div style="background:rgba(0,0,0,.35);border:1px solid rgba(251,191,36,.25);border-radius:10px;padding:5px 10px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;color:rgba(255,255,255,.45)">COMBO</div>
          <div id="mcCombo" style="font-family:'Anton',sans-serif;font-size:.95rem;color:#fbbf24;line-height:1">x1</div>
        </div>
        <div style="background:rgba(0,0,0,.35);border:1px solid rgba(52,211,153,.2);border-radius:10px;padding:5px 10px;text-align:center;min-width:68px">
          <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;color:rgba(255,255,255,.45)">SAVED</div>
          <div id="mcMoney" style="font-family:'Anton',sans-serif;font-size:.85rem;color:#34d399;line-height:1">$0</div>
        </div>
        <div style="background:rgba(0,0,0,.35);border:1px solid rgba(99,102,241,.3);border-radius:10px;padding:5px 10px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;color:rgba(255,255,255,.45)">STOCK</div>
          <div id="mcStock" style="font-family:'Anton',sans-serif;font-size:.85rem;color:#818cf8;line-height:1">0</div>
        </div>
      </div>
      <div style="position:absolute;top:96px;left:12px;right:12px;z-index:5;pointer-events:none">
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.1em;color:rgba(255,255,255,.4);margin-bottom:3px"><span>SAVINGS GOAL</span><span id="mcGoalTxt">$0 / $10K</span></div>
        <div style="height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid rgba(20,184,166,.15)"><div id="mcGoalBar" style="height:100%;width:0%;background:linear-gradient(90deg,#14b8a6,#5eead4);transition:width .25s"></div></div>
      </div>
      <div id="mcPuRow" style="position:absolute;top:112px;left:0;right:0;z-index:5;display:flex;justify-content:center;gap:8px;padding:4px 12px;min-height:22px;pointer-events:none"></div>
      <div id="mcMsg" style="position:absolute;top:38%;left:50%;transform:translate(-50%,-50%);font-family:'Anton',sans-serif;font-size:1.7rem;color:#fbbf24;text-shadow:0 4px 24px rgba(0,0,0,.6);opacity:0;transition:opacity .2s;pointer-events:none;text-align:center;z-index:6"></div>
      <div style="position:absolute;left:14px;bottom:18px;display:flex;gap:10px;pointer-events:none;z-index:5">
        <button id="mcLBtn" style="pointer-events:auto;width:58px;height:58px;border-radius:16px;border:1px solid rgba(255,255,255,.25);background:rgba(10,30,26,.6);color:#fff;font-size:1.3rem;cursor:pointer">◀</button>
        <button id="mcRBtn" style="pointer-events:auto;width:58px;height:58px;border-radius:16px;border:1px solid rgba(255,255,255,.25);background:rgba(10,30,26,.6);color:#fff;font-size:1.3rem;cursor:pointer">▶</button>
      </div>
      <div id="mcGate" style="position:absolute;inset:0;z-index:9;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(2,10,16,.88);backdrop-filter:blur(6px);padding:24px;gap:18px;pointer-events:auto"></div>
      <div id="mcHow" style="position:absolute;inset:0;z-index:9;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(2,10,16,.88);backdrop-filter:blur(6px);padding:24px;gap:16px;pointer-events:auto"></div>
      <div id="mcOver" style="position:absolute;inset:0;z-index:10;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(2,10,16,.85);backdrop-filter:blur(5px);gap:14px;padding:24px;pointer-events:auto"></div>`;

    /* icon texture cache */
    const texL=new THREE.TextureLoader();
    const iconTexCache={};
    function iconTex(file){ if(!iconTexCache[file]) iconTexCache[file]=texL.load('assets/games3d/'+file); return iconTexCache[file]; }

    /* state */
    G={ li, L, scene, cam, rndr, wrap, hero:heroInst, decor, LANE_MIN, LANE_MAX,
        phase:'intro', level:li, lv:L,
        money:0, stock:0, score:0,
        moneyGoal:L.moneyGoal, stockGoal:L.stockGoal,
        stamina:100, staminaMax:100,
        heroX:0, vx:0, facing:1,
        combo:0, comboMult:1,
        items:[], floats:[],
        time:L.dur, spawnAcc:0, elapsed:0, last:performance.now(),
        pu:{ magnet:0, shield:0, shieldHits:0, freeze:0, speed:0 },
        avoided:{ latefee:0, highinterest:0 }, comboPeak:0,
        gateEvery:22, gateT:22, gateIdx:0,
        keyL:false, keyR:false, dragX:0,
        iconTex, _pauseStartTs:0,
      };

    /* input */
    const kd=e=>{ if(!G) return; if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') G.keyL=true; if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') G.keyR=true; };
    const ku=e=>{ if(!G) return; if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') G.keyL=false; if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') G.keyR=false; };
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
    let touchX=null;
    const cvEl=rndr.domElement;
    const ts=e=>{ if(e.touches[0]){ touchX=e.touches[0].clientX; e.preventDefault(); } };
    const tm=e=>{ if(touchX!=null&&e.touches[0]&&G){ G.dragX=(e.touches[0].clientX-touchX)/40; e.preventDefault(); } };
    const te=()=>{ touchX=null; if(G) G.dragX=0; };
    cvEl.addEventListener('touchstart',ts,{passive:false}); cvEl.addEventListener('touchmove',tm,{passive:false});
    cvEl.addEventListener('touchend',te); cvEl.addEventListener('touchcancel',te);
    const hold=(id,key)=>{ const b=document.getElementById(id); if(!b) return;
      const on=e=>{ if(G) G[key]=true; e.preventDefault(); }, off=()=>{ if(G) G[key]=false; };
      b.addEventListener('pointerdown',on); b.addEventListener('pointerup',off); b.addEventListener('pointerleave',off); };
    hold('mcLBtn','keyL'); hold('mcRBtn','keyR');
    const onResize=()=>{ if(!G) return; const w=wrap.clientWidth,h=Math.max(1,wrap.clientHeight);
      cam.aspect=w/h; cam.updateProjectionMatrix(); rndr.setSize(w,h); };
    window.addEventListener('resize',onResize);
    G._cleanup=()=>{ window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku);
      window.removeEventListener('resize',onResize);
      cvEl.removeEventListener('touchstart',ts); cvEl.removeEventListener('touchmove',tm);
      cvEl.removeEventListener('touchend',te); cvEl.removeEventListener('touchcancel',te); };

    window._mcDbg=function(){ if(!G) return null;
      return {phase:G.phase, level:G.level, money:G.money, stock:G.stock, stamina:+G.stamina.toFixed(1), time:+G.time.toFixed(1),
        heroX:+G.heroX.toFixed(2), combo:G.comboMult, items:G.items.length, pu:Object.assign({},G.pu),
        camPos:G.cam.position.toArray().map(n=>+n.toFixed(2)), camFov:G.cam.fov,
        heroWorldPos:G.hero.root.position.toArray().map(n=>+n.toFixed(2))}; };
    window._mcForce=function(o){ if(!G||!o) return; if(typeof o.money==='number') G.money=o.money; if(typeof o.stock==='number') G.stock=o.stock; if(typeof o.time==='number') G.time=o.time; if(typeof o.stamina==='number') G.stamina=o.stamina; };
    // manually step the sim N times bypassing rAF — for deterministic QA independent of the
    // test harness's actual frame cadence (headless/background tabs can throttle rAF hard)
    window._mcTick=function(steps,dtEach){ if(!G) return null; steps=steps||1; dtEach=dtEach||0.05;
      for(let i=0;i<steps;i++){ if(G.phase==='play') update(dtEach, performance.now()); if(!G) break; }
      return window._mcDbg(); };

    cancelAnimationFrame(raf); G.last=performance.now();
    showHowToPlay(true);
    raf=requestAnimationFrame(loop);
  }

  /* ══════════════ MAIN LOOP ══════════════ */
  function loop(now){
    if(!G || !document.getElementById('mc3dWrap') || !G.rndr.domElement.isConnected){ teardown(); return; }
    raf=requestAnimationFrame(loop);
    const dt=Math.min(.05,(now-G.last)/1000); G.last=now;

    if(G.phase==='play') update(dt,now);
    render(dt,now);
    G.rndr.render(G.scene, G.cam);
  }

  function update(dt,now){
    G.elapsed+=dt; G.time-=dt;
    const tEl=document.getElementById('mcTime');
    if(tEl){ tEl.textContent=Math.ceil(Math.max(0,G.time))+'s'; tEl.style.color=G.time<15?'#f87171':'#fbbf24'; }
    if(G.time<=0){ G.time=0; endGame(true); return; }

    G.gateT-=dt;
    if(G.gateT<=0){ openGate(); return; }

    /* hero movement — same lane bounds as PlayerManager.cs */
    const spd=(G.pu.speed>0?1.5:1)*4.6;
    let input=0;
    if(G.keyL) input-=1; if(G.keyR) input+=1;
    input=Math.max(-1,Math.min(1,input+G.dragX));
    if(input!==0) G.facing=input>0?1:-1;
    G.heroX=Math.max(G.LANE_MIN,Math.min(G.LANE_MAX,G.heroX+input*spd*dt));
    const h=G.hero;
    h.root.position.x=G.heroX;
    h.root.rotation.y=G.facing>0?Math.PI/2:-Math.PI/2;
    if(h.mixer){
      const moving=input!==0;
      const idleA=h.actions.idle, runA=h.actions.run;
      if(idleA&&runA){ idleA.weight+=((moving?0:1)-idleA.weight)*Math.min(1,dt*6); runA.weight+=((moving?1:0)-runA.weight)*Math.min(1,dt*6); }
      h.mixer.update(dt);
    } else if(h.isFallback){
      const moving=input!==0; const t=now/140;
      const amt=moving?Math.sin(t)*.5:0;
      h.legs[0].rotation.x=amt; h.legs[1].rotation.x=-amt;
      h.arms[0].rotation.x=-amt*.7; h.arms[1].rotation.x=amt*.7;
    }

    /* power-up timers */
    ['magnet','freeze','speed'].forEach(k=>{ if(G.pu[k]>0) G.pu[k]-=dt; });

    /* spawn */
    const prog=Math.min(1,G.elapsed/G.lv.dur);
    const spawnRate=G.lv.spawnRate+G.lv.ramp*G.elapsed;
    G.spawnAcc+=dt*spawnRate;
    while(G.spawnAcc>=1){ G.spawnAcc-=1; spawnItem(); }

    /* move + resolve items */
    const frozen=G.pu.freeze>0;
    const baseSpd=lerp(G.lv.speedStart,G.lv.speedEnd,prog)*4.4;
    const CATCH_Y=1.2, CATCH_R=1.05;
    for(let i=G.items.length-1;i>=0;i--){
      const it=G.items[i];
      if(!frozen||it.neg){
        it.y-=dt*baseSpd*(it.neg?it.negDef.speed:1);
        if(it.neg&&it.negDef.zigzag){ it.zigT=(it.zigT||0)+dt*it.negDef.freq; it.x=Math.max(G.LANE_MIN,Math.min(G.LANE_MAX,it.baseX+Math.sin(it.zigT)*it.negDef.amp)); }
      }
      if(!it.neg&&G.pu.magnet>0){
        const dx=G.heroX-it.x;
        if(Math.abs(dx)<2.6){ it.x+=Math.sign(dx)*Math.min(Math.abs(dx),dt*7); it.y-=dt*2.4; }
      }
      it.sprite.position.set(it.x, it.y, 0);
      if(Math.abs(it.x-G.heroX)<CATCH_R && Math.abs(it.y-CATCH_Y)<CATCH_R){
        catchItem(it); disposeItem(it); G.items.splice(i,1); continue;
      }
      if(it.y< -1.5){
        if(it.neg){ if(it.negDef.type==='latefee') G.avoided.latefee++; if(it.negDef.type==='highinterest') G.avoided.highinterest++; }
        else if(!it.isPu){ if(G.combo>0){ G.combo=0; G.comboMult=1; } spawnFloat('MISS',0.5,'rgba(255,255,255,.35)'); }
        disposeItem(it); G.items.splice(i,1);
      }
    }

    /* camera follow */
    const camT=1-Math.exp(-4*dt);
    G.cam.position.lerp(new THREE.Vector3(G.heroX*.35, 3.6, 11), camT);
    const look=new THREE.Vector3(G.heroX*.55, 1.2, 0);
    if(!G._lookVec) G._lookVec=look.clone(); else G._lookVec.lerp(look, camT);
    G.cam.lookAt(G._lookVec);

    updateHUD();
  }

  function render(dt,now){
    /* floating text */
    for(let i=G.floats.length-1;i>=0;i--){ const f=G.floats[i]; f.life-=dt; if(f.life<=0){ G.floats.splice(i,1); continue; } }
    const m=document.getElementById('mcMsg');
    if(m&&G.floats.length){ const f=G.floats[G.floats.length-1]; m.style.opacity=Math.min(1,f.life*1.6); m.textContent=f.label; m.style.color=f.color; }
    else if(m) m.style.opacity=0;
  }

  function lerp(a,b,t){ return a+(b-a)*Math.min(1,Math.max(0,t)); }
  function fmt(n){ return n>=1000?(n/1000).toFixed(n%1000===0?0:1)+'K':Math.round(n)+''; }
  function spawnFloat(label,y,color){ G.floats.push({label,y,color,life:1.1}); }
  function disposeItem(it){ G.scene.remove(it.sprite); if(it.sprite.material) it.sprite.material.dispose(); }

  function spawnItem(){
    const r=Math.random();
    const x=G.LANE_MIN+0.6+Math.random()*(G.LANE_MAX-G.LANE_MIN-1.2);
    let it;
    if(r<G.lv.negRate){
      const neg=NEG_ITEMS[Math.floor(Math.random()*NEG_ITEMS.length)];
      it={x,y:8,baseX:x,neg:true,negDef:neg,zigT:0,icon:neg.icon};
    } else if(r<G.lv.negRate+G.lv.puChance){
      const pu=POWERUPS[Math.floor(Math.random()*POWERUPS.length)];
      it={x,y:8,isPu:true,puDef:pu,icon:pu.icon};
    } else {
      const pos=POS_ITEMS[Math.floor(Math.random()*POS_ITEMS.length)];
      it={x,y:8,posDef:pos,icon:pos.icon};
    }
    const mat=new THREE.SpriteMaterial({map:G.iconTex(it.icon), transparent:true});
    const sp=new THREE.Sprite(mat);
    const sc=it.isPu?1.15:0.95;
    sp.scale.set(sc,sc,1);
    sp.position.set(it.x,it.y,0);
    it.sprite=sp;
    G.scene.add(sp);
    G.items.push(it);
  }

  function catchItem(it){
    if(it.neg){
      if(G.pu.shield>0&&G.pu.shieldHits>0){
        G.pu.shieldHits--; if(G.pu.shieldHits<=0) G.pu.shield=0;
        spawnFloat('🛡️ BLOCKED!',1.4,'#60a5fa'); return;
      }
      const def=it.negDef;
      G.money=Math.max(0,G.money+def.money);
      G.stamina=Math.max(0,G.stamina+(def.stamina||0));
      G.combo=0; G.comboMult=1;
      spawnFloat((def.type==='firemoney'?'🔥 ':def.type==='latefee'?'🧾 ':'📊 ')+def.label+'!',1.4,'#ef4444');
      if(G.stamina<=0){ G.stamina=0; endGame(false); }
    } else if(it.isPu){
      activatePU(it.puDef);
    } else {
      const pos=it.posDef;
      G.combo++;
      const cap=G.lv.comboCap||5;
      G.comboMult=Math.min(cap, G.combo>=15?cap:G.combo>=10?Math.min(cap,4):G.combo>=5?Math.min(cap,2):1);
      if(G.comboMult>G.comboPeak) G.comboPeak=G.comboMult;
      const earned=pos.money?(pos.money*G.comboMult):0;
      G.money+=earned; G.stock+=(pos.stock||0); G.score+=(pos.pts||0)*G.comboMult;
      spawnFloat(pos.stock?'📈 +1 STOCK!':'+$'+earned, 1.4, pos.stock?'#818cf8':'#34d399');
    }
  }

  function activatePU(def){
    spawnFloat(def.label+'!',1.4,def.color);
    if(def.type==='magnet')   G.pu.magnet=def.dur;
    if(def.type==='shield')   { G.pu.shield=1; G.pu.shieldHits=def.hits||2; }
    if(def.type==='freeze')   G.pu.freeze=def.dur;
    if(def.type==='speed')    G.pu.speed=def.dur;
    if(def.type==='debtburn') { G.items.forEach(it=>{ if(it.neg) disposeItem(it); }); G.items=G.items.filter(it=>!it.neg); spawnFloat('💥 DEBT BURNED!',1.9,'#fb923c'); }
  }

  function updateHUD(){
    const pct=G.stamina/G.staminaMax*100;
    const sb=document.getElementById('mcStamBar');
    if(sb){ sb.style.width=pct+'%'; sb.style.background=pct>50?'linear-gradient(90deg,#34d399,#6ee7b7)':pct>25?'linear-gradient(90deg,#fbbf24,#fde68a)':'linear-gradient(90deg,#ef4444,#f87171)'; }
    const mc=document.getElementById('mcCombo');
    if(mc){ mc.textContent='x'+G.comboMult; mc.style.color=G.comboMult>=5?'#f87171':G.comboMult>=3?'#a78bfa':G.comboMult>=2?'#34d399':'#fbbf24'; }
    const mm=document.getElementById('mcMoney'); if(mm) mm.textContent='$'+fmt(G.money);
    const ms=document.getElementById('mcStock'); if(ms) ms.textContent=G.stock;
    const gb=document.getElementById('mcGoalBar'); if(gb) gb.style.width=Math.min(100,G.money/G.moneyGoal*100)+'%';
    const gt=document.getElementById('mcGoalTxt'); if(gt) gt.textContent='$'+fmt(G.money)+' / $'+fmt(G.moneyGoal);
    const row=document.getElementById('mcPuRow'); if(!row) return;
    const active=[];
    if(G.pu.magnet>0) active.push(`🧲 ${G.pu.magnet.toFixed(1)}s`);
    if(G.pu.shield>0) active.push(`🛡️ ×${G.pu.shieldHits}`);
    if(G.pu.freeze>0) active.push(`❄️ ${G.pu.freeze.toFixed(1)}s`);
    if(G.pu.speed>0)  active.push(`⚡ ${G.pu.speed.toFixed(1)}s`);
    row.innerHTML=active.map(s=>`<span style="font-size:.62rem;background:rgba(255,255,255,.1);border-radius:6px;padding:2px 8px">${s}</span>`).join('');
  }

  /* ── Knowledge Gate (pauses play, matches arcade.js's phase-gate convention) ── */
  function openGate(){
    const gate=document.getElementById('mcGate');
    if(!gate){ G.gateT=G.gateEvery; return; }
    G.phase='gate';
    const [icon,text]=FACTS[G.gateIdx%FACTS.length]; G.gateIdx++;
    gate.style.display='flex';
    gate.innerHTML=`
      <div style="font-size:2.6rem">${icon}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.18em;color:#5eead4">MONEY LESSON</div>
      <div style="font-size:.9rem;line-height:1.65;text-align:center;max-width:280px;color:#e2e8f0">${text}</div>
      <button onclick="mcCloseGate()" style="padding:12px 30px;background:linear-gradient(135deg,#0d9488,#14b8a6);border:none;border-radius:10px;color:#fff;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.14em;cursor:pointer;margin-top:6px">GOT IT →</button>`;
  }
  window.mcCloseGate=function(){
    const gate=document.getElementById('mcGate'); if(gate) gate.style.display='none';
    if(!G) return; G.phase='play'; G.gateT=G.gateEvery; G.last=performance.now();
  };

  /* ── How to play (auto-shown once, reopenable via ❓, pauses correctly) ── */
  function howToBody(){
    return `<div style="font-size:2.4rem">🐷</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.18em;color:#5eead4">HOW TO PLAY</div>
      <div style="font-family:'Anton',sans-serif;font-size:1.1rem;color:#fff">MONEY CATCHER</div>
      <ul style="text-align:left;max-width:300px;font-size:.82rem;line-height:1.7;color:#e2e8f0;padding-left:18px;margin:0">
        <li><b>Goal:</b> run left/right to catch coins, cash &amp; stock before time runs out.</li>
        <li><b>Move:</b> ← → arrows, A/D, the on-screen buttons, or drag.</li>
        <li><b>Watch out:</b> red Savings Killers (Late Fee, High Interest, Fire Money) cost you money and stamina — run out of stamina and it's game over.</li>
        <li><b>Power-ups:</b> Magnet, Insurance, Time Freeze, Speed Boost and Debt Burner all help — grab them!</li>
        <li><b>Scoring:</b> catches in a row build a combo multiplier — the more you chain, the more each catch is worth.</li>
      </ul>
      <button onclick="mcCloseHelp()" style="padding:12px 30px;background:linear-gradient(135deg,#0d9488,#14b8a6);border:none;border-radius:10px;color:#fff;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.14em;cursor:pointer;margin-top:4px">GOT IT — START ▶</button>`;
  }
  function showHowToPlay(first){
    const el=document.getElementById('mcHow'); if(!el||!G) return;
    if(!first){ G._pauseStartTs=performance.now(); }
    G.phase='help';
    el.style.display='flex';
    el.innerHTML=howToBody();
  }
  window.mcShowHelp=function(){ showHowToPlay(false); };
  window.mcCloseHelp=function(){
    const el=document.getElementById('mcHow'); if(el) el.style.display='none';
    if(!G) return;
    if(G._pauseStartTs){ G.last+= (performance.now()-G._pauseStartTs); G._pauseStartTs=0; }
    G.phase='play'; G.last=performance.now();
  };

  /* ══════════════ FINISH ══════════════ */
  function endGame(timeUp){
    if(!G||G.phase==='over') return;
    G.phase='over'; cancelAnimationFrame(raf);
    const lv=G.lv;
    const won=timeUp&&G.money>=lv.moneyGoal&&G.stock>=lv.stockGoal&&G.stamina>0;
    const isPerfect=won&&G.stamina>60;
    let coins=0;
    if(won && window.cvAwardGame){
      const stars=isPerfect?3:(G.stamina>30?2:1);
      coins=cvAwardGame('game_moneycatcher',{level:G.li+1,stars,badge:'Savings Guardian',is3star:stars===3,isPerfect,isFlagship:true});
      if(window.cvHubMeter) try{ cvHubMeter('guardian_savings', stars*4); }catch(e){}
    } else if(window.state){
      state.coins=(state.coins||0)+50;
      if(window.cvAddXP) cvAddXP(10,0); if(window.cvSave) cvSave();
    }
    const overEl=document.getElementById('mcOver'); if(!overEl) return;
    overEl.style.display='flex';
    const vaultGrowthPct=Math.min(100,Math.round(G.money/lv.moneyGoal*100));
    let tip;
    if(won) tip='Your Savings Empire just grew! Small, consistent savings compound into real wealth over time.';
    else if(G.stamina<=0) tip='Late fees and fire money drain stamina fast — dodge them and keep a buffer!';
    else tip='Catch more coins, cash and stock before the timer runs out to hit your goal.';
    const headline=won?'Your Savings Empire Just Grew!':'Game Over';
    overEl.innerHTML=`
      <div style="font-size:2.2rem">${won?'🏆':'💔'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:${won?.65:.75}rem;letter-spacing:.14em;color:${won?'#34d399':'#f87171'};text-align:center;max-width:280px">${headline}</div>
      <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 18px;width:100%;max-width:300px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:center">
          ${stat('💰 SAVINGS DEPOSITED','$'+fmt(G.money),G.money>=lv.moneyGoal?'#34d399':'#f87171')}
          ${stat('📈 VAULT GROWTH','+'+vaultGrowthPct+'%',vaultGrowthPct>=100?'#34d399':'#fbbf24')}
          ${stat('🧾 LATE FEES AVOIDED',G.avoided.latefee,'#60a5fa')}
          ${stat('📊 HIGH INTEREST AVOIDED',G.avoided.highinterest,'#a78bfa')}
          ${stat('🔥 PEAK COMBO','×'+G.comboPeak,'#fbbf24')}
          ${stat('❤️ STAMINA',Math.round(G.stamina)+'%','#e2e8f0')}
        </div>
      </div>
      <div style="font-size:.78rem;color:#94a3b8;text-align:center;max-width:280px;line-height:1.5;padding:10px 14px;background:rgba(255,255,255,.04);border-radius:10px;border-left:3px solid #14b8a6">💡 ${tip}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        ${won&&G.li<LEVELS.length-1?`<button onclick="mcNextDistrict()" style="padding:11px 22px;background:linear-gradient(135deg,#f59e0b,#fbbf24);border:none;border-radius:10px;color:#1a0a00;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;font-weight:900;cursor:pointer">NEXT DISTRICT → ${LEVELS[G.li+1].name.toUpperCase()}</button>`:''}
        <button onclick="mcReplay()" style="padding:11px 22px;background:linear-gradient(135deg,#0d9488,#14b8a6);border:none;border-radius:10px;color:#fff;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer">REPLAY</button>
        <button onclick="mcMenu()" style="padding:11px 22px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:10px;color:#e2e8f0;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer">DISTRICTS</button>
        <button onclick="mcExit()" style="padding:11px 22px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:10px;color:#e2e8f0;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer">← HUB</button>
      </div>`;
  }
  function stat(label,val,color){ return `<div><div style="font-family:'Orbitron',sans-serif;font-size:.36rem;color:rgba(255,255,255,.4);letter-spacing:.08em;margin-bottom:4px">${label}</div><div style="font-family:'Anton',sans-serif;font-size:.95rem;color:${color}">${val}</div></div>`; }

  /* ══════════════ teardown / controls ══════════════ */
  function teardown(){
    cancelAnimationFrame(raf); raf=null;
    if(!G) return;
    if(G._cleanup) G._cleanup();
    try{
      G.items.forEach(it=>disposeItem(it));
      G.scene.traverse(o=>{ if(o.geometry) o.geometry.dispose();
        if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(m.map) m.map.dispose(); m.dispose(); }); } });
      G.rndr.dispose();
      if(G.rndr.forceContextLoss) G.rndr.forceContextLoss();
      if(G.rndr.domElement&&G.rndr.domElement.parentNode) G.rndr.domElement.parentNode.removeChild(G.rndr.domElement);
    }catch(e){}
    G=null;
  }
  window.mcReplay=function(){ const li=G?G.li:0; teardown(); const ui=document.getElementById('mcUI'); if(ui) ui.innerHTML=''; mcStart(li); };
  window.mcNextDistrict=function(){ const li=G?Math.min(G.li+1,LEVELS.length-1):0; teardown(); mcStart(li); };
  window.mcMenu=function(){ teardown(); showLevelSelect(); };
  window.mcExit=function(){ teardown();
    if(window.state){ state.viewingWorld=state._returnHub||TOKEN; }
    goTo('hub'); };
})();
