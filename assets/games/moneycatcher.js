/* ════════════════════════════════════════════════════════════════
   MONEY CATCHER 3.0 — true-3D rebuild against KaBria's real "Money
   Catcher 3.0 GDD" (SaveScape Orbit / Guardian flagship). Closes the
   gap from the ~30% MVP-only build up to the GDD's full scope table:
   - 5 SaveScape Districts (GDD §05, all 5 not just the MVP's 2-3):
     Penny Park 2075 → Allowance Alley → Savings Bay → Shopping
     District → Fortune Galaxy. Combo caps ×5/×7/×8/×6/×10 exactly
     as GDD-specified per district.
   - Savings Vault (§06): a LIFETIME cross-run total (state.mc_vaultTotal)
     against the GDD's exact 10-level/$25K→$25M threshold table, with
     the 5 cosmetic themes (Classic/Silver/Gold/Diamond/Cosmic).
   - Piggy Evolution (§07): 6 stages derived from Vault Level, each
     granting the GDD's own passive bonus (money%, combo buffer, small
     magnet, bonus vault XP).
   - Savings Landmarks (§10): 5 landmarks auto-built at Vault Level
     milestones, each a small stacking money bonus.
   - Rare Drops (§08) + Collection Book (§09): end-of-run weighted
     Common/Rare/Epic/Legendary chest (GDD's exact 70/20/8/2 odds),
     feeding a lightweight Money/Piggies/Vaults/Badges collection.
   - Daily Missions + Streaks (§12): 3 rotating daily missions (date-
     seeded, no server timer needed) + a play-streak counter.
   - Savings Killers (§13): all 5 named hazards — Late Fee, Impulse
     Purchase, Broken Piggy Bank (breaks combo), Emergency Expense
     (drains stamina), Fire Money — not just the original 3.
   - Power-Ups 2.0 (§11): the original 5 (exact PlayerManager.cs
     numbers: magnet 5s, insurance 2 charges, freeze 3s, speed 6s@1.5x,
     debt-burn instant) PLUS Golden Piggy (2x money), Coin Storm (bonus
     coin burst) and Super Saver Mode (combo-safe window) — 8 of the
     GDD's 9; "Vault Multiplier" deliberately merged into Golden Piggy
     since this sim has no separate collect-vs-deposit step, so a
     distinct 2x-on-deposit power-up would be mechanically identical.
   - End-of-run screen (§15) extended with Impulse Avoided, Collection
     Items Found, Rare Drop earned, and a local "Savings Empire Rank."
   - Real 3D hero + billboarded item sprites, per-district procedural
     3D decor, lane bounds (minX=-4/maxX=4) — all unchanged from the
     prior 3D pass.
   NOT built (all explicitly Phase 2/3 or excluded in the GDD's own
   §16 MVP-scope table, and this app has zero backend — confirmed no
   API server is deployed, everything is localStorage-only): real-time
   multiplayer (Coin Rush/Squads/Tournaments/Classroom Mode), seeded-RNG
   ghost-run replays, and any real-money/IAP. The GDD's "Async
   leaderboard" is implemented ONLY as a clearly-local, deterministic
   cosmetic rank estimate — never real networked data.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='guardian';
  let G=null, raf=null;

  window.mcInit=function(){ if(G) teardown(); G=null; mcMetaHydrate(); };

  /* ── Level definitions (GDD v3.0 — 3 SaveScape Districts, unchanged) ── */
  const LEVELS=[
    {name:'Penny Park 2075', env:'park', dur:90,  moneyGoal:10000, stockGoal:15, spawnRate:2.0, ramp:0.02, negRate:0.10, speedStart:1.0, speedEnd:1.5, puChance:0.10, comboCap:5,
      sky:0xaee4ff, ground:'#4caf6e', desc:'Wide open lawns. Learn the basics of catching and saving.'},
    {name:'Allowance Alley', env:'alley', dur:120, moneyGoal:25000, stockGoal:30, spawnRate:2.4, ramp:0.025,negRate:0.13, speedStart:1.0, speedEnd:1.65,puChance:0.08, comboCap:7,
      sky:0xffd9a0, ground:'#8a8f98', desc:'Busier streets, faster drops. Dodge Late Fees and Impulse Purchases.'},
    {name:'Savings Bay',     env:'bay',  dur:150, moneyGoal:50000, stockGoal:50, spawnRate:2.8, ramp:0.03, negRate:0.17, speedStart:1.05,speedEnd:1.85,puChance:0.06, comboCap:8,
      sky:0x8fd8ff, ground:'#3a6f7d', desc:'An ocean savings paradise. Consistent saving creates treasure.'},
    {name:'Shopping District', env:'shop', dur:165, moneyGoal:80000, stockGoal:70, spawnRate:3.1, ramp:0.032,negRate:0.20, speedStart:1.05,speedEnd:1.95,puChance:0.07, comboCap:6,
      sky:0xd9a8e8, ground:'#5b4a6a', desc:'Temptation everywhere. Dodge Impulse Spending Traps — not every purchase is necessary.'},
    {name:'Fortune Galaxy',  env:'galaxy',dur:180, moneyGoal:120000,stockGoal:90, spawnRate:3.4, ramp:0.035,negRate:0.22, speedStart:1.1, speedEnd:2.05,puChance:0.06, comboCap:10,
      sky:0x140a30, ground:'#241540', desc:'The ultimate savings destination. Long-term saving creates real wealth.'},
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

  // ElementType.LateFee / HighInterest / FireMoney — the 3 delivered Savings Killers,
  // PLUS the GDD §13 "Savings Killers" table's other 2 named hazards (Impulse Purchase
  // — introduced in Allowance Alley per §05 — and Broken Piggy Bank / Emergency Expense).
  // No new PNG assets exist for these 3, so they use canvas-drawn emoji icons (see
  // customIconTex below) instead of a delivered file — same visual language, no new
  // asset dependency. minDistrict gates when a hazard starts appearing (0-based index).
  const NEG_ITEMS=[
    {type:'latefee',      icon:'mc_latefee.png',      label:'Late Fee',      money:-3,  stamina:-6,  speed:1.3, zigzag:false, minDistrict:0},
    {type:'highinterest', icon:'mc_highinterest.png', label:'High Interest', money:-6,  stamina:-4,  speed:1.1, zigzag:false, minDistrict:0},
    {type:'firemoney',    icon:'mc_firemoney.png',    label:'Fire Money',    money:-10, stamina:-14, speed:1.2, zigzag:true, amp:1.1, freq:4.0, minDistrict:0},
    {type:'brokenpiggy',  label:'Broken Piggy Bank',  money:0,   stamina:0,   speed:1.2, zigzag:false, minDistrict:0, comboBreak:true, customIcon:{emoji:'💔',ring:'#94a3b8'}},
    {type:'impulse',      label:'Impulse Purchase',   money:-5,  stamina:-8,  speed:1.15,zigzag:false, minDistrict:1, customIcon:{emoji:'🛍️',ring:'#f472b6'}},
    {type:'emergency',    label:'Emergency Expense',  money:-2,  stamina:-16, speed:1.25,zigzag:true, amp:0.8, freq:3.2, minDistrict:2, customIcon:{emoji:'🚨',ring:'#f87171'}},
  ];

  // ElementType.MoneyMagnet / InsuranceBlocker / TimeFreeze / SpeedBoost / DebtBurner
  // — durations copied verbatim from PlayerManager.cs's own [Header("Power-up Settings")]
  const POWERUPS=[
    {type:'magnet',   icon:'mc_pu_magnet.png',  label:'Money Magnet',    dur:5, color:'#fbbf24'},
    {type:'shield',   icon:'mc_pu_shield.png',  label:'Insurance Blocker', dur:0, color:'#60a5fa', hits:2},
    {type:'freeze',   icon:'mc_pu_freeze.png',  label:'Time Freeze',     dur:3, color:'#7dd3fc'},
    {type:'speed',    icon:'mc_pu_speed.png',   label:'Speed Boost',    dur:6, color:'#a78bfa'},
    {type:'debtburn', icon:'mc_pu_debtburn.png',label:'Debt Burner',    dur:0, color:'#fb923c', instant:true},
    // GDD §11 "Power-Ups 2.0" additions (3 of the GDD's 4 new ones — "Vault
    // Multiplier" skipped/merged into Golden Piggy, see header note above).
    {type:'goldenpiggy', label:'Golden Piggy',     dur:8, color:'#facc15', moneyMult:2, customIcon:{emoji:'🌟',ring:'#facc15'}},
    {type:'coinstorm',   label:'Coin Storm',       dur:5, color:'#22d3ee', burst:true,  customIcon:{emoji:'🌧️',ring:'#22d3ee'}},
    {type:'supersaver',  label:'Super Saver Mode', dur:8, color:'#34d399', comboSafe:true, customIcon:{emoji:'💪',ring:'#34d399'}},
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
    ['🛍️','Impulse purchases feel good for a second, but they drain your savings fast — pause before you buy!'],
    ['💔','A Broken Piggy Bank breaks your combo — protect your streak like you protect your savings.'],
    ['🏦','Your Savings Vault is a LIFETIME total — it never resets. Every coin you catch grows it forever.'],
    ['🐷','Piggy Banks evolve the more you save — small habits compound into bigger and bigger rewards.'],
    ['🏛️','Landmarks are built from your saved money and boost your whole savings empire.'],
    ['🔥','Come back and save a little every day — a streak beats saving a lot just once.'],
    ['🎁','Every run ends with a reward — even a small deposit still grows your empire.'],
    ['📅','Daily missions reset every day — check back for new ways to earn bonus coins.'],
  ];

  /* ══════════════ SAVINGS EMPIRE META-PROGRESSION (GDD §§06-14) ══════════════
     Lifetime, cross-run systems — separate from any single run's stats above.
     All new fields live on state.mc_* (namespaced per house rule). cvSave()'s
     FIELDS whitelist doesn't know about mc_* keys, so — same workaround
     bizop.js uses (BO_LS_KEY) — this file keeps its own tiny localStorage
     mirror so these genuinely survive a reload. Nothing below is server-
     authoritative or networked: this app has no backend (confirmed no API
     server is deployed), so the "leaderboard" is explicitly a local,
     deterministic cosmetic estimate — never real competitive data. ══ */

  // §06 Savings Vault — lifetime total ever collected. Exact GDD threshold table.
  const VAULT_LEVELS=[
    {lv:1,need:25000,   theme:'Classic'}, {lv:2,need:75000,   theme:'Classic'},
    {lv:3,need:150000,  theme:'Silver'},  {lv:4,need:300000,  theme:'Silver'},
    {lv:5,need:500000,  theme:'Gold'},    {lv:6,need:1000000, theme:'Gold'},
    {lv:7,need:2500000, theme:'Diamond'}, {lv:8,need:5000000, theme:'Diamond'},
    {lv:9,need:10000000,theme:'Cosmic'},  {lv:10,need:25000000,theme:'Cosmic'},
  ];
  const THEME_COLOR={Classic:'#94a3b8',Silver:'#cbd5e1',Gold:'#fbbf24',Diamond:'#7dd3fc',Cosmic:'#c084fc'};
  function vaultInfo(total){
    total=total||0;
    let idx=-1; for(let i=0;i<VAULT_LEVELS.length;i++){ if(total>=VAULT_LEVELS[i].need) idx=i; }
    const cur=VAULT_LEVELS[idx]||null, next=VAULT_LEVELS[idx+1]||null;
    return { level:idx+1, theme:cur?cur.theme:'Classic', total,
      prevNeed:cur?cur.need:0, nextNeed:next?next.need:null, maxed:!next };
  }

  // §07 Piggy Evolution — stage derived from Vault Level; each grants the GDD's
  // own passive in-run bonus (reference example: "Master Saver Piggy… needing
  // $249,500 more to reach Cosmic" — i.e. stage tracks vault progress directly).
  const PIGGY_STAGES=[
    {key:'baby',   name:'Baby Piggy',        minVaultLv:0, icon:'🐷',   bonusTxt:'Starter piggy — just getting saving started.'},
    {key:'savings',name:'Savings Piggy',     minVaultLv:2, icon:'🐷✨', bonusTxt:'+5% money from every catch.', moneyPct:5},
    {key:'super',  name:'Super Saver Piggy', minVaultLv:4, icon:'🐷🌟', bonusTxt:'+10% money from every catch.', moneyPct:10},
    {key:'golden', name:'Golden Piggy',      minVaultLv:6, icon:'🐷👑', bonusTxt:'+1 Combo Buffer — your first miss each run is forgiven.', comboBuffer:1},
    {key:'master', name:'Master Saver Piggy',minVaultLv:8, icon:'🐷💎', bonusTxt:'A small passive Money Magnet, always on.', passiveMagnet:true},
    {key:'cosmic', name:'Cosmic Piggy',      minVaultLv:10,icon:'🐷🌌', bonusTxt:'+15% Bonus Vault XP on every deposit.', vaultXpPct:15},
  ];
  function piggyStageFor(vaultLv){ let s=PIGGY_STAGES[0]; for(const p of PIGGY_STAGES){ if(vaultLv>=p.minVaultLv) s=p; } return s; }
  function piggyNextStage(vaultLv){ return PIGGY_STAGES.filter(p=>p.minVaultLv>vaultLv)[0]||null; }

  // §10 Savings Landmarks — auto-built at Vault Level milestones (no separate
  // spend-currency layer — keeps the single-number Vault the one source of truth).
  const LANDMARKS=[
    {key:'tree',       name:'Savings Tree',        minVaultLv:2, icon:'🌳', desc:'Produces Vault XP.',                bonusPct:1},
    {key:'fountain',   name:'Coin Fountain',       minVaultLv:4, icon:'⛲', desc:'Produces bonus daily rewards.',     bonusPct:1},
    {key:'plaza',      name:'Piggy Plaza',         minVaultLv:6, icon:'🏛️',desc:'Increases collection rewards.',     bonusPct:1},
    {key:'tower',      name:'Savings Bank Tower',  minVaultLv:8, icon:'🏦', desc:'Boosts vault growth.',              bonusPct:1},
    {key:'observatory',name:'Fortune Observatory', minVaultLv:10,icon:'🔭', desc:'Unlocks endgame cosmetics.',        bonusPct:1},
  ];
  function ownedLandmarks(vaultLv){ return LANDMARKS.filter(l=>vaultLv>=l.minVaultLv); }

  // §08 Rare Drops — end-of-run reward chest, GDD's exact 70/20/8/2 odds.
  // Cosmetic/progression flavor only — never pay-gated, matches §17 safety notes.
  const DROP_RARITIES=[
    {id:'Common',weight:70,color:'#cbd5e1'}, {id:'Rare',weight:20,color:'#38bdf8'},
    {id:'Epic',weight:8,color:'#a855f7'},    {id:'Legendary',weight:2,color:'#fbbf24'},
  ];
  const DROP_FLAVORS={
    Common:   [['Vault XP Boost','✨'],['Bonus Coins','🪙'],['Booster Charm','🍀']],
    Rare:     [['Piggy Cosmetic','🎀'],['Vault Decoration','🖼️'],['Nameplate','🏷️']],
    Epic:     [['Animated Piggy Skin','🌈'],['Special Coin Trail','💫']],
    Legendary:[['Exclusive Piggy Variant','👑'],['Fortune Galaxy Cosmetic','🌌'],['Limited Vault Theme','🎆']],
  };
  function rollDrop(){
    const total=DROP_RARITIES.reduce((s,r)=>s+r.weight,0); let r=Math.random()*total, rarity=DROP_RARITIES[0];
    for(const d of DROP_RARITIES){ if(r<d.weight){ rarity=d; break; } r-=d.weight; }
    const pool=DROP_FLAVORS[rarity.id], pick=pool[Math.floor(Math.random()*pool.length)];
    return { rarity:rarity.id, color:rarity.color, name:pick[0], icon:pick[1], ts:Date.now() };
  }

  // §09 Collection Book — Money tab (Piggies/Vaults tabs derive live from
  // PIGGY_STAGES/VAULT_LEVELS above; Badges tab from state.mc_collection.badges).
  const COIN_TIERS=[
    {key:'penny',label:'Penny',max:1}, {key:'nickel',label:'Nickel',max:5},
    {key:'dime',label:'Dime',max:10}, {key:'quarter',label:'Quarter',max:25},
    {key:'dollarcoin',label:'Dollar Coin',max:50}, {key:'goldcoin',label:'Gold Coin',max:100},
    {key:'platinumcoin',label:'Platinum Coin',max:Infinity},
    {key:'galaxycoin',label:'Galaxy Coin',max:Infinity,galaxyOnly:true},
  ];
  function coinTierFor(money,inGalaxy){
    if(inGalaxy && Math.random()<0.35) return 'galaxycoin';
    for(const t of COIN_TIERS){ if(!t.galaxyOnly && money<=t.max) return t.key; }
    return 'platinumcoin';
  }
  const BADGE_DEFS={
    firstdeposit:{name:'First Deposit',icon:'🪙'}, combo10:{name:'Combo Streak',icon:'🔥'},
    debtslayer:{name:'Debt Slayer',icon:'💥'},     perfectrun:{name:'Perfect Run',icon:'⭐'},
    allDistricts:{name:'Empire Builder',icon:'🏆'},streak7:{name:'7-Day Saver',icon:'📅'},
  };

  // §12 Missions & Streaks — 3 daily missions, deterministically rotated per
  // calendar day (no server timer needed — this app has no backend at all).
  const MISSION_POOL=[
    {id:'save5000', desc:'Save $5,000 in one run',              check:r=>r.money>=5000},
    {id:'save10000',desc:'Save $10,000 in one run',             check:r=>r.money>=10000},
    {id:'combo10',  desc:'Reach a ×10 combo streak',            check:r=>r.comboRawPeak>=10},
    {id:'catch100', desc:'Catch 100 coins & cash in one run',   check:r=>r.caught>=100},
    {id:'noLateFee',desc:'Finish a run without any Late Fees',  check:r=>r.hitLateFee===0},
    {id:'stamina90',desc:'Finish a run with 90%+ stamina left', check:r=>r.staminaPct>=90},
  ];
  // zero-padded ISO date (parses identically as UTC-midnight across every JS
  // engine, so gapDays arithmetic below is exact regardless of timezone/DST —
  // an un-padded "2026-7-18" is only loosely-specified and parses inconsistently)
  function todayStr(){ const d=new Date(); const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
  function dayIndex(){ return Math.floor(new Date().getTime()/86400000); }
  function pickDailyMissions(){
    // 3 distinct, deterministically-rotating missions out of the 6-item pool —
    // consecutive (wrapping) indices from a day-seeded start guarantee no dupes
    const n=MISSION_POOL.length, start=dayIndex()%n, ids=[];
    for(let i=0;i<3 && i<n;i++) ids.push(MISSION_POOL[(start+i)%n].id);
    return ids;
  }
  function mcEvalMissions(result){
    if(!window.state||!state.mc_daily) return [];
    const newlyDone=[];
    state.mc_daily.missions.forEach(id=>{
      if(state.mc_daily.progress[id]) return;
      const def=MISSION_POOL.filter(m=>m.id===id)[0];
      if(def && def.check(result)){ state.mc_daily.progress[id]=true; newlyDone.push(id); }
    });
    return newlyDone;
  }
  window.mcClaimDaily=function(id){
    if(!window.state||!state.mc_daily) return;
    if(!state.mc_daily.progress[id] || state.mc_daily.claimed[id]) return;
    state.mc_daily.claimed[id]=true;
    state.coins=(state.coins||0)+40;
    if(window.cvAddXP) cvAddXP(6,0);
    mcMetaSave(); if(window.cvSave) cvSave();
    if(window.cvToast) cvToast('🎁 Mission reward claimed! +40 coins');
    if(window.mcRefreshEmpire) mcRefreshEmpire();
  };

  // §14 Leaderboard — a local, deterministic, OFFLINE cosmetic estimate only
  // (see header note — no backend exists for this app, so this is never real
  // networked competition). Purely a flavor number for the end-of-run screen.
  function empireRank(vaultTotal){ return Math.max(1, Math.round(20000/Math.pow(1+(vaultTotal||0)/150000, 1.15))); }

  // ── small utils shared by the systems above ──
  function hexToRgb(hex){ const h=hex.replace('#',''); const f=h.length===3?h.split('').map(c=>c+c).join(''):h; const n=parseInt(f,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
  function rgba(hex,a){ const c=hexToRgb(hex); return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'; }
  function drawEmojiIcon(emoji,ring){ return function(ctx,w,h){
    const cx=w/2, cy=h/2;
    const grad=ctx.createRadialGradient(cx,cy,4,cx,cy,w/2);
    grad.addColorStop(0,rgba(ring,.55)); grad.addColorStop(1,rgba(ring,0));
    ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(cx,cy,w/2,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=rgba(ring,.9); ctx.lineWidth=4; ctx.beginPath(); ctx.arc(cx,cy,w/2-6,0,Math.PI*2); ctx.stroke();
    ctx.font='64px system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(emoji,cx,cy+4);
  }; }

  // ══ persistence — mirrors bizop.js's BO_LS_KEY workaround for state.mc_* fields ══
  const MC_LS_KEY='cv_moneycatcher_meta_v1';
  function mcMetaLoad(){ try{ const raw=localStorage.getItem(MC_LS_KEY); if(raw){ const m=JSON.parse(raw); if(m&&typeof m==='object') return m; } }catch(e){} return null; }
  function mcMetaSave(){
    if(!window.state) return;
    try{ localStorage.setItem(MC_LS_KEY, JSON.stringify({
      vaultTotal: state.mc_vaultTotal, collection: state.mc_collection,
      daily: state.mc_daily, streak: state.mc_streak,
    })); }catch(e){}
  }
  function mcMetaHydrate(){
    if(!window.state) return;
    const m=mcMetaLoad();
    if(typeof state.mc_vaultTotal!=='number') state.mc_vaultTotal=(m&&m.vaultTotal)||0;
    state.mc_collection = state.mc_collection || (m&&m.collection) || {money:{},badges:[],drops:[]};
    if(!state.mc_daily && m && m.daily) state.mc_daily=m.daily;
    state.mc_streak = state.mc_streak || (m&&m.streak) || {count:0,lastDate:null};
    mcRolloverDaily();
  }
  function mcRolloverDaily(){
    const today=todayStr();
    if(!state.mc_daily || state.mc_daily.date!==today){
      state.mc_daily={ date:today, missions:pickDailyMissions(), progress:{}, claimed:{} };
      const st=state.mc_streak||{count:0,lastDate:null};
      if(st.lastDate){
        const gapDays=Math.round((new Date(today)-new Date(st.lastDate))/86400000);
        if(gapDays===1) st.count=(st.count||0)+1; else if(gapDays>1) st.count=1;
      } else st.count=1;
      st.lastDate=today; state.mc_streak=st;
      mcMetaSave();
    }
  }

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

  /* ── Level select (SaveScape District cards + Savings Empire strip) ── */
  function showLevelSelect(){
    const ui=document.getElementById('mcUI'); if(!ui) return;
    const best=(window.state&&state.gameLevels&&state.gameLevels['game_moneycatcher'])||0;
    ui.style.pointerEvents='auto';
    const icons=['🌳','🏙️','🌊','🛍️','🌌'];
    const vt=window.state?(state.mc_vaultTotal||0):0;
    const vi=vaultInfo(vt);
    const piggy=piggyStageFor(vi.level);
    const streak=(window.state&&state.mc_streak&&state.mc_streak.count)||0;
    const daily=(window.state&&state.mc_daily)||{missions:[],progress:{},claimed:{}};
    const dailyDone=(daily.missions||[]).filter(id=>daily.progress[id]).length;
    ui.innerHTML=`
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,rgba(20,184,166,.25),transparent 55%),linear-gradient(180deg,#052a24,#02140f);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:12px;padding:20px;padding-top:56px;overflow-y:auto">
        <button onclick="mcExit()" style="position:absolute;top:14px;left:14px;padding:8px 16px;border:1px solid rgba(20,184,166,.4);border-radius:10px;background:rgba(4,20,16,.6);color:#5eead4;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer;z-index:2">← HUB</button>
        <button onclick="mcShowEmpire('vault')" style="position:absolute;top:14px;right:14px;padding:8px 16px;border:1px solid rgba(251,191,36,.4);border-radius:10px;background:rgba(30,20,4,.6);color:#fbbf24;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.1em;cursor:pointer;z-index:2">🏦 EMPIRE</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.3em;color:#2dd4bf">SAVESCAPE ORBIT PRESENTS</div>
        <div style="font-family:'Anton',sans-serif;font-size:clamp(1.6rem,5.4vw,2.6rem);letter-spacing:.04em;background:linear-gradient(90deg,#5eead4,#fbbf24);-webkit-background-clip:text;background-clip:text;color:transparent">🐷 MONEY CATCHER</div>
        <div style="font-size:.8rem;color:rgba(255,255,255,.6);margin-top:-6px;text-align:center;max-width:520px">Catch coins, cash &amp; stock, dodge Savings Killers — every coin grows your Savings Empire!</div>
        <div onclick="mcShowEmpire('vault')" style="cursor:pointer;width:100%;max-width:640px;display:flex;gap:4px;flex-wrap:wrap;justify-content:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px 6px">
          <div style="flex:1;min-width:130px;text-align:center">
            <div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:${THEME_COLOR[vi.theme]}">VAULT LV.${vi.level} · ${vi.theme.toUpperCase()}</div>
            <div style="font-family:'Anton',sans-serif;font-size:1.05rem;color:#fff">$${fmt(vi.total)}</div>
          </div>
          <div style="flex:1;min-width:110px;text-align:center;border-left:1px solid rgba(255,255,255,.1)">
            <div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:#5eead4">PIGGY</div>
            <div style="font-size:1rem">${piggy.icon}</div>
          </div>
          <div style="flex:1;min-width:100px;text-align:center;border-left:1px solid rgba(255,255,255,.1)">
            <div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:#fb923c">STREAK</div>
            <div style="font-family:'Anton',sans-serif;font-size:1.05rem;color:#fff">🔥${streak}d</div>
          </div>
          <div style="flex:1;min-width:100px;text-align:center;border-left:1px solid rgba(255,255,255,.1)">
            <div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:#a78bfa">MISSIONS</div>
            <div style="font-family:'Anton',sans-serif;font-size:1.05rem;color:#fff">${dailyDone}/${(daily.missions||[]).length}</div>
          </div>
        </div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:980px">
          ${LEVELS.map((L,i)=>{
            const locked=i>0 && best<i;
            return `<div onclick="${locked?'':'mcStart('+i+')'}" style="width:220px;padding:16px 14px;border-radius:18px;border:1.5px solid ${locked?'rgba(255,255,255,.12)':'rgba(20,184,166,.45)'};background:linear-gradient(165deg,rgba(6,36,30,.95),rgba(2,14,11,.98));cursor:${locked?'default':'pointer'};text-align:center;position:relative;transition:all .2s" ${locked?'':`onmouseover="this.style.borderColor='#fbbf24';this.style.transform='translateY(-4px)'" onmouseout="this.style.borderColor='rgba(20,184,166,.45)';this.style.transform='none'"`}>
              <div style="font-size:2.1rem;margin-bottom:6px;filter:${locked?'grayscale(1) opacity(.4)':'none'}">${icons[i]}</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.06em;color:${locked?'rgba(255,255,255,.35)':'#5eead4'}">${L.name.toUpperCase()}</div>
              <div style="font-size:.64rem;line-height:1.5;color:rgba(255,255,255,${locked?'.3':'.65'});margin-top:8px">${L.desc}</div>
              <div style="margin-top:10px;font-family:'Orbitron',sans-serif;font-size:.46rem;letter-spacing:.08em;color:#fbbf24">GOAL $${fmt(L.moneyGoal)} · ${L.stockGoal} STOCK · ×${L.comboCap} CAP</div>
              ${locked?`<div style="position:absolute;top:10px;right:12px;font-size:1rem">🔒</div><div style="margin-top:8px;font-size:.55rem;color:rgba(255,255,255,.4)">Win ${LEVELS[i-1].name} to unlock</div>`:''}
            </div>`;}).join('')}
        </div>
        <div style="font-size:.6rem;color:rgba(255,255,255,.35);padding-bottom:6px">🎮 Move: ← → / A D / drag · Catch the good stuff, dodge the red ones!</div>
      </div>
      <div id="mcEmpireModal" style="position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(2,10,8,.88);backdrop-filter:blur(6px);padding:20px"></div>`;
  }

  /* ── Empire Hub modal: Vault / Piggy / Collection / Landmarks / Missions tabs.
     Lives entirely inside #mcUI (no router/SCREENS changes) — same pattern as
     the existing mcGate/mcHow overlays, just reachable from level-select too. ── */
  let _empireTab='vault';
  window.mcShowEmpire=function(tab){ _empireTab=tab||_empireTab||'vault'; const m=document.getElementById('mcEmpireModal'); if(!m) return; m.style.display='flex'; m.innerHTML=empireModalHTML(); };
  window.mcCloseEmpire=function(){ const m=document.getElementById('mcEmpireModal'); if(m) m.style.display='none'; };
  window.mcEmpireTab=function(tab){ _empireTab=tab; window.mcRefreshEmpire(); };
  window.mcRefreshEmpire=function(){ const m=document.getElementById('mcEmpireModal'); if(!m||m.style.display==='none') return; m.innerHTML=empireModalHTML(); };

  function tabBtn(id,label){
    const on=_empireTab===id;
    return `<button onclick="mcEmpireTab('${id}')" style="padding:7px 12px;border-radius:10px;border:1px solid ${on?'#fbbf24':'rgba(255,255,255,.15)'};background:${on?'rgba(251,191,36,.15)':'rgba(255,255,255,.04)'};color:${on?'#fbbf24':'rgba(255,255,255,.6)'};font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.06em;cursor:pointer">${label}</button>`;
  }
  function barRow(label,pct,color){
    return `<div style="margin-bottom:10px"><div style="font-family:'Orbitron',sans-serif;font-size:.4rem;color:rgba(255,255,255,.5);margin-bottom:4px">${label}</div><div style="height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden"><div style="height:100%;width:${Math.max(2,Math.min(100,pct))}%;background:${color};transition:width .3s"></div></div></div>`;
  }
  function empireModalHTML(){
    const vt=window.state?(state.mc_vaultTotal||0):0, vi=vaultInfo(vt);
    return `<div style="width:100%;max-width:640px;max-height:88vh;overflow-y:auto;background:linear-gradient(165deg,rgba(8,30,26,.98),rgba(2,10,9,.99));border:1px solid rgba(251,191,36,.3);border-radius:20px;padding:20px;position:relative">
      <button onclick="mcCloseEmpire()" style="position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;cursor:pointer">✕</button>
      <div style="font-family:'Anton',sans-serif;font-size:1.25rem;color:#fbbf24;text-align:center;margin-bottom:2px">🏦 SAVINGS EMPIRE</div>
      <div style="font-size:.58rem;color:rgba(255,255,255,.45);text-align:center;margin-bottom:14px">Everything you've ever saved, in one place.</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:16px">${tabBtn('vault','VAULT')}${tabBtn('piggy','PIGGY')}${tabBtn('collection','COLLECTION')}${tabBtn('empire','LANDMARKS')}${tabBtn('missions','MISSIONS')}</div>
      <div>${empireTabBody(_empireTab,vi)}</div>
    </div>`;
  }
  function empireTabBody(tab,vi){
    if(tab==='piggy') return empirePiggyBody(vi);
    if(tab==='collection') return empireCollectionBody();
    if(tab==='empire') return empireLandmarksBody(vi);
    if(tab==='missions') return empireMissionsBody();
    return empireVaultBody(vi);
  }
  function empireVaultBody(vi){
    const pct=vi.maxed?100:Math.round((vi.total-vi.prevNeed)/((vi.nextNeed-vi.prevNeed)||1)*100);
    const rank=empireRank(vi.total);
    return `
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.12em;color:${THEME_COLOR[vi.theme]}">VAULT LEVEL ${vi.level} · ${vi.theme.toUpperCase()} THEME</div>
        <div style="font-family:'Anton',sans-serif;font-size:1.9rem;color:#fff;margin:6px 0">$${fmt(vi.total)}</div>
        <div style="font-size:.58rem;color:rgba(255,255,255,.5)">Savings Empire Rank #${fmt(rank)} <span style="opacity:.6">(local estimate)</span></div>
      </div>
      ${barRow(vi.maxed?'MAX VAULT LEVEL REACHED':('NEXT: LEVEL '+(vi.level+1)+' AT $'+fmt(vi.nextNeed)), pct, 'linear-gradient(90deg,#14b8a6,#fbbf24)')}
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:14px">
        ${['Classic','Silver','Gold','Diamond','Cosmic'].map(t=>{
          const tierRow=VAULT_LEVELS.filter(v=>v.theme===t)[0];
          const reached=tierRow && vi.total>=tierRow.need;
          return `<div style="text-align:center;padding:8px 4px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid ${reached?THEME_COLOR[t]:'rgba(255,255,255,.08)'}">
            <div style="width:16px;height:16px;border-radius:50%;margin:0 auto 4px;background:${reached?THEME_COLOR[t]:'rgba(255,255,255,.15)'}"></div>
            <div style="font-family:'Orbitron',sans-serif;font-size:.34rem;color:${reached?'#fff':'rgba(255,255,255,.35)'}">${t.toUpperCase()}</div>
          </div>`;}).join('')}
      </div>`;
  }
  function empirePiggyBody(vi){
    const stage=piggyStageFor(vi.level), next=piggyNextStage(vi.level);
    const nextRow=next?VAULT_LEVELS.filter(v=>v.lv===next.minVaultLv)[0]:null;
    return `
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:2.6rem">${stage.icon}</div>
        <div style="font-family:'Anton',sans-serif;font-size:1.05rem;color:#fff">${stage.name}</div>
        <div style="font-size:.64rem;color:#5eead4;margin-top:4px">${stage.bonusTxt}</div>
        ${next?`<div style="font-size:.56rem;color:rgba(255,255,255,.45);margin-top:8px">Save $${fmt(Math.max(0,(nextRow?nextRow.need:0)-vi.total))} more to reach <b style="color:#fbbf24">${next.name}</b></div>`:`<div style="font-size:.56rem;color:#fbbf24;margin-top:8px">Max evolution reached!</div>`}
      </div>
      <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
        ${PIGGY_STAGES.map(p=>{ const reached=vi.level>=p.minVaultLv;
          return `<div style="text-align:center;width:70px;padding:8px 4px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid ${reached?'#5eead4':'rgba(255,255,255,.08)'};opacity:${reached?1:.4}">
            <div style="font-size:1.2rem">${p.icon}</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:.32rem;color:#fff;margin-top:3px">${p.name.replace(' Piggy','')}</div>
          </div>`;}).join('')}
      </div>`;
  }
  function empireCollectionBody(){
    const col=(window.state&&state.mc_collection)||{money:{},badges:[],drops:[]};
    const moneyFound=Object.keys(col.money||{}).length, total=COIN_TIERS.length+Object.keys(BADGE_DEFS).length;
    const foundTotal=moneyFound+(col.badges||[]).length;
    return `
      <div style="text-align:center;font-size:.6rem;color:rgba(255,255,255,.5);margin-bottom:12px">COLLECTION BOOK · ${foundTotal}/${total} FOUND</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:#5eead4;margin-bottom:6px">MONEY</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px">
        ${COIN_TIERS.map(t=>{ const found=!!(col.money&&col.money[t.key]);
          return `<div style="text-align:center;padding:8px 2px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid ${found?'#34d399':'rgba(255,255,255,.08)'};opacity:${found?1:.35}">
            <div style="font-size:1.05rem">${found?'🪙':'❔'}</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:.3rem;color:#fff;margin-top:2px">${t.label}</div>
          </div>`;}).join('')}
      </div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:#fbbf24;margin-bottom:6px">BADGES</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
        ${Object.keys(BADGE_DEFS).map(k=>{ const b=BADGE_DEFS[k], found=(col.badges||[]).indexOf(k)>=0;
          return `<div title="${b.name}" style="text-align:center;padding:7px 9px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid ${found?'#fbbf24':'rgba(255,255,255,.08)'};opacity:${found?1:.35}">
            <div style="font-size:1.05rem">${b.icon}</div><div style="font-family:'Orbitron',sans-serif;font-size:.3rem;color:#fff;margin-top:2px">${b.name}</div>
          </div>`;}).join('')}
      </div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:#a855f7;margin-bottom:6px">RARE DROPS EARNED (${(col.drops||[]).length})</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;max-height:120px;overflow-y:auto">
        ${(col.drops&&col.drops.length)?col.drops.slice().reverse().slice(0,12).map(d=>`<div style="text-align:center;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid ${d.color}"><div style="font-size:.95rem">${d.icon}</div><div style="font-family:'Orbitron',sans-serif;font-size:.28rem;color:${d.color}">${d.rarity}</div></div>`).join(''):'<div style="font-size:.58rem;color:rgba(255,255,255,.35)">No drops yet — finish a run to earn your first!</div>'}
      </div>`;
  }
  function empireLandmarksBody(vi){
    return `<div style="text-align:center;font-size:.6rem;color:rgba(255,255,255,.5);margin-bottom:12px">Landmarks auto-build as your Vault Level rises — each adds a small permanent money bonus.</div>
      <div style="display:flex;flex-direction:column;gap:8px">
      ${LANDMARKS.map(l=>{ const owned=vi.level>=l.minVaultLv;
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid ${owned?'#34d399':'rgba(255,255,255,.08)'};opacity:${owned?1:.5}">
          <div style="font-size:1.4rem">${l.icon}</div>
          <div style="flex:1">
            <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;color:#fff">${l.name}</div>
            <div style="font-size:.54rem;color:rgba(255,255,255,.5)">${l.desc} ${owned?`<b style="color:#34d399">+${l.bonusPct}% money — BUILT</b>`:('· needs Vault Lv.'+l.minVaultLv)}</div>
          </div>
        </div>`;}).join('')}
      </div>`;
  }
  function empireMissionsBody(){
    const daily=(window.state&&state.mc_daily)||{missions:[],progress:{},claimed:{}};
    const streak=(window.state&&state.mc_streak&&state.mc_streak.count)||0;
    return `
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.12em;color:#fb923c">🔥 PLAY STREAK</div>
        <div style="font-family:'Anton',sans-serif;font-size:1.5rem;color:#fff">${streak} day${streak===1?'':'s'}</div>
        <div style="font-size:.54rem;color:rgba(255,255,255,.45)">Come back tomorrow to keep it going!</div>
      </div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:#a78bfa;margin-bottom:8px">TODAY'S MISSIONS (reset daily)</div>
      <div style="display:flex;flex-direction:column;gap:8px">
      ${(daily.missions||[]).map(id=>{
        const def=MISSION_POOL.filter(m=>m.id===id)[0]; if(!def) return '';
        const done=!!daily.progress[id], claimed=!!daily.claimed[id];
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid ${done?'#34d399':'rgba(255,255,255,.1)'}">
          <div style="font-size:1.15rem">${claimed?'✅':done?'🎁':'⏳'}</div>
          <div style="flex:1;font-size:.6rem;color:${done?'#fff':'rgba(255,255,255,.6)'}">${def.desc}</div>
          ${done&&!claimed?`<button onclick="mcClaimDaily('${id}')" style="padding:6px 12px;border:none;border-radius:8px;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;font-family:'Orbitron',sans-serif;font-size:.44rem;cursor:pointer">CLAIM +40</button>`:claimed?'<span style="font-size:.44rem;color:#34d399">CLAIMED</span>':''}
        </div>`;}).join('')}
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
  // canvas-drawn emoji-badge icons for the 3 new hazards + 3 new power-ups that
  // have no delivered PNG (see NEG_ITEMS/POWERUPS customIcon fields above)
  const customTexCache={};
  function customIconTex(key,emoji,ring){ if(!customTexCache[key]) customTexCache[key]=makeCanvasTex(128,128,drawEmojiIcon(emoji,ring)); return customTexCache[key]; }
  // combo-break, routed through Super Saver Mode / Golden-Piggy-stage combo buffer
  // (GDD §07 "+1 Combo Buffer" / §11 "Super Saver Mode… combo timer pauses")
  function breakCombo(){
    if(!G) return;
    if(G.pu.supersaver>0) return;
    if(G.piggyComboBuffer>0){ G.piggyComboBuffer--; spawnFloat('🛡️ Combo Buffer used!',1.6,'#5eead4'); return; }
    G.combo=0; G.comboMult=1;
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
    } else if(L.env==='bay'){
      const water=new THREE.Mesh(new THREE.PlaneGeometry(40,40), new THREE.MeshToonMaterial({color:0x1b6d8a,transparent:true,opacity:.85}));
      water.rotation.x=-Math.PI/2; water.position.set(edge+8,-.02,-4); scene.add(water);
      const plankM=new THREE.MeshToonMaterial({color:0x8a6a45});
      for(let side=-1;side<=1;side+=2) for(let i=-3;i<=3;i++) decorItem(new THREE.BoxGeometry(.18,.5,1.3),plankM, side*edge, .25, i*1.4);
      const hullM=new THREE.MeshToonMaterial({color:0xf5f5f5}), sailM=new THREE.MeshToonMaterial({color:0xfacc15});
      // NOTE: this district was previously crashing on entry — three r128 (this
      // project's pinned build, loaded from cdnjs above) has no CapsuleGeometry
      // constructor at all, so `new THREE.CapsuleGeometry(...)` threw synchronously
      // and left the player stuck on "ENTERING SAVINGS BAY…" forever (caught live
      // via the browser check on this pass). Swapped for a stretched SphereGeometry
      // hull — same "primitives only" convention buildFallbackHero() already uses.
      [[edge+7,-8],[edge+11,-2]].forEach(([x,z])=>{ decorItem(new THREE.SphereGeometry(.6,10,8),hullM,x,.4,z,1,1,2.2); decorItem(new THREE.ConeGeometry(.5,1.6,4),sailM,x,1.6,z); });
    } else if(L.env==='shop'){
      // Shopping District — holographic malls + sale banners + shopping drones (GDD §05 L4)
      const mallM=[0xf472b6,0xc084fc,0x60a5fa,0xfbbf24].map(c=>new THREE.MeshToonMaterial({color:c}));
      const bannerM=new THREE.MeshToonMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:.4});
      for(let side=-1;side<=1;side+=2) for(let i=-2;i<=2;i++){ const h=3+Math.random()*1.6;
        decorItem(new THREE.BoxGeometry(2.6,h,2.2), mallM[(i+2)%4], side*(edge+1), h/2, i*2.8);
        decorItem(new THREE.BoxGeometry(2.8,.5,.1), bannerM, side*(edge+1), h+.35, i*2.8+1.16); }
      const droneM=new THREE.MeshToonMaterial({color:0xe2e8f0});
      for(let i=0;i<5;i++) decorItem(new THREE.SphereGeometry(.22,8,6), droneM, (i-2)*3.2, 3.4+Math.sin(i)*.4, -6-Math.random()*2);
    } else { // galaxy — Fortune Galaxy: golden planets, coin asteroids, cosmic vaults (GDD §05 L5)
      const planetM=[0xfbbf24,0xc084fc,0x60a5fa].map(c=>new THREE.MeshToonMaterial({color:c,emissive:c,emissiveIntensity:.3}));
      [[-7,2,-10],[8,3.4,-14],[-5,5,-18]].forEach(([x,y,z],i)=>decorItem(new THREE.SphereGeometry(1.4-i*.2,10,8),planetM[i%3],x,y,z));
      const astM=new THREE.MeshToonMaterial({color:0xfacc15});
      for(let i=0;i<10;i++) decorItem(new THREE.DodecahedronGeometry(.16+Math.random()*.14), astM, (Math.random()-.5)*22, 1+Math.random()*4, -4-Math.random()*14);
      const railM=new THREE.MeshToonMaterial({color:0x7dd3fc,emissive:0x7dd3fc,emissiveIntensity:.5});
      for(let side=-1;side<=1;side+=2) for(let i=-3;i<=3;i++) decorItem(new THREE.CylinderGeometry(.05,.05,.9,6), railM, side*edge, .45, i*1.4);
    }

    /* hero — procedural Guardian character (see loadHeroAsset's comment above) */
    const heroInst=Object.assign(buildFallbackHero(),{isFallback:true});
    scene.add(heroInst.root);

    /* HUD (reuses the established Money Catcher HUD layout) */
    const stage0=piggyStageFor(vaultInfo(window.state?(state.mc_vaultTotal||0):0).level);
    const ui=document.getElementById('mcUI');
    ui.style.pointerEvents='none';
    ui.innerHTML=`
      <style>@keyframes mcComboPop{0%{transform:scale(1)}40%{transform:scale(1.45)}100%{transform:scale(1)}}</style>
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(180deg,rgba(2,12,18,.9),transparent);pointer-events:none">
        <button onclick="mcExit()" style="pointer-events:auto;padding:6px 12px;border:1px solid rgba(20,184,166,.4);border-radius:8px;background:rgba(20,184,166,.1);color:#5eead4;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.16em;color:#2dd4bf;flex:1;text-align:center">${stage0.icon} ${L.name.toUpperCase()}</div>
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
        combo:0, comboMult:1, _comboShown:1, comboRawPeak:0,
        items:[], floats:[], coinsCaught:0, newDiscoveries:0,
        time:L.dur, spawnAcc:0, elapsed:0, last:performance.now(),
        pu:{ magnet:0, shield:0, shieldHits:0, freeze:0, speed:0, goldenpiggy:0, coinstorm:0, supersaver:0 },
        avoided:{}, hit:{}, comboPeak:0,
        gateEvery:18, gateT:18, gateIdx:Math.floor(Math.random()*FACTS.length),
        keyL:false, keyR:false, dragX:0,
        negPool: NEG_ITEMS.filter(n=>(n.minDistrict||0)<=li),
        galaxyDistrict: li===LEVELS.length-1,
        iconTex, _pauseStartTs:0,
      };
    // snapshot Piggy Evolution (§07) + Savings Landmark (§10) passive bonuses for
    // this run — both derive from the lifetime Vault Level, read once at run start
    (function(){
      const vt=window.state?(state.mc_vaultTotal||0):0, vi=vaultInfo(vt), stage=piggyStageFor(vi.level);
      G.piggyStageKey=stage.key;
      G.piggyBonusPct=stage.moneyPct||0;
      G.piggyComboBuffer=stage.comboBuffer||0;
      G.piggyPassiveMagnet=!!stage.passiveMagnet;
      G.piggyVaultXpPct=stage.vaultXpPct||0;
      G.landmarkBonusPct=ownedLandmarks(vi.level).reduce((s,l)=>s+l.bonusPct,0);
    })();

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
        heroX:+G.heroX.toFixed(2), combo:G.comboMult, comboRawPeak:G.comboRawPeak, items:G.items.length, pu:Object.assign({},G.pu),
        piggyStage:G.piggyStageKey, piggyBonusPct:G.piggyBonusPct, landmarkBonusPct:G.landmarkBonusPct,
        vaultTotal:window.state?state.mc_vaultTotal:undefined,
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
    ['magnet','freeze','speed','goldenpiggy','coinstorm','supersaver'].forEach(k=>{ if(G.pu[k]>0) G.pu[k]-=dt; });

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
      if(!it.neg){
        // Money Magnet power-up (2.6 radius) OR Master Saver Piggy's smaller always-on
        // passive magnet (GDD §07 "Small Magnet") — same pull, different strength/radius
        const magnetActive=G.pu.magnet>0;
        const radius=magnetActive?2.6:(G.piggyPassiveMagnet?1.3:0);
        if(radius>0){
          const dx=G.heroX-it.x;
          if(Math.abs(dx)<radius){ it.x+=Math.sign(dx)*Math.min(Math.abs(dx),dt*(magnetActive?7:3.5)); it.y-=dt*(magnetActive?2.4:1.2); }
        }
      }
      it.sprite.position.set(it.x, it.y, 0);
      if(Math.abs(it.x-G.heroX)<CATCH_R && Math.abs(it.y-CATCH_Y)<CATCH_R){
        catchItem(it); disposeItem(it); G.items.splice(i,1); continue;
      }
      if(it.y< -1.5){
        if(it.neg){ G.avoided[it.negDef.type]=(G.avoided[it.negDef.type]||0)+1; }
        else if(!it.isPu){ if(G.combo>0) breakCombo(); spawnFloat('MISS',0.5,'rgba(255,255,255,.35)'); }
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
    const x=G.LANE_MIN+0.6+Math.random()*(G.LANE_MAX-G.LANE_MIN-1.2);
    let it;
    if(G.pu.coinstorm>0){
      // Coin Storm power-up (GDD §11): for its duration, only money rains — no
      // hazards/power-ups compete with it, reinforcing "money rains from the sky"
      const pos=POS_ITEMS[Math.floor(Math.random()*POS_ITEMS.length)];
      it={x,y:8,posDef:pos,icon:pos.icon};
    } else {
      const r=Math.random();
      if(r<G.lv.negRate){
        const pool=G.negPool&&G.negPool.length?G.negPool:NEG_ITEMS;
        const neg=pool[Math.floor(Math.random()*pool.length)];
        it={x,y:8,baseX:x,neg:true,negDef:neg,zigT:0,icon:neg.icon||null,customIcon:neg.customIcon};
      } else if(r<G.lv.negRate+G.lv.puChance){
        const pu=POWERUPS[Math.floor(Math.random()*POWERUPS.length)];
        it={x,y:8,isPu:true,puDef:pu,icon:pu.icon||null,customIcon:pu.customIcon};
      } else {
        const pos=POS_ITEMS[Math.floor(Math.random()*POS_ITEMS.length)];
        it={x,y:8,posDef:pos,icon:pos.icon};
      }
    }
    const key=it.customIcon?(it.neg?it.negDef.type:it.puDef.type):null;
    const tex=it.customIcon?customIconTex(key,it.customIcon.emoji,it.customIcon.ring):G.iconTex(it.icon);
    const mat=new THREE.SpriteMaterial({map:tex, transparent:true});
    const sp=new THREE.Sprite(mat);
    const sc=it.isPu?1.15:0.95;
    sp.scale.set(sc,sc,1);
    sp.position.set(it.x,it.y,0);
    it.sprite=sp;
    G.scene.add(sp);
    G.items.push(it);
  }

  // instant bonus wave spawned when Coin Storm activates (on top of the ambient
  // coin-only spawn stream it also triggers for its 5s duration)
  function burstCoins(){
    for(let n=0;n<8;n++){
      const x=G.LANE_MIN+0.6+Math.random()*(G.LANE_MAX-G.LANE_MIN-1.2);
      const pos=POS_ITEMS[Math.floor(Math.random()*POS_ITEMS.length)];
      const mat=new THREE.SpriteMaterial({map:G.iconTex(pos.icon), transparent:true});
      const sp=new THREE.Sprite(mat); sp.scale.set(.95,.95,1);
      const y=8+Math.random()*3.5; sp.position.set(x,y,0);
      G.scene.add(sp);
      G.items.push({x,y,posDef:pos,icon:pos.icon,sprite:sp});
    }
  }

  function catchItem(it){
    if(it.neg){
      if(G.pu.shield>0&&G.pu.shieldHits>0){
        G.pu.shieldHits--; if(G.pu.shieldHits<=0) G.pu.shield=0;
        spawnFloat('🛡️ BLOCKED!',1.4,'#60a5fa'); return;
      }
      const def=it.negDef;
      G.hit[def.type]=(G.hit[def.type]||0)+1;
      G.money=Math.max(0,G.money+def.money);
      G.stamina=Math.max(0,G.stamina+(def.stamina||0));
      breakCombo();
      const emoji=def.type==='firemoney'?'🔥 ':def.type==='latefee'?'🧾 ':def.type==='highinterest'?'📊 ':(def.customIcon?def.customIcon.emoji+' ':'⚠️ ');
      spawnFloat(emoji+def.label+'!',1.4,'#ef4444');
      if(G.stamina<=0){ G.stamina=0; endGame(false); }
    } else if(it.isPu){
      activatePU(it.puDef);
    } else {
      const pos=it.posDef;
      G.combo++; G.comboRawPeak=Math.max(G.comboRawPeak,G.combo);
      const cap=G.lv.comboCap||5;
      G.comboMult=Math.min(cap, G.combo>=15?cap:G.combo>=10?Math.min(cap,4):G.combo>=5?Math.min(cap,2):1);
      if(G.comboMult>G.comboPeak) G.comboPeak=G.comboMult;
      // Piggy Evolution money% (§07) + Landmark money% (§10) + Golden Piggy 2x (§11), stacked
      const bonusMult=(1+(G.piggyBonusPct+G.landmarkBonusPct)/100)*(G.pu.goldenpiggy>0?2:1);
      const earned=pos.money?Math.round(pos.money*G.comboMult*bonusMult):0;
      G.money+=earned; G.stock+=(pos.stock||0); G.score+=(pos.pts||0)*G.comboMult;
      G.coinsCaught++;
      if(pos.money && window.state){
        state.mc_collection=state.mc_collection||{money:{},badges:[],drops:[]};
        const tier=coinTierFor(pos.money,G.galaxyDistrict);
        if(!state.mc_collection.money[tier]){ state.mc_collection.money[tier]=true; G.newDiscoveries++; }
      }
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
    if(def.type==='goldenpiggy') G.pu.goldenpiggy=def.dur;
    if(def.type==='coinstorm')   { G.pu.coinstorm=def.dur; burstCoins(); }
    if(def.type==='supersaver')  G.pu.supersaver=def.dur;
  }

  function updateHUD(){
    const pct=G.stamina/G.staminaMax*100;
    const sb=document.getElementById('mcStamBar');
    if(sb){ sb.style.width=pct+'%'; sb.style.background=pct>50?'linear-gradient(90deg,#34d399,#6ee7b7)':pct>25?'linear-gradient(90deg,#fbbf24,#fde68a)':'linear-gradient(90deg,#ef4444,#f87171)'; }
    const mc=document.getElementById('mcCombo');
    if(mc){ mc.textContent='x'+G.comboMult; mc.style.color=G.comboMult>=5?'#f87171':G.comboMult>=3?'#a78bfa':G.comboMult>=2?'#34d399':'#fbbf24';
      // punch-scale the combo readout on every step UP (deeper chains pop harder) — pure HUD feedback, no gameplay effect
      if(G.comboMult>G._comboShown){ mc.style.animation='none'; void mc.offsetWidth; mc.style.animation='mcComboPop '+(220+G.comboMult*40)+'ms ease-out'; }
      G._comboShown=G.comboMult; }
    const mm=document.getElementById('mcMoney'); if(mm) mm.textContent='$'+fmt(G.money);
    const ms=document.getElementById('mcStock'); if(ms) ms.textContent=G.stock;
    const gb=document.getElementById('mcGoalBar'); if(gb) gb.style.width=Math.min(100,G.money/G.moneyGoal*100)+'%';
    const gt=document.getElementById('mcGoalTxt'); if(gt) gt.textContent='$'+fmt(G.money)+' / $'+fmt(G.moneyGoal);
    const row=document.getElementById('mcPuRow'); if(!row) return;
    const active=[];
    if(G.pu.magnet>0)     active.push(`🧲 ${G.pu.magnet.toFixed(1)}s`);
    if(G.pu.shield>0)     active.push(`🛡️ ×${G.pu.shieldHits}`);
    if(G.pu.freeze>0)     active.push(`❄️ ${G.pu.freeze.toFixed(1)}s`);
    if(G.pu.speed>0)      active.push(`⚡ ${G.pu.speed.toFixed(1)}s`);
    if(G.pu.goldenpiggy>0)active.push(`🌟 ${G.pu.goldenpiggy.toFixed(1)}s`);
    if(G.pu.coinstorm>0)  active.push(`🌧️ ${G.pu.coinstorm.toFixed(1)}s`);
    if(G.pu.supersaver>0) active.push(`💪 ${G.pu.supersaver.toFixed(1)}s`);
    if(G.piggyComboBuffer>0) active.push(`🛟 Buffer ×${G.piggyComboBuffer}`);
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
        <li><b>Watch out:</b> red Savings Killers (Late Fee, High Interest, Fire Money, Impulse Purchase, Broken Piggy Bank, Emergency Expense) cost you money, stamina or your combo — run out of stamina and it's game over.</li>
        <li><b>Power-ups:</b> Magnet, Insurance, Time Freeze, Speed Boost, Debt Burner, Golden Piggy, Coin Storm and Super Saver Mode all help — grab them!</li>
        <li><b>Scoring:</b> catches in a row build a combo multiplier — the more you chain, the more each catch is worth.</li>
        <li><b>Savings Empire:</b> everything you save deposits into your lifetime Savings Vault, evolves your Piggy Bank, and builds Landmarks — tap 🏦 EMPIRE anytime to check your progress.</li>
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

    // §06 Savings Vault — a LIFETIME total, deposited every run whether won or
    // lost (design pillar "every run rewards" — GDD §03 step 10)
    const vtBefore=window.state?(state.mc_vaultTotal||0):0;
    const viBefore=vaultInfo(vtBefore);
    const depositMult=1+(G.piggyVaultXpPct||0)/100;
    const deposit=Math.round(G.money*depositMult);
    if(window.state) state.mc_vaultTotal=vtBefore+deposit;
    const vtAfter=window.state?(state.mc_vaultTotal||0):0;
    const viAfter=vaultInfo(vtAfter);
    const newStage=piggyStageFor(viAfter.level);
    const evolved=newStage.key!==piggyStageFor(viBefore.level).key;

    // §08 Rare Drops (resolves every run) + a few Collection Book badges
    const drop=rollDrop();
    const newBadges=[];
    if(window.state){
      state.mc_collection=state.mc_collection||{money:{},badges:[],drops:[]};
      state.mc_collection.drops=state.mc_collection.drops||[];
      state.mc_collection.drops.push(drop);
      state.mc_collection.badges=state.mc_collection.badges||[];
      if(drop.rarity==='Common') state.coins=(state.coins||0)+15;
      else if(drop.rarity==='Legendary') state.coins=(state.coins||0)+100;
      const bcol=state.mc_collection.badges;
      const grant=k=>{ if(bcol.indexOf(k)<0){ bcol.push(k); newBadges.push(k); } };
      if(deposit>0) grant('firstdeposit');
      if(G.comboRawPeak>=10) grant('combo10');
      if(G.coinsCaught>10 && Object.keys(G.hit).length===0) grant('debtslayer');
      if(isPerfect) grant('perfectrun');
      if(G.li===LEVELS.length-1 && won) grant('allDistricts');
      if(((state.mc_streak&&state.mc_streak.count)||0)>=7) grant('streak7');
    }

    // §12 Missions — evaluate today's 3 against this run's numbers
    const newlyDoneMissions = window.state ? mcEvalMissions({ money:G.money, comboRawPeak:G.comboRawPeak, caught:G.coinsCaught, hitLateFee:(G.hit.latefee||0), staminaPct:Math.round(G.stamina) }) : [];
    mcMetaSave();

    let coins=0;
    const collectibles=(G.newDiscoveries||0)+newBadges.length+(drop.rarity!=='Common'?1:0);
    if(won && window.cvAwardGame){
      const stars=isPerfect?3:(G.stamina>30?2:1);
      coins=cvAwardGame('game_moneycatcher',{level:G.li+1,stars,badge:'Savings Guardian',is3star:stars===3,isPerfect,isFlagship:true,collectibles});
      if(window.cvHubMeter) try{ cvHubMeter('guardian_savings', stars*4); }catch(e){}
    } else if(window.state){
      state.coins=(state.coins||0)+50;
      if(window.cvAddXP) cvAddXP(10,0); if(window.cvSave) cvSave();
    }

    const overEl=document.getElementById('mcOver'); if(!overEl) return;
    overEl.style.display='flex'; overEl.style.overflowY='auto';
    const vaultGrowthPct=Math.min(100,Math.round(G.money/lv.moneyGoal*100));
    const rank=empireRank(vtAfter);
    let tip;
    if(won) tip='Your Savings Empire just grew! Small, consistent savings compound into real wealth over time.';
    else if(G.stamina<=0) tip='Savings Killers drain stamina fast — dodge them and keep a buffer!';
    else tip='Catch more coins, cash and stock before the timer runs out to hit your goal.';
    const headline=won?'Your Savings Empire Just Grew!':'Game Over';

    const vaultBlock=`<div style="background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.25);border-radius:10px;padding:9px 14px;width:100%;max-width:300px;text-align:left">
        <div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.12em;color:#fbbf24;margin-bottom:5px">🏦 SAVINGS VAULT · LIFETIME</div>
        <div style="font-size:.6rem;color:rgba(255,255,255,.8);line-height:1.7">Total: <b style="color:#fff">$${fmt(vtAfter)}</b> · Level <b>${viAfter.level}</b> (${viAfter.theme}) · Rank <b style="color:#5eead4">#${fmt(rank)}</b></div>
      </div>`;
    const evolveBlock=evolved?`<div style="text-align:center;padding:10px 16px;background:rgba(94,234,212,.08);border:1px solid #5eead4;border-radius:12px;max-width:300px">
        <div style="font-size:1.8rem">${newStage.icon}</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:.46rem;color:#5eead4;letter-spacing:.1em">PIGGY EVOLVED!</div>
        <div style="font-family:'Anton',sans-serif;font-size:.95rem;color:#fff">${newStage.name}</div>
        <div style="font-size:.54rem;color:rgba(255,255,255,.6)">${newStage.bonusTxt}</div>
      </div>`:'';
    const dropBlock=`<div style="border:2px solid ${drop.color};box-shadow:0 0 22px ${rgba(drop.color,.5)};border-radius:14px;padding:10px;width:100%;max-width:300px;background:rgba(255,255,255,.03);text-align:center">
        <div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.12em;color:${drop.color};margin-bottom:4px">🎁 ${drop.rarity.toUpperCase()} DROP!</div>
        <div style="font-size:1.6rem">${drop.icon}</div>
        <div style="font-family:'Anton',sans-serif;font-size:.8rem;color:#fff">${drop.name}</div>
      </div>`;
    const badgesBlock=newBadges.length?`<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:300px">
        ${newBadges.map(k=>{ const b=BADGE_DEFS[k]||{name:k,icon:'🏅'}; return `<span style="display:inline-block;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.4);border-radius:20px;padding:5px 12px;font-family:'Orbitron',sans-serif;font-size:.42rem;color:#fbbf24">${b.icon} NEW: ${b.name}</span>`; }).join('')}
      </div>`:'';
    const missionsBlock=newlyDoneMissions.length?`<div style="font-size:.56rem;color:#a78bfa;text-align:center">🎯 ${newlyDoneMissions.length} daily mission${newlyDoneMissions.length>1?'s':''} completed — claim in 🏦 EMPIRE!</div>`:'';

    overEl.innerHTML=`
      <style>
        @keyframes mcWinPop{0%{transform:scale(.7) rotate(-3deg);opacity:0}60%{transform:scale(1.06) rotate(1deg);opacity:1}100%{transform:scale(1) rotate(0)}}
        @keyframes mcFadeIn{0%{transform:scale(.94);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes mcTrophyPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
      </style>
      <div style="display:flex;flex-direction:column;align-items:center;gap:11px;animation:${won?'mcWinPop .55s cubic-bezier(.2,1.4,.4,1)':'mcFadeIn .3s ease'};padding-bottom:6px">
      <div style="font-size:2.2rem${won?';animation:mcTrophyPulse 1.1s ease-in-out infinite':''}">${won?'🏆':'💔'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:${won?.65:.75}rem;letter-spacing:.14em;color:${won?'#34d399':'#f87171'};text-align:center;max-width:280px">${headline}</div>
      ${vaultBlock}
      ${evolveBlock}
      ${dropBlock}
      ${badgesBlock}
      ${missionsBlock}
      <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 18px;width:100%;max-width:300px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:center">
          ${stat('💰 SAVINGS DEPOSITED','$'+fmt(G.money),G.money>=lv.moneyGoal?'#34d399':'#f87171')}
          ${stat('📈 VAULT GROWTH','+'+vaultGrowthPct+'%',vaultGrowthPct>=100?'#34d399':'#fbbf24')}
          ${stat('🧾 LATE FEES AVOIDED',G.avoided.latefee||0,'#60a5fa')}
          ${stat('🛍️ IMPULSE AVOIDED',G.avoided.impulse||0,'#f472b6')}
          ${stat('🔥 PEAK COMBO','×'+G.comboPeak,'#fbbf24')}
          ${stat('❤️ STAMINA',Math.round(G.stamina)+'%','#e2e8f0')}
          ${stat('🗂️ COLLECTION FOUND',G.newDiscoveries||0,'#a855f7')}
          ${stat('🎁 RARE DROP',drop.rarity,drop.color)}
        </div>
      </div>
      <div style="font-size:.78rem;color:#94a3b8;text-align:center;max-width:280px;line-height:1.5;padding:10px 14px;background:rgba(255,255,255,.04);border-radius:10px;border-left:3px solid #14b8a6">💡 ${tip}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        ${won&&G.li<LEVELS.length-1?`<button onclick="mcNextDistrict()" style="padding:11px 22px;background:linear-gradient(135deg,#f59e0b,#fbbf24);border:none;border-radius:10px;color:#1a0a00;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;font-weight:900;cursor:pointer">NEXT DISTRICT → ${LEVELS[G.li+1].name.toUpperCase()}</button>`:''}
        <button onclick="mcReplay()" style="padding:11px 22px;background:linear-gradient(135deg,#0d9488,#14b8a6);border:none;border-radius:10px;color:#fff;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer">REPLAY</button>
        <button onclick="mcMenu()" style="padding:11px 22px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:10px;color:#e2e8f0;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer">DISTRICTS</button>
        <button onclick="mcExit()" style="padding:11px 22px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:10px;color:#e2e8f0;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer">← HUB</button>
      </div>
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
    mcMetaSave(); // belt-and-suspenders: cvSave()'s FIELDS whitelist doesn't cover mc_* fields
    if(window.state){ state.viewingWorld=state._returnHub||TOKEN; }
    goTo('hub'); };
})();
