/* ════════════════════════════════════════════════════════════════
   INVESTOR PITCH ARENA — Launch Lab Hub · Coinaverse v25
   Quiz + Timing mechanic · Fundraising & Business Communication
   Level 1: friendly investors, generous timers, clear best answers
   Level 2: tough follow-ups, investor personalities, walk-outs
   Win: fill Investor Confidence to funding goal before time expires
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── palette ──────────────────────────────────────────────── */
  const AC      = '#7C3AED';   // Launch Lab violet
  const AC2     = '#a855f7';   // lighter violet
  const AC3     = '#c084fc';   // highlight
  const BG      = '#03040c';
  const GOLD    = '#FFD700';
  const DANGER  = '#FF3D3D';
  const SUCCESS = '#4ade80';
  const WARM    = '#f59e0b';

  /* ── investor personality types ──────────────────────────── */
  const INVESTOR_TYPES = {
    DATA:    { label: 'Data-Driven',  icon: '📊', color: '#60a5fa', hint: 'Loves numbers, metrics, proof.' },
    VISION:  { label: 'Visionary',    icon: '🌌', color: AC2,       hint: 'Wants big dreams, market size.' },
    RISK:    { label: 'Risk-Averse',  icon: '🛡️', color: SUCCESS,   hint: 'Needs stability, safety, plan B.' },
    GROWTH:  { label: 'Growth-Hacker',icon: '🚀', color: WARM,      hint: 'Cares about traction & scale.' },
  };

  /* ── Q&A bank ─────────────────────────────────────────────── */
  const QUESTIONS_LVL1 = [
    {
      q: 'How will you make money?',
      context: null,
      answers: [
        { text: 'We charge a 5% commission on every transaction through our platform.', score: 3, tag: 'BEST' },
        { text: 'We\'ll figure out monetisation once we have users.', score: -2, tag: 'WEAK' },
        { text: 'We plan to add ads eventually.', score: 1, tag: 'OK' },
      ],
      lesson: 'A clear revenue model is non-negotiable. Always know exactly how you make money.',
      best: 'BEST',
      prefer: null, // neutral — all investor types OK
    },
    {
      q: 'Who is your customer?',
      context: null,
      answers: [
        { text: 'Everyone! Anyone can use our product.', score: -2, tag: 'WEAK' },
        { text: 'Young professionals aged 25–34 who manage freelance income across 3+ platforms.', score: 3, tag: 'BEST' },
        { text: 'Small businesses that need financial tools.', score: 1, tag: 'OK' },
      ],
      lesson: 'The tighter your customer definition, the more credible your pitch. Specificity wins.',
      best: 'BEST',
      prefer: null,
    },
    {
      q: 'Why are you different from competitors?',
      context: null,
      answers: [
        { text: 'We have no real competitors — our idea is totally unique.', score: -2, tag: 'WEAK' },
        { text: 'We\'re faster and cheaper than alternatives.', score: 1, tag: 'OK' },
        { text: 'Our proprietary AI reduces onboarding time by 70% vs. the market leader — we have data.', score: 3, tag: 'BEST' },
      ],
      lesson: 'Claiming no competitors signals naivety. Back your differentiation with specific data.',
      best: 'BEST',
      prefer: null,
    },
    {
      q: 'How much funding do you need?',
      context: null,
      answers: [
        { text: '$500K to hire 2 engineers, 1 designer, and cover 18 months of runway with clear milestones.', score: 3, tag: 'BEST' },
        { text: 'As much as possible — we can always use more.', score: -2, tag: 'WEAK' },
        { text: 'Around $1M, maybe less, depends on the terms.', score: 0, tag: 'OK' },
      ],
      lesson: 'Know your number down to the dollar and be able to explain every allocation.',
      best: 'BEST',
      prefer: null,
    },
    {
      q: 'What is your market size?',
      context: null,
      answers: [
        { text: 'The market is huge — trillions of dollars.', score: -1, tag: 'WEAK' },
        { text: 'Our serviceable addressable market is $2.4B, growing 18% YoY based on industry reports.', score: 3, tag: 'BEST' },
        { text: 'We think it\'s big enough for us to be profitable.', score: 0, tag: 'OK' },
      ],
      lesson: 'TAM/SAM/SOM breakdown shows you\'ve done the homework. Vague market claims destroy credibility.',
      best: 'BEST',
      prefer: null,
    },
    {
      q: 'What is your user acquisition strategy?',
      context: null,
      answers: [
        { text: 'Word of mouth — great products sell themselves.', score: -1, tag: 'WEAK' },
        { text: 'We\'ll figure it out after launch.', score: -2, tag: 'WEAK' },
        { text: 'SEO-driven content funnel targeting freelancer forums — we\'ve already acquired 400 beta users at $3 CAC.', score: 3, tag: 'BEST' },
      ],
      lesson: 'Early traction data transforms your pitch from a guess into a proof point.',
      best: 'BEST',
      prefer: null,
    },
  ];

  const QUESTIONS_LVL2 = [
    {
      q: 'What are your unit economics?',
      context: null,
      answers: [
        { text: 'LTV is $420, CAC is $35. Payback period is 6 months — we\'re capital-efficient.', score: 3, tag: 'BEST', prefTags: ['DATA','GROWTH'] },
        { text: 'Margins are healthy — we\'re focused on growth now.', score: 0, tag: 'OK', prefTags: ['VISION'] },
        { text: 'We\'ll calculate that once we scale.', score: -2, tag: 'WEAK', prefTags: [] },
      ],
      lesson: 'Unit economics are the DNA of your business. Know LTV:CAC by heart.',
      best: 'BEST',
      prefer: ['DATA','GROWTH'],
    },
    {
      q: 'But your competitor already does that!',
      context: 'OBJECTION',
      answers: [
        { text: 'You\'re right — we\'ll need to rethink our model.', score: -2, tag: 'WEAK', prefTags: [] },
        { text: 'Our competitor launched 3 years ago and holds 8% market share. We target a different segment with 3× faster integration.', score: 3, tag: 'BEST', prefTags: ['DATA','RISK'] },
        { text: 'We\'re just better at execution.', score: 0, tag: 'OK', prefTags: ['VISION','GROWTH'] },
      ],
      lesson: 'Investor objections are tests of conviction. Address them with facts, not emotions.',
      best: 'BEST',
      prefer: ['DATA','RISK'],
    },
    {
      q: 'What happens if a bigger company copies you?',
      context: 'RISK',
      answers: [
        { text: 'Our network effects and proprietary data create a moat that takes years to replicate — and we\'ll be 3 years ahead.', score: 3, tag: 'BEST', prefTags: ['RISK','DATA'] },
        { text: 'We\'ll pivot before that happens.', score: -1, tag: 'WEAK', prefTags: [] },
        { text: 'Big companies move too slow to catch us.', score: 0, tag: 'OK', prefTags: ['VISION'] },
      ],
      lesson: 'Every investor worries about big-tech cloning. A real moat — data, network, brand — is your answer.',
      best: 'BEST',
      prefer: ['RISK','DATA'],
    },
    {
      q: 'What is your 5-year vision?',
      context: null,
      answers: [
        { text: 'We want to be profitable in year 2.', score: 0, tag: 'OK', prefTags: ['RISK'] },
        { text: 'We\'re building the financial operating system for the global gig economy — 50M users by 2030.', score: 3, tag: 'BEST', prefTags: ['VISION','GROWTH'] },
        { text: 'To be acquired by a larger company at a great valuation.', score: -1, tag: 'WEAK', prefTags: [] },
      ],
      lesson: 'Investors want to believe in a big, bold future. Vision paired with a credible path beats caution.',
      best: 'BEST',
      prefer: ['VISION','GROWTH'],
    },
    {
      q: 'Show me your traction. What\'s your MoM growth?',
      context: null,
      answers: [
        { text: '22% month-over-month for the last 4 months. We\'re at $18K MRR with 80% retention.', score: 3, tag: 'BEST', prefTags: ['DATA','GROWTH'] },
        { text: 'We just launched — traction is coming.', score: -1, tag: 'WEAK', prefTags: [] },
        { text: 'We\'ve been growing steadily.', score: 0, tag: 'OK', prefTags: ['VISION'] },
      ],
      lesson: 'Real numbers tell the real story. Even small traction, stated precisely, is more powerful than vague optimism.',
      best: 'BEST',
      prefer: ['DATA','GROWTH'],
    },
    {
      q: 'Why are you the right team to do this?',
      context: null,
      answers: [
        { text: 'We\'re passionate and work hard.', score: -1, tag: 'WEAK', prefTags: [] },
        { text: 'Between us: 12 years in fintech, a successful exit, and a founding engineer who scaled to 2M users at Stripe.', score: 3, tag: 'BEST', prefTags: ['DATA','RISK','GROWTH'] },
        { text: 'We know this problem because we\'ve lived it ourselves.', score: 1, tag: 'OK', prefTags: ['VISION'] },
      ],
      lesson: 'Investors bet on people first. Specific credentials and relevant experience make the team case airtight.',
      best: 'BEST',
      prefer: ['DATA','RISK','GROWTH'],
    },
    {
      q: 'Your burn rate seems high. How long is your runway?',
      context: 'CONCERN',
      answers: [
        { text: 'We can stretch it. We haven\'t optimised yet.', score: -2, tag: 'WEAK', prefTags: [] },
        { text: 'At current burn of $42K/month we have 14 months. This round extends it to 24 months with 3 clear milestones.', score: 3, tag: 'BEST', prefTags: ['RISK','DATA'] },
        { text: 'We\'ll raise again before we need to worry about it.', score: -1, tag: 'WEAK', prefTags: [] },
      ],
      lesson: 'Knowing your burn and runway exactly reassures investors that capital will be used responsibly.',
      best: 'BEST',
      prefer: ['RISK','DATA'],
    },
  ];

  /* ── level configurations ─────────────────────────────────── */
  const LEVEL_CFG = [
    {
      level: 1,
      title: 'LEARN',
      subtitle: 'Friendly Investors · Textbook Questions',
      pitchTimeSec: 90,
      answerTimeSec: 12,
      fundingGoal: 500,          // confidence points needed
      penaltyOnWrong: 30,
      partialTimeBonus: 8,       // bonus conf on fast answer
      investors: [
        { name: 'Alex Chen',   type: 'DATA',   avatar: '👨‍💼', confidence: 100, minConf: 0, canWalkOut: false },
        { name: 'Sofia Ray',   type: 'VISION', avatar: '👩‍💼', confidence: 100, minConf: 0, canWalkOut: false },
        { name: 'Marcus Hill', type: 'GROWTH', avatar: '👨‍🏫', confidence: 100, minConf: 0, canWalkOut: false },
      ],
      questions: QUESTIONS_LVL1,
    },
    {
      level: 2,
      title: 'MASTER',
      subtitle: 'Tough Investors · Read the Room',
      pitchTimeSec: 75,
      answerTimeSec: 7,
      fundingGoal: 600,
      penaltyOnWrong: 50,
      partialTimeBonus: 12,
      investors: [
        { name: 'Dana Park',   type: 'DATA',   avatar: '👩‍💻', confidence: 100, minConf: 0, canWalkOut: true },
        { name: 'Victor Koss', type: 'RISK',   avatar: '👴',   confidence: 100, minConf: 0, canWalkOut: true },
        { name: 'Zara Finn',   type: 'GROWTH', avatar: '👩‍🚀', confidence: 100, minConf: 0, canWalkOut: true },
        { name: 'Omar Vega',   type: 'VISION', avatar: '🧑‍🎨', confidence: 100, minConf: 0, canWalkOut: true },
      ],
      questions: QUESTIONS_LVL2,
    },
  ];

  /* ── star thresholds (confidence points) ──────────────────── */
  const STAR3_CONF = 480;
  const STAR2_CONF = 300;

  /* ── module state ─────────────────────────────────────────── */
  let G = null;
  let rafId = null;
  let bgCanvas = null, bgCtx = null;
  let particles = [];

  /* ══════════════════════════════════════════════════════════
     SCREEN REGISTRATION
  ══════════════════════════════════════════════════════════ */
  window.SCREENS = window.SCREENS || {};

  window.SCREENS.game_ll_investor_pitch = function () {
    G = null;
    cancelAnimationFrame(rafId);
    particles = [];
    setTimeout(initGame, 40);
    return `
<div id="ipaRoot" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none;">

  <!-- arena bg canvas -->
  <canvas id="ipaBgCanvas" style="position:absolute;inset:0;pointer-events:none;"></canvas>
  <!-- particle canvas -->
  <canvas id="ipaPartCanvas" style="position:absolute;inset:0;pointer-events:none;"></canvas>

  <!-- TOP BAR -->
  <div id="ipaTopBar" style="position:absolute;top:0;left:0;right:0;height:52px;background:rgba(3,4,12,.9);border-bottom:1px solid ${AC}44;display:flex;align-items:center;padding:0 12px;gap:10px;z-index:50;backdrop-filter:blur(8px);">
    <button id="ipaBackBtn" onclick="window.ll_investor_pitchExit && window.ll_investor_pitchExit()" style="background:none;border:1px solid ${AC}66;color:${AC2};font-family:Orbitron,monospace;font-size:10px;padding:5px 10px;border-radius:6px;cursor:pointer;letter-spacing:.08em;white-space:nowrap;flex-shrink:0;">← HUB</button>
    <div style="font-family:Orbitron,monospace;font-size:11px;font-weight:700;color:${AC2};letter-spacing:1.5px;flex:1;text-align:center;text-shadow:0 0 14px ${AC}99;">INVESTOR PITCH ARENA</div>
    <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
      <div style="text-align:right;">
        <div style="font-size:7px;color:#888;letter-spacing:1px;font-family:Orbitron,monospace;">CONFIDENCE</div>
        <div id="ipaConfScore" style="font-family:Orbitron,monospace;font-size:13px;color:${AC3};font-weight:700;font-variant-numeric:tabular-nums;">0</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:7px;color:#888;letter-spacing:1px;font-family:Orbitron,monospace;">TIME</div>
        <div id="ipaTimer" style="font-family:Orbitron,monospace;font-size:15px;color:#fff;font-weight:700;font-variant-numeric:tabular-nums;">90s</div>
      </div>
    </div>
  </div>

  <!-- FUNDING GOAL METER -->
  <div id="ipaFundBar" style="position:absolute;top:52px;left:0;right:0;padding:7px 14px 5px;background:rgba(3,4,12,.75);border-bottom:1px solid ${AC}22;z-index:40;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
      <span style="font-family:Orbitron,monospace;font-size:7px;letter-spacing:1px;color:rgba(255,255,255,.45);">INVESTOR CONFIDENCE</span>
      <span id="ipaFundLabel" style="font-family:Orbitron,monospace;font-size:8px;font-weight:700;color:${AC2};letter-spacing:1px;">BUILDING...</span>
    </div>
    <div style="position:relative;height:18px;border-radius:5px;background:rgba(255,255,255,.05);border:1px solid ${AC}33;overflow:hidden;">
      <div id="ipaFundFill" style="position:absolute;top:0;bottom:0;left:0;width:0%;background:linear-gradient(90deg,${AC},${AC2},${AC3});border-radius:5px;transition:width .5s cubic-bezier(.4,0,.2,1);box-shadow:0 0 10px ${AC}88;"></div>
      <div id="ipaFundGlow" style="position:absolute;top:0;bottom:0;left:0;width:0%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);animation:ipaShimmer 2s infinite;pointer-events:none;"></div>
    </div>
    <div id="ipaFundGoalLine" style="display:flex;justify-content:flex-end;font-size:7px;color:${AC}99;margin-top:2px;font-family:Orbitron,monospace;letter-spacing:.08em;">GOAL: <span id="ipaGoalNum" style="margin-left:4px;">500</span> pts</div>
  </div>

  <!-- INVESTOR ROW -->
  <div id="ipaInvestorRow" style="position:absolute;top:126px;left:0;right:0;z-index:40;display:flex;justify-content:center;gap:10px;padding:8px 12px;overflow-x:auto;"></div>

  <!-- STAGE AREA -->
  <div id="ipaStage" style="position:absolute;top:200px;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:30;padding:0 16px 20px;"></div>

  <!-- LEVEL SELECT OVERLAY -->
  <div id="ipaLevelSelect" style="position:absolute;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(3,4,12,.95);padding:20px;">
    <div style="font-family:Orbitron,monospace;font-size:10px;letter-spacing:3px;color:${AC}99;margin-bottom:8px;">LAUNCH LAB</div>
    <div style="font-family:Orbitron,monospace;font-size:22px;font-weight:700;color:#fff;text-align:center;text-shadow:0 0 30px ${AC};margin-bottom:4px;">INVESTOR PITCH</div>
    <div style="font-family:Orbitron,monospace;font-size:22px;font-weight:700;color:${AC2};text-align:center;text-shadow:0 0 30px ${AC};margin-bottom:20px;">ARENA</div>
    <div style="color:rgba(255,255,255,.6);font-size:13px;text-align:center;max-width:300px;line-height:1.6;margin-bottom:28px;">Stand on stage. Answer investor questions. Raise Investor Confidence to secure your funding round.</div>
    <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:320px;">
      <button id="ipaLvl1Btn" style="padding:16px;background:linear-gradient(135deg,${AC}22,${AC}11);border:1px solid ${AC}66;border-radius:12px;color:#fff;cursor:pointer;text-align:left;transition:all .2s;">
        <div style="font-family:Orbitron,monospace;font-size:11px;letter-spacing:1.5px;color:${AC3};margin-bottom:4px;">LEVEL 1 — LEARN</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:3px;">Friendly Investors</div>
        <div style="font-size:11px;color:rgba(255,255,255,.5);">Textbook questions · 12s per answer · Generous timer</div>
      </button>
      <button id="ipaLvl2Btn" style="padding:16px;background:linear-gradient(135deg,#1a0030,#0d001a);border:1px solid ${AC}44;border-radius:12px;color:#fff;cursor:pointer;text-align:left;transition:all .2s;">
        <div style="font-family:Orbitron,monospace;font-size:11px;letter-spacing:1.5px;color:${WARM};margin-bottom:4px;">LEVEL 2 — MASTER</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:3px;">Tough Room · Read Personalities</div>
        <div style="font-size:11px;color:rgba(255,255,255,.5);">Investor types matter · 7s per answer · Walk-outs possible</div>
      </button>
    </div>
  </div>

  <style>
    @keyframes ipaShimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
    @keyframes ipaPulse { 0%,100%{opacity:.7} 50%{opacity:1} }
    @keyframes ipaSlideIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ipaWalk { 0%{transform:translateX(0) scale(1)} 50%{transform:translateX(-6px) scale(1.02)} 100%{transform:translateX(0) scale(1)} }
    @keyframes ipaShake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
    @keyframes ipaGlow { 0%,100%{box-shadow:0 0 10px ${AC}55} 50%{box-shadow:0 0 28px ${AC}cc} }
    @keyframes ipaConfDrop { from{opacity:1;transform:translateY(0) scale(1.2)} to{opacity:0;transform:translateY(-40px) scale(.8)} }
    .ipa-ans-btn { padding:11px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04);color:#fff;font-size:13px;line-height:1.4;cursor:pointer;text-align:left;transition:all .18s;width:100%;display:block; }
    .ipa-ans-btn:hover { border-color:${AC2};background:rgba(124,58,237,.18);transform:translateX(3px); }
    .ipa-ans-btn.selected-best { border-color:${SUCCESS};background:rgba(74,222,128,.12); }
    .ipa-ans-btn.selected-ok  { border-color:${WARM};background:rgba(245,158,11,.12); }
    .ipa-ans-btn.selected-bad { border-color:${DANGER};background:rgba(255,61,61,.12);animation:ipaShake .4s; }
    .ipa-inv-card { padding:8px 10px;border-radius:10px;border:1px solid ${AC}44;background:rgba(3,4,12,.7);text-align:center;min-width:70px;transition:all .3s;flex-shrink:0; }
    .ipa-inv-card.happy { border-color:${SUCCESS}88; }
    .ipa-inv-card.warning { border-color:${WARM}88; }
    .ipa-inv-card.danger  { border-color:${DANGER}88; }
    .ipa-inv-card.walkedout { opacity:.35;filter:grayscale(1); }
  </style>
</div>`;
  };

  /* ══════════════════════════════════════════════════════════
     EXIT
  ══════════════════════════════════════════════════════════ */
  window.ll_investor_pitchExit = function () {
    if (G) {
      clearInterval(G.pitchInterval);
      clearInterval(G.answerInterval);
      clearInterval(G._countdownUI);
    }
    G = null;
    cancelAnimationFrame(rafId);
    if (window.state) state.viewingWorld = 'risktaker';
    goTo('hub');
  };

  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */
  function initGame() {
    const root = document.getElementById('ipaRoot');
    if (!root) return;

    /* canvas setup */
    bgCanvas  = document.getElementById('ipaBgCanvas');
    const partCanvas = document.getElementById('ipaPartCanvas');
    if (bgCanvas) {
      bgCanvas.width  = root.offsetWidth;
      bgCanvas.height = root.offsetHeight;
      bgCtx = bgCanvas.getContext('2d');
    }
    if (partCanvas) {
      partCanvas.width  = root.offsetWidth;
      partCanvas.height = root.offsetHeight;
    }
    spawnArenaParticles(partCanvas);

    /* level select buttons */
    const lvl1Btn = document.getElementById('ipaLvl1Btn');
    const lvl2Btn = document.getElementById('ipaLvl2Btn');
    if (lvl1Btn) lvl1Btn.onclick = () => startLevel(0);
    if (lvl2Btn) lvl2Btn.onclick = () => startLevel(1);

    /* start bg draw loop */
    drawBg();
  }

  /* ══════════════════════════════════════════════════════════
     START LEVEL
  ══════════════════════════════════════════════════════════ */
  function startLevel(lvlIdx) {
    const cfg = LEVEL_CFG[lvlIdx];
    const qPool = cfg.questions.slice().sort(() => Math.random() - .5);

    /* deep-copy investors so confidence resets */
    const investors = cfg.investors.map(iv => Object.assign({}, iv, { confidence: 100 }));

    G = {
      lvlIdx,
      cfg,
      investors,
      qPool,
      qIdx: 0,
      totalConf: 0,
      pitchTimeLeft: cfg.pitchTimeSec,
      answerTimeLeft: cfg.answerTimeSec,
      pitchInterval: null,
      answerInterval: null,
      phase: 'question',   // 'question' | 'feedback' | 'done'
      currentQ: null,
      answered: false,
      questionsDone: 0,
    };

    /* hide level select */
    const ls = document.getElementById('ipaLevelSelect');
    if (ls) ls.style.display = 'none';

    /* render investors */
    renderInvestorRow();

    /* update goal display */
    const goalEl = document.getElementById('ipaGoalNum');
    if (goalEl) goalEl.textContent = cfg.fundingGoal;

    /* start pitch timer */
    G.pitchInterval = setInterval(tickPitch, 1000);

    /* present first question */
    nextQuestion();
  }

  /* ── pitch timer tick ────────────────────────────────────── */
  function tickPitch() {
    if (!G || G.phase === 'done') return;
    G.pitchTimeLeft--;
    const timerEl = document.getElementById('ipaTimer');
    if (timerEl) {
      timerEl.textContent = G.pitchTimeLeft + 's';
      timerEl.style.color = G.pitchTimeLeft <= 15 ? DANGER : '#fff';
    }
    if (G.pitchTimeLeft <= 0) {
      G.pitchTimeLeft = 0;
      triggerGameOver(false, 'TIME UP — The pitch session ended before you reached your goal!');
    }
  }

  /* ── answer timer tick ───────────────────────────────────── */
  function tickAnswer() {
    if (!G || G.answered) return;
    G.answerTimeLeft--;
    const atEl = document.getElementById('ipaAnswerTimer');
    if (atEl) {
      const pct = (G.answerTimeLeft / G.cfg.answerTimeSec) * 100;
      atEl.style.width = pct + '%';
      atEl.style.background = pct > 50 ? `linear-gradient(90deg,${AC},${AC2})` :
                               pct > 25 ? `linear-gradient(90deg,${WARM},#fbbf24)` :
                                          `linear-gradient(90deg,${DANGER},#f87171)`;
    }
    if (G.answerTimeLeft <= 0) {
      /* time out = wrong answer penalty */
      G.answered = true;
      clearInterval(G.answerInterval);
      applyAnswer(null); /* null = timed out */
    }
  }

  /* ══════════════════════════════════════════════════════════
     QUESTION FLOW
  ══════════════════════════════════════════════════════════ */
  function nextQuestion() {
    if (!G) return;

    /* check win condition */
    if (G.totalConf >= G.cfg.fundingGoal) {
      triggerGameOver(true, null);
      return;
    }

    /* check if all investors walked out */
    if (G.cfg.level === 2) {
      const active = G.investors.filter(iv => iv.confidence > 0);
      if (active.length === 0) {
        triggerGameOver(false, 'All investors walked out. The room is empty.');
        return;
      }
    }

    if (G.qIdx >= G.qPool.length) {
      /* recycled shuffled pool */
      G.qPool = G.cfg.questions.slice().sort(() => Math.random() - .5);
      G.qIdx = 0;
    }

    G.currentQ = G.qPool[G.qIdx++];
    G.answered = false;
    G.answerTimeLeft = G.cfg.answerTimeSec;
    G.phase = 'question';

    renderQuestion();

    clearInterval(G.answerInterval);
    G.answerInterval = setInterval(tickAnswer, 1000);
  }

  function renderQuestion() {
    if (!G || !G.currentQ) return;
    const q = G.currentQ;
    const cfg = G.cfg;

    /* pick a random asker investor */
    const activeInvestors = G.investors.filter(iv => iv.confidence > 0);
    const asker = activeInvestors[Math.floor(Math.random() * activeInvestors.length)];
    const ivType = INVESTOR_TYPES[asker.type];

    /* shuffle answers */
    const shuffled = q.answers.slice().sort(() => Math.random() - .5);

    /* personality hint for lvl 2 */
    const personalityHint = (cfg.level === 2 && q.prefer && q.prefer.length)
      ? `<div style="font-size:10px;color:${ivType.color};margin-bottom:10px;display:flex;align-items:center;gap:6px;"><span>${ivType.icon}</span><em>${asker.name} is ${ivType.label} — ${ivType.hint}</em></div>`
      : '';

    /* context badge */
    const ctxBadge = q.context
      ? `<span style="font-size:9px;padding:2px 8px;border-radius:20px;background:${DANGER}22;border:1px solid ${DANGER}55;color:${DANGER};font-family:Orbitron,monospace;letter-spacing:.5px;margin-right:8px;">${q.context}</span>`
      : '';

    const stage = document.getElementById('ipaStage');
    if (!stage) return;

    stage.innerHTML = `
<div style="width:100%;max-width:500px;animation:ipaSlideIn .35s ease;">

  <!-- asker -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
    <div style="width:42px;height:42px;border-radius:50%;background:${ivType.color}22;border:2px solid ${ivType.color}66;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${asker.avatar}</div>
    <div>
      <div style="font-size:12px;font-weight:700;color:#fff;">${asker.name}</div>
      <div style="font-size:10px;color:${ivType.color};display:flex;align-items:center;gap:4px;">${ivType.icon} ${ivType.label}</div>
    </div>
  </div>

  <!-- question -->
  <div style="background:rgba(124,58,237,.08);border:1px solid ${AC}44;border-radius:12px;padding:14px 16px;margin-bottom:10px;">
    <div style="margin-bottom:8px;">${ctxBadge}</div>
    <div style="font-size:15px;font-weight:700;color:#fff;line-height:1.4;text-wrap:balance;">"${q.q}"</div>
    ${personalityHint}
    <!-- answer timer bar -->
    <div style="margin-top:10px;height:4px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;">
      <div id="ipaAnswerTimer" style="height:100%;width:100%;border-radius:3px;background:linear-gradient(90deg,${AC},${AC2});transition:width .9s linear,background .9s;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:3px;font-size:8px;color:rgba(255,255,255,.35);font-family:Orbitron,monospace;">
      <span>ANSWER WINDOW</span><span id="ipaAnsCountdown">${cfg.answerTimeSec}s</span>
    </div>
  </div>

  <!-- answers -->
  <div style="display:flex;flex-direction:column;gap:8px;" id="ipaAnswerList">
    ${shuffled.map((ans, i) => `
      <button class="ipa-ans-btn" id="ipaAns_${i}" data-idx="${i}" data-tag="${ans.tag}" data-score="${ans.score}" data-preftags="${(ans.prefTags||[]).join(',')}" style="font-family:Inter,sans-serif;">
        <span style="font-size:10px;font-family:Orbitron,monospace;color:${AC}99;letter-spacing:.5px;display:block;margin-bottom:3px;">OPTION ${String.fromCharCode(65+i)}</span>
        ${ans.text}
      </button>
    `).join('')}
  </div>
</div>`;

    /* wire answer buttons */
    for (let i = 0; i < shuffled.length; i++) {
      const btn = document.getElementById('ipaAns_' + i);
      if (!btn) continue;
      btn.onclick = () => {
        if (G && !G.answered) {
          G.answered = true;
          clearInterval(G.answerInterval);
          const score  = parseInt(btn.dataset.score);
          const tag    = btn.dataset.tag;
          const prefs  = btn.dataset.preftags ? btn.dataset.preftags.split(',').filter(Boolean) : [];
          handleAnswerChoice(btn, score, tag, prefs);
        }
      };
    }

    /* live countdown display */
    const _cduId = setInterval(() => {
      if (!G) { clearInterval(_cduId); return; }
      const el = document.getElementById('ipaAnsCountdown');
      if (el) el.textContent = Math.max(0, G.answerTimeLeft) + 's';
    }, 250);
    G._countdownUI = _cduId;
  }

  /* ── handle answer selection ─────────────────────────────── */
  function handleAnswerChoice(btn, score, tag, prefTags) {
    clearInterval(G._countdownUI);
    applyAnswer({ btn, score, tag, prefTags });
  }

  function applyAnswer(choice) {
    if (!G) return;
    const q = G.currentQ;
    const cfg = G.cfg;
    const timeBonus = G.answerTimeLeft > (cfg.answerTimeSec * 0.6) ? cfg.partialTimeBonus : 0;

    /* timed out */
    if (!choice) {
      const penalty = cfg.penaltyOnWrong;
      G.totalConf = Math.max(0, G.totalConf - penalty / 2);
      updateInvestorConf(-20);
      showFeedback('⏰ TIME OUT!', `Too slow! Investors lose confidence.`, DANGER, `-${Math.floor(penalty/2)}`, null);
      return;
    }

    const { btn, score, tag, prefTags } = choice;
    let confDelta = 0;

    if (score >= 3) {
      /* best answer */
      confDelta = 60 + timeBonus;
      btn.classList.add('selected-best');
      updateInvestorConf(+25, prefTags);
      emitConfetti(btn);
    } else if (score >= 1) {
      /* ok answer */
      confDelta = 25 + Math.floor(timeBonus / 2);
      btn.classList.add('selected-ok');
      updateInvestorConf(+8, prefTags);
    } else {
      /* wrong answer */
      confDelta = -cfg.penaltyOnWrong;
      btn.classList.add('selected-bad');
      updateInvestorConf(-35, prefTags);
    }

    G.totalConf = Math.max(0, G.totalConf + confDelta);
    G.questionsDone++;
    updateConfUI();

    const label = score >= 3 ? `+${confDelta} pts 🎯 STRONG ANSWER!`
                : score >= 1 ? `+${confDelta} pts — Decent answer`
                              : `${confDelta} pts — Weak answer`;
    const color = score >= 3 ? SUCCESS : score >= 1 ? WARM : DANGER;

    /* reveal correct if wrong */
    let correctText = null;
    if (score < 3) {
      const best = q.answers.find(a => a.tag === 'BEST');
      if (best) correctText = best.text;
    }

    showFeedback(
      score >= 3 ? '✅ NAILED IT!' : score >= 1 ? '👍 OK ANSWER' : '❌ WEAK ANSWER',
      q.lesson,
      color,
      label,
      correctText
    );
  }

  /* ── update individual investor confidence ───────────────── */
  function updateInvestorConf(delta, prefTags) {
    if (!G) return;
    G.investors.forEach((iv, i) => {
      if (iv.confidence <= 0) return; /* already walked out */
      let d = delta;
      /* lvl2 personality multiplier */
      if (G.cfg.level === 2 && prefTags && prefTags.length) {
        if (prefTags.includes(iv.type)) {
          d = delta > 0 ? delta * 1.5 : delta * 0.5;
        } else if (delta > 0) {
          d = delta * 0.4;
        }
      }
      iv.confidence = Math.max(0, Math.min(100, iv.confidence + d));

      /* walk out logic */
      if (G.cfg.level === 2 && iv.canWalkOut && iv.confidence === 0) {
        iv.walkedOut = true;
        showWalkout(iv);
      }
    });
    renderInvestorRow();
  }

  /* ── feedback panel ─────────────────────────────────────── */
  function showFeedback(headline, lesson, color, pointsLabel, correctText) {
    const stage = document.getElementById('ipaStage');
    if (!stage) return;

    const correctBlock = correctText
      ? `<div style="margin-top:10px;padding:10px 12px;background:rgba(74,222,128,.07);border-left:3px solid ${SUCCESS};border-radius:0 8px 8px 0;">
           <div style="font-size:9px;font-family:Orbitron,monospace;color:${SUCCESS};letter-spacing:1px;margin-bottom:4px;">STRONGER ANSWER</div>
           <div style="font-size:12px;color:rgba(255,255,255,.75);">"${correctText}"</div>
         </div>` : '';

    stage.innerHTML = `
<div style="width:100%;max-width:460px;animation:ipaSlideIn .3s ease;">
  <div style="background:rgba(3,4,12,.9);border:1px solid ${color}55;border-radius:14px;padding:20px 20px 16px;text-align:center;">
    <div style="font-family:Orbitron,monospace;font-size:16px;font-weight:700;color:${color};margin-bottom:6px;">${headline}</div>
    <div style="font-family:Orbitron,monospace;font-size:13px;color:${color}cc;margin-bottom:12px;">${pointsLabel}</div>
    <div style="font-size:12px;color:rgba(255,255,255,.65);line-height:1.6;margin-bottom:8px;">${lesson}</div>
    ${correctBlock}
    <button id="ipaNextBtn" style="margin-top:14px;padding:10px 28px;background:${AC};border:none;border-radius:8px;color:#fff;font-family:Orbitron,monospace;font-size:11px;letter-spacing:1px;cursor:pointer;transition:all .2s;">NEXT QUESTION →</button>
  </div>
</div>`;

    const nb = document.getElementById('ipaNextBtn');
    if (nb) nb.onclick = () => nextQuestion();
  }

  /* ── walk-out notification ──────────────────────────────── */
  function showWalkout(iv) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:110px;right:12px;z-index:200;background:${DANGER}22;border:1px solid ${DANGER}66;border-radius:10px;padding:10px 14px;font-size:11px;color:${DANGER};max-width:200px;animation:ipaSlideIn .3s ease;`;
    el.innerHTML = `<strong>${iv.avatar} ${iv.name} walked out!</strong><br><span style="font-size:9px;opacity:.7">Funding capacity reduced.</span>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  /* ══════════════════════════════════════════════════════════
     UI UPDATES
  ══════════════════════════════════════════════════════════ */
  function updateConfUI() {
    if (!G) return;
    const el = document.getElementById('ipaConfScore');
    if (el) el.textContent = G.totalConf;

    const fill = document.getElementById('ipaFundFill');
    const glow = document.getElementById('ipaFundGlow');
    const lbl  = document.getElementById('ipaFundLabel');
    const pct  = Math.min(100, (G.totalConf / G.cfg.fundingGoal) * 100);
    if (fill) fill.style.width = pct + '%';
    if (glow) glow.style.width = pct + '%';
    if (lbl) {
      if (pct >= 100) { lbl.textContent = '✅ FUNDED!'; lbl.style.color = SUCCESS; }
      else if (pct >= 70) { lbl.textContent = 'ALMOST THERE!'; lbl.style.color = WARM; }
      else if (pct >= 40) { lbl.textContent = 'BUILDING...'; lbl.style.color = AC2; }
      else { lbl.textContent = 'PITCH HARDER!'; lbl.style.color = DANGER; }
    }
  }

  function renderInvestorRow() {
    if (!G) return;
    const row = document.getElementById('ipaInvestorRow');
    if (!row) return;
    row.innerHTML = G.investors.map(iv => {
      const ivType = INVESTOR_TYPES[iv.type];
      const pct = iv.confidence;
      const cardClass = iv.walkedOut ? 'ipa-inv-card walkedout'
                      : pct >= 70 ? 'ipa-inv-card happy'
                      : pct >= 35 ? 'ipa-inv-card warning'
                      : 'ipa-inv-card danger';
      const barColor = pct >= 70 ? SUCCESS : pct >= 35 ? WARM : DANGER;
      return `
<div class="${cardClass}">
  <div style="font-size:18px;margin-bottom:3px;">${iv.avatar}</div>
  <div style="font-size:9px;font-weight:700;color:#fff;white-space:nowrap;">${iv.name.split(' ')[0]}</div>
  <div style="font-size:8px;color:${ivType.color};margin-bottom:4px;">${ivType.icon} ${ivType.label}</div>
  <div style="height:4px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden;width:50px;margin:0 auto;">
    <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width .4s;"></div>
  </div>
  <div style="font-size:8px;color:rgba(255,255,255,.5);margin-top:2px;font-variant-numeric:tabular-nums;">${iv.walkedOut ? '🚪 GONE' : pct + '%'}</div>
</div>`;
    }).join('');
  }

  /* ══════════════════════════════════════════════════════════
     GAME OVER
  ══════════════════════════════════════════════════════════ */
  function triggerGameOver(won, loseMsg) {
    if (!G || G.phase === 'done') return;
    G.phase = 'done';
    clearInterval(G.pitchInterval);
    clearInterval(G.answerInterval);
    clearInterval(G._countdownUI);

    const stars = won
      ? (G.totalConf >= STAR3_CONF ? 3 : G.totalConf >= STAR2_CONF ? 2 : 1)
      : 0;

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ll_investor_pitch', { stars, level: G.cfg.level, badge: 'Pitch Master Badge', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();
    if (window.StartupRewardsService) StartupRewardsService.submit({ pillar: 'pitch', successDelta: stars === 3 ? 15 : stars === 2 ? 8 : 3 });

    endGame(stars, coins, won, loseMsg);
  }

  function endGame(stars, coins, won, loseMsg) {
    const stage = document.getElementById('ipaStage');
    if (!stage) return;

    const starRow = [1,2,3].map(n =>
      `<span style="font-size:32px;opacity:${n <= stars ? 1 : .2};filter:${n <= stars ? 'drop-shadow(0 0 8px #ffd700)' : 'none'};transition:all .4s ${n*.15}s;">⭐</span>`
    ).join('');

    const lesson = `Investors fund people who know their business inside out. Being able to answer "How do you make money?" and "Who is your customer?" quickly and clearly is the skill that turns ideas into funded companies.`;

    stage.innerHTML = `
<div style="width:100%;max-width:480px;animation:ipaSlideIn .4s ease;">
  <div style="background:rgba(3,4,12,.96);border:1px solid ${won ? AC : DANGER}66;border-radius:16px;padding:24px 20px;text-align:center;box-shadow:0 0 40px ${won ? AC : DANGER}33;">
    <div style="font-family:Orbitron,monospace;font-size:10px;letter-spacing:3px;color:${won ? AC2 : DANGER}99;margin-bottom:8px;">${won ? 'PITCH COMPLETE' : 'NICE TRY — GO AGAIN!'}</div>
    <div style="font-family:Orbitron,monospace;font-size:20px;font-weight:700;color:${won ? '#fff' : DANGER};margin-bottom:4px;">${won ? '🎤 FUNDED!' : '📉 NO DEAL'}</div>
    ${loseMsg ? `<div style="font-size:12px;color:${DANGER}bb;margin-bottom:12px;">${loseMsg}</div>` : ''}

    <!-- stars -->
    <div style="display:flex;justify-content:center;gap:4px;margin:12px 0 8px;">${starRow}</div>

    <!-- stats -->
    <div style="display:flex;gap:10px;justify-content:center;margin-bottom:14px;">
      <div style="padding:10px 16px;background:${AC}11;border:1px solid ${AC}33;border-radius:10px;">
        <div style="font-size:8px;color:rgba(255,255,255,.45);font-family:Orbitron,monospace;letter-spacing:1px;">CONFIDENCE</div>
        <div style="font-family:Orbitron,monospace;font-size:18px;color:${AC3};font-weight:700;">${G ? G.totalConf : 0}</div>
        <div style="font-size:8px;color:rgba(255,255,255,.3);">/ ${G ? G.cfg.fundingGoal : '—'} goal</div>
      </div>
      ${won ? `<div style="padding:10px 16px;background:${GOLD}11;border:1px solid ${GOLD}33;border-radius:10px;">
        <div style="font-size:8px;color:rgba(255,255,255,.45);font-family:Orbitron,monospace;letter-spacing:1px;">COINS EARNED</div>
        <div style="font-family:Orbitron,monospace;font-size:18px;color:${GOLD};font-weight:700;">+${coins}</div>
        <div style="font-size:8px;color:rgba(255,255,255,.3);">💰 ${stars}★ reward</div>
      </div>` : ''}
    </div>

    ${won ? `<div style="padding:8px 12px;background:rgba(74,222,128,.06);border:1px solid ${SUCCESS}33;border-radius:8px;font-size:10px;color:rgba(255,255,255,.55);margin-bottom:6px;">
      🏅 <strong style="color:${SUCCESS};">Pitch Master Badge</strong> unlocked
    </div>` : ''}

    <!-- lesson -->
    <div style="margin:12px 0;padding:12px;background:rgba(124,58,237,.08);border-left:3px solid ${AC};border-radius:0 8px 8px 0;text-align:left;">
      <div style="font-size:8px;font-family:Orbitron,monospace;color:${AC2};letter-spacing:1px;margin-bottom:4px;">END LESSON</div>
      <div style="font-size:11px;color:rgba(255,255,255,.7);line-height:1.6;">${lesson}</div>
    </div>

    <!-- buttons -->
    <div style="display:flex;gap:10px;justify-content:center;margin-top:4px;">
      <button id="ipaPlayAgain" style="padding:11px 22px;background:${AC};border:none;border-radius:9px;color:#fff;font-family:Orbitron,monospace;font-size:10px;letter-spacing:1px;cursor:pointer;">▶ PLAY AGAIN</button>
      <button id="ipaHubBtn" style="padding:11px 22px;background:none;border:1px solid ${AC}55;border-radius:9px;color:${AC2};font-family:Orbitron,monospace;font-size:10px;letter-spacing:1px;cursor:pointer;">← HUB</button>
    </div>
  </div>
</div>`;

    const pa = document.getElementById('ipaPlayAgain');
    if (pa) pa.onclick = () => {
      const ls = document.getElementById('ipaLevelSelect');
      if (ls) ls.style.display = 'flex';
      stage.innerHTML = '';
      G = null;
    };
    const hb = document.getElementById('ipaHubBtn');
    if (hb) hb.onclick = () => window.ll_investor_pitchExit && window.ll_investor_pitchExit();

    if (won) emitWinConfetti();
  }

  /* ══════════════════════════════════════════════════════════
     BACKGROUND CANVAS — ARENA
  ══════════════════════════════════════════════════════════ */
  let bgT = 0;
  function drawBg() {
    rafId = requestAnimationFrame(drawBg);
    if (!bgCtx || !bgCanvas) return;
    const W = bgCanvas.width, H = bgCanvas.height;
    bgCtx.clearRect(0, 0, W, H);

    bgT += 0.008;

    /* deep void gradient */
    const grad = bgCtx.createRadialGradient(W/2, H * .65, 0, W/2, H * .65, Math.max(W,H) * .8);
    grad.addColorStop(0, 'rgba(40,5,90,.7)');
    grad.addColorStop(0.4, 'rgba(15,2,35,.5)');
    grad.addColorStop(1, 'rgba(3,4,12,0)');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, W, H);

    /* stage floor glow */
    const floorY = H * .78;
    const floorGrad = bgCtx.createRadialGradient(W/2, floorY, 0, W/2, floorY, W * .55);
    floorGrad.addColorStop(0, `rgba(124,58,237,${.18 + .06 * Math.sin(bgT)})`);
    floorGrad.addColorStop(0.6, 'rgba(124,58,237,.04)');
    floorGrad.addColorStop(1, 'transparent');
    bgCtx.fillStyle = floorGrad;
    bgCtx.fillRect(0, 0, W, H);

    /* grid lines on floor */
    bgCtx.save();
    bgCtx.strokeStyle = `rgba(124,58,237,${.12 + .04 * Math.sin(bgT * .7)})`;
    bgCtx.lineWidth = 1;
    const gridOriginY = H * .85;
    const gridOriginX = W / 2;
    const lines = 12;
    for (let i = -lines; i <= lines; i++) {
      bgCtx.beginPath();
      bgCtx.moveTo(gridOriginX + i * (W / (lines * 1.2)), gridOriginY);
      bgCtx.lineTo(gridOriginX + i * W * 2.5, H + 100);
      bgCtx.stroke();
    }
    for (let j = 0; j < 8; j++) {
      const t = j / 8;
      const y = gridOriginY + (H - gridOriginY + 100) * t;
      const spread = (W * 2.5) * t;
      bgCtx.beginPath();
      bgCtx.moveTo(gridOriginX - spread, y);
      bgCtx.lineTo(gridOriginX + spread, y);
      bgCtx.stroke();
    }
    bgCtx.restore();

    /* spotlight beams */
    const beams = [
      { x: W * .25, col: '#7C3AED', phase: 0 },
      { x: W * .75, col: '#a855f7', phase: Math.PI },
      { x: W * .5,  col: '#c084fc', phase: Math.PI / 2 },
    ];
    beams.forEach(b => {
      const alpha = .07 + .04 * Math.sin(bgT * 1.3 + b.phase);
      const bGrad = bgCtx.createLinearGradient(b.x, 0, b.x, H * .75);
      bGrad.addColorStop(0, b.col.replace(')', `,${alpha})`).replace('rgb', 'rgba'));
      bGrad.addColorStop(1, 'transparent');
      bgCtx.save();
      bgCtx.beginPath();
      const spread = 60 + 20 * Math.sin(bgT * .5 + b.phase);
      bgCtx.moveTo(b.x - 8, 0);
      bgCtx.lineTo(b.x + 8, 0);
      bgCtx.lineTo(b.x + spread, H * .75);
      bgCtx.lineTo(b.x - spread, H * .75);
      bgCtx.closePath();
      bgCtx.fillStyle = bGrad;
      bgCtx.fill();
      bgCtx.restore();
    });

    /* floating platform dots */
    drawParticles();
  }

  /* ── arena particles ────────────────────────────────────── */
  function spawnArenaParticles(canvas) {
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    particles = [];
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H * .7,
        r: Math.random() * 2 + .5,
        vx: (Math.random() - .5) * .3,
        vy: -.15 - Math.random() * .2,
        alpha: Math.random() * .5 + .2,
        color: Math.random() > .5 ? AC : AC2,
        canvas,
      });
    }
  }

  function drawParticles() {
    if (!particles.length) return;
    const cv = particles[0].canvas;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = H * .7; p.x = Math.random() * W; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    });
  }

  /* ── confetti burst on correct answer ───────────────────── */
  function emitConfetti(refEl) {
    const root = document.getElementById('ipaRoot');
    if (!root) return;
    const rect = refEl ? refEl.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2 };
    const colors = [AC, AC2, AC3, GOLD, SUCCESS];
    for (let i = 0; i < 18; i++) {
      const dot = document.createElement('div');
      const angle = (Math.random() * 360) * (Math.PI / 180);
      const dist = 60 + Math.random() * 80;
      dot.style.cssText = `position:fixed;left:${rect.left + (refEl ? refEl.offsetWidth/2 : 0)}px;top:${rect.top}px;width:6px;height:6px;border-radius:${Math.random()>.5?'50%':'2px'};background:${colors[Math.floor(Math.random()*colors.length)]};pointer-events:none;z-index:999;transition:all .7s cubic-bezier(.2,.8,.4,1);`;
      document.body.appendChild(dot);
      setTimeout(() => {
        dot.style.transform = `translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist - 60}px) rotate(${Math.random()*360}deg)`;
        dot.style.opacity = '0';
      }, 20);
      setTimeout(() => dot.remove(), 800);
    }
  }

  function emitWinConfetti() {
    const colors = [AC, AC2, AC3, GOLD, SUCCESS, '#fff'];
    for (let i = 0; i < 60; i++) {
      setTimeout(() => {
        const dot = document.createElement('div');
        const x = Math.random() * window.innerWidth;
        dot.style.cssText = `position:fixed;left:${x}px;top:-10px;width:${4+Math.random()*6}px;height:${4+Math.random()*6}px;border-radius:${Math.random()>.5?'50%':'2px'};background:${colors[Math.floor(Math.random()*colors.length)]};pointer-events:none;z-index:999;transition:all ${1+Math.random()}s linear;`;
        document.body.appendChild(dot);
        setTimeout(() => {
          dot.style.transform = `translateY(${window.innerHeight + 40}px) rotate(${Math.random()*720}deg)`;
          dot.style.opacity = '.2';
        }, 30);
        setTimeout(() => dot.remove(), 2200);
      }, i * 40);
    }
  }

})();
