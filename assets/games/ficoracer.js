/* ════════════════════════════════════════════════════════════════
   FICO RACER — GDD-aligned implementation (Kabria GDD v1.0)
   3 Tracks · 7 FICO Bands · AI Racers · Full Financial Metrics
   ════════════════════════════════════════════════════════════════ */
(function(){
  const LANES=[-2.4,0,2.4], CARZ=3.2, SPAWNZ=-120, KILLZ=10;
  const LAP_DIST=1400, MAX_FICO=850, BASE_SPEED=30;
  const COSMIC='assets/bgvid/credtech_hub.mp4';   // self-hosted (GH release serves attachment-type, breaks Safari inline play)
  let G=null, raf=null;

  /* ── 7 FICO Score Bands (from GDD Section 7) ── */
  const FICO_BANDS=[
    {min:800,max:850, name:'Legendary 850',label:'👑 Legendary 850',   glow:'#ffd700', mult:1.0,  steer:true,  filter:'drop-shadow(0 0 18px #ffd700) brightness(1.1)'},
    {min:750,max:799, name:'Platinum',      label:'⚪ Platinum Mode',   glow:'#e5e7eb', mult:1.0,  steer:true,  filter:'drop-shadow(0 12px 28px rgba(229,231,235,.5)) brightness(1.05)'},
    {min:700,max:749, name:'Elite',         label:'⭐ Elite Mode',      glow:'#fbbf24', mult:1.0,  steer:true,  filter:'drop-shadow(0 12px 28px rgba(251,191,36,.5))'},
    {min:600,max:699, name:'Prime',         label:'💚 Prime Mode',      glow:'#34d399', mult:0.95, steer:true,  filter:'drop-shadow(0 12px 28px rgba(52,211,153,.4))'},
    {min:450,max:599, name:'Builder',       label:'🔵 Builder Mode',    glow:'#38bdf8', mult:0.80, steer:true,  filter:'brightness(.88) drop-shadow(0 10px 22px rgba(56,189,248,.3))'},
    {min:300,max:449, name:'Recovery',      label:'🔴 Recovery Mode',   glow:'#f87171', mult:0.55, steer:true,  filter:'brightness(.72) sepia(.4) drop-shadow(0 8px 18px rgba(239,68,68,.3))'},
    {min:0,  max:299, name:'Crisis',        label:'💀 Crisis Mode',     glow:'#7f1d1d', mult:0.25, steer:false, filter:'grayscale(.6) brightness(.5) sepia(.5)'},
  ];
  function getBand(fico){ for(const b of FICO_BANDS) if(fico>=b.min) return b; return FICO_BANDS[6]; }

  /* ── 3 Level Definitions (GDD Section 8) ── */
  const LEVELS=[
    {
      id:0, name:'Credit City', subtitle:'BEGINNER',
      emoji:'🏙️', color:'#34d399', fog:0x0a1633, road:0x0a1633, rail:0x38bdf8,
      laps:3, desc:'Neon city streets — on-time payments & utilization basics.',
      badRate:0.28, gateInterval:22, lapTime:'60-90s',
      ambientColor:0x88aadd, pointColor:0x38bdf8,
    },
    {
      id:1, name:'Cyber Canyon', subtitle:'INTERMEDIATE',
      emoji:'🏔️', color:'#f59e0b', fog:0x0d0a1f, road:0x0d0a1f, rail:0xf59e0b,
      laps:3, desc:'Canyon roads — interest rates, debt-to-income, APR traps.',
      badRate:0.40, gateInterval:18, lapTime:'90-120s',
      ambientColor:0xaa8833, pointColor:0xf59e0b,
    },
    {
      id:2, name:'Quantum Nexus', subtitle:'ADVANCED',
      emoji:'🌌', color:'#a78bfa', fog:0x060312, road:0x060312, rail:0xa78bfa,
      laps:4, desc:'Floating megacity — fraud, investing, mortgages & wealth.',
      badRate:0.52, gateInterval:15, lapTime:'120-150s',
      ambientColor:0x6633bb, pointColor:0xa78bfa,
    },
  ];

  /* ── AI Racer Personalities (GDD Section 13) ── */
  const AI_RACERS=[
    {name:'Investor Ivy',    color:'#34d399', strategy:'steady',   startDiff:0.92, finalDiff:1.05, emoji:'🌿'},
    {name:'Maxed-Out Marcus',color:'#ef4444', strategy:'earlyfast',startDiff:1.05, finalDiff:0.82, emoji:'🔥'},
    {name:'Coupon Chloe',    color:'#f9a8d4', strategy:'safe',     startDiff:0.97, finalDiff:0.98, emoji:'💗'},
    {name:'Crypto Kyle',     color:'#a78bfa', strategy:'random',   startDiff:0.85, finalDiff:1.15, emoji:'💜'},
  ];

  /* ── Pickups (GDD Section 9) ── */
  const PICKUPS_GOOD=[
    {id:'blueCard',   shape:'card',    c:0x2563eb, fico:+20, cash:0,   debt:0,   util:-5, phist:+5, spinout:false, shield:false, fact:'💳 Blue Credit Card — responsible credit use! +20 FICO', type:'good'},
    {id:'payToken',   shape:'check',   c:0x22c55e, fico:+25, cash:0,   debt:0,   util:-3, phist:+8, spinout:false, shield:false, fact:'✅ On-Time Payment Token — payment history is 35% of FICO!', type:'good'},
    {id:'emShield',   shape:'shield',  c:0x10b981, fico:+5,  cash:0,   debt:0,   util:0,  phist:+3, spinout:false, shield:true,  fact:'🛡️ Emergency Fund Shield — savings protect against setbacks!', type:'shield'},
    {id:'coin',       shape:'coin',    c:0xfbbf24, fico:0,   cash:5,   debt:-3,  util:0,  phist:0,  spinout:false, shield:false, fact:'🪙 Small savings build big financial cushions!', type:'good'},
    {id:'bigCoin',    shape:'bigcoin', c:0xff9900, fico:+8,  cash:15,  debt:-8,  util:-4, phist:+2, spinout:false, shield:false, fact:'💰 Big savings + FICO boost! Keep stacking!', type:'good'},
    {id:'greenReset', shape:'star',    c:0x4ade80, fico:+40, cash:20,  debt:-20, util:-10,phist:+10,spinout:false, shield:false, fact:'🟢 Green Reset! Second chance — full recovery boost!', type:'bonus'},
  ];
  const PICKUPS_BAD=[
    {id:'redCard',    shape:'card',    c:0xef4444, fico:-20, cash:0,   debt:+10, util:+8, phist:-8, spinout:false, shield:false, fact:'🟥 Red Credit Card — overspending drops FICO fast!', type:'bad'},
    {id:'bnplTrap',   shape:'bag',     c:0xf97316, fico:-15, cash:0,   debt:+15, util:+12,phist:-5, spinout:false, shield:false, fact:'🛍️ BNPL Trap! Buy-now-pay-later hides costs — debt added!', type:'bad'},
    {id:'hardInquiry',shape:'scanner', c:0x9333ea, fico:-10, cash:0,   debt:0,   util:+5, phist:-3, spinout:false, shield:false, fact:'🔍 Hard Inquiry — new credit has tradeoffs. -10 FICO', type:'bad'},
    {id:'puddle',     shape:'puddle',  c:0xf59e0b, fico:-12, cash:0,   debt:0,   util:+5, phist:-5, spinout:true,  shield:false, fact:'💧 Golden Puddle — SPIN OUT! Debt trap hits hard!', type:'bad'},
    {id:'missedPay',  shape:'barrier', c:0xdc2626, fico:-28, cash:0,   debt:+18, util:+10,phist:-15,spinout:false, shield:false, fact:'❌ Missed Payment — biggest FICO killer! -28 FICO', type:'bad'},
  ];
  const PICKUPS_ADV=[
    {id:'fraudFreeze',shape:'lock',    c:0x67e8f9, fico:+12, cash:0,   debt:0,   util:0,  phist:+4, spinout:false, shield:false, fact:'🔒 Fraud Freeze — protect your identity! +12 FICO', type:'good'},
    {id:'idTheft',    shape:'skull',   c:0x6b21a8, fico:-30, cash:0,   debt:+25, util:+15,phist:-12,spinout:true,  shield:false, fact:'💀 Identity Theft! Your data was stolen. Massive losses!', type:'bad'},
    {id:'indexFund',  shape:'chart',   c:0x34d399, fico:+18, cash:25,  debt:-10, util:-8, phist:+6, spinout:false, shield:false, fact:'📈 Index Fund Boost — diversification pays off! +18 FICO', type:'good'},
  ];

  /* ── Quiz Questions (GDD Section 10) ── */
  const QUIZ=[
    {q:'Payment history is what % of your FICO score?',opts:['35%','30%','15%','10%'],ans:0,fact:'Payment history = 35% of FICO — the biggest factor!',fico:+30,cash:10},
    {q:'What utilization % should you target to protect your score?',opts:['Below 30%','Below 70%','Below 50%','Below 90%'],ans:0,fact:'Keep utilization under 30% for a healthy score.',fico:+25,cash:8},
    {q:'Which factor has the 2nd biggest impact on FICO?',opts:['Credit utilization (30%)','Credit age (15%)','Credit mix (10%)','New credit (10%)'],ans:0,fact:'Utilization is #2 at 30% — keep balances low!',fico:+25,cash:8},
    {q:'What is the highest possible FICO score?',opts:['850','900','800','1000'],ans:0,fact:'Perfect FICO is 850 — legendary status!',fico:+20,cash:5},
    {q:'An Emergency Fund protects you by...',opts:['Covering costs without debt','Raising your credit limit','Lowering interest rates','Closing old accounts'],ans:0,fact:'Emergency funds let you cover setbacks without going into debt!',fico:+28,cash:12},
    {q:'Buy-Now-Pay-Later products...',opts:['Can hurt credit if misused','Always help credit','Are never reported','Have zero interest'],ans:0,fact:'BNPL traps add up — only buy what you can repay now.',fico:+20,cash:5},
    {q:'How long does a missed payment stay on your credit report?',opts:['7 years','2 years','6 months','10 years'],ans:0,fact:'Missed payments stay 7 years — on-time payments are everything.',fico:+22,cash:7},
    {q:'What should you do if your identity is stolen?',opts:['Freeze credit & report it','Ignore it','Close all accounts','Dispute nothing'],ans:0,fact:'Fraud freeze + immediate reporting = best defense!',fico:+30,cash:15},
    {q:'Why diversify your investments?',opts:['Reduce risk across assets','Get higher returns always','Avoid paying taxes','Increase utilization'],ans:0,fact:'Diversification spreads risk — one crash won\'t destroy everything.',fico:+25,cash:10},
    {q:'Paying minimum balance monthly will...',opts:['Cost more in interest','Pay off debt faster','Raise your score quickly','Close the account'],ans:0,fact:'Minimum payments = debt lingers and interest piles up.',fico:+20,cash:5},
    {q:'What is the Debt Snowball method?',opts:['Pay smallest debts first','Pay highest interest first','Pay equally across all debts','Ignore debt until income rises'],ans:0,fact:'Snowball = quick wins motivate you to stay debt-free!',fico:+22,cash:8},
    {q:'A FICO score of 750 is considered...',opts:['Very Good','Fair','Excellent','Poor'],ans:0,fact:'750-799 is Very Good / Elite Mode — strong financial choices!',fico:+20,cash:5},
  ];

  window.frInit=function(){ G=null; };

  function ensureThree(cb){
    if(window.THREE) return cb();
    if(window._three3dQ){ window._three3dQ.push(cb); return; }
    window._three3dQ=[cb];
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload=()=>{ const q=window._three3dQ; window._three3dQ=null; q.forEach(f=>f()); };
    s.onerror=()=>{ window._three3dQ=null; s.remove(); const w=document.getElementById('fr3dWrap'); if(w) w.innerHTML='<div style="color:#fff;text-align:center;padding-top:40vh;font-family:Orbitron,sans-serif">3D engine failed — check connection and try again.</div>'; };
    document.head.appendChild(s);
  }

  /* ── SCREENS entry point → show level select ── */
  window.SCREENS.game_ficoracer=function(){
    setTimeout(()=>ensureThree(showLevelSelect),30);
    return `<div id="frRoot" style="position:absolute;inset:0;background:#03040c;overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <video id="frBgVid" autoplay loop muted playsinline poster="assets/bg/cosmic_main.jpeg"
        style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.9;z-index:0">
        <source src="${COSMIC}" type="video/mp4">
      </video>
      <div style="position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse at 50% 45%,transparent 45%,rgba(3,4,12,.6) 85%)"></div>
      <div id="frUI" style="position:absolute;inset:0;z-index:2"></div>
    </div>`;
  };

  /* ── Level Select Screen ── */
  function showLevelSelect(){
    const bv=document.getElementById('frBgVid'); if(bv) bv.play().catch(()=>{});
    const ui=document.getElementById('frUI'); if(!ui) return;
    ui.innerHTML=`
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;gap:16px">
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.3em;color:#38bdf8;text-shadow:0 0 20px rgba(56,189,248,.7)">CREDTECH GALAXY</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:clamp(1.4rem,4vw,2.4rem);font-weight:900;background:linear-gradient(135deg,#fbbf24,#f59e0b,#34d399);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center">🏎️ FICO RACER</div>
      <div style="font-size:.75rem;color:rgba(255,255,255,.55);letter-spacing:.1em;margin-top:-8px">BUILD YOUR CREDIT · OUTRACE YOUR FUTURE</div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;width:100%;max-width:680px;margin-top:8px">
        ${LEVELS.map((lv,i)=>`
        <button onclick="frSelectLevel(${i})" style="
          padding:18px 14px;border-radius:16px;cursor:pointer;text-align:left;
          border:1.5px solid ${lv.color}44;
          background:linear-gradient(135deg,rgba(10,16,40,.85),rgba(3,4,12,.9));
          transition:all .2s;
          ${i===1?'opacity:.92':''}
          ${i===2?'opacity:.88':''}
        " onmouseover="this.style.border='1.5px solid ${lv.color}';this.style.boxShadow='0 0 24px ${lv.color}33'"
           onmouseout="this.style.border='1.5px solid ${lv.color}44';this.style.boxShadow='none'">
          <div style="font-size:1.6rem;margin-bottom:6px">${lv.emoji}</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.15em;color:${lv.color};margin-bottom:3px">${lv.subtitle}</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:.84rem;font-weight:700;color:#fff;margin-bottom:5px">${lv.name}</div>
          <div style="font-size:.7rem;color:rgba(255,255,255,.55);line-height:1.4">${lv.desc}</div>
          <div style="margin-top:8px;display:flex;gap:8px;font-size:.62rem;color:rgba(255,255,255,.4)">
            <span>🏁 ${lv.laps} Laps</span><span>⏱ ${lv.lapTime}</span>
          </div>
        </button>`).join('')}
      </div>

      <div style="margin-top:6px;display:flex;flex-direction:column;align-items:center;gap:6px">
        <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.2em;color:rgba(255,255,255,.35)">YOUR STARTING CAR</div>
        <div style="padding:10px 20px;border:1px solid rgba(52,211,153,.3);border-radius:12px;background:rgba(10,16,40,.6);display:flex;align-items:center;gap:12px">
          <div style="font-size:1.4rem">🏎️</div>
          <div>
            <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;color:#34d399">CredRunner S</div>
            <div style="font-size:.62rem;color:rgba(255,255,255,.45)">Handling 8 · Speed 5 · Boost 4</div>
          </div>
          <div style="font-size:.62rem;color:#34d399;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);border-radius:6px;padding:3px 8px">STARTER</div>
        </div>
      </div>

      <button onclick="frExit()" style="margin-top:4px;padding:8px 18px;border:1px solid rgba(255,255,255,.15);border-radius:9px;background:transparent;color:rgba(255,255,255,.5);font-family:'Orbitron',sans-serif;font-size:.52rem;letter-spacing:.1em;cursor:pointer">← BACK TO CREDTECH</button>
    </div>`;
  }

  window.frSelectLevel=function(idx){
    G=null;
    window._frLevel=LEVELS[idx];
    const ui=document.getElementById('frUI'); if(!ui) return;
    ui.innerHTML=`
    <div id="fr3dWrap" style="position:absolute;inset:0;z-index:1">
      <div id="fr3dLoad" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.2em">
        <div style="font-size:2rem">🏎️</div>LAUNCHING ${window._frLevel.name.toUpperCase()}…
      </div>
    </div>
    <img id="frCar" src="assets/games/car.png"
      style="position:absolute;left:50%;bottom:0;width:min(34vw,420px);z-index:3;transform:translateX(-50%);transition:transform .18s cubic-bezier(.34,1.2,.64,1);pointer-events:none;filter:drop-shadow(0 14px 34px rgba(0,0,0,.7))">
    <!-- Top bar -->
    <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:10px;padding:10px 16px;background:linear-gradient(180deg,rgba(3,4,12,.85),transparent);pointer-events:none">
      <button onclick="frExit()" style="pointer-events:auto;padding:6px 12px;border:1px solid rgba(56,189,248,.4);border-radius:9px;background:rgba(56,189,248,.1);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.55rem;cursor:pointer">← EXIT</button>
      <div style="font-family:'Orbitron',sans-serif;font-size:.66rem;letter-spacing:.2em;color:#38bdf8;flex:1;text-align:center">🏎️ FICO RACER — ${window._frLevel.name.toUpperCase()}</div>
      <div id="frPosTxt" style="font-family:'Orbitron',sans-serif;font-size:.7rem;color:#fbbf24;min-width:54px;text-align:center">P1/5</div>
      <div id="frLapTxt" style="font-family:'Orbitron',sans-serif;font-size:.7rem;color:#e5e7eb;min-width:54px;text-align:right">LAP 1/${window._frLevel.laps}</div>
    </div>
    <!-- FICO bar -->
    <div style="position:absolute;top:48px;left:14px;right:14px;z-index:5;pointer-events:none">
      <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.46rem;letter-spacing:.1em;color:rgba(255,255,255,.6);margin-bottom:2px">
        <span>FICO SCORE</span><span id="frFicoTxt" style="color:#34d399">850</span>
      </div>
      <div style="height:8px;border-radius:5px;background:rgba(0,0,0,.4);overflow:hidden;border:1px solid rgba(56,189,248,.3)">
        <div id="frFicoBar" style="height:100%;width:100%;background:linear-gradient(90deg,#ef4444,#f59e0b,#fbbf24,#34d399);transition:width .25s"></div>
      </div>
      <div id="frBandLabel" style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:#34d399;margin-top:2px;text-align:right">👑 Legendary 850</div>
      <!-- Stats row -->
      <div style="display:flex;gap:5px;margin-top:5px">
        ${sbox('CASH 💵','frCash','#34d399')}
        ${sbox('DEBT 💸','frDebt','#ef4444')}
        ${sbox('UTIL% 📊','frUtil','#f59e0b')}
        ${sbox('PAY HX ✅','frPhist','#38bdf8')}
      </div>
    </div>
    <!-- AI positions -->
    <div id="frAIbar" style="position:absolute;top:50%;right:12px;transform:translateY(-50%);z-index:5;display:flex;flex-direction:column;gap:4px;pointer-events:none"></div>
    <!-- Fact banner -->
    <div id="frFact" style="position:absolute;left:50%;top:148px;transform:translateX(-50%);z-index:6;max-width:82%;display:none;pointer-events:none"></div>
    <!-- Knowledge Gate HUD (non-blocking) -->
    <div id="frGateHUD" style="position:absolute;bottom:80px;left:50%;transform:translateX(-50%);z-index:8;width:min(94%,520px);display:none;pointer-events:auto"></div>
    <!-- Lap flash -->
    <div id="frLapFlash" style="position:absolute;inset:0;z-index:7;display:none;align-items:center;justify-content:center;pointer-events:none"></div>
    <!-- Game over overlay -->
    <div id="frOver" style="position:absolute;inset:0;z-index:10;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.9);backdrop-filter:blur(5px)"></div>
    <!-- Controls hint -->
    <div style="position:absolute;left:0;right:0;bottom:10px;text-align:center;z-index:4;font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.08em;color:rgba(255,255,255,.35);pointer-events:none">← → / SWIPE to STEER · 💳✅🛡️ = GOOD · 🟥🛍️⛔ = DANGER</div>`;
    ensureThree(boot);
  };

  function sbox(l,id,c){ return `<div style="flex:1;text-align:center;background:rgba(10,16,40,.55);border:1px solid rgba(56,189,248,.2);border-radius:8px;padding:4px 2px"><div style="font-family:'Orbitron',sans-serif;font-size:.32rem;letter-spacing:.05em;color:rgba(255,255,255,.4)">${l}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:.88rem;color:${c}">0</div></div>`; }

  /* ── Three.js boot ── */
  function boot(){
    const wrap=document.getElementById('fr3dWrap'); if(!wrap||!window.THREE) return;
    const ld=document.getElementById('fr3dLoad'); if(ld) ld.remove();
    const T=window.THREE;
    const lv=window._frLevel||LEVELS[0];
    const W=wrap.clientWidth, H=wrap.clientHeight;
    const scene=new T.Scene(); scene.fog=new T.Fog(lv.fog,55,125);
    const cam=new T.PerspectiveCamera(70,W/H,0.1,300); cam.position.set(0,3.6,8); cam.lookAt(0,1,-14);
    const rndr=new T.WebGLRenderer({antialias:true,alpha:true}); rndr.setClearColor(0x000000,0);
    rndr.setPixelRatio(Math.min(2,devicePixelRatio)); rndr.setSize(W,H); wrap.appendChild(rndr.domElement);

    scene.add(new T.AmbientLight(lv.ambientColor,0.85));
    const dir=new T.DirectionalLight(0xffffff,1.0); dir.position.set(4,10,6); scene.add(dir);
    const pt=new T.PointLight(lv.pointColor,1.6,46); pt.position.set(0,6,6); scene.add(pt);

    // Road
    const road=new T.Mesh(new T.PlaneGeometry(9,400),
      new T.MeshStandardMaterial({color:lv.road,roughness:.85,metalness:.2,transparent:true,opacity:.96}));
    road.rotation.x=-Math.PI/2; road.position.z=-160; scene.add(road);
    const railM=new T.MeshBasicMaterial({color:lv.rail});
    [-4.5,4.5].forEach(x=>{ const r=new T.Mesh(new T.BoxGeometry(0.16,0.5,400),railM); r.position.set(x,0.25,-160); scene.add(r); });

    // Lane dashes
    const dashM=new T.MeshBasicMaterial({color:lv.id===2?0x9370db:0xbcd4ff,transparent:true,opacity:.6});
    const dashes=[]; const DASH_N=28, DASH_GAP=6;
    for(let i=0;i<DASH_N;i++){ for(const lx of [-1.2,1.2]){ const d=new T.Mesh(new T.BoxGeometry(0.14,0.02,2.4),dashM); d.position.set(lx,0.02,-i*DASH_GAP); scene.add(d); dashes.push(d); } }

    // Road rungs
    const rungM=new T.MeshBasicMaterial({color:lv.id===1?0x1d0a00:lv.id===2?0x0e0020:0x1b3a66,transparent:true,opacity:.5});
    const rungs=[]; const RUNG_N=44, RUNG_GAP=5;
    for(let i=0;i<RUNG_N;i++){ const r=new T.Mesh(new T.BoxGeometry(9,0.02,0.1),rungM); r.position.set(0,0.011,-i*RUNG_GAP); scene.add(r); rungs.push(r); }

    // AI racers 3D representations
    const aiMeshes=[];
    AI_RACERS.forEach((ai,i)=>{
      const col=parseInt(ai.color.replace('#',''),16);
      const m=new T.Mesh(new T.BoxGeometry(1.1,0.6,1.8),
        new T.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.5,metalness:.7,roughness:.3}));
      m.position.set(LANES[i%3],0.45,-(30+i*18));
      scene.add(m); aiMeshes.push(m);
    });

    G={ T,scene,cam,rndr,wrap,dashes,rungs,aiMeshes,
        dead:false,phase:'play', lv,
        lane:1, fico:MAX_FICO,
        cash:0, debt:0, util:15, payHist:100,
        items:[], spawnT:0,
        dist:0, lapDist:0, lap:1, totalLaps:lv.laps,
        speed:BASE_SPEED, shake:0, spinout:0,
        shieldActive:false, shieldTimer:0,
        band:FICO_BANDS[0],
        aiDists:AI_RACERS.map(()=>0),
        aiSpeeds:AI_RACERS.map(()=>BASE_SPEED*(0.9+Math.random()*0.15)),
        last:performance.now(),
        DASH_SPAN:DASH_N*DASH_GAP, RUNG_SPAN:RUNG_N*RUNG_GAP,
        gateT:lv.gateInterval, gateIdx:0,
        gateOpen:false, gateTimer:0, gateQ:null,
        paymentsOnTime:0, missedPayments:0, bonusQuiz:0,
        placement:1, raceDist:0,
        quizBank:[...QUIZ].sort(()=>Math.random()-.5),
    };

    updateCarDOM(0); updateBand(); syncUI(); buildAIBar();

    // Input
    const lane=(d)=>{
      if(!G||G.phase!=='play') return;
      if(G.spinout>0||!G.band.steer) return;
      const p=G.lane; G.lane=Math.max(0,Math.min(2,G.lane+d));
      if(G.lane!==p) updateCarDOM(G.lane>p?1:-1);
      // Gate lane answer
      if(G.gateOpen && G.gateQ) checkGateLane();
    };
    G.kd=e=>{ if(e.key==='ArrowLeft') lane(-1); else if(e.key==='ArrowRight') lane(1); };
    window.addEventListener('keydown',G.kd);
    G.cv=rndr.domElement; G.tsx=null;
    G.cvTS=e=>{ G.tsx=e.touches[0].clientX; };
    G.cvTE=e=>{
      if(G.tsx==null) return;
      const dx=e.changedTouches[0].clientX-G.tsx;
      if(Math.abs(dx)>24) lane(dx>0?1:-1);
      else { const r=G.cv.getBoundingClientRect(); lane(e.changedTouches[0].clientX<r.left+r.width/2?-1:1); }
      G.tsx=null;
    };
    G.cvMD=e=>{ const r=G.cv.getBoundingClientRect(); lane(e.clientX<r.left+r.width/2?-1:1); };
    G.cv.addEventListener('touchstart',G.cvTS,{passive:true});
    G.cv.addEventListener('touchend',G.cvTE,{passive:true});
    G.cv.addEventListener('mousedown',G.cvMD);
    G.onResize=()=>{ if(!G||G.dead) return; const w=wrap.clientWidth,h=wrap.clientHeight; G.cam.aspect=w/h; G.cam.updateProjectionMatrix(); G.rndr.setSize(w,h); };
    window.addEventListener('resize',G.onResize);
    G.last=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  /* ── Spawn pickup ── */
  function spawn(){
    const T=G.T, lv=G.lv;
    const ln=Math.floor(Math.random()*3);
    let pool;
    const r=Math.random();
    const advChance=lv.id===2?0.15:0.05;
    if(r<advChance && lv.id>=1) pool=PICKUPS_ADV;
    else if(r<advChance+lv.badRate) pool=PICKUPS_BAD;
    else pool=PICKUPS_GOOD;
    const def=pool[Math.floor(Math.random()*pool.length)];
    let mesh;
    if(def.shape==='coin'||def.shape==='bigcoin'){
      mesh=new T.Mesh(new T.CylinderGeometry(def.shape==='bigcoin'?.78:.6,def.shape==='bigcoin'?.78:.6,0.14,18),
        new T.MeshStandardMaterial({color:def.c,metalness:.85,roughness:.2,emissive:def.c,emissiveIntensity:.4}));
      mesh.rotation.x=Math.PI/2; mesh.position.y=0.9;
    } else if(def.shape==='barrier'||def.shape==='skull'){
      mesh=new T.Mesh(new T.BoxGeometry(1.8,0.9,0.4),
        new T.MeshStandardMaterial({color:def.c,emissive:def.c,emissiveIntensity:.8,metalness:.3}));
      mesh.position.y=0.45;
    } else if(def.shape==='puddle'){
      mesh=new T.Mesh(new T.CylinderGeometry(1.1,.85,0.1,14),
        new T.MeshStandardMaterial({color:def.c,transparent:true,opacity:.82,emissive:0x78350f,emissiveIntensity:.7}));
      mesh.position.y=0.06;
    } else if(def.shape==='shield'){
      mesh=new T.Mesh(new T.OctahedronGeometry(0.7,0),
        new T.MeshStandardMaterial({color:def.c,emissive:def.c,emissiveIntensity:.6,transparent:true,opacity:.85}));
      mesh.position.y=1.0;
    } else if(def.shape==='bag'||def.shape==='scanner'||def.shape==='lock'||def.shape==='chart'||def.shape==='star'){
      mesh=new T.Mesh(new T.TetrahedronGeometry(0.75,0),
        new T.MeshStandardMaterial({color:def.c,emissive:def.c,emissiveIntensity:.7,metalness:.5}));
      mesh.position.y=1.0;
    } else {
      mesh=new T.Mesh(new T.BoxGeometry(1.0,1.4,0.12),
        new T.MeshStandardMaterial({color:def.c,emissive:def.c,emissiveIntensity:.5,metalness:.4,roughness:.3}));
      mesh.position.y=0.9;
    }
    mesh.position.x=LANES[ln]; mesh.position.z=SPAWNZ;
    G.scene.add(mesh);
    G.items.push({mesh,lane:ln,def,spin:(Math.random()*.6+.4)*(Math.random()<.5?-1:1),dead:0,hit:false});
  }

  /* ── Main loop ── */
  function loop(now){
    const wrap=document.getElementById('fr3dWrap');
    if(!G||G.dead||!wrap){ cancelAnimationFrame(raf); return; }
    const dt=Math.min(40,now-G.last)/1000; G.last=now;

    if(G.phase==='play'){
      // Shield timer
      if(G.shieldActive){ G.shieldTimer-=dt; if(G.shieldTimer<=0) G.shieldActive=false; }
      // Spinout
      if(G.spinout>0){
        G.spinout=Math.max(0,G.spinout-dt);
        const ci=document.getElementById('frCar');
        if(ci) ci.style.transform='translateX(calc(-50% + '+((G.lane-1)*23)+'vw)) rotate('+(Math.sin(now/55)*20)+'deg)';
      }
      // Update band from FICO
      const newBand=getBand(G.fico);
      if(newBand.name!==G.band.name){ G.band=newBand; updateBand(); }
      if(G.fico<=0){ end(false); return; }   // elimination must fire even without a band change
      const mv=G.speed*G.band.mult*dt;
      G.dist+=mv*.85; G.lapDist+=mv*.85; G.raceDist+=mv*.85;
      // AI movement
      G.aiDists=G.aiDists.map((d,i)=>{
        const ai=AI_RACERS[i]; let spd=G.aiSpeeds[i];
        if(ai.strategy==='earlyfast') spd*=(1-Math.min(.3,G.dist/20000));
        else if(ai.strategy==='steady') spd*=(1+Math.min(.12,G.dist/30000));
        else if(ai.strategy==='random') spd*=(0.9+Math.sin(now/3000)*0.15);
        return d+spd*.85*dt;
      });
      // Placement vs AI (1=leading)
      const myDist=G.raceDist;
      G.placement=1+G.aiDists.filter(d=>d>myDist).length;
      updateAIBar();
      // Lap check
      if(G.lapDist>=LAP_DIST){
        G.lapDist=0; G.lap++;
        showLapFlash();
        if(G.lap>G.totalLaps){ end(true); return; }
      }
      // Road scroll
      G.dashes.forEach(d=>{ d.position.z+=mv; if(d.position.z>CARZ+6) d.position.z-=G.DASH_SPAN; });
      G.rungs.forEach(r=>{ r.position.z+=mv; if(r.position.z>CARZ+6) r.position.z-=G.RUNG_SPAN; });
      // AI car positions in 3D
      G.aiMeshes.forEach((m,i)=>{
        const dz=G.raceDist-G.aiDists[i];
        m.position.z=Math.max(-200,Math.min(8,-(dz)*0.018+2));
        m.position.y=0.45+Math.sin(now/800+i*1.3)*0.04;
      });
      // Spawn items
      G.spawnT-=dt; if(G.spawnT<=0){ G.spawnT=Math.max(.4,.95-G.dist/12000); spawn(); }
      // Items
      for(const it of G.items){
        it.mesh.position.z+=mv;
        if(['coin','bigcoin','puddle'].includes(it.def.shape)) it.mesh.rotation.z+=dt*3;
        else it.mesh.rotation.y+=it.spin*dt*2;
        const inLane=it.lane===G.lane;
        if(!it.hit && G.spinout===0 && Math.abs(it.mesh.position.z-CARZ)<1.6 && inLane){
          it.hit=true; it.dead=1; collectItem(it.def);
        } else if(it.mesh.position.z>KILLZ){ it.dead=1; }
      }
      G.items=G.items.filter(it=>{
        if(it.dead){ G.scene.remove(it.mesh); it.mesh.geometry?.dispose(); (Array.isArray(it.mesh.material)?it.mesh.material:[it.mesh.material]).forEach(m=>m.dispose()); return false; }
        return true;
      });
      // Camera shake
      if(G.shake>0){ G.shake-=dt; G.cam.position.x=(Math.random()-.5)*G.shake*1.1; G.cam.position.y=3.6+(Math.random()-.5)*G.shake; }
      else { G.cam.position.x*=0.82; G.cam.position.y=3.6; }
      // Gate timer
      G.gateT-=dt;
      if(G.gateT<=0 && !G.gateOpen) openGate();
      if(G.gateOpen){ G.gateTimer-=dt; updateGateTimer(); if(G.gateTimer<=0) closeGate(false,true); }
      syncUI();
    }
    G.rndr.render(G.scene,G.cam);
    raf=requestAnimationFrame(loop);
  }

  /* ── Update band visuals ── */
  function updateBand(){
    const b=G.band;
    const ci=document.getElementById('frCar');
    if(ci) ci.style.filter=b.filter;
    const bl=document.getElementById('frBandLabel');
    if(bl){ bl.textContent=b.label; bl.style.color=b.glow; }
    flash(b.glow);
  }

  /* ── Collect pickup ── */
  function collectItem(def){
    if(def.type==='bad' && G.shieldActive){
      G.shieldActive=false; G.shieldTimer=0;
      flash('#10b981'); showFact('🛡️ Shield blocked the hit!',false); return;
    }
    G.fico=Math.max(0,Math.min(MAX_FICO, G.fico+(def.fico||0)));
    G.cash=Math.max(0, G.cash+(def.cash||0));
    G.debt=Math.max(0, G.debt+(def.debt||0));
    G.util=Math.max(0,Math.min(100, G.util+(def.util||0)));
    G.payHist=Math.max(0,Math.min(100, G.payHist+(def.phist||0)));
    if(def.id==='payToken'||def.id==='blueCard') G.paymentsOnTime++;
    if(def.id==='missedPay'||def.id==='redCard') G.missedPayments++;
    if(def.shield){ G.shieldActive=true; G.shieldTimer=8; }
    if(def.spinout && !G.shieldActive){ G.spinout=0.85; G.shake=0.65; flash('#f59e0b'); }
    else if(def.type==='bad'){ G.shake=0.3; flash('#ef4444'); }
    else { flash('#34d399'); }
    showFact(def.fact, def.type==='bad');
  }

  /* ── Non-blocking Knowledge Gate ── */
  function openGate(){
    if(!G||G.phase!=='play'||G.gateOpen) return;
    G.gateOpen=true; G.gateTimer=8;
    const qi=G.gateIdx%G.quizBank.length; G.gateIdx++;
    const src=G.quizBank[qi];
    // shuffle the 3 lane options so the right answer isn't always Lane A
    const order=[0,1,2].sort(()=>Math.random()-0.5);
    const q={...src, opts:order.map(i=>src.opts[i]), ans:order.indexOf(src.ans||0)};
    G.gateQ=q;
    const opts=q.opts;
    const hud=document.getElementById('frGateHUD'); if(!hud) return;
    hud.style.display='block';
    hud.innerHTML=`<div style="background:rgba(3,4,12,.88);border:1.5px solid #38bdf8;border-radius:16px;padding:14px 16px;backdrop-filter:blur(4px);box-shadow:0 0 30px rgba(56,189,248,.3)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.15em;color:#7dd3fc">🎯 KNOWLEDGE GATE</div>
        <div id="frGateTmr" style="font-family:'Orbitron',sans-serif;font-size:.62rem;color:#fbbf24;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:6px;padding:2px 8px">8s</div>
      </div>
      <div style="font-size:.8rem;font-weight:600;color:#fff;margin-bottom:10px;line-height:1.4">${q.q}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
        ${opts.map((op,i)=>`<button onclick="frGateBtn(${i})" style="padding:8px 6px;border:1.5px solid rgba(56,189,248,${i===G.lane?.6:.25});border-radius:9px;background:rgba(10,16,40,${i===G.lane?.8:.5});color:#fff;font-size:.7rem;cursor:pointer;font-family:'Inter',sans-serif;transition:all .1s" onmouseover="this.style.borderColor='rgba(56,189,248,.7)'" onmouseout="this.style.borderColor='rgba(56,189,248,${i===G.lane?.6:.25})'"><span style="display:block;font-family:'Orbitron',sans-serif;font-size:.36rem;color:#38bdf8;margin-bottom:3px">LANE ${['A','B','C'][i]}</span>${op}</button>`).join('')}
      </div>
      <div style="margin-top:6px;font-size:.6rem;color:rgba(255,255,255,.35);text-align:center">Steer into the correct lane · Race continues!</div>
    </div>`;
  }

  function updateGateTimer(){
    const t=document.getElementById('frGateTmr');
    if(t && G.gateTimer>0) t.textContent=Math.ceil(G.gateTimer)+'s';
    // Highlight current lane button
    const btns=document.querySelectorAll('#frGateHUD button');
    btns.forEach((b,i)=>{
      b.style.borderColor=i===G.lane?'rgba(56,189,248,.8)':'rgba(56,189,248,.2)';
      b.style.background=i===G.lane?'rgba(56,189,248,.2)':'rgba(10,16,40,.5)';
    });
  }

  function checkGateLane(){
    if(!G||!G.gateQ||!G.gateOpen) return;
    const q=G.gateQ;
    const correct=G.lane===q.ans;
    closeGate(true, false, correct, q);
  }

  window.frGateBtn=function(idx){
    if(!G||!G.gateQ||!G.gateOpen) return;
    const q=G.gateQ;
    closeGate(true, false, idx===q.ans, q);
  };

  function closeGate(manual, timeout, correct, q){
    if(!G||!G.gateOpen) return;
    G.gateOpen=false; G.gateQ=null;
    G.gateT=G.lv.gateInterval+(Math.random()*6-3);
    const hud=document.getElementById('frGateHUD'); if(!hud) return;
    if(timeout){
      hud.innerHTML=`<div style="background:rgba(245,158,11,.1);border:1px solid #f59e0b;border-radius:12px;padding:10px 14px;text-align:center;font-size:.75rem;color:#fbbf24">⏰ Time's up! No boost earned.</div>`;
    } else if(correct && q){
      G.fico=Math.min(MAX_FICO, G.fico+(q.fico||30));
      G.cash+=(q.cash||8);
      G.bonusQuiz++;
      hud.innerHTML=`<div style="background:rgba(52,211,153,.1);border:1px solid #34d399;border-radius:12px;padding:10px 14px;text-align:center;font-size:.75rem;color:#34d399">✅ Correct! +${q.fico||30} FICO · +$${q.cash||8} · Challenge Bonus!</div>`;
      flash('#34d399');
    } else if(!timeout && q){
      G.fico=Math.max(0, G.fico-10);
      hud.innerHTML=`<div style="background:rgba(239,68,68,.1);border:1px solid #ef4444;border-radius:12px;padding:10px 14px;text-align:center;font-size:.75rem;color:#ef4444">💪 Nice try! ${q.fact}</div>`;
      flash('#ef4444');
    }
    setTimeout(()=>{ const h=document.getElementById('frGateHUD'); if(h){ h.style.display='none'; h.innerHTML=''; } }, correct||timeout?1500:2500);
  }

  /* ── AI race position bar ── */
  function buildAIBar(){
    const bar=document.getElementById('frAIbar'); if(!bar) return;
    bar.innerHTML=AI_RACERS.map((ai,i)=>`
      <div id="frAI${i}" style="display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:8px;background:rgba(10,16,40,.6);border:1px solid rgba(255,255,255,.1);font-size:.56rem">
        <span>${ai.emoji}</span>
        <span style="color:${ai.color};font-family:'Orbitron',sans-serif;font-size:.38rem">${ai.name.split(' ')[0]}</span>
        <span id="frAIpos${i}" style="color:rgba(255,255,255,.5);font-size:.38rem">P2</span>
      </div>`).join('');
  }

  function updateAIBar(){
    if(!G) return;
    const sorted=[{d:G.raceDist,ai:-1},...G.aiDists.map((d,i)=>({d,ai:i}))].sort((a,b)=>b.d-a.d);
    AI_RACERS.forEach((_,i)=>{
      const rank=sorted.findIndex(s=>s.ai===i)+1;
      const el=document.getElementById('frAIpos'+i);
      if(el) el.textContent='P'+rank;
    });
  }

  /* ── UI sync ── */
  function syncUI(){
    const pct=Math.max(0,((G.fico-300)/550*100));
    const fb=document.getElementById('frFicoBar'); if(fb) fb.style.width=pct+'%';
    const ft=document.getElementById('frFicoTxt'); if(ft){ ft.textContent=Math.round(G.fico); ft.style.color=G.band.glow; }
    setT('frCash','$'+Math.round(G.cash));
    setT('frDebt','$'+Math.round(G.debt));
    setT('frUtil',Math.round(G.util)+'%');
    setT('frPhist',Math.round(G.payHist)+'%');
    setT('frLapTxt','LAP '+Math.min(G.lap,G.totalLaps)+'/'+G.totalLaps);
    const pt=document.getElementById('frPosTxt');
    if(pt){ pt.textContent='P'+G.placement+'/5'; pt.style.color=G.placement===1?'#fbbf24':G.placement<=3?'#34d399':'#ef4444'; }
    const ci=document.getElementById('frCar');
    if(ci) ci.style.outline = G.shieldActive ? '2px solid #10b981' : 'none';
  }

  function updateCarDOM(dir){
    if(G.spinout>0) return;
    const c=document.getElementById('frCar'); if(!c||!G) return;
    const off=(G.lane-1)*23;
    c.style.transform='translateX(calc(-50% + '+off+'vw)) rotate('+(dir*10)+'deg)';
    clearTimeout(G._carT); G._carT=setTimeout(()=>{ const c2=document.getElementById('frCar'); if(c2&&G&&G.spinout===0) c2.style.transform='translateX(calc(-50% + '+off+'vw)) rotate(0deg)'; },180);
  }

  /* ── Lap flash ── */
  function showLapFlash(){
    const el=document.getElementById('frLapFlash'); if(!el) return;
    el.style.display='flex';
    const lv=G.lv;
    el.innerHTML=`<style>@keyframes frLA{0%{opacity:0;transform:scale(.5)}45%{opacity:1;transform:scale(1.15)}80%{opacity:1;transform:scale(1)}100%{opacity:0}}</style>
      <div style="font-family:'Orbitron',sans-serif;font-size:2rem;color:${lv.color};text-shadow:0 0 30px ${lv.color}99;animation:frLA .9s ease forwards">${G.lap>G.totalLaps?'🏁 FINISH!':'LAP '+G.lap+' / '+G.totalLaps}</div>`;
    setTimeout(()=>{ el.style.display='none'; el.innerHTML=''; },950);
  }

  /* ── End screen ── */
  function end(win){
    if(!G||G.phase==='over') return; G.phase='over';
    if(window.state){
      const _lvBases=[400,600,900]; const _lvPerf=[100,150,200]; const _lvColl=[50,100,150];
      const _li=G.lv.id; const _isPerfect=win&&G.missedPayments===0;
      const rw=(_lvBases[_li]||400)+((_isPerfect?_lvPerf[_li]:0)||0)+Math.min(G.bonusQuiz,5)*(_lvColl[_li]||50);
      state.coins=(state.coins||0)+rw;
      if(window.cvAddXP) cvAddXP(Math.round(rw/4),0);
      if(window.cvSave) cvSave();
      state.gamesDone=state.gamesDone||{};
      state.gamesDone['credtech:0']=1;
    }
    const fi=Math.round(G.fico);
    const ficoChange=fi-850; // started at 850
    const band=getBand(fi);
    const o=document.getElementById('frOver'); if(!o) return; o.style.display='flex';
    const row=(lb,val,c='rgba(255,255,255,.85)')=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:.8rem"><span style="color:rgba(255,255,255,.5)">${lb}</span><span style="color:${c};font-weight:700">${val}</span></div>`;
    const placeLabel=['','🥇 1st','🥈 2nd','🥉 3rd','4th','5th'][G.placement]||G.placement+'th';
    const placeColor=G.placement===1?'#ffd700':G.placement===2?'#e5e7eb':G.placement===3?'#fb923c':'#94a3b8';
    o.innerHTML=`<div style="max-width:460px;width:100%;text-align:center;padding:24px 20px;border:1.5px solid ${win?'#fbbf24':'#38bdf8'};border-radius:22px;background:linear-gradient(160deg,rgba(10,16,40,.97),rgba(3,4,12,.97));box-shadow:0 0 60px rgba(56,189,248,.25);overflow-y:auto;max-height:90vh">
      <div style="font-size:2.4rem;margin-bottom:4px">${win?'🏁':'💥'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.2em;color:${win?'#fbbf24':'#94a3b8'};margin-bottom:6px">${win?'RACE COMPLETE!':'ELIMINATED'} — ${G.lv.name.toUpperCase()}</div>
      <div style="font-family:'Anton',sans-serif;font-size:1.4rem;color:${band.glow};margin-bottom:4px">${band.label}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:1.1rem;color:${placeColor};margin-bottom:14px">${placeLabel} Place</div>
      <div style="background:rgba(0,0,0,.3);border-radius:12px;padding:10px 14px;text-align:left;margin-bottom:14px">
        ${row('FICO Score','850 → '+fi+(ficoChange>=0?' (+'+ficoChange+')':' ('+ficoChange+')'),fi>=700?'#34d399':fi>=500?'#fbbf24':'#ef4444')}
        ${row('Cash Earned 💵','$'+Math.round(G.cash),'#34d399')}
        ${row('Debt Accumulated 💸','$'+Math.round(G.debt),G.debt>0?'#ef4444':'#34d399')}
        ${row('Credit Utilization 📊',Math.round(G.util)+'%',G.util<30?'#34d399':G.util<50?'#fbbf24':'#ef4444')}
        ${row('Payment History ✅',Math.round(G.payHist)+'%',G.payHist>=80?'#34d399':G.payHist>=60?'#fbbf24':'#ef4444')}
        ${row('Payments On Time',G.paymentsOnTime,G.paymentsOnTime>0?'#38bdf8':'rgba(255,255,255,.4)')}
        ${row('Missed Payments',G.missedPayments,G.missedPayments===0?'#34d399':'#ef4444')}
        ${row('Challenge Bonuses 🎯',G.bonusQuiz,G.bonusQuiz>0?'#fbbf24':'rgba(255,255,255,.4)')}
        ${row('Laps Completed 🏁',Math.min(G.lap-(win?0:1),G.totalLaps)+'/'+G.totalLaps)}
      </div>
      <div style="padding:10px 14px;border:1px solid rgba(56,189,248,.2);border-radius:10px;background:rgba(56,189,248,.06);font-size:.72rem;color:#7dd3fc;margin-bottom:14px;text-align:left">
        ${getLessonTip(fi,G.util,G.payHist,G.debt)}
      </div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button onclick="frRestart()" style="padding:11px 20px;border:none;border-radius:13px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.1em;font-weight:900;cursor:pointer">▶ RACE AGAIN</button>
        <button onclick="frChangeLv()" style="padding:11px 18px;border:1px solid rgba(251,191,36,.5);border-radius:13px;background:rgba(251,191,36,.08);color:#fbbf24;font-family:'Orbitron',sans-serif;font-size:.6rem;cursor:pointer">🏆 CHANGE LEVEL</button>
        <button onclick="frExit()" style="padding:11px 18px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.6rem;cursor:pointer">← HUB</button>
      </div>
    </div>`;
  }

  function getLessonTip(fico,util,phist,debt){
    if(fico>=800) return '🌟 <strong>Legendary Credit!</strong> Keep making on-time payments and staying under 30% utilization.';
    if(debt>100) return '💡 <strong>Next Goal:</strong> Reduce debt first — debt adds weight and slows your car (and financial future).';
    if(util>50) return '💡 <strong>Next Goal:</strong> Lower credit utilization below 30%. High utilization is your second-biggest score killer.';
    if(phist<70) return '💡 <strong>Next Goal:</strong> Set up autopay for all bills. Payment history is 35% of FICO — it\'s the biggest factor!';
    if(fico<500) return '💡 <strong>Keep going!</strong> Recovery takes time. On-time payments and lower balances will rebuild your score.';
    return '💡 <strong>Pro Tip:</strong> Mix on-time payments + low utilization + no new debt = FICO rising every month!';
  }

  /* ── Teardown ── */
  function teardown(){
    if(!G) return; G.dead=true; cancelAnimationFrame(raf);
    if(G.kd) window.removeEventListener('keydown',G.kd);
    if(G.onResize) window.removeEventListener('resize',G.onResize);
    if(G.cv){ if(G.cvTS) G.cv.removeEventListener('touchstart',G.cvTS); if(G.cvTE) G.cv.removeEventListener('touchend',G.cvTE); if(G.cvMD) G.cv.removeEventListener('mousedown',G.cvMD); }
    try{
      G.scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose()); } });
      G.rndr.dispose();
      if(G.rndr.forceContextLoss) G.rndr.forceContextLoss();   // actually release the WebGL context
      if(G.rndr.domElement?.parentNode) G.rndr.domElement.parentNode.removeChild(G.rndr.domElement);
    }catch(e){}
    G=null;
  }

  window.frRestart=function(){
    const lv=G?G.lv:(window._frLevel||LEVELS[0]);
    teardown();
    const ui=document.getElementById('frUI'); if(!ui){ showLevelSelect(); return; }
    ui.innerHTML=''; window._frLevel=lv;
    frSelectLevel(lv.id);
  };
  window.frChangeLv=function(){
    teardown();
    showLevelSelect();
  };
  window.frExit=function(){
    teardown();
    if(window.state) state.viewingWorld=state._returnHub||'credtech';
    goTo('credtech_hub');
  };

  /* ── Utilities ── */
  function setT(id,v){ const e=document.getElementById(id); if(e) e.textContent=v; }
  function flash(c){ const w=document.getElementById('fr3dWrap')||document.getElementById('frRoot'); if(!w) return; const f=document.createElement('div'); f.style.cssText='position:absolute;inset:0;pointer-events:none;background:'+c+';opacity:.18;transition:opacity .35s;z-index:2'; w.appendChild(f); requestAnimationFrame(()=>f.style.opacity='0'); setTimeout(()=>f.remove(),380); }
  function showFact(txt,bad){
    const el=document.getElementById('frFact'); if(!el||!txt) return;
    el.style.display='block';
    el.innerHTML=`<div style="background:rgba(3,4,12,.88);border:1px solid ${bad?'rgba(239,68,68,.6)':'rgba(52,211,153,.6)'};border-radius:12px;padding:8px 14px;font-size:.76rem;color:#fff;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.5)">${txt}</div>`;
    clearTimeout(window._frFT); window._frFT=setTimeout(()=>{ const e=document.getElementById('frFact'); if(e) e.style.display='none'; },2200);
  }
})();
