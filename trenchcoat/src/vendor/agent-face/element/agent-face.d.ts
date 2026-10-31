import { type FaceGesture, type FaceState } from "../engine";
import { type Tickable } from "./loop";
/**
 * Donovan's face.
 *
 * @attr state - idle, listening, thinking, speaking, happy, confused, sleeping, error or surprised
 * @attr size - Width and height in pixels, 16 to 256. Default 64
 * @attr name - Who the screen-reader label names. Default Donovan
 * @attr label - Replaces the screen-reader label in every state
 * @attr announce - Also tells screen readers when the state changes. Off by default, so it doesn't talk over the chat
 * @attr motion - auto follows the system setting, or full or reduced. Default auto
 * @attr rest-after - How long, in ms, before the small movements fade out when Donovan isn't busy. Default 30000
 * @attr seed - Makes the small movements repeatable
 */
export declare class AgentFace extends HTMLElement implements Tickable {
    static observedAttributes: string[];
    private readonly canvas;
    private readonly status;
    private engine;
    private observer;
    private readonly reducedQuery;
    private onScreen;
    private looping;
    private quietFor;
    private spokenState;
    private amplitudeValue;
    private pixelRatio;
    private labelsValue;
    constructor();
    get state(): FaceState;
    set state(value: FaceState);
    /** Screen-reader labels per state, for translation */
    get labels(): Partial<Record<FaceState, string>>;
    set labels(value: Partial<Record<FaceState, string>>);
    /** What's on screen now, which can lag `state` while the last state finishes its minimum hold */
    get shownState(): FaceState;
    /** How loud the agent is, 0 to 1, to drive the mouth while speaking. null goes back to made-up speech */
    get amplitude(): number | null;
    set amplitude(value: number | null);
    /** Plays once. Returns false when reduced motion rules it out or the face isn't on the page */
    playGesture(gesture: FaceGesture): boolean;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string): void;
    tick(dtMs: number): void;
    private get restAfter();
    private get boxSize();
    private resolvedMotion;
    private applySize;
    private wake;
    private updateLoop;
    private setLooping;
    private readonly onMotionChange;
    private readonly onVisibility;
    private readonly redraw;
    private paint;
    private syncLabels;
}
