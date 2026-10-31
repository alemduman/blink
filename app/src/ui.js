// =====================================================================
// Studio UI: state, preview player, recording, captions
// =====================================================================
const $ = s => document.querySelector(s);
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- captions & hashtags
const CAPTIONS = {
  shade: {
    hooks: ['Can you find the different shade? 👀', 'Only 2% of people find all {N} 🎯', 'How good are your eyes, really?', 'Spot the odd color before the timer ends ⏱️', 'This color test gets brutal at the end 😵'],
    bodies: ['{N} rounds, {S} seconds each. One tile is a slightly different shade. Can you spot it every time?', 'Every round adds tiles and the difference gets smaller. Pausing counts as cheating 😏', 'Your eyes vs. {N} sneaky shades. Keep count of how many you get.'],
    tags: ['colortest', 'eyetest', 'colorchallenge', 'visiontest', 'oddoneout', 'eyesight', 'braingames', 'testyourself', 'colors', 'quiz'],
  },
  plate: {
    hooks: ['What do you see in the dots? 👀', 'Some people can’t see ANY of these', 'Quick color vision check 🌈', 'Can you read all {N} hidden plates?'],
    bodies: ['{N} dot plates, each one hides a number, letter or shape. Say it before the reveal!', 'Write the numbers you saw in the comments and compare with your friends.', 'The colors get closer with every plate. How far can you get?'],
    tags: ['colorblindtest', 'colorblind', 'colorvision', 'eyetest', 'whatdoyousee', 'visiontest', 'colortest', 'ishihara', 'quiz', 'challenge'],
    note: 'Just for fun, not a medical test.',
  },
  oddone: {
    hooks: ['Find the odd one out 🔎', 'Can you spot it in {S} seconds?', 'It gets harder every round 😵', 'Only sharp eyes finish this one'],
    bodies: ['{N} rounds. One symbol in every grid is different. Find it before time runs out!', 'The grid grows every round. Keep count of your score.', 'Easy at first… then the impostors get sneaky 👀'],
    tags: ['oddoneout', 'findtheoddoneout', 'spotit', 'eyetest', 'brainteaser', 'puzzle', 'emojichallenge', 'braingames', 'quiz', 'challenge'],
  },
  illusion: {
    hooks: ['Don’t trust your eyes 🤯', 'Your brain is lying to you', '{N} illusions that fool almost everyone', 'Which one is bigger? Think twice'],
    bodies: ['Pick your answer before the reveal. Then watch your brain get proven wrong.', '{N} classic optical illusions. How many fooled you?', 'Your eyes are fine. Your brain just loves shortcuts 🧠'],
    tags: ['opticalillusion', 'illusion', 'mindblown', 'braintricks', 'perception', 'mindtricks', 'eyetricks', 'brainteaser', 'science', 'didyouknow'],
  },
  memory: {
    hooks: ['Test your memory 🧠', 'Remember the grid… if you can', 'Goldfish or genius? 🐟', 'What was in the box?'],
    bodies: ['Memorize the grid, the tiles flip, then guess what was hiding in the glowing one.', '{N} rounds and the grid keeps growing. How many can you remember?', 'Only a few seconds to memorize each grid. No rewinding 😏'],
    tags: ['memorytest', 'memorygame', 'braintest', 'brainteaser', 'braingames', 'focus', 'mindgames', 'memory', 'quiz', 'challenge'],
  },
  stroop: {
    hooks: ['Say the COLOR, not the word 🎨', 'Your brain will glitch 😵‍💫', 'Most people fail level 3', 'Read the colors out loud. Fast.'],
    bodies: ['Say the color of each word out loud, not what it says. {N} levels, each one longer.', 'It’s called the Stroop effect: your brain reads words faster than it names colors.', 'Try it out loud. No mistakes allowed 😏'],
    tags: ['stroopeffect', 'braintest', 'colorchallenge', 'focus', 'braingames', 'brainteaser', 'mindgames', 'psychology', 'challenge', 'quiz'],
  },
  spotdiff: {
    hooks: ['Find {K} differences in {S} seconds 🔍', 'Can you spot them all?', 'Only 1 in 10 finds every difference', 'How fast are your eyes?'],
    bodies: ['Two pictures, {K} differences, {S} seconds. Go!', '{N} rounds of spot the difference. How many did you get without pausing?', 'Some are easy. Some are really sneaky 👀'],
    tags: ['spotthedifference', 'findthedifference', 'spotit', 'puzzle', 'brainteaser', 'eyetest', 'braingames', 'puzzlegame', 'challenge', 'quiz'],
  },
  math: {
    hooks: ['Solve these in {S} seconds ⏱️', 'Most people get the last one wrong', 'Quick math test 🧮', 'Can you beat the timer?'],
    bodies: ['{N} quick problems, {S} seconds each. No calculator!', 'Order of operations strikes again 😅 How many did you get?', 'Starts easy. The last ones start fights in the comments.'],
    tags: ['mathchallenge', 'quickmath', 'mentalmath', 'math', 'braintest', 'iqtest', 'mathtrick', 'brainteaser', 'quiz', 'challenge'],
  },
  count: {
    hooks: ['How fast can you count? 👀', 'Count them before they vanish', 'Blink and you’ll miss it', 'Quick count challenge'],
    bodies: ['The shapes flash for a moment, then disappear. How many did you catch?', '{N} rounds, and less time to look every round.', 'No pausing! Count fast and drop your score below.'],
    tags: ['countingchallenge', 'braintest', 'attentiontest', 'focus', 'quickcount', 'braingames', 'eyetest', 'speedtest', 'challenge', 'quiz'],
  },
  rebus: {
    hooks: ['Guess it from the emoji 🤔', 'Can you crack all {N} emoji riddles?', 'Movie or word? You have {S} seconds', 'Emoji riddles that break brains 🧠'],
    bodies: ['{N} emoji riddles. Movies and everyday words hiding in emoji. Guess before the reveal!', 'Easy ones first, then it gets tricky 😏 Write your score below.', 'No Googling. How many did you crack?'],
    tags: ['emojiriddle', 'emojichallenge', 'guessthemovie', 'guesstheemoji', 'emojigame', 'brainteaser', 'riddles', 'braingames', 'quiz', 'challenge'],
  },
  emojimath: {
    hooks: ['Solve the emoji equations 🍎', 'Only 1 in 5 gets the last line', 'What is each emoji worth?', 'Emoji math in {S} seconds ⏱️'],
    bodies: ['Work out what each emoji is worth, then solve the last line. {N} puzzles, {S} seconds each.', 'Looks easy until the third emoji shows up 😵', 'No calculator! Drop your answer below 👇'],
    tags: ['emojimath', 'mathpuzzle', 'brainteaser', 'mathchallenge', 'puzzle', 'iqtest', 'logicpuzzle', 'braingames', 'quiz', 'challenge'],
  },
  pattern: {
    hooks: ['What number comes next? 🔢', 'Crack the pattern in {S} seconds', 'Only 1 in 4 gets the last one', 'Number patterns get weird 😵'],
    bodies: ['{N} number patterns. Find the rule and pick what comes next.', 'Simple at first. Then the rules get sneaky 👀', 'Pause = cheating 😏 How many did you get?'],
    tags: ['numberpattern', 'iqtest', 'logicpuzzle', 'brainteaser', 'mathpuzzle', 'puzzle', 'braingames', 'brainchallenge', 'quiz', 'challenge'],
  },
  scramble: {
    hooks: ['Unscramble the word 🔤', 'Can you read the mixed-up words?', 'Unscramble it in {S} seconds ⏱️', 'Your brain vs. {N} scrambled words'],
    bodies: ['{N} scrambled words, {S} seconds each. Can you read them?', 'The letters are all there, just in the wrong order 😅', 'Say the word out loud before the reveal!'],
    tags: ['wordscramble', 'wordgame', 'unscramble', 'wordpuzzle', 'puzzle', 'brainteaser', 'braingames', 'vocabulary', 'quiz', 'challenge'],
  },
  vanish: {
    hooks: ['One of them vanished… which one? 👀', 'Test your memory 🧠', 'Spot what disappeared', 'Goldfish or genius? 🐟'],
    bodies: ['Memorize the board. Then one emoji disappears. Which one was it?', '{N} rounds and the board keeps growing. How many did you catch?', 'Only a few seconds to memorize. No rewinding 😏'],
    tags: ['memorytest', 'memorygame', 'whatchanged', 'braintest', 'attentiontest', 'focus', 'braingames', 'mindgames', 'quiz', 'challenge'],
  },
  dots: {
    hooks: ['Which side has more dots? 👀', 'Quick eye test: more dots or fewer?', 'Count with your eyes, not your finger', 'Only sharp eyes win {N}/{N}'],
    bodies: ['{N} rounds. Pick the side (or color) with more dots before the timer ends.', 'The gap gets smaller every round. Don’t count them one by one 😏', 'Your eyes vs. the dots. Drop your score below.'],
    tags: ['eyetest', 'visiontest', 'countingchallenge', 'attentiontest', 'brainteaser', 'braingames', 'perception', 'focus', 'quiz', 'challenge'],
  },
};
const CTAS = ['Comment your score 👇', 'Drop your score in the comments 👇', 'Tag a friend who needs to try this 👀', 'Save it and challenge a friend later 🔁', 'Be honest: how many did you get? 👇'];
const BROAD = { tiktok: ['challenge', 'quiz', 'fyp', 'viral'], instagram: ['reels', 'quiz', 'challenge', 'explore'], youtube: ['shorts', 'quiz', 'challenge'] };
const PLATFORM = {
  tiktok: { name: 'TikTok', max: 0, hint: 'TikTok has no hard limit, but 3–5 focused hashtags work best.' },
  instagram: { name: 'Instagram', max: 5, hint: 'Instagram allows up to 5 hashtags per Reel.' },
  youtube: { name: 'YouTube Shorts', max: 0, hint: 'Keep #shorts. YouTube ignores every hashtag if a video has more than 60.' },
};

