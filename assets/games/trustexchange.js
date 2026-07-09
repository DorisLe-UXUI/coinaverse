/* =====================================================================
   TRUST EXCHANGE — Coinaverse CredTech District Game #3
   Swipe TRUST UP / TRUST DOWN on 20 financial behaviour cards.
   3 LEVELS · disjoint 20-card decks · faster timer + bigger swings
   per level. Self-contained, no external deps.
   ===================================================================== */

(function (global) {
  'use strict';

  /* ── constants ──────────────────────────────────────────────────── */
  var GAME_ID      = 'game_trustexchange';
  var TOTAL_CARDS  = 20;
  var SWIPE_PX     = 70;          // px threshold to commit a swipe
  var COMBO_BONUS  = 25;          // extra pts per combo level above 1

  /* ── level configs: less time, bigger point swings, tighter stars ── */
  var LEVELS = [
    { n:1, name:'TELLER',    timerSec:60, ptsCorrect:100, ptsWrong:-50,  star3:1500, star2:900 },
    { n:2, name:'ANALYST',   timerSec:50, ptsCorrect:130, ptsWrong:-70,  star3:1900, star2:1150 },
    { n:3, name:'DIRECTOR',  timerSec:42, ptsCorrect:160, ptsWrong:-90,  star3:2300, star2:1400 },
  ];
  function cfgFor(level){ return LEVELS[level-1] || LEVELS[0]; }
  var curLevel = 1;

  /* ── card deck definitions — DISJOINT per level ──────────────────── */
  // LEVEL 1 · the fundamentals (10 up + 10 down)
  var DECK_L1 = [
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

  // LEVEL 2 · smart habits & sneaky traps (10 up + 10 down, all new)
  var DECK_L2 = [
    { id:'u11', label:'Pay your statement balance in full',    answer:'up',   lesson:'Paying in full every month means you never pay a cent of interest.' },
    { id:'u12', label:'Set balance alerts on your accounts',    answer:'up',   lesson:'Alerts catch high utilisation or fraud before it hurts your score.' },
    { id:'u13', label:'Keep 3+ years of history on one card',   answer:'up',   lesson:'Long-standing accounts are one of the strongest trust signals.' },
    { id:'u14', label:'Use a secured card to start building credit', answer:'up', lesson:'Secured cards let beginners build history with minimal risk.' },
    { id:'u15', label:'Budget before applying for new credit',  answer:'up',   lesson:'Knowing you can afford the payment first prevents future defaults.' },
    { id:'u16', label:'Freeze your credit when not applying',   answer:'up',   lesson:'A credit freeze blocks identity thieves from opening accounts.' },
    { id:'u17', label:'Read the full loan agreement before signing', answer:'up', lesson:'Reading fine print catches hidden fees and rate traps early.' },
    { id:'u18', label:'Report a lost card immediately',          answer:'up',   lesson:'Fast reporting limits fraud liability and protects your score.' },
    { id:'u19', label:'Space out credit applications by months', answer:'up',  lesson:'Spacing applications keeps hard inquiries from stacking up.' },
    { id:'u20', label:'Keep a small recurring charge on old cards', answer:'up', lesson:'A tiny recurring charge keeps an old account "active" so it is not closed for inactivity.' },
    { id:'d11', label:'Take a cash advance on your credit card', answer:'down', lesson:'Cash advances charge interest immediately with no grace period.' },
    { id:'d12', label:'Sign up for 3 store cards in one visit',  answer:'down', lesson:'Multiple same-day applications create several hard inquiries at once.' },
    { id:'d13', label:'Ignore a collections letter',             answer:'down', lesson:'Ignoring collections lets the debt — and the damage — grow larger.' },
    { id:'d14', label:'Use a rent-to-own store for electronics',  answer:'down', lesson:'Rent-to-own deals often carry effective APRs near 200%.' },
    { id:'d15', label:'Let a friend use your credit card number', answer:'down', lesson:'Sharing card details is one of the easiest ways fraud happens.' },
    { id:'d16', label:'Skip reading a "0% interest" BNPL contract', answer:'down', lesson:'Deferred-interest plans can charge months of retroactive interest on one late payment.' },
    { id:'d17', label:'Take out a car title loan for quick cash', answer:'down', lesson:'Title loans risk losing your car and often carry triple-digit APRs.' },
    { id:'d18', label:'Apply for credit right before a big purchase', answer:'down', lesson:'A fresh hard inquiry right before a mortgage or auto loan can raise your rate.' },
    { id:'d19', label:'Withdraw your emergency fund for shopping', answer:'down', lesson:'Without savings, the next surprise bill becomes new high-interest debt.' },
    { id:'d20', label:'Pay only the "minimum due" every month',  answer:'down', lesson:'Minimum payments can take decades to clear a balance due to interest.' },
  ];

  // LEVEL 3 · expert nuance & credit wreckers (10 up + 10 down, all new)
  var DECK_L3 = [
    { id:'u21', label:'Dispute a fraudulent account within 30 days', answer:'up', lesson:'Fast disputes under the Fair Credit Reporting Act protect your score from fraud damage.' },
    { id:'u22', label:'Diversify credit with a small installment loan', answer:'up', lesson:'A healthy mix of revolving and installment credit can nudge your score higher.' },
    { id:'u23', label:'Negotiate a lower APR with your card issuer', answer:'up', lesson:'Issuers often lower rates for customers with a strong on-time payment history.' },
    { id:'u24', label:'Use a debt snowball to clear smallest balances first', answer:'up', lesson:'Snowballing builds momentum and frees up cash flow faster than it looks.' },
    { id:'u25', label:'Add a trusted family member as an authorised user', answer:'up', lesson:'A well-managed shared account can transfer years of positive history.' },
    { id:'u26', label:'Refinance high-interest debt into a lower fixed rate', answer:'up', lesson:'Lowering your effective rate on existing debt speeds up payoff and saves money.' },
    { id:'u27', label:'Keep total credit utilisation under 10% before a mortgage application', answer:'up', lesson:'Ultra-low utilisation right before a big loan application maximises your approval odds.' },
    { id:'u28', label:'Set up a will and named beneficiaries on accounts', answer:'up', lesson:'Clear beneficiaries prevent financial chaos and protect family credit after a loss.' },
    { id:'u29', label:'Review your credit report before a major purchase', answer:'up', lesson:'Catching an error before applying can be the difference between approval and denial.' },
    { id:'u30', label:'Build a 3-6 month emergency fund before investing', answer:'up', lesson:'An emergency fund means market dips or job loss never force high-interest borrowing.' },
    { id:'d21', label:'Co-sign a large loan without checking the terms', answer:'down', lesson:'A co-signer is 100% responsible if the primary borrower stops paying — no exceptions.' },
    { id:'d22', label:'Take a margin loan against a volatile stock portfolio', answer:'down', lesson:'Falling collateral value can trigger a forced sale at the worst possible moment.' },
    { id:'d23', label:'Refinance federal student loans into a private loan for a slightly lower rate', answer:'down', lesson:'This permanently forfeits income-driven repayment and forgiveness protections.' },
    { id:'d24', label:'Borrow against home equity while home prices are falling', answer:'down', lesson:'Falling prices can leave you owing more than the home is worth.' },
    { id:'d25', label:'Stack a second loan on top of an existing HELOC', answer:'down', lesson:'Borrowing twice against the same collateral sharply raises default risk.' },
    { id:'d26', label:'Click a link in an unexpected "bank security alert" text', answer:'down', lesson:'Phishing links are a leading cause of stolen credit identities.' },
    { id:'d27', label:'Take on a balloon-payment loan without a payoff plan', answer:'down', lesson:'Balloon loans hide a massive lump sum due at the end that most borrowers cannot pay.' },
    { id:'d28', label:'Default on a loan instead of contacting the lender', answer:'down', lesson:'Lenders often offer hardship plans — silence leads straight to default and collections.' },
    { id:'d29', label:'Use invoice factoring for routine cash flow instead of emergencies', answer:'down', lesson:'Factoring fees compound into some of the highest effective rates in business financing.' },
    { id:'d30', label:'Ignore a sudden credit limit decrease from your issuer', answer:'down', lesson:'A limit cut can spike your utilisation ratio overnight — check and adjust spending fast.' },
  ];

  var DECK_SETS = [DECK_L1, DECK_L2, DECK_L3];

  /* ── module-level mouse handler refs (so exit/restart can remove them) ── */
  var _mmHandler = null;
  var _muHandler = null;

  /* ── mutable game state ─────────────────────────────────────────── */
  var s = {};   // reset on each game start

  function resetState() {
    var cfg = cfgFor(curLevel);
    var deckForLevel = DECK_SETS[curLevel - 1] || DECK_SETS[0];
    s = {
      level:       cfg.n,
      cfg:         cfg,
      deck:        shuffle(deckForLevel.slice()),
      index:       0,          // current top card index
      score:       0,
      combo:       0,
      trust:       50,         // 0-100
      timeLeft:    cfg.timerSec,
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
          '<div style="font-size:15px;font-weight:700;color:#e0d6ff;letter-spacing:.5px;">TRUST EXCHANGE <span style="color:#a78bfa;font-size:12px;">· LV '+curLevel+'/3</span></div>',
          '<div id="trx-timer" style="',
            'font-size:18px;font-weight:800;color:#a78bfa;min-width:38px;text-align:right;">',
            String(cfgFor(curLevel).timerSec),
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
      s.score  += s.cfg.ptsCorrect + bonus;
      s.trust   = Math.min(100, s.trust + 8);
      flashScreen('rgba(34,197,94,.25)');
    } else {
      s.combo   = 0;
      s.score   = Math.max(0, s.score + s.cfg.ptsWrong);
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

    var stars   = starsForScore(s.score, s.cfg);
    var trustPc = s.trust;
    var isFinalLevel = curLevel >= LEVELS.length;
    var is3star = stars === 3;
    var coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_trustexchange', { level: curLevel, stars: stars, is3star, isPerfect: trustPc >= 90 && is3star && isFinalLevel, badge: 'Perfect Trust Medal' })
      : 0;
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('credtech_trust', stars * 4);
    if (stars < 1 && typeof global.cvSave === 'function') global.cvSave();
    var lesson  = pickFinalLesson(trustPc, stars, isFinalLevel);
    var canAdvance = stars >= 1 && !isFinalLevel;

    var endEl = document.getElementById('trx-end');
    if (!endEl) return;
    endEl.innerHTML = buildEndHTML(stars, s.score, trustPc, coins, lesson, canAdvance);
    endEl.style.display = 'flex';

    /* animate trust bar fill in end screen */
    setTimeout(function () {
      var endBar = document.getElementById('trx-end-bar-fill');
      if (endBar) endBar.style.width = trustPc + '%';
    }, 100);
  }

  function starsForScore(score, cfg) {
    var c = cfg || cfgFor(curLevel);
    if (score >= c.star3) return 3;
    if (score >= c.star2) return 2;
    if (score >= Math.round(c.star2 * 0.33)) return 1;
    return 0;
  }
  function starIcons(stars) {
    return stars > 0 ? '⭐'.repeat(stars) : '🌑';
  }

  function pickFinalLesson(trust, stars, isFinalLevel) {
    if (stars === 3 && isFinalLevel) return 'MISSION ACCOMPLISHED! You understand what builds a trustworthy credit profile at every level.';
    if (trust >= 70) return 'Excellent! You understand what builds a trustworthy credit profile.';
    if (trust >= 40) return 'Good effort. Focus on on-time payments and low utilisation to grow trust further.';
    return 'NICE TRY! Power up and try again — credit takes time, start with small, consistent positive habits.';
  }

  function buildEndHTML(stars, score, trustPc, coins, lesson, canAdvance) {
    var barColor = trustPc > 70 ? '#4ade80' : trustPc < 30 ? '#f87171' : '#a78bfa';
    var cfg = cfgFor(curLevel);
    var isFinalLevel = curLevel >= LEVELS.length;
    return [
      '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:6px;">LEVEL '+curLevel+' · '+cfg.name+'</div>',
      '<div style="font-size:44px;margin-bottom:4px;">'+starIcons(stars)+'</div>',
      '<div style="font-size:22px;font-weight:800;color:#e0d6ff;margin-bottom:2px;">'+(stars===3 && isFinalLevel ? 'MISSION ACCOMPLISHED' : stars>=1 ? 'CHALLENGE COMPLETE' : 'NICE TRY!')+'</div>',
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

      canAdvance ? (
        '<button onclick="trxNextLevel()" style="',
          'width:100%;max-width:320px;padding:14px;margin-bottom:12px;border-radius:14px;',
          'background:linear-gradient(135deg,#facc15,#f59e0b);',
          'border:none;color:#1a0d00;font-size:15px;font-weight:800;cursor:pointer;">',
          'LEVEL '+(curLevel+1)+' · '+LEVELS[curLevel].name+' ▶',
        '</button>'
      ) : '',

      '<div style="display:flex;gap:12px;width:100%;max-width:320px;">',
        '<button onclick="trxRestart()" style="',
          'flex:1;padding:14px;border-radius:14px;',
          'background:linear-gradient(135deg,#7c3aed,#a78bfa);',
          'border:none;color:#fff;font-size:15px;font-weight:800;cursor:pointer;">',
          canAdvance ? '↺ REPLAY LEVEL' : '↺ PLAY AGAIN',
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
    curLevel = 1;
    if (global.state) global.state.viewingWorld = 'credtech';
    if (typeof global.goTo === 'function') global.goTo('credtech_hub');
  };

  global.trxRestart = function () {
    clearInterval(s.timerHandle);
    document.removeEventListener('keydown', onKey);
    if (_mmHandler) { document.removeEventListener('mousemove', _mmHandler); _mmHandler = null; }
    if (_muHandler) { document.removeEventListener('mouseup',   _muHandler); _muHandler = null; }
    /* re-run the screen in-place (replays the level currently in curLevel) */
    var container = document.getElementById('trx-root');
    if (container && container.parentNode) {
      var parent = container.parentNode;
      parent.innerHTML = buildHTML();
    }
    initGame();
  };

  global.trxNextLevel = function () {
    if (curLevel >= LEVELS.length) return;
    curLevel++;
    global.trxRestart();
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
    curLevel = 1; // fresh entry from hub always starts at Level 1
    setTimeout(initGame, 40);
    return buildHTML();
  };

  /* ── also expose a standalone init for direct injection ─────────── */
  global.initTrustExchange = initGame;

  /* ── QA debug hook ─────────────────────────────────────────────── */
  global._trxDbg = function(){
    return s ? { level: curLevel, score: s.score, trust: s.trust, timeLeft: s.timeLeft, deckLen: s.deck.length, firstCardId: s.deck[0] && s.deck[0].id, ended: s.ended } : null;
  };
  global._trxForceWin = function(){
    if (!s) return;
    s.score = cfgFor(curLevel).star3;
    s.trust = 95;
    endGame();
  };

})(window);
