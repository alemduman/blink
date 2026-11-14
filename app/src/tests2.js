// =====================================================================
// More tests: Emoji Riddle, Emoji Math, Number Patterns, Word Scramble,
// What Vanished, More Dots. Same contract as tests.js (u = rect.w / 820).
// =====================================================================
const optionPool = (rng, pool, correct, k, key = x => x) => {
  const others = rShuffle(rng, pool.filter(p => key(p) !== key(correct))).slice(0, k);
  return rShuffle(rng, [correct, ...others]);
};
const uniqNums = (rng, ans, wrong) => {
  const vals = [ans];
  for (let w of wrong) { let g = 0; while ((vals.includes(w) || w < 0) && g++ < 40) w += w < 0 ? 3 : 1; vals.push(w); }
  return rShuffle(rng, vals).map(v => ({ label: fmtNum(v), correct: v === ans }));
};

// ---------------------------------------------------------------------
// 10. Emoji Riddle (rebus)
// ---------------------------------------------------------------------
const REBUS = [
  // Фильмы: подсказка по сюжету, а не по названию; варианты ответа — похожие фильмы.
  // [эмодзи, ответ, 'movie', [два похожих фильма для вариантов], сложность 2 — средне, 3 — трудно]
  ['⛄ 👭 🏰 🎤', 'Frozen', 'movie', ['Tangled', 'Brave'], 2],
  ['👴 🎈 🐕 🗺️', 'Up', 'movie', ['Coco', 'Toy Story'], 2],
  ['🐀 👨‍🍳 🗼 🍲', 'Ratatouille', 'movie', ['Chef', 'Paddington'], 2],
  ['🧹 🦉 🚂 ⚡', 'Harry Potter', 'movie', ['Percy Jackson', 'Polar Express'], 2],
  ['🏠 👦 🎄 🪤', 'Home Alone', 'movie', ['The Grinch', 'Elf'], 2],
  ['🦈 🎵 🏖️ 🚤', 'Jaws', 'movie', ['The Meg', 'Deep Blue Sea'], 2],
  ['🧅 🐴 👸 🏰', 'Shrek', 'movie', ['Tangled', 'Cinderella'], 2],
  ['🐟 🦷 🚽 🌊', 'Finding Nemo', 'movie', ['Shark Tale', 'Luca'], 2],
  ['🌹 🕯️ ⏰ 📚', 'Beauty & Beast', 'movie', ['Cinderella', 'Tangled'], 2],
  ['👻 🧪 🍡 🏢', 'Ghostbusters', 'movie', ['Casper', 'Beetlejuice'], 2],
  ['🎲 🐘 🌴 🥁', 'Jumanji', 'movie', ['Zathura', 'Jurassic Park'], 2],
  ['👽 🚲 🌕 📞', 'E.T.', 'movie', ['Super 8', 'Paul'], 2],
  ['💤 🌀 🏙️ 🔁', 'Inception', 'movie', ['Interstellar', 'Tenet'], 3],
  ['💊 🔴 🔵 🕶️', 'The Matrix', 'movie', ['Men in Black', 'John Wick'], 3],
  ['🧬 🦟 💎 🏝️', 'Jurassic Park', 'movie', ['Jumanji', 'King Kong'], 3],
  ['🚗 ⚡ 🕰️ 🎸', 'Back to Future', 'movie', ['Cars', 'Fast & Furious'], 3],
  ['🌽 🚀 🕳️ ⏳', 'Interstellar', 'movie', ['Gravity', 'The Martian'], 3],
  ['🍊 🐴 🛏️ 🇮🇹', 'The Godfather', 'movie', ['Scarface', 'Goodfellas'], 3],
  ['🏃 🍫 📦 🦐', 'Forrest Gump', 'movie', ['Cast Away', 'Big Fish'], 3],
  ['🎻 🚪 💎 🧊', 'Titanic', 'movie', ['Avatar', 'The Notebook'], 3],
  ['💍 🌋 🦶 🧙', 'Lord of Rings', 'movie', ['The Hobbit', 'Narnia'], 3],
  ['🏐 ✈️ 🏝️ 🦷', 'Cast Away', 'movie', ['Life of Pi', 'The Beach'], 3],
  ['📺 🏝️ 🌊 🚪', 'Truman Show', 'movie', ['The Beach', 'Cast Away'], 3],
  ['👦 👀 💀 🩺', 'Sixth Sense', 'movie', ['Coco', 'Ghost'], 3],
  ['👩‍🚀 🛰️ 💥 🌍', 'Gravity', 'movie', ['Interstellar', 'Armageddon'], 3],
  ['👨‍🚀 🥔 🔴 📡', 'The Martian', 'movie', ['Interstellar', 'Gravity'], 3],
  ['💀 🎸 🌼 👦', 'Coco', 'movie', ['Encanto', 'Book of Life'], 3],
  ['🚪 👧 😱 ⚡', 'Monsters Inc', 'movie', ['Inside Out', 'Coraline'], 3],
  ['🐰 👮 🦊 🦥', 'Zootopia', 'movie', ['Robin Hood', 'Sing'], 3],
  ['🌊 🛶 🐔 🪝', 'Moana', 'movie', ['Lilo & Stitch', 'Luca'], 3],
  ['🤖 🌱 🗑️ 👢', 'WALL-E', 'movie', ['Big Hero 6', 'Iron Giant'], 3],
  ['🏹 🔥 🍞 🐦', 'Hunger Games', 'movie', ['Brave', 'Divergent'], 3],
  ['🕶️ 👽 🔦 🖤', 'Men in Black', 'movie', ['The Matrix', 'Paul'], 3],
  ['👃 🤥 🐳 🪵', 'Pinocchio', 'movie', ['Moby Dick', 'Finding Nemo'], 3],
  ['🐯 🦷 💍 🎰', 'The Hangover', 'movie', ['Life of Pi', 'Jumanji'], 3],
  ['🧠 😡 😢 🎢', 'Inside Out', 'movie', ['Soul', 'Monsters Inc'], 3],
  ['🤡 🪜 💃 🌆', 'Joker', 'movie', ['It', 'Dark Knight'], 3],
  ['🚀 🐍 👢 🤠', 'Toy Story', 'movie', ['Cars', 'Rango'], 3],
  ['🌅 🐒 🐗 👑', 'The Lion King', 'movie', ['Jungle Book', 'Madagascar'], 3],
  ['🌪️ 👠 🦁 🤖', 'Wizard of Oz', 'movie', ['Twister', 'Wicked'], 3],
  ['🦍 🏙️ ✈️ 👩', 'King Kong', 'movie', ['Godzilla', 'Rampage'], 3],
  ['🐼 🥟 🥋 🐯', 'Kung Fu Panda', 'movie', ['Mulan', 'Karate Kid'], 2],
  ['🪔 🐒 🧞 🕌', 'Aladdin', 'movie', ['Sinbad', 'Hercules'], 2],
  ['🦀 🐚 🎤 🦵', 'Little Mermaid', 'movie', ['Moana', 'Finding Nemo'], 2],
  ['🍎 👸 🪞 7️⃣', 'Snow White', 'movie', ['Cinderella', 'Maleficent'], 2],
  ['👠 🎃 🕛 🐭', 'Cinderella', 'movie', ['Snow White', 'Tangled'], 2],
  ['🧚 ⏰ 🐊 🏴‍☠️', 'Peter Pan', 'movie', ['Hook', 'Tinker Bell'], 2],
  ['🐻 🐒 🐯 🐍', 'Jungle Book', 'movie', ['Tarzan', 'Madagascar'], 2],
  ['🐶 ⚫ ⚪ 🧥', '101 Dalmatians', 'movie', ['Lady & Tramp', 'Bolt'], 2],
  ['⚔️ 👧 🐉 🏯', 'Mulan', 'movie', ['Brave', 'Raya'], 2],
  ['⚔️ 💡 🤖 🌌', 'Star Wars', 'movie', ['Star Trek', 'Dune'], 2],
  ['🟡 👖 🍌 👓', 'Minions', 'movie', ['Despicable Me', 'Madagascar'], 2],
  ['🕸️ 📸 🏙️ 🧪', 'Spider-Man', 'movie', ['Ant-Man', 'Venom'], 2],
  ['🌃 🤵 🦇 🚨', 'Batman', 'movie', ['Joker', 'Daredevil'], 2],
  ['🧊 🐿️ 🌰 🦣', 'Ice Age', 'movie', ['Madagascar', 'Brother Bear'], 2],
  ['🏎️ ⚡ 🚜 🏁', 'Cars', 'movie', ['Turbo', 'Planes'], 2],
  ['🐢 🍕 🥷 🐀', 'Ninja Turtles', 'movie', ['Kung Fu Panda', 'Ninjago'], 2],
  ['🔨 ⚡ 🌈 👑', 'Thor', 'movie', ['Iron Man', 'Hercules'], 2],
  ['💖 👠 🏖️ 🛼', 'Barbie', 'movie', ['Mean Girls', 'Legally Blonde'], 2],
  ['🧤 💎 💥 🟣', 'Avengers', 'movie', ['Thor', 'Eternals'], 3],
  ['🏜️ 🪱 🌶️ 👁️', 'Dune', 'movie', ['Mad Max', 'Star Wars'], 3],
  ['🚗 🏜️ 🔥 🎸', 'Mad Max', 'movie', ['Fast & Furious', 'Dune'], 3],
  ['🎈 🤡 ⛵ 🌧️', 'It', 'movie', ['Joker', 'Annabelle'], 3],
  ['👶 💼 🍼 🕴️', 'Boss Baby', 'movie', ['Baby Driver', 'Big'], 3],
  ['🧱 👷 🎶 👍', 'The Lego Movie', 'movie', ['Minecraft', 'Toy Story'], 3],
  ['🐻 🍊 🎩 🇬🇧', 'Paddington', 'movie', ['Ted', 'Brother Bear'], 3],
  ['🚂 ❄️ 🎅 🎫', 'Polar Express', 'movie', ['Elf', 'Frozen'], 3],
  ['🧝 🎄 🍝 🍬', 'Elf', 'movie', ['The Grinch', 'Home Alone'], 3],
  ['💚 🎄 🐕 🏔️', 'The Grinch', 'movie', ['Elf', 'Home Alone'], 3],
  ['📰 👓 🦸 💎', 'Superman', 'movie', ['Batman', 'Spider-Man'], 3],
  ['🗽 🦁 🦓 🏝️', 'Madagascar', 'movie', ['Zootopia', 'Ice Age'], 3],
  ['☢️ 🦎 🏙️ 🌊', 'Godzilla', 'movie', ['King Kong', 'Rampage'], 3],
  ['🥊 🏃 🥚 🪜', 'Rocky', 'movie', ['Creed', 'Real Steel'], 3],
  ['🗽 🏖️ 🐵 🐴', 'Planet of Apes', 'movie', ['King Kong', 'Rampage'], 3],
  ['👨‍👩‍👧‍👦 🦸 🚫 🧥', 'The Incredibles', 'movie', ['Big Hero 6', 'Fantastic Four'], 3],
  ['🏝️ 🐯 🛶 🌊', 'Life of Pi', 'movie', ['Cast Away', 'Moana'], 3],
  ['❤️ 📓 🌧️ 🚣', 'The Notebook', 'movie', ['Titanic', 'Me Before You'], 3],
  ['🧛 ❤️ 🐺 🌲', 'Twilight', 'movie', ['Underworld', 'Van Helsing'], 3],
  ['🎹 🌃 ⭐ 💃', 'La La Land', 'movie', ['Whiplash', 'Grease'], 3],
  ['🥁 😡 🎓 🎷', 'Whiplash', 'movie', ['La La Land', 'Drumline'], 3],
  ['🍑 🪨 🌧️ 🏠', 'Parasite', 'movie', ['Us', 'Get Out'], 3],
  ['🍵 🥄 🛋️ 😳', 'Get Out', 'movie', ['Us', 'Parasite'], 3],
  ['🧪 💣 🎩 🏜️', 'Oppenheimer', 'movie', ['Tenet', 'Interstellar'], 3],
  ['🔧 🤖 💡 🍔', 'Iron Man', 'movie', ['Robocop', 'Thor'], 3],
  ['☀️ 🌻', 'Sunflower', 'word'], ['🍯 🌙', 'Honeymoon', 'word'], ['🐱 🐟', 'Catfish', 'word'], ['🍎 🥧', 'Apple Pie', 'word'],
  ['⭐ 🐟', 'Starfish', 'word'], ['📚 🪱', 'Bookworm', 'word'], ['🧠 🌪️', 'Brainstorm', 'word'], ['🎂 📅', 'Birthday', 'word'],
  ['🦷 🧚', 'Tooth Fairy', 'word'], ['🌍 🏆', 'World Cup', 'word'], ['🐸 👑', 'Frog Prince', 'word'], ['🌽 🐕', 'Corn Dog', 'word'],
  ['🌙 🚶', 'Moonwalk', 'word'], ['🔥 🚒', 'Fire Truck', 'word'], ['❄️ 👨', 'Snowman', 'word'], ['🐄 🔔', 'Cowbell', 'word'],
  ['🧊 🍦', 'Ice Cream', 'word'], ['🦶 ⚽', 'Football', 'word'],
];
function drawRebus(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase, n = r.emo.length;
  stage(ctx, R, th, u);
  const gap = 64 * u, size = Math.min(250 * u, (R.w - 90 * u - gap * (n - 1)) / n), total = size * n + gap * (n - 1);
  const rv = ph === 'reveal' ? eOut(clamp(s.local / 0.4)) : 0, cy = R.y + R.h * 0.43 - rv * 36 * u;
  let x = R.x + R.w / 2 - total / 2 + size / 2;
  r.emo.forEach((e, j) => {
    const a = ph === 'q' ? clamp((s.local - j * 0.12) / 0.3) : 1;
    ctx.save(); scaleAround(ctx, x, cy, lerp(0.6, 1, eBack(a))); ctx.globalAlpha *= clamp(a * 1.5);
    drawEmoji(ctx, e, x, cy, size);
    ctx.restore();
    if (j < n - 1) withAlpha(ctx, a, () => { setFont(ctx, 800, size * 0.4, th.fam); ctx.fillStyle = th.sub; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+', x + size / 2 + gap / 2, cy); ctx.textBaseline = 'alphabetic'; });
    x += size + gap;
  });
  if (rv > 0) withAlpha(ctx, rv, () => {
    const f = fitText(measureCtx, r.answer, { maxW: Math.round(R.w - 100 * u), maxH: Math.round(130 * u), maxLines: 1, max: Math.round(112 * u), min: Math.round(40 * u), weight: 800, fam: th.fam, lh: 1 });
    setFont(ctx, 800, f.size, th.fam); ctx.fillStyle = th.ok; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(f.lines[0], R.x + R.w / 2, R.y + R.h * 0.78 + (1 - rv) * 20 * u); ctx.textBaseline = 'alphabetic';
  });
}
defineTest({
  id: 'rebus', name: 'Emoji Riddle', tag: 'Guess', eyebrow: 'Emoji riddle',
  blurb: 'Emoji hide a movie (by its plot, not its title) or a word. Viewers guess before the reveal.',
  defaults: { rounds: 6, seconds: 5 }, roundsRange: [3, 10],
  options: [{ id: 'cat', label: 'Riddles', choices: [['mixed', 'Mixed'], ['movie', 'Movies'], ['word', 'Words']] }],
  hooks: ['Guess it from the emoji 🤔', 'Can you crack all {N} emoji riddles?', 'Movie or word? Guess in {S} seconds', 'Emoji riddles that break brains 🧠'],
  shared(vr, N, cfg, opts) {
    const cat = (opts && opts.cat) || 'mixed', pool = REBUS.filter(p => cat === 'mixed' || p[2] === cat);
    // сначала средние фильмы, потом трудные: «чем дальше, тем сложнее»
    const ramp = a => { const mv = a.filter(p => p[2] === 'movie'), mid = mv.filter(p => p[4] !== 3), hard = mv.filter(p => p[4] === 3);
      const k = Math.min(2, mid.length), ordered = [...mid.slice(0, k), ...hard, ...mid.slice(k)]; let j = 0; return a.map(p => p[2] === 'movie' ? ordered[j++] : p); };
    let list = ramp(rShuffle(vr, pool.slice()));
    if (cat === 'mixed') { const m = ramp(rShuffle(vr, REBUS.filter(p => p[2] === 'movie'))), w = rShuffle(vr, REBUS.filter(p => p[2] === 'word')); list = []; for (let k = 0; k < Math.max(m.length, w.length); k++) { if (k % 2 === 0) { if (m[k]) list.push(m[k]); if (w[k]) list.push(w[k]); } else { if (w[k]) list.push(w[k]); if (m[k]) list.push(m[k]); } } }
    return { list };
  },
  gen(rng, i, N, diff, sh) {
    const p = sh.list[i % sh.list.length], pool = REBUS.filter(q => q[2] === p[2]);
    // у фильмов неверные варианты — похожие фильмы, а не случайные из списка
    const opts = p[3] ? rShuffle(rng, [{ label: p[1], correct: true }, ...p[3].slice(0, 2).map(l => ({ label: l, correct: false }))])
      : optionPool(rng, pool, p, 2, q => q[1]).map(q => ({ label: q[1], correct: q === p }));
    return { emo: p[0].split(' '), answer: p[1], cat: p[2], options: opts };
  },
  phases: (r, cfg) => qr(cfg, 2.2),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Riddle ${r.i + 1} / ${tl.N}`, title: r.cat === 'movie' ? 'Guess the movie 🎬' : 'Guess the word 💭' } : { eyebrow: 'The answer', title: r.answer }),
  bottom: r => ({ options: r.options, since: 'q' }),
  cues: (r, seg) => (seg.phase === 'q' ? [{ t: 0.02, s: 'flip' }] : null),
  draw: (ctx, r, s) => drawRebus(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawRebus(ctx, tl.rounds[0], R, { phase: 'art', local: 9, th: tl.theme }),
  outro: { title: 'How many did you crack?', labels: ['Emoji genius 🧠', 'Great guesser 🎯', 'Not bad 🙂', 'Lost in translation 😅'], cta: 'Comment your score 👇' },
});

// ---------------------------------------------------------------------
// 11. Emoji Math
// ---------------------------------------------------------------------
const EM_ITEMS = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍉', '🍍', '🥝', '🍋', '🍑', '🥕', '🌽', '🍔', '⚽', '🐱', '🐶', '🍩', '🌵'];
function emTokens(spec, sym) { return spec.map(t => (t === '+' || t === '×' || t === '−' ? t : sym[t])); }
function drawEmojiMath(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase, reveal = ph === 'reveal', rp = reveal ? eOut(clamp(s.local / 0.4)) : 0;
  stage(ctx, R, th, u);
  const rows = r.lines.length + 1, top = R.y + 40 * u, rowH = (R.h - 190 * u) / rows, es = Math.min(rowH * 0.62, 120 * u);
  const appear = ph === 'q' ? s.local : 9;
  const all = [...r.lines.map(l => ({ tok: l.tok, val: String(l.val) })), { tok: r.final.tok, val: reveal ? String(r.ans) : '?', fin: true }];
  setFont(ctx, 800, es * 0.72, th.fam);
  all.forEach((ln, j) => {
    const items = [...ln.tok.map(t => ({ t, w: t.length <= 2 && !/\p{Extended_Pictographic}/u.test(t) ? es * 0.62 : es })), { t: '=', w: es * 0.62 }, { t: ln.val, w: ctx.measureText(ln.val).width + es * 0.1, val: true }];
    const sp = 14 * u; let tw = items.reduce((a, b) => a + b.w, 0) + sp * (items.length - 1), k = Math.min(1, (R.w - 70 * u) / tw);
    tw *= k;
    const cy = top + rowH * (j + 0.5), a = ph === 'art' ? 1 : clamp((appear - j * 0.12) / 0.3);
    if (a <= 0) return;
    if (ln.fin) { ctx.fillStyle = th.track; ctx.fillRect(R.x + 50 * u, top + rowH * j - 2 * u, R.w - 100 * u, 4 * u); }
    ctx.save(); scaleAround(ctx, R.x + R.w / 2, cy, lerp(0.92, 1, eOut(a))); ctx.globalAlpha *= a;
    let x = R.x + R.w / 2 - tw / 2;
    for (const it of items) {
      const w = it.w * k, cx = x + w / 2;
      if (it.val) {
        ctx.save(); if (ln.fin && reveal) scaleAround(ctx, cx, cy, lerp(1.5, 1, eBack(clamp(s.local / 0.4)))); setFont(ctx, 800, es * 0.78 * k, th.fam); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = ln.fin ? (reveal ? th.ok : th.accent) : th.ink; ctx.fillText(it.t, cx, cy + es * 0.04); ctx.restore();
      } else if (it.t.length <= 2 && !/\p{Extended_Pictographic}/u.test(it.t)) {
        setFont(ctx, 800, es * 0.72 * k, th.fam); ctx.fillStyle = th.sub; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(it.t, cx, cy + es * 0.04);
      } else drawEmoji(ctx, it.t, cx, cy, es * k);
      x += w + sp * k;
    }
    ctx.restore();
  });
  ctx.textBaseline = 'alphabetic';
  if (reveal) withAlpha(ctx, rp, () => {
    const by = R.y + R.h - 62 * u, parts = r.keys.map(q => ({ e: r.sym[q], v: String(r.vals[q]) })), cw = 150 * u, x0 = R.x + R.w / 2 - (cw * parts.length) / 2;
    parts.forEach((p, j) => { drawEmoji(ctx, p.e, x0 + j * cw + 30 * u, by, 56 * u); setFont(ctx, 800, 48 * u, th.fam); ctx.fillStyle = th.sub; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('= ' + p.v, x0 + j * cw + 68 * u, by + 3 * u); });
    ctx.textBaseline = 'alphabetic';
  });
}
defineTest({
  id: 'emojimath', name: 'Emoji Math', tag: 'Logic', eyebrow: 'Logic test',
  blurb: 'Work out what each emoji is worth, then solve the last line. Harder levels add a third emoji.',
  defaults: { rounds: 5, seconds: 8 }, roundsRange: [3, 8],
  hooks: ['Solve the emoji equations 🍎', 'Only 1 in 5 gets the last line', 'What is each emoji worth?', 'Emoji math in {S} seconds ⏱️'],
  gen(rng, i, N, diff) {
    const f = fOf(i, N), three = diff === 'expert' || (diff === 'hard' && f >= 0.3) || (diff === 'medium' && f >= 0.6);
    const picks = rShuffle(rng, EM_ITEMS.slice()).slice(0, three ? 3 : 2), keys = three ? ['A', 'B', 'C'] : ['A', 'B'], sym = {}, vals = {};
    keys.forEach((k, j) => { sym[k] = picks[j]; });
    let a, b, c, g = 0;
    do { a = rInt(rng, 2, 9); b = rInt(rng, 2, 9); c = rInt(rng, 2, 9); g++; } while ((a === b || b === c || a === c) && g < 40);
    vals.A = a; vals.B = b; if (three) vals.C = c;
    const L = [], T = (spec) => { const v = spec.reduce((acc, t, j) => acc, 0); return v; };
    const evalSpec = spec => { let nums = [], ops = []; spec.forEach(t => { if (t === '+' || t === '×' || t === '−') ops.push(t); else nums.push(vals[t]); }); let k = 0; while (k < ops.length) { if (ops[k] === '×') { nums.splice(k, 2, nums[k] * nums[k + 1]); ops.splice(k, 1); } else k++; } let v = nums[0]; ops.forEach((o, q) => { v = o === '+' ? v + nums[q + 1] : v - nums[q + 1]; }); return v; };
    const add = spec => L.push({ tok: emTokens(spec, sym), val: evalSpec(spec) });
    add(rPick(rng, [['A', '+', 'A', '+', 'A'], ['A', '+', 'A']]));
    add(rPick(rng, [['A', '+', 'B'], ['A', '+', 'B', '+', 'B']]));
    if (three) add(rPick(rng, [['B', '+', 'C', '+', 'C'], ['C', '+', 'C', '+', 'B']]));
    const fin = three ? rPick(rng, diff === 'expert' ? [['A', '×', 'B', '−', 'C'], ['C', '×', 'B', '+', 'A']] : [['A', '+', 'B', '+', 'C'], ['A', '×', 'B', '+', 'C']]) : rPick(rng, diff === 'easy' ? [['A', '+', 'B']] : [['A', '×', 'B'], ['B', '×', 'B', '+', 'A']]);
    const ans = evalSpec(fin);
    return { sym, vals, keys, lines: L, final: { tok: emTokens(fin, sym) }, ans, options: uniqNums(rng, ans, [ans + rInt(rng, 1, 3), ans - rInt(rng, 1, 4)]) };
  },
  phases: (r, cfg) => qr(cfg, 2.6),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Puzzle ${r.i + 1} / ${tl.N}`, title: 'What is the last line?' } : { eyebrow: 'Answer', title: `= ${r.ans}` }),
  bottom: r => ({ options: r.options, since: 'q' }),
  cues: (r, seg) => (seg.phase === 'q' ? [{ t: 0.02, s: 'flip' }] : null),
  draw: (ctx, r, s) => drawEmojiMath(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawEmojiMath(ctx, tl.rounds[0], R, { phase: 'art', local: 9, th: tl.theme }),
  outro: { title: 'How many did you solve?', labels: ['Fruit genius 🍎', 'Sharp mind 🧠', 'Almost there 🙂', 'Too fruity 🍌'], cta: 'Comment your score 👇' },
  introChip: tl => `${tl.N} puzzles · ${tl.cfg.seconds} sec each`,
});

// ---------------------------------------------------------------------
// 12. Number Patterns
// ---------------------------------------------------------------------
const PAT = {
  add: rng => { const d = rInt(rng, 2, 9), s = rInt(rng, 1, 20); return { seq: [0, 1, 2, 3, 4, 5].map(k => s + d * k), rule: `+${d} each time` }; },
  sub: rng => { const d = rInt(rng, 2, 9), s = d * 5 + rInt(rng, 2, 20); return { seq: [0, 1, 2, 3, 4, 5].map(k => s - d * k), rule: `−${d} each time` }; },
  mul: rng => { const q = rPick(rng, [2, 3]), s = rInt(rng, 1, q === 3 ? 3 : 5); return { seq: [0, 1, 2, 3, 4, 5].map(k => s * Math.pow(q, k)), rule: `×${q} each time` }; },
  half: rng => { const s = rPick(rng, [32, 64, 96]); return { seq: [0, 1, 2, 3, 4, 5].map(k => s / Math.pow(2, k)), rule: '÷2 each time' }; },
  grow: rng => { const s = rInt(rng, 1, 10), seq = [s]; for (let k = 1; k < 6; k++) seq.push(seq[k - 1] + k); return { seq, rule: 'Adds 1, then 2, then 3…' }; },
  sq: rng => { const n0 = rInt(rng, 1, 5); return { seq: [0, 1, 2, 3, 4, 5].map(k => (n0 + k) * (n0 + k)), rule: 'Square numbers' }; },
  cube: () => ({ seq: [1, 8, 27, 64, 125, 216], rule: 'Cube numbers' }),
  fib: rng => { const a = rInt(rng, 1, 4), b = rInt(rng, 2, 6), seq = [a, b]; for (let k = 2; k < 6; k++) seq.push(seq[k - 1] + seq[k - 2]); return { seq, rule: 'Add the two numbers before' }; },
  alt: rng => { const a = rInt(rng, 5, 9), b = rInt(rng, 1, 3), s = rInt(rng, 3, 12), seq = [s]; for (let k = 1; k < 6; k++) seq.push(seq[k - 1] + (k % 2 ? a : -b)); return { seq, rule: `+${a}, −${b}, repeat` }; },
  dbl1: rng => { const s = rInt(rng, 1, 3), seq = [s]; for (let k = 1; k < 6; k++) seq.push(k % 2 ? seq[k - 1] * 2 : seq[k - 1] + 1); return { seq, rule: '×2, then +1, repeat' }; },
  prime: () => ({ seq: [2, 3, 5, 7, 11, 13], rule: 'Prime numbers' }),
  inter: rng => { const a0 = rInt(rng, 1, 5), da = rInt(rng, 2, 4), b0 = rInt(rng, 10, 20), db = rPick(rng, [5, 10]); return { seq: [a0, b0, a0 + da, b0 + db, a0 + 2 * da, b0 + 2 * db], rule: 'Two patterns take turns' }; },
};
const patPool = (diff, f) => ({
  easy: f < 0.6 ? ['add', 'sub'] : ['add', 'sub', 'half', 'grow'],
  medium: f < 0.5 ? ['add', 'sub', 'mul', 'half', 'sq'] : ['grow', 'sq', 'mul', 'fib', 'alt'],
  hard: f < 0.4 ? ['grow', 'sq', 'mul', 'alt'] : ['fib', 'cube', 'inter', 'alt', 'sq'],
  expert: ['fib', 'cube', 'inter', 'alt', 'dbl1', 'prime'],
}[diff]);
function drawPattern(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase, reveal = ph === 'reveal', rp = reveal ? eOut(clamp(s.local / 0.35)) : 0;
  stage(ctx, R, th, u);
  const gap = 26 * u, pad = 48 * u, bw = (R.w - pad * 2 - gap * 2) / 3, bh = 262 * u, y0 = R.y + 96 * u;
  const appear = ph === 'q' ? s.local : 9;
  for (let j = 0; j < 6; j++) {
    const col = j % 3, row = Math.floor(j / 3), x = R.x + pad + col * (bw + gap), y = y0 + row * (bh + gap), last = j === 5;
    const a = ph === 'art' ? 1 : clamp((appear - j * 0.07) / 0.3); if (a <= 0) continue;
    const win = last && reveal;
    ctx.save(); scaleAround(ctx, x + bw / 2, y + bh / 2, lerp(0.7, 1, eBack(a)) * (win ? lerp(1, 1.05, rp) : 1)); ctx.globalAlpha *= clamp(a * 1.5);
    fillRR(ctx, x, y, bw, bh, 34 * u, th.bg[0]);
    ctx.lineWidth = (last ? 7 : 3) * u; ctx.strokeStyle = last && !reveal ? th.accent : th.track; rr(ctx, x, y, bw, bh, 34 * u); ctx.stroke();
    if (win) withAlpha(ctx, rp, () => fillRR(ctx, x, y, bw, bh, 34 * u, th.ok));
    const txt = last && !reveal ? '?' : fmtNum(r.seq[j]), f = fitText(measureCtx, txt, { maxW: Math.round(bw - 30 * u), maxH: Math.round(150 * u), maxLines: 1, max: Math.round(112 * u), min: Math.round(36 * u), weight: 800, fam: th.fam, lh: 1 });
    setFont(ctx, 800, f.size, th.fam); ctx.fillStyle = win && rp > 0.5 ? th.okInk : last ? th.accent : th.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x + bw / 2, y + bh / 2 + 4 * u); ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
  if (reveal) withAlpha(ctx, rp, () => { setFont(ctx, 700, 42 * u, th.fam); ctx.fillStyle = th.sub; ctx.textAlign = 'center'; ctx.fillText(r.rule, R.x + R.w / 2, R.y + R.h - 56 * u); });
}
defineTest({
  id: 'pattern', name: 'Number Patterns', tag: 'Logic', eyebrow: 'Logic test',
  blurb: 'What number comes next? Starts with simple steps and ends with sneaky rules.',
  defaults: { rounds: 6, seconds: 8 }, roundsRange: [3, 10],
  hooks: ['What number comes next? 🔢', 'Crack the pattern in {S} seconds', 'Only 1 in 4 gets the last one', 'Number patterns get weird 😵'],
  shared: vr => ({ off: Math.floor(vr() * 7) }),
  gen(rng, i, N, diff, sh) {
    const pool = patPool(diff, fOf(i, N)), g = PAT[pool[(i + sh.off) % pool.length]](rng), ans = g.seq[5], d = g.seq[5] - g.seq[4];
    return { seq: g.seq, ans, rule: g.rule, options: uniqNums(rng, ans, [ans + (Math.abs(d) > 1 ? Math.sign(d || 1) * rInt(rng, 1, 3) : rInt(rng, 1, 3)), ans - rInt(rng, 1, 4)]) };
  },
  phases: (r, cfg) => qr(cfg, 2.4),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Pattern ${r.i + 1} / ${tl.N}`, title: 'What comes next?' } : { eyebrow: 'The rule', title: r.rule }),
  bottom: r => ({ options: r.options, since: 'q' }),
  cues: (r, seg) => (seg.phase === 'q' ? [{ t: 0.02, s: 'flip' }] : null),
  draw: (ctx, r, s) => drawPattern(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawPattern(ctx, tl.rounds[0], R, { phase: 'art', local: 9, th: tl.theme }),
  outro: { title: 'How many patterns did you crack?', labels: ['Pattern master 🧩', 'Sharp brain 🧠', 'Getting there 🙂', 'Patterns won 😅'], cta: 'Comment your score 👇' },
});

// ---------------------------------------------------------------------
// 13. Word Scramble
// ---------------------------------------------------------------------
const SCR_WORDS = {
  animal: ['LION', 'BEAR', 'FROG', 'DUCK', 'WOLF', 'TIGER', 'SNAKE', 'MOUSE', 'HORSE', 'SHEEP', 'ZEBRA', 'PANDA', 'KOALA', 'MONKEY', 'TURTLE', 'RABBIT', 'DONKEY', 'PARROT', 'OCTOPUS', 'PENGUIN', 'DOLPHIN', 'CHICKEN', 'GIRAFFE', 'LOBSTER', 'ELEPHANT', 'KANGAROO'],
  food: ['CAKE', 'MILK', 'SOUP', 'FISH', 'RICE', 'CORN', 'APPLE', 'PIZZA', 'LEMON', 'BREAD', 'PASTA', 'GRAPE', 'MANGO', 'SALAD', 'BANANA', 'ORANGE', 'COOKIE', 'BUTTER', 'CHEESE', 'NOODLE', 'AVOCADO', 'PANCAKE', 'CUPCAKE', 'PRETZEL', 'SANDWICH', 'BROCCOLI', 'MUSHROOM'],
  thing: ['MOON', 'STAR', 'BOOK', 'RAIN', 'CLOUD', 'BEACH', 'PLANT', 'RIVER', 'OCEAN', 'PLANET', 'GARDEN', 'SUMMER', 'WINTER', 'CASTLE', 'RAINBOW', 'LIBRARY', 'SUNRISE', 'KITCHEN', 'MOUNTAIN', 'BIRTHDAY', 'NOTEBOOK'],
};
const SCR_LABEL = { animal: 'an animal 🐾', food: 'food 🍽️', thing: 'a thing ✨' };
const SCR_LEN = { easy: [4, 5], medium: [5, 6], hard: [6, 7], expert: [7, 8] };
function drawScramble(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase, n = r.word.length;
  stage(ctx, R, th, u);
  const gap = 14 * u, size = Math.min(128 * u, (R.w - 60 * u - gap * (n - 1)) / n), total = size * n + gap * (n - 1), x0 = R.x + R.w / 2 - total / 2, cy = R.y + R.h * 0.43;
  const mv = ph === 'reveal' ? eInOut(clamp((s.local - 0.15) / 0.9)) : ph === 'art' ? 0 : 0, done = ph === 'reveal' && s.local > 1.05;
  for (let j = 0; j < n; j++) {
    const a = ph === 'q' ? clamp((s.local - j * 0.05) / 0.25) : 1; if (a <= 0) continue;
    const slot = lerp(j, r.perm[j], mv), x = x0 + slot * (size + gap), y = cy - size / 2 - Math.sin(mv * Math.PI) * 26 * u * (j % 2 ? 1 : -1);
    ctx.save(); scaleAround(ctx, x + size / 2, y + size / 2, lerp(0.6, 1, eBack(a))); ctx.globalAlpha *= clamp(a * 1.5);
    shadowRR(ctx, x, y, size, size, 22 * u, done ? th.ok : th.bg[0], th.shadow, 14 * u, 5 * u);
    ctx.lineWidth = 3 * u; ctx.strokeStyle = th.track; if (!done) { rr(ctx, x, y, size, size, 22 * u); ctx.stroke(); }
    setFont(ctx, 800, size * 0.6, th.fam); ctx.fillStyle = done ? th.okInk : th.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(r.word[r.perm[j]], x + size / 2, y + size / 2 + size * 0.04); ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
  setFont(ctx, 700, 44 * u, th.fam); ctx.fillStyle = th.sub; ctx.textAlign = 'center';
  ctx.fillText(`Hint: it’s ${SCR_LABEL[r.cat]}`, R.x + R.w / 2, R.y + R.h * 0.72);
}
defineTest({
  id: 'scramble', name: 'Word Scramble', tag: 'Words', eyebrow: 'Word game',
  blurb: 'Letters are mixed up. Unscramble the word before the timer ends. The tiles slide into place at the reveal.',
  defaults: { rounds: 6, seconds: 6 }, roundsRange: [3, 10],
  options: [{ id: 'theme', label: 'Theme', choices: [['mixed', 'Mixed'], ['animal', 'Animals'], ['food', 'Food']] }],
  hooks: ['Unscramble the word 🔤', 'Can you read the mixed-up words?', 'Unscramble it in {S} seconds ⏱️', 'Your brain vs. {N} scrambled words'],
  shared(vr, N, cfg, opts) {
    const theme = (opts && opts.theme) || 'mixed', cats = theme === 'mixed' ? rShuffle(vr, ['animal', 'food', 'thing']) : [theme], used = {};
    return { cats, off: Math.floor(vr() * 3), used };
  },
  gen(rng, i, N, diff, sh) {
    const f = fOf(i, N), [a, b] = SCR_LEN[diff], len = Math.round(lerp(a, b, f)), cat = sh.cats[i % sh.cats.length];
    let pool = SCR_WORDS[cat].filter(w => Math.abs(w.length - len) <= 0 && true); if (pool.length < 3) pool = SCR_WORDS[cat].filter(w => Math.abs(w.length - len) <= 1);
    const word = rPick(rng, pool), all = [].concat(...Object.values(SCR_WORDS)).filter(w => w !== word && Math.abs(w.length - word.length) <= 1);
    let perm, g = 0; do { perm = rShuffle(rng, word.split('').map((_, k) => k)); g++; } while (g < 60 && (perm.every((p, k) => p === k) || perm.map(p => word[p]).join('') === word));
    const options = rShuffle(rng, [word, ...rShuffle(rng, all).slice(0, 2)]).map(w => ({ label: w[0] + w.slice(1).toLowerCase(), correct: w === word }));
    return { word, perm, cat, options };
  },
  phases: (r, cfg) => qr(cfg, 2.4),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Word ${r.i + 1} / ${tl.N}`, title: 'Unscramble the word' } : { eyebrow: 'The word is', title: r.word[0] + r.word.slice(1).toLowerCase() }),
  bottom: r => ({ options: r.options, since: 'q' }),
  cues: (r, seg) => (seg.phase === 'q' ? [{ t: 0.02, s: 'flip' }] : null),
  draw: (ctx, r, s) => drawScramble(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawScramble(ctx, tl.rounds[0], R, { phase: 'art', local: 0, th: tl.theme }),
  outro: { title: 'How many did you unscramble?', labels: ['Word wizard 🧙', 'Sharp reader 📖', 'Not bad 🙂', 'Letters won 😵'], cta: 'Comment your score 👇' },
});

