// Делает новый ролик прямо из Blink Test Studio (app/studio.html) в headless Chromium.
// Каждый раз: другой тест (не из последних), другой фон (не из последних), сложность Expert, максимальное качество.
// Результат: <out>/auto-<тест>-<тема>.mp4|.txt|.jpg + <out>/meta.json
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, loadConfig, loadState } from './lib.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(process.env.PW_PATH || '/usr/lib/node_modules', 'playwright'))); }

const outDir = path.resolve(process.argv[2] || path.join(ROOT, 'out', 'gen'));
fs.mkdirSync(outDir, { recursive: true });
const cfg = loadConfig(), state = loadState();
const G = { difficulty: 'expert', maxSeconds: 58, bitrate: 30_000_000, avoidTests: 8, avoidThemes: 4, ...(cfg.generate || {}) };
const APP = path.join(ROOT, 'app');

const pickRand = a => a[Math.floor(Math.random() * a.length)];
// Выбор с ротацией: берём то, что не использовалось дольше всего (из последних N исключаем)
function rotate(all, used, avoid) {
  const recent = used.slice(-Math.min(avoid, all.length - 1));
  let pool = all.filter(x => !recent.includes(x));
  if (!pool.length) pool = all.filter(x => x !== used[used.length - 1]);
  // самые «давние» в приоритете: сортируем по последнему использованию
  const last = x => used.lastIndexOf(x);
  const oldest = Math.min(...pool.map(last));
  const top = pool.filter(x => last(x) <= oldest + 2);
  return pickRand(top.length ? top : pool);
}

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--enable-features=VaapiVideoEncoder', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 520, height: 1000 } });
page.on('console', m => { if (/error|fail/i.test(m.type() + m.text())) console.log('[page]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));

// Всё нужное отдаём локально: шрифты и мультиплексор, чтобы не зависеть от интернета
const fontFaces = [
  ['Bricolage Grotesque', 'bricolage.woff2', '200 800'], ['Instrument Sans', 'instrument.woff2', '400 700'], ['Geist Mono', 'geistmono.woff2', '100 900'],
  ['Fredoka', 'fredoka-latin-400-normal.woff2', '400'], ['Fredoka', 'fredoka-latin-500-normal.woff2', '500'], ['Fredoka', 'fredoka-latin-600-normal.woff2', '600'], ['Fredoka', 'fredoka-latin-700-normal.woff2', '700'],
].map(([f, file, w]) => `@font-face{font-family:"${f}";src:url(https://fonts.local/${file}) format("woff2");font-weight:${w};font-display:block}`).join('\n');
await page.route('**/*', route => {
  const u = route.request().url();
  if (u.startsWith('file:')) return route.continue();
  if (u.includes('fonts.googleapis.com')) return route.fulfill({ contentType: 'text/css', body: fontFaces });
  if (u.startsWith('https://fonts.local/')) return route.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(path.join(APP, 'fonts', u.split('/').pop())) });
  if (u.includes('mp4-muxer')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(APP, 'vendor', 'mp4-muxer.js')) });
  return route.abort();
});
await page.goto('file://' + path.join(APP, 'studio.html'));
await page.waitForFunction(() => window.__blink && window.__blink.TEST_ORDER.length > 0);
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.fonts].map(f => f.load().catch(() => {}))); });

const info = await page.evaluate(() => ({ tests: window.__blink.TEST_ORDER, themes: window.__blink.THEMES.map(t => t.id) }));
const hist = state.history.filter(h => h.test);
const test = rotate(info.tests, hist.map(h => h.test), G.avoidTests);
const theme = rotate(info.themes, hist.map(h => h.theme), G.avoidThemes);
console.log(`Тест: ${test}, фон: ${theme}, сложность: ${G.difficulty}`);

