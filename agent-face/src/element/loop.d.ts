export interface Tickable {
    tick(dtMs: number): void;
}
/** Every face on the page shares one animation frame */
export declare function addToLoop(face: Tickable): void;
export declare function removeFromLoop(face: Tickable): void;
export declare function loopSize(): number;