// ---------- state
const DEFAULTS = { test: 'shade', rounds: 7, seconds: 4, difficulty: 'medium', theme: 'cloud', hook: '', hookIdx: 0, hookCustom: false, handle: 'fast.test.now', sfx: true, intro: true, outro: true, opts: { oddone: { style: 'mixed' } }, seed: 1 + Math.floor(Math.random() * 999999), platform: 'tiktok', capSeed: 1, safe: 'off' };
const state = (() => {
  const s = JSON.parse(JSON.stringify(DEFAULTS));
  try {
    const p = JSON.parse(localStorage.getItem('blink-studio.v1') || 'null');
    if (p) for (const k of ['theme', 'handle', 'sfx', 'intro', 'outro', 'platform', 'difficulty']) if (p[k] !== undefined && !(k === 'handle' && !p[k])) s[k] = p[k];
  } catch (e) { /* storage unavailable */ }
  if (!THEMES.some(t => t.id === s.theme)) s.theme = 'cloud';
  if (!PLATFORM[s.platform]) s.platform = 'tiktok';
  if (!['easy', 'medium', 'hard', 'expert'].includes(s.difficulty)) s.difficulty = 'medium';
  return s;
})();
function saveState() {
  try { localStorage.setItem('blink-studio.v1', JSON.stringify({ theme: state.theme, handle: state.handle, sfx: state.sfx, intro: state.intro, outro: state.outro, platform: state.platform, difficulty: state.difficulty })); } catch (e) { /* ignore */ }
}
const DEFAULT_HANDLE = 'fast.test.now';
const cleanHandle = h => String(h || '').replace(/^@+/, '').replace(/\s+/g, '').slice(0, 30);
const curTest = () => TESTS[state.test];
function hookTemplate() { const t = curTest(); return state.hookCustom ? state.hook : t.hooks[state.hookIdx % t.hooks.length]; }
function cfgFromState() {
  return { test: state.test, rounds: state.rounds, seconds: state.seconds, difficulty: state.difficulty, theme: state.theme, hook: hookTemplate(), handle: cleanHandle(state.handle), sfx: state.sfx, intro: state.intro, outro: state.outro, opts: state.opts, seed: state.seed };
}

// ---------- preview player
const view = $('#view');
const vctx = view.getContext('2d', { alpha: false });
let tl = null, curT = 0, playing = !reduceMotion, dirty = true, lastNow = performance.now(), exporting = false;
let ac = null, master = null, audioClock = null, previewSound = true, audioUnlocked = false;

