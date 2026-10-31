export type Random = () => number;
/** mulberry32: small, and the same seed gives the same numbers everywhere */
export declare function seededRandom(seed: number): Random;
