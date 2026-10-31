import { describe, expect, it } from "vitest";
import { EXPRESSIONS, FACE_STATES, FaceEngine, MIN_HOLD_MS, type Expression, type FacePose, type FaceState } from "../../src/engine";

const run = (engine: FaceEngine, ms: number, frame = 16) => {
  for (let t = 0; t < ms; t += frame) engine.step(frame);
};
const sample = (engine: FaceEngine, ms: number, read: (pose: FacePose) => number, frame = 16) => {
  const seen: number[] = [];
  for (let t = 0; t < ms; t += frame) {
    engine.step(frame);
    seen.push(read(engine.pose()));
  }
  return seen;
};

describe("repeatability", () => {
  const script = (engine: FaceEngine, frame: number) => {
    run(engine, 3000, frame);
    engine.setState("thinking");
    run(engine, 2000, frame);
    engine.setState("speaking");
    engine.playGesture("hop");
    run(engine, 3000, frame);
    return engine.pose();
  };

  it("gives the same pose for the same seed", () => {
    expect(script(new FaceEngine({ seed: 7 }), 16)).toEqual(script(new FaceEngine({ seed: 7 }), 16));
  });

  it("gives different ambient motion for different seeds", () => {
    const blinks = (seed: number) => sample(new FaceEngine({ seed }), 20000, (p) => p.eyeOpen).findIndex((v) => v < 0.5);
    expect(blinks(1)).not.toBe(blinks(2));
  });

  it("doesn't depend on frame rate", () => {
    const at = (frame: number) => {
      const engine = new FaceEngine({ seed: 3 });
      engine.setState("happy");
      for (let i = 0; i < 2400 / frame; i++) engine.step(frame);
      return engine.pose();
    };
    const fast = at(4);
    const slow = at(48);
    for (const key of Object.keys(fast) as (keyof FacePose)[]) expect(fast[key]).toBeCloseTo(slow[key], 5);
  });
});

describe("states", () => {
  it.each(FACE_STATES)("%s settles on its expression", (state: FaceState) => {
    const engine = new FaceEngine({ ambient: false });
    engine.setState(state);
    run(engine, 6000);
    const pose = engine.pose();
    for (const key of Object.keys(EXPRESSIONS[state]) as (keyof Expression)[]) expect(pose[key]).toBeCloseTo(EXPRESSIONS[state][key], 2);
    expect(engine.atRest).toBe(true);
  });

  it("every pair of states blends without leaving sensible ranges", () => {
    for (const from of FACE_STATES) {
      for (const to of FACE_STATES) {
        const engine = new FaceEngine({ state: from, ambient: false });
        engine.setState(to);
        for (const pose of Array.from({ length: 120 }, () => (engine.step(16), engine.pose()))) {
          expect(pose.eyeOpen).toBeGreaterThanOrEqual(0);
          expect(pose.eyeOpen).toBeLessThan(1.7);
          expect(pose.mouthOpen).toBeGreaterThanOrEqual(0);
          expect(pose.mouthOpen).toBeLessThanOrEqual(1);
          expect(Math.abs(pose.tilt)).toBeLessThan(20);
        }
      }
    }
  });

  it("starts in the state it's given, already settled", () => {
    expect(new FaceEngine({ state: "sleeping", ambient: false }).pose().eyeOpen).toBe(0);
  });
});

describe("minimum hold", () => {
  it("changes straight away the first time", () => {
    const engine = new FaceEngine();
    engine.setState("thinking");
    expect(engine.state).toBe("thinking");
  });

  it("holds a state, then the last request wins", () => {
    const engine = new FaceEngine();
    engine.setState("happy");
    engine.setState("error");
    engine.setState("thinking");
    expect(engine.state).toBe("happy");
    run(engine, MIN_HOLD_MS.happy - 50);
    expect(engine.state).toBe("happy");
    run(engine, 100);
    expect(engine.state).toBe("thinking");
  });

  it("doesn't flicker under rapid changes", () => {
    const engine = new FaceEngine();
    let changes = 0;
    let last = engine.state;
    for (let t = 0; t < 3000; t += 16) {
      engine.setState(FACE_STATES[Math.floor(t / 16) % FACE_STATES.length]!);
      engine.step(16);
      if (engine.state !== last) changes += 1;
      last = engine.state;
    }
    expect(changes).toBeLessThanOrEqual(3000 / Math.min(...Object.values(MIN_HOLD_MS)));
    expect(changes).toBeGreaterThan(1);
  });

  it("asking for the current state cancels a waiting change", () => {
    const engine = new FaceEngine();
    engine.setState("happy");
    engine.setState("error");
    engine.setState("happy");
    run(engine, 2000);
    expect(engine.state).toBe("happy");
  });
});