function sizeCanvas() {
  const cssW = view.clientWidth || 300, dpr = Math.min(window.devicePixelRatio || 1, 3);
  const pw = Math.max(180, Math.min(1080, Math.round(cssW * dpr))), ph = Math.round((pw * 16) / 9);
  if (view.width !== pw || view.height !== ph) { view.width = pw; view.height = ph; dirty = true; }
}
function renderPreview() {
  const k = view.width / W;
  vctx.setTransform(k, 0, 0, k, 0, 0); vctx.__k = k; vctx.imageSmoothingEnabled = true; vctx.imageSmoothingQuality = 'high';
  drawFrame(vctx, tl, curT);
}
function ensureAC() {
  audioUnlocked = true;
  // iPhone: play through the silent switch, like a video would.
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { /* not supported */ }
  if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); }
  if (ac.state !== 'running') ac.resume().catch(() => {});
  return ac;
}
function stopAudio() { if (master) { try { master.disconnect(); } catch (e) { /* already gone */ } master = null; } audioClock = null; }
function startAudio(fromT) {
  stopAudio();
  if (!previewSound || !playing || !tl || !tl.cues.length || !audioUnlocked) return;
  const a = ensureAC(); if (!a) return;
  if (a.state !== 'running') { a.resume().then(() => { if (playing && previewSound && !audioClock) startAudio(curT); }).catch(() => {}); return; }
  master = a.createGain(); master.gain.value = 1.25; master.connect(a.destination);
  const at = a.currentTime + 0.06;
  scheduleCues(a, master, tl.cues, fromT, at);
  audioClock = { startT: fromT, acStart: at };
}
function setPlaying(p) {
  playing = p; lastNow = performance.now();
  $('#icoPause').hidden = !p; $('#icoPlay').hidden = p;
  $('#btnPlay').setAttribute('aria-label', p ? 'Pause preview' : 'Play preview');
  if (p) startAudio(curT); else stopAudio();
}
function seek(t) { curT = clamp(t, 0, Math.max(0, tl.duration - 0.01)); dirty = true; if (playing) startAudio(curT); }
let lastIdx = -1, monitorVisible = true;
function loop(now) {
  if (playing && !exporting && tl) {
    if (audioClock && ac && ac.state === 'running') curT = Math.max(0, audioClock.startT + (ac.currentTime - audioClock.acStart));
    else curT += Math.min(0.1, (now - lastNow) / 1000);
    if (curT >= tl.duration) { curT = 0; startAudio(0); }
    const idx = Math.floor(curT * FPS);
    if (idx !== lastIdx) { lastIdx = idx; dirty = true; }
  }
  lastNow = now;
  if (dirty && !exporting && tl && monitorVisible) { renderPreview(); updateTimeUI(); dirty = false; }
  requestAnimationFrame(loop);
}
function updateTimeUI() {
  $('#timeLbl').textContent = `${fmtTime(curT)} / ${fmtTime(tl.duration)}`;
  const sc = $('#scrub'); if (document.activeElement !== sc) sc.value = String(Math.round((curT / Math.max(0.01, tl.duration)) * 1000));
}
function renderSegStrip() {
  const el = $('#segStrip'); el.textContent = '';
  for (const s of tl.segs) { const i = document.createElement('i'); i.style.flex = `${s.dur} 1 0`; i.className = s.type === 'round' ? (s.phase === 'reveal' ? 'r' : 'q') : 'io'; el.appendChild(i); }
}

// ---------- rebuild on every setting change
let rebuildTimer = 0;
function rebuild(resetTime) {
  tl = buildTimeline(cfgFromState());
  curT = resetTime ? 0 : clamp(curT, 0, Math.max(0, tl.duration - 0.01));
  renderSegStrip(); updateSpec(); syncHookInput();
  dirty = true;
  if (playing) startAudio(curT);
  markStale();
}
function rebuildSoon() { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(() => { rebuild(false); renderCaption(false); }, 160); }

// ---------- test picker & thumbnails
const thumbs = {};
function buildTestCards() {
  const grid = $('#testGrid'); grid.textContent = '';
  $('#testCount').textContent = `${TEST_ORDER.length} tests`;
  for (const id of TEST_ORDER) {
    const t = TESTS[id], b = document.createElement('button');
    b.type = 'button'; b.className = 'test-card'; b.setAttribute('role', 'radio'); b.dataset.v = id;
    const c = document.createElement('canvas'); c.width = c.height = 200; c.setAttribute('aria-hidden', 'true');
    const n = document.createElement('span'); n.className = 't-name'; n.textContent = t.name;
    const g = document.createElement('span'); g.className = 't-tag'; g.textContent = t.tag;
    b.append(c, n, g); grid.appendChild(b); thumbs[id] = c;
    b.addEventListener('click', () => selectTest(id));
  }
}
function drawThumbs() {
  const th = THEMES.find(t => t.id === state.theme) || THEMES[0];
  for (const id of TEST_ORDER) {
    const c = thumbs[id], ctx = c.getContext('2d'), S = c.width, k = S / 900;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.__k = k; ctx.imageSmoothingQuality = 'high';
    const t = TESTS[id];
    const ttl = buildTimeline({ test: id, rounds: t.defaults.rounds, seconds: t.defaults.seconds, difficulty: 'medium', theme: th.id, hook: '', handle: '', sfx: false, intro: false, outro: false, opts: state.opts, seed: 4242 }, true);
    try { t.art(ctx, { x: 40, y: 40, w: 820, h: 820 }, ttl, 9); } catch (e) { console.warn('thumb', id, e); }
    noShadow(ctx); ctx.globalAlpha = 1;
  }
}
function selectTest(id) {
  if (exporting || !TESTS[id]) return;
  const t = TESTS[id];
  state.test = id; state.rounds = t.defaults.rounds; state.seconds = t.defaults.seconds;
  state.hookIdx = 0; state.hookCustom = false; state.capSeed = 1;
  syncControls(); rebuild(true); renderCaption(true);
  if (!playing && !reduceMotion) setPlaying(true);
}

