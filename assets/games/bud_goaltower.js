/* ════════════════════════════════════════════════════════════════
   GOAL TRACKER TOWER — Budgetron Base / Strategist Hub
   Stack milestone cards onto the tower in the correct sequential order.
   Correct order → glowing floor added, score gained.
   Wrong order → tower wobble, time penalty, floor lost.
   Level 1: One goal, 4-6 milestones, learn sequencing.
   Level 2: Three simultaneous goals, shared resource tokens, setbacks.
   WIN: Complete all goals before time expires.
   ════════════════════════════════════════════════════════════════ */
(function () {
  /* ── constants ─────────────────────────────────────────────── */
  const ACC = '#1a2a4a';          // hub accent (navy)
  const ACC2 = '#2a4a8a';         // lighter accent
  const GOLD = '#fbbf24';
  const VIOLET = '#7c3aed';
  const VIOLET_LT = '#a78bfa';
  const VIOLET_MED = '#6d28d9';
  const TEAL = '#14b8a6';
  const DANGER = '#ef4444';
  const GOOD = '#22c55e';

  const ROUND_L1 = 90;   // seconds level 1
  const ROUND_L2 = 120;  // seconds level 2

  // Star thresholds (score)
  // Level 1 max score: 4 milestones × combo pts + 200 goal bonus ≈ 800
  // Level 2 max score: 14 milestones × combo pts + 600 goal bonus ≈ 3000+
  const STAR3 = 700;
  const STAR2 = 400;

  let G = null;
  let raf = null;
  let currentLevel = 1;
  let endTimer = null;  // setTimeout ID for endGame calls
  let restartLoop = null; // set by initGame so endGame can restart the RAF loop

  /* ── lesson facts ──────────────────────────────────────────── */
  const FACTS = [
    ['🎯', 'Every big goal starts with a single first step — identify it before you start saving.'],
    ['💰', 'Saving consistently (even small amounts) beats saving sporadically in large bursts.'],
    ['🛑', 'Impulse purchases derail goals more than large planned expenses.'],
    ['📋', 'A written plan is 42% more likely to be achieved than an unwritten one.'],
    ['⏰', 'Time in the market beats timing the market — start saving early, keep the habit.'],
    ['🔑', 'Sequencing matters: creating a budget before saving prevents overspending gaps.'],
    ['🏆', 'Small wins (milestones) build momentum — track every completed step.']
  ];

  /* ── goal definitions ──────────────────────────────────────── */
  const GOAL_DEFS = [
    {
      id: 'bike',
      name: 'Buy a Bike',
      icon: '🚲',
      color: VIOLET_LT,
      milestones: [
        { id: 0, label: 'Create Budget',          icon: '📋', desc: 'Map income and expenses' },
        { id: 1, label: 'Save Weekly',             icon: '💰', desc: 'Set aside $20/week' },
        { id: 2, label: 'Avoid Impulse Buys',      icon: '🛑', desc: 'Skip unnecessary spending' },
        { id: 3, label: 'Reach Goal',              icon: '🏆', desc: 'Hit your savings target' }
      ]
    },
    {
      id: 'laptop',
      name: 'Buy a Laptop',
      icon: '💻',
      color: TEAL,
      milestones: [
        { id: 0, label: 'Research Price',          icon: '🔍', desc: 'Find best deal' },
        { id: 1, label: 'Open Savings Account',    icon: '🏦', desc: 'Dedicate account' },
        { id: 2, label: 'Auto-Transfer',           icon: '⚡', desc: 'Automate weekly saves' },
        { id: 3, label: 'Avoid Subscriptions',     icon: '✂️', desc: 'Cut trial signups' },
        { id: 4, label: 'Reach Goal',              icon: '🏆', desc: 'Hit your savings target' }
      ]
    },
    {
      id: 'trip',
      name: 'Plan a Trip',
      icon: '✈️',
      color: GOLD,
      milestones: [
        { id: 0, label: 'Set Trip Budget',         icon: '📋', desc: 'Calculate total cost' },
        { id: 1, label: 'Cut Dining Out',          icon: '🥗', desc: 'Cook at home more' },
        { id: 2, label: 'Weekly Transfer',         icon: '💰', desc: 'Move money to trip fund' },
        { id: 3, label: 'Book in Advance',         icon: '📅', desc: 'Lock in lower prices' },
        { id: 4, label: 'Reach Goal',              icon: '🏆', desc: 'Ready to go!' }
      ]
    }
  ];

  /* ── setback events (level 2 only) ────────────────────────── */
  const SETBACKS = [
    { label: 'Impulse Purchase!', icon: '🛍️', desc: 'Spent $30 on impulse', cost: 1 },
    { label: 'Emergency Cost!',   icon: '🚨', desc: 'Unexpected bill arrived', cost: 1 },
    { label: 'Price Increase!',   icon: '📈', desc: 'Goal costs more now', cost: 1 },
    { label: 'Missed Transfer!',  icon: '⏰', desc: 'Forgot to save this week', cost: 1 }
  ];

  /* ── state factory ─────────────────────────────────────────── */
  function makeGoalState(def) {
    return {
      def,
      placed: [],           // correctly placed milestone ids in order
      needed: 0,            // index of next expected milestone
      complete: false,
      wobble: 0,            // shake timer on wrong placement
      glow: 0,              // new floor glow timer
      trophyGlow: 0,
      trophyBounce: 0
    };
  }

  function reset(level) {
    currentLevel = level || 1;
    const timeLimit = currentLevel === 1 ? ROUND_L1 : ROUND_L2;
    const goals = currentLevel === 1
      ? [makeGoalState(GOAL_DEFS[0])]
      : [makeGoalState(GOAL_DEFS[0]), makeGoalState(GOAL_DEFS[1]), makeGoalState(GOAL_DEFS[2])];

    // Build card queue from all goals' milestones, shuffled
    const cards = [];
    for (const gs of goals) {
      for (const ms of gs.def.milestones) {
        cards.push({ goalId: gs.def.id, ms });
      }
    }
    shuffle(cards);

    G = {
      phase: 'play',
      level: currentLevel,
      score: 0,
      combo: 0,
      time: timeLimit,
      last: performance.now(),
      goals,
      cards,               // remaining cards in queue
      hand: [],            // cards in player's "hand" (shown in sidebar)
      maxHand: currentLevel === 1 ? 3 : 4,
      dragCard: null,      // { cardIdx, x, y, startX, startY }
      floats: [],          // floating score texts
      particles: [],       // burst particles
      shake: 0,
      flashGood: 0,
      flashBad: 0,
      wobbleGlobal: 0,
      tokens: { time: currentLevel === 1 ? 0 : 5, money: currentLevel === 1 ? 0 : 5 },
      setbackT: currentLevel === 1 ? 9999 : 25,
      setbackActive: null,
      factIdx: 0,
      gateT: currentLevel === 1 ? 30 : 40,
      gateOpen: false,
      perfectPlacements: 0,
      wrongPlacements: 0,
      started: performance.now(),
      won: false,
      lost: false
    };

    // deal initial hand
    dealCards();
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function dealCards() {
    while (G.hand.length < G.maxHand && G.cards.length > 0) {
      G.hand.push(G.cards.pop());
    }
  }

  /* ── screen registration ───────────────────────────────────── */
  window.SCREENS.game_bud_goaltower = function () {
    G = null;
    setTimeout(initGame, 40);
    return `<div id="gtRoot" style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#0d1433,#06091a 55%,#03040c);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <!-- top bar -->
      <div style="position:absolute;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;gap:10px;padding:11px 16px;background:linear-gradient(180deg,rgba(3,4,12,.9),transparent)">
        <button onclick="window.bud_goaltowerExit()" style="padding:6px 13px;border:1px solid rgba(26,42,74,.7);border-radius:9px;background:rgba(26,42,74,.35);color:#93c5fd;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer;flex-shrink:0">← BASE</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.18em;color:#a78bfa;flex:1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🏗 GOAL TRACKER TOWER</div>
        <div id="gtHudRight" style="display:flex;gap:8px;align-items:center;flex-shrink:0">
          <div id="gtScore" style="font-family:'Orbitron',sans-serif;font-size:.75rem;color:${GOLD};min-width:40px;text-align:right">0</div>
          <div id="gtTime" style="font-family:'Orbitron',sans-serif;font-size:.75rem;color:#60a5fa;min-width:38px;text-align:right">90s</div>
        </div>
      </div>
      <!-- canvas -->
      <canvas id="gtCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>
      <!-- knowledge gate overlay -->
      <div id="gtGate" style="position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.88);backdrop-filter:blur(6px);padding:24px"></div>
      <!-- setback overlay -->
      <div id="gtSetback" style="position:absolute;inset:0;z-index:19;display:none;align-items:center;justify-content:center;background:rgba(10,4,30,.82);backdrop-filter:blur(4px)"></div>
      <!-- end overlay -->
      <div id="gtOver" style="position:absolute;inset:0;z-index:25;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.9);backdrop-filter:blur(6px)"></div>
    </div>`;
  };

  /* ── exit ──────────────────────────────────────────────────── */
  window.bud_goaltowerExit = function () {
    if (endTimer) { clearTimeout(endTimer); endTimer = null; }
    if (G && G._cleanup) G._cleanup();
    G = null;
    cancelAnimationFrame(raf);
    raf = null;
    if (window.state) state.viewingWorld = 'strategist';
    goTo('hub');
  };

  /* ── init ──────────────────────────────────────────────────── */
  function initGame() {
    reset(1);
    const cv = document.getElementById('gtCanvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');

    function resize() {
      cv.width = cv.clientWidth * devicePixelRatio;
      cv.height = cv.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    /* ── pointer / touch input ─────────────────────────────── */
    function pDown(cx, cy) {
      if (!G || G.phase !== 'play') return;
      const r = cv.getBoundingClientRect();
      const W = cv.clientWidth, H = cv.clientHeight;
      const fx = (cx - r.left), fy = (cy - r.top);

      // check if clicking a card in the hand panel
      const handLayout = getHandLayout(W, H);
      for (let i = 0; i < G.hand.length; i++) {
        const slot = handLayout[i];
        if (!slot) continue;
        if (fx >= slot.x && fx <= slot.x + slot.w && fy >= slot.y && fy <= slot.y + slot.h) {
          G.dragCard = {
            cardIdx: i,
            card: G.hand[i],
            x: fx, y: fy,
            startX: fx, startY: fy,
            originSlot: slot
          };
          return;
        }
      }
    }

    function pMove(cx, cy) {
      if (!G || !G.dragCard) return;
      const r = cv.getBoundingClientRect();
      G.dragCard.x = cx - r.left;
      G.dragCard.y = cy - r.top;
    }

    function pUp(cx, cy) {
      if (!G || !G.dragCard) return;
      const r = cv.getBoundingClientRect();
      const W = cv.clientWidth, H = cv.clientHeight;
      const fx = cx - r.left, fy = cy - r.top;
      const dc = G.dragCard;
      G.dragCard = null;

      // find which tower slot was dropped on
      const towers = getTowerLayout(W, H);
      let dropped = false;
      for (let ti = 0; ti < towers.length; ti++) {
        const tw = towers[ti];
        if (fx >= tw.x && fx <= tw.x + tw.w && fy >= tw.dropY && fy <= tw.dropY + tw.dropH) {
          placeCard(dc.card, dc.cardIdx, ti);
          dropped = true;
          break;
        }
      }
      if (!dropped) {
        // just return to hand, no action
      }
    }

    function onMouseMove(e) { if (G && G.dragCard) pMove(e.clientX, e.clientY); }
    function onMouseUp(e) { if (G && G.dragCard) pUp(e.clientX, e.clientY); }
    cv.addEventListener('mousedown', e => pDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    cv.addEventListener('touchstart', e => { if (e.touches[0]) { pDown(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, { passive: false });
    cv.addEventListener('touchmove', e => { if (e.touches[0]) { pMove(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, { passive: false });
    cv.addEventListener('touchend', e => { const t = e.changedTouches && e.changedTouches[0]; if (t) pUp(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });

    /* ── keyboard: 1/2/3 to place top card into goal ──────── */
    window.addEventListener('keydown', kd);
    function kd(e) {
      if (!G || G.phase !== 'play') return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= G.goals.length) {
        const card = G.hand[0];
        if (card) placeCard(card, 0, n - 1);
      }
    }

    G._cleanup = () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', kd);
    };

    G.last = performance.now();
    restartLoop = function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);

    function loop(now) {
      const cvEl = document.getElementById('gtCanvas');
      if (!cvEl || !G) { cancelAnimationFrame(raf); raf = null; return; }
      const ctxL = cvEl.getContext('2d');
      const W = cvEl.clientWidth, H = cvEl.clientHeight;
      let dt = Math.min(50, now - G.last) / 1000;
      G.last = now;
      if (G.phase === 'play') update(dt);
      render(ctxL, W, H, now);
      raf = requestAnimationFrame(loop);
    }
  }

  /* ── layout helpers ────────────────────────────────────────── */
  function getTowerLayout(W, H) {
    const n = G.goals.length;
    const topBar = 52;
    const handH = getHandH(H);
    const towerArea = H - topBar - handH - 16;
    const padding = 12;
    const totalW = W - padding * 2;
    const towerW = Math.min(140, (totalW - (n - 1) * 10) / n);
    const startX = (W - (towerW * n + (n - 1) * 10)) / 2;

    return G.goals.map((gs, i) => ({
      x: startX + i * (towerW + 10),
      y: topBar + 8,
      w: towerW,
      h: towerArea,
      dropY: topBar + 8,
      dropH: towerArea
    }));
  }

  function getHandH(H) {
    return Math.min(220, H * 0.33);
  }

  function getHandLayout(W, H) {
    const handH = getHandH(H);
    const handY = H - handH;
    const cardW = Math.min(90, (W - 16) / G.maxHand - 8);
    const cardH = Math.min(115, handH - 16);
    const totalW = G.hand.length * (cardW + 8) - 8;
    const startX = (W - totalW) / 2;

    return G.hand.map((card, i) => ({
      x: startX + i * (cardW + 8),
      y: handY + 8,
      w: cardW,
      h: cardH,
      card
    }));
  }

  /* ── place card logic ──────────────────────────────────────── */
  function placeCard(card, handIdx, goalIdx) {
    const gs = G.goals[goalIdx];
    if (!gs || gs.complete) return;

    const ms = gs.def.milestones[gs.needed];
    const correct = card.goalId === gs.def.id && card.ms.id === ms.id;

    // remove from hand
    G.hand.splice(handIdx, 1);
    dealCards();

    if (correct) {
      gs.placed.push(card.ms);
      gs.needed++;
      gs.glow = 1.2;
      G.combo++;
      G.perfectPlacements++;
      const pts = 100 + G.combo * 20;
      G.score += pts;
      floatTxt(0.5, 0.5, '+' + pts, GOLD);
      burst(0.5, 0.3, VIOLET_LT, 14);
      G.flashGood = 0.3;

      if (gs.needed >= gs.def.milestones.length) {
        gs.complete = true;
        gs.trophyGlow = 2;
        gs.trophyBounce = 1;
        G.score += 200;
        floatTxt(0.5, 0.4, 'GOAL COMPLETE! +200', GOLD);
        burst(0.5, 0.35, GOLD, 22);
        checkWin();
      }
    } else {
      // wrong placement — wobble and penalize
      gs.wobble = 0.6;
      G.wobbleGlobal = 0.3;
      G.combo = 0;
      G.wrongPlacements++;
      G.time = Math.max(5, G.time - 8);
      G.flashBad = 0.35;
      floatTxt(0.5, 0.45, 'OOPS — WRONG ORDER! -8s', DANGER);
      burst(0.5, 0.45, DANGER, 10);

      // knock back: if goal has a placed milestone, remove last one
      if (gs.placed.length > 0) {
        const knocked = gs.placed.pop();
        gs.needed--;
        // put it back into the shuffle (re-add a card for it)
        G.cards.push({ goalId: gs.def.id, ms: knocked });
        shuffle(G.cards);
        floatTxt(0.5, 0.52, gs.def.name + ': step knocked back!', '#fca5a5');
      }

      // put the card back in hand
      G.hand.push(card);
    }
  }

  function checkWin() {
    const allDone = G.goals.every(gs => gs.complete);
    if (allDone) {
      G.won = true;
      G.phase = 'end';
      endTimer = setTimeout(() => endGame(calcStars()), 800);
    }
  }

  function calcStars() {
    if (G.score >= STAR3 && G.time > 0 && G.wrongPlacements === 0) return 3;
    if (G.score >= STAR2) return 2;
    if (G.score > 0) return 1;
    return 1;
  }

  /* ── update ────────────────────────────────────────────────── */
  function update(dt) {
    // timer
    G.time -= dt;
    const tEl = document.getElementById('gtTime');
    if (tEl) tEl.textContent = Math.max(0, Math.ceil(G.time)) + 's';
    const sEl = document.getElementById('gtScore');
    if (sEl) sEl.textContent = G.score;

    if (G.time <= 0 && !G.won) {
      G.time = 0;
      G.phase = 'end';
      G.lost = true;
      endTimer = setTimeout(() => endGame(calcStars()), 600);
      return;
    }

    // knowledge gate
    G.gateT -= dt;
    if (G.gateT <= 0 && !G.gateOpen) {
      openGate();
      return;
    }

    // setback timer (level 2)
    if (G.level === 2) {
      G.setbackT -= dt;
      if (G.setbackT <= 0) {
        G.setbackT = 22 + Math.random() * 18;
        triggerSetback();
      }
    }

    // update effects
    G.shake = Math.max(0, G.shake - dt * 3);
    G.flashGood = Math.max(0, G.flashGood - dt * 2);
    G.flashBad = Math.max(0, G.flashBad - dt * 2);
    G.wobbleGlobal = Math.max(0, G.wobbleGlobal - dt * 3);

    for (const gs of G.goals) {
      gs.wobble = Math.max(0, gs.wobble - dt * 2.5);
      gs.glow = Math.max(0, gs.glow - dt * 1.2);
      if (gs.trophyBounce > 0) gs.trophyBounce = Math.max(0, gs.trophyBounce - dt * 1.5);
      if (gs.trophyGlow > 0) gs.trophyGlow = Math.max(0, gs.trophyGlow - dt * 0.8);
    }

    // floats
    for (const f of G.floats) { f.y -= dt * 60; f.life -= dt; }
    G.floats = G.floats.filter(f => f.life > 0);

    // particles
    for (const p of G.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 280 * dt;
      p.life -= dt;
      p.alpha = p.life / p.maxLife;
    }
    G.particles = G.particles.filter(p => p.life > 0);
  }

  /* ── render ────────────────────────────────────────────────── */
  function render(ctx, W, H, now) {
    ctx.clearRect(0, 0, W, H);

    // screen shake
    const sk = G ? G.shake * 6 : 0;
    ctx.save();
    if (sk > 0) ctx.translate((Math.random() - 0.5) * sk, (Math.random() - 0.5) * sk);

    // flash overlays
    if (G && G.flashGood > 0) {
      ctx.fillStyle = `rgba(124,58,237,${G.flashGood * 0.18})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (G && G.flashBad > 0) {
      ctx.fillStyle = `rgba(239,68,68,${G.flashBad * 0.22})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (!G) { ctx.restore(); return; }

    drawBackground(ctx, W, H, now);

    const towers = getTowerLayout(W, H);
    for (let i = 0; i < G.goals.length; i++) {
      drawTower(ctx, G.goals[i], towers[i], W, H, now);
    }

    drawHandPanel(ctx, W, H, now);
    drawDragCard(ctx, W, H, now);
    drawFloats(ctx, W, H);
    drawParticles(ctx, W, H);
    drawHint(ctx, W, H, now);

    ctx.restore();
  }

  function drawBackground(ctx, W, H, now) {
    // subtle grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(26,42,74,0.25)';
    ctx.lineWidth = 0.5;
    const gridS = 40;
    for (let x = 0; x < W; x += gridS) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gridS) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // ambient city glow at bottom
    const grd = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, W * 0.7);
    grd.addColorStop(0, 'rgba(124,58,237,0.12)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawTower(ctx, gs, tw, W, H, now) {
    const { x, y, w, h } = tw;
    const ms = gs.def.milestones;
    const totalFloors = ms.length;
    const placedCount = gs.placed.length;
    const floorH = Math.min(38, (h - 60) / totalFloors);
    const towerW = w - 8;
    const towerX = x + 4;
    const groundY = y + h - 10;
    const towerBaseY = groundY - totalFloors * floorH;

    // tower wobble
    const wobbleX = gs.wobble > 0 ? Math.sin(now * 0.04) * gs.wobble * 8 : 0;

    ctx.save();
    ctx.translate(wobbleX, 0);

    // tower column (ghost outline)
    ctx.strokeStyle = `rgba(124,58,237,0.2)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(towerX, towerBaseY, towerW, totalFloors * floorH);
    ctx.setLineDash([]);

    // ghost floor slots (unplaced)
    for (let fi = 0; fi < totalFloors; fi++) {
      const fy = groundY - (fi + 1) * floorH;
      const isPlaced = fi < placedCount;
      if (!isPlaced) {
        ctx.fillStyle = 'rgba(26,42,74,0.3)';
        ctx.fillRect(towerX + 1, fy + 1, towerW - 2, floorH - 2);
        // slot label
        ctx.fillStyle = 'rgba(167,139,250,0.25)';
        ctx.font = `bold ${Math.floor(floorH * 0.28)}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ms[fi].label, towerX + towerW / 2, fy + floorH / 2);
      }
    }

    // placed floors (glowing)
    for (let fi = 0; fi < placedCount; fi++) {
      const fy = groundY - (fi + 1) * floorH;
      const isNewest = fi === placedCount - 1;
      const glowAmt = isNewest ? gs.glow : 0;
      const alpha = 0.65 + glowAmt * 0.35;

      // floor fill
      const grad = ctx.createLinearGradient(towerX, fy, towerX + towerW, fy + floorH);
      const baseC = gs.def.color;
      grad.addColorStop(0, hexAlpha(baseC, alpha * 0.6));
      grad.addColorStop(0.5, hexAlpha(baseC, alpha));
      grad.addColorStop(1, hexAlpha(baseC, alpha * 0.5));
      ctx.fillStyle = grad;
      ctx.fillRect(towerX, fy, towerW, floorH);

      // glow border
      const glowStr = 0.5 + glowAmt * 0.5;
      ctx.strokeStyle = `rgba(167,139,250,${glowStr})`;
      ctx.lineWidth = isNewest ? 2 + glowAmt * 2 : 1;
      ctx.strokeRect(towerX, fy, towerW, floorH);

      // floor glow halo
      if (glowAmt > 0.2) {
        ctx.shadowColor = VIOLET_LT;
        ctx.shadowBlur = glowAmt * 24;
        ctx.strokeRect(towerX, fy, towerW, floorH);
        ctx.shadowBlur = 0;
      }

      // floor label
      const placed = gs.placed[fi];
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.floor(floorH * 0.3)}px Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(placed.icon + ' ' + placed.label, towerX + towerW / 2, fy + floorH / 2);
    }

    // ground platform
    const pfGrad = ctx.createLinearGradient(towerX, groundY, towerX + towerW, groundY + 10);
    pfGrad.addColorStop(0, 'rgba(26,42,74,0.8)');
    pfGrad.addColorStop(1, 'rgba(26,42,74,0.4)');
    ctx.fillStyle = pfGrad;
    ctx.fillRect(towerX - 6, groundY, towerW + 12, 10);
    ctx.strokeStyle = VIOLET_LT;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(towerX - 6, groundY, towerW + 12, 10);

    // building name
    ctx.fillStyle = gs.def.color;
    ctx.font = `bold ${Math.min(12, towerW * 0.11)}px 'Orbitron', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(gs.def.icon + ' ' + gs.def.name, towerX + towerW / 2, y + h - 2);

    // trophy at top
    const topY = groundY - totalFloors * floorH;
    if (gs.complete) {
      const bounce = gs.trophyBounce > 0 ? Math.sin(now * 0.015) * 8 : 0;
      const glow = gs.trophyGlow;
      ctx.font = `${Math.min(36, towerW * 0.3)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      if (glow > 0) {
        ctx.shadowColor = GOLD;
        ctx.shadowBlur = glow * 28;
      }
      ctx.fillText('🏆', towerX + towerW / 2, topY - 4 + bounce);
      ctx.shadowBlur = 0;
    } else {
      // next milestone indicator
      if (gs.needed < ms.length) {
        const nextMs = ms[gs.needed];
        ctx.fillStyle = 'rgba(167,139,250,0.5)';
        ctx.font = `${Math.min(13, towerW * 0.11)}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('▲ ' + nextMs.label, towerX + towerW / 2, topY - 4);
      }
    }

    // drop zone indicator when dragging
    if (G.dragCard) {
      ctx.strokeStyle = `rgba(167,139,250,0.7)`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(towerX - 4, tw.dropY + 4, towerW + 8, tw.dropH - 8);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function drawHandPanel(ctx, W, H, now) {
    const handH = getHandH(H);
    const handY = H - handH;

    // panel bg
    const panelGrad = ctx.createLinearGradient(0, handY, 0, H);
    panelGrad.addColorStop(0, 'rgba(3,4,12,0.3)');
    panelGrad.addColorStop(1, 'rgba(10,6,26,0.95)');
    ctx.fillStyle = panelGrad;
    ctx.fillRect(0, handY, W, handH);

    // panel top border
    ctx.strokeStyle = 'rgba(124,58,237,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, handY);
    ctx.lineTo(W, handY);
    ctx.stroke();

    // label
    ctx.fillStyle = 'rgba(167,139,250,0.6)';
    ctx.font = '9px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('MILESTONE CARDS — DRAG TO TOWER', W / 2, handY + 4);

    // draw cards
    const handLayout = getHandLayout(W, H);
    for (let i = 0; i < G.hand.length; i++) {
      const slot = handLayout[i];
      const card = G.hand[i];
      if (!slot) continue;

      // skip if being dragged
      if (G.dragCard && G.dragCard.cardIdx === i) {
        // draw ghost
        ctx.save();
        ctx.globalAlpha = 0.3;
        drawCard(ctx, card, slot.x, slot.y, slot.w, slot.h, now);
        ctx.restore();
        continue;
      }

      drawCard(ctx, card, slot.x, slot.y, slot.w, slot.h, now);
    }

    // tokens (level 2)
    if (G.level === 2) {
      ctx.fillStyle = 'rgba(251,191,36,0.8)';
      ctx.font = '10px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('⏰ ' + G.tokens.time + '  💵 ' + G.tokens.money, 12, H - 4);
    }
  }

  function drawCard(ctx, card, cx, cy, cw, ch, now) {
    const gs = G.goals.find(g => g.def.id === card.goalId);
    const accentC = gs ? gs.def.color : VIOLET_LT;

    // card bg
    const cGrad = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
    cGrad.addColorStop(0, 'rgba(15,10,35,0.92)');
    cGrad.addColorStop(1, 'rgba(26,18,60,0.92)');
    ctx.fillStyle = cGrad;
    roundRect(ctx, cx, cy, cw, ch, 8);
    ctx.fill();

    // card border
    ctx.strokeStyle = hexAlpha(accentC, 0.7);
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx, cy, cw, ch, 8);
    ctx.stroke();

    // goal color stripe top
    ctx.fillStyle = hexAlpha(accentC, 0.5);
    roundRectTop(ctx, cx, cy, cw, 6, 8);
    ctx.fill();

    // goal icon + name
    ctx.fillStyle = accentC;
    ctx.font = `bold 8px 'Orbitron', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const goalName = gs ? gs.def.icon + ' ' + gs.def.name : '?';
    ctx.fillText(goalName, cx + cw / 2, cy + 10);

    // milestone icon
    ctx.font = `${Math.min(28, ch * 0.28)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.ms.icon, cx + cw / 2, cy + ch * 0.45);

    // milestone label
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold ${Math.min(10, cw * 0.12)}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    wrapText(ctx, card.ms.label, cx + cw / 2, cy + ch * 0.7, cw - 8, 12);
  }

  function drawDragCard(ctx, W, H, now) {
    if (!G.dragCard) return;
    const dc = G.dragCard;
    const cw = 92, ch = 118;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = VIOLET_LT;
    ctx.shadowBlur = 18;
    drawCard(ctx, dc.card, dc.x - cw / 2, dc.y - ch / 2, cw, ch, now);
    ctx.restore();
  }

  function drawFloats(ctx, W, H) {
    for (const f of G.floats) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, f.life * 2.5);
      ctx.font = `bold ${f.size || 16}px 'Orbitron', sans-serif`;
      ctx.fillStyle = f.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  function drawParticles(ctx, W, H) {
    for (const p of G.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawHint(ctx, W, H, now) {
    if (G.phase !== 'play') return;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.002);
    ctx.fillStyle = `rgba(167,139,250,${0.35 + pulse * 0.15})`;
    ctx.font = '9px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const hint = G.level === 1
      ? 'DRAG cards onto the correct tower in order · Press 1 to place top card'
      : 'DRAG cards onto towers · Keys 1/2/3 to place · Order matters!';
    ctx.fillText(hint, W / 2, H - getHandH(H) - 4);
  }

  /* ── helper drawing utils ──────────────────────────────────── */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function roundRectTop(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    let ly = y;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, ly);
        line = word;
        ly += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, ly);
  }

  function hexAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* ── effect helpers ────────────────────────────────────────── */
  function floatTxt(nx, ny, text, color) {
    if (!G) return;
    const cvEl = document.getElementById('gtCanvas');
    if (!cvEl) return;
    const W = cvEl.clientWidth, H = cvEl.clientHeight;
    G.floats.push({ x: nx * W, y: ny * H, text, color, life: 1.6, size: 15 });
  }

  function burst(nx, ny, color, n) {
    if (!G) return;
    const cvEl = document.getElementById('gtCanvas');
    if (!cvEl) return;
    const W = cvEl.clientWidth, H = cvEl.clientHeight;
    const px = nx * W, py = ny * H;
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const spd = 60 + Math.random() * 120;
      G.particles.push({
        x: px, y: py,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 60,
        color, r: 2 + Math.random() * 3,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0, alpha: 1
      });
    }
  }

  /* ── knowledge gate ────────────────────────────────────────── */
  function openGate() {
    if (!G || G.gateOpen) return;
    G.gateOpen = true;
    G.phase = 'gate';
    G.gateT = G.level === 1 ? 30 : 40;

    const fact = FACTS[G.factIdx % FACTS.length];
    G.factIdx++;

    const el = document.getElementById('gtGate');
    if (!el) return;

    el.innerHTML = `
      <div style="max-width:340px;width:100%;text-align:center">
        <div style="font-size:2.8rem;margin-bottom:12px">${fact[0]}</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:.65rem;letter-spacing:.18em;color:${VIOLET_LT};margin-bottom:14px">KNOWLEDGE GATE</div>
        <div style="font-size:1.05rem;line-height:1.6;color:#e2e8f0;margin-bottom:22px;font-weight:500">${fact[1]}</div>
        <button id="gtGateContinue" style="padding:12px 32px;border-radius:10px;border:1.5px solid ${VIOLET_LT};background:rgba(124,58,237,0.25);color:#c4b5fd;font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.14em;cursor:pointer">CONTINUE BUILDING →</button>
      </div>`;
    el.style.display = 'flex';

    document.getElementById('gtGateContinue').addEventListener('click', () => {
      el.style.display = 'none';
      G.gateOpen = false;
      G.phase = 'play';
    });
  }

  /* ── setback (level 2) ─────────────────────────────────────── */
  function triggerSetback() {
    G.phase = 'setback';
    const sb = SETBACKS[Math.floor(Math.random() * SETBACKS.length)];
    G.setbackActive = sb;

    // knock back a random incomplete goal's last milestone
    const incomplete = G.goals.filter(gs => !gs.complete && gs.placed.length > 0);
    let affectedGoal = null;
    if (incomplete.length > 0) {
      affectedGoal = incomplete[Math.floor(Math.random() * incomplete.length)];
      const knocked = affectedGoal.placed.pop();
      affectedGoal.needed--;
      affectedGoal.wobble = 0.8;
      G.cards.push({ goalId: affectedGoal.def.id, ms: knocked });
      shuffle(G.cards);
      dealCards();
    }

    const el = document.getElementById('gtSetback');
    if (!el) return;

    el.innerHTML = `
      <div style="max-width:320px;width:100%;text-align:center;border:1.5px solid rgba(239,68,68,0.6);border-radius:16px;padding:28px;background:rgba(10,4,20,0.95)">
        <div style="font-size:2.4rem;margin-bottom:10px">${sb.icon}</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.18em;color:${DANGER};margin-bottom:10px">SETBACK EVENT</div>
        <div style="font-size:1.1rem;font-weight:700;color:#fca5a5;margin-bottom:8px">${sb.label}</div>
        <div style="color:rgba(255,255,255,0.7);font-size:.9rem;margin-bottom:6px">${sb.desc}</div>
        ${affectedGoal ? `<div style="color:rgba(251,191,36,0.8);font-size:.85rem;margin-bottom:18px">⚠️ ${affectedGoal.def.name}: Last step knocked back — resequence!</div>` : '<div style="margin-bottom:18px;color:rgba(255,255,255,.6)">No active milestones to knock back.</div>'}
        <button id="gtSbContinue" style="padding:11px 28px;border-radius:10px;border:1.5px solid rgba(239,68,68,0.5);background:rgba(239,68,68,0.18);color:#fca5a5;font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.13em;cursor:pointer">GOT IT — KEEP GOING</button>
      </div>`;
    el.style.display = 'flex';

    document.getElementById('gtSbContinue').addEventListener('click', () => {
      el.style.display = 'none';
      G.setbackActive = null;
      G.phase = 'play';
    });
  }

  /* ── end game ──────────────────────────────────────────────── */
  function endGame(stars) {
    if (!G) return;
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bud_goaltower', { level: G.level, stars, badge: 'Goal Getter', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    const won = G.won;
    const scoreVal = G.score;
    // feed shared Budgetron Budget Meter — goal progress score, penalty on timeout
    if (window.budgetDelta) budgetDelta(won ? scoreVal : -300);
    const level = G.level;
    const wrong = G.wrongPlacements;
    const perfect = G.perfectPlacements;

    const el = document.getElementById('gtOver');
    if (!el) return;

    const starHTML = stars >= 3 ? '⭐⭐⭐' : stars === 2 ? '⭐⭐' : stars >= 1 ? '⭐' : '☆';
    const titleText = won ? (stars === 3 ? '🏆 PERFECT TOWER!' : stars === 2 ? '✅ TOWER BUILT!' : '🏅 GOAL ACHIEVED!') : '⏱ TIME\'S UP!';

    el.innerHTML = `
      <div style="max-width:380px;width:100%;text-align:center;border:1.5px solid rgba(124,58,237,0.6);border-radius:18px;padding:32px 24px;background:linear-gradient(160deg,rgba(10,6,26,0.98),rgba(20,10,50,0.98))">
        <div style="font-family:'Orbitron',sans-serif;font-size:.65rem;letter-spacing:.22em;color:${VIOLET_LT};margin-bottom:12px">GOAL TRACKER TOWER</div>
        <div style="font-size:1.6rem;font-weight:800;color:#fff;margin-bottom:6px">${titleText}</div>
        <div style="font-size:2rem;margin:14px 0;letter-spacing:3px">${starHTML}</div>
        <div style="display:flex;gap:12px;justify-content:center;margin:14px 0">
          <div style="background:rgba(124,58,237,0.18);border:1px solid rgba(124,58,237,0.35);border-radius:10px;padding:10px 18px">
            <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.12em;color:rgba(255,255,255,.5);margin-bottom:4px">SCORE</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:1.4rem;color:${GOLD}">${scoreVal}</div>
          </div>
          <div style="background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:10px 18px">
            <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.12em;color:rgba(255,255,255,.5);margin-bottom:4px">COINS</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:1.4rem;color:${GOOD}">+${coins}</div>
          </div>
          <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:10px 18px">
            <div style="font-family:'Orbitron',sans-serif;font-size:.48rem;letter-spacing:.12em;color:rgba(255,255,255,.5);margin-bottom:4px">ERRORS</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:1.4rem;color:${DANGER}">${wrong}</div>
          </div>
        </div>
        <div style="background:rgba(26,42,74,0.4);border:1px solid rgba(26,42,74,0.6);border-radius:12px;padding:16px;margin:16px 0;text-align:left">
          <div style="font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.14em;color:${VIOLET_LT};margin-bottom:8px">LESSON</div>
          <div style="font-size:.88rem;line-height:1.6;color:#cbd5e1">Big goals don't happen in one move — they are built step by step in the right order. Create the plan first, save consistently second, resist distractions third, and the goal takes care of itself. <strong>Skipping steps always costs more time than doing them right.</strong></div>
        </div>
        ${level === 1 && won ? `<div style="margin-bottom:14px"><button id="gtPlayL2" style="padding:12px 24px;border-radius:10px;border:1.5px solid ${GOLD};background:rgba(251,191,36,0.15);color:${GOLD};font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.13em;cursor:pointer;margin-right:10px">▶ LEVEL 2: MASTER</button></div>` : ''}
        <div style="display:flex;gap:10px;justify-content:center;margin-top:4px">
          <button id="gtPlayAgain" style="padding:12px 22px;border-radius:10px;border:1.5px solid rgba(124,58,237,0.6);background:rgba(124,58,237,0.2);color:#c4b5fd;font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.13em;cursor:pointer">↺ PLAY AGAIN</button>
          <button id="gtGoHub" style="padding:12px 22px;border-radius:10px;border:1.5px solid rgba(26,42,74,0.8);background:rgba(26,42,74,0.35);color:#93c5fd;font-family:'Orbitron',sans-serif;font-size:.68rem;letter-spacing:.13em;cursor:pointer">← HUB</button>
        </div>
      </div>`;
    el.style.display = 'flex';

    document.getElementById('gtPlayAgain').addEventListener('click', () => {
      el.style.display = 'none';
      reset(level);
      if (restartLoop) restartLoop();
    });
    document.getElementById('gtGoHub').addEventListener('click', () => {
      window.bud_goaltowerExit();
    });
    const l2btn = document.getElementById('gtPlayL2');
    if (l2btn) {
      l2btn.addEventListener('click', () => {
        el.style.display = 'none';
        reset(2);
        if (restartLoop) restartLoop();
      });
    }
  }
})();
