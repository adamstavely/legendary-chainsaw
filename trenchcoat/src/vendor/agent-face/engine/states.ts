export const FACE_STATES = ["idle", "listening", "thinking", "speaking", "happy", "confused", "sleeping", "error", "surprised"] as const;
export type FaceState = (typeof FACE_STATES)[number];

/** What an expression asks for. Every value blends, so any state can move smoothly into any other. */
export interface Expression {
  /** 0 is shut, 1 is relaxed, above 1 is wide */
  eyeOpen: number;
  /** 0 is a round eye, 1 is a smiling arc */
  eyeSmile: number;
  /** 0 is a round eye, 1 is a cross */
  eyeCross: number;
  /** Positive makes the right eye smaller than the left */
  eyeAsym: number;
  /** -1 to 1, left to right */
  gazeX: number;
  /** -1 to 1, down to up */
  gazeY: number;
  /** 0 is shut, 1 is fully open */
  mouthOpen: number;
  /** -1 is a frown, 1 is a smile */
  mouthCurve: number;
  /** Degrees, clockwise */
  tilt: number;
  /** Negative is squashed, positive is stretched */
  squash: number;
  /** Upward, in the face's 100-unit drawing space */
  lift: number;
  /** Donovan's left hand: 0 is low, 1 is raised high */
  handLeft: number;
  /** Donovan's right hand: 0 is low, 1 is raised high */
  handRight: number;
}

const REST: Expression = { eyeOpen: 1, eyeSmile: 0, eyeCross: 0, eyeAsym: 0, gazeX: 0, gazeY: 0, mouthOpen: 0, mouthCurve: 0, tilt: 0, squash: 0, lift: 0, handLeft: 0.2, handRight: 0.2 };

export const EXPRESSIONS: Record<FaceState, Expression> = {
  idle: REST,
  listening: { ...REST, eyeOpen: 1.2, tilt: 3, squash: -0.02, handLeft: 0.2, handRight: 0.55 },
  thinking: { ...REST, eyeOpen: 0.9, gazeX: 0.5, gazeY: 0.7, tilt: 6, handLeft: 0.2, handRight: 0.72 },
  speaking: { ...REST, mouthOpen: 0.35, mouthCurve: 0.1, handLeft: 0.28, handRight: 0.2 },
  // Donovan sits beside serious decisions, so happy stays small
  happy: { ...REST, eyeSmile: 1, mouthCurve: 0.7, lift: 2, squash: 0.02, handLeft: 0.5, handRight: 0.5 },
  confused: { ...REST, eyeAsym: 0.45, gazeX: -0.3, mouthCurve: -0.2, tilt: -8, handLeft: 0.42, handRight: 0.42 },
  sleeping: { ...REST, eyeOpen: 0, gazeY: -0.2, tilt: 5, squash: -0.05, lift: -2, handLeft: 0, handRight: 0 },
  error: { ...REST, eyeCross: 1, mouthCurve: -0.5, squash: -0.03, handLeft: 0.82, handRight: 0.82 },
  surprised: { ...REST, eyeOpen: 1.35, mouthOpen: 0.3, squash: 0.06, lift: 2, handLeft: 0.95, handRight: 0.95 },
};

/** The least time a state stays on screen, so a chatty agent can't make the face flicker */
export const MIN_HOLD_MS: Record<FaceState, number> = {
  idle: 200,
  listening: 300,
  thinking: 400,
  speaking: 300,
  happy: 800,
  confused: 700,
  sleeping: 500,
  error: 900,
  surprised: 600,
};
