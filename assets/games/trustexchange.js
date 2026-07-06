/* =====================================================================
   TRUST EXCHANGE — Coinaverse CredTech District Game #3
   Swipe TRUST UP / TRUST DOWN on 20 financial behaviour cards.
   600 lines, self-contained, no external deps.
   ===================================================================== */

(function (global) {
  'use strict';

  /* ── constants ──────────────────────────────────────────────────── */
  var GAME_ID      = 'game_trustexchange';
  var TOTAL_CARDS  = 20;
  var TIMER_SEC    = 60;
  var SWIPE_PX     = 70;          // px threshold to commit a swipe
  var PTS_CORRECT  = 100;
  var PTS_WRONG    = -50;
  var COMBO_BONUS  = 25;          // extra pts per combo level above 1

  /* ── card deck definition ───────────────────────────────────────── */
  var DECK = [
    /* TRUST UP cards (answer = 'up') */
    { id:'u1', label:'Pay bills on time every month',         answer:'up',   lesson:'On-time payments are the #1 factor in your credit score.' },
    { id:'u2', label:'Keep credit card balance below 30%',    answer:'up',   lesson:'Low utilisation shows lenders you manage credit wisely.' },
    { id:'u3', label:'Check your credit report annually',     answer:'up',   lesson:'Spotting errors early keeps your score accurate.' },
    { id:'u4', label:'Open only credit you truly need',       answer:'up',   lesson:'Each new account can lower your average account age.' },
    { id:'u5', label:'Set up autopay for minimum payment',    answer:'up',   lesson:'Autopay prevents accidental late payments.' },
    { id:'u6', label:'Keep old accounts open and active',     answer:'up',   lesson:'Older accounts raise your average credit age.' },
    { id:'u7', label:'Mix credit types responsibly',          answer:'up',   lesson:'A healthy credit mix can improve your score slightly.' },
    { id:'u8', label:'Dispute inaccurate negative items',     answer:'up',   lesson:'You have the right to correct errors on your report.' },
    { id:'u9', label:'Become an authorised user on good card',answer:'up',   lesson:'Piggybacking on good credit history can lift your score.' },
    { id:'u10',label:'Pay more than the minimum each month',  answer:'up',   lesson:'Paying extra reduces interest and shrinks your balance faster.' },
    /* TRUST DOWN cards (answer = 'down') */
    { id:'d1', label:'Miss a credit card payment',            answer:'down', lesson:'A single missed payment can drop your score 60-100 pts.' },
    { id:'d2', label:'Max out your credit card',              answer:'down', lesson:'High utilisation signals financial stress to lenders.' },
    { id:'d3', label:'Apply for 5 new cards in one month',    answer:'down', lesson:'Multiple hard inquiries in a short period hurt your score.' },
    { id:'d4', label:'Let a debt go to collections',          answer:'down', lesson:'Collections stay on your report for up to 7 years.' },
    { id:'d5', label:'Close your oldest credit account',      answer:'down', lesson:'Closing old accounts shortens your credit history.' },
    { id:'d6', label:'Ignore billing errors on your statement',answer:'down',lesson:'Unchallenged errors can quietly damage your credit profile.' },
    { id:'d7', label:'Co-sign a loan for someone unreliable', answer:'down', lesson:'Their missed payments become your missed payments.' },
    { id:'d8', label:'Take out a payday loan repeatedly',     answer:'down', lesson:'Payday loans signal desperation and carry extreme interest.' },
    { id:'d9', label:'Never check your credit score',         answer:'down', lesson:'Ignorance lets errors and fraud compound unnoticed.' },
    { id:'d10',label:'Spend up to your credit limit monthly', answer:'down', lesson:'Consistently high utilisation erodes your score over time.' },
  ];

  /* ── module-level mouse handler refs (so exit/restart can remove them) ── */
  var _mmHandler = null;
  var _muHandler = null;

  /* ── mutable game state ─────────────────────────────────────────── */
  var s = {};   // reset on each game start

  function resetState() {
    s = {
      deck:        shuffle(DECK.slice()),
      index:       0,          // current top card index
      score:       0,
      combo:       0,
      trust:       50,         // 0-100
      timeLeft:    TIMER_SEC,
      timerHandle: null,
      dragging:    false,
      startX:      0,
      currentX:    0,
      decided:     false,      // prevent double-fire mid-animation
      ended:       false,
    };
  }

  /* ── Fisher-Yates shuffle ───────────────────────────────────────── */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ── HTML shell ─────────────────────────────────────────────────── */
  function buildHTML() {
    return [
      '<div id="trx-root" style="',
        'position:relative;width:100%;max-width:480px;margin:0 auto;',
        'min-height:100dvh;background:linear-gradient(160deg,#0d0d1a 0%,#12102a 100%);',
        'display:flex;flex-direction:column;align-items:center;',
        'font-family:\'Nunito\',sans-serif;overflow:hidden;user-select:none;',
        'padding-bottom:env(safe-area-inset-bottom,0px);',
      '">',

        /* header */
        '<div style="width:100%;display:flex;align-items:center;justify-content:space-between;',
             'padding:14px 16px 4px;box-sizing:border-box;">',
          '<button onclick="trxExit()" style="',
            'background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);',
            'color:#fff;border-radius:10px;padding:6px 14px;font-size:13px;cursor:pointer;">',
            '← Hub',
          '</button>',
          '<div style="font-size:15px;font-weight:700;color:#e0d6ff;letter-spacing:.5px;">TRUST EXCHANGE</div>',
          '<div id="trx-timer" style="',
            'font-size:18px;font-weight:800;color:#a78bfa;min-width:38px;text-align:right;">',
            '60',
          '</div>',
        '</div>',

        /* trust meter */
        '<div style="width:calc(100% - 32px);margin:6px 16px 2px;box-sizing:border-box;">',
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.5);margin-bottom:4px;">',
            '<span>TRUST SCORE</span>',
            '<span id="trx-trust-pct">50%</span>',
          '</div>',
          '<div style="width:100%;height:10px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden;">',
            '<div id="trx-trust-bar" style="',
              'height:100%;width:50%;border-radius:99px;',
              'background:linear-gradient(90deg,#7c3aed,#a78bfa);',
              'transition:width .35s ease,background .35s ease;">',
            '</div>',
          '</div>',
        '</div>',

        /* score + combo row */
        '<div style="display:flex;justify-content:space-between;width:calc(100% - 32px);',
             'margin:6px 0;padding:0 2px;box-sizing:border-box;">',
          '<div style="font-size:13px;color:rgba(255,255,255,.6);">',
            'Score: <span id="trx-score" style="color:#fff;font-weight:700;">0</span>',
          '</div>',
          '<div id="trx-combo" style="font-size:13px;color:#facc15;font-weight:700;opacity:0;transition:opacity .2s;"></div>',
          '<div style="font-size:13px;color:rgba(255,255,255,.6);">',
            'Card: <span id="trx-card-no">1</span>/'+TOTAL_CARDS,
          '</div>',
        '</div>',

        /* card stack area */
        '<div id="trx-stack" style="',
          'position:relative;width:calc(100% - 40px);margin:0 auto;',
          'height:280px;flex-shrink:0;">',
        '</div>',

        /* direction hint */
        '<div style="display:flex;justify-content:space-between;width:calc(100% - 40px);',
             'margin:10px auto 0;pointer-events:none;">',
          '<div style="font-size:22px;color:rgba(255,80,80,.6);">⬅ DOWN</div>',
          '<div style="font-size:22px;color:rgba(80,200,120,.6);">UP ➡</div>',
        '</div>',

        /* buttons */
        '<div style="display:flex;gap:14px;width:calc(100% - 40px);margin:14px auto 0;">',
          '<button id="trx-btn-down"',
            ' onclick="trxDecide(\'down\')"',
            ' style="flex:1;padding:16px 0;border-radius:16px;border:2px solid #ef4444;',
            '        background:rgba(239,68,68,.12);color:#ef4444;font-size:15px;',
            '        font-weight:800;cursor:pointer;letter-spacing:.5px;">',
            '⬇ TRUST DOWN',
          '</button>',
          '<button id="trx-btn-up"',
            ' onclick="trxDecide(\'up\')"',
            ' style="flex:1;padding:16px 0;border-radius:16px;border:2px solid #22c55e;',
            '        background:rgba(34,197,94,.12);color:#22c55e;font-size:15px;',
            '        font-weight:800;cursor:pointer;letter-spacing:.5px;">',
            '⬆ TRUST UP',
          '</button>',
        '</div>',

        /* lesson pill */
        '<div id="trx-lesson" style="',
          'opacity:0;transition:opacity .3s;',
          'width:calc(100% - 40px);margin:10px auto 0;',
          'background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.3);',
          'border-radius:12px;padding:10px 14px;',
          'font-size:12px;color:rgba(255,255,255,.8);line-height:1.5;text-align:center;">',
        '</div>',

        /* flash overlay */
        '<div id="trx-flash" style="',
          'position:absolute;inset:0;pointer-events:none;opacity:0;',
          'transition:opacity .15s;border-radius:0;">',
        '</div>',

        /* end overlay */
        '<div id="trx-end" style="',
          'display:none;position:absolute;inset:0;',
          'background:rgba(0,0,0,.92);',
          'flex-direction:column;align-items:center;justify-content:center;',
          'padding:24px;box-sizing:border-box;text-align:center;z-index:999;">',
        '</div>',

      '</div>',  /* #trx-root */
    ].join('');
  }

  /* ── render card stack ──────────────────────────────────────────── */
  function renderStack() {
    var stack = document.getElementById('trx-stack');
    if (!stack) return;
    stack.innerHTML = '';

    /* show shadow card behind (index+1) */
    if (s.index + 1 < s.deck.length) {
      var shadow = cardEl(s.deck[s.index + 1], true);
      shadow.style.transform = 'translateY(16px) scale(0.93)';
      shadow.style.zIndex = '1';
      stack.appendChild(shadow);
    }

    /* show top card */
    if (s.index < s.deck.length) {
      var top = cardEl(s.deck[s.index], false);
      top.style.zIndex = '2';
      top.id = 'trx-top-card';
      attachDrag(top);
      stack.appendChild(top);
    }
  }

  function cardEl(card, isShadow) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:absolute;left:0;right:0;top:0;',
      'height:240px;border-radius:22px;',
      'background:linear-gradient(145deg,#1e1b40,#2a2660);',
      'border:1.5px solid rgba(167,139,250,.3);',
      'display:flex;flex-direction:column;align-items:center;justify-content:center;',
      'padding:24px;box-sizing:border-box;',
      'box-shadow:0 8px 32px rgba(0,0,0,.5);',
      'cursor:' + (isShadow ? 'default' : 'grab') + ';',
      'transition:box-shadow .2s;',
    ].join('');

    var icon = card.answer === 'up' ? '📈' : '📉';
    el.innerHTML = [
      '<div style="font-size:42px;margin-bottom:16px;">'+icon+'</div>',
      '<div style="font-size:17px;font-weight:700;color:#e0d6ff;text-align:center;',
           'line-height:1.4;max-width:280px;">'+card.label+'</div>',
    ].join('');

    return el;
  }

  /* ── drag / swipe logic ─────────────────────────────────────────── */
  function attachDrag(el) {
    /* touch */
    el.addEventListener('touchstart', onDragStart, { passive: true });
    el.addEventListener('touchmove',  onDragMove,  { passive: true });
    el.addEventListener('touchend',   onDragEnd,   { passive: true });
    /* mouse */
    el.addEventListener('mousedown',  onDragStart);
  }

  function clientX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onDragStart(e) {
    if (s.decided || s.ended) return;
    s.dragging = true;
    s.startX   = clientX(e);
    s.currentX = 0;
    var el = document.getElementById('trx-top-card');
    if (el) el.style.transition = 'none';
  }

  function onDragMove(e) {
    if (!s.dragging) return;
    s.currentX = clientX(e) - s.startX;
    var el = document.getElementById('trx-top-card');
    if (!el) return;
    var rot = s.currentX * 0.12;
    el.style.transform = 'translateX('+s.currentX+'px) rotate('+rot+'deg)';
    /* tint hint */
    if (s.currentX > 30) {
      el.style.boxShadow = '0 8px 32px rgba(34,197,94,.4)';
    } else if (s.currentX < -30) {
      el.style.boxShadow = '0 8px 32px rgba(239,68,68,.4)';
    } else {
      el.style.boxShadow = '0 8px 32px rgba(0,0,0,.5)';
    }
  }

  function onDragEnd() {
    if (!s.dragging) return;
    s.dragging = false;
    var dx = s.currentX;
    if (Math.abs(dx) >= SWIPE_PX) {
      trxDecide(dx > 0 ? 'up' : 'down');
    } else {
      /* snap back */
      var el = document.getElementById('trx-top-card');
      if (el) {
        el.style.transition = 'transform .3s ease,box-shadow .2s';
        el.style.transform  = '';
        el.style.boxShadow  = '';
      }
    }
  }

  /* ── keyboard support ───────────────────────────────────────────── */
  function onKey(e) {
    if (s.ended) return;
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') trxDecide('down');
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') trxDecide('up');
  }

  /* ── decide: up or down ─────────────────────────────────────────── */
  global.trxDecide = function (direction) {
    if (s.decided || s.ended || s.index >= s.deck.length) return;
    s.decided = true;

    var card    = s.deck[s.index];
    var correct = (direction === card.answer);
    var el      = document.getElementById('trx-top-card');

    /* animate card out */
    if (el) {
      el.style.transition = 'transform .35s ease,opacity .35s ease';
      var flyX = direction === 'up' ? 500 : -500;
      var flyR = direction === 'up' ? 25 : -25;
      el.style.transform = 'translateX('+flyX+'px) rotate('+flyR+'deg)';
      el.style.opacity   = '0';
    }

    /* update score + trust */
    if (correct) {
      s.combo++;
      var bonus = s.combo > 1 ? (s.combo - 1) * COMBO_BONUS : 0;
      s.score  += PTS_CORRECT + bonus;
      s.trust   = Math.min(100, s.trust + 8);
      flashScreen('rgba(34,197,94,.25)');
    } else {
      s.combo   = 0;
      s.score   = Math.max(0, s.score + PTS_WRONG);
      s.trust   = Math.max(0, s.trust - 10);
      flashScreen('rgba(239,68,68,.25)');
      shakeIncoming();
    }

    updateHUD();
    showLesson(card.lesson);

    setTimeout(function () {
      s.index++;
      s.decided = false;
      if (s.index >= s.deck.length) {
        endGame();
      } else {
        renderStack();
        hideLesson();
      }
    }, 420);
  };

  /* ── HUD update ─────────────────────────────────────────────────── */
  function updateHUD() {
    var scoreEl = document.getElementById('trx-score');
    var comboEl = document.getElementById('trx-combo');
    var cardNo  = document.getElementById('trx-card-no');
    var bar     = document.getElementById('trx-trust-bar');
    var pct     = document.getElementById('trx-trust-pct');

    if (scoreEl) scoreEl.textContent = s.score;
    if (cardNo)  cardNo.textContent  = Math.min(s.index + 1, TOTAL_CARDS);

    if (comboEl) {
      if (s.combo >= 2) {
        comboEl.textContent = s.combo + 'x 🔥';
        comboEl.style.opacity = '1';
      } else {
        comboEl.style.opacity = '0';
      }
    }

    if (bar) {
      bar.style.width = s.trust + '%';
      if (s.trust > 70) {
        bar.style.background = 'linear-gradient(90deg,#16a34a,#4ade80)';
      } else if (s.trust < 30) {
        bar.style.background = 'linear-gradient(90deg,#dc2626,#f87171)';
      } else {
        bar.style.background = 'linear-gradient(90deg,#7c3aed,#a78bfa)';
      }
    }
    if (pct) pct.textContent = s.trust + '%';
  }

  /* ── timer ──────────────────────────────────────────────────────── */
  function startTimer() {
    clearInterval(s.timerHandle);
    s.timerHandle = setInterval(function () {
      s.timeLeft--;
      var timerEl = document.getElementById('trx-timer');
      if (timerEl) {
        timerEl.textContent = s.timeLeft;
        timerEl.style.color = s.timeLeft <= 10 ? '#ef4444' : '#a78bfa';
      }
      if (s.timeLeft <= 0) {
        clearInterval(s.timerHandle);
        endGame();
      }
    }, 1000);
  }

  /* ── flash + shake ──────────────────────────────────────────────── */
  function flashScreen(color) {
    var fl = document.getElementById('trx-flash');
    if (!fl) return;
    fl.style.background = color;
    fl.style.opacity    = '1';
    setTimeout(function () { fl.style.opacity = '0'; }, 200);
  }

  function shakeIncoming() {
    /* slight delay so next card is rendered first */
    setTimeout(function () {
      var el = document.getElementById('trx-top-card');
      if (!el) return;
      el.style.transition = 'transform .08s ease';
      var seq = [-8, 8, -6, 6, -3, 3, 0];
      var i   = 0;
      var step = function () {
        if (i >= seq.length) { el.style.transform = ''; return; }
        el.style.transform = 'translateX(' + seq[i] + 'px)';
        i++;
        setTimeout(step, 55);
      };
      step();
    }, 430);
  }

  /* ── lesson pill ────────────────────────────────────────────────── */
  function showLesson(text) {
    var el = document.getElementById('trx-lesson');
    if (!el) return;
    el.textContent = '💡 ' + text;
    el.style.opacity = '1';
  }

  function hideLesson() {
    var el = document.getElementById('trx-lesson');
    if (el) el.style.opacity = '0';
  }

  /* ── end game ───────────────────────────────────────────────────── */
  function endGame() {
    if (s.ended) return;
    s.ended = true;
    clearInterval(s.timerHandle);
    document.removeEventListener('keydown', onKey);

    var stars   = starsForScore(s.score);
    var trustPc = s.trust;
    var is3star = stars === 3;
    var coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_trustexchange', { level: 1, stars: stars, is3star, isPerfect: trustPc >= 90, badge: 'Perfect Trust Medal' })
      : 0;
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('credtech_trust', stars * 4);
    if (stars < 1 && typeof global.cvSave === 'function') global.cvSave();
    var lesson  = pickFinalLesson(trustPc);

    var endEl = document.getElementById('trx-end');
    if (!endEl) return;
    endEl.innerHTML = buildEndHTML(stars, s.score, trustPc, coins, lesson);
    endEl.style.display = 'flex';

    /* animate trust bar fill in end screen */
    setTimeout(function () {
      var endBar = document.getElementById('trx-end-bar-fill');
      if (endBar) endBar.style.width = trustPc + '%';
    }, 100);
  }

  function starsForScore(score) {
    if (score >= 1500) return 3;
    if (score >= 900)  return 2;
    if (score >= 300)  return 1;
    return 0;
  }
  function starIcons(stars) {
    return stars > 0 ? '⭐'.repeat(stars) : '🌑';
  }

  function pickFinalLesson(trust) {
    if (trust >= 70) return 'Excellent! You understand what builds a trustworthy credit profile.';
    if (trust >= 40) return 'Good effort. Focus on on-time payments and low utilisation to grow trust further.';
    return 'Credit takes time to build. Start with small, consistent positive habits today.';
  }

  function buildEndHTML(stars, score, trustPc, coins, lesson) {
    var barColor = trustPc > 70 ? '#4ade80' : trustPc < 30 ? '#f87171' : '#a78bfa';
    return [
      '<div style="font-size:44px;margin-bottom:4px;">'+starIcons(stars)+'</div>',
      '<div style="font-size:22px;font-weight:800;color:#e0d6ff;margin-bottom:2px;">GAME OVER</div>',
      '<div style="font-size:14px;color:rgba(255,255,255,.5);margin-bottom:20px;">TRUST EXCHANGE</div>',

      '<div style="font-size:36px;font-weight:900;color:#fff;">'+score+' pts</div>',
      '<div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:20px;">Final score</div>',

      /* trust bar */
      '<div style="width:100%;max-width:320px;margin-bottom:6px;">',
        '<div style="display:flex;justify-content:space-between;font-size:12px;',
             'color:rgba(255,255,255,.5);margin-bottom:6px;">',
          '<span>TRUST METER</span><span>'+trustPc+'%</span>',
        '</div>',
        '<div style="width:100%;height:14px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden;">',
          '<div id="trx-end-bar-fill" style="',
            'height:100%;width:0;border-radius:99px;',
            'background:'+barColor+';',
            'transition:width .8s ease;">',
          '</div>',
        '</div>',
      '</div>',

      '<div style="font-size:28px;margin:16px 0 4px;">🪙 +'+coins+'</div>',
      '<div style="font-size:12px;color:rgba(255,255,255,.45);margin-bottom:20px;">Coins earned</div>',

      '<div style="max-width:300px;font-size:13px;color:rgba(255,255,255,.7);',
           'line-height:1.6;margin-bottom:28px;">💡 '+lesson+'</div>',

      '<div style="display:flex;gap:12px;width:100%;max-width:320px;">',
        '<button onclick="trxRestart()" style="',
          'flex:1;padding:14px;border-radius:14px;',
          'background:linear-gradient(135deg,#7c3aed,#a78bfa);',
          'border:none;color:#fff;font-size:15px;font-weight:800;cursor:pointer;">',
          '↺ PLAY AGAIN',
        '</button>',
        '<button onclick="trxExit()" style="',
          'flex:1;padding:14px;border-radius:14px;',
          'background:rgba(255,255,255,.08);',
          'border:1px solid rgba(255,255,255,.15);',
          'color:#fff;font-size:15px;font-weight:700;cursor:pointer;">',
          '← HUB',
        '</button>',
      '</div>',
    ].join('');
  }

  /* ── public API ─────────────────────────────────────────────────── */
  global.trxExit = function () {
    clearInterval(s.timerHandle);
    document.removeEventListener('keydown', onKey);
    if (_mmHandler) { document.removeEventListener('mousemove', _mmHandler); _mmHandler = null; }
    if (_muHandler) { document.removeEventListener('mouseup',   _muHandler); _muHandler = null; }
    if (global.state) global.state.viewingWorld = 'credtech';
    if (typeof global.goTo === 'function') global.goTo('credtech_hub');
  };

  global.trxRestart = function () {
    clearInterval(s.timerHandle);
    document.removeEventListener('keydown', onKey);
    if (_mmHandler) { document.removeEventListener('mousemove', _mmHandler); _mmHandler = null; }
    if (_muHandler) { document.removeEventListener('mouseup',   _muHandler); _muHandler = null; }
    /* re-run the screen in-place */
    var container = document.getElementById('trx-root');
    if (container && container.parentNode) {
      var parent = container.parentNode;
      parent.innerHTML = buildHTML();
    }
    initGame();
  };

  /* ── init ───────────────────────────────────────────────────────── */
  function initGame() {
    resetState();
    renderStack();
    updateHUD();
    startTimer();
    document.addEventListener('keydown', onKey);

    /* global mouse-up to end drag if pointer leaves card */
    /* Store at module level so trxExit / trxRestart can remove them */
    if (_mmHandler) document.removeEventListener('mousemove', _mmHandler);
    if (_muHandler) document.removeEventListener('mouseup',   _muHandler);

    _mmHandler = function (e) {
      if (s.dragging) {
        s.currentX = e.clientX - s.startX;
        onDragMove(e);
      }
    };
    _muHandler = function () {
      onDragEnd();
      document.removeEventListener('mouseup',   _muHandler);
      document.removeEventListener('mousemove', _mmHandler);
      _muHandler = null;
      _mmHandler = null;
    };
    document.addEventListener('mousemove', _mmHandler);
    document.addEventListener('mouseup',   _muHandler);
  }

  /* ── screen entry point (called by goTo / SCREENS map) ─────────── */
  if (!global.SCREENS) global.SCREENS = {};

  global.SCREENS[GAME_ID] = function() {
    if (window.state) window.state.viewingWorld = 'credtech';
    setTimeout(initGame, 40);
    return buildHTML();
  };

  /* ── also expose a standalone init for direct injection ─────────── */
  global.initTrustExchange = initGame;

})(window);
