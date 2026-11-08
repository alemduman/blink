// =====================================================================
// New tests: Shape Count (triangles / squares), Shade Order, Word Hunt,
// Color Echo (Simon), Mini Sudoku, Ten Seconds. Same contract as tests.js.
// =====================================================================
const n3Hue = (i, n) => Math.round((i * 360) / Math.max(1, n) + 12) % 360;
const n3Ord = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];

// ---------------------------------------------------------------------
// 16. Shape Count (how many triangles / squares)
// ---------------------------------------------------------------------
function n3TriTotal(n) { return Math.floor((n * (n + 2) * (2 * n + 1)) / 8); }
function n3TriPer(n) {
  const out = [];
  for (let s = 1; s <= n; s++) out.push(((n - s + 1) * (n - s + 2)) / 2 + (n >= 2 * s ? ((n - 2 * s + 1) * (n - 2 * s + 2)) / 2 : 0));
  return out;
}
function n3SqPer(k) { const out = []; for (let s = 1; s <= k; s++) out.push((k - s + 1) * (k - s + 1)); return out; }
function n3TriGeom(R, u, n) {
  let L = R.w - 170 * u, hgt = (L * Math.sqrt(3)) / 2;
  const maxH = R.h - 250 * u;
  if (hgt > maxH) { hgt = maxH; L = (hgt * 2) / Math.sqrt(3); }
  const cx = R.x + R.w / 2, top = R.y + 70 * u;
  return { P: (i, j) => ({ x: cx + (j - i / 2) * (L / n), y: top + (i * hgt) / n }) };
}
function n3PolyFill(ctx, pts, fill) { ctx.beginPath(); pts.forEach((p, q) => (q ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
function drawShapeCount(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase, n = r.n;
  stage(ctx, R, th, u);
  const reveal = ph === 'reveal' || ph === 'art';
  const loc = ph === 'reveal' ? s.local : ph === 'art' ? 0 : -1;
  const idx = loc >= 0 ? Math.floor((loc - 0.5) / 0.65) : -1; // size being highlighted now
  const done = ph === 'reveal' && idx >= n;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (r.kind === 'tri') {
    const G = n3TriGeom(R, u, n), P = G.P;
    // highlight
    if (reveal && idx >= 0 && !done) {
      const sz = idx + 1, col = `hsla(${n3Hue(idx, n)} 85% 55% / 0.5)`;
      for (let i = 0; i + sz <= n; i++) for (let j = 0; j <= i; j++) n3PolyFill(ctx, [P(i, j), P(i + sz, j), P(i + sz, j + sz)], col);
      for (let i = 0; i + sz <= n; i++) for (let j = 0; j + sz <= i; j++) n3PolyFill(ctx, [P(i, j), P(i, j + sz), P(i + sz, j + sz)], col);
    }
    ctx.strokeStyle = th.ink; ctx.lineWidth = 7 * u;
    ctx.beginPath(); ctx.moveTo(P(0, 0).x, P(0, 0).y); ctx.lineTo(P(n, 0).x, P(n, 0).y); ctx.lineTo(P(n, n).x, P(n, n).y); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 5.5 * u;
    for (let k = 1; k < n; k++) {
      line(ctx, P(k, 0).x, P(k, 0).y, P(k, k).x, P(k, k).y);
      line(ctx, P(k, k).x, P(k, k).y, P(n, k).x, P(n, k).y);
      line(ctx, P(k, 0).x, P(k, 0).y, P(n, n - k).x, P(n, n - k).y);
    }
  } else {
    const cell = Math.min((R.w - 190 * u) / n, (R.h - 270 * u) / n), gw = cell * n, x0 = R.x + (R.w - gw) / 2, y0 = R.y + 70 * u;
    if (reveal && idx >= 0 && !done) {
      const sz = idx + 1, col = `hsla(${n3Hue(idx, n)} 85% 55% / 0.2)`, st = `hsla(${n3Hue(idx, n)} 85% 40% / 0.9)`;
      for (let a = 0; a + sz <= n; a++) for (let b = 0; b + sz <= n; b++) {
        const x = x0 + b * cell + 6 * u, y = y0 + a * cell + 6 * u, w = sz * cell - 12 * u;
        ctx.fillStyle = col; ctx.fillRect(x, y, w, w); ctx.strokeStyle = st; ctx.lineWidth = 3 * u; ctx.strokeRect(x, y, w, w);
      }
    }
    ctx.strokeStyle = th.ink; ctx.lineWidth = 7 * u;
    for (let k = 0; k <= n; k++) { line(ctx, x0, y0 + k * cell, x0 + gw, y0 + k * cell); line(ctx, x0 + k * cell, y0, x0 + k * cell, y0 + gw); }
  }
  // text under the figure
  const ty = R.y + R.h - 78 * u;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (ph === 'reveal' && idx >= 0 && !done) {
    setFont(ctx, 800, 50 * u, th.fam); ctx.fillStyle = th.ink;
    ctx.fillText(`${r.kind === 'tri' ? 'Size' : 'Squares'} ${idx + 1}${r.kind === 'tri' ? '' : '×' + (idx + 1)}: ${r.per[idx]}`, R.x + R.w / 2, ty);
  } else if (done) {
    withAlpha(ctx, eOut(clamp((s.local - 0.5 - n * 0.65) / 0.3)), () => {
      setFont(ctx, 800, 74 * u, th.fam); ctx.fillStyle = th.ok; ctx.fillText(`${r.total} ${r.kind === 'tri' ? 'triangles' : 'squares'}`, R.x + R.w / 2, ty);
    });
  }
  ctx.textBaseline = 'alphabetic';
}
defineTest({
  id: 'shapecount', name: 'Shape Count', tag: 'Logic', eyebrow: 'Logic test',
  blurb: 'How many triangles (or squares) hide in the figure? The reveal highlights every size one by one.',
  defaults: { rounds: 4, seconds: 9 }, roundsRange: [2, 5],
  hooks: ['How many triangles do you see? 🔺', 'Most people get this one wrong', 'Count every single one 👀', 'How many squares? Think twice'],
  shared(vr) { return { first: vr() < 0.5 ? 0 : 1 }; },
  gen(rng, i, N, diff, sh) {
    const f = fOf(i, N), kind = (i + sh.first) % 2 === 0 ? 'tri' : 'sq';
    const tr = kind === 'tri' ? { easy: [2, 3], medium: [3, 4], hard: [3, 5], expert: [4, 5] }[diff] : { easy: [2, 3], medium: [3, 4], hard: [4, 5], expert: [4, 6] }[diff];
    const n = Math.round(lerp(tr[0], tr[1], f));
    const per = kind === 'tri' ? n3TriPer(n) : n3SqPer(n), total = per.reduce((a, b) => a + b, 0);
    const naive = kind === 'tri' ? n * n : n * n;
    const wrong = [naive === total ? total + 2 : naive, total + rInt(rng, 2, 4) * (rng() < 0.5 ? 1 : -1)];
    return { kind, n, per, total, options: uniqNums(rng, total, wrong) };
  },
  phases: (r, cfg) => [{ kind: 'q', dur: cfg.seconds, timer: true }, { kind: 'reveal', dur: 0.5 + r.n * 0.65 + 1.6 }],
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: r.kind === 'tri' ? 'How many triangles? 🔺' : 'How many squares? ⬛' } : { eyebrow: 'Counting every size', title: `${r.total} ${r.kind === 'tri' ? 'triangles' : 'squares'}` }),
  bottom: (r, ph) => ({ options: r.options, since: 'q' }),
  cues: (r, seg) => (seg.phase === 'q' ? [{ t: 0.02, s: 'flip' }] : seg.phase === 'reveal' ? r.per.map((_, q) => ({ t: 0.5 + q * 0.65, s: 'blip', arg: q })) : null),
  draw: (ctx, r, s) => drawShapeCount(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawShapeCount(ctx, tl.rounds[0], R, { phase: 'art', local: 0, th: tl.theme }),
  outro: { title: 'How many did you count right?', labels: ['Geometry genius 📐', 'Sharp counter 👀', 'Not bad 🙂', 'I lost count 😵'] },
});

// ---------------------------------------------------------------------
// 17. Shade Order (dark to light)
// ---------------------------------------------------------------------
function n3Seq(order) { return order.join(' · '); }
function drawShadeOrder(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase, n = r.n;
  stage(ctx, R, th, u);
  const pad = 46 * u, gap = 16 * u, w = (R.w - pad * 2 - gap * (n - 1)) / n, h = 400 * u, y = R.y + R.h * 0.5 - h / 2 - 10 * u;
  const sortP = ph === 'reveal' ? eInOut(clamp((s.local - 0.5) / 0.9)) : ph === 'art' ? 0 : 0;
  r.tiles.forEach((t, j) => {
    const x0 = R.x + pad + j * (w + gap), x1 = R.x + pad + t.rank * (w + gap), x = lerp(x0, x1, sortP);
    fillRR(ctx, x, y, w, h, Math.min(26 * u, w * 0.22), t.color);
    setFont(ctx, 800, Math.min(w * 0.62, 84 * u), th.fam); ctx.fillStyle = t.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(j + 1), x + w / 2, y + h / 2);
  });
  ctx.textBaseline = 'alphabetic';
  const ty = y + h + 78 * u;
  if (ph === 'reveal') {
    withAlpha(ctx, eOut(clamp((s.local - 1.2) / 0.3)), () => {
      setFont(ctx, 800, 56 * u, th.fam); ctx.fillStyle = th.ok; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n3Seq(r.answerOrder), R.x + R.w / 2, ty); ctx.textBaseline = 'alphabetic';
    });
  } else {
    setFont(ctx, 800, 40 * u, th.fam); ctx.fillStyle = th.sub; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('DARK  →  LIGHT', R.x + R.w / 2, ty); ctx.textBaseline = 'alphabetic';
  }
}
defineTest({
  id: 'shadeorder', name: 'Shade Order', tag: 'Color', eyebrow: 'Color test',
  blurb: 'Several tiles of one color in different lightness. Which order goes from darkest to lightest?',
  defaults: { rounds: 4, seconds: 7 }, roundsRange: [2, 6],
  hooks: ['Order these from dark to light 🎨', 'Can you sort the shades?', 'Your eyes vs. {N} sneaky gradients', 'Darkest to lightest. Go!'],
  gen(rng, i, N, diff) {
    const f = fOf(i, N), nr = { easy: [4, 4], medium: [4, 5], hard: [5, 5], expert: [5, 6] }[diff], n = Math.round(lerp(nr[0], nr[1], f));
    const step = { easy: 11, medium: 8, hard: 6, expert: 4.6 }[diff] * lerp(1.05, 0.9, f);
    const hue = rInt(rng, 0, 359), sat = rInt(rng, 50, 75), L0 = rInt(rng, 28, 46);
    const ranks = rShuffle(rng, Array.from({ length: n }, (_, q) => q));
    const tiles = ranks.map(rank => { const L = L0 + rank * step; return { rank, color: `hsl(${hue} ${sat}% ${L.toFixed(1)}%)`, ink: L > 60 ? '#141821' : '#FFFFFF' }; });
    const answerOrder = []; for (let k = 0; k < n; k++) answerOrder.push(tiles.findIndex(t => t.rank === k) + 1);
    const opts = [answerOrder.slice()];
    for (let g = 0; opts.length < 3 && g < 60; g++) {
      const a = answerOrder.slice(), p = rInt(rng, 0, n - 2); [a[p], a[p + 1]] = [a[p + 1], a[p]];
      if (rng() < 0.4 && n > 3) { const q = rInt(rng, 0, n - 2); [a[q], a[q + 1]] = [a[q + 1], a[q]]; }
      const key = n3Seq(a); if (!opts.some(o => n3Seq(o) === key)) opts.push(a);
    }
    return { n, tiles, answerOrder, options: rShuffle(rng, opts).map(o => ({ label: n3Seq(o), correct: n3Seq(o) === n3Seq(answerOrder) })) };
  },
  phases: (r, cfg) => qr(cfg, 3.0),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: 'Darkest to lightest?' } : { eyebrow: 'The right order', title: n3Seq(r.answerOrder) }),
  bottom: r => ({ options: r.options, since: 'q' }),
  cues: (r, seg) => (seg.phase === 'q' ? [{ t: 0.02, s: 'flip' }] : seg.phase === 'reveal' ? [{ t: 0.5, s: 'whoosh' }] : null),
  draw: (ctx, r, s) => drawShadeOrder(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawShadeOrder(ctx, tl.rounds[0], R, { phase: 'art', local: 0, th: tl.theme }),
  outro: { title: 'How many did you sort right?', labels: ['Eyes of an artist 🎨', 'Sharp eyes 👀', 'Not bad 🙂', 'Everything looks the same 😵'] },
});

