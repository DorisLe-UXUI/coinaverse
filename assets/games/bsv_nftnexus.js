/* ════════════════════════════════════════════════════════════════
   NFT NEXUS — Bitstream Valley mini-game
   Drag-and-match NFT verification game. Verify authenticity,
   match to rightful owners or reject counterfeits.
   Teaches: digital ownership, blockchain verification, NFT authenticity.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ACCENT      = '#00FFFF';
  const SCREEN_ID   = 'game_bsv_nftnexus';
  const WORLD_ID    = 'risktaker';

  // Per-level tuning — level 3 is tighter on time and stricter on fakes.
  const ROUND_TIME_BY_LEVEL = { 1: 90, 2: 90, 3: 75 }; // seconds
  const MAX_FAKES_BY_LEVEL  = { 1: 2, 2: 2, 3: 1 };    // allowed fake approvals before loss

  // 3-star / 2-star score bars. Level 3's pool is bigger (10 cards vs 6-8)
  // so its bars scale up too, keeping "3 stars" a genuinely harder bar than
  // on level 2 rather than an easier one from having more scoring events.
  const STAR_GOALS_BY_LEVEL = {
    1: { goal3: 1800, goal2: 900 },
    2: { goal3: 1800, goal2: 900 },
    3: { goal3: 2400, goal2: 1200 },
  };

  // ── NFT card data ──────────────────────────────────────────────
  // type: 'original' → must drag to correct owner wallet
  // type: 'fake'     → must drag to REJECT bin
  const NFT_POOL_L1 = [
    {
      id: 'n1', type: 'original',
      name: 'CryptoPunk #7523',
      image: '😎', rarity: 'Legendary',
      collection: 'CryptoPunks',
      blockchain: 'Ethereum',
      creator: '0xb47e...3f1a',
      owner: 'AliceVault',
      market: 'OpenSea',
      tokenId: '#7523',
      hint: 'Matches the creator wallet and Ethereum blockchain.',
    },
    {
      id: 'n2', type: 'fake',
      name: 'CryptoPunk #7523',
      image: '😎', rarity: 'Legendary',
      collection: 'CryptoPunks',
      blockchain: 'BinanceSC',
      creator: '0xf00d...dead',
      owner: 'AliceVault',
      market: 'NFTbay',
      tokenId: '#7523',
      hint: 'Same image, but check the blockchain and creator wallet — counterfeit!',
    },
    {
      id: 'n3', type: 'original',
      name: 'Bored Ape #1492',
      image: '🦍', rarity: 'Rare',
      collection: 'BAYC',
      blockchain: 'Ethereum',
      creator: '0xbc4c...a9e2',
      owner: 'BobWallet',
      market: 'OpenSea',
      tokenId: '#1492',
      hint: 'BAYC official collection on Ethereum — verified original.',
    },
    {
      id: 'n4', type: 'fake',
      name: 'Bored Ape #1492',
      image: '🦍', rarity: 'Rare',
      collection: 'B0red Ape',
      blockchain: 'Ethereum',
      creator: '0xdead...beef',
      owner: 'BobWallet',
      market: 'NFTbay',
      tokenId: '#1492',
      hint: 'Collection name is "B0red Ape" (zero, not O) — obvious fake!',
    },
    {
      id: 'n5', type: 'original',
      name: 'Pixel Fox #0042',
      image: '🦊', rarity: 'Common',
      collection: 'PixelFoxes',
      blockchain: 'Ethereum',
      creator: '0xa1b2...c3d4',
      owner: 'CarlaZone',
      market: 'OpenSea',
      tokenId: '#0042',
      hint: 'Creator wallet matches the PixelFoxes official contract.',
    },
    {
      id: 'n6', type: 'fake',
      name: 'Pixel Fox #0042',
      image: '🦊', rarity: 'Common',
      collection: 'PixelFoxes',
      blockchain: 'Polygon',
      creator: '0xa1b2...c3d4',
      owner: 'CarlaZone',
      market: 'OpenSea',
      tokenId: '#0042',
      hint: 'PixelFoxes only exists on Ethereum. Polygon version is fake!',
    },
  ];

  const NFT_POOL_L2 = [
    {
      id: 'm1', type: 'original',
      name: 'AzukiBot #0334',
      image: '🤖', rarity: 'Epic',
      collection: 'Azuki',
      blockchain: 'Ethereum',
      creator: '0x6c7e...ff91',
      owner: 'DaveVault',
      market: 'OpenSea',
      tokenId: '#0334',
      hint: 'Creator wallet 0x6c7e matches Azuki official contract on Ethereum.',
    },
    {
      id: 'm2', type: 'fake',
      name: 'AzukiBot #0334',
      image: '🤖', rarity: 'Epic',
      collection: 'Azuki',
      blockchain: 'Ethereum',
      creator: '0x6c7f...ff91',
      owner: 'DaveVault',
      market: 'OpenSea',
      tokenId: '#0334',
      hint: 'Creator 0x6c7f vs 0x6c7e — one digit changed. Scammer wallet!',
    },
    {
      id: 'm3', type: 'original',
      name: 'Moon Cat #2277',
      image: '🐱', rarity: 'Rare',
      collection: 'MoonCats',
      blockchain: 'Ethereum',
      creator: '0x0996...8ba3',
      owner: 'EvaSpace',
      market: 'OpenSea',
      tokenId: '#2277',
      hint: 'Matches MoonCats official rescue contract on Ethereum.',
    },
    {
      id: 'm4', type: 'fake',
      name: 'Moon Cat #2277',
      image: '🐱', rarity: 'Rare',
      collection: 'Moc0nCats',
      blockchain: 'Ethereum',
      creator: '0x0996...8ba3',
      owner: 'EvaSpace',
      market: 'NFTbay',
      tokenId: '#2277',
      hint: 'Collection "Moc0nCats" is misspelled and on NFTbay — fake!',
    },
    {
      id: 'm5', type: 'original',
      name: 'CloneX #5501',
      image: '👾', rarity: 'Epic',
      collection: 'CloneX',
      blockchain: 'Ethereum',
      creator: '0x49cf...91ab',
      owner: 'FinnGallery',
      market: 'OpenSea',
      tokenId: '#5501',
      hint: 'RTFKT official CloneX on Ethereum with verified creator wallet.',
    },
    {
      id: 'm6', type: 'fake',
      name: 'CloneX #5501',
      image: '👾', rarity: 'Epic',
      collection: 'CloneX',
      blockchain: 'Polygon',
      creator: '0x49cf...91ab',
      owner: 'FinnGallery',
      market: 'OpenSea',
      tokenId: '#5501',
      hint: 'CloneX is Ethereum only. Polygon version is a counterfeit clone!',
    },
    {
      id: 'm7', type: 'original',
      name: 'Doodle #3881',
      image: '🎨', rarity: 'Common',
      collection: 'Doodles',
      blockchain: 'Ethereum',
      creator: '0x8a90...11fe',
      owner: 'GraceHub',
      market: 'OpenSea',
      tokenId: '#3881',
      hint: 'Official Doodles collection, correct creator, correct chain.',
    },
    {
      id: 'm8', type: 'fake',
      name: 'Doodle #3881',
      image: '🎨', rarity: 'Common',
      collection: 'Doodles',
      blockchain: 'Ethereum',
      creator: '0x8a90...11ff',
      owner: 'GraceHub',
      market: 'Looks Rare',
      tokenId: '#3881',
      hint: 'Last wallet digit ff vs fe — and sold via an unofficial market!',
    },
  ];

  // Level 3 — three blockchains in play, and fakes require checking MULTIPLE
  // fields at once (chain+creator+rarity+market+tokenId format) rather than
  // spotting one obvious mismatch.
  const NFT_POOL_L3 = [
    {
      id: 'p1', type: 'original',
      name: 'MoonWolf #0619',
      image: '🐺', rarity: 'Epic',
      collection: 'MoonWolves',
      blockchain: 'Solana',
      creator: '9pXk...q7Lm',
      owner: 'HaroldReef',
      market: 'OpenSea',
      tokenId: '#0619',
      hint: 'MoonWolves mints only on Solana — chain, creator and market all line up.',
    },
    {
      id: 'p2', type: 'fake',
      name: 'MoonWolf #0619',
      image: '🐺', rarity: 'Epic',
      collection: 'MoonWolves',
      blockchain: 'Ethereum',
      creator: '9pXk...q7Lm',
      owner: 'HaroldReef',
      market: 'OpenSea',
      tokenId: '#0619',
      hint: 'MoonWolves has never minted on Ethereum — this collection lives on Solana only.',
    },
    {
      id: 'p3', type: 'original',
      name: 'Starlit Koi #1145',
      image: '🐟', rarity: 'Rare',
      collection: 'StarlitKoi',
      blockchain: 'Ethereum',
      creator: '0x7d3a...9c21',
      owner: 'IvyLagoon',
      market: 'OpenSea',
      tokenId: '#1145',
      hint: 'Creator wallet 0x7d3a...9c21 matches the StarlitKoi mint contract exactly.',
    },
    {
      id: 'p4', type: 'fake',
      name: 'Starlit Koi #1145',
      image: '🐟', rarity: 'Rare',
      collection: 'StarlitKoi',
      blockchain: 'Ethereum',
      creator: '0x7d3a...9c12',
      owner: 'IvyLagoon',
      market: 'OpenSea',
      tokenId: '#1145',
      hint: 'Middle digits swapped — 9c21 became 9c12. Easy to miss unless you read every character.',
    },
    {
      id: 'p5', type: 'original',
      name: 'Golden Griffin #0087',
      image: '🦅', rarity: 'Common',
      collection: 'GoldenGriffins',
      blockchain: 'Ethereum',
      creator: '0x51ba...2ef0',
      owner: 'JunoPeak',
      market: 'OpenSea',
      tokenId: '#0087',
      hint: 'Common rarity matches the registry — nothing was changed on this one.',
    },
    {
      id: 'p6', type: 'fake',
      name: 'Golden Griffin #0087',
      image: '🦅', rarity: 'Legendary',
      collection: 'GoldenGriffins',
      blockchain: 'Ethereum',
      creator: '0x51ba...2ef0',
      owner: 'JunoPeak',
      market: 'OpenSea',
      tokenId: '#0087',
      hint: 'Rarity was bumped from Common to Legendary to look more valuable — the registry never changed it.',
    },
    {
      id: 'p7', type: 'original',
      name: 'Nova Otter #0303',
      image: '🦦', rarity: 'Epic',
      collection: 'NovaOtters',
      blockchain: 'Polygon',
      creator: '0x2f6e...c88d',
      owner: 'KaiHarbor',
      market: 'OpenSea',
      tokenId: '#0303',
      hint: 'Listed on OpenSea, the marketplace NovaOtters officially trades on.',
    },
    {
      id: 'p8', type: 'fake',
      name: 'Nova Otter #0303',
      image: '🦦', rarity: 'Epic',
      collection: 'NovaOtters',
      blockchain: 'Polygon',
      creator: '0x2f6e...c88d',
      owner: 'KaiHarbor',
      market: 'GemSwap Direct',
      tokenId: '#0303',
      hint: '"GemSwap Direct" is not a real marketplace — chain and creator match, but the listing itself is bait.',
    },
    {
      id: 'p9', type: 'original',
      name: 'Crystal Wyrm #4420',
      image: '🐉', rarity: 'Legendary',
      collection: 'CrystalWyrms',
      blockchain: 'Ethereum',
      creator: '0x8e14...b30a',
      owner: 'LenaFrost',
      market: 'OpenSea',
      tokenId: '#4420',
      hint: 'Token ID format matches the CrystalWyrms contract exactly: four digits, no extra padding.',
    },
    {
      id: 'p10', type: 'fake',
      name: 'Crystal Wyrm #4420',
      image: '🐉', rarity: 'Legendary',
      collection: 'CrystalWyrms',
      blockchain: 'Ethereum',
      creator: '0x8e14...b30a',
      owner: 'LenaFrost',
      market: 'OpenSea',
      tokenId: '#04420',
      hint: 'Token ID has an extra leading zero — #04420 instead of #4420 — a subtle contract mismatch.',
    },
  ];

  // Owners / destinations for matching
  const OWNERS = {
    AliceVault:  { label: 'Alice\'s Vault',   color: '#c084fc', icon: '👩‍💻' },
    BobWallet:   { label: 'Bob\'s Wallet',     color: '#f97316', icon: '🧑‍🎨' },
    CarlaZone:   { label: 'Carla\'s Zone',     color: '#34d399', icon: '👩‍🚀' },
    DaveVault:   { label: 'Dave\'s Vault',     color: '#fbbf24', icon: '🧑‍💻' },
    EvaSpace:    { label: 'Eva\'s Space',      color: '#fb7185', icon: '👩‍🎤' },
    FinnGallery: { label: 'Finn\'s Gallery',   color: '#60a5fa', icon: '🧑‍🎭' },
    GraceHub:    { label: 'Grace\'s Hub',      color: '#a78bfa', icon: '👩‍🏫' },
    HaroldReef:  { label: 'Harold\'s Reef',    color: '#22d3ee', icon: '🧑‍🚀' },
    IvyLagoon:   { label: 'Ivy\'s Lagoon',     color: '#2dd4bf', icon: '👩‍🔬' },
    JunoPeak:    { label: 'Juno\'s Peak',      color: '#facc15', icon: '🧑‍✈️' },
    KaiHarbor:   { label: 'Kai\'s Harbor',     color: '#38bdf8', icon: '🧑‍🎨' },
    LenaFrost:   { label: 'Lena\'s Frost',     color: '#e879f9', icon: '👩‍🎨' },
  };

  // ── State ──────────────────────────────────────────────────────
  let G = null;

  const POOLS = { 1: NFT_POOL_L1, 2: NFT_POOL_L2, 3: NFT_POOL_L3 };

  function makeState(level) {
    const pool = POOLS[level] || NFT_POOL_L1;
    const queue = shuffle(pool.slice());
    // collect unique owners present in this pool
    const presentOwners = [...new Set(queue.filter(n => n.type === 'original').map(n => n.owner))];
    const roundTime = ROUND_TIME_BY_LEVEL[level] || ROUND_TIME_BY_LEVEL[1];
    const maxFakes = MAX_FAKES_BY_LEVEL[level] != null ? MAX_FAKES_BY_LEVEL[level] : MAX_FAKES_BY_LEVEL[1];
    return {
      level,
      phase: 'scanning', // scanning → dragging → result
      queue,
      currentIdx: 0,
      score: 0,
      fakeApprovals: 0,
      correct: 0,
      total: queue.length,
      roundTime,
      maxFakes,
      timeLeft: roundTime,
      scanProgress: 0,
      drag: null,        // { startX, startY, currentX, currentY, el }
      ended: false,
      presentOwners,
      combo: 0,
      floats: [],        // floating text particles
      scanAnim: 0,
    };
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ── Screen registration ────────────────────────────────────────
  window.SCREENS = window.SCREENS || {};

  window.SCREENS[SCREEN_ID] = function () {
    G = null;
    setTimeout(initGame, 40);
    return `<div id="nftnexus-root" style="position:absolute;inset:0;background:radial-gradient(130% 95% at 50% -8%,color-mix(in srgb, ${ACCENT} 15%, #1a1240),#130d32 44%,#0A0429 100%);overflow:hidden;font-family:Inter,sans-serif;color:#fff;touch-action:none">
      <!-- Top bar -->
      <div id="nn-topbar" style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(180deg,rgba(3,4,12,.95),transparent)">
        <button id="nn-back" style="padding:6px 13px;border:1px solid rgba(0,255,255,.35);border-radius:8px;background:rgba(0,255,255,.08);color:#00FFFF;font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.12em;cursor:pointer;flex-shrink:0">← EXIT</button>
        <div style="font-family:Orbitron,sans-serif;font-size:.68rem;letter-spacing:.2em;color:#00FFFF;flex:1;text-align:center;text-shadow:0 0 12px #00FFFF88">NFT NEXUS</div>
        <div id="nn-score-disp" style="font-family:Orbitron,sans-serif;font-size:.75rem;color:#00FFFF;min-width:64px;text-align:right">0 pts</div>
      </div>
      <!-- HUD row -->
      <div style="position:absolute;top:50px;left:0;right:0;z-index:15;display:flex;gap:8px;padding:0 14px;justify-content:space-between;align-items:center">
        <div id="nn-timer-wrap" style="background:rgba(0,255,255,.07);border:1px solid rgba(0,255,255,.2);border-radius:8px;padding:5px 12px;text-align:center">
          <div style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(0,255,255,.6)">TIME</div>
          <div id="nn-timer" style="font-family:Orbitron,sans-serif;font-size:.88rem;color:#00FFFF">90</div>
        </div>
        <div style="background:rgba(0,255,255,.07);border:1px solid rgba(0,255,255,.2);border-radius:8px;padding:5px 12px;text-align:center">
          <div style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,100,100,.7)">FAKES SLIPPED</div>
          <div id="nn-fakes" style="font-family:Orbitron,sans-serif;font-size:.88rem;color:#ff6464">0 / ${MAX_FAKES_BY_LEVEL[1]}</div>
        </div>
        <div style="background:rgba(0,255,255,.07);border:1px solid rgba(0,255,255,.2);border-radius:8px;padding:5px 12px;text-align:center">
          <div style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(0,255,255,.6)">VERIFIED</div>
          <div id="nn-progress" style="font-family:Orbitron,sans-serif;font-size:.88rem;color:#00FFFF">0/0</div>
        </div>
      </div>
      <!-- Level badge -->
      <div id="nn-level-badge" style="position:absolute;top:102px;left:50%;transform:translateX(-50%);z-index:14;font-family:Orbitron,sans-serif;font-size:.5rem;letter-spacing:.18em;color:rgba(0,255,255,.6);text-align:center"></div>
      <!-- Canvas for ambient particles -->
      <canvas id="nn-canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1"></canvas>
      <!-- NFT card area -->
      <div id="nn-card-area" style="position:absolute;top:120px;left:0;right:0;bottom:200px;z-index:10;display:flex;align-items:center;justify-content:center"></div>
      <!-- Drop zones -->
      <div id="nn-zones" style="position:absolute;left:0;right:0;bottom:0;height:190px;z-index:12;padding:0 10px;display:flex;flex-direction:column;gap:6px;padding-bottom:8px"></div>
      <!-- Floating text layer -->
      <canvas id="nn-float-canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:25"></canvas>
      <!-- Overlay -->
      <div id="nn-overlay" style="position:absolute;inset:0;z-index:30;display:none;align-items:center;justify-content:center;background:rgba(3,4,12,.88);backdrop-filter:blur(6px)"></div>
      <!-- Level select -->
      <div id="nn-levelsel" style="position:absolute;inset:0;z-index:28;display:flex;align-items:center;justify-content:center;background:rgba(3,4,12,.92);backdrop-filter:blur(4px)"></div>
    </div>`;
  };

  // ── Init ───────────────────────────────────────────────────────
  function initGame() {
    const root = document.getElementById('nftnexus-root');
    if (!root) return;

    // Back button
    const backBtn = document.getElementById('nn-back');
    if (backBtn) backBtn.onclick = window.bsv_nftnexusExit;

    // Ambient canvas
    const cv = document.getElementById('nn-canvas');
    if (cv) { cv.width = cv.clientWidth; cv.height = cv.clientHeight; }

    // Float canvas
    const fc = document.getElementById('nn-float-canvas');
    if (fc) { fc.width = fc.clientWidth; fc.height = fc.clientHeight; }

    showLevelSelect();
    _ambientRaf = requestAnimationFrame(ambientLoop);
  }

  // ── Level select screen ────────────────────────────────────────
  function showLevelSelect() {
    const el = document.getElementById('nn-levelsel');
    if (!el) return;
    el.style.display = 'flex';
    el.innerHTML = `
      <div style="max-width:360px;width:90%;text-align:center">
        <div style="font-family:'Anton',sans-serif;font-size:1.3rem;letter-spacing:.1em;color:#00FFFF;text-shadow:0 0 20px #00FFFF;margin-bottom:6px">NFT NEXUS</div>
        <div style="font-size:.75rem;color:rgba(255,255,255,.55);margin-bottom:28px;line-height:1.5">Drag NFTs to their rightful owners.<br>Reject the fakes. Trust the blockchain.</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <button id="nn-lvl1" class="nn-shard" style="padding:16px;border:2px solid rgba(0,255,255,.5);border-radius:14px;background:rgba(0,255,255,.08);color:#fff;font-family:Orbitron,sans-serif;font-size:.7rem;letter-spacing:.15em;cursor:pointer;transition:all .2s;box-shadow:0 0 18px rgba(0,255,255,.15)">
            <div style="color:#00FFFF;font-size:.85rem;margin-bottom:4px">LEVEL 1 — LEARN</div>
            <div style="font-family:Inter,sans-serif;font-size:.65rem;color:rgba(255,255,255,.6);letter-spacing:0;font-weight:400;margin-top:4px">1 blockchain · obvious fakes · single market</div>
          </button>
          <button id="nn-lvl2" class="nn-shard" style="padding:16px;border:2px solid rgba(255,100,200,.4);border-radius:14px;background:rgba(255,100,200,.06);color:#fff;font-family:Orbitron,sans-serif;font-size:.7rem;letter-spacing:.15em;cursor:pointer;transition:all .2s;box-shadow:0 0 18px rgba(255,100,200,.12)">
            <div style="color:#ff64c8;font-size:.85rem;margin-bottom:4px">LEVEL 2 — MASTER</div>
            <div style="font-family:Inter,sans-serif;font-size:.65rem;color:rgba(255,255,255,.6);letter-spacing:0;font-weight:400;margin-top:4px">multi-chain · near-identical fakes · scammer wallets</div>
          </button>
          <button id="nn-lvl3" class="nn-shard" style="padding:16px;border:2px solid rgba(255,179,0,.5);border-radius:14px;background:rgba(255,179,0,.07);color:#fff;font-family:Orbitron,sans-serif;font-size:.7rem;letter-spacing:.15em;cursor:pointer;transition:all .2s;box-shadow:0 0 18px rgba(255,179,0,.15)">
            <div style="color:#ffb300;font-size:.85rem;margin-bottom:4px">LEVEL 3 — LEGEND</div>
            <div style="font-family:Inter,sans-serif;font-size:.65rem;color:rgba(255,255,255,.6);letter-spacing:0;font-weight:400;margin-top:4px">3 blockchains · surgical fakes · multi-field verification</div>
          </button>
        </div>
      </div>`;
    document.getElementById('nn-lvl1').onclick = () => startLevel(1);
    document.getElementById('nn-lvl2').onclick = () => startLevel(2);
    document.getElementById('nn-lvl3').onclick = () => startLevel(3);
  }

  // ── Start level ────────────────────────────────────────────────
  const LEVEL_BADGE_TEXT = {
    1: 'LEVEL 1 · LEARN · ETHEREUM ONLY',
    2: 'LEVEL 2 · MASTER · MULTI-CHAIN',
    3: 'LEVEL 3 · LEGEND · TRIPLE-CHECK EVERYTHING',
  };

  function startLevel(level) {
    const sel = document.getElementById('nn-levelsel');
    if (sel) sel.style.display = 'none';
    const over = document.getElementById('nn-overlay');
    if (over) over.style.display = 'none';

    G = makeState(level);

    const badge = document.getElementById('nn-level-badge');
    if (badge) badge.textContent = LEVEL_BADGE_TEXT[level] || LEVEL_BADGE_TEXT[1];

    updateHUD();
    renderDropZones();
    showCurrentCard();
    startTimer();
  }

  // ── Timer ──────────────────────────────────────────────────────
  let _timerHandle = null;
  function startTimer() {
    clearInterval(_timerHandle);
    _timerHandle = setInterval(() => {
      if (!G || G.ended) { clearInterval(_timerHandle); return; }
      G.timeLeft--;
      const el = document.getElementById('nn-timer');
      if (el) {
        el.textContent = G.timeLeft;
        el.style.color = G.timeLeft <= 15 ? '#ff6464' : '#00FFFF';
      }
      if (G.timeLeft <= 0) { clearInterval(_timerHandle); triggerEnd(false, 'timeout'); }
    }, 1000);
  }

  // ── HUD ────────────────────────────────────────────────────────
  function updateHUD() {
    if (!G) return;
    const sc = document.getElementById('nn-score-disp');
    if (sc) sc.textContent = G.score + ' pts';
    const fk = document.getElementById('nn-fakes');
    if (fk) fk.textContent = G.fakeApprovals + ' / ' + G.maxFakes;
    const pr = document.getElementById('nn-progress');
    if (pr) pr.textContent = G.correct + '/' + G.total;
  }

  // ── Drop zones ────────────────────────────────────────────────
  function renderDropZones() {
    if (!G) return;
    const zonesEl = document.getElementById('nn-zones');
    if (!zonesEl) return;

    // Owner wallets row + reject bin
    const ownerKeys = G.presentOwners;
    const ownerBtns = ownerKeys.map(key => {
      const o = OWNERS[key] || { label: key, color: '#00FFFF', icon: '💼' };
      return `<div class="nn-zone nn-owner-zone" data-owner="${key}"
        style="flex:1;min-width:80px;max-width:140px;border:2px dashed rgba(0,255,255,.3);border-radius:12px;background:rgba(0,255,255,.04);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:6px 4px;cursor:pointer;transition:all .25s;position:relative"
      >
        <span style="font-size:1.3rem">${o.icon}</span>
        <div style="font-family:Orbitron,sans-serif;font-size:.38rem;letter-spacing:.1em;color:${o.color};text-align:center;line-height:1.3">${o.label}</div>
        <div style="font-size:.5rem;color:rgba(255,255,255,.35);font-family:Inter,sans-serif;text-align:center">VERIFIED WALLET</div>
      </div>`;
    }).join('');

    zonesEl.innerHTML = `
      <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;flex:1;align-items:stretch">${ownerBtns}</div>
      <div class="nn-zone nn-reject-zone" data-owner="REJECT"
        style="border:2px dashed rgba(255,80,80,.5);border-radius:12px;background:rgba(255,60,60,.05);display:flex;align-items:center;justify-content:center;gap:10px;padding:10px;cursor:pointer;transition:all .25s;position:relative"
      >
        <span style="font-size:1.5rem">🗑️</span>
        <div>
          <div style="font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.14em;color:#ff6464">REJECT BIN</div>
          <div style="font-size:.55rem;color:rgba(255,255,255,.4);font-family:Inter,sans-serif">Drag counterfeits here</div>
        </div>
      </div>`;

    // Zone event listeners (touch+mouse)
    document.querySelectorAll('.nn-zone').forEach(zone => {
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.transform = 'scale(1.04)'; });
      zone.addEventListener('dragleave', () => { zone.style.transform = ''; });
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.style.transform = '';
        const owner = zone.dataset.owner;
        handleDrop(owner, e.clientX, e.clientY);
      });
      // Touch as backup
      zone.addEventListener('touchend', e => { e.preventDefault(); zone.style.transform = ''; });
    });
  }

  // ── Current NFT card ──────────────────────────────────────────
  function showCurrentCard() {
    if (!G) return;
    const area = document.getElementById('nn-card-area');
    if (!area) return;

    if (G.currentIdx >= G.queue.length) {
      triggerEnd(true, 'complete');
      return;
    }

    const nft = G.queue[G.currentIdx];
    G.phase = 'scanning';
    G.scanProgress = 0;

    const chainColor = nft.blockchain === 'Ethereum' ? '#a78bfa' :
                       nft.blockchain === 'Polygon'  ? '#8b5cf6' :
                       nft.blockchain === 'BinanceSC' ? '#f59e0b' :
                       nft.blockchain === 'Solana'    ? '#14f195' : '#00FFFF';

    area.innerHTML = `
      <div id="nn-nft-card"
        draggable="true"
        style="position:relative;width:min(300px,85vw);background:linear-gradient(145deg,#080f1a,#0a1520);border:2px solid rgba(0,255,255,.35);border-radius:18px;padding:18px;box-shadow:0 0 30px rgba(0,255,255,.12),0 8px 32px rgba(0,0,0,.6);cursor:grab;user-select:none;touch-action:none"
      >
        <!-- Scan overlay -->
        <div id="nn-scan-overlay" style="position:absolute;inset:0;border-radius:16px;overflow:hidden;z-index:5;pointer-events:none">
          <div id="nn-scan-bar" style="position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,transparent,#00FFFF,transparent);box-shadow:0 0 12px #00FFFF;transition:top .05s linear"></div>
          <div id="nn-scan-text" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:Orbitron,sans-serif;font-size:.55rem;letter-spacing:.2em;color:#00FFFF;text-shadow:0 0 8px #00FFFF;white-space:nowrap;opacity:1">SCANNING AUTHENTICITY...</div>
          <div style="position:absolute;inset:0;background:rgba(0,255,255,.04)"></div>
        </div>
        <!-- NFT image area -->
        <div style="text-align:center;margin-bottom:14px">
          <div id="nn-nft-emoji" style="font-size:3.5rem;filter:blur(2px);transition:filter .4s">${nft.image}</div>
          <div style="font-family:Orbitron,sans-serif;font-size:.7rem;letter-spacing:.15em;color:#fff;margin-top:6px">${nft.name}</div>
          <div style="font-size:.6rem;color:rgba(255,200,100,.8);font-family:Inter,sans-serif">${nft.rarity}</div>
        </div>
        <!-- Metadata -->
        <div style="display:flex;flex-direction:column;gap:6px;filter:blur(1.5px);transition:filter .4s" id="nn-meta">
          ${metaRow('Collection', nft.collection, '#00FFFF')}
          ${metaRow('Blockchain', nft.blockchain, chainColor)}
          ${metaRow('Creator', nft.creator, 'rgba(255,255,255,.7)')}
          ${metaRow('Token ID', nft.tokenId, 'rgba(255,255,255,.7)')}
          ${metaRow('Market', nft.market, nft.market === 'OpenSea' ? '#2081e2' : '#ff6464')}
        </div>
        <!-- Hint (L1 only) -->
        ${G.level === 1 ? `<div style="margin-top:12px;padding:8px 10px;border-radius:8px;background:rgba(0,255,255,.06);border:1px solid rgba(0,255,255,.18);font-size:.58rem;color:rgba(0,255,255,.75);font-family:Inter,sans-serif;line-height:1.5">💡 ${nft.hint}</div>` : ''}
        <!-- Drag instruction -->
        <div id="nn-drag-hint" style="margin-top:10px;text-align:center;font-family:Orbitron,sans-serif;font-size:.45rem;letter-spacing:.15em;color:rgba(0,255,255,.4);opacity:0;transition:opacity .3s">DRAG TO OWNER OR REJECT</div>
      </div>`;

    const card = document.getElementById('nn-nft-card');
    if (!card) return;

    // Scan animation — runs for 1.1s then reveals card (was 1.8s — trimmed so
    // players spend more time deciding/dragging and less time watching a bar fill)
    let scanStart = null;
    const scanDur = 1100;

    function scanStep(ts) {
      if (!G || G.ended) return;
      if (!scanStart) scanStart = ts;
      const p = Math.min(1, (ts - scanStart) / scanDur);
      const bar = document.getElementById('nn-scan-bar');
      const scanText = document.getElementById('nn-scan-text');
      if (bar) bar.style.top = (p * 100) + '%';
      if (scanText) {
        const frames = ['SCANNING AUTHENTICITY...', 'VERIFYING BLOCKCHAIN...', 'CHECKING CREATOR...', 'CROSS-REFERENCING...'];
        const fi = Math.floor(p * frames.length);
        scanText.textContent = frames[Math.min(fi, frames.length - 1)];
      }
      if (p < 1) {
        requestAnimationFrame(scanStep);
      } else {
        // Reveal
        const overlay = document.getElementById('nn-scan-overlay');
        const emoji = document.getElementById('nn-nft-emoji');
        const meta = document.getElementById('nn-meta');
        const dh = document.getElementById('nn-drag-hint');
        if (overlay) overlay.style.opacity = '0';
        if (emoji) emoji.style.filter = 'blur(0)';
        if (meta) meta.style.filter = 'blur(0)';
        if (dh) dh.style.opacity = '1';
        G.phase = 'dragging';
        setupCardDrag(card, nft);
      }
    }
    requestAnimationFrame(scanStep);
  }

  function metaRow(label, value, color) {
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05)">
      <span style="font-family:Orbitron,sans-serif;font-size:.42rem;letter-spacing:.1em;color:rgba(255,255,255,.4)">${label}</span>
      <span style="font-family:Inter,sans-serif;font-size:.6rem;font-weight:600;color:${color};max-width:55%;text-align:right;word-break:break-all">${value}</span>
    </div>`;
  }

  // ── Card drag (mouse + touch) ──────────────────────────────────
  function setupCardDrag(card, nft) {
    if (!card) return;

    // HTML5 drag
    card.addEventListener('dragstart', e => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', nft.id);
      setTimeout(() => { card.style.opacity = '.4'; }, 0);
    });
    card.addEventListener('dragend', () => { card.style.opacity = '1'; });

    // Touch drag
    let touchStartX = 0, touchStartY = 0;
    let touchOffX = 0, touchOffY = 0;
    let origRect = null;
    let clone = null;

    card.addEventListener('touchstart', e => {
      if (G.phase !== 'dragging') return;
      const t = e.touches[0];
      touchStartX = t.clientX; touchStartY = t.clientY;
      origRect = card.getBoundingClientRect();
      touchOffX = t.clientX - origRect.left;
      touchOffY = t.clientY - origRect.top;

      clone = card.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.left = origRect.left + 'px';
      clone.style.top = origRect.top + 'px';
      clone.style.width = origRect.width + 'px';
      clone.style.zIndex = '100';
      clone.style.pointerEvents = 'none';
      clone.style.opacity = '.88';
      clone.style.transform = 'scale(1.04)';
      clone.style.transition = 'none';
      document.body.appendChild(clone);
      card.style.opacity = '.25';
    }, { passive: true });

    card.addEventListener('touchmove', e => {
      if (!clone) return;
      e.preventDefault();
      const t = e.touches[0];
      clone.style.left = (t.clientX - touchOffX) + 'px';
      clone.style.top = (t.clientY - touchOffY) + 'px';

      // Highlight zone under touch
      document.querySelectorAll('.nn-zone').forEach(z => z.style.transform = '');
      const under = document.elementFromPoint(t.clientX, t.clientY);
      const zone = under && under.closest('.nn-zone');
      if (zone) zone.style.transform = 'scale(1.05)';
    }, { passive: false });

    card.addEventListener('touchend', e => {
      if (!clone) return;
      const t = e.changedTouches[0];
      const cx = t.clientX, cy = t.clientY;
      document.querySelectorAll('.nn-zone').forEach(z => z.style.transform = '');
      if (clone) { clone.remove(); clone = null; }
      card.style.opacity = '1';

      const under = document.elementFromPoint(cx, cy);
      const zone = under && under.closest('.nn-zone');
      if (zone) handleDrop(zone.dataset.owner, cx, cy);
    });
  }

  // ── Drop handler ───────────────────────────────────────────────
  function handleDrop(targetOwner, dropX, dropY) {
    if (!G || G.ended || G.phase !== 'dragging') return;
    G.phase = 'result';

    const nft = G.queue[G.currentIdx];
    let correct = false;
    let pointsDelta = 0;
    let label = '';

    if (nft.type === 'original') {
      if (targetOwner === nft.owner) {
        correct = true;
        G.combo++;
        const comboBonus = Math.max(0, (G.combo - 1)) * 25;
        pointsDelta = 100 + comboBonus + Math.floor(G.timeLeft * 1.5);
        label = G.combo > 1 ? `+${pointsDelta} COMBO x${G.combo}!` : `+${pointsDelta} VERIFIED!`;
        G.correct++;
        maybeStreakBanner(G.combo);
      } else if (targetOwner === 'REJECT') {
        // Rejected a real NFT
        G.combo = 0;
        pointsDelta = -50;
        label = '-50 OOPS — CHECK THE OWNER!';
      } else {
        // Sent to the wrong wallet
        G.combo = 0;
        pointsDelta = -30;
        label = '-30 OOPS — CHECK THE WALLET!';
      }
    } else {
      // type === 'fake'
      if (targetOwner === 'REJECT') {
        correct = true;
        G.combo++;
        const comboBonus = Math.max(0, (G.combo - 1)) * 25;
        pointsDelta = 80 + comboBonus + Math.floor(G.timeLeft * 0.8);
        label = G.combo > 1 ? `+${pointsDelta} FAKE CAUGHT! x${G.combo}` : `+${pointsDelta} FAKE CAUGHT!`;
        G.correct++;
      } else {
        // Approved a fake
        G.fakeApprovals++;
        G.combo = 0;
        pointsDelta = -80;
        label = '-80 COUNTERFEIT APPROVED!';
      }
    }

    G.score = Math.max(0, G.score + pointsDelta);
    updateHUD();

    // Float text
    spawnFloat(label, correct ? '#00FFFF' : '#ff6464', dropX, dropY);
    if (!correct) shakeRoot();

    // Flash the card
    const card = document.getElementById('nn-nft-card');
    if (card) {
      card.style.transition = 'box-shadow .2s, opacity .3s';
      card.style.boxShadow = correct
        ? '0 0 40px rgba(0,255,255,.8), 0 0 80px rgba(0,255,255,.4)'
        : '0 0 40px rgba(255,60,60,.8), 0 0 80px rgba(255,60,60,.4)';
      card.style.opacity = '0';
    }

    // Show result flash
    const area = document.getElementById('nn-card-area');
    if (area) {
      const flash = document.createElement('div');
      flash.style.cssText = `position:absolute;inset:0;border-radius:18px;background:${correct ? 'rgba(0,255,255,.12)' : 'rgba(255,60,60,.12)'};pointer-events:none;animation:nn-flash .5s ease-out forwards`;
      area.appendChild(flash);
      setTimeout(() => flash.remove(), 500);
    }

    // Check end conditions
    if (G.fakeApprovals >= G.maxFakes) {
      setTimeout(() => triggerEnd(false, 'fakes'), 500);
      return;
    }
    if (G.currentIdx + 1 >= G.queue.length) {
      setTimeout(() => triggerEnd(true, 'complete'), 600);
      return;
    }

    // Next card
    G.currentIdx++;
    setTimeout(() => {
      if (!G || G.ended) return;
      showCurrentCard();
    }, 480);
  }

  // ── Shake (wrong drop) ────────────────────────────────────────
  function shakeRoot() {
    const root = document.getElementById('nftnexus-root');
    if (!root) return;
    root.classList.remove('nn-shaking');
    void root.offsetWidth;
    root.classList.add('nn-shaking');
  }

  // ── Floating text ─────────────────────────────────────────────
  function spawnFloat(text, color, x, y) {
    if (!G) return;
    G.floats.push({ text, color, x, y: y || 200, life: 1.0, vy: -1.2 });
  }

  let _floatRaf = null;
  function floatLoop() {
    const fc = document.getElementById('nn-float-canvas');
    if (!fc) return;
    const ctx = fc.getContext('2d');
    fc.width = fc.clientWidth; fc.height = fc.clientHeight;
    ctx.clearRect(0, 0, fc.width, fc.height);

    if (G && G.floats) {
      G.floats = G.floats.filter(f => f.life > 0);
      G.floats.forEach(f => {
        ctx.save();
        ctx.globalAlpha = f.life;
        ctx.font = `bold ${Math.floor(fc.width * 0.045)}px Orbitron, sans-serif`;
        ctx.fillStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 14;
        ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
        f.y += f.vy;
        f.life -= 0.018;
      });
    }
    _floatRaf = requestAnimationFrame(floatLoop);
  }

  // ── Ambient particles ─────────────────────────────────────────
  // Density raised from 28 → 46 (~1.6x) — the card area is a big mostly-empty
  // band around a single centered card, so a livelier data-stream backdrop
  // helps sell "scanning the blockchain" instead of reading as empty space.
  let _particles = [];
  function initParticles(W, H) {
    _particles = [];
    for (let i = 0; i < 46; i++) {
      _particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.5 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.08 - Math.random() * 0.15,
        al: 0.08 + Math.random() * 0.25,
      });
    }
  }

  let _ambientRaf = null;
  function ambientLoop() {
    const cv = document.getElementById('nn-canvas');
    if (!cv) return;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W || cv.height !== H) {
      cv.width = W; cv.height = H;
      initParticles(W, H);
    }
    const ctx = cv.getContext('2d');
    const _nnBg=ctx.createLinearGradient(0,0,W,H);
    _nnBg.addColorStop(0,'#030b16'); _nnBg.addColorStop(0.5,'#050e20'); _nnBg.addColorStop(1,'#03080f');
    ctx.fillStyle=_nnBg; ctx.fillRect(0,0,W,H);

    _particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.al;
      ctx.fillStyle = '#00FFFF';
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      p.x += p.vx; p.y += p.vy;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
    });

    _ambientRaf = requestAnimationFrame(ambientLoop);
  }

  // ── End game ───────────────────────────────────────────────────
  function triggerEnd(won, reason) {
    if (!G || G.ended) return;
    G.ended = true;
    clearInterval(_timerHandle);

    const accuracy = G.total > 0 ? G.correct / G.total : 0;
    const noFakeBonus = G.fakeApprovals === 0;
    // Level 3's pool has more cards (10 vs L1/L2's 6-8) and a tighter clock,
    // so its 3-star bar is raised proportionally — otherwise the larger pool
    // would make 3 stars easier to reach than on level 2, backwards for the
    // hardest tier.
    const starGoals = STAR_GOALS_BY_LEVEL[G.level] || STAR_GOALS_BY_LEVEL[1];
    let stars = 1;
    if (G.score >= starGoals.goal3 && accuracy >= 0.85 && noFakeBonus) stars = 3;
    else if (G.score >= starGoals.goal2 && accuracy >= 0.65) stars = 2;
    else if (G.score > 0 || G.correct > 0) stars = 1;

    if (!won) stars = Math.min(stars, 1);

    const is3star = stars === 3;
    const coins = stars >= 1 && window.cvAwardGame
      ? cvAwardGame('game_bsv_nftnexus', { level: G.level, is3star, isPerfect: is3star })
      : (stars === 3 ? 150 : stars === 2 ? 100 : stars >= 1 ? 50 : 0);
    if (stars < 1 && window.cvSave) cvSave();

    // Integrity delta (weighted toward accuracy)
    const intDelta = Math.round((accuracy * 60) + (noFakeBonus ? 20 : 0) + (stars === 3 ? 20 : stars === 2 ? 10 : 0));
    if (window.state && window.state.blockchainIntegrity !== undefined) {
      state.blockchainIntegrity = Math.min(100, (state.blockchainIntegrity || 50) + intDelta);
    }

    const over = document.getElementById('nn-overlay');
    if (!over) return;
    over.style.display = 'flex';

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const wonColor = won ? '#00FFFF' : '#ff6464';
    const wonText = won ? 'VERIFIED!' : reason === 'timeout' ? 'TIME\'S UP' : 'TOO MANY FAKES';
    const reasonStr = reason === 'timeout' ? 'You ran out of time.' :
                      reason === 'fakes'   ? 'Too many counterfeits slipped through.' :
                      'All NFTs processed.';

    const badges = [];
    if (stars >= 1) badges.push('NFT Collector Badge');
    if (noFakeBonus) badges.push('Authenticity Bonus');
    if (stars === 3) badges.push('Zero Fakes Bonus');

    const confettiHTML = won ? Array.from({ length: 18 }, (_, i) => {
      const emo = ['✦', '●', '▲', '★', '🎨'][i % 5], col = ['#00FFFF', '#fbbf24', '#a855f7', '#34d399'][i % 4];
      return `<span class="nn-confetti" style="left:${4 + Math.random() * 92}%;animation-delay:${(Math.random() * .5).toFixed(2)}s;color:${col}">${emo}</span>`;
    }).join('') : '';

    over.innerHTML = `${confettiHTML}
      <div style="max-width:360px;width:90%;text-align:center">
        <div style="font-family:'Anton',sans-serif;font-size:1.7rem;letter-spacing:.04em;color:${wonColor};text-shadow:0 0 20px ${wonColor};margin-bottom:4px">${wonText}</div>
        <div style="font-size:1.8rem;margin:10px 0;letter-spacing:.1em">${starStr}</div>
        <div style="font-size:.7rem;color:rgba(255,255,255,.5);font-family:Inter,sans-serif;margin-bottom:14px">${reasonStr}</div>
        <!-- Stats -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          ${statBox('Score', G.score + ' pts', '#00FFFF')}
          ${statBox('Verified', G.correct + '/' + G.total, '#a78bfa')}
          ${statBox('Fakes Caught', (G.fakeApprovals === 0 ? 'ALL' : 'MISSED ' + G.fakeApprovals), noFakeBonus ? '#34d399' : '#ff6464')}
          ${statBox('Coins Earned', '+' + coins, '#fbbf24')}
        </div>
        <!-- Badges -->
        ${badges.length > 0 ? `<div style="margin-bottom:14px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center">
          ${badges.map(b => `<div style="padding:4px 10px;border-radius:20px;background:rgba(0,255,255,.1);border:1px solid rgba(0,255,255,.35);font-family:Orbitron,sans-serif;font-size:.4rem;letter-spacing:.1em;color:#00FFFF">${b}</div>`).join('')}
        </div>` : ''}
        <!-- Lesson -->
        <div style="margin-bottom:18px;padding:12px;border-radius:12px;background:rgba(0,255,255,.06);border:1px solid rgba(0,255,255,.2);font-size:.64rem;color:rgba(255,255,255,.75);font-family:Inter,sans-serif;line-height:1.6;text-align:left">
          <div style="font-family:Orbitron,sans-serif;font-size:.45rem;letter-spacing:.15em;color:#00FFFF;margin-bottom:6px">LESSON</div>
          Owning a digital item on the blockchain means having the <strong style="color:#00FFFF">verified original</strong> — not just a copy of the image. Always check the blockchain record, the creator wallet, and the collection before buying or accepting an NFT.
        </div>
        <!-- Buttons -->
        <div style="display:flex;gap:10px">
          <button id="nn-play-again" class="nn-shard" style="flex:1;padding:13px;border:2px solid rgba(0,255,255,.5);border-radius:12px;background:rgba(0,255,255,.1);color:#00FFFF;font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.15em;cursor:pointer;box-shadow:0 0 22px rgba(0,255,255,.25)">PLAY AGAIN</button>
          <button id="nn-hub-btn" style="flex:1;padding:13px;border:2px solid rgba(255,255,255,.2);border-radius:12px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.75);font-family:Orbitron,sans-serif;font-size:.6rem;letter-spacing:.15em;cursor:pointer">← HUB</button>
        </div>
      </div>`;

    document.getElementById('nn-play-again').onclick = () => {
      over.style.display = 'none';
      showLevelSelect();
    };
    document.getElementById('nn-hub-btn').onclick = window.bsv_nftnexusExit;
  }

  function statBox(label, value, color) {
    return `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 8px;text-align:center">
      <div style="font-family:Orbitron,sans-serif;font-size:.38rem;letter-spacing:.1em;color:rgba(255,255,255,.4);margin-bottom:4px">${label}</div>
      <div style="font-family:Orbitron,sans-serif;font-size:.82rem;color:${color};font-variant-numeric:tabular-nums">${value}</div>
    </div>`;
  }

  // ── Exit ───────────────────────────────────────────────────────
  window.bsv_nftnexusExit = function () {
    G = null;
    clearInterval(_timerHandle);
    cancelAnimationFrame(_ambientRaf);
    cancelAnimationFrame(_floatRaf);
    if (window.state) state.viewingWorld = WORLD_ID;
    goTo('hub');
  };

  // ── Debug hooks (console-only, no UI impact) ────────────────────
  window._nnDbg = () => G ? {
    level: G.level, score: G.score, currentIdx: G.currentIdx,
    total: G.total, fakeApprovals: G.fakeApprovals,
    timeLeft: G.timeLeft, phase: G.phase,
  } : null;

  window._nnForceLevel = (lv) => {
    const sel = document.getElementById('nn-levelsel');
    if (sel) sel.style.display = 'none';
    const over = document.getElementById('nn-overlay');
    if (over) over.style.display = 'none';
    startLevel(lv);
  };

  // ── Inject CSS ─────────────────────────────────────────────────
  (function injectCSS() {
    if (document.getElementById('nn-style')) return;
    const s = document.createElement('style');
    s.id = 'nn-style';
    s.textContent = `
      @keyframes nn-flash {
        0%   { opacity: 1; }
        100% { opacity: 0; }
      }
      .nn-zone:hover {
        border-color: rgba(0,255,255,.7) !important;
        background: rgba(0,255,255,.1) !important;
      }
      .nn-reject-zone:hover {
        border-color: rgba(255,80,80,.8) !important;
        background: rgba(255,60,60,.12) !important;
      }
      #nn-nft-card {
        transition: box-shadow .2s, opacity .3s, transform .15s;
      }
      #nn-nft-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 40px rgba(0,255,255,.2), 0 12px 40px rgba(0,0,0,.7) !important;
      }
      @keyframes nnConfettiFall { 0%{transform:translateY(-30px) rotate(0deg);opacity:1} 100%{transform:translateY(440px) rotate(360deg);opacity:0} }
      .nn-confetti { position:absolute;top:-24px;font-size:1.3rem;animation:nnConfettiFall 1.7s ease-in forwards;pointer-events:none;z-index:60; }
      @keyframes nnShake {10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-6px)}40%,60%{transform:translateX(6px)}}
      .nn-shaking { animation:nnShake .4s; }
      .nn-shard { clip-path:polygon(0 0,92% 0,100% 38%,100% 100%,8% 100%,0 62%) !important; transition:filter .15s; }
      .nn-shard:hover { filter:brightness(1.12); }
    `;
    document.head.appendChild(s);
  })();

  // Start loops when screen loads
  const _origScreen = window.SCREENS[SCREEN_ID];
  window.SCREENS[SCREEN_ID] = function () {
    const html = _origScreen();
    // Kick off float loop after a tick
    setTimeout(() => {
      floatLoop();
    }, 60);
    return html;
  };

})();
