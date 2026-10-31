import { type Expression, type FaceState } from "./states";
export type FaceGesture = "nod" | "hop" | "spin" | "wave";
export type FaceMotion = "full" | "reduced";
export interface FacePose extends Expression {
    /** Degrees, from a spin gesture */
    spin: number;
}
export interface FaceEngineOptions {
    seed?: number;
    state?: FaceState;
    /** Blinks, glances, breathing and made-up speech. Default true */
    ambient?: boolean;
    motion?: FaceMotion;
}
/** Turns a state and the passing of time into a pose. It knows nothing about the DOM or how the face is drawn. */
export declare class FaceEngine {
    private readonly random;
    private readonly springs;
    private readonly ambientWeight;
    private tick;
    private carry;
    private current;
    private pending;
    private earliestChange;
    private ambient;
    private motion;
    private amplitude;
    private nextBlink;
    private blinkStart;
    private nextGlance;
    private glanceX;
    private glanceY;
    private nextSyllable;
    private syllable;
    private gesture;
    private gestureStart;
    constructor(options?: FaceEngineOptions);
    get state(): FaceState;
    /** Goes to the state once the current one has held for its minimum time. If several arrive first, the last one wins. */
    setState(state: FaceState): void;
    /** Plays once. Returns false when reduced motion rules it out. Playing again restarts it. */
    playGesture(gesture: FaceGesture): boolean;
    /** How loud the agent is, from 0 to 1, to drive the mouth while speaking. null goes back to made-up speech. */
    setAmplitude(amplitude: number | null): void;
    setAmbient(ambient: boolean): void;
    setMotion(motion: FaceMotion): void;
    /** Moves time on. Any way of slicing the same time gives the same pose, so frame rate doesn't change the result. */
    step(dtMs: number): void;
    pose(): FacePose;
    /** True when nothing will change until someone calls a setter, so a draw loop can stop */
    get atRest(): boolean;
    private get now();
    private get ambientOn();
    private advance;
    private applyPending;
    private runAmbient;
    private aim;
    private settleNow;
    private scheduleBlink;
    private scheduleGlance;
}
