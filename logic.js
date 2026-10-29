const TH=[[25,50,75,100],[50,100,150,200],[75,150,225,400],[125,250,375,500],[250,500,750,1100],[300,600,900,1400],[350,750,1100,1700],[450,900,1400,2100],[550,1100,1600,2400],[600,1200,1900,2800],[800,1600,2400,3600],[1000,2000,3000,4500],[1100,2200,3400,5100],[1250,2500,3800,5700],[1400,2800,4300,6400],[1600,3200,4800,7200],[2000,3900,5900,8800],[2100,4200,6300,9500],[2400,4900,7300,10900],[2800,5700,8500,12700]];
const DIFFS=['easy','medium','hard','deadly'];
const MULTS=[0.5,1,1.5,2,2.5,3,4,5];
function multIdx(n){return n<=1?1:n==2?2:n<=6?3:n<=10?4:n<=14?5:6;}
function multiplier(n,pcs){let i=multIdx(n);if(pcs<3)i++;else if(pcs>=6)i--;return MULTS[Math.max(0,Math.min(7,i))];}
function thresholds(pcs,lvl){return TH[lvl-1].map(x=>x*pcs);}
function rate(adj,pcs,lvl){const t=thresholds(pcs,lvl);let r='trivial';t.forEach((v,i)=>{if(adj>=v)r=DIFFS[i];});return r;}
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function build(M,o){ // o:{pcs,lvl,count,env,type,diff}
  const t=thresholds(o.pcs,o.lvl),di=DIFFS.indexOf(o.diff),lo=t[di],hi=di<3?t[di+1]:t[3]*1.5;
  const warns=[];
  let pool=M.filter(m=>(o.type=='any'||m.t==o.type)&&m.xp>0);
  if(!pool.length){warns.push('No monsters match those filters. Try another type, source, or setting.');return {monsters:[],raw:0,adj:0,mult:1,rating:'trivial',warns,thresholds:t};}
  const envPool=pool.filter(m=>o.env=='any'||(m.e||[]).includes(o.env));
  if(envPool.length)pool=envPool;else if(o.env=='castle')warns.push('No monsters are tagged for a castle yet, so this fight uses creatures from anywhere. Save a custom monster with the castle setting and it can show up here.');
  else if(o.env!='any')warns.push(`No ${o.type} monsters are typical in a ${o.env}; using ${o.type} monsters from anywhere.`);
  const counts=o.count=='auto'?[1,2,3,4,5,6].sort(()=>Math.random()-.5):[o.count];
  for(const n of counts){
    const mu=multiplier(n,o.pcs),target=(lo+hi)/2/mu/n;
    const fit=pool.filter(m=>m.xp>=lo/mu/n*0.7&&m.xp<=hi/mu/n);
    if(!fit.length)continue;
    let best=null;
    for(let k=0;k<40;k++){const pick=[];for(let i=0;i<n;i++)pick.push(i>0&&Math.random()<.5?pick[0]:rnd(fit));
      const adj=pick.reduce((s,m)=>s+m.xp,0)*mu;const sc=adj>=lo&&adj<hi?0:Math.min(Math.abs(adj-lo),Math.abs(adj-hi));
      if(!best||sc<best.sc)best={pick,sc};if(sc==0)break;}
    return finish(best.pick,o,warns,mu);
  }
  // nothing fits fairly: closest option
  const n=counts[0],mu=multiplier(n,o.pcs),target=(lo+hi)/2/mu/n;
  const c=pool.slice().sort((a,b)=>Math.abs(Math.log(a.xp/target))-Math.abs(Math.log(b.xp/target)))[0];
  warns.push(`Nothing in "${o.type}" fits a ${o.diff} fight for ${o.pcs} level-${o.lvl} PCs with ${n} monster(s). Closest option shown — adjust carefully!`);
  return finish(Array(n).fill(c),o,warns,mu);
}
function finish(pick,o,warns,mu){const raw=pick.reduce((s,m)=>s+m.xp,0),adj=raw*mu;
  const r=rate(adj,o.pcs,o.lvl);if(r!=o.diff&&!warns.length)warns.push(`Rated ${r} rather than ${o.diff} (closest fit available).`);
  return {monsters:pick,raw,adj,mult:mu,rating:r,warns,thresholds:thresholds(o.pcs,o.lvl)};}
