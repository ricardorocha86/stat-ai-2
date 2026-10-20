// Run against an isolated Firestore emulator; never signs into a real account.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeApp, deleteApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, getDocFromServer, setDoc, terminate, setLogLevel } = require('firebase/firestore');
const { chromium } = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8088') throw new Error('Set FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 for the isolated test emulator.');
const base = process.env.STATAI_BASE_URL || 'http://localhost:3002';
const projectId = 'demo-statai-sigma';
const root = path.resolve(__dirname, '..');
const fixtures = path.join(root, 'tmp/sigma-game-test');
fs.mkdirSync(fixtures, { recursive: true });
const writeFixture = (name, content) => {
  const file = path.join(fixtures, name);
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) fs.writeFileSync(file, content);
};
const appHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
writeFixture('index.html', appHtml.replace('src="/index.tsx"', 'src="/tmp/sigma-game-test/main.jsx"'));
writeFixture('config.ts', `
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
const uid = new URLSearchParams(location.search).get('uid') || 'sigma-browser-a';
const app = initializeApp({ projectId: '${projectId}', apiKey: 'test', appId: 'test' });
export const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8088, { mockUserToken: { sub: uid, user_id: uid, firebase: { sign_in_provider: 'anonymous' } } });
`);
writeFixture('main.jsx', `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from '/components/Sidebar';
import Header from '/components/Header';
import SigmaGamePage from '/components/games/SigmaGamePage';
import course from '/data/courseData';
function Harness() {
  const [page, setPage] = useState('home');
  const [menu, setMenu] = useState(false);
  const uid = new URLSearchParams(location.search).get('uid') || 'sigma-browser-a';
  return <div className="flex h-screen overflow-hidden bg-slate-100">
    <Sidebar course={course} selectedLesson={null} onSelectLesson={() => {}} page={page} setPage={setPage}
      onLogout={() => setPage('home')} studentProgress={{}} viewMode="aluno" hasNewReward={false} onOpenRewards={() => {}}
      userProfile={{ name: 'Teste Sigma', email: 'teste@example.invalid' }} isAchievementTestMode={false}
      canUseAchievementTestMode={false} onToggleAchievementTestMode={() => {}} isSidebarOpen={menu} setIsSidebarOpen={setMenu} />
    <div className="flex min-w-0 flex-1 flex-col"><Header page={page} lesson={null} unit={null} onToggleSidebar={() => setMenu(!menu)} onGoHome={() => setPage('home')} />
    <main className="flex-1 overflow-y-auto">{page === 'sigma-game' ? <SigmaGamePage userId={uid} /> : <p>Início do teste</p>}</main></div>
  </div>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Harness /></React.StrictMode>);
`);
setLogLevel('silent');
const clients = [];
function client(uid) {
  const app = initializeApp({ projectId, apiKey: 'test', appId: 'test' }, uid || 'public');
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8088, uid ? { mockUserToken: { sub: uid, user_id: uid, firebase: { sign_in_provider: 'anonymous' } } } : {});
  clients.push({ app, db }); return db;
}
const a = client('sigma-browser-a'), b = client('sigma-browser-b'), publicDb = client(null);
const saveRef = (db, uid) => doc(db, 'users', uid, 'games', 'lenda-de-sigma');
const progress = snapshot => JSON.parse(snapshot.data().progress);
const options = { headless: true };
if (process.env.STATAI_CHROMIUM_PATH) options.executablePath = process.env.STATAI_CHROMIUM_PATH;
else {
  const cache = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  const installed = fs.readdirSync(cache).filter(name => name.startsWith('chromium_headless_shell-')).sort().reverse();
  options.executablePath = installed.map(name => path.join(cache, name, 'chrome-headless-shell-win64/chrome-headless-shell.exe')).find(fs.existsSync);
}
const checks = [];
(async () => {
  const reset = await fetch('http://127.0.0.1:8088/emulator/v1/projects/demo-statai-sigma/databases/(default)/documents', { method: 'DELETE' });
  assert.equal(reset.ok, true, 'reset the isolated emulator project');
  const browser = await chromium.launch(options);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') console.log('Browser:', message.text()); });
  await page.route('**/services/firebaseConfig.ts*', route => route.fulfill({ contentType: 'text/javascript', body: "export * from '/tmp/sigma-game-test/config.ts';" }));
  const enter = async () => {
    await page.getByRole('navigation', { name: 'Jogos', exact: true }).getByRole('button', { name: 'A Lenda de Sigma' }).click();
    await page.getByRole('button', { name: 'Salvar agora', exact: true }).waitFor();
    await page.getByTitle('A Lenda de Sigma — O Reino dos Dados', { exact: true }).waitFor();
    const frame = await (await page.getByTitle('A Lenda de Sigma — O Reino dos Dados', { exact: true }).elementHandle()).contentFrame();
    assert(frame); await frame.waitForURL('**/games/lenda-de-sigma/index.html');
    await frame.waitForFunction(() => window.G?.canvasEl && window.statAiSigma);
    await page.getByRole('button', { name: 'Salvar agora', exact: true }).isEnabled();
    return frame;
  };
  const continueGame = async frame => {
    await frame.locator('canvas').click();
    await page.keyboard.press('Enter');
    await frame.waitForFunction(() => G.state === 'title');
    await frame.waitForFunction(() => G.titleT > .5);
    await page.keyboard.press('Enter');
    await frame.waitForFunction(() => G.state === 'play');
  };
  try {
    await page.goto(base + '/tmp/sigma-game-test/index.html?uid=sigma-browser-a');
    let frame = await enter();
    assert.equal(await frame.evaluate(() => G.hasSave()), false);
    checks.push('Sidebar Jogos opens the 2D root game'); console.log(checks.at(-1));
    await frame.evaluate(() => {
      G._freeze = true; G.P = G.newProgress(); G.P.flags.gauss = true;
      G.world.loadOverworld(1059, 690); G.state = 'play';
      G.P.coins = 37; G.P.items.sword = true; G.P.quests.example = { s: 2, done: false };
      G.saveGame(); G.audio.setVol(.4, .6); G.touch.setMode('off'); G.saveSettings();
    });
    await page.getByRole('button', { name: 'Salvar agora', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Progresso salvo na sua conta' }).waitFor();
    let saved = await getDocFromServer(saveRef(a, 'sigma-browser-a'));
    assert.equal(progress(saved).coins, 37); assert.equal(progress(saved).items.sword, true);
    assert.equal(progress(saved).quests.example.s, 2); assert.equal(JSON.parse(saved.data().settings).m, .4);
    checks.push('Real Firestore SDK persists inventory, quests, position and settings'); console.log(checks.at(-1));
    await assert.rejects(() => getDocFromServer(saveRef(b, 'sigma-browser-a')), error => error.code === 'permission-denied');
    await assert.rejects(() => setDoc(saveRef(b, 'sigma-browser-a'), { progress: 'forged' }), error => error.code === 'permission-denied');
    await assert.rejects(() => getDocFromServer(saveRef(publicDb, 'sigma-browser-a')), error => error.code === 'permission-denied');
    checks.push('Firestore rules reject other accounts and unauthenticated reads'); console.log(checks.at(-1));
    // Remove even the account cache, so this reload can only recover from Firestore.
    await page.evaluate(() => localStorage.clear());
    await page.reload(); frame = await enter(); await continueGame(frame);
    assert.equal(await frame.evaluate(() => G.P.coins), 37);
    assert.equal(await frame.evaluate(() => G.player.x), 1059);
    assert.equal(await frame.evaluate(() => G.touch.mode), 'off');
    checks.push('Reload with empty localStorage restores cloud progress and controls'); console.log(checks.at(-1));
    // Use a non-start dungeon room to verify the additional resume location.
    const roomSaved = await frame.evaluate(() => {
      G._freeze = true; G.ui.clear(); G.cutscene = 0; G._waits = [];
      G.P.flags.d1_entered = true; G.dun.load('d1');
      const room = G.map.rooms.find(r => r.key === 'L');
      if (!room) throw new Error('Missing fixture room');
      G.player.x = room.px + 180; G.player.y = room.py + 130;
      G.player.lastSafe = { x: G.player.x, y: G.player.y };
      G.dun.enterRoom(room.idx, true); G.ui.clear(); G.cutscene = 0; G.state = 'play';
      G.P.coins = 48; G.saveGame(); return { room: room.idx, x: G.player.x, y: G.player.y };
    });
    await page.getByRole('button', { name: 'Salvar agora', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Progresso salvo na sua conta' }).waitFor();
    await page.getByRole('button', { name: 'Voltar ao início', exact: true }).click();
    frame = await enter(); await continueGame(frame);
    const resumed = await frame.evaluate(() => { G._freeze = true; return { map: G.map.id, room: G.curRoom, x: G.player.x, y: G.player.y, coins: G.P.coins, error: G.lastError?.message || null }; });
    assert.deepEqual(resumed, { map: 'd1', ...roomSaved, coins: 48, error: null });
    checks.push('Leaving the page and returning resumes the saved dungeon room and coordinates'); console.log(checks.at(-1));
    // A rebuilt puzzle cannot strand the hero inside a restored wall/block.
    await frame.evaluate(() => {
      G.ui.clear(); G.cutscene = 0; G._waits = [];
      const room = G.map.rooms.find(r => r.idx === G.curRoom);
      G.player.x = room.px; G.player.y = room.py;
      G.player.lastSafe = { x: G.player.x, y: G.player.y }; G.saveGame();
    });
    await page.getByRole('button', { name: 'Salvar agora', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Progresso salvo na sua conta' }).waitFor();
    await page.getByRole('button', { name: 'Voltar ao início', exact: true }).click();
    frame = await enter(); await continueGame(frame);
    assert.equal(await frame.evaluate(() => { G._freeze = true; const p = G.player; return G.rectBlocked(p.x, p.y, p.w, p.h, p, { avoidHazard: true }); }), false);
    checks.push('Rebuilt puzzle geometry restores the player to nearby safe ground');
    // Only cut off the emulator, keeping Vite available for the real reload.
    await page.route('**/127.0.0.1:8088/**', route => route.abort());
    await frame.evaluate(() => { G.P.coins = 63; G.saveGame(); });
    await page.getByRole('button', { name: 'Salvar agora', exact: true }).click();
    await page.waitForFunction(() => {
      const save = JSON.parse(localStorage.getItem('statai:game:lenda-de-sigma:v1:sigma-browser-a') || 'null');
      return save?.pending && JSON.parse(save.progress).coins === 63;
    });
    await page.reload(); frame = await enter();
    assert.equal(await frame.evaluate(() => JSON.parse(G.storage.getItem('lendaSigma_save_v1')).coins), 63);
    await page.unroute('**/127.0.0.1:8088/**');
    await page.evaluate(() => dispatchEvent(new Event('online')));
    await page.getByRole('status').filter({ hasText: 'Progresso salvo na sua conta' }).waitFor({ timeout: 45000 });
    saved = await getDocFromServer(saveRef(a, 'sigma-browser-a')); assert.equal(progress(saved).coins, 63);
    checks.push('Connection failure retains pending progress across reload, then syncs on reconnect');
    await continueGame(frame);
    await frame.evaluate(() => { G._freeze = true; G.ui.clear(); G.cutscene = 0; G.P.coins = 71; });
    await page.reload(); frame = await enter();
    assert.equal(await frame.evaluate(() => JSON.parse(G.storage.getItem('lendaSigma_save_v1')).coins), 71);
    checks.push('Reload captures the latest state before the next periodic autosave');
    await page.goto(base + '/tmp/sigma-game-test/index.html?uid=sigma-browser-b'); frame = await enter();
    assert.equal(await frame.evaluate(() => G.hasSave()), false);
    assert.equal((await getDocFromServer(saveRef(b, 'sigma-browser-b'))).exists(), false);
    checks.push('Second account starts independently on the same browser');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'Voltar ao início', exact: true }).click();
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    frame = await enter();
    const canvasWidth = await frame.locator('canvas').evaluate(canvas => canvas.getBoundingClientRect().width);
    assert(canvasWidth <= 351, 'the game must fit a narrow phone');
    assert.equal(await frame.evaluate(() => G.lastError?.message || null), null);
    await page.screenshot({ path: path.join(fixtures, 'mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForFunction(() => Math.abs(document.querySelector('aside').getBoundingClientRect().x) < 1);
    await page.screenshot({ path: path.join(fixtures, 'desktop.png'), fullPage: true, animations: 'disabled' });
    checks.push('Game fits mobile viewport without runtime errors');
    const touchContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    const touchPage = await touchContext.newPage();
    await touchPage.route('**/services/firebaseConfig.ts*', route => route.fulfill({ contentType: 'text/javascript', body: "export * from '/tmp/sigma-game-test/config.ts';" }));
    await touchPage.goto(base + '/tmp/sigma-game-test/index.html?uid=sigma-browser-b');
    await touchPage.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    await touchPage.getByRole('navigation', { name: 'Jogos', exact: true }).getByRole('button', { name: 'A Lenda de Sigma' }).click();
    const touchFrame = await (await touchPage.getByTitle('A Lenda de Sigma — O Reino dos Dados', { exact: true }).elementHandle()).contentFrame();
    await touchFrame.waitForFunction(() => G.canvasEl && G.touch.on);
    await touchPage.screenshot({ path: path.join(fixtures, 'mobile-touch.png'), fullPage: true, animations: 'disabled' });
    checks.push('Touch controls activate automatically on a phone');
    await touchContext.close();
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ checks, runtimeErrors: errors }, null, 2));
  } catch (error) {
    await page.screenshot({ path: path.join(fixtures, 'failure.png'), fullPage: true }).catch(() => {});
    console.log('Completed checks:', checks);
    throw error;
  } finally {
    await browser.close();
    await Promise.all(clients.map(async ({ app, db }) => { await terminate(db); await deleteApp(app); }));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