// ---------- settings controls
function setChecked(group, v) { group.querySelectorAll('[role=radio]').forEach(b => { const on = b.dataset.v === v; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; }); }
function buildThemeSwatches() {
  const box = $('#themeSw'); box.textContent = '';
  for (const t of THEMES) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch'; b.setAttribute('role', 'radio'); b.dataset.v = t.id; b.setAttribute('aria-label', t.name); b.title = t.name;
    b.style.background = `linear-gradient(${t.bg[0]}, ${t.bg[1]})`;
    const i = document.createElement('i'); i.style.background = t.card;
    const d = document.createElement('b'); d.style.background = t.accent;
    b.append(i, d); box.appendChild(b);
    b.addEventListener('click', () => { state.theme = t.id; saveState(); syncControls(); rebuild(false); drawThumbs(); });
  }
}
function syncControls() {
  const t = curTest();
  setChecked($('#testGrid'), state.test);
  $('#testBlurb').innerHTML = '';
  const b = document.createElement('b'); b.textContent = t.name + '. '; $('#testBlurb').append(b, document.createTextNode(t.blurb));
  $('#roundsOut').textContent = String(state.rounds);
  $('#roundsDown').disabled = state.rounds <= t.roundsRange[0]; $('#roundsUp').disabled = state.rounds >= t.roundsRange[1];
  $('#secsOut').textContent = `${state.seconds} s`;
  $('#secsDown').disabled = state.seconds <= 2; $('#secsUp').disabled = state.seconds >= 20;
  setChecked($('#segDiff'), state.difficulty);
  setChecked($('#themeSw'), state.theme);
  $('#themeName').textContent = (THEMES.find(x => x.id === state.theme) || THEMES[0]).name;
  const of = $('#optField'), og = $('#segOpt');
  if (t.options && t.options.length) {
    const o = t.options[0]; of.hidden = false; $('#lbl-opt').textContent = o.label; og.textContent = '';
    const cur = (state.opts[t.id] && state.opts[t.id][o.id]) || o.choices[0][0];
    for (const [v, label] of o.choices) {
      const btn = document.createElement('button'); btn.type = 'button'; btn.setAttribute('role', 'radio'); btn.dataset.v = v; btn.textContent = label;
      btn.addEventListener('click', () => { state.opts[t.id] = { ...(state.opts[t.id] || {}), [o.id]: v }; setChecked(og, v); rebuild(false); drawThumbs(); });
      og.appendChild(btn);
    }
    setChecked(og, cur);
  } else of.hidden = true;
  $('#tgSfx').checked = state.sfx; $('#tgIntro').checked = state.intro; $('#tgOutro').checked = state.outro;
  if (document.activeElement !== $('#inHandle')) $('#inHandle').value = state.handle;
  setChecked($('#segPlat'), state.platform);
  setChecked($('#segSafe'), state.safe);
}
function syncHookInput() {
  const inp = $('#inHook');
  if (document.activeElement === inp && state.hookCustom) return;
  inp.value = tl.hook;
  inp.placeholder = fillVars(curTest().hooks[0], { N: tl.N, S: state.seconds, K: curTest().kFor ? curTest().kFor(state) : 3 });
}
function wireRadioKeys(group) {
  group.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const items = [...group.querySelectorAll('[role=radio]')]; const i = items.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault();
    const n = items[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length];
    n.focus(); n.click();
  });
}
function wireControls() {
  document.querySelectorAll('[role=radiogroup]').forEach(wireRadioKeys);
  $('#roundsDown').addEventListener('click', () => { state.rounds = Math.max(curTest().roundsRange[0], state.rounds - 1); syncControls(); rebuild(false); renderCaption(false); });
  $('#roundsUp').addEventListener('click', () => { state.rounds = Math.min(curTest().roundsRange[1], state.rounds + 1); syncControls(); rebuild(false); renderCaption(false); });
  $('#secsDown').addEventListener('click', () => { state.seconds = Math.max(2, state.seconds - 1); syncControls(); rebuild(false); renderCaption(false); });
  $('#secsUp').addEventListener('click', () => { state.seconds = Math.min(20, state.seconds + 1); syncControls(); rebuild(false); renderCaption(false); });
  $('#segDiff').addEventListener('click', e => { const b = e.target.closest('[role=radio]'); if (!b) return; state.difficulty = b.dataset.v; saveState(); syncControls(); rebuild(false); renderCaption(false); });
  $('#inHook').addEventListener('input', e => { state.hook = e.target.value; state.hookCustom = e.target.value.trim().length > 0; rebuildSoon(); });
  $('#inHook').addEventListener('blur', () => { if (!state.hookCustom) syncHookInput(); });
  $('#btnHook').addEventListener('click', () => { state.hookIdx = (state.hookIdx + 1) % curTest().hooks.length; state.hookCustom = false; state.hook = ''; rebuild(false); });
  $('#inHandle').addEventListener('input', e => {
    const old = state.handle; state.handle = cleanHandle(e.target.value); saveState(); rebuildSoon(); renderSafe();
    const ta = $('#capText');
    if (old && state.handle && old !== state.handle) { ta.value = ta.value.split('@' + old).join('@' + state.handle); updateCounts(); }
    else if (old && !state.handle) { ta.value = ta.value.split('\n').filter(l => !l.includes('@' + old)).join('\n').replace(/\n{3,}/g, '\n\n'); updateCounts(); }
    else if (!old && state.handle && !ta.value.includes('@' + state.handle)) { ta.value = ta.value.replace(/\s+$/, '') + `\nFollow @${state.handle} for more tests 👀`; updateCounts(); }
  });
  $('#tgSfx').addEventListener('change', e => { state.sfx = e.target.checked; saveState(); rebuild(false); });
  $('#tgIntro').addEventListener('change', e => { state.intro = e.target.checked; saveState(); rebuild(true); });
  $('#tgOutro').addEventListener('change', e => { state.outro = e.target.checked; saveState(); rebuild(false); });
  $('#btnPlay').addEventListener('click', () => { ensureAC(); setPlaying(!playing); });
  $('#btnRestart').addEventListener('click', () => { ensureAC(); curT = 0; dirty = true; setPlaying(true); });
  $('#scrub').addEventListener('input', e => { seek((Number(e.target.value) / 1000) * tl.duration); });
  $('#segStrip').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * tl.duration); });
  $('#btnSound').addEventListener('click', () => {
    previewSound = !previewSound; ensureAC(); syncSoundBtn();
    if (previewSound && !state.sfx) toast('Sound effects are off for this video');
    startAudio(curT);
  });
  $('#segSafe').addEventListener('click', e => { const b = e.target.closest('[role=radio]'); if (!b) return; state.safe = b.dataset.v; setChecked($('#segSafe'), state.safe); renderSafe(); });
  $('#btnShuffle').addEventListener('click', () => { state.seed = 1 + Math.floor(Math.random() * 999999); rebuild(false); toast('New variation'); });
  $('#btnRecord').addEventListener('click', onRecord);
  $('#btnCancel').addEventListener('click', () => { if (abortCtl) abortCtl.abort(); });
  $('#btnSave').addEventListener('click', saveVideo);
  $('#segPlat').addEventListener('click', e => { const b = e.target.closest('[role=radio]'); if (!b) return; state.platform = b.dataset.v; saveState(); setChecked($('#segPlat'), state.platform); renderCaption(true); });
  $('#btnShuffleCap').addEventListener('click', () => { state.capSeed++; renderCaption(true); });
  $('#btnCopyAll').addEventListener('click', () => copyText(fullCaption(), 'Description + hashtags copied', $('#capText')));
  $('#btnCopyTags').addEventListener('click', () => copyText(tagLine(), 'Hashtags copied'));
  $('#btnCopyTitle').addEventListener('click', () => copyText($('#ytTitle').value, 'Title copied', $('#ytTitle')));
  $('#capText').addEventListener('input', updateCounts);
  $('#ytTitle').addEventListener('input', updateCounts);
  $('#btnAI').addEventListener('click', aiCaption);
  // The first tap or key press anywhere unlocks preview sound (browsers block audio before that).
  const unlock = () => { if (audioUnlocked) return; ensureAC(); if (playing && previewSound) startAudio(curT); };
  document.addEventListener('click', unlock, true); document.addEventListener('keydown', unlock, true);
  syncSoundBtn();
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space' || e.repeat || exporting) return;
    const el = document.activeElement, tag = el && el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || (el && el.isContentEditable)) return;
    e.preventDefault(); ensureAC(); setPlaying(!playing);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAudio(); else if (playing) { lastNow = performance.now(); startAudio(curT); } });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { monitorVisible = es[es.length - 1].isIntersecting; if (monitorVisible) dirty = true; }).observe($('#screen'));
  if ('ResizeObserver' in window) new ResizeObserver(() => { sizeCanvas(); }).observe($('#screen'));
  else window.addEventListener('resize', sizeCanvas);
}

