/* ════════════════════════════════════════════════════════════════
   BLOCK BUILDER — real canvas arcade (Risk Taker / Bitstream Valley)
   Teaches blockchain: TAP ✅ VALID transactions to fill the current
   BLOCK → MINE it onto the chain. TAP a ⚠️ FRAUD txn = penalty + shake.
   Let fraud scroll off safely. Grab ⚡ / 🛡️ power-ups. Mine N blocks
   or hit the score target before integrity drains. ~75s, ramping.
   3-LEVEL MISSION LADDER: L1 Rookie → L2 Pro (higher goal, faster tiles,
   more fraud, rarer power-ups) → L3 Legend (highest goal, fastest tiles,
   heaviest fraud pressure, rarest power-ups, extra lane).
   Each level has its OWN 4 blockchain lessons (never repeated within a
   level, never repeated across levels).
   Loads after the main script; overrides stub window.SCREENS.game_blockbuilder.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='risktaker', TXN_PER_BLOCK=4;
  const GATE_EVERY=18;   // seconds between Knowledge Gates
  let G=null, raf=null, LV=0;   // LV = current level index (0..2)

  // ── 3-LEVEL SYSTEM — real scaling knobs per level ────────────────────
  //    goal/blocks: targets to win · round: seconds · tileSpd: base tile
  //    speed multiplier · spawnMul: spawn-interval multiplier (lower=faster)
  //    fraudBase/fraudRamp: fraud-tile odds · powerChance: power-up odds
  //    (rarer on higher levels) · lanes: number of scrolling lanes
  const LEVELS=[
    { name:'ROOKIE', goal:900,  blocks:6,  round:75, tileSpd:1.0,  spawnMul:1.0,  fraudBase:0.30, fraudRamp:0.22, powerChance:0.07, lanes:4 },
    { name:'PRO',    goal:1300, blocks:8,  round:78, tileSpd:1.22, spawnMul:0.85, fraudBase:0.36, fraudRamp:0.26, powerChance:0.05, lanes:5 },
    { name:'LEGEND', goal:1800, blocks:10, round:82, tileSpd:1.48, spawnMul:0.72, fraudBase:0.42, fraudRamp:0.30, powerChance:0.035,lanes:5 }
  ];
  function L(){ return LEVELS[LV]; }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

  // LEARN WHILE PLAYING — 12 blockchain lessons, split into 3 disjoint
  // 4-fact slices (L1 → 0-3 · L2 → 4-7 · L3 → 8-11), shuffled per run and
  // never repeated within a level nor across levels
  const FACTS=[
    // LEVEL 1 · fundamentals
    ['⛓️','A block is a container that holds a batch of transactions — fill it, lock it, link it to the chain!'],
    ['✅','Validation checks each transaction before the block can lock. No valid proof = no new block.'],
    ['#️⃣','Every block gets a unique hash — like a fingerprint. Change one byte and the whole hash changes.'],
    ['🔗','Each block stores the hash of the block before it. That\'s the "chain" — one bad link breaks everything.'],
    // LEVEL 2 · trust & security
    ['🔒','Immutability: once a block is written, it can\'t be quietly changed. Hackers have to rewrite every block after it — that\'s why chains are so hard to hack.'],
    ['🗳️','Consensus means enough validators agree the block is correct. One node saying yes isn\'t enough — the whole network must agree.'],
    ['🌐','Decentralization means no single owner controls the chain. Thousands of nodes share the ledger — you can\'t bribe or hack just one.'],
    ['⚠️','Fraud transactions — fake amounts, double-spends, bad signatures — must be rejected before they enter a block. Let them scroll off safely.'],
    // LEVEL 3 · advanced concepts
    ['🤖','Smart contracts are rules that run automatically when conditions are met — no middleman needed.'],
    ['🛡️','Network security = layered defenses: hashing, validation, consensus, and firewalls working together.'],
    ['⏱️','Miners race to solve a puzzle first — the winner adds the next block and earns a reward.'],
    ['📡','Nodes broadcast new blocks to every peer on the network so everyone\'s ledger copy stays in sync.']
  ];

  window.bbInit=function(){ G=null; LV=0; };  // playDistrictGame calls this before goTo

  function reset(){
    G={ phase:'play', score:0, blocks:0, fills:0, combo:0, bestCombo:0,
        accepted:0, fraudHits:0, missed:0, integrity:100, time:L().round,
        tiles:[], parts:[], floats:[], links:[], code:[],
        spawnT:0.6, last:0, started:performance.now(),
        shake:0, flash:0, flashColor:'#38bdf8', mineGlow:0,
        shield:0, validator:0, lanes:L().lanes,
        gateT:GATE_EVERY, gateIdx:0,
        facts:shuffle(FACTS.slice(LV*4,LV*4+4)) };
    // matrix code columns (subtle background)
    for(let i=0;i<26;i++){ G.code.push({x:Math.random(),y:Math.random(),sp:0.05+Math.random()*0.18,ch:rch(),al:0.04+Math.random()*0.1}); }
  }

  // valid / fraud transaction pools — GDD §B: "Sender → Receiver · Amount" format
  const VALID=[
    {t:'Mia → Bob · 5'},{t:'Lab → Dev · 20'},{t:'Ali → Zoe · 3'},
    {t:'Sam → Ana · 8'},{t:'Joe → Kim · 12'},{t:'Pay Invoice · 15'},
    {t:'Stake 10 coins'},{t:'Swap → ETH · 2'},{t:'Tip Dev · 1'},
    {t:'Refund Ana · 8'},{t:'Leo → Max · 6'},{t:'Buy NFT · 4'}
  ];
  const FRAUD=[
    {t:'Double-spend!'},{t:'Fake hash!'},{t:'Duplicate txn!'},{t:'Bad signature!'},
    {t:'Replay attack!'},{t:'Spoofed key!'},{t:'Negative amt!'},{t:'Forged block!'}
  ];
  const CODE_CHARS='01ABCDEF₿x#$0110';
  function rch(){ return CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]; }

  window.SCREENS.game_blockbuilder=function(){
    if(!G) reset();
    setTimeout(bbBoot,30);
    return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#051829,#031019 55%,#020e1a);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(180deg,rgba(2,14,26,.88),transparent)">
        <button onclick="bbExit()" style="padding:7px 14px;border:1px solid rgba(56,189,248,.4);border-radius:9px;background:rgba(56,189,248,.1);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← BITSTREAM</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.2em;color:#38bdf8;flex:1;text-align:center">⛓️ BLOCK BUILDER · <span id="bbLvl">LV ${LV+1}/3</span></div>
        <div id="bbTime" style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:#38bdf8;min-width:46px;text-align:right">${L().round}s</div>
      </div>
      <div style="position:absolute;top:52px;left:0;right:0;z-index:5;display:flex;gap:8px;padding:0 18px;justify-content:center">
        ${hud('SCORE','bbScore','#7dd3fc')}${hud('BLOCKS','bbBlocks','#38bdf8')}${hud('STREAK','bbCombo','#fbbf24')}
      </div>
      <div style="position:absolute;top:118px;left:18px;right:18px;z-index:5">
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:4px"><span>CHAIN INTEGRITY</span><span id="bbIntTxt">100%</span></div>
        <div style="height:10px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid rgba(56,189,248,.25)"><div id="bbIntBar" style="height:100%;width:100%;background:linear-gradient(90deg,#38bdf8,#7dd3fc);transition:width .2s"></div></div>
      </div>
      <canvas id="bbCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>
      <div id="bbHint" style="position:absolute;left:0;right:0;bottom:18px;text-align:center;z-index:4;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.13em;color:rgba(255,255,255,.5);pointer-events:none">TAP ✅ VALID transactions to fill the block · ${TXN_PER_BLOCK} per block · NEVER tap ⚠️ FRAUD · grab 🛡️ Hash Shield &amp; ⚡ Lightning Validator</div>
      <div id="bbFact" style="position:absolute;left:50%;top:150px;transform:translateX(-50%);z-index:6;max-width:80%;display:none;pointer-events:none"></div>
      <div id="bbGate" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(2,12,22,.86);backdrop-filter:blur(5px);padding:22px"></div>
      <div id="bbOver" style="position:absolute;inset:0;z-index:10;display:none;align-items:center;justify-content:center;background:rgba(2,12,22,.84);backdrop-filter:blur(4px)"></div>
    </div>`;
  };
  function hud(label,id,c){ return `<div style="flex:1;max-width:150px;text-align:center;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.18);border-radius:10px;padding:6px"><div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.45)">${label}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:1.1rem;color:${c}">0</div></div>`; }

  function bbBoot(){
    const cv=document.getElementById('bbCanvas'); if(!cv){ return; }
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);
    // tap input (mouse + touch)
    const hit=(clientX,clientY)=>{
      const r=cv.getBoundingClientRect();
      tapAt((clientX-r.left)/r.width,(clientY-r.top)/r.height);
    };
    const md=e=>{ hit(e.clientX,e.clientY); };
    const ts=e=>{ if(e.touches[0]){ hit(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); } };
    cv.addEventListener('mousedown',md);
    cv.addEventListener('touchstart',ts,{passive:false});
    // keyboard: space = mine ready block manually (don't swallow keys for overlay buttons)
    const kd=e=>{ if((e.key===' '||e.key==='Enter') && G&&G.phase==='play'&&G.fills>=TXN_PER_BLOCK){ mineBlock(); e.preventDefault(); } };
    window.addEventListener('keydown',kd);
    G._cleanup=()=>{ window.removeEventListener('resize',size); window.removeEventListener('keydown',kd); cv.removeEventListener('mousedown',md); cv.removeEventListener('touchstart',ts); };
    G.last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  // translate a tap (0..1) into a tile interaction
  function tapAt(nx,ny){
    if(!G || G.phase!=='play') return;
    // find topmost tile under the tap (search reverse for last-drawn = front)
    for(let i=G.tiles.length-1;i>=0;i--){
      const it=G.tiles[i];
      if(it.dead) continue;
      const halfW=0.115, halfH=0.052;
      if(nx>=it.x-halfW && nx<=it.x+halfW && ny>=it.y-halfH && ny<=it.y+halfH){
        if(it.kind==='power'){
          if(it.p==='shield'){ G.shield=20; floatTxt(it.x,it.y,'🛡️ HASH SHIELD','#7dd3fc'); }
          else { G.validator=10; floatTxt(it.x,it.y,'⚡ LIGHTNING VALIDATOR','#fbbf24'); }
          burst(it.x,it.y,'#7dd3fc',12); G.flash=0.3; G.flashColor='#38bdf8';
          it.dead=1; return;
        }
        if(it.kind==='valid'){
          G.combo++; G.bestCombo=Math.max(G.bestCombo,G.combo); G.accepted++;
          const mult=1+Math.floor(G.combo/4);
          const gain=12*mult*(G.validator>0?2:1);
          G.score+=gain; G.fills++;
          burst(it.x,it.y,'#22d3ee',12); floatTxt(it.x,it.y,'+'+gain,'#a5f3fc');
          if(G.combo%4===0){ G.flash=0.3; G.flashColor='#38bdf8'; floatTxt(0.5,0.42,'STREAK x'+mult,'#38bdf8'); }
          it.dead=1;
          if(G.fills>=TXN_PER_BLOCK) mineBlock();
        } else { // fraud tapped
          if(G.shield>0){ G.shield=0; G.flash=0.3; G.flashColor='#7dd3fc'; floatTxt(it.x,it.y,'BLOCKED 🛡️','#7dd3fc'); burst(it.x,it.y,'#7dd3fc',14); it.dead=1; return; }
          G.combo=0; G.fraudHits++; G.integrity=Math.max(0,G.integrity-22);
          G.score=Math.max(0,G.score-30); G.shake=0.45; G.flash=0.4; G.flashColor='#ef4444';
          burst(it.x,it.y,'#ef4444',16); floatTxt(it.x,it.y,'INVALID! -30','#fca5a5');
          it.dead=1;
        }
        return;
      }
    }
  }

  function mineBlock(){
    G.fills=0; G.blocks++;
    const bonus=80+G.combo*4;
    G.score+=bonus; G.mineGlow=1; G.flash=0.5; G.flashColor='#38bdf8'; G.shake=0.18;
    floatTxt(0.5,0.5,'⛏️ BLOCK MINED +'+bonus,'#7dd3fc');
    G.integrity=Math.min(100,G.integrity+6);
    // add a chain link visual + celebratory burst at the stack
    G.links.push({born:performance.now()});
    for(let i=0;i<22;i++){ const a=Math.random()*7,s=0.2+Math.random()*0.6; G.parts.push({x:0.5,y:0.82,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.4,s:2+Math.random()*4,c:i%2?'#38bdf8':'#a5f3fc',life:0.7+Math.random()*0.4,max:1.1}); }
    if(G.blocks>=L().blocks || G.score>=L().goal){ end(true); return; }
    // every block mined → Knowledge Gate (also resets the periodic timer)
    openGate();
  }

  function loop(now){
    const cv=document.getElementById('bbCanvas');
    if(!cv || !G){ cancelAnimationFrame(raf); return; }      // left screen → stop
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    let dt=Math.min(40,now-G.last)/1000; G.last=now;
    if(G.phase==='play'){ update(dt,W,H); }
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  function update(dt,W,H){
    G.time-=dt; if(G.time<=0){ G.time=0; return end(); }
    const tEl=document.getElementById('bbTime'); if(tEl) tEl.textContent=Math.ceil(G.time)+'s';
    const prog=1-(G.time/L().round);

    // Knowledge Gate every ~GATE_EVERY seconds — pauses everything until GOT IT
    G.gateT-=dt; if(G.gateT<=0){ openGate(); return; }

    // spawn scrolling transaction tiles across lanes (left → right) —
    // per-level tileSpd/spawnMul/fraud/powerChance make each level distinct
    G.spawnT-=dt;
    if(G.spawnT<=0){
      G.spawnT=Math.max(0.42,(1.0-prog*0.5)*L().spawnMul);
      const lane=Math.floor(Math.random()*G.lanes);
      const laneY=0.30+lane*(G.lanes>4?0.082:0.10);          // lanes sit in the upper play field
      const speed=(0.16+prog*0.22+Math.random()*0.06)*L().tileSpd;
      const roll=Math.random();
      const fraudChance=L().fraudBase+prog*L().fraudRamp;
      const powerChance=L().powerChance;
      if(roll<powerChance){ // power-up (rarer on higher levels)
        const p=Math.random()<0.5?'shield':'validator';
        G.tiles.push({x:-0.14,y:laneY,vx:speed*0.85,kind:'power',p,e:p==='shield'?'🛡️':'⚡',t:p==='shield'?'Hash Shield':'Lightning Validator'});
      } else if(roll<powerChance+fraudChance){
        const f=FRAUD[Math.floor(Math.random()*FRAUD.length)];
        G.tiles.push({x:-0.14,y:laneY,vx:speed,kind:'fraud',e:'⚠️',t:f.t});
      } else {
        const v=VALID[Math.floor(Math.random()*VALID.length)];
        G.tiles.push({x:-0.14,y:laneY,vx:speed,kind:'valid',e:'✅',t:v.t});
      }
    }

    // move tiles; valid escaping = small miss + combo reset; fraud dodged = good
    for(const it of G.tiles){
      it.x+=it.vx*dt;
      if(it.x>1.16){
        if(it.kind==='valid'){ G.combo=0; G.missed++; }
        else if(it.kind==='fraud'){ if(Math.random()<0.5) showFact('⚠️ Fraud dodged — let bad txns scroll off!'); }
        it.dead=1;
      }
    }
    G.tiles=G.tiles.filter(t=>!t.dead);

    // timers
    if(G.shield>0) G.shield-=dt;
    if(G.validator>0) G.validator-=dt;
    if(G.shake>0) G.shake-=dt;
    if(G.flash>0) G.flash-=dt;
    if(G.mineGlow>0) G.mineGlow-=dt*1.6;

    // particles + floats + matrix code
    for(const p of G.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=1.5*dt; p.life-=dt; }
    G.parts=G.parts.filter(p=>p.life>0);
    for(const f of G.floats){ f.y-=dt*0.10; f.life-=dt; }
    G.floats=G.floats.filter(f=>f.life>0);
    for(const c of G.code){ c.y+=c.sp*dt; if(c.y>1.05){ c.y=-0.05; c.x=Math.random(); c.ch=rch(); } if(Math.random()<0.02) c.ch=rch(); }

    // HUD sync
    setTxt('bbScore',G.score); setTxt('bbBlocks',G.blocks+'/'+L().blocks); setTxt('bbCombo','x'+G.combo);
    const ib=document.getElementById('bbIntBar'); if(ib){ ib.style.width=G.integrity+'%'; ib.style.background=G.integrity<35?'linear-gradient(90deg,#ef4444,#f87171)':'linear-gradient(90deg,#38bdf8,#7dd3fc)'; }
    const it2=document.getElementById('bbIntTxt'); if(it2) it2.textContent=Math.round(G.integrity)+'%';

    if(G.integrity<=0) return end(false);
  }

  const _bbStars=Array.from({length:40},()=>({x:Math.random(),y:Math.random(),r:Math.random()*0.9+0.2,s:Math.random()*0.4+0.15}));
  function _bbBg(ctx,W,H,now){
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#020c14'); bg.addColorStop(0.5,'#030e1c'); bg.addColorStop(1,'#050f1a');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    // starfield
    const t=now/1000;
    for(const st of _bbStars){
      const tw=0.3+0.4*Math.sin(t*st.s+st.x*6.28);
      ctx.globalAlpha=tw*0.55; ctx.fillStyle='#38bdf8';
      ctx.beginPath(); ctx.arc(st.x*W,st.y*H*0.6,st.r,0,6.28); ctx.fill();
    }
    ctx.globalAlpha=1;
    // ambient top glow
    const tg=ctx.createRadialGradient(W/2,0,0,W/2,0,W*0.7);
    tg.addColorStop(0,'rgba(56,189,248,.09)'); tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg; ctx.fillRect(0,0,W,H);
  }

  function render(ctx,W,H,now){
    _bbBg(ctx,W,H,now);
    let ox=0,oy=0; if(G.shake>0){ ox=(Math.random()-.5)*G.shake*24; oy=(Math.random()-.5)*G.shake*24; }
    ctx.save(); ctx.translate(ox,oy);

    // matrix-ish falling code (subtle background)
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font="14px 'Orbitron',monospace";
    for(const c of G.code){ ctx.globalAlpha=c.al; ctx.fillStyle='#38bdf8'; ctx.fillText(c.ch,c.x*W,c.y*H); }
    ctx.globalAlpha=1;

    // lane guide rails (faint)
    ctx.strokeStyle='rgba(56,189,248,.1)'; ctx.lineWidth=1;
    for(let l=0;l<G.lanes;l++){ const y=(0.30+l*0.10)*H; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    if(G.flash>0){ const a=G.flash*0.28; ctx.fillStyle=hexA(G.flashColor,a); ctx.fillRect(0,0,W,H); }

    // ── the growing CHAIN of mined blocks (bottom-left stack) ──
    drawChain(ctx,W,H,now);

    // ── current block being filled (bottom-center anvil) ──
    drawBuildStack(ctx,W,H,now);

    // ── scrolling transaction tiles ──
    for(const it of G.tiles){
      drawTile(ctx,it,W,H,now);
    }

    // particles
    for(const p of G.parts){ ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); }
    ctx.globalAlpha=1;

    // float texts
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const f of G.floats){ ctx.globalAlpha=Math.max(0,f.life/0.9); ctx.fillStyle=f.c; ctx.font='800 '+(f.big?22:15)+"px 'Inter',sans-serif"; ctx.fillText(f.t,f.x*W,f.y*H); }
    ctx.globalAlpha=1;

    // active power-up indicators
    ctx.textAlign='left'; ctx.font="11px 'Orbitron',sans-serif";
    let iy=H-46;
    if(G.shield>0){ ctx.fillStyle='#7dd3fc'; ctx.fillText('🛡️ HASH SHIELD '+Math.ceil(G.shield)+'s',16,iy); iy-=16; }
    if(G.validator>0){ ctx.fillStyle='#fbbf24'; ctx.fillText('⚡ LIGHTNING VALIDATOR '+Math.ceil(G.validator)+'s',16,iy); }

    ctx.restore();
  }

  // draws a single transaction tile as a glowing neon cube/card
  function drawTile(ctx,it,W,H,now){
    const x=it.x*W, y=it.y*H;
    const w=W*0.21, h=H*0.082;
    let col,glow,txtc;
    if(it.kind==='valid'){ col='rgba(34,211,238,.16)'; glow='#22d3ee'; txtc='#a5f3fc'; }
    else if(it.kind==='fraud'){ col='rgba(239,68,68,.16)'; glow='#ef4444'; txtc='#fca5a5'; }
    else { col='rgba(251,191,36,.18)'; glow='#fbbf24'; txtc='#fde68a'; }
    // pulsing glow for fraud / power
    const pulse=(it.kind!=='valid')?(0.6+0.4*Math.sin(now*0.006)):1;
    ctx.save();
    ctx.shadowColor=glow; ctx.shadowBlur=(it.kind==='valid'?10:18)*pulse;
    ctx.fillStyle=col; ctx.strokeStyle=glow; ctx.lineWidth=1.6;
    rr(ctx,x-w/2,y-h/2,w,h,9); ctx.fill(); ctx.stroke();
    ctx.shadowBlur=0;
    // emoji icon
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.font=(h*0.62)+'px serif';
    ctx.fillText(it.e,x-w/2+10,y);
    // label
    ctx.fillStyle=txtc; ctx.font="700 "+Math.max(11,h*0.28)+"px 'Inter',sans-serif";
    ctx.fillText(it.t,x-w/2+10+h*0.7,y);
    ctx.restore();
  }

  // the building stack of cubes for the in-progress block
  function drawBuildStack(ctx,W,H,now){
    const cx=W*0.5, baseY=H*0.86, cw=W*0.052, ch=cw*0.62, gap=cw*0.16;
    // anvil label
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(125,211,252,.7)'; ctx.font="10px 'Orbitron',sans-serif";
    ctx.fillText('BUILDING BLOCK  '+G.fills+' / '+TXN_PER_BLOCK,cx,baseY+ch*1.1);
    // slots
    for(let i=0;i<TXN_PER_BLOCK;i++){
      const filled=i<G.fills;
      const bx=cx-(cw+gap)*(TXN_PER_BLOCK-1)/2 + i*(cw+gap);
      ctx.save();
      if(filled){
        const g=ctx.createLinearGradient(0,baseY-ch,0,baseY+ch);
        g.addColorStop(0,'#7dd3fc'); g.addColorStop(1,'#0ea5e9');
        ctx.shadowColor='#38bdf8'; ctx.shadowBlur=14+(G.mineGlow>0?G.mineGlow*22:0);
        ctx.fillStyle=g; ctx.strokeStyle='#bae6fd';
      } else {
        ctx.fillStyle='rgba(56,189,248,.05)'; ctx.strokeStyle='rgba(56,189,248,.25)'; ctx.setLineDash([4,3]);
      }
      ctx.lineWidth=1.6; rr(ctx,bx-cw/2,baseY-ch/2,cw,ch,5); ctx.fill(); ctx.stroke();
      if(filled){ ctx.shadowBlur=0; ctx.fillStyle='rgba(2,14,26,.55)'; ctx.font=(ch*0.7)+'px serif'; ctx.textAlign='center'; ctx.fillText('🧊',bx,baseY); }
      ctx.restore();
    }
  }

  // the chain of already-mined blocks marching from the left
  function drawChain(ctx,W,H,now){
    const y=H*0.86, s=Math.min(W*0.042,30), gap=s*0.55;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const startX=W*0.06;
    const shown=Math.min(G.blocks,5);
    for(let i=0;i<shown;i++){
      const x=startX+i*(s+gap);
      // link
      if(i>0){ ctx.strokeStyle='rgba(56,189,248,.5)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-(s+gap)+s*0.5,y); ctx.lineTo(x-s*0.5,y); ctx.stroke(); }
      ctx.save();
      const fresh=(i===shown-1)?G.mineGlow:0;
      ctx.shadowColor='#38bdf8'; ctx.shadowBlur=10+fresh*26;
      const g=ctx.createLinearGradient(0,y-s,0,y+s);
      g.addColorStop(0,'#38bdf8'); g.addColorStop(1,'#075985');
      ctx.fillStyle=g; ctx.strokeStyle='#7dd3fc'; ctx.lineWidth=1.5;
      rr(ctx,x-s/2,y-s/2,s,s,6); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    if(G.blocks>5){ ctx.fillStyle='rgba(125,211,252,.8)'; ctx.font="12px 'Anton',sans-serif"; ctx.fillText('+'+(G.blocks-5),startX+5*(s+gap),y); }
  }

  // helpers
  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function hexA(hex,a){ const h=hex.replace('#',''); const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }
  function burst(x,y,c,n){ for(let i=0;i<n;i++){ const a=Math.random()*7,s=0.15+Math.random()*0.5; G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.2,s:2+Math.random()*3,c,life:0.5+Math.random()*0.3,max:0.8}); } }
  function floatTxt(x,y,t,c){ G.floats.push({x,y,t,c,life:0.9,big:t.indexOf('STREAK')>=0||t.indexOf('MINED')>=0}); }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

  // ── LEARN WHILE PLAYING ──
  // brief fact toast (doesn't pause the game)
  function showFact(txt){ const el=document.getElementById('bbFact'); if(!el||!txt) return;
    el.style.display='block';
    el.innerHTML=`<div style="background:rgba(2,12,22,.82);border:1px solid rgba(56,189,248,.6);border-radius:12px;padding:9px 16px;font-size:.82rem;color:#fff;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.5)">${txt}</div>`;
    clearTimeout(window._bbFactT); window._bbFactT=setTimeout(()=>{ const e=document.getElementById('bbFact'); if(e) e.style.display='none'; },2200);
  }

  // full-screen Knowledge Gate — PAUSES the game (phase!=='play' freezes update())
  // draws from THIS level's shuffled slice of 4 (G.facts); once all 4 shown,
  // gates silently skip so no tip ever repeats within or across levels
  function openGate(){
    if(!G||G.phase!=='play') return;
    if(G.gateIdx>=G.facts.length){ G.gateT=GATE_EVERY; return; }
    G.phase='gate';
    const f=G.facts[G.gateIdx]; G.gateIdx++;
    const o=document.getElementById('bbGate'); if(!o){ G.phase='play'; G.gateT=GATE_EVERY; return; }
    o.style.display='flex';
    o.innerHTML=`<div style="max-width:440px;text-align:center;padding:30px 26px;border:1px solid #38bdf8;border-radius:22px;background:linear-gradient(160deg,rgba(5,30,48,.97),rgba(3,16,25,.97));box-shadow:0 0 50px rgba(56,189,248,.4);animation:bbGateIn .35s ease">
      <style>@keyframes bbGateIn{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}</style>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.2em;color:#7dd3fc;margin-bottom:10px">⛓️ KNOWLEDGE GATE · BITSTREAM VALLEY · LV ${LV+1}</div>
      <div style="font-size:2.4rem;margin-bottom:8px">${f[0]}</div>
      <p style="font-size:1.02rem;line-height:1.5;color:#fff;margin:0 0 18px">${f[1]}</p>
      <button onclick="bbGateGo()" style="padding:13px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#38bdf8,#0ea5e9);color:#031019;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.12em;font-weight:900;cursor:pointer">GOT IT → +40</button>
    </div>`;
  }
  // resume cleanly + small reward (mirrors frGateGo)
  window.bbGateGo=function(){ if(!G) return; G.score+=40; G.integrity=Math.min(100,G.integrity+4); G.gateT=GATE_EVERY; G.phase='play';
    const o=document.getElementById('bbGate'); if(o){ o.style.display='none'; o.innerHTML=''; }
    G.flash=0.3; G.flashColor='#38bdf8'; floatTxt(0.5,0.42,'+40 LEARNED','#7dd3fc');
    if(G.last!=null) G.last=performance.now();   // avoid a dt spike on resume
  };

  // GDD §04 & §13: surface a blockchain lesson on every end screen
  const END_LESSONS=[
    {icon:'⛓️', concept:'What a Blockchain Is', text:'A blockchain is a chain of locked blocks — each one holding verified transactions. Once sealed, a block can\'t be secretly altered without breaking every block after it.'},
    {icon:'#️⃣', concept:'Hashes & Previous-Hash Links', text:'Every block has a unique hash fingerprint, and stores the previous block\'s hash. Change even one transaction and the hash breaks — the chain snaps apart instantly.'},
    {icon:'✅', concept:'Validation', text:'Before any block is added, validators must check every transaction is real. No valid proof = the block gets rejected. That\'s the first line of defence against fraud.'},
    {icon:'🔒', concept:'Immutability', text:'Once written, blockchain history can\'t be quietly changed. A hacker would have to rewrite every single block after the target — and outpace the whole network. Nearly impossible.'},
    {icon:'🗳️', concept:'Consensus', text:'The network only accepts a block when enough validators agree it\'s correct. One node saying yes isn\'t enough — majority rules. That\'s consensus.'},
    {icon:'🌐', concept:'Decentralization', text:'No single server, company, or person controls the chain. Thousands of nodes share the ledger — take one down and the rest keep going. That\'s why it\'s so resilient.'},
    {icon:'⚠️', concept:'Fraud & Network Security', text:'Fraud transactions — fake amounts, double-spends, bad signatures — must be caught before entering a block. Layers of hashing, validation, and consensus make the Coinaverse Network nearly unbreakable.'}
  ];

  function end(win){
    if(G.phase==='over') return; G.phase='over';
    const score=G.score;
    const won=win || G.blocks>=L().blocks || score>=L().goal;
    const lvl=LV+1, isFinal=LV>=2;
    let _bbCoins=0;
    if(window.state){
      state.gamesDone=state.gamesDone||{}; state.gamesDone['risktaker:0']=1;
      if(won && window.cvAwardGame){
        const stars=G.integrity>70?3:(G.integrity>40?2:1);
        _bbCoins=cvAwardGame('game_blockbuilder',{level:lvl,stars,badge:'Chain Master',is3star:stars===3,isPerfect:stars===3,isFlagship:true});
      } else {
        _bbCoins=50; state.coins=(state.coins||0)+_bbCoins;   // consolation, no farming value
        if(window.cvAddXP) cvAddXP(10,0); if(window.cvSave) cvSave();
      }
    }
    const survived=G.integrity>0;
    // pick lesson based on how many gates were shown (cycles through concepts)
    const lesson=END_LESSONS[G.gateIdx % END_LESSONS.length];
    const o=document.getElementById('bbOver'); if(!o) return; o.style.display='flex';
    const P="padding:13px 26px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#38bdf8,#0ea5e9);color:#031019;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;font-weight:900;cursor:pointer";
    const GH="padding:13px 26px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;cursor:pointer";
    const title = won ? (isFinal ? '👑 ALL 3 LEVELS MASTERED!' : 'MISSION ACCOMPLISHED — LEVEL '+lvl+' ✔') : 'NICE TRY! POWER UP AND TRY AGAIN';
    const sub = won ? 'CHAIN VALIDATED!' : (survived?"OOPS — the clock beat the chain":'OOPS — chain integrity hit zero');
    const btns = won
      ? (isFinal
          ? '<button onclick="bbRestart()" style="'+GH+'">↺ REPLAY L3</button><button onclick="bbExit()" style="'+P+'">← HUB</button>'
          : '<button onclick="bbNextLevel()" style="'+P+'">LEVEL '+(lvl+1)+' ▶</button><button onclick="bbRestart()" style="'+GH+'">↺ REPLAY</button><button onclick="bbExit()" style="'+GH+'">← HUB</button>')
      : '<button onclick="bbRestart()" style="'+P+'">↺ TRY AGAIN</button><button onclick="bbExit()" style="'+GH+'">← HUB</button>';
    o.innerHTML=`<div style="max-width:440px;text-align:center;padding:34px 28px;border:1px solid ${won?'#38bdf8':(survived?'#7dd3fc':'#ef4444')};border-radius:22px;background:linear-gradient(160deg,rgba(5,30,48,.97),rgba(3,16,25,.97));box-shadow:0 0 60px rgba(56,189,248,.4)">
      <div style="font-size:3rem;margin-bottom:8px">${won?(isFinal?'👑':'⛓️'):(survived?'🧊':'💥')}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:${won?'#fbbf24':(survived?'#7dd3fc':'#ef4444')};margin-bottom:6px">${title}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:8px">${sub}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:2rem;margin:0 0 6px">${score} pts</h1>
      <p style="color:rgba(255,255,255,.65);margin:0 0 14px;font-size:.9rem">LEVEL ${lvl}/3 · ${G.blocks} blocks mined · best streak x${G.bestCombo} · ${G.fraudHits} fraud accepted · +${_bbCoins} 🪙</p>
      <div style="background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.3);border-radius:14px;padding:14px 16px;margin-bottom:18px;text-align:left">
        <div style="font-family:'Orbitron',sans-serif;font-size:.45rem;letter-spacing:.16em;color:#7dd3fc;margin-bottom:6px">⛓️ BLOCKCHAIN CONCEPT · ${lesson.concept.toUpperCase()}</div>
        <div style="font-size:1.5rem;margin-bottom:6px">${lesson.icon}</div>
        <p style="font-size:.82rem;line-height:1.55;color:rgba(255,255,255,.88);margin:0">${lesson.text}</p>
      </div>
      ${btns}
    </div>`;
  }

  window.bbRestart=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); clearTimeout(window._bbFactT); reset(); ['bbOver','bbGate'].forEach(id=>{const o=document.getElementById(id);if(o){o.style.display='none';o.innerHTML='';}}); const ft=document.getElementById('bbFact'); if(ft)ft.style.display='none'; bbBoot(); };
  // advance to the next level IN PLACE: release listeners, re-init state at
  // LV+1, refresh the level chip, then re-boot the canvas (bbRestart-style)
  window.bbNextLevel=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); clearTimeout(window._bbFactT); LV=Math.min(2,LV+1); reset(); ['bbOver','bbGate'].forEach(id=>{const o=document.getElementById(id);if(o){o.style.display='none';o.innerHTML='';}}); const ft=document.getElementById('bbFact'); if(ft)ft.style.display='none'; const lt=document.getElementById('bbLvl'); if(lt) lt.textContent='LV '+(LV+1)+'/3'; bbBoot(); };
  window.bbExit=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); clearTimeout(window._bbFactT); G=null; if(window.state)state.viewingWorld=state._returnHub||'risktaker'; goTo('hub'); };

  // ── DEBUG HOOK (G is module-private — expose read-only state + a
  //    force-win helper for logic-level verification without a browser) ──
  window._bbDbg=function(){
    return G ? { LV, phase:G.phase, score:G.score, blocks:G.blocks, goal:L().goal,
                  goalBlocks:L().blocks, integrity:G.integrity, gateIdx:G.gateIdx,
                  factsThisLevel:G.facts, levelName:L().name, isFinal:LV>=2 } : { LV, phase:'no-G' };
  };
  // force-win the current level instantly (test-only convenience — bypasses
  // normal play to drive LV 0→1→2 and confirm the mastered banner at LV2)
  window._bbForceWin=function(){ if(!G) return false; G.blocks=L().blocks; G.score=L().goal; G.integrity=100; end(true); return true; };
})();
