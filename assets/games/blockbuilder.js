/* ════════════════════════════════════════════════════════════════
   BLOCK BUILDER — real canvas arcade (Risk Taker / Bitstream Valley)
   Teaches blockchain: TAP ✅ VALID transactions to fill the current
   BLOCK → MINE it onto the chain. TAP a ⚠️ FRAUD txn = penalty + shake.
   Let fraud scroll off safely. Grab ⚡ / 🛡️ power-ups. Mine N blocks
   or hit the score target before integrity drains. ~75s, ramping.
   Loads after the main script; overrides stub window.SCREENS.game_blockbuilder.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='risktaker', GOAL_SCORE=900, GOAL_BLOCKS=6, ROUND=75, TXN_PER_BLOCK=4;
  let G=null, raf=null;

  window.bbInit=function(){ G=null; };  // playDistrictGame calls this before goTo

  function reset(){
    G={ phase:'play', score:0, blocks:0, fills:0, combo:0, bestCombo:0,
        accepted:0, fraudHits:0, missed:0, integrity:100, time:ROUND,
        tiles:[], parts:[], floats:[], links:[], code:[],
        spawnT:0.6, last:0, started:performance.now(),
        shake:0, flash:0, flashColor:'#38bdf8', mineGlow:0,
        shield:0, validator:0, lanes:4 };
    // matrix code columns (subtle background)
    for(let i=0;i<26;i++){ G.code.push({x:Math.random(),y:Math.random(),sp:0.05+Math.random()*0.18,ch:rch(),al:0.04+Math.random()*0.1}); }
  }

  // valid / fraud transaction pools
  const VALID=[
    {t:'Send 5 → Bob'},{t:'Pay invoice'},{t:'Buy NFT'},{t:'Stake 12'},
    {t:'Send 3 → Mia'},{t:'Mint token'},{t:'Refund 8'},{t:'Swap → ETH'},
    {t:'Tip 1 → Dev'},{t:'Send 20 → Lab'}
  ];
  const FRAUD=[
    {t:'Double-spend'},{t:'Fake hash'},{t:'Duplicate txn'},{t:'Bad signature'},
    {t:'Replay attack'},{t:'Spoofed key'},{t:'Negative amount'},{t:'Forged block'}
  ];
  const CODE_CHARS='01ABCDEF₿x#$0110';
  function rch(){ return CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]; }

  window.SCREENS.game_blockbuilder=function(){
    if(!G) reset();
    setTimeout(bbBoot,30);
    return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#051829,#031019 55%,#020e1a);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(180deg,rgba(2,14,26,.88),transparent)">
        <button onclick="bbExit()" style="padding:7px 14px;border:1px solid rgba(56,189,248,.4);border-radius:9px;background:rgba(56,189,248,.1);color:#7dd3fc;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← BITSTREAM</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.2em;color:#38bdf8;flex:1;text-align:center">⛓️ BLOCK BUILDER</div>
        <div id="bbTime" style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:#38bdf8;min-width:46px;text-align:right">${ROUND}s</div>
      </div>
      <div style="position:absolute;top:52px;left:0;right:0;z-index:5;display:flex;gap:8px;padding:0 18px;justify-content:center">
        ${hud('SCORE','bbScore','#7dd3fc')}${hud('BLOCKS','bbBlocks','#38bdf8')}${hud('STREAK','bbCombo','#fbbf24')}
      </div>
      <div style="position:absolute;top:118px;left:18px;right:18px;z-index:5">
        <div style="display:flex;justify-content:space-between;font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.14em;color:rgba(255,255,255,.55);margin-bottom:4px"><span>CHAIN INTEGRITY</span><span id="bbIntTxt">100%</span></div>
        <div style="height:10px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid rgba(56,189,248,.25)"><div id="bbIntBar" style="height:100%;width:100%;background:linear-gradient(90deg,#38bdf8,#7dd3fc);transition:width .2s"></div></div>
      </div>
      <canvas id="bbCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none"></canvas>
      <div id="bbHint" style="position:absolute;left:0;right:0;bottom:18px;text-align:center;z-index:4;font-family:'Orbitron',sans-serif;font-size:.55rem;letter-spacing:.13em;color:rgba(255,255,255,.5);pointer-events:none">TAP ✅ VALID to build the block · MINE at ${TXN_PER_BLOCK}/block · NEVER tap ⚠️ FRAUD · let fraud scroll off</div>
      <div id="bbOver" style="position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;background:rgba(2,12,22,.84);backdrop-filter:blur(4px)"></div>
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
    cv.addEventListener('mousedown',e=>{ hit(e.clientX,e.clientY); });
    cv.addEventListener('touchstart',e=>{ if(e.touches[0]){ hit(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); } },{passive:false});
    // keyboard: space = mine ready block manually, 1-4 lanes optional
    const kd=e=>{ if(e.key===' '||e.key==='Enter'){ if(G&&G.phase==='play'&&G.fills>=TXN_PER_BLOCK) mineBlock(); e.preventDefault(); } };
    window.addEventListener('keydown',kd);
    G._cleanup=()=>{ window.removeEventListener('resize',size); window.removeEventListener('keydown',kd); };
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
          if(it.p==='shield'){ G.shield=8; floatTxt(it.x,it.y,'🛡️ SHIELD','#7dd3fc'); }
          else { G.validator=6; floatTxt(it.x,it.y,'⚡ VALIDATOR','#fbbf24'); }
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
    if(G.blocks>=GOAL_BLOCKS || G.score>=GOAL_SCORE) end(true);
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
    const prog=1-(G.time/ROUND);

    // spawn scrolling transaction tiles across lanes (left → right)
    G.spawnT-=dt;
    if(G.spawnT<=0){
      G.spawnT=Math.max(0.42,1.0-prog*0.5);
      const lane=Math.floor(Math.random()*G.lanes);
      const laneY=0.30+lane*0.10;          // lanes sit in the upper play field
      const speed=0.16+prog*0.22+Math.random()*0.06;
      const roll=Math.random();
      const fraudChance=0.30+prog*0.22;
      if(roll<0.06){ // power-up (rare)
        const p=Math.random()<0.5?'shield':'validator';
        G.tiles.push({x:-0.14,y:laneY,vx:speed*0.85,kind:'power',p,e:p==='shield'?'🛡️':'⚡',t:p==='shield'?'Hash Shield':'Validator'});
      } else if(roll<0.06+fraudChance){
        const f=FRAUD[Math.floor(Math.random()*FRAUD.length)];
        G.tiles.push({x:-0.14,y:laneY,vx:speed,kind:'fraud',e:'⚠️',t:f.t});
      } else {
        const v=VALID[Math.floor(Math.random()*VALID.length)];
        G.tiles.push({x:-0.14,y:laneY,vx:speed,kind:'valid',e:'✅',t:v.t});
      }
    }

    // move tiles; valid escaping = small miss + combo reset
    for(const it of G.tiles){
      it.x+=it.vx*dt;
      if(it.x>1.16){ if(it.kind==='valid'){ G.combo=0; G.missed++; } it.dead=1; }
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
    setTxt('bbScore',G.score); setTxt('bbBlocks',G.blocks+'/'+GOAL_BLOCKS); setTxt('bbCombo','x'+G.combo);
    const ib=document.getElementById('bbIntBar'); if(ib){ ib.style.width=G.integrity+'%'; ib.style.background=G.integrity<35?'linear-gradient(90deg,#ef4444,#f87171)':'linear-gradient(90deg,#38bdf8,#7dd3fc)'; }
    const it2=document.getElementById('bbIntTxt'); if(it2) it2.textContent=Math.round(G.integrity)+'%';

    if(G.integrity<=0) return end(false);
  }

  function render(ctx,W,H,now){
    ctx.clearRect(0,0,W,H);
    let ox=0,oy=0; if(G.shake>0){ ox=(Math.random()-.5)*G.shake*24; oy=(Math.random()-.5)*G.shake*24; }
    ctx.save(); ctx.translate(ox,oy);

    // matrix-ish falling code (subtle background)
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font="14px 'Orbitron',monospace";
    for(const c of G.code){ ctx.globalAlpha=c.al; ctx.fillStyle='#38bdf8'; ctx.fillText(c.ch,c.x*W,c.y*H); }
    ctx.globalAlpha=1;

    // lane guide rails (faint)
    ctx.strokeStyle='rgba(56,189,248,.08)'; ctx.lineWidth=1;
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
    if(G.shield>0){ ctx.fillStyle='#7dd3fc'; ctx.fillText('🛡️ SHIELD '+Math.ceil(G.shield)+'s',16,iy); iy-=16; }
    if(G.validator>0){ ctx.fillStyle='#fbbf24'; ctx.fillText('⚡ x2 '+Math.ceil(G.validator)+'s',16,iy); }

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

  function end(win){
    if(G.phase==='over') return; G.phase='over';
    const score=G.score;
    if(window.state){ state.coins=(state.coins||0)+score; if(window.cvAddXP) cvAddXP(Math.round(score/4),0); else if(window.cvSave) cvSave();
      state.gamesDone=state.gamesDone||{}; state.gamesDone['risktaker:0']=1; }
    const won=win || G.blocks>=GOAL_BLOCKS || score>=GOAL_SCORE;
    const survived=G.integrity>0;
    const o=document.getElementById('bbOver'); if(!o) return; o.style.display='flex';
    o.innerHTML=`<div style="max-width:430px;text-align:center;padding:34px 28px;border:1px solid ${won?'#38bdf8':(survived?'#7dd3fc':'#ef4444')};border-radius:22px;background:linear-gradient(160deg,rgba(5,30,48,.97),rgba(3,16,25,.97));box-shadow:0 0 60px rgba(56,189,248,.4)">
      <div style="font-size:3rem;margin-bottom:8px">${won?'⛓️':(survived?'🧊':'💥')}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:${won?'#38bdf8':(survived?'#7dd3fc':'#ef4444')};margin-bottom:8px">${won?'CHAIN VALIDATED!':(survived?"TIME'S UP":'INTEGRITY LOST')}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:2rem;margin:0 0 6px">${score} pts</h1>
      <p style="color:rgba(255,255,255,.65);margin:0 0 18px;font-size:.9rem">${G.blocks} blocks mined · best streak x${G.bestCombo} · ${G.fraudHits} fraud accepted · +${score} 🪙</p>
      <button onclick="bbRestart()" style="padding:13px 26px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#38bdf8,#0ea5e9);color:#031019;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;font-weight:900;cursor:pointer">▶ PLAY AGAIN</button>
      <button onclick="bbExit()" style="padding:13px 26px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
    </div>`;
  }

  window.bbRestart=function(){ reset(); const o=document.getElementById('bbOver'); if(o){o.style.display='none';o.innerHTML='';} bbBoot(); };
  window.bbExit=function(){ if(G&&G._cleanup)G._cleanup(); cancelAnimationFrame(raf); G=null; if(window.state)state.viewingWorld='risktaker'; goTo('hub'); };
})();
