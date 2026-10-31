import type { FacePose } from "../engine";
import { BODY_GRADIENT, BODY_PATH, LEG_FACE_PATH, LEG_GRADIENT, LEG_PATH, LEG_RIM, TIP_PATH, type LogoGradient } from "./spear-tip.mjs";

const INK = "#fff";
// The face sits on the long stroke, above where the short one crosses it
const EYE_Y = 38;
const EYE_GAP = 8.5;
const MOUTH_Y = 49;
const MOUTH_HALF_WIDTH = 4.5;
const PIVOT_Y = 55;
const BASE_Y = 88;
const LINE_COLOR = "#000";
const HAND_COLOR = "#fff";
const HAND_ORBIT_X = 29;
const HAND_ORBIT_Y = 62;
const HAND_REACH = 32;
const PALM_RADIUS = 4.2;
const FINGER_LENGTH = 9.5;
const FINGER_WIDTH = 2.5;
const FINGER_SPREAD = 0.6;
// Below this size separate fingers blur together, so the hand becomes a mitten
const FINGERS_FROM_PX = 90;
// The hand's outline stays this many pixels wide at any size
const OUTLINE_PX = 1.25;

export interface FaceMetrics {
  eyeRadius: number;
  eyeWidth: number;
  eyeHeight: number;
  line: number;
  hands: boolean;
  fingers: boolean;
}

/** Features grow as the face shrinks, so they survive at 16 and 26 px. Too small for hands, it leaves them out. */
export function metricsFor(size: number): FaceMetrics {
  if (size <= 16) return { eyeRadius: 7, eyeWidth: 4.4, eyeHeight: 7.5, line: 6.5, hands: false, fingers: false };
  if (size <= 26) return { eyeRadius: 5.5, eyeWidth: 3.5, eyeHeight: 6, line: 5, hands: false, fingers: false };
  return { eyeRadius: 4.2, eyeWidth: 2.3, eyeHeight: 4.75, line: 2.6, hands: true, fingers: size >= FINGERS_FROM_PX };
}

interface LogoPaths {
  body: Path2D;
  leg: Path2D;
  legFace: Path2D;
  tip: Path2D;
}

let logo: LogoPaths | null = null;

function fillGradient(ctx: CanvasRenderingContext2D, { from, to, stops }: LogoGradient): CanvasGradient {
  const gradient = ctx.createLinearGradient(from[0], from[1], to[0], to[1]);
  for (const [at, color] of stops) gradient.addColorStop(at, color);
  return gradient;
}

/** Draws in a box from (0, 0) to (size, size) in the context's current units. The pose can reach outside the box. */
export function drawFace(ctx: CanvasRenderingContext2D, pose: FacePose, size: number): void {
  const m = metricsFor(size);
  logo ??= { body: new Path2D(BODY_PATH), leg: new Path2D(LEG_PATH), legFace: new Path2D(LEG_FACE_PATH), tip: new Path2D(TIP_PATH) };
  const stretch = pose.squash;

  ctx.save();
  ctx.scale(size / 100, size / 100);
  ctx.translate(50, PIVOT_Y - pose.lift);
  ctx.rotate(((pose.tilt + pose.spin) * Math.PI) / 180);
  ctx.translate(-50, -PIVOT_Y);
  ctx.translate(50, BASE_Y);
  ctx.scale(1 - stretch / 2, 1 + stretch);
  ctx.translate(-50, -BASE_Y);

  // Floating hands go behind the body, so one passing it never covers the face
  if (m.hands) {
    const outline = (OUTLINE_PX * 100) / size;
    placeHand(ctx, -1, pose.handLeft, outline, m.fingers);
    placeHand(ctx, 1, pose.handRight, outline, m.fingers);
  }

  ctx.fillStyle = fillGradient(ctx, BODY_GRADIENT);
  ctx.fill(logo.body);
  ctx.fillStyle = fillGradient(ctx, LEG_RIM);
  ctx.fill(logo.leg);
  ctx.fill(logo.tip);
  ctx.fillStyle = fillGradient(ctx, LEG_GRADIENT);
  ctx.fill(logo.legFace);

  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = m.line;
  const y = EYE_Y - pose.gazeY * 3;
  const shift = pose.gazeX * 3;
  drawEye(ctx, pose, m, 50 - EYE_GAP + shift, y, 1);
  drawEye(ctx, pose, m, 50 + EYE_GAP + shift, y, 1 - pose.eyeAsym);
  drawMouth(ctx, pose);
  ctx.restore();
}

