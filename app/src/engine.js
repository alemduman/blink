// =====================================================================
// Blink Test Studio — video engine
// Every frame is a pure function of (timeline, t), so the same code
// drives the live preview, scrubbing and frame-exact MP4 export.
// All drawing happens in 1080×1920 video coordinates.
// =====================================================================
const W = 1080, H = 1920, FPS = 30;
const PLAY = { x: 130, y: 480, w: 820, h: 820 };        // square play area, clear of app buttons
const HDR = { x: 90, y: 250, w: 900, h: 196, r: 40 };    // header card
const TIMER_Y = 1330, BOTTOM_CY = 1414, HANDLE_Y = 1508;
const INTRO_DUR = 2.6, OUTRO_DUR = 3.9;
const FAM = {
  display: '"Bricolage Grotesque", "Instrument Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  round: '"Fredoka", "Bricolage Grotesque", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  mono: '"Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};
const EMOJI_FAM = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla","EmojiOne Color",sans-serif';

// ---------- math, easing, random
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const eOut = t => 1 - Math.pow(1 - t, 3);
const eIn = t => t * t * t;
const eInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const rInt = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const rPick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function rShuffle(rng, arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
const fmtTime = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

// ---------- color (sRGB <-> OKLab)
function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(c) { return '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
const toLin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const toSrgb = c => { c = Math.max(0, Math.min(1, c)); return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055); };
function rgbToOklab([r, g, b]) {
  r = toLin(r); g = toLin(g); b = toLin(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function oklabToRgb([L, a, b]) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
  return [toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)];
}
function oklch(L, C, h) { const r = h * Math.PI / 180; return rgbToHex(oklabToRgb([L, C * Math.cos(r), C * Math.sin(r)])); }
function shiftL(hex, d) { const lab = rgbToOklab(hexToRgb(hex)); lab[0] += d; return rgbToHex(oklabToRgb(lab)); }
function mixHex(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * t)); }
function luma(hex) { const [r, g, b] = hexToRgb(hex).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
const onColor = hex => (luma(hex) > 0.36 ? '#121418' : '#FFFFFF');

// ---------- drawing helpers
function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, color) { rr(ctx, x, y, w, h, r); ctx.fillStyle = color; ctx.fill(); }
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill(); }
function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function withAlpha(ctx, a, fn) { if (a <= 0.002) return; const p = ctx.globalAlpha; ctx.globalAlpha = p * Math.min(1, a); fn(); ctx.globalAlpha = p; }
function setFont(ctx, w, s, fam) { ctx.font = `${w} ${Math.max(1, Math.round(s))}px ${fam}`; }
// Canvas shadows ignore the transform, so scale them by the render scale.
function shadow(ctx, color, blur, oy) { const k = ctx.__k || 1; ctx.shadowColor = color; ctx.shadowBlur = blur * k; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = oy * k; }
function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
function scaleAround(ctx, cx, cy, s) { ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); }
// Rounded card + soft shadow, pre-rendered once as a sprite (shadow blur is the most expensive draw).
const cardCache = new Map();
function shadowRR(ctx, x, y, w, h, r, fill, shadowColor, blur, oy) {
  const W2 = Math.max(1, Math.round(w)), H2 = Math.max(1, Math.round(h)), b = Math.round(blur), o = Math.round(oy);
  const key = `${W2}|${H2}|${Math.round(r)}|${fill}|${shadowColor}|${b}|${o}`, pad = Math.ceil(b * 1.4 + Math.abs(o)) + 2;
  let c = cardCache.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = W2 + pad * 2; c.height = H2 + pad * 2;
    const g = c.getContext('2d'); g.shadowColor = shadowColor; g.shadowBlur = b; g.shadowOffsetY = o;
    rr(g, pad, pad, W2, H2, r); g.fillStyle = fill; g.fill();
    cardCache.set(key, c); if (cardCache.size > 48) cardCache.delete(cardCache.keys().next().value);
  }
  ctx.drawImage(c, x - pad, y - pad, W2 + pad * 2 + (w - W2), H2 + pad * 2 + (h - H2));
}

