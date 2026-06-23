/* ════════════════════════════════════════════════════════════
   COINAVERSE v25 — real Kabria SHOP (cart+checkout) · per-hub GAMES · cinema Drive
   Loads after app-v24.js. Overrides window.SCREENS.shop & window.playDistrictGame.
   ════════════════════════════════════════════════════════════ */
(function(){
  const S=()=>window.state||{};
  const money=n=>'$'+Number(n).toFixed(2);

  /* ─────────── REAL KABRIA MERCH (from Coincept content) ─────────── */
  const MERCH=[
   {id:'mt',name:'Money Talk Flash Cards',type:'Flash Cards',ages:'10–13',price:9.99,cat:'Flash Cards',status:'available',blurb:'50+ essential money terms in simple language — built for middle-schoolers to connect lessons to real life.'},
   {id:'mw',name:'Money Words Flash Cards',type:'Flash Cards',ages:'5–10',price:7.99,cat:'Flash Cards',status:'available',blurb:'The ABCs of money — one beginner-friendly term per bright, playful card.'},
   {id:'fl',name:'Finance Lingo Flash Cards',type:'Flash Cards',ages:'13–18',price:9.99,cat:'Flash Cards',status:'available',blurb:'50+ finance terms & real-world examples to prep teens for financial independence.'},
   {id:'ms',name:'Money Smarts Coloring Book',type:'Activity Book',ages:'5–10',price:12.99,cat:'Activity Books',status:'available',blurb:'Color your way through saving, budgeting, coins & smart money choices.'},
   {id:'cu',name:'Count It Up · Numbers 1–100',type:'Activity Book',ages:'4–8',price:12.99,cat:'Activity Books',status:'available',blurb:'Counting, number tracing & recognition with fun visuals and matching games.'},
   {id:'mu',name:'Multiply Your Way to Success',type:'Activity Book',ages:'5–11',price:12.99,cat:'Activity Books',status:'available',blurb:'Master multiplication with puzzles, word challenges & creative activities.'},
   {id:'bp',name:'My First Budget Planner',type:'Activity Book',ages:'5–12',price:12.99,cat:'Activity Books',status:'available',blurb:'Needs vs wants, savings goals & spend tracking — a child’s first real budget.'},
   {id:'ad',name:"Addi's Amazing Addition Adventure",type:'Activity Book',ages:'5–9',price:12.99,cat:'Coming Soon',status:'soon',blurb:'Addition stories, fill-in puzzles & themed challenges guided by Addi.'},
   {id:'mc',name:'Coincept Money Counting Book',type:'Activity Book',ages:'6–10',price:12.99,cat:'Coming Soon',status:'soon',blurb:'Recognize coins & bills, add amounts, and learn the value of a dollar.'},
   {id:'db',name:'DivBot 3000 Division Adventure',type:'Activity Book',ages:'6–11',price:12.99,cat:'Coming Soon',status:'soon',blurb:'Division stories & puzzles from basic to advanced with DivBot 3000.'},
   {id:'su',name:'Subby Subtraction Adventure',type:'Activity Book',ages:'5–11',price:12.99,cat:'Coming Soon',status:'soon',blurb:'Subtraction mini-games, coloring & step-by-step practice with Subby.'},
  ];
  const MERCH_BY=id=>MERCH.find(m=>m.id===id);
  // category cover theme (Coincept palette: forest green / gold)
  const COVER={'Flash Cards':['#0e7a3a','#1B5E20'],'Activity Books':['#16794d','#0e5c38'],'Coming Soon':['#3a3358','#241f3e']};
  function coverHTML(m){
    return `<div class="mc-cover mc-photo" style="background-image:url('assets/shop/${m.id}.jpg')">
      <div class="mc-cv-foot"><span class="mc-cv-type">${m.type}</span><span class="mc-cv-age">AGES ${m.ages}</span></div>
      ${m.status==='soon'?'<div class="mc-cv-soon">COMING&nbsp;SOON</div>':''}</div>`; }

  /* ─────────── CART (localStorage) ─────────── */
  function cart(){ try{return JSON.parse(localStorage.getItem('coinaverse_cart')||'{}');}catch(e){return {};} }
  function setCart(c){ localStorage.setItem('coinaverse_cart',JSON.stringify(c)); updateCartBadge(); }
  function cartCount(){ const c=cart(); return Object.values(c).reduce((a,b)=>a+b,0); }
  function cartTotal(){ const c=cart(); return Object.keys(c).reduce((s,id)=>{const m=MERCH_BY(id);return s+(m?m.price*c[id]:0);},0); }
  window.cvAddCart=function(id){ const m=MERCH_BY(id); if(!m||m.status==='soon')return; const c=cart(); c[id]=(c[id]||0)+1; setCart(c); cvToast(`🛒 Added · ${m.name}`); };
  window.cvCartInc=function(id){ const c=cart(); c[id]=(c[id]||0)+1; setCart(c); renderCart(); };
  window.cvCartDec=function(id){ const c=cart(); c[id]=(c[id]||0)-1; if(c[id]<=0)delete c[id]; setCart(c); renderCart(); };
  window.cvCartDel=function(id){ const c=cart(); delete c[id]; setCart(c); renderCart(); };
  function updateCartBadge(){ document.querySelectorAll('#cvCartCount').forEach(e=>{ const n=cartCount(); e.textContent=n; e.style.display=n?'flex':'none'; }); }

  window.openCart=function(){ let o=document.getElementById('cvCart'); if(o)o.remove();
    o=document.createElement('div'); o.id='cvCart'; o.className='cv-drawer-ov'; o.innerHTML=`<div class="cv-drawer" id="cvDrawer"></div>`;
    o.addEventListener('click',e=>{if(e.target===o)closeCart();}); document.body.appendChild(o); renderCart(); };
  window.closeCart=function(){ const o=document.getElementById('cvCart'); if(o)o.remove(); };
  function renderCart(){ const d=document.getElementById('cvDrawer'); if(!d)return; const c=cart(); const ids=Object.keys(c);
    const rows=ids.length? ids.map(id=>{const m=MERCH_BY(id);return `<div class="cv-cart-row">${coverMini(m)}
      <div class="cv-cart-info"><div class="cv-cart-name">${m.name}</div><div class="cv-cart-price">${money(m.price)}</div></div>
      <div class="cv-qty"><button onclick="cvCartDec('${id}')">−</button><span>${c[id]}</span><button onclick="cvCartInc('${id}')">+</button></div>
      <button class="cv-cart-del" onclick="cvCartDel('${id}')">✕</button></div>`;}).join('')
      : `<div class="cv-cart-empty">🛒 Your cart is empty.<br><small>Add a flash card set or activity book to get started.</small></div>`;
    d.innerHTML=`<div class="cv-drawer-h"><span>🛒 YOUR CART</span><button onclick="closeCart()">✕</button></div>
      <div class="cv-cart-list">${rows}</div>
      <div class="cv-drawer-foot"><div class="cv-sub"><span>Subtotal</span><b>${money(cartTotal())}</b></div>
      <button class="cv-checkout-btn" ${ids.length?'':'disabled'} onclick="cvCheckout()">CHECKOUT →</button></div>`; }
  function coverMini(m){ return `<div class="cv-cart-cover" style="background-image:url('assets/shop/${m.id}.jpg')"></div>`; }

  /* ─────────── CHECKOUT (facade) ─────────── */
  window.cvCheckout=function(){ closeCart(); const c=cart(); if(!Object.keys(c).length){cvToast('Cart is empty');return;}
    let o=document.getElementById('cvCheckout'); if(o)o.remove(); o=document.createElement('div'); o.id='cvCheckout'; o.className='cv-modal-ov';
    const items=Object.keys(c).map(id=>{const m=MERCH_BY(id);return `<div class="co-line"><span>${m.name} × ${c[id]}</span><b>${money(m.price*c[id])}</b></div>`;}).join('');
    const ship=4.99, tax=+(cartTotal()*0.08).toFixed(2), total=cartTotal()+ship+tax;
    o.innerHTML=`<div class="cvm-card co-card"><button class="cvm-x" onclick="closeCheckout()">✕</button>
      <div class="cvm-h">CHECKOUT</div>
      <div class="co-sec">CONTACT & SHIPPING</div>
      <input class="co-in" id="coName" placeholder="Full name"><input class="co-in" id="coEmail" placeholder="Email" type="email">
      <input class="co-in" id="coAddr" placeholder="Address"><div class="co-2"><input class="co-in" id="coCity" placeholder="City"><input class="co-in" id="coZip" placeholder="ZIP"></div>
      <div class="co-sec">PAYMENT</div>
      <input class="co-in" id="coCard" placeholder="Card number" inputmode="numeric"><div class="co-2"><input class="co-in" id="coExp" placeholder="MM/YY"><input class="co-in" id="coCvc" placeholder="CVC"></div>
      <div class="co-sec">ORDER SUMMARY</div><div class="co-lines">${items}
        <div class="co-line"><span>Shipping</span><b>${money(ship)}</b></div><div class="co-line"><span>Tax</span><b>${money(tax)}</b></div>
        <div class="co-line total"><span>Total</span><b>${money(total)}</b></div></div>
      <button class="cv-checkout-btn" onclick="cvPlaceOrder(${total.toFixed(2)})">PLACE ORDER · ${money(total)}</button>
      <div class="co-secure">🔒 Demo checkout — no real charge.</div></div>`;
    o.addEventListener('click',e=>{if(e.target===o)closeCheckout();}); document.body.appendChild(o); };
  window.closeCheckout=function(){ const o=document.getElementById('cvCheckout'); if(o)o.remove(); };
  window.cvPlaceOrder=function(total){ const nm=(document.getElementById('coName')||{}).value, em=(document.getElementById('coEmail')||{}).value, cd=(document.getElementById('coCard')||{}).value;
    if(!nm||!em||!cd){ cvToast('Please fill name, email & card'); return; }
    const ord='CC-'+Math.floor(100000+Math.random()*900000); setCart({}); closeCheckout();
    let o=document.createElement('div'); o.id='cvOrder'; o.className='cv-modal-ov';
    o.innerHTML=`<div class="cvm-card co-done"><div class="co-check">✓</div><div class="cvm-h">ORDER CONFIRMED</div>
      <p>Thank you, ${nm.split(' ')[0]||'friend'}! Your Coincept order <b>#${ord}</b> is on its way.</p>
      <p class="co-email">A receipt was sent to ${em}.</p>
      <button class="cv-checkout-btn" onclick="document.getElementById('cvOrder').remove()">DONE</button></div>`;
    document.body.appendChild(o); cvToast('🎉 Order placed'); };

  /* ─────────── SHOP SCREEN (override) ─────────── */
  let _mcat='All';
  window.shopCat=c=>{ _mcat=c; goTo('shop'); };
  window.SCREENS.shop=function(){
    const cats=['All','Flash Cards','Activity Books','Coming Soon'];
    const list=_mcat==='All'?MERCH:MERCH.filter(m=>m.cat===_mcat);
    const card=m=>`<div class="merch-card ${m.status==='soon'?'soon':''}" onclick="openProduct('${m.id}')">
      ${coverHTML(m)}
      <div class="merch-info"><div class="merch-name">${m.name}</div><div class="merch-blurb">${m.blurb}</div>
        <div class="merch-foot"><span class="merch-price">${money(m.price)}</span>
        ${m.status==='soon'?`<button class="merch-btn ghost" onclick="event.stopPropagation();cvToast('🔔 We\\'ll notify you when it launches')">NOTIFY ME</button>`:`<button class="merch-btn" onclick="event.stopPropagation();cvAddCart('${m.id}')">ADD TO CART</button>`}</div></div></div>`;
    return `<div class="v14-screen shop-screen merch-screen">
      <div class="merch-bg"></div>
      <div class="v14-topbar">
        <div class="v14-topbar-left"><button class="v14-back" onclick="goTo('home')">← HOME</button><div class="v14-title">COINCEPT STORE</div></div>
        <div class="v14-topbar-right">
          <button class="merch-cart-btn" onclick="openCart()">🛒<span id="cvCartCount" class="cv-cart-badge">0</span></button>
        </div></div>
      <div class="merch-wrap">
        <div class="merch-hero"><div><div class="merch-hero-kick">COINCEPT CORPORATION · FINANCIAL LITERACY FOR KIDS</div>
          <h1 class="merch-hero-h1">Real books & cards.<br>Real money skills.</h1>
          <p class="merch-hero-p">Flash cards, activity books & planners that turn money lessons into something kids actually love. Shipping worldwide.</p></div></div>
        <div class="merch-tabs">${cats.map(c=>`<button class="shop-tab ${c===_mcat?'active':''}" onclick="shopCat('${c}')">${c.toUpperCase()}</button>`).join('')}</div>
        <div class="merch-grid">${list.map(card).join('')}</div>
      </div></div>`;
  };
  window.SCREENS.marketplace=window.SCREENS.shop;

  const FULL={
   mt:'Money Talk Financial Literacy Cards make it easy for middle-school students to understand real-world money concepts. Each card breaks down a key financial term in simple language that helps tweens connect money lessons to everyday life. Kids will learn to decode 50+ essential financial terms, understand how money works in the real world, and build confidence through engaging examples and prompts. Perfect for ages 10–13 — bridging kid-friendly learning and teen-ready financial knowledge.',
   mw:'Learn the ABCs of money with Money Words Flash Cards! Designed for young learners, each colorful card teaches a beginner-friendly financial term, helping kids understand money basics one word at a time. Bright, engaging visuals make learning fun, with simple definitions for real-world money concepts and a playful introduction to financial literacy and vocabulary. Perfect for ages 5–10 to start building financial confidence early.',
   fl:'Ready to speak fluent finance? Finance Lingo Flash Cards make mastering financial vocabulary simple and fun. Each card introduces a key money term in easy-to-understand language that helps teens build real-world confidence. Teens learn 50+ essential finance terms and definitions, real-life examples of how money concepts apply, and the language needed to make smart financial moves. Perfect for ages 13–18 to “boss up” their money knowledge.',
   ms:'Money Smarts Coloring Book turns financial education into a hands-on art adventure! Each page combines coloring fun with simple lessons that help children understand money basics — from saving and budgeting to recognizing coins and making smart choices. Fun, kid-friendly illustrations teach real-life money lessons and build confidence in decision-making. Perfect for ages 5–10 — great for classrooms, after-school programs, or at-home learning.',
   cu:'Count It Up: A Fun Guide to Numbers 1–100 makes learning to count exciting! This beginner-friendly workbook introduces young learners to numbers, patterns, and basic math in a playful way: counting 1 to 100 with fun visuals, number tracing and recognition, plus matching, coloring and fill-in-the-blank activities. Perfect for ages 4–8 to build a strong math foundation.',
   mu:'Multiply Your Way to Success turns learning multiplication into an adventure! This workbook helps elementary students practice and master multiplication facts in a fun, interactive way with puzzles, fill-in-the-blank problems, word challenges and creative activities. Perfect for ages 5–11 — building strong math foundations while keeping learning playful.',
   bp:'My First Budget Planner helps kids take their first step toward smart money management. This engaging workbook turns budgeting into a fun adventure: create simple budgets, understand needs vs. wants, set savings goals and track spending. Each page includes colorful visuals, hands-on activities and creative prompts. Perfect for ages 5–12 to build real-world financial confidence.',
   ad:'Addi’s Amazing Addition Adventure turns addition practice into an unforgettable journey! Guided by Addi, kids explore numbers, solve problems and strengthen math skills through addition stories, themed activities, fill-in-the-blank problems, puzzles and word challenges. Step-by-step practice builds confidence and accuracy. Perfect for ages 5–9.',
   mc:'The Coincept Money Counting Book makes learning to count money fun and easy! Designed for elementary students, it helps kids recognize coins and bills, add different amounts and understand the value of every dollar through interactive activities, counting challenges and colorful illustrations. Perfect for ages 6–10.',
   db:'DivBot 3000: The Division Activity Book takes kids on a math-filled adventure through the world of division! Guided by DivBot 3000, students solve problems, complete word challenges and play their way to stronger skills with division stories, step-by-step practice and engaging puzzles. Perfect for ages 6–11.',
   su:'Meet Subby the Subtractor — your child’s new math superhero! This activity book helps elementary students strengthen subtraction skills with coloring pages, interactive challenges, mini-games, fill-in-the-blank problems and step-by-step practice from basic to advanced. Perfect for ages 5–11.',
  };
  window.openProduct=function(id){ const m=MERCH_BY(id); if(!m)return; let o=document.getElementById('cvProd'); if(o)o.remove();
    o=document.createElement('div'); o.id='cvProd'; o.className='cv-modal-ov';
    o.innerHTML=`<div class="cvm-card prod-card"><button class="cvm-x" onclick="closeProduct()">✕</button>
      <div class="prod-grid">
        <div class="prod-photo" style="background-image:url('assets/shop/${id}.jpg')">${m.status==='soon'?'<div class="mc-cv-soon">COMING&nbsp;SOON</div>':''}</div>
        <div class="prod-info">
          <div class="prod-badges"><span class="mc-cv-type">${m.type}</span><span class="prod-age">AGES ${m.ages}</span></div>
          <h2 class="prod-name">${m.name}</h2><div class="prod-price">${money(m.price)}</div>
          <p class="prod-full">${FULL[id]||m.blurb}</p>
          ${m.status==='soon'?`<button class="cv-checkout-btn" onclick="cvToast('🔔 We\'ll notify you when it launches')">🔔 NOTIFY ME</button>`:`<button class="cv-checkout-btn" onclick="cvAddCart('${id}');closeProduct();openCart()">ADD TO CART →</button>`}
        </div></div></div>`;
    o.addEventListener('click',e=>{if(e.target===o)closeProduct();}); document.body.appendChild(o); };
  window.closeProduct=function(){ const o=document.getElementById('cvProd'); if(o)o.remove(); };

  /* ─────────── PER-HUB GAMES (lesson-tied, override) ─────────── */
  // config per hub: mechanic + themed copy
  const HG={
    credtech:{mech:'meter',title:'CREDIT BUILDER',prompt:'Tap to make an ON-TIME payment when the marker hits the green zone. Build your credit score!',color:'#00E5FF',unit:'pts'},
    strategist:{mech:'sort',title:'BUDGET BOSS',left:'NEED',right:'WANT',color:'#3b82f6',items:[
      {t:'🍞 Groceries',a:0},{t:'🎮 New console',a:1},{t:'💊 Medicine',a:0},{t:'👟 Hype sneakers',a:1},{t:'🚌 Bus fare',a:0},{t:'🍭 Extra candy',a:1},{t:'📚 School supplies',a:0},{t:'🕶 Designer shades',a:1}]},
    investor:{mech:'collect',title:'SMART INVESTOR',good:'📈',bad:'📉',goodL:'rising assets',badL:'crashes',color:'#22c55e'},
    builder:{mech:'collect',title:'STARTUP BUILDER',good:'🧱',bad:'🐞',goodL:'build parts',badL:'bugs',color:'#f97316'},
    guardian:{mech:'sort',title:'SAVE OR SPEND',left:'SAVE',right:'SPEND',color:'#06b6d4',items:[
      {t:'🐷 Put $5 in the vault',a:0},{t:'🍔 Buy fast food daily',a:1},{t:'💰 Emergency fund',a:0},{t:'🎟 Impulse buy',a:1},{t:'🏦 Auto-save weekly',a:0},{t:'🛍 Spend it all',a:1},{t:'📈 Save for a goal',a:0},{t:'💸 Blow the allowance',a:1}]},
    risktaker:{mech:'sort',title:'RISK OR SAFE',left:'SAFE',right:'RISKY',color:'#a855f7',items:[
      {t:'🏦 Savings account',a:0},{t:'🎰 Bet it all on one thing',a:1},{t:'📊 Diversified fund',a:0},{t:'🚀 All-in hype coin',a:1},{t:'💵 Emergency cash',a:0},{t:'🃏 Unknown scheme',a:1},{t:'🛡 Insured plan',a:0},{t:'🔥 No-plan gamble',a:1}]},
    rebuilder:{mech:'sort',title:'DEBT CRUSHER',left:'GOOD DEBT',right:'BAD DEBT',color:'#ef4444',items:[
      {t:'🎓 Student loan (skills)',a:0},{t:'💳 Maxed card on shoes',a:1},{t:'🏠 Home mortgage',a:0},{t:'🎲 Borrow to gamble',a:1},{t:'🚗 Sensible car loan',a:0},{t:'📺 Loan for luxury TV',a:1},{t:'🏢 Loan to start a biz',a:0},{t:'💸 Payday loan trap',a:1}]},
  };
  let _g=null;
  function endGame(reward){ if(_g){_g.t.forEach(clearInterval);_g.t=[];} const o=document.getElementById('cvGame'); 
    const stage=document.getElementById('cvgStage');
    if(stage){ const xp=Math.max(10,Math.round(reward/2));
      stage.innerHTML=`<div class="cvg-end"><div class="cvg-end-em">${reward>=80?'🏆':reward>=40?'🎉':'💪'}</div>
        <div class="cvg-end-t">${reward>=80?'MASTERED!':reward>=40?'NICE WORK!':'GOOD TRY!'}</div>
        <div class="cvg-end-r">+${reward} 💰 · +${xp} XP</div>
        <button class="cvg-tap" onclick="cvGameClose()">CONTINUE</button></div>`;
      if(window.cvAddXP) cvAddXP(xp,reward);
    } else { if(window.cvAddXP) cvAddXP(Math.max(10,Math.round(reward/2)),reward); cvGameClose(); }
  }
  window.cvGameClose=function(){ const o=document.getElementById('cvGame'); if(o)o.remove(); if(_g){_g.t.forEach(clearInterval);_g.t=[];_g=null;} };
  function wrap(token,nn,title,color,body){ const bg=`assets/game/${token}_d${nn}.jpg`;
    const o=document.createElement('div'); o.id='cvGame'; o.className='cv-game-ov'; o.style.setProperty('--gc',color);
    o.innerHTML=`<div class="cvg-card"><div class="cvg-bg" style="background-image:url('${bg}')"></div><div class="cvg-scrim-top"></div><div class="cvg-scrim-bot"></div>
      <div class="cvg-top"><button class="cvg-x" onclick="cvGameClose()">✕ EXIT</button><div class="cvg-title">${title}</div>
      <div class="cvg-hud"><span id="cvg-score">0</span><small>SCORE</small></div></div>
      <div class="cvg-stage" id="cvgStage">${body}</div></div>`; document.body.appendChild(o); return o; }
  const setScore=n=>{const e=document.getElementById('cvg-score');if(e)e.textContent=n;};

  function gMeter(token,nn,cfg){ wrap(token,nn,cfg.title,cfg.color,
    `<div class="cvg-help">${cfg.prompt}</div><div class="cvg-gauge"><div class="cvg-gz"></div><div class="cvg-gm" id="gm"></div></div>
     <button class="cvg-tap" onclick="cvgTap()">PAY ON TIME</button><div class="cvg-round" id="rd">Round 1 / 8</div>`);
    let sc=0,r=1,p=0,d=1; const mk=document.getElementById('gm');
    const mv=setInterval(()=>{p+=d*2.4;if(p>=100){p=100;d=-1;}if(p<=0){p=0;d=1;}if(mk)mk.style.left=p+'%';},16);
    window.cvgTap=()=>{const hit=p>=38&&p<=62;sc+=hit?14:0;pop(hit?'🎯 On time!':'⚠ Late',hit);setScore(sc);r++;const rd=document.getElementById('rd');if(r>8){clearInterval(mv);endGame(sc);}else if(rd)rd.textContent=`Round ${r} / 8`;};
    _g={t:[mv]}; }
  function gSort(token,nn,cfg){ wrap(token,nn,cfg.title,cfg.color,
    `<div class="cvg-help">Sort each card: <b>${cfg.left}</b> ⬅ or ➡ <b>${cfg.right}</b></div>
     <div class="cvg-card-area" id="ca"></div>
     <div class="cvg-bins"><button class="cvg-bin l" onclick="cvgSort(0)">⬅ ${cfg.left}</button><button class="cvg-bin r" onclick="cvgSort(1)">${cfg.right} ➡</button></div>`);
    let sc=0,qi=0; const items=cfg.items; const area=document.getElementById('ca');
    function show(){ if(qi>=items.length){endGame(sc);return;} area.innerHTML=`<div class="cvg-qcard">${items[qi].t}</div>`; }
    window.cvgSort=s=>{if(qi>=items.length)return;const ok=items[qi].a===s;sc+=ok?13:0;pop(ok?'✓ Correct':'✗ Nope',ok);setScore(sc);qi++;show();};
    show(); _g={t:[]}; }
  function gCollect(token,nn,cfg){ wrap(token,nn,cfg.title,cfg.color,
    `<div class="cvg-help">Tap the <b>${cfg.good} ${cfg.goodL}</b> · avoid the <b>${cfg.bad} ${cfg.badL}</b> · 25s</div>
     <div class="cvg-field" id="fld"></div><div class="cvg-timer" id="tm">25</div>`);
    let sc=0,t=25; const fld=document.getElementById('fld');
    const sp=setInterval(()=>{const good=Math.random()>0.34;const el=document.createElement('div');el.className='cvg-orb '+(good?'good':'bad');el.textContent=good?cfg.good:cfg.bad;
      el.style.left=(6+Math.random()*84)+'%';el.style.animationDuration=(2.2+Math.random()*1.7)+'s';
      el.onclick=()=>{if(el._d)return;el._d=1;sc+=good?10:-6;if(sc<0)sc=0;pop(good?'+10':'-6',good);setScore(sc);el.style.transform='scale(0)';setTimeout(()=>el.remove(),140);};
      fld.appendChild(el);setTimeout(()=>el.remove(),4200);},500);
    const tk=setInterval(()=>{t--;const e=document.getElementById('tm');if(e)e.textContent=t;if(t<=0){clearInterval(sp);clearInterval(tk);endGame(sc);}},1000);
    _g={t:[sp,tk]}; }
  function pop(txt,good){ const s=document.getElementById('cvgStage'); if(!s)return; const e=document.createElement('div'); e.className='cvg-pop '+(good?'g':'b'); e.textContent=txt; s.appendChild(e); setTimeout(()=>e.remove(),700); }

  window.playDistrictGame=function(token,i){ if(window.state){state.gamesDone=state.gamesDone||{};state.gamesDone[token+':'+i]=1; if(window.cvSave)cvSave();}
    const nn=String(i+1).padStart(2,'0'); const cfg=HG[token]||HG.strategist;
    if(cfg.mech==='meter') gMeter(token,nn,cfg); else if(cfg.mech==='sort') gSort(token,nn,cfg); else gCollect(token,nn,cfg);
  };

  /* ─────────── CINEMA · Drive embed support ─────────── */
  // when Doris provides 10 file links, call cvSetEpisodes([{title, id, sub}])
  window.REAL_EP=null;
  window.cvSetEpisodes=function(arr){ window.REAL_EP=arr; cvToast('Episodes wired'); };
  window.openVideoDrive=function(fileId,title){ let o=document.createElement('div'); o.id='cvVideo'; o.className='cv-video-ov';
    o.innerHTML=`<div class="cvv-card"><button class="cvv-x" onclick="closeVideo()">✕</button>
      <iframe class="cvv-vid" src="https://drive.google.com/file/d/${fileId}/preview" allow="autoplay" allowfullscreen frameborder="0"></iframe>
      <div class="cvv-title">${title||''}</div></div>`; o.addEventListener('click',e=>{if(e.target===o)closeVideo();}); document.body.appendChild(o); };
  // route playEp: real Drive episode if provided, else local fallback (set in v24)
  const _localPlayEp=window.playEp;
  window.playEp=function(id){ if(window.REAL_EP){ const idx=(parseInt((''+id).replace(/\D/g,''))||1)-1; const e=window.REAL_EP[Math.abs(idx)%window.REAL_EP.length]; if(e&&e.id){ openVideoDrive(e.id, e.title); return; } } if(_localPlayEp) _localPlayEp(id); };

  // keep cart badge fresh on any navigation
  const _g2=window.goTo; window.goTo=function(id,o){ _g2(id,o); setTimeout(updateCartBadge,10); };
  setTimeout(updateCartBadge,400);
})();

