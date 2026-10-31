// =====================================================================
// Tests. Each test generates its rounds from a seeded RNG and draws them
// inside a rect (820×820 in video space, smaller for intro art and
// thumbnails), so every size is expressed through u = rect.w / 820.
// =====================================================================
const fOf = (i, N) => (N > 1 ? i / (N - 1) : 0);
const qr = (cfg, rev = 1.8) => [{ kind: 'q', dur: cfg.seconds, timer: true }, { kind: 'reveal', dur: rev }];
const rangeLabel = (a, b) => (a >= b ? String(a) : `${a}–${b}`);
THEMES.forEach(t => { t.dark = luma(t.bg[1]) < 0.2; });

function stage(ctx, R, th, u, color) {
  shadowRR(ctx, R.x, R.y, R.w, R.h, 40 * u, color || th.stage, th.shadow, 30 * u, 10 * u);
}
function lab(ctx, th, text, x, y, u, color) {
  setFont(ctx, 800, 58 * u, th.fam); ctx.fillStyle = color || th.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y); ctx.textBaseline = 'alphabetic';
}
function dashLine(ctx, x1, y1, x2, y2, u, color) {
  ctx.save(); ctx.setLineDash([18 * u, 13 * u]); ctx.lineWidth = 6 * u; ctx.lineCap = 'round'; ctx.strokeStyle = color; line(ctx, x1, y1, x2, y2); ctx.restore();
}

// ---------------------------------------------------------------------
// 1. Shade Hunt
// ---------------------------------------------------------------------
const SHADES = [
  ['Dusty Rose', '#C9989B'], ['Sage', '#9DB08A'], ['Powder Blue', '#A6BDD4'], ['Lavender', '#B7A8DA'], ['Butter', '#EFD98C'],
  ['Peach', '#F3B49A'], ['Mint', '#A6DBC4'], ['Terracotta', '#C7735A'], ['Mauve', '#B28AA6'], ['Seafoam', '#8DCAB8'],
  ['Lilac', '#C8B2E0'], ['Sky', '#8FC4EC'], ['Coral', '#F18A7C'], ['Olive', '#A3A05E'], ['Teal', '#4D9C9A'],
  ['Apricot', '#F5B26C'], ['Periwinkle', '#9BA7E6'], ['Blush', '#F1B7C5'], ['Moss', '#7C9161'], ['Sand', '#D7C3A1'],
  ['Plum', '#8E5B87'], ['Cornflower', '#6F95E0'], ['Mustard', '#D4A838'], ['Cherry', '#D04A5B'], ['Denim', '#5B7DB1'],
  ['Pistachio', '#B4CE8F'], ['Clay', '#B8826A'], ['Bubblegum', '#F39AC1'], ['Slate', '#7D8A9B'], ['Honey', '#E6B04B'],
  ['Ocean', '#3E7FA8'], ['Jade', '#4FA67F'], ['Tangerine', '#F18C3B'], ['Orchid', '#C67EC8'], ['Fern', '#6E9E5A'], ['Rosewood', '#A55E6B'],
];
function fillTile(ctx, kind, x, y, sz0, rad, color) {
  const cx = x + sz0 / 2, cy = y + sz0 / 2;
  if (kind === 'circ') { ctx.fillStyle = color; circle(ctx, cx, cy, sz0 / 2); }
  else if (kind === 'hex') {
    ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.lineWidth = sz0 * 0.1; ctx.beginPath();
    for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 3, rd = sz0 * 0.45; ctx.lineTo(cx + Math.cos(a) * rd, cy + Math.sin(a) * rd); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'dia') {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4); const q = sz0 * 0.66; fillRR(ctx, -q / 2, -q / 2, q, q, q * 0.16, color); ctx.restore();
  } else fillRR(ctx, x, y, sz0, sz0, rad, color);
}
function drawShadeGrid(ctx, r, R, s, hideOdd) {
  const u = R.w / 820, n = r.size, gap = (n <= 3 ? 22 : n <= 4 ? 18 : n <= 6 ? 14 : 11) * u;
  const cell = (R.w - gap * (n - 1)) / n, rad = Math.max(6 * u, cell * 0.16);
  const reveal = s.phase === 'reveal', rp = reveal ? eOut(clamp(s.local / 0.35)) : 0;
  for (let k = 0; k < n * n; k++) {
    const x = R.x + (k % n) * (cell + gap), y = R.y + Math.floor(k / n) * (cell + gap), odd = !hideOdd && k === r.oddIndex;
    withAlpha(ctx, reveal && !odd ? lerp(1, 0.7, rp) : 1, () => fillTile(ctx, r.tile, x, y, cell, rad, odd ? r.odd : r.base));
  }
  if (reveal && !hideOdd) {
    const k = r.oddIndex, x = R.x + (k % n) * (cell + gap), y = R.y + Math.floor(k / n) * (cell + gap);
    const pad = lerp(40, 10, eBack(clamp(s.local / 0.45))) * u;
    withAlpha(ctx, clamp(s.local / 0.15), () => {
      ctx.lineWidth = 11 * u; ctx.strokeStyle = s.th.ink; const rd2 = r.tile === 'circ' ? cell / 2 : r.tile === 'hex' || r.tile === 'dia' ? cell * 0.34 : rad; rr(ctx, x - pad, y - pad, cell + pad * 2, cell + pad * 2, rd2 + pad); ctx.stroke();
    });
  }
}
defineTest({
  id: 'shade', name: 'Shade Hunt', tag: 'Vision', eyebrow: 'Eye test',
  blurb: 'One tile is a slightly different shade. Every round adds tiles and shrinks the difference.',
  defaults: { rounds: 7, seconds: 4 }, roundsRange: [3, 12],
  options: [{ id: 'tiles', label: 'Tile shape', choices: [['mix', 'Mixed'], ['sq', 'Squares'], ['circ', 'Circles'], ['hex', 'Hexagons']] }],
  hooks: ['Can you find the different shade?', 'Only 2% find all {N} shades 👀', 'How sharp are your eyes, really?', 'Find the odd color in {S} seconds'],
  shared: vr => ({ pal: rShuffle(vr, SHADES.slice()) }),
  gen(rng, i, N, diff, sh, opts) {
    const f = fOf(i, N), D = { easy: [3, 5, 0.11, 0.055], medium: [3, 6, 0.09, 0.034], hard: [4, 7, 0.07, 0.024], expert: [5, 8, 0.052, 0.016] }[diff];
    const size = Math.round(lerp(D[0], D[1], f)), delta = lerp(D[2], D[3], f);
    const [name, base] = sh.pal[i % sh.pal.length];
    const L = rgbToOklab(hexToRgb(base))[0], dir = L > 0.8 ? -1 : L < 0.5 ? 1 : rng() < 0.5 ? -1 : 1;
    let odd = shiftL(base, dir * delta);
    if (odd.toLowerCase() === base.toLowerCase()) odd = shiftL(base, dir * (delta + 0.012));
    const tile = !opts || !opts.tiles || opts.tiles === 'mix' ? rPick(rng, ['sq', 'circ', 'hex', 'dia']) : opts.tiles;
    return { size, tile, base, odd, name, oddIndex: Math.floor(rng() * size * size), pill: rPick(rng, ['Did you find it? 👀', 'Found it?', 'Got it?', 'Did you spot it?']) };
  },
  phases: (r, cfg) => qr(cfg),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: 'Find the different shade' } : { eyebrow: 'The color was', title: r.name }),
  bottom: (r, ph) => (ph === 'reveal' ? { pill: r.pill } : null),
  draw: (ctx, r, s) => drawShadeGrid(ctx, r, s.rect, s, false),
  art: (ctx, R, tl) => drawShadeGrid(ctx, tl.rounds[0], R, { phase: 'art', th: tl.theme }, true),
  outro: { title: 'How many did you find?', labels: ['Eagle eyes 🦅', 'Sharp eyes 👀', 'Not bad 🙂', 'Time for glasses 👓'] },
});

