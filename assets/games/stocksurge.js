/* ════════════════════════════════════════════════════════════════
   STOCK SURGE — real-time trading on a LIVE canvas line chart (Investopia)
   Watch the price tick on a glowing chart, BUY low, SELL high, ride
   the NEWS surges, and grow your net worth above the target in ~75s.
   BUY (B) · SELL (S) · HOLD (H). Teaches buy-low/sell-high, volatility, news.
   Loads after the main script; overrides the stub window.SCREENS.game_stocksurge.
   ════════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN='investor', START_CASH=1000, TARGET=1500, ROUND=75;
  const MAXPTS=70;                         // points held on the scrolling chart
  const GATE_EVERY=18;                     // knowledge gate every ~18s
  let S=null, raf=null;

  window.ssInit=function(){ S=null; };     // playDistrictGame calls this before goTo

  // LEARN WHILE PLAYING — investing lessons, one per Knowledge Gate
  const FACTS=[
    ['📈','Buy value and let it grow — patience pays.'],
    ['🌱','Compounding: small amounts invested early grow big.'],
    ['⚖️','Higher reward usually means higher risk.'],
    ['🧺','Diversify — don\'t put all your money in one stock.'],
    ['📰','News moves prices; don\'t panic-sell on a dip.'],
    ['💸','Buy low, sell high — emotions are the enemy.'],
    ['⏳','Time in the market beats timing the market.'],
  ];

  // news event templates → bias the next several ticks
  const NEWS=[
    {type:'pos', e:'📈', t:'EARNINGS BEAT',       sub:'Profits up — bulls charging', drift:0.55, vol:0.9, ticks:8,  c:'#34d399'},
    {type:'pos', e:'📈', t:'BIG PARTNERSHIP',     sub:'New deal signed — price climbing', drift:0.48, vol:0.8, ticks:7, c:'#34d399'},
    {type:'pos', e:'🚀', t:'PRODUCT LAUNCH',      sub:'Fans love it — demand soaring', drift:0.6, vol:1.0, ticks:8,  c:'#34d399'},
    {type:'neg', e:'📉', t:'WEAK SALES',          sub:'Revenue missed — bears growling', drift:-0.5, vol:0.9, ticks:8, c:'#f87171'},
    {type:'neg', e:'📉', t:'LAWSUIT FILED',       sub:'Trouble ahead — price sliding', drift:-0.55, vol:1.0, ticks:7, c:'#f87171'},
    {type:'neg', e:'⚠️', t:'CEO STEPS DOWN',      sub:'Uncertainty — selloff begins', drift:-0.45, vol:1.1, ticks:8,  c:'#f87171'},
    {type:'vol', e:'⚡', t:'WILD SWINGS',         sub:'Markets erratic — buckle up!', drift:0.0, vol:2.6, ticks:9,   c:'#fbbf24'},
    {type:'vol', e:'⚡', t:'RUMOR MILL',          sub:'Nobody knows — chaos reigns', drift:0.05, vol:2.4, ticks:8,   c:'#fbbf24'},
  ];

  function reset(){
    const p0=100;
    S={ phase:'play', time:ROUND, last:0, started:performance.now(),
        cash:START_CASH, shares:0, price:p0, prevPrice:p0,
        startNW:START_CASH, peakNW:START_CASH, costBasis:0,
        prices:[], drift:0.0, vol:1.0, newsTicks:0, news:null,
        tickT:0, newsT:8, banner:null,        // banner = {n, life} animation timer
        gateT:GATE_EVERY, gateIdx:0,          // knowledge-gate countdown + lesson cursor
        parts:[], floats:[], flash:0, flashC:'#34d399', shake:0,
        trades:0, lastAction:'—', actionFlash:0 };
    for(let i=0;i<MAXPTS;i++) S.prices.push(p0);
  }

  const netWorth=()=> S.cash + S.shares*S.price;
  const fmt=(n)=> '$'+Math.round(n).toLocaleString();

  window.SCREENS.game_stocksurge=function(){
    if(!S) reset();
    setTimeout(ssBoot,30);
    return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#071f0d,#031409 62%,#020a05);overflow:hidden;font-family:'Inter',sans-serif;color:#fff">
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(180deg,rgba(3,20,9,.9),transparent)">
        <button onclick="ssExit()" style="padding:7px 14px;border:1px solid rgba(16,185,129,.45);border-radius:9px;background:rgba(16,185,129,.12);color:#6ee7b7;font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.12em;cursor:pointer">← INVESTOPIA</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.2em;color:#34d399;flex:1;text-align:center">📊 STOCK SURGE</div>
        <div id="ssTime" style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:#fbbf24;min-width:46px;text-align:right">${ROUND}s</div>
      </div>

      <!-- Big Net Worth + P/L -->
      <div style="position:absolute;top:50px;left:0;right:0;z-index:5;text-align:center;pointer-events:none">
        <div style="font-family:'Orbitron',sans-serif;font-size:.46rem;letter-spacing:.22em;color:rgba(110,231,183,.7)">NET WORTH · TARGET ${fmt(TARGET)}</div>
        <div id="ssNW" style="font-family:'Anton',sans-serif;font-size:2.5rem;line-height:1.05;color:#fff;text-shadow:0 0 26px rgba(16,185,129,.5)">${fmt(START_CASH)}</div>
        <div id="ssPL" style="font-family:'Orbitron',sans-serif;font-size:.74rem;letter-spacing:.06em;color:#9ca3af">+0.0%</div>
      </div>

      <!-- mini HUD row -->
      <div style="position:absolute;top:150px;left:0;right:0;z-index:5;display:flex;gap:8px;padding:0 18px;justify-content:center">
        ${hud('CASH','ssCash','#6ee7b7',fmt(START_CASH))}${hud('SHARES','ssShares','#fbbf24','0')}${hud('PRICE','ssPrice','#fff','$100')}
      </div>

      <!-- chart canvas (fills middle) -->
      <canvas id="ssCanvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:manipulation"></canvas>

      <!-- NEWS banner -->
      <div id="ssBanner" style="position:absolute;left:50%;top:218px;transform:translate(-50%,-12px);z-index:6;display:none;pointer-events:none"></div>

      <!-- instructions -->
      <div id="ssHint" style="position:absolute;left:0;right:0;bottom:118px;text-align:center;z-index:4;font-family:'Orbitron',sans-serif;font-size:.52rem;letter-spacing:.13em;color:rgba(255,255,255,.5);pointer-events:none">BUY LOW · SELL HIGH · RIDE THE 📈 SURGES — beat ${fmt(TARGET)} before time runs out</div>

      <!-- action buttons -->
      <div style="position:absolute;left:0;right:0;bottom:30px;z-index:7;display:flex;gap:12px;padding:0 20px;justify-content:center;max-width:560px;margin:0 auto">
        ${btn('ssBuy','BUY','B','#10b981','#04150b','linear-gradient(135deg,#34d399,#059669)')}
        ${btn('ssSell','SELL','S','#fbbf24','#1a1300','linear-gradient(135deg,#fcd34d,#d97706)')}
        ${btn('ssHold','HOLD','H','#6ee7b7','#fff','rgba(16,185,129,.12)')}
      </div>

      <!-- KNOWLEDGE GATE overlay (pauses the market) -->
      <div id="ssGate" style="position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;background:rgba(2,10,5,.86);backdrop-filter:blur(5px);padding:22px"></div>

      <div id="ssOver" style="position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;background:rgba(2,10,5,.84);backdrop-filter:blur(4px)"></div>
    </div>`;
  };

  function hud(label,id,c,init){ return `<div style="flex:1;max-width:150px;text-align:center;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:10px;padding:6px"><div style="font-family:'Orbitron',sans-serif;font-size:.42rem;letter-spacing:.12em;color:rgba(255,255,255,.45)">${label}</div><div id="${id}" style="font-family:'Anton',sans-serif;font-size:1.05rem;color:${c}">${init}</div></div>`; }
  function btn(id,label,key,border,txt,bg){
    const dark = txt!=='#fff';
    return `<button id="${id}" onclick="ssAct('${label[0]}')" style="flex:1;max-width:170px;padding:15px 6px;border:1px solid ${border};border-radius:15px;background:${bg};color:${txt};font-family:'Orbitron',sans-serif;font-size:.92rem;font-weight:900;letter-spacing:.06em;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.4)${dark?',0 0 18px rgba(16,185,129,.25)':''};transition:transform .08s,box-shadow .15s">${label}<span style="display:block;font-size:.45rem;letter-spacing:.18em;opacity:.7;margin-top:3px;font-weight:700">KEY ${key}</span></button>`;
  }

  function ssBoot(){
    const cv=document.getElementById('ssCanvas'); if(!cv){ return; }
    const ctx=cv.getContext('2d');
    function size(){ cv.width=cv.clientWidth*devicePixelRatio; cv.height=cv.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    size(); window.addEventListener('resize',size);
    // keyboard input
    const kd=e=>{ const k=e.key.toLowerCase(); if(k==='b'){ssAct('B');} else if(k==='s'){ssAct('S');} else if(k==='h'){ssAct('H');} };
    window.addEventListener('keydown',kd);
    S._cleanup=()=>{ window.removeEventListener('resize',size); window.removeEventListener('keydown',kd); };
    S.last=performance.now();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }

  function loop(now){
    const cv=document.getElementById('ssCanvas');
    if(!cv || !S){ cancelAnimationFrame(raf); return; }       // left screen → stop
    const ctx=cv.getContext('2d'); const W=cv.clientWidth, H=cv.clientHeight;
    let dt=Math.min(40,now-S.last)/1000; S.last=now;
    if(S.phase==='play'){ update(dt,W,H); }
    render(ctx,W,H,now);
    raf=requestAnimationFrame(loop);
  }

  function update(dt,W,H){
    // timer
    S.time-=dt; if(S.time<=0){ S.time=0; return end(); }
    const tEl=document.getElementById('ssTime'); if(tEl) tEl.textContent=Math.ceil(S.time)+'s';

    // knowledge gate every ~18s — pauses the market for one lesson
    S.gateT-=dt;
    if(S.gateT<=0){ openGate(); return; }

    // schedule next news every 12–18s
    S.newsT-=dt;
    if(S.newsT<=0){ triggerNews(); S.newsT=12+Math.random()*6; }
    // banner animation life
    if(S.banner){ S.banner.life-=dt; if(S.banner.life<=0) S.banner=null; }

    // price tick every ~0.7–1.0s (random walk with drift; news biases it)
    S.tickT-=dt;
    if(S.tickT<=0){
      S.tickT=0.7+Math.random()*0.3;
      tickPrice();
    }

    // decay fx
    if(S.flash>0) S.flash-=dt;
    if(S.shake>0) S.shake-=dt;
    if(S.actionFlash>0) S.actionFlash-=dt;
    for(const p of S.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=1.4*dt; p.life-=dt; }
    S.parts=S.parts.filter(p=>p.life>0);
    for(const f of S.floats){ f.y-=dt*0.11; f.life-=dt; }
    S.floats=S.floats.filter(f=>f.life>0);

    // sync HUD
    syncHUD();
    if(netWorth()>=TARGET) return end(true);
  }

  function tickPrice(){
    S.prevPrice=S.price;
    // base drift + active news drift; volatility scales the random shock
    let baseDrift=0.06;                         // gentle upward market bias
    let drift=baseDrift, vol=1.0;
    if(S.newsTicks>0){ drift=S.drift; vol=S.vol; S.newsTicks--; if(S.newsTicks===0){ S.news=null; } }
    const shock=(Math.random()-0.5)*2;          // -1..1
    let change=drift + shock*vol*1.6;           // % move this tick
    let next=S.price*(1+change/100);
    next=Math.max(12, next);                     // floor so it never dies
    S.price=Math.round(next*100)/100;
    S.prices.push(S.price); if(S.prices.length>MAXPTS) S.prices.shift();
  }

  function triggerNews(){
    const n=NEWS[Math.floor(Math.random()*NEWS.length)];
    S.news=n; S.drift=n.drift; S.vol=n.vol; S.newsTicks=n.ticks;
    S.banner={n, life:3.4};
    S.flash=0.35; S.flashC = n.type==='pos'?'#10b981':(n.type==='neg'?'#ef4444':'#fbbf24');
  }

  // ── knowledge gate (pause + one lesson card) ─────────────────────
  function openGate(){
    if(!S || S.phase!=='play') return; S.phase='gate';
    const f=FACTS[S.gateIdx%FACTS.length]; S.gateIdx++;
    const o=document.getElementById('ssGate'); if(!o){ S.phase='play'; return; }
    o.style.display='flex';
    o.innerHTML=`<div style="max-width:440px;text-align:center;padding:30px 26px;border:1px solid #34d399;border-radius:22px;background:linear-gradient(160deg,rgba(7,31,13,.97),rgba(3,16,8,.97));box-shadow:0 0 50px rgba(16,185,129,.4);animation:ssGateIn .35s ease">
      <style>@keyframes ssGateIn{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}</style>
      <div style="font-family:'Orbitron',sans-serif;font-size:.5rem;letter-spacing:.2em;color:#6ee7b7;margin-bottom:10px">⛩️ KNOWLEDGE GATE · INVESTING TIP</div>
      <div style="font-size:2.4rem;margin-bottom:8px">${f[0]}</div>
      <p style="font-size:1.02rem;line-height:1.5;color:#fff;margin:0 0 18px">${f[1]}</p>
      <button onclick="ssGateGo()" style="padding:13px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,#34d399,#059669);color:#04150b;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.12em;font-weight:900;cursor:pointer">GOT IT → +$50</button>
    </div>`;
  }
  window.ssGateGo=function(){
    if(!S) return;
    S.cash+=50;                                  // small bonus for learning
    S.gateT=GATE_EVERY; S.phase='play';
    S.last=performance.now();                     // avoid a dt spike after the pause
    const o=document.getElementById('ssGate'); if(o){ o.style.display='none'; o.innerHTML=''; }
    flashFloat('+$50 bonus!','#34d399'); S.flashC='#10b981'; S.flash=0.3;
  };

  // ── trading actions ──────────────────────────────────────────────
  window.ssAct=function(a){
    if(!S || S.phase!=='play') return;
    if(a==='B') doBuy();
    else if(a==='S') doSell();
    else if(a==='H') doHold();
    pulseBtn(a);
  };

  function doBuy(){
    const qty=Math.floor(S.cash / S.price);
    if(qty<=0){ S.lastAction='No cash'; flashFloat('Not enough cash','#fca5a5'); S.shake=0.25; return; }
    const cost=qty*S.price;
    // weighted-average cost basis
    S.costBasis=(S.costBasis*S.shares + cost)/(S.shares+qty);
    S.shares+=qty; S.cash-=cost; S.trades++;
    S.lastAction='Bought '+qty;
    flashFloat('BUY '+qty+' @ $'+S.price.toFixed(2),'#6ee7b7');
    burst(0.5,0.5,'#34d399',8);
    S.actionFlash=0.3; S.flashC='#10b981'; S.flash=0.18;
  }

  function doSell(){
    if(S.shares<=0){ S.lastAction='No shares'; flashFloat('No shares to sell','#fca5a5'); S.shake=0.25; return; }
    const proceeds=S.shares*S.price;
    const gain=proceeds - S.costBasis*S.shares;     // realized P/L
    S.cash+=proceeds; S.trades++;
    const sold=S.shares; S.shares=0;
    if(gain>=0){
      S.lastAction='Sold +'+Math.round(gain);
      flashFloat('+'+fmt(gain)+' profit!','#34d399');
      burst(0.5,0.5,'#34d399',18); S.flashC='#10b981'; S.flash=0.45;
      factToast('💸 Bought low, sold high — that\'s the goal!');
    } else {
      S.lastAction='Sold '+Math.round(gain);
      flashFloat(fmt(gain)+' loss','#fca5a5');
      burst(0.5,0.5,'#f87171',14); S.flashC='#ef4444'; S.flash=0.4; S.shake=0.35;
      factToast('📰 Selling on a dip locks in losses — patience pays.');
    }
    S.costBasis=0;
  }

  function doHold(){ S.lastAction='Holding'; flashFloat('HOLD','#9ca3af'); }

  // ── render ───────────────────────────────────────────────────────
  function render(ctx,W,H,now){
    ctx.clearRect(0,0,W,H);
    let ox=0,oy=0; if(S.shake>0){ ox=(Math.random()-.5)*S.shake*18; oy=(Math.random()-.5)*S.shake*18; }
    ctx.save(); ctx.translate(ox,oy);

    // subtle scrolling grid backdrop
    drawGrid(ctx,W,H,now);

    // chart geometry — leave room for HUD on top & buttons below
    const padL=14, padR=14, top=H*0.30, bot=H*0.70;
    const ph=bot-top;
    const ps=S.prices;
    let mn=Math.min(...ps), mx=Math.max(...ps);
    const span=Math.max(4,(mx-mn)); mn-=span*0.18; mx+=span*0.18;
    const X=i=> padL + (i/(MAXPTS-1))*(W-padL-padR);
    const Y=v=> bot - ((v-mn)/(mx-mn))*ph;
    const up = S.price>=S.prevPrice;
    const lineC = up? '#34d399' : '#f87171';

    // area fill under the line
    const grad=ctx.createLinearGradient(0,top,0,bot+30);
    grad.addColorStop(0, up?'rgba(52,211,153,.34)':'rgba(248,113,113,.3)');
    grad.addColorStop(1,'rgba(3,20,9,0)');
    ctx.beginPath(); ctx.moveTo(X(0),Y(ps[0]));
    for(let i=1;i<ps.length;i++) ctx.lineTo(X(i),Y(ps[i]));
    ctx.lineTo(X(ps.length-1),bot+30); ctx.lineTo(X(0),bot+30); ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();

    // the glowing line
    ctx.beginPath(); ctx.moveTo(X(0),Y(ps[0]));
    for(let i=1;i<ps.length;i++) ctx.lineTo(X(i),Y(ps[i]));
    ctx.lineWidth=2.6; ctx.strokeStyle=lineC; ctx.shadowColor=lineC; ctx.shadowBlur=16; ctx.lineJoin='round'; ctx.stroke();
    ctx.shadowBlur=0;

    // cost-basis reference line (where you bought) — dashed gold
    if(S.shares>0 && S.costBasis>mn && S.costBasis<mx){
      const cy=Y(S.costBasis);
      ctx.setLineDash([6,6]); ctx.strokeStyle='rgba(251,191,36,.55)'; ctx.lineWidth=1.3;
      ctx.beginPath(); ctx.moveTo(padL,cy); ctx.lineTo(W-padR,cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='rgba(251,191,36,.85)'; ctx.font="700 10px 'Inter',sans-serif"; ctx.textAlign='left'; ctx.textBaseline='bottom';
      ctx.fillText('your buy $'+S.costBasis.toFixed(2), padL+4, cy-3);
    }

    // leading price dot + pulse + label
    const lx=X(ps.length-1), ly=Y(S.price);
    ctx.beginPath(); ctx.arc(lx,ly,4.5,0,7); ctx.fillStyle=lineC; ctx.shadowColor=lineC; ctx.shadowBlur=14; ctx.fill(); ctx.shadowBlur=0;
    const pulse=(Math.sin(now*0.006)+1)/2;
    ctx.beginPath(); ctx.arc(lx,ly,7+pulse*7,0,7); ctx.strokeStyle=lineC; ctx.globalAlpha=0.5-pulse*0.4; ctx.lineWidth=2; ctx.stroke(); ctx.globalAlpha=1;
    // floating price tag at the dot
    ctx.font="900 14px 'Anton',sans-serif"; ctx.textAlign='right'; ctx.textBaseline='middle';
    const tag='$'+S.price.toFixed(2);
    const tw=ctx.measureText(tag).width;
    let tagX=Math.min(lx, W-padR-2), tagY=Math.max(top+10,Math.min(bot-10,ly-16));
    ctx.fillStyle='rgba(3,20,9,.85)'; roundRect(ctx,tagX-tw-12,tagY-11,tw+12,22,6); ctx.fill();
    ctx.fillStyle=lineC; ctx.fillText(tag,tagX-6,tagY+1);

    // tick arrow (up/down) near the dot
    ctx.font='13px serif'; ctx.textAlign='center';
    if(S.price!==S.prevPrice){ ctx.fillText(up?'▲':'▼', lx-2, ly+ (up?-30:30)); }

    // news-tint flash over chart
    if(S.flash>0){ ctx.fillStyle=hexA(S.flashC,S.flash*0.16); ctx.fillRect(0,0,W,H); }

    // particles
    for(const p of S.parts){ ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); }
    ctx.globalAlpha=1;

    // floating texts
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const f of S.floats){ ctx.globalAlpha=Math.max(0,f.life/1.0); ctx.fillStyle=f.c; ctx.font="800 "+(f.big?20:15)+"px 'Inter',sans-serif"; ctx.fillText(f.t,f.x*W,f.y*H); }
    ctx.globalAlpha=1;

    ctx.restore();
    drawBanner();   // DOM banner (kept outside shake transform)
  }

  function drawGrid(ctx,W,H,now){
    ctx.strokeStyle='rgba(16,185,129,.06)'; ctx.lineWidth=1;
    const off=(now*0.02)% 46;
    for(let x=-off;x<W;x+=46){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=46){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  }

  // animated DOM news banner
  function drawBanner(){
    const el=document.getElementById('ssBanner'); if(!el) return;
    if(!S.banner){ if(el.style.display!=='none'){ el.style.display='none'; el.innerHTML=''; } return; }
    const {n,life}=S.banner;
    const inT=Math.min(1,(3.4-life)/0.25);                 // slide/fade in
    const outT=life<0.5? life/0.5 : 1;                     // fade out
    const a=Math.min(inT,outT);
    const yShift=(1-inT)*-14;
    el.style.display='block'; el.style.opacity=a;
    el.style.transform=`translate(-50%,${yShift-12}px) scale(${0.96+inT*0.04})`;
    el.innerHTML=`<div style="display:flex;align-items:center;gap:10px;padding:9px 18px;border-radius:13px;border:1px solid ${n.c};background:linear-gradient(135deg,rgba(3,20,9,.95),rgba(7,31,13,.95));box-shadow:0 0 30px ${hexA(n.c,0.5)}">
        <span style="font-size:1.4rem;filter:drop-shadow(0 0 6px ${n.c})">${n.e}</span>
        <div style="text-align:left">
          <div style="font-family:'Orbitron',sans-serif;font-size:.62rem;font-weight:900;letter-spacing:.14em;color:${n.c}">${n.t}</div>
          <div style="font-family:'Inter',sans-serif;font-size:.62rem;color:rgba(255,255,255,.7)">${n.sub}</div>
        </div>
      </div>`;
  }

  // ── helpers ──────────────────────────────────────────────────────
  function syncHUD(){
    const nw=netWorth(), pl=(nw/S.startNW-1)*100;
    S.peakNW=Math.max(S.peakNW,nw);
    setTxt('ssNW',fmt(nw));
    const plEl=document.getElementById('ssPL');
    if(plEl){ const pos=pl>=0; plEl.textContent=(pos?'+':'')+pl.toFixed(1)+'%  ·  '+(pos?'PROFIT':'LOSS'); plEl.style.color=pos?'#34d399':'#f87171'; }
    const nwEl=document.getElementById('ssNW'); if(nwEl) nwEl.style.color = nw>=TARGET? '#fbbf24' : '#fff';
    setTxt('ssCash',fmt(S.cash)); setTxt('ssShares',S.shares); setTxt('ssPrice','$'+S.price.toFixed(2));
    const prEl=document.getElementById('ssPrice'); if(prEl) prEl.style.color = S.price>=S.prevPrice? '#34d399':'#f87171';
  }
  function setTxt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
  function flashFloat(t,c){ S.floats.push({x:0.5,y:0.58,t,c,life:1.0,big:t.indexOf('profit')>=0||t.indexOf('loss')>=0}); }
  function factToast(t){ S.floats.push({x:0.5,y:0.46,t,c:'#6ee7b7',life:1.6,big:false}); }   // brief learn-while-playing nudge on a sell
  function burst(x,y,c,n){ for(let i=0;i<n;i++){ const a=Math.random()*7,s=0.18+Math.random()*0.55; S.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.25,s:2+Math.random()*3,c,life:0.5+Math.random()*0.35,max:0.85}); } }
  function pulseBtn(a){ const id=a==='B'?'ssBuy':a==='S'?'ssSell':'ssHold'; const b=document.getElementById(id); if(b){ b.style.transform='scale(.93)'; setTimeout(()=>{ if(b)b.style.transform='scale(1)'; },90); } }
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function hexA(hex,a){ const h=hex.replace('#',''); const r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16); return `rgba(${r},${g},${b},${a})`; }

  // ── end / overlay ────────────────────────────────────────────────
  function end(win){
    if(S.phase==='over') return; S.phase='over';
    const nw=netWorth();
    // liquidate any held shares into final net worth display
    const profit=nw - S.startNW;
    const won = win || nw>=TARGET;
    // coins reward = profit-based (always a little for playing)
    const reward = Math.max(20, Math.round(profit*0.5) + (won?120:0));
    if(window.state){
      state.coins=(state.coins||0)+reward;
      if(window.cvAddXP) cvAddXP(Math.round(reward/4),0); else if(window.cvSave) cvSave();
      state.gamesDone=state.gamesDone||{}; state.gamesDone['investor:0']=1;
    }
    const pl=(nw/S.startNW-1)*100;
    const o=document.getElementById('ssOver'); if(!o) return; o.style.display='flex';
    o.innerHTML=`<div style="max-width:430px;text-align:center;padding:34px 28px;border:1px solid ${won?'#fbbf24':'#10b981'};border-radius:22px;background:linear-gradient(160deg,rgba(7,31,13,.97),rgba(3,16,8,.97));box-shadow:0 0 60px rgba(16,185,129,.42)">
      <div style="font-size:3rem;margin-bottom:8px">${won?'🏆':(profit>=0?'📈':'📉')}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:.6rem;letter-spacing:.2em;color:${won?'#fbbf24':'#34d399'};margin-bottom:8px">${won?'TARGET SMASHED!':(profit>=0?'PROFITABLE RUN':'MARKET CLOSED')}</div>
      <h1 style="font-family:'Anton',sans-serif;font-size:2.1rem;margin:0 0 4px;color:#fff">${fmt(nw)}</h1>
      <div style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:${profit>=0?'#34d399':'#f87171'};margin-bottom:10px">${profit>=0?'+':''}${fmt(profit)}  (${pl>=0?'+':''}${pl.toFixed(1)}%)</div>
      <p style="color:rgba(255,255,255,.65);margin:0 0 18px;font-size:.85rem">${S.trades} trades · started ${fmt(S.startNW)} · <span style="color:#fbbf24">+${reward} 🪙</span></p>
      <button onclick="ssRestart()" style="padding:13px 26px;margin:4px;border:none;border-radius:13px;background:linear-gradient(135deg,#34d399,#059669);color:#04150b;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;font-weight:900;cursor:pointer">▶ TRADE AGAIN</button>
      <button onclick="ssExit()" style="padding:13px 26px;margin:4px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Orbitron',sans-serif;font-size:.72rem;letter-spacing:.1em;cursor:pointer">← HUB</button>
    </div>`;
  }

  window.ssRestart=function(){ reset(); ['ssGate','ssOver'].forEach(id=>{const o=document.getElementById(id);if(o){o.style.display='none';o.innerHTML='';}}); ssBoot(); };
  window.ssExit=function(){ if(S&&S._cleanup)S._cleanup(); cancelAnimationFrame(raf); S=null; if(window.state)state.viewingWorld='investor'; goTo('hub'); };
})();
