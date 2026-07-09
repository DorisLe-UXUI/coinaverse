/* ════════════════════════════════════════════════════════════════
   RESILIENCE HALL · DEBT DETOX DISTRICT — Choice & Timing mini-game
   Navigate emotionally charged financial scenarios with calm decisions.
   Level 1 (7 scenarios): Clear healthy vs impulsive choices.
   Level 2 (7 scenarios): Complex trade-offs requiring real reasoning.
   Level 3 (7 scenarios): High-pressure, multi-step trade-offs with real stakes.
   Screen ID : game_ddt_resilience
   Hub       : rebuilder (#4B2D8F)
   ════════════════════════════════════════════════════════════════ */
(function () {

  /* ── palette ─────────────────────────────────────────────────── */
  const ACCENT  = '#4B2D8F';   // hub purple
  const VIOLET  = '#7B52EF';   // lighter purple glow
  const AMETHYST= '#9B72FF';   // pillar highlight
  const GOLD    = '#F5C842';   // coins / correct glow
  const CRIMSON = '#E84060';   // wrong / drain
  const TEAL    = '#00D4AA';   // speed bonus / combo
  const SILVER  = '#C8B8F0';   // calm/neutral text
  const DIM     = '#03040c';   // near-black bg

  /* ── game constants ──────────────────────────────────────────── */
  const SCENARIO_TIME   = 12;    // seconds per scenario
  const SPEED_HALF      = 6;     // answer in first 6s → speed bonus
  const TOTAL_PILLARS   = 7;     // pillars in the hall = Level 1 count
  const LEVEL1_COUNT    = 7;
  const LEVEL2_COUNT    = 7;
  const LEVEL3_COUNT    = 7;
  const TOTAL_SCENARIOS = LEVEL1_COUNT + LEVEL2_COUNT + LEVEL3_COUNT;
  const METER_MAX       = 100;
  const METER_GAIN      = 14;    // correct choice fills meter
  const METER_DRAIN     = 22;    // wrong drains meter
  const TIMER_DRAIN     = 10;    // waiting too long drains this much
  // Star thresholds scale with the full 21-scenario campaign (verified by
  // simulation): max theoretical score ≈858, current values keep the same
  // difficulty proportion (~52% / ~33% of max) as the original 14-scenario
  // 280/180 thresholds did against their ~543 max, so reaching 3★ genuinely
  // requires strong performance through Level 3, not just Levels 1-2.
  const STAR3_SCORE     = 442;
  const STAR2_SCORE     = 284;

  /* ── scenario catalogue ──────────────────────────────────────── */
  /* Each option: { text, type: 'calm'|'impulsive'|'fearful', pts: number } */
  /* Level 1 — one clearly healthy answer */
  const LEVEL1_SCENARIOS = [
    {
      id: 'phone',
      situation: 'Your friends all just bought the newest smartphone model.',
      emotion: '📱 Peer Pressure',
      options: [
        { text: 'Stick to my plan — my current phone works fine.', type: 'calm',      pts: 20 },
        { text: 'Start a savings goal for it if I really want it.', type: 'calm',     pts: 15 },
        { text: 'Put it on a credit card to keep up with everyone.',type: 'impulsive', pts: -10 },
      ],
      feedback: {
        calm:     'Peer pressure is one of the strongest financial forces. Pausing and holding your plan is genuine strength.',
        impulsive:'Credit card debt for lifestyle items can cost 20–30% more than the sticker price. FOMO is expensive.',
      }
    },
    {
      id: 'job_loss',
      situation: 'You just lost your job unexpectedly.',
      emotion: '😨 Fear & Shock',
      options: [
        { text: 'Activate my emergency fund and cut non-essentials now.',  type: 'calm',     pts: 20 },
        { text: 'Panic-spend to feel better — I deserve a treat.',          type: 'impulsive', pts: -10 },
        { text: 'Borrow money from friends immediately just in case.',       type: 'fearful',   pts: -5  },
      ],
      feedback: {
        calm:     'Activating your emergency fund is exactly what it is for. Calm, deliberate action protects your runway.',
        impulsive:'Panic spending in a crisis shrinks your runway fast and adds guilt on top of stress.',
        fearful:  'Borrowing before you need to strains relationships and adds debt before you know your full situation.',
      }
    },
    {
      id: 'unexpected_bill',
      situation: 'An unexpected $400 medical bill arrives in the mail.',
      emotion: '🧾 Surprise Expense',
      options: [
        { text: 'Pay it from my emergency fund — this is exactly what it\'s for.', type: 'calm',     pts: 20 },
        { text: 'Ignore it and hope it goes away.',                                 type: 'fearful',   pts: -10 },
        { text: 'Put it on a high-interest card and worry later.',                  type: 'impulsive', pts: -8  },
      ],
      feedback: {
        calm:     'Emergency funds turn crises into inconveniences. This is a textbook use case — well done.',
        fearful:  'Ignored bills grow. Medical debt can enter collections in as little as 30 days, hurting your credit.',
        impulsive:'A $400 bill on a 29% APR card becomes $516 if you take a year to pay it — a 29% markup on bad luck.',
      }
    },
    {
      id: 'luxury_shoes',
      situation: 'You saw a pair of shoes you\'ve wanted for months — $180, which isn\'t in this month\'s budget.',
      emotion: '👟 Impulse Want',
      options: [
        { text: 'Add it as a savings goal and buy when I\'ve saved for it.', type: 'calm',     pts: 20 },
        { text: 'Buy now on a credit card — I\'ve earned it.',               type: 'impulsive', pts: -10 },
        { text: 'Skip savings contributions this month to buy them.',         type: 'impulsive', pts: -5  },
      ],
      feedback: {
        calm:     'A savings goal turns a want into an intention. You\'ll enjoy the purchase more knowing it was planned.',
        impulsive:'Buying wants on credit means paying interest on things that lose value. The shoes cost more than they\'re worth.',
      }
    },
    {
      id: 'investment_loss',
      situation: 'The stock you invested in just dropped 30% this week.',
      emotion: '📉 Market Fear',
      options: [
        { text: 'Hold — market fluctuations are normal. Review my plan.',     type: 'calm',     pts: 20 },
        { text: 'Sell everything immediately to stop the bleeding.',           type: 'fearful',   pts: -10 },
        { text: 'Put in more money to "win back" what I lost right away.',     type: 'impulsive', pts: -8  },
      ],
      feedback: {
        calm:     'Selling in a panic locks in losses and removes you from the recovery. Patient investors historically win.',
        fearful:  'Fear-selling is one of the biggest wealth destroyers. You don\'t lose money until you actually sell.',
        impulsive:'Chasing losses ("revenge trading") is a documented trap — it compounds losses, not recoveries.',
      }
    },
    {
      id: 'sale_pressure',
      situation: '"48-HOUR FLASH SALE — ends tonight!" on something you didn\'t plan to buy.',
      emotion: '⏰ Urgency Trap',
      options: [
        { text: 'If it wasn\'t in my budget before the sale, skip it.',             type: 'calm',     pts: 20 },
        { text: 'Sleep on it — if I still want it tomorrow I\'ll think then.',       type: 'calm',     pts: 15 },
        { text: 'Buy it now before it\'s gone — the discount makes it worth it.',    type: 'impulsive', pts: -10 },
      ],
      feedback: {
        calm:     '"Urgency" is a sales tactic, not financial advice. A sale that changes your plan is usually not a deal.',
        impulsive:'Artificial urgency is designed to bypass your rational decision-making. A discount on something you don\'t need is still spending.',
      }
    },
    {
      id: 'raise_windfall',
      situation: 'You just got a $200/month raise. Your friends expect you to upgrade your lifestyle.',
      emotion: '💰 Lifestyle Inflation',
      options: [
        { text: 'Put at least half toward savings goals before spending any.',  type: 'calm',     pts: 20 },
        { text: 'Use it all to upgrade my apartment and lifestyle right away.', type: 'impulsive', pts: -10 },
        { text: 'Blow it this month as a celebration, then save next month.',   type: 'impulsive', pts: -5  },
      ],
      feedback: {
        calm:     'Saving before you spend keeps lifestyle inflation in check. The best time to build wealth is when income grows.',
        impulsive:'Lifestyle inflation is the silent wealth killer. Spending 100% of every raise keeps you financially in the same place.',
      }
    },
  ];

  /* Level 2 — multiple reasonable options, trade-off reasoning rewarded */
  const LEVEL2_SCENARIOS = [
    {
      id: 'emfund_vs_plan',
      situation: 'You have $1,200 in savings. Your car breaks down and repair costs $900. You also have $600 in credit card debt at 24% APR.',
      emotion: '🔧 Competing Priorities',
      options: [
        { text: 'Pay repair from savings — keep the card, pay it off over time.',  type: 'calm',     pts: 20,
          reason: 'Correct — your emergency fund exists for emergencies. The card debt is manageable with payments.' },
        { text: 'Pay repair from savings and use a 0% intro card for the $600.',   type: 'calm',     pts: 25,
          reason: 'Excellent — you solve the emergency AND strategically manage the existing debt with a better tool.' },
        { text: 'Put the repair on the credit card to keep savings intact.',        type: 'fearful',  pts: 5,
          reason: 'Acceptable but costly — adding high-interest debt when you have savings is suboptimal. The fund is for this.' },
      ],
      feedback: {
        calm:     'Using your emergency fund for an emergency is correct. Replenish it as soon as possible.',
        fearful:  'Keeping savings idle while adding 24% APR debt is not optimal — but it keeps options open. A close call.',
      }
    },
    {
      id: 'sidegig_vs_cut',
      situation: 'You\'re $300/month short of your debt payoff goal. You can cut entertainment or pick up a side gig — both would work.',
      emotion: '⚖️ Income vs Expense',
      options: [
        { text: 'Cut entertainment to $0 for 3 months and put the difference toward debt.',  type: 'calm',    pts: 18,
          reason: 'Solid — reducing expenses is the lowest-risk path to closing the gap.' },
        { text: 'Start a side gig and keep entertainment — grow income instead.',             type: 'calm',    pts: 20,
          reason: 'Also solid — increasing income improves both repayment speed and long-term earnings.' },
        { text: 'Do both: cut entertainment and start the gig.',                              type: 'calm',    pts: 25,
          reason: 'Best outcome — combining both approaches closes the gap fastest, with less lifestyle sacrifice.' },
      ],
      feedback: {
        calm:     'All three are calm decisions — this shows real flexibility. Any plan that closes the gap is a win.',
      }
    },
    {
      id: 'negotiate_vs_fund',
      situation: 'Unexpected dental bill: $1,500. You have $2,000 in savings. The clinic offers a 12-month payment plan at 0% interest.',
      emotion: '🦷 Negotiation Opportunity',
      options: [
        { text: 'Take the 0% payment plan — keep savings as cushion.',             type: 'calm',    pts: 25,
          reason: 'Best choice — 0% debt lets your savings keep earning and preserves your emergency buffer.' },
        { text: 'Pay the full $1,500 from savings — done and clean.',              type: 'calm',    pts: 18,
          reason: 'Good — simplicity has value. You\'re debt-free but down to $500, which is a thin emergency fund.' },
        { text: 'Put it on a high-interest credit card to preserve savings.',       type: 'fearful', pts: -8,
          reason: 'Weak choice — there is already a 0% option available. Using high-interest debt here is unnecessary.' },
      ],
      feedback: {
        calm:     '0% debt is a tool, not a trap. Keeping your savings while using interest-free financing is smart leverage.',
        fearful:  'When a 0% option is on the table, high-interest credit is always worse — read the offer before defaulting to a card.',
      }
    },
    {
      id: 'help_family',
      situation: 'A family member asks to borrow $500. You can afford it but it would set your emergency fund back 2 months.',
      emotion: '👨‍👩‍👦 Family Pressure',
      options: [
        { text: 'Lend $200 — help without hurting your own plan.',                         type: 'calm',    pts: 22,
          reason: 'Great boundary — partial help is honest and protects your financial health.' },
        { text: 'Decline kindly — explain your emergency fund is not yet at target.',       type: 'calm',    pts: 20,
          reason: 'Also correct — a financial boundary set with love is still a boundary.' },
        { text: 'Give the full $500 — family comes first no matter what.',                  type: 'impulsive', pts: -5,
          reason: 'Generous but risky — your financial security enables you to help others long-term. Depleting your fund for one request can cascade.' },
      ],
      feedback: {
        calm:     'You cannot pour from an empty cup. Protecting your baseline is not selfishness — it\'s sustainable generosity.',
        impulsive:'Helping family at the expense of your own emergency fund can leave both of you vulnerable.',
      }
    },
    {
      id: 'investment_opportunity',
      situation: 'A friend says you can double your money in 60 days with their "guaranteed" investment. You\'d need to put in $1,000.',
      emotion: '🚨 Too Good To Be True',
      options: [
        { text: 'Decline — "guaranteed" returns are a classic fraud warning sign.',             type: 'calm',    pts: 25,
          reason: 'Correct — no legitimate investment guarantees returns. This matches every major fraud pattern.' },
        { text: 'Ask for the prospectus, SEC registration, and audited financials first.',      type: 'calm',    pts: 22,
          reason: 'Also correct — due diligence before any investment is always the right move.' },
        { text: 'Invest a small amount just to test it out.',                                   type: 'impulsive', pts: -10,
          reason: '"Just testing" fraud still loses money. Scams are designed to work on small amounts first.' },
      ],
      feedback: {
        calm:     'Financial scams use urgency, social proof, and guaranteed returns — all three are red flags. Protecting your capital is always first.',
        impulsive:'Scammers allow small "wins" early to build trust before asking for larger amounts.',
      }
    },
    {
      id: 'house_vs_debt',
      situation: 'You have $8,000 saved. You could put it toward a home down payment fund OR pay off your $8,000 student loan at 6% APR.',
      emotion: '🏠 Long-Term Trade-off',
      options: [
        { text: 'Pay off the student loan — guaranteed 6% return on the payoff.',             type: 'calm',    pts: 20,
          reason: 'Solid — eliminating a 6% debt is a guaranteed 6% return. Debt-free frees up cash flow for the house later.' },
        { text: 'Keep building the down payment fund — home equity grows faster than 6%.',    type: 'calm',    pts: 18,
          reason: 'Also reasonable — especially if rent exceeds a mortgage payment in your market.' },
        { text: 'Split it: $4,000 to the loan, $4,000 to the down payment fund.',             type: 'calm',    pts: 22,
          reason: 'Excellent — balancing both goals reduces interest paid and keeps the house timeline alive.' },
      ],
      feedback: {
        calm:     'This is genuinely a close call — all three are defensible. The best answer depends on your local housing market and personal goals. The key is that you thought it through.',
      }
    },
    {
      id: 'subscription_creep',
      situation: 'You notice you\'re paying for 9 subscription services totaling $180/month. Some you haven\'t used in months.',
      emotion: '📺 Spending Blindspot',
      options: [
        { text: 'Audit all 9 right now — cancel anything unused in 30 days.',                 type: 'calm',    pts: 25,
          reason: 'Best move — subscription audits are one of the highest-ROI financial habits. $60–100/month recovered is $720–1,200/year.' },
        { text: 'Keep them all — canceling feels like a hassle and some might be useful.',    type: 'fearful', pts: -8,
          reason: 'Inaction is a decision. Paying for unused services is a slow, silent leak in your budget.' },
        { text: 'Cancel everything to feel in control, even the ones you use daily.',         type: 'impulsive', pts: 5,
          reason: 'Reactionary — cutting useful services costs you value. The goal is a deliberate audit, not a purge.' },
      ],
      feedback: {
        calm:     'Subscription audits are underrated. Monthly fees compound against you quietly — the same way savings compound for you.',
        fearful:  'Avoidance is expensive. A 30-minute audit could save you $1,000+ a year.',
        impulsive:'Deliberate beats dramatic. Cancel unused services, keep valuable ones — and review again in 90 days.',
      }
    },
  ];

  /* Level 3 — high-pressure, multi-step trade-offs with real stakes.
     Harder than Level 2: each scenario blends two decisions at once
     (a tactic to resist AND a plan to act on), not just a single choice. */
  const LEVEL3_SCENARIOS = [
    {
      id: 'debt_collector_call',
      situation: 'A debt collector calls saying you owe $600 and must pay "right now" by gift card or you\'ll be arrested.',
      emotion: '📞 Collector Pressure',
      options: [
        { text: 'Hang up, then verify the debt in writing before paying anyone anything.',    type: 'calm',    pts: 25,
          reason: 'Correct — real collectors must send written validation. Threats of arrest for debt and gift-card payment demands are classic scam signatures.' },
        { text: 'Ask them to mail proof of the debt, then research the company\'s name.',       type: 'calm',    pts: 22,
          reason: 'Solid — staying on the line but demanding paperwork is fine, as long as you never pay before verifying.' },
        { text: 'Pay with a gift card immediately to avoid legal trouble.',                      type: 'fearful', pts: -10,
          reason: 'This is a scam pattern. No legitimate debt is ever collected by gift card, and no one is arrested for owing money in the U.S.' },
      ],
      feedback: {
        calm:     'Debt collection has strict rules: written notice, no threats, no gift-card demands. Fear is the tactic — verification is your defense.',
        fearful:  'Untraceable payment methods like gift cards are always the biggest red flag in a collections call. Legitimate creditors accept normal payments.',
      }
    },
    {
      id: 'cosign_request',
      situation: 'Your cousin asks you to co-sign a $12,000 car loan. If they miss a payment, you are legally responsible for the full balance.',
      emotion: '🖊️ Co-Signing Pressure',
      options: [
        { text: 'Decline — co-signing puts your own credit at risk for someone else\'s payment history.', type: 'calm', pts: 25,
          reason: 'Correct — co-signing is a full legal obligation, not a favor with no cost. Your credit report is exposed to every payment they make or miss.' },
        { text: 'Offer to help them build credit a safer way instead, like a secured card.',                type: 'calm', pts: 22,
          reason: 'Great alternative — you help without taking on their debt yourself.' },
        { text: 'Co-sign, since family should always help family financially.',                             type: 'impulsive', pts: -10,
          reason: 'Co-signing is one of the most common ways people damage their own credit. If they miss even one payment, it shows up on your report too.' },
      ],
      feedback: {
        calm:     'A co-signature is not a gift — it is your name on someone else\'s debt. Loving family members can still say no to this specific ask.',
        impulsive:'Co-signed loans that go bad are a leading cause of unexpected debt for people who were only trying to help.',
      }
    },
    {
      id: 'gig_income_dip',
      situation: 'Your delivery-app gig income dropped 40% this month because of fewer orders. Rent is due in 5 days.',
      emotion: '📉 Income Volatility',
      options: [
        { text: 'Check savings first, cut non-essentials, and apply to a second gig platform today.',  type: 'calm',    pts: 25,
          reason: 'Best — variable income needs a buffer AND a backup income source. Acting on both fronts immediately reduces risk fastest.' },
        { text: 'Use savings to cover the shortfall this month and rebuild it next month.',              type: 'calm',    pts: 20,
          reason: 'Reasonable — this is exactly what a buffer is for, as long as you actually rebuild it once income recovers.' },
        { text: 'Take a high-interest payday loan to cover rent until income picks back up.',            type: 'impulsive', pts: -10,
          reason: 'Payday loans often carry 300%+ APR. A short-term income dip becomes a long-term debt trap.' },
      ],
      feedback: {
        calm:     'Gig and freelance income is inherently variable — the fix is a bigger emergency buffer than a salaried worker needs, not a payday loan.',
        impulsive:'A one-month income dip should never turn into a year of debt. Payday loans are designed to be very hard to escape.',
      }
    },
    {
      id: 'insurance_deductible',
      situation: 'Your bike is damaged in an accident. Repair costs $500. Your insurance deductible is $750, meaning insurance would pay nothing.',
      emotion: '🚲 Insurance Trade-off',
      options: [
        { text: 'Pay the $500 repair out of pocket — filing a claim below your deductible does nothing but risk a premium increase.', type: 'calm', pts: 25,
          reason: 'Correct — claims below your deductible are pure cost with a possible downside (higher future premiums) and zero payout.' },
        { text: 'File the claim anyway just to have it on record.',                                type: 'fearful', pts: -8,
          reason: 'Filing a claim you know will be denied can still flag your account as high-risk with some insurers, raising future premiums for no payout.' },
        { text: 'Skip the repair entirely and ride it as-is to avoid any cost.',                    type: 'impulsive', pts: 5,
          reason: 'Understandable instinct, but an unsafe, unrepaired bike can lead to a bigger accident and a much bigger bill later.' },
      ],
      feedback: {
        calm:     'Understanding your deductible before an incident happens prevents a wasted claim. Insurance is for costs bigger than your deductible, not smaller.',
        fearful:  'Insurance claims are tracked even when denied. Filing pointless claims can quietly raise what you pay every month going forward.',
      }
    },
    {
      id: 'identity_theft',
      situation: 'You check your bank app and see a $340 charge from a store you have never visited.',
      emotion: '🔓 Identity Theft',
      options: [
        { text: 'Freeze the card immediately, report the charge as fraud, and check your other accounts.', type: 'calm', pts: 25,
          reason: 'Correct — speed matters with fraud. Freezing first stops further damage while you report and check everything else.' },
        { text: 'Report it to the bank\'s fraud line before doing anything else.',                          type: 'calm', pts: 20,
          reason: 'Good — reporting quickly is the right instinct, though freezing the card first would stop any charges happening in the meantime.' },
        { text: 'Wait a few days to see if more suspicious charges show up before reporting.',              type: 'fearful', pts: -10,
          reason: 'Waiting gives a thief more time to spend. Most banks have zero-liability windows that shrink the longer you wait to report.' },
      ],
      feedback: {
        calm:     'Fraud response has a time cost. Freezing your card takes 30 seconds and can save you from a much bigger cleanup later.',
        fearful:  'Banks reward fast reporting with full fraud protection. Delay is the one thing that can cost you the loss instead of the bank.',
      }
    },
    {
      id: 'bnpl_stacking',
      situation: 'You have three separate "Buy Now, Pay Later" plans running at once for different purchases, totaling $85/month. A store offers a 4th plan for new shoes.',
      emotion: '🛍️ BNPL Stacking',
      options: [
        { text: 'Decline — stacking multiple BNPL plans is easy to lose track of and it is still debt.', type: 'calm', pts: 25,
          reason: 'Correct — BNPL fragments your spending across many small "invisible" debts. A 4th plan adds real monthly obligation, even if each individual payment looks small.' },
        { text: 'Pay off one existing plan first before considering anything new.',                        type: 'calm', pts: 20,
          reason: 'Reasonable — reducing your existing BNPL load before adding more keeps your total monthly commitments manageable.' },
        { text: 'Add the 4th plan since each individual payment is small.',                                type: 'impulsive', pts: -10,
          reason: '"Small payments" are exactly how BNPL debt sneaks up — four small plans add up to a real bill that is easy to lose track of.' },
      ],
      feedback: {
        calm:     'BNPL plans are still debt, just split into pieces that feel painless. Track the total across all plans, not just each one alone.',
        impulsive:'Missed BNPL payments now report to credit bureaus and can carry late fees — "no interest" does not mean "no risk."',
      }
    },
    {
      id: 'priority_triage',
      situation: 'Your hours were cut and your paycheck just dropped by $400/month. You have rent, a phone bill, a gym membership, and a small credit card balance — you cannot cover all of it at 100%.',
      emotion: '⚖️ Full Budget Triage',
      options: [
        { text: 'Rank by consequence: rent first, then minimum debt payment, then phone, then cancel the gym.', type: 'calm', pts: 25,
          reason: 'Correct — triage by what happens if unpaid: losing housing is the biggest consequence, followed by damaged credit, then service loss. The gym is the safest thing to cut.' },
        { text: 'Cut the gym and phone plan first, then split what is left across rent and the card.',           type: 'calm', pts: 22,
          reason: 'Also solid — you correctly identified the gym as non-essential, though rent should be fully funded before anything else if at all possible.' },
        { text: 'Pay everything a little bit so nothing feels fully neglected.',                                type: 'fearful', pts: -5,
          reason: 'Partial payments everywhere often means rent falls short, which carries the harshest consequence. Full payment on your top priority beats a partial payment on all of them.' },
      ],
      feedback: {
        calm:     'When you cannot cover everything, rank bills by real-world consequence, not by which feels most urgent. Housing and debt reporting outrank subscriptions every time.',
        fearful:  'Spreading a shortage evenly across every bill can accidentally shortchange the one bill you most needed to fully pay.',
      }
    },
  ];

  /* ── state object ────────────────────────────────────────────── */
  let G = null;

  /* ── debug hook (dev/QA only) ─────────────────────────────────── */
  window._rhDbg = function () {
    return G ? { level: G.level, idx: G.idx, deckLen: G.deck.length, score: G.score, meter: G.meter, currentScenarioId: G.deck[G.idx] ? G.deck[G.idx].id : null } : null;
  };
  window._rhForceSkipToLevel3 = function () {
    if (!G) return;
    stopCountdown();
    G.idx = LEVEL1_COUNT + LEVEL2_COUNT;
    G.level = 2; // gate at startScenario() will flip this to 3 and show the banner
    startScenario();
  };
  window._rhForceWin = function () {
    if (!G) return;
    G.idx = G.deck.length;
    G.score = STAR3_SCORE;
    triggerEnd(true);
  };

  /* ── screen registration ─────────────────────────────────────── */
  window.SCREENS = window.SCREENS || {};
  window.SCREENS.game_ddt_resilience = function () {
    G = null;
    setTimeout(initGame, 40);
    return `
<div id="rh_root" style="
  position:absolute;inset:0;background:${DIM};overflow:hidden;
  font-family:Inter,sans-serif;color:#fff;user-select:none;
">
  <!-- hall canvas background -->
  <canvas id="rh_canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>

  <!-- atmospheric overlays -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 80%,rgba(75,45,143,.2),transparent);pointer-events:none"></div>

  <!-- top bar -->
  <div id="rh_topbar" style="
    position:absolute;top:0;left:0;right:0;z-index:20;
    display:flex;align-items:center;gap:8px;
    padding:10px 14px;
    background:linear-gradient(to bottom,rgba(3,4,12,.95),transparent);
  ">
    <button id="rh_back" style="
      background:rgba(75,45,143,.3);border:1px solid rgba(123,82,239,.4);
      color:${VIOLET};border-radius:10px;padding:7px 12px;cursor:pointer;
      font-size:.85rem;font-family:Inter,sans-serif;transition:all .15s;flex-shrink:0;
    "
    onmouseover="this.style.background='rgba(75,45,143,.55)'"
    onmouseout="this.style.background='rgba(75,45,143,.3)'"
    onclick="window.ddt_resilienceExit()">← Back</button>

    <div style="flex:1;min-width:0">
      <div style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.2em;color:${VIOLET}88;line-height:1">DEBT DETOX DISTRICT</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.8rem;letter-spacing:.06em;color:#fff;line-height:1.2;margin-top:1px">RESILIENCE HALL</div>
    </div>

    <!-- scenario counter -->
    <div style="text-align:center;flex-shrink:0">
      <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:${SILVER}66;letter-spacing:.12em">SCENARIO</div>
      <div style="display:flex;align-items:baseline;gap:2px">
        <span id="rh_scen_cur" style="font-family:Orbitron,sans-serif;font-size:1rem;color:${AMETHYST};font-variant-numeric:tabular-nums">1</span>
        <span style="font-family:Orbitron,sans-serif;font-size:.55rem;color:#555">/${TOTAL_SCENARIOS}</span>
      </div>
    </div>

    <!-- score -->
    <div style="text-align:center;flex-shrink:0">
      <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:${GOLD}66;letter-spacing:.12em">SCORE</div>
      <div id="rh_score_val" style="font-family:Orbitron,sans-serif;font-size:1rem;color:${GOLD};text-shadow:0 0 8px ${GOLD}55;font-variant-numeric:tabular-nums">0</div>
    </div>
  </div>

  <!-- level badge + combo strip -->
  <div style="
    position:absolute;top:54px;left:0;right:0;z-index:15;
    display:flex;align-items:center;justify-content:space-between;
    padding:3px 14px;
  ">
    <div id="rh_level_badge" style="
      font-family:Orbitron,sans-serif;font-size:.48rem;letter-spacing:.16em;
      color:${VIOLET};border:1px solid rgba(123,82,239,.4);
      border-radius:20px;padding:3px 10px;
    ">LEVEL 1 · LEARN</div>

    <div id="rh_combo_wrap" style="display:none;align-items:center;gap:4px">
      <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:${TEAL};letter-spacing:.12em">COMBO</div>
      <div id="rh_combo_val" style="font-family:Orbitron,sans-serif;font-size:.8rem;color:${TEAL};text-shadow:0 0 8px ${TEAL}88">×1</div>
    </div>

    <!-- countdown timer -->
    <div id="rh_timer_wrap" style="display:flex;align-items:center;gap:4px">
      <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:#aaa;letter-spacing:.1em">TIME</div>
      <div id="rh_timer_val" style="font-family:Orbitron,sans-serif;font-size:.9rem;color:#fff;font-variant-numeric:tabular-nums">0:12</div>
    </div>
  </div>

  <!-- countdown progress bar -->
  <div style="position:absolute;top:78px;left:14px;right:14px;z-index:15;height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden">
    <div id="rh_countdown_bar" style="height:100%;width:100%;background:linear-gradient(90deg,${ACCENT},${VIOLET});border-radius:2px;transition:width linear"></div>
  </div>

  <!-- resilience meter — pillar visualization -->
  <div id="rh_meter_section" style="
    position:absolute;top:88px;left:14px;right:14px;z-index:15;
    display:flex;align-items:flex-end;gap:4px;height:36px;
  ">
    <!-- pillars rendered by JS -->
  </div>

  <!-- emotion tag strip -->
  <div style="position:absolute;top:130px;left:14px;right:14px;z-index:15;display:flex;align-items:center;justify-content:space-between">
    <div id="rh_emotion_tag" style="
      font-family:Inter,sans-serif;font-size:.7rem;color:${SILVER};
      background:rgba(155,114,255,.12);border:1px solid rgba(155,114,255,.2);
      border-radius:8px;padding:3px 10px;
    "> </div>
    <div id="rh_speed_hint" style="
      font-family:Orbitron,sans-serif;font-size:.42rem;color:${TEAL}88;
      letter-spacing:.1em;opacity:0;transition:opacity .3s;
    ">⚡ SPEED BONUS ACTIVE</div>
  </div>

  <!-- scenario card area -->
  <div id="rh_stage" style="
    position:absolute;left:0;right:0;
    top:148px;bottom:0;
    display:flex;flex-direction:column;align-items:center;
    padding:0 12px 16px;
    z-index:12;overflow-y:auto;
    scroll-behavior:smooth;
  "></div>

  <!-- screen flash -->
  <div id="rh_flash" style="
    position:absolute;inset:0;z-index:50;pointer-events:none;
    opacity:0;transition:opacity .12s;
  "></div>

  <style>
    @keyframes rh_card_in {
      from { opacity:0; transform:translateY(24px) scale(.97); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    @keyframes rh_opt_in {
      from { opacity:0; transform:translateX(-16px); }
      to   { opacity:1; transform:translateX(0); }
    }
    @keyframes rh_pillar_glow {
      0%,100%{ box-shadow:0 0 8px ${AMETHYST}44,inset 0 0 4px ${AMETHYST}22; }
      50%    { box-shadow:0 0 20px ${AMETHYST}99,inset 0 0 10px ${AMETHYST}44; }
    }
    @keyframes rh_shake {
      0%,100%{ transform:translateX(0) }
      20%{ transform:translateX(-7px) }
      40%{ transform:translateX(7px) }
      60%{ transform:translateX(-5px) }
      80%{ transform:translateX(5px) }
    }
    @keyframes rh_bonus_float {
      0%  { opacity:1; transform:translate(-50%,-50%) scale(1); }
      100%{ opacity:0; transform:translate(-50%,-120%) scale(1.2); }
    }
    @keyframes rh_correct_pulse {
      0%  { box-shadow: 0 0 0 0 rgba(245,200,66,.6); }
      100%{ box-shadow: 0 0 0 16px rgba(245,200,66,0); }
    }
    @keyframes rh_feedback_in {
      from{ opacity:0; transform:translateY(-8px); }
      to  { opacity:1; transform:translateY(0); }
    }
    @keyframes rh_win_card_in {
      0%   { opacity:0; transform:scale(.55) rotate(-8deg) translateY(24px); }
      55%  { opacity:1; transform:scale(1.1) rotate(3deg) translateY(-6px); }
      80%  { transform:scale(.96) rotate(-1deg); }
      100% { opacity:1; transform:scale(1) rotate(0) translateY(0); }
    }
    @keyframes rh_lose_card_in {
      from { opacity:0; transform:translateY(12px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .rh_opt_btn {
      width:100%;text-align:left;
      background:rgba(255,255,255,.04);
      border:1px solid rgba(155,114,255,.2);
      border-radius:14px;padding:12px 16px;
      cursor:pointer;
      font-family:Inter,sans-serif;font-size:.8rem;line-height:1.5;color:${SILVER};
      transition:background .12s, border-color .12s, box-shadow .12s;
      margin-bottom:8px;
      position:relative;overflow:hidden;
    }
    .rh_opt_btn:hover {
      background:rgba(123,82,239,.18);
      border-color:rgba(155,114,255,.5);
      box-shadow:0 0 14px rgba(75,45,143,.3);
      color:#fff;
    }
    .rh_opt_btn:focus-visible {
      outline:2px solid ${VIOLET};outline-offset:2px;
    }
    .rh_opt_btn.correct {
      background:rgba(245,200,66,.12) !important;
      border-color:rgba(245,200,66,.6) !important;
      color:${GOLD} !important;
      animation:rh_correct_pulse .4s ease-out;
    }
    .rh_opt_btn.wrong {
      background:rgba(232,64,96,.1) !important;
      border-color:rgba(232,64,96,.4) !important;
      color:${CRIMSON} !important;
    }
    .rh_opt_btn.neutral {
      background:rgba(0,212,170,.08) !important;
      border-color:rgba(0,212,170,.3) !important;
      color:${TEAL} !important;
    }
    .rh_opt_btn.disabled { pointer-events:none; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(123,82,239,.3);border-radius:2px; }
  </style>
</div>`;
  };

  /* ── init ────────────────────────────────────────────────────── */
  function initGame() {
    const root = document.getElementById('rh_root');
    if (!root) return;

    const deck = shuffle([...LEVEL1_SCENARIOS]).concat(shuffle([...LEVEL2_SCENARIOS])).concat(shuffle([...LEVEL3_SCENARIOS]));

    G = {
      deck,
      idx:           0,
      score:         0,
      combo:         0,
      bestCombo:     0,
      meter:         METER_MAX / 2,   // start at 50%
      pillarsLit:    0,
      level:         1,
      done:          false,
      active:        false,
      tickInterval:  null,
      secondsLeft:   SCENARIO_TIME,
      speedWindow:   false,
      answered:      false,
    };

    drawHallCanvas();
    buildMeter();
    startScenario();
  }

  /* ── grand hall background canvas ───────────────────────────── */
  function drawHallCanvas() {
    const canvas = document.getElementById('rh_canvas');
    if (!canvas) return;
    const W = canvas.offsetWidth || window.innerWidth;
    const H = canvas.offsetHeight || window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    /* deep background */
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#05020F');
    bg.addColorStop(0.5, '#0A0520');
    bg.addColorStop(1, '#160A30');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* distant star haze */
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H * 0.5;
      const r = Math.random() * 1.1 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,180,255,${Math.random() * 0.5 + 0.1})`;
      ctx.fill();
    }

    /* hall ceiling arch */
    ctx.strokeStyle = 'rgba(123,82,239,.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.22);
    ctx.quadraticCurveTo(W * 0.5, H * 0.0, W, H * 0.22);
    ctx.stroke();

    /* perspective floor lines converging to center */
    const vanX = W * 0.5;
    const vanY = H * 0.45;
    const floorLines = 8;
    for (let i = 0; i <= floorLines; i++) {
      const x = (W / floorLines) * i;
      ctx.strokeStyle = `rgba(75,45,143,${0.06 + i * 0.01})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(vanX, vanY);
      ctx.stroke();
    }

    /* horizontal floor grid lines */
    for (let i = 0; i < 5; i++) {
      const y = H * 0.5 + (H * 0.5 / 5) * i;
      const alpha = 0.04 + i * 0.02;
      ctx.strokeStyle = `rgba(75,45,143,${alpha})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    /* tall decorative column silhouettes on each side */
    const colH = H * 0.65;
    [[W * 0.05, colH], [W * 0.15, colH * 0.8],
     [W * 0.82, colH * 0.8], [W * 0.92, colH]].forEach(([cx, ch]) => {
      const cw = 18;
      const col = ctx.createLinearGradient(cx, H - ch, cx, H);
      col.addColorStop(0, 'rgba(75,45,143,.35)');
      col.addColorStop(1, 'rgba(75,45,143,.08)');
      ctx.fillStyle = col;
      ctx.fillRect(cx - cw / 2, H - ch, cw, ch);

      /* capital ornament */
      ctx.fillStyle = 'rgba(123,82,239,.3)';
      ctx.fillRect(cx - cw * 0.75, H - ch - 6, cw * 1.5, 6);
    });

    /* ambient glow from below (where pillars are conceptually) */
    const glowGrad = ctx.createRadialGradient(W / 2, H, 10, W / 2, H, W * 0.7);
    glowGrad.addColorStop(0, 'rgba(75,45,143,.22)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── resilience meter (pillar visualizer) ─────────────────────── */
  function buildMeter() {
    const section = document.getElementById('rh_meter_section');
    if (!section) return;
    section.innerHTML = '';

    /* label */
    const label = document.createElement('div');
    label.style.cssText = `
      font-family:Orbitron,sans-serif;font-size:.4rem;
      letter-spacing:.12em;color:${AMETHYST}88;
      writing-mode:initial;
      white-space:nowrap;flex-shrink:0;
      margin-right:4px;margin-bottom:2px;
    `;
    label.textContent = 'RESILIENCE';
    section.appendChild(label);

    /* pillar segments (14 total to represent meter fill) */
    const SEGS = 14;
    for (let i = 0; i < SEGS; i++) {
      const seg = document.createElement('div');
      seg.id = `rh_seg_${i}`;
      const baseH = 12 + Math.sin((i / SEGS) * Math.PI) * 18;
      seg.style.cssText = `
        flex:1;height:${Math.round(baseH)}px;border-radius:3px 3px 2px 2px;
        background:rgba(255,255,255,.06);
        border:1px solid rgba(123,82,239,.15);
        transition:background .3s, box-shadow .3s, height .3s;
        align-self:flex-end;
      `;
      section.appendChild(seg);
    }

    updateMeterDisplay();
  }

  function updateMeterDisplay() {
    const SEGS = 14;
    const filledCount = Math.round((G.meter / METER_MAX) * SEGS);

    for (let i = 0; i < SEGS; i++) {
      const seg = document.getElementById(`rh_seg_${i}`);
      if (!seg) continue;
      if (i < filledCount) {
        /* filled */
        const intensity = i / SEGS;
        const r = Math.round(75  + intensity * 80);
        const g = Math.round(45  + intensity * 67);
        const b = Math.round(143 + intensity * 112);
        seg.style.background = `rgb(${r},${g},${b})`;
        seg.style.boxShadow  = `0 0 6px rgba(155,114,255,.5)`;
        seg.style.borderColor = `rgba(155,114,255,.5)`;
      } else {
        seg.style.background = 'rgba(255,255,255,.06)';
        seg.style.boxShadow  = 'none';
        seg.style.borderColor = 'rgba(123,82,239,.15)';
      }
    }
  }

  function animateMeterChange(delta) {
    G.meter = Math.max(0, Math.min(METER_MAX, G.meter + delta));
    updateMeterDisplay();

    if (G.meter <= 0) {
      setTimeout(() => triggerEnd(false), 300);
    }
  }

  /* ── scenario flow ───────────────────────────────────────────── */
  function startScenario() {
    if (!G || G.done) return;

    if (G.idx >= G.deck.length) {
      triggerEnd(true);
      return;
    }

    /* level gates — advance the campaign badge at each level boundary.
       Two distinct, deliberate checks (not a single fallthrough): idx===7
       only fires the 1→2 transition, idx===14 only fires the 2→3 transition.
       Both are guarded by the current G.level so a gate can never re-fire. */
    if (G.idx === LEVEL1_COUNT && G.level === 1) {
      showLevelUp(2);
      return;
    }
    if (G.idx === LEVEL1_COUNT + LEVEL2_COUNT && G.level === 2) {
      showLevelUp(3);
      return;
    }

    const scen = G.deck[G.idx];
    G.active    = true;
    G.answered  = false;
    G.secondsLeft = SCENARIO_TIME;
    G.speedWindow = true;

    /* update HUD */
    const cur = document.getElementById('rh_scen_cur');
    if (cur) cur.textContent = G.idx + 1;
    updateScoreDisplay();
    updateComboDisplay();

    /* emotion tag */
    const etag = document.getElementById('rh_emotion_tag');
    if (etag) etag.textContent = scen.emotion;

    /* speed hint */
    const sh = document.getElementById('rh_speed_hint');
    if (sh) { sh.style.opacity = '1'; }
    setTimeout(() => { const s = document.getElementById('rh_speed_hint'); if (s) s.style.opacity = '0'; }, SPEED_HALF * 1000);

    /* render scenario card */
    renderScenario(scen);

    /* start countdown */
    startCountdown();
  }

  function renderScenario(scen) {
    const stage = document.getElementById('rh_stage');
    if (!stage) return;
    stage.innerHTML = '';

    /* situation card */
    const card = document.createElement('div');
    card.style.cssText = `
      width:100%;max-width:420px;
      background:linear-gradient(145deg,rgba(20,12,40,.97),rgba(10,5,22,.99));
      border:1.5px solid rgba(123,82,239,.45);
      border-radius:18px;padding:18px 16px 14px;
      box-shadow:0 0 30px rgba(75,45,143,.25),0 6px 24px rgba(0,0,0,.6);
      margin-bottom:12px;
      animation:rh_card_in .3s cubic-bezier(.22,1,.36,1) both;
      position:relative;
    `;
    card.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;height:2px;
        background:linear-gradient(90deg,transparent,${VIOLET},transparent);border-radius:18px 18px 0 0"></div>
      <div style="font-family:Orbitron,sans-serif;font-size:.45rem;letter-spacing:.16em;
        color:${VIOLET}88;margin-bottom:8px">SITUATION</div>
      <div style="font-size:.92rem;line-height:1.6;color:#e8deff;font-weight:500">${scen.situation}</div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(123,82,239,.3),transparent);border-radius:0 0 18px 18px"></div>
    `;
    stage.appendChild(card);

    /* options */
    const optWrap = document.createElement('div');
    optWrap.style.cssText = `width:100%;max-width:420px;`;

    const choiceLabel = document.createElement('div');
    choiceLabel.style.cssText = `
      font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.14em;
      color:${SILVER}55;margin-bottom:8px;margin-left:2px;
    `;
    choiceLabel.textContent = 'CHOOSE YOUR RESPONSE';
    optWrap.appendChild(choiceLabel);

    scen.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'rh_opt_btn';
      btn.style.animationDelay = `${0.1 + i * 0.08}s`;
      btn.style.animation = `rh_opt_in .3s ease both ${0.1 + i * 0.08}s`;
      btn.innerHTML = `<span style="font-family:Orbitron,sans-serif;font-size:.48rem;color:${AMETHYST}66;margin-right:6px">${String.fromCharCode(65 + i)}</span>${opt.text}`;

      btn.addEventListener('click', () => {
        if (!G || !G.active || G.answered || G.done) return;
        handleChoice(i, scen, optWrap);
      });

      /* keyboard A/B/C */
      optWrap.appendChild(btn);
    });

    stage.appendChild(optWrap);

    /* attach keyboard */
    if (G._kbHandler) document.removeEventListener('keydown', G._kbHandler);
    G._kbHandler = (e) => {
      if (!G || !G.active || G.answered || G.done) return;
      const map = { 'a': 0, 'b': 1, 'c': 2, 'A': 0, 'B': 1, 'C': 2,
                    '1': 0, '2': 1, '3': 2 };
      if (map[e.key] !== undefined) {
        e.preventDefault();
        handleChoice(map[e.key], scen, optWrap);
      }
    };
    document.addEventListener('keydown', G._kbHandler);

    /* scroll to top of stage */
    stage.scrollTop = 0;
  }

  function handleChoice(idx, scen, optWrap) {
    if (!G || G.answered) return;
    G.answered = true;
    G.active   = false;

    /* stop countdown */
    stopCountdown();

    const opt = scen.options[idx];
    const isCalm = opt.type === 'calm';
    const timeBonus = G.speedWindow;   // answered in first half

    let pts = 0;
    let comboScale = 1;
    if (opt.pts > 0) {
      pts = opt.pts;
      if (timeBonus) pts += 8;
      if (G.combo >= 2) pts += Math.min(G.combo * 2, 12);
      G.combo++;
      if (G.combo > G.bestCombo) G.bestCombo = G.combo;
      animateMeterChange(isCalm ? METER_GAIN : METER_GAIN * 0.5);
      // flash brightens as the streak builds so hit #1 doesn't look identical to hit #8 (visual only, scoring untouched)
      comboScale = Math.min(1 + G.combo * 0.12, 1.9);
      flashScreen(GOLD, Math.min(0.12 + G.combo * 0.025, 0.32));
      G.pillarsLit = Math.min(G.pillarsLit + 1, TOTAL_PILLARS);
    } else {
      pts = 0;
      G.combo = 0;
      animateMeterChange(METER_DRAIN * -1);
      flashScreen(CRIMSON, 0.22);
      shakeStage();
    }

    G.score = Math.max(0, G.score + pts);
    updateScoreDisplay();
    updateComboDisplay();

    /* highlight buttons */
    const btns = optWrap.querySelectorAll('.rh_opt_btn');
    btns.forEach((b, i) => {
      b.classList.add('disabled');
      const o = scen.options[i];
      if (i === idx) {
        b.classList.add(o.pts > 0 ? 'correct' : 'wrong');
      } else if (o.pts > 0 && o.pts >= (scen.options[idx].pts || 0)) {
        b.classList.add('neutral');
      }
    });

    /* floating bonus — text grows with combo depth (see comboScale above) so a long streak visibly escalates */
    if (pts > 0) {
      const label = timeBonus ? `⚡+${pts}` : `+${pts}`;
      showFloatingBonus(label, timeBonus ? TEAL : GOLD, comboScale);
    } else {
      showFloatingBonus('−RESILIENCE', CRIMSON);
    }

    /* show feedback */
    const reason = opt.reason || scen.feedback[opt.type] || scen.feedback['calm'] || '';
    showFeedback(reason, opt.pts > 0, idx, scen, optWrap);

    /* advance after delay */
    setTimeout(() => {
      if (!G || G.done) return;
      G.idx++;
      startScenario();
    }, 2800);
  }

  function showFeedback(text, positive, chosenIdx, scen, optWrap) {
    const stage = document.getElementById('rh_stage');
    if (!stage || !text) return;

    const fb = document.createElement('div');
    fb.style.cssText = `
      width:100%;max-width:420px;
      background:${positive ? 'rgba(245,200,66,.08)' : 'rgba(232,64,96,.08)'};
      border:1px solid ${positive ? 'rgba(245,200,66,.3)' : 'rgba(232,64,96,.25)'};
      border-radius:14px;padding:12px 14px;
      font-size:.75rem;line-height:1.6;
      color:${positive ? '#e8d88a' : '#f0a0b0'};
      animation:rh_feedback_in .35s ease both;
      margin-top:0;
    `;

    const icon = positive ? '✓ Calm Response:' : '⚠ Reflection:';
    fb.innerHTML = `
      <div style="font-family:Orbitron,sans-serif;font-size:.42rem;
        color:${positive ? GOLD : CRIMSON};letter-spacing:.1em;margin-bottom:5px">${icon}</div>
      <div>${text}</div>
    `;
    stage.appendChild(fb);

    /* scroll to show feedback */
    setTimeout(() => { stage.scrollTop = stage.scrollHeight; }, 50);
  }

  /* ── countdown ───────────────────────────────────────────────── */
  function startCountdown() {
    stopCountdown();
    const bar = document.getElementById('rh_countdown_bar');
    if (bar) {
      bar.style.transition = 'none';
      bar.style.width = '100%';
      requestAnimationFrame(() => {
        bar.style.transition = `width ${SCENARIO_TIME}s linear`;
        bar.style.width = '0%';
      });
    }

    updateTimerDisplay();

    G.tickInterval = setInterval(() => {
      if (!G || G.done || G.answered) return;
      G.secondsLeft--;
      if (G.secondsLeft === SPEED_HALF) G.speedWindow = false;
      updateTimerDisplay();

      if (G.secondsLeft <= 0) {
        stopCountdown();
        handleTimeout();
      }
    }, 1000);
  }

  function stopCountdown() {
    if (G && G.tickInterval) {
      clearInterval(G.tickInterval);
      G.tickInterval = null;
    }
    const bar = document.getElementById('rh_countdown_bar');
    if (bar) {
      /* freeze bar */
      const style = getComputedStyle(bar);
      bar.style.transition = 'none';
      bar.style.width = style.width;
    }
  }

  function updateTimerDisplay() {
    const el = document.getElementById('rh_timer_val');
    if (!el || !G) return;
    const s = Math.max(0, G.secondsLeft);
    el.textContent = `0:${s.toString().padStart(2, '0')}`;
    if (s <= 4) {
      el.style.color = CRIMSON;
      el.style.textShadow = `0 0 8px ${CRIMSON}88`;
    } else if (s <= SPEED_HALF) {
      el.style.color = '#FF9900';
      el.style.textShadow = 'none';
    } else {
      el.style.color = TEAL;
      el.style.textShadow = `0 0 6px ${TEAL}44`;
    }
  }

  function handleTimeout() {
    if (!G || G.answered || G.done) return;
    G.answered = true;
    G.active   = false;
    G.combo    = 0;
    animateMeterChange(TIMER_DRAIN * -1);
    flashScreen(CRIMSON, 0.28);
    shakeStage();
    showFloatingBonus('⏰ TOO SLOW!', CRIMSON);
    updateScoreDisplay();
    updateComboDisplay();

    /* show a "time up" message */
    const stage = document.getElementById('rh_stage');
    if (stage) {
      const msg = document.createElement('div');
      msg.style.cssText = `
        width:100%;max-width:420px;
        background:rgba(232,64,96,.1);border:1px solid rgba(232,64,96,.3);
        border-radius:14px;padding:12px 14px;font-size:.78rem;
        color:#f0a0b0;line-height:1.6;
        animation:rh_feedback_in .3s ease both;margin-top:8px;
      `;
      msg.innerHTML = `
        <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:${CRIMSON};letter-spacing:.1em;margin-bottom:5px">⏰ PARALYSIS COST:</div>
        Financial paralysis is real — hesitating too long on a decision is itself a choice. A calm plan means you already know what to do when pressure hits.
      `;
      stage.appendChild(msg);
    }

    setTimeout(() => {
      if (!G || G.done) return;
      G.idx++;
      startScenario();
    }, 2800);
  }

  /* ── level up ────────────────────────────────────────────────── */
  function showLevelUp(targetLevel) {
    G.level  = targetLevel;
    G.active = false;

    const LEVEL_COPY = {
      2: {
        badgeText: 'LEVEL 2 · MASTER',
        borderColor: 'rgba(245,200,66,.4)',
        badgeColor: GOLD,
        icon: '🔓',
        eyebrow: 'LEVEL 2',
        eyebrowColor: `${GOLD}88`,
        title: 'MASTER MODE',
        titleColor: GOLD,
        body: 'Now the situations are real trade-offs. Multiple responses can be reasonable — quality of reasoning matters. Some scenarios have more than one calm path.',
      },
      3: {
        badgeText: 'LEVEL 3 · CRISIS',
        borderColor: 'rgba(232,64,96,.45)',
        badgeColor: CRIMSON,
        icon: '🚨',
        eyebrow: 'LEVEL 3',
        eyebrowColor: `${CRIMSON}99`,
        title: 'CRISIS MODE',
        titleColor: CRIMSON,
        body: 'These are high-pressure, multi-step situations — a tactic to resist AND a plan to act on, in the same decision. Stay calm, verify before you act, and think two steps ahead.',
      },
    };
    const copy = LEVEL_COPY[targetLevel] || LEVEL_COPY[2];

    const badge = document.getElementById('rh_level_badge');
    if (badge) {
      badge.textContent = copy.badgeText;
      badge.style.borderColor = copy.borderColor;
      badge.style.color = copy.badgeColor;
    }

    const root = document.getElementById('rh_root');
    if (!root) { startScenario(); return; }

    const banner = document.createElement('div');
    banner.id = 'rh_level_banner';
    banner.style.cssText = `
      position:absolute;inset:0;z-index:80;
      background:rgba(3,4,12,.92);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:24px;
      animation:rh_card_in .3s ease both;
    `;
    banner.innerHTML = `
      <div style="
        width:min(360px,88vw);
        background:linear-gradient(145deg,rgba(25,15,48,.98),rgba(12,6,28,.99));
        border:2px solid ${copy.borderColor};border-radius:22px;
        padding:28px 22px;text-align:center;
        box-shadow:0 0 50px rgba(75,45,143,.3),0 16px 50px rgba(0,0,0,.8);
        position:relative;overflow:hidden;
      ">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${copy.badgeColor}88,transparent)"></div>
        <div style="font-size:2.2rem;margin-bottom:10px">${copy.icon}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.48rem;letter-spacing:.2em;color:${copy.eyebrowColor};margin-bottom:6px">${copy.eyebrow}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:1.05rem;letter-spacing:.08em;color:${copy.titleColor};text-shadow:0 0 14px ${copy.titleColor}66;margin-bottom:14px">${copy.title}</div>
        <div style="font-size:.78rem;color:${SILVER};line-height:1.7;margin-bottom:20px;max-width:280px;margin-left:auto;margin-right:auto">
          ${copy.body}
        </div>
        <button id="rh_continue_btn" style="
          font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.14em;
          background:linear-gradient(135deg,${ACCENT},${VIOLET});
          border:none;color:#fff;border-radius:14px;padding:13px 30px;cursor:pointer;
          box-shadow:0 0 20px rgba(75,45,143,.5);transition:transform .12s;
        "
        onmouseover="this.style.transform='scale(1.04)'"
        onmouseout="this.style.transform='scale(1)'">CONTINUE →</button>
        <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${ACCENT}88,transparent)"></div>
      </div>
    `;
    root.appendChild(banner);

    document.getElementById('rh_continue_btn')?.addEventListener('click', () => {
      banner.remove();
      startScenario();
    });
  }

  /* ── end game ────────────────────────────────────────────────── */
  function triggerEnd(won) {
    if (!G || G.done) return;
    G.done   = true;
    G.active = false;
    stopCountdown();
    if (G._kbHandler) document.removeEventListener('keydown', G._kbHandler);

    let stars;
    if (!won || G.meter <= 0) {
      stars = G.score >= STAR2_SCORE ? 1 : G.score > 0 ? 1 : 0;
    } else if (G.score >= STAR3_SCORE) {
      stars = 3;
    } else if (G.score >= STAR2_SCORE) {
      stars = 2;
    } else {
      stars = 1;
    }

    endGame(stars, won && G.meter > 0);
  }

  function endGame(stars, won) {
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_ddt_resilience', { level: G.level, stars, is3star, isPerfect: is3star, badge: 'Resilience Master' })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('ddt_recovery', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    const root = document.getElementById('rh_root');
    if (!root) return;

    const starStr  = stars >= 1 ? ['⭐', '⭐⭐', '⭐⭐⭐'][stars - 1] : '💔';
    const meterPct = Math.round(G.meter);
    const answered = G.idx;
    const accuracy = answered > 0 ? Math.round((G.bestCombo / answered) * 100) : 0;

    const overlay = document.createElement('div');
    overlay.id = 'rh_end_overlay';
    overlay.style.cssText = `
      position:absolute;inset:0;z-index:100;
      background:rgba(3,4,12,.93);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:16px;overflow-y:auto;
      animation:rh_card_in .4s ease both;
    `;

    // win gets a bouncy overshooting entrance so it reads as more celebratory than a loss's plain fade
    const endCardAnim = won ? 'rh_win_card_in .65s cubic-bezier(.22,1.4,.36,1) both' : 'rh_lose_card_in .4s ease both';

    overlay.innerHTML = `
      <div style="
        width:min(380px,92vw);
        background:linear-gradient(145deg,rgba(20,12,40,.99),rgba(10,5,22,.99));
        border:2px solid rgba(123,82,239,.4);
        border-radius:24px;padding:24px 20px;
        text-align:center;
        box-shadow:0 0 60px rgba(75,45,143,.25),0 20px 60px rgba(0,0,0,.8);
        position:relative;overflow:hidden;
        animation:${endCardAnim};
      ">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,${VIOLET},transparent)"></div>

        <div style="font-family:Orbitron,sans-serif;font-size:.45rem;letter-spacing:.22em;
          color:${VIOLET}88;margin-bottom:5px">
          ${won ? 'RESILIENCE BUILT' : 'SESSION ENDED'}
        </div>

        <div style="font-size:2.4rem;margin:4px 0 8px">${starStr}</div>

        <div style="font-family:Orbitron,sans-serif;font-size:1.05rem;letter-spacing:.08em;
          color:${won ? GOLD : CRIMSON};
          text-shadow:0 0 12px ${won ? GOLD : CRIMSON}88;
          margin-bottom:16px">
          ${won
            ? (stars === 3 ? 'RESILIENCE MASTER!' : stars === 2 ? 'STAYING CALM!' : 'GETTING THERE!')
            : 'METER DRAINED!'}
        </div>

        <!-- stats grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
          ${statBox('SCORE',    G.score,        GOLD)}
          ${statBox('BEST COMBO', G.bestCombo + '×', TEAL)}
          ${statBox('METER',    meterPct + '%', AMETHYST)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px">
          ${statBox('SCENARIOS', `${answered}/${TOTAL_SCENARIOS}`, SILVER)}
          ${statBox('PILLARS LIT', G.pillarsLit + '/7', VIOLET)}
        </div>

        <!-- coins -->
        ${coins > 0 ? `
        <div style="
          background:linear-gradient(135deg,rgba(245,200,66,.1),rgba(245,200,66,.04));
          border:1px solid rgba(245,200,66,.28);
          border-radius:12px;padding:10px;margin-bottom:14px;
        ">
          <div style="font-family:Orbitron,sans-serif;font-size:.42rem;color:${GOLD}88;letter-spacing:.12em">COINS EARNED</div>
          <div style="font-family:Orbitron,sans-serif;font-size:1.3rem;color:${GOLD};text-shadow:0 0 10px ${GOLD}88">+${coins} 🪙</div>
        </div>
        ` : ''}

        <!-- end lesson -->
        <div style="
          background:rgba(75,45,143,.12);border:1px solid rgba(123,82,239,.22);
          border-radius:12px;padding:13px;margin-bottom:16px;
          font-size:.7rem;line-height:1.7;color:${SILVER};text-align:left;
        ">
          <div style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.1em;
            color:${VIOLET};margin-bottom:6px">💡 END LESSON</div>
          Financial stress is real, and emotions drive many bad money decisions — <strong style="color:${GOLD}">peer pressure</strong>, <strong style="color:${CRIMSON}">fear</strong>, and <strong style="color:#FF9900">impulse</strong> are the top three. Resilience is not about being fearless; it is about having a plan so that when pressure hits, <em>you already know your response</em>. A small pause before any financial decision is one of the most powerful tools you have.
        </div>

        <!-- buttons -->
        <div style="display:flex;gap:10px">
          <button onclick="window.ddt_resiliencePlayAgain()" style="
            flex:1;padding:11px 8px;border-radius:12px;cursor:pointer;
            border:2px solid rgba(123,82,239,.5);
            background:rgba(75,45,143,.2);
            color:${VIOLET};font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.1em;
            transition:all .15s;
          "
          onmouseover="this.style.background='rgba(75,45,143,.4)'"
          onmouseout="this.style.background='rgba(75,45,143,.2)'">↻ PLAY AGAIN</button>
          <button onclick="window.ddt_resilienceExit()" style="
            flex:1;padding:11px 8px;border-radius:12px;cursor:pointer;
            border:2px solid rgba(245,200,66,.35);
            background:rgba(245,200,66,.08);
            color:${GOLD};font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.1em;
            transition:all .15s;
          "
          onmouseover="this.style.background='rgba(245,200,66,.18)'"
          onmouseout="this.style.background='rgba(245,200,66,.08)'">← HUB</button>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,${ACCENT},transparent)"></div>
      </div>
    `;

    root.appendChild(overlay);
  }

  function statBox(label, val, color) {
    return `
      <div style="
        background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);
        border-radius:10px;padding:7px 4px;
      ">
        <div style="font-family:Orbitron,sans-serif;font-size:.4rem;color:#555;
          letter-spacing:.07em;margin-bottom:3px">${label}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.82rem;color:${color};
          font-variant-numeric:tabular-nums">${val}</div>
      </div>
    `;
  }

  /* ── play again ──────────────────────────────────────────────── */
  window.ddt_resiliencePlayAgain = function () {
    stopCountdown();
    if (G && G._kbHandler) document.removeEventListener('keydown', G._kbHandler);
    const overlay = document.getElementById('rh_end_overlay');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);

    /* reset badge */
    const badge = document.getElementById('rh_level_badge');
    if (badge) {
      badge.textContent = 'LEVEL 1 · LEARN';
      badge.style.borderColor = 'rgba(123,82,239,.4)';
      badge.style.color = VIOLET;
    }

    /* reset score display */
    const sv = document.getElementById('rh_score_val');
    if (sv) sv.textContent = '0';

    /* reset timer */
    const tv = document.getElementById('rh_timer_val');
    if (tv) { tv.textContent = '0:12'; tv.style.color = TEAL; tv.style.textShadow = 'none'; }

    /* reset countdown bar */
    const bar = document.getElementById('rh_countdown_bar');
    if (bar) { bar.style.transition = 'none'; bar.style.width = '100%'; }

    /* reset scenario counter */
    const cur = document.getElementById('rh_scen_cur');
    if (cur) cur.textContent = '1';

    /* rebuild meter */
    buildMeter();

    /* re-init game */
    initGame();
  };

  /* ── exit ────────────────────────────────────────────────────── */
  window.ddt_resilienceExit = function () {
    stopCountdown();
    if (G && G._kbHandler) document.removeEventListener('keydown', G._kbHandler);
    G = null;
    if (window.state) state.viewingWorld = 'rebuilder';
    goTo('hub');
  };

  /* ── display helpers ─────────────────────────────────────────── */
  function updateScoreDisplay() {
    const el = document.getElementById('rh_score_val');
    if (el && G) el.textContent = G.score;
  }

  function updateComboDisplay() {
    const wrap = document.getElementById('rh_combo_wrap');
    const val  = document.getElementById('rh_combo_val');
    if (!wrap || !val || !G) return;
    if (G.combo >= 2) {
      wrap.style.display = 'flex';
      val.textContent = `×${G.combo}`;
      val.style.color = G.combo >= 4 ? GOLD : TEAL;
      // keep escalating visually past the gold threshold so combo 10 doesn't look identical to combo 4
      const growScale = Math.min(1 + Math.max(0, G.combo - 4) * 0.06, 1.5);
      val.style.transform = `scale(${growScale})`;
      val.style.textShadow = `0 0 ${Math.round(8*growScale)}px ${(G.combo >= 4 ? GOLD : TEAL)}aa`;
    } else {
      wrap.style.display = 'none';
    }
  }

  function flashScreen(color, alpha) {
    const el = document.getElementById('rh_flash');
    if (!el) return;
    el.style.background = color;
    el.style.opacity    = alpha;
    setTimeout(() => { el.style.opacity = 0; }, 150);
  }

  function shakeStage() {
    const stage = document.getElementById('rh_stage');
    if (!stage) return;
    stage.style.animation = 'rh_shake .3s ease';
    setTimeout(() => { stage.style.animation = ''; }, 320);
  }

  function showFloatingBonus(text, color, scale) {
    const root = document.getElementById('rh_root');
    if (!root) return;
    const sz = 1.1 * (scale || 1);   // combo depth bumps font size so a long streak reads as a bigger deal
    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%);
      font-family:Orbitron,sans-serif;font-size:${sz}rem;font-weight:700;
      color:${color};text-shadow:0 0 ${Math.round(12*(scale||1))}px ${color}88;
      pointer-events:none;z-index:90;white-space:nowrap;
      animation:rh_bonus_float .9s ease-out forwards;
    `;
    el.textContent = text;
    root.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 950);
  }

  /* ── shuffle ─────────────────────────────────────────────────── */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

})();