// ---------- app overlay (approximate TikTok / Instagram UI, preview only)
const SAFE_SVG = {
  tiktok: `
  <defs><linearGradient id="sgT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="sgB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></linearGradient></defs>
  <rect width="1080" height="270" fill="url(#sgT)"/><rect y="1380" width="1080" height="540" fill="url(#sgB)"/>
  <g fill="#fff" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="700">
    <text x="512" y="168" text-anchor="end" font-size="40" fill-opacity=".62">Following</text>
    <text x="566" y="168" font-size="40">For You</text><rect x="600" y="186" width="70" height="7" rx="3.5"/>
    <circle cx="1002" cy="886" r="50" fill="#9AA3AF" stroke="#fff" stroke-width="5"/><circle cx="1002" cy="938" r="19" fill="#FE2C55"/>
    <path transform="translate(1002 1046) scale(1.05)" d="M0 30 L-38 -6 C-58 -28 -36 -58 -12 -46 C-6 -43 -2 -38 0 -34 C2 -38 6 -43 12 -46 C36 -58 58 -28 38 -6 Z"/>
    <text x="1002" y="1114" text-anchor="middle" font-size="28">128K</text>
    <path transform="translate(1002 1196)" d="M-40 -6 C-40 -36 -18 -46 0 -46 C18 -46 40 -36 40 -6 C40 22 18 32 0 32 C-6 32 -12 31 -17 29 L-34 40 L-30 22 C-37 14 -40 5 -40 -6 Z"/>
    <text x="1002" y="1264" text-anchor="middle" font-size="28">2,345</text>
    <path transform="translate(1002 1338)" d="M-28 -40 H28 V40 L0 20 L-28 40 Z"/>
    <text x="1002" y="1408" text-anchor="middle" font-size="28">9,876</text>
    <path transform="translate(1002 1478)" d="M8 -38 L44 0 L8 36 V14 C-16 14 -32 22 -44 40 C-40 6 -22 -14 8 -16 Z"/>
    <text x="1002" y="1548" text-anchor="middle" font-size="28">Share</text>
    <circle cx="1002" cy="1650" r="46" fill="#222" stroke="#555" stroke-width="10"/><circle cx="1002" cy="1650" r="16" fill="#888"/>
    <text x="40" y="1604" font-size="40">@yourname</text>
    <rect x="40" y="1640" width="740" height="26" rx="13" fill-opacity=".8"/><rect x="40" y="1684" width="520" height="26" rx="13" fill-opacity=".8"/>
    <text x="40" y="1762" font-size="30" font-weight="600">♫ original sound</text>
  </g>
  <rect y="1800" width="1080" height="120" fill="#000"/>
  <g fill="#fff" fill-opacity=".9"><rect x="70" y="1832" width="56" height="50" rx="10"/><circle cx="324" cy="1858" r="26"/><rect x="486" y="1828" width="108" height="62" rx="16"/><rect x="740" y="1834" width="60" height="46" rx="12"/><circle cx="986" cy="1858" r="26"/></g>
  <rect x="486" y="1828" width="108" height="62" rx="16" fill="none" stroke="#25F4EE" stroke-width="5" transform="translate(-5 0)"/>`,
  instagram: `
  <defs><linearGradient id="sgT2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="sgB2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient></defs>
  <rect width="1080" height="290" fill="url(#sgT2)"/><rect y="1360" width="1080" height="560" fill="url(#sgB2)"/>
  <g fill="#fff" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="700">
    <text x="408" y="202" text-anchor="end" font-size="50">Reels</text><text x="446" y="202" font-size="50" fill-opacity=".55">Friends</text>
    <g fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round">
      <path transform="translate(994 838)" d="M0 30 L-38 -6 C-58 -28 -36 -58 -12 -46 C-6 -43 -2 -38 0 -34 C2 -38 6 -43 12 -46 C36 -58 58 -28 38 -6 Z"/>
      <path transform="translate(994 992)" d="M-36 0 A36 36 0 1 1 -24 27 L-38 38 Z"/>
      <path transform="translate(994 1150)" d="M-30 -10 V-24 H24 M14 -36 L26 -24 L14 -12 M30 10 V24 H-24 M-14 36 L-26 24 L-14 12"/>
      <path transform="translate(994 1308)" d="M-38 -30 L40 -30 L2 38 L-6 2 Z M-6 2 L40 -30"/>
      <path transform="translate(994 1466)" d="M-26 -36 H26 V38 L0 18 L-26 38 Z"/>
    </g>
    <text x="994" y="906" text-anchor="middle" font-size="27">4,027</text><text x="994" y="1062" text-anchor="middle" font-size="27">916</text>
    <text x="994" y="1218" text-anchor="middle" font-size="27">48</text><text x="994" y="1376" text-anchor="middle" font-size="27">2,687</text>
    <text x="994" y="1534" text-anchor="middle" font-size="27">967</text>
    <rect x="968" y="1600" width="52" height="7" rx="3.5"/><rect x="968" y="1616" width="52" height="7" rx="3.5"/><rect x="968" y="1632" width="34" height="7" rx="3.5"/>
    <circle cx="106" cy="1548" r="50" fill="#9AA3AF" stroke="#E1306C" stroke-width="6"/>
    <text x="182" y="1536" font-size="34">yourname</text><text x="182" y="1580" font-size="27" font-weight="500" fill-opacity=".75">Original audio</text>
    <rect x="590" y="1506" width="220" height="62" rx="16" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/><text x="700" y="1547" text-anchor="middle" font-size="28">Follow</text>
    <rect x="40" y="1628" width="760" height="24" rx="12" fill-opacity=".8"/>
    <rect x="40" y="1692" width="1000" height="5" rx="2.5" fill-opacity=".35"/><rect x="40" y="1692" width="120" height="5" rx="2.5"/>
  </g>
  <rect x="56" y="1736" width="968" height="132" rx="66" fill="#2A2A2E" fill-opacity=".92"/>
  <g fill="#fff" fill-opacity=".9"><circle cx="176" cy="1802" r="26"/><rect x="330" y="1770" width="110" height="64" rx="32" fill-opacity=".35"/><circle cx="385" cy="1802" r="22"/><circle cx="560" cy="1802" r="24"/><circle cx="740" cy="1802" r="24"/><circle cx="910" cy="1802" r="26"/></g>`,
};
function syncSoundBtn() {
  const b = $('#btnSound');
  b.setAttribute('aria-pressed', previewSound ? 'true' : 'false');
  b.setAttribute('aria-label', previewSound ? 'Mute preview sound' : 'Turn on preview sound');
  b.title = previewSound ? 'Preview sound is on' : 'Preview sound is off';
  $('#icoSndOn').hidden = !previewSound; $('#icoSndOff').hidden = previewSound;
}
function renderSafe() {
  const h = state.handle || 'yourname', esc = h.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  $('#safeSvg').innerHTML = state.safe === 'off' ? '' : SAFE_SVG[state.safe].replace('@yourname', '@' + esc).replace('>yourname<', '>' + esc + '<');
}

// ---------- spec chips
let support = null;
function updateSpec() {
  if (!tl) return;
  const fmt = support ? support.ext.toUpperCase() : 'MP4';
  const chips = [fmt, '1080×1920', fmtTime(tl.duration), `${FPS} fps`, state.sfx ? 'With sound' : 'Silent'];
  const box = $('#specLine'); box.textContent = '';
  chips.forEach(c => { const s = document.createElement('span'); s.className = 'chip'; s.textContent = c; box.appendChild(s); });
}

