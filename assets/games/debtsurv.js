/* ════════════════════════════════════════════════════════════════
   DEBT SURVIVAL: GLADIATOR PIT — GDD v1.0 "Gladiator Pit" rebuild (rev 3)
   Top-down arena-combat survival, faithful to Chapter I of the GDD
   (Debt Detox Streets — Levels 1-3, the GDD's own stated MVP scope:
   "Core combat & mission chain (Levels 1–3)... Enemy scaling, bosses
   & nemesis"). Financial Health = Vehicle Health.

   GDD METRICS (6 live stats — all implemented, formulas unchanged):
     - Credit Health (300–850) · Debt Balance (0–1000)
     - Savings Reserve (0–100%) · Interest Pressure (0–100)
     - Financial Knowledge (1–100) · Risk Exposure (0–100)

   WHAT'S NEW IN THIS REV (closing the "missing enemies/bosses" gap):
     - Real Enemy Bible (8 types, GDD behaviors): Debt Rat (evasive
       swarm, multiplies), Late Fee Gremlin (duplicates), Interest
       Leech (attaches & drains), Collection Drone (relentless
       pursuit), Credit Vampire (steals credit, flees), Repossession
       Mech (disables defenses), Debt Titan (heavy bruiser), Default
       Specter (erratic dash) — Mech/Specter reserved for Ch.II+.
     - Debt Generators (Portals/Stations/Reactors) that spawn enemies
       until destroyed — "cut the spawn line" per GDD.
     - Citizen rescue (real rescuable NPCs, not a random-chance hack).
     - Mission chain replaces pure survive-the-timer (GDD "Kill The
       Timer Fantasy" mandate): kills + citizens + generators →
       Mini-Boss → Debt Storm → Main Boss → win.
     - 6 named bosses across 3 arenas (Debt Rat King/Interest Titan,
       Repossession Mech Prime/Collection King, Debt Titan Alpha/
       Debt Overlord) with telegraphed lunge attacks + signature
       mechanics (Titan grows, King confiscates, Overlord surges
       reactors at 50% HP).
     - Player "Blast" combat verb (Space / on-screen button) — the
       GDD's "FIGHT ENEMIES" loop step; ram-kills weak swarm units.
     - Debt Collector Nemesis kept exactly as designed (GDD Nemesis
       System — random unpredictable appearances), reskinned per
       arena (Truck I → Debt Tank → Debt Destroyer).
     - Arena Rank / ability-tier progression (Rookie→Financial Legend,
       GDD thresholds), vehicle evolution visuals, Freedom Mode
       ultimate, Collection Book + achievements, one secret vault
       per arena — all local-only meta layers (state.ds_* namespaced).
     - cvAwardGame now receives `collectibles`; cvHubMeter wired to
       the ACTUAL Debt Detox meter key ('ddt_recovery', matching every
       sibling ddt_*.js game — NOT the literal 'rebuilder' string).

   DELIBERATELY SKIPPED (see final report): full 9-arena campaign,
   real co-op/multiplayer, server-authoritative economy/leaderboards,
   a separate Character-Hub screen — all out of scope for a single
   client-only file with no backend (simulated locally where cheap,
   otherwise cut per the no-fake-network constraint).
   ════════════════════════════════════════════════════════════════ */
