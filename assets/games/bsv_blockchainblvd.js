/* ════════════════════════════════════════════════════════════════
   BLOCKCHAIN BLVD — Drag-and-validate puzzle (Bitstream Valley)
   Assemble transaction blocks into a correct, secure chain.
   Order → Validate → Seal with crypto key. Reject fakes.
   Level 2: multiple chains + real-time hacker corruption.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ACCENT = '#00FFFF';
  const ACCENT2 = '#00BFFF';
  const DANGER  = '#FF4444';
  const WARN    = '#FF9500';
  const GOLD    = '#FFD700';
  const BG      = '#03040c';

  const KEYS = ['🔑','🗝️','🔐','🛡️','⚙️'];

  // All transaction pool data
  const TX_POOL = [
    { id:'t01', from:'Alice',   to:'Bob',    amount:50,   valid:true  },
    { id:'t02', from:'Bob',     to:'Carol',  amount:30,   valid:true  },
    { id:'t03', from:'Carol',   to:'Dave',   amount:80,   valid:true  },
    { id:'t04', from:'Eve',     to:'Frank',  amount:20,   valid:true  },
    { id:'t05', from:'Grace',   to:'Hank',   amount:65,   valid:true  },
    { id:'t06', from:'Ivan',    to:'Judy',   amount:15,   valid:true  },
    { id:'t07', from:'Karl',    to:'Lena',   amount:120,  valid:true  },
    { id:'t08', from:'Mia',     to:'Nate',   amount:45,   valid:true  },
    { id:'t09', from:'HACKER',  to:'Bob',    amount:-99,  valid:false },
    { id:'t10', from:'Alice',   to:'Alice',  amount:999,  valid:false },
    { id:'t11', from:'?????',   to:'?????',  amount:0,    valid:false },
    { id:'t12', from:'Spoofer', to:'Carol',  amount:80,   valid:false },
    { id:'t13', from:'Mia',     to:'Bob',    amount:500,  valid:false },
  ];

  // Level 3 exclusive pool — disjoint valid transactions + disjoint fakes for
  // the 3-chain expert tier (so L3 never repeats what L1/L2 already used).
  const TX_POOL_L3 = [
    { id:'t14', from:'Nora',    to:'Omar',   amount:35,   valid:true  },
    { id:'t15', from:'Omar',    to:'Piper',  amount:90,   valid:true  },
    { id:'t16', from:'Piper',   to:'Quinn',  amount:55,   valid:true  },
    { id:'t17', from:'Quinn',   to:'Ravi',   amount:110,  valid:true  },
    { id:'t18', from:'Ravi',    to:'Sara',   amount:25,   valid:true  },
    { id:'t19', from:'Sara',    to:'Tariq',  amount:70,   valid:true  },
    { id:'t20', from:'Tariq',   to:'Uma',    amount:95,   valid:true  },
    { id:'t21', from:'Uma',     to:'Victor', amount:40,   valid:true  },
    { id:'t22', from:'Victor',  to:'Wren',   amount:130,  valid:true  },
    { id:'t23', from:'Wren',    to:'Nora',   amount:60,   valid:true  },
    { id:'t24', from:'PHANTOM', to:'Omar',   amount:-50,  valid:false },
    { id:'t25', from:'Piper',   to:'Piper',  amount:777,  valid:false },
    { id:'t26', from:'0x0000',  to:'0x0000', amount:0,    valid:false },
    { id:'t27', from:'CloneBot',to:'Quinn',  amount:110,  valid:false },
    { id:'t28', from:'Ravi',    to:'Sara',   amount:9999, valid:false },
  ];

  // Number of decoy keys shown alongside the correct one in showKeyChoice(),
  // per level — L3 shows one extra decoy (all 5 KEYS in play) for a harder guess.
  const KEY_DECOYS_BY_LEVEL = { 1: 2, 2: 2, 3: 3 };

  let G = null;

  // ─── Screen factory ──────────────────────────────────────────
  window.SCREENS = window.SCREENS || {};
  window.SCREENS['game_bsv_blockchainblvd'] = function () {
    G = null;
    setTimeout(initGame, 40);
    return `<div id="bsv_bb_root" style="position:absolute;inset:0;background:${BG};overflow:hidden;font-family:Inter,sans-serif;color:#fff;touch-action:none">
      <!-- Top Bar -->
      <div id="bsv_topbar" style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(180deg,rgba(3,4,12,.95),transparent);border-bottom:1px solid rgba(0,255,255,.15)">
        <button id="bsv_back" style="padding:6px 13px;border:1px solid rgba(0,255,255,.35);border-radius:8px;background:rgba(0,255,255,.08);color:${ACCENT};font-family:Inter,sans-serif;font-size:.7rem;letter-spacing:.06em;cursor:pointer">← HUB</button>
        <div style="font-family:Orbitron,sans-serif;font-size:.7rem;letter-spacing:.22em;color:${ACCENT};flex:1;text-align:center;text-shadow:0 0 12px rgba(0,255,255,.5)">⛓ BLOCKCHAIN BLVD</div>
        <div style="display:flex;gap:14px;align-items:center">
          <div style="text-align:right">
            <div style="font-family:Orbitron,sans-serif;font-size:.45rem;letter-spacing:.12em;color:rgba(0,255,255,.5)">SCORE</div>
            <div id="bsv_score" style="font-family:Orbitron,sans-serif;font-size:.9rem;color:${ACCENT}">0</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:Orbitron,sans-serif;font-size:.45rem;letter-spacing:.12em;color:rgba(255,149,0,.6)">TIME</div>
            <div id="bsv_timer" style="font-family:Orbitron,sans-serif;font-size:.9rem;color:${WARN}">90</div>
          </div>
        </div>
      </div>

      <!-- Game Canvas Layer -->
      <canvas id="bsv_canvas" style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas>

      <!-- Main UI layer -->
      <div id="bsv_ui" style="position:absolute;inset:0;pointer-events:none;z-index:10"></div>

      <!-- Overlay -->
      <div id="bsv_overlay" style="position:absolute;inset:0;z-index:30;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.88);backdrop-filter:blur(6px)"></div>
    </div>`;
  };

  // ─── Exit function ────────────────────────────────────────────
  window.bsv_blockchainblvdExit = function () {
    G = null;
    bgParticles = null;
    if (_resizeHandler) {
      window.removeEventListener('resize', _resizeHandler);
      _resizeHandler = null;
    }
    if (window.state) state.viewingWorld = 'builder';
    goTo('hub');
  };

  // ─── Init ─────────────────────────────────────────────────────
  function initGame() {
    const root = document.getElementById('bsv_bb_root');
    if (!root) return;

    const backBtn = document.getElementById('bsv_back');
    if (backBtn) backBtn.onclick = window.bsv_blockchainblvdExit;

    showLevelSelect();
  }

  // ─── Level Select Screen ──────────────────────────────────────
  function showLevelSelect() {
    const ov = document.getElementById('bsv_overlay');
    if (!ov) return;
    ov.style.display = 'flex';
    ov.innerHTML = `
      <div style="max-width:420px;width:90%;text-align:center;padding:24px">
        <div style="font-family:Orbitron,sans-serif;font-size:1.4rem;color:${ACCENT};text-shadow:0 0 20px rgba(0,255,255,.6);margin-bottom:6px">⛓ BLOCKCHAIN BLVD</div>
        <div style="font-size:.8rem;color:rgba(255,255,255,.55);margin-bottom:28px;letter-spacing:.06em">Validate. Order. Seal. Protect the chain.</div>

        <div style="display:flex;flex-direction:column;gap:14px">
          <div onclick="bsv_startLevel(1)" style="cursor:pointer;padding:20px 18px;border:1px solid rgba(0,255,255,.3);border-radius:14px;background:rgba(0,255,255,.06);transition:all .2s" onmouseover="this.style.background='rgba(0,255,255,.12)'" onmouseout="this.style.background='rgba(0,255,255,.06)'">
            <div style="font-family:Orbitron,sans-serif;font-size:.75rem;letter-spacing:.18em;color:${ACCENT};margin-bottom:6px">LVL 1 — LEARN</div>
            <div style="font-size:.75rem;color:rgba(255,255,255,.65);line-height:1.5">Single chain · 5 blocks · No hackers<br>Learn to order, validate &amp; seal blocks</div>
          </div>
          <div onclick="bsv_startLevel(2)" style="cursor:pointer;padding:20px 18px;border:1px solid rgba(255,149,0,.3);border-radius:14px;background:rgba(255,149,0,.05);transition:all .2s" onmouseover="this.style.background='rgba(255,149,0,.1)'" onmouseout="this.style.background='rgba(255,149,0,.05)'">
            <div style="font-family:Orbitron,sans-serif;font-size:.75rem;letter-spacing:.18em;color:${WARN};margin-bottom:6px">LVL 2 — MASTER</div>
            <div style="font-size:.75rem;color:rgba(255,255,255,.65);line-height:1.5">2 parallel chains · 8 blocks · Hacker attacks<br>Fake transactions mixed in · Repair corrupted blocks</div>
          </div>
          <div onclick="bsv_startLevel(3)" style="cursor:pointer;padding:20px 18px;border:1px solid rgba(255,77,157,.35);border-radius:14px;background:rgba(255,77,157,.06);transition:all .2s" onmouseover="this.style.background='rgba(255,77,157,.13)'" onmouseout="this.style.background='rgba(255,77,157,.06)'">
            <div style="font-family:Orbitron,sans-serif;font-size:.75rem;letter-spacing:.18em;color:#ff4d9d;margin-bottom:6px">LVL 3 — EXPERT</div>
            <div style="font-size:.75rem;color:rgba(255,255,255,.65);line-height:1.5">3 parallel chains · 10 blocks · Rapid hacker attacks<br>5 fake transactions to reject · Tightest tolerance</div>
          </div>
        </div>
        <div style="margin-top:22px;font-size:.65rem;color:rgba(255,255,255,.3);line-height:1.6">
          Drag blocks to reorder · Tap to validate · Match key to seal · Reject fakes
        </div>
      </div>`;
  }

  window.bsv_startLevel = function (lvl) {
    const ov = document.getElementById('bsv_overlay');
    if (ov) ov.style.display = 'none';
    startGame(lvl);
  };

  // ─── Game State ───────────────────────────────────────────────
  // Per-level tuning table — every level-specific number lives here so
  // startGame() never needs an if/else ladder that could silently miss L3.
  const LEVEL_TUNING = {
    1: { chainCount: 1, blocksPerChain: [5],          fakeCount: 0, time: 90,  maxCorrupted: 0, hackerInterval: 8,   hackerFloor: 5,   fakeSpawnGap: 4000 },
    2: { chainCount: 2, blocksPerChain: [4, 4],        fakeCount: 3, time: 120, maxCorrupted: 3, hackerInterval: 8,   hackerFloor: 5,   fakeSpawnGap: 4000 },
    3: { chainCount: 3, blocksPerChain: [4, 3, 3],     fakeCount: 5, time: 150, maxCorrupted: 2, hackerInterval: 5.5, hackerFloor: 3,   fakeSpawnGap: 2800 },
  };
  const CHAIN_LABELS = ['CHAIN A', 'CHAIN B', 'CHAIN C'];

  function startGame(level) {
    const tune = LEVEL_TUNING[level] || LEVEL_TUNING[1];

    // Level 3 draws from its own disjoint transaction pool (never repeats L1/L2 content);
    // L1/L2 keep drawing from the original TX_POOL as before.
    const sourcePool = level === 3 ? TX_POOL_L3 : TX_POOL;
    const validTxs = shuffle(sourcePool.filter(t => t.valid));
    const fakeTxs  = shuffle(sourcePool.filter(t => !t.valid));

    // Build N chains per the tuning table's blocksPerChain split
    let cursor = 0;
    const chains = tune.blocksPerChain.map((count, ci) => {
      const slice = validTxs.slice(cursor, cursor + count);
      cursor += count;
      const blocks = shuffle(slice).map((tx, i) => makeBlock(tx, i, false));
      return { id: ci, blocks, completed: false, label: CHAIN_LABELS[ci] || `CHAIN ${ci + 1}` };
    });
    const totalBlocks = tune.blocksPerChain.reduce((a, b) => a + b, 0);
    const incomingFakes = tune.fakeCount > 0
      ? shuffle(fakeTxs).slice(0, tune.fakeCount).map(tx => makeFakeBlock(tx))
      : [];

    // Set correct order index (the "right" order is 0..N based on original index)
    // Blocks have a correctPos; player drags them into correct order
    chains.forEach(ch => {
      ch.blocks.forEach((b, i) => {
        // Randomize display positions
        b.slotIndex = i; // where it currently sits (player changes this)
      });
    });

    G = {
      level,
      chains,
      incomingFakes,      // fake blocks the player must reject
      fakeFeed: [],       // fakes currently visible in feed
      totalBlocks,
      sealed: 0,
      rejected: 0,
      badAdmitted: 0,     // fakes that slipped into chain
      score: 0,
      time: tune.time,
      timeLeft: tune.time,
      maxCorrupted: tune.maxCorrupted,
      fakeSpawnGap: tune.fakeSpawnGap,
      phase: 'play',      // play | won | lost
      hackerTimer: 0,
      hackerInterval: tune.hackerInterval,  // seconds between hacker attacks
      hackerFloor: tune.hackerFloor,        // interval never ramps down past this
      fakeSpawnTimer: 0,
      fakeSpawnInterval: 10,
      // Drag state
      drag: null,         // { chainId, blockId, startX, startY, curX, curY }
      // Selected block for validation / sealing
      selected: null,     // { chainId, blockId, phase: 'validate'|'seal' }
      // Overlay state
      keyChoiceVisible: false,
      keyChoiceFor: null,
      keyChoices: [],
      // Particle effects
      particles: [],
      // Animation
      lastTime: 0,
      startedAt: Date.now(),
      // Layout
      layout: null,
    };

    // Canvas setup
    setupCanvas();
    buildLayout();
    // Inject UI panels
    renderUILayer();

    // Spawn first fake for any level that has fakes queued (L2, L3, ...)
    if (G.incomingFakes.length > 0) {
      spawnNextFake();
    }

    // Start loop
    requestAnimationFrame(gameLoop);
  }

  // ─── Block factories ──────────────────────────────────────────
  function makeBlock(tx, correctPos, corrupted) {
    return {
      id: tx.id,
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      valid: true,
      fake: false,
      correctPos,
      state: 'unordered', // unordered | ordered | validated | sealed | corrupted
      corrupted,
      flagged: false,      // player flagged as suspicious
      sealKey: KEYS[correctPos % KEYS.length],
      animGlow: 0,
    };
  }

  function makeFakeBlock(tx) {
    return {
      id: tx.id,
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      valid: false,
      fake: true,
      state: 'incoming',
      animGlow: 0,
    };
  }

  // ─── Canvas setup ─────────────────────────────────────────────
  let canvas, ctx;
  let _resizeHandler = null;
  function setupCanvas() {
    canvas = document.getElementById('bsv_canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    // Remove any previously registered resize handler before adding a new one
    if (_resizeHandler) {
      window.removeEventListener('resize', _resizeHandler);
      _resizeHandler = null;
    }
    function resize() {
      canvas.width  = canvas.clientWidth  * (window.devicePixelRatio || 1);
      canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      if (G) buildLayout();
    }
    _resizeHandler = resize;
    resize();
    window.addEventListener('resize', resize);
  }

  // ─── Layout computation ───────────────────────────────────────
  function buildLayout() {
    if (!canvas || !G) return;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const topBar = 52;
    const bottomPad = 80;
    const usable = H - topBar - bottomPad;

    const BW = Math.min(300, W * 0.85);
    const BH = 90;
    const chainCount = G.chains.length;

    G.layout = {
      W, H, topBar, BW, BH,
      chainCount,
    };
  }

  // ─── UI Panels (DOM-based for interaction) ─────────────────────
  function renderUILayer() {
    const ui = document.getElementById('bsv_ui');
    if (!ui || !G) return;

    ui.style.pointerEvents = 'auto';

    let html = '';

    // Build chain panels
    const W = G.layout ? G.layout.W : 360;
    const chainCount = G.chains.length;

    G.chains.forEach((ch, ci) => {
      const leftPct = chainCount === 1 ? '50%' : (ci === 0 ? '25%' : '75%');
      const panelW  = chainCount === 1 ? Math.min(420, W * 0.92) : Math.min(200, W * 0.44);

      html += `<div id="bsv_chain_${ci}" style="
        position:absolute;
        top:62px;
        left:${leftPct};
        transform:translateX(-50%);
        width:${panelW}px;
        pointer-events:auto;
      ">
        <div style="font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.2em;color:${ACCENT};text-align:center;margin-bottom:6px;opacity:.7">${ch.label}</div>
        <div id="bsv_slots_${ci}" style="display:flex;flex-direction:column;gap:6px">
          ${ch.blocks.map((b, bi) => blockCardHTML(b, bi, ci, panelW)).join('')}
        </div>
      </div>`;
    });

    // Fake feed panel (any level that has incoming fakes queued — L2, L3, ...)
    const hasFakeFeed = G.incomingFakes.length > 0 || G.fakeFeed.length > 0;
    if (hasFakeFeed) {
      html += `<div id="bsv_fakefeed" style="
        position:absolute;
        bottom:10px;
        left:50%;
        transform:translateX(-50%);
        width:${Math.min(W * 0.92, 440)}px;
        pointer-events:auto;
      ">
        <div style="font-family:Orbitron,sans-serif;font-size:.45rem;letter-spacing:.18em;color:${WARN};text-align:center;margin-bottom:5px">⚠ INCOMING TRANSACTIONS — ACCEPT OR REJECT</div>
        <div id="bsv_feedslots" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center"></div>
      </div>`;
    }

    // Hint bar
    html += `<div id="bsv_hint" style="
      position:absolute;bottom:${hasFakeFeed?'68px':'12px'};left:0;right:0;
      text-align:center;font-size:.6rem;color:rgba(255,255,255,.35);
      font-family:Orbitron,sans-serif;letter-spacing:.1em;pointer-events:none
    ">Drag to reorder · Tap ✓ to validate · Match 🔑 to seal</div>`;

    ui.innerHTML = html;

    // Attach drag+click listeners
    attachBlockListeners();
  }

  function blockCardHTML(block, slotIdx, chainId, panelW) {
    const sm = panelW < 220;
    const stateColor = {
      unordered:  'rgba(0,255,255,.07)',
      ordered:    'rgba(0,255,255,.13)',
      validated:  'rgba(0,200,100,.13)',
      sealed:     'rgba(0,200,100,.22)',
      corrupted:  'rgba(255,60,60,.18)',
    }[block.state] || 'rgba(0,255,255,.07)';

    const borderColor = {
      unordered:  'rgba(0,255,255,.2)',
      ordered:    `${ACCENT}55`,
      validated:  'rgba(0,220,100,.4)',
      sealed:     'rgba(0,220,100,.6)',
      corrupted:  `${DANGER}88`,
    }[block.state] || 'rgba(0,255,255,.2)';

    const stateLabel = {
      unordered: 'UNORDERED',
      ordered:   'ORDERED ✓',
      validated: 'VALIDATED ✓',
      sealed:    'SEALED 🔒',
      corrupted: '⚠ CORRUPTED',
    }[block.state] || '';

    const stateLabelColor = {
      unordered: 'rgba(255,255,255,.35)',
      ordered:   ACCENT,
      validated: '#00DC82',
      sealed:    '#00FF99',
      corrupted: DANGER,
    }[block.state] || 'rgba(255,255,255,.35)';

    const seqNum = block.correctPos + 1;

    let actions = '';
    if (block.state === 'ordered') {
      actions = `<button class="bsv_act" data-chain="${chainId}" data-block="${block.id}" data-action="validate"
        style="padding:4px 8px;border:1px solid rgba(0,255,255,.5);border-radius:6px;background:rgba(0,255,255,.12);color:${ACCENT};font-size:.55rem;cursor:pointer;font-family:Orbitron,sans-serif;letter-spacing:.1em">
        ✓ VALIDATE</button>`;
    } else if (block.state === 'validated') {
      actions = `<button class="bsv_act" data-chain="${chainId}" data-block="${block.id}" data-action="seal"
        style="padding:4px 8px;border:1px solid rgba(0,220,100,.5);border-radius:6px;background:rgba(0,220,100,.12);color:#00DC82;font-size:.55rem;cursor:pointer;font-family:Orbitron,sans-serif;letter-spacing:.1em">
        🔑 SEAL</button>`;
    } else if (block.state === 'corrupted') {
      actions = `<button class="bsv_act" data-chain="${chainId}" data-block="${block.id}" data-action="repair"
        style="padding:4px 8px;border:1px solid rgba(255,149,0,.5);border-radius:6px;background:rgba(255,149,0,.1);color:${WARN};font-size:.55rem;cursor:pointer;font-family:Orbitron,sans-serif;letter-spacing:.1em">
        🔧 REPAIR</button>`;
    }

    return `<div class="bsv_block" id="bsv_block_${chainId}_${block.id}"
      data-chain="${chainId}" data-block="${block.id}" data-slot="${slotIdx}"
      draggable="${block.state==='sealed'?'false':'true'}"
      style="
        background:${stateColor};
        border:1px solid ${borderColor};
        border-radius:10px;
        padding:${sm?'7px 8px':'9px 12px'};
        cursor:${block.state==='sealed'?'default':'grab'};
        user-select:none;
        -webkit-user-select:none;
        transition:border-color .2s, background .2s;
        position:relative;
        box-shadow:0 0 ${block.state==='corrupted'?'12px rgba(255,60,60,.3)':block.state==='sealed'?'10px rgba(0,220,100,.2)':'6px rgba(0,255,255,.05)'};
      ">
      <div style="display:flex;align-items:flex-start;gap:6px">
        <div style="font-family:Orbitron,sans-serif;font-size:.9rem;color:${ACCENT};opacity:.5;min-width:18px">#${seqNum}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
            <div style="font-family:Orbitron,sans-serif;font-size:${sm?'.42rem':'.48rem'};letter-spacing:.12em;color:${stateLabelColor}">${stateLabel}</div>
            ${block.state!=='unordered'&&block.state!=='corrupted'?'':'<div style="font-size:.65rem;cursor:ns-resize;color:rgba(255,255,255,.35);padding:0 2px" class="bsv_drag_handle" data-chain="'+chainId+'" data-block="'+block.id+'">⠿⠿</div>'}
          </div>
          <div style="font-size:${sm?'.62rem':'.68rem'};line-height:1.4;color:rgba(255,255,255,.8)">
            <span style="color:rgba(0,255,255,.7)">${block.from}</span>
            <span style="color:rgba(255,255,255,.4)"> → </span>
            <span style="color:rgba(0,255,255,.7)">${block.to}</span>
            <span style="color:${GOLD};margin-left:6px">$${block.amount}</span>
          </div>
          <div style="font-size:.5rem;color:rgba(255,255,255,.3);margin-top:2px;font-family:monospace">
            HASH: ${hashStr(block.id + block.from + block.amount)}
          </div>
        </div>
      </div>
      ${actions ? `<div style="margin-top:7px;display:flex;justify-content:flex-end">${actions}</div>` : ''}
    </div>`;
  }

  function fakeBlockHTML(block) {
    return `<div class="bsv_fake" id="bsv_fake_${block.id}"
      data-block="${block.id}"
      style="
        background:rgba(255,60,60,.08);
        border:1px solid rgba(255,60,60,.35);
        border-radius:10px;
        padding:9px 11px;
        min-width:150px;
        max-width:200px;
        flex:1;
        position:relative;
      ">
      <div style="font-family:Orbitron,sans-serif;font-size:.45rem;letter-spacing:.15em;color:${WARN};margin-bottom:4px">⚠ CORRUPTED?</div>
      <div style="font-size:.65rem;line-height:1.4;color:rgba(255,255,255,.75)">
        <span style="color:#ff8888">${block.from}</span>
        <span style="color:rgba(255,255,255,.4)"> → </span>
        <span style="color:#ff8888">${block.to}</span>
        <span style="color:${GOLD};margin-left:6px">$${block.amount}</span>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="bsv_feedact" data-block="${block.id}" data-action="accept"
          style="flex:1;padding:4px;border:1px solid rgba(0,255,255,.4);border-radius:6px;background:rgba(0,255,255,.08);color:${ACCENT};font-size:.5rem;cursor:pointer;font-family:Orbitron,sans-serif">
          ACCEPT</button>
        <button class="bsv_feedact" data-block="${block.id}" data-action="reject"
          style="flex:1;padding:4px;border:1px solid rgba(255,60,60,.5);border-radius:6px;background:rgba(255,60,60,.1);color:${DANGER};font-size:.5rem;cursor:pointer;font-family:Orbitron,sans-serif">
          REJECT</button>
      </div>
    </div>`;
  }

  // ─── Fake hash display ────────────────────────────────────────
  function hashStr(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16).padStart(8, '0').toUpperCase().slice(0, 8);
  }

  // ─── Listeners ────────────────────────────────────────────────
  function attachBlockListeners() {
    if (!G) return;

    // Action buttons
    document.querySelectorAll('.bsv_act').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const chainId = parseInt(btn.dataset.chain);
        const blockId = btn.dataset.block;
        const action  = btn.dataset.action;
        handleBlockAction(chainId, blockId, action);
      });
    });

    // Drag-to-reorder on blocks
    let dragSrc = null;
    document.querySelectorAll('.bsv_block').forEach(el => {
      el.addEventListener('dragstart', e => {
        if (!G || G.phase !== 'play') { e.preventDefault(); return; }
        const chainId = parseInt(el.dataset.chain);
        const blockId = el.dataset.block;
        const block = findBlock(chainId, blockId);
        if (!block || block.state === 'sealed') { e.preventDefault(); return; }
        dragSrc = { chainId, blockId, slotIndex: parseInt(el.dataset.slot) };
        e.dataTransfer.effectAllowed = 'move';
        el.style.opacity = '.4';
      });
      el.addEventListener('dragend', e => {
        el.style.opacity = '1';
        dragSrc = null;
      });
      el.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        el.style.borderColor = ACCENT;
      });
      el.addEventListener('dragleave', e => {
        const block = findBlock(parseInt(el.dataset.chain), el.dataset.block);
        el.style.borderColor = block ? stateToColor(block.state) : 'rgba(0,255,255,.2)';
      });
      el.addEventListener('drop', e => {
        e.preventDefault();
        if (!dragSrc) return;
        const targetChainId = parseInt(el.dataset.chain);
        const targetSlot    = parseInt(el.dataset.slot);
        if (dragSrc.chainId !== targetChainId) return; // no cross-chain drag
        performSwap(targetChainId, dragSrc.slotIndex, targetSlot);
      });

      // Touch drag (simplified — just reorder on touchend position)
      setupTouchDrag(el);
    });

    // Fake feed buttons
    document.querySelectorAll('.bsv_feedact').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const blockId = btn.dataset.block;
        const action  = btn.dataset.action;
        handleFeedAction(blockId, action);
      });
    });
  }

  function stateToColor(state) {
    return {
      unordered: 'rgba(0,255,255,.2)',
      ordered:   `${ACCENT}55`,
      validated: 'rgba(0,220,100,.4)',
      sealed:    'rgba(0,220,100,.6)',
      corrupted: `${DANGER}88`,
    }[state] || 'rgba(0,255,255,.2)';
  }

  // ─── Touch drag ───────────────────────────────────────────────
  function setupTouchDrag(el) {
    let startY = 0, startSlot = 0, startChain = 0, startBlockId = '';
    el.addEventListener('touchstart', e => {
      if (!G || G.phase !== 'play') return;
      const block = findBlock(parseInt(el.dataset.chain), el.dataset.block);
      if (!block || block.state === 'sealed') return;
      startY = e.touches[0].clientY;
      startSlot  = parseInt(el.dataset.slot);
      startChain = parseInt(el.dataset.chain);
      startBlockId = el.dataset.block;
    }, { passive: true });

    el.addEventListener('touchend', e => {
      if (!G || G.phase !== 'play') return;
      const endY = e.changedTouches[0].clientY;
      const dy = endY - startY;
      const chain = G.chains[startChain];
      if (!chain) return;
      const BH = 96; // approx block height
      const slotDelta = Math.round(dy / BH);
      if (slotDelta === 0) return;
      const targetSlot = Math.max(0, Math.min(chain.blocks.length - 1, startSlot + slotDelta));
      performSwap(startChain, startSlot, targetSlot);
    }, { passive: true });
  }

  // ─── Swap blocks ──────────────────────────────────────────────
  function performSwap(chainId, slotA, slotB) {
    if (!G) return;
    const chain = G.chains[chainId];
    if (!chain || slotA === slotB) return;
    // Don't swap sealed blocks
    if (chain.blocks[slotA].state === 'sealed' || chain.blocks[slotB].state === 'sealed') return;
    const tmp = chain.blocks[slotA];
    chain.blocks[slotA] = chain.blocks[slotB];
    chain.blocks[slotB] = tmp;
    // Update slotIndex
    chain.blocks.forEach((b, i) => { b.slotIndex = i; });
    // Check if now in order
    checkOrder(chainId);
    rerenderChain(chainId);
  }

  // ─── Order check ─────────────────────────────────────────────
  function checkOrder(chainId) {
    if (!G) return;
    const chain = G.chains[chainId];
    chain.blocks.forEach((b, slotIdx) => {
      if (b.state === 'unordered' && slotIdx === b.correctPos) {
        b.state = 'ordered';
        G.score += 5;
        spawnParticle(slotIdx * 90 + 30, 100 + chainId * 40, ACCENT);
      } else if (b.state === 'ordered' && slotIdx !== b.correctPos) {
        b.state = 'unordered';
      }
    });
    updateScoreDisplay();
  }

  // ─── Block actions ────────────────────────────────────────────
  function handleBlockAction(chainId, blockId, action) {
    if (!G || G.phase !== 'play') return;
    const block = findBlock(chainId, blockId);
    if (!block) return;

    if (action === 'validate') {
      if (block.state !== 'ordered') return;
      block.state = 'validated';
      G.score += 15;
      spawnParticle(100, 200, '#00DC82');
      updateScoreDisplay();
      rerenderChain(chainId);
    } else if (action === 'seal') {
      if (block.state !== 'validated') return;
      showKeyChoice(chainId, blockId, block.sealKey);
    } else if (action === 'repair') {
      if (block.state !== 'corrupted') return;
      // Repair: go back to validated state
      block.state = 'validated';
      G.score += 10;
      spawnParticle(100, 200, WARN);
      updateScoreDisplay();
      rerenderChain(chainId);
    }
  }

  // ─── Key choice modal ─────────────────────────────────────────
  function showKeyChoice(chainId, blockId, correctKey) {
    const block = findBlock(chainId, blockId);
    if (!block) return;

    // Pick N decoy keys including the correct one — decoy count scales with level
    const decoyCount = KEY_DECOYS_BY_LEVEL[G && G.level] || 2;
    const pool = [...KEYS];
    const correct = correctKey;
    const shuffled = shuffle(pool.filter(k => k !== correct)).slice(0, decoyCount);
    const choices = shuffle([correct, ...shuffled]);

    const ov = document.getElementById('bsv_overlay');
    if (!ov) return;
    ov.style.display = 'flex';

    ov.innerHTML = `
      <div style="max-width:340px;width:88%;text-align:center;padding:22px;background:rgba(3,4,12,.92);border:1px solid rgba(0,255,255,.25);border-radius:16px">
        <div style="font-family:Orbitron,sans-serif;font-size:.65rem;letter-spacing:.2em;color:${ACCENT};margin-bottom:6px">🔑 SELECT CRYPTO KEY</div>
        <div style="font-size:.7rem;color:rgba(255,255,255,.55);margin-bottom:16px">
          Block: <span style="color:${ACCENT}">${block.from} → ${block.to} · $${block.amount}</span>
        </div>
        <div style="display:flex;gap:14px;justify-content:center;margin-bottom:18px">
          ${choices.map(k => `
            <button onclick="bsv_selectKey('${chainId}','${blockId}','${k}','${correct}')"
              style="font-size:2rem;width:64px;height:64px;border:2px solid rgba(0,255,255,.3);border-radius:12px;background:rgba(0,255,255,.06);cursor:pointer;transition:all .2s"
              onmouseover="this.style.borderColor='${ACCENT}';this.style.background='rgba(0,255,255,.14)'"
              onmouseout="this.style.borderColor='rgba(0,255,255,.3)';this.style.background='rgba(0,255,255,.06)'"
            >${k}</button>
          `).join('')}
        </div>
        <button onclick="bsv_cancelKey()" style="padding:7px 18px;border:1px solid rgba(255,255,255,.15);border-radius:8px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.5);font-size:.65rem;cursor:pointer">Cancel</button>
      </div>`;
  }

  window.bsv_selectKey = function (chainId, blockId, chosen, correct) {
    const ov = document.getElementById('bsv_overlay');
    if (ov) ov.style.display = 'none';
    if (!G || G.phase !== 'play') return;

    const block = findBlock(parseInt(chainId), blockId);
    if (!block) return;

    if (chosen === correct) {
      block.state = 'sealed';
      G.sealed++;
      G.score += 30;
      spawnParticle(160, 200, '#00FF99');
      // Check win
      checkWin();
    } else {
      // Wrong key — penalty
      G.score = Math.max(0, G.score - 10);
      flashScreen(DANGER);
    }
    updateScoreDisplay();
    rerenderChain(parseInt(chainId));
  };

  window.bsv_cancelKey = function () {
    const ov = document.getElementById('bsv_overlay');
    if (ov) ov.style.display = 'none';
  };

  // ─── Fake feed ────────────────────────────────────────────────
  function spawnNextFake() {
    if (!G || G.incomingFakes.length === 0) return;
    const fake = G.incomingFakes.shift();
    G.fakeFeed.push(fake);
    renderFakeFeed();
  }

  function renderFakeFeed() {
    const feed = document.getElementById('bsv_feedslots');
    if (!feed) return;
    feed.innerHTML = G.fakeFeed.map(fakeBlockHTML).join('');
    // Re-attach listeners
    document.querySelectorAll('.bsv_feedact').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        handleFeedAction(btn.dataset.block, btn.dataset.action);
      });
    });
  }

  function handleFeedAction(blockId, action) {
    if (!G || G.phase !== 'play') return;
    const idx = G.fakeFeed.findIndex(f => f.id === blockId);
    if (idx === -1) return;
    const fake = G.fakeFeed[idx];

    if (action === 'reject') {
      // Correct! Reject the fake
      G.fakeFeed.splice(idx, 1);
      G.rejected++;
      G.score += 20;
      spawnParticle(200, 300, '#00DC82');
      flashScreen('#00DC82', 0.3);
    } else {
      // Wrong! Admitted a fake
      G.fakeFeed.splice(idx, 1);
      G.badAdmitted++;
      G.score = Math.max(0, G.score - 25);
      flashScreen(DANGER, 0.5);
      // Check loss
      if (G.badAdmitted >= G.maxCorrupted) {
        endGame(1);
        return;
      }
    }

    updateScoreDisplay();
    renderFakeFeed();

    // Spawn next fake with delay
    if (G.incomingFakes.length > 0) {
      setTimeout(spawnNextFake, G.fakeSpawnGap || 4000);
    }
  }

  // ─── Hacker attacks (level 2 and up) ──────────────────────────
  function triggerHackerAttack() {
    if (!G || G.level < 2) return;
    // Pick a random validated or ordered block and corrupt it
    const candidates = [];
    G.chains.forEach((ch, ci) => {
      ch.blocks.forEach(b => {
        if (b.state === 'validated' || b.state === 'ordered') {
          candidates.push({ chainId: ci, block: b });
        }
      });
    });
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    target.block.state = 'corrupted';
    flashScreen(DANGER, 0.4);
    spawnParticle(120, 150, DANGER);
    showHackerWarning();
    rerenderChain(target.chainId);
  }

  function showHackerWarning() {
    const hint = document.getElementById('bsv_hint');
    if (!hint) return;
    hint.textContent = '⚠ HACKER ATTACK! Repair corrupted blocks!';
    hint.style.color = DANGER;
    setTimeout(() => {
      if (hint) {
        hint.textContent = 'Drag to reorder · Tap ✓ to validate · Match 🔑 to seal';
        hint.style.color = 'rgba(255,255,255,.35)';
      }
    }, 3000);
  }

  // ─── Win / Loss check ────────────────────────────────────────
  // Star thresholds scale with totalBlocks so L3's larger chains (more blocks
  // sealed = more raw score) require proportionally the same mastery bar as L1/L2.
  function starThresholds() {
    const perBlock = 40; // ~50 max/block minus a margin for imperfect play
    return { t3: G.totalBlocks * perBlock, t2: G.totalBlocks * perBlock * 0.6 };
  }

  function checkWin() {
    if (!G || G.phase !== 'play') return;
    const allSealed = G.chains.every(ch => ch.blocks.every(b => b.state === 'sealed'));
    if (allSealed) {
      // Calculate time bonus
      const timeBonus = Math.max(0, Math.floor((G.timeLeft / G.time) * 50));
      G.score += timeBonus;
      const { t3, t2 } = starThresholds();
      const stars = G.score >= t3 ? 3 : G.score >= t2 ? 2 : 1;
      // Set phase to 'ending' to stop the game loop without triggering endGame's guard
      G.phase = 'ending';
      setTimeout(() => endGame(stars), 800);
    }
  }

  // ─── Re-render ────────────────────────────────────────────────
  function rerenderChain(chainId) {
    if (!G) return;
    const slotsEl = document.getElementById(`bsv_slots_${chainId}`);
    if (!slotsEl) return;
    const chain = G.chains[chainId];
    const panelEl = document.getElementById(`bsv_chain_${chainId}`);
    const panelW = panelEl ? panelEl.offsetWidth : 300;
    slotsEl.innerHTML = chain.blocks.map((b, i) => blockCardHTML(b, i, chainId, panelW)).join('');
    // Re-attach listeners for new elements
    reattachChainListeners(chainId);
  }

  function reattachChainListeners(chainId) {
    const slotsEl = document.getElementById(`bsv_slots_${chainId}`);
    if (!slotsEl) return;

    slotsEl.querySelectorAll('.bsv_act').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        handleBlockAction(parseInt(btn.dataset.chain), btn.dataset.block, btn.dataset.action);
      });
    });

    let dragSrc = null;
    slotsEl.querySelectorAll('.bsv_block').forEach(el => {
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', e => {
        if (!G || G.phase !== 'play') { e.preventDefault(); return; }
        const block = findBlock(parseInt(el.dataset.chain), el.dataset.block);
        if (!block || block.state === 'sealed') { e.preventDefault(); return; }
        dragSrc = { chainId: parseInt(el.dataset.chain), blockId: el.dataset.block, slotIndex: parseInt(el.dataset.slot) };
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => { el.style.opacity = '.35'; }, 0);
      });
      el.addEventListener('dragend', () => { el.style.opacity = '1'; dragSrc = null; });
      el.addEventListener('dragover', e => { e.preventDefault(); el.style.outline = `2px solid ${ACCENT}`; });
      el.addEventListener('dragleave', () => { el.style.outline = 'none'; });
      el.addEventListener('drop', e => {
        e.preventDefault();
        el.style.outline = 'none';
        if (!dragSrc) return;
        const targetSlot = parseInt(el.dataset.slot);
        if (dragSrc.chainId !== parseInt(el.dataset.chain)) return;
        performSwap(dragSrc.chainId, dragSrc.slotIndex, targetSlot);
      });

      setupTouchDrag(el);
    });
  }

  // ─── Game Loop ────────────────────────────────────────────────
  let lastFrameTime = 0;
  function gameLoop(ts) {
    if (!G || G.phase === 'won' || G.phase === 'lost') return;
    const dt = Math.min((ts - lastFrameTime) / 1000, 0.1);
    lastFrameTime = ts;

    if (G.phase === 'play') {
      // Timer
      G.timeLeft -= dt;
      updateTimerDisplay();

      if (G.timeLeft <= 0) {
        G.timeLeft = 0;
        updateTimerDisplay();
        const { t3, t2 } = starThresholds();
        const stars = G.score >= t3 ? 3 : G.score >= t2 ? 2 : G.score > 0 ? 1 : 0;
        endGame(stars);
        return;
      }

      // Hacker timer (level 2 and up)
      if (G.level >= 2) {
        G.hackerTimer += dt;
        if (G.hackerTimer >= G.hackerInterval) {
          G.hackerTimer = 0;
          G.hackerInterval = Math.max(G.hackerFloor || 5, G.hackerInterval - 0.5);
          triggerHackerAttack();
        }
      }
    }

    // Draw background canvas (continues during 'ending' for particle effects)
    drawCanvas(dt);

    requestAnimationFrame(gameLoop);
  }

  // ─── Canvas BG draw ───────────────────────────────────────────
  let bgParticles = null;
  function drawCanvas(dt) {
    if (!canvas || !ctx) return;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;

    // Init bg particles once
    if (!bgParticles) {
      bgParticles = Array.from({ length: 30 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
        r: 1 + Math.random() * 2, alpha: 0.05 + Math.random() * 0.12,
      }));
    }

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,255,255,0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < W; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Floating data cubes (decorative)
    bgParticles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
      ctx.fillStyle = `rgba(0,255,255,${p.alpha})`;
      ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });

    // Draw game particles
    G.particles = G.particles.filter(p => p.life > 0);
    G.particles.forEach(p => {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.life -= dt;
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Flash effect
    if (G._flash) {
      G._flash.t -= dt;
      if (G._flash.t <= 0) { G._flash = null; }
      else {
        ctx.fillStyle = G._flash.color + Math.floor(G._flash.alpha * (G._flash.t / G._flash.maxT) * 255).toString(16).padStart(2, '0');
        ctx.fillRect(0, 0, W, H);
      }
    }
  }

  // ─── Particles ────────────────────────────────────────────────
  function spawnParticle(x, y, color) {
    if (!G) return;
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      G.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 3 + Math.random() * 4,
        color,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1,
      });
    }
  }

  function flashScreen(color, alpha = 0.3) {
    if (!G) return;
    G._flash = { color, alpha, t: 0.35, maxT: 0.35 };
  }

  // ─── HUD updates ──────────────────────────────────────────────
  function updateScoreDisplay() {
    const el = document.getElementById('bsv_score');
    if (el) el.textContent = G ? G.score : '0';
  }

  function updateTimerDisplay() {
    const el = document.getElementById('bsv_timer');
    if (!el || !G) return;
    const t = Math.ceil(G.timeLeft);
    el.textContent = t + 's';
    el.style.color = t <= 15 ? DANGER : t <= 30 ? WARN : '#00DC82';
  }

  // ─── Helpers ─────────────────────────────────────────────────
  function findBlock(chainId, blockId) {
    if (!G) return null;
    const chain = G.chains[chainId];
    if (!chain) return null;
    return chain.blocks.find(b => b.id === blockId) || null;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ─── End Game ─────────────────────────────────────────────────
  function endGame(stars) {
    if (!G) return;
    // Guard against double-invocation (e.g. checkWin timeout racing with timer expiry)
    // Valid entry states: 'play' (timer expiry) or 'ending' (all-sealed win path)
    if (G.phase === 'won' || G.phase === 'lost') return;
    G.phase = stars > 0 ? 'won' : 'lost'; // stops the game loop

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bsv_blockchainblvd', { level: G.level, is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    // Stop hacker / fake timers
    // (gameLoop checks G.phase before continuing)

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const accLabel = G.rejected > 0
      ? `+${G.rejected * 20} REJECTION BONUS`
      : G.badAdmitted === 0 && G.level >= 2
        ? 'FLAWLESS CHAIN!'
        : '';

    const lesson = `A blockchain is a ledger where every transaction is verified before being permanently recorded. One invalid block can corrupt the whole chain — which is why every transaction must be independently validated before it is added.`;

    const ov = document.getElementById('bsv_overlay');
    if (!ov) return;
    ov.style.display = 'flex';
    ov.innerHTML = `
      <div style="max-width:440px;width:92%;text-align:center;padding:26px 22px;background:rgba(3,4,12,.95);border:1px solid rgba(0,255,255,.2);border-radius:18px;box-shadow:0 0 40px rgba(0,255,255,.08)">
        <div style="font-family:Orbitron,sans-serif;font-size:1rem;color:${ACCENT};letter-spacing:.18em;text-shadow:0 0 16px rgba(0,255,255,.5);margin-bottom:4px">
          ${G.phase === 'won' ? 'CHAIN SEALED!' : 'CHAIN BREACHED'}
        </div>
        <div style="font-size:1.8rem;margin:10px 0">${starStr}</div>
        <div style="font-family:Orbitron,sans-serif;font-size:1.5rem;color:${GOLD};margin-bottom:4px">${G.score} PTS</div>
        ${accLabel ? `<div style="font-size:.6rem;color:#00DC82;letter-spacing:.12em;margin-bottom:10px">${accLabel}</div>` : ''}

        <div style="display:flex;gap:10px;justify-content:center;margin:12px 0">
          <div style="padding:10px 14px;background:rgba(0,255,255,.06);border:1px solid rgba(0,255,255,.15);border-radius:10px">
            <div style="font-family:Orbitron,sans-serif;font-size:.4rem;color:rgba(0,255,255,.6);margin-bottom:3px">BLOCKS SEALED</div>
            <div style="font-family:Orbitron,sans-serif;font-size:1rem;color:${ACCENT}">${G.sealed} / ${G.totalBlocks}</div>
          </div>
          ${G.level >= 2 ? `<div style="padding:10px 14px;background:rgba(0,220,100,.05);border:1px solid rgba(0,220,100,.15);border-radius:10px">
            <div style="font-family:Orbitron,sans-serif;font-size:.4rem;color:rgba(0,220,100,.6);margin-bottom:3px">FAKES REJECTED</div>
            <div style="font-family:Orbitron,sans-serif;font-size:1rem;color:#00DC82">${G.rejected}</div>
          </div>` : ''}
          <div style="padding:10px 14px;background:rgba(255,215,0,.05);border:1px solid rgba(255,215,0,.15);border-radius:10px">
            <div style="font-family:Orbitron,sans-serif;font-size:.4rem;color:rgba(255,215,0,.6);margin-bottom:3px">COINS EARNED</div>
            <div style="font-family:Orbitron,sans-serif;font-size:1rem;color:${GOLD}">+${coins}</div>
          </div>
        </div>

        <div style="margin:14px 0 18px;padding:14px;background:rgba(0,255,255,.04);border-left:3px solid ${ACCENT};border-radius:0 8px 8px 0;text-align:left">
          <div style="font-family:Orbitron,sans-serif;font-size:.45rem;color:${ACCENT};letter-spacing:.15em;margin-bottom:6px">⛓ BLOCKCHAIN LESSON</div>
          <div style="font-size:.7rem;line-height:1.6;color:rgba(255,255,255,.7)">${lesson}</div>
        </div>

        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="bsv_playAgain()" style="flex:1;max-width:160px;padding:11px;border:1px solid rgba(0,255,255,.4);border-radius:10px;background:rgba(0,255,255,.1);color:${ACCENT};font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.1em;cursor:pointer">↺ PLAY AGAIN</button>
          <button onclick="bsv_blockchainblvdExit()" style="flex:1;max-width:160px;padding:11px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
        </div>
      </div>`;
  }

  window.bsv_playAgain = function () {
    const ov = document.getElementById('bsv_overlay');
    if (ov) ov.style.display = 'none';
    G = null;
    bgParticles = null;
    showLevelSelect();
  };

  /* ── DEBUG HOOK (dev/QA only) ───────────────────────────────── */
  window._bbDbg = () => G ? {
    level: G.level, phase: G.phase, score: G.score,
    chainCount: G.chains.length,
    blocksPerChain: G.chains.map(c => c.blocks.length),
    totalBlocks: G.totalBlocks, sealed: G.sealed, rejected: G.rejected,
    badAdmitted: G.badAdmitted, maxCorrupted: G.maxCorrupted,
    incomingFakesLeft: G.incomingFakes.length, fakeFeedShown: G.fakeFeed.length,
    hackerInterval: G.hackerInterval, hackerFloor: G.hackerFloor,
    starThresholds: starThresholds(),
  } : null;
  window._bbForceWin = () => {
    if (!G) return 'no active game — call bsv_startLevel(1|2|3) first';
    G.chains.forEach(ch => ch.blocks.forEach(b => { b.state = 'sealed'; }));
    checkWin();
    return 'all blocks force-sealed, checkWin() invoked';
  };

})();
