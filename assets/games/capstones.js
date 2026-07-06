/* ════════════════════════════════════════════════════════════════
   CAPSTONE CHALLENGES · Coinaverse — 5 hub boss gauntlets
   One shared 3-phase engine, per-hub content + theming:
     Phase 1  RAPID FIRE      — 8 timed questions (10s, streak bonus)
     Phase 2  DECISION STORM  — 5 scenario cards (12s, best-of-3)
     Phase 3  BOSS METER      — drain the boss HP bar before 60s
   Screens   : game_capstone_credtech / _ddt / _investopia /
               _budgetron / _launchlab
   Unlock    : 3★ in all 7 hub games (cvCapstoneReady) — or
               PRACTICE ANYWAY (half coins · no badge)
   Rewards   : cvAwardGame(id,{isFlagship:true,level:3,...}) = 900 base
   Exposes   : window.CAPSTONES, window.cvCapstoneExit,
               window.cvCapstonePractice
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── tuning ─────────────────────────────────────────────────── */
  var RAPID_N     = 8;      // questions in phase 1
  var RAPID_TIME  = 10;     // s per rapid question
  var STORM_TIME  = 12;     // s per scenario
  var BOSS_HP     = 100;
  var BOSS_TIME   = 60;     // s for final showdown
  var DMG_BASE    = 15;     // boss damage per correct answer
  var DMG_STREAK  = 3;      // extra dmg per streak level (cap 5)
  var HEAL_WRONG  = 10;     // boss heals on wrong answer

  var GOLD = '#fbbf24', RED = '#ef4444', GREEN = '#22c55e', BG = '#03040c';

  /* ── tiny builders ──────────────────────────────────────────── */
  function q(t, o, a) { return { t: t, o: o, a: a }; }                 // question
  function sc(t, o, a, why) { return { t: t, o: o, a: a, why: why }; } // scenario

  /* ══ HUB CONFIGS ══════════════════════════════════════════════ */
  var HUBS = {

    /* ── 1 · CREDTECH GALAXY ─────────────────────────────────── */
    credtech: {
      screen: 'game_capstone_credtech', name: 'Galaxy Boss Challenge',
      title: 'GALAXY BOSS CHALLENGE', hubLabel: 'CredTech Galaxy', icon: '🛰️',
      accent: '#14b8a6', world: 'credtech', hubScreen: 'credtech_hub',
      boss: 'The Corruptor', bossIcon: '🦠',
      bossLine: 'I feed on late payments and maxed-out cards. Your credit history is MINE to poison!',
      badge: 'CredTech Galaxy Champion',
      games: ['game_creditcore','game_scoretower','game_borrowingbay','game_trustexchange','game_repaymentrunway','game_creditlimitlab','game_reportobservatory'],
      rapid: [
        q('What does a credit score actually measure?', ['How rich you are','How reliably you repay borrowed money','How many cards you own','How big your allowance is'], 1),
        q('A typical FICO credit score falls between…', ['0 – 100','1 – 1000','300 – 850','500 – 5000'], 2),
        q('The single BIGGEST factor in a credit score is…', ['Payment history','Your age','Your salary','Your zip code'], 0),
        q('Credit utilization means…', ['How fast you swipe','How much of your limit you are using','How many stores accept your card','How old your card is'], 1),
        q('Paying only the minimum on a credit card means…', ['You pay it off fastest','The bank waives interest','You pay lots of extra interest over time','Your limit goes up'], 2),
        q('APR stands for the…', ['Yearly cost of borrowing money','Points you earn shopping','Age of your account','Bank’s secret rating'], 0),
        q('A missed payment can stay on your credit report for about…', ['1 week','6 months','Up to 7 years','Forever, always'], 2),
        q('Best FIRST move to build credit from zero?', ['Open 6 cards at once','Pay every bill on time','Borrow the max allowed','Ignore credit until 30'], 1),
        q('Checking your OWN credit report…', ['Crashes your score','Does not hurt your score','Costs 100 coins each time','Alerts every bank'], 1),
        q('A credit limit is…', ['The most you can borrow on that card','A monthly fee','Your minimum payment','A reward level'], 0),
        q('A healthy habit is keeping utilization under about…', ['30%','75%','90%','100%'], 0),
        q('Collateral is…', ['A late fee','Something valuable pledged to back a loan','A type of credit card','Free money from banks'], 1)
      ],
      storm: [
        sc('Your friend asks to borrow $50 and promises to repay in a month — but never repaid the $20 from last time.', ['Lend it — friends are friends','Kindly say no until the first loan is repaid','Lend $100 so they can fix everything'], 1, 'Trust is built on repayment history — exactly like credit.'),
        sc('You just got your first credit card with a $500 limit. Smartest play?', ['Spend $490 fast to earn rewards','Use ~$100 and pay it off IN FULL each month','Lock it in a drawer and never use it'], 1, 'Small use + full on-time payoff builds score without interest.'),
        sc('Your $35 phone bill is due Friday, but you leave for camp Thursday.', ['Pay it Monday when back — barely late','Set autopay before you leave','Skip it — one late payment is no big deal'], 1, 'Autopay removes human error; one late mark can sting for years.'),
        sc('A store offers "INSTANT CREDIT — 29% APR!" so you can grab a $400 console today.', ['Sign up — instant is awesome','Walk away and save up instead','Open two accounts for double points'], 1, '29% APR turns a $400 console into a much more expensive one.'),
        sc('You spot an account on your credit report that you never opened.', ['Ignore it — probably fine','Dispute the error with the credit bureau','Close every account you own in panic'], 1, 'Report errors — disputing protects your score and stops fraud.')
      ],
      bossQs: [
        q('On-time payments push your score…', ['UP','DOWN','Nowhere'], 0),
        q('Maxing out every card is…', ['Genius','Risky — sky-high utilization','Free points'], 1),
        q('A longer credit history is usually…', ['Worse','Better','Illegal'], 1),
        q('Opening many new cards at once…', ['Boosts score fast','Dings your score with hard inquiries','Does nothing'], 1),
        q('Closing your oldest card can…', ['Shorten history and hurt your score','Add 100 points','Erase old debt'], 0),
        q('A cosigner on a loan…', ['Is just a witness','Shares full responsibility for repayment','Pays all fees'], 1),
        q('A secured credit card is backed by…', ['A cash deposit','Pure luck','Your homework'], 0),
        q('The ultimate anti-Corruptor shield is paying…', ['Whenever you remember','On time, every time','Only in coins'], 1)
      ]
    },

    /* ── 2 · DEBT DETOX DISTRICT ─────────────────────────────── */
    ddt: {
      screen: 'game_capstone_ddt', name: 'Master Challenge',
      title: 'MASTER CHALLENGE', hubLabel: 'Debt Detox District', icon: '🧬',
      accent: '#A78BFA', world: 'rebuilder', hubScreen: 'hub',
      boss: 'The Debt Overlord', bossIcon: '👹',
      bossLine: 'Minimum payments… endless interest… you will NEVER escape my compounding grip!',
      badge: 'Debt Detox Master',
      games: ['game_ddt_discovery','game_ddt_plaza','game_ddt_lab','game_ddt_rebuild','game_ddt_habits','game_ddt_gym','game_ddt_resilience'],
      rapid: [
        q('Debt is simply…', ['Money you owe someone','Money in your piggy bank','A type of salary','Free money'], 0),
        q('Which debt usually costs the MOST over time?', ['0% family loan','High-interest credit card balance','Low-rate student loan','Library fine'], 1),
        q('The SNOWBALL method pays off…', ['The smallest balance first','The biggest balance first','Random debts','Only interest'], 0),
        q('The AVALANCHE method attacks…', ['The newest debt','The highest interest rate first','The friendliest lender','Whatever is due today'], 1),
        q('Interest on debt is…', ['A gift from the bank','Extra money you pay for borrowing','Optional decoration','A tax refund'], 1),
        q('An emergency fund mainly helps you…', ['Buy more games','Avoid NEW debt when surprises hit','Impress friends','Skip chores'], 1),
        q('Minimum payments mostly cover…', ['The whole balance','Interest — barely denting the balance','Future purchases','Bank snacks'], 1),
        q('Debt consolidation means…', ['Hiding debts in a drawer','Combining debts into one single payment','Doubling your debts','Ignoring statements'], 1),
        q('The smartest FIRST step of a debt detox?', ['List everything you owe','Burn the bills','Open a new card','Buy a lottery ticket'], 0),
        q('A needs-first budget helps a detox because it…', ['Makes food boring','Frees up cash to attack debt','Deletes your debt instantly','Hides your money'], 1),
        q('Borrowing MORE money to pay old debt is usually…', ['A debt spiral','A pro move','Required by law','Free'], 0)
      ],
      storm: [
        sc('You owe: $40 to a friend (0%), $300 on a card (22%), $200 loan (5%). You have an extra $50/month. Avalanche says…', ['Pay the friend — smallest','Attack the 22% card first','Split it evenly three ways'], 1, 'Highest interest bleeds you fastest — kill it first.'),
        sc('Mid-detox, your game console dies. You have $150 saved for emergencies.', ['Finance a new one at 25% APR','Wait, save up, borrow a friend’s for now','Pause ALL debt payments this month'], 1, 'No new high-interest debt — patience protects the plan.'),
        sc('You get $100 birthday money while paying off debt.', ['Spend it all — birthdays don’t count','Send most at the high-interest debt, keep a little for fun','Lend it to a classmate for profit'], 1, 'Windfalls are turbo-fuel for payoff — with a small joy budget.'),
        sc('Your new side gig earns an extra $60/month.', ['Upgrade your lifestyle immediately','Roll it into finishing your smallest debt','Stuff it under your mattress'], 1, 'Finishing a whole debt frees its payment — snowball power.'),
        sc('Friends plan a pricey trip while you’re mid-payoff.', ['Charge it — you only live once','Suggest a cheaper hangout and keep your plan','Skip this month’s payments quietly'], 1, 'Protect the plan AND the friendship — cheaper fun exists.')
      ],
      bossQs: [
        q('Paying MORE than the minimum shrinks debt…', ['Faster','Slower','Never'], 0),
        q('High-interest debt grows…', ['Only on Mondays','Every single day','When you look at it'], 1),
        q('Avalanche slays the debt with the highest…', ['Balance','Interest rate','Nickname'], 1),
        q('Tracking your spending exposes…', ['Money leaks','Nothing','Your friends'], 0),
        q('Taking NEW debt mid-detox makes escape…', ['Faster','Slower','Cooler'], 1),
        q('Autopay protects you from…', ['Late fees','Homework','Weather'], 0),
        q('The Overlord’s true weakness is your…', ['Emergency fund','New credit card','Lucky charm'], 0),
        q('When a debt hits $0, roll its payment…', ['Into shopping','Onto the next debt','Into a volcano'], 1)
      ]
    },

    /* ── 3 · INVESTOPIA ──────────────────────────────────────── */
    investopia: {
      screen: 'game_capstone_investopia', name: 'Wealth Masters Championship',
      title: 'WEALTH MASTERS CHAMPIONSHIP', hubLabel: 'Investopia', icon: '📈',
      accent: '#10b981', world: 'investor', hubScreen: 'hub',
      boss: 'Market Phantom', bossIcon: '👻',
      bossLine: 'I am hype… I am panic… sell low, buy high, and your wealth becomes MIST!',
      badge: 'Wealth Masters Champion',
      games: ['game_inv_stockarena','game_inv_portfolio','game_inv_research','game_inv_dividend','game_inv_assetrealm','game_inv_riskcontrol','game_inv_academy'],
      rapid: [
        q('Owning a stock means owning…', ['A tiny piece of a company','The CEO’s car','A company loan','A gift card'], 0),
        q('Diversification means…', ['Betting everything on one winner','Spreading money across many investments','Only buying on Fridays','Copying one friend'], 1),
        q('A dividend is…', ['A fine for investors','Profit a company shares with stockholders','A stock market tax','A type of chart'], 1),
        q('Compound growth means…', ['Your earnings start earning too','Prices never fall','Doubling daily, guaranteed','Interest is illegal'], 0),
        q('Higher potential returns usually come with…', ['Lower risk','Higher risk','No risk','Free snacks'], 1),
        q('An index fund holds…', ['One secret stock','Many companies at once','Only gold','Expired coupons'], 1),
        q('A BULL market is when prices generally…', ['Rise','Fall','Freeze','Vanish'], 0),
        q('Long-term investors treat market dips as…', ['The end of the world','Normal — stay calm and stick to the plan','A reason to sell everything','Fake news'], 1),
        q('A bond is basically…', ['A loan you give that pays you interest','A spy gadget','A stock costume','A savings password'], 0),
        q('A portfolio is…', ['One lucky stock','Your whole collection of investments','A leather briefcase only','A market rumor'], 1),
        q('"Guaranteed 50% returns every week!" is…', ['A dream come true','Almost certainly a scam','Standard banking','A dividend'], 1)
      ],
      storm: [
        sc('The market drops 10% in a week. Your fund is for college in 8 years.', ['Sell everything NOW','Stay invested and keep the plan','Borrow money to triple-down'], 1, 'Time smooths dips — panic-selling locks in the loss.'),
        sc('A friend whispers: "This coin will 100x — trust me, everyone’s in!"', ['Go all-in immediately','Research it first; if it’s unclear, skip it','Invest your emergency fund'], 1, 'Hype is not research. If you can’t explain it, don’t buy it.'),
        sc('You have $100 to start investing.', ['One hot stock, full send','Mostly a diversified fund, maybe a tiny fun pick','Keep it all in cash forever'], 1, 'Diversified core + small satellite = smart starter recipe.'),
        sc('Your stock is up 50% and the company news is still strong.', ['Panic-sell everything today','Stick to your plan — maybe rebalance a little','Buy more with borrowed money'], 1, 'Plans beat emotions — trim to rebalance, don’t gamble.'),
        sc('Your fund pays you a dividend. Best LONG-TERM move?', ['Reinvest it to buy more shares','Cash out for candy','Sell the whole fund'], 0, 'Reinvested dividends are compounding’s secret engine.')
      ],
      bossQs: [
        q('Panic-selling in a dip usually…', ['Locks in losses','Prints profit','Feels amazing later'], 0),
        q('TIME in the market beats…', ['TIMING the market','Reading books','Everything else combined'], 0),
        q('Diversification protects you when…', ['One company crashes','Markets rise','You sleep in'], 0),
        q('Compound interest grows fastest with…', ['Time','Luck','Loud music'], 0),
        q('"Risk-free 50% weekly" is…', ['A scam','A bargain','A bond'], 0),
        q('Reinvested dividends…', ['Buy more shares','Disappear','Pay taxes only'], 0),
        q('Risk that keeps you up at night is…', ['Too much risk','Perfect','Required'], 0),
        q('The Phantom’s fog of hype clears with…', ['Research','Rumors','Caffeine'], 0)
      ]
    },

    /* ── 4 · BUDGETRON ───────────────────────────────────────── */
    budgetron: {
      screen: 'game_capstone_budgetron', name: 'Command Challenge',
      title: 'COMMAND CHALLENGE', hubLabel: 'Budgetron', icon: '🎛️',
      accent: '#3b82f6', world: 'strategist', hubScreen: 'hub',
      boss: 'Dr. Dollarvex', bossIcon: '🧪',
      bossLine: 'Impulse buys! Forgotten subscriptions! I will vaporize your budget one tiny leak at a time!',
      badge: 'Budgetron Commander',
      games: ['game_bud_cashflow','game_bud_needswants','game_bud_billgrid','game_bud_vault','game_bud_plaza','game_bud_goaltower','game_bud_efflab'],
      rapid: [
        q('A budget is…', ['A punishment','A plan for your money','A bank account','A type of coupon'], 1),
        q('Income minus expenses equals your…', ['Credit score','Cash flow','Shopping list','Tax bill'], 1),
        q('A NEED is…', ['Anything on sale','Something you must have to live','Whatever friends have','The newest phone'], 1),
        q('Which of these is a WANT?', ['Water bill','School lunch','A new game skin','Bus fare to school'], 2),
        q('In the 50/30/20 rule, the 20% goes to…', ['Wants','Savings','Snacks','Streaming'], 1),
        q('A FIXED expense is like…', ['A surprise gift','Your monthly phone bill','Random candy runs','A lucky find'], 1),
        q('"Pay yourself first" means…', ['Buy treats before bills','Move money to savings BEFORE spending','Pay in coins only','Tip yourself'], 1),
        q('If expenses are bigger than income, you have a…', ['Surplus','Deficit','Dividend','Bonus'], 1),
        q('An emergency fund exists to cover…', ['Concert tickets','Surprise expenses','Daily snacks','Game passes'], 1),
        q('Tracking tiny purchases matters because they…', ['Never matter','Add up fast','Are free','Track themselves'], 1),
        q('A sinking fund is…', ['Saving a little monthly for a big planned cost','A leaky boat','A failed budget','Money you drop'], 0)
      ],
      storm: [
        sc('You receive $40 allowance. Command decision?', ['Spend it all on day one','Split it: save / spend / give','Hide it and decide never'], 1, 'A split plan gives every dollar a mission.'),
        sc('Phone bill $20 is due; you want a $25 hoodie; you have $35.', ['Hoodie now, bill late','Pay the bill, save toward the hoodie','Borrow to grab both'], 1, 'Needs and bills deploy first — wants wait their turn.'),
        sc('You notice a $9/month streaming sub you never watch.', ['Keep it — maybe someday','Cancel it and redirect the $9 to your goal','Upgrade to premium'], 1, 'Subscription leaks are Dollarvex’s favorite fuel.'),
        sc('Grocery mission with a $30 list… a $10 candy display attacks!', ['Grab it — you deserve it','Stick to the list; plan a small treat next budget','Swap the veggies for candy'], 1, 'The list is your shield — planned treats beat impulse strikes.'),
        sc('Goal: $120 headphones in 3 months.', ['Hope leftover money appears','Auto-save $10 every week','Buy lottery tickets daily'], 1, '$10 × 12 weeks = $120. Automation makes it inevitable.')
      ],
      bossQs: [
        q('A real budget gives every dollar…', ['A job','A nap','A snack'], 0),
        q('Needs deploy before…', ['Wants','Bills','Breakfast'], 0),
        q('Positive cash flow means money in is…', ['MORE than money out','Less than money out','Imaginary'], 0),
        q('Impulse buys are Dollarvex’s…', ['Favorite weapon','Weakness','Homework'], 0),
        q('Reviewing your budget monthly keeps it…', ['Realistic','Frozen','Secret'], 0),
        q('Small daily leaks (snacks, skins)…', ['Sink big goals','Are harmless','Fix themselves'], 0),
        q('Automating savings makes saving…', ['Effortless','Impossible','Optional'], 0),
        q('A goal with an amount AND a date is…', ['SMART','Boring','Cheating'], 0)
      ]
    },

    /* ── 5 · LAUNCH LAB ──────────────────────────────────────── */
    launchlab: {
      screen: 'game_capstone_launchlab', name: 'Master Challenge',
      title: 'MASTER CHALLENGE', hubLabel: 'Launch Lab', icon: '🚀',
      accent: '#7C3AED', world: 'risktaker', hubScreen: 'hub',
      boss: 'Chaos Competitor', bossIcon: '🤖',
      bossLine: 'I copy every idea, undercut every price, and CRUSH founders who stop learning!',
      badge: 'Launch Lab Legend',
      games: ['game_ll_idea_incubator','game_ll_branding_district','game_ll_product_dev_lab','game_ll_startup_street','game_ll_investor_pitch','game_ll_marketing_metropolis','game_ll_scaling_center'],
      rapid: [
        q('An entrepreneur is someone who…', ['Only invests in stocks','Starts and runs a business','Grades homework','Avoids all risk'], 1),
        q('Profit equals…', ['Revenue minus costs','Revenue plus costs','Whatever’s in the register','Likes on a post'], 0),
        q('An MVP (minimum viable product) is…', ['The fanciest final version','The simplest version that tests the idea','A trophy','A marketing slogan'], 1),
        q('Your target market is…', ['Everyone on Earth','The people most likely to buy from you','Your competitors','Random strangers only'], 1),
        q('A brand is…', ['Just a logo file','How people recognize and FEEL about your business','A cattle tool only','A price tag'], 1),
        q('A great pitch explains…', ['Problem, solution, and why YOU','Only the logo colors','Your favorite movie','How rich you’ll get'], 0),
        q('Revenue is…', ['Money coming in from sales','Money you borrowed','Office decorations','Employee snacks'], 0),
        q('Market research helps you learn…', ['What customers actually want','Nothing useful','Your horoscope','Competitor passwords'], 0),
        q('An investor usually trades money for…', ['A share of the business','Your backpack','Free products forever','Nothing at all'], 0),
        q('Scaling a business means…', ['Weighing it','Growing it without breaking it','Shrinking on purpose','Painting the office'], 1),
        q('Customer feedback is…', ['An insult','Free gold for improving your product','Legally binding','Always wrong'], 1)
      ],
      storm: [
        sc('Your lemonade stand gets zero customers all morning.', ['Quit forever — it’s over','Ask passersby why, then test one change','Triple the price'], 1, 'Founders debug: learn WHY, change ONE thing, test again.'),
        sc('Two ideas: one you love (nobody wants it), one solves a real problem your neighbors keep mentioning.', ['Build the one you love, ignore demand','Test the problem-solver first','Build neither, too risky'], 1, 'Real demand beats personal crush — validate the pain.'),
        sc('Your first 10 customers arrive — 3 report the SAME bug.', ['Ignore it, ship shiny features','Fix that bug before anything else','Blame the customers'], 1, 'Repeated feedback = flashing red signal. Fix the leak first.'),
        sc('An investor offers cash… for 90% of your company.', ['Take it — money is money','Negotiate or find fairer terms','Sign without reading'], 1, 'Equity is your kingdom — never give it away blind.'),
        sc('Your product sells out and orders keep flooding in.', ['Accept infinite orders anyway','Pause sales, fix supply, communicate honestly','Silently cancel old orders'], 1, 'Honest communication protects the brand while you scale.')
      ],
      bossQs: [
        q('When a rival copies you, win by…', ['Serving customers better','Crying loudly','Copying them back'], 0),
        q('Spending all your cash at once causes…', ['Runway wipeout','Instant success','More cash'], 0),
        q('A clear brand makes you…', ['Memorable','Invisible','Expensive only'], 0),
        q('Listening to customers beats…', ['Guessing','Working','Sleeping'], 0),
        q('Failing FAST means…', ['Learn cheap, adjust quick','Give up early','Break things forever'], 0),
        q('Word-of-mouth explodes when you…', ['Over-deliver','Overcharge','Overpromise'], 0),
        q('Chaos wins the moment a founder…', ['Stops learning','Takes notes','Asks questions'], 0),
        q('Great teams are glued together by…', ['A shared mission','Free pizza only','Matching shirts'], 0)
      ]
    }
  };

  /* ── public map for hub screens ─────────────────────────────── */
  window.CAPSTONES = {};
  Object.keys(HUBS).forEach(function (k) {
    window.CAPSTONES[k] = { screen: HUBS[k].screen, games: HUBS[k].games.slice(), name: HUBS[k].name };
  });

  /* ── module state ───────────────────────────────────────────── */
  var G = null;            // live game state
  var CUR = null;          // current hub key while a capstone screen is up
  var PRACTICE = {};       // per-hub practice-mode flags (until exit)

  /* ── helpers ────────────────────────────────────────────────── */
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function hexRGB(hex) {
    var n = parseInt(hex.slice(1), 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  var NICE = {
    creditcore: 'CREDIT CORE', scoretower: 'SCORE TOWER', borrowingbay: 'BORROWING BAY',
    trustexchange: 'TRUST EXCHANGE', repaymentrunway: 'REPAYMENT RUNWAY',
    creditlimitlab: 'CREDIT LIMIT LAB', reportobservatory: 'REPORT OBSERVATORY',
    needswants: 'NEEDS VS WANTS', billgrid: 'BILL GRID', cashflow: 'CASH FLOW',
    efflab: 'EFFICIENCY LAB', goaltower: 'GOAL TOWER', stockarena: 'STOCK ARENA',
    assetrealm: 'ASSET REALM', riskcontrol: 'RISK CONTROL', product_dev_lab: 'PRODUCT DEV LAB'
  };
  function prettyGame(gid) {
    var s = gid.replace(/^game_/, '').replace(/^(ddt|inv|bud|ll)_/, '');
    return NICE[s] || s.replace(/_/g, ' ').toUpperCase();
  }
  function killTimers() {
    if (!G) return;
    if (G.qTimer)   { clearInterval(G.qTimer);   G.qTimer = null; }
    if (G.bossTick) { clearInterval(G.bossTick); G.bossTick = null; }
    if (G.raf)      { cancelAnimationFrame(G.raf); G.raf = null; }
  }

  /* ── global exit / practice hooks ───────────────────────────── */
  window.cvCapstoneExit = function () {
    killTimers();
    var cfg = CUR ? HUBS[CUR] : null;
    if (CUR) PRACTICE[CUR] = false;
    G = null;
    if (cfg) {
      if (window.state) state.viewingWorld = cfg.world;
      goTo(cfg.hubScreen);
    } else {
      goTo('home');
    }
  };
  window.cvCapstonePractice = function (k) {
    PRACTICE[k] = true;
    if (window.cvToast) cvToast('⚡ Practice mode — half coins · no badge');
    goTo(HUBS[k].screen);
  };

  /* ── CSS (inject once) ──────────────────────────────────────── */
  (function injectCSS() {
    if (el('cap_css')) return;
    var st = document.createElement('style');
    st.id = 'cap_css';
    st.textContent = [
      '@keyframes capFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}',
      '@keyframes capPop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}',
      '@keyframes capShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}',
      '@keyframes capPulse{0%,100%{opacity:.55}50%{opacity:1}}',
      '@keyframes capFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}',
      '.cap-anim{animation:capFadeUp .35s ease both}',
      '.cap-opt{display:block;width:100%;text-align:left;background:rgba(255,255,255,.05);border:1.5px solid rgba(var(--capa),.35);color:#fff;border-radius:12px;padding:13px 16px;margin:8px 0;font-family:Inter,sans-serif;font-size:14px;line-height:1.45;cursor:pointer;transition:border-color .15s,background .15s,transform .1s}',
      '.cap-opt:hover{background:rgba(var(--capa),.14);border-color:rgba(var(--capa),.9)}',
      '.cap-opt:active{transform:scale(.985)}',
      '.cap-opt.good{background:rgba(34,197,94,.22)!important;border-color:#22c55e!important;box-shadow:0 0 18px rgba(34,197,94,.4)}',
      '.cap-opt.bad{background:rgba(239,68,68,.2)!important;border-color:#ef4444!important;animation:capShake .4s ease}',
      '.cap-opt.dim{opacity:.35;pointer-events:none}',
      '.cap-opt[disabled]{pointer-events:none}',
      '.cap-btn{background:linear-gradient(135deg,rgb(var(--capa)),rgba(var(--capa),.65));border:none;color:#fff;padding:13px 30px;border-radius:11px;font-family:Orbitron,monospace;font-size:13px;font-weight:700;letter-spacing:1.5px;cursor:pointer;transition:transform .15s,box-shadow .2s;box-shadow:0 4px 22px rgba(var(--capa),.35)}',
      '.cap-btn:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(var(--capa),.55)}',
      '.cap-btn.ghost{background:transparent;border:2px solid rgba(var(--capa),.55);box-shadow:none;color:rgba(255,255,255,.85)}',
      '.cap-lockrow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 14px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(var(--capa),.25);margin:6px 0;font-size:12.5px}',
      '.cap-lockrow.ok{border-color:rgba(34,197,94,.5);background:rgba(34,197,94,.08)}',
      '#cap_arena::-webkit-scrollbar,#cap_lockscroll::-webkit-scrollbar{width:4px}',
      '#cap_arena::-webkit-scrollbar-thumb,#cap_lockscroll::-webkit-scrollbar-thumb{background:rgba(var(--capa),.4);border-radius:2px}'
    ].join('\n');
    document.head.appendChild(st);
  })();

  /* ══ SCREEN REGISTRATION (5 screens, one engine) ═════════════ */
  window.SCREENS = window.SCREENS || {};
  Object.keys(HUBS).forEach(function (k) {
    var cfg = HUBS[k];
    window.SCREENS[cfg.screen] = function () {
      CUR = k;
      killTimers();
      G = null;
      var ready = window.cvCapstoneReady
        ? cvCapstoneReady(cfg.games)
        : { ready: true, done: cfg.games.length, total: cfg.games.length };
      if (!ready.ready && !PRACTICE[k]) {
        setTimeout(function () { initLock(k); }, 40);
        return lockHTML(k, ready);
      }
      var practice = !ready.ready;
      setTimeout(function () { initGame(k, practice); }, 40);
      return gameHTML(k, practice);
    };
  });

  /* ══ LOCK SCREEN ═════════════════════════════════════════════ */
  function lockHTML(k, ready) {
    var cfg = HUBS[k], rgb = hexRGB(cfg.accent);
    var s = window.state || {};
    var stars = s.gameStars || {};
    var rows = cfg.games.map(function (gid) {
      var st = Math.min(3, stars[gid] || 0);
      var ok = st >= 3;
      return '<div class="cap-lockrow' + (ok ? ' ok' : '') + '">' +
        '<span style="letter-spacing:.5px;color:' + (ok ? '#a7f3d0' : 'rgba(255,255,255,.75)') + '">' + (ok ? '✅ ' : '🔸 ') + prettyGame(gid) + '</span>' +
        '<span style="font-size:13px;letter-spacing:2px">' + '⭐'.repeat(st) + '<span style="opacity:.3">' + '⭐'.repeat(3 - st) + '</span></span></div>';
    }).join('');
    return '<div id="cap_root" style="--capa:' + rgb + ';position:absolute;inset:0;background:radial-gradient(1000px 600px at 50% -10%,rgba(' + rgb + ',.16),transparent 60%),' + BG + ';overflow:hidden;font-family:Inter,sans-serif;color:#fff">' +
      '<div id="cap_lockscroll" style="position:absolute;inset:0;overflow-y:auto;display:flex;flex-direction:column;align-items:center;padding:40px 18px 30px">' +
        '<div class="cap-anim" style="max-width:460px;width:100%;text-align:center">' +
          '<div style="font-size:52px;animation:capFloat 3s ease-in-out infinite">🔒</div>' +
          '<div style="font-family:Orbitron,monospace;font-size:20px;font-weight:900;letter-spacing:3px;color:' + cfg.accent + ';margin:10px 0 4px">' + cfg.title + '</div>' +
          '<div style="font-family:Orbitron,monospace;font-size:10px;letter-spacing:2.5px;color:rgba(255,255,255,.5);margin-bottom:14px">' + cfg.icon + ' ' + cfg.hubLabel.toUpperCase() + ' · CAPSTONE</div>' +
          '<div style="display:inline-block;background:rgba(' + rgb + ',.12);border:1px solid rgba(' + rgb + ',.5);border-radius:999px;padding:8px 20px;font-family:Orbitron,monospace;font-size:12px;letter-spacing:1.5px;color:#fff;margin-bottom:16px">' +
            ready.done + '/' + ready.total + ' games mastered · ⭐⭐⭐ needed</div>' +
          '<div style="text-align:left;margin-bottom:20px">' + rows + '</div>' +
          '<div style="font-size:12px;color:rgba(255,255,255,.55);line-height:1.6;margin-bottom:18px">Earn 3 stars in all ' + ready.total + ' ' + cfg.hubLabel + ' games to face <strong style="color:' + cfg.accent + '">' + cfg.boss + '</strong> for the full 900-coin flagship reward and the <strong style="color:' + GOLD + '">' + cfg.badge + '</strong> badge.</div>' +
          '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
            '<button class="cap-btn ghost" data-act="exit">← BACK</button>' +
            '<button class="cap-btn" data-act="practice">⚡ PRACTICE ANYWAY</button>' +
          '</div>' +
          '<div style="font-size:10.5px;color:rgba(255,255,255,.4);margin-top:10px;letter-spacing:.5px">Practice run pays half coins · no badge</div>' +
        '</div>' +
      '</div></div>';
  }
  function initLock(k) {
    var root = el('cap_root');
    if (!root) return;
    root.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'exit') window.cvCapstoneExit();
      else if (act === 'practice') window.cvCapstonePractice(k);
    });
  }

  /* ══ GAME SHELL ══════════════════════════════════════════════ */
  function gameHTML(k, practice) {
    var cfg = HUBS[k], rgb = hexRGB(cfg.accent);
    return '<div id="cap_root" style="--capa:' + rgb + ';position:absolute;inset:0;background:' + BG + ';overflow:hidden;font-family:Inter,sans-serif;color:#fff">' +
      '<canvas id="cap_bg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>' +

      /* top bar */
      '<div style="position:absolute;top:0;left:0;right:0;z-index:30;display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(to bottom,rgba(3,4,12,.95),rgba(3,4,12,.65));border-bottom:1px solid rgba(' + rgb + ',.4);backdrop-filter:blur(8px)">' +
        '<button data-act="exit" style="background:rgba(' + rgb + ',.15);border:1px solid rgba(' + rgb + ',.6);color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:13px;font-family:Inter,sans-serif;flex-shrink:0">← Hub</button>' +
        '<div style="flex:1;text-align:center;min-width:0">' +
          '<div style="font-family:Orbitron,monospace;font-size:12.5px;font-weight:800;color:' + cfg.accent + ';letter-spacing:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + cfg.icon + ' ' + cfg.title + '</div>' +
          '<div id="cap_phase" style="font-size:9.5px;color:rgba(255,255,255,.5);letter-spacing:2px;margin-top:1px">GET READY</div>' +
        '</div>' +
        '<div style="display:flex;gap:12px;align-items:center;flex-shrink:0">' +
          '<div style="text-align:right"><div style="font-size:8.5px;color:rgba(255,255,255,.5);letter-spacing:1px">SCORE</div>' +
            '<div id="cap_score" style="font-family:Orbitron,monospace;font-size:15px;font-weight:800;color:' + GOLD + '">0</div></div>' +
          '<div style="text-align:right"><div style="font-size:8.5px;color:rgba(255,255,255,.5);letter-spacing:1px">TIME</div>' +
            '<div id="cap_timer" style="font-family:Orbitron,monospace;font-size:15px;font-weight:800;color:#fff">--</div></div>' +
        '</div>' +
      '</div>' +

      /* hud strip */
      '<div style="position:absolute;top:56px;left:0;right:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:6px 16px;background:rgba(3,4,12,.75);border-bottom:1px solid rgba(' + rgb + ',.22)">' +
        '<div style="display:flex;align-items:center;gap:6px"><span style="font-size:14px">🔥</span>' +
          '<span style="font-size:9px;color:rgba(255,255,255,.5);letter-spacing:1px">STREAK</span>' +
          '<span id="cap_streak" style="font-family:Orbitron,monospace;font-size:13px;font-weight:700;color:' + GOLD + '">0</span></div>' +
        (practice ? '<div style="font-family:Orbitron,monospace;font-size:9px;letter-spacing:1.5px;color:' + GOLD + ';background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.45);border-radius:999px;padding:3px 10px">⚡ PRACTICE · ½ COINS · NO BADGE</div>' : '') +
        '<div style="display:flex;align-items:center;gap:6px"><span style="font-size:14px">🎯</span>' +
          '<span style="font-size:9px;color:rgba(255,255,255,.5);letter-spacing:1px">ACCURACY</span>' +
          '<span id="cap_acc" style="font-family:Orbitron,monospace;font-size:13px;font-weight:700;color:#fff">—</span></div>' +
      '</div>' +

      /* arena */
      '<div id="cap_arena" style="position:absolute;top:96px;left:0;right:0;bottom:0;overflow-y:auto;padding:16px 16px 30px;display:flex;flex-direction:column;align-items:center;z-index:10"></div>' +

      /* phase splash */
      '<div id="cap_splash" style="display:none;position:absolute;inset:0;z-index:80;background:rgba(3,4,12,.82);backdrop-filter:blur(6px);align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:24px;pointer-events:none">' +
        '<div id="cap_splash_t" style="font-family:Orbitron,monospace;font-size:30px;font-weight:900;letter-spacing:5px;color:' + cfg.accent + ';text-shadow:0 0 30px rgba(' + rgb + ',.8)"></div>' +
        '<div id="cap_splash_s" style="font-family:Orbitron,monospace;font-size:12px;letter-spacing:2.5px;color:rgba(255,255,255,.75);margin-top:12px"></div>' +
      '</div>' +

      /* intro overlay */
      '<div id="cap_intro" style="position:absolute;inset:0;z-index:90;background:rgba(3,4,12,.86);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:24px;overflow-y:auto">' +
        '<div class="cap-anim" style="max-width:440px">' +
          '<div style="font-size:60px;animation:capFloat 3s ease-in-out infinite">' + cfg.bossIcon + '</div>' +
          '<div style="font-family:Orbitron,monospace;font-size:11px;letter-spacing:3px;color:' + RED + ';margin-top:8px">⚠ FINAL BOSS DETECTED</div>' +
          '<div style="font-family:Orbitron,monospace;font-size:24px;font-weight:900;letter-spacing:2px;color:#fff;margin:6px 0 12px">' + cfg.boss.toUpperCase() + '</div>' +
          '<div style="font-size:13px;line-height:1.7;color:rgba(255,255,255,.78);background:rgba(' + rgb + ',.1);border:1px solid rgba(' + rgb + ',.45);border-radius:14px;padding:14px 18px;font-style:italic">“' + cfg.bossLine + '”</div>' +
          '<div style="display:flex;gap:8px;justify-content:center;margin:18px 0;flex-wrap:wrap">' +
            '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(' + rgb + ',.35);border-radius:10px;padding:8px 12px;font-size:10.5px;letter-spacing:1px"><b style="color:' + cfg.accent + '">1</b> RAPID FIRE<br><span style="opacity:.55">8 questions · 10s</span></div>' +
            '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(' + rgb + ',.35);border-radius:10px;padding:8px 12px;font-size:10.5px;letter-spacing:1px"><b style="color:' + cfg.accent + '">2</b> DECISION STORM<br><span style="opacity:.55">5 scenarios · 12s</span></div>' +
            '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(' + rgb + ',.35);border-radius:10px;padding:8px 12px;font-size:10.5px;letter-spacing:1px"><b style="color:' + cfg.accent + '">3</b> BOSS METER<br><span style="opacity:.55">drain HP · 60s</span></div>' +
          '</div>' +
          '<button class="cap-btn" data-act="begin" style="font-size:15px;padding:15px 44px">⚔ BEGIN CHALLENGE</button>' +
        '</div>' +
      '</div>' +

      /* end overlay */
      '<div id="cap_end" style="display:none;position:absolute;inset:0;z-index:100;background:rgba(3,4,12,.93);backdrop-filter:blur(10px);align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:24px;overflow-y:auto"></div>' +
    '</div>';
  }

  /* ══ INIT ════════════════════════════════════════════════════ */
  function initGame(k, practice) {
    var cfg = HUBS[k];
    var root = el('cap_root');
    if (!root) return;
    G = {
      hub: k, cfg: cfg, practice: !!practice,
      phase: 0, score: 0, streak: 0, bestStreak: 0,
      correct: 0, answered: 0, lock: false, over: false, won: false,
      rapidQs: shuffle(cfg.rapid.slice()).slice(0, RAPID_N), rapidIdx: 0,
      stormIdx: 0, cq: null,
      bossHP: BOSS_HP, bossLeft: BOSS_TIME, bossQueue: [], bossTick: null,
      qTimer: null, qLeft: 0, raf: null, warp: false, stars: []
    };
    root.addEventListener('click', onClick);
    startStars(root);
  }

  function onClick(e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b || !G) return;
    var act = b.getAttribute('data-act');
    if (act === 'exit') window.cvCapstoneExit();
    else if (act === 'begin') { var iv = el('cap_intro'); if (iv) iv.style.display = 'none'; startRapid(); }
    else if (act === 'opt') answer(parseInt(b.getAttribute('data-i'), 10));
    else if (act === 'replay') goTo(G.cfg.screen);
  }

  /* ══ STARFIELD ═══════════════════════════════════════════════ */
  function startStars(root) {
    var cv = el('cap_bg');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = cv.width = root.clientWidth || 400;
    var H = cv.height = root.clientHeight || 700;
    var rgb = hexRGB(G.cfg.accent);
    for (var i = 0; i < 70; i++) {
      G.stars.push({ x: Math.random() * W, y: Math.random() * H, z: .3 + Math.random() * .9, tw: Math.random() * 6.28 });
    }
    function frame(t) {
      if (!G || !el('cap_bg')) return;          // screen left — stop
      W = cv.width; H = cv.height;
      ctx.clearRect(0, 0, W, H);
      var speed = G.warp ? 4.5 : .55;
      for (var i = 0; i < G.stars.length; i++) {
        var s = G.stars[i];
        s.y += s.z * speed;
        if (s.y > H + 4) { s.y = -4; s.x = Math.random() * W; }
        var a = .35 + .5 * Math.abs(Math.sin(t / 700 + s.tw));
        ctx.fillStyle = (i % 4 === 0) ? 'rgba(' + rgb + ',' + a + ')' : 'rgba(255,255,255,' + (a * .8) + ')';
        if (G.warp) {
          ctx.fillRect(s.x, s.y, 1.4, 4 + s.z * 9);
        } else {
          ctx.beginPath(); ctx.arc(s.x, s.y, s.z * 1.3, 0, 6.29); ctx.fill();
        }
      }
      G.raf = requestAnimationFrame(frame);
    }
    G.raf = requestAnimationFrame(frame);
  }

  /* ══ SHARED UI BITS ══════════════════════════════════════════ */
  function setPhase(t) { var p = el('cap_phase'); if (p) p.textContent = t; }
  function updHUD() {
    if (!G) return;
    var s = el('cap_score'), st = el('cap_streak'), ac = el('cap_acc');
    if (s)  s.textContent = G.score.toLocaleString();
    if (st) st.textContent = G.streak;
    if (ac) ac.textContent = G.answered ? Math.round(100 * G.correct / G.answered) + '%' : '—';
  }
  function setTimerLabel(txt, danger) {
    var t = el('cap_timer');
    if (t) { t.textContent = txt; t.style.color = danger ? RED : '#fff'; }
  }
  function showSplash(t, s, cb) {
    var sp = el('cap_splash');
    if (!sp) { cb(); return; }
    el('cap_splash_t').textContent = t;
    el('cap_splash_s').textContent = s;
    sp.style.display = 'flex';
    setTimeout(function () {
      if (el('cap_splash')) el('cap_splash').style.display = 'none';
      cb();
    }, 1250);
  }
  function optsHTML(opts) {
    var h = '';
    for (var i = 0; i < opts.length; i++) {
      h += '<button class="cap-opt" data-act="opt" data-i="' + i + '"><span style="font-family:Orbitron,monospace;font-size:11px;color:rgb(var(--capa));margin-right:9px">' + String.fromCharCode(65 + i) + '</span>' + esc(opts[i]) + '</button>';
    }
    return h;
  }
  function qTimerBar(secs) {
    return '<div style="height:5px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden;margin:12px 0 4px">' +
      '<div id="cap_qbar" style="height:100%;width:100%;border-radius:3px;background:linear-gradient(90deg,rgb(var(--capa)),' + GOLD + ');transition:width .1s linear"></div></div>';
  }
  function startQTimer(secs, onExpire) {
    G.qLeft = secs;
    setTimerLabel(secs + 's', false);
    if (G.qTimer) clearInterval(G.qTimer);
    G.qTimer = setInterval(function () {
      if (!G || !el('cap_root')) { clearInterval(G && G.qTimer); return; }
      G.qLeft = Math.max(0, G.qLeft - 0.1);
      var bar = el('cap_qbar');
      if (bar) bar.style.width = (100 * G.qLeft / secs) + '%';
      setTimerLabel(Math.ceil(G.qLeft) + 's', G.qLeft <= 3);
      if (G.qLeft <= 0) { clearInterval(G.qTimer); G.qTimer = null; onExpire(); }
    }, 100);
  }
  function stopQTimer() { if (G && G.qTimer) { clearInterval(G.qTimer); G.qTimer = null; } }
  function feedback(txt, color) {
    var ar = el('cap_arena');
    if (!ar) return;
    var f = document.createElement('div');
    f.style.cssText = 'position:absolute;top:38%;left:50%;transform:translateX(-50%);z-index:60;font-family:Orbitron,monospace;font-size:24px;font-weight:900;color:' + color + ';text-shadow:0 0 22px ' + color + ';pointer-events:none;animation:capPop .3s ease both';
    f.textContent = txt;
    el('cap_root').appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 850);
  }
  function markOptions(picked, right) {
    var ops = document.querySelectorAll('#cap_arena .cap-opt');
    for (var i = 0; i < ops.length; i++) {
      ops[i].setAttribute('disabled', '1');
      var idx = parseInt(ops[i].getAttribute('data-i'), 10);
      if (idx === right) ops[i].classList.add('good');
      else if (idx === picked) ops[i].classList.add('bad');
      else ops[i].classList.add('dim');
    }
  }

  /* ══ PHASE 1 — RAPID FIRE ════════════════════════════════════ */
  function startRapid() {
    G.phase = 1;
    setPhase('PHASE 1 / 3 — RAPID FIRE');
    showSplash('RAPID FIRE', RAPID_N + ' QUESTIONS · ' + RAPID_TIME + 'S EACH · STREAK BONUS', nextRapid);
  }
  function nextRapid() {
    if (!G || G.over) return;
    if (G.rapidIdx >= G.rapidQs.length) { startStorm(); return; }
    G.cq = G.rapidQs[G.rapidIdx];
    G.lock = false;
    var ar = el('cap_arena');
    if (!ar) return;
    ar.innerHTML = '<div class="cap-anim" style="width:100%;max-width:480px">' +
      '<div style="font-family:Orbitron,monospace;font-size:10px;letter-spacing:2.5px;color:rgb(var(--capa));margin-bottom:8px">⚡ QUESTION ' + (G.rapidIdx + 1) + ' / ' + G.rapidQs.length + '</div>' +
      '<div style="font-size:16.5px;font-weight:700;line-height:1.5;margin-bottom:6px">' + esc(G.cq.t) + '</div>' +
      qTimerBar(RAPID_TIME) + optsHTML(G.cq.o) + '</div>';
    startQTimer(RAPID_TIME, function () { answer(-1); });
  }

  /* ══ PHASE 2 — DECISION STORM ════════════════════════════════ */
  function startStorm() {
    G.phase = 2;
    G.stormIdx = 0;
    setPhase('PHASE 2 / 3 — DECISION STORM');
    showSplash('DECISION STORM', '5 SCENARIOS · PICK THE BEST CALL · 12S', nextStorm);
  }
  function nextStorm() {
    if (!G || G.over) return;
    if (G.stormIdx >= G.cfg.storm.length) { startBoss(); return; }
    G.cq = G.cfg.storm[G.stormIdx];
    G.lock = false;
    var ar = el('cap_arena');
    if (!ar) return;
    ar.innerHTML = '<div class="cap-anim" style="width:100%;max-width:480px">' +
      '<div style="font-family:Orbitron,monospace;font-size:10px;letter-spacing:2.5px;color:rgb(var(--capa));margin-bottom:8px">🌪 SCENARIO ' + (G.stormIdx + 1) + ' / ' + G.cfg.storm.length + '</div>' +
      '<div style="background:rgba(var(--capa),.09);border:1px solid rgba(var(--capa),.4);border-radius:14px;padding:14px 16px;font-size:14.5px;line-height:1.6;margin-bottom:4px">' + esc(G.cq.t) + '</div>' +
      qTimerBar(STORM_TIME) +
      '<div id="cap_why" style="min-height:20px;font-size:12px;color:' + GREEN + ';margin:2px 0 4px;font-style:italic"></div>' +
      optsHTML(G.cq.o) + '</div>';
    startQTimer(STORM_TIME, function () { answer(-1); });
  }

  /* ══ PHASE 3 — BOSS METER ════════════════════════════════════ */
  function startBoss() {
    G.phase = 3;
    G.warp = true;
    setPhase('PHASE 3 / 3 — BOSS METER');
    G.bossQueue = shuffle(G.cfg.bossQs.slice());
    showSplash(G.cfg.boss.toUpperCase(), 'DRAIN THE HP BAR BEFORE ' + BOSS_TIME + 'S RUNS OUT!', function () {
      renderBossFrame();
      nextBossQ();
      G.bossTick = setInterval(function () {
        if (!G || !el('cap_root')) { clearInterval(G && G.bossTick); return; }
        G.bossLeft--;
        setTimerLabel(G.bossLeft + 's', G.bossLeft <= 10);
        var bt = el('cap_bosstime');
        if (bt) bt.style.width = (100 * G.bossLeft / BOSS_TIME) + '%';
        if (G.bossLeft <= 0) { clearInterval(G.bossTick); G.bossTick = null; finish(false); }
      }, 1000);
    });
  }
  function renderBossFrame() {
    var ar = el('cap_arena');
    if (!ar) return;
    ar.innerHTML = '<div class="cap-anim" style="width:100%;max-width:480px">' +
      '<div style="display:flex;align-items:center;gap:14px;background:rgba(239,68,68,.08);border:1.5px solid rgba(239,68,68,.5);border-radius:16px;padding:12px 16px;margin-bottom:6px">' +
        '<div id="cap_bossface" style="font-size:44px;line-height:1;animation:capFloat 2.6s ease-in-out infinite">' + G.cfg.bossIcon + '</div>' +
        '<div style="flex:1">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
            '<span style="font-family:Orbitron,monospace;font-size:12px;font-weight:800;letter-spacing:1.5px;color:#fff">' + G.cfg.boss.toUpperCase() + '</span>' +
            '<span id="cap_hptxt" style="font-family:Orbitron,monospace;font-size:12px;font-weight:800;color:' + RED + '">' + G.bossHP + ' HP</span></div>' +
          '<div style="height:14px;border-radius:7px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:6px;border:1px solid rgba(239,68,68,.4)">' +
            '<div id="cap_hpbar" style="height:100%;width:100%;background:linear-gradient(90deg,#7f1d1d,' + RED + ');transition:width .35s ease;border-radius:7px"></div></div>' +
          '<div style="height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:5px">' +
            '<div id="cap_bosstime" style="height:100%;width:100%;background:' + GOLD + ';transition:width 1s linear"></div></div>' +
        '</div></div>' +
      '<div style="font-size:10.5px;letter-spacing:1px;color:rgba(255,255,255,.45);text-align:center;margin-bottom:8px">CORRECT = DAMAGE ⚔ &nbsp;·&nbsp; MISS = BOSS HEALS +' + HEAL_WRONG + ' ❤</div>' +
      '<div id="cap_bossq"></div></div>';
  }
  function nextBossQ() {
    if (!G || G.over) return;
    if (!G.bossQueue.length) G.bossQueue = shuffle(G.cfg.bossQs.slice());
    G.cq = G.bossQueue.shift();
    G.lock = false;
    var bq = el('cap_bossq');
    if (!bq) return;
    bq.innerHTML = '<div class="cap-anim">' +
      '<div style="font-size:16px;font-weight:700;line-height:1.5;margin-bottom:4px">' + esc(G.cq.t) + '</div>' +
      optsHTML(G.cq.o) + '</div>';
  }
  function bossHit(correct) {
    var face = el('cap_bossface'), bar = el('cap_hpbar'), txt = el('cap_hptxt');
    if (correct) {
      var dmg = DMG_BASE + DMG_STREAK * Math.min(5, G.streak);
      G.bossHP = Math.max(0, G.bossHP - dmg);
      feedback('-' + dmg + ' HP', G.cfg.accent);
      if (face) { face.style.animation = 'capShake .4s ease'; setTimeout(function () { if (face) face.style.animation = 'capFloat 2.6s ease-in-out infinite'; }, 420); }
    } else {
      G.bossHP = Math.min(BOSS_HP, G.bossHP + HEAL_WRONG);
      feedback('+' + HEAL_WRONG + ' HP', RED);
    }
    if (bar) bar.style.width = (100 * G.bossHP / BOSS_HP) + '%';
    if (txt) txt.textContent = G.bossHP + ' HP';
    if (G.bossHP <= 0) { setTimeout(function () { finish(true); }, 500); return true; }
    return false;
  }

  /* ══ ANSWER HANDLING (all phases) ════════════════════════════ */
  function answer(i) {
    if (!G || G.lock || G.over || !G.cq) return;
    G.lock = true;
    stopQTimer();
    var right = G.cq.a;
    var correct = (i === right);
    markOptions(i, right);
    G.answered++;
    if (correct) {
      G.correct++;
      G.streak++;
      if (G.streak > G.bestStreak) G.bestStreak = G.streak;
      var pts = (G.phase === 2 ? 200 : G.phase === 3 ? 50 : 100) + Math.min(100, (G.streak - 1) * 20);
      G.score += pts;
      if (G.phase !== 3) feedback('+' + pts + (G.streak >= 3 ? ' 🔥x' + G.streak : ''), GREEN);
    } else {
      G.streak = 0;
      if (G.phase !== 3) feedback(i < 0 ? 'TIME UP!' : 'NICE TRY!', RED);
    }
    if (G.phase === 2) {
      var why = el('cap_why');
      if (why) {
        why.textContent = '💡 ' + G.cq.why;
        why.style.color = correct ? GREEN : '#fca5a5';
      }
    }
    updHUD();
    var ended = false;
    if (G.phase === 3) ended = bossHit(correct);
    if (ended) return;
    var delay = G.phase === 2 ? 1500 : G.phase === 3 ? 650 : 900;
    setTimeout(function () {
      if (!G || G.over) return;
      if (G.phase === 1)      { G.rapidIdx++; nextRapid(); }
      else if (G.phase === 2) { G.stormIdx++; nextStorm(); }
      else                    { nextBossQ(); }
    }, delay);
  }

  /* ══ END GAME ════════════════════════════════════════════════ */
  function finish(won) {
    if (!G || G.over) return;
    G.over = true;
    G.won = won;
    G.warp = false;
    stopQTimer();
    if (G.bossTick) { clearInterval(G.bossTick); G.bossTick = null; }

    var cfg = G.cfg;
    var acc = G.answered ? G.correct / G.answered : 0;
    var stars = won ? (acc >= 0.8 ? 3 : 2) : (acc >= 0.5 ? 1 : 0);
    var perfect = won && G.correct === G.answered;

    /* rewards */
    var coins = 0, gotBadge = false;
    if (stars >= 1 && window.cvAwardGame) {
      var opts = { isFlagship: true, level: 3, stars: stars, is3star: stars === 3, isPerfect: perfect };
      if (!G.practice && stars === 3) { opts.badge = cfg.badge; gotBadge = true; }
      coins = cvAwardGame(cfg.screen, opts);
      if (G.practice) {
        var half = Math.floor(coins / 2);
        if (window.state) state.coins = (state.coins || 0) - (coins - half);
        if (window.cvSave) cvSave();
        coins = half;
      }
    } else if (window.cvSave) { cvSave(); }
    if (won && window.cvHubMeter) cvHubMeter(G.hub + '_capstone', 100);

    /* end screen */
    var rgb = hexRGB(cfg.accent);
    var endEl = el('cap_end');
    if (!endEl) return;
    var title, tcolor, line;
    if (stars === 3)      { title = 'LEGENDARY VICTORY!'; tcolor = GOLD; line = cfg.boss + ' has been vaporized. Total mastery.'; }
    else if (stars === 2) { title = 'VICTORY!'; tcolor = cfg.accent; line = cfg.boss + ' is down! Hit 80%+ accuracy for 3 stars.'; }
    else if (stars === 1) { title = 'SO CLOSE…'; tcolor = '#f97316'; line = cfg.boss + ' survived the timer — but your knowledge held strong. Run it back!'; }
    else                  { title = 'DEFEATED'; tcolor = RED; line = cfg.boss + ' wins this round. Sharpen up in the ' + cfg.hubLabel + ' games and return!'; }
    var starStr = '⭐'.repeat(stars) + '<span style="opacity:.25">' + '⭐'.repeat(3 - stars) + '</span>';

    endEl.innerHTML = '<div class="cap-anim" style="max-width:440px">' +
      '<div style="font-size:52px">' + (won ? '🏆' : cfg.bossIcon) + '</div>' +
      '<div style="font-family:Orbitron,monospace;font-size:23px;font-weight:900;letter-spacing:2.5px;color:' + tcolor + ';margin:10px 0 4px">' + title + '</div>' +
      '<div style="font-size:12.5px;color:rgba(255,255,255,.65);margin-bottom:12px">' + line + '</div>' +
      '<div style="font-size:40px;letter-spacing:8px;margin:8px 0;animation:capPop .5s ease both">' + starStr + '</div>' +
      (coins > 0 ? '<div style="font-family:Orbitron,monospace;font-size:19px;font-weight:800;color:' + GOLD + ';margin:4px 0">+' + coins + ' COINS' + (G.practice ? ' <span style="font-size:10px;letter-spacing:1px;opacity:.7">(PRACTICE ½)</span>' : '') + '</div>' : '') +
      (gotBadge ? '<div style="display:inline-block;background:rgba(251,191,36,.12);border:1.5px solid ' + GOLD + ';border-radius:999px;padding:8px 20px;margin:8px 0;font-family:Orbitron,monospace;font-size:12px;letter-spacing:1.5px;color:' + GOLD + '">🏅 ' + cfg.badge.toUpperCase() + '</div>' : '') +
      '<div style="display:flex;gap:18px;justify-content:center;margin:14px 0 20px;font-size:11px;color:rgba(255,255,255,.6)">' +
        '<div><div style="font-family:Orbitron,monospace;font-size:16px;color:#fff">' + Math.round(acc * 100) + '%</div>ACCURACY</div>' +
        '<div><div style="font-family:Orbitron,monospace;font-size:16px;color:#fff">' + G.score.toLocaleString() + '</div>SCORE</div>' +
        '<div><div style="font-family:Orbitron,monospace;font-size:16px;color:#fff">🔥' + G.bestStreak + '</div>BEST STREAK</div>' +
      '</div>' +
      (G.practice && won ? '<div style="font-size:11.5px;color:rgba(255,255,255,.5);margin-bottom:14px">Master all 7 hub games with ⭐⭐⭐, then defeat ' + cfg.boss + ' again for the full reward + badge.</div>' : '') +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
        '<button class="cap-btn" data-act="replay">↻ PLAY AGAIN</button>' +
        '<button class="cap-btn ghost" data-act="exit">← HUB</button>' +
      '</div></div>';
    endEl.style.display = 'flex';
  }

})();
