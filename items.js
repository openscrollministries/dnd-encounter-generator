/* Original magic items. Nothing here is copied from a published item.
   SRD treasure tables stay as they are; these are extra items a DM can roll, save, and print. */
const ITEM_KEY='customItems';
const RARITIES=['Common','Uncommon','Rare','Very Rare','Legendary'];
const ITYPES=['weapon','armor','ring','wand','potion','wondrous'];
const THEME={
 any:{adj:['Amber','Quiet','Humble','Odd','Little','Brave'],dmg:'force',glow:'soft gold',sense:'hearing'},
 fire:{adj:['Cinder','Ember','Hearth','Kindle','Coal'],dmg:'fire',glow:'warm orange',sense:'smell'},
 frost:{adj:['Frost','Snow','Winter','Pale','Icicle'],dmg:'cold',glow:'pale blue',sense:'sight'},
 storm:{adj:['Storm','Thunder','Gale','Spark','Cloud'],dmg:'lightning',glow:'white-blue',sense:'hearing'},
 sea:{adj:['Tide','Salt','Harbor','Pearl','Drift'],dmg:'cold',glow:'sea-green',sense:'smell'},
 forest:{adj:['Moss','Fern','Acorn','Briar','Willow'],dmg:'poison',glow:'leaf-green',sense:'smell'},
 stone:{adj:['Pebble','Flint','Marble','Slate','Quarry'],dmg:'bludgeoning',glow:'dim gray',sense:'touch'},
 light:{adj:['Dawn','Glimmer','Candle','Sunny','Halo'],dmg:'radiant',glow:'dawn gold',sense:'sight'},
 shadow:{adj:['Dusk','Shade','Velvet','Murk','Gloom'],dmg:'necrotic',glow:'dim violet',sense:'hearing'},
 healing:{adj:['Mercy','Balm','Kind','Mender','Honey'],dmg:'radiant',glow:'soft white',sense:'sight'},
 castle:{adj:['Banner','Gate','Tower','Keep','Crown'],dmg:'force',glow:'torchlight',sense:'hearing'},
 trickery:{adj:['Mischief','Riddle','Wink','Jape','Puzzle'],dmg:'psychic',glow:'flickering',sense:'hearing'}
};
const PLACES={
 any:'',
 dungeon:'It was tucked under a loose flagstone.',
 forest:'A few leaves are still caught in the seams.',
 castle:'A castle steward once hung it by the door.',
 swamp:'It smells like clean rain, not mud.',
 mountain:'It stays as cool as shade on a high trail.',
 coast:'Salt has whitened one edge.',
 cave:'It feels at home underground.',
 city:'In a market it looks ordinary until it wakes.',
 ruins:'Old scratches cover the back.',
 arctic:'It never quite warms to the touch.',
 desert:'Fine sand hides in the hinges.',
 underdark:'It prefers the dark and glows only when asked.',
 grassland:'A bit of meadow straw is caught in it.'
};
const WEAPON_KINDS=['longsword','battleaxe','spear','shortbow','dagger','warhammer','quarterstaff'];
const ARMOR_KINDS=['leather','hide','chain shirt','scale mail','chain mail','shield','breastplate'];
const WONDROUS_NOUNS=['lantern','locket','cloak','boots','gloves','flute','stone','satchel','mirror','bell'];
const RING_NOUNS=['Band','Loop','Signet'];
const POTION_NOUNS=['Tonic','Draught','Elixir'];
const BANNED=['flame tongue','frost brand','holy avenger','vorpal sword','luck blade','oathbow','sun blade','dancing sword','nine lives stealer','sword of sharpness','staff of the magi','staff of power','wand of fireballs','wand of magic missiles','wand of wonder','deck of many things','bag of holding','portable hole','cloak of invisibility','ring of three wishes','cubic gate','sphere of annihilation'];
let ITEMS=[];
let ROLL_ITEM=null;

