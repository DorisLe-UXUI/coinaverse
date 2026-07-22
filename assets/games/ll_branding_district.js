/* ════════════════════════════════════════════════════════════════
   BRANDING DISTRICT · LAUNCH LAB — Brand Identity Match mini-game
   Match logo, color palette, brand voice and target audience for
   each business concept to fill the Brand Recognition Meter.
   Screen ID : game_ll_branding_district
   Hub       : risktaker (#7C3AED)
   ════════════════════════════════════════════════════════════════ */
(function () {
  /* ── palette ──────────────────────────────────────────────────── */
  const ACCENT   = '#7C3AED';
  const LIGHT    = '#A78BFA';
  const PINK     = '#EC4899';
  const GREEN    = '#10B981';
  const GOLD     = '#F59E0B';
  const CYAN     = '#06B6D4';
  const RED      = '#EF4444';
  const DARK_BG  = '#0d0618';
  const CARD_BG  = '#130d26';

  /* ── game config ─────────────────────────────────────────────── */
  const CONFUSION_MAX   = 4;   // wrong picks before the run ends (shared across all 3 levels)
  const COMPLETE_BONUS  = 50;  // points for perfect brand match
  const SPEED_THRESHOLD = 8;   // seconds — fast pick bonus

  /* ── brand database ─────────────────────────────────────────── */
  const BRANDS_L1 = [
    {
      business: 'Toy Company',      icon: '🧸',
      elements: {
        logo:     { correct: 'Fun & Playful',    wrong: ['Bold & Sharp', 'Minimal & Sleek', 'Classic & Formal'] },
        colors:   { correct: 'Bright Rainbow',   wrong: ['Muted Earth Tones', 'Black & White', 'Navy & Gold'] },
        voice:    { correct: 'Playful',           wrong: ['Professional', 'Luxurious', 'Authoritative'] },
        audience: { correct: 'Kids & Families',   wrong: ['Business Executives', 'Seniors', 'Tech Enthusiasts'] },
      },
      lesson: 'Toy brands win with fun logos, bright colours, playful voice and family appeal.',
    },
    {
      business: 'Law Firm',          icon: '⚖️',
      elements: {
        logo:     { correct: 'Classic & Formal',   wrong: ['Fun & Playful', 'Bold & Sharp', 'Retro & Vintage'] },
        colors:   { correct: 'Navy & Gold',         wrong: ['Bright Rainbow', 'Neon Colors', 'Pastel Pink'] },
        voice:    { correct: 'Authoritative',        wrong: ['Playful', 'Trendy', 'Casual & Friendly'] },
        audience: { correct: 'Business & Legal',     wrong: ['Kids & Families', 'Teenagers', 'Gamers'] },
      },
      lesson: 'Law firms build trust through formal imagery, authoritative messaging and professional colours.',
    },
    {
      business: 'Eco Skincare Brand', icon: '🌿',
      elements: {
        logo:     { correct: 'Minimal & Sleek',    wrong: ['Fun & Playful', 'Bold & Sharp', 'Classic & Formal'] },
        colors:   { correct: 'Muted Earth Tones',  wrong: ['Bright Rainbow', 'Navy & Gold', 'Neon Colors'] },
        voice:    { correct: 'Conscious & Calm',   wrong: ['Authoritative', 'Playful', 'Bold & Edgy'] },
        audience: { correct: 'Health-Conscious Adults', wrong: ['Kids & Families', 'Business Executives', 'Gamers'] },
      },
      lesson: 'Eco brands use earth tones, minimal design and calm messaging to attract mindful consumers.',
    },
    {
      business: 'Gaming Studio',     icon: '🎮',
      elements: {
        logo:     { correct: 'Bold & Sharp',       wrong: ['Classic & Formal', 'Minimal & Sleek', 'Fun & Playful'] },
        colors:   { correct: 'Neon Colors',         wrong: ['Muted Earth Tones', 'Navy & Gold', 'Pastel Pink'] },
        voice:    { correct: 'Bold & Edgy',         wrong: ['Authoritative', 'Conscious & Calm', 'Luxurious'] },
        audience: { correct: 'Gamers & Gen Z',      wrong: ['Seniors', 'Business Executives', 'Kids Under 5'] },
      },
      lesson: 'Gaming brands punch hard with neon colours, bold logos and edgy language aimed at Gen Z.',
    },
    {
      business: 'Luxury Jeweller',   icon: '💎',
      elements: {
        logo:     { correct: 'Elegant Serif',      wrong: ['Bold & Sharp', 'Fun & Playful', 'Retro & Vintage'] },
        colors:   { correct: 'Black & Gold',        wrong: ['Bright Rainbow', 'Neon Colors', 'Muted Earth Tones'] },
        voice:    { correct: 'Luxurious',           wrong: ['Playful', 'Bold & Edgy', 'Casual & Friendly'] },
        audience: { correct: 'Affluent Adults',     wrong: ['Kids & Families', 'Teenagers', 'Gamers'] },
      },
      lesson: 'Luxury brands whisper, not shout — elegance, black-and-gold palettes and aspirational language.',
    },
  ];

  const BRANDS_L2 = [
    {
      business: 'Fitness App',       icon: '💪',
      elements: {
        logo:     { correct: 'Bold & Sharp',           wrong: ['Elegant Serif', 'Fun & Playful', 'Classic & Formal'] },
        colors:   { correct: 'Electric Blue & Orange', wrong: ['Pastel Pink', 'Muted Earth Tones', 'Black & Gold'] },
        voice:    { correct: 'Motivational',            wrong: ['Luxurious', 'Conscious & Calm', 'Authoritative'] },
        audience: { correct: 'Active Millennials',      wrong: ['Seniors', 'Business Executives', 'Kids Under 5'] },
        mascot:   { correct: 'Athlete Character',       wrong: ['Wise Owl', 'Cute Animal', 'Robot Bot'] },
        font:     { correct: 'Heavy Sans-Serif',        wrong: ['Thin Italic Serif', 'Handwritten Script', 'Classic Roman'] },
        social:   { correct: 'Before/After + Challenges', wrong: ['Educational Infographics', 'Meme Humour', 'Corporate Case Studies'] },
      },
      lesson: 'Fitness brands ignite motivation — bold fonts, energetic palettes and transformation stories.',
    },
    {
      business: 'Kids\' Food Brand',  icon: '🥕',
      elements: {
        logo:     { correct: 'Fun & Playful',           wrong: ['Elegant Serif', 'Bold & Sharp', 'Classic & Formal'] },
        colors:   { correct: 'Bright Rainbow',           wrong: ['Black & Gold', 'Neon Colors', 'Muted Earth Tones'] },
        voice:    { correct: 'Playful',                  wrong: ['Authoritative', 'Luxurious', 'Motivational'] },
        audience: { correct: 'Kids & Families',          wrong: ['Gamers & Gen Z', 'Business Executives', 'Affluent Adults'] },
        mascot:   { correct: 'Cute Animal',              wrong: ['Athlete Character', 'Robot Bot', 'Corporate Person'] },
        font:     { correct: 'Rounded Friendly',         wrong: ['Heavy Sans-Serif', 'Classic Roman', 'Thin Italic Serif'] },
        social:   { correct: 'Fun Recipes + Parent Tips', wrong: ['Meme Humour', 'Corporate Case Studies', 'Lifestyle Aesthetic'] },
      },
      lesson: 'Kids\' brands use joyful characters, rounded fonts and parent-friendly content to build loyalty.',
    },
    {
      business: 'Fintech Startup',   icon: '💳',
      elements: {
        logo:     { correct: 'Minimal & Sleek',          wrong: ['Fun & Playful', 'Elegant Serif', 'Retro & Vintage'] },
        colors:   { correct: 'Deep Navy & Teal',         wrong: ['Bright Rainbow', 'Pastel Pink', 'Black & Gold'] },
        voice:    { correct: 'Smart & Trustworthy',      wrong: ['Playful', 'Bold & Edgy', 'Luxurious'] },
        audience: { correct: 'Young Professionals',      wrong: ['Kids & Families', 'Seniors', 'Gamers & Gen Z'] },
        mascot:   { correct: 'Robot Bot',                wrong: ['Cute Animal', 'Athlete Character', 'Wise Owl'] },
        font:     { correct: 'Clean Geometric Sans',     wrong: ['Handwritten Script', 'Heavy Sans-Serif', 'Classic Roman'] },
        social:   { correct: 'Educational Infographics', wrong: ['Meme Humour', 'Before/After + Challenges', 'Lifestyle Aesthetic'] },
      },
      lesson: 'Fintech earns trust through clarity — clean design, honest language and educational content.',
    },
    {
      business: 'Retro Diner',       icon: '🍔',
      elements: {
        logo:     { correct: 'Retro & Vintage',          wrong: ['Minimal & Sleek', 'Bold & Sharp', 'Elegant Serif'] },
        colors:   { correct: 'Red & Cream',              wrong: ['Neon Colors', 'Muted Earth Tones', 'Deep Navy & Teal'] },
        voice:    { correct: 'Casual & Friendly',        wrong: ['Authoritative', 'Luxurious', 'Smart & Trustworthy'] },
        audience: { correct: 'Nostalgia Seekers',        wrong: ['Tech Enthusiasts', 'Business Executives', 'Kids Under 5'] },
        mascot:   { correct: 'Classic Cartoon Chef',     wrong: ['Robot Bot', 'Athlete Character', 'Wise Owl'] },
        font:     { correct: 'Slab Serif',               wrong: ['Clean Geometric Sans', 'Heavy Sans-Serif', 'Thin Italic Serif'] },
        social:   { correct: 'Throwback Stories + Food Pics', wrong: ['Educational Infographics', 'Before/After', 'Corporate Case Studies'] },
      },
      lesson: 'Nostalgia branding taps emotion — retro fonts, vintage palettes and feel-good storytelling.',
    },
    {
      business: 'Beauty Influencer Brand', icon: '💄',
      elements: {
        logo:     { correct: 'Elegant Serif',            wrong: ['Bold & Sharp', 'Fun & Playful', 'Classic & Formal'] },
        colors:   { correct: 'Pastel Pink & Rose Gold',  wrong: ['Navy & Gold', 'Neon Colors', 'Electric Blue & Orange'] },
        voice:    { correct: 'Aspirational & Warm',      wrong: ['Authoritative', 'Bold & Edgy', 'Conscious & Calm'] },
        audience: { correct: 'Gen Z & Millennial Women', wrong: ['Business Executives', 'Kids & Families', 'Seniors'] },
        mascot:   { correct: 'Glam Avatar',              wrong: ['Robot Bot', 'Classic Cartoon Chef', 'Athlete Character'] },
        font:     { correct: 'Thin Italic Serif',        wrong: ['Heavy Sans-Serif', 'Rounded Friendly', 'Slab Serif'] },
        social:   { correct: 'Lifestyle Aesthetic + Tutorials', wrong: ['Educational Infographics', 'Meme Humour', 'Before/After Challenges'] },
      },
      lesson: 'Beauty brands sell aspiration — elegant type, soft palettes and authentic lifestyle content.',
    },
  ];

  const BRANDS_L3 = [
    {
      business: 'Space Camp for Kids', icon: '🚀',
      elements: {
        logo:     { correct: 'Futuristic Rocket',              wrong: ['Classic & Formal', 'Elegant Serif', 'Retro & Vintage'] },
        colors:   { correct: 'Galaxy Purple & Silver',         wrong: ['Muted Earth Tones', 'Red & Cream', 'Black & Gold'] },
        voice:    { correct: 'Curious & Exciting',             wrong: ['Luxurious', 'Authoritative', 'Smart & Trustworthy'] },
        audience: { correct: 'Curious Kids & Parents',         wrong: ['Business Executives', 'Seniors', 'Affluent Adults'] },
        mascot:   { correct: 'Astro Pup',                      wrong: ['Corporate Person', 'Glam Avatar', 'Classic Cartoon Chef'] },
        font:     { correct: 'Futuristic Display',             wrong: ['Thin Italic Serif', 'Classic Roman', 'Slab Serif'] },
        social:   { correct: 'Rocket Builds + Science Facts',  wrong: ['Corporate Case Studies', 'Lifestyle Aesthetic', 'Meme Humour'] },
      },
      lesson: 'Adventure brands spark curiosity — discovery content keeps young explorers (and paying parents) coming back.',
    },
    {
      business: 'Pet-Sitting Service', icon: '🐶',
      elements: {
        logo:     { correct: 'Friendly Paw Print',             wrong: ['Bold & Sharp', 'Elegant Serif', 'Minimal & Sleek'] },
        colors:   { correct: 'Warm Orange & Sky Blue',         wrong: ['Black & Gold', 'Neon Colors', 'Deep Navy & Teal'] },
        voice:    { correct: 'Caring & Dependable',            wrong: ['Bold & Edgy', 'Luxurious', 'Motivational'] },
        audience: { correct: 'Busy Pet Owners',                wrong: ['Gamers & Gen Z', 'Kids Under 5', 'Business & Legal'] },
        mascot:   { correct: 'Happy Golden Retriever',         wrong: ['Robot Bot', 'Glam Avatar', 'Athlete Character'] },
        font:     { correct: 'Rounded Friendly',               wrong: ['Thin Italic Serif', 'Heavy Sans-Serif', 'Classic Roman'] },
        social:   { correct: 'Happy Pet Updates + Care Tips',  wrong: ['Meme Humour', 'Corporate Case Studies', 'Before/After Challenges'] },
      },
      lesson: 'Service brands sell trust — customers pay for peace of mind, so every message must feel caring and reliable.',
    },
    {
      business: 'Smoothie Stand', icon: '🥤',
      elements: {
        logo:     { correct: 'Fresh Fruit Splash',             wrong: ['Classic & Formal', 'Retro & Vintage', 'Elegant Serif'] },
        colors:   { correct: 'Tropical Green & Mango',         wrong: ['Black & Gold', 'Navy & Gold', 'Pastel Pink & Rose Gold'] },
        voice:    { correct: 'Fresh & Upbeat',                 wrong: ['Authoritative', 'Luxurious', 'Conscious & Calm'] },
        audience: { correct: 'Health-Minded Snackers',         wrong: ['Business Executives', 'Nostalgia Seekers', 'Kids Under 5'] },
        mascot:   { correct: 'Smiling Strawberry',             wrong: ['Wise Owl', 'Robot Bot', 'Corporate Person'] },
        font:     { correct: 'Juicy Rounded Bold',             wrong: ['Classic Roman', 'Thin Italic Serif', 'Slab Serif'] },
        social:   { correct: 'Recipe Reels + Fruit Facts',     wrong: ['Corporate Case Studies', 'Educational Infographics', 'Throwback Stories'] },
      },
      lesson: 'Food brands win with appetite appeal — bright colours and fresh energy turn passers-by into repeat buyers.',
    },
    {
      business: 'Board Game Cafe', icon: '🎲',
      elements: {
        logo:     { correct: 'Playful Dice & Meeple',          wrong: ['Minimal & Sleek', 'Elegant Serif', 'Bold & Sharp'] },
        colors:   { correct: 'Cozy Red & Warm Wood',           wrong: ['Neon Colors', 'Deep Navy & Teal', 'Galaxy Purple & Silver'] },
        voice:    { correct: 'Welcoming & Fun',                wrong: ['Authoritative', 'Luxurious', 'Smart & Trustworthy'] },
        audience: { correct: 'Friends & Families',             wrong: ['Business Executives', 'Seniors Only', 'Affluent Adults'] },
        mascot:   { correct: 'Cheerful Game Master',           wrong: ['Robot Bot', 'Glam Avatar', 'Athlete Character'] },
        font:     { correct: 'Chunky Game-Box Letters',        wrong: ['Thin Italic Serif', 'Clean Geometric Sans', 'Classic Roman'] },
        social:   { correct: 'Game Nights + Tournament Invites', wrong: ['Corporate Case Studies', 'Before/After Challenges', 'Lifestyle Aesthetic'] },
      },
      lesson: 'Experience brands sell togetherness — a warm, playful identity fills tables again and again.',
    },
    {
      business: 'Kids Coding Club', icon: '💻',
      elements: {
        logo:     { correct: 'Pixel Robot Badge',              wrong: ['Elegant Serif', 'Retro & Vintage', 'Classic & Formal'] },
        colors:   { correct: 'Electric Teal & Pixel Purple',   wrong: ['Red & Cream', 'Muted Earth Tones', 'Black & Gold'] },
        voice:    { correct: 'Encouraging & Clever',           wrong: ['Luxurious', 'Bold & Edgy', 'Casual & Friendly'] },
        audience: { correct: 'Young Creators & Parents',       wrong: ['Seniors', 'Business & Legal', 'Nostalgia Seekers'] },
        mascot:   { correct: 'Friendly Code-Bot',              wrong: ['Classic Cartoon Chef', 'Glam Avatar', 'Cute Animal'] },
        font:     { correct: 'Clean Geometric Sans',           wrong: ['Slab Serif', 'Thin Italic Serif', 'Handwritten Script'] },
        social:   { correct: 'Student Demos + Coding Tips',    wrong: ['Meme Humour', 'Lifestyle Aesthetic', 'Throwback Stories'] },
      },
      lesson: 'Education brands must convince two audiences at once — excite the kids AND reassure the parents who pay.',
    },
  ];

  /* ── 3-level ladder: brand set + time budget for each level ───── */
  const LEVELS = [
    { n: 1, name: 'LEARN',  time: 90,  brands: BRANDS_L1 },
    { n: 2, name: 'MASTER', time: 120, brands: BRANDS_L2 },
    { n: 3, name: 'LEGEND', time: 100, brands: BRANDS_L3 },
  ];

  const TREND_CARDS = [
    { text: '🔥 Viral Trend: "Silent Luxury" — understated branding is trending! Minimal scores +20 bonus!', bonus: 'Minimal & Sleek', bonusPts: 20 },
    { text: '🌍 Cultural Moment: Eco-conscious going mainstream! Earth tones score +20 today!', bonus: 'Muted Earth Tones', bonusPts: 20 },
    { text: '⚡ Gen Z Culture Drop: Bold neon and edgy voice are viral right now! +20 for edgy picks!', bonus: 'Neon Colors', bonusPts: 20 },
    { text: '💫 Nostalgia Wave: Retro aesthetics are everywhere. Vintage picks earn +20!', bonus: 'Retro & Vintage', bonusPts: 20 },
    { text: '🤖 Tech Boom: Clean geometric and smart branding dominating feeds! +20 bonus!', bonus: 'Clean Geometric Sans', bonusPts: 20 },
  ];

  /* ── state ────────────────────────────────────────────────────── */
  let G = null;

  /* ── screen registration ─────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_ll_branding_district = function () {
    G = null;
    setTimeout(initGame, 40);
    return `
<div id="bd_root" style="position:absolute;inset:0;background:radial-gradient(130% 95% at 50% -8%, ${ACCENT}26, ${DARK_BG} 46%, #05020e 100%);overflow:hidden;font-family:Inter,sans-serif;color:#fff">

  <style>
    /* Cyber-Premium Gaming HUD scanline overlay — same recipe as arcade.js .arc-wrap::after,
       layered above the city canvas so the whole screen reads as one visual system */
    #bd_root::after { content:''; position:absolute; inset:0; z-index:16; pointer-events:none; background:linear-gradient(rgba(124,58,237,0) 50%,rgba(124,58,237,.025) 50%); background-size:100% 4px; }
    @keyframes bd_pop_correct { 0%{transform:scale(1)} 35%{transform:scale(1.06)} 100%{transform:scale(1)} }
    @keyframes bd_shake_wrong { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
    @keyframes bd_float_up { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,-140%) scale(1.25)} }
    @keyframes bd_burst_particle { 0%{opacity:1;transform:translate(-50%,-50%) scale(.4)} 100%{opacity:0;transform:translate(calc(-50% + var(--px)),calc(-50% + var(--py))) scale(1)} }
    @keyframes bd_streak_banner { 0%{opacity:0;transform:translate(-50%,-40%) scale(.8)} 18%{opacity:1;transform:translate(-50%,-50%) scale(1.08)} 78%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,-60%) scale(.92)} }
    @keyframes bd_confetti_fall { 0%{transform:translateY(-30px) rotate(0deg);opacity:1} 100%{transform:translateY(480px) rotate(360deg);opacity:0} }
    @keyframes bd_win_shine { to{ background-position:-20% 0; } }
    .bd-winshine::before{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.16) 48%,transparent 66%);background-size:220% 100%;background-position:120% 0;animation:bd_win_shine 2.2s ease-in-out .3s 1;pointer-events:none;border-radius:inherit}
  </style>

  <!-- city backdrop canvas -->
  <canvas id="bd_city" style="position:absolute;inset:0;width:100%;height:100%;opacity:.6"></canvas>
  <!-- ambient overlay: twinkling stars + pulsing billboard glow (keeps the static city art alive) -->
  <canvas id="bd_city_fx" style="position:absolute;inset:0;width:100%;height:100%;opacity:.6;pointer-events:none"></canvas>

  <!-- gradient overlays -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 100%,rgba(124,58,237,.18) 0%,transparent 70%);pointer-events:none"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:45%;background:linear-gradient(to top,${DARK_BG} 30%,transparent);pointer-events:none"></div>

  <!-- TOP BAR -->
  <div id="bd_topbar" style="
    position:absolute;top:0;left:0;right:0;z-index:20;
    display:flex;align-items:center;gap:10px;
    padding:10px 14px;
    background:linear-gradient(180deg,rgba(2,0,10,.92) 0%,transparent 100%);
    border-bottom:1px solid rgba(124,58,237,.25);
  ">
    <button id="bd_back" onclick="window.ll_branding_districtExit()" style="
      padding:6px 12px;border:1px solid rgba(124,58,237,.45);border-radius:8px;
      background:rgba(124,58,237,.12);color:${LIGHT};
      font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.15em;cursor:pointer;
      transition:background .15s;white-space:nowrap;
    " onmouseover="this.style.background='rgba(124,58,237,.28)'" onmouseout="this.style.background='rgba(124,58,237,.12)'">← HUB</button>

    <div style="font-family:Orbitron,sans-serif;font-size:.72rem;letter-spacing:.18em;color:${LIGHT};flex:1;text-align:center;text-shadow:0 0 14px ${ACCENT}cc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
      BRANDING DISTRICT
    </div>

    <div style="display:flex;gap:12px;align-items:center;flex-shrink:0">
      <button onclick="bdShowHelp()" title="How to play" style="padding:6px 10px;border:1px solid rgba(124,58,237,.45);border-radius:8px;background:rgba(124,58,237,.12);color:${LIGHT};cursor:pointer;font-size:.8rem;flex-shrink:0">❓</button>
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:#888;letter-spacing:.1em">SCORE</div>
        <div id="bd_score" style="font-family:Orbitron,sans-serif;font-size:.82rem;color:${GOLD};text-shadow:0 0 8px ${GOLD}88;font-variant-numeric:tabular-nums">0</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:#888;letter-spacing:.1em">TIME</div>
        <div id="bd_timer" style="font-family:Orbitron,sans-serif;font-size:.82rem;color:${CYAN};text-shadow:0 0 8px ${CYAN}88;font-variant-numeric:tabular-nums">90</div>
      </div>
    </div>
  </div>

  <!-- METERS BAR -->
  <div style="position:absolute;top:52px;left:0;right:0;z-index:18;padding:6px 14px;display:flex;gap:10px;align-items:center">
    <div style="flex:1">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px">
        <span style="font-family:Orbitron,sans-serif;font-size:.48rem;letter-spacing:.12em;color:${GREEN}">BRAND RECOGNITION</span>
        <span id="bd_recog_pct" style="font-family:Orbitron,sans-serif;font-size:.48rem;color:${GREEN}">0%</span>
      </div>
      <div style="height:7px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;border:1px solid rgba(16,185,129,.2)">
        <div id="bd_recog_bar" style="height:100%;width:0%;background:linear-gradient(90deg,${ACCENT},${GREEN});border-radius:4px;transition:width .4s ease"></div>
      </div>
    </div>
    <div style="width:1px;height:28px;background:rgba(255,255,255,.1)"></div>
    <div style="flex:0 0 130px">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px">
        <span style="font-family:Orbitron,sans-serif;font-size:.48rem;letter-spacing:.12em;color:${RED}">CONFUSION</span>
        <span id="bd_conf_count" style="font-family:Orbitron,sans-serif;font-size:.48rem;color:${RED}">0/${CONFUSION_MAX}</span>
      </div>
      <div style="height:7px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;border:1px solid rgba(239,68,68,.2)">
        <div id="bd_conf_bar" style="height:100%;width:0%;background:linear-gradient(90deg,${PINK},${RED});border-radius:4px;transition:width .4s ease"></div>
      </div>
    </div>
    <div id="bd_level_badge" style="
      flex-shrink:0;
      font-family:Orbitron,sans-serif;font-size:.48rem;letter-spacing:.12em;
      padding:3px 9px;border-radius:20px;
      border:1px solid rgba(124,58,237,.5);
      background:rgba(124,58,237,.12);
      color:${LIGHT};white-space:nowrap;
    ">LV 1 · LEARN</div>
  </div>

  <!-- MAIN GAME AREA -->
  <div id="bd_game" style="position:absolute;top:96px;left:0;right:0;bottom:0;z-index:10;overflow-y:auto;padding:10px 14px 20px;box-sizing:border-box"></div>

  <!-- TREND BANNER -->
  <div id="bd_trend" style="display:none;position:absolute;top:98px;left:0;right:0;z-index:30;
    padding:10px 16px;
    background:linear-gradient(135deg,rgba(124,58,237,.95),rgba(236,72,153,.85));
    border-bottom:1px solid ${PINK};
    font-size:.78rem;font-weight:600;text-align:center;
    text-shadow:0 1px 4px rgba(0,0,0,.5);
    cursor:pointer;
  " onclick="window._bd_dismissTrend && window._bd_dismissTrend()"></div>

  <!-- FEEDBACK TOAST -->
  <div id="bd_toast" style="
    display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:50;
    padding:16px 28px;border-radius:14px;text-align:center;pointer-events:none;
    font-family:Orbitron,sans-serif;font-size:1rem;letter-spacing:.1em;
    box-shadow:0 0 40px rgba(0,0,0,.6);
  "></div>

  <!-- HOW TO PLAY overlay (shown once at start, reopened via ❓) -->
  <div id="bd_help" style="display:none;position:absolute;inset:0;z-index:90;align-items:center;justify-content:center;background:rgba(2,0,10,.92);backdrop-filter:blur(6px);padding:20px;box-sizing:border-box"></div>