const res = await page.evaluate(async ({ test, theme, G }) => {
  const B = window.__blink, st = B.state, T = B.TESTS[test];
  B.selectTest(test);
  st.difficulty = G.difficulty; st.theme = theme; st.sfx = true; st.intro = true; st.outro = true; st.platform = 'instagram';
  st.seed = 1 + Math.floor(Math.random() * 999999); st.capSeed = 1 + Math.floor(Math.random() * 9999);
  st.hookIdx = Math.floor(Math.random() * T.hooks.length); st.hookCustom = false;
  st.opts = st.opts || {};
  const opts = {};
  for (const o of (T.options || [])) opts[o.id] = o.choices[Math.floor(Math.random() * o.choices.length)][0];
  st.opts[test] = opts;
  // как можно больше раундов, но чтобы ролик остался в пределах G.maxSeconds
  st.seconds = T.defaults.seconds;
  let n = T.roundsRange[1];
  for (; n > T.roundsRange[0]; n--) { st.rounds = n; if (B.buildTimeline(B.cfgFromState()).duration <= G.maxSeconds) break; }
  st.rounds = n;
  B.rebuild(true); B.renderCaption(true);
  const xtl = B.buildTimeline(B.cfgFromState());
  let plan = await B.choosePlan(true);
  if (!plan || plan.kind !== 'webcodecs') {
    // В Chromium из Playwright нет H.264-энкодера: кодируем VP9 (без потерь по смыслу) и потом ffmpeg переводит в H.264
    for (let i = 0; i < 100 && !window.Mp4Muxer; i++) await new Promise(r => setTimeout(r, 100));
    if (!window.Mp4Muxer) throw new Error('mp4-muxer не загрузился');
    const v = { codec: 'vp09.00.40.08', width: B.W, height: B.H, bitrate: G.bitrate, framerate: B.FPS };
    if (!(await VideoEncoder.isConfigSupported(v)).supported) throw new Error('Нет VP9-энкодера');
    window.__vcodec = 'vp9';
    plan = { kind: 'webcodecs', v, a: true, ext: 'mp4', label: 'vp9' };
  }
  plan.v.bitrate = G.bitrate; plan.v.latencyMode = 'quality';
  const blob = await B.exportWebCodecs(xtl, plan, () => {}, new AbortController().signal);
  // обложка: кадр из первого вопроса
  const seg = xtl.segs.find(s => s.type === 'round' && s.phase !== 'reveal');
  const cv = document.createElement('canvas'); cv.width = B.W; cv.height = B.H;
  const cx = cv.getContext('2d', { alpha: false }); cx.__k = 1; cx.imageSmoothingQuality = 'high';
  B.drawFrame(cx, xtl, seg ? seg.start + Math.min(seg.dur * 0.35, 1.2) : 1);
  const cover = cv.toDataURL('image/jpeg', 0.93).split(',')[1];
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = ''; const parts = [];
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return { video: btoa(bin), cover, cap: B.getCaption(), duration: xtl.duration, rounds: n, opts, seconds: st.seconds, name: T.name, eyebrow: T.eyebrow || '' };
}, { test, theme, G });

const base = `auto-${test}-${theme}`;
const raw = path.join(outDir, base + '.raw.mp4');
fs.writeFileSync(raw, Buffer.from(res.video, 'base64'));
// Instagram: H.264 High, 4:2:0, 30 fps, AAC; высокое качество (crf 14), быстрый старт
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-map', '0:v:0', '-map', '0:a:0?', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60',
  '-maxrate', '30M', '-bufsize', '60M', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', path.join(outDir, base + '.mp4')]);
fs.rmSync(raw);
fs.writeFileSync(path.join(outDir, base + '.jpg'), Buffer.from(res.cover, 'base64'));
// подпись: текст + не больше 5 хэштегов (лимит Instagram)
const tags = res.cap.tags.slice(0, 5).map(t => '#' + t);
const text = res.cap.text.replace(/\n?#\S+(\s+#\S+)*\s*$/u, '').trim();
// ключевые слова для поиска Instagram (в тексте, хештеги остаются)
const kw = `${res.name}: ${String(res.eyebrow || 'brain test').toLowerCase()} and brain game. Quick quiz challenge: can you beat it? Test yourself, eye test, IQ test, puzzle game, riddles.`;
const textKw = text.replace(/\n\n/, `\n\n${kw}\n\n`);
fs.writeFileSync(path.join(outDir, base + '.txt'), `${textKw}\n\n${tags.join(' ')}\n`);
fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify({ base, test, theme, difficulty: G.difficulty, rounds: res.rounds, seconds: res.seconds, opts: res.opts, duration: res.duration }, null, 2));
console.log(`Готово: ${base}.mp4, ${(res.duration).toFixed(1)} с, раундов ${res.rounds}, ${(fs.statSync(path.join(outDir, base + '.mp4')).size / 1048576).toFixed(1)} МБ`);
await browser.close();
