/* Loads the built page with a small DOM stand-in and runs the startup path. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function makeEl() {
  const e = {
    value: '', checked: false, children: [], style: {}, className: '',
    _html: '', parentNode: null,
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    remove() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    setAttribute() {},
    addEventListener() {},
    click() {},
    scrollIntoView() {},
    cloneNode() { const c = makeEl(); c._html = this._html; c.innerText = this.innerText; return c; },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); this.innerText = this._html.replace(/<[^>]+>/g, ' '); },
    get textContent() { return this._text == null ? this.innerText || '' : this._text; },
    set textContent(v) { this._text = String(v); }
  };
  e.innerText = '';
  return e;
}

const ids = {};
function get(id) {
  if (!ids[id]) ids[id] = makeEl();
  return ids[id];
}
['pcs','lvl','cnt','env','type','diff','src','tmode','tband','tkind','xpm','tre','origitem','origenc','igrarity','igtype','itheme','iplace'].forEach(get);
ids.pcs.value = '4';
ids.lvl.value = '1';
ids.cnt.value = 'auto';
ids.env.value = 'dungeon';
ids.type.value = 'any';
ids.diff.value = 'medium';
ids.src.value = 'all';
ids.tmode.value = 'ind';
ids.tband.value = '0';
ids.tkind.value = 'hoard';
ids.xpm.value = '4';
ids.tre.checked = true;
ids.origitem.checked = false;
ids.origenc.checked = false;
ids.igrarity.value = 'Uncommon';
ids.igtype.value = 'ring';
ids.itheme.value = 'sea';
ids.iplace.value = 'coast';

const store = {};
const body = makeEl();
const context = {
  console, Math, JSON, Date,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  },
  document: {
    getElementById: id => get(id),
    createElement: () => makeEl(),
    body,
    querySelectorAll: () => []
  },
  navigator: {clipboard: {writeText: () => Promise.resolve()}},
  window: {},
  alert(msg) { throw new Error('alert: ' + msg); },
  confirm() { return true; },
  URL: {createObjectURL: () => 'blob:test', revokeObjectURL() {}},
  Blob: class Blob { constructor(p) { this.parts = p; } }
};
context.window = context;
let script = fs.readFileSync('index.html', 'utf8');
script = script.slice(script.indexOf('<script>') + 8, script.lastIndexOf('</script>'));
vm.createContext(context);
vm.runInContext(script, context, {filename: 'index.html'});
context.window.onload();

assert.ok(ids.out._html.includes('Encounter:'), 'random encounter rendered');
assert.ok(ids.tout._html.includes('Treasure'), 'treasure roller rendered');
assert.ok(ids.xptot._html.includes('Total'), 'xp tracker rendered');
assert.ok(ids.lkl._html.includes('Goblin'), 'lookup list includes Goblin');
assert.ok(ids.brows.children.length >= 2, 'build-your-own rows');

ids.origitem.checked = true;
context.rollT();
assert.ok(ids.tout._html.includes('Original'), 'treasure roll can include an original item');
assert.ok(!ids.tout._html.toLowerCase().includes('flame tongue'));

const before = JSON.parse(store.customItems || '[]').length;
context.saveGeneratedItem('roll');
const saved = JSON.parse(store.customItems);
assert.strictEqual(saved.length, before + 1);
assert.ok(saved[0].effect && saved[0].name);

ids.origenc.checked = true;
context.rerollEncT();
assert.ok(ids.out._html.includes('Original'), 'encounter loot can include an original item');

const handout = context.encounterHandoutHTML ? null : null;
script += '';
vm.runInContext('this.__hand=encounterHandoutHTML()', context);
assert.ok(context.__hand.includes('Encounter:'));
assert.ok(!/<button/i.test(context.__hand));

get('lk').value = 'Owlbear';
context.lookup();
assert.ok(ids.lkout._html.includes('Owlbear') || ids.lkout._html.includes('owlbear') || ids.lkout._html.toLowerCase().includes('owlbear'));

console.log('load ok');
