// Original soundtrack for the Leash intro, synthesised from scratch (no samples, no licences needed).
// Every hit is placed on the intro's own timeline (see intro.html), so music and picture land together.
//   node video/intro/soundtrack.mjs            → video/out/leash-intro-music.wav (48 kHz stereo, 33 s)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "../out/leash-intro-music.wav");
const SR = 48000;
const DUR = 33;
const N = SR * DUR;
const TAU = Math.PI * 2;

// Buses: dry stereo, a "ducked" bus the kick pumps, reverb and delay sends.
const dryL = new Float32Array(N),
  dryR = new Float32Array(N);
const duckL = new Float32Array(N),
  duckR = new Float32Array(N);
const revS = new Float32Array(N),
  dlyS = new Float32Array(N);

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const idx = (t) => Math.round(t * SR);
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

// RBJ biquad, coefficients updated on demand.
function biquad(type) {
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    a1 = 0,
    a2 = 0,
    x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  return {
    set(f, q = 0.707) {
      f = Math.min(Math.max(f, 20), SR * 0.45);
      const w = (TAU * f) / SR,
        c = Math.cos(w),
        al = Math.sin(w) / (2 * q),
        a0 = 1 + al;
      if (type === "lp") [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
      else if (type === "hp") [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
      else [b0, b1, b2] = [al, 0, -al];
      b0 /= a0;
      b1 /= a0;
      b2 /= a0;
      a1 = (-2 * c) / a0;
      a2 = (1 - al) / a0;
      return this;
    },
    run(x) {
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      return y;
    },
  };
}

function put(i, l, r, { rev = 0, dly = 0, duck = false } = {}) {
  if (i < 0 || i >= N) return;
  const [bl, br] = duck ? [duckL, duckR] : [dryL, dryR];
  bl[i] += l;
  br[i] += r;
  revS[i] += (l + r) * 0.5 * rev;
  dlyS[i] += (l + r) * 0.5 * dly;
}

// ---------- instruments ----------
// Warm pad: three detuned saws per note through a moving low-pass.
function pad(t0, t1, notes, amp, cutoff, { att = 1.2, rel = 1.5, rev = 0.5, duck = false } = {}) {
  for (const m of notes) {
    const f = mtof(m);
    const voices = [-9, 0, 9].map((c, k) => ({ f: f * 2 ** (c / 1200), ph: Math.random(), pan: [-0.7, 0, 0.7][k] }));
    const lp = biquad("lp").set(cutoff(t0), 0.8);
    for (let i = idx(t0); i < idx(t1 + rel) && i < N; i++) {
      const t = i / SR;
      if (i % 64 === 0) lp.set(cutoff(t), 0.8);
      const e = Math.min(1, (t - t0) / att) * (t > t1 ? Math.max(0, 1 - (t - t1) / rel) : 1);
      let l = 0,
        r = 0;
      for (const v of voices) {
        v.ph = (v.ph + v.f / SR) % 1;
        const s = 2 * v.ph - 1;
        l += s * (1 - v.pan) * 0.5;
        r += s * (1 + v.pan) * 0.5;
      }
      const y = lp.run((l + r) * 0.5) * amp * e * (1 / notes.length);
      put(i, y + (l - r) * 0.04 * amp * e, y - (l - r) * 0.04 * amp * e, { rev, duck });
    }
  }
}

function sub(t0, dur, f0, f1, amp) {
  let ph = 0;
  for (let i = idx(t0); i < idx(t0 + dur) && i < N; i++) {
    const t = (i - idx(t0)) / SR;
    const f = f1 + (f0 - f1) * Math.exp(-t * 4);
    ph += f / SR;
    const y = Math.sin(TAU * ph) * amp * Math.exp(-t * (2.2 / dur) * 2) * Math.min(1, t / 0.004);
    put(i, y, y, { rev: 0.1 });
  }
}

function impact(t0, amp) {
  sub(t0, 2.6, 90, 38, amp);
  const lp = biquad("lp");
  for (let i = idx(t0); i < idx(t0 + 2.5) && i < N; i++) {
    const t = (i - idx(t0)) / SR;
    if (i % 32 === 0) lp.set(9000 * Math.exp(-t * 3) + 300, 0.7);
    const y = lp.run(rnd()) * amp * 0.55 * Math.exp(-t * 3.2);
    put(i, y * (1 + rnd() * 0.15), y * (1 + rnd() * 0.15), { rev: 0.9 });
  }
}

// Filtered-noise riser with a rising tone underneath.
function riser(t0, t1, amp, { f0 = 250, f1 = 9000 } = {}) {
  const bp = biquad("bp");
  let ph = 0;
  for (let i = idx(t0); i < idx(t1) && i < N; i++) {
    const p = (i - idx(t0)) / (idx(t1) - idx(t0));
    if (i % 32 === 0) bp.set(f0 * (f1 / f0) ** p, 1.4);
    ph += (180 * 2 ** (p * 2.6)) / SR;
    const y = (bp.run(rnd()) * 1.6 + Math.sin(TAU * ph) * 0.18) * amp * p ** 2.2;
    put(i, y, y * 0.92, { rev: 0.35 });
  }
}

function kick(t0, amp) {
  let ph = 0;
  for (let i = idx(t0); i < idx(t0 + 0.45) && i < N; i++) {
    const t = (i - idx(t0)) / SR;
    ph += (48 + 110 * Math.exp(-t * 32)) / SR;
    const y = (Math.tanh(Math.sin(TAU * ph) * 1.6) * Math.exp(-t * 7) + rnd() * 0.25 * Math.exp(-t * 250)) * amp;
    put(i, y, y);
  }
}

function clap(t0, amp) {
  const bp = biquad("bp").set(1500, 0.9);
  for (let i = idx(t0); i < idx(t0 + 0.35) && i < N; i++) {
    const t = (i - idx(t0)) / SR;
    const burst = t < 0.03 ? (Math.floor(t / 0.0095) % 2 === 0 ? 1 : 0.35) : 1;
    const y = bp.run(rnd()) * amp * burst * Math.exp(-t * 14) * 2.2;
    put(i, y * 0.95, y, { rev: 0.45 });
  }
}

function hat(t0, amp, open = false, pan = 0.25) {
  const hp = biquad("hp").set(7500, 0.7);
  const d = open ? 0.28 : 0.045;
  for (let i = idx(t0); i < idx(t0 + d * 4) && i < N; i++) {
    const t = (i - idx(t0)) / SR;
    const y = hp.run(rnd()) * amp * Math.exp(-t / d);
    put(i, y * (1 - pan), y * (1 + pan), { rev: 0.12 });
  }
}

function cymbal(t0, amp) {
  const hp = biquad("hp").set(4000, 0.6);
  for (let i = idx(t0); i < idx(t0 + 2.2) && i < N; i++) {
    const t = (i - idx(t0)) / SR;
    const y = hp.run(rnd()) * amp * Math.exp(-t * 1.9);
    put(i, y * (1 + rnd() * 0.3), y * (1 + rnd() * 0.3), { rev: 0.5 });
  }
}

function bass(t0, dur, m, amp) {
  const f = mtof(m),
    lp = biquad("lp");
  let ph = 0,
    ph2 = 0;
  for (let i = idx(t0); i < idx(t0 + dur) && i < N; i++) {
    const t = (i - idx(t0)) / SR;
    if (i % 32 === 0) lp.set(260 + 900 * Math.exp(-t * 14), 1.1);
    ph = (ph + f / SR) % 1;
    ph2 += f / SR;
    const e = Math.min(1, t / 0.005) * Math.min(1, (dur - t) / 0.02);
    const y = (lp.run(2 * ph - 1) * 0.7 + Math.sin(TAU * ph2) * 0.6) * amp * e;
    put(i, y, y, { duck: true });
  }
}

function pluck(t0, m, amp, pan = 0) {
  const f = mtof(m),
    lp = biquad("lp");
  let ph = Math.random();
  for (let i = idx(t0); i < idx(t0 + 0.6) && i < N; i++) {
    const t = (i - idx(t0)) / SR;
    if (i % 16 === 0) lp.set(400 + 5200 * Math.exp(-t * 18), 1.6);
    ph = (ph + f / SR) % 1;
    const y = lp.run(2 * ph - 1) * amp * Math.exp(-t * 7) * Math.min(1, t / 0.002);
    put(i, y * (1 - pan), y * (1 + pan), { rev: 0.3, dly: 0.45 });
  }
}

// FM bell: chimes for "money in", card pops and the logo.
function bell(t0, m, amp, { dur = 2.4, pan = 0, rev = 0.6 } = {}) {
  const f = mtof(m);
  let pc = 0,
    pm = 0;
  for (let i = idx(t0); i < idx(t0 + dur) && i < N; i++) {
    const t = (i - idx(t0)) / SR;
    pm += (f * 3.5) / SR;
    pc += f / SR;
    const I = 2.2 * Math.exp(-t * 6);
    const y = Math.sin(TAU * pc + I * Math.sin(TAU * pm)) * amp * Math.exp(-t * (4 / dur)) * Math.min(1, t / 0.003);
    put(i, y * (1 - pan), y * (1 + pan), { rev, dly: 0.2 });
  }
}

function blip(t0, f, amp, len = 0.07) {
  for (let i = idx(t0); i < idx(t0 + len) && i < N; i++) {
    const t = (i - idx(t0)) / SR;
    const y = Math.sin(TAU * f * t * (1 + t * 3)) * amp * Math.exp(-t * (6 / len));
    put(i, y, y, { rev: 0.25 });
  }
}

function tick(t0, amp) {
  const bp = biquad("bp").set(3200, 6);
  for (let i = idx(t0); i < idx(t0 + 0.05) && i < N; i++) {
    const t = (i - idx(t0)) / SR;
    const y = bp.run(rnd()) * amp * Math.exp(-t * 160) * 3;
    put(i, y * 0.8, y, { rev: 0.2 });
  }
}

function whoosh(t0, t1, amp) {
  const bp = biquad("bp");
  for (let i = idx(t0); i < idx(t1) && i < N; i++) {
    const p = (i - idx(t0)) / (idx(t1) - idx(t0));
    if (i % 32 === 0) bp.set(600 + 5000 * p, 1);
    const y = bp.run(rnd()) * amp * Math.sin(Math.PI * p) ** 2;
    put(i, y * (1 - p * 0.6), y * (0.4 + p * 0.6), { rev: 0.3 });
  }
}

// ---------- the score ----------
// ACT 1 (0 – 9.55): the problem. Dark A minor, a clock ticking, tension rising.
pad(0, 3.4, [45, 52, 60], 0.32, (t) => 500 + t * 120, { att: 1.5, rel: 0.6 });
pad(3.4, 6.9, [41, 48, 52, 57], 0.32, (t) => 700 + (t - 3.4) * 90, { att: 0.5, rel: 0.6 });
pad(6.9, 9.5, [38, 50, 53, 57], 0.34, (t) => 900 + (t - 6.9) ** 2 * 260, { att: 0.3, rel: 0.05 });
sub(0.25, 3, 60, 45, 0.25);
for (let t = 0.75; t < 9.4; t += 0.75) tick(t, t < 3.4 ? 0.16 : t < 6.9 ? 0.22 : 0.27);
sub(3.4, 1.6, 70, 40, 0.3); // the phone rises
blip(3.85, 880, 0.12); // message bubble
blip(4.35, 1320, 0.09);
blip(4.47, 1320, 0.09); // Seen ✓✓
sub(6.9, 1.4, 70, 40, 0.3);
riser(7.0, 9.55, 0.5);
whoosh(9.1, 9.55, 0.25);
// 9.55 – 10.05: a beat of silence, then…

// ACT 2 (10.05): the logo. Big hit, bright C major, shimmer.
impact(10.05, 0.8);
pad(10.05, 12.9, [36, 48, 55, 64, 74], 0.36, (t) => 2500 + (t - 10.05) * 400, { att: 0.02, rel: 0.4, rev: 0.6 });
[84, 91, 88, 96].forEach((m, k) => bell(10.1 + k * 0.12, m, 0.09, { pan: [-0.5, 0.5, -0.2, 0.3][k], dur: 3 }));
riser(11.6, 13.0, 0.35, { f0: 800, f1: 10000 });
for (let k = 0; k < 8; k++) hat(12.0 + k * 0.125, 0.04 + k * 0.012); // count-in

// ACT 3 (13 – 25): the product. 120 BPM groove, C – G – Am – F – C – G.
const BAR = 2,
  BEAT = 0.5,
  G0 = 13;
const CHORDS = [
  { root: 36, pad: [60, 64, 67, 74], arp: [72, 76, 79, 84] },
  { root: 31, pad: [59, 62, 67, 74], arp: [71, 74, 79, 83] },
  { root: 33, pad: [60, 64, 69, 71], arp: [69, 72, 76, 81] },
  { root: 29, pad: [60, 65, 69, 72], arp: [69, 72, 77, 81] },
  { root: 36, pad: [60, 64, 67, 74], arp: [72, 76, 79, 84] },
  { root: 31, pad: [59, 62, 67, 74], arp: [71, 74, 79, 83] },
];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 3, 1, 2];
const kicks = [];
CHORDS.forEach((c, b) => {
  const t0 = G0 + b * BAR;
  pad(t0, t0 + BAR - 0.05, c.pad, 0.22, (t) => 1800 + (t - G0) * 120, { att: 0.08, rel: 0.25, duck: true, rev: 0.4 });
  for (let k = 0; k < 4; k++) {
    kicks.push(t0 + k * BEAT);
    kick(t0 + k * BEAT, 0.7);
    if (k % 2 === 1) clap(t0 + k * BEAT, 0.32);
    hat(t0 + k * BEAT + 0.25, 0.09, k === 3 && b % 2 === 1);
    hat(t0 + k * BEAT + 0.125, 0.035, false, -0.3);
    hat(t0 + k * BEAT + 0.375, 0.035, false, -0.3);
  }
  [0, 0.5, 0.75, 1, 1.5, 1.75].forEach((o, k) => bass(t0 + o, k % 3 === 0 ? 0.4 : 0.2, c.root + (k === 2 || k === 5 ? 12 : 0), 0.32));
  for (let s = 0; s < 16; s++) pluck(t0 + s * 0.125, c.arp[ARP[s]] + (b >= 4 ? 12 : 0), 0.075 + b * 0.008, s % 2 ? 0.35 : -0.35);
});
// Each product beat: a whoosh into the screen change, a crash, and a chime as its card pops.
[16, 19, 22].forEach((t) => (whoosh(t - 0.45, t + 0.05, 0.22), cymbal(t, 0.12)));
cymbal(13, 0.16);
[79, 81, 84, 88].forEach((m, k) => (bell(13 + k * 3 + 0.95, m, 0.12, { pan: 0.2 }), bell(13 + k * 3 + 1.05, m + 7, 0.07, { pan: -0.2 })));

// ACT 4 (25 – 28.5): "Built on PayPal + Gemini". Drums out, build back up.
pad(25, 28.45, [41, 53, 57, 60, 64], 0.3, (t) => 900 + (t - 25) ** 2 * 400, { att: 0.05, rel: 0.05, rev: 0.6 });
sub(25, 2, 70, 41, 0.35);
cymbal(25, 0.12);
[0, 0.13, 0.26, 0.39].forEach((o, k) => bell(26.25 + o, [76, 79, 83, 86][k], 0.1, { dur: 1.4, pan: k % 2 ? 0.4 : -0.4 })); // badges
for (let t = 26.5, step = 0.25; t < 28.45; t += step, step = Math.max(0.0625, step * 0.9)) clap(t, 0.06 + ((t - 26.5) / 2) * 0.22);
riser(26.4, 28.45, 0.5);

// ACT 5 (28.55 – 33): the end card. Final hit, warm resolve, gentle tail.
impact(28.55, 0.85);
pad(28.55, 31.3, [36, 48, 55, 59, 64, 74], 0.36, (t) => 3200 - (t - 28.55) * 500, { att: 0.02, rel: 1.7, rev: 0.7 });
[84, 88, 91, 96].forEach((m, k) => bell(28.6 + k * 0.1, m, 0.08, { pan: [-0.5, 0.5, -0.2, 0.3][k], dur: 3.5 }));
bell(29.9, 91, 0.08, { dur: 2.5 }); // URL pops
bell(30.4, 84, 0.06, { dur: 2.5 });

// ---------- mix ----------
// Sidechain: everything on the duck bus dips under each kick (the "pump").
const duckEnv = new Float32Array(N).fill(1);
for (const k of kicks)
  for (let i = idx(k); i < idx(k + 0.32) && i < N; i++) duckEnv[i] = Math.min(duckEnv[i], 0.25 + 0.75 * ((i - idx(k)) / (0.32 * SR)) ** 0.7);

// Ping-pong delay (dotted eighth).
const dl = idx(0.375),
  dL = new Float32Array(N),
  dR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const bl = i >= dl ? dR[i - dl] : 0,
    br = i >= dl ? dL[i - dl] : 0;
  dL[i] = dlyS[i] + br * 0.38;
  dR[i] = bl * 0.95;
}