// ---------------------------------------------------------------------
// 2. Hidden Number (dot plates)
// ---------------------------------------------------------------------
const PLATE_R = 400;
const PLATE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'M', 'N', 'R', 'S', 'T', 'X', 'Z', 'P', 'W'];
const PLATE_SHAPES = [['⭐', 'Star'], ['💛', 'Heart'], ['🔔', 'Bell'], ['🏠', 'House'], ['🌳', 'Tree'], ['🍎', 'Apple'], ['🎈', 'Balloon'], ['👑', 'Crown'], ['🚗', 'Car'], ['🦆', 'Duck'], ['⚓', 'Anchor'], ['🔑', 'Key'], ['🍐', 'Pear'], ['🐧', 'Penguin'], ['🎩', 'Top Hat'], ['🐘', 'Elephant']];
const PLATE_KIND = { num: ['number', 'What number do you see?'], letter: ['letter', 'What letter do you see?'], shape: ['shape', 'What shape do you see?'] };
const PLATE_SCHEMES = [
  { fig: [0.70, 0.14, 48], gnd: [0.72, 0.13, 128] },
  { fig: [0.71, 0.13, 142], gnd: [0.71, 0.14, 50] },
  { fig: [0.67, 0.12, 12], gnd: [0.71, 0.07, 98] },
  { fig: [0.63, 0.13, 308], gnd: [0.65, 0.12, 248] },
  { fig: [0.69, 0.11, 192], gnd: [0.73, 0.13, 72] },
  { fig: [0.66, 0.15, 30], gnd: [0.69, 0.11, 160] },
];
function packDots(rng, R) {
  const dots = [], cell = 46, grid = new Map(), GAP = 3.2, key = (a, b) => a * 4096 + b;
  const fits = (x, y, r) => {
    const gx = Math.floor((x + R) / cell), gy = Math.floor((y + R) / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const arr = grid.get(key(gx + dx, gy + dy)); if (!arr) continue;
      for (const d of arr) { const ex = d.x - x, ey = d.y - y, m = d.r + r + GAP; if (ex * ex + ey * ey < m * m) return false; }
    }
    return true;
  };
  const add = d => { const k = key(Math.floor((d.x + R) / cell), Math.floor((d.y + R) / cell)); let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(d); dots.push(d); };
  for (const [a, b, n] of [[13, 15.5, 1400], [10, 12.5, 3200], [7.5, 9.5, 6500], [5.5, 7, 9000], [3.6, 5, 9000]]) {
    for (let k = 0; k < n; k++) {
      const r = a + rng() * (b - a), rho = (R - r - 2) * Math.sqrt(rng()), an = rng() * Math.PI * 2;
      const x = rho * Math.cos(an), y = rho * Math.sin(an);
      if (fits(x, y, r)) add({ x, y, r });
    }
  }
  return dots;
}
function digitMask(text, R, emoji) {
  const S = R * 2, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d', { willReadFrequently: true });
  const chars = [...text];
  let size = emoji ? R * 0.96 : chars.length > 1 ? R * 1.0 : R * 1.22;
  const measure = () => { g.font = `600 ${size}px ${emoji ? 'sans-serif' : FAM.round}`; const ws = chars.map(ch => g.measureText(ch).width), gap = size * 0.14; return { ws, gap, total: ws.reduce((a, b) => a + b, 0) + gap * (chars.length - 1) }; };
  let mz = measure();
  if (mz.total > S * 0.68) { size *= (S * 0.68) / mz.total; mz = measure(); }
  const m = g.measureText(text), asc = m.actualBoundingBoxAscent || size * 0.7, desc = m.actualBoundingBoxDescent || 0;
  const y = emoji ? S / 2 + size * 0.36 : S / 2 + (asc - desc) / 2;
  g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineJoin = 'round'; g.lineWidth = emoji ? 0 : size * 0.03;
  let x = S / 2 - mz.total / 2;
  chars.forEach((ch, i) => { g.fillText(ch, x, y); if (!emoji) g.strokeText(ch, x, y); x += mz.ws[i] + mz.gap; });
  return { data: g.getImageData(0, 0, S, S).data, S };
}
function maskHit(m, d, R) {
  let hits = 0;
  for (const [ox, oy] of [[0, 0], [0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]]) {
    const x = Math.round(d.x + ox * d.r + R), y = Math.round(d.y + oy * d.r + R);
    if (x >= 0 && y >= 0 && x < m.S && y < m.S && m.data[(y * m.S + x) * 4 + 3] > 127) hits++;
  }
  return hits >= 3;
}
function plateColor(rng, spec, gnd, hueK, lum) {
  let h = spec[2];
  if (spec !== gnd) { const d = ((spec[2] - gnd[2] + 540) % 360) - 180; h = gnd[2] + d * hueK; }
  return oklch(clamp(spec[0] + lum + (rng() - 0.5) * 0.17, 0.4, 0.9), spec[1] * (0.78 + rng() * 0.44), h + (rng() - 0.5) * 16);
}
function makePlate(rng, text, scheme, hueK, lum, emoji) {
  const dots = packDots(rng, PLATE_R), m = digitMask(text, PLATE_R, emoji);
  for (const d of dots) {
    d.fig = maskHit(m, d, PLATE_R);
    d.c = plateColor(rng, d.fig ? scheme.fig : scheme.gnd, scheme.gnd, hueK, d.fig ? lum : 0);
    d.cg = mixHex(d.c, '#ECEAE5', 0.8);
  }
  return { dots, R: PLATE_R };
}
function plateImage(p, mode) {
  p._img = p._img || {};
  if (p._img[mode]) return p._img[mode];
  const R = p.R, PAD = 40, S = R * 2 + PAD * 2, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); g.translate(S / 2, S / 2);
  g.save(); g.shadowColor = 'rgba(0,0,0,0.20)'; g.shadowBlur = 30; g.shadowOffsetY = 10; g.fillStyle = '#F3F1EC';
  g.beginPath(); g.arc(0, 0, R + 8, 0, Math.PI * 2); g.fill(); g.restore();
  for (const d of p.dots) { g.fillStyle = mode === 'reveal' && !d.fig ? d.cg : d.c; g.beginPath(); g.arc(d.x, d.y, d.r, 0, Math.PI * 2); g.fill(); }
  p._img[mode] = c; return c;
}
function drawPlateImg(ctx, p, R, mode, a = 1) {
  const img = plateImage(p, mode), D = Math.min(R.w, R.h), S = img.width * (D / (p.R * 2 + 16));
  withAlpha(ctx, a, () => ctx.drawImage(img, R.x + R.w / 2 - S / 2, R.y + R.h / 2 - S / 2, S, S));
}
defineTest({
  id: 'plate', name: 'Hidden Number', tag: 'Color', eyebrow: 'Color vision test',
  blurb: 'Dot plates with a number, letter or shape hidden in color. Harder rounds use closer hues. Just for fun, not a medical test.',
  defaults: { rounds: 6, seconds: 4 }, roundsRange: [3, 10],
  hooks: ['What do you see in the dots?', 'Some people see no numbers at all 👀', 'Quick color vision check 🌈', 'Can you read all {N} hidden numbers?'],
  options: [{ id: 'hidden', label: 'Hidden', choices: [['mixed', 'Mixed'], ['num', 'Numbers'], ['letter', 'Letters'], ['shape', 'Shapes']] }],
  shared: (vr, N, cfg, opts) => {
    const nums = rShuffle(vr, [12, 8, 29, 74, 6, 45, 5, 3, 15, 97, 42, 16, 73, 26, 2, 57, 35, 96, 7, 88, 39, 63, 24, 58]), letters = rShuffle(vr, PLATE_LETTERS.slice()), shapes = rShuffle(vr, PLATE_SHAPES.slice());
    const mode = (opts && opts.hidden) || 'mixed', seq = rShuffle(vr, ['num', 'letter', 'shape']), used = { num: 0, letter: 0, shape: 0 }, plan = [];
    for (let i = 0; i < Math.max(N, 12); i++) {
      const kind = mode === 'mixed' ? seq[i % 3] : mode, k = used[kind]++;
      if (kind === 'num') plan.push({ kind, text: String(nums[k % nums.length]), label: String(nums[k % nums.length]) });
      else if (kind === 'letter') plan.push({ kind, text: letters[k % letters.length], label: letters[k % letters.length] });
      else { const p = shapes[k % shapes.length]; plan.push({ kind, text: p[0], label: `${p[0]} ${p[1]}`, emoji: true }); }
    }
    return { plan, order: rShuffle(vr, PLATE_SCHEMES.map((_, i) => i)), intro: makePlate(vr, '?', PLATE_SCHEMES[0], 1, -0.05) };
  },
  gen(rng, i, N, diff, sh) {
    const f = fOf(i, N), k = { easy: [1, 0.85], medium: [0.95, 0.62], hard: [0.78, 0.46], expert: [0.62, 0.34] }[diff];
    const lum = { easy: -0.06, medium: -0.035, hard: -0.015, expert: 0 }[diff];
    const pl = sh.plan[i % sh.plan.length], kk = pl.kind === 'shape' ? [Math.min(1, k[0] + 0.1), Math.min(0.9, k[1] + 0.12)] : k;
    return { kind: pl.kind, label: pl.label, ...makePlate(rng, pl.text, PLATE_SCHEMES[sh.order[i % sh.order.length]], lerp(kk[0], kk[1], f), lum, pl.emoji) };
  },
  phases: (r, cfg) => qr(cfg, 2.0),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Plate ${r.i + 1} / ${tl.N}`, title: PLATE_KIND[r.kind][1] } : { eyebrow: `The ${PLATE_KIND[r.kind][0]} is`, title: r.label }),
  bottom: (r, ph) => (ph === 'reveal' ? { pill: 'Did you see it? 👀' } : null),
  draw(ctx, r, s) { drawPlateImg(ctx, r, s.rect, 'base'); if (s.phase === 'reveal') drawPlateImg(ctx, r, s.rect, 'reveal', eOut(clamp(s.local / 0.5))); },
  art: (ctx, R, tl) => drawPlateImg(ctx, tl.shared.intro, R, 'base'),
  outro: { title: 'How many did you see?', labels: ['Color master 🌈', 'Great color vision 👏', 'Tricky, right? 🤔', 'Colors fooled you 😅'], note: 'Just for fun · not a medical test' },
  introChip: tl => `${tl.N} plates · ${tl.cfg.seconds} sec each`,
});

// ---------------------------------------------------------------------
// 3. Odd One Out (emoji / letters)
// ---------------------------------------------------------------------
const ODD_EMOJI = [
  ['🍎', '🍏', 1], ['😀', '😎', 1], ['🌕', '🌝', 1], ['❤️', '💔', 1], ['⚽', '🏀', 1], ['🐶', '🐱', 1], ['🌷', '🌹', 1], ['☀️', '🌞', 1],
  ['🙂', '🙃', 2], ['😃', '😆', 2], ['🐟', '🐠', 2], ['🌲', '🌳', 2], ['⭐', '🌟', 2], ['🔒', '🔓', 2], ['📗', '📘', 2], ['🐻', '🐨', 2], ['🍊', '🍑', 2], ['😺', '😸', 2],
  ['😀', '😃', 3], ['🕐', '🕑', 3], ['✋', '🤚', 3], ['🌘', '🌒', 3], ['😐', '😑', 3], ['😊', '☺️', 3], ['🔅', '🔆', 3], ['👆', '☝️', 3], ['😗', '😙', 3], ['📕', '📙', 3],
];
const ODD_CHARS = [
  ['O', 'Q', 1], ['F', 'E', 1], ['C', 'G', 1], ['V', 'Y', 1], ['M', 'W', 1], ['I', 'T', 1],
  ['9', '6', 2], ['d', 'b', 2], ['M', 'N', 2], ['q', 'p', 2], ['8', '3', 2], ['R', 'P', 2],
  ['O', '0', 3, 'zero'], ['rn', 'm', 3], ['B', '8', 3], ['S', '5', 3], ['Z', '2', 3], ['vv', 'w', 3],
];
const ODD_NUMS = [
  ['1', '7', 1], ['3', '8', 1], ['0', '8', 1], ['4', '9', 1],
  ['2', '5', 2], ['6', '9', 2], ['5', '6', 2], ['3', '5', 2], ['8', '9', 2],
  ['69', '96', 3], ['38', '83', 3], ['17', '71', 3], ['25', '52', 3], ['68', '86', 3], ['12', '21', 3],
];
const oddLevel = (diff, f) => (diff === 'easy' ? (f < 0.5 ? 1 : 2) : diff === 'medium' ? (f < 0.34 ? 1 : f < 0.67 ? 2 : 3) : diff === 'hard' ? (f < 0.4 ? 2 : 3) : 3);
function drawOddGrid(ctx, r, R, s, hideOdd) {
  const u = R.w / 820, th = s.th;
  stage(ctx, R, th, u);
  const pad = 30 * u, n = r.n, cell = (R.w - pad * 2) / n, size = r.emoji ? cell * 0.74 : r.base.length > 1 ? cell * 0.5 : cell * 0.64;
  const reveal = s.phase === 'reveal', rp = reveal ? eOut(clamp(s.local / 0.3)) : 0;
  if (!r.emoji) { setFont(ctx, 600, size, th.fam); ctx.fillStyle = th.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; }
  for (let k = 0; k < n * n; k++) {
    const cx = R.x + pad + (k % n + 0.5) * cell, cy = R.y + pad + (Math.floor(k / n) + 0.5) * cell;
    const odd = !hideOdd && k === r.oddIndex, a = reveal && !odd ? lerp(1, 0.16, rp) : 1;
    if (r.emoji) drawEmoji(ctx, odd ? r.odd : r.base, cx, cy, size, a);
    else withAlpha(ctx, a, () => ctx.fillText(odd ? r.odd : r.base, cx, cy + size * 0.03));
  }
  ctx.textBaseline = 'alphabetic';
  if (reveal && !hideOdd) {
    const k = r.oddIndex, cx = R.x + pad + (k % n + 0.5) * cell, cy = R.y + pad + (Math.floor(k / n) + 0.5) * cell;
    const rad = cell * lerp(1.3, 0.62, eBack(clamp(s.local / 0.45)));
    withAlpha(ctx, clamp(s.local / 0.15), () => { ctx.lineWidth = 9 * u; ctx.strokeStyle = th.accent; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke(); });
  }
}
defineTest({
  id: 'oddone', name: 'Odd One Out', tag: 'Focus', eyebrow: 'Focus test',
  blurb: 'A grid of look-alike emoji or letters with one impostor. The grid grows every round.',
  defaults: { rounds: 6, seconds: 5 }, roundsRange: [3, 10],
  options: [{ id: 'style', label: 'Symbols', choices: [['mixed', 'Mixed'], ['emoji', 'Emoji'], ['letters', 'Letters'], ['numbers', 'Numbers']] }],
  hooks: ['Find the odd one out 🔎', 'Spot it in {S} seconds', 'It gets harder every round 😵', 'Only sharp eyes finish this'],
  shared(vr, N, cfg, opts) {
    const style = opts.style || 'mixed', pools = { e: {}, c: {}, n: {} }, used = { e: [0, 0, 0, 0], c: [0, 0, 0, 0], n: [0, 0, 0, 0] }, plan = [], off = Math.floor(vr() * 3);
    [1, 2, 3].forEach(l => { pools.e[l] = rShuffle(vr, ODD_EMOJI.filter(p => p[2] === l)); pools.c[l] = rShuffle(vr, ODD_CHARS.filter(p => p[2] === l)); pools.n[l] = rShuffle(vr, ODD_NUMS.filter(p => p[2] === l)); });
    for (let i = 0; i < N; i++) {
      const kind = style === 'emoji' ? 'e' : style === 'letters' ? 'c' : style === 'numbers' ? 'n' : 'ecn'[(i + off) % 3], lv = oddLevel(cfg.difficulty, fOf(i, N)), pool = pools[kind][lv];
      plan.push({ emoji: kind === 'e', pair: pool[used[kind][lv]++ % pool.length] });
    }
    return { plan };
  },
  gen(rng, i, N, diff, sh) {
    const { emoji, pair } = sh.plan[i], f = fOf(i, N);
    const nr = emoji ? { easy: [5, 7], medium: [6, 8], hard: [7, 9], expert: [8, 10] }[diff] : { easy: [6, 8], medium: [7, 9], hard: [8, 10], expert: [9, 11] }[diff];
    const n = Math.round(lerp(nr[0], nr[1], f));
    return { emoji, base: pair[0], odd: pair[1], name: pair[3] || pair[1], n, oddIndex: Math.floor(rng() * n * n) };
  },
  phases: (r, cfg) => qr(cfg),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: r.emoji ? 'Find the odd one out' : `Find the ${r.name}` } : { eyebrow: 'Here it is', title: `${r.odd}  vs  ${r.base}` }),
  bottom: (r, ph) => (ph === 'reveal' ? { pill: rPick(mulberry32(r.oddIndex + 7), ['Found it? 👀', 'Did you spot it?', 'Got it?']) } : null),
  draw: (ctx, r, s) => drawOddGrid(ctx, r, s.rect, s, false),
  art: (ctx, R, tl) => drawOddGrid(ctx, tl.rounds[0], R, { phase: 'art', th: tl.theme }, true),
  outro: { title: 'How many did you find?', labels: ['Hawk eyes 🦅', 'Quick spotter 🔎', 'Getting there 🙂', 'They got you 😅'] },
});

// ---------------------------------------------------------------------
// 4. Mind Tricks (optical illusions)
// ---------------------------------------------------------------------
const sz = (r, who) => (r && r.res === who ? 1 + r.d : 1);
const ILL = {
  ebbinghaus: {
    q: 'Which orange circle is bigger?', word: 'bigger', app: 'B', truth: 'Same size! 🤯',
    draw(ctx, R, th, ph, t, r) {
      const u = R.w / 820; stage(ctx, R, th, u);
      const cy = R.y + R.h * 0.45, ax = R.x + 282 * u, bx = R.x + 668 * u;
      let sa = 1, mv = 0, gd = 0;
      if (ph === 'reveal') { sa = 1 - eInOut(clamp(t / 0.5)); mv = eInOut(clamp((t - 0.45) / 0.8)); gd = eOut(clamp((t - 1.3) / 0.4)); }
      ctx.fillStyle = th.dark ? '#6F7C96' : '#AAB4C8';
      withAlpha(ctx, sa, () => {
        for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 - Math.PI / 2; circle(ctx, ax + Math.cos(a) * 160 * u, cy + Math.sin(a) * 160 * u, 78 * u); }
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; circle(ctx, bx + Math.cos(a) * 82 * u, cy + Math.sin(a) * 82 * u, 22 * u); }
      });
      const x1 = lerp(ax, R.x + R.w / 2 - 62 * u, mv), x2 = lerp(bx, R.x + R.w / 2 + 62 * u, mv);
      ctx.fillStyle = '#F7931E'; circle(ctx, x1, cy, 50 * u * sz(r, 'A')); circle(ctx, x2, cy, 50 * u * sz(r, 'B'));
      lab(ctx, th, 'A', x1, cy + 300 * u, u); lab(ctx, th, 'B', x2, cy + 300 * u, u);
      if (gd > 0) withAlpha(ctx, gd, () => { dashLine(ctx, x1 - 110 * u, cy - 50 * u, x2 + 110 * u, cy - 50 * u, u, th.accent); dashLine(ctx, x1 - 110 * u, cy + 50 * u, x2 + 110 * u, cy + 50 * u, u, th.accent); });
    },
  },
  mullerlyer: {
    q: 'Which line is longer?', word: 'longer', app: 'B', truth: 'Exactly the same length',
    draw(ctx, R, th, ph, t, r) {
      const u = R.w / 820; stage(ctx, R, th, u);
      const cx = R.x + R.w / 2 + 24 * u, L = 420 * u, yA = R.y + R.h * 0.33, yB = R.y + R.h * 0.67, ca = Math.cos(0.7) * 80 * u, sa = Math.sin(0.7) * 80 * u;
      const LA = L * sz(r, 'A'), LB = L * sz(r, 'B');
      const l = cx - LA / 2, rt = cx + LA / 2, l2 = cx - LB / 2, rt2 = cx + LB / 2;
      let fa = 1, gd = 0;
      if (ph === 'reveal') { fa = 1 - eInOut(clamp(t / 0.5)); gd = eOut(clamp((t - 0.45) / 0.7)); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = th.ink; ctx.lineWidth = 14 * u;
      line(ctx, l, yA, rt, yA); line(ctx, l2, yB, rt2, yB);
      withAlpha(ctx, fa, () => {
        ctx.beginPath();
        ctx.moveTo(l + ca, yA - sa); ctx.lineTo(l, yA); ctx.lineTo(l + ca, yA + sa);
        ctx.moveTo(rt - ca, yA - sa); ctx.lineTo(rt, yA); ctx.lineTo(rt - ca, yA + sa);
        ctx.moveTo(l2 - ca, yB - sa); ctx.lineTo(l2, yB); ctx.lineTo(l2 - ca, yB + sa);
        ctx.moveTo(rt2 + ca, yB - sa); ctx.lineTo(rt2, yB); ctx.lineTo(rt2 + ca, yB + sa);
        ctx.stroke();
      });
      lab(ctx, th, 'A', R.x + 66 * u, yA, u); lab(ctx, th, 'B', R.x + 66 * u, yB, u);
      if (gd > 0) { const y0 = yA - 100 * u, y1 = lerp(y0, yB + 100 * u, gd), gl = cx - L / 2, gr = cx + L / 2; dashLine(ctx, gl, y0, gl, y1, u, th.accent); dashLine(ctx, gr, y0, gr, y1, u, th.accent); }
    },
  },
  contrast: {
    q: 'Which square is darker?', word: 'darker', app: 'B', truth: 'Same exact gray 😳',
    draw(ctx, R, th, ph, t, r) {
      const u = R.w / 820;
      stage(ctx, R, th, u, '#808080');
      ctx.save(); rr(ctx, R.x, R.y, R.w, R.h, 40 * u); ctx.clip();
      const g = ctx.createLinearGradient(R.x, 0, R.x + R.w, 0); g.addColorStop(0, '#0B0B0B'); g.addColorStop(1, '#F6F6F6');
      ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
      const s = 160 * u, cy = R.y + R.h / 2, x1 = R.x + R.w * 0.22, x2 = R.x + R.w * 0.78;
      const gv = who => { const v = r && r.res === who ? Math.round(128 * (1 - r.d)) : 128; return `rgb(${v},${v},${v})`; }, cA = gv('A'), cB = gv('B');
      ctx.fillStyle = cA; ctx.fillRect(x1 - s / 2, cy - s / 2, s, s);
      ctx.fillStyle = cB; ctx.fillRect(x2 - s / 2, cy - s / 2, s, s);
      if (ph === 'reveal') {
        const b = eInOut(clamp((t - 0.15) / 0.9)), bh = 64 * u, bg = ctx.createLinearGradient(x1 + s / 2, 0, x2 - s / 2, 0);
        bg.addColorStop(0, cA); bg.addColorStop(1, cB); ctx.fillStyle = bg; ctx.fillRect(x1 + s / 2 - 1, cy - bh / 2, (x2 - x1 - s + 2) * b, bh);
      }
      lab(ctx, th, 'A', x1, cy - s / 2 - 70 * u, u, '#FFFFFF'); lab(ctx, th, 'B', x2, cy - s / 2 - 70 * u, u, '#111111');
      ctx.restore();
    },
  },
  vh: {
    q: 'Which line is longer?', word: 'longer', app: 'A', truth: 'Same length!',
    draw(ctx, R, th, ph, t, r) {
      const u = R.w / 820; stage(ctx, R, th, u);
      const L = 400 * u, LV = L * sz(r, 'A'), LH = L * sz(r, 'B'), cx = R.x + R.w / 2, by = R.y + R.h * 0.8;
      ctx.strokeStyle = th.ink; ctx.lineWidth = 16 * u; ctx.lineCap = 'round';
      line(ctx, cx - LH / 2, by, cx + LH / 2, by); line(ctx, cx, by, cx, by - LV);
      lab(ctx, th, 'A', cx + 56 * u, by - LV + 34 * u, u); lab(ctx, th, 'B', cx + LH / 2 - 6 * u, by + 60 * u, u);
      if (ph === 'reveal') {
        const p = eInOut(clamp((t - 0.15) / 1.0)), my = lerp(by - LV / 2, by - 84 * u, p), an = lerp(-Math.PI / 2, 0, p);
        ctx.strokeStyle = th.accent; ctx.lineWidth = 16 * u;
        line(ctx, cx - (Math.cos(an) * LV) / 2, my - (Math.sin(an) * LV) / 2, cx + (Math.cos(an) * LV) / 2, my + (Math.sin(an) * LV) / 2);
        const gd = eOut(clamp((t - 1.2) / 0.4));
        if (gd > 0) withAlpha(ctx, gd, () => { dashLine(ctx, cx - LH / 2, by - 140 * u, cx - LH / 2, by + 26 * u, u, th.accent); dashLine(ctx, cx + LH / 2, by - 140 * u, cx + LH / 2, by + 26 * u, u, th.accent); });
      }
    },
  },
  ponzo: {
    q: 'Which bar is longer?', word: 'longer', app: 'A', truth: 'They are identical',
    draw(ctx, R, th, ph, t, r) {
      const u = R.w / 820; stage(ctx, R, th, u);
      const cx = R.x + R.w / 2, top = R.y + 60 * u, bot = R.y + R.h - 60 * u, railX = y => 70 * u + (260 * u * (y - top)) / (bot - top);
      let ra = 1, mv = 0, gd = 0;
      if (ph === 'reveal') { ra = 1 - eInOut(clamp(t / 0.5)); mv = eInOut(clamp((t - 0.45) / 0.8)); gd = eOut(clamp((t - 1.3) / 0.4)); }
      withAlpha(ctx, ra, () => {
        ctx.strokeStyle = th.sub; ctx.lineWidth = 7 * u; ctx.lineCap = 'round';
        for (let k = 1; k <= 11; k++) { const y = top + (bot - top) * Math.pow(k / 11.5, 1.7), hw = railX(y) + 26 * u; line(ctx, cx - hw, y, cx + hw, y); }
        ctx.strokeStyle = th.ink; ctx.lineWidth = 12 * u;
        line(ctx, cx - 70 * u, top, cx - 330 * u, bot); line(ctx, cx + 70 * u, top, cx + 330 * u, bot);
      });
      const bw = 200 * u, bwA = bw * sz(r, 'A'), bwB = bw * sz(r, 'B'), bh = 28 * u, yT = R.y + R.h * 0.3, yB0 = R.y + R.h * 0.79, yB = lerp(yB0, yT + 74 * u, mv);
      fillRR(ctx, cx - bwA / 2, yT - bh / 2, bwA, bh, 9 * u, th.accent); fillRR(ctx, cx - bwB / 2, yB - bh / 2, bwB, bh, 9 * u, th.accent);
      lab(ctx, th, 'A', cx + railX(yT) + 64 * u, yT, u);
      lab(ctx, th, 'B', lerp(cx + railX(yB0) + 64 * u, cx + railX(yT) + 64 * u, mv), yB, u);
      if (gd > 0) withAlpha(ctx, gd, () => { dashLine(ctx, cx - bw / 2, yT - 60 * u, cx - bw / 2, yB + 60 * u, u, th.ink); dashLine(ctx, cx + bw / 2, yT - 60 * u, cx + bw / 2, yB + 60 * u, u, th.ink); });
    },
  },
  jastrow: {
    q: 'Which shape is bigger?', word: 'bigger', app: 'B', truth: 'Identical shapes!',
    draw(ctx, R, th, ph, t, r) {
      const u = R.w / 820; stage(ctx, R, th, u);
      const cx = R.x + R.w / 2, r1 = 300 * u, r2 = 440 * u, half = (24 * Math.PI) / 180, a0 = -Math.PI / 2 - half, a1 = -Math.PI / 2 + half;
      const cyA = R.y + 650 * u, off = 205 * u, mv = ph === 'reveal' ? eInOut(clamp((t - 0.15) / 1.0)) : 0, cyB = cyA + off * (1 - mv);
      const shape = (cy, k) => { ctx.beginPath(); ctx.arc(cx, cy, r2 * k, a0, a1); ctx.arc(cx, cy, r1 * k, a1, a0, true); ctx.closePath(); };
      ctx.fillStyle = '#FF6B57'; shape(cyA, sz(r, 'A')); ctx.fill();
      withAlpha(ctx, lerp(1, 0.78, mv), () => { ctx.fillStyle = '#3E8BFF'; shape(cyB, sz(r, 'B')); ctx.fill(); });
      lab(ctx, th, 'A', cx - 240 * u, cyA - 350 * u, u);
      withAlpha(ctx, 1 - clamp(mv * 2.5), () => lab(ctx, th, 'B', cx - 240 * u, cyB - 350 * u, u));
    },
  },
  cafewall: {
    q: 'Are the gray lines parallel?', yn: true, truth: 'Perfectly parallel!', no: 'Nope, they fan out! 😮',
    draw(ctx, R, th, ph, t, r) {
      const u = R.w / 820;
      stage(ctx, R, th, u, '#8E8E8E');
      ctx.save(); rr(ctx, R.x, R.y, R.w, R.h, 40 * u); ctx.clip();
      const wedge = r && r.res !== 'same' ? (r.res === 'A' ? -1 : 1) * 0.0042 : 0, cxm = R.x + R.w / 2;
      const rows = 9, mort = 6 * u, tile = (R.h - mort * (rows + 1)) / rows, offs = [0, 0.25, 0.5, 0.25, 0, 0.25, 0.5, 0.25, 0];
      for (let ri = 0; ri < rows; ri++) {
        const y = R.y + mort + ri * (tile + mort), off = offs[ri] * tile, sl = (ri - 4) * wedge;
        ctx.save(); ctx.transform(1, sl, 0, 1, 0, -sl * cxm);
        for (let c = -2; c * tile < R.w + tile * 2; c++) { ctx.fillStyle = c & 1 ? '#F4F4F4' : '#111111'; ctx.fillRect(R.x + c * tile + off, y, tile + 0.6, tile); }
        ctx.restore();
      }
      if (ph === 'reveal') {
        const p = eInOut(clamp((t - 0.1) / 0.9));
        ctx.strokeStyle = '#FF2D55'; ctx.lineWidth = 7 * u;
        for (let k = 1; k < rows; k++) { const y = R.y + k * (tile + mort) + mort / 2, sl = (k - 4.5) * wedge; line(ctx, R.x, y + sl * (R.x - cxm), R.x + R.w * p, y + sl * (R.x + R.w * p - cxm)); }
      }
      ctx.restore();
    },
  },
  poggendorff: {
    q: 'Does the line line up?', yn: true, truth: 'Perfectly lined up!', no: 'Nope, one side is shifted! 😮',
    draw(ctx, R, th, ph, t, r) {
      const u = R.w / 820; stage(ctx, R, th, u);
      const cx = R.x + R.w / 2, cy = R.y + R.h / 2, hw = 78 * u, k = 1.25, dx = 190 * u, off = r && r.res !== 'same' ? (r.res === 'A' ? -1 : 1) * 38 * u : 0, yAt = x => cy - k * (x - cx);
      ctx.fillStyle = th.dark ? '#6F7C96' : '#AAB4C8'; ctx.fillRect(cx - hw, R.y + 90 * u, hw * 2, R.h - 180 * u);
      ctx.strokeStyle = th.ink; ctx.lineWidth = 13 * u; ctx.lineCap = 'round';
      line(ctx, cx - hw - dx, yAt(cx - hw - dx), cx - hw, yAt(cx - hw)); line(ctx, cx + hw, yAt(cx + hw) + off, cx + hw + dx, yAt(cx + hw + dx) + off);
      if (ph === 'reveal') { const p = eInOut(clamp((t - 0.2) / 0.9)), x0 = cx - hw - dx, x1 = lerp(x0, cx + hw + dx + 30 * u, p); dashLine(ctx, x0, yAt(x0), x1, yAt(x1), u, th.accent); }
    },
  },
  zollner: {
    q: 'Are the long lines parallel?', yn: true, truth: 'Perfectly parallel!', no: 'Nope, they tilt! 😮',
    draw(ctx, R, th, ph, t, r) {
      const u = R.w / 820; stage(ctx, R, th, u);
      ctx.save(); rr(ctx, R.x, R.y, R.w, R.h, 40 * u); ctx.clip();
      const cx = R.x + R.w / 2, wedge = r && r.res !== 'same' ? (r.res === 'A' ? -1 : 1) * 0.014 : 0, ra = ph === 'reveal' ? 1 - eInOut(clamp((t - 0.1) / 0.8)) : 1;
      for (let k = 0; k < 5; k++) {
        const y0 = R.y + R.h * (0.14 + k * 0.18), sl = (k - 2) * wedge, dir = k % 2 ? 1 : -1;
        withAlpha(ctx, ra, () => { ctx.strokeStyle = th.ink; ctx.lineWidth = 4.5 * u; ctx.lineCap = 'round'; for (let x = R.x + 30 * u; x < R.x + R.w - 20 * u; x += 44 * u) { const y = y0 + sl * (x - cx), d = 30 * u; line(ctx, x - d * dir, y - d, x + d * dir, y + d); } });
        ctx.strokeStyle = th.accent; ctx.lineWidth = 10 * u; ctx.lineCap = 'butt'; line(ctx, R.x, y0 + sl * (R.x - cx), R.x + R.w, y0 + sl * (R.x + R.w - cx));
      }
      ctx.restore();
    },
  },
  delboeuf: {
    q: 'Which orange circle is bigger?', word: 'bigger', app: 'A', truth: 'Same size! 🤯',
    draw(ctx, R, th, ph, t, r) {
      const u = R.w / 820; stage(ctx, R, th, u);
      const cy = R.y + R.h * 0.45, ax = R.x + R.w * 0.3, bx = R.x + R.w * 0.72;
      let sa = 1, mv = 0, gd = 0;
      if (ph === 'reveal') { sa = 1 - eInOut(clamp(t / 0.5)); mv = eInOut(clamp((t - 0.45) / 0.8)); gd = eOut(clamp((t - 1.3) / 0.4)); }
      ctx.strokeStyle = th.dark ? '#6F7C96' : '#AAB4C8'; ctx.lineWidth = 8 * u;
      withAlpha(ctx, sa, () => { ctx.beginPath(); ctx.arc(ax, cy, 46 * u * 1.32, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(bx, cy, 46 * u * 2.9, 0, Math.PI * 2); ctx.stroke(); });
      const x1 = lerp(ax, R.x + R.w / 2 - 74 * u, mv), x2 = lerp(bx, R.x + R.w / 2 + 74 * u, mv);
      ctx.fillStyle = '#F7931E'; circle(ctx, x1, cy, 46 * u * sz(r, 'A')); circle(ctx, x2, cy, 46 * u * sz(r, 'B'));
      lab(ctx, th, 'A', x1, cy + 240 * u, u); lab(ctx, th, 'B', x2, cy + 240 * u, u);
      if (gd > 0) withAlpha(ctx, gd, () => { dashLine(ctx, x1 - 100 * u, cy - 46 * u, x2 + 100 * u, cy - 46 * u, u, th.accent); dashLine(ctx, x1 - 100 * u, cy + 46 * u, x2 + 100 * u, cy + 46 * u, u, th.accent); });
    },
  },
  hering: {
    q: 'Are the red lines straight?', yn: true, truth: 'Totally straight!', no: 'Nope, they’re curved! 😮',
    draw(ctx, R, th, ph, t, r) {
      const u = R.w / 820; stage(ctx, R, th, u);
      ctx.save(); rr(ctx, R.x, R.y, R.w, R.h, 40 * u); ctx.clip();
      const cx = R.x + R.w / 2, cy = R.y + R.h / 2, ra = ph === 'reveal' ? 1 - eInOut(clamp((t - 0.1) / 0.8)) : 1;
      withAlpha(ctx, ra * 0.75, () => {
        ctx.strokeStyle = th.ink; ctx.lineWidth = 3.2 * u;
        for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; line(ctx, cx, cy, cx + Math.cos(a) * 900 * u, cy + Math.sin(a) * 900 * u); }
      });
      ctx.strokeStyle = '#E8392F'; ctx.lineWidth = 13 * u; ctx.lineCap = 'butt';
      const bow = r && r.res !== 'same' ? (r.res === 'A' ? -1 : 1) * 2 * 30 * u : 0, y0 = R.y + 40 * u, y1 = R.y + R.h - 40 * u;
      [-150, 150].forEach(dx => { ctx.beginPath(); ctx.moveTo(cx + dx * u, y0); ctx.quadraticCurveTo(cx + dx * u + Math.sign(dx) * bow, cy, cx + dx * u, y1); ctx.stroke(); });
      ctx.restore();
    },
  },
};
const illTruth = r => { const il = ILL[r.il]; return r.res === 'same' ? il.truth : il.yn ? il.no : `${r.res} is ${il.word}! 😮`; };
const ILL_ORDER = ['ebbinghaus', 'mullerlyer', 'contrast', 'vh', 'ponzo', 'jastrow', 'cafewall', 'hering', 'poggendorff', 'zollner', 'delboeuf'];
defineTest({
  id: 'illusion', name: 'Mind Tricks', tag: 'Illusions', eyebrow: 'Illusion test',
  blurb: 'Classic optical illusions. Viewers pick an answer, then the reveal proves their brain wrong.',
  defaults: { rounds: 5, seconds: 5 }, roundsRange: [3, 10],
  hooks: ['Don’t trust your eyes 🤯', 'Your brain is lying to you', '{N} illusions that fool almost everyone', 'Which one is bigger? Think twice'],
  shared: vr => ({ order: rShuffle(vr, ILL_ORDER.slice()), res: [...rShuffle(vr, ['same', 'A', 'B']), ...rShuffle(vr, ['same', 'A', 'B', 'same', 'A', 'B', 'same', 'A'])] }),
  gen(rng, i, N, diff, sh) {
    const id = sh.order[i % sh.order.length], il = ILL[id], res = sh.res[i % sh.res.length], d = 0.12 + rng() * 0.04;
    const labels = il.yn ? ['Yes', 'No'] : ['A', 'B', 'Same'], ans = il.yn ? (res === 'same' ? 0 : 1) : res === 'A' ? 0 : res === 'B' ? 1 : 2;
    return { il: id, res, d, options: labels.map((l, j) => ({ label: l, correct: j === ans })) };
  },
  phases: (r, cfg) => qr(cfg, 2.8),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Illusion ${r.i + 1} / ${tl.N}`, title: ILL[r.il].q } : { eyebrow: 'The truth', title: illTruth(r) }),
  bottom: r => ({ options: r.options, since: 'q' }),
  draw: (ctx, r, s) => ILL[r.il].draw(ctx, s.rect, s.th, s.phase, s.local, r),
  art: (ctx, R, tl) => ILL[tl.rounds[0].il].draw(ctx, R, tl.theme, 'art', 0, tl.rounds[0]),
  outro: {
    title: 'How many fooled you?', cta: 'Comment how many got you 👇', note: 'Your brain fills the gaps. That’s normal!',
    tiers: N => { const h = Math.max(1, Math.floor(N / 2)); return [{ range: '0', label: 'Unfoolable 🧠', top: true }, { range: rangeLabel(1, h), label: 'Sharp mind 👀' }, { range: `${h + 1}+`, label: 'Brain tricked 🤯' }]; },
  },
  introChip: tl => `${tl.N} illusions · ${tl.cfg.seconds} sec each`,
});

