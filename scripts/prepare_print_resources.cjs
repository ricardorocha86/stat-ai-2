const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const base = process.env.STATAI_BASE_URL || 'http://localhost:3001';
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const digest = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(publicRoot, 'aulas/catalogo.json'), 'utf8'));
const resources = new Set();
for (const lesson of catalog.units.flatMap(unit => unit.lessons)) {
  const exercises = JSON.parse(fs.readFileSync(path.join(publicRoot, lesson.exercisesPath), 'utf8'));
  for (const exercise of exercises) {
    for (const key of ['enunciado', 'dica', 'passo_inicial', 'solucao_completa', 'resposta_final']) {
      for (const match of (exercise[key] || '').matchAll(/!\[[^\]]*\]\(([^)]+\.html)\)/g)) {
        resources.add(new URL(match[1], 'http://lesson.local' + exercise.resourceBasePath).pathname);
      }
    }
  }
}
(async () => {
  const options = { headless: true };
  if (process.env.STATAI_CHROMIUM_PATH) options.executablePath = process.env.STATAI_CHROMIUM_PATH;
  else {
    const cache = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
    if (fs.existsSync(cache)) {
      const installed = fs.readdirSync(cache).filter(name => name.startsWith('chromium_headless_shell-')).sort().reverse();
      const executable = installed.map(name => path.join(cache, name, 'chrome-headless-shell-win64/chrome-headless-shell.exe')).find(fs.existsSync);
      if (executable) options.executablePath = executable;
    }
  }
  const browser = await playwright.chromium.launch(options);
  const page = await browser.newPage({ viewport: { width: 980, height: 760 }, deviceScaleFactor: 1.5 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const rows = [];
  try {
    for (const resource of [...resources].sort()) {
      const filename = path.resolve(publicRoot, '.' + resource);
      if (!filename.startsWith(publicRoot + path.sep)) throw new Error('Resource outside public.');
      const response = await page.goto(base + resource);
      if (response.status() !== 200) throw new Error('Resource failed: ' + resource);
      await page.waitForFunction(() => [...document.querySelectorAll('.js-plotly-plot')].every(element => element._fullLayout) && document.querySelector('.js-plotly-plot'));
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: '.modebar{display:none!important}' });
      await page.locator('body').screenshot({ path: filename.replace(/\.html$/, '-print.png'), animations: 'disabled' });
      rows.push({
        html: resource,
        png: resource.replace(/\.html$/, '-print.png'),
        source_sha256: digest(filename),
        image_sha256: digest(filename.replace(/\.html$/, '-print.png')),
      });
    }
    if (errors.length) throw new Error(errors.join('\n'));
    const report = { resources: rows.length, width: 980, theme_sha256: digest(path.join(publicRoot, 'aulas/recursos/chart-theme.js')), plotly_sha256: digest(path.join(publicRoot, 'aulas/recursos/plotly.min.js')), images: rows };
    fs.writeFileSync(path.join(root, 'docs/recursos-impressao.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ staticCharts: rows.length, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
