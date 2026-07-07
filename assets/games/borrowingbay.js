/**
 * BORROWING BAY — Coinaverse District 2 / CredTech
 * GDD-accurate loan approval game
 * 987 lines
 */

(() => {
  /* ─────────────────────────────────────────────
     0.  CONSTANTS & LOAN DATA
  ───────────────────────────────────────────── */
  const SCREEN_ID   = 'game_borrowingbay';
  const DISTRICT_ID = 'credtech';
  const DISTRICT_N  = 'district 2';

  const MONTHLY_INCOME   = 3200;
  const FIXED_EXPENSES   = 1400;
  const BUDGET_START     = MONTHLY_INCOME - FIXED_EXPENSES; // 1800
  const SESSION_SECS     = 90;
  const CARD_SECS        = 8;
  const PTS_CORRECT      = 200;
  const PTS_WRONG        = 100;
  const COINS_PER_STAR   = 40;

  const LOANS = [
    {
      id: 'student',
      title: 'Student Loan',
      subtitle: 'Federal subsidized — 4-yr university',
      amount: 18500,
      apr: 5.5,
      monthly: 200,
      term: '10 years',
      answer: 'APPROVE',
      reason: 'Low APR, builds credit, income-driven repayment options available.',
      fact: 'Federal student loans have fixed rates and flexible repayment plans — one of the safest ways to borrow for education.',
    },
    {
      id: 'payday',
      title: 'Payday Loan',
      subtitle: '2-week cash advance',
      amount: 500,
      apr: 391,
      monthly: 577, // lump sum in 2 wks, expressed as monthly equiv
      term: '2 weeks',
      answer: 'DECLINE',
      reason: '391% APR is predatory. A $500 loan costs $77 in 2 weeks — unsustainable.',
      fact: 'Payday loans can trap borrowers in a debt cycle. Alternatives: credit union emergency loans, 0% intro credit cards, or employer advances.',
    },
    {
      id: 'auto',
      title: 'Auto Loan',
      subtitle: 'Used car — 4-yr financing',
      amount: 12000,
      apr: 7.9,
      monthly: 292,
      term: '48 months',
      answer: 'APPROVE',
      reason: 'Reasonable APR for a used vehicle; monthly payment fits within budget.',
      fact: 'Credit unions often offer lower auto loan rates than dealerships. Always compare before signing.',
    },
    {
      id: 'creditcard',
      title: 'Credit Card Cash Advance',
      subtitle: 'Personal cash — no grace period',
      amount: 2000,
      apr: 29.99,
      monthly: 400,
      term: 'Revolving',
      answer: 'DECLINE',
      reason: 'Cash advances accrue interest immediately at ~30% APR with no grace period.',
      fact: 'Cash advances are the most expensive way to use a credit card. Use a personal loan instead — rates are typically 3x lower.',
    },
    {
      id: 'personal',
      title: 'Personal Loan',
      subtitle: 'Debt consolidation — fixed rate',
      amount: 8000,
      apr: 11.5,
      monthly: 175,
      term: '48 months',
      answer: 'APPROVE',
      reason: 'Consolidating higher-rate debt at 11.5% saves money and simplifies payments.',
      fact: 'Debt consolidation loans work best when the new rate is lower than the weighted average of existing debts.',
    },
    {
      id: 'buynow',
      title: 'Buy Now Pay Later',
      subtitle: 'Electronics — 6-mo deferred',
      amount: 1200,
      apr: 24.99,
      monthly: 220,
      term: '6 months (deferred)',
      answer: 'DECLINE',
      reason: 'Deferred interest means full 25% APR is charged retroactively if not paid in full by month 6.',
      fact: 'BNPL "0%" offers often hide deferred interest. Read the fine print — missing the payoff date can cost hundreds.',
    },
    {
      id: 'mortgage',
      title: 'Mortgage',
      subtitle: 'First home — 30-yr fixed',
      amount: 280000,
      apr: 6.8,
      monthly: 1824,
      term: '30 years',
      answer: 'DECLINE',
      reason: '$1,824 monthly exceeds our current budget of $1,800. Debt-to-income ratio too high.',
      fact: 'Lenders use a 28/36 rule: housing costs <=28% of gross income, total debt <=36%. Our income of $3,200 caps housing at $896.',
    },
    {
      id: 'homeimprove',
      title: 'Home Improvement Loan',
      subtitle: 'Kitchen remodel — HELOC',
      amount: 22000,
      apr: 8.75,
      monthly: 346,
      term: '72 months',
      answer: 'APPROVE',
      reason: 'Home equity loans at 8.75% are tax-deductible and improve property value.',
      fact: 'HELOCs use your home as collateral. The upside: lower rates. The risk: defaulting means losing your home.',
    },
  ];

  /* ─────────────────────────────────────────────
     1.  STATE
  ───────────────────────────────────────────── */
  let gs = null; // game state, reset on each play

  function freshState() {
    return {
      phase:        'idle',   // idle | playing | gate | ended
      cardIndex:    0,
      results:      [],       // 'correct' | 'wrong' | 'timeout' | null per card
      score:        0,
      budget:       BUDGET_START,
      sessionLeft:  SESSION_SECS,
      cardLeft:     CARD_SECS,
      sessionTimer: null,
      cardTimer:    null,
      startTime:    0,
      coinsEarned:  0,
    };
  }

  /* ─────────────────────────────────────────────
     2.  SCREEN REGISTRATION (runs immediately)
  ───────────────────────────────────────────── */
  function registerScreen() {
    if (!window.SCREENS) { window.SCREENS = {}; }
    window.SCREENS[SCREEN_ID] = function() {
      if (window.state) window.state.viewingWorld = 'credtech';
      gs = freshState();
      const html = `<style>${CSS}</style><div id="bb-root"><canvas id="bb-stars"></canvas>${renderTopBar()}${renderBudgetStrip()}${renderProgressDots()}<div id="bb-stage"></div></div>`;
      setTimeout(function(){
        initStarfield(); updateHUD(); renderStage(); bindKeys(); startSession();
      }, 40);
      return html;
    };
  }

  /* ─────────────────────────────────────────────
     3.  ROUTING PATCH — intercept credtech / district 2
  ───────────────────────────────────────────── */
  function patchRouter() {
    // Removed: this wrapper matched EVERY credtech district (playDistrictGame's 2nd
    // arg is the district INDEX, not a name), hijacking FICO Racer + all arcade
    // districts. Borrowing Bay is launched from the CredTech hub MINIGAMES tile.
  }

  /* ─────────────────────────────────────────────
     4.  LAUNCH
  ───────────────────────────────────────────── */
  function launchGame() {
    if (window.state) {
      window.state._returnHub = window.state.currentScreen || 'hub';
    }
    if (window.navigateTo) {
      window.navigateTo(SCREEN_ID);
    } else {
      renderGame(document.getElementById('app') || document.body);
    }
  }

  /* ─────────────────────────────────────────────
     5.  SCREEN LIFECYCLE
  ───────────────────────────────────────────── */
  function onEnter() {
    gs = freshState();
    startSession();
  }

  function onExit() {
    clearTimers();
    if (_starRafId) { cancelAnimationFrame(_starRafId); _starRafId = null; }
    if (_starResize) { window.removeEventListener('resize', _starResize); _starResize = null; }
    document.removeEventListener('keydown', onKey);
  }

  /* ─────────────────────────────────────────────
     6.  RENDER SHELL
  ───────────────────────────────────────────── */
  function renderGame(container) {
    if (!container) return;
    gs = gs || freshState();

    container.innerHTML = `
      <style>${CSS}</style>
      <div id="bb-root">
        <canvas id="bb-stars"></canvas>
        ${renderTopBar()}
        ${renderBudgetStrip()}
        ${renderProgressDots()}
        <div id="bb-stage"></div>
      </div>
    `;

    initStarfield();
    updateHUD();
    renderStage();
    bindKeys();
    startSession();
  }

  /* ─────────────────────────────────────────────
     7.  SUB-RENDERS
  ───────────────────────────────────────────── */
  function renderTopBar() {
    return `
      <div id="bb-topbar">
        <button class="bb-back" onclick="borrowingbayExit()">&#8592;</button>
        <div id="bb-title">BORROWING BAY</div>
        <div id="bb-hud-right">
          <span id="bb-score-val" class="bb-gold">0 pts</span>
          <span id="bb-session-timer" class="bb-cyan">1:30</span>
        </div>
      </div>
      <div id="bb-session-bar-wrap">
        <div id="bb-session-bar"></div>
      </div>
    `;
  }

  function renderBudgetStrip() {
    return `
      <div id="bb-budget-strip">
        <div class="bb-budget-cell">
          <div class="bb-budget-label">Monthly Income</div>
          <div class="bb-budget-val bb-green">$${fmt(MONTHLY_INCOME)}</div>
        </div>
        <div class="bb-budget-cell">
          <div class="bb-budget-label">Fixed Expenses</div>
          <div class="bb-budget-val bb-red">-$${fmt(FIXED_EXPENSES)}</div>
        </div>
        <div class="bb-budget-cell">
          <div class="bb-budget-label">Budget Left</div>
          <div class="bb-budget-val" id="bb-budget-val">$${fmt(BUDGET_START)}</div>
        </div>
      </div>
      <div id="bb-budget-bar-wrap">
        <div id="bb-budget-bar"></div>
      </div>
    `;
  }

  function renderProgressDots() {
    return `<div id="bb-dots">${LOANS.map((_, i) => `<div class="bb-dot" id="bb-dot-${i}"></div>`).join('')}</div>`;
  }

  function renderStage() {
    const stage = document.getElementById('bb-stage');
    if (!stage) return;
    if (gs.phase === 'playing') {
      renderCard(stage);
    } else if (gs.phase === 'gate') {
      renderGate(stage);
    } else if (gs.phase === 'ended') {
      renderEnd(stage);
    } else {
      stage.innerHTML = '';
    }
  }

  /* ─────────────────────────────────────────────
     8.  CARD RENDER
  ───────────────────────────────────────────── */
  function renderCard(stage) {
    const loan = LOANS[gs.cardIndex];
    const overBudget = loan.monthly > gs.budget;
    const highAPR    = loan.apr >= 20;

    stage.innerHTML = `
      <div id="bb-card" class="bb-card bb-card-enter">
        <div class="bb-card-header">
          <div class="bb-card-title">${loan.title}</div>
          <div class="bb-card-subtitle">${loan.subtitle}</div>
        </div>
        <div class="bb-card-body">
          <div class="bb-card-row">
            <div class="bb-card-field">
              <div class="bb-field-label">Loan Amount</div>
              <div class="bb-field-val bb-white">$${fmt(loan.amount)}</div>
            </div>
            <div class="bb-card-field">
              <div class="bb-field-label">Term</div>
              <div class="bb-field-val bb-white">${loan.term}</div>
            </div>
          </div>
          <div class="bb-card-row">
            <div class="bb-card-field">
              <div class="bb-field-label">APR</div>
              <div class="bb-field-val ${highAPR ? 'bb-red' : 'bb-green'}">${loan.apr}%</div>
            </div>
            <div class="bb-card-field">
              <div class="bb-field-label">Monthly Payment</div>
              <div class="bb-field-val ${overBudget ? 'bb-red' : 'bb-green'}">$${fmt(loan.monthly)}</div>
            </div>
          </div>
          ${overBudget ? `<div class="bb-over-budget">Warning: Exceeds remaining budget ($${fmt(gs.budget)} left)</div>` : ''}
        </div>
        <div class="bb-card-timer-wrap">
          <div id="bb-card-bar"></div>
        </div>
        <div class="bb-card-actions">
          <button class="bb-btn-decline" id="bb-btn-decline" onclick="bbDecide('DECLINE')">
            <span class="bb-btn-icon">x</span> DECLINE
          </button>
          <button class="bb-btn-approve" id="bb-btn-approve" onclick="bbDecide('APPROVE')">
            APPROVE <span class="bb-btn-icon">v</span>
          </button>
        </div>
        <div class="bb-swipe-hint">Swipe left / A key: Decline &nbsp;&nbsp; Approve: D key / Swipe right</div>
      </div>
    `;

    // touch support
    bindSwipe(document.getElementById('bb-card'));
    // update card timer bar immediately
    updateCardBar();
  }

  /* ─────────────────────────────────────────────
     9.  KNOWLEDGE GATE RENDER
  ───────────────────────────────────────────── */
  const GATES = {
    3: {
      icon: '📊',
      title: 'APR vs. Interest Rate',
      body: 'APR (Annual Percentage Rate) includes fees; the stated interest rate does not. Always compare APRs — a lower interest rate with high fees can cost more than a higher rate with none.',
    },
    6: {
      icon: '💡',
      title: 'Debt-to-Income Ratio',
      body: 'Lenders use DTI to measure affordability. Front-end DTI = housing costs / gross income (target <= 28%). Back-end DTI = all debt / gross income (target <= 36%). Staying within these ranges keeps you creditworthy.',
    },
  };

  function renderGate(stage) {
    const g = GATES[gs.cardIndex] || GATES[3];
    stage.innerHTML = `
      <div class="bb-gate">
        <div class="bb-gate-icon">${g.icon}</div>
        <div class="bb-gate-title">${g.title}</div>
        <div class="bb-gate-body">${g.body}</div>
        <button class="bb-gate-btn" onclick="bbResumeFromGate()">Got it — Continue</button>
      </div>
    `;
  }

  /* ─────────────────────────────────────────────
     10. END SCREEN
  ───────────────────────────────────────────── */
  function renderEnd(stage) {
    const correct = gs.results.filter(r => r === 'correct').length;
    const stars   = correct >= 7 ? 3 : correct >= 5 ? 2 : correct >= 3 ? 1 : 0;
    // coins already awarded once in endGame() — only display the stored value here
    if (gs.coinsEarned == null) gs.coinsEarned = stars * COINS_PER_STAR;

    const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);

    let lesson = '';
    if (stars === 3)      lesson = 'Outstanding! You have a banker\'s instinct for risk assessment.';
    else if (stars === 2) lesson = 'Good work! Review high-APR traps and DTI limits to go further.';
    else if (stars === 1) lesson = 'You\'re learning! Focus on APR comparison and monthly budget math.';
    else                  lesson = 'Keep practicing! Every loan rejected is a lesson earned.';

    stage.innerHTML = `
      <div class="bb-end">
        <div class="bb-end-stars">${starStr}</div>
        <div class="bb-end-score">${gs.score} pts</div>
        <div class="bb-end-correct">${correct} / ${LOANS.length} correct decisions</div>
        <div class="bb-end-coins">+${gs.coinsEarned} <span class="bb-gold">coins</span></div>
        <div class="bb-end-lesson">${lesson}</div>
        <div class="bb-end-breakdown">${renderBreakdown()}</div>
        <div class="bb-end-btns">
          <button class="bb-end-again" onclick="bbPlayAgain()">Play Again</button>
          <button class="bb-end-hub"   onclick="borrowingbayExit()">Hub</button>
        </div>
      </div>
    `;
  }

  function renderBreakdown() {
    return LOANS.map((loan, i) => {
      const r = gs.results[i];
      const icon = r === 'correct' ? 'OK' : r === 'wrong' ? 'X' : 'T';
      const cls  = r === 'correct' ? 'bb-green' : 'bb-red';
      return `<div class="bb-breakdown-row">
        <span class="${cls} bb-breakdown-icon">${icon}</span>
        <span class="bb-breakdown-name">${loan.title}</span>
        <span class="bb-breakdown-ans">${loan.answer}</span>
      </div>`;
    }).join('');
  }

  /* ─────────────────────────────────────────────
     11. HUD UPDATE
  ───────────────────────────────────────────── */
  function updateHUD() {
    // session timer
    const el = document.getElementById('bb-session-timer');
    if (el) {
      const m = Math.floor(gs.sessionLeft / 60);
      const s = gs.sessionLeft % 60;
      el.textContent = `${m}:${s.toString().padStart(2,'0')}`;
      el.className = gs.sessionLeft <= 15 ? 'bb-red bb-pulse' : 'bb-cyan';
    }

    // session bar
    const sb = document.getElementById('bb-session-bar');
    if (sb) {
      const pct = Math.max(0, (gs.sessionLeft / SESSION_SECS) * 100);
      sb.style.width = pct + '%';
      sb.style.background = gs.sessionLeft <= 15 ? '#ef4444' : gs.sessionLeft <= 30 ? '#fbbf24' : '#38bdf8';
    }

    // score
    const sc = document.getElementById('bb-score-val');
    if (sc) sc.textContent = gs.score + ' pts';

    // budget
    const bv = document.getElementById('bb-budget-val');
    if (bv) {
      bv.textContent = '$' + fmt(gs.budget);
      bv.className = 'bb-budget-val ' + (gs.budget <= 200 ? 'bb-red' : gs.budget <= 600 ? 'bb-orange' : 'bb-green');
    }

    // budget bar
    const bb2 = document.getElementById('bb-budget-bar');
    if (bb2) {
      const pct = Math.max(0, (gs.budget / BUDGET_START) * 100);
      bb2.style.width = pct + '%';
      bb2.style.background = gs.budget <= 200 ? '#ef4444' : gs.budget <= 600 ? '#fbbf24' : '#34d399';
    }

    // dots
    LOANS.forEach((_, i) => {
      const dot = document.getElementById('bb-dot-' + i);
      if (!dot) return;
      dot.className = 'bb-dot';
      if (i === gs.cardIndex && gs.phase === 'playing') dot.classList.add('bb-dot-active');
      else if (gs.results[i] === 'correct')  dot.classList.add('bb-dot-correct');
      else if (gs.results[i] === 'wrong')    dot.classList.add('bb-dot-wrong');
      else if (gs.results[i] === 'timeout')  dot.classList.add('bb-dot-timeout');
    });
  }

  function updateCardBar() {
    const bar = document.getElementById('bb-card-bar');
    if (!bar) return;
    const pct = Math.max(0, (gs.cardLeft / CARD_SECS) * 100);
    bar.style.width = pct + '%';
    bar.style.background = gs.cardLeft <= 2 ? '#ef4444' : gs.cardLeft <= 4 ? '#fbbf24' : '#34d399';
  }

  /* ─────────────────────────────────────────────
     12. TIMERS
  ───────────────────────────────────────────── */
  function startSession() {
    if (gs.phase !== 'idle') return;
    gs.phase      = 'playing';
    gs.startTime  = Date.now();
    gs.cardLeft   = CARD_SECS;

    clearTimers();

    gs.sessionTimer = setInterval(() => {
      gs.sessionLeft--;
      updateHUD();
      if (gs.sessionLeft <= 0) {
        clearTimers();
        endGame();
      }
    }, 1000);

    gs.cardTimer = setInterval(() => {
      gs.cardLeft--;
      updateCardBar();
      if (gs.cardLeft <= 0) {
        clearInterval(gs.cardTimer);
        handleDecision('TIMEOUT');
      }
    }, 1000);

    renderStage();
    updateHUD();
  }

  function clearTimers() {
    if (gs.sessionTimer) { clearInterval(gs.sessionTimer); gs.sessionTimer = null; }
    if (gs.cardTimer)    { clearInterval(gs.cardTimer);    gs.cardTimer    = null; }
  }

  function resetCardTimer() {
    if (gs.cardTimer) { clearInterval(gs.cardTimer); gs.cardTimer = null; }
    gs.cardLeft = CARD_SECS;
    updateCardBar();
    gs.cardTimer = setInterval(() => {
      gs.cardLeft--;
      updateCardBar();
      if (gs.cardLeft <= 0) {
        clearInterval(gs.cardTimer);
        gs.cardTimer = null;
        handleDecision('TIMEOUT');
      }
    }, 1000);
  }

  /* ─────────────────────────────────────────────
     13. DECISION LOGIC
  ───────────────────────────────────────────── */
  window.bbDecide = function(choice) {
    if (gs.phase !== 'playing') return;
    clearInterval(gs.cardTimer);
    gs.cardTimer = null;
    handleDecision(choice);
  };

  function handleDecision(choice) {
    const loan   = LOANS[gs.cardIndex];
    const isTimeout = (choice === 'TIMEOUT');
    const correct   = !isTimeout && (choice === loan.answer);

    const result = isTimeout ? 'timeout' : correct ? 'correct' : 'wrong';
    gs.results[gs.cardIndex] = result;

    if (correct) {
      gs.score += PTS_CORRECT;
      if (loan.answer === 'APPROVE') {
        gs.budget = Math.max(0, gs.budget - loan.monthly);
      }
    } else if (!isTimeout) {
      gs.score = Math.max(0, gs.score - PTS_WRONG);
    }

    // animate card exit
    animateCardExit(choice, () => {
      gs.cardIndex++;
      updateHUD();

      if (gs.cardIndex >= LOANS.length) {
        endGame();
        return;
      }

      // knowledge gates
      if (gs.cardIndex === 3 || gs.cardIndex === 6) {
        showGate();
      } else {
        nextCard();
      }
    });
  }

  function showGate() {
    clearTimers();
    gs.phase = 'gate';
    renderStage();
    updateHUD();
  }

  window.bbResumeFromGate = function() {
    gs.phase = 'playing';
    gs.cardLeft = CARD_SECS;
    renderStage();
    updateHUD();

    gs.cardTimer = setInterval(() => {
      gs.cardLeft--;
      updateCardBar();
      if (gs.cardLeft <= 0) {
        clearInterval(gs.cardTimer);
        gs.cardTimer = null;
        handleDecision('TIMEOUT');
      }
    }, 1000);
  };

  function nextCard() {
    gs.cardLeft = CARD_SECS;
    renderStage();
    updateHUD();
    resetCardTimer();
  }

  /* ─────────────────────────────────────────────
     14. CARD ANIMATION
  ───────────────────────────────────────────── */
  function animateCardExit(choice, cb) {
    const card = document.getElementById('bb-card');
    if (!card) { cb(); return; }

    if (choice === 'APPROVE') {
      card.style.transform   = 'translateX(120%) rotate(15deg)';
      card.style.opacity     = '0';
      card.style.transition  = 'transform 0.4s ease, opacity 0.4s ease';
    } else if (choice === 'DECLINE') {
      card.style.transform   = 'translateX(-120%) rotate(-15deg)';
      card.style.opacity     = '0';
      card.style.transition  = 'transform 0.4s ease, opacity 0.4s ease';
    } else {
      // timeout — drop
      card.style.transform   = 'translateY(60px) scale(0.85)';
      card.style.opacity     = '0';
      card.style.transition  = 'transform 0.35s ease, opacity 0.35s ease';
    }
    setTimeout(cb, 420);
  }

  /* ─────────────────────────────────────────────
     15. END GAME
  ───────────────────────────────────────────── */
  function endGame() {
    clearTimers();
    gs.phase = 'ended';

    const correct = gs.results.filter(r => r === 'correct').length;
    const stars   = correct >= 7 ? 3 : correct >= 5 ? 2 : correct >= 3 ? 1 : 0;
    const _bb3s = stars === 3;
    gs.coinsEarned = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_borrowingbay', { level: 1, stars, is3star: _bb3s, isPerfect: correct >= LOANS.length, badge: 'Loan Expert' })
      : stars * COINS_PER_STAR;
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('credtech_trust', stars*4);
    if (stars < 1 && window.cvSave) cvSave();
    if (typeof window.cvSave === 'function') {
      window.cvSave();
    }

    renderStage();
    updateHUD();
  }

  /* ─────────────────────────────────────────────
     16. PUBLIC ACTIONS
  ───────────────────────────────────────────── */
  window.borrowingbayExit = function() {
    onExit();
    if (window.state) { window.state.viewingWorld = DISTRICT_ID; } // 'credtech'
    if (typeof window.goTo === 'function') {
      window.goTo('credtech_hub');
    } else if (typeof window.navigateTo === 'function') {
      window.navigateTo('credtech_hub');
    }
  };

  window.bbPlayAgain = function() {
    onExit(); // clears timers + rAF + listeners
    gs = freshState();
    const stage = document.getElementById('bb-stage');
    if (stage) {
      renderStage(); // idle
    }
    startSession();
    updateHUD();
  };

  /* ─────────────────────────────────────────────
     17. INPUT — KEYBOARD + TOUCH/SWIPE
  ───────────────────────────────────────────── */
  function bindKeys() {
    document.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (gs.phase !== 'playing') return;
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') window.bbDecide('DECLINE');
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') window.bbDecide('APPROVE');
  }

  function bindSwipe(el) {
    if (!el) return;
    let sx = 0, sy = 0;
    el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      window.bbDecide(dx > 0 ? 'APPROVE' : 'DECLINE');
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────
     18. STARFIELD CANVAS
  ───────────────────────────────────────────── */
  let _starRafId   = null;
  let _starResize  = null;

  function initStarfield() {
    const canvas = document.getElementById('bb-stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, stars;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random(),
        da: (Math.random() * 0.005 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.a += s.da;
        if (s.a > 1 || s.a < 0) s.da *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${s.a * 0.6})`;
        ctx.fill();
      });
      _starRafId = requestAnimationFrame(draw);
    }

    resize();
    _starResize = resize;
    window.addEventListener('resize', _starResize);
    draw();
  }

  /* ─────────────────────────────────────────────
     19. HELPERS
  ───────────────────────────────────────────── */
  function fmt(n) { return Number(n).toLocaleString(); }

  /* ─────────────────────────────────────────────
     20. CSS
  ───────────────────────────────────────────── */
  const CSS = `
    #bb-root {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 100vh;
      background: #03040c;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
      color: #e2e8f0;
      box-sizing: border-box;
    }

    #bb-stars {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }

    #bb-topbar {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 640px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 8px;
      box-sizing: border-box;
    }

    .bb-back {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      color: #e2e8f0;
      width: 38px; height: 38px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .bb-back:hover { background: rgba(255,255,255,0.15); }

    #bb-title {
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 3px;
      color: #38bdf8;
      text-align: center;
    }

    #bb-hud-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    #bb-score-val {
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 13px;
      font-weight: 700;
    }

    #bb-session-timer {
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 14px;
      font-weight: 700;
    }

    #bb-session-bar-wrap {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 640px;
      height: 3px;
      background: rgba(255,255,255,0.08);
      border-radius: 2px;
      overflow: hidden;
    }
    #bb-session-bar {
      height: 100%;
      width: 100%;
      border-radius: 2px;
      background: #38bdf8;
      transition: width 1s linear, background 1s;
    }

    /* budget strip */
    #bb-budget-strip {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 640px;
      display: flex;
      justify-content: space-around;
      padding: 10px 16px 6px;
      background: rgba(15,20,40,0.7);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      box-sizing: border-box;
    }
    .bb-budget-cell { text-align: center; }
    .bb-budget-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
    .bb-budget-val { font-family: 'Orbitron', monospace, sans-serif; font-size: 13px; font-weight: 700; margin-top: 2px; }

    #bb-budget-bar-wrap {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 640px;
      height: 4px;
      background: rgba(255,255,255,0.06);
    }
    #bb-budget-bar {
      height: 100%;
      background: #34d399;
      transition: width 0.5s ease, background 0.5s;
    }

    /* dots */
    #bb-dots {
      position: relative;
      z-index: 10;
      display: flex;
      gap: 8px;
      padding: 10px 0 4px;
    }
    .bb-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      transition: background 0.3s;
    }
    .bb-dot-active   { background: #38bdf8; border-color: #38bdf8; box-shadow: 0 0 6px #38bdf8; }
    .bb-dot-correct  { background: #34d399; border-color: #34d399; }
    .bb-dot-wrong    { background: #ef4444; border-color: #ef4444; }
    .bb-dot-timeout  { background: #fbbf24; border-color: #fbbf24; }

    /* stage */
    #bb-stage {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 640px;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 16px 24px;
      box-sizing: border-box;
    }

    /* card */
    .bb-card {
      width: 100%;
      max-width: 420px;
      background: linear-gradient(145deg, #0d1526, #111827);
      border: 1px solid rgba(56,189,248,0.18);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(56,189,248,0.04);
      box-sizing: border-box;
    }

    .bb-card-enter {
      animation: bbCardIn 0.35s ease;
    }
    @keyframes bbCardIn {
      from { opacity: 0; transform: translateY(30px) scale(0.94); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .bb-card-header {
      margin-bottom: 16px;
    }
    .bb-card-title {
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 4px;
    }
    .bb-card-subtitle {
      font-size: 12px;
      color: #64748b;
    }

    .bb-card-body { margin-bottom: 14px; }
    .bb-card-row {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    .bb-card-field { flex: 1; }
    .bb-field-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 3px; }
    .bb-field-val { font-family: 'Orbitron', monospace, sans-serif; font-size: 15px; font-weight: 700; }

    .bb-over-budget {
      font-size: 11px;
      color: #ef4444;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 6px;
      padding: 6px 10px;
      margin-top: 4px;
    }

    /* card timer bar */
    .bb-card-timer-wrap {
      height: 4px;
      background: rgba(255,255,255,0.07);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    #bb-card-bar {
      height: 100%;
      width: 100%;
      background: #34d399;
      transition: width 1s linear, background 1s;
    }

    /* action buttons */
    .bb-card-actions {
      display: flex;
      gap: 12px;
    }
    .bb-btn-decline, .bb-btn-approve {
      flex: 1;
      padding: 13px 10px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: transform 0.12s, opacity 0.12s;
    }
    .bb-btn-decline {
      background: rgba(239,68,68,0.15);
      border: 1px solid rgba(239,68,68,0.35);
      color: #ef4444;
    }
    .bb-btn-approve {
      background: rgba(52,211,153,0.15);
      border: 1px solid rgba(52,211,153,0.35);
      color: #34d399;
    }
    .bb-btn-decline:hover { background: rgba(239,68,68,0.25); transform: scale(1.02); }
    .bb-btn-approve:hover { background: rgba(52,211,153,0.25); transform: scale(1.02); }
    .bb-btn-icon { font-size: 16px; }

    .bb-swipe-hint {
      text-align: center;
      font-size: 10px;
      color: #334155;
      margin-top: 10px;
    }

    /* gate */
    .bb-gate {
      width: 100%;
      max-width: 420px;
      background: linear-gradient(145deg, #0d1526, #111827);
      border: 1px solid rgba(251,191,36,0.25);
      border-radius: 20px;
      padding: 28px 24px;
      text-align: center;
      box-sizing: border-box;
      animation: bbCardIn 0.35s ease;
    }
    .bb-gate-icon { font-size: 40px; margin-bottom: 12px; }
    .bb-gate-title {
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #fbbf24;
      margin-bottom: 12px;
    }
    .bb-gate-body {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .bb-gate-btn {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #03040c;
      border: none;
      border-radius: 12px;
      padding: 12px 28px;
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .bb-gate-btn:hover { opacity: 0.85; }

    /* end screen */
    .bb-end {
      width: 100%;
      max-width: 420px;
      text-align: center;
      animation: bbCardIn 0.4s ease;
    }
    .bb-end-stars { font-size: 36px; color: #fbbf24; margin-bottom: 8px; letter-spacing: 4px; }
    .bb-end-score {
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: #fbbf24;
      margin-bottom: 4px;
    }
    .bb-end-correct { font-size: 13px; color: #64748b; margin-bottom: 8px; }
    .bb-end-coins {
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 12px;
    }
    .bb-end-lesson {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 16px;
      padding: 0 8px;
    }

    .bb-end-breakdown {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
      text-align: left;
    }
    .bb-breakdown-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 0;
      font-size: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .bb-breakdown-row:last-child { border-bottom: none; }
    .bb-breakdown-icon { font-size: 14px; width: 16px; text-align: center; }
    .bb-breakdown-name { flex: 1; color: #94a3b8; }
    .bb-breakdown-ans { font-family: 'Orbitron', monospace, sans-serif; font-size: 10px; color: #475569; letter-spacing: 1px; }

    .bb-end-btns { display: flex; gap: 12px; }
    .bb-end-again, .bb-end-hub {
      flex: 1;
      padding: 13px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      transition: opacity 0.2s;
    }
    .bb-end-again {
      background: linear-gradient(135deg, #38bdf8, #0ea5e9);
      color: #03040c;
    }
    .bb-end-hub {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      color: #e2e8f0;
    }
    .bb-end-again:hover, .bb-end-hub:hover { opacity: 0.8; }

    /* colors */
    .bb-cyan   { color: #38bdf8; }
    .bb-green  { color: #34d399; }
    .bb-red    { color: #ef4444; }
    .bb-orange { color: #fb923c; }
    .bb-gold   { color: #fbbf24; }
    .bb-white  { color: #e2e8f0; }

    .bb-pulse {
      animation: bbPulse 0.8s ease-in-out infinite;
    }
    @keyframes bbPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.5; }
    }

    @media (max-width: 420px) {
      .bb-card, .bb-gate, .bb-end { max-width: 100%; border-radius: 16px; }
      .bb-card { padding: 16px; }
      .bb-card-title { font-size: 14px; }
      .bb-field-val { font-size: 13px; }
    }
  `;

  /* ─────────────────────────────────────────────
     21. BOOT
  ───────────────────────────────────────────── */
  registerScreen();
  patchRouter();

  // expose for direct HTML invocation
  window.borrowingbayInit = function(container) {
    gs = freshState();
    renderGame(container);
  };

})();
