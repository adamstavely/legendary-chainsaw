import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, type HTMLAttributes } from "react";
import type { AgentFace as AgentFaceElement } from "../element";
import type { FaceMotion, FaceState } from "../engine";

// The element needs a browser, so it loads after the page does and this file stays safe to server-render
const ready = typeof window === "undefined" ? null : import("../element");

export interface AgentFaceProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  state?: FaceState;
  /** Width and height in pixels, 16 to 256 */
  size?: number;
  /** Who the screen-reader label names. Default Donovan */
  name?: string;
  /** Replaces the screen-reader label in every state */
  label?: string;
  /** Screen-reader labels per state, for translation */
  labels?: Partial<Record<FaceState, string>>;
  /** Also tells screen readers when the state changes */
  announce?: boolean;
  /** Default follows the system setting */
  motion?: FaceMotion;
  /** How long, in ms, before the small movements fade out when Donovan isn't busy */
  restAfter?: number;
  /** Makes the small movements repeatable */
  seed?: number;
  /** How loud the agent is, 0 to 1, to drive the mouth while speaking */
  amplitude?: number | null;
}

/** The ref is the element itself, so `ref.current.playGesture("nod")` works */
export const AgentFace = forwardRef<AgentFaceElement, AgentFaceProps>(function AgentFace(
  { state = "idle", size, name, label, labels, announce, motion, restAfter, seed, amplitude = null, className, ...rest },
  ref,
) {
  const inner = useRef<AgentFaceElement>(null);
  useImperativeHandle(ref, () => inner.current as AgentFaceElement);

  useEffect(() => {
    let live = true;
    void ready?.then(() => {
      if (live && inner.current) inner.current.amplitude = amplitude;
    });
    return () => {
      live = false;
    };
  }, [amplitude]);

  useEffect(() => {
    let live = true;
    void ready?.then(() => {
      if (live && inner.current) inner.current.labels = labels ?? {};
    });
    return () => {
      live = false;
    };
  }, [labels]);

  return createElement("agent-face", {
    ...rest,
    ref: inner,
    class: className,
    state,
    size,
    name,
    label,
    motion,
    seed,
    announce: announce ? "" : undefined,
    "rest-after": restAfter,
  });
});
