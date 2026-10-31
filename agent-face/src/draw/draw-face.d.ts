import type { FacePose } from "../engine";
export interface FaceMetrics {
    eyeRadius: number;
    line: number;
    mouth: boolean;
    hands: boolean;
    fingers: boolean;
}
/** Features grow as the face shrinks, so they survive at 16 and 26 px. Too small for a mouth and hands, it moves the body instead. */
export declare function metricsFor(size: number): FaceMetrics;
/** Draws in a box from (0, 0) to (size, size) in the context's current units. The pose can reach outside the box. */
export declare function drawFace(ctx: CanvasRenderingContext2D, pose: FacePose, size: number): void;
