export interface SpringConfig {
    stiffness: number;
    damping: number;
}
export declare class Spring {
    private readonly config;
    value: number;
    velocity: number;
    target: number;
    constructor(initial: number, config: SpringConfig);
    /** One semi-implicit Euler step, which stays stable at the engine's fixed time step */
    step(dtSeconds: number): void;
    snap(): void;
    get atRest(): boolean;
}