// ---------------------------------------------------------------------
// 5. Memory Grid
// ---------------------------------------------------------------------
const MEM_POOL = ['🍕', '🍔', '🌮', '🍩', '🍓', '🍉', '🍋', '🥑', '🌵', '🌻', '🍄', '🐙', '🦊', '🐸', '🐼', '🐧', '🦄', '🐝', '🚀', '⚽', '🎸', '🎈', '🎁', '⏰', '🔑', '💎', '🌈', '⭐', '🌙', '☂️', '🧊', '🍦', '🧁', '🍒', '🎲', '🧩', '📷', '🐢', '🦋', '🍪'];
const MEM_LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ'.split('');
function drawMemory(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, n = r.n, gap = 18 * u, cell = (R.w - gap * (n - 1)) / n, rad = 28 * u, ph = s.phase;
  for (let k = 0; k < n * n; k++) {
    const x = R.x + (k % n) * (cell + gap), y = R.y + Math.floor(k / n) * (cell + gap), cx = x + cell / 2, cy = y + cell / 2;
    let flip = 0;
    if (ph === 'q') flip = clamp((s.local - k * 0.015) / 0.4);
    else if (ph === 'reveal') flip = k === r.target ? 1 - clamp(s.local / 0.4) : 1;
    const sx = Math.max(0.02, Math.abs(Math.cos(flip * Math.PI)));
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, 1); ctx.translate(-cx, -cy);
    if (flip > 0.5) {
      fillRR(ctx, x, y, cell, cell, rad, th.ink);
      setFont(ctx, 800, cell * 0.44, th.fam); ctx.fillStyle = th.card; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', cx, cy + cell * 0.03); ctx.textBaseline = 'alphabetic';
    } else {
      shadowRR(ctx, x, y, cell, cell, rad, th.card, th.shadow, 18 * u, 6 * u);
      if (r.kind === 'emoji') drawEmoji(ctx, r.items[k], cx, cy, cell * 0.56);
      else { setFont(ctx, 800, cell * (r.kind === 'num' ? 0.42 : 0.52), th.fam); ctx.fillStyle = th.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(r.items[k], cx, cy + cell * 0.03); ctx.textBaseline = 'alphabetic'; }
    }
    ctx.restore();
    if ((ph === 'q' || ph === 'reveal') && k === r.target) {
      const a = ph === 'q' ? clamp((s.local - 0.35) / 0.2) * lerp(0.55, 1, 0.5 + 0.5 * Math.sin(s.t * 7)) : 1, pad = 9 * u;
      withAlpha(ctx, a, () => { ctx.lineWidth = 11 * u; ctx.strokeStyle = ph === 'reveal' ? th.ok : th.accent; rr(ctx, x - pad, y - pad, cell + pad * 2, cell + pad * 2, rad + pad); ctx.stroke(); });
    }
  }
}
defineTest({
  id: 'memory', name: 'Memory Grid', tag: 'Memory', eyebrow: 'Memory test',
  blurb: 'A grid flashes up, the tiles flip over and one starts to glow. Which emoji, number or letter was hiding there?',
  options: [{ id: 'tiles', label: 'Tiles', choices: [['emoji', 'Emoji'], ['num', 'Numbers'], ['letter', 'Letters']] }],
  defaults: { rounds: 5, seconds: 4 }, roundsRange: [3, 8],
  hooks: ['Test your memory 🧠', 'Remember the grid… if you can', 'Goldfish or genius? 🐟', 'What was in the box? Most people forget'],
  gen(rng, i, N, diff, sh, opts) {
    const f = fOf(i, N), kk = { easy: [3, 3], medium: [3, 4], hard: [3, 4], expert: [4, 4] }[diff], n = Math.round(lerp(kk[0], kk[1], f)), cells = n * n;
    const kind = (opts && opts.tiles) || 'emoji', pool = kind === 'num' ? Array.from({ length: 89 }, (_, q) => String(q + 11)) : kind === 'letter' ? MEM_LETTERS : MEM_POOL;
    const items = rShuffle(rng, pool.slice()).slice(0, cells), target = Math.floor(rng() * cells);
    const others = rShuffle(rng, items.filter((_, j) => j !== target)).slice(0, 3);
    const options = rShuffle(rng, [items[target], ...others]).map(e => ({ label: e, correct: e === items[target] }));
    return { n, kind, items, target, options, mem: { easy: 4, medium: 3, hard: 2.5, expert: 2.5 }[diff] + (n === 4 ? 1 : 0) };
  },
  phases: (r, cfg) => [{ kind: 'mem', dur: r.mem, timer: true, mode: 'mem', ticks: false }, { kind: 'q', dur: cfg.seconds, timer: true }, { kind: 'reveal', dur: 2.0 }],
  header: (r, ph, tl) => (ph === 'mem' ? { eyebrow: `Round ${r.i + 1} / ${tl.N} · memorize`, title: 'Memorize the grid 🧠' } : ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: 'What was in the glowing tile?' } : { eyebrow: 'It was', title: r.items[r.target] }),
  bottom: (r, ph) => (ph === 'mem' ? null : { options: r.options, since: 'q', emoji: r.kind === 'emoji' }),
  cues: (r, seg) => (seg.phase === 'q' ? [{ t: 0.02, s: 'flip' }] : seg.phase === 'reveal' ? [{ t: 0.0, s: 'flip' }] : null),
  draw: (ctx, r, s) => drawMemory(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawMemory(ctx, tl.rounds[0], R, { phase: 'mem', local: 9, th: tl.theme, t: 0 }),
  outro: { title: 'How many did you remember?', labels: ['Photographic memory 📸', 'Great memory 🧠', 'Pretty average 🙂', 'Goldfish mode 🐟'] },
  introChip: tl => `${tl.N} rounds · memorize, then answer`,
});