// ---------------------------------------------------------------------
// 18. Word Hunt
// ---------------------------------------------------------------------
const WH_CATS = [
  { id: 'animals', title: 'animals', e: '🐾', w: ['CAT', 'DOG', 'FOX', 'OWL', 'BEE', 'PIG', 'COW', 'BAT', 'HEN', 'ANT', 'APE', 'EEL', 'YAK', 'RAT', 'BEAR', 'LION', 'WOLF', 'DUCK', 'FROG', 'DEER', 'GOAT', 'CRAB', 'SEAL', 'SWAN', 'MOTH', 'LAMB', 'TOAD', 'HAWK', 'MOLE', 'ZEBRA', 'HORSE', 'MOUSE'] },
  { id: 'food', title: 'foods', e: '🍽️', w: ['PIE', 'JAM', 'EGG', 'TEA', 'FIG', 'PEA', 'RICE', 'CAKE', 'SOUP', 'BEAN', 'CORN', 'LIME', 'PLUM', 'TACO', 'MILK', 'FISH', 'TOFU', 'NUTS', 'PEAR', 'KIWI', 'MEAT', 'BUN', 'OAT', 'PASTA', 'PIZZA', 'BREAD', 'LEMON'] },
  { id: 'colors', title: 'colors', e: '🎨', w: ['RED', 'TAN', 'BLUE', 'GOLD', 'PINK', 'GRAY', 'LIME', 'ROSE', 'TEAL', 'NAVY', 'JADE', 'RUBY', 'SAND', 'BLACK', 'WHITE', 'GREEN', 'BROWN', 'CORAL'] },
  { id: 'countries', title: 'countries', e: '🌍', w: ['PERU', 'CUBA', 'IRAN', 'OMAN', 'MALI', 'CHAD', 'TOGO', 'LAOS', 'FIJI', 'ITALY', 'SPAIN', 'INDIA', 'CHINA', 'JAPAN', 'NEPAL', 'HAITI', 'QATAR', 'KENYA', 'GHANA'] },
];
const WH_BAN = ['ASS', 'SEX', 'FUCK', 'SHIT', 'DICK', 'COCK', 'CUM', 'TIT', 'PEE', 'POO', 'WTF', 'FAG', 'GAY', 'NAZI', 'KKK', 'RAPE', 'PORN', 'CUNT', 'TWAT', 'SLUT', 'HOE', 'BUM', 'PIS', 'VAG', 'ANAL', 'NUDE', 'DAMN', 'HELL', 'SEXY', 'SLAVE'];
const WH_DIRS = { easy: [[0, 1], [1, 0]], medium: [[0, 1], [1, 0], [1, 1]], hard: [[0, 1], [1, 0], [1, 1], [0, -1]], expert: [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, 1], [1, -1], [-1, -1]] };
function whBanned(grid, n) {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) for (const [dr, dc] of dirs) {
    let str = '';
    for (let k = 0; k < 6; k++) { const rr2 = r + dr * k, cc = c + dc * k; if (rr2 < 0 || rr2 >= n || cc < 0 || cc >= n) break; str += grid[rr2][cc]; }
    const rev = str.split('').reverse().join('');
    for (const b of WH_BAN) if (str.startsWith(b) || str.includes(b) || rev.includes(b)) return true;
  }
  return false;
}
function whBuild(rng, cat, diff) {
  const cfg = { easy: { n: 5, k: 3, lens: [3, 4] }, medium: { n: 6, k: 3, lens: [4, 5] }, hard: { n: 6, k: 4, lens: [3, 5] }, expert: { n: 7, k: 4, lens: [4, 5] } }[diff];
  const n = cfg.n, dirs = WH_DIRS[diff];
  for (let attempt = 0; attempt < 60; attempt++) {
    const pool = rShuffle(rng, cat.w.filter(w => w.length >= cfg.lens[0] && w.length <= cfg.lens[1] && w.length <= n)).slice(0, cfg.k);
    if (pool.length < cfg.k) continue;
    const grid = Array.from({ length: n }, () => Array(n).fill('')), placed = [];
    let ok = true;
    for (const word of pool) {
      let done = false;
      for (let t = 0; t < 250 && !done; t++) {
        const [dr, dc] = rPick(rng, dirs), r0 = rInt(rng, 0, n - 1), c0 = rInt(rng, 0, n - 1);
        const r1 = r0 + dr * (word.length - 1), c1 = c0 + dc * (word.length - 1);
        if (r1 < 0 || r1 >= n || c1 < 0 || c1 >= n) continue;
        let fit = true;
        for (let k = 0; k < word.length; k++) { const ch = grid[r0 + dr * k][c0 + dc * k]; if (ch && ch !== word[k]) { fit = false; break; } }
        if (!fit) continue;
        for (let k = 0; k < word.length; k++) grid[r0 + dr * k][c0 + dc * k] = word[k];
        placed.push({ word, r0, c0, r1, c1 }); done = true;
      }
      if (!done) { ok = false; break; }
    }
    if (!ok) continue;
    const letters = 'ABCDEFGHILMNOPRSTUWY';
    for (let fill = 0; fill < 80; fill++) {
      const g = grid.map(row => row.map(ch => ch || rPick(rng, letters.split(''))));
      if (!whBanned(g, n)) return { n, grid: g, words: placed };
    }
  }
  return null;
}
function drawWordHunt(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase, n = r.n;
  stage(ctx, R, th, u);
  const pad = 48 * u, cell = (R.w - pad * 2) / n, x0 = R.x + pad, y0 = R.y + (R.h - cell * n) / 2;
  const cxOf = c => x0 + (c + 0.5) * cell, cyOf = rw => y0 + (rw + 0.5) * cell;
  if (ph === 'reveal' || ph === 'art') {
    r.words.forEach((w, q) => {
      const p = ph === 'art' ? 1 : eOut(clamp((s.local - 0.3 - q * 0.7) / 0.5));
      if (p <= 0) return;
      const ax = cxOf(w.c0), ay = cyOf(w.r0), bx = ax + (cxOf(w.c1) - ax) * p, by = ay + (cyOf(w.r1) - ay) * p;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = cell * 0.78; ctx.strokeStyle = `hsla(${n3Hue(q, r.words.length)} 85% 55% / 0.42)`; line(ctx, ax, ay, bx, by); ctx.restore();
    });
  }
  setFont(ctx, 800, cell * 0.56, th.fam); ctx.fillStyle = th.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let rw = 0; rw < n; rw++) for (let c = 0; c < n; c++) ctx.fillText(r.grid[rw][c], cxOf(c), cyOf(rw) + cell * 0.03);
  ctx.textBaseline = 'alphabetic';
}
defineTest({
  id: 'words', name: 'Word Hunt', tag: 'Words', eyebrow: 'Word game',
  blurb: 'A grid of letters hides a few words of one theme. Find them before time is up, then watch them light up.',
  defaults: { rounds: 3, seconds: 9 }, roundsRange: [2, 4],
  hooks: ['Find the hidden words in {S} seconds 🔎', 'Can you find all of them?', 'Word search, speed edition ⏱️', 'How many words can you spot?'],
  gen(rng, i, N, diff) {
    const cat = WH_CATS[(i + Math.floor(rng() * WH_CATS.length)) % WH_CATS.length];
    const b = whBuild(rng, cat, diff) || whBuild(rng, WH_CATS[0], 'easy');
    return { cat: cat.title, e: cat.e, n: b.n, grid: b.grid, words: b.words, k: b.words.length };
  },
  phases: (r, cfg) => [{ kind: 'q', dur: cfg.seconds, timer: true }, { kind: 'reveal', dur: 0.6 + r.k * 0.7 + 1.4 }],
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: `Find ${r.k} hidden ${r.cat} ${r.e}` } : { eyebrow: 'The hidden words', title: r.words.map(w => w.word).join(' · ') }),
  bottom: (r, ph) => ({ pill: ph === 'q' ? 'Write the words you find 👇' : 'How many did you find? 👇' }),
  cues: (r, seg) => (seg.phase === 'q' ? [{ t: 0.02, s: 'flip' }] : seg.phase === 'reveal' ? r.words.map((_, q) => ({ t: 0.3 + q * 0.7, s: 'blip', arg: q })) : null),
  draw: (ctx, r, s) => drawWordHunt(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawWordHunt(ctx, tl.rounds[0], R, { phase: 'art', local: 9, th: tl.theme }),
  outro: { title: 'How many words did you find?', labels: ['Word wizard 🧙', 'Sharp eyes 👀', 'Not bad 🙂', 'Only found my name 😅'], cta: 'Comment your count 👇' },
  introChip: tl => `${tl.N} rounds · find the hidden words`,
});