</div>`;
  };

  /* ── exit ─────────────────────────────────────────────────────── */
  /* ── QA debug hook ─────────────────────────────────────────── */
  window._bdDbg = function () { return G ? { level: G.level, queueLen: G.brandQueue.length, timeLeft: G.timeLeft, done: G.done, paused: G.paused, pickStartTime: G.pickStartTime } : null; };
  window._bdDrain = function () { if (G) { G.brandQueue = []; nextBrand(); } };
  window._bdWin = function (score) { if (!G) return; G.score = score; G.done = false; endGame(); };

  window.ll_branding_districtExit = function () {
    if (G) {
      clearInterval(G.timerInterval);
      if (G.trendTimer) clearTimeout(G.trendTimer);
    }
    G = null;
    stopAmbientCity();
    // Builder/Launch Lab hub id is 'builder' (WORLDS.builder) — this game is
    // reached from the Builder hub's Mini-Games grid, NOT risktaker.
    if (window.state) state.viewingWorld = 'builder';
    goTo('hub');
  };

  /* ── city canvas backdrop ─────────────────────────────────────── */
  function drawCity() {
    const canvas = document.getElementById('bd_city');
    if (!canvas) return;
    const W = canvas.offsetWidth; const H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050010');
    sky.addColorStop(.6, '#0d0618');
    sky.addColorStop(1, '#180830');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // stars
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * W; const y = Math.random() * H * .65;
      const r = Math.random() * 1.2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${.3 + Math.random() * .5})`;
      ctx.fill();
    }

    // buildings silhouette
    const buildings = [
      [0, .45, .08, .45], [.07, .32, .06, .55], [.12, .4, .05, .4],
      [.16, .25, .09, .6], [.24, .38, .07, .45], [.30, .2, .08, .7],
      [.37, .35, .06, .45], [.42, .28, .1, .58], [.51, .4, .07, .38],
      [.57, .22, .09, .68], [.65, .36, .06, .42], [.70, .3, .11, .52],
      [.80, .38, .07, .44], [.86, .25, .08, .6], [.93, .4, .07, .42],
    ];
    buildings.forEach(([x, y, w, h]) => {
      const bx = x * W; const by = y * H; const bw = w * W; const bh = h * H;
      // building body
      const bg = ctx.createLinearGradient(bx, by, bx, by + bh);
      bg.addColorStop(0, '#1a0a3a');
      bg.addColorStop(1, '#0a0520');
      ctx.fillStyle = bg;
      ctx.fillRect(bx, by, bw, bh);

      // windows
      const cols = Math.floor(bw / 9);
      const rows = Math.floor(bh / 12);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > .45) {
            const wx = bx + 3 + c * 9; const wy = by + 5 + r * 12;
            const hue = Math.random() > .6 ? ACCENT : (Math.random() > .5 ? CYAN : LIGHT);
            ctx.fillStyle = hue + '55';
            ctx.fillRect(wx, wy, 5, 7);
          }
        }
      }
      // rooftop glow
      ctx.fillStyle = (Math.random() > .5 ? ACCENT : PINK) + '44';
      ctx.fillRect(bx, by, bw, 3);
    });

    // neon ground strip
    const grd = ctx.createLinearGradient(0, H * .88, 0, H);
    grd.addColorStop(0, 'rgba(124,58,237,.35)');
    grd.addColorStop(1, 'rgba(124,58,237,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, H * .88, W, H * .12);

    // holographic billboards
    const billboards = [
      { x: .15, y: .18, w: .12, h: .08, text: 'BRAND POWER', color: PINK },
      { x: .55, y: .15, w: .14, h: .07, text: 'GO VIRAL', color: CYAN },
      { x: .78, y: .2, w: .11, h: .08, text: 'TARGET ADS', color: GOLD },
    ];
    billboards.forEach(b => {
      const bx = b.x * W; const by = b.y * H; const bw = b.w * W; const bh = b.h * H;
      ctx.strokeStyle = b.color + '88'; ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = b.color + '15'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = b.color + 'cc';
      ctx.font = `bold ${bh * .32}px Orbitron,sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.text, bx + bw / 2, by + bh / 2);
    });

    // cache billboard rects for the ambient overlay pass (avoids recompute every frame)
    G_cityBillboards = billboards.map(b => ({ x: b.x * W, y: b.y * H, w: b.w * W, h: b.h * H, color: b.color }));
    G_cityStars = [];
    for (let i = 0; i < 70; i++) {
      G_cityStars.push({ x: Math.random() * W, y: Math.random() * H * .65, r: Math.random() * 1.1 + .3, phase: Math.random() * Math.PI * 2, speed: .8 + Math.random() * 1.4 });
    }
  }

  /* ── ambient overlay: twinkling stars + pulsing billboard glow ───
     Cheap per-frame pass on a SEPARATE small canvas layered above the
     static city art — avoids re-running the expensive building/window
     draw every frame. Fills the otherwise-static backdrop with subtle
     life instead of a frozen screenshot behind the whole game. ── */
  let G_cityBillboards = [];
  let G_cityStars = [];
  let _bdAmbientRaf = null;
  function startAmbientCity() {
    const canvas = document.getElementById('bd_city_fx');
    if (!canvas) return;
    const back = document.getElementById('bd_city');
    const W = back ? back.offsetWidth : canvas.offsetWidth;
    const H = back ? back.offsetHeight : canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    let t0 = performance.now();

    function frame(now) {
      _bdAmbientRaf = requestAnimationFrame(frame);
      if (!G || G.done) return;
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      // twinkling stars — gentle opacity oscillation, no movement (cheap, non-distracting)
      G_cityStars.forEach(s => {
        const tw = .35 + .45 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${tw})`;
        ctx.fill();
      });

      // billboard glow pulse — reinforces the "living city" feel behind the game
      G_cityBillboards.forEach((b, i) => {
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 + i * 2.1);
        ctx.strokeStyle = b.color + Math.round(90 + pulse * 100).toString(16).padStart(2, '0');
        ctx.lineWidth = 1.5 + pulse * 1.2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      });
    }
    _bdAmbientRaf = requestAnimationFrame(frame);
  }
  function stopAmbientCity() {
    if (_bdAmbientRaf) { cancelAnimationFrame(_bdAmbientRaf); _bdAmbientRaf = null; }
  }

  /* ── init game ────────────────────────────────────────────────── */
  function initGame() {
    drawCity();
    startAmbientCity();

    G = {
      level: 1,
      score: 0,
      confusion: 0,
      recognition: 0,
      totalBrands: 0,
      brandsDone: 0,
      streak: 0,        // consecutive correct picks — purely cosmetic, never affects score/goal math
      timeLeft: LEVELS[0].time,
      timerInterval: null,
      trendTimer: null,
      pickStartTime: 0,
      activeTrend: null,
      trendActive: false,
      brandQueue: [],
      currentBrand: null,
      currentStep: 0,    // which element are we picking?
      stepKeys: [],       // element keys for current brand
      picks: {},          // user picks for current brand
      done: false,
      paused: false,      // true while the ❓ help overlay is open
      introShown: false,  // becomes true once the first-time tutorial is dismissed
    };

    // build queue
    G.brandQueue = shuffle([...LEVELS[0].brands]);
    G.totalBrands = G.brandQueue.length;

    // Tutorial shown once before the timer/queue actually start moving
    showHowToPlay();
  }

  /* ── how-to-play intro (shown once at start) + ❓ re-open mid-game ── */
  let _bdPauseStartTs = null;
  function showHowToPlay() {
    const help = document.getElementById('bd_help');
    if (!help) return;
    const firstTime = !G.introShown;
    help.style.display = 'flex';
    help.innerHTML = `
      <div style="max-width:380px;width:100%;text-align:center;padding:26px 22px;background:${CARD_BG};border:1px solid rgba(124,58,237,.5);border-radius:20px;box-shadow:0 0 50px rgba(124,58,237,.3)">
        <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.2em;color:${LIGHT};margin-bottom:10px">HOW TO PLAY</div>
        <div style="font-size:2rem;margin-bottom:8px">🏙️</div>
        <div style="font-family:Orbitron,sans-serif;font-size:1rem;margin-bottom:14px;color:#fff">BRANDING DISTRICT</div>
        <ul style="text-align:left;font-size:.78rem;color:#ddd;line-height:1.65;margin:0 0 18px;padding-left:18px">
          <li>Each round shows a business — tap the option that best matches its logo, colors, voice, or audience.</li>
          <li>Pick fast for a speed bonus, and match every element to earn the full brand bonus.</li>
          <li>Watch the CONFUSION meter — too many mismatches ends the round early.</li>
          <li>3 rounds get tougher and add more elements to match, plus surprise trend cards for bonus points.</li>
          <li>Fill the BRAND RECOGNITION meter for a higher star rating and more coins.</li>
        </ul>
        <button id="bd_help_btn" style="padding:13px 30px;border:none;border-radius:11px;background:linear-gradient(135deg,${ACCENT},${PINK});color:#fff;font-family:Orbitron,sans-serif;font-size:.68rem;letter-spacing:.12em;font-weight:900;cursor:pointer">${firstTime ? 'GOT IT — START ▶' : '▶ RESUME'}</button>
      </div>`;
    const btn = document.getElementById('bd_help_btn');
    if (btn) btn.onclick = () => {
      help.style.display = 'none';
      if (firstTime) {
        G.introShown = true;
        G.timerInterval = setInterval(tickTimer, 1000);
        nextBrand();
      } else if (G.paused) {
        // shift pickStartTime forward by the paused duration so the speed
        // bonus on the in-flight pick isn't punished for time spent reading help
        if (_bdPauseStartTs) {
          const pausedMs = Date.now() - _bdPauseStartTs;
          G.pickStartTime += pausedMs;
          _bdPauseStartTs = null;
        }
        G.paused = false;
        G.timerInterval = setInterval(tickTimer, 1000);
      }
    };
  }
  window.bdShowHelp = function () {
    if (!G || G.done || G.paused) return;
    G.paused = true;
    _bdPauseStartTs = Date.now();
    if (G.timerInterval) { clearInterval(G.timerInterval); G.timerInterval = null; }
    showHowToPlay();
  };

  /* ── timer ────────────────────────────────────────────────────── */
  function tickTimer() {
    if (!G || G.done || G.paused) return;
    G.timeLeft--;
    const el = document.getElementById('bd_timer');
    if (el) {
      el.textContent = G.timeLeft;
      el.style.color = G.timeLeft <= 10 ? RED : CYAN;
    }
    if (G.timeLeft <= 0) endGame();
  }

  /* ── brand flow ───────────────────────────────────────────────── */
  function nextBrand() {
    if (!G || G.done) return;

    // check level advance (1→2→3, same continuous session — confusion count carries over)
    if (G.level < 3 && G.brandQueue.length === 0) {
      G.level++;
      const lv = LEVELS[G.level - 1];
      G.brandQueue = shuffle([...lv.brands]);
      G.totalBrands += G.brandQueue.length;
      G.timeLeft = lv.time;
      const badge = document.getElementById('bd_level_badge');
      if (badge) badge.textContent = 'LV ' + lv.n + ' · ' + lv.name;
      showToast('LEVEL ' + lv.n + ' UNLOCKED!', ACCENT, 1800);
      // maybe show trend card
      if (Math.random() > .4) scheduleTrendCard();
    }

    if (G.brandQueue.length === 0) {
      // all brands done
      setTimeout(endGame, 400);
      return;
    }

    G.currentBrand = G.brandQueue.shift();
    G.stepKeys = Object.keys(G.currentBrand.elements);
    G.currentStep = 0;
    G.picks = {};
    G.pickStartTime = Date.now();
    G.brandsDone++;
    renderBrand();
  }

  /* ── render brand challenge ───────────────────────────────────── */
  function renderBrand() {
    const area = document.getElementById('bd_game');
    if (!area || !G || !G.currentBrand) return;
    const b = G.currentBrand;
    const stepKey = G.stepKeys[G.currentStep];
    const el = b.elements[stepKey];
    const totalSteps = G.stepKeys.length;
    const label = stepKey.charAt(0).toUpperCase() + stepKey.slice(1);

    // build options: correct + 3 wrongs, shuffled
    const options = shuffle([el.correct, ...el.wrong.slice(0, 3)]);

    area.innerHTML = `
<div style="max-width:520px;margin:0 auto">

  <!-- Brand card header -->
  <div style="
    background:${CARD_BG};border:1px solid rgba(124,58,237,.4);border-radius:16px;
    padding:16px 18px;margin-bottom:12px;
    box-shadow:0 0 28px rgba(124,58,237,.15);
  ">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      <div style="
        width:52px;height:52px;border-radius:12px;
        background:linear-gradient(135deg,${ACCENT}33,${PINK}22);
        border:1px solid ${ACCENT}66;
        display:flex;align-items:center;justify-content:center;
        font-size:1.8rem;flex-shrink:0;
      ">${b.icon}</div>
      <div style="flex:1">
        <div style="font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.15em;color:${LIGHT};margin-bottom:2px">BUSINESS TYPE</div>
        <div style="font-size:1.1rem;font-weight:700;color:#fff">${b.business}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:#666;letter-spacing:.1em">BRAND ${G.brandsDone}/${G.totalBrands}</div>
      </div>
    </div>

    <!-- step progress dots -->
    <div style="display:flex;gap:6px;align-items:center">
      ${G.stepKeys.map((k, i) => {
        const done = i < G.currentStep;
        const active = i === G.currentStep;
        const key = k.charAt(0).toUpperCase() + k.slice(1);
        return `<div style="flex:1;text-align:center">
          <div style="height:3px;border-radius:2px;margin-bottom:3px;background:${done ? GREEN : active ? ACCENT : 'rgba(255,255,255,.1)'}"></div>
          <div style="font-size:.42rem;font-family:Orbitron,sans-serif;letter-spacing:.06em;color:${done ? GREEN : active ? LIGHT : '#555'}">${key}</div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- picks so far -->
  ${G.currentStep > 0 ? `
  <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:10px 14px;margin-bottom:10px">
    <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:${GREEN};letter-spacing:.12em;margin-bottom:6px">CHOSEN SO FAR</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${G.stepKeys.slice(0, G.currentStep).map(k => `
        <span style="
          padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:600;
          background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.35);color:${GREEN};
        ">${G.picks[k]}</span>
      `).join('')}
    </div>
  </div>` : ''}

  <!-- question -->
  <div style="text-align:center;margin-bottom:14px">
    <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.18em;color:${LIGHT};margin-bottom:4px">CHOOSE THE ${label.toUpperCase()}</div>
    <div style="font-size:.85rem;color:#ccc">Step ${G.currentStep + 1} of ${totalSteps} — Pick the best <strong style="color:#fff">${label}</strong> for <strong style="color:${LIGHT}">${b.business}</strong></div>
  </div>

  <!-- option grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
    ${options.map((opt, i) => `
      <button id="bd_opt_${i}" onclick="window._bd_pick('${esc(opt)}')" style="
        padding:14px 12px;border-radius:12px;cursor:pointer;
        background:rgba(124,58,237,.08);
        border:1.5px solid rgba(124,58,237,.28);
        color:#e0d4ff;font-size:.82rem;font-weight:600;
        text-align:center;line-height:1.3;
        transition:all .15s;
        -webkit-tap-highlight-color:transparent;
      "
      onmouseover="this.style.background='rgba(124,58,237,.22)';this.style.borderColor='${ACCENT}'"
      onmouseout="this.style.background='rgba(124,58,237,.08)';this.style.borderColor='rgba(124,58,237,.28)'"
      >${opt}</button>
    `).join('')}
  </div>

