/* ════════════════════════════════════════════════════════════════
   FINANCIAL FITNESS GYM · DEBT DETOX DISTRICT — Tap Rhythm game
   Build strong money habits through consistent workout practice.
   Screen ID : game_ddt_gym
   Hub       : rebuilder (#4B2D8F)
   ════════════════════════════════════════════════════════════════ */
(function () {

  /* ── palette ─────────────────────────────────────────────────── */
  const ACCENT  = '#4B2D8F';   // hub purple
  const VIOLET  = '#7B52EF';   // lighter purple glow
  const CYAN    = '#00E5FF';   // neon gym energy
  const GREEN   = '#39FF14';   // success / stamina good
  const GOLD    = '#F5C842';   // coins / combo
  const CRIMSON = '#E84060';   // miss / stamina danger
  const DIM     = '#03040c';   // near-black bg

  /* ── star thresholds ─────────────────────────────────────────── */
  /* Calibrated against the full 3-level circuit (L1+L2+L3): a mixed-skill run
     scores roughly 20k–43k total, so these require real progress into Level 3
     for 2★ and full Level-3 completion with solid form for 3★. */
  const STAR3 = 34000;
  const STAR2 = 20000;

  /* ── exercise definitions ────────────────────────────────────── */
  const EXERCISES = [
    {
      id: 'lift',
      name: 'Savings Weights',
      icon: '🏋️',
      desc: 'TAP & HOLD ↑ then RELEASE ↓',
      color: CYAN,
      type: 'hold',          // hold input
      reps: 6,
      holdMs: 1000,          // hold duration per rep
      lesson: 'Consistently setting aside savings is like lifting weights — it builds financial muscle over time.'
    },
    {
      id: 'pushup',
      name: 'Budget Push-Ups',
      icon: '💪',
      desc: 'HOLD for the full rep — don\'t let go early!',
      color: GREEN,
      type: 'hold_precise',  // hold for exact window
      reps: 6,
      holdMs: 1400,
      lesson: 'Sticking to a budget takes discipline — you can\'t cut corners mid-rep.'
    },
    {
      id: 'cardio',
      name: 'Debt Cardio',
      icon: '🏃',
      desc: 'SWIPE LEFT ← then RIGHT → matching the pacer',
      color: VIOLET,
      type: 'swipe',
      reps: 8,
      lesson: 'Chipping away at debt requires steady rhythm — keep going even when it\'s hard.'
    },
    {
      id: 'squat',
      name: 'Investment Squats',
      icon: '📈',
      desc: 'WATCH the sequence then REPEAT it!',
      color: GOLD,
      type: 'sequence',
      reps: 5,
      seqLen: 3,             // buttons per sequence
      lesson: 'Smart investing takes memory and patience — learn the pattern, then commit.'
    }
  ];

  /* ── level configs ───────────────────────────────────────────── */
  const LEVELS = [
    {
      name: 'LEARN',
      tempo: 0.65,           // 1.0 = base speed
      exercises: [0, 1, 2, 3],  // indices
      distract: false,
      guideArrow: true
    },
    {
      name: 'MASTER',
      tempo: 1.0,
      exercises: [0, 1, 2, 3, 0, 2, 1, 3],  // combo routine
      distract: true,
      guideArrow: false
    },
    {
      name: 'ELITE',
      tempo: 1.35,            // fastest hold/sequence windows in the routine
      // 12-move elite circuit: every exercise 3x, ordered so the same move never repeats twice in a row
      exercises: [2, 0, 3, 1, 2, 3, 0, 2, 1, 3, 0, 1],
      distract: true,
      distractRate: 1.15,     // pop-ups spawn nearly 2x as often as MASTER
      distractMax: 3,         // up to 3 on screen at once instead of 2
      guideArrow: false
    }
  ];

  /* ── state ───────────────────────────────────────────────────── */
  let G = null;

  /* ── canvas refs ─────────────────────────────────────────────── */
  let bgCanvas, bgCtx;
  let gymCanvas, gymCtx;
  let animFrame;
  let bgParticles = [];

  /* ── screen registration ─────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_ddt_gym = function () {
    G = null;
    cancelAnimationFrame(animFrame);
    setTimeout(initGame, 40);
    return `
<div id="gym_root" style="
  position:absolute;inset:0;background:${DIM};overflow:hidden;
  font-family:Inter,sans-serif;color:#fff;user-select:none;touch-action:none;
">
  <!-- ambient bg canvas -->
  <canvas id="gym_bgc" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.55"></canvas>

  <!-- gym main canvas -->
  <canvas id="gym_canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>

  <!-- gradient overlays -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 90% 60% at 50% 100%,rgba(75,45,143,.22),transparent);pointer-events:none"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:22%;background:linear-gradient(to bottom,rgba(3,4,12,.95),transparent);pointer-events:none"></div>

  <!-- scanline texture -->
  <div style="position:absolute;inset:0;z-index:6;pointer-events:none;background:linear-gradient(rgba(0,229,255,0) 50%,rgba(0,229,255,.025) 50%);background-size:100% 4px"></div>

  <!-- miss flash (flashed briefly on a wrong rep) -->
  <div id="gym_missflash" style="position:absolute;inset:0;z-index:20;pointer-events:none;background:radial-gradient(ellipse at 50% 50%,rgba(232,64,96,.5),transparent 70%);opacity:0;"></div>

  <!-- top bar -->
  <div id="gym_topbar" style="
    position:absolute;top:0;left:0;right:0;z-index:30;
    display:flex;align-items:center;gap:10px;
    padding:10px 14px;
  ">
    <button id="gym_back" style="
      background:rgba(75,45,143,.3);border:1px solid rgba(123,82,239,.45);
      color:${VIOLET};border-radius:10px;padding:7px 13px;cursor:pointer;
      font-size:.85rem;font-family:Inter,sans-serif;flex-shrink:0;
      transition:background .15s;
    ">← EXIT</button>

    <div style="flex:1;text-align:center;">
      <div style="font-family:'Orbitron',monospace;font-size:.7rem;letter-spacing:.15em;color:rgba(255,255,255,.45);text-transform:uppercase">Debt Detox District</div>
      <div style="font-family:'Anton',sans-serif;font-size:1rem;color:${VIOLET};letter-spacing:.08em;text-transform:uppercase;text-shadow:0 0 14px ${VIOLET}bb">Financial Fitness Gym</div>
    </div>

    <div style="text-align:right;flex-shrink:0;">
      <div style="font-family:'Orbitron',monospace;font-size:1.1rem;font-weight:800;color:${GOLD}" id="gym_score">0</div>
      <div style="font-size:.65rem;color:rgba(255,255,255,.4);letter-spacing:.1em">SCORE</div>
    </div>
  </div>

  <!-- HUD bar under topbar -->
  <div id="gym_hud" style="
    position:absolute;top:58px;left:0;right:0;z-index:25;
    padding:6px 14px;display:flex;align-items:center;gap:10px;
  ">
    <!-- level badge -->
    <div id="gym_lvlbadge" style="
      background:rgba(75,45,143,.5);border:1px solid rgba(123,82,239,.5);
      border-radius:8px;padding:3px 10px;
      font-family:'Orbitron',monospace;font-size:.7rem;color:${VIOLET};
      letter-spacing:.08em;flex-shrink:0;
    ">LVL 1</div>

    <!-- stamina -->
    <div style="flex:1;min-width:80px;">
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">
        <span style="font-size:.7rem;color:rgba(255,255,255,.5);">⚡</span>
        <span style="font-size:.65rem;color:rgba(255,255,255,.4);letter-spacing:.05em;">STAMINA</span>
      </div>
      <div style="height:7px;background:rgba(255,255,255,.1);border-radius:4px;overflow:hidden;">
        <div id="gym_stambar" style="height:100%;width:100%;border-radius:4px;background:${GREEN};transition:width .12s,background .3s;"></div>
      </div>
    </div>

    <!-- fitness meter -->
    <div style="flex:1;min-width:80px;">
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">
        <span style="font-size:.7rem;color:rgba(255,255,255,.5);">💪</span>
        <span style="font-size:.65rem;color:rgba(255,255,255,.4);letter-spacing:.05em;">FITNESS</span>
      </div>
      <div style="height:7px;background:rgba(255,255,255,.1);border-radius:4px;overflow:hidden;">
        <div id="gym_fitbar" style="height:100%;width:0%;border-radius:4px;background:${VIOLET};transition:width .25s;"></div>
      </div>
    </div>

    <!-- combo -->
    <div id="gym_combo" style="
      font-family:'Orbitron',monospace;font-size:.75rem;color:${GOLD};
      text-align:right;flex-shrink:0;min-width:52px;
    ">x1</div>
  </div>

  <!-- workout label -->
  <div id="gym_wklabel" style="
    position:absolute;top:108px;left:0;right:0;z-index:25;
    text-align:center;pointer-events:none;
  ">
    <div id="gym_exicon" style="font-size:2.4rem;line-height:1;">🏋️</div>
    <div id="gym_exname" style="
      font-family:'Orbitron',monospace;font-size:.85rem;font-weight:700;
      color:${CYAN};letter-spacing:.1em;margin-top:2px;
    ">SAVINGS WEIGHTS</div>
    <div id="gym_exdesc" style="
      font-size:.72rem;color:rgba(255,255,255,.55);margin-top:3px;letter-spacing:.04em;
    ">TAP &amp; HOLD ↑ then RELEASE ↓</div>
    <div id="gym_repprogress" style="
      font-family:'Orbitron',monospace;font-size:.7rem;color:rgba(255,255,255,.35);
      margin-top:4px;letter-spacing:.08em;
    ">REP 0 / 6</div>
  </div>

  <!-- main input zone (center of screen) -->
  <div id="gym_inputzone" style="
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    z-index:30;width:min(320px,88vw);
  ">
    <!-- phase display: changes per exercise type -->
    <div id="gym_phasebox" style="text-align:center;min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;">

      <!-- hold/lift button -->
      <div id="gym_holdbtn" style="display:none;flex-direction:column;align-items:center;gap:12px;width:100%;">
        <div id="gym_weightbar_wrap" style="width:80%;height:12px;background:rgba(255,255,255,.1);border-radius:6px;overflow:hidden;">
          <div id="gym_weightbar" style="height:100%;width:0%;background:${CYAN};border-radius:6px;transition:none;"></div>
        </div>
        <button id="gym_holdaction" style="
          width:130px;height:130px;border-radius:50%;
          background:radial-gradient(circle at 35% 35%,rgba(0,229,255,.25),rgba(75,45,143,.6));
          border:3px solid ${CYAN};color:${CYAN};
          font-size:2.4rem;cursor:pointer;
          box-shadow:0 0 30px rgba(0,229,255,.3);
          transition:transform .08s,box-shadow .08s;
          display:flex;align-items:center;justify-content:center;
          font-family:Inter,sans-serif;
          -webkit-tap-highlight-color:transparent;
        ">🏋️</button>
        <div id="gym_holdtip" style="font-size:.72rem;color:rgba(255,255,255,.45);letter-spacing:.04em;">HOLD DOWN</div>
      </div>

      <!-- swipe zone -->
      <div id="gym_swipezone" style="display:none;flex-direction:column;align-items:center;gap:14px;width:100%;">
        <div id="gym_pacerarrow" style="font-size:2.2rem;transition:transform .12s;">←</div>
        <div style="
          width:88%;height:56px;border-radius:14px;
          border:2px solid rgba(123,82,239,.4);
          background:rgba(123,82,239,.08);
          display:flex;align-items:center;justify-content:center;
          position:relative;overflow:hidden;
        ">
          <div id="gym_swipedot" style="
            width:32px;height:32px;border-radius:50%;
            background:radial-gradient(circle,${VIOLET},${ACCENT});
            position:absolute;left:50%;transform:translateX(-50%);
            box-shadow:0 0 18px ${VIOLET};transition:left .15s;
          "></div>
          <div style="position:absolute;left:14px;font-size:1rem;color:rgba(255,255,255,.3)">←</div>
          <div style="position:absolute;right:14px;font-size:1rem;color:rgba(255,255,255,.3)">→</div>
        </div>
        <div style="font-size:.72rem;color:rgba(255,255,255,.45);letter-spacing:.04em;">SWIPE THE ZONE</div>
      </div>

      <!-- sequence zone -->
      <div id="gym_seqzone" style="display:none;flex-direction:column;align-items:center;gap:16px;width:100%;">
        <div id="gym_seqdisplay" style="
          font-family:'Orbitron',monospace;font-size:1.1rem;letter-spacing:.15em;
          color:${GOLD};min-height:1.5em;text-align:center;
        ">● ● ●</div>
        <div id="gym_seqbtns" style="display:flex;gap:10px;justify-content:center;">
          <!-- filled by JS -->
        </div>
        <div id="gym_seqhint" style="font-size:.72rem;color:rgba(255,255,255,.45);letter-spacing:.04em;">WATCH… THEN REPEAT</div>
      </div>

      <!-- feedback flash -->
      <div id="gym_feedback" style="
        position:absolute;top:-36px;left:50%;transform:translateX(-50%);
        font-family:'Orbitron',monospace;font-size:1rem;font-weight:700;
        pointer-events:none;opacity:0;white-space:nowrap;
        transition:opacity .1s;
      "></div>
    </div>

    <!-- guide arrow (level 1 only) -->
    <div id="gym_guidearrow" style="
      text-align:center;margin-top:6px;font-size:1.4rem;
      color:rgba(255,255,255,.25);letter-spacing:.1em;
      font-family:Inter,sans-serif;
    "></div>
  </div>

  <!-- distraction pop-ups container -->
  <div id="gym_distracts" style="position:absolute;inset:0;pointer-events:none;z-index:40;overflow:hidden;"></div>

  <!-- end overlay (hidden) -->
  <div id="gym_endoverlay" style="
    display:none;position:absolute;inset:0;z-index:50;
    background:rgba(3,4,12,.88);backdrop-filter:blur(8px);
    flex-direction:column;align-items:center;justify-content:center;
    padding:24px;text-align:center;
  ">
    <div id="gym_endcard" style="
      position:relative;overflow:hidden;max-width:380px;width:100%;box-sizing:border-box;
      display:flex;flex-direction:column;align-items:center;gap:14px;
      padding:28px 22px;border-radius:18px;
      border:1px solid ${VIOLET};
      background:linear-gradient(150deg,rgba(255,255,255,.06),rgba(19,13,50,.92));
      backdrop-filter:blur(20px);
      box-shadow:0 0 50px rgba(123,82,239,.4),inset 0 1px 0 rgba(255,255,255,.12);
    ">
      <div style="font-family:'Anton',sans-serif;font-size:1.5rem;color:${VIOLET};letter-spacing:.08em;text-transform:uppercase;text-shadow:0 0 18px ${VIOLET}">Workout Complete!</div>
      <div id="gym_stars" style="font-size:2.4rem;letter-spacing:.1em;">⭐⭐⭐</div>
      <div id="gym_endscore" style="font-family:'Orbitron',monospace;font-size:2rem;font-weight:800;color:${GOLD};">0 pts</div>
      <div id="gym_endcoins" style="
        background:rgba(245,200,66,.12);border:1px solid rgba(245,200,66,.35);
        border-radius:10px;padding:8px 20px;
        font-size:.9rem;color:${GOLD};font-weight:600;
      ">+0 coins earned</div>
      <div id="gym_lesson" style="
        max-width:340px;font-size:.82rem;color:rgba(255,255,255,.65);
        line-height:1.6;border-left:3px solid ${VIOLET};
        padding:10px 14px;background:rgba(75,45,143,.12);
        border-radius:0 8px 8px 0;text-align:left;
      "></div>
      <div style="display:flex;gap:12px;margin-top:6px;">
        <button id="gym_replay" style="
          background:rgba(75,45,143,.5);border:1.5px solid ${VIOLET};
          color:#fff;border-radius:12px;padding:12px 24px;cursor:pointer;
          font-family:'Orbitron',monospace;font-size:.8rem;letter-spacing:.08em;
        ">PLAY AGAIN</button>
        <button id="gym_hub" style="
          background:${ACCENT};border:1.5px solid ${VIOLET};
          color:#fff;border-radius:12px;padding:12px 24px;cursor:pointer;
          font-family:'Orbitron',monospace;font-size:.8rem;letter-spacing:.08em;
        ">← HUB</button>
      </div>
    </div>
  </div>

  <!-- stamina depleted overlay -->
  <div id="gym_failoverlay" style="
    display:none;position:absolute;inset:0;z-index:50;
    background:rgba(3,4,12,.88);backdrop-filter:blur(8px);
    flex-direction:column;align-items:center;justify-content:center;
    padding:24px;text-align:center;gap:14px;
  ">
    <div style="font-size:3rem;">😮‍💨</div>
    <div style="font-family:'Anton',sans-serif;font-size:1.2rem;color:${CRIMSON};letter-spacing:.08em;text-transform:uppercase;text-shadow:0 0 10px ${CRIMSON}88">STAMINA DEPLETED</div>
    <div style="font-size:.82rem;color:rgba(255,255,255,.55);max-width:300px;line-height:1.6;">
      Even athletes need to rest and restart. The important thing is to keep showing up.
    </div>
    <div style="display:flex;gap:12px;margin-top:6px;">
      <button id="gym_fail_replay" style="
        background:rgba(75,45,143,.5);border:1.5px solid ${VIOLET};
        color:#fff;border-radius:12px;padding:12px 24px;cursor:pointer;
        font-family:'Orbitron',monospace;font-size:.8rem;letter-spacing:.08em;
      ">TRY AGAIN</button>
      <button id="gym_fail_hub" style="
        background:${ACCENT};border:1.5px solid ${VIOLET};
        color:#fff;border-radius:12px;padding:12px 24px;cursor:pointer;
        font-family:'Orbitron',monospace;font-size:.8rem;letter-spacing:.08em;
      ">← HUB</button>
    </div>
  </div>

  <style>
    @keyframes gym_hit_pop {
      0%  { opacity:0; transform:translateX(-50%) scale(.6); }
      45% { opacity:1; transform:translateX(-50%) scale(1.22); }
      100%{ opacity:1; transform:translateX(-50%) scale(1); }
    }
    @keyframes gym_win_pop {
      0%  { opacity:0; transform:scale(.55) rotate(-8deg); }
      55% { opacity:1; transform:scale(1.08) rotate(2deg); }
      80% { transform:scale(.97) rotate(-1deg); }
      100%{ opacity:1; transform:scale(1) rotate(0deg); }
    }
    @keyframes gym_fail_fade {
      from{ opacity:0; transform:translateY(10px); }
      to  { opacity:1; transform:translateY(0); }
    }
    @keyframes gym_shake {
      0%,100% { transform:translate(0,0); }
      20% { transform:translate(-6px,3px); }
      40% { transform:translate(5px,-4px); }
      60% { transform:translate(-4px,-2px); }
      80% { transform:translate(3px,3px); }
    }
    @keyframes gym_missflash_anim {
      0%   { opacity:.5; }
      100% { opacity:0; }
    }
    @keyframes ddt_confetti_fall {
      0%  { transform:translateY(-30px) rotate(0deg); opacity:1; }
      100%{ transform:translateY(420px) rotate(360deg); opacity:0; }
    }
    @keyframes ddt_win_shine {
      to { background-position:-20% 0; }
    }
    .ddt_confetti_piece {
      position:absolute; top:-24px; font-size:1.3rem;
      animation:ddt_confetti_fall 1.7s ease-in forwards;
      pointer-events:none; z-index:110;
    }
    .ddt_win_shine::before {
      content:'';
      position:absolute; inset:0;
      background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.18) 48%,transparent 66%);
      background-size:220% 100%;
      background-position:120% 0;
      animation:ddt_win_shine 2.2s ease-in-out .3s 1;
      pointer-events:none;
    }
  </style>

</div>`;
  };

  /* ════════════════════════════════════════════════════════════════
     initGame — runs 40 ms after DOM is created
  ════════════════════════════════════════════════════════════════ */
  function initGame() {
    const root = document.getElementById('gym_root');
    if (!root) return;

    // defensive: if initGame() is ever invoked again on a still-live DOM,
    // make sure the previous rAF chain can't keep running alongside the new
    // one (see the Replay/Try-Again handlers below, which now re-enter via
    // goTo() precisely to avoid that plus duplicate listeners).
    cancelAnimationFrame(animFrame);

    // set up game state
    G = {
      score: 0,
      combo: 1,
      maxCombo: 1,
      perfectReps: 0,
      totalReps: 0,
      stamina: 100,
      fitness: 0,
      levelIdx: 0,
      exIdx: 0,        // index into current level's exercises array
      repsDone: 0,
      phase: 'idle',   // idle | showing | input | feedback | transition | seq_pause
      exercise: null,  // current EXERCISES obj
      swipeDir: 'left',
      swipeDot: 0.5,
      swipeTarget: 'left',
      swipeCount: 0,
      holdStart: 0,
      holdActive: false,
      holdFill: 0,
      seqPattern: [],
      seqPlayerInput: [],
      seqShowing: false,
      seqShowIdx: 0,
      seqShowTimer: 0,
      distracts: [],
      hitParticles: [],
      feedbackTimer: 0,
      transTimer: 0,
      paused: false,
      done: false,
      failed: false,
      touchStartX: 0,
      touchStartY: 0,
      lastTime: 0,
      bgTime: 0,
      gymPower: 0,  // visual only 0–1
    };

    // canvas setup
    bgCanvas = document.getElementById('gym_bgc');
    gymCanvas = document.getElementById('gym_canvas');
    resizeCanvases();

    bgCtx = bgCanvas.getContext('2d');
    gymCtx = gymCanvas.getContext('2d');
    initBgParticles();

    // button handlers
    document.getElementById('gym_back').addEventListener('click', window.ddt_gymExit);
    document.getElementById('gym_replay').addEventListener('click', () => {
      goTo('game_ddt_gym');
    });
    document.getElementById('gym_hub').addEventListener('click', window.ddt_gymExit);
    document.getElementById('gym_fail_replay').addEventListener('click', () => {
      goTo('game_ddt_gym');
    });
    document.getElementById('gym_fail_hub').addEventListener('click', window.ddt_gymExit);

    // hold button
    const holdBtn = document.getElementById('gym_holdaction');
    holdBtn.addEventListener('mousedown', onHoldStart);
    holdBtn.addEventListener('touchstart', e => { e.preventDefault(); onHoldStart(); }, { passive: false });
    holdBtn.addEventListener('mouseup', onHoldEnd);
    holdBtn.addEventListener('mouseleave', onHoldEnd);
    holdBtn.addEventListener('touchend', e => { e.preventDefault(); onHoldEnd(); }, { passive: false });

    // swipe zone
    const swipeZone = document.getElementById('gym_swipezone');
    swipeZone.style.pointerEvents = 'auto';
    swipeZone.addEventListener('touchstart', onSwipeTouchStart, { passive: false });
    swipeZone.addEventListener('touchend', onSwipeTouchEnd, { passive: false });
    swipeZone.addEventListener('mousedown', onSwipeMouseStart);

    // global swipe on root
    root.addEventListener('touchstart', e => {
      if (G && G.phase === 'input' && G.exercise && G.exercise.type === 'swipe') {
        G.touchStartX = e.touches[0].clientX;
        G.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });
    root.addEventListener('touchend', e => {
      if (G && G.phase === 'input' && G.exercise && G.exercise.type === 'swipe') {
        const dx = e.changedTouches[0].clientX - G.touchStartX;
        if (Math.abs(dx) > 30) onSwipeInput(dx > 0 ? 'right' : 'left');
      }
    }, { passive: true });

    // keyboard
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // resize
    window.addEventListener('resize', resizeCanvases);

    // start
    G.lastTime = performance.now();
    beginLevel();
    animFrame = requestAnimationFrame(loop);
  }

  /* ── canvas sizing ───────────────────────────────────────────── */
  function resizeCanvases() {
    const W = window.innerWidth, H = window.innerHeight;
    [bgCanvas, gymCanvas].forEach(c => {
      if (!c) return;
      c.width = W; c.height = H;
    });
  }

  /* ── background particles (neon gym energy) ──────────────────── */
  function initBgParticles() {
    bgParticles = [];
    const N = 55;
    const colors = [VIOLET, CYAN, ACCENT, '#ffffff'];
    for (let i = 0; i < N; i++) {
      bgParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 2.2 + 0.4,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.5 + 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  /* ── main loop ───────────────────────────────────────────────── */
  function loop(now) {
    if (!G) return;
    const dt = Math.min((now - G.lastTime) / 1000, 0.08);
    G.lastTime = now;
    G.bgTime += dt;

    drawBg(dt);
    drawGym(dt);

    if (!G.paused && !G.done && !G.failed) {
      updateGame(dt);
    }

    animFrame = requestAnimationFrame(loop);
  }

  /* ── background draw ─────────────────────────────────────────── */
  function drawBg(dt) {
    if (!bgCtx) return;
    const W = bgCanvas.width, H = bgCanvas.height;
    const bg=bgCtx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#0a0418'); bg.addColorStop(0.5,'#0e0620'); bg.addColorStop(1,'#0a0418');
    bgCtx.fillStyle=bg; bgCtx.fillRect(0,0,W,H);

    // cosmic nebula glow washes — reads as deep space instead of a flat gradient
    bgCtx.save();
    const neb1 = bgCtx.createRadialGradient(W*0.26, H*0.16, 0, W*0.26, H*0.16, W*0.65);
    neb1.addColorStop(0, 'rgba(123,82,239,.30)');
    neb1.addColorStop(1, 'rgba(123,82,239,0)');
    bgCtx.fillStyle = neb1; bgCtx.fillRect(0, 0, W, H);
    const neb2 = bgCtx.createRadialGradient(W*0.8, H*0.88, 0, W*0.8, H*0.88, W*0.55);
    neb2.addColorStop(0, 'rgba(245,200,66,.14)');
    neb2.addColorStop(1, 'rgba(245,200,66,0)');
    bgCtx.fillStyle = neb2; bgCtx.fillRect(0, 0, W, H);
    bgCtx.restore();

    // grid floor
    bgCtx.save();
    bgCtx.globalAlpha = 0.18 + G.gymPower * 0.12;
    bgCtx.strokeStyle = VIOLET;
    bgCtx.lineWidth = 0.6;
    const gridS = 44;
    for (let x = 0; x < W; x += gridS) {
      bgCtx.beginPath(); bgCtx.moveTo(x, H * 0.45); bgCtx.lineTo(x + W * 0.5, H * 1.1); bgCtx.stroke();
    }
    for (let row = 0; row < 8; row++) {
      const t = row / 7;
      const y = H * 0.45 + t * H * 0.6;
      const spread = t * W * 0.55;
      bgCtx.beginPath(); bgCtx.moveTo(W / 2 - spread, y); bgCtx.lineTo(W / 2 + spread, y); bgCtx.stroke();
    }
    bgCtx.restore();

    // particles
    bgParticles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.pulse += dt * 1.8;
      if (p.x < -10) p.x = W + 5;
      if (p.x > W + 10) p.x = -5;
      if (p.y < -10) p.y = H + 5;
      if (p.y > H + 10) p.y = -5;
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
      bgCtx.save();
      bgCtx.globalAlpha = a;
      bgCtx.fillStyle = p.color;
      bgCtx.shadowColor = p.color;
      bgCtx.shadowBlur = 6;
      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      bgCtx.fill();
      bgCtx.restore();
    });

    // holographic equipment silhouettes
    bgCtx.save();
    const powerAlpha = 0.06 + G.gymPower * 0.18;
    bgCtx.globalAlpha = powerAlpha;
    // barbell left
    drawBarbell(bgCtx, W * 0.12, H * 0.62, 90, CYAN);
    // barbell right
    drawBarbell(bgCtx, W * 0.88, H * 0.62, 90, CYAN);
    // treadmill center-bottom
    drawTreadmill(bgCtx, W * 0.5, H * 0.78, VIOLET);
    bgCtx.restore();
  }

  function drawBarbell(ctx, cx, cy, angle, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle * Math.PI / 180);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.stroke();
    // plates
    [['-50', 12], ['50', 12]].forEach(([xStr, w]) => {
      const x = parseFloat(xStr);
      ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x, -16); ctx.lineTo(x, 16); ctx.stroke();
    });
    ctx.restore();
  }

  function drawTreadmill(ctx, cx, cy, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    // belt
    ctx.strokeRect(-55, -10, 110, 20);
    // rails
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-40, -10); ctx.lineTo(-40, -36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, -10); ctx.lineTo(40, -36); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-40, -36); ctx.lineTo(40, -36); ctx.stroke();
    ctx.restore();
  }

  /* ── gym draw (canvas overlay) ───────────────────────────────── */
  function drawGym(dt) {
    if (!gymCtx) return;
    const W = gymCanvas.width, H = gymCanvas.height;
    gymCtx.clearRect(0, 0, W, H);

    // gym power glow at bottom
    if (G.gymPower > 0) {
      const grad = gymCtx.createRadialGradient(W / 2, H, 0, W / 2, H, W * 0.7);
      grad.addColorStop(0, `rgba(75,45,143,${G.gymPower * 0.28})`);
      grad.addColorStop(1, 'transparent');
      gymCtx.fillStyle = grad;
      gymCtx.fillRect(0, 0, W, H);
    }

    // draw swipe dot animation if swipe exercise
    if (G.exercise && G.exercise.type === 'swipe' && G.phase === 'input') {
      // pacer arrow pulsing
      const t = G.bgTime;
      const swing = Math.sin(t * 3.5) * 0.5 + 0.5;
      const el = document.getElementById('gym_pacerarrow');
      if (el) {
        const dir = G.swipeTarget === 'left' ? '←' : '→';
        el.textContent = dir;
        el.style.transform = `scale(${1 + swing * 0.2})`;
        el.style.color = `rgba(${G.swipeTarget === 'left' ? '0,229,255' : '123,82,239'},${0.6 + swing * 0.4})`;
      }
      // move swipe dot indicator
      const dotEl = document.getElementById('gym_swipedot');
      if (dotEl) {
        const dotPct = G.swipeDot * 100;
        dotEl.style.left = `calc(${dotPct}% - 16px)`;
        // drift dot toward target
        const targetX = G.swipeTarget === 'left' ? 0.12 : 0.88;
        G.swipeDot += (targetX - G.swipeDot) * dt * 2.2;
      }
    }

    // hold bar fill animation
    if (G.exercise && (G.exercise.type === 'hold' || G.exercise.type === 'hold_precise') && G.phase === 'input') {
      const barEl = document.getElementById('gym_weightbar');
      if (barEl) {
        barEl.style.width = (G.holdFill * 100) + '%';
        const hue = G.holdFill < 0.5 ? CYAN : GREEN;
        barEl.style.background = hue;
        barEl.style.boxShadow = `0 0 12px ${hue}`;
      }
    }

    // hit particle bursts (correct/wrong feedback pops)
    if (G.hitParticles.length) {
      for (let i = G.hitParticles.length - 1; i >= 0; i--) {
        const p = G.hitParticles[i];
        p.life -= dt;
        if (p.life <= 0) { G.hitParticles.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94; p.vy *= 0.94;
        const a = Math.max(0, p.life / p.maxLife);
        gymCtx.save();
        gymCtx.globalAlpha = a;
        gymCtx.fillStyle = p.color;
        gymCtx.shadowColor = p.color;
        gymCtx.shadowBlur = 8;
        gymCtx.beginPath();
        gymCtx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
        gymCtx.fill();
        gymCtx.restore();
      }
    }
  }

  /* ── game logic update ───────────────────────────────────────── */
  function updateGame(dt) {
    const level = LEVELS[G.levelIdx];
    const tempo = level.tempo;

    // feedback timer
    if (G.feedbackTimer > 0) {
      G.feedbackTimer -= dt;
      if (G.feedbackTimer <= 0) {
        const el = document.getElementById('gym_feedback');
        if (el) el.style.opacity = '0';
      }
    }

    // transition between exercises
    if (G.phase === 'transition') {
      G.transTimer -= dt;
      if (G.transTimer <= 0) {
        beginExercise();
      }
      return;
    }

    // sequence retry/advance pause — deliberately its own phase (not
    // 'transition') so this per-frame countdown can never race the
    // setTimeout in onSeqButtonPress and resolve via beginExercise(), which
    // used to wrongly reset repsDone mid-exercise. That setTimeout owns
    // resuming play here.
    if (G.phase === 'seq_pause') return;

    // sequence showing phase
    if (G.phase === 'showing') {
      G.seqShowTimer -= dt;
      if (G.seqShowTimer <= 0) {
        if (G.seqShowIdx < G.seqPattern.length) {
          flashSeqButton(G.seqPattern[G.seqShowIdx]);
          G.seqShowIdx++;
          G.seqShowTimer = 0.6 / tempo;
        } else {
          // done showing, player's turn
          G.phase = 'input';
          G.seqPlayerInput = [];
          const hint = document.getElementById('gym_seqhint');
          if (hint) hint.textContent = 'NOW REPEAT THE SEQUENCE!';
          hint.style.color = GOLD;
          updateSeqDisplay();
        }
      }
      return;
    }

    // hold exercise update
    if (G.phase === 'input' && G.exercise) {
      const ex = G.exercise;
      if (ex.type === 'hold' || ex.type === 'hold_precise') {
        const holdDuration = (ex.holdMs / 1000) / tempo;
        if (G.holdActive) {
          G.holdFill = Math.min(1, G.holdFill + dt / holdDuration);
        } else {
          G.holdFill = Math.max(0, G.holdFill - dt * 1.8);
        }
        // update hold button visual
        const btn = document.getElementById('gym_holdaction');
        if (btn) {
          if (G.holdActive) {
            btn.style.transform = 'scale(0.93)';
            btn.style.boxShadow = `0 0 40px ${ex.color}`;
          } else {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = `0 0 20px rgba(0,229,255,.3)`;
          }
        }
        // guide arrow
        if (level.guideArrow) {
          const guideEl = document.getElementById('gym_guidearrow');
          if (guideEl) {
            if (G.holdFill < 0.85) guideEl.textContent = '↑ HOLD ↑';
            else guideEl.textContent = '↓ RELEASE ↓';
          }
        }
      }
    }

    // distraction pop-ups (level 2+)
    if (level.distract && G.phase === 'input') {
      G.distracts.forEach((d, i) => {
        d.life -= dt;
        const el = document.getElementById('distract_' + d.id);
        if (el) {
          el.style.opacity = Math.min(1, d.life * 4);
          if (d.life <= 0) {
            el.remove();
            G.distracts.splice(i, 1);
          }
        }
      });
      // spawn new distractions occasionally — rate/max scale up on higher levels
      const distractRate = level.distractRate || 0.6;
      const distractMax  = level.distractMax  || 2;
      if (Math.random() < dt * distractRate && G.distracts.length < distractMax) {
        spawnDistraction();
      }
    }

    // update gym power toward fitness
    G.gymPower += (G.fitness / 100 - G.gymPower) * dt * 1.2;

    // update UI
    updateHUD();
  }

  /* ── level / exercise flow ───────────────────────────────────── */
  function beginLevel() {
    G.exIdx = 0;
    G.repsDone = 0;
    const lv = LEVELS[G.levelIdx];
    updateLevelBadge();
    beginExercise();
  }

  function beginExercise() {
    if (!G) return;
    const lv = LEVELS[G.levelIdx];
    if (G.exIdx >= lv.exercises.length) {
      // level complete — next level or win
      if (G.levelIdx < LEVELS.length - 1) {
        G.levelIdx++;
        G.exIdx = 0;
        updateLevelBadge();
        showFeedback('LEVEL UP! 🔥', GOLD, 2);
        G.phase = 'transition';
        G.transTimer = 1.8;
        return;
      } else {
        // all done — win!
        G.done = true;
        endGame(calcStars());
        return;
      }
    }

    const exDef = EXERCISES[lv.exercises[G.exIdx]];
    G.exercise = exDef;
    G.repsDone = 0;
    G.holdFill = 0;
    G.holdActive = false;
    G.swipeCount = 0;
    G.swipeTarget = 'left';
    G.swipeDot = 0.5;
    G.seqPattern = [];
    G.seqPlayerInput = [];

    // update UI labels
    const iconEl = document.getElementById('gym_exicon');
    const nameEl = document.getElementById('gym_exname');
    const descEl = document.getElementById('gym_exdesc');
    const repEl  = document.getElementById('gym_repprogress');

    if (iconEl) iconEl.textContent = exDef.icon;
    if (nameEl) { nameEl.textContent = exDef.name.toUpperCase(); nameEl.style.color = exDef.color; }
    if (descEl) descEl.textContent = exDef.desc;
    if (repEl)  repEl.textContent = `REP 0 / ${exDef.reps}`;

    // show correct input zone
    hideAllZones();
    const tempo = LEVELS[G.levelIdx].tempo;

    if (exDef.type === 'hold' || exDef.type === 'hold_precise') {
      const zone = document.getElementById('gym_holdbtn');
      zone.style.display = 'flex';
      const btn = document.getElementById('gym_holdaction');
      btn.textContent = exDef.icon;
      btn.style.borderColor = exDef.color;
      btn.style.boxShadow = `0 0 24px ${exDef.color}44`;
      const bar = document.getElementById('gym_weightbar');
      bar.style.background = exDef.color;
      G.phase = 'input';

    } else if (exDef.type === 'swipe') {
      const zone = document.getElementById('gym_swipezone');
      zone.style.display = 'flex';
      const arrow = document.getElementById('gym_pacerarrow');
      arrow.textContent = '←';
      G.swipeTarget = 'left';
      G.phase = 'input';

    } else if (exDef.type === 'sequence') {
      const zone = document.getElementById('gym_seqzone');
      zone.style.display = 'flex';
      buildSeqButtons(exDef);
      startNewSequenceRound();
    }

    // guide arrow visibility
    const guideEl = document.getElementById('gym_guidearrow');
    if (guideEl) {
      guideEl.textContent = LEVELS[G.levelIdx].guideArrow ? getGuideText(exDef) : '';
    }
  }

  function getGuideText(ex) {
    if (ex.type === 'hold') return '↑ HOLD ↑ then ↓ RELEASE ↓';
    if (ex.type === 'hold_precise') return 'HOLD for the full rep!';
    if (ex.type === 'swipe') return '← SWIPE to the matching arrow →';
    if (ex.type === 'sequence') return 'WATCH carefully, then match it!';
    return '';
  }

  function hideAllZones() {
    ['gym_holdbtn', 'gym_swipezone', 'gym_seqzone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  function updateLevelBadge() {
    const el = document.getElementById('gym_lvlbadge');
    if (el) {
      const lv = LEVELS[G.levelIdx];
      el.textContent = `LVL ${G.levelIdx + 1} · ${lv.name}`;
    }
  }

  /* ── hold input handlers ─────────────────────────────────────── */
  function onHoldStart() {
    if (!G || G.phase !== 'input') return;
    if (!G.exercise || (G.exercise.type !== 'hold' && G.exercise.type !== 'hold_precise')) return;
    G.holdActive = true;
    G.holdStart = performance.now();
  }

  function onHoldEnd() {
    if (!G || !G.holdActive) return;
    G.holdActive = false;
    if (!G.exercise || (G.exercise.type !== 'hold' && G.exercise.type !== 'hold_precise')) return;

    const ex = G.exercise;
    const tempo = LEVELS[G.levelIdx].tempo;
    const holdDuration = (ex.holdMs / 1000) / tempo;
    const elapsed = (performance.now() - G.holdStart) / 1000;

    let success = false;
    let perfect = false;

    if (ex.type === 'hold') {
      // must hold at least 70% of duration, release before 130%
      success = elapsed >= holdDuration * 0.65 && elapsed <= holdDuration * 1.45;
      perfect = elapsed >= holdDuration * 0.85 && elapsed <= holdDuration * 1.2;
    } else {
      // hold_precise: must hold for very close to duration
      success = elapsed >= holdDuration * 0.75 && elapsed <= holdDuration * 1.25;
      perfect = elapsed >= holdDuration * 0.9 && elapsed <= holdDuration * 1.12;
    }

    G.holdFill = 0;
    scoreRep(success, perfect);
  }

  /* ── swipe input handlers ────────────────────────────────────── */
  function onSwipeTouchStart(e) {
    if (e.cancelable) e.preventDefault();
    if (!G || G.phase !== 'input') return;
    G.touchStartX = e.touches[0].clientX;
  }
  function onSwipeTouchEnd(e) {
    if (e.cancelable) e.preventDefault();
    if (!G || G.phase !== 'input') return;
    const dx = e.changedTouches[0].clientX - G.touchStartX;
    if (Math.abs(dx) > 20) onSwipeInput(dx > 0 ? 'right' : 'left');
  }
  function onSwipeMouseStart(e) {
    if (!G || G.phase !== 'input') return;
    G.touchStartX = e.clientX;
    const onUp = ev => {
      const dx = ev.clientX - G.touchStartX;
      if (Math.abs(dx) > 20) onSwipeInput(dx > 0 ? 'right' : 'left');
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mouseup', onUp);
  }

  function onSwipeInput(dir) {
    if (!G || G.phase !== 'input') return;
    if (!G.exercise || G.exercise.type !== 'swipe') return;

    const correct = (dir === G.swipeTarget);
    if (correct) {
      // advance target
      G.swipeCount++;
      G.swipeTarget = G.swipeTarget === 'left' ? 'right' : 'left';
      G.swipeDot = G.swipeTarget === 'left' ? 0.88 : 0.12;
      scoreRep(true, G.swipeCount % 4 === 0);
    } else {
      scoreRep(false, false);
    }
  }

  /* ── sequence input handlers ─────────────────────────────────── */
  function buildSeqButtons(ex) {
    const container = document.getElementById('gym_seqbtns');
    if (!container) return;
    container.innerHTML = '';
    const BTNS = ['●', '▲', '■', '◆'];
    const colors = [CYAN, GREEN, GOLD, CRIMSON];
    BTNS.forEach((sym, i) => {
      const btn = document.createElement('button');
      btn.id = 'seqbtn_' + i;
      btn.textContent = sym;
      btn.style.cssText = `
        width:56px;height:56px;border-radius:12px;
        background:rgba(255,255,255,.07);
        border:2px solid ${colors[i]}66;
        color:${colors[i]};font-size:1.5rem;
        cursor:pointer;transition:background .1s,box-shadow .1s;
        font-family:Inter,sans-serif;
        -webkit-tap-highlight-color:transparent;
      `;
      btn.addEventListener('click', () => onSeqButtonPress(i));
      btn.addEventListener('touchstart', e => { e.preventDefault(); onSeqButtonPress(i); }, { passive: false });
      container.appendChild(btn);
    });
  }

  function startNewSequenceRound() {
    if (!G) return;
    // generate pattern
    const len = G.exercise.seqLen + (G.repsDone > 2 ? 1 : 0);
    G.seqPattern = [];
    for (let i = 0; i < len; i++) {
      G.seqPattern.push(Math.floor(Math.random() * 4));
    }
    G.seqPlayerInput = [];
    G.seqShowIdx = 0;
    G.seqShowTimer = 0.5;
    G.phase = 'showing';
    updateSeqDisplay();
    const hint = document.getElementById('gym_seqhint');
    if (hint) { hint.textContent = 'WATCH… THEN REPEAT'; hint.style.color = 'rgba(255,255,255,.45)'; }
  }

  function flashSeqButton(idx) {
    const btn = document.getElementById('seqbtn_' + idx);
    if (!btn) return;
    const colors = [CYAN, GREEN, GOLD, CRIMSON];
    btn.style.background = colors[idx] + '55';
    btn.style.boxShadow = `0 0 20px ${colors[idx]}`;
    btn.style.transform = 'scale(1.12)';
    setTimeout(() => {
      if (btn) {
        btn.style.background = 'rgba(255,255,255,.07)';
        btn.style.boxShadow = 'none';
        btn.style.transform = 'scale(1)';
      }
    }, 280);
    // also update display
    updateSeqDisplay(idx);
    setTimeout(() => updateSeqDisplay(), 300);
  }

  function updateSeqDisplay(activeIdx) {
    const el = document.getElementById('gym_seqdisplay');
    if (!el || !G.seqPattern) return;
    const SYMS = ['●', '▲', '■', '◆'];
    const colors = [CYAN, GREEN, GOLD, CRIMSON];
    el.innerHTML = G.seqPattern.map((idx, i) => {
      const isActive = (i === G.seqShowIdx - 1 && activeIdx === idx) || activeIdx === undefined && i === G.seqPlayerInput.length - 1;
      const inputted = G.seqPlayerInput[i];
      let color = 'rgba(255,255,255,.25)';
      if (inputted !== undefined) {
        color = inputted === idx ? GREEN : CRIMSON;
      } else if (isActive) {
        color = colors[idx];
      }
      return `<span style="color:${color};font-size:1.3rem;transition:color .15s;">${SYMS[idx]}</span>`;
    }).join(' ');
  }

  function onSeqButtonPress(btnIdx) {
    if (!G || G.phase !== 'input') return;
    if (!G.exercise || G.exercise.type !== 'sequence') return;
    const colors = [CYAN, GREEN, GOLD, CRIMSON];
    const btn = document.getElementById('seqbtn_' + btnIdx);
    if (btn) {
      btn.style.background = colors[btnIdx] + '44';
      btn.style.transform = 'scale(0.92)';
      setTimeout(() => {
        if (btn) { btn.style.background = 'rgba(255,255,255,.07)'; btn.style.transform = 'scale(1)'; }
      }, 140);
    }

    G.seqPlayerInput.push(btnIdx);
    const pos = G.seqPlayerInput.length - 1;
    const correct = (btnIdx === G.seqPattern[pos]);

    if (!correct) {
      // wrong — fail this attempt
      updateSeqDisplay();
      scoreRep(false, false);
      // 'seq_pause', not 'transition': the setTimeout below owns resuming
      // play here (see updateGame()'s seq_pause branch for why this can't
      // share the generic transition countdown).
      G.phase = 'seq_pause';
      setTimeout(() => {
        if (G && G.exercise && G.exercise.type === 'sequence') {
          startNewSequenceRound();
        }
      }, 600);
      return;
    }

    updateSeqDisplay();

    if (G.seqPlayerInput.length === G.seqPattern.length) {
      // full correct sequence!
      const perfect = true;
      scoreRep(true, perfect);
      // scoreRep() already moves phase to 'transition' + schedules
      // beginExercise() itself when this was the exercise's FINAL rep; only
      // take this sequence-internal pause when more reps remain, using
      // 'seq_pause' (not 'transition') so the two resolutions can't race.
      if (G.repsDone < G.exercise.reps) {
        G.phase = 'seq_pause';
        setTimeout(() => {
          if (G && G.exercise && G.exercise.type === 'sequence') {
            startNewSequenceRound();
          }
        }, 500);
      }
    }
  }

  /* ── scoring ─────────────────────────────────────────────────── */
  function scoreRep(success, perfect) {
    if (!G) return;
    if (success) {
      G.repsDone++;
      G.totalReps++;
      if (perfect) G.perfectReps++;

      const pts = perfect ? 40 : 20;
      G.score += pts * G.combo;
      G.fitness = Math.min(100, G.fitness + 5 + G.combo * 1.5);
      G.stamina = Math.min(100, G.stamina + (perfect ? 4 : 2));

      G.combo = Math.min(8, G.combo + (perfect ? 0.5 : 0.25));
      G.maxCombo = Math.max(G.maxCombo, Math.floor(G.combo));

      showFeedback(perfect ? 'PERFECT! 💥' : 'GOOD REP! ✓', perfect ? GOLD : GREEN, 0.9, G.combo);
      spawnHitBurst(perfect ? GOLD : GREEN, perfect ? 10 : 6);

      // update rep counter
      const repEl = document.getElementById('gym_repprogress');
      if (repEl) repEl.textContent = `REP ${G.repsDone} / ${G.exercise.reps}`;

      // check exercise complete
      if (G.repsDone >= G.exercise.reps) {
        G.exIdx++;
        G.phase = 'transition';
        G.transTimer = 1.0;
        showFeedback('SET COMPLETE! 🔥', CYAN, 1.5);
        clearDistractions();
      }
    } else {
      G.stamina = Math.max(0, G.stamina - 18);
      G.combo = Math.max(1, G.combo - 1);
      showFeedback('MISS! ✗', CRIMSON);
      spawnHitBurst(CRIMSON, 5);
      triggerMissEffect();

      if (G.stamina <= 0) {
        G.failed = true;
        G.done = true;
        showFailOverlay();
      }
    }
    updateHUD();
  }

  /* ── distractions ────────────────────────────────────────────── */
  const DISTRACT_TEXTS = [
    '💸 Flash Sale! 50% OFF!',
    '🛍️ BUY NOW — Limited time!',
    '🎰 Special Offer Just For You!',
    '💳 Upgrade Your Card Today!',
    '🎁 FREE Gift with Purchase!',
    '📱 New iPhone Only $29/mo!',
    '🍕 Order Now — Treat Yourself!',
    '✈️ Book That Vacation NOW!'
  ];

  function spawnDistraction() {
    if (!G) return;
    const id = Date.now() + Math.random();
    const text = DISTRACT_TEXTS[Math.floor(Math.random() * DISTRACT_TEXTS.length)];
    const x = Math.random() * 70 + 5;
    const y = Math.random() * 40 + 15;

    const container = document.getElementById('gym_distracts');
    if (!container) return;

    const el = document.createElement('div');
    el.id = 'distract_' + id;
    el.style.cssText = `
      position:absolute;left:${x}%;top:${y}%;
      background:rgba(232,64,96,.18);border:1.5px solid rgba(232,64,96,.6);
      border-radius:12px;padding:8px 14px;
      font-size:.75rem;color:${CRIMSON};font-weight:600;
      pointer-events:none;
      animation:distract_pulse 0.5s ease infinite alternate;
      max-width:160px;text-align:center;line-height:1.4;
      box-shadow:0 0 16px rgba(232,64,96,.25);
    `;
    el.textContent = text;
    container.appendChild(el);

    G.distracts.push({ id, life: 3.5 });
  }

  function clearDistractions() {
    if (!G) return;
    G.distracts.forEach(d => {
      const el = document.getElementById('distract_' + d.id);
      if (el) el.remove();
    });
    G.distracts = [];
  }

  /* ── HUD update ──────────────────────────────────────────────── */
  function updateHUD() {
    if (!G) return;
    const scoreEl = document.getElementById('gym_score');
    if (scoreEl) scoreEl.textContent = G.score.toLocaleString();

    const stamEl = document.getElementById('gym_stambar');
    if (stamEl) {
      stamEl.style.width = G.stamina + '%';
      if (G.stamina > 60) stamEl.style.background = GREEN;
      else if (G.stamina > 30) stamEl.style.background = GOLD;
      else stamEl.style.background = CRIMSON;
    }

    const fitEl = document.getElementById('gym_fitbar');
    if (fitEl) fitEl.style.width = G.fitness + '%';

    const comboEl = document.getElementById('gym_combo');
    if (comboEl) {
      const c = Math.floor(G.combo);
      comboEl.textContent = `x${c}`;
      comboEl.style.color = c >= 4 ? CYAN : c >= 2 ? GOLD : 'rgba(255,255,255,.5)';
    }
  }

  /* ── feedback flash ──────────────────────────────────────────── */
  /* combo (optional) scales the punch — a x1 hit and a x8 combo hit should
     not look identical: font grows and the pop is snappier as combo climbs.
     Purely visual — scoring math in scoreRep() is untouched. */
  function showFeedback(text, color, dur = 0.9, combo = 1) {
    const el = document.getElementById('gym_feedback');
    if (!el) return;
    const growth = Math.min(combo, 8) * 0.045; // up to +0.36rem at combo 8
    el.textContent = text;
    el.style.color = color;
    el.style.textShadow = `0 0 16px ${color}`;
    el.style.fontSize = (1 + growth).toFixed(2) + 'rem';
    el.style.opacity = '1';
    el.style.animation = 'none';
    void el.offsetWidth; // force reflow so back-to-back hits restart the pop instead of no-op-ing
    el.style.animation = `gym_hit_pop ${combo >= 4 ? '.3' : '.38'}s cubic-bezier(.2,1.4,.4,1)`;
    G.feedbackTimer = dur;
  }

  /* ── hit particle bursts (correct/wrong reps) ─────────────────── */
  function spawnHitBurst(color, n) {
    if (!G || !gymCanvas) return;
    const cx = gymCanvas.width / 2, cy = gymCanvas.height * 0.5;
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 150;
      const life = 0.45 + Math.random() * 0.35;
      G.hitParticles.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        life, maxLife: life,
        r: 2 + Math.random() * 2.5,
        color,
      });
    }
  }

  /* ── miss screen-shake + flash ────────────────────────────────── */
  function triggerMissEffect() {
    const root = document.getElementById('gym_root');
    if (root) {
      root.style.animation = 'none';
      void root.offsetWidth;
      root.style.animation = 'gym_shake .28s ease';
    }
    const flash = document.getElementById('gym_missflash');
    if (flash) {
      flash.style.animation = 'none';
      void flash.offsetWidth;
      flash.style.animation = 'gym_missflash_anim .4s ease-out';
    }
  }

  /* ── keyboard support ────────────────────────────────────────── */
  function onKeyDown(e) {
    if (!G || G.phase !== 'input') return;
    const ex = G.exercise;
    if (!ex) return;

    if (ex.type === 'hold' || ex.type === 'hold_precise') {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (!G.holdActive) { G.holdActive = true; G.holdStart = performance.now(); }
      }
    }
    if (ex.type === 'swipe') {
      if (e.code === 'ArrowLeft') onSwipeInput('left');
      if (e.code === 'ArrowRight') onSwipeInput('right');
    }
    if (ex.type === 'sequence') {
      const map = { 'KeyZ': 0, 'KeyX': 1, 'KeyC': 2, 'KeyV': 3 };
      if (map[e.code] !== undefined) onSeqButtonPress(map[e.code]);
    }
  }

  // key up for hold
  function onKeyUp(e) {
    if (!G) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if (G.holdActive) onHoldEnd();
    }
  }

  /* ── stars calculation ───────────────────────────────────────── */
  function calcStars() {
    if (G.score >= STAR3) return 3;
    if (G.score >= STAR2) return 2;
    return 1;
  }

  /* ── end / fail overlays ─────────────────────────────────────── */
  function endGame(stars) {
    cancelAnimationFrame(animFrame);
    clearDistractions();

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ddt_gym', { level: G.levelIdx + 1, stars, is3star, isPerfect: is3star, badge: 'Financial Athlete' })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('ddt_recovery', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    // pick a lesson from last exercise or random
    const lessons = EXERCISES.map(e => e.lesson);
    const mainLesson = 'Good financial habits are built through repetition, just like physical fitness. Saving consistently, sticking to a budget, chipping away at debt, and investing regularly are not one-time decisions — they are daily practice. The more often you choose the healthy financial action, the more automatic it becomes.';

    const overlay = document.getElementById('gym_endoverlay');
    if (!overlay) return;

    document.getElementById('gym_stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('gym_endscore').textContent = G.score.toLocaleString() + ' pts';
    document.getElementById('gym_endcoins').textContent = `+${coins} coins earned`;
    document.getElementById('gym_lesson').textContent = mainLesson;

    /* this overlay is only ever reached by finishing the full 3-level circuit
       (a stamina-depleted loss goes through the separate gym_failoverlay /
       showFailOverlay() and never calls endGame()) — so every call here is a
       genuine win, and gets a confetti burst + card shine-sweep to match. */
    const card = document.getElementById('gym_endcard');
    if (card) {
      const confettiColors = [GOLD, VIOLET, CYAN, GREEN, '#fff'];
      const confettiEmoji  = ['✦', '●', '▲', '★', '🪙'];
      const confettiHtml = Array.from({ length: 16 }, (_, i) => {
        const emo   = confettiEmoji[i % confettiEmoji.length];
        const col   = confettiColors[i % confettiColors.length];
        const left  = (4 + Math.random() * 92).toFixed(1);
        const delay = (Math.random() * 0.5).toFixed(2);
        return `<span class="ddt_confetti_piece" style="left:${left}%;animation-delay:${delay}s;color:${col}">${emo}</span>`;
      }).join('');
      card.classList.add('ddt_win_shine');
      card.insertAdjacentHTML('afterbegin', confettiHtml);
    }

    /* win moment gets a bouncy scale+rotate pop-in so it FEELS more
       celebratory than a flat display swap — distinct from the plain
       fade used on the stamina-depleted fail overlay */
    overlay.style.animation = 'gym_win_pop .55s cubic-bezier(.2,1.4,.4,1)';
    overlay.style.display = 'flex';
  }

  function showFailOverlay() {
    cancelAnimationFrame(animFrame);
    clearDistractions();
    const overlay = document.getElementById('gym_failoverlay');
    if (overlay) {
      /* plain fade — deliberately calmer than the win overlay's bouncy pop */
      overlay.style.animation = 'gym_fail_fade .35s ease';
      overlay.style.display = 'flex';
    }
  }

  /* ── exit function ───────────────────────────────────────────── */
  window.ddt_gymExit = function () {
    cancelAnimationFrame(animFrame);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', resizeCanvases);
    G = null;
    if (window.state) state.viewingWorld = 'rebuilder';
    goTo('hub');
  };

  /* ── debug hook (dev-only; safe no-op in prod if never called) ── */
  window._ddtGymDbg = function () {
    return G ? {
      levelIdx: G.levelIdx,
      levelName: LEVELS[G.levelIdx] ? LEVELS[G.levelIdx].name : null,
      exIdx: G.exIdx,
      exercisesInLevel: LEVELS[G.levelIdx] ? LEVELS[G.levelIdx].exercises.length : null,
      repsDone: G.repsDone,
      score: G.score,
      stamina: G.stamina,
      totalLevels: LEVELS.length,
    } : null;
  };
  /* force-jump straight to the start of Level 3 (index 2), for QA */
  window._ddtGymForceLevel3 = function () {
    if (!G) return false;
    G.levelIdx = LEVELS.length - 1;  // index 2 = Level 3
    G.exIdx = 0;
    G.repsDone = 0;
    updateLevelBadge();
    beginExercise();
    return true;
  };

})();
