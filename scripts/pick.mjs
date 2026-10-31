// Берёт самое старое видео из queue/ и готовит его к публикации: out/site/v/<имя>.mp4, out/post.json, out/state.next.json.
// Правила запуска по расписанию (autoPublish, startDate, слот, дубли, опоздание) такие же, как в Битве флагов.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, OUT, SITE, loadConfig, loadState, writeJSON, setOutput, summary } from './lib.mjs';

const KIND = process.env.RUN_KIND || process.env.GITHUB_EVENT_NAME;
const skip = (title, text, log) => { console.log(log || text); summary(`### ${title}\n${text}`); setOutput('skip', 'true'); process.exit(0); };

const cfg = loadConfig();
const state = loadState();
const NOW = process.env.FAKE_NOW ? new Date(process.env.FAKE_NOW) : new Date();
const TZ = cfg.timezone || 'Asia/Baku';
const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(NOW);
let SLOT = '';

if (KIND === 'schedule') {
  if (cfg.autoPublish !== true) skip('Расписание на паузе', 'В `config.json` стоит `"autoPublish": false`, поэтому ролик не публиковался.');
  if (cfg.startDate && today < cfg.startDate) skip('Ещё рано', `Публикации по расписанию начнутся с ${cfg.startDate}. Сейчас ${today}.`);
  const lastP = [...state.history].reverse().find(x => x.posted);
  const gap = +cfg.minGapMinutes || 50;
  if (lastP && NOW.getTime() >= Date.parse(lastP.posted) && NOW.getTime() - Date.parse(lastP.posted) < gap * 60000)
    skip('Дубль пропущен', `Предыдущий ролик вышел меньше ${gap} минут назад, этот запуск ничего не делает.`);
  const sc = cfg.schedule;
  if (sc && Array.isArray(sc.hours) && sc.hours.length) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(NOW).map(x => [x.type, x.value]));
    const m = (+parts.hour % 24) * 60 + +parts.minute, min = +sc.minute || 0, maxD = +sc.maxDelayMinutes || 90;
    let hit = null;
    for (const h of sc.hours) for (const sh of [-1440, 0, 1440]) { const d = m + sh - (h * 60 + min); if (d >= -20 && d <= maxD && (!hit || Math.abs(d) < Math.abs(hit.d))) hit = { h, d, day: sh }; }
    if (!hit) skip('Опоздавший запуск пропущен', `Запуск пришёл в ${parts.hour}:${parts.minute} (${TZ}), ближайший слот был больше ${maxD} минут назад.`);
    const shift = hit.day === -1440 ? 1 : hit.day === 1440 ? -1 : 0;
    SLOT = `${new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(NOW.getTime() - shift * 86400000))}T${String(hit.h).padStart(2, '0')}`;
    if (state.history.some(x => x.slot === SLOT)) skip(`Слот ${SLOT} уже занят`, 'Ролик на это время уже опубликован.');
  }
}

const QUEUE = path.join(ROOT, 'queue');
const videos = fs.existsSync(QUEUE) ? fs.readdirSync(QUEUE).filter(f => /\.mp4$/i.test(f)).sort() : [];
if (!videos.length) skip('Очередь пуста', 'В папке `queue/` нет видео. Загрузи .mp4 (и .txt с описанием).');
const file = videos[0], base = file.replace(/\.mp4$/i, '');
const capPath = path.join(QUEUE, base + '.txt');
let caption = fs.existsSync(capPath) ? fs.readFileSync(capPath, 'utf8').trim() : '';
// Instagram принимает не больше 5 хэштегов: лишние убираем с конца, чтобы публикацию не отклонили
const tags = caption.match(/#[\p{L}\p{N}_]+/gu) || [];
if (tags.length > 5) {
  const drop = new Set(tags.slice(5));
  for (const t of drop) caption = caption.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}\\p{N}_])', 'u'), '');
  caption = caption.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  console.log(`Хэштегов было ${tags.length}, оставлено 5 (лимит Instagram).`);
}
if (caption.length > 2200) caption = caption.slice(0, 2199) + '…';

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(SITE, 'v'), { recursive: true });
fs.cpSync(path.join(ROOT, 'static'), SITE, { recursive: true });
const name = `${today}-${base.replace(/[^A-Za-z0-9._-]+/g, '-')}`.slice(0, 120);
const dst = path.join(SITE, 'v', name + '.mp4'), src = path.join(QUEUE, file);

// Instagram нужен H.264 + AAC, 4:2:0; если файл другой, перекодируем (без потери разрешения)
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,pix_fmt,width,height:format=duration', '-of', 'json', src]).toString());
const v = (probe.streams || []).find(s => s.codec_type === 'video'), a = (probe.streams || []).find(s => s.codec_type === 'audio');
const dur = +probe.format.duration;
if (!v) throw new Error(`В файле queue/${file} нет видеодорожки.`);
if (!(dur >= 3)) throw new Error(`Видео короче 3 секунд (${dur.toFixed(1)} с): Instagram такие не принимает.`);
const okFmt = v.codec_name === 'h264' && v.pix_fmt === 'yuv420p' && (!a || a.codec_name === 'aac');
if (okFmt) fs.copyFileSync(src, dst);
else {
  console.log(`Формат ${v.codec_name}/${v.pix_fmt}/${a ? a.codec_name : 'без звука'} перекодируем в H.264/AAC.`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-map', '0:v:0', '-map', '0:a:0?', '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '16', '-maxrate', '24M', '-bufsize', '48M',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', dst]);
}
let cover = null;
for (const ext of ['jpg', 'jpeg', 'png']) { const c = path.join(QUEUE, `${base}.${ext}`); if (fs.existsSync(c)) { cover = `v/${name}.jpg`; fs.copyFileSync(c, path.join(SITE, cover)); break; } }

writeJSON(path.join(OUT, 'post.json'), { video: `v/${name}.mp4`, cover, caption, title: base, queueFile: file, seconds: dur, createdAt: NOW.toISOString() });
const next = { ...state, history: [...state.history, { date: today, video: file, ...(SLOT ? { slot: SLOT } : {}) }].slice(-200) };
writeJSON(path.join(OUT, 'state.next.json'), next);
summary(`### Ролик выбран\n- Файл: \`${file}\` (${Math.round(dur)} с)\n- Осталось в очереди после него: ${videos.length - 1}\n\n**Подпись:**\n\n${caption.replace(/\n/g, '  \n') || '(пусто)'}\n`);
console.log(`Выбрано: ${file}, ${dur.toFixed(1)} с. Подпись ${caption.length} символов.`);