</div>`;
  }

  /* ── pick handler ─────────────────────────────────────────────── */
  window._bd_pick = function (opt) {
    if (!G || G.done) return;
    const b = G.currentBrand;
    const stepKey = G.stepKeys[G.currentStep];
    const el = b.elements[stepKey];
    const isCorrect = opt === el.correct;
    const elapsed = (Date.now() - G.pickStartTime) / 1000;

    G.picks[stepKey] = opt;

    if (isCorrect) {
      let pts = 30;
      if (elapsed < SPEED_THRESHOLD) pts += 10; // speed bonus
      // trend bonus
      if (G.activeTrend && opt === G.activeTrend.bonus) {
        pts += G.activeTrend.bonusPts;
        showToast('TREND BONUS +' + (pts - (elapsed < SPEED_THRESHOLD ? 40 : 30)), GOLD, 1200);
      }
      G.score += pts;
      updateScore();

      // fill recognition meter
      const totalEl = G.brandQueue.reduce((a, x) => a + Object.keys(x.elements).length, 0)
        + G.stepKeys.length + Object.values(BRANDS_L1).reduce((a, x) => a, 0);
      // simple approach: each correct pick adds to recognition
      G.recognition = Math.min(100, G.recognition + Math.round(100 / (G.totalBrands * 4)));
      updateMeters();

      flashCorrect(opt, true);
      burstAtOption(opt, '+' + pts, GREEN);

      // cosmetic streak — never touches score/goal math, just a fun celebration layer
      G.streak++;
      if (G.streak === 5 || G.streak === 10 || G.streak === 20) showStreakBanner(G.streak);

      G.pickStartTime = Date.now();

      G.currentStep++;
      if (G.currentStep >= G.stepKeys.length) {
        // brand complete — check full alignment
        const allCorrect = G.stepKeys.every(k => G.picks[k] === b.elements[k].correct);
        if (allCorrect) {
          G.score += COMPLETE_BONUS;
          updateScore();
          G.recognition = Math.min(100, G.recognition + 8);
          updateMeters();
          setTimeout(() => {
            showToast('BRAND ALIGNED! +' + COMPLETE_BONUS + ' BONUS', GOLD, 1600);
            setTimeout(nextBrand, 1700);
          }, 300);
        } else {
          setTimeout(() => {
            showToast('BRAND DONE', LIGHT, 1000);
            setTimeout(nextBrand, 1100);
          }, 300);
        }
      } else {
        setTimeout(renderBrand, 350);
      }
    } else {
      flashCorrect(opt, false);
      burstAtOption(opt, 'OOPS', RED);
      shakeGameArea();
      G.streak = 0; // cosmetic streak resets on a miss
      G.confusion++;
      updateMeters();
      if (G.confusion >= CONFUSION_MAX) {
        setTimeout(endGame, 600);
        return;
      }
      showToast('OOPS — NOT A MATCH', RED, 1000);
      setTimeout(renderBrand, 400);
    }
  };

  function flashCorrect(opt, correct) {
    // visually highlight buttons
    const btns = document.querySelectorAll('[id^="bd_opt_"]');
    btns.forEach(btn => {
      if (btn.textContent.trim() === opt) {
        btn.style.background = correct ? 'rgba(16,185,129,.35)' : 'rgba(239,68,68,.35)';
        btn.style.borderColor = correct ? GREEN : RED;
        btn.style.animation = correct ? 'bd_pop_correct .3s ease' : 'bd_shake_wrong .35s ease';
      }
      btn.disabled = true;
      btn.style.cursor = 'default';
    });
  }

  /* ── per-pick juice: particle burst + floating text at the clicked
     button's position. Previously a correct/wrong pick only recolored
     the button silently — this gives every single tap a satisfying,
     lightweight visual payoff without touching scoring. ── */
  function burstAtOption(opt, label, color) {
    const btns = document.querySelectorAll('[id^="bd_opt_"]');
    let target = null;
    btns.forEach(btn => { if (btn.textContent.trim() === opt) target = btn; });
    /* append to bd_root (fixed, full-screen, no overflow clipping) using
       viewport-relative coordinates — bd_game scrolls and clips overflow,
       so particles that fly upward would get cut off if parented there. */
    const root = document.getElementById('bd_root');
    if (!target || !root) return;
    const bRect = target.getBoundingClientRect();
    const rRect = root.getBoundingClientRect();
    const cx = bRect.left + bRect.width / 2 - rRect.left;
    const cy = bRect.top + bRect.height / 2 - rRect.top;

    // floating label
    const txt = document.createElement('div');
    txt.textContent = label;
    txt.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;z-index:70;pointer-events:none;
      font-family:Orbitron,sans-serif;font-size:.85rem;font-weight:900;letter-spacing:.06em;
      color:${color};text-shadow:0 0 10px ${color}aa;white-space:nowrap;
      animation:bd_float_up .75s ease forwards;`;
    root.appendChild(txt);
    setTimeout(() => txt.remove(), 780);

    // small particle burst (6 dots) — cheap DOM/CSS animation, no canvas needed
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.4;
      const dist = 26 + Math.random() * 14;
      p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;z-index:69;pointer-events:none;
        width:6px;height:6px;border-radius:50%;background:${color};
        --px:${Math.cos(angle) * dist}px;--py:${Math.sin(angle) * dist}px;
        animation:bd_burst_particle .55s ease-out forwards;`;
      root.appendChild(p);
      setTimeout(() => p.remove(), 570);
    }
  }

  function shakeGameArea() {
    const area = document.getElementById('bd_game');
    if (!area) return;
    area.style.animation = 'bd_shake_wrong .35s ease';
    setTimeout(() => { area.style.animation = ''; }, 380);
  }

  /* ── cosmetic streak banner — pure celebration, no score/goal impact ── */
  function showStreakBanner(n) {
    const root = document.getElementById('bd_root');
    if (!root) return;
    const el = document.createElement('div');
    el.textContent = `🔥 ${n} STREAK!`;
    el.style.cssText = `position:absolute;top:40%;left:50%;z-index:80;pointer-events:none;
      font-family:Orbitron,sans-serif;font-size:1.3rem;font-weight:900;letter-spacing:.1em;
      color:${GOLD};text-shadow:0 0 20px ${GOLD}cc,0 0 40px ${PINK}88;white-space:nowrap;
      animation:bd_streak_banner 1.3s ease forwards;`;
    root.appendChild(el);
    setTimeout(() => el.remove(), 1320);
  }

  /* ── trend cards (level 2) ────────────────────────────────────── */
  function scheduleTrendCard() {
    const t = TREND_CARDS[Math.floor(Math.random() * TREND_CARDS.length)];
    G.activeTrend = t;
    G.trendActive = true;
    const el = document.getElementById('bd_trend');
    if (el) {
      el.style.display = 'block';
      el.innerHTML = `<span style="font-size:.8rem">📈 VIRAL TREND! </span>${t.text} <span style="opacity:.7;font-size:.68rem;margin-left:8px">[tap to dismiss]</span>`;
    }
    window._bd_dismissTrend = () => {
      const el2 = document.getElementById('bd_trend');
      if (el2) el2.style.display = 'none';
      G.trendActive = false;
    };
    // auto-dismiss after 12s
    if (G) G.trendTimer = setTimeout(() => {
      if (G && G.trendActive) window._bd_dismissTrend();
    }, 12000);
  }

  /* ── UI updates ───────────────────────────────────────────────── */
  function updateScore() {
    const el = document.getElementById('bd_score');
    if (el) el.textContent = G.score;
  }

  function updateMeters() {
    const rb = document.getElementById('bd_recog_bar');
    const rp = document.getElementById('bd_recog_pct');
    const cb = document.getElementById('bd_conf_bar');
    const cc = document.getElementById('bd_conf_count');
    if (rb) rb.style.width = G.recognition + '%';
    if (rp) rp.textContent = G.recognition + '%';
    if (cb) cb.style.width = ((G.confusion / CONFUSION_MAX) * 100) + '%';
    if (cc) cc.textContent = G.confusion + '/' + CONFUSION_MAX;
  }

  function showToast(msg, color, dur) {
    const el = document.getElementById('bd_toast');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.style.background = color + '22';
    el.style.border = '2px solid ' + color;
    el.style.color = color;
    el.style.boxShadow = '0 0 30px ' + color + '66';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.display = 'none'; }, dur);
  }

  /* ── end game ─────────────────────────────────────────────────── */
  function endGame() {
    if (!G || G.done) return;
    G.done = true;
    clearInterval(G.timerInterval);
    stopAmbientCity();

    const score = G.score;
    const stars = score >= 700 ? 3 : score >= 400 ? 2 : score > 0 ? 1 : 0;
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ll_branding_district', { stars, level: G.level, badge: 'Brand Builder', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    // feed Startup Success Meter — brand pillar
    if (window.StartupRewardsService) StartupRewardsService.submit({ pillar: 'brand', successDelta: stars === 3 ? 15 : stars === 2 ? 8 : 3 });

    const root = document.getElementById('bd_root');
    if (!root) return;

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const confusedOut = G.confusion >= CONFUSION_MAX;
    const won = stars >= 2 && !confusedOut; // "real win" bar for the confetti/shine celebration
    const resultMsg = confusedOut
      ? 'Customer Confusion maxed out — brands lost focus!'
      : G.recognition >= 80
        ? 'Exceptional branding! Your brands are iconic!'
        : G.recognition >= 50
          ? 'Solid branding identity achieved!'
          : 'Keep refining your brand strategy.';

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute;inset:0;z-index:100;
      background:rgba(2,0,10,.94);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:20px;box-sizing:border-box;overflow-y:auto;
    `;
    overlay.innerHTML = `
<div class="${won ? 'bd-winshine' : ''}" style="max-width:480px;width:100%;text-align:center;position:relative">

  <!-- stars -->
  <div style="font-size:2.4rem;margin-bottom:6px;text-shadow:0 0 20px ${GOLD}88">${starStr}</div>

  <!-- title -->
  <div style="font-family:'Anton',sans-serif;font-size:1.5rem;letter-spacing:.07em;color:${LIGHT};margin-bottom:4px;text-shadow:0 0 20px ${ACCENT}aa">
    ${stars === 3 ? 'PERFECT BRAND!' : stars === 2 ? 'BRAND BUILT!' : stars === 1 ? 'BRAND DRAFTED!' : 'BRAND COLLAPSED!'}
  </div>
  <div style="font-size:.82rem;color:#aaa;margin-bottom:18px">${resultMsg}</div>

  <!-- stats grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px">
    <div style="background:${CARD_BG};border:1px solid rgba(124,58,237,.3);border-radius:12px;padding:12px">
      <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:#888;letter-spacing:.1em;margin-bottom:4px">SCORE</div>
      <div style="font-family:Orbitron,sans-serif;font-size:1.1rem;color:${GOLD};font-variant-numeric:tabular-nums">${score}</div>
    </div>
    <div style="background:${CARD_BG};border:1px solid rgba(16,185,129,.3);border-radius:12px;padding:12px">
      <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:#888;letter-spacing:.1em;margin-bottom:4px">BRAND ID</div>
      <div style="font-family:Orbitron,sans-serif;font-size:1.1rem;color:${GREEN}">${G.recognition}%</div>
    </div>
    <div style="background:${CARD_BG};border:1px solid rgba(245,158,11,.3);border-radius:12px;padding:12px">
      <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:#888;letter-spacing:.1em;margin-bottom:4px">COINS</div>
      <div style="font-family:Orbitron,sans-serif;font-size:1.1rem;color:${GOLD}">+${coins}</div>
    </div>
  </div>

  <!-- badges -->
  ${stars >= 2 ? `<div style="
    background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(236,72,153,.1));
    border:1px solid rgba(124,58,237,.4);border-radius:12px;
    padding:10px 16px;margin-bottom:16px;
    display:flex;align-items:center;gap:10px;
  ">
    <span style="font-size:1.4rem">🏆</span>
    <div style="text-align:left">
      <div style="font-family:Orbitron,sans-serif;font-size:.58rem;color:${LIGHT};letter-spacing:.12em">BADGE EARNED</div>
      <div style="font-size:.78rem;color:#ddd;font-weight:600">${stars === 3 ? 'Perfect Brand Builder' : 'Brand Builder'}</div>
    </div>
  </div>` : ''}

  <!-- lesson -->
  <div style="
    background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);border-radius:12px;
    padding:14px 16px;margin-bottom:20px;text-align:left;
  ">
    <div style="font-family:Orbitron,sans-serif;font-size:.48rem;color:${LIGHT};letter-spacing:.12em;margin-bottom:6px">BRAND LESSON</div>
    <div style="font-size:.8rem;color:#ccc;line-height:1.55">
      A strong brand tells customers exactly who you are and why they should choose you.
      Matching your logo, colours, voice and target audience creates trust — and trust drives sales.
    </div>
  </div>

  <!-- buttons -->
  <div style="display:flex;gap:12px;justify-content:center">
    <button onclick="window._bd_replay()" style="
      flex:1;padding:14px;border-radius:12px;cursor:pointer;
      background:linear-gradient(135deg,${ACCENT},${PINK});
      border:none;color:#fff;font-family:Orbitron,sans-serif;
      font-size:.65rem;letter-spacing:.15em;
      box-shadow:0 4px 20px rgba(124,58,237,.4);
      transition:opacity .15s;
    " onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">PLAY AGAIN</button>
    <button onclick="window.ll_branding_districtExit()" style="
      flex:1;padding:14px;border-radius:12px;cursor:pointer;
      background:rgba(124,58,237,.12);
      border:1.5px solid rgba(124,58,237,.4);color:${LIGHT};
      font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.15em;
      transition:background .15s;
    " onmouseover="this.style.background='rgba(124,58,237,.22)'" onmouseout="this.style.background='rgba(124,58,237,.12)'">← HUB</button>
  </div>

</div>`;
    root.appendChild(overlay);
    if (won) spawnConfetti(root);
  }

  /* ── confetti burst — real wins only (stars>=2), matches arcade.js's
     .arc-confetti recipe so a completed brand feels like the rest of the app ── */
  function spawnConfetti(root) {
    const colors = [ACCENT, PINK, GOLD, GREEN, '#fff'];
    for (let i = 0; i < 46; i++) {
      setTimeout(() => {
        if (!root.isConnected) return;
        const el = document.createElement('div');
        const x = Math.random() * 100;
        el.style.cssText = `position:absolute;top:-24px;left:${x}%;width:${5+Math.random()*5}px;height:${5+Math.random()*5}px;border-radius:${Math.random()>.5?'50%':'2px'};background:${colors[Math.floor(Math.random()*colors.length)]};z-index:120;pointer-events:none;animation:bd_confetti_fall ${1.3+Math.random()*.8}s ease-in forwards`;
        root.appendChild(el);
        setTimeout(() => el.remove(), 2200);
      }, i * 28);
    }
  }

  window._bd_replay = function () {
    if (G) {
      clearInterval(G.timerInterval);
      if (G.trendTimer) clearTimeout(G.trendTimer);
    }
    G = null;
    const root = document.getElementById('bd_root');
    // remove overlay
    const overlays = root.querySelectorAll('[style*="z-index:100"]');
    overlays.forEach(o => o.remove());
    // reset game area
    const area = document.getElementById('bd_game');
    if (area) area.innerHTML = '';
    initGame();
  };

  /* ── helpers ──────────────────────────────────────────────────── */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function esc(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

})();