const measureCtx = document.createElement('canvas').getContext('2d');
const fitCache = new Map();
function wrapLines(ctx, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    const words = [];
    for (const w of para.split(/\s+/).filter(Boolean)) {
      if (words.length && !/[\p{L}\p{N}]/u.test(w)) words[words.length - 1] += ' ' + w; // keep emoji with the word before it
      else words.push(w);
    }
    let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (!cur || ctx.measureText(t).width <= maxW) cur = t; else { out.push(cur); cur = w; } }
    out.push(cur);
  }
  return out;
}
// Largest font size (step 2) that fits text into maxW × maxH within maxLines.
function fitText(ctx, text, o) {
  const key = [text, o.maxW, o.maxH, o.maxLines, o.max, o.min, o.weight, o.fam, o.lh].join('|');
  const hit = fitCache.get(key); if (hit) return hit;
  let res = null;
  for (let s = o.max; s >= o.min; s -= 2) {
    setFont(measureCtx, o.weight, s, o.fam);
    const lines = wrapLines(measureCtx, text, o.maxW);
    if (lines.length <= o.maxLines && lines.length * s * o.lh <= o.maxH && lines.every(l => measureCtx.measureText(l).width <= o.maxW)) { res = { size: s, lines }; break; }
  }
  if (!res) { setFont(measureCtx, o.weight, o.min, o.fam); res = { size: o.min, lines: wrapLines(measureCtx, text, o.maxW).slice(0, o.maxLines) }; }
  if (fitCache.size > 800) fitCache.clear();
  fitCache.set(key, res);
  return res;
}
// Lines centered on cx, block vertically centered in [top, top+h]; baseline tuned for cap height.
function drawBlock(ctx, f, cx, top, h, lh, color) {
  const lineH = f.size * lh, blockH = f.lines.length * lineH, y0 = top + (h - blockH) / 2;
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  f.lines.forEach((ln, i) => ctx.fillText(ln, cx, y0 + (i + 0.5) * lineH + f.size * 0.34));
}
function spaced(ctx, text, x, y, sp) {
  const chars = [...text]; const ws = chars.map(c => ctx.measureText(c).width);
  let cx = x - (ws.reduce((a, b) => a + b, 0) + sp * (chars.length - 1)) / 2;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => { ctx.fillText(c, cx, y); cx += ws[i] + sp; });
  ctx.textAlign = 'center';
}