describe("ambient life", () => {
  it("blinks every few seconds, and fully", () => {
    const seen = sample(new FaceEngine({ seed: 5 }), 30000, (p) => p.eyeOpen, 8);
    let blinks = 0;
    for (let i = 1; i < seen.length; i++) if (seen[i]! < 0.2 && seen[i - 1]! >= 0.2) blinks += 1;
    expect(blinks).toBeGreaterThanOrEqual(4);
    expect(blinks).toBeLessThanOrEqual(14);
  });

  it("doesn't blink while asleep or in error", () => {
    for (const state of ["sleeping", "error"] as const) {
      const engine = new FaceEngine({ seed: 5, state });
      const seen = sample(engine, 20000, (p) => p.eyeOpen);
      expect(Math.max(...seen) - Math.min(...seen)).toBeLessThan(0.01);
    }
  });

  it("makes up speech while speaking, and stops after", () => {
    const engine = new FaceEngine({ seed: 5 });
    engine.setState("speaking");
    const talking = sample(engine, 3000, (p) => p.mouthOpen);
    expect(Math.max(...talking) - Math.min(...talking)).toBeGreaterThan(0.3);
    engine.setState("idle");
    run(engine, 1500);
    expect(engine.pose().mouthOpen).toBeCloseTo(0, 2);
  });

  it("is never at rest while ambient", () => {
    const engine = new FaceEngine();
    run(engine, 10000);
    expect(engine.atRest).toBe(false);
  });

  it("comes to rest once ambient is off", () => {
    const engine = new FaceEngine({ seed: 2 });
    run(engine, 3000);
    engine.setAmbient(false);
    run(engine, 5000);
    expect(engine.atRest).toBe(true);
    const before = engine.pose();
    run(engine, 5000);
    expect(engine.pose().eyeOpen).toBeCloseTo(before.eyeOpen, 3);
    expect(engine.pose().squash).toBeCloseTo(before.squash, 3);
  });
});

describe("amplitude", () => {
  it("drives the mouth while speaking", () => {
    const engine = new FaceEngine({ state: "speaking" });
    engine.setAmplitude(0.9);
    run(engine, 1000);
    expect(engine.pose().mouthOpen).toBeCloseTo(0.9, 2);
    engine.setAmplitude(0);
    run(engine, 1000);
    expect(engine.pose().mouthOpen).toBeCloseTo(0, 2);
  });

  it("is ignored in other states, and clamps bad input", () => {
    const engine = new FaceEngine({ state: "idle" });
    engine.setAmplitude(5);
    run(engine, 1000);
    expect(engine.pose().mouthOpen).toBeCloseTo(0, 2);
    engine.setState("speaking");
    run(engine, 1000);
    expect(engine.pose().mouthOpen).toBeCloseTo(1, 2);
    engine.setAmplitude(Number.NaN);
    run(engine, 1000);
    expect(engine.pose().mouthOpen).toBeCloseTo(0, 2);
  });
});

describe("gestures", () => {
  it("a spin turns all the way round and finishes at zero", () => {
    const engine = new FaceEngine({ ambient: false });
    engine.playGesture("spin");
    const seen = sample(engine, 1000, (p) => p.spin);
    expect(Math.max(...seen)).toBeGreaterThan(350);
    expect(engine.pose().spin).toBe(0);
  });

  it("a hop lifts the face and lands", () => {
    const engine = new FaceEngine({ ambient: false });
    engine.playGesture("hop");
    expect(Math.max(...sample(engine, 700, (p) => p.lift))).toBeGreaterThan(8);
    expect(engine.pose().lift).toBeCloseTo(0, 5);
    expect(engine.atRest).toBe(true);
  });

  it("a nod moves the gaze and returns", () => {
    const engine = new FaceEngine({ ambient: false });
    engine.playGesture("nod");
    const seen = sample(engine, 700, (p) => p.gazeY);
    expect(Math.min(...seen)).toBeLessThan(-0.2);
    expect(engine.pose().gazeY).toBeCloseTo(0, 5);
  });

  it("a wave raises one hand, moves it, and puts it back", () => {
    const engine = new FaceEngine({ ambient: false });
    const rest = engine.pose().handRight;
    engine.playGesture("wave");
    const seen = sample(engine, 1400, (p) => p.handRight);
    expect(Math.max(...seen)).toBeGreaterThan(0.9);
    expect(engine.pose().handRight).toBeCloseTo(rest, 3);
    expect(engine.pose().handLeft).toBeCloseTo(rest, 3);
  });

  it("keeps the face awake until it ends", () => {
    const engine = new FaceEngine({ ambient: false });
    engine.playGesture("spin");
    expect(engine.atRest).toBe(false);
  });
});

describe("reduced motion", () => {
  it("cuts straight to each state, with nothing moving", () => {
    const engine = new FaceEngine({ motion: "reduced" });
    engine.setState("happy");
    expect(engine.pose().eyeSmile).toBe(1);
    expect(engine.atRest).toBe(true);
    const seen = sample(engine, 10000, (p) => p.eyeOpen + p.squash + p.gazeX);
    expect(Math.max(...seen) - Math.min(...seen)).toBe(0);
  });

  it("still keeps the minimum hold", () => {
    const engine = new FaceEngine({ motion: "reduced" });
    engine.setState("happy");
    engine.setState("error");
    expect(engine.pose().eyeCross).toBe(0);
    run(engine, MIN_HOLD_MS.happy + 50);
    expect(engine.pose().eyeCross).toBe(1);
  });

  it("refuses gestures, and ends one already playing", () => {
    const engine = new FaceEngine({ ambient: false });
    engine.playGesture("spin");
    run(engine, 200);
    engine.setMotion("reduced");
    expect(engine.pose().spin).toBe(0);
    expect(engine.playGesture("hop")).toBe(false);
  });
});

describe("time", () => {
  it.each([0, -5, Number.NaN])("ignores a step of %s", (dt) => {
    const engine = new FaceEngine({ seed: 1 });
    const before = engine.pose();
    engine.step(dt);
    expect(engine.pose()).toEqual(before);
  });

  it("survives a huge step when a tab wakes up", () => {
    const engine = new FaceEngine();
    engine.setState("surprised");
    engine.step(3_600_000);
    expect(Number.isFinite(engine.pose().eyeOpen)).toBe(true);
    expect(engine.pose().eyeOpen).toBeLessThan(1.7);
  });
});