// ---------------------------------------------------------------------
// 20. Mini Sudoku (4x4)
// ---------------------------------------------------------------------
const SDK_BASE = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]];
function sdkCount(g, limit = 2) {
  const i = g.findIndex(v => v === 0);
  if (i < 0) return 1;
  const r = Math.floor(i / 4), c = i % 4;
  let cnt = 0;
  for (let d = 1; d <= 4 && cnt < limit; d++) {
    let ok = true;
    for (let k = 0; k < 4 && ok; k++) if (g[r * 4 + k] === d || g[k * 4 + c] === d) ok = false;
    const br = r - (r % 2), bc = c - (c % 2);
    for (let a = 0; a < 2 && ok; a++) for (let b = 0; b < 2; b++) if (g[(br + a) * 4 + bc + b] === d) ok = false;
    if (!ok) continue;
    g[i] = d; cnt += sdkCount(g, limit - cnt); g[i] = 0;
  }
  return cnt;
}
function sdkSolution(rng) {
  const dig = rShuffle(rng, [1, 2, 3, 4]), rowOrd = rShuffle(rng, [0, 1]).flatMap(b => rShuffle(rng, [0, 1]).map(x => b * 2 + x)), colOrd = rShuffle(rng, [0, 1]).flatMap(b => rShuffle(rng, [0, 1]).map(x => b * 2 + x));
  const out = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) out.push(dig[SDK_BASE[rowOrd[r]][colOrd[c]] - 1]);
  return out;
}
function drawSudoku(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase;
  stage(ctx, R, th, u);
  const size = Math.min(R.w - 120 * u, R.h - 120 * u), cell = size / 4, x0 = R.x + (R.w - size) / 2, y0 = R.y + (R.h - size) / 2;
  const rv = ph === 'reveal' || ph === 'art';
  const blanks = r.blanks.filter(b => b !== r.mark);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < 16; i++) {
    const x = x0 + (i % 4) * cell, y = y0 + Math.floor(i / 4) * cell;
    if (i === r.mark) {
      const p = ph === 'reveal' ? eBack(clamp((s.local - 0.3) / 0.45)) : 0;
      fillRR(ctx, x + 5 * u, y + 5 * u, cell - 10 * u, cell - 10 * u, 16 * u, p > 0 ? th.ok : th.accent);
      setFont(ctx, 800, cell * 0.6 * (p > 0 ? lerp(0.6, 1.15, p) : 1), th.fam); ctx.fillStyle = p > 0 ? th.okInk : th.accentInk; ctx.fillText(p > 0 ? String(r.sol[i]) : '?', x + cell / 2, y + cell / 2 + cell * 0.03);
    } else if (r.given[i]) {
      setFont(ctx, 800, cell * 0.56, th.fam); ctx.fillStyle = th.ink; ctx.fillText(String(r.sol[i]), x + cell / 2, y + cell / 2 + cell * 0.03);
    } else if (ph === 'reveal') {
      const q = blanks.indexOf(i), a = eOut(clamp((s.local - 0.9 - q * 0.22) / 0.3));
      withAlpha(ctx, a, () => { setFont(ctx, 800, cell * 0.5, th.fam); ctx.fillStyle = th.ok; ctx.fillText(String(r.sol[i]), x + cell / 2, y + cell / 2 + cell * 0.03); });
    }
  }
  ctx.textBaseline = 'alphabetic';
  ctx.strokeStyle = th.ink; ctx.lineCap = 'round';
  for (let k = 0; k <= 4; k++) {
    ctx.lineWidth = (k % 2 === 0 ? 8 : 3.5) * u;
    line(ctx, x0, y0 + k * cell, x0 + size, y0 + k * cell); line(ctx, x0 + k * cell, y0, x0 + k * cell, y0 + size);
  }
}
defineTest({
  id: 'sudoku', name: 'Mini Sudoku', tag: 'Logic', eyebrow: 'Logic test',
  blurb: 'A 4×4 sudoku with a few empty cells. Which number goes in the marked cell? Every row, column and 2×2 box holds 1 to 4.',
  defaults: { rounds: 4, seconds: 10 }, roundsRange: [2, 5],
  hooks: ['Solve this mini sudoku in {S} seconds 🔢', 'Can you crack it?', 'Which number goes in the ? cell', 'Mini sudoku, maximum brain'],
  gen(rng, i, N, diff) {
    const f = fOf(i, N), nb = Math.round(lerp(...{ easy: [4, 5], medium: [5, 6], hard: [6, 8], expert: [8, 9] }[diff], f));
    let best = null;
    for (let t = 0; t < 120; t++) {
      const sol = sdkSolution(rng), idxs = rShuffle(rng, Array.from({ length: 16 }, (_, q) => q)).slice(0, nb);
      const g = sol.slice(); idxs.forEach(q => { g[q] = 0; });
      if (sdkCount(g.slice(), 2) === 1) { best = { sol, blanks: idxs }; break; }
      if (!best) best = { sol, blanks: idxs, weak: true };
    }
    const sol = best.sol, blanks = best.blanks, mark = blanks[0];
    const given = sol.map((_, q) => !blanks.includes(q));
    const ans = sol[mark], others = rShuffle(rng, [1, 2, 3, 4].filter(d => d !== ans)).slice(0, 2);
    const options = [ans, ...others].sort((a, b) => a - b).map(d => ({ label: String(d), correct: d === ans }));
    return { sol, blanks, mark, given, ans, options };
  },
  phases: (r, cfg) => [{ kind: 'q', dur: cfg.seconds, timer: true }, { kind: 'reveal', dur: 1.2 + r.blanks.length * 0.22 + 1.2 }],
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: 'Which number goes in the ? cell' } : { eyebrow: 'Solved', title: `It was ${r.ans}` }),
  bottom: r => ({ options: r.options, since: 'q' }),
  cues: (r, seg) => (seg.phase === 'q' ? [{ t: 0.02, s: 'flip' }] : seg.phase === 'reveal' ? r.blanks.filter(b => b !== r.mark).map((_, q) => ({ t: 0.9 + q * 0.22, s: 'blip', arg: q })) : null),
  draw: (ctx, r, s) => drawSudoku(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawSudoku(ctx, tl.rounds[0], R, { phase: 'art', local: 0, th: tl.theme }),
  outro: { title: 'How many did you solve?', labels: ['Sudoku master 🧩', 'Sharp mind 🧠', 'Not bad 🙂', 'Numbers hurt 😵'] },
});

