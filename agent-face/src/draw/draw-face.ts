import type { FacePose } from "../engine";
import { GRADIENT, SOFT_PATH } from "./spear-tip.mjs";

const INK = "#fff";
const EYE_Y = 52;
const EYE_GAP = 12;
const MOUTH_Y = 67;
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
  line: number;
  mouth: boolean;
  hands: boolean;
  fingers: boolean;
}

/** Features grow as the face shrinks, so they survive at 16 and 26 px. Too small for a mouth and hands, it moves the body instead. */
export function metricsFor(size: number): FaceMetrics {
  if (size <= 16) return { eyeRadius: 7, line: 6.5, mouth: false, hands: false, fingers: false };
  if (size <= 26) return { eyeRadius: 5.5, line: 5, mouth: false, hands: false, fingers: false };
  return { eyeRadius: 4.2, line: 3.2, mouth: true, hands: true, fingers: size >= FINGERS_FROM_PX };
}

let outline: Path2D | null = null;

/** Draws in a box from (0, 0) to (size, size) in the context's current units. The pose can reach outside the box. */
export function drawFace(ctx: CanvasRenderingContext2D, pose: FacePose, size: number): void {
  const m = metricsFor(size);
  outline ??= new Path2D(SOFT_PATH);
  const stretch = pose.squash + (m.mouth ? 0 : pose.mouthOpen * 0.1);

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

  const gradient = ctx.createLinearGradient(8, 92, 92, 8);
  GRADIENT.forEach((color: string, i: number) => gradient.addColorStop(i / (GRADIENT.length - 1), color));
  ctx.fillStyle = gradient;
  ctx.fill(outline);

  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = m.line;
  const y = EYE_Y - pose.gazeY * 3;
  const shift = pose.gazeX * 3;
  drawEye(ctx, pose, m, 50 - EYE_GAP + shift, y, 1);
  drawEye(ctx, pose, m, 50 + EYE_GAP + shift, y, 1 - pose.eyeAsym);
  if (m.mouth) drawMouth(ctx, pose);
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
    const rx = r * Math.max(1, open);
    // A shut eye is a short pill, never a line that vanishes
    const ry = Math.max(r * open, m.line / 2);
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
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
  const curve = pose.mouthCurve;
  if (Math.abs(curve) > 0.03) {
    ctx.globalAlpha = Math.min(1, Math.abs(curve) * 5);
    ctx.beginPath();
    ctx.moveTo(45, MOUTH_Y);
    ctx.quadraticCurveTo(50, MOUTH_Y + curve * 8, 55, MOUTH_Y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (pose.mouthOpen > 0.02) {
    ctx.beginPath();
    ctx.ellipse(50, MOUTH_Y, 2.5 + pose.mouthOpen * 3, 1 + pose.mouthOpen * 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
