/* ════════════════════════════════════════════════════════════════════════
   BLOCK BUILDER — Risk Taker / Bitstream Valley · REBUILT TO GDD v1.0
   ("Block Builder — Game Design Document", prepared by KaBria, CoinCept)

   GDD CORE LOOP (§05/§06), implemented almost verbatim:
     Receive transactions → Organize → Build a block → Solve validation
     puzzle → Hash the block → Link to previous block → Defend against
     hackers → Complete blockchain → Earn coins → Unlock harder networks.

   THREE NETWORKS (GDD §07 + Appendix D), same Bitstream Valley hub:
     L1 CRYPTO CONSTRUCTION YARD — 1 chain. Fill a block → hash-match
        validation puzzle → laser-link to the chain. Hazards: duplicate /
        expired / buggy transactions. Boss: Mini Virus Bot (corrupts a
        block; tap to repair).
     L2 VALIDATOR CITY — 3 concurrent chains ("lanes"). Adds hacker drones
        that must be zapped before they corrupt a chain, and a per-lane
        Consensus meter (validators must agree before a batch "approves").
        Boss: Hash Breaker (corruption that SPREADS to the next block if
        not repaired in time — the immutability lesson, felt).
     L3 GENESIS CORE — 5 concurrent chains, heavier hacker pressure, a
        draining Grid Power meter, Smart Contract logic popups (GDD:
        "correct triggers automatic rewards, incorrect fails") and Network
        Split majority votes (GDD: "vote with validator nodes — majority
        wins"). Boss: The Corruptor AI (final stabilize-the-network beat).

   POWER-UPS: all 10 from GDD Appendix E, unlocked progressively by level,
   each with a distinct real effect (see POWERUPS + applyPowerup()).

   Per HARD CONSTRAINTS for this pass: no real multiplayer/matchmaking (GDD
   §12 Race/Team modes are skipped — this app has no backend), no real-money
   IAP, no server-side live-ops. The GDD's daily/weekly live-ops (§11) are
   simulated ONLY as a local, honestly-labeled lifetime "Guardian Log" of
   milestones — no fake server-gated daily reset is faked.

   Public API kept exactly as before: window.bbInit() + window.SCREENS.
   game_blockbuilder(). Exit funnels through cvAwardGame (never hand-rolls
   coin/XP math) and returns to state._returnHub via the SAME state.
   viewingWorld + goTo('hub') convention used by every other flagship game
   in this codebase (moneycatcher.js, ficoracer.js) — no router patching.
   ════════════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='risktaker', TXN_PER_BLOCK=4, GATE_EVERY=24;
  const CHROME_TOP=132;           // px reserved at top for the DOM HUD chrome
  const BOTTOM_PAD=12;            // px reserved at bottom
  // Absolute cap on transaction-tile / puzzle-chip card height (and therefore font size).
  // Card height used to be a flat fraction of the lane band height (b.h), which is fine at
  // 3-5 lanes but at 1 lane (Level 1) the band is the ENTIRE screen, so card height — and the
  // font sizes derived from it — ballooned past 300px/100px, printing overlapping illegible
  // text ("smears") whenever 2+ tiles were on screen. Width already had this same cap
  // (Math.min(W*.20,150)) — height never did. This closes that gap.
  const CARD_H_MAX=46;
  let G=null, raf=null, LV=0;

  /* ── 3-LEVEL SYSTEM — GDD §07 + Appendix D "Level Comparison Matrix" ── */
  const LEVELS=[
    { key:'yard', name:'CRYPTO CONSTRUCTION YARD', sub:'EASY · RELAXED PACE', icon:'🏗️',
      desc:'A friendly floating construction site. Fill blocks, solve the hash puzzle, and link your first chain.',
      lanes:1, blocksGoal:6, round:95, spawnMul:1.0,
      dupRate:.10, expRate:.12, bugRate:.10, fraudBase:.10, fraudRamp:.14,
      hasHackers:false, hasConsensus:false, hasContracts:false, hasVote:false, hasPower:false,
      corruptEvery:26, corruptMax:8, spreadOnFail:false,
      bossName:'MINI VIRUS BOT', bossIcon:'🦠',
      col:'#38bdf8', colDim:'rgba(56,189,248,.18)' },
    { key:'city', name:'VALIDATOR CITY', sub:'MEDIUM · FAST', icon:'🏙️',
      desc:'An enormous cyber metropolis. Juggle 3 chains, zap hackers, and keep every validator tower in consensus.',
      lanes:3, blocksGoal:9, round:110, spawnMul:1.25,
      dupRate:.12, expRate:.13, bugRate:.11, fraudBase:.14, fraudRamp:.18,
      hasHackers:true, hasConsensus:true, hasContracts:false, hasVote:false, hasPower:false,
      corruptEvery:15, corruptMax:7, spreadOnFail:true,
      bossName:'HASH BREAKER', bossIcon:'🤖',
      col:'#a855f7', colDim:'rgba(168,85,247,.18)' },
    { key:'core', name:'GENESIS CORE', sub:'HARD · VERY FAST', icon:'🌌',
      desc:'The heart of the Coinaverse. 5 chains, smart contracts, network-split votes, and a draining power grid.',
      lanes:5, blocksGoal:12, round:130, spawnMul:1.3,
      dupRate:.13, expRate:.14, bugRate:.12, fraudBase:.18, fraudRamp:.20,
      hasHackers:true, hasConsensus:true, hasContracts:true, hasVote:true, hasPower:true,
      corruptEvery:11, corruptMax:6, spreadOnFail:true,
      bossName:'THE CORRUPTOR AI', bossIcon:'👹',
      col:'#fbbf24', colDim:'rgba(251,191,36,.18)' },
  ];
  function L(){ return LEVELS[LV]; }
  function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

  /* ── LEARN WHILE PLAYING — 12 concepts straight from GDD Appendix B
     (Blockchain Glossary) + §04 (Concept→Mechanic Mapping), split into 3
     disjoint 4-fact slices (L1→0-3 · L2→4-7 · L3→8-11), shuffled per run,
     never repeated within a level nor across levels ── */
  const FACTS=[
    ['⛓️','A BLOCK is a container that holds a batch of transactions — the unit you fill, then close and lock.'],
    ['💳','A TRANSACTION is a record of value moving from sender to receiver — drawn as Sender → Receiver · Amount.'],
    ['📦','BLOCK SIZE & ORDER: how much fits in a block, and the sequence it\'s in. Break the fill limit or the order and you trigger an error.'],
    ['✅','VALIDATION checks a block is correct before it\'s accepted — the puzzle that must be solved before a block can lock.'],
    ['#️⃣','A HASH is a unique fingerprint for a block. Match the symbols right, or the whole block\'s fingerprint breaks.'],
    ['🔗','The PREVIOUS-HASH LINK is how each block points back to the one before it — the laser that connects every new block to the last.'],
    ['🗳️','VALIDATORS & NODES approve blocks; CONSENSUS means enough of them agree it\'s correct. The consensus meter has to fill for approval.'],
    ['🔒','IMMUTABILITY: once written, history can\'t be quietly changed. A hacker would have to rewrite every block after the target — nearly impossible.'],
    ['🤖','A SMART CONTRACT is a rule that runs itself and pays out automatically the instant its condition is true — no middleman needed.'],
    ['🌐','DECENTRALIZATION means no single owner — thousands of nodes share the ledger. When the network splits, the majority vote decides.'],
    ['📒','A DISTRIBUTED LEDGER is the shared record everyone keeps a copy of — like the multiple chains you juggle at once in Genesis Core.'],
    ['🛡️','NETWORK SECURITY defends the system from attackers — hashing, validation, consensus, and firewalls working together as layered defense.']
  ];
  const END_LESSONS=[
    {icon:'⛓️', concept:'Blocks, Transactions & Validation', text:'Every blockchain starts the same way: transactions get organized into a block, the block is validated, then locked and linked to the one before it. Get the order right and validate before you lock — that\'s the whole foundation.'},
    {icon:'#️⃣', concept:'Hashes, Validators & Consensus', text:'Every block carries a hash fingerprint and a link to the block before it — change one and the chain snaps apart. Validators only approve a block once enough of them agree: that\'s consensus, and it\'s why blockchains are so hard to fool.'},
    {icon:'🌐', concept:'Smart Contracts & Decentralization', text:'At the center of the network, smart contracts execute themselves the instant their conditions are true, and no single node controls the chain — thousands share it, so a majority vote decides, and the whole system defends itself together.'}
  ];

  /* ── POWER-UP CATALOGUE — all 10 from GDD §08 / Appendix E, unlocked
     progressively (minLV) so the pool GROWS with difficulty ── */
  const POWERUPS=[
    {key:'shield',      icon:'🛡️', name:'Hash Shield',              kind:'timed',   dur:20, minLV:0},
    {key:'validator',   icon:'⚡', name:'Lightning Validator',       kind:'timed',   dur:12, minLV:0},
    {key:'dupdef',      icon:'🧯', name:'Duplicate Defender',        kind:'timed',   dur:16, minLV:0},
    {key:'firewall',    icon:'💥', name:'Firewall Pulse',            kind:'instant',         minLV:1},
    {key:'nodeboost',   icon:'📶', name:'Node Boost',                kind:'instant',         minLV:1},
    {key:'freeze',      icon:'❄️', name:'Time Freeze',               kind:'timed',   dur:10, minLV:1},
    {key:'quantum',     icon:'⚛️', name:'Quantum Builder',           kind:'instant',         minLV:2},
    {key:'contractacc', icon:'📜', name:'Smart Contract Accelerator',kind:'instant',         minLV:2},
    {key:'repair',      icon:'🔧', name:'Chain Repair Beam',         kind:'instant',         minLV:2},
    {key:'overclock',   icon:'🚀', name:'Genesis Overclock',         kind:'timed',   dur:14, minLV:2},
  ];
  function powerupPool(){ return POWERUPS.filter(p=>p.minLV<=LV); }

  /* ── transaction copy pools — GDD §B format "Sender → Receiver · Amount" ── */
  const VALID=[
    {t:'Mia → Bob · 5'},{t:'Lab → Dev · 20'},{t:'Ali → Zoe · 3'},
    {t:'Sam → Ana · 8'},{t:'Joe → Kim · 12'},{t:'Pay Invoice · 15'},
    {t:'Stake 10 coins'},{t:'Swap → ETH · 2'},{t:'Tip Dev · 1'},
    {t:'Refund Ana · 8'},{t:'Leo → Max · 6'},{t:'Buy NFT · 4'}
  ];
  const FRAUD=[{t:'Double-spend!'},{t:'Fake hash!'},{t:'Bad signature!'},{t:'Replay attack!'},{t:'Spoofed key!'},{t:'Negative amt!'},{t:'Forged block!'}];
  const DUP=[{t:'Duplicate txn!'},{t:'Already logged!'},{t:'Copy detected!'},{t:'Resent twice!'}];
  const BUG=[{t:'Glitched data'},{t:'Buggy field'},{t:'Corrupted txn'}];
  const CODE_CHARS='01ABCDEF₿x#$0110';
  function rch(){ return CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]; }
  const HASH_SYMS=['▲','■','●','◆','★','▼'];

  window.bbInit=function(){ if(G&&G._cleanup) G._cleanup(); cancelAnimationFrame(raf); raf=null; clearTimeout(window._bbFactT); G=null; LV=0; };

  /* ══════════════════════════ SCREEN (shell) ══════════════════════════ */
  window.SCREENS.game_blockbuilder=function(){
    setTimeout(bbShowSelect,30);
    return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#051829,#031019 55%,#020e1a);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <canvas id="bbCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>
      <div id="bbUI" style="position:absolute;inset:0;pointer-events:none;z-index:5"></div>
    </div>`;
  };

  /* ── LEVEL SELECT — garage-style network cards (GDD "3 networks") ── */
  function bbShowSelect(){
    const ui=document.getElementById('bbUI'); if(!ui) return;
    ui.style.pointerEvents='auto';
    const s=window.state||{};
    const bestLv=(s.gameLevels&&s.gameLevels['game_blockbuilder'])||0;
    const bestStars=(s.gameStars&&s.gameStars['game_blockbuilder'])||0;
    const stats=s.bb_stats||{blocksMined:0,hackersStopped:0,perfectBlocks:0,contractsWon:0};
    const MS=[
      ['🧊','Perfect blocks mined (no mistakes)',stats.perfectBlocks||0,15],
      ['👾','Hacker drones stopped',stats.hackersStopped||0,25],
      ['📜','Smart contracts triggered correctly',stats.contractsWon||0,10],
    ];
    ui.innerHTML=`<div style="position:absolute;inset:0;background:linear-gradient(180deg,#051a2e,#020c16);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px;overflow:auto">
      <button onclick="bbExit()" style="position:absolute;top:14px;left:14px;padding:8px 16px;border:1px solid rgba(56,189,248,.4);border-radius:10px;background:rgba(10,20,40,.6);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← BITSTREAM</button>
      <div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.3em;color:#38bdf8">BITSTREAM VALLEY PRESENTS</div>
      <div style="font-family:'Anton',sans-serif;font-size:clamp(1.8rem,6vw,3.2rem);letter-spacing:.03em;background:linear-gradient(90deg,#7dd3fc,#a855f7,#fbbf24);-webkit-background-clip:text;background-clip:text;color:transparent">⛓️ BLOCK BUILDER</div>
      <div style="font-size:.85rem;color:rgba(255,255,255,.6);margin-top:-10px;text-align:center;max-width:560px">Become the Master Blockchain Architect. Build blocks, validate them, and defend the chain from hackers.</div>
      ${bestStars>0?`<div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.1em;color:#fbbf24;margin-top:-8px">BEST RATING EARNED: ${'★'.repeat(bestStars)}${'☆'.repeat(3-bestStars)}</div>`:''}
      <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:920px">
        ${LEVELS.map((Lv,i)=>{
          const locked=i>0 && bestLv<i;
          // bb_best is OUR OWN namespaced per-level score, safe to attribute to this specific card.
          // (gameStars/gameLevels are the shared, game-wide — not per-level — cvAwardGame convention,
          // so they're only used for the lock gate + the single "best rating ever" line above, never per-card.)
          const bestScore=s.bb_best && typeof s.bb_best[i]==='number' ? s.bb_best[i] : null;
          const scoreFooter = bestScore!=null ? `<div style="margin-top:8px;font-size:.5rem;color:rgba(255,255,255,.45)">PERSONAL BEST ${bestScore} PTS</div>` : '';
          return `<div onclick="${locked?'':'bbStartLevel('+i+')'}" style="width:250px;padding:20px 18px;border-radius:18px;border:1.5px solid ${locked?'rgba(255,255,255,.12)':Lv.col};background:linear-gradient(165deg,rgba(10,16,36,.95),rgba(4,8,20,.98));cursor:${locked?'default':'pointer'};text-align:center;position:relative;transition:transform .2s" ${locked?'':'onmouseover="this.style.transform=\'translateY(-4px)\'" onmouseout="this.style.transform=\'none\'"'}>
            <div style="font-size:2.3rem;margin-bottom:6px;filter:${locked?'grayscale(1) opacity(.4)':'none'}">${Lv.icon}</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:.82rem;letter-spacing:.08em;color:${locked?'rgba(255,255,255,.35)':Lv.col}">${Lv.name}</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.13em;color:rgba(255,255,255,.4);margin:5px 0 8px">${Lv.sub}</div>
            <div style="font-size:.72rem;line-height:1.5;color:rgba(255,255,255,${locked?'.3':'.65'})">${Lv.desc}</div>
            <div style="margin-top:10px;font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.1em;color:#fbbf24">${Lv.lanes} CHAIN${Lv.lanes>1?'S':''} · ${Lv.blocksGoal} BLOCKS TO WIN</div>
            ${locked?`<div style="position:absolute;top:10px;right:12px;font-size:1rem">🔒</div><div style="margin-top:8px;font-size:.55rem;color:rgba(255,255,255,.4)">Win ${LEVELS[i-1].name} to unlock</div>`:scoreFooter}
          </div>`;}).join('')}
      </div>
      <div style="max-width:640px;width:100%;background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.22);border-radius:14px;padding:12px 16px">
        <div style="font-family:'Orbitron',sans-serif;font-size:.46rem;letter-spacing:.16em;color:#7dd3fc;margin-bottom:8px">📖 GUARDIAN LOG · LIFETIME MILESTONES</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${MS.map(m=>`<div style="flex:1;min-width:150px;font-size:.68rem;color:rgba(255,255,255,.75)">${m[0]} ${m[1]}<br><b style="color:#fff">${m[2]}</b> <span style="color:rgba(255,255,255,.4)">/ ${m[3]}</span></div>`).join('')}
        </div>
      </div>
      <div style="font-size:.6rem;color:rgba(255,255,255,.35)">🎮 Tap ✅ valid transactions · avoid 🚩 fraud &amp; 👥 duplicates · tap 🐛 bugs twice to patch · grab power-ups!</div>
    </div>`;
  }

  /* ══════════════════════════ START A LEVEL ══════════════════════════ */
  window.bbStartLevel=function(li){
    LV=clamp(li,0,LEVELS.length-1);
    const ui=document.getElementById('bbUI'); if(!ui) return;
    ui.style.pointerEvents='none';
    ui.innerHTML=chromeHTML();
    reset();
    setTimeout(bbBoot,30);
  };

  function chromeHTML(){
    const cfg=L();
    return `<div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:10px;padding:10px 16px;background:linear-gradient(180deg,rgba(2,14,26,.9),transparent)">
        <button onclick="bbExit()" style="pointer-events:auto;padding:6px 13px;border:1px solid ${cfg.col}66;border-radius:9px;background:rgba(56,189,248,.1);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.56rem;letter-spacing:.1em;cursor:pointer">← BITSTREAM</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.14em;color:${cfg.col};flex:1;text-align:center">${cfg.icon} ${cfg.name} · LV ${LV+1}/3</div>
        <button onclick="bbMenu()" style="pointer-events:auto;padding:6px 10px;border:1px solid rgba(255,255,255,.2);border-radius:9px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.5rem;cursor:pointer">☰</button>
        <div id="bbTime" style="font-family:'Orbitron',sans-serif;font-size:.72rem;color:${cfg.col};min-width:40px;text-align:right">${cfg.round}s</div>
      </div>
      <div style="position:absolute;top:44px;left:0;right:0;z-index:5;display:flex;gap:6px;padding:0 16px;justify-content:center">
        ${hud('SCORE','bbScore','#7dd3fc')}${hud('BLOCKS','bbBlocks','#38bdf8')}${hud('STREAK','bbCombo','#fbbf24')}
      </div>
      <div style="position:absolute;top:100px;left:16px;right:16px;z-index:5">
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.12em;color:rgba(255,255,255,.55)"><span>CHAIN INTEGRITY</span><span id="bbIntTxt">100%</span></div>
        <div style="height:8px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid rgba(56,189,248,.25)"><div id="bbIntBar" style="height:100%;width:100%;background:linear-gradient(90deg,#38bdf8,#7dd3fc);transition:width .2s"></div></div>
        ${cfg.hasPower?`<div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.45);margin-top:3px"><span>GRID POWER</span><span id="bbPowTxt">100%</span></div><div style="height:5px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden;border:1px solid rgba(251,191,36,.2)"><div id="bbPowBar" style="height:100%;width:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);transition:width .2s"></div></div>`:''}
      </div>
      <div id="bbFact" style="position:absolute;left:50%;top:${CHROME_TOP+2}px;transform:translateX(-50%);z-index:6;max-width:82%;display:none;pointer-events:none"></div>
      <div id="bbGate" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(2,12,22,.86);backdrop-filter:blur(5px);padding:20px;pointer-events:auto"></div>
      <div id="bbEvent" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(2,12,22,.86);backdrop-filter:blur(5px);padding:20px;pointer-events:auto"></div>
      <div id="bbBoss" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(20,2,2,.72);backdrop-filter:blur(4px);padding:20px;pointer-events:auto"></div>
      <div id="bbOver" style="position:absolute;inset:0;z-index:10;display:none;align-items:center;justify-content:center;background:rgba(2,12,22,.84);backdrop-filter:blur(4px);pointer-events:auto"></div>`;
  }
  function hud(label,id,c){ return `<div style="flex:1;max-width:140px;text-align:center;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.18);border-radius:9px;padding:5px"><div style="font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.1em;color:rgba(255,255,255,.45)">${label}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:1.02rem;color:${c}">0</div></div>`; }

  /* ══════════════════════════ RESET / STATE ══════════════════════════ */
  function reset(){
    const cfg=L();
    const lanes=[];
    for(let i=0;i<cfg.lanes;i++){
      lanes.push({ id:i, label:'LANE '+String.fromCharCode(65+i), tiles:[], filled:0, chainCount:0,
        consensus:0, towerGlow:0, corruptT:0, spreadFlag:false, puzzle:null, spawnT:.4+Math.random()*.5, mistakesThisBlock:0 });
    }
    G={
      phase:'count', countT:2.4,
      lanes, hackers:[], parts:[], floats:[], code:[],
      time:cfg.round, score:0, blocksMined:0, blocksGoal:cfg.blocksGoal,
      integrity:100, combo:0, bestCombo:0, mistakes:0, collected:0,
      shieldT:0, validatorT:0, dupDefT:0, freezeT:0, overclockT:0, contractCharges:0,
      power: cfg.hasPower?100:0,
      gateT:GATE_EVERY, gateIdx:0, facts:shuffle(FACTS.slice(LV*4,LV*4+4)),
      eventT: (cfg.hasContracts||cfg.hasVote)?32:Infinity,
      corruptClock: cfg.corruptEvery, hackerClock: 3+Math.random()*2,
      bossActive:false, bossStep:0, bossTargets:[],
      shake:0, flash:0, flashColor:'#38bdf8',
      last:0, w:0, h:0
    };
    for(let i=0;i<24;i++){ G.code.push({x:Math.random(),y:Math.random(),sp:.05+Math.random()*.18,ch:rch(),al:.04+Math.random()*.1}); }
  }

  /* ══════════════════════════ BOOT / INPUT ══════════════════════════ */
  function bbBoot(){
    const cv=document.getElementById('bbCanvas'); if(!cv||!G) return;
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);
    const hit=(clientX,clientY)=>{ const r=cv.getBoundingClientRect(); tapAt((clientX-r.left)/r.width,(clientY-r.top),r.width,r.height); };
    const md=e=>{ hit(e.clientX,e.clientY); };
    const ts=e=>{ if(e.touches[0]){ hit(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); } };
    cv.addEventListener('mousedown',md);
    cv.addEventListener('touchstart',ts,{passive:false});
    G._cleanup=()=>{ window.removeEventListener('resize',size); cv.removeEventListener('mousedown',md); cv.removeEventListener('touchstart',ts); };
    G.last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  /* nx: 0..1 across width · pxY: RAW pixel y (not normalized) · W,H: css px size */
  function laneBand(i,count,H){ const top=CHROME_TOP, bot=H-BOTTOM_PAD, bandH=(bot-top)/count; return {y0:top+i*bandH, y1:top+(i+1)*bandH, h:bandH}; }
  function laneOf(pxY,H){ const cfg=L(); for(let i=0;i<cfg.lanes;i++){ const b=laneBand(i,cfg.lanes,H); if(pxY>=b.y0&&pxY<b.y1) return i; } return -1; }

  function tapAt(nx,pxY,W,H){
    if(!G || G.phase!=='play') return;   // gate/event/boss/over overlays capture their own clicks (pointer-events:auto)
    const li=laneOf(pxY,H); if(li<0) return;
    const lane=G.lanes[li];
    // 1) puzzle chips take priority while this lane awaits validation
    if(lane.puzzle){
      const b=laneBand(li,L().lanes,H);
      const seg=W/3, idx=Math.floor(nx*3);
      if(pxY>=b.y0+b.h*.28 && pxY<=b.y0+b.h*.82 && idx>=0 && idx<3){ resolvePuzzle(lane,idx); return; }
    }
    // 2) corrupted chain zone (left third of the lane) → repair tap
    if(lane.corruptT>0 && nx<0.30){ repairLane(lane); return; }
    // 3) hackers drifting through this lane → zap
    for(let i=G.hackers.length-1;i>=0;i--){ const hk=G.hackers[i]; if(hk.lane!==li||hk.dead) continue;
      const hx=hk.x*W, hy=(b0(li,H).y0+b0(li,H).h*.5);
      if(Math.abs(hx-nx*W)<28 && Math.abs(hy-pxY)<b0(li,H).h*.4){ zapHacker(hk); return; }
    }
    // 4) scrolling transaction tiles in this lane
    const b=laneBand(li,L().lanes,H);
    for(let i=lane.tiles.length-1;i>=0;i--){
      const it=lane.tiles[i]; if(it.dead) continue;
      const tx=it.x*W, ty=b.y0+b.h*.62;
      const halfW=Math.min(78,W*.115), halfH=Math.min(b.h*.30,CARD_H_MAX*0.6);
      if(nx*W>=tx-halfW && nx*W<=tx+halfW && Math.abs(pxY-ty)<halfH){ hitTile(lane,it); return; }
    }
  }
  function b0(i,H){ return laneBand(i,L().lanes,H); }

  function hitTile(lane,it){
    if(it.kind==='power'){ collectPower(lane,it); it.dead=1; return; }
    if(it.kind==='valid'){
      G.combo++; G.bestCombo=Math.max(G.bestCombo,G.combo); lane.filled++;
      const mult=1+Math.floor(G.combo/4), rushBonus=it.expT!=null?1.4:1;
      const gain=Math.round(10*mult*rushBonus*(G.validatorT>0?1.5:1)*(G.overclockT>0?1.5:1));
      G.score+=gain;
      burst(it.x,it.y,'#22d3ee',10+Math.min(12,G.combo));
      floatTxt(it.x,it.y,'+'+gain,'#a5f3fc');
      if(L().hasConsensus){ lane.consensus=clamp(lane.consensus+6,0,100); }
      it.dead=1;
      if(lane.filled>=TXN_PER_BLOCK) startPuzzle(lane);
      return;
    }
    if(it.kind==='bug'){
      it.fixes=(it.fixes||0)+1;
      if(it.fixes>=2){ it.kind='valid'; it.e='✅'; burst(it.x,it.y,'#a3e635',10); floatTxt(it.x,it.y,'FIXED!','#bef264'); }
      else { burst(it.x,it.y,'#c084fc',6); floatTxt(it.x,it.y,'patching…','#e9d5ff'); }
      return;
    }
    // fraud or duplicate — always a mistake to tap
    if(G.shieldT>0){ floatTxt(it.x,it.y,'BLOCKED 🛡️','#7dd3fc'); burst(it.x,it.y,'#7dd3fc',12); it.dead=1; return; }
    G.combo=0; G.mistakes++; lane.mistakesThisBlock=(lane.mistakesThisBlock||0)+1; G.integrity=clamp(G.integrity-16,0,100);
    G.score=Math.max(0,G.score-24); G.shake=.4; G.flash=.35; G.flashColor='#ef4444';
    burst(it.x,it.y,'#ef4444',14); floatTxt(it.x,it.y,(it.kind==='dup'?'DUPLICATE! -24':'INVALID! -24'),'#fca5a5');
    it.dead=1;
  }

  /* ══════════════════════════ VALIDATION PUZZLE (hash-match) ══════════ */
  function startPuzzle(lane){
    const ans=Math.floor(Math.random()*3);
    const target=[0,1,2,3].map(()=>HASH_SYMS[Math.floor(Math.random()*HASH_SYMS.length)]);
    const opts=[target];
    while(opts.length<3){
      const cand=target.slice(); const k=Math.floor(Math.random()*4);
      cand[k]=HASH_SYMS[Math.floor(Math.random()*HASH_SYMS.length)];
      if(cand.join('')!==target.join('')) opts.push(cand);
    }
    // shuffle so the correct pattern isn't always slot 0
    const order=shuffle([0,1,2]); const shown=order.map(i=>opts[i]);
    lane.puzzle={ target, opts:shown, ans:order.indexOf(0), t:5.5 };
    if(G.validatorT>0){ resolvePuzzle(lane,lane.puzzle.ans); }
  }
  function resolvePuzzle(lane,idx){
    if(!lane.puzzle) return;
    const ok=idx===lane.puzzle.ans;
    lane.puzzle=null;
    if(ok){
      if(L().hasConsensus) lane.consensus=clamp(lane.consensus+26,0,100);
      G.score+=60; G.flash=.35; G.flashColor='#38bdf8';
      floatTxt(.5,.16+lane.id*0.001,'✅ HASHED & LINKED','#7dd3fc');
    } else {
      if(L().hasConsensus) lane.consensus=clamp(lane.consensus-15,0,100);
      G.integrity=clamp(G.integrity-8,0,100); G.shake=Math.max(G.shake,.3);
      floatTxt(.5,.2,'⚡ HASH MISMATCH','#f87171');
    }
    mineBlock(lane, ok);
  }

  function mineBlock(lane, wasClean){
    lane.filled=0; lane.chainCount++; G.blocksMined++;
    if(wasClean && lane.mistakesThisBlock===0){ bumpStat('perfectBlocks'); }
    lane.mistakesThisBlock=0;
    const bonus=70+G.combo*3;
    G.score+=bonus; G.integrity=clamp(G.integrity+5,0,100);
    G.shake=Math.max(G.shake,.28); G.flash=.4; G.flashColor='#38bdf8';
    floatTxt(.5,.5,'⛏️ BLOCK MINED +'+bonus,'#7dd3fc');
    for(let i=0;i<18;i++){ const a=Math.random()*7,s=.2+Math.random()*.55;
      G.parts.push({x:.06+lane.id*0.02,y:0.5,vx:Math.cos(a)*s,vy:Math.sin(a)*s-.3,s:2+Math.random()*3,c:i%2?'#38bdf8':'#a5f3fc',life:.6+Math.random()*.3,max:.9}); }
    if(L().hasConsensus && lane.consensus>=100){ lane.consensus=0; lane.towerGlow=1; G.score+=30; floatTxt(.5,.3,'🗳️ CONSENSUS REACHED +30','#c4b5fd'); }
    if(G.blocksMined>=G.blocksGoal-1 && G.blocksMined<G.blocksGoal && !G.bossActive){ triggerBoss(); return; }
    if(G.blocksMined>=G.blocksGoal){ end(true); return; }
    G.gateT-=6; // completing a block nudges the next Knowledge Gate a little closer
  }

  /* ══════════════════════════ POWER-UPS ══════════════════════════ */
  function collectPower(lane,it){
    G.collected++;
    burst(it.x,it.y,'#fbbf24',14); floatTxt(it.x,it.y,it.name,'#fde68a'); G.flash=.3; G.flashColor='#fbbf24';
    applyPowerup(it.key);
  }
  function applyPowerup(key){
    switch(key){
      case 'shield': G.shieldT=20; break;
      case 'validator': G.validatorT=12; break;
      case 'dupdef': G.dupDefT=16; break;
      case 'freeze': G.freezeT=10; break;
      case 'overclock': G.overclockT=14; break;
      case 'firewall': G.hackers.forEach(h=>{ if(!h.dead){ h.dead=1; burst(h.x,h.y,'#f87171',10); G.score+=15; } }); break;
      case 'nodeboost': if(L().hasConsensus) G.lanes.forEach(ln=>{ ln.consensus=clamp(ln.consensus+40,0,100); }); break;
      case 'quantum': { let best=null; G.lanes.forEach(ln=>{ if(ln.filled<TXN_PER_BLOCK && (!best||ln.filled>best.filled)) best=ln; });
        if(best){ best.filled=TXN_PER_BLOCK; startPuzzle(best); if(best.puzzle) resolvePuzzle(best,best.puzzle.ans); } break; }
      case 'contractacc': G.contractCharges=(G.contractCharges||0)+1; break;
      case 'repair': G.lanes.forEach(ln=>{ if(ln.corruptT>0){ ln.corruptT=0; burst(.15+ln.id*0.02,.5,'#34d399',12); } }); break;
    }
  }

  /* ══════════════════════════ HACKERS & CORRUPTION ══════════════════════ */
  function zapHacker(hk){ hk.dead=1; burst(hk.x,hk.y,'#f87171',12); floatTxt(hk.x,hk.y,'ZAPPED!','#fca5a5'); G.score+=18; bumpStat('hackersStopped'); }
  function spawnHacker(){
    const cfg=L(); if(!cfg.hasHackers) return;
    const lane=Math.floor(Math.random()*cfg.lanes);
    G.hackers.push({lane,x:1.08,vx:-(0.05+Math.random()*0.04),y:0,dead:0,icon:'👾'});
  }
  function triggerCorruption(lane){
    if(!lane || lane.corruptT>0 || lane.chainCount<=0) return;
    lane.corruptT=L().corruptMax;
  }
  function repairLane(lane){
    lane.corruptT=0; burst(.12+lane.id*0.02,.5,'#34d399',14); floatTxt(.18,.15+lane.id*0.001,'🔧 REPAIRED','#86efac'); G.score+=20;
  }
  function corruptionFail(lane){
    lane.corruptT=0; lane.chainCount=Math.max(0,lane.chainCount-1);
    G.integrity=clamp(G.integrity-14,0,100); G.shake=Math.max(G.shake,.4); G.flash=.4; G.flashColor='#ef4444';
    floatTxt(.5,.45,'💥 BLOCK COLLAPSED','#fca5a5');
    if(L().spreadOnFail){
      const cfg=L(); const nxt=G.lanes[(lane.id+1)%cfg.lanes];
      if(nxt && nxt!==lane && nxt.corruptT<=0 && nxt.chainCount>0) triggerCorruption(nxt);
    }
  }

  /* ══════════════════════════ MAIN LOOP ══════════════════════════ */
  function loop(now){
    const cv=document.getElementById('bbCanvas');
    if(!cv||!G){ cancelAnimationFrame(raf); return; }
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    G.w=W; G.h=H;
    let dt=Math.min(.04,(now-G.last)/1000); G.last=now;
    if(G.phase==='count'){ G.countT-=dt; if(G.countT<=0) G.phase='play'; }
    else if(G.phase==='play'){ update(dt,W,H); }
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  function update(dt,W,H){
    const cfg=L();
    G.time-=dt; if(G.time<=0){ G.time=0; end(false); return; }
    const tEl=document.getElementById('bbTime'); if(tEl) tEl.textContent=Math.ceil(G.time)+'s';
    const prog=1-(G.time/cfg.round);
    const slow=(cfg.hasPower && G.power<=0) ? .55 : 1;

    // Knowledge Gate (global pause, full educational beat)
    G.gateT-=dt; if(G.gateT<=0){ openGate(); return; }
    // Smart Contract / Network Split special events (L3)
    if(cfg.hasContracts||cfg.hasVote){ G.eventT-=dt; if(G.eventT<=0){ openEvent(); return; } }

    // per-lane spawn + tile movement
    G.lanes.forEach(lane=>{
      if(lane.puzzle){ lane.puzzle.t-=dt; if(lane.puzzle.t<=0){ resolvePuzzle(lane, -1); } return; }
      lane.spawnT-=dt*slow;
      if(lane.spawnT<=0){
        // Base/ramp/floor raised (was 0.95/0.35/0.5): a tile takes ~8s+ to cross the
        // full lane at its scroll speed (vx), so the old interval let a new card spawn
        // long before the previous one cleared its own width — cards piled up into an
        // overlapping conga-line, worst at L3 (lowest spawnMul) within ~7s of level start.
        lane.spawnT=Math.max(1.0,(2.0-prog*0.6)*cfg.spawnMul)*(G.overclockT>0?0.6:1);
        spawnTile(lane,prog);
      }
      for(const it of lane.tiles){
        if(it.expT!=null){ it.expT-=dt; if(it.expT<=0 && it.kind==='valid'){ it.kind='dup'; it.e='⏳'; it.t='Expired!'; it.expT=null; } }
        it.x+=it.vx*dt*slow;
        if(it.x>1.14){
          if(it.kind==='valid'){ G.combo=0; }
          else if((it.kind==='fraud'||it.kind==='dup') && Math.random()<0.35){
            showFact(it.kind==='fraud' ? '⚠️ Fraud dodged — letting bad transactions scroll off keeps the chain clean!' : '👥 Duplicate avoided — one copy of a transaction is enough!');
          }
          it.dead=1;
        }
      }
      lane.tiles=lane.tiles.filter(t=>!t.dead);
      if(lane.towerGlow>0) lane.towerGlow-=dt*1.4;
    });

    // hackers
    if(cfg.hasHackers){
      G.hackerClock-=dt*(G.freezeT>0?0:1);
      if(G.hackerClock<=0){ G.hackerClock=Math.max(2.2,4.5-prog*2.2); spawnHacker(); }
      G.hackers.forEach(hk=>{
        if(hk.dead) return;
        if(G.freezeT<=0) hk.x+=hk.vx*dt*slow;
        if(hk.x<=0.10){ hk.dead=1; triggerCorruption(G.lanes[hk.lane]); }
      });
      G.hackers=G.hackers.filter(h=>!h.dead);
    }

    // corruption timers
    G.lanes.forEach(lane=>{
      if(lane.corruptT>0){ if(G.freezeT<=0) lane.corruptT-=dt; if(lane.corruptT<=0) corruptionFail(lane); }
    });
    if(!cfg.hasHackers){ // L1: pure timer-driven Mini Virus Bot corruption
      G.corruptClock-=dt; if(G.corruptClock<=0){
        G.corruptClock=cfg.corruptEvery;
        const cand=G.lanes.filter(l=>l.corruptT<=0 && l.chainCount>0);
        if(cand.length) triggerCorruption(cand[Math.floor(Math.random()*cand.length)]);
      }
    }

    // grid power (L3)
    if(cfg.hasPower){ G.power=clamp(G.power-dt*1.6+ (G.combo>0?dt*0.4:0),0,100);
      const pb=document.getElementById('bbPowBar'); if(pb){ pb.style.width=G.power+'%'; pb.style.background=G.power<30?'linear-gradient(90deg,#ef4444,#f87171)':'linear-gradient(90deg,#f59e0b,#fbbf24)'; }
      const pt=document.getElementById('bbPowTxt'); if(pt) pt.textContent=Math.round(G.power)+'%';
    }

    // timers
    if(G.shieldT>0) G.shieldT-=dt; if(G.validatorT>0) G.validatorT-=dt; if(G.dupDefT>0) G.dupDefT-=dt;
    if(G.freezeT>0) G.freezeT-=dt; if(G.overclockT>0) G.overclockT-=dt;
    if(G.shake>0) G.shake-=dt; if(G.flash>0) G.flash-=dt;

    // particles/floats/matrix
    for(const p of G.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=1.4*dt; p.life-=dt; }
    G.parts=G.parts.filter(p=>p.life>0);
    for(const f of G.floats){ f.y-=dt*0.09; f.life-=dt; }
    G.floats=G.floats.filter(f=>f.life>0);
    for(const c of G.code){ c.y+=c.sp*dt; if(c.y>1.05){ c.y=-.05; c.x=Math.random(); c.ch=rch(); } if(Math.random()<0.02) c.ch=rch(); }

    // HUD sync
    setTxt('bbScore',G.score); setTxt('bbBlocks',G.blocksMined+'/'+G.blocksGoal); setTxt('bbCombo','x'+G.combo);
    const ib=document.getElementById('bbIntBar'); if(ib){ ib.style.width=G.integrity+'%'; ib.style.background=G.integrity<35?'linear-gradient(90deg,#ef4444,#f87171)':'linear-gradient(90deg,#38bdf8,#7dd3fc)'; }
    const it2=document.getElementById('bbIntTxt'); if(it2) it2.textContent=Math.round(G.integrity)+'%';

    if(G.integrity<=0){ end(false); return; }
  }

  function spawnTile(lane,prog){
    const cfg=L();
    const roll=Math.random();
    const powPool=powerupPool();
    const powChance=.045-LV*0.006;
    const fraudChance=(cfg.fraudBase+prog*cfg.fraudRamp)*(G.overclockT>0?1.5:1);
    const dupChance=cfg.dupRate*(G.dupDefT>0?0:1);
    const bugChance=cfg.bugRate;
    let acc=0;
    if(roll<(acc+=powChance)){ const p=powPool[Math.floor(Math.random()*powPool.length)];
      lane.tiles.push({x:-.08,y:0,vx:.14+Math.random()*.05,kind:'power',key:p.key,name:p.name,e:p.icon,t:p.name}); return; }
    if(roll<(acc+=fraudChance)){ const f=FRAUD[Math.floor(Math.random()*FRAUD.length)];
      lane.tiles.push({x:-.08,y:0,vx:.15+prog*.12,kind:'fraud',e:'🚩',t:f.t}); return; }
    if(roll<(acc+=dupChance)){ const d=DUP[Math.floor(Math.random()*DUP.length)];
      lane.tiles.push({x:-.08,y:0,vx:.15+prog*.12,kind:'dup',e:'👥',t:d.t}); return; }
    if(roll<(acc+=bugChance)){ const bg=BUG[Math.floor(Math.random()*BUG.length)];
      lane.tiles.push({x:-.08,y:0,vx:.13+prog*.10,kind:'bug',e:'🐛',t:bg.t,fixes:0}); return; }
    const v=VALID[Math.floor(Math.random()*VALID.length)];
    const expiring=Math.random()<0.16;
    lane.tiles.push({x:-.08,y:0,vx:.15+prog*.13,kind:'valid',e:expiring?'⏱️':'✅',t:v.t,expT:expiring?(2.6-prog*0.8):null});
  }

  /* ══════════════════════════ RENDER ══════════════════════════ */
  const _bbStars=Array.from({length:36},()=>({x:Math.random(),y:Math.random(),r:Math.random()*0.9+0.2,s:Math.random()*0.4+0.15}));
  function _bbBg(ctx,W,H,now){
    const cfg=L();
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#020c14'); bg.addColorStop(0.5,'#030e1c'); bg.addColorStop(1,'#050f1a');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    const t=now/1000;
    for(const st of _bbStars){ const tw=0.3+0.4*Math.sin(t*st.s+st.x*6.28); ctx.globalAlpha=tw*0.5; ctx.fillStyle=cfg.col; ctx.beginPath(); ctx.arc(st.x*W,st.y*H*0.5,st.r,0,6.28); ctx.fill(); }
    ctx.globalAlpha=1;
    const tg=ctx.createRadialGradient(W/2,0,0,W/2,0,W*0.7);
    tg.addColorStop(0,cfg.colDim); tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg; ctx.fillRect(0,0,W,H);
  }

  function render(ctx,W,H,now){
    if(!G) return;
    _bbBg(ctx,W,H,now);
    let ox=0,oy=0; if(G.shake>0){ ox=(Math.random()-.5)*G.shake*22; oy=(Math.random()-.5)*G.shake*22; }
    ctx.save(); ctx.translate(ox,oy);

    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font="13px 'Orbitron',monospace";
    for(const c of G.code){ ctx.globalAlpha=c.al; ctx.fillStyle=L().col; ctx.fillText(c.ch,c.x*W,c.y*H); }
    ctx.globalAlpha=1;

    if(G.flash>0){ const a=G.flash*0.26; ctx.fillStyle=hexA(G.flashColor,a); ctx.fillRect(0,0,W,H); }

    const cfg=L();
    for(let i=0;i<cfg.lanes;i++) renderLane(ctx,G.lanes[i],i,cfg.lanes,W,H,now);

    // hackers (drawn above lanes)
    ctx.textAlign='center'; ctx.textBaseline='middle';
    G.hackers.forEach(hk=>{ if(hk.dead) return; const b=laneBand(hk.lane,cfg.lanes,H); const x=hk.x*W, y=b.y0+b.h*.5;
      const pulse=0.6+0.4*Math.sin(now*0.008); ctx.save(); ctx.shadowColor='#ef4444'; ctx.shadowBlur=14*pulse;
      ctx.font=(b.h*0.42)+'px serif'; ctx.fillText(hk.icon,x,y); ctx.restore(); });

    // particles
    for(const p of G.parts){ ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); }
    ctx.globalAlpha=1;

    // floats
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const f of G.floats){ ctx.globalAlpha=Math.max(0,f.life/0.9); ctx.fillStyle=f.c; ctx.font='800 '+(f.big?20:14)+"px 'Inter',sans-serif"; ctx.fillText(f.t,f.x*W,f.y*H); }
    ctx.globalAlpha=1;

    // power-up indicators (bottom-left)
    ctx.textAlign='left'; ctx.font="10px 'Orbitron',sans-serif";
    let iy=H-16; const ind=[['shield',G.shieldT,'🛡️'],['validator',G.validatorT,'⚡'],['dupdef',G.dupDefT,'🧯'],['freeze',G.freezeT,'❄️'],['overclock',G.overclockT,'🚀']];
    ind.forEach(([k,v,ic])=>{ if(v>0){ ctx.fillStyle='#fbbf24'; ctx.fillText(ic+' '+Math.ceil(v)+'s',10,iy); iy-=13; } });

    // countdown
    if(G.phase==='count'){
      ctx.fillStyle='rgba(2,10,20,.45)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fbbf24'; ctx.font="900 64px 'Anton',sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(G.countT>0.5?String(Math.ceil(G.countT-0.5)):'GO!',W/2,H/2);
    }

    ctx.restore();
  }

  function renderLane(ctx,lane,idx,count,W,H,now){
    const cfg=L(); const b=laneBand(idx,count,H);
    // band background
    ctx.fillStyle=idx%2? 'rgba(255,255,255,.015)':'rgba(255,255,255,.03)'; ctx.fillRect(0,b.y0,W,b.h);
    ctx.strokeStyle='rgba(255,255,255,.06)'; ctx.beginPath(); ctx.moveTo(0,b.y0); ctx.lineTo(W,b.y0); ctx.stroke();
    // lane label
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.font="9px 'Orbitron',sans-serif"; ctx.fillStyle='rgba(255,255,255,.4)';
    ctx.fillText(lane.label,8,b.y0+10);

    // mini chain (pseudo-3D cubes) — far left
    const cs=Math.min(b.h*0.34,20), gap=cs*0.5, cy=b.y0+b.h*0.62;
    const shown=Math.min(lane.chainCount,4);
    for(let i=0;i<shown;i++){
      const cx=14+i*(cs+gap);
      if(i>0){ ctx.save(); ctx.shadowColor=cfg.col; ctx.shadowBlur=8; ctx.strokeStyle=cfg.col+'99'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-(cs+gap)+cs*0.5,cy); ctx.lineTo(cx-cs*0.5,cy); ctx.stroke(); ctx.restore(); }
      draw3DCube(ctx,cx,cy,cs, lane.corruptT>0 ? '#ef4444' : cfg.col, lane.corruptT>0);
    }
    if(lane.chainCount>4){ ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font="10px 'Anton',sans-serif"; ctx.textAlign='left'; ctx.fillText('+'+(lane.chainCount-4), 14+4*(cs+gap), cy); }
    if(lane.corruptT>0){
      ctx.save(); ctx.globalAlpha=0.55+0.35*Math.sin(now*0.02);
      ctx.strokeStyle='#fca5a5'; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(14,cy-cs); ctx.lineTo(20,cy); ctx.lineTo(12,cy+2); ctx.lineTo(22,cy+cs);
      ctx.stroke(); ctx.restore();
      ctx.fillStyle='#fca5a5'; ctx.font="8px 'Orbitron',sans-serif"; ctx.textAlign='left'; ctx.fillText('TAP TO REPAIR!',14,b.y0+b.h-6);
    }
    if(cfg.hasConsensus){
      const barX=14, barW=Math.min(80,W*0.16), barY=b.y0+b.h-10;
      ctx.fillStyle='rgba(255,255,255,.08)'; ctx.fillRect(barX,barY,barW,4);
      ctx.fillStyle= lane.towerGlow>0?'#fbbf24':'#c4b5fd'; ctx.fillRect(barX,barY,barW*(lane.consensus/100),4);
    }

    // building slots — right edge
    const slotN=TXN_PER_BLOCK, scw=Math.min(b.h*0.30,18), sgap=scw*0.35;
    const totalW=slotN*scw+(slotN-1)*sgap, sx0=W-16-totalW;
    for(let i=0;i<slotN;i++){
      const sx=sx0+i*(scw+sgap), sy=b.y0+b.h*0.62, filled=i<lane.filled;
      ctx.save();
      if(filled){ ctx.shadowColor=cfg.col; ctx.shadowBlur=10; const g=ctx.createLinearGradient(0,sy-scw/2,0,sy+scw/2); g.addColorStop(0,'#bae6fd'); g.addColorStop(1,cfg.col); ctx.fillStyle=g; ctx.strokeStyle='#fff'; }
      else { ctx.fillStyle='rgba(255,255,255,.05)'; ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.setLineDash([3,3]); }
      ctx.lineWidth=1.4; rr(ctx,sx-scw/2,sy-scw/2,scw,scw,4); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font="7px 'Orbitron',sans-serif"; ctx.textAlign='center';
    ctx.fillText(lane.filled+'/'+slotN, sx0+totalW/2, b.y0+b.h*0.86);

    // scrolling tiles
    for(const it of lane.tiles) drawTile(ctx,it,b,W,now);

    // validation puzzle chips
    if(lane.puzzle){
      ctx.save(); ctx.fillStyle='rgba(2,10,20,.55)'; ctx.fillRect(0,b.y0,W,b.h);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle=cfg.col; ctx.font="8px 'Orbitron',sans-serif"; ctx.fillText('MATCH THE HASH: '+lane.puzzle.target.join(' '),W/2,b.y0+b.h*0.20);
      for(let i=0;i<3;i++){
        const segW=W/3, cx=segW*i+segW/2, cy0=b.y0+b.h*0.55, w=Math.min(segW*0.8,150), h=Math.min(b.h*0.4,CARD_H_MAX);
        const opt=lane.puzzle.opts[i];
        ctx.shadowColor=cfg.col; ctx.shadowBlur=8; ctx.fillStyle='rgba(56,189,248,.14)'; ctx.strokeStyle=cfg.col; ctx.lineWidth=1.4;
        rr(ctx,cx-w/2,cy0-h/2,w,h,8); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
        ctx.fillStyle='#fff'; ctx.font=(h*0.4)+'px monospace'; ctx.fillText(opt.join(' '),cx,cy0);
      }
      ctx.restore();
    }
  }

  function draw3DCube(ctx,cx,cy,s,col,corrupt){
    const half=s/2, depth=s*0.32;
    ctx.save();
    if(corrupt) ctx.globalAlpha=0.6+0.3*Math.sin(performance.now()*0.02);
    ctx.shadowColor=col; ctx.shadowBlur=8;
    // top face
    ctx.fillStyle=hexA(col,.85); ctx.beginPath();
    ctx.moveTo(cx-half,cy-half); ctx.lineTo(cx,cy-half-depth*0.5); ctx.lineTo(cx+half,cy-half); ctx.lineTo(cx,cy-half+depth*0.5); ctx.closePath(); ctx.fill();
    // front face
    ctx.fillStyle=hexA(col,.55); ctx.fillRect(cx-half,cy-half,s,s);
    // side face
    ctx.fillStyle=hexA(col,.35); ctx.beginPath();
    ctx.moveTo(cx+half,cy-half); ctx.lineTo(cx+half+depth*0.4,cy-half+depth*0.25); ctx.lineTo(cx+half+depth*0.4,cy+half+depth*0.25); ctx.lineTo(cx+half,cy+half); ctx.closePath(); ctx.fill();
    ctx.shadowBlur=0; ctx.strokeStyle=hexA(col,.9); ctx.lineWidth=1; ctx.strokeRect(cx-half,cy-half,s,s);
    ctx.restore();
  }

  function drawTile(ctx,it,b,W,now){
    const x=it.x*W, y=b.y0+b.h*.62, w=Math.min(W*.20,150), h=Math.min(b.h*0.5,CARD_H_MAX);
    let col,glow,txtc;
    if(it.kind==='valid'){ col='rgba(34,211,238,.16)'; glow='#22d3ee'; txtc='#a5f3fc'; }
    else if(it.kind==='fraud'){ col='rgba(239,68,68,.16)'; glow='#ef4444'; txtc='#fca5a5'; }
    else if(it.kind==='dup'){ col='rgba(217,119,6,.16)'; glow='#f59e0b'; txtc='#fde68a'; }
    else if(it.kind==='bug'){ col='rgba(168,85,247,.16)'; glow='#a855f7'; txtc='#e9d5ff'; }
    else { col='rgba(251,191,36,.2)'; glow='#fbbf24'; txtc='#fde68a'; }
    const pulse=(it.kind!=='valid')?(0.6+0.4*Math.sin(now*0.006)):1;
    ctx.save();
    ctx.shadowColor=glow; ctx.shadowBlur=(it.kind==='valid'?9:16)*pulse;
    ctx.fillStyle=col; ctx.strokeStyle=glow; ctx.lineWidth=1.4;
    rr(ctx,x-w/2,y-h/2,w,h,8); ctx.fill(); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.font=(h*0.6)+'px serif';
    ctx.fillText(it.e,x-w/2+7,y);
    ctx.fillStyle=txtc; ctx.font="700 "+Math.max(9,h*0.26)+"px 'Inter',sans-serif";
    ctx.fillText(it.t,x-w/2+7+h*0.7,y);
    if(it.expT!=null){ ctx.strokeStyle='#fde68a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x+w/2-9,y-h/2+9,5,0,6.283*(it.expT/2.6)); ctx.stroke(); }
    ctx.restore();
  }

  // helpers
  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function hexA(hex,a){ const h=hex.replace('#',''); const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }
  function burst(x,y,c,n){ for(let i=0;i<n;i++){ const a=Math.random()*7,s=.15+Math.random()*.5; G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-.2,s:2+Math.random()*3,c,life:.5+Math.random()*.3,max:.8}); } }
  function floatTxt(x,y,t,c){ G.floats.push({x,y,t,c,life:.9,big:/MINED|STREAK|MASTER/.test(t)}); }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
  function showFact(txt){ const el=document.getElementById('bbFact'); if(!el||!txt) return;
    el.style.display='block';
    el.innerHTML=`<div style="background:rgba(2,12,22,.82);border:1px solid rgba(56,189,248,.6);border-radius:12px;padding:8px 15px;font-size:.76rem;color:#fff;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.5)">${txt}</div>`;
    clearTimeout(window._bbFactT); window._bbFactT=setTimeout(()=>{ const e=document.getElementById('bbFact'); if(e) e.style.display='none'; },2200);
  }
  function bumpStat(k){ if(!window.state) return; state.bb_stats=state.bb_stats||{blocksMined:0,hackersStopped:0,perfectBlocks:0,contractsWon:0}; state.bb_stats[k]=(state.bb_stats[k]||0)+1; }

  /* ══════════════════════════ KNOWLEDGE GATE ══════════════════════════ */
  function openGate(){
    if(!G||G.phase!=='play') return;
    if(G.gateIdx>=G.facts.length){ G.gateT=GATE_EVERY; return; }
    G.phase='gate';
    const f=G.facts[G.gateIdx]; G.gateIdx++;
    const o=document.getElementById('bbGate'); if(!o){ G.phase='play'; G.gateT=GATE_EVERY; return; }
    o.style.display='flex';
    o.innerHTML=`<div style="max-width:440px;text-align:center;padding:28px 24px;border:1px solid ${L().col};border-radius:22px;background:linear-gradient(160deg,rgba(5,30,48,.97),rgba(3,16,25,.97));box-shadow:0 0 50px ${L().colDim};animation:bbGateIn .35s ease">
      <style>@keyframes bbGateIn{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}</style>
      <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.2em;color:#7dd3fc;margin-bottom:10px">⛓️ KNOWLEDGE GATE · ${L().name} · LV ${LV+1}</div>
      <div style="font-size:2.3rem;margin-bottom:8px">${f[0]}</div>
      <p style="font-size:1rem;line-height:1.5;color:#fff;margin:0 0 18px">${f[1]}</p>
      <button onclick="bbGateGo()" style="padding:13px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#38bdf8,#0ea5e9);color:#031019;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.12em;font-weight:900;cursor:pointer">GOT IT → +40</button>
    </div>`;
  }
  window.bbGateGo=function(){ if(!G) return; G.score+=40; G.integrity=clamp(G.integrity+4,0,100); G.gateT=GATE_EVERY; G.phase='play';
    const o=document.getElementById('bbGate'); if(o){ o.style.display='none'; o.innerHTML=''; }
    G.flash=.3; G.flashColor='#38bdf8'; floatTxt(.5,.4,'+40 LEARNED','#7dd3fc');
    if(G.last!=null) G.last=performance.now();
  };

  /* ══════════════════════════ SMART CONTRACT / NETWORK-SPLIT EVENTS ═══ */
  function openEvent(){
    if(!G||G.phase!=='play') return;
    const cfg=L(); G.phase='event';
    const doVote = cfg.hasVote && (!cfg.hasContracts || Math.random()<0.5);
    const o=document.getElementById('bbEvent'); if(!o){ G.phase='play'; G.eventT=32; return; }
    o.style.display='flex';
    if(doVote){
      const majA=Math.random()<0.5;
      const dots=majA?['A','A','B']:['A','B','B']; const correct=majA?'A':'B';
      G._eventAns=correct;
      o.innerHTML=`<div style="max-width:440px;text-align:center;padding:26px 24px;border:1px solid #a855f7;border-radius:22px;background:linear-gradient(160deg,rgba(30,10,48,.97),rgba(16,4,25,.97));box-shadow:0 0 50px rgba(168,85,247,.4)">
        <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.2em;color:#d8b4fe;margin-bottom:10px">🌐 NETWORK SPLIT — VALIDATOR NODES VOTE</div>
        <div style="font-size:1.7rem;margin-bottom:10px;letter-spacing:.3em">${dots.map(d=>d==='A'?'🟣':'🟡').join(' ')}</div>
        <p style="font-size:.9rem;color:#fff;margin:0 0 16px">Which option is the <b>MAJORITY</b>? Decentralization means the network follows the vote most nodes agree on.</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="bbEventAnswer('A')" style="padding:12px 26px;border:none;border-radius:12px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-family:'Orbitron',sans-serif;font-size:.68rem;font-weight:900;cursor:pointer">🟣 OPTION A</button>
          <button onclick="bbEventAnswer('B')" style="padding:12px 26px;border:none;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#1a0d00;font-family:'Orbitron',sans-serif;font-size:.68rem;font-weight:900;cursor:pointer">🟡 OPTION B</button>
        </div>
      </div>`;
    } else {
      const templates=[
        ()=>({q:'Chain Integrity ≥ 50%',now:G.integrity, cur:Math.round(G.integrity)+'%', thresh:50}),
        ()=>({q:'Score ≥ 500 points',now:G.score, cur:G.score, thresh:500}),
        ()=>({q:'Blocks Mined ≥ '+Math.ceil(G.blocksGoal*0.4),now:G.blocksMined, cur:G.blocksMined, thresh:Math.ceil(G.blocksGoal*0.4)})
      ];
      const pick=templates[Math.floor(Math.random()*templates.length)](); const truth=pick.now>=pick.thresh;
      G._eventAns=truth?'TRUE':'FALSE';
      if(G.contractCharges>0){ G.contractCharges--; bbEventAnswer(G._eventAns); return; }
      o.innerHTML=`<div style="max-width:440px;text-align:center;padding:26px 24px;border:1px solid #fbbf24;border-radius:22px;background:linear-gradient(160deg,rgba(48,34,4,.97),rgba(25,16,3,.97));box-shadow:0 0 50px rgba(251,191,36,.35)">
        <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.2em;color:#fde68a;margin-bottom:10px">📜 SMART CONTRACT — SELF-EXECUTING RULE</div>
        <p style="font-size:.9rem;color:#fff;margin:0 0 8px">IF <b>${pick.q}</b> → contract pays out automatically.</p>
        <p style="font-size:.8rem;color:rgba(255,255,255,.6);margin:0 0 16px">Current value: <b style="color:#fbbf24">${pick.cur}</b></p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="bbEventAnswer('TRUE')" style="padding:12px 26px;border:none;border-radius:12px;background:linear-gradient(135deg,#34d399,#059669);color:#022;font-family:'Orbitron',sans-serif;font-size:.68rem;font-weight:900;cursor:pointer">TRUE — PAYS OUT</button>
          <button onclick="bbEventAnswer('FALSE')" style="padding:12px 26px;border:none;border-radius:12px;background:linear-gradient(135deg,#f87171,#dc2626);color:#fff;font-family:'Orbitron',sans-serif;font-size:.68rem;font-weight:900;cursor:pointer">FALSE — NO PAYOUT</button>
        </div>
      </div>`;
    }
  }
  window.bbEventAnswer=function(pick){
    if(!G) return;
    const ok=pick===G._eventAns;
    if(ok){ G.score+=80; G.integrity=clamp(G.integrity+3,0,100); floatTxt(.5,.4,'✅ CONTRACT EXECUTED +80','#86efac'); bumpStat('contractsWon'); }
    else { G.integrity=clamp(G.integrity-6,0,100); floatTxt(.5,.4,'💸 CONTRACT FAILED','#fca5a5'); }
    G.eventT=30+Math.random()*10; G.phase='play';
    const o=document.getElementById('bbEvent'); if(o){ o.style.display='none'; o.innerHTML=''; }
    if(G.last!=null) G.last=performance.now();
  };

  /* ══════════════════════════ BOSS FINALE ══════════════════════════ */
  function triggerBoss(){
    const cfg=L(); G.phase='boss'; G.bossActive=true; G.bossStep=0;
    const o=document.getElementById('bbBoss'); if(!o){ G.phase='play'; return; }
    o.style.display='flex';
    o.innerHTML=`<div id="bbBossCard" style="max-width:460px;text-align:center;padding:30px 26px;border:1.5px solid #ef4444;border-radius:22px;background:linear-gradient(160deg,rgba(40,4,4,.97),rgba(18,2,2,.98));box-shadow:0 0 60px rgba(239,68,68,.5)">
      <div style="font-size:3rem;margin-bottom:8px">${cfg.bossIcon}</div>
      <div style="font-family:'Anton',sans-serif;font-size:1.5rem;color:#fca5a5;margin-bottom:6px">${cfg.bossName}</div>
      <p style="font-size:.85rem;color:rgba(255,255,255,.75);margin:0 0 18px">The final block is under attack! Tap the corrupted node <b>3 times in a row</b> before it rewrites the chain.</p>
      <div id="bbBossTargetWrap" style="display:flex;justify-content:center;margin-bottom:14px">
        <button onclick="bbBossTap()" id="bbBossTarget" style="width:96px;height:96px;border-radius:50%;border:3px solid #ef4444;background:radial-gradient(circle,#7f1d1d,#450a0a);color:#fca5a5;font-size:2rem;cursor:pointer;animation:bbBossPulse .8s ease-in-out infinite">⚠️</button>
      </div>
      <style>@keyframes bbBossPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}</style>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.14em;color:#fca5a5">REPAIRS: <span id="bbBossN">0</span> / 3</div>
    </div>`;
  }
  window.bbBossTap=function(){
    if(!G||G.phase!=='boss') return;
    G.bossStep++;
    burst(.5,.5,'#34d399',16); G.flash=.3; G.flashColor='#34d399';
    const n=document.getElementById('bbBossN'); if(n) n.textContent=G.bossStep;
    const tgt=document.getElementById('bbBossTarget'); if(tgt) tgt.style.transform='scale(0.85)';
    if(G.bossStep>=3){
      const o=document.getElementById('bbBoss'); if(o){ o.style.display='none'; o.innerHTML=''; }
      G.bossActive=false; G.blocksMined=G.blocksGoal;
      end(true);
    }
  };

  /* ══════════════════════════ END OF RUN ══════════════════════════ */
  function end(win){
    if(!G||G.phase==='over') return; G.phase='over';
    const score=G.score;
    const won=!!win;
    const lvl=LV+1, isFinal=LV>=2;
    let coins=0;
    if(window.state){
      state.gamesDone=state.gamesDone||{}; state.gamesDone['risktaker:0']=1;
      state.bb_stats=state.bb_stats||{blocksMined:0,hackersStopped:0,perfectBlocks:0,contractsWon:0};
      state.bb_stats.blocksMined=(state.bb_stats.blocksMined||0)+G.blocksMined;
      state.bb_best=state.bb_best||{}; state.bb_best[LV]=Math.max(state.bb_best[LV]||0,score);
      if(won && window.cvAwardGame){
        const stars=G.integrity>65?3:(G.integrity>35?2:1);
        const isPerfect=stars===3 && G.mistakes===0;
        coins=cvAwardGame('game_blockbuilder',{level:lvl,stars,badge:'Chain Master',isFlagship:true,isPerfect,collectibles:G.collected});
        if(window.cvHubMeter) try{ cvHubMeter('risktaker_network', stars*4); }catch(e){}
      } else {
        coins=50; state.coins=(state.coins||0)+coins;
        if(window.cvAddXP) cvAddXP(10,0); if(window.cvSave) cvSave();
      }
    }
    const survived=G.integrity>0;
    const lesson=END_LESSONS[LV];
    const o=document.getElementById('bbOver'); if(!o) return; o.style.display='flex';
    const cfg=L();
    const P="padding:13px 24px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,"+cfg.col+",#0ea5e9);color:#031019;font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.1em;font-weight:900;cursor:pointer";
    const GH="padding:13px 24px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.1em;cursor:pointer";
    const title = won ? (isFinal ? '👑 ALL 3 NETWORKS MASTERED!' : 'NETWORK SECURED — LEVEL '+lvl+' ✔') : 'NICE TRY! REBOOT AND RETRY';
    const sub = won ? 'CHAIN VALIDATED!' : (survived?'OOPS — the clock beat the chain':'OOPS — chain integrity hit zero');
    const btns = won
      ? (isFinal
          ? '<button onclick="bbRestart()" style="'+GH+'">↺ REPLAY L3</button><button onclick="bbMenu()" style="'+P+'">🗺️ NETWORKS</button><button onclick="bbExit()" style="'+GH+'">← HUB</button>'
          : '<button onclick="bbNextLevel()" style="'+P+'">LEVEL '+(lvl+1)+' ▶</button><button onclick="bbRestart()" style="'+GH+'">↺ REPLAY</button><button onclick="bbExit()" style="'+GH+'">← HUB</button>')
      : '<button onclick="bbRestart()" style="'+P+'">↺ TRY AGAIN</button><button onclick="bbExit()" style="'+GH+'">← HUB</button>';
    o.innerHTML=`<div style="max-width:460px;text-align:center;padding:32px 26px;border:1px solid ${won?cfg.col:(survived?'#7dd3fc':'#ef4444')};border-radius:22px;background:linear-gradient(160deg,rgba(5,30,48,.97),rgba(3,16,25,.97));box-shadow:0 0 ${won?'90px '+cfg.colDim:'60px rgba(56,189,248,.4)'};animation:${won?(isFinal?'bbMasterPop .6s cubic-bezier(.2,1.4,.4,1)':'bbWinPop .5s cubic-bezier(.2,1.4,.4,1)'):'bbFadeIn .3s ease'}">
      <style>
        @keyframes bbWinPop{0%{transform:scale(.7) rotate(3deg);opacity:0}60%{transform:scale(1.06) rotate(-1deg);opacity:1}100%{transform:scale(1) rotate(0)}}
        @keyframes bbMasterPop{0%{transform:scale(.6) rotate(6deg);opacity:0}55%{transform:scale(1.1) rotate(-2deg);opacity:1}75%{transform:scale(.97) rotate(1deg)}100%{transform:scale(1) rotate(0)}}
        @keyframes bbFadeIn{0%{transform:scale(.94);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes bbIconPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
      </style>
      <div style="font-size:2.8rem;margin-bottom:8px${won?';animation:bbIconPulse 1.1s ease-in-out infinite':''}">${won?(isFinal?'👑':'⛓️'):(survived?'🧊':'💥')}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.2em;color:${won?'#fbbf24':(survived?'#7dd3fc':'#ef4444')};margin-bottom:6px">${title}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:8px">${sub}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:1.9rem;margin:0 0 6px">${score} pts</h1>
      <p style="color:rgba(255,255,255,.65);margin:0 0 14px;font-size:.85rem">LEVEL ${lvl}/3 · ${G.blocksMined}/${G.blocksGoal} blocks · best streak x${G.bestCombo} · ${G.collected} power-ups · +${coins} 🪙</p>
      <div style="background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.3);border-radius:14px;padding:13px 15px;margin-bottom:18px;text-align:left">
        <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.16em;color:#7dd3fc;margin-bottom:6px">⛓️ BLOCKCHAIN CONCEPT · ${lesson.concept.toUpperCase()}</div>
        <div style="font-size:1.4rem;margin-bottom:6px">${lesson.icon}</div>
        <p style="font-size:.78rem;line-height:1.55;color:rgba(255,255,255,.88);margin:0">${lesson.text}</p>
      </div>
      ${btns}
    </div>`;
  }

  /* ══════════════════════════ CONTROLS / TEARDOWN ══════════════════════ */
  function teardownRun(){ if(G&&G._cleanup) G._cleanup(); cancelAnimationFrame(raf); raf=null; clearTimeout(window._bbFactT); }
  window.bbRestart=function(){ teardownRun(); const ui=document.getElementById('bbUI'); if(ui) ui.innerHTML=chromeHTML(); reset(); setTimeout(bbBoot,30); };
  window.bbNextLevel=function(){ teardownRun(); const li=Math.min(2,LV+1); window.bbStartLevel(li); };
  window.bbMenu=function(){ teardownRun(); G=null; const ui=document.getElementById('bbUI'); if(ui) ui.innerHTML=''; bbShowSelect(); };
  window.bbExit=function(){
    teardownRun(); G=null;
    if(window.state) state.viewingWorld = state._returnHub || TOKEN;
    goTo('hub');
  };

  /* ── DEBUG HOOKS (read-only introspection + force-win, parity w/ prior build) ── */
  window._bbDbg=function(){
    return G ? { LV, phase:G.phase, score:G.score, blocksMined:G.blocksMined, blocksGoal:G.blocksGoal,
                  integrity:G.integrity, lanes:G.lanes.map(l=>({fill:l.filled,chain:l.chainCount,consensus:l.consensus,corrupt:l.corruptT})),
                  gateIdx:G.gateIdx, isFinal:LV>=2 } : { LV, phase:'no-G' };
  };
  window._bbForceWin=function(){ if(!G) return false; G.blocksMined=G.blocksGoal; G.integrity=100; end(true); return true; };
})();
