(function () {
  /* ─── STATE ─────────────────────────────────────────────── */
  let G = null;

  /* ─── QUESTION BANK ─────────────────────────────────────── */
  const QUESTIONS = {
    level1: [
      {
        q: "What lowers a portfolio's overall risk?",
        opts: ["Putting all money in one stock", "Diversification", "Borrowing more money", "Avoiding bonds"],
        ans: 1,
        topic: "Diversification",
        explain: "Diversification spreads risk across different assets so one loss doesn't sink the whole portfolio."
      },
      {
        q: "What is compound interest?",
        opts: ["Interest paid only on the principal", "Interest earned on both principal and previous interest", "A fixed fee charged by banks", "A type of stock dividend"],
        ans: 1,
        topic: "Compounding",
        explain: "Compound interest earns returns on your returns — the snowball effect that builds wealth over time."
      },
      {
        q: "What does a dividend represent?",
        opts: ["A fee charged when selling stock", "A portion of company profits paid to shareholders", "The daily change in stock price", "A type of bond coupon"],
        ans: 1,
        topic: "Dividends",
        explain: "Dividends are profit distributions — a reward for owning shares in a profitable company."
      },
      {
        q: "Which asset class is typically considered lowest risk?",
        opts: ["Cryptocurrency", "Small-cap stocks", "Government bonds", "Commodities futures"],
        ans: 2,
        topic: "Asset Classes",
        explain: "Government bonds are backed by sovereign credit — they carry far less volatility than equities or crypto."
      },
      {
        q: "What is the P/E ratio used to measure?",
        opts: ["A company's debt level", "How expensive a stock is relative to earnings", "Annual dividend yield", "Bond maturity date"],
        ans: 1,
        topic: "Valuation",
        explain: "Price-to-Earnings ratio tells you how much investors pay per dollar of profit — a core valuation tool."
      },
      {
        q: "What does 'buying the dip' mean?",
        opts: ["Investing in declining companies permanently", "Purchasing assets after a temporary price drop", "Selling stocks when markets fall", "Avoiding investments during downturns"],
        ans: 1,
        topic: "Market Timing",
        explain: "Buying the dip means purchasing quality assets when prices temporarily fall — getting more value per dollar."
      },
      {
        q: "What is an index fund?",
        opts: ["A fund that actively picks winning stocks", "A fund tracking a market index like the S&P 500", "A government savings account", "A type of insurance product"],
        ans: 1,
        topic: "Index Investing",
        explain: "Index funds passively track a market index, offering broad diversification at very low cost."
      },
      {
        q: "Which best describes 'risk tolerance'?",
        opts: ["The maximum return an investor can earn", "How much volatility an investor can accept", "The minimum investment amount required", "A measure of market liquidity"],
        ans: 1,
        topic: "Risk",
        explain: "Risk tolerance defines how much price swings an investor can handle emotionally and financially."
      },
      {
        q: "What is dollar-cost averaging?",
        opts: ["Buying stocks only at their lowest price", "Investing a fixed amount at regular intervals", "Converting dollars to foreign currency", "Averaging the cost of multiple brokers"],
        ans: 1,
        topic: "Investment Strategy",
        explain: "Dollar-cost averaging removes emotion by investing consistently — you buy more when prices are low."
      },
      {
        q: "What is a bull market?",
        opts: ["A market falling more than 20%", "A period of rising stock prices", "A market dominated by bond trading", "When inflation exceeds 10%"],
        ans: 1,
        topic: "Market Cycles",
        explain: "Bull markets are sustained upward trends — representing investor confidence and economic growth."
      }
    ],
    level2: [
      {
        q: "A portfolio of 60% stocks and 40% bonds is best described as:",
        opts: ["Highly aggressive", "Balanced / Moderate", "Ultra-conservative", "Speculative"],
        ans: 1,
        topic: "Portfolio Construction",
        explain: "60/40 is the classic balanced allocation — growth from equities, stability from bonds."
      },
      {
        q: "What is the Sharpe Ratio used for?",
        opts: ["Measuring a company's debt load", "Risk-adjusted return analysis", "Calculating dividend yield", "Predicting inflation rates"],
        ans: 1,
        topic: "Risk Analysis",
        explain: "Sharpe Ratio measures return earned per unit of risk — higher is better for the same return level."
      },
      {
        q: "Investor A earns 12% but takes high risk. Investor B earns 9% with low risk. Who made the better risk-adjusted decision?",
        opts: ["Investor A, always maximise returns", "Investor B, superior risk-adjusted return", "They are identical investments", "Cannot determine without more data"],
        ans: 1,
        topic: "Risk-Adjusted Returns",
        explain: "Risk-adjusted return is what separates smart from lucky investing. Lower risk for similar returns wins."
      },
      {
        q: "What does rebalancing a portfolio mean?",
        opts: ["Selling all assets and starting over", "Restoring target allocation percentages after drift", "Adding only new asset classes", "Increasing leverage to target returns"],
        ans: 1,
        topic: "Portfolio Management",
        explain: "Rebalancing maintains your intended risk level by selling overperformers and buying underperformers."
      },
      {
        q: "Which scenario best demonstrates 'sequence of returns risk'?",
        opts: ["Earning consistent 7% returns over 30 years", "Experiencing large losses early in retirement withdrawals", "Investing in multiple asset classes simultaneously", "Receiving dividends before capital gains"],
        ans: 1,
        topic: "Advanced Risk",
        explain: "Early losses during withdrawal phase can permanently damage a portfolio that later market gains can't recover."
      },
      {
        q: "What is the main advantage of tax-loss harvesting?",
        opts: ["Earning more dividends", "Offsetting capital gains with realized losses", "Avoiding all investment taxes permanently", "Increasing portfolio concentration"],
        ans: 1,
        topic: "Tax Strategy",
        explain: "Tax-loss harvesting converts paper losses into real tax savings that can offset taxable capital gains."
      },
      {
        q: "A company has high revenue growth but negative free cash flow. This suggests:",
        opts: ["It's financially healthy and ready to pay dividends", "It's investing heavily — may need external funding", "It's the ideal defensive investment", "The management team is fraudulent"],
        ans: 1,
        topic: "Fundamental Analysis",
        explain: "Negative FCF during growth phases is common — the risk is whether growth can eventually generate positive cash flow."
      },
      {
        q: "What is meant by 'moat' in investing?",
        opts: ["A company's total debt obligations", "A sustainable competitive advantage protecting profits", "The gap between bid and ask prices", "A government regulatory barrier"],
        ans: 1,
        topic: "Competitive Analysis",
        explain: "An economic moat (coined by Buffett) is what protects a company's market position from competitors."
      },
      {
        q: "Which best describes 'mean reversion'?",
        opts: ["Markets always rise in the long run", "Asset prices tend to return to historical averages", "Dividends always increase over time", "Bond yields never change direction"],
        ans: 1,
        topic: "Market Theory",
        explain: "Mean reversion suggests extreme price deviations are temporary — prices eventually return to long-run averages."
      },
      {
        q: "A company trades at P/E of 45 vs industry average of 18. This suggests:",
        opts: ["The company is deeply undervalued", "The market prices in high future growth expectations", "The company has zero debt", "The stock price will immediately fall"],
        ans: 1,
        topic: "Advanced Valuation",
        explain: "Premium P/E reflects market optimism about future earnings growth — the risk is if that growth doesn't materialise."
      }
    ]
  };

  const RANKS = ["Trainee", "Apprentice", "Analyst", "Strategist", "Elite Investor"];
  const RANK_ICONS = ["📋", "📚", "📊", "🎯", "🏆"];
  const CERT_NAMES = ["Foundation Certificate", "Certified Investor"];
  const PASS_THRESHOLD = 0.7; // 70% to pass

  /* ─── SCREEN REGISTRATION ───────────────────────────────── */
  window.SCREENS = window.SCREENS || {};

  window.SCREENS.game_inv_academy = function () {
    G = null;
    setTimeout(initGame, 40);
    return `<div id="inv_acad_root" style="position:absolute;inset:0;background:#03040c;overflow:hidden;font-family:'Inter',sans-serif;color:#fff;user-select:none;">
      <style>
        #inv_acad_root * { box-sizing: border-box; }
        @keyframes inv_pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes inv_glow { 0%,100%{box-shadow:0 0 12px #00C853aa} 50%{box-shadow:0 0 28px #00C853} }
        @keyframes inv_slide_in { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes inv_pop { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes inv_shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes inv_star_pop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 70%{transform:scale(1.3) rotate(5deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes inv_shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .inv_btn {
          background: linear-gradient(135deg, #00C853, #00a844);
          color: #03040c;
          border: none;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 15px;
          padding: 13px 28px;
          cursor: pointer;
          transition: transform .15s, box-shadow .15s;
          letter-spacing: .5px;
        }
        .inv_btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px #00C85366; }
        .inv_btn:active { transform: scale(.97); }
        .inv_btn_ghost {
          background: transparent;
          color: #00C853;
          border: 1.5px solid #00C853;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          padding: 12px 24px;
          cursor: pointer;
          transition: all .15s;
        }
        .inv_btn_ghost:hover { background: #00C85322; }
        .inv_answer_btn {
          width: 100%;
          background: rgba(0,200,83,.05);
          border: 1.5px solid rgba(0,200,83,.25);
          border-radius: 12px;
          color: #e8f5e9;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 500;
          padding: 14px 18px;
          text-align: left;
          cursor: pointer;
          transition: all .2s;
          line-height: 1.4;
        }
        .inv_answer_btn:hover:not(:disabled) { background: rgba(0,200,83,.15); border-color: #00C853; transform: translateX(4px); }
        .inv_answer_btn.inv_correct { background: rgba(0,200,83,.25) !important; border-color: #00C853 !important; color: #00C853 !important; }
        .inv_answer_btn.inv_wrong { background: rgba(255,80,80,.15) !important; border-color: #ff5050 !important; color: #ff8080 !important; animation: inv_shake .4s; }
        .inv_answer_btn:disabled { opacity: .7; cursor: default; transform: none !important; }
        .inv_glass {
          background: rgba(0,200,83,.04);
          border: 1px solid rgba(0,200,83,.18);
          border-radius: 16px;
          backdrop-filter: blur(8px);
        }
        .inv_progress_bar_outer {
          width: 100%;
          height: 6px;
          background: rgba(0,200,83,.15);
          border-radius: 3px;
          overflow: hidden;
        }
        .inv_progress_bar_inner {
          height: 100%;
          background: linear-gradient(90deg, #00C853, #69f0ae);
          border-radius: 3px;
          transition: width .4s cubic-bezier(.4,0,.2,1);
        }
        .inv_timer_ring_wrap { position: relative; width: 54px; height: 54px; flex-shrink: 0; }
        .inv_timer_svg { position: absolute; inset: 0; transform: rotate(-90deg); }
        .inv_timer_text {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', monospace; font-size: 14px; font-weight: 700;
          color: #00C853;
        }
        .inv_rank_badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(0,200,83,.1); border: 1px solid rgba(0,200,83,.3);
          border-radius: 20px; padding: 4px 12px;
          font-size: 12px; font-weight: 600; color: #00C853;
          letter-spacing: .5px;
        }
        .inv_topic_pill {
          display: inline-block;
          background: rgba(0,200,83,.12);
          border: 1px solid rgba(0,200,83,.3);
          border-radius: 20px;
          padding: 3px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #00C853;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
      </style>
      <div id="inv_acad_ui" style="position:absolute;inset:0;display:flex;flex-direction:column;"></div>
    </div>`;
  };

  /* ─── EXIT ───────────────────────────────────────────────── */
  window.inv_academyExit = function () {
    clearTimer();
    G = null;
    if (window.state) state.viewingWorld = 'investor';
    goTo('hub');
  };

  /* ─── INIT ───────────────────────────────────────────────── */
  function initGame() {
    const root = document.getElementById('inv_acad_ui');
    if (!root) return;

    G = {
      phase: 'intro',     // intro | level1 | cert1 | level2 | cert2 | end
      level: 1,
      questions: [],
      qIndex: 0,
      score: 0,
      correct: 0,
      total: 0,
      timePerQ: 30,
      timerVal: 30,
      timerInterval: null,
      answered: false,
      rankIndex: 0,
      coins: 0,
      stars: 0,
      certPassed: [false, false],
      levelStartScore: 0,
      levelCorrect: 0,
      levelTotal: 0,
      startTime: 0,
      timePenalty: 0
    };

    showIntro(root);
  }

  /* ─── INTRO SCREEN ───────────────────────────────────────── */
  function showIntro(root) {
    root.innerHTML = `
      <div style="padding:20px 16px 0;display:flex;align-items:center;gap:12px;">
        <button onclick="window.inv_academyExit()" style="background:rgba(0,200,83,.1);border:1px solid rgba(0,200,83,.3);color:#00C853;border-radius:8px;padding:8px 14px;font-size:18px;cursor:pointer;line-height:1;">←</button>
        <div style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:#00C853;letter-spacing:1px;">INVESTOR ACADEMY</div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 20px;gap:20px;animation:inv_slide_in .5s;">
        <div style="font-size:64px;line-height:1;">🎓</div>
        <div style="font-family:'Orbitron',monospace;font-size:22px;font-weight:700;color:#00C853;text-align:center;letter-spacing:1px;">INVESTOR ACADEMY</div>
        <div style="color:#b2dfdb;text-align:center;font-size:15px;line-height:1.6;max-width:320px;">
          Master investing through two levels of certification. Answer questions, solve scenarios, and earn your <strong style="color:#00C853">Certified Investor</strong> status.
        </div>
        <div class="inv_glass" style="width:100%;max-width:340px;padding:16px;display:flex;flex-direction:column;gap:12px;">
          ${levelCard('Level 1', 'Foundation', '📚', '10 questions · 30s each · Core concepts', '#00C853')}
          ${levelCard('Level 2', 'Mastery', '🏆', '10 questions · 20s each · Advanced strategy', '#69f0ae')}
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:340px;">
          <div class="inv_rank_badge" style="justify-content:center;padding:8px 0;font-size:13px;">
            📋 Starting Rank: Trainee
          </div>
          <button class="inv_btn" style="width:100%;font-size:16px;padding:16px;" onclick="window._inv_startGame()">
            Begin Academy →
          </button>
        </div>
      </div>
    `;
    window._inv_startGame = startLevel1;
  }

  function levelCard(num, name, icon, desc, color) {
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(0,200,83,.1);">
      <div style="font-size:28px;width:36px;text-align:center;">${icon}</div>
      <div style="flex:1;">
        <div style="font-family:'Orbitron',monospace;font-size:12px;color:${color};letter-spacing:1px;">${num}: ${name.toUpperCase()}</div>
        <div style="font-size:12px;color:#7cb8a0;margin-top:2px;">${desc}</div>
      </div>
    </div>`;
  }

  /* ─── LEVEL 1 ────────────────────────────────────────────── */
  function startLevel1() {
    G.phase = 'level1';
    G.level = 1;
    G.questions = shuffle([...QUESTIONS.level1]).map(shuffleOptions);
    G.qIndex = 0;
    G.correct = 0;
    G.total = 0;
    G.levelCorrect = 0;
    G.levelTotal = 0;
    G.timePerQ = 30;
    G.timePenalty = 0;
    showQuestion();
  }

  /* ─── LEVEL 2 ────────────────────────────────────────────── */
  function startLevel2() {
    G.phase = 'level2';
    G.level = 2;
    G.questions = shuffle([...QUESTIONS.level2]).map(shuffleOptions);
    G.qIndex = 0;
    G.levelCorrect = 0;
    G.levelTotal = 0;
    G.timePerQ = 20;
    G.timePenalty = 0;
    showQuestion();
  }

  /* ─── QUESTION RENDER ────────────────────────────────────── */
  function showQuestion() {
    clearTimer();
    const root = document.getElementById('inv_acad_ui');
    if (!root || !G) return;

    const q = G.questions[G.qIndex];
    const totalQ = G.questions.length;
    const progress = G.qIndex / totalQ;
    const isLevel2 = G.phase === 'level2';
    const lvlLabel = isLevel2 ? 'Level 2: Mastery' : 'Level 1: Foundation';
    const accentColor = isLevel2 ? '#69f0ae' : '#00C853';

    G.answered = false;
    G.timerVal = G.timePerQ;
    G.startTime = Date.now();

    root.innerHTML = `
      <div style="padding:16px 16px 0;display:flex;align-items:center;gap:10px;flex-shrink:0;">
        <button onclick="window.inv_academyExit()" style="background:rgba(0,200,83,.1);border:1px solid rgba(0,200,83,.3);color:#00C853;border-radius:8px;padding:8px 12px;font-size:16px;cursor:pointer;line-height:1;flex-shrink:0;">←</button>
        <div style="flex:1;min-width:0;">
          <div style="font-family:'Orbitron',monospace;font-size:11px;color:${accentColor};letter-spacing:1px;margin-bottom:4px;">${lvlLabel.toUpperCase()}</div>
          <div class="inv_progress_bar_outer">
            <div class="inv_progress_bar_inner" id="inv_prog_bar" style="width:${progress*100}%;"></div>
          </div>
        </div>
        <div class="inv_timer_ring_wrap" id="inv_timer_wrap">
          <svg class="inv_timer_svg" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
            <circle cx="27" cy="27" r="23" fill="none" stroke="rgba(0,200,83,.15)" stroke-width="4"/>
            <circle id="inv_timer_ring" cx="27" cy="27" r="23" fill="none" stroke="${accentColor}" stroke-width="4"
              stroke-dasharray="${2*Math.PI*23}" stroke-dashoffset="0" stroke-linecap="round"
              style="transition:stroke-dashoffset .9s linear,stroke .5s;"/>
          </svg>
          <div class="inv_timer_text" id="inv_timer_text" style="color:${accentColor};">${G.timerVal}</div>
        </div>
      </div>

      <div style="padding:8px 16px 0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div class="inv_rank_badge" id="inv_rank_badge">${RANK_ICONS[G.rankIndex]} ${RANKS[G.rankIndex]}</div>
        <div style="font-family:'Orbitron',monospace;font-size:13px;color:#00C853;">
          ✓ ${G.levelCorrect}/${G.qIndex} correct
        </div>
      </div>

      <div style="flex:1;overflow-y:auto;padding:12px 16px 16px;display:flex;flex-direction:column;gap:12px;" id="inv_q_scroll">
        <div class="inv_glass" style="padding:18px;animation:inv_slide_in .35s;" id="inv_q_card">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span class="inv_topic_pill">${q.topic}</span>
            <span style="margin-left:auto;font-size:12px;color:#7cb8a0;">Q${G.qIndex+1} / ${totalQ}</span>
          </div>
          <div style="font-size:17px;font-weight:600;line-height:1.5;color:#e8f5e9;margin-bottom:4px;">${q.q}</div>
        </div>

        <div id="inv_answers" style="display:flex;flex-direction:column;gap:10px;">
          ${q.opts.map((opt, i) => `
            <button class="inv_answer_btn" id="inv_ans_${i}" onclick="window._inv_answer(${i})">
              <span style="color:#00C853;font-weight:700;margin-right:8px;">${String.fromCharCode(65+i)}.</span>${opt}
            </button>
          `).join('')}
        </div>

        <div id="inv_feedback" style="display:none;" class="inv_glass" style="padding:14px;"></div>
      </div>
    `;

    // Keyboard shortcuts
    window._inv_kbHandler = function(e) {
      if (['a','b','c','d'].includes(e.key.toLowerCase())) {
        const idx = e.key.toLowerCase().charCodeAt(0) - 97;
        if (idx < q.opts.length) window._inv_answer(idx);
      }
    };
    document.addEventListener('keydown', window._inv_kbHandler);

    startTimer(q.ans);
  }

  /* ─── TIMER ──────────────────────────────────────────────── */
  function startTimer(correctIdx) {
    const circumference = 2 * Math.PI * 23;
    G.timerInterval = setInterval(() => {
      if (!G) { clearTimer(); return; }
      G.timerVal--;

      const ring = document.getElementById('inv_timer_ring');
      const txt = document.getElementById('inv_timer_text');
      if (ring) {
        const ratio = G.timerVal / G.timePerQ;
        ring.style.strokeDashoffset = circumference * (1 - ratio);
        if (G.timerVal <= 5) ring.style.stroke = '#ff5050';
        else if (G.timerVal <= 10) ring.style.stroke = '#ffd600';
      }
      if (txt) {
        txt.textContent = G.timerVal;
        if (G.timerVal <= 5) txt.style.color = '#ff5050';
        else if (G.timerVal <= 10) txt.style.color = '#ffd600';
      }

      if (G.timerVal <= 0) {
        clearTimer();
        if (!G.answered) timeOut(correctIdx);
      }
    }, 1000);
  }

  function clearTimer() {
    if (G && G.timerInterval) { clearInterval(G.timerInterval); G.timerInterval = null; }
    if (window._inv_kbHandler) {
      document.removeEventListener('keydown', window._inv_kbHandler);
      window._inv_kbHandler = null;
    }
  }

  /* ─── ANSWER HANDLER ─────────────────────────────────────── */
  window._inv_answer = function(idx) {
    if (!G || G.answered) return;
    G.answered = true;
    clearTimer();

    const q = G.questions[G.qIndex];
    const correct = idx === q.ans;
    const elapsed = (Date.now() - G.startTime) / 1000;
    const timeTaken = Math.min(elapsed, G.timePerQ);

    G.total++;
    G.levelTotal++;
    if (correct) {
      G.correct++;
      G.levelCorrect++;
      // Bonus for speed: up to 3 extra points for answering in <5s
      const speedBonus = Math.max(0, Math.floor((G.timePerQ - timeTaken) / G.timePerQ * 3));
      G.score += 10 + speedBonus;
    } else {
      G.timePenalty += timeTaken;
    }

    // Visual feedback on buttons
    const buttons = document.querySelectorAll('.inv_answer_btn');
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.ans) btn.classList.add('inv_correct');
      else if (i === idx && !correct) btn.classList.add('inv_wrong');
    });

    // Feedback panel
    const fb = document.getElementById('inv_feedback');
    if (fb) {
      fb.style.display = 'block';
      fb.style.borderColor = correct ? 'rgba(0,200,83,.4)' : 'rgba(255,80,80,.3)';
      fb.style.background = correct ? 'rgba(0,200,83,.06)' : 'rgba(255,80,80,.05)';
      fb.style.padding = '14px';
      fb.style.animation = 'inv_pop .35s';
      fb.innerHTML = `
        <div style="font-weight:700;font-size:15px;color:${correct ? '#00C853' : '#ff8080'};margin-bottom:6px;">
          ${correct ? '✓ Correct! +' + (10 + Math.max(0, Math.floor((G.timePerQ - timeTaken) / G.timePerQ * 3))) + ' pts' : '💪 Nice try!'}
        </div>
        <div style="font-size:13px;color:#b2dfdb;line-height:1.5;">${q.explain}</div>
        <button class="inv_btn" style="width:100%;margin-top:12px;padding:12px;font-size:14px;" onclick="window._inv_nextQ()">
          ${G.qIndex + 1 < G.questions.length ? 'Next Question →' : 'See Results →'}
        </button>
      `;
      fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  function timeOut(correctIdx) {
    if (!G || G.answered) return;
    G.answered = true;
    G.total++;
    G.levelTotal++;
    G.timePenalty += G.timePerQ;

    const q = G.questions[G.qIndex];
    const buttons = document.querySelectorAll('.inv_answer_btn');
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.ans) btn.classList.add('inv_correct');
    });

    const fb = document.getElementById('inv_feedback');
    if (fb) {
      fb.style.display = 'block';
      fb.style.borderColor = 'rgba(255,150,0,.3)';
      fb.style.background = 'rgba(255,150,0,.05)';
      fb.style.padding = '14px';
      fb.style.animation = 'inv_pop .35s';
      fb.innerHTML = `
        <div style="font-weight:700;font-size:15px;color:#ffa726;margin-bottom:6px;">⏱ Time's Up!</div>
        <div style="font-size:13px;color:#b2dfdb;margin-bottom:6px;">Correct answer: <strong style="color:#00C853">${q.opts[q.ans]}</strong></div>
        <div style="font-size:13px;color:#b2dfdb;line-height:1.5;">${q.explain}</div>
        <button class="inv_btn" style="width:100%;margin-top:12px;padding:12px;font-size:14px;" onclick="window._inv_nextQ()">
          ${G.qIndex + 1 < G.questions.length ? 'Next Question →' : 'See Results →'}
        </button>
      `;
    }
  }

  window._inv_nextQ = function() {
    if (!G) return;
    G.qIndex++;

    // Update rank as player progresses
    const totalCorrect = G.correct;
    if (totalCorrect >= 16) G.rankIndex = 4;
    else if (totalCorrect >= 12) G.rankIndex = 3;
    else if (totalCorrect >= 8) G.rankIndex = 2;
    else if (totalCorrect >= 4) G.rankIndex = 1;
    else G.rankIndex = 0;

    if (G.qIndex < G.questions.length) {
      showQuestion();
    } else {
      showCertification();
    }
  };

  /* ─── CERTIFICATION SCREEN ───────────────────────────────── */
  function showCertification() {
    clearTimer();
    const root = document.getElementById('inv_acad_ui');
    if (!root || !G) return;

    const certIdx = G.phase === 'level1' ? 0 : 1;
    const pct = G.levelCorrect / G.levelTotal;
    const passed = pct >= PASS_THRESHOLD;
    const certName = CERT_NAMES[certIdx];
    const isLevel2 = G.phase === 'level2';

    G.certPassed[certIdx] = passed;

    root.innerHTML = `
      <div style="padding:20px 16px 0;display:flex;align-items:center;gap:12px;flex-shrink:0;">
        <button onclick="window.inv_academyExit()" style="background:rgba(0,200,83,.1);border:1px solid rgba(0,200,83,.3);color:#00C853;border-radius:8px;padding:8px 12px;font-size:16px;cursor:pointer;">←</button>
        <div style="font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:#00C853;">CERTIFICATION CHALLENGE</div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;gap:16px;animation:inv_slide_in .4s;overflow-y:auto;">
        <div style="font-size:${passed ? '72' : '60'}px;animation:inv_pop .5s;">${passed ? '🎓' : '📋'}</div>
        <div style="font-family:'Orbitron',monospace;font-size:20px;font-weight:700;color:${passed ? '#00C853' : '#ffa726'};text-align:center;">
          ${passed ? 'CHALLENGE PASSED!' : 'NOT YET...'}
        </div>
        <div class="inv_glass" style="width:100%;max-width:340px;padding:20px;text-align:center;">
          <div style="font-size:13px;color:#7cb8a0;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">${certName}</div>
          <div style="font-family:'Orbitron',monospace;font-size:42px;font-weight:700;color:${passed ? '#00C853' : '#ffa726'};">
            ${Math.round(pct * 100)}%
          </div>
          <div style="font-size:13px;color:#b2dfdb;margin-top:4px;">${G.levelCorrect} / ${G.levelTotal} correct answers</div>
          <div class="inv_progress_bar_outer" style="margin-top:14px;">
            <div class="inv_progress_bar_inner" style="width:${pct*100}%;background:${passed ? 'linear-gradient(90deg,#00C853,#69f0ae)' : 'linear-gradient(90deg,#ffa726,#ffd600)'};"></div>
          </div>
          <div style="font-size:11px;color:#7cb8a0;margin-top:6px;">Passing threshold: ${Math.round(PASS_THRESHOLD*100)}%</div>
        </div>

        ${passed ? `
          <div style="width:100%;max-width:340px;display:flex;flex-direction:column;gap:8px;">
            <div class="inv_rank_badge" style="justify-content:center;padding:10px;font-size:13px;background:rgba(0,200,83,.1);border-color:rgba(0,200,83,.4);">
              🏅 ${certName} Earned!
            </div>
            ${!isLevel2 ? `
              <button class="inv_btn" style="width:100%;font-size:15px;padding:14px;" onclick="window._inv_goLevel2()">
                Continue to Level 2: Mastery →
              </button>
            ` : `
              <button class="inv_btn" style="width:100%;font-size:15px;padding:14px;" onclick="window._inv_finalResult()">
                Get Final Results 🎓
              </button>
            `}
          </div>
        ` : `
          <div style="width:100%;max-width:340px;display:flex;flex-direction:column;gap:8px;">
            <div style="font-size:14px;color:#ffa726;text-align:center;padding:10px;">
              You need ${Math.round(PASS_THRESHOLD*100)}% to pass. Power up and try again — you've got this!
            </div>
            <button class="inv_btn" style="width:100%;font-size:15px;padding:14px;background:linear-gradient(135deg,#ffa726,#ff8f00);color:#03040c;" onclick="window._inv_retake()">
              Retake Challenge 🔄
            </button>
            <button class="inv_btn_ghost" style="width:100%;text-align:center;" onclick="window.inv_academyExit()">
              ← Exit Academy
            </button>
          </div>
        `}
      </div>
    `;

    window._inv_goLevel2 = startLevel2;
    window._inv_retake = function() {
      if (G.phase === 'level1') startLevel1(); else startLevel2();
    };
    window._inv_finalResult = showFinalResult;
  }

  /* ─── FINAL RESULT ───────────────────────────────────────── */
  function showFinalResult() {
    clearTimer();
    const root = document.getElementById('inv_acad_ui');
    if (!root || !G) return;

    /* apply accumulated time penalty (wrong/slow answers) to final score */
    G.score = Math.max(0, Math.round(G.score - (G.timePenalty || 0)));

    const totalPct = G.correct / G.total;
    let stars = 0;
    if (G.certPassed[0] && G.certPassed[1]) {
      if (totalPct >= 0.9) stars = 3;
      else if (totalPct >= 0.75) stars = 2;
      else stars = 1;
    } else {
      stars = 0;
    }

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_inv_academy', { level: G.level, stars, badge: 'Certified Investor', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('inv_wealth', stars * 4);
    G.stars = stars;
    G.coins = coins;

    if (stars < 1 && window.cvSave) cvSave();

    G.rankIndex = stars === 3 ? 4 : stars === 2 ? 3 : stars === 1 ? 2 : G.rankIndex;

    endGame(stars, coins, root);
  }

  /* ─── END OVERLAY ────────────────────────────────────────── */
  function endGame(stars, coins, root) {
    if (!root) root = document.getElementById('inv_acad_ui');
    if (!root) return;

    const rankName = RANKS[Math.min(G.rankIndex, 4)];
    const rankIcon = RANK_ICONS[Math.min(G.rankIndex, 4)];
    const lesson = "The best investors never stop learning — mastering strategy, understanding risk, and earning your knowledge through study is how elite investors are made.";

    const starDisplay = [1, 2, 3].map(n =>
      `<span style="font-size:40px;animation:inv_star_pop .4s ${(n-1)*0.15}s both;">${n <= stars ? '⭐' : '☆'}</span>`
    ).join('');

    root.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;gap:14px;overflow-y:auto;">
        <div style="font-size:52px;animation:inv_pop .5s;">🎓</div>

        <div style="font-family:'Orbitron',monospace;font-size:20px;font-weight:700;color:#00C853;text-align:center;animation:inv_slide_in .4s;">
          ${stars === 3 ? 'ELITE INVESTOR!' : stars === 2 ? 'CERTIFIED INVESTOR!' : stars === 1 ? 'ACADEMY GRADUATE!' : 'NICE TRY — GO AGAIN!'}
        </div>

        <div style="display:flex;gap:4px;">${starDisplay}</div>

        <div class="inv_glass" style="width:100%;max-width:360px;padding:18px;display:flex;flex-direction:column;gap:12px;animation:inv_slide_in .4s .1s both;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:11px;color:#7cb8a0;letter-spacing:1px;text-transform:uppercase;">Accuracy</div>
              <div style="font-family:'Orbitron',monospace;font-size:22px;color:#00C853;font-weight:700;">${G.total > 0 ? Math.round(G.correct/G.total*100) : 0}%</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px;color:#7cb8a0;letter-spacing:1px;text-transform:uppercase;">Score</div>
              <div style="font-family:'Orbitron',monospace;font-size:22px;color:#00C853;font-weight:700;">${G.score}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:11px;color:#7cb8a0;letter-spacing:1px;text-transform:uppercase;">Correct</div>
              <div style="font-family:'Orbitron',monospace;font-size:18px;color:#e8f5e9;font-weight:600;">${G.correct}/${G.total}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px;color:#7cb8a0;letter-spacing:1px;text-transform:uppercase;">Rank</div>
              <div style="font-size:15px;color:#00C853;font-weight:700;">${rankIcon} ${rankName}</div>
            </div>
          </div>
          ${stars > 0 ? `
            <div style="border-top:1px solid rgba(0,200,83,.2);padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:11px;color:#7cb8a0;letter-spacing:1px;text-transform:uppercase;">Coins Earned</div>
                <div style="font-family:'Orbitron',monospace;font-size:22px;color:#ffd600;font-weight:700;">+${coins} 🪙</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px;color:#7cb8a0;letter-spacing:1px;text-transform:uppercase;">Certifications</div>
                <div style="font-size:13px;color:#00C853;">
                  ${G.certPassed[0] ? '✓' : '✗'} Foundation<br>
                  ${G.certPassed[1] ? '✓' : '✗'} Mastery
                </div>
              </div>
            </div>
          ` : ''}
          ${stars === 3 ? `
            <div style="background:rgba(0,200,83,.08);border:1px solid rgba(0,200,83,.3);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:11px;color:#00C853;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">🏅 Award Unlocked</div>
              <div style="font-size:14px;font-weight:700;color:#e8f5e9;">Golden Diploma & Certified Investor Badge</div>
            </div>
          ` : ''}
        </div>

        <div class="inv_glass" style="width:100%;max-width:360px;padding:14px;animation:inv_slide_in .4s .2s both;">
          <div style="font-size:11px;color:#00C853;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">📖 Today's Lesson</div>
          <div style="font-size:13px;color:#b2dfdb;line-height:1.6;font-style:italic;">"${lesson}"</div>
        </div>

        <div style="display:flex;gap:10px;width:100%;max-width:360px;animation:inv_slide_in .4s .3s both;">
          <button class="inv_btn_ghost" style="flex:1;text-align:center;padding:13px;" onclick="window._inv_playAgain()">
            🔄 Play Again
          </button>
          <button class="inv_btn" style="flex:1;padding:13px;" onclick="window.inv_academyExit()">
            ← Hub
          </button>
        </div>
      </div>
    `;

    window._inv_playAgain = function() {
      G = null;
      setTimeout(initGame, 40);
    };
  }

  /* ─── UTILS ──────────────────────────────────────────────── */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // shuffle each question's options and remap its answer index
  // (source pool keeps most answers on option B — without this, spamming B nearly aces the quiz)
  function shuffleOptions(q) {
    const order = shuffle(q.opts.map((_, i) => i));
    return {
      ...q,
      opts: order.map(i => q.opts[i]),
      ans: order.indexOf(q.ans)
    };
  }

})();