// =====================================================================
// Recording
// =====================================================================
let abortCtl = null, lastBlob = null, lastUrl = null, lastName = '', lastExt = 'mp4', stale = false;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const yieldChan = typeof MessageChannel !== 'undefined' ? new MessageChannel() : null, yieldQ = [];
if (yieldChan) yieldChan.port1.onmessage = () => { const f = yieldQ.shift(); if (f) f(); };
const yieldNow = () => (yieldChan ? new Promise(r => { yieldQ.push(r); yieldChan.port2.postMessage(0); }) : sleep(0));
function waitDequeue(enc) {
  return new Promise(res => { let done = false; const fin = () => { if (!done) { done = true; res(); } }; try { enc.addEventListener('dequeue', fin, { once: true }); } catch (e) { /* older API */ } setTimeout(fin, 20); });
}
function ensureMuxer() {
  if (window.Mp4Muxer) return Promise.resolve(true);
  const el = document.getElementById('muxlib');
  if (!el) return Promise.resolve(false);
  return new Promise(res => {
    const done = () => res(!!window.Mp4Muxer);
    el.addEventListener('load', done, { once: true }); el.addEventListener('error', () => res(false), { once: true });
    setTimeout(done, 8000);
  });
}
async function videoConfig() {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return null;
  for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.640032', 'avc1.4d0032', 'avc1.42e032']) {
    const c = { codec, width: W, height: H, bitrate: 10_000_000, framerate: FPS, avc: { format: 'avc' } };
    try { const s = await VideoEncoder.isConfigSupported(c); if (s && s.supported) return c; } catch (e) { /* try next */ }
  }
  return null;
}
function recorderMime(withAudio) {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  const list = withAudio
    ? ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const m of list) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) { /* ignore */ } }
  return null;
}
function aacRecorderMime() {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  const ok = m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } };
  for (const m of ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs="avc1,mp4a"']) if (ok(m)) return m;
  if (ok('video/mp4') && !ok('video/webm')) return 'video/mp4'; // Safari records H.264 + AAC
  return null;
}
async function choosePlan(wantAudio) {
  const v = await videoConfig(), mux = v ? await ensureMuxer() : false;
  // Sound is always encoded by the built-in AAC encoder, so every browser writes the same standard file.
  if (v && mux) return { kind: 'webcodecs', v, a: wantAudio, ext: 'mp4', label: wantAudio ? 'MP4 · H.264 · AAC sound' : 'MP4 · H.264 · no sound' };
  const mrA = wantAudio ? aacRecorderMime() : null;
  if (mrA) return { kind: 'realtime', mime: mrA, audio: true, ext: 'mp4', label: 'MP4 · H.264 + AAC' };
  const mr = recorderMime(wantAudio);
  if (mr) return { kind: 'realtime', mime: mr, audio: wantAudio, ext: mr.startsWith('video/mp4') ? 'mp4' : 'webm', label: mr.startsWith('video/mp4') ? 'MP4' : 'WebM' };
  return null;
}
async function detectSupport() {
  try { const p = await choosePlan(false); support = p ? { ext: p.ext } : { ext: 'mp4', none: true }; } catch (e) { support = { ext: 'mp4' }; }
  updateSpec();
}
async function renderAudio(xtl) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const sr = 48000, len = Math.max(1, Math.round(xtl.duration * sr));
  const oac = new OAC(1, len, sr);
  const g = oac.createGain(); g.gain.value = 1.5; const comp = oac.createDynamicsCompressor();
  g.connect(comp); comp.connect(oac.destination);
  scheduleCues(oac, g, xtl.cues, 0, 0);
  return await oac.startRendering();
}
async function encodeAudio(buf, muxer, signal, onStep) {
  const pcm = buf.getChannelData(0), enc = createAacEncoder(128000), n = enc.frameCount(pcm.length), dur = (enc.frameSize / 48000) * 1e6;
  const meta = { decoderConfig: { codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 1, description: enc.asc } };
  for (let i = 0; i < n; i++) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    muxer.addAudioChunkRaw(enc.encodeFrame(pcm, i), 'key', Math.round(i * dur), Math.round(dur), i === 0 ? meta : undefined);
    if (i % 120 === 0) { onStep(i / n); await yieldNow(); }
  }
}
async function exportWebCodecs(xtl, plan, onProg, signal) {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { alpha: false }); ctx.__k = 1; ctx.imageSmoothingQuality = 'high';
  const total = Math.max(1, Math.round(xtl.duration * FPS));
  const audioBuf = plan.a ? await renderAudio(xtl) : null;
  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: 'avc', width: W, height: H, frameRate: FPS },
    audio: plan.a ? { codec: 'aac', numberOfChannels: 1, sampleRate: 48000 } : undefined,
    fastStart: 'in-memory', firstTimestampBehavior: 'offset',
  });
  let err = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { err = e; } });
  enc.configure(plan.v);
  try {
    for (let i = 0; i < total; i++) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      if (err) throw err;
      drawFrame(ctx, xtl, i / FPS);
      const vf = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
      enc.encode(vf, { keyFrame: i % (FPS * 2) === 0 }); vf.close();
      while (enc.encodeQueueSize > 6) { if (err) throw err; await waitDequeue(enc); }
      if (i % 5 === 0) { onProg((i / total) * (plan.a ? 0.93 : 0.99), `Rendering frame ${i} of ${total}`); await yieldNow(); }
    }
    await enc.flush();
  } finally { try { enc.close(); } catch (e) { /* closed */ } }
  if (err) throw err;
  if (audioBuf) await encodeAudio(audioBuf, muxer, signal, f => onProg(0.93 + f * 0.06, 'Adding sound'));
  muxer.finalize();
  onProg(1, 'Done');
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}
async function exportRealtime(xtl, plan, onProg, signal) {
  const canvas = view, ctx = vctx;
  canvas.width = W; canvas.height = H; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.__k = 1;
  drawFrame(ctx, xtl, 0);
  const stream = canvas.captureStream(FPS);
  let rac = null, gain = null;
  if (plan.audio && xtl.cues.length) {
    rac = ensureAC();
    if (rac && rac.createMediaStreamDestination) {
      const dest = rac.createMediaStreamDestination();
      gain = rac.createGain(); gain.gain.value = 1.25; gain.connect(dest); gain.connect(rac.destination);
      if (rac.state === 'suspended') { try { await rac.resume(); } catch (e) { /* stays silent */ } }
      dest.stream.getAudioTracks().forEach(tr => stream.addTrack(tr));
    } else rac = null;
  }
  const rec = new MediaRecorder(stream, { mimeType: plan.mime, videoBitsPerSecond: 10_000_000, audioBitsPerSecond: 128000 });
  const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise(res => { rec.onstop = res; });
  $('#recBadge').hidden = false;
  rec.start(500);
  const t0 = performance.now(), at = rac ? rac.currentTime + 0.05 : 0;
  if (rac) scheduleCues(rac, gain, xtl.cues, 0, at);
  await new Promise(resolve => {
    const step = () => {
      if (signal.aborted) return resolve();
      const t = rac ? rac.currentTime - at : (performance.now() - t0) / 1000;
      if (t >= xtl.duration) { drawFrame(ctx, xtl, xtl.duration); return resolve(); }
      drawFrame(ctx, xtl, Math.max(0, t));
      onProg(Math.max(0, t) / xtl.duration, `Recording ${fmtTime(t)} / ${fmtTime(xtl.duration)}`);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  await sleep(200);
  rec.stop(); await stopped;
  stream.getTracks().forEach(tr => tr.stop());
  if (gain) { try { gain.disconnect(); } catch (e) { /* gone */ } }
  $('#recBadge').hidden = true;
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  return new Blob(chunks, { type: plan.mime.split(';')[0] });
}
function setRecUI(busy) {
  $('#btnRecord').disabled = busy; $('#progWrap').hidden = !busy;
  $('#recLabel').textContent = busy ? 'Recording…' : lastBlob ? 'Record again' : 'Record video';
  if (busy) { $('#progBar').style.width = '0%'; $('#progTxt').textContent = 'Getting ready…'; $('#recNotice').hidden = true; }
  document.querySelectorAll('.test-card, #segDiff button, #segOpt button, #themeSw button, .stepper button, #btnShuffle, #btnHook, #inHook, #inHandle, .switch input').forEach(b => { if (busy) b.setAttribute('disabled', ''); else b.removeAttribute('disabled'); });
  if (!busy) syncControls();
}
function onProg(p, txt) {
  const pct = Math.round(clamp(p) * 100);
  $('#progBar').style.width = pct + '%'; $('#progBarWrap').setAttribute('aria-valuenow', String(pct));
  $('#progTxt').textContent = `${txt} · ${pct}%`;
}
function showNotice(msg) { const n = $('#recNotice'); n.textContent = msg; n.hidden = false; }
function markStale() {
  if (!lastBlob || exporting) return;
  stale = true; showNotice('You changed the video since this recording. Record again to save the new version.');
}
async function onRecord() {
  if (exporting) return;
  ensureAC();
  const xtl = buildTimeline(cfgFromState());
  const wantAudio = state.sfx && xtl.cues.length > 0;
  let plan = null;
  try { plan = await choosePlan(wantAudio); } catch (e) { plan = null; }
  if (!plan) { showNotice('This browser can’t make video files. Try a recent Chrome, Edge or Safari.'); return; }
  exporting = true; abortCtl = new AbortController();
  const wasPlaying = playing; playing = false; stopAudio();
  setRecUI(true);
  try {
    let blob = null;
    if (plan.kind === 'webcodecs') {
      try { blob = await exportWebCodecs(xtl, plan, onProg, abortCtl.signal); }
      catch (e) {
        if (e && e.name === 'AbortError') throw e;
        console.warn('Fast export failed, recording in real time instead', e);
        const mime = (wantAudio && aacRecorderMime()) || recorderMime(wantAudio);
        if (!mime) throw e;
        plan = { kind: 'realtime', mime, audio: wantAudio, ext: mime.startsWith('video/mp4') ? 'mp4' : 'webm', label: mime.startsWith('video/mp4') ? 'MP4' : 'WebM' };
        blob = await exportRealtime(xtl, plan, onProg, abortCtl.signal);
      }
    } else blob = await exportRealtime(xtl, plan, onProg, abortCtl.signal);
    if (!blob || !blob.size) throw new Error('The recording came out empty');
    if (lastUrl) URL.revokeObjectURL(lastUrl);
    lastBlob = blob; lastUrl = URL.createObjectURL(blob); lastExt = plan.ext; stale = false;
    const d = new Date(), stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
    lastName = `blink-${xtl.test.id}-${stamp}.${plan.ext}`;
    const vid = $('#outVideo'); vid.src = lastUrl + '#t=0.1';
    $('#outMeta').innerHTML = '';
    const m1 = document.createElement('b'); m1.textContent = `${plan.label} · ${(blob.size / 1048576).toFixed(1)} MB`;
    $('#outMeta').append(m1, document.createElement('br'), document.createTextNode(`${fmtTime(xtl.duration)} · 1080×1920 · ${xtl.test.name}`));
    $('#result').hidden = false;
    if (plan.note) showNotice(plan.note);
    else if (plan.ext === 'webm') showNotice('This browser saves WebM. TikTok accepts it; for Instagram, open the app in Safari or Chrome to get MP4.');
    toast('Video ready');
  } catch (e) {
    if (e && e.name === 'AbortError') toast('Recording cancelled');
    else { console.error(e); showNotice(`Recording failed${e && e.message ? ': ' + e.message : ''}. Try again, or turn off sound effects.`); }
  } finally {
    exporting = false; abortCtl = null; setRecUI(false);
    $('#recBadge').hidden = true;
    view.width = 1; sizeCanvas(); dirty = true;
    setPlaying(wasPlaying);
  }
}
async function saveVideo() {
  if (!lastBlob) return;
  const cl = window.claude;
  if (cl && typeof cl.use === 'function') {
    let dl = null;
    try { dl = await cl.use('downloads'); } catch (e) { dl = null; }
    if (!dl) {
      const a = document.createElement('a'); a.href = lastUrl; a.download = lastName; document.body.appendChild(a); a.click(); a.remove();
      showNotice('If no download started, open this app on claude.ai or in the Claude app and press Save video there.');
      return;
    }
    try {
      const res = await dl.save({ filename: lastName, data: lastBlob });
      toast(res && res.status === 'delivered' ? 'Video sent' : 'Video saved');
    } catch (e) {
      const code = e && e.code;
      if (code === 'declined') toast('Save cancelled');
      else if (code === 'rate_limited') toast('A save is already in progress');
      else if (code === 'too_large') showNotice('This video is too big to save here. Try fewer rounds or shorter timers.');
      else if (code === 'rejected_extension' || code === 'extension_not_enabled') showNotice(`This view can’t save .${lastExt} files.`);
      else showNotice('Couldn’t save the video in this view. Try opening the app in your browser on claude.ai.');
    }
  } else {
    const a = document.createElement('a'); a.href = lastUrl; a.download = lastName; document.body.appendChild(a); a.click(); a.remove();
    toast('Download started');
  }
}

// =====================================================================
// Captions & hashtags
// =====================================================================
const picked = { tiktok: [], instagram: [], youtube: [] };
let extraTags = [];
function candidateTags(platform) {
  const data = CAPTIONS[state.test], out = [];
  const add = t => { if (t && !out.includes(t)) out.push(t); };
  if (platform === 'youtube') add('shorts');
  extraTags.forEach(add); data.tags.forEach(add); BROAD[platform].forEach(add);
  return out;
}
function defaultPicks(platform) {
  const data = CAPTIONS[state.test];
  if (platform === 'youtube') return ['shorts', ...data.tags.slice(0, 4)];
  if (platform === 'instagram') return [...data.tags.slice(0, 4), 'reels'];
  return [...data.tags.slice(0, 4), 'challenge'].filter((t, i, a) => a.indexOf(t) === i);
}
function renderCaption(regen) {
  const plat = state.platform, data = CAPTIONS[state.test], t = curTest();
  const N = tl ? tl.N : state.rounds, vars = { N, S: state.seconds, K: t.kFor ? t.kFor(state) : 3 };
  if (regen) {
    const rng = mulberry32(hashStr(`${state.capSeed}|${state.test}|${plat}`));
    const hook = fillVars(rPick(rng, data.hooks), vars), body = fillVars(rPick(rng, data.bodies), vars), cta = rPick(rng, CTAS);
    const lines = [hook, '', body, cta];
    if (state.handle) lines.push(`Follow @${state.handle} for more tests 👀`);
    if (data.note) lines.push('', data.note);
    $('#capText').value = lines.join('\n');
    $('#ytTitle').value = fillVars(rPick(rng, data.hooks), vars).slice(0, 100);
    extraTags = [];
    picked[plat] = defaultPicks(plat);
  }
  $('#ytField').hidden = plat !== 'youtube';
  renderTags();
  updateCounts();
}
function renderTags() {
  const plat = state.platform, box = $('#tagList'); box.textContent = '';
  for (const tag of candidateTags(plat)) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tag'; b.textContent = '#' + tag;
    b.setAttribute('aria-pressed', picked[plat].includes(tag) ? 'true' : 'false');
    b.addEventListener('click', () => {
      const arr = picked[plat], i = arr.indexOf(tag);
      if (i >= 0) arr.splice(i, 1);
      else {
        const max = PLATFORM[plat].max;
        if (max && arr.length >= max) { toast(`${PLATFORM[plat].name} allows ${max} hashtags. Unpick one first.`); return; }
        arr.push(tag);
      }
      renderTags(); updateCounts();
    });
    box.appendChild(b);
  }
  const n = picked[plat].length, max = PLATFORM[plat].max;
  $('#tagCount').textContent = max ? `${n} of ${max}` : `${n} picked`;
  $('#tagHint').textContent = PLATFORM[plat].hint;
}
function tagLine() { return picked[state.platform].map(t => '#' + t).join(' '); }
function fullCaption() { const c = $('#capText').value.trim(), tg = tagLine(); return tg ? `${c}\n\n${tg}` : c; }
function updateCounts() {
  $('#capCount').textContent = `${fullCaption().length} chars`;
  $('#ytCount').textContent = `${$('#ytTitle').value.length}/100`;
}
async function copyText(text, okMsg, selectEl) {
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('no clipboard');
    await navigator.clipboard.writeText(text);
    toast(okMsg);
  } catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    if (ok) toast(okMsg);
    else { if (selectEl) { selectEl.focus(); if (selectEl.select) selectEl.select(); } toast('Copying is blocked here. Select the text and copy it yourself.'); }
  }
}

