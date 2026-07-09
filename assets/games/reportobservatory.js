/* ════════════════════════════════════════════════════════════════
   G7 REPORT OBSERVATORY — CredTech Galaxy mini-game
   Spot-the-Difference / Error-Finding mechanic.
   Concept: "Read reports & fix errors"
   3 LEVELS · disjoint report scenarios · 6→7→8 hidden errors, less time, subtler bugs
   ════════════════════════════════════════════════════════════════ */
(function(){
  let G = null;
  let curLevel = 1;   // 1|2|3 — chosen on hub entry, advances via end-screen "NEXT LEVEL"

  /* ─── LEVEL CONFIGS ───────────────────────────────────────────── */
  const LEVELS = [
    { n:1, name:'CADET REVIEW',     time:90, reportId:'GCB-88142-X', reportDate:'06/30/2026', star3:6, star2:4 },
    { n:2, name:'AGENT REVIEW',     time:85, reportId:'GCB-91765-Y', reportDate:'07/14/2026', star3:7, star2:5 },
    { n:3, name:'COMMANDER REVIEW', time:80, reportId:'GCB-94420-Z', reportDate:'08/02/2026', star3:8, star2:6 },
  ];

  /* ─── REPORT CONTENT — DISJOINT per level, harder/subtler each level ──
     Every row is either {id, clean:true, ...display} or {id, error:true, hint, ...display}.
     personalError (when present) marks the Personal Information block itself as the error. */

  // LEVEL 1 · the basics (6 errors) — familiar, obvious mistakes
  const REPORT_L1 = {
    personal: { name:'JAYDEN W.', addr:'123 Galaxy Way, Star City, SC 77401', dob:'01/15/2000', ssn:'••••-••••-3821' },
    summary: { fico:720, ficoLabel:'GOOD', payHist:'GOOD', util:'30%', utilSub:'Keep below 30%', openAccts:5 },
    accounts: [
      { id:'galaxy_card', clean:true, name:'💳 Galaxy Card', chip:'CURRENT', chipCls:'ok', limit:1000, bal:200, utilPct:'20%', utilCol:'#15803d' },
      { id:'nebula_card', clean:true, name:'💳 Nebula Card', chip:'CURRENT', chipCls:'ok', limit:2500, bal:1250, utilPct:'50%', utilCol:'#b45309' },
      { id:'star_card_a', clean:true, name:'💳 Star Card', chip:'MAXED', chipCls:'warn', limit:500, bal:500, utilPct:'100%', utilCol:'#dc2626' },
      { id:'unknown_account', error:true, name:'💳 Unknown Lender', chip:'DELINQUENT', chipCls:'bad', limit:300, bal:300, utilPct:'100%', utilCol:'#dc2626',
        hint:'Unknown accounts may signal identity theft or a reporting mistake.' },
      { id:'wrong_balance', error:true, name:'💳 Nebula Card', chip:'DELINQUENT', chipCls:'bad', limit:2500, bal:2450, utilPct:'98%', utilCol:'#dc2626',
        hint:'Incorrect balances affect your utilization ratio and credit score.' },
      { id:'duplicate_account', error:true, name:'💳 Star Card', chip:'MAXED', chipCls:'warn', limit:500, bal:500, utilPct:'100%', utilCol:'#dc2626',
        hint:'Duplicate accounts inflate your debt load — always dispute them.' },
    ],
    payments: [
      { id:'pay_galaxy', clean:true, name:'Galaxy Card', dots:'✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅' },
      { id:'pay_nebula', clean:true, name:'Nebula Card', dots:'✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅⚠✅✅✅✅' },
      { id:'pay_star', clean:true, name:'Star Card', dots:'✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅' },
      { id:'missed_bill', error:true, name:'MISSED BILL', dots:'❌ MISSED — $150 — 04/2025',
        hint:'Paid bills showing as missed is a common credit report error — dispute it!' },
    ],
    inquiries: [
      { id:'inq_bank', clean:true, name:'🏦 Bank of Star City', date:'05/12/2024', type:'Auto Loan' },
      { id:'inq_galactic', clean:true, name:'🌌 Galactic Finance', date:'04/22/2024', type:'Personal Loan' },
      { id:'unknown_inquiry', error:true, name:'❓ Unknown Lender', date:'03/10/2024', type:'Unknown',
        hint:'You have the right to dispute unauthorized hard inquiries on your report.' },
      { id:'inq_mega', clean:true, name:'🏪 Mega Store Card', date:'04/22/2024', type:'Retail Credit' },
    ],
    collections: [
      { id:'collection_active', error:true, name:'⚠ Premier Collections', detail:'Original creditor: Orbit Utility Co. — Opened: 08/2023', chip:'ACTIVE', amt:'$2,450',
        hint:'Collections you have paid must be marked PAID or removed — not stay ACTIVE.' },
    ],
  };

  // LEVEL 2 · subtler errors (7) — math, dates & status mismatches, not just "unknown" items
  const REPORT_L2 = {
    personal: { name:'MAYA R.', addr:'87 Comet Circle, Nova Heights, NV 55210', dob:'09/03/1999', ssn:'••••-••••-4417' },
    personalError: { id:'wrong_dob', hint:'This date of birth would make the account holder too young to have opened a loan years ago — check the DOB field.' },
    summary: { fico:695, ficoLabel:'GOOD', payHist:'FAIR', util:'46%', utilSub:'Keep below 30%', openAccts:4 },
    accounts: [
      { id:'comet_card', clean:true, name:'💳 Comet Card', chip:'CURRENT', chipCls:'ok', limit:1500, bal:450, utilPct:'30%', utilCol:'#15803d' },
      { id:'orbit_auto', clean:true, name:'🚗 Orbit Auto Loan', chip:'CURRENT', chipCls:'ok', limit:12000, bal:8100, utilPct:'68%', utilCol:'#b45309' },
      { id:'closed_still_open', error:true, name:'💳 Meteor Card', chip:'OPEN', chipCls:'ok', limit:800, bal:0, utilPct:'0%', utilCol:'#15803d',
        hint:'This account was closed last year — a closed account should never show as OPEN.' },
      { id:'limit_math_error', error:true, name:'💳 Asteroid Card', chip:'CURRENT', chipCls:'ok', limit:400, bal:520, utilPct:'20%', utilCol:'#15803d',
        hint:'Balance ($520) is higher than the limit ($400) — that is over 100% utilization, not 20%.' },
    ],
    payments: [
      { id:'pay_comet', clean:true, name:'Comet Card', dots:'✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅' },
      { id:'pay_orbit', clean:true, name:'Orbit Auto Loan', dots:'✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅' },
      { id:'payment_before_open', error:true, name:'Meteor Card', dots:'✅ Payment logged 02/2022 (account opened 06/2022)',
        hint:'A payment cannot happen before the account existed — that entry is a reporting error.' },
      { id:'current_chip_missed_history', error:true, name:'Asteroid Card', dots:'❌❌❌ 3 missed payments — but account still shows CURRENT above',
        hint:'An account with 3 missed payments in its history should not still be labeled CURRENT.' },
    ],
    inquiries: [
      { id:'inq_lunar', clean:true, name:'🌙 Lunar Credit Union', date:'02/18/2025', type:'Personal Loan' },
      { id:'future_dated_inquiry', error:true, name:'🛰️ Satellite Bank', date:'12/31/2026', type:'Credit Card',
        hint:'This inquiry is dated in the future — an impossible date is always a reporting error.' },
    ],
    collections: [
      { id:'wrong_creditor', error:true, name:'⚠ Halcyon Collections', detail:'Original creditor listed: Comet Card — but Comet Card is open & current above', chip:'ACTIVE', amt:'$310',
        hint:'The same account cannot be both open & current AND sent to collections — the original creditor listed here is wrong.' },
    ],
  };

  // LEVEL 3 · hardest (8) — identity/fraud patterns & compounding math errors across sections
  const REPORT_L3 = {
    personal: { name:'DEVON K.', addr:'450 Pulsar Ave, Quasar City, QC 90812', dob:'11/27/2001', ssn:'••••-••••-2298 / ••••-••••-7734' },
    personalError: { id:'two_ssns', hint:'Two different SSNs on one report is a strong identity-theft red flag — the SSN field itself is the error here.' },
    summary: { fico:610, ficoLabel:'FAIR', payHist:'FAIR', util:'38%', utilSub:'Keep below 30%', openAccts:6 },
    accounts: [
      { id:'nova_card', clean:true, name:'💳 Nova Card', chip:'CURRENT', chipCls:'ok', limit:2000, bal:600, utilPct:'30%', utilCol:'#15803d' },
      { id:'pulsar_loan', clean:true, name:'🎓 Pulsar Student Loan', chip:'CURRENT', chipCls:'ok', limit:15000, bal:9200, utilPct:'61%', utilCol:'#b45309' },
      { id:'negative_balance_delinquent', error:true, name:'💳 Quasar Card', chip:'DELINQUENT', chipCls:'bad', limit:1000, bal:-45, utilPct:'—', utilCol:'#dc2626',
        hint:'A negative balance means the lender owes YOU money — that cannot be marked DELINQUENT.' },
      { id:'identity_theft_account', error:true, name:'💳 Binary Bank Card', chip:'CURRENT', chipCls:'ok', limit:5000, bal:4800, utilPct:'96%', utilCol:'#dc2626',
        hint:'This exact lender also shows up below as a hard inquiry you never made — a classic identity-theft pattern.' },
      { id:'utilization_math_error', error:true, name:'💳 Eclipse Card', chip:'CURRENT', chipCls:'ok', limit:2000, bal:1800, utilPct:'40%', utilCol:'#b45309',
        hint:'$1,800 balance on a $2,000 limit is 90% utilization, not the 40% printed here.' },
    ],
    payments: [
      { id:'pay_nova', clean:true, name:'Nova Card', dots:'✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅' },
      { id:'pay_pulsar', clean:true, name:'Pulsar Loan', dots:'✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅' },
      { id:'too_many_months', error:true, name:'Binary Bank Card', dots:'24 months of history shown — but account opened only 5 months ago',
        hint:'An account open for 5 months cannot have 24 months of payment history — the dates do not add up.' },
    ],
    inquiries: [
      { id:'inq_cosmos', clean:true, name:'🌌 Cosmos Credit Union', date:'01/09/2025', type:'Auto Loan' },
      { id:'identity_theft_inquiry', error:true, name:'💳 Binary Bank Card', date:'03/02/2025', type:'Credit Card',
        hint:'Binary Bank Card already appears above as an open account you supposedly manage — you cannot also be newly applying for it.' },
      { id:'employer_mismatch_inquiry', error:true, name:'🏢 Stellar Staffing Co.', date:'05/20/2025', type:'Employment Check',
        hint:'This employer does not match any job history on file — an unrecognized employment inquiry should be disputed.' },
    ],
    collections: [
      { id:'fico_summary_mismatch', error:true, name:'⚠ Vortex Recovery Group', detail:'Reported utilization used for FICO calc: 75% — Credit Summary above shows 38%', chip:'ACTIVE', amt:'$1,120',
        hint:'The FICO summary utilization and this collection record utilization do not match — one of them is wrong.' },
    ],
  };

  const REPORTS = [REPORT_L1, REPORT_L2, REPORT_L3];

  // Flatten a report's error rows (incl. personalError) into one lookup, keyed by id → hint
  function buildErrorIndex(report){
    const idx = {};
    if (report.personalError) idx[report.personalError.id] = report.personalError.hint;
    for (const sec of ['accounts','payments','inquiries','collections']) {
      for (const row of report[sec]) if (row.error) idx[row.id] = row.hint;
    }
    return idx;
  }

  function totalErrorCount(report){ return Object.keys(buildErrorIndex(report)).length; }

  /* ─── STATE ─────────────────────────────────────────────────── */
  function newGame(level){
    const L = LEVELS[(level||curLevel)-1] || LEVELS[0];
    const report = REPORTS[L.n-1];
    return {
      phase: 'play',
      level: L.n,
      cfg: L,
      report: report,
      errorIdx: buildErrorIndex(report),
      goal: totalErrorCount(report),
      score: 0,
      timeLeft: L.time,
      errorsFound: 0,
      wrongTaps: 0,
      // track each error: found | penalized (clean item tapped)
      found: {},
      // penalty flash items {id, t}
      flashItems: {},
      last: 0,
      timerId: null,
    };
  }

  /* ─── SCREEN ────────────────────────────────────────────────── */
  window.SCREENS.game_reportobservatory = function(){
    G = null;
    curLevel = 1;   // fresh hub entry always starts the campaign at Level 1
    setTimeout(initGame, 40);
    return `<div id="roRoot" style="position:absolute;inset:0;background:#0d0920;overflow:hidden;font-family:'Inter',sans-serif;color:#fff;user-select:none;-webkit-user-select:none">

      <!-- Stars canvas background -->
      <canvas id="roStars" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.5"></canvas>

      <!-- TOP BAR -->
      <div style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;padding:12px 14px;gap:10px;background:linear-gradient(180deg,rgba(13,9,32,.98) 70%,transparent);flex-shrink:0">
        <button onclick="roExit()" style="padding:7px 13px;border:1px solid rgba(139,92,246,.4);border-radius:9px;background:rgba(139,92,246,.12);color:#a78bfa;font-family:'Orbitron',sans-serif;font-size:.52rem;letter-spacing:.14em;cursor:pointer;white-space:nowrap;flex-shrink:0">← HUB</button>
        <div id="roTitle" style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:#a78bfa;flex:1;text-align:center;text-shadow:0 0 16px rgba(139,92,246,.6)">REPORT OBSERVATORY · LV 1/3</div>
        <div style="display:flex;gap:10px;align-items:center;flex-shrink:0">
          <div id="roScore" style="font-family:'Orbitron',sans-serif;font-size:.75rem;color:#fbbf24;font-variant-numeric:tabular-nums;text-shadow:0 0 10px rgba(251,191,36,.4);min-width:52px;text-align:right">0</div>
          <div id="roTimer" style="font-family:'Orbitron',sans-serif;font-size:.75rem;color:#e2e8f0;font-variant-numeric:tabular-nums;min-width:36px;text-align:right">90s</div>
        </div>
      </div>

      <!-- PROGRESS BAR (errors found) -->
      <div style="position:absolute;top:52px;left:0;right:0;z-index:20;padding:0 14px 8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.14em;color:rgba(167,139,250,.7)">ERRORS FOUND</span>
          <span id="roErrorCounter" style="font-family:'Orbitron',sans-serif;font-size:.55rem;color:#a78bfa;font-variant-numeric:tabular-nums">0 / 6</span>
        </div>
        <div style="height:6px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden;border:1px solid rgba(139,92,246,.2)">
          <div id="roErrBar" style="height:100%;width:0%;border-radius:3px;background:linear-gradient(90deg,#8b5cf6,#a78bfa);transition:width .4s;box-shadow:0 0 8px rgba(139,92,246,.5)"></div>
        </div>
      </div>

      <!-- INSTRUCTION BANNER -->
      <div id="roInstr" style="position:absolute;top:92px;left:14px;right:14px;z-index:20;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);border-radius:10px;padding:7px 12px;font-size:.68rem;color:rgba(221,214,254,.9);text-align:center;letter-spacing:.02em">
        Tap items in the report that contain <strong style="color:#a78bfa">errors</strong>. Tap a clean item and lose 50 pts.
      </div>

      <!-- REPORT SCROLL AREA -->
      <div id="roScroll" style="position:absolute;top:140px;left:0;right:0;bottom:0;overflow-y:auto;-webkit-overflow-scrolling:touch;z-index:10;padding:12px 12px 32px">

        <!-- THE CREDIT REPORT DOCUMENT — filled by renderReport() per level, data-driven -->
        <div id="roDoc" style="background:#f5f4f0;border-radius:14px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.5),0 0 0 1px rgba(139,92,246,.25);color:#1a1625;font-family:'Inter',sans-serif"></div>
      </div>

      <!-- END OVERLAY -->
      <div id="roOver" style="position:absolute;inset:0;z-index:30;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(13,9,32,.94);backdrop-filter:blur(10px);gap:0;padding:24px;text-align:center"></div>

      <!-- STYLES -->
      <style>
        /* Section layout */
        .ro-section { border-bottom:1px solid #e5e0f5; }
        .ro-section:last-child { border-bottom:none; }
        .ro-section-head {
          background:#ece8f8;
          padding:9px 16px;
          font-family:'Orbitron',sans-serif;
          font-size:.48rem;
          letter-spacing:.18em;
          color:#4c1d95;
          border-bottom:1px solid #ddd6f5;
        }
        .ro-section-body { padding:10px 14px;display:flex;flex-direction:column;gap:6px; }
        .ro-section-body.clean:hover { box-shadow:inset 0 0 0 2px rgba(21,128,61,.25); }
        .ro-section-body.error-item { background:#fffbfb; }
        .ro-section-body.error-item:hover { box-shadow:inset 0 0 0 2px rgba(185,28,28,.18); }
        .ro-field-row { display:flex;gap:10px;align-items:baseline;padding:4px 0;border-bottom:1px solid #f0ecfc; }
        .ro-field-row:last-child { border-bottom:none; }
        .ro-field-label { font-size:.6rem;color:#6b7280;min-width:100px;flex-shrink:0;letter-spacing:.02em; }
        .ro-field-value { font-size:.7rem;color:#1f2937;font-weight:500; }

        /* Summary stat cards */
        .ro-stat-card { flex:1;min-width:70px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center; }
        .ro-stat-label { font-family:'Orbitron',sans-serif;font-size:.32rem;letter-spacing:.12em;color:#6b7280;margin-bottom:4px; }
        .ro-stat-val { font-family:'Orbitron',sans-serif;font-size:.9rem;font-weight:700;color:#1f2937;margin-bottom:2px; }
        .ro-stat-sub { font-size:.5rem;color:#9ca3af; }

        /* Account rows */
        .ro-account-row {
          padding:10px 12px;
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:8px;
          cursor:pointer;
          transition:box-shadow .15s, background .15s;
        }
        .ro-account-row:active { opacity:.85; }
        .ro-account-row.clean:hover { box-shadow:0 0 0 2px rgba(21,128,61,.25); }
        .ro-account-row.error-item { border-color:rgba(185,28,28,.2);background:#fffbfb; }
        .ro-account-row.error-item:hover { box-shadow:0 0 0 2px rgba(185,28,28,.18); }
        .ro-acc-name { font-size:.72rem;font-weight:600;color:#1f2937;margin-bottom:5px; }
        .ro-acc-details { display:flex;flex-wrap:wrap;gap:6px;align-items:center; }
        .ro-acc-meta { font-size:.6rem;color:#6b7280; }

        /* Status chips */
        .ro-acc-chip { font-family:'Orbitron',sans-serif;font-size:.32rem;letter-spacing:.1em;padding:2px 7px;border-radius:4px;font-weight:600; }
        .ro-acc-chip.ok   { background:#dcfce7;color:#15803d; }
        .ro-acc-chip.warn { background:#fef3c7;color:#b45309; }
        .ro-acc-chip.bad  { background:#fee2e2;color:#dc2626; }

        /* Payment history rows */
        .ro-pay-row {
          display:flex;align-items:center;gap:10px;
          padding:8px 12px;background:#fff;border:1px solid #e5e7eb;border-radius:7px;
          cursor:pointer;
        }
        .ro-pay-row.clean:hover { box-shadow:0 0 0 2px rgba(21,128,61,.25); }
        .ro-pay-row.error-item { border-color:rgba(185,28,28,.2);background:#fffbfb; }
        .ro-pay-row.error-item:hover { box-shadow:0 0 0 2px rgba(185,28,28,.18); }
        .ro-pay-name { font-size:.6rem;font-weight:600;color:#374151;min-width:75px;flex-shrink:0; }
        .ro-pay-dots { font-size:.55rem;letter-spacing:.01em;line-height:1.2;flex:1;overflow:hidden;text-overflow:ellipsis; }

        /* Inquiry rows */
        .ro-inq-row {
          display:flex;align-items:center;gap:8px;padding:8px 12px;
          background:#fff;border:1px solid #e5e7eb;border-radius:7px;cursor:pointer;
        }
        .ro-inq-row.clean:hover { box-shadow:0 0 0 2px rgba(21,128,61,.25); }
        .ro-inq-row.error-item { border-color:rgba(185,28,28,.2);background:#fffbfb; }
        .ro-inq-row.error-item:hover { box-shadow:0 0 0 2px rgba(185,28,28,.18); }
        .ro-inq-name { font-size:.66rem;font-weight:600;color:#1f2937;flex:1; }
        .ro-inq-date { font-size:.6rem;color:#6b7280;font-variant-numeric:tabular-nums; }
        .ro-inq-type { font-size:.56rem;color:#9ca3af;min-width:72px;text-align:right; }

        /* Collection rows */
        .ro-coll-row {
          padding:10px 12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;
        }
        .ro-coll-row.error-item { border-color:rgba(185,28,28,.2);background:#fffbfb; }
        .ro-coll-row.error-item:hover { box-shadow:0 0 0 2px rgba(185,28,28,.18); }
        .ro-coll-name { font-size:.7rem;font-weight:600;color:#374151;margin-bottom:3px; }
        .ro-coll-detail { font-size:.56rem;color:#9ca3af; }
        .ro-coll-amt { font-family:'Orbitron',sans-serif;font-size:.7rem;color:#dc2626;font-weight:700;margin-top:2px; }

        /* Error subtle visual hint (very faint, not a giveaway) */
        .ro-account-row.error-item::after,
        .ro-pay-row.error-item::after,
        .ro-inq-row.error-item::after,
        .ro-coll-row.error-item::after,
        .ro-section-body.error-item::after {
          content:'';
          display:inline-block;
          width:5px;height:5px;
          border-radius:50%;
          background:rgba(220,38,38,.25);
          float:right;
          margin-top:2px;
        }

        /* Found state */
        .ro-found {
          background:#dcfce7 !important;
          border-color:#86efac !important;
          pointer-events:none;
          opacity:.9;
        }

        /* Penalty flash */
        .ro-penalty { animation:roPenalty .5s ease forwards !important; }
        @keyframes roPenalty {
          0%   { background:#fef08a; }
          60%  { background:#fde047; }
          100% { background:#fff; }
        }

        /* Error found flash */
        .ro-flash-found { animation:roFlashFound .6s ease forwards !important; }
        @keyframes roFlashFound {
          0%   { background:#fca5a5; transform:scale(1.02); }
          40%  { background:#f87171; }
          80%  { background:#dcfce7; transform:scale(1); }
          100% { background:#dcfce7; }
        }

        /* Toast popup */
        #roToast {
          position:absolute;
          bottom:56px;
          left:50%;
          transform:translateX(-50%);
          z-index:50;
          pointer-events:none;
          font-family:'Orbitron',sans-serif;
          font-size:.65rem;
          letter-spacing:.1em;
          padding:8px 18px;
          border-radius:20px;
          white-space:nowrap;
          box-shadow:0 4px 16px rgba(0,0,0,.5);
          opacity:0;
          transition:opacity .25s;
        }
      </style>

      <!-- TOAST -->
      <div id="roToast"></div>

    </div>`;
  };

  /* ─── RENDER — build the roDoc innerHTML from the level's report data ─── */
  function fmtMoney(n){ return (n<0?'-$':'$') + Math.abs(n).toLocaleString(); }

  function renderReport(){
    const r = G.report, cfg = G.cfg, p = r.personal;
    const personalIsError = !!r.personalError;
    const personalId = personalIsError ? r.personalError.id : null;

    const accountsHTML = r.accounts.map(a => `
      <div class="ro-account-row ${a.error?'error-item':'clean'}" data-id="${a.id}" onclick="roTapItem('${a.id}',${!!a.error},this)">
        <div class="ro-acc-name">${a.name}</div>
        <div class="ro-acc-details">
          <span class="ro-acc-chip ${a.chipCls}">${a.chip}</span>
          <span class="ro-acc-meta">Limit <strong>${fmtMoney(a.limit)}</strong></span>
          <span class="ro-acc-meta">Balance <strong>${fmtMoney(a.bal)}</strong></span>
          <span class="ro-acc-meta" style="color:${a.utilCol}">${a.utilPct} util</span>
        </div>
      </div>`).join('');

    const paymentsHTML = r.payments.map(pm => `
      <div class="ro-pay-row ${pm.error?'error-item':'clean'}" data-id="${pm.id}" onclick="roTapItem('${pm.id}',${!!pm.error},this)">
        <div class="ro-pay-name">${pm.name}</div>
        <div class="ro-pay-dots" ${pm.error?'style="color:#dc2626;font-size:.65rem;font-weight:700"':''}>${pm.dots}</div>
      </div>`).join('');

    const inquiriesHTML = r.inquiries.map(iq => `
      <div class="ro-inq-row ${iq.error?'error-item':'clean'}" data-id="${iq.id}" onclick="roTapItem('${iq.id}',${!!iq.error},this)">
        <div class="ro-inq-name">${iq.name}</div>
        <div class="ro-inq-date">${iq.date}</div>
        <div class="ro-inq-type">${iq.type}</div>
      </div>`).join('');

    const collectionsHTML = r.collections.map(c => `
      <div class="ro-coll-row ${c.error?'error-item':'clean'}" data-id="${c.id}" onclick="roTapItem('${c.id}',${!!c.error},this)">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
          <div>
            <div class="ro-coll-name">${c.name}</div>
            <div class="ro-coll-detail">${c.detail}</div>
          </div>
          <div style="text-align:right">
            <span class="ro-acc-chip bad">${c.chip}</span>
            <div class="ro-coll-amt">${c.amt}</div>
          </div>
        </div>
      </div>`).join('') + `
      <div style="padding:10px 12px;background:rgba(15,118,110,.08);border:1px solid rgba(15,118,110,.2);border-radius:8px">
        <div style="font-size:.6rem;color:#374151">No other collection accounts on file.</div>
      </div>`;

    // Personal Information block — sometimes IS the error (two_ssns, wrong_dob, etc.)
    // Needs the same clean/error-item class as every other tappable row so roTapItem's
    // classList bookkeeping (remove 'error-item', add 'ro-found') behaves consistently.
    const personalBlock = personalIsError
      ? `<div class="ro-section-body error-item" data-id="${personalId}" onclick="roTapItem('${personalId}',true,this)" style="cursor:pointer">
          <div class="ro-field-row"><div class="ro-field-label">Full Name</div><div class="ro-field-value">${p.name}</div></div>
          <div class="ro-field-row"><div class="ro-field-label">Address</div><div class="ro-field-value">${p.addr}</div></div>
          <div class="ro-field-row"><div class="ro-field-label">Date of Birth</div><div class="ro-field-value">${p.dob}</div></div>
          <div class="ro-field-row"><div class="ro-field-label">SSN (last 4)</div><div class="ro-field-value">${p.ssn}</div></div>
        </div>`
      : `<div class="ro-section-body clean">
          <div class="ro-field-row"><div class="ro-field-label">Full Name</div><div class="ro-field-value">${p.name}</div></div>
          <div class="ro-field-row"><div class="ro-field-label">Address</div><div class="ro-field-value">${p.addr}</div></div>
          <div class="ro-field-row"><div class="ro-field-label">Date of Birth</div><div class="ro-field-value">${p.dob}</div></div>
          <div class="ro-field-row"><div class="ro-field-label">SSN (last 4)</div><div class="ro-field-value">${p.ssn}</div></div>
        </div>`;

    const doc = document.getElementById('roDoc');
    if(!doc) return;
    doc.innerHTML = `
      <!-- REPORT HEADER -->
      <div style="background:linear-gradient(135deg,#2d1b69,#1a0f3c);padding:18px 20px;color:#fff">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-family:'Orbitron',sans-serif;font-size:.85rem;letter-spacing:.18em;color:#a78bfa;margin-bottom:2px">GALAXY CREDIT BUREAU</div>
            <div style="font-size:.7rem;color:rgba(221,214,254,.7);letter-spacing:.06em">OFFICIAL CONSUMER CREDIT REPORT</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:.6rem;color:rgba(221,214,254,.6)">Report Date</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:.68rem;color:#e2d9f3">${cfg.reportDate}</div>
            <div style="font-size:.58rem;color:rgba(221,214,254,.4);margin-top:2px">Report #${cfg.reportId}</div>
          </div>
        </div>
      </div>

      <!-- SECTION: PERSONAL INFO -->
      <div class="ro-section">
        <div class="ro-section-head">PERSONAL INFORMATION${personalIsError?' ⚠':''}</div>
        ${personalBlock}
      </div>

      <!-- SECTION: CREDIT SUMMARY -->
      <div class="ro-section">
        <div class="ro-section-head">CREDIT SUMMARY</div>
        <div style="padding:14px 16px">
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <div class="ro-stat-card">
              <div class="ro-stat-label">FICO SCORE</div>
              <div class="ro-stat-val" style="color:#15803d;font-size:1.5rem">${r.summary.fico}</div>
              <div class="ro-stat-sub">${r.summary.ficoLabel}</div>
            </div>
            <div class="ro-stat-card">
              <div class="ro-stat-label">PAYMENT HISTORY</div>
              <div class="ro-stat-val" style="color:#15803d">${r.summary.payHist}</div>
              <div class="ro-stat-sub">35% of score</div>
            </div>
            <div class="ro-stat-card">
              <div class="ro-stat-label">UTILIZATION</div>
              <div class="ro-stat-val" style="color:#b45309">${r.summary.util}</div>
              <div class="ro-stat-sub">${r.summary.utilSub}</div>
            </div>
            <div class="ro-stat-card">
              <div class="ro-stat-label">OPEN ACCOUNTS</div>
              <div class="ro-stat-val">${r.summary.openAccts}</div>
              <div class="ro-stat-sub">Active</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION: ACCOUNTS -->
      <div class="ro-section">
        <div class="ro-section-head">OPEN ACCOUNTS</div>
        <div style="padding:10px 14px;display:flex;flex-direction:column;gap:8px">${accountsHTML}</div>
      </div>

      <!-- SECTION: PAYMENT HISTORY -->
      <div class="ro-section">
        <div class="ro-section-head">PAYMENT HISTORY</div>
        <div style="padding:10px 14px;display:flex;flex-direction:column;gap:6px">
          <div style="font-size:.62rem;color:#374151;margin-bottom:4px">Last 24 months — ✅ = On Time &nbsp;|&nbsp; ⚠ = Late &nbsp;|&nbsp; ❌ = Missed</div>
          ${paymentsHTML}
        </div>
      </div>

      <!-- SECTION: INQUIRIES -->
      <div class="ro-section">
        <div class="ro-section-head">HARD INQUIRIES</div>
        <div style="padding:10px 14px;display:flex;flex-direction:column;gap:6px">${inquiriesHTML}</div>
      </div>

      <!-- SECTION: COLLECTIONS -->
      <div class="ro-section" style="margin-bottom:0">
        <div class="ro-section-head">COLLECTIONS</div>
        <div style="padding:10px 14px;display:flex;flex-direction:column;gap:8px">${collectionsHTML}</div>
      </div>

      <!-- REPORT FOOTER -->
      <div style="padding:14px 20px;background:#f0eef8;border-top:1px solid #e0d9f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div style="font-size:.56rem;color:#6b7280">Dispute any errors at GalaxyCredit.com/dispute</div>
        <div style="font-size:.54rem;color:#9ca3af">© 2026 Galaxy Credit Bureau</div>
      </div>`;
  }

  /* ─── INIT ──────────────────────────────────────────────────── */
  function initGame(){
    const root = document.getElementById('roRoot');
    if(!root) return;
    G = newGame(curLevel);
    renderReport();
    const titleEl = document.getElementById('roTitle');
    if(titleEl) titleEl.textContent = `REPORT OBSERVATORY · LV ${curLevel}/3`;
    const ec = document.getElementById('roErrorCounter');
    if(ec) ec.textContent = `0 / ${G.goal}`;
    const tEl = document.getElementById('roTimer');
    if(tEl) tEl.textContent = G.timeLeft + 's';
    drawStars();
    G.timerId = setInterval(tick, 1000);
    G.last = performance.now();
  }

  /* ─── TICK (1s interval) ────────────────────────────────────── */
  function tick(){
    if(!G || G.phase !== 'play') return;
    G.timeLeft--;
    const el = document.getElementById('roTimer');
    if(el){
      el.textContent = G.timeLeft + 's';
      el.style.color = G.timeLeft <= 15 ? '#ef4444' : (G.timeLeft <= 30 ? '#fbbf24' : '#e2e8f0');
    }
    if(G.timeLeft <= 0) endGame();
  }

  /* ─── TAP HANDLER ───────────────────────────────────────────── */
  window.roTapItem = function(id, isError, el){
    if(!G || G.phase !== 'play') return;
    // Already found this error?
    if(G.found[id]) return;

    if(isError){
      G.found[id] = true;
      G.errorsFound++;
      G.score = Math.max(0, G.score + 150);

      el.classList.remove('error-item');
      el.classList.add('ro-flash-found','ro-found');

      // Append "found" badge
      const badge = document.createElement('div');
      badge.style.cssText = 'margin-top:6px;display:flex;align-items:center;gap:5px;font-size:.6rem;font-weight:600;color:#15803d;';
      const hintText = G.errorIdx[id];
      badge.innerHTML = '✅ <span>ERROR FOUND! +150 pts</span>';
      el.appendChild(badge);

      // Hint tooltip below badge
      if(hintText){
        const hint = document.createElement('div');
        hint.style.cssText = 'font-size:.56rem;color:#374151;margin-top:3px;line-height:1.4;font-style:italic;';
        hint.textContent = hintText;
        el.appendChild(hint);
      }

      showToast('ERROR FOUND! +150', '#34d399', '#052e16');
      updateUI();
      if(G.errorsFound >= G.goal){ G._endTimer = setTimeout(() => endGame(), 500); }
    } else {
      // Wrong tap — penalty
      G.wrongTaps++;
      G.score = Math.max(0, G.score - 50);
      el.classList.add('ro-penalty');
      setTimeout(() => el.classList.remove('ro-penalty'), 600);
      showToast('-50 PTS', '#ef4444', '#450a0a');
      updateUI();
      // Shake the score display
      const sd = document.getElementById('roScore');
      if(sd){ sd.style.animation='none'; void sd.offsetWidth; sd.style.animation='roShakeScore .3s ease'; }
    }
  };

  /* ─── UI UPDATE ─────────────────────────────────────────────── */
  function updateUI(){
    if(!G) return;
    const sc = document.getElementById('roScore');
    if(sc) sc.textContent = G.score;
    const ec = document.getElementById('roErrorCounter');
    if(ec) ec.textContent = G.errorsFound + ' / ' + G.goal;
    const eb = document.getElementById('roErrBar');
    if(eb) eb.style.width = (G.errorsFound / G.goal * 100) + '%';
  }

  /* ─── TOAST ─────────────────────────────────────────────────── */
  function showToast(msg, bg, fg){
    const t = document.getElementById('roToast');
    if(!t) return;
    t.textContent = msg;
    t.style.background = bg;
    t.style.color = fg || '#fff';
    t.style.opacity = '1';
    clearTimeout(t._tid);
    t._tid = setTimeout(() => { t.style.opacity = '0'; }, 1100);
  }

  /* ─── STAR CANVAS ───────────────────────────────────────────── */
  function drawStars(){
    const cv = document.getElementById('roStars');
    if(!cv) return;
    cv.width  = cv.clientWidth;
    cv.height = cv.clientHeight;
    const ctx = cv.getContext('2d');
    for(let i=0;i<120;i++){
      const x = Math.random()*cv.width;
      const y = Math.random()*cv.height;
      const r = Math.random()*1.2;
      const a = Math.random()*.7+.15;
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle = `rgba(221,214,254,${a})`;
      ctx.fill();
    }
  }

  /* ─── END GAME ──────────────────────────────────────────────── */
  function endGame(){
    if(!G || G.phase !== 'play') return;
    G.phase = 'over';
    clearInterval(G.timerId);

    const found = G.errorsFound;
    const goal = G.goal;
    const timeBonus = G.timeLeft > 0 ? Math.floor(G.timeLeft * 2) : 0;
    const totalScore = G.score + timeBonus;
    // Level-scoped star thresholds — same error COUNT means fewer stars on a harder level
    // (matches original leniency: any session, even 0 found, still awards at least 1 star)
    const stars = found >= G.cfg.star3 ? 3 : found >= G.cfg.star2 ? 2 : 1;
    const is3star = stars === 3;
    const showNext = stars >= 1 && curLevel < 3;
    const coins = window.cvAwardGame
      ? cvAwardGame('game_reportobservatory', { level: G.level, stars, is3star, isPerfect: found >= goal && G.wrongTaps === 0, badge: 'Fraud Hunter' })
      : (stars===3?150:stars===2?100:50);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('credtech_trust', stars*4);
    if (window.cvSave) cvSave();

    const over = document.getElementById('roOver');
    if(!over) return;

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const pctFull = Math.round(found / goal * 100);
    const headline = stars >= 1
      ? (curLevel >= 3 ? '👑 MISSION ACCOMPLISHED — ALL 3 LEVELS!' : `MISSION ACCOMPLISHED · LV ${curLevel}`)
      : 'NICE TRY! Power up and try again';

    over.innerHTML = `
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.3em;color:#a78bfa;margin-bottom:10px">${headline}</div>
      <div style="font-size:2.2rem;margin-bottom:6px;letter-spacing:.08em">${starStr}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:1.4rem;color:#fff;margin-bottom:2px;text-shadow:0 0 24px rgba(167,139,250,.7)">${found}/${goal} ERRORS</div>
      <div style="font-size:.68rem;color:rgba(221,214,254,.6);margin-bottom:14px">Found ${pctFull}% of report errors</div>

      <div style="display:flex;gap:16px;justify-content:center;margin-bottom:18px">
        <div style="text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.14em;color:rgba(167,139,250,.7);margin-bottom:3px">SCORE</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:1.1rem;color:#fbbf24">${totalScore}</div>
        </div>
        <div style="width:1px;background:rgba(255,255,255,.1)"></div>
        <div style="text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.14em;color:rgba(167,139,250,.7);margin-bottom:3px">TIME BONUS</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:1.1rem;color:#34d399">+${timeBonus}</div>
        </div>
        <div style="width:1px;background:rgba(255,255,255,.1)"></div>
        <div style="text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:.38rem;letter-spacing:.14em;color:rgba(167,139,250,.7);margin-bottom:3px">COINS</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:1.1rem;color:#fbbf24">🪙 ${coins}</div>
        </div>
      </div>

      <!-- Financial lesson -->
      <div style="max-width:340px;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.3);border-radius:12px;padding:14px 16px;margin-bottom:20px">
        <div style="font-family:'Orbitron',sans-serif;font-size:.36rem;letter-spacing:.18em;color:#a78bfa;margin-bottom:6px">CREDIT TIP</div>
        <div style="font-size:.68rem;color:rgba(241,237,255,.9);line-height:1.55">
          Check your credit report annually at <strong style="color:#a78bfa">AnnualCreditReport.com</strong>.
          1 in 5 Americans has an error on their report — errors can lower your score and cost you thousands in higher interest rates!
        </div>
      </div>

      ${showNext ? `<button onclick="roNextLevel()" style="width:100%;max-width:340px;margin-bottom:10px;padding:13px;border:none;border-radius:10px;background:linear-gradient(90deg,#8b5cf6,#a78bfa);color:#1a0f3c;font-family:'Orbitron',sans-serif;font-size:.58rem;letter-spacing:.12em;font-weight:900;cursor:pointer;box-shadow:0 4px 20px rgba(139,92,246,.4)">LEVEL ${curLevel+1} ▶ ${LEVELS[curLevel].name}</button>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button onclick="roPlayAgain()" style="padding:12px 26px;border:2px solid #8b5cf6;border-radius:10px;background:rgba(139,92,246,.2);color:#a78bfa;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.14em;cursor:pointer">${showNext ? 'REPLAY LV '+curLevel : 'PLAY AGAIN'}</button>
        <button onclick="roExit()" style="padding:12px 26px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.75);font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.14em;cursor:pointer">← HUB</button>
      </div>
    `;
    over.style.display = 'flex';
  }

  /* ─── PLAY AGAIN (replays curLevel) / NEXT LEVEL / EXIT ──────── */
  window.roPlayAgain = function(){
    if(G){ clearInterval(G.timerId); clearTimeout(G._endTimer); }
    const over = document.getElementById('roOver');
    if(over){ over.style.display = 'none'; over.innerHTML = ''; }

    // Re-initialize at curLevel — renderReport() fully rebuilds roDoc from scratch,
    // so no manual DOM scrubbing of old .ro-found/badges is needed (it's all replaced).
    G = newGame(curLevel);
    renderReport();
    const titleEl = document.getElementById('roTitle');
    if(titleEl) titleEl.textContent = `REPORT OBSERVATORY · LV ${curLevel}/3`;
    G.timerId = setInterval(tick, 1000);
    updateUI();
    const el = document.getElementById('roTimer');
    if(el){ el.textContent = G.timeLeft + 's'; el.style.color = '#e2e8f0'; }
  };

  window.roNextLevel = function(){
    if(curLevel >= 3) return;
    curLevel++;
    window.roPlayAgain();   // rebuilds via newGame(curLevel), now reads the bumped level
  };

  /* ─── EXIT ──────────────────────────────────────────────────── */
  window.roExit = function(){
    if(G){ clearInterval(G.timerId); clearTimeout(G._endTimer); }
    G = null;
    if(window.state) state.viewingWorld = 'credtech';
    goTo('credtech_hub');
  };

  /* ─── QA debug hook ───────────────────────────────────────────── */
  window._roDbg = function(){ return G ? { curLevel, level: G.level, goal: G.goal, found: G.errorsFound, score: G.score, timeLeft: G.timeLeft } : { curLevel, G: null }; };
  window._roForceLevel = function(n){ curLevel = Math.max(1, Math.min(3, n)); window.roPlayAgain(); };
  window._roForceWin = function(){ if(!G) return; G.errorsFound = G.goal; G.score = 9999; G.timeLeft = 0; endGame(); };

  /* ─── SCORE SHAKE ANIMATION ─────────────────────────────────── */
  (function injectStyles(){
    if(document.getElementById('roGlobalStyles')) return;
    const s = document.createElement('style');
    s.id = 'roGlobalStyles';
    s.textContent = `
      @keyframes roShakeScore {
        0%,100%{transform:translateX(0)}
        20%{transform:translateX(-3px)}
        40%{transform:translateX(4px)}
        60%{transform:translateX(-3px)}
        80%{transform:translateX(3px)}
      }
    `;
    document.head.appendChild(s);
  })();

})();