(function(){
  let G=null, raf=null, gateTimer=null, _cleanupFn=null, hudH=190;

  window.dsInit=function(){
    clearTimeout(gateTimer);
    if(_cleanupFn){ _cleanupFn(); _cleanupFn=null; }
    cancelAnimationFrame(raf);
    G=null;
  };

  /* ─── LEVEL DEFINITIONS (GDD Chapter I: Debt Detox Streets) ──── */
  const LEVELS=[
    { label:'LEVEL 1', arenaName:'DEBT ALLEY', duration:120, bossSpd:0.045, trapRate:0.10, spawnRate:3.5, items:5, ipRate:0.8,
      enemyTypes:['rat','gremlin','leech'], genType:'portal', genLabel:'Debt Portal', genCount:2, genHP:70, genSpawnRate:4.6,
      missionKills:10, citizens:3, miniBoss:'ratking', boss:'interesttitan',
      objective:'interest', objectiveTarget:30, objectiveLabel:'Interest Pressure ≤ 30',
      nemesisName:'DEBT COLLECTOR TRUCK I' },
    { label:'LEVEL 2', arenaName:'COLLECTION CITADEL', duration:240, bossSpd:0.062, trapRate:0.22, spawnRate:2.8, items:7, ipRate:1.4,
      enemyTypes:['drone','vampire'], genType:'station', genLabel:'Collection Station', genCount:2, genHP:115, genSpawnRate:4.1,
      missionKills:16, citizens:4, miniBoss:'reposmech', boss:'collectionking',
      objective:'credit', objectiveTarget:700, objectiveLabel:'Credit Health ≥ 700',
      nemesisName:'DEBT TANK' },
    { label:'LEVEL 3', arenaName:'DEBT APOCALYPSE CORE', duration:360, bossSpd:0.080, trapRate:0.35, spawnRate:2.2, items:9, ipRate:2.0,
      enemyTypes:['titan','drone','leech'], genType:'reactor', genLabel:'Debt Reactor', genCount:3, genHP:170, genSpawnRate:3.7,
      missionKills:22, citizens:5, miniBoss:'titanalpha', boss:'debtoverlord',
      objective:'debt', objectiveTarget:150, objectiveLabel:'Debt Balance ≤ 150',
      nemesisName:'DEBT DESTROYER' }
  ];

  /* ─── ENEMY BIBLE (GDD §04 — behavior IS the lesson) ─────────── */
  const ENEMY_DEFS={
    rat:     { e:'🐀', name:'Debt Rat',          hp:10, spd:0.30, ram:'kill',  dmg:0,   color:'#f87171', lesson:'Small problems grow if ignored.', swarm:true },
    gremlin: { e:'👺', name:'Late Fee Gremlin',  hp:16, spd:0.16, ram:'kill',  dmg:0,   color:'#fb923c', lesson:'Missed payments multiply consequences.', clones:true },
    leech:   { e:'🩸', name:'Interest Leech',    hp:18, spd:0.20, ram:'attach',dmg:0,   color:'#a855f7', lesson:'Interest quietly increases your burden.' },
    drone:   { e:'🤖', name:'Collection Drone',  hp:32, spd:0.17, ram:'hit',   dmg:0.55,color:'#38bdf8', lesson:'Collections create constant pressure.' },
    vampire: { e:'🧛', name:'Credit Vampire',    hp:26, spd:0.22, ram:'steal', dmg:0,   color:'#ef4444', lesson:'Credit damage limits opportunities.' },
    mech:    { e:'🦾', name:'Repossession Mech', hp:56, spd:0.11, ram:'hit',   dmg:0.95,color:'#94a3b8', lesson:'Asset loss has real consequences.', disables:true },
    titan:   { e:'👹', name:'Debt Titan',        hp:92, spd:0.09, ram:'hit',   dmg:1.35,color:'#dc2626', lesson:'Large debt burdens are hardest to overcome.' },
    specter: { e:'👻', name:'Default Specter',   hp:22, spd:0.14, ram:'hit',   dmg:0.9, color:'#c4b5fd', lesson:'Default creates lasting damage.', dashes:true }
  };
  const ENEMY_CAP=14;

  /* ─── BOSS BIBLE — mini-boss + main boss per arena ───────────── */
  const BOSS_DEFS={
    ratking:        { e:'🐀', crown:'👑', name:'Debt Rat King',           hp:130, spd:0.095, taunt:'More of us are always coming!', kind:'mini' },
    interesttitan:  { e:'👹', crown:'🔥', name:'Interest Titan',          hp:225, spd:0.075,  taunt:'Minimum payments FOREVER!', kind:'main', grows:true },
    reposmech:      { e:'🦾', crown:'⚙️', name:'Repossession Mech Prime',hp:175, spd:0.09,   taunt:'Nothing stays yours for long.', kind:'mini' },
    collectionking: { e:'👑', crown:'💳', name:'Collection King',        hp:285, spd:0.08,   taunt:"You can't hide from debt!", kind:'main', confiscates:true },
    titanalpha:     { e:'👹', crown:'⚡', name:'Debt Titan Alpha',       hp:215, spd:0.07,   taunt:'Feel the weight of it all.', kind:'mini' },
    debtoverlord:   { e:'💀', crown:'👑', name:'Debt Overlord',          hp:355, spd:0.065,  taunt:'The system always collects.', kind:'main', reactorPhase:true }
  };

  /* ─── ARENA RANKS / ABILITY PROGRESSION (GDD §02 Progression) ── */
  const ARENA_RANKS=[
    { xp:0,     title:'ROOKIE',           ability:null },
    { xp:500,   title:'DEBT FIGHTER',     ability:'Debt Snowball Blast' },
    { xp:1500,  title:'CREDIT GUARDIAN',  ability:'Credit Repair Pulse' },
    { xp:3000,  title:'WEALTH BUILDER',   ability:'Emergency Fund Shield' },
    { xp:5000,  title:'FREEDOM CHAMPION', ability:'Avalanche Cannon' },
    { xp:10000, title:'FINANCIAL LEGEND', ability:'Investment Multiplier' }
  ];
  function rankIdxForXP(xp){ let idx=0; for(let i=0;i<ARENA_RANKS.length;i++){ if(xp>=ARENA_RANKS[i].xp) idx=i; } return idx; }
  const BLAST_BASE_R=0.115, BLAST_BASE_DMG=20, BLAST_BASE_CD=0.46;
  function blastStats(tier){
    return { r:BLAST_BASE_R+tier*0.011, dmg:BLAST_BASE_DMG+tier*8, cd:Math.max(0.22,BLAST_BASE_CD-tier*0.045), pierce:tier>=4 };
  }
  const VEHICLE_TIERS=[
    { label:'STARTER',        e:'🚗', glow:'#f97316' },
    { label:'IMPROVED',       e:'🚙', glow:'#fb923c' },
    { label:'ELITE',          e:'🏎️', glow:'#fbbf24', shape:'elite' },
    { label:'LEGENDARY',      e:'🏎️', glow:'#fde047', shape:'legendary' },
    { label:'FIN. CHAMPION',  e:'🏎️', glow:'#ffffff', shape:'champion' }
  ];
  // GDD Vehicle Systems: "Each tier changes the silhouette, paint and FX —
  // not just stat bars." Tiers 0-1 keep distinct emoji (🚗/🚙); tiers 2-4
  // previously all rendered the identical 🏎️ glyph, differing only by glow
  // color. `shape` now drives a real per-tier vector silhouette — see
  // drawVehicleShape / drawEliteShape / drawLegendaryShape / drawChampionShape
  // just above drawPlayer().

  /* ─── DEBT GENERATOR VISUALS (GDD: Debt Portals / Collection Stations /
     Debt Reactors are distinct structures — previously every arena rendered
     a generic 🏭 regardless of gen.type, only gen.label text differed) ──── */
  const GEN_VISUALS={
    portal:  { e:'🌀', color:'#a855f7', ring:'rgba(168,85,247,0.55)' },
    station: { e:'📡', color:'#38bdf8', ring:'rgba(56,189,248,0.55)'  },
    reactor: { e:'🏭', color:'#f97316', ring:'rgba(249,115,22,0.55)' }
  };

  /* ─── ACHIEVEMENTS (GDD §04 Achievement System — client subset) ─ */
  const ACHIEVEMENTS=[
    { k:'alley_clear',    label:'Debt Alley Cleared', icon:'🏅' },
    { k:'titan_slayer',   label:'Titan Slayer',       icon:'🔥' },
    { k:'freedom_champion',label:'Freedom Champion',  icon:'🏆' },
    { k:'always_prepared',label:'Always Prepared',    icon:'🛡️' },
    { k:'credit_rebuilt', label:'Credit Rebuilt',     icon:'📈' },
    { k:'combo_king',     label:'Combo King',         icon:'⚡' },
    { k:'citizen_hero',   label:'Citizen Hero',       icon:'👤' },
    { k:'encyclopedist',  label:'Encyclopedist',      icon:'📖' },
    { k:'financial_legend',label:'Financial Legend',  icon:'👑' }
  ];

  /* ─── COLLECTIBLE / ITEM DEFINITIONS ────────────────────────── */
  const ITEMS=[
    { k:'coin',    e:'🪙', label:'COIN',           good:true,  r:0.028 },
    { k:'cash',    e:'💵', label:'CASH',           good:true,  r:0.032 },
    { k:'tank',    e:'🟢', label:'GREEN TANK',     good:true,  r:0.034 }, // GDD: temporary armored hull, shrug off enemy contact
    { k:'puddle',  e:'🟡', label:'GOLD PUDDLE',    good:true,  r:0.030 },
    { k:'shield',  e:'🔮', label:'SHIELD ORB',     good:true,  r:0.030 },
    { k:'firstaid',e:'💊', label:'FIRST AID',      good:true,  r:0.030 },
    { k:'debtray', e:'⚡', label:'DEBT RAY',       good:true,  r:0.028 }, // GDD: beneficial — melts debt enemies, reduces Debt Balance
    { k:'scam',    e:'📦', label:'SCAM BOX',       good:false, r:0.030 }, // GDD: high risk/reward — random jackpot OR trap
    { k:'latefee', e:'🔴', label:'LATE FEE TRAP',  good:false, r:0.028 }  // GDD: red warning symbol, adds penalties on contact
  ];
  const GOOD_ITEMS = ITEMS.filter(i=> i.good);
  const TRAP_ITEMS = ITEMS.filter(i=>!i.good);

  /* ─── KNOWLEDGE GATE QUIZ DATA (GDD: correct=bonus, wrong=penalty) ── */
  const GATE_QUESTIONS=[
    {
      icon:'📈',
      q:'What causes debt to grow faster over time?',
      choices:['Interest charges','Saving money','Paying on time','Spending less'],
      correct:0,
      correctFx:'Interest reduction granted — Interest Pressure -15!',
      wrongFx:'Enemy buff applied — boss gains speed!',
      correctEffect: G=>{ G.interestPressure=clamp(G.interestPressure-15,0,100); G.financialKnowledge=clamp(G.financialKnowledge+8,1,100); },
      wrongEffect:   G=>{ G.bossBuffT=8; G.flash=0.5; G.flashC='#ef4444'; }
    },
    {
      icon:'🛟',
      q:'What helps handle financial emergencies?',
      choices:['Credit card debt','Emergency savings','Buying more things','Ignoring bills'],
      correct:1,
      correctFx:'Defensive shield granted — Savings Reserve +15!',
      wrongFx:'Emergency attack triggers — boss charges!',
      correctEffect: G=>{ G.savingsReserve=clamp(G.savingsReserve+15,0,100); G.shieldHits=clamp(G.shieldHits+1,0,4); },
      wrongEffect:   G=>{ if(G.bActive){ G.bx=G.px+0.15; G.by=G.py+0.15; G.bRetargetT=0; } else { G.bAppearT=0; } G.flash=0.5; G.flashC='#ef4444'; }
    },
    {
      icon:'💳',
      q:'What happens after long-term non-payment of debt?',
      choices:['Debt disappears','Interest stops','Collections begin','Credit improves'],
      correct:2,
      correctFx:'Collection shield granted — Risk Exposure -20!',
      wrongFx:'Drone swarm summoned — trap items surge!',
      correctEffect: G=>{ G.riskExposure=clamp(G.riskExposure-20,0,100); G.financialKnowledge=clamp(G.financialKnowledge+8,1,100); },
      wrongEffect:   G=>{ for(let i=0;i<3;i++) spawnTrapItem(); G.riskExposure=clamp(G.riskExposure+15,0,100); }
    },
    {
      icon:'🏦',
      q:'What improves your credit score over time?',
      choices:['Paying bills late','Missing payments','Paying on time consistently','Opening many credit cards'],
      correct:2,
      correctFx:'Credit boost granted — Credit Health +30!',
      wrongFx:'Credit loss applied — Credit Health -20!',
      correctEffect: G=>{ G.creditHealth=clamp(G.creditHealth+30,300,850); G.financialKnowledge=clamp(G.financialKnowledge+10,1,100); },
      wrongEffect:   G=>{ G.creditHealth=clamp(G.creditHealth-20,300,850); G.flash=0.4; G.flashC='#ef4444'; }
    },
    {
      icon:'📊',
      q:'Why is it important to diversify investments?',
      choices:['It guarantees profits','It reduces risk','It increases debt','It lowers your credit'],
      correct:1,
      correctFx:'Reward multiplier granted — combo boost!',
      wrongFx:'Volatility penalty — Interest Pressure +20!',
      correctEffect: G=>{ G.comboMult=Math.min(G.comboMult+1,comboCap()); G.financialKnowledge=clamp(G.financialKnowledge+12,1,100); },
      wrongEffect:   G=>{ G.interestPressure=clamp(G.interestPressure+20,0,100); G.flash=0.4; G.flashC='#ef4444'; }
    },
    {
      icon:'❄️',
      q:'The avalanche method means paying which debts first?',
      choices:['Smallest balance first','Newest debts first','Highest interest rate first','Oldest debts first'],
      correct:2,
      correctFx:'Avalanche power — Debt Balance -100!',
      wrongFx:'APR rises — Interest Pressure +15!',
      correctEffect: G=>{ G.debtBalance=clamp(G.debtBalance-100,0,1000); G.financialKnowledge=clamp(G.financialKnowledge+10,1,100); },
      wrongEffect:   G=>{ G.interestPressure=clamp(G.interestPressure+15,0,100); }
    },
    {
      icon:'❄️',
      q:'The snowball method means paying which debts first?',
      choices:['Smallest balance first','Highest interest rate first','Largest balance first','Whichever is newest'],
      correct:0,
      correctFx:'Snowball momentum — quick win! Debt Balance -70!',
      wrongFx:'Motivation stalls — Interest Pressure +12!',
      correctEffect: G=>{ G.debtBalance=clamp(G.debtBalance-70,0,1000); G.comboMult=Math.min(G.comboMult+1,comboCap()); },
      wrongEffect:   G=>{ G.interestPressure=clamp(G.interestPressure+12,0,100); }
    },
    {
      icon:'💵',
      q:'Paying only the minimum on a credit card means:',
      choices:['Debt clears fast','You pay more interest over time','Credit score jumps','No more interest'],
      correct:1,
      correctFx:'Financial Knowledge up — combo multiplier grows!',
      wrongFx:'Interest trap — Interest Pressure +25!',
      correctEffect: G=>{ G.financialKnowledge=clamp(G.financialKnowledge+15,1,100); G.comboMult=Math.min(G.comboMult+1,comboCap()); },
      wrongEffect:   G=>{ G.interestPressure=clamp(G.interestPressure+25,0,100); G.flash=0.5; G.flashC='#ef4444'; }
    }
  ];

  /* ─── ENCOURAGING COACH TIPS (GDD: positive, contextual) ───── */
  const COACH_TIPS_WIN=[
    'Your savings shielded you from major damage!',
    'Paying down debt made you faster — great strategy!',
    'High credit health reduced every hit you took!',
    'Managing interest pressure kept the boss weak!',
    'Your financial knowledge grew with every gate!',
    'Staying debt-free is the ultimate power-up!'
  ];
  const COACH_TIPS_LOSE=[
    'Tip: Keep savings above 30% to absorb big hits!',
    'Tip: Reduce debt early — it slows you down!',
    'Tip: Answer Knowledge Gates correctly for big bonuses!',
    'Tip: High interest pressure buffs the boss — watch it!',
    'Tip: Build your combo by chaining good pickups!',
    'Tip: Shield orbs block one full boss collision!'
  ];

  /* ─── HELPERS ───────────────────────────────────────────────── */
  function clamp(v,lo,hi){ return v<lo?lo:v>hi?hi:v; }
  function rnd(lo,hi){ return lo+Math.random()*(hi-lo); }
  function dist2(ax,ay,bx,by){ const dx=ax-bx,dy=ay-by; return dx*dx+dy*dy; }
  // Stable hash (NOT Math.random) — used by arena backdrops so procedural
  // skyline/fortress/reactor silhouettes don't jitter every animation frame.
  function pseudoRand(n){ const x=Math.sin(n*12.9898)*43758.5453; return x-Math.floor(x); }
  function geo(W,H){
    const pad=8, topUI=hudH;
    const aw=W-pad*2, ah=H-topUI-pad;
    const sh=Math.min(aw,ah);
    return { sh, ox:(W-sh)/2, oy:topUI+(ah-sh)/2 };
  }
  function toScreen(x,y,g){ return [g.ox+x*g.sh, g.oy+y*g.sh]; }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
  function setW(id,pct){ const el=document.getElementById(id); if(el) el.style.width=clamp(pct,0,100)+'%'; }
  function comboCap(){ return G ? 5+Math.min(5,G.aTier) : 5; }

  /* ─── FINANCIAL HEALTH FORMULA (uses all 6 GDD metrics) ─────── */
  function finHealth(G){
    const csPct   = (G.creditHealth-300)/(850-300);        // 0..1
    const savPct  = clamp(G.savingsReserve/100,0,1);        // 0..1
    const debtPct = clamp(G.debtBalance/1000,0,1);          // 0..1 (GDD cap = 1000)
    const ipPct   = clamp(G.interestPressure/100,0,1);      // 0..1
    const kPct    = clamp((G.financialKnowledge-1)/99,0,1); // 0..1
    const rPct    = clamp(G.riskExposure/100,0,1);          // 0..1
    return clamp(Math.round(
      (csPct*0.30 + savPct*0.25 - debtPct*0.20 - ipPct*0.10 + kPct*0.10 - rPct*0.05)*1000
    ),0,1000);
  }

  function dmgMult(G){
    // Interest Pressure amplifies damage (GDD: bosses gain power as IP rises)
    const ipBoost = 1 + G.interestPressure*0.005;  // up to +50% at IP=100
    if(G.creditHealth>=750) return 0.75*ipBoost;
    if(G.creditHealth>=650) return 1.0 *ipBoost;
    if(G.creditHealth>=550) return 1.25*ipBoost;
    if(G.creditHealth>=400) return 1.5 *ipBoost;
    return 2.0*ipBoost;
  }

  function playerSpd(G){
    // Debt slows (GDD cap 1000), knowledge speeds slightly
    const debtFactor = 1 - clamp(G.debtBalance/1000,0,1)*0.5;
    const kFactor    = 1 + clamp((G.financialKnowledge-1)/99,0,1)*0.15;
    return 0.38 * debtFactor * kFactor * (G.freedomActive?1.5:1);
  }

  /* ─── STAR RATING (GDD: 1–5 stars) ─────────────────────────── */
  function calcStars(win, fhs, timeLeft, lv){
    if(!win){
      const survived = lv&&lv.duration ? 1-clamp(timeLeft/lv.duration,0,1) : 0;
      if(survived>=0.75) return 2;
      if(survived>=0.4)  return 1;
      return 0;
    }
    if(fhs>=850) return 5;
    if(fhs>=700) return 4;
    if(fhs>=550) return 3;
    if(fhs>=400) return 2;
    return 1;
  }
  function starStr(n){ return '★'.repeat(n)+'☆'.repeat(Math.max(0,5-n)); }

  function objectiveMet(){
    const lv=G.lv;
    if(lv.objective==='interest') return G.interestPressure<=lv.objectiveTarget;
    if(lv.objective==='credit')   return G.creditHealth>=lv.objectiveTarget;
    if(lv.objective==='debt')     return G.debtBalance<=lv.objectiveTarget;
    return false;
  }

  function discover(key){
    if(!window.state) return;
    state.ds_collectionBook = state.ds_collectionBook || {};
    if(!state.ds_collectionBook[key]){
      state.ds_collectionBook[key]=true;
      G.newDiscoveries=G.newDiscoveries||[];
      G.newDiscoveries.push(key);
    }
  }

  /* ─── RESET / INIT ──────────────────────────────────────────── */
  function reset(lvlIdx){
    const lv=LEVELS[lvlIdx||0];
    const now=performance.now();
    const s=window.state;
    const arenaXP=(s&&s.ds_arenaXP)||0;
    const rIdx=rankIdxForXP(arenaXP);
    G={
      phase:'select',
      lvlIdx:lvlIdx||0, lv,
      // ── 6 GDD financial metrics ──
      creditHealth:650,     creditHealthStart:650,
      debtBalance:0,        debtBalanceStart:0,
      savingsReserve:40,    savingsReserveStart:40,
      interestPressure:0,   interestPressureStart:0,
      financialKnowledge:20,financialKnowledgeStart:20,
      riskExposure:10,      riskExposureStart:10,
      // ── legacy aliases for item effects ──
      get creditScore(){ return this.creditHealth; },
      set creditScore(v){ this.creditHealth=v; },
      get debt(){ return this.debtBalance; },
      set debt(v){ this.debtBalance=v; },
      get savings(){ return this.savingsReserve; },
      set savings(v){ this.savingsReserve=clamp(v,0,100); },
      // ── vehicle ──
      px:0.5, py:0.5, pvx:0, pvy:0,
      dir:1, walkT:0,
      hitFlash:0, hitCD:0,
      shieldHits:0,
      tankArmor:0,
      // ── arena rank / ability / vehicle progression (read-only snapshot for this match) ──
      arenaXP, rankIdx:rIdx, aTier:rIdx, vTier:Math.min(rIdx,4),
      // ── combat: blast attack ──
      blastCD:0, blastFx:[],
      // ── freedom mode ultimate ──
      freedomMeter:0, freedomActive:false, freedomT:0,
      // ── debt collector nemesis (GDD: appears randomly, not constant chaser) ──
      bActive:false,
      bAppearT:rnd(8,18),
      bDepartT:0,
      bx:0.15, by:0.15,
      bTargetX:0.5, bTargetY:0.5,
      bRetargetT:0,
      bSlowT:0,
      bossBuffT:0,
      bossHitCount:0,       // repurposed: total damage dealt to generators/miniboss/mainboss (GDD end stat: Boss Damage)
      // ── arena combat content ──
      enemies:[], generators:[], citizens:[], vault:null,
      missionKillCount:0,
      minibossSpawned:false, minibossDefeated:false, miniboss:null,
      mainbossSpawned:false, mainbossDefeated:false, mainboss:null,
      stormActive:false, stormDone:false, stormT:0,
      vaultFound:false, newDiscoveries:[],
      _savingsHitZero:false,
      // ── items on floor ──
      items:[], itemSpawnT:0,
      // ── GDD end-of-match stats ──
      citizensRescued:0,
      debtDestroyed:0,
      savingsEarned:0,
      bestCombo:0,
      // ── combo system (GDD: up to ×5+) ──
      comboMult:1,
      comboT:0,
      comboCount:0,
      _comboShown:1,
      // ── particles & floats ──
      parts:[], floats:[],
      // ── timer ──
      timeLeft:lv.duration,
      // ── knowledge gate (quiz-based) ──
      gateT:25, gateIdx:0,
      // ── misc ──
      keys:{}, touch:null, drag:null,
      shake:0, flash:0, flashC:'#ef4444',
      last:now,
      firstAidStacks:0,
      startTime:now
    };
  }

  /* ─── SCREEN HTML ───────────────────────────────────────────── */
  window.SCREENS.game_debtsurv=function(){
    if(!G) reset(0);
    setTimeout(dsBoot,30);
    return `<div id="dsRoot" style="position:absolute;inset:0;background:#0f0f14;overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <style>
        @keyframes dsComboPop{0%{transform:scale(1)}40%{transform:scale(1.45)}100%{transform:scale(1)}}
        @keyframes dsPulseGold{0%,100%{opacity:.55}50%{opacity:1}}
      </style>

      <div id="dsHudTop" style="position:absolute;top:0;left:0;right:0;z-index:10;display:flex;flex-direction:column;background:rgba(10,8,20,0.93);border-bottom:1px solid rgba(168,85,247,0.3)">
        <!-- TOP BAR: hub / title / timer -->
        <div style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid rgba(249,115,22,0.18)">
          <button onclick="dsExit()" style="padding:6px 13px;border:1px solid rgba(249,115,22,0.4);border-radius:8px;background:rgba(249,115,22,0.1);color:#fb923c;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.1em;cursor:pointer;white-space:nowrap">← HUB</button>
          <div style="flex:1;text-align:center;overflow:hidden">
            <div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.18em;color:#c4b5fd">⚔ DEBT SURVIVAL · GLADIATOR PIT</div>
            <div id="dsArenaName" style="font-family:'Anton',sans-serif;font-size:.85rem;letter-spacing:.04em;color:#fbbf24"></div>
          </div>
          <button onclick="dsShowHelp()" style="width:24px;height:24px;border-radius:50%;border:1px solid rgba(249,115,22,0.4);background:rgba(249,115,22,0.12);color:#fb923c;font-size:.65rem;cursor:pointer;flex-shrink:0">❓</button>
          <div style="text-align:right">
            <div id="dsTimer" style="font-family:'Orbitron',sans-serif;font-size:1.2rem;font-weight:900;color:#fbbf24;line-height:1">--:--</div>
            <div style="font-size:.42rem;color:rgba(255,255,255,0.4);letter-spacing:.1em">TIME LEFT</div>
          </div>
        </div>

        <!-- STAT BARS (6 GDD metrics, 4 shown as bars) -->
        <div style="padding:5px 14px;display:flex;flex-direction:column;gap:3px">
          ${statBar('CREDIT','dsCSBar','dsCSTxt','#22c55e','0%')}
          ${statBar('DEBT','dsDebtBar','dsDebtTxt','#ef4444','0%')}
          ${statBar('SAVINGS','dsSavBar','dsSavTxt','#3b82f6','0%')}
          ${statBar('INTEREST','dsIPBar','dsIPTxt','#f97316','0%')}
          ${statBar('FREEDOM','dsFreeBar','dsFreeTxt','#fde047','0%')}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1px">
            <div id="dsComboDisp" style="font-family:'Orbitron',sans-serif;font-size:.5rem;font-weight:800;color:#fbbf24;letter-spacing:.06em">×1 COMBO</div>
            <div id="dsLvLabel" style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.14em;color:#c4b5fd"></div>
            <div id="dsStatus" style="font-size:.48rem;color:#fbbf24;min-width:80px;text-align:right"></div>
          </div>
        </div>

        <!-- MISSION CHECKLIST -->
        <div id="dsMission" style="padding:4px 14px 6px;border-top:1px solid rgba(255,255,255,0.06);min-height:14px"></div>

        <!-- BOSS BAR (always present, opacity toggled to keep layout height stable) -->
        <div id="dsBossWrap" style="padding:4px 14px 7px;opacity:0;transition:opacity .25s">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
            <div id="dsBossName" style="font-family:'Orbitron',sans-serif;font-size:.52rem;letter-spacing:.1em;color:#fca5a5"></div>
          </div>
          <div style="height:8px;border-radius:5px;background:rgba(255,255,255,0.08);overflow:hidden">
            <div id="dsBossHpBar" style="height:100%;width:100%;background:linear-gradient(90deg,#7f1d1d,#ef4444);transition:width .2s"></div>
          </div>
        </div>
      </div>

      <canvas id="dsCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:none"></canvas>

      <button id="dsFightBtn" style="position:absolute;right:16px;bottom:18px;z-index:12;width:68px;height:68px;border-radius:50%;border:2px solid #fbbf24;background:radial-gradient(circle,#a855f7,#5b21b6);color:#fff;font-size:1.6rem;cursor:pointer;box-shadow:0 4px 22px rgba(168,85,247,0.5)">⚡</button>

      <div id="dsGate" style="position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.82);backdrop-filter:blur(6px);padding:20px"></div>
      <div id="dsSelect" style="position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);padding:20px"></div>
      <div id="dsHow" style="position:absolute;inset:0;z-index:21;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.88);backdrop-filter:blur(6px);padding:20px"></div>
      <div id="dsOver" style="position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.88);backdrop-filter:blur(6px);padding:20px"></div>
    </div>`;
  };

  function statBar(label,barId,txtId,color,w){
    return `<div style="display:flex;align-items:center;gap:8px">
      <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.1em;color:rgba(255,255,255,0.5);width:58px">${label}</div>
      <div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden">
        <div id="${barId}" style="height:100%;width:${w};background:${color};border-radius:4px;transition:width .18s"></div>
      </div>
      <div id="${txtId}" style="font-size:.46rem;font-weight:700;color:${color};min-width:52px;text-align:right">--</div>
    </div>`;
  }

  /* ─── BOOT / INPUT ──────────────────────────────────────────── */
  function dsBoot(){
    const cv=document.getElementById('dsCanvas'); if(!cv) return;
    if(_cleanupFn){ _cleanupFn(); _cleanupFn=null; }   // never stack window listener sets across re-renders
    const ctx=cv.getContext('2d');
    function size(){
      cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio;
      ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
      const hud=document.getElementById('dsHudTop'); if(hud) hudH=hud.offsetHeight+6;
    }
    size(); window.addEventListener('resize',size);

    const kd=e=>{
      if(!G) return;
      G.keys[e.key.toLowerCase()]=true;
      if(['arrowleft','arrowright','arrowup','arrowdown',' '].includes(e.key.toLowerCase())||['w','a','s','d'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const ku=e=>{ if(G) G.keys[e.key.toLowerCase()]=false; };
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);

    let touchOrigin=null;
    cv.addEventListener('touchstart',e=>{
      if(!G) return;
      const t=e.touches[0];
      const r=cv.getBoundingClientRect();
      touchOrigin={x:t.clientX-r.left, y:t.clientY-r.top};
      G.drag={dx:0,dy:0};
      e.preventDefault();
    },{passive:false});
    cv.addEventListener('touchmove',e=>{
      if(!touchOrigin||!G) return;
      const t=e.touches[0];
      const r=cv.getBoundingClientRect();
      const dx=(t.clientX-r.left)-touchOrigin.x;
      const dy=(t.clientY-r.top)-touchOrigin.y;
      const d=Math.hypot(dx,dy)||1;
      G.drag={dx:d>8?dx/d:0, dy:d>8?dy/d:0};
      e.preventDefault();
    },{passive:false});
    const clrTouch=()=>{ touchOrigin=null; if(G) G.drag=null; };
    cv.addEventListener('touchend',clrTouch); cv.addEventListener('touchcancel',clrTouch);

    const fightBtn=document.getElementById('dsFightBtn');
    let fbOn=null, fbOff=null;
    if(fightBtn){
      fbOn=e=>{ if(G) G.keys[' ']=true; e.preventDefault(); };
      fbOff=()=>{ if(G) G.keys[' ']=false; };
      fightBtn.addEventListener('pointerdown',fbOn);
      fightBtn.addEventListener('pointerup',fbOff);
      fightBtn.addEventListener('pointerleave',fbOff);
    }

    _cleanupFn=()=>{
      window.removeEventListener('resize',size);
      window.removeEventListener('keydown',kd);
      window.removeEventListener('keyup',ku);
      if(fightBtn&&fbOn){ fightBtn.removeEventListener('pointerdown',fbOn); fightBtn.removeEventListener('pointerup',fbOff); fightBtn.removeEventListener('pointerleave',fbOff); }
    };
    G._cleanup=_cleanupFn;
    G.last=performance.now();
    showSelect();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  /* ─── LEVEL SELECT ──────────────────────────────────────────── */
  function showSelect(){
    const el=document.getElementById('dsSelect'); if(!el) return;
    const s=window.state;
    const arenaXP=(s&&s.ds_arenaXP)||0;
    const rIdx=rankIdxForXP(arenaXP);
    const rank=ARENA_RANKS[rIdx];
    const next=ARENA_RANKS[rIdx+1];
    el.style.display='flex';
    el.innerHTML=`<div style="max-width:520px;width:100%;text-align:center;padding:28px 22px;border:1px solid rgba(168,85,247,0.5);border-radius:20px;background:linear-gradient(160deg,#1a1030,#0d0820);box-shadow:0 0 60px rgba(168,85,247,0.25)">
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.22em;color:#c4b5fd;margin-bottom:6px">⚔ DEBT SURVIVAL · GLADIATOR PIT</div>
      <div style="font-family:'Anton',sans-serif;font-size:1.6rem;letter-spacing:.03em;background:linear-gradient(90deg,#fbbf24,#a855f7);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:4px">FIGHT DEBT. BUILD FREEDOM.</div>
      <div style="font-size:.6rem;color:#fbbf24;margin-bottom:14px">🏅 ${rank.title}${rank.ability?' · '+rank.ability:''} · ${arenaXP} XP${next?' (next: '+next.xp+')':''}</div>
      <p style="font-size:.8rem;color:rgba(255,255,255,0.65);margin:0 0 16px;line-height:1.5">Break debt generators, rescue citizens, and defeat named bosses in the arena. Watch for the <b style="color:#ef4444">Debt Collector Nemesis</b> — he appears without warning. Answer Knowledge Gates. Survive to earn ★★★★★.</p>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:8px">
        ${LEVELS.map((l,i)=>{
          const mini=BOSS_DEFS[l.miniBoss], boss=BOSS_DEFS[l.boss];
          return `<button onclick="dsStartLv(${i})" style="flex:1;min-width:145px;padding:12px 8px;border:1px solid rgba(168,85,247,0.4);border-radius:12px;background:rgba(168,85,247,0.08);color:#fbbf24;cursor:pointer;font-size:.7rem;font-weight:700;letter-spacing:.06em;font-family:'Orbitron',sans-serif">
          <div>${l.label}</div>
          <div style="font-size:.6rem;color:#e9d5ff;margin-top:3px;font-family:'Inter',sans-serif">${l.arenaName}</div>
          <div style="font-size:.52rem;color:rgba(255,255,255,0.5);margin-top:4px;font-family:'Inter',sans-serif">${l.duration/60} min · Boss: ${boss.crown}${boss.e} ${boss.name}</div>
        </button>`;}).join('')}
      </div>
      <p style="font-size:.52rem;color:rgba(255,255,255,0.3);margin-top:12px">WASD / Arrows · Touch drag to steer · SPACE or ⚡ to Blast · Answer gates correctly for bonuses!</p>
    </div>`;
  }
  window.dsStartLv=function(i){
    reset(i);
    const el=document.getElementById('dsSelect'); if(el){el.style.display='none';el.innerHTML='';}
    const lbl=document.getElementById('dsLvLabel'); if(lbl) lbl.textContent=LEVELS[i].label;
    const an=document.getElementById('dsArenaName'); if(an) an.textContent=LEVELS[i].arenaName;
    spawnItems();
    spawnArenaContent();
    showHowToPlay(true);   // auto-shown once before play starts; reopenable anytime via the ❓ button
  };

  /* ─── HOW TO PLAY (auto-shown once per level start, reopenable via ❓) ── */
  function howToBody(){
    return `<div style="max-width:480px;width:100%;text-align:center;padding:28px 24px;border:1px solid rgba(168,85,247,0.5);border-radius:20px;background:linear-gradient(160deg,#1a1030,#0d0820);box-shadow:0 0 60px rgba(168,85,247,0.25)">
      <div style="font-size:2.2rem;margin-bottom:6px">⚔️</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.22em;color:#c4b5fd;margin-bottom:10px">HOW TO PLAY</div>
      <div style="font-family:'Anton',sans-serif;font-size:1.15rem;color:#fff;margin-bottom:14px">DEBT SURVIVAL: GLADIATOR PIT</div>
      <ul style="text-align:left;max-width:400px;margin:0 auto;font-size:.75rem;line-height:1.65;color:rgba(255,255,255,0.85);padding-left:18px">
        <li><b>Goal:</b> clear the mission chain — defeat enemies, rescue citizens, destroy Debt Generators — then beat the Mini-Boss and Main Boss before time runs out.</li>
        <li><b>Move:</b> WASD / arrow keys, or touch-drag to steer your vehicle.</li>
        <li><b>Fight:</b> press SPACE or tap ⚡ to unleash a Blast that damages nearby enemies, generators and bosses.</li>
        <li><b>Weak swarm enemies</b> (🐀👺) die on contact. <b>Tougher ones</b> (🤖🧛👹) hit back — blast them from range.</li>
        <li><b>Grab the good stuff:</b> 🪙💵🟢🟡🔮💊⚡ boost your Credit, Savings and melt your Debt.</li>
        <li><b>Dodge the red stuff:</b> 📦 Scam Box and 🔴 Late Fee Trap pile on Debt and Risk.</li>
        <li><b>Watch for 🚛 the Debt Collector:</b> appears without warning and hits hard — Shield Orbs and Green Tank armor block it.</li>
        <li><b>Knowledge Gates:</b> answer correctly for big bonuses — wrong answers buff the boss!</li>
        <li><b>Freedom Mode:</b> fill the gold meter through combat to unleash a temporary golden rampage.</li>
      </ul>
      <button onclick="dsCloseHelp()" style="margin-top:18px;padding:12px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#a855f7,#f97316);color:#fff;font-weight:900;font-family:'Orbitron',sans-serif;font-size:.64rem;letter-spacing:.1em;cursor:pointer">GOT IT — FIGHT ▶</button>
    </div>`;
  }
  function showHowToPlay(first){
    const el=document.getElementById('dsHow'); if(!el||!G) return;
    if(!first) G._pauseStartTs=performance.now();
    G.phase='help';
    el.style.display='flex';
    el.innerHTML=howToBody();
  }
  window.dsShowHelp=function(){ showHowToPlay(false); };
  window.dsCloseHelp=function(){
    const el=document.getElementById('dsHow'); if(el){ el.style.display='none'; el.innerHTML=''; }
    if(!G) return;
    if(G._pauseStartTs){ G.last+=(performance.now()-G._pauseStartTs); G._pauseStartTs=0; }
    G.phase='play';
    G.last=performance.now();
  };

  /* ─── ARENA CONTENT: generators, citizens, secret vault ─────── */
  function spawnArenaContent(){
    const lv=G.lv;
    G.generators=[];
    for(let i=0;i<lv.genCount;i++){
      let x,y,tries=0;
      do{ x=rnd(0.14,0.86); y=rnd(0.14,0.86); tries++; } while(tries<20 && dist2(x,y,0.5,0.5)<0.05);
      G.generators.push({ type:lv.genType, label:lv.genLabel, x,y, hp:lv.genHP, maxHp:lv.genHP, spawnT:rnd(1,3), alive:true });
    }
    G.citizens=[];
    for(let i=0;i<lv.citizens;i++){
      let x,y,tries=0;
      do{ x=rnd(0.1,0.9); y=rnd(0.1,0.9); tries++; } while(tries<20 && dist2(x,y,0.5,0.5)<0.04);
      G.citizens.push({ x,y, rescued:false, bob:Math.random()*6 });
    }
    let vx,vy,vtries=0;
    do{ vx=rnd(0.08,0.92); vy=rnd(0.08,0.92); vtries++; } while(vtries<25 && dist2(vx,vy,0.5,0.5)<0.16);
    G.vault={x:vx,y:vy,found:false};
  }
  function pickEnemyType(lv){ return lv.enemyTypes[Math.floor(Math.random()*lv.enemyTypes.length)]; }
  function spawnEnemyAt(type,x,y){
    const def=ENEMY_DEFS[type];
    if(!def) return;
    if(G.enemies.filter(e=>!e.dead).length>=ENEMY_CAP) return;
    G.enemies.push({
      type, x:clamp(x,0.05,0.95), y:clamp(y,0.05,0.95), hp:def.hp, maxHp:def.hp, r:0.026, dead:false,
      attached:false, attachT:0, drainAcc:0,
      fleeing:false, fleeT:0, stealCD:0,
      cloneGenLeft: def.clones?1:0, cloneT: def.clones?rnd(5,7):999,
      swarmGenLeft: def.swarm?1:0, swarmT: def.swarm?rnd(6,9):999,
      dashT: def.dashes?rnd(2,4):999, dashBurst:0,
      wob:Math.random()*10
    });
  }

  /* ─── ITEM SPAWNING (unchanged GDD-faithful item economy) ────── */
  function spawnItems(){
    const lv=G.lv;
    for(let i=0;i<lv.items;i++) spawnOneItem();
    G.itemSpawnT=lv.spawnRate;
  }

  function spawnOneItem(){
    const lv=G.lv;
    let pool;
    if(Math.random()<lv.trapRate) pool=TRAP_ITEMS;
    else pool=GOOD_ITEMS;
    const def=pool[Math.floor(Math.random()*pool.length)];
    let x,y,tries=0;
    do {
      x=rnd(0.06,0.94); y=rnd(0.06,0.94);
      tries++;
    } while(tries<20 && dist2(x,y,G.px,G.py)<0.08*0.08);
    G.items.push({ k:def.k, e:def.e, r:def.r, x, y, bob:Math.random()*6, life:20, pulse:0 });
  }

  function spawnTrapItem(){
    const def=TRAP_ITEMS[Math.floor(Math.random()*TRAP_ITEMS.length)];
    let x=rnd(0.2,0.8), y=rnd(0.2,0.8);
    G.items.push({ k:def.k, e:def.e, r:def.r, x, y, bob:Math.random()*6, life:12, pulse:0 });
  }

  /* ─── MAIN LOOP ─────────────────────────────────────────────── */
  function loop(now){
    const cv=document.getElementById('dsCanvas');
    if(!cv||!G){ cancelAnimationFrame(raf); return; }
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    const dt=clamp((now-G.last)/1000,0,0.05); G.last=now;
    if(G.phase==='play') update(dt,W,H,now);
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  /* ─── SHARED PLAYER-DAMAGE RESOLUTION (nemesis + enemies + bosses) ── */
  function hitPlayer(multBase, label){
    if(G.freedomActive){
      floatTxt(G.px,G.py-0.05,'✨ FREEDOM SHIELD!','#fde047');
      G.hitCD=0.5; return false;
    }
    if(G.tankArmor>0){
      floatTxt(G.px,G.py-0.05,'🟢 ARMOR BLOCKED!','#4ade80');
      G.shake=0.2; G.hitCD=0.8; return false;
    }
    if(G.shieldHits>0){
      G.shieldHits--;
      floatTxt(G.px,G.py-0.05,'🔮 SHIELD BLOCKED!','#a78bfa');
      G.shake=0.4; G.hitCD=1.0; return false;
    }
    const mult=dmgMult(G)*multBase;
    G.creditHealth=clamp(G.creditHealth-Math.round(50*mult),300,850);
    G.debtBalance=clamp(G.debtBalance+Math.round(80*mult),0,1000);
    G.savingsReserve=clamp(G.savingsReserve-Math.round(10*mult),0,100);
    G.riskExposure=clamp(G.riskExposure+10,0,100);
    G.hitFlash=0.4; G.shake=0.5; G.hitCD=1.2;
    comboBreak();
    burst(G.px,G.py,'#ef4444',10);
    floatTxt(G.px,G.py-0.05,'💥 '+label+'!','#fca5a5',true);
    if(finHealth(G)<=0) end(false);
    return true;
  }
  function comboAdvance(){
    G.comboCount++; G.comboT=0;
    const cap=comboCap();
    if(G.comboCount%3===0 && G.comboMult<cap){
      G.comboMult++;
      floatTxt(G.px,G.py-0.09,'×'+G.comboMult+' COMBO!','#fbbf24',true);
    }
    if(G.comboMult>G.bestCombo) G.bestCombo=G.comboMult;
  }
  function comboBreak(){ G.comboMult=1; G.comboCount=0; }

  /* ─── ENEMY / GENERATOR / BOSS DAMAGE (via player Blast) ─────── */
  function onEnemyDefeated(en){
    const def=ENEMY_DEFS[en.type];
    burst(en.x,en.y,def.color,8);
    floatTxt(en.x,en.y-0.05, def.e+' '+def.name.toUpperCase()+' DOWN','#e5e7eb');
    G.missionKillCount++;
    discover(en.type);
    G.creditHealth=clamp(G.creditHealth+2,300,850);
    G.savingsReserve=clamp(G.savingsReserve+1,0,100);
    G.freedomMeter=clamp(G.freedomMeter+2,0,100);
    comboAdvance();
  }
  function damageEnemy(en,dmg){
    en.hp-=dmg;
    if(en.hp<=0 && !en.dead){ en.dead=true; onEnemyDefeated(en); }
  }
  function onGeneratorDestroyed(gen){
    const vis=GEN_VISUALS[gen.type]||GEN_VISUALS.portal;
    burst(gen.x,gen.y,vis.color,16);
    floatTxt(gen.x,gen.y-0.06,vis.e+' '+gen.label.toUpperCase()+' DESTROYED!','#e9d5ff',true);
    G.shake=0.3;
    G.debtBalance=clamp(G.debtBalance-30,0,1000);
    G.debtDestroyed+=30;
    G.freedomMeter=clamp(G.freedomMeter+10,0,100);
  }
  function damageGenerator(gen,dmg){
    gen.hp-=dmg; G.bossHitCount+=dmg;
    if(gen.hp<=0 && gen.alive){ gen.alive=false; onGeneratorDestroyed(gen); }
  }
  function onBossDefeated(kind,b){
    burst(b.x,b.y,'#fbbf24',22);
    floatTxt(b.x,b.y-0.08, b.crown+b.e+' '+b.name.toUpperCase()+' DEFEATED!', '#fde047', true);
    G.shake=0.65;
    discover((kind==='mini'?G.lv.miniBoss:G.lv.boss));
    if(kind==='mini'){ G.minibossDefeated=true; G.miniboss=null; floatTxt(0.5,0.3,'⚠ MINI-BOSS DOWN — DEBT STORM INCOMING!','#f87171',true); }
    else { G.mainbossDefeated=true; G.mainboss=null; }
  }
  function damageBossEntity(b,kind,dmg){
    b.hp-=dmg; G.bossHitCount+=dmg;
    if(b.hp<=0 && !b.dead){ b.dead=true; onBossDefeated(kind,b); }
  }

  function fireBlast(){
    const st=blastStats(G.aTier);
    G.blastFx.push({x:G.px,y:G.py,r:0,maxR:st.r,life:0.35,max:0.35});
    let hit=false;
    const dmg=st.dmg*(G.freedomActive?1.8:1);
    for(const en of G.enemies){
      if(en.dead) continue;
      if(dist2(en.x,en.y,G.px,G.py)<=st.r*st.r){ damageEnemy(en,dmg); hit=true; }
    }
    for(const gen of G.generators){
      if(!gen.alive) continue;
      if(dist2(gen.x,gen.y,G.px,G.py)<=st.r*st.r){ damageGenerator(gen,dmg); hit=true; }
    }
    if(G.miniboss && !G.miniboss.dead && dist2(G.miniboss.x,G.miniboss.y,G.px,G.py)<=(st.r+0.03)*(st.r+0.03)){
      damageBossEntity(G.miniboss,'mini',dmg); hit=true;
    }
    if(G.mainboss && !G.mainboss.dead && dist2(G.mainboss.x,G.mainboss.y,G.px,G.py)<=(st.r+0.04)*(st.r+0.04)){
      damageBossEntity(G.mainboss,'main', dmg*(st.pierce?1.35:1)); hit=true;
    }
    if(hit) G.freedomMeter=clamp(G.freedomMeter+4,0,100);
  }

  /* ─── ENEMY AI (GDD Enemy Bible behaviors) ───────────────────── */
  function updateEnemies(dt){
    for(const en of G.enemies){
      if(en.dead) continue;
      const def=ENEMY_DEFS[en.type];
      en.wob+=dt*6;
      if(en.attached){
        en.x=G.px; en.y=G.py;
        en.attachT-=dt; en.drainAcc+=dt;
        if(en.drainAcc>=1){
          en.drainAcc=0;
          G.savingsReserve=clamp(G.savingsReserve-2,0,100);
          G.interestPressure=clamp(G.interestPressure+3,0,100);
        }
        if(en.attachT<=0) en.attached=false;
        continue;
      }
      if(en.fleeing){
        const dx=en.x-G.px, dy=en.y-G.py, d=Math.hypot(dx,dy)||1;
        en.x=clamp(en.x+(dx/d)*def.spd*1.4*dt,0.05,0.95);
        en.y=clamp(en.y+(dy/d)*def.spd*1.4*dt,0.05,0.95);
        en.fleeT-=dt; if(en.fleeT<=0) en.fleeing=false;
        if(en.stealCD>0) en.stealCD-=dt;
        continue;
      }
      if(en.stealCD>0) en.stealCD-=dt;

      let dx=G.px-en.x, dy=G.py-en.y; const d=Math.hypot(dx,dy)||1;
      dx/=d; dy/=d;
      if(en.type==='rat'){ const wob=Math.sin(en.wob)*0.7; dx+=(-dy)*wob*0.6; dy+=(dx)*wob*0.6; }
      if(def.dashes){
        en.dashT-=dt;
        if(en.dashT<=0){ en.dashBurst=0.35; en.dashT=rnd(3,5); }
        if(en.dashBurst>0){
          en.dashBurst-=dt;
          en.x=clamp(en.x+dx*def.spd*5*dt,0.05,0.95);
          en.y=clamp(en.y+dy*def.spd*5*dt,0.05,0.95);
          continue;
        }
      }
      en.x=clamp(en.x+dx*def.spd*dt,0.05,0.95);
      en.y=clamp(en.y+dy*def.spd*dt,0.05,0.95);

      if(def.clones && en.cloneGenLeft>0){
        en.cloneT-=dt;
        if(en.cloneT<=0 && G.enemies.filter(e=>!e.dead).length<ENEMY_CAP){
          en.cloneGenLeft--; en.cloneT=999;
          const clone=Object.assign({},en,{hp:Math.round(def.hp*0.6),maxHp:Math.round(def.hp*0.6),cloneGenLeft:0,dead:false,
            x:clamp(en.x+rnd(-0.05,0.05),0.05,0.95), y:clamp(en.y+rnd(-0.05,0.05),0.05,0.95)});
          G.enemies.push(clone);
          floatTxt(en.x,en.y-0.05,'👺 GREMLIN DUPLICATED!','#fb923c');
        }
      }
      if(def.swarm && en.swarmGenLeft>0){
        en.swarmT-=dt;
        if(en.swarmT<=0 && G.enemies.filter(e=>!e.dead).length<ENEMY_CAP){
          en.swarmGenLeft--; en.swarmT=999;
          spawnEnemyAt('rat', en.x+rnd(-0.05,0.05), en.y+rnd(-0.05,0.05));
        }
      }

      const rr=(en.r+0.035);
      if(dist2(en.x,en.y,G.px,G.py)<rr*rr){
        if(def.ram==='kill'){
          en.dead=true;
          G.debtBalance=clamp(G.debtBalance+3,0,1000);
          onEnemyDefeated(en);
        } else if(def.ram==='attach'){
          if(!en.attached){ en.attached=true; en.attachT=6; floatTxt(en.x,en.y-0.05,'🩸 LEECH ATTACHED!','#c084fc'); }
        } else if(def.ram==='steal'){
          if(en.stealCD<=0){
            G.creditHealth=clamp(G.creditHealth-15,300,850);
            en.fleeing=true; en.fleeT=2.5; en.stealCD=3; G.shake=0.3;
            floatTxt(en.x,en.y-0.05,'🧛 CREDIT STOLEN! -15','#f87171',true);
          }
        } else if(def.ram==='hit'){
          if(G.hitCD<=0){
            hitPlayer(def.dmg, def.name.toUpperCase());
            if(def.disables){ G.shieldHits=0; G.tankArmor=0; }
          }
        }
      }
    }
    G.enemies=G.enemies.filter(e=>!e.dead);
  }

  function updateGenerators(dt){
    for(const gen of G.generators){
      if(!gen.alive) continue;
      gen.spawnT-=dt;
      if(gen.spawnT<=0){
        if(G.enemies.filter(e=>!e.dead).length<ENEMY_CAP){
          spawnEnemyAt(pickEnemyType(G.lv), gen.x+rnd(-0.04,0.04), gen.y+rnd(-0.04,0.04));
        }
        gen.spawnT=G.lv.genSpawnRate;
      }
    }
  }

  function updateCitizens(){
    for(const c of G.citizens){
      if(c.rescued) continue;
      c.bob+=0.06;
      if(dist2(c.x,c.y,G.px,G.py)<0.045*0.045){
        c.rescued=true;
        G.citizensRescued++; // state.ds_citizensTotal is aggregated once from this in end(), not here — avoids double-counting
        G.savingsReserve=clamp(G.savingsReserve+8,0,100); G.savingsEarned+=8;
        G.creditHealth=clamp(G.creditHealth+6,300,850);
        G.freedomMeter=clamp(G.freedomMeter+6,0,100);
        floatTxt(c.x,c.y-0.06,'👤 CITIZEN RESCUED!','#86efac',true);
        burst(c.x,c.y,'#86efac',10);
        comboAdvance();
      }
    }
  }

  function updateVault(){
    if(!G.vault||G.vault.found) return;
    if(dist2(G.vault.x,G.vault.y,G.px,G.py)<0.05*0.05){
      G.vault.found=true; G.vaultFound=true;
      G.savingsReserve=clamp(G.savingsReserve+25,0,100); G.savingsEarned+=25;
      G.creditHealth=clamp(G.creditHealth+25,300,850);
      discover('vault');
      floatTxt(G.vault.x,G.vault.y-0.07,'🔓 FREEDOM KEY VAULT! RARE DROP!','#fde047',true);
      burst(G.vault.x,G.vault.y,'#fde047',18);
      G.flash=0.4; G.flashC='#22c55e';
    }
  }

  /* ─── MINI-BOSS / MAIN BOSS ───────────────────────────────────── */
  function spawnMiniBoss(){
    const def=BOSS_DEFS[G.lv.miniBoss];
    G.miniboss={ key:G.lv.miniBoss, name:def.name, e:def.e, crown:def.crown, taunt:def.taunt,
      hp:def.hp, maxHp:def.hp, spd:def.spd, x:rnd(0.15,0.85), y:0.12, dead:false,
      state:'idle', atkT:rnd(2.5,4), telegraphT:0, lungeT:0, lungeDX:0, lungeDY:0, lungeSpd:0, fightT:0 };
    floatTxt(0.5,0.22,'⚔ '+def.name.toUpperCase()+' APPEARS!','#fca5a5',true);
    floatTxt(0.5,0.30,'"'+def.taunt+'"','#e9d5ff');
    G.shake=0.4;
  }
  function spawnBoss(){
    const def=BOSS_DEFS[G.lv.boss];
    G.mainboss={ key:G.lv.boss, name:def.name, e:def.e, crown:def.crown, taunt:def.taunt,
      hp:def.hp, maxHp:def.hp, spd:def.spd, x:rnd(0.15,0.85), y:0.1, dead:false,
      state:'idle', atkT:rnd(2.5,4), telegraphT:0, lungeT:0, lungeDX:0, lungeDY:0, lungeSpd:0, fightT:0,
      grows:def.grows, confiscates:def.confiscates, reactorPhase:def.reactorPhase, phase2:false, scale:1 };
    floatTxt(0.5,0.22,'💀 '+def.name.toUpperCase()+' APPEARS!','#fca5a5',true);
    floatTxt(0.5,0.30,'"'+def.taunt+'"','#e9d5ff');
    G.shake=0.55;
  }
  function updateBossEntity(b,dt,mult,label){
    if(b.state==='lunge'){
      b.x=clamp(b.x+b.lungeDX*b.lungeSpd*dt,0.05,0.95);
      b.y=clamp(b.y+b.lungeDY*b.lungeSpd*dt,0.05,0.95);
      b.lungeT-=dt;
      if(b.lungeT<=0){ b.state='idle'; b.atkT=rnd(3.5,5.5); }
    } else if(b.state==='telegraph'){
      b.telegraphT-=dt;
      if(b.telegraphT<=0){
        const dx=G.px-b.x, dy=G.py-b.y, d=Math.hypot(dx,dy)||1;
        b.lungeDX=dx/d; b.lungeDY=dy/d; b.lungeSpd=b.spd*4.4; b.lungeT=0.45;
        b.state='lunge';
      }
    } else {
      const dx=G.px-b.x, dy=G.py-b.y, d=Math.hypot(dx,dy)||1;
      b.x=clamp(b.x+(dx/d)*b.spd*dt,0.05,0.95);
      b.y=clamp(b.y+(dy/d)*b.spd*dt,0.05,0.95);
      b.atkT-=dt;
      if(b.atkT<=0){ b.state='telegraph'; b.telegraphT=0.7; }
    }
    b.fightT+=dt;
    if(b.grows) b.scale=1+Math.min(1,b.fightT/45)*0.6;
    if(b.reactorPhase && !b.phase2 && b.hp<=b.maxHp*0.5){
      b.phase2=true;
      spawnEnemyAt(pickEnemyType(G.lv), rnd(0.15,0.85), rnd(0.15,0.85));
      spawnEnemyAt(pickEnemyType(G.lv), rnd(0.15,0.85), rnd(0.15,0.85));
      floatTxt(0.5,0.28,'⚡ DEBT REACTORS SURGE!','#f87171',true);
    }
    if(G.hitCD<=0 && dist2(b.x,b.y,G.px,G.py)<(0.06+0.045)*(0.06+0.045)){
      hitPlayer(mult, label);
      if(b.confiscates){ G.shieldHits=0; G.tankArmor=0; }
    }
  }
  function startDebtStorm(){
    G.stormActive=true; G.stormT=10;
    floatTxt(0.5,0.25,'⚠ DEBT STORM! ENEMIES SURGE!','#fca5a5',true);
    G.shake=0.35;
    const n=3+Math.floor(Math.random()*3);
    for(let i=0;i<n;i++) spawnEnemyAt(pickEnemyType(G.lv), rnd(0.1,0.9), rnd(0.1,0.9));
  }
  function updateMission(dt){
    const lv=G.lv;
    if(!G.minibossSpawned){
      const gensDone=G.generators.every(g=>!g.alive);
      if(G.missionKillCount>=lv.missionKills && G.citizensRescued>=lv.citizens && gensDone){
        spawnMiniBoss(); G.minibossSpawned=true;
      }
      return;
    }
    if(G.miniboss) return; // still fighting mini-boss
    if(!G.stormDone){
      if(!G.stormActive) startDebtStorm();
      else {
        G.stormT-=dt;
        if(G.stormT<=0){ G.stormActive=false; G.stormDone=true; }
      }
      return;
    }
    if(!G.mainbossSpawned){ spawnBoss(); G.mainbossSpawned=true; return; }
    if(G.mainbossDefeated){ end(true); }
  }

  /* ─── UPDATE ────────────────────────────────────────────────── */
  function update(dt,W,H,now){
    // ── Timer ──
    G.timeLeft-=dt;
    if(G.timeLeft<=0){
      G.timeLeft=0;
      if(!G.mainbossDefeated) return end(false);
    }
    const m=Math.floor(G.timeLeft/60), s=Math.floor(G.timeLeft%60);
    setTxt('dsTimer',(m<10?'0':'')+m+':'+(s<10?'0':'')+s);

    // ── Interest Pressure rises over time (GDD: buffs boss) ──
    G.interestPressure=clamp(G.interestPressure + G.lv.ipRate*dt, 0, 100);
    if(G.savingsReserve<=0) G._savingsHitZero=true;

    // ── Knowledge Gate every 25s ──
    G.gateT-=dt;
    if(G.gateT<=0) return openGate();

    // ── Player movement ──
    let mx=0,my=0;
    if(G.keys['a']||G.keys['arrowleft'])  mx-=1;
    if(G.keys['d']||G.keys['arrowright']) mx+=1;
    if(G.keys['w']||G.keys['arrowup'])    my-=1;
    if(G.keys['s']||G.keys['arrowdown'])  my+=1;
    if(G.drag){ mx+=G.drag.dx; my+=G.drag.dy; }
    const ml=Math.hypot(mx,my);
    if(ml>0){ mx/=ml; my/=ml; if(Math.abs(mx)>0.05) G.dir=mx>0?1:-1; G.walkT+=dt*10; }
    const spd=playerSpd(G);
    G.px=clamp(G.px+mx*spd*dt, 0.03, 0.97);
    G.py=clamp(G.py+my*spd*dt, 0.03, 0.97);

    // ── Blast attack (Space or on-screen button, gated by cooldown) ──
    if(G.blastCD>0) G.blastCD-=dt;
    if(G.keys[' '] && G.blastCD<=0){ fireBlast(); G.blastCD=blastStats(G.aTier).cd; }

    // ── Freedom Mode ──
    if(G.freedomActive){
      G.freedomT-=dt;
      if(G.freedomT<=0) G.freedomActive=false;
    } else if(G.freedomMeter>=100){
      G.freedomActive=true; G.freedomT=6; G.freedomMeter=0;
      floatTxt(0.5,0.18,'✨ FREEDOM MODE! ✨','#fde047',true);
      for(const en of G.enemies){
        if(en.dead) continue;
        if(dist2(en.x,en.y,G.px,G.py)<0.09*0.09){
          const dx=en.x-G.px, dy=en.y-G.py, d=Math.hypot(dx,dy)||1;
          en.x=clamp(en.x+dx/d*0.25,0.05,0.95); en.y=clamp(en.y+dy/d*0.25,0.05,0.95);
        }
      }
      G.shake=0.5;
    }

    // ── Combo decay: if no pickup for 4s, combo resets ──
    G.comboT+=dt;
    if(G.comboT>4 && G.comboMult>1){
      G.comboMult=Math.max(1,G.comboMult-1);
      G.comboT=0;
    }

    // ── Debt Collector Nemesis (GDD: appears randomly, not constant chaser) ──
    if(!G.bActive){
      G.bAppearT-=dt;
      if(G.bAppearT<=0){
        const edge=Math.floor(Math.random()*4);
        if(edge===0){ G.bx=rnd(0.05,0.95); G.by=0.04; }
        else if(edge===1){ G.bx=rnd(0.05,0.95); G.by=0.96; }
        else if(edge===2){ G.bx=0.04; G.by=rnd(0.05,0.95); }
        else { G.bx=0.96; G.by=rnd(0.05,0.95); }
        G.bActive=true;
        G.bDepartT=rnd(8,16);
        G.bRetargetT=0;
        floatTxt(0.5,0.25,'💀 '+G.lv.nemesisName+' INCOMING!','#fca5a5',true);
        G.shake=0.3;
      }
    } else {
      if(G.bRetargetT<=0){
        G.bTargetX=G.px; G.bTargetY=G.py;
        G.bRetargetT=1.5;
      }
      G.bRetargetT-=dt;
      if(G.bossBuffT>0) G.bossBuffT-=dt;
      const bSpd=(G.bSlowT>0 ? G.lv.bossSpd*0.35 : G.lv.bossSpd) * (G.bossBuffT>0?1.5:1.0)
               * (1 + G.interestPressure*0.006);
      if(G.bSlowT>0) G.bSlowT-=dt;
      const bdx=G.bTargetX-G.bx, bdy=G.bTargetY-G.by, bd=Math.hypot(bdx,bdy)||1;
      G.bx=clamp(G.bx+bdx/bd*bSpd*dt, 0.03, 0.97);
      G.by=clamp(G.by+bdy/bd*bSpd*dt, 0.03, 0.97);

      G.bDepartT-=dt;
      if(G.bDepartT<=0){
        G.bActive=false;
        G.bAppearT=rnd(10,22);
        floatTxt(0.5,0.25,'💀 '+G.lv.nemesisName+' RETREATS!','#86efac',true);
      }

      if(G.hitCD<=0 && dist2(G.bx,G.by,G.px,G.py)<(0.055+0.04)*(0.055+0.04)){
        // hitPlayer() internally handles the armor/shield-absorbed vs. real-damage branches
        // (and their own float text); this just tallies contact toward the Boss Damage stat.
        hitPlayer(1.0, G.lv.nemesisName);
        G.bossHitCount+=6;
      }
    }
    if(G.hitCD>0) G.hitCD-=dt;

    // ── Arena combat systems ──
    updateGenerators(dt);
    updateEnemies(dt);
    updateCitizens();
    updateVault();
    if(G.miniboss && !G.miniboss.dead) updateBossEntity(G.miniboss,dt,1.0,G.miniboss.name.toUpperCase());
    if(G.mainboss && !G.mainboss.dead) updateBossEntity(G.mainboss,dt,1.15,G.mainboss.name.toUpperCase());
    updateMission(dt);

    // ── Item timers ──
    G.itemSpawnT-=dt;
    if(G.itemSpawnT<=0){ spawnOneItem(); G.itemSpawnT=G.lv.spawnRate; }

    // ── Item collision ──
    for(const it of G.items){
      it.bob+=dt*4; it.life-=dt; it.pulse+=dt*5;
      if(it.life<=0){ it.dead=1; continue; }
      if(dist2(it.x,it.y,G.px,G.py)<(it.r+0.04)*(it.r+0.04)){
        applyItem(it);
        it.dead=1;
      }
    }
    G.items=G.items.filter(i=>!i.dead);

    // ── Timers ──
    if(G.tankArmor>0) G.tankArmor-=dt;
    if(G.hitFlash>0) G.hitFlash-=dt;
    if(G.shake>0) G.shake-=dt;
    if(G.flash>0) G.flash-=dt;

    // ── Blast FX ──
    for(const fx of G.blastFx){ fx.life-=dt; fx.r=fx.maxR*(1-fx.life/fx.max); }
    G.blastFx=G.blastFx.filter(f=>f.life>0);

    // ── Particles & floats ──
    for(const p of G.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=0.3*dt; p.life-=dt; }
    G.parts=G.parts.filter(p=>p.life>0);
    for(const f of G.floats){ f.y-=dt*0.09; f.life-=dt; }
    G.floats=G.floats.filter(f=>f.life>0);

    // ── HUD sync ──
    syncHUD();

    // ── Lose check ──
    if(finHealth(G)<=0) end(false);
  }

  function chk(done,txt){
    return `<div style="font-family:'Orbitron',sans-serif;font-size:.44rem;color:${done?'#4ade80':'rgba(255,255,255,0.55)'}">${done?'✅':'▫️'} ${txt}</div>`;
  }
  function missionHTML(){
    const lv=G.lv;
    const genLeft=G.generators.filter(g=>g.alive).length;
    let lines='';
    if(!G.minibossSpawned){
      lines+=chk(G.missionKillCount>=lv.missionKills, `Defeat debt enemies (${Math.min(G.missionKillCount,lv.missionKills)}/${lv.missionKills})`);
      lines+=chk(G.citizensRescued>=lv.citizens, `Rescue citizens (${Math.min(G.citizensRescued,lv.citizens)}/${lv.citizens})`);
      lines+=chk(genLeft===0, `Destroy ${lv.genLabel}s (${lv.genCount-genLeft}/${lv.genCount})`);
    } else if(G.miniboss){
      lines+=chk(false, `⚔ MINI-BOSS: ${G.miniboss.name}`);
    } else if(!G.stormDone){
      lines+=chk(false, G.stormActive? `⚠ DEBT STORM — ${Math.ceil(G.stormT)}s` : '⚠ Debt Storm incoming...');
    } else if(G.mainboss){
      lines+=chk(false, `💀 BOSS: ${G.mainboss.name}`);
    } else if(G.mainbossDefeated){
      lines+=chk(true, '🏆 Arena cleared!');
    }
    return lines;
  }
  function syncBossBar(){
    const wrap=document.getElementById('dsBossWrap'); if(!wrap) return;
    const b=G.mainboss||G.miniboss;
    if(!b){ wrap.style.opacity='0'; return; }
    wrap.style.opacity='1';
    const nameEl=document.getElementById('dsBossName');
    if(nameEl) nameEl.textContent=(G.mainboss?'💀 ':'⚔ ')+b.crown+b.e+' '+b.name+' — '+Math.max(0,Math.ceil(b.hp))+'/'+b.maxHp+' HP';
    setW('dsBossHpBar', clamp(b.hp/b.maxHp,0,1)*100);
  }

  function syncHUD(){
    const csPct=((G.creditHealth-300)/550)*100;
    setW('dsCSBar',csPct);
    setTxt('dsCSTxt',G.creditHealth);

    const debtPct=clamp(G.debtBalance/1000,0,1)*100;
    setW('dsDebtBar',debtPct);
    setTxt('dsDebtTxt',G.debtBalance+'/1000');

    setW('dsSavBar',clamp(G.savingsReserve,0,100));
    setTxt('dsSavTxt',Math.round(G.savingsReserve)+'%');

    setW('dsIPBar',clamp(G.interestPressure,0,100));
    const ipColor=G.interestPressure>70?'#ef4444':G.interestPressure>40?'#fb923c':'#f97316';
    const ipEl=document.getElementById('dsIPTxt');
    if(ipEl){ ipEl.textContent=Math.round(G.interestPressure)+'%'; ipEl.style.color=ipColor; }
    const ipBar=document.getElementById('dsIPBar');
    if(ipBar) ipBar.style.background=ipColor;

    setW('dsFreeBar', G.freedomActive?100:G.freedomMeter);
    const freeEl=document.getElementById('dsFreeTxt');
    if(freeEl) freeEl.textContent=G.freedomActive?'ACTIVE!':Math.round(G.freedomMeter)+'%';
    const freeBar=document.getElementById('dsFreeBar');
    if(freeBar) freeBar.style.animation=G.freedomActive?'dsPulseGold .5s ease-in-out infinite':'none';

    const cDisp=document.getElementById('dsComboDisp');
    if(cDisp){
      cDisp.textContent='×'+G.comboMult+' COMBO';
      cDisp.style.color=G.comboMult>=5?'#fbbf24':G.comboMult>=3?'#fb923c':'rgba(255,255,255,0.45)';
      if(G.comboMult>G._comboShown){ cDisp.style.animation='none'; void cDisp.offsetWidth; cDisp.style.animation='dsComboPop '+(200+G.comboMult*35)+'ms ease-out'; }
      G._comboShown=G.comboMult;
    }

    const st=document.getElementById('dsStatus');
    if(st){
      if(G.freedomActive) st.textContent='✨ FREEDOM MODE!';
      else if(G.tankArmor>0) st.textContent='🟢 ARMOR '+Math.ceil(G.tankArmor)+'s';
      else if(G.shieldHits>0) st.textContent='🔮 SHIELD ×'+G.shieldHits;
      else if(G.bSlowT>0) st.textContent='🟡 SLOWING NEMESIS';
      else if(G.bActive) st.textContent='💀 NEMESIS ACTIVE!';
      else st.textContent='';
    }

    const mEl=document.getElementById('dsMission'); if(mEl) mEl.innerHTML=missionHTML();
    syncBossBar();
  }

  /* ─── APPLY ITEM EFFECT (GDD beneficial pickups / hazards) ───── */
  function applyItem(it){
    burst(it.x,it.y,'#fbbf24',8);

    if(it.k!=='scam' && it.k!=='latefee') comboAdvance();
    else comboBreak();

    switch(it.k){
      case 'coin':
        G.savingsReserve=clamp(G.savingsReserve+5,0,100);
        G.creditHealth=clamp(G.creditHealth+5,300,850);
        G.savingsEarned+=5;
        floatTxt(it.x,it.y-0.03,'🪙 SAV+5%','#fbbf24'); break;
      case 'cash':
        G.savingsReserve=clamp(G.savingsReserve+12,0,100);
        G.creditHealth=clamp(G.creditHealth+10,300,850);
        G.savingsEarned+=12;
        floatTxt(it.x,it.y-0.03,'💵 SAV+12%','#86efac'); break;
      case 'tank':
        G.tankArmor=6;
        G.shieldHits=clamp(G.shieldHits+1,0,4);
        G.creditHealth=clamp(G.creditHealth+15,300,850);
        floatTxt(it.x,it.y-0.03,'🟢 ARMOR UP! 6s IMMUNITY','#4ade80',true);
        G.flash=0.3; G.flashC='#22c55e'; break;
      case 'puddle':
        G.bSlowT=3;
        G.bossHitCount++;
        floatTxt(it.x,it.y-0.03,'🟡 NEMESIS SLOWED 3s','#fde68a'); break;
      case 'shield':
        G.shieldHits=clamp(G.shieldHits+2,0,4);
        G.savingsReserve=clamp(G.savingsReserve+5,0,100);
        floatTxt(it.x,it.y-0.03,'🔮 SHIELD ×'+G.shieldHits,'#a78bfa'); break;
      case 'firstaid':
        G.firstAidStacks=clamp(G.firstAidStacks+1,0,4);
        const redPct=[0.25,0.50,0.75,1.0][G.firstAidStacks-1];
        const cut=Math.round(G.debtBalance*redPct);
        G.debtBalance=Math.round(G.debtBalance*(1-redPct));
        G.debtDestroyed+=cut;
        G.interestPressure=clamp(G.interestPressure-8,0,100);
        floatTxt(it.x,it.y-0.03,'💊 DEBT -'+Math.round(redPct*100)+'%','#86efac',true); break;
      case 'debtray':
        { const raycut=Math.round(80+Math.random()*60);
          G.debtBalance=clamp(G.debtBalance-raycut,0,1000);
          G.debtDestroyed+=raycut;
          G.interestPressure=clamp(G.interestPressure-12,0,100);
          G.creditHealth=clamp(G.creditHealth+10,300,850);
          G.bossHitCount++;
          G.flash=0.3; G.flashC='#22c55e';
          floatTxt(it.x,it.y-0.03,'⚡ DEBT RAY! -'+raycut+' DEBT','#4ade80',true); break; }
      case 'scam':
        if(Math.random()<0.35){
          G.savingsReserve=clamp(G.savingsReserve+20,0,100);
          G.savingsEarned+=20;
          G.creditHealth=clamp(G.creditHealth+20,300,850);
          G.flash=0.3; G.flashC='#22c55e';
          floatTxt(it.x,it.y-0.04,'📦 JACKPOT! SAV+20%','#4ade80',true);
          G.comboMult=Math.min(G.comboMult+1,comboCap()); G.comboCount=0;
        } else {
          G.debtBalance=clamp(G.debtBalance+100,0,1000);
          G.creditHealth=clamp(G.creditHealth-40,300,850);
          G.riskExposure=clamp(G.riskExposure+20,0,100);
          G.hitFlash=0.5; G.shake=0.4; G.flash=0.5; G.flashC='#ef4444';
          floatTxt(it.x,it.y-0.04,'📦 SCAM! DEBT+100','#fca5a5',true);
        }
        break;
      case 'latefee':
        G.debtBalance=clamp(G.debtBalance+60,0,1000);
        G.interestPressure=clamp(G.interestPressure+15,0,100);
        G.creditHealth=clamp(G.creditHealth-25,300,850);
        G.riskExposure=clamp(G.riskExposure+10,0,100);
        G.hitFlash=0.4; G.shake=0.3; G.flash=0.4; G.flashC='#ef4444';
        floatTxt(it.x,it.y-0.04,'🔴 LATE FEE! DEBT+60','#fca5a5',true); break;
    }
    if(finHealth(G)<=0) end(false);
  }

  /* ─── RENDER ────────────────────────────────────────────────── */
  function render(ctx,W,H,now){
    ctx.clearRect(0,0,W,H);
    if(G.phase==='select'||G.phase==='over'||G.phase==='gate'||G.phase==='help') return;
    const g=geo(W,H);
    let ox=0,oy=0;
    if(G.shake>0){ ox=(Math.random()-.5)*G.shake*18; oy=(Math.random()-.5)*G.shake*18; }
    ctx.save(); ctx.translate(ox,oy);

    drawArena(ctx,W,H,g,now);

    if(G.freedomActive){
      ctx.fillStyle='rgba(253,224,71,'+(0.10+0.05*Math.sin(now*0.02))+')';
      ctx.fillRect(0,0,W,H);
    }
    if(G.flash>0){
      ctx.fillStyle='rgba('+(G.flashC==='#22c55e'?'34,197,94':'239,68,68')+','+(G.flash*0.25)+')';
      ctx.fillRect(0,0,W,H);
    }

    ctx.textAlign='center'; ctx.textBaseline='middle';

    drawGenerators(ctx,g,now);
    drawVault(ctx,g,now);
    drawCitizens(ctx,g,now);

    for(const it of G.items){
      const [sx,sy]=toScreen(it.x,it.y,g);
      const bob=Math.sin(it.bob)*3;
      const a=it.life<3?Math.max(0.2,it.life/3):1;
      ctx.globalAlpha=a;
      const pr=it.r*g.sh*1.6*(1+0.12*Math.sin(it.pulse));
      const isTrap=it.k==='scam'||it.k==='latefee';
      ctx.strokeStyle=isTrap?'rgba(249,115,22,0.6)':'rgba(34,197,94,0.5)';
      ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(sx,sy+bob,pr,0,Math.PI*2); ctx.stroke();
      ctx.shadowColor=isTrap?'#f97316':'#22c55e'; ctx.shadowBlur=12;
      ctx.font=(it.r*g.sh*2.2)+'px serif'; ctx.fillText(it.e,sx,sy+bob);
      ctx.shadowBlur=0; ctx.globalAlpha=1;
    }

    drawEnemies(ctx,g,now);
    if(G.bActive) drawNemesis(ctx,g,now);
    if(G.miniboss) drawBossEntity(ctx,g,now,G.miniboss,false);
    if(G.mainboss) drawBossEntity(ctx,g,now,G.mainboss,true);

    drawPlayer(ctx,g,now);

    for(const fx of G.blastFx){
      const [sx,sy]=toScreen(fx.x,fx.y,g);
      const a=clamp(fx.life/fx.max,0,1);
      ctx.globalAlpha=a*0.8;
      ctx.strokeStyle='#a855f7'; ctx.lineWidth=3;
      ctx.shadowColor='#a855f7'; ctx.shadowBlur=16;
      ctx.beginPath(); ctx.arc(sx,sy,fx.r*g.sh,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0; ctx.globalAlpha=1;
    }

    for(const p of G.parts){
      const [sx,sy]=toScreen(p.x,p.y,g);
      ctx.globalAlpha=clamp(p.life/p.max,0,1);
      ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(sx,sy,p.s,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;

    ctx.textAlign='center';
    for(const f of G.floats){
      const [sx,sy]=toScreen(f.x,f.y,g);
      ctx.globalAlpha=clamp(f.life,0,1);
      ctx.fillStyle=f.c; ctx.font='700 '+(f.big?18:13)+'px Inter,sans-serif';
      ctx.shadowColor='rgba(0,0,0,0.7)'; ctx.shadowBlur=4;
      ctx.fillText(f.t,sx,sy); ctx.shadowBlur=0;
    }
    ctx.globalAlpha=1;

    if(!G.bActive && G.bAppearT<6){
      const [sx,sy]=toScreen(0.5,0.12,g);
      ctx.globalAlpha=0.5+0.4*Math.sin(now*0.015);
      ctx.fillStyle='#fca5a5'; ctx.font='700 11px Inter,sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('💀 NEMESIS IN '+Math.ceil(G.bAppearT)+'s',sx,sy);
      ctx.globalAlpha=1;
    }

    ctx.restore();
  }

  /* ─── ARENA-SPECIFIC BACKDROPS (GDD §03 design mandate: "No arena is
     simply longer... Debt Alley is gritty city streets; Collection Citadel
     is a fortress..." — previously all 3 arenas shared one generic
     dark-purple radial gradient + neon grid + gold/violet rim rings, with
     only the enemy roster / boss / text label differing). Each function
     below draws genuinely different scene content while the shared
     gold/violet "gladiator pit" accent language (grid + rim rings + crowd
     dots, drawn once in drawArena) still ties every arena to the same game.
     Placement uses pseudoRand(seed) (a stable hash), not Math.random(), so
     silhouettes hold still frame-to-frame — only glow/pulse/sweep FX
     animate off `now`. ────────────────────────────────────────────────── */
  function drawAlleyScene(ctx,sh,ox,oy,now){
    // Gritty city-street skyline along the top & bottom edges
    for(const edge of [0,1]){
      let x=ox, i=edge*97+1;
      while(x<ox+sh){
        const bw=sh*(0.06+pseudoRand(i*3.1)*0.05);
        const bh=sh*(edge===0?0.06+pseudoRand(i*5.7)*0.09:0.04+pseudoRand(i*5.7)*0.06);
        const by=edge===0?oy:oy+sh-bh;
        ctx.fillStyle='rgba(9,7,18,0.88)';
        ctx.fillRect(x,by,bw,bh);
        // flickering lit windows (GDD: "damaged infrastructure flicker")
        const wCount=1+Math.floor(pseudoRand(i*2.2)*3);
        for(let w=0;w<wCount;w++){
          if(pseudoRand(i*13+w*7)>0.45){
            const flick=0.35+0.55*Math.max(0,Math.sin(now*0.0022+i+w*1.7));
            ctx.fillStyle=`rgba(251,191,36,${0.3*flick})`;
            ctx.fillRect(x+bw*(0.15+w*0.28), by+(edge===0?bh*0.2:bh*0.55), bw*0.12, bh*0.16);
          }
        }
        x+=bw+sh*0.006; i++;
      }
    }
    // Holographic neon ad signs (GDD: "holographic collection warnings")
    const signs=[{y:0.16,c:'249,115,22',side:0},{y:0.58,c:'236,72,153',side:1},{y:0.38,c:'168,85,247',side:0}];
    signs.forEach((sgn,si)=>{
      const pulse=0.5+0.5*Math.sin(now*0.0026+si*2.1);
      const sx=ox+(sgn.side?sh*0.90:sh*0.015), sy=oy+sh*sgn.y;
      ctx.fillStyle=`rgba(${sgn.c},${0.12+0.10*pulse})`;
      ctx.fillRect(sx,sy,sh*0.095,sh*0.017);
    });
    // Rain streaks over rain-slicked streets
    ctx.strokeStyle='rgba(186,206,255,0.09)'; ctx.lineWidth=1;
    for(let r=0;r<12;r++){
      const rx=ox+((r*83+now*0.10)%sh), ry=oy+((r*57)%sh);
      ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx-sh*0.018,ry+sh*0.045); ctx.stroke();
    }
  }
  function drawCitadelScene(ctx,sh,ox,oy,now){
    // Crenellated stone parapet ringing the fortress
    const mw=sh*0.045, mh=sh*0.020, gap=sh*0.018;
    ctx.fillStyle='rgba(32,38,54,0.85)';
    for(let x=ox;x<ox+sh;x+=mw+gap){ ctx.fillRect(x,oy,mw,mh); ctx.fillRect(x,oy+sh-mh,mw,mh); }
    for(let y=oy;y<oy+sh;y+=mw+gap){ ctx.fillRect(ox,y,mh,mw); ctx.fillRect(ox+sh-mh,y,mh,mw); }
    // Corner watchtowers with a sweeping surveillance beam (GDD: "surveillance towers")
    const corners=[[ox+sh*0.07,oy+sh*0.07,0],[ox+sh*0.93,oy+sh*0.07,1],[ox+sh*0.07,oy+sh*0.93,2],[ox+sh*0.93,oy+sh*0.93,3]];
    corners.forEach(([cx,cy,ci])=>{
      ctx.fillStyle='rgba(18,22,34,0.92)';
      ctx.fillRect(cx-sh*0.026,cy-sh*0.026,sh*0.052,sh*0.052);
      ctx.beginPath(); ctx.moveTo(cx,cy-sh*0.048); ctx.lineTo(cx-sh*0.018,cy-sh*0.024); ctx.lineTo(cx+sh*0.018,cy-sh*0.024); ctx.closePath();
      ctx.fillStyle='rgba(13,16,26,0.92)'; ctx.fill();
      const ang=now*0.0005+ci*1.65;
      const lx=cx+Math.cos(ang)*sh*0.42, ly=cy+Math.sin(ang)*sh*0.42;
      const beam=ctx.createLinearGradient(cx,cy,lx,ly);
      beam.addColorStop(0,'rgba(147,197,253,0.12)'); beam.addColorStop(1,'rgba(147,197,253,0)');
      ctx.strokeStyle=beam; ctx.lineWidth=sh*0.05;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(lx,ly); ctx.stroke();
    });
    // Hanging chain motifs from the top edge (GDD: "chained gates")
    ctx.strokeStyle='rgba(148,163,184,0.28)'; ctx.lineWidth=1.5;
    for(let c=0;c<6;c++){
      const cx=ox+sh*(0.1+c*0.16);
      for(let seg=0;seg<5;seg++){
        const cy=oy+sh*0.012+seg*sh*0.024;
        ctx.beginPath(); ctx.ellipse(cx,cy,sh*0.007,sh*0.011,0,0,Math.PI*2); ctx.stroke();
      }
    }
  }
  function drawCoreScene(ctx,sh,ox,oy,now){
    const cx=ox+sh/2, cy=oy+sh/2;
    // Reactor conduits radiating from the molten core
    const pipeCount=10;
    for(let p=0;p<pipeCount;p++){
      const ang=(p/pipeCount)*Math.PI*2;
      const len=sh*(0.36+pseudoRand(p*3.3)*0.09);
      const x1=cx+Math.cos(ang)*sh*0.11, y1=cy+Math.sin(ang)*sh*0.11;
      const x2=cx+Math.cos(ang)*len, y2=cy+Math.sin(ang)*len;
      ctx.strokeStyle='rgba(40,20,18,0.7)'; ctx.lineWidth=sh*0.017;
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      const pulse=(Math.sin(now*0.002+p*1.3)+1)/2;
      ctx.strokeStyle=`rgba(251,146,60,${0.18+0.28*pulse})`; ctx.lineWidth=sh*0.007;
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    }
    // Molten reactor-core glow at the center (GDD: "the heart of debt itself")
    const coreR=sh*0.13*(1+0.05*Math.sin(now*0.0025));
    const coreGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,coreR);
    coreGrad.addColorStop(0,'rgba(254,215,170,0.5)');
    coreGrad.addColorStop(0.45,'rgba(251,113,60,0.26)');
    coreGrad.addColorStop(1,'rgba(251,60,40,0)');
    ctx.fillStyle=coreGrad;
    ctx.beginPath(); ctx.arc(cx,cy,coreR,0,Math.PI*2); ctx.fill();
    // Industrial hazard-stripe banding along the edges
    const stripeW=sh*0.032;
    for(let s=0;s<Math.ceil(sh/stripeW);s+=2){
      ctx.fillStyle='rgba(251,146,60,0.12)';
      ctx.fillRect(ox+s*stripeW,oy,stripeW,sh*0.012);
      ctx.fillRect(ox+s*stripeW,oy+sh-sh*0.012,stripeW,sh*0.012);
    }
    // Embers rising off the reactor floor
    for(let e=0;e<12;e++){
      const ex=ox+sh*pseudoRand(e*7.7);
      const t=(now*0.00035+pseudoRand(e*3.1))%1;
      ctx.globalAlpha=(1-t)*0.5;
      ctx.fillStyle='#fb923c';
      ctx.beginPath(); ctx.arc(ex,oy+sh*(1-t),1.6,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  function drawArena(ctx,W,H,g,now){
    const {sh,ox,oy}=g;
    ctx.fillStyle='#0a0714'; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.beginPath(); ctx.rect(ox,oy,sh,sh); ctx.clip();
    const idx=(G&&G.lvlIdx)||0;
    let grad;
    if(idx===0){ // DEBT ALLEY — neon financial slums
      grad=ctx.createRadialGradient(ox+sh/2,oy+sh*0.45,sh*0.05, ox+sh/2,oy+sh/2,sh*0.8);
      grad.addColorStop(0,'#241a3d'); grad.addColorStop(0.55,'#150f28'); grad.addColorStop(1,'#08050f');
    } else if(idx===1){ // COLLECTION CITADEL — cold stone fortress
      grad=ctx.createRadialGradient(ox+sh/2,oy+sh*0.45,sh*0.05, ox+sh/2,oy+sh/2,sh*0.8);
      grad.addColorStop(0,'#1c2338'); grad.addColorStop(0.55,'#141a2c'); grad.addColorStop(1,'#07090f');
    } else { // DEBT APOCALYPSE CORE — molten reactor heart
      grad=ctx.createRadialGradient(ox+sh/2,oy+sh*0.5,sh*0.04, ox+sh/2,oy+sh/2,sh*0.8);
      grad.addColorStop(0,'#3a1a15'); grad.addColorStop(0.5,'#20110f'); grad.addColorStop(1,'#08050a');
    }
    ctx.fillStyle=grad; ctx.fillRect(ox,oy,sh,sh);
    if(idx===0) drawAlleyScene(ctx,sh,ox,oy,now);
    else if(idx===1) drawCitadelScene(ctx,sh,ox,oy,now);
    else drawCoreScene(ctx,sh,ox,oy,now);
    // Neon grid — redder when Interest Pressure is high, purple otherwise (shared "gladiator pit" identity)
    const ipFrac=G.interestPressure/100;
    ctx.strokeStyle=`rgba(${Math.round(168+ipFrac*80)},${Math.round(85-ipFrac*65)},${Math.round(247-ipFrac*200)},0.075)`; ctx.lineWidth=1;
    const step=sh/14;
    for(let i=1;i<14;i++){
      ctx.beginPath(); ctx.moveTo(ox+i*step,oy); ctx.lineTo(ox+i*step,oy+sh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox,oy+i*step); ctx.lineTo(ox+sh,oy+i*step); ctx.stroke();
    }
    // Gladiator pit rim rings
    for(let r=0;r<2;r++){
      const pr=sh*(0.30+r*0.14)+Math.sin(now*0.0012+r)*4;
      ctx.strokeStyle=r===0?'rgba(251,191,36,0.09)':'rgba(168,85,247,0.08)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(ox+sh/2,oy+sh/2,pr,0,Math.PI*2); ctx.stroke();
    }
    // Crowd-glow dots along the pit rim
    const ringR=sh*0.47;
    for(let i=0;i<24;i++){
      const a=(i/24)*Math.PI*2 + now*0.00015;
      const gx=ox+sh/2+Math.cos(a)*ringR, gy=oy+sh/2+Math.sin(a)*ringR*0.98;
      ctx.globalAlpha=0.25+0.2*Math.sin(now*0.003+i);
      ctx.fillStyle=i%2?'#fbbf24':'#a855f7';
      ctx.beginPath(); ctx.arc(gx,gy,1.6,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
    ctx.restore();
    ctx.save(); ctx.shadowColor='#a855f7'; ctx.shadowBlur=18;
    ctx.strokeStyle='rgba(168,85,247,0.55)'; ctx.lineWidth=3;
    ctx.strokeRect(ox+2,oy+2,sh-4,sh-4);
    ctx.restore();
    ctx.save(); ctx.shadowColor='#fbbf24'; ctx.shadowBlur=10;
    ctx.strokeStyle='rgba(251,191,36,0.35)'; ctx.lineWidth=1;
    ctx.strokeRect(ox+6,oy+6,sh-12,sh-12);
    ctx.restore();
  }

  function drawGenerators(ctx,g,now){
    for(const gen of G.generators){
      if(!gen.alive) continue;
      const vis=GEN_VISUALS[gen.type]||GEN_VISUALS.portal;
      const [sx,sy]=toScreen(gen.x,gen.y,g);
      const pr=g.sh*0.045*(1+0.08*Math.sin(now*0.006));
      ctx.strokeStyle=vis.ring; ctx.lineWidth=2;
      ctx.shadowColor=vis.color; ctx.shadowBlur=16;
      ctx.beginPath(); ctx.arc(sx,sy,pr,0,Math.PI*2); ctx.stroke();
      // Per-type reskin detail (GDD: Debt Portal / Collection Station / Debt
      // Reactor are distinct structures, not one generic generator)
      ctx.save();
      if(gen.type==='station'){
        const ang=now*0.0025;
        ctx.strokeStyle='rgba(125,211,252,0.55)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+Math.cos(ang)*pr*1.3, sy+Math.sin(ang)*pr*1.3); ctx.stroke();
      } else if(gen.type==='reactor'){
        ctx.setLineDash([5,4]);
        ctx.strokeStyle='rgba(251,191,36,0.4)'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(sx,sy,pr*1.3,0,Math.PI*2); ctx.stroke();
      } else { // portal
        ctx.setLineDash([4,5]); ctx.lineDashOffset=-now*0.03;
        ctx.strokeStyle='rgba(216,180,254,0.5)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(sx,sy,pr*1.32,0,Math.PI*2); ctx.stroke();
      }
      ctx.restore();
      ctx.font=(g.sh*0.05)+'px serif'; ctx.fillText(vis.e,sx,sy);
      ctx.shadowBlur=0;
      const bw=g.sh*0.07, bh=4;
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(sx-bw/2,sy-pr-10,bw,bh);
      ctx.fillStyle=vis.color; ctx.fillRect(sx-bw/2,sy-pr-10,bw*clamp(gen.hp/gen.maxHp,0,1),bh);
    }
  }
  function drawCitizens(ctx,g,now){
    for(const c of G.citizens){
      if(c.rescued) continue;
      const [sx,sy]=toScreen(c.x,c.y,g);
      const bob=Math.sin(c.bob)*3;
      ctx.globalAlpha=0.6+0.3*Math.sin(now*0.006);
      ctx.strokeStyle='rgba(134,239,172,0.6)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(sx,sy+bob,g.sh*0.032,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=1;
      ctx.shadowColor='#86efac'; ctx.shadowBlur=10;
      ctx.font=(g.sh*0.038)+'px serif'; ctx.fillText('🧍',sx,sy+bob);
      ctx.shadowBlur=0;
    }
  }
  function drawVault(ctx,g,now){
    if(!G.vault||G.vault.found) return;
    const [sx,sy]=toScreen(G.vault.x,G.vault.y,g);
    ctx.globalAlpha=0.5+0.4*Math.sin(now*0.004);
    ctx.strokeStyle='rgba(253,224,71,0.7)'; ctx.lineWidth=2;
    ctx.shadowColor='#fde047'; ctx.shadowBlur=18;
    ctx.beginPath(); ctx.arc(sx,sy,g.sh*0.04,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=1;
    ctx.font=(g.sh*0.045)+'px serif'; ctx.fillText('🔒📦',sx,sy);
    ctx.shadowBlur=0;
  }
  function drawEnemies(ctx,g,now){
    for(const en of G.enemies){
      if(en.dead) continue;
      const def=ENEMY_DEFS[en.type];
      const [sx,sy]=toScreen(en.x,en.y,g);
      const sz=g.sh*0.038;
      ctx.fillStyle='rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(sx,sy+sz*0.7,sz*0.6,sz*0.2,0,0,Math.PI*2); ctx.fill();
      if(en.attached){ ctx.strokeStyle='rgba(192,132,252,0.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(sx,sy,sz*1.3,0,Math.PI*2); ctx.stroke(); }
      if(en.dashBurst>0){ ctx.strokeStyle='rgba(196,181,253,0.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(sx,sy,sz*1.5,0,Math.PI*2); ctx.stroke(); }
      ctx.shadowColor=def.color; ctx.shadowBlur=10;
      ctx.font=(sz*1.7)+'px serif'; ctx.fillText(def.e,sx,sy);
      ctx.shadowBlur=0;
      if(en.maxHp>=26 && en.hp<en.maxHp){
        const bw=sz*1.7;
        ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(sx-bw/2,sy-sz*1.5,bw,3);
        ctx.fillStyle=def.color; ctx.fillRect(sx-bw/2,sy-sz*1.5,bw*clamp(en.hp/en.maxHp,0,1),3);
      }
    }
  }
  function drawBossEntity(ctx,g,now,b,isMain){
    const [sx,sy]=toScreen(b.x,b.y,g);
    const scale=b.scale||1;
    const sz=g.sh*(isMain?0.075:0.062)*scale;
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(sx,sy+sz*0.8,sz*0.9,sz*0.28,0,0,Math.PI*2); ctx.fill();
    if(b.state==='telegraph'){
      const a=0.4+0.5*Math.sin(now*0.03);
      ctx.strokeStyle=`rgba(239,68,68,${a})`; ctx.lineWidth=3;
      ctx.shadowColor='#ef4444'; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(sx,sy,sz*2.1,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    }
    ctx.save(); ctx.translate(sx,sy);
    ctx.shadowColor=isMain?'#ef4444':'#fca5a5'; ctx.shadowBlur=isMain?24:16;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font=(sz*2.0)+'px serif'; ctx.fillText(b.e,0,0);
    ctx.font=(sz*0.9)+'px serif'; ctx.fillText(b.crown,sz*0.9,-sz*0.9);
    ctx.restore(); ctx.shadowBlur=0;
    ctx.font='700 9px Inter,sans-serif'; ctx.fillStyle=isMain?'#fca5a5':'#fde68a';
    ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillText(b.name,sx,sy+sz*1.15);
  }

  /* ─── VEHICLE TIER SILHOUETTES (GDD Vehicle Systems: "each tier changes
     the silhouette, paint and FX — not just stat bars." Elite/Legendary/
     Fin. Champion previously all rendered the identical 🏎️ glyph, differing
     only by glow color.) Each shape is drawn nose-right at the origin;
     drawPlayer already does ctx.translate(sx,sy) + ctx.scale(G.dir,1) and
     sets shadowColor/shadowBlur before calling this — exactly like the
     emoji fillText it replaces — so hit-flash and facing still work. ──── */
  function drawEliteShape(ctx,sz,glow){
    // low tapered wedge — sleek single-nose sports silhouette
    ctx.fillStyle='#1e2230';
    ctx.beginPath();
    ctx.moveTo(sz*0.95,0); ctx.lineTo(sz*0.45,-sz*0.32); ctx.lineTo(-sz*0.70,-sz*0.30);
    ctx.lineTo(-sz*0.90,0); ctx.lineTo(-sz*0.70,sz*0.30); ctx.lineTo(sz*0.45,sz*0.32);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle=glow; ctx.lineWidth=Math.max(1,sz*0.045);
    ctx.beginPath(); ctx.moveTo(-sz*0.85,0); ctx.lineTo(sz*0.9,0); ctx.stroke();
    ctx.fillStyle='rgba(196,219,255,0.4)';
    ctx.beginPath(); ctx.ellipse(0,0,sz*0.26,sz*0.15,0,0,Math.PI*2); ctx.fill();
  }
  function drawLegendaryShape(ctx,sz,glow){
    // wider angular hull with twin rear spoiler fins — bulkier than Elite
    ctx.fillStyle='#22232e';
    ctx.beginPath();
    ctx.moveTo(sz*1.05,0); ctx.lineTo(sz*0.5,-sz*0.42); ctx.lineTo(-sz*0.55,-sz*0.46);
    ctx.lineTo(-sz*0.85,-sz*0.24); ctx.lineTo(-sz*0.85,sz*0.24); ctx.lineTo(-sz*0.55,sz*0.46);
    ctx.lineTo(sz*0.5,sz*0.42);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle=glow;
    ctx.beginPath(); ctx.moveTo(-sz*0.85,-sz*0.24); ctx.lineTo(-sz*1.10,-sz*0.42); ctx.lineTo(-sz*0.66,-sz*0.30); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-sz*0.85,sz*0.24); ctx.lineTo(-sz*1.10,sz*0.42); ctx.lineTo(-sz*0.66,sz*0.30); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=glow; ctx.lineWidth=Math.max(1,sz*0.05);
    ctx.beginPath(); ctx.moveTo(-sz*0.5,0); ctx.lineTo(sz*0.95,0); ctx.stroke();
    ctx.fillStyle='rgba(255,240,200,0.4)';
    ctx.beginPath(); ctx.ellipse(sz*0.05,0,sz*0.30,sz*0.17,0,0,Math.PI*2); ctx.fill();
  }
  function drawChampionShape(ctx,sz,glow,now){
    // diamond/arrow hovercraft — widest silhouette, halo ring + wing blades
    const ha=0.4+0.3*Math.sin(now*0.006);
    ctx.strokeStyle=`rgba(255,255,255,${ha})`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,0,sz*1.15,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#262530';
    ctx.beginPath();
    ctx.moveTo(sz*1.15,0); ctx.lineTo(sz*0.25,-sz*0.5); ctx.lineTo(-sz*0.35,-sz*0.30);
    ctx.lineTo(-sz*1.05,0); ctx.lineTo(-sz*0.35,sz*0.30); ctx.lineTo(sz*0.25,sz*0.5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle=glow;
    ctx.beginPath(); ctx.moveTo(-sz*0.1,-sz*0.32); ctx.lineTo(-sz*0.55,-sz*0.66); ctx.lineTo(-sz*0.05,-sz*0.42); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-sz*0.1,sz*0.32); ctx.lineTo(-sz*0.55,sz*0.66); ctx.lineTo(-sz*0.05,sz*0.42); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=glow; ctx.lineWidth=Math.max(1,sz*0.055);
    ctx.beginPath(); ctx.moveTo(-sz*0.95,0); ctx.lineTo(sz*1.05,0); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(sz*0.1,0,sz*0.24,sz*0.15,0,0,Math.PI*2); ctx.fill();
  }
  function drawVehicleShape(ctx,sz,shape,glow,now){
    if(shape==='elite') drawEliteShape(ctx,sz,glow);
    else if(shape==='legendary') drawLegendaryShape(ctx,sz,glow);
    else if(shape==='champion') drawChampionShape(ctx,sz,glow,now);
  }

  function drawPlayer(ctx,g,now){
    const [sx,sy]=toScreen(G.px,G.py,g);
    const sz=g.sh*0.055;
    const vt=VEHICLE_TIERS[G.vTier]||VEHICLE_TIERS[0];
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(sx,sy+sz*0.7,sz*0.75,sz*0.25,0,0,Math.PI*2); ctx.fill();
    if(G.freedomActive){
      const fa=0.55+0.35*Math.sin(now*0.025);
      ctx.strokeStyle=`rgba(253,224,71,${fa})`; ctx.lineWidth=4;
      ctx.shadowColor='#fde047'; ctx.shadowBlur=26;
      ctx.beginPath(); ctx.arc(sx,sy,sz*2.2,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    }
    if(G.shieldHits>0){
      const alpha=0.5+0.3*Math.sin(now*0.012);
      ctx.strokeStyle=`rgba(167,139,250,${alpha})`; ctx.lineWidth=3;
      ctx.shadowColor='#a78bfa'; ctx.shadowBlur=18;
      ctx.beginPath(); ctx.arc(sx,sy,sz*1.6,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    }
    if(G.tankArmor>0){
      const aa=0.5+0.4*Math.sin(now*0.018);
      ctx.strokeStyle=`rgba(34,197,94,${aa})`; ctx.lineWidth=3;
      ctx.shadowColor='#22c55e'; ctx.shadowBlur=16;
      ctx.beginPath(); ctx.arc(sx,sy,sz*1.5,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    }
    if(G.comboMult>=3){
      const ca=0.3+0.2*Math.sin(now*0.02);
      ctx.strokeStyle=`rgba(251,191,36,${ca})`; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(sx,sy,sz*2.0,0,Math.PI*2); ctx.stroke();
    }
    ctx.save(); ctx.translate(sx,sy); ctx.scale(G.dir,1);
    ctx.shadowColor=G.hitFlash>0?'#ef4444':vt.glow;
    ctx.shadowBlur=G.hitFlash>0?28:14;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(vt.shape) drawVehicleShape(ctx,sz,vt.shape,vt.glow,now);
    else { ctx.font=sz*2.1+'px serif'; ctx.fillText(vt.e,0,0); }
    if(G.debtBalance>400){
      ctx.globalAlpha=0.5+0.3*Math.sin(now*0.015);
      ctx.font=sz*1.4+'px serif';
      ctx.fillText('💨',sz*0.8,-sz*0.6);
      ctx.globalAlpha=1;
    }
    ctx.restore(); ctx.shadowBlur=0;
    if(G.hitFlash>0){
      ctx.globalAlpha=G.hitFlash*0.55; ctx.fillStyle='#ef4444';
      ctx.beginPath(); ctx.arc(sx,sy,sz*1.4,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    }
  }

  /* ─── NEMESIS RESKINS PER ARENA (GDD Nemesis System: "Truck I → Truck II
     → Debt Tank → Debt Destroyer → Overlord Truck" — of the 3 shipped
     arenas, all previously rendered the identical 🚛 glyph, differing only
     by the nemesisName text label.) Drawn at the origin; drawNemesis already
     translates+scales(flip*ipScale,ipScale) and sets the shadow before
     calling this. ──────────────────────────────────────────────────────── */
  function drawDebtTankShape(ctx,sz){
    // low, wide armored tank — treads + turret + barrel (Collection Citadel)
    ctx.fillStyle='#1c1c22';
    ctx.fillRect(-sz*1.05,-sz*0.62,sz*2.1,sz*0.26);
    ctx.fillRect(-sz*1.05,sz*0.36,sz*2.1,sz*0.26);
    ctx.fillStyle='#3f3f46';
    for(let i=-4;i<=4;i++){
      ctx.beginPath(); ctx.arc(i*sz*0.24,-sz*0.49,sz*0.095,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(i*sz*0.24,sz*0.49,sz*0.095,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle='#52525b';
    ctx.beginPath();
    ctx.moveTo(-sz*0.85,-sz*0.36); ctx.lineTo(sz*0.55,-sz*0.36); ctx.lineTo(sz*0.95,0);
    ctx.lineTo(sz*0.55,sz*0.36); ctx.lineTo(-sz*0.85,sz*0.36);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='#71717a';
    ctx.beginPath(); ctx.arc(-sz*0.1,0,sz*0.34,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#3f3f46';
    ctx.fillRect(sz*0.05,-sz*0.07,sz*0.85,sz*0.14);
  }
  function drawDebtDestroyerShape(ctx,sz,now){
    // bulkier spiked destroyer with a pulsing red core (Debt Apocalypse Core)
    ctx.fillStyle='#2a1414';
    ctx.beginPath();
    ctx.moveTo(sz*1.1,0); ctx.lineTo(sz*0.6,-sz*0.5); ctx.lineTo(-sz*0.5,-sz*0.58);
    ctx.lineTo(-sz*1.05,-sz*0.28); ctx.lineTo(-sz*1.05,sz*0.28); ctx.lineTo(-sz*0.5,sz*0.58);
    ctx.lineTo(sz*0.6,sz*0.5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='#7f1d1d';
    ctx.beginPath(); ctx.moveTo(-sz*1.05,-sz*0.28); ctx.lineTo(-sz*1.38,-sz*0.48); ctx.lineTo(-sz*0.80,-sz*0.30); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-sz*1.05,sz*0.28); ctx.lineTo(-sz*1.38,sz*0.48); ctx.lineTo(-sz*0.80,sz*0.30); ctx.closePath(); ctx.fill();
    const pulse=0.5+0.4*Math.sin(now*0.008);
    ctx.fillStyle=`rgba(239,68,68,${0.3+0.6*pulse})`;
    ctx.beginPath(); ctx.arc(sz*0.05,0,sz*0.22,0,Math.PI*2); ctx.fill();
  }

  function drawNemesis(ctx,g,now){
    const [sx,sy]=toScreen(G.bx,G.by,g);
    const sz=g.sh*0.070;
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(sx,sy+sz*0.8,sz*0.9,sz*0.28,0,0,Math.PI*2); ctx.fill();
    if(G.bSlowT>0){
      ctx.strokeStyle='rgba(253,224,71,0.7)'; ctx.lineWidth=3;
      ctx.shadowColor='#fde047'; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(sx,sy,sz*1.8,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    }
    if(G.bossBuffT>0){
      ctx.strokeStyle='rgba(239,68,68,0.8)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(sx,sy,sz*2.2,0,Math.PI*2); ctx.stroke();
    }
    const ipScale=1+G.interestPressure*0.003;
    const bdx=G.bTargetX-G.bx; const flip=bdx>0?1:-1;
    ctx.save(); ctx.translate(sx,sy); ctx.scale(flip*ipScale,ipScale);
    ctx.shadowColor='#ef4444'; ctx.shadowBlur=22;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const nIdx=G.lvlIdx||0;
    if(nIdx===1) drawDebtTankShape(ctx,sz);
    else if(nIdx===2) drawDebtDestroyerShape(ctx,sz,now);
    else { ctx.font=sz*2.0+'px serif'; ctx.fillText('🚛',0,0); }
    ctx.restore(); ctx.shadowBlur=0;
    const pulse=(Math.sin(now*0.008)*0.5+0.5)*0.4+0.2;
    ctx.strokeStyle=`rgba(239,68,68,${pulse})`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(sx,sy,sz*1.9*ipScale,0,Math.PI*2); ctx.stroke();
    ctx.font='700 9px Inter,sans-serif'; ctx.fillStyle='#fca5a5';
    ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillText('💀 '+G.lv.nemesisName,sx,sy+sz*1.1*ipScale);
    const dRatio=clamp(G.bDepartT/16,0,1);
    const bw=sz*4;
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(sx-bw/2, sy-sz*1.6, bw, 5);
    ctx.fillStyle='#ef4444';
    ctx.fillRect(sx-bw/2, sy-sz*1.6, bw*dRatio, 5);
  }

  /* ─── PARTICLES & FLOATS ────────────────────────────────────── */
  function burst(x,y,c,n){
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2, s=0.15+Math.random()*0.5;
      G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,s:2+Math.random()*3,c,life:0.5+Math.random()*0.3,max:0.8});
    }
  }
  function floatTxt(x,y,t,c,big){ G.floats.push({x,y,t,c,life:1.1,big:!!big}); }

  /* ─── KNOWLEDGE GATE (GDD: quiz with correct/wrong effects) ── */
  function openGate(){
    if(!G||G.phase!=='play') return;
    G.phase='gate';
    const q=GATE_QUESTIONS[G.gateIdx%GATE_QUESTIONS.length]; G.gateIdx++;
    const o=document.getElementById('dsGate'); if(!o){ G.phase='play'; G.gateT=25; return; }
    o.style.display='flex';
    const shuffled=q.choices.map((c,i)=>({c,i})).sort(()=>Math.random()-0.5);
    o.innerHTML=`<div style="max-width:460px;width:100%;text-align:center;padding:28px 24px;border:1px solid rgba(168,85,247,0.6);border-radius:20px;background:linear-gradient(160deg,#1a1030,#0d0820);box-shadow:0 0 60px rgba(168,85,247,0.35)">
      <div style="font-family:'Orbitron',sans-serif;font-size:.45rem;letter-spacing:.2em;color:#c4b5fd;margin-bottom:10px">⚡ KNOWLEDGE GATE</div>
      <div style="font-size:2.4rem;margin-bottom:8px">${q.icon}</div>
      <p style="font-size:.9rem;line-height:1.5;color:#fff;font-weight:700;margin:0 0 18px">${q.q}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        ${shuffled.map(({c,i})=>`<button onclick="dsGateAnswer(${i},${q.correct})" style="padding:12px 10px;border:1px solid rgba(168,85,247,0.35);border-radius:10px;background:rgba(168,85,247,0.08);color:#fff;font-size:.72rem;cursor:pointer;text-align:left;line-height:1.3">${c}</button>`).join('')}
      </div>
      <div id="dsGateResult" style="min-height:30px;font-size:.68rem;color:#fbbf24;margin-top:4px"></div>
    </div>`;
  }

  window.dsGateAnswer=function(chosen, correct){
    if(!G||G.phase!=='gate') return;
    const q=GATE_QUESTIONS[(G.gateIdx-1)%GATE_QUESTIONS.length];
    const isCorrect=(chosen===correct);
    const res=document.getElementById('dsGateResult');

    if(isCorrect){
      q.correctEffect(G);
      if(res) res.innerHTML=`<span style="color:#4ade80">✅ CORRECT! ${q.correctFx}</span>`;
    } else {
      q.wrongEffect(G);
      if(res) res.innerHTML=`<span style="color:#f87171">💪 NICE TRY! ${q.wrongFx}</span>`;
    }

    const btns=document.querySelectorAll('#dsGate button');
    btns.forEach(b=>{ b.disabled=true; b.style.opacity='0.5'; });

    clearTimeout(gateTimer);
    gateTimer=setTimeout(()=>{
      gateTimer=null;
      if(!G) return;
      const kFrac=clamp((G.financialKnowledge-1)/99,0,1);
      G.gateT=25 - kFrac*10;
      G.phase='play'; G.last=performance.now();
      const o=document.getElementById('dsGate'); if(o){o.style.display='none';o.innerHTML='';}
    }, 1800);
  };

  /* ─── ACHIEVEMENTS CHECK ──────────────────────────────────────── */
  function checkAchievements(win){
    if(!window.state) return [];
    state.ds_achv=state.ds_achv||{};
    const newly=[];
    const grant=k=>{ if(!state.ds_achv[k]){ state.ds_achv[k]=true; newly.push(k); } };
    if(win && G.lvlIdx===0) grant('alley_clear');
    if(G.mainbossDefeated && G.lv.boss==='interesttitan') grant('titan_slayer');
    if(G.mainbossDefeated && G.lv.boss==='debtoverlord') grant('freedom_champion');
    if(win && !G._savingsHitZero) grant('always_prepared');
    if(G.creditHealth>=800) grant('credit_rebuilt');
    if(G.bestCombo>=10) grant('combo_king');
    if((state.ds_citizensTotal||0)>=25) grant('citizen_hero');
    const bookTotal=Object.keys(ENEMY_DEFS).length+Object.keys(BOSS_DEFS).length;
    if(state.ds_collectionBook && Object.keys(state.ds_collectionBook).length>=bookTotal) grant('encyclopedist');
    if(G.rankIdx>=5) grant('financial_legend');
    return newly.map(k=>ACHIEVEMENTS.find(a=>a.k===k)).filter(Boolean);
  }

  /* ─── END SCREEN (GDD: star rating, headline stats, coach tip) ─ */
  function end(win){
    if(!G||G.phase==='over') return;
    G.phase='over';
    const fhs=finHealth(G);
    const stars=calcStars(win, fhs, G.timeLeft, G.lv);
    const collectibles=(G.vaultFound?1:0)+(G.mainbossDefeated?1:0)+Math.min(2,Math.floor(G.citizensRescued/2));
    const isPerfect= win && fhs>=800 && objectiveMet();
    let rankUpMsg=null, newAchv=[];
    const arenaXpGain=Math.round((win?150:40)+G.debtDestroyed*0.15+G.citizensRescued*12+G.bossHitCount*0.5+G.bestCombo*15+(win?stars*40:0));

    if(window.state){
      state.gamesDone=state.gamesDone||{};
      const beforeRank=rankIdxForXP(state.ds_arenaXP||0);
      state.ds_arenaXP=(state.ds_arenaXP||0)+arenaXpGain;
      const afterRank=rankIdxForXP(state.ds_arenaXP);
      if(afterRank>beforeRank){
        const r=ARENA_RANKS[afterRank];
        rankUpMsg='🔓 RANK UP: '+r.title+(r.ability?' — '+r.ability+' unlocked!':'');
      }
      if(G.citizensRescued>0) state.ds_citizensTotal=(state.ds_citizensTotal||0)+G.citizensRescued;
      newAchv=checkAchievements(win);
      if(window.cvSave) cvSave();

      if(stars>=1 && window.cvAwardGame){
        cvAwardGame('game_debtsurv',{level:(G.lvlIdx||0)+1,stars:Math.min(3,stars),badge:'Debt Survivor',is3star:stars>=3,isPerfect,isFlagship:true,collectibles});
        if(window.cvHubMeter){ try{ cvHubMeter('ddt_recovery', stars*4); }catch(e){} }
      } else {
        state.coins=(state.coins||0)+50;
        if(window.cvAddXP) cvAddXP(20,0);
        if(window.cvSave) cvSave();
      }
    }

    let coachTip;
    if(win){
      if(G.savingsReserve>60) coachTip=COACH_TIPS_WIN[0];
      else if(G.debtBalance<200) coachTip=COACH_TIPS_WIN[1];
      else if(G.creditHealth>750) coachTip=COACH_TIPS_WIN[2];
      else if(G.interestPressure<30) coachTip=COACH_TIPS_WIN[3];
      else if(G.financialKnowledge>60) coachTip=COACH_TIPS_WIN[4];
      else coachTip=COACH_TIPS_WIN[5];
    } else {
      if(G.savingsReserve<20) coachTip=COACH_TIPS_LOSE[0];
      else if(G.debtBalance>600) coachTip=COACH_TIPS_LOSE[1];
      else if(G.financialKnowledge<30) coachTip=COACH_TIPS_LOSE[2];
      else if(G.interestPressure>70) coachTip=COACH_TIPS_LOSE[3];
      else if(G.bestCombo<2) coachTip=COACH_TIPS_LOSE[4];
      else coachTip=COACH_TIPS_LOSE[5];
    }

    const elapsedMin=Math.floor((G.lv.duration-G.timeLeft)/60);
    const elapsedSec=Math.floor((G.lv.duration-G.timeLeft)%60);
    const bookTotal=Object.keys(ENEMY_DEFS).length+Object.keys(BOSS_DEFS).length;
    const bookHave=(window.state&&state.ds_collectionBook)?Object.keys(state.ds_collectionBook).length:0;
    const bookPct=Math.round(100*bookHave/bookTotal);
    const o=document.getElementById('dsOver'); if(!o) return;
    o.style.display='flex';
    o.innerHTML=`<div style="max-width:480px;width:100%;text-align:center;padding:28px 20px;border:1px solid ${win?'rgba(168,85,247,0.6)':'rgba(239,68,68,0.5)'};border-radius:20px;background:linear-gradient(160deg,#1a1030,#0d0820);box-shadow:0 0 60px ${win?'rgba(168,85,247,0.4)':'rgba(239,68,68,0.35)'};animation:${win?'dsWinPop .55s cubic-bezier(.2,1.4,.4,1)':'dsFadeIn .3s ease'};max-height:88vh;overflow-y:auto">
      <style>
        @keyframes dsWinPop{0%{transform:scale(.7) rotate(-3deg);opacity:0}60%{transform:scale(1.06) rotate(1deg);opacity:1}100%{transform:scale(1) rotate(0)}}
        @keyframes dsFadeIn{0%{transform:scale(.94);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes dsStarPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
      </style>
      <div style="font-size:1.8rem;letter-spacing:4px;color:#fbbf24;margin-bottom:2px${win?';animation:dsStarPulse 1.1s ease-in-out infinite':''}">${starStr(stars)}</div>
      <div style="font-size:.48rem;letter-spacing:.2em;color:rgba(255,255,255,0.35);margin-bottom:6px">ARENA RATING</div>
      <div style="font-family:'Anton',sans-serif;font-size:1.1rem;letter-spacing:.05em;color:${win?'#fbbf24':'#fca5a5'};margin-bottom:4px">${win?'ARENA CLEARED!':'FINANCIAL HEALTH DEPLETED'}</div>
      <div style="font-size:.58rem;color:rgba(255,255,255,0.45);margin-bottom:6px">${G.lv.arenaName} · Survived ${elapsedMin>0?elapsedMin+'m ':''}${elapsedSec}s · ${G.lv.label}</div>
      ${G.mainbossDefeated?`<div style="font-size:.62rem;color:#fde047;margin-bottom:10px">🏆 Boss Defeated: ${BOSS_DEFS[G.lv.boss].crown}${BOSS_DEFS[G.lv.boss].e} ${BOSS_DEFS[G.lv.boss].name}</div>`:''}
      ${rankUpMsg?`<div style="font-size:.62rem;color:#86efac;margin-bottom:10px;font-weight:800">${rankUpMsg}</div>`:''}
      ${newAchv.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:10px">${newAchv.map(a=>`<div style="font-size:.52rem;padding:4px 8px;border-radius:8px;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.35);color:#fbbf24">${a.icon} ${a.label}</div>`).join('')}</div>`:''}

      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px;margin-bottom:12px;text-align:left">
        <div style="font-size:.48rem;letter-spacing:.15em;color:rgba(255,255,255,0.45);margin-bottom:8px;text-align:center">MATCH REPORT</div>
        ${endStatRow('💳 Debt Destroyed',  G.debtBalanceStart, G.debtBalance, G.debtDestroyed,  'debt')}
        ${endStatRow('📈 Credit Improved', G.creditHealthStart, G.creditHealth, null,            'credit')}
        ${endStatRow('💰 Savings Earned',  G.savingsReserveStart, G.savingsReserve, G.savingsEarned, 'savings')}
        ${endStatRow('🔥 Interest Cleared',G.interestPressureStart, G.interestPressure, null,   'interest')}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="font-size:.6rem;color:rgba(255,255,255,0.6)">👤 Citizens Rescued</span>
          <span style="font-size:.6rem;color:#4ade80;font-weight:700">${G.citizensRescued}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="font-size:.6rem;color:rgba(255,255,255,0.6)">💥 Boss Damage</span>
          <span style="font-size:.6rem;color:#fb923c;font-weight:700">${Math.round(G.bossHitCount)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="font-size:.6rem;color:rgba(255,255,255,0.6)">⚡ Best Combo</span>
          <span style="font-size:.6rem;color:#fbbf24;font-weight:700">×${G.bestCombo}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0">
          <span style="font-size:.6rem;color:rgba(255,255,255,0.6)">📖 Encyclopedia</span>
          <span style="font-size:.6rem;color:#c4b5fd;font-weight:700">${bookHave}/${bookTotal} (${bookPct}%)</span>
        </div>
      </div>

      <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.25);border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;gap:8px;align-items:flex-start;text-align:left">
        <div style="font-size:1.2rem;flex-shrink:0">🏆</div>
        <div>
          <div style="font-size:.4rem;letter-spacing:.15em;color:#fb923c;margin-bottom:3px">COACH SAYS</div>
          <p style="font-size:.74rem;line-height:1.45;color:#fff;margin:0">${coachTip}</p>
        </div>
      </div>

      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button onclick="dsRestart()" style="padding:11px 18px;border:none;border-radius:12px;background:linear-gradient(135deg,#a855f7,#f97316);color:#fff;font-weight:900;font-family:'Orbitron',sans-serif;font-size:.64rem;letter-spacing:.1em;cursor:pointer">▶ PLAY AGAIN</button>
        <button onclick="dsChangeLv()" style="padding:11px 18px;border:1px solid rgba(168,85,247,0.4);border-radius:12px;background:rgba(168,85,247,0.08);color:#c4b5fd;font-weight:700;font-family:'Orbitron',sans-serif;font-size:.64rem;letter-spacing:.1em;cursor:pointer">⚙ CHANGE LEVEL</button>
        <button onclick="dsExit()" style="padding:11px 18px;border:1px solid rgba(255,255,255,0.15);border-radius:12px;background:rgba(255,255,255,0.05);color:#fff;font-family:'Orbitron',sans-serif;font-size:.64rem;cursor:pointer">← HUB</button>
      </div>
    </div>`;
  }

  function endStatRow(label, before, after, earned, type){
    let better, dispVal, unit='';
    if(type==='debt'){
      better=earned>0||after<=before;
      dispVal=earned>0?'-'+earned:String(after-before);
    } else if(type==='interest'){
      better=after<before;
      dispVal=(after-before>0?'+':'')+Math.round(after-before);
      unit='%';
    } else if(type==='savings'){
      better=after>before;
      dispVal=earned>0?'+'+Math.round(earned)+'%':(Math.round(after-before)+'%');
    } else {
      better=after>before;
      dispVal=(after-before>0?'+':'')+Math.round(after-before);
    }
    const same=before===after;
    const c=same?'#fbbf24':better?'#4ade80':'#f87171';
    const arrow=same?'→':better?'▲':'▼';
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <span style="font-size:.6rem;color:rgba(255,255,255,0.6)">${label}</span>
      <span style="font-size:.6rem;color:rgba(255,255,255,0.35)">${Math.round(before)}${unit} → ${Math.round(after)}${unit}</span>
      <span style="font-size:.62rem;color:${c};font-weight:700">${arrow} ${dispVal}${unit}</span>
    </div>`;
  }

  window.dsRestart=function(){
    const lvl=G?G.lvlIdx:0;
    reset(lvl);
    const o=document.getElementById('dsOver'); if(o){o.style.display='none';o.innerHTML='';}
    G.phase='play'; G.last=performance.now();
    const lbl=document.getElementById('dsLvLabel'); if(lbl) lbl.textContent=LEVELS[lvl].label;
    const an=document.getElementById('dsArenaName'); if(an) an.textContent=LEVELS[lvl].arenaName;
    spawnItems();
    spawnArenaContent();
  };
  window.dsChangeLv=function(){
    const o=document.getElementById('dsOver'); if(o){o.style.display='none';o.innerHTML='';}
    reset(0);
    showSelect();
  };
  window.dsExit=function(){
    clearTimeout(gateTimer); gateTimer=null;
    if(_cleanupFn){ _cleanupFn(); _cleanupFn=null; }
    else if(G&&G._cleanup) G._cleanup();
    cancelAnimationFrame(raf); G=null;
    if(window.state) state.viewingWorld=state._returnHub||'rebuilder';
    goTo('hub');
  };

})();