// Freeverb-style reverb.
function reverb(input, offset) {
  const sc = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((n) => ({ buf: new Float32Array(Math.round((n + offset) * sc)), p: 0, f: 0 }));
  const aps = [556, 441, 341, 225].map((n) => ({ buf: new Float32Array(Math.round((n + offset) * sc)), p: 0 }));
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = input[i] * 0.015;
    let y = 0;
    for (const c of combs) {
      const o = c.buf[c.p];
      c.f = o * 0.7 + c.f * 0.3;
      c.buf[c.p] = x + c.f * 0.86;
      c.p = (c.p + 1) % c.buf.length;
      y += o;
    }
    for (const a of aps) {
      const b = a.buf[a.p];
      a.buf[a.p] = y + b * 0.5;
      a.p = (a.p + 1) % a.buf.length;
      y = b - y;
    }
    out[i] = y;
  }
  return out;
}
const rvL = reverb(revS, 0),
  rvR = reverb(revS, 23);

const hpL = biquad("hp").set(28),
  hpR = biquad("hp").set(28);
const L = new Float32Array(N),
  R = new Float32Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.4) * Math.min(1, (DUR - t) / 1.6);
  let l = dryL[i] + duckL[i] * duckEnv[i] + dL[i] * 0.3 + rvL[i] * 0.9;
  let r = dryR[i] + duckR[i] * duckEnv[i] + dR[i] * 0.3 + rvR[i] * 0.9;
  // 9.55 – 10.0: hard silence before the logo hit (only the reverb tail breathes).
  if (t > 9.55 && t < 10.04) [l, r] = [rvL[i] * 0.5, rvR[i] * 0.5];
  l = Math.tanh(hpL.run(l) * 1.2 * fade);
  r = Math.tanh(hpR.run(r) * 1.2 * fade);
  L[i] = l;
  R[i] = r;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
}

// 24-bit WAV, normalised to -1 dBFS (loudness is set later by ffmpeg).
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 6);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 6, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 6, 28);
buf.writeUInt16LE(6, 32);
buf.writeUInt16LE(24, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 6, 40);
let o = 44;
for (let i = 0; i < N; i++) {
  for (const s of [L[i], R[i]]) {
    buf.writeIntLE(Math.round(Math.max(-1, Math.min(1, s * g)) * 8388607), o, 3);
    o += 3;
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, buf);
console.log(`saved ${OUT}`);
