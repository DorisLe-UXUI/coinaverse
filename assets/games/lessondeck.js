/* ════════════════════════════════════════════════════════════════
   COSMIC CLASSROOM · LESSON DECK
   A premium full-screen, multi-slide lesson viewer for the hubs.
   Recreates Kabria's "Goal Galaxy" lesson-board look (navy starfield
   board, neon LESSON pill, white+gold title, KEY IDEA / TIP cards,
   right info panel, galaxy icons) inside a futuristic classroom
   (neon ceiling rings, rocket, cityscape, study table).
   Slides reveal ONE at a time — NEXT → … → last → ▶ PLAY GAME.
   Data-driven via window.LESSONDECK[token][districtIndex] = [slides].
   openDistrict() routes to this when a deck exists for that district.
   ════════════════════════════════════════════════════════════════ */
(function(){

  /* ─── one-time CSS ─────────────────────────────────────────────── */
  function injectCSS(){
    if(document.getElementById('ldCSS')) return;
    const s=document.createElement('style'); s.id='ldCSS'; s.textContent=`
    .ld-room{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;
      padding:22px;overflow:auto;font-family:'Inter',system-ui,sans-serif;color:#fff;
      background:radial-gradient(125% 85% at 50% -12%,#1a3a82 0%,#0e2256 32%,#081336 62%,#040a1f 100%);
      animation:ldFade .28s ease}
    @keyframes ldFade{from{opacity:0}to{opacity:1}}
    /* ── room ambiance ── */
    .ld-amb{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
    .ld-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.5;filter:saturate(1.15) brightness(.9)}
    .ld-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 0%,rgba(20,50,120,.25),rgba(4,8,24,.72) 75%)}
    .ld-stars{position:absolute;inset:0;opacity:.8;background-repeat:no-repeat;
      background-image:
        radial-gradient(1.6px 1.6px at 12% 22%,#fff,transparent),
        radial-gradient(1.4px 1.4px at 28% 64%,rgba(190,220,255,.9),transparent),
        radial-gradient(1.2px 1.2px at 46% 14%,#fff,transparent),
        radial-gradient(1.6px 1.6px at 63% 78%,rgba(255,255,255,.8),transparent),
        radial-gradient(1.2px 1.2px at 78% 30%,#fff,transparent),
        radial-gradient(1.5px 1.5px at 88% 60%,rgba(170,210,255,.9),transparent),
        radial-gradient(1.2px 1.2px at 8% 84%,#fff,transparent),
        radial-gradient(1.3px 1.3px at 55% 42%,rgba(255,255,255,.7),transparent),
        radial-gradient(1.2px 1.2px at 36% 90%,#fff,transparent);
      animation:ldTwinkle 5s ease-in-out infinite}
    @keyframes ldTwinkle{0%,100%{opacity:.85}50%{opacity:.55}}
    .ld-rings{position:absolute;top:-220px;right:6%;width:520px;height:520px;border-radius:50%;
      border:13px solid rgba(46,150,255,.20);box-shadow:0 0 70px rgba(46,150,255,.4),inset 0 0 50px rgba(70,185,255,.28)}
    .ld-rings::before,.ld-rings::after{content:'';position:absolute;border-radius:50%}
    .ld-rings::before{inset:58px;border:11px solid rgba(70,180,255,.24);box-shadow:0 0 34px rgba(70,185,255,.34)}
    .ld-rings::after{inset:126px;border:9px solid rgba(130,215,255,.34);box-shadow:0 0 26px rgba(130,215,255,.4)}
    .ld-city{position:absolute;right:0;bottom:0;height:64%;display:flex;align-items:flex-end;gap:10px;opacity:.4;padding-right:8px}
    .ld-bld{width:42px;border-radius:5px 5px 0 0;border:1px solid rgba(90,150,255,.4);
      background:linear-gradient(180deg,rgba(28,64,150,.5),rgba(12,30,80,.85));
      background-image:radial-gradient(1.5px 1.5px at 8px 10px,rgba(120,200,255,.7),transparent),radial-gradient(1.5px 1.5px at 22px 10px,rgba(120,200,255,.6),transparent),radial-gradient(1.5px 1.5px at 34px 10px,rgba(120,200,255,.5),transparent);
      background-size:auto,42px 18px;background-repeat:no-repeat,repeat}
    .ld-rocket{position:absolute;left:1.5%;bottom:3%;font-size:118px;line-height:1;opacity:.92;
      filter:drop-shadow(0 0 26px rgba(90,170,255,.65));animation:ldFloat 4.2s ease-in-out infinite}
    @keyframes ldFloat{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-16px) rotate(-6deg)}}
    .ld-table{position:absolute;right:4%;bottom:3.5%;width:200px;height:60px;border-radius:50%;
      background:radial-gradient(ellipse at 50% 35%,rgba(120,190,255,.55),rgba(30,70,160,.25) 70%,transparent);
      box-shadow:0 0 40px rgba(80,160,255,.35);opacity:.55}
    .ld-table::before{content:'▦ ▦ ▦';position:absolute;top:14px;left:0;right:0;text-align:center;font-size:16px;color:rgba(180,220,255,.8);letter-spacing:4px}
    /* ── the lesson board ── */
    .ld-stage{position:relative;z-index:2;width:min(1080px,96vw);max-height:94vh;display:flex;flex-direction:column}
    .ld-board{position:relative;border-radius:26px;padding:clamp(20px,3vw,38px);overflow:auto;
      background:linear-gradient(160deg,rgba(11,24,64,.97),rgba(7,15,42,.98));
      background-image:radial-gradient(1.3px 1.3px at 18% 24%,rgba(255,255,255,.5),transparent),radial-gradient(1.2px 1.2px at 72% 16%,rgba(255,255,255,.4),transparent),radial-gradient(1.2px 1.2px at 52% 70%,rgba(255,255,255,.35),transparent),radial-gradient(1.2px 1.2px at 88% 64%,rgba(160,200,255,.4),transparent);
      border:1.5px solid rgba(70,160,255,.5);
      box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 70px rgba(46,150,255,.3),inset 0 0 60px rgba(30,90,200,.14);
      animation:ldSlide .4s cubic-bezier(.2,.8,.2,1)}
    @keyframes ldSlide{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
    .ld-x{position:absolute;top:-10px;right:-6px;z-index:6;width:40px;height:40px;border-radius:50%;border:1px solid rgba(120,180,255,.4);
      background:rgba(8,16,42,.92);color:#cfe0ff;font-size:17px;cursor:pointer;transition:.15s}
    .ld-x:hover{background:rgba(40,90,200,.6);transform:scale(1.08)}
    .ld-pill{display:inline-flex;align-items:center;gap:7px;padding:7px 16px;border-radius:999px;
      border:1px solid rgba(60,200,235,.55);background:rgba(10,40,70,.7);
      font:800 .62rem/1 'Orbitron',sans-serif;letter-spacing:.22em;color:#5fe0f5}
    .ld-title{font-family:'Anton','Inter',sans-serif;font-weight:400;line-height:.98;margin:14px 0 0;
      font-size:clamp(2rem,4.6vw,3.5rem);letter-spacing:.01em;color:#fff;text-shadow:0 3px 18px rgba(0,0,0,.45)}
    .ld-title b{color:#ffce3a;font-weight:400;text-shadow:0 0 22px rgba(255,200,60,.5)}
    .ld-sub{font:800 clamp(.85rem,1.7vw,1.18rem)/1.1 'Inter',sans-serif;color:#ffd24d;margin-top:8px;letter-spacing:.01em}
    .ld-sub.cy{color:#5fe0f5}
    .ld-grid{display:grid;grid-template-columns:1.45fr 1fr;gap:clamp(14px,2vw,26px);margin-top:18px;align-items:start}
    .ld-left,.ld-right{display:flex;flex-direction:column;gap:12px;min-width:0}
    .ld-lead{font-size:clamp(1rem,1.9vw,1.32rem);line-height:1.45;color:#eaf1ff;margin:2px 0 2px}
    .ld-lead b{color:#ffce3a;font-weight:800}
    .ld-lead2{font-size:clamp(.95rem,1.7vw,1.15rem);color:#dbe6ff;margin:2px 0}
    /* cards */
    .ld-card{border-radius:15px;padding:15px 17px;border:1px solid rgba(80,150,255,.28);
      background:linear-gradient(160deg,rgba(24,52,116,.55),rgba(14,32,80,.55))}
    .ld-key{display:flex;gap:13px;align-items:flex-start}
    .ld-kico{font-size:1.7rem;flex:0 0 auto;filter:drop-shadow(0 0 10px rgba(255,200,60,.6))}
    .ld-klbl{font:800 .6rem/1 'Orbitron',sans-serif;letter-spacing:.18em;color:#5fe0f5;margin-bottom:6px}
    .ld-key>div>div:last-child,.ld-tip>div{font-size:clamp(.92rem,1.5vw,1.05rem);line-height:1.4;color:#fff}
    .ld-tip{display:flex;gap:12px;align-items:center}
    .ld-tip>span{font-size:1.5rem;flex:0 0 auto;filter:drop-shadow(0 0 9px rgba(255,210,80,.6))}
    .ld-tip b{color:#ffce3a}
    /* swap (instead-of → say) */
    .ld-swap{display:grid;grid-template-columns:1fr auto 1fr;gap:10px 14px;align-items:center}
    .ld-swh{font:800 .62rem/1.2 'Orbitron',sans-serif;letter-spacing:.12em;color:#ff8ad1}
    .ld-swh.g{color:#7ef0a6}
    .ld-swarr{grid-row:span 2;font-size:1.6rem;color:#5fe0f5}
    .ld-swbad{color:#ffb9b9;font-size:.95rem}
    .ld-swgood{color:#d6ffe4;font-size:.95rem;font-weight:600}
    /* right rail list */
    .ld-rail{border-radius:16px;padding:16px 18px;border:1px solid rgba(80,150,255,.3);
      background:linear-gradient(160deg,rgba(16,38,92,.6),rgba(10,24,64,.62))}
    .ld-rhead{font:800 .66rem/1 'Orbitron',sans-serif;letter-spacing:.16em;color:#5fe0f5;margin-bottom:12px;text-align:center}
    .ld-lrow{display:flex;align-items:center;gap:12px;padding:9px 2px;border-bottom:1px solid rgba(120,170,255,.14)}
    .ld-lrow:last-child{border-bottom:none}
    .ld-chip{width:34px;height:34px;border-radius:50%;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 0 14px rgba(0,0,0,.3)}
    .ld-lrow span.t{font-size:.98rem;color:#eef3ff;font-weight:500}
    /* mission rail rows */
    .ld-rrow{display:flex;gap:13px;align-items:center;padding:11px 0}
    .ld-rrow+.ld-rrow{border-top:1px solid rgba(120,170,255,.16)}
    .ld-rico{width:42px;height:42px;border-radius:50%;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:1.25rem;box-shadow:0 0 16px rgba(0,0,0,.3)}
    .ld-rlbl{font:800 .58rem/1 'Orbitron',sans-serif;letter-spacing:.14em;color:#5fe0f5;margin-bottom:4px}
    .ld-rval{font-family:'Anton',sans-serif;font-size:1.45rem;color:#fff}
    .ld-rval small{font-size:.8rem;color:#b9c6ef;font-family:'Inter';font-weight:600}
    .ld-rtxt{font-size:.98rem;color:#fff;line-height:1.35}
    /* cover blurb + feats */
    .ld-blurb{display:flex;gap:14px;align-items:flex-start;border-radius:15px;padding:18px;border:1px solid rgba(80,150,255,.3);background:linear-gradient(160deg,rgba(20,46,108,.5),rgba(12,28,74,.5))}
    .ld-blurb span{font-size:2rem;filter:drop-shadow(0 0 12px rgba(255,200,60,.6))}
    .ld-blurb p{margin:0;font-size:clamp(1rem,1.8vw,1.22rem);line-height:1.45;color:#fff}
    .ld-feats{display:flex;align-items:flex-start;gap:6px;margin-top:18px;border-radius:15px;padding:16px 10px;border:1px solid rgba(80,150,255,.25);background:rgba(10,24,64,.45)}
    .ld-feat{flex:1;text-align:center;display:flex;flex-direction:column;align-items:center;gap:7px;padding:0 4px}
    .ld-fico{font-size:2rem;filter:drop-shadow(0 0 10px rgba(120,190,255,.5))}
    .ld-flbl{font:700 .72rem/1.2 'Inter';color:#dbe6ff}
    .ld-fdiv{width:1px;align-self:stretch;background:linear-gradient(180deg,transparent,rgba(120,170,255,.35),transparent)}
    /* sources chips (pay yourself first) */
    .ld-srcs{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
    .ld-src{border-radius:12px;padding:11px 6px;text-align:center;border:1px solid var(--c);background:linear-gradient(160deg,color-mix(in srgb,var(--c) 26%,transparent),rgba(10,24,64,.5))}
    .ld-src span{font-size:1.7rem;display:block;filter:drop-shadow(0 0 8px rgba(0,0,0,.4))}
    .ld-src b{display:block;margin-top:5px;font-size:.72rem;color:#fff;font-weight:700;line-height:1.15}
    /* numbered step cards */
    .ld-steps{display:flex;align-items:stretch;gap:6px}
    .ld-step{flex:1;border-radius:13px;padding:13px 9px;text-align:center;border:1px solid var(--c);
      background:linear-gradient(160deg,color-mix(in srgb,var(--c) 22%,transparent),rgba(10,24,64,.55))}
    .ld-snum{width:26px;height:26px;border-radius:50%;background:var(--c);color:#06122e;font:900 .9rem/26px 'Orbitron';margin:0 auto 8px;text-align:center}
    .ld-stit{font:800 .7rem/1.1 'Orbitron';letter-spacing:.06em;color:#fff}
    .ld-ssub{font-size:.66rem;color:#c6d4f5;margin-top:3px}
    .ld-sico{font-size:1.8rem;margin-top:9px;filter:drop-shadow(0 0 8px rgba(0,0,0,.4))}
    .ld-arrow{align-self:center;font-size:1.3rem;color:#5fe0f5;flex:0 0 auto}
    .ld-plus{align-self:center;font-size:1.5rem;color:#7ef0a6;font-weight:800;flex:0 0 auto}
    /* example strip */
    .ld-exbox{border-radius:14px;padding:13px 15px;border:1px solid rgba(80,150,255,.3);background:rgba(10,26,68,.55)}
    .ld-exh{display:inline-block;font:800 .58rem/1 'Orbitron';letter-spacing:.14em;color:#06122e;background:#5fe0f5;padding:5px 11px;border-radius:7px;margin-bottom:11px}
    .ld-exrow{display:flex;align-items:center;justify-content:space-between;gap:6px}
    .ld-exi{flex:1;text-align:center}
    .ld-exi .e{font-size:1.5rem}
    .ld-exi .l{font-size:.66rem;color:#c6d4f5;margin-top:2px}
    .ld-exi .v{font-family:'Anton';font-size:1.35rem;margin-top:2px}
    /* parts (SMART what/howmuch/when) */
    .ld-parts{display:flex;align-items:stretch;gap:6px}
    .ld-part{flex:1;border-radius:13px;padding:12px 8px;text-align:center;border:1px solid var(--c);background:linear-gradient(160deg,color-mix(in srgb,var(--c) 20%,transparent),rgba(10,24,64,.55))}
    .ld-pnum{width:25px;height:25px;border-radius:50%;background:var(--c);color:#06122e;font:900 .85rem/25px 'Orbitron';margin:0 auto 7px}
    .ld-ptit{font:800 .72rem/1 'Orbitron';color:#fff}
    .ld-psub{font-size:.64rem;color:#c6d4f5;margin-top:3px}
    .ld-pico{font-size:1.7rem;margin:8px 0 4px}
    .ld-peg{font-size:.66rem;color:#ffd24d;font-weight:700}
    .ld-exgoal .ld-goal{font-size:clamp(.95rem,1.7vw,1.15rem);color:#fff;line-height:1.4;margin-bottom:9px}
    .ld-exgoal .ld-goal b{color:#7ef0a6}
    .ld-exicons{font-size:1.5rem;letter-spacing:8px;color:#5fe0f5}
    /* SMART list rows */
    .ld-srow{display:flex;align-items:center;gap:12px;padding:8px 2px;border-bottom:1px solid rgba(120,170,255,.14)}
    .ld-srow:last-child{border-bottom:none}
    .ld-sbadge{width:30px;height:30px;border-radius:8px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font:900 1rem/1 'Orbitron';color:#fff;box-shadow:0 0 12px rgba(0,0,0,.3)}
    .ld-srow b{color:#fff;font-size:.95rem}
    .ld-srow span{display:block;color:#c6d4f5;font-size:.78rem;margin-top:1px}
    /* good / bad places */
    .ld-gbsec{border-radius:15px;padding:13px;border:1px solid}
    .ld-gbsec.bad{border-color:rgba(255,90,110,.45);background:rgba(70,16,30,.4)}
    .ld-gbsec.good{border-color:rgba(70,210,130,.45);background:rgba(12,52,34,.4);margin-top:11px}
    .ld-gbh{font:800 .66rem/1 'Orbitron';letter-spacing:.12em;color:#ff7a90;margin-bottom:11px;text-align:center}
    .ld-gbcards{display:flex;gap:7px}
    .ld-gbcard{flex:1;position:relative;border-radius:11px;padding:13px 5px 9px;text-align:center;border:1px solid rgba(150,170,210,.25);background:rgba(10,22,54,.5)}
    .ld-badge{position:absolute;top:-9px;left:50%;transform:translateX(-50%);width:21px;height:21px;border-radius:50%;font:900 .7rem/21px 'Inter';color:#fff}
    .ld-badge.x{background:#ef4455}.ld-badge.ok{background:#22c55e}
    .ld-gbico{font-size:1.7rem;filter:drop-shadow(0 0 7px rgba(0,0,0,.4))}
    .ld-gblbl{font-size:.7rem;color:#eef3ff;margin-top:6px;line-height:1.2}
    .ld-warn{margin-top:11px;border-radius:10px;padding:9px 12px;font-size:.82rem;color:#ffd7dc;background:rgba(180,40,60,.32);border:1px solid rgba(255,90,110,.4)}
    .ld-note{margin-top:11px;border-radius:10px;padding:9px 12px;font-size:.84rem;color:#d6ffe4;font-weight:600;background:rgba(30,120,70,.3);border:1px solid rgba(70,210,130,.4);text-align:center}
    .ld-star{display:flex;gap:9px;align-items:center;margin-top:4px;font-size:clamp(.92rem,1.5vw,1.05rem);color:#fff}
    .ld-star b{color:#ffce3a}
    .ld-star::before{content:'⭐';font-size:1.3rem;filter:drop-shadow(0 0 9px rgba(255,200,60,.6))}
    /* footer nav */
    .ld-nav{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:20px;flex-wrap:wrap}
    .ld-dots{display:flex;gap:8px}
    .ld-dot{width:10px;height:10px;border-radius:50%;background:rgba(150,180,255,.28);cursor:pointer;transition:.2s}
    .ld-dot.on{width:30px;background:linear-gradient(90deg,#ffce3a,#ffe06a);box-shadow:0 0 12px rgba(255,200,60,.6)}
    .ld-btns{display:flex;gap:10px;margin-left:auto}
    .ld-btn{padding:13px 26px;border-radius:13px;cursor:pointer;font:800 .74rem/1 'Orbitron',sans-serif;letter-spacing:.08em;border:none;transition:.16s}
    .ld-btn.gold{background:linear-gradient(135deg,#ffc83d,#ffe26a);color:#0a1330;box-shadow:0 8px 24px rgba(255,200,60,.32)}
    .ld-btn.gold:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(255,200,60,.45)}
    .ld-btn.ghost{background:rgba(255,255,255,.06);color:#cfe0ff;border:1px solid rgba(150,180,255,.3)}
    .ld-btn.ghost:hover{background:rgba(255,255,255,.12)}
    @media (max-width:820px){
      .ld-grid{grid-template-columns:1fr}
      .ld-rocket,.ld-table,.ld-city{display:none}
      .ld-rings{width:320px;height:320px;top:-150px;right:-40px}
      .ld-feats{flex-wrap:wrap;gap:12px}.ld-feat{flex:1 1 28%}.ld-fdiv{display:none}
      .ld-steps,.ld-parts{flex-direction:column}.ld-arrow,.ld-plus{transform:rotate(90deg)}
    }`;
    document.head.appendChild(s);
  }

  /* ─── lesson content (Goal Galaxy = Guardian / district 0) ─────── */
  const LD = window.LESSONDECK = window.LESSONDECK || {};
  LD.guardian = LD.guardian || {};
  LD.guardian[0] = {
    game:['guardian',0],
    slides:[
      { type:'cover', n:1, title:'GOAL <b>GALAXY</b>', subtitle:'Goal-Based Saving Constellations',
        blurb:"Every coin has a destination. Today you'll learn how to build your own savings galaxy!",
        feats:[['🎯','Set Clear Goals'],['🐷','Save Smart'],['🛡️','Keep Money Safe'],['🚀','Build a Better Future'],['🏆','Achieve Your Dreams']],
        time:'5–7 <small>minutes</small>', mission:'Learn how to save money with a purpose!' },

      { type:'define', n:2, title:'WHAT IS<br><b>A SAVING GOAL?</b>',
        body:'A <b>saving goal</b> is money you set aside for something you want in the future.',
        keyIdea:'Money grows faster when it has a clear purpose.',
        swapBad:'“I just want money.”', swapGood:'“I want to save $200 for a bicycle.”',
        rightHead:'EXAMPLES OF SAVING GOALS',
        examples:[['🚲','A new bike','#22c55e'],['🎮','A video game','#8b5cf6'],['🎁','A birthday gift','#f59e0b'],['🎓','College education','#3b82f6'],['✈️','Family vacation','#ec4899']] },

      { type:'steps', n:3, title:'PAY YOURSELF <b>FIRST</b>', subtitle:'Save before you spend!',
        intro:'Whenever you receive money…',
        sources:[['💵','Allowance','#8b5cf6'],['🎁','Birthday Money','#3b82f6'],['🏆','Rewards','#22c55e'],['🛠️','Small Jobs','#f59e0b']],
        rule:'<b>Save some</b> before you spend.',
        steps3:[['1','RECEIVE','your money','💵','#22c55e'],['2','SAVE','some','🪙','#3b82f6'],['3','SPEND','the rest','🛍️','#8b5cf6']],
        example:[['💵','Receive','$10','#34d399'],['🪙','Save','$2','#60a5fa'],['🛍️','Spend','$8','#c084fc']],
        star:'Small savings become <b>BIG</b> savings.' },

      { type:'smart', n:4, title:'MAKE <b>SMART</b> GOALS',
        parts3:[['1','WHAT','You want','🎁','e.g., A new bike','#22c55e'],['2','HOW MUCH','It costs','💵','e.g., $150','#3b82f6'],['3','WHEN','You want it','📅','e.g., In 6 months','#8b5cf6']],
        goal:'“I want <b>$150</b> for a <b>Nintendo Switch</b> in <b>6 months</b>.”',
        exIcons:'🎮 → 💵 → 📅',
        smart:[['S','Specific','Clearly say what you want.','#ef4444'],['M','Measurable','Decide how much.','#f59e0b'],['A','Achievable','Make sure it’s possible.','#22c55e'],['R','Relevant','It should matter to you.','#3b82f6'],['T','Time-based','Set a deadline.','#8b5cf6']],
        tip:'Clear goals = <b>Strong results!</b>' },

      { type:'goodbad', n:5, title:'KEEP MONEY <b>SAFE</b>', subtitle:'Where Should Savings Live?',
        body:'Keeping your money in a safe place helps it grow and keeps it protected.',
        keyIdea:'Safe money stays protected.', kico:'🛡️',
        tip:'Ask a grown-up to help you choose the best place to save.',
        bad:[['🛏️','Under your pillow'],['🎒','In your backpack'],['👖','Loose in your pocket']],
        badWarn:'These places are not safe. Money can get lost or stolen!',
        good:[['🏦','Savings account'],['🐷','Piggy bank'],['🫙','Family savings jar']],
        goodNote:'Safe places help your money grow!' }
    ]
  };

  /* ─── per-hub cosmic background image (from assets/bg) ─────────── */
  const BG = {
    guardian:'assets/bg/cosmic_main.jpeg', strategist:'assets/bg/cosmic_frontier.jpeg',
    investor:'assets/bg/cosmic_loading.jpeg', builder:'assets/bg/cosmic_main.jpeg',
    risktaker:'assets/bg/cosmic_frontier.jpeg', rebuilder:'assets/bg/cosmic_loading.jpeg',
    credtech:'assets/bg/cosmic_main.jpeg'
  };

  /* ─── DECK GENERATOR ───────────────────────────────────────────────
     Expand a compact per-district spec into a full 5-slide deck using
     the proven slide types. Colors/numbers are auto-assigned so specs
     stay small. See window.LESSON_SPECS (lessonspecs.js) for the data. */
  const PAL=['#22c55e','#8b5cf6','#3b82f6','#f59e0b','#ec4899'];
  const STEPC=['#22c55e','#3b82f6','#8b5cf6'], EXC=['#34d399','#60a5fa','#c084fc'];
  function col(a,k){ return (a&&a[k])||'#3b82f6'; }
  function buildDeck(tk,i,s){
    const slides=[
      { type:'cover', n:1, title:s.title, subtitle:s.tag, blurb:s.blurb,
        feats:s.feats, time:'5–7 <small>minutes</small>', mission:s.mission },
      { type:'define', n:2, title:s.qTitle, body:s.what, keyIdea:s.key,
        swapBad:s.swapBad, swapGood:s.swapGood, rightHead:s.examplesHead||'EXAMPLES',
        examples:(s.examples||[]).map((e,k)=>[e[0],e[1],PAL[k%5]]) },
      { type:'steps', n:3, title:s.stepsTitle, subtitle:s.stepsSub, intro:s.intro,
        sources:(s.sources||[]).map((x,k)=>[x[0],x[1],PAL[k%5]]),
        rule:s.rule,
        steps3:(s.steps||[]).map((x,k)=>[String(k+1),x[0],x[1],x[2],col(STEPC,k)]),
        example:(s.example||[]).map((x,k)=>[x[0],x[1],x[2],col(EXC,k)]),
        star:s.star },
      { type:'smart', n:4, title:s.smartTitle,
        parts3:(s.parts||[]).map((x,k)=>[String(k+1),x[0],x[1],x[2],x[3],col(STEPC,k)]),
        goal:s.goal, exIcons:s.exIcons, smartHead:s.smartHead||'SMART RULES',
        smart:(s.rules5||[]).map((r,k)=>[String(k+1),r[0],r[1],PAL[k%5]]),
        tip:s.smartTip },
      { type:'goodbad', n:5, title:s.gbTitle, subtitle:s.gbSub, body:s.gbBody,
        keyIdea:s.gbKey, kico:s.kico, tip:s.tip,
        badHead:s.badHead, bad:s.bad, badWarn:s.badWarn,
        goodHead:s.goodHead, good:s.good, goodNote:s.goodNote }
    ];
    return { game:[tk,i], slides, bg:s.bg||BG[tk] };
  }
  window.ldBuildDeck=buildDeck;   // exposed for testing

  // Populate LESSONDECK from LESSON_SPECS (each spec → generated deck),
  // never overwriting an explicit hand-authored deck (e.g. guardian[0]).
  function applySpecs(){
    const S=window.LESSON_SPECS; if(!S) return;
    Object.keys(S).forEach(tk=>{ LD[tk]=LD[tk]||{};
      (S[tk]||[]).forEach((spec,i)=>{ if(spec && !LD[tk][i]) LD[tk][i]=buildDeck(tk,i,spec); });
    });
  }
  applySpecs();
  window.ldApplySpecs=applySpecs;   // re-run if specs load late

  /* ─── state + render ───────────────────────────────────────────── */
  let cur=0, deck=null, token=null, dIdx=0;

  window.openLessonDeck=function(tk, i){
    injectCSS();
    const d = LD[tk] && LD[tk][i]; if(!d){ return false; }
    deck=d; token=tk; dIdx=i; cur=0;
    const old=document.getElementById('ldRoom'); if(old) old.remove();
    const ov=document.createElement('div'); ov.id='ldRoom'; ov.className='ld-room';
    let blds=''; [78,54,92,66,100,72,58].forEach(h=>blds+=`<div class="ld-bld" style="height:${h}%"></div>`);
    const bg = deck.bg || BG[tk] || 'assets/bg/cosmic_main.jpeg';
    ov.innerHTML=`<div class="ld-amb"><div class="ld-bg" style="background-image:url('${bg}')"></div><div class="ld-stars"></div><div class="ld-rings"></div><div class="ld-city">${blds}</div><div class="ld-rocket">🚀</div><div class="ld-table"></div></div>
      <div class="ld-stage"><button class="ld-x" onclick="ldClose()">✕</button><div class="ld-board" id="ldBoard"></div></div>`;
    document.body.appendChild(ov);
    ov._key=e=>{ if(e.key==='Escape')ldClose(); else if(e.key==='ArrowRight')ldNext(); else if(e.key==='ArrowLeft')ldPrev(); };
    window.addEventListener('keydown',ov._key);
    render();
    return true;
  };

  function render(){
    const b=document.getElementById('ldBoard'); if(!b) return;
    const s=deck.slides[cur], n=deck.slides.length;
    const sub = s.subtitle ? `<div class="ld-sub${s.type==='define'?' cy':''}">${s.subtitle}</div>` : '';
    b.innerHTML=`<span class="ld-pill">★ LESSON ${s.n}</span>
      <h1 class="ld-title">${s.title}</h1>${sub}
      ${body(s)}
      <div class="ld-nav">
        <div class="ld-dots">${deck.slides.map((_,k)=>`<span class="ld-dot${k===cur?' on':''}" onclick="ldGo(${k})"></span>`).join('')}</div>
        <div class="ld-btns">
          ${cur>0?`<button class="ld-btn ghost" onclick="ldPrev()">← BACK</button>`:''}
          ${cur<n-1?`<button class="ld-btn gold" onclick="ldNext()">NEXT →</button>`:`<button class="ld-btn gold" onclick="ldPlay()">▶ PLAY: ${(window.gameNameFor?window.gameNameFor(token,dIdx):'GAME').toUpperCase()}</button>`}
        </div>
      </div>`;
    b.scrollTop=0;
  }

  /* ─── per-type bodies ──────────────────────────────────────────── */
  function rail(head,items){
    return `<div class="ld-rail"><div class="ld-rhead">${head}</div>${items.map(it=>
      `<div class="ld-lrow"><span class="ld-chip" style="background:${it[2]}">${it[0]}</span><span class="t">${it[1]}</span></div>`).join('')}</div>`;
  }
  function body(s){
    if(s.type==='cover') return `
      <div class="ld-grid">
        <div class="ld-left"><div class="ld-blurb"><span>⭐</span><p>${s.blurb}</p></div></div>
        <div class="ld-right"><div class="ld-rail">
          <div class="ld-rrow"><span class="ld-rico" style="background:#1e6eff">⏱️</span><div><div class="ld-rlbl">LEARNING TIME</div><div class="ld-rval">${s.time}</div></div></div>
          <div class="ld-rrow"><span class="ld-rico" style="background:#7c3aed">🎯</span><div><div class="ld-rlbl" style="color:#c4b5fd">MISSION</div><div class="ld-rtxt">${s.mission}</div></div></div>
        </div></div>
      </div>
      <div class="ld-feats">${s.feats.map(f=>`<div class="ld-feat"><span class="ld-fico">${f[0]}</span><span class="ld-flbl">${f[1]}</span></div>`).join('<span class="ld-fdiv"></span>')}</div>`;

    if(s.type==='define') return `
      <div class="ld-grid">
        <div class="ld-left">
          <p class="ld-lead">${s.body}</p>
          <div class="ld-card ld-key"><span class="ld-kico">⭐</span><div><div class="ld-klbl">KEY IDEA</div><div>${s.keyIdea}</div></div></div>
          <div class="ld-card ld-swap">
            <div class="ld-swh">💡 INSTEAD OF SAYING…</div><div class="ld-swarr">→</div><div class="ld-swh g">SAY…</div>
            <div class="ld-swbad">${s.swapBad}</div><div class="ld-swgood">${s.swapGood}</div>
          </div>
        </div>
        <div class="ld-right">${rail(s.rightHead,s.examples)}</div>
      </div>`;

    if(s.type==='steps') return `
      <div class="ld-grid">
        <div class="ld-left">
          <p class="ld-lead2">${s.intro}</p>
          <div class="ld-srcs">${s.sources.map(x=>`<div class="ld-src" style="--c:${x[2]}"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
          <div class="ld-card ld-tip"><span>💡</span><div>Follow this simple rule: ${s.rule}</div></div>
        </div>
        <div class="ld-right">
          <div class="ld-steps">${s.steps3.map(x=>`<div class="ld-step" style="--c:${x[4]}"><div class="ld-snum">${x[0]}</div><div class="ld-stit">${x[1]}</div><div class="ld-ssub">${x[2]}</div><div class="ld-sico">${x[3]}</div></div>`).join('<span class="ld-arrow">→</span>')}</div>
          <div class="ld-exbox"><span class="ld-exh">EXAMPLE</span><div class="ld-exrow">${s.example.map((x,j)=>`${j?'<span class="ld-arrow">→</span>':''}<div class="ld-exi"><div class="e">${x[0]}</div><div class="l">${x[1]}</div><div class="v" style="color:${x[3]}">${x[2]}</div></div>`).join('')}</div></div>
          <div class="ld-star">${s.star}</div>
        </div>
      </div>`;

    if(s.type==='smart') return `
      <div class="ld-grid">
        <div class="ld-left">
          <div class="ld-parts">${s.parts3.map(x=>`<div class="ld-part" style="--c:${x[5]}"><div class="ld-pnum">${x[0]}</div><div class="ld-ptit">${x[1]}</div><div class="ld-psub">${x[2]}</div><div class="ld-pico">${x[3]}</div><div class="ld-peg">${x[4]}</div></div>`).join('<span class="ld-plus">+</span>')}</div>
          <div class="ld-card ld-exgoal"><span class="ld-exh">EXAMPLE GOAL</span><div class="ld-goal">${s.goal}</div><div class="ld-exicons">${s.exIcons}</div></div>
        </div>
        <div class="ld-right">
          <div class="ld-rail"><div class="ld-rhead">${s.smartHead||'SMART GOALS'}</div>${s.smart.map(m=>`<div class="ld-srow"><span class="ld-sbadge" style="background:${m[3]}">${m[0]}</span><div><b>${m[1]}</b><span>${m[2]}</span></div></div>`).join('')}</div>
          <div class="ld-card ld-tip"><span>💡</span><div>${s.tip}</div></div>
        </div>
      </div>`;

    if(s.type==='goodbad') return `
      <div class="ld-grid">
        <div class="ld-left">
          <p class="ld-lead">${s.body}</p>
          <div class="ld-card ld-key"><span class="ld-kico">${s.kico||'🛡️'}</span><div><div class="ld-klbl">KEY IDEA</div><div>${s.keyIdea}</div></div></div>
          <div class="ld-card ld-tip"><span>💡</span><div>${s.tip}</div></div>
        </div>
        <div class="ld-right">
          <div class="ld-gbsec bad"><div class="ld-gbh">❌ ${s.badHead||'BAD PLACES'}</div><div class="ld-gbcards">${s.bad.map(x=>`<div class="ld-gbcard"><span class="ld-badge x">✕</span><div class="ld-gbico">${x[0]}</div><div class="ld-gblbl">${x[1]}</div></div>`).join('')}</div><div class="ld-warn">⚠️ ${s.badWarn}</div></div>
          <div class="ld-gbsec good"><div class="ld-gbh" style="color:#86efac">✅ ${s.goodHead||'GOOD PLACES'}</div><div class="ld-gbcards">${s.good.map(x=>`<div class="ld-gbcard"><span class="ld-badge ok">✓</span><div class="ld-gbico">${x[0]}</div><div class="ld-gblbl">${x[1]}</div></div>`).join('')}</div><div class="ld-note">${s.goodNote}</div></div>
        </div>
      </div>`;
    return '';
  }

  /* ─── nav ──────────────────────────────────────────────────────── */
  window.ldNext=function(){ if(cur<deck.slides.length-1){ cur++; render(); } };
  window.ldPrev=function(){ if(cur>0){ cur--; render(); } };
  window.ldGo=function(k){ if(k>=0&&k<deck.slides.length){ cur=k; render(); } };
  window.ldClose=function(){ const o=document.getElementById('ldRoom'); if(o){ if(o._key)window.removeEventListener('keydown',o._key); o.remove(); } };
  window.ldPlay=function(){ const g=deck.game||[token,dIdx]; ldClose(); if(window.playDistrictGame) playDistrictGame(g[0],g[1]); };
})();
