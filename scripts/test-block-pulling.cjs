const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ console, Math });
context.window = context;
const game = path.resolve(__dirname, '../public/games/lenda-de-sigma/js');
const load = name => vm.runInContext(fs.readFileSync(path.join(game, name), 'utf8'), context, { filename: name });
load('core.js');
const G = context.G;
Object.assign(G, {
  T: { FLOOR: 0, GROUND: 0, WALL: 1, VOID: 1, PIT: 2, ICE: 3 },
  TP: [{}, { solid: true }, { hazard: true, pit: true }, { ice: true }],
  col: {}, spr: {}, st: {}, sfx() {},
  ui: { toast() {} },
  dun: { roomAt: () => ({ idx: 0 }) },
});
load('entities.js'); load('world.js'); load('puzzles.js');
const checks = [];
function fixture(facing = 1, Block = G.PushBlock, options = {}) {
  G.curRoom = 0;
  G.P = { items: {}, flags: {}, stats: {}, sub: null };
  G.map = new G.GameMap('test', 'dungeon', 24, 13, G.T.FLOOR);
  G.ents = []; G.input.codes = {}; G.input.pad = {}; G.input.hit = {};
  const block = Block === G.DieBlock ? new Block(160, 96, options) : new Block(160, 96, 5, options);
  const positions = { 0: [163, 88], 1: [163, 112], 2: [176, 100], 3: [150, 100] };
  const player = G.player = new G.Player(...positions[facing]);
  player.dir = facing;
  G.ents.push(block, player);
  return { block, player };
}
function step(n = 1) {
  for (let i = 0; i < n; i++) {
    G.player.update(1 / 60);
    for (const ent of G.ents) if (ent !== G.player) ent.update(1 / 60);
    G.input.endFrame();
    for (const ent of G.ents) if (ent instanceof G.PushBlock) assert(!G.overlap(ent, G.player), 'the hero and block must not overlap during the step');
  }
}
function pressAction(key = 'KeyZ') {
  G.input.codes[key] = true; G.input.hit.a = true; step(); G.input.codes = {};
}
for (const facing of [0, 1, 2, 3]) {
  const { block, player } = fixture(facing);
  const before = { bx: block.x, by: block.y, px: player.x, py: player.y };
  const dir = G.DIRS[[1, 0, 3, 2][facing]];
  pressAction(); assert.equal(player.state, 'pull');
  // Directional input while pulling must not steer through walls or detach the hero.
  G.input.codes.KeyD = true; step(5); G.input.codes = {}; step(15);
  assert.equal(block.x, before.bx + dir.x * 16); assert.equal(block.y, before.by + dir.y * 16);
  assert.equal(player.x, before.px + dir.x * 16); assert.equal(player.y, before.py + dir.y * 16);
  assert.equal(player.state, 'normal'); assert.equal(player.dir, facing);
}
checks.push('Z pulls one tile in every direction, keeping the hero facing the block without overlap');
{
  const { block, player } = fixture(1);
  G.map.set(10, 5, G.T.WALL); // The wall behind the block used to make it impossible to recover.
  pressAction(); step(20); assert.equal(block.y, 112); assert.equal(player.y, 128);
  checks.push('a block against a wall can be pulled out');
}
for (const obstacle of ['wall', 'pit', 'block']) {
  const { block, player } = fixture(1);
  if (obstacle === 'block') G.ents.push(new G.PushBlock(160, 128, 8));
  else G.map.set(10, 8, obstacle === 'wall' ? G.T.WALL : G.T.PIT);
  pressAction(); step(20);
  assert.equal(block.y, 96); assert.equal(player.y, 112); assert.equal(player.state, 'normal');
}
checks.push('walls, pits and other blocks behind the hero prevent unsafe pulls');
for (const options of [{ locked: true }, {}]) {
  const { block, player } = fixture(1, G.PushBlock, options);
  if (!options.locked) block.bounds = { x: 160, y: 96, w: 16, h: 16 };
  pressAction(); step(20); assert.equal(block.y, 96); assert.equal(player.state, 'normal');
}
checks.push('fixed blocks and rail limits remain enforced');
{
  const { block, player } = fixture(1);
  player.z = 8; pressAction(); assert.equal(block.moving, false);
  player.z = 0; player.kbT = .1; pressAction(); assert.equal(block.moving, false);
  player.kbT = 0;
  G.dun.roomAt = () => ({ idx: 1 }); pressAction(); assert.equal(block.moving, false);
  G.dun.roomAt = () => ({ idx: 0 });
  checks.push('jumping, knockback and room exits cannot start a pull');
}
{
  const { block, player } = fixture(1);
  G.input.codes.ArrowUp = true; step(45); G.input.codes = {};
  assert.equal(block.y, 80); assert.equal(player.state, 'normal');
  checks.push('walking into a block still pushes it normally');
}
{
  let moved = 0;
  const { block, player } = fixture(1, G.PushBlock, { slide: true, onMoved: () => moved++ });
  G.map.tiles.fill(G.T.ICE);
  pressAction(); step(40); assert.equal(block.y, 112); assert.equal(player.y, 128); assert.equal(moved, 1);
  pressAction(); step(20); assert.equal(block.y, 128); assert.equal(moved, 2);
  checks.push('pulling on ice stops after one tile and puzzle callbacks fire once per move');
}
{
  const { block } = fixture(1, G.DieBlock);
  const original = { top: block.top, north: block.north, east: block.east };
  pressAction(); step(20);
  assert.equal(block.top, original.north); assert.equal(block.north, 7 - original.top); assert.equal(block.east, original.east);
  checks.push('giant dice roll in the direction they are pulled');
}
{
  const { block, player } = fixture(1);
  const plate = new G.Plate(160, 112); G.ents.push(plate);
  pressAction(); step(20); assert.equal(plate.blockOn(), block); assert.equal(plate.on, true);
  block.reset(); assert.equal(block.y, 96);
  player.y = 112;
  pressAction(); assert.equal(player.state, 'pull'); block.reset(); assert.equal(player.state, 'normal');
  checks.push('pulled blocks activate plates, and a reset releases the hero');
}
console.log(JSON.stringify({ checks: checks.length, passed: checks }, null, 2));