// ---------------------------------------------------------------------
// 14. What Vanished
// ---------------------------------------------------------------------
const VAN_DIMS = [[3, 2], [3, 3], [4, 3], [4, 4]];
function drawVanish(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase, [cols, rows] = r.dims, gap = 18 * u, cell = Math.min((R.w - gap * (cols - 1)) / cols, (R.h - gap * (rows - 1)) / rows), rad = cell * 0.18;
  const gw = cols * cell + gap * (cols - 1), gh = rows * cell + gap * (rows - 1), gx = R.x + (R.w - gw) / 2, gy = R.y + (R.h - gh) / 2;
  for (let k = 0; k < cols * rows; k++) {
    const x = gx + (k % cols) * (cell + gap), y = gy + Math.floor(k / cols) * (cell + gap), cx = x + cell / 2, cy = y + cell / 2, miss = k === r.missing;
    let sc = 1, a = 1;
    if (ph === 'mem') { a = clamp((s.local - k * 0.03) / 0.25); sc = lerp(0.6, 1, eBack(a)); }
    else if (ph === 'q' && miss) { const v = clamp(s.local / 0.4); sc = 1 - eIn(v); a = 1 - v; }
    else if (ph === 'reveal') { a = miss ? 1 : lerp(1, 0.4, eOut(clamp(s.local / 0.3))); sc = miss ? lerp(0.4, 1, eBack(clamp((s.local - 0.1) / 0.4))) : 1; }
    if (ph === 'q' && miss || ph === 'reveal' && miss) {
      const gl = ph === 'q' ? lerp(0.35, 0.8, 0.5 + 0.5 * Math.sin(s.t * 6)) * clamp((s.local - 0.3) / 0.2) : 1 - clamp(s.local / 0.25);
      withAlpha(ctx, gl, () => { ctx.save(); ctx.setLineDash([16 * u, 12 * u]); ctx.lineWidth = 6 * u; ctx.lineCap = 'round'; ctx.strokeStyle = th.accent; rr(ctx, x, y, cell, cell, rad); ctx.stroke(); ctx.restore(); });
    }
    if (a <= 0.01 || sc <= 0.02) continue;
    ctx.save(); scaleAround(ctx, cx, cy, sc); ctx.globalAlpha *= clamp(a * 1.5);
    shadowRR(ctx, x, y, cell, cell, rad, th.card, th.shadow, 18 * u, 6 * u);
    drawEmoji(ctx, r.items[k], cx, cy, cell * 0.56);
    ctx.restore();
    if (ph === 'reveal' && miss) withAlpha(ctx, clamp((s.local - 0.2) / 0.2), () => { ctx.lineWidth = 11 * u; ctx.strokeStyle = th.ok; rr(ctx, x - 9 * u, y - 9 * u, cell + 18 * u, cell + 18 * u, rad + 9 * u); ctx.stroke(); });
  }
}
defineTest({
  id: 'vanish', name: 'What Vanished?', tag: 'Memory', eyebrow: 'Memory test',
  blurb: 'Memorize a board of emoji. One disappears. Which one was it? The pick list only shows emoji that are no longer on the board.',
  defaults: { rounds: 5, seconds: 5 }, roundsRange: [3, 8],
  hooks: ['One of them vanished… which one? 👀', 'Test your memory 🧠', 'Spot what disappeared', 'Goldfish or genius? 🐟'],
  gen(rng, i, N, diff) {
    const f = fOf(i, N), rg = { easy: [0, 1], medium: [1, 2], hard: [1, 3], expert: [2, 3] }[diff], dims = VAN_DIMS[Math.round(lerp(rg[0], rg[1], f))], cells = dims[0] * dims[1];
    const pool = rShuffle(rng, MEM_POOL.slice()), items = pool.slice(0, cells), missing = Math.floor(rng() * cells), decoys = pool.slice(cells, cells + 3);
    const options = rShuffle(rng, [items[missing], ...decoys]).map(e => ({ label: e, correct: e === items[missing] }));
    return { dims, items, missing, options, mem: 2.5 + cells * 0.2 + { easy: 1, medium: 0.5, hard: 0, expert: -0.3 }[diff] };
  },
  phases: (r, cfg) => [{ kind: 'mem', dur: Math.round(r.mem * 2) / 2, timer: true, mode: 'mem', ticks: false }, { kind: 'q', dur: cfg.seconds, timer: true }, { kind: 'reveal', dur: 2.0 }],
  header: (r, ph, tl) => (ph === 'mem' ? { eyebrow: `Round ${r.i + 1} / ${tl.N} · memorize`, title: 'Memorize them all 🧠' } : ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: 'Which one vanished?' } : { eyebrow: 'It was', title: r.items[r.missing] }),
  bottom: (r, ph) => (ph === 'mem' ? null : { options: r.options, since: 'q', emoji: true }),
  cues: (r, seg) => (seg.phase === 'q' ? [{ t: 0.0, s: 'pop' }] : seg.phase === 'reveal' ? [{ t: 0.1, s: 'flip' }] : null),
  draw: (ctx, r, s) => drawVanish(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawVanish(ctx, tl.rounds[0], R, { phase: 'mem', local: 9, th: tl.theme, t: 0 }),
  outro: { title: 'How many did you catch?', labels: ['Photographic memory 📸', 'Great memory 🧠', 'Pretty average 🙂', 'Goldfish mode 🐟'] },
  introChip: tl => `${tl.N} rounds · memorize, then spot it`,
});

