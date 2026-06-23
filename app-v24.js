/* ════════════════════════════════════════════════════════════
   COINAVERSE v24 — P1 persistence/XP · P2 games · P3 screens · P4 auth
   Loads AFTER app.js. Uses window.state/goTo/WORLDS/HUBX/SCREENS.
   ════════════════════════════════════════════════════════════ */
(function(){
  const S = () => window.state || {};
  const ORDER = ["credtech","strategist","investor","builder","guardian","risktaker","rebuilder"];

  /* ───────── PERSISTENCE (P1) ───────── */
  function userId(){ return localStorage.getItem('coinaverse_user') || 'guest'; }
  function userKey(){ return 'coinaverse_prog_' + userId(); }
  const FIELDS = ['coins','level','xp','playerName','archetype','viewingWorld','dailyClaimed','streak','credPct','learned','missionsDone','gamesDone','inventory','skills'];
  function ensure(){ const s=S(); s.xp=s.xp||0; s.level=s.level||1; s.learned=s.learned||{}; s.missionsDone=s.missionsDone||{}; s.gamesDone=s.gamesDone||{}; s.inventory=s.inventory||[]; s.skills=s.skills||[]; }
  function save(){ try{ const s=S(),o={}; FIELDS.forEach(k=>{ if(s[k]!==undefined)o[k]=s[k]; }); localStorage.setItem(userKey(),JSON.stringify(o)); }catch(e){} }
  function load(){ try{ const r=localStorage.getItem(userKey()); if(!r)return; const o=JSON.parse(r),s=S(); Object.keys(o).forEach(k=>s[k]=o[k]); }catch(e){} }
  window.cvSave=save; window.cvLoad=load;

  /* ───────── XP · LEVEL · RANK ───────── */
  const XP_PER=100;
  const lvl = xp => Math.floor(xp/XP_PER)+1;
  function addXP(xp,coins){
    ensure(); const s=S(); const b=lvl(s.xp);
    s.xp+=xp; if(coins) s.coins=(s.coins||0)+coins;
    const a=lvl(s.xp); s.level=a;
    if(a>b){ toast(`⭐ LEVEL UP → LVL ${a}`); try{playClip('sys_level_rank_up');}catch(e){} burst(); }
    save(); refreshHUD();
  }
  window.cvAddXP=addXP;
  function hubRankIndex(token){ const s=S(); const n=Object.keys(s.learned||{}).filter(k=>k.startsWith(token+':')).length; return Math.min(5,Math.round(n*5/8)); }
  window.cvHubRank=hubRankIndex;
  function markLearned(token,i){ ensure(); const s=S(),k=token+':'+i; if(!s.learned[k]){ s.learned[k]=1; addXP(25,0); toast('📚 +25 XP · Lesson learned'); } }
  window.markLearned=markLearned;

  function refreshHUD(){
    const s=S();
    document.querySelectorAll('.stat-pill').forEach(p=>{ const num=p.querySelector('.num'),lbl=p.querySelector('.lbl'); if(!num||!lbl)return;
      if(/COIN/i.test(lbl.textContent)) num.textContent=s.coins;
      if(/RANK|LVL/i.test(lbl.textContent)) num.textContent='LVL '+s.level; });
    document.querySelectorAll('#game-coins-hud').forEach(el=>el.textContent=s.coins);
    document.querySelectorAll('[data-cv-coins]').forEach(el=>el.textContent=s.coins);
  }
  window.cvRefreshHUD=refreshHUD;

  /* ───────── TOAST + confetti ───────── */
  function toast(msg){ let t=document.getElementById('cvToast'); if(!t){t=document.createElement('div');t.id='cvToast';document.body.appendChild(t);}
    const i=document.createElement('div'); i.className='cv-toast-item'; i.textContent=msg; t.appendChild(i);
    setTimeout(()=>{i.classList.add('out'); setTimeout(()=>i.remove(),400);},2200); }
  window.cvToast=toast;
  function burst(){ const c=document.createElement('div'); c.className='cv-burst';
    for(let k=0;k<24;k++){ const s=document.createElement('i'); s.style.cssText=`--a:${Math.random()*360}deg;--d:${60+Math.random()*120}px;--c:hsl(${Math.random()*60+40},90%,60%)`; c.appendChild(s);} 
    document.body.appendChild(c); setTimeout(()=>c.remove(),1100); }

  /* ───────── MISSION TICK (delegated) ───────── */
  document.addEventListener('click',e=>{
    const row=e.target.closest('.hub-mrow'); if(!row||!row.closest('.hub-screen'))return;
    const token=S().viewingWorld||S().archetype||'credtech';
    const idx=Array.from(row.parentElement.querySelectorAll('.hub-mrow')).indexOf(row);
    const k=token+':m'+idx; ensure(); const s=S();
    if(!s.missionsDone[k]){ s.missionsDone[k]=1; row.classList.add('done'); addXP(15,20); toast('✅ Mission complete · +20💰 +15 XP'); }
  });
  function markDoneMissions(){ const token=S().viewingWorld||S().archetype||'credtech'; const s=S(); ensure();
    document.querySelectorAll('.hub-screen .hub-mrow').forEach((r,idx)=>{ if(s.missionsDone[token+':m'+idx]) r.classList.add('done'); });
    // current-rank highlight by progress
    const ri=hubRankIndex(token); document.querySelectorAll('.hub-screen .hub-rank').forEach((el,idx)=>{ el.classList.toggle('cur',idx===ri); }); }

  /* ───────── GAME FRAMEWORK (P2) ───────── */
  let _g=null;
  function gClose(reward){ if(_g){ _g.timers.forEach(clearInterval); _g.timers=[]; } const o=document.getElementById('cvGame'); if(o)o.remove(); if(reward!=null){ const xp=Math.max(10,Math.round(reward/2)); addXP(xp,reward); toast(`🏆 +${reward}💰 +${xp} XP`); } }
  window.cvGameClose=gClose;
  function gameWrap(token,nn,title,bodyHTML){
    const bg=`assets/game/${token}_d${nn}.jpg`;
    const o=document.createElement('div'); o.id='cvGame'; o.className='cv-game-ov';
    o.innerHTML=`<div class="cvg-card"><div class="cvg-bg" style="background-image:url('${bg}')"></div>
      <div class="cvg-top"><button class="cvg-x" onclick="cvGameClose()">✕ EXIT</button>
        <div class="cvg-title">${title}</div>
        <div class="cvg-hud"><span id="cvg-score">0</span><small>SCORE</small></div></div>
      <div class="cvg-stage" id="cvgStage">${bodyHTML}</div></div>`;
    document.body.appendChild(o); return o;
  }
  function setScore(n){ const e=document.getElementById('cvg-score'); if(e)e.textContent=n; }

  // mechanic A — TAP COLLECT (tap gold, avoid red)
  function mechCollect(token,nn,title,labelGood,labelBad){
    gameWrap(token,nn,title,`<div class="cvg-help">Tap the <b>gold ${labelGood}</b> · avoid the <b>red ${labelBad}</b> · 25s</div><div class="cvg-field" id="cvgField"></div><div class="cvg-timer" id="cvgTimer">25</div>`);
    let score=0,t=25; const field=document.getElementById('cvgField');
    const spawn=setInterval(()=>{ const good=Math.random()>0.32; const el=document.createElement('div');
      el.className='cvg-orb '+(good?'good':'bad'); el.textContent=good?'💰':'💥';
      el.style.left=(8+Math.random()*82)+'%'; el.style.animationDuration=(2.2+Math.random()*1.6)+'s';
      el.onclick=()=>{ if(el._d)return; el._d=1; score+=good?10:-5; if(score<0)score=0; setScore(score); el.style.transform='scale(0)'; setTimeout(()=>el.remove(),150); };
      field.appendChild(el); setTimeout(()=>el.remove(),4000);
    },520);
    const tick=setInterval(()=>{ t--; const tm=document.getElementById('cvgTimer'); if(tm)tm.textContent=t; if(t<=0){ clearInterval(spawn);clearInterval(tick); gClose(score);} },1000);
    _g={timers:[spawn,tick]};
  }
  // mechanic B — SORT into two bins
  function mechSort(token,nn,title,leftLabel,rightLabel,items){
    gameWrap(token,nn,title,`<div class="cvg-help">Swipe each card: <b>${leftLabel}</b> ⬅ or ➡ <b>${rightLabel}</b></div>
      <div class="cvg-card-area" id="cvgCardArea"></div>
      <div class="cvg-bins"><button class="cvg-bin l" onclick="cvgSort(0)">⬅ ${leftLabel}</button><button class="cvg-bin r" onclick="cvgSort(1)">${rightLabel} ➡</button></div>`);
    let score=0,qi=0; const area=document.getElementById('cvgCardArea');
    function show(){ if(qi>=items.length){ gClose(score); return; } area.innerHTML=`<div class="cvg-qcard">${items[qi].t}</div>`; }
    window.cvgSort=(side)=>{ if(qi>=items.length)return; const ok=items[qi].a===side; score+=ok?15:0; if(ok)toast('✓ Correct'); else toast('✗ Try the other side'); setScore(score); qi++; show(); };
    show(); _g={timers:[]};
  }
  // mechanic C — TIMING meter (tap in green zone)
  function mechMeter(token,nn,title,prompt){
    gameWrap(token,nn,title,`<div class="cvg-help">${prompt} — tap when the marker is in the <b>green zone</b> · 8 rounds</div>
      <div class="cvg-meter"><div class="cvg-zone"></div><div class="cvg-marker" id="cvgMark"></div></div>
      <button class="cvg-tap" onclick="cvgTap()">TAP!</button><div class="cvg-round" id="cvgRound">Round 1 / 8</div>`);
    let score=0,round=1,pos=0,dir=1; const mark=document.getElementById('cvgMark');
    const mv=setInterval(()=>{ pos+=dir*2.2; if(pos>=100){pos=100;dir=-1;} if(pos<=0){pos=0;dir=1;} if(mark)mark.style.left=pos+'%'; },16);
    window.cvgTap=()=>{ const hit=pos>=38&&pos<=62; score+=hit?14:0; toast(hit?'🎯 Perfect!':'➖ Missed'); setScore(score); round++; const r=document.getElementById('cvgRound'); if(round>8){ clearInterval(mv); gClose(score);} else if(r) r.textContent=`Round ${round} / 8`; };
    _g={timers:[mv]};
  }

  // route each district to a themed mechanic
  window.playDistrictGame=function(token,i){
    ensure(); const h=window.HUBX[token]||{}, d=(h.districts&&h.districts[i])||['Mini-Game','']; const nn=String(i+1).padStart(2,'0');
    const name=(d[0]||'MINI-GAME').toUpperCase();
    const m=i%3;
    if(m===0) mechCollect(token,nn,name,'coins','bombs');
    else if(m===1) mechSort(token,nn,name, 'NEED','WANT', [
      {t:'🍞 Groceries',a:0},{t:'🎮 New game console',a:1},{t:'💊 Medicine',a:0},{t:'👟 Designer sneakers',a:1},
      {t:'🚌 Bus fare to school',a:0},{t:'🍭 Extra candy',a:1},{t:'📚 School books',a:0},{t:'🎁 Impulse toy',a:1}]);
    else mechMeter(token,nn,name,'Balance your budget');
    S().gamesDone[token+':'+i]=1; save();
  };

  /* ───────── CINEMA PLAYER (P1) ───────── */
  const EPVID=['credtech_hub','strategist_hub','investor_hub','builder_hub','guardian_hub','risktaker_hub','rebuilder_hub','identity','greet'];
  window.openVideo=function(src,title){ if(window.stopVoice)stopVoice(); const o=document.createElement('div'); o.id='cvVideo'; o.className='cv-video-ov';
    o.innerHTML=`<div class="cvv-card"><button class="cvv-x" onclick="closeVideo()">✕</button><video class="cvv-vid" controls autoplay playsinline><source src="${src}" type="video/mp4"></video><div class="cvv-title">${title||''}</div></div>`;
    o.addEventListener('click',e=>{if(e.target===o)closeVideo();}); document.body.appendChild(o); };
  window.closeVideo=function(){ const o=document.getElementById('cvVideo'); if(o){const v=o.querySelector('video');if(v)v.pause();o.remove();} };
  // override episode player to use a real video
  window.playEp=function(id){ const idx=(typeof id==='number'?id:(parseInt((''+id).replace(/\D/g,''))||1))-1; const v='assets/video/'+EPVID[Math.abs(idx)%EPVID.length]+'.mp4'; openVideo(v,'COINAVERSE · Episode'); };

  /* ───────── GENERIC MODAL + REAL SCREENS (P3) ───────── */
  function modal(html){ const o=document.createElement('div'); o.id='cvModal'; o.className='cv-modal-ov';
    o.innerHTML=`<div class="cvm-card">${html}<button class="cvm-x" onclick="cvCloseModal()">✕</button></div>`;
    o.addEventListener('click',e=>{if(e.target===o)cvCloseModal();}); document.body.appendChild(o); }
  window.cvCloseModal=()=>{ const o=document.getElementById('cvModal'); if(o)o.remove(); };

  window.openProfile=function(){ ensure(); const s=S(); const learned=Object.keys(s.learned).length, games=Object.keys(s.gamesDone).length, miss=Object.keys(s.missionsDone).length;
    const w=(window.WORLDS||{})[s.archetype||'guardian']||{}; const pct=Math.round((s.xp%XP_PER));
    modal(`<div class="cvm-h">👤 HERO PROFILE</div>
      <div class="cvm-prof"><div class="cvm-av" style="background-image:url('${w.character||''}')"></div>
      <div><div class="cvm-name">${s.playerName||'Hero'}</div><div class="cvm-arch">${w.archetype||'Explorer'} · LVL ${s.level}</div></div></div>
      <div class="cvm-xpbar"><div style="width:${pct}%"></div></div><div class="cvm-xptxt">${s.xp} XP · ${XP_PER-pct} to next level</div>
      <div class="cvm-grid"><div><b>${s.coins}</b><span>Coins</span></div><div><b>${learned}</b><span>Lessons</span></div><div><b>${games}</b><span>Games won</span></div><div><b>${miss}</b><span>Missions</span></div></div>`); };

  window.openSettings=function(){ const on=(window.isAudioOn&&window.isAudioOn());
    modal(`<div class="cvm-h">⚙️ SETTINGS</div>
      <div class="cvm-row"><span>Sound</span><button class="cvm-btn" onclick="try{avToggle()}catch(e){};cvCloseModal();openSettings()">${on?'🔊 ON':'🔇 OFF'}</button></div>
      <div class="cvm-row"><span>Parent Zone</span><button class="cvm-btn" onclick="cvCloseModal();goTo('parent_dashboard')">Open dashboard</button></div>
      <div class="cvm-row"><span>Account</span><button class="cvm-btn" onclick="cvLogout()">Log out</button></div>
      <div class="cvm-row"><span>Progress</span><button class="cvm-btn danger" onclick="cvReset()">Reset progress</button></div>
      <div class="cvm-note">Coinaverse demo · progress saved on this device.</div>`); };
  window.cvReset=function(){ if(!confirm('Reset all progress on this device?'))return; localStorage.removeItem(userKey()); const s=S(); s.coins=100;s.xp=0;s.level=1;s.learned={};s.missionsDone={};s.gamesDone={}; s.dailyClaimed=[false,false,false,false,false,false,false]; save(); cvCloseModal(); goTo(S().currentScreen||'home'); toast('Progress reset'); };

  window.openInventory=function(){ ensure(); const s=S(); const items=s.inventory.length?s.inventory:[];
    const tk=`assets/ui/token_${s.archetype||'strategist'}.png`;
    const list = items.length? items.map(it=>`<div class="cvm-item"><img src="${it.img||''}" onerror="this.style.display='none'"><span>${it.name||it}</span></div>`).join('')
      : `<div class="cvm-empty">No items yet — earn coins and buy gear in the SHOP.</div>`;
    modal(`<div class="cvm-h">🎒 INVENTORY</div><div class="cvm-token"><img src="${tk}" onerror="this.style.display='none'"><span>${s.coins} hub credits</span></div><div class="cvm-items">${list}</div>`); };

  window.openSkills=function(){ ensure(); const s=S(); const SK=[['🧮 Budgeting',1],['💰 Saving',2],['📈 Investing',4],['🛡 Protection',6],['🏦 Credit',8],['🚀 Building',10]];
    const rows=SK.map(([n,L])=>{ const un=s.level>=L; return `<div class="cvm-skill ${un?'on':'off'}"><span>${n}</span><b>${un?'UNLOCKED':'LVL '+L}</b></div>`; }).join('');
    modal(`<div class="cvm-h">⚡ SKILL TREE</div><div class="cvm-note">Skills unlock as you level up by learning & winning games.</div>${rows}`); };

  window.openInbox=function(){ const msgs=[['🎉 Welcome to Coinaverse!','Pick a hero and start your first lesson to earn XP.'],
    ['🎯 Daily reward','Earn a reward each day you play — miss a day and your progress stays safe.'],
    ['🏆 New challenge','Beat a district mini-game to climb the leaderboard.']];
    modal(`<div class="cvm-h">✉️ INBOX</div>${msgs.map(m=>`<div class="cvm-msg"><div class="cvm-msg-t">${m[0]}</div><div class="cvm-msg-b">${m[1]}</div></div>`).join('')}`); };

  window.openPartyInvite=function(){ const friends=[['Maya','🦊',1],['Theo','🐼',1],['Zoe','🦄',0],['Kai','🐯',1],['Aria','🦋',0]];
    modal(`<div class="cvm-h">⚔️ INVITE FRIENDS</div><div class="cvm-note">Build a party to play co-op challenges.</div>
      ${friends.map(f=>`<div class="cvm-friend"><span>${f[1]} ${f[0]}</span><span class="dot ${f[2]?'on':''}"></span>
        <button class="cvm-btn sm" onclick="cvToast('Invite sent to ${f[0]}')">${f[2]?'Invite':'Offline'}</button></div>`).join('')}`); };

  /* dynamic leaderboard tabs */
  const LB=[['Aria','🦋','Investor',9120],['Theo','🐼','Strategist',8740],['Maya','🦊','Guardian',8010],['Kai','🐯','Builder',7430],['Zoe','🦄','Rebuilder',6980],['Nova','🐺','Risk-Taker',6510],['Leo','🦁','Credit',5990]];
  window.cvLbTab=function(kind){ ensure(); const s=S(); const me=['You','⭐',(window.WORLDS||{})[s.archetype||'guardian']?.archetype||'Hero',(s.coins||0)+ (s.xp||0)];
    let rows=LB.concat([me]);
    if(kind==='archetype'){ rows=rows.filter(r=>r[2]===me[2]); }
    if(kind==='friends'){ rows=[['Maya','🦊','Guardian',8010],['Theo','🐼','Strategist',8740],['Kai','🐯','Builder',7430],me]; }
    rows.sort((a,b)=>b[3]-a[3]);
    const html=rows.map((r,i)=>`<div class="cvm-lb ${r[0]==='You'?'me':''}"><span class="r">${i+1}</span><span class="e">${r[1]}</span><span class="n">${r[0]}<small>${r[2]}</small></span><b>${r[3].toLocaleString()}</b></div>`).join('');
    modal(`<div class="cvm-h">🏆 LEADERBOARD · ${kind==='archetype'?'BY ARCHETYPE':kind==='friends'?'FRIENDS':'GLOBAL'}</div>
      <div class="cvm-lbtabs"><button onclick="cvCloseModal();cvLbTab('global')">Global</button><button onclick="cvCloseModal();cvLbTab('archetype')">Archetype</button><button onclick="cvCloseModal();cvLbTab('friends')">Friends</button></div>${html}`); };

  /* ───────── AUTH FACADE (P4) ───────── */
  function accounts(){ try{return JSON.parse(localStorage.getItem('coinaverse_accounts')||'{}');}catch(e){return {};} }
  function saveAccounts(a){ localStorage.setItem('coinaverse_accounts',JSON.stringify(a)); }
  function setUser(email){ localStorage.setItem('coinaverse_user',email); const s=S(); s.coins=s.coins||100;s.xp=s.xp||0;s.level=s.level||1; load(); refreshHUD(); }
  window.cvSignup=function(){ const e=(document.getElementById('cvEmail')||{}).value||''; const p=(document.getElementById('cvPass')||{}).value||'';
    if(!e||!p){ toast('Enter email + password'); return; } const a=accounts();
    if(a[e]){ toast('Account exists — logging in'); } else { a[e]={pw:p,created:Date.now()}; saveAccounts(a); toast('Account created 🎉'); }
    setUser(e); goTo('age_parental'); };
  window.cvLogin=function(){ const e=(document.getElementById('cvEmail')||{}).value||''; const p=(document.getElementById('cvPass')||{}).value||''; const a=accounts();
    if(a[e]&&a[e].pw===p){ setUser(e); toast('Welcome back'); goTo('age_parental'); } else { toast('Wrong email or password'); } };
  window.cvSocial=function(prov){ const e=`hero@${prov}`; const a=accounts(); if(!a[e]){a[e]={pw:'',created:Date.now(),social:prov};saveAccounts(a);} setUser(e); toast(`Continuing with ${prov}`); goTo('age_parental'); };
  window.cvGuest=function(){ localStorage.setItem('coinaverse_user','guest'); load(); refreshHUD(); goTo('age_parental'); };
  window.cvLogout=function(){ save(); localStorage.removeItem('coinaverse_user'); cvCloseModal(); const s=S(); s.coins=100;s.xp=0;s.level=1;s.learned={};s.missionsDone={};s.gamesDone={}; goTo('signin'); toast('Logged out'); };

  /* ───────── BOOT + render hooks ───────── */
  function postRender(){ ensure(); markDoneMissions(); refreshHUD(); }
  const _goTo=window.goTo;
  window.goTo=function(id,opts){ _goTo(id,opts); save(); setTimeout(postRender,0); };
  // initial load for current user / guest
  ensure(); load(); setTimeout(()=>{ ensure(); refreshHUD(); },300);
  // expose audio-on flag for openDistrict
  window.AUDIO_ON = false; document.addEventListener('pointerdown',()=>{ window.AUDIO_ON=true; },{once:true});
})();
