export declare const FACE_STATES: readonly ["idle", "listening", "thinking", "speaking", "happy", "confused", "sleeping", "error", "surprised"];
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
export declare const EXPRESSIONS: Record<FaceState, Expression>;
/** The least time a state stays on screen, so a chatty agent can't make the face flicker */
export declare const MIN_HOLD_MS: Record<FaceState, number>;
