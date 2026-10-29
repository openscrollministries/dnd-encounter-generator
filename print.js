/* Print handouts. The browser print dialog is how a DM saves a PDF. No server. */
function treasureWanted(){
 try{
  const el=document.getElementById('tre');
  if(!el)return !!cur&&!!cur.tre;
  return !!el.checked;
 }catch(e){return !!cur&&!!cur.tre;}
}
function encounterHandoutHTML(){
 if(!cur||!opt||!cur.monsters||!cur.monsters.length)return '';
 const c=cur,t=c.thresholds||[0,0,0,0];
 const blocks=c.monsters.map(m=>block(m,-1)).join('');
 let tre='';
 if(c.tre&&treasureWanted()){
  tre='<div class="card"><h3>Treasure — '+esc(c.tre.kind||'')+'</h3>'+treasureHTML(c.tre.o)+(c.tre.home&&typeof itemSheet==='function'?itemSheet(c.tre.home):'')+'</div>';
 }
 return '<div class="card"><h2>Encounter: '+esc(String(c.rating||'').toUpperCase())+'</h2>'
  +'<p>'+opt.pcs+' PCs, level '+opt.lvl+' · '+c.monsters.length+' monster(s)'+(c.built?' (built by hand)':'')+' · '+esc(opt.env||'')
  +' · Base XP '+(c.raw||0).toLocaleString()+' × '+(c.mult||1)+' = <b>'+(c.adj||0).toLocaleString()+' adjusted XP</b><br>'
  +'<small>Thresholds — Easy '+t[0]+', Medium '+t[1]+', Hard '+t[2]+', Deadly '+t[3]+'. Award '+Math.floor((c.raw||0)/Math.max(1,opt.pcs))+' XP each.</small></p>'
  +(c.warns||[]).map(w=>'<p class="warn">'+esc(w)+'</p>').join('')
  +(c.hook?'<p class="hook">'+esc(c.hook)+'</p>':'')+'</div>'
  +blocks
  +(c.trap?'<div class="card"><h3>Trap</h3><p>'+c.trap+'</p></div>':'')
  +(c.npcs?'<div class="card"><h3>NPCs</h3>'+c.npcs+'</div>':'')
  +tre;
}
function printHandout(body,title){
 const root=$('printroot');
 if(!root){window.print();return;}
 root.innerHTML='<h1 class="handtitle">'+esc(title||'Handout')+'</h1>'+(body||'');
 document.body.classList.add('handout');
 const done=()=>{
  document.body.classList.remove('handout');
  root.innerHTML='';
  window.removeEventListener('afterprint',done);
 };
 window.addEventListener('afterprint',done);
 window.print();
}
function printEncounter(){
 const html=encounterHandoutHTML();
 if(!html){alert('Generate an encounter first.');return;}
 printHandout(html,'Encounter handout');
}
function printCustomMonsters(){
 if(typeof CUSTOM==='undefined'||!CUSTOM.length){alert('No saved monsters to print.');return;}
 printHandout(CUSTOM.map(m=>block(m,-1)).join(''),'My monsters');
}
function printCustomItems(){
 if(typeof ITEMS==='undefined'||!ITEMS.length){alert('No saved magic items to print.');return;}
 printHandout(ITEMS.map(itemSheet).join(''),'My magic items');
}
function printTreasureRoll(){
 const el=$('tout');
 if(!el||!String(el.innerText||'').trim()){alert('Roll some treasure first.');return;}
 const clone=el.cloneNode(true);
 clone.querySelectorAll('button,.btns,.noprint').forEach(n=>n.remove());
 printHandout(clone.innerHTML,'Treasure');
}
