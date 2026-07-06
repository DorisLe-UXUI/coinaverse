/* ════════════════════════════════════════════════════════════════
   ASSET REALM — Appreciating Asset Sorter
   Investopia Hub · investor world · accent #00C853
   Level 1: obvious Buy vs Avoid sort
   Level 2: gray-area assets with cost/tax/market factors
   Canvas city skyline grows with good picks; crumbles with bad.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── constants ───────────────────────────────────────────────── */
  const ACCENT     = '#00C853';
  const ACCENT_DIM = '#007A30';
  const BG         = '#03040c';
  const CARD_BG    = '#060e10';
  const RED        = '#FF3D3D';
  const GOLD       = '#FFD600';
  const ROUND_TIME = 60;          // seconds per level
  const CARD_DELAY = 400;         // ms before next card appears after choice

  /* ── asset catalogue ─────────────────────────────────────────── */
  const LEVEL1_ASSETS = [
    // Good (appreciates)
    { id:'re1',  emoji:'🏠', name:'City Apartment',       cat:'Real Estate',  good:true,  value:85,  hint:'Properties in cities grow in value over time.' },
    { id:'stk1', emoji:'📈', name:'Index Fund',           cat:'Stocks',       good:true,  value:90,  hint:'Broad index funds grow with the economy.' },
    { id:'biz1', emoji:'🏪', name:'Corner Business',      cat:'Business',     good:true,  value:80,  hint:'Profitable businesses produce income and appreciate.' },
    { id:'farm', emoji:'🌾', name:'Farmland Plot',        cat:'Farmland',     good:true,  value:75,  hint:'Land is limited — farmland appreciates steadily.' },
    { id:'stk2', emoji:'💼', name:'Growth Stocks',        cat:'Stocks',       good:true,  value:88,  hint:'Quality company shares grow over years.' },
    { id:'re2',  emoji:'🏢', name:'Office Building',      cat:'Real Estate',  good:true,  value:82,  hint:'Commercial real estate generates rent and value.' },
    { id:'biz2', emoji:'🏭', name:'Small Factory',        cat:'Business',     good:true,  value:78,  hint:'Manufacturing assets produce lasting value.' },
    { id:'re3',  emoji:'🏡', name:'Suburban Home',        cat:'Real Estate',  good:true,  value:72,  hint:'Homes in good areas appreciate over decades.' },
    // Bad (depreciates)
    { id:'car1', emoji:'🚗', name:'Brand New Sports Car', cat:'Luxury Car',   good:false, value:30,  hint:'Cars lose 20% of value the moment you drive off the lot.' },
    { id:'lux1', emoji:'👜', name:'Designer Handbag',     cat:'Luxury Item',  good:false, value:20,  hint:'Fashion accessories lose value quickly.' },
    { id:'imp1', emoji:'🎰', name:'Impulse Gadget',       cat:'Electronics',  good:false, value:15,  hint:'Consumer electronics drop 50%+ in value within a year.' },
    { id:'lux2', emoji:'🛥️', name:'Party Boat',           cat:'Luxury Item',  good:false, value:10,  hint:'Boats cost more in maintenance than they ever return.' },
    { id:'car2', emoji:'🏎️', name:'Luxury SUV',           cat:'Luxury Car',   good:false, value:25,  hint:'New vehicles depreciate fast — avoid as assets.' },
    { id:'imp2', emoji:'🕹️', name:'Gaming Console',       cat:'Electronics',  good:false, value:12,  hint:'Entertainment tech loses most value within months.' },
    { id:'lux3', emoji:'💎', name:'Diamond Watch',        cat:'Luxury Item',  good:false, value:22,  hint:'Most jewelry loses resale value significantly.' },
    { id:'imp3', emoji:'🛍️', name:'Impulse Shopping Haul',cat:'Impulse Buy',  good:false, value:5,   hint:'Random purchases have near-zero resale value.' },
  ];

  const LEVEL2_ASSETS = [
    // Good (harder to see why)
    { id:'reit', emoji:'🏗️', name:'REIT Investment',      cat:'Real Estate',  good:true,  value:76, hint:'REITs let you invest in property without owning it — they pay dividends and appreciate.' },
    { id:'agri', emoji:'🌱', name:'Agriculture ETF',      cat:'Farmland',     good:true,  value:71, hint:'Food demand grows with population — ag assets hold value through cycles.' },
    { id:'int',  emoji:'💡', name:'Intellectual Property',cat:'Business',     good:true,  value:82, hint:'Patents and trademarks generate royalties and grow in value.' },
    { id:'pri',  emoji:'📦', name:'Private Equity Stake', cat:'Business',     good:true,  value:79, hint:'Owning part of a private company captures growth before IPO.' },
    { id:'tlt',  emoji:'📊', name:'Treasury Bond (10yr)', cat:'Stocks',       good:true,  value:60, hint:'Long bonds appreciate when interest rates fall and preserve real wealth.' },
    { id:'ind',  emoji:'🏚️', name:'Industrial Warehouse', cat:'Real Estate',  good:true,  value:84, hint:'E-commerce drove warehouse values up — industrial RE is strong.' },
    // Bad (easy to confuse as good)
    { id:'coll', emoji:'⚽', name:'Sports Memorabilia',   cat:'Collectible',  good:false, value:28, hint:'Most collectibles only appreciate for the top 1% — illiquid and speculative.' },
    { id:'boat', emoji:'⛵', name:'Rental Sailboat',      cat:'Luxury Item',  good:false, value:18, hint:'Maintenance, slip fees, and seasonality eat all rental income and more.' },
    { id:'cryp', emoji:'🪙', name:'Meme Coin',            cat:'Crypto',       good:false, value:8,  hint:'Speculative tokens with no fundamentals lose nearly all value — not wealth-building.' },
    { id:'art',  emoji:'🖼️', name:'Trending NFT',         cat:'Impulse Buy',  good:false, value:10, hint:'Most NFTs lost 90–99% of value after the hype cycle ended.' },
    { id:'tme',  emoji:'🏎️', name:'Timeshare Vacation',   cat:'Luxury Item',  good:false, value:20, hint:'Timeshares lose 50–70% of purchase price immediately and incur annual fees.' },
    { id:'fly',  emoji:'✈️', name:'Private Jet Share',    cat:'Luxury Car',   good:false, value:15, hint:'Fractional jets cost heavily in fees and depreciate — pure lifestyle expense.' },
    // Borderline — tilts good with context
    { id:'bord1',emoji:'🌆', name:'Up-and-Coming Suburb', cat:'Real Estate',  good:true,  value:65, hint:'Location risk is real, but growth-corridor suburbs have historically appreciated well.' },
    { id:'bord2',emoji:'🏦', name:'Blue-Chip Dividend Stock',cat:'Stocks',   good:true,  value:73, hint:'Established companies paying dividends build compound wealth over decades.' },
  ];

  /* ── facts shown at level transitions ───────────────────────── */
  const FACTS = [
    '💡 Real wealth comes from owning things that grow in value over time.',
    '📈 Real Estate, Stocks, and Businesses compound — impulse buys destroy value.',
    '🏗️ An asset should work for you: produce income, grow in value, or both.',
    '⏳ Time is the most powerful wealth multiplier — start appreciating assets early.',
    '📊 Diversify: real estate + stocks + business stakes reduce overall risk.',
  ];

  /* ── state ───────────────────────────────────────────────────── */
  let G = null;

  /* ── screen registration ─────────────────────────────────────── */
  window.SCREENS.game_inv_assetrealm = function () {
    G = null;
    setTimeout(initGame, 40);
    return `<div id="arRoot" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:Inter,sans-serif;color:#fff;user-select:none">
      <canvas id="arCity" style="position:absolute;bottom:0;left:0;width:100%;height:45%;pointer-events:none"></canvas>
      <!-- TOP BAR -->
      <div id="arBar" style="position:absolute;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(180deg,rgba(3,4,12,.95),transparent)">
        <button id="arBack" style="padding:6px 12px;border:1px solid ${ACCENT}44;border-radius:8px;background:${ACCENT}18;color:${ACCENT};font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.1em;cursor:pointer">← EXIT</button>
        <div style="font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.2em;color:${ACCENT};flex:1;text-align:center">🏙 ASSET REALM</div>
        <div id="arTimer" style="font-family:Orbitron,sans-serif;font-size:.8rem;color:${GOLD};min-width:40px;text-align:right">60s</div>
      </div>
      <!-- HUD ROW -->
      <div style="position:absolute;top:50px;left:0;right:0;z-index:10;display:flex;gap:8px;padding:0 14px;justify-content:center">
        <div style="background:${CARD_BG};border:1px solid ${ACCENT}33;border-radius:10px;padding:5px 14px;text-align:center">
          <div style="font-size:.5rem;letter-spacing:.15em;color:${ACCENT};font-family:Orbitron,sans-serif">SCORE</div>
          <div id="arScore" style="font-family:Orbitron,sans-serif;font-size:.95rem;color:#fff">0</div>
        </div>
        <div style="background:${CARD_BG};border:1px solid ${ACCENT}33;border-radius:10px;padding:5px 14px;text-align:center">
          <div style="font-size:.5rem;letter-spacing:.15em;color:${GOLD};font-family:Orbitron,sans-serif">WEALTH</div>
          <div id="arWealth" style="font-family:Orbitron,sans-serif;font-size:.95rem;color:${GOLD}">$0</div>
        </div>
        <div style="background:${CARD_BG};border:1px solid ${ACCENT}33;border-radius:10px;padding:5px 14px;text-align:center">
          <div style="font-size:.5rem;letter-spacing:.15em;color:#888;font-family:Orbitron,sans-serif">SORTED</div>
          <div id="arSorted" style="font-family:Orbitron,sans-serif;font-size:.95rem;color:#ccc">0</div>
        </div>
      </div>
      <!-- WEALTH METER bar -->
      <div style="position:absolute;top:108px;left:14px;right:14px;z-index:10;height:6px;background:#1a1a2e;border-radius:3px;overflow:hidden">
        <div id="arMeterFill" style="height:100%;width:50%;background:linear-gradient(90deg,${ACCENT_DIM},${ACCENT});border-radius:3px;transition:width .4s ease"></div>
      </div>
      <div style="position:absolute;top:117px;left:14px;right:14px;z-index:10;display:flex;justify-content:space-between">
        <span style="font-size:.45rem;color:#444;font-family:Orbitron,sans-serif">BROKE</span>
        <span id="arMeterLabel" style="font-size:.45rem;color:${ACCENT};font-family:Orbitron,sans-serif">WEALTH METER</span>
        <span style="font-size:.45rem;color:#444;font-family:Orbitron,sans-serif">RICH</span>
      </div>
      <!-- LEVEL BADGE -->
      <div id="arLevelBadge" style="position:absolute;top:132px;left:0;right:0;z-index:10;text-align:center;font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.2em;color:#555"></div>
      <!-- ASSET CARD ZONE -->
      <div id="arCardZone" style="position:absolute;top:150px;left:0;right:0;bottom:46%;z-index:10;display:flex;align-items:center;justify-content:center"></div>
      <!-- BIN ROW -->
      <div id="arBins" style="position:absolute;bottom:calc(45% + 8px);left:14px;right:14px;z-index:11;display:flex;gap:10px;height:52px">
        <div id="arBinBuy" style="flex:1;border:2px solid ${ACCENT};border-radius:14px;background:${ACCENT}14;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:background .15s">
          <span style="font-size:1.1rem">📥</span>
          <span style="font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.1em;color:${ACCENT}">BUY</span>
        </div>
        <div id="arBinAvoid" style="flex:1;border:2px solid ${RED};border-radius:14px;background:${RED}14;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:background .15s">
          <span style="font-size:1.1rem">🚫</span>
          <span style="font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.1em;color:${RED}">AVOID</span>
        </div>
      </div>
      <!-- feedback toast -->
      <div id="arToast" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);z-index:20;pointer-events:none;text-align:center;transition:transform .15s,opacity .3s;opacity:0"></div>
      <!-- overlay -->
      <div id="arOverlay" style="display:none;position:absolute;inset:0;z-index:30;background:rgba(3,4,12,.92);display:none;flex-direction:column;align-items:center;justify-content:center;padding:24px"></div>
    </div>`;
  };

  /* ── init ────────────────────────────────────────────────────── */
  function initGame() {
    const root = document.getElementById('arRoot');
    if (!root) return;

    // shuffle helpers
    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // init state
    G = {
      phase:       'play',    // play | between | done
      level:       1,         // 1 or 2
      score:       0,
      wealth:      500,       // wealth meter 0-1000
      sorted:      0,
      correct:     0,
      total:       0,
      wealthPeak:  500,
      time:        ROUND_TIME,
      timerHandle: null,
      deck:        shuffle(LEVEL1_ASSETS.slice()),
      cardIdx:     0,
      waiting:     false,     // true while feedback showing
      rafId:       null,
      buildings:   [],        // city skyline state
      canvas:      null,
      ctx:         null,
      animFrame:   0,
      dragActive:  false,
      dragX:       0,
      dragY:       0,
      cardStartX:  0,
      cardStartY:  0,
      cardEl:      null,
    };

    // build skyline
    G.canvas = document.getElementById('arCity');
    G.ctx    = G.canvas ? G.canvas.getContext('2d') : null;
    buildSkyline();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // start timer
    G.timerHandle = setInterval(tickTimer, 1000);

    // wire back button
    const back = document.getElementById('arBack');
    if (back) back.onclick = () => window.inv_assetrealmExit();

    // wire bins
    const binBuy   = document.getElementById('arBinBuy');
    const binAvoid = document.getElementById('arBinAvoid');
    if (binBuy)   binBuy.onclick   = () => handleChoice(true);
    if (binAvoid) binAvoid.onclick = () => handleChoice(false);

    // keyboard
    document.addEventListener('keydown', onKey);

    // first card
    updateHUD();
    showCard();
    drawCity();
    updateLevelBadge();
  }

  /* ── skyline ─────────────────────────────────────────────────── */
  function buildSkyline() {
    G.buildings = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      G.buildings.push({
        x:     (i / count) + (Math.random() * 0.04 - 0.02),
        w:     0.04 + Math.random() * 0.04,
        h:     0.3  + Math.random() * 0.5,   // 0.3..0.8 of canvas height
        hBase: 0.3  + Math.random() * 0.5,
        hTarget: 0.3 + Math.random() * 0.5,
        hAnimDir: 1,
        col:   Math.random() > 0.5 ? '#0a1f14' : '#060e10',
        winRows: Math.floor(2 + Math.random() * 4),
        winCols: Math.floor(1 + Math.random() * 3),
        lit:   Math.random() > 0.5,
        glow:  0,
      });
    }
  }

  function resizeCanvas() {
    if (!G || !G.canvas) return;
    const root = document.getElementById('arRoot');
    if (!root) return;
    G.canvas.width  = root.offsetWidth;
    G.canvas.height = Math.floor(root.offsetHeight * 0.45);
    drawCity();
  }

  function drawCity() {
    if (!G || !G.ctx || !G.canvas) return;
    const ctx = G.ctx;
    const W   = G.canvas.width;
    const H   = G.canvas.height;

    ctx.clearRect(0, 0, W, H);

    // sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#010608');
    sky.addColorStop(1, '#030c0a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // wealth-based glow overlay
    const wealthRatio = G.wealth / 1000;
    if (wealthRatio > 0.5) {
      const glow = ctx.createRadialGradient(W / 2, H, 10, W / 2, H, W * 0.7);
      const alpha = (wealthRatio - 0.5) * 0.6;
      glow.addColorStop(0, `rgba(0,200,83,${alpha})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    } else if (wealthRatio < 0.4) {
      const glow = ctx.createRadialGradient(W / 2, H, 10, W / 2, H, W * 0.7);
      const alpha = (0.4 - wealthRatio) * 0.5;
      glow.addColorStop(0, `rgba(200,30,30,${alpha})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }

    // buildings
    G.buildings.forEach(b => {
      // lerp h toward hTarget
      b.h += (b.hTarget - b.h) * 0.04;

      const bx  = b.x * W;
      const bw  = b.w * W;
      const bh  = b.h * H;
      const by  = H - bh;

      // building body
      const grad = ctx.createLinearGradient(bx, by, bx, H);
      grad.addColorStop(0, wealthRatio > 0.55 ? '#0d2a18' : (wealthRatio < 0.35 ? '#1a0808' : '#0a1118'));
      grad.addColorStop(1, '#030609');
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, bw, bh);

      // accent border on wealthy buildings
      if (wealthRatio > 0.65) {
        ctx.strokeStyle = `rgba(0,200,83,${(wealthRatio - 0.65) * 0.8})`;
        ctx.lineWidth   = 1;
        ctx.strokeRect(bx, by, bw, bh);
      }

      // windows
      const winW = bw / (b.winCols * 2.5);
      const winH = winW * 1.4;
      const row  = b.winRows;
      const col  = b.winCols;
      for (let r = 0; r < row; r++) {
        for (let c = 0; c < col; c++) {
          const wx = bx + (c + 0.5) * (bw / col) - winW / 2;
          const wy = by + (r + 0.6) * (bh / (row + 1)) - winH / 2;
          const lit = (b.lit && (r + c) % 2 === 0) || wealthRatio > 0.7;
          ctx.fillStyle = lit
            ? (wealthRatio > 0.6 ? `rgba(0,255,120,${0.5 + wealthRatio * 0.4})` : 'rgba(255,230,100,0.6)')
            : 'rgba(20,20,30,0.9)';
          ctx.fillRect(wx, wy, winW, winH);
        }
      }

      // glow pulse on wealthy buildings
      if (b.glow > 0) {
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur  = b.glow * 20;
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth   = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.shadowBlur  = 0;
        b.glow *= 0.92;
      }
    });

    // ground line
    ctx.fillStyle = '#00C85318';
    ctx.fillRect(0, H - 3, W, 3);

    G.animFrame++;
    if (G && G.phase !== 'done') {
      // slow ambient redraw
      setTimeout(() => { if (G) drawCity(); }, 80);
    }
  }

  /* ── city react to choice ────────────────────────────────────── */
  function pulseBuildings(good) {
    if (!G) return;
    const wR = G.wealth / 1000;
    G.buildings.forEach(b => {
      if (good) {
        b.hTarget = Math.min(0.98, b.hTarget + 0.04 + Math.random() * 0.06);
        if (wR > 0.6) b.glow = 1;
      } else {
        b.hTarget = Math.max(0.05, b.hTarget - 0.04 - Math.random() * 0.05);
      }
    });
  }

  /* ── card display ────────────────────────────────────────────── */
  function currentAsset() {
    if (!G) return null;
    return G.deck[G.cardIdx] || null;
  }

  function showCard() {
    if (!G || G.phase !== 'play') return;
    const zone   = document.getElementById('arCardZone');
    if (!zone) return;
    const asset  = currentAsset();
    if (!asset) {
      // deck exhausted in level 1 — move to level 2
      if (G.level === 1) {
        startLevel2();
      } else {
        finishGame();
      }
      return;
    }

    const isGood = asset.good;
    const wealthRatio = G.wealth / 1000;

    // Level 2 shows extra factor tags
    let factorHTML = '';
    if (G.level === 2) {
      const factors = genFactors(asset);
      factorHTML = `<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-top:8px">
        ${factors.map(f => `<span style="font-size:.58rem;padding:3px 8px;border-radius:20px;background:${f.pos ? ACCENT+'22' : RED+'22'};color:${f.pos ? ACCENT : RED};border:1px solid ${f.pos ? ACCENT+'44' : RED+'44'}">${f.label}</span>`).join('')}
      </div>`;
    }

    // value indicator only in level 1
    const valHTML = G.level === 1 ? `
      <div style="display:flex;align-items:center;gap:6px;justify-content:center;margin-top:6px">
        <span style="font-size:1rem">${isGood ? '📈' : '📉'}</span>
        <span style="font-size:.7rem;color:${isGood ? ACCENT : RED}">${isGood ? 'APPRECIATES' : 'DEPRECIATES'}</span>
      </div>` : '';

    zone.innerHTML = `
      <div id="arCard" style="
        position:relative;
        background:linear-gradient(145deg,${CARD_BG},#0a1520);
        border:1.5px solid ${ACCENT}33;
        border-radius:18px;
        padding:20px 24px;
        max-width:320px;
        width:90%;
        box-shadow:0 0 40px rgba(0,200,83,.08),0 8px 32px rgba(0,0,0,.6);
        cursor:grab;
        touch-action:none;
        transition:transform .1s;
      ">
        <div style="position:absolute;top:10px;right:12px;font-size:.55rem;font-family:Orbitron,sans-serif;letter-spacing:.12em;padding:3px 8px;border-radius:20px;background:${ACCENT}18;color:${ACCENT}88;border:1px solid ${ACCENT}22">${asset.cat}</div>
        <div style="font-size:3.2rem;text-align:center;margin-bottom:10px;line-height:1">${asset.emoji}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.85rem;letter-spacing:.05em;text-align:center;margin-bottom:4px;color:#eee">${asset.name}</div>
        <div style="font-size:.65rem;color:#667;text-align:center;line-height:1.5">${G.level === 1 ? asset.hint : '🤔 Evaluate carefully — consider long-term factors.'}</div>
        ${valHTML}
        ${factorHTML}
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:center">
          <div style="flex:1;background:${ACCENT}14;border:1px solid ${ACCENT}33;border-radius:10px;padding:8px;text-align:center;cursor:pointer;transition:background .15s" onclick="document.getElementById('arBinBuy').click()">
            <div style="font-size:.55rem;font-family:Orbitron,sans-serif;color:${ACCENT};letter-spacing:.1em">BUY</div>
            <div style="font-size:.5rem;color:#666">K key</div>
          </div>
          <div style="flex:1;background:${RED}14;border:1px solid ${RED}33;border-radius:10px;padding:8px;text-align:center;cursor:pointer;transition:background .15s" onclick="document.getElementById('arBinAvoid').click()">
            <div style="font-size:.55rem;font-family:Orbitron,sans-serif;color:${RED};letter-spacing:.1em">AVOID</div>
            <div style="font-size:.5rem;color:#666">J key</div>
          </div>
        </div>
      </div>`;

    // drag support
    setupDrag(document.getElementById('arCard'));

    // swipe hint shimmer
    const card = document.getElementById('arCard');
    if (card) {
      card.animate([
        { boxShadow: `0 0 40px rgba(0,200,83,.08),0 8px 32px rgba(0,0,0,.6)` },
        { boxShadow: `0 0 55px rgba(0,200,83,.18),0 8px 32px rgba(0,0,0,.6)` },
        { boxShadow: `0 0 40px rgba(0,200,83,.08),0 8px 32px rgba(0,0,0,.6)` },
      ], { duration: 2000, iterations: Infinity });
    }
  }

  function genFactors(asset) {
    const factors = [];
    if (asset.good) {
      factors.push({ pos: true,  label: '📍 Good Location' });
      factors.push({ pos: true,  label: '💧 Liquid Market' });
      factors.push({ pos: true,  label: '📈 Long-Term Trend' });
      if (Math.random() > 0.5) factors.push({ pos: false, label: '🏦 Tax Implications' });
      if (Math.random() > 0.5) factors.push({ pos: false, label: '🔧 Maintenance Cost' });
    } else {
      factors.push({ pos: false, label: '⚠ Rapid Depreciation' });
      factors.push({ pos: false, label: '💸 High Carrying Cost' });
      factors.push({ pos: false, label: '🧊 Illiquid Asset' });
      if (Math.random() > 0.5) factors.push({ pos: true,  label: '✨ Emotional Appeal' });
    }
    return factors;
  }

  /* ── drag to swipe ───────────────────────────────────────────── */
  // Module-level drag listener references so they can be removed on exit and card change.
  let _dragMove = null;
  let _dragUp   = null;

  function removeDragListeners() {
    if (_dragMove) { document.removeEventListener('mousemove', _dragMove); document.removeEventListener('touchmove', _dragMove); _dragMove = null; }
    if (_dragUp)   { document.removeEventListener('mouseup',  _dragUp);   document.removeEventListener('touchend',  _dragUp);   _dragUp   = null; }
  }

  function setupDrag(card) {
    if (!card) return;
    // Remove any leftover drag listeners from the previous card before attaching new ones.
    removeDragListeners();

    let startX = 0, startY = 0, dx = 0, dragging = false;

    function onDown(e) {
      if (G.waiting) return;
      dragging = true;
      const pt = e.touches ? e.touches[0] : e;
      startX = pt.clientX;
      startY = pt.clientY;
      card.style.transition = 'none';
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      const pt = e.touches ? e.touches[0] : e;
      dx = pt.clientX - startX;
      const dy = pt.clientY - startY;
      const rot = dx * 0.08;
      card.style.transform = `translate(${dx}px,${dy * 0.3}px) rotate(${rot}deg)`;
      // color tint bins
      const buy   = document.getElementById('arBinBuy');
      const avoid = document.getElementById('arBinAvoid');
      if (buy && avoid) {
        buy.style.background   = dx > 40  ? ACCENT + '44' : ACCENT + '14';
        avoid.style.background = dx < -40 ? RED    + '44' : RED    + '14';
      }
      e.preventDefault();
    }
    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      card.style.transition = 'transform .25s';
      const buy   = document.getElementById('arBinBuy');
      const avoid = document.getElementById('arBinAvoid');
      if (buy)   buy.style.background   = ACCENT + '14';
      if (avoid) avoid.style.background = RED    + '14';

      if (dx > 60) {
        // fling right = BUY
        card.style.transform = 'translate(200%,0) rotate(15deg)';
        setTimeout(() => handleChoice(true), 200);
      } else if (dx < -60) {
        // fling left = AVOID
        card.style.transform = 'translate(-200%,0) rotate(-15deg)';
        setTimeout(() => handleChoice(false), 200);
      } else {
        card.style.transform = 'translate(0,0) rotate(0)';
      }
      dx = 0;
    }

    _dragMove = onMove;
    _dragUp   = onUp;

    card.addEventListener('mousedown',  onDown,  { passive: false });
    card.addEventListener('touchstart', onDown,  { passive: false });
    document.addEventListener('mousemove',  onMove);
    document.addEventListener('touchmove',  onMove, { passive: false });
    document.addEventListener('mouseup',    onUp);
    document.addEventListener('touchend',   onUp);
  }

  /* ── choice handler ──────────────────────────────────────────── */
  function handleChoice(buyChoice) {
    if (!G || G.waiting || G.phase !== 'play') return;
    const asset = currentAsset();
    if (!asset) return;
    G.waiting = true;
    G.total++;

    const correct = (buyChoice === asset.good);
    G.sorted++;
    if (correct) G.correct++;

    // score delta
    const pts = correct
      ? (G.level === 1 ? 20 : 30)
      : (G.level === 1 ? -10 : -15);
    G.score = Math.max(0, G.score + pts);

    // wealth meter
    const wDelta = correct
      ? (asset.value * 0.8 + (G.level * 20))
      : -(asset.value * 0.6 + (G.level * 15));
    G.wealth = Math.max(0, Math.min(1000, G.wealth + wDelta));
    if (G.wealth > G.wealthPeak) G.wealthPeak = G.wealth;

    pulseBuildings(correct);
    showToast(correct, asset, buyChoice);
    updateHUD();

    // advance card
    G.cardIdx++;
    setTimeout(() => {
      if (!G || G.phase !== 'play') return;
      G.waiting = false;
      clearToast();
      showCard();
    }, CARD_DELAY + 300);
  }

  /* ── feedback toast ──────────────────────────────────────────── */
  function showToast(correct, asset, buyChoice) {
    const toast = document.getElementById('arToast');
    if (!toast) return;
    const icon  = correct ? '✅' : '❌';
    const color = correct ? ACCENT : RED;
    const msg   = correct
      ? (asset.good ? `Smart Buy! +${asset.value} value` : `Avoided wisely!`)
      : (asset.good ? `Missed! That appreciates!` : `Trap! That depreciates!`);

    toast.innerHTML = `
      <div style="background:rgba(3,4,12,.95);border:1.5px solid ${color};border-radius:14px;padding:12px 20px;min-width:200px;max-width:280px">
        <div style="font-size:1.8rem">${icon}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:.72rem;color:${color};margin:4px 0;letter-spacing:.05em">${msg}</div>
        <div style="font-size:.6rem;color:#888;line-height:1.4">${asset.hint}</div>
      </div>`;
    toast.style.opacity      = '1';
    toast.style.transform    = 'translate(-50%,-50%) scale(1)';
    toast.style.display      = 'block';
  }

  function clearToast() {
    const toast = document.getElementById('arToast');
    if (!toast) return;
    toast.style.opacity   = '0';
    toast.style.transform = 'translate(-50%,-50%) scale(0.8)';
    setTimeout(() => { if (toast) { toast.style.display = 'none'; toast.style.opacity = '1'; toast.style.transform = 'translate(-50%,-50%) scale(0)'; } }, 300);
  }

  /* ── HUD updates ─────────────────────────────────────────────── */
  function updateHUD() {
    if (!G) return;
    const scoreEl  = document.getElementById('arScore');
    const wealthEl = document.getElementById('arWealth');
    const sortedEl = document.getElementById('arSorted');
    const meter    = document.getElementById('arMeterFill');
    const timerEl  = document.getElementById('arTimer');

    if (scoreEl)  scoreEl.textContent  = G.score;
    if (wealthEl) wealthEl.textContent = '$' + Math.round(G.wealth);
    if (sortedEl) sortedEl.textContent = G.sorted;
    if (meter) {
      const pct = Math.round(G.wealth / 10);
      meter.style.width      = pct + '%';
      meter.style.background = pct > 60
        ? `linear-gradient(90deg,${ACCENT_DIM},${ACCENT})`
        : pct > 35
          ? 'linear-gradient(90deg,#7a5c00,#FFD600)'
          : `linear-gradient(90deg,#7a0000,${RED})`;
    }
    if (timerEl)  timerEl.textContent  = G.time + 's';
  }

  function updateLevelBadge() {
    const el = document.getElementById('arLevelBadge');
    if (!el || !G) return;
    const label = G.level === 1
      ? '▸ LEVEL 1 · LEARN — Sort obvious assets'
      : '▸ LEVEL 2 · MASTER — Evaluate gray-area assets';
    el.textContent = label;
    el.style.color = G.level === 1 ? ACCENT + '88' : GOLD + '88';
  }

  /* ── timer ───────────────────────────────────────────────────── */
  function tickTimer() {
    if (!G || G.phase !== 'play') return;
    G.time--;
    updateHUD();
    if (G.time <= 0) {
      if (G.level === 1) {
        startLevel2();
      } else {
        finishGame();
      }
    }
    // low time flash
    const timerEl = document.getElementById('arTimer');
    if (timerEl && G.time <= 10) {
      timerEl.style.color = G.time % 2 === 0 ? RED : GOLD;
    }
  }

  /* ── level 2 transition ──────────────────────────────────────── */
  function startLevel2() {
    if (!G) return;
    G.phase   = 'between';
    if (G.timerHandle) clearInterval(G.timerHandle);

    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const zone = document.getElementById('arCardZone');
    if (zone) {
      zone.innerHTML = `
        <div style="max-width:320px;width:90%;text-align:center;padding:24px;background:linear-gradient(145deg,${CARD_BG},#0a1520);border:1.5px solid ${ACCENT}44;border-radius:18px">
          <div style="font-size:2rem;margin-bottom:10px">🏙️</div>
          <div style="font-family:Orbitron,sans-serif;font-size:.75rem;color:${ACCENT};letter-spacing:.15em;margin-bottom:6px">LEVEL 1 COMPLETE</div>
          <div style="font-size:.7rem;color:#888;margin-bottom:4px">Accuracy: <span style="color:${ACCENT}">${G.total > 0 ? Math.round((G.correct / G.total) * 100) : 0}%</span></div>
          <div style="font-size:.7rem;color:#888;margin-bottom:14px">Wealth Meter: <span style="color:${GOLD}">$${Math.round(G.wealth)}</span></div>
          <div style="font-size:.65rem;color:#555;margin-bottom:18px;line-height:1.6">${FACTS[0]}</div>
          <button id="arNextLevel" style="padding:10px 28px;border:none;border-radius:10px;background:${ACCENT};color:#000;font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.1em;cursor:pointer">LEVEL 2 →</button>
        </div>`;
      const btn = document.getElementById('arNextLevel');
      if (btn) btn.onclick = () => {
        G.level   = 2;
        G.phase   = 'play';
        G.time    = ROUND_TIME;
        G.deck    = shuffle(LEVEL2_ASSETS.slice());
        G.cardIdx = 0;
        G.waiting = false;
        G.timerHandle = setInterval(tickTimer, 1000);
        updateLevelBadge();
        showCard();
        updateHUD();
      };
    }
  }

  /* ── finish ──────────────────────────────────────────────────── */
  function finishGame() {
    if (!G) return;
    G.phase = 'done';
    if (G.timerHandle) clearInterval(G.timerHandle);
    document.removeEventListener('keydown', onKey);

    const accuracy = G.total > 0 ? (G.correct / G.total) : 0;
    const wMeter   = G.wealth / 1000;

    // Stars: based on accuracy + wealth meter
    let stars;
    if (accuracy >= 0.85 && wMeter >= 0.65) stars = 3;
    else if (accuracy >= 0.65 && wMeter >= 0.45) stars = 2;
    else stars = 1;

    endGame(stars, accuracy);
  }

  /* ── end game overlay ────────────────────────────────────────── */
  function endGame(stars, accuracy) {
    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_inv_assetrealm', { level: (G && G.level) || 1, stars, badge: 'Asset Builder', is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars >= 1 && window.cvHubMeter) cvHubMeter('inv_wealth', stars * 4);
    if (stars < 1 && window.cvSave) cvSave();

    const starStr    = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const accPct     = Math.round((accuracy || 0) * 100);
    const wealthDisp = Math.round(G ? G.wealth : 0);
    const peakDisp   = Math.round(G ? G.wealthPeak : 0);
    const lesson     = FACTS[Math.floor(Math.random() * FACTS.length)];

    const overlay = document.getElementById('arOverlay');
    if (!overlay) return;
    overlay.style.display     = 'flex';
    overlay.style.flexDirection     = 'column';
    overlay.style.alignItems        = 'center';
    overlay.style.justifyContent    = 'center';
    overlay.style.padding           = '24px';

    overlay.innerHTML = `
      <div style="max-width:340px;width:100%;text-align:center">
        <div style="font-size:3.2rem;margin-bottom:6px">${starStr}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:1rem;letter-spacing:.2em;color:${ACCENT};margin-bottom:4px">
          ${stars === 3 ? 'ASSET MASTER' : stars === 2 ? 'SMART INVESTOR' : 'KEEP LEARNING'}
        </div>
        <div style="font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.15em;color:#555;margin-bottom:20px">ASSET REALM · COMPLETE</div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:20px">
          <div style="background:${CARD_BG};border:1px solid ${ACCENT}33;border-radius:10px;padding:10px">
            <div style="font-size:.45rem;font-family:Orbitron,sans-serif;color:${ACCENT};letter-spacing:.1em;margin-bottom:4px">ACCURACY</div>
            <div style="font-family:Orbitron,sans-serif;font-size:.9rem;color:#fff">${accPct}%</div>
          </div>
          <div style="background:${CARD_BG};border:1px solid ${GOLD}33;border-radius:10px;padding:10px">
            <div style="font-size:.45rem;font-family:Orbitron,sans-serif;color:${GOLD};letter-spacing:.1em;margin-bottom:4px">WEALTH</div>
            <div style="font-family:Orbitron,sans-serif;font-size:.9rem;color:${GOLD}">$${wealthDisp}</div>
          </div>
          <div style="background:${CARD_BG};border:1px solid #aaa3;border-radius:10px;padding:10px">
            <div style="font-size:.45rem;font-family:Orbitron,sans-serif;color:#aaa;letter-spacing:.1em;margin-bottom:4px">COINS</div>
            <div style="font-family:Orbitron,sans-serif;font-size:.9rem;color:#fff">+${coins}</div>
          </div>
        </div>

        <div style="background:${ACCENT}0d;border:1px solid ${ACCENT}33;border-radius:12px;padding:14px 16px;margin-bottom:20px;text-align:left">
          <div style="font-size:.55rem;font-family:Orbitron,sans-serif;color:${ACCENT};letter-spacing:.12em;margin-bottom:6px">END LESSON</div>
          <div style="font-size:.68rem;color:#ccc;line-height:1.6">Real wealth comes from owning things that grow in value over time — Real Estate, Stocks, and Businesses build wealth; impulse buys destroy it.</div>
        </div>

        <div style="font-size:.62rem;color:#556;font-style:italic;margin-bottom:20px;line-height:1.5">${lesson}</div>

        <div style="display:flex;gap:10px">
          <button id="arPlayAgain" style="flex:1;padding:12px;border:1px solid ${ACCENT}66;border-radius:12px;background:transparent;color:${ACCENT};font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer">PLAY AGAIN</button>
          <button id="arHubBtn" style="flex:1;padding:12px;border:none;border-radius:12px;background:${ACCENT};color:#000;font-family:Orbitron,sans-serif;font-size:.62rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
        </div>
      </div>`;

    document.getElementById('arPlayAgain').onclick = () => {
      // Clean up current session before re-init.
      if (G) {
        if (G.timerHandle) clearInterval(G.timerHandle);
        G = null;
      }
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resizeCanvas);
      removeDragListeners();
      // Re-render the game shell. SCREENS.game_inv_assetrealm() schedules initGame
      // via its own setTimeout — do NOT call initGame again here to avoid double-init.
      const root = document.getElementById('arRoot');
      if (root && window.SCREENS && window.SCREENS.game_inv_assetrealm) {
        const newHTML = window.SCREENS.game_inv_assetrealm();
        const tmp = document.createElement('div');
        tmp.innerHTML = newHTML;
        const inner = tmp.querySelector('#arRoot');
        if (inner) {
          root.innerHTML = inner.innerHTML;
          root.style.cssText = inner.style.cssText;
        }
      }
    };

    document.getElementById('arHubBtn').onclick = () => window.inv_assetrealmExit();

    // confetti if 3 stars
    if (stars === 3) launchConfetti(overlay);
  }

  /* ── confetti ────────────────────────────────────────────────── */
  function launchConfetti(container) {
    const cvs = document.createElement('canvas');
    cvs.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:31';
    cvs.width  = window.innerWidth;
    cvs.height = window.innerHeight;
    container.appendChild(cvs);
    const ctx    = cvs.getContext('2d');
    const pieces = Array.from({ length: 60 }, () => ({
      x:  Math.random() * cvs.width,
      y: -10 - Math.random() * 80,
      r:  3 + Math.random() * 5,
      c: [ACCENT, GOLD, '#fff', '#00ff88', '#ffd700'][Math.floor(Math.random() * 5)],
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      va: (Math.random() - 0.5) * 0.2,
      a:  Math.random() * Math.PI * 2,
    }));
    let alive = true;
    function draw() {
      if (!alive) return;
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      pieces.forEach(p => {
        p.x  += p.vx;
        p.y  += p.vy;
        p.a  += p.va;
        p.vy *= 0.995;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();
      });
      if (pieces.some(p => p.y < cvs.height + 20)) requestAnimationFrame(draw);
      else { alive = false; cvs.remove(); }
    }
    draw();
    setTimeout(() => { alive = false; if (cvs.parentNode) cvs.remove(); }, 4000);
  }

  /* ── keyboard ────────────────────────────────────────────────── */
  function onKey(e) {
    if (!G || G.waiting || G.phase !== 'play') return;
    if (e.key === 'ArrowRight' || e.key === 'k' || e.key === 'K') handleChoice(true);
    if (e.key === 'ArrowLeft'  || e.key === 'j' || e.key === 'J') handleChoice(false);
  }

  /* ── exit ────────────────────────────────────────────────────── */
  window.inv_assetrealmExit = function () {
    if (G) {
      if (G.timerHandle) clearInterval(G.timerHandle);
      G = null;
    }
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', resizeCanvas);
    removeDragListeners();
    if (window.state) state.viewingWorld = 'investor';
    goTo('hub');
  };

})();
