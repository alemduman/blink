// =====================================================================
// Tiny AAC-LC encoder (mono, 48 kHz, long windows, sine window,
// escape codebook only). Every browser gets standard AAC sound this way,
// even where the built-in AudioEncoder has no AAC (Linux, Electron,
// Firefox, older Safari). Huffman tables: ISO/IEC 14496-3 (as in FFmpeg).
// =====================================================================
const AAC_C11 = [0,6,25,61,156,198,423,912,962,991,2022,2035,4091,2028,4090,4094,910,5,1,8,20,55,66,146,175,401,421,437,926,960,930,973,2006,174,23,7,9,24,57,64,142,163,184,409,428,449,945,918,958,970,157,60,21,22,26,59,68,145,165,190,406,430,441,929,913,933,981,148,154,54,56,58,65,140,155,176,195,414,427,444,927,911,937,975,147,191,62,63,67,69,158,167,185,404,418,442,451,934,935,955,980,159,416,143,141,144,152,166,182,196,415,431,447,921,959,948,969,999,168,438,171,164,170,178,194,197,408,420,440,908,932,964,966,989,1000,173,943,402,189,188,398,407,410,419,433,909,920,951,979,977,987,2013,180,990,425,411,412,417,426,429,435,907,946,952,974,993,992,2002,2021,183,2019,443,424,422,432,434,439,923,922,954,949,982,2007,996,2008,2026,186,2024,928,445,436,906,452,914,938,944,956,983,2004,2012,2011,2005,2032,193,2043,968,931,917,925,940,942,965,984,994,998,2020,2023,2016,2025,2039,400,2034,915,446,448,916,919,941,963,961,978,2010,2009,2015,2027,2036,2042,405,2040,957,924,939,936,947,953,976,995,997,2018,2014,2029,2033,2041,2044,403,4093,988,950,967,972,971,985,986,2003,2017,2030,2031,2037,2038,4092,4095,413,450,181,161,150,151,149,153,160,162,172,169,177,179,187,192,399,4];
const AAC_B11 = [4,5,6,7,8,8,9,10,10,10,11,11,12,11,12,12,10,5,4,5,6,7,7,8,8,9,9,9,10,10,10,10,11,8,6,5,5,6,7,7,8,8,8,9,9,9,10,10,10,10,8,7,6,6,6,7,7,8,8,8,9,9,9,10,10,10,10,8,8,7,7,7,7,8,8,8,8,9,9,9,10,10,10,10,8,8,7,7,7,7,8,8,8,9,9,9,9,10,10,10,10,8,9,8,8,8,8,8,8,8,9,9,9,10,10,10,10,10,8,9,8,8,8,8,8,8,9,9,9,10,10,10,10,10,10,8,10,9,8,8,9,9,9,9,9,10,10,10,10,10,10,11,8,10,9,9,9,9,9,9,9,10,10,10,10,10,10,11,11,8,11,9,9,9,9,9,9,10,10,10,10,10,11,10,11,11,8,11,10,9,9,10,9,10,10,10,10,10,11,11,11,11,11,8,11,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,9,11,10,9,9,10,10,10,10,10,10,11,11,11,11,11,11,9,11,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,9,12,10,10,10,10,10,10,10,11,11,11,11,11,11,12,12,9,9,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,5];
const AAC_SWB48 = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 88, 96, 108, 120, 132, 144, 160, 176, 196, 216, 240, 264, 292, 320, 352, 384, 416, 448, 480, 512, 544, 576, 608, 640, 672, 704, 736, 768, 800, 832, 864, 896, 928, 1024];
const AAC_ASC_MONO_48K = new Uint8Array([0x11, 0x88]); // AAC-LC, 48000 Hz, 1 channel
function createAacEncoder(bitrate) {
  const M = 1024, N = 2048, F = M / 2, NB = 41; // code bands below 16.5 kHz
  const targetBits = Math.min(6000, Math.floor((bitrate * M) / 48000));
  const win = new Float64Array(N);
  for (let n = 0; n < N; n++) win[n] = Math.sin((Math.PI / N) * (n + 0.5));
  // FFT (size F) tables
  const LOG = Math.round(Math.log2(F)), rev = new Uint16Array(F);
  for (let i = 0; i < F; i++) { let r = 0; for (let b = 0; b < LOG; b++) r |= ((i >> b) & 1) << (LOG - 1 - b); rev[i] = r; }
  const twr = new Float64Array(F / 2), twi = new Float64Array(F / 2);
  for (let k = 0; k < F / 2; k++) { twr[k] = Math.cos((-2 * Math.PI * k) / F); twi[k] = Math.sin((-2 * Math.PI * k) / F); }
  const prr = new Float64Array(F), pri = new Float64Array(F), por = new Float64Array(F), poi = new Float64Array(F);
  for (let m = 0; m < F; m++) { prr[m] = Math.cos((-Math.PI * m) / M); pri[m] = Math.sin((-Math.PI * m) / M); por[m] = Math.cos((-Math.PI * (m + 0.25)) / M); poi[m] = Math.sin((-Math.PI * (m + 0.25)) / M); }
  const re = new Float64Array(F), im = new Float64Array(F), v = new Float64Array(M), z = new Float64Array(N);
  function fft() {
    for (let i = 0; i < F; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= F; size <<= 1) {
      const half = size >> 1, step = F / size;
      for (let s = 0; s < F; s += size) for (let j = 0; j < half; j++) {
        const wr = twr[j * step], wi = twi[j * step], a = s + j, b = a + half;
        const xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
      }
    }
  }
  // AAC forward MDCT: X[k] = 2·Σ z[n]·cos(2π/N·(n + n0)·(k + ½)), computed as a DCT-IV of the folded input.
  function mdct(x, out) {
    for (let n = 0; n < N; n++) z[n] = x[n] * win[n];
    const H = M / 2;
    for (let n = 0; n < H; n++) { v[n] = -z[3 * H - 1 - n] - z[3 * H + n]; v[H + n] = z[n] - z[M - 1 - n]; }
    for (let m = 0; m < F; m++) { const a = v[2 * m], b = v[M - 1 - 2 * m]; re[m] = a * prr[m] - b * pri[m]; im[m] = a * pri[m] + b * prr[m]; }
    fft();
    for (let k = 0; k < F; k++) { const sr = re[k] * por[k] - im[k] * poi[k], si = re[k] * poi[k] + im[k] * por[k]; out[2 * k] = 2 * sr; out[M - 1 - 2 * k] = -2 * si; }
  }
  const q = new Int32Array(M), cbs = new Uint8Array(49), ax = new Float64Array(M);
  // |X|^0.75 is computed once per frame; each step-size trial is then one multiply per coefficient.
  function quantize(X, sf) {
    const sc = Math.pow(2, -0.1875 * (sf - 100)), lim = AAC_SWB48[NB];
    for (let k = 0; k < lim; k++) { let t = Math.floor(ax[k] * sc + 0.4054); if (t > 8191) t = 8191; q[k] = X[k] < 0 ? -t : t; }
    let maxSfb = 0;
    for (let b = 0; b < NB; b++) { let nz = 0; for (let k = AAC_SWB48[b]; k < AAC_SWB48[b + 1]; k++) if (q[k]) { nz = 1; break; } cbs[b] = nz ? 11 : 0; if (nz) maxSfb = b + 1; }
    return maxSfb;
  }
  const escBits = a => 2 * (31 - Math.clz32(a)) - 3;
  function countBits(maxSfb) {
    let bits = 32;
    for (let b = 0; b < maxSfb;) { const cb = cbs[b]; let e = b; while (e < maxSfb && cbs[e] === cb) e++; bits += 4 + 5 * (1 + Math.floor((e - b) / 31)); b = e; }
    for (let b = 0; b < maxSfb; b++) if (cbs[b]) {
      bits += 1;
      for (let k = AAC_SWB48[b]; k < AAC_SWB48[b + 1]; k += 2) {
        const a0 = Math.abs(q[k]), a1 = Math.abs(q[k + 1]);
        bits += AAC_B11[Math.min(a0, 16) * 17 + Math.min(a1, 16)] + (a0 ? 1 : 0) + (a1 ? 1 : 0);
        if (a0 >= 16) bits += escBits(a0); if (a1 >= 16) bits += escBits(a1);
      }
    }
    return bits;
  }
  function writeFrame(maxSfb, gg) {
    const out = new Uint8Array(800); let pos = 0;
    const put = (n, val) => { for (let i = n - 1; i >= 0; i--) { if ((val >>> i) & 1) out[pos >> 3] |= 0x80 >> (pos & 7); pos++; } };
    put(3, 0); put(4, 0); put(8, gg);                 // SCE, tag, global_gain
    put(1, 0); put(2, 0); put(1, 0); put(6, maxSfb); put(1, 0); // ics_info: long window, sine, no prediction
    for (let b = 0; b < maxSfb;) { const cb = cbs[b]; let e = b; while (e < maxSfb && cbs[e] === cb) e++; put(4, cb); let len = e - b; while (len >= 31) { put(5, 31); len -= 31; } put(5, len); b = e; }
    for (let b = 0; b < maxSfb; b++) if (cbs[b]) put(1, 0);  // every band uses global_gain (diff 0)
    put(1, 0); put(1, 0); put(1, 0);                  // no pulse, TNS, gain control
    const esc = a => { const n = 31 - Math.clz32(a); put(n - 3, (1 << (n - 3)) - 2); put(n, a - (1 << n)); };
    for (let b = 0; b < maxSfb; b++) if (cbs[b] === 11) {
      for (let k = AAC_SWB48[b]; k < AAC_SWB48[b + 1]; k += 2) {
        const s0 = q[k], s1 = q[k + 1], a0 = Math.abs(s0), a1 = Math.abs(s1), idx = Math.min(a0, 16) * 17 + Math.min(a1, 16);
        put(AAC_B11[idx], AAC_C11[idx]);
        if (a0) put(1, s0 < 0 ? 1 : 0); if (a1) put(1, s1 < 0 ? 1 : 0);
        if (a0 >= 16) esc(a0); if (a1 >= 16) esc(a1);
      }
    }
    put(3, 7);                                       // END
    return out.slice(0, (pos + 7) >> 3);
  }
  const X = new Float64Array(M), frame = new Float64Array(N);
  const frameCount = L => Math.max(1, Math.ceil(L / M));
  // Frame i covers pcm[i·1024 … i·1024+2047]; this cancels the codec's one-frame delay,
  // so decoded audio lines up with t = 0. pcm: Float32Array mono in [-1, 1].
  function encodeFrame(pcm, i) {
    const L = pcm.length, s0 = i * M, lim = AAC_SWB48[NB];
    for (let n = 0; n < N; n++) { const j = s0 + n; frame[n] = j < L ? pcm[j] * 32768 : 0; }
    mdct(frame, X);
    let maxAbs = 0;
    for (let k = 0; k < lim; k++) { const a = Math.abs(X[k]); ax[k] = Math.pow(a, 0.75); if (a > maxAbs) maxAbs = a; }
    if (maxAbs < 4) { cbs.fill(0); return writeFrame(0, 100); }
    let lo = Math.max(0, Math.min(255, Math.ceil(100 + 4 * Math.log2(maxAbs / 165000)))), hi = 255, sf;
    if (countBits(quantize(X, lo)) <= targetBits) sf = lo;
    else { while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (countBits(quantize(X, mid)) <= targetBits) hi = mid; else lo = mid; } sf = hi; }
    return writeFrame(quantize(X, sf), sf);
  }
  function encode(pcm) { const out = []; for (let i = 0, n = frameCount(pcm.length); i < n; i++) out.push(encodeFrame(pcm, i)); return out; }
  return { encode, encodeFrame, frameCount, mdct, frameSize: M, asc: AAC_ASC_MONO_48K };
}
