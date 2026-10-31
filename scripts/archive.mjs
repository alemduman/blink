// После успешной публикации переносит видео (и описание/обложку) из queue/ в posted/, чтобы оно не вышло дважды.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, OUT, readJSON } from './lib.mjs';
const post = readJSON(path.join(OUT, 'post.json'), null);
if (!post || !post.queueFile) process.exit(0);
const base = post.queueFile.replace(/\.mp4$/i, '');
fs.mkdirSync(path.join(ROOT, 'posted'), { recursive: true });
for (const ext of ['mp4', 'txt', 'jpg', 'jpeg', 'png']) {
  const f = path.join(ROOT, 'queue', `${base}.${ext}`);
  if (fs.existsSync(f)) fs.renameSync(f, path.join(ROOT, 'posted', `${base}.${ext}`));
}
console.log(`Перенесено в posted/: ${base}`);