// ---------- optional: fresh caption written by Claude (viewer's own account)
let sampleFn = null;
async function initCapabilities() {
  const cl = window.claude;
  if (!cl || typeof cl.use !== 'function') return;
  try { sampleFn = await cl.use('sample'); } catch (e) { sampleFn = null; }
  if (sampleFn) $('#btnAI').hidden = false;
}
async function aiCaption() {
  if (!sampleFn) return;
  const btn = $('#btnAI'), t = curTest(), plat = state.platform, out = $('#aiOut');
  btn.disabled = true; $('#aiLabel').textContent = 'Writing…'; out.hidden = true;
  const prompt = [
    'Write a social media caption in English for a short vertical test video.',
    `Video: "${t.name}" (${t.blurb}) ${tl.N} rounds, ${state.seconds} seconds per round, ${state.difficulty} difficulty.`,
    `On-screen opening line: "${tl.hook}".`,
    `Platform: ${PLATFORM[plat].name}.`,
    'Caption: first line is a scroll-stopping hook (max 60 characters, at most one emoji), then one or two short lines, then ask viewers to comment their score. Casual, upbeat, no hashtags inside the caption.',
    state.handle ? `Mention the account once, exactly as @${state.handle} (for example: Follow @${state.handle} for more tests).` : '',
    CAPTIONS[state.test].note ? 'End with: Just for fun, not a medical test.' : '',
    `Also give exactly 5 relevant hashtags, lowercase, without #, niche ones first${plat === 'youtube' ? ', include shorts' : ''}.`,
    plat === 'youtube' ? 'Also give a title under 70 characters.' : '',
    `Reply with only JSON: {"caption": string, "hashtags": string[]${plat === 'youtube' ? ', "title": string' : ''}}`,
  ].filter(Boolean).join('\n');
  try {
    const res = await sampleFn.json(prompt, { modelTier: 'quick', cache: false });
    if (!res || typeof res.caption !== 'string' || !res.caption.trim()) throw { code: 'invalid_json' };
    $('#capText').value = res.caption.trim();
    if (Array.isArray(res.hashtags)) {
      const tags = res.hashtags.map(x => String(x).replace(/^#+/, '').toLowerCase().replace(/[^\p{L}\p{N}_]/gu, '')).filter(Boolean).slice(0, 8);
      if (tags.length) { extraTags = tags; const max = PLATFORM[plat].max || 99; picked[plat] = tags.slice(0, Math.min(5, max)); }
    }
    if (plat === 'youtube' && typeof res.title === 'string') $('#ytTitle').value = res.title.slice(0, 100);
    renderTags(); updateCounts(); toast('Fresh caption ready');
  } catch (e) {
    const code = e && e.code;
    if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) btn.hidden = true;
    else if (code === 'rate_limited') { out.textContent = 'Too many requests right now. Try again in a minute.'; out.hidden = false; }
    else if (code !== 'cancelled') { out.textContent = 'Couldn’t write a caption this time. The ready-made one above still works.'; out.hidden = false; }
  } finally {
    btn.disabled = false; $('#aiLabel').textContent = 'Write a fresh one with Claude';
  }
}

// ---------- toast
let toastTimer = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400); }

