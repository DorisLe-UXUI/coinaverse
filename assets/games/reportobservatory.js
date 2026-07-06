/* ════════════════════════════════════════════════════════════════
   G7 REPORT OBSERVATORY — CredTech Galaxy mini-game
   Spot-the-Difference / Error-Finding mechanic.
   Concept: "Read reports & fix errors"
   90-second session · 6 errors hidden in a credit report doc
   ════════════════════════════════════════════════════════════════ */
(function(){
  let G = null;

  /* ─── ERROR DEFINITIONS ─────────────────────────────────────── */
  // Each error item has: section, id, an errorType for rendering, and a hint shown after found
  const ERRORS = [
    { id:'unknown_account',   section:'accounts',     hint:'Unknown accounts may signal identity theft or a reporting mistake.' },
    { id:'missed_bill',       section:'payments',     hint:'Paid bills showing as missed is a common credit report error — dispute it!' },
    { id:'unknown_inquiry',   section:'inquiries',    hint:'You have the right to dispute unauthorized hard inquiries on your report.' },
    { id:'collection_active', section:'collections',  hint:'Collections you have paid must be marked PAID or removed — not stay ACTIVE.' },
    { id:'duplicate_account', section:'accounts',     hint:'Duplicate accounts inflate your debt load — always dispute them.' },
    { id:'wrong_balance',     section:'accounts',     hint:'Incorrect balances affect your utilization ratio and credit score.' },
  ];

  /* ─── STATE ─────────────────────────────────────────────────── */
  function newGame(){
    return {
      phase: 'play',
      score: 0,
      timeLeft: 90,
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
    setTimeout(initGame, 40);
    return `<div id="roRoot" style="position:absolute;inset:0;background:#0d0920;overflow:hidden;font-family:'Inter',sans-serif;color:#fff;user-select:none;-webkit-user-select:none">

      <!-- Stars canvas background -->
      <canvas id="roStars" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.5"></canvas>

      <!-- TOP BAR -->
      <div style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;padding:12px 14px;gap:10px;background:linear-gradient(180deg,rgba(13,9,32,.98) 70%,transparent);flex-shrink:0">
        <button onclick="roExit()" style="padding:7px 13px;border:1px solid rgba(139,92,246,.4);border-radius:9px;background:rgba(139,92,246,.12);color:#a78bfa;font-family:'Orbitron',sans-serif;font-size:.52rem;letter-spacing:.14em;cursor:pointer;white-space:nowrap;flex-shrink:0">← HUB</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:#a78bfa;flex:1;text-align:center;text-shadow:0 0 16px rgba(139,92,246,.6)">REPORT OBSERVATORY</div>
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

        <!-- THE CREDIT REPORT DOCUMENT -->
        <div id="roDoc" style="background:#f5f4f0;border-radius:14px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.5),0 0 0 1px rgba(139,92,246,.25);color:#1a1625;font-family:'Inter',sans-serif">

          <!-- REPORT HEADER -->
          <div style="background:linear-gradient(135deg,#2d1b69,#1a0f3c);padding:18px 20px;color:#fff">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div style="font-family:'Orbitron',sans-serif;font-size:.85rem;letter-spacing:.18em;color:#a78bfa;margin-bottom:2px">GALAXY CREDIT BUREAU</div>
                <div style="font-size:.7rem;color:rgba(221,214,254,.7);letter-spacing:.06em">OFFICIAL CONSUMER CREDIT REPORT</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:.6rem;color:rgba(221,214,254,.6)">Report Date</div>
                <div style="font-family:'Orbitron',sans-serif;font-size:.68rem;color:#e2d9f3">06/30/2026</div>
                <div style="font-size:.58rem;color:rgba(221,214,254,.4);margin-top:2px">Report #GCB-88142-X</div>
              </div>
            </div>
          </div>

          <!-- SECTION: PERSONAL INFO -->
          <div class="ro-section">
            <div class="ro-section-head">PERSONAL INFORMATION</div>
            <div class="ro-section-body">
              <div class="ro-field-row">
                <div class="ro-field-label">Full Name</div>
                <div class="ro-field-value">JAYDEN W.</div>
              </div>
              <div class="ro-field-row">
                <div class="ro-field-label">Address</div>
                <div class="ro-field-value">123 Galaxy Way, Star City, SC 77401</div>
              </div>
              <div class="ro-field-row">
                <div class="ro-field-label">Date of Birth</div>
                <div class="ro-field-value">01/15/2000</div>
              </div>
              <div class="ro-field-row">
                <div class="ro-field-label">SSN (last 4)</div>
                <div class="ro-field-value">••••-••••-3821</div>
              </div>
            </div>
          </div>

          <!-- SECTION: CREDIT SUMMARY -->
          <div class="ro-section">
            <div class="ro-section-head">CREDIT SUMMARY</div>
            <div style="padding:14px 16px">
              <div style="display:flex;gap:10px;flex-wrap:wrap">
                <div class="ro-stat-card">
                  <div class="ro-stat-label">FICO SCORE</div>
                  <div class="ro-stat-val" style="color:#15803d;font-size:1.5rem">720</div>
                  <div class="ro-stat-sub">GOOD</div>
                </div>
                <div class="ro-stat-card">
                  <div class="ro-stat-label">PAYMENT HISTORY</div>
                  <div class="ro-stat-val" style="color:#15803d">GOOD</div>
                  <div class="ro-stat-sub">35% of score</div>
                </div>
                <div class="ro-stat-card">
                  <div class="ro-stat-label">UTILIZATION</div>
                  <div class="ro-stat-val" style="color:#b45309">30%</div>
                  <div class="ro-stat-sub">Keep below 30%</div>
                </div>
                <div class="ro-stat-card">
                  <div class="ro-stat-label">OPEN ACCOUNTS</div>
                  <div class="ro-stat-val">5</div>
                  <div class="ro-stat-sub">Active</div>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION: ACCOUNTS -->
          <div class="ro-section">
            <div class="ro-section-head">OPEN ACCOUNTS</div>
            <div style="padding:10px 14px;display:flex;flex-direction:column;gap:8px">

              <!-- Clean account 1: Galaxy Card -->
              <div class="ro-account-row clean" data-id="galaxy_card" onclick="roTapItem('galaxy_card',false,this)">
                <div class="ro-acc-name">💳 Galaxy Card</div>
                <div class="ro-acc-details">
                  <span class="ro-acc-chip ok">CURRENT</span>
                  <span class="ro-acc-meta">Limit <strong>$1,000</strong></span>
                  <span class="ro-acc-meta">Balance <strong>$200</strong></span>
                  <span class="ro-acc-meta" style="color:#15803d">20% util</span>
                </div>
              </div>

              <!-- Clean account 2: Nebula Card -->
              <div class="ro-account-row clean" data-id="nebula_card" onclick="roTapItem('nebula_card',false,this)">
                <div class="ro-acc-name">💳 Nebula Card</div>
                <div class="ro-acc-details">
                  <span class="ro-acc-chip ok">CURRENT</span>
                  <span class="ro-acc-meta">Limit <strong>$2,500</strong></span>
                  <span class="ro-acc-meta">Balance <strong>$1,250</strong></span>
                  <span class="ro-acc-meta" style="color:#b45309">50% util</span>
                </div>
              </div>

              <!-- Clean account 3: Star Card -->
              <div class="ro-account-row clean" data-id="star_card_a" onclick="roTapItem('star_card_a',false,this)">
                <div class="ro-acc-name">💳 Star Card</div>
                <div class="ro-acc-details">
                  <span class="ro-acc-chip warn">MAXED</span>
                  <span class="ro-acc-meta">Limit <strong>$500</strong></span>
                  <span class="ro-acc-meta">Balance <strong>$500</strong></span>
                  <span class="ro-acc-meta" style="color:#dc2626">100% util</span>
                </div>
              </div>

              <!-- ERROR: Unknown account -->
              <div class="ro-account-row error-item" data-id="unknown_account" onclick="roTapItem('unknown_account',true,this)">
                <div class="ro-acc-name">💳 Unknown Lender</div>
                <div class="ro-acc-details">
                  <span class="ro-acc-chip bad">DELINQUENT</span>
                  <span class="ro-acc-meta">Limit <strong>$300</strong></span>
                  <span class="ro-acc-meta">Balance <strong>$300</strong></span>
                  <span class="ro-acc-meta" style="color:#dc2626">100% util</span>
                </div>
              </div>

              <!-- ERROR: Wrong balance (Nebula Card duplicate showing wrong balance) -->
              <div class="ro-account-row error-item" data-id="wrong_balance" onclick="roTapItem('wrong_balance',true,this)">
                <div class="ro-acc-name">💳 Nebula Card</div>
                <div class="ro-acc-details">
                  <span class="ro-acc-chip bad">DELINQUENT</span>
                  <span class="ro-acc-meta">Limit <strong>$2,500</strong></span>
                  <span class="ro-acc-meta">Balance <strong>$2,450</strong></span>
                  <span class="ro-acc-meta" style="color:#dc2626">98% util</span>
                </div>
              </div>

              <!-- ERROR: Duplicate Star Card -->
              <div class="ro-account-row error-item" data-id="duplicate_account" onclick="roTapItem('duplicate_account',true,this)">
                <div class="ro-acc-name">💳 Star Card</div>
                <div class="ro-acc-details">
                  <span class="ro-acc-chip warn">MAXED</span>
                  <span class="ro-acc-meta">Limit <strong>$500</strong></span>
                  <span class="ro-acc-meta">Balance <strong>$500</strong></span>
                  <span class="ro-acc-meta" style="color:#dc2626">100% util</span>
                </div>
              </div>

            </div>
          </div>

          <!-- SECTION: PAYMENT HISTORY -->
          <div class="ro-section">
            <div class="ro-section-head">PAYMENT HISTORY</div>
            <div style="padding:10px 14px;display:flex;flex-direction:column;gap:6px">
              <div style="font-size:.62rem;color:#374151;margin-bottom:4px">Last 24 months — ✅ = On Time &nbsp;|&nbsp; ⚠ = Late &nbsp;|&nbsp; ❌ = Missed</div>

              <!-- Payment row: clean -->
              <div class="ro-pay-row clean" data-id="pay_galaxy" onclick="roTapItem('pay_galaxy',false,this)">
                <div class="ro-pay-name">Galaxy Card</div>
                <div class="ro-pay-dots">✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅</div>
              </div>

              <!-- Payment row: clean -->
              <div class="ro-pay-row clean" data-id="pay_nebula" onclick="roTapItem('pay_nebula',false,this)">
                <div class="ro-pay-name">Nebula Card</div>
                <div class="ro-pay-dots">✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅⚠✅✅✅✅</div>
              </div>

              <!-- Payment row: clean -->
              <div class="ro-pay-row clean" data-id="pay_star" onclick="roTapItem('pay_star',false,this)">
                <div class="ro-pay-name">Star Card</div>
                <div class="ro-pay-dots">✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅</div>
              </div>

              <!-- ERROR: Missed bill entry that shouldn't be here -->
              <div class="ro-pay-row error-item" data-id="missed_bill" onclick="roTapItem('missed_bill',true,this)">
                <div class="ro-pay-name">MISSED BILL</div>
                <div class="ro-pay-dots" style="color:#dc2626;font-size:.65rem;font-weight:700">❌ MISSED — $150 — 04/2025</div>
              </div>

            </div>
          </div>

          <!-- SECTION: INQUIRIES -->
          <div class="ro-section">
            <div class="ro-section-head">HARD INQUIRIES</div>
            <div style="padding:10px 14px;display:flex;flex-direction:column;gap:6px">

              <div class="ro-inq-row clean" data-id="inq_bank" onclick="roTapItem('inq_bank',false,this)">
                <div class="ro-inq-name">🏦 Bank of Star City</div>
                <div class="ro-inq-date">05/12/2024</div>
                <div class="ro-inq-type">Auto Loan</div>
              </div>

              <div class="ro-inq-row clean" data-id="inq_galactic" onclick="roTapItem('inq_galactic',false,this)">
                <div class="ro-inq-name">🌌 Galactic Finance</div>
                <div class="ro-inq-date">04/22/2024</div>
                <div class="ro-inq-type">Personal Loan</div>
              </div>

              <!-- ERROR: Unknown lender inquiry -->
              <div class="ro-inq-row error-item" data-id="unknown_inquiry" onclick="roTapItem('unknown_inquiry',true,this)">
                <div class="ro-inq-name">❓ Unknown Lender</div>
                <div class="ro-inq-date">03/10/2024</div>
                <div class="ro-inq-type">Unknown</div>
              </div>

              <div class="ro-inq-row clean" data-id="inq_mega" onclick="roTapItem('inq_mega',false,this)">
                <div class="ro-inq-name">🏪 Mega Store Card</div>
                <div class="ro-inq-date">04/22/2024</div>
                <div class="ro-inq-type">Retail Credit</div>
              </div>

            </div>
          </div>

          <!-- SECTION: COLLECTIONS -->
          <div class="ro-section" style="margin-bottom:0">
            <div class="ro-section-head">COLLECTIONS</div>
            <div style="padding:10px 14px;display:flex;flex-direction:column;gap:8px">

              <!-- ERROR: Collection showing ACTIVE when it was paid -->
              <div class="ro-coll-row error-item" data-id="collection_active" onclick="roTapItem('collection_active',true,this)">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
                  <div>
                    <div class="ro-coll-name">⚠ Premier Collections</div>
                    <div class="ro-coll-detail">Original creditor: Orbit Utility Co. — Opened: 08/2023</div>
                  </div>
                  <div style="text-align:right">
                    <span class="ro-acc-chip bad">ACTIVE</span>
                    <div class="ro-coll-amt">$2,450</div>
                  </div>
                </div>
              </div>

              <div style="padding:10px 12px;background:rgba(15,118,110,.08);border:1px solid rgba(15,118,110,.2);border-radius:8px">
                <div style="font-size:.6rem;color:#374151">No other collection accounts on file.</div>
              </div>

            </div>
          </div>

          <!-- REPORT FOOTER -->
          <div style="padding:14px 20px;background:#f0eef8;border-top:1px solid #e0d9f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div style="font-size:.56rem;color:#6b7280">Dispute any errors at GalaxyCredit.com/dispute</div>
            <div style="font-size:.54rem;color:#9ca3af">© 2026 Galaxy Credit Bureau</div>
          </div>

        </div>
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
        .ro-coll-row.error-item::after {
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

  /* ─── INIT ──────────────────────────────────────────────────── */
  function initGame(){
    const root = document.getElementById('roRoot');
    if(!root) return;
    G = newGame();
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
      const errDef = ERRORS.find(e => e.id === id);
      badge.innerHTML = '✅ <span>ERROR FOUND! +150 pts</span>';
      el.appendChild(badge);

      // Hint tooltip below badge
      if(errDef){
        const hint = document.createElement('div');
        hint.style.cssText = 'font-size:.56rem;color:#374151;margin-top:3px;line-height:1.4;font-style:italic;';
        hint.textContent = errDef.hint;
        el.appendChild(hint);
      }

      showToast('ERROR FOUND! +150', '#34d399', '#052e16');
      updateUI();
      if(G.errorsFound >= 6){ G._endTimer = setTimeout(() => endGame(), 500); }
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
    if(ec) ec.textContent = G.errorsFound + ' / 6';
    const eb = document.getElementById('roErrBar');
    if(eb) eb.style.width = (G.errorsFound / 6 * 100) + '%';
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
    const timeBonus = G.timeLeft > 0 ? Math.floor(G.timeLeft * 2) : 0;
    const totalScore = G.score + timeBonus;
    const stars = found >= 6 ? 3 : found >= 4 ? 2 : 1;
    const is3star = stars === 3;
    const coins = window.cvAwardGame
      ? cvAwardGame('game_reportobservatory', { level: 1, stars, is3star, isPerfect: found >= 6 && G.wrongTaps === 0, badge: 'Fraud Hunter' })
      : (stars===3?150:stars===2?100:50);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('credtech_trust', stars*4);
    if (window.cvSave) cvSave();

    const over = document.getElementById('roOver');
    if(!over) return;

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const pctFull = Math.round(found / 6 * 100);

    over.innerHTML = `
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.3em;color:#a78bfa;margin-bottom:10px">REPORT ANALYSIS COMPLETE</div>
      <div style="font-size:2.2rem;margin-bottom:6px;letter-spacing:.08em">${starStr}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:1.4rem;color:#fff;margin-bottom:2px;text-shadow:0 0 24px rgba(167,139,250,.7)">${found}/6 ERRORS</div>
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

      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button onclick="roPlayAgain()" style="padding:12px 26px;border:2px solid #8b5cf6;border-radius:10px;background:rgba(139,92,246,.2);color:#a78bfa;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.14em;cursor:pointer">PLAY AGAIN</button>
        <button onclick="roExit()" style="padding:12px 26px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.75);font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.14em;cursor:pointer">← HUB</button>
      </div>
    `;
    over.style.display = 'flex';
  }

  /* ─── PLAY AGAIN ────────────────────────────────────────────── */
  window.roPlayAgain = function(){
    if(G){ clearInterval(G.timerId); clearTimeout(G._endTimer); }
    G = null;
    const over = document.getElementById('roOver');
    if(over) over.style.display = 'none';
    // Reset all tappable elements
    document.querySelectorAll('.ro-found').forEach(el => {
      el.classList.remove('ro-found','ro-flash-found');
      el.classList.add('error-item');
      // Remove appended badges/hints
      [...el.querySelectorAll('div:not(.ro-acc-name):not(.ro-acc-details):not(.ro-inq-name):not(.ro-pay-name)')].forEach(d => {
        // only remove the ones we injected (with green color)
        if(d.style.color === 'rgb(21, 128, 61)' || d.style.fontStyle === 'italic') d.remove();
      });
    });
    // Re-initialize
    G = newGame();
    G.timerId = setInterval(tick, 1000);
    updateUI();
    const el = document.getElementById('roTimer');
    if(el){ el.textContent = '90s'; el.style.color = '#e2e8f0'; }
  };

  /* ─── EXIT ──────────────────────────────────────────────────── */
  window.roExit = function(){
    if(G){ clearInterval(G.timerId); clearTimeout(G._endTimer); }
    G = null;
    if(window.state) state.viewingWorld = 'credtech';
    goTo('credtech_hub');
  };

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
