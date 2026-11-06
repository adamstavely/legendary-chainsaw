/*
 * The charts' motion (ported from ztd-charts' useMotion, MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts).
 * A chart hands it its marks on every model change with sync(); it holds them at their start values until the chart is
 * on screen, plays the entrance, glides from wherever the marks are when the data changes, and snaps when motion is off.
 * While anything moves it asks the host for one update per frame from the shared animation loop, and none otherwise.
 */
import type { ReactiveController, ReactiveControllerHost } from "lit";
import { MotionEngine, subscribeTick, type EasingName, type Mark, type MotionItem } from "./motion";

type Phase = "init" | "idle" | "running" | "done";

export type MotionOptions = {
  /** Animate at all (not `still`, not reduced motion) */
  enabled: boolean;
  /** On screen and measured: the entrance may start */
  active: boolean;
  /** Changes when the data does: a change glides, the same data at a new size snaps */
  dataKey: unknown;
  easing: EasingName;
  duration: number;
  /** Delay between marks when the data changes (ms) */
  stagger: number;
};

/** The animation clock: the frame's timestamp while ticking, else the document's */
const clock = () => (typeof performance !== "undefined" ? performance.now() : 0);

/** Two marks with the same key would merge into one track: the second and later get "#2", "#3" */
function uniqueKeys<M>(marks: Mark<M>[]): Mark<M>[] {
  const seen = new Map<string, number>();
  let dup = false;
  for (const m of marks) {
    const n = (seen.get(m.key) ?? 0) + 1;
    seen.set(m.key, n);
    if (n > 1) dup = true;
  }
  if (!dup) return marks;
  seen.clear();
  return marks.map((m) => {
    const n = (seen.get(m.key) ?? 0) + 1;
    seen.set(m.key, n);
    return n > 1 ? { ...m, key: `${m.key}#${n}` } : m;
  });
}

export class MotionController<M> implements ReactiveController {
  private engine = new MotionEngine<M>();
  private phase: Phase = "init";
  private marks: Mark<M>[] | null = null;
  private dataKey: unknown = undefined;
  private unsub: (() => void) | null = null;
  private opts: MotionOptions = { enabled: false, active: false, dataKey: undefined, easing: "spring", duration: 900, stagger: 0 };
  /** Goes up by one every time the entrance starts – a key for CSS animations that should replay with it */
  generation = 0;

  constructor(private host: ReactiveControllerHost) {
    host.addController(this);
  }

  /** New marks or options; call from willUpdate */
  sync(input: Mark<M>[], opts: MotionOptions) {
    const marks = uniqueKeys(input);
    const was = this.opts;
    this.opts = opts;
    const e = this.engine;
    e.configure(opts.easing, opts.duration);
    if (!opts.enabled) {
      e.snap(marks);
      this.phase = "done";
    } else if (this.phase === "init") {
      e.hold(marks);
      this.phase = "idle";
    } else if (!e.sameTargets(marks)) {
      if (this.phase === "idle") e.hold(marks);
      else if (this.phase === "running" || !Object.is(this.dataKey, opts.dataKey)) e.update(marks, clock(), opts.stagger);
      else e.snap(marks);
    } else e.refreshData(marks);
    // Turned back on after being still: the marks are where they belong, so nothing replays
    if (opts.enabled && !was.enabled && this.phase === "done") e.snap(marks);
    this.marks = marks;
    this.dataKey = opts.dataKey;
    if (opts.enabled && opts.active && this.phase === "idle") {
      e.start(clock());
      this.generation++;
      this.phase = "running";
    }
    this.tickIfMoving();
  }

  /** Plays the entrance again from the start values */
  replay() {
    if (!this.marks || !this.opts.enabled) return;
    this.engine.hold(this.marks);
    this.phase = "idle";
    this.host.requestUpdate();
  }

  /** The marks as they are now, in their first-seen order; leaving ones included (exiting) */
  get items(): MotionItem<M>[] {
    return this.engine.items();
  }
  /** One mark's current values */
  get(key: string) {
    return this.engine.get(key);
  }
  /** Not yet started: the chart is off screen and holding its start values */
  get waiting() {
    return this.opts.enabled && this.phase === "idle";
  }
  get animating() {
    return this.engine.animating;
  }
  /** 0 → 1 from `delay` ms into the entrance over `len` ms, for things that fade in with it; 1 once it's over */
  fade(delay: number, len = 320) {
    if (this.waiting) return 0;
    const t = this.engine.elapsed(clock());
    if (!Number.isFinite(t)) return 1;
    return Math.max(0, Math.min(1, (t - delay) / len));
  }

  private tickIfMoving() {
    if (this.unsub || !this.engine.animating || typeof requestAnimationFrame === "undefined") return;
    this.unsub = subscribeTick((t) => {
      const moving = this.engine.step(t);
      if (!moving) {
        if (this.phase === "running") this.phase = "done";
        this.unsub = null;
      }
      this.host.requestUpdate();
      return moving;
    });
  }

  hostConnected() {
    this.tickIfMoving();
  }

  hostDisconnected() {
    this.unsub?.();
    this.unsub = null;
  }
}
