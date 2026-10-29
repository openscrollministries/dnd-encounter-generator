/* Custom monsters and the offline procedural generator.
   Saved monsters live in localStorage and use the same stat-block shape as SRD data. */
const STORE_KEY='customMonsters';
const SIZES=['Tiny','Small','Medium','Large','Huge','Gargantuan'];
const CR_STEPS=[0,0.125,0.25,0.5,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
const CR_XP={0:10,0.125:25,0.25:50,0.5:100,1:200,2:450,3:700,4:1100,5:1800,6:2300,7:2900,8:3900,9:5000,10:5900,11:7200,12:8400,13:10000,14:11500,15:13000,16:15000,17:18000,18:20000,19:22000,20:25000,21:33000,22:41000,23:50000,24:62000,25:75000,26:90000,27:105000,28:120000,29:135000,30:155000};
// DMG monster statistics by CR: AC, HP low, HP high, attack bonus, damage/round low, damage/round high, save DC.
const CR_ROW=[
 [13,1,6,3,0,1,13],[13,7,35,3,2,3,13],[13,36,49,3,4,5,13],[13,50,70,3,6,8,13],
 [13,71,85,3,9,14,13],[13,86,100,3,15,20,13],[13,101,115,4,21,26,13],[14,116,130,5,27,32,14],
 [15,131,145,6,33,38,15],[15,146,160,6,39,44,15],[15,161,175,6,45,50,15],[16,176,190,7,51,56,16],
 [16,191,205,7,57,62,16],[17,206,220,7,63,68,16],[17,221,235,8,69,74,17],[17,236,250,8,75,80,17],
 [18,251,265,8,81,86,18],[18,266,280,8,87,92,18],[18,281,295,8,93,98,18],[18,296,310,9,99,104,18],
 [19,311,325,10,105,110,19],[19,326,340,10,111,116,19],[19,341,355,10,117,122,19],[19,356,400,10,123,140,19],
 [19,401,445,11,141,158,20],[19,446,490,11,159,176,20],[19,491,535,11,177,194,20],[19,536,580,12,195,212,21],
 [19,581,625,12,213,230,21],[19,626,670,12,231,248,21],[19,671,715,13,249,266,22],[19,716,760,13,267,284,22],
 [19,761,805,13,285,302,22],[19,806,850,14,303,320,23]
];
const DIE={Tiny:4,Small:6,Medium:8,Large:10,Huge:12,Gargantuan:20};
const ADJECTIVES=['Amber','Brindle','Cinder','Copper','Dapple','Ember','Fern','Flint','Glimmer','Hazel','Hickory','Jasper','Kindle','Lichen','Maple','Marble','Nettle','Nutmeg','Olive','Pebble','Pollen','Quartz','Ribbon','Russet','Sable','Sprout','Thistle','Tinder','Velvet','Willow','Zephyr','Clover','Cotton','Pippin','Sunny','Misty','Berry','Twig','Butter','Kelp'];
const NOUNS={
 aberration:['Gazer','Tendril','Wobbler','Murmur','Lensling','Peek'],
 beast:['Hopper','Prowler','Nibbler','Howler','Digger','Chitter'],
 celestial:['Glowmote','Dawnling','Kindlewing','Lightstep'],
 construct:['Gearling','Clicker','Windup','Cogling','Puppet'],
 dragon:['Scalekite','Puff','Whelpling','Cinderwing'],
 elemental:['Spark','Gustling','Emberkin','Damp'],
 fey:['Twirl','Glim','Mothkin','Pucklet','Giggle'],
 fiend:['Scamp','Cinderimp','Brimlet','Nuisance'],
 giant:['Stomper','Boulderkin','Thumper','Lump'],
 humanoid:['Lookout','Scrapper','Sneak','Maskling'],
 monstrosity:['Lurker','Snaggle','Tangle','Chimble','Thump'],
 ooze:['Blob','Slurp','Puddle','Gel'],
 plant:['Pod','Burr','Thicket','Bloom','Vinelet'],
 undead:['Rattle','Bonepicker','Mope','Gravewick','Shade']
};
const ARCHETYPES=[
 {type:'beast',features:['claws','bite'],attacks:['melee']},
 {type:'aberration',features:['tentacles'],attacks:['melee']},
 {type:'beast',features:['wings','flight'],attacks:['melee']},
 {type:'monstrosity',features:['poison','spines'],attacks:['ranged','melee']},
 {type:'fey',features:['spellcasting'],attacks:['spell']},
 {type:'monstrosity',features:['horns'],attacks:['melee','area']},
 {type:'beast',features:['burrowing'],attacks:['melee']},
 {type:'monstrosity',features:['regeneration','claws'],attacks:['melee']},
 {type:'fey',features:['partial-invisibility'],attacks:['melee']},
 {type:'plant',features:['spines'],attacks:['ranged','melee']},
 {type:'dragon',features:['breath','wings','flight'],attacks:['melee','area']},
 {type:'construct',features:['armor'],attacks:['melee']},
 {type:'undead',features:['claws'],attacks:['melee']},
 {type:'ooze',features:['acid'],attacks:['melee']},
 {type:'elemental',features:['area'],attacks:['area','melee']},
 {type:'giant',features:['horns'],attacks:['melee','area']},
 {type:'humanoid',features:['ranged'],attacks:['ranged','melee']},
 {type:'celestial',features:['spellcasting','flight'],attacks:['spell']},
 {type:'fiend',features:['claws','spellcasting'],attacks:['melee','spell']},
 {type:'plant',features:['poison'],attacks:['melee','ranged']}
];
let DRAFTS=[];

function clamp(n,a,b){n=+n;if(!isFinite(n))n=a;return Math.max(a,Math.min(b,n));}
function shuffle(a){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=b[i];b[i]=b[j];b[j]=t;}return b;}
function xpForCR(cr){return CR_XP[parseCR(cr)]||0;}
function parseCR(v){
 if(typeof v==='number'&&isFinite(v))return snapCR(v);
 const s=String(v==null?'':v).trim();
 const named={'0':0,'1/8':0.125,'1/4':0.25,'1/2':0.5,'⅛':0.125,'¼':0.25,'½':0.5};
 if(Object.prototype.hasOwnProperty.call(named,s))return named[s];
 const n=+s;return snapCR(isFinite(n)?n:1);
}
function snapCR(n){let best=0,bd=1e9;CR_STEPS.forEach(c=>{const d=Math.abs(c-n);if(d<bd){bd=d;best=c;}});return best;}
function pbForCR(cr){cr=parseCR(cr);if(cr>=29)return 9;if(cr>=25)return 8;if(cr>=21)return 7;if(cr>=17)return 6;if(cr>=13)return 5;if(cr>=9)return 4;if(cr>=5)return 3;return 2;}
function crStats(cr){
 cr=parseCR(cr);const i=CR_STEPS.indexOf(cr);const row=CR_ROW[i]||CR_ROW[4];
 return {cr,xp:CR_XP[cr],pb:pbForCR(cr),ac:row[0],hpLo:row[1],hpHi:row[2],atk:row[3],dprLo:row[4],dprHi:row[5],dc:row[6]};
}
function expressDamage(target,mod){
 target=Math.max(1,Math.round(target));mod=Math.round(mod)||0;
 const dice=[4,6,8,10,12];let best=null;
 for(let di=0;di<dice.length;di++){const die=dice[di],mean=(die+1)/2;
  for(let n=1;n<=10;n++){const avg=n*mean+mod;if(avg<1)continue;const err=Math.abs(avg-target);
   const bias=(die===6||die===8?0:0.2)+n*0.03;const score=err+bias;
   if(!best||score<best.score)best={n,die,avg,score};}}
 const total=Math.max(1,Math.floor(best.avg+1e-6));
 const expr=mod===0?best.n+'d'+best.die:best.n+'d'+best.die+(mod>0?' + '+mod:' - '+(-mod));
 return {total,expr,avg:best.avg};
}
function cleanPairs(list){
 if(!Array.isArray(list))return [];
 return list.map(x=>{
  if(!Array.isArray(x)||x.length<2)return null;
  const n=String(x[0]||'').trim().slice(0,80),d=String(x[1]||'').trim().slice(0,2000);
  if(!n&&!d)return null;return [n||'Trait',d];
 }).filter(Boolean);
}
function normalizeMonster(raw){
 const m=raw||{};
 const ab=(Array.isArray(m.ab)?m.ab:[10,10,10,10,10,10]).slice(0,6);
 while(ab.length<6)ab.push(10);
 const scores=ab.map(n=>clamp(n,1,30));
 const cr=parseCR(m.cr);
 let e=Array.isArray(m.e)?m.e.map(x=>x==='town'?'city':x).filter(x=>ENVS.includes(x)):[];
 const sz=SIZES.includes(m.sz)?m.sz:'Medium';
 const type=TYPES.includes(m.t)?m.t:'monstrosity';
 let hp=clamp(m.hp,1,9999),hd=String(m.hd||'').trim();
 if(!hd){const built=hitDice(hp,sz,scores[2]);hp=built.hp;hd=built.hd;}
 const wis=scores[4];
 return {
  n:String(m.n||'Unnamed Creature').trim().slice(0,80)||'Unnamed Creature',
  sz,t:type,st:'custom',al:String(m.al||'unaligned').trim().slice(0,40)||'unaligned',
  ac:clamp(m.ac,1,30),act:String(m.act||'').trim().slice(0,40),
  hp,hd:hd.slice(0,40),sp:String(m.sp||'walk 30 ft.').trim().slice(0,80)||'walk 30 ft.',
  ab:scores,sv:String(m.sv||'').trim().slice(0,80),sk:String(m.sk||'').trim().slice(0,120),
  se:String(m.se||('passive perception '+(10+md(wis)))).trim().slice(0,120),
  la:String(m.la||'—').trim().slice(0,160)||'—',
  cr,xp:xpForCR(cr),
  res:Array.isArray(m.res)?m.res.filter(r=>Array.isArray(r)&&r.length>=2).map(r=>[String(r[0]).slice(0,20),String(r[1]).slice(0,80)]):[],
  tr:cleanPairs(m.tr),a:cleanPairs(m.a),ra:cleanPairs(m.ra),la2:cleanPairs(m.la2),
  e,custom:1,id:String(m.id||uid()).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40)||uid()
 };
}
function uid(){return 'm'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function setSrc(v){
 if(v==null||typeof v!=='string'){const el=typeof document!=='undefined'&&document.getElementById&&document.getElementById('src');v=el&&el.value||'all';}
 MON=MONALL.filter(m=>{
  if(v==='srd')return !m.hb&&!m.custom;
  if(v==='hb')return !!m.hb&&!m.custom;
  if(v==='mine')return !!m.custom;
  return true;
 });
}
function findMonster(v,loose){
 const q=String(v||'').trim().toLowerCase();if(!q)return null;
 return MONALL.find(x=>x.custom&&x.n.toLowerCase()===q)
  ||MONALL.find(x=>x.n.toLowerCase()===q)
  ||MONALL.find(x=>x.n.toLowerCase().startsWith(q))
  ||(loose!==false&&MONALL.find(x=>x.n.toLowerCase().includes(q)))
  ||null;
}
function takenNames(){return new Set(MONALL.map(m=>m.n.toLowerCase()));}
function uniqueName(base,extra){
 const names=takenNames();if(extra)extra.forEach(n=>names.add(String(n).toLowerCase()));
 if(!names.has(base.toLowerCase()))return base;
 let i=2;while(names.has((base+' '+i).toLowerCase())&&i<200)i++;return base+' '+i;
}
function bandFor(level){
 level=clamp(level,1,20);let lo;
 if(level<=1)lo=0.125;else if(level===2)lo=0.25;else if(level===3)lo=0.5;else lo=level-3;
 return CR_STEPS.filter(cr=>cr+1e-9>=lo&&cr<=level&&cr>0);
}
function pickCR(level,pcs,intent){
 const band=bandFor(level);if(!band.length)return 1;
 if(intent==='minion')return band[0];
 if(intent==='boss')return band[band.length-1];
 const med=thresholds(clamp(pcs||4,1,10),clamp(level,1,20))[1];
 if(intent==='hard'){const hi=band.filter(cr=>xpForCR(cr)>=med*0.85);return rnd(hi.length?hi:[band[band.length-1]]);}
 const mid=band.filter(cr=>{const x=xpForCR(cr);return x>=med*0.5&&x<=med*1.15;});
 return rnd(mid.length?mid:band);
}
function spreadCR(level,n,intent){
 const band=bandFor(level);
 if(intent==='boss')return Array(n).fill(band[band.length-1]);
 if(intent==='minion')return Array(n).fill(band[0]);
 const out=[];
 for(let i=0;i<n;i++){const idx=Math.round(i*(band.length-1)/Math.max(1,n-1));out.push(band[Math.max(0,Math.min(band.length-1,idx))]);}
 return out;
}
function hitDice(target,size,conScore){
 const die=DIE[size]||8,con=md(conScore),avg=(die+1)/2,per=avg+con;
 let n0=per>0.5?Math.round(target/per):Math.round(target/Math.max(0.5,avg));
 n0=clamp(n0,1,40); let best=null;
 for(let n=Math.max(1,n0-4);n<=Math.min(40,n0+4);n++){
  const hp=Math.round(n*avg)+n*con;if(hp<1)continue;const err=Math.abs(hp-target);
  if(!best||err<best.err)best={n,hp,err};
 }
 if(!best)best={n:1,hp:Math.max(1,target|0)};
 const bonus=best.n*con;let hd=best.n+'d'+die;
 if(bonus>0)hd+='+'+bonus;else if(bonus<0)hd+=String(bonus);
 return {hp:best.hp,hd};
}
function fightNote(cr,xp,level,pcs){
 pcs=clamp(pcs||4,1,10);level=clamp(level||1,1,20);
 const t=thresholds(pcs,level);let role;
 if(xp<t[0])role='a light foe on its own, easy to drop into a group';
 else if(xp<t[1])role='an easy fight on its own';
 else if(xp<t[2])role='a medium fight on its own';
 else if(xp<t[3])role='a hard fight on its own';
 else role='a deadly fight on its own, so use it with care';
 return 'Tuned for '+pcs+' level-'+level+' character'+(pcs===1?'':'s')+': CR '+fmt(cr)+' ('+xp.toLocaleString()+' XP), '+role+'.';
}
function castingAbility(type){
 if(type==='fey'||type==='fiend'||type==='dragon')return 'cha';
 if(type==='celestial'||type==='humanoid'||type==='giant')return 'wis';
 return 'int';
}
function abilityScores(type,features,attacks,primary,cr){
 let str=10,dex=12,con=cr<1?12:cr<4?14:cr<8?16:cr<14?18:20,int=10,wis=12,cha=10;
 if(type==='beast'||type==='plant'||type==='ooze')int=cr>=8?4:2;
 if(type==='construct'){int=3;cha=5;}
 if(type==='undead'){int=6;cha=12;}
 if(type==='dragon'){int=12;wis=13;cha=14;}
 if(type==='aberration'){int=12;wis=14;}
 if(type==='fey'||type==='fiend'){int=12;cha=14;}
 if(type==='celestial'){wis=14;cha=14;}
 if(features.includes('regeneration')||features.includes('poison'))con=Math.max(con,16);
 const wantStr=attacks.includes('melee')||features.some(f=>['tentacles','claws','bite','horns','tail','burrowing','acid'].includes(f))||type==='giant'||type==='construct';
 const wantDex=attacks.includes('ranged')||features.some(f=>['flight','wings','partial-invisibility','invisibility','spines','web'].includes(f));
 const wantCast=attacks.includes('spell')||features.includes('spellcasting');
 if(wantStr)str=Math.max(str,primary);
 if(wantDex)dex=Math.max(dex,primary);
 if(wantCast){const key=castingAbility(type);if(key==='cha')cha=Math.max(cha,primary);else if(key==='wis')wis=Math.max(wis,primary);else int=Math.max(int,primary);}
 if(!wantStr&&!wantDex&&!wantCast)str=Math.max(str,primary);
 return [str,dex,con,int,wis,cha].map(s=>clamp(s,1,30));
}
function alignFor(type){
 return {beast:'unaligned',plant:'unaligned',ooze:'unaligned',construct:'unaligned',undead:'neutral evil',fiend:'chaotic evil',celestial:'lawful good',fey:'chaotic neutral',dragon:'neutral',aberration:'neutral evil',elemental:'neutral',giant:'neutral',humanoid:'any alignment',monstrosity:'unaligned'}[type]||'unaligned';
}
function inferType(features){
 if(features.includes('tentacles'))return 'aberration';
 if(features.includes('breath'))return 'dragon';
 if(features.includes('spellcasting'))return rnd(['fey','aberration','humanoid']);
 if(features.includes('burrowing'))return rnd(['beast','monstrosity']);
 if(features.includes('partial-invisibility')||features.includes('invisibility'))return rnd(['fey','aberration']);
 if(features.includes('poison')&&features.includes('spines'))return 'plant';
 if(features.includes('regeneration'))return 'monstrosity';
 if(features.includes('wings')||features.includes('flight'))return rnd(['beast','monstrosity']);
 return rnd(['beast','monstrosity','humanoid','plant']);
}
function inferEnvs(type,features){
 let e={plant:['forest','grassland'],aberration:['dungeon','cave','underdark'],undead:['dungeon','ruins','castle'],construct:['dungeon','castle','city'],fey:['forest','grassland'],fiend:['dungeon','ruins'],dragon:['mountain','cave'],beast:['grassland','forest'],ooze:['dungeon','cave'],elemental:['mountain','coast'],giant:['mountain','grassland'],humanoid:['city','castle','dungeon'],celestial:['ruins','city'],monstrosity:['dungeon','cave','mountain']}[type]||['dungeon'];
 e=e.slice();
 if(features.includes('burrowing'))e=['cave','desert','mountain'];
 if(features.includes('aquatic'))e=['coast','swamp'];
 return e.filter(x=>ENVS.includes(x));
}
function defaultSize(cr,type){
 if(type==='giant')return cr>=6?'Huge':'Large';
 if(type==='dragon')return cr>=11?'Huge':cr>=4?'Large':'Medium';
 if(type==='ooze'&&cr<1)return 'Small';
 if(cr<1)return rnd(['Small','Medium']);
 if(cr<=3)return rnd(['Medium','Medium','Large']);
 if(cr<=8)return rnd(['Medium','Large','Large']);
 if(cr<=15)return rnd(['Large','Huge']);
 return rnd(['Huge','Gargantuan']);
}
function speedLine(size,features,envs){
 const walk={Tiny:20,Small:30,Medium:30,Large:40,Huge:40,Gargantuan:50}[size]||30;
 const parts=['walk '+walk+' ft.'];
 if(features.includes('burrowing'))parts.push('burrow 20 ft.');
 if(features.includes('aquatic')||envs.includes('coast')||envs.includes('swamp'))parts.push('swim 30 ft.');
 if(features.includes('flight')||features.includes('wings')){
  const fly=(size==='Tiny'||size==='Small')?40:30;
  parts.push('fly '+fly+' ft.'+(features.includes('wings')?'':' (hover)'));
 }
 return parts.join(', ');
}
function skillLine(ab,features,type,pb){
 const parts=[];
 if(features.includes('partial-invisibility')||features.includes('invisibility'))parts.push('Stealth '+sg(md(ab[1])+pb));
 if(type==='aberration'||features.includes('pack'))parts.push('Perception '+sg(md(ab[4])+pb));
 return parts.join(', ');
}
function senseLine(ab,features,type,envs,pb){
 const parts=[];
 if(features.includes('burrowing'))parts.push('tremorsense 60 ft.');
 else if(type==='ooze')parts.push('blindsight 60 ft. (blind beyond this radius)');
 if(type==='aberration'||['dungeon','cave','underdark','castle','ruins'].some(e=>envs.includes(e))||['undead','fiend','construct','monstrosity'].includes(type))
  parts.push('darkvision 60 ft.');
 const skilled=type==='aberration'||features.includes('pack');
 parts.push('passive perception '+(10+md(ab[4])+(skilled?pb:0)));
 return parts.filter((p,i,a)=>a.indexOf(p)===i).join(', ');
}
function languageLine(type,intScore,envs){
 if(intScore<=4||type==='beast'||type==='ooze'||type==='plant')return '—';
 const langs=['Common'];
 if(type==='aberration'||envs.includes('underdark'))langs.push('Deep Speech');
 if(type==='dragon')langs.push('Draconic');
 if(type==='fiend')langs.push('Infernal');
 if(type==='celestial')langs.push('Celestial');
 if(type==='fey')langs.push('Sylvan');
 if(type==='giant')langs.push('Giant');
 if(type==='elemental')langs.push('Primordial');
 if(type==='undead')langs.push('the languages it knew in life');
 return langs.join(', ');
}
function saveLine(ab,cr,pb){
 if(cr<5)return '';
 const pairs=[['STR',md(ab[0])],['DEX',md(ab[1])],['CON',md(ab[2])],['WIS',md(ab[4])]].sort((a,b)=>b[1]-a[1]);
 return pairs.slice(0,2).map(p=>p[0]+' '+sg(p[1]+pb)).join(', ');
}
function resistLine(type,features,envs){
 const res=[];
 if(type==='construct'||type==='undead'||features.includes('poison'))res.push(['Resist','poison']);
 if(type==='fiend'||features.includes('breath')&&type==='dragon')res.push(['Resist','fire']);
 if(envs.includes('arctic')&&(type==='elemental'||type==='monstrosity'))res.push(['Resist','cold']);
 if(features.includes('acid')||type==='ooze')res.push(['Resist','acid']);
 const seen=new Set();
 return res.filter(r=>{const k=r.join(':');if(seen.has(k))return false;seen.add(k);return true;});
}
function typeTrait(type,dc){
 const map={
  beast:['Keen Nose','The creature has advantage on Wisdom (Perception) checks that rely on smell.'],
  plant:['Rooted','The creature has advantage on saving throws and ability checks against being pushed or knocked prone.'],
  ooze:['Amorphous','The creature can move through a space as narrow as 1 inch wide without squeezing.'],
  construct:['Unliving','The creature does not need to eat, drink, breathe, or sleep.'],
  undead:['Undead Nature','The creature does not need to eat, drink, breathe, or sleep.'],
  aberration:['Alien Mind','The creature has advantage on saving throws against being charmed or frightened.'],
  fey:['Woodland Trick','While in dim light or among plants, the creature can take the Hide action as a bonus action.'],
  dragon:['Bold','The creature has advantage on saving throws against being frightened.'],
  giant:['Big Steps','The creature can move through the space of any creature smaller than itself.'],
  elemental:['Elemental Nature','The creature does not need to eat, drink, breathe, or sleep.'],
  celestial:['Calm Presence','Allies within 10 feet of the creature have advantage on saving throws against being frightened.'],
  fiend:['Frightful Snarl','A creature that starts its turn within 10 feet of the creature and can see it must succeed on a DC '+dc+' Wisdom saving throw or be frightened until the start of its next turn. A creature that succeeds is immune to this snarl for 24 hours.'],
  humanoid:['Quick Step','The creature can take the Dash or Disengage action as a bonus action.'],
  monstrosity:['Ambush','In the first round of combat, the creature has advantage on attack rolls against any creature that has not taken a turn yet.']
 };
 return map[type]||null;
}
function spellNameFor(type){
 return {fey:'Glitter Dart',fiend:'Cinder Snap',celestial:'Kind Light',dragon:'Scale Spark',aberration:'Gloom Bolt',elemental:'Gust Bolt',humanoid:'Hex Spark'}[type]||'Gloom Bolt';
}
function areaPair(features,type,envs,dc,dmg){
 let name='Ground Slam',dtype='bludgeoning',shape='a 10-foot radius',save='Dexterity';
 if(features.includes('breath')&&(features.includes('poison')||type==='plant')){name='Poison Breath';dtype='poison';shape='a 15-foot cone';save='Constitution';}
 else if(features.includes('breath')||type==='dragon'){name='Cinder Breath';dtype='fire';shape='a 15-foot cone';save='Dexterity';}
 else if(features.includes('poison')){name='Poison Cloud';dtype='poison';shape='a 10-foot radius';save='Constitution';}
 else if(features.includes('tentacles')){name='Tentacle Sweep';dtype='bludgeoning';shape='a 10-foot radius';save='Strength';}
 else if(envs.includes('arctic')){name='Frost Burst';dtype='cold';shape='a 15-foot radius';save='Constitution';}
 else if(type==='elemental'){name='Element Burst';dtype='thunder';shape='a 15-foot radius';save='Constitution';}
 return [name+' (Recharge 5–6)','Each creature in '+shape+' must make a DC '+dc+' '+save+' saving throw, taking '+dmg.total+' ('+dmg.expr+') '+dtype+' damage on a failed save, or half as much damage on a successful one.'];
}
function buildCombat(o){
 const features=o.features,type=o.type,envs=o.envs,ab=o.ab,pb=o.pb,cr=o.cr,stats=o.stats;
 let attacks=o.attacks.slice();
 const has=f=>features.includes(f);
 if(has('tentacles')||has('claws')||has('bite')||has('horns')||has('tail')||has('acid')){if(!attacks.includes('melee'))attacks.push('melee');}
 if(has('spines')||has('web')){if(!attacks.includes('ranged'))attacks.push('ranged');}
 if(has('breath')){if(!attacks.includes('area'))attacks.push('area');}
 if(has('spellcasting')){if(!attacks.includes('spell'))attacks.push('spell');}
 if(!attacks.length){
  if(type==='fey'||type==='celestial'||type==='fiend')attacks=['spell','melee'];
  else if(type==='dragon')attacks=['melee','area'];
  else if(type==='humanoid')attacks=['melee','ranged'];
  else attacks=['melee'];
 }
 const wantMelee=attacks.includes('melee'),wantRanged=attacks.includes('ranged'),wantSpell=attacks.includes('spell'),wantArea=attacks.includes('area');
 const strMod=md(ab[0]),dexMod=md(ab[1]);
 const castKey=castingAbility(type);
 const castScore={int:ab[3],wis:ab[4],cha:ab[5]}[castKey];
 const castMod=md(castScore);
 const meleeBonus=strMod+pb,rangedBonus=dexMod+pb,spellBonus=castMod+pb;
 const dcUse=8+pb+Math.max(strMod,dexMod,castMod);
 const dpr=Math.max(1,(stats.dprLo+stats.dprHi)/2);
 const slots=[];
 if(wantMelee)slots.push('melee');
 if(wantRanged)slots.push('ranged');
 if(wantSpell)slots.push('spell');
 if(!slots.length)slots.push('melee');
 let swings=1;
 if(cr>=11)swings=3;else if(cr>=2)swings=2;
 const areaMain=wantArea&&!wantRanged&&!wantSpell&&(has('breath')||slots.length===1);
 const perHit=areaMain?Math.max(1,dpr*0.45/swings):dpr/swings;
 const traits=[],actions=[],reactions=[],legendary=[];
 if(has('partial-invisibility'))traits.push(['Partial Invisibility','The creature is faded, like a smudge on glass. Attack rolls against it have disadvantage. This benefit ends until the start of its next turn if it attacks or if it stands in bright light.']);
 else if(has('invisibility'))traits.push(['Fade','As a bonus action, the creature becomes invisible. The invisibility ends if it attacks or forces a creature to make a saving throw.']);
 if(has('regeneration')){const n=cr<1?3:cr<3?5:cr<6?10:cr<11?15:cr<17?20:30;
  traits.push(['Regeneration','The creature regains '+n+' hit points at the start of its turn if it has at least 1 hit point. If it takes fire or acid damage, this trait does not function at the start of its next turn.']);}
 if(has('burrowing'))traits.push(['Burrower','The creature can burrow through soil, sand, and loose rubble. It cannot burrow through solid rock.']);
 if(has('wings'))traits.push(['Winged','The creature flies with its wings. If it is knocked prone, or its speed is reduced to 0, it falls.']);
 else if(has('flight'))traits.push(['Floater','The creature can hover while flying.']);
 if(has('tentacles'))traits.push(['Long Grasp','The creature can hold one creature at a time with its tentacles.']);
 if(has('poison'))traits.push(['Poisonous','A creature that touches the monster, or hits it with a melee attack while within 5 feet of it, must succeed on a DC '+dcUse+' Constitution saving throw or be poisoned until the end of its next turn.']);
 if(has('pack'))traits.push(['Pack Spirit','The creature has advantage on an attack roll against a creature if at least one of the creature\'s allies is within 5 feet of the target and the ally is not incapacitated.']);
 if(has('web'))traits.push(['Web Walker','The creature ignores movement restrictions caused by webbing.']);
 if(has('aquatic'))traits.push(['Amphibious','The creature can breathe air and water.']);
 if(has('acid')){const bit=cr<2?'2 (1d4)':cr<6?'4 (1d8)':'7 (2d6)';traits.push(['Acidic Body','A creature that touches the monster, or hits it with a melee attack while within 5 feet of it, takes '+bit+' acid damage.']);}
 if(has('armor'))traits.push(['Plated Hide','The creature\'s patchwork armor is already included in its Armor Class.']);
 const flavor=typeTrait(type,dcUse);
 if(flavor&&!traits.some(t=>t[0]===flavor[0]))traits.push(flavor);
 if(wantSpell){const nice={cha:'Charisma',wis:'Wisdom',int:'Intelligence'}[castKey];
  traits.push(['Innate Tricks','The creature\'s spellcasting ability is '+nice+' (spell save DC '+dcUse+', '+sg(spellBonus)+' to hit with spell attacks). It needs no material components.']);}

 function meleeSpec(){
  if(has('tentacles'))return {name:'Tentacle',dtype:'bludgeoning',reach:10,grapple:true,mod:strMod,bonus:meleeBonus};
  if(has('claws'))return {name:'Claw',dtype:'slashing',reach:5,mod:strMod,bonus:meleeBonus};
  if(has('bite'))return {name:'Bite',dtype:'piercing',reach:5,mod:strMod,bonus:meleeBonus};
  if(has('horns'))return {name:'Gore',dtype:'piercing',reach:5,mod:strMod,bonus:meleeBonus};
  if(has('tail'))return {name:'Tail',dtype:'bludgeoning',reach:10,mod:strMod,bonus:meleeBonus};
  if(has('acid')||type==='ooze')return {name:'Pseudopod',dtype:'acid',reach:5,mod:strMod,bonus:meleeBonus};
  if(type==='plant')return {name:'Vine',dtype:'bludgeoning',reach:10,mod:strMod,bonus:meleeBonus};
  return {name:'Slam',dtype:'bludgeoning',reach:5,mod:strMod,bonus:meleeBonus};
 }
 function rangedSpec(){
  if(has('poison'))return {name:'Poison Spit',dtype:'poison',range:'20/60 ft.',mod:dexMod,bonus:rangedBonus,rider:'poison'};
  if(has('web'))return {name:'Web Shot',dtype:'bludgeoning',range:'30/60 ft.',mod:dexMod,bonus:rangedBonus,rider:'web'};
  if(has('spines')||type==='plant')return {name:'Spine Shot',dtype:'piercing',range:'40/120 ft.',mod:dexMod,bonus:rangedBonus};
  if(has('tentacles'))return {name:'Barb Shot',dtype:'piercing',range:'30/90 ft.',mod:dexMod,bonus:rangedBonus};
  if(type==='humanoid')return {name:'Shortbow',dtype:'piercing',range:'80/320 ft.',mod:dexMod,bonus:rangedBonus};
  return {name:'Hurled Stone',dtype:'bludgeoning',range:'20/60 ft.',mod:dexMod,bonus:rangedBonus};
 }
 const melee=wantMelee||slots.includes('melee')?meleeSpec():null;
 const ranged=wantRanged?rangedSpec():null;
 const sname=spellNameFor(type);
 const pattern=[];
 if(swings===1)pattern.push(slots[0]);
 else if(slots.length===1){for(let i=0;i<swings;i++)pattern.push(slots[0]);}
 else if(swings===2)pattern.push(slots[0],slots[1]);
 else pattern.push(slots[0],slots[0],slots[Math.min(1,slots.length-1)]);
 const words={melee:melee?melee.name.toLowerCase():'slam',ranged:ranged?ranged.name.toLowerCase():'ranged attack',spell:sname.toLowerCase()};
 if(pattern.length>1){
  const counts={};pattern.forEach(p=>{counts[p]=(counts[p]||0)+1;});
  const order=[];pattern.forEach(p=>{if(order.indexOf(p)<0)order.push(p);});
  const bits=order.map(p=>{const c=counts[p],w=c===1?'one':c===2?'two':'three';return w+' with its '+words[p];});
  const nword=pattern.length===2?'two':pattern.length===3?'three':String(pattern.length);
  const desc=bits.length===1?('The creature makes '+nword+' '+words[pattern[0]]+' attacks.'):('The creature makes '+nword+' attacks: '+bits.slice(0,-1).join(', ')+' and '+bits[bits.length-1]+'.');
  actions.push(['Multiattack',desc]);
 }
 function pushWeapon(spec){
  const d=expressDamage(perHit,spec.mod);let extra='';
  if(spec.grapple){const gdc=8+pb+strMod;extra+=' If the target is a creature no larger than the attacker, it is grappled (escape DC '+gdc+'). Until this grapple ends, the target is restrained, and the creature cannot grapple another target.';}
  if(spec.rider==='poison'||(has('poison')&&spec===melee&&!(ranged&&ranged.rider==='poison')))extra+=' The target must succeed on a DC '+dcUse+' Constitution saving throw or be poisoned until the end of its next turn.';
  if(spec.rider==='web')extra+=' The target is restrained by webs (escape DC '+dcUse+'). A creature can use its action to tear the webs off.';
  const kind=spec.range?('Ranged Weapon Attack: '+sg(spec.bonus)+' to hit, range '+spec.range+', one target.'):('Melee Weapon Attack: '+sg(spec.bonus)+' to hit, reach '+spec.reach+' ft., one target.');
  actions.push([spec.name,kind+' Hit: '+d.total+' ('+d.expr+') '+spec.dtype+' damage.'+extra]);
 }
 if(melee&&pattern.includes('melee'))pushWeapon(melee);
 if(ranged&&pattern.includes('ranged'))pushWeapon(ranged);
 if(wantSpell&&pattern.includes('spell')){const d=expressDamage(perHit,castMod);
  actions.push([sname,'Ranged Spell Attack: '+sg(spellBonus)+' to hit, range 60 ft., one target. Hit: '+d.total+' ('+d.expr+') force damage.']);}
 if(!actions.some(a=>/Hit:/.test(a[1]))){const d=expressDamage(Math.max(1,dpr),strMod);
  actions.push(['Slam','Melee Weapon Attack: '+sg(meleeBonus)+' to hit, reach 5 ft., one target. Hit: '+d.total+' ('+d.expr+') bludgeoning damage.']);}
 if(wantArea){const areaDmg=expressDamage(areaMain?dpr:Math.max(perHit,dpr*0.65),0);actions.push(areaPair(features,type,envs,dcUse,areaDmg));}
 if(cr>=4&&melee){
  if(has('tentacles'))reactions.push(['Yank','When a creature the monster can see misses it with a melee attack, the monster makes one tentacle attack against that creature.']);
  else reactions.push(['Sidestep','When a creature the monster can see hits it with a melee attack, the monster moves up to 10 feet without provoking opportunity attacks.']);
 }
 if(cr>=11){
  legendary.push(['Legendary Actions','The creature can take 2 legendary actions, choosing from the options below. Only one legendary action can be used at a time, and only at the end of another creature\'s turn. It regains spent legendary actions at the start of its turn.']);
  if(melee)legendary.push([melee.name+' Swipe','The creature makes one '+melee.name.toLowerCase()+' attack.']);
  else if(wantSpell)legendary.push(['Quick Cast','The creature uses '+sname+'.']);
  legendary.push(['Shift','The creature moves up to half its speed without provoking opportunity attacks.']);
 }
 return {traits,actions,reactions,legendary};
}
function makeName(type,used){
 const bag=used||takenNames();
 const nouns=NOUNS[type]||NOUNS.monstrosity;
 for(let k=0;k<80;k++){const n=rnd(ADJECTIVES)+' '+rnd(nouns);if(!bag.has(n.toLowerCase()))return n;}
 return rnd(ADJECTIVES)+' '+rnd(nouns)+' '+(10+Math.floor(Math.random()*90));
}
function generateMonster(spec){
 spec=spec||{};
 const level=clamp(spec.level||4,1,20),pcs=clamp(spec.pcs||4,1,10);
 const features=(spec.features||[]).slice();
 if(features.includes('wings')&&!features.includes('flight'))features.push('flight');
 let attacks=(spec.attacks||[]).slice();
 const type=TYPES.includes(spec.type)?spec.type:inferType(features);
 const cr=spec.cr!=null?parseCR(spec.cr):pickCR(level,pcs,spec.intent||'normal');
 const stats=crStats(cr);
 const size=SIZES.includes(spec.size)?spec.size:defaultSize(cr,type);
 let envs;
 if(spec.env&&spec.env!=='any'){const ev=spec.env==='town'?'city':spec.env;envs=ENVS.includes(ev)?[ev]:['dungeon'];}
 else envs=inferEnvs(type,features);
 if(!envs.length)envs=['dungeon'];
 const mod=stats.atk-stats.pb;
 const primary=clamp(10+mod*2,3,30);
 const ab=abilityScores(type,features,attacks,primary,cr);
 let ac=stats.ac,act='natural armor';
 if(features.includes('armor')||type==='construct'){ac=Math.min(25,ac+1);act=type==='construct'?'scrap plating':'natural armor';}
 if(ac<=12)act='';
 const hpTarget=stats.hpLo+Math.floor(Math.random()*(stats.hpHi-stats.hpLo+1));
 const hd=hitDice(hpTarget,size,ab[2]);
 const combat=buildCombat({cr,stats,ab,pb:stats.pb,features,attacks,type,envs});
 const used=spec._used;
 const name=spec.name?uniqueName(String(spec.name).trim().slice(0,80)||'Custom Creature',used):makeName(type,used);
 const note=fightNote(cr,stats.xp,level,pcs);
 return {
  n:name,sz:size,t:type,st:'',al:spec.alignment||alignFor(type),
  ac,act,hp:hd.hp,hd:hd.hd,sp:speedLine(size,features,envs),ab,
  sv:saveLine(ab,cr,stats.pb),sk:skillLine(ab,features,type,stats.pb),
  se:senseLine(ab,features,type,envs,stats.pb),la:languageLine(type,ab[3],envs),
  cr,xp:stats.xp,res:resistLine(type,features,envs),
  tr:combat.traits,a:combat.actions,ra:combat.reactions,la2:combat.legendary,
  e:envs,draft:1,_note:note,_features:features.slice(),_attacks:attacks.slice()
 };
}
function generateMany(spec){
 spec=spec||{};
 const n=clamp(spec.count||1,1,12);
 if(n===1)return [generateMonster(spec)];
 const crs=spec.cr!=null?Array(n).fill(parseCR(spec.cr)):spreadCR(spec.level||4,n,spec.intent||'normal');
 const pool=shuffle(ARCHETYPES.slice());
 const chosen=[];const seen=new Set();
 if(!spec.type){
  pool.forEach(a=>{if(seen.has(a.type))return;seen.add(a.type);chosen.push(a);});
 }
 while(chosen.length<n)chosen.push(pool[chosen.length%pool.length]);
 const used=new Set(MONALL.map(m=>m.n.toLowerCase()));
 const out=[];
 for(let i=0;i<n;i++){
  const arch=chosen[i];
  let features,attacks,type;
  if(spec.features&&spec.features.length){
   features=spec.features.slice();
   const extra=(arch.features||[]).find(f=>features.indexOf(f)<0);
   if(extra)features.push(extra);
  }else features=(arch.features||['claws']).slice();
  attacks=(spec.attacks&&spec.attacks.length)?spec.attacks.slice():(arch.attacks||['melee']).slice();
  type=spec.type||arch.type;
  const m=generateMonster(Object.assign({},spec,{count:1,type,features,attacks,cr:crs[i],size:spec.size||null,name:n>1?null:spec.name,_used:used}));
  used.add(m.n.toLowerCase());
  out.push(m);
 }
 return out;
}
function parseMonsterPrompt(s){
 const text=String(s||'');
 const low=text.toLowerCase();
 const parsed=parse(text);
 const spec={raw:text,level:null,pcs:null,count:1,type:parsed.type||null,env:parsed.env||null,size:null,features:[],attacks:[],intent:'normal',cr:null,name:null,alignment:null};
 let m;
 if((m=low.match(/\b(?:level|lvl|lv)\s*(\d{1,2})\b/)))spec.level=clamp(+m[1],1,20);
 else if((m=low.match(/\b(\d{1,2})(?:st|nd|rd|th)[-\s]*level\b/)))spec.level=clamp(+m[1],1,20);
 const ord=low.match(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth)[-\s]*level\b/);
 if(!spec.level&&ord&&ORD[ord[1]])spec.level=ORD[ord[1]];
 if((m=low.match(/\b(\d{1,2})\s+(?:[a-z]+\s+){0,2}level\s+(\d{1,2})\s+(?:characters|players|pcs|adventurers|heroes)\b/))){spec.pcs=clamp(+m[1],1,10);spec.level=spec.level||clamp(+m[2],1,20);}
 if((m=low.match(/\bparty of\s+(\d{1,2})\b/)))spec.pcs=clamp(+m[1],1,10);
 else if((m=low.match(/\b(\d{1,2})\s+(?:players|pcs|adventurers|heroes)\b/)))spec.pcs=clamp(+m[1],1,10);
 if((m=low.match(/\b(\d{1,2})\s+monsters?\b/)))spec.count=clamp(+m[1],1,12);
 else if((m=low.match(/\b(?:generate|make|create|build)\s+(\d{1,2})\b/)))spec.count=clamp(+m[1],1,12);
 if((m=low.match(/\b(?:cr|challenge rating)\s*(1\/8|1\/4|1\/2|\d{1,2}(?:\.\d+)?)\b/)))spec.cr=parseCR(m[1]);
 SIZES.forEach(sz=>{if(new RegExp('\\b'+sz.toLowerCase()+'\\b').test(low))spec.size=sz;});
 const feat=[['partial-invisibility',/partial(?:ly)? invisib/],['invisibility',/\binvisib/],['tentacles',/\btentacles?\b/],['claws',/\bclaws?\b/],['wings',/\bwings?\b/],['poison',/\bpoison|\bvenom/],['burrowing',/\bburrow/],['regeneration',/\bregenerat/],['bite',/\bbite\b|\bfangs?\b|\bjaws?\b/],['horns',/\bhorns?\b/],['tail',/\btails?\b/],['spines',/\bspines?\b|\bspikes?\b/],['breath',/\bbreath\b/],['web',/\bwebs?\b|\bwebbing\b/],['pack',/\bpack tactics\b|\bpack hunter\b/],['aquatic',/\baquatic\b|\bamphibious\b/],['armor',/\barmou?red\b|\bplated\b/],['acid',/\bacid\b/],['flight',/\bflight\b|\bfly(?:ing)?\b|\bflies\b/]];
 feat.forEach(([name,re])=>{if(re.test(low)&&spec.features.indexOf(name)<0){if(name==='invisibility'&&spec.features.indexOf('partial-invisibility')>=0)return;spec.features.push(name);}});
 if(/\branged\b|\bshoots?\b|\bbow\b|\bspits?\b/.test(low))spec.attacks.push('ranged');
 if(/\bmelee\b|\bclose combat\b/.test(low))spec.attacks.push('melee');
 if(/\bspellcast|\bcasts?\b|\bspells?\b|\bcaster\b/.test(low))spec.attacks.push('spell');
 if(/\barea\b|\baoe\b|\bcone\b|\bburst\b|\bbreath\b/.test(low))spec.attacks.push('area');
 if(/\bboss\b|\belite\b|\bchampion\b|\bdeadly\b/.test(low))spec.intent='boss';
 else if(/\bminion\b|\bweak\b|\bmook\b|\beasy fight\b/.test(low))spec.intent='minion';
 else if(/\bhard\b|\btough\b|\bbrute\b/.test(low))spec.intent='hard';
 const named=text.match(/\bnamed\s+["“']?([^"“”'\n.]{2,40})/i);
 if(named)spec.name=named[1].trim();
 return spec;
}
function refreshMonsterList(){
 const list=$('lkl');
 if(list)list.innerHTML=MONALL.map(m=>'<option value="'+escAttr(m.n)+'">').join('');
 renderSavedMonsters();
}
function renderSavedMonsters(){
 const ul=$('cmlist');if(!ul)return;
 if(!CUSTOM.length){ul.innerHTML='<li><i>None yet. Save a monster and it stays in this browser.</i></li>';return;}
 ul.innerHTML=CUSTOM.map((m,i)=>'<li><span><b>'+esc(m.n)+'</b> — CR '+fmt(m.cr)+' · '+esc(m.sz)+' '+esc(m.t)+' · '+((m.e&&m.e.length)?m.e.map(esc).join(', '):'no setting')+'</span><span class="btns"><button class="sm" type="button" onclick="viewCustom('+i+')">View</button><button class="sm" type="button" onclick="editCustom('+i+')">Edit</button><button class="sm" type="button" onclick="deleteCustom('+i+')">Delete</button></span></li>').join('');
}
function setMsg(t){const p=$('cmmsg');if(p)p.textContent=t||'';}
function showMods(){
 if(!$('cmstr'))return;
 ['str','dex','con','int','wis','cha'].forEach(k=>{const v=+$('cm'+k).value;const el=$('cm'+k+'m');if(el)el.textContent=isFinite(v)?'('+sg(md(clamp(v,1,30)))+')':'';});
 const cr=parseCR($('cmcr').value);const el=$('cmxp');if(el)el.textContent=xpForCR(cr).toLocaleString()+' XP from the 5e challenge rating table';
}
function addPair(id,name,desc){
 const box=$(id);if(!box)return;
 const d=document.createElement('div');d.className='pair';
 d.innerHTML='<input class="pn" placeholder="Name" value="'+escAttr(name||'')+'"><textarea class="pd" rows="2" placeholder="What it does">'+esc(desc||'')+'</textarea><button type="button" class="sm" onclick="this.parentNode.remove()" title="Remove">✖</button>';
 box.appendChild(d);
}
function readPairs(id){
 const box=$(id);if(!box)return [];
 return [...box.querySelectorAll('.pair')].map(p=>[p.querySelector('.pn').value.trim(),p.querySelector('.pd').value.trim()]).filter(x=>x[0]||x[1]);
}
function clearPairs(id){const box=$(id);if(box)box.innerHTML='';}
function readEnvs(){return [...document.querySelectorAll('#cmenvs input:checked')].map(x=>x.value);}
function textToRes(s){
 if(!String(s||'').trim())return [];
 return String(s).split(';').map(part=>{
  const bits=part.split(':');
  if(bits.length<2)return ['Resist',part.trim()];
  return [bits.shift().trim()||'Resist',bits.join(':').trim()];
 }).filter(r=>r[1]);
}
function resToText(res){return (res||[]).map(r=>r[0]+': '+r[1]).join('; ');}
function collectForm(){
 const ab=['str','dex','con','int','wis','cha'].map(k=>+$('cm'+k).value);
 let hp=$('cmhp').value,hd=$('cmhd').value.trim();
 return {
  id:$('cmid').value||undefined,
  n:$('cmname').value.trim(),sz:$('cmsize').value,t:$('cmtype').value,al:$('cmalign').value,
  ac:+$('cmac').value,act:$('cmact').value.trim(),hp:hp,hd:hd,sp:$('cmsp').value.trim(),
  ab,cr:$('cmcr').value,sv:$('cmsv').value.trim(),sk:$('cmsk').value.trim(),
  se:$('cmse').value.trim(),la:$('cmla').value.trim(),res:textToRes($('cmres').value),
  tr:readPairs('cmtraits'),a:readPairs('cmactions'),ra:readPairs('cmreactions'),la2:readPairs('cmlegend'),
  e:readEnvs()
 };
}
function fillForm(m){
 $('cmid').value=m.id&&m.custom?m.id:'';
 $('cmname').value=m.n||'';$('cmsize').value=SIZES.includes(m.sz)?m.sz:'Medium';
 $('cmtype').value=TYPES.includes(m.t)?m.t:'monstrosity';
 if(m.al&&![...$('cmalign').options].some(o=>o.value===m.al)){const o=document.createElement('option');o.value=m.al;o.textContent=m.al;$('cmalign').appendChild(o);}
 $('cmalign').value=m.al||'unaligned';
 $('cmac').value=m.ac!=null?m.ac:12;$('cmhp').value=m.hp!=null?m.hp:10;$('cmhd').value=m.hd||'';
 $('cmsp').value=m.sp||'';$('cmact').value=m.act||'';
 const keys=['str','dex','con','int','wis','cha'];
 keys.forEach((k,i)=>{$('cm'+k).value=(m.ab&&m.ab[i])||10;});
 $('cmcr').value=String(parseCR(m.cr));
 $('cmsv').value=m.sv||'';$('cmsk').value=m.sk||'';$('cmse').value=m.se||'';$('cmla').value=m.la&&m.la!=='—'?m.la:'';
 $('cmres').value=resToText(m.res);
 document.querySelectorAll('#cmenvs input').forEach(el=>{el.checked=(m.e||[]).indexOf(el.value)>=0;});
 clearPairs('cmtraits');clearPairs('cmactions');clearPairs('cmreactions');clearPairs('cmlegend');
 (m.tr||[]).forEach(p=>addPair('cmtraits',p[0],p[1]));
 (m.a||[]).forEach(p=>addPair('cmactions',p[0],p[1]));
 (m.ra||[]).forEach(p=>addPair('cmreactions',p[0],p[1]));
 (m.la2||[]).forEach(p=>addPair('cmlegend',p[0],p[1]));
 if(!$('cmtraits').children.length)addPair('cmtraits');
 if(!$('cmactions').children.length)addPair('cmactions');
 $('cmsave').textContent=m.id&&m.custom?'Update monster':'Save monster';
 showMods();
}
function resetCustomForm(){
 fillForm({n:'',sz:'Medium',t:'beast',al:'unaligned',ac:12,hp:22,hd:'4d8+4',sp:'walk 30 ft.',ab:[14,12,13,8,10,8],cr:1,e:[],tr:[],a:[],custom:0});
 $('cmid').value='';$('cmsave').textContent='Save monster';
}
function saveCustomForm(){
 const draft=collectForm();
 if(!draft.n){setMsg('Give the monster a name.');return;}
 const anySetting=!draft.e.length;
 if(anySetting)draft.e=ENVS.slice();
 const editing=$('cmid').value;
 if(MONALL.some(x=>!x.custom&&x.n.toLowerCase()===draft.n.toLowerCase())){setMsg('That name belongs to a built-in monster. Pick a new one so you can find yours.');return;}
 if(CUSTOM.some(x=>x.id!==editing&&x.n.toLowerCase()===draft.n.toLowerCase())){setMsg('You already saved a monster with that name.');return;}
 const m=normalizeMonster(draft);
 const i=CUSTOM.findIndex(x=>x.id===editing);
 if(editing&&i>=0)CUSTOM[i]=m;else CUSTOM.push(m);
 if(!persistCustom())return;
 setMsg('Saved '+m.n+' (CR '+fmt(m.cr)+', '+m.xp.toLocaleString()+' XP). It is in lookup, Build Your Own Encounter, and random fights when its type and setting match.'+(anySetting?' No setting was checked, so it can show up in any setting.':''));
 resetCustomForm();
}
function persistCustom(){
 try{localStorage.setItem(STORE_KEY,JSON.stringify(CUSTOM));}
 catch(e){setMsg('This browser could not store the monster.');return false;}
 MONALL=SRD.concat(HB,CUSTOM);
 setSrc();
 refreshMonsterList();
 return true;
}
function deleteCustom(i){
 const m=CUSTOM[i];if(!m)return;
 if(typeof confirm==='function'&&!confirm('Delete '+m.n+'?'))return;
 if($('cmid').value===m.id)resetCustomForm();
 CUSTOM.splice(i,1);persistCustom();setMsg('Deleted '+(m.n)+'.');
}
function editCustom(i){const m=CUSTOM[i];if(!m)return;fillForm(m);$('cmform').scrollIntoView({behavior:'smooth'});setMsg('Editing '+m.n+'. Save to keep your changes.');}
function viewCustom(i){const m=CUSTOM[i];if(!m)return;$('cmresults').innerHTML=block(m,-1);$('cmresults').scrollIntoView({behavior:'smooth'});}
function showGenerated(list,header){
 DRAFTS=list||[];
 const head=header?'<p class="gennote">'+esc(header)+'</p>':'';
 const saveAll=DRAFTS.length>1?'<div class="btns"><button type="button" onclick="saveAllDrafts()">💾 Save all</button></div>':'';
 $('cmresults').innerHTML=head+saveAll+DRAFTS.map((m,i)=>{
  const cardNote=(DRAFTS.length===1&&header)?'':(m._note||'');
  return '<div class="genblock">'+(cardNote?'<p class="gennote">'+esc(cardNote)+'</p>':'')+'<div class="btns"><button type="button" id="cmsave'+i+'" onclick="saveDraft('+i+')">💾 Save to my monsters</button><button type="button" onclick="editDraft('+i+')">✏️ Edit in the form</button></div>'+block(m,-1)+'</div>';
 }).join('');
 $('cmresults').scrollIntoView({behavior:'smooth'});
}
function saveDraft(i){
 const d=DRAFTS[i];if(!d)return;
 if(d._savedId){setMsg('Already saved.');return;}
 const m=normalizeMonster(d);
 m.n=uniqueName(m.n);
 CUSTOM.push(m);
 if(!persistCustom()){CUSTOM.pop();return;}
 d._savedId=m.id;
 const btn=document.getElementById('cmsave'+i);if(btn)btn.textContent='Saved';
 setMsg('Saved '+m.n+'. It now shows up in lookup, Build Your Own Encounter, and random generation when the type and setting match.');
}
function saveAllDrafts(){DRAFTS.forEach((d,i)=>{if(!d._savedId)saveDraft(i);});}
function editDraft(i){const d=DRAFTS[i];if(!d)return;const m=normalizeMonster(d);m.custom=0;m.id='';fillForm(m);$('cmid').value='';$('cmsave').textContent='Save monster';$('cmform').scrollIntoView({behavior:'smooth'});}
function generateFromPrompt(){
 const text=$('cmprompt').value.trim();
 if(!text){setMsg('Describe the monster you want.');return;}
 const spec=parseMonsterPrompt(text);
 if(!spec.level){spec.level=clamp(+$('lvl').value||4,1,20);spec.levelAssumed=true;}
 if(!spec.pcs)spec.pcs=4;
 const list=spec.count>1?generateMany(spec):[generateMonster(spec)];
 let header='';
 if(spec.levelAssumed)header='No party level was in that description, so this uses party level '+spec.level+' from the form below. ';
 if(list.length>1)header+=list.length+' different monsters a level-'+spec.level+' party can fight. Save any you want to keep.';
 else header+=(list[0]._note||'');
 showGenerated(list,header);
 setMsg('');
}
function generateBulk(){
 const count=clamp(+$('cmcount').value||4,1,12);
 const level=clamp(+$('cmlevel').value||4,1,20);
 let env=$('cmenv').value;
 if(env==='town')env='city';
 const spec={count,level,pcs:4,env:env==='any'?null:env,features:[],attacks:[],intent:'normal'};
 const list=generateMany(spec);
 const where=spec.env?' in a '+spec.env:'';
 showGenerated(list,'Here are '+list.length+' different monsters for 4 level-'+level+' characters'+where+'. Challenge ratings are spread across a fair range so they are not copies, and each one is something that party can fight.');
 setMsg('');
}
function exportCustom(){
 const payload={kind:'dnd-encounter-generator-monsters',version:1,monsters:CUSTOM};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='my-monsters.json';
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(a.href),1500);
 setMsg('Downloaded my-monsters.json.');
}
function importMonsterData(data){
 let list=data;
 if(data&&!Array.isArray(data))list=data.monsters||data.custom||null;
 if(!Array.isArray(list))throw new Error('not a list');
 let n=0;
 list.forEach(raw=>{
  if(!raw||typeof raw!=='object'||!raw.n)return;
  const m=normalizeMonster(raw);
  const i=CUSTOM.findIndex(x=>x.id===m.id||x.n.toLowerCase()===m.n.toLowerCase());
  if(i>=0)CUSTOM[i]=Object.assign(m,{id:CUSTOM[i].id});else CUSTOM.push(m);
  n++;
 });
 persistCustom();
 return n;
}
function importCustomFile(input){
 const f=input.files&&input.files[0];if(!f)return;
 const reader=new FileReader();
 reader.onload=()=>{
  try{const n=importMonsterData(JSON.parse(String(reader.result)));setMsg('Imported '+n+' monster'+(n===1?'':'s')+'.');}
  catch(e){setMsg('That file is not a monster list this app can read.');}
  input.value='';
 };
 reader.readAsText(f);
}
function initCustom(){
 try{CUSTOM=JSON.parse(localStorage.getItem(STORE_KEY)||'[]');}catch(e){CUSTOM=[];}
 if(!Array.isArray(CUSTOM))CUSTOM=[];
 CUSTOM=CUSTOM.map(normalizeMonster).filter(m=>m&&m.n);
 MONALL=SRD.concat(HB,CUSTOM);
 setSrc();
 refreshMonsterList();
 if($('cmtraits')&&!$('cmtraits').children.length)addPair('cmtraits');
 if($('cmactions')&&!$('cmactions').children.length)addPair('cmactions');
 if($('cmcr'))showMods();
}
