// ╔══════════════════════════════════════════════════════════╗
// ║ COINAVERSE — V14.1 FULL APP (May 22, 2026)                ║
// ║ Self-contained · 7 hubs · 13 screens · MOBA-style home    ║
// ╚══════════════════════════════════════════════════════════╝

(function() {
  'use strict';

  window.state = {
    coins: 100, cred: 350, credPct: 41,
    level: 1, streak: 3, xp: 60, xpMax: 100,
    playerName: 'Hero', archetype: null, selectedArchetype: null,
    viewingWorld: null, inventory: [], completedMissions: 0,
    friends: [], party: [], dailyClaimed: [true,true,true,false,false,false,false],
    vault: 0, security: 88, emergency: 60, vaultAura: false, smartSaver: false,
    ageBand: null, parentEmail: '', parentConsent: false, securityChamp: false,
    restrictions: {timeLimit:true,approvePurchases:true,safeMultiplayer:true,moderatedComms:true},
  };

  // 7 HUBS METADATA
  const WORLDS = {
    strategist: {
      id:'strategist', name:'BUDGETRON', zone:'BUDGETRON BASE',
      archetype:'THE STRATEGIST', tagline:'Strategy command center · Plan, allocate, master your money.',
      power:'Tactical Planning · Resource Allocation', icon:'🧠',
      sceneBg:'assets/worlds/budgetron.jpeg', character:'assets/characters/strategist.png', color:'strategist',
      progressLabel:'Strategy Index', rewardName:'Tactical Cache',
      missions:[
        {name:'Build 3 Budgets', done:0, total:3, reward:'XP 200'},
        {name:'Save 50 Coins', done:10, total:50, reward:'💰 100'},
        {name:'Plan Weekly Spend', done:4, total:10, reward:'XP 150'},
      ],
    },
    builder: {
      id:'builder', name:'LAUNCH LAB', zone:'LAUNCH LAB REALM',
      archetype:'THE BUILDER', tagline:'Entrepreneur lab · Build, ship, launch your first venture.',
      power:'Innovation · Idea-to-Product', icon:'🚀',
      sceneBg:'assets/worlds/launch_lab.jpeg', character:'assets/characters/builder.png', color:'builder',
      progressLabel:'Build Progress', rewardName:'Founder Crate',
      missions:[
        {name:'Ship 1 Mini Product', done:0, total:1, reward:'XP 200'},
        {name:'Sell 50 Coins Worth', done:12, total:50, reward:'💰 100'},
        {name:'Launch 3 Ideas', done:1, total:3, reward:'XP 150'},
      ],
    },
    investor: {
      id:'investor', name:'INVESTOPIA', zone:'INVESTOPIA',
      archetype:'THE INVESTOR', tagline:'Wealth-growing world · Invest, grow, and build your legacy.',
      power:'Patient Growth · Compounding', icon:'📈',
      sceneBg:'assets/worlds/investopia.jpeg', character:'assets/characters/investor.png', color:'investor',
      progressLabel:'Wealth Index', rewardName:'Legendary Investor Chest',
      missions:[
        {name:'Make 3 Investments', done:0, total:3, reward:'XP 200'},
        {name:'Earn 50 Coins', done:10, total:50, reward:'💰 100'},
        {name:'Grow Portfolio 10%', done:4, total:10, reward:'XP 150'},
      ],
    },
    guardian: {
      id:'guardian', name:'SAVESCAPE ORBIT', zone:'SAVESCAPE ORBIT',
      archetype:'THE GUARDIAN', tagline:'Saving fortress · Protect, secure, defend your treasure.',
      power:'Discipline · Vault Defense', icon:'🛡️',
      sceneBg:'assets/worlds/savescape_orbit.jpeg', character:'assets/characters/guardian.png', color:'guardian',
      progressLabel:'Savings Vault', rewardName:'Defender Reward',
      missions:[
        {name:'Save 7 Days in a Row', done:3, total:7, reward:'XP 200'},
        {name:'Lock 100 Coins', done:25, total:100, reward:'💰 100'},
        {name:'Hit 1 Vault Goal', done:0, total:1, reward:'XP 150'},
      ],
    },
    risktaker: {
      id:'risktaker', name:'BITSTREAM VALLEY', zone:'BITSTREAM VALLEY',
      archetype:'THE RISK TAKER', tagline:'High-risk arena · Trade smart, embrace volatility, win big.',
      power:'Bold Moves · Market Reading', icon:'⚡',
      sceneBg:'assets/worlds/bitstream_valley.jpeg', character:'assets/characters/risktaker.png', color:'risktaker',
      progressLabel:'Risk Mastery', rewardName:'Volatility Vault',
      missions:[
        {name:'Win 3 Trades', done:1, total:3, reward:'XP 200'},
        {name:'Earn 100 Coins', done:35, total:100, reward:'💰 100'},
        {name:'Survive 5 Streaks', done:2, total:5, reward:'XP 150'},
      ],
    },
    rebuilder: {
      id:'rebuilder', name:'DEBT DETOX', zone:'DEBT DETOX DISTRICT',
      archetype:'THE REBUILDER', tagline:'Recovery & rebuild zone · Complete missions to restore and earn rewards.',
      power:'Resilience · Phoenix Comeback', icon:'☠️',
      sceneBg:'assets/worlds/debt_detox.jpeg', character:'assets/characters/rebuilder.png', color:'rebuilder',
      progressLabel:'District Recovery', rewardName:'Epic Supply Crate',
      missions:[
        {name:'Complete 3 Missions', done:0, total:3, reward:'XP 200'},
        {name:'Earn 50 Coins', done:10, total:50, reward:'💰 100'},
        {name:'Defeat 10 Enemies', done:4, total:10, reward:'XP 150'},
      ],
    },
    credtech: {
      id:'credtech', name:'CREDTECH GALAXY', zone:'CREDTECH GALAXY · UNIVERSAL ZONE',
      archetype:'UNIVERSAL ZONE', tagline:'Unlockable zone for ALL archetypes · your Cred Score follows you across every hub.',
      power:'Credit Mastery · Trust Building', icon:'⭐',
      sceneBg:'assets/bg/home_galaxy_map.png', character:'assets/characters/guardian.png', color:'credtech',
      progressLabel:'Cred Score', rewardName:'Master Hub Reward',
      missions:[
        {name:'Boost Cred Score +50', done:20, total:50, reward:'XP 300'},
        {name:'Visit All 6 Hubs', done:3, total:6, reward:'💰 200'},
        {name:'Maintain 7-Day Streak', done:3, total:7, reward:'XP 200'},
      ],
    },
  };
  window.WORLDS = WORLDS;
  // v17 — wire in generated 3D assets (portrait=pills, hero=full body, mapImg=radial map art)
  Object.keys(WORLDS).forEach(function(k){
    if (k==='credtech') { WORLDS[k].mapImg='assets/map/credtech_central.jpeg'; return; }
    WORLDS[k].portrait='assets/characters/'+k+'_portrait.png';
    WORLDS[k].hero='assets/characters/'+k+'_hero.png';
    WORLDS[k].mapImg='assets/map/'+k+'.jpeg';
    WORLDS[k].character=WORLDS[k].portrait;   // pills/cards use portrait
  });

  const EPISODES = [
    {id:'ep01', title:'The Origins', subtitle:'Episode 01 · Season 01', cover:'assets/movies/ep01_origins.jpeg', duration:'24 min', tag:'NEW', desc:'Eight kids discover the Coinverse and unlock their archetype powers for the first time.'},
    {id:'ep02', title:'Debt Phantom', subtitle:'Episode 02 · Season 01', cover:'assets/movies/ep02_debt_phantom.jpeg', duration:'22 min', tag:'', desc:'Heroes face the Debt Phantom in the ruined district.'},
    {id:'ep03', title:'Dimensional Run', subtitle:'Episode 03 · Season 01', cover:'assets/movies/ep03_dimensional.jpeg', duration:'25 min', tag:'HOT', desc:'A reality-warping journey across the Coinverse zones.'},
    {id:'ep04', title:'Squad Assemble', subtitle:'Episode 04 · Season 01', cover:'assets/movies/ep04_squad.jpeg', duration:'28 min', tag:'', desc:'The eight heroes unite to form the Coinverse Squad.'},
    {id:'ep05', title:'Team United', subtitle:'Episode 05 · Season 01', cover:'assets/movies/ep05_team_united.jpeg', duration:'21 min', tag:'', desc:'Five heroes lead the charge against rising villains.'},
    {id:'ep06', title:"Bahati's Leap", subtitle:'Spotlight · Investor', cover:'assets/movies/ep06_bahati.jpeg', duration:'18 min', tag:'', desc:'Bahati makes her first investment — the stakes have never been higher.'},
    {id:'ep07', title:'Pluto Saves', subtitle:'Spotlight · Guardian', cover:'assets/movies/ep07_pluto.jpeg', duration:'17 min', tag:'', desc:'Pluto guards the savings vault from the greatest heist of the year.'},
    {id:'ep08', title:'Zuna Builds', subtitle:'Spotlight · Builder', cover:'assets/movies/ep08_zuna.jpeg', duration:'19 min', tag:'', desc:'Zuna launches her own business and reshapes Launch Lab.'},
    {id:'ep09', title:"Mr. JQ's Lesson", subtitle:'Mentor · Special', cover:'assets/movies/ep09_mentor.jpeg', duration:'15 min', tag:'', desc:'The mentor returns with the secrets of credit, compound, and consequence.'},
    {id:'ep10', title:'Coin City Rises', subtitle:'Mid-Season Finale', cover:'assets/movies/ep10_coin_city.jpeg', duration:'34 min', tag:'EVENT', desc:'Coin City becomes the center of the universe — and the target.'},
    {id:'ep11', title:'Dollar Villain', subtitle:'Episode 11 · Season 01', cover:'assets/movies/ep11_dollar_villain.jpeg', duration:'26 min', tag:'', desc:'The Dollar Villain unleashes the money flood that drowns Investopia.'},
    {id:'ep12', title:'Season Finale', subtitle:'Episode 12 · Season 01', cover:'assets/movies/ep12_finale.jpeg', duration:'42 min', tag:'FINALE', desc:'The final stand. Heroes vs villains — the fate of every world hangs in the balance.'},
  ];

  const SHOP_ITEMS = [
    {id:'m01', cat:'Drinks', name:'Investor Tonic', desc:'Glowing gold liquid — +10% earn boost / 24h.', price:350, tag:'NEW', tagClass:'', img:'assets/shop/merch_jar_gold.jpeg'},
    {id:'m02', cat:'Drinks', name:'Builder Brew', desc:'Emerald spark — speeds up Launch Lab missions.', price:280, tag:'', tagClass:'', img:'assets/shop/merch_jar_green.jpeg'},
    {id:'m03', cat:'Drinks', name:'Guardian Frost', desc:'Ice blue elixir — saves bonus +15% / week.', price:320, tag:'HOT', tagClass:'gold', img:'assets/shop/merch_jar_blue.jpeg'},
    {id:'m04', cat:'Drinks', name:'Squad Drink Set', desc:'All four signature flavors — collector pack.', price:1200, tag:'-20%', tagClass:'red', img:'assets/shop/merch_drink_set.jpeg'},
    {id:'m05', cat:'Crystals', name:'Aqua Resource Gem', desc:'Cyan crystal — unlocks Bitstream resources.', price:480, tag:'', tagClass:'', img:'assets/shop/merch_crystal_blue.jpeg'},
    {id:'m06', cat:'Crystals', name:'Purple Voidstone', desc:'Rare violet crystal — Debt Detox boost.', price:620, tag:'RARE', tagClass:'purple', img:'assets/shop/merch_crystal_purple.jpeg'},
    {id:'m07', cat:'Crystals', name:'Cosmic Gold Crystal', desc:'Legendary gem — daily XP multiplier ×2.', price:1500, tag:'LEGEND', tagClass:'gold', img:'assets/shop/merch_crystal_gold.jpeg'},
    {id:'m08', cat:'Currency', name:'Cosmic Coin Stack', desc:'+500 Coins immediately added to your account.', price:999, tag:'', tagClass:'', img:'assets/shop/merch_coin_cosmic.jpeg'},
    {id:'m09', cat:'Apparel', name:'Hero Shield Badge', desc:'Equip-able badge for your profile avatar.', price:200, tag:'', tagClass:'', img:'assets/shop/merch_badge.jpeg'},
    {id:'m10', cat:'Apparel', name:'Victory Star Cape', desc:'Golden star cape — show off your wins.', price:450, tag:'', tagClass:'', img:'assets/shop/merch_star.jpeg'},
    {id:'m11', cat:'Apparel', name:'Squad Sticker Pack', desc:'12 signature character stickers.', price:150, tag:'', tagClass:'', img:'assets/shop/merch_stickers.jpeg'},
    {id:'m12', cat:'Decor', name:'Squad TV Screen', desc:'Decor — hangs in your profile background.', price:380, tag:'NEW', tagClass:'', img:'assets/shop/merch_tv.jpeg'},
  ];

  // FRIENDS DATA
  const FRIENDS = [
    {id:'f1', name:'Bahati K.',  arch:'INVESTOR',   char:'assets/characters/investor.png',   online:true,  status:'In Investopia',     lvl:14},
    {id:'f2', name:'Zuna T.',    arch:'BUILDER',    char:'assets/characters/builder.png',     online:true,  status:'Crafting in Launch Lab', lvl:11},
    {id:'f3', name:'Kojo M.',    arch:'STRATEGIST', char:'assets/characters/strategist.png',  online:true,  status:'Planning quarterly budget', lvl:18},
    {id:'f4', name:'Pluto S.',   arch:'GUARDIAN',   char:'assets/characters/guardian.png',    online:false, status:'Last seen 2h ago',  lvl:9 },
    {id:'f5', name:'Nova R.',    arch:'RISK TAKER', char:'assets/characters/risktaker.png',   online:true,  status:'Trading in Bitstream', lvl:16},
    {id:'f6', name:'Aria J.',    arch:'REBUILDER',  char:'assets/characters/rebuilder.png',   online:false, status:'Last seen 1d ago',  lvl:7 },
    {id:'f7', name:'Echo D.',    arch:'STRATEGIST', char:'assets/characters/strategist.png',  online:true,  status:'On Coinaverse',     lvl:12},
    {id:'f8', name:'Lumen P.',   arch:'INVESTOR',   char:'assets/characters/investor.png',    online:false, status:'Offline · 3h ago',  lvl:13},
  ];

  // LEADERBOARDS DATA
  const LEADERBOARDS = {
    weekly: [
      {rank:1, name:'Bahati K.', arch:'INVESTOR',   char:'assets/characters/investor.png',  score:14820, change:'up'},
      {rank:2, name:'Kojo M.',   arch:'STRATEGIST', char:'assets/characters/strategist.png', score:13950, change:'eq'},
      {rank:3, name:'Nova R.',   arch:'RISK TAKER', char:'assets/characters/risktaker.png',  score:12100, change:'up'},
      {rank:4, name:'Zuna T.',   arch:'BUILDER',    char:'assets/characters/builder.png',    score:11680, change:'dn'},
      {rank:5, name:'Echo D.',   arch:'STRATEGIST', char:'assets/characters/strategist.png', score:10240, change:'up'},
      {rank:6, name:'Lumen P.',  arch:'INVESTOR',   char:'assets/characters/investor.png',   score:9670,  change:'eq'},
      {rank:7, name:'Pluto S.',  arch:'GUARDIAN',   char:'assets/characters/guardian.png',   score:8900,  change:'dn'},
      {rank:8, name:'You',       arch:'GUARDIAN',   char:'assets/characters/guardian.png',   score:7350,  change:'up', isYou:true},
      {rank:9, name:'Aria J.',   arch:'REBUILDER',  char:'assets/characters/rebuilder.png',  score:6820,  change:'up'},
      {rank:10,name:'Cipher Z.', arch:'RISK TAKER', char:'assets/characters/risktaker.png',  score:6210,  change:'dn'},
    ],
    monthly: [
      {rank:1, name:'Kojo M.',   arch:'STRATEGIST', char:'assets/characters/strategist.png', score:48200, change:'up'},
      {rank:2, name:'Bahati K.', arch:'INVESTOR',   char:'assets/characters/investor.png',   score:45600, change:'eq'},
      {rank:3, name:'Echo D.',   arch:'STRATEGIST', char:'assets/characters/strategist.png', score:39100, change:'up'},
      {rank:4, name:'Nova R.',   arch:'RISK TAKER', char:'assets/characters/risktaker.png',  score:36480, change:'dn'},
      {rank:5, name:'Zuna T.',   arch:'BUILDER',    char:'assets/characters/builder.png',    score:32800, change:'up'},
      {rank:6, name:'You',       arch:'GUARDIAN',   char:'assets/characters/guardian.png',   score:28500, change:'up', isYou:true},
      {rank:7, name:'Lumen P.',  arch:'INVESTOR',   char:'assets/characters/investor.png',   score:26900, change:'dn'},
    ],
    alltime: [
      {rank:1, name:'Kojo M.',   arch:'STRATEGIST', char:'assets/characters/strategist.png', score:182400, change:'eq'},
      {rank:2, name:'Bahati K.', arch:'INVESTOR',   char:'assets/characters/investor.png',   score:178300, change:'eq'},
      {rank:3, name:'Nova R.',   arch:'RISK TAKER', char:'assets/characters/risktaker.png',  score:152100, change:'up'},
      {rank:4, name:'Zuna T.',   arch:'BUILDER',    char:'assets/characters/builder.png',    score:144700, change:'dn'},
      {rank:5, name:'Echo D.',   arch:'STRATEGIST', char:'assets/characters/strategist.png', score:131500, change:'eq'},
      {rank:18, name:'You',      arch:'GUARDIAN',   char:'assets/characters/guardian.png',   score:42800,  change:'up', isYou:true},
    ],
  };

  // ───────── VIDEO BACKGROUND HELPER ─────────
  // Returns a full-bleed looping video + readability veil. muted=true so it
  // autoplays visually; audio is unmuted on the first user gesture (browser rule).
  window.vbg = function(name, poster, opts) {
    opts = opts || {};
    const p   = poster ? ` poster="${poster}"` : '';
    const cls = opts.cls ? ` ${opts.cls}` : '';
    const id  = opts.id ? ` id="${opts.id}"` : '';
    return `<video class="scr-vid${cls}"${id} autoplay loop muted playsinline preload="auto"${p}>
              <source src="assets/video/${name}.mp4" type="video/mp4">
            </video><div class="scr-veil"></div>`;
  };

  // ───────── AUDIO / VIDEO MANAGER ─────────
  const AUDIO = {
    bgm:     new Audio('assets/audio/bgm.mp3'),
    home:    new Audio('assets/audio/voice_home.mp3'),
    welcome: new Audio('assets/audio/voice_welcome.mp3'),
    game:    new Audio('assets/audio/voice_game.mp3'),
    on: false, homeSpoke: false, lastHub: '', cur: null,
  };
  AUDIO.bgm.loop = true; AUDIO.bgm.volume = 0.16;
  const BGM_FULL = 0.16, BGM_DUCK = 0.05;

  function duckBgm(low) { AUDIO.bgm.volume = low ? BGM_DUCK : BGM_FULL; }

  function playVoice(aud) {
    if (!AUDIO.on || !aud) return;
    try {
      if (AUDIO.cur && AUDIO.cur !== aud) { AUDIO.cur.pause(); }
      AUDIO.cur = aud;
      duckBgm(true);
      aud.currentTime = 0; aud.volume = 1;
      aud.play().catch(()=>{});
      aud.onended = () => { if (!document.querySelector('.scr-vid')) duckBgm(false); };
    } catch(e){}
  }
  // play any clip by filename stem (e.g. "credtech_hub_welcome", "guardian_d01_lesson")
  const _clipCache = {};
  window.playClip = function(name) {
    if (!AUDIO.on || !name) return;
    let a = _clipCache[name] || (_clipCache[name] = new Audio(`assets/audio/${name}.mp3`));
    playVoice(a);
  };

  window.stopVoice = function(){ try{ if(AUDIO.cur){AUDIO.cur.pause();} [AUDIO.home,AUDIO.welcome,AUDIO.game].forEach(a=>{try{a.pause();}catch(e){}}); }catch(e){} };
  window.isAudioOn = function(){ return AUDIO.on; };
  window.duckBgmForVideo = function(low){ try{ duckBgm(low); }catch(e){} };

  // unmute the active screen video + start bgm on first user gesture
  function unlockAudio() {
    if (AUDIO.on) return;
    AUDIO.on = true;
    AUDIO.bgm.play().catch(()=>{});
    applyAV(state.currentScreen);
  }
  document.addEventListener('pointerdown', unlockAudio);

  // called after every screen render
  function applyAV(screenId) {
    const vid = document.querySelector('.scr-vid, .home-bg-video');
    // ALWAYS force play (muted until audio unlocked) so no native play button shows
    document.querySelectorAll('.scr-vid:not(.wvid), .home-bg-video').forEach(v => {
      v.muted = true;   // background videos stay muted -> iOS/Safari autoplays them (no ► play button)
      const pr = v.play(); if (pr && pr.catch) pr.catch(()=>{});
    });
    if (AUDIO.on) {
      duckBgm(!!vid);                 // bgm ducks while a screen video plays
    }
    // spoken cues
    if (screenId === 'greet') {
      if (window.stopVoice) stopVoice();   // robot video has baked "Hey Hero" voice — no separate ElevenLabs
      const gv = document.getElementById('greetVid');
      if (gv){ gv.muted = false; gv.volume = 1; gv.play().catch(()=>{ gv.muted = true; gv.play().catch(()=>{}); }); }
    }
    else if (screenId === 'home' && !AUDIO.homeSpoke) { AUDIO.homeSpoke = true; playVoice(AUDIO.home); }
    else if (screenId === 'game') playVoice(AUDIO.game);
    else if (screenId === 'hub' || screenId === 'world_detail' || screenId === 'credtech_hub') {
      const t = state.viewingWorld || state.archetype || 'credtech';
      if (AUDIO.lastHub !== t) { AUDIO.lastHub = t; playClip(t + '_hub_welcome'); }
    }
    else if (screenId === 'welcome') {
      if (window.stopVoice) stopVoice();   // character lip-sync video has its OWN voice — no ElevenLabs
      const wv = document.getElementById('welcomeVid');
      if (wv){ wv.muted = false; wv.volume = 1; wv.play().catch(()=>{ wv.muted = true; wv.play().catch(()=>{}); }); }
    }
  }

  function avToggle() {
    AUDIO.on = !AUDIO.on;
    if (AUDIO.on) { AUDIO.bgm.play().catch(()=>{}); applyAV(state.currentScreen); }
    else {
      AUDIO.bgm.pause();
      document.querySelectorAll('video').forEach(v => v.muted = true);
      [AUDIO.home,AUDIO.welcome,AUDIO.game].forEach(a=>{a.pause();});
    }
    const b = document.getElementById('avToggle'); if (b) b.textContent = AUDIO.on ? '🔊' : '🔇';
  }
  window.avToggle = avToggle;

  // ROUTING
  window.SCREENS = {};
  try{ window.HUBX = HUBX; }catch(e){}
  window.goTo = function(screenId, opts) {
    const app = document.getElementById('app');
    if (typeof SCREENS[screenId] !== 'function') {
      app.innerHTML = `<div style="padding:80px;text-align:center;color:#fff;font-family:Orbitron">${screenId} not registered</div>`;
      return;
    }
    app.innerHTML = SCREENS[screenId](opts);
    state.currentScreen = screenId;
    window.scrollTo(0, 0);
    // persistent audio toggle button
    if (!document.getElementById('avToggle')) {
      const b = document.createElement('div');
      b.id = 'avToggle'; b.className = 'av-toggle'; b.textContent = '🔊';
      b.setAttribute('onclick', 'avToggle()');
      document.body.appendChild(b);
    }
    applyAV(screenId);
  };

  // ───────── SCREEN: SPLASH ─────────
  SCREENS.splash = function() {
    setTimeout(() => goTo('signin'), 10000);
    return `
      <div class="v14-splash has-vid">
        ${vbg('splash','assets/bg/cosmic_main.jpeg')}
        <div class="v14-splash-logo">COINAVERSE</div>
        <div class="v14-splash-tagline">EXPLORE · LEARN · EARN · GROW</div>
        <div class="v14-splash-bar"><div class="v14-splash-bar-fill"></div></div>
        <div class="v14-splash-pct">LOADING UNIVERSE...</div>
      </div>`;
  };

  // ───────── SCREEN: SIGNIN ─────────
  SCREENS.signin = function() {
    return `
      <div class="v14-signin has-vid">
        ${vbg('signin','assets/bg/cosmic_frontier.jpeg')}
        <div class="v14-signin-left">
          <div class="v14-signin-eyebrow">COINAVERSE · KIDS FINANCE UNIVERSE</div>
          <h1 class="v14-signin-h1">Master your money.<br>Save the universe.</h1>
          <p class="v14-signin-desc">Pick your hero. Conquer 7 worlds. Learn real-life finance skills — budgeting, saving, investing, building — through interactive gameplay and cinematic stories.</p>
          <div class="v14-signin-tags">
            <span class="v14-signin-tag">AGES 7-14</span>
            <span class="v14-signin-tag">7 WORLDS</span>
            <span class="v14-signin-tag">12 EPISODES</span>
            <span class="v14-signin-tag">PARENT-APPROVED</span>
          </div>
        </div>
        <div class="v14-signin-right">
          <div class="v14-signin-card">
            <h2>JUMP IN</h2>
            <p>Create your hero profile to start earning, learning, and growing.</p>
            <button class="v14-signin-btn" onclick="cvSocial('google')">📧  Continue with Google</button>
            <button class="v14-signin-btn" onclick="cvSocial('apple')">🍎  Continue with Apple</button>
            <div class="v14-signin-divider">OR EMAIL</div>
            <input id="cvEmail" class="v14-signin-input" type="email" placeholder="Email">
            <input id="cvPass" class="v14-signin-input" type="password" placeholder="Password">
            <button class="v14-signin-cta" onclick="cvSignup()">CREATE ACCOUNT →</button>
            <button class="v14-signin-guest" onclick="cvGuest()">CONTINUE AS GUEST →</button>
          </div>
        </div>
      </div>`;
  };

  // ───────── SCREEN: GREET ─────────
  SCREENS.greet = function() {
    return `
      <div class="v14-greet has-vid">
        ${vbg('greet','assets/bg/cosmic_main.jpeg',{cls:'wvid',id:'greetVid'})}
        <div class="v14-greet-card">
          <div class="v14-greet-eyebrow">YOUR AI GUIDE</div>
          <h1 class="v14-greet-h1">Hey Hero!<br>I'm CIRCUIT.</h1>
          <p class="v14-greet-desc">I'll be your guide across the Coinverse. First step: discover which archetype you are. Each archetype unlocks a different world and a different way to master money. Ready?</p>
          <button class="v14-greet-cta" onclick="goTo('identity')">DISCOVER MY ARCHETYPE →</button>
        </div>
      </div>`;
  };

  // ───────── SCREEN: IDENTITY (6 archetypes only, credtech is meta-hub) ─────────
  SCREENS.identity = function() {
    const archIds = ['strategist','builder','investor','guardian','risktaker','rebuilder'];
    const AC={strategist:'#3B82F6',builder:'#A855F7',investor:'#10B981',guardian:'#14B8A6',risktaker:'#EF4444',rebuilder:'#F59E0B'};
    const cards = archIds.map(id => {
      const w = WORLDS[id];
      const c=AC[id];
      const isSel=state.selectedArchetype===id;
      return `
        <div class="v14-id-card id--${w.color} ${isSel?'selected':''}"
             onclick="pickArchetype('${id}')"
             style="border-color:${isSel?c:c+'44'};box-shadow:${isSel?`0 0 24px ${c}55,0 8px 24px rgba(0,0,0,.5)`:'0 4px 16px rgba(0,0,0,.4)'};transform:${isSel?'scale(1.03)':'scale(1)'}">
          <div class="v14-id-portrait" style="background:linear-gradient(180deg,${c}22,${c}06)">
            <img src="assets/characters/${id}_portrait.png" style="width:100%;height:100%;object-fit:contain;object-position:bottom center">
            ${isSel?`<div style="position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;background:${c};display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#000">✓</div>`:''}
          </div>
          <div class="v14-id-body">
            <h3 class="v14-id-name" style="color:#fff">${w.archetype.replace('THE ','')}</h3>
            <div class="v14-id-zone">${w.zone}</div>
            <p class="v14-id-tagline">${w.tagline.split('·')[0].trim()}</p>
            <span class="v14-id-power" style="color:${c}">⚡ ${w.power.split('·')[0].trim()}</span>
          </div>
        </div>`;
    }).join('');
    return `
      <div class="v14-identity has-vid">
        ${vbg('identity','assets/bg/cosmic_frontier.jpeg')}
        <div class="v14-identity-head">
          <div class="v14-identity-eyebrow">STEP 1 OF 2 · CHOOSE YOUR HERO</div>
          <h1 class="v14-identity-h1">WHO ARE YOU IN THE COINVERSE?</h1>
          <p class="v14-identity-sub">Each archetype has its own world, hero, and superpower. Pick the one that fits YOU.</p>
        </div>
        <div class="v14-identity-grid">${cards}</div>
        <button id="confirmArchBtn" class="v14-identity-confirm ${state.selectedArchetype ? 'show' : ''}" onclick="confirmArchetype()">
          CONFIRM IDENTITY →
        </button>
      </div>`;
  };

  window.pickArchetype = function(id) { state.selectedArchetype = id; goTo('identity'); };
  window.confirmArchetype = function() {
    if (!state.selectedArchetype) return;
    state.archetype = state.selectedArchetype;
    goTo('welcome');
  };

  // ───────── SCREEN: WELCOME ─────────
  SCREENS.welcome = function() {
    const w = WORLDS[state.archetype] || WORLDS.guardian;
    return `
      <div class="v14-welcome has-vid" style="--player-c: var(--c-${w.color})">
        <video class="scr-vid wvid" id="welcomeVid" autoplay loop playsinline preload="auto" poster="assets/map/${w.id}.jpeg"><source src="assets/video/${w.id}.mp4" type="video/mp4"></video><div class="scr-veil"></div>
        <div class="v14-welcome-info">
          <span class="v14-welcome-badge">✨ IDENTITY CONFIRMED</span>
          <h1 class="v14-welcome-h1">Welcome,<br>${w.archetype}.</h1>
          <p class="v14-welcome-desc">Your home world is <strong style="color:var(--c-${w.color})">${w.zone}</strong>. Your starting power: ${w.power}. Time to explore the Coinverse — seven worlds, your archetype's home highlighted.</p>
          <button class="v14-welcome-cta" onclick="goTo('home')">ENTER THE COINVERSE →</button>
        </div>
      </div>`;
  };

  // ───────── SCREEN: HOME (uses ref image 1 as bg + 7 hotspots) ─────────
  SCREENS.home = function() {
    const playerArch = state.archetype || 'guardian';
    const playerW = WORLDS[playerArch];
    const playerChar = playerW.hero || playerW.character;
    const playerColor = playerW.color;

    const hubs = [
      {cls:'h-budgetron',  id:'strategist', label:'BUDGETRON'},
      {cls:'h-launch_lab', id:'builder',    label:'LAUNCH LAB'},
      {cls:'h-bitstream',  id:'risktaker',  label:'BITSTREAM VALLEY'},
      {cls:'h-savescape',  id:'guardian',   label:'SAVESCAPE ORBIT ● LIVE'},
      {cls:'h-investopia', id:'investor',   label:'INVESTOPIA'},
      {cls:'h-debt_detox', id:'rebuilder',  label:'DEBT DETOX'},
      {cls:'h-credtech',   id:'credtech',   label:'CREDTECH GALAXY'},
    ];

    const hotspots = hubs.map(h => `
      <div class="home-hotspot ${h.cls} ${h.id === playerArch ? 'is-default' : ''}"
           onclick="walkToHub('${h.id}')">
        <div class="home-hotspot-label">${h.label}</div>
      </div>`).join('');

    return `
      <div class="home-screen">
        <!-- Background = home video (animated) -->
        <div class="home-bg-image">
          <video class="home-bg-video" autoplay loop muted playsinline preload="auto" poster="assets/bg/home_galaxy_map.png">
            <source src="assets/video/home.mp4" type="video/mp4">
          </video>
        </div>

        <!-- TOP HUD -->
        <header class="home-topbar">
          <div class="home-brand">
            <div class="home-brand-icon" style="background:url('assets/ui/app_icon.png') center/contain no-repeat;color:transparent;text-shadow:none">C</div>
            <div class="home-brand-text">COINAVERSE</div>
          </div>
          <div class="home-hud">
            <div class="home-pill coins"><img src="assets/ui/coin_3d.png"><span class="n">${state.coins}</span><span class="l">COINS</span></div>
            <div class="home-pill lvl"><span class="n">LVL ${state.level}</span><span class="l">RANK</span></div>
            <div class="home-pill streak"><span class="n">DAY ${state.streak}</span><span class="l">STREAK</span></div>
            <div class="home-pill cred"><img src="assets/ui/gem_cred.png" style="width:17px;height:17px;object-fit:contain;margin-right:5px;vertical-align:middle"><span class="n">${state.cred}</span><span class="l">CRED · ${state.credPct}%</span></div>
          </div>
          <div class="home-actions">
            <div class="home-icon-btn" onclick="openProfile()">👤</div>
            <div class="home-icon-btn" onclick="openInbox()">✉️</div>
            <div class="home-icon-btn" onclick="openSettings()">⚙️</div>
          </div>
        </header>

        <!-- 7 clickable hub hotspots -->
        <div class="home-hotspots">${hotspots}</div>

        <!-- Path road below + character walking -->
        <div class="home-character-stage">
          <div class="home-path-road"></div>
          <div class="home-character" id="home-character" style="background-image:url('${playerChar}'); --player-c: var(--c-${playerColor})"></div>
        </div>

        <!-- LEFT SIDEBAR -->
        <aside class="home-sidebar">
          <button class="home-sb-btn" onclick="goTo('party')"><span class="ic">👥</span>PARTY &amp; FRIENDS</button>
          <button class="home-sb-btn" onclick="goTo('reward_center')"><span class="ic">📋</span>DAILY MISSIONS</button>
          <button class="home-sb-btn" onclick="goTo('leaderboards')"><span class="ic">🏆</span>LEADERBOARDS</button>
          <button class="home-sb-btn" onclick="goTo('cinema')"><span class="ic">🎬</span>EVENT ARENA</button>
          <button class="home-sb-btn" onclick="goTo('shop')"><span class="ic">🛒</span>MARKETPLACE</button>
          <button class="home-sb-btn" onclick="goTo('reward_center')"><span class="ic">🎁</span>REWARD CENTER</button>
          <button class="home-sb-btn" onclick="goTo('party')"><span class="ic">🎮</span>MULTIPLAYER<br>LOBBY</button>
        </aside>

        <!-- YOUR HUB -->
        <div class="home-hubcard">
          <div class="home-hubcard-head">
            <div class="home-hubcard-title">YOUR HUB</div>
            <div class="home-hubcard-close">✕</div>
          </div>
          <div class="home-hubcard-welcome">Welcome back, ${state.playerName}!</div>
          <div class="home-hubcard-desc">Click any island to walk there and enter the hub.</div>
          <div class="home-hubcard-xp"><span>Next Level</span><span class="xp">${state.xp} / ${state.xpMax} XP</span></div>
          <div class="home-hubcard-bar"><div class="home-hubcard-bar-fill" style="width:${(state.xp/state.xpMax)*100}%"></div></div>
        </div>

        <!-- DAILY MISSION -->
        <div class="home-misscard">
          <div>
            <div class="home-misscard-title">DAILY MISSION</div>
            <div class="home-misscard-name">Complete 3 Missions</div>
            <div class="home-misscard-meta">Earn 50 Coins &amp; 20 XP</div>
            <div class="home-misscard-progress">
              <div class="home-misscard-bar"><div class="home-misscard-bar-fill" style="width:${(state.completedMissions/3)*100}%"></div></div>
              <span class="home-misscard-count">${state.completedMissions} / 3</span>
            </div>
          </div>
          <div class="home-misscard-chest" style="background-image:url('assets/ui/star_3d.png')"></div>
        </div>

        <!-- BOTTOM CTA -->
        <div class="home-bottom-cta">
          <button class="home-play-btn" onclick="walkToHub('${playerArch}')">
            <span class="arrow">»»</span>PLAY NOW<span class="arrow">««</span>
          </button>
          <div class="home-action-row">
            <button class="home-action-btn" onclick="goTo('avatar')"><span class="player-mini" style="background-image:url('${playerW.portrait||playerChar}')"></span>CUSTOMIZE</button>
            <button class="home-action-btn" onclick="openInventory()"><span class="ic">🎒</span>INVENTORY</button>
            <button class="home-action-btn" onclick="openSkills()"><span class="ic">⚡</span>SKILLS</button>
          </div>
        </div>
      </div>`;
  };

  // Walking character animation — move toward hub's hotspot, then enter
  window.walkToHub = function(hubId) {
    const char = document.getElementById('home-character');
    if (!char) { state.viewingWorld = hubId; goTo('hub'); return; }
    const hotspot = document.querySelector('.home-hotspot.h-' + (hubId === 'rebuilder' ? 'debt_detox' :
                                                                   hubId === 'guardian' ? 'savescape' :
                                                                   hubId === 'risktaker' ? 'bitstream' :
                                                                   hubId === 'investor' ? 'investopia' :
                                                                   hubId === 'strategist' ? 'budgetron' :
                                                                   hubId === 'builder' ? 'launch_lab' :
                                                                   'credtech'));
    if (!hotspot) { state.viewingWorld = hubId; goTo('hub'); return; }
    const rect = hotspot.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    char.classList.add('walking');
    char.style.left = targetX + 'px';
    char.style.bottom = (window.innerHeight - targetY - 60) + 'px';
    char.style.transform = 'translateX(-50%) scale(0.55)';
    setTimeout(() => {
      state.viewingWorld = hubId;
      goTo('hub');
    }, 1300);
  };

  // ───────── SCREEN: PARTY & FRIENDS ─────────
  SCREENS.party = function() {
    const slots = [0,1,2,3].map(i => {
      const f = state.party[i];
      if (f) return `
        <div class="party-slot filled" onclick="openPartyInvite()">
          <div class="party-slot-avatar" style="background-image:url('${f.char}')"></div>
          <div class="party-slot-name">${f.name}</div>
          <div class="party-slot-arch">${f.arch}</div>
          <div class="party-slot-lvl">LVL ${f.lvl}</div>
        </div>`;
      return `
        <div class="party-slot" onclick="openPartyInvite()">
          <div class="party-slot-empty-ic">+</div>
          <div class="party-slot-empty-text">EMPTY SLOT</div>
        </div>`;
    }).join('');

    const friendsList = FRIENDS.map(f => `
      <div class="friend-card">
        <div class="friend-avatar ${f.online ? 'online' : 'offline'}" style="background-image:url('${f.char}')"></div>
        <div class="friend-info">
          <div class="friend-name">${f.name}</div>
          <div class="arch">${f.arch} · LVL ${f.lvl}</div>
          <div class="friend-status">${f.status}</div>
        </div>
        <div class="friend-actions">
          ${f.online ? `<button class="friend-action-btn" onclick="openPartyInvite()" title="Invite">⚔️</button>` : ''}
          <button class="friend-action-btn" onclick="openPartyInvite()" title="Message">💬</button>
        </div>
      </div>`).join('');

    return `
      <div class="v14-screen v14-page">
        <div class="v14-topbar">
          <div class="v14-topbar-left">
            <button class="v14-back" onclick="goTo('home')">← HOME</button>
            <div class="v14-title">PARTY &amp; FRIENDS</div>
          </div>
          <div class="v14-topbar-right">
            <div class="v14-coin-pill"><img src="assets/ui/coin_3d.png"><span class="n">${state.coins}</span></div>
          </div>
        </div>
        <div class="v14-page-wrap">
          <div class="party-hero">
            <div class="party-banner">
              <h1>YOUR PARTY</h1>
              <p>Team up with friends to take on missions together. Earn bonus XP, share loot, and climb the leaderboards as a squad.</p>
              <div class="party-banner-actions">
                <button class="party-btn primary" onclick="openPartyInvite()">+ INVITE FRIENDS</button>
                <button class="party-btn ghost" onclick="openPartyInvite()">⚔️ CREATE PARTY</button>
              </div>
            </div>
            <div class="party-stats">
              <div class="party-stat-card"><div class="lbl">FRIENDS</div><div class="v">${FRIENDS.length}</div></div>
              <div class="party-stat-card gold"><div class="lbl">PARTIES WON</div><div class="v">23</div></div>
              <div class="party-stat-card pink"><div class="lbl">ONLINE NOW</div><div class="v">${FRIENDS.filter(f=>f.online).length}</div></div>
              <div class="party-stat-card green"><div class="lbl">RANK</div><div class="v">#${LEADERBOARDS.weekly.find(r=>r.isYou)?.rank || '—'}</div></div>
            </div>
          </div>

          <h2 class="party-section-title">⚔️ ACTIVE PARTY · ${state.party.length}/4</h2>
          <div class="party-slots">${slots}</div>

          <h2 class="party-section-title">👥 FRIENDS · ${FRIENDS.length}</h2>
          <div class="friends-list">${friendsList}</div>
        </div>
      </div>`;
  };

  // ───────── SCREEN: LEADERBOARDS ─────────
  let _lbTab = 'weekly';
  SCREENS.leaderboards = function() {
    const data = LEADERBOARDS[_lbTab] || LEADERBOARDS.weekly;
    const top3 = data.slice(0,3);
    const rest = data.slice(3);

    const podium = top3.map(p => `
      <div class="lb-podium-card rank-${p.rank}">
        <div class="lb-podium-medal">${p.rank}</div>
        <div class="lb-podium-avatar" style="background-image:url('${p.char}')"></div>
        <div class="lb-podium-name">${p.name}</div>
        <div class="lb-podium-arch">${p.arch}</div>
        <div class="lb-podium-score">${p.score.toLocaleString()}</div>
        <div class="lb-podium-score-lbl">XP EARNED</div>
      </div>`).join('');

    const rows = rest.map(r => `
      <div class="lb-row ${r.isYou ? 'is-you' : ''}">
        <div class="lb-rank">${r.rank}</div>
        <div class="lb-avatar" style="background-image:url('${r.char}')"></div>
        <div class="lb-name-block"><div class="name">${r.name}</div><div class="arch">${r.arch}</div></div>
        <div style="text-align:right">
          <div class="lb-score">${r.score.toLocaleString()}</div>
          <div class="lb-score-lbl">XP</div>
        </div>
        <div class="lb-change ${r.change}">${r.change === 'up' ? '▲' : r.change === 'dn' ? '▼' : '—'}</div>
      </div>`).join('');

    return `
      <div class="v14-screen v14-page">
        <div class="v14-topbar">
          <div class="v14-topbar-left">
            <button class="v14-back" onclick="goTo('home')">← HOME</button>
            <div class="v14-title">LEADERBOARDS</div>
          </div>
          <div class="v14-topbar-right">
            <div class="v14-coin-pill"><img src="assets/ui/coin_3d.png"><span class="n">${state.coins}</span></div>
          </div>
        </div>
        <div class="v14-page-wrap">
          <div class="party-banner" style="margin-bottom:24px">
            <h1>🏆 GLOBAL RANKINGS</h1>
            <p>Compete with players across the Coinverse. Top players earn exclusive rewards each week, month, and season.</p>
          </div>

          <div class="lb-tabs">
            <button class="lb-tab ${_lbTab==='weekly'?'active':''}" onclick="lbTab('weekly')">WEEKLY</button>
            <button class="lb-tab ${_lbTab==='monthly'?'active':''}" onclick="lbTab('monthly')">MONTHLY</button>
            <button class="lb-tab ${_lbTab==='alltime'?'active':''}" onclick="lbTab('alltime')">ALL TIME</button>
            <button class="lb-tab" onclick="cvLbTab('archetype')">BY ARCHETYPE</button>
            <button class="lb-tab" onclick="cvLbTab('friends')">FRIENDS ONLY</button>
          </div>

          <div class="lb-podium">${podium}</div>
          <div class="lb-list">${rows}</div>
        </div>
      </div>`;
  };
  window.lbTab = (t) => { _lbTab = t; goTo('leaderboards'); };

  // ───────── SCREEN: REWARD CENTER ─────────
  SCREENS.reward_center = function() {
    const days = [
      {n:1, r:'💰', amount:'+10', },
      {n:2, r:'💰', amount:'+20', },
      {n:3, r:'⚡', amount:'+50 XP'},
      {n:4, r:'💰', amount:'+40', },
      {n:5, r:'💎', amount:'GEM'},
      {n:6, r:'🎁', amount:'CHEST'},
      {n:7, r:'⭐', amount:'LEGENDARY'},
    ];
    const todayIdx = state.dailyClaimed.findIndex(c => !c);
    const daysHtml = days.map((d, i) => {
      const claimed = state.dailyClaimed[i];
      const isToday = i === todayIdx;
      return `
        <div class="reward-day ${claimed ? 'claimed' : ''} ${isToday ? 'today' : ''}">
          <div class="d">DAY ${d.n}</div>
          <div class="r">${d.r}</div>
          <div class="d">${d.amount}</div>
        </div>`;
    }).join('');

    const claimedCount = state.dailyClaimed.filter(Boolean).length;
    const streakPct = (claimedCount / 7) * 100;

    const challenges = [
      {ic:'🎯', name:'Quest Hunter',     desc:'Complete 5 daily missions across any zone.',          done:2, total:5, reward:'💰 200 + XP 100'},
      {ic:'🌍', name:'World Explorer',   desc:'Visit all 7 hubs on the Coinverse map.',              done:3, total:7, reward:'💎 RARE CRYSTAL'},
      {ic:'🎮', name:'Game Master',      desc:'Win 10 rounds of Coin Catcher.',                       done:4, total:10, reward:'🎁 LOOT CHEST'},
      {ic:'🛒', name:'Big Spender',      desc:'Purchase 3 items from the Marketplace.',               done:1, total:3, reward:'⚡ ×2 XP / 24h'},
      {ic:'⚔️', name:'Team Player',     desc:'Join 5 party missions with friends.',                  done:0, total:5, reward:'🌟 EXCLUSIVE BADGE'},
      {ic:'📈', name:'Score Climber',    desc:'Reach top 50 on weekly leaderboards.',                 done:0, total:1, reward:'💎 LEGENDARY GEM'},
    ];
    const challCards = challenges.map(c => `
      <div class="reward-card">
        <div class="reward-card-icon">${c.ic}</div>
        <h3>${c.name}</h3>
        <p>${c.desc}</p>
        <div class="reward-card-bar"><div class="reward-card-bar-fill" style="width:${(c.done/c.total)*100}%"></div></div>
        <div class="reward-card-footer">
          <span class="reward-card-progress">${c.done} / ${c.total}</span>
          <span class="reward-card-reward">${c.reward}</span>
        </div>
      </div>`).join('');

    return `
      <div class="v14-screen v14-page">
        <div class="v14-topbar">
          <div class="v14-topbar-left">
            <button class="v14-back" onclick="goTo('home')">← HOME</button>
            <div class="v14-title">REWARD CENTER</div>
          </div>
          <div class="v14-topbar-right">
            <div class="v14-coin-pill"><img src="assets/ui/coin_3d.png"><span class="n">${state.coins}</span></div>
          </div>
        </div>
        <div class="v14-page-wrap">
          <div class="reward-streak">
            <div class="reward-streak-info">
              <h2>🎯 WEEKLY PROGRESS · ${claimedCount} / 7 CLAIMED</h2>
              <p>Earn a reward for every day you play — at your own pace. Miss a day? Your progress stays safe, nothing resets. Complete all 7 for a LEGENDARY reward.</p>
              <div class="reward-streak-bar"><div class="reward-streak-bar-fill" style="width:${streakPct}%"></div></div>
              <div class="reward-streak-days">${daysHtml}</div>
            </div>
            <img class="reward-crate" src="assets/ui/crate_${state.archetype||'guardian'}.png" onerror="this.style.display='none'" alt="">
            ${todayIdx >= 0 ? `<button class="reward-claim-btn" onclick="claimDaily()">
              <div class="v">${days[todayIdx].amount}</div>
              <div class="l">CLAIM DAY ${todayIdx+1}</div>
            </button>` : `<div style="text-align:center;color:var(--gold);font-family:'Orbitron';font-size:0.8rem;letter-spacing:0.18em">✓ ALL CLAIMED<br><span style="color:var(--text-mute);font-size:0.7rem">Resets in 18h 23m</span></div>`}
          </div>

          <h2 class="party-section-title">🎯 WEEKLY CHALLENGES · ${challenges.filter(c=>c.done>=c.total).length}/${challenges.length} COMPLETE</h2>
          <div class="reward-grid">${challCards}</div>
        </div>
      </div>`;
  };

  window.claimDaily = function() {
    const idx = state.dailyClaimed.findIndex(c => !c);
    if (idx < 0) return;
    state.dailyClaimed[idx] = true;
    const rewards = [10, 20, 50, 40, 100, 200, 500];
    state.coins += rewards[idx];
    if(window.cvAddXP){ cvAddXP(20,0); } if(window.cvSave) cvSave();
    if(window.cvToast) cvToast(`✨ Day ${idx+1} claimed · +${rewards[idx]}💰`); else alert('Day '+(idx+1)+' claimed');
    goTo('reward_center');
  };

  // ───────── SCREEN: CREDTECH GALAXY HUB (7th) ─────────
  SCREENS.credtech_hub = function() {
    const w = WORLDS.credtech;
    const playerArch = state.archetype || 'guardian';
    const playerW = WORLDS[playerArch];

    return `
      <div class="v14-screen v14-page">
        <div class="v14-topbar">
          <div class="v14-topbar-left">
            <button class="v14-back" onclick="goTo('home')">← HOME</button>
            <div class="v14-title">CREDTECH GALAXY</div>
          </div>
          <div class="v14-topbar-right">
            <div class="v14-coin-pill"><img src="assets/ui/coin_3d.png"><span class="n">${state.coins}</span></div>
          </div>
        </div>
        <div class="v14-page-wrap">
          <div class="reward-streak" style="background:linear-gradient(135deg, rgba(251,191,36,0.3), rgba(0,229,255,0.2));border-color:var(--gold)">
            <div class="reward-streak-info">
              <h2>⭐ CREDTECH GALAXY · UNIVERSAL ZONE</h2>
              <p>Credit affects <strong style="color:var(--gold)">every</strong> archetype. Your <strong style="color:var(--gold)">Cred Score</strong> is a universal system that follows you across all 6 worlds — unlocking opportunities, missions and borrowing power. It's not an identity you pick; it's a power everyone builds.</p>
              <div style="display:flex;align-items:center;gap:16px;margin-top:12px">
                <div style="flex:1">
                  <div style="font-family:'Orbitron';font-size:0.7rem;letter-spacing:0.18em;color:var(--text-mute);margin-bottom:4px">YOUR CRED SCORE</div>
                  <div style="font-family:'Anton';font-size:2.4rem;color:var(--gold);text-shadow:0 0 20px var(--gold)">${state.cred}</div>
                  <div class="reward-streak-bar"><div class="reward-streak-bar-fill" style="width:${state.credPct}%"></div></div>
                  <div style="display:flex;justify-content:space-between;margin-top:4px;font-family:'Orbitron';font-size:0.62rem;letter-spacing:0.14em;color:var(--text-mute)"><span>${state.credPct}% TO NEXT TIER</span><span>NEXT: 500</span></div>
                </div>
              </div>
            </div>
          </div>

          <h2 class="party-section-title">⭐ CRED MISSIONS</h2>
          <div class="reward-grid">
            ${w.missions.map(m => `
              <div class="reward-card">
                <div class="reward-card-icon">⚡</div>
                <h3>${m.name}</h3>
                <p>Progress your Cred Score and unlock new tier rewards across all 7 hubs.</p>
                <div class="reward-card-bar"><div class="reward-card-bar-fill" style="width:${(m.done/m.total)*100}%"></div></div>
                <div class="reward-card-footer">
                  <span class="reward-card-progress">${m.done} / ${m.total}</span>
                  <span class="reward-card-reward">${m.reward}</span>
                </div>
              </div>`).join('')}
          </div>

          <h2 class="party-section-title">🌌 EXPLORE OTHER HUBS</h2>
          <div class="reward-grid">
            ${['strategist','builder','investor','guardian','risktaker','rebuilder'].map(id => {
              const ww = WORLDS[id];
              return `
                <div class="reward-card" style="cursor:pointer;border-color:var(--c-${ww.color})" onclick="state.viewingWorld='${id}';goTo('hub')">
                  <div class="reward-card-icon">${ww.icon}</div>
                  <h3 style="color:var(--c-${ww.color})">${ww.name}</h3>
                  <p>${ww.tagline.split('·')[0].trim()}</p>
                  <div class="reward-card-footer">
                    <span class="reward-card-progress">${ww.archetype}</span>
                    <span class="reward-card-reward">ENTER →</span>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  };

  // ───────── SCREEN: CINEMA ─────────
  SCREENS.cinema = function() {
    const featured = EPISODES[2];
    const newRow = EPISODES.slice(0, 4);
    const charSpotRow = EPISODES.slice(5, 9);
    const eventRow = [EPISODES[9], EPISODES[11], EPISODES[10], EPISODES[1]];
    const allRow = EPISODES;
    const epCard = (e) => `
      <div class="cinema-card" onclick="playEp('${e.id}')" style="background-image:url('${e.cover}')">
        <div class="cinema-card-play">▶</div>
        <div class="cinema-card-overlay">
          <div class="cinema-card-ep">${e.subtitle}</div>
          <div class="cinema-card-title">${e.title}</div>
        </div>
      </div>`;
    return `
      <div class="v14-screen cinema-screen">
        <div class="cinema-bg"></div>
        <div class="v14-topbar">
          <div class="v14-topbar-left">
            <button class="v14-back" onclick="goTo('home')">← HOME</button>
            <div class="v14-title">COINAVERSE CINEMA</div>
          </div>
          <div class="v14-topbar-right">
            <div class="v14-coin-pill"><img src="assets/ui/coin_3d.png"><span class="n">${state.coins}</span></div>
          </div>
        </div>
        <div class="cinema-wrap">
          <section class="cinema-hero" style="background-image:url('${featured.cover}')">
            <div class="cinema-hero-content">
              <span class="cinema-hero-badge">🔥 TRENDING NOW</span>
              <h1 class="cinema-hero-title">${featured.title}</h1>
              <div class="cinema-hero-meta"><span>2026</span><span class="pip"></span><span>${featured.duration}</span><span class="pip"></span><span>${featured.subtitle}</span></div>
              <p class="cinema-hero-desc">${featured.desc}</p>
              <div class="cinema-hero-actions">
                <button class="cinema-hero-play" onclick="playEp('${featured.id}')">▶ PLAY EPISODE</button>
                <button class="cinema-hero-info" onclick="epInfo('${featured.id}')">+ MORE INFO</button>
              </div>
            </div>
          </section>
          <section class="cinema-row"><div class="cinema-row-head"><h2 class="cinema-row-title">New This Week</h2><span class="cinema-row-more">SEE ALL →</span></div><div class="cinema-track">${newRow.map(epCard).join('')}</div></section>
          <section class="cinema-row"><div class="cinema-row-head"><h2 class="cinema-row-title">Hero Spotlights</h2><span class="cinema-row-more">SEE ALL →</span></div><div class="cinema-track">${charSpotRow.map(epCard).join('')}</div></section>
          <section class="cinema-row"><div class="cinema-row-head"><h2 class="cinema-row-title">Big Events &amp; Finale</h2><span class="cinema-row-more">SEE ALL →</span></div><div class="cinema-track">${eventRow.map(epCard).join('')}</div></section>
          <section class="cinema-row"><div class="cinema-row-head"><h2 class="cinema-row-title">All Episodes — Season 01</h2><span class="cinema-row-more">SEASON 02 SOON</span></div><div class="cinema-track">${allRow.map(epCard).join('')}</div></section>
        </div>
      </div>`;
  };
  window.playEp = (id) => { const e = EPISODES.find(x=>x.id===id); alert(`▶ ${e.title}\n${e.duration} · ${e.subtitle}\n\n(Video player not in HTML demo)`); };
  window.epInfo = (id) => { const e = EPISODES.find(x=>x.id===id); alert(`📖 ${e.title}\n${e.subtitle}\n${e.duration}\n\n${e.desc}`); };

  // ───────── SCREEN: SHOP ─────────
  let _activeCat = 'All';
  SCREENS.shop = function() {
    const cats = ['All', ...new Set(SHOP_ITEMS.map(i => i.cat))];
    const list = _activeCat === 'All' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.cat === _activeCat);
    const card = (it) => `
      <div class="shop-card" onclick="buyItem('${it.id}')">
        <div class="shop-card-img" style="background-image:url('${it.img}')">
          ${it.tag ? `<span class="shop-card-tag ${it.tagClass}">${it.tag}</span>` : ''}
          <button class="shop-card-fav" onclick="event.stopPropagation();favItem(this)">♡</button>
        </div>
        <div class="shop-card-body">
          <div class="shop-card-cat">${it.cat}</div>
          <h3 class="shop-card-name">${it.name}</h3>
          <p class="shop-card-desc">${it.desc}</p>
          <div class="shop-card-footer">
            <div class="shop-card-price"><img src="assets/ui/coin_3d.png"><span class="n">${it.price}</span></div>
            <button class="shop-card-buy" onclick="event.stopPropagation();buyItem('${it.id}')">BUY</button>
          </div>
        </div>
      </div>`;
    return `
      <div class="v14-screen shop-screen">
        <div class="shop-bg"></div>
        <div class="v14-topbar">
          <div class="v14-topbar-left">
            <button class="v14-back" onclick="goTo('home')">← HOME</button>
            <div class="v14-title">MARKETPLACE</div>
          </div>
          <div class="v14-topbar-right">
            <div class="v14-coin-pill"><img src="assets/ui/coin_3d.png"><span class="n">${state.coins}</span></div>
          </div>
        </div>
        <div class="shop-wrap">
          <div class="shop-header">
            <div class="shop-header-eyebrow">COINAVERSE MERCH STORE</div>
            <h1>SQUAD GEAR &amp; POWER-UPS</h1>
            <p>Unlock boosts, equip cosmetics, and collect signature gear from the Coinaverse heroes.</p>
          </div>
          <div class="shop-tabs">
            ${cats.map(c => `<button class="shop-tab ${c === _activeCat ? 'active' : ''}" onclick="shopCat('${c}')">${c.toUpperCase()}</button>`).join('')}
          </div>
          <div class="shop-grid">${list.map(card).join('')}</div>
        </div>
      </div>`;
  };
  window.shopCat = (c) => { _activeCat = c; goTo('shop'); };
  window.buyItem = (id) => {
    const it = SHOP_ITEMS.find(x => x.id === id);
    if (state.coins < it.price) { alert(`❌ Not enough coins.\nHave ${state.coins} · need ${it.price}.`); return; }
    if (confirm(`Buy "${it.name}" for ${it.price} 💰?`)) {
      state.coins -= it.price; state.inventory.push(it.id);
      alert(`✅ Purchased ${it.name}!\nCoins left: ${state.coins}`); goTo('shop');
    }
  };
  window.favItem = (el) => {
    el.textContent = el.textContent === '♡' ? '♥' : '♡';
    el.style.color = el.textContent === '♥' ? 'var(--pink-hot)' : '';
  };

  // ───────── SCREEN: GAME (Coin Catcher) ─────────
  let _gameState = {running:false, score:0, timeLeft:30, coinsCollected:0, intervalSpawn:null, intervalTimer:null};
  SCREENS.game = function() {
    _gameState = {running:false, score:0, timeLeft:30, coinsCollected:0, intervalSpawn:null, intervalTimer:null};
    return `
      <div class="v14-screen game-screen">
        <div class="game-bg" style="background-image:url('assets/game/bg_coin_rain.jpeg')"></div>
        <div class="v14-topbar">
          <div class="v14-topbar-left">
            <button class="v14-back" onclick="gameExit()">← BACK</button>
            <div class="v14-title">COIN CATCHER</div>
          </div>
          <div class="v14-topbar-right">
            <div class="v14-coin-pill"><img src="assets/ui/coin_3d.png"><span class="n" id="game-coins-hud">${state.coins}</span></div>
          </div>
        </div>
        <div class="game-wrap" id="game-wrap">
          <div class="game-start" id="game-start-panel">
            <h2>COIN CATCHER</h2>
            <p>Tap falling gold coins to collect them. Avoid the red bombs.</p>
            <ul class="game-rules">
              <li>+10 coins · gold coin tap</li>
              <li>-5 coins · red bomb tap</li>
              <li>30 seconds · go fast</li>
              <li>Earn coins to spend in MARKETPLACE</li>
            </ul>
            <button class="game-start-btn" onclick="gameStart()">START GAME ▶</button>
          </div>
        </div>
      </div>`;
  };
  window.gameStart = () => {
    _gameState.running = true; _gameState.score = 0; _gameState.timeLeft = 30; _gameState.coinsCollected = 0;
    const wrap = document.getElementById('game-wrap');
    wrap.innerHTML = `
      <div class="game-hud">
        <div class="game-stat score"><span class="lbl">SCORE</span><span class="v" id="game-score">0</span></div>
        <div class="game-stat time"><span class="lbl">TIME</span><span class="v" id="game-time">30</span></div>
        <div class="game-stat"><span class="lbl">COINS</span><span class="v" id="game-collected">0</span></div>
      </div>
      <div class="game-arena" id="game-arena"></div>`;
    const arena = document.getElementById('game-arena');
    const spawnCoin = () => {
      if (!_gameState.running) return;
      const isBomb = Math.random() < 0.18;
      const coin = document.createElement('div');
      coin.className = 'coin-drop' + (isBomb ? ' bomb' : '');
      coin.style.backgroundImage = `url('assets/ui/coin_3d.png')`;
      coin.style.left = (10 + Math.random() * 80) + '%';
      coin.style.top = '-80px';
      const dur = 2.4 + Math.random() * 1.6;
      coin.style.transition = `top ${dur}s linear`;
      arena.appendChild(coin);
      requestAnimationFrame(() => { coin.style.top = '110%'; });
      coin.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = coin.getBoundingClientRect();
        const burst = document.createElement('div');
        burst.className = 'coin-collected';
        burst.textContent = isBomb ? '-5' : '+10';
        burst.style.color = isBomb ? 'var(--red-electric)' : 'var(--gold)';
        burst.style.left = (rect.left + rect.width / 2) + 'px';
        burst.style.top = rect.top + 'px';
        document.body.appendChild(burst);
        setTimeout(() => burst.remove(), 800);
        if (isBomb) _gameState.score = Math.max(0, _gameState.score - 5);
        else { _gameState.score += 10; _gameState.coinsCollected += 1; }
        document.getElementById('game-score').textContent = _gameState.score;
        document.getElementById('game-collected').textContent = _gameState.coinsCollected;
        coin.remove();
      });
      setTimeout(() => { if (coin.parentNode) coin.remove(); }, dur * 1000 + 100);
    };
    _gameState.intervalSpawn = setInterval(spawnCoin, 600);
    _gameState.intervalTimer = setInterval(() => {
      _gameState.timeLeft -= 1;
      document.getElementById('game-time').textContent = _gameState.timeLeft;
      if (_gameState.timeLeft <= 0) gameEnd();
    }, 1000);
  };
  window.gameEnd = () => {
    _gameState.running = false;
    clearInterval(_gameState.intervalSpawn); clearInterval(_gameState.intervalTimer);
    const earned = _gameState.score; state.coins += earned;
    const arena = document.getElementById('game-arena');
    if (arena) arena.innerHTML = '';
    const wrap = document.getElementById('game-wrap');
    const panel = document.createElement('div');
    panel.className = 'game-over';
    panel.innerHTML = `
      <h2>GAME OVER</h2>
      <div class="final-score">${earned}</div>
      <div class="reward-info">+${earned} 💰 added to your wallet · ${_gameState.coinsCollected} coins caught</div>
      <div class="game-over-actions">
        <button class="game-over-btn replay" onclick="gameStart();this.closest('.game-over').remove()">PLAY AGAIN</button>
        <button class="game-over-btn exit" onclick="gameExit()">EXIT</button>
      </div>`;
    wrap.appendChild(panel);
    document.getElementById('game-coins-hud').textContent = state.coins;
  };
  window.gameExit = () => {
    _gameState.running = false;
    clearInterval(_gameState.intervalSpawn); clearInterval(_gameState.intervalTimer);
    goTo('home');
  };

  // ───────── SCREEN: VAULT BUILDER · SaveScape flagship game ─────────
  // KaBria hero loop: set a goal → earn by smart choices → watch the vault
  // fill → unlock Vaultara Guardian. Delayed gratification = bigger unlock.
  let _vault = null;
  const VAULT_GOAL = 500, VAULT_STRETCH = 750;
  const VAULT_ROUNDS = [
    { q:"You earned 120 💎 from this week's quests. The Nebula Sneakers cost 100 💎 — but your boots still work fine. What now?",
      choices:[
        {t:"Save all 120 💎", save:120, fb:"Smart Guardian! A 'want' can wait. Vault +120 💎."},
        {t:"Buy the sneakers, save 20 💎", save:20, fb:"They look cool… but you didn't need them. Only 20 💎 banked."},
        {t:"Save 100, small treat 20 💎", save:100, fb:"Balanced — saved most, tiny treat. Nice discipline."} ]},
    { q:"⚡ Your space-bike breaks! Repair = 60 💎. THIS is what an emergency fund is for.",
      choices:[
        {t:"Pay 60 💎 from your vault", save:-60, fb:"This is WHY you save. Crisis handled — Resilience +1. 🛡️"},
        {t:"Skip it — you can't travel", save:0, fb:"You miss next week's quest. Saving ahead protects you."} ]},
    { q:"🏦 Vault Bank offer: LOCK 100 💎 for 2 rounds → get 130 💎 back (+30). That's COMPOUNDING.",
      choices:[
        {t:"Lock 100 💎 — patience pays", lock:100, fb:"Locked! In 2 rounds it grows to 130 💎. Patience = profit."},
        {t:"Keep it liquid", save:0, fb:"Safe — but you skipped free growth."} ]},
    { q:"🚨 'FLASH SALE! Legendary skin 80 💎 — 2 MINUTES ONLY!' A countdown is ticking…",
      choices:[
        {t:"Resist — that urgency is fake", save:10, fb:"You spotted FAKE URGENCY. Real deals never rush you. Wisdom +10 💎."},
        {t:"Buy now before it's gone! (−80)", save:-80, fb:"The 'timer' was a trick to rush you. Lesson learned."} ]},
    { q:"🎂 Grandma sends you 150 💎 for your birthday!",
      choices:[
        {t:"Vault all 150 💎", save:150, fb:"Future-you says thank you. Vault +150 💎."},
        {t:"Save 100, spend 50 💎", save:100, fb:"Reasonable — saved the bulk."} ]},
    { q:"Almost there! A teamwork quest pays 90 💎. Bank it?",
      choices:[
        {t:"Bank all 90 💎", save:90, fb:"So close to Vaultara Guardian now!"},
        {t:"Save 60, treat 30 💎", save:60, fb:"Still climbing — 60 💎 banked."} ]} ];

  function vaultInit(){ _vault = { goal:VAULT_GOAL, saved:0, round:0, locks:[], fb:"Welcome, Guardian. Build your vault to 500 💎 and unlock Vaultara Guardian.", phase:'play', extra:0 }; }
  function vaultMatureLocks(){
    _vault.locks = _vault.locks.filter(function(l){
      l.due -= 1;
      if (l.due <= 0){ _vault.saved += l.payout; _vault.fb = "🔓 Your locked savings matured: +" + l.payout + " 💎 (compounding paid off!)"; return false; }
      return true;
    });
  }

  SCREENS.vault_game = function(){
    if (!_vault) vaultInit();
    const v = _vault;
    const pct = Math.min(100, Math.round(v.saved / v.goal * 100));
    const stretchPct = Math.min(100, Math.round(v.saved / VAULT_STRETCH * 100));
    const lockNote = v.locks.length ? `<div class="vlt-lock">🔒 Locked: ${v.locks.reduce((s,l)=>s+l.amount,0)} 💎 maturing soon (+bonus)</div>` : '';

    // CLAIMED celebration
    if (v.phase === 'claimed'){
      const gold = v.tier === 'gold';
      return `<div class="vlt-wrap"><style>${VAULT_CSS}</style>
        <div class="vlt-topbar"><button class="vlt-back" onclick="vaultExit()">← SAVESCAPE ORBIT</button><div class="vlt-title">VAULT BUILDER</div></div>
        <div class="vlt-claim">
          <div class="vlt-claim-glow ${gold?'gold':''}"></div>
          <img class="vlt-hero-img" src="assets/game/vaultara_guardian.png" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="vlt-claim-badge" style="display:none">${gold?'👑':'🛡️'}</span>
          <h1>${gold?'VAULTARA GUARDIAN · GOLD':'VAULTARA GUARDIAN'} UNLOCKED!</h1>
          <p>${gold?'You waited and saved to 750 💎 — patience earned the exclusive GOLD aura. That is the secret most players never learn.':'You saved 500 💎 through smart choices. Your discipline built this.'}</p>
          <div class="vlt-claim-reward">+${gold?250:150} 💰 &nbsp;·&nbsp; <img class="vlt-badge-img" src="assets/badges/smart_saver.png" onerror="this.style.display='none'"> Smart Saver &nbsp;·&nbsp; ✨ Vault Aura for your avatar</div>
          <button class="vlt-btn vlt-btn-go" onclick="vaultExit()">RETURN TO ORBIT</button>
          <button class="vlt-btn vlt-btn-alt" onclick="vaultRestart()">PLAY AGAIN</button>
        </div></div>`;
    }

    // GOAL REACHED — delayed-gratification choice
    if (v.phase === 'goal'){
      return `<div class="vlt-wrap"><style>${VAULT_CSS}</style>
        <div class="vlt-topbar"><button class="vlt-back" onclick="vaultExit()">← SAVESCAPE ORBIT</button><div class="vlt-title">VAULT BUILDER</div></div>
        <div class="vlt-goal">
          <div class="vlt-goal-vault"><div class="vlt-goal-fill"></div><span>${v.saved} 💎</span></div>
          <h1>🎉 You hit 500 💎!</h1>
          <p class="vlt-secret">🔑 Secret weapon: <b>delayed gratification.</b> Claim now — or keep saving to <b>750 💎</b> for the exclusive <b>GOLD</b> Guardian. Patience = a bigger unlock.</p>
          <div class="vlt-goal-choices">
            <button class="vlt-btn vlt-btn-go" onclick="vaultClaim('standard')">Claim VAULTARA GUARDIAN now</button>
            <button class="vlt-btn vlt-btn-gold" onclick="vaultKeepSaving()">Keep saving → 750 for GOLD 👑</button>
          </div>
        </div></div>`;
    }

    // out of scripted rounds but goal not reached → repeatable saver quest
    const outOfRounds = v.round >= VAULT_ROUNDS.length;
    const r = outOfRounds ? null : VAULT_ROUNDS[v.round];
    const targetGoal = v.stretch ? VAULT_STRETCH : v.goal;
    const fillPct = Math.min(100, Math.round(v.saved / targetGoal * 100));

    const roundBody = outOfRounds
      ? `<div class="vlt-scenario"><div class="vlt-round">DAILY SAVER QUEST</div>
           <p class="vlt-q">Keep stacking 💎 toward your ${v.stretch?'GOLD (750)':'goal'} — every smart save counts.</p>
           <div class="vlt-choices">
             <button class="vlt-choice" onclick="vaultQuest()">Complete a saver quest · +80 💎</button>
           </div></div>`
      : `<div class="vlt-scenario"><div class="vlt-round">ROUND ${v.round+1} / ${VAULT_ROUNDS.length}</div>
           <p class="vlt-q">${r.q}</p>
           <div class="vlt-choices">
             ${r.choices.map((c,i)=>`<button class="vlt-choice" onclick="vaultPick(${i})">${c.t}</button>`).join('')}
           </div></div>`;

    return `<div class="vlt-wrap"><style>${VAULT_CSS}</style>
      <div class="vlt-bg" style="background-image:url('assets/game/savescape_vault_bg.jpeg')"></div>
      <div class="vlt-topbar">
        <button class="vlt-back" onclick="vaultExit()">← SAVESCAPE ORBIT</button>
        <div class="vlt-title">🛡️ VAULT BUILDER</div>
        <div class="vlt-goalpill">GOAL ${v.stretch?VAULT_STRETCH:v.goal} 💎</div>
      </div>
      <div class="vlt-stage">
        <div class="vlt-vaultcol">
          <div class="vlt-vault">
            <div class="vlt-vault-fill" style="height:${fillPct}%"></div>
            <div class="vlt-vault-glass"></div>
            <div class="vlt-vault-num vlt-num-pop">${v.saved}<small>/ ${targetGoal} 💎</small></div>
          </div>
          <div class="vlt-pct">${fillPct}% FULL</div>
          ${lockNote}
        </div>
        <div class="vlt-playcol">
          <img class="vlt-circuit" id="vltCircuit" src="assets/characters/circuit.png" onerror="this.style.display='none'">
          ${roundBody}
          <div class="vlt-fb">${v.fb}</div>
          <div class="vlt-hud">
            <span>🛡️ SaveScape Orbit</span><span>Vault: <b>${v.saved} 💎</b></span><span>Locked: <b>${v.locks.reduce((s,l)=>s+l.amount,0)} 💎</b></span>
          </div>
        </div>
      </div></div>`;
  };

  window.vaultPick = function(i){
    const v=_vault, r=VAULT_ROUNDS[v.round], c=r.choices[i];
    if (c.lock){ v.locks.push({amount:c.lock, payout:Math.round(c.lock*1.3), due:2}); }
    else { v.saved = Math.max(0, v.saved + (c.save||0)); }
    v.fb = c.fb;
    v.round += 1;
    vaultMatureLocks();
    vaultCheckGoal();
    goTo('vault_game');
    try{ if((c.save||0)>0) spawnCrystals(Math.round((c.save||0)/40)); }catch(_){}
  };
  window.vaultQuest = function(){ _vault.saved += 80; _vault.fb="Saver quest done — +80 💎 banked."; vaultMatureLocks(); vaultCheckGoal(); goTo('vault_game'); };
  function vaultCheckGoal(){
    const target = _vault.stretch ? VAULT_STRETCH : _vault.goal;
    if (_vault.saved >= target){ _vault.phase = _vault.stretch ? 'claimReadyGold' : 'goal'; if(_vault.stretch){ vaultClaim('gold'); } }
  }
  window.vaultKeepSaving = function(){ _vault.stretch=true; _vault.phase='play'; _vault.fb="Patience mode on. Reach 750 💎 for the GOLD Guardian."; goTo('vault_game'); };
  window.vaultClaim = function(tier){
    _vault.tier = tier; _vault.phase='claimed';
    try{ state.coins += (tier==='gold'?250:150); state.smartSaver=true; state.vaultAura=true; state.vault=_vault.saved;
      state.inventory = state.inventory||[]; state.inventory.push(tier==='gold'?'Vaultara Guardian · GOLD':'Vaultara Guardian');
      if(typeof window.refreshHUD==='function') window.refreshHUD();
    }catch(e){}
    goTo('vault_game');
  };
  window.vaultRestart = function(){ vaultInit(); goTo('vault_game'); };
  window.vaultExit = function(){ _vault=null; state.viewingWorld='guardian'; goTo('world_detail'); };

  const VAULT_CSS = `
    .vlt-wrap{position:absolute;inset:0;color:#eafaf7;font-family:'Hanken Grotesk',system-ui,sans-serif;display:flex;flex-direction:column;overflow:hidden;background:radial-gradient(120% 80% at 50% 120%,rgba(20,184,166,.18),transparent 55%),radial-gradient(140% 120% at 50% -10%,#0c3b4a 0%,#072433 42%,#04141d 70%,#020a11 100%)}
    .vlt-wrap::before{content:'';position:absolute;inset:-12%;z-index:0;pointer-events:none;background:radial-gradient(40% 38% at 22% 28%,rgba(20,184,166,.30),transparent 70%),radial-gradient(36% 34% at 80% 22%,rgba(56,189,248,.20),transparent 70%),radial-gradient(34% 32% at 70% 84%,rgba(246,181,35,.10),transparent 70%);filter:blur(26px);opacity:.85;animation:nebula 22s ease-in-out infinite alternate}
    @keyframes nebula{0%{transform:translate3d(0,0,0) scale(1)}100%{transform:translate3d(0,-3%,0) scale(1.08)}}
    .vlt-wrap::after{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;background-image:radial-gradient(1px 1px at 20% 30%,rgba(255,255,255,.8),transparent),radial-gradient(1px 1px at 70% 60%,rgba(255,255,255,.6),transparent),radial-gradient(1.5px 1.5px at 40% 80%,rgba(190,240,255,.7),transparent),radial-gradient(1px 1px at 85% 20%,rgba(255,255,255,.6),transparent),radial-gradient(1px 1px at 55% 15%,rgba(255,255,255,.5),transparent),radial-gradient(1.2px 1.2px at 12% 70%,rgba(255,255,255,.6),transparent),radial-gradient(1px 1px at 92% 75%,rgba(255,255,255,.5),transparent);animation:twinkle 6s ease-in-out infinite}
    @keyframes twinkle{0%,100%{opacity:.4}50%{opacity:.75}}
    .vlt-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.17;z-index:0;filter:saturate(1.15)}
    .vlt-wrap>*{position:relative;z-index:1}
    .vlt-topbar{display:flex;align-items:center;gap:14px;padding:16px 22px;border-bottom:1px solid rgba(94,234,212,.14);backdrop-filter:blur(6px)}
    .vlt-back{background:rgba(20,184,166,.12);border:1px solid rgba(94,234,212,.32);color:#9ff3e6;padding:9px 15px;border-radius:12px;font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.14em;cursor:pointer;transition:.18s}
    .vlt-back:hover{background:rgba(20,184,166,.24);box-shadow:0 0 18px rgba(20,184,166,.4);transform:translateX(-2px)}
    .vlt-title{font-family:'Orbitron',sans-serif;letter-spacing:.16em;font-size:.92rem;color:#fff;text-shadow:0 0 18px rgba(20,184,166,.4)}
    .vlt-goalpill{margin-left:auto;font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.12em;color:#5eead4;border:1px solid rgba(94,234,212,.4);padding:8px 15px;border-radius:30px;background:rgba(20,184,166,.12);box-shadow:0 0 20px rgba(20,184,166,.25),inset 0 1px 0 rgba(255,255,255,.08)}
    .vlt-stage{flex:1;display:flex;gap:40px;padding:34px 6%;align-items:center;justify-content:center;flex-wrap:wrap;max-width:1080px;margin:0 auto;width:100%;box-sizing:border-box}
    .vlt-vaultcol{display:flex;flex-direction:column;align-items:center;gap:12px}
    .vlt-vault{position:relative;width:190px;height:266px;border-radius:22px;border:2px solid rgba(94,234,212,.55);background:linear-gradient(180deg,rgba(6,26,36,.5),rgba(2,10,16,.85));overflow:hidden;box-shadow:0 0 55px rgba(20,184,166,.32),inset 0 0 36px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.08);animation:vaultPulse 4s ease-in-out infinite}
    @keyframes vaultPulse{0%,100%{box-shadow:0 0 45px rgba(20,184,166,.28),inset 0 0 36px rgba(0,0,0,.6)}50%{box-shadow:0 0 72px rgba(20,184,166,.5),inset 0 0 36px rgba(0,0,0,.6)}}
    .vlt-vault-fill{position:absolute;left:0;bottom:0;width:100%;background:linear-gradient(180deg,#a7f3e4,#5eead4 30%,#14b8a6 70%,#0d9488);box-shadow:0 -6px 30px rgba(94,234,212,.7);transition:height .8s cubic-bezier(.22,1,.36,1)}
    .vlt-vault-fill:before{content:'';position:absolute;top:-7px;left:0;width:100%;height:14px;background:rgba(255,255,255,.55);border-radius:50%;filter:blur(2px)}
    .vlt-vault-fill:after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);background-size:220% 100%;animation:shimmer 2.8s linear infinite}
    @keyframes shimmer{0%{background-position:130% 0}100%{background-position:-130% 0}}
    .vlt-vault-glass{position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.16),transparent 42%);pointer-events:none}
    .vlt-vault-num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Anton','Orbitron',sans-serif;font-size:2.4rem;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.7),0 0 24px rgba(20,184,166,.5)}
    .vlt-vault-num small{font-size:.64rem;letter-spacing:.12em;opacity:.85;font-family:'Orbitron',sans-serif;margin-top:3px}
    .vlt-pct{font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.18em;color:#5eead4;text-shadow:0 0 12px rgba(20,184,166,.5)}
    .vlt-lock{font-size:.7rem;color:#fcd34d;background:rgba(246,181,35,.1);border:1px solid rgba(246,181,35,.35);padding:6px 11px;border-radius:10px}
    .vlt-playcol{flex:1;min-width:300px;max-width:540px;display:flex;flex-direction:column;align-items:flex-start}
    .vlt-scenario{width:100%;box-sizing:border-box;background:linear-gradient(160deg,rgba(13,42,52,.66),rgba(4,18,26,.58));backdrop-filter:blur(16px) saturate(1.2);border:1px solid rgba(94,234,212,.18);border-radius:22px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.06);animation:cardIn .5s cubic-bezier(.22,1,.36,1)}
    @keyframes cardIn{0%{opacity:0;transform:translateY(14px)}100%{opacity:1;transform:translateY(0)}}
    .vlt-round{display:inline-flex;align-items:center;gap:8px;font-family:'Orbitron',sans-serif;font-size:.64rem;letter-spacing:.2em;color:#5eead4;margin-bottom:12px;padding:5px 12px;border-radius:20px;background:rgba(20,184,166,.12);border:1px solid rgba(94,234,212,.25)}
    .vlt-q{font-size:1.08rem;line-height:1.55;color:#eafaf7;margin:0 0 18px;font-weight:500}
    .vlt-choices{display:flex;flex-direction:column;gap:11px}
    .vlt-choice{position:relative;text-align:left;background:rgba(20,184,166,.08);border:1px solid rgba(94,234,212,.2);color:#eafaf7;padding:14px 16px 14px 18px;border-radius:14px;font-size:.96rem;cursor:pointer;transition:.2s;overflow:hidden}
    .vlt-choice:before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(#5eead4,#14b8a6);opacity:0;transition:.2s}
    .vlt-choice:hover{background:rgba(20,184,166,.2);border-color:rgba(94,234,212,.6);transform:translateX(4px);box-shadow:0 8px 24px rgba(0,0,0,.3),0 0 22px rgba(20,184,166,.22)}
    .vlt-choice:hover:before{opacity:1}
    .vlt-fb{width:100%;box-sizing:border-box;margin-top:16px;font-size:.9rem;line-height:1.55;color:#bdf3e7;background:rgba(20,184,166,.08);border-left:3px solid #14b8a6;padding:12px 15px;border-radius:0 12px 12px 0}
    .vlt-hud{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;font-size:.7rem;color:#9fe6da;font-family:'Orbitron',sans-serif;letter-spacing:.06em}
    .vlt-hud span{background:rgba(2,12,18,.5);border:1px solid rgba(94,234,212,.16);padding:6px 11px;border-radius:20px}
    .vlt-hud b{color:#fff}
    .vlt-goal,.vlt-claim{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;gap:14px;position:relative;overflow-y:auto}
    .vlt-goal h1,.vlt-claim h1{font-family:'Anton','Orbitron',sans-serif;font-size:2.1rem;color:#fff;margin:6px 0;text-shadow:0 0 30px rgba(20,184,166,.5);letter-spacing:.01em}
    .vlt-secret{max-width:540px;line-height:1.65;color:#d3efe9;background:rgba(246,181,35,.08);border:1px solid rgba(246,181,35,.25);border-radius:16px;padding:14px 18px}
    .vlt-goal-choices{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:8px}
    .vlt-goal-vault{width:130px;height:130px;border-radius:50%;border:3px solid #14b8a6;display:flex;align-items:center;justify-content:center;font-family:'Anton',sans-serif;font-size:1.6rem;color:#fff;position:relative;overflow:hidden;box-shadow:0 0 50px rgba(20,184,166,.55)}
    .vlt-goal-fill{position:absolute;inset:0;background:linear-gradient(180deg,#5eead4,#0d9488)}
    .vlt-goal-vault span{position:relative;z-index:2}
    .vlt-btn{position:relative;padding:15px 26px;border-radius:15px;border:none;font-family:'Orbitron',sans-serif;font-size:.8rem;letter-spacing:.1em;cursor:pointer;transition:.2s;overflow:hidden}
    .vlt-btn-go{background:linear-gradient(135deg,#5eead4,#14b8a6 60%,#0d9488);color:#03201d;box-shadow:0 10px 30px rgba(20,184,166,.4)}
    .vlt-btn-gold{background:linear-gradient(135deg,#fde68a,#f6b523 55%,#d99405);color:#3a2600;box-shadow:0 10px 30px rgba(246,181,35,.4)}
    .vlt-btn-alt{background:rgba(255,255,255,.07);color:#eafaf7;border:1px solid rgba(255,255,255,.2)}
    .vlt-btn:hover{transform:translateY(-2px);filter:brightness(1.07)}
    .vlt-btn-go:after,.vlt-btn-gold:after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-18deg);animation:sheen 3.6s ease-in-out infinite}
    @keyframes sheen{0%{left:-60%}55%,100%{left:140%}}
    .vlt-claim-badge{font-size:4rem;filter:drop-shadow(0 0 24px rgba(20,184,166,.85))}
    .vlt-claim-glow{position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(20,184,166,.5),transparent 68%);filter:blur(22px);z-index:0;animation:glowPulse 3.6s ease-in-out infinite}
    @keyframes glowPulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.12);opacity:1}}
    .vlt-claim-glow.gold{background:radial-gradient(circle,rgba(246,181,35,.5),transparent 68%)}
    .vlt-claim>*{position:relative;z-index:1}
    .vlt-claim-reward{font-size:.88rem;color:#fde8a8;background:rgba(246,181,35,.1);border:1px solid rgba(246,181,35,.32);padding:11px 18px;border-radius:14px;display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center}
    .vlt-circuit{width:74px;height:74px;object-fit:contain;margin-bottom:12px;filter:drop-shadow(0 6px 18px rgba(20,184,166,.55));animation:circFloat 3s ease-in-out infinite}
    @keyframes circFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    .vlt-num-pop{animation:numPop .5s cubic-bezier(.22,1,.36,1)}
    @keyframes numPop{0%{transform:scale(.55);opacity:.4}60%{transform:scale(1.18)}100%{transform:scale(1)}}
    .fly-crystal{position:absolute;width:30px;height:30px;object-fit:contain;left:50%;z-index:30;pointer-events:none;animation:flyC .9s cubic-bezier(.5,0,.4,1) forwards;filter:drop-shadow(0 0 9px rgba(94,234,212,.95))}
    @keyframes flyC{0%{transform:translate(var(--sx,0),-150px) scale(1.3) rotate(0);opacity:0}20%{opacity:1}100%{transform:translate(-50%,0) scale(.4) rotate(220deg);opacity:0}}
    .shakeit{animation:shk .42s}
    @keyframes shk{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
    .vlt-hero-img{width:auto;max-width:170px;max-height:240px;object-fit:contain;filter:drop-shadow(0 12px 34px rgba(20,184,166,.65));animation:heroRise .8s cubic-bezier(.22,1,.36,1)}
    @keyframes heroRise{0%{transform:translateY(34px) scale(.8);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
    .vlt-badge-img{width:46px;height:46px;object-fit:contain;vertical-align:middle}
    .sec-hud{display:flex;gap:12px;justify-content:center;padding:14px;font-family:'Orbitron',sans-serif;font-size:.78rem;color:#9fe6da}
    .sec-hud span{background:rgba(2,12,18,.5);border:1px solid rgba(94,234,212,.18);padding:7px 14px;border-radius:22px}
    .sec-hud b{color:#fff;display:inline-block;transition:transform .18s}
    .sec-arena{position:relative;flex:1;width:100%;max-width:780px;margin:0 auto;overflow:hidden;border:1px solid rgba(94,234,212,.2);border-radius:22px;background:linear-gradient(180deg,rgba(6,24,34,.35),rgba(2,10,16,.5));box-shadow:inset 0 0 60px rgba(0,0,0,.5)}
    .sec-obj{position:absolute;top:-90px;width:84px;height:84px;display:flex;align-items:center;justify-content:center;cursor:pointer;will-change:top;transition:transform .12s}
    .sec-obj:hover{transform:scale(1.08)}
    .sec-obj img{width:78px;height:78px;object-fit:contain;pointer-events:none;filter:drop-shadow(0 5px 14px rgba(0,0,0,.45))}
    .sec-obj .emo{position:absolute;font-size:2.3rem;z-index:-1}
    .sec-obj.blocked{animation:blast .35s forwards}
    @keyframes blast{0%{transform:scale(1)}100%{transform:scale(1.7);opacity:0}}
    .sec-vaultzone{position:absolute;left:0;bottom:0;width:100%;height:64px;background:linear-gradient(0deg,rgba(20,184,166,.42),transparent);border-top:2px dashed rgba(94,234,212,.55);display:flex;align-items:center;justify-content:center;font-family:'Orbitron',sans-serif;font-size:.66rem;letter-spacing:.12em;color:#9ff3e6}
    .sec-flash{position:absolute;inset:0;background:rgba(239,68,68,.28);opacity:0;pointer-events:none}
    .sec-flash.on{animation:redflash .45s}
    @keyframes redflash{0%{opacity:.7}100%{opacity:0}}
    .vlt-lesson{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:15px;padding:26px;position:relative;max-width:680px;margin:0 auto}
    .vlt-lesson-poster{width:min(560px,86vw);aspect-ratio:16/9;object-fit:cover;border-radius:20px;border:1px solid rgba(94,234,212,.35);box-shadow:0 22px 55px rgba(0,0,0,.55),0 0 50px rgba(20,184,166,.22)}
    .vlt-lesson-points{display:flex;flex-direction:column;gap:9px;max-width:540px;width:100%;text-align:left}
    .vlt-lesson-points div{background:linear-gradient(160deg,rgba(13,42,52,.6),rgba(4,18,26,.5));backdrop-filter:blur(10px);border:1px solid rgba(94,234,212,.16);padding:11px 15px;border-radius:14px;font-size:.94rem;color:#dbf3ed}
    .vlt-lesson-circuit{position:absolute;right:3%;left:auto;bottom:10%;width:84px;animation:circFloat 3s ease-in-out infinite;filter:drop-shadow(0 6px 18px rgba(20,184,166,.5))}
    @media(max-width:720px){.vlt-stage{flex-direction:column;gap:22px;padding:22px 5%}.vlt-vault{width:152px;height:212px}.vlt-vault-num{font-size:2rem}.vlt-playcol{max-width:none}.vlt-lesson-circuit{display:none}.vlt-claim-glow{width:300px;height:300px}.vlt-goal h1,.vlt-claim h1{font-size:1.7rem}}
   `;

  // ───────── SaveScape intro (Guardian AI) flag ─────────
  let _introSeen = {};
  window.dismissIntro = function(){ _introSeen.guardian = true; goTo('world_detail'); };

  // ───────── SCREEN: EMERGENCY VAULT · SaveScape game #2 ─────────
  // Teaches: keep an emergency fund, never raid it for wants, replenish after use.
  let _emg = null;
  const EMG_CAP = 300;
  const EMG_EVENTS = [
    { q:"📡 The comms tower blows a fuse — repair costs 80 💎. A REAL emergency.",
      choices:[
        {t:"Pay from your Emergency Fund (−80)", d:-80, fb:"That's exactly what the fund is for. Crisis handled. 🛡️"},
        {t:"Ignore it — lose your comms", d:0, fb:"No comms = you miss a paid quest. A fund prevents exactly this."} ]},
    { q:"🎮 'Galaxy Racer' — the game everyone's playing. 120 💎. This is a WANT.",
      choices:[
        {t:"Raid the fund to buy it (−120)", d:-120, raid:true, fb:"Never raid your emergency fund for a want — the #1 money mistake."},
        {t:"Skip it, save up separately", d:0, fb:"Disciplined. Wants get their own budget, not the safety net."} ]},
    { q:"💼 You finish a big side-quest: +100 💎. Top up the fund?",
      choices:[
        {t:"Add 100 💎 to the fund", d:100, fb:"Replenishing after a hit — pro move. 💪"},
        {t:"Blow it on cosmetics", d:0, fb:"Fun… but your safety net stays thin."} ]},
    { q:"🏥 Med-bay check-up: −60 💎. Unexpected, but necessary.",
      choices:[
        {t:"Pay from the fund (−60)", d:-60, fb:"Covered. This is why we keep a cushion."},
        {t:"Put it off", d:0, fb:"Delaying a real need can cost more later."} ]},
    { q:"🎉 Friend's party — a 40 💎 gift would be nice. (A want-ish.)",
      choices:[
        {t:"Use everyday coins, not the fund", d:0, fb:"Right call — the fund is sacred."},
        {t:"Take it from the fund (−40)", d:-40, raid:true, fb:"The fund isn't for parties. Keep it for true emergencies."} ]},
    { q:"🌩️ A storm knocks out the orbit station — surprise 70 💎 fix!",
      choices:[
        {t:"Pay from the fund (−70)", d:-70, fb:"Because you saved, the storm couldn't hurt you. That's resilience."},
        {t:"Can't cover it", d:0, broke:true, fb:"This is the moment a fund saves you. Build it back next time."} ]} ];

  function emgInit(){ _emg = { fund:200, round:0, phase:'play', raided:false, brokeMoment:false, fb:"Your Emergency Fund starts at 200 💎. Protect it through 6 events — emergencies only!" }; }

  SCREENS.emergency_game = function(){
    if (!_emg) emgInit();
    const e = _emg;
    const fillPct = Math.min(100, Math.round(e.fund / EMG_CAP * 100));

    if (e.phase === 'done'){
      const win = !e.raided && !e.brokeMoment && e.fund > 0;
      return `<div class="vlt-wrap"><style>${VAULT_CSS}</style>
        <div class="vlt-topbar"><button class="vlt-back" onclick="emgExit()">← SAVESCAPE ORBIT</button><div class="vlt-title">EMERGENCY VAULT</div></div>
        <div class="vlt-claim">
          <div class="vlt-claim-glow ${win?'':'gold'}"></div>
          ${win?'<img class="vlt-hero-img" src="assets/badges/anchor.png" onerror="this.style.display=&quot;none&quot;;this.nextElementSibling.style.display=&quot;block&quot;"><span class="vlt-claim-badge" style="display:none">⚓</span>':'<div class="vlt-claim-badge">🛟</div>'}
          <h1>${win?'ANCHOR BADGE EARNED!':'YOU SURVIVED — LESSON LEARNED'}</h1>
          <p>${win
            ? 'You protected your emergency fund through every crisis and never raided it for a want. Fund left: '+e.fund+' 💎. That steadiness IS financial security.'
            : 'You made it through, but '+(e.raided?'you raided the fund for a want':'the fund ran dry')+' — that is the exact mistake the Anchor badge guards against. Run it back and keep the fund sacred.'}</p>
          <div class="vlt-claim-reward">+${win?120:40} 💰${win?' &nbsp;·&nbsp; ⚓ Anchor badge':''}</div>
          <button class="vlt-btn vlt-btn-go" onclick="emgExit()">RETURN TO ORBIT</button>
          <button class="vlt-btn vlt-btn-alt" onclick="emgRestart()">TRY AGAIN</button>
        </div></div>`;
    }

    const ev = EMG_EVENTS[e.round];
    return `<div class="vlt-wrap"><style>${VAULT_CSS}</style>
      <div class="vlt-bg" style="background-image:url('assets/game/savescape_emergency_bg.jpeg')"></div>
      <div class="vlt-topbar">
        <button class="vlt-back" onclick="emgExit()">← SAVESCAPE ORBIT</button>
        <div class="vlt-title">⚡ EMERGENCY VAULT</div>
        <div class="vlt-goalpill">KEEP THE FUND ALIVE</div>
      </div>
      <div class="vlt-stage">
        <div class="vlt-vaultcol">
          <div class="vlt-vault">
            <div class="vlt-vault-fill" style="height:${fillPct}%"></div>
            <div class="vlt-vault-glass"></div>
            <div class="vlt-vault-num vlt-num-pop">${e.fund}<small>EMERGENCY FUND 💎</small></div>
          </div>
          <div class="vlt-pct">EVENT ${e.round+1} / ${EMG_EVENTS.length}</div>
        </div>
        <div class="vlt-playcol">
          <img class="vlt-circuit" src="assets/characters/circuit.png" onerror="this.style.display='none'">
          <div class="vlt-scenario">
            <div class="vlt-round">⚠️ LIFE EVENT</div>
            <p class="vlt-q">${ev.q}</p>
            <div class="vlt-choices">
              ${ev.choices.map((c,i)=>`<button class="vlt-choice" onclick="emgPick(${i})">${c.t}</button>`).join('')}
            </div>
          </div>
          <div class="vlt-fb">${e.fb}</div>
          <div class="vlt-hud"><span>🛡️ SaveScape Orbit</span><span>Fund: <b>${e.fund} 💎</b></span></div>
        </div>
      </div></div>`;
  };

  window.emgPick = function(i){
    const e=_emg, ev=EMG_EVENTS[e.round], c=ev.choices[i];
    e.fund = Math.max(0, e.fund + (c.d||0));
    if (c.raid) e.raided = true;
    if (c.broke) e.brokeMoment = true;
    e.fb = c.fb;
    e.round += 1;
    if (e.round >= EMG_EVENTS.length){ e.phase='done'; const win=!e.raided&&!e.brokeMoment&&e.fund>0; try{ state.coins=(state.coins||0)+(win?120:40); if(win)state.anchor=true; if(typeof window.refreshHUD==='function')window.refreshHUD(); }catch(_){} }
    goTo('emergency_game');
  };
  window.emgRestart = function(){ emgInit(); goTo('emergency_game'); };
  window.emgExit = function(){
    _emg=null; state.viewingWorld='guardian';
    try{ if(_emg===null && _introSeen) _introSeen.guardian = true; }catch(err){}
    goTo('world_detail');
  };

  // ───────── SCREEN: AGE + PARENTAL (onboarding safety step) ─────────
  const AGE_BANDS = [
    ['u9','Under 9','Simple words, big buttons, more guidance'],
    ['9_11','9 – 11','Core money games & guided goals'],
    ['12_14','12 – 14','Full depth: investing, credit, strategy'] ];

  SCREENS.age_parental = function(){
    const band = state.ageBand;
    const consent = state.parentConsent;
    const bands = AGE_BANDS.map(b=>`
      <button class="ap-band${band===b[0]?' on':''}" onclick="agePick('${b[0]}')">
        <b>${b[1]}</b><i>${b[2]}</i>
      </button>`).join('');
    return `
      <div class="ap-screen">
        <div class="ap-bg"></div>
        <div class="ap-card">
          <div class="ap-eyebrow">ACCOUNT SETUP · STEP 2 OF 3</div>
          <div class="ap-dots"><i class="on"></i><i class="on"></i><i></i></div>
          <h1 class="ap-h1">👨‍👩‍👧 Safety &amp; Permissions</h1>
          <p class="ap-sub">Coinaverse is built for kids — so a grown-up sets things up first. <b style="color:#5eead4">Trust is a feature here.</b></p>

          <div class="ap-block">
            <div class="ap-label">How old is the player?</div>
            <div class="ap-bands">${bands}</div>
          </div>

          <div class="ap-block">
            <div class="ap-label">Parent / guardian email</div>
            <input id="apEmail" class="ap-input" type="email" placeholder="parent@email.com" value="${state.parentEmail||''}" />
            <button class="ap-consent${consent?' on':''}" onclick="ageConsent()">
              <span class="ap-check">${consent?'✓':''}</span> I'm a parent/guardian and I approve this account
            </button>
          </div>

          <div class="ap-privacy">
            <div>🛡️ <b>Safe multiplayer</b> — moderated, no open chat with strangers</div>
            <div>🪙 <b>Virtual coins only</b> — no real money, kids can't make real purchases</div>
            <div>🔒 <b>Comms filtered</b> &amp; progress stored on this device</div>
          </div>

          <button class="ap-go" onclick="ageContinue()">CONTINUE →</button>
          <button class="ap-link" onclick="ageContinue('parent')">Open the Parent Dashboard first ›</button>
        </div>
      </div>
      <style>
        .ap-screen{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto}
        .ap-bg{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 120%,rgba(20,184,166,.16),transparent 55%),radial-gradient(140% 110% at 50% -10%,#0c3b4a,#072433 45%,#04141d 72%,#020a11 100%)}
        .ap-bg:before{content:'';position:absolute;inset:-12%;background:radial-gradient(38% 36% at 24% 26%,rgba(20,184,166,.28),transparent 70%),radial-gradient(34% 32% at 80% 24%,rgba(56,189,248,.18),transparent 70%);filter:blur(26px);animation:apNeb 22s ease-in-out infinite alternate}
        .ap-bg:after{content:'';position:absolute;inset:0;opacity:.5;background-image:radial-gradient(1px 1px at 20% 30%,rgba(255,255,255,.8),transparent),radial-gradient(1px 1px at 70% 60%,rgba(255,255,255,.6),transparent),radial-gradient(1.5px 1.5px at 40% 80%,rgba(190,240,255,.7),transparent),radial-gradient(1px 1px at 85% 22%,rgba(255,255,255,.6),transparent),radial-gradient(1px 1px at 55% 14%,rgba(255,255,255,.5),transparent),radial-gradient(1px 1px at 12% 72%,rgba(255,255,255,.55),transparent);animation:apTwk 6s ease-in-out infinite}
        .ap-card{position:relative;width:100%;max-width:500px;background:linear-gradient(165deg,rgba(13,44,53,.82),rgba(4,18,26,.74));backdrop-filter:blur(18px) saturate(1.2);border:1px solid rgba(94,234,212,.2);border-radius:26px;padding:30px 28px;box-shadow:0 30px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.07);animation:apIn .55s cubic-bezier(.22,1,.36,1)}
        .ap-eyebrow{display:flex;align-items:center;gap:10px;font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.22em;color:#5eead4}
        .ap-eyebrow:after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(94,234,212,.4),transparent)}
        .ap-dots{display:flex;gap:6px;margin:14px 0 2px}
        .ap-dots i{width:28px;height:4px;border-radius:3px;background:rgba(94,234,212,.2)}
        .ap-dots i.on{background:linear-gradient(90deg,#5eead4,#14b8a6);box-shadow:0 0 10px rgba(20,184,166,.6)}
        .ap-h1{color:#fff;font-size:1.55rem;margin:14px 0 6px;text-shadow:0 0 24px rgba(20,184,166,.35)}
        .ap-sub{color:#cbe9e2;font-size:.88rem;line-height:1.6;margin:0 0 20px}
        .ap-block{margin-bottom:18px}
        .ap-label{font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.16em;color:#8fd9cd;margin-bottom:10px}
        .ap-bands{display:flex;flex-direction:column;gap:10px}
        .ap-band{position:relative;text-align:left;padding:14px 48px 14px 16px;border:1px solid rgba(94,234,212,.22);border-radius:15px;background:rgba(20,184,166,.05);color:#eafbf7;cursor:pointer;transition:.2s}
        .ap-band:after{content:'';position:absolute;right:16px;top:50%;transform:translateY(-50%);width:20px;height:20px;border-radius:50%;border:2px solid rgba(94,234,212,.4);transition:.2s}
        .ap-band:hover{border-color:rgba(94,234,212,.5);background:rgba(20,184,166,.1);transform:translateX(3px)}
        .ap-band.on{border-color:#14b8a6;background:linear-gradient(135deg,rgba(20,184,166,.26),rgba(13,148,136,.08));box-shadow:0 0 24px rgba(20,184,166,.35)}
        .ap-band.on:after{border-color:#5eead4;background:radial-gradient(circle,#5eead4 42%,transparent 48%);box-shadow:0 0 12px rgba(94,234,212,.7)}
        .ap-band b{display:block;font-size:.98rem;margin-bottom:2px}
        .ap-band i{font-style:normal;font-size:.76rem;color:#a6dcd3}
        .ap-input{width:100%;padding:13px 15px;border:1px solid rgba(94,234,212,.25);border-radius:13px;background:rgba(2,12,18,.6);color:#fff;font-size:.92rem;margin-bottom:10px;box-sizing:border-box;transition:.2s}
        .ap-input:focus{outline:none;border-color:#14b8a6;box-shadow:0 0 0 3px rgba(20,184,166,.18)}
        .ap-consent{display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:13px 15px;border:1px solid rgba(94,234,212,.22);border-radius:13px;background:rgba(20,184,166,.05);color:#dcf5ef;font-size:.84rem;cursor:pointer;transition:.2s}
        .ap-consent.on{border-color:#34d399;background:rgba(52,211,153,.12);box-shadow:0 0 20px rgba(52,211,153,.2)}
        .ap-check{width:22px;height:22px;flex:0 0 22px;border:2px solid rgba(94,234,212,.5);border-radius:7px;display:flex;align-items:center;justify-content:center;color:#03201d;font-weight:800;transition:.2s}
        .ap-consent.on .ap-check{background:linear-gradient(135deg,#5eead4,#14b8a6);border-color:#5eead4}
        .ap-privacy{background:rgba(2,12,18,.45);border:1px solid rgba(94,234,212,.16);border-radius:16px;padding:14px 16px;margin:6px 0 20px}
        .ap-privacy div{color:#c7e9e2;font-size:.8rem;line-height:1.55;margin:5px 0}
        .ap-go{position:relative;width:100%;padding:16px;border:none;border-radius:15px;background:linear-gradient(135deg,#5eead4,#14b8a6 60%,#0d9488);color:#03201d;font-family:Orbitron,sans-serif;font-size:.86rem;letter-spacing:.1em;cursor:pointer;overflow:hidden;box-shadow:0 12px 34px rgba(20,184,166,.4);transition:.2s}
        .ap-go:hover{transform:translateY(-2px);filter:brightness(1.06)}
        .ap-go:after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-18deg);animation:apSheen 3.6s ease-in-out infinite}
        .ap-link{display:block;width:100%;margin-top:12px;background:none;border:none;color:#8fd9cd;font-size:.8rem;cursor:pointer;transition:.18s}
        .ap-link:hover{color:#5eead4}
        @keyframes apNeb{0%{transform:translate3d(0,0,0) scale(1)}100%{transform:translate3d(0,-3%,0) scale(1.08)}}
        @keyframes apTwk{0%,100%{opacity:.35}50%{opacity:.7}}
        @keyframes apIn{0%{opacity:0;transform:translateY(16px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes apSheen{0%{left:-60%}55%,100%{left:140%}}
      </style>`;
  };
  window.agePick = function(b){ state.ageBand=b; goTo('age_parental'); };
  window.ageConsent = function(){ const e=document.getElementById('apEmail'); if(e) state.parentEmail=e.value; state.parentConsent=!state.parentConsent; goTo('age_parental'); };
  window.ageContinue = function(dest){
    const e=document.getElementById('apEmail'); if(e) state.parentEmail=e.value;
    if(!state.ageBand) state.ageBand='9_11';
    if(window.cvSave) cvSave();
    goTo(dest==='parent' ? 'parent_dashboard' : 'greet');
  };

  // ───────── SCREEN: PARENT DASHBOARD ("Trust is a feature") ─────────
  SCREENS.parent_dashboard = function(){
    const r = state.restrictions || (state.restrictions={timeLimit:true,approvePurchases:true,safeMultiplayer:true,moderatedComms:true});
    const ageLabel = {u9:'Under 9','9_11':'9–11','12_14':'12–14'}[state.ageBand] || 'Not set';
    const badges = [];
    if(state.smartSaver) badges.push('🏅 Smart Saver');
    if(state.vaultAura) badges.push('✦ Vault Aura');
    if(state.securityChamp) badges.push('🛡️ Security Champion');
    if(state.anchor) badges.push('⚓ Anchor');
    if(badges.length===0) badges.push('No badges yet — they appear as your child learns');
    const lessons = (state.completedMissions||0);
    const meter = (label,pct,col)=>`
      <div class="pd-meter"><div class="pd-meter-top"><span>${label}</span><b>${pct}%</b></div>
        <div class="pd-bar"><div style="width:${pct}%;background:${col}"></div></div></div>`;
    const toggle = (key,label,desc)=>`
      <div class="pd-toggle">
        <div><b>${label}</b><i>${desc}</i></div>
        <button class="pd-sw${r[key]?' on':''}" onclick="parentToggle('${key}')"><span></span></button>
      </div>`;
    return `
      <div class="pd-screen">
        <div class="pd-top">
          <button class="pd-back" onclick="goTo(state.archetype?'home':'age_parental')">← BACK</button>
          <div class="pd-title">👨‍👩‍👧 PARENT DASHBOARD</div>
        </div>
        <div class="pd-wrap">
          <div class="pd-hero">
            <div class="pd-hero-l"><b>${state.playerName||'Hero'}</b><i>Age band: ${ageLabel} · Guardian: ${state.parentEmail||'—'}</i></div>
            <div class="pd-trust">TRUST IS A FEATURE</div>
          </div>

          <div class="pd-grid">
            <div class="pd-card">
              <div class="pd-ch">📚 Educational Progress</div>
              <div class="pd-stat"><b>${lessons}</b><span>lessons / missions completed</span></div>
              <div class="pd-stat"><b>LVL ${state.level||1}</b><span>current rank · ${state.xp||0} XP</span></div>
            </div>
            <div class="pd-card">
              <div class="pd-ch">⏱️ Time in App</div>
              <div class="pd-stat"><b>2h 10m</b><span>this week (demo)</span></div>
              <div class="pd-stat"><b>18m</b><span>avg / day · healthy range</span></div>
            </div>
            <div class="pd-card pd-wide">
              <div class="pd-ch">💪 Financial Strengths</div>
              ${meter('Saving discipline', Math.min(99,40+(state.vault?40:0)), '#14b8a6')}
              ${meter('Emergency readiness', state.emergency||60, '#22d3ee')}
              ${meter('Fraud awareness', state.security||88, '#34d399')}
            </div>
            <div class="pd-card pd-wide">
              <div class="pd-ch">🏅 Badges Earned</div>
              <div class="pd-badges">${badges.map(b=>`<span>${b}</span>`).join('')}</div>
            </div>
          </div>

          <div class="pd-controls">
            <div class="pd-ch">🔧 Controls &amp; Permissions</div>
            ${toggle('timeLimit','Daily time limit','Gently caps play time each day')}
            ${toggle('approvePurchases','Approve purchases','You confirm any coin spend in the shop')}
            ${toggle('safeMultiplayer','Safe multiplayer','Play only with approved friends')}
            ${toggle('moderatedComms','Moderated comms','Filtered, preset messages only — no open chat')}
          </div>

          <div class="pd-note">🪙 Coinaverse uses <b>virtual coins only</b>. Kids never spend real money. Progress is stored on this device.</div>
        </div>
      </div>
      <style>
        .pd-screen{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 0%,#0a3038,#04141d 60%,#020a10);overflow:auto;color:#eafbf7}
        .pd-top{display:flex;align-items:center;gap:12px;padding:16px 18px;position:sticky;top:0;background:rgba(4,18,26,.9);backdrop-filter:blur(8px);z-index:5}
        .pd-back{background:rgba(20,184,166,.12);border:1px solid rgba(20,184,166,.4);color:#7fd3c7;padding:8px 12px;border-radius:10px;font-size:.72rem;cursor:pointer}
        .pd-title{font-family:Orbitron,sans-serif;font-size:.82rem;letter-spacing:.14em;color:#fff}
        .pd-wrap{padding:6px 18px 30px;max-width:640px;margin:0 auto}
        .pd-hero{display:flex;align-items:center;justify-content:space-between;gap:12px;background:linear-gradient(135deg,rgba(20,184,166,.18),rgba(13,148,136,.05));border:1px solid rgba(20,184,166,.4);border-radius:16px;padding:14px 16px;margin-bottom:14px}
        .pd-hero-l b{display:block;font-size:1.1rem;color:#fff}
        .pd-hero-l i{font-style:normal;font-size:.76rem;color:#9fd8cf}
        .pd-trust{font-family:Orbitron,sans-serif;font-size:.56rem;letter-spacing:.18em;color:#14b8a6;border:1px solid rgba(20,184,166,.5);border-radius:20px;padding:6px 10px}
        .pd-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
        .pd-card{background:rgba(2,16,22,.66);border:1px solid rgba(20,184,166,.28);border-radius:16px;padding:14px}
        .pd-wide{grid-column:1 / -1}
        .pd-ch{font-family:Orbitron,sans-serif;font-size:.66rem;letter-spacing:.12em;color:#7fd3c7;margin-bottom:10px}
        .pd-stat{display:flex;align-items:baseline;gap:8px;margin:6px 0}
        .pd-stat b{font-size:1.3rem;color:#fff}
        .pd-stat span{font-size:.74rem;color:#9fd8cf}
        .pd-meter{margin:9px 0}
        .pd-meter-top{display:flex;justify-content:space-between;font-size:.76rem;color:#cdeee7;margin-bottom:4px}
        .pd-bar{height:8px;border-radius:8px;background:rgba(255,255,255,.08);overflow:hidden}
        .pd-bar div{height:100%;border-radius:8px}
        .pd-badges{display:flex;flex-wrap:wrap;gap:8px}
        .pd-badges span{font-size:.78rem;background:rgba(20,184,166,.14);border:1px solid rgba(20,184,166,.4);border-radius:20px;padding:6px 11px;color:#dcf5ef}
        .pd-controls{background:rgba(2,16,22,.66);border:1px solid rgba(20,184,166,.28);border-radius:16px;padding:14px;margin-bottom:14px}
        .pd-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}
        .pd-toggle:last-child{border-bottom:none}
        .pd-toggle b{display:block;font-size:.88rem;color:#fff}
        .pd-toggle i{font-style:normal;font-size:.73rem;color:#9fd8cf}
        .pd-sw{width:46px;height:26px;border-radius:20px;border:none;background:rgba(255,255,255,.16);position:relative;cursor:pointer;flex:0 0 46px}
        .pd-sw span{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s}
        .pd-sw.on{background:linear-gradient(135deg,#14b8a6,#0d9488)}
        .pd-sw.on span{left:23px}
        .pd-note{background:rgba(2,12,18,.5);border:1px dashed rgba(20,184,166,.3);border-radius:14px;padding:12px 14px;font-size:.78rem;color:#bfe6df;line-height:1.5}
        @media(max-width:520px){.pd-grid{grid-template-columns:1fr}}
      </style>`;
  };
  window.parentToggle = function(k){ const r=state.restrictions||{}; r[k]=!r[k]; state.restrictions=r; goTo('parent_dashboard'); };

  // ───────── SCREEN: SECURITY SHIELD CMD · SaveScape game #3 ─────────
  // Teaches: spot scams / phishing / fake offers — fraud defense.
  let _sec = null;
  const SEC_ITEMS = [
    { msg:"🎁 'CONGRATS! You won 10,000 💎! Just send us your password to claim.'", scam:true,  why:"Real prizes NEVER need your password. Classic scam." },
    { msg:"🏦 Your bank app asks you to log in on its own official screen.", scam:false, why:"Logging in on the real app is normal and safe. ✅" },
    { msg:"🚨 'Your account is LOCKED! Verify your details in 5 min or lose everything!'", scam:true,  why:"Fake urgency + threats = scam. Slow down, it's a trap." },
    { msg:"👾 A friend you actually know sends you a co-op quest invite.", scam:false, why:"A known friend inviting you to play is legit. ✅" },
    { msg:"💸 'Send me 100 💎 now and I'll send 200 💎 back instantly!'", scam:true,  why:"If it's too good to be true, it is. Money doubling = scam." },
    { msg:"🔐 The app asks you to set a strong, private password.", scam:false, why:"Setting a strong password protects you. Good security. ✅" },
    { msg:"📞 'Hi, I'm support — read me the code we just texted you.'", scam:true,  why:"NEVER share a one-time code. Support will never ask for it." },
    { msg:"🛒 Buying a skin in the marketplace with coins you earned.", scam:false, why:"Spending your own earned coins in the real shop is fine. ✅" } ];

  // ── Security Shield · INTERACTIVE tap-to-block (reuses _sec, declared above) ──
  const SEC_SPRITES = [
    {img:'assets/game/scam_phish.png', emo:'🪝', scam:true},
    {img:'assets/game/scam_prize.png', emo:'🎁', scam:true},
    {img:'assets/game/scam_otp.png',   emo:'📞', scam:true},
    {img:'assets/game/safe_friend.png',emo:'🤝', scam:false},
    {img:'assets/game/safe_bank.png',  emo:'🏦', scam:false},
  ];
  const SEC_DUR = 26;
  let _secTimers = [];
  function secClear(){ _secTimers.forEach(t=>{ clearTimeout(t); clearInterval(t); }); _secTimers=[]; }
  function secInit(){ secClear(); _sec = { score:0, mistakes:0, breaches:0, timeLeft:SEC_DUR, phase:'play' }; }

  SCREENS.security_game = function(){
    if(!_sec) secInit();
    const s=_sec;
    if(s.phase==='done'){
      const win = s.score>=6 && s.mistakes<=2;
      return `<div class="vlt-wrap"><style>${VAULT_CSS}</style>
        <div class="vlt-topbar"><button class="vlt-back" onclick="secExit()">← SAVESCAPE ORBIT</button><div class="vlt-title">SECURITY SHIELD</div></div>
        <div class="vlt-claim">
          <div class="vlt-claim-glow ${win?'gold':''}"></div>
          ${win
            ? '<img class="vlt-hero-img" src="assets/badges/security_champion.png" onerror="this.style.display=\'none\';var d=document.createElement(\'div\');d.className=\'vlt-claim-badge\';d.textContent=\'🛡️\';this.parentNode.insertBefore(d,this)">'
            : '<div class="vlt-claim-badge">🔍</div>'}
          <h1>${win?'SECURITY CHAMPION!':'KEEP TRAINING YOUR EYE'}</h1>
          <p>You blocked <b>${s.score}</b> scams with <b>${s.mistakes}</b> mistake(s). ${win
            ? 'Sharp eyes. You can tell a scam from the real thing — that instinct protects everything you save.'
            : 'Scammers rely on urgency and "too good to be true" offers. Tap only the scams, let safe things pass. Run it back!'}</p>
          <div class="vlt-claim-reward">+${win?120:40} 💰${win?' &nbsp;·&nbsp; <img class="vlt-badge-img" src="assets/badges/security_champion.png" onerror="this.style.display=\'none\'"> Security Champion':''}</div>
          <button class="vlt-btn vlt-btn-go" onclick="secExit()">RETURN TO ORBIT</button>
          <button class="vlt-btn vlt-btn-alt" onclick="secRestart()">PLAY AGAIN</button>
        </div></div>`;
    }
    return `<div class="vlt-wrap"><style>${VAULT_CSS}</style>
      <div class="vlt-bg" style="background-image:url('assets/game/savescape_security_bg.jpeg')"></div>
      <div class="vlt-topbar">
        <button class="vlt-back" onclick="secExit()">← SAVESCAPE ORBIT</button>
        <div class="vlt-title">🛡️ SECURITY SHIELD CMD</div>
        <div class="vlt-goalpill">TAP THE SCAMS</div>
      </div>
      <div class="sec-hud">
        <span>⏱ <b id="secTime">${s.timeLeft}</b>s</span>
        <span>🛡️ Blocked <b id="secScore">${s.score}</b></span>
        <span>❌ Mistakes <b id="secMiss">${s.mistakes}</b></span>
      </div>
      <div class="sec-arena" id="secArena">
        <div class="sec-flash" id="secFlash"></div>
        <div class="sec-vaultzone">🔒 YOUR VAULT — block scams before they reach it</div>
      </div>
      <div class="vlt-fb" style="margin:10px 6% 16px">Tap the <b>scams</b> 🪝🎁📞 to block them. Let the <b>safe</b> ones 🤝🏦 pass through. Protect your vault!</div>
    </div>`;
  };

  window.secBegin = function(){ secInit(); goTo('security_game'); _secTimers.push(setTimeout(secRun,360)); };
  window.secRestart = window.secBegin;
  function secRun(){
    const arena=document.getElementById('secArena'); if(!arena){ secClear(); return; }
    _secTimers.push(setInterval(()=>{
      if(!document.getElementById('secArena')){ secClear(); return; }
      _sec.timeLeft--; const t=document.getElementById('secTime'); if(t) t.textContent=Math.max(0,_sec.timeLeft);
      if(_sec.timeLeft<=0) secFinish();
    },1000));
    _secTimers.push(setInterval(secSpawn,1150));
    secSpawn();
  }
  function secSpawn(){
    const arena=document.getElementById('secArena'); if(!arena||_sec.phase!=='play') return;
    const sp=SEC_SPRITES[Math.floor(Math.random()*SEC_SPRITES.length)];
    const el=document.createElement('div'); el.className='sec-obj'; el.dataset.scam=sp.scam?'1':'0'; el.dataset.live='1';
    const w=arena.clientWidth||600;
    el.style.left=Math.max(6,Math.random()*(w-92))+'px'; el.style.top='-90px';
    el.innerHTML=`<span class="emo">${sp.emo}</span><img src="${sp.img}" onerror="this.remove()">`;
    el.onclick=function(){ secTap(el); };
    arena.appendChild(el);
    const dur=3.4;
    requestAnimationFrame(()=>{ el.style.transition='top '+dur+'s linear'; el.style.top=Math.max(40,arena.clientHeight-84)+'px'; });
    _secTimers.push(setTimeout(()=>secReach(el),dur*1000));
  }
  function secTap(el){
    if(!el||el.dataset.live!=='1') return; el.dataset.live='0';
    const scam=el.dataset.scam==='1';
    if(scam){ _sec.score++; secBump('secScore',_sec.score); }
    else { _sec.mistakes++; secBump('secMiss',_sec.mistakes); secFlashFx(); }
    el.classList.add('blocked'); _secTimers.push(setTimeout(()=>el.remove(),350));
  }
  function secReach(el){
    if(!el || el.dataset.live!=='1'){ if(el&&el.remove) el.remove(); return; }
    el.dataset.live='0';
    if(el.dataset.scam==='1'){ _sec.breaches++; _sec.mistakes++; secBump('secMiss',_sec.mistakes); secFlashFx(); }
    el.remove();
  }
  function secBump(id,val){ const e=document.getElementById(id); if(e){ e.textContent=val; e.style.transform='scale(1.4)'; setTimeout(()=>{ if(e) e.style.transform='scale(1)'; },180); } }
  function secFlashFx(){ const f=document.getElementById('secFlash'); if(f){ f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); } }
  function secFinish(){
    if(_sec.phase==='done') return; _sec.phase='done'; secClear();
    const win=_sec.score>=6 && _sec.mistakes<=2;
    try{ if(win){ state.securityChamp=true; state.security=Math.min(99,(state.security||88)+6); state.coins=(state.coins||0)+120; }
         else { state.coins=(state.coins||0)+40; }
         if(typeof window.refreshHUD==='function') window.refreshHUD(); }catch(_){}
    goTo('security_game');
  }
  window.secExit = function(){ secClear(); _sec=null; state.viewingWorld='guardian'; goTo('world_detail'); };

  // ───────── SaveScape districts panel (flagship CTA) ─────────
  window.svDistrictsPanel = function(){
    const card = (ico,title,sub,target)=>`
      <button onclick="learnThenPlay('${target}')" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;margin-bottom:8px;padding:12px 14px;border:1px solid rgba(20,184,166,.5);border-radius:14px;background:linear-gradient(135deg,rgba(20,184,166,.16),rgba(13,148,136,.05));color:#eafbf7;cursor:pointer">
        <span style="font-size:1.5rem">${ico}</span>
        <span style="flex:1"><b style="display:block;font-size:.92rem">${title}</b><i style="font-style:normal;font-size:.72rem;color:#9fd8cf">${sub}</i></span>
        <em style="font-style:normal;font-size:.58rem;color:#34d399;font-weight:700;letter-spacing:.08em">● LIVE</em>
      </button>`;
    return `
      <div style="margin-top:6px">
        <div style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.18em;color:#14b8a6;margin:0 0 9px">SAVESCAPE DISTRICTS · 3 LIVE</div>
        ${card('🪙','Goal Galaxy','Vault Builder — save toward your goal','vault_game')}
        ${card('⚡','Emergency Vault','Survive crises with your fund','emergency_game')}
        ${card('🛡️','Security Shield Cmd','Spot scams — fraud defense drill','security_game')}
        <div style="margin-top:6px;padding:9px 12px;border:1px dashed rgba(20,184,166,.32);border-radius:12px;color:#7fae9f;font-size:.72rem;line-height:1.5">🔒 Compound Constellation · Future Dreams Harbor · Resilience Arena · Guardian Temple — coming soon</div>
      </div>`;
  };

  // ───────── SCREEN: WORLD DETAIL ─────────
  SCREENS.world_detail = function() {
    const wid = state.viewingWorld || state.archetype || 'rebuilder';
    if (wid === 'credtech') return SCREENS.credtech_hub();
    const w = WORLDS[wid] || WORLDS.rebuilder;
    const FLAGSHIP = 'guardian';
    const isPreview = (wid !== FLAGSHIP);
    const previewRibbon = isPreview ? '<div style="margin-top:10px;display:inline-block;padding:6px 14px;border:1px solid var(--gold);border-radius:20px;font-family:Orbitron,sans-serif;font-size:0.68rem;letter-spacing:0.16em;color:var(--gold);background:rgba(246,181,35,0.12)">🔒 PREVIEW · COMING SOON</div>' : '';
    const enterBtn = isPreview
      ? '<button class="wd-enter-btn" style="opacity:0.55" onclick="alert(\'Coming soon — SaveScape Orbit is the live hub right now.\')">🔒 PREVIEW · COMING SOON</button>'
      : svDistrictsPanel();
    const playerArch = state.archetype || 'guardian';
    const playerW = WORLDS[playerArch];
    const hudPills = (wid==='guardian')
      ? '<div class="stat-pill" style="border-color:#14b8a6"><span class="num">'+(state.vault||0)+' 💎</span><span class="lbl">VAULT</span></div>'
        +'<div class="stat-pill" style="border-color:#14b8a6"><span class="num">'+(state.security||0)+'%</span><span class="lbl">SECURITY</span></div>'
        +'<div class="stat-pill" style="border-color:#14b8a6"><span class="num">'+(state.emergency||0)+'%</span><span class="lbl">EMERGENCY</span></div>'
      : '<div class="stat-pill"><span class="num">'+state.coins+'</span><span class="lbl">COINS</span></div>'
        +'<div class="stat-pill"><span class="num">LVL '+state.level+'</span><span class="lbl">RANK</span></div>'
        +'<div class="stat-pill"><span class="num">'+state.streak+'</span><span class="lbl">STREAK</span></div>';
    const showIntro = (wid==='guardian' && !_introSeen.guardian);
    const introOverlay = showIntro ? '<div style="position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(3,15,22,.84);backdrop-filter:blur(4px)"><div style="max-width:440px;text-align:center;padding:32px;border:1px solid #14b8a6;border-radius:22px;background:linear-gradient(160deg,rgba(8,40,46,.97),rgba(4,20,30,.97));box-shadow:0 0 60px rgba(20,184,166,.45)"><div style="font-size:3rem">🤖</div><div style="font-family:Orbitron,sans-serif;font-size:.66rem;letter-spacing:.2em;color:#14b8a6;margin:6px 0 12px">CIRCUIT · AI GUIDE</div><h2 style="color:#fff;font-size:1.4rem;margin:0 0 12px">Welcome to SaveScape Orbit, Guardian. 🛡️</h2><p style="color:#cdeee7;line-height:1.6;margin:0 0 20px">Here, every coin you protect becomes power. Build your vault, defend your future — <b style="color:#5eead4">patience is your sharpest weapon.</b></p><button onclick="dismissIntro()" style="padding:13px 26px;border:none;border-radius:14px;background:linear-gradient(135deg,#14b8a6,#0d9488);color:#04201e;font-family:Orbitron,sans-serif;font-size:.8rem;letter-spacing:.1em;cursor:pointer">ENTER ORBIT →</button></div></div>' : '';
    const mission = (m) => `
      <div class="wd-mission-row">
        <div class="wd-mission-name">${m.name}</div>
        <div class="wd-mission-progress">${m.done}/${m.total}</div>
        <span class="wd-mission-reward">${m.reward}</span>
      </div>`;
    const progressPct = Math.round((w.missions.reduce((s,m) => s + m.done/m.total, 0) / w.missions.length) * 100);
    return `
      <div class="v14-screen wd-screen wd--${w.color}">
        <div class="wd-bg" style="background-image:url('${w.sceneBg}')"></div>
        ${introOverlay}
        <div class="wd-topbar">
          <div class="wd-topbar-left">
            <button class="wd-crumb" onclick="goTo('home')">← HOME</button>
            <div class="wd-crumb-title">${w.zone}</div>
          </div>
          <div class="wd-stats">
            <div class="wd-player-pill">
              <div class="av" style="background-image:url('${playerW.character}')"></div>
              <div><div class="n">${state.playerName}</div><div class="a">${playerW.archetype}</div></div>
            </div>
            ${hudPills}
          </div>
        </div>
        <aside class="wd-sidebar">
          <div class="wd-zone-card">
            <div class="lbl">CURRENT ZONE</div>
            <div class="name"><span class="icon">${w.icon}</span>${w.name}</div>
          </div>
          <div class="wd-side-menu">
            <div class="wd-side-item" onclick="goTo('leaderboards')"><span class="ic">🏆</span>LEADERBOARDS</div>
            <div class="wd-side-item" onclick="openInventory()"><span class="ic">🎒</span>INVENTORY</div>
            <div class="wd-side-item" onclick="goTo('reward_center')"><span class="ic">🎖️</span>ACHIEVEMENTS</div>
            <div class="wd-side-item" onclick="goTo('cinema')"><span class="ic">🎬</span>CINEMA</div>
            <div class="wd-side-item" onclick="goTo('shop')"><span class="ic">🛒</span>MARKETPLACE</div>
            <div class="wd-side-item" onclick="goTo('parent_dashboard')"><span class="ic">👨‍👩‍👧</span>PARENT ZONE</div>
            <div class="wd-side-item" onclick="openSettings()"><span class="ic">⚙️</span>SETTINGS</div>
          </div>
        </aside>
        <main class="wd-hero">
          <div class="wd-hero-scene" style="background-image:url('${w.sceneBg}')"></div>
          <h1 class="wd-hero-title">${w.zone}</h1>
          <div class="wd-hero-desc">${w.tagline}</div>
          ${previewRibbon}
          <div class="wd-hero-character" style="background-image:url('${w.hero||w.character}')"></div>
        </main>
        <aside class="wd-right">
          <div class="wd-panel">
            <div class="wd-panel-head"><span class="ic">${w.icon}</span>ZONE OVERVIEW</div>
            <div class="wd-overview-thumb" style="background-image:url('${w.sceneBg}')"></div>
            <div class="wd-overview-desc">${w.tagline}<br><br>Complete missions to restore and earn rewards.</div>
            <div class="wd-panel-head" style="margin-top:14px">⚡ ZONE REWARDS</div>
            <div class="wd-rewards-grid">
              <div class="wd-reward-cell"><span class="ic">💰</span><span class="lbl">COINS</span></div>
              <div class="wd-reward-cell"><span class="ic">⚡</span><span class="lbl">XP</span></div>
              <div class="wd-reward-cell"><span class="ic">💎</span><span class="lbl">RESOURCES</span></div>
              <div class="wd-reward-cell"><span class="ic">🎁</span><span class="lbl">LOOT</span></div>
            </div>
            ${enterBtn}
          </div>
          <div class="wd-panel">
            <div class="wd-panel-head"><span class="ic">📊</span>ZONE PROGRESS</div>
            <div class="wd-progress-label"><span>${w.progressLabel}</span><span class="wd-progress-num">${progressPct}%</span></div>
            <div class="wd-progress-bar"><div class="wd-progress-fill" style="width:${progressPct}%"></div></div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
              <div style="flex:1;font-size:0.78rem;color:var(--text-soft)">Next Milestone:<br><strong style="color:var(--gold)">${w.rewardName}</strong><br><span style="font-size:0.7rem">Unlocks at 50%</span></div>
              <div class="wd-bottomprog-chest" style="background-image:url('assets/ui/star_3d.png')"></div>
            </div>
          </div>
        </aside>
        <div class="wd-missions">
          <div class="wd-missions-head">
            <span class="wd-missions-title">⚡ DAILY MISSIONS</span>
            <span class="wd-missions-timer">⏱ 17:45:12</span>
          </div>
          ${w.missions.map(mission).join('')}
          <button class="wd-view-all" onclick="goTo('reward_center')">VIEW ALL MISSIONS →</button>
        </div>
        <nav class="wd-bottomnav">
          <div class="wd-tab active" onclick="goTo('home')"><span class="ic">🌍</span>HUBS</div>
          <div class="wd-tab" onclick="goTo('party')"><span class="ic">⚔️</span>PARTY</div>
          <div class="wd-tab" onclick="goTo('leaderboards')"><span class="ic">🏆</span>RANKS</div>
          <div class="wd-tab" onclick="goTo('reward_center')"><span class="ic">🎁</span>REWARDS</div>
          <div class="wd-tab" onclick="goTo('shop')"><span class="ic">🛒</span>SHOP</div>
          <div class="wd-tab" onclick="openProfile()"><span class="ic">👤</span>PROFILE</div>
        </nav>
        <div class="wd-bottomprog">
          <div class="wd-bottomprog-head">DAILY REWARD</div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.7rem;color:var(--text-soft)">
            <div class="wd-bottomprog-chest" style="background-image:url('assets/ui/star_3d.png')"></div>
            <div>Complete 3 missions<br>to claim reward<br><span style="color:var(--gold)">1/3</span></div>
          </div>
        </div>
      </div>`;
  };

  // ───────── SCREEN: AVATAR STUDIO (archetype-locked colorways) ─────────
  // Color system per Kabria doc: each archetype gets a signature color, and
  // avatar customization only offers shades of THAT color.
  const SIG = {
    strategist:{hex:'#3B82F6', name:'BLUE'},
    builder:   {hex:'#A855F7', name:'PURPLE'},
    investor:  {hex:'#10B981', name:'GREEN'},
    guardian:  {hex:'#14B8A6', name:'TEAL'},
    risktaker: {hex:'#EF4444', name:'RED'},
    rebuilder: {hex:'#F59E0B', name:'AMBER'},
    credtech:  {hex:'#38BDF8', name:'CYAN'},
  };
  function shade(hex, p){
    hex = hex.replace('#','');
    const n = parseInt(hex,16), r=n>>16, g=(n>>8)&255, b=n&255;
    const f = c => { const v = p>=0 ? c+(255-c)*p : c*(1+p); return Math.max(0,Math.min(255,Math.round(v))); };
    return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  function colorRamp(token){
    const base = (SIG[token]||SIG.guardian).hex;
    return [.58,.40,.22,.06,0,-.16,-.32,-.5].map(p => p===0 ? base : shade(base,p));
  }
  const AURAS = ['PULSE','ORBIT RING','SPARKS','NONE'];

  SCREENS.avatar = function() {
    const arch = state.archetype || 'guardian';
    const w = WORLDS[arch] || WORLDS.guardian;
    const sig = SIG[arch] || SIG.guardian;
    const ramp = colorRamp(arch);
    if (state.avatarColorIdx == null) state.avatarColorIdx = 4;           // base shade
    if (state.avatarAura == null) state.avatarAura = 'ORBIT RING';
    const sel = ramp[state.avatarColorIdx] || sig.hex;

    const swatches = ramp.map((c,i) =>
      `<button class="av-swatch${i===state.avatarColorIdx?' on':''}" style="--s:${c}"
        onclick="pickColorway(${i})" title="${c}"></button>`).join('');
    const auras = AURAS.map(a =>
      `<button class="av-aura${a===state.avatarAura?' on':''}" onclick="pickAura('${a}')">${a}</button>`).join('')
      + (state.vaultAura
          ? `<button class="av-aura${state.avatarAura==='VAULT AURA'?' on':''}" style="border-color:#14b8a6;color:#5eead4" onclick="pickAura('VAULT AURA')">✦ VAULT AURA</button>`
          : `<button class="av-aura" style="opacity:.5;cursor:help" onclick="alert('Earn the Vault Aura by saving 500 \u{1F48E} in Vault Builder — SaveScape Orbit.')">🔒 VAULT AURA</button>`);

    return `
      <div class="v14-screen av-screen av--${w.color}" style="--av-sel:${sel}">
        <div class="av-bg" style="background-image:url('assets/bgs/bg_avatar_studio.jpeg')"></div>
        <div class="av-scrim"></div>

        <div class="av-topbar">
          <button class="wd-crumb" onclick="goTo('home')">← HOME</button>
          <div class="av-title">AVATAR STUDIO</div>
          <div class="wd-player-pill">
            <div class="av" style="background-image:url('${w.character}')"></div>
            <div><div class="n">${state.playerName}</div><div class="a">${w.archetype}</div></div>
          </div>
        </div>

        <div class="av-grid">
          <!-- LEFT: customization -->
          <div class="av-col av-left">
            <div class="av-panel">
              <div class="av-ph">COLORWAY <span class="av-lock">🔒 ${w.archetype}</span></div>
              <p class="av-hint">Your archetype signature is <b style="color:var(--av-sel)">${sig.name}</b>. Pick your shade — the palette stays locked to your color.</p>
              <div class="av-swatches">${swatches}</div>
            </div>
            <div class="av-panel">
              <div class="av-ph">AURA FX</div>
              <div class="av-auras">${auras}</div>
            </div>
          </div>

          <!-- CENTER: hero preview -->
          <div class="av-stage">
            <div class="av-pedestal"></div>
            <div class="av-hero" id="avHero" style="background-image:url('${w.hero||w.character}')"></div>
            <div class="av-aura-fx" id="avAuraFx"></div>
          </div>

          <!-- RIGHT: identity card -->
          <div class="av-col av-right">
            <div class="av-panel av-idcard">
              <div class="av-idicon">${w.icon}</div>
              <div class="av-idname">${w.archetype.replace('THE ','')}</div>
              <div class="av-idzone">${w.zone}</div>
              <div class="av-idpower">${w.power}</div>
              <div class="av-sigchip"><span class="dot" style="background:var(--av-sel)"></span>SIGNATURE · ${sig.name}</div>
            </div>
            <button class="av-save" onclick="saveAvatar()">SAVE LOOK →</button>
            <button class="av-reswap" onclick="goTo('identity')">CHANGE ARCHETYPE</button>
          </div>
        </div>
      </div>`;
  };

  window.pickColorway = function(i){
    state.avatarColorIdx = i;
    const ramp = colorRamp(state.archetype || 'guardian');
    const c = ramp[i];
    const root = document.querySelector('.av-screen');
    if (root) root.style.setProperty('--av-sel', c);
    document.querySelectorAll('.av-swatch').forEach((el,idx)=>el.classList.toggle('on', idx===i));
    document.querySelectorAll('.av-sigchip .dot').forEach(d=>d.style.background=c);
    document.querySelectorAll('.av-hint b').forEach(b=>b.style.color=c);
  };
  window.pickAura = function(a){
    state.avatarAura = a;
    document.querySelectorAll('.av-aura').forEach(el=>el.classList.toggle('on', el.textContent===a));
    const fx = document.getElementById('avAuraFx');
    if (fx) fx.setAttribute('data-aura', a);
  };
  window.saveAvatar = function(){
    const ramp = colorRamp(state.archetype || 'guardian');
    state.avatarColor = ramp[state.avatarColorIdx] || (SIG[state.archetype]||SIG.guardian).hex;
    document.documentElement.style.setProperty('--player-c', state.avatarColor);
    goTo('home');
  };

  // ───────── HUB EXPERIENCE-FLOW CONTENT (Kabria doc, May 29 2026) ─────────
  const HUBX = {
    strategist:{univ:"THE STRATEGIST'S UNIVERSE",
      desc:'The financial command center. Master budgeting, spending control and the discipline that powers every other hub.',
      verbs:['PLAN','BUDGET','SAVE','TRACK','OPTIMIZE'],tag:'PLAN · OPTIMIZE · WIN',master:'BECOME A MASTER STRATEGIST',
      districts:[['CASHFLOW COMMAND','Income vs expenses balance'],['NEEDS VS WANTS','Prioritization & impulse control'],['BILL MANAGEMENT GRID','Recurring expense mastery'],['EMERGENCY FUND VAULT','Preparedness & crisis survival'],['SMART SPENDING PLAZA','Value-based spending'],['GOAL TRACKER TOWER','Milestone planning'],['EFFICIENCY LAB','Optimization & resource mgmt'],['STRATEGY ARENA','Competitive budgeting battles']],
      daily:['Balance the daily budget','Avoid impulse spending','Complete expense tracker','Reduce unnecessary expenses','Hit savings target'],
      weekly:[['Financial Commander','Stable budget 7 days · no overdraft · all bills paid'],['Efficiency Expert','Cut expenses by target % · max savings ratio'],['Discipline Master','Avoid unnecessary buys · keep streaks']],
      benefits:['Earn Budgetron Credits','Unlock tactical cosmetics','Climb efficiency leaderboards','Level up Strategist Rank','Boost financial power across hubs'],
      ranks:['Budget Rookie','Financial Planner','Strategy Specialist','Efficiency Expert','Stability Commander','Master Strategist']},
    builder:{univ:"THE BUILDER'S UNIVERSE",
      desc:'Silicon-Valley-meets-creator-economy. Build businesses from nothing, generate income and scale your empire.',
      verbs:['IDEATE','BUILD','FUND','SCALE','IMPACT'],tag:'IDEAS TODAY · EMPIRES TOMORROW',master:'BECOME A LEGENDARY ENTREPRENEUR',
      districts:[['IDEA INCUBATOR','Generate & test concepts'],['BRANDING DISTRICT','Identity & marketing'],['PRODUCT DEV LAB','Build & improve products'],['STARTUP STREET','Run & manage businesses'],['INVESTOR PITCH ARENA','Secure funding'],['MARKETING METROPOLIS','Grow your audience'],['SCALING CENTER','Expand & automate'],['FAILURE & RECOVERY','Pivot & rebuild']],
      daily:['Create a product','Design a logo','Open your first storefront','Improve a marketing campaign','Hit a revenue milestone'],
      weekly:[['Startup Founder','Build a profitable business · grow customers'],['Brand Mogul','Dominate ad rankings · high engagement'],['Innovation Titan','Breakthrough product · scale multiple businesses']],
      benefits:['Earn Launch Credits','Unlock founder titles & creator tools','Climb startup leaderboards','Level up Entrepreneur Rank','Unlock advanced business districts'],
      ranks:['Rookie Creator','Startup Builder','Business Strategist','Brand Architect','Innovation Mogul','Legendary Founder']},
    investor:{univ:"THE INVESTOR'S UNIVERSE",
      desc:'A world of markets, assets and opportunities. Grow wealth, build your empire and master long-term thinking.',
      verbs:['INVEST','GROW','ANALYZE','DIVERSIFY','COMPOUND'],tag:'INVEST · GROW · MULTIPLY',master:'BECOME A MASTER INVESTOR',
      districts:[['STOCK MARKET ARENA','Competitive trading & tournaments'],['PORTFOLIO HQ','Diversify & balance assets'],['RESEARCH CORE','Analysis & market reading'],['DIVIDEND DISTRICT','Passive income & compounding'],['ASSET REALM','Own appreciating assets'],['RISK CONTROL CENTER','Defensive investing'],['INVESTOR ACADEMY','Strategy & unlock exams'],['MARKET EVENTS PLAZA','Live tournaments & seasons']],
      daily:['Make 1 investment','Complete a research challenge','Build a starter portfolio','Diversify into 3 asset classes','Earn passive income'],
      weekly:[['Future Mogul','Grow portfolio to target % · keep passive-income streak'],['Market Master','Win 3 competitions · survive volatility'],['Diamond Hands','Hold long-term · resist panic-selling']],
      benefits:['Earn Investopia Tokens','Unlock exclusive cosmetics & titles','Climb global leaderboards','Level up your Investor Rank','Unlock premium districts'],
      ranks:['Rookie Investor','Wealth Builder','Market Strategist','Portfolio Master','Financial Titan','Legendary Investor']},
    guardian:{univ:"THE GUARDIAN'S UNIVERSE",
      desc:'A floating orbital city where every decision strengthens your future. Learn saving, security and protection.',
      verbs:['SAVE','PROTECT','PREPARE','SECURE','GROW'],tag:'PROTECT TODAY · THRIVE TOMORROW',master:'BECOME A FINANCIAL GUARDIAN',
      districts:[['GOAL GALAXY','Goal-based saving constellations'],['EMERGENCY VAULT','Reserve building & survival'],['SAVINGS SATELLITE NET','Automated saving habits'],['SECURITY SHIELD CMD','Fraud defense & protection'],['COMPOUND CONSTELLATION','Growth through consistency'],['FUTURE DREAMS HARBOR','Connect savings to goals'],['RESILIENCE ARENA','Handle setbacks'],['GUARDIAN TEMPLE','Advanced savings mastery']],
      daily:['Save coins toward a goal','Build emergency reserves','Complete a security challenge','Increase savings rate','Automate your savings'],
      weekly:[['Future Ready','Build emergency fund · hit savings milestones'],['Guardian of Wealth','Protect all assets · max protection score'],['Master Saver','Reach major goal · unlock elite vaults']],
      benefits:['Earn SaveScape Crystals','Unlock orbital pets & cosmetics','Climb savings leaderboards','Level up Guardian Rank','Unlock elite vault zones'],
      ranks:['Rookie Saver','Reserve Builder','Security Specialist','Wealth Protector','Financial Guardian','Legendary Keeper']},
    risktaker:{univ:"THE RISK TAKER'S UNIVERSE",
      desc:'Cyberpunk digital frontier. Master risk vs reward, volatility, digital assets and decisions under uncertainty.',
      verbs:['EXPLORE','RISK','ADAPT','PREDICT','MASTER'],tag:'NAVIGATE THE FUTURE · MASTER THE RISK',master:'BECOME A LEGENDARY PIONEER',
      districts:[['CRYPTO CROSSING','Digital currency basics'],['NFT NEXUS','Digital ownership'],['VOLATILITY VORTEX','Risk & market swings'],['BLOCKCHAIN BLVD','Ledgers & verification'],['COINAVERSE MARKET','Virtual economies'],['AI INNOVATION LABS','Emerging tech'],['FUTURE TRENDS CMD','Forecasting'],['RISK MGMT CITADEL','Protection vs volatility']],
      daily:['Complete a blockchain challenge','Collect digital assets','Survive a volatility event','Spot a trend opportunity','Complete an AI challenge'],
      weekly:[['Future Architect','Innovation missions · maintain trend streak'],['Risk Navigator','Survive volatility · manage fluctuations'],['Digital Pioneer','Dominate blockchain · unlock elite districts']],
      benefits:['Earn Bit Credits','Unlock digital companions','Climb innovation leaderboards','Level up Digital Rank','Unlock elite tech districts'],
      ranks:['Data Explorer','Digital Trader','Innovation Specialist','Blockchain Architect','Future Strategist','Legendary Pioneer']},
    rebuilder:{univ:"THE REBUILDER'S UNIVERSE",
      desc:'A city under renovation where broken systems are rebuilt stronger. Recovery, resilience and the comeback.',
      verbs:['RECOVER','REBUILD','RESET','RESTORE','RISE'],tag:'EVERY COMEBACK STARTS HERE',master:'BECOME A COMEBACK LEGEND',
      districts:[['DEBT DISCOVERY','Good vs bad debt'],['PAYMENT PLAN PLAZA','Snowball & avalanche'],['INTEREST IMPACT LAB','How interest compounds'],['REBUILDING STATION','Restore financial health'],['HABIT RESET CENTER','Change harmful behaviors'],['FINANCIAL FITNESS GYM','Train money muscles'],['RESILIENCE HALL','Emotional resilience'],['FREEDOM SQUARE','Celebrate debt-free']],
      daily:['Complete a repayment challenge','Identify debt types','Create a payment strategy','Reduce a debt balance','Improve financial health score'],
      weekly:[['Debt Destroyer','Reduce balances · unlock restoration zones'],['Financial Rebuilder','Improve health · keep recovery streak'],['Comeback Champion','Overcome setbacks · restore districts']],
      benefits:['Earn Recovery Credits','Unlock resilience badges','Climb recovery leaderboards','Level up Recovery Rank','Restore & upgrade city districts'],
      ranks:['Fresh Start','Debt Fighter','Recovery Specialist','Financial Rebuilder','Freedom Architect','Comeback Legend']},
    credtech:{univ:'THE CREDIT NEXUS',
      desc:'The central galaxy of the Coinaverse. Build credit, borrowing power and financial reputation — the trust score that unlocks every other hub.',
      verbs:['BUILD','BORROW','TRUST','REPAY','RISE'],tag:'BUILD TRUST · UNLOCK THE UNIVERSE',master:'BECOME A CREDIT MASTER',
      districts:[['CREDIT CORE','What credit is & how scores work'],['SCORE TOWER','Build & track your Cred Score'],['BORROWING BAY','Responsible borrowing & loans'],['TRUST EXCHANGE','Financial reputation & trust'],['REPAYMENT RUNWAY','On-time payments & history'],['CREDIT LIMIT LAB','Utilization, limits & ratios'],['REPORT OBSERVATORY','Read reports & fix errors'],['REPUTATION ARENA','Competitive credit-building']],
      daily:['Check your Cred Score','Make an on-time payment','Keep utilization low','Complete a credit challenge','Review your credit report'],
      weekly:[['Credit Builder','Raise Cred Score to target · keep on-time streak'],['Trust Master','Keep utilization low · zero missed payments'],['Reputation Titan','Reach a credit tier · unlock premium access']],
      benefits:['Grow your master Cred Score','Unlock premium loans & cross-hub perks','Climb reputation leaderboards','Level up your Credit Rank','Unlock advanced districts across the Coinaverse'],
      ranks:['Credit Rookie','Score Builder','Trust Specialist','Reputation Master','Credit Titan','Legendary Credit Master']},
  };

  // ───────── SCREEN: HUB LANDING (doc-faithful dashboard) ─────────
  function hubRadialMap(w, h){
    if (w.mapImg) return `<div class="hub-map-img" style="background-image:url('${w.mapImg}')"></div>`;
    const N=h.districts.length||8, R=37, cx=50, cy=50;
    let nodes='',lines='';
    for(let i=0;i<N;i++){
      const a=(-90+i*360/N)*Math.PI/180, x=cx+R*Math.cos(a), y=cy+R*Math.sin(a);
      lines+=`<line x1="${cx}%" y1="${cy}%" x2="${x}%" y2="${y}%"/>`;
      nodes+=`<div class="hub-node" style="left:${x}%;top:${y}%"><b>${h.districts[i][0]}</b></div>`;
    }
    return `<video class="hub-map-vid" autoplay loop muted playsinline poster="${sceneBg}"><source src="assets/video/${w.id}_hub.mp4" type="video/mp4"></video>
      <div class="hub-radial"><svg class="hub-svg">${lines}</svg>
      <div class="hub-core"><span>${w.name}</span></div>${nodes}</div>`;
  }

  window.HUBX = HUBX;  // expose for v24 module
  // District detail overlay — Learn keyframe + concept + mini-game + host voice
  window.openDistrict = function(token, i){
    const _DG = { guardian: {0:'vault_game',1:'emergency_game',3:'security_game'} };
    if (_DG[token] && _DG[token][i]) { state.viewingWorld=token; _pendingGame=_DG[token][i]; goTo('lesson'); return; }
    const w = WORLDS[token] || WORLDS.credtech;
    const h = HUBX[token] || HUBX.credtech;
    if (!h || !h.districts || !h.districts[i]) return;
    const d = h.districts[i], nn = String(i+1).padStart(2,'0');
    // host video teaches with its OWN audio — duck bgm, no separate voiceover
    if (window.duckBgmForVideo) duckBgmForVideo(true);
    if (window.markLearned) markLearned(token, i);   // +XP once (P1)
    const ov = document.createElement('div'); ov.id='distOv'; ov.className='dist-ov';
    ov.innerHTML =
      `<div class="dist-card hub--${w.color}">`+
        `<button class="dist-x" onclick="closeDistrict()">✕</button>`+
        `<div class="dist-vidwrap">`+
          `<video class="dist-vid" id="distHostVid" autoplay loop playsinline poster="assets/learn/${token}_d${nn}.jpg"><source src="assets/video/${token}_d${nn}_host.mp4" type="video/mp4"></video>`+
          `<button class="dist-mute" id="distMute" onclick="toggleDistMute()" title="Mute / unmute">🔊</button>`+
        `</div>`+
        `<div class="dist-body">`+
          `<div class="dist-kick">${w.name} · DISTRICT ${nn}</div>`+
          `<h2 class="dist-title">${d[0]}</h2>`+
          `<p class="dist-con">${d[1]}</p>`+
          `<div class="dist-mini">`+
            `<div class="dist-game" style="background-image:url('assets/game/${token}_d${nn}.jpg')"><span>MINI-GAME</span></div>`+
            `<div class="dist-actions">`+
              `<button class="dist-play" onclick="closeDistrict();playDistrictGame('${token}',${i})">▶ PLAY GAME</button>`+
              `<button class="dist-back" onclick="closeDistrict()">← BACK</button>`+
            `</div>`+
          `</div>`+
        `</div>`+
      `</div>`;
    ov.addEventListener('click', e=>{ if(e.target===ov) closeDistrict(); });
    document.body.appendChild(ov);
    // play host video WITH sound (user already gestured by clicking the card)
    const hv = document.getElementById('distHostVid');
    if (window.stopVoice) stopVoice();   // video talks -> kill lab voice
    if (hv){ hv.muted = false; hv.volume = 1;
      hv.play().catch(()=>{ hv.muted = true; hv.play().catch(()=>{}); });  // gesture allows sound; fallback muted
      updateDistMuteIcon(); }
  };
  window.toggleDistMute = function(){ const v=document.getElementById('distHostVid'); if(!v) return; v.muted=!v.muted; if(!v.muted) v.play().catch(()=>{}); updateDistMuteIcon(); };
  window.updateDistMuteIcon = function(){ const v=document.getElementById('distHostVid'), b=document.getElementById('distMute'); if(v&&b) b.textContent = v.muted?'🔇':'🔊'; };
  window.closeDistrict = function(){ const o=document.getElementById('distOv'); if(o){ const v=o.querySelector('video'); if(v) v.pause(); o.remove(); } if(window.duckBgmForVideo) duckBgmForVideo(false); };

  SCREENS.hub = function(){
    const token = state.viewingWorld || state.archetype || 'credtech';
    const w = WORLDS[token] || WORLDS.credtech;
    const h = HUBX[token] || HUBX.credtech;
    const playerW = WORLDS[state.archetype || 'guardian'];
    const _DG = { guardian: {0:1,1:1,3:1} };
    const games = h.pending ? '' : h.districts.map((d,i)=>{
      const nn=String(i+1).padStart(2,'0');
      const isGame = _DG[token] && _DG[token][i];
      return `<div class="hub-gcard${isGame?' is-live':''}" ${isGame?'style="outline:2px solid #14b8a6;outline-offset:-2px;border-radius:14px"':''} onclick="openDistrict('${token}',${i})">`+
        `<img class="gtile" src="assets/game/${token}_d${nn}.jpg" loading="lazy" onerror="this.onerror=null;this.src='assets/tiles/${token}_d${nn}.png'">`+
        `<span class="gplay">${isGame?'▶ PLAY':'▶ LEARN'}</span>`+
        (isGame?`<span style="position:absolute;top:8px;right:8px;font-size:.55rem;font-weight:700;color:#04201e;background:#34d399;padding:3px 7px;border-radius:20px;letter-spacing:.06em;z-index:3">● LIVE</span>`:'')+
        `<div class="gtxt"><span class="gn">${nn}</span><span class="gt">${d[0]}</span><span class="gd">${d[1]}</span></div></div>`;}).join('');
    const daily = h.daily.map((m,i)=>`<div class="hub-mrow"><img class="misic" src="assets/ui/mis_${token}_${i+1}.png" onerror="this.style.display='none'"><span class="chk"></span>${m}</div>`).join('');
    const weekly = h.weekly.map(q=>`<div class="hub-qrow"><div class="qt">${q[0]}</div><div class="qd">${q[1]}</div></div>`).join('');
    const benefits = h.benefits.map(b=>`<div class="hub-brow"><span class="bd"></span>${b}</div>`).join('');
    const ranks = h.ranks.map((r,i)=>`<div class="hub-rank${i===2?' cur':''}"><img class="rankic" src="assets/ui/rank_${token}_t${i+1}.png" onerror="this.style.display='none'"><span class="rn">${String(i+1).padStart(2,'0')}</span>${r}</div>`).join('');
    const verbs = h.verbs.map(v=>`<div class="hub-verb"><i></i>${v}</div>`).join('');
    const pendingBlock = `<div class="hub-pending">⚑ CredTech Galaxy flow was cut off in the PDF — send the full experience flow and I'll populate districts, missions, quests & ranks. Map art is already wired. Archetype + color also need locking.</div>`;

    return `
      <div class="v14-screen hub-screen hub--${w.color}">
        <div class="hub-topbar">
          <button class="wd-crumb" onclick="goTo('home')">← HOME</button>
          <div class="hub-brandline"><span class="cube"></span>COINAVERSE</div>
          <div class="wd-stats">
            <div class="wd-player-pill"><div class="av" style="background-image:url('${playerW.character}')"></div>
              <div><div class="n">${state.playerName}</div><div class="a">${playerW.archetype}</div></div></div>
            <div class="stat-pill"><span class="num">${state.coins}</span><span class="lbl">COINS</span></div>
            <div class="stat-pill"><span class="num">LVL ${state.level}</span><span class="lbl">RANK</span></div>
            <div class="stat-pill"><span class="num">${state.streak}</span><span class="lbl">STREAK</span></div>
          </div>
        </div>

        <div class="hub-hero">
          <div class="hub-info">
            <div class="hub-title">${w.name}</div>
            <div class="hub-univ">${h.univ}</div>
            <p class="hub-desc">${h.desc}</p>
            <div class="hub-verbs">${verbs}</div>
            <div class="hub-tag">${h.tag}</div>
            <button class="hub-enter" onclick="goTo('world_detail')">ENTER ${w.name} →</button>
            ${w.hero?`<img class="hub-herofig" src="${w.hero}" alt="">`:''}
          </div>
          <div class="hub-map">
            <div class="hub-ph">HUB MAP · ${h.tag}</div>
            <div class="hub-map-stage">${hubRadialMap(w,h)}</div>
          </div>
        </div>

        <div class="hub-lower">
          <div class="hub-panel"><div class="hub-ph">Hub Games · Play · Learn · Master</div>
            <div class="hub-games">${h.pending?pendingBlock:games}</div></div>
          <div class="hub-panel"><div class="hub-ph">Daily Missions</div>
            <div class="hub-mlist">${h.pending?'<div class="hub-dim">—</div>':daily}</div>
            <div class="hub-streak">DAILY STREAK · <b>${state.streak} DAYS</b></div></div>
          <div class="hub-panel"><div class="hub-ph">Weekly Quests</div>${h.pending?'<div class="hub-dim">—</div>':weekly}</div>
          <div class="hub-panel"><div class="hub-ph">Hub Benefits</div>
            <div class="hub-blist">${h.pending?'<div class="hub-dim">—</div>':benefits}</div>
            <div class="hub-ph" style="margin-top:12px">Status Ranks</div>
            <div class="hub-ranks">${h.pending?'<div class="hub-dim">—</div>':ranks}</div></div>
        </div>

        <div class="hub-botbar">
          <span class="hub-bb" onclick="goTo('game')"><i></i>PLAY GAMES</span><span class="sep">·</span>
          <span class="hub-bb" onclick="goTo('cinema')"><i></i>LEARN</span><span class="sep">·</span>
          <span class="hub-bb"><i></i>EARN COINS &amp; XP</span><span class="sep">·</span>
          <span class="hub-bb" onclick="goTo('reward_center')"><i></i>LEVEL UP</span><span class="sep">·</span>
          <span class="hub-bb" onclick="goTo('shop')"><i></i>UNLOCK REWARDS</span>
          <span class="hub-master">${h.master}</span>
        </div>
      </div>`;
  };

  SCREENS.central_hub = SCREENS.home;
  SCREENS.world_view = SCREENS.world_detail;
  SCREENS.marketplace = SCREENS.shop;

  // ───────── LEARN → PLAY → MASTER ─────────
  const LESSONS = {
    vault_game:{title:'Goal Galaxy · Saving', poster:'assets/learn/guardian_d01.jpg',
      line:'Every gem you protect becomes power. Pick a goal and watch your vault grow.',
      pts:['Decide your goal before you spend','Needs come before wants','Patience unlocks the biggest reward']},
    emergency_game:{title:'Emergency Vault', poster:'assets/learn/guardian_d02.jpg',
      line:'An emergency fund is your safety net. Keep it sacred — for real emergencies only.',
      pts:['Build a reserve before trouble hits','Never raid the fund for a want','Replenish it after you use it']},
    security_game:{title:'Security Shield · Fraud Defense', poster:'assets/learn/guardian_d04.jpg',
      line:'Scammers use urgency and "too good to be true" offers. A Guardian spots them fast.',
      pts:['Never share passwords or one-time codes','If it is too good to be true, it is a scam','Block the scam — let safe things pass']},
  };
  let _pendingGame = null;
  SCREENS.lesson = function(){
    const g=_pendingGame||'vault_game'; const L=LESSONS[g];
    return `<div class="vlt-wrap"><style>${VAULT_CSS}</style>
      <div class="vlt-bg" style="background-image:url('${L.poster}')"></div>
      <div class="vlt-topbar"><button class="vlt-back" onclick="lessonExit()">← SAVESCAPE ORBIT</button><div class="vlt-title">LEARN → PLAY → MASTER</div></div>
      <div class="vlt-lesson">
        <div style="font-family:'Orbitron',sans-serif;font-size:.62rem;letter-spacing:.2em;color:#14b8a6">STEP 1 · LEARN</div>
        <img class="vlt-lesson-poster" src="${L.poster}" onerror="this.style.display='none'">
        <h1 style="font-family:'Anton','Orbitron',sans-serif;font-size:1.7rem;margin:2px 0;color:#fff">${L.title}</h1>
        <p style="max-width:540px;color:#cdeee7;line-height:1.6;margin:0">🤖 <b style="color:#5eead4">CIRCUIT:</b> ${L.line}</p>
        <div class="vlt-lesson-points">${L.pts.map(p=>`<div>✓ ${p}</div>`).join('')}</div>
        <button class="vlt-btn vlt-btn-go" style="margin-top:6px" onclick="playGame('${g}')">▶ PLAY NOW</button>
        <img class="vlt-lesson-circuit" src="assets/characters/circuit.png" onerror="this.style.display='none'">
      </div></div>`;
  };
  window.lessonExit = function(){ state.viewingWorld='guardian'; goTo('world_detail'); };
  window.learnThenPlay = function(g){ _pendingGame=g; goTo('lesson'); };
  window.playGame = function(g){
    if(g==='vault_game'){ vaultInit(); goTo('vault_game'); }
    else if(g==='emergency_game'){ emgInit(); goTo('emergency_game'); }
    else if(g==='security_game'){ secBegin(); }
  };
  // crystal-fly juice for vault saves
  window.spawnCrystals = function(n){
    const vault=document.querySelector('.vlt-vault'); if(!vault) return;
    n=Math.max(2,Math.min(6,n||4));
    for(let i=0;i<n;i++){
      const c=document.createElement('img'); c.className='fly-crystal'; c.src='assets/game/crystal.png';
      c.onerror=function(){ this.onerror=null; this.replaceWith(Object.assign(document.createElement('div'),{textContent:'💎',className:'fly-crystal'})); };
      c.style.setProperty('--sx',(Math.random()*120-60)+'px'); c.style.animationDelay=(i*0.08)+'s';
      vault.appendChild(c); setTimeout(()=>c.remove(),1100+i*80);
    }
  };

  function boot() {
    const qs = new URLSearchParams(location.search);
    const start = qs.get('screen') || 'splash';
    if (qs.get('arch')) { state.archetype = qs.get('arch'); state.selectedArchetype = qs.get('arch'); }
    goTo(start);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
