const LVXP=[0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
const lvlOf=x=>{let l=1;LVXP.forEach((t,i)=>{if(x>=t)l=i+1});return l;};
let XP=JSON.parse(localStorage.getItem('xpTracker')||'null')||{members:null,entries:[],chars:[]};
const saveXP=()=>{localStorage.setItem('xpTracker',JSON.stringify(XP));renderXP();};
function addXP(name,xp){XP.entries.push({id:Date.now()+Math.random(),name,xp:+xp||0});saveXP();}
function defeat(i){const m=cur.monsters[i];addXP(m.n,m.xp);}
function xpTotal(){return XP.entries.reduce((s,e)=>s+e.xp,0);}
function members(){return XP.members||+$('pcs').value;}
function renderXP(){const t=xpTotal(),n=members(),per=Math.floor(t/n);
 $('xpm').value=n;
 $('xplist').innerHTML=XP.entries.length?XP.entries.map((e,i)=>`<li>${esc(e.name)} — ${e.xp.toLocaleString()} XP <button class="sm" onclick="XP.entries.splice(${i},1);saveXP()">✖</button></li>`).join(''):'<li><i>No defeated monsters yet.</i></li>';
 $('xptot').innerHTML=`Total: <b>${t.toLocaleString()} XP</b> · Each of ${n} members: <b>${per.toLocaleString()} XP</b>`;
 $('xpchars').innerHTML=XP.chars.map((c,i)=>{const now=c.start+per,l0=lvlOf(c.start),l1=lvlOf(now),nx=LVXP[l1];
  return `<tr><td>${esc(c.name)}</td><td>${c.start.toLocaleString()}</td><td><b>${now.toLocaleString()}</b></td><td>${l1}${l1>l0?' <span class="lvup">⬆ LEVEL UP!</span>':''}</td><td>${nx?(nx-now).toLocaleString()+' to '+(l1+1):'max'}</td><td><button class="sm" onclick="XP.chars.splice(${i},1);saveXP()">✖</button></td></tr>`}).join('');}
function addChar(){const n=$('xpcn').value.trim()||'Hero '+(XP.chars.length+1);XP.chars.push({name:n,start:+$('xpcs').value||0});$('xpcn').value='';$('xpcs').value='';saveXP();}
function addManual(){const v=$('xpadd').value.trim();if(!v)return;const m=findMonster(v);
 if(m&&m.n.toLowerCase()==v.toLowerCase())addXP(m.n,m.xp);else if(/^\d+$/.test(v))addXP('Manual XP',+v);else{alert('No monster named "'+v+'". Enter an exact name from the list, or a number.');return;}$('xpadd').value='';}
function lookup(){const v=$('lk').value.trim();if(!v){$('lkout').innerHTML='';return;}
 const m=findMonster(v);
 if(!m){$('lkout').innerHTML='<p class="warn">No match. Lookup includes the free SRD 5.1, this app\'s original homebrew, and any monsters you have saved. Others, like the Beholder or Mind Flayer, are in paid books.</p>';return;}
 LK=m;$('lkout').innerHTML=`<div class="btns" style="margin:8px 0"><button onclick="addToEnc()">➕ Add to encounter</button><button onclick="addXP(LK.n,LK.xp)">🏆 Add to XP tracker</button></div>`+block(m,-1);}
let LK=null;
function addToEnc(){cur.monsters.push(LK);cur.mult=multiplier(cur.monsters.length,opt.pcs);const f=finish(cur.monsters,opt,[],cur.mult);Object.assign(cur,{raw:f.raw,adj:f.adj,rating:f.rating});render();$('out').scrollIntoView({behavior:'smooth'});}