/* ════════ v25b · REAL KABRIA CINEMA (Coincept lessons) ════════ */
(function(){
  // 9 distinct Coincept lessons (titles from Drive · "Video Ver 3"; the 2 Money-Goal takes merged).
  // drive: paste each file's ID (from its share link .../file/d/<ID>/view) to enable in-app playback.
  const CINE=[
    {t:'Wants vs Needs',sub:'Mini 1 · Money Basics',cat:'Money Basics',drive:'',d:'Mr. JQ helps kids tell the difference between what they WANT and what they truly NEED — the first step to smart money choices.'},
    {t:'What is Financial Literacy',sub:'Mini 2 · Money Basics',cat:'Money Basics',drive:'',d:'A kid-friendly intro to money smarts: what financial literacy means and why it matters for your future.'},
    {t:'How Kids Can Earn Money',sub:'Mini 3 · Earning',cat:'Earning',drive:'',d:'Fun, real ways kids can earn their own money and build great habits early.'},
    {t:'Setting a Money Goal',sub:'Power Lesson · Saving',cat:'Saving',drive:'',d:'Mr. JQ shows how to set a savings goal and work toward something big — step by step, dollar by dollar.'},
    {t:'Different Places to Keep Your Money',sub:'Power Lesson · Saving',cat:'Saving',drive:'',d:'Pocket, piggy bank, or the bank? Mr. JQ explores the safest places to keep your money.'},
    {t:'Dollars and Cents Power Lessons',sub:'Power Lesson · Counting',cat:'Counting',drive:'',d:'Power lessons on dollars and cents — counting money, understanding value, and spending smart.'},
    {t:'Madam x Pluto',sub:'CoinCept · Showdown',cat:'CoinCept Squad',drive:'',d:'Madam Moneyspinner and Pluto face off in a money-smart showdown.'},
    {t:'Madam x Bahati',sub:'CoinCept · Investing',cat:'CoinCept Squad',drive:'',d:'Bahati’s investing instincts meet Madam Moneyspinner’s challenge.'},
    {t:'Dr x Zuna',sub:'CoinCept · Building',cat:'CoinCept Squad',drive:'',d:'Dr. Dollarvex and Zuna team up for a building-and-business adventure.'},
  ];
  window.CINE=CINE;
  CINE.forEach((e,i)=>{ e.src='assets/video/cinema/ep'+i+'.mp4'; e.poster='assets/video/cinema/ep'+i+'.jpg'; });
  // Doris: wire all at once → cvWireEpisodes(['ID1','ID2',...]) in CINE order, or per-title object.
  window.cvWireEpisodes=function(arr){ if(Array.isArray(arr)){arr.forEach((id,i)=>{if(CINE[i])CINE[i].drive=id;});} else if(arr&&typeof arr==='object'){CINE.forEach(e=>{if(arr[e.t])e.drive=arr[e.t];});} cvToast('🎬 Episodes wired'); if(window.state&&state.currentScreen==='cinema')goTo('cinema'); };
  const thumb=e=> e.poster||'';
  const CATCOL={'Money Basics':['#0e7a3a','#1B5E20'],'Earning':['#1d6fb8','#0e4a7a'],'Saving':['#0e7a6e','#0a5247'],'Counting':['#7a5a0e','#5a3f0a'],'CoinCept Squad':['#5a2d8a','#3a1d5e']};
  function epCard(e,i){ const [c1,c2]=CATCOL[e.cat]||['#1a1340','#0e0a26']; const tj=thumb(e);
    return `<div class="cine-card" onclick="playEp(${i})">
      <div class="cine-thumb" style="${tj?`background-image:url('${tj}')`:`background:linear-gradient(150deg,${c1},${c2})`}">
        <div class="cine-play">▶</div>${tj?'':`<div class="cine-thumb-t">${e.t}</div>`}
        <span class="cine-cat">${e.cat}</span></div>
      <div class="cine-meta"><div class="cine-title">${e.t}</div><div class="cine-sub">${e.sub}</div></div></div>`; }

  window.KABRIA_FOLDER='1YhzJAqxKds886m9GvlpOpCZzjkY-6aMQ';
  window.openDriveFolder=function(title){ let o=document.createElement('div'); o.id='cvVideo'; o.className='cv-video-ov';
    o.innerHTML=`<div class="cvv-card"><button class="cvv-x" onclick="closeVideo()">✕</button>
      <iframe class="cvv-folder" src="https://drive.google.com/embeddedfolderview?id=${window.KABRIA_FOLDER}#grid" frameborder="0"></iframe>
      <div class="cvv-title">${title||'Kabria · Lesson Library'} — tap a video to play</div></div>`;
    o.addEventListener('click',e=>{if(e.target===o)closeVideo();}); document.body.appendChild(o); };
  window.playEp=function(id){ const i=(typeof id==='number')?id:parseInt((''+id).replace(/\D/g,''))||0; const e=CINE[i]||CINE[0];
    if(window.stopVoice) stopVoice();          // lesson video has its own narration
    if(window.duckBgmForVideo) duckBgmForVideo(true);
    openVideo(e.src, e.t);
  };

  window.SCREENS.cinema=function(){ const feat=CINE[0]; const ft=thumb(feat);
    const rows=[['NEW · MONEY BASICS',CINE.filter(e=>e.cat==='Money Basics'||e.cat==='Earning')],['SAVING & COUNTING',CINE.filter(e=>e.cat==='Saving'||e.cat==='Counting')],['COINCEPT SQUAD',CINE.filter(e=>e.cat==='CoinCept Squad')]];
    const idx=e=>CINE.indexOf(e);
    return `<div class="v14-screen cinema-screen cine2">
      <div class="cine2-bg"></div>
      <div class="v14-topbar"><div class="v14-topbar-left"><button class="v14-back" onclick="goTo('home')">← HOME</button><div class="v14-title">COINAVERSE CINEMA</div></div>
        <div class="v14-topbar-right"><div class="v14-coin-pill"><img src="assets/ui/coin_3d.png"><span class="n" data-cv-coins>${(window.state||{}).coins||0}</span></div></div></div>
      <div class="cine2-wrap">
        <section class="cine2-hero" onclick="playEp(0)" style="${ft?`background-image:linear-gradient(90deg,rgba(8,4,26,.92),rgba(8,4,26,.35)),url('${ft}')`:''}">
          <div class="cine2-hero-in"><span class="cine2-badge">▶ FEATURED LESSON</span>
            <h1 class="cine2-h1">${feat.t}</h1><p class="cine2-p">${feat.d}</p>
            <button class="cine2-cta" onclick="event.stopPropagation();playEp(0)">▶ WATCH NOW</button></div></section>
        ${rows.map(([lbl,list])=>`<div class="cine2-rowlbl">${lbl}</div><div class="cine2-row">${list.map(e=>epCard(e,idx(e))).join('')}</div>`).join('')}
        <div class="cine2-note">🎬 ${CINE.length} real Coincept lessons by Kabria — tap any to play.</div>
      </div></div>`;
  };
})();
