/**
 * REPAYMENT RUNWAY — CredTech Galaxy District 4
 * Endless runner: jump over walls/pits, duck under drones, collect payment coins & streak stars
 * Standard IIFE/SCREENS pattern · requestAnimationFrame 60fps canvas
 */
(function () {
  'use strict';

  /* ── State ref ──────────────────────────────────────────────────────────── */
  const S = () => window.cvState || (window.cvState = {});

  /* ── Constants ──────────────────────────────────────────────────────────── */
  const GAME_DURATION   = 90;        // seconds
  const GROUND_Y_RATIO  = 0.72;      // canvas fraction
  const SPEED_START     = 4.2;
  const SPEED_END       = 9.5;
  const JUMP_VY         = -15;
  const GRAVITY         = 0.55;
  const DUCK_SCALE      = 0.55;      // hitbox shrink when ducking
  const HIT_STUN        = 1100;      // ms
  const HIT_FICO_DMAG   = 12;
  const HIT_SCORE_PEN   = 30;
  const COIN_PTS        = 10;
  const STAR_PTS        = 50;
  const FICO_MIN        = 300;
  const FICO_MAX        = 850;
  const FICO_GAIN_COIN  = 4;
  const FICO_GAIN_STAR  = 12;

  // Streak multiplier table  [minStreak, multiplier]
  const STREAK_TABLE = [[20,8],[14,6],[9,4],[5,3],[3,2],[1,1.5],[0,1]];

  const COLORS = {
    sky        : '#0d0d2b',
    ground     : '#1a1a3e',
    gridLine   : '#1e2a5a',
    player     : '#f59e0b',
    playerGlow : '#fcd34d',
    coin       : '#22c55e',
    star       : '#fbbf24',
    wall       : '#ef4444',
    pit        : '#7c3aed',
    drone      : '#f97316',
    hud        : '#e2e8f0',
    hudAccent  : '#fbbf24',
    ficoBar    : '#22c55e',
    ficoTrack  : '#1e293b',
    red        : '#ef4444',
    flash      : 'rgba(239,68,68,0.25)',
    hint       : 'rgba(0,0,0,0.72)',
  };

  /* ══════════════════════════════════════════════════════════════════════════
     MAIN ENTRY — exported to window for route dispatch
  ══════════════════════════════════════════════════════════════════════════ */
  window.playRepaymentRunway = function playRepaymentRunway(container) {
    /* cleanup any previous instance */
    container.innerHTML = '';

    /* ── Canvas setup ───────────────────────────────────────────────────── */
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W, H, GROUND_Y;
    function resize() {
      W = canvas.width  = container.clientWidth  || 800;
      H = canvas.height = container.clientHeight || 500;
      GROUND_Y = H * GROUND_Y_RATIO;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    /* ── Screens ────────────────────────────────────────────────────────── */
    const SCREENS = { TITLE:0, PLAYING:1, PAUSED:2, END:3 };
    let screen = SCREENS.TITLE;

    /* ── Game state ─────────────────────────────────────────────────────── */
    let score, fico, coinsCollected, streakCount, multiplier;
    let timeLeft, startTime, lastTime;
    let speed;
    let stunUntil, flashUntil;
    let hintsVisible, hintsOpacity;
    let player, obstacles, collectibles;
    let particles;
    let rafId;
    let gameEnded;

    /* ── Player object ──────────────────────────────────────────────────── */
    function makePlayer() {
      const r = Math.min(W, H) * 0.038;
      return {
        x      : W * 0.18,
        y      : GROUND_Y - r,
        r,
        vy     : 0,
        onGround: true,
        ducking : false,
        legPhase: 0,
        stunRing: 0,   // radius of stun burst ring (0=none)
      };
    }

    /* ── Init / reset ───────────────────────────────────────────────────── */
    function initGame() {
      score          = 0;
      fico           = 580;
      coinsCollected = 0;
      streakCount    = 0;
      multiplier     = 1;
      timeLeft       = GAME_DURATION;
      startTime      = null;
      lastTime       = null;
      speed          = SPEED_START;
      stunUntil      = 0;
      flashUntil     = 0;
      hintsVisible   = true;
      hintsOpacity   = 1;
      obstacles      = [];
      collectibles   = [];
      particles      = [];
      gameEnded      = false;
      player         = makePlayer();
      nextObstAt     = W * 0.9;
      nextCoinAt     = W * 0.6;
      obsGap         = W * 0.55;
      coinGap        = W * 0.38;
    }

    let nextObstAt, nextCoinAt, obsGap, coinGap;

    /* ── Input ──────────────────────────────────────────────────────────── */
    let keys = {};
    let touchStartY = null;

    function doJump() {
      if (screen !== SCREENS.PLAYING) return;
      if (Date.now() < stunUntil) return;
      if (player.onGround) {
        player.vy = JUMP_VY;
        player.onGround = false;
      }
    }

    function doDuck() {
      if (screen !== SCREENS.PLAYING) return;
      player.ducking = true;
    }

    function onKeyDown(e) {
      keys[e.code] = true;
      if (screen === SCREENS.TITLE) { startGame(); return; }
      if (screen === SCREENS.END)   { return; }
      if (e.code === 'Space' || e.code === 'ArrowUp')   { e.preventDefault(); doJump(); }
      if (e.code === 'ArrowDown' || e.code === 'KeyS')  { e.preventDefault(); doDuck(); }
      if (e.code === 'Escape') togglePause();
    }

    function onKeyUp(e) {
      keys[e.code] = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') player.ducking = false;
    }

    function onMouseDown(e) {
      if (screen === SCREENS.TITLE) { startGame(); return; }
      if (screen === SCREENS.END)   { handleEndClick(e); return; }
      doJump();
    }

    function onTouchStart(e) {
      e.preventDefault();
      touchStartY = e.touches[0].clientY;
      if (screen === SCREENS.TITLE) { startGame(); return; }
      if (screen === SCREENS.END)   { handleEndTap(e); return; }
      doJump();
    }

    function onTouchEnd(e) {
      e.preventDefault();
      player.ducking = false;
    }

    function onTouchMove(e) {
      e.preventDefault();
      if (!touchStartY) return;
      const dy = e.touches[0].clientY - touchStartY;
      if (dy > 40) { doDuck(); }
    }

    canvas.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('keyup',   onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.tabIndex = 0;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);

    /* ── Pause ──────────────────────────────────────────────────────────── */
    function togglePause() {
      if (screen === SCREENS.PLAYING) {
        screen = SCREENS.PAUSED;
      } else if (screen === SCREENS.PAUSED) {
        screen = SCREENS.PLAYING;
        lastTime = performance.now();
      }
    }

    /* ── Obstacle generation ─────────────────────────────────────────────── */
    const OBS_TYPES = ['wall', 'pit', 'drone'];

    function spawnObstacle() {
      const type = OBS_TYPES[Math.floor(Math.random() * OBS_TYPES.length)];
      const pr   = player.r;

      if (type === 'wall') {
        const h = pr * (2 + Math.random() * 1.8);
        obstacles.push({
          type, x: W + 20,
          y: GROUND_Y - h,
          w: pr * 0.9, h,
          label: 'MISSED\nPAYMENT',
        });
      } else if (type === 'pit') {
        const pw = pr * (2.5 + Math.random() * 2);
        obstacles.push({
          type, x: W + 20,
          y: GROUND_Y,
          w: pw, h: H - GROUND_Y + 4,
          label: 'DEBT PIT',
        });
      } else {
        // drone — bobs vertically above ground
        const bobH = GROUND_Y - pr * (3 + Math.random() * 2);
        obstacles.push({
          type, x: W + 20,
          y: bobH,
          w: pr * 1.6, h: pr * 0.9,
          bobBase: bobH,
          bobAmp : pr * 0.6,
          bobPhase: Math.random() * Math.PI * 2,
          label: 'BILL\nCOLLECTOR',
        });
      }

      obsGap  = W * (0.45 + Math.random() * 0.35) / (speed / SPEED_START);
      nextObstAt = obstacles[obstacles.length - 1].x + obsGap;
    }

    /* ── Collectible generation ──────────────────────────────────────────── */
    function spawnCollectible() {
      const isStar = coinsCollected > 0 && coinsCollected % 5 === 0;
      const pr = player.r;
      const cx = W + 20;
      const cy = isStar
        ? GROUND_Y - pr * 3.2
        : GROUND_Y - pr * 1.2;

      collectibles.push({
        type  : isStar ? 'star' : 'coin',
        x: cx, y: cy,
        r: pr * (isStar ? 0.85 : 0.65),
        bobPhase: Math.random() * Math.PI * 2,
        collected: false,
      });

      coinGap   = W * (0.28 + Math.random() * 0.22);
      nextCoinAt = cx + coinGap;
    }

    /* ── Particle system ─────────────────────────────────────────────────── */
    function spawnParticles(x, y, color, count = 8) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const spd   = 2 + Math.random() * 4;
        particles.push({
          x, y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 2,
          life: 1,
          decay: 0.04 + Math.random() * 0.03,
          r: 3 + Math.random() * 4,
          color,
        });
      }
    }

    /* ── Streak multiplier ───────────────────────────────────────────────── */
    function computeMultiplier(streak) {
      for (const [min, mul] of STREAK_TABLE) {
        if (streak >= min) return mul;
      }
      return 1;
    }

    /* ── Collision ───────────────────────────────────────────────────────── */
    function circleRect(cx, cy, cr, rx, ry, rw, rh) {
      const nearX = Math.max(rx, Math.min(cx, rx + rw));
      const nearY = Math.max(ry, Math.min(cy, ry + rh));
      const dx = cx - nearX, dy = cy - nearY;
      return dx * dx + dy * dy < cr * cr;
    }

    function checkCollisions(now) {
      if (now < stunUntil) return;

      const pr = player.ducking ? player.r * DUCK_SCALE : player.r;
      const px = player.x, py = player.y;

      // pits: player falls in if feet below GROUND_Y inside pit x-range
      for (const ob of obstacles) {
        if (ob.type === 'pit') {
          const onPit = px + pr * 0.4 > ob.x && px - pr * 0.4 < ob.x + ob.w;
          if (onPit && player.onGround) {
            triggerHit(now); return;
          }
        } else {
          if (circleRect(px, py, pr * 0.82, ob.x, ob.y, ob.w, ob.h)) {
            triggerHit(now); return;
          }
        }
      }

      // collectibles
      for (const col of collectibles) {
        if (col.collected) continue;
        const dx = px - col.x, dy = py - col.y;
        if (dx * dx + dy * dy < (pr + col.r) * (pr + col.r)) {
          col.collected = true;
          collectItem(col, now);
        }
      }
    }

    function triggerHit(now) {
      stunUntil  = now + HIT_STUN;
      flashUntil = now + 300;
      score      = Math.max(0, score - HIT_SCORE_PEN);
      fico       = Math.max(FICO_MIN, fico - HIT_FICO_DMAG);
      streakCount = 0;
      multiplier  = 1;
      player.stunRing = player.r;
      spawnParticles(player.x, player.y, COLORS.red, 12);
      // bounce up slightly
      if (player.onGround) { player.vy = JUMP_VY * 0.4; player.onGround = false; }
    }

    function collectItem(col, now) {
      if (col.type === 'coin') {
        const pts = Math.round(COIN_PTS * multiplier);
        score += pts;
        fico   = Math.min(FICO_MAX, fico + FICO_GAIN_COIN);
        coinsCollected++;
        streakCount++;
        multiplier = computeMultiplier(streakCount);
        spawnParticles(col.x, col.y, COLORS.coin, 6);
      } else {
        const pts = Math.round(STAR_PTS * multiplier);
        score += pts;
        fico   = Math.min(FICO_MAX, fico + FICO_GAIN_STAR);
        streakCount++;
        multiplier = computeMultiplier(streakCount);
        spawnParticles(col.x, col.y, COLORS.star, 10);
      }
    }

    /* ── Update ──────────────────────────────────────────────────────────── */
    function update(now, dt) {
      if (screen !== SCREENS.PLAYING) return;

      const dtS = dt / 1000;

      /* timer */
      timeLeft = Math.max(0, GAME_DURATION - (now - startTime) / 1000);

      /* speed ramp */
      const progress = 1 - timeLeft / GAME_DURATION;
      speed = SPEED_START + (SPEED_END - SPEED_START) * progress;

      /* hints fade */
      if (hintsVisible) {
        const elapsed = (now - startTime) / 1000;
        if (elapsed > 2.5) hintsOpacity = Math.max(0, 1 - (elapsed - 2.5) / 1);
        if (hintsOpacity <= 0) hintsVisible = false;
      }

      /* player physics */
      if (!player.onGround) {
        player.vy += GRAVITY;
        player.y  += player.vy;
      }

      /* ground snap */
      const landY = player.ducking
        ? GROUND_Y - player.r * DUCK_SCALE
        : GROUND_Y - player.r;

      if (player.y >= landY) {
        // check not over a pit
        let overPit = false;
        for (const ob of obstacles) {
          if (ob.type === 'pit') {
            if (player.x + player.r * 0.4 > ob.x && player.x - player.r * 0.4 < ob.x + ob.w) {
              overPit = true; break;
            }
          }
        }
        if (!overPit) {
          player.y = landY;
          player.vy = 0;
          player.onGround = true;
        }
      }

      player.legPhase += dtS * 12;

      /* stun ring */
      if (player.stunRing > 0) {
        player.stunRing += speed * 2;
        if (player.stunRing > player.r * 8) player.stunRing = 0;
      }

      /* obstacles */
      const obsDx = speed;
      for (const ob of obstacles) {
        ob.x -= obsDx;
        if (ob.type === 'drone') {
          ob.bobPhase += dtS * 3.5;
          ob.y = ob.bobBase + Math.sin(ob.bobPhase) * ob.bobAmp;
        }
      }
      obstacles = obstacles.filter(ob => ob.x + (ob.w || 0) > -60);

      /* spawn obstacles */
      if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < nextObstAt - W) {
        spawnObstacle();
      }

      /* collectibles */
      for (const col of collectibles) {
        col.x -= obsDx;
        col.bobPhase += dtS * 4;
      }
      collectibles = collectibles.filter(c => c.x + c.r > -40 && !c.collected);

      /* spawn coins */
      if (collectibles.length === 0 || collectibles[collectibles.length - 1].x < nextCoinAt - W) {
        spawnCollectible();
      }

      /* particles */
      for (const p of particles) {
        p.x   += p.vx;
        p.y   += p.vy;
        p.vy  += 0.2;
        p.life -= p.decay;
      }
      particles = particles.filter(p => p.life > 0);

      /* collisions */
      checkCollisions(now);

      /* end */
      if (timeLeft <= 0 && !gameEnded) {
        gameEnded = true;
        setTimeout(() => endGame(), 400);
      }
    }

    /* ── End game ────────────────────────────────────────────────────────── */
    function endGame() {
      screen = SCREENS.END;

      const st = S();
      const _rrStars = starRating();
      const coinsEarned = _rrStars >= 1 && window.cvAwardGame
        ? cvAwardGame('game_repaymentrunway', { level: 1, stars: _rrStars, is3star: _rrStars===3, isPerfect: _rrStars===3&&streakCount>=10, badge: 'Repayment Runway Master' })
        : Math.floor(score / 15);
      if (_rrStars >= 1 && window.cvHubMeter) cvHubMeter('credtech_trust', _rrStars*4);
      // cvAwardGame already grants XP internally — only add XP on the fallback path
      if (!(_rrStars >= 1 && window.cvAwardGame) && typeof cvAddXP === 'function') cvAddXP(Math.floor(coinsEarned / 4));
      if (typeof cvSave === 'function') cvSave();
    }

    /* ── Draw helpers ────────────────────────────────────────────────────── */
    function drawBackground() {
      ctx.fillStyle = COLORS.sky;
      ctx.fillRect(0, 0, W, H);

      // scrolling grid
      const gridSpacing = W / 10;
      const offset = -(Date.now() / 8) % gridSpacing;

      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth   = 0.5;
      ctx.globalAlpha = 0.35;

      for (let x = offset; x < W; x += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND_Y);
        ctx.stroke();
      }

      // horizon lines
      for (let i = 1; i < 5; i++) {
        const y = (GROUND_Y * i) / 5;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ground
      ctx.fillStyle = COLORS.ground;
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

      // ground line glow
      const grd = ctx.createLinearGradient(0, GROUND_Y - 3, 0, GROUND_Y + 3);
      grd.addColorStop(0, '#6366f1');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, GROUND_Y - 2, W, 5);
    }

    function drawPlayer(now) {
      const px = player.x, py = player.y;
      const r  = player.r;
      const ducking = player.ducking;
      const stunned = now < stunUntil;

      ctx.save();

      // stun ring
      if (player.stunRing > 0) {
        ctx.beginPath();
        ctx.arc(px, py, player.stunRing, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239,68,68,${Math.max(0, 0.8 - player.stunRing / (r * 8))})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // glow
      const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 1.8);
      glow.addColorStop(0, stunned ? 'rgba(239,68,68,0.35)' : 'rgba(251,191,36,0.35)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, r * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // body
      const bodyR = ducking ? r * DUCK_SCALE : r;
      ctx.fillStyle = stunned ? COLORS.red : COLORS.player;
      ctx.beginPath();
      ctx.arc(px, py, bodyR, 0, Math.PI * 2);
      ctx.fill();

      // $ symbol
      ctx.fillStyle = '#1c1917';
      ctx.font      = `bold ${Math.round(bodyR * 1.1)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', px, py);

      // animated legs (only when on ground and not ducking)
      if (player.onGround && !ducking) {
        const legY  = py + bodyR;
        const swing = Math.sin(player.legPhase) * bodyR * 0.55;
        ctx.strokeStyle = COLORS.player;
        ctx.lineWidth   = bodyR * 0.28;
        ctx.lineCap     = 'round';
        // left leg
        ctx.beginPath();
        ctx.moveTo(px - bodyR * 0.3, legY);
        ctx.lineTo(px - bodyR * 0.3 + swing, legY + bodyR * 0.7);
        ctx.stroke();
        // right leg
        ctx.beginPath();
        ctx.moveTo(px + bodyR * 0.3, legY);
        ctx.lineTo(px + bodyR * 0.3 - swing, legY + bodyR * 0.7);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawObstacles() {
      for (const ob of obstacles) {
        ctx.save();

        if (ob.type === 'wall') {
          // red wall
          ctx.fillStyle = COLORS.wall;
          ctx.shadowColor = COLORS.wall;
          ctx.shadowBlur  = 12;
          ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
          // label
          ctx.shadowBlur = 0;
          ctx.fillStyle  = '#fff';
          ctx.font       = `bold ${Math.max(9, player.r * 0.55)}px sans-serif`;
          ctx.textAlign  = 'center';
          ctx.textBaseline = 'middle';
          const lines = ob.label.split('\n');
          lines.forEach((l, i) => {
            ctx.fillText(l, ob.x + ob.w / 2, ob.y + ob.h / 2 + (i - (lines.length - 1) / 2) * player.r * 0.7);
          });

        } else if (ob.type === 'pit') {
          // pit — purple void
          const grad = ctx.createLinearGradient(ob.x, ob.y, ob.x, ob.y + ob.h * 0.6);
          grad.addColorStop(0, '#7c3aed');
          grad.addColorStop(1, '#1e1b4b');
          ctx.fillStyle = grad;
          ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
          // edge glow
          ctx.strokeStyle = '#8b5cf6';
          ctx.lineWidth   = 2;
          ctx.strokeRect(ob.x, ob.y, ob.w, 2);
          // label
          ctx.fillStyle = '#c4b5fd';
          ctx.font      = `bold ${Math.max(8, player.r * 0.5)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(ob.label, ob.x + ob.w / 2, ob.y + 4);

        } else {
          // drone
          const cx = ob.x + ob.w / 2, cy = ob.y + ob.h / 2;
          // body
          ctx.fillStyle   = COLORS.drone;
          ctx.shadowColor = COLORS.drone;
          ctx.shadowBlur  = 14;
          ctx.beginPath();
          ctx.ellipse(cx, cy, ob.w / 2, ob.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          // rotors
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#fed7aa';
          ctx.lineWidth   = 2;
          const rw = ob.w * 0.4;
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(cx + side * ob.w * 0.55, cy - ob.h * 0.3, rw / 2, ob.h * 0.18, Date.now() / 60 * side, 0, Math.PI * 2);
            ctx.stroke();
          }
          // label
          ctx.fillStyle = '#fff';
          ctx.font      = `bold ${Math.max(8, player.r * 0.48)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const dlines = ob.label.split('\n');
          dlines.forEach((l, i) => {
            ctx.fillText(l, cx, cy + (i - (dlines.length - 1) / 2) * player.r * 0.6);
          });
        }

        ctx.restore();
      }
    }

    function drawCollectibles(now) {
      for (const col of collectibles) {
        if (col.collected) continue;
        ctx.save();

        const bob = Math.sin(col.bobPhase) * col.r * 0.4;
        const cx  = col.x, cy = col.y + bob;

        if (col.type === 'coin') {
          // green coin
          ctx.shadowColor = COLORS.coin;
          ctx.shadowBlur  = 10;
          ctx.fillStyle   = COLORS.coin;
          ctx.beginPath();
          ctx.arc(cx, cy, col.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#14532d';
          ctx.font      = `bold ${Math.round(col.r * 1.1)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', cx, cy);
        } else {
          // gold star
          ctx.shadowColor = COLORS.star;
          ctx.shadowBlur  = 16;
          ctx.fillStyle   = COLORS.star;
          drawStar(ctx, cx, cy, 5, col.r, col.r * 0.45);
          ctx.fillStyle = '#78350f';
          ctx.font      = `bold ${Math.round(col.r * 0.7)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', cx, cy);
        }
        ctx.restore();
      }
    }

    function drawStar(ctx, cx, cy, spikes, outer, inner) {
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        const r     = i % 2 === 0 ? outer : inner;
        if (i === 0) ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        else          ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
    }

    function drawParticles() {
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawHUD(now) {
      const fz = Math.max(13, H * 0.028);

      /* screen flash on hit */
      if (now < flashUntil) {
        ctx.fillStyle = COLORS.flash;
        ctx.fillRect(0, 0, W, H);
      }

      const pad = H * 0.03;

      /* score — top left */
      ctx.fillStyle    = COLORS.hud;
      ctx.font         = `bold ${fz}px sans-serif`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`SCORE  ${score}`, pad, pad);

      /* streak — top center */
      const mul = multiplier;
      ctx.textAlign = 'center';
      if (mul >= 2) {
        ctx.fillStyle = COLORS.star;
        ctx.font      = `bold ${fz * 1.15}px sans-serif`;
        // fire emoji
        ctx.fillText(`🔥 x${mul % 1 === 0 ? mul : mul.toFixed(1)}`, W / 2, pad);
      } else if (streakCount > 0) {
        ctx.fillStyle = COLORS.hud;
        ctx.font      = `${fz * 0.85}px sans-serif`;
        ctx.fillText(`streak x${mul % 1 === 0 ? mul : mul.toFixed(1)}`, W / 2, pad);
      }

      /* timer — top right */
      const timerColor = timeLeft <= 10 ? COLORS.red : COLORS.hud;
      ctx.fillStyle    = timerColor;
      ctx.font         = `bold ${fz}px sans-serif`;
      ctx.textAlign    = 'right';
      if (timeLeft <= 10 && Math.floor(now / 500) % 2 === 0) {
        ctx.globalAlpha = 0.55;
      }
      ctx.fillText(`⏱ ${Math.ceil(timeLeft)}s`, W - pad, pad);
      ctx.globalAlpha = 1;

      /* FICO bar — bottom */
      const barW   = W * 0.55;
      const barH   = H * 0.022;
      const barX   = (W - barW) / 2;
      const barY   = H - barH - pad;
      const ratio  = (fico - FICO_MIN) / (FICO_MAX - FICO_MIN);

      ctx.fillStyle = COLORS.ficoTrack;
      roundRect(ctx, barX, barY, barW, barH, barH / 2);
      ctx.fill();

      const barColor = fico >= 700 ? COLORS.ficoBar : fico >= 580 ? '#eab308' : COLORS.red;
      ctx.fillStyle  = barColor;
      ctx.shadowColor = barColor;
      ctx.shadowBlur  = 8;
      roundRect(ctx, barX, barY, barW * ratio, barH, barH / 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle    = COLORS.hud;
      ctx.font         = `${fz * 0.82}px sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`FICO ${fico}`, W / 2, barY + barH / 2);

      ctx.fillStyle    = COLORS.hud;
      ctx.font         = `${fz * 0.72}px sans-serif`;
      ctx.textAlign    = 'left';
      ctx.fillText('300', barX, barY + barH + 4);
      ctx.textAlign    = 'right';
      ctx.fillText('850', barX + barW, barY + barH + 4);
    }

    function drawHints() {
      if (!hintsVisible) return;
      ctx.save();
      ctx.globalAlpha = hintsOpacity * 0.85;
      ctx.fillStyle   = COLORS.hint;
      const fz = Math.max(12, H * 0.024);
      const bw = W * 0.55, bh = fz * 5;
      const bx = (W - bw) / 2, by = H * 0.38;
      roundRect(ctx, bx, by, bw, bh, 10);
      ctx.fill();
      ctx.globalAlpha = hintsOpacity;
      ctx.fillStyle   = COLORS.hud;
      ctx.font        = `${fz}px sans-serif`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('SPACE / Tap — Jump', W / 2, by + fz * 0.5);
      ctx.fillText('↓ / Swipe Down — Duck', W / 2, by + fz * 2);
      ctx.fillText('Hold SPACE for higher arc', W / 2, by + fz * 3.4);
      ctx.restore();
    }

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

    /* ── Title screen ────────────────────────────────────────────────────── */
    function drawTitle() {
      drawBackground();

      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      const titleFz = Math.max(28, H * 0.07);
      ctx.font      = `900 ${titleFz}px sans-serif`;
      ctx.fillStyle = COLORS.hudAccent;
      ctx.shadowColor = COLORS.hudAccent;
      ctx.shadowBlur  = 22;
      ctx.fillText('REPAYMENT RUNWAY', W / 2, H * 0.32);

      ctx.shadowBlur = 0;
      ctx.font       = `${Math.max(14, H * 0.033)}px sans-serif`;
      ctx.fillStyle  = COLORS.hud;
      ctx.fillText('Jump over walls & pits  ·  Duck under drones', W / 2, H * 0.46);
      ctx.fillText('Collect payment coins to build your streak', W / 2, H * 0.52);

      const pulse = 0.8 + Math.sin(Date.now() / 400) * 0.2;
      ctx.globalAlpha = pulse;
      ctx.font        = `bold ${Math.max(16, H * 0.038)}px sans-serif`;
      ctx.fillStyle   = COLORS.hudAccent;
      ctx.fillText('TAP or PRESS SPACE to start', W / 2, H * 0.68);

      ctx.restore();
    }

    /* ── Pause screen ────────────────────────────────────────────────────── */
    function drawPause() {
      ctx.save();
      ctx.fillStyle   = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle    = COLORS.hud;
      ctx.font         = `bold ${Math.max(24, H * 0.06)}px sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', W / 2, H / 2 - H * 0.05);
      ctx.font      = `${Math.max(14, H * 0.03)}px sans-serif`;
      ctx.fillText('Press ESC to resume', W / 2, H / 2 + H * 0.04);
      ctx.restore();
    }

    /* ── End screen ──────────────────────────────────────────────────────── */
    let endBtnPlay = null, endBtnHub = null;

    function starRating() {
      if (score >= 1200) return 3;
      if (score >= 700)  return 2;
      if (score >= 300)  return 1;
      return 0;
    }

    const LESSONS = [
      { headline: 'Consistent payments = FICO growth', body: 'Even minimum on-time payments build credit momentum month after month.' },
      { headline: 'Missed payments are expensive', body: 'A single 30-day late mark can drop your FICO 60-110 pts and stays 7 years.' },
      { headline: 'Debt compounds both ways', body: 'Pay more than the minimum to stop interest from outrunning your principal.' },
      { headline: 'Build your streak', body: '12+ months of on-time payments unlocks better loan rates and credit offers.' },
    ];

    function drawEnd() {
      drawBackground();
      ctx.save();

      const stars = starRating();
      const fz    = Math.max(14, H * 0.033);
      const lesson = LESSONS[Math.floor(coinsCollected / 5) % LESSONS.length];

      /* panel */
      const pw = Math.min(W * 0.82, 520);
      const ph = H * 0.78;
      const px = (W - pw) / 2;
      const py = (H - ph) / 2;

      ctx.fillStyle = 'rgba(15,15,40,0.95)';
      roundRect(ctx, px, py, pw, ph, 16);
      ctx.fill();

      ctx.strokeStyle = COLORS.hudAccent;
      ctx.lineWidth   = 2;
      roundRect(ctx, px, py, pw, ph, 16);
      ctx.stroke();

      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';

      /* title */
      ctx.font      = `bold ${fz * 1.3}px sans-serif`;
      ctx.fillStyle = COLORS.hudAccent;
      ctx.fillText('RUNWAY COMPLETE!', W / 2, py + fz * 0.6);

      /* stars */
      const starFz = fz * 2.2;
      ctx.font     = `${starFz}px sans-serif`;
      const filledStar = '★', emptyStar = '☆';
      let starStr = '';
      for (let i = 1; i <= 3; i++) starStr += (i <= stars ? filledStar : emptyStar);
      ctx.fillStyle = COLORS.star;
      ctx.fillText(starStr, W / 2, py + fz * 2.2);

      /* stats panel */
      const sY  = py + fz * 4.5;
      const sGap = fz * 1.65;
      const stats = [
        ['SCORE',  score],
        ['FICO',   fico],
        ['COINS',  coinsCollected],
        ['STREAK', streakCount],
      ];

      stats.forEach(([label, val], i) => {
        ctx.font      = `${fz * 0.8}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(label, W / 2 - pw * 0.18, sY + i * sGap);
        ctx.font      = `bold ${fz}px sans-serif`;
        ctx.fillStyle = COLORS.hud;
        ctx.fillText(val, W / 2 + pw * 0.12, sY + i * sGap);
      });

      /* lesson card */
      const lY  = sY + stats.length * sGap + fz * 0.8;
      ctx.fillStyle = 'rgba(99,102,241,0.18)';
      roundRect(ctx, px + pw * 0.06, lY, pw * 0.88, fz * 3.2, 10);
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth   = 1;
      roundRect(ctx, px + pw * 0.06, lY, pw * 0.88, fz * 3.2, 10);
      ctx.stroke();

      ctx.font      = `bold ${fz * 0.85}px sans-serif`;
      ctx.fillStyle = '#818cf8';
      ctx.fillText(lesson.headline, W / 2, lY + fz * 0.35);

      ctx.font      = `${fz * 0.75}px sans-serif`;
      ctx.fillStyle = '#cbd5e1';
      wrapText(ctx, lesson.body, W / 2, lY + fz * 1.35, pw * 0.8, fz * 0.9);

      /* buttons */
      const btnY = py + ph - fz * 3.5;
      const btnW = pw * 0.38, btnH = fz * 2;

      // PLAY AGAIN
      const p1x = px + pw * 0.07;
      ctx.fillStyle = COLORS.hudAccent;
      ctx.shadowColor = COLORS.hudAccent;
      ctx.shadowBlur  = 10;
      roundRect(ctx, p1x, btnY, btnW, btnH, 8);
      ctx.fill();
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = '#1c1917';
      ctx.font        = `bold ${fz * 0.88}px sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText('PLAY AGAIN', p1x + btnW / 2, btnY + btnH / 2);
      endBtnPlay = { x: p1x, y: btnY, w: btnW, h: btnH };

      // HUB
      const p2x = px + pw * 0.55;
      ctx.fillStyle = '#334155';
      roundRect(ctx, p2x, btnY, btnW, btnH, 8);
      ctx.fill();
      ctx.fillStyle   = COLORS.hud;
      ctx.fillText('HUB', p2x + btnW / 2, btnY + btnH / 2);
      endBtnHub = { x: p2x, y: btnY, w: btnW, h: btnH };

      ctx.restore();
    }

    function wrapText(ctx, text, cx, y, maxW, lineH) {
      const words = text.split(' ');
      let line = '';
      let curY = y;
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, cx, curY);
          line = word;
          curY += lineH;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, cx, curY);
    }

    function hitTest(e, btn) {
      if (!btn) return false;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width, scaleY = H / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;
      return cx >= btn.x && cx <= btn.x + btn.w && cy >= btn.y && cy <= btn.y + btn.h;
    }

    function handleEndClick(e) {
      if (hitTest(e, endBtnPlay)) { startGame(); return; }
      if (hitTest(e, endBtnHub))  { goHub(); return; }
    }

    function handleEndTap(e) {
      if (!e.changedTouches) return;
      const t = e.changedTouches[0];
      const me = { clientX: t.clientX, clientY: t.clientY };
      handleEndClick(me);
    }

    function goHub() {
      // destroy game before navigating (cancel RAF, remove listeners)
      destroy();
      // CredTech game — return to credtech_hub, standard Coinaverse pattern
      if (window.state) window.state.viewingWorld = 'credtech';
      if (typeof goTo === 'function') { goTo('credtech_hub'); return; }
      // last resort
      container.innerHTML = '<div style="color:#fff;padding:2rem;text-align:center">Return to hub</div>';
    }

    /* ── Start ───────────────────────────────────────────────────────────── */
    function startGame() {
      initGame();
      screen = SCREENS.PLAYING;
    }

    /* ── RAF loop ────────────────────────────────────────────────────────── */
    function loop(now) {
      if (!lastTime) lastTime = now;
      const dt = Math.min(now - lastTime, 50); // cap at 50ms
      lastTime = now;

      if (screen === SCREENS.PLAYING && !startTime) startTime = now;

      update(now, dt);

      /* draw */
      if (screen === SCREENS.TITLE) {
        drawTitle();
      } else {
        drawBackground();
        drawObstacles();
        drawCollectibles(now);
        drawPlayer(now);
        drawParticles();
        if (screen === SCREENS.PLAYING || screen === SCREENS.PAUSED) {
          drawHUD(now);
          drawHints();
        }
        if (screen === SCREENS.PAUSED) drawPause();
        if (screen === SCREENS.END)    drawEnd();
      }

      rafId = requestAnimationFrame(loop);
    }

    /* ── Cleanup ─────────────────────────────────────────────────────────── */
    function destroy() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup',   onKeyUp);
    }

    // expose cleanup in case hub needs it
    container._destroyGame = destroy;

    /* ── Kick off ────────────────────────────────────────────────────────── */
    screen = SCREENS.TITLE;
    rafId  = requestAnimationFrame(loop);
    canvas.focus();
  };

  /* ── SCREENS registration (required by goTo dispatcher) ──────────────── */
  if (window.SCREENS) {
    window.SCREENS.game_repaymentrunway = function () {
      if (window.state) window.state.viewingWorld = 'credtech';
      const html = '<div id="repaymentRunwayRoot" style="position:absolute;inset:0;background:#0d0d2b;overflow:hidden;"></div>';
      setTimeout(function () {
        const root = document.getElementById('repaymentRunwayRoot');
        if (root) window.playRepaymentRunway(root);
      }, 40);
      return html;
    };
  }
})();