// ---------- emoji sprites (rasterized once, drawn as images)
const spriteCache = new Map();
function emojiSprite(ch, size) {
  size = Math.max(8, Math.round(size / 2) * 2);
  const key = ch + '|' + size; let c = spriteCache.get(key);
  if (c) return c;
  const pad = Math.ceil(size * 0.3), S = size + pad * 2;
  c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.font = `${size}px ${EMOJI_FAM}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const m = g.measureText(ch);
  const asc = m.actualBoundingBoxAscent || size * 0.8, desc = m.actualBoundingBoxDescent || size * 0.15;
  g.fillText(ch, S / 2, S / 2 + (asc - desc) / 2);
  c.__size = size;
  spriteCache.set(key, c);
  if (spriteCache.size > 400) spriteCache.delete(spriteCache.keys().next().value);
  return c;
}
function drawEmoji(ctx, ch, cx, cy, size, alpha = 1, rot = 0, flip = false) {
  if (alpha <= 0.002) return;
  const sp = emojiSprite(ch, size), S = sp.width * size / sp.__size;
  const p = ctx.globalAlpha; ctx.globalAlpha = p * alpha;
  if (rot || flip) { ctx.save(); ctx.translate(cx, cy); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1); ctx.drawImage(sp, -S / 2, -S / 2, S, S); ctx.restore(); }
  else ctx.drawImage(sp, cx - S / 2, cy - S / 2, S, S);
  ctx.globalAlpha = p;
}

// ---------- video looks
const THEMES = [
  { id: 'cloud', name: 'Cloud', bg: ['#EFF3F8', '#D7DFEA'], card: '#FFFFFF', stage: '#FFFFFF', ink: '#141821', sub: 'rgba(20,24,33,0.52)', accent: '#FF4B3E', track: 'rgba(20,24,33,0.10)', fill: '#141821', ok: '#13A14C', shadow: 'rgba(30,45,70,0.13)', font: 'display' },
  { id: 'ink', name: 'Ink', bg: ['#1C2029', '#0B0C10'], card: '#262B36', stage: '#20242E', ink: '#F4F6F9', sub: 'rgba(244,246,249,0.56)', accent: '#FFD23F', track: 'rgba(255,255,255,0.13)', fill: '#F4F6F9', ok: '#3DDC84', shadow: 'rgba(0,0,0,0.38)', font: 'display' },
  { id: 'candy', name: 'Candy', bg: ['#FFE6F0', '#FFC4DB'], card: '#FFF7FB', stage: '#FFF7FB', ink: '#3D0B28', sub: 'rgba(61,11,40,0.55)', accent: '#7B2FF7', track: 'rgba(61,11,40,0.12)', fill: '#3D0B28', ok: '#0EA868', shadow: 'rgba(130,20,75,0.14)', font: 'round' },
  { id: 'matcha', name: 'Matcha', bg: ['#EAF1E0', '#CADBB7'], card: '#FAFCF6', stage: '#FAFCF6', ink: '#1D2A15', sub: 'rgba(29,42,21,0.55)', accent: '#F0532D', track: 'rgba(29,42,21,0.12)', fill: '#1D2A15', ok: '#1E9E4A', shadow: 'rgba(40,65,20,0.14)', font: 'display' },
  { id: 'dusk', name: 'Dusk', bg: ['#38225F', '#120B24'], card: '#2C2049', stage: '#251B40', ink: '#FFFFFF', sub: 'rgba(255,255,255,0.62)', accent: '#FF8AD8', track: 'rgba(255,255,255,0.15)', fill: '#FFFFFF', ok: '#4CF2C3', shadow: 'rgba(0,0,0,0.42)', font: 'round' },
  { id: 'lemon', name: 'Lemon', bg: ['#FFF7C4', '#FFE27A'], card: '#FFFEF6', stage: '#FFFEF6', ink: '#2B2200', sub: 'rgba(43,34,0,0.56)', accent: '#FF3D7F', track: 'rgba(43,34,0,0.12)', fill: '#2B2200', ok: '#0E9F5A', shadow: 'rgba(130,95,0,0.16)', font: 'display' },
];
THEMES.forEach(t => { t.fam = FAM[t.font]; t.okInk = onColor(t.ok); t.accentInk = onColor(t.accent); });

// ---------- sound effects (synthesized, royalty-free)
function noiseBuf(ac) {
  if (ac.__noise) return ac.__noise;
  const b = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.6), ac.sampleRate), d = b.getChannelData(0);
  let seed = 12345; for (let i = 0; i < d.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; d[i] = seed / 0x3fffffff - 1; }
  ac.__noise = b; return b;
}
function tone(ac, out, t, f, o = {}) {
  const a = o.a || 0.004, d = o.d || 0.2, pk = o.peak || 0.2;
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + a + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  osc.connect(g); g.connect(out); osc.start(t); osc.stop(t + a + d + 0.05);
}
function noise(ac, out, t, o = {}) {
  const dur = o.dur || 0.2, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf(ac); f.type = o.type || 'bandpass'; f.Q.value = o.q || 0.8;
  f.frequency.setValueAtTime(o.f0 || 500, t); f.frequency.exponentialRampToValueAtTime(o.f1 || 2500, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.peak || 0.1, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + dur + 0.05);
}
const SOUNDS = {
  tick: (ac, o, t) => tone(ac, o, t, 1500, { type: 'triangle', d: 0.05, peak: 0.11 }),
  tickHi: (ac, o, t) => { tone(ac, o, t, 2000, { type: 'triangle', d: 0.07, peak: 0.16 }); tone(ac, o, t, 1000, { type: 'sine', d: 0.05, peak: 0.06 }); },
  whoosh: (ac, o, t) => noise(ac, o, t, { dur: 0.3, peak: 0.08, f0: 300, f1: 2800 }),
  ding: (ac, o, t) => { tone(ac, o, t, 1046.5, { d: 0.9, peak: 0.16 }); tone(ac, o, t + 0.012, 1568, { d: 0.7, peak: 0.08 }); tone(ac, o, t, 523.25, { type: 'triangle', d: 0.35, peak: 0.07 }); },
  pop: (ac, o, t) => tone(ac, o, t, 760, { d: 0.12, peak: 0.2, f2: 240 }),
  flip: (ac, o, t) => noise(ac, o, t, { dur: 0.1, peak: 0.07, type: 'highpass', f0: 1800, f1: 5200, q: 0.5 }),
  blip: (ac, o, t, n) => tone(ac, o, t, 620 + (n || 0) * 70, { d: 0.09, peak: 0.13 }),
  intro: (ac, o, t) => [523.25, 659.25, 783.99].forEach((f, i) => tone(ac, o, t + i * 0.085, f, { type: 'triangle', d: 0.35, peak: 0.12 })),
  outro: (ac, o, t) => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, o, t + i * 0.09, f, { type: 'triangle', d: i === 3 ? 0.9 : 0.3, peak: 0.13 })),
};
function scheduleCues(ac, out, cues, fromT, at) {
  for (const c of cues) if (c.t >= fromT - 0.001) { try { SOUNDS[c.s](ac, out, at + (c.t - fromT), c.arg); } catch (e) { /* ignore a bad cue */ } }
}

// =====================================================================
// Timeline
// =====================================================================
const TESTS = {};
const TEST_ORDER = [];
function defineTest(def) { TESTS[def.id] = def; TEST_ORDER.push(def.id); }
const roundCache = new Map();
const sharedCache = new Map();
function cachePut(map, k, v, max) { map.set(k, v); if (map.size > max) map.delete(map.keys().next().value); }

function hookText(test, cfg, N) {
  const raw = (cfg.hook && cfg.hook.trim()) || test.hooks[0];
  return fillVars(raw, { N, S: cfg.seconds, K: test.kFor ? test.kFor(cfg) : 3 });
}
function fillVars(s, v) { return String(s).replace(/\{(\w)\}/g, (m, k) => (v[k] != null ? v[k] : m)); }

function buildTimeline(cfg, onlyFirst) {
  const test = TESTS[cfg.test];
  const theme = THEMES.find(t => t.id === cfg.theme) || THEMES[0];
  const N = clamp(Math.round(cfg.rounds), test.roundsRange[0], test.roundsRange[1]);
  const opts = (cfg.opts && cfg.opts[test.id]) || {};
  const optKey = JSON.stringify(opts);
  const sKey = `${test.id}|${cfg.seed}|${N}|${cfg.difficulty}|${optKey}`;
  let shared = sharedCache.get(sKey);
  if (!shared) { shared = test.shared ? test.shared(mulberry32(hashStr(sKey + '|shared')), N, cfg, opts) : {}; cachePut(sharedCache, sKey, shared, 24); }
  const rounds = [];
  const count = onlyFirst ? 1 : N;
  for (let i = 0; i < count; i++) {
    const key = `${sKey}|${i}`;
    let r = roundCache.get(key);
    if (!r) { r = test.gen(mulberry32(hashStr(key)), i, N, cfg.difficulty, shared, opts, cfg); r.i = i; cachePut(roundCache, key, r, 60); }
    rounds.push(r);
  }
  if (!onlyFirst) {
    // Keep pre-rendered plate images only for what is on screen now (they are ~3 MB each).
    const keep = new Set(rounds); if (shared.intro) keep.add(shared.intro);
    for (const r of roundCache.values()) if (r._img && !keep.has(r)) delete r._img;
    for (const sh of sharedCache.values()) if (sh.intro && sh.intro._img && !keep.has(sh.intro)) delete sh.intro._img;
  }
  const tl = { cfg, test, theme, N, rounds, shared, segs: [], spans: [], opts };
  let t = 0;
  if (cfg.intro && !onlyFirst) { tl.segs.push({ type: 'intro', start: 0, dur: INTRO_DUR }); t = INTRO_DUR; }
  rounds.forEach((r, i) => {
    const s0 = t;
    for (const p of test.phases(r, cfg)) {
      tl.segs.push({ type: 'round', round: i, phase: p.kind, start: t, dur: p.dur, timer: !!p.timer, mode: p.mode || '', ticks: p.timer && p.ticks !== false });
      t += p.dur;
    }
    tl.spans.push({ start: s0, end: t });
  });
  if (cfg.outro && !onlyFirst) { tl.segs.push({ type: 'outro', start: t, dur: OUTRO_DUR }); t += OUTRO_DUR; }
  tl.duration = t;
  tl.hook = hookText(test, cfg, N);
  tl.introHeader = introHeader(tl);
  tl.cues = cfg.sfx ? buildCues(tl) : [];
  return tl;
}
function introHeader(tl) {
  const f = fitText(measureCtx, tl.hook, { maxW: 800, maxH: 300, maxLines: 3, max: 92, min: 48, weight: 800, fam: tl.theme.fam, lh: 1.03 });
  return { ...f, h: Math.max(HDR.h, Math.round(96 + f.lines.length * f.size * 1.03 + 34)) };
}
function buildCues(tl) {
  const cues = [];
  for (const seg of tl.segs) {
    if (seg.type === 'intro') cues.push({ t: seg.start + 0.05, s: 'intro' });
    else if (seg.type === 'outro') cues.push({ t: seg.start + 0.05, s: 'outro' });
    else {
      const span = tl.spans[seg.round];
      if (Math.abs(seg.start - span.start) < 1e-6) cues.push({ t: seg.start + 0.02, s: 'whoosh' });
      if (seg.ticks) for (let k = 1; k < seg.dur - 0.05; k++) cues.push({ t: seg.start + k, s: seg.dur - k <= 3.01 ? 'tickHi' : 'tick' });
      if (seg.phase === 'reveal') cues.push({ t: seg.start, s: 'ding' });
      const extra = tl.test.cues ? tl.test.cues(tl.rounds[seg.round], seg, tl) : null;
      if (extra) for (const c of extra) cues.push({ t: seg.start + c.t, s: c.s, arg: c.arg });
    }
  }
  return cues.filter(c => c.t < tl.duration).sort((a, b) => a.t - b.t);
}
function findSeg(tl, t) {
  const s = tl.segs; let i = tl._si || 0;
  if (i >= s.length || s[i].start > t) i = 0;
  while (i < s.length - 1 && t >= s[i].start + s[i].dur) i++;
  tl._si = i; return s[i];
}

// =====================================================================
// Frame rendering
// =====================================================================
function drawFrame(ctx, tl, t) {
  t = clamp(t, 0, Math.max(0, tl.duration - 1e-4));
  const th = tl.theme;
  ctx.globalAlpha = 1; noShadow(ctx);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (!tl.segs.length) return;
  const seg = findSeg(tl, t);
  if (seg.type === 'intro') drawIntro(ctx, tl, seg, t);
  else if (seg.type === 'outro') drawOutro(ctx, tl, seg, t);
  else drawRound(ctx, tl, seg, t);
  if (tl.cfg.handle && seg.type !== 'outro') {
    setFont(ctx, 700, 36, th.fam); ctx.fillStyle = th.sub; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('@' + tl.cfg.handle, W / 2, HANDLE_Y);
  }
}
function headerCard(ctx, th, y, h, steady = true) {
  if (steady) shadowRR(ctx, HDR.x, y, HDR.w, h, HDR.r, th.card, th.shadow, 40, 12);
  else { ctx.save(); shadow(ctx, th.shadow, 40, 12); fillRR(ctx, HDR.x, y, HDR.w, h, HDR.r, th.card); ctx.restore(); }
}
function headerText(ctx, th, eyebrow, title, y, h, dy, color) {
  setFont(ctx, 700, 27, th.fam); ctx.fillStyle = th.sub; ctx.textBaseline = 'alphabetic';
  spaced(ctx, String(eyebrow).toUpperCase(), W / 2, y + 60 + dy, 4.5);
  const f = fitText(measureCtx, title, { maxW: 820, maxH: h - 106, maxLines: 2, max: 66, min: 34, weight: 800, fam: th.fam, lh: 1.05 });
  setFont(ctx, 800, f.size, th.fam);
  drawBlock(ctx, f, W / 2, y + 82 + dy, h - 82 - 22, 1.05, color || th.ink);
}
function drawTrack(ctx, th) { fillRR(ctx, PLAY.x, TIMER_Y, PLAY.w - 96, 18, 9, th.track); }
function drawTimer(ctx, th, rem, dur, mode) {
  const x = PLAY.x, w = PLAY.w - 96, h = 18, frac = clamp(rem / dur);
  fillRR(ctx, x, TIMER_Y, w, h, h / 2, th.track);
  const hot = mode !== 'mem' && rem <= 1.0;
  if (frac > 0.003) fillRR(ctx, x, TIMER_Y, Math.max(h, w * frac), h, h / 2, mode === 'mem' ? th.ok : hot ? th.accent : th.fill);
  setFont(ctx, 600, 46, FAM.mono); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hot ? th.accent : th.ink;
  ctx.fillText(String(Math.max(0, Math.ceil(rem - 1e-6))), PLAY.x + PLAY.w, TIMER_Y + h / 2 + 3);
  ctx.textBaseline = 'alphabetic';
}
function drawPill(ctx, th, text, cy, a, o = {}) {
  if (a <= 0.002) return;
  setFont(ctx, 700, o.size || 40, th.fam);
  const w = Math.min(PLAY.w + 40, ctx.measureText(text).width + 88), h = o.h || 92, x = W / 2 - w / 2;
  ctx.save();
  scaleAround(ctx, W / 2, cy, lerp(0.7, 1, eBack(clamp(a))));
  ctx.globalAlpha *= clamp(a * 1.5);
  if (!o.flat) shadowRR(ctx, x, cy - h / 2, w, h, h / 2, o.fill || th.card, th.shadow, 24, 8);
  else fillRR(ctx, x, cy - h / 2, w, h, h / 2, o.fill || th.card);
  ctx.fillStyle = o.color || th.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, cy + 3);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}
function drawOptions(ctx, th, b, phase, local) {
  const opts = b.options, n = opts.length, gap = 18, h = 104;
  const cw = Math.min(b.emoji ? 150 : 250, (PLAY.w - gap * (n - 1)) / n);
  const total = cw * n + gap * (n - 1), x0 = W / 2 - total / 2, cy = BOTTOM_CY;
  const appear = phase === b.since ? clamp(local / 0.45) : 1;
  const reveal = phase === 'reveal', rp = reveal ? eOut(clamp(local / 0.3)) : 0;
  opts.forEach((o, j) => {
    const a = clamp(appear * 1.7 - j * 0.18);
    if (a <= 0) return;
    const x = x0 + j * (cw + gap), ccx = x + cw / 2, win = reveal && o.correct;
    ctx.save();
    scaleAround(ctx, ccx, cy, lerp(0.55, 1, eBack(a)) * (win ? lerp(1, 1.06, eBack(rp)) : 1));
    ctx.globalAlpha *= clamp(a * 1.5) * (reveal && !o.correct ? lerp(1, 0.3, rp) : 1);
    shadowRR(ctx, x, cy - h / 2, cw, h, 30, th.card, th.shadow, 18, 6);
    if (win) withAlpha(ctx, rp, () => fillRR(ctx, x, cy - h / 2, cw, h, 30, th.ok));
    if (b.emoji) {
      drawEmoji(ctx, o.label, ccx, cy, 62);
    } else {
      const label = win && rp > 0.5 ? '✓ ' + o.label : o.label;
      const f = fitText(measureCtx, label, { maxW: cw - 24, maxH: h - 20, maxLines: 1, max: 48, min: 26, weight: 800, fam: th.fam, lh: 1 });
      setFont(ctx, 800, f.size, th.fam); ctx.fillStyle = win && rp > 0.5 ? th.okInk : th.ink;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(f.lines[0], ccx, cy + 3); ctx.textBaseline = 'alphabetic';
    }
    if (win && b.emoji && rp > 0.3) {
      const bx = x + cw - 10, by = cy - h / 2 + 10;
      withAlpha(ctx, rp, () => { ctx.fillStyle = th.ok; circle(ctx, bx, by, 22); ctx.strokeStyle = th.okInk; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(bx - 9, by + 1); ctx.lineTo(bx - 2, by + 8); ctx.lineTo(bx + 10, by - 7); ctx.stroke(); });
    }
    ctx.restore();
  });
}
function drawRound(ctx, tl, seg, t) {
  const th = tl.theme, test = tl.test, r = tl.rounds[seg.round], span = tl.spans[seg.round];
  const local = t - seg.start, rt = t - span.start;
  const delay = seg.round === 0 && tl.cfg.intro ? 0.24 : 0;
  const enter = eOut(clamp((rt - delay) / 0.35));
  const exit = 1 - eIn(clamp((t - (span.end - 0.24)) / 0.24));
  const vis = Math.min(enter, exit);
  let hh = HDR.h;
  if (seg.round === 0 && tl.cfg.intro) hh = lerp(tl.introHeader.h, HDR.h, eInOut(clamp(rt / 0.42)));
  headerCard(ctx, th, HDR.y, hh, Math.abs(hh - HDR.h) < 0.5);
  const hd = test.header(r, seg.phase, tl);
  const ta = eOut(clamp(local / 0.28));
  withAlpha(ctx, ta * exit, () => headerText(ctx, th, hd.eyebrow, hd.title, HDR.y, hh, (1 - ta) * 16, hd.color));
  ctx.save();
  scaleAround(ctx, PLAY.x + PLAY.w / 2, PLAY.y + PLAY.h / 2, lerp(0.95, 1, enter));
  ctx.globalAlpha = vis;
  test.draw(ctx, r, { phase: seg.phase, local, dur: seg.dur, p: clamp(local / seg.dur), rect: PLAY, th, tl, t, seg });
  ctx.restore();
  noShadow(ctx); ctx.globalAlpha = 1;
  if (seg.timer) withAlpha(ctx, vis, () => drawTimer(ctx, th, Math.max(0, seg.dur - local), seg.dur, seg.mode));
  else withAlpha(ctx, vis * 0.55, () => drawTrack(ctx, th));
  const b = test.bottom ? test.bottom(r, seg.phase, tl) : null;
  if (b) withAlpha(ctx, vis, () => {
    if (b.options) drawOptions(ctx, th, b, seg.phase, local);
    else if (b.pill) drawPill(ctx, th, b.pill, BOTTOM_CY, clamp(local / 0.35));
  });
}
function drawIntro(ctx, tl, seg, t) {
  // Frame 0 is fully composed: platforms often use it as the cover.
  const th = tl.theme, local = t - seg.start, ih = tl.introHeader;
  const pop = eOut(clamp(local / 0.5)), outA = 1 - eIn(clamp((local - (seg.dur - 0.32)) / 0.32));
  ctx.save();
  scaleAround(ctx, W / 2, HDR.y + ih.h / 2, lerp(0.97, 1, pop));
  headerCard(ctx, th, HDR.y, ih.h);
  withAlpha(ctx, outA, () => {
    setFont(ctx, 700, 27, th.fam); ctx.fillStyle = th.sub; ctx.textBaseline = 'alphabetic';
    spaced(ctx, tl.test.eyebrow.toUpperCase(), W / 2, HDR.y + 60, 4.5);
    setFont(ctx, 800, ih.size, th.fam);
    drawBlock(ctx, ih, W / 2, HDR.y + 86, ih.h - 86 - 26, 1.03, th.ink);
  });
  ctx.restore();
  const top = HDR.y + ih.h + 34, bottom = 1300, size = Math.min(PLAY.w, bottom - top);
  const rect = { x: W / 2 - size / 2, y: top + (bottom - top - size) / 2, w: size, h: size };
  ctx.save();
  scaleAround(ctx, W / 2, rect.y + size / 2, lerp(0.95, 1, eOut(clamp(local / 0.8))));
  ctx.globalAlpha = outA;
  tl.test.art(ctx, rect, tl, local);
  ctx.restore();
  noShadow(ctx);
  const chip = tl.test.introChip ? tl.test.introChip(tl) : `${tl.N} rounds · ${tl.cfg.seconds} sec each`;
  withAlpha(ctx, outA, () => drawPill(ctx, th, chip, BOTTOM_CY, 1, { size: 36, h: 84 }));
}
function makeTiers(N, labels) {
  const hi = Math.max(1, Math.ceil(N * 0.7)), mid = Math.max(1, Math.ceil(N * 0.4));
  const out = [{ range: `${N}/${N}`, label: labels[0], top: true }];
  if (hi <= N - 1) out.push({ range: hi === N - 1 ? `${hi}` : `${hi}–${N - 1}`, label: labels[1] });
  if (mid <= hi - 1) out.push({ range: mid === hi - 1 ? `${mid}` : `${mid}–${hi - 1}`, label: labels[2] });
  out.push({ range: mid - 1 <= 0 ? '0' : `0–${mid - 1}`, label: labels[3] });
  return out;
}
function drawOutro(ctx, tl, seg, t) {
  const th = tl.theme, local = t - seg.start, test = tl.test, o = test.outro;
  const inA = eOut(clamp(local / 0.35));
  headerCard(ctx, th, HDR.y, HDR.h);
  withAlpha(ctx, inA, () => headerText(ctx, th, 'Results', o.title, HDR.y, HDR.h, (1 - inA) * 16));
  const tiers = o.tiers ? o.tiers(tl.N) : makeTiers(tl.N, o.labels);
  const rowH = 148, noteH = o.note ? 64 : 0, cardH = tiers.length * rowH + 36 + noteH, cardY = PLAY.y + 6;
  withAlpha(ctx, inA, () => {
    shadowRR(ctx, PLAY.x, cardY, PLAY.w, cardH, 44, th.card, th.shadow, 40, 12);
  });
  tiers.forEach((tr, j) => {
    const a = eOut(clamp((local - 0.18 - j * 0.13) / 0.38));
    const y = cardY + 18 + j * rowH, cy = y + rowH / 2;
    withAlpha(ctx, a, () => {
      ctx.save(); ctx.translate((1 - a) * 40, 0);
      if (j > 0) { ctx.fillStyle = th.track; ctx.fillRect(PLAY.x + 44, y, PLAY.w - 88, 3); }
      const rf = fitText(measureCtx, tr.range, { maxW: 210, maxH: 90, maxLines: 1, max: 70, min: 40, weight: 800, fam: th.fam, lh: 1 });
      setFont(ctx, 800, rf.size, th.fam); ctx.fillStyle = tr.top ? th.accent : th.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(tr.range, PLAY.x + 52, cy + 4);
      const lf = fitText(measureCtx, tr.label, { maxW: PLAY.w - 330, maxH: 110, maxLines: 2, max: 46, min: 30, weight: 700, fam: th.fam, lh: 1.08 });
      setFont(ctx, 700, lf.size, th.fam); ctx.fillStyle = th.ink;
      const lh = lf.size * 1.08;
      lf.lines.forEach((ln, i) => ctx.fillText(ln, PLAY.x + 290, cy + 4 + (i - (lf.lines.length - 1) / 2) * lh));
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
      ctx.restore();
    });
  });
  if (o.note) withAlpha(ctx, eOut(clamp((local - 0.7) / 0.4)), () => {
    setFont(ctx, 600, 30, th.fam); ctx.fillStyle = th.sub; ctx.textAlign = 'center';
    ctx.fillText(o.note, W / 2, cardY + cardH - 34);
  });
  if (tl.cfg.handle) withAlpha(ctx, eOut(clamp((local - 0.8) / 0.4)), () => {
    const txt = `Follow @${tl.cfg.handle} for more tests`, ff = fitText(measureCtx, txt, { maxW: 900, maxH: 60, maxLines: 1, max: 40, min: 26, weight: 700, fam: th.fam, lh: 1 });
    setFont(ctx, 700, ff.size, th.fam); ctx.fillStyle = th.ink; ctx.textAlign = 'center';
    ctx.fillText(txt, W / 2, cardY + cardH + 88);
  });
  drawPill(ctx, th, o.cta || 'Comment your score 👇', BOTTOM_CY, clamp((local - 0.55) / 0.4), { fill: th.accent, color: th.accentInk, size: 42 });
}