// ---------------------------------------------------------------------
// 15. More Dots
// ---------------------------------------------------------------------
const DOT_COL = { blue: ['#3B82F6', '🔵'], orange: ['#F7931E', '🟠'] };
function dotsPlace(rng, n, W0, H0, dmin, dmax) {
  for (const sc of [1, 0.9, 0.8, 0.7, 0.6]) { const pos = placeItems(rng, n, W0, H0, dmin * sc, dmax * sc); if (pos.length >= n) return pos.slice(0, n); }
  return placeItems(rng, n, W0, H0, dmin * 0.5, dmax * 0.5);
}
function drawDots(ctx, r, R, s) {
  const u = R.w / 820, th = s.th, ph = s.phase, reveal = ph === 'reveal', rp = reveal ? eOut(clamp(s.local / 0.35)) : 0;
  stage(ctx, R, th, u);
  if (r.mode === 'twin') {
    const pw = 370, ox = [R.x + 24 * u, R.x + R.w - 24 * u - pw * u], oy = R.y + 24 * u;
    ctx.save(); ctx.strokeStyle = th.track; ctx.lineWidth = 4 * u; line(ctx, R.x + R.w / 2, R.y + 40 * u, R.x + R.w / 2, R.y + R.h - 40 * u); ctx.restore();
    ['L', 'R'].forEach((side, q) => {
      const win = r.winner === side, dots = r.dots[side];
      const dim = reveal && !win ? lerp(1, 0.35, rp) : 1;
      withAlpha(ctx, dim, () => { ctx.fillStyle = th.accent; dots.forEach((d, j) => { const a = ph === 'q' || ph === 'art' ? (ph === 'art' ? 1 : clamp((s.local - j * 0.004) / 0.2)) : 1; withAlpha(ctx, a, () => circle(ctx, ox[q] + d.x * u, oy + d.y * u, d.s * u * 0.5)); }); });
      if (reveal) withAlpha(ctx, clamp((s.local - 0.25) / 0.25), () => {
        const by = R.y + R.h - 70 * u, bx = ox[q] + (pw * u) / 2;
        fillRR(ctx, bx - 70 * u, by - 40 * u, 140 * u, 80 * u, 40 * u, win ? th.ok : th.ink);
        setFont(ctx, 800, 52 * u, th.fam); ctx.fillStyle = win ? th.okInk : th.stage; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(r.counts[side]), bx, by + 3 * u); ctx.textBaseline = 'alphabetic';
      });
    });
  } else {
    const pad = 30 * u;
    r.dots.forEach((d, j) => {
      const a = ph === 'q' ? clamp((s.local - j * 0.004) / 0.2) : 1, win = d.c === r.winner, dim = reveal && !win ? lerp(1, 0.2, rp) : 1;
      withAlpha(ctx, a * dim, () => { ctx.fillStyle = DOT_COL[d.c][0]; circle(ctx, R.x + pad + d.x * u, R.y + pad + d.y * u, d.s * u * 0.5); });
    });
    if (reveal) withAlpha(ctx, clamp((s.local - 0.25) / 0.25), () => {
      ['blue', 'orange'].forEach((c, q) => {
        const win = c === r.winner, bx = R.x + R.w / 2 + (q ? 1 : -1) * 120 * u, by = R.y + R.h - 58 * u;
        fillRR(ctx, bx - 100 * u, by - 40 * u, 200 * u, 80 * u, 40 * u, win ? th.ok : th.ink);
        ctx.fillStyle = DOT_COL[c][0]; circle(ctx, bx - 56 * u, by, 20 * u);
        setFont(ctx, 800, 50 * u, th.fam); ctx.fillStyle = win ? th.okInk : th.stage; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(String(r.counts[c]), bx - 24 * u, by + 3 * u); ctx.textBaseline = 'alphabetic';
      });
    });
  }
}
defineTest({
  id: 'dots', name: 'More Dots', tag: 'Vision', eyebrow: 'Eye test',
  blurb: 'Which side has more dots? Or, in mix mode, which color wins? The gap gets smaller every round.',
  defaults: { rounds: 6, seconds: 4 }, roundsRange: [3, 10],
  options: [{ id: 'mode', label: 'Mode', choices: [['twin', 'Two clouds'], ['mix', 'Two colors']] }],
  hooks: ['Which side has more dots? 👀', 'Quick eye test: more dots or fewer?', 'Count with your eyes, not your finger', 'Only sharp eyes win {N}/{N}'],
  gen(rng, i, N, diff, sh, opts) {
    const f = fOf(i, N), mode = (opts && opts.mode) || 'twin';
    const rt = { easy: [1.45, 1.3], medium: [1.28, 1.16], hard: [1.18, 1.09], expert: [1.12, 1.055] }[diff], bs = { easy: [14, 20], medium: [20, 28], hard: [26, 36], expert: [30, 42] }[diff];
    let small = Math.round(lerp(bs[0], bs[1], f)); if (mode === 'mix') small = Math.round(small * 1.1);
    const big = Math.max(small + 2, Math.round(small * lerp(rt[0], rt[1], f))), flip = rng() < 0.5;
    if (mode === 'twin') {
      const nL = flip ? small : big, nR = flip ? big : small;
      const dots = { L: dotsPlace(rng, nL, 370, 650, 30, 44).map(d => ({ x: d.x, y: d.y, s: d.s })), R: dotsPlace(rng, nR, 370, 650, 30, 44).map(d => ({ x: d.x, y: d.y, s: d.s })) };
      return { mode, dots, counts: { L: nL, R: nR }, winner: nL > nR ? 'L' : 'R', options: [{ label: 'Left', correct: nL > nR }, { label: 'Right', correct: nR > nL }] };
    }
    const nB = flip ? small : big, nO = flip ? big : small, pos = dotsPlace(rng, nB + nO, 760, 650, 30, 44), cols = rShuffle(rng, [...Array(nB).fill('blue'), ...Array(nO).fill('orange')]);
    const dots = pos.map((d, j) => ({ x: d.x, y: d.y, s: d.s, c: cols[j] })), winner = nB > nO ? 'blue' : 'orange';
    return { mode, dots, counts: { blue: nB, orange: nO }, winner, options: [{ label: '🔵', correct: winner === 'blue' }, { label: '🟠', correct: winner === 'orange' }] };
  },
  phases: (r, cfg) => qr(cfg, 2.2),
  header: (r, ph, tl) => (ph === 'q' ? { eyebrow: `Round ${r.i + 1} / ${tl.N}`, title: r.mode === 'twin' ? 'Which side has more dots?' : 'Which color has more dots?' } : { eyebrow: 'The count', title: `${Math.max(...Object.values(r.counts))} vs ${Math.min(...Object.values(r.counts))}` }),
  bottom: r => ({ options: r.options, since: 'q', emoji: r.mode === 'mix' }),
  cues: (r, seg) => (seg.phase === 'q' ? [{ t: 0.02, s: 'flip' }] : null),
  draw: (ctx, r, s) => drawDots(ctx, r, s.rect, s),
  art: (ctx, R, tl) => drawDots(ctx, tl.rounds[0], R, { phase: 'art', local: 9, th: tl.theme }),
  outro: { title: 'How many did you get?', labels: ['Eagle eyes 🦅', 'Sharp eyes 👀', 'Not bad 🙂', 'Too many dots 😵'], cta: 'Comment your score 👇' },
});
