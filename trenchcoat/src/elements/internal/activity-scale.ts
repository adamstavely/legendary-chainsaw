/*
 * The shading shared by the activity elements (activity-clock, activity-calendar): a value becomes a level from
 * empty to full, and a level becomes how much of the ink is mixed into the track.
 */

/** How many steps of activity `levels` gives, not counting empty – at least one */
export const activitySteps = (levels: number) => Math.max(2, Math.round(levels) || 5) - 1;

/** -1 no data, 0 nothing happened, 1…steps how busy, scaled so `top` is the last step */
export function activityLevel(v: number | null, top: number, steps: number) {
  if (v === null) return -1;
  if (v <= 0) return 0;
  return Math.min(steps, Math.max(1, Math.ceil((v / top) * steps)));
}

/** The share of ink in a level's colour, in %: the first step is light, the last is the full colour */
export const activityMix = (level: number, steps: number) => (steps === 1 ? 100 : Math.round(18 + ((level - 1) / (steps - 1)) * 82));
