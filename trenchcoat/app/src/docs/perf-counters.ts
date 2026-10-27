// Counts animation-frame and timer callbacks as they run, for the idle measurements in perf-harness.tsx. Imported
// first, so it wraps the globals before any element module loads.
export const counts = { frames: 0, timers: 0 };

const raf = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = (cb) =>
  raf((t) => {
    counts.frames++;
    cb(t);
  });

const timeout = window.setTimeout.bind(window);
window.setTimeout = ((cb: TimerHandler, ms?: number, ...args: unknown[]) =>
  timeout(
    (...a: unknown[]) => {
      counts.timers++;
      if (typeof cb === "function") (cb as (...x: unknown[]) => void)(...a);
    },
    ms,
    ...args,
  )) as typeof window.setTimeout;

const interval = window.setInterval.bind(window);
window.setInterval = ((cb: TimerHandler, ms?: number, ...args: unknown[]) =>
  interval(
    (...a: unknown[]) => {
      counts.timers++;
      if (typeof cb === "function") (cb as (...x: unknown[]) => void)(...a);
    },
    ms,
    ...args,
  )) as typeof window.setInterval;
