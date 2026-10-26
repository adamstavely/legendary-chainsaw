/* Easing for JS-driven tweens: quartic ease-out, the curve the kit's CSS motion uses too */
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
