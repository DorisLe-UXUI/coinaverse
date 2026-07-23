/* ════════════════════════════════════════════════════════════════
   GOAL QUEST · BUDGET · PLAN · ACHIEVE — rebuilt to match KaBria's
   35-page Goal Quest GDD v1.0 (Coinaverse · Budgetron Base flagship).
   Core verb = DRAG-TO-ALLOCATE (GDD §7.2): income/bill/event tokens
   fall from the sky; the player routes each into one of 5 buckets —
   SAVINGS · SPENDING · BILLS · EMERGENCY · GOAL — before it lands.
   3 PROGRESSIVE DISTRICTS (GDD §8): Penny Park (foundational) →
   Metro Money District (+Energy, +Happiness, sales/coupons/social
   spend) → Future Finance City (+Credit Score, +Inflation, +Income
   Tax, severe shocks). All 10 power-ups + all 14 real-life events
   from Appendix D are implemented. Knowledge Gates teach the 10
   learning objectives straight out of GDD §4. No real multiplayer/
   IAP/backend — this app is localStorage-only (GDD §10 dropped by
   design; see report). Loads after the main script; overrides the
   stub window.SCREENS.game_goalquest.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='strategist';
  let G=null, raf=null, DI=0;                 // DI = district index 0..2 (session-local, like old LV)

  // ── 3 DISTRICTS (GDD §8 + Appendix B economy config) ─────────────
  //    enabled: which advanced systems are feature-flagged on (GDD §8 "Scaling model")
  //    mix: spawn-roll odds (power/rare/event/bill; income = remainder)
  const DISTRICTS=[
    { id:'penny_park', name:'PENNY PARK', sub:'FOUNDATIONAL DISTRICT', icon:'🐷', col:'#34d399', colSoft:'rgba(52,211,153,.15)',
      blurb:"Floating piggy banks, animated banks & friendly robots. Small surprises only — no debt.",
      roundSec:150, gateEvery:20, fallMul:1.0, spawnMul:1.05,
      lateFeePct:0.10, bufferDiscountPct:0.40, taxPct:0, inflationPerSec:0,
      enabled:{energy:false,happiness:false,credit:false},
      mix:{power:0.06, rare:0.03, event:0.12, bill:0.24},
      goals:[ {id:'bike',label:'Buy a Bicycle',cost:120,icon:'🚲'}, {id:'skates',label:'Roller Skates',cost:85,icon:'⛸️'},
               {id:'tablet',label:'Starter Tablet',cost:150,icon:'📱'}, {id:'save150',label:'Save $150',cost:150,icon:'🐷'} ] },
    { id:'metro_money', name:'METRO MONEY DISTRICT', sub:'INTERMEDIATE DISTRICT', icon:'🚇', col:'#60a5fa', colSoft:'rgba(96,165,250,.15)',
      blurb:'Moving trains, neon ads, a busy economy. Jobs, coupons, subscriptions & impulse pressure.',
      roundSec:170, gateEvery:17, fallMul:1.2, spawnMul:0.9,
      lateFeePct:0.15, bufferDiscountPct:0.32, taxPct:0, inflationPerSec:0,
      enabled:{energy:true,happiness:true,credit:false},
      mix:{power:0.05, rare:0.025, event:0.16, bill:0.30},
      goals:[ {id:'pc',label:'Gaming PC',cost:850,icon:'🖥️'}, {id:'laptop',label:'New Laptop',cost:650,icon:'💻'},
               {id:'trip',label:'School Trip',cost:400,icon:'🚌'}, {id:'save1000',label:'Save $1,000',cost:1000,icon:'🏦'} ] },
    { id:'future_finance', name:'FUTURE FINANCE CITY', sub:'ADVANCED DISTRICT', icon:'🌆', col:'#a78bfa', colSoft:'rgba(167,139,250,.16)',
      blurb:'Flying cars, digital banks, investment towers. Inflation, taxes & credit score are real now.',
      roundSec:190, gateEvery:14, fallMul:1.42, spawnMul:0.76,
      lateFeePct:0.20, bufferDiscountPct:0.25, taxPct:0.12, inflationPerSec:0.0028,
      enabled:{energy:true,happiness:true,credit:true},
      mix:{power:0.04, rare:0.02, event:0.20, bill:0.34},
      goals:[ {id:'car',label:'First Car',cost:1800,icon:'🚗'}, {id:'startup',label:'Business Startup',cost:1500,icon:'🚀'},
               {id:'vacation',label:'Family Vacation',cost:1200,icon:'🏖️'}, {id:'college',label:'College Fund',cost:2000,icon:'🎓'} ] },
  ];
  function D(){ return DISTRICTS[DI]; }

  // ── 5 allocation buckets — exact order per GDD §7.2 buckets[] ────
  const BUCKETS=['SAVINGS','SPENDING','BILLS','EMERGENCY','GOAL'];
  const BUCK_ICON=['🏦','🛍️','🧾','🛟','🎯'];
  const BUCK_COL=['#60a5fa','#f472b6','#fbbf24','#34d399','#a78bfa'];
  const SAVINGS=0, SPENDING=1, BILLS=2, EMERGENCY=3, GOAL=4;

  // ── income sources (GDD §7.2 token = {id,value,source}) ──────────
  const SOURCES=[ {k:'ALLOWANCE',ic:'🪙',mult:0.8,w:0.40}, {k:'PAYCHECK',ic:'💵',mult:1.3,w:0.32},
                   {k:'WINDFALL',ic:'🎁',mult:1.7,w:0.13}, {k:'SIDE_JOB',ic:'💼',mult:1.15,w:0.15} ];
  const BILL_DEFS=[ {label:'Rent',ic:'🏠'}, {label:'Electric Bill',ic:'⚡'}, {label:'Phone Bill',ic:'📱'},
                     {label:'Internet',ic:'🌐'}, {label:'Water Bill',ic:'🚰'}, {label:'Subscription',ic:'📺'} ];

  // ── 10 power-ups — Appendix D full list, every one implemented ───
  const POWERUPS=[
    {id:'coupon',   name:'Coupon Craze',       icon:'🏷️', effect:'costDown',    dur:20, val:0.30, fx:'Bills cost 30% less'},
    {id:'bonuspay', name:'Bonus Paycheck',     icon:'💵', effect:'income',      dur:0,             fx:'Instant income boost'},
    {id:'freeze',   name:'Freeze Bills',       icon:'🧊', effect:'billFreeze',  dur:30,            fx:'No bills for 30s'},
    {id:'cashback', name:'Cashback Boost',     icon:'💳', effect:'cashback',    dur:22, val:0.20,  fx:'Earn money back on spends'},
    {id:'advisor',  name:'Financial Advisor',  icon:'🤖', effect:'advice',      dur:14,            fx:'Highlights the smart move'},
    {id:'frenzy',   name:'Side Hustle Frenzy', icon:'⚡', effect:'incomeDouble',dur:16,            fx:'Double income from jobs'},
    {id:'auto',     name:'Auto Budget',        icon:'🧠', effect:'autoBudget',  dur:20,            fx:'Auto-allocates for 20s'},
    {id:'timeext',  name:'Time Extension',     icon:'⏰', effect:'timeExt',     dur:0, val:15,     fx:'+15s on the clock'},
    {id:'windfall', name:'Lucky Windfall',     icon:'🍀', effect:'luck',        dur:0,             fx:'Random bonus cash'},
    {id:'savex2',   name:'Savings Multiplier', icon:'✨', effect:'savingsX2',   dur:12,            fx:'Savings count double'},
  ];

  // ── 14 real-life events — Appendix D full list ────────────────────
  //    type: shock(→EMERGENCY) · temptation/seasonal(accept=SPEND/decline=SAVE|GOAL)
  //    bonus/opportunity(routed as bonus income, any bucket) · incomeShock(auto, no token)
  const EVENTS=[
    {id:'bike_repair',   label:'Bike Repair',        icon:'🚲', type:'shock',       minD:0},
    {id:'broken_phone',  label:'Broken Phone',       icon:'📴', type:'shock',       minD:0},
    {id:'birthday',      label:'Birthday Invitation',icon:'🎂', type:'temptation',  minD:0},
    {id:'impulse_shop',  label:'Impulse Shopping',   icon:'🛍️', type:'temptation',  minD:0},
    {id:'good_grades',   label:'Good Grades Bonus',  icon:'🌟', type:'bonus',       minD:0},
    {id:'lost_allow',    label:'Lost Allowance',     icon:'😢', type:'incomeShock', minD:0},
    {id:'game_sale',     label:'Video Game Sale',    icon:'🎮', type:'temptation',  minD:1},
    {id:'fundraiser',    label:'School Fundraiser',  icon:'🎪', type:'seasonal',    minD:1},
    {id:'holiday_shop',  label:'Holiday Shopping',   icon:'🛒', type:'seasonal',    minD:1},
    {id:'side_offer',    label:'Side Job Offer',     icon:'💼', type:'opportunity', minD:1},
    {id:'pet_emerg',     label:'Pet Emergency',      icon:'🐶', type:'shock',       minD:2, severe:true},
    {id:'medical',       label:'Medical Expense',    icon:'🩺', type:'shock',       minD:2, severe:true},
    {id:'family_emerg',  label:'Family Emergency',   icon:'🚨', type:'shock',       minD:2, severe:true},
  ];

  // short effect text per event archetype (GDD §9.3/§13 "Effect on the
  // run" column) — shown on hover for the illustrated event badges below
  const EVENT_TYPE_BLURB={
    shock:       'Sudden cost — an Emergency Fund softens it',
    temptation:  'Tempting want — tests delayed gratification',
    seasonal:    'Recurring seasonal spend pressure',
    bonus:       'Free reward income — catch it',
    opportunity: 'Extra income if you catch it',
    incomeShock: 'Temporary income dip',
  };

  /* ══════════════════════ HAND-AUTHORED MASCOT / BADGE ART ═══════════
     hand-authored mascot/badge art — replace with Kabria's final character
     art if she provides one. Direction per GDD §14.2 ("Friendly robots &
     Coinaverse mascots as coaches") and §14.1 (goal card = hero element;
     Power-Ups grid = "10 power-up tiles with icon + effect"). Built as
     inline SVG so there's no image-hosting/loading pipeline; cached as
     Image() objects for canvas re-use (see badgeImg). Paid AI image-gen
     (Higgsfield MCP) was attempted first and returned "Out of credits in
     the selected workspace" — this is the fallback, same pattern used for
     Stock Surge's 13 CEO portraits earlier today. ════════════════════ */
  const _badgeImgCache={};
  function _uid(){ return 'g'+Math.random().toString(36).slice(2,9); }
  function svgDataURI(svg){ return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); }
  function badgeImg(key,svgStr){
    if(!_badgeImgCache[key]){ const im=new Image(); im.src=svgDataURI(svgStr); _badgeImgCache[key]=im; }
    return _badgeImgCache[key];
  }

  // circular medallion frame — glyphInner is raw SVG markup (paths/shapes
  // for power-ups, or an emoji <text> for events/goals); used everywhere
  // a power-up/event/goal used to be "raw emoji in a plain rounded div"
  function badgeMedallion(glyphInner,ring,base1,base2){
    const gid=_uid();
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs><radialGradient id="${gid}" cx="35%" cy="28%" r="78%">
        <stop offset="0%" stop-color="${base2}"/><stop offset="100%" stop-color="${base1}"/>
      </radialGradient></defs>
      <circle cx="32" cy="32" r="29.5" fill="url(#${gid})" stroke="${ring}" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="23.5" fill="none" stroke="${ring}" stroke-opacity=".3" stroke-width="1"/>
      ${glyphInner}
    </svg>`;
  }
  function emojiGlyph(e){ return `<text x="32" y="41" font-size="26" text-anchor="middle" font-family="'Segoe UI Emoji','Apple Color Emoji',sans-serif">${e}</text>`; }

  // custom hand-drawn glyphs — one per power-up (GDD Appendix D full list),
  // built from simple flat shapes (no font/emoji dependency)
  const PU_GLYPH={
    coupon:`<polygon points="17,22 36,22 48,32 36,42 17,42" fill="#fff" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/><circle cx="23" cy="32" r="3" fill="#0f172a"/>`,
    bonuspay:`<rect x="14" y="23" width="36" height="20" rx="4" fill="#fff" stroke="#0f172a" stroke-width="2"/><circle cx="32" cy="33" r="7.5" fill="none" stroke="#0f172a" stroke-width="2"/><text x="32" y="37" font-size="10" font-weight="900" text-anchor="middle" fill="#0f172a" font-family="Arial,sans-serif">$</text>`,
    freeze:`<g stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"><line x1="32" y1="15" x2="32" y2="49"/><line x1="15" y1="32" x2="49" y2="32"/><line x1="20" y1="20" x2="44" y2="44"/><line x1="44" y1="20" x2="20" y2="44"/></g><g fill="#e0f2fe"><circle cx="32" cy="15" r="2.3"/><circle cx="32" cy="49" r="2.3"/><circle cx="15" cy="32" r="2.3"/><circle cx="49" cy="32" r="2.3"/><circle cx="20" cy="20" r="2.1"/><circle cx="44" cy="44" r="2.1"/><circle cx="44" cy="20" r="2.1"/><circle cx="20" cy="44" r="2.1"/></g>`,
    cashback:`<rect x="14" y="22" width="34" height="21" rx="4" fill="#fff" stroke="#0f172a" stroke-width="2"/><rect x="14" y="27" width="34" height="4" fill="#0f172a"/><path d="M39 41 a9 9 0 1 1 3 -6.5" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/><polygon points="44,31 44,38 38,35" fill="#22c55e"/>`,
    advisor:`<rect x="19" y="21" width="26" height="21" rx="7" fill="#c4b5fd" stroke="#0f172a" stroke-width="2"/><circle cx="26" cy="31" r="2.8" fill="#0f172a"/><circle cx="38" cy="31" r="2.8" fill="#0f172a"/><rect x="27" y="36" width="10" height="2.4" rx="1.2" fill="#0f172a"/><line x1="32" y1="21" x2="32" y2="15" stroke="#0f172a" stroke-width="2"/><circle cx="32" cy="13" r="2.8" fill="#fde68a" stroke="#0f172a" stroke-width="1.3"/>`,
    frenzy:`<polygon points="35,14 20,35 29,35 24,50 45,27 34,27" fill="#fde047" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>`,
    auto:`<circle cx="32" cy="32" r="9" fill="none" stroke="#a78bfa" stroke-width="3"/><circle cx="32" cy="32" r="4" fill="#0f172a"/><g fill="#a78bfa"><rect x="29.5" y="13" width="5" height="7" rx="1.6"/><rect x="29.5" y="44" width="5" height="7" rx="1.6"/><rect x="13" y="29.5" width="7" height="5" rx="1.6"/><rect x="44" y="29.5" width="7" height="5" rx="1.6"/><rect x="18.3" y="18.3" width="5" height="7" rx="1.6" transform="rotate(45 20.8 21.8)"/><rect x="40.7" y="18.3" width="5" height="7" rx="1.6" transform="rotate(-45 43.2 21.8)"/><rect x="18.3" y="38.7" width="5" height="7" rx="1.6" transform="rotate(-45 20.8 42.2)"/><rect x="40.7" y="38.7" width="5" height="7" rx="1.6" transform="rotate(45 43.2 42.2)"/></g>`,
    timeext:`<circle cx="29" cy="33" r="14" fill="#fff" stroke="#0f172a" stroke-width="2.5"/><line x1="29" y1="33" x2="29" y2="23" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/><line x1="29" y1="33" x2="36" y2="36" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/><g stroke="#22c55e" stroke-width="3" stroke-linecap="round"><line x1="47" y1="18" x2="47" y2="28"/><line x1="42" y1="23" x2="52" y2="23"/></g>`,
    windfall:`<g fill="#4ade80" stroke="#0f172a" stroke-width="1.5"><circle cx="26" cy="26" r="8"/><circle cx="38" cy="26" r="8"/><circle cx="26" cy="38" r="8"/><circle cx="38" cy="38" r="8"/></g><line x1="32" y1="38" x2="32" y2="50" stroke="#166534" stroke-width="2.5" stroke-linecap="round"/>`,
    savex2:`<path d="M32 13 L35.3 27 L49 30 L35.3 33 L32 47 L28.7 33 L15 30 L28.7 27 Z" fill="#fde047" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><text x="32" y="59" font-size="9" font-weight="900" text-anchor="middle" fill="#fde047" font-family="Arial,sans-serif">×2</text>`,
  };
  function puBadgeSVG(p){ return badgeMedallion(PU_GLYPH[p.id]||emojiGlyph(p.icon),'#a78bfa','#1b1440','#4c3a8f'); }
  function evBadgeSVG(ev){ const ring=ev.type==='shock'?'#f87171':'#f472b6'; return badgeMedallion(emojiGlyph(ev.icon),ring,'#1b1030','#3a1e42'); }
  function goalBadgeSVG(g){ return badgeMedallion(emojiGlyph(g.icon),'#fbbf24','#1b1440','#4c3a8f'); }
  function puBadgeImg(p){ return badgeImg('pu:'+p.id, puBadgeSVG(p)); }
  function evBadgeImg(ev){ return badgeImg('ev:'+ev.id, evBadgeSVG(ev)); }
  function rareBadgeImg(){ return badgeImg('rare', badgeMedallion(`<polygon points="32,14 44,32 32,50 20,32" fill="#fde047" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/><polygon points="32,20 39,32 32,44 25,32" fill="#fff7cc"/>`,'#fde047','#1b1440','#4c3a8f')); }

  // illustrated power-up tile: icon art + name + effect text, styled as a
  // rounded card (GDD §14.1 "Power-Ups grid — 10 power-up tiles with icon
  // + effect") — replaces the old bare-emoji-in-a-div home strip
  function puBadgeCard(p){
    return `<div title="${p.name}" style="width:96px;padding:8px 6px;border-radius:14px;background:linear-gradient(160deg,rgba(167,139,250,.14),rgba(15,23,42,.5));border:1px solid rgba(167,139,250,.35);text-align:center">
      <div style="width:46px;height:46px;margin:0 auto 4px">${puBadgeSVG(p)}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.05em;color:#e9d5ff;line-height:1.3">${p.name}</div>
      <div style="font-size:.44rem;color:rgba(255,255,255,.55);line-height:1.25;margin-top:2px">${p.fx||''}</div>
    </div>`;
  }
  // small illustrated event badge (icon art + label; effect text on hover)
  // for the "BE READY FOR REAL-LIFE EVENTS" strip on the district briefing
  function evBadgeChip(ev){
    return `<div title="${ev.label} — ${EVENT_TYPE_BLURB[ev.type]||''}" style="width:60px;text-align:center">
      <div style="width:34px;height:34px;margin:0 auto 3px">${evBadgeSVG(ev)}</div>
      <div style="font-size:.36rem;color:rgba(255,255,255,.6);line-height:1.15">${ev.label}</div>
    </div>`;
  }

  // ── friendly robot coach mascot (GDD §14.2 "Friendly robots & Coinaverse
  //    mascots as coaches") — shown for late fees, bill warnings & the
  //    Financial Advisor power-up. accent recolors visor/mouth/antenna to
  //    match the moment's tone (amber=warning, violet=advisor default) ──
  function mascotCoachSVG(accent){
    accent=accent||'#a78bfa';
    return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <circle cx="60" cy="74" r="58" fill="#0b1226" stroke="${accent}" stroke-width="3"/>
      <line x1="60" y1="26" x2="60" y2="14" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/>
      <circle cx="60" cy="11" r="4.5" fill="${accent}"/>
      <rect x="34" y="26" width="52" height="40" rx="14" fill="#3b4d8b" stroke="#0f172a" stroke-width="3"/>
      <rect x="42" y="38" width="36" height="16" rx="8" fill="#0f172a"/>
      <circle cx="52" cy="46" r="4" fill="${accent}"/><circle cx="68" cy="46" r="4" fill="${accent}"/>
      <rect x="52" y="58" width="16" height="3" rx="1.5" fill="${accent}"/>
      <rect x="30" y="66" width="60" height="46" rx="16" fill="#2c3a70" stroke="#0f172a" stroke-width="3"/>
      <circle cx="60" cy="88" r="9" fill="#0f172a"/><circle cx="60" cy="88" r="5" fill="${accent}"/>
      <rect x="16" y="74" width="14" height="30" rx="7" fill="#3b4d8b" stroke="#0f172a" stroke-width="3"/>
      <rect x="82" y="52" width="14" height="34" rx="7" fill="#3b4d8b" stroke="#0f172a" stroke-width="3" transform="rotate(-18 89 69)"/>
      <g transform="translate(78,24)">
        <path d="M0 4 h20 v6 c0 7 -4 11 -10 11 s-10 -4 -10 -11 Z" fill="#fbbf24" stroke="#0f172a" stroke-width="2"/>
        <path d="M-6 6 c-6 0 -6 10 0 12" fill="none" stroke="#0f172a" stroke-width="2"/>
        <path d="M26 6 c6 0 6 10 0 12" fill="none" stroke="#0f172a" stroke-width="2"/>
        <rect x="7" y="21" width="6" height="6" fill="#fbbf24" stroke="#0f172a" stroke-width="1.5"/>
        <rect x="1" y="27" width="18" height="4" rx="1.5" fill="#fbbf24" stroke="#0f172a" stroke-width="1.5"/>
      </g>
      <rect x="40" y="110" width="14" height="16" rx="5" fill="#232f5c"/>
      <rect x="66" y="110" width="14" height="16" rx="5" fill="#232f5c"/>
    </svg>`;
  }
  // illustrated boy avatar posed on the goal card (GDD §14.1 "Current goal
  // card ... hero element of the hub") — planner fist-pump pose
  function mascotAvatarSVG(){
    return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
      <circle cx="60" cy="76" r="58" fill="#0f1730" stroke="#fbbf24" stroke-width="3"/>
      <path d="M36 44 q24 -26 48 0 q2 -14 -24 -16 q-26 2 -24 16 Z" fill="#241408" stroke="#0f172a" stroke-width="2"/>
      <circle cx="60" cy="53" r="24" fill="#f2b78c" stroke="#0f172a" stroke-width="3"/>
      <circle cx="51" cy="55" r="3.2" fill="#0f172a"/><circle cx="69" cy="55" r="3.2" fill="#0f172a"/>
      <circle cx="45" cy="61" r="3.3" fill="#f6a56b" opacity=".55"/><circle cx="75" cy="61" r="3.3" fill="#f6a56b" opacity=".55"/>
      <path d="M50 65 q10 8 20 0" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M30 129 q4 -36 30 -38 q30 2 30 38 Z" fill="#1e3a8a" stroke="#0f172a" stroke-width="3"/>
      <path d="M50 91 l10 10 l10 -10" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M86 97 q14 -6 16 -22" fill="none" stroke="#1e3a8a" stroke-width="12" stroke-linecap="round"/>
      <circle cx="102" cy="73" r="8" fill="#f2b78c" stroke="#0f172a" stroke-width="2.5"/>
      <path d="M34 97 q-10 6 -10 20" fill="none" stroke="#1e3a8a" stroke-width="12" stroke-linecap="round"/>
      <circle cx="24" cy="117" r="7" fill="#f2b78c" stroke="#0f172a" stroke-width="2"/>
    </svg>`;
  }

  // coach popup — the mascot + a speech bubble, replacing bare floatTxt for
  // the 3 coaching moments named in the GDD tone rule ("Bots coach...")
  function showCoach(msg,tone){
    if(!G) return;
    G.coachT=3.2;
    const accent = tone==='warn' ? '#fbbf24' : tone==='alert' ? '#f87171' : '#a78bfa';
    const el=document.getElementById('gqCoach'); if(!el) return;
    el.innerHTML=`<div style="width:52px;height:60px;flex-shrink:0">${mascotCoachSVG(accent)}</div>
      <div style="background:rgba(7,13,24,.92);border:1.5px solid ${accent};border-radius:12px;padding:8px 12px;font-size:.62rem;line-height:1.35;color:#fff;max-width:220px;box-shadow:0 0 22px ${accent}55">${msg}</div>`;
    el.style.display='flex';
    requestAnimationFrame(()=>{ el.style.opacity=1; el.style.transform='translateY(0)'; });
  }
  function hideCoach(){
    const el=document.getElementById('gqCoach'); if(el){ el.style.opacity=0; el.style.transform='translateY(10px)'; }
  }

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function fmtM(n){ n=Math.round(n); return (n<0?'-$':'$')+Math.abs(n).toLocaleString(); }
  function career(){ if(!window.state) return {roundsPlayed:0,goalsHit:0,totalSaved:0,bestCombo:0};
    state.gq_career = state.gq_career || {roundsPlayed:0,goalsHit:0,totalSaved:0,bestCombo:0}; return state.gq_career; }
  function unlockedTo(){ return (window.state && state.gameLevels && state.gameLevels['game_goalquest']) || 0; }
  function plannerRank(){ const st=(window.state&&state.gameStars&&state.gameStars['game_goalquest'])||0; const c=career();
    if(st>=3 && c.goalsHit>=8) return 'GOLD PLANNER'; if(st>=2 || c.goalsHit>=3) return 'SILVER PLANNER'; return 'BRONZE PLANNER'; }

  // ── KNOWLEDGE GATE FACTS — sourced directly from GDD §4 Learning
  //    Objectives table (10 concepts) + §5/§13 pillars. 4 per district,
  //    never repeated within a district nor across districts ─────────
  const FACTS=[
    // Penny Park — foundations
    ['🎯','Goal Setting: a clear target keeps every dollar working toward something real.'],
    ['🧠','Budgeting means giving every dollar a job — Savings, Spending, Bills, Emergency, or Goal.'],
    ['🏦','Paying your Goal and Savings first (not last) is how real planners win.'],
    ['🧾','Bills are needs — they come due whether you are ready or not. Pay them first.'],
    // Metro Money — habits & trade-offs
    ['⚖️','Opportunity Cost: every dollar you spend is a dollar that cannot go to your goal.'],
    ['⏳','Delayed Gratification: skipping a tempting want now can get your real goal faster.'],
    ['🛟','An Emergency Fund makes surprise costs smaller — buffered planners lose less.'],
    ['💚','Budget Health drops when spending outpaces saving — watch it turn from green to red.'],
    // Future Finance — pro moves
    ['📋','Prioritization: when a bill and a goal compete for the same dollar, pay the bill first.'],
    ['💼','Income Planning: side hustles and part-time jobs are extra streams toward your goal.'],
    ['📈','Adapting to Change: prices creep up over time (inflation) — smart planners adjust.'],
    ['🔥','A Perfect Budget streak multiplies your rewards — smart choices in a row pay off big.'],
  ];

  // ── BONUS OBJECTIVES — stand-ins for GDD §11 daily/weekly challenges,
  //    scoped per-round since this build has no server/day-cycle ──────
  const OBJPOOL=[
    {id:'no_impulse',  label:'Decline every impulse temptation',  check:g=>g.impulseSeen>0 && g.impulseAccepted===0},
    {id:'save80',      label:'Finish an 80%+ savings rate',       check:g=>g.incomeCaught>0 && (g.toSavingsGoal/g.incomeCaught)>=0.8},
    {id:'no_missed',   label:'Never miss or misfile a bill',      check:g=>g.billsSeen>0 && g.billsMissed===0},
    {id:'one_power',   label:'Win using at most 1 power-up',      check:g=>g.powerupsUsed<=1},
    {id:'combo8',      label:'Reach an 8x Perfect Budget streak', check:g=>g.bestCombo>=8},
    {id:'buffer',      label:'Keep an Emergency Fund all round',  check:g=>g.everBuffered && g.emergencyFund>0},
  ];

  // ═══════════════════════════════ PUBLIC API ═══════════════════════
  window.gqInit=function(){ homeState(); };   // playDistrictGame / hub calls this before goTo — no args, no goTo here

  function homeState(){
    const _cleanup = G && G._cleanup;
    G={ phase:'home', parts:[], floats:[], rings:[], shake:0, flash:0, flashC:'#60a5fa', last:performance.now(), _cleanup };
  }

  window.SCREENS.game_goalquest=function(){
    if(!G) homeState();
    setTimeout(gqBoot,30);
    return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#1e293b,#0f172a 62%,#070d18);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(180deg,rgba(7,13,24,.85),transparent)">
        <button onclick="gqExit()" style="padding:7px 14px;border:1px solid rgba(59,130,246,.4);border-radius:9px;background:rgba(59,130,246,.12);color:#93c5fd;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← BUDGETRON</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.2em;color:#60a5fa;flex:1;text-align:center">🎯 GOAL QUEST · <span id="gqLvl">${DISTRICTS[DI].name}</span></div>
        <div id="gqTime" style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fbbf24;min-width:46px;text-align:right"></div>
      </div>
      <div id="gqHud" style="position:absolute;top:52px;left:0;right:0;z-index:5;display:none">
        <div style="display:flex;gap:8px;padding:0 18px;justify-content:center">
          ${hud('SCORE','gqScore','#93c5fd')}${hud('COMBO','gqCombo','#fbbf24')}${hud('SORTED','gqSorted','#a78bfa')}
        </div>
        <div style="padding:10px 18px 0">
          <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:4px"><span>💙 BUDGET HEALTH</span><span id="gqHpTxt">100%</span></div>
          <div style="height:9px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(248,113,113,.25)"><div id="gqHpBar" style="height:100%;width:100%;background:linear-gradient(90deg,#22c55e,#86efac);transition:width .2s,background .3s"></div></div>
          <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin:8px 0 4px"><span id="gqGoalLbl">🎯 GOAL</span><span id="gqGoalTxt">$0 / $0</span></div>
          <div style="height:11px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(167,139,250,.3)"><div id="gqGoalBar" style="height:100%;width:0%;background:linear-gradient(90deg,#7c3aed,#a78bfa);transition:width .2s"></div></div>
          <div id="gqSubRow" style="display:flex;gap:8px;margin-top:8px"></div>
        </div>
        <div id="gqPowerRow" style="display:flex;gap:6px;padding:8px 18px 0;flex-wrap:wrap"></div>
      </div>
      <canvas id="gqCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>
      <div id="gqEventBanner" style="position:absolute;top:96px;left:50%;transform:translate(-50%,-8px);z-index:6;display:none;padding:8px 18px;border-radius:12px;border:1.5px solid #fbbf24;background:rgba(7,13,24,.9);font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.1em;color:#fde68a;box-shadow:0 0 24px rgba(251,191,36,.35);white-space:nowrap;transition:opacity .25s,transform .25s;opacity:0;pointer-events:none"></div>
      <div id="gqCoach" style="position:absolute;left:14px;bottom:96px;z-index:7;display:none;align-items:flex-end;gap:8px;max-width:300px;opacity:0;transform:translateY(10px);transition:opacity .3s,transform .3s;pointer-events:none"></div>
      <div id="gqHome" style="position:absolute;inset:0;z-index:9;display:none;overflow-y:auto"></div>
      <div id="gqBrief" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(7,13,24,.86);backdrop-filter:blur(5px);padding:18px;overflow-y:auto"></div>
      <div id="gqGate" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(7,13,24,.86);backdrop-filter:blur(5px);padding:22px"></div>
      <div id="gqOver" style="position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;background:rgba(7,13,24,.84);backdrop-filter:blur(4px);overflow-y:auto;padding:18px 0"></div>
    </div>`;
  };
  function hud(label,id,c){ return `<div style="flex:1;max-width:150px;text-align:center;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.18);border-radius:10px;padding:6px"><div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.45)">${label}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:1.1rem;color:${c}">0</div></div>`; }

  // ═══════════════════════════════ BOOT / INPUT ═════════════════════
  function gqBoot(){
    const cv=document.getElementById('gqCanvas'); if(!cv){ return; }
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);

    // ── input: keyboard 1-5 → SAVINGS/SPENDING/BILLS/EMERGENCY/GOAL ──
    const kd=e=>{
      if(!G || G.phase!=='play') return;
      const n={'1':0,'2':1,'3':2,'4':3,'5':4}[e.key];
      if(n!=null){ sortActive(n); e.preventDefault(); }
    };
    window.addEventListener('keydown',kd);

    // ── input: pointer (mouse + touch) — tap a bin to sort the lowest
    //    item, or drag the lowest item into a bin ──────────────────────
    const binAt=(clientX)=>{ const r=cv.getBoundingClientRect(); const fx=(clientX-r.left)/r.width; let bi=0,bd=9; G.bins.forEach((bx,i)=>{ const d=Math.abs(bx-fx); if(d<bd){bd=d;bi=i;} }); return bi; };
    const lowest=()=>{ let lo=null; for(const it of G.items){ if(it.dead||it.kind==='power'||it.kind==='rare') continue; if(!lo||it.y>lo.y) lo=it; } return lo; };
    const down=(clientX,clientY)=>{
      if(!G || G.phase!=='play') return;
      const r=cv.getBoundingClientRect(); const fy=(clientY-r.top)/r.height;
      const fx=(clientX-r.left)/r.width;
      let pick=null,pd=0.12;
      for(const it of G.items){ if(it.dead) continue; const d=Math.hypot(it.x-fx,it.y-fy); if(d<pd){pd=d;pick=it;} }
      if(pick && (pick.kind==='power'||pick.kind==='rare')){ resolve(pick,-1); return; }
      if(pick && fy<0.78){ G.drag=pick; pick.grab=true; }
      else { G.tapBin=binAt(clientX); }
    };
    const move=(clientX,clientY)=>{ if(G && G.drag){ const r=cv.getBoundingClientRect(); G.drag.x=Math.max(0.05,Math.min(0.95,(clientX-r.left)/r.width)); G.drag.y=Math.max(0,Math.min(0.95,(clientY-r.top)/r.height)); } };
    const up=(clientX)=>{
      if(!G) return;
      if(G.drag){ const bi=binAt(clientX); resolve(G.drag,bi); G.drag.grab=false; G.drag=null; }
      else if(G.tapBin!=null){ const lo=lowest(); if(lo) resolve(lo,G.tapBin); G.tapBin=null; }
    };
    const mDown=e=>down(e.clientX,e.clientY);
    const mMove=e=>move(e.clientX,e.clientY);
    const mUp=e=>up(e.clientX);
    const tDown=e=>{ if(e.touches[0]){ down(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); } };
    const tMove=e=>{ if(e.touches[0]){ move(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); } };
    const tUp=e=>{ const t=(e.changedTouches&&e.changedTouches[0]); up(t?t.clientX:0); e.preventDefault(); };
    cv.addEventListener('mousedown',mDown); window.addEventListener('mousemove',mMove); window.addEventListener('mouseup',mUp);
    cv.addEventListener('touchstart',tDown,{passive:false}); cv.addEventListener('touchmove',tMove,{passive:false}); cv.addEventListener('touchend',tUp,{passive:false});

    G._cleanup=()=>{
      window.removeEventListener('resize',size); window.removeEventListener('keydown',kd);
      window.removeEventListener('mousemove',mMove); window.removeEventListener('mouseup',mUp);
      cv.removeEventListener('mousedown',mDown);
      cv.removeEventListener('touchstart',tDown); cv.removeEventListener('touchmove',tMove); cv.removeEventListener('touchend',tUp);
    };
    G.last=performance.now();
    syncVisibility();
    if(G.phase==='home') renderHome();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  function sortActive(bi){
    let lo=null; for(const it of G.items){ if(it.dead||it.kind==='power'||it.kind==='rare') continue; if(!lo||it.y>lo.y) lo=it; }
    if(lo) resolve(lo,bi);
  }

  // toggle which DOM chrome is visible for the current phase
  function syncVisibility(){
    const show=(id,disp)=>{ const el=document.getElementById(id); if(el) el.style.display=disp; };
    const playing = G.phase==='play' || G.phase==='gate';
    show('gqHud', playing?'block':'none');
    show('gqHome', G.phase==='home'?'block':'none');
    show('gqBrief', G.phase==='brief'?'flex':'none');
    show('gqGate', G.phase==='gate'?'flex':'none');
    show('gqOver', G.phase==='over'?'flex':'none');
    const lt=document.getElementById('gqLvl'); if(lt) lt.textContent=D().name;
    const tEl=document.getElementById('gqTime'); if(tEl) tEl.textContent = playing ? Math.ceil(G.time||0)+'s' : '';
    const glbl=document.getElementById('gqGoalLbl'); if(glbl && G.goalDef) glbl.textContent=G.goalDef.icon+' '+G.goalDef.label.toUpperCase();
  }

  // ═══════════════════════════════ HOME / DISTRICT SELECT ═══════════
  function renderHome(){
    const el=document.getElementById('gqHome'); if(!el) return;
    const c=career(); const unlocked=unlockedTo();
    el.innerHTML=`<div style="min-height:100%;display:flex;flex-direction:column;align-items:center;padding:74px 18px 30px;gap:16px">
      <div style="text-align:center">
        <div style="font-family:'Anton',sans-serif;font-size:clamp(1.7rem,5vw,2.6rem);letter-spacing:.03em;background:linear-gradient(90deg,#a78bfa,#fbbf24);-webkit-background-clip:text;background-clip:text;color:transparent">GOAL QUEST</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.28em;color:#93c5fd;margin-top:2px">BUDGET · PLAN · ACHIEVE</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
        ${pill('ROUNDS',c.roundsPlayed)}${pill('GOALS HIT',c.goalsHit)}${pill('BEST STREAK','x'+c.bestCombo)}${pill('RANK',plannerRank())}
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:960px;margin-top:6px">
        ${DISTRICTS.map((d,i)=>{
          const locked=i>0 && unlocked<i;
          return `<div onclick="${locked?'':'gqPickDistrict('+i+')'}" style="width:240px;padding:18px 16px;border-radius:18px;border:1.5px solid ${locked?'rgba(255,255,255,.12)':d.col+'70'};background:linear-gradient(165deg,rgba(20,26,48,.95),rgba(6,10,22,.98));cursor:${locked?'default':'pointer'};text-align:center;position:relative;transition:transform .2s,border-color .2s" ${locked?'':`onmouseover="this.style.borderColor='${d.col}';this.style.transform='translateY(-4px)'" onmouseout="this.style.borderColor='${d.col}70';this.style.transform='none'"`}>
            <div style="font-size:2.3rem;margin-bottom:6px;filter:${locked?'grayscale(1) opacity(.4)':'none'}">${d.icon}</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:.8rem;letter-spacing:.08em;color:${locked?'rgba(255,255,255,.35)':d.col}">${d.name}</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.4);margin:5px 0 8px">${d.sub}</div>
            <div style="font-size:.7rem;line-height:1.5;color:rgba(255,255,255,${locked?'.3':'.65'})">${d.blurb}</div>
            <div style="margin-top:10px;font-family:'Orbitron',sans-serif;font-size:.46rem;letter-spacing:.1em;color:#fbbf24">GOAL $${d.goals[0].cost}-$${d.goals[d.goals.length-1].cost}</div>
            ${locked?`<div style="position:absolute;top:10px;right:12px;font-size:1rem">🔒</div><div style="margin-top:8px;font-size:.52rem;color:rgba(255,255,255,.4)">Fund ${DISTRICTS[i-1].name} to unlock</div>`:''}
          </div>`;}).join('')}
      </div>
      <div style="max-width:640px;text-align:center;font-size:.55rem;letter-spacing:.05em;color:rgba(255,255,255,.4);margin-top:4px">💰 INCOME → 🧾 BILLS/EVENTS → 🖐️ DECIDE → 📊 IMPACT → 🎯 GOAL — sort every falling token into the right bucket before it lands!</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:840px">
        ${POWERUPS.map(p=>puBadgeCard(p)).join('')}
      </div>
    </div>`;
  }
  function pill(label,val){ return `<div style="padding:8px 14px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);text-align:center;min-width:84px"><div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.1em;color:rgba(255,255,255,.45)">${label}</div><div style="font-family:'Anton',sans-serif;font-size:1rem;color:#fbbf24">${val}</div></div>`; }

  window.gqPickDistrict=function(i){
    if(i>0 && unlockedTo()<i) return;
    DI=i; G.phase='brief'; G.goalDef = D().goals[Math.floor(Math.random()*D().goals.length)];
    G.objectives = shuffle(OBJPOOL.slice()).slice(0,3);
    renderBrief(); syncVisibility();
  };
  window.gqBackHome=function(){ G.phase='home'; renderHome(); syncVisibility(); };

  function renderBrief(){
    const el=document.getElementById('gqBrief'); if(!el) return;
    const d=D(); const g=G.goalDef;
    const evPool=EVENTS.filter(e=>e.minD<=DI);
    el.innerHTML=`<div style="max-width:560px;width:100%;text-align:center;padding:28px 26px;border:1.5px solid ${d.col};border-radius:22px;background:linear-gradient(160deg,rgba(30,41,59,.97),rgba(7,13,24,.97));box-shadow:0 0 60px ${d.colSoft};animation:gqGateIn .3s ease">
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.22em;color:${d.col}">${d.icon} ${d.name} · ${d.sub}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin:12px 0 4px">
        <div style="width:60px;height:76px;flex-shrink:0" title="Your Planner">${mascotAvatarSVG()}</div>
        <div style="width:76px;height:76px;flex-shrink:0" title="${g.label}">${goalBadgeSVG(g)}</div>
      </div>
      <div style="font-family:'Anton',sans-serif;font-size:1.6rem;margin-bottom:2px">${g.label}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.9rem;color:#fbbf24;margin-bottom:14px">TARGET: $${g.cost.toLocaleString()}</div>
      <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;font-size:.62rem;color:rgba(255,255,255,.7);margin-bottom:14px">
        <span>💰 INCOME</span><span style="color:rgba(255,255,255,.3)">→</span><span>🧾 BILLS/EVENTS</span><span style="color:rgba(255,255,255,.3)">→</span><span>🖐️ DECIDE</span><span style="color:rgba(255,255,255,.3)">→</span><span>📊 IMPACT</span><span style="color:rgba(255,255,255,.3)">→</span><span>🎯 GOAL</span>
      </div>
      <div style="text-align:left;background:rgba(255,255,255,.04);border-radius:12px;padding:10px 14px;margin-bottom:12px">
        <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.14em;color:#a78bfa;margin-bottom:6px">⭐ BONUS OBJECTIVES</div>
        ${G.objectives.map(o=>`<div style="font-size:.68rem;color:rgba(255,255,255,.75);padding:2px 0">• ${o.label}</div>`).join('')}
      </div>
      <div style="text-align:left;background:rgba(255,255,255,.04);border-radius:12px;padding:10px 14px;margin-bottom:16px">
        <div style="font-family:'Orbitron',sans-serif;font-size:.44rem;letter-spacing:.14em;color:#f87171;margin-bottom:6px">⚠️ BE READY FOR REAL-LIFE EVENTS</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">${evPool.map(e=>evBadgeChip(e)).join('')}</div>
      </div>
      <button onclick="gqStartRound()" style="padding:14px 34px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,${d.col},#1d2b4d);color:#fff;font-family:'Orbitron',sans-serif;font-size:.78rem;letter-spacing:.12em;font-weight:900;cursor:pointer;box-shadow:0 0 30px ${d.colSoft}">▶ PLAY</button>
      <button onclick="gqBackHome()" style="padding:14px 22px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.1em;cursor:pointer">← DISTRICTS</button>
    </div>`;
  }

  // ═══════════════════════════════ ROUND LIFECYCLE ══════════════════
  window.gqStartRound=function(){
    const goalDef=G.goalDef, objectives=G.objectives, _cleanup=G._cleanup;
    G={ phase:'play', goalDef, goalCost:goalDef.cost, goalProgress:0, _cleanup,
        score:0, health:100, combo:0, bestCombo:0, sorted:0, perfect:0,
        time:D().roundSec, spawnT:0.6, last:performance.now(), started:performance.now(),
        items:[], parts:[], floats:[], rings:[],
        spawnAutoT:0, shake:0, flash:0, flashC:'#60a5fa',
        bins:[0.1,0.3,0.5,0.7,0.9], drag:null, tapBin:null,
        gateT:D().gateEvery, gateIdx:0, facts:shuffle(FACTS.slice(DI*4,DI*4+4)),
        fxT:{savingsX2:0,coupon:0,cashback:0,billFreeze:0,advisor:0,frenzy:0,autoBudget:0},
        savings:0, emergencyFund:0, everBuffered:false,
        energy:100, happiness:65, credit:650, inflation:1, noSpendT:0,
        overdueBills:0, missedBillsStreak:0, divertNoted:false,
        billsSeen:0, billsMissed:0, eventsSeen:0, shocksSeen:0, impulseSeen:0, impulseAccepted:0,
        incomeCaught:0, toSavingsGoal:0, rareCollected:0, powerupsUsed:0,
        objectives, objResults:objectives.map(()=>false),
        bannerT:0, coachT:0 };
    // NOTE: input listeners are attached once in gqBoot() and persist for the whole
    // screen visit (the canvas element itself is never recreated by phase changes) —
    // _cleanup is carried over above so gqExit() can still remove them correctly.
    syncVisibility();
    const o=document.getElementById('gqOver'); if(o){ o.style.display='none'; o.innerHTML=''; }
    G.last=performance.now();
  };

  // ═══════════════════════════════ MAIN LOOP ════════════════════════
  function loop(now){
    const cv=document.getElementById('gqCanvas');
    if(!cv || !G){ if(G&&G._cleanup){G._cleanup();} G=null; cancelAnimationFrame(raf); return; }
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    let dt=Math.min(40,now-G.last)/1000; G.last=now;
    if(G.phase==='play'){ update(dt,W,H); }
    else if(G.phase==='home'||G.phase==='brief'||G.phase==='over'){ ambientOnly(dt); }
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  function ambientOnly(dt){
    for(const p of (G.parts||[])){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=1.4*dt; p.life-=dt; }
    G.parts=(G.parts||[]).filter(p=>p.life>0);
  }

  function idealBucket(it){
    if(it.kind==='bill') return BILLS;
    if(it.kind==='event'){ if(it.evType==='shock') return EMERGENCY; return GOAL; }
    return GOAL; // income: smartest placement is always the goal
  }

  function update(dt,W,H){
    const d=D();
    // timer
    G.time-=dt; if(G.time<=0){ G.time=0; return end(false); }
    const tEl=document.getElementById('gqTime'); if(tEl) tEl.textContent=Math.ceil(G.time)+'s';

    // knowledge gate — pauses play, one lesson from this district's shuffled slice of 4
    G.gateT-=dt; if(G.gateT<=0){ openGate(); return; }

    const prog=1-(G.time/d.roundSec);

    // passive systems: energy regen, happiness drift, inflation, banner decay, power-up timers
    if(d.enabled.energy) G.energy=Math.min(100,G.energy+3*dt);
    if(d.enabled.happiness){
      G.noSpendT+=dt;
      if(G.noSpendT>10) G.happiness=Math.max(0,G.happiness-0.6*dt);
      if(G.happiness<25) G.health=Math.max(0,G.health-0.35*dt);
    }
    if(d.inflationPerSec) G.inflation+=d.inflationPerSec*dt;
    if(G.bannerT>0){ G.bannerT-=dt; if(G.bannerT<=0){ const b=document.getElementById('gqEventBanner'); if(b){ b.style.opacity=0; b.style.transform='translate(-50%,-8px)'; } } }
    if(G.coachT>0){ G.coachT-=dt; if(G.coachT<=0) hideCoach(); }
    Object.keys(G.fxT).forEach(k=>{ if(G.fxT[k]>0) G.fxT[k]-=dt; });

    // Auto Budget power-up: gently auto-resolves the lowest item into its ideal bucket
    if(G.fxT.autoBudget>0){
      G.spawnAutoT-=dt;
      if(G.spawnAutoT<=0){
        let lo=null; for(const it of G.items){ if(it.dead||it.kind==='power'||it.kind==='rare'||it.grab) continue; if(!lo||it.y>lo.y) lo=it; }
        if(lo){ resolve(lo, idealBucket(lo)); G.spawnAutoT=0.35; }
      }
    }

    // spawn
    G.spawnT-=dt;
    if(G.spawnT<=0){
      G.spawnT=Math.max(0.28,(0.9-prog*0.45)*d.spawnMul);
      spawnToken(prog);
    }

    const floorY=0.82;
    for(const it of G.items){
      if(it.grab) continue;
      it.y += it.vy*dt*(G.fxT.slow>0?0.45:1);
      it.spin += dt*1.4;
      if(it.y>=floorY){
        it.dead=1;
        if(it.kind==='power'||it.kind==='rare'){ /* no penalty for a missed collectible */ }
        else if(it.kind==='bill'){ missBill(it); }
        else if(it.kind==='event' && it.evType==='shock'){ missShock(it); }
        else if(it.kind==='income'){ G.combo=0; G.shake=Math.max(G.shake,0.28); burst(it.x,floorY,'#f87171',7); floatTxt(it.x,floorY,'Missed!','#fca5a5'); }
        // temptation/seasonal/bonus/opportunity tokens that fall = simply ignored, no penalty
      }
    }
    G.items=G.items.filter(i=>!i.dead);

    if(G.shake>0) G.shake-=dt; if(G.flash>0) G.flash-=dt;
    for(const p of G.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=1.4*dt; p.life-=dt; }
    G.parts=G.parts.filter(p=>p.life>0);
    for(const f of G.floats){ f.y-=dt*0.12; f.life-=dt; }
    G.floats=G.floats.filter(f=>f.life>0);
    for(const rg of G.rings){ rg.r+=dt*1.9; rg.life-=dt; }
    G.rings=G.rings.filter(r=>r.life>0);

    syncHudNumbers();
    if(G.health<=0) return end(false);
    if(G.goalProgress>=G.goalCost) return end(true);
  }

  function syncHudNumbers(){
    setTxt('gqScore',G.score); setTxt('gqCombo','x'+G.combo); setTxt('gqSorted',G.sorted);
    const hb=document.getElementById('gqHpBar'); if(hb){ hb.style.width=G.health+'%'; hb.style.background = G.health>50?'linear-gradient(90deg,#22c55e,#86efac)':G.health>25?'linear-gradient(90deg,#f59e0b,#fcd34d)':'linear-gradient(90deg,#ef4444,#fca5a5)'; }
    const ht=document.getElementById('gqHpTxt'); if(ht) ht.textContent=Math.round(G.health)+'%';
    const gb=document.getElementById('gqGoalBar'); if(gb) gb.style.width=Math.min(100,G.goalProgress/G.goalCost*100)+'%';
    const gt=document.getElementById('gqGoalTxt'); if(gt) gt.textContent=fmtM(G.goalProgress)+' / '+fmtM(G.goalCost);
    const sub=document.getElementById('gqSubRow'); if(sub){
      const d=D(); let chips='';
      if(d.enabled.energy) chips+=miniBar('⚡',G.energy,'#38bdf8');
      if(d.enabled.happiness) chips+=miniBar('😊',G.happiness,'#f472b6');
      if(d.enabled.credit) chips+=miniBar('💳',Math.round((G.credit-300)/(850-300)*100),'#fbbf24',Math.round(G.credit));
      sub.innerHTML=chips;
    }
    const pr=document.getElementById('gqPowerRow'); if(pr){
      let html=''; const label={coupon:'COUPON',cashback:'CASHBACK',billFreeze:'FREEZE',advisor:'ADVISOR',frenzy:'FRENZY',autoBudget:'AUTO',savingsX2:'SAVE x2'};
      const fxToPu={coupon:'coupon',cashback:'cashback',billFreeze:'freeze',advisor:'advisor',frenzy:'frenzy',autoBudget:'auto',savingsX2:'savex2'};
      Object.keys(G.fxT).forEach(k=>{ if(G.fxT[k]>0 && label[k]){
        const pu=POWERUPS.find(p=>p.id===fxToPu[k]);
        // cached badge Image (not regenerated per frame) — small icon art
        // instead of no icon at all, reusing the same asset canvas tokens use
        const ic=pu?`<img src="${puBadgeImg(pu).src}" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px;border-radius:3px">`:'';
        html+=`<div style="padding:3px 8px;border-radius:8px;background:rgba(167,139,250,.15);border:1px solid rgba(167,139,250,.4);font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.08em;color:#c4b5fd">${ic}${label[k]} ${Math.ceil(G.fxT[k])}s</div>`;
      } });
      pr.innerHTML=html;
    }
  }
  function miniBar(icon,pct,col,txt){ pct=Math.max(0,Math.min(100,pct)); return `<div style="flex:1;background:rgba(255,255,255,.06);border-radius:8px;padding:3px 8px;display:flex;align-items:center;gap:5px"><span style="font-size:.7rem">${icon}</span><div style="flex:1;height:5px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden"><div style="height:100%;width:${pct}%;background:${col}"></div></div>${txt!=null?`<span style="font-family:'Orbitron',sans-serif;font-size:.4rem;color:${col}">${txt}</span>`:''}</div>`; }

  // ═══════════════════════════════ SPAWNING ═════════════════════════
  function spawnToken(prog){
    const d=D(); const roll=Math.random(); const m=d.mix; const F=d.fallMul;
    const vy=(base)=> (base+prog*0.55+Math.random()*0.2)*F;
    if(roll<m.power){
      const p=POWERUPS[Math.floor(Math.random()*POWERUPS.length)];
      G.items.push({x:Math.random()*0.8+0.1,y:-0.06,vy:vy(0.24),e:p.icon,kind:'power',pu:p,t:p.name,r:20,spin:0});
    } else if(roll<m.power+m.rare){
      G.items.push({x:Math.random()*0.8+0.1,y:-0.06,vy:vy(0.24),e:'💎',kind:'rare',t:'Rare Find',r:20,spin:0});
    } else if(roll<m.power+m.rare+m.event){
      spawnEvent(prog);
    } else if(roll<m.power+m.rare+m.event+m.bill){
      const b=BILL_DEFS[Math.floor(Math.random()*BILL_DEFS.length)];
      const val=Math.round((G.goalCost/22)*(0.8+Math.random()*0.5)*G.inflation*(G.fxT.coupon>0?(1-0.30):1)/5)*5;
      G.items.push({x:Math.random()*0.8+0.1,y:-0.06,vy:vy(0.34),e:b.ic,kind:'bill',t:b.label,val,r:22,spin:0});
    } else {
      spawnIncome(prog);
    }
  }

  function spawnIncome(prog,opts){
    opts=opts||{};
    const d=D();
    let src = opts.src ? {k:opts.src,ic:opts.icon,mult:opts.mult||1} : weightedSource();
    let base=(G.goalCost/16)*(0.7+Math.random()*0.6)*src.mult;
    let tired=false;
    if(src.k==='SIDE_JOB' && d.enabled.energy && G.energy<18 && G.fxT.frenzy<=0){ base*=0.5; tired=true; }
    if(src.k==='SIDE_JOB' && G.fxT.frenzy>0) base*=2;
    if(d.taxPct) base*=(1-d.taxPct);
    const val=Math.round(base/5)*5;
    G.items.push({x:Math.random()*0.8+0.1,y:-0.06,vy:(0.3+prog*0.5+Math.random()*0.15)*d.fallMul,e:src.ic,kind:'income',src:src.k,t:opts.label||titleSrc(src.k),val,tired,r:22,spin:0});
  }
  function titleSrc(k){ return {ALLOWANCE:'Allowance',PAYCHECK:'Paycheck',WINDFALL:'Windfall',SIDE_JOB:'Side Job'}[k]||k; }
  function weightedSource(){ let r=Math.random()*SOURCES.reduce((a,s)=>a+s.w,0); for(const s of SOURCES){ if((r-=s.w)<=0) return s; } return SOURCES[0]; }

  function spawnEvent(prog){
    const d=D(); const pool=EVENTS.filter(e=>e.minD<=DI);
    const ev=pool[Math.floor(Math.random()*pool.length)];
    G.eventsSeen++;
    if(ev.type==='incomeShock'){
      G.health=Math.max(0,G.health-6); G.goalProgress=Math.max(0,G.goalProgress-G.goalCost*0.015);
      announce(ev,'😢 Income dipped a little this round.');
      spawnIncome(prog); // keep pacing — this roll still yields a catchable token
      return;
    }
    if(ev.type==='bonus'){ announce(ev,'🌟 Free bonus falling — catch it!'); spawnIncome(prog,{src:'BONUS_GOOD_GRADES',icon:'🌟',mult:1.3,label:ev.label}); return; }
    if(ev.type==='opportunity'){ announce(ev,'💼 Extra income falling — catch it!'); spawnIncome(prog,{src:'SIDE_JOB',icon:'💼',mult:1.2,label:ev.label}); return; }
    // shock / temptation / seasonal → real event token the player must route
    const severity=ev.severe?1.7:1;
    const val=Math.round((G.goalCost/9)*(0.8+Math.random()*0.5)*severity*G.inflation/5)*5;
    const valT=Math.round((G.goalCost/14)*(0.7+Math.random()*0.6)/5)*5;
    G.items.push({x:Math.random()*0.8+0.1,y:-0.06,vy:(0.3+prog*0.5+Math.random()*0.2)*d.fallMul,e:ev.icon,kind:'event',evType:ev.type,ev,t:ev.label,val:ev.type==='shock'?val:valT,r:23,spin:0});
    if(ev.type==='shock') G.shocksSeen++;
    announce(ev, ev.type==='shock' ? '⚠️ Route it to EMERGENCY!' : 'Accept (SPENDING) or Decline (SAVINGS/GOAL)?');
  }
  function announce(ev,sub){
    G.bannerT=2.4;
    const b=document.getElementById('gqEventBanner'); if(!b) return;
    b.innerHTML=`<b>${ev.icon} REAL-LIFE EVENT:</b> ${ev.label} <span style="opacity:.7">— ${sub}</span>`;
    b.style.display='block'; requestAnimationFrame(()=>{ b.style.opacity=1; b.style.transform='translate(-50%,0)'; });
  }

  // ═══════════════════════════════ RESOLUTION ═══════════════════════
  function resolve(it,bi){
    if(it.dead) return;
    if(it.kind==='power'){ it.dead=1; G.powerupsUsed++; applyPowerup(it.pu); return; }
    if(it.kind==='rare'){ it.dead=1; collectRare(it); return; }
    it.dead=1; G.sorted++;
    if(it.kind==='income') resolveIncome(it,bi);
    else if(it.kind==='bill') resolveBill(it,bi);
    else if(it.kind==='event') resolveEvent(it,bi);
  }

  function goodFx(x,y,bi,txt,healthDelta){
    G.combo++; G.bestCombo=Math.max(G.bestCombo,G.combo); G.perfect++;
    G.health=Math.min(100,G.health+(healthDelta||3));
    const mult=(1+Math.floor(G.combo/4));
    G.score+=Math.round(20*mult);
    const comboPop=Math.min(1,G.combo/12);
    ring(x,y,BUCK_COL[bi]); burst(x,y,BUCK_COL[bi],11+Math.round(comboPop*14));
    floatTxt(x,y,txt,'#fde68a');
    G.flash=0.22+comboPop*0.12; G.flashC=BUCK_COL[bi];
    if(G.combo>1 && G.combo%4===0){ floatTxt(0.5,0.42,'🔥 COMBO x'+(1+Math.floor(G.combo/4)),'#60a5fa'); burst(0.5,0.42,'#60a5fa',18); G.shake=Math.max(G.shake,0.2); }
  }
  function badFx(x,y,txt,healthDelta){
    G.combo=0; G.health=Math.max(0,G.health-(healthDelta||14)); G.shake=0.4;
    burst(x,y,'#f87171',12); floatTxt(x,y,txt,'#fca5a5');
  }
  function neutralFx(x,y,txt,col){ burst(x,y,col||'#93c5fd',6); floatTxt(x,y,txt,col||'#93c5fd'); }

  function resolveIncome(it,bi){
    const d=D(); G.incomeCaught+=it.val;
    const divert = G.overdueBills>0 ? 0.7 : 1;
    if(bi===GOAL || bi===SAVINGS){
      const mult=(G.fxT.savingsX2>0?2:1);
      const credited=it.val*mult*divert;
      G.goalProgress+=credited; G.toSavingsGoal+=it.val;
      if(bi===SAVINGS) G.savings+=credited;
      goodFx(it.x,it.y,bi, (it.tired?'😴 tired but ':'+')+fmtM(credited), 3);
      if(divert<1 && !G.divertNoted){ G.divertNoted=true; floatTxt(it.x,Math.min(0.92,it.y+0.08),'Overdue bills divert some income','#93c5fd'); }
    } else if(bi===EMERGENCY){
      G.emergencyFund+=it.val; G.everBuffered=true; G.goalProgress+=it.val*0.5*divert;
      goodFx(it.x,it.y,bi,'🛟 +'+fmtM(it.val),2);
    } else if(bi===BILLS){
      if(G.overdueBills>0){ G.overdueBills=Math.max(0,G.overdueBills-1); G.goalProgress+=it.val*0.5;
        goodFx(it.x,it.y,bi,'Bill paid off!',3);
      } else { neutralFx(it.x,it.y,'No bill due right now','#93c5fd'); }
    } else { // SPENDING
      if(d.enabled.happiness){ G.happiness=Math.min(100,G.happiness+4); G.noSpendT=0; }
      if(G.fxT.cashback>0){ const cb=it.val*0.20; G.savings+=cb; G.goalProgress+=cb*0.5; }
      if(G.overdueBills>0){ badFx(it.x,it.y,'Bills overdue — pay those first!',6); showCoach('Overdue bills! Route income to 🧾 BILLS before treating yourself.','warn'); }
      else { neutralFx(it.x,it.y,'Nice treat (no goal progress)','#f9a8d4'); }
    }
  }

  function resolveBill(it,bi){
    if(bi===BILLS){
      G.billsSeen++;
      G.missedBillsStreak=0;
      if(D().enabled.credit) G.credit=Math.min(850,G.credit+15);
      G.goalProgress+=it.val*0.15;
      goodFx(it.x,it.y,bi,'BILL PAID ✔',3);
    } else { missBill(it); }
  }
  // covers BOTH a wrong-bucket bill (called from resolveBill above) AND a bill
  // that fell to the floor uncaught (called directly from update()'s miss loop)
  // — billsSeen is counted here so it can never trail behind billsMissed.
  function missBill(it){
    G.billsSeen++; G.overdueBills++; G.missedBillsStreak++; G.billsMissed++;
    const lateFee=Math.round(it.val*D().lateFeePct*G.missedBillsStreak);
    if(D().enabled.credit) G.credit=Math.max(300,G.credit-25);
    badFx(it.x,it.y,'LATE FEE! -'+fmtM(lateFee), 8+G.missedBillsStreak*3);
    showCoach('Late fee! Route 🧾 bills to BILLS before they hit the floor.','warn');
  }

  function resolveEvent(it,bi){
    const ev=it.ev;
    if(ev.type==='shock'){
      const buffered=G.emergencyFund>=20;
      const cost=Math.round(it.val*(buffered?(1-D().bufferDiscountPct):1));
      if(bi===EMERGENCY){
        G.emergencyFund=Math.max(0,G.emergencyFund-cost*0.4);
        if(D().enabled.credit) G.credit=Math.min(850,G.credit+8);
        goodFx(it.x,it.y,bi,(buffered?'🛟 Buffered! -':'Handled -')+fmtM(cost),2);
      } else { missShock(it,cost); }
    } else if(ev.type==='temptation' || ev.type==='seasonal'){
      G.impulseSeen++;
      if(bi===SPENDING){
        G.impulseAccepted++;
        if(D().enabled.happiness){ G.happiness=Math.min(100,G.happiness+6); G.noSpendT=0; }
        G.goalProgress=Math.max(0,G.goalProgress-it.val*0.4);
        if(G.overdueBills>0) badFx(it.x,it.y,'Accepted — bills overdue too!',8);
        else neutralFx(it.x,it.y,'Accepted — Goal Delayed','#f9a8d4');
      } else if(bi===SAVINGS || bi===GOAL){
        G.goalProgress+=it.val*0.5;
        goodFx(it.x,it.y,bi,'Declined! Willpower +',2);
      } else {
        neutralFx(it.x,it.y,'Accept(Spend) or Decline(Save/Goal)?','#93c5fd');
      }
    }
  }
  function missShock(it,costOverride){
    const buffered=G.emergencyFund>=20;
    const cost=costOverride!=null?costOverride:Math.round(it.val*(buffered?(1-D().bufferDiscountPct):1));
    if(D().enabled.credit) G.credit=Math.max(300,G.credit-10);
    G.goalProgress=Math.max(0,G.goalProgress-cost*0.3);
    badFx(it.x,it.y,'💥 '+it.t+'! -'+fmtM(cost), 10+Math.round(cost/25));
  }

  function collectRare(it){
    G.rareCollected++;
    const val=Math.round(G.goalCost*0.05/5)*5;
    G.goalProgress+=val; G.score+=60;
    ring(it.x,it.y,'#fde047'); burst(it.x,it.y,'#fde047',20);
    floatTxt(it.x,it.y,'💎 RARE! +'+fmtM(val),'#fde047');
    G.flash=0.3; G.flashC='#fde047';
  }

  function applyPowerup(pu){
    ring(0.5,0.3,'#a78bfa'); burst(0.5,0.3,'#a78bfa',16); G.flash=0.25; G.flashC='#a78bfa';
    switch(pu.effect){
      case 'costDown': G.fxT.coupon=pu.dur; floatTxt(0.5,0.3,'🏷️ COUPON CRAZE! -30% bills','#fde68a'); break;
      case 'income': { const bonus=Math.round(G.goalCost*0.06/5)*5; G.savings+=bonus; G.goalProgress+=bonus*0.7;
        floatTxt(0.5,0.3,'💵 +'+fmtM(bonus)+' BONUS PAYCHECK','#fde68a'); } break;
      case 'billFreeze': G.fxT.billFreeze=pu.dur; floatTxt(0.5,0.3,'🧊 BILLS FROZEN 30s','#5eead4'); break;
      case 'cashback': G.fxT.cashback=pu.dur; floatTxt(0.5,0.3,'💳 CASHBACK BOOST!','#5eead4'); break;
      case 'advice': G.fxT.advisor=pu.dur; floatTxt(0.5,0.3,'🤖 ADVISOR ONLINE','#a78bfa'); showCoach('Financial Advisor online! I will glow the smartest bucket for '+pu.dur+'s.'); break;
      case 'incomeDouble': G.fxT.frenzy=pu.dur; floatTxt(0.5,0.3,'⚡ SIDE HUSTLE FRENZY!','#fde68a'); break;
      case 'autoBudget': G.fxT.autoBudget=pu.dur; G.spawnAutoT=0.1; floatTxt(0.5,0.3,'🧠 AUTO BUDGET ON!','#a78bfa'); break;
      case 'timeExt': G.time+=pu.val; floatTxt(0.5,0.3,'⏰ +'+pu.val+'s TIME','#5eead4'); break;
      case 'luck': for(let i=0;i<3;i++){ setTimeout(()=>{ if(G&&G.phase==='play') spawnIncome(1-(G.time/D().roundSec),{src:'WINDFALL',icon:'🍀',mult:1.4,label:'Lucky Windfall'}); },i*180); }
        floatTxt(0.5,0.3,'🍀 LUCKY WINDFALL!','#86efac'); break;
      case 'savingsX2': G.fxT.savingsX2=pu.dur; floatTxt(0.5,0.3,'✨ SAVINGS x2!','#fde68a'); break;
    }
  }

  // ── billFreeze suppresses bill spawning inline in spawnToken via mix
  //    check — simplest correct hook is here, right before the district
  //    mix roll would have chosen 'bill' we instead force an income spawn.
  const _origSpawnToken=spawnToken;
  spawnToken=function(prog){ if(G.fxT && G.fxT.billFreeze>0){
      const d=D(); const roll=Math.random(); const m=d.mix;
      if(roll>=m.power+m.rare+m.event && roll<m.power+m.rare+m.event+m.bill){ spawnIncome(prog); return; }
    }
    _origSpawnToken(prog);
  };

  // ═══════════════════════════════ RENDER ═══════════════════════════
  const _gqStars=Array.from({length:60},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.1+0.3,s:Math.random()*0.5+0.2,c:Math.random()<0.5?'#93c5fd':'#c4b5fd'}));
  function _gqBg(ctx,W,H,now){
    const col=D().col;
    const bg=ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#0a0416'); bg.addColorStop(0.4,'#0d0829'); bg.addColorStop(1,'#0a1628');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle=hexA(col,0.09); ctx.lineWidth=1;
    const vy=H*0.82;
    for(let i=0;i<=10;i++){ const t=i/10; ctx.beginPath(); ctx.moveTo(t*W,0); ctx.lineTo(W/2+(t*W-W/2)*3,vy); ctx.stroke(); }
    for(let j=0;j<4;j++){ const fy=H*0.25*(j+0.5); const sc=1-fy/vy; const lx=W/2-W*sc*0.5; const rx=W/2+W*sc*0.5;
      ctx.beginPath(); ctx.moveTo(lx,fy); ctx.lineTo(rx,fy); ctx.stroke(); }
    const t=now/1000;
    for(const st of _gqStars){ const tw=0.3+0.45*Math.sin(t*st.s+st.x*6.28); ctx.globalAlpha=tw*0.65; ctx.fillStyle=st.c;
      ctx.beginPath(); ctx.arc(st.x*W,st.y*H*0.65,st.r,0,6.28); ctx.fill(); }
    ctx.globalAlpha=1;
    const tg=ctx.createRadialGradient(W/2,-H*0.1,0,W/2,-H*0.1,W*0.7);
    tg.addColorStop(0,hexA(col,0.14)); tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg; ctx.fillRect(0,0,W,H);
  }

  function render(ctx,W,H,now){
    _gqBg(ctx,W,H,now);
    if(!G) return;
    let ox=0,oy=0; if(G.shake>0){ ox=(Math.random()-.5)*G.shake*22; oy=(Math.random()-.5)*G.shake*22; }
    ctx.save(); ctx.translate(ox,oy);
    if(G.flash>0){ ctx.fillStyle=hexA(G.flashC,G.flash*0.18); ctx.fillRect(0,0,W,H); }

    if(G.phase==='play' || G.phase==='gate'){
      const floorY=0.82*H;
      const binW=W/5;
      let idealBi=-1;
      if(G.fxT.advisor>0){ let lo=null; for(const it of G.items){ if(it.dead||it.kind==='power'||it.kind==='rare') continue; if(!lo||it.y>lo.y) lo=it; } if(lo) idealBi=idealBucket(lo); }
      for(let i=0;i<5;i++){
        const cx=G.bins[i]*W; const x0=i*binW, x1=binW; const col=BUCK_COL[i];
        const grad=ctx.createLinearGradient(0,floorY-30,0,H);
        grad.addColorStop(0,hexA(col,0)); grad.addColorStop(0.5,hexA(col,0.08)); grad.addColorStop(1,hexA(col,0.26));
        ctx.fillStyle=grad; ctx.fillRect(x0,floorY,x1,H-floorY);
        if(i>0){ ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x0,floorY); ctx.lineTo(x0,H); ctx.stroke(); }
        ctx.shadowColor=col; ctx.shadowBlur=i===idealBi?20:10;
        ctx.strokeStyle=hexA(col,i===idealBi?0.95:0.65); ctx.lineWidth=i===idealBi?3:2;
        ctx.beginPath(); ctx.moveTo(x0+4,floorY); ctx.lineTo(x0+binW-4,floorY); ctx.stroke();
        ctx.shadowBlur=0;
        const bw=binW*0.82, bh=48, bx=cx-bw/2, by=H-bh-8;
        roundRect(ctx,bx,by,bw,bh,13);
        const bg2=ctx.createLinearGradient(0,by,0,by+bh);
        bg2.addColorStop(0,hexA(col,i===idealBi?0.34:0.2)); bg2.addColorStop(1,hexA(col,0.08));
        ctx.fillStyle=bg2; ctx.fill();
        ctx.shadowColor=col; ctx.shadowBlur=i===idealBi?18:12;
        ctx.strokeStyle=hexA(col,0.7); ctx.lineWidth=2; ctx.stroke();
        ctx.shadowBlur=0;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.font="16px serif"; ctx.fillStyle=col; ctx.fillText(BUCK_ICON[i],cx,by+15);
        ctx.shadowColor=col; ctx.shadowBlur=6;
        ctx.fillStyle=col; ctx.font="700 8.5px 'Orbitron',sans-serif"; ctx.fillText(BUCKETS[i],cx,by+bh/2+11);
        ctx.shadowBlur=0;
        ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font="8px 'Orbitron',sans-serif";
        ctx.fillText((i+1)+' KEY',cx,by+bh-6);
      }

      ctx.textAlign='center'; ctx.textBaseline='middle';
      for(const it of G.items){
        const x=it.x*W, y=it.y*H;
        const col = it.kind==='bill'?'#fbbf24' : it.kind==='power'?'#a78bfa' : it.kind==='rare'?'#fde047'
                   : it.kind==='event'?(it.evType==='shock'?'#f87171':'#f472b6') : '#e2e8f0';
        ctx.save(); ctx.translate(x,y);
        const wob=Math.sin(it.spin)*0.04;
        ctx.rotate(it.grab?0:wob);
        const pulse = it.kind==='event' ? 1+Math.sin(now/140+it.x*10)*0.08 : 1;
        ctx.scale(pulse,pulse);
        ctx.shadowColor=col; ctx.shadowBlur=it.grab?26:(it.kind==='event'?20:14);
        const r=it.r;
        // illustrated badge art for power-ups/rare/events (hand-authored —
        // replace with Kabria's final character/badge art if she provides
        // one); falls back to the raw emoji glyph until the tiny inline-SVG
        // image decodes (near-instant) or for income/bill tokens (unchanged)
        let img=null;
        if(it.kind==='power') img=puBadgeImg(it.pu);
        else if(it.kind==='rare') img=rareBadgeImg();
        else if(it.kind==='event') img=evBadgeImg(it.ev);
        if(img && img.complete && img.naturalWidth>0){ ctx.drawImage(img,-r,-r,r*2,r*2); }
        else { ctx.font=(r*2)+'px serif'; ctx.fillText(it.e,0,-2); }
        ctx.shadowBlur=0;
        ctx.restore();
        const lab=it.kind==='income'||it.kind==='bill'?(it.t+' '+fmtM(it.val)):it.t;
        ctx.font="700 10px 'Inter',sans-serif";
        const tw=ctx.measureText(lab).width+14;
        roundRect(ctx,x-tw/2,y+r-2,tw,16,8);
        ctx.fillStyle='rgba(15,23,42,.84)'; ctx.fill();
        ctx.strokeStyle=hexA(col,0.5); ctx.lineWidth=1; ctx.stroke();
        ctx.fillStyle=col; ctx.fillText(lab,x,y+r+6);
      }
    }

    for(const p of G.parts){ ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); }
    ctx.globalAlpha=1;
    for(const rg of G.rings){ ctx.globalAlpha=Math.max(0,rg.life/0.5); ctx.strokeStyle=rg.c; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(rg.x*W,rg.y*H,rg.r*W*0.12,0,7); ctx.stroke(); }
    ctx.globalAlpha=1;
    ctx.textAlign='center';
    for(const f of G.floats){ ctx.globalAlpha=Math.max(0,f.life/0.9); ctx.fillStyle=f.c; ctx.font='700 '+(f.big?22:14)+"px 'Inter',sans-serif"; ctx.fillText(f.t,f.x*W,f.y*H); }
    ctx.globalAlpha=1;
    ctx.restore();
  }

  // ── helpers ──────────────────────────────────────────────────────
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function hexA(hex,a){ const h=hex.replace('#',''); const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }
  function burst(x,y,c,n){ for(let i=0;i<n;i++){ const a=Math.random()*7,s=0.15+Math.random()*0.5; G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.2,s:2+Math.random()*3,c,life:0.5+Math.random()*0.3,max:0.8}); } }
  function ring(x,y,c){ G.rings.push({x,y,r:0.3,c,life:0.5}); }
  function floatTxt(x,y,t,c){ G.floats.push({x,y,t,c,life:0.9,big:t.indexOf('COMBO')>=0}); }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

  // ═══════════════════════════════ ROUND END ════════════════════════
  function end(win){
    if(G.phase==='over') return; G.phase='over';
    const score=G.score;
    const won = win===true || G.goalProgress>=G.goalCost;
    const acc = G.sorted>0?Math.round(G.perfect/G.sorted*100):0;
    const savingsRate = G.incomeCaught>0?Math.round(G.toSavingsGoal/G.incomeCaught*100):0;
    const objResults = G.objectives.map(o=>o.check(G));
    const objMet = objResults.filter(Boolean).length;
    const lvl=DI+1, isFinal=DI>=DISTRICTS.length-1;
    let earned=0;
    const stars = won ? (acc>=90?3:acc>=70?2:1) : 0;
    if(window.state){
      state.gamesDone=state.gamesDone||{}; state.gamesDone['strategist:0']=1;
      if(stars>=1 && window.cvAwardGame){
        earned = cvAwardGame('game_goalquest',{
          level:lvl, stars, badge:'Budget Boss', isFlagship:true,
          isPerfect: stars===3 && G.billsMissed===0,
          collectibles: G.rareCollected + objMet
        });
        if(won && DI+1<DISTRICTS.length){
          state.gameLevels=state.gameLevels||{};
          if((state.gameLevels['game_goalquest']||0)<DI+1) state.gameLevels['game_goalquest']=DI+1;
        }
      } else if(!won){
        earned=50; state.coins=(state.coins||0)+earned;
        if(window.cvAddXP) cvAddXP(10,0);
      }
      if(window.budgetDelta) budgetDelta(won ? (300+DI*150+stars*80) : -300);
      const c=career(); c.roundsPlayed++; if(won) c.goalsHit++;
      c.totalSaved+=Math.round(G.savings+G.goalProgress); c.bestCombo=Math.max(c.bestCombo,G.bestCombo);
      if(window.cvSave) cvSave();
    }
    const o=document.getElementById('gqOver'); if(!o) return; o.style.display='flex';
    const d=D();
    const P="padding:13px 26px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;font-weight:900;cursor:pointer";
    const GH="padding:13px 26px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;cursor:pointer";
    const title = won ? (isFinal ? '👑 ALL 3 DISTRICTS FUNDED!' : G.goalDef.label.toUpperCase()+' FUNDED ✔') : 'NICE TRY! REPLAN AND GO AGAIN';
    const sub = won ? d.name+' — GOAL ACHIEVED!' : (G.health<=0 ? 'OOPS — the budget ran dry' : 'OOPS — the clock beat the goal');
    const btns = won
      ? (isFinal
          ? '<button onclick="gqRestart()" style="'+GH+'">↺ REPLAY DISTRICT</button><button onclick="gqGoHomeScreen()" style="'+P+'">DISTRICTS</button><button onclick="gqExit()" style="'+GH+'">← HUB</button>'
          : '<button onclick="gqNextLevel()" style="'+P+'">NEXT DISTRICT ▶</button><button onclick="gqRestart()" style="'+GH+'">↺ REPLAY</button><button onclick="gqExit()" style="'+GH+'">← HUB</button>')
      : '<button onclick="gqRestart()" style="'+P+'">↺ TRY AGAIN</button><button onclick="gqGoHomeScreen()" style="'+GH+'">DISTRICTS</button><button onclick="gqExit()" style="'+GH+'">← HUB</button>';
    o.innerHTML=`<div style="max-width:480px;text-align:center;padding:30px 26px;border:1px solid ${won?'#fbbf24':'#3b82f6'};border-radius:22px;background:linear-gradient(160deg,rgba(30,41,59,.97),rgba(7,13,24,.97));box-shadow:0 0 ${won?'90px rgba(251,191,36,.55)':'60px rgba(59,130,246,.4)'};animation:${won?(isFinal?'gqMasterPop .6s cubic-bezier(.2,1.4,.4,1)':'gqWinPop .5s cubic-bezier(.2,1.4,.4,1)'):'gqGateIn .3s ease'}">
      <style>
        @keyframes gqWinPop{0%{transform:scale(.7) rotate(-4deg);opacity:0}60%{transform:scale(1.06) rotate(1deg);opacity:1}100%{transform:scale(1) rotate(0)}}
        @keyframes gqMasterPop{0%{transform:scale(.6) rotate(-8deg);opacity:0}55%{transform:scale(1.1) rotate(2deg);opacity:1}75%{transform:scale(.97) rotate(-1deg)}100%{transform:scale(1) rotate(0)}}
        @keyframes gqCrownSpin{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.15) rotate(-6deg)}}
        @keyframes gqGateIn{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}
      </style>
      <div style="font-size:2.6rem;margin-bottom:6px${won?';animation:gqCrownSpin 1.1s ease-in-out infinite':''}">${won?(isFinal?'👑':G.goalDef.icon):G.health<=0?'💸':'⏱'}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.16em;color:${won?'#fbbf24':'#60a5fa'};margin-bottom:6px">${title}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-bottom:10px">${sub}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:1.9rem;margin:0 0 8px">${score} pts</h1>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px">
        ${[['GOAL',fmtM(G.goalProgress)+' / '+fmtM(G.goalCost)],['ACCURACY',acc+'%'],['BEST STREAK','x'+G.bestCombo],
           ['SAVINGS RATE',savingsRate+'%'],['BILLS PAID',(G.billsSeen-G.billsMissed)+'/'+G.billsSeen],['RATING','★'.repeat(stars)+'☆'.repeat(3-stars)]]
          .map(r=>`<div style="background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.18);border-radius:11px;padding:8px 6px"><div style="font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.1em;color:rgba(255,255,255,.45);margin-bottom:3px">${r[0]}</div><div style="font-family:'Anton',sans-serif;font-size:.95rem;color:#fff">${r[1]}</div></div>`).join('')}
      </div>
      <div style="text-align:left;background:rgba(255,255,255,.04);border-radius:12px;padding:9px 13px;margin-bottom:12px">
        <div style="font-family:'Orbitron',sans-serif;font-size:.4rem;letter-spacing:.12em;color:#a78bfa;margin-bottom:5px">⭐ BONUS OBJECTIVES · ${objMet}/${G.objectives.length}</div>
        ${G.objectives.map((o,i)=>`<div style="font-size:.66rem;color:${objResults[i]?'#86efac':'rgba(255,255,255,.4)'};padding:1px 0">${objResults[i]?'✔':'✕'} ${o.label}</div>`).join('')}
      </div>
      <p style="color:rgba(255,255,255,.6);margin:0 0 16px;font-size:.72rem">+${earned} 🪙 earned</p>
      ${btns}
    </div>`;
    syncVisibility();
  }

  // ── KNOWLEDGE GATE — pauses play, one lesson from this district's
  //    shuffled slice of 4; once shown, gates silently skip so no tip
  //    ever repeats within a district ─────────────────────────────────
  function openGate(){
    if(!G || G.phase!=='play') return;
    if(G.gateIdx>=G.facts.length){ G.gateT=D().gateEvery; return; }
    G.phase='gate';
    const f=G.facts[G.gateIdx]; G.gateIdx++;
    const o=document.getElementById('gqGate'); if(!o){ G.phase='play'; G.gateT=D().gateEvery; return; }
    o.style.display='flex';
    o.innerHTML=`<div style="max-width:440px;text-align:center;padding:30px 26px;border:1px solid #3b82f6;border-radius:22px;background:linear-gradient(160deg,rgba(30,41,59,.97),rgba(7,13,24,.97));box-shadow:0 0 50px rgba(59,130,246,.4);animation:gqGateIn .35s ease">
      <style>@keyframes gqGateIn{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}</style>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.2em;color:#93c5fd;margin-bottom:10px">⛩️ KNOWLEDGE GATE · ${D().name}</div>
      <div style="font-size:2.4rem;margin-bottom:8px">${f[0]}</div>
      <p style="font-size:1.02rem;line-height:1.5;color:#fff;margin:0 0 18px">${f[1]}</p>
      <button onclick="gqGateGo()" style="padding:13px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#60a5fa,#2563eb);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.12em;font-weight:900;cursor:pointer">GOT IT → +10 HEALTH</button>
    </div>`;
  }
  window.gqGateGo=function(){
    if(!G) return;
    G.health=Math.min(100,G.health+10); G.score+=40;
    G.gateT=D().gateEvery; G.phase='play';
    const o=document.getElementById('gqGate'); if(o){ o.style.display='none'; o.innerHTML=''; }
    G.last=performance.now();
    G.flash=0.25; G.flashC='#60a5fa';
    syncVisibility();
  };

  window.gqRestart=function(){ cancelAnimationFrame(raf); const goalDef=D().goals[Math.floor(Math.random()*D().goals.length)]; const _cleanup=G&&G._cleanup;
    G={ phase:'brief', goalDef, objectives: shuffle(OBJPOOL.slice()).slice(0,3), parts:[], floats:[], rings:[], shake:0, flash:0, flashC:'#60a5fa', last:performance.now(), _cleanup };
    ['gqGate','gqOver'].forEach(id=>{const o=document.getElementById(id);if(o){o.style.display='none';o.innerHTML='';}});
    renderBrief(); syncVisibility(); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop); };
  window.gqNextLevel=function(){ cancelAnimationFrame(raf); DI=Math.min(DISTRICTS.length-1,DI+1);
    const goalDef=D().goals[Math.floor(Math.random()*D().goals.length)]; const _cleanup=G&&G._cleanup;
    G={ phase:'brief', goalDef, objectives: shuffle(OBJPOOL.slice()).slice(0,3), parts:[], floats:[], rings:[], shake:0, flash:0, flashC:'#60a5fa', last:performance.now(), _cleanup };
    ['gqGate','gqOver'].forEach(id=>{const o=document.getElementById(id);if(o){o.style.display='none';o.innerHTML='';}});
    renderBrief(); syncVisibility(); raf=requestAnimationFrame(loop); };
  window.gqGoHomeScreen=function(){ cancelAnimationFrame(raf);
    ['gqGate','gqOver'].forEach(id=>{const o=document.getElementById(id);if(o){o.style.display='none';o.innerHTML='';}});
    homeState(); renderHome(); syncVisibility(); raf=requestAnimationFrame(loop); };
  window.gqExit=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); G=null; if(window.state)state.viewingWorld=state._returnHub||'strategist'; goTo('hub'); };
})();