function placeHand(ctx: CanvasRenderingContext2D, side: -1 | 1, raise: number, outline: number, fingers: boolean): void {
  const angle = ((15 + raise * 135) * Math.PI) / 180;
  const x = 50 + side * HAND_ORBIT_X;
  const handX = x + side * Math.sin(angle) * HAND_REACH;
  const handY = HAND_ORBIT_Y + Math.cos(angle) * HAND_REACH;
  ctx.save();
  ctx.translate(handX, handY);
  // Fingers point away from the body, with the thumb on the side towards the head
  ctx.rotate(Math.atan2(handY - HAND_ORBIT_Y, handX - x));
  // The outline keeps a white hand visible on a white page
  drawHand(ctx, LINE_COLOR, outline * 2, -side, fingers);
  drawHand(ctx, HAND_COLOR, 0, -side, fingers);
  ctx.restore();
}

/** One silhouette of the hand. Painted black and thick, then white on top, it gets one outline around all its parts. */
function drawHand(ctx: CanvasRenderingContext2D, color: string, grow: number, thumbSide: number, fingers: boolean): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(1, 0, PALM_RADIUS + grow / 2, 0, Math.PI * 2);
  ctx.fill();
  const digit = (angle: number, length: number, width: number, from = 2) => {
    ctx.lineWidth = width + grow;
    ctx.beginPath();
    ctx.moveTo(from * Math.cos(angle), from * Math.sin(angle));
    ctx.lineTo(length * Math.cos(angle), length * Math.sin(angle));
    ctx.stroke();
  };
  if (fingers) {
    for (const spread of [-FINGER_SPREAD, 0, FINGER_SPREAD]) digit(spread, FINGER_LENGTH, FINGER_WIDTH);
    digit(thumbSide * 1.5, 7.5, FINGER_WIDTH, 2);
  } else {
    digit(0, 7, PALM_RADIUS * 1.7);
    digit(thumbSide * 1.3, 8, FINGER_WIDTH + 0.5, 2);
  }
}

function drawEye(ctx: CanvasRenderingContext2D, pose: FacePose, m: FaceMetrics, x: number, y: number, scale: number): void {
  const r = m.eyeRadius * scale;
  const round = 1 - Math.max(pose.eyeSmile, pose.eyeCross);
  if (round > 0.01) {
    ctx.globalAlpha = round;
    const open = pose.eyeOpen;
    // A tall pill that widens as it shuts, ending as a short pill, never a line that vanishes
    const width = m.eyeWidth * scale;
    const rx = open < 1 ? width + (r - width) * (1 - open) : width * open;
    const ry = Math.max(m.eyeHeight * scale * open, m.line / 2);
    ctx.beginPath();
    ctx.roundRect(x - rx, y - ry, rx * 2, ry * 2, Math.min(rx, ry));
    ctx.fill();
  }
  if (pose.eyeSmile > 0.01) {
    ctx.globalAlpha = pose.eyeSmile;
    ctx.beginPath();
    ctx.moveTo(x - r * 1.3, y + r * 0.5);
    ctx.quadraticCurveTo(x, y - r * 1.5, x + r * 1.3, y + r * 0.5);
    ctx.stroke();
  }
  if (pose.eyeCross > 0.01) {
    const d = r * 0.9;
    ctx.globalAlpha = pose.eyeCross;
    ctx.beginPath();
    ctx.moveTo(x - d, y - d);
    ctx.lineTo(x + d, y + d);
    ctx.moveTo(x + d, y - d);
    ctx.lineTo(x - d, y + d);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawMouth(ctx: CanvasRenderingContext2D, pose: FacePose): void {
  // Always a mouth: a line, flat at rest, that gives way to the open shape as it opens
  const line = 1 - Math.min(1, pose.mouthOpen * 8);
  if (line > 0.01) {
    ctx.globalAlpha = line;
    ctx.beginPath();
    ctx.moveTo(50 - MOUTH_HALF_WIDTH, MOUTH_Y);
    ctx.quadraticCurveTo(50, MOUTH_Y + pose.mouthCurve * 8, 50 + MOUTH_HALF_WIDTH, MOUTH_Y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (pose.mouthOpen > 0.02) {
    ctx.beginPath();
    ctx.ellipse(50, MOUTH_Y, 2.5 + pose.mouthOpen * 3, 1 + pose.mouthOpen * 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