function itemClamp(n,a,b){n=+n;if(!isFinite(n))n=a;return Math.max(a,Math.min(b,n));}
function rarityIndex(r){const i=RARITIES.indexOf(r);return i<0?1:i;}
function rarityForBand(b){
 const table=[['Common','Uncommon'],['Uncommon','Rare'],['Rare','Very Rare'],['Very Rare','Legendary']];
 return rnd(table[itemClamp(b,0,3)]);
}
function selectedTheme(){
 const el=typeof document!=='undefined'&&document.getElementById&&document.getElementById('itheme');
 const v=el&&el.value;
 return v&&v!=='any'?v:'';
}
function selectedPlace(){
 const el=typeof document!=='undefined'&&document.getElementById&&document.getElementById('iplace');
 return (el&&el.value)||'any';
}
function itemNameTaken(n){
 const q=String(n||'').toLowerCase();
 if(!q)return true;
 if(BANNED.indexOf(q)>=0)return true;
 if(typeof MAGIC!=='undefined'&&MAGIC.some(m=>String(m[0]).toLowerCase()===q))return true;
 if(ITEMS.some(m=>String(m.name).toLowerCase()===q))return true;
 return false;
}
function uniqueItemName(base){
 if(!itemNameTaken(base))return base;
 let i=2;while(itemNameTaken(base+' '+i)&&i<50)i++;return base+' '+i;
}
function itemId(){return 'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function typeLineFor(type,rarity,attune,kind){
 const rar=String(rarity||'Common').toLowerCase();
 const tail=attune?rar+' (requires attunement)':rar;
 if(type==='weapon')return 'Weapon ('+(kind||'any')+'), '+tail;
 if(type==='armor')return 'Armor ('+(kind||'light, medium, or heavy')+'), '+tail;
 if(type==='ring')return 'Ring, '+tail;
 if(type==='wand')return 'Wand, '+tail;
 if(type==='potion')return 'Potion, '+rar;
 return 'Wondrous item, '+tail;
}
function normalizeItem(raw){
 const m=raw||{};
 const type=ITYPES.indexOf(m.type)>=0?m.type:'wondrous';
 const rarity=RARITIES.indexOf(m.rarity)>=0?m.rarity:'Uncommon';
 const theme=THEME[m.theme]?m.theme:'any';
 const place=PLACES[m.place]!=null?m.place:'any';
 const attune=type==='potion'?false:!!m.attune;
 const kind=String(m.kind||'').trim().slice(0,40);
 return {
  id:String(m.id||itemId()).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40)||itemId(),
  name:String(m.name||'Unnamed Item').trim().slice(0,80)||'Unnamed Item',
  type,rarity,theme,place,attune,kind,
  typeLine:String(m.typeLine||typeLineFor(type,rarity,attune,kind)).trim().slice(0,120),
  flavor:String(m.flavor||'').trim().slice(0,300),
  effect:String(m.effect||'').trim().slice(0,1200),
  custom:1
 };
}
function weaponEffect(ri,th){
 if(ri===0)return 'This weapon sheds dim '+th.glow+' light in a 5-foot radius while you hold it. You can snuff or relight the glow as a bonus action.';
 if(ri===1)return 'You have a +1 bonus to attack and damage rolls made with this magic weapon.';
 const bonus=ri===2?1:ri===3?2:3;
 const die=ri===2?'1d6':ri===3?'1d8':'2d8';
 let text='You have a +'+bonus+' bonus to attack and damage rolls made with this magic weapon. ';
 if(ri<4)text+='Once on each of your turns when you hit with it, you can deal an extra '+die+' '+th.dmg+' damage.';
 else text+='When you roll a 20 on an attack roll with it, the target takes an extra '+die+' '+th.dmg+' damage and must succeed on a DC 16 Constitution saving throw or be frightened of you until the end of its next turn.';
 return text;
}
function armorEffect(ri,th){
 if(ri===0)return 'While you wear this armor, you can use a bonus action to mend one small tear in clothing you can see, or to shake off one handful of dust, mud, or snow.';
 if(ri===1)return 'You have a +1 bonus to AC while wearing this armor.';
 if(ri===2)return 'You have a +1 bonus to AC while wearing this armor, and you have resistance to '+th.dmg+' damage.';
 if(ri===3)return 'You have a +2 bonus to AC while wearing this armor. When you take '+th.dmg+' damage, you can use your reaction to reduce that damage by 2d6. You can do so three times, and you regain all uses at dawn.';
 return 'You have a +3 bonus to AC while wearing this armor. You have resistance to '+th.dmg+' damage, and you cannot be frightened.';
}
function ringEffect(ri,th){
 if(ri===0)return 'While you wear this ring, you always know which way is north.';
 if(ri===1)return 'While you wear this ring, you have advantage on saving throws against being frightened. You can also touch an object and make it shed bright light in a 20-foot radius for 1 hour. Once you do, you cannot do so again until the next dawn.';
 if(ri===2)return 'While you wear this ring, you have resistance to '+th.dmg+' damage. Once per dawn, you can use a bonus action to end the poisoned condition on yourself or on a creature you touch.';
 if(ri===3)return 'While you wear this ring, you have a +1 bonus to AC and saving throws. Once per dawn, you can use an action to breathe a 15-foot cone of '+th.glow+' energy. Each creature in the cone must make a DC 16 Dexterity saving throw, taking 4d6 '+th.dmg+' damage on a failure, or half as much on a success.';
 return 'While you wear this ring, you have a +1 bonus to AC and saving throws. Once per dawn, you can use a bonus action to become immune to '+th.dmg+' damage for 1 minute.';
}
function wandEffect(ri,th){
 const charges=[3,5,7,7,9][ri];
 const regain=['1d3','1d4+1','1d6+1','1d6+1','1d8+1'][ri];
 const hit=[3,5,7,8,9][ri];
 const die=['1d6','2d6','3d6','4d6','5d6'][ri];
 if(ri===0)return 'This wand has '+charges+' charges and regains '+regain+' expended charges daily at dawn. While holding it, you can use an action to spend 1 charge and make a point you can see within 30 feet shed '+th.glow+' bright light in a 10-foot radius for 10 minutes.';
 let text='This wand has '+charges+' charges and regains '+regain+' expended charges daily at dawn. If you expend the last charge, roll a d20. On a 1, the wand crumbles into harmless dust. While holding it, you can use an action to spend 1 charge and make a ranged spell attack (+'+hit+' to hit) against one creature within 60 feet. On a hit, the target takes '+die+' '+th.dmg+' damage.';
 if(ri>=2)text+=' You can spend 2 charges instead to force every creature in a 15-foot cone to make a DC '+(12+ri)+' Dexterity saving throw, taking '+die+' '+th.dmg+' damage on a failure, or half as much on a success.';
 return text;
}
function potionEffect(ri,th){
 const heal=['1d8+1','3d8+3','6d8+6','8d8+10','10d10+20'][ri];
 let text='When you drink this potion, you regain '+heal+' hit points.';
 if(ri===1)text+=' You also have advantage on the next ability check you make before the end of your next turn.';
 if(ri===2)text+=' For 1 minute, you have resistance to '+th.dmg+' damage.';
 if(ri===3)text+=' For 10 minutes, your walking speed increases by 10 feet and you have resistance to '+th.dmg+' damage.';
 if(ri===4)text+=' You also end one condition on yourself: blinded, deafened, paralyzed, or poisoned. For 1 minute, you have resistance to '+th.dmg+' damage.';
 return text;
}
function wondrousEffect(ri,th){
 if(ri===0)return 'You can light or snuff this item as a bonus action. While lit, it sheds bright '+th.glow+' light in a 10-foot radius and dim light for another 10 feet.';
 if(ri===1)return 'While you wear or carry this item, you have advantage on Wisdom (Perception) checks that rely on '+th.sense+'.';
 if(ri===2)return 'You can use an action to speak the item\'s command word. You gain 10 temporary hit points and resistance to '+th.dmg+' damage for 10 minutes. Once you use this property, you cannot do so again until the next dawn.';
 if(ri===3)return 'You can use an action to teleport up to 30 feet to an unoccupied space you can see. You can do this three times, and you regain all expended uses at dawn. Teleporting this way leaves a brief '+th.glow+' shimmer in the space you left.';
 return 'While you hold this item, you have a +1 bonus to saving throws. Once per dawn, you can use an action to create a 15-foot-radius sphere of '+th.glow+' light centered on you. It lasts for 1 minute. Creatures you choose inside the sphere have advantage on saving throws, and attack rolls against them from outside the sphere have disadvantage.';
}
function makeItemName(type,themeKey){
 const th=THEME[themeKey]||THEME.any;
 const adj=rnd(th.adj);
 let noun;
 if(type==='weapon')noun=rnd(WEAPON_KINDS).replace(/\b\w/g,c=>c.toUpperCase());
 else if(type==='armor')noun=rnd(ARMOR_KINDS).replace(/\b\w/g,c=>c.toUpperCase());
 else if(type==='ring')noun=rnd(RING_NOUNS);
 else if(type==='wand')noun=rnd(['Wand','Rod']);
 else if(type==='potion')noun=rnd(POTION_NOUNS);
 else noun=rnd(WONDROUS_NOUNS).replace(/\b\w/g,c=>c.toUpperCase());
 return uniqueItemName(adj+' '+noun);
}
function generateItem(spec){
 spec=spec||{};
 const type=ITYPES.indexOf(spec.type)>=0?spec.type:rnd(ITYPES);
 const rarity=RARITIES.indexOf(spec.rarity)>=0?spec.rarity:rnd(RARITIES);
 let theme=spec.theme&&THEME[spec.theme]&&spec.theme!=='any'?spec.theme:rnd(Object.keys(THEME).filter(k=>k!=='any'));
 const place=spec.place&&PLACES[spec.place]!=null?spec.place:'any';
 const ri=rarityIndex(rarity);
 const th=THEME[theme];
 const kind=type==='weapon'?rnd(WEAPON_KINDS):type==='armor'?rnd(ARMOR_KINDS):'';
 let effect;
 if(type==='weapon')effect=weaponEffect(ri,th);
 else if(type==='armor')effect=armorEffect(ri,th);
 else if(type==='ring')effect=ringEffect(ri,th);
 else if(type==='wand')effect=wandEffect(ri,th);
 else if(type==='potion')effect=potionEffect(ri,th);
 else effect=wondrousEffect(ri,th);
 const rider=type==='weapon'||type==='armor'?ri>=2:type!=='potion'&&ri>=1;
 const attune=type==='potion'?false:(type==='weapon'||type==='armor')?rider:(ri>=1);
 const name=spec.name?uniqueItemName(String(spec.name).trim().slice(0,80)):makeItemName(type,theme);
 const flavorBits=[PLACES[place]||''];
 if(theme!=='any')flavorBits.unshift('It has a '+th.glow+' cast.');
 const flavor=flavorBits.filter(Boolean).join(' ');
 return normalizeItem({name,type,rarity,theme,place,attune,kind,typeLine:typeLineFor(type,rarity,attune,kind),flavor,effect});
}
function itemSheet(item){
 const m=item||{};
 const rar=String(m.rarity||'').replace(/\s/g,'');
 return '<div class="itemcard"><h3>'+esc(m.name||'Item')+' <span class="rar '+escAttr(rar)+'">'+esc(m.rarity||'')+'</span> <span class="gn">Original</span></h3><p><i>'+esc(m.typeLine||'')+'</i></p>'+(m.flavor?'<p><i>'+esc(m.flavor)+'</i></p>':'')+'<p>'+esc(m.effect||'')+'</p></div>';
}
function itemActions(item,slot){
 if(!item)return '';
 const key=slot==='enc'?'enc':slot==='roll'?'roll':'gen';
 return '<div class="origitem">'+itemSheet(item)+'<div class="btns noprint"><button type="button" onclick="saveGeneratedItem(\''+key+'\')">💾 Save to my items</button><button type="button" onclick="editGeneratedItem(\''+key+'\')">✏️ Edit in the form</button></div></div>';
}
function treasureExtra(bandIndex){
 const el=document.getElementById('origitem');
 if(!el||!el.checked){ROLL_ITEM=null;return '';}
 ROLL_ITEM=generateItem({rarity:rarityForBand(bandIndex),theme:selectedTheme(),place:selectedPlace()});
 return '<h3>Original item</h3><p><small>Rolled from this app\'s own tables, not the SRD lists. Save it if you want to keep it.</small></p>'+itemActions(ROLL_ITEM,'roll');
}
function attachEncounterItem(result){
 const el=document.getElementById('origenc');
 if(!result)return;
 if(!el||!el.checked){result.home=null;return;}
 result.home=generateItem({rarity:rarityForBand(result.band||0),theme:selectedTheme(),place:($('env')&&$('env').value)||'any'});
}
function slotItem(slot){
 if(slot==='roll')return ROLL_ITEM;
 if(slot==='enc')return cur&&cur.tre&&cur.tre.home;
 if(slot==='gen')return window.GEN_ITEM||null;
 return null;
}
function saveGeneratedItem(slot){
 const item=slotItem(slot);
 if(!item){setItemMsg('Roll or create an item first.');return;}
 const saved=saveItemObject(item);
 setItemMsg('Saved '+saved.name+'. It stays in this browser.');
}
function editGeneratedItem(slot){
 const item=slotItem(slot);
 if(!item)return;
 fillItemForm(item);
 const form=$('itform');
 if(form&&form.scrollIntoView)form.scrollIntoView({behavior:'smooth'});
}
function setItemMsg(t){const p=$('itmsg');if(p)p.textContent=t||'';}
function renderItems(){
 const ul=$('itlist');if(!ul)return;
 if(!ITEMS.length){ul.innerHTML='<li><i>No saved items yet.</i></li>';return;}
 ul.innerHTML=ITEMS.map((m,i)=>'<li><span><b>'+esc(m.name)+'</b> — '+esc(m.rarity)+' '+esc(m.type)+'</span><span class="btns"><button class="sm" type="button" onclick="viewItem('+i+')">View</button><button class="sm" type="button" onclick="editItem('+i+')">Edit</button><button class="sm" type="button" onclick="deleteItem('+i+')">Delete</button></span></li>').join('');
}
function persistItems(){
 try{localStorage.setItem(ITEM_KEY,JSON.stringify(ITEMS));}
 catch(e){setItemMsg('This browser could not store the item.');return false;}
 renderItems();
 return true;
}
function saveItemObject(raw){
 const m=normalizeItem(raw);
 const clash=ITEMS.find(x=>x.id!==m.id&&x.name.toLowerCase()===m.name.toLowerCase());
 if(clash)m.name=uniqueItemName(m.name);
 const i=ITEMS.findIndex(x=>x.id===m.id);
 if(i>=0)ITEMS[i]=m;else ITEMS.push(m);
 if(!persistItems())return m;
 return m;
}
function saveItemForm(){
 const name=$('itname').value.trim();
 const effect=$('iteffect').value.trim();
 if(!name){setItemMsg('Give the item a name.');return;}
 if(!effect){setItemMsg('Write what the item does.');return;}
 if(itemNameTaken(name)&&!(editing&&ITEMS.some(x=>x.id===editing&&x.name.toLowerCase()===name.toLowerCase()))){setItemMsg('That name is already used by an SRD item or one you saved. Pick another.');return;}
 const editing=$('itid').value;
 if(ITEMS.some(x=>x.id!==editing&&x.name.toLowerCase()===name.toLowerCase())){setItemMsg('You already saved an item with that name.');return;}
 const m=normalizeItem({
  id:editing||undefined,name,type:$('ittype').value,rarity:$('itrarity').value,
  theme:$('itheme')?$('itheme').value:'any',place:$('iplace')?$('iplace').value:'any',
  attune:$('itattune').checked,kind:$('itkind').value.trim(),
  flavor:$('itflavor').value.trim(),effect
 });
 m.typeLine=typeLineFor(m.type,m.rarity,m.attune,m.kind);
 const i=ITEMS.findIndex(x=>x.id===editing);
 if(editing&&i>=0)ITEMS[i]=m;else ITEMS.push(m);
 if(!persistItems())return;
 setItemMsg('Saved '+m.name+'.');
 resetItemForm();
}
function fillItemForm(m){
 $('itid').value=m.id&&ITEMS.some(x=>x.id===m.id)?m.id:'';
 $('itname').value=m.name||'';
 if($('ittype'))$('ittype').value=ITYPES.indexOf(m.type)>=0?m.type:'wondrous';
 if($('itrarity'))$('itrarity').value=RARITIES.indexOf(m.rarity)>=0?m.rarity:'Uncommon';
 if($('itkind'))$('itkind').value=m.kind||'';
 if($('itattune'))$('itattune').checked=!!m.attune&&m.type!=='potion';
 if($('itflavor'))$('itflavor').value=m.flavor||'';
 if($('iteffect'))$('iteffect').value=m.effect||'';
 const btn=$('itsave');if(btn)btn.textContent=$('itid').value?'Update item':'Save item';
}
function resetItemForm(){
 fillItemForm({name:'',type:'weapon',rarity:'Uncommon',attune:false,kind:'',flavor:'',effect:''});
 $('itid').value='';
 const btn=$('itsave');if(btn)btn.textContent='Save item';
}
function deleteItem(i){
 const m=ITEMS[i];if(!m)return;
 if(typeof confirm==='function'&&!confirm('Delete '+m.name+'?'))return;
 if($('itid')&&$('itid').value===m.id)resetItemForm();
 ITEMS.splice(i,1);persistItems();setItemMsg('Deleted '+m.name+'.');
}
function editItem(i){const m=ITEMS[i];if(!m)return;fillItemForm(m);setItemMsg('Editing '+m.name+'.');}
function viewItem(i){const m=ITEMS[i];if(!m||!$('itresult'))return;$('itresult').innerHTML=itemSheet(m);}
function generateFromItemForm(){
 const item=generateItem({rarity:$('igrarity').value,type:$('igtype').value,theme:$('itheme').value,place:$('iplace').value});
 window.GEN_ITEM=item;
 if($('itresult'))$('itresult').innerHTML='<p class="gennote">Original item, ready to hand a player. Save it if you want it again later.</p>'+itemActions(item,'gen');
 setItemMsg('');
}
function exportItems(){
 const payload={kind:'dnd-encounter-generator-items',version:1,items:ITEMS};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='my-items.json';
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(a.href),1500);
 setItemMsg('Downloaded my-items.json.');
}
function importItemData(data){
 let list=data;
 if(data&&!Array.isArray(data))list=data.items||data.magic||null;
 if(!Array.isArray(list))throw new Error('not a list');
 let n=0;
 list.forEach(raw=>{
  if(!raw||typeof raw!=='object'||!raw.name)return;
  const m=normalizeItem(raw);
  const i=ITEMS.findIndex(x=>x.id===m.id||x.name.toLowerCase()===m.name.toLowerCase());
  if(i>=0)ITEMS[i]=Object.assign(m,{id:ITEMS[i].id});else ITEMS.push(m);
  n++;
 });
 persistItems();
 return n;
}
function importItemFile(input){
 const f=input.files&&input.files[0];if(!f)return;
 const reader=new FileReader();
 reader.onload=()=>{
  try{const n=importItemData(JSON.parse(String(reader.result)));setItemMsg('Imported '+n+' item'+(n===1?'':'s')+'.');}
  catch(e){setItemMsg('That file is not an item list this app can read.');}
  input.value='';
 };
 reader.readAsText(f);
}
function initItems(){
 try{ITEMS=JSON.parse(localStorage.getItem(ITEM_KEY)||'[]');}catch(e){ITEMS=[];}
 if(!Array.isArray(ITEMS))ITEMS=[];
 ITEMS=ITEMS.map(normalizeItem).filter(m=>m&&m.name&&m.effect);
 renderItems();
}