// ---------------------------------------------------------------------
// 21. Ten Seconds (feel the time)
// ---------------------------------------------------------------------
function drawTenSec(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase;
  stage(ctx, R, th, u);
  const cx = R.x + R.w / 2, cy = R.y + R.h * 0.48, rad = 250 * u;
  ctx.lineCap = 'round';
  ctx.lineWidth = 26 * u; ctx.strokeStyle = th.track; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
  let text = '0.00', col = th.ink, prog = 0, sub = '';
  if (ph === 'ready') { const go = s.local > 1.2; text = go ? 'GO!' : 'READY'; col = go ? th.ok : th.ink; sub = 'Start counting on GO'; }
  else if (ph === 'hide') { text = '…'; col = th.sub; const b = 1 + Math.sin(s.local * 2.3) * 0.03; ctx.save(); scaleAround(ctx, cx, cy, b); sub = 'Counting in your head'; ctx.restore(); }
  else { prog = ph === 'art' ? 1 : eOut(clamp(s.local / 0.5)); text = `${r.target}.00`; col = th.ok; sub = 'Time!'; }
  if (prog > 0) { ctx.strokeStyle = th.ok; ctx.lineWidth = 26 * u; ctx.beginPath(); ctx.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); ctx.stroke(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const f = fitText(measureCtx, text, { maxW: Math.round(rad * 1.6), maxH: Math.round(rad), maxLines: 1, max: Math.round(190 * u), min: 40, weight: 800, fam: th.fam, lh: 1 });
  setFont(ctx, 800, f.size, th.fam); ctx.fillStyle = col; ctx.fillText(f.lines[0], cx, cy);
  setFont(ctx, 700, 40 * u, th.fam); ctx.fillStyle = th.sub; ctx.fillText(sub, cx, cy + rad + 78 * u);
  ctx.textBaseline = 'alphabetic';
}
defineTest({
  id: 'tensec', name: 'Ten Seconds', tag: 'Feel', eyebrow: 'Time test',
  blurb: 'Count a number of seconds silently while the screen hides the clock. The reveal shows the exact time.',
  defaults: { rounds: 2, seconds: 4 }, roundsRange: [1, 3],
  hooks: ['Count {K} seconds in your head ⏱️', 'Can you feel 10 seconds?', 'No clock. Just your brain.', 'Count in your head. No cheating 🤫'],
  kFor: () => 10,
  gen(rng, i, N, diff) {
    const list = { easy: [5, 6, 7], medium: [6, 8, 10], hard: [8, 10, 12], expert: [10, 12, 15] }[diff];
    return { target: list[i % list.length] };
  },
  phases: (r, cfg) => [{ kind: 'ready', dur: 1.9 }, { kind: 'hide', dur: r.target }, { kind: 'reveal', dur: 2.6 }],
  header: (r, ph, tl) => (ph === 'ready' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: `Count ${r.target} seconds in your head` } : ph === 'hide' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: 'Eyes on the screen. No clock.' } : { eyebrow: 'Time is up', title: `Exactly ${r.target} seconds` }),
  bottom: (r, ph) => ({ pill: ph === 'ready' ? 'Start when you see GO 🤫' : ph === 'hide' ? 'No cheating 🙈' : 'Were you early or late? 👇' }),
  cues: (r, seg) => (seg.phase === 'ready' ? [{ t: 1.2, s: 'pop' }] : null),
  draw: (ctx, r, s) => drawTenSec(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawTenSec(ctx, tl.rounds[0], R, { phase: 'art', local: 9, th: tl.theme }),
  outro: { title: 'How close were you?', labels: ['Human clock ⏱️', 'Pretty close 👌', 'A bit off 🙂', 'Time is relative 😅'], cta: 'Comment how close you were 👇' },
  introChip: tl => `${tl.N} rounds · count silently`,
});