// ---------------------------------------------------------------------
// 6. Color Words (Stroop)
// ---------------------------------------------------------------------
const STROOP = [['RED', '#FF3B30'], ['BLUE', '#2F7BFF'], ['GREEN', '#22C55E'], ['YELLOW', '#FFD000'], ['PURPLE', '#A855F7'], ['ORANGE', '#FF8A00'], ['PINK', '#FF5FB0']];
function drawStroop(ctx, r, R, s) {
  const u = R.w / 820, th = s.th;
  stage(ctx, R, th, u, '#111318');
  const pad = 40 * u, cw = (R.w - pad * 2) / r.cols, ch = (R.h - pad * 2) / r.rows;
  setFont(measureCtx, 800, 100, th.fam);
  const wMax = Math.max(...STROOP.map(c => measureCtx.measureText(c[0]).width));
  const size = Math.min(ch * 0.46, (100 * (cw * 0.84)) / wMax);
  setFont(ctx, 800, size, th.fam); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  r.words.forEach((w, j) => {
    const cx = R.x + pad + ((j % r.cols) + 0.5) * cw, cy = R.y + pad + (Math.floor(j / r.cols) + 0.5) * ch;
    let sy = 1, txt = w.w;
    if (s.phase === 'reveal') { const pj = clamp((s.local - 0.1 - j * 0.035) / 0.3); sy = Math.abs(Math.cos(pj * Math.PI)); if (pj > 0.5) txt = w.name; }
    ctx.fillStyle = w.ink;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, Math.max(0.03, sy)); ctx.fillText(txt, 0, size * 0.04); ctx.restore();
  });
  ctx.textBaseline = 'alphabetic';
}
defineTest({
  id: 'stroop', name: 'Color Words', tag: 'Brain', eyebrow: 'Brain test',
  blurb: 'Say the ink color out loud, not the word. Each level adds words. The reveal shows the right answers.',
  defaults: { rounds: 4, seconds: 8 }, roundsRange: [2, 6],
  hooks: ['Say the COLOR, not the word 🎨', 'Your brain will glitch 😵‍💫', 'Most people fail level 3', 'Read the colors out loud. Fast.'],
  gen(rng, i, N, diff) {
    const cols = STROOP.slice(0, { easy: 4, medium: 5, hard: 6, expert: 7 }[diff]);
    const L = [[2, 3], [3, 3], [3, 4], [4, 4], [4, 5], [4, 6]][Math.min(5, i + (diff === 'expert' ? 1 : 0))];
    const words = []; let prevInk = null, prevWord = null;
    for (let j = 0; j < L[0] * L[1]; j++) {
      let w, c, guard = 0;
      do { w = rPick(rng, cols); c = rPick(rng, cols); guard++; } while ((w === c || c === prevInk || w === prevWord) && guard < 80);
      words.push({ w: w[0], ink: c[1], name: c[0] }); prevInk = c; prevWord = w;
    }
    return { cols: L[0], rows: L[1], words };
  },
  phases: (r, cfg) => qr(cfg, 2.4),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Level ${r.i + 1} / ${tl.N}`, title: 'Say the COLOR, not the word!' } : { eyebrow: 'Answers', title: 'How fast were you?' }),
  bottom: (r, ph) => (ph === 'reveal' ? { pill: 'No mistakes? 🧠' } : null),
  draw: (ctx, r, s) => drawStroop(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawStroop(ctx, tl.rounds[0], R, { phase: 'art', local: 0, th: tl.theme }),
  outro: { title: 'How many levels did you pass?', labels: ['Brain of steel 🧠', 'Impressive focus 🎯', 'Brain lag 😵', 'Brain.exe crashed 💥'], cta: 'Comment your level 👇' },
  introChip: tl => `${tl.N} levels · ${tl.cfg.seconds} sec each`,
});

// ---------------------------------------------------------------------
// 7. Spot the Difference
// ---------------------------------------------------------------------
const SCENES = [
  { bg: ['#E6F7DE', '#BCE2A6'], items: ['🌻', '🌷', '🍄', '🐝', '🦋', '🐞', '🌿', '🐌', '🌼', '🐛', '🍀', '🌳'] },
  { bg: ['#D6F2FF', '#8ACDF1'], items: ['🐠', '🐟', '🐙', '🦀', '🐚', '🐬', '🐳', '🦑', '🐡', '🦞', '⚓', '🌊'] },
  { bg: ['#FFF4E2', '#FFD6A3'], items: ['🍓', '🍋', '🥑', '🍩', '🧁', '🍪', '🍎', '🥐', '🍉', '🍒', '🥨', '🧃'] },
  { bg: ['#30357A', '#151838'], items: ['🚀', '🪐', '⭐', '🌙', '👽', '🛸', '☄️', '🌍', '🌟', '🛰️', '🌕', '✨'] },
  { bg: ['#EAF4FF', '#BFD9F2'], items: ['⛄', '🧣', '🎿', '🧤', '🌲', '❄️', '🦌', '🎁', '🏂', '🐧', '🧊', '🎄'] },
  { bg: ['#D9F5D0', '#8FD08A'], items: ['🐒', '🦜', '🐍', '🐘', '🦁', '🌴', '🍌', '🐅', '🦧', '🌺', '🐊', '🦎'] },
  { bg: ['#EEF0F7', '#C5CCE0'], items: ['🚕', '🚌', '🚲', '🏢', '🚦', '🛴', '🌆', '🚑', '🏙️', '🚓', '🛵', '🚧'] },
  { bg: ['#E4F7E8', '#A9DDB6'], items: ['⚽', '🏀', '🏈', '🎾', '🏐', '🥊', '⛳', '🏓', '🏆', '🥇', '🏸', '🛹'] },
  { bg: ['#F1E5FF', '#CDB4F2'], items: ['🎸', '🎹', '🥁', '🎺', '🎻', '🎤', '🎧', '🎷', '🎵', '🎶', '🎼', '📻'] },
  { bg: ['#FFF0D2', '#F5CE8B'], items: ['🐪', '🌵', '🦂', '☀️', '🏜️', '🐍', '🦎', '🌴', '🏺', '⛺', '🦅', '🧭'] },
  { bg: ['#3A2A5C', '#1B1233'], items: ['🎃', '👻', '🦇', '🕷️', '🕸️', '🧙', '🍬', '💀', '🌙', '🧛', '🍭', '🔮'] },
  { bg: ['#FFE6F3', '#FFC1E0'], items: ['🎈', '🎉', '🎁', '🎂', '🧁', '🎊', '🍭', '🍬', '🎀', '🥳', '🎵', '🍕'] },
  { bg: ['#F8F3D2', '#D9E8A4'], items: ['🐄', '🐖', '🐑', '🐔', '🐴', '🌽', '🚜', '🥕', '🐓', '🐇', '🌾', '🐐'] },
];
const SYMMETRIC = new Set(['❄️', '🏀', '⚽', '🎾', '🏐', '🌼', '🌻', '⭐', '🌟', '✨', '🍩', '🌕', '🍪', '🎊', '🍭', '🌍', '🍀', '🎁', '🧁', '🎂', '🐞']);
function placeItems(rng, n, Wp, Hp, smin, smax, existing = []) {
  const out = [];
  for (let tries = 0; out.length < n && tries < 5000; tries++) {
    const s = lerp(smin, smax, rng()), m = s * 0.6, x = lerp(m, Wp - m, rng()), y = lerp(m, Hp - m, rng());
    let ok = true;
    for (const o of existing) if (Math.hypot(o.x - x, o.y - y) < (o.s + s) * 0.48) { ok = false; break; }
    if (ok) for (const o of out) if (Math.hypot(o.x - x, o.y - y) < (o.s + s) * 0.48) { ok = false; break; }
    if (ok) out.push({ x, y, s, rot: (rng() - 0.5) * 0.7 });
  }
  return out;
}
function drawSpot(ctx, r, R, s) {
  const u = R.w / 820, pH = 400 * u, gap = R.h - pH * 2;
  const P = [{ y: R.y, items: r.A }, { y: R.y + pH + gap, items: r.B }];
  for (const p of P) {
    shadowRR(ctx, R.x, p.y, R.w, pH, 30 * u, r.scene.bg[1], s.th.shadow, 24 * u, 8 * u);
    ctx.save(); rr(ctx, R.x, p.y, R.w, pH, 30 * u); ctx.clip();
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + pH); g.addColorStop(0, r.scene.bg[0]); g.addColorStop(1, r.scene.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(R.x, p.y, R.w, pH);
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.ellipse(R.x + R.w / 2, p.y + pH * 1.02, R.w * 0.7, pH * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    for (const it of p.items) if (!it.hidden) drawEmoji(ctx, it.e, R.x + it.x * u, p.y + it.y * u, it.s * u, 1, it.rot, it.flip);
    ctx.restore();
  }
  if (s.phase === 'reveal') r.diffs.forEach((d, j) => {
    const a = clamp((s.local - 0.15 - j * 0.3) / 0.3); if (a <= 0) return;
    const rad = d.r * u * lerp(1.7, 1, eBack(a));
    for (const p of P) withAlpha(ctx, clamp(a * 2), () => {
      ctx.beginPath(); ctx.arc(R.x + d.x * u, p.y + d.y * u, rad, 0, Math.PI * 2);
      ctx.lineWidth = 16 * u; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
      ctx.lineWidth = 8 * u; ctx.strokeStyle = s.th.accent; ctx.stroke();
    });
  });
}
const spotK = d => ({ easy: 3, medium: 3, hard: 4, expert: 5 }[d]);
defineTest({
  id: 'spotdiff', name: 'Spot the Difference', tag: 'Attention', eyebrow: 'Attention test',
  blurb: 'Two scenes with a few sneaky changes. Rings pop on every difference at the reveal.',
  defaults: { rounds: 3, seconds: 12 }, roundsRange: [1, 6],
  kFor: cfg => spotK(cfg.difficulty),
  hooks: ['Find {K} differences in {S} seconds 🔍', 'Can you spot them all?', 'Only 1 in 10 finds every difference', 'How fast are your eyes?'],
  shared: vr => ({ order: rShuffle(vr, SCENES.map((_, i) => i)) }),
  gen(rng, i, N, diff, sh) {
    const scene = SCENES[sh.order[i % SCENES.length]], k = spotK(diff), n = { easy: 9, medium: 11, hard: 13, expert: 15 }[diff];
    const sz = { easy: [88, 112], medium: [80, 104], hard: [72, 96], expert: [66, 90] }[diff];
    const A = placeItems(rng, n, 820, 400, sz[0], sz[1]).map(it => ({ ...it, e: rPick(rng, scene.items) }));
    const B = A.map(it => ({ ...it }));
    const types = { easy: ['missing', 'swap', 'extra', 'swap'], medium: ['missing', 'swap', 'size', 'rotate', 'extra'], hard: ['missing', 'swap', 'size', 'rotate', 'flip', 'shift'], expert: ['swap', 'size', 'rotate', 'flip', 'shift', 'missing'] }[diff];
    const picks = rShuffle(rng, A.map((_, j) => j)).slice(0, k), diffs = [], tOff = Math.floor(rng() * types.length);
    picks.forEach((j, q) => {
      let type = types[(q + tOff) % types.length];
      const it = B[j];
      if ((type === 'rotate' || type === 'flip') && SYMMETRIC.has(it.e)) type = 'swap';
      if (type === 'extra') {
        const ex = placeItems(rng, 1, 820, 400, sz[0], sz[1], B)[0];
        if (ex) { B.push({ ...ex, e: rPick(rng, scene.items) }); diffs.push({ x: ex.x, y: ex.y, r: ex.s * 0.66 }); return; }
        type = 'swap';
      }
      if (type === 'missing') it.hidden = true;
      else if (type === 'swap') { let e, g = 0; do { e = rPick(rng, scene.items); g++; } while (e === it.e && g < 30); it.e = e; }
      else if (type === 'size') it.s *= 0.6;
      else if (type === 'rotate') it.rot += (rng() < 0.5 ? -1 : 1) * (diff === 'expert' ? 0.75 : 1.3);
      else if (type === 'flip') it.flip = !it.flip;
      else if (type === 'shift') it.x = clamp(it.x + (rng() < 0.5 ? -1 : 1) * 40, it.s * 0.6, 820 - it.s * 0.6);
      diffs.push({ x: (A[j].x + it.x) / 2, y: it.y, r: Math.max(A[j].s, it.s) * 0.66 + Math.abs(A[j].x - it.x) / 2 });
    });
    return { scene, A, B, diffs, k: diffs.length };
  },
  phases: (r, cfg) => [{ kind: 'q', dur: cfg.seconds, timer: true }, { kind: 'reveal', dur: 1.6 + 0.3 * r.k }],
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: `Find ${r.k} differences` } : { eyebrow: 'Answers', title: `All ${r.k} differences` }),
  bottom: (r, ph) => (ph === 'reveal' ? { pill: `Did you get all ${r.k}?` } : null),
  cues: (r, seg) => (seg.phase === 'reveal' ? r.diffs.map((_, j) => ({ t: 0.15 + j * 0.3, s: 'pop' })) : null),
  draw: (ctx, r, s) => drawSpot(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawSpot(ctx, tl.rounds[0], R, { phase: 'art', local: 0, th: tl.theme }),
  outro: { title: 'How many rounds did you ace?', labels: ['Detective level 🕵️', 'Sharp-eyed 👀', 'Not bad 🙂', 'Look closer 🔍'] },
});

// ---------------------------------------------------------------------
// 8. Quick Math
// ---------------------------------------------------------------------
const fmtNum = v => (v < 0 ? '−' + Math.abs(v) : String(v));
const MATH_CLASSICS = [
  ['3 − 3 × 6 + 2', -13, [2, -16], '× first: 3 − 18 + 2'],
  ['9 − 3 ÷ ⅓ + 1', 1, [19, 3], '3 ÷ ⅓ = 9, so 9 − 9 + 1'],
  ['6 + 6 × 6 − 6', 36, [66, 42], '6 + 36 − 6'],
  ['50 + 50 − 25 × 0 + 2 + 2', 104, [4, 79], '25 × 0 = 0 comes first'],
  ['2 + 2 × 2 − 2', 4, [6, 2], '2 + 4 − 2'],
  ['8 ÷ 2 × 4', 16, [1, 4], '÷ and × go left to right'],
  ['7 + 7 ÷ 7 + 7 × 7 − 7', 50, [56, 63], '7 + 1 + 49 − 7'],
  ['1 + 1 + 1 + 1 × 0', 3, [0, 4], '1 × 0 = 0 comes first'],
  ['10 − 10 × 10 + 10', -80, [10, 0], '10 − 100 + 10'],
  ['4² ÷ 2 × 4', 32, [2, 8], '16 ÷ 2 × 4, left to right'],
  ['2 + 2 × 0 + 2', 4, [2, 6], '2 × 0 = 0 comes first'],
  ['1 + 2 × 3 − 4 ÷ 2', 5, [7, 3], '1 + 6 − 2'],
  ['5 + 5 ÷ 5 + 5', 11, [7, 6], '5 ÷ 5 = 1 comes first'],
  ['3 × 3 − 3 ÷ 3', 8, [2, 6], '9 − 1'],
  ['10 − 2 × 3 + 4', 8, [28, 12], '10 − 6 + 4'],
  ['12 ÷ 3 + 3 × 2', 10, [14, 4], '4 + 6'],
  ['2 × 5 + 5 × 2', 20, [30, 24], '10 + 10'],
  ['100 − 10 × 5 + 5', 55, [455, 50], '100 − 50 + 5'],
  ['6 − 2 × 3 + 2', 2, [14, 0], '6 − 6 + 2'],
  ['4 + 4 ÷ 4 × 4', 8, [5, 12], '4 ÷ 4 × 4 = 4, left to right'],
];
const mathLevel = (diff, f) => (diff === 'easy' ? (f < 0.6 ? 1 : 2) : diff === 'medium' ? (f < 0.34 ? 1 : f < 0.67 ? 2 : 3) : diff === 'hard' ? (f < 0.4 ? 2 : f < 0.8 ? 3 : 4) : f < 0.5 ? 3 : 4);
function mathQ(rng, level, classic) {
  const R = (a, b) => rInt(rng, a, b), t = R(0, level === 1 ? 5 : 3);
  let expr, ans, wrong, why = '';
  if (level === 1) {
    if (t === 0) { const a = R(12, 49), b = R(12, 49); expr = `${a} + ${b}`; ans = a + b; wrong = [ans + 10, ans - 1]; }
    else if (t === 1) { const a = R(41, 95), b = R(12, 39); expr = `${a} − ${b}`; ans = a - b; wrong = [ans + 10, ans - 2]; }
    else if (t === 2) { const a = R(3, 9), b = R(4, 9); expr = `${a} × ${b}`; ans = a * b; wrong = [ans + a, ans - b]; }
    else if (t === 3) { const b = R(3, 9), q = R(3, 12); expr = `${b * q} ÷ ${b}`; ans = q; wrong = [q + 1, q + b]; }
    else if (t === 4) { const a = R(12, 49); expr = `${a} × 11`; ans = a * 11; wrong = [a * 10, ans + 10]; }
    else { const a = R(30, 70), b = R(11, 29), c = R(5, 19); expr = `${a} + ${b} − ${c}`; ans = a + b - c; wrong = [a + b + c, ans + 10]; }
  } else if (level === 2) {
    if (t === 0) { const a = R(2, 9), b = R(2, 9), c = R(3, 9); expr = `${a} + ${b} × ${c}`; ans = a + b * c; wrong = [(a + b) * c, ans + 2]; why = '× comes before +'; }
    else if (t === 1) { const a = R(20, 40), b = R(2, 5), c = R(2, 6); expr = `${a} − ${b} × ${c}`; ans = a - b * c; wrong = [(a - b) * c, ans - 1]; why = '× comes before −'; }
    else if (t === 2) { const c = R(2, 6), sum = c * R(3, 9), a = R(1, sum - 1), b = sum - a; expr = `(${a} + ${b}) ÷ ${c}`; ans = sum / c; wrong = [ans + c, ans * 2]; why = 'Brackets first'; }
    else { const a = R(3, 9), b = R(2, 19); expr = `${a}² + ${b}`; ans = a * a + b; wrong = [2 * a + b, ans + a]; why = `${a}² means ${a} × ${a}`; }
  } else if (level === 3) {
    if (t === 0) { const c = R(2, 5), b = c * R(2, 6), a = R(10, 30), d = R(2, 9), lr = (a - b) / c + d; expr = `${a} − ${b} ÷ ${c} + ${d}`; ans = a - b / c + d; wrong = [Number.isInteger(lr) ? lr : ans + 3, ans - 2]; why = '÷ comes before + and −'; }
    else if (t === 1) { const p = rPick(rng, [10, 20, 25, 50, 75]), n = rPick(rng, [40, 60, 80, 120, 160, 200, 240]); expr = `${p}% of ${n}`; ans = (p * n) / 100; wrong = [ans * 2, ans + 10]; why = `${p}% means ${p} ÷ 100`; }
    else if (t === 2) { const a = R(2, 6), b = R(6, 12), c = R(1, 5), d = R(1, 9); expr = `${a} × (${b} − ${c}) + ${d}`; ans = a * (b - c) + d; wrong = [a * b - c + d, ans + a]; why = 'Brackets, then ×, then +'; }
    else { const a = R(6, 12), b = R(2, a - 2); expr = `${a}² − ${b}²`; ans = a * a - b * b; wrong = [(a - b) * (a - b), ans + 2 * b]; why = `${a * a} − ${b * b}`; }
  } else {
    const C = MATH_CLASSICS[classic % MATH_CLASSICS.length]; expr = C[0]; ans = C[1]; wrong = C[2].slice(); why = C[3];
  }
  const vals = [ans];
  for (let w of wrong) { while (vals.includes(w)) w += 1; vals.push(w); }
  return { expr, ans, why, options: rShuffle(rng, vals).map(v => ({ label: fmtNum(v), correct: v === ans })) };
}
function drawMath(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, reveal = s.phase === 'reveal', rp = reveal ? eOut(clamp(s.local / 0.35)) : 0;
  stage(ctx, R, th, u);
  const cxm = R.x + R.w / 2, cy = R.y + 240 * u, ansTxt = fmtNum(r.ans);
  const f = fitText(measureCtx, `${r.expr} = ${ansTxt.length > 1 ? ansTxt : ansTxt + '0'}`, { maxW: Math.round(R.w - 100 * u), maxH: Math.round(150 * u), maxLines: 1, max: Math.round(124 * u), min: Math.max(8, Math.round(40 * u)), weight: 800, fam: th.fam, lh: 1.05 });
  setFont(ctx, 800, f.size, th.fam);
  const pre = `${r.expr} = `, wPre = ctx.measureText(pre).width, wQ = ctx.measureText('?').width, wA = ctx.measureText(ansTxt).width;
  const x0 = cxm - (wPre + Math.max(wQ, wA)) / 2, base = cy + f.size * 0.34;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = th.ink; ctx.fillText(pre, x0, base);
  if (reveal) {
    ctx.save(); scaleAround(ctx, x0 + wPre + wA / 2, cy, lerp(1.5, 1, eBack(clamp(s.local / 0.4)))); ctx.fillStyle = th.ok; ctx.fillText(ansTxt, x0 + wPre, base); ctx.restore();
  } else { ctx.fillStyle = th.accent; ctx.fillText('?', x0 + wPre, base); }
  ctx.textAlign = 'center';
  if (reveal && r.why) withAlpha(ctx, rp, () => { setFont(ctx, 600, 40 * u, th.fam); ctx.fillStyle = th.sub; ctx.fillText(r.why, cxm, R.y + 400 * u); });
  const n = r.options.length, gx = 24 * u, cw = (R.w - 100 * u - gx * (n - 1)) / n, top = R.y + 500 * u, hh = 230 * u;
  const appear = s.phase === 'q' ? clamp(s.local / 0.45) : 1;
  r.options.forEach((o, j) => {
    const a = s.phase === 'art' ? 1 : clamp(appear * 1.7 - j * 0.18); if (a <= 0) return;
    const x = R.x + 50 * u + j * (cw + gx), win = reveal && o.correct;
    ctx.save(); scaleAround(ctx, x + cw / 2, top + hh / 2, lerp(0.6, 1, eBack(a)) * (win ? lerp(1, 1.05, rp) : 1));
    ctx.globalAlpha *= clamp(a * 1.5) * (reveal && !o.correct ? lerp(1, 0.3, rp) : 1);
    fillRR(ctx, x, top, cw, hh, 34 * u, th.bg[0]);
    ctx.lineWidth = 3 * u; ctx.strokeStyle = th.track; rr(ctx, x, top, cw, hh, 34 * u); ctx.stroke();
    if (win) withAlpha(ctx, rp, () => fillRR(ctx, x, top, cw, hh, 34 * u, th.ok));
    const ink = win && rp > 0.5 ? th.okInk : th.ink;
    setFont(ctx, 700, 30 * u, FAM.mono); ctx.fillStyle = win && rp > 0.5 ? th.okInk : th.sub; ctx.textAlign = 'left';
    ctx.fillText('ABC'[j] + (win && rp > 0.5 ? ' ✓' : ''), x + 24 * u, top + 52 * u);
    const lf = fitText(measureCtx, o.label, { maxW: Math.round(cw - 30 * u), maxH: Math.round(110 * u), maxLines: 1, max: Math.round(84 * u), min: Math.max(8, Math.round(36 * u)), weight: 800, fam: th.fam, lh: 1 });
    setFont(ctx, 800, lf.size, th.fam); ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.label, x + cw / 2, top + hh * 0.58); ctx.textBaseline = 'alphabetic';
    ctx.restore();
  });
}
defineTest({
  id: 'math', name: 'Quick Math', tag: 'Logic', eyebrow: 'Math test',
  blurb: 'Fast mental math with order-of-operations traps. Later rounds use the viral ones people argue about.',
  defaults: { rounds: 6, seconds: 5 }, roundsRange: [3, 10],
  hooks: ['Solve these in {S} seconds ⏱️', 'Most people get the last one wrong', 'Quick math test 🧮', 'Can you beat the timer?'],
  shared: vr => ({ classics: rShuffle(vr, MATH_CLASSICS.map((_, i) => i)) }),
  options: [{ id: 'focus', label: 'Focus', choices: [['mixed', 'Mixed'], ['quick', 'Quick math'], ['traps', 'Viral traps']] }],
  gen: (rng, i, N, diff, sh, opts) => {
    const f = fOf(i, N), focus = (opts && opts.focus) || 'mixed';
    const level = focus === 'traps' ? 4 : focus === 'quick' ? (diff === 'easy' ? 1 : diff === 'medium' ? (f < 0.5 ? 1 : 2) : f < 0.3 ? 1 : 2) : mathLevel(diff, f);
    return mathQ(rng, level, sh.classics[i % sh.classics.length]);
  },
  phases: (r, cfg) => qr(cfg, 2.3),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: 'Quick! What’s the answer?' } : { eyebrow: 'Answer', title: `= ${fmtNum(r.ans)}` }),
  bottom: (r, ph) => (ph === 'reveal' ? { pill: 'Did you get it right?' } : null),
  draw: (ctx, r, s) => drawMath(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawMath(ctx, tl.rounds[0], R, { phase: 'art', local: 0, th: tl.theme }),
  outro: { title: 'How many did you get right?', labels: ['Human calculator 🤖', 'Math whiz ✏️', 'Solid 👍', 'Calculator needed 📱'] },
});

// ---------------------------------------------------------------------
// 9. Quick Count
// ---------------------------------------------------------------------
const SHAPES = ['circle', 'square', 'triangle', 'star'];
const SHAPE_NAME = { circle: 'circles', square: 'squares', triangle: 'triangles', star: 'stars' };
const CCOL = [['red', '#FF4D4F'], ['blue', '#3B82F6'], ['yellow', '#FFC21A'], ['green', '#22C55E']];
function drawShape(ctx, kind, x, y, size, rot, color) {
  const h = size / 2;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineJoin = 'round';
  if (kind === 'circle') circle(ctx, 0, 0, h * 0.92);
  else if (kind === 'square') { rr(ctx, -h * 0.8, -h * 0.8, h * 1.6, h * 1.6, h * 0.2); ctx.fill(); }
  else if (kind === 'triangle') { ctx.beginPath(); ctx.moveTo(0, -h * 0.92); ctx.lineTo(h * 0.95, h * 0.72); ctx.lineTo(-h * 0.95, h * 0.72); ctx.closePath(); ctx.lineWidth = h * 0.16; ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rad = k % 2 ? h * 0.44 : h; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } ctx.closePath(); ctx.lineWidth = h * 0.08; ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
const EMO_SETS = [['🍎', '🍌', '🍇', '🍓'], ['🐶', '🐱', '🐸', '🐼'], ['⭐', '🌙', '☁️', '🔥'], ['⚽', '🏀', '🎾', '🏈'], ['🚗', '🚀', '🚲', '🚁'], ['🍕', '🍔', '🌮', '🍩']];
const countWhat = r => (r.emoji ? r.shape : `${r.col ? r.col[0] + ' ' : ''}${SHAPE_NAME[r.shape]}`);
function drawCount(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase, ox = R.x + 30 * u, oy = R.y + 30 * u;
  stage(ctx, R, th, u);
  const drawAll = fa => r.items.forEach((it, j) => { const a = fa(it, j); if (a > 0.002) withAlpha(ctx, a, () => (r.emoji ? drawEmoji(ctx, it.shape, ox + it.x * u, oy + it.y * u, it.s * u * 0.92, 1, it.rot) : drawShape(ctx, it.shape, ox + it.x * u, oy + it.y * u, it.s * u * 0.86, it.rot, it.col[1]))); });
  if (ph === 'flash' || ph === 'art') drawAll((it, j) => (ph === 'art' ? 1 : clamp((s.local - j * 0.01) / 0.18)));
  else if (ph === 'q') {
    const v = 1 - clamp(s.local / 0.16);
    if (v > 0) drawAll(() => v);
    const a = clamp((s.local - 0.12) / 0.4);
    if (a > 0) {
      ctx.save(); scaleAround(ctx, R.x + R.w / 2, R.y + R.h / 2, eBack(a)); ctx.globalAlpha *= clamp(a * 2);
      if (r.emoji) drawEmoji(ctx, r.shape, R.x + R.w / 2 - 120 * u, R.y + R.h / 2, 250 * u); else drawShape(ctx, r.shape, R.x + R.w / 2 - 120 * u, R.y + R.h / 2, 250 * u, 0, r.col ? r.col[1] : th.ink);
      setFont(ctx, 800, 300 * u, th.fam); ctx.fillStyle = th.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', R.x + R.w / 2 + 140 * u, R.y + R.h / 2 + 12 * u); ctx.textBaseline = 'alphabetic';
      ctx.restore();
    }
  } else if (ph === 'reveal') {
    const a = eOut(clamp(s.local / 0.25));
    drawAll(it => (it.target ? a : a * 0.15));
    for (const it of r.items) {
      if (!it.target) continue;
      const b = clamp((s.local - 0.3 - (it.n - 1) * 0.15) / 0.2); if (b <= 0) continue;
      const bx = ox + it.x * u + it.s * u * 0.34, by = oy + it.y * u - it.s * u * 0.34;
      ctx.save(); scaleAround(ctx, bx, by, eBack(b));
      ctx.fillStyle = th.ink; circle(ctx, bx, by, 27 * u);
      setFont(ctx, 700, 30 * u, FAM.mono); ctx.fillStyle = th.stage; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(it.n), bx, by + 2 * u); ctx.textBaseline = 'alphabetic';
      ctx.restore();
    }
  }
}
defineTest({
  id: 'count', name: 'Quick Count', tag: 'Speed', eyebrow: 'Speed test',
  blurb: 'Shapes or emoji flash for a moment and vanish. On Hard and Expert the question only comes after.',
  defaults: { rounds: 5, seconds: 4 }, roundsRange: [3, 8],
  hooks: ['How fast can you count? 👀', 'Count them before they vanish', 'Blink and you’ll miss it', 'Only sharp eyes get {N}/{N}'],
  options: [{ id: 'items', label: 'Items', choices: [['mix', 'Mixed'], ['shapes', 'Shapes'], ['emoji', 'Emoji']] }],
  gen(rng, i, N, diff, sh, opts) {
    const f = fOf(i, N), tr = { easy: [10, 13], medium: [13, 17], hard: [16, 21], expert: [19, 25] }[diff], tot = Math.round(lerp(tr[0], tr[1], f));
    const cnt = rInt(rng, ...{ easy: [3, 6], medium: [4, 8], hard: [5, 9], expert: [6, 11] }[diff]);
    const em = opts && opts.items === 'emoji' ? true : opts && opts.items === 'shapes' ? false : rng() < 0.5, eset = rPick(rng, EMO_SETS);
    const useColor = !em && (diff === 'hard' || diff === 'expert') && rng() < 0.6, shape = em ? rPick(rng, eset) : rPick(rng, SHAPES), col = rPick(rng, CCOL);
    const isT = (sh, c) => sh === shape && (!useColor || c === col);
    const items = [];
    for (let j = 0; j < cnt; j++) items.push({ shape, col: useColor ? col : rPick(rng, CCOL), target: true });
    for (let g = 0; items.length < tot && g < 500; g++) { const sh = em ? rPick(rng, eset) : rPick(rng, SHAPES), c = rPick(rng, CCOL); if (!isT(sh, c)) items.push({ shape: sh, col: c, target: false }); }
    const pos = placeItems(rng, items.length, 760, 760, 76, 104);
    items.length = Math.min(items.length, pos.length);
    items.forEach((it, j) => Object.assign(it, pos[j], { rot: em ? (rng() - 0.5) * 0.5 : it.shape === 'circle' ? 0 : (rng() - 0.5) * 0.9 }));
    const real = items.filter(it => it.target).length;
    items.filter(it => it.target).sort((a, b) => a.y - b.y || a.x - b.x).forEach((it, j) => { it.n = j + 1; });
    const copts = rShuffle(rng, [real, real + 1, real > 1 ? real - 1 : real + 2]).map(v => ({ label: String(v), correct: v === real }));
    return { items, emoji: em, cnt: real, shape, col: useColor ? col : null, options: copts, flash: { easy: 3, medium: 2.5, hard: 2, expert: 1.6 }[diff], surprise: diff === 'hard' || diff === 'expert' };
  },
  phases: (r, cfg) => [{ kind: 'flash', dur: r.flash, timer: true, mode: 'mem', ticks: false }, { kind: 'q', dur: cfg.seconds, timer: true }, { kind: 'reveal', dur: 1.2 + r.cnt * 0.15 + 0.6 }],
  header: (r, ph, tl) => (ph === 'flash' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: r.surprise ? 'Look closely 👀' : `Count the ${countWhat(r)}!` } : ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: `How many ${countWhat(r)}?` } : { eyebrow: 'Answer', title: `${r.cnt} ${countWhat(r)}` }),
  bottom: (r, ph) => (ph === 'flash' ? null : { options: r.options, since: 'q' }),
  cues: (r, seg) => (seg.phase === 'reveal' ? r.items.filter(it => it.target).map(it => ({ t: 0.3 + (it.n - 1) * 0.15, s: 'blip', arg: it.n - 1 })) : seg.phase === 'q' ? [{ t: 0.0, s: 'flip' }] : null),
  draw: (ctx, r, s) => drawCount(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawCount(ctx, tl.rounds[0], R, { phase: 'art', local: 0, th: tl.theme }),
  outro: { title: 'How many did you count right?', labels: ['Lightning eyes ⚡', 'Quick counter 👀', 'Not bad 🙂', 'Too fast for me 😵'] },
});
