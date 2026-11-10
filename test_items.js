/* Run after `python3 build.py`: node test_items.js */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
let script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
script += '\nthis.__api={parse,build,hoard,individual,generateItem,normalizeItem,importItemData,encounterHandoutHTML,xpForCR,parseMonsterPrompt,generateMonster,RARITIES,ITYPES,BANNED,get MON(){return MON},get MAGIC(){return MAGIC},get ITEMS(){return ITEMS},get cur(){return cur},set cur(v){cur=v},get opt(){return opt},set opt(v){opt=v}};';
const store = {};
const context = {
  console, Math, JSON, Date,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  },
  document: {
    getElementById: () => null,
    createElement: () => ({style: {}, setAttribute() {}, click() {}, remove() {}}),
    body: {appendChild() {}, removeChild() {}, classList: {add() {}, remove() {}, contains() { return false; }}}
  },
  navigator: {clipboard: {writeText: () => Promise.resolve()}},
  window: {},
  alert() {},
  confirm() { return true; },
  URL: {createObjectURL: () => 'blob:test', revokeObjectURL() {}},
  Blob: class Blob { constructor(parts) { this.parts = parts; } }
};
context.window = context;
vm.createContext(context);
vm.runInContext(script, context, {filename: 'index.html'});

const api = context.__api;
const {parse, build, hoard, individual, generateItem, normalizeItem, importItemData, encounterHandoutHTML, xpForCR, parseMonsterPrompt, generateMonster, RARITIES, ITYPES, BANNED} = api;
const MON = api.MON, MAGIC = api.MAGIC;

assert.strictEqual(MON.length, 344, 'SRD + homebrew count');
assert.ok(MAGIC.length > 100, 'SRD magic items still loaded');

const asked = parse('4 monsters for 5 third level characters in a swamp');
assert.strictEqual(asked.count, 4);
assert.strictEqual(asked.lvl, 3);
assert.strictEqual(asked.pcs, 5);
assert.strictEqual(asked.env, 'swamp');
assert.strictEqual(parse('a dragon in a castle').env, 'castle');

const enc = build(MON, {pcs: 4, lvl: 3, count: 2, env: 'dungeon', type: 'any', diff: 'medium'});
assert.ok(enc.monsters.length >= 1);
assert.ok(enc.monsters.every(m => m.xp > 0 && m.n));

const loot = hoard(1);
assert.ok(loot.coins && Array.isArray(loot.magic));
loot.magic.forEach(entry => {
  assert.strictEqual(entry.i.length, 5);
  assert.ok(MAGIC.some(m => m[0] === entry.i[0]));
});
assert.ok(individual(0).coins);

assert.strictEqual(xpForCR(5), 1800);
assert.strictEqual(xpForCR(0.25), 50);

const srdNames = new Set(MAGIC.map(m => String(m[0]).toLowerCase()));
const banned = BANNED;
for (const rarity of RARITIES) {
  for (const type of ITYPES) {
    const item = generateItem({rarity, type, theme: 'frost', place: 'castle'});
    assert.strictEqual(item.rarity, rarity);
    assert.strictEqual(item.type, type);
    assert.ok(item.name.length > 2);
    assert.ok(item.effect.length > 30, item.effect);
    assert.ok(item.typeLine.toLowerCase().includes(rarity.toLowerCase()));
    assert.ok(!srdNames.has(item.name.toLowerCase()), item.name);
    assert.ok(banned.indexOf(item.name.toLowerCase()) < 0, item.name);
    if (type === 'potion') {
      assert.strictEqual(item.attune, false);
      assert.ok(!/attunement/i.test(item.typeLine));
      assert.ok(/drink/i.test(item.effect));
    } else if (item.attune) {
      assert.ok(/requires attunement/i.test(item.typeLine), item.typeLine);
    } else {
      assert.ok(!/attunement/i.test(item.typeLine), item.typeLine);
    }
  }
}

const plain = generateItem({rarity: 'Uncommon', type: 'weapon', theme: 'stone'});
assert.ok(/\+1 bonus to attack and damage/.test(plain.effect));
assert.strictEqual(plain.attune, false);

const rare = generateItem({rarity: 'Rare', type: 'weapon', theme: 'fire'});
assert.ok(/\+1 bonus to attack and damage/.test(rare.effect));
assert.ok(/fire/.test(rare.effect));
assert.strictEqual(rare.attune, true);

const legend = generateItem({rarity: 'Legendary', type: 'armor', theme: 'storm'});
assert.ok(/\+3 bonus to AC/.test(legend.effect));
assert.ok(/lightning/.test(legend.effect));

const round = normalizeItem(JSON.parse(JSON.stringify(plain)));
assert.strictEqual(round.effect, plain.effect);
const imported = importItemData({kind: 'dnd-encounter-generator-items', version: 1, items: [plain]});
assert.strictEqual(imported, 1);
assert.ok(api.ITEMS.some(i => i.name === plain.name));

api.opt = {pcs: 4, lvl: 5, count: enc.monsters.length, env: 'dungeon', type: 'any', diff: 'medium'};
api.cur = enc;
enc.hook = 'A door creaks.';
enc.trap = '<b>Pit</b> — mind the floor.';
enc.npcs = '<div class="npc"><b>Mira</b> — a friend</div>';
enc.tre = {kind: 'Treasure Hoard (CR 0–4)', o: hoard(0), home: generateItem({rarity: 'Uncommon', type: 'ring', theme: 'sea'}), band: 0};
enc.warns = enc.warns || [];
const handout = encounterHandoutHTML();
assert.ok(handout.includes('Encounter:'));
assert.ok(handout.includes('Pit'));
assert.ok(handout.includes('Mira'));
assert.ok(handout.includes('Original'));
assert.ok(!/<button/i.test(handout), 'handout should not include buttons');
assert.ok(handout.includes('break-inside') === false);

const spec = parseMonsterPrompt('I need a monster suitable for level 5 characters. Make it have ranged attacks, tentacles, and partial invisibility.');
assert.strictEqual(spec.level, 5);
assert.ok(spec.features.includes('tentacles'));
assert.ok(spec.features.includes('partial-invisibility'));
assert.ok(spec.attacks.includes('ranged'));
const monster = generateMonster(spec);
assert.ok(monster.cr >= 2 && monster.cr <= 5, 'CR ' + monster.cr);
assert.strictEqual(monster.xp, xpForCR(monster.cr));
const blob = JSON.stringify(monster).toLowerCase();
assert.ok(blob.includes('tentacle'));
assert.ok(blob.includes('partial invisibility'));
assert.ok(blob.includes('ranged'));

console.log('ok', MON.length, 'monsters;', MAGIC.length, 'srd items;', api.ITEMS.length, 'saved item');
