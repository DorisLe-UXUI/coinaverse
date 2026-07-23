/* ════════════════════════════════════════════════════════════════
   BIZ OP 2.0 — real canvas business sim (Builder / LAUNCH LAB)
   Rebuilt against the delivered "Biz Op — Game Design Document" (KaBria,
   Founder/Game Design, CoinCept) to close the gaps the GDD calls out by
   name while keeping every existing tuning/feel intact:
     • EMPLOYEES (GDD §6.2) — hire Cashier/Stock Clerk/Marketer (L2+),
       each with an energy pool that throttles their auto-actions.
     • RANDOM EVENTS (GDD §6.7 + §7 per-level lists) — Operational/Supply/
       Reputation events from L1 ("reduced event pressure"), Demand +
       Competitive added L2, Crisis-tier (fire/cyber) added L3. Always
       telegraphed, always counterable (tap the banner in time).
     • PRODUCT LAUNCH (GDD §7.3) — one-shot L3 action that unlocks a
       premium menu item for the rest of the match.
     • CUSTOMER PERSONALITIES (GDD §6.1, "Level 2+") — Patient/Complainer/
       Big Spender/Premium Lover/VIP, each with distinct patience & spend.
     • REPUTATION (GDD §6.5) — a real star-rating stat, not cosmetic: it
       gates star-quality on completion alongside happiness, exactly as
       the GDD's per-level goal tables require revenue + happiness% +
       reputation stars together.
     • BUSINESS COLLECTION BOOK + CEO WALL (GDD §10) — lightweight local
       meta-progression: discoveries feed cvAwardGame's `collectibles`
       bonus; a handful of CEO Wall achievements persist across matches.
       NOTE: the host app's cvSave() only persists a hardcoded FIELDS
       whitelist (coinaverse_v34.html) that doesn't know about bo_*
       keys, so anything in `state.bo_*` alone would silently vanish on
       reload. This file keeps its own small localStorage mirror
       (BO_LS_KEY) so the collection/CEO Wall genuinely survive across
       sessions without touching the host file.
     • Randomized Business Roster (GDD §8) expanded 3 → 9 shops, all
       data-driven off one SHOPS table (no picker code changes needed
       to add more, per GDD §15.1).
     • Visual polish pass: pseudo-3D counter ledge + parallax employee
       row (deliberately NOT full three.js — see note below), more
       particle/glow juice on hire/launch/event actions, expanded
       Knowledge Gate content (now explicitly covers opportunity cost,
       hiring/leadership and systems-thinking/cascade per GDD §13).

   On true 3D: judged not worth it for THIS game. Biz Op is fundamentally
   a counter-service queue (2D read at a glance, per GDD §14.2 "Glance-
   ability"); a three.js isometric shop would cost real build time for
   a genre where depth doesn't add legibility or fun the way it does for
   FICO Racer's actual 3D track. Spent that time budget on the mechanic/
   economy gaps + 2D juice instead, per the brief's own priority order.

   Original core loop (unchanged): players pick a business, serve
   customers who show up with patience timers, restock ingredients, hit
   a revenue goal within a time limit. 3-LEVEL MISSION LADDER: L1 Rookie
   → L2 Pro → L3 Legend, each with its own Knowledge Gate fact pool.
   Loads after the main script; overrides the stub window.SCREENS.game_bizop.
   Public API kept exactly compatible: window.SCREENS.game_bizop / window.boInit.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const MAXQ=5, START_STOCK=8, STOCK_CAP=12, RESTOCK_QTY=6, GATE_EVERY=18;
  let G=null, raf=null, LV=0;   // LV = current level index (0..2)

  // ── 3-LEVEL SYSTEM — real scaling knobs per level ────────────────────
  //    goal: revenue target · round: seconds · spawnMul: spawn-interval
  //    multiplier (lower=faster customers) · patMul: patience multiplier
  //    (lower=shorter fuse) · restockCost: $ per restock (pricier = tighter
  //    margins on higher levels) · theme: GDD §7 world name (flavor only —
  //    shown on the picker/results screens, doesn't touch the tuning above)
  const LEVELS=[
    { name:'ROOKIE', theme:'STARTUP STREET',      goal:2000, round:80, spawnMul:1.0,  patMul:1.0,  restockCost:40 },
    { name:'PRO',    theme:'INNOVATION DISTRICT',  goal:2800, round:82, spawnMul:0.82, patMul:0.82, restockCost:55 },
    { name:'LEGEND', theme:'EMPIRE HEIGHTS',       goal:3800, round:85, spawnMul:0.68, patMul:0.68, restockCost:70 }
  ];
  function L(){ return LEVELS[LV]; }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

  // LEARN WHILE PLAYING — 15 entrepreneurship lessons, 5 per level (was 4;
  // expanded so hiring/leadership, opportunity cost and systems-thinking —
  // all named explicitly in the GDD's §13 mapping table — get their own
  // facts instead of being implied). Shuffled per run; a run only has time
  // for ~4 gates, so the 5th rotates in across replays for extra variety.
  const LEVEL_FACTS=[
    [ // LEVEL 1 · the basics
      ['💡','Start with a real problem people will pay to solve.'],
      ['🔍','Watching what customers ask for is how you read supply and demand.'],
      ['😀','Happy customers come back — great service builds loyalty.'],
      ['📦','Keep stock ready, but don\'t over-order and waste cash.'],
      ['🏷️','Price to cover your costs AND still make a profit.'],
    ],
    [ // LEVEL 2 · running the shop
      ['⚡','Fast, accurate service means more customers served — and more revenue.'],
      ['💰','Revenue minus costs equals profit. Track both, not just sales.'],
      ['📣','Marketing brings in customers — but every campaign costs money, so spend wisely.'],
      ['👥','Hiring good help multiplies what you can get done — but payroll is a real cost too.'],
      ['⚖️','Every dollar spent is a dollar you can\'t spend elsewhere. That\'s opportunity cost.'],
    ],
    [ // LEVEL 3 · scaling up
      ['📊','Track your numbers daily — small trends become big problems if ignored.'],
      ['🧯','Keep a cash cushion — slow days and surprises happen even to great businesses.'],
      ['🤝','Your team\'s energy shows up in every customer interaction — support them too.'],
      ['🔗','Departments are connected — neglect one, like HR or supply, and the rest feel it fast.'],
      ['🚀','Reinvest some profit into growth, but never spend money you don\'t have.'],
    ]
  ];

  // ── persistent meta layer (Collection Book + CEO Wall) ───────────────
  // Lives in state.bo_* (namespaced per house rule) for in-session reads,
  // AND mirrored to its own localStorage key so it survives reloads even
  // though the host's cvSave() whitelist doesn't know about bo_* fields.
  const BO_LS_KEY='cv_bizop_meta_v1';
  function bmLoad(){ try{ const raw=localStorage.getItem(BO_LS_KEY); if(raw){ const m=JSON.parse(raw); if(m&&typeof m==='object') return m; } }catch(e){} return null; }
  function bmSave(){
    if(!window.state) return;
    try{ localStorage.setItem(BO_LS_KEY, JSON.stringify({
      collection: state.bo_collection, ceoWall: state.bo_ceoWall,
      totalServed: state.bo_totalServed, totalRevenue: state.bo_totalRevenue,
      opEventsResolved: state.bo_opEventsResolved, competitorCountered: state.bo_competitorCountered,
      crisisResolved: state.bo_crisisResolved
    })); }catch(e){}
  }
  function bmHydrate(){
    if(!window.state) return;
    if(state.bo_collection && state.bo_ceoWall) return;   // already hydrated this session
    const m=bmLoad();
    state.bo_collection = state.bo_collection || (m&&m.collection) || {shops:[],employees:[],events:[],personalities:[],products:0};
    state.bo_ceoWall = state.bo_ceoWall || (m&&m.ceoWall) || [];
    state.bo_totalServed = state.bo_totalServed || (m&&m.totalServed) || 0;
    state.bo_totalRevenue = state.bo_totalRevenue || (m&&m.totalRevenue) || 0;
    state.bo_opEventsResolved = state.bo_opEventsResolved || (m&&m.opEventsResolved) || 0;
    state.bo_competitorCountered = state.bo_competitorCountered || (m&&m.competitorCountered) || 0;
    state.bo_crisisResolved = state.bo_crisisResolved || (m&&m.crisisResolved) || 0;
  }

  window.boInit=function(){ G=null; LV=0; bmHydrate(); };  // playDistrictGame calls this before goTo

  // Selectable shops (each themes the order menu + base price) — GDD §8's
  // "Randomized Business Roster": expanded from 3 → 9, all data-driven off
  // this one table (adding a 10th needs no other code changes, per §15.1).
  // Each shop now also carries `tint` (its own accent color) + `cat` (interior/
  // prop archetype: food counter / tech shelves / boutique arch) — GDD §8.2
  // wants "a distinct interior, props, and palette" per business; these two
  // fields are what _bzBg()/drawShopProps() key off of to deliver that without
  // needing 9 bespoke illustrated scenes (see render code near _bzBg).
  const SHOPS={
    burger:    { e:'🍔', name:'BURGER BARN',       menu:['🍔','🍟','🥤','🌭','🥗'], base:55, tint:'#fb923c', cat:'food' },
    coffee:    { e:'☕', name:'BEAN MACHINE',       menu:['☕','🥐','🧁','🍪','🥤'], base:50, tint:'#b08968', cat:'food' },
    pizza:     { e:'🍕', name:'PIZZA PALACE',       menu:['🍕','🥤','🧄','🍗','🥗'], base:60, tint:'#ef4444', cat:'food' },
    bakery:    { e:'🧁', name:'SWEET BATCH BAKERY', menu:['🧁','🍰','🥐','🍪','☕'], base:48, tint:'#f9a8d4', cat:'food' },
    taco:      { e:'🌮', name:'TACO FIESTA',        menu:['🌮','🌯','🥤','🌶️','🥑'], base:52, tint:'#84cc16', cat:'food' },
    flower:    { e:'🌷', name:'BLOOM & PETAL',      menu:['🌷','🌹','🌻','🎁','🪴'], base:58, tint:'#f472b6', cat:'boutique' },
    icecream:  { e:'🍦', name:'SCOOP DREAMS',       menu:['🍦','🍨','🧁','🍫','🥤'], base:46, tint:'#5eead4', cat:'food' },
    bubbletea: { e:'🧋', name:'BUBBLE BAR',         menu:['🧋','🍡','🥤','🍪','🧊'], base:50, tint:'#c4b5fd', cat:'food' },
    tech:      { e:'💻', name:'BYTE SHOP',          menu:['💻','📱','🎧','🔌','🖨️'], base:65, tint:'#38bdf8', cat:'tech' }
  };
  // Customer face pool — varied so the queue feels alive
  const FACES=['🧑','👩','👨','👵','👴','🧒','👧','👦','🧔','👱','👩‍🦱','🧑‍🦰','👨‍🦳','🧓','👩‍🦳'];

  // ── colour helper + PLAYER/CEO AVATAR (GDD §16.1 "the young-CEO avatar" —
  // no player/CEO avatar existed anywhere in this game; only customer emoji
  // and 3 generic employee-role emoji represented people). Hand-authored
  // simple vector icon (AI portrait generation was unavailable on this
  // account — "Requires basic plan or higher" — so this is the accepted
  // fallback pattern): a friendly cartoon kid-CEO bust in a navy blazer +
  // gold tie, matching the rebalanced navy/gold/teal/purple palette below.
  function hx2rgba(hex,a){ const h=String(hex).replace('#',''); const r=parseInt(h.substring(0,2),16), g=parseInt(h.substring(2,4),16), b=parseInt(h.substring(4,6),16); return 'rgba('+r+','+g+','+b+','+a+')'; }
  // same skin-tone ramp + default index as the host app's own avatar studio
  // (coinaverse_v34.html SKIN_TONES / state.avatarSkinTone) — reusing it here
  // means the CEO icon reflects the player's OWN chosen tone (GDD §16.1 wants
  // the avatar "diverse, aspirational, age-appropriate") instead of one fixed
  // skin color for every player.
  const CEO_SKIN_TONES=['#ffe0bd','#f1c27d','#e0ac69','#c68642','#8d5524','#5a3825'];
  function ceoSkin(){ const i=(window.state&&state.avatarSkinTone!=null)?state.avatarSkinTone:2; return CEO_SKIN_TONES[i]||CEO_SKIN_TONES[2]; }
  function ceoAvatarSvg(){
    const skin=ceoSkin();
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <rect width="100" height="100" fill="#0a1128"/>
      <path d="M4 100 Q50 58 96 100 Z" fill="#132242"/>
      <path d="M50 58 L36 80 L50 73 L64 80 Z" fill="#fbbf24"/>
      <path d="M29 63 L50 77 L21 93 L12 78 Z" fill="#f1f5f9"/>
      <path d="M71 63 L50 77 L79 93 L88 78 Z" fill="#f1f5f9"/>
      <rect x="41" y="49" width="18" height="18" rx="5" fill="${skin}"/>
      <circle cx="50" cy="34" r="23" fill="${skin}"/>
      <path d="M26 31 Q28 9 50 9 Q72 9 74 31 Q65 19 50 19 Q35 19 26 31Z" fill="#2b1b12"/>
      <circle cx="41" cy="34" r="2.8" fill="#1a1030"/>
      <circle cx="59" cy="34" r="2.8" fill="#1a1030"/>
      <path d="M41 42 Q50 48 59 42" stroke="#8a4b32" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <circle cx="31" cy="40" r="3.2" fill="#f7a8a8" opacity=".5"/>
      <circle cx="69" cy="40" r="3.2" fill="#f7a8a8" opacity=".5"/>
    </svg>`;
  }
  function ceoAvatarHtml(size,glow){ return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex:0 0 auto;border:2px solid #fbbf24;box-shadow:0 0 ${glow||10}px rgba(251,191,36,.55);background:#0a1128">${ceoAvatarSvg()}</div>`; }

  // ── EMPLOYEES (GDD §6.2) — hire from the TEAM panel, L2+. Each has an
  // energy pool: acts on a timer while energy is healthy, rests (skips
  // its action, recovers faster) when low — a light version of "Energy...
  // throttling speed when low". Costs scale with level like restockCost.
  const ROLES={
    cashier: { e:'🧑‍💼', name:'CASHIER',     desc:'Auto-serves your longest-waiting customer.',      cost:l=>90+l*45,  actEvery:4.4, energyCost:16 },
    clerk:   { e:'📦',   name:'STOCK CLERK', desc:'Tops up your stock automatically, on the house.', cost:l=>85+l*40,  actEvery:5.6, energyCost:14 },
    market:  { e:'📣',   name:'MARKETER',    desc:'Periodically draws in a rush of new customers.',  cost:l=>115+l*50, actEvery:9.5, energyCost:22 }
  };

  // ── CUSTOMER PERSONALITIES (GDD §6.1, "Level 2+") ────────────────────
  const PERSONALITIES=[
    { id:'patient',    icon:'😌', label:'PATIENT',       patMul:1.35, payMul:0.9,  weight:.30 },
    { id:'complainer', icon:'😤', label:'COMPLAINER',    patMul:0.6,  payMul:1.0,  weight:.22 },
    { id:'bigspender', icon:'🤑', label:'BIG SPENDER',   patMul:0.85, payMul:1.6,  weight:.20 },
    { id:'premium',    icon:'💎', label:'PREMIUM LOVER', patMul:1.0,  payMul:1.25, weight:.18, wantsPremium:true },
    { id:'vip',        icon:'👑', label:'VIP',           patMul:1.15, payMul:2.2,  weight:.10 }
  ];
  function pickPersonality(){ let r=Math.random(); for(const p of PERSONALITIES){ if(r<p.weight) return p; r-=p.weight; } return PERSONALITIES[0]; }

  // ── RANDOM EVENTS (GDD §6.7 + per-level lists in §7) — data-driven catalog.
  // minLV gates availability: Operational/Supply/Reputation from L1 ("intro-
  // ductory" + "bad review appears" per §7.1), Demand/Competitive added L2
  // ("escalated" per §7.2), Crisis-tier added L3 ("high-stakes" per §7.3).
  // Every non-auto event is telegraphed (a banner button) and always
  // counterable — tap it inside windowT or it resolves as a fair, bounded
  // penalty. `auto` events (viral moment) are pure upside, no tap needed.
  const EVENT_DEFS=[
    { id:'spill', cat:'Operational', minLV:0, icon:'🫗', title:'SPILL AT THE COUNTER', windowT:5.5,
      okMsg:'✨ Cleaned up fast!', failMsg:'😖 The mess cost you happy customers.', okFx:{happy:4}, failFx:{happy:-10} },
    { id:'jam', cat:'Operational', minLV:0, icon:'⚙️', title:'REGISTER JAM — TAP TO RESET', windowT:5,
      okMsg:'🔧 Fixed! Back in business.', failMsg:'💢 Slower service hurt your happiness.', okFx:{happy:3}, failFx:{happy:-10,stock:-1} },
    { id:'lateshipment', cat:'Supply', minLV:0, icon:'🚚', title:'SUPPLIER RUNNING LATE', windowT:6,
      okMsg:'📦 Expedited — stock secured!', failMsg:'📉 Stock ran thinner than planned.', okFx:{stock:3}, failFx:{stock:-2} },
    { id:'badreview', cat:'Reputation', minLV:0, icon:'⭐', title:'BAD REVIEW POSTED — RESPOND!', windowT:5,
      okMsg:'💬 Great response — reputation saved!', failMsg:'📰 The bad review spread.', okFx:{reputation:6}, failFx:{reputation:-14,happy:-6} },
    { id:'rush', cat:'Demand', minLV:1, icon:'📈', title:'VIRAL MOMENT!', windowT:0, auto:true,
      okMsg:'📈 You\'re trending — customers incoming!', okFx:{} },
    { id:'competitor', cat:'Competitive', minLV:1, icon:'🏪', title:'COMPETITOR OPENED NEARBY — MARKETING PUSH!', windowT:6.5,
      okMsg:'📣 Marketing push held your customers!', failMsg:'🚶 Some customers wandered next door.', okFx:{reputation:4}, failFx:{happy:-6}, isCompetitor:true },
    { id:'crisis_fire', cat:'Crisis', minLV:2, icon:'🔥', title:'WAREHOUSE FIRE! TAP NOW!', windowT:4, severe:true,
      okMsg:'🧯 Contained! Crisis managed.', failMsg:'🔥 Smoke damage — inventory lost.', okFx:{reputation:5}, failFx:{stock:-4,happy:-14}, isCrisis:true },
    { id:'crisis_cyber', cat:'Crisis', minLV:2, icon:'💻', title:'CYBER ATTACK! TAP NOW!', windowT:4, severe:true,
      okMsg:'🔒 Locked down in time!', failMsg:'💻 Down time cost you sales.', okFx:{reputation:5}, failFx:{revenue:-150,happy:-10}, isCrisis:true }
  ];

  function reset(keepShop){
    const shop = keepShop || (G&&G.shopKey) || null;
    G={ phase: shop?'play':'pick', shopKey:shop,
        revenue:0, stock:START_STOCK, happy:100, reputation:60, time:L().round,
        served:0, lost:0, combo:0, bestCombo:0, tips:0,
        queue:[], parts:[], floats:[], coins:[],
        spawnT:0.6, last:0, started:performance.now(),
        shake:0, flash:0, turbo:0, mkt:0, restockPulse:0, lowWarn:0,
        gateT:GATE_EVERY, gateIdx:0,
        employees:{ cashier:null, clerk:null, market:null },
        activeEvent:null, eventT:0,
        premiumUnlocked:false, premiumItem:null,
        newDiscoveries:0,
        facts:shuffle(LEVEL_FACTS[LV].slice()) };
    scheduleNextEvent();
  }

  window.SCREENS.game_bizop=function(){
    if(!G) reset();
    setTimeout(boBoot,30);
    return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,#16213f,#0a1330 55%,#050a18);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <style>
        @keyframes boEventPop{0%{transform:translateX(-50%) scale(.7);opacity:0}60%{transform:translateX(-50%) scale(1.08)}100%{transform:translateX(-50%) scale(1);opacity:1}}
        @keyframes boHirePop{0%{transform:scale(.85);opacity:.4}100%{transform:scale(1);opacity:1}}
      </style>
      <div style="position:absolute;top:0;left:0;right:0;z-index:6;display:flex;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(180deg,rgba(5,9,22,.9),transparent)">
        <button onclick="boExit()" style="padding:7px 14px;border:1px solid rgba(168,85,247,.45);border-radius:9px;background:rgba(168,85,247,.12);color:#c084fc;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer;white-space:nowrap">← LAUNCH LAB</button>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex:1;min-width:0">
          ${ceoAvatarHtml(30,8)}
          <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.2em;color:#c084fc;text-align:center;white-space:nowrap">BIZ OP · <span id="boLvl">LV ${LV+1}/3</span></div>
        </div>
        <div id="boTime" style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fbbf24;min-width:42px;text-align:right">${L().round}s</div>
      </div>

      <!-- Revenue + goal bar -->
      <div style="position:absolute;top:50px;left:16px;right:16px;z-index:6">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4px">
          <span style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55)">REVENUE</span>
          <span id="boRevTxt" style="font-family:'Anton',sans-serif;font-size:1.55rem;line-height:1;color:#34d399">$0</span>
        </div>
        <div style="height:9px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(168,85,247,.3)"><div id="boRevBar" style="height:100%;width:0%;background:linear-gradient(90deg,#a855f7,#34d399);transition:width .25s"></div></div>
        <div style="text-align:right;font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.1em;color:rgba(255,255,255,.4);margin-top:2px">GOAL $<span id="boGoalTxt">${L().goal}</span></div>
      </div>

      <!-- Stat chips -->
      <div style="position:absolute;top:118px;left:16px;right:16px;z-index:6;display:flex;gap:8px;justify-content:center">
        ${chip('STOCK','boStock','#fbbf24')}${chip('HAPPY','boHappyN','#34d399')}${chip('REP','boRepN','#fbbf24')}${chip('COMBO','boCombo','#c084fc')}
      </div>
      <!-- Happiness bar -->
      <div style="position:absolute;top:172px;left:16px;right:16px;z-index:6">
        <div style="height:7px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(239,68,68,.25)"><div id="boHappyBar" style="height:100%;width:100%;background:linear-gradient(90deg,#f472b6,#34d399);transition:width .25s"></div></div>
      </div>

      <!-- Random-event banner (GDD §6.7) — telegraphed, always counterable -->
      <button id="boEventBtn" onclick="boResolveEvent()" style="position:absolute;left:50%;top:184px;transform:translateX(-50%);z-index:7;display:none;padding:9px 16px;border:2px solid #fbbf24;border-radius:13px;background:rgba(20,12,38,.92);color:#fff;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.05em;font-weight:900;cursor:pointer;box-shadow:0 0 22px rgba(251,191,36,.6);animation:boEventPop .35s cubic-bezier(.2,1.4,.4,1);max-width:88vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></button>

      <canvas id="boCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>

      <!-- Bottom quick-actions bar (GDD §5.4) -->
      <div id="boActions" style="position:absolute;left:0;right:0;bottom:60px;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;padding:0 12px">
        <button id="boRestock" onclick="boDoRestock()" style="padding:12px 18px;border:none;border-radius:14px;background:linear-gradient(135deg,#a855f7,#7e22ce);color:#fff;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.05em;font-weight:900;cursor:pointer;box-shadow:0 6px 20px rgba(168,85,247,.5);display:none">📦 RESTOCK +${RESTOCK_QTY} <span style="opacity:.8;font-size:.56rem">(−$<span id="boRestockCostTxt">${L().restockCost}</span>)</span></button>
        <button id="boTeamBtn" onclick="boOpenTeam()" style="display:none;padding:12px 16px;border:1.5px solid rgba(96,165,250,.6);border-radius:14px;background:rgba(30,58,138,.35);color:#93c5fd;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.05em;font-weight:900;cursor:pointer">👥 TEAM</button>
        <button id="boLaunchBtn" onclick="boLaunch()" style="display:none;padding:12px 16px;border:1.5px solid rgba(251,191,36,.6);border-radius:14px;background:rgba(120,53,15,.3);color:#fde68a;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.05em;font-weight:900;cursor:pointer">🚀 LAUNCH</button>
      </div>

      <div id="boHint" style="position:absolute;left:0;right:0;bottom:20px;text-align:center;z-index:5;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.1em;color:rgba(255,255,255,.42);pointer-events:none">TAP a customer to SERVE · keep STOCK up · serve fast for TIPS</div>

      <!-- Shop picker overlay -->
      <div id="boPick" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(5,9,22,.92);backdrop-filter:blur(5px)"></div>
      <!-- Team / hiring overlay -->
      <div id="boTeam" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(5,9,22,.92);backdrop-filter:blur(5px);padding:20px"></div>
      <!-- Knowledge gate overlay -->
      <div id="boGate" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(5,9,22,.88);backdrop-filter:blur(5px);padding:22px"></div>
      <!-- End overlay -->
      <div id="boOver" style="position:absolute;inset:0;z-index:10;display:none;align-items:center;justify-content:center;background:rgba(5,9,22,.86);backdrop-filter:blur(5px)"></div>
    </div>`;
  };

  function chip(label,id,c){ return `<div style="flex:1;max-width:100px;text-align:center;background:rgba(8,14,32,.55);border:1px solid rgba(148,163,184,.22);border-radius:11px;padding:6px"><div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.45)">${label}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:1rem;color:${c}">—</div></div>`; }

  function showPicker(){
    const p=document.getElementById('boPick'); if(!p) return; p.style.display='flex';
    const keys=Object.keys(SHOPS);
    // per-shop tinted card (GDD §8.2 distinct palette per business) on a
    // navy card base (GDD §16.1 — navy backdrop, accents stay accents)
    const card=(k)=>{ const s=SHOPS[k]; const bd=hx2rgba(s.tint,.5); return `<button onclick="boPickShop('${k}')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px;min-width:92px;border:2px solid ${bd};border-radius:16px;background:linear-gradient(160deg,rgba(10,16,36,.92),rgba(5,9,22,.92));color:#fff;cursor:pointer;transition:transform .12s,border-color .15s" onmouseover="this.style.transform='translateY(-5px)';this.style.borderColor='${s.tint}'" onmouseout="this.style.transform='none';this.style.borderColor='${bd}'"><div style="font-size:2.3rem">${s.e}</div><div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.05em;color:${s.tint}">${s.name}</div></button>`; };
    // player/CEO avatar anchors the title screen (GDD §16.1 "the young-CEO
    // avatar" / "character-forward") — previously no avatar appeared anywhere
    const ceoName=(window.state&&state.playerName)||'YOUNG CEO';
    p.innerHTML=`<div style="max-width:560px;text-align:center;padding:26px 20px;max-height:92vh;overflow-y:auto">
      <div style="display:flex;justify-content:center;margin-bottom:6px">${ceoAvatarHtml(72,16)}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:10px">${ceoName.toUpperCase()}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:#c084fc;margin-bottom:2px">CHOOSE YOUR BUSINESS</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.16em;color:rgba(255,255,255,.4);margin-bottom:10px">LV ${LV+1}/3 · ${L().theme}</div>
      <p style="color:rgba(255,255,255,.6);margin:0 0 16px;font-size:.82rem">Serve every customer before they lose patience. Hit <b style="color:#34d399">$${L().goal}</b> revenue in ${L().round}s!</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">${keys.map(card).join('')}</div>
    </div>`;
  }
  window.boPickShop=function(k){
    G.shopKey=k; G.phase='play';
    const p=document.getElementById('boPick'); if(p){p.style.display='none';p.innerHTML='';}
    showActionButtons();
    bcAdd('shops',k);
    G.last=performance.now();
  };

  function showActionButtons(){
    const rb=document.getElementById('boRestock'); if(rb) rb.style.display='inline-block';
    const tb=document.getElementById('boTeamBtn'); if(tb) tb.style.display=(LV>=1)?'inline-block':'none';
    const lb=document.getElementById('boLaunchBtn'); if(lb) lb.style.display=(LV>=2)?'inline-block':'none';
  }

  function boBoot(){
    const cv=document.getElementById('boCanvas'); if(!cv){ return; }
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);

    // SERVE on tap/click — hit-test the customer slots
    const hit=(clientX,clientY)=>{
      if(!G||G.phase!=='play') return;
      const r=cv.getBoundingClientRect();
      const x=(clientX-r.left)/r.width, y=(clientY-r.top)/r.height;
      // iterate front→back so nearest gets served
      let best=-1, bestD=1e9;
      for(let i=0;i<G.queue.length;i++){
        const c=G.queue[i]; if(c.state!=='wait') continue;
        const dx=x-c.x, dy=y-c.cy; const d=dx*dx+dy*dy;
        if(d<0.018 && d<bestD){ bestD=d; best=i; }
      }
      if(best>=0) serve(G.queue[best]);
      else if(G.stock<=2){ // generous: tapping empty area when low nudges restock glow
        G.restockPulse=0.5;
      }
    };
    const md=e=>hit(e.clientX,e.clientY);
    const ts=e=>{ if(e.touches[0]){ hit(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); } };
    cv.addEventListener('mousedown',md);
    cv.addEventListener('touchstart',ts,{passive:false});
    // keyboard: R restock, 1-5 serve nth waiting customer, E resolve event, T team, L launch
    const kd=e=>{
      if(!G||G.phase!=='play') return;
      if(e.key==='r'||e.key==='R'){ boDoRestock(); }
      else if(e.key>='1'&&e.key<='5'){ const idx=+e.key-1; const w=G.queue.filter(c=>c.state==='wait'); if(w[idx]) serve(w[idx]); }
      else if(e.key==='e'||e.key==='E'){ if(G.activeEvent && !G.activeEvent.def.auto) boResolveEvent(); }
      else if(e.key==='t'||e.key==='T'){ if(LV>=1) boOpenTeam(); }
      else if(e.key==='l'||e.key==='L'){ if(LV>=2) boLaunch(); }
    };
    window.addEventListener('keydown',kd);
    G._cleanup=()=>{ window.removeEventListener('resize',size); window.removeEventListener('keydown',kd); cv.removeEventListener('mousedown',md); cv.removeEventListener('touchstart',ts); };

    if(G.phase==='pick') showPicker();
    else showActionButtons();
    G.last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  function loop(now){
    const cv=document.getElementById('boCanvas');
    if(!cv || !G){ cancelAnimationFrame(raf); return; }   // left screen → stop
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    let dt=Math.min(40,now-G.last)/1000; G.last=now;
    if(G.phase==='play') update(dt,W,H);
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  // queue layout: 5 slots across, sitting in the lower-mid band
  function slotX(i){ return 0.12 + i*0.19; }
  const QY=0.62;

  function spawnCustomer(prog){
    if(G.queue.length>=MAXQ) return;
    // find a free slot index
    const taken=new Set(G.queue.map(c=>c.slot));
    let slot=-1; for(let i=0;i<MAXQ;i++){ if(!taken.has(i)){ slot=i; break; } }
    if(slot<0) return;
    const shop=SHOPS[G.shopKey]||SHOPS.burger;
    // customer personalities unlock L2+ (GDD §6.1); L1 stays "generic" so the
    // tutorial level only teaches the base verbs, per the GDD's difficulty curve
    const personality = LV>=1 ? pickPersonality() : null;
    const wantsPremium = personality && personality.wantsPremium && G.premiumUnlocked;
    const premium = wantsPremium || (G.premiumUnlocked && Math.random()<0.22);
    const order = premium ? G.premiumItem : shop.menu[Math.floor(Math.random()*shop.menu.length)];
    const face=FACES[Math.floor(Math.random()*FACES.length)];
    const payMul = personality ? personality.payMul : 1;
    const patMul = personality ? personality.patMul : 1;
    const patMax=(4.2 - prog*1.4 + Math.random()*1.2)*L().patMul*patMul;   // shrinks as game heats up + as level ramps
    const base = Math.round(shop.base*payMul*(premium?1.8:1));
    G.queue.push({ slot, x:slotX(slot)-0.16, tx:slotX(slot), cy:QY, face, order, base,
                   personality, premium,
                   pat:patMax, patMax, state:'in', enter:0, bob:Math.random()*6.28, served:0, leave:0 });
    if(personality) bcAdd('personalities', personality.id);
  }

  function serve(c, auto){
    if(G.stock<=0){ G.restockPulse=0.7; G.shake=0.18; floatTxt(c.tx, QY-0.07, 'NO STOCK!', '#fca5a5'); return; }
    G.stock--;
    G.combo++; G.bestCombo=Math.max(G.bestCombo,G.combo);
    G.served++;
    const patFrac=c.pat/c.patMax;
    const tip=Math.round(c.base*0.6*patFrac);          // fast serve = big tip
    const comboBonus=Math.floor(G.combo/3)*5;
    const gain=c.base+tip+comboBonus;
    G.revenue+=gain; G.tips+=tip;
    c.state='served'; c.served=1; c.leave=0;
    // reputation reacts to service quality (GDD §6.5 — service quality moves the star rating)
    if(patFrac>0.6) G.reputation=Math.min(100,G.reputation+2);
    else if(patFrac<0.25) G.reputation=Math.max(0,G.reputation-1);
    if(c.personality && c.personality.id==='vip'){ G.reputation=Math.min(100,G.reputation+4); floatTxt(c.tx, QY-0.2, '👑 VIP SERVED!', '#fbbf24'); }
    // fly coins toward the revenue readout (top)
    flyCoins(c.tx, QY-0.04, 3+Math.floor(patFrac*3));
    // burst grows with combo depth — serve #1 and serve #10 in a streak should feel different
    burst(c.tx, QY-0.05, '#34d399', 9+Math.min(12,G.combo));
    floatTxt(c.tx, QY-0.09, (auto?'🧑‍💼 ':'')+'+$'+gain, patFrac>0.55?'#fde68a':'#a7f3d0');
    if(tip>0 && patFrac>0.6) floatTxt(c.tx, QY-0.15, 'NICE TIP!', '#fbbf24');
    if(G.combo>1 && G.combo%3===0){ G.flash=0.35; floatTxt(0.5,0.34,'🔥 COMBO x'+G.combo,'#c084fc'); burst(0.5,0.34,'#c084fc',16); G.shake=Math.max(G.shake||0,0.18); }
    if(G.stock<=2) G.restockPulse=0.6;
  }

  window.boDoRestock=function(){
    if(!G||G.phase!=='play') return;
    if(G.stock>=STOCK_CAP){ floatTxt(0.5,0.5,'STOCK FULL','#c084fc'); return; }
    const cost=L().restockCost;
    if(G.revenue<cost){ G.shake=0.18; floatTxt(0.5,0.5,'NEED $'+cost,'#fca5a5'); return; }
    G.revenue-=cost;
    G.stock=Math.min(STOCK_CAP,G.stock+RESTOCK_QTY);
    G.restockPulse=0; G.flash=0.25;
    burst(0.5,0.9,'#fbbf24',12);
    floatTxt(0.5,0.86,'+'+RESTOCK_QTY+' STOCK','#fde68a');
  };

  // ── EMPLOYEES update (GDD §6.2) — auto-act on a per-role timer while
  // energy holds up; rest (skip + recover faster) when it doesn't. Reuses
  // the existing serve()/stock/mkt mechanics rather than duplicating logic.
  function updateEmployees(dt){
    ['cashier','clerk','market'].forEach(key=>{
      const e=G.employees[key]; if(!e||!e.hired) return;
      const def=ROLES[key];
      e.t+=dt;
      if(e.energy>15){
        if(e.t>=def.actEvery){ e.t=0; doEmployeeAction(key); e.energy=Math.max(0,e.energy-def.energyCost); }
        e.energy=Math.min(100,e.energy+dt*1.2);
      } else {
        e.energy=Math.min(100,e.energy+dt*4);   // resting recovers faster
      }
    });
  }
  function doEmployeeAction(key){
    if(key==='cashier'){
      const w=G.queue.filter(c=>c.state==='wait').sort((a,b)=>a.pat-b.pat)[0];
      if(w) serve(w,true);
    } else if(key==='clerk'){
      if(G.stock<STOCK_CAP){ G.stock=Math.min(STOCK_CAP,G.stock+2); floatTxt(0.82,0.9,'📦 clerk restocked','#93c5fd'); burst(0.82,0.9,'#60a5fa',6); }
    } else if(key==='market'){
      G.mkt=Math.max(G.mkt,5); floatTxt(0.5,0.4,'📣 marketer boosted traffic!','#f9a8d4');
    }
  }

  // ── TEAM (hiring) overlay ─────────────────────────────────────────────
  function showTeam(){
    const t=document.getElementById('boTeam'); if(!t) return; t.style.display='flex';
    const roleCard=(key)=>{
      const def=ROLES[key]; const e=G.employees[key]; const cost=def.cost(LV); const hired=e&&e.hired;
      const sub = hired ? ('⚡ '+Math.round(e.energy)+'% energy') : ('Hire — $'+cost);
      return `<button onclick="${hired?'':"boHire('"+key+"')"}" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px;min-width:100px;border:2px solid ${hired?'rgba(52,211,153,.5)':'rgba(96,165,250,.45)'};border-radius:16px;background:linear-gradient(160deg,rgba(30,58,138,.35),rgba(15,23,42,.5));color:#fff;cursor:${hired?'default':'pointer'};animation:boHirePop .3s ease">
        <div style="font-size:2.1rem">${def.e}</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.05em;color:#93c5fd">${def.name}</div>
        <div style="font-size:.66rem;color:${hired?'#34d399':'rgba(255,255,255,.65)'}">${sub}</div>
        <div style="font-size:.58rem;color:rgba(255,255,255,.4);max-width:120px;line-height:1.3">${def.desc}</div>
      </button>`;
    };
    t.innerHTML=`<div style="max-width:460px;text-align:center;padding:26px 20px">
      <div style="font-size:2rem;margin-bottom:4px">👥</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.18em;color:#93c5fd;margin-bottom:6px">BUILD YOUR TEAM</div>
      <p style="color:rgba(255,255,255,.6);margin:0 0 16px;font-size:.8rem">Hire staff to help run the floor while you focus on service. The clock keeps running!</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">${roleCard('cashier')}${roleCard('clerk')}${roleCard('market')}</div>
      <button onclick="boCloseTeam()" style="padding:10px 22px;border:1px solid rgba(255,255,255,.25);border-radius:11px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer">CLOSE</button>
    </div>`;
  }
  window.boOpenTeam=function(){ if(!G||G.phase!=='play'||LV<1) return; showTeam(); };
  window.boCloseTeam=function(){ const t=document.getElementById('boTeam'); if(t){ t.style.display='none'; t.innerHTML=''; } };
  window.boHire=function(key){
    if(!G||G.phase!=='play') return;
    const def=ROLES[key]; if(!def) return;
    if(G.employees[key] && G.employees[key].hired) return;
    const cost=def.cost(LV);
    if(G.revenue<cost){ floatTxt(0.5,0.5,'NEED $'+cost,'#fca5a5'); G.shake=0.18; return; }
    G.revenue-=cost;
    G.employees[key]={hired:true,energy:100,t:0};
    bcAdd('employees',key);
    burst(0.5,0.5,'#60a5fa',14); G.flash=0.2;
    showTeam();
  };

  // ── PRODUCT LAUNCH (GDD §7.3, L3) — one-shot: unlocks a premium menu
  // item at a higher price for the rest of the match. Premium Lover
  // customers specifically seek it out once live.
  window.boLaunch=function(){
    if(!G||G.phase!=='play'||LV<2) return;
    if(G.premiumUnlocked){ floatTxt(0.5,0.5,'ALREADY LAUNCHED','#c084fc'); return; }
    const cost=300+LV*100;
    if(G.revenue<cost){ floatTxt(0.5,0.5,'NEED $'+cost,'#fca5a5'); G.shake=0.18; return; }
    G.revenue-=cost;
    const shop=SHOPS[G.shopKey]||SHOPS.burger;
    G.premiumUnlocked=true;
    G.premiumItem=shop.menu[Math.floor(Math.random()*shop.menu.length)];
    bcAdd('products','launch');
    G.flash=0.4; burst(0.5,0.3,'#fbbf24',24); floatTxt(0.5,0.28,'🚀 NEW PRODUCT LAUNCHED!','#fbbf24');
    const lb=document.getElementById('boLaunchBtn'); if(lb){ lb.disabled=true; lb.style.opacity=.4; lb.textContent='✨ LAUNCHED'; }
  };

  // ── RANDOM EVENTS engine (GDD §6.7) ──────────────────────────────────
  function scheduleNextEvent(){ if(!G) return; G.eventT=Math.max(7,16-LV*3)+Math.random()*(9-LV); }
  function armEvent(){
    if(!G||G.phase!=='play'||G.activeEvent) return;
    const pool=EVENT_DEFS.filter(d=>d.minLV<=LV);
    if(!pool.length){ scheduleNextEvent(); return; }
    const weighted=pool.map(d=>({d,w:d.cat==='Crisis'?0.35:1}));
    let total=0; weighted.forEach(x=>total+=x.w);
    let r=Math.random()*total, pick=weighted[0].d;
    for(const x of weighted){ if(r<=x.w){ pick=x.d; break; } r-=x.w; }
    if(pick.auto){ applyAutoEvent(pick); scheduleNextEvent(); return; }
    G.activeEvent={def:pick,t:pick.windowT};
    const btn=document.getElementById('boEventBtn'); if(btn) btn.style.display='block';
    syncEventBtn();
    bcAdd('events',pick.id);
  }
  function applyAutoEvent(def){
    G.mkt=Math.max(G.mkt,7);
    G.flash=0.3; floatTxt(0.5,0.3,def.icon+' '+def.title,'#f9a8d4'); burst(0.5,0.3,'#f9a8d4',14);
    bcAdd('events',def.id);
  }
  function syncEventBtn(){
    if(!G||!G.activeEvent) return;
    const ev=G.activeEvent, btn=document.getElementById('boEventBtn'); if(!btn) return;
    const urgent=ev.t<2;
    btn.textContent=ev.def.icon+' '+ev.def.title+' ('+Math.max(0,ev.t).toFixed(1)+'s)';
    btn.style.borderColor=urgent?'#f87171':'#fbbf24';
    btn.style.boxShadow=urgent?'0 0 26px rgba(248,113,113,.75)':'0 0 22px rgba(251,191,36,.6)';
  }
  function applyFx(fx){
    if(!fx||!G) return;
    if(fx.happy) G.happy=Math.max(0,Math.min(100,G.happy+fx.happy));
    if(fx.reputation) G.reputation=Math.max(0,Math.min(100,G.reputation+fx.reputation));
    if(fx.stock) G.stock=Math.max(0,Math.min(STOCK_CAP,G.stock+fx.stock));
    if(fx.revenue) G.revenue=Math.max(0,G.revenue+fx.revenue);
  }
  function bumpCounter(key){ if(window.state){ state[key]=(state[key]||0)+1; } }
  function resolveEventSuccess(){
    if(!G||!G.activeEvent) return;
    const ev=G.activeEvent.def;
    applyFx(ev.okFx);
    floatTxt(0.5,0.32,ev.okMsg,'#34d399'); burst(0.5,0.32,'#34d399',16); G.flash=0.25;
    if(ev.cat==='Operational'||ev.cat==='Supply') bumpCounter('bo_opEventsResolved');
    if(ev.isCompetitor) bumpCounter('bo_competitorCountered');
    if(ev.isCrisis) bumpCounter('bo_crisisResolved');
    clearEvent();
  }
  function failEvent(){
    if(!G||!G.activeEvent) return;
    const ev=G.activeEvent.def;
    applyFx(ev.failFx);
    floatTxt(0.5,0.32,ev.failMsg,'#f87171'); G.shake=Math.max(G.shake||0,ev.severe?0.4:0.22);
    clearEvent();
  }
  function clearEvent(){
    G.activeEvent=null;
    const btn=document.getElementById('boEventBtn'); if(btn) btn.style.display='none';
    scheduleNextEvent();
  }
  window.boResolveEvent=function(){ if(!G||!G.activeEvent) return; resolveEventSuccess(); };

  function update(dt,W,H){
    G.time-=dt; if(G.time<=0){ G.time=0; return end(); }
    const tEl=document.getElementById('boTime'); if(tEl){ tEl.textContent=Math.ceil(G.time)+'s'; tEl.style.color=G.time<15?'#f87171':'#fbbf24'; }
    // KNOWLEDGE GATE every ~18s — pauses everything (customers/patience/timer freeze)
    G.gateT-=dt; if(G.gateT<=0){ return openGate(); }
    const prog=1-(G.time/L().round);

    // spawn customers (marketing power-up speeds spawns; per-level spawnMul
    // makes higher levels throw customers at you faster)
    G.spawnT-=dt*(G.mkt>0?1.8:1);
    if(G.spawnT<=0){
      G.spawnT=Math.max(0.9, 2.3 - prog*1.3) * (0.7+Math.random()*0.6) * L().spawnMul;
      spawnCustomer(prog);
      // occasional power-up gift instead of plain spawn pacing
    }

    // employees + random events run continuously, real-time (GDD §4.1 —
    // events "force re-prioritization" while everything else keeps going)
    updateEmployees(dt);
    if(G.activeEvent){ G.activeEvent.t-=dt; syncEventBtn(); if(G.activeEvent.t<=0) failEvent(); }
    else { G.eventT-=dt; if(G.eventT<=0) armEvent(); }

    let anyServedThisFrame=false;
    for(const c of G.queue){
      // slide-in
      if(c.state==='in'){ c.enter+=dt*3.2; c.x += (c.tx-c.x)*Math.min(1,dt*8); if(c.enter>=1){ c.state='wait'; c.x=c.tx; } }
      else if(c.state==='wait'){
        c.bob+=dt*4;
        c.pat -= dt*(G.turbo>0?0.55:1) * (0.85);
        if(c.pat<=0){ // walked off angry
          c.pat=0; c.state='angry'; c.leave=0; G.combo=0; G.lost++;
          G.happy=Math.max(0, G.happy-16); G.reputation=Math.max(0,G.reputation-8); G.shake=0.32;
          burst(c.tx, QY-0.04, '#f87171', 12); floatTxt(c.tx, QY-0.1, '😡 LEFT', '#fca5a5');
        }
      }
      else if(c.state==='served'){ c.leave+=dt; c.cy -= dt*0.25; if(c.leave>0.6) c.dead=1; anyServedThisFrame=true; }
      else if(c.state==='angry'){ c.leave+=dt; c.x += dt*0.4; if(c.leave>0.6) c.dead=1; }
    }
    G.queue=G.queue.filter(c=>!c.dead);

    // power-up flavor: auto-grant on combo streaks (cheap + satisfying)
    if(G.combo>0 && G.combo%9===0 && G.turbo<=0 && Math.random()<0.5){ G.turbo=6; floatTxt(0.5,0.42,'⚡ TURBO SERVICE','#67e8f9'); }
    if(G.served>0 && G.served%12===0 && G.mkt<=0){ G.mkt=6; floatTxt(0.5,0.42,'📣 RUSH HOUR','#f9a8d4'); }

    if(G.turbo>0) G.turbo-=dt;
    if(G.mkt>0) G.mkt-=dt;
    if(G.shake>0) G.shake-=dt; if(G.flash>0) G.flash-=dt;
    if(G.restockPulse>0) G.restockPulse-=dt;

    // particles / floats / coins
    for(const p of G.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=1.2*dt; p.life-=dt; }
    G.parts=G.parts.filter(p=>p.life>0);
    for(const f of G.floats){ f.y-=dt*0.13; f.life-=dt; }
    G.floats=G.floats.filter(f=>f.life>0);
    for(const co of G.coins){ co.t+=dt*2.2; co.x=co.sx+(co.dx-co.sx)*ease(co.t); co.y=co.sy+(co.dy-co.sy)*ease(co.t)-Math.sin(Math.min(1,co.t)*3.14)*0.12; if(co.t>=1) co.dead=1; }
    G.coins=G.coins.filter(c=>!c.dead);

    // HUD sync
    setTxt('boStock',G.stock);
    setTxt('boHappyN',Math.round(G.happy)+'%');
    setTxt('boRepN',starsString(G.reputation));
    setTxt('boCombo','x'+G.combo);
    setTxt('boRevTxt','$'+G.revenue);
    setTxt('boGoalTxt',L().goal);
    setTxt('boRestockCostTxt',L().restockCost);
    const rb=document.getElementById('boRevBar'); if(rb) rb.style.width=Math.min(100,G.revenue/L().goal*100)+'%';
    const hb=document.getElementById('boHappyBar'); if(hb) hb.style.width=G.happy+'%';
    const sc=document.getElementById('boStock'); if(sc) sc.style.color = G.stock<=2 ? '#f87171' : '#fbbf24';
    // restock button glow when low
    const rbtn=document.getElementById('boRestock');
    if(rbtn){ const lit=G.stock<=3||G.restockPulse>0; rbtn.style.boxShadow= lit ? '0 0 26px rgba(251,191,36,.85),0 6px 22px rgba(168,85,247,.5)' : '0 6px 22px rgba(168,85,247,.5)'; rbtn.style.transform= lit?'scale(1.05)':'none'; }

    if(G.revenue>=L().goal) return end(true);
    if(G.happy<=0) return end(false);
  }
  function ease(t){ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); }
  function starsString(rep){ const n=Math.max(0,Math.min(5,Math.round(rep/20))); return '★'.repeat(n)+'☆'.repeat(5-n); }

  // stars now twinkle in gold/teal/purple — all three stay ACCENTS on the
  // navy sky instead of the old lavender/fuchsia pair that made the whole
  // field read as purple-family (GDD §16.1)
  const _bzStars=Array.from({length:45},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.0+0.25,s:Math.random()*0.45+0.2,c:['#5eead4','#fde68a','#c084fc'][Math.floor(Math.random()*3)]}));
  const _bzMotes=Array.from({length:12},()=>({x:Math.random(),y0:Math.random(),spd:0.015+Math.random()*0.02,r:0.6+Math.random()*1.1,ph:Math.random()*6.28}));
  // resolves the CURRENT shop's own tint/category (falls back to a neutral
  // purple accent pre-pick, on the picker screen, when no shop is chosen yet)
  function shopTheme(){ const s=G&&SHOPS[G.shopKey]; return s?{tint:s.tint||'#a855f7',cat:s.cat||'food'}:{tint:'#a855f7',cat:'food'}; }
  function _bzBg(ctx,W,H,counterY,now){
    const theme=shopTheme();
    // deep NAVY gradient sky (GDD §16.1 — navy is the backdrop; gold/teal/
    // purple are secondary accents layered on top, not the base fill)
    const bg=ctx.createLinearGradient(0,0,0,counterY);
    bg.addColorStop(0,'#050a18'); bg.addColorStop(0.5,'#0a1128'); bg.addColorStop(1,'#0d1730');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,counterY);
    // floor zone tinted with THIS shop's own accent colour (GDD §8.2 — this,
    // plus the ledge rim + props below, is what makes each of the 9 shops
    // read as a distinct interior instead of one shared backdrop)
    const flr=ctx.createLinearGradient(0,counterY-20,0,H);
    flr.addColorStop(0,hx2rgba(theme.tint,.22)); flr.addColorStop(1,hx2rgba(theme.tint,.05));
    ctx.fillStyle=flr; ctx.fillRect(0,counterY-20,W,H-counterY+20);
    // twinkling stars in the "sky" area
    const t=now/1000;
    for(const st of _bzStars){
      const tw=0.25+0.45*Math.sin(t*st.s+st.x*6.28);
      ctx.globalAlpha=tw*0.65; ctx.fillStyle=st.c;
      ctx.beginPath(); ctx.arc(st.x*W,st.y*(counterY*0.9),st.r,0,6.28); ctx.fill();
    }
    // slow-drifting gold motes — cheap premium sparkle (time-based, not frame-mutated)
    for(const m of _bzMotes){
      const y=((m.y0 - t*m.spd)%1+1)%1;
      ctx.globalAlpha=0.3+0.22*Math.sin(t*0.6+m.ph); ctx.fillStyle='#fde68a';
      ctx.beginPath(); ctx.arc(m.x*W, y*counterY*0.95, m.r, 0, 6.28); ctx.fill();
    }
    ctx.globalAlpha=1;
    // top glow arc — single soft gold accent light (was purple; a base fill
    // shouldn't also own the "hero" glow, so this now carries the gold accent)
    const tg=ctx.createRadialGradient(W/2,-20,0,W/2,-20,W*0.8);
    tg.addColorStop(0,'rgba(251,191,36,.08)'); tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg; ctx.fillRect(0,0,W,counterY);
    // pseudo-3D counter ledge (bevelled bar instead of a flat line — cheap
    // depth cue standing in for a true isometric counter model); its rim
    // now carries THIS shop's tint so the counter itself signals identity
    const ledgeH=14;
    const ledgeGrad=ctx.createLinearGradient(0,counterY-4,0,counterY+ledgeH);
    ledgeGrad.addColorStop(0,hx2rgba(theme.tint,.9)); ledgeGrad.addColorStop(0.15,hx2rgba(theme.tint,.5)); ledgeGrad.addColorStop(1,'rgba(5,10,24,.2)');
    ctx.fillStyle=ledgeGrad; ctx.fillRect(0,counterY-4,W,ledgeH);
    ctx.shadowColor=theme.tint; ctx.shadowBlur=14;
    ctx.fillStyle=hx2rgba(theme.tint,.85); ctx.fillRect(0,counterY-4,W,2.5);
    ctx.shadowBlur=0;
    drawShopProps(ctx,W,H,counterY,theme);
  }

  // ── per-shop props (GDD §8.2 "a distinct interior, props, and palette" —
  // previously all 9 businesses shared one identical gradient/star-field/
  // ledge, differing only by the central emoji + name label). Three cheap
  // silhouette archetypes by category (food counter / tech shelving /
  // boutique arch), recoloured per shop's own tint, PLUS two faint props
  // pulled straight from that shop's own `menu` array — so every shop's
  // props are automatically unique with zero extra content to author.
  function drawShopProps(ctx,W,H,counterY,theme){
    const shop=G&&SHOPS[G.shopKey]; if(!shop) return;
    const cx=W*0.5;
    ctx.save();
    ctx.fillStyle=hx2rgba(theme.tint,.16); ctx.strokeStyle=hx2rgba(theme.tint,.55); ctx.lineWidth=2;
    if(theme.cat==='tech'){
      // angular shelf/monitor panels flanking the stand — reads as an
      // electronics counter rather than a food stand
      [-1,1].forEach(side=>{
        const x=cx+side*96-22;
        roundRect(ctx,x,counterY-58,44,40,5); ctx.fill(); ctx.stroke();
        ctx.fillStyle=hx2rgba(theme.tint,.3); ctx.fillRect(x+6,counterY-52,32,4); ctx.fillStyle=hx2rgba(theme.tint,.16);
      });
    } else if(theme.cat==='boutique'){
      // soft rounded arch/canopy over the stand, with two petal accents
      ctx.beginPath(); ctx.moveTo(cx-96,counterY-14); ctx.quadraticCurveTo(cx,counterY-100,cx+96,counterY-14); ctx.stroke();
      [-1,1].forEach(side=>{ ctx.beginPath(); ctx.arc(cx+side*96,counterY-14,7,0,6.28); ctx.fill(); });
    } else {
      // scalloped awning over a food/drink stand
      const aw=126, ax=cx-aw/2, ay=counterY-46;
      ctx.beginPath(); ctx.moveTo(ax,ay+18);
      for(let i=0;i<=6;i++){ const sx=ax+i*(aw/6); ctx.quadraticCurveTo(sx+aw/12,ay+(i%2?26:8),sx+aw/6,ay+18); }
      ctx.lineTo(ax+aw,ay+18); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // two faint background props straight from THIS shop's own menu (minus
    // the emoji already used as its sign) — automatically shop-specific
    const props=shop.menu.filter(m=>m!==shop.e).slice(0,2);
    ctx.globalAlpha=0.16; ctx.font='40px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    if(props[0]) ctx.fillText(props[0], cx-150, counterY-40);
    if(props[1]) ctx.fillText(props[1], cx+150, counterY-40);
    ctx.globalAlpha=1;
    ctx.restore();
  }

  function renderEmployees(ctx,W,H,counterY){
    if(LV<1) return;   // hiring unlocks L2+ (GDD §7.2) — don't tease silhouettes players can't act on yet
    // Fixed offset below the ledge (NOT proportional to H) — the shop emoji/
    // label below use a height-scaled midpoint that, on short viewports, can
    // creep close to the bottom action bar; anchoring employees just under
    // the counter line keeps them clear of that on every realistic portrait
    // height (verified against ~660-830px tall phones) without touching the
    // pre-existing emoji/label positions.
    const cy=counterY+26;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ['cashier','clerk','market'].forEach((key,i)=>{
      const def=ROLES[key]; const e=G.employees[key]; const x=W*0.5+(i-1)*74;
      ctx.globalAlpha = (e&&e.hired) ? 1 : 0.22;
      ctx.font='22px serif'; ctx.fillText(def.e, x, cy);
      if(e&&e.hired){
        const frac=e.energy/100;
        ctx.strokeStyle = frac>0.6?'#34d399':frac>0.3?'#fbbf24':'#f87171';
        ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.arc(x,cy,16,-Math.PI/2,-Math.PI/2+frac*6.283); ctx.stroke();
      }
    });
    ctx.globalAlpha=1;
  }

  function render(ctx,W,H,now){
    const counterY=QY*H+44;
    _bzBg(ctx,W,H,counterY,now);
    let ox=0,oy=0; if(G.shake>0){ ox=(Math.random()-.5)*G.shake*20; oy=(Math.random()-.5)*G.shake*20; }
    ctx.save(); ctx.translate(ox,oy);
    if(G.flash>0){ ctx.fillStyle='rgba(251,191,36,'+(G.flash*0.22)+')'; ctx.fillRect(0,0,W,H); }

    // shop sign (your stand)
    const shop=SHOPS[G.shopKey];
    if(shop){
      // Fixed offsets below the ledge (not H-scaled) — on shorter portrait
      // phones the old H-scaled midpoint pushed this label low enough to
      // collide with the bottom action bar; verified clear across ~640-830px.
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='34px serif'; ctx.globalAlpha=0.9; ctx.fillText(shop.e, W*0.5, counterY+50); ctx.globalAlpha=1;
      ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font="600 11px 'Orbitron',sans-serif"; ctx.fillText('YOUR '+shop.name, W*0.5, counterY+80);
      renderEmployees(ctx,W,H,counterY);
    }

    ctx.textAlign='center'; ctx.textBaseline='middle';
    // customers
    for(const c of G.queue){
      const x=c.x*W, y=c.cy*H;
      let alpha=1, scale=1;
      if(c.state==='in') alpha=Math.min(1,c.enter);
      if(c.state==='served'){ alpha=Math.max(0,1-c.leave/0.6); scale=1+c.leave*0.3; }
      if(c.state==='angry'){ alpha=Math.max(0,1-c.leave/0.6); }
      ctx.globalAlpha=alpha;
      const bob=c.state==='wait'?Math.sin(c.bob)*2:0;

      // order bubble above head
      if(c.state==='wait'||c.state==='in'){
        const by=y-46+bob;
        ctx.fillStyle='rgba(255,255,255,.95)';
        roundRect(ctx, x-20, by-20, 40, 34, 9); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x-6,by+13); ctx.lineTo(x+6,by+13); ctx.lineTo(x,by+21); ctx.closePath(); ctx.fill();
        ctx.font='20px serif'; ctx.fillText(c.order, x, by-2);
        if(c.personality){ ctx.font='13px serif'; ctx.fillText(c.personality.icon, x+17, by-17); }
        if(c.premium){ ctx.font='13px serif'; ctx.fillText('✨', x-17, by-17); }
      }

      // body
      ctx.save(); ctx.translate(x,y+bob); ctx.scale(scale,scale);
      if(c.state==='served'){ ctx.shadowColor='#34d399'; ctx.shadowBlur=20; }
      else if(c.state==='angry'){ ctx.shadowColor='#ef4444'; ctx.shadowBlur=18; }
      else if(c.personality && c.personality.id==='vip'){ ctx.shadowColor='#fbbf24'; ctx.shadowBlur=16; }
      ctx.font='46px serif'; ctx.fillText(c.state==='angry'?'😡':c.face, 0, 0);
      ctx.shadowBlur=0; ctx.restore();

      // patience bar under feet
      if(c.state==='wait'){
        const pf=c.pat/c.patMax, bw=46, bx=x-bw/2, byb=y+30+bob;
        ctx.globalAlpha=alpha; ctx.fillStyle='rgba(0,0,0,.4)'; roundRect(ctx,bx,byb,bw,6,3); ctx.fill();
        const col = pf>0.5?'#34d399':pf>0.25?'#fbbf24':'#f87171';
        ctx.fillStyle=col; roundRect(ctx,bx,byb,bw*pf,6,3); ctx.fill();
      }
      ctx.globalAlpha=1;
    }

    // particles
    for(const p of G.parts){ ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); }
    ctx.globalAlpha=1;
    // flying coins
    ctx.font='20px serif';
    for(const co of G.coins){ ctx.globalAlpha=Math.max(0,1-co.t*0.3); ctx.fillText('🪙', co.x*W, co.y*H); }
    ctx.globalAlpha=1;

    // float texts
    for(const f of G.floats){ ctx.globalAlpha=Math.max(0,f.life/0.9); ctx.fillStyle=f.c; ctx.font='800 '+(f.big?22:15)+"px 'Inter',sans-serif"; ctx.fillText(f.t,f.x*W,f.y*H); }
    ctx.globalAlpha=1;

    // power-up status badges (shifted down from the original y=200/218 so
    // they never collide with the new event banner sitting at top:184px)
    let badgeX=22;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    if(G.turbo>0){ ctx.font="700 12px 'Orbitron',sans-serif"; ctx.fillStyle='#67e8f9'; ctx.fillText('⚡ TURBO '+Math.ceil(G.turbo), badgeX, 238); }
    if(G.mkt>0){ ctx.font="700 12px 'Orbitron',sans-serif"; ctx.fillStyle='#f9a8d4'; ctx.fillText('📣 RUSH '+Math.ceil(G.mkt), badgeX, G.turbo>0?256:238); }
    ctx.restore();
  }

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function burst(x,y,c,n){ for(let i=0;i<n;i++){ const a=Math.random()*7,s=0.12+Math.random()*0.45; G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.18,s:2+Math.random()*3,c,life:0.45+Math.random()*0.3,max:0.75}); } }
  function flyCoins(x,y,n){ for(let i=0;i<n;i++){ G.coins.push({sx:x+(Math.random()-.5)*0.05,sy:y,dx:0.5+(Math.random()-.5)*0.18,dy:0.06,x,y,t:-i*0.08}); } }
  function floatTxt(x,y,t,c){ G.floats.push({x,y,t,c,life:0.9,big:t.indexOf('COMBO')>=0||t.indexOf('TURBO')>=0||t.indexOf('RUSH')>=0}); }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

  // ── Business Collection Book (GDD §10.4) — tracks first-time discoveries
  // (shops played, employee roles hired, event types survived, customer
  // personalities served, products launched). New discoveries THIS match
  // feed straight into cvAwardGame's `collectibles` coin bonus.
  function bcAdd(cat,id){
    if(!window.state) return false;
    state.bo_collection = state.bo_collection || {shops:[],employees:[],events:[],personalities:[],products:0};
    const bucket=state.bo_collection[cat];
    if(Array.isArray(bucket)){
      if(bucket.indexOf(id)>=0) return false;
      bucket.push(id); if(G) G.newDiscoveries=(G.newDiscoveries||0)+1; return true;
    } else if(cat==='products'){
      state.bo_collection.products=(state.bo_collection.products||0)+1; if(G) G.newDiscoveries=(G.newDiscoveries||0)+1; return true;
    }
    return false;
  }

  // ── CEO Wall (GDD §10.2) — a handful of lifetime achievement banners,
  // re-scaled sensibly for this game's compressed per-match economy
  // (e.g. "First Million" → "First Big Profit" against cumulative revenue).
  function checkAchievements(){
    if(!window.state) return [];
    const s=state; s.bo_ceoWall=s.bo_ceoWall||[];
    const unlocked=[];
    const grant=(id,label,icon)=>{ if(s.bo_ceoWall.indexOf(id)<0){ s.bo_ceoWall.push(id); unlocked.push({id,label,icon}); } };
    const projRevenue=(s.bo_totalRevenue||0)+G.revenue, projServed=(s.bo_totalServed||0)+G.served;
    if(projRevenue>=5000) grant('first_big_profit','FIRST BIG PROFIT','💰');
    if(projServed>=100) grant('hundred_customers','100 HAPPY CUSTOMERS','😀');
    if((s.bo_opEventsResolved||0)>=5) grant('ops_manager','BEST OPERATIONS MANAGER','⚙️');
    if((s.bo_crisisResolved||0)>=1) grant('disaster_survivor','DISASTER SURVIVOR','🧯');
    if(G.reputation>=100) grant('five_star_streak','FIVE-STAR STREAK','⭐');
    if((s.bo_competitorCountered||0)>=3) grant('marketing_maven','MARKETING MAVEN','📣');
    return unlocked;
  }

  function end(win){
    if(G.phase==='over') return; G.phase='over';
    const score=G.revenue;
    const won = win===true || G.revenue>=L().goal;                 // computed BEFORE awards (keep!)
    const lvl=LV+1, isFinal=LV>=2;
    // reputation + happiness BOTH gate star quality, mirroring the GDD's
    // multi-criteria level goals (revenue + happiness% + reputation stars
    // all required — §7.4) instead of happiness alone
    const stars = won ? (G.happy>=80 && G.reputation>=80 ? 3 : G.happy>=50 && G.reputation>=50 ? 2 : 1) : 0;
    const isPerfect = stars===3 && G.reputation>=90;
    let earned=0, newAch=[];
    if(window.state){
      state.gamesDone=state.gamesDone||{}; state.gamesDone['builder:0']=1;
      newAch=checkAchievements();
      state.bo_totalServed=(state.bo_totalServed||0)+G.served;
      state.bo_totalRevenue=(state.bo_totalRevenue||0)+G.revenue;
      if(stars>=1 && window.cvAwardGame){
        earned = cvAwardGame('game_bizop',{level:lvl,stars,badge:'Biz Tycoon',is3star:stars===3,isPerfect,isFlagship:true,collectibles:Math.min(6,G.newDiscoveries||0)});
        // Launch Lab hub meter (GDD's Startup Success Meter) — bizop is the
        // Launch Lab flagship, so feed it on every clear (defensively guarded;
        // this service exists in the host app but wasn't wired to any game yet)
        if(window.StartupRewardsService && window.StartupRewardsService.submit){
          try{ StartupRewardsService.submit({pillar:'operations', successDelta: stars*5}); }catch(e){}
        }
      } else if(!won){
        earned=50; state.coins=(state.coins||0)+earned;   // small consolation, no farming value
        if(window.cvAddXP) cvAddXP(10,0); if(window.cvSave) cvSave();
      }
      bmSave();
    }
    const rb=document.getElementById('boRestock'); if(rb) rb.style.display='none';
    const tb=document.getElementById('boTeamBtn'); if(tb) tb.style.display='none';
    const lb=document.getElementById('boLaunchBtn'); if(lb) lb.style.display='none';
    const eb=document.getElementById('boEventBtn'); if(eb) eb.style.display='none';
    const o=document.getElementById('boOver'); if(!o) return; o.style.display='flex';
    const P="padding:13px 26px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#a855f7,#7e22ce);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;font-weight:900;cursor:pointer";
    const GH="padding:13px 26px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;cursor:pointer";
    const title = won ? (isFinal ? '👑 ALL 3 LEVELS MASTERED!' : 'MISSION ACCOMPLISHED — LEVEL '+lvl+' ✔') : 'NICE TRY! POWER UP AND TRY AGAIN';
    const sub = won ? 'REVENUE GOAL SMASHED!' : (G.happy<=0 ? 'OOPS — customers walked out' : "OOPS — the clock beat the goal");
    const achHtml = newAch.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:8px 0">${newAch.map(a=>`<div style="padding:6px 11px;border-radius:10px;background:rgba(251,191,36,.14);border:1px solid rgba(251,191,36,.45);font-size:.58rem;color:#fbbf24;font-family:'Orbitron',sans-serif;letter-spacing:.03em">🏅 ${a.label}</div>`).join('')}</div>` : '';
    const btns = won
      ? (isFinal
          ? '<button onclick="boRestart()" style="'+GH+'">↺ REPLAY L3</button><button onclick="boExit()" style="'+P+'">← HUB</button>'
          : '<button onclick="boNextLevel()" style="'+P+'">LEVEL '+(lvl+1)+' ▶</button><button onclick="boRestart()" style="'+GH+'">↺ REPLAY</button><button onclick="boExit()" style="'+GH+'">← HUB</button>')
      : '<button onclick="boRestart()" style="'+P+'">↺ TRY AGAIN</button><button onclick="boExit()" style="'+GH+'">← HUB</button>';
    o.innerHTML=`<div style="max-width:430px;text-align:center;padding:34px 28px;border:1px solid ${won?'#fbbf24':'#a855f7'};border-radius:22px;background:linear-gradient(160deg,rgba(16,24,52,.97),rgba(5,9,22,.97));box-shadow:0 0 ${won?'90px rgba(251,191,36,.55)':'60px rgba(168,85,247,.45)'};animation:${won?(isFinal?'boMasterPop .6s cubic-bezier(.2,1.4,.4,1)':'boWinPop .5s cubic-bezier(.2,1.4,.4,1)'):'boFadeIn .3s ease'}">
      <style>
        @keyframes boWinPop{0%{transform:scale(.7) rotate(-3deg);opacity:0}60%{transform:scale(1.06) rotate(1deg);opacity:1}100%{transform:scale(1) rotate(0)}}
        @keyframes boMasterPop{0%{transform:scale(.6) rotate(-6deg);opacity:0}55%{transform:scale(1.1) rotate(2deg);opacity:1}75%{transform:scale(.97) rotate(-1deg)}100%{transform:scale(1) rotate(0)}}
        @keyframes boFadeIn{0%{transform:scale(.94);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes boIconPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
      </style>
      <div style="font-size:3rem;margin-bottom:8px${won?';animation:boIconPulse 1.1s ease-in-out infinite':''}">${won?(isFinal?'👑':'🏆'):'💼'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:${won?'#fbbf24':'#c084fc'};margin-bottom:4px">${title}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.16em;color:rgba(255,255,255,.35);margin-bottom:6px">${L().theme}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:8px">${sub}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:2.2rem;margin:0 0 6px;color:#fff">$${score}</h1>
      ${achHtml}
      <p style="color:rgba(255,255,255,.65);margin:0 0 18px;font-size:.9rem">LEVEL ${lvl}/3 · Served ${G.served} · Lost ${G.lost} · Tips $${G.tips} · Best combo x${G.bestCombo}<br>Reputation ${starsString(G.reputation)} · +${earned} 🪙 earned${G.newDiscoveries?(' · +'+G.newDiscoveries+' 📖 new'):''}</p>
      ${btns}
    </div>`;
  }

  // full-screen Knowledge Gate — PAUSES the game (phase!=='play' freezes update())
  // draws from THIS level's shuffled slice (G.facts); once all shown,
  // gates silently skip so no tip ever repeats within or across levels
  function openGate(){
    if(!G||G.phase!=='play') return;
    // don't let the TEAM overlay (also z-index 9) visually fight the gate
    const tm=document.getElementById('boTeam'); if(tm){ tm.style.display='none'; tm.innerHTML=''; }
    if(G.gateIdx>=G.facts.length){ G.gateT=GATE_EVERY; return; }
    G.phase='gate';
    const f=G.facts[G.gateIdx]; G.gateIdx++;
    const o=document.getElementById('boGate'); if(!o){ G.phase='play'; G.gateT=GATE_EVERY; return; }
    o.style.display='flex';
    o.innerHTML=`<div style="max-width:440px;text-align:center;padding:30px 26px;border:1px solid #a855f7;border-radius:22px;background:linear-gradient(160deg,rgba(16,24,52,.97),rgba(5,9,22,.97));box-shadow:0 0 50px rgba(168,85,247,.4);animation:boGateIn .35s ease">
      <style>@keyframes boGateIn{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}</style>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.2em;color:#c084fc;margin-bottom:10px">⛩️ KNOWLEDGE GATE · BIZ TIP · LV ${LV+1}</div>
      <div style="font-size:2.4rem;margin-bottom:8px">${f[0]}</div>
      <p style="font-size:1.02rem;line-height:1.5;color:#fff;margin:0 0 18px">${f[1]}</p>
      <button onclick="boGateGo()" style="padding:13px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#a855f7,#7e22ce);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.12em;font-weight:900;cursor:pointer">GOT IT → +$120</button>
    </div>`;
  }
  window.boGateGo=function(){ if(!G)return; G.revenue+=120; G.gateT=GATE_EVERY; G.phase='play'; G.last=performance.now(); const o=document.getElementById('boGate'); if(o){o.style.display='none';o.innerHTML='';} };

  window.boRestart=function(){ if(G&&G._cleanup)G._cleanup(); const keep=G&&G.shopKey; reset(keep); ['boOver','boGate','boTeam'].forEach(id=>{const o=document.getElementById(id); if(o){o.style.display='none';o.innerHTML='';}}); boBoot(); };
  // advance to the next level IN PLACE: release listeners, re-init state at
  // LV+1, refresh the level chip, then re-boot the canvas (boRestart-style) —
  // mirrors boRestart's _cleanup()-before-reset() ordering so no listeners leak
  window.boNextLevel=function(){
    if(G&&G._cleanup)G._cleanup();
    const keep=G&&G.shopKey;
    LV=Math.min(2,LV+1);
    reset(keep);
    ['boOver','boGate','boTeam'].forEach(id=>{const o=document.getElementById(id); if(o){o.style.display='none';o.innerHTML='';}});
    const lt=document.getElementById('boLvl'); if(lt) lt.textContent='LV '+(LV+1)+'/3';
    boBoot();
  };
  window.boExit=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); G=null; if(window.state)state.viewingWorld=state._returnHub||'builder'; goTo('hub'); };

  // ── DEBUG HOOK (G is module-private — expose read-only state + a
  //    force-win helper for logic-level verification without a browser) ──
  window._boDbg=function(){
    return G ? { LV, phase:G.phase, revenue:G.revenue, goal:L().goal, happy:G.happy, reputation:G.reputation,
                  shopKey:G.shopKey, gateIdx:G.gateIdx, factsThisLevel:G.facts,
                  levelName:L().name, levelTheme:L().theme, isFinal:LV>=2, restockCost:L().restockCost,
                  employees:G.employees, activeEvent:G.activeEvent&&G.activeEvent.def.id,
                  premiumUnlocked:G.premiumUnlocked, newDiscoveries:G.newDiscoveries,
                  collection:window.state&&state.bo_collection, ceoWall:window.state&&state.bo_ceoWall } : { LV, phase:'no-G' };
  };
  // force-win the current level instantly (test-only convenience — bypasses
  // normal play to drive LV 0→1→2 and confirm the mastered banner at LV2)
  window._boForceWin=function(){ if(!G) return false; if(G.phase==='pick') window.boPickShop('burger'); G.revenue=L().goal; G.happy=100; G.reputation=100; end(true); return true; };
})();