const NUMW={a:1,an:1,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,single:1,couple:2,pair:2};
const ORD={first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10,eleventh:11,twelfth:12,thirteenth:13,fourteenth:14,fifteenth:15,sixteenth:16,seventeenth:17,eighteenth:18,nineteenth:19,twentieth:20};
const ENVS=['dungeon','forest','swamp','mountain','desert','cave','city','castle','coast','underdark','arctic','grassland','ruins'];
const ENVSYN={woods:'forest',jungle:'forest',marsh:'swamp',bog:'swamp',mountains:'mountain',hills:'mountain',caves:'cave',cavern:'cave',town:'city',castles:'castle',village:'city',sewer:'city',beach:'coast',sea:'coast',shore:'coast',ocean:'coast',tundra:'arctic',snow:'arctic',ice:'arctic',plains:'grassland',fields:'grassland',temple:'ruins',crypt:'dungeon',tomb:'dungeon'};
const TYPES=['dragon','fiend','undead','beast','giant','aberration','humanoid','monstrosity','construct','elemental','fey','celestial','ooze','plant'];
const TSYN={dragons:'dragon',demon:'fiend',demons:'fiend',devil:'fiend',devils:'fiend',fiends:'fiend',zombie:'undead',zombies:'undead',skeleton:'undead',skeletons:'undead',ghost:'undead',ghosts:'undead',vampire:'undead',animal:'beast',animals:'beast',beasts:'beast',giants:'giant',angel:'celestial',angels:'celestial',golem:'construct',golems:'construct',slime:'ooze',oozes:'ooze',elementals:'elemental',fairy:'fey',faerie:'fey',undeads:'undead'};
function parse(s){const out={};let w=s.toLowerCase().replace(/[^a-z0-9 -]/g,' ');
  const num=x=>/^\d+$/.test(x)?+x:NUMW[x];
  const words=w.split(/\s+/).filter(Boolean);
  for(let i=0;i<words.length;i++){const x=words[i],nx=words[i+1]||'',n2=words[i+2]||'';
    // "5 third level characters" / "5 level 3 characters" / "5 3rd-level players"
    let lv=null; const m=x.match(/^(\d+)(st|nd|rd|th)(-level)?$/); if(m)lv=+m[1]; if(ORD[x.replace('-level','')])lv=ORD[x.replace('-level','')];
    if(lv&&(nx.startsWith('level')||x.includes('-level'))){out.lvl=lv;const p=num(words[i-1]);if(p&&i>0)out.pcs=p;}
    if(x=='level'&&num(nx)&&num(nx)<=20){out.lvl=num(nx);}
    if(x.startsWith('lv')&&/^\d+$/.test(x.slice(2).replace('l','')))out.lvl=+x.replace(/\D/g,'');
    if(/^(characters?|players?|pcs?|adventurers?|heroes|party)$/.test(x)){for(let j=i-1;j>=Math.max(0,i-4);j--){if(num(words[j])&&!(words[j+1]||'').startsWith('level')){out.pcs=num(words[j]);break;}}}
    if(num(x)!=null&&(TYPES.includes(nx)||TSYN[nx]||/^(monsters?|enemies|creatures?|foes|baddies)$/.test(nx)||((nx=='big'||nx=='scary'||nx=='random')&&/monster/.test(n2)))&&!(words[i+2]||'').startsWith('level')){out.count=num(x);}
    if(ENVS.includes(x))out.env=x;else if(ENVSYN[x])out.env=ENVSYN[x];
    if(TYPES.includes(x))out.type=x;else if(TSYN[x])out.type=TSYN[x];
    if(DIFFS.includes(x))out.diff=x; if(x=='tough'||x=='challenging')out.diff='hard'; if(x=='easy'||x=='simple')out.diff='easy'; if(x=='brutal'||x=='boss')out.diff='deadly';
  }
  // "level 3 characters" with pcs before: "5 level 3 characters"
  const mm=w.match(/(\w+)\s+level\s+(\d+)\s+(characters?|players?|pcs?|adventurers?)/);if(mm&&num(mm[1]))out.pcs=num(mm[1]);
  return out;}

