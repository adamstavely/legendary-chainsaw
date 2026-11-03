/*
 * The other faces of <tc-voice-orb>: each paints one frame on the canvas from the same inputs as the dot sphere, so a
 * state melts into the next and `level` moves them all. Pure drawing: time and state come in as arguments.
 */

export type VoiceOrbVariant = "sphere" | "ring" | "wave" | "bars" | "blob" | "orbit";
type Rgb = [number, number, number];
type Frame = {
  ctx: CanvasRenderingContext2D;
  /** Edge length of the canvas in CSS px */
  w: number;
  /** Seconds */
  t: number;
  /** The sphere's turning angle, which speeds up while thinking */
  angle: number;
  /** Shown loudness from 0 to 1 */
  level: number;
  weight: { idle: number; listening: number; thinking: number; speaking: number };
  ink: Rgb;
  tint: Rgb;
};

const TAU = Math.PI * 2;
const rgba = (c: Rgb, a: number) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${a.toFixed(3)})`;
const mix = (a: Rgb, b: Rgb, k: number): Rgb => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** How much of the frame is listening or speaking, by loudness */
const energy = (f: Frame) => (f.weight.listening + f.weight.speaking) * f.level;

/** A closed curve around the centre, its radius given per angle */
function closed(f: Frame, radius: (a: number) => number, steps = 120) {
  const c = f.w / 2;
  f.ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * TAU;
    const r = radius(a);
    const x = c + Math.cos(a) * r;
    const y = c + Math.sin(a) * r;
    if (i) f.ctx.lineTo(x, y);
    else f.ctx.moveTo(x, y);
  }
  f.ctx.closePath();
}

/** A line that ripples with the voice; thinking, a light runs around it */
function ring(f: Frame) {
  const { ctx, w, t, level, weight, ink, tint } = f;
  const c = w / 2;
  const R = w * 0.3;
  const amp = w * (weight.idle * 0.006 + weight.listening * level * 0.075 + weight.speaking * level * 0.055);
  const on = Math.min(1, energy(f) * 2.2);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  [
    { off: 0.12, width: 0.006, alpha: 0.25, speed: 0.7 },
    { off: 0.06, width: 0.008, alpha: 0.5, speed: -0.85 },
    { off: 0, width: 0.013, alpha: 1, speed: 1 },
  ].forEach(({ off, width, alpha, speed }) => {
    closed(f, (a) => {
      const wave = (Math.sin(a * 3 + t * 2.3 * speed) + Math.sin(a * 5 - t * 1.7 * speed) + Math.sin(a * 8 + t * 2.9 * speed)) / 3;
      return R * (1 - off * (1 + weight.thinking)) + (weight.idle * w * 0.006 * Math.sin(t * 1.3) + amp * wave) * (1 - off * 2);
    });
    ctx.strokeStyle = rgba(mix(ink, tint, on), alpha * (1 - weight.thinking * 0.72));
    ctx.lineWidth = w * width;
    ctx.stroke();
  });
  if (weight.thinking > 0.01) {
    const head = t * 3.4;
    const sweep = 1.1 + 0.5 * Math.sin(t * 1.8);
    ctx.beginPath();
    ctx.arc(c, c, R, head, head + sweep);
    ctx.strokeStyle = rgba(tint, weight.thinking);
    ctx.lineWidth = w * 0.018;
    ctx.stroke();
  }
}

/** Three lines that swell in the middle; thinking, a small packet travels along them */
function wave(f: Frame) {
  const { ctx, w, t, level, weight, ink, tint } = f;
  const c = w / 2;
  const half = w * 0.4;
  const amp = w * (weight.idle * 0.012 + weight.thinking * 0.075 + weight.listening * level * 0.2 + weight.speaking * level * 0.25);
  const packet = 0.5 + 0.38 * Math.sin(t * 2.2);
  const on = Math.min(1, energy(f) * 2 + weight.thinking * 0.7);
  const steps = 72;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  [
    { freq: 7, speed: -3.1, scale: 0.55, alpha: 0.32, width: 0.008 },
    { freq: 11, speed: 4.3, scale: 0.75, alpha: 0.55, width: 0.009 },
    { freq: 9, speed: 3.4, scale: 1, alpha: 1, width: 0.013 },
  ].forEach(({ freq, speed, scale, alpha, width }) => {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const whole = Math.sin(Math.PI * u) ** 2;
      const near = Math.exp(-(((u - packet) / 0.14) ** 2));
      const env = whole * (1 - weight.thinking) + near * whole * weight.thinking;
      const y = c + env * amp * scale * Math.sin(u * freq + t * speed);
      const x = c - half + u * half * 2;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = rgba(mix(ink, tint, on), alpha);
    ctx.lineWidth = w * width;
    ctx.stroke();
  });
}

/** Five pills, an equaliser; thinking, a bump passes along them */
function bars(f: Frame) {
  const { ctx, w, t, level, weight, ink, tint } = f;
  const c = w / 2;
  const n = 5;
  const bar = w * 0.082;
  const gap = w * 0.052;
  const from = c - (n * bar + (n - 1) * gap) / 2;
  const speech = [0.55, 0.85, 1, 0.8, 0.5];
  const seeds = [1.1, 2.3, 0.7, 3.1, 1.9];
  for (let i = 0; i < n; i++) {
    const hear = (0.35 + 0.65 * Math.abs(Math.sin(t * (2.6 + seeds[i]) + seeds[i] * 2))) * level;
    const say = speech[i] * (0.4 + 0.6 * Math.abs(Math.sin(t * 5.2 + i * 1.3))) * level;
    const pass = Math.max(0, Math.cos(t * 4.2 - i * 0.95)) ** 4;
    const rest = 0.5 + 0.5 * Math.sin(t * 1.3 + i * 0.6);
    const drive = weight.idle * rest * 0.05 + weight.listening * hear + weight.speaking * say + weight.thinking * pass * 0.4;
    const h = bar + w * 0.48 * drive;
    const on = Math.min(1, drive * 2.4);
    ctx.fillStyle = rgba(mix(ink, tint, on), 0.72 + on * 0.28);
    ctx.beginPath();
    ctx.roundRect(from + i * (bar + gap), c - h / 2, bar, h, bar / 2);
    ctx.fill();
  }
}

/** A soft drop of colour whose edge moves with the voice; thinking, its light circles inside */
function blob(f: Frame) {
  const { ctx, w, t, level, weight, ink, tint } = f;
  const c = w / 2;
  const R = w * (0.29 + 0.008 * weight.idle * Math.sin(t * 0.8) + 0.02 * energy(f) - 0.02 * weight.thinking);
  const amp = w * (0.012 + weight.listening * level * 0.026 + weight.speaking * level * 0.02 + weight.thinking * 0.008);
  // Steady speeds: scaling `t` by something that changes would jump the phase by however long the page has been open
  const edge = (s: number) => (a: number) => R * s + amp * (Math.sin(a * 2 + t * 0.5) + 0.6 * Math.sin(a * 3 - t * 0.7 + s * 4) + 0.35 * Math.sin(a * 5 + t * 0.9));
  // A wider, fainter edge behind the drop
  closed(f, edge(1.13));
  ctx.fillStyle = rgba(tint, 0.14 + energy(f) * 0.16);
  ctx.fill();
  // The sphere's angle already speeds up smoothly while thinking
  const orbit = f.angle * 1.4;
  const lx = c + Math.cos(orbit) * R * 0.42;
  const ly = c + Math.sin(orbit) * R * 0.42;
  const g = ctx.createRadialGradient(lx, ly, R * 0.05, c, c, R * 1.2);
  g.addColorStop(0, rgba(mix(tint, [255, 255, 255], 0.55), 1));
  g.addColorStop(0.5, rgba(tint, 1));
  g.addColorStop(1, rgba(mix(tint, ink, 0.3), 1));
  closed(f, edge(1));
  ctx.fillStyle = g;
  ctx.fill();
}

/** Beads on three tilted paths; they widen with the voice and race while thinking */
function orbit(f: Frame) {
  const { ctx, w, t, angle, level, weight, ink, tint } = f;
  const c = w / 2;
  const R = w * (0.3 + 0.07 * energy(f) - 0.05 * weight.thinking);
  const on = Math.min(1, energy(f) * 2 + weight.thinking * 0.8);
  const paths = [0, TAU / 6, -TAU / 6];
  const beads = 16;
  ctx.fillStyle = rgba(mix(ink, tint, on), 0.9);
  ctx.beginPath();
  ctx.arc(c, c, w * (0.03 + 0.03 * energy(f) + 0.008 * Math.sin(t * 1.3)), 0, TAU);
  ctx.fill();
  paths.forEach((tilt, p) => {
    const cos = Math.cos(tilt + angle * 0.12);
    const sin = Math.sin(tilt + angle * 0.12);
    const squash = 0.36 + 0.06 * Math.sin(t * 0.8 + p);
    for (let i = 0; i < beads; i++) {
      const a = (i / beads) * TAU + angle * (1.6 + p * 0.3) * (p % 2 ? -1 : 1);
      const swell = 1 + (weight.listening + weight.speaking) * level * 0.12 * Math.sin(i * 1.9 + t * 6);
      const ex = Math.cos(a) * R * swell;
      const ey = Math.sin(a) * R * squash * swell;
      const near = (Math.sin(a) + 1) / 2;
      // The light at the head of each path, while thinking
      const head = weight.thinking * Math.max(0, Math.cos((i / beads) * TAU - t * 2.4)) ** 6;
      ctx.fillStyle = rgba(mix(ink, tint, Math.min(1, on + head)), 0.22 + 0.78 * near);
      ctx.beginPath();
      ctx.arc(c + ex * cos - ey * sin, c + ex * sin + ey * cos, w * (0.008 + 0.009 * near + 0.008 * head), 0, TAU);
      ctx.fill();
    }
  });
}

export const voiceOrbPainters: Record<Exclude<VoiceOrbVariant, "sphere">, (frame: Frame) => void> = { ring, wave, bars, blob, orbit };