// ---------- fonts
async function ensureFonts() {
  const link = document.getElementById('gfonts');
  await new Promise(res => {
    if (!link || link.sheet) return res();
    link.addEventListener('load', res, { once: true }); link.addEventListener('error', res, { once: true }); setTimeout(res, 3000);
  });
  if (!document.fonts || !document.fonts.load) return;
  const faces = ['800 64px "Bricolage Grotesque"', '700 30px "Bricolage Grotesque"', '600 30px "Bricolage Grotesque"', '800 64px "Fredoka"', '700 64px "Fredoka"', '600 30px "Fredoka"', '600 40px "Geist Mono"', '700 30px "Geist Mono"'];
  await Promise.race([Promise.all(faces.map(f => document.fonts.load(f).catch(() => null))), sleep(3500)]);
}

// ---------- boot
function boot() {
  buildTestCards(); buildThemeSwatches(); wireControls(); syncControls();
  sizeCanvas(); rebuild(true); renderCaption(true); renderSafe(); drawThumbs();
  if (reduceMotion) { curT = tl.spans.length ? tl.spans[0].start + 1.2 : 0; setPlaying(false); }
  else setPlaying(true);
  requestAnimationFrame(loop);
  ensureFonts().then(() => {
    fitCache.clear(); roundCache.clear(); sharedCache.clear(); spriteCache.clear();
    rebuild(false); drawThumbs();
  });
  detectSupport();
  initCapabilities();
}
boot();
